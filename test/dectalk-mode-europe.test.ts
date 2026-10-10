/**
 * DECtalk's europe mode, [:mode europe on] standing before any spoken text
 * or inside the text, from text, against the stock say.exe's audio sample
 * for sample, through the page's path
 * (scripts/oracle/dectalk-voice-compare.ts). The corpus was written and
 * committed before its export:
 *   test/oracle-corpora/dectalk-us-mode-europe-v1.json  (24 texts)
 *
 * What the mode does, as DECtalk 4.63 has it and as measured:
 *   - the text parser's date rule with the mode's mask writes a date in
 *     digits with its day first ("5/9/1998" becomes "5-sep-1998"), and the
 *     rule that writes a decimal number out does not run
 *     (INCLUDE/esc.h:127 MODE_EUROPE);
 *   - a date word is "the" day "of" month, then the year
 *     (LTS/l_us_pr1.c:907-918): "the fifth of September, nineteen ninety
 *     eight";
 *   - the number reader takes a comma before the fraction and a period
 *     between groups of three digits (LTS/ls_task.c:3080-3086): "2,5" is "two
 *     point five", "12.500" "twelve thousand five hundred", "$45,90" "forty
 *     five dollars and ninety cents";
 *   - a word that is no number by those marks is spelled, each mark by its
 *     name (LTS/ls_task.c:897-1010 and 4118-4150): "4.5" is "four period
 *     five", "$7.25" "dollar seven period two five".
 * A date in words, a clock time, a telephone number and a text with no
 * number are spoken as outside the mode.
 *
 * Outside the mode the same last rule holds with the marks the other way
 * round, and the corpus has it where the mode is off: "2,5" is "two comma
 * five" (me-20, me-22).
 *
 * The parser's side is src/text-parser (frontend.ts PORTED_MODES); the date
 * word is a text rule (public/rules/normalization/lexical.yaml tn_date_text);
 * the number words are kept whole by text rules that run only for a text
 * with the mode on in it (recognition.yaml tn_europe_*_source, `enabled`) and
 * read by the lexicon with the mode's two marks (src/g2p/index.ts, the
 * table's modeNumberMarks).
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

const fixtureDir = path.join("test", "fixtures", "dectalk-mode-europe");
const corpus = readVoiceCorpus(
  path.join("test", "oracle-corpora", "dectalk-us-mode-europe-v1.json"),
);

const run = (text: string, frontendId = "dectalk-english") => {
  const provenance = createProvenanceCollector();
  const diagnostics = createDiagnostics();
  const result = textToKlattTrackDetailed(text, undefined, 30, {
    frontendId,
    ...(frontendId === "dectalk-english" ? { speaker: "paul", rate: 1 } : {}),
    provenance,
    diagnostics,
  });
  const decisions = provenance.getDecisions();
  return {
    commands: decisions.filter((decision) => decision.type.startsWith("text_parser_command")),
    europeRules: decisions.filter((decision) =>
      decision.recognition?.ruleId?.startsWith("tn_europe_"),
    ),
    accepted: decisions.flatMap((decision) =>
      decision.recognition?.outcome === "accepted" ? [decision.recognition.ruleId] : [],
    ),
    phonemes: result.track.map((frame) => frame.phoneme).filter((name) => name !== undefined),
    warnings: diagnostics.getEntries().filter((event) => event.code?.startsWith("W_TEXT_COMMAND")),
  };
};

describe("DECtalk's europe mode command", () => {
  it("turns the mode on and off before any spoken text", () => {
    const on = run("[:mode europe on] Add 2,5 liters.");
    expect(on.commands.map((decision) => decision.type)).toEqual(["text_parser_command"]);
    expect(on.commands[0]?.reason).toContain("the mode europe is on for the whole text");
    expect(on.warnings).toEqual([]);
    expect(on.accepted).toContain("tn_europe_number_token_source");
    const off = run("[:mode europe on][:mode europe off] Add 2,5 liters.");
    expect(off.commands[1]?.reason).toContain("the mode europe is off for the whole text");
    const plain = run("Add 2,5 liters.");
    expect(on.phonemes).not.toEqual(plain.phonemes);
    expect(off.phonemes).toEqual(plain.phonemes);
  });

  it("leaves no record of its text rules in a text without the mode", () => {
    // Words the mode's rules would match: with the mode on they have records,
    // without it none, in this frontend and in another.
    const text = "Add 2,5 and 12.500 to $45,90 now.";
    expect(run(`[:mode europe on] ${text}`).europeRules.length).toBeGreaterThan(0);
    expect(run(text).europeRules).toEqual([]);
    expect(run(text, "qlatt-english").europeRules).toEqual([]);
  });

  it("holds from the command on inside a text, and up to the command that turns it off", () => {
    const inside = run(
      "Add 2,5 now. [:mode europe on] Add 2,5 now. [:mode europe off] Add 2,5 now.",
    );
    expect(inside.commands.map((decision) => decision.type)).toEqual([
      "text_parser_command",
      "text_parser_command",
    ]);
    expect(inside.commands[0]?.reason).toContain("the mode europe is on for the text from here on");
    expect(inside.commands[1]?.reason).toContain(
      "the mode europe is off for the text from here on",
    );
    // The word in the mode by the mode's rule, the two outside it by the
    // rule for a word of digits that is no number.
    expect(
      inside.accepted.filter((ruleId) =>
        ["tn_europe_number_token_source", "tn_spelled_number_source"].includes(ruleId ?? ""),
      ),
    ).toEqual([
      "tn_europe_number_token_source",
      "tn_spelled_number_source",
      "tn_spelled_number_source",
    ]);
  });
});

describe("DECtalk's europe mode, dectalk-us-mode-europe-v1", () => {
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
