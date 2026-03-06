import { describe, expect, it } from "vitest";
import { analyzeTrackGains } from "../../src/track-analysis";
import { textToKlattTrack } from "../../src/tts-frontend";

describe("analyzeTrackGains", () => {
  it("masterGain is nonzero for voiced event with GO=47", () => {
    const result = analyzeTrackGains(
      [{ time: 0, phoneme: "AA", params: { AV: 60, GO: 47, F0: 100, F1: 700, F2: 1200, F3: 2500 } }],
      {},
    );
    expect(result).not.toBeNull();
    expect(result!.ranges.masterGain).not.toBeNull();
    expect(result!.ranges.masterGain!.max).toBeGreaterThan(0);
  });

  it("voiceGain includes GO in computation", () => {
    const result = analyzeTrackGains(
      [{ time: 0, phoneme: "AA", params: { AV: 62, GO: 47, F0: 100, F1: 700, F2: 1200, F3: 2500 } }],
      {},
    );
    expect(result).not.toBeNull();
    // dbToLinear(47 + 62 + (-119)) = dbToLinear(-10) ≈ 0.316
    expect(result!.ranges.voiceGain!.max).toBeGreaterThan(0.1);
  });

  it("aspGain includes GO in computation", () => {
    const result = analyzeTrackGains(
      [{ time: 0, phoneme: "HH", params: { AH: 40, GO: 47, F0: 100, F1: 700, F2: 1200, F3: 2500 } }],
      {},
    );
    expect(result).not.toBeNull();
    // dbToLinear(47 + 40 + (-134)) = dbToLinear(-47) — still nonzero (> -72 floor)
    expect(result!.ranges.aspGain!.max).toBeGreaterThan(0);
  });

  it("fricGain includes GO in computation", () => {
    const result = analyzeTrackGains(
      [{ time: 0, phoneme: "S", params: { AF: 55, GO: 47, SW: 1, F0: 0, F1: 300, F2: 1500, F3: 2500 } }],
      {},
    );
    expect(result).not.toBeNull();
    // dbToLinear(47 + 55 + (-119)) = dbToLinear(-17) — nonzero
    expect(result!.ranges.fricGain!.max).toBeGreaterThan(0);
  });

  it("returns null for empty track", () => {
    const result = analyzeTrackGains([], {});
    expect(result).toBeNull();
  });

  it("coerces bigint-valued params for diagnostics", () => {
    const result = analyzeTrackGains(
      [{ time: 0, phoneme: "S", params: { AF: 55n, GO: 47n, SW: 1n, F1: 300n, F2: 1500n, F3: 2500n } }],
      { parallelGainScale: 1n },
    );
    expect(result).not.toBeNull();
    expect(result!.ranges.fricGain!.max).toBeGreaterThan(0);
  });
});

describe("HH aspiration in track", () => {
  it("HH phoneme has AH > 0 in track output", () => {
    const track = textToKlattTrack("he", 110);
    const hhEvent = track.find((e: any) => e.phoneme === "HH");
    expect(hhEvent).toBeDefined();
    expect(hhEvent!.params.AH).toBeGreaterThan(0);
  });
});

describe("F0 declination", () => {
  it("ToBI downstep produces F0 peaks above baseline with gentle inter-accent sag", () => {
    // Pierrehumbert 1980 / Ladd 2008: ToBI model uses accent-based downstep
    // instead of global exponential declination. F0 peaks descend via k^n.
    // Unaccented segments sag gently (0.98 * prev) but floor at base_hz.
    const track = textToKlattTrack("hello world", 110);
    const voiced = track.filter((e: any) => e.params.F0 > 0);
    const minF0 = Math.min(...voiced.map((e: any) => e.params.F0));
    const maxF0 = Math.max(...voiced.map((e: any) => e.params.F0));
    // F0 should not drop below baseline (sag floors at base_hz)
    expect(minF0).toBeGreaterThanOrEqual(105); // allow small tolerance
    // H* accent peaks should be above baseline
    expect(maxF0).toBeGreaterThan(130);
  });
});
