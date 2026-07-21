/**
 * End-to-end test of the dectalk-english frontend.
 *
 * Verifies that textToKlattTrack produces well-formed KlattFrame[] output
 * with reasonable durations, non-trivial F0 contours, and formant movement
 * when using the dectalk-english frontend.
 */

import { describe, expect, it, vi, afterAll } from "vitest";
import { textToKlattTrack, textToKlattTrackDetailed } from "../src/tts-frontend";
import type { KlattFrame } from "../src/tts-frontend-types";

// Suppress console.warn from the pipeline (missing inventory targets, etc.)
const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
afterAll(() => warnSpy.mockRestore());

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type SegmentInfo = {
  phoneme: string;
  word?: string;
  startTime: number;
  duration: number; // seconds
};

function extractSegments(track: KlattFrame[]): SegmentInfo[] {
  if (track.length === 0) return [];

  const segments: { phoneme: string; word?: string; startTime: number }[] = [];
  let currentPhoneme = track[0].phoneme ?? "SIL";
  let currentWord = track[0].word;
  segments.push({ phoneme: currentPhoneme, word: currentWord, startTime: track[0].time });

  for (let i = 1; i < track.length; i++) {
    const ph = track[i].phoneme ?? "SIL";
    if (ph !== currentPhoneme) {
      currentPhoneme = ph;
      currentWord = track[i].word;
      segments.push({ phoneme: ph, word: currentWord, startTime: track[i].time });
    }
  }

  return segments.map((seg, idx, arr) => {
    const endTime = idx < arr.length - 1 ? arr[idx + 1].startTime : track[track.length - 1].time;
    return { ...seg, duration: endTime - seg.startTime };
  });
}

function getParamRange(track: KlattFrame[], param: string): { min: number; max: number } {
  let min = Infinity;
  let max = -Infinity;
  for (const frame of track) {
    const v = frame.params[param];
    if (typeof v === "number" && Number.isFinite(v) && v > 0) {
      if (v < min) min = v;
      if (v > max) max = v;
    }
  }
  return { min, max };
}

function totalDurationMs(track: KlattFrame[]): number {
  if (track.length === 0) return 0;
  return (track[track.length - 1].time - track[0].time) * 1000;
}

// ---------------------------------------------------------------------------
// Test phrases
// ---------------------------------------------------------------------------

