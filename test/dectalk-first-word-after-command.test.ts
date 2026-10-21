/**
 * The first word after a clause that a command inside the text ended, from
 * text, against the stock say.exe's audio sample for sample, through the
 * page's path (scripts/oracle/dectalk-voice-compare.ts). The corpus was
 * written and committed before its export:
 *   test/oracle-corpora/dectalk-us-first-word-after-command-v1.json (12 texts)
 *
 * DECtalk's text stage keeps a "first word of a sentence" state: at that
 * word one of six auxiliaries is sent with secondary stress
 * (LTS/ls_task.c:4672-4728) and a question word makes the sentence's
 * question mark a period (:1196-1208). The state is reset where the
 * delimiter routine reads a period, a question mark or an exclamation mark
 * (:1175-1236) and nowhere else: a command inside the text ends the clause
 * before it (the phonetic stage ends its pending symbols with a period,
 * PH/ph_task.c:665-676) and starts no sentence. So in "The old gate
 * [:rate 200] is shut now." the "is" keeps its unstressed form, and in the
 * spelling mode an auxiliary there is spelled like any other word.
 *
 * The period of such a clause end is a mark a text rule supplied; its
 * silence knows what is written where it stands (Segment feature
 * punctuation_written), and the frontend's dectalk_ends_sentence reads that
 * (public/rules/frontends/dectalk-english/pipeline.yaml). The spelling
 * mode's two first-word rules read the text itself
 * (public/rules/normalization/recognition.yaml tn_spell_mode_first_verb_source
 * and tn_spell_mode_wh_mark_source).
 *
 * The fixtures are the say.exe WAVs alone
 * (scripts/oracle/export-dectalk-vtm-fixture.ts --corpus ... --wav-only).
 */

import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  compareVoiceEntry,
  isExact,
  readVoiceCorpus,
} from "../scripts/oracle/dectalk-voice-compare";
import { textToKlattTrackDetailed } from "../src/tts-frontend";

const fixtureDir = path.join("test", "fixtures", "dectalk-first-word-after-command");
const corpus = readVoiceCorpus(
  path.join("test", "oracle-corpora", "dectalk-us-first-word-after-command-v1.json"),
);

describe("the first word after a clause a command ended", () => {
  it("records on the clause end's silence what is written there", () => {
    const { utterance } = textToKlattTrackDetailed(
      "The old gate [:rate 200] is shut.",
      undefined,
      30,
      { frontendId: "dectalk-english", speaker: "paul", rate: 1 },
    );
    const marks = utterance
      .relation("Segment")
      .listItems()
      .filter((item) => item.get("punctuationSymbol") === ".")
      .map((item) => item.get("punctuation_written") ?? null);
    // The command's clause end is supplied; the written period is not.
    expect(marks[0]).not.toBeNull();
    expect(String(marks[0])).not.toMatch(/[.?!]/);
    expect(marks.at(-1)).toBeNull();
  });
});

describe("dectalk-us-first-word-after-command-v1", () => {
  it.each(corpus.entries.map((entry) => [entry.id, entry] as const))(
    "%s against the say.exe WAV, sample for sample",
    async (_id, entry) => {
      const result = await compareVoiceEntry(entry, corpus.defaults, fixtureDir);
      expect(result.error).toBeUndefined();
      expect(result.samplesOracle).toBeGreaterThan(0);
      expect(result.problems).toEqual([]);
      expect(result.packetsRender).toBe(result.packetsOracle);
      expect(result.firstMismatch).toBe(-1);
      expect(isExact(result)).toBe(true);
    },
    120000,
  );
});
