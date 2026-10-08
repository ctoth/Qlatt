import { describe, expect, it } from "vitest";
import { textToKlattTrackDetailed } from "../src/tts-frontend";

// HX has no formant targets of its own (-1 in us_maltar): gettar() gives it,
// and the clause's first silence before it, the first value of the vowel
// after (EH: 560, 1670, 2500), and phdraw() then moves from there. The
// expected values are DECtalk's packets 0 and 4 of "Hello world."
// (test/fixtures/dectalk-oracle/dectalk-us-v1.frames.json), which begins as
// "hello." does: packet 0 is the silence, packet 4 the first of the HX.
describe("DECtalk HX successor-conditioned formants", () => {
  it("carries the following vowel's F1-F3 through initial silence and HH", () => {
    const { track } = textToKlattTrackDetailed("hello.", 110, 30, {
      frontendId: "dectalk-english",
      speaker: "paul",
    });
    const initial = track[0];
    const hh = track.find((frame) => frame.phoneme === "HH");

    expect(initial?.params.F1).toBe(561);
    expect(initial?.params.F2).toBe(1662);
    expect(initial?.params.F3).toBe(2510);
    expect(hh?.params.F1).toBe(581);
    expect(hh?.params.F2).toBe(1628);
    expect(hh?.params.F3).toBe(2560);
  });
});
