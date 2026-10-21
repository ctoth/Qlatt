/**
 * Every built-in DECtalk voice, from text, is the stock say.exe's audio sample
 * for sample: a word and a sentence for each of the nine voices
 * (test/oracle-corpora/dectalk-us-voices-v1.json), through the page's path
 * (scripts/oracle/dectalk-voice-compare.ts).
 *
 * The fixtures are the say.exe WAVs alone. Regenerate with the instrumented
 * and stock builds (scripts/oracle/export-dectalk-vtm-fixture.ts header):
 *
 *   ... scripts/oracle/export-dectalk-vtm-fixture.ts \
 *     --corpus test/oracle-corpora/dectalk-us-voices-v1.json \
 *     --out-dir test/fixtures/dectalk-voices --wav-only
 */

import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  compareVoiceEntry,
  isExact,
  readVoiceCorpus,
} from "../scripts/oracle/dectalk-voice-compare";
import { DECTALK_VOICES } from "../scripts/oracle/dectalk-vtm-fixture";

const fixtureDir = path.join("test", "fixtures", "dectalk-voices");
const corpus = readVoiceCorpus(path.join("test", "oracle-corpora", "dectalk-us-voices-v1.json"));

describe("DECtalk voices from text", () => {
  it("the corpus has a word and a sentence for each of the nine voices", () => {
    for (const group of ["voice-word", "voice-sentence"]) {
      const voices = corpus.entries
        .filter((entry) => entry.group === group)
        .map((entry) => entry.voiceId);
      expect([...voices].sort(), group).toEqual([...DECTALK_VOICES].sort());
    }
    expect(corpus.entries).toHaveLength(2 * DECTALK_VOICES.length);
  });

  it("the nine voices' say.exe WAVs differ from one another", () => {
    // Otherwise a voice command was ignored and nine matches would mean one.
    for (const group of ["voice-word", "voice-sentence"]) {
      const files = corpus.entries
        .filter((entry) => entry.group === group)
        .map((entry) =>
          fs.readFileSync(path.join(fixtureDir, `${entry.id}.wav`)).toString("base64"),
        );
      expect(new Set(files).size, group).toBe(DECTALK_VOICES.length);
    }
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
