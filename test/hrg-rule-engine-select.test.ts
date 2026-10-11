import { describe, expect, it } from "vitest";
import type { HrgSchema } from "../src/declarative-frontend/hrg";
import { Utterance } from "../src/declarative-frontend/hrg";
import {
  GraphRuleEvaluationOwner,
  runGraphRuleEngine,
} from "../src/declarative-frontend/hrg/rule-engine";
import {
  compileRuleEngineSpec,
  QLATT_ENGLISH_RULEPACK,
} from "../src/declarative-frontend/rule-pack";
import { qlattInventoryResource } from "./utils/qlatt-english-inventory";

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
  it.each([
    ["duration", {}, 2.5],
    ["duration", { unit: "s" }, 2.5],
    ["duration", { unit: "ms" }, 2.5],
    ["duration", { unit: "ms", quantum: 1 }, 3],
    ["energy", { quantum: 1 }, 3],
    ["energy", {}, 2.5],
  ])("resolves %s using declared metadata %j", (field, metadata, expected) => {
    for (const op of ["set", "add", "mul", "min", "max"]) {
      const { utterance, vowelId } = fixture();
      utterance.getItem(vowelId)?.set(field, op === "min" ? 3 : 2, INPUT);
      const value = op === "add" ? "0.5" : op === "mul" ? "1.25" : "2.5";
      const spec = compileRuleEngineSpec({
        relations: { Segment: { type: "base", scalars: { [field]: metadata } } },
        rules: {
          set_value: {
            kind: "scalar",
            select: { relation: "Segment", where: "true" },
            apply: [{ field, op, value, tag: "fixture" }],
            citations: ["Engineering estimate: scalar fixture"],
          },
        },
        phases: [{ name: "test", rules: ["set_value"] }],
      });
      runGraphRuleEngine(utterance, spec);
      expect(utterance.getItem(vowelId)?.get(field), op).toBe(expected);
    }
  });
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
    runGraphRuleEngine(second.utterance, spec, {
      parameters: { scale: 3 },
      evaluationOwner: owner,
    });

    expect(first.utterance.getItem(first.vowelId)?.get("duration")).toBe(200);
    expect(second.utterance.getItem(second.vowelId)?.get("duration")).toBe(300);
  });

  it("reads a run's policy values as the parameters stand when it runs", () => {
    const spec = compileRuleEngineSpec({
      relations: {
        Segment: { type: "base", features: { type: ["vowel", "stop"] }, scalars: { duration: {} } },
      },
      rules: {
        scale_vowel: {
          kind: "scalar",
          select: { relation: "Segment", where: "current.type == 'vowel'" },
          apply: [
            { field: "duration", op: "mul", value: "params.timing.scale[0]", tag: "duration" },
          ],
          citations: ["Klatt 1976"],
        },
      },
      phases: [{ name: "duration", rules: ["scale_vowel"] }],
    });
    const scaled = (parameters: Record<string, unknown>): unknown => {
      const { utterance, vowelId } = fixture();
      runGraphRuleEngine(utterance, spec, { parameters });
      return utterance.getItem(vowelId)?.get("duration");
    };
    const policy = (scale: number) => ({
      timing: { scale: { value: [scale], citations: ["Klatt 1976"] } },
    });

    // A tree that can still change is projected again by every run.
    const changing = policy(2);
    expect(scaled(changing)).toBe(200);
    changing.timing.scale.value[0] = 3;
    expect(scaled(changing)).toBe(300);
    changing.timing.scale = { value: [4], citations: [] };
    expect(scaled(changing)).toBe(400);

    // A frozen tree over one that is not frozen can change too.
    const shallow = Object.freeze(policy(2));
    expect(scaled(shallow)).toBe(200);
    shallow.timing.scale.value[0] = 5;
    expect(scaled(shallow)).toBe(500);

    // Trees frozen all the way down keep their own values.
    const frozen = (scale: number) => {
      const tree = policy(scale);
      Object.freeze(tree.timing.scale.value);
      Object.freeze(tree.timing.scale.citations);
      Object.freeze(tree.timing.scale);
      Object.freeze(tree.timing);
      return Object.freeze(tree);
    };
    const two = frozen(2);
    expect(scaled(two)).toBe(200);
    expect(scaled(two)).toBe(200);
    expect(scaled(frozen(3))).toBe(300);
  });

  it("applies declared Klatt scalar multiplication above the incompressible floor", () => {
    const { utterance, stopId } = fixture();
    const stop = utterance.getItem(stopId);
    if (!stop) throw new Error("missing stop fixture");
    stop.set("inherentDuration", 100, INPUT);
    const spec = compileRuleEngineSpec({
      parameters: { ...QLATT_ENGLISH_RULEPACK.parameters, scale: 0.25 },
      relations: {
        Segment: {
          type: "base",
          features: { type: ["vowel", "stop"], inherentDuration: [], durationFloor: [] },
          scalars: {
            duration: (QLATT_ENGLISH_RULEPACK.relations.Segment.scalars as Record<string, unknown>)
              .duration,
          },
        },
      },
      rules: {
        shorten_stop: {
          kind: "scalar",
          select: { relation: "Segment", where: "current.type == 'stop'" },
          apply: [{ field: "duration", op: "mul", value: "params.scale", tag: "duration" }],
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
      inventory: qlattInventoryResource(utterance),
    });

    expect(stop.get("duration")).toBe(50);
    expect(utterance.diagnostics.getEntries()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "W_DURATION_FLOOR_FALLBACK",
          data: expect.objectContaining({ floor: 40 }),
        }),
      ]),
    );
  });
});
