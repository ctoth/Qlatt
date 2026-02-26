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

  it("rejects forward point references and non-string expressions", () => {
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
    expect(codes.filter((code) => code === "E_RULE_EXPRESSION_INVALID").length).toBeGreaterThan(0);
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
          select: { stream: "phone", where: "ahead(current, 3) == null || behind(current, 1) != null" },
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
});
