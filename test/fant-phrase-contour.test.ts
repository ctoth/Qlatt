import { afterAll, describe, expect, it, vi } from "vitest";
import { textToKlattTrack } from "../src/tts-frontend";
import type { KlattFrame } from "../src/tts-frontend-types";

const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
afterAll(() => warnSpy.mockRestore());

function voicedPhonemeFrames(track: KlattFrame[]): KlattFrame[] {
  return track.filter(
    (frame) =>
      frame.phoneme != null &&
      frame.phoneme !== "SIL" &&
      Number(frame.params?.F0) > 0,
  );
}

describe("Fant 1997 phrase contour", () => {
  it("adds Ee declination and phrase-final Rd softening within a phrase", () => {
    const track = textToKlattTrack("hello world.");
    const frames = voicedPhonemeFrames(track);
    expect(frames.length).toBeGreaterThan(2);

    const first = frames[0];
    const last = frames[frames.length - 1];

    expect(typeof first.params.EePhraseDb).toBe("number");
    expect(typeof last.params.EePhraseDb).toBe("number");
    expect(typeof first.params.RdPhraseOffset).toBe("number");
    expect(typeof last.params.RdPhraseOffset).toBe("number");

    expect(first.params.EePhraseDb).toBeGreaterThan(last.params.EePhraseDb);
    expect(last.params.RdPhraseOffset).toBeGreaterThanOrEqual(first.params.RdPhraseOffset);
    expect(last.params.RdPhraseOffset).toBeGreaterThan(0);
  });

  it("resets the Fant phrase contour at intonational phrase boundaries", () => {
    const track = textToKlattTrack("hello. world.");
    const frames = voicedPhonemeFrames(track);
    const helloFrames = frames.filter((frame) => frame.word === "hello");
    const worldFrames = frames.filter((frame) => frame.word === "world");

    expect(helloFrames.length).toBeGreaterThan(0);
    expect(worldFrames.length).toBeGreaterThan(0);

    const firstPhraseEnd = helloFrames[helloFrames.length - 1];
    const secondPhraseStart = worldFrames[0];

    expect(secondPhraseStart.params.EePhraseDb).toBeGreaterThan(firstPhraseEnd.params.EePhraseDb);
    expect(secondPhraseStart.params.RdPhraseOffset).toBeLessThan(firstPhraseEnd.params.RdPhraseOffset);
  });
});
