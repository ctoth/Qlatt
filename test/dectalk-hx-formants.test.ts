import { describe, expect, it } from "vitest";
import { textToKlattTrackDetailed } from "../src/tts-frontend";

describe("DECtalk HX successor-conditioned formants", () => {
  it("carries the following vowel's F1-F3 through initial silence and HH", () => {
    const { track } = textToKlattTrackDetailed("hello.", 110, 30, {
      frontendId: "dectalk-english",
      speaker: "paul",
    });
    const initial = track[0];
    const hh = track.find((frame) => frame.phoneme === "HH");

    expect(initial?.params.F1).toBe(560);
    expect(initial?.params.F2).toBe(1670);
    expect(initial?.params.F3).toBe(2500);
    expect(hh?.params.F1).toBe(560);
    expect(hh?.params.F2).toBe(1670);
    expect(hh?.params.F3).toBe(2500);
  });
});
