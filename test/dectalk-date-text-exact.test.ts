/**
 * Sentences with a date, from text, are the stock say.exe's audio sample for
 * sample (test/oracle-corpora/dectalk-us-date-text-v1.json), through the
 * page's path (scripts/oracle/dectalk-voice-compare.ts).
 *
 * DECtalk's command text parser writes a date as a word of its own ("May 3,
 * 1996" becomes "3-May, 1996", "5/3/1996" becomes "3-May-1996";
 * CMD/par_rule2.par, src/text-parser), and letter-to-sound reads that word:
 * the month, the day as an ordinal, and the year after a pause
 * (LTS/l_us_pr1.c ls_proc_do_date; src/g2p/table-number.ts speakDate). The
 * text stage keeps the word whole (tn_date_token_source).
 *
 * The fixtures are the say.exe WAVs alone. Regenerate with the instrumented
 * and stock builds (scripts/oracle/export-dectalk-vtm-fixture.ts header):
 *
 *   ... scripts/oracle/export-dectalk-vtm-fixture.ts \
 *     --corpus test/oracle-corpora/dectalk-us-date-text-v1.json \
 *     --out-dir test/fixtures/dectalk-date-text --wav-only
 */

import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  compareVoiceEntry,
  isExact,
  readVoiceCorpus,
} from "../scripts/oracle/dectalk-voice-compare";
import { normalizeText } from "../src/tts-frontend";

const fixtureDir = path.join("test", "fixtures", "dectalk-date-text");
const corpus = readVoiceCorpus(path.join("test", "oracle-corpora", "dectalk-us-date-text-v1.json"));

describe("DECtalk dates from text", () => {
  it("dectalk-english keeps the parser's date word whole", () => {
    // The word is as the parser writes it: the month's letters as they stood
    // in the text, or in lower case from the parser's own table of months.
    expect(normalizeText("It was May 3, 1996 then.", "dectalk-english")).toBe(
      "it was 3-May , 1996 then .",
    );
    expect(normalizeText("It was 5/3/1996 then.", "dectalk-english")).toBe(
      "it was 3-may-1996 then .",
    );
    expect(normalizeText("The meeting is on Jan. 5.", "dectalk-english")).toBe(
      "the meeting is on 5-Jan .",
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
