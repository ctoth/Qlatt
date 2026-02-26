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
        base_f0: 110,
        question_rise_hz: 30,
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
        base_f0: 110,
        fall_rate_hz: 20,
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
