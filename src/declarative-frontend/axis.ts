export const RANK_LEN = 12;
export const FINITE_RANK_RE = /^[0-9a-z]{12}$/;
export const BASE36_DIGITS = "0123456789abcdefghijklmnopqrstuvwxyz";
export const BASE36 = 36n;
export const MAX_FINITE_RANK = BASE36 ** BigInt(RANK_LEN) - 1n;

export const START_ORDER = Object.freeze({ kind: "START", id: "START" });
export const END_ORDER = Object.freeze({ kind: "END", id: "END" });

export function parseBase36Rank(rank) {
  if (typeof rank !== "string" || !FINITE_RANK_RE.test(rank)) return null;
  let value = 0n;
  for (const ch of rank) {
    value = value * BASE36 + BigInt(BASE36_DIGITS.indexOf(ch));
  }
  return value;
}

export function formatBase36Rank(value) {
  if (typeof value !== "bigint" || value < 0n || value > MAX_FINITE_RANK) return null;
  let n = value;
  const chars = new Array(RANK_LEN).fill("0");
  for (let i = RANK_LEN - 1; i >= 0; i -= 1) {
    const digit = Number(n % BASE36);
    chars[i] = BASE36_DIGITS[digit];
    n /= BASE36;
  }
  return chars.join("");
}

export function isOrderObject(mark) {
  return (
    mark != null &&
    typeof mark === "object" &&
    !Array.isArray(mark) &&
    typeof mark.kind === "string"
  );
}

export function isStartOrder(mark) {
  return isOrderObject(mark) && mark.kind === "START";
}

export function isEndOrder(mark) {
  return isOrderObject(mark) && mark.kind === "END";
}

export function serializeOrderValue(mark) {
  if (!isOrderObject(mark)) return null;
  if (mark.kind === "START") return "START";
  if (mark.kind === "END") return "END";
  if (mark.kind === "FINITE") {
    if (typeof mark.rank === "string" && FINITE_RANK_RE.test(mark.rank)) {
      return `FINITE:${mark.rank}`;
    }
    return `FINITE_RAW:${String(mark.rank ?? "")}`;
  }
  return `ORDER_RAW:${String(mark.kind)}`;
}

export function toNumericOrder(mark) {
  if (!isOrderObject(mark)) return null;
  if (mark.kind === "START") return 0;
  if (mark.kind === "END") return Number(MAX_FINITE_RANK);
  if (mark.kind === "FINITE") {
    const rank = parseBase36Rank(mark.rank);
    if (rank != null) return Number(rank);
  }
  return null;
}

