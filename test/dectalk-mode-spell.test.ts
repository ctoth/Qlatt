/**
 * DECtalk's spelling mode, [:mode spell on] standing before any spoken text,
 * from text, against the stock say.exe's audio sample for sample, through the
 * page's path (scripts/oracle/dectalk-voice-compare.ts). Two corpora, each
 * written and committed before its export:
 *   test/oracle-corpora/dectalk-us-mode-spell-v1.json          (24 texts)
 *   test/oracle-corpora/dectalk-us-mode-spell-classes-v1.json  (24 texts)
 *
 * In the mode every word of the text parser's output is spelled, ahead of
 * every other reading of a word (LTS/ls_task.c:688, 1835-1871): each
 * character by its name, a digit from the number lists and any other
 * character from the typing table (LTS/ls_spel.c:100-190), a word boundary
 * between two names. White space after a word is a comma's pause
 * (LTS/ls_task.c:1281-1290). Three things stand in front of the spelling
 * test and hold in the mode:
 *   - one of the six auxiliaries as the first word of a sentence is spoken,
 *     not spelled (LTS/ls_task.c:4672-4728);
 *   - a sentence that begins with a question word has its question mark sent
 *     as a period (LTS/ls_task.c:1196-1208);
 *   - a spelled word has the form class of the written word, looked up
 *     before any word is spoken (LTS/ls_task.c:5109-5113): the phonetic
 *     stage's rule for a clause's only verb stresses the first letter of a
 *     spelled "is" or "don't" (PH/ph_sort.c:1283-1302).
 *
 * Text rules do the spelling (public/rules/normalization: recognition.yaml
 * tn_spell_mode_*_source, lexical.yaml tn_spell_mode_*), on when the text
 * parser reports the mode (src/text-parser/frontend.ts initial.modes).
 *
 * NOT_EXACT lists the texts that are not DECtalk's samples, each with what
 * was measured of the difference. A text there that becomes exact fails its
 * test, so that it is taken off the list.
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
import { createDiagnostics } from "../src/diagnostics";
import { createProvenanceCollector } from "../src/provenance";
import { textToKlattTrackDetailed } from "../src/tts-frontend";

const corpora = [
  {
    fixtureDir: path.join("test", "fixtures", "dectalk-mode-spell"),
    corpus: readVoiceCorpus(path.join("test", "oracle-corpora", "dectalk-us-mode-spell-v1.json")),
  },
  {
    fixtureDir: path.join("test", "fixtures", "dectalk-mode-spell-classes"),
    corpus: readVoiceCorpus(
      path.join("test", "oracle-corpora", "dectalk-us-mode-spell-classes-v1.json"),
    ),
  },
];

/** Not DECtalk's samples yet. */
const NOT_EXACT: Readonly<Record<string, string>> = {
  "sc-01":
    "DECtalk has an empty clause (10 frames) in front of the spelled word and: the text stage's " +
    "clause break before a conjunction (LTS/ls_util.c:824-853) is sent on top of the comma for " +
    "the white space. Every other frame count is the same. The frontend's break rule does not " +
    "see a spelled word",
  "sc-04":
    "the last letter of the word late, before the written comma, is 42 frames in DECtalk and " +
    "33 here. Measured: 42 only when the first word since the last written break is a function " +
    "verb (Are late, / Is late,); 33 after Go late, / We late, and with no comma. The class " +
    "DECtalk sends again at a written comma (LTS/ls_task.c:1269-1275) is not followed through " +
    "the spelling mode",
  "sc-05":
    "DECtalk stresses the first letter of went and not of go; here the reverse. Measured: " +
    "[Can go.] stresses go, [Can go, went.] went, [Can, went.] neither. The form-class index " +
    "after a written comma in the spelling mode (LTS/ls_task.c:1269-1275 with 1667-1673) is " +
    "not followed",
  "sc-24":
    "the mode command stands inside the text: DECtalk spells from there on; a change of mode " +
    "inside a text is not carried out and keeps its decision and diagnostic",
};

