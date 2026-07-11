import { describe, expect, it } from "vitest";
import { parseDslSpec } from "../src/declarative-frontend/parser";
import { compileRuleEngineSpec } from "../src/declarative-frontend/rule-pack";
import { validateDslSpec } from "../src/declarative-frontend/validation";

const loweringOutput = {
  lowering: {
    id: "test-track-lowering",
    timeline: {
      initial_silence_ms: { value: 0, citations: ["test"] },
      final_silence_ms: { value: 0, citations: ["test"] },
      duration_floors: {
        stop_release_ms: { value: 5, citations: ["test"] },
        default_ms: { value: 20, citations: ["test"] },
      },
      event_points: {
        include_segment_start: true,
        include_control_boundaries: true,
        include_f0_anchors: true,
        include_transition_steady_time: true,
      },
    },
    transitions: {
      default_transition_ms: { value: 30, citations: ["test"] },
      blend: {
        factor: { value: 0.35, citations: ["test"] },
        keys: ["F1", "F2"],
        smooth_types: ["vowel"],
      },
    },
    f0: {
      renderer: { type: "point_interpolation" },
      output_clamp: {
        min_hz: { value: 0, citations: ["test"] },
        max_hz: { value: 500, citations: ["test"] },
      },
    },
    overlays: {
      operation_order: ["voice_quality", "timed_controls", "f0"],
    },
  },
};

