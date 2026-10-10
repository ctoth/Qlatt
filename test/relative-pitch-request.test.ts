/**
 * A requested pitch as a ratio, and the span that follows the level
 * (public/rules/policy/speaker-profile.yaml pitch_composition): pitch_scale
 * multiplies the base pitch of whichever voice is selected, and the span is
 * multiplied by the ratio of that base to the reference base (the voice's own,
 * or the profile default), unless the request gives the span itself.
 */

import { describe, expect, it } from "vitest";
import { createDiagnostics } from "../src/diagnostics";
import { createProvenanceCollector } from "../src/provenance";
import {
  loadSpeakerProfileSync,
  resolveSpeakerProfileDetailed,
  type SpeakerProfileSpec,
} from "../src/speaker-profile";
import { type TextToKlattTrackOptions, textToKlattTrackDetailed } from "../src/tts-frontend";

const STATEMENT = "The cat sat on the mat.";
const QUESTION = "Are you home?";

const speak = (
  frontendId: string,
  text: string,
  options: TextToKlattTrackOptions = {},
  baseF0?: number,
) => textToKlattTrackDetailed(text, baseF0, 30, { frontendId, ...options });

const maxF0 = (frames: ReadonlyArray<{ params: Record<string, number> }>) =>
  Math.max(...frames.map((frame) => frame.params.F0));

describe("pitch_scale 1", () => {
  it.each(["qlatt-english", "qlatt-beauty", "dectalk-english"])(
    "is the track with no pitch requested: %s",
    (frontendId) => {
      const none = speak(frontendId, STATEMENT);
      expect(speak(frontendId, STATEMENT, { pitchScale: 1 }).track).toEqual(none.track);
      expect(speak(frontendId, STATEMENT, { speaker: { pitch_scale: 1 } }).track).toEqual(
        none.track,
      );
    },
  );
});

describe("pitch_scale 2", () => {
  // The profile's own level and span: 110 and 80.
  it("doubles qlatt-english's base and span", () => {
    const doubled = speak("qlatt-english", STATEMENT, { pitchScale: 2 });
    expect(doubled.resolvedSpeaker).toMatchObject({ base_f0_hz: 220, f0_range_hz: 160 });
    // The statement's highest F0 is its first H* accent: base + range * 0.85
    // (qlatt-english policy.f0.h_star_height), so it doubles with them.
    expect(maxF0(speak("qlatt-english", STATEMENT).track)).toBeCloseTo(110 + 80 * 0.85, 6);
    expect(maxF0(doubled.track)).toBeCloseTo(220 + 160 * 0.85, 6);
  });

  // Its default voice's level and span: 138 and 95.
  it("doubles qlatt-beauty's base and span", () => {
    const doubled = speak("qlatt-beauty", QUESTION, { pitchScale: 2 });
    expect(doubled.resolvedSpeaker).toMatchObject({ base_f0_hz: 276, f0_range_hz: 190 });
    // The question's peak and its final rise are fractions of the span above
    // the base (qlatt-beauty phases/prosody.yaml), so they double with them.
    const own = speak("qlatt-beauty", QUESTION).track;
    expect(maxF0(doubled.track)).toBeCloseTo(2 * maxF0(own), 6);
    const lastVoiced = (frames: typeof own) =>
      frames
        .map((frame) => frame.params.F0)
        .filter((f0) => f0 > 0)
        .at(-1) as number;
    expect(lastVoiced(own)).toBeCloseTo(223.5, 6);
    expect(lastVoiced(doubled.track)).toBeCloseTo(447, 6);
  });

  it("is the same request as a speaker override's pitch_scale", () => {
    expect(speak("qlatt-beauty", QUESTION, { speaker: { pitch_scale: 2 } }).track).toEqual(
      speak("qlatt-beauty", QUESTION, { pitchScale: 2 }).track,
    );
  });

  // dectalk-english's F0 model reads the base pitch only (frontend.yaml
  // f0_model.speaker_scale.pitch_offset); no rule of it reads the span.
  it("moves a named dectalk-english voice from its own base", () => {
    const betty = speak("dectalk-english", STATEMENT, { speaker: "betty" });
    const doubled = speak("dectalk-english", STATEMENT, { speaker: "betty", pitchScale: 2 });
    expect(betty.resolvedSpeaker.base_f0_hz).toBe(208);
    expect(doubled.resolvedSpeaker.base_f0_hz).toBe(416);
    expect(doubled.track).toEqual(
      speak("dectalk-english", STATEMENT, { speaker: "betty" }, 416).track,
    );
  });
});

describe("a requested span", () => {
  it("is used as given, not rescaled", () => {
    const result = speak("qlatt-english", STATEMENT, {
      speaker: { pitch_scale: 2, f0_range_hz: 80 },
    });
    expect(result.resolvedSpeaker).toMatchObject({ base_f0_hz: 220, f0_range_hz: 80 });
    expect(maxF0(result.track)).toBeCloseTo(220 + 80 * 0.85, 6);
  });
});

describe("an absolute base pitch with a pitch_scale", () => {
  it("scales the positional base pitch", () => {
    const result = speak("qlatt-english", STATEMENT, { pitchScale: 2 }, 150);
    expect(result.resolvedSpeaker.base_f0_hz).toBe(300);
    expect(result.resolvedSpeaker.f0_range_hz).toBe(80 * (300 / 110));
  });

  it("scales a request's base_f0_hz, against the voice's own base", () => {
    const result = speak("qlatt-beauty", QUESTION, {
      speaker: { base_f0_hz: 100, pitch_scale: 1.5 },
    });
    expect(result.resolvedSpeaker.base_f0_hz).toBe(150);
    expect(result.resolvedSpeaker.f0_range_hz).toBe(95 * (150 / 138));
  });

  // Control: the reference base, requested, is the track with none requested.
  it("is the default track at the reference base", () => {
    expect(speak("qlatt-english", STATEMENT, {}, 110).track).toEqual(
      speak("qlatt-english", STATEMENT).track,
    );
    expect(speak("qlatt-beauty", QUESTION, { pitchScale: 2 }, 69).track).toEqual(
      speak("qlatt-beauty", QUESTION).track,
    );
  });
});

