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

const PERIOD_WORD =
  'the period right after the bracket is the word "period" in DECtalk (a period that ' +
  "stands alone); the symbols of the bracket itself are DECtalk's";
const NUMBERS =
  "the numbers after a symbol (a duration, a pitch) are read and not applied: the symbols " +
  "are DECtalk's, their durations and pitch are the rules'";

/** Not DECtalk's samples yet. */
const NOT_EXACT: Readonly<Record<string, string>> = {
  "pm-05": PERIOD_WORD,
  "pm-12": PERIOD_WORD,
  "pm-16": `${NUMBERS}; ${PERIOD_WORD}`,
  "pm-17": NUMBERS,
  "pm-18": `a silence symbol inside a bracket is dropped; ${NUMBERS}; ${PERIOD_WORD}`,
  "pm-19": `${NUMBERS}; ${PERIOD_WORD}`,
  "pm-20": `${NUMBERS}; ${PERIOD_WORD}`,
  "pm-21": `${NUMBERS}; ${PERIOD_WORD}`,
  "pm-22": `${NUMBERS}; ${PERIOD_WORD}`,
  "pm-23": `${NUMBERS}; ${PERIOD_WORD}`,
  "pm-24": `${NUMBERS}; ${PERIOD_WORD}`,
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
    warnings: diagnostics.getEntries().filter((event) => event.code?.startsWith("W_TEXT_COMMAND")),
  };
};

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
