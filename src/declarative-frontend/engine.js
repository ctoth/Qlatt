import { PHONEME_TARGETS } from "../tts-frontend-rules.js";
import { parseDslSpec } from "./parser.js";
import { assertValidSpec } from "./validation.js";
import { evaluateExpression } from "./expressions.js";
import {
  TokenStatus,
  isActiveToken,
  joinTokenStatus,
  normalizeTokenStatus,
} from "./model.js";

function cloneSequence(sequence) {
  return sequence.map((token) => ({
    ...token,
    status: normalizeTokenStatus(token?.status),
  }));
}

function applyDurationScale(token, scale) {
  if (!token || !Number.isFinite(scale)) return;
  const di = Number.isFinite(token.duration) ? token.duration : 0;
  if (di <= 0) return;
  const dinh = Number.isFinite(token.inherentDuration) ? token.inherentDuration : di;
  const dmin = getIncompressibleMin(token, dinh);
  const df = scale * (di - dmin) + dmin;
  token.duration = Math.round(Math.max(dmin, df));
}

function applyDurationFloor(token) {
  if (!token || !Number.isFinite(token.duration)) return;
  const dinh = Number.isFinite(token.inherentDuration) ? token.inherentDuration : token.duration;
  const dmin = getIncompressibleMin(token, dinh);
  token.duration = Math.round(Math.max(dmin, token.duration));
}

function getIncompressibleMin(token, inherent) {
  if (!Number.isFinite(inherent) || inherent <= 0) return 0;
  const ratio = token?.type === "vowel" ? 0.42 : 0.6;
  return inherent * ratio;
}

function ruleInsertStopReleases(sequence) {
  const nextSequence = [];
  const releaseMap = {
    P_CL: "P_REL",
    T_CL: "T_REL",
    K_CL: "K_REL",
    B_CL: "B_REL",
    D_CL: "D_REL",
    G_CL: "G_REL",
  };
  const aspirationMap = {
    P_REL: "P_ASP",
    T_REL: "T_ASP",
    K_REL: "K_ASP",
  };

  function findNextActive(startIndex) {
    for (let i = startIndex; i < sequence.length; i += 1) {
      if (isActiveToken(sequence[i])) return sequence[i];
    }
    return null;
  }

  for (let i = 0; i < sequence.length; i += 1) {
    const current = sequence[i];
    nextSequence.push(current);
    if (!isActiveToken(current)) continue;

    const releasePhoneme = releaseMap[current.phoneme];
    if (!releasePhoneme) continue;

    let addRelease = true;
    const next = findNextActive(i + 1);
    if (next) {
      const nextTarget =
        PHONEME_TARGETS[next.phoneme + "1"] ||
        PHONEME_TARGETS[next.phoneme + "0"] ||
        PHONEME_TARGETS[next.phoneme];

      if (next.phoneme === "SIL" || nextTarget?.type?.includes("stop")) {
        addRelease = false;
      }
    }

    if (addRelease) {
      nextSequence.push({
        phoneme: releasePhoneme,
        stress: current.stress,
        status: TokenStatus.ACTIVE,
      });
      const aspiration = aspirationMap[releasePhoneme];
      if (aspiration) {
        nextSequence.push({
          phoneme: aspiration,
          stress: current.stress,
          status: TokenStatus.ACTIVE,
        });
      }
      continue;
    }

    if (next?.phoneme === "SIL") {
      nextSequence.push({
        phoneme: releasePhoneme,
        stress: current.stress,
        weak: true,
        status: TokenStatus.ACTIVE,
      });
      const aspiration = aspirationMap[releasePhoneme];
      if (aspiration) {
        nextSequence.push({
          phoneme: aspiration,
          stress: current.stress,
          weak: true,
          status: TokenStatus.ACTIVE,
        });
      }
    }
  }

  return nextSequence;
}

function ruleStressDuration(sequence) {
  const STRESS_FACTOR = 1.3;
  const UNSTRESSED_FACTOR = 0.8;

  for (const token of sequence) {
    if (!isActiveToken(token)) continue;
    if (token.type === "vowel") {
      if (token.stress === 1) applyDurationScale(token, STRESS_FACTOR);
      else if (token.stress === 0) applyDurationScale(token, UNSTRESSED_FACTOR);
    }
    applyDurationFloor(token);
  }
  return sequence;
}

