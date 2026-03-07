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

    // Klatt 1980 Table III: TH AF=60 (inventory uses 40 per Shadle 1985 scaling)
    expect(thAf).toBeGreaterThanOrEqual(38);
    expect(dhAf).toBeGreaterThanOrEqual(28);
    // Klatt 1980 Table III: dentals have A1-A5=0, A6=28, AB=48
    expect(thA6).toBeGreaterThanOrEqual(28);
    expect(dhA6).toBeGreaterThanOrEqual(28);
    expect(thAB).toBeGreaterThanOrEqual(48);
    expect(dhAB).toBeGreaterThanOrEqual(48);
    expect(thAf).toBeGreaterThan(dhAf);
  });
});
