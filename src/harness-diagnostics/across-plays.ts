// Phase 5: Across-plays accumulator for state leak detection.
// Accumulates per-play measurement values across N plays, then evaluates
// coefficient of variation (CV) to detect state leaks between plays.

export interface AcrossPlaysResult {
  /** null if not enough plays yet. */
  cv: number | null;
  values: number[];
  ready: boolean;
}

export class AcrossPlaysAccumulator {
  private accums: Map<string, { values: number[]; needed: number }>;

  constructor() {
    this.accums = new Map();
  }

  /** Register a check that needs across-plays accumulation. */
  register(checkName: string, neededPlays: number): void {
    this.accums.set(checkName, { values: [], needed: neededPlays });
  }

  /** Record a value for a check after a play ends. */
  record(checkName: string, value: number): void {
    const accum = this.accums.get(checkName);
    if (!accum) return;
    accum.values.push(value);
  }

  /** Get the result for a check. Returns null if not registered. */
  getResult(checkName: string): AcrossPlaysResult | null {
    const accum = this.accums.get(checkName);
    if (!accum) return null;

    const ready = accum.values.length >= accum.needed;
    if (!ready) {
      return { cv: null, values: [...accum.values], ready: false };
    }

    const cv = computeCV(accum.values);
    return { cv, values: [...accum.values], ready: true };
  }

  /** Reset all accumulators (e.g., when config changes). */
  reset(): void {
    this.accums.clear();
  }
}

/** Coefficient of variation: stddev / mean. Returns 0 for all-zero values. */
function computeCV(values: number[]): number {
  const n = values.length;
  if (n === 0) return 0;

  const mean = values.reduce((s, v) => s + v, 0) / n;

  // All zeros — no variation
  if (mean === 0) {
    return values.every((v) => v === 0) ? 0 : Infinity;
  }

  const variance =
    values.reduce((s, v) => s + (v - mean) ** 2, 0) / n;
  const stddev = Math.sqrt(variance);
  return stddev / Math.abs(mean);
}