function ruleVowelShortening(sequence) {
  const SHORTENING_FACTOR = 0.7;
  const FRIC_SHORTENING = 0.85;
  const PREPAUSAL_LENGTHENING = 1.2;
  const active = sequence.filter(isActiveToken);

  for (let i = 0; i < active.length; i += 1) {
    const current = active[i];
    if (!current || current.type !== "vowel") continue;
    const next = active[i + 1];
    if (!next) {
      applyDurationScale(current, PREPAUSAL_LENGTHENING);
      continue;
    }

    const nextTarget =
      PHONEME_TARGETS[next.phoneme + "1"] ||
      PHONEME_TARGETS[next.phoneme + "0"] ||
      PHONEME_TARGETS[next.phoneme];

    if (!nextTarget) continue;
    if (nextTarget.type?.includes("stop") && nextTarget.voiceless) {
      applyDurationScale(current, SHORTENING_FACTOR);
    } else if (nextTarget.type === "fricative" && nextTarget.voiceless) {
      applyDurationScale(current, FRIC_SHORTENING);
    } else if (next.phoneme === "SIL") {
      applyDurationScale(current, PREPAUSAL_LENGTHENING);
    }
  }
  return sequence;
}

function rulePreBoundaryLengthening(sequence) {
  const PHRASE_FINAL_FACTOR = 1.4;
  const WORD_FINAL_FACTOR = 1.1;
  const active = sequence.filter(isActiveToken);

  for (let i = 0; i < active.length; i += 1) {
    const current = active[i];
    const next = active[i + 1];

    if (current.phoneme === "SIL") continue;

    const isBeforePhraseBreak = next?.phoneme === "SIL" && next?.punctuationSymbol;
    if (isBeforePhraseBreak || (!next && current.phoneme !== "SIL")) {
      applyDurationScale(current, PHRASE_FINAL_FACTOR);
      continue;
    }

    if (next && current.word && next.word && current.word !== next.word && next.phoneme !== "SIL") {
      applyDurationScale(current, WORD_FINAL_FACTOR);
    }
  }

  return sequence;
}

function getTokenStream(token) {
  return token?.stream ?? "phone";
}

