import { describe, expect, it } from "vitest";
import { runDeclarativeFrontend } from "../src/declarative-frontend";
import { endOrder, finiteOrder, startOrder } from "./utils/order-marks";

describe("declarative frontend rulepack prosody phase", () => {
  it("generates f0 points for stressed vowels and question rise in declarative phases", () => {
    const s0 = startOrder();
    const s1 = finiteOrder(1);
    const s2 = finiteOrder(2);
    const s3 = endOrder();

    const sequence = [
      {
        id: "p1",
        stream: "phone",
        phoneme: "EH",
        type: "vowel",
        stress: 1,
        duration: 100,
        params: { AV: 60, AVS: 0, F0_Factor: 1.0 },
        sync_left: s0,
        sync_right: s1,
        status: 1,
      },
      {
        id: "p2",
        stream: "phone",
        phoneme: "L",
        type: "liquid",
        stress: 0,
        duration: 80,
        params: { AV: 56, AVS: 0, F0_Factor: 1.0 },
        sync_left: s1,
        sync_right: s2,
        status: 1,
      },
      {
        id: "p3",
        stream: "phone",
        phoneme: "SIL",
        type: "silence",
        duration: 300,
        punctuationSymbol: "?",
        params: { AV: 0, AVS: 0, F0_Factor: 1.0 },
        sync_left: s2,
        sync_right: s3,
        status: 1,
      },
    ];

    const out = runDeclarativeFrontend(sequence, {
      phases: ["prosody", "finalize"],
      parameters: {
        policy: {
          f0: {
            base_hz: 110,
            question_rise_hz: 30,
          },
        },
      },
    });

    const points = out.filter((t) => t.stream === "f0");
    expect(points.length).toBeGreaterThanOrEqual(2);
    const sorted = [...points].sort((a, b) => Number(a.time) - Number(b.time));
    const last = sorted[sorted.length - 1];
    const prev = sorted[sorted.length - 2];
    expect(last.value).toBeGreaterThan(prev.value);
    expect(last.value).toBeGreaterThanOrEqual(170);
    expect(last.value).toBeLessThanOrEqual(190);
    expect(Number.isFinite(last.time)).toBe(true);
  });

  // --- F0 voiceless onset perturbation ---

  it("raises F0 at vowel onset after voiceless stop release", () => {
    const s0 = startOrder();
    const s1 = finiteOrder(1);
    const s2 = finiteOrder(2);
    const s3 = endOrder();

    const sequence = [
      {
        id: "p1",
        stream: "phone",
        phoneme: "T_REL",
        type: "stop_release",
        voiceless: true,
        alveolar: true,
        duration: 15,
        params: { AF: 58, AH: 55 },
        sync_left: s0,
        sync_right: s1,
        status: 1,
      },
      {
        id: "p2",
        stream: "phone",
        phoneme: "AE",
        type: "vowel",
        stress: 1,
        duration: 170,
        params: { AV: 64, AVS: 0, F0_Factor: 1.0 },
        sync_left: s1,
        sync_right: s2,
        status: 1,
      },
      {
        id: "p3",
        stream: "phone",
        phoneme: "SIL",
        type: "silence",
        duration: 300,
        punctuationSymbol: ".",
        params: { AV: 0, AVS: 0, F0_Factor: 1.0 },
        sync_left: s2,
        sync_right: s3,
        status: 1,
      },
    ];

    const out = runDeclarativeFrontend(sequence, {
      phases: ["prosody", "finalize"],
      parameters: {
        policy: {
          f0: {
            base_hz: 110,
            voiceless_onset_raise: 1.2,
          },
        },
      },
    });

    const points = out.filter((t) => t.stream === "f0");
    // There should be a point tagged f0_onset_perturbation at the vowel's left boundary
    const onset = points.find((p) => p.tag === "f0_onset_perturbation");
    expect(onset).toBeTruthy();
    // prev_point('f0') returns the last f0 point: declination for AE = base_hz - fall_rate*(1/2) = 100
    // Value = 100 * 1.2 = 120 (20% higher than preceding declination level)
    expect(onset!.value).toBeCloseTo(120, 0);
  });

  // --- F0 voiced onset perturbation ---

  it("lowers F0 at vowel onset after voiced stop", () => {
    const s0 = startOrder();
    const s1 = finiteOrder(1);
    const s2 = finiteOrder(2);
    const s3 = endOrder();

    const sequence = [
      {
        id: "p1",
        stream: "phone",
        phoneme: "B_REL",
        type: "stop_release",
        voiced: true,
        bilabial: true,
        duration: 5,
        params: { AV: 47, AF: 52, AVS: 0, F0_Factor: 1.0 },
        sync_left: s0,
        sync_right: s1,
        status: 1,
      },
      {
        id: "p2",
        stream: "phone",
        phoneme: "AE",
        type: "vowel",
        stress: 1,
        duration: 170,
        params: { AV: 64, AVS: 0, F0_Factor: 1.0 },
        sync_left: s1,
        sync_right: s2,
        status: 1,
      },
      {
        id: "p3",
        stream: "phone",
        phoneme: "SIL",
        type: "silence",
        duration: 300,
        punctuationSymbol: ".",
        params: { AV: 0, AVS: 0, F0_Factor: 1.0 },
        sync_left: s2,
        sync_right: s3,
        status: 1,
      },
    ];

    const out = runDeclarativeFrontend(sequence, {
      phases: ["prosody", "finalize"],
      parameters: {
        policy: {
          f0: {
            base_hz: 110,
            voiced_onset_lower: 0.95,
          },
        },
      },
    });

    const points = out.filter((t) => t.stream === "f0");
    const onset = points.find((p) => p.tag === "f0_onset_perturbation");
    expect(onset).toBeTruthy();
    // prev_point('f0') returns the last f0 point: declination for AE = base_hz - fall_rate*(1/2) = 100
    // Value = 100 * 0.95 = 95 (5% lower than preceding declination level)
    expect(onset!.value).toBeCloseTo(95, 0);
  });

  // --- F0 continuation rise ---

  it("inserts continuation rise at comma boundary", () => {
    const s0 = startOrder();
    const s1 = finiteOrder(1);
    const s2 = finiteOrder(2);
    const s3 = finiteOrder(3);
    const s4 = endOrder();

    const sequence = [
      {
        id: "p1",
        stream: "phone",
        phoneme: "AE",
        type: "vowel",
        stress: 1,
        duration: 170,
        params: { AV: 64, AVS: 0, F0_Factor: 1.0 },
        sync_left: s0,
        sync_right: s1,
        status: 1,
      },
      {
        id: "p2",
        stream: "phone",
        phoneme: "SIL",
        type: "silence",
        duration: 150,
        punctuationSymbol: ",",
        params: { AV: 0, AVS: 0, F0_Factor: 1.0 },
        sync_left: s1,
        sync_right: s2,
        status: 1,
      },
      {
        id: "p3",
        stream: "phone",
        phoneme: "IY",
        type: "vowel",
        stress: 0,
        duration: 100,
        params: { AV: 58, AVS: 0, F0_Factor: 1.0 },
        sync_left: s2,
        sync_right: s3,
        status: 1,
      },
      {
        id: "p4",
        stream: "phone",
        phoneme: "SIL",
        type: "silence",
        duration: 300,
        punctuationSymbol: ".",
        params: { AV: 0, AVS: 0, F0_Factor: 1.0 },
        sync_left: s3,
        sync_right: s4,
        status: 1,
      },
    ];

    const out = runDeclarativeFrontend(sequence, {
      phases: ["prosody", "finalize"],
      parameters: {
        policy: {
          f0: {
            base_hz: 110,
            continuation_rise_hz: 8,
          },
        },
      },
    });

    const points = out.filter((t) => t.stream === "f0");
    const continuation = points.find((p) => p.tag === "f0_continuation");
    expect(continuation).toBeTruthy();
    // The rise should be ~8 Hz above the previous F0 point
    // Previous F0 is the declination target on AE, which should be around base_hz
    expect(continuation!.value).toBeGreaterThan(110);
    expect(continuation!.value).toBeLessThanOrEqual(130);
  });

  it("resets declination baseline after punctuation boundary", () => {
    const s0 = startOrder();
    const s1 = finiteOrder(1);
    const s2 = finiteOrder(2);
    const s3 = finiteOrder(3);
    const s4 = endOrder();

    const sequence = [
      {
        id: "p1",
        stream: "phone",
        phoneme: "EH",
        type: "vowel",
        stress: 0,
        duration: 100,
        params: { AV: 60, AVS: 0, F0_Factor: 1.0 },
        sync_left: s0,
        sync_right: s1,
        status: 1,
      },
      {
        id: "p2",
        stream: "phone",
        phoneme: "SIL",
        type: "silence",
        duration: 150,
        punctuationSymbol: ",",
        params: { AV: 0, AVS: 0, F0_Factor: 1.0 },
        sync_left: s1,
        sync_right: s2,
        status: 1,
      },
      {
        id: "p3",
        stream: "phone",
        phoneme: "IY",
        type: "vowel",
        stress: 0,
        duration: 100,
        params: { AV: 60, AVS: 0, F0_Factor: 1.0 },
        sync_left: s2,
        sync_right: s3,
        status: 1,
      },
      {
        id: "p4",
        stream: "phone",
        phoneme: "SIL",
        type: "silence",
        duration: 300,
        punctuationSymbol: ".",
        params: { AV: 0, AVS: 0, F0_Factor: 1.0 },
        sync_left: s3,
        sync_right: s4,
        status: 1,
      },
    ];

    const out = runDeclarativeFrontend(sequence, {
      phases: ["prosody", "finalize"],
      parameters: {
        policy: {
          f0: {
            base_hz: 110,
            fall_rate_hz: 20,
          },
        },
      },
    });

    const declination = out
      .filter((t) => t.stream === "f0" && t.tag === "f0_declination")
      .sort((a, b) => Number(a.time) - Number(b.time));

    expect(declination.length).toBeGreaterThanOrEqual(2);
    const firstPhraseTarget = Number(declination[0].value);
    const secondPhraseTarget = Number(declination[1].value);
    expect(secondPhraseTarget).toBeGreaterThan(firstPhraseTarget - 2);
  });
});
