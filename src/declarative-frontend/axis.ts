export const RANK_LEN = 12;
export const FINITE_RANK_RE = /^[0-9a-z]{12}$/;
export const BASE36_DIGITS = "0123456789abcdefghijklmnopqrstuvwxyz";
export const BASE36 = 36n;
export const MAX_FINITE_RANK = BASE36 ** BigInt(RANK_LEN) - 1n;

export type StartOrder = Readonly<{ kind: "START"; id?: string }>;
export type EndOrder = Readonly<{ kind: "END"; id?: string }>;
export type FiniteOrder = Readonly<{ kind: "FINITE"; rank: string; id?: string }>;
export type OrderObject = StartOrder | EndOrder | FiniteOrder;

type TokenLike = {
  sync_left?: unknown;
  sync_right?: unknown;
  anchor_left?: unknown;
  anchor_right?: unknown;
};

type SplitSegment = { left: OrderObject; right: OrderObject };
type SplitSegmentIds = { leftId: string; rightId: string };

export type SyncMark = {
  id: string;
  order: OrderObject;
  time: number | null;
};

export type SyncAxis = {
  marks: Map<string, SyncMark>;
  keyToId: Map<string, string>;
  ensureMark: (order: unknown) => string | null;
  getMarkById: (id: string | null | undefined) => SyncMark | null;
  getOrderById: (id: string | null | undefined) => OrderObject | null;
  compareMarkIds: (leftId: string | null | undefined, rightId: string | null | undefined) => number;
  setMarkTime: (id: string | null | undefined, time: number) => boolean;
  getMarkTime: (id: string | null | undefined) => number | null;
  splitMarkRange: (
    leftId: string | null | undefined,
    rightId: string | null | undefined,
    count: number
  ) => SplitSegmentIds[];
  exportMarkTimes: () => Map<string, number>;
  getMarkId: (order: unknown) => string | null;
  getMark: (order: unknown) => SyncMark | null;
};

export const START_ORDER: StartOrder = Object.freeze({ kind: "START", id: "START" });
export const END_ORDER: EndOrder = Object.freeze({ kind: "END", id: "END" });

export function parseBase36Rank(rank: unknown): bigint | null {
  if (typeof rank !== "string" || !FINITE_RANK_RE.test(rank)) return null;
  let value = 0n;
  for (const ch of rank) {
    value = value * BASE36 + BigInt(BASE36_DIGITS.indexOf(ch));
  }
  return value;
}

export function formatBase36Rank(value: unknown): string | null {
  if (typeof value !== "bigint" || value < 0n || value > MAX_FINITE_RANK) return null;
  let n = value;
  const chars = new Array<string>(RANK_LEN).fill("0");
  for (let i = RANK_LEN - 1; i >= 0; i -= 1) {
    const digit = Number(n % BASE36);
    chars[i] = BASE36_DIGITS[digit];
    n /= BASE36;
  }
  return chars.join("");
}

function hasKind(mark: unknown): mark is { kind: string; rank?: unknown; id?: unknown } {
  return mark != null && typeof mark === "object" && !Array.isArray(mark) && "kind" in mark;
}

export function isOrderObject(mark: unknown): mark is OrderObject {
  if (!hasKind(mark)) return false;
  if (mark.kind === "START" || mark.kind === "END") return true;
  if (mark.kind === "FINITE") return typeof mark.rank === "string";
  return false;
}

export function isStartOrder(mark: unknown): mark is StartOrder {
  return isOrderObject(mark) && mark.kind === "START";
}

export function isEndOrder(mark: unknown): mark is EndOrder {
  return isOrderObject(mark) && mark.kind === "END";
}

export function serializeOrderValue(mark: unknown): string | null {
  if (!isOrderObject(mark)) return null;
  if (mark.kind === "START") return "START";
  if (mark.kind === "END") return "END";
  if (typeof mark.rank === "string" && FINITE_RANK_RE.test(mark.rank)) {
    return `FINITE:${mark.rank}`;
  }
  return `FINITE_RAW:${String(mark.rank ?? "")}`;
}

export function toNumericOrder(mark: unknown): number | null {
  if (!isOrderObject(mark)) return null;
  if (mark.kind === "START") return 0;
  if (mark.kind === "END") return Number(MAX_FINITE_RANK);
  const rank = parseBase36Rank(mark.rank);
  if (rank != null) return Number(rank);
  return null;
}

