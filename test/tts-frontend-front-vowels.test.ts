import { describe, expect, it } from "vitest";
import { textToKlattTrack } from "../src/tts-frontend";

function maxParam(frames: Array<{ params?: Record<string, number> }>, key: string): number {
  if (frames.length === 0) return 0;
  return Math.max(...frames.map((frame) => Number(frame.params?.[key] ?? 0)));
}

describe("tts frontend unstressed front vowels", () => {
  it("keeps unstressed IY bright enough in lexical words", () => {
    const track = textToKlattTrack("citicorp alleyoop championship", 110);
    const iyFrames = track.filter((frame) => String(frame.phoneme ?? "") === "IY");

    expect(iyFrames.length).toBeGreaterThan(0);
    expect(maxParam(iyFrames, "F2")).toBeGreaterThanOrEqual(2190);
  }, 15_000);
});
