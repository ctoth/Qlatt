import { describe, expect, it } from "vitest";
import { validateFeatureValue } from "../src/declarative-frontend/hrg/item";
import { parseDslSpec } from "../src/declarative-frontend/parser";
import {
  compileRuleEngineSpec,
  getRulepackValidationDiagnostics,
  loadBundledRulepackSpec,
  rulepackRelationFeatureSchemas,
} from "../src/declarative-frontend/rule-pack";

describe("rulepack metadata preservation", () => {
  it("compiles typed shapes without replacing authored feature declarations", () => {
    const features = {
      type: ["vowel", "stop"],
      optionalNumber: { kind: "number", nullable: true },
      nested: {
        kind: "array",
        items: {
          kind: "object",
          optional: ["label"],
          fields: { amount: { kind: "number" }, label: { kind: "string", values: ["a"] } },
        },
      },
    };
    const spec = compileRuleEngineSpec({
      relations: { Segment: { type: "parallel", features } },
      rules: {},
      phases: [],
    });
    const schemas = rulepackRelationFeatureSchemas(spec);
    expect(spec.relations.Segment.features).toEqual(features);
    expect(schemas.Segment.type).toBeUndefined();
    expect(Object.isFrozen(schemas)).toBe(true);
    expect(Object.isFrozen(schemas.Segment)).toBe(true);
    expect(Object.isFrozen(schemas.Segment.nested)).toBe(true);
    expect(
      validateFeatureValue("Segment", "optionalNumber", null, schemas.Segment.optionalNumber),
    ).toBeNull();
    expect(
      validateFeatureValue("Segment", "nested", [{ amount: 1 }], schemas.Segment.nested),
    ).toEqual([{ amount: 1 }]);
    expect(() =>
      validateFeatureValue("Segment", "nested", [{ amount: "bad" }], schemas.Segment.nested),
    ).toThrow("E_HRG_FEATURE_VALUE");
    expect(() =>
      compileRuleEngineSpec({
        relations: { Segment: { type: "parallel", features: { bad: { kind: "array" } } } },
      }),
    ).toThrow("E_FEATURE_SCHEMA at relations.Segment.features.bad");
  });

  it.each(["qlatt-english", "qlatt-beauty", "dectalk-english"])(
    "loads the authored control-window schema for %s",
    (frontend) => {
      const spec = loadBundledRulepackSpec(frontend);
      const shape = rulepackRelationFeatureSchemas(spec).Segment.control_windows;
      const windows = [{ target: "next", prefix_ms: 20, fields: { F2: { op: "mul", value: 0.8 } } }];
      expect(shape.kind).toBe("array");
      expect(validateFeatureValue("Segment", "control_windows", windows, shape)).toEqual(windows);
      expect(
        validateFeatureValue("Segment", "control_windows", [{ fields: { F2: 1200 } }], shape),
      ).toEqual([{ fields: { F2: 1200 } }]);
      expect(() =>
        validateFeatureValue("Segment", "control_windows", [{ target: "missing" }], shape),
      ).toThrow("E_HRG_FEATURE_VALUE");
    },
  );

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
    expect(
      parseDslSpec({ ...source, resources: { [role]: "/canonical.yaml" } }).resources[role],
    ).toBe("/canonical.yaml");
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
      getRulepackValidationDiagnostics(
        compileRuleEngineSpec({ source_contour_path: "/legacy.yaml" }),
      ),
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
