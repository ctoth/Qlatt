import { parseDslSpec } from "./parser";
import { runRuleEngine } from "./engine";
import type { InventoryResolver } from "./engine";
import { validateDslSpec } from "./validation";

type TokenLike = Record<string, any>;

type PhaseSnapshotsModel = {
  spec: any;
  phaseNames: string[];
  snapshots: Map<string, TokenLike[]>;
  finalResult: any;
};

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function getByPath(obj: TokenLike | null | undefined, path: string): any {
  if (!obj || typeof path !== "string" || path.length === 0) return undefined;
  return path.split(".").reduce<any>((acc, key) => (acc == null ? undefined : acc[key]), obj);
}

function selectToken(sequence: TokenLike[], selector: string): TokenLike | null {
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

function tokenKey(token: TokenLike, index: number): string {
  if (typeof token?.id === "string" && token.id.length > 0) return token.id;
  return `${String(token?.stream ?? "token")}#${index}`;
}

function normalizePhaseName(name: string, phaseNames: string[]): string | null {
  if (name === "init") return "init";
  if (name === "final") return "final";
  if (phaseNames.includes(name)) return name;
  return null;
}

export function buildPhaseSnapshots(
  sequence: TokenLike[],
  specSource: unknown,
  options: { parameters?: Record<string, unknown>; inventoryResolver?: InventoryResolver } = {}
): PhaseSnapshotsModel {
  const spec = parseDslSpec(specSource);
  const phaseNames = spec.phases.map((phase: any) => phase.name as string);
  const snapshots = new Map<string, TokenLike[]>();
  snapshots.set("init", cloneJson(sequence));
  let finalResult: any = {
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
      inventoryResolver: options.inventoryResolver,
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

export function explainField(
  snapshotsModel: PhaseSnapshotsModel,
  selector: string,
  field: string,
  phase: string = "final"
) {
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

  const changes: Array<{ phase: string; before: any; after: any }> = [];
  let previousValue: any = undefined;
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

export function whyNotRule(
  sequence: TokenLike[],
  specSource: unknown,
  selector: string,
  ruleName: string,
  phase: string | null = null,
  options: { inventoryResolver?: InventoryResolver } = {}
) {
  const spec = parseDslSpec(specSource);
  const result = runRuleEngine(sequence, spec, {
    inventoryResolver: options.inventoryResolver,
  });
  const token = selectToken(result.sequence, selector);
  const tokenId = token?.id ?? null;
  const containingPhase =
    phase ??
    spec.phases.find(
      (candidate: any) => Array.isArray(candidate.rules) && candidate.rules.includes(ruleName)
    )?.name ??
    null;

  const matches = result.trace.filter(
    (event: any) =>
      event.type === "match" &&
      event.rule === ruleName &&
      (containingPhase == null || event.phase === containingPhase)
  );
  const fired = matches.some((event: any) => {
    if (!tokenId) return false;
    if (event.token === tokenId) return true;
    const captures =
      event.captures && typeof event.captures === "object" ? Object.values(event.captures) : [];
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

export function diffPhaseState(
  snapshotsModel: PhaseSnapshotsModel,
  fromPhase: string,
  toPhase: string,
  stream: string | null = null
) {
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

  const fromMap = new Map<string, TokenLike>(fromSeq.map((token, index) => [tokenKey(token, index), token]));
  const toMap = new Map<string, TokenLike>(toSeq.map((token, index) => [tokenKey(token, index), token]));

  const added: Array<{ key: string; token: TokenLike }> = [];
  const removed: Array<{ key: string; token: TokenLike }> = [];
  const modified: Array<{ key: string; before: TokenLike | undefined; after: TokenLike }> = [];

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
