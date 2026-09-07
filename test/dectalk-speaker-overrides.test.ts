import { afterAll, describe, expect, it, vi } from "vitest";
import { textToKlattTrackDetailed } from "../src/tts-frontend";

const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
afterAll(() => warn.mockRestore());

describe("DECtalk speaker profile overrides", () => {
  // ph_vset.c maps AP to (AP - 12)*10, or (AP - 65)*10 for Frank.
  // Both branches therefore shift the rendered pitch by the requested Hz delta.
  it.each(["paul", "frank"])("applies requested base pitch to %s's rendered contour", (speaker) => {
    const baseline = textToKlattTrackDetailed("hello.", undefined, 30, {
      frontendId: "dectalk-english",
      speaker,
    });
    const requestedPitch = baseline.resolvedSpeaker.base_f0_hz + 40;
    const raised = textToKlattTrackDetailed("hello.", requestedPitch, 30, {
      frontendId: "dectalk-english",
      speaker,
    });
    expect(raised.resolvedSpeaker.base_f0_hz).toBe(requestedPitch);
    expect(raised.track.length).toBe(baseline.track.length);
    const deltas: number[] = [];
    for (let index = 0; index < baseline.track.length; index++) {
      const before = baseline.track[index].params.F0;
      const after = raised.track[index].params.F0;
      if (before > 50 && after > 0 && after < 500) deltas.push(after - before);
    }
    expect(deltas.length).toBeGreaterThan(0);
    expect(Math.min(...deltas)).toBeCloseTo(40, 6);
    expect(Math.max(...deltas)).toBeCloseTo(40, 6);
  });

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