function compareOrderValue(left, right) {
  if (left === right) return 0;
  if (typeof left === "number" && typeof right === "number") {
    return left < right ? -1 : 1;
  }
  const a = left == null ? "" : String(left);
  const b = right == null ? "" : String(right);
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

function comparePointTokenOrder(left, right) {
  const leftTime = Number.isFinite(left?.time) ? Number(left.time) : null;
  const rightTime = Number.isFinite(right?.time) ? Number(right.time) : null;
  if (leftTime != null && rightTime != null && leftTime !== rightTime) {
    return leftTime < rightTime ? -1 : 1;
  }
  const byLeft = compareOrderValue(left?.anchor_left, right?.anchor_left);
  if (byLeft !== 0) return byLeft;
  const byRight = compareOrderValue(left?.anchor_right, right?.anchor_right);
  if (byRight !== 0) return byRight;
  const leftRatio = Number.isFinite(left?.ratio) ? Number(left.ratio) : 0;
  const rightRatio = Number.isFinite(right?.ratio) ? Number(right.ratio) : 0;
  if (leftRatio !== rightRatio) return leftRatio < rightRatio ? -1 : 1;
  return compareOrderValue(left?.id ?? "", right?.id ?? "");
}

function getTokenBounds(token) {
  if (token && token.sync_left != null && token.sync_right != null) {
    return { left: token.sync_left, right: token.sync_right };
  }
  if (token && token.anchor_left != null && token.anchor_right != null) {
    return { left: token.anchor_left, right: token.anchor_right };
  }
  return null;
}

function clampRatio(value) {
  if (!Number.isFinite(value)) return 0;
  if (value <= 0) return 0;
  if (value >= 1) return 1;
  return Number(value);
}

function normalizeAnchor(anchor, fallbackToken = null) {
  const source =
    anchor && typeof anchor === "object" && !Array.isArray(anchor) ? anchor : {};

  let anchorLeft = source.anchor_left ?? source.left ?? source.sync_left ?? null;
  let anchorRight = source.anchor_right ?? source.right ?? source.sync_right ?? null;

  if (fallbackToken && fallbackToken.sync_left != null && anchorLeft == null) {
    anchorLeft = fallbackToken.sync_left;
  }
  if (fallbackToken && fallbackToken.sync_right != null && anchorRight == null) {
    anchorRight = fallbackToken.sync_right;
  }

  if (anchorLeft == null || anchorRight == null) {
    throw new Error("Point anchor is missing anchor_left/anchor_right");
  }

  let ratio = source.ratio;
  if (!Number.isFinite(ratio)) {
    ratio = anchorLeft === anchorRight ? 0 : 0.5;
  }
  ratio = clampRatio(ratio);
  if (anchorLeft === anchorRight) ratio = 0;

  return {
    anchor_left: anchorLeft,
    anchor_right: anchorRight,
    ratio,
  };
}

function normalizeAssociationEntries(raw) {
  const source = Array.isArray(raw) ? raw : raw instanceof Set ? [...raw] : [];
  const entries = [];
  for (const item of source) {
    if (typeof item === "string") {
      entries.push({ to: item, status: TokenStatus.ACTIVE });
      continue;
    }
    if (item && typeof item === "object" && typeof item.to === "string") {
      entries.push({ to: item.to, status: normalizeTokenStatus(item.status) });
    }
  }
  return entries;
}

function getAssociationEntries(token, assocName) {
  if (!token || typeof assocName !== "string" || assocName.length === 0) return [];
  if (!token.associations || typeof token.associations !== "object") {
    token.associations = {};
  }
  const entries = normalizeAssociationEntries(token.associations[assocName]);
  token.associations[assocName] = entries;
  return entries;
}

function upsertAssociationEdge(fromToken, assocName, toId, status) {
  if (!fromToken || typeof toId !== "string") return;
  const entries = getAssociationEntries(fromToken, assocName);
  const edge = entries.find((entry) => entry.to === toId);
  if (!edge) {
    entries.push({ to: toId, status: normalizeTokenStatus(status) });
    return;
  }
  edge.status = joinTokenStatus(edge.status, status);
}

function buildNavigationFunctions(sequence, runtime = null, options = {}) {
  const currentToken = options.currentToken ?? null;
  const pointCursorByStream =
    options.pointCursorByStream instanceof Map ? options.pointCursorByStream : null;
  const cache = new Map();
  const activeById = new Map();
  const ensureActiveIdIndex = () => {
    if (activeById.size > 0) return;
    for (const candidate of sequence) {
      if (!isActiveToken(candidate)) continue;
      if (candidate?.id != null && !activeById.has(candidate.id)) {
        activeById.set(candidate.id, candidate);
      }
    }
  };

  const getActiveStreamTokens = (stream) => {
    const key = stream || "phone";
    if (cache.has(key)) return cache.get(key);
    let active = sequence.filter(
      (token) => isActiveToken(token) && getTokenStream(token) === key
    );
    if (runtime?.pointStreams?.has(key)) {
      active = active.slice().sort(comparePointTokenOrder);
    }
    cache.set(key, active);
    for (const token of active) {
      if (token?.id != null && !activeById.has(token.id)) {
        activeById.set(token.id, token);
      }
    }
    return active;
  };

  const getIndex = (token) => {
    const stream = getTokenStream(token);
    const active = getActiveStreamTokens(stream);
    return active.indexOf(token);
  };

  const getPointCursor = (stream) => {
    if (pointCursorByStream?.has(stream)) {
      return pointCursorByStream.get(stream);
    }
    if (
      currentToken &&
      isActiveToken(currentToken) &&
      runtime?.pointStreams?.has(stream) &&
      getTokenStream(currentToken) === stream
    ) {
      return getActiveStreamTokens(stream).indexOf(currentToken);
    }
    return -1;
  };

  return {
    prev: (token) => {
      const stream = getTokenStream(token);
      const active = getActiveStreamTokens(stream);
      const index = active.indexOf(token);
      if (index <= 0) return null;
      return active[index - 1];
    },
    next: (token) => {
      const stream = getTokenStream(token);
      const active = getActiveStreamTokens(stream);
      const index = active.indexOf(token);
      if (index < 0 || index + 1 >= active.length) return null;
      return active[index + 1];
    },
    index: (token) => getIndex(token),
    total: (stream) => getActiveStreamTokens(stream).length,
    parent: (token, stream) => {
      if (!token || token.parent == null) return null;
      // Build ID index lazily for all active streams referenced so far.
      if (!activeById.has(token.parent)) ensureActiveIdIndex();
      const parent = activeById.get(token.parent) ?? null;
      if (!parent) return null;
      if (stream && getTokenStream(parent) !== stream) return null;
      return parent;
    },
    children: (token, stream) => {
      if (!token || token.id == null) return [];
      return sequence.filter((candidate) => {
        if (!isActiveToken(candidate)) return false;
        if (candidate?.parent !== token.id) return false;
        if (stream && getTokenStream(candidate) !== stream) return false;
        return true;
      });
    },
    assoc: (token, assocName) => {
      if (!token || typeof assocName !== "string" || assocName.length === 0) return [];
      ensureActiveIdIndex();

      const entries = getAssociationEntries(token, assocName);
      return entries
        .filter((entry) => normalizeTokenStatus(entry.status) === TokenStatus.ACTIVE)
        .map((entry) => activeById.get(entry.to))
        .filter((candidate) => candidate != null);
    },
    spanning: (token, stream) => {
      if (!token || typeof stream !== "string" || stream.length === 0) return [];
      const target = getTokenBounds(token);
      if (!target) return [];
      return getActiveStreamTokens(stream)
        .filter((candidate) => {
          if (!candidate || candidate.sync_left == null || candidate.sync_right == null) return false;
          return (
            compareOrderValue(candidate.sync_left, target.left) <= 0 &&
            compareOrderValue(candidate.sync_right, target.right) >= 0
          );
        })
        .sort((left, right) => {
          const byLeft = compareOrderValue(left.sync_left, right.sync_left);
          if (byLeft !== 0) return byLeft;
          const byRight = compareOrderValue(left.sync_right, right.sync_right);
          if (byRight !== 0) return byRight;
          return compareOrderValue(left.id ?? "", right.id ?? "");
        });
    },
    midpoint: (token) => {
      const bounds = getTokenBounds(token);
      if (!bounds) return null;
      return normalizeAnchor(
        { anchor_left: bounds.left, anchor_right: bounds.right, ratio: 0.5 },
        token
      );
    },
    at_ratio: (token, ratio) => {
      const bounds = getTokenBounds(token);
      if (!bounds) return null;
      return normalizeAnchor(
        {
          anchor_left: bounds.left,
          anchor_right: bounds.right,
          ratio: clampRatio(Number(ratio)),
        },
        token
      );
    },
    at_sync: (syncMark) =>
      normalizeAnchor({ anchor_left: syncMark, anchor_right: syncMark, ratio: 0 }),
    prev_point: (stream) => {
      const streamName = typeof stream === "string" && stream.length > 0 ? stream : null;
      if (!streamName || !runtime?.pointStreams?.has(streamName)) return null;
      const points = getActiveStreamTokens(streamName);
      const cursor = getPointCursor(streamName);
      const index = cursor >= 0 ? cursor - 1 : points.length - 1;
      if (index < 0 || index >= points.length) return null;
      return points[index];
    },
    next_point: (stream) => {
      const streamName = typeof stream === "string" && stream.length > 0 ? stream : null;
      if (!streamName || !runtime?.pointStreams?.has(streamName)) return null;
      const points = getActiveStreamTokens(streamName);
      const cursor = getPointCursor(streamName);
      const index = cursor >= 0 ? cursor + 1 : 0;
      if (index < 0 || index >= points.length) return null;
      return points[index];
    },
  };
}

function evaluateSelectWhere(whereExpr, token, params, functions) {
  if (!whereExpr || whereExpr === "true") return true;
  const result = evaluateExpression(
    whereExpr,
    { current: token, params: params ?? {} },
    functions
  );
  return Boolean(result);
}

function evaluateValueExpression(expr, token, params, functions, extraContext = null) {
  if (typeof expr === "number") return expr;
  if (typeof expr !== "string") {
    throw new Error(`Unsupported value expression type: ${typeof expr}`);
  }
  const context = {
    current: token,
    params: params ?? {},
    ...(extraContext ?? {}),
  };
  const value = evaluateExpression(
    expr,
    context,
    functions
  );
  if (!Number.isFinite(value)) {
    throw new Error(`Expression '${expr}' did not evaluate to a finite number`);
  }
  return Number(value);
}

function applyEffectToToken(effect, token, params, functions, extraContext = null) {
  if (!effect || typeof effect !== "object") return;
  const field = effect.field;
  if (!field) return;

  const current = Number.isFinite(token[field]) ? token[field] : 0;
  const value = evaluateValueExpression(effect.value, token, params, functions, extraContext);

  switch (effect.op) {
    case "set":
      token[field] = value;
      break;
    case "add":
      token[field] = current + value;
      break;
    case "mul":
      token[field] = current * value;
      break;
    default:
      throw new Error(`Unsupported effect op '${effect.op}' in slice engine`);
  }
}

function applyEffectsToTargets(
  rule,
  resolveTarget,
  params,
  functions,
  defaultTargetName = "current",
  extraContext = null
) {
  const effects = Array.isArray(rule.apply) ? rule.apply : [];
  for (const effect of effects) {
    const targetName = effect?.target ?? defaultTargetName;
    const target = resolveTarget(targetName);
    if (!target) {
      throw new Error(`Unknown effect target '${targetName}' in slice engine`);
    }
    applyEffectToToken(effect, target, params, functions, extraContext);
  }
}

function applyAssociationSpecs(specs, resolveTarget, status) {
  if (!Array.isArray(specs)) return;
  for (const spec of specs) {
    if (!spec || typeof spec !== "object") continue;
    const fromName = spec.from ?? "current";
    const toName = spec.to ?? "current";
    const assocName = spec.assoc_name;
    if (typeof assocName !== "string" || assocName.length === 0) continue;

    const from = resolveTarget(fromName);
    const to = resolveTarget(toName);
    if (!from || !to || typeof to.id !== "string") continue;

    upsertAssociationEdge(from, assocName, to.id, status);
  }
}

function evaluateActionExpression(expr, context, functions) {
  if (typeof expr === "string") {
    return evaluateExpression(expr, context, functions);
  }
  return expr;
}

function deepEvaluateTemplate(value, context, functions) {
  if (typeof value === "string") {
    return evaluateExpression(value, context, functions);
  }
  if (Array.isArray(value)) {
    return value.map((item) => deepEvaluateTemplate(item, context, functions));
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        deepEvaluateTemplate(item, context, functions),
      ])
    );
  }
  return value;
}

