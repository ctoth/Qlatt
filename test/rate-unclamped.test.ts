import { describe, expect, it } from "vitest";
import { textToKlattTrack, textToKlattTrackDetailed } from "../src/tts-frontend";
import type { KlattFrame } from "../src/tts-frontend-types";

// The requested speaking rate is never clamped. Duration floors (Klatt 1976
// incompressible portion) are the only limit on compression, and they are
// projected by cited rules, not by a ceiling on the request.

const PHRASE = "The quick brown fox jumps over the lazy dog.";

function totalDurationMs(track: KlattFrame[]): number {
  if (track.length === 0) return 0;
  return (track[track.length - 1].time - track[0].time) * 1000;
}

function render(rate: number, frontendId = "qlatt-english"): KlattFrame[] {
  return textToKlattTrack(PHRASE, 110, 30, { frontendId, rate });
}

describe("speaking rate is not clamped", () => {
  it("renders at 4x and 8x and keeps getting shorter until the floors hold", () => {
    const rates = [0.25, 0.5, 1, 2, 4, 8];
    const durations = rates.map((rate) => totalDurationMs(render(rate)));
    for (let index = 1; index < durations.length; index += 1) {
      expect(durations[index]).toBeLessThanOrEqual(durations[index - 1]);
    }
    // 4x must actually be faster than 2x; the old ceiling made them identical.
    expect(durations[4]).toBeLessThan(durations[3]);
    // 0.25x must actually be slower than 0.5x; the old floor made them identical.
    expect(durations[0]).toBeGreaterThan(durations[1]);
    for (const duration of durations) expect(duration).toBeGreaterThan(0);
  });

  it("renders dectalk-english at 4x faster than at 2x", () => {
    expect(totalDurationMs(render(4, "dectalk-english"))).toBeLessThan(
      totalDurationMs(render(2, "dectalk-english")),
    );
  });

  it("keeps vowel formants between the target and schwa at extreme rates", () => {
    const detailed = (rate: number) =>
      textToKlattTrackDetailed(PHRASE, 110, 30, { frontendId: "qlatt-english", rate });
    const base = detailed(1).track;
    const fast = detailed(8).track;
    const schwaF1 = 500;
    const schwaF2 = 1500;
    const vowelFrames = (track: KlattFrame[]) =>
      track.filter((frame) => (frame.params.AV ?? 0) > 0 && (frame.params.F1 ?? 0) > 0);
    const baseVowels = vowelFrames(base);
    const fastVowels = vowelFrames(fast);
    expect(baseVowels.length).toBeGreaterThan(0);
    expect(fastVowels.length).toBeGreaterThan(0);
    const baseMaxF1 = Math.max(...baseVowels.map((frame) => frame.params.F1 as number));
    const baseMinF1 = Math.min(...baseVowels.map((frame) => frame.params.F1 as number));
    const baseMaxF2 = Math.max(...baseVowels.map((frame) => frame.params.F2 as number));
    const baseMinF2 = Math.min(...baseVowels.map((frame) => frame.params.F2 as number));
    for (const frame of fastVowels) {
      const f1 = frame.params.F1 as number;
      const f2 = frame.params.F2 as number;
      // Undershoot moves toward schwa and never past it, so the fast range is
      // inside the hull of the base range and the schwa target.
      expect(f1).toBeGreaterThanOrEqual(Math.min(baseMinF1, schwaF1) - 1);
      expect(f1).toBeLessThanOrEqual(Math.max(baseMaxF1, schwaF1) + 1);
      expect(f2).toBeGreaterThanOrEqual(Math.min(baseMinF2, schwaF2) - 1);
      expect(f2).toBeLessThanOrEqual(Math.max(baseMaxF2, schwaF2) + 1);
    }
  });

  it("rejects a rate that is not a positive finite number", () => {
    for (const rate of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(() => render(rate)).toThrow(/E_RATE_INVALID/);
    }
  });

  it("leaves the default rate untouched", () => {
    const explicit = render(1);
    const implicit = textToKlattTrack(PHRASE, 110, 30, { frontendId: "qlatt-english" });
    expect(implicit).toEqual(explicit);
  });
});
