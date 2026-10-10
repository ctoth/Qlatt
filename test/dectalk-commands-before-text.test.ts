/**
 * DECtalk's in-text commands standing before any spoken text, from text,
 * against the stock say.exe's audio sample for sample
 * (test/oracle-corpora/dectalk-us-commands-before-text-v1.json, written
 * before any export), through the page's path
 * (scripts/oracle/dectalk-voice-compare.ts).
 *
 * Carried out for the whole text when the command stands before anything is
 * spoken:
 *   - [:comma N] and [:period N] (cp, pp): N ms more at each comma or
 *     sentence end, held between the phonemic stage's limits and turned into
 *     frames (CMD/cm_copt.c:2453-2506, PH/ph_task.c:717-722,
 *     p_us_tim.c:241-252);
 *   - [:dv <word> <number> ...]: entries of the selected voice's speaker
 *     definition, with the voice's tuning table added and the entry's limits
 *     held (CMD/cm_copt.c:2840-2887, PH/ph_vset.c:175-232), from which the
 *     voice is derived again as setspdef() derives it
 *     (src/dectalk-speaker-definition.ts). A voice command after it starts
 *     again from that voice's own definition.
 *   - [:mode spell on|off|set]: the spelling mode
 *     (test/dectalk-mode-spell.test.ts);
 *   - [:mode math on|off|set]: the math mode
 *     (test/dectalk-mode-math.test.ts).
 * Carried out wherever it stands:
 *   - [:punct none|some|all]: the mode of the clause reader and of the
 *     punctuation rules (CMD/cm_copt.c:1249-1276);
 *   - [:pitch N]: it changes no speech in DECtalk either (the number is read
 *     only at an item nothing sends, PH/ph_task.c:751-757).
 *
 * NOT_EXACT lists the texts that are not DECtalk's samples, each with what
 * is missing; those commands keep their decision and their diagnostic. A
 * text there that becomes exact fails its test, so that it is taken off the
 * list.
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
import { loadRulepackSpecFromPath } from "../src/declarative-frontend/rule-pack";
import {
  changeDefinition,
  type SpeakerDefinitionData,
  voiceFieldsOfDefinition,
} from "../src/dectalk-speaker-definition";
import { getVoiceRegistry, resolveVoice } from "../src/dectalk-voice";
import { createDiagnostics } from "../src/diagnostics";
import { createProvenanceCollector } from "../src/provenance";
import { textToKlattTrackDetailed } from "../src/tts-frontend";
import { loadYamlDocumentSync } from "../src/yaml-loader";

const fixtureDir = path.join("test", "fixtures", "dectalk-commands-before-text");
const corpus = readVoiceCorpus(
  path.join("test", "oracle-corpora", "dectalk-us-commands-before-text-v1.json"),
);

const MODE =
  "the mode is a flag of DECtalk's letter-to-sound stage; of the modes only spell and math " +
  "are ported (test/dectalk-mode-spell.test.ts, test/dectalk-mode-math.test.ts)";

/** Not DECtalk's samples yet. */
const NOT_EXACT: Readonly<Record<string, string>> = {
  "bo-08":
    "[:punct pass]: DECtalk's text stage hands the characters on without reading clauses " +
    "(CMD/cm_text.c:379); not ported, the mode stays",
  "bo-11": `[:mode europe on]: ${MODE}`,
  "bo-14": `[:mode reading on]: ${MODE}`,
};

