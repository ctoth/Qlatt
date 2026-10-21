/**
 * DECtalk's in-text commands standing inside a text, after something has
 * been spoken, from text, against the stock say.exe's audio sample for
 * sample (test/oracle-corpora/dectalk-us-commands-inside-text-v1.json,
 * written before any export), through the page's path
 * (scripts/oracle/dectalk-voice-compare.ts).
 *
 * A voice command, a rate command, a pause command and a change of the
 * speaker definition hold for the text after them (PH/ph_task.c:665-676,
 * 710-750). Here each place where one stands starts a parameter scope
 * (src/declarative-frontend/hrg/parameter-scope.ts): the state the commands
 * have left by then, laid over the policy the rules read, for the words
 * written from that place on (src/tts-frontend.ts, COMMANDS INSIDE THE TEXT).
 * What DECtalk carries across such a place, as measured:
 *   - the clause before the command closes with its own pause, at its own
 *     rate; the pause that opens the next clause is made at the new rate
 *     (pipeline.yaml dectalk_clause_initial_pause_frames);
 *   - the speaker definition is sent between the two clauses, one frame
 *     ahead of the next clause's first packet words, which are sent a frame
 *     late (frontend.yaml speakers.definition_frame_params);
 *   - a value a voice does not set keeps the last voice's (Frank after
 *     Dennis ends a clause with Dennis's glottal spread);
 *   - the words in front of the command are parsed without it: a command
 *     that sends a control item is no word of the stretch, where the flush
 *     character of [:sync] is (src/text-parser/frontend.ts itemClauseEnds).
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
import { PARAMETER_SCOPE_FEATURE } from "../src/declarative-frontend/hrg/parameter-scope";
import { createDiagnostics } from "../src/diagnostics";
import { createProvenanceCollector } from "../src/provenance";
import { textToKlattTrackDetailed } from "../src/tts-frontend";

const fixtureDir = path.join("test", "fixtures", "dectalk-commands-inside-text");
const corpus = readVoiceCorpus(
  path.join("test", "oracle-corpora", "dectalk-us-commands-inside-text-v1.json"),
);

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
  const decisions = provenance.getDecisions();
  return {
    result,
    decisions,
    commands: decisions.filter((decision) => decision.type.startsWith("text_parser_command")),
    // The frontend's own writes of the feature; a rule that creates an Item
    // writes it too, for the Item it created.
    bindings: decisions.filter(
      (decision) =>
        decision.subject.endsWith(`.${PARAMETER_SCOPE_FEATURE}`) &&
        decision.reason.startsWith("From offset"),
    ),
    warnings: diagnostics.getEntries().filter((event) => event.code?.startsWith("W_TEXT_COMMAND")),
  };
};

describe("DECtalk's commands inside a text", () => {
  it("puts the words after a command in a parameter scope whose decision names the state and depends on the command", () => {
    const { commands, bindings, warnings, result } = run(
      "The lamp was lit. [:rate 300] The room grew warm.",
    );
    expect(commands.map((decision) => decision.type)).toEqual(["text_parser_command"]);
    expect(commands[0]?.reason).toContain("from here on is spoken at 300 words per minute");
    expect(warnings).toEqual([]);
    expect(bindings.length).toBeGreaterThan(0);
    for (const binding of bindings) {
      expect(binding.parents).toContain(commands[0]?.id);
      expect(binding.reason).toContain("300 words per minute");
      expect(binding.reason).toContain("parameter scope command_1");
      expect(binding.citations.join(" ")).toContain("PH/ph_task.c");
    }
    // The Segments of the first sentence are in no scope.
    const scoped = result.utterance
      .relation("Segment")
      .listItems()
      .map((segment) => segment.get(PARAMETER_SCOPE_FEATURE));
    expect(scoped.slice(0, 5)).toEqual([undefined, undefined, undefined, undefined, undefined]);
    expect(scoped.at(-1)).toBe("command_1");
  });

  it("makes a rule's decision that read the policy on a scoped Item depend on that Item's binding", () => {
    const { decisions, bindings, result } = run(
      "The lamp was lit. [:rate 300] The room grew warm.",
    );
    const bindingOf = new Map(
      bindings.map((binding) => [
        binding.subject.slice("item:".length, -`.${PARAMETER_SCOPE_FEATURE}`.length),
        binding.id,
      ]),
    );
    const segments = result.utterance.relation("Segment").listItems();
    const inScope = segments.find((segment) => bindingOf.has(segment.id));
    const outside = segments[1];
    expect(inScope).toBeDefined();
    expect(outside && bindingOf.has(outside.id)).toBe(false);
    const bindingIds = new Set(bindingOf.values());
    const readsBinding = (itemId: string): boolean =>
      decisions.some(
        (decision) =>
          decision.subject.startsWith(`item:${itemId}.`) &&
          decision.stage === "rules" &&
          (decision.parents ?? []).some((parent) => bindingIds.has(parent)),
      );
    // The rate is read by the timing rules: a decision on the scoped
    // Segment has that Segment's own binding among its parents.
    const own = bindingOf.get(inScope?.id ?? "");
    expect(
      decisions.some(
        (decision) =>
          decision.subject.startsWith(`item:${inScope?.id ?? ""}.`) &&
          decision.stage === "rules" &&
          (decision.parents ?? []).includes(own ?? ""),
      ),
    ).toBe(true);
    // A Segment of the first sentence, well before the command, has none.
    expect(readsBinding(outside?.id ?? "")).toBe(false);
  });

  it("makes one scope of commands that stand at one place, and a scope a place otherwise", () => {
    const together = run("The lamp was lit. [:nb][:rate 240] The room grew warm.");
    expect(new Set(together.bindings.map((binding) => binding.reason)).size).toBe(1);
    expect(together.bindings[0]?.reason).toContain("voice betty, 240 words per minute");
    expect(together.bindings[0]?.parents).toEqual(together.commands.map((decision) => decision.id));
    const apart = run("The lamp was lit. [:nb] The room grew warm. [:rate 240] We sat down.");
    const names = new Set(
      apart.result.utterance
        .relation("Segment")
        .listItems()
        .map((segment) => segment.get(PARAMETER_SCOPE_FEATURE)),
    );
    expect([...names]).toEqual([undefined, "command_1", "command_2"]);
  });

  it("leaves a text with no command inside it without a scope", () => {
    const { bindings, result } = run("[:nb][:rate 240] The lamp was lit. The room grew warm.");
    expect(bindings).toEqual([]);
    expect(result.track.every((frame) => frame.params.speaker_epoch === undefined)).toBe(true);
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
