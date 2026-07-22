const RANK_LEN = 12;
const DIGITS = "0123456789abcdefghijklmnopqrstuvwxyz";
const BASE = 36n;
const MAX_RANK = BASE ** BigInt(RANK_LEN) - 1n;
const FINITE_RANK = /^[0-9a-z]{12}$/;

export type TemporalOrder =
  | Readonly<{ kind: "START"; id?: string }>
  | Readonly<{ kind: "END"; id?: string }>
  | Readonly<{ kind: "FINITE"; rank: string; id?: string }>;

export interface TemporalMark {
  readonly id: string;
  order: TemporalOrder;
  time: number | null;
  creationDecisionId: string | null;
}

export const START_ORDER: TemporalOrder = Object.freeze({ kind: "START", id: "START" });
export const END_ORDER: TemporalOrder = Object.freeze({ kind: "END", id: "END" });

function parseRank(rank: string): bigint | null {
  if (!FINITE_RANK.test(rank)) return null;
  let value = 0n;
  for (const character of rank) value = value * BASE + BigInt(DIGITS.indexOf(character));
  return value;
}

function formatRank(value: bigint): string {
  if (value < 0n || value > MAX_RANK) throw new Error("E_HRG_TEMPORAL_RANK_INVALID");
  let remaining = value;
  const characters = new Array<string>(RANK_LEN).fill("0");
  for (let index = RANK_LEN - 1; index >= 0; index -= 1) {
    characters[index] = DIGITS[Number(remaining % BASE)];
    remaining /= BASE;
  }
  return characters.join("");
}

function numericOrder(order: TemporalOrder): bigint {
  if (order.kind === "START") return 0n;
  if (order.kind === "END") return MAX_RANK;
  const parsed = parseRank(order.rank);
  if (parsed == null) throw new Error(`E_HRG_TEMPORAL_RANK_INVALID: '${order.rank}'`);
  return parsed;
}

function compareTemporalOrder(left: TemporalOrder, right: TemporalOrder): number {
  const kindOrder = { START: 0, FINITE: 1, END: 2 } as const;
  if (left.kind !== right.kind) return kindOrder[left.kind] - kindOrder[right.kind];
  if (left.kind === "FINITE" && right.kind === "FINITE") {
    return left.rank < right.rank ? -1 : left.rank > right.rank ? 1 : 0;
  }
  return 0;
}

function orderKey(order: TemporalOrder): string {
  return order.kind === "FINITE" ? `FINITE:${order.rank}` : order.kind;
}

export class TemporalAxis {
  readonly marks = new Map<string, TemporalMark>();
  private readonly idByOrder = new Map<string, string>();

  readonly start: TemporalMark;
  readonly end: TemporalMark;

  constructor() {
    this.start = this.addOrder(START_ORDER, null);
    this.end = this.addOrder(END_ORDER, null);
  }

  private addOrder(order: TemporalOrder, creationDecisionId: string | null): TemporalMark {
    const existingId = this.idByOrder.get(orderKey(order));
    if (existingId) {
      const existing = this.marks.get(existingId);
      if (existing) return existing;
    }
    const baseId = order.id ?? (order.kind === "FINITE" ? `M_${order.rank}` : order.kind);
    let id = baseId;
    let suffix = 1;
    while (this.marks.has(id)) {
      id = `${baseId}_${suffix}`;
      suffix += 1;
    }
    const mark: TemporalMark = { id, order, time: null, creationDecisionId };
    this.marks.set(id, mark);
    this.idByOrder.set(orderKey(order), id);
    return mark;
  }

  get(id: string): TemporalMark | null {
    return this.marks.get(id) ?? null;
  }

  getMarkById(id: string | null | undefined): TemporalMark | null {
    return typeof id === "string" ? this.get(id) : null;
  }

  compare(leftId: string, rightId: string): number {
    const left = this.get(leftId);
    const right = this.get(rightId);
    if (!left || !right) throw new Error("E_HRG_TEMPORAL_MARK_UNKNOWN");
    return compareTemporalOrder(left.order, right.order);
  }

