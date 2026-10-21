import { describe, expect, it } from "vitest";
import { summarizeTrackMetrics } from "../../src/analysis/track-metrics";
import { createDiagnostics } from "../../src/diagnostics";
import { loadExperimentConfig } from "../../src/experiments/load-experiment-config";
import { summarizeTrack as summarizeRenderTrack } from "../../src/rendering/track-summary";
import { summarizeTrack } from "../../src/track-analysis";

const policy = (await loadExperimentConfig("klatt80-baseline")).semantics.analysis!.metrics!;

describe("summarizeTrackMetrics", () => {
  it("computes voiced, silence, and unvoiced segment metrics", () => {
    const track = [
      { time: 0.0, phoneme: "SIL", params: { AV: 0, AVS: 0, F0: 0 } },
      {
        time: 0.1,
        phoneme: "AA",
        params: { AV: 60, AVS: -70, F0: 100, F1: 700, F2: 1200, B1: 100, AH: 0 },
      },
      {
        time: 0.2,
        phoneme: "AA",
        params: { AV: 60, AVS: -70, F0: 110, F1: 700, F2: 1200, B1: 100, AH: 1 },
      },
      { time: 0.3, phoneme: "S", params: { AV: 0, AVS: -70, F0: 0 } },
      { time: 0.4, phoneme: "SIL", params: { AV: 0, AVS: -70, F0: 0 } },
    ];
    const metrics = summarizeTrackMetrics(track, policy);

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
    const metrics = summarizeTrackMetrics([], policy);
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

  it("shares AV and AVS classification and ignores missing/nonfinite amplitudes", () => {
    const track = [
      { time: 0, params: { AV: 60, AVS: 0 } },
      { time: 1, params: { AV: 0, AVS: 50 } },
      { time: 3, params: { AV: Infinity, AVS: NaN } },
      { time: 4, params: { AV: -Infinity } },
      { time: 5 },
      { time: 6, params: { AV: -1, AVS: 0 } },
    ];
    const metrics = summarizeTrackMetrics(track, policy);
    expect(metrics.voicedEvents).toBe(2);
    expect(metrics.voicedTime).toBe(3);
    expect(metrics.unvoicedNonsilenceTime).toBe(3);
    expect(metrics.voicedRatio).toBe(0.5);
    expect(summarizeTrack(track, policy).voicedEvents).toBe(metrics.voicedEvents);
  });

  it("uses renamed voicing and silence fields with unchanged duration weighting", () => {
    const selected = { ...policy, voicing_params: ["voice"], silence_phoneme: "QUIET" };
    const track = [
      { time: 0, phoneme: "QUIET", params: { voice: 0, AV: 60 } },
      { time: 1, phoneme: "AA", params: { voice: 12, AV: 0 } },
      { time: 3, phoneme: "SIL", params: { voice: 0, AV: 0 } },
      { time: 4, phoneme: "QUIET", params: { voice: 0, AV: 0 } },
    ];
    const metrics = summarizeTrackMetrics(track, selected);
    expect(metrics.voicedTime).toBe(2);
    expect(metrics.silenceTime).toBe(1);
    expect(metrics.unvoicedNonsilenceTime).toBe(1);
    expect(summarizeTrack(track, selected).voicedEvents).toBe(1);
    const control = summarizeTrackMetrics(track, policy);
    expect(control.voicedTime).toBe(1);
    expect(control.silenceTime).toBe(1);
    expect(control.unvoicedNonsilenceTime).toBe(2);
  });

  it("uses inherited and independent experiment declarations without assigning one to VTM", async () => {
    for (const id of ["test-inherit", "dectalk-english", "qlatt-beauty", "klsyn88"]) {
      const selected = (await loadExperimentConfig(id)).semantics.analysis!.metrics!;
      expect(selected.citations[0]).toContain("engineering convention");
      expect(summarizeTrackMetrics([{ time: 0, params: { AVS: 1 } }], selected).voicedEvents).toBe(1);
    }
    const vtm = await loadExperimentConfig("dectalk-vtm");
    expect(vtm.semantics.analysis).toBeUndefined();
    const diagnostics = createDiagnostics();
    const track = [{ time: 0, params: { F0: 110, PS: 800 } }, { time: 1 }];
    expect(summarizeRenderTrack(track, undefined, diagnostics, "dectalk-vtm")).toBeUndefined();
    expect(diagnostics.getEntries()).toEqual([
      expect.objectContaining({
        level: "info",
        code: "I_TRACK_METRICS_UNAVAILABLE",
        data: { experimentId: "dectalk-vtm" },
      }),
    ]);
    const controlDiagnostics = createDiagnostics();
    expect(summarizeRenderTrack(track, policy, controlDiagnostics, "klatt80-baseline")).toMatchObject({
      voicedEvents: 0,
      totalTime: 1,
    });
    expect(controlDiagnostics.getEntries()).toEqual([]);
  });
});
