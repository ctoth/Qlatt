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
  it("applies a mild contour for qlatt-english", () => {
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
  });

  it("adds Ee declination and phrase-final Rd softening within a phrase", () => {
    const track = textToKlattTrack("hello world.", 110, 30, {
      frontendId: "dectalk-english",
    });
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

  it("keeps qlatt contour shallower than dectalk", () => {
    const phrase = "hello world.";
    const qlatt = voicedPhonemeFrames(textToKlattTrack(phrase));
    const dectalk = voicedPhonemeFrames(
      textToKlattTrack(phrase, 110, 30, { frontendId: "dectalk-english" })
    );
    expect(qlatt.length).toBeGreaterThan(0);
    expect(dectalk.length).toBeGreaterThan(0);

    const qFirst = qlatt[0];
    const qLast = qlatt[qlatt.length - 1];
    const dFirst = dectalk[0];
    const dLast = dectalk[dectalk.length - 1];

    const qEeSpan = qFirst.params.EePhraseDb - qLast.params.EePhraseDb;
    const dEeSpan = dFirst.params.EePhraseDb - dLast.params.EePhraseDb;
    const qRdSpan = qLast.params.RdPhraseOffset - qFirst.params.RdPhraseOffset;
    const dRdSpan = dLast.params.RdPhraseOffset - dFirst.params.RdPhraseOffset;

    expect(qEeSpan).toBeGreaterThan(0);
    expect(dEeSpan).toBeGreaterThan(0);
    expect(qRdSpan).toBeGreaterThan(0);
    expect(dRdSpan).toBeGreaterThan(0);
    expect(qEeSpan).toBeLessThan(dEeSpan);
    expect(qRdSpan).toBeLessThan(dRdSpan);
  });

  it("resets the Fant phrase contour at intonational phrase boundaries", () => {
    const track = textToKlattTrack("hello. world.", 110, 30, {
      frontendId: "dectalk-english",
    });
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
