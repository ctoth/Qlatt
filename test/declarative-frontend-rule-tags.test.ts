import { describe, expect, it } from "vitest";
import { loadBundledRulepackSpec } from "../src/declarative-frontend/rule-pack";

type PlainObject = Record<string, unknown>;

function isPlainObject(value: unknown): value is PlainObject {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function collectMissingTags(ruleName: string, applySpec: unknown, suffix: string): string[] {
  if (!Array.isArray(applySpec)) return [];

  const missing: string[] = [];
  applySpec.forEach((entry, index) => {
    if (!isPlainObject(entry)) return;
    if (typeof entry.field === "string" && typeof entry.tag !== "string") {
      missing.push(`${ruleName}.${suffix}[${index}] ${entry.field}`);
    }
  });
  return missing;
}

describe("qlatt English rule tags", () => {
  it("tags every scalar rule application", () => {
    const spec = loadBundledRulepackSpec("qlatt-english");
    const rules = isPlainObject(spec.rules) ? spec.rules : {};
    const missing: string[] = [];

    for (const [ruleName, ruleSpec] of Object.entries(rules)) {
      if (!isPlainObject(ruleSpec) || ruleSpec.kind !== "scalar") continue;

      missing.push(...collectMissingTags(ruleName, ruleSpec.apply, "apply"));
      const contour = isPlainObject(ruleSpec.contour) ? ruleSpec.contour : {};
      missing.push(...collectMissingTags(ruleName, contour.apply, "contour.apply"));
    }

    expect(missing).toEqual([]);
  });
});
