import { PHONEME_TARGETS, fillDefaultParams } from "../tts-frontend-rules.js";
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

function getIncompressibleMin(token, inherent) {
  if (!Number.isFinite(inherent) || inherent <= 0) return 0;
  const ratio = token?.type === "vowel" ? 0.42 : 0.6;
  return inherent * ratio;
}

function materializeInventoryTarget(phoneme) {
  const key = typeof phoneme === "string" && phoneme.length > 0 ? phoneme : "SIL";
  const target = PHONEME_TARGETS[key] || PHONEME_TARGETS.SIL || {};
  const payload = {
    phoneme: key,
    params: fillDefaultParams(target),
    duration: target?.dur || 30,
    inherentDuration: target?.dur,
  };

  for (const [entryKey, value] of Object.entries(target)) {
    if (entryKey === "dur") continue;
    if (entryKey === "SW") {
      payload.inventorySW = value;
      continue;
    }
    if (entryKey === "type" && typeof value === "string") {
      payload.type = value;
      continue;
    }
    if (typeof value === "boolean") {
      payload[entryKey] = value;
    }
  }

  return payload;
}

function getTokenStream(token) {
  return token?.stream ?? "phone";
}

function initializeBaseStreamSyncMarks(sequence, baseStreams) {
  if (!(baseStreams instanceof Set) || baseStreams.size === 0) return;

  for (const stream of baseStreams) {
    const activeStreamTokens = sequence.filter(
      (token) => isActiveToken(token) && getTokenStream(token) === stream
    );
    if (activeStreamTokens.length === 0) continue;

    const needsInitialization = activeStreamTokens.some(
      (token) => token?.sync_left == null || token?.sync_right == null
    );
    if (!needsInitialization) continue;

    const boundaries = buildInitialBoundaryOrders(activeStreamTokens.length);
    for (let i = 0; i < activeStreamTokens.length; i += 1) {
      activeStreamTokens[i].sync_left = boundaries[i];
      activeStreamTokens[i].sync_right = boundaries[i + 1];
    }
  }
}

const FINITE_RANK_RE = /^[0-9a-z]{12}$/;
const BASE36_DIGITS = "0123456789abcdefghijklmnopqrstuvwxyz";
const BASE36 = 36n;
const MAX_FINITE_RANK = BASE36 ** 12n - 1n;
const START_ORDER = Object.freeze({ kind: "START" });
const END_ORDER = Object.freeze({ kind: "END" });

function parseBase36Rank(rank) {
  if (typeof rank !== "string" || !FINITE_RANK_RE.test(rank)) return null;
  let value = 0n;
  for (const ch of rank) {
    value = value * BASE36 + BigInt(BASE36_DIGITS.indexOf(ch));
  }
  return value;
}

function formatBase36Rank(value) {
  if (typeof value !== "bigint" || value < 0n || value > MAX_FINITE_RANK) return null;
  let n = value;
  const chars = new Array(12).fill("0");
  for (let i = 11; i >= 0; i -= 1) {
    const digit = Number(n % BASE36);
    chars[i] = BASE36_DIGITS[digit];
    n /= BASE36;
  }
  return chars.join("");
}

function buildInitialBoundaryOrders(tokenCount) {
  if (!Number.isInteger(tokenCount) || tokenCount <= 0) return [];
  if (tokenCount === 1) return [START_ORDER, END_ORDER];

  const boundaries = new Array(tokenCount + 1);
  boundaries[0] = START_ORDER;
  boundaries[tokenCount] = END_ORDER;

  let previous = 0n;
  const denominator = BigInt(tokenCount);
  for (let i = 1; i < tokenCount; i += 1) {
    let rankValue = (MAX_FINITE_RANK * BigInt(i)) / denominator;
    if (rankValue <= previous) rankValue = previous + 1n;
    if (rankValue >= MAX_FINITE_RANK) rankValue = MAX_FINITE_RANK - 1n;
    if (rankValue <= previous) {
      throw new Error("E_RANK_NO_SPACE: unable to bootstrap sync axis");
    }
    const rank = formatBase36Rank(rankValue);
    if (!rank) {
      throw new Error("E_RANK_INVALID: unable to format bootstrap rank");
    }
    boundaries[i] = { kind: "FINITE", rank };
    previous = rankValue;
  }

  return boundaries;
}

