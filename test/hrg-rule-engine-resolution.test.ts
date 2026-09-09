import { describe, expect, it } from "vitest";
import type { HrgSchema } from "../src/declarative-frontend/hrg";
import { Utterance } from "../src/declarative-frontend/hrg";
import { runGraphRuleEngine } from "../src/declarative-frontend/hrg/rule-engine";
import { parseDslSpec } from "../src/declarative-frontend/parser";
import { compileRuleEngineSpec } from "../src/declarative-frontend/rule-pack";
import { validateDslSpec } from "../src/declarative-frontend/validation";

// #218: a `mul` effect may override a scalar's declared resolution. The Klatt
// 1976 floor formula k * (d - floor) + floor stays the default for
// `resolution: klatt` scalars; `resolution: standard` on the effect gives
// plain multiplication (Crystal & House 1982 rate scaling of total duration).

const SCHEMA = {
  itemTypes: {
    segment: {
      features: {
        duration: { kind: "number" },
        durationFloor: { kind: "number" },
      },
    },
  },
  relations: { Segment: { kind: "list", itemTypes: ["segment"] } },
} as const satisfies HrgSchema;

const INPUT = { reason: "fixture", citations: ["Klatt 1976"] };

function fixture(): Utterance {
  const utterance = new Utterance(SCHEMA);
  const item = utterance.createItem("segment", "only");
  item.set("duration", 100, INPUT);
  item.set("durationFloor", 40, INPUT);
  utterance.relation("Segment").append(item, INPUT);
  return utterance;
}

function specWith(effect: Record<string, unknown>) {
  return {
    relations: {
      Segment: {
        type: "base",
        features: { durationFloor: [] },
        scalars: { duration: { unit: "ms", resolution: "klatt", floor_field: "durationFloor" } },
      },
    },
    rules: {
      scale: {
        kind: "scalar",
        select: { relation: "Segment", where: "true" },
        apply: [{ field: "duration", op: "mul", value: "0.5", tag: "speech_rate", ...effect }],
        citations: ["Crystal & House 1982"],
      },
    },
    phases: [{ name: "duration", rules: ["scale"] }],
  };
}

describe("per-effect scalar resolution", () => {
  it("applies the Klatt floor formula by default on a klatt-resolution scalar", () => {
    const utterance = fixture();
    runGraphRuleEngine(utterance, compileRuleEngineSpec(specWith({})));
    // 0.5 * (100 - 40) + 40
    expect(utterance.getItem("only")?.get("duration")).toBe(70);
  });

  it("multiplies the total duration when the effect declares resolution: standard", () => {
    const utterance = fixture();
    runGraphRuleEngine(utterance, compileRuleEngineSpec(specWith({ resolution: "standard" })));
    expect(utterance.getItem("only")?.get("duration")).toBe(50);
  });

  it("rejects an unknown resolution value and resolution on a non-mul op", () => {
    const diagnostics = validateDslSpec(
      parseDslSpec({
        parameters: {},
        tags: { speech_rate: "scales duration with speaking rate" },
        relations: specWith({}).relations,
        rules: {
          bad_value: {
            ...specWith({ resolution: "linear" }).rules.scale,
          },
          bad_op: {
            ...specWith({}).rules.scale,
            apply: [
              {
                field: "duration",
                op: "set",
                value: "1",
                tag: "speech_rate",
                resolution: "standard",
              },
            ],
          },
        },
        phases: [{ name: "duration", rules: ["bad_value", "bad_op"] }],
      }),
      { inventoryPhonemes: ["AA", "SIL"] },
    );
    expect(diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "E_EFFECT_RESOLUTION_INVALID" }),
        expect.objectContaining({ code: "E_EFFECT_RESOLUTION_OP" }),
      ]),
    );
  });
});
