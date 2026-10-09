/**
 * Texts with DECtalk's phoneme mode, from text, against the stock say.exe's
 * audio sample for sample
 * (test/oracle-corpora/dectalk-us-phoneme-mode-v1.json, written before any
 * export), through the page's path (scripts/oracle/dectalk-voice-compare.ts).
 * The frontend's text parser follows the mode ("[:phoneme arpabet speak
 * on]") and reads a bracket as phonemic text while it is on
 * (src/text-parser/clauses.ts, src/text-parser/phonemes.ts).
 *
 * Carried out:
 *   - the mode off: a bracket is text, as before;
 *   - the mode on: the clause before a bracket is ended, and the bracket's
 *     symbols are spoken, in the arpabet and in the one-character alphabet,
 *     with no word boundary between the bracket and the text after it
 *     (CMD/cm_phon.c, CMD/cm_pars.c);
 *   - a period right after a bracket, which is the word "period" (the rule
 *     for a period that stands alone, tn_lone_period_source);
 *   - a duration written on a symbol ("[uw<500>]");
 *   - the mode turned off again;
 *   - a bracket that holds what is no phoneme: the symbols before it, then
 *     DECtalk's error text.
 *
 * NOT_EXACT lists the texts that are not DECtalk's samples, each with what
 * is missing. A text there that becomes exact fails its test, so that it is
 * taken off the list.
 *
 * The fixtures are the say.exe WAVs alone. Regenerate with the instrumented
 * and stock builds (scripts/oracle/export-dectalk-vtm-fixture.ts header):
 *
 *   ... scripts/oracle/export-dectalk-vtm-fixture.ts \
 *     --corpus test/oracle-corpora/dectalk-us-phoneme-mode-v1.json \
 *     --out-dir test/fixtures/dectalk-phoneme-mode --wav-only
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
import { normalizeText, textToKlattTrackDetailed } from "../src/tts-frontend";

const fixtureDir = path.join("test", "fixtures", "dectalk-phoneme-mode");
const corpus = readVoiceCorpus(
  path.join("test", "oracle-corpora", "dectalk-us-phoneme-mode-v1.json"),
);

const PITCH =
  "a pitch written on a symbol (the second number) is read and not applied: the pitch is " +
  "the rules'";
const SILENCE =
  "a silence symbol inside a bracket is spoken with DECtalk's length " +
  "(test/dectalk-phoneme-silence.test.ts), but the pitch and the formants around it are not " +
  "DECtalk's";

/** Not DECtalk's samples yet. */
const NOT_EXACT: Readonly<Record<string, string>> = {
  "pm-18": SILENCE,
  "pm-19": PITCH,
  "pm-20": PITCH,
  "pm-21": PITCH,
  "pm-22": PITCH,
  "pm-23": `${PITCH}; ${SILENCE}`,
  "pm-24": PITCH,
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
    result,
    decisions: provenance
      .getDecisions()
      .filter((decision) => decision.type.startsWith("text_parser_")),
    warnings: diagnostics.getEntries().filter((event) => event.code?.startsWith("W_TEXT_")),
  };
};

/** The frames the duration rules gave each `phone` of the text. */
const framesOf = (text: string, phone: string): number[] =>
  run(text)
    .result.utterance.relation("Segment")
    .listItems()
    .filter((item) => item.get("phoneme") === phone)
    .map((item) => Number(item.get("timing_frames")));

describe("DECtalk's phoneme mode", () => {
  it("leaves a bracket as text while the mode is off", () => {
    expect(normalizeText("The [m uw n] rose.", "dectalk-english")).toBe(
      normalizeText("The m uw n rose.", "dectalk-english"),
    );
    const { decisions } = run("The [m uw n] rose.");
    expect(decisions.filter((decision) => decision.type === "text_parser_phonemes")).toEqual([]);
  });

  it("reads a bracket as phonemic text once the mode is on, and says so", () => {
    const { decisions, warnings } = run("[:phoneme arpabet speak on] The [m'uwn] rose.");
    const types = decisions.map((decision) => decision.type);
    expect(types).toContain("text_parser_command");
    expect(types).toContain("text_parser_phonemes");
    const phonemes = decisions.find((decision) => decision.type === "text_parser_phonemes");
    expect(phonemes?.citations.length).toBeGreaterThan(0);
    expect(warnings).toEqual([]);
  });

  it("turns the mode off again", () => {
    const { decisions } = run(
      "[:phoneme arpabet speak on] The [m'uwn] rose. [:phoneme off] The [m uw n] set.",
    );
    expect(decisions.filter((decision) => decision.type === "text_parser_phonemes")).toHaveLength(
      1,
    );
  });

  it("speaks DECtalk's error text for a bracket with what is no phoneme, and says so", () => {
    const { decisions, warnings } = run(
      "[:phoneme arpabet speak on] She said [hxehl'ow], and left.",
    );
    const error = decisions.find((decision) => decision.type === "text_parser_command_error");
    expect(error?.reason).toContain('"Command error in phoneme"');
    expect(warnings.map((event) => event.code)).toEqual(["W_TEXT_COMMAND_ERROR"]);
  });

  it("gives a phone the duration written on it, in place of the rules'", () => {
    // mstofr(500 + 4): 504 ms in frames of 6.4 ms, rounded down
    // (PH/p_us_tim.c:192-206, PH/ph_task.c:1380-1387).
    expect(framesOf("[:phoneme arpabet speak on] The [m'uw<500>n] rose.", "UW")).toEqual([78]);
    expect(framesOf("[:phoneme arpabet speak on] The [m'uw<200>n] rose.", "UW")).toEqual([31]);
    // Without a number the rules give it 16 frames here.
    expect(framesOf("[:phoneme arpabet speak on] The [m'uwn] rose.", "UW")).toEqual([16]);
  });

  it("names what of a bracket's numbers and symbols it leaves out", () => {
    const { decisions, warnings } = run("[:phoneme arpabet speak on] The [m'uw<400,140>n] rose.");
    const left = decisions.find(
      (decision) => decision.type === "text_parser_phonemes_not_carried_out",
    );
    expect(left?.reason).toContain("a pitch written on a symbol is not applied");
    expect(left?.citations.length).toBeGreaterThan(0);
    expect(warnings.map((event) => event.code)).toEqual(["W_TEXT_PHONEMES_NOT_CARRIED_OUT"]);
    // A duration alone is carried out: nothing to name.
    expect(run("[:phoneme arpabet speak on] The [m'uw<400>n] rose.").warnings).toEqual([]);
  });

  it("lists only texts of the corpus as not exact", () => {
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
