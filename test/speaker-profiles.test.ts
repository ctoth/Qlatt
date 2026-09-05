import { describe, expect, it, vi } from "vitest";
import { QLATT_ENGLISH_RULEPACK } from "../src/declarative-frontend/rule-pack";
import { textToKlattTrack } from "../src/tts-frontend";
import { isPlainObject } from "../src/yaml-loader";

interface CitedSpeakerValue {
  value: number;
  citations: string[];
}

interface SpeakerPolicy {
  base_f0_hz: CitedSpeakerValue;
  formant_scale: CitedSpeakerValue;
  rd_default: CitedSpeakerValue;
  spectral_tilt_offset_db: CitedSpeakerValue;
}

function readCitedSpeakerValue(value: unknown, path: string): CitedSpeakerValue {
  if (
    !isPlainObject(value) ||
    typeof value.value !== "number" ||
    !Array.isArray(value.citations) ||
    !value.citations.every((citation) => typeof citation === "string")
  ) {
    throw new Error(`${path} must contain a numeric value and string citations`);
  }
  return { value: value.value, citations: value.citations };
}

function readSpeakerPolicy(value: unknown): SpeakerPolicy {
  if (!isPlainObject(value)) {
    throw new Error("parameters.policy.speaker must be an object");
  }
  return {
    base_f0_hz: readCitedSpeakerValue(value.base_f0_hz, "speaker.base_f0_hz"),
    formant_scale: readCitedSpeakerValue(value.formant_scale, "speaker.formant_scale"),
    rd_default: readCitedSpeakerValue(value.rd_default, "speaker.rd_default"),
    spectral_tilt_offset_db: readCitedSpeakerValue(
      value.spectral_tilt_offset_db,
      "speaker.spectral_tilt_offset_db",
    ),
  };
}

const parameters = QLATT_ENGLISH_RULEPACK.parameters;
const policy = isPlainObject(parameters) ? parameters.policy : undefined;
const speaker = readSpeakerPolicy(isPlainObject(policy) ? policy.speaker : undefined);

describe("speaker profile context", () => {
  describe("YAML configuration", () => {
    it("parameters.policy.speaker section exists with paper-backed defaults", () => {
      expect(speaker).toBeDefined();
      expect(speaker.base_f0_hz).toBeDefined();
      expect(speaker.base_f0_hz.value).toBe(110);
      expect(speaker.base_f0_hz.citations).toContain("O'Shaughnessy 1976");
    });

    it("speaker.formant_scale default is 1.0", () => {
      expect(speaker.formant_scale).toBeDefined();
      expect(speaker.formant_scale.value).toBe(1.0);
      expect(speaker.formant_scale.citations).toContain("Kent & Vorperian 2018");
    });

    it("speaker.rd_default is 0.7 (Fant 1997)", () => {
      expect(speaker.rd_default).toBeDefined();
      expect(speaker.rd_default.value).toBe(0.7);
      expect(speaker.rd_default.citations).toContain("Fant 1997 Table 1");
    });

    it("speaker.spectral_tilt_offset_db default is 0", () => {
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
