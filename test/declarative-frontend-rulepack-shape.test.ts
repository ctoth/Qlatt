import { describe, expect, it } from "vitest";
import { QLATT_ENGLISH_RULEPACK } from "../src/declarative-frontend/rule-pack";

function ruleOp(rule: unknown): unknown {
  if (!rule || typeof rule !== "object") return undefined;
  if (!("op" in rule)) return undefined;
  return (rule as { op?: unknown }).op;
}

describe("declarative frontend rulepack shape", () => {
  it("expresses duration heuristics as declarative select/apply rules", () => {
    const stress = QLATT_ENGLISH_RULEPACK.rules.stress_duration;
    const short = QLATT_ENGLISH_RULEPACK.rules.vowel_shortening;
    const boundary = QLATT_ENGLISH_RULEPACK.rules.pre_boundary_lengthening;

    expect(ruleOp(stress)).toBeFalsy();
    expect(ruleOp(short)).toBeFalsy();
    expect(ruleOp(boundary)).toBeFalsy();

    expect(stress?.select?.relation).toBe("Segment");
    expect(short?.select?.relation).toBe("Segment");
    expect(boundary?.select?.relation).toBe("Segment");

    expect(Array.isArray(stress?.apply)).toBe(true);
    expect(Array.isArray(short?.apply)).toBe(true);
    expect(Array.isArray(boundary?.apply)).toBe(true);
  });

  it("contains no imperative rule.op handlers", () => {
    const opRules = Object.entries(QLATT_ENGLISH_RULEPACK.rules).filter(
      ([, rule]) => ruleOp(rule) != null
    );
    expect(opRules).toHaveLength(0);
  });
});