function nextInsertedTokenId(runtime, stream) {
  const key = typeof stream === "string" && stream.length > 0 ? stream : "token";
  if (!runtime.insertCounters) runtime.insertCounters = new Map();
  const existing = runtime.insertCounters.get(key) ?? 0;
  let counter = existing;
  let candidate = `${key}_ins_${counter}`;
  while (runtime.usedTokenIds.has(candidate)) {
    counter += 1;
    candidate = `${key}_ins_${counter}`;
  }
  runtime.insertCounters.set(key, counter + 1);
  runtime.usedTokenIds.add(candidate);
  return candidate;
}

function withinClosedRange(token, left, right) {
  if (token?.sync_left == null || token?.sync_right == null) return false;
  return (
    compareOrderValue(left, token.sync_left) <= 0 &&
    compareOrderValue(token.sync_right, right) <= 0
  );
}

function splitRange(left, right, count) {
  if (count <= 0) return [];
  if (count === 1) return [{ left, right }];
  if (!(typeof left === "number" && typeof right === "number")) {
    throw new Error("Multi-token splice requires numeric boundaries in current runtime");
  }
  const step = (right - left) / count;
  const segments = [];
  for (let i = 0; i < count; i += 1) {
    segments.push({
      left: left + step * i,
      right: left + step * (i + 1),
    });
  }
  return segments;
}

