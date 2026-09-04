import { describe, expect, it } from "vitest";
import {
  GraphRuleEvaluationOwner,
  runGraphRuleEngine,
} from "../src/declarative-frontend/hrg/rule-engine";
import { Utterance } from "../src/declarative-frontend/hrg";
import type { HrgSchema } from "../src/declarative-frontend/hrg";
import { compileRuleEngineSpec } from "../src/declarative-frontend/rule-pack";

const SCHEMA = {
  itemTypes: {
    segment: {
      features: {
        type: { kind: "string", values: ["vowel", "stop"] },
        duration: { kind: "number" },
        inherentDuration: { kind: "number" },
        durationFloor: { kind: "number" },
        energy: { kind: "number" },
        metadata: {
          kind: "object",
          fields: { eligible: { kind: "boolean" } },
        },
      },
    },
  },
  relations: { Segment: { kind: "list", itemTypes: ["segment"] } },
} as const satisfies HrgSchema;

const INPUT = { reason: "fixture", citations: ["Taylor, Black & Caley 2001"] };

function fixture(): { utterance: Utterance; vowelId: string; stopId: string } {
  const utterance = new Utterance(SCHEMA);
  const vowel = utterance.createItem("segment", "vowel");
  vowel.set("type", "vowel", INPUT);
  vowel.set("duration", 100, INPUT);
  vowel.set("energy", 2, INPUT);
  vowel.set("metadata", { eligible: true }, INPUT);
  utterance.relation("Segment").append(vowel, INPUT);
  const stop = utterance.createItem("segment", "stop");
  stop.set("type", "stop", INPUT);
  stop.set("duration", 80, INPUT);
  stop.set("energy", 1, INPUT);
  utterance.relation("Segment").append(stop, INPUT);
  return { utterance, vowelId: vowel.id, stopId: stop.id };
}

describe("graph-native rule engine select/scalar execution", () => {
  it("evaluates tracked CEL reads and commits one atomic scalar transaction", () => {
    const { utterance, vowelId, stopId } = fixture();
    const originalVowel = utterance.getItem(vowelId);
    if (!originalVowel) throw new Error("missing vowel fixture");
    const expectedParents = ["type", "metadata", "duration", "energy"].map((key) => {
      const decisionId = originalVowel.latestWrite(key)?.decisionId;
      if (!decisionId) throw new Error(`missing ${key} fixture write`);
      return decisionId;
    });
    const spec = compileRuleEngineSpec({
      parameters: { scale: 1.5 },
      relations: {
        Segment: {
          type: "base",
          features: { type: ["vowel", "stop"], metadata: [] },
          scalars: { duration: {}, energy: {} },
        },
      },
      rules: {
        scale_vowel: {
          kind: "scalar",
          select: {
            relation: "Segment",
            where: "current.type == 'vowel' && current.metadata['eligible'] == true",
          },
          define: { scaled: "current.duration * params.scale" },
          apply: [
            { field: "duration", op: "set", value: "scaled", tag: "duration" },
            { field: "energy", op: "add", value: "3", tag: "energy" },
          ],
          citations: ["Klatt 1976"],
        },
      },
      phases: [{ name: "duration", rules: ["scale_vowel"] }],
    });

    runGraphRuleEngine(utterance, spec);

    const vowel = utterance.getItem(vowelId);
    const stop = utterance.getItem(stopId);
    expect(vowel?.get("duration")).toBe(150);
    expect(vowel?.get("energy")).toBe(5);
    expect(stop?.get("duration")).toBe(80);
    const journal = utterance.journal();
    expect(journal).toHaveLength(1);
    expect(journal[0].operations).toHaveLength(2);
    expect(vowel?.latestWrite("duration")?.parents).toEqual(
      expect.arrayContaining(expectedParents),
    );
    expect(vowel?.latestWrite("duration")?.tag).toBe("duration");
    expect(vowel?.latestWrite("energy")?.tag).toBe("energy");
  });

  it("rejects an invalid later effect without committing an earlier effect", () => {
    const { utterance, vowelId } = fixture();
    const spec = compileRuleEngineSpec({
      relations: {
        Segment: {
          type: "base",
          features: { type: ["vowel", "stop"] },
          scalars: { duration: {}, energy: {} },
        },
      },
      rules: {
        invalid_batch: {
          kind: "scalar",
          select: { relation: "Segment", where: "current.type == 'vowel'" },
          apply: [
            { field: "duration", op: "set", value: "90", tag: "duration" },
            { field: "energy", op: "set", value: "'bad'", tag: "duration" },
          ],
          citations: ["Klatt 1976"],
        },
      },
      phases: [{ name: "duration", rules: ["invalid_batch"] }],
    });

    expect(() => runGraphRuleEngine(utterance, spec)).toThrowError(/E_HRG_FEATURE_VALUE/);
    expect(utterance.getItem(vowelId)?.get("duration")).toBe(100);
    expect(utterance.journal()).toEqual([]);
    expect(utterance.diagnostics.getEntries()).toContainEqual(
      expect.objectContaining({ code: "HRG_TRANSACTION_REJECTED" }),
    );
  });

  it("reuses one evaluation owner without leaking match parameters between utterances", () => {
    const spec = compileRuleEngineSpec({
      relations: {
        Segment: { type: "base", features: { type: ["vowel", "stop"] }, scalars: { duration: {} } },
      },
      rules: {
        scale_vowel: {
          kind: "scalar",
          select: { relation: "Segment", where: "current.type == 'vowel'" },
          apply: [{ field: "duration", op: "mul", value: "params.scale", tag: "duration" }],
          citations: ["Klatt 1976"],
        },
      },
      phases: [{ name: "duration", rules: ["scale_vowel"] }],
    });
    const owner = new GraphRuleEvaluationOwner();
    const first = fixture();
    const second = fixture();

    runGraphRuleEngine(first.utterance, spec, { parameters: { scale: 2 }, evaluationOwner: owner });
    runGraphRuleEngine(second.utterance, spec, { parameters: { scale: 3 }, evaluationOwner: owner });

    expect(first.utterance.getItem(first.vowelId)?.get("duration")).toBe(200);
    expect(second.utterance.getItem(second.vowelId)?.get("duration")).toBe(300);
  });

  it("applies declared Klatt scalar multiplication above the incompressible floor", () => {
    const { utterance, stopId } = fixture();
    const stop = utterance.getItem(stopId);
    if (!stop) throw new Error("missing stop fixture");
    stop.set("inherentDuration", 100, INPUT);
    const spec = compileRuleEngineSpec({
      relations: {
        Segment: {
          type: "base",
          features: { type: ["vowel", "stop"], inherentDuration: [] },
          scalars: {
            duration: { unit: "ms", resolution: "klatt", max: 500, floor_field: "durationFloor" },
          },
        },
      },
      rules: {
        shorten_stop: {
          kind: "scalar",
          select: { relation: "Segment", where: "current.type == 'stop'" },
          apply: [{ field: "duration", op: "mul", value: "0.25", tag: "duration" }],
          citations: ["Klatt 1976"],
        },
      },
      phases: [{ name: "duration", rules: ["shorten_stop"], resolve_scalars: ["duration"] }],
    });

    runGraphRuleEngine(utterance, spec, {
      parameters: {
        policy: {
          duration: {
            incompressibility_ratio_vowel: 0.3,
            incompressibility_ratio_consonant: 0.4,
          },
        },
      },
    });

    expect(stop.get("duration")).toBe(50);
  });
});
