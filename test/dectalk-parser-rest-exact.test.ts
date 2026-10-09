/**
 * Sentences whose reading depends on what DECtalk's letter-to-sound does with
 * text its command parser has rewritten, from text, against the stock
 * say.exe's audio sample for sample
 * (test/oracle-corpora/dectalk-us-parser-rest-v1.json, written before any
 * export), through the page's path (scripts/oracle/dectalk-voice-compare.ts):
 *
 *   - a symbol standing alone is the dictionary's word: the parser writes
 *     "12%" as "12 %", and "%" is "percent" (LTS/ls_task.c:697 and 746, the
 *     dictionary search comes before punctuation is stripped). An entry with
 *     a space in it is several words ("#" is "number sign");
 *   - phonemic text, which the parser writes for the periods of an address
 *     and for an ellipsis, has no word boundary after it
 *     (CMD/cm_text.c:1118-1144), and the words before it are a stretch of
 *     their own for the clause breaks (LTS/ls_task.c:446-470);
 *   - a mark the parser leaves alone after nested quotes is a word ("question
 *     mark", "comma", "apostrophe", "quote");
 *   - a clock time that ends in ":00" ends in its verb-phrase start, which is
 *     the next word's (LTS/l_us_pr1.c:1182-1199);
 *   - a word with an underscore in it is spelled (LTS/ls_task.c:4118-4150);
 *   - clauses of more than 300 characters with no mark in them.
 *
 * NOT_EXACT lists the sentences that are not DECtalk's samples yet, each with
 * what is known of why. A sentence there that becomes exact fails its test,
 * so that it is taken off the list.
 *
 * The fixtures are the say.exe WAVs alone. Regenerate with the instrumented
 * and stock builds (scripts/oracle/export-dectalk-vtm-fixture.ts header):
 *
 *   ... scripts/oracle/export-dectalk-vtm-fixture.ts \
 *     --corpus test/oracle-corpora/dectalk-us-parser-rest-v1.json \
 *     --out-dir test/fixtures/dectalk-parser-rest --wav-only
 */

import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  compareVoiceEntry,
  isExact,
  readVoiceCorpus,
} from "../scripts/oracle/dectalk-voice-compare";
import { normalizeText } from "../src/tts-frontend";

const fixtureDir = path.join("test", "fixtures", "dectalk-parser-rest");
const corpus = readVoiceCorpus(
  path.join("test", "oracle-corpora", "dectalk-us-parser-rest-v1.json"),
);

/** Not DECtalk's samples yet. The symbols named are those its phonemic stage receives. */
const NOT_EXACT: Readonly<Record<string, string>> = {
  "pc-02":
    'DECtalk ends a clause after "percent", before "of" (also with the word written out: ' +
    '"Nearly forty percent of the seats were empty."); the frontend\'s clause-break rules put ' +
    "none there. Not traced",
  "qu-01":
    'the parser leaves the opening quote on "Is", and DECtalk\'s test for an auxiliary that ' +
    "begins a sentence compares the word as written (LTS/ls_task.c:4672-4728 " +
    "ls_task_lookup_first_verbs), so IH has no secondary stress; the frontend's rule " +
    "dectalk_sentence_initial_auxiliary goes by the word alone",
};

describe("DECtalk's letter-to-sound on the parser's text, from text to samples", () => {
  it("shows the symbol words in the text as it is spoken", () => {
    expect(normalizeText("He is 100% right.", "dectalk-english")).toBe("he is 100 % right .");
    expect(normalizeText("Meet me @ the gate.", "dectalk-english")).toBe("meet me @ the gate .");
  });

  it("lists only sentences of the corpus as not exact", () => {
    const ids = corpus.entries.map((entry) => entry.id);
    expect(Object.keys(NOT_EXACT).filter((id) => !ids.includes(id))).toEqual([]);
  });

  it.each(corpus.entries.map((entry) => [entry.id, entry] as const))(
    "%s against the say.exe WAV, sample for sample",
    async (id, entry) => {
      const result = await compareVoiceEntry(entry, corpus.defaults, fixtureDir);
      expect(result.error).toBeUndefined();
      expect(result.problems).toEqual([]);
      expect(result.samplesOracle).toBeGreaterThan(0);
      if (id in NOT_EXACT) {
        expect(isExact(result), `${id} is exact now: take it off NOT_EXACT`).toBe(false);
        return;
      }
      expect(result.packetsRender).toBe(result.packetsOracle);
      expect(result.firstMismatch).toBe(-1);
      expect(isExact(result)).toBe(true);
    },
    120000,
  );
});
