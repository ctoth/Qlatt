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
  it("dectalk-english writes the parser's date word out as phonemic text", () => {
    // The parser writes "3-May", "3-may-1996" and "5-Jan"; the text rule
    // tn_date_text writes each out as one word: the month, the day as an
    // ordinal, and after a pause (",") the year.
    expect(normalizeText("It was May 3, 1996 then.", "dectalk-english")).toBe(
      "it was \x81m'e T'Rd \x82 , 1996 then .",
    );
    expect(normalizeText("It was 5/3/1996 then.", "dectalk-english")).toBe(
      "it was \x81m'e T'Rd,n'An*t'in n'Anti s'Iks \x82 then .",
    );
    expect(normalizeText("The meeting is on Jan. 5.", "dectalk-english")).toBe(
      "the meeting is on \x81J'@nYEri f'IfT \x82 .",
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
