export const RANK_LEN = 12;

const BASE = 36n;
const MAX_RANK_INT = BASE ** BigInt(RANK_LEN) - 1n;

export type StartOrder = Readonly<{ kind: "START" }>;
export type FiniteOrder = Readonly<{ kind: "FINITE"; rank: string }>;
export type EndOrder = Readonly<{ kind: "END" }>;
export type Order = StartOrder | FiniteOrder | EndOrder;

const KIND_ORDER: Record<Order["kind"], number> = {
  START: 0,
  FINITE: 1,
  END: 2,
};

const RANK_RE = /^[0-9a-z]{12}$/;
const DIGITS = "0123456789abcdefghijklmnopqrstuvwxyz";

function toBigInt(order: Order): bigint {
  if (!order || typeof order !== "object") {
    throw new Error("order must be an object");
  }

  if (order.kind === "START") return 0n;
  if (order.kind === "END") return MAX_RANK_INT;
  if (order.kind !== "FINITE") {
    throw new Error("Unknown order kind");
  }

  const rank = order.rank;
  if (typeof rank !== "string" || rank.length !== RANK_LEN || !RANK_RE.test(rank)) {
    throw new Error(`E_RANK_INVALID: expected ${RANK_LEN} chars of [0-9a-z]`);
  }

  let value = 0n;
  for (const ch of rank) {
    value = value * BASE + BigInt(DIGITS.indexOf(ch));
  }
  return value;
}

function fromBigInt(value: bigint): string {
  if (value < 0n || value > MAX_RANK_INT) {
    throw new Error("rank value out of range");
  }

  let n = value;
  const chars = new Array<string>(RANK_LEN).fill("0");
  for (let i = RANK_LEN - 1; i >= 0; i -= 1) {
    const digit = Number(n % BASE);
    chars[i] = DIGITS[digit];
    n /= BASE;
  }
  return chars.join("");
}

export function compareOrder(a: Order, b: Order): number {
  if (a.kind !== b.kind) {
    return KIND_ORDER[a.kind] - KIND_ORDER[b.kind];
  }
  if (a.kind !== "FINITE" || b.kind !== "FINITE") return 0;
  if (a.rank < b.rank) return -1;
  if (a.rank > b.rank) return 1;
  return 0;
}

export function midpointRank(lo: Order, hi: Order): string {
  const loInt = toBigInt(lo);
  const hiInt = toBigInt(hi);
  if (loInt >= hiInt) {
    throw new Error("midpointRank requires lo < hi");
  }
  const mid = (loInt + hiInt) / 2n;
  if (mid === loInt || mid === hiInt) {
    throw new Error("E_RANK_NO_SPACE: rebalance required");
  }
  return fromBigInt(mid);
}

export function rebalanceRanks(count: number): string[] {
  if (!Number.isInteger(count) || count < 0) {
    throw new Error("count must be a non-negative integer");
  }
  const ranks: string[] = [];
  for (let i = 1; i <= count; i += 1) {
    const intRank = (BigInt(i) * MAX_RANK_INT) / BigInt(count + 1);
    ranks.push(fromBigInt(intRank));
  }
  return ranks;
}

export function finiteOrder(rank: string): FiniteOrder {
  return { kind: "FINITE", rank };
}

export function startOrder(): StartOrder {
  return { kind: "START" };
}

export function endOrder(): EndOrder {
  return { kind: "END" };
}
