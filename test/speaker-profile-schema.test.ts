import { describe, expect, it, vi } from "vitest";
import {
  loadBundledRulepackSpec,
  loadFrontendResources,
} from "../src/declarative-frontend/rule-pack";
import { createProvenanceCollector } from "../src/provenance";
import { parseSpeakerProfileDocument, resolveSpeakerProfile } from "../src/speaker-profile";
import { textToKlattTrackDetailed } from "../src/tts-frontend";
import { loadYamlDocumentSync, loadYamlSourceSync } from "../src/yaml-loader";

const profilePath = "/rules/frontends/qlatt-english/policy/speaker-profile.yaml";
const profileSpec = parseSpeakerProfileDocument(loadYamlDocumentSync(profilePath));

describe("speaker profile schema", () => {
  it("loads each frontend's declared profile, with independent DECtalk ownership", () => {
    const english = loadFrontendResources(loadBundledRulepackSpec("qlatt-english"));
    const dectalk = loadFrontendResources(loadBundledRulepackSpec("dectalk-english"));
    expect(english.speakerProfile?.path).toBe(profilePath);
    expect(dectalk.speakerProfile?.path).toBe(
      "/rules/frontends/dectalk-english/policy/speaker-profile.yaml",
    );
    expect(dectalk.speakerProfile?.spec).toEqual(english.speakerProfile?.spec);
    expect(dectalk.speakerProfile?.spec).not.toBe(english.speakerProfile?.spec);
  });

  it("uses the field's declared source order to compose a voice and request", () => {
    const spec = profileSpec;
    const options = {
      profileSpec: spec,
      voiceProfile: { formant_scale: 1.17 },
      speakerOverride: { formant_scale: 1.1 },
    };
    expect(resolveSpeakerProfile(options).formant_scale).toBe(1.1);

    const voiceFirst = {
      ...spec,
      default_profile: {
        ...spec.default_profile,
        formant_scale: {
          ...spec.default_profile.formant_scale,
          sources: ["voice.formant_scale", "request.formant_scale"],
        },
      },
    };
    expect(resolveSpeakerProfile({ ...options, profileSpec: voiceFirst }).formant_scale).toBe(1.17);
  });

  it("declares the canonical speaker profile document", () => {
    const source = loadYamlSourceSync(profilePath);
    const spec = profileSpec;

    expect(source).toContain("version: v1");
    expect(spec.version).toBe("v1");
    expect(spec.default_profile.base_f0_hz.value).toBe(110);
    expect(spec.default_profile.formant_scale.value).toBe(1.0);
    expect(spec.default_profile.rd_default.value).toBe(0.7);
    expect(spec.default_profile.spectral_tilt_offset_db.value).toBe(0);
  });

  it("resolves the current precedence order for overrides", () => {
    const spec = profileSpec;

    expect(
      resolveSpeakerProfile({
        baseF0: 150,
        speakerOverride: { base_f0_hz: 200, formant_scale: 1.17 },
        profileSpec: spec,
      }),
    ).toEqual({
      base_f0_hz: 200,
      // The span follows the level (pitch_composition.span_follows_level):
      // the profile's 80 times the requested 200 over the reference 110.
      f0_range_hz: 80 * (200 / 110),
      tract_length_scale: 1,
      pharynx_scale: 1,
      mouth_scale: 1,
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
      f0_range_hz: 80 * (150 / 110),
      tract_length_scale: 1,
      pharynx_scale: 1,
      mouth_scale: 1,
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
    expect(decision?.citations).toContain(profilePath);
    expect(decision?.reason).toContain("base_f0_hz=180");
    expect(decision?.reason).toContain("formant_scale=1.1");
  });
});
