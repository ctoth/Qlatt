import { parseDslSpec } from "./parser";
import { runRuleEngine } from "./engine";
import { validateDslSpec } from "./validation";

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}

function getByPath(obj, path) {
  if (!obj || typeof path !== "string" || path.length === 0) return undefined;
  return path.split(".").reduce((acc, key) => (acc == null ? undefined : acc[key]), obj);
}

function selectToken(sequence, selector) {
  if (!Array.isArray(sequence) || typeof selector !== "string" || selector.length === 0) {
    return null;
  }
  if (selector.includes(":")) {
    const [stream, indexRaw] = selector.split(":");
    const index = Number(indexRaw);
    if (!stream || !Number.isInteger(index) || index < 0) return null;
    const inStream = sequence.filter((token) => token?.stream === stream);
    return inStream[index] ?? null;
  }
  return sequence.find((token) => token?.id === selector) ?? null;
}

function tokenKey(token, index) {
  if (typeof token?.id === "string" && token.id.length > 0) return token.id;
  return `${token?.stream ?? "token"}#${index}`;
}

function normalizePhaseName(name, phaseNames) {
  if (name === "init") return "init";
  if (name === "final") return "final";
  if (phaseNames.includes(name)) return name;
  return null;
}

export function buildPhaseSnapshots(sequence, specSource, options = {}) {
  const spec = parseDslSpec(specSource);
  const phaseNames = spec.phases.map((phase) => phase.name);
  const snapshots = new Map();
  snapshots.set("init", cloneJson(sequence));
  let finalResult = {
    sequence: cloneJson(sequence),
    diagnostics: validateDslSpec(spec),
    trace: [],
    axis: null,
  };

  for (let i = 0; i < phaseNames.length; i += 1) {
    const phases = phaseNames.slice(0, i + 1);
    const result = runRuleEngine(sequence, spec, {
      phases,
      parameters: options.parameters ?? {},
    });
    snapshots.set(phaseNames[i], cloneJson(result.sequence));
    snapshots.set("final", cloneJson(result.sequence));
    finalResult = result;
  }

  if (!snapshots.has("final")) {
    snapshots.set("final", cloneJson(sequence));
  }

  return {
    spec,
    phaseNames,
    snapshots,
    finalResult,
  };
}

export function explainField(snapshotsModel, selector, field, phase = "final") {
  const normalizedPhase = normalizePhaseName(phase, snapshotsModel.phaseNames);
  if (!normalizedPhase) {
    throw new Error(`Unknown phase '${phase}'`);
  }
  const currentSequence = snapshotsModel.snapshots.get(normalizedPhase) ?? [];
  const token = selectToken(currentSequence, selector);
  if (!token) {
    throw new Error(`Token selector '${selector}' not found at phase '${normalizedPhase}'`);
  }
  const tokenId = token?.id ?? null;
  const currentValue = getByPath(token, field);

  const changes = [];
  let previousValue = undefined;
  const phasesToScan = ["init", ...snapshotsModel.phaseNames];
  for (const phaseName of phasesToScan) {
    const seq = snapshotsModel.snapshots.get(phaseName) ?? [];
    const phaseToken =
      tokenId != null
        ? seq.find((candidate) => candidate?.id === tokenId) ?? null
        : selectToken(seq, selector);
    const nextValue = getByPath(phaseToken, field);
    if (phaseName === "init") {
      previousValue = nextValue;
      continue;
    }
    if (nextValue !== previousValue) {
      changes.push({
        phase: phaseName,
        before: previousValue,
        after: nextValue,
      });
      previousValue = nextValue;
    }
  }

  return {
    token: tokenId ?? selector,
    selector,
    field,
    phase: normalizedPhase,
    value: currentValue,
    changes,
  };
}

export function whyNotRule(sequence, specSource, selector, ruleName, phase = null) {
  const spec = parseDslSpec(specSource);
  const result = runRuleEngine(sequence, spec);
  const token = selectToken(result.sequence, selector);
  const tokenId = token?.id ?? null;
  const containingPhase =
    phase ??
    spec.phases.find((candidate) => Array.isArray(candidate.rules) && candidate.rules.includes(ruleName))
      ?.name ??
    null;

  const matches = result.trace.filter(
    (event) =>
      event.type === "match" &&
      event.rule === ruleName &&
      (containingPhase == null || event.phase === containingPhase)
  );
  const fired = matches.some((event) => {
    if (!tokenId) return false;
    if (event.token === tokenId) return true;
    const captures = event.captures && typeof event.captures === "object" ? Object.values(event.captures) : [];
    return captures.includes(tokenId);
  });

  return {
    rule: ruleName,
    selector,
    token: tokenId,
    phase: containingPhase,
    fired,
    reason: fired ? null : "No matching trace event recorded for rule/token",
    matchCount: matches.length,
  };
}

export function diffPhaseState(snapshotsModel, fromPhase, toPhase, stream = null) {
  const fromName = normalizePhaseName(fromPhase, snapshotsModel.phaseNames);
  const toName = normalizePhaseName(toPhase, snapshotsModel.phaseNames);
  if (!fromName) throw new Error(`Unknown from-phase '${fromPhase}'`);
  if (!toName) throw new Error(`Unknown to-phase '${toPhase}'`);

  const fromSeq = (snapshotsModel.snapshots.get(fromName) ?? []).filter(
    (token) => !stream || token?.stream === stream
  );
  const toSeq = (snapshotsModel.snapshots.get(toName) ?? []).filter(
    (token) => !stream || token?.stream === stream
  );

  const fromMap = new Map(fromSeq.map((token, index) => [tokenKey(token, index), token]));
  const toMap = new Map(toSeq.map((token, index) => [tokenKey(token, index), token]));

  const added = [];
  const removed = [];
  const modified = [];

  for (const [key, token] of toMap.entries()) {
    if (!fromMap.has(key)) {
      added.push({ key, token });
      continue;
    }
    const before = fromMap.get(key);
    if (JSON.stringify(before) !== JSON.stringify(token)) {
      modified.push({ key, before, after: token });
    }
  }
  for (const [key, token] of fromMap.entries()) {
    if (!toMap.has(key)) {
      removed.push({ key, token });
    }
  }

  return {
    from: fromName,
    to: toName,
    stream: stream ?? null,
    added,
    removed,
    modified,
  };
}