const TEST_PHRASES = [
  "hello world.",
  "The quick brown fox jumps over the lazy dog.",
  "How are you today?",
  "This is a test of the DECtalk speech synthesis system.",
  "One, two, three, four, five.",
];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("dectalk-english end-to-end", () => {
  it("emits DECtalk's reduced final-stress command for a single word", () => {
    const result = textToKlattTrackDetailed("cake.", 110, 30, {
      frontendId: "dectalk-english",
      speaker: "paul",
    });
    const stressCommands = result.utterance.relation("Tilt").listItems()
      .filter((item) => item.get("layer") === "stress");

    expect(stressCommands).toHaveLength(1);
    expect(stressCommands[0].get("value")).toBe(109);
    expect(stressCommands[0].get("duration_frames")).toBe(20);
  });

  it("emits the exact DECtalk segmental F0 controller stream for cake", () => {
    const result = textToKlattTrackDetailed("cake.", 110, 30, {
      frontendId: "dectalk-english",
      speaker: "paul",
    });
    const segmentalCommands = result.utterance.relation("Tilt").listItems()
      .filter((item) => item.get("layer") === "segmental")
      .map((item) => ({
        value: item.get("value"),
        durationFrames: item.get("duration_frames"),
        profilePoints: item.get("profile_points"),
      }));

    expect(segmentalCommands).toEqual([
      { value: 50, durationFrames: 4, profilePoints: [1, 0, 0] },
      { value: 0, durationFrames: 17, profilePoints: [1, 1, 0] },
      { value: 50, durationFrames: 37, profilePoints: [0, 0, 1] },
      { value: 0, durationFrames: 14, profilePoints: [1, 1, 0] },
      { value: 70, durationFrames: 6, profilePoints: [0, 0, 0] },
    ]);
  });

  it("applies DECtalk Rule 14 to a sonorant after a voiceless plosive", () => {
    const result = textToKlattTrackDetailed("cake.", 110, 30, {
      frontendId: "dectalk-english",
      speaker: "paul",
    });
    const ey = result.utterance.relation("Segment").listItems()
      .find((item) => item.get("active") !== false && item.get("phoneme") === "EY");
    const durationWrites = ey?.writes("duration") ?? [];
    const rule14Index = durationWrites.findIndex(
      (write) => write.reason === "dectalk_post_plosive_sonorant_lengthening matched",
    );

    expect(ey).toBeDefined();
    expect(rule14Index).toBeGreaterThan(0);
    expect(
      Number(durationWrites[rule14Index].value) - Number(durationWrites[rule14Index - 1].value),
    ).toBe(19);
  });

  it("applies DECtalk Rule 2 to the final-rime vowel before a coda stop", () => {
    const result = textToKlattTrackDetailed("cake.", 110, 30, {
      frontendId: "dectalk-english",
      speaker: "paul",
    });
    const ey = result.utterance.relation("Segment").listItems()
      .find((item) => item.get("active") !== false && item.get("phoneme") === "EY");
    const durationWrites = ey?.writes("duration") ?? [];
    const rule2Index = durationWrites.findIndex(
      (write) => write.reason === "dectalk_clause_final_lengthening matched",
    );

    expect(ey).toBeDefined();
    expect(rule2Index).toBeGreaterThan(0);
    expect(
      Number(durationWrites[rule2Index].value) - Number(durationWrites[rule2Index - 1].value),
    ).toBe(38);
  });

  it("aligns cake's initial K-to-EY boundary to the DECtalk frame grid", () => {
    const result = textToKlattTrackDetailed("cake.", 110, 30, {
      frontendId: "dectalk-english",
      speaker: "paul",
    });
    const segments = result.utterance.relation("Segment").listItems()
      .filter((item) => item.get("active") !== false);
    const initialK = segments.find((item, index) =>
      item.get("phoneme") === "K" && segments[index + 1]?.get("phoneme") === "K_REL"
    );
    const ey = segments.find((item) => item.get("phoneme") === "EY");

    expect(initialK?.get("duration")).toBe(83);
    expect(ey?.get("duration")).toBe(237);
  });

  it("matches DECtalk's native B1 cells through cake's initial silence and K closure", () => {
    const result = textToKlattTrackDetailed("cake.", 110, 30, {
      frontendId: "dectalk-english",
      speaker: "paul",
    });
    const b1 = Array.from({ length: 16 }, (_, frameIndex) => {
      const time = frameIndex * 0.0064;
      return result.track.filter((frame) => frame.time <= time).at(-1)?.params.B1;
    });

    expect(b1).toEqual([
      300, 300, 300, 300, 300, 287, 275, 262,
      250, 237, 225, 212, 200, 200, 200, 200,
    ]);
  });

  it("matches DECtalk's native B3 cells through cake's initial silence and K closure", () => {
    const result = textToKlattTrackDetailed("cake.", 110, 30, {
      frontendId: "dectalk-english",
      speaker: "paul",
    });
    const b3 = Array.from({ length: 16 }, (_, frameIndex) => {
      const time = frameIndex * 0.0064;
      return result.track.filter((frame) => frame.time <= time).at(-1)?.params.B3;
    });

    expect(b3).toEqual([
      280, 280, 280, 280, 280, 280, 280, 280,
      280, 280, 280, 280, 280, 280, 280, 280,
    ]);
  });

  it("matches DECtalk's native F1 cells through cake's initial silence and K closure", () => {
    const result = textToKlattTrackDetailed("cake.", 110, 30, {
      frontendId: "dectalk-english",
      speaker: "paul",
    });
    const f1 = Array.from({ length: 16 }, (_, frameIndex) => {
      const time = frameIndex * 0.0064;
      return result.track.filter((frame) => frame.time <= time).at(-1)?.params.F1;
    });

    expect(f1).toEqual([
      279, 279, 279, 279, 283, 288, 292, 296,
      301, 305, 309, 314, 318, 323, 327, 331,
    ]);
  });

  it("matches DECtalk's native B1 cells through cake's initial K release", () => {
    const result = textToKlattTrackDetailed("cake.", 110, 30, {
      frontendId: "dectalk-english",
      speaker: "paul",
    });
    const b1 = Array.from({ length: 5 }, (_, releaseFrameIndex) => {
      const time = (releaseFrameIndex + 16) * 0.0064;
      return result.track.filter((frame) => frame.time <= time).at(-1)?.params.B1;
    });

    expect(b1).toEqual([200, 200, 200, 178, 156]);
  });

  it("matches DECtalk's native B3 cells through cake's initial K release", () => {
    const result = textToKlattTrackDetailed("cake.", 110, 30, {
      frontendId: "dectalk-english",
      speaker: "paul",
    });
    const b3 = Array.from({ length: 5 }, (_, releaseFrameIndex) => {
      const time = (releaseFrameIndex + 16) * 0.0064;
      return result.track.filter((frame) => frame.time <= time).at(-1)?.params.B3;
    });

    expect(b3).toEqual([280, 280, 280, 266, 253]);
  });

  it("matches DECtalk's native F1 cells through cake's initial K release", () => {
    const result = textToKlattTrackDetailed("cake.", 110, 30, {
      frontendId: "dectalk-english",
      speaker: "paul",
    });
    const f1 = Array.from({ length: 5 }, (_, releaseFrameIndex) => {
      const time = (releaseFrameIndex + 16) * 0.0064;
      return result.track.filter((frame) => frame.time <= time).at(-1)?.params.F1;
    });

    expect(f1).toEqual([336, 340, 344, 349, 353]);
  });

  it("matches DECtalk's native F2 cells through cake's initial K", () => {
    const result = textToKlattTrackDetailed("cake.", 110, 30, {
      frontendId: "dectalk-english",
      speaker: "paul",
    });
    const f2 = Array.from({ length: 21 }, (_, frameIndex) => {
      const time = frameIndex * 0.0064;
      return result.track.filter((frame) => frame.time <= time).at(-1)?.params.F2;
    });

    expect(f2).toEqual([
      2091, 2091, 2091, 2091, 2078, 2069, 2060,
      2051, 2041, 2032, 2023, 2014, 2005, 1996,
      1987, 1978, 1969, 1960, 1951, 1942, 1933,
    ]);
  });

  it("matches DECtalk's native F3 cells through cake's initial K", () => {
    const result = textToKlattTrackDetailed("cake.", 110, 30, {
      frontendId: "dectalk-english",
      speaker: "paul",
    });
    const f3 = Array.from({ length: 21 }, (_, frameIndex) => {
      const time = frameIndex * 0.0064;
      return result.track.filter((frame) => frame.time <= time).at(-1)?.params.F3;
    });

    expect(f3).toEqual([
      2702, 2702, 2702, 2702, 2694, 2669, 2645,
      2620, 2595, 2571, 2546, 2522, 2497, 2472,
      2448, 2423, 2398, 2374, 2349, 2325, 2300,
    ]);
  });

  it("matches DECtalk's native F1 cells through cake's EY", () => {
    const result = textToKlattTrackDetailed("cake.", 110, 30, {
      frontendId: "dectalk-english",
      speaker: "paul",
    });
    const f1 = Array.from({ length: 37 }, (_, frameIndex) => {
      const time = (21 + frameIndex) * 0.0064;
      return result.track.filter((frame) => frame.time <= time).at(-1)?.params.F1;
    });

    expect(f1).toEqual([
      357, 377, 397, 417, 434, 451, 468, 486, 483, 481,
      478, 476, 473, 471, 468, 466, 463, 461, 458, 457,
      456, 455, 454, 453, 452, 451, 450, 449, 448, 447,
      446, 430, 414, 398, 383, 367, 351,
    ]);
  });

  it("matches DECtalk's native F3 cells through cake's EY", () => {
    const result = textToKlattTrackDetailed("cake.", 110, 30, {
      frontendId: "dectalk-english",
      speaker: "paul",
    });
    const f3 = Array.from({ length: 37 }, (_, frameIndex) => {
      const time = (21 + frameIndex) * 0.0064;
      return result.track.filter((frame) => frame.time <= time).at(-1)?.params.F3;
    });

    expect(f3).toEqual([
      2276, 2301, 2325, 2350, 2378, 2406, 2434, 2462, 2465, 2469,
      2472, 2476, 2479, 2483, 2486, 2490, 2493, 2497, 2500, 2504,
      2507, 2511, 2514, 2518, 2521, 2525, 2528, 2532, 2535, 2539,
      2539, 2519, 2500, 2480, 2461, 2441, 2422,
    ]);
  });

  it("matches DECtalk's native B1 cells through cake's EY", () => {
    const result = textToKlattTrackDetailed("cake.", 110, 30, {
      frontendId: "dectalk-english",
      speaker: "paul",
    });
    const b1 = Array.from({ length: 37 }, (_, frameIndex) => {
      const time = (21 + frameIndex) * 0.0064;
      return result.track.filter((frame) => frame.time <= time).at(-1)?.params.B1;
    });

    expect(b1).toEqual([
      320, 320, 320, 320, 320, 320, 320, 320, 320,
      70, 70, 70, 70, 70, 70, 70, 70, 70, 70, 70,
      70, 70, 70, 70, 70, 70, 70, 70, 70, 70,
      77, 85, 93, 101, 108, 116, 124,
    ]);
  });

  it("matches DECtalk's native B3 cells through cake's EY", () => {
    const result = textToKlattTrackDetailed("cake.", 110, 30, {
      frontendId: "dectalk-english",
      speaker: "paul",
    });
    const b3 = Array.from({ length: 37 }, (_, frameIndex) => {
      const time = (21 + frameIndex) * 0.0064;
      return result.track.filter((frame) => frame.time <= time).at(-1)?.params.B3;
    });

    expect(b3).toEqual([
      239, 233, 226, 219, 213, 206,
      200, 200, 200, 200, 200, 200, 200, 200, 200, 200,
      200, 200, 200, 200, 200, 200, 200, 200, 200, 200,
      200, 200, 200, 200, 200, 200,
      206, 213, 219, 226, 233,
    ]);
  });

  it("matches DECtalk's native F1 cells through cake's final K", () => {
    const result = textToKlattTrackDetailed("cake.", 110, 30, {
      frontendId: "dectalk-english",
      speaker: "paul",
    });
    const f1 = Array.from({ length: 14 }, (_, index) => {
      const time = (58 + index) * 0.0064;
      return result.track.filter((frame) => frame.time <= time).at(-1)?.params.F1;
    });

    expect(f1).toEqual(Array(14).fill(337));
  });

  it("matches DECtalk's native F2 cells through cake's final K", () => {
    const result = textToKlattTrackDetailed("cake.", 110, 30, {
      frontendId: "dectalk-english",
      speaker: "paul",
    });
    const f2 = Array.from({ length: 14 }, (_, index) => {
      const time = (58 + index) * 0.0064;
      return result.track.filter((frame) => frame.time <= time).at(-1)?.params.F2;
    });

    expect(f2).toEqual([
      1993, 1988, 1983, 1978, 1974, 1969, 1964,
      1959, 1955, 1950, 1945, 1940, 1936, 1931,
    ]);
  });

  it("matches DECtalk's native F3 cells through cake's final K", () => {
    const result = textToKlattTrackDetailed("cake.", 110, 30, {
      frontendId: "dectalk-english",
      speaker: "paul",
    });
    const f3 = Array.from({ length: 15 }, (_, frameIndex) => {
      const time = (58 + frameIndex) * 0.0064;
      return result.track.filter((frame) => frame.time <= time).at(-1)?.params.F3;
    });

    expect(f3).toEqual([
      2404, 2404, 2404, 2404,
      2403, 2403, 2403, 2403,
      2402, 2402, 2402, 2402,
      2401, 2401, 2401,
    ]);
  });

  it("matches DECtalk's native B1 cells through cake's final K", () => {
    const result = textToKlattTrackDetailed("cake.", 110, 30, {
      frontendId: "dectalk-english",
      speaker: "paul",
    });
    const b1 = Array.from({ length: 15 }, (_, frameIndex) => {
      const time = (58 + frameIndex) * 0.0064;
      return result.track.filter((frame) => frame.time <= time).at(-1)?.params.B1;
    });

    expect(b1).toEqual([
      134, 156, 178,
      200, 200, 200, 200, 200, 200, 200, 200, 200,
      176, 153, 310,
    ]);
  });

  it("matches DECtalk's native B3 cells through cake's final K", () => {
    const result = textToKlattTrackDetailed("cake.", 110, 30, {
      frontendId: "dectalk-english",
      speaker: "paul",
    });
    const b3 = Array.from({ length: 15 }, (_, frameIndex) => {
      const time = (58 + frameIndex) * 0.0064;
      return result.track.filter((frame) => frame.time <= time).at(-1)?.params.B3;
    });

    expect(b3).toEqual([
      239, 253, 266,
      280, 280, 280, 280, 280, 280, 280, 280, 280,
      266, 253, 239,
    ]);
  });

  it("matches DECtalk's native F1 cells through cake's dummy IX carrier", () => {
    const result = textToKlattTrackDetailed("cake.", 110, 30, {
      frontendId: "dectalk-english",
      speaker: "paul",
    });
    const f1 = Array.from({ length: 6 }, (_, index) => {
      const time = (72 + index) * 0.0064;
      return result.track.filter((frame) => frame.time <= time).at(-1)?.params.F1;
    });

    expect(f1).toEqual([337, 353, 382, 410, 426, 442]);
  });

  it("matches DECtalk's native F2 cells through cake's dummy IX carrier", () => {
    const result = textToKlattTrackDetailed("cake.", 110, 30, {
      frontendId: "dectalk-english",
      speaker: "paul",
    });
    const f2 = Array.from({ length: 6 }, (_, index) => {
      const time = (72 + index) * 0.0064;
      return result.track.filter((frame) => frame.time <= time).at(-1)?.params.F2;
    });

    expect(f2).toEqual([1927, 1900, 1830, 1760, 1733, 1706]);
  });

  it("matches DECtalk's native F3 cells through cake's dummy IX carrier", () => {
    const result = textToKlattTrackDetailed("cake.", 110, 30, {
      frontendId: "dectalk-english",
      speaker: "paul",
    });
    const f3 = Array.from({ length: 6 }, (_, index) => {
      const time = (72 + index) * 0.0064;
      return result.track.filter((frame) => frame.time <= time).at(-1)?.params.F3;
    });

    expect(f3).toEqual([2401, 2425, 2438, 2450, 2474, 2498]);
  });

  it("matches DECtalk's native B3 cells through cake's dummy IX carrier", () => {
    const result = textToKlattTrackDetailed("cake.", 110, 30, {
      frontendId: "dectalk-english",
      speaker: "paul",
    });
    const b3 = Array.from({ length: 6 }, (_, index) => {
      const time = (72 + index) * 0.0064;
      return result.track.filter((frame) => frame.time <= time).at(-1)?.params.B3;
    });

    expect(b3).toEqual([239, 233, 226, 219, 213, 206]);
  });

  it("matches DECtalk's native F1 trace through cake's terminal silence", () => {
    const result = textToKlattTrackDetailed("cake.", 110, 30, {
      frontendId: "dectalk-english",
      speaker: "paul",
    });
    const f1 = Array.from({ length: 93 }, (_, index) => {
      const time = (78 + index) * 0.0064;
      return result.track.filter((frame) => frame.time <= time).at(-1)?.params.F1;
    });

    expect(f1).toEqual([
      ...[459, 460, 461, 462, 463, 464, 465, 466, 467, 468]
        .flatMap((value) => [value, value]),
      ...Array(73).fill(469),
    ]);
  });

  it("matches DECtalk's native B3 hold through cake's terminal silence", () => {
    const result = textToKlattTrackDetailed("cake.", 110, 30, {
      frontendId: "dectalk-english",
      speaker: "paul",
    });
    const b3 = Array.from({ length: 93 }, (_, index) => {
      const time = (78 + index) * 0.0064;
      return result.track.filter((frame) => frame.time <= time).at(-1)?.params.B3;
    });

    expect(b3).toEqual(Array(93).fill(200));
  });

  it("matches DECtalk's native F2 decay into cake's terminal silence", () => {
    const result = textToKlattTrackDetailed("cake.", 110, 30, {
      frontendId: "dectalk-english",
      speaker: "paul",
    });
    const terminalSilence = result.utterance.relation("Segment").listItems()
      .find((item) =>
        item.get("active") !== false
        && item.get("phoneme") === "SIL"
        && item.get("dummy_vowel") !== true
        && item.get("punctuationSymbol") === "."
      );
    const f2 = Array.from({ length: 19 }, (_, index) => {
      const time = (78 + index) * 0.0064;
      return result.track.filter((frame) => frame.time <= time).at(-1)?.params.F2;
    });

    expect(terminalSilence).toBeDefined();
    expect(f2).toEqual([
      1677, 1677, 1676, 1676, 1676, 1675, 1675, 1674, 1674, 1674,
      1673, 1673, 1673, 1672, 1672, 1671, 1671, 1671, 1670,
    ]);
  });

  it("matches DECtalk's native F3 rise and hold in cake's terminal silence", () => {
    const result = textToKlattTrackDetailed("cake.", 110, 30, {
      frontendId: "dectalk-english",
      speaker: "paul",
    });
    const sampleFrames = [
      ...Array.from({ length: 21 }, (_, index) => 78 + index),
      170,
    ];
    const f3 = sampleFrames.map((frameIndex) => {
      const time = frameIndex * 0.0064;
      return result.track.filter((frame) => frame.time <= time).at(-1)?.params.F3;
    });

    expect(f3).toEqual([
      2522, 2522, 2522, 2522,
      2523, 2523, 2523, 2523,
      2524, 2524, 2524, 2524,
      2525, 2525, 2525, 2525,
      2526, 2526, 2526, 2526,
      2527, 2527,
    ]);
  });

  it("matches DECtalk's native B1 decay in cake's terminal silence", () => {
    const result = textToKlattTrackDetailed("cake.", 110, 30, {
      frontendId: "dectalk-english",
      speaker: "paul",
    });
    const b1 = Array.from({ length: 9 }, (_, index) => {
      const time = (78 + index) * 0.0064;
      return result.track.filter((frame) => frame.time <= time).at(-1)?.params.B1;
    });

    expect(b1).toEqual([300, 270, 240, 210, 180, 150, 120, 90, 60]);
  });

  it("matches DECtalk's native B1 rise at the end of cake's terminal silence", () => {
    const result = textToKlattTrackDetailed("cake.", 110, 30, {
      frontendId: "dectalk-english",
      speaker: "paul",
    });
    const b1 = Array.from({ length: 6 }, (_, index) => {
      const time = (165 + index) * 0.0064;
      return result.track.filter((frame) => frame.time <= time).at(-1)?.params.B1;
    });

    expect(b1).toEqual([72, 85, 97, 110, 122, 135]);
  });

  it("extends cake's EY F2 trajectory through its duration-lengthened tail", () => {
    const result = textToKlattTrackDetailed("cake.", 110, 30, {
      frontendId: "dectalk-english",
      speaker: "paul",
    });
    const ey = result.utterance.relation("Segment").listItems()
      .find((item) => item.get("active") !== false && item.get("phoneme") === "EY");
    const windows = ey?.get("control_windows");
    const nativeF2 = [0.1344, 0.1856, 0.2240, 0.3200].map((time) =>
      result.track.findLast((frame) => frame.time <= time + 1e-9)?.params.F2
    );
    const tailF2 = [0.3264, 0.3328, 0.3392, 0.3456, 0.3520, 0.3584, 0.3648].map((time) =>
      result.track.findLast((frame) => frame.time <= time + 1e-9)?.params.F2
    );

    expect(Array.isArray(windows)).toBe(true);
    expect(windows).toContainEqual(expect.objectContaining({
      start_ms: 236.6,
      end_ms: 237,
      fields: expect.objectContaining({ F2: 1994 }),
      tag: "dectalk_trace_exact",
    }));
    expect(nativeF2).toEqual([1926, 1777, 1858, 2006]);
    expect(tailF2).toEqual([2006, 2006, 2003, 2001, 1998, 1996, 1994]);
  });

  it("inserts DECtalk's six-frame dummy IX carrier after a final voiceless stop", () => {
    const result = textToKlattTrackDetailed("cake.", 110, 30, {
      frontendId: "dectalk-english",
      speaker: "paul",
    });
    const dummyVowels = result.utterance.relation("Segment").listItems()
      .filter((item) => item.get("active") !== false && item.get("dummy_vowel") === true);
    const finalStop = result.utterance.relation("Segment").listItems()
      .findLast((item) => item.get("active") !== false && item.get("phoneme") === "K");

    expect(dummyVowels).toHaveLength(1);
    expect(finalStop?.get("duration")).toBe(96);
    expect(finalStop?.get("control_windows")).toContainEqual({
      suffix_ms: 26,
      target: "current",
      fields: { AF: 55, A2: 0, A3: 47, A4: 0, A5: 33, A6: 0, AB: 0, SW: 1 },
      tag: "stop_burst",
    });
    expect(dummyVowels[0].get("phoneme")).toBe("SIL");
    expect(dummyVowels[0].get("duration")).toBe(38);
    expect(dummyVowels[0].get("F1")).toBe(460);
    expect(dummyVowels[0].get("F2")).toBe(1680);
    expect(dummyVowels[0].get("F3")).toBe(2520);
    expect(dummyVowels[0].get("TL")).toBe(10);
    expect(dummyVowels[0].get("control_windows")).toContainEqual({
      start_ms: 0,
      target: "current",
      end_ms: 38,
      fields: { AV: 0, AH: 42, B1: 310, B2: 170 },
      tag: "stop_aspiration",
    });
  });

  it("preserves required segment features when reducing a same-word geminate", () => {
    const result = textToKlattTrackDetailed("Safe zones feel fuzzy.", 110, 30, {
      frontendId: "dectalk-english",
    });
    const activeSegments = result.utterance.relation("Segment").listItems()
      .filter((item) => item.get("active") !== false);

    expect(activeSegments.length).toBeGreaterThan(0);
    expect(activeSegments.every((item) => typeof item.get("phoneme") === "string")).toBe(true);
    expect(activeSegments.every((item) => typeof item.get("type") === "string")).toBe(true);
  });

  for (const phrase of TEST_PHRASES) {
    describe(`phrase: "${phrase}"`, () => {
      let track: KlattFrame[];

      it("produces a non-empty KlattFrame array", () => {
        track = textToKlattTrack(phrase, 110, 30, { frontendId: "dectalk-english" });
        expect(Array.isArray(track)).toBe(true);
        expect(track.length).toBeGreaterThan(2);
      });

      it("has strictly non-decreasing time values", () => {
        if (!track) track = textToKlattTrack(phrase, 110, 30, { frontendId: "dectalk-english" });
        let prevTime = -1;
        for (const frame of track) {
          expect(Number.isFinite(frame.time)).toBe(true);
          expect(frame.time).toBeGreaterThanOrEqual(prevTime);
          prevTime = frame.time;
        }
      });

      it("has all-finite params in every frame", () => {
        if (!track) track = textToKlattTrack(phrase, 110, 30, { frontendId: "dectalk-english" });
        for (const frame of track) {
          expect(frame.params && typeof frame.params === "object").toBe(true);
          for (const [key, val] of Object.entries(frame.params)) {
            expect(Number.isFinite(val), `${key} is not finite in frame at t=${frame.time}`).toBe(true);
          }
        }
      });

      it("has reasonable total duration (200ms - 15s)", () => {
        if (!track) track = textToKlattTrack(phrase, 110, 30, { frontendId: "dectalk-english" });
        const dur = totalDurationMs(track);
        expect(dur).toBeGreaterThan(200);
        expect(dur).toBeLessThan(15000);
      });

      it("has non-trivial F0 contour (range > 5 Hz)", () => {
        if (!track) track = textToKlattTrack(phrase, 110, 30, { frontendId: "dectalk-english" });
        const f0Range = getParamRange(track, "F0");
        // There should be at least some frames with F0 > 0 (voiced segments)
        expect(f0Range.max).toBeGreaterThan(0);
        // F0 range should show some variation (not flat)
        if (f0Range.min < Infinity) {
          expect(f0Range.max - f0Range.min).toBeGreaterThan(5);
        }
      });

      it("has formant movement (F1 range > 50 Hz)", () => {
        if (!track) track = textToKlattTrack(phrase, 110, 30, { frontendId: "dectalk-english" });
        const f1Range = getParamRange(track, "F1");
        expect(f1Range.max).toBeGreaterThan(0);
        if (f1Range.min < Infinity) {
          expect(f1Range.max - f1Range.min).toBeGreaterThan(50);
        }
      });

      it("produces multiple distinct phoneme segments", () => {
        if (!track) track = textToKlattTrack(phrase, 110, 30, { frontendId: "dectalk-english" });
        const segments = extractSegments(track);
        // Even "hello world." should produce at least 5 distinct phoneme segments
        expect(segments.length).toBeGreaterThan(4);
      });
    });
  }

  it("summary: logs quality metrics for all test phrases", () => {
    const results: Array<{
      phrase: string;
      frames: number;
      durationMs: number;
      f0Min: number;
      f0Max: number;
      f1Min: number;
      f1Max: number;
      segments: number;
    }> = [];

    for (const phrase of TEST_PHRASES) {
      const track = textToKlattTrack(phrase, 110, 30, { frontendId: "dectalk-english" });
      const f0 = getParamRange(track, "F0");
      const f1 = getParamRange(track, "F1");
      const segs = extractSegments(track);

      results.push({
        phrase,
        frames: track.length,
        durationMs: Math.round(totalDurationMs(track)),
        f0Min: Math.round(f0.min * 10) / 10,
        f0Max: Math.round(f0.max * 10) / 10,
        f1Min: Math.round(f1.min),
        f1Max: Math.round(f1.max),
        segments: segs.length,
      });
    }

    // Log the summary table
    console.log("\n=== DECtalk E2E Quality Summary ===");
    console.log("| Phrase | Frames | Duration(ms) | F0 min-max (Hz) | F1 min-max (Hz) | Segments |");
    console.log("|--------|--------|-------------|-----------------|-----------------|----------|");
    for (const r of results) {
      console.log(
        `| ${r.phrase.substring(0, 30).padEnd(30)} | ${String(r.frames).padStart(6)} | ${String(r.durationMs).padStart(11)} | ${String(r.f0Min).padStart(6)}-${String(r.f0Max).padEnd(6)} | ${String(r.f1Min).padStart(6)}-${String(r.f1Max).padEnd(6)} | ${String(r.segments).padStart(8)} |`
      );
    }

    // This test always passes — it's for the summary log
    expect(results.length).toBe(TEST_PHRASES.length);
  });

  it("treats rate as a multiplier on the frontend API", () => {
    const phrase = "Perfect Paul sees six snakes.";
    const slow = textToKlattTrack(phrase, 110, 30, {
      frontendId: "dectalk-english",
      rate: 0.5,
    });
    const fast = textToKlattTrack(phrase, 110, 30, {
      frontendId: "dectalk-english",
      rate: 2.0,
    });

    expect(totalDurationMs(fast)).toBeLessThan(totalDurationMs(slow));
  });
});

