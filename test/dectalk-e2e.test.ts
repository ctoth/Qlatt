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
    expect(dummyVowels[0].get("duration")).toBe(38);
    expect(dummyVowels[0].get("F1")).toBe(460);
    expect(dummyVowels[0].get("F2")).toBe(1680);
    expect(dummyVowels[0].get("F3")).toBe(2520);
    expect(dummyVowels[0].get("TL")).toBe(0);
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

  it.each(["Can we go?", "Is it where we go?"])("keeps %j a question", (phrase) => {
    const { symbol, rime } = finalPunctuation(phrase);
    expect(symbol).toBe("?");
    expect(rime).toContain("question");
  });

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
