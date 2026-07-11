import { describe, expect, it } from "vitest";
import { runRuleEngine } from "../src/declarative-frontend/engine";
import { compileRuleEngineSpec } from "../src/declarative-frontend/rule-pack";

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

describe("declarative frontend integration diagnostics", () => {
  it("surfaces validator diagnostics through engine entrypoint for invalid specs", () => {
    const invalidSpec = {
      relations: {
        phone: { type: "base" },
      },
      rules: {},
      phases: [
        {
          name: "bad",
          rules: ["missing_rule"],
          resolve_points: ["phone"],
        },
      ],
    };

    expect(() => runRuleEngine([], compileRuleEngineSpec(invalidSpec))).toThrowError(/E_RULE_UNKNOWN/);
    expect(() => runRuleEngine([], compileRuleEngineSpec(invalidSpec))).toThrowError(
      /E_PHASE_RESOLVE_POINT_RELATION_INVALID/
    );
  });

  it("annotates runtime rule errors with stable code and blame path", () => {
    const spec = {
      relations: {
        phone: { type: "base" },
      },
      rules: {
        bad: {
          select: { relation: "phone", where: "true" },
          apply: [{ target: "other", field: "duration", op: "set", value: "10" }],
        },
      },
      phases: [{ name: "duration", rules: ["bad"] }],
      output: loweringOutput,
    };

    const input = [{ id: "p1", relation: "phone", duration: 100, status: 1 }];
    expect(() => runRuleEngine(input, compileRuleEngineSpec(spec))).toThrowError(/E_EFFECT_TARGET_UNKNOWN/);
    expect(() => runRuleEngine(input, compileRuleEngineSpec(spec))).toThrowError(/phase=duration/);
    expect(() => runRuleEngine(input, compileRuleEngineSpec(spec))).toThrowError(/path=rules\.bad/);
  });
});