describe("declarative frontend schema coverage", () => {
  it("accepts only the final relation vocabulary at the compiler boundary", () => {
    expect(() =>
      compileRuleEngineSpec({
        streams: { phone: { type: "base" } },
      }),
    ).toThrowError(/E_LEGACY_STREAMS/);

    const compiled = compileRuleEngineSpec({
      relations: { phone: { type: "base" } },
    });
    expect(compiled.relations.phone.type).toBe("base");
    expect("streams" in compiled).toBe(false);
  });

  it("normalizes v11 top-level sections beyond phase/rule slice", () => {
    const spec = parseDslSpec({
      version: "v11",
      relations: {
        phone: { type: "base", scalars: { duration: { unit: "ms" } } },
        syllable: { type: "span", spans: "phone" },
        f0: { type: "point", unit: "Hz" },
      },
      topology: {
        hierarchy: ["syllable", "phone"],
        point: ["f0"],
      },
      patterns: {
        cv: {
          relation: "phone",
          scope: "syllable",
          sequence: [
            { capture: "c", where: "current.f.manner == 'stop'" },
            { capture: "v", where: "current.f.manner == 'vowel'" },
          ],
        },
      },
      rules: {
        stress_lengthening: {
          select: { relation: "phone", where: "current.f.manner == 'vowel'" },
          apply: [{ field: "duration", op: "mul", value: "1.3", tag: "stress" }],
        },
      },
      phases: [{ name: "duration", rules: ["stress_lengthening"], resolve_scalars: ["duration"] }],
      interpolation: { points: { f0: { method: "monotone_cubic" } } },
      output: loweringOutput,
    });

    expect(spec.relations.phone.type).toBe("base");
    expect(spec.relations.syllable.spans).toBe("phone");
    expect(spec.topology.hierarchy).toEqual(["syllable", "phone"]);
    expect(spec.patterns.cv.sequence).toHaveLength(2);
    expect(spec.interpolation.points.f0.method).toBe("monotone_cubic");
    expect(spec.output.lowering.id).toBe("test-track-lowering");
  });

  it("requires the complete track lowering output spec", () => {
    const spec = parseDslSpec({
      relations: { phone: { type: "base" } },
      output: { lowering: { id: "incomplete" } },
    });

    const diagnostics = validateDslSpec(spec);
    const codes = diagnostics.map((d) => d.code);

    expect(codes.includes("E_LOWERING_SPEC_REQUIRED")).toBe(true);
  });

  it("allows engine-only specs to omit track lowering output by default", () => {
    const spec = parseDslSpec({
      relations: { phone: { type: "base" } },
    });

    const codes = validateDslSpec(spec).map((d) => d.code);

    expect(codes.includes("E_LOWERING_SPEC_REQUIRED")).toBe(false);
  });

  it("requires track lowering output when strict rulepack validation is requested", () => {
    const spec = parseDslSpec({
      relations: { phone: { type: "base" } },
    });

    const codes = validateDslSpec(spec, { requireLoweringSpec: true }).map((d) => d.code);

    expect(codes.includes("E_LOWERING_SPEC_REQUIRED")).toBe(true);
  });

  it("validates cross references for relations, patterns, rules and phase resolution", () => {
    const spec = parseDslSpec({
      relations: {
        phone: { type: "base", scalars: { duration: { unit: "ms" } } },
        f0: { type: "point" },
      },
      patterns: {
        bad_stream_pattern: {
          relation: "missing_stream",
          sequence: [{ capture: "x", where: "true" }],
        },
      },
      rules: {
        bad_select: {
          select: { relation: "missing_stream", where: "true" },
        },
        bad_match: {
          match: "missing_pattern",
        },
      },
      phases: [
        {
          name: "duration",
          rules: ["bad_select", "bad_match"],
          resolve_scalars: ["missing_scalar"],
          resolve_points: ["phone"],
        },
      ],
    });

    const diagnostics = validateDslSpec(spec);
    const codes = new Set(diagnostics.map((d) => d.code));

    expect(codes.has("E_PATTERN_RELATION_UNKNOWN")).toBe(true);
    expect(codes.has("E_RULE_RELATION_UNKNOWN")).toBe(true);
    expect(codes.has("E_RULE_PATTERN_UNKNOWN")).toBe(true);
    expect(codes.has("E_PHASE_RESOLVE_SCALAR_UNKNOWN")).toBe(true);
    expect(codes.has("E_PHASE_RESOLVE_POINT_RELATION_INVALID")).toBe(true);
  });

  it("enforces select/match rule shape for non-slice rules", () => {
    const spec = parseDslSpec({
      relations: { phone: { type: "base" } },
      patterns: { p: { relation: "phone", sequence: [{ capture: "x", where: "true" }] } },
      rules: {
        invalid_both: {
          select: { relation: "phone", where: "true" },
          match: "p",
        },
        invalid_neither: {
          citation: "none",
        },
      },
      phases: [{ name: "a", rules: ["invalid_both", "invalid_neither"] }],
    });

    const diagnostics = validateDslSpec(spec);
    const shapeErrors = diagnostics.filter((d) => d.code === "E_RULE_SHAPE");
    expect(shapeErrors).toHaveLength(2);
  });

  it("rejects forward point references", () => {
    const spec = parseDslSpec({
      relations: {
        phone: { type: "base", scalars: { duration: {} } },
        f0: { type: "point" },
      },
      patterns: { p: { relation: "phone", sequence: [{ capture: "x", where: "true" }] } },
      rules: {
        bad_expr: {
          select: { relation: "phone", where: 42 },
          constraint: { nope: true },
          apply: [{ field: "duration", op: "mul", value: 1.2 }],
          insert_point: {
            relation: "f0",
            at: "midpoint(current)",
            value: "next_point('f0').value + 10",
          },
        },
      },
      phases: [{ name: "prosody", rules: ["bad_expr"] }],
    });

    const diagnostics = validateDslSpec(spec);
    const codes = diagnostics.map((d) => d.code);
    expect(codes.includes("E_POINT_FWD_REF")).toBe(true);
  });

  it("rejects unknown custom rule ops", () => {
    const spec = parseDslSpec({
      relations: { phone: { type: "base" } },
      rules: {
        unknown_op: { op: "super_new_behavior" },
      },
      phases: [{ name: "duration", rules: ["unknown_op"] }],
    });

    const diagnostics = validateDslSpec(spec);
    const codes = diagnostics.map((d) => d.code);

    expect(codes.includes("E_RULE_OP_UNKNOWN")).toBe(true);
  });

  it("rejects next3/prev3 cursor fields and points users to ahead/behind helpers", () => {
    const spec = parseDslSpec({
      relations: { phone: { type: "base", scalars: { duration: {} } } },
      rules: {
        bad_depth: {
          select: { relation: "phone", where: "next3 != null" },
        },
        ok_depth: {
          select: {
            relation: "phone",
            where:
              "ahead(current, 3) == null || behind(current, 1) != null || look_back_where(current, 4, \"current.phoneme == 'AA'\") == null",
          },
        },
      },
      phases: [{ name: "duration", rules: ["bad_depth", "ok_depth"] }],
    });

    const diagnostics = validateDslSpec(spec);
    const badDepth = diagnostics.find((d) => d.path === "rules.bad_depth.select.where");
    const okDepth = diagnostics.find((d) => d.path === "rules.ok_depth.select.where");

    expect(badDepth?.code).toBe("E_CEL_INVALID");
    expect(badDepth?.message).toContain("Unsupported cursor 'next3'");
    expect(okDepth).toBeUndefined();
  });

  it("validates dispatch exclusivity and default requirements", () => {
    const spec = parseDslSpec({
      relations: { phone: { type: "base", scalars: { duration: {} } } },
      rules: {
        bad_effect: {
          select: { relation: "phone", where: "true" },
          apply: [
            {
              field: "duration",
              op: "mul",
              value: "1.1",
              dispatch: [{ when: "true", value: 1.2 }, { default: 1.0 }],
            },
          ],
        },
        missing_default: {
          select: { relation: "phone", where: "true" },
          apply: [
            {
              field: "duration",
              op: "mul",
              dispatch: [{ when: "true", value: 1.2 }],
            },
          ],
          splice: {
            type: "insert_at_boundary",
            boundary: "current.sync_right",
            side: "after",
            insert: [
              {
                phoneme: "'REL'",
                duration: {
                  dispatch: [{ when: "true", value: 12 }],
                },
              },
            ],
          },
        },
      },
      phases: [{ name: "duration", rules: ["bad_effect", "missing_default"] }],
    });

    const diagnostics = validateDslSpec(spec);
    const codes = diagnostics.map((d) => d.code);

    expect(codes.includes("E_DISPATCH_AND_VALUE")).toBe(true);
    expect(codes.filter((code) => code === "E_DISPATCH_NO_DEFAULT").length).toBeGreaterThan(0);
  });

  it("requires relations to declare features.type when rules reference .type", () => {
    const missing = parseDslSpec({
      relations: { phone: { type: "base", features: { manner: ["vowel"] } } },
      rules: {
        bad: {
          select: { relation: "phone", where: "current.type == 'vowel'" },
        },
      },
      phases: [{ name: "duration", rules: ["bad"] }],
    });

    const ok = parseDslSpec({
      relations: { phone: { type: "base", features: { type: ["vowel"] } } },
      rules: {
        good: {
          select: { relation: "phone", where: "current.type == 'vowel'" },
        },
      },
      phases: [{ name: "duration", rules: ["good"] }],
    });

    const missingCodes = validateDslSpec(missing).map((d) => d.code);
    const okCodes = validateDslSpec(ok).map((d) => d.code);

    expect(missingCodes.includes("E_TOKEN_FIELD_UNDECLARED")).toBe(true);
    expect(okCodes.includes("E_TOKEN_FIELD_UNDECLARED")).toBe(false);
  });

  it("accepts control_windows with explicit ops and object-valued field expressions", () => {
    const spec = parseDslSpec({
      relations: { phone: { type: "base", scalars: { duration: {} } } },
      rules: {
        good: {
          select: { relation: "phone", where: "true" },
          define: {
            release_fields: "{'AH': 48, 'AV': 0}",
          },
          splice: {
            type: "replace_range",
            range_left: "current.sync_left",
            range_right: "current.sync_right",
            insert: [
              {
                copy_from: "current",
                control_windows: [
                  {
                    target: "'current'",
                    prefix_ms: "20",
                    fields: "release_fields",
                    tag: "'release'",
                  },
                  {
                    target: "'next'",
                    start_ratio: "0",
                    end_ratio: "0.25",
                    fields: {
                      B1: { op: "'add'", value: "250" },
                      AV: { op: "'set'", value: "0" },
                    },
                  },
                ],
              },
            ],
          },
        },
      },
      phases: [{ name: "structural", rules: ["good"] }],
    });

    const diagnostics = validateDslSpec(spec);
    const codes = diagnostics.map((d) => d.code);
    expect(codes.includes("E_CONTROL_WINDOW_SCHEMA")).toBe(false);
    expect(codes.includes("E_CEL_INVALID")).toBe(false);
  });

  it("accepts structured apply values for set while keeping numeric ops numeric-only", () => {
    const spec = parseDslSpec({
      relations: { phone: { type: "base", scalars: { duration: {} } } },
      rules: {
        good_set: {
          select: { relation: "phone", where: "true" },
          apply: [
            {
              field: "control_windows",
              op: "set",
              value: [
                {
                  target: "'prev'",
                  suffix_ms: "params.policy.nasal.vowel_ramp_ms",
                  fields: {
                    nasalCoupling: {
                      op: "set",
                      value: "params.policy.nasal.anticipatory_peak",
                    },
                  },
                },
              ],
            },
          ],
        },
        bad_add: {
          select: { relation: "phone", where: "true" },
          apply: [
            {
              field: "duration",
              op: "add",
              value: { bad: "1" },
            },
          ],
        },
      },
      parameters: {
        policy: {
          nasal: {
            vowel_ramp_ms: { value: 40, citations: ["Hawkins & Stevens 1985"] },
            anticipatory_peak: { value: 0.85, citations: ["Hawkins & Stevens 1985"] },
          },
        },
      },
      phases: [{ name: "formant", rules: ["good_set", "bad_add"] }],
    });

    const diagnostics = validateDslSpec(spec);
    expect(
      diagnostics.some(
        (d) => d.path === "rules.good_set.apply[0].value" && d.severity === "error"
      )
    ).toBe(false);
    expect(
      diagnostics.some(
        (d) => d.path === "rules.bad_add.apply[0].value" && d.code === "E_RULE_EXPRESSION_INVALID"
      )
    ).toBe(true);
  });

  it("normalizes citation entries that YAML parses as mapping objects", () => {
    const spec = parseDslSpec(`
version: v1
rules:
  citation_fixture:
    kind: scalar
    select:
      relation: phone
      where: current.phoneme == 'AA'
    apply:
      - field: duration
        op: set
        value: 100
    citations:
      - Fant 1997 (connected-speech source contour: onset rise, declination, phrase-final fall)
`);

    expect(spec.rules.citation_fixture.citations).toEqual([
      "Fant 1997 (connected-speech source contour: onset rise, declination, phrase-final fall)",
    ]);
  });

  it("accepts structural condition maps with predicate references", () => {
    const spec = parseDslSpec({
      relations: { phone: { type: "base", features: { type: ["vowel", "stop"] } } },
      predicates: {
        is_stop: { expr: "current.type == 'stop'" },
        in_question: {
          any: [
            { predicate: "is_stop" },
            { expr: "current.phoneme == 'SIL' && current.punctuationSymbol == '?'" },
          ],
        },
      },
      rules: {
        good: {
          select: {
            relation: "phone",
            where: {
              all: [{ predicate: "in_question" }, { not: { expr: "current.phoneme == 'P'" } }],
            },
          },
          constraint: { predicate: "is_stop" },
        },
      },
      phases: [{ name: "duration", rules: ["good"] }],
      output: loweringOutput,
    });

    const diagnostics = validateDslSpec(spec);
    const errors = diagnostics.filter((d) => d.severity === "error");
    expect(errors).toHaveLength(0);
  });

  it("reports unknown and cyclic predicate references", () => {
    const spec = parseDslSpec({
      relations: { phone: { type: "base", features: { type: ["vowel"] } } },
      predicates: {
        a: { predicate: "b" },
        b: { predicate: "a" },
      },
      rules: {
        bad_ref: {
          select: { relation: "phone", where: { predicate: "missing_pred" } },
        },
      },
      phases: [{ name: "duration", rules: ["bad_ref"] }],
    });

    const diagnostics = validateDslSpec(spec);
    const codes = diagnostics.map((d) => d.code);
    expect(codes.includes("E_PREDICATE_UNKNOWN")).toBe(true);
    expect(codes.includes("E_PREDICATE_CYCLE")).toBe(true);
  });

  it("validates contour schema and select-only usage", () => {
    const spec = parseDslSpec({
      relations: { phone: { type: "base", scalars: { duration: {} } } },
      patterns: {
        p: { relation: "phone", sequence: [{ capture: "x", where: "true" }] },
      },
      rules: {
        bad_contour_shape: {
          match: "p",
          contour: {
            domain: "word",
            reset_break_index: 0,
            apply: [],
          },
        },
      },
      phases: [{ name: "duration", rules: ["bad_contour_shape"] }],
    });

    const diagnostics = validateDslSpec(spec);
    const codes = diagnostics.map((d) => d.code);
    expect(codes.includes("E_CONTOUR_SELECT_REQUIRED")).toBe(true);
    expect(codes.includes("E_CONTOUR_DOMAIN_INVALID")).toBe(true);
    expect(codes.includes("E_CONTOUR_RESET_BREAK_INVALID")).toBe(true);
    expect(codes.includes("E_CONTOUR_APPLY_REQUIRED")).toBe(true);
  });

  it("enforces policy-path references and critical literal bans", () => {
    const spec = parseDslSpec({
      parameters: {
        policy: {
          duration: {
            stress_factor: {
              value: 1.3,
              citations: ["Klatt 1976 §III.B"],
            },
          },
        },
      },
      relations: { phone: { type: "base", scalars: { duration: {} } } },
      rules: {
        bad_path: {
          select: { relation: "phone", where: "true" },
          apply: [{ field: "duration", op: "mul", value: "params.policy.duration.missing", tag: "x" }],
        },
        bad_literal: {
          select: { relation: "phone", where: "true" },
          apply: [{ field: "duration", op: "mul", value: "1.3", tag: "x" }],
        },
      },
      phases: [{ name: "duration", rules: ["bad_path", "bad_literal"] }],
    });

    const diagnostics = validateDslSpec(spec);
    const codes = diagnostics.map((d) => d.code);
    expect(codes.includes("E_POLICY_PARAM_UNKNOWN")).toBe(true);
    expect(codes.includes("E_POLICY_LITERAL_CRITICAL")).toBe(true);
  });

  it("emits uncited and unused policy warnings", () => {
    const spec = parseDslSpec({
      parameters: {
        policy: {
          duration: {
            used_factor: {
              value: 1.1,
              citations: ["citation"],
            },
            uncited_unused_factor: {
              value: 1.2,
            },
          },
        },
      },
      relations: { phone: { type: "base", scalars: { duration: {} } } },
      rules: {
        use_policy: {
          select: { relation: "phone", where: "true" },
          apply: [
            {
              field: "duration",
              op: "mul",
              value: "params.policy.duration.used_factor",
              tag: "policy",
            },
          ],
        },
      },
      phases: [{ name: "duration", rules: ["use_policy"] }],
    });

    const warnings = validateDslSpec(spec).filter((d) => d.severity === "warning").map((d) => d.code);
    expect(warnings.includes("W_POLICY_PARAM_UNCITED")).toBe(true);
    expect(warnings.includes("W_POLICY_PARAM_UNUSED")).toBe(true);
  });
});
