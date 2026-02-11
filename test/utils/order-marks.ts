const RANK_LEN = 12;

function normalizeFiniteRank(rank: string): string {
  const trimmed = rank.trim().toLowerCase();
  if (!/^[0-9a-z]+$/.test(trimmed)) {
    throw new Error(`Invalid finite rank '${rank}'`);
  }
  if (trimmed.length > RANK_LEN) {
    throw new Error(`Finite rank '${rank}' exceeds ${RANK_LEN} chars`);
  }
  return trimmed.padStart(RANK_LEN, "0");
}

export function startOrder() {
  return { kind: "START" as const };
}

export function endOrder() {
  return { kind: "END" as const };
}

export function finiteOrder(rank: number | string) {
  if (typeof rank === "number") {
    if (!Number.isInteger(rank) || rank < 0) {
      throw new Error(`Invalid finite rank number '${String(rank)}'`);
    }
    return { kind: "FINITE" as const, rank: normalizeFiniteRank(rank.toString(36)) };
  }
  return { kind: "FINITE" as const, rank: normalizeFiniteRank(rank) };
}
