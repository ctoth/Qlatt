import { describe, expect, it } from "vitest";
import { summarizeTrackMetrics } from "../../src/analysis/track-metrics";

describe("summarizeTrackMetrics", () => {
  it("computes voiced, silence, and unvoiced segment metrics", () => {
    const metrics = summarizeTrackMetrics([
      { time: 0.0, phoneme: "SIL", params: { AV: 0, AVS: 0, F0: 0 } },
      { time: 0.1, phoneme: "AA", params: { AV: 60, AVS: -70, F0: 100, F1: 700, F2: 1200, B1: 100, AH: 0 } },
      { time: 0.2, phoneme: "AA", params: { AV: 60, AVS: -70, F0: 110, F1: 700, F2: 1200, B1: 100, AH: 1 } },
      { time: 0.3, phoneme: "S", params: { AV: 0, AVS: -70, F0: 0 } },
      { time: 0.4, phoneme: "SIL", params: { AV: 0, AVS: -70, F0: 0 } },
    ]);

    expect(metrics.events).toBe(5);
    expect(metrics.totalTime).toBeCloseTo(0.4, 8);
    expect(metrics.voicedEvents).toBe(2);
    expect(metrics.voicedTime).toBeCloseTo(0.2, 8);
    expect(metrics.silenceTime).toBeCloseTo(0.1, 8);
    expect(metrics.unvoicedNonsilenceTime).toBeCloseTo(0.1, 8);
    expect(metrics.voicedRatio).toBeCloseTo(0.5, 8);
    expect(metrics.f0Min).toBeCloseTo(100, 8);
    expect(metrics.f0Max).toBeCloseTo(110, 8);
    expect(metrics.f0Mean).toBeCloseTo(105, 8);
    expect(metrics.f0Span).toBeCloseTo(10, 8);
    expect(metrics.f1MeanVoiced).toBeCloseTo(700, 8);
    expect(metrics.f2MeanVoiced).toBeCloseTo(1200, 8);
    expect(metrics.b1MeanVoiced).toBeCloseTo(100, 8);
    expect(metrics.avMeanVoiced).toBeCloseTo(60, 8);
    expect(metrics.ahMeanVoiced).toBeCloseTo(0.5, 8);
  });

  it("returns zero defaults for empty tracks", () => {
    const metrics = summarizeTrackMetrics([]);
    expect(metrics.events).toBe(0);
    expect(metrics.totalTime).toBe(0);
    expect(metrics.voicedEvents).toBe(0);
    expect(metrics.voicedTime).toBe(0);
    expect(metrics.silenceTime).toBe(0);
    expect(metrics.unvoicedNonsilenceTime).toBe(0);
    expect(metrics.voicedRatio).toBe(0);
    expect(metrics.f0Min).toBe(0);
    expect(metrics.f0Max).toBe(0);
    expect(metrics.f0Mean).toBe(0);
    expect(metrics.f0Span).toBe(0);
    expect(metrics.f1MeanVoiced).toBe(0);
    expect(metrics.f2MeanVoiced).toBe(0);
    expect(metrics.b1MeanVoiced).toBe(0);
    expect(metrics.avMeanVoiced).toBe(0);
    expect(metrics.ahMeanVoiced).toBe(0);
  });
});