const run = (text: string) => {
  const provenance = createProvenanceCollector();
  const diagnostics = createDiagnostics();
  const result = textToKlattTrackDetailed(text, undefined, 30, {
    frontendId: "dectalk-english",
    speaker: "paul",
    rate: 1,
    provenance,
    diagnostics,
  });
  return {
    commands: provenance
      .getDecisions()
      .filter((decision) => decision.type.startsWith("text_parser_command")),
    phonemes: result.track.map((frame) => frame.phoneme).filter((name) => name !== undefined),
    warnings: diagnostics.getEntries().filter((event) => event.code?.startsWith("W_TEXT_COMMAND")),
  };
};

describe("DECtalk's mode command", () => {
  it("turns the spelling mode on, off and on again before any spoken text", () => {
    const on = run("[:mode spell on] The tide.");
    expect(on.commands.map((decision) => decision.type)).toEqual(["text_parser_command"]);
    expect(on.commands[0]?.reason).toContain("the mode spell is on for the whole text");
    expect(on.warnings).toEqual([]);
    const off = run("[:mode spell on][:mode spell off] The tide.");
    expect(off.commands[1]?.reason).toContain("the mode spell is off for the whole text");
    // `set` leaves the one mode standing: another mode's takes spell away.
    const taken = run("[:mode spell on][:mode name set] The tide.");
    expect(taken.commands.map((decision) => decision.type)).toEqual([
      "text_parser_command",
      "text_parser_command_not_carried_out",
    ]);
    expect(taken.commands[1]?.reason).toContain("the modes that are ported are taken away");
    // The text as it is spoken outside the mode.
    const plain = run("The tide.").phonemes;
    expect(on.phonemes).not.toEqual(plain);
    expect(off.phonemes).toEqual(plain);
    expect(taken.phonemes).toEqual(plain);
  });

  it("speaks DECtalk's error text for a word that is no option or stands in the wrong place", () => {
    const word = run("The tide [:mode foo on] went out.");
    expect(word.commands[0]?.type).toBe("text_parser_command_error");
    expect(word.commands[0]?.reason).toContain('"Command error in string value"');
    const order = run("The tide [:mode on spell] went out.");
    expect(order.commands[0]?.type).toBe("text_parser_command_error");
    expect(order.commands[0]?.reason).toContain('"Command error in parameter"');
    const twoModes = run("The tide [:mode spell math] went out.");
    expect(twoModes.commands[0]?.reason).toContain('"Command error in parameter"');
  });

  it("does nothing for a mode named alone, and ends no clause", () => {
    const alone = run("The tide [:mode spell] went out.");
    expect(alone.commands.map((decision) => decision.type)).toEqual(["text_parser_command"]);
    expect(alone.commands[0]?.reason).toContain("nothing is changed and no clause is ended");
    expect(alone.warnings).toEqual([]);
  });

  it("keeps a decision and a diagnostic for a mode it does not carry out", () => {
    const inside = run("The tide [:mode spell on] went out.");
    expect(inside.commands.map((decision) => decision.type)).toEqual([
      "text_parser_command_not_carried_out",
    ]);
    expect(inside.commands[0]?.reason).toContain("a change of the mode spell inside a text");
    const other = run("[:mode europe on] The tide went out.");
    expect(other.commands[0]?.reason).toContain("of the modes only spell is ported");
    expect(other.warnings.map((event) => event.code)).toEqual(["W_TEXT_COMMAND_NOT_CARRIED_OUT"]);
  });
});

describe.each(corpora)("DECtalk's spelling mode, $corpus.corpusId", ({ fixtureDir, corpus }) => {
  it("lists only texts of a corpus as not exact", () => {
    const ids = corpora.flatMap((each) => each.corpus.entries.map((entry) => entry.id));
    expect(Object.keys(NOT_EXACT).filter((id) => !ids.includes(id))).toEqual([]);
  });

  it.each(corpus.entries.map((entry) => [entry.id, entry] as const))(
    "%s against the say.exe WAV, sample for sample",
    async (id, entry) => {
      const result = await compareVoiceEntry(entry, corpus.defaults, fixtureDir);
      expect(result.error).toBeUndefined();
      expect(result.samplesOracle).toBeGreaterThan(0);
      if (id in NOT_EXACT) {
        expect(isExact(result), `${id} is exact now: take it off NOT_EXACT`).toBe(false);
        return;
      }
      expect(result.problems).toEqual([]);
      expect(result.packetsRender).toBe(result.packetsOracle);
      expect(result.firstMismatch).toBe(-1);
      expect(isExact(result)).toBe(true);
    },
    120000,
  );
});
