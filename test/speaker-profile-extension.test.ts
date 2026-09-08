import { describe, expect, it, vi } from "vitest";
import * as rulepack from "../src/declarative-frontend/rule-pack";
import { resolveVoice } from "../src/dectalk-voice";
import { createProvenanceCollector } from "../src/provenance";
import {
  collectSpeakerProfileCitations,
  loadSpeakerProfileSync,
  resolveSpeakerProfile,
} from "../src/speaker-profile";
import { textToKlattTrackDetailed } from "../src/tts-frontend";

const profilePath = "test/fixtures/speaker-profile/extended.yaml";

describe("declarative speaker profile fields", () => {
  it("uses the frontend's profile fields for voice selection and provenance", () => {
    const spy = vi.spyOn(rulepack, "loadBundledRulepackSpec").mockReturnValue({
      ...rulepack.QLATT_ENGLISH_RULEPACK,
      speaker_profile_path: profilePath,
      speakers: {
        dir: "test/fixtures/speaker-profile",
        default: "voice",
        voices: ["voice"],
      },
    });
    try {
      const provenance = createProvenanceCollector();
      const result = textToKlattTrackDetailed("hello", undefined, 30, { provenance });
      expect(result.resolvedSpeaker.oq_default).toBe(0.6);
      const decision = provenance
        .getDecisions()
        .find((entry) => entry.type === "speaker_profile_selected");
      expect(decision?.citations).toContain("fixture open quotient");
      expect(decision?.reason).toContain("oq_default=0.6");
    } finally {
      spy.mockRestore();
    }
  });

  it("parses additional fields and collects their citations", () => {
    const spec = loadSpeakerProfileSync(profilePath);
    expect(spec.default_profile.oq_default).toEqual({
      value: 0.5,
      sources: ["request.oq_default", "voice.oq_default"],
      citations: ["fixture open quotient"],
    });
    expect(collectSpeakerProfileCitations(spec, profilePath)).toContain("fixture open quotient");
  });

  it("carries a declared voice field through overrides and source resolution", () => {
    const profileSpec = loadSpeakerProfileSync(profilePath);
    const voice = resolveVoice(
      {
        dir: "test/fixtures/speaker-profile",
        default: "voice",
        voices: ["voice"],
        speakerFrameParams: [],
        speakerGainOffsets: [],
      },
      "voice",
      profileSpec,
    );
    expect(voice.override).toEqual({ oq_default: 0.6 });
    expect(voice.params.unrelated_param).toBe(42);
    const options = { profileSpec, voiceProfile: voice.override };
    expect(resolveSpeakerProfile(options).oq_default).toBe(0.6);
    expect(
      resolveSpeakerProfile({ ...options, speakerOverride: { oq_default: 0.7 } }).oq_default,
    ).toBe(0.7);
    expect(resolveSpeakerProfile({ profileSpec }).oq_default).toBe(0.5);
    expect(
      resolveSpeakerProfile({ ...options, speakerOverride: { oq_default: NaN } }).oq_default,
    ).toBe(0.6);
  });
});
