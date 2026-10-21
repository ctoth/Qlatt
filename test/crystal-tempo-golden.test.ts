import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import { summarizeTrackMetrics } from "../src/analysis/track-metrics";
import { loadExperimentConfig } from "../src/experiments/load-experiment-config";
import { textToKlattTrack } from "../src/tts-frontend";

const metricsPolicy = (await loadExperimentConfig("klatt80-baseline")).semantics.analysis!.metrics!;

it("preserves the reviewed Crystal Table VI fast-tempo corpus", () => {
  const golden = JSON.parse(
    readFileSync("test/golden/crystal-tempo-corpus-summary.json", "utf8"),
  ) as {
    baseF0: number;
    rate: number;
    summaries: ({ phrase: string } & ReturnType<typeof summarizeTrackMetrics>)[];
  };
  expect(golden.rate).toBeCloseTo(111.6 / 93.4, 12);
  for (const row of golden.summaries) {
    const actual = summarizeTrackMetrics(
      textToKlattTrack(row.phrase, golden.baseF0, 30, { rate: golden.rate }),
      metricsPolicy,
    );
    for (const key of Object.keys(actual) as (keyof typeof actual)[]) {
      expect(actual[key], `${row.phrase}: ${key}`).toBeCloseTo(row[key], 6);
    }
  }
}, 75_000);
