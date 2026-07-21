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

  it("extends cake's EY F2 trajectory through its duration-lengthened tail", () => {
    const result = textToKlattTrackDetailed("cake.", 110, 30, {
      frontendId: "dectalk-english",
      speaker: "paul",
    });
    const ey = result.utterance.relation("Segment").listItems()
      .find((item) => item.get("active") !== false && item.get("phoneme") === "EY");
    const windows = ey?.get("control_windows");
    const tailFrame = result.track.findLast((frame) => frame.time <= 0.3264);

    expect(Array.isArray(windows)).toBe(true);
    expect(windows).toContainEqual({
      suffix_ms: 42,
      fields: { F2: 2006 },
      tag: "dectalk_trajectory_tail",
    });
    expect(tailFrame?.phoneme).toBe("EY");
    expect(tailFrame?.params.F2).toBe(2006);
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
    expect(finalStop?.get("control_windows")).toEqual([
      {
        suffix_ms: 26,
        target: "current",
        fields: { AF: 55, A2: 0, A3: 47, A4: 0, A5: 33, A6: 0, AB: 0, SW: 1 },
        tag: "stop_burst",
      },
    ]);
    expect(dummyVowels[0].get("phoneme")).toBe("SIL");
    expect(dummyVowels[0].get("duration")).toBe(38);
    expect(dummyVowels[0].get("F1")).toBe(460);
    expect(dummyVowels[0].get("F2")).toBe(1680);
    expect(dummyVowels[0].get("F3")).toBe(2520);
    expect(dummyVowels[0].get("TL")).toBe(10);
    expect(dummyVowels[0].get("control_windows")).toEqual([
      {
        start_ms: 0,
        target: "current",
        end_ms: 38,
        fields: { AV: 0, AH: 42, B1: 310, B2: 170 },
        tag: "stop_aspiration",
      },
    ]);
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
