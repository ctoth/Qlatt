import { describe, expect, it } from "vitest";
import {
  compareOrder,
  endOrder,
  finiteOrder,
  midpointRank,
  rebalanceRanks,
  startOrder,
} from "../src/declarative-frontend/order.js";

describe("declarative rank/order utilities", () => {
  it("orders START < FINITE < END deterministically", () => {
    expect(compareOrder(startOrder(), finiteOrder("000000000001"))).toBeLessThan(0);
    expect(compareOrder(finiteOrder("000000000001"), finiteOrder("000000000002"))).toBeLessThan(0);
    expect(compareOrder(finiteOrder("zzzzzzzzzzzz"), endOrder())).toBeLessThan(0);
  });

  it("creates midpoint rank when there is representable space", () => {
    const mid = midpointRank(finiteOrder("000000000000"), finiteOrder("00000000000z"));
    expect(mid.length).toBe(12);
    expect(mid > "000000000000").toBe(true);
    expect(mid < "00000000000z").toBe(true);
  });

  it("signals no-space midpoint sites", () => {
    expect(() => midpointRank(finiteOrder("000000000000"), finiteOrder("000000000001"))).toThrow(
      /E_RANK_NO_SPACE/
    );
  });

  it("rebalances finite ranks with fixed width", () => {
    const ranks = rebalanceRanks(4);
    expect(ranks).toHaveLength(4);
    for (const rank of ranks) {
      expect(rank).toMatch(/^[0-9a-z]{12}$/);
    }
    expect(ranks[0] < ranks[1]).toBe(true);
    expect(ranks[1] < ranks[2]).toBe(true);
    expect(ranks[2] < ranks[3]).toBe(true);
  });
});
