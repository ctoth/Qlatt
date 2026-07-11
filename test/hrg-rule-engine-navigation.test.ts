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
        stress: { kind: "number" },
        duration: { kind: "number" },
      },
    },
  },
  relations: { Segment: { kind: "list", itemTypes: ["segment"] } },
} as const satisfies HrgSchema;

const INPUT = { reason: "fixture", citations: ["Taylor, Black & Caley 2001"] };

describe("graph-native predicate navigation", () => {
  it("scans tracked relation Items through expression and named predicates", () => {
    const utterance = new Utterance(SCHEMA);
    for (const [id, phoneme, stress] of [
      ["p", "P", 0],
      ["eh", "EH", 1],
      ["ih", "IH", 0],
      ["k", "K", 0],
    ] as const) {
      const item = utterance.createItem("segment", id);
      item.set("phoneme", phoneme, INPUT);
      item.set("stress", stress, INPUT);
      item.set("duration", 10, INPUT);
      utterance.relation("Segment").append(item, INPUT);
    }
    const spec = compileRuleEngineSpec({
      relations: {
        Segment: {
          type: "base",
          features: { phoneme: [], stress: [] },
          scalars: { duration: {} },
        },
      },
      predicates: { is_stressed: "has(current.stress) && current.stress == 1" },
      rules: {
        scan: {
          select: { relation: "Segment", where: "current.phoneme == 'K'" },
          define: {
            expression_hit: "look_back_where(current, 4, 'candidate.stress == 1')",
            predicate_hit: "look_back_pred(current, 4, 'is_stressed')",
          },
          apply: [{
            field: "duration",
            op: "add",
            value: "expression_hit.id == predicate_hit.id ? 10 : 0",
            tag: "navigation",
          }],
          citations: ["Taylor, Black & Caley 2001"],
        },
      },
      phases: [{ name: "rules", rules: ["scan"] }],
    });

    runGraphRuleEngine(utterance, spec);

    const k = utterance.getItem("k");
    const eh = utterance.getItem("eh");
    const ih = utterance.getItem("ih");
    if (!k || !eh || !ih) throw new Error("missing fixture Items");
    expect(k.get("duration")).toBe(20);
    expect(k.latestWrite("duration")?.parents).toEqual(expect.arrayContaining([
      eh.latestWrite("stress")?.decisionId,
      ih.latestWrite("stress")?.decisionId,
      utterance.relation("Segment").node(eh)?.write.decisionId,
      utterance.relation("Segment").node(ih)?.write.decisionId,
    ]));
  });
});
