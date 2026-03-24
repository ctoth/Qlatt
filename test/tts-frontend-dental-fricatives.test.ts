import { describe, expect, it } from "vitest";
import { textToKlattTrack } from "../src/tts-frontend";

function maxParam(frames: Array<{ params?: Record<string, number> }>, key: string): number {
  if (frames.length === 0) return 0;
  return Math.max(...frames.map((frame) => Number(frame.params?.[key] ?? 0)));
}

describe("tts frontend dental fricatives", () => {
  it("keeps TH/DH frication energy audible in connected speech", () => {
    const track = textToKlattTrack("Thin thieves thought that they thrilled.", 110);

    const thFrames = track.filter((frame) => frame.phoneme === "TH");
    const dhFrames = track.filter((frame) => frame.phoneme === "DH");

    expect(thFrames.length).toBeGreaterThan(0);
    expect(dhFrames.length).toBeGreaterThan(0);
    expect(thFrames.every((frame) => Number(frame.params?.SW) === 1)).toBe(true);
    expect(dhFrames.every((frame) => Number(frame.params?.SW) === 1)).toBe(true);

    const thAf = maxParam(thFrames, "AF");
    const dhAf = maxParam(dhFrames, "AF");
    const thA6 = maxParam(thFrames, "A6");
    const dhA6 = maxParam(dhFrames, "A6");
    const thAB = maxParam(thFrames, "AB");
    const dhAB = maxParam(dhFrames, "AB");

    // Allen et al. 1987 lists TH in the 60-90 range and DH in the 30-50 range;
    // our inventory is scaled down, but dentals still should not sit on the
    // diagnostics floor in connected speech.
    expect(thAf).toBeGreaterThanOrEqual(44);
    expect(dhAf).toBeGreaterThanOrEqual(34);
    // Stevens 1998: voiced fricative noise is about 7 dB below voiceless,
    // so the DH/TH gap should stay closer to that relationship than the
    // current 10 dB inventory split.
    expect(thAf - dhAf).toBeLessThanOrEqual(8);
    // Klatt 1980 Table III: dentals have A1-A5=0, A6=28, AB=48
    expect(thA6).toBeGreaterThanOrEqual(28);
    expect(dhA6).toBeGreaterThanOrEqual(28);
    expect(thAB).toBeGreaterThanOrEqual(48);
    expect(dhAB).toBeGreaterThanOrEqual(48);
    expect(thAf).toBeGreaterThan(dhAf);
  });

  it("keeps coda TH from collapsing in lexical words", () => {
    const track = textToKlattTrack("authorship", 110);
    const thFrames = track.filter((frame) => frame.word === "authorship" && frame.phoneme === "TH");

    expect(thFrames.length).toBeGreaterThan(0);
    expect(maxParam(thFrames, "AF")).toBeGreaterThanOrEqual(48);
    expect(maxParam(thFrames, "AB")).toBeGreaterThanOrEqual(52);
  });
});