function toNumericOrder(mark) {
  if (typeof mark === "number" && Number.isFinite(mark)) return mark;
  if (typeof mark === "bigint") return Number(mark);

  if (typeof mark === "string") {
    const rank = parseBase36Rank(mark);
    if (rank != null) return Number(rank);
    if (/^-?\d+(\.\d+)?$/.test(mark)) {
      const parsed = Number(mark);
      if (Number.isFinite(parsed)) return parsed;
    }
    return null;
  }

  if (mark && typeof mark === "object") {
    if (mark.kind === "START") return 0;
    if (mark.kind === "END") return Number(MAX_FINITE_RANK);
    if (mark.kind === "FINITE") {
      const rank = parseBase36Rank(mark.rank);
      if (rank != null) return Number(rank);
    }
  }

  return null;
}

function compareOrderValue(left, right) {
  if (left === right) return 0;

  if (left && right && typeof left === "object" && typeof right === "object") {
    const kindOrder = { START: 0, FINITE: 1, END: 2 };
    if (left.kind && right.kind && left.kind !== right.kind) {
      return (kindOrder[left.kind] ?? 0) - (kindOrder[right.kind] ?? 0);
    }
    if (left.kind === "FINITE" && right.kind === "FINITE") {
      const lRank = String(left.rank ?? "");
      const rRank = String(right.rank ?? "");
      if (lRank < rRank) return -1;
      if (lRank > rRank) return 1;
      return 0;
    }
  }

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

  const hasExplicitRatio = Object.prototype.hasOwnProperty.call(source, "ratio");
  let ratio = source.ratio;
  if (!hasExplicitRatio || ratio == null) {
    ratio = anchorLeft === anchorRight ? 0 : 0.5;
  } else if (!Number.isFinite(ratio) || ratio < 0 || ratio > 1) {
    throw new Error(`E_INVALID_RATIO: point ratio must be in [0,1], got ${String(ratio)}`);
  }

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

  const isPhonePhraseBoundary = (token) =>
    token?.phoneme === "SIL" && token?.punctuationSymbol != null;

  const getPhraseWindow = (token) => {
    const stream = getTokenStream(token);
    const active = getActiveStreamTokens(stream);
    const index = active.indexOf(token);
    if (index < 0) return { index: -1, total: 0 };
    if (stream !== "phone") {
      return { index, total: active.length };
    }

    let start = 0;
    for (let i = index - 1; i >= 0; i -= 1) {
      if (isPhonePhraseBoundary(active[i])) {
        start = i + 1;
        break;
      }
    }

    let end = active.length - 1;
    for (let i = index; i < active.length; i += 1) {
      if (isPhonePhraseBoundary(active[i])) {
        end = i;
        break;
      }
    }

    return {
      index: index - start,
      total: Math.max(1, end - start + 1),
    };
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
          ratio: Number(ratio),
        },
        token
      );
    },
    at_sync: (syncMark) =>
      normalizeAnchor({ anchor_left: syncMark, anchor_right: syncMark, ratio: 0 }),
    target: (phoneme) => {
      const payload = materializeInventoryTarget(phoneme);
      return {
        ...payload,
        params: { ...payload.params },
      };
    },
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
    phrase_index: (token) => getPhraseWindow(token).index,
    phrase_total: (token) => getPhraseWindow(token).total,
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

