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

// #219: a rule that no frontend lists in a phase never runs. Its citation
// then describes behaviour the synthesizer does not have.

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
