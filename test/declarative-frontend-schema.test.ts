import { describe, expect, it } from "vitest";
import { parseDslSpec } from "../src/declarative-frontend/parser";
import { validateDslSpec } from "../src/declarative-frontend/validation";

describe("declarative frontend schema coverage", () => {
  it("normalizes v11 top-level sections beyond phase/rule slice", () => {
    const spec = parseDslSpec({
      version: "v11",
      streams: {
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
          stream: "phone",
          scope: "syllable",
          sequence: [
            { capture: "c", where: "current.f.manner == 'stop'" },
            { capture: "v", where: "current.f.manner == 'vowel'" },
          ],
        },
      },
      rules: {
        stress_lengthening: {
          select: { stream: "phone", where: "current.f.manner == 'vowel'" },
          apply: [{ field: "duration", op: "mul", value: "1.3", tag: "stress" }],
        },
      },
      phases: [{ name: "duration", rules: ["stress_lengthening"], resolve_scalars: ["duration"] }],
      interpolation: { points: { f0: { method: "monotone_cubic" } } },
      output: { format: "klatt_frames" },
    });

    expect(spec.streams.phone.type).toBe("base");
    expect(spec.streams.syllable.spans).toBe("phone");
    expect(spec.topology.hierarchy).toEqual(["syllable", "phone"]);
    expect(spec.patterns.cv.sequence).toHaveLength(2);
    expect(spec.interpolation.points.f0.method).toBe("monotone_cubic");
    expect(spec.output.format).toBe("klatt_frames");
  });

  it("validates cross references for streams, patterns, rules and phase resolution", () => {
    const spec = parseDslSpec({
      streams: {
        phone: { type: "base", scalars: { duration: { unit: "ms" } } },
        f0: { type: "point" },
      },
      patterns: {
        bad_stream_pattern: {
          stream: "missing_stream",
          sequence: [{ capture: "x", where: "true" }],
        },
      },
      rules: {
        bad_select: {
          select: { stream: "missing_stream", where: "true" },
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

    expect(codes.has("E_PATTERN_STREAM_UNKNOWN")).toBe(true);
    expect(codes.has("E_RULE_STREAM_UNKNOWN")).toBe(true);
    expect(codes.has("E_RULE_PATTERN_UNKNOWN")).toBe(true);
    expect(codes.has("E_PHASE_RESOLVE_SCALAR_UNKNOWN")).toBe(true);
    expect(codes.has("E_PHASE_RESOLVE_POINT_STREAM_INVALID")).toBe(true);
  });

  it("enforces select/match rule shape for non-slice rules", () => {
    const spec = parseDslSpec({
      streams: { phone: { type: "base" } },
      patterns: { p: { stream: "phone", sequence: [{ capture: "x", where: "true" }] } },
      rules: {
        invalid_both: {
          select: { stream: "phone", where: "true" },
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
      streams: {
        phone: { type: "base", scalars: { duration: {} } },
        f0: { type: "point" },
      },
      patterns: { p: { stream: "phone", sequence: [{ capture: "x", where: "true" }] } },
      rules: {
        bad_expr: {
          select: { stream: "phone", where: 42 },
          constraint: { nope: true },
          apply: [{ field: "duration", op: "mul", value: 1.2 }],
          insert_point: {
            stream: "f0",
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
      streams: { phone: { type: "base" } },
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
      streams: { phone: { type: "base", scalars: { duration: {} } } },
      rules: {
        bad_depth: {
          select: { stream: "phone", where: "next3 != null" },
        },
        ok_depth: {
          select: {
            stream: "phone",
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
      streams: { phone: { type: "base", scalars: { duration: {} } } },
      rules: {
        bad_effect: {
          select: { stream: "phone", where: "true" },
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
          select: { stream: "phone", where: "true" },
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

  it("requires streams to declare features.type when rules reference .type", () => {
    const missing = parseDslSpec({
      streams: { phone: { type: "base", features: { manner: ["vowel"] } } },
      rules: {
        bad: {
          select: { stream: "phone", where: "current.type == 'vowel'" },
        },
      },
      phases: [{ name: "duration", rules: ["bad"] }],
    });

    const ok = parseDslSpec({
      streams: { phone: { type: "base", features: { type: ["vowel"] } } },
      rules: {
        good: {
          select: { stream: "phone", where: "current.type == 'vowel'" },
        },
      },
      phases: [{ name: "duration", rules: ["good"] }],
    });

    const missingCodes = validateDslSpec(missing).map((d) => d.code);
    const okCodes = validateDslSpec(ok).map((d) => d.code);

    expect(missingCodes.includes("E_TOKEN_FIELD_UNDECLARED")).toBe(true);
    expect(okCodes.includes("E_TOKEN_FIELD_UNDECLARED")).toBe(false);
  });

  it("accepts structural condition maps with predicate references", () => {
    const spec = parseDslSpec({
      streams: { phone: { type: "base", features: { type: ["vowel", "stop"] } } },
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
            stream: "phone",
            where: {
              all: [{ predicate: "in_question" }, { not: { expr: "current.phoneme == 'P'" } }],
            },
          },
          constraint: { predicate: "is_stop" },
        },
      },
      phases: [{ name: "duration", rules: ["good"] }],
    });

    const diagnostics = validateDslSpec(spec);
    const errors = diagnostics.filter((d) => d.severity === "error");
    expect(errors).toHaveLength(0);
  });

  it("reports unknown and cyclic predicate references", () => {
    const spec = parseDslSpec({
      streams: { phone: { type: "base", features: { type: ["vowel"] } } },
      predicates: {
        a: { predicate: "b" },
        b: { predicate: "a" },
      },
      rules: {
        bad_ref: {
          select: { stream: "phone", where: { predicate: "missing_pred" } },
        },
      },
      phases: [{ name: "duration", rules: ["bad_ref"] }],
    });

    const diagnostics = validateDslSpec(spec);
    const codes = diagnostics.map((d) => d.code);
    expect(codes.includes("E_PREDICATE_UNKNOWN")).toBe(true);
    expect(codes.includes("E_PREDICATE_CYCLE")).toBe(true);
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
      streams: { phone: { type: "base", scalars: { duration: {} } } },
      rules: {
        bad_path: {
          select: { stream: "phone", where: "true" },
          apply: [{ field: "duration", op: "mul", value: "params.policy.duration.missing", tag: "x" }],
        },
        bad_literal: {
          select: { stream: "phone", where: "true" },
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
      streams: { phone: { type: "base", scalars: { duration: {} } } },
      rules: {
        use_policy: {
          select: { stream: "phone", where: "true" },
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
