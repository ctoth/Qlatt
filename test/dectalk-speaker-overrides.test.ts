import { afterAll, describe, expect, it, vi } from "vitest";
import { textToKlattTrackDetailed } from "../src/tts-frontend";

const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
afterAll(() => warn.mockRestore());

describe("DECtalk speaker profile overrides", () => {
  it("preserves the default voice when given an empty override", () => {
    const baseline = textToKlattTrackDetailed("hello.", undefined, 30, {
      frontendId: "dectalk-english",
    });
    const overridden = textToKlattTrackDetailed("hello.", undefined, 30, {
      frontendId: "dectalk-english",
      speaker: {},
    });
    expect(overridden.resolvedSpeaker.base_f0_hz).toBe(baseline.resolvedSpeaker.base_f0_hz);
    expect(overridden.speakerParams?.F5).toBe(baseline.speakerParams?.F5);
    expect(JSON.stringify(overridden.track) === JSON.stringify(baseline.track)).toBe(true);
  });

  it("overrides the requested profile field while retaining default voice parameters", () => {
    const baseline = textToKlattTrackDetailed("hello.", undefined, 30, {
      frontendId: "dectalk-english",
    });
    const overridden = textToKlattTrackDetailed("hello.", undefined, 30, {
      frontendId: "dectalk-english",
      speaker: { formant_scale: 1.1 },
    });
    expect(overridden.resolvedSpeaker.formant_scale).toBe(1.1);
    expect(overridden.resolvedSpeaker.base_f0_hz).toBe(baseline.resolvedSpeaker.base_f0_hz);
    expect(overridden.speakerParams?.F5).toBe(baseline.speakerParams?.F5);
    expect(overridden.speakerParams?.f0_lp_filter_alpha).toBe(
      baseline.speakerParams?.f0_lp_filter_alpha,
    );
  });
});
