import { describe, expect, it } from "vitest";
import { loadBundledRulepackSpec } from "../src/declarative-frontend/rule-pack";
import { parseDslSpec } from "../src/declarative-frontend/parser";
import { validateDslSpec } from "../src/declarative-frontend/validation";

function outputOf(frontendId: string): Record<string, any> {
  const spec = loadBundledRulepackSpec(frontendId);
  return (spec as Record<string, any>).output;
}

describe("track lowering output config", () => {
  it("loads qlatt lowering policy with cited timeline and transition sections", () => {
    const output = outputOf("qlatt-english");
    const lowering = output.lowering;

    expect(lowering.id).toBe("qlatt-english-track-lowering");
    expect(lowering.timeline.initial_silence_ms.value).toBe(30);
    expect(lowering.timeline.final_silence_ms.value).toBe(100);
    expect(lowering.timeline.duration_floors.stop_release_ms.value).toBe(5);
    expect(lowering.timeline.duration_floors.default_ms.value).toBe(20);
    expect(lowering.transitions.default_transition_ms.value).toBe(30);
    expect(lowering.transitions.blend.factor.value).toBe(0.35);
    expect(lowering.transitions.blend.keys).toEqual(["F1", "F2", "F3", "B1", "B2", "B3"]);
    expect(lowering.transitions.blend.smooth_types).toEqual(["vowel", "nasal", "liquid", "glide"]);
    expect(Array.isArray(lowering.transitions.blend.factor.citations)).toBe(true);
  });

  it("loads qlatt point-interpolation F0 lowering policy", () => {
    const lowering = outputOf("qlatt-english").lowering;

    expect(lowering.f0.renderer.type).toBe("point_interpolation");
    expect(lowering.f0.output_clamp.min_hz.value).toBe(0);
    expect(lowering.overlays.operation_order).toEqual(["voice_quality", "timed_controls", "f0"]);
  });

  it("loads dectalk layered F0 lowering policy", () => {
    const lowering = outputOf("dectalk-english").lowering;

    expect(lowering.id).toBe("dectalk-english-track-lowering");
    expect(lowering.f0.renderer.type).toBe("layered_additive");
    expect(lowering.f0.layered_model_ref).toBe("f0_model");
    expect(lowering.timeline.duration_floors.stop_release_ms.value).toBe(7);
    expect(lowering.transitions.blend.factor.value).toBe(0.5);
  });

  it("rejects missing lowering sections with stable validation codes", () => {
    const spec = parseDslSpec({
      streams: { phone: { type: "base" } },
      output: {
        lowering: {
          id: "bad",
          timeline: {},
        },
      },
    });

    const codes = validateDslSpec(spec).map((diagnostic) => diagnostic.code);

    expect(codes).toContain("E_LOWERING_SPEC_REQUIRED");
    expect(codes).toContain("E_LOWERING_SPEC_NUMBER");
  });

  it("rejects uncited numeric lowering policy", () => {
    const spec = parseDslSpec({
      streams: { phone: { type: "base" } },
      output: {
        lowering: {
          id: "bad",
          timeline: {
            initial_silence_ms: { value: 0 },
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
              keys: ["F1"],
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
      },
    });

    const diagnostics = validateDslSpec(spec);

    expect(diagnostics.some((diagnostic) => diagnostic.code === "E_LOWERING_SPEC_CITATION")).toBe(true);
  });
});
