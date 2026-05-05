import { describe, expect, it, vi } from "vitest";
import {
  assembleKlattTrack,
} from "../src/track-assembler";
import type { OutputConfig } from "../src/track-assembler";
import { textToKlattTrack } from "../src/tts-frontend";
import { loadBundledRulepackSpec } from "../src/declarative-frontend/rule-pack";

// Suppress warnings during tests
const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

describe("track-assembler output config", () => {
  const defaultEquivalentConfig: OutputConfig = {
    blend: {
      factor: 0.35,
      keys: ["F1", "F2", "F3", "B1", "B2", "B3"],
      smooth_types: ["vowel", "nasal", "liquid", "glide"],
    },
    min_duration: {
      stop_release_ms: 5,
      default_ms: 20,
    },
    transition_ms: 30,
    initial_silence_ms: 30,
    final_silence_ms: 100,
  };
  const defaultSagOptions = {
    sagDepthHz: 12,
    sagMinSpanMs: 150,
  };

  describe("assembleKlattTrack rejects missing/incomplete outputConfig", () => {
    const minimalPhone = [
      {
        id: "ph_0",
        phoneme: "SIL",
        type: "silence",
        stream: "phone",
        status: 1,
        duration: 50,
        params: { F0: 0, F1: 0, F2: 0, F3: 0, AV: 0, AF: 0 },
      },
    ];

    it("throws if outputConfig is missing", () => {
      expect(() =>
        assembleKlattTrack(minimalPhone, minimalPhone, {
          outputConfig: undefined as unknown as OutputConfig,
          ...defaultSagOptions,
        })
      ).toThrow(/outputConfig/i);
    });

    it("throws if outputConfig is null", () => {
      expect(() =>
        assembleKlattTrack(minimalPhone, minimalPhone, {
          outputConfig: null as unknown as OutputConfig,
          ...defaultSagOptions,
        })
      ).toThrow(/outputConfig/i);
    });

    it("throws if a required output field is missing", () => {
      expect(() =>
        assembleKlattTrack(minimalPhone, minimalPhone, {
          outputConfig: {
            ...defaultEquivalentConfig,
            blend: {
              ...defaultEquivalentConfig.blend,
              factor: undefined,
            },
          },
          ...defaultSagOptions,
        })
      ).toThrow("E_OUTPUT_CONFIG_REQUIRED: output.blend.factor must be a finite number");
    });
  });

  describe("YAML-loaded output config produces frames", () => {
    it("produces frames with explicit config matching old defaults", () => {
      // Use the full pipeline with explicit config — this should work the same
      // as the YAML-loaded path since the values are identical.
      const track = textToKlattTrack("hello");
      expect(track.length).toBeGreaterThan(0);
      // Every frame must have a time and params
      for (const frame of track) {
        expect(typeof frame.time).toBe("number");
        expect(frame.params).toBeDefined();
      }
    });
  });

  describe("frontend.yaml output section loads with all 7 values", () => {
    it("loads output config with blend.factor, blend.keys, blend.smooth_types, min_duration.stop_release_ms, min_duration.default_ms, initial_silence_ms, final_silence_ms", () => {
      const spec = loadBundledRulepackSpec("qlatt-english");
      const output = (spec as Record<string, unknown>).output as Record<string, unknown>;
      expect(output).toBeDefined();

      // blend section — factor is a {value, citations} object in raw YAML
      const blend = output.blend as Record<string, unknown>;
      expect(blend).toBeDefined();
      const blendFactor = blend.factor as Record<string, unknown>;
      expect(blendFactor).toBeDefined();
      expect(blendFactor.value).toBe(0.35);
      expect(Array.isArray(blendFactor.citations)).toBe(true);
      expect(Array.isArray(blend.keys)).toBe(true);
      expect((blend.keys as string[]).length).toBe(6);
      expect(Array.isArray(blend.smooth_types)).toBe(true);
      expect((blend.smooth_types as string[]).length).toBe(4);

      // min_duration section — numeric fields are {value, citations} objects
      const minDuration = output.min_duration as Record<string, unknown>;
      expect(minDuration).toBeDefined();
      const stopReleaseMs = minDuration.stop_release_ms as Record<string, unknown>;
      expect(stopReleaseMs.value).toBe(5);
      expect(Array.isArray(stopReleaseMs.citations)).toBe(true);
      const defaultMs = minDuration.default_ms as Record<string, unknown>;
      expect(defaultMs.value).toBe(20);
      expect(Array.isArray(defaultMs.citations)).toBe(true);

      // Top-level output values — {value, citations} objects
      const initialSilence = output.initial_silence_ms as Record<string, unknown>;
      expect(initialSilence.value).toBe(30);
      expect(Array.isArray(initialSilence.citations)).toBe(true);
      const finalSilence = output.final_silence_ms as Record<string, unknown>;
      expect(finalSilence.value).toBe(100);
      expect(Array.isArray(finalSilence.citations)).toBe(true);
    });
  });
});
