/**
 * A layered F0 model's `by_sex` entry: what a voice of that sex renders with
 * instead. The model here is made up; no frontend's numbers are involved.
 */

import { describe, expect, it } from "vitest";
import {
  f0ModelForVoice,
  type LayeredF0ModelConfig,
} from "../src/declarative-frontend/hrg/lowering";

const model: LayeredF0ModelConfig = {
  type: "layered_additive",
  frame_period_sec: 0.01,
  filter: { type: "lowpass_2pole_coefficient", alpha_param: "smoothing", default_alpha: 0.25 },
  layers: {
    level: { type: "persistent" },
    accent: { type: "impulse", decay: "step_plus_ramp" },
  },
  speaker_scale: {
    minimum_param: "floor",
    range_param: "range",
    pivot: 1000,
    divisor: 4096,
    output_scale: 0.1,
  },
  output_clamp: { min_hz: 40, max_hz: 600 },
  by_sex: {
    high: {
      filter: { scale_shift: 1 },
      layers: { accent: { decay: "step_plus_rise" } },
      speaker_scale: { pivot: 1800 },
    },
  },
};

describe("f0ModelForVoice", () => {
  it("returns the model itself for a sex with no entry, or none", () => {
    expect(f0ModelForVoice(model, "low")).toBe(model);
    expect(f0ModelForVoice(model, undefined)).toBe(model);
  });

  it("replaces only the fields the entry gives", () => {
    const selected = f0ModelForVoice(model, "high");

    expect(selected.filter).toEqual({
      type: "lowpass_2pole_coefficient",
      alpha_param: "smoothing",
      default_alpha: 0.25,
      scale_shift: 1,
    });
    expect(selected.layers).toEqual({
      level: { type: "persistent" },
      accent: { type: "impulse", decay: "step_plus_rise" },
    });
    expect(selected.speaker_scale).toEqual({
      minimum_param: "floor",
      range_param: "range",
      pivot: 1800,
      divisor: 4096,
      output_scale: 0.1,
    });
    expect(selected.frame_period_sec).toBe(0.01);
    expect(selected.output_clamp).toEqual({ min_hz: 40, max_hz: 600 });
    // The model it was made from is untouched.
    expect(model.speaker_scale?.pivot).toBe(1000);
    expect(model.layers.accent?.decay).toBe("step_plus_ramp");
  });

  it("rejects an entry that names a layer the model does not have", () => {
    const broken: LayeredF0ModelConfig = {
      ...model,
      by_sex: { high: { layers: { missing: { decay: "halving" } } } },
    };

    expect(() => f0ModelForVoice(broken, "high")).toThrow(/E_HRG_LOWER_F0_MODEL.*missing/);
  });
});
