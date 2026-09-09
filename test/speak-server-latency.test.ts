import { expect, it } from "vitest";
import { measureSpeakLatency } from "../scripts/measure-speak-latency";

it("renders a second speak request no slower than the first in the same server", async () => {
  const report = await measureSpeakLatency(1);
  expect(report.secondRequestMs).toBeLessThanOrEqual(report.firstRequestMs);
  expect(report.means.map((row) => row.phrase)).toEqual([
    "OK.",
    "Hello world.",
    "The quick brown fox jumps over the lazy dog.",
  ]);
  for (const row of report.means) expect(row.audioSeconds).toBeGreaterThan(0);
}, 120_000);
