import { expect, it } from "vitest";
import { summarizeDurations } from "../scripts/measure-speak-latency";

it("summarizes repeated measurements without changing their order", () => {
  const samples = [8, 1, 4, 2];
  const summary = summarizeDurations(samples);
  expect(summary).toMatchObject({ count: 4, minMs: 1, maxMs: 8, meanMs: 3.75, p50Ms: 3 });
  expect(summary.p95Ms).toBeCloseTo(7.4);
  expect(samples).toEqual([8, 1, 4, 2]);
  expect(summarizeDurations([5])).toMatchObject({ count: 1, p50Ms: 5, p95Ms: 5 });
});

it("rejects absent or non-finite observations", () => {
  expect(() => summarizeDurations([])).toThrow();
  expect(() => summarizeDurations([Number.NaN])).toThrow();
});