function buildSpliceInsertions(insertSpecs, stream, bounds, context, runtime, functions) {
  const specs = Array.isArray(insertSpecs) ? insertSpecs : [];
  if (specs.length === 0) return [];
  const segments = splitRange(bounds.left, bounds.right, specs.length);
  return specs.map((spec, index) => {
    const template = spec && typeof spec === "object" ? spec : {};
    const evaluated = deepEvaluateTemplate(template, context, functions);
    const token = {
      ...evaluated,
      stream: evaluated.stream ?? stream,
      status: TokenStatus.ACTIVE,
      sync_left: segments[index].left,
      sync_right: segments[index].right,
    };
    if (typeof token.id !== "string" || token.id.length === 0) {
      token.id = nextInsertedTokenId(runtime, token.stream);
    } else {
      runtime.usedTokenIds.add(token.id);
    }
    return token;
  });
}

function findInsertionIndexForRange(sequence, stream, right, suppressedSet) {
  let minIndex = Number.POSITIVE_INFINITY;
  for (const token of suppressedSet) {
    const idx = sequence.indexOf(token);
    if (idx >= 0 && idx < minIndex) minIndex = idx;
  }
  if (Number.isFinite(minIndex)) return minIndex;

  for (let i = 0; i < sequence.length; i += 1) {
    const token = sequence[i];
    if (getTokenStream(token) !== stream) continue;
    if (token?.sync_left == null) continue;
    if (compareOrderValue(token.sync_left, right) >= 0) return i;
  }
  return sequence.length;
}

function computeBoundaryNeighbor(activeStreamTokens, boundary, direction) {
  let best = null;
  for (const token of activeStreamTokens) {
    for (const mark of [token.sync_left, token.sync_right]) {
      if (mark == null) continue;
      const cmp = compareOrderValue(mark, boundary);
      if (direction === "gt" && cmp > 0) {
        if (best == null || compareOrderValue(mark, best) < 0) best = mark;
      } else if (direction === "lt" && cmp < 0) {
        if (best == null || compareOrderValue(mark, best) > 0) best = mark;
      }
    }
  }
  return best;
}

function findInsertionIndexForBoundary(sequence, stream, boundary, side) {
  if (side === "before") {
    for (let i = 0; i < sequence.length; i += 1) {
      const token = sequence[i];
      if (getTokenStream(token) !== stream) continue;
      if (token?.sync_left == null) continue;
      if (compareOrderValue(token.sync_left, boundary) >= 0) return i;
    }
    return sequence.length;
  }

  for (let i = 0; i < sequence.length; i += 1) {
    const token = sequence[i];
    if (getTokenStream(token) !== stream) continue;
    if (token?.sync_left == null) continue;
    if (compareOrderValue(token.sync_left, boundary) >= 0) return i;
  }
  return sequence.length;
}

