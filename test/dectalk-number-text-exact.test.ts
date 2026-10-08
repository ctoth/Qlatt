/**
 * Sentences with a dollar amount, a clock time, a grouped number, a decimal
 * and a plural number, from text, are the stock say.exe's audio sample for
 * sample (test/oracle-corpora/dectalk-us-number-text-v1.json), through the
 * page's path (scripts/oracle/dectalk-voice-compare.ts).
 *
 * The dectalk-english text stage keeps such a word whole
 * (tn_recognition_policy.number_tokens) and its lexicon reads it as DECtalk's
 * text task does (src/g2p/table-number.ts speakNumberToken).
 *
 * The fixtures are the say.exe WAVs alone. Regenerate with the instrumented
 * and stock builds (scripts/oracle/export-dectalk-vtm-fixture.ts header):
 *
 *   ... scripts/oracle/export-dectalk-vtm-fixture.ts \
 *     --corpus test/oracle-corpora/dectalk-us-number-text-v1.json \
 *     --out-dir test/fixtures/dectalk-number-text --wav-only
 */

import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  compareVoiceEntry,
  isExact,
  readVoiceCorpus,
} from "../scripts/oracle/dectalk-voice-compare";
import { normalizeText } from "../src/tts-frontend";

const fixtureDir = path.join("test", "fixtures", "dectalk-number-text");
const corpus = readVoiceCorpus(
  path.join("test", "oracle-corpora", "dectalk-us-number-text-v1.json"),
);

describe("DECtalk number-like words from text", () => {
  it("dectalk-english keeps the word whole; qlatt-english writes it out", () => {
    expect(normalizeText("It costs $3.50.", "dectalk-english")).toBe("it costs $3.50 .");
    expect(normalizeText("It is 3:30.", "dectalk-english")).toBe("it is 3:30 .");
    expect(normalizeText("About 1,000,000 came.", "dectalk-english")).toBe(
      "about 1,000,000 came .",
    );
    expect(normalizeText("In the 1800s.", "dectalk-english")).toBe("in the 1800s .");
    // A sentence's own comma or period is not part of the number.
    expect(normalizeText("It was 19.99, then 20.", "dectalk-english")).toBe(
      "it was 19.99 , then 20 .",
    );
    expect(normalizeText("It costs $3.50.", "qlatt-english")).toBe(
      "it costs three dollars and fifty cents .",
    );
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
      expect(isExact(result)).toBe(true);
    },
    120000,
  );
});
