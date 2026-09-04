import { describe, expect, it, vi } from "vitest";
import { createProvenanceCollector } from "../src/provenance";
import {
  DEFAULT_SPEAKER_PROFILE_PATH,
  loadSpeakerProfileSync,
  resolveSpeakerProfile,
} from "../src/speaker-profile";
import { textToKlattTrackDetailed } from "../src/tts-frontend";
import { loadYamlSourceSync } from "../src/yaml-loader";

describe("speaker profile schema", () => {
  it("declares the canonical speaker profile document", () => {
    const source = loadYamlSourceSync(DEFAULT_SPEAKER_PROFILE_PATH);
    const spec = loadSpeakerProfileSync();

    expect(source).toContain("version: v1");
    expect(spec.version).toBe("v1");
    expect(spec.default_profile.base_f0_hz.value).toBe(110);
    expect(spec.default_profile.formant_scale.value).toBe(1.0);
    expect(spec.default_profile.rd_default.value).toBe(0.7);
    expect(spec.default_profile.spectral_tilt_offset_db.value).toBe(0);
  });

  it("resolves the current precedence order for overrides", () => {
    const spec = loadSpeakerProfileSync();

    expect(
      resolveSpeakerProfile({
        baseF0: 150,
        speakerOverride: { base_f0_hz: 200, formant_scale: 1.17 },
        profileSpec: spec,
      }),
    ).toEqual({
      base_f0_hz: 200,
      formant_scale: 1.17,
      rd_default: 0.7,
      spectral_tilt_offset_db: 0,
    });

    expect(
      resolveSpeakerProfile({
        baseF0: 150,
        speakerOverride: undefined,
        profileSpec: spec,
      }),
    ).toEqual({
      base_f0_hz: 150,
      formant_scale: 1.0,
      rd_default: 0.7,
      spectral_tilt_offset_db: 0,
    });
  });

  it("records the selected speaker profile as a declarative provenance decision", () => {
    const provenance = createProvenanceCollector();
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    try {
      textToKlattTrackDetailed("hello world.", 110, 30, {
        provenance,
        speaker: {
          base_f0_hz: 180,
          formant_scale: 1.1,
        },
      });
    } finally {
      warnSpy.mockRestore();
    }

    const decision = provenance
      .getDecisions()
      .find((entry) => entry.type === "speaker_profile_selected");
    expect(decision).toBeDefined();
    expect(decision?.stage).toBe("frontend");
    expect(decision?.citations).toContain(DEFAULT_SPEAKER_PROFILE_PATH);
    expect(decision?.reason).toContain("base_f0_hz=180");
    expect(decision?.reason).toContain("formant_scale=1.1");
  });
});
