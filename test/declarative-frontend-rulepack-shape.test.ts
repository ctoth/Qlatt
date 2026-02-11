import { describe, expect, it } from "vitest";
import { QLATT_V11_SLICE_RULEPACK } from "../src/declarative-frontend/rule-pack.js";

describe("declarative frontend rulepack shape", () => {
  it("expresses duration heuristics as declarative select/apply rules", () => {
    const stress = QLATT_V11_SLICE_RULEPACK.rules.stress_duration;
    const short = QLATT_V11_SLICE_RULEPACK.rules.vowel_shortening;
    const boundary = QLATT_V11_SLICE_RULEPACK.rules.pre_boundary_lengthening;

    expect(stress?.op).toBeUndefined();
    expect(short?.op).toBeUndefined();
    expect(boundary?.op).toBeUndefined();

    expect(stress?.select?.stream).toBe("phone");
    expect(short?.select?.stream).toBe("phone");
    expect(boundary?.select?.stream).toBe("phone");

    expect(Array.isArray(stress?.apply)).toBe(true);
    expect(Array.isArray(short?.apply)).toBe(true);
    expect(Array.isArray(boundary?.apply)).toBe(true);
  });
});
