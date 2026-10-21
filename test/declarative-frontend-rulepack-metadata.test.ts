import { describe, expect, it } from "vitest";
import { parseDslSpec } from "../src/declarative-frontend/parser";
import {
  compileRuleEngineSpec,
  getRulepackValidationDiagnostics,
} from "../src/declarative-frontend/rule-pack";

describe("rulepack metadata preservation", () => {
  it.each([
    ["inventory_path", "inventory"],
    ["lts_path", "lts"],
    ["morphology_path", "morphology"],
    ["stress_policy_path", "stress_policy"],
    ["dictionary_path", "lexicon"],
    ["speaker_profile_path", "speaker_profile"],
    ["source_contour_path", "source_contour"],
  ])("normalizes authored %s without keeping a second authoritative field", (alias, role) => {
    const source = { [alias]: "/fixture.yaml", resources: { custom: "/custom.yaml" } };
    const before = structuredClone(source);
    const spec = parseDslSpec(source);
    expect(spec.resources).toEqual({ [role]: "/fixture.yaml", custom: "/custom.yaml" });
    expect(Object.hasOwn(spec, alias)).toBe(false);
    expect(source).toEqual(before);
    expect(parseDslSpec(spec)).toEqual(spec);
    expect(parseDslSpec({ ...source, resources: { [role]: null } }).resources[role]).toBeNull();
    expect(parseDslSpec({ ...source, resources: { [role]: "/canonical.yaml" } }).resources[role]).toBe(
      "/canonical.yaml",
    );
  });

  it("retains alias warnings through programmatic compilation", () => {
    const source = {
      source_contour_path: "/legacy.yaml",
      resources: { source_contour: null },
      rules: {},
      phases: [],
    };
    const spec = compileRuleEngineSpec(source);
    expect(spec.resources.source_contour).toBeNull();
    expect(Object.hasOwn(spec, "source_contour_path")).toBe(false);
    expect(getRulepackValidationDiagnostics(spec)).toContainEqual({
      code: "W_FRONTEND_RESOURCE_ALIAS",
      severity: "warning",
      path: "source_contour_path",
      message: "source_contour_path is deprecated; declare resources.source_contour instead",
    });
    expect(
      getRulepackValidationDiagnostics(compileRuleEngineSpec("source_contour_path: /legacy.yaml")),
    ).toEqual(
      getRulepackValidationDiagnostics(compileRuleEngineSpec({ source_contour_path: "/legacy.yaml" })),
    );
  });

  it("preserves non-DSL top-level metadata fields", () => {
    const spec = parseDslSpec(`
version: v1
inventory_path: /rules/frontends/qlatt-english/inventory.yaml
speaker_profile_path: /rules/frontends/qlatt-english/policy/speaker-profile.yaml
source_contour_path: /rules/frontends/qlatt-english/policy/source-contour.yaml
custom_policy_path: /rules/frontends/qlatt-english/policy/custom.yaml
parameters: {}
relations: {}
topology: {}
predicates: {}
patterns: {}
phases: []
rules: {}
interpolation: {}
output: {}
transcription: {}
`);

    expect(spec.resources.speaker_profile).toBe(
      "/rules/frontends/qlatt-english/policy/speaker-profile.yaml",
    );
    expect(spec.resources.source_contour).toBe(
      "/rules/frontends/qlatt-english/policy/source-contour.yaml",
    );
    expect((spec as Record<string, unknown>).custom_policy_path).toBe(
      "/rules/frontends/qlatt-english/policy/custom.yaml",
    );
  });
});