describe("an unusable pitch ratio", () => {
  it.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY])(
    "pitch_scale %s is reported and not applied",
    (pitchScale) => {
      const diagnostics = createDiagnostics();
      const result = speak("qlatt-english", STATEMENT, { pitchScale, diagnostics });
      const warnings = diagnostics
        .getEntries()
        .filter((entry) => entry.code === "W_SPEAKER_PITCH_RATIO_INVALID");
      expect(warnings).toHaveLength(1);
      expect(warnings[0].level).toBe("warn");
      expect(result.resolvedSpeaker).toMatchObject({ base_f0_hz: 110, f0_range_hz: 80 });
      expect(result.track).toEqual(speak("qlatt-english", STATEMENT).track);
    },
  );

  it("a base that gives a non-positive ratio leaves the span unscaled", () => {
    const resolution = resolveSpeakerProfileDetailed({ baseF0: -110 });
    expect(resolution.issues.map((issue) => issue.code)).toEqual(["W_SPEAKER_PITCH_RATIO_INVALID"]);
    expect(resolution.profile.f0_range_hz).toBe(80);
    expect(resolution.pitch?.ratio).toBe(1);
  });

  it("no diagnostic when the ratio is usable", () => {
    const diagnostics = createDiagnostics();
    speak("qlatt-english", STATEMENT, { pitchScale: 2, diagnostics });
    expect(
      diagnostics.getEntries().filter((entry) => entry.code === "W_SPEAKER_PITCH_RATIO_INVALID"),
    ).toEqual([]);
  });
});

describe("the pitch composition record", () => {
  it("resolves the reference, the effective base, the ratio and the span", () => {
    expect(
      resolveSpeakerProfileDetailed({
        voiceProfile: { base_f0_hz: 138, f0_range_hz: 95 },
        pitchScale: 2,
      }).pitch,
    ).toEqual({
      referenceBaseHz: 138,
      requestedBaseHz: 138,
      pitchScale: 2,
      effectiveBaseHz: 276,
      ratio: 2,
      profileSpanHz: 95,
      spanHz: 190,
      spanFollowsLevel: true,
    });
  });

  it("is in the speaker_profile_selected decision, with the policy's citations", () => {
    const provenance = createProvenanceCollector();
    speak("qlatt-beauty", QUESTION, { pitchScale: 2, provenance });
    const decision = provenance
      .getDecisions()
      .find((entry) => entry.type === "speaker_profile_selected");
    // The reason prints each number as JavaScript does (src/tts-frontend.ts).
    expect(decision?.reason).toContain("reference_base_hz=138");
    expect(decision?.reason).toContain("effective_base_hz=276 (base 138 x pitch_scale 2)");
    expect(decision?.reason).toContain("ratio=2");
    expect(decision?.reason).toContain("span_hz=190 (span 95 x ratio)");
    const composition = loadSpeakerProfileSync().pitch_composition;
    expect(composition).toBeDefined();
    expect(decision?.citations).toEqual(
      expect.arrayContaining([
        ...(composition?.pitch_scale.citations ?? []),
        ...(composition?.span_follows_level.citations ?? []),
      ]),
    );
  });

  it("says when the span is the request's own", () => {
    const provenance = createProvenanceCollector();
    speak("qlatt-english", STATEMENT, {
      speaker: { pitch_scale: 2, f0_range_hz: 80 },
      provenance,
    });
    const decision = provenance
      .getDecisions()
      .find((entry) => entry.type === "speaker_profile_selected");
    expect(decision?.reason).toContain("span_hz=80 (as requested, not scaled)");
  });
});

describe("the profile document's pitch_composition", () => {
  it("declares pitch_scale and the span policy with citations", () => {
    const composition = loadSpeakerProfileSync().pitch_composition;
    expect(composition?.pitch_scale.value).toBe(1);
    expect(composition?.pitch_scale.sources).toEqual(["request.pitch_scale", "pitchScale"]);
    expect(composition?.pitch_scale.citations.length).toBeGreaterThan(0);
    expect(composition?.span_follows_level).toMatchObject({
      level: "base_f0_hz",
      span: "f0_range_hz",
      reference_sources: ["voice.base_f0_hz"],
      unscaled_span_sources: ["request.f0_range_hz"],
    });
    expect(composition?.span_follows_level.citations.length).toBeGreaterThan(0);
  });

  it("is what scales: a profile without it resolves fields only, and reports a requested scale", () => {
    const { pitch_composition: _composition, ...fieldsOnly } = loadSpeakerProfileSync();
    const profileSpec: SpeakerProfileSpec = fieldsOnly;
    const resolution = resolveSpeakerProfileDetailed({ profileSpec, baseF0: 220, pitchScale: 2 });
    expect(resolution.pitch).toBeNull();
    expect(resolution.profile).toMatchObject({ base_f0_hz: 220, f0_range_hz: 80 });
    expect(resolution.issues.map((issue) => issue.code)).toEqual([
      "W_SPEAKER_PITCH_SCALE_UNDECLARED",
    ]);
  });
});
