// Engine facade — wires TapManager, PollLoop, and AcrossPlaysAccumulator
// into a single DiagnosticsEngine interface.

import type { DiagConfig, DiagnosticsEngine, RunInfo, CheckResult } from "./types";
import type { DisplayState } from "./display-formatter";
import { TapManager } from "./tap-manager";
import { PollLoop } from "./poll-loop";
import { AcrossPlaysAccumulator } from "./across-plays";
import { updateParamRange } from "./check-evaluator";
import { createCheckState } from "./check-evaluator";

export function createDiagnosticsEngine(
  config: DiagConfig,
  audioContext: AudioContext,
  runtime: any,
): DiagnosticsEngine {
  const subscribers: Set<(output: string) => void> = new Set();
  let currentRun: RunInfo | null = null;
  let runStartTime = 0;
  let currentResults: Map<string, CheckResult> = new Map();

  const acrossPlays = new AcrossPlaysAccumulator();

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
      telemetry: new Map(),
      telemetryMax: new Map(),
      meterValues: new Map(),
      meterMax: new Map(),
      plstepEvents: [],
      plstepTotalCount: 0,
      playHistory: [],
      sessionId: currentRun?.sessionId ?? 0,
      sliderParams: {},
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