  private rebalance(): void {
    const finite = [...this.marks.values()]
      .filter((mark) => mark.order.kind === "FINITE")
      .sort((left, right) => compareTemporalOrder(left.order, right.order));
    this.idByOrder.clear();
    this.idByOrder.set("START", this.start.id);
    this.idByOrder.set("END", this.end.id);
    for (let index = 0; index < finite.length; index += 1) {
      const rank = formatRank((MAX_RANK * BigInt(index + 1)) / BigInt(finite.length + 1));
      finite[index].order = { kind: "FINITE", rank, id: finite[index].id };
      this.idByOrder.set(orderKey(finite[index].order), finite[index].id);
    }
  }

  createBetween(leftId: string, rightId: string, creationDecisionId: string | null): TemporalMark {
    const create = (): TemporalMark => {
      const left = this.get(leftId);
      const right = this.get(rightId);
      if (!left || !right) throw new Error("E_HRG_TEMPORAL_MARK_UNKNOWN");
      const leftRank = numericOrder(left.order);
      const rightRank = numericOrder(right.order);
      if (leftRank >= rightRank) throw new Error("E_HRG_TEMPORAL_ORDER");
      const rankValue = leftRank + (rightRank - leftRank) / 2n;
      if (rankValue <= leftRank || rankValue >= rightRank) throw new Error("E_HRG_TEMPORAL_RANK_SPACE");
      const rank = formatRank(rankValue);
      return this.addOrder({ kind: "FINITE", rank, id: `M_${rank}` }, creationDecisionId);
    };
    try {
      return create();
    } catch (error) {
      if (!(error instanceof Error) || error.message !== "E_HRG_TEMPORAL_RANK_SPACE") throw error;
      this.rebalance();
      return create();
    }
  }

  splitMarkRange(leftId: string | null | undefined, rightId: string | null | undefined, count: number): Array<{ leftId: string; rightId: string }> {
    if (typeof leftId !== "string" || typeof rightId !== "string") throw new Error("E_SYNC_MARK_UNKNOWN");
    if (count <= 0) return [];
    const split = (): string[] => {
      const left = this.get(leftId);
      const right = this.get(rightId);
      if (!left || !right) throw new Error("E_SYNC_MARK_UNKNOWN");
      const leftRank = numericOrder(left.order);
      const rightRank = numericOrder(right.order);
      if (leftRank > rightRank) throw new Error("E_HRG_TEMPORAL_ORDER");
      if (leftRank === rightRank) return Array.from({ length: count + 1 }, () => leftId);
      const span = rightRank - leftRank;
      const boundaries = [leftId];
      let previous = leftRank;
      for (let index = 1; index < count; index += 1) {
        const cut = leftRank + (span * BigInt(index)) / BigInt(count);
        if (cut <= previous || cut >= rightRank) throw new Error("E_HRG_TEMPORAL_RANK_SPACE");
        const rank = formatRank(cut);
        boundaries.push(this.addOrder({ kind: "FINITE", rank, id: `M_${rank}` }, null).id);
        previous = cut;
      }
      boundaries.push(rightId);
      return boundaries;
    };
    let boundaries: string[];
    try {
      boundaries = split();
    } catch (error) {
      if (!(error instanceof Error) || error.message !== "E_HRG_TEMPORAL_RANK_SPACE") throw error;
      this.rebalance();
      boundaries = split();
    }
    return boundaries.slice(0, -1).map((id, index) => ({ leftId: id, rightId: boundaries[index + 1] }));
  }

  setMarkTime(id: string | null | undefined, timeMs: number): boolean {
    const mark = this.getMarkById(id);
    if (!mark) return false;
    mark.time = Number.isFinite(timeMs) ? timeMs : null;
    return true;
  }

  getMarkTime(id: string | null | undefined): number | null {
    return this.getMarkById(id)?.time ?? null;
  }
}
