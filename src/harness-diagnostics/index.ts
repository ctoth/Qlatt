// Engine facade — wires TapManager, PollLoop, and AcrossPlaysAccumulator
// into a single DiagnosticsEngine interface.

import type { DiagConfig, DiagnosticsEngine, RunInfo, CheckResult } from "./types";
import type { DisplayState } from "./display-formatter";
import { TapManager } from "./tap-manager";
import { PollLoop } from "./poll-loop";
import { AcrossPlaysAccumulator } from "./across-plays";
import { updateParamRange, evaluateTrackAnalysis } from "./check-evaluator";
import { createCheckState } from "./check-evaluator";
import type { TrackAnalysisCheckDef } from "./types";

/** External state provider — lets the harness pass live references into the engine. */
export interface ExternalState {
  telemetry: Map<string, any>;
  telemetryMax: Map<string, any>;
  plstepEvents: any[];
  plstepTotalCount: number;
  playHistory: any[];
  sessionId: number;
  sliderParams: Record<string, number>;
}

export function createDiagnosticsEngine(
  config: DiagConfig,
  audioContext: AudioContext,
  runtime: any,
  externalState?: ExternalState,
): DiagnosticsEngine {
  const subscribers: Set<(output: string) => void> = new Set();
  let currentRun: RunInfo | null = null;
  let runStartTime = 0;
  let currentResults: Map<string, CheckResult> = new Map();

  const acrossPlays = new AcrossPlaysAccumulator();
  /** Static results from track_analysis checks — computed once per play. */
  let trackAnalysisResults: Map<string, CheckResult> = new Map();

  // Register across_plays checks
  for (const [checkName, checkDef] of Object.entries(config.checks)) {
    if (checkDef.type === "across_plays" && checkDef.plays) {
      acrossPlays.register(checkName, checkDef.plays);
    }
  }

  const tapManager = new TapManager({
    audioContext,
    runtime,
    taps: config.taps,
  });

  const pollLoop = new PollLoop({
    config,
    tapManager,
    acrossPlays,
    getRunInfo: () => currentRun,
    getRunStartTime: () => runStartTime,
    getAudioTime: () => audioContext.currentTime,
    getSampleRate: () => audioContext.sampleRate,
    getDisplayState: (): DisplayState => ({
      run: currentRun,
      checkResults: currentResults,
      telemetry: externalState?.telemetry ?? new Map(),
      telemetryMax: externalState?.telemetryMax ?? new Map(),
      meterValues: new Map(),
      meterMax: new Map(),
      plstepEvents: externalState?.plstepEvents ?? [],
      plstepTotalCount: externalState?.plstepTotalCount ?? 0,
      playHistory: externalState?.playHistory ?? [],
      sessionId: externalState?.sessionId ?? currentRun?.sessionId ?? 0,
      sliderParams: externalState?.sliderParams ?? {},
    }),
    onResults: (results, output) => {
      currentResults = results;
      for (const fn of subscribers) {
        fn(output);
      }
    },
  });

  return {
    start() {
      tapManager.connect();
      pollLoop.start();
    },

    stop() {
      pollLoop.stop();
    },

    destroy() {
      pollLoop.stop();
      tapManager.destroy();
    },

    onPlayStart(run: RunInfo) {
      currentRun = run;
      runStartTime = run.startTime;
      pollLoop.resetPerPlay();

      // Update param_range accumulators from the track
      for (const [checkName, checkDef] of Object.entries(config.checks)) {
        if (checkDef.type === "param_range" && checkDef.param) {
          // Create a fresh check state for param_range and populate it
          const state = createCheckState();
          updateParamRange(state, checkDef.param, run.track);
        }
      }

      // Run track_analysis checks once against the track
      trackAnalysisResults = new Map();
      for (const [checkName, checkDef] of Object.entries(config.checks)) {
        if (checkDef.type === "track_analysis" && checkDef.select) {
          const result = evaluateTrackAnalysis(
            checkName,
            checkDef as TrackAnalysisCheckDef,
            run.track,
          );
          trackAnalysisResults.set(checkName, result);
        }
      }
      pollLoop.setTrackAnalysisResults(trackAnalysisResults);
    },

    onPlayEnd() {
      // Record across-plays values from the latest run
      if (currentRun) {
        for (const [checkName, checkDef] of Object.entries(config.checks)) {
          if (checkDef.type === "across_plays" && checkDef.tap) {
            const result = currentResults.get(checkName);
            if (result?.value !== undefined) {
              acrossPlays.record(checkName, result.value);
            }
          }
        }
      }
    },

    subscribe(fn: (output: string) => void): () => void {
      subscribers.add(fn);
      return () => {
        subscribers.delete(fn);
      };
    },

    getCheckResults(): Map<string, CheckResult> {
      return currentResults;
    },
  };
}
