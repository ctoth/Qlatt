import { describe, expect, it, vi } from "vitest";
import { QLATT_ENGLISH_RULEPACK } from "../src/declarative-frontend/rule-pack";
import { textToKlattTrack } from "../src/tts-frontend";

const spec = QLATT_ENGLISH_RULEPACK as Record<string, any>;

describe("speaker profile context", () => {
  describe("YAML configuration", () => {
    it("parameters.policy.speaker section exists with paper-backed defaults", () => {
      const speaker = spec.parameters?.policy?.speaker;
      expect(speaker).toBeDefined();
      expect(speaker.base_f0_hz).toBeDefined();
      expect(speaker.base_f0_hz.value).toBe(110);
      expect(speaker.base_f0_hz.citations).toContain("O'Shaughnessy 1976");
    });

    it("speaker.formant_scale default is 1.0", () => {
      const speaker = spec.parameters?.policy?.speaker;
      expect(speaker.formant_scale).toBeDefined();
      expect(speaker.formant_scale.value).toBe(1.0);
      expect(speaker.formant_scale.citations).toContain("Kent & Vorperian 2018");
    });

    it("speaker.rd_default is 0.7 (Fant 1997)", () => {
      const speaker = spec.parameters?.policy?.speaker;
      expect(speaker.rd_default).toBeDefined();
      expect(speaker.rd_default.value).toBe(0.7);
      expect(speaker.rd_default.citations).toContain("Fant 1997 Table 1");
    });

    it("speaker.spectral_tilt_offset_db default is 0", () => {
      const speaker = spec.parameters?.policy?.speaker;
      expect(speaker.spectral_tilt_offset_db).toBeDefined();
      expect(speaker.spectral_tilt_offset_db.value).toBe(0);
      expect(speaker.spectral_tilt_offset_db.citations).toContain("Klatt & Klatt 1990");
    });
  });

  describe("TextToKlattTrackOptions integration", () => {
    it("speaker overrides via TextToKlattTrackOptions produce valid output", () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      try {
        // Generate track with default speaker settings
        const defaultTrack = textToKlattTrack("hello", 110, 30, {});

        // Generate track with speaker override
        const overriddenTrack = textToKlattTrack("hello", 110, 30, {
          speaker: {
            base_f0_hz: 200,
            formant_scale: 1.17,
          },
        });

        // Both should produce valid output
        expect(Array.isArray(defaultTrack)).toBe(true);
        expect(defaultTrack.length).toBeGreaterThan(0);
        expect(Array.isArray(overriddenTrack)).toBe(true);
        expect(overriddenTrack.length).toBeGreaterThan(0);
      } finally {
        warnSpy.mockRestore();
      }
    });
  });
});
