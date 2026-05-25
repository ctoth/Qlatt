// test/harness/runtime.js — Runtime lifecycle: init, start, stop, speak

import { state } from "./state.js";
import { loadNewRuntimeConfig } from "./experiment.js";
import { handleTelemetry } from "./telemetry.js";
import { startSpectrogram } from "./spectrogram.js";
import { updateDiagnostics } from "./diagnostics.js";
import { createKlattRuntime } from "../../src/klatt-runtime.ts";
import { createKlattInterpreter } from "../../src/klatt-interpreter.ts";
import { textToKlattTrack } from "../../src/tts-frontend";
import {
  summarizeTrack,
  summarizeParallel,
} from "../../src/track-analysis.ts";
import { parseDiagConfig } from "../../src/harness-diagnostics/schema.ts";
import { createDiagnosticsEngine } from "../../src/harness-diagnostics/index.ts";

export async function start() {
  await state.ctx.resume();
  await initializeNewRuntime();
  state.status.textContent = "Status: running";
}

export async function stop() {
  await state.ctx.suspend();
  state.status.textContent = "Status: suspended";
}

export function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

export async function speak() {
  await state.ctx.resume();
  const phrase = document.getElementById("phrase").value.trim();
  const baseF0 = Number(document.getElementById("baseF0").value) || 110;
  const rate = Number(document.getElementById("rate").value) || 1.0;
  const frontendId = document.getElementById("frontendSelect")?.value || "qlatt-english";
  if (!phrase) return;
  const track = textToKlattTrack(phrase, baseF0, 30, { rate, frontendId });
  await speakWithNewRuntime(track);
}

export async function initializeNewRuntime() {
  if (state.newRuntime) return state.newRuntime;
  if (state.newRuntimeInitPromise) return state.newRuntimeInitPromise;

  state.newRuntimeInitPromise = (async () => {
    await loadNewRuntimeConfig();
    state.status.textContent = "Status: initializing new runtime...";
    try {
      state.newRuntime = await createKlattRuntime({
        audioContext: state.ctx,
        graph: state.newRuntimeGraph,
        semantics: state.newRuntimeSemantics,
        registry: state.newRuntimeRegistry,
        workletBasePath: state.WORKLET_BASE_PATH,
        logger: (msg) => console.log(msg),
        telemetry: true,  // Enable worklet debug metrics
        telemetryHandler: (data) => handleTelemetry(data),  // Route to shared handler
      });
      state.newRuntime.connectToDestination();
      state.status.textContent = "Status: new runtime initialized";
      console.log("[QLATT] New runtime initialized");

      // Create diagnostics engine
      try {
        const configResp = await fetch(`${import.meta.env.BASE_URL}diagnostics/default.yaml`);
        const configYaml = await configResp.text();
        state.diagConfig = parseDiagConfig(configYaml);
        state.diagEngine = createDiagnosticsEngine(
          state.diagConfig,
          state.ctx,
          state.newRuntime,
          {
            telemetry: state.telemetry,
            telemetryMax: state.telemetryMax,
            plstepEvents: state.plstepEvents,
            plstepTotalCount: () => state.plstepTotalCount,
            playHistory: state.playHistory,
            sessionId: state.sessionId,
            sliderParams: {},
          },
        );
        state.diagEngine.subscribe((output) => {
          if (state.useEngineOutput) {
            state.lastDiagnostics = output;
            state.diagnosticsEl.value = output;
          }
        });
        state.diagEngine.start();
        console.log("[QLATT] Diagnostics engine initialized");
      } catch (err) {
        console.warn("[QLATT] Diagnostics engine failed to initialize:", err);
      }

      return state.newRuntime;
    } catch (err) {
      state.status.textContent = "Status: failed to initialize new runtime";
      console.error("[QLATT] Failed to initialize new runtime:", err);
      throw err;
    } finally {
      state.newRuntimeInitPromise = null;
    }
  })();

  return state.newRuntimeInitPromise;
}