function applySpliceSpec(
  spliceSpec,
  resolveTarget,
  params,
  sequence,
  runtime,
  functions,
  defaultTargetName = "current",
  extraContext = null
) {
  if (!spliceSpec || typeof spliceSpec !== "object") return;
  const targetName = spliceSpec.target ?? defaultTargetName;
  const target = resolveTarget(targetName);
  if (!target) {
    throw new Error(`Unknown splice target '${targetName}' in slice engine`);
  }
  const stream = getTokenStream(target);
  const context = {
    current: target,
    params: params ?? {},
    ...(extraContext ?? {}),
  };
  const activeStreamTokens = sequence.filter(
    (token) => isActiveToken(token) && getTokenStream(token) === stream
  );

  if (spliceSpec.type === "replace_range") {
    const left = evaluateActionExpression(spliceSpec.range_left, context, functions);
    const right = evaluateActionExpression(spliceSpec.range_right, context, functions);
    if (left == null || right == null) {
      throw new Error("replace_range splice requires range_left and range_right");
    }

    const suppressedSet = new Set(
      activeStreamTokens.filter((token) => withinClosedRange(token, left, right))
    );
    const explicitSuppress = Array.isArray(spliceSpec.suppress) ? spliceSpec.suppress : [];
    for (const name of explicitSuppress) {
      const captured = resolveTarget(name);
      if (captured) suppressedSet.add(captured);
    }
    for (const token of suppressedSet) {
      token.status = joinTokenStatus(token.status, TokenStatus.SUPPRESSED);
    }

    const insertionIndex = findInsertionIndexForRange(
      sequence,
      stream,
      right,
      suppressedSet
    );
    const inserts = buildSpliceInsertions(
      spliceSpec.insert,
      stream,
      { left, right },
      context,
      runtime,
      functions
    );
    if (inserts.length > 0) {
      sequence.splice(insertionIndex, 0, ...inserts);
    }
    return;
  }

  if (spliceSpec.type === "insert_at_boundary") {
    const boundary = evaluateActionExpression(spliceSpec.boundary, context, functions);
    const side = spliceSpec.side === "before" ? "before" : "after";
    if (boundary == null) {
      throw new Error("insert_at_boundary splice requires boundary");
    }

    const left =
      side === "after"
        ? boundary
        : computeBoundaryNeighbor(activeStreamTokens, boundary, "lt") ?? boundary;
    const right =
      side === "after"
        ? computeBoundaryNeighbor(activeStreamTokens, boundary, "gt") ?? boundary
        : boundary;
    const insertionIndex = findInsertionIndexForBoundary(sequence, stream, boundary, side);
    const inserts = buildSpliceInsertions(
      spliceSpec.insert,
      stream,
      { left, right },
      context,
      runtime,
      functions
    );
    if (inserts.length > 0) {
      sequence.splice(insertionIndex, 0, ...inserts);
    }
    return;
  }

  throw new Error(`Unsupported splice type '${spliceSpec.type}' in slice engine`);
}

function nextPointId(runtime, stream) {
  const key = typeof stream === "string" && stream.length > 0 ? stream : "point";
  const existing = runtime.pointCounters.get(key) ?? 0;
  let counter = existing;
  let candidate = `${key}_pt_${counter}`;
  while (runtime.usedTokenIds.has(candidate)) {
    counter += 1;
    candidate = `${key}_pt_${counter}`;
  }
  runtime.pointCounters.set(key, counter + 1);
  runtime.usedTokenIds.add(candidate);
  return candidate;
}

function evaluateAnchorExpression(expr, token, params, functions) {
  if (typeof expr === "string") {
    const evaluated = evaluateExpression(
      expr,
      { current: token, params: params ?? {} },
      functions
    );
    return normalizeAnchor(evaluated, token);
  }
  if (expr && typeof expr === "object") {
    return normalizeAnchor(expr, token);
  }
  throw new Error(`Unsupported point anchor expression type: ${typeof expr}`);
}

function applyInsertPointSpec(
  pointSpec,
  resolveTarget,
  params,
  sequence,
  runtime,
  defaultTargetName = "current"
) {
  if (!pointSpec || typeof pointSpec !== "object") return;
  const stream = pointSpec.stream;
  if (typeof stream !== "string" || stream.length === 0) {
    throw new Error("insert_point.stream must be a non-empty string");
  }

  const targetName = pointSpec.target ?? defaultTargetName;
  const target = resolveTarget(targetName);
  if (!target) {
    throw new Error(`Unknown insert_point target '${targetName}' in slice engine`);
  }

  const activePointCount = sequence.filter(
    (token) => isActiveToken(token) && getTokenStream(token) === stream
  ).length;

  const pointFunctions = buildNavigationFunctions(sequence, runtime, {
    currentToken: target,
    pointCursorByStream: new Map([[stream, activePointCount]]),
  });
  const anchor = evaluateAnchorExpression(pointSpec.at, target, params, pointFunctions);
  const value =
    pointSpec.value == null
      ? null
      : evaluateValueExpression(pointSpec.value, target, params, pointFunctions);

  const pointToken = {
    id: nextPointId(runtime, stream),
    stream,
    status: TokenStatus.ACTIVE,
    anchor_left: anchor.anchor_left,
    anchor_right: anchor.anchor_right,
    ratio: anchor.ratio,
    value,
  };
  if (pointSpec.tag != null) {
    pointToken.tag = pointSpec.tag;
  }
  sequence.push(pointToken);
}