export function compareOrderValue(left, right) {
  if (left === right) return 0;

  if (isOrderObject(left) && isOrderObject(right)) {
    const kindOrder = { START: 0, FINITE: 1, END: 2 };
    if (left.kind !== right.kind) {
      return (kindOrder[left.kind] ?? 0) - (kindOrder[right.kind] ?? 0);
    }
    if (left.kind === "FINITE") {
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

export function buildInitialBoundaryOrders(tokenCount) {
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
    boundaries[i] = { kind: "FINITE", rank, id: `M_${rank}` };
    previous = rankValue;
  }

  return boundaries;
}

function toSplitBigInt(mark) {
  if (isOrderObject(mark)) {
    if (mark.kind === "START") return 0n;
    if (mark.kind === "END") return MAX_FINITE_RANK;
    if (mark.kind === "FINITE") return parseBase36Rank(mark.rank);
    return null;
  }
  return null;
}

function interiorBoundaryFromRank(rank, preferObject) {
  if (preferObject) return { kind: "FINITE", rank, id: `M_${rank}` };
  return rank;
}

export function splitOrderRange(left, right, count) {
  if (count <= 0) return [];
  if (count === 1) return [{ left, right }];
  if (compareOrderValue(left, right) === 0) {
    return Array.from({ length: count }, () => ({ left, right }));
  }

  const leftRank = toSplitBigInt(left);
  const rightRank = toSplitBigInt(right);
  if (leftRank != null && rightRank != null && leftRank < rightRank) {
    const span = rightRank - leftRank;
    const boundaries = [left];
    let previous = leftRank;
    const preferObject = isOrderObject(left) || isOrderObject(right);

    for (let i = 1; i < count; i += 1) {
      const cut = leftRank + (span * BigInt(i)) / BigInt(count);
      if (cut <= previous || cut >= rightRank) {
        throw new Error("E_RANK_NO_SPACE: rebalance required");
      }
      const rank = formatBase36Rank(cut);
      if (!rank) {
        throw new Error("E_RANK_INVALID: unable to format split boundary rank");
      }
      boundaries.push(interiorBoundaryFromRank(rank, preferObject));
      previous = cut;
    }
    boundaries.push(right);

    const segments = [];
    for (let i = 0; i < count; i += 1) {
      segments.push({ left: boundaries[i], right: boundaries[i + 1] });
    }
    return segments;
  }

  throw new Error(
    "Multi-token splice requires declarative order boundaries with representable interior cuts"
  );
}

function stableMarkIdFromOrder(order, indexHint) {
  if (isOrderObject(order)) {
    if (typeof order.id === "string" && order.id.length > 0) return order.id;
    if (order.kind === "START") return "START";
    if (order.kind === "END") return "END";
    if (order.kind === "FINITE" && typeof order.rank === "string") {
      return `M_${order.rank}`;
    }
  }
  return `M_${indexHint}`;
}

export function buildSyncAxis(sequence) {
  const marks = new Map();
  const keyToId = new Map();
  let idCounter = 0;

  const add = (order) => {
    const key = serializeOrderValue(order);
    if (key == null) return null;
    if (keyToId.has(key)) return keyToId.get(key);

    let id = stableMarkIdFromOrder(order, idCounter);
    while (marks.has(id)) {
      idCounter += 1;
      id = `${id}_${idCounter}`;
    }
    idCounter += 1;

    const mark = {
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

  const axis = {
    marks,
    keyToId,
    ensureMark(order) {
      return add(order);
    },
    getMarkById(id) {
      if (typeof id !== "string" || id.length === 0) return null;
      return marks.get(id) ?? null;
    },
    getOrderById(id) {
      const mark = this.getMarkById(id);
      return mark ? mark.order : null;
    },
    compareMarkIds(leftId, rightId) {
      if (leftId === rightId) return 0;
      const leftOrder = this.getOrderById(leftId);
      const rightOrder = this.getOrderById(rightId);
      return compareOrderValue(leftOrder, rightOrder);
    },
    setMarkTime(id, time) {
      const mark = this.getMarkById(id);
      if (!mark) return false;
      mark.time = Number.isFinite(time) ? Number(time) : null;
      return true;
    },
    getMarkTime(id) {
      const mark = this.getMarkById(id);
      if (!mark || !Number.isFinite(mark.time)) return null;
      return Number(mark.time);
    },
    splitMarkRange(leftId, rightId, count) {
      const leftOrder = this.getOrderById(leftId);
      const rightOrder = this.getOrderById(rightId);
      if (leftOrder == null || rightOrder == null) {
        throw new Error("E_SYNC_MARK_UNKNOWN: cannot split unknown mark range");
      }
      const segments = splitOrderRange(leftOrder, rightOrder, count);
      return segments.map((segment) => {
        const segLeftId = this.ensureMark(segment.left);
        const segRightId = this.ensureMark(segment.right);
        if (!segLeftId || !segRightId) {
          throw new Error("E_SYNC_MARK_UNKNOWN: unable to materialize split segment marks");
        }
        return {
          leftId: segLeftId,
          rightId: segRightId,
        };
      });
    },
    exportMarkTimes() {
      const out = new Map();
      for (const [id, mark] of marks.entries()) {
        if (Number.isFinite(mark.time)) out.set(id, Number(mark.time));
      }
      return out;
    },
    getMarkId(order) {
      const key = serializeOrderValue(order);
      if (key == null) return null;
      return keyToId.get(key) ?? null;
    },
    getMark(order) {
      const id = this.getMarkId(order);
      if (id == null) return null;
      return marks.get(id) ?? null;
    },
  };

  return axis;
}
