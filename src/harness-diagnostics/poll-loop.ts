// Poll loop — single setInterval that reads all taps, evaluates checks,
// formats output, and delivers results via callback.

import type { DiagConfig, CheckResult, RunInfo } from "./types";
import type { DisplayState } from "./display-formatter";
import type { TapManager } from "./tap-manager";
import type { AcrossPlaysAccumulator } from "./across-plays";
import { resolveTimingSnapshot } from "./timing-context";
import { evaluateCheck, createCheckState, type CheckState } from "./check-evaluator";
import { readRms, readPeak, readFftPeakFreq, readBandEnergy } from "./measurement";
import { formatDisplay } from "./display-formatter";
import type { ParamRangeAccum } from "./types";

export interface PollLoopOptions {
  config: DiagConfig;
  tapManager: TapManager;
  acrossPlays: AcrossPlaysAccumulator;
  getRunInfo: () => RunInfo | null;
  getRunStartTime: () => number;
  getAudioTime: () => number;
  getSampleRate: () => number;
  getDisplayState: () => DisplayState;
  onResults: (results: Map<string, CheckResult>, output: string) => void;
}

export class PollLoop {
  private timer: ReturnType<typeof setInterval> | null = null;
  private checkStates: Map<string, CheckState>;
  private lastActiveResults: Map<string, CheckResult> = new Map();
  private trackAnalysisResults: Map<string, CheckResult> = new Map();
  private config: DiagConfig;
  private tapManager: TapManager;
  private acrossPlays: AcrossPlaysAccumulator;
  private meterValues: Map<string, { rms: number; peak: number }> = new Map();
  private meterMax: Map<string, { rms: number; peak: number; rmsTime?: number; peakTime?: number; rmsPhoneme?: string; peakPhoneme?: string }> = new Map();
  private getRunInfo: () => RunInfo | null;
  private getRunStartTime: () => number;
  private getAudioTime: () => number;
  private getSampleRate: () => number;
  private getDisplayState: () => DisplayState;
  private onResults: (results: Map<string, CheckResult>, output: string) => void;

  constructor(options: PollLoopOptions) {
    this.config = options.config;
    this.tapManager = options.tapManager;
    this.acrossPlays = options.acrossPlays;
    this.getRunInfo = options.getRunInfo;
    this.getRunStartTime = options.getRunStartTime;
    this.getAudioTime = options.getAudioTime;
    this.getSampleRate = options.getSampleRate;
    this.getDisplayState = options.getDisplayState;
    this.onResults = options.onResults;

    // Initialize check states
    this.checkStates = new Map();
    for (const checkName of Object.keys(this.config.checks)) {
      this.checkStates.set(checkName, createCheckState());
    }
  }

  start(): void {
    if (this.timer !== null) return;
    this.timer = setInterval(() => this.tick(), this.config.poll.interval_ms);
  }

