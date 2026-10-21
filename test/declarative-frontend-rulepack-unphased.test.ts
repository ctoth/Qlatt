import { describe, expect, it } from "vitest";
import {
  assertBundledRulesPhased,
  type CompiledRulepack,
  compileRuleEngineSpec,
  findUnphasedBundledRules,
  loadBundledRulepackSpec,
  rulepackRuleOrigins,
  unphasedRules,
} from "../src/declarative-frontend/rule-pack";

// #219: unphased effects never run. Host-requested pure definitions (#261/#243)
// are evaluated separately and must not excuse an unphased effect.

const relations = {
  Segment: { type: "base", features: { type: ["vowel"] }, scalars: { duration: {} } },
};
const tags = { duration: "changes segment duration" };

function rule() {
  return {
    kind: "scalar",
    select: { relation: "Segment", where: "true" },
    apply: [{ field: "duration", op: "add", value: "1", tag: "duration" }],
    citations: ["Klatt 1976"],
  };
}

function spec(phasedRules: string[]): CompiledRulepack {
  return compileRuleEngineSpec({
    tags,
    relations,
    rules: { listed: rule(), orphan: rule() },
    phases: [{ name: "duration", rules: phasedRules }],
  });
}

describe("unphased rule detection", () => {
  it("reports a rule that no spec phases, and clears it when an extending spec phases it", () => {
    const base = spec(["listed"]);
    expect(unphasedRules(new Map([["base", base]]))).toEqual([
      { rule: "orphan", origin: "unknown", definedIn: ["base"] },
    ]);
    const child = spec(["listed", "orphan"]);
    expect(
      unphasedRules(
        new Map([
          ["base", base],
          ["child", child],
        ]),
      ),
    ).toEqual([]);
    expect(unphasedRules(new Map([["base", base]]), ["orphan"])).toEqual(
      unphasedRules(new Map([["base", base]])),
    );
    const requested = compileRuleEngineSpec({
      tags,
      relations,
      rules: {
        orphan: {
          select: { relation: "Segment", where: "true" },
          define: { duration: "current.duration" },
          apply: [],
          citations: ["Klatt 1976"],
        },
      },
      phases: [],
    });
    expect(unphasedRules(new Map([["requested", requested]]))).toHaveLength(1);
    expect(unphasedRules(new Map([["requested", requested]]), ["orphan"])).toEqual([]);
    const deletion = compileRuleEngineSpec({
      ...requested,
      rules: { orphan: { ...requested.rules.orphan, delete: true } },
    });
    expect(unphasedRules(new Map([["requested", deletion]]), ["orphan"])).toHaveLength(1);
  });

  it("records which rulepack file declares each bundled rule", () => {
    const origins = rulepackRuleOrigins(loadBundledRulepackSpec("qlatt-english"));
    expect(origins.stress_duration).toBe("/rules/frontends/qlatt-english/phases/duration.yaml");
    const beauty = rulepackRuleOrigins(loadBundledRulepackSpec("qlatt-beauty"));
    // Inherited through `extends`: the declaring file is the base frontend's.
    expect(beauty.stress_duration).toBe("/rules/frontends/qlatt-english/phases/duration.yaml");
  });

  it("finds no bundled rule that every frontend leaves unphased", () => {
    expect(findUnphasedBundledRules()).toEqual([]);
    expect(() => assertBundledRulesPhased()).not.toThrow();
  });
});
