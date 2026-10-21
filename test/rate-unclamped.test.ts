import { afterEach, describe, expect, it, vi } from "vitest";
import * as hrg from "../src/declarative-frontend/hrg";
import * as rulepack from "../src/declarative-frontend/rule-pack";
import { browserRenderOptions } from "../src/rendering/backends/browser-runtime";
import { trackOnlyBackend } from "../src/rendering/backends/track-only";
import type { RenderRequest } from "../src/rendering/types";
import { textToKlattTrack, textToKlattTrackDetailed } from "../src/tts-frontend";
import type { KlattFrame } from "../src/tts-frontend-types";

// What limits a requested speaking rate, per frontend.
//
// qlatt-english: nothing clamps the request. Duration floors (Klatt 1976
// incompressible portion) are the only limit on compression, and they are
// projected by cited rules, not by a ceiling on the request.
//
// dectalk-english: the rate is DECtalk's words per minute and is held to
// DECtalk's own limits, 50 and 550 (policy.rate.words_per_minute; the mapping
// and its diagnostics are test/dectalk-speaking-rate.test.ts).

const PHRASE = "The quick brown fox jumps over the lazy dog.";

afterEach(() => vi.restoreAllMocks());

// Default selection adds provenance, so unrelated downstream decision IDs shift.
function frameValues(track: KlattFrame[]) {
  return track.map(({ provenance: _provenance, ...frame }) => frame);
}

function ratePolicy(spec: rulepack.CompiledRulepack) {
  return (
    spec.parameters.policy as {
      rate: Record<string, { value: unknown; citations: string[] }>;
    }
  ).rate;
}

describe("frontend rate defaults", () => {
  it.each(["qlatt-english", "qlatt-beauty", "dectalk-english"])(
    "%s uses a changed cited default and preserves explicit overrides",
    (frontendId) => {
      const spec = structuredClone(rulepack.loadBundledRulepackSpec(frontendId));
      ratePolicy(spec).default.value = 1.5;
      vi.spyOn(rulepack, "loadBundledRulepackSpec").mockReturnValue(spec);
      const implicit = textToKlattTrackDetailed("hello world", undefined, undefined, {
        frontendId,
      });
      const explicit = textToKlattTrack("hello world", undefined, undefined, {
        frontendId,
        rate: 1.5,
      });
      expect(frameValues(implicit.track)).toEqual(frameValues(explicit));
      expect(frameValues(implicit.track)).not.toEqual(
        frameValues(textToKlattTrack("hello world", undefined, undefined, { frontendId, rate: 1 })),
      );
      expect(
        implicit.utterance.provenance
          .getDecisions()
          .find((entry) => entry.type === "speaking_rate_default"),
      ).toMatchObject({
        reason: "Selected policy.rate.default = 1.5",
        citations: ratePolicy(spec).default.citations,
      });
      if (frontendId === "dectalk-english") {
        expect(
          frameValues(
            textToKlattTrack("[:ra 180] hello world", undefined, undefined, { frontendId }),
          ),
        ).toEqual(
          frameValues(
            textToKlattTrack("hello world", undefined, undefined, { frontendId, rate: 1 }),
          ),
        );
      }
    },
  );

  it.each([undefined, 0, -1, Number.NaN, Number.POSITIVE_INFINITY])(
    "rejects invalid default %s even with an explicit override",
    (value) => {
      const spec = structuredClone(rulepack.loadBundledRulepackSpec("qlatt-english"));
      ratePolicy(spec).default.value = value;
      vi.spyOn(rulepack, "loadBundledRulepackSpec").mockReturnValue(spec);
      for (const rate of [undefined, 1]) {
        expect(() => textToKlattTrack("hello", undefined, undefined, { rate })).toThrow(
          "E_POLICY_REQUIRED",
        );
      }
    },
  );

  it("requires a cited default declaration", () => {
    const spec = structuredClone(rulepack.loadBundledRulepackSpec("qlatt-english"));
    vi.spyOn(rulepack, "loadBundledRulepackSpec").mockReturnValue(spec);
    ratePolicy(spec).default.citations = [];
    expect(() => textToKlattTrack("hello")).toThrow("E_POLICY_REQUIRED");
    delete ratePolicy(spec).default;
    expect(() => textToKlattTrack("hello")).toThrow("E_POLICY_REQUIRED");
  });
});

