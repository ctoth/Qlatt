import { describe, expect, it } from "vitest";
import { loadBundledRulepackSpec } from "../src/declarative-frontend/rule-pack";

const qlattRulepack = loadBundledRulepackSpec("qlatt-english");

function ruleOp(rule: unknown): unknown {
  if (!rule || typeof rule !== "object") return undefined;
  if (!("op" in rule)) return undefined;
  return (rule as { op?: unknown }).op;
}

function ruleSelectRelation(rule: unknown): unknown {
  if (!rule || typeof rule !== "object" || !("select" in rule)) return undefined;
  const select = rule.select;
  if (!select || typeof select !== "object" || !("relation" in select)) return undefined;
  return select.relation;
}

describe("declarative frontend rulepack shape", () => {
  it("expresses duration heuristics as declarative select/apply rules", () => {
    const stress = qlattRulepack.rules.stress_duration;
    const short = qlattRulepack.rules.vowel_shortening;
    const boundary = qlattRulepack.rules.pre_boundary_lengthening;

    expect(ruleOp(stress)).toBeFalsy();
    expect(ruleOp(short)).toBeFalsy();
    expect(ruleOp(boundary)).toBeFalsy();

    expect(ruleSelectRelation(stress)).toBe("Segment");
    expect(ruleSelectRelation(short)).toBe("Segment");
    expect(ruleSelectRelation(boundary)).toBe("Segment");

    expect(Array.isArray(stress?.apply)).toBe(true);
    expect(Array.isArray(short?.apply)).toBe(true);
    expect(Array.isArray(boundary?.apply)).toBe(true);
  });

  it("contains no imperative rule.op handlers", () => {
    const opRules = Object.entries(qlattRulepack.rules).filter(
      ([, rule]) => ruleOp(rule) != null,
    );
    expect(opRules).toHaveLength(0);
  });
});