  stop(): void {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  /** Set static track_analysis results (computed once in onPlayStart). */
  setTrackAnalysisResults(results: Map<string, CheckResult>): void {
    this.trackAnalysisResults = results;
  }

  setParamRange(checkName: string, paramRange: ParamRangeAccum | null): void {
    const state = this.checkStates.get(checkName);
    if (!state) return;
    state.paramRange = paramRange ? { ...paramRange } : null;
  }

  /** Reset per-play check state. */
  resetPerPlay(): void {
    this.meterValues.clear();
    this.meterMax.clear();
    for (const state of this.checkStates.values()) {
      state.collected = [];
      state.lastCollectedAt = -Infinity;
      state.paramRange = null;
      state.maxPeak = 0;
    }
  }

  /** Run one tick (exposed for testing). */
  tick(): void {
    const runInfo = this.getRunInfo();
    const now = this.getAudioTime();
    const runStartTime = this.getRunStartTime();
    const sampleRate = this.getSampleRate();
    const track = runInfo?.track ?? [];

    // Get timing snapshot
    const snapshot = resolveTimingSnapshot(
      now,
      runStartTime,
      track,
      this.config.poll.guard_ms,
    );

    // Read measurements from taps
    const measurements = new Map<string, number>();
    for (const [tapName, _tapDef] of Object.entries(this.config.taps)) {
      const analyser = this.tapManager.get(tapName);
      if (!analyser) continue;

      const rms = readRms(analyser);
      const peak = readPeak(analyser);
      measurements.set(tapName, rms);
      this.meterValues.set(tapName, { rms, peak });
      if (snapshot.inWindow) {
        const previous = this.meterMax.get(tapName) ?? { rms: 0, peak: 0 };
        const next = { ...previous };
        if (Number.isFinite(rms) && rms > previous.rms) {
          next.rms = rms;
          next.rmsTime = snapshot.relTime;
          next.rmsPhoneme = snapshot.event?.phoneme ?? "";
        }
        if (Number.isFinite(peak) && peak > previous.peak) {
          next.peak = peak;
          next.peakTime = snapshot.relTime;
          next.peakPhoneme = snapshot.event?.phoneme ?? "";
        }
        this.meterMax.set(tapName, next);
      }
    }

    // Evaluate each check (skip track_analysis — handled statically)
    const results = new Map<string, CheckResult>();
    for (const [checkName, checkDef] of Object.entries(this.config.checks)) {
      if (checkDef.type === "track_analysis") continue;
      const state = this.checkStates.get(checkName)!;

      // For tap_check, read the specific measurement type
      const measure = checkDef.measure ?? "rms";
      if (checkDef.tap) {
        const analyser = this.tapManager.get(checkDef.tap);
        if (analyser) {
          const value = this.readMeasurement(analyser, measure, sampleRate, checkDef.measure_params);
          measurements.set(checkDef.tap, value);
        }
      }
      // For multi-tap checks (rms_ratio_db)
      if (checkDef.taps) {
        for (const tapName of checkDef.taps) {
          const analyser = this.tapManager.get(tapName);
          if (analyser) {
            const value = this.readMeasurement(analyser, "rms", sampleRate, undefined);
            measurements.set(tapName, value);
          }
        }
      }

      const result = evaluateCheck(checkName, checkDef, measurements, snapshot, state, now);
      results.set(checkName, result);
    }

    // Merge in static track_analysis results (they don't change per tick)
    for (const [name, result] of this.trackAnalysisResults) {
      results.set(name, result);
    }

    // Preserve last active (non-skip) results so they survive after playback ends
    for (const [name, result] of results) {
      if (result.status !== "skip") {
        this.lastActiveResults.set(name, result);
      }
    }

    // Merge: prefer current non-skip, fall back to last active
    const mergedResults = new Map<string, CheckResult>();
    for (const [name, result] of results) {
      if (result.status !== "skip") {
        mergedResults.set(name, result);
      } else {
        mergedResults.set(name, this.lastActiveResults.get(name) ?? result);
      }
    }

    // Format display
    const displayState = this.getDisplayState();
    displayState.checkResults = mergedResults;
    displayState.meterValues = this.meterValues;
    displayState.meterMax = this.meterMax;
    const output = formatDisplay(this.config.display, displayState);

    // Deliver results
    this.onResults(mergedResults, output);
  }

  private readMeasurement(
    analyser: AnalyserNode,
    measure: string,
    sampleRate: number,
    measureParams?: { band?: [number, number] },
  ): number {
    switch (measure) {
      case "rms":
        return readRms(analyser);
      case "peak":
        return readPeak(analyser);
      case "fft_peak_freq":
        return readFftPeakFreq(analyser, sampleRate, measureParams?.band);
      case "band_energy":
        return readBandEnergy(analyser, sampleRate, measureParams?.band ?? [0, sampleRate / 2]);
      default:
        return readRms(analyser);
    }
  }
}
