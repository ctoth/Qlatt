import { describe, expect, it } from "vitest";
import { Utterance } from "../src/declarative-frontend/hrg";
import type { HrgSchema } from "../src/declarative-frontend/hrg";
import { runGraphRuleEngine } from "../src/declarative-frontend/hrg/rule-engine";
import { compileRuleEngineSpec } from "../src/declarative-frontend/rule-pack";

const SCHEMA = {
  itemTypes: {
    segment: {
      features: {
        phoneme: { kind: "string" },
        duration: { kind: "number" },
        breakIndex: { kind: "number" },
        x: { kind: "number" },
        active: { kind: "boolean" },
      },
    },
  },
  relations: { Segment: { kind: "list", itemTypes: ["segment"] } },
} as const satisfies HrgSchema;

const META = {
  ruleId: "fixture",
  phase: "input",
  tag: "fixture",
  reason: "fixture",
  citations: ["Taylor, Black & Caley 2001"],
};

describe("graph-native contour execution", () => {
  it("computes selected-Item phrase progress and resets at the declared break", () => {
    const utterance = new Utterance(SCHEMA);
    const transaction = utterance.beginTransaction(META);
    const definitions = [
      ["a", "AA", 100, 0],
      ["b", "L", 300, 0],
      ["break", "SIL", 50, 4],
      ["c", "IY", 200, 0],
    ] as const;
    const items = definitions.map(([id]) => transaction.createItem("segment", id));
    for (let index = 0; index < items.length; index += 1) {
      const [id, phoneme, duration, breakIndex] = definitions[index];
      const item = items[index];
      if (item.id !== id) throw new Error("fixture id mismatch");
      transaction.set(item, "phoneme", phoneme);
      transaction.set(item, "duration", duration);
      transaction.set(item, "breakIndex", breakIndex);
      transaction.set(item, "x", 0);
      transaction.set(item, "active", true);
      transaction.append("Segment", item);
    }
    transaction.partitionAnchors(items, utterance.axis.start.id, utterance.axis.end.id);
    transaction.commit();
    const spec = compileRuleEngineSpec({
      relations: {
        Segment: {
          type: "base",
          features: { phoneme: [], breakIndex: [], active: [true, false] },
          scalars: { duration: {}, x: {} },
        },
      },
      rules: {
        phrase_progress: {
          select: { relation: "Segment", where: "current.phoneme != 'SIL'" },
          contour: {
            domain: "phrase",
            reset_break_index: 4,
            apply: [{ field: "x", op: "set", value: "position_ratio", tag: "contour" }],
          },
          define: {
            position_ratio:
              "contour.phrase_duration_sec > 0 ? contour.elapsed_sec / contour.phrase_duration_sec : 0",
          },
          citations: ["O'Shaughnessy 1976"],
        },
      },
      phases: [{ name: "prosody", rules: ["phrase_progress"] }],
    });

    runGraphRuleEngine(utterance, spec);

    expect(utterance.getItem("a")?.get("x")).toBeCloseTo(0.125, 6);
    expect(utterance.getItem("b")?.get("x")).toBeCloseTo(0.625, 6);
    expect(utterance.getItem("break")?.get("x")).toBe(0);
    expect(utterance.getItem("c")?.get("x")).toBeCloseTo(0.5, 6);
  });
});
