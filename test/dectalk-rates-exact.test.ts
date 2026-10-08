/**
 * The dectalk-english frontend at speaking rates other than DECtalk's default
 * 180 words per minute: from text, sample for sample the stock say.exe's audio
 * for `[:ra <rate>]` (test/oracle-corpora/dectalk-us-rates-v1.json), through
 * the page's path (scripts/oracle/dectalk-voice-compare.ts).
 *
 * The rates stand on both sides of what DECtalk's timing code tests: 160 and
 * 161 (p_us_tim.c:319), 140 (ph_sort.c:1171), 180 from below and above
 * (ph_timng.c:273-302), 250 and 300 (ph_timng.c:240-243).
 *
 * The fixtures are the say.exe WAVs alone. Regenerate with the instrumented
 * and stock builds (scripts/oracle/export-dectalk-vtm-fixture.ts header):
 *
 *   ... scripts/oracle/export-dectalk-vtm-fixture.ts \
 *     --corpus test/oracle-corpora/dectalk-us-rates-v1.json \
 *     --out-dir test/fixtures/dectalk-rates --wav-only
 */

import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  compareVoiceEntry,
  isExact,
  readVoiceCorpus,
} from "../scripts/oracle/dectalk-voice-compare";

const fixtureDir = path.join("test", "fixtures", "dectalk-rates");
const corpus = readVoiceCorpus(path.join("test", "oracle-corpora", "dectalk-us-rates-v1.json"));

describe("DECtalk speaking rates from text", () => {
  it("the corpus covers rates below and above 180, and no entry is at 180", () => {
    const rates = corpus.entries.map((entry) => entry.rate);
    expect(rates.every((rate) => typeof rate === "number" && rate !== 180)).toBe(true);
    expect(rates.some((rate) => (rate as number) < 180)).toBe(true);
    expect(rates.some((rate) => (rate as number) > 180)).toBe(true);
  });

  it("one text at different rates gives different say.exe WAVs", () => {
    // Otherwise the rate command was ignored and a match would say nothing.
    const fox = corpus.entries.filter((entry) => entry.id.startsWith("fox-"));
    const lengths = fox.map((entry) => fs.statSync(path.join(fixtureDir, `${entry.id}.wav`)).size);
    expect(fox.length).toBeGreaterThan(4);
    expect(new Set(lengths).size).toBe(fox.length);
  });

  it.each(corpus.entries.map((entry) => [entry.id, entry] as const))(
    "%s is the say.exe WAV, sample for sample",
    async (_id, entry) => {
      const result = await compareVoiceEntry(entry, corpus.defaults, fixtureDir);
      expect(result.error).toBeUndefined();
      expect(result.problems).toEqual([]);
      expect(result.samplesOracle).toBeGreaterThan(0);
      expect(result.packetsRender).toBe(result.packetsOracle);
      expect(result.firstMismatch).toBe(-1);
      expect(result.samplesEqual).toBe(result.samplesOracle);
      expect(isExact(result)).toBe(true);
    },
    120000,
  );
});
