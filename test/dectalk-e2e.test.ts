/**
 * End-to-end test of the dectalk-english frontend.
 *
 * Verifies that textToKlattTrack produces well-formed KlattFrame[] output
 * with reasonable durations, non-trivial F0 contours, and formant movement
 * when using the dectalk-english frontend.
 */

import { afterAll, describe, expect, it, vi } from "vitest";
import { textToKlattTrack, textToKlattTrackDetailed } from "../src/tts-frontend";
import type { KlattFrame } from "../src/tts-frontend-types";

// DECtalk emits each completed 6.4-ms controller cell as a 71-sample packet
// at 11,025 Hz (VTM/vtmiont.c). Oracle frame assertions sample that packet clock.
const DECTALK_PACKET_PERIOD_SEC = 71 / 11025;

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
  it("emits DECtalk's active citation-mode hat and stress commands for a single word", () => {
    const result = textToKlattTrackDetailed("cake.", 110, 30, {
      frontendId: "dectalk-english",
      speaker: "paul",
    });
    const tiltCommands = result.utterance.relation("Tilt").listItems();
    const hatRiseCommands = tiltCommands.filter((item) => item.get("tag") === "f0_hat_rise");
    const hatFallCommands = tiltCommands.filter((item) => item.get("tag") === "f0_hat_fall");
    const boundaryResetCommands = tiltCommands.filter(
      (item) => item.get("tag") === "f0_boundary_reset",
    );
    const stressCommands = tiltCommands.filter((item) => item.get("layer") === "stress");

    expect(hatRiseCommands.map((item) => item.get("value"))).toEqual([190]);
    expect(hatFallCommands).toHaveLength(0);
    expect(boundaryResetCommands).toHaveLength(0);
    expect(result.utterance.temporalAnchor(hatRiseCommands[0])).toEqual(
      expect.objectContaining({ offsetMs: -51.2 }),
    );
    expect(stressCommands).toHaveLength(1);
    expect(stressCommands[0].get("value")).toBe(191);
    expect(stressCommands[0].get("duration_frames")).toBe(20);
    expect(result.utterance.temporalAnchor(stressCommands[0])).toEqual(
      expect.objectContaining({ offsetMs: -51.2 }),
    );
  });

  it("uses DECtalk's short declarative baseline table for cake", () => {
    const result = textToKlattTrackDetailed("cake.", 110, 30, {
      frontendId: "dectalk-english",
      speaker: "paul",
    });
    const baseline = result.utterance
      .relation("PhraseCommand")
      .listItems()
      .find((item) => item.get("layer") === "baseline");

    expect(baseline?.get("profile_points")).toEqual([
      1160, 1150, 1140, 1152, 1132, 1140, 1130, 1124, 1110, 1100, 1080, 1060, 1040, 1020, 980, 960,
      950,
    ]);
  });

  it("matches every native F0 cell through the's complete trace", () => {
    const result = textToKlattTrackDetailed("the.", undefined, 30, {
      frontendId: "dectalk-english",
      speaker: "paul",
    });
    const f0Hz10 = Array.from({ length: 139 }, (_, frameIndex) => {
      const time = frameIndex * DECTALK_PACKET_PERIOD_SEC;
      const f0 = result.track.filter((frame) => frame.time <= time + 1e-9).at(-1)?.params.F0;
      return Math.round((f0 ?? Number.NaN) * 10);
    });

    expect(f0Hz10).toEqual([
      973, 979, 982, 985, 978, 979, 990, 1005, 1025, 1049, 1074, 1102, 1128, 1155, 1183, 1209, 1236,
      1261, 1286, 1308, 1330, 1349, 1367, 1384, 1397, 1403, 1403, 1397, 1388, 1374, 1360, 1343,
      1325, 1305, 1286, 1267, 1248, 1226, 1206, 1186, 1166, 1148, 1129, 1114, 1097, 1081, 1067,
      1055, 1044, 1043, 1041, 1038, 1037, 1034, 1032, 1031, 1028, 1026, 1024, 1021, 1019, 1018,
      1015, 1015, 1012, 1011, 1008, 1006, 1004, 1000, 998, 997, 995, 993, 992, 992, 991, 990, 990,
      989, 989, 989, 989, 990, 991, 992, 993, 993, 992, 992, 991, 991, 989, 989, 988, 987, 986, 984,
      982, 981, 979, 977, 975, 974, 973, 973, 972, 973, 973, 974, 975, 976, 978, 979, 982, 985, 987,
      990, 992, 994, 995, 997, 998, 998, 999, 999, 998, 998, 997, 996, 994, 992, 990, 988, 987, 985,
      984, 983, 982,
    ]);
  });

  it("matches every native TLT cell through the complete the trace", () => {
    const result = textToKlattTrackDetailed("the.", 110, 30, {
      frontendId: "dectalk-english",
      speaker: "paul",
    });
    const tlt = Array.from({ length: 139 }, (_, frameIndex) => {
      const time = frameIndex * DECTALK_PACKET_PERIOD_SEC;
      return result.track.filter((frame) => frame.time <= time + 1e-9).at(-1)?.params.TL;
    });

    expect(tlt).toEqual(Array(139).fill(0));
  });

  it("matches DECtalk's contextual N B3 targets in rain and in", () => {
    const result = textToKlattTrackDetailed(
      "The rain in Spain stays mainly in the plain.",
      110,
      30,
      {
        frontendId: "dectalk-english",
        speaker: "paul",
      },
    );
    // The rule: N beside a high front vowel takes B3 1600; elsewhere 350.
    const b3Of = (word: string) =>
      result.track
        .filter((frame) => frame.word === word && frame.phoneme === "N")
        .map((frame) => frame.params.B3);
    expect(b3Of("rain").length).toBeGreaterThan(0);
    expect(new Set(b3Of("rain"))).toEqual(new Set([1600]));
    expect(b3Of("in").length).toBeGreaterThan(0);
    expect(new Set(b3Of("in"))).toEqual(new Set([350]));
  });

  // DECtalk's trace puts the /n/ of "rain" on packets 62 to 70. That is a
  // statement about durations, and ours do not match DECtalk's yet (see
  // scripts/oracle/compare-durations.ts). `it.fails` turns red the moment they
  // do, which is the signal to make this an ordinary test.
  it.fails("places the N of rain on DECtalk's packets 62 to 70", () => {
    const result = textToKlattTrackDetailed(
      "The rain in Spain stays mainly in the plain.",
      110,
      30,
      {
        frontendId: "dectalk-english",
        speaker: "paul",
      },
    );
    const b3 = Array.from({ length: 9 }, (_, offset) => {
      const time = (62 + offset) * DECTALK_PACKET_PERIOD_SEC;
      return result.track.filter((frame) => frame.time <= time + 1e-9).at(-1)?.params.B3;
    });
    expect(b3).toEqual(Array(9).fill(1600));
  });

  it("projects punct-question's initial K F3 through the K-to-AE locus", () => {
    const result = textToKlattTrackDetailed("Can you hear me?", 110, 30, {
      frontendId: "dectalk-english",
      speaker: "paul",
    });
    const initialSilence = Array.from({ length: 4 }, (_, frameIndex) => {
      const time = frameIndex * DECTALK_PACKET_PERIOD_SEC;
      return result.track.filter((frame) => frame.time <= time + 1e-9).at(-1)?.params.F3;
    });
    const initialK = result.track.find((frame) => frame.phoneme === "K");
    const firstKPacket = result.track
      .filter((frame) => frame.time <= 4 * DECTALK_PACKET_PERIOD_SEC + 1e-9)
      .at(-1);
    const initialRelease = result.track.find((frame) => frame.phoneme === "K_REL");
    if (!initialK || !firstKPacket || !initialRelease)
      throw new Error("initial K carriers missing");
    const closureDurationMs = result.utterance
      .relation("Segment")
      .listItems()
      .find((item) => item.get("active") !== false && item.get("phoneme") === "K")
      ?.get("duration");
    if (typeof closureDurationMs !== "number") throw new Error("initial K duration missing");
    const nativeFrameMs = 6.4;
    const expectedReleaseStart =
      firstKPacket.params.F3 +
      (2287.5 - firstKPacket.params.F3) * ((closureDurationMs - nativeFrameMs) / closureDurationMs);
    // One controller frame into the release is one packet later in output time.
    const releaseBoundary = result.track.find(
      (frame) =>
        frame.phoneme === "K_REL" &&
        Math.abs(frame.time - initialRelease.time - DECTALK_PACKET_PERIOD_SEC) <= 1e-9,
    );

    expect(initialSilence).toEqual([2702, 2702, 2702, 2702]);
    expect(initialK.params.F3).toBe(2702);
    expect(firstKPacket.params.F3).toBe(2690);
    expect(initialRelease.params.F3).toBeCloseTo(expectedReleaseStart, 10);
    expect(releaseBoundary?.params.F3).toBe(2287.5);
  });

  it("applies DECtalk Rule 14 to a sonorant after a voiceless plosive", () => {
    const result = textToKlattTrackDetailed("cake.", 110, 30, {
      frontendId: "dectalk-english",
      speaker: "paul",
    });
    const ey = result.utterance
      .relation("Segment")
      .listItems()
      .find((item) => item.get("active") !== false && item.get("phoneme") === "EY");
    const addedWrites = ey?.writes("timing_added_frames") ?? [];
    const rule14Index = addedWrites.findIndex(
      (write) => write.ruleId === "dectalk_timing_14_sonorant_after_voiceless_plosive",
    );

    expect(ey).toBeDefined();
    expect(rule14Index).toBeGreaterThan(0);
    // NF20MS: three frames.
    expect(
      Number(addedWrites[rule14Index].value) - Number(addedWrites[rule14Index - 1].value),
    ).toBe(3);
  });

  it("applies DECtalk Rule 2 to the final-rime vowel before a coda stop", () => {
    const result = textToKlattTrackDetailed("cake.", 110, 30, {
      frontendId: "dectalk-english",
      speaker: "paul",
    });
    const ey = result.utterance
      .relation("Segment")
      .listItems()
      .find((item) => item.get("active") !== false && item.get("phoneme") === "EY");
    const addedWrites = ey?.writes("timing_added_frames") ?? [];
    const rule2 = addedWrites.find(
      (write) => write.ruleId === "dectalk_timing_2_clause_final_rime",
    );

    expect(ey).toBeDefined();
    // NF40MS (6), plus NF30MS (5) less half the clause's five allophones (2)
    // for a stressed syllabic in a clause of fewer than ten.
    expect(rule2?.value).toBe(9);
  });

  it("matches every native TLT cell through cake's complete trace", () => {
    const result = textToKlattTrackDetailed("cake.", 110, 30, {
      frontendId: "dectalk-english",
      speaker: "paul",
    });
    const tlt = Array.from({ length: 171 }, (_, frameIndex) => {
      const time = frameIndex * DECTALK_PACKET_PERIOD_SEC;
      return result.track.filter((frame) => frame.time <= time + 1e-9).at(-1)?.params.TL;
    });

    expect(tlt).toEqual(Array(171).fill(0));
  });

  it("inserts DECtalk's six-frame dummy IX carrier after a final voiceless stop", () => {
    const result = textToKlattTrackDetailed("cake.", 110, 30, {
      frontendId: "dectalk-english",
      speaker: "paul",
    });
    const dummyVowels = result.utterance
      .relation("Segment")
      .listItems()
      .filter((item) => item.get("active") !== false && item.get("dummy_vowel") === true);
    const finalStop = result.utterance
      .relation("Segment")
      .listItems()
      .findLast((item) => item.get("active") !== false && item.get("phoneme") === "K");

    expect(dummyVowels).toHaveLength(1);
    // DECtalk times the final [k] of "cake." at 14 frames.
    expect(finalStop?.get("timing_frames")).toBe(14);
    expect(finalStop?.get("duration")).toBeCloseTo(14 * 6.4, 9);
    expect(finalStop?.get("control_windows")).toContainEqual({
      suffix_ms: 26,
      target: "current",
      fields: { AF: 55, A2: 0, A3: 47, A4: 0, A5: 33, A6: 0, AB: 0, SW: 1 },
      tag: "stop_burst",
    });
    expect(dummyVowels[0].get("phoneme")).toBe("SIL");
    // NF40MS is six controller frames of 6.4 ms (ph_defs.h:440).
    expect(dummyVowels[0].get("duration")).toBe(38.4);
    expect(dummyVowels[0].get("dummy_phone")).toBe("IX");
    expect(dummyVowels[0].get("F1")).toBe(460);
    expect(dummyVowels[0].get("F2")).toBe(1680);
    expect(dummyVowels[0].get("F3")).toBe(2520);
    expect(dummyVowels[0].get("TL")).toBe(0);
    expect(dummyVowels[0].get("control_windows")).toContainEqual({
      start_ms: 0,
      target: "current",
      end_ms: 38.4,
      // 48 dB before a front beginning, 3 less in an unstressed coda, 6 less
      // in a dummy vowel (p_us_st1.c:1367-1387, 1422-1426); DECtalk's packets
      // for "cake." carry AP = 39 here.
      fields: { AV: 0, AH: 39, B1: 310, B2: 170 },
      tag: "stop_aspiration",
    });
  });

  /** Packet at which each active Segment's first frame falls, with its phoneme. */
  function segmentStarts(text: string): Array<[string, number]> {
    const { track } = textToKlattTrackDetailed(text, undefined, 30, {
      frontendId: "dectalk-english",
    });
    const starts: Array<[string, number]> = [];
    let previous: string | undefined;
    for (const frame of track) {
      if (!frame.segmentId || frame.segmentId === previous) continue;
      previous = frame.segmentId;
      starts.push([frame.phoneme ?? "?", Math.round(frame.time / DECTALK_PACKET_PERIOD_SEC)]);
    }
    return starts;
  }

  it("opens the utterance with DECtalk's pause: 3 packets before a voiced phone, 4 before /h/", () => {
    // p_us_tim.c:229-232 gives 4 frames, or 5 when the next phone is neither
    // voiced, obstruent nor plosive; the first frame is never sent
    // (ph_claus.c:759-766). DECtalk's packets: "a cat." [ax] at 3,
    // "Hello world." [hx] at 4.
    expect(segmentStarts("a cat.")[0]).toEqual(["AX", 3]);
    expect(segmentStarts("Hello world.")[0]).toEqual(["HH", 4]);
  });

  it("gives every later clause its opening pause after the previous clause's closing one", () => {
    // DECtalk's packets for "Yes, we can.": [s] ends at 66, [w] starts at 86:
    // 16 frames for the comma and 4 that open the second clause.
    const starts = segmentStarts("Yes, we can.");
    expect(starts.slice(2, 5)).toEqual([
      ["S", 38],
      ["SIL", 66],
      ["W", 86],
    ]);
  });

  it("releases a voiced plosive before a pause into DECtalk's dummy vowel", () => {
    // Ph_inton2.c:1683-1722. "Red, green, blue, and gold.": IX after [eh d],
    // AX after [lx d]; DECtalk's packets put them at 55-60 and 359-364.
    const result = textToKlattTrackDetailed("Red, green, blue, and gold.", undefined, 30, {
      frontendId: "dectalk-english",
    });
    const dummies = result.utterance
      .relation("Segment")
      .listItems()
      .filter((item) => item.get("active") !== false && item.get("dummy_vowel") === true);
    expect(dummies.map((item) => item.get("dummy_phone"))).toEqual(["IX", "AX"]);
    expect(dummies.map((item) => item.get("duration"))).toEqual([38.4, 38.4]);
    const starts = segmentStarts("Red, green, blue, and gold.");
    expect(starts.filter(([phoneme]) => phoneme === "SIL")).toEqual([
      ["SIL", 55],
      ["SIL", 61],
      ["SIL", 146],
      ["SIL", 225],
      ["SIL", 359],
      ["SIL", 365],
    ]);
  });

  it("gives no dummy vowel where DECtalk's intonation routine has left its loop", () => {
    // Ph_inton2.c:809-819 breaks out of the allophone loop at a syllabic that
    // begins and ends the hat past the fourth allophone, before Rule 9 can
    // run: "We will wait." ends [t] then silence at packet 92, 186 packets in
    // all. "a cat." (the syllabic is the third allophone) keeps its dummy.
    const dummyCount = (text: string): number =>
      textToKlattTrackDetailed(text, undefined, 30, { frontendId: "dectalk-english" })
        .utterance.relation("Segment")
        .listItems()
        .filter((item) => item.get("active") !== false && item.get("dummy_vowel") === true).length;
    expect(dummyCount("We will wait.")).toBe(0);
    expect(dummyCount("a cat.")).toBe(1);
    expect(segmentStarts("We will wait.").slice(-2)).toEqual([
      ["T", 81],
      ["SIL", 92],
    ]);
  });

  it("preserves required segment features when reducing a same-word geminate", () => {
    const result = textToKlattTrackDetailed("Safe zones feel fuzzy.", 110, 30, {
      frontendId: "dectalk-english",
    });
    const activeSegments = result.utterance
      .relation("Segment")
      .listItems()
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
            expect(Number.isFinite(val), `${key} is not finite in frame at t=${frame.time}`).toBe(
              true,
            );
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
    console.log(
      "| Phrase | Frames | Duration(ms) | F0 min-max (Hz) | F1 min-max (Hz) | Segments |",
    );
    console.log("|--------|--------|-------------|-----------------|-----------------|----------|");
    for (const r of results) {
      console.log(
        `| ${r.phrase.substring(0, 30).padEnd(30)} | ${String(r.frames).padStart(6)} | ${String(r.durationMs).padStart(11)} | ${String(r.f0Min).padStart(6)}-${String(r.f0Max).padEnd(6)} | ${String(r.f1Min).padStart(6)}-${String(r.f1Max).padEnd(6)} | ${String(r.segments).padStart(8)} |`,
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

  it("uses the dictionary pronunciation for 'colonel' (K RR N EL), not the LTS spelling-out", () => {
    const phs = contentPhonemes("colonel.");
    // Dictionary: k'Rnl, DECtalk's RR vowel. The old LTS path produced
    // K AA L AA N EH L, with no r-colored vowel and a doubled AA.
    expect(phs).toContain("RR");
    expect(phs.filter((p) => p === "AA").length).toBe(0);
    expect(phs[0]).toBe("K");
  });

  it("uses the dictionary pronunciation for 'nuclear' (N UW K L IY RR), avoiding the LTS 'nucular' shape", () => {
    const phs = contentPhonemes("nuclear.");
    // The dictionary entry ends in DECtalk's RR vowel, with IY before it.
    expect(phs).toContain("RR");
    expect(phs).toContain("IY");
    expect(phs[0]).toBe("N");
  });

  // An inflected word whose dictionary root has RR as its only vowel. These
  // threw E_STRESS_DOMAIN while the frontend sent them through the shared
  // morphology and stress policy, whose vowel list had no RR. DECtalk's own
  // suffix rules handle them now (the IX of "nurses" is theirs).
  it.each([
    ["nurses.", ["N", "RR", "S", "IX", "Z"]],
    ["girls.", ["G", "G_REL", "RR", "LX", "Z"]],
    ["worked.", ["W", "RR", "K", "T"]],
  ])("says %s from a dictionary root whose only vowel is RR", (phrase, expected) => {
    expect(contentPhonemes(phrase)).toEqual(expected);
  });

  // Words with no dictionary root are pronounced by DECtalk's own compiled
  // letter-to-sound tables (scripts/oracle/compare-lts.ts measures all 417
  // oracle words); these are the ones the oracle gate used to list as gaps.
  it.each([
    ["cape.", ["K", "K_REL", "EY", "P"]],
    ["zones.", ["Z", "OW", "N", "Z"]],
    ["barked.", ["B", "B_REL", "AR", "K", "T"]],
  ])("says %s by table letter-to-sound", (phrase, expected) => {
    expect(contentPhonemes(phrase)).toEqual(expected);
  });
});

// ---------------------------------------------------------------------------
// A clause that begins with a wh-word is a question DECtalk ends like a
// statement: LTS/ls_task.c sends its "?" on as a period.
// ---------------------------------------------------------------------------
describe("dectalk-english wh-questions", () => {
  function finalPunctuation(phrase: string): { symbol: unknown; rime: unknown[] } {
    const { utterance } = textToKlattTrackDetailed(phrase, 110, 30, {
      frontendId: "dectalk-english",
    });
    const live = utterance
      .relation("Segment")
      .listItems()
      .filter((item) => item.get("active") !== false);
    return {
      symbol: live
        .findLast((item) => item.get("punctuationSymbol") != null)
        ?.get("punctuationSymbol"),
      rime: [...new Set(live.map((item) => item.get("rime_boundary")).filter((b) => b != null))],
    };
  }

  it.each(["Where are they going?", "How are you today?", "What is it?"])(
    "ends %j with a period-type boundary",
    (phrase) => {
      const { symbol, rime } = finalPunctuation(phrase);
      expect(symbol).toBe(".");
      expect(rime).toContain("period");
      expect(rime).not.toContain("question");
    },
  );

  // The first word is the one after a sentence end; a comma does not start
  // a new one, so "well" decides the last of these.
  it.each(["Can we go?", "Is it where we go?", "Well, where are they?"])(
    "keeps %j a question",
    (phrase) => {
      const { symbol, rime } = finalPunctuation(phrase);
      expect(symbol).toBe("?");
      expect(rime).toContain("question");
    },
  );

  it("decides each clause by its own first word", () => {
    const { utterance } = textToKlattTrackDetailed("Can we go? Where?", 110, 30, {
      frontendId: "dectalk-english",
    });
    const symbols = utterance
      .relation("Segment")
      .listItems()
      .filter((item) => item.get("active") !== false && item.get("punctuationSymbol") != null)
      .map((item) => item.get("punctuationSymbol"));
    expect(symbols).toEqual(["?", "."]);
  });
});

// ---------------------------------------------------------------------------
// "are", "had", "is", "was", "were" and "will" take secondary stress as the
// first word of a sentence (LTS/ls_task.c verbs[]). The sentences here have a
// second verb, so the helper-verb promotion below stays out of it. Stress per
// phone from DECtalk's debug build (p_us_tim.c state prints):
// "Was it raining?" w 2, ah 2; "It was raining." and "Well, was it raining?"
// have "was" at 0; "Will it rain." w 2, ih 2.
// ---------------------------------------------------------------------------
function dectalkVowelStress(phrase: string): Array<[unknown, unknown]> {
  const { utterance } = textToKlattTrackDetailed(phrase, 110, 30, {
    frontendId: "dectalk-english",
  });
  return utterance
    .relation("Segment")
    .listItems()
    .filter((item) => item.get("active") !== false && item.get("type") === "vowel")
    .map((item) => [item.get("word"), item.get("stress")]);
}

describe("dectalk-english sentence-initial auxiliaries", () => {
  it("gives the auxiliary secondary stress at the start of a sentence", () => {
    expect(dectalkVowelStress("Was it raining?")[0]).toEqual(["was", 2]);
    expect(dectalkVowelStress("Will it rain.")[0]).toEqual(["will", 2]);
  });

  it("leaves it unstressed elsewhere, also after a comma", () => {
    expect(dectalkVowelStress("It was raining.")[1]).toEqual(["was", 0]);
    expect(dectalkVowelStress("Well, was it raining?")[1]).toEqual(["was", 0]);
  });

  it("counts a new sentence, not a new clause", () => {
    const stresses = dectalkVowelStress("Where are they going? Was it raining?");
    expect(stresses.find(([word]) => word === "was")).toEqual(["was", 2]);
    expect(stresses.find(([word]) => word === "are")).toEqual(["are", 0]);
  });
});

// ---------------------------------------------------------------------------
// A function-word verb that is its clause's only verb is the verb, not a
// helper, and takes secondary stress (ph_task.c:598-626, ph_sort.c:1272-1302).
// Each expectation is the stress DECtalk's debug build prints for that vowel.
// ---------------------------------------------------------------------------
describe("dectalk-english helper-verb promotion", () => {
  const stressOf = (phrase: string, word: string, nth = 0): unknown =>
    dectalkVowelStress(phrase).filter(([spoken]) => spoken === word)[nth]?.[1];

  it("gives a clause's only verb secondary stress when it is a function word", () => {
    expect(stressOf("It is here.", "is")).toBe(2);
    expect(stressOf("How are you today?", "are")).toBe(2);
    expect(stressOf("I have it.", "have")).toBe(2);
    expect(stressOf("Silver, and gold.", "and")).toBe(2);
  });

  it("leaves it alone when the clause has another verb", () => {
    expect(stressOf("This is a test.", "is")).toBe(0);
    expect(stressOf("Where are they going?", "are")).toBe(0);
    expect(stressOf("You may go.", "may")).toBe(0);
  });

  it("skips a verb that is also a noun or an adjective", () => {
    // "can" and "up" are nouns too; "can" gets the clause's primary stress.
    expect(stressOf("He can.", "can")).toBe(1);
    expect(stressOf("Up there.", "up")).toBe(0);
  });

  it("adds to the stress the vowel has", () => {
    expect(stressOf("They do.", "do")).toBe(3);
    expect(stressOf("It is.", "is")).toBe(3);
  });

  it("keeps the consonant before a promoted vowel at secondary stress", () => {
    const { utterance } = textToKlattTrackDetailed("They do.", 110, 30, {
      frontendId: "dectalk-english",
    });
    const d = utterance
      .relation("Segment")
      .listItems()
      .find((item) => item.get("active") !== false && item.get("phoneme") === "D");
    expect(d?.get("stress")).toBe(2);
  });

  it("carries an unused promotion into the following clauses", () => {
    expect(stressOf("They went.", "went")).toBe(1);
    expect(stressOf("He can. They went.", "went")).toBe(3);
    expect(stressOf("He can. So. They went.", "went")).toBe(3);
    expect(stressOf("To be, they went.", "went")).toBe(3);
    // Used by "rained" (class ed, from the suffix rule).
    expect(stressOf("He can. It rained. They went.", "rained")).toBe(3);
    expect(stressOf("He can. It rained. They went.", "went")).toBe(1);
    expect(stressOf("They went, he can, they went.", "went", 0)).toBe(1);
    expect(stressOf("They went, he can, they went.", "went", 1)).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// The last rime before a word that starts a verb phrase carries FVPNEXT, not
// FWBNEXT (LTS/ls_dict.c:777-778, ph_sort2.c get_next_bound_type). Boundary
// value per phone from DECtalk's debug build: 160 is the verb-phrase value,
// 96 a word boundary.
// ---------------------------------------------------------------------------
describe("dectalk-english verb-phrase boundaries", () => {
  function boundaries(phrase: string): string[] {
    const { utterance } = textToKlattTrackDetailed(phrase, 110, 30, {
      frontendId: "dectalk-english",
    });
    return utterance
      .relation("Segment")
      .listItems()
      .filter((item) => item.get("active") !== false && item.get("rime_boundary") !== undefined)
      .map((item) => `${String(item.get("phoneme"))}:${String(item.get("rime_boundary"))}`);
  }

  it("marks the rime before a verb", () => {
    // "Can we go?": ae 96, n 96, iy 160, ow question.
    expect(boundaries("Can we go?")).toEqual(["AE:word", "N:word", "IY:vp", "OW:question"]);
    // "They went home.": ey 160.
    expect(boundaries("They went home.")[0]).toBe("EY:vp");
  });

  it("reads a suffixed verb's root", () => {
    // "He goes home.": iy 160 ("go" is a verb, "goes" is not in the dictionary).
    expect(boundaries("He goes home.")[0]).toBe("IY:vp");
  });

  it("still knows the verb when an allophone rule has replaced its first phone", () => {
    // "They receive it.": ey 160. The R of "receive" is rewritten after the
    // lexicon is read; the word's phrase start is kept on its Word.
    expect(boundaries("They receive it.")[0]).toBe("EY:vp");
    expect(boundaries("They remain.")[0]).toBe("EY:vp");
  });

  it("leaves a word boundary before a word that is also a noun", () => {
    // "We tested it.": iy 96.
    expect(boundaries("We tested it.")[0]).toBe("IY:word");
  });
});

// ---------------------------------------------------------------------------
// /r/ before a vowel stays R in US English (the R -> RR rule of ph_aloph.c is
// for the German phone), and a vowel fuses with a following /r/ only when the
// /r/ has no stress of any level (ph_aloph.c:823). Phone codes from DECtalk's
// debug build: "every." eh v r iy; "hundred." hx ah n d r ih d;
// "around." ax r aw n d; "story." s t or iy.
// ---------------------------------------------------------------------------
describe("dectalk-english /r/", () => {
  function phones(phrase: string): string[] {
    const { utterance } = textToKlattTrackDetailed(phrase, 110, 30, {
      frontendId: "dectalk-english",
    });
    return utterance
      .relation("Segment")
      .listItems()
      .filter(
        (item) =>
          item.get("active") !== false &&
          item.get("phoneme") !== "SIL" &&
          !String(item.get("phoneme")).endsWith("_REL"),
      )
      .map((item) => String(item.get("phoneme")));
  }

  it("keeps R before an unstressed vowel", () => {
    expect(phones("every.")).toEqual(["EH", "V", "R", "IY"]);
    expect(phones("hundred.").slice(0, 6)).toEqual(["HH", "AH", "N", "D", "R", "IH"]);
  });

  it("does not fuse a vowel with an /r/ that has secondary stress", () => {
    expect(phones("around.")).toEqual(["AX", "R", "AW", "N", "D"]);
  });

  it("still fuses a vowel with an unstressed /r/", () => {
    expect(phones("story.")).toEqual(["S", "T", "OR", "IY"]);
  });

  // "Rule 1a: The word 'the' should be /dh iy/ before a syllabic"
  // (ph_aloph.c:735-748). DECtalk's debug build: "The old man." dh iy ow lx d
  // m ae n. Its record for "The cake is good." starts dh ax k.
  it("says the schwa of 'the' as IY before a vowel", () => {
    expect(phones("The old man.").slice(0, 3)).toEqual(["DH", "IY", "OW"]);
    expect(phones("The cake is good.").slice(0, 3)).toEqual(["DH", "AX", "K"]);
  });
});

// ---------------------------------------------------------------------------
// DECtalk's text stage puts a comma before a conjunction or a preposition
// that is far enough from the last one and from the end (LTS/ls_task.c
// :5129-5229, ls_util.c:824-853). Its phoneme log for "The big dog barked and
// the small cat ran away." has the comma before "and"; none for "The dog and
// the cat ran." or "The big dog barked and ran.".
// ---------------------------------------------------------------------------
describe("dectalk-english clause breaks", () => {
  const detailed = (phrase: string) =>
    textToKlattTrackDetailed(phrase, 110, 30, { frontendId: "dectalk-english" }).utterance;
  const active = (phrase: string) =>
    detailed(phrase)
      .relation("Segment")
      .listItems()
      .filter((item) => item.get("active") !== false);
  const commas = (phrase: string): number =>
    active(phrase).filter((item) => item.get("punctuationSymbol") === ",").length;
  const phonesOf = (phrase: string, word: string): string[] =>
    active(phrase)
      .filter((item) => item.get("word") === word && !String(item.get("phoneme")).endsWith("_REL"))
      .map((item) => String(item.get("phoneme")));

  it("puts a comma before a conjunction with words enough on both sides", () => {
    expect(commas("The big dog barked and the small cat ran away.")).toBe(1);
    expect(commas("The dog and the cat ran.")).toBe(0);
    expect(commas("The big dog barked and ran.")).toBe(0);
  });

  // DECtalk's phoneme log: no comma in "Do you know where the station is?"
  // (three words after "where"), one in "... is today?" (four).
  it("needs more than three words after the marked word", () => {
    expect(commas("Do you know where the station is?")).toBe(0);
    expect(commas("Do you know where the station is today?")).toBe(1);
  });

  it("breaks before a preposition, and not again within three words", () => {
    const words = active("The big dog barked at the small cat in the box.");
    const comma = words.findIndex((item) => item.get("punctuationSymbol") === ",");
    expect(words[comma + 1]?.get("word")).toBe("at");
    expect(commas("The big dog barked at the small cat in the box.")).toBe(1);
  });

  it("makes the comma a silence that belongs to no word", () => {
    const utterance = detailed("The big dog barked and the small cat ran away.");
    const segments = utterance
      .relation("Segment")
      .listItems()
      .filter((item) => item.get("active") !== false);
    const comma = segments.find((item) => item.get("punctuationSymbol") === ",");
    expect(comma?.get("phoneme")).toBe("SIL");
    expect(comma && utterance.relation("SylStructure").node(comma)).toBeUndefined();
    // The word after it still owns its phones.
    const first = segments[segments.indexOf(comma as (typeof segments)[number]) + 1];
    expect(utterance.relation("SylStructure").node(first)?.parent?.parent?.item.get("text")).toBe(
      "and",
    );
  });

  it("counts a number in digits as one written word", () => {
    const places = detailed("The 25 and the small cat ran away.")
      .relation("Word")
      .listItems()
      .map((word) => word.get("clause_word_index"));
    expect(places).toEqual([1, 2, 2, 3, 4, 5, 6, 7, 8]);
    expect(commas("The 25 and the small cat ran away.")).toBe(0);
  });

  it("starts the count again after a written comma", () => {
    expect(commas("Yes, the big dog barked and the small cat ran away.")).toBe(2);
  });

  // ph_aloph.c:765-781 and :486-501. DECtalk's debug build: EH N D after the
  // break above; AE N D, with the promoted AE, in "Silver, and gold.".
  it("says a clause-initial 'and' with EH unless the clause is short and the vowel stressed", () => {
    expect(phonesOf("The big dog barked and the small cat ran away.", "and")).toEqual([
      "EH",
      "N",
      "D",
    ]);
    expect(phonesOf("Silver, and gold.", "and")).toEqual(["AE", "N", "D"]);
  });

  // ph_aloph.c:801-814. DECtalk's debug build: "Look at me." (nine entries
  // with its two silences) ae tx; "Look at them." (ten) eh tx.
  it("says 'at' with EH in a clause of ten entries or more", () => {
    expect(phonesOf("Look at me.", "at")).toEqual(["AE", "TX"]);
    expect(phonesOf("Look at them.", "at")).toEqual(["EH", "TX"]);
  });

  // The class of the word after a break reaches DECtalk's phonetic stage
  // before the comma (ls_util.c:808-853), and the comma carries it through
  // the phone sort (ph_sort.c:1271-1302). DECtalk's debug build: "and" is
  // unstressed in its own clause, and in "The big small cat and they remain
  // here today." the first vowel of "remain" is unstressed too: the flag that
  // the class of "and" set is used up at the comma.
  it("counts the class of the word after a break in the clause before it", () => {
    const stress = (phrase: string, word: string): unknown =>
      active(phrase)
        .find((item) => item.get("word") === word && item.get("type") === "vowel")
        ?.get("stress");
    expect(stress("The big dog barked and the small cat ran away.", "and")).toBe(0);
    expect(stress("The big small cat and they remain here today.", "remain")).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// FTYPESYL counts the syllabics of the word (ph_sort2.c init_med_final), not
// the syllabifier's syllables. DECtalk's record (dectalk-us-v1.durations.json):
// "Vision is usual." has YU first, UW medial, EL final; "Red lorries..." has
// OR first, IY final.
// ---------------------------------------------------------------------------
describe("dectalk-english syllable type", () => {
  function syllableTypes(phrase: string, word: string): string[] {
    const { utterance } = textToKlattTrackDetailed(phrase, 110, 30, {
      frontendId: "dectalk-english",
    });
    return utterance
      .relation("Segment")
      .listItems()
      .filter(
        (item) =>
          item.get("active") !== false &&
          item.get("word") === word &&
          item.get("syllable_type") !== undefined,
      )
      .map((item) => `${String(item.get("phoneme"))}:${String(item.get("syllable_type"))}`);
  }

  it("counts /yu/ and a syllabic consonant as syllabics", () => {
    expect(syllableTypes("Vision is usual.", "usual")).toEqual([
      "YU:first",
      "UW:medial",
      "EL:final",
    ]);
  });

  it("puts a vowel fused with /r/ where the vowel was", () => {
    expect(syllableTypes("Red lorries.", "lorries")).toEqual(["OR:first", "IY:final"]);
  });

  it("gives a monosyllable no position", () => {
    expect(syllableTypes("Red lorries.", "red")).toEqual(["EH:only"]);
  });
});

// ---------------------------------------------------------------------------
// One output clock. DECtalk's controller counts nominal 6.4-ms frames
// (ph_claus.c) and the VTM emits each as a 71-sample packet at 11,025 Hz
// (VTM/vtmiont.c), so every frame of a clause, segment starts and F0 ticks
// alike, sits on the same packet clock. A frame of a segment that has already
// been left means two frames were projected by different clocks.
// ---------------------------------------------------------------------------
describe("dectalk-english output clock", () => {
  function framesOfLeftSegments(track: KlattFrame[]): string[] {
    const ordinals = new Map<string, number>();
    const violations: string[] = [];
    let latest = -1;
    let seenSegment = false;
    for (const frame of track) {
      if (frame.segmentId) seenSegment = true;
      // Frames without a Segment are the synthesized silence edges: the
      // initial edge before the first Segment, the final edge after the last.
      const key = frame.segmentId ?? (seenSegment ? "edge:final" : "edge:initial");
      if (!ordinals.has(key)) ordinals.set(key, ordinals.size);
      const ordinal = ordinals.get(key) as number;
      if (ordinal < latest) {
        violations.push(`${(frame.time * 1000).toFixed(4)} ms ${frame.phoneme ?? "?"} (${key})`);
      } else {
        latest = ordinal;
      }
    }
    return violations;
  }

  it.each(["moon.", "Hello world.", "The rain in Spain stays mainly in the plain."])(
    "never emits a frame of a segment that has already ended: %s",
    (phrase) => {
      const track = textToKlattTrack(phrase, undefined, 30, { frontendId: "dectalk-english" });
      expect(framesOfLeftSegments(track)).toEqual([]);
    },
  );

  it("places segment starts on the packet clock, not the nominal controller clock", () => {
    const { track } = textToKlattTrackDetailed("moon.", undefined, 30, {
      frontendId: "dectalk-english",
    });
    const starts = new Map<string, number>();
    for (const frame of track) {
      if (frame.segmentId && !starts.has(frame.segmentId)) starts.set(frame.segmentId, frame.time);
    }
    const [mStart, uwStart] = [...starts.values()];
    // Control: M starts after 3 frames of initial silence.
    expect(mStart).toBeCloseTo(3 * DECTALK_PACKET_PERIOD_SEC, 9);
    // The last M tick (controller frame 15) must precede the UW start.
    expect(uwStart).toBeGreaterThan(15 * DECTALK_PACKET_PERIOD_SEC);
  });
});
