/**
 * DECtalk's math mode, [:mode math on] standing before any spoken text or
 * inside the text, from text, against the stock say.exe's audio sample for
 * sample, through the page's path (scripts/oracle/dectalk-voice-compare.ts).
 * The corpus was written and committed before its export:
 *   test/oracle-corpora/dectalk-us-mode-math-v1.json  (18 texts)
 *
 * What the mode does, as DECtalk 4.63 has it and as measured:
 *   - the text parser's main rules run with the mode's flag
 *     (INCLUDE/esc.h:126-143 MODE_MATH; the rule of the parser table that
 *     has the mode's mask writes "4/5" as "4 /5");
 *   - a word of one character that the math table names is spoken by that
 *     name, ahead of the dictionary (LTS/ls_task.c:687-697 and 1949-1957,
 *     LTS/l_us_ma1.c math_table[]): "3 - 2" is "three minus two", "4 * 5"
 *     "four multiplied by five", "9 / 3" "nine divided by three", "2 ^ 3"
 *     "two to the power of three", and "=" is the table's "equals";
 *   - the spelling routine tries the math table for each character first
 *     (LTS/ls_spel.c:117), whatever sent the word to it: a part number
 *     ("3-2" is "three minus two", "1990-1998" "nineteen ninety minus
 *     nineteen ninety eight", "e-4" "e minus four") and a word spelled in
 *     the spelling mode.
 * A text with no sign in it, a telephone number, money and a percent sign
 * are spoken as outside the mode. The parser drops "<" and ">" in the mode
 * as outside it.
 *
 * The parser's side is src/text-parser (clauses.ts modeFlagsOn,
 * frontend.ts PORTED_MODES); the names are the lexicon's
 * (src/g2p/index.ts modeName, the table's modeCharacterNames), for the
 * modes on where a word stands (transcribe-text.ts textModes); the text
 * rule that spells a word in the spelling mode reads them from
 * maps.tn_math_names (public/rules/normalization/lexical.yaml
 * tn_spell_mode_word).
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

const fixtureDir = path.join("test", "fixtures", "dectalk-mode-math");
const corpus = readVoiceCorpus(path.join("test", "oracle-corpora", "dectalk-us-mode-math-v1.json"));

/**
 * Not DECtalk's samples yet. Neither is a difference of the math mode: each
 * text differs in the same way with the mode off.
 */
const NOT_EXACT: Readonly<Record<string, string>> = {
  "mm-08":
    '"1.5e3": DECtalk\'s parser writes " 1 point 5 e3" and letter-to-sound spells "e3" (IY, ' +
    "TH R IY); this lexicon reads the word by rule (EH). The same with the mode off: " +
    '"Use 1.5e3 now." differs, "Use 5 e3 now." (which the parser writes "5 e 3") is exact. ' +
    'The minus of "2e-4" is right in the mode.',
  "mm-11":
    'two dates in one clause: the text differs from the "and" after the first date on, at ' +
    'the same sample with the mode off ("On 3/8/2001 and 12-25-99." 22285 of 55806); either ' +
    'date alone is exact ("On 3/8/2001 and then.", "On 12-25-99."). The cause is not found.',
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
    words: provenance
      .getDecisions()
      .filter((decision) => decision.type === "mode_character_pronunciation_selected"),
    phonemes: result.track.map((frame) => frame.phoneme).filter((name) => name !== undefined),
    warnings: diagnostics.getEntries().filter((event) => event.code?.startsWith("W_TEXT_COMMAND")),
  };
};

describe("DECtalk's math mode command", () => {
  it("turns the mode on and off before any spoken text", () => {
    const on = run("[:mode math on] Take 3 - 2.");
    expect(on.commands.map((decision) => decision.type)).toEqual(["text_parser_command"]);
    expect(on.commands[0]?.reason).toContain("the mode math is on for the whole text");
    expect(on.warnings).toEqual([]);
    const off = run("[:mode math on][:mode math off] Take 3 - 2.");
    expect(off.commands[1]?.reason).toContain("the mode math is off for the whole text");
    const plain = run("Take 3 - 2.");
    expect(on.phonemes).not.toEqual(plain.phonemes);
    expect(off.phonemes).toEqual(plain.phonemes);
  });

  it("records the word a sign is spoken as, with the mode and its source", () => {
    const on = run("[:mode math on] Take 3 - 2.");
    expect(on.words.map((decision) => decision.subject)).toEqual(["word:-"]);
    expect(on.words[0]?.reason).toBe(
      "Word '-' is one character and the math mode of the text is on where it stands; used DECtalk's math table",
    );
    expect(on.words[0]?.citations.join(" ")).toContain("LTS/l_us_ma1.c math_table[]");
    // With the mode off the dictionary's word is spoken.
    expect(run("Take 3 - 2.").words).toEqual([]);
  });

  it("holds from the command on inside a text, and up to the command that turns it off", () => {
    const inside = run("Take 3 - 2. [:mode math on] Take 3 - 2. [:mode math off] Take 3 - 2.");
    expect(inside.commands.map((decision) => decision.type)).toEqual([
      "text_parser_command",
      "text_parser_command",
    ]);
    expect(inside.commands[0]?.reason).toContain("the mode math is on for the text from here on");
    expect(inside.commands[1]?.reason).toContain("the mode math is off for the text from here on");
    expect(inside.words.map((decision) => decision.subject)).toEqual(["word:-"]);
    expect(inside.warnings).toEqual([]);
  });
});

describe("DECtalk's math mode, dectalk-us-mode-math-v1", () => {
  it("lists only texts of the corpus as not exact", () => {
    const ids = corpus.entries.map((entry) => entry.id);
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