export async function speakWithNewRuntime(track) {
  const runtime = await initializeNewRuntime();

  if (!track || track.length === 0) {
    state.status.textContent = "Status: new runtime - no track to play";
    return;
  }

  const phrase = document.getElementById("phrase").value.trim();
  const baseF0 = Number(document.getElementById("baseF0").value) || 110;

  // Session setup (matching speak())
  const startTime = state.ctx.currentTime + 0.05;
  state.sessionId += 1;
  const currentSessionId = state.sessionId;

  // Clear state BEFORE scheduling (matching speak())
  state.plstepEvents.length = 0;
  state.plstepTotalCount = 0;
  state.telemetry.clear();
  state.telemetryMax.clear();

  // Set run context BEFORE scheduling so telemetry handler can use it
  state.lastRun = { phrase, baseF0, track, sessionId: currentSessionId, startTime };
  state.runStartTime = startTime;

  if (state.diagEngine) {
    state.diagEngine.onPlayStart({
      phrase,
      baseF0,
      track,
      sessionId: currentSessionId,
      startTime,
    });
  }

  state.status.textContent = `Status: speaking "${phrase}" (new runtime)`;

  // Create interpreter if needed (with telemetry handler that uses handleTelemetry)
  if (!state.newInterpreter) {
    console.log("[QLATT] Creating interpreter");
    state.newInterpreter = createKlattInterpreter({
      audioContext: state.ctx,
      runtime: runtime,
      graph: state.newRuntimeGraph,
      semantics: state.newRuntimeSemantics,
      logger: (msg) => console.log(msg),
      telemetryHandler: (event) => {
        // Route interpreter telemetry through handleTelemetry for PLSTEP events
        handleTelemetry(event);
      },
    });
  }

  // Connect spectrogram to new runtime output (if analyser exists)
  if (state.specState.analyser) {
    const outputNode = runtime.getNode("masterGain") ?? runtime.getNode("outputGain");
    if (outputNode) {
      try {
        outputNode.connect(state.specState.analyser);
      } catch {
        // May already be connected
      }
    }
  }

  console.log("[QLATT] New runtime: scheduling track", {
    frames: track.length,
    startTime,
    duration: track[track.length - 1]?.time ?? 0,
    sessionId: currentSessionId,
  });

  state.newInterpreter.scheduleTrack(track, startTime);

  const trackDuration = state.newInterpreter.getTrackDuration();
  console.log("[QLATT] Track summary", summarizeTrack(track));
  const parallelSummary = summarizeParallel(track);
  console.log("[QLATT] Parallel summary", parallelSummary);
  if (parallelSummary.parallelEvents > 0 && parallelSummary.swOn === 0) {
    console.warn(
      "[QLATT] Parallel params present, but SW=0 (cascade-only path)."
    );
  }
  console.log("[QLATT] First events", track.slice(0, 6));

  // Start spectrogram visualization (matching speak())
  startSpectrogram(track);

  // Update diagnostics display
  updateDiagnostics();

  // Auto-copy diagnostics to clipboard after audio finishes (matching speak())
  setTimeout(() => {
    updateDiagnostics();
    if (state.diagEngine) state.diagEngine.onPlayEnd();
    navigator.clipboard.writeText(state.diagnosticsEl.value).catch(() => {});
    // Record play history for warmup tracking
    const outputMax =
      state.telemetryMax.get("post-output-lp") ??
      state.telemetryMax.get("outputGain") ??
      state.telemetryMax.get("masterGain") ??
      null;
    if (outputMax) {
      state.playHistory.push({
        sessionId: currentSessionId,
        phrase,
        maxRms: outputMax.rms ?? 0,
        maxPeak: outputMax.peak ?? 0,
        timestamp: Date.now(),
      });
      // Keep only last N plays
      while (state.playHistory.length > state.MAX_PLAY_HISTORY) {
        state.playHistory.shift();
      }
    }
  }, Math.max(0, trackDuration * 1000 + 300));
}