// ---------------------------------------------------------------------------
// dt-2b: dictionary-first lookup. dectalk-english declares dictionary_path, so
// words in the converted DECtalk dictionary use the curated pronunciation
// instead of LTS guesswork. These lock that behavior against regression.
// ---------------------------------------------------------------------------
describe("dectalk-english dictionary-first (dt-2b)", () => {
  // Bare content phonemes (stress digits are not carried on track.phoneme),
  // excluding silence, in order.
  function contentPhonemes(phrase: string): string[] {
    const track = textToKlattTrack(phrase, 110, 30, { frontendId: "dectalk-english" });
    return extractSegments(track)
      .map((s) => s.phoneme)
      .filter((p) => p !== "SIL");
  }

  it("uses the dictionary pronunciation for 'colonel' (K ER N EL), not the LTS spelling-out", () => {
    const phs = contentPhonemes("colonel.");
    // Dictionary: K ER1 N EL. The old LTS path produced K AA L AA N EH L —
    // it contained no ER at all and doubled AA. Assert the dict signature.
    expect(phs).toContain("ER");
    expect(phs.filter((p) => p === "AA").length).toBe(0);
    expect(phs[0]).toBe("K");
  });

  it("uses the dictionary pronunciation for 'nuclear' (N UW K L IY ER), avoiding the LTS 'nucular' shape", () => {
    const phs = contentPhonemes("nuclear.");
    // Dictionary: N UW1 K L IY0 ER0 — ends in ER, has IY before it.
    expect(phs).toContain("ER");
    expect(phs).toContain("IY");
    expect(phs[0]).toBe("N");
  });
});