function applySelectRule(rule, sequence, runtime) {
  const select = rule.select ?? {};
  const stream = select.stream;
  const where = select.where ?? "true";
  const selected = [];
  const selectionFunctions = buildNavigationFunctions(sequence, runtime);

  for (const token of sequence) {
    if (!isActiveToken(token)) continue;
    if (stream && getTokenStream(token) !== stream) continue;
    if (!evaluateSelectWhere(where, token, runtime.params, selectionFunctions)) continue;
    selected.push(token);
  }

  for (const token of selected) {
    const extraContext = { current: token };
    const navigationFunctions = buildNavigationFunctions(sequence, runtime, {
      currentToken: token,
    });
    applyEffectsToTargets(
      rule,
      (targetName) => (targetName === "current" ? token : null),
      runtime.params,
      navigationFunctions,
      "current",
      extraContext
    );
    applyAssociationSpecs(rule.associate, (targetName) => (targetName === "current" ? token : null), TokenStatus.ACTIVE);
    applyAssociationSpecs(
      rule.disassociate,
      (targetName) => (targetName === "current" ? token : null),
      TokenStatus.SUPPRESSED
    );
    applySpliceSpec(
      rule.splice,
      (targetName) => (targetName === "current" ? token : null),
      runtime.params,
      sequence,
      runtime,
      navigationFunctions,
      "current",
      extraContext
    );
    applyInsertPointSpec(
      rule.insert_point,
      (targetName) => (targetName === "current" ? token : null),
      runtime.params,
      sequence,
      runtime
    );

    if (rule.suppress || rule.delete) {
      token.status = joinTokenStatus(token.status, TokenStatus.SUPPRESSED);
    }
  }

  return sequence;
}

function matchPatternFrom(activeTokens, startIndex, pattern, params, functions) {
  const captures = {};
  let cursor = startIndex;
  for (const step of pattern.sequence) {
    const token = activeTokens[cursor];
    if (!token) return null;
    if (!evaluateSelectWhere(step.where ?? "true", token, params, functions)) return null;
    captures[step.capture] = token;
    cursor += 1;
  }
  return captures;
}

function applyPatternRule(rule, sequence, runtime) {
  const pattern = runtime.patterns?.[rule.match];
  if (!pattern || !Array.isArray(pattern.sequence) || pattern.sequence.length === 0) {
    return sequence;
  }

  const active = sequence.filter(
    (token) => isActiveToken(token) && getTokenStream(token) === pattern.stream
  );
  const matches = [];
  const navigationFunctions = buildNavigationFunctions(sequence, runtime);

  for (let i = 0; i < active.length; i += 1) {
    const captures = matchPatternFrom(active, i, pattern, runtime.params, navigationFunctions);
    if (captures) matches.push(captures);
  }

  for (const captures of matches) {
    const captureNames = Object.keys(captures);
    const defaultTarget = captureNames[0] ?? "current";
    const currentToken = captures[defaultTarget] ?? null;
    const extraContext = { ...captures, current: currentToken };
    const captureFunctions = buildNavigationFunctions(sequence, runtime, { currentToken });
    applyEffectsToTargets(
      rule,
      (targetName) => captures[targetName] ?? null,
      runtime.params,
      captureFunctions,
      defaultTarget,
      extraContext
    );
    applyAssociationSpecs(rule.associate, (targetName) => captures[targetName] ?? null, TokenStatus.ACTIVE);
    applyAssociationSpecs(
      rule.disassociate,
      (targetName) => captures[targetName] ?? null,
      TokenStatus.SUPPRESSED
    );
    applySpliceSpec(
      rule.splice,
      (targetName) => captures[targetName] ?? null,
      runtime.params,
      sequence,
      runtime,
      captureFunctions,
      defaultTarget,
      extraContext
    );
    applyInsertPointSpec(
      rule.insert_point,
      (targetName) => captures[targetName] ?? null,
      runtime.params,
      sequence,
      runtime,
      defaultTarget
    );

    if (rule.suppress || rule.delete) {
      for (const token of Object.values(captures)) {
        token.status = joinTokenStatus(token.status, TokenStatus.SUPPRESSED);
      }
    }
  }

  return sequence;
}

function applyRule(rule, sequence, runtime) {
  if (rule.select) {
    return applySelectRule(rule, sequence, runtime);
  }
  if (rule.match) {
    return applyPatternRule(rule, sequence, runtime);
  }

  switch (rule.op) {
    case "insert_stop_releases":
      return ruleInsertStopReleases(sequence);
    case "stress_duration":
      return ruleStressDuration(sequence);
    case "vowel_shortening":
      return ruleVowelShortening(sequence);
    case "pre_boundary_lengthening":
      return rulePreBoundaryLengthening(sequence);
    default:
      throw new Error(`Unsupported declarative slice rule op '${rule.op}'`);
  }
}

