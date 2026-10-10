/**
 * Texts with DECtalk's in-text commands, from text, against the stock
 * say.exe's audio sample for sample
 * (test/oracle-corpora/dectalk-us-commands-v1.json, written before any
 * export), through the page's path (scripts/oracle/dectalk-voice-compare.ts).
 * The frontend's text parser reads each command against DECtalk's command
 * table (src/text-parser/commands.ts, src/text-parser/frontend.ts).
 *
 * Carried out:
 *   - a voice command and a rate command that stand before any spoken text:
 *     the whole text has that voice and that rate. The rate is held to 50 to
 *     600 words per minute by the command and to 50 to 550 by the phonemic
 *     stage (CMD/cm_defs.h:62-69, PH/ph_task.c:710-714), and a rate command
 *     with no number repeats the number its slot holds, here the rate the
 *     text started with (CMD/cm_cmd.c:766-790);
 *   - a voice command, a rate command and a change of the speaker definition
 *     inside the text: the text from there on has them, by a parameter scope
 *     (src/declarative-frontend/hrg/parameter-scope.ts; more texts in
 *     test/dectalk-commands-inside-text.test.ts);
 *   - the clause end a command makes where it stands inside a sentence
 *     (LTS/ls_task.c:446-470, PH/ph_task.c:657-668);
 *   - the text DECtalk speaks, by default, in place of a command it cannot
 *     carry out (CMD/cm_cmd.c:812-873).
 *
 * NOT_EXACT lists the texts that are not DECtalk's samples, each with what
 * is missing. A text there that becomes exact fails its test, so that it is
 * taken off the list.
 *
 * The fixtures are the say.exe WAVs alone. Regenerate with the instrumented
 * and stock builds (scripts/oracle/export-dectalk-vtm-fixture.ts header):
 *
 *   ... scripts/oracle/export-dectalk-vtm-fixture.ts \
 *     --corpus test/oracle-corpora/dectalk-us-commands-v1.json \
 *     --out-dir test/fixtures/dectalk-commands --wav-only
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

const fixtureDir = path.join("test", "fixtures", "dectalk-commands");
const corpus = readVoiceCorpus(path.join("test", "oracle-corpora", "dectalk-us-commands-v1.json"));

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
    result,
    decisions: provenance
      .getDecisions()
      .filter((decision) => decision.type.startsWith("text_parser_command")),
    warnings: diagnostics.getEntries().filter((event) => event.code?.startsWith("W_TEXT_COMMAND")),
  };
};

describe("DECtalk's in-text commands", () => {
  it("shows the text with the clause ends and the error text the commands put in", () => {
    // The clause end is the frontend's mark for it; the text rules read it
    // as a sentence end where words are pending.
    expect(normalizeText("The ship came [:comma 300] in at dawn.", "dectalk-english")).toBe(
      "the ship came . in at dawn .",
    );
    expect(normalizeText("The ship [:nq] came in.", "dectalk-english")).toBe(
      "the ship . command error in command . came in .",
    );
    // A command that marks a place, or that DECtalk does not end a clause
    // for, leaves the sentence whole.
    expect(normalizeText("The ship [:index mark 1] came in.", "dectalk-english")).toBe(
      "the ship came in .",
    );
    expect(normalizeText("The ship [:pitch 50] came in.", "dectalk-english")).toBe(
      "the ship came in .",
    );
  });

  it("carries out a voice and a rate command that stand before any spoken text", () => {
    const { result, decisions, warnings } = run("[:nb][:rate 220] The ship came in.");
    expect(result.speakerParams).toEqual(
      textToKlattTrackDetailed("The ship came in.", undefined, 30, {
        frontendId: "dectalk-english",
        speaker: "betty",
        rate: 220 / 180,
      }).speakerParams,
    );
    expect(decisions.map((decision) => decision.type)).toEqual([
      "text_parser_command",
      "text_parser_command",
    ]);
    expect(decisions[0]?.reason).toContain("the voice betty");
    expect(decisions[1]?.reason).toContain("220 words per minute");
    expect(warnings).toEqual([]);
  });

  it("carries out a definition and a voice command inside a text, and names the command it does not carry out", () => {
    const { decisions, warnings } = run(
      "The ship came [:dv ap 200] in. [:nb] We went [:mode europe on] down.",
    );
    expect(decisions.map((decision) => decision.type)).toEqual([
      "text_parser_command",
      "text_parser_command",
      "text_parser_command_not_carried_out",
    ]);
    expect(decisions[0]?.reason).toContain("(dv)");
    expect(decisions[0]?.reason).toContain("for the text from here on");
    expect(decisions[1]?.reason).toContain("(nb)");
    expect(decisions[1]?.reason).toContain("from here on is spoken by the voice betty");
    expect(decisions[2]?.reason).toContain("(mode)");
    expect(warnings.map((event) => event.code)).toEqual(["W_TEXT_COMMAND_NOT_CARRIED_OUT"]);
  });

  it("speaks DECtalk's error text for a command in error, and says so", () => {
    const { decisions, warnings } = run("[:foo 1][:rate abc][:name 1] The ship came in.");
    expect(decisions.map((decision) => decision.type)).toEqual([
      "text_parser_command_error",
      "text_parser_command_error",
      "text_parser_command_error",
    ]);
    expect(decisions[0]?.reason).toContain('"Command error in command"');
    expect(decisions[1]?.reason).toContain('"Command error in parameter"');
    expect(decisions[2]?.reason).toContain('"Command error in string value"');
    expect(warnings.map((event) => event.code)).toEqual([
      "W_TEXT_COMMAND_ERROR",
      "W_TEXT_COMMAND_ERROR",
      "W_TEXT_COMMAND_ERROR",
    ]);
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
