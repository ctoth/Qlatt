import { parseDslSpec, SPEC_VALIDATED } from "./parser";
import { assertValidSpec } from "./validation";
import { evaluateExpression } from "./cel-expressions";
import { passesPrefilter } from "./where-prefilter";
import type { Prefilter } from "./where-prefilter";
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

/**
 * Internal engine token type. Intentionally loose (`any` index) because the
 * rule engine dynamically reads/writes arbitrary fields injected by YAML rules.
 *
 * At module boundaries, prefer the typed {@link EngineToken} union from
 * `tts-frontend-types.ts` (PhoneToken | F0PointToken).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TokenLike = Record<string, any>;
/**
 * Internal runtime state bag. Holds evaluation context, spec data, axis, etc.
 * Intentionally untyped — the engine is the only consumer.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RuntimeLike = Record<string, any>;
export type InventoryResolver = (phoneme: string) => Record<string, unknown> | null | undefined;
type TokenMarkRef = { raw: unknown; id: string };
type NavigationBundle = {
  functions: Record<string, (...args: any[]) => unknown>;
  buildContext: (
    token: TokenLike,
    params: RuntimeLike,
    extraContext?: RuntimeLike | null
  ) => RuntimeLike;
  evaluateCondition: (
    condition: unknown,
    token: TokenLike,
    params: RuntimeLike,
    extraContext?: RuntimeLike | null
  ) => boolean;
  rebindCurrentToken: (
    token: TokenLike | null,
    pointCursor?: Map<string, number> | null
  ) => void;
  invalidateStreamCache: () => void;
};

function isTokenLike(value: unknown): value is TokenLike {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  return (
    Object.prototype.hasOwnProperty.call(value, "stream") ||
    Object.prototype.hasOwnProperty.call(value, "sync_left") ||
    Object.prototype.hasOwnProperty.call(value, "sync_right") ||
    Object.prototype.hasOwnProperty.call(value, "anchor_left") ||
    Object.prototype.hasOwnProperty.call(value, "anchor_right") ||
    Object.prototype.hasOwnProperty.call(value, "status")
  );
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function cloneRuntimeValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => cloneRuntimeValue(entry));
  }
  if (isPlainObject(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, cloneRuntimeValue(entry)])
    );
  }
  return value;
}

function projectPolicyValues(node: unknown): unknown {
  if (!isPlainObject(node)) return cloneRuntimeValue(node);
  if (Object.prototype.hasOwnProperty.call(node, "value")) {
    return cloneRuntimeValue(node.value);
  }
  return Object.fromEntries(
    Object.entries(node).map(([key, entry]) => [key, projectPolicyValues(entry)])
  );
}

function normalizeParameterTree(parameters: unknown): Record<string, unknown> {
  if (!isPlainObject(parameters)) return {};
  const clone = cloneRuntimeValue(parameters) as Record<string, unknown>;
  if (Object.prototype.hasOwnProperty.call(clone, "policy")) {
    clone.policy = projectPolicyValues(clone.policy);
  }
  return clone;
}

function deepMergeRecords(
  base: Record<string, unknown>,
  override: Record<string, unknown>
): Record<string, unknown> {
  const merged: Record<string, unknown> = { ...base };
  for (const [key, value] of Object.entries(override)) {
    const current = merged[key];
    if (isPlainObject(current) && isPlainObject(value)) {
      merged[key] = deepMergeRecords(current, value);
      continue;
    }
    merged[key] = cloneRuntimeValue(value);
  }
  return merged;
}

function buildRuntimeParams(
  specParameters: unknown,
  overrideParameters: unknown
): Record<string, unknown> {
  const base = normalizeParameterTree(specParameters);
  const override = normalizeParameterTree(overrideParameters);
  return deepMergeRecords(base, override);
}

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
): NavigationBundle {
  let currentToken = options.currentToken ?? null;
  let pointCursorByStream: Map<string, number> | null =
    options.pointCursorByStream instanceof Map ? options.pointCursorByStream : null;
  const cache = new Map<string, TokenLike[]>();
  const indexMaps = new Map<string, Map<TokenLike, number>>();
  const activeById = new Map();
  let activeIdIndexComplete = false;
  const ensureActiveIdIndex = () => {
    if (activeIdIndexComplete) return;
    for (const candidate of sequence) {
      if (!isActiveToken(candidate)) continue;
      if (candidate?.id != null && !activeById.has(candidate.id)) {
        activeById.set(candidate.id, candidate);
      }
    }
    activeIdIndexComplete = true;
  };

  const getActiveStreamTokens = (stream: string): TokenLike[] => {
    const key = stream || "phone";
    if (cache.has(key)) return cache.get(key)!;
    let active = sequence.filter(
      (token) => isActiveToken(token) && getTokenStream(token) === key
    );
    if (runtime?.pointStreams?.has(key)) {
      active = active.slice().sort((left, right) => comparePointTokenOrder(left, right, runtime));
    }
    cache.set(key, active);
    // Build index map alongside cache for O(1) indexOf replacement
    const idxMap = new Map<TokenLike, number>();
    for (let i = 0; i < active.length; i++) {
      idxMap.set(active[i], i);
      if (active[i]?.id != null && !activeById.has(active[i].id)) {
        activeById.set(active[i].id, active[i]);
      }
    }
    indexMaps.set(key, idxMap);
    return active;
  };

  const getTokenIndex = (token: TokenLike, stream: string): number => {
    const key = stream || "phone";
    getActiveStreamTokens(key); // ensures cache + indexMap are populated
    return indexMaps.get(key)?.get(token) ?? -1;
  };

  const getIndex = (token: TokenLike): number => {
    const stream = getTokenStream(token);
    return getTokenIndex(token, stream);
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
      return getTokenIndex(currentToken, stream);
    }
    // Cross-stream lookup: when the current token's stream differs from the
    // requested point stream (e.g. phone-stream rule asking for prev_point('f0')),
    // find the last point in the target stream whose anchor is temporally at or
    // before the current token's right boundary.  Return cursor = lastIndex + 1
    // so that prevPointFn (which subtracts 1) yields that point.
    if (
      currentToken &&
      isActiveToken(currentToken) &&
      runtime?.pointStreams?.has(stream)
    ) {
      const currentBounds = getTokenBounds(currentToken, runtime);
      if (currentBounds && currentBounds.right != null) {
        const points = getActiveStreamTokens(stream);
        let lastBefore = -1;
        for (let i = 0; i < points.length; i++) {
          const pointBounds = getTokenBounds(points[i], runtime);
          if (
            pointBounds &&
            pointBounds.left != null &&
            compareOrderValue(pointBounds.left, currentBounds.right) <= 0
          ) {
            lastBefore = i;
          }
        }
        if (lastBefore >= 0) {
          return lastBefore + 1;
        }
      }
    }
    return -1;
  };

  const isPhonePhraseBoundary = (token: TokenLike): boolean =>
    token?.phoneme === "SIL" && token?.punctuationSymbol != null;

  const getPhraseWindow = (token: TokenLike): { index: number; total: number } => {
    const stream = getTokenStream(token);
    const active = getActiveStreamTokens(stream);
    const index = getTokenIndex(token, stream);
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

  const getPrevToken = (token: TokenLike): TokenLike | null => {
    const stream = getTokenStream(token);
    const active = getActiveStreamTokens(stream);
    const index = getTokenIndex(token, stream);
    if (index <= 0) return null;
    return active[index - 1];
  };

  const getNextToken = (token: TokenLike): TokenLike | null => {
    const stream = getTokenStream(token);
    const active = getActiveStreamTokens(stream);
    const index = getTokenIndex(token, stream);
    if (index < 0 || index + 1 >= active.length) return null;
    return active[index + 1];
  };

  const resolveLiveToken = (tokenRef: unknown): TokenLike | null => {
    if (!tokenRef || typeof tokenRef !== "object" || Array.isArray(tokenRef)) return null;
    const tokenLike = tokenRef as TokenLike;
    const embedded = viewToOriginal.get(tokenLike);
    if (embedded && sequence.includes(embedded)) {
      return embedded;
    }
    const id = typeof tokenLike.id === "string" && tokenLike.id.length > 0 ? tokenLike.id : null;
    if (id) {
      ensureActiveIdIndex();
      return activeById.get(id) ?? null;
    }
    if (sequence.includes(tokenLike)) return tokenLike;
    return null;
  };

  const getRelativeToken = (tokenRef: unknown, offset: unknown): TokenLike | null => {
    const token = resolveLiveToken(tokenRef);
    if (!token) return null;
    const delta = Math.trunc(Number(offset));
    if (!Number.isFinite(delta)) return null;
    if (delta === 0) return token;
    const stream = getTokenStream(token);
    const active = getActiveStreamTokens(stream);
    const index = getTokenIndex(token, stream);
    const nextIndex = index + delta;
    if (index < 0 || nextIndex < 0 || nextIndex >= active.length) return null;
    return active[nextIndex];
  };

  const getParentToken = (token: TokenLike): TokenLike | null => {
    if (!token || token.parent == null) return null;
    if (!activeById.has(token.parent)) ensureActiveIdIndex();
    return activeById.get(token.parent) ?? null;
  };

  const resolveAncestorInStream = (token: TokenLike, stream: string): TokenLike | null => {
    let cursor = getParentToken(token);
    while (cursor) {
      if (getTokenStream(cursor) === stream) return cursor;
      cursor = getParentToken(cursor);
    }
    return null;
  };

  const hierarchyStreams =
    runtime?.hierarchyStreams instanceof Set ? [...runtime.hierarchyStreams] : [];
  const viewCache = new WeakMap<TokenLike, TokenLike>();
  const viewToOriginal = new WeakMap<TokenLike, TokenLike>();

  const toCursorView = (token: TokenLike | null, seen: Set<TokenLike> = new Set()): TokenLike | null => {
    if (!token) return null;
    if (viewCache.has(token)) return viewCache.get(token) ?? null;
    const view: TokenLike = { ...token };
    viewToOriginal.set(view, token);
    viewCache.set(token, view);
    if (seen.has(token)) return view;

    const nextSeen = new Set(seen);
    nextSeen.add(token);
    for (const streamName of hierarchyStreams) {
      const ancestor = resolveAncestorInStream(token, streamName);
      view[streamName] = ancestor ? toCursorView(ancestor, nextSeen) : null;
    }
    return view;
  };

  const toContextValue = (value: unknown): unknown => {
    if (isTokenLike(value)) return toCursorView(value);
    if (Array.isArray(value)) return value.map((entry) => toContextValue(entry));
    if (value && typeof value === "object") {
      const entries = Object.entries(value).map(([key, entry]) => [key, toContextValue(entry)]);
      return Object.fromEntries(entries);
    }
    return value;
  };

  // Fully lazy buildContext: ALL navigation lookups (getPrevToken, getNextToken,
  // getPhraseWindow, getIndex) are deferred until the CEL expression actually
  // accesses the corresponding property. Most where-clauses only touch
  // current.phoneme — prev, next, phrase_index, phrase_total, current_index are
  // never accessed and their O(n) lookups are entirely skipped.
  // phrase_index and phrase_total share a single getPhraseWindow call — accessing
  // either one caches both.
  const LAZY_PROPS = new Set([
    'current', 'prev', 'next',
    'current_index', 'phrase_index', 'phrase_total',
  ]);
  const buildContext = (
    token: TokenLike,
    params: RuntimeLike,
    extraContext: RuntimeLike | null = null
  ): RuntimeLike => {
    const extra = extraContext && typeof extraContext === "object" ? extraContext : {};
    const current = isTokenLike(extra.current) ? (extra.current as TokenLike) : token;
    const target: RuntimeLike = {
      params: params ?? {},
    };
    for (const [key, value] of Object.entries(extra)) {
      if (key === "params") continue;
      target[key] = toContextValue(value);
    }
    const context: RuntimeLike = new Proxy(target, {
      get(obj, prop) {
        if (prop in obj) return (obj as any)[prop];
        switch (prop) {
          case 'current':
            return (obj as any).current = toCursorView(current);
          case 'prev': {
            const p = getPrevToken(current);
            return (obj as any).prev = p ? toCursorView(p) : null;
          }
          case 'next': {
            const n = getNextToken(current);
            return (obj as any).next = n ? toCursorView(n) : null;
          }
          case 'current_index':
            return (obj as any).current_index = getIndex(current);
          case 'phrase_index': {
            const w = getPhraseWindow(current);
            (obj as any).phrase_total = w.total;
            return (obj as any).phrase_index = w.index;
          }
          case 'phrase_total': {
            const w = getPhraseWindow(current);
            (obj as any).phrase_index = w.index;
            return (obj as any).phrase_total = w.total;
          }
        }
        return undefined;
      },
      set(obj, prop, value) {
        (obj as any)[prop] = value;
        return true;
      },
      has(obj, prop) {
        if (prop in obj) return true;
        return LAZY_PROPS.has(prop as string);
      }
    });
    return context;
  };

  const midpointFn = (token: TokenLike) => {
    const bounds = getTokenBounds(token, runtime);
    if (!bounds) return null;
    return normalizeAnchor(
      { anchor_left: bounds.left, anchor_right: bounds.right, ratio: 0.5 },
      token
    );
  };

  const atRatioFn = (token: TokenLike, ratio: number) => {
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
  };

  const atSyncFn = (syncMark: unknown) =>
    normalizeAnchor({ anchor_left: syncMark, anchor_right: syncMark, ratio: 0 });

  const targetFn = (phoneme: string) => {
    const payload = materializeInventoryTarget(phoneme, runtime);
    return {
      ...payload,
      params: { ...payload.params },
    };
  };

  const totalFn = (stream: string) => {
    const streamName = typeof stream === "string" ? stream : "";
    if (!streamName) return 0;
    if (runtime?.knownStreams instanceof Set && !runtime.knownStreams.has(streamName)) {
      throw new Error(`E_STREAM_UNKNOWN: unknown stream '${streamName}' in total()`);
    }
    return getActiveStreamTokens(streamName).length;
  };

  const prevPointFn = (stream: string) => {
    const streamName = typeof stream === "string" && stream.length > 0 ? stream : null;
    if (!streamName || !runtime?.pointStreams?.has(streamName)) return null;
    const points = getActiveStreamTokens(streamName);
    const cursor = getPointCursor(streamName);
    const index = cursor >= 0 ? cursor - 1 : points.length - 1;
    if (index < 0 || index >= points.length) return null;
    return toCursorView(points[index]);
  };

  const assocFn = (token: TokenLike, assocName: string) => {
    if (!token || typeof assocName !== "string" || assocName.length === 0) return [];
    ensureActiveIdIndex();
    const entries = getAssociationEntries(token, assocName);
    return entries
      .filter(
        (entry: { to: string; status: number }) =>
          normalizeTokenStatus(entry.status) === TokenStatus.ACTIVE
      )
      .map((entry: { to: string; status: number }) => activeById.get(entry.to))
      .filter((candidate: TokenLike | undefined) => candidate != null)
      .map((candidate: TokenLike) => toCursorView(candidate));
  };

  const maxFn = (...args: unknown[]): number => {
    const source = args.length === 1 && Array.isArray(args[0]) ? (args[0] as unknown[]) : args;
    const values = source.map((value) => Number(value)).filter((value) => Number.isFinite(value));
    if (values.length === 0) return Number.NEGATIVE_INFINITY;
    return Math.max(...values);
  };

  const minFn = (...args: unknown[]): number => {
    const source = args.length === 1 && Array.isArray(args[0]) ? (args[0] as unknown[]) : args;
    const values = source.map((value) => Number(value)).filter((value) => Number.isFinite(value));
    if (values.length === 0) return Number.POSITIVE_INFINITY;
    return Math.min(...values);
  };

  const mergeFn = (base: unknown, patch: unknown): Record<string, unknown> => {
    const lhs =
      base && typeof base === "object" && !Array.isArray(base)
        ? (base as Record<string, unknown>)
        : {};
    const rhs =
      patch && typeof patch === "object" && !Array.isArray(patch)
        ? (patch as Record<string, unknown>)
        : {};
    return { ...lhs, ...rhs };
  };

  const runtimeParams =
    runtime?.params && typeof runtime.params === "object" ? runtime.params : {};
  const predicateLibrary =
    runtime?.predicates && typeof runtime.predicates === "object" && !Array.isArray(runtime.predicates)
      ? (runtime.predicates as Record<string, unknown>)
      : {};

  const evaluateConditionInContext = (
    condition: unknown,
    context: RuntimeLike,
    predicateStack: Set<string> = new Set()
  ): boolean => {
    if (condition == null || condition === true || condition === "true") return true;

    if (typeof condition === "string") {
      return Boolean(evaluateExpression(condition, context, functions));
    }

    if (!condition || typeof condition !== "object" || Array.isArray(condition)) {
      throw new Error("E_CONDITION_INVALID: condition must be a string or condition object");
    }

    const keys = Object.keys(condition);
    if (keys.length !== 1) {
      throw new Error(
        "E_CONDITION_INVALID: condition object must contain exactly one of expr/predicate/all/any/not"
      );
    }

    const key = keys[0];
    const value = (condition as TokenLike)[key];
    if (key === "expr") {
      if (typeof value !== "string") {
        throw new Error("E_CONDITION_INVALID: expr condition must be a string");
      }
      return Boolean(evaluateExpression(value, context, functions));
    }
    if (key === "predicate") {
      if (typeof value !== "string" || value.length === 0) {
        throw new Error("E_CONDITION_INVALID: predicate condition must be a non-empty string");
      }
      if (!Object.prototype.hasOwnProperty.call(predicateLibrary, value)) {
        throw new Error(`E_PREDICATE_UNKNOWN: unknown predicate '${value}'`);
      }
      if (predicateStack.has(value)) {
        const chain = [...predicateStack, value].join(" -> ");
        throw new Error(`E_PREDICATE_CYCLE: predicate cycle detected (${chain})`);
      }
      const nextStack = new Set(predicateStack);
      nextStack.add(value);
      return evaluateConditionInContext(predicateLibrary[value], context, nextStack);
    }
    if (key === "all") {
      if (!Array.isArray(value)) {
        throw new Error("E_CONDITION_INVALID: all condition must be an array");
      }
      for (const branch of value) {
        if (!evaluateConditionInContext(branch, context, predicateStack)) return false;
      }
      return true;
    }
    if (key === "any") {
      if (!Array.isArray(value)) {
        throw new Error("E_CONDITION_INVALID: any condition must be an array");
      }
      for (const branch of value) {
        if (evaluateConditionInContext(branch, context, predicateStack)) return true;
      }
      return false;
    }
    if (key === "not") {
      return !evaluateConditionInContext(value, context, predicateStack);
    }

    throw new Error(
      `E_CONDITION_INVALID: unknown condition key '${key}' (expected expr/predicate/all/any/not)`
    );
  };

  const evaluateConditionForToken = (
    condition: unknown,
    token: TokenLike,
    params: RuntimeLike,
    extraContext: RuntimeLike | null = null
  ): boolean => {
    const context = buildContext(token, params, extraContext);
    return evaluateConditionInContext(condition, context);
  };

  const scanWhere = (
    tokenRef: unknown,
    maxSteps: unknown,
    predicate: unknown,
    direction: -1 | 1,
    tag: "lookback" | "lookahead"
  ): TokenLike | null => {
    const source = resolveLiveToken(tokenRef);
    if (!source) return null;

    const steps = Math.trunc(Number(maxSteps));
    if (!Number.isFinite(steps) || steps <= 0) return null;

    const stream = getTokenStream(source);
    const active = getActiveStreamTokens(stream);
    const sourceIndex = getTokenIndex(source, stream);
    if (sourceIndex < 0) return null;

    const maxAvailable =
      direction < 0 ? sourceIndex : Math.max(0, active.length - sourceIndex - 1);
    const limit = Math.min(steps, maxAvailable);
    for (let offset = 1; offset <= limit; offset += 1) {
      const candidate = active[sourceIndex + direction * offset];
      if (!candidate) continue;
      const context = buildContext(candidate, runtimeParams, {
        source,
        candidate,
        [`${tag}_offset`]: offset,
      });
      if (evaluateConditionInContext(predicate, context)) {
        return toCursorView(candidate);
      }
    }
    return null;
  };

  const lookBackWhereFn = (
    tokenRef: unknown,
    maxSteps: unknown = 1,
    predicateExpr: unknown
  ): TokenLike | null => scanWhere(tokenRef, maxSteps, predicateExpr, -1, "lookback");

  const lookBackPredFn = (
    tokenRef: unknown,
    maxSteps: unknown = 1,
    predicateName: unknown
  ): TokenLike | null => {
    const name = typeof predicateName === "string" ? predicateName.trim() : "";
    if (!name) return null;
    return scanWhere(tokenRef, maxSteps, { predicate: name }, -1, "lookback");
  };

  const lookAheadPredFn = (
    tokenRef: unknown,
    maxSteps: unknown = 1,
    predicateName: unknown
  ): TokenLike | null => {
    const name = typeof predicateName === "string" ? predicateName.trim() : "";
    if (!name) return null;
    return scanWhere(tokenRef, maxSteps, { predicate: name }, 1, "lookahead");
  };

  const functions = {
    midpoint: midpointFn,
    at_ratio: atRatioFn,
    at_sync: atSyncFn,
    prev_point: prevPointFn,
    ahead: (token: unknown, n: unknown = 1) => {
      const steps = Math.trunc(Number(n));
      if (!Number.isFinite(steps) || steps < 0) return null;
      return toCursorView(getRelativeToken(token, steps));
    },
    behind: (token: unknown, n: unknown = 1) => {
      const steps = Math.trunc(Number(n));
      if (!Number.isFinite(steps) || steps < 0) return null;
      return toCursorView(getRelativeToken(token, -steps));
    },
    total: totalFn,
    target: targetFn,
    assoc: assocFn,
    double: (value: unknown) => Number(value),
    string: (value: unknown) => String(value),
    max: maxFn,
    min: minFn,
    exp: (x: unknown) => Math.exp(Number(x)),
    sqrt: (x: unknown) => Math.sqrt(Number(x)),
    abs: (x: unknown) => Math.abs(Number(x)),
    log: (x: unknown) => Math.log(Number(x)),
    contains: (haystack: unknown, needle: unknown) =>
      String(haystack ?? "").includes(String(needle ?? "")),
    merge: mergeFn,
    look_back_where: lookBackWhereFn,
    look_back_pred: lookBackPredFn,
    look_ahead_pred: lookAheadPredFn,
  };

  const rebindCurrentToken = (
    token: TokenLike | null,
    pointCursor: Map<string, number> | null = null
  ): void => {
    currentToken = token;
    pointCursorByStream = pointCursor;
  };

  const invalidateStreamCache = (): void => {
    cache.clear();
    indexMaps.clear();
    activeIdIndexComplete = false;
  };

  return {
    functions,
    buildContext,
    evaluateCondition: evaluateConditionForToken,
    rebindCurrentToken,
    invalidateStreamCache,
  };
}

function evaluateValueExpression(
  expr: unknown,
  token: TokenLike,
  params: RuntimeLike,
  navigation: NavigationBundle,
  extraContext: RuntimeLike | null = null
): number {
  const context = navigation.buildContext(token, params, extraContext);
  const value = evaluateActionExpression(expr, context, navigation);
  if (!Number.isFinite(value)) {
    throw new Error(
      `E_EXPR_NONFINITE: expression '${typeof expr === "string" ? expr : JSON.stringify(expr)}' did not evaluate to a finite number`
    );
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
  const orderedEffects = (Array.isArray(state.effects) ? state.effects : [])
    .slice()
    .sort((left: TokenLike, right: TokenLike) => Number(left.order) - Number(right.order));

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
  navigation: NavigationBundle,
  runtime: RuntimeLike,
  extraContext: RuntimeLike | null = null
): void {
  if (!effect || typeof effect !== "object") return;
  const field = typeof effect.field === "string" ? effect.field : "";
  if (!field) return;
  const hasValueExpr = Object.prototype.hasOwnProperty.call(effect, "value");
  const hasDispatchExpr = Object.prototype.hasOwnProperty.call(effect, "dispatch");
  if (hasValueExpr && hasDispatchExpr) {
    throw new Error("E_DISPATCH_AND_VALUE: effect cannot specify both value and dispatch");
  }
  const valueExpr = hasDispatchExpr ? { dispatch: effect.dispatch } : effect.value;

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
  const value = evaluateValueExpression(valueExpr, token, params, navigation, extraContext);
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
  navigation: NavigationBundle,
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
    applyEffectToToken(effect, target, params, navigation, runtime, extraContext);
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

function evaluateActionExpression(
  expr: unknown,
  context: RuntimeLike,
  navigation: NavigationBundle
): unknown {
  if (expr && typeof expr === "object" && !Array.isArray(expr) && Array.isArray((expr as TokenLike).dispatch)) {
    const rows = (expr as TokenLike).dispatch as unknown[];
    let hasDefault = false;
    let defaultExpr: unknown = null;
    for (const row of rows) {
      if (!row || typeof row !== "object" || Array.isArray(row)) continue;
      const dispatchRow = row as TokenLike;
      if (Object.prototype.hasOwnProperty.call(dispatchRow, "when")) {
        const condition = evaluateActionExpression(dispatchRow.when, context, navigation);
        if (Boolean(condition)) {
          return evaluateActionExpression(dispatchRow.value, context, navigation);
        }
      }
      if (Object.prototype.hasOwnProperty.call(dispatchRow, "default")) {
        hasDefault = true;
        defaultExpr = dispatchRow.default;
      }
    }
    if (!hasDefault) {
      throw new Error("E_DISPATCH_NO_DEFAULT: dispatch block requires a default clause");
    }
    return evaluateActionExpression(defaultExpr, context, navigation);
  }
  if (typeof expr === "string") {
    return evaluateExpression(expr, context, navigation.functions);
  }
  return expr;
}

function deepEvaluateTemplate(
  value: unknown,
  context: RuntimeLike,
  navigation: NavigationBundle
): unknown {
  if (value && typeof value === "object" && !Array.isArray(value) && Array.isArray((value as TokenLike).dispatch)) {
    return evaluateActionExpression(value, context, navigation);
  }
  if (typeof value === "string") {
    return evaluateExpression(value, context, navigation.functions);
  }
  if (Array.isArray(value)) {
    return value.map((item) => deepEvaluateTemplate(item, context, navigation));
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        deepEvaluateTemplate(item, context, navigation),
      ])
    );
  }
  return value;
}

const RESERVED_SPLICE_COPY_FIELDS = new Set([
  "id",
  "stream",
  "status",
  "sync_left",
  "sync_right",
  "anchor_left",
  "anchor_right",
]);

function cloneTemplateData(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => cloneTemplateData(item));
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, cloneTemplateData(item)])
    );
  }
  return value;
}

function materializeSpliceCopyFields(
  template: TokenLike,
  context: RuntimeLike,
  navigation: NavigationBundle
): TokenLike {
  if (!Object.prototype.hasOwnProperty.call(template, "copy_from")) return {};
  const source = evaluateActionExpression(template.copy_from, context, navigation);
  if (!source || typeof source !== "object" || Array.isArray(source)) return {};

  const sourceObject = source as TokenLike;
  const requested = Array.isArray(template.copy_fields)
    ? template.copy_fields.filter((field: unknown): field is string => typeof field === "string")
    : Object.keys(sourceObject).filter((field) => !RESERVED_SPLICE_COPY_FIELDS.has(field));

  const copied: TokenLike = {};
  for (const field of requested) {
    copied[field] = Object.prototype.hasOwnProperty.call(sourceObject, field)
      ? cloneTemplateData(sourceObject[field])
      : null;
  }
  return copied;
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
  navigation: NavigationBundle
): TokenLike[] {
  const specs = Array.isArray(insertSpecs) ? insertSpecs : [];
  if (specs.length === 0) return [];
  const segments = runtime.axis.splitMarkRange(bounds.leftId, bounds.rightId, specs.length);
  return specs.map((spec, index) => {
    const template = spec && typeof spec === "object" ? spec : {};
    const copiedFields = materializeSpliceCopyFields(template, context, navigation);
    const evaluatedTemplate = Object.fromEntries(
      Object.entries(template).filter(
        ([key]) => key !== "copy_from" && key !== "copy_fields"
      )
    );
    const evaluated = deepEvaluateTemplate(evaluatedTemplate, context, navigation);
    const evaluatedObject =
      evaluated && typeof evaluated === "object" && !Array.isArray(evaluated)
        ? (evaluated as TokenLike)
        : {};
    const markProps = buildRuntimeMarkProps(runtime, {
      sync_left: segments[index].leftId,
      sync_right: segments[index].rightId,
    });
    const token: TokenLike = {
      ...copiedFields,
      ...evaluatedObject,
      stream: evaluatedObject.stream ?? stream,
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
  navigation: NavigationBundle,
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
  const context = navigation.buildContext(target, params, extraContext);
  const activeStreamTokens = sequence.filter(
    (token) => isActiveToken(token) && getTokenStream(token) === stream
  );

  if (spliceSpec.type === "replace_range") {
    const leftExpr = evaluateActionExpression(spliceSpec.range_left, context, navigation);
    const rightExpr = evaluateActionExpression(spliceSpec.range_right, context, navigation);
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
      navigation
    );
    if (inserts.length > 0) {
      sequence.splice(insertionIndex, 0, ...inserts);
    }
    return;
  }

  if (spliceSpec.type === "insert_at_boundary") {
    const boundaryExpr = evaluateActionExpression(spliceSpec.boundary, context, navigation);
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
      navigation
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
  navigation: NavigationBundle,
  extraContext: RuntimeLike | null = null
): TokenLike {
  if (typeof expr === "string") {
    const context = navigation.buildContext(token, params, extraContext);
    const evaluated = evaluateExpression(expr, context, navigation.functions);
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
  defaultTargetName = "current",
  extraContext: RuntimeLike | null = null
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
  const anchor = evaluateAnchorExpression(pointSpec.at, target, params, pointFunctions, extraContext);
  const anchorLeftId = resolveMarkId(runtime, anchor.anchor_left);
  const anchorRightId = resolveMarkId(runtime, anchor.anchor_right);
  if (!anchorLeftId || !anchorRightId) {
    throw new Error("E_POINT_ANCHOR_UNKNOWN: insert_point.at resolved to unknown sync marks");
  }
  const value =
    pointSpec.value == null
      ? null
      : evaluateValueExpression(pointSpec.value, target, params, pointFunctions, extraContext);

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

function evaluateRuleDefine(
  rule: TokenLike,
  token: TokenLike,
  params: RuntimeLike,
  navigation: NavigationBundle,
  extraContext: RuntimeLike | null = null
): RuntimeLike {
  const define = rule?.define;
  if (!define || typeof define !== "object" || Array.isArray(define)) return {};
  const resolved: RuntimeLike = {};
  for (const [name, expr] of Object.entries(define)) {
    if (typeof name !== "string" || name.length === 0) continue;
    if (typeof expr !== "string") {
      resolved[name] = expr;
      continue;
    }
    const context = navigation.buildContext(token, params, {
      ...(extraContext ?? {}),
      ...resolved,
    });
    resolved[name] = evaluateExpression(expr, context, navigation.functions);
  }
  return resolved;
}

function applySelectRule(rule: TokenLike, sequence: TokenLike[], runtime: RuntimeLike, navigation: NavigationBundle): TokenLike[] {
  const select = rule.select ?? {};
  const stream = select.stream;
  const where = select.where ?? "true";
  const prefilter: Prefilter | null = select._prefilter ?? null;
  const selected = [];

  for (const token of sequence) {
    if (!isActiveToken(token)) continue;
    if (stream && getTokenStream(token) !== stream) continue;
    // Fast-reject via prefilter: skip full CEL evaluation for tokens that
    // cannot match the where-clause based on their own properties.
    if (prefilter && !passesPrefilter(token, prefilter)) continue;
    if (!navigation.evaluateCondition(where, token, runtime.params, null)) continue;
    selected.push(token);
  }

  const structural = isStructuralRule(rule);

  for (const token of selected) {
    // Rebind currentToken instead of rebuilding the entire bundle
    navigation.rebindCurrentToken(token);
    const baseContext = { current: token };
    const defineContext = evaluateRuleDefine(
      rule,
      token,
      runtime.params,
      navigation,
      baseContext
    );
    const extraContext = { ...baseContext, ...defineContext };
    const constraintOk = navigation.evaluateCondition(
      rule.constraint,
      token,
      runtime.params,
      extraContext
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
      navigation,
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
      navigation,
      "current",
      extraContext
    );
    applyInsertPointSpec(
      rule.insert_point,
      (targetName) => (targetName === "current" ? token : null),
      runtime.params,
      sequence,
      runtime,
      "current",
      extraContext
    );

    if (rule.suppress || rule.delete) {
      token.status = joinTokenStatus(token.status, TokenStatus.SUPPRESSED);
    }
    // Invalidate caches after structural mutations (splice, insert_point, suppress, delete)
    if (structural) {
      navigation.invalidateStreamCache();
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
  functions: NavigationBundle
) {
  const captures: TokenLike = {};
  let cursor = startIndex;
  for (const step of pattern.sequence) {
    const token = activeTokens[cursor];
    if (!token) return null;
    const stepPrefilter: Prefilter | null = step._prefilter ?? null;
    if (stepPrefilter && !passesPrefilter(token, stepPrefilter)) return null;
    if (!functions.evaluateCondition(step.where ?? "true", token, params, null)) return null;
    captures[step.capture] = token;
    cursor += 1;
  }
  return captures;
}

function applyPatternRule(rule: TokenLike, sequence: TokenLike[], runtime: RuntimeLike, navigation: NavigationBundle): TokenLike[] {
  const pattern = runtime.patterns?.[rule.match];
  if (!pattern || !Array.isArray(pattern.sequence) || pattern.sequence.length === 0) {
    return sequence;
  }

  const active = sequence.filter(
    (token: TokenLike) => isActiveToken(token) && getTokenStream(token) === pattern.stream
  );
  const matches: Array<Record<string, TokenLike>> = [];

  for (let i = 0; i < active.length; i += 1) {
    const captures = matchPatternFrom(active, i, pattern, runtime.params, navigation);
    if (captures) matches.push(captures);
  }

  const structural = isStructuralRule(rule);

  for (const captures of matches) {
    const captureNames = Object.keys(captures);
    const defaultTarget = captureNames[0] ?? "current";
    const capturedToken = captures[defaultTarget] ?? null;
    // Rebind currentToken instead of rebuilding the entire bundle
    navigation.rebindCurrentToken(capturedToken);
    const baseContext = { ...captures, current: capturedToken };
    const defineContext = evaluateRuleDefine(
      rule,
      capturedToken,
      runtime.params,
      navigation,
      baseContext
    );
    const extraContext = { ...baseContext, ...defineContext };
    const constraintOk = navigation.evaluateCondition(
      rule.constraint,
      capturedToken,
      runtime.params,
      extraContext
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
      navigation,
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
      navigation,
      defaultTarget,
      extraContext
    );
    applyInsertPointSpec(
      rule.insert_point,
      (targetName) => captures[targetName] ?? null,
      runtime.params,
      sequence,
      runtime,
      defaultTarget,
      extraContext
    );

    if (rule.suppress || rule.delete) {
      for (const token of Object.values(captures)) {
        token.status = joinTokenStatus(token.status, TokenStatus.SUPPRESSED);
      }
    }
    // Invalidate caches after structural mutations (splice, insert_point, suppress, delete)
    if (structural) {
      navigation.invalidateStreamCache();
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

function applyRule(rule: TokenLike, sequence: TokenLike[], runtime: RuntimeLike, navigation: NavigationBundle): TokenLike[] {
  if (rule.select) {
    return applySelectRule(rule, sequence, runtime, navigation);
  }
  if (rule.match) {
    return applyPatternRule(rule, sequence, runtime, navigation);
  }
  throw new Error(`E_RULE_SHAPE: unsupported declarative slice rule op '${rule?.op}'`);
}

function isStructuralRule(rule: TokenLike | null | undefined): boolean {
  if (!rule || typeof rule !== "object") return false;
  if (rule.splice) return true;
  if (rule.insert_point) return true;
  if (rule.suppress || rule.delete) return true;
  if (Array.isArray(rule.associate) && rule.associate.length > 0) return true;
  if (Array.isArray(rule.disassociate) && rule.disassociate.length > 0) return true;
  return false;
}

function annotateRuntimeRuleError(error: unknown, phaseName: string, ruleName: string): Error {
  const message =
    error instanceof Error ? error.message : typeof error === "string" ? error : String(error);
  const context = `phase=${phaseName} rule=${ruleName} path=rules.${ruleName}`;
  if (message.includes("path=rules.")) {
    return new Error(message);
  }
  return new Error(`${message} [${context}]`);
}

function collectReferencedMarkIds(sequence: TokenLike[], runtime: RuntimeLike): Set<string> {
  const marks = new Set<string>();
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

function describeMarkId(runtime: RuntimeLike, markId: unknown): string {
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

function interpolateMarkTimes(runtime: RuntimeLike, referencedMarkIds: Set<string>): void {
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
      if (leftOrder == null || rightOrder == null || currentOrder == null) {
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

function computeSyncTimes(sequence: TokenLike[], runtime: RuntimeLike): void {
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
    .sort((left: TokenLike, right: TokenLike) => {
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

function resolvePointTimes(
  sequence: TokenLike[],
  runtime: RuntimeLike,
  pointStreams: unknown
): void {
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

function assertActiveBaseCoverage(sequence: TokenLike[], runtime: RuntimeLike): void {
  if (!(runtime?.baseStreams instanceof Set) || runtime.baseStreams.size === 0) return;

  for (const stream of runtime.baseStreams) {
    const hasAnyStreamToken = sequence.some((token: TokenLike) => getTokenStream(token) === stream);
    const active = sequence
      .filter(
        (token: TokenLike) =>
          isActiveToken(token) &&
          getTokenStream(token) === stream &&
          token?.sync_left != null &&
          token?.sync_right != null
      )
      .sort((left: TokenLike, right: TokenLike) => {
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

export function runRuleEngine(
  sequence: TokenLike[],
  specSource: unknown,
  options: RunRuleEngineOptions = {}
) {
  // Performance: skip redundant parse+validate when the spec carries the SPEC_VALIDATED
  // marker (set by rule-pack.ts on module init). Saves ~1.88ms/call (33% of pipeline).
  const alreadyValidated =
    specSource != null &&
    typeof specSource === "object" &&
    (specSource as any)[SPEC_VALIDATED] === true;
  const spec = alreadyValidated ? (specSource as Record<string, any>) : parseDslSpec(specSource);
  const diagnostics = alreadyValidated ? [] : assertValidSpec(spec);
  if (!alreadyValidated) {
    (spec as any)[SPEC_VALIDATED] = true;
  }
  let current = cloneSequence(sequence);

  const streams = (spec.streams ?? {}) as Record<string, TokenLike>;
  const pointStreams = new Set(
    Object.entries(streams)
      .filter(([, stream]) => stream?.type === "point")
      .map(([name]) => name)
  );
  const baseStreams = new Set(
    Object.entries(streams)
      .filter(([, stream]) => stream?.type === "base")
      .map(([name]) => name)
  );
  const knownStreams = new Set(Object.keys(streams));
  const hierarchyStreams = new Set(
    Array.isArray(spec.topology?.hierarchy) && spec.topology.hierarchy.length > 0
      ? spec.topology.hierarchy.filter((name: unknown) => typeof name === "string" && knownStreams.has(name))
      : Object.entries(streams)
          .filter(([, stream]) => stream?.type === "span")
          .map(([name]) => name)
  );
  const scalarSpecsByStream = new Map(
    Object.entries(streams).map(([name, stream]) => [
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

  const runtime: RuntimeLike = {
    params: buildRuntimeParams(spec.parameters, options.parameters),
    predicates:
      spec.predicates && typeof spec.predicates === "object" && !Array.isArray(spec.predicates)
        ? spec.predicates
        : {},
    patterns: spec.patterns ?? {},
    pointStreams,
    baseStreams,
    knownStreams,
    hierarchyStreams,
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

  const trace: TokenLike[] = [];
  runtime.trace = trace;

  for (const phase of spec.phases) {
    if (selectedPhases && !selectedPhases.has(phase.name)) continue;
    runtime.currentPhase = phase.name;
    const phaseScalarFields = resolvePhaseScalarFields(phase, runtime);
    const phaseT0 = performance.now();
    trace.push({ type: "phase_start", phase: phase.name, t0: phaseT0 });
    // Build navigation bundle ONCE per phase — shared across all rules in this phase.
    // Non-structural rules leave the sequence unchanged, so the bundle stays valid.
    // Structural rules mutate the sequence; invalidateStreamCache() is called after each.
    const phaseNavigation = buildNavigationFunctions(current, runtime);
    for (const ruleName of phase.rules) {
      const rule = spec.rules[ruleName];
      if (runtime.finalized && isStructuralRule(rule)) {
        throw new Error(
          `E_FINALIZE_DIRTY: structural rule '${ruleName}' executed after finalize stage`
        );
      }
      runtime.currentRuleName = ruleName;
      const ruleT0 = performance.now();
      trace.push({ type: "rule_start", phase: phase.name, rule: ruleName, t0: ruleT0 });
      try {
        current = applyRule(rule, current, runtime, phaseNavigation);
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
      // After structural rules, invalidate stream cache so the next rule sees fresh data
      if (isStructuralRule(rule)) {
        phaseNavigation.invalidateStreamCache();
      }
      trace.push({ type: "rule_end", phase: phase.name, rule: ruleName, elapsed: performance.now() - ruleT0 });
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
    trace.push({ type: "phase_end", phase: phase.name, elapsed: performance.now() - phaseT0 });
    runtime.currentPhase = null;
  }

  return {
    sequence: current,
    diagnostics,
    trace,
    axis: runtime.axis,
  };
}