function computeSyncTimes(sequence, runtime) {
  const markTimes = new Map();
  const activeBase = sequence
    .filter(
      (token) =>
        isActiveToken(token) &&
        runtime.baseStreams.has(getTokenStream(token)) &&
        token?.sync_left != null &&
        token?.sync_right != null
    )
    .slice()
    .sort((left, right) => {
      const byLeft = compareOrderValue(left.sync_left, right.sync_left);
      if (byLeft !== 0) return byLeft;
      const byRight = compareOrderValue(left.sync_right, right.sync_right);
      if (byRight !== 0) return byRight;
      return compareOrderValue(left.id ?? "", right.id ?? "");
    });

  let cursor = 0;
  for (const token of activeBase) {
    const left = token.sync_left;
    const right = token.sync_right;
    const existingLeft = markTimes.get(left);
    if (Number.isFinite(existingLeft)) {
      cursor = Number(existingLeft);
    } else {
      markTimes.set(left, cursor);
    }

    const duration = Number.isFinite(token.duration) ? Number(token.duration) : 0;
    const proposedRight = cursor + duration;
    const existingRight = markTimes.get(right);
    const rightTime = Number.isFinite(existingRight)
      ? Math.max(Number(existingRight), proposedRight)
      : proposedRight;
    markTimes.set(right, rightTime);
    cursor = rightTime;
  }

  runtime.markTimes = markTimes;
  return markTimes;
}

function resolvePointTimes(sequence, runtime, pointStreams) {
  const markTimes = runtime.markTimes instanceof Map ? runtime.markTimes : new Map();
  const selected =
    Array.isArray(pointStreams) && pointStreams.length > 0
      ? new Set(pointStreams)
      : runtime.pointStreams;

  for (const token of sequence) {
    if (!isActiveToken(token)) continue;
    const stream = getTokenStream(token);
    if (!selected.has(stream)) continue;
    if (token?.anchor_left == null || token?.anchor_right == null) continue;
    const left = markTimes.get(token.anchor_left);
    const right = markTimes.get(token.anchor_right);
    if (!Number.isFinite(left) || !Number.isFinite(right)) {
      token.time = null;
      continue;
    }
    const ratio = clampRatio(Number(token.ratio));
    token.time = Number(left) + ratio * (Number(right) - Number(left));
  }
}

export function runRuleEngine(sequence, specSource, options = {}) {
  const spec = parseDslSpec(specSource);
  const diagnostics = assertValidSpec(spec);
  let current = cloneSequence(sequence);

  const pointStreams = new Set(
    Object.entries(spec.streams ?? {})
      .filter(([, stream]) => stream?.type === "point")
      .map(([name]) => name)
  );
  const baseStreams = new Set(
    Object.entries(spec.streams ?? {})
      .filter(([, stream]) => stream?.type === "base")
      .map(([name]) => name)
  );
  const usedTokenIds = new Set(
    current
      .map((token) => token?.id)
      .filter((id) => typeof id === "string" && id.length > 0)
  );

  const runtime = {
    params: {
      ...(spec.parameters ?? {}),
      ...(options.parameters ?? {}),
    },
    patterns: spec.patterns ?? {},
    pointStreams,
    baseStreams,
    pointCounters: new Map(),
    insertCounters: new Map(),
    usedTokenIds,
    markTimes: new Map(),
  };

  const selectedPhases = Array.isArray(options.phases) && options.phases.length > 0
    ? new Set(options.phases)
    : null;

  const trace = [];

  for (const phase of spec.phases) {
    if (selectedPhases && !selectedPhases.has(phase.name)) continue;
    trace.push({ type: "phase_start", phase: phase.name });
    for (const ruleName of phase.rules) {
      const rule = spec.rules[ruleName];
      trace.push({ type: "rule_start", phase: phase.name, rule: ruleName });
      current = applyRule(rule, current, runtime);
      trace.push({ type: "rule_end", phase: phase.name, rule: ruleName });
    }
    if (phase.compute_times) {
      computeSyncTimes(current, runtime);
      trace.push({ type: "times_resolved", phase: phase.name });
    }
    if (Array.isArray(phase.resolve_points) && phase.resolve_points.length > 0) {
      resolvePointTimes(current, runtime, phase.resolve_points);
      trace.push({ type: "points_resolved", phase: phase.name, streams: phase.resolve_points });
    }
    trace.push({ type: "phase_end", phase: phase.name });
  }

  return {
    sequence: current,
    diagnostics,
    trace,
  };
}
