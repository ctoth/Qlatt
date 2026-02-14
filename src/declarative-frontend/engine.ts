import { parseDslSpec } from "./parser";
import { assertValidSpec } from "./validation";
import { evaluateExpression } from "./expressions";
import {
  TokenStatus,
  isActiveToken,
  joinTokenStatus,
  normalizeTokenStatus,
} from "./model";
import {
  buildInitialBoundaryOrders,
  buildSyncAxis,
  compareOrderValue,
  isEndOrder,
  isStartOrder,
  toNumericOrder,
} from "./axis";

type TokenLike = Record<string, any>;
type RuntimeLike = Record<string, any>;
export type InventoryResolver = (phoneme: string) => Record<string, unknown> | null | undefined;
type TokenMarkRef = { raw: unknown; id: string };

function cloneSequence(sequence: TokenLike[]): TokenLike[] {
  return sequence.map((token) => ({
    ...token,
    status: normalizeTokenStatus(token?.status),
  }));
}

function getIncompressibleMin(token: TokenLike | null | undefined, inherent: unknown): number {
  const inherentMs = Number(inherent);
  if (!Number.isFinite(inherentMs) || inherentMs <= 0) return 0;
  const ratio = token?.type === "vowel" ? 0.42 : 0.6;
  return inherentMs * ratio;
}

function materializeInventoryTarget(
  phoneme: unknown,
  runtime: RuntimeLike | null | undefined
): TokenLike {
  const key = typeof phoneme === "string" && phoneme.length > 0 ? phoneme : "SIL";
  const resolver =
    runtime && typeof runtime.inventoryResolver === "function"
      ? (runtime.inventoryResolver as InventoryResolver)
      : null;
  const resolved = resolver ? resolver(key) : null;
  if (!resolved || typeof resolved !== "object" || Array.isArray(resolved)) {
    return {
      phoneme: key,
      params: {},
      duration: 30,
      inherentDuration: 30,
    };
  }

  const payload: TokenLike = { ...resolved };
  payload.phoneme =
    typeof payload.phoneme === "string" && payload.phoneme.length > 0 ? payload.phoneme : key;
  payload.params =
    payload.params && typeof payload.params === "object" && !Array.isArray(payload.params)
      ? { ...payload.params }
      : {};
  const duration = Number(payload.duration);
  payload.duration = Number.isFinite(duration) && duration > 0 ? duration : 30;
  const inherentDuration = Number(payload.inherentDuration);
  payload.inherentDuration =
    Number.isFinite(inherentDuration) && inherentDuration > 0 ? inherentDuration : payload.duration;
  return payload;
}

function getTokenStream(token: TokenLike | null | undefined): string {
  return token?.stream ?? "phone";
}