describe("frontend transition defaults", () => {
  it("preserves omission through rendering request adapters", async () => {
    const request: RenderRequest = {
      repoRoot: process.cwd(),
      phrase: "hello world",
      frontendId: "qlatt-english",
      experimentId: "klatt80-baseline",
      engine: "runtime",
      sampleRate: 22050,
      leadTime: 0,
      tailTime: 0,
      includeTrack: true,
      noiseSeed: 1,
      persistWav: false,
      allowBrowserRender: false,
      renderHost: "auto",
    };
    const spec = structuredClone(rulepack.loadBundledRulepackSpec(request.frontendId));
    ratePolicy(spec).default.value = 1.5;
    hrg.readLowerOptions(spec.output.lowering).transitions.default_transition_ms.value = 60;
    vi.spyOn(rulepack, "loadBundledRulepackSpec").mockReturnValue(spec);
    expect(browserRenderOptions(request).transitionMs).toBeUndefined();
    expect(browserRenderOptions(request).rate).toBeUndefined();
    const result = await trackOnlyBackend.render(request);
    expect(result.transitionMs).toBeUndefined();
    expect(result.rate).toBeUndefined();
    expect(frameValues(result.track as KlattFrame[])).toEqual(
      frameValues(textToKlattTrack(request.phrase, undefined, 60, { rate: 1.5 })),
    );
  });

  it.each(["qlatt-english", "qlatt-beauty"])(
    "%s uses its cited default only when the override is omitted",
    (frontendId) => {
      const spec = structuredClone(rulepack.loadBundledRulepackSpec(frontendId));
      const policy = hrg.readLowerOptions(spec.output.lowering);
      // Deliberately differs from the bundled 30 ms to expose a masked default.
      policy.transitions.default_transition_ms.value = 60;
      vi.spyOn(rulepack, "loadBundledRulepackSpec").mockReturnValue(spec);
      const lower = vi.spyOn(hrg, "lowerToFrames");
      const options = { frontendId, rate: 2 };
      const implicit = textToKlattTrackDetailed("hello world", 110, undefined, options).track;
      expect(lower.mock.lastCall?.[1].transitions.default_transition_ms).toEqual({
        ...policy.transitions.default_transition_ms,
        value: 30,
      });
      expect(textToKlattTrack("hello world", 110, undefined, options)).toEqual(implicit);
      expect(textToKlattTrack("hello world", 110, 60, options)).toEqual(implicit);
      textToKlattTrack("hello world", 110, 10, options);
      expect(lower.mock.lastCall?.[1].transitions.default_transition_ms.value).toBe(5);
      textToKlattTrack("hello world", 110, 0, options);
      expect(lower.mock.lastCall?.[1].transitions.default_transition_ms.value).toBe(0);
    },
  );

  it.each([Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY])(
    "still rejects an explicit nonfinite transition override %s",
    (transitionMs) => {
      expect(() => textToKlattTrack("hello", 110, transitionMs)).toThrow(
        "E_HRG_LOWER_POLICY_NUMBER",
      );
    },
  );

  it("retains the bundled default output", () => {
    expect(textToKlattTrack("hello world")).toEqual(textToKlattTrack("hello world", undefined, 30));
  });
});

function totalDurationMs(track: KlattFrame[]): number {
  if (track.length === 0) return 0;
  return (track[track.length - 1].time - track[0].time) * 1000;
}

function render(rate: number, frontendId = "qlatt-english"): KlattFrame[] {
  return textToKlattTrack(PHRASE, 110, 30, { frontendId, rate });
}

describe("speaking rate limits", () => {
  it("qlatt-english renders at 4x and 8x and keeps getting shorter until the floors hold", () => {
    const rates = [0.25, 0.5, 1, 2, 4, 8];
    const durations = rates.map((rate) => totalDurationMs(render(rate)));
    for (let index = 1; index < durations.length; index += 1) {
      expect(durations[index]).toBeLessThanOrEqual(durations[index - 1]);
    }
    // 4x must actually be faster than 2x; the old ceiling made them identical.
    expect(durations[4]).toBeLessThan(durations[3]);
    // 0.25x must actually be slower than 0.5x; the old floor made them identical.
    expect(durations[0]).toBeGreaterThan(durations[1]);
    for (const duration of durations) expect(duration).toBeGreaterThan(0);
  });

  it("dectalk-english at 4x is DECtalk's fastest rate, still faster than 2x", () => {
    // 4x is 720 words per minute; DECtalk allows 550. 2x is 360.
    const fastest = render(4, "dectalk-english");
    expect(fastest).toEqual(render(550 / 180, "dectalk-english"));
    expect(render(8, "dectalk-english")).toEqual(fastest);
    expect(totalDurationMs(fastest)).toBeLessThan(totalDurationMs(render(2, "dectalk-english")));
  });

  it("qlatt-english keeps vowel formants between the target and schwa at extreme rates", () => {
    const detailed = (rate: number) =>
      textToKlattTrackDetailed(PHRASE, 110, 30, { frontendId: "qlatt-english", rate });
    const base = detailed(1).track;
    const fast = detailed(8).track;
    const schwaF1 = 500;
    const schwaF2 = 1500;
    const vowelFrames = (track: KlattFrame[]) =>
      track.filter((frame) => (frame.params.AV ?? 0) > 0 && (frame.params.F1 ?? 0) > 0);
    const baseVowels = vowelFrames(base);
    const fastVowels = vowelFrames(fast);
    expect(baseVowels.length).toBeGreaterThan(0);
    expect(fastVowels.length).toBeGreaterThan(0);
    const baseMaxF1 = Math.max(...baseVowels.map((frame) => frame.params.F1 as number));
    const baseMinF1 = Math.min(...baseVowels.map((frame) => frame.params.F1 as number));
    const baseMaxF2 = Math.max(...baseVowels.map((frame) => frame.params.F2 as number));
    const baseMinF2 = Math.min(...baseVowels.map((frame) => frame.params.F2 as number));
    for (const frame of fastVowels) {
      const f1 = frame.params.F1 as number;
      const f2 = frame.params.F2 as number;
      // Undershoot moves toward schwa and never past it, so the fast range is
      // inside the hull of the base range and the schwa target.
      expect(f1).toBeGreaterThanOrEqual(Math.min(baseMinF1, schwaF1) - 1);
      expect(f1).toBeLessThanOrEqual(Math.max(baseMaxF1, schwaF1) + 1);
      expect(f2).toBeGreaterThanOrEqual(Math.min(baseMinF2, schwaF2) - 1);
      expect(f2).toBeLessThanOrEqual(Math.max(baseMaxF2, schwaF2) + 1);
    }
  });

  it("rejects a rate that is not a positive finite number", () => {
    for (const rate of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(() => render(rate)).toThrow(/E_RATE_INVALID/);
    }
  });

  it("leaves the default rate untouched", () => {
    const explicit = render(1);
    const implicit = textToKlattTrack(PHRASE, 110, 30, { frontendId: "qlatt-english" });
    expect(frameValues(implicit)).toEqual(frameValues(explicit));
  });
});
