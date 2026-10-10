/**
 * DECtalk's spelling mode, [:mode spell on] standing before any spoken text
 * or inside the text, from text, against the stock say.exe's audio sample for
 * sample, through the page's path (scripts/oracle/dectalk-voice-compare.ts).
 * Four corpora, each written and committed before its export:
 *   test/oracle-corpora/dectalk-us-mode-spell-v1.json          (24 texts)
 *   test/oracle-corpora/dectalk-us-mode-spell-classes-v1.json  (24 texts)
 *   test/oracle-corpora/dectalk-us-mode-inside-text-v1.json    (12 texts)
 *   test/oracle-corpora/dectalk-us-mode-spell-marks-v1.json    (20 texts)
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
 * What that look-up and the classes do in the mode, as measured
 * (dectalk-us-mode-spell-marks-v1):
 *   - a word with a mark written on it other than one period has no class:
 *     the look-up takes the word with its mark (LTS/ls_task.c:5066-5113);
 *   - at a written comma, colon or semicolon the first word's class is sent
 *     again and lies on the last phone before the mark; when that makes the
 *     clause's only verb a function verb, a vowel there is stressed
 *     (postlexical.yaml dectalk_helper_verb_resent_class_start);
 *   - the stretch of words the text stage parses is the written one: the
 *     commas for white space do not cut it, and the clause break before a
 *     conjunction is spoken on top of that comma, as an empty clause.
 *
 * Text rules do the spelling (public/rules/normalization: recognition.yaml
 * tn_spell_mode_*_source, lexical.yaml tn_spell_mode_*), on in the stretches
 * of the text the text parser reports the mode for
 * (src/text-parser/frontend.ts initial.modes and modeChanges; the frontend
 * lays them over the rules' maps as tn_text_mode_spans). A mode command
 * inside the text ends the words before it, as any command that sends a
 * control item does, and the mode holds from there on.
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
  {
    fixtureDir: path.join("test", "fixtures", "dectalk-mode-inside-text"),
    corpus: readVoiceCorpus(
      path.join("test", "oracle-corpora", "dectalk-us-mode-inside-text-v1.json"),
    ),
  },
  {
    fixtureDir: path.join("test", "fixtures", "dectalk-mode-spell-marks"),
    corpus: readVoiceCorpus(
      path.join("test", "oracle-corpora", "dectalk-us-mode-spell-marks-v1.json"),
    ),
  },
];

/** Not DECtalk's samples yet: none. */
const NOT_EXACT: Readonly<Record<string, string>> = {};

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

  it("turns the spelling mode on and off inside a text, from the command on", () => {
    const inside = run("The tide [:mode spell on] went [:mode spell off] out.");
    expect(inside.commands.map((decision) => decision.type)).toEqual([
      "text_parser_command",
      "text_parser_command",
    ]);
    expect(inside.commands[0]?.reason).toContain("the mode spell is on for the text from here on");
    expect(inside.commands[1]?.reason).toContain("the mode spell is off for the text from here on");
    expect(inside.warnings).toEqual([]);
    // "The tide" and "out" as outside the mode, "went" spelled between them.
    const plain = run("The tide. Out.").phonemes.join(" ");
    const spoken = inside.phonemes.join(" ");
    expect(spoken.startsWith(run("The tide.").phonemes.slice(0, 5).join(" "))).toBe(true);
    expect(spoken).not.toBe(plain);
    // Another mode's set inside a text takes the spelling mode away there.
    const taken = run("[:mode spell on] The tide [:mode name set] went out.");
    expect(taken.commands.map((decision) => decision.type)).toEqual([
      "text_parser_command",
      "text_parser_command_not_carried_out",
    ]);
    expect(taken.commands[1]?.reason).toContain("taken away from here on");
  });

  it("keeps a decision and a diagnostic for a mode it does not carry out", () => {
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