export function compareOrderValue(left: unknown, right: unknown): number {
  if (left === right) return 0;

  if (isOrderObject(left) && isOrderObject(right)) {
    const kindOrder: Record<"START" | "FINITE" | "END", number> = { START: 0, FINITE: 1, END: 2 };
    if (left.kind !== right.kind) {
      return kindOrder[left.kind] - kindOrder[right.kind];
    }
    if (left.kind === "FINITE" && right.kind === "FINITE") {
      const lRank = left.rank;
      const rRank = right.rank;
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

export function buildInitialBoundaryOrders(tokenCount: number): OrderObject[] {
  if (!Number.isInteger(tokenCount) || tokenCount <= 0) return [];
  if (tokenCount === 1) return [START_ORDER, END_ORDER];

  const boundaries: OrderObject[] = new Array<OrderObject>(tokenCount + 1);
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
    boundaries[i] = { kind: "FINITE", rank, id: `M_${rank}` };
    previous = rankValue;
  }

  return boundaries;
}

function toSplitBigInt(mark: unknown): bigint | null {
  if (!isOrderObject(mark)) return null;
  if (mark.kind === "START") return 0n;
  if (mark.kind === "END") return MAX_FINITE_RANK;
  return parseBase36Rank(mark.rank);
}

function interiorBoundaryFromRank(rank: string): FiniteOrder {
  return { kind: "FINITE", rank, id: `M_${rank}` };
}

export function splitOrderRange(left: OrderObject, right: OrderObject, count: number): SplitSegment[] {
  if (count <= 0) return [];
  if (count === 1) return [{ left, right }];
  if (compareOrderValue(left, right) === 0) {
    return Array.from({ length: count }, () => ({ left, right }));
  }

  const leftRank = toSplitBigInt(left);
  const rightRank = toSplitBigInt(right);
  if (leftRank != null && rightRank != null && leftRank < rightRank) {
    const span = rightRank - leftRank;
    const boundaries: OrderObject[] = [left];
    let previous = leftRank;

    for (let i = 1; i < count; i += 1) {
      const cut = leftRank + (span * BigInt(i)) / BigInt(count);
      if (cut <= previous || cut >= rightRank) {
        throw new Error("E_RANK_NO_SPACE: rebalance required");
      }
      const rank = formatBase36Rank(cut);
      if (!rank) {
        throw new Error("E_RANK_INVALID: unable to format split boundary rank");
      }
      boundaries.push(interiorBoundaryFromRank(rank));
      previous = cut;
    }
    boundaries.push(right);

    const segments: SplitSegment[] = [];
    for (let i = 0; i < count; i += 1) {
      segments.push({ left: boundaries[i], right: boundaries[i + 1] });
    }
    return segments;
  }

  throw new Error(
    "Multi-token splice requires declarative order boundaries with representable interior cuts"
  );
}

function stableMarkIdFromOrder(order: unknown, indexHint: number): string {
  if (isOrderObject(order)) {
    if (typeof order.id === "string" && order.id.length > 0) return order.id;
    if (order.kind === "START") return "START";
    if (order.kind === "END") return "END";
    if (order.kind === "FINITE") return `M_${order.rank}`;
  }
  return `M_${indexHint}`;
}

export function buildSyncAxis(sequence: TokenLike[]): SyncAxis {
  const marks = new Map<string, SyncMark>();
  const keyToId = new Map<string, string>();
  let idCounter = 0;

  const add = (order: unknown): string | null => {
    const key = serializeOrderValue(order);
    if (key == null) return null;
    if (keyToId.has(key)) return keyToId.get(key) ?? null;

    let id = stableMarkIdFromOrder(order, idCounter);
    while (marks.has(id)) {
      idCounter += 1;
      id = `${id}_${idCounter}`;
    }
    idCounter += 1;

    if (!isOrderObject(order)) return null;
    const mark: SyncMark = {
      id,
      order,
      time: null,
    };
    marks.set(id, mark);
    keyToId.set(key, id);
    return id;
  };

  for (const token of sequence) {
    add(token?.sync_left);
    add(token?.sync_right);
    add(token?.anchor_left);
    add(token?.anchor_right);
  }

  add(START_ORDER);
  add(END_ORDER);

  const getMarkById = (id: string | null | undefined): SyncMark | null => {
    if (typeof id !== "string" || id.length === 0) return null;
    return marks.get(id) ?? null;
  };

  const getOrderById = (id: string | null | undefined): OrderObject | null => {
    const mark = getMarkById(id);
    return mark ? mark.order : null;
  };

  const ensureMark = (order: unknown): string | null => add(order);

  const compareMarkIds = (leftId: string | null | undefined, rightId: string | null | undefined): number => {
    if (leftId === rightId) return 0;
    const leftOrder = getOrderById(leftId);
    const rightOrder = getOrderById(rightId);
    return compareOrderValue(leftOrder, rightOrder);
  };

  const setMarkTime = (id: string | null | undefined, time: number): boolean => {
    const mark = getMarkById(id);
    if (!mark) return false;
    mark.time = Number.isFinite(time) ? Number(time) : null;
    return true;
  };

  const getMarkTime = (id: string | null | undefined): number | null => {
    const mark = getMarkById(id);
    if (!mark || !Number.isFinite(mark.time)) return null;
    return Number(mark.time);
  };

  const splitMarkRange = (
    leftId: string | null | undefined,
    rightId: string | null | undefined,
    count: number
  ): SplitSegmentIds[] => {
    const leftOrder = getOrderById(leftId);
    const rightOrder = getOrderById(rightId);
    if (leftOrder == null || rightOrder == null) {
      throw new Error("E_SYNC_MARK_UNKNOWN: cannot split unknown mark range");
    }
    const segments = splitOrderRange(leftOrder, rightOrder, count);
    return segments.map((segment) => {
      const segLeftId = ensureMark(segment.left);
      const segRightId = ensureMark(segment.right);
      if (!segLeftId || !segRightId) {
        throw new Error("E_SYNC_MARK_UNKNOWN: unable to materialize split segment marks");
      }
      return {
        leftId: segLeftId,
        rightId: segRightId,
      };
    });
  };

  const exportMarkTimes = (): Map<string, number> => {
    const out = new Map<string, number>();
    for (const [id, mark] of marks.entries()) {
      if (Number.isFinite(mark.time)) out.set(id, Number(mark.time));
    }
    return out;
  };

  const getMarkId = (order: unknown): string | null => {
    const key = serializeOrderValue(order);
    if (key == null) return null;
    return keyToId.get(key) ?? null;
  };

  const getMark = (order: unknown): SyncMark | null => {
    const id = getMarkId(order);
    if (id == null) return null;
    return marks.get(id) ?? null;
  };

  return {
    marks,
    keyToId,
    ensureMark,
    getMarkById,
    getOrderById,
    compareMarkIds,
    setMarkTime,
    getMarkTime,
    splitMarkRange,
    exportMarkTimes,
    getMarkId,
    getMark,
  };
}