function initializeBaseStreamSyncMarks(sequence: TokenLike[], baseStreams: Set<string>): void {
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

function comparePointTokenOrder(
  left: TokenLike,
  right: TokenLike,
  runtime: RuntimeLike | null = null
): number {
  const leftTime = Number.isFinite(left?.time) ? Number(left.time) : null;
  const rightTime = Number.isFinite(right?.time) ? Number(right.time) : null;
  if (leftTime != null && rightTime != null && leftTime !== rightTime) {
    return leftTime < rightTime ? -1 : 1;
  }
  const leftAnchorLeft = runtime ? readTokenMarkOrder(left, runtime, "anchor_left") : left?.anchor_left;
  const rightAnchorLeft = runtime ? readTokenMarkOrder(right, runtime, "anchor_left") : right?.anchor_left;
  const byLeft = compareOrderValue(leftAnchorLeft, rightAnchorLeft);
  if (byLeft !== 0) return byLeft;
  const leftAnchorRight = runtime ? readTokenMarkOrder(left, runtime, "anchor_right") : left?.anchor_right;
  const rightAnchorRight = runtime ? readTokenMarkOrder(right, runtime, "anchor_right") : right?.anchor_right;
  const byRight = compareOrderValue(leftAnchorRight, rightAnchorRight);
  if (byRight !== 0) return byRight;
  const leftRatio = Number.isFinite(left?.ratio) ? Number(left.ratio) : 0;
  const rightRatio = Number.isFinite(right?.ratio) ? Number(right.ratio) : 0;
  if (leftRatio !== rightRatio) return leftRatio < rightRatio ? -1 : 1;
  return compareOrderValue(left?.id ?? "", right?.id ?? "");
}

function getTokenMarkRefCache(
  runtime: RuntimeLike | null | undefined,
  token: TokenLike | null | undefined,
  create = false
): Map<string, TokenMarkRef> | null {
  if (!runtime || !token) return null;
  if (!(runtime.tokenMarkRefs instanceof WeakMap)) {
    if (!create) return null;
    runtime.tokenMarkRefs = new WeakMap();
  }
  const existing = runtime.tokenMarkRefs.get(token);
  if (existing) return existing;
  if (!create) return null;
  const created = new Map<string, TokenMarkRef>();
  runtime.tokenMarkRefs.set(token, created);
  return created;
}

function readTokenMarkId(
  token: TokenLike | null | undefined,
  runtime: RuntimeLike | null | undefined,
  field: string
): string | null {
  if (!token || !runtime || typeof field !== "string" || field.length === 0) return null;
  const raw = token[field];
  if (raw == null) return null;

  const cache = getTokenMarkRefCache(runtime, token, true);
  const cached = cache?.get(field);
  if (cached && cached.raw === raw) {
    const canonicalOrder = getOrderForMarkId(runtime, cached.id);
    if (canonicalOrder != null && token[field] !== canonicalOrder) {
      token[field] = canonicalOrder;
      cache?.set(field, { raw: token[field], id: cached.id });
    }
    return cached.id;
  }

  const id = resolveMarkId(runtime, raw);
  if (!id) {
    const tokenId = typeof token?.id === "string" && token.id.length > 0 ? token.id : "<anonymous>";
    throw new Error(
      `E_SYNC_MARK_INVALID: token '${tokenId}' field '${field}' must be START/FINITE/END order object`
    );
  }

  const canonicalOrder = getOrderForMarkId(runtime, id);
  if (canonicalOrder != null) {
    token[field] = canonicalOrder;
  }

  cache?.set(field, { raw: token[field], id });
  return id;
}

function writeTokenMarkId(
  token: TokenLike | null | undefined,
  runtime: RuntimeLike | null | undefined,
  field: string,
  markId: string | null | undefined
): void {
  if (!token || !runtime || typeof field !== "string" || field.length === 0) return;
  if (typeof markId !== "string" || markId.length === 0) return;
  const canonicalOrder = getOrderForMarkId(runtime, markId);
  if (canonicalOrder != null) {
    token[field] = canonicalOrder;
  }
  const cache = getTokenMarkRefCache(runtime, token, true);
  cache?.set(field, { raw: token[field], id: markId });
}

function readTokenMarkOrder(
  token: TokenLike | null | undefined,
  runtime: RuntimeLike | null | undefined,
  field: string
): unknown {
  const id = readTokenMarkId(token, runtime, field);
  return id ? getOrderForMarkId(runtime, id) : null;
}

function getTokenBounds(
  token: TokenLike | null | undefined,
  runtime: RuntimeLike | null | undefined = null
): { left: unknown; right: unknown } | null {
  if (token) {
    const left = runtime ? readTokenMarkOrder(token, runtime, "sync_left") : token.sync_left;
    const right = runtime ? readTokenMarkOrder(token, runtime, "sync_right") : token.sync_right;
    if (left != null && right != null) {
      return { left, right };
    }
  }
  if (token) {
    const left = runtime ? readTokenMarkOrder(token, runtime, "anchor_left") : token.anchor_left;
    const right = runtime ? readTokenMarkOrder(token, runtime, "anchor_right") : token.anchor_right;
    if (left != null && right != null) {
      return { left, right };
    }
  }
  return null;
}

function canonicalizeSequenceAxisRefs(sequence: TokenLike[], runtime: RuntimeLike): void {
  for (const token of sequence) {
    readTokenMarkId(token, runtime, "sync_left");
    readTokenMarkId(token, runtime, "sync_right");
    readTokenMarkId(token, runtime, "anchor_left");
    readTokenMarkId(token, runtime, "anchor_right");
  }
}

function resolveMarkId(runtime: RuntimeLike | null | undefined, markLike: unknown): string | null {
  if (!runtime?.axis || markLike == null) return null;
  if (typeof markLike === "string" && runtime.axis.getMarkById(markLike)) return markLike;
  if (markLike && typeof markLike === "object" && !Array.isArray(markLike)) {
    const explicitId = (markLike as { id?: unknown }).id;
    if (typeof explicitId === "string" && runtime.axis.getMarkById(explicitId)) {
      return explicitId;
    }
  }
  return runtime.axis.ensureMark(markLike);
}

function getOrderForMarkId(runtime: RuntimeLike | null | undefined, markId: unknown): unknown {
  if (!runtime?.axis || typeof markId !== "string") return null;
  const mark = runtime.axis.getMarkById(markId);
  return mark ? mark.order : null;
}

function compareMarkIds(runtime: RuntimeLike, leftId: unknown, rightId: unknown): number {
  if (leftId === rightId) return 0;
  return runtime.axis.compareMarkIds(leftId, rightId);
}

function buildRuntimeMarkProps(runtime: RuntimeLike | null | undefined, mapping: unknown): TokenLike {
  const props: TokenLike = {};
  const entries =
    mapping && typeof mapping === "object" ? Object.entries(mapping) : [];
  for (const [field, valueOrId] of entries) {
    const markId = resolveMarkId(runtime, valueOrId);
    if (!markId) continue;
    props[field] = getOrderForMarkId(runtime, markId);
  }
  return props;
}

function normalizeAnchor(anchor: unknown, fallbackToken: TokenLike | null = null): TokenLike {
  const source: TokenLike =
    anchor && typeof anchor === "object" && !Array.isArray(anchor) ? (anchor as TokenLike) : {};

  let anchorLeft = source.anchor_left ?? source.left ?? source.sync_left ?? null;
  let anchorRight = source.anchor_right ?? source.right ?? source.sync_right ?? null;

  if (fallbackToken && fallbackToken.sync_left != null && anchorLeft == null) {
    anchorLeft = fallbackToken.sync_left;
  }
  if (fallbackToken && fallbackToken.sync_right != null && anchorRight == null) {
    anchorRight = fallbackToken.sync_right;
  }

  if (anchorLeft == null || anchorRight == null) {
    throw new Error("E_POINT_ANCHOR_MISSING: point anchor is missing anchor_left/anchor_right");
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

function normalizeAssociationEntries(raw: unknown): Array<{ to: string; status: number }> {
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

function getAssociationEntries(token: TokenLike, assocName: string): Array<{ to: string; status: number }> {
  if (!token || typeof assocName !== "string" || assocName.length === 0) return [];
  if (!token.associations || typeof token.associations !== "object") {
    token.associations = {};
  }
  const entries = normalizeAssociationEntries(token.associations[assocName]);
  token.associations[assocName] = entries;
  return entries;
}

function upsertAssociationEdge(
  fromToken: TokenLike,
  assocName: string,
  toId: string,
  status: unknown
): void {
  if (!fromToken || typeof toId !== "string") return;
  const entries = getAssociationEntries(fromToken, assocName);
  const edge = entries.find((entry) => entry.to === toId);
  if (!edge) {
    entries.push({ to: toId, status: normalizeTokenStatus(status) });
    return;
  }
  edge.status = joinTokenStatus(edge.status, status);
}

function buildNavigationFunctions(
  sequence: TokenLike[],
  runtime: RuntimeLike | null = null,
  options: RuntimeLike = {}
) {
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

  const getActiveStreamTokens = (stream: string): TokenLike[] => {
    const key = stream || "phone";
    if (cache.has(key)) return cache.get(key);
    let active = sequence.filter(
      (token) => isActiveToken(token) && getTokenStream(token) === key
    );
    if (runtime?.pointStreams?.has(key)) {
      active = active.slice().sort((left, right) => comparePointTokenOrder(left, right, runtime));
    }
    cache.set(key, active);
    for (const token of active) {
      if (token?.id != null && !activeById.has(token.id)) {
        activeById.set(token.id, token);
      }
    }
    return active;
  };

  const getIndex = (token: TokenLike): number => {
    const stream = getTokenStream(token);
    const active = getActiveStreamTokens(stream);
    return active.indexOf(token);
  };

  const getPointCursor = (stream: string): number => {
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

  const isPhonePhraseBoundary = (token: TokenLike): boolean =>
    token?.phoneme === "SIL" && token?.punctuationSymbol != null;

  const getPhraseWindow = (token: TokenLike): { index: number; total: number } => {
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
    prev: (token: TokenLike) => {
      const stream = getTokenStream(token);
      const active = getActiveStreamTokens(stream);
      const index = active.indexOf(token);
      if (index <= 0) return null;
      return active[index - 1];
    },
    next: (token: TokenLike) => {
      const stream = getTokenStream(token);
      const active = getActiveStreamTokens(stream);
      const index = active.indexOf(token);
      if (index < 0 || index + 1 >= active.length) return null;
      return active[index + 1];
    },
    index: (token: TokenLike) => getIndex(token),
    total: (stream: string) => getActiveStreamTokens(stream).length,
    parent: (token: TokenLike, stream?: string) => {
      if (!token || token.parent == null) return null;
      // Build ID index lazily for all active streams referenced so far.
      if (!activeById.has(token.parent)) ensureActiveIdIndex();
      const parent = activeById.get(token.parent) ?? null;
      if (!parent) return null;
      if (stream && getTokenStream(parent) !== stream) return null;
      return parent;
    },
    children: (token: TokenLike, stream?: string) => {
      if (!token || token.id == null) return [];
      return sequence.filter((candidate: TokenLike) => {
        if (!isActiveToken(candidate)) return false;
        if (candidate?.parent !== token.id) return false;
        if (stream && getTokenStream(candidate) !== stream) return false;
        return true;
      });
    },
    assoc: (token: TokenLike, assocName: string) => {
      if (!token || typeof assocName !== "string" || assocName.length === 0) return [];
      ensureActiveIdIndex();

      const entries = getAssociationEntries(token, assocName);
      return entries
        .filter((entry: { to: string; status: number }) => normalizeTokenStatus(entry.status) === TokenStatus.ACTIVE)
        .map((entry: { to: string; status: number }) => activeById.get(entry.to))
        .filter((candidate: TokenLike | undefined) => candidate != null);
    },
    spanning: (token: TokenLike, stream: string) => {
      if (!token || typeof stream !== "string" || stream.length === 0) return [];
      const target = getTokenBounds(token, runtime);
      if (!target) return [];
      return getActiveStreamTokens(stream)
        .filter((candidate: TokenLike) => {
          const bounds = getTokenBounds(candidate, runtime);
          if (!bounds) return false;
          return (
            compareOrderValue(bounds.left, target.left) <= 0 &&
            compareOrderValue(bounds.right, target.right) >= 0
          );
        })
        .sort((left: TokenLike, right: TokenLike) => {
          const leftBounds = getTokenBounds(left, runtime);
          const rightBounds = getTokenBounds(right, runtime);
          if (!leftBounds && !rightBounds) return 0;
          if (!leftBounds) return 1;
          if (!rightBounds) return -1;
          const byLeft = compareOrderValue(leftBounds.left, rightBounds.left);
          if (byLeft !== 0) return byLeft;
          const byRight = compareOrderValue(leftBounds.right, rightBounds.right);
          if (byRight !== 0) return byRight;
          return compareOrderValue(left.id ?? "", right.id ?? "");
        });
    },
    midpoint: (token: TokenLike) => {
      const bounds = getTokenBounds(token, runtime);
      if (!bounds) return null;
      return normalizeAnchor(
        { anchor_left: bounds.left, anchor_right: bounds.right, ratio: 0.5 },
        token
      );
    },
    at_ratio: (token: TokenLike, ratio: number) => {
      const bounds = getTokenBounds(token, runtime);
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
    at_sync: (syncMark: unknown) =>
      normalizeAnchor({ anchor_left: syncMark, anchor_right: syncMark, ratio: 0 }),
    target: (phoneme: string) => {
      const payload = materializeInventoryTarget(phoneme, runtime);
      return {
        ...payload,
        params: { ...payload.params },
      };
    },
    prev_point: (stream: string) => {
      const streamName = typeof stream === "string" && stream.length > 0 ? stream : null;
      if (!streamName || !runtime?.pointStreams?.has(streamName)) return null;
      const points = getActiveStreamTokens(streamName);
      const cursor = getPointCursor(streamName);
      const index = cursor >= 0 ? cursor - 1 : points.length - 1;
      if (index < 0 || index >= points.length) return null;
      return points[index];
    },
    next_point: (stream: string) => {
      const streamName = typeof stream === "string" && stream.length > 0 ? stream : null;
      if (!streamName || !runtime?.pointStreams?.has(streamName)) return null;
      const points = getActiveStreamTokens(streamName);
      const cursor = getPointCursor(streamName);
      const index = cursor >= 0 ? cursor + 1 : 0;
      if (index < 0 || index >= points.length) return null;
      return points[index];
    },
    phrase_index: (token: TokenLike) => getPhraseWindow(token).index,
    phrase_total: (token: TokenLike) => getPhraseWindow(token).total,
  };
}

function evaluateSelectWhere(
  whereExpr: unknown,
  token: TokenLike,
  params: RuntimeLike,
  functions: RuntimeLike
): boolean {
  if (!whereExpr || whereExpr === "true") return true;
  if (typeof whereExpr !== "string") return false;
  const result = evaluateExpression(
    whereExpr,
    { current: token, params: params ?? {} },
    functions
  );
  return Boolean(result);
}

function evaluateRuleConstraint(
  constraintExpr: unknown,
  context: RuntimeLike,
  functions: RuntimeLike
): boolean {
  if (!constraintExpr || constraintExpr === "true") return true;
  if (typeof constraintExpr !== "string") return false;
  const result = evaluateExpression(constraintExpr, context, functions);
  return Boolean(result);
}

function evaluateValueExpression(
  expr: unknown,
  token: TokenLike,
  params: RuntimeLike,
  functions: RuntimeLike,
  extraContext: RuntimeLike | null = null
): number {
  if (typeof expr === "number") return expr;
  if (typeof expr !== "string") {
    throw new Error(`E_EXPR_VALUE_TYPE: unsupported value expression type: ${typeof expr}`);
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
    throw new Error(`E_EXPR_NONFINITE: expression '${expr}' did not evaluate to a finite number`);
  }
  return Number(value);
}

function toFiniteOrNull(value: unknown): number | null {
  return Number.isFinite(value) ? Number(value) : null;
}

function getScalarConfig(runtime: RuntimeLike, token: TokenLike, field: string): TokenLike | null {
  if (!runtime || !token || typeof field !== "string") return null;
  const stream = getTokenStream(token);
  const byStream = runtime.scalarSpecsByStream?.get(stream);
  if (!byStream || typeof byStream !== "object") return null;
  const config = byStream[field];
  return config && typeof config === "object" ? config : null;
}

function getScalarResolution(config: TokenLike | null): "standard" | "klatt" | null {
  const raw = typeof config?.resolution === "string" ? config.resolution.toLowerCase() : null;
  if (raw === "standard" || raw === "klatt") return raw;
  if (config && typeof config === "object") return "standard";
  return null;
}

function computeKlattFloor(token: TokenLike, field: string, config: TokenLike, baseValue: number): number {
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

function getOrCreateScalarState(
  runtime: RuntimeLike,
  token: TokenLike,
  field: string,
  currentValue: unknown
): TokenLike | null {
  if (!runtime || !token || typeof field !== "string") return null;

  let perToken = runtime.scalarStates.get(token);
  if (!perToken) {
    perToken = new Map();
    runtime.scalarStates.set(token, perToken);
  }

  let state = perToken.get(field);
  if (state) return state;

  const config = getScalarConfig(runtime, token, field);
  if (!config) return null;
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

function previewScalarEffect(state: TokenLike, op: string, value: number): number {
  const current = Number.isFinite(state.preview) ? Number(state.preview) : Number(state.base ?? 0);
  const maybeRound = (n: number): number => (state.round ? Math.round(n) : n);
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

function resolveScalarState(state: TokenLike): number {
  const maybeRound = (n: number): number => (state.round ? Math.round(n) : n);
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

function resolveScalars(sequence: TokenLike[], runtime: RuntimeLike, scalarFields: unknown): number {
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

function resolvePhaseScalarFields(phase: TokenLike, runtime: RuntimeLike): string[] {
  if (Array.isArray(phase?.resolve_scalars) && phase.resolve_scalars.length > 0) {
    return phase.resolve_scalars.filter((field) => typeof field === "string");
  }
  return runtime?.allScalarFields instanceof Set ? [...runtime.allScalarFields] : [];
}

function applyEffectToToken(
  effect: TokenLike,
  token: TokenLike,
  params: RuntimeLike,
  functions: RuntimeLike,
  runtime: RuntimeLike,
  extraContext: RuntimeLike | null = null
): void {
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

  const setField = (nextValue: unknown) => {
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
  const current = Number.isFinite(currentValue) ? Number(currentValue) : 0;
  const value = evaluateValueExpression(effect.value, token, params, functions, extraContext);
  const op = effect.op;
  if (op !== "set" && op !== "add" && op !== "mul") {
    throw new Error(`E_EFFECT_OP_UNSUPPORTED: unsupported effect op '${op}' in slice engine`);
  }

  if (runtime && fieldPath.length === 1) {
    const scalarField = fieldPath[0];
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
  rule: TokenLike,
  resolveTarget: (targetName: string) => TokenLike | null,
  params: RuntimeLike,
  functions: RuntimeLike,
  runtime: RuntimeLike,
  defaultTargetName = "current",
  extraContext: RuntimeLike | null = null
) {
  const effects = Array.isArray(rule.apply) ? rule.apply : [];
  for (const effect of effects) {
    const targetName = effect?.target ?? defaultTargetName;
    const target = resolveTarget(targetName);
    if (!target) {
      throw new Error(`E_EFFECT_TARGET_UNKNOWN: unknown effect target '${targetName}' in slice engine`);
    }
    applyEffectToToken(effect, target, params, functions, runtime, extraContext);
  }
}

function applyAssociationSpecs(
  specs: unknown,
  resolveTarget: (targetName: string) => TokenLike | null,
  status: unknown
): void {
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

function evaluateActionExpression(expr: unknown, context: RuntimeLike, functions: RuntimeLike): unknown {
  if (typeof expr === "string") {
    return evaluateExpression(expr, context, functions);
  }
  return expr;
}

function deepEvaluateTemplate(value: unknown, context: RuntimeLike, functions: RuntimeLike): unknown {
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

function nextInsertedTokenId(runtime: RuntimeLike, stream: unknown): string {
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

function ensureTokenSyncMarkRefs(
  token: TokenLike,
  runtime: RuntimeLike
): { leftId: string | null; rightId: string | null } {
  if (!token) return { leftId: null, rightId: null };
  const leftId = readTokenMarkId(token, runtime, "sync_left");
  const rightId = readTokenMarkId(token, runtime, "sync_right");
  return { leftId: leftId ?? null, rightId: rightId ?? null };
}

function withinClosedRange(token: TokenLike, leftId: string, rightId: string, runtime: RuntimeLike): boolean {
  const { leftId: tokenLeft, rightId: tokenRight } = ensureTokenSyncMarkRefs(token, runtime);
  if (!tokenLeft || !tokenRight) return false;
  return (
    compareMarkIds(runtime, leftId, tokenLeft) <= 0 &&
    compareMarkIds(runtime, tokenRight, rightId) <= 0
  );
}

function buildSpliceInsertions(
  insertSpecs: unknown,
  stream: string,
  bounds: { leftId: string; rightId: string },
  context: RuntimeLike,
  runtime: RuntimeLike,
  functions: RuntimeLike
): TokenLike[] {
  const specs = Array.isArray(insertSpecs) ? insertSpecs : [];
  if (specs.length === 0) return [];
  const segments = runtime.axis.splitMarkRange(bounds.leftId, bounds.rightId, specs.length);
  return specs.map((spec, index) => {
    const template = spec && typeof spec === "object" ? spec : {};
    const evaluated = deepEvaluateTemplate(template, context, functions);
    const markProps = buildRuntimeMarkProps(runtime, {
      sync_left: segments[index].leftId,
      sync_right: segments[index].rightId,
    });
    const token = {
      ...evaluated,
      stream: evaluated.stream ?? stream,
      status: TokenStatus.ACTIVE,
      ...markProps,
    };
    if (typeof token.id !== "string" || token.id.length === 0) {
      token.id = nextInsertedTokenId(runtime, token.stream);
    } else {
      runtime.usedTokenIds.add(token.id);
    }
    writeTokenMarkId(token, runtime, "sync_left", segments[index].leftId);
    writeTokenMarkId(token, runtime, "sync_right", segments[index].rightId);
    return token;
  });
}

function findInsertionIndexForRange(
  sequence: TokenLike[],
  stream: string,
  rightId: string,
  suppressedSet: Set<TokenLike>,
  runtime: RuntimeLike
): number {
  let minIndex = Number.POSITIVE_INFINITY;
  for (const token of suppressedSet) {
    const idx = sequence.indexOf(token);
    if (idx >= 0 && idx < minIndex) minIndex = idx;
  }
  if (Number.isFinite(minIndex)) return minIndex;

  for (let i = 0; i < sequence.length; i += 1) {
    const token = sequence[i];
    if (getTokenStream(token) !== stream) continue;
    const { leftId } = ensureTokenSyncMarkRefs(token, runtime);
    if (!leftId) continue;
    if (compareMarkIds(runtime, leftId, rightId) >= 0) return i;
  }
  return sequence.length;
}

type BoundaryAdjacency = {
  activeCount: number;
  leftTokenIndex: number;
  rightTokenIndex: number;
  leftNeighborLeftId: string | null;
  rightNeighborRightId: string | null;
};

function findBoundaryAdjacency(
  sequence: TokenLike[],
  stream: string,
  boundaryId: string,
  runtime: RuntimeLike
): BoundaryAdjacency {
  let activeCount = 0;
  let leftTokenIndex = -1;
  let rightTokenIndex = -1;
  let leftNeighborLeftId: string | null = null;
  let rightNeighborRightId: string | null = null;

  for (let i = 0; i < sequence.length; i += 1) {
    const token = sequence[i];
    if (!isActiveToken(token) || getTokenStream(token) !== stream) continue;
    activeCount += 1;
    const { leftId, rightId } = ensureTokenSyncMarkRefs(token, runtime);
    if (rightId && compareMarkIds(runtime, rightId, boundaryId) === 0) {
      leftTokenIndex = i;
      leftNeighborLeftId = leftId ?? null;
    }
    if (leftId && compareMarkIds(runtime, leftId, boundaryId) === 0 && rightTokenIndex < 0) {
      rightTokenIndex = i;
      rightNeighborRightId = rightId ?? null;
    }
  }

  return {
    activeCount,
    leftTokenIndex,
    rightTokenIndex,
    leftNeighborLeftId,
    rightNeighborRightId,
  };
}

function findInsertionIndexForBoundary(
  adjacency: BoundaryAdjacency,
  side: "before" | "after"
): number {
  const { leftTokenIndex, rightTokenIndex } = adjacency;

  if (side === "after") {
    if (leftTokenIndex >= 0) return leftTokenIndex + 1;
    if (rightTokenIndex >= 0) return rightTokenIndex;
  }
  if (rightTokenIndex >= 0) return rightTokenIndex;
  if (leftTokenIndex >= 0) return leftTokenIndex + 1;
  return 0;
}

function resolveBoundaryInsertBounds(
  runtime: RuntimeLike,
  boundaryId: string,
  side: "before" | "after",
  adjacency: BoundaryAdjacency
): { leftId: string; rightId: string } {
  const startId = runtime.axis.getMarkId({ kind: "START" });
  const endId = runtime.axis.getMarkId({ kind: "END" });
  if (typeof startId !== "string" || typeof endId !== "string") {
    throw new Error("E_SYNC_MARK_UNKNOWN: missing START/END sentinels on sync axis");
  }

  if (adjacency.activeCount === 0) {
    if (boundaryId !== startId) {
      throw new Error(
        "E_SPLICE_BOUNDARY_ADJACENT_REQUIRED: empty base stream insertion requires boundary START"
      );
    }
    return { leftId: startId, rightId: endId };
  }

  if (side === "after") {
    if (!adjacency.rightNeighborRightId) {
      throw new Error(
        "E_SPLICE_BOUNDARY_ADJACENT_REQUIRED: insert_at_boundary side=after requires right adjacency"
      );
    }
    return {
      leftId: boundaryId,
      rightId: adjacency.rightNeighborRightId,
    };
  }

  if (!adjacency.leftNeighborLeftId) {
    throw new Error(
      "E_SPLICE_BOUNDARY_ADJACENT_REQUIRED: insert_at_boundary side=before requires left adjacency"
    );
  }
  return {
    leftId: adjacency.leftNeighborLeftId,
    rightId: boundaryId,
  };
}

function applySpliceSpec(
  spliceSpec: TokenLike,
  resolveTarget: (targetName: string) => TokenLike | null,
  params: RuntimeLike,
  sequence: TokenLike[],
  runtime: RuntimeLike,
  functions: RuntimeLike,
  defaultTargetName = "current",
  extraContext: RuntimeLike | null = null
) {
  if (!spliceSpec || typeof spliceSpec !== "object") return;
  const targetName = spliceSpec.target ?? defaultTargetName;
  const target = resolveTarget(targetName);
  if (!target) {
    throw new Error(`E_SPLICE_TARGET_UNKNOWN: unknown splice target '${targetName}' in slice engine`);
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
    const leftExpr = evaluateActionExpression(spliceSpec.range_left, context, functions);
    const rightExpr = evaluateActionExpression(spliceSpec.range_right, context, functions);
    const leftId = resolveMarkId(runtime, leftExpr);
    const rightId = resolveMarkId(runtime, rightExpr);
    if (!leftId || !rightId) {
      throw new Error("E_SPLICE_RANGE_REQUIRED: replace_range splice requires range_left and range_right");
    }

    const suppressedSet = new Set(
      activeStreamTokens.filter((token) => withinClosedRange(token, leftId, rightId, runtime))
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
      rightId,
      suppressedSet,
      runtime
    );
    const inserts = buildSpliceInsertions(
      spliceSpec.insert,
      stream,
      { leftId, rightId },
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
    const boundaryExpr = evaluateActionExpression(spliceSpec.boundary, context, functions);
    const boundaryId = resolveMarkId(runtime, boundaryExpr);
    const side = spliceSpec.side === "before" ? "before" : "after";
    if (!boundaryId) {
      throw new Error("E_SPLICE_BOUNDARY_REQUIRED: insert_at_boundary splice requires boundary");
    }

    const adjacency = findBoundaryAdjacency(sequence, stream, boundaryId, runtime);
    const bounds = resolveBoundaryInsertBounds(runtime, boundaryId, side, adjacency);
    const insertionIndex = findInsertionIndexForBoundary(adjacency, side);
    const inserts = buildSpliceInsertions(
      spliceSpec.insert,
      stream,
      bounds,
      context,
      runtime,
      functions
    );
    if (inserts.length > 0) {
      sequence.splice(insertionIndex, 0, ...inserts);
    }
    return;
  }

  throw new Error(`E_SPLICE_TYPE_UNSUPPORTED: unsupported splice type '${spliceSpec.type}' in slice engine`);
}

function nextPointId(runtime: RuntimeLike, stream: string): string {
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

function evaluateAnchorExpression(
  expr: unknown,
  token: TokenLike,
  params: RuntimeLike,
  functions: RuntimeLike
): TokenLike {
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
  throw new Error(`E_POINT_ANCHOR_TYPE_UNSUPPORTED: unsupported point anchor expression type: ${typeof expr}`);
}

function applyInsertPointSpec(
  pointSpec: TokenLike,
  resolveTarget: (targetName: string) => TokenLike | null,
  params: RuntimeLike,
  sequence: TokenLike[],
  runtime: RuntimeLike,
  defaultTargetName = "current"
) {
  if (!pointSpec || typeof pointSpec !== "object") return;
  const stream = pointSpec.stream;
  if (typeof stream !== "string" || stream.length === 0) {
    throw new Error("E_POINT_STREAM_INVALID: insert_point.stream must be a non-empty string");
  }

  const targetName = pointSpec.target ?? defaultTargetName;
  const target = resolveTarget(targetName);
  if (!target) {
    throw new Error(`E_POINT_TARGET_UNKNOWN: unknown insert_point target '${targetName}' in slice engine`);
  }

  const activePointCount = sequence.filter(
    (token) => isActiveToken(token) && getTokenStream(token) === stream
  ).length;

  const pointFunctions = buildNavigationFunctions(sequence, runtime, {
    currentToken: target,
    pointCursorByStream: new Map([[stream, activePointCount]]),
  });
  const anchor = evaluateAnchorExpression(pointSpec.at, target, params, pointFunctions);
  const anchorLeftId = resolveMarkId(runtime, anchor.anchor_left);
  const anchorRightId = resolveMarkId(runtime, anchor.anchor_right);
  if (!anchorLeftId || !anchorRightId) {
    throw new Error("E_POINT_ANCHOR_UNKNOWN: insert_point.at resolved to unknown sync marks");
  }
  const value =
    pointSpec.value == null
      ? null
      : evaluateValueExpression(pointSpec.value, target, params, pointFunctions);

  const pointToken: TokenLike = {
    id: nextPointId(runtime, stream),
    stream,
    status: TokenStatus.ACTIVE,
    ...buildRuntimeMarkProps(runtime, {
      anchor_left: anchorLeftId,
      anchor_right: anchorRightId,
    }),
    ratio: anchor.ratio,
    value,
  };
  if (pointSpec.tag != null) {
    pointToken.tag = pointSpec.tag;
  }
  writeTokenMarkId(pointToken, runtime, "anchor_left", anchorLeftId);
  writeTokenMarkId(pointToken, runtime, "anchor_right", anchorRightId);
  sequence.push(pointToken);
}

function applySelectRule(rule: TokenLike, sequence: TokenLike[], runtime: RuntimeLike): TokenLike[] {
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
    runtime.trace?.push({
      type: "match",
      phase: runtime.currentPhase ?? null,
      rule: runtime.currentRuleName ?? null,
      mode: "select",
      token: token?.id ?? null,
    });

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
    runtime.trace?.push({
      type: "rewrite",
      phase: runtime.currentPhase ?? null,
      rule: runtime.currentRuleName ?? null,
      mode: "select",
      token: token?.id ?? null,
    });
  }

  return sequence;
}

function matchPatternFrom(
  activeTokens: TokenLike[],
  startIndex: number,
  pattern: TokenLike,
  params: RuntimeLike,
  functions: RuntimeLike
) {
  const captures: TokenLike = {};
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
    runtime.trace?.push({
      type: "match",
      phase: runtime.currentPhase ?? null,
      rule: runtime.currentRuleName ?? null,
      mode: "pattern",
      captures: Object.fromEntries(
        Object.entries(captures).map(([name, token]) => [name, token?.id ?? null])
      ),
    });

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
    runtime.trace?.push({
      type: "rewrite",
      phase: runtime.currentPhase ?? null,
      rule: runtime.currentRuleName ?? null,
      mode: "pattern",
      captures: Object.fromEntries(
        Object.entries(captures).map(([name, token]) => [name, token?.id ?? null])
      ),
    });
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
  throw new Error(`E_RULE_SHAPE: unsupported declarative slice rule op '${rule?.op}'`);
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

function annotateRuntimeRuleError(error, phaseName, ruleName) {
  const message =
    error instanceof Error ? error.message : typeof error === "string" ? error : String(error);
  const context = `phase=${phaseName} rule=${ruleName} path=rules.${ruleName}`;
  if (message.includes("path=rules.")) {
    return new Error(message);
  }
  return new Error(`${message} [${context}]`);
}

function collectReferencedMarkIds(sequence, runtime) {
  const marks = new Set();
  for (const token of sequence) {
    const syncLeftId = readTokenMarkId(token, runtime, "sync_left");
    const syncRightId = readTokenMarkId(token, runtime, "sync_right");
    const anchorLeftId = readTokenMarkId(token, runtime, "anchor_left");
    const anchorRightId = readTokenMarkId(token, runtime, "anchor_right");
    if (syncLeftId) marks.add(syncLeftId);
    if (syncRightId) marks.add(syncRightId);
    if (anchorLeftId) marks.add(anchorLeftId);
    if (anchorRightId) marks.add(anchorRightId);
  }
  return marks;
}

function describeMarkId(runtime, markId) {
  if (typeof markId !== "string") return String(markId);
  const mark = runtime?.axis?.getMarkById(markId);
  if (!mark) return markId;
  const order = mark.order;
  if (typeof order === "string") return `${markId}:${order}`;
  if (typeof order === "number") return `${markId}:${String(order)}`;
  try {
    return `${markId}:${JSON.stringify(order)}`;
  } catch {
    return markId;
  }
}

function interpolateMarkTimes(runtime, referencedMarkIds) {
  const unresolved = new Set(
    [...referencedMarkIds].filter((markId) => !Number.isFinite(runtime.axis.getMarkTime(markId)))
  );
  if (unresolved.size === 0) return;

  let progressed = true;
  while (progressed && unresolved.size > 0) {
    progressed = false;
    const timedMarks = [...runtime.axis.marks.keys()].filter((markId) =>
      Number.isFinite(runtime.axis.getMarkTime(markId))
    );

    for (const markId of [...unresolved]) {
      let leftBound = null;
      let rightBound = null;

      for (const timed of timedMarks) {
        const cmp = compareMarkIds(runtime, timed, markId);
        if (cmp <= 0) {
          if (leftBound == null || compareMarkIds(runtime, leftBound, timed) <= 0) {
            leftBound = timed;
          }
        }
        if (cmp >= 0) {
          if (rightBound == null || compareMarkIds(runtime, timed, rightBound) <= 0) {
            rightBound = timed;
          }
        }
      }

      if (leftBound == null || rightBound == null) continue;
      const leftTime = Number(runtime.axis.getMarkTime(leftBound));
      const rightTime = Number(runtime.axis.getMarkTime(rightBound));
      if (!Number.isFinite(leftTime) || !Number.isFinite(rightTime)) continue;

      if (compareMarkIds(runtime, leftBound, rightBound) === 0) {
        runtime.axis.setMarkTime(markId, leftTime);
        unresolved.delete(markId);
        progressed = true;
        continue;
      }

      const leftOrder = toNumericOrder(getOrderForMarkId(runtime, leftBound));
      const rightOrder = toNumericOrder(getOrderForMarkId(runtime, rightBound));
      const currentOrder = toNumericOrder(getOrderForMarkId(runtime, markId));
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
      runtime.axis.setMarkTime(markId, interpolated);
      unresolved.delete(markId);
      progressed = true;
    }
  }

  if (unresolved.size > 0) {
    const unknown = [...unresolved].map((markId) => describeMarkId(runtime, markId)).join(", ");
    throw new Error(`E_TIME_NO_BASE_SUPPORT: unable to assign times for marks: ${unknown}`);
  }
}

function computeSyncTimes(sequence, runtime) {
  for (const mark of runtime.axis.marks.values()) {
    mark.time = null;
  }
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
      const leftBounds = ensureTokenSyncMarkRefs(left, runtime);
      const rightBounds = ensureTokenSyncMarkRefs(right, runtime);
      const byLeft = compareMarkIds(runtime, leftBounds.leftId, rightBounds.leftId);
      if (byLeft !== 0) return byLeft;
      const byRight = compareMarkIds(runtime, leftBounds.rightId, rightBounds.rightId);
      if (byRight !== 0) return byRight;
      return compareOrderValue(left.id ?? "", right.id ?? "");
    });

  let cursor = 0;
  for (const token of activeBase) {
    const { leftId, rightId } = ensureTokenSyncMarkRefs(token, runtime);
    if (!leftId || !rightId) continue;
    const existingLeft = runtime.axis.getMarkTime(leftId);
    if (Number.isFinite(existingLeft)) {
      cursor = Number(existingLeft);
    } else {
      runtime.axis.setMarkTime(leftId, cursor);
    }

    const duration = Number.isFinite(token.duration) ? Number(token.duration) : 0;
    const proposedRight = cursor + duration;
    const existingRight = runtime.axis.getMarkTime(rightId);
    const rightTime = Number.isFinite(existingRight)
      ? Math.max(Number(existingRight), proposedRight)
      : proposedRight;
    runtime.axis.setMarkTime(rightId, rightTime);
    cursor = rightTime;
  }

  const referencedMarks = collectReferencedMarkIds(sequence, runtime);
  interpolateMarkTimes(runtime, referencedMarks);
}

function resolvePointTimes(sequence, runtime, pointStreams) {
  const selected =
    Array.isArray(pointStreams) && pointStreams.length > 0
      ? new Set(pointStreams)
      : runtime.pointStreams;

  for (const token of sequence) {
    if (!isActiveToken(token)) continue;
    const stream = getTokenStream(token);
    if (!selected.has(stream)) continue;
    const leftId = readTokenMarkId(token, runtime, "anchor_left");
    const rightId = readTokenMarkId(token, runtime, "anchor_right");
    if (!leftId || !rightId) continue;
    const left = runtime.axis.getMarkTime(leftId);
    const right = runtime.axis.getMarkTime(rightId);
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
    const hasAnyStreamToken = sequence.some((token) => getTokenStream(token) === stream);
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
        const leftBounds = ensureTokenSyncMarkRefs(left, runtime);
        const rightBounds = ensureTokenSyncMarkRefs(right, runtime);
        const byLeft = compareMarkIds(runtime, leftBounds.leftId, rightBounds.leftId);
        if (byLeft !== 0) return byLeft;
        const byRight = compareMarkIds(runtime, leftBounds.rightId, rightBounds.rightId);
        if (byRight !== 0) return byRight;
        return compareOrderValue(left.id ?? "", right.id ?? "");
      });

    if (active.length === 0) {
      if (hasAnyStreamToken) {
        throw new Error(
          `E_BASE_NOT_CONTIGUOUS: stream '${stream}' has no ACTIVE tokens to cover [START, END]`
        );
      }
      continue;
    }

    const first = active[0];
    const last = active[active.length - 1];
    const firstBounds = ensureTokenSyncMarkRefs(first, runtime);
    const lastBounds = ensureTokenSyncMarkRefs(last, runtime);
    const firstLeftOrder = getOrderForMarkId(runtime, firstBounds.leftId);
    const lastRightOrder = getOrderForMarkId(runtime, lastBounds.rightId);
    if (!isStartOrder(firstLeftOrder)) {
      throw new Error(
        `E_BASE_NOT_CONTIGUOUS: stream '${stream}' active base does not start at START`
      );
    }
    if (!isEndOrder(lastRightOrder)) {
      throw new Error(
        `E_BASE_NOT_CONTIGUOUS: stream '${stream}' active base does not end at END`
      );
    }

    for (let i = 0; i + 1 < active.length; i += 1) {
      const left = active[i];
      const right = active[i + 1];
      const leftBounds = ensureTokenSyncMarkRefs(left, runtime);
      const rightBounds = ensureTokenSyncMarkRefs(right, runtime);
      const cmp = compareMarkIds(runtime, leftBounds.rightId, rightBounds.leftId);
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

type RunRuleEngineOptions = {
  phases?: string[];
  parameters?: Record<string, unknown>;
  inventoryResolver?: InventoryResolver;
};

export function runRuleEngine(sequence, specSource, options: RunRuleEngineOptions = {}) {
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
  const allScalarFields = new Set(
    [...scalarSpecsByStream.values()].flatMap((scalars) =>
      scalars && typeof scalars === "object" ? Object.keys(scalars) : []
    )
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
    allScalarFields,
    scalarStates: new Map(),
    scalarEffectOrder: 0,
    currentRuleName: null,
    currentPhase: null,
    usedTokenIds,
    axis: null,
    tokenMarkRefs: new WeakMap(),
    trace: null,
    finalized: false,
    inventoryResolver:
      typeof options.inventoryResolver === "function" ? options.inventoryResolver : null,
  };

  initializeBaseStreamSyncMarks(current, baseStreams);
  runtime.axis = buildSyncAxis(current);
  canonicalizeSequenceAxisRefs(current, runtime);

  const selectedPhases = Array.isArray(options.phases) && options.phases.length > 0
    ? new Set(options.phases)
    : null;

  const trace = [];
  runtime.trace = trace;

  for (const phase of spec.phases) {
    if (selectedPhases && !selectedPhases.has(phase.name)) continue;
    runtime.currentPhase = phase.name;
    const phaseScalarFields = resolvePhaseScalarFields(phase, runtime);
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
      try {
        current = applyRule(rule, current, runtime);
      } catch (error) {
        trace.push({
          type: "error",
          phase: phase.name,
          rule: ruleName,
          message:
            error instanceof Error ? error.message : typeof error === "string" ? error : String(error),
        });
        throw annotateRuntimeRuleError(error, phase.name, ruleName);
      }
      trace.push({ type: "rule_end", phase: phase.name, rule: ruleName });
      runtime.currentRuleName = null;
    }
    if (phaseScalarFields.length > 0) {
      const resolved = resolveScalars(current, runtime, phaseScalarFields);
      const hadExplicitResolveList =
        Array.isArray(phase.resolve_scalars) && phase.resolve_scalars.length > 0;
      if (resolved > 0 || hadExplicitResolveList) {
        trace.push({
          type: "scalars_resolved",
          phase: phase.name,
          fields: phaseScalarFields,
          count: resolved,
        });
      }
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
    trace.push({ type: "phase_end", phase: phase.name });
    runtime.currentPhase = null;
  }

  return {
    sequence: current,
    diagnostics,
    trace,
    axis: runtime.axis,
  };
}
