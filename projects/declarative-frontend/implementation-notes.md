## Appendix D: Implementation Notes

### D.1 Snapshot Strategy

Use copy-on-write:

- Snapshot = immutable view (shared structure)
- Patch application creates new arrays only for affected streams
- Same semantics, no quadratic copying

### D.2 Rank Utilities (Informative)

```typescript
// order_rank.ts
// Fixed-length base36 rank operations for SyncMark ordering.
// Node 18+ / TS 5.x. No external deps.

export const RANK_LEN = 12 as const;
const ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyz" as const;
const BASE = 36n;

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

function isRankChar(c: string): boolean {
  return c.length === 1 && ((c >= "0" && c <= "9") || (c >= "a" && c <= "z"));
}

export function isRank(s: string): boolean {
  return s.length === RANK_LEN && [...s].every(isRankChar);
}

export function rankToBigInt(rank: string): bigint {
  assert(isRank(rank), `invalid rank: ${rank}`);
  let x = 0n;
  for (const ch of rank) {
    const v = BigInt(ALPHABET.indexOf(ch));
    assert(v >= 0n, `invalid rank char: ${ch}`);
    x = x * BASE + v;
  }
  return x;
}

export function bigIntToRank(x: bigint): string {
  assert(x >= 0n, "rank bigint must be non-negative");
  const max = maxRankBigInt();
  assert(x <= max, `rank bigint overflow: ${x} > ${max}`);

  let n = x;
  const chars: string[] = [];
  for (let i = 0; i < RANK_LEN; i++) {
    const rem = n % BASE;
    n = n / BASE;
    chars.push(ALPHABET[Number(rem)]);
  }
  // chars are least significant first
  chars.reverse();
  return chars.join("");
}

export function maxRankBigInt(): bigint {
  // 36^RANK_LEN - 1
  let p = 1n;
  for (let i = 0; i < RANK_LEN; i++) p *= BASE;
  return p - 1n;
}

export function compareRank(a: string, b: string): number {
  assert(isRank(a) && isRank(b), "compareRank expects fixed-length ranks");
  // Lex compare works because fixed-length and alphabet is ordered in ASCII for 0-9a-z.
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

export type OrderKey =
  | { kind: "START" }
  | { kind: "FINITE"; rank: string }
  | { kind: "END" };

export function compareOrder(a: OrderKey, b: OrderKey): number {
  const kindOrder: Record<OrderKey["kind"], number> = { START: 0, FINITE: 1, END: 2 };
  if (a.kind !== b.kind) return kindOrder[a.kind] - kindOrder[b.kind];
  if (a.kind === "FINITE" && b.kind === "FINITE") return compareRank(a.rank, b.rank);
  return 0;
}

/**
 * Compute a rank strictly between lo and hi.
 * lo=null means START boundary (numeric 0)
 * hi=null means END boundary (numeric MAX)
 *
 * Throws if there is no representable midpoint (caller should rebalance and retry).
 */
export function rankBetween(lo: string | null, hi: string | null): string {
  const loVal = lo === null ? 0n : rankToBigInt(lo);
  const hiVal = hi === null ? maxRankBigInt() : rankToBigInt(hi);

  assert(loVal < hiVal, `rankBetween requires lo < hi (got ${loVal} >= ${hiVal})`);

  const mid = (loVal + hiVal) / 2n;
  // Ensure strict interior
  if (mid === loVal || mid === hiVal) {
    throw new Error("E_RANK_NO_SPACE: no representable midpoint; rebalance required");
  }
  return bigIntToRank(mid);
}

/**
 * Rebalance ranks for an ordered list of items into evenly-spaced ranks.
 * Returns array of ranks in the same order.
 */
export function rebalanceRanks(count: number): string[] {
  assert(Number.isInteger(count) && count >= 0, "count must be a non-negative integer");
  const max = maxRankBigInt();
  const out: string[] = [];
  for (let i = 1; i <= count; i++) {
    const v = (BigInt(i) * max) / BigInt(count + 1);
    out.push(bigIntToRank(v));
  }
  // strictly increasing guaranteed when count << 36^RANK_LEN; if it fails, increase RANK_LEN
  for (let i = 1; i < out.length; i++) {
    assert(out[i - 1] < out[i], "rebalance produced non-increasing ranks; increase RANK_LEN");
  }
  return out;
}

/* ------------------------ self-test (node) ------------------------ */
if (require.main === module) {
  const a = bigIntToRank(1000n);
  const b = bigIntToRank(2000n);
  const m = rankBetween(a, b);
  assert(a < m && m < b, "midpoint not between");

  const rs = rebalanceRanks(5);
  assert(rs.length === 5, "rebalance length mismatch");
  for (let i = 1; i < rs.length; i++) assert(rs[i - 1] < rs[i], "rebalance not sorted");

  console.log("order_rank.ts self-test: OK");
}
```

### D.3 JSONata Integration

```javascript
const expr = jsonata("$parent(current, 'syllable').f.stress = 1");

// Register navigation functions
expr.registerFunction('parent', (token, stream) => {
    return engine.getParent(token, stream);
});

// Evaluate with data root
const result = expr.evaluate({
    current: currentToken,
    params: parameters
});
```

---







