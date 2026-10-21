/**
 * Pitch level and pitch span are the speaker's
 * (public/rules/policy/speaker-profile.yaml base_f0_hz and f0_range_hz): the
 * prosody rules read them as params.policy.f0.base_hz and
 * params.policy.f0.range_hz. qlatt-beauty's level and span are its default
 * voice's (public/rules/frontends/qlatt-beauty/speakers/beauty.yaml), so a
 * requested base pitch moves its contour as it moves qlatt-english's.
 */

import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { textToKlattTrackDetailed } from "../src/tts-frontend";

type Speaker = Record<string, number>;

const speak = (frontendId: string, text: string, baseF0?: number, speaker?: Speaker) =>
  textToKlattTrackDetailed(text, baseF0, 30, { frontendId, ...(speaker ? { speaker } : {}) });

/** The F0 contour of a track: every frame's time and F0. */
const contourHash = (frontendId: string, text: string) =>
  createHash("sha256")
    .update(
      JSON.stringify(speak(frontendId, text).track.map((frame) => [frame.time, frame.params.F0])),
    )
    .digest("hex");

const voicedF0 = (frontendId: string, text: string, baseF0?: number, speaker?: Speaker) =>
  speak(frontendId, text, baseF0, speaker)
    .track.map((frame) => frame.params.F0)
    .filter((f0) => f0 > 0);

const STATEMENT = "The cat sat on the mat.";
const QUESTION = "Did the cat sit on the mat?";
const COMMA = "When the sun came up, the birds began to sing.";

// Captured at 7fc65d8c, before the pitch level and span became the speaker's:
// qlatt-beauty then read its own policy leaves (female_base_hz 138, range_hz
// 95) and qlatt-english its range_hz leaf (80). No pitch is requested.
const DEFAULT_CONTOURS: Record<string, Record<string, string>> = {
  "qlatt-beauty": {
    [STATEMENT]: "ef37721a19238c88c8ddcd1d71e80cf6dacbf7f13b8f8955c2c890a15a66cf77",
    [QUESTION]: "ada9db412d266151784113ef4dedc430ac90886a62ea2399d26f14fe1a98fcfb",
    [COMMA]: "95910ca801b492b307e5e7ea7ef1e4a6491f994f9fba93fca42d68309c762867",
  },
  "qlatt-english": {
    [STATEMENT]: "43e0b7a3cb38aecb75e77b1d9dfeee9ea49a75eacd9f325bb4941f4631ba1fa4",
    [QUESTION]: "ebbec38730760b550722658fbcf5ae38f9cfd2a02e4a00798e187c420b75c563",
    [COMMA]: "19534dfda530ebb46d64467ac5d3c8bc48cf1d0f1d9e0bb1c0e38f8ac0e3685d",
  },
};

describe("the default contour, when no pitch is requested", () => {
  for (const [frontendId, contours] of Object.entries(DEFAULT_CONTOURS)) {
    it.each(Object.keys(contours))(`${frontendId} is unchanged: %s`, (text) => {
      expect(contourHash(frontendId, text)).toBe(contours[text]);
    });
  }

  it("resolves each frontend's level and span from its speaker", () => {
    // The profile's own defaults: qlatt-english has no voice registry.
    expect(speak("qlatt-english", STATEMENT).resolvedSpeaker).toMatchObject({
      base_f0_hz: 110,
      f0_range_hz: 80,
    });
    // qlatt-beauty's default voice.
    expect(speak("qlatt-beauty", STATEMENT).resolvedSpeaker).toMatchObject({
      base_f0_hz: 138,
      f0_range_hz: 95,
    });
  });
});

describe("a requested base pitch", () => {
  // The statement's lowest F0 is a low vowel's, 12 Hz under the base
  // (qlatt-beauty policy.f0.intrinsic_pitch_low_hz, tobi_unaccented_declination):
  // 126 at the voice's own 138.
  it("moves qlatt-beauty's contour (positional baseF0)", () => {
    expect(Math.min(...voicedF0("qlatt-beauty", STATEMENT))).toBeCloseTo(126, 6);
    expect(Math.min(...voicedF0("qlatt-beauty", STATEMENT, 220))).toBeCloseTo(208, 6);
    expect(speak("qlatt-beauty", STATEMENT, 220).resolvedSpeaker.base_f0_hz).toBe(220);
  });

  it("moves qlatt-beauty's contour (request base_f0_hz)", () => {
    expect(
      Math.min(...voicedF0("qlatt-beauty", STATEMENT, undefined, { base_f0_hz: 200 })),
    ).toBeCloseTo(188, 6);
  });

  // The span follows the level (speaker-profile.yaml
  // pitch_composition.span_follows_level): the voice's 95 times the requested
  // 220 over the voice's own 138.
  it("scales the voice's span by the same ratio", () => {
    expect(speak("qlatt-beauty", STATEMENT, 220).resolvedSpeaker.f0_range_hz).toBe(
      95 * (220 / 138),
    );
  });
});

describe("a requested pitch span", () => {
  // The statement's highest F0 is its first H* accent: base + range * 0.85
  // (qlatt-english policy.f0.h_star_height).
  it("changes qlatt-english's span", () => {
    expect(Math.max(...voicedF0("qlatt-english", STATEMENT))).toBeCloseTo(110 + 80 * 0.85, 6);
    const wide = speak("qlatt-english", STATEMENT, undefined, { f0_range_hz: 160 });
    expect(wide.resolvedSpeaker.f0_range_hz).toBe(160);
    expect(wide.resolvedSpeaker.base_f0_hz).toBe(110);
    expect(
      Math.max(...voicedF0("qlatt-english", STATEMENT, undefined, { f0_range_hz: 160 })),
    ).toBeCloseTo(110 + 160 * 0.85, 6);
  });

  // Control: the profile's own value, requested, is the default track.
  it("is the default track when it is the default span", () => {
    expect(speak("qlatt-english", STATEMENT, undefined, { f0_range_hz: 80 }).track).toEqual(
      speak("qlatt-english", STATEMENT).track,
    );
  });

  it("changes qlatt-beauty's span", () => {
    // The question's final rise reaches for the top of the range.
    const narrow = Math.max(...voicedF0("qlatt-beauty", QUESTION));
    const wide = Math.max(...voicedF0("qlatt-beauty", QUESTION, undefined, { f0_range_hz: 190 }));
    expect(wide).toBeGreaterThan(narrow + 50);
  });
});
