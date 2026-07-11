import { describe, expect, it } from "vitest";
import { Utterance } from "../src/declarative-frontend/hrg";
import type { HrgSchema } from "../src/declarative-frontend/hrg";
import { runGraphRuleEngine } from "../src/declarative-frontend/hrg/rule-engine";
import { compileRuleEngineSpec } from "../src/declarative-frontend/rule-pack";

const SCHEMA = {
  itemTypes: {
    segment: {
      features: {
        flag: { kind: "boolean" },
        duration: { kind: "number" },
      },
    },
  },
  relations: { Segment: { kind: "list", itemTypes: ["segment"] } },
} as const satisfies HrgSchema;

const INPUT = { reason: "fixture", citations: ["Taylor, Black & Caley 2001"] };

function fixture(): Utterance {
  const utterance = new Utterance(SCHEMA);
  for (const [id, flag] of [["first", true], ["second", false]] as const) {
    const item = utterance.createItem("segment", id);
    item.set("flag", flag, INPUT);
    item.set("duration", 10, INPUT);
    utterance.relation("Segment").append(item, INPUT);
  }
  return utterance;
}

describe("graph-native CEL read-set tracking", () => {
  it("does not parent a short-circuited navigation branch", () => {
    const utterance = fixture();
    const first = utterance.getItem("first");
    const second = utterance.getItem("second");
    if (!first || !second) throw new Error("missing fixture Items");
    const spec = compileRuleEngineSpec({
      relations: { Segment: { type: "base", scalars: { duration: {} }, features: { flag: [true, false] } } },
      rules: {
        short_circuit: {
          select: {
            relation: "Segment",
            where: "current.id == 'first' && (current.flag == true || next.flag == true)",
          },
          apply: [{ field: "duration", op: "add", value: "1", tag: "read_set" }],
          citations: ["Taylor, Black & Caley 2001"],
        },
      },
      phases: [{ name: "rules", rules: ["short_circuit"] }],
    });

    runGraphRuleEngine(utterance, spec);

    const parents = first.latestWrite("duration")?.parents ?? [];
    expect(parents).toContain(first.latestWrite("flag")?.decisionId);
    expect(parents).toContain(utterance.relation("Segment").node(first)?.write.decisionId);
    expect(parents).not.toContain(second.latestWrite("flag")?.decisionId);
    expect(parents).not.toContain(utterance.relation("Segment").node(second)?.write.decisionId);
  });

  it("parents both source and reached membership for navigation results", () => {
    const utterance = fixture();
    const first = utterance.getItem("first");
    const second = utterance.getItem("second");
    if (!first || !second) throw new Error("missing fixture Items");
    const spec = compileRuleEngineSpec({
      relations: { Segment: { type: "base", scalars: { duration: {} }, features: { flag: [true, false] } } },
      rules: {
        navigate: {
          select: {
            relation: "Segment",
            where: "current.flag == false && behind(current, 1).flag == true",
          },
          apply: [{ field: "duration", op: "add", value: "1", tag: "read_set" }],
          citations: ["Taylor, Black & Caley 2001"],
        },
      },
      phases: [{ name: "rules", rules: ["navigate"] }],
    });

    runGraphRuleEngine(utterance, spec);

    const parents = second.latestWrite("duration")?.parents ?? [];
    expect(parents).toEqual(expect.arrayContaining([
      first.latestWrite("flag")?.decisionId,
      second.latestWrite("flag")?.decisionId,
      utterance.relation("Segment").node(first)?.write.decisionId,
      utterance.relation("Segment").node(second)?.write.decisionId,
    ]));
  });
});