function evaluateRuleConstraint(constraintExpr, context, functions) {
  if (!constraintExpr || constraintExpr === "true") return true;
  const result = evaluateExpression(constraintExpr, context, functions);
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

function toFiniteOrNull(value) {
  return Number.isFinite(value) ? Number(value) : null;
}

function getScalarConfig(runtime, token, field) {
  if (!runtime || !token || typeof field !== "string") return null;
  const stream = getTokenStream(token);
  const byStream = runtime.scalarSpecsByStream?.get(stream);
  if (!byStream || typeof byStream !== "object") return null;
  const config = byStream[field];
  return config && typeof config === "object" ? config : null;
}

function getScalarResolution(config) {
  const raw = typeof config?.resolution === "string" ? config.resolution.toLowerCase() : null;
  if (raw === "standard" || raw === "klatt") return raw;
  return null;
}

function computeKlattFloor(token, field, config, baseValue) {
  const explicitFloor = toFiniteOrNull(config?.floor);
  if (explicitFloor != null) return explicitFloor;

  const floorField = typeof config?.floor_field === "string" ? config.floor_field : null;
  if (floorField && Number.isFinite(token?.[floorField])) return Number(token[floorField]);

  if (field === "duration") {
    const inherent = Number.isFinite(token?.inherentDuration)
      ? Number(token.inherentDuration)
      : baseValue;
    return getIncompressibleMin(token, inherent);
  }

  const minVal = toFiniteOrNull(config?.min);
  return minVal != null ? minVal : 0;
}

function getOrCreateScalarState(runtime, token, field, currentValue) {
  if (!runtime || !token || typeof field !== "string") return null;

  let perToken = runtime.scalarStates.get(token);
  if (!perToken) {
    perToken = new Map();
    runtime.scalarStates.set(token, perToken);
  }

  let state = perToken.get(field);
  if (state) return state;

  const config = getScalarConfig(runtime, token, field);
  const resolution = getScalarResolution(config);
  if (!resolution) return null;

  const base = Number.isFinite(currentValue) ? Number(currentValue) : 0;
  state = {
    resolution,
    base,
    preview: base,
    floor: resolution === "klatt" ? computeKlattFloor(token, field, config, base) : null,
    min: toFiniteOrNull(config?.min),
    max: toFiniteOrNull(config?.max),
    round: field === "duration" || config?.unit === "ms",
    effects: [],
    resolved: null,
  };
  perToken.set(field, state);
  return state;
}

function previewScalarEffect(state, op, value) {
  const current = Number.isFinite(state.preview) ? state.preview : state.base;
  const maybeRound = (n) => (state.round ? Math.round(n) : n);
  if (state.resolution === "klatt") {
    const floor = Number.isFinite(state.floor) ? Number(state.floor) : 0;
    if (op === "set") return maybeRound(value);
    if (op === "mul") return maybeRound(value * (current - floor) + floor);
    if (op === "add") return maybeRound(current + value);
    return maybeRound(current);
  }

  if (op === "set") return maybeRound(value);
  if (op === "mul") return maybeRound(current * value);
  if (op === "add") return maybeRound(current + value);
  return maybeRound(current);
}

function resolveScalarState(state) {
  const maybeRound = (n) => (state.round ? Math.round(n) : n);
  let value = Number.isFinite(state.base) ? Number(state.base) : 0;
  const orderedEffects = state.effects
    .slice()
    .sort((left, right) => Number(left.order) - Number(right.order));

  if (state.resolution === "klatt") {
    const floor = Number.isFinite(state.floor) ? Number(state.floor) : 0;
    for (const effect of orderedEffects) {
      if (effect.op === "set") value = maybeRound(effect.value);
      else if (effect.op === "mul") value = maybeRound(effect.value * (value - floor) + floor);
      else if (effect.op === "add") value = maybeRound(value + effect.value);
    }
    const max = Number.isFinite(state.max) ? Number(state.max) : Number.POSITIVE_INFINITY;
    if (value < floor) value = floor;
    if (value > max) value = max;
    return maybeRound(value);
  }

  for (const effect of orderedEffects) {
    if (effect.op === "set") value = maybeRound(effect.value);
    else if (effect.op === "mul") value = maybeRound(value * effect.value);
    else if (effect.op === "add") value = maybeRound(value + effect.value);
  }

  const min = Number.isFinite(state.min) ? Number(state.min) : Number.NEGATIVE_INFINITY;
  const max = Number.isFinite(state.max) ? Number(state.max) : Number.POSITIVE_INFINITY;
  if (value < min) value = min;
  if (value > max) value = max;
  return maybeRound(value);
}

function resolveScalars(sequence, runtime, scalarFields) {
  const fields = Array.isArray(scalarFields) ? scalarFields.filter((field) => typeof field === "string") : [];
  if (fields.length === 0) return 0;

  let resolvedCount = 0;
  for (const [token, perToken] of runtime.scalarStates.entries()) {
    if (!isActiveToken(token)) continue;
    for (const field of fields) {
      const state = perToken.get(field);
      if (!state || state.effects.length === 0) continue;
      const resolved = resolveScalarState(state);
      token[field] = resolved;
      state.resolved = resolved;
      state.base = resolved;
      state.preview = resolved;
      state.effects = [];
      resolvedCount += 1;
    }
  }
  return resolvedCount;
}

function applyEffectToToken(effect, token, params, functions, runtime, extraContext = null) {
  if (!effect || typeof effect !== "object") return;
  const field = typeof effect.field === "string" ? effect.field : "";
  if (!field) return;

  const fieldPath = field.split(".").filter((part) => part.length > 0);
  if (fieldPath.length === 0) return;

  const getField = () => {
    let value = token;
    for (const segment of fieldPath) {
      if (!value || typeof value !== "object") return undefined;
      value = value[segment];
    }
    return value;
  };

  const setField = (nextValue) => {
    let cursor = token;
    for (let i = 0; i < fieldPath.length - 1; i += 1) {
      const segment = fieldPath[i];
      if (!cursor[segment] || typeof cursor[segment] !== "object") {
        cursor[segment] = {};
      }
      cursor = cursor[segment];
    }
    cursor[fieldPath[fieldPath.length - 1]] = nextValue;
  };

  const currentValue = getField();
  const current = Number.isFinite(currentValue) ? currentValue : 0;
  const value = evaluateValueExpression(effect.value, token, params, functions, extraContext);
  const op = effect.op;
  if (op !== "set" && op !== "add" && op !== "mul") {
    throw new Error(`Unsupported effect op '${op}' in slice engine`);
  }

  if (runtime && fieldPath.length === 1) {
    const scalarField = fieldPath[0];
    if (runtime.activeResolveScalars?.has(scalarField)) {
      const state = getOrCreateScalarState(runtime, token, scalarField, current);
      if (state) {
        const order = runtime.scalarEffectOrder++;
        state.effects.push({
          field: scalarField,
          op,
          value,
          tag: effect.tag ?? null,
          rule: runtime.currentRuleName ?? null,
          order,
        });
        const preview = previewScalarEffect(state, op, value);
        state.preview = preview;
        setField(preview);
        return;
      }
    }
  }

  switch (op) {
    case "set":
      setField(value);
      break;
    case "add":
      setField(current + value);
      break;
    case "mul":
      setField(current * value);
      break;
  }
}

function applyEffectsToTargets(
  rule,
  resolveTarget,
  params,
  functions,
  runtime,
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
    applyEffectToToken(effect, target, params, functions, runtime, extraContext);
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
  if (compareOrderValue(left, right) === 0) {
    return Array.from({ length: count }, () => ({ left, right }));
  }

  if (typeof left === "number" && typeof right === "number") {
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

  const leftRank = parseBase36Rank(left);
  const rightRank = parseBase36Rank(right);
  if (leftRank != null && rightRank != null && leftRank < rightRank) {
    const span = rightRank - leftRank;
    const boundaries = [leftRank];
    for (let i = 1; i < count; i += 1) {
      const cut = leftRank + (span * BigInt(i)) / BigInt(count);
      const prev = boundaries[boundaries.length - 1];
      if (cut <= prev || cut >= rightRank) {
        throw new Error("E_RANK_NO_SPACE: rebalance required");
      }
      boundaries.push(cut);
    }
    boundaries.push(rightRank);

    const segments = [];
    for (let i = 0; i < count; i += 1) {
      const segmentLeft = formatBase36Rank(boundaries[i]);
      const segmentRight = formatBase36Rank(boundaries[i + 1]);
      if (!segmentLeft || !segmentRight) {
        throw new Error("E_RANK_INVALID: unable to format split boundary rank");
      }
      segments.push({ left: segmentLeft, right: segmentRight });
    }
    return segments;
  }

  throw new Error("Multi-token splice requires numeric or base36-rank boundaries");
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

function findInsertionIndexForBoundary(sequence, stream, boundary, side) {
  for (let i = 0; i < sequence.length; i += 1) {
    const token = sequence[i];
    if (getTokenStream(token) !== stream) continue;
    if (token?.sync_left == null) continue;
    const leftCmp = compareOrderValue(token.sync_left, boundary);
    if (leftCmp > 0) return i;
    if (leftCmp < 0) continue;

    if (side === "after") {
      const rightCmp = compareOrderValue(token.sync_right, boundary);
      if (rightCmp === 0) continue;
    }
    return i;
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

    const insertionIndex = findInsertionIndexForBoundary(sequence, stream, boundary, side);
    const inserts = buildSpliceInsertions(
      spliceSpec.insert,
      stream,
      { left: boundary, right: boundary },
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
    const constraintOk = evaluateRuleConstraint(
      rule.constraint,
      { ...extraContext, params: runtime.params ?? {} },
      navigationFunctions
    );
    if (!constraintOk) continue;

    applyEffectsToTargets(
      rule,
      (targetName) => (targetName === "current" ? token : null),
      runtime.params,
      navigationFunctions,
      runtime,
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
    const constraintOk = evaluateRuleConstraint(
      rule.constraint,
      { ...extraContext, params: runtime.params ?? {} },
      captureFunctions
    );
    if (!constraintOk) continue;

    applyEffectsToTargets(
      rule,
      (targetName) => captures[targetName] ?? null,
      runtime.params,
      captureFunctions,
      runtime,
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
  throw new Error(`Unsupported declarative slice rule op '${rule?.op}'`);
}

function isStructuralRule(rule) {
  if (!rule || typeof rule !== "object") return false;
  if (rule.splice) return true;
  if (rule.insert_point) return true;
  if (rule.suppress || rule.delete) return true;
  if (Array.isArray(rule.associate) && rule.associate.length > 0) return true;
  if (Array.isArray(rule.disassociate) && rule.disassociate.length > 0) return true;
  return false;
}

function collectReferencedMarks(sequence) {
  const marks = new Set();
  for (const token of sequence) {
    if (token?.sync_left != null) marks.add(token.sync_left);
    if (token?.sync_right != null) marks.add(token.sync_right);
    if (token?.anchor_left != null) marks.add(token.anchor_left);
    if (token?.anchor_right != null) marks.add(token.anchor_right);
  }
  return marks;
}

function describeMark(mark) {
  if (typeof mark === "string") return mark;
  if (typeof mark === "number") return String(mark);
  try {
    return JSON.stringify(mark);
  } catch {
    return String(mark);
  }
}

function interpolateMarkTimes(markTimes, referencedMarks) {
  const unresolved = new Set(
    [...referencedMarks].filter((mark) => !Number.isFinite(markTimes.get(mark)))
  );
  if (unresolved.size === 0) return;

  let progressed = true;
  while (progressed && unresolved.size > 0) {
    progressed = false;
    const timedMarks = [...markTimes.keys()].filter((mark) => Number.isFinite(markTimes.get(mark)));

    for (const mark of [...unresolved]) {
      let leftBound = null;
      let rightBound = null;

      for (const timed of timedMarks) {
        const cmp = compareOrderValue(timed, mark);
        if (cmp <= 0) {
          if (leftBound == null || compareOrderValue(leftBound, timed) <= 0) {
            leftBound = timed;
          }
        }
        if (cmp >= 0) {
          if (rightBound == null || compareOrderValue(timed, rightBound) <= 0) {
            rightBound = timed;
          }
        }
      }

      if (leftBound == null || rightBound == null) continue;
      const leftTime = Number(markTimes.get(leftBound));
      const rightTime = Number(markTimes.get(rightBound));
      if (!Number.isFinite(leftTime) || !Number.isFinite(rightTime)) continue;

      if (compareOrderValue(leftBound, rightBound) === 0) {
        markTimes.set(mark, leftTime);
        unresolved.delete(mark);
        progressed = true;
        continue;
      }

      const leftOrder = toNumericOrder(leftBound);
      const rightOrder = toNumericOrder(rightBound);
      const currentOrder = toNumericOrder(mark);
      if (
        !Number.isFinite(leftOrder) ||
        !Number.isFinite(rightOrder) ||
        !Number.isFinite(currentOrder)
      ) {
        continue;
      }

      const denom = rightOrder - leftOrder;
      if (!Number.isFinite(denom) || denom === 0) continue;
      let ratio = (currentOrder - leftOrder) / denom;
      if (!Number.isFinite(ratio)) continue;
      if (ratio < 0) ratio = 0;
      if (ratio > 1) ratio = 1;

      const interpolated = leftTime + ratio * (rightTime - leftTime);
      markTimes.set(mark, interpolated);
      unresolved.delete(mark);
      progressed = true;
    }
  }

  if (unresolved.size > 0) {
    const unknown = [...unresolved].map((mark) => describeMark(mark)).join(", ");
    throw new Error(`E_TIME_NO_BASE_SUPPORT: unable to assign times for marks: ${unknown}`);
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

  const referencedMarks = collectReferencedMarks(sequence);
  interpolateMarkTimes(markTimes, referencedMarks);

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
    const ratio = Number(token.ratio);
    if (!Number.isFinite(ratio) || ratio < 0 || ratio > 1) {
      throw new Error(`E_INVALID_RATIO: point ratio must be in [0,1], got ${String(token.ratio)}`);
    }
    token.time = Number(left) + ratio * (Number(right) - Number(left));
  }
}

function assertActiveBaseCoverage(sequence, runtime) {
  if (!(runtime?.baseStreams instanceof Set) || runtime.baseStreams.size === 0) return;

  for (const stream of runtime.baseStreams) {
    const active = sequence
      .filter(
        (token) =>
          isActiveToken(token) &&
          getTokenStream(token) === stream &&
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

    for (let i = 0; i + 1 < active.length; i += 1) {
      const left = active[i];
      const right = active[i + 1];
      const cmp = compareOrderValue(left.sync_right, right.sync_left);
      if (cmp > 0) {
        throw new Error(
          `E_BASE_OVERLAP: stream '${stream}' overlap between '${String(left.id ?? i)}' and '${String(
            right.id ?? i + 1
          )}'`
        );
      }
      if (cmp < 0) {
        throw new Error(
          `E_BASE_NOT_CONTIGUOUS: stream '${stream}' gap between '${String(
            left.id ?? i
          )}' and '${String(right.id ?? i + 1)}'`
        );
      }
    }
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
  const scalarSpecsByStream = new Map(
    Object.entries(spec.streams ?? {}).map(([name, stream]) => [
      name,
      stream && typeof stream.scalars === "object" && !Array.isArray(stream.scalars)
        ? stream.scalars
        : {},
    ])
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
    scalarSpecsByStream,
    scalarStates: new Map(),
    scalarEffectOrder: 0,
    activeResolveScalars: new Set(),
    currentRuleName: null,
    usedTokenIds,
    markTimes: new Map(),
    finalized: false,
  };

  initializeBaseStreamSyncMarks(current, baseStreams);

  const selectedPhases = Array.isArray(options.phases) && options.phases.length > 0
    ? new Set(options.phases)
    : null;

  const trace = [];

  for (const phase of spec.phases) {
    if (selectedPhases && !selectedPhases.has(phase.name)) continue;
    runtime.activeResolveScalars = new Set(
      Array.isArray(phase.resolve_scalars) ? phase.resolve_scalars : []
    );
    trace.push({ type: "phase_start", phase: phase.name });
    for (const ruleName of phase.rules) {
      const rule = spec.rules[ruleName];
      if (runtime.finalized && isStructuralRule(rule)) {
        throw new Error(
          `E_FINALIZE_DIRTY: structural rule '${ruleName}' executed after finalize stage`
        );
      }
      runtime.currentRuleName = ruleName;
      trace.push({ type: "rule_start", phase: phase.name, rule: ruleName });
      current = applyRule(rule, current, runtime);
      trace.push({ type: "rule_end", phase: phase.name, rule: ruleName });
      runtime.currentRuleName = null;
    }
    if (Array.isArray(phase.resolve_scalars) && phase.resolve_scalars.length > 0) {
      const resolved = resolveScalars(current, runtime, phase.resolve_scalars);
      trace.push({
        type: "scalars_resolved",
        phase: phase.name,
        fields: phase.resolve_scalars,
        count: resolved,
      });
    }
    if (phase.compute_times) {
      computeSyncTimes(current, runtime);
      trace.push({ type: "times_resolved", phase: phase.name });
    }
    if (Array.isArray(phase.resolve_points) && phase.resolve_points.length > 0) {
      resolvePointTimes(current, runtime, phase.resolve_points);
      trace.push({ type: "points_resolved", phase: phase.name, streams: phase.resolve_points });
    }
    if (phase.compute_times || (Array.isArray(phase.resolve_points) && phase.resolve_points.length > 0)) {
      runtime.finalized = true;
    }
    assertActiveBaseCoverage(current, runtime);
    runtime.activeResolveScalars = new Set();
    trace.push({ type: "phase_end", phase: phase.name });
  }

  return {
    sequence: current,
    diagnostics,
    trace,
  };
}
