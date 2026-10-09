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
  it("dectalk-english writes the word out as phonemic text or keeps it whole; qlatt-english writes words", () => {
    // A dollar amount is written out by a text rule (tn_money_text): three
    // dollars, "and" with its verb-phrase start, fifty cents.
    expect(normalizeText("It costs $3.50.", "dectalk-english")).toBe(
      "it costs \x81Tr'i d'alRz )End f'Ifti s'Ents \x82 .",
    );
    // Before a word that takes "dollars" behind it the amount stays whole.
    expect(normalizeText("It costs $2 million.", "dectalk-english")).toBe("it costs $2 million .");
    // A clock time is written out by a text rule (tn_clock_time) as one word
    // of phonemic text: three, a verb-phrase start, thirty, a word boundary.
    expect(normalizeText("It is 3:30.", "dectalk-english")).toBe("it is \x81Tr'i)T'Rti \x82 .");
    expect(normalizeText("About 1,000,000 came.", "dectalk-english")).toBe(
      "about 1,000,000 came .",
    );
    // So is a number with a plural ending (tn_plural_number): eighteen
    // hundred and the ending after a voiced phone.
    expect(normalizeText("In the 1800s.", "dectalk-english")).toBe(
      "in the \x81'e*t'in h'^ndrxdz \x82 .",
    );
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
