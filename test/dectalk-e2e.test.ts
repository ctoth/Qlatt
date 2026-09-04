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
    const hatRiseCommands = tiltCommands
      .filter((item) => item.get("tag") === "f0_hat_rise");
    const hatFallCommands = tiltCommands
      .filter((item) => item.get("tag") === "f0_hat_fall");
    const boundaryResetCommands = tiltCommands
      .filter((item) => item.get("tag") === "f0_boundary_reset");
    const stressCommands = tiltCommands
      .filter((item) => item.get("layer") === "stress");

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
    const baseline = result.utterance.relation("PhraseCommand").listItems()
      .find((item) => item.get("layer") === "baseline");

    expect(baseline?.get("profile_points")).toEqual([
      1160, 1150, 1140, 1152, 1132, 1140, 1130, 1124, 1110,
      1100, 1080, 1060, 1040, 1020, 980, 960, 950,
    ]);
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
      { value: 0, durationFrames: 17, profilePoints: [1, 1, 1] },
      { value: 50, durationFrames: 37, profilePoints: [0, 0, 1] },
      { value: 0, durationFrames: 14, profilePoints: [1, 1, 0] },
      { value: 70, durationFrames: 6, profilePoints: [0, 0, 0] },
      { value: 50, durationFrames: 94, profilePoints: [1, 0, 0] },
    ]);
  });

  it("matches DECtalk's native voiced F0 cells through cake's EY", () => {
    const result = textToKlattTrackDetailed("cake.", 110, 30, {
      frontendId: "dectalk-english",
      speaker: "paul",
    });
    const f0Hz10 = Array.from({ length: 28 }, (_, frameIndex) => {
      const time = (29 + frameIndex) * DECTALK_PACKET_PERIOD_SEC;
      const f0 = result.track.filter((frame) => frame.time <= time).at(-1)?.params.F0;
      return Math.round((f0 ?? Number.NaN) * 10);
    });

    expect(f0Hz10).toEqual([
      1361, 1379, 1395, 1403, 1404, 1400, 1394,
      1385, 1371, 1358, 1343, 1328, 1313, 1297,
      1282, 1269, 1254, 1242, 1229, 1219, 1207,
      1197, 1187, 1179, 1171, 1164, 1157, 1149,
    ]);
  });

  it("matches every native F0 cell through the's complete trace", () => {
    const result = textToKlattTrackDetailed("the.", 110, 30, {
      frontendId: "dectalk-english",
      speaker: "paul",
    });
    const f0Hz10 = Array.from({ length: 139 }, (_, frameIndex) => {
      const time = frameIndex * DECTALK_PACKET_PERIOD_SEC;
      const f0 = result.track.filter((frame) => frame.time <= time + 1e-9).at(-1)?.params.F0;
      return Math.round((f0 ?? Number.NaN) * 10);
    });

    expect(f0Hz10).toEqual([
      973, 979, 982, 985, 978, 979, 990,
      1005, 1025, 1049, 1074, 1102, 1128,
      1155, 1183, 1209, 1236, 1261, 1286,
      1308, 1330, 1349, 1367, 1384, 1397,
      1403, 1403, 1397, 1388, 1374, 1360,
      1343, 1325, 1305, 1286, 1267, 1248,
      1226, 1206, 1186, 1166, 1148, 1129,
      1114, 1097, 1081, 1067, 1055, 1044,
      1043, 1041, 1038, 1037, 1034, 1032,
      1031, 1028, 1026, 1024, 1021, 1019,
      1018, 1015, 1015, 1012, 1011, 1008,
      1006, 1004, 1000, 998, 997, 995,
      993, 992, 992, 991, 990, 990, 989,
      989, 989, 989, 990, 991, 992, 993,
      993, 992, 992, 991, 991, 989, 989,
      988, 987, 986, 984, 982, 981, 979,
      977, 975, 974, 973, 973, 972, 973,
      973, 974, 975, 976, 978, 979, 982,
      985, 987, 990, 992, 994, 995, 997,
      998, 998, 999, 999, 998, 998, 997,
      996, 994, 992, 990, 988, 987, 985,
      984, 983, 982,
    ]);
  });

  it("matches every native F1 cell through the complete the trace", () => {
    const result = textToKlattTrackDetailed("the.", 110, 30, {
      frontendId: "dectalk-english",
      speaker: "paul",
    });
    const f1 = Array.from({ length: 139 }, (_, frameIndex) => {
      const time = frameIndex * DECTALK_PACKET_PERIOD_SEC;
      return result.track.filter((frame) => frame.time <= time + 1e-9).at(-1)?.params.F1;
    });

    expect(f1).toEqual([
      289, 289, 289, 289, 295, 297, 299,
      301, 301, 301, 301, 301, 323, 346,
      368, 390, 412, 435, 457, 479, 501,
      524, 526, 528, 530, 533, 535, 537,
      539, 542, 544, 546, 548, 548, 548,
      548, 548, 548, 548, 548, 548, 548,
      548, 548, 548, 548, 547, 547, 547,
      547, 548, 548, 548, 548, 549, 549,
      549, 549, 550, 550, 550, 550, 551,
      551, 551, 551, 552, 552, 552, 552,
      552, 552, 552, 552, 552, 552, 552,
      552, 552, 552, 552, 552, 552, 552,
      552, 552, 552, 552, 552, 552, 552,
      552, 552, 552, 552, 552, 552, 552,
      552, 552, 552, 552, 552, 552, 552,
      552, 552, 552, 552, 552, 552, 552,
      552, 552, 552, 552, 552, 552, 552,
      552, 552, 552, 552, 552, 552, 552,
      552, 552, 552, 552, 552, 552, 552,
      552, 552, 552, 552, 552, 552,
    ]);
  });

  it("matches every native F2 cell through the complete the trace", () => {
    const result = textToKlattTrackDetailed("the.", 110, 30, {
      frontendId: "dectalk-english",
      speaker: "paul",
    });
    const f2 = Array.from({ length: 139 }, (_, frameIndex) => {
      const time = frameIndex * DECTALK_PACKET_PERIOD_SEC;
      return result.track.filter((frame) => frame.time <= time + 1e-9).at(-1)?.params.F2;
    });

    expect(f2).toEqual([
      1500, 1500, 1500, 1500, 1493, 1492, 1491,
      1490, 1489, 1488, 1467, 1446, 1425, 1404,
      1384, 1371, 1358, 1345, 1333, 1320, 1307,
      1294, 1280, 1278, 1276, 1274, 1272, 1270,
      1268, 1266, 1264, 1262, 1260, 1260, 1260,
      1260, 1260, 1260, 1260, 1260, 1260, 1260,
      1260, 1260, 1260, 1260, 1259, 1261, 1263,
      1265, 1268, 1270, 1272, 1274, 1276, 1278,
      1280, 1282, 1285, 1287, 1289, 1291, 1293,
      1295, 1297, 1299,
      ...Array(73).fill(1302),
    ]);
  });

  it("matches every native F3 cell through the complete the trace", () => {
    const result = textToKlattTrackDetailed("the.", 110, 30, {
      frontendId: "dectalk-english",
      speaker: "paul",
    });
    const f3 = Array.from({ length: 139 }, (_, frameIndex) => {
      const time = frameIndex * DECTALK_PACKET_PERIOD_SEC;
      return result.track.filter((frame) => frame.time <= time + 1e-9).at(-1)?.params.F3;
    });

    expect(f3).toEqual([
      2562, 2562, 2562, 2562, 2561, 2562, 2562,
      2562, 2562, 2563, 2592, 2621, 2650, 2679,
      2709, 2695, 2681, 2667, 2653, 2639, 2625,
      2611, 2598, 2598, 2598, 2599, 2599, 2599,
      2599, 2600, 2600, 2600, 2600, 2600, 2600,
      2600, 2600, 2600, 2600, 2600, 2600, 2600,
      2600, 2600, 2600, 2600,
      ...Array(93).fill(2602),
    ]);
  });

  it("matches every native B1 cell through the complete the trace", () => {
    const result = textToKlattTrackDetailed("the.", 110, 30, {
      frontendId: "dectalk-english",
      speaker: "paul",
    });
    const b1 = Array.from({ length: 139 }, (_, frameIndex) => {
      const time = frameIndex * DECTALK_PACKET_PERIOD_SEC;
      return result.track.filter((frame) => frame.time <= time + 1e-9).at(-1)?.params.B1;
    });

    expect(b1).toEqual([
      200, 200, 200, 200, 200, 187, 175,
      162, 150, 136, 123, 109, 96, 95,
      94, 93, 93, 92, 91,
      ...Array(20).fill(90),
      102, 115, 127, 140, 152, 165, 177,
      190, 177, 165, 152, 140, 127, 115, 102,
      ...Array(79).fill(90),
      102, 115, 127, 140, 152, 165,
    ]);
  });

  it("matches every native B2 cell through the complete the trace", () => {
    const result = textToKlattTrackDetailed("the.", 110, 30, {
      frontendId: "dectalk-english",
      speaker: "paul",
    });
    const b2 = Array.from({ length: 139 }, (_, frameIndex) => {
      const time = frameIndex * DECTALK_PACKET_PERIOD_SEC;
      return result.track.filter((frame) => frame.time <= time + 1e-9).at(-1)?.params.B2;
    });
    const expected = [
      170, 170, 170, 170, 170, 163, 157,
      151, 145, 135, 125, 116, 106, 103,
      99, 96, 93, 89, 86, 83,
      ...Array(19).fill(80),
      86, 92, 98, 105, 111, 117, 123,
      130, 123, 117, 111, 105, 98, 92, 86,
      ...Array(79).fill(80),
      86, 92, 98, 105, 111, 117,
    ];

    expect(expected).toHaveLength(139);
    expect(b2).toEqual(expected);
  });

  it("matches every native B3 cell through the complete the trace", () => {
    const result = textToKlattTrackDetailed("the.", 110, 30, {
      frontendId: "dectalk-english",
      speaker: "paul",
    });
    const b3 = Array.from({ length: 139 }, (_, frameIndex) => {
      const time = frameIndex * DECTALK_PACKET_PERIOD_SEC;
      return result.track.filter((frame) => frame.time <= time + 1e-9).at(-1)?.params.B3;
    });
    const expected = [
      ...Array(10).fill(170),
      171, 172, 173, 173, 174, 175, 176, 177, 178, 179,
      ...Array(119).fill(180),
    ];

    expect(expected).toHaveLength(139);
    expect(b3).toEqual(expected);
  });

  it("matches every native AV cell through the complete the trace", () => {
    const result = textToKlattTrackDetailed("the.", 110, 30, {
      frontendId: "dectalk-english",
      speaker: "paul",
    });
    const av = Array.from({ length: 139 }, (_, frameIndex) => {
      const time = frameIndex * DECTALK_PACKET_PERIOD_SEC;
      return result.track.filter((frame) => frame.time <= time + 1e-9).at(-1)?.params.AV;
    });
    const expected = [
      0, 0, 0,
      34, 37, 39, 42, 45, 47, 50, 54, 55, 56, 57, 58, 59, 60, 61,
      ...Array(16).fill(62),
      61, 60, 60, 59, 58, 58, 57, 57, 56, 55, 55,
      ...Array(94).fill(0),
    ];

    expect(expected).toHaveLength(139);
    expect(av).toEqual(expected);
  });

  it("matches every native AP cell through the complete the trace", () => {
    const result = textToKlattTrackDetailed("the.", 110, 30, {
      frontendId: "dectalk-english",
      speaker: "paul",
    });
    const ap = Array.from({ length: 139 }, (_, frameIndex) => {
      const time = frameIndex * DECTALK_PACKET_PERIOD_SEC;
      return result.track.filter((frame) => frame.time <= time + 1e-9).at(-1)?.params.AH;
    });
    const expected = [
      ...Array(27).fill(0),
      2, 5, 7, 10, 12, 15, 17, 20, 22, 25, 27, 30, 32, 35, 37, 40,
      42, 45, 47, 45, 42, 38, 35, 31, 28, 24, 21, 17, 14, 10, 7, 3,
      ...Array(80).fill(0),
    ];

    expect(expected).toHaveLength(139);
    expect(ap).toEqual(expected);
  });

  it("matches every native A6 cell through the complete the trace", () => {
    const result = textToKlattTrackDetailed("the.", 110, 30, {
      frontendId: "dectalk-english",
      speaker: "paul",
    });
    const a6 = Array.from({ length: 139 }, (_, frameIndex) => {
      const time = frameIndex * DECTALK_PACKET_PERIOD_SEC;
      return result.track.filter((frame) => frame.time <= time + 1e-9).at(-1)?.params.A6;
    });
    const expected = [
      0, 9, 18, 27,
      ...Array(7).fill(0),
      46, 41, 37, 32, 26, 19, 13, 6,
      ...Array(120).fill(0),
    ];

    expect(expected).toHaveLength(139);
    expect(a6).toEqual(expected);
  });

  it("matches every native AB cell through the complete the trace", () => {
    const result = textToKlattTrackDetailed("the.", 110, 30, {
      frontendId: "dectalk-english",
      speaker: "paul",
    });
    const ab = Array.from({ length: 139 }, (_, frameIndex) => {
      const time = frameIndex * DECTALK_PACKET_PERIOD_SEC;
      return result.track.filter((frame) => frame.time <= time + 1e-9).at(-1)?.params.AB;
    });
    const expected = [
      0, 9, 18, 27, 36, 38, 40, 42, 44, 46, 46, 46, 41,
      37, 32, 26, 19, 13, 6,
      ...Array(120).fill(0),
    ];

    expect(expected).toHaveLength(139);
    expect(ab).toEqual(expected);
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
    const result = textToKlattTrackDetailed("The rain in Spain stays mainly in the plain.", 110, 30, {
      frontendId: "dectalk-english",
      speaker: "paul",
    });
    const b3 = Array.from({ length: 9 }, (_, offset) => {
      const time = (62 + offset) * DECTALK_PACKET_PERIOD_SEC;
      return result.track.filter((frame) => frame.time <= time + 1e-9).at(-1)?.params.B3;
    });

    expect(b3).toEqual(Array(9).fill(1600));
    const ordinaryN = result.track
      .filter((frame) => frame.word === "in" && frame.phoneme === "N")
      .map((frame) => frame.params.B3);
    expect(ordinaryN.length).toBeGreaterThan(0);
    expect(new Set(ordinaryN)).toEqual(new Set([350]));
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
    if (!initialK || !firstKPacket || !initialRelease) throw new Error("initial K carriers missing");
    const closureDurationMs = result.utterance.relation("Segment").listItems()
      .find((item) => item.get("active") !== false && item.get("phoneme") === "K")
      ?.get("duration");
    if (typeof closureDurationMs !== "number") throw new Error("initial K duration missing");
    const nativeFrameMs = 6.4;
    const expectedReleaseStart = firstKPacket.params.F3
      + (2287.5 - firstKPacket.params.F3)
        * ((closureDurationMs - nativeFrameMs) / closureDurationMs);
    const releaseBoundary = result.track.find(
      (frame) => frame.phoneme === "K_REL"
        && Math.abs(frame.time - initialRelease.time - nativeFrameMs / 1000) <= 1e-9,
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
      const time = frameIndex * DECTALK_PACKET_PERIOD_SEC;
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
      const time = frameIndex * DECTALK_PACKET_PERIOD_SEC;
      return result.track.filter((frame) => frame.time <= time).at(-1)?.params.B3;
    });

    expect(b3).toEqual([
      280, 280, 280, 280, 280, 280, 280, 280,
      280, 280, 280, 280, 280, 280, 280, 280,
    ]);
  });

  it("matches every native B2 cell through cake's complete trace", () => {
    const result = textToKlattTrackDetailed("cake.", 110, 30, {
      frontendId: "dectalk-english",
      speaker: "paul",
    });
    const b2 = Array.from({ length: 171 }, (_, frameIndex) => {
      const time = frameIndex * DECTALK_PACKET_PERIOD_SEC;
      return result.track.filter((frame) => frame.time <= time).at(-1)?.params.B2;
    });
    const expected = [
      ...Array(5).fill(210),
      203, 197, 191, 185, 178, 172, 166,
      ...Array(7).fill(160),
      150, 140,
      ...Array(9).fill(170),
      ...Array(23).fill(100),
      104, 109, 114, 119, 124, 130, 140, 150,
      ...Array(9).fill(160),
      150, 140,
      ...Array(6).fill(170),
      150, 143, 137, 131, 125, 118, 112, 106,
      ...Array(79).fill(100),
      106, 112, 118, 125, 131, 137,
    ];

    expect(expected).toHaveLength(171);
    expect(b2).toEqual(expected);
  });

  it("matches every native AV cell through cake's complete trace", () => {
    const result = textToKlattTrackDetailed("cake.", 110, 30, {
      frontendId: "dectalk-english",
      speaker: "paul",
    });
    const av = Array.from({ length: 171 }, (_, frameIndex) => {
      const time = frameIndex * DECTALK_PACKET_PERIOD_SEC;
      return result.track.filter((frame) => frame.time <= time + 1e-9).at(-1)?.params.AV;
    });
    const expected = [
      ...Array(29).fill(0),
      ...Array(28).fill(65),
      ...Array(114).fill(0),
    ];

    expect(expected).toHaveLength(171);
    expect(av).toEqual(expected);
  });

  it("matches every native AP cell through cake's complete trace", () => {
    const result = textToKlattTrackDetailed("cake.", 110, 30, {
      frontendId: "dectalk-english",
      speaker: "paul",
    });
    const ap = Array.from({ length: 171 }, (_, frameIndex) => {
      const time = frameIndex * DECTALK_PACKET_PERIOD_SEC;
      return result.track.filter((frame) => frame.time <= time + 1e-9).at(-1)?.params.AH;
    });
    const expected = [
      ...Array(21).fill(0),
      ...Array(9).fill(48),
      ...Array(42).fill(0),
      ...Array(6).fill(39),
      45, 42, 38, 35, 31, 28, 24, 21, 17, 14, 10, 7, 3,
      ...Array(80).fill(0),
    ];

    expect(expected).toHaveLength(171);
    expect(ap).toEqual(expected);
  });

  it("matches every native A2 cell through cake's complete trace", () => {
    const result = textToKlattTrackDetailed("cake.", 110, 30, {
      frontendId: "dectalk-english",
      speaker: "paul",
    });
    const a2 = Array.from({ length: 171 }, (_, frameIndex) => {
      const time = frameIndex * DECTALK_PACKET_PERIOD_SEC;
      return result.track.filter((frame) => frame.time <= time + 1e-9).at(-1)?.params.A2;
    });

    expect(a2).toEqual(Array(171).fill(0));
  });

  it("matches every native A3 cell through cake's complete trace", () => {
    const result = textToKlattTrackDetailed("cake.", 110, 30, {
      frontendId: "dectalk-english",
      speaker: "paul",
    });
    const a3 = Array.from({ length: 171 }, (_, frameIndex) => {
      const time = frameIndex * DECTALK_PACKET_PERIOD_SEC;
      return result.track.filter((frame) => frame.time <= time + 1e-9).at(-1)?.params.A3;
    });
    const expected = [
      ...Array(17).fill(0),
      50, 50, 49, 48, 36, 24, 12,
      ...Array(44).fill(0),
      47, 47, 46, 45, 33, 22, 11,
      ...Array(96).fill(0),
    ];

    expect(expected).toHaveLength(171);
    expect(a3).toEqual(expected);
  });

  it("matches every native A5 cell through cake's complete trace", () => {
    const result = textToKlattTrackDetailed("cake.", 110, 30, {
      frontendId: "dectalk-english",
      speaker: "paul",
    });
    const a5 = Array.from({ length: 171 }, (_, frameIndex) => {
      const time = frameIndex * DECTALK_PACKET_PERIOD_SEC;
      return result.track.filter((frame) => frame.time <= time + 1e-9).at(-1)?.params.A5;
    });
    const expected = [
      ...Array(17).fill(0),
      36, 36, 35, 34, 22, 15, 7,
      ...Array(44).fill(0),
      33, 33, 32, 31, 19, 13, 6,
      ...Array(96).fill(0),
    ];

    expect(expected).toHaveLength(171);
    expect(a5).toEqual(expected);
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

  it("matches DECtalk's native F1 cells through cake's initial silence and K closure", () => {
    const result = textToKlattTrackDetailed("cake.", 110, 30, {
      frontendId: "dectalk-english",
      speaker: "paul",
    });
    const f1 = Array.from({ length: 16 }, (_, frameIndex) => {
      const time = frameIndex * DECTALK_PACKET_PERIOD_SEC;
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
      const time = (releaseFrameIndex + 16) * DECTALK_PACKET_PERIOD_SEC;
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
      const time = (releaseFrameIndex + 16) * DECTALK_PACKET_PERIOD_SEC;
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
      const time = (releaseFrameIndex + 16) * DECTALK_PACKET_PERIOD_SEC;
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
      const time = frameIndex * DECTALK_PACKET_PERIOD_SEC;
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
      const time = frameIndex * DECTALK_PACKET_PERIOD_SEC;
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
      const time = (21 + frameIndex) * DECTALK_PACKET_PERIOD_SEC;
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
      const time = (21 + frameIndex) * DECTALK_PACKET_PERIOD_SEC;
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
      const time = (21 + frameIndex) * DECTALK_PACKET_PERIOD_SEC;
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
      const time = (21 + frameIndex) * DECTALK_PACKET_PERIOD_SEC;
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
      const time = (58 + index) * DECTALK_PACKET_PERIOD_SEC;
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
      const time = (58 + index) * DECTALK_PACKET_PERIOD_SEC;
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
      const time = (58 + frameIndex) * DECTALK_PACKET_PERIOD_SEC;
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
      const time = (58 + frameIndex) * DECTALK_PACKET_PERIOD_SEC;
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
      const time = (58 + frameIndex) * DECTALK_PACKET_PERIOD_SEC;
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
      const time = (72 + index) * DECTALK_PACKET_PERIOD_SEC;
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
      const time = (72 + index) * DECTALK_PACKET_PERIOD_SEC;
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
      const time = (72 + index) * DECTALK_PACKET_PERIOD_SEC;
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
      const time = (72 + index) * DECTALK_PACKET_PERIOD_SEC;
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
      const time = (78 + index) * DECTALK_PACKET_PERIOD_SEC;
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
      const time = (78 + index) * DECTALK_PACKET_PERIOD_SEC;
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
      const time = (78 + index) * DECTALK_PACKET_PERIOD_SEC;
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
      const time = frameIndex * DECTALK_PACKET_PERIOD_SEC;
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
      const time = (78 + index) * DECTALK_PACKET_PERIOD_SEC;
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
      const time = (165 + index) * DECTALK_PACKET_PERIOD_SEC;
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
    const nativeF2 = [21, 29, 35, 50].map((frameIndex) =>
      frameIndex * DECTALK_PACKET_PERIOD_SEC
    ).map((time) =>
      result.track.findLast((frame) => frame.time <= time + 1e-9)?.params.F2
    );
    const tailF2 = [51, 52, 53, 54, 55, 56, 57].map((frameIndex) =>
      frameIndex * DECTALK_PACKET_PERIOD_SEC
    ).map((time) =>
      result.track.findLast((frame) => frame.time <= time + 1e-9)?.params.F2
    );

    expect(Array.isArray(windows)).toBe(true);
    expect(windows).toContainEqual(expect.objectContaining({
      start_ms: 236.6,
      end_ms: 237,
      fields: expect.objectContaining({ F2: 1994 }),
      tag: "segmental_context",
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
