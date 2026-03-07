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
  private config: DiagConfig;
  private tapManager: TapManager;
  private acrossPlays: AcrossPlaysAccumulator;
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

  /** Reset per-play check state. */
  resetPerPlay(): void {
    for (const state of this.checkStates.values()) {
      state.collected = [];
      state.lastCollectedAt = -Infinity;
      state.paramRange = null;
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

      // Read RMS by default (individual checks specify their measure)
      measurements.set(tapName, readRms(analyser));
    }

    // Evaluate each check
    const results = new Map<string, CheckResult>();
    for (const [checkName, checkDef] of Object.entries(this.config.checks)) {
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
