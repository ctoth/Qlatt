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
    const thA5 = maxParam(thFrames, "A5");
    const dhA5 = maxParam(dhFrames, "A5");

    expect(thAf).toBeGreaterThanOrEqual(54);
    expect(dhAf).toBeGreaterThanOrEqual(44);
    expect(thA5).toBeGreaterThanOrEqual(40);
    expect(dhA5).toBeGreaterThanOrEqual(38);
    expect(thAf).toBeGreaterThan(dhAf);
  });
});