const run = (text: string, speaker = "paul") => {
  const provenance = createProvenanceCollector();
  const diagnostics = createDiagnostics();
  const result = textToKlattTrackDetailed(text, undefined, 30, {
    frontendId: "dectalk-english",
    speaker,
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

const spec = loadRulepackSpecFromPath("/rules/frontends/dectalk-english/frontend.yaml");
const registry = getVoiceRegistry(spec);
if (!registry?.definitionPath) throw new Error("the frontend declares no speaker definition data");
const data = loadYamlDocumentSync<SpeakerDefinitionData>(registry.definitionPath);
const at = (name: string): number => data.names.indexOf(name);

describe("a speaker definition and the voice setspdef() makes of it", () => {
  it("gives every voice the fields its file has, from the file's own definition", () => {
    for (const name of registry.voices) {
      const doc = loadYamlDocumentSync<Record<string, unknown>>(`${registry.dir}/${name}.yaml`);
      const definition = doc.definition as { values: number[]; tune: number[] };
      const derived = voiceFieldsOfDefinition(definition.values, data, {
        frank: doc.last_voice === 3,
        voiceNumber: doc.last_voice as number,
      });
      for (const [field, value] of Object.entries(derived)) {
        expect(doc[field], `${name}.${field}`).toBe(value);
      }
    }
  });

  it("adds the voice's tuning table to a number and holds the entry's limits", () => {
    const paul = loadYamlDocumentSync<Record<string, unknown>>(`${registry.dir}/paul.yaml`)
      .definition as { values: number[]; tune: number[] };
    // AP has no tuning; its limits are 50 and 350 (PH/ph_vdefi.c limit[]).
    expect(changeDefinition(paul, data, [{ index: at("AP"), value: 200 }]).values[at("AP")]).toBe(
      200,
    );
    expect(changeDefinition(paul, data, [{ index: at("AP"), value: 900 }]).values[at("AP")]).toBe(
      350,
    );
    expect(changeDefinition(paul, data, [{ index: at("AP"), value: 10 }]).values[at("AP")]).toBe(
      50,
    );
    // GF: Paul's tuning table has -3 there.
    expect(paul.tune[at("GF")]).toBe(-3);
    expect(changeDefinition(paul, data, [{ index: at("GF"), value: 60 }]).values[at("GF")]).toBe(
      57,
    );
    // An index outside the definition changes nothing (setparam's first test).
    expect(changeDefinition(paul, data, [{ index: 99, value: 1 }]).values).toEqual(paul.values);
  });

  it("derives the pitch floor and range from AP and PR", () => {
    const changed = resolveVoice(registry, "paul", undefined, [
      { index: at("AP"), value: 200 },
      { index: at("PR"), value: 50 },
    ]);
    // f0_minimum = (AP - 12) * 10, f0_scale_factor = PR * 41 (ph_vset.c:675-685).
    expect(changed.params.f0_minimum).toBe(1880);
    expect(changed.params.f0_scale_factor).toBe(2050);
    expect(changed.params.base_f0_hz).toBe(200);
    // The voice as it is without a change.
    expect(resolveVoice(registry, "paul").params.f0_minimum).toBe(1100);
  });
});

describe("DECtalk's commands before any spoken text", () => {
  it("adds a pause command's milliseconds to the comma's or the period's pause", () => {
    const { decisions, warnings } = run("[:comma 300][:pp -900] The tide went out, and we left.");
    expect(decisions.map((decision) => decision.type)).toEqual([
      "text_parser_command",
      "text_parser_command",
    ]);
    expect(decisions[0]?.reason).toContain("300 ms is added to the pause at each comma");
    // The period command holds its number at -420 (CMD/cm_defs.h:71).
    expect(decisions[1]?.reason).toContain("-420 ms is added to the pause at each sentence end");
    expect(decisions[1]?.reason).toContain("-900 is outside -420 to 30000");
    expect(warnings).toEqual([]);
  });

  it("changes entries of the voice's definition, and starts again at a voice command", () => {
    const changed = run("[:dv ap 200 pr 50] The tide went out.");
    expect(changed.decisions.map((decision) => decision.type)).toEqual([
      "text_parser_command",
      "text_parser_command",
    ]);
    expect(changed.decisions[0]?.reason).toContain("entry ap");
    expect(changed.result.speakerParams?.f0_minimum).toBe(1880);
    expect(changed.warnings).toEqual([]);
    // The voice command loads Betty's own definition.
    const reset = run("[:dv ap 240][:nb] The tide went out.");
    expect(reset.result.speakerParams).toEqual(
      run("The tide went out.", "betty").result.speakerParams,
    );
    const after = run("[:nb][:dv ap 240] The tide went out.");
    expect(after.result.speakerParams?.f0_minimum).toBe(2280);
  });

  it("speaks DECtalk's error text for a dv command it cannot read", () => {
    const word = run("[:dv zz 5] The tide went out.");
    expect(word.decisions[0]?.reason).toContain('"Command error in string value"');
    const number = run("[:dv ap] The tide went out.");
    expect(number.decisions[0]?.type).toBe("text_parser_command_error");
    const save = run("[:dv save 5] The tide went out.");
    expect(save.decisions[0]?.type).toBe("text_parser_command_error");
    expect(save.decisions[0]?.reason).toBe(
      number.decisions[0]?.reason
        .replace("[:dv ap]", "[:dv save 5]")
        .replace("the entry has no number", "save takes no number"),
    );
  });

  it("takes the punctuation mode anywhere in a text, and not the mode pass", () => {
    const all = run("The tide went [:punct all] out (at noon).");
    expect(all.decisions.map((decision) => decision.type)).toEqual(["text_parser_command"]);
    expect(all.decisions[0]?.reason).toContain("punctuation mode to all");
    const pass = run("[:punct pass] The tide went out (at noon).");
    expect(pass.decisions.map((decision) => decision.type)).toEqual([
      "text_parser_command_not_carried_out",
    ]);
    expect(pass.warnings.map((event) => event.code)).toEqual(["W_TEXT_COMMAND_NOT_CARRIED_OUT"]);
  });

  it("keeps a decision and a diagnostic for each command it does not carry out", () => {
    const { decisions, warnings } = run(
      "[:mode europe on][:volume set 50][:dv save] The tide went out.",
    );
    expect(decisions.map((decision) => decision.type)).toEqual([
      "text_parser_command_not_carried_out",
      "text_parser_command_not_carried_out",
      "text_parser_command_not_carried_out",
    ]);
    expect(decisions[0]?.reason).toContain("(mode)");
    expect(decisions[1]?.reason).toContain("the volume of the audio device");
    expect(decisions[2]?.reason).toContain("the voice Val");
    expect(warnings.map((event) => event.code)).toEqual([
      "W_TEXT_COMMAND_NOT_CARRIED_OUT",
      "W_TEXT_COMMAND_NOT_CARRIED_OUT",
      "W_TEXT_COMMAND_NOT_CARRIED_OUT",
    ]);
    // The pitch command changes no speech in DECtalk either: carried out.
    const pitch = run("[:pitch 80] The tide went out.");
    expect(pitch.decisions.map((decision) => decision.type)).toEqual(["text_parser_command"]);
    expect(pitch.warnings).toEqual([]);
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
