// test/test-harness.js — Entry point: imports modules, wires DOM events, runs init

import { defaultExperimentFor } from "../src/experiments/frontend-pairing.ts";
import { applyUrlParams, bindControls, renderControls } from "./harness/controls.js";
import { updateDiagnostics } from "./harness/diagnostics.js";
import {
  loadExperimentManifest,
  loadFrontendManifest,
  onExperimentChange,
} from "./harness/experiment.js";
import { refreshSpeakerOptions } from "./harness/speaker.js";
import { attachSpectrogram, clearSpectrogram } from "./harness/spectrogram.js";
import { state } from "./harness/state.js";

let runtimeModulePromise = null;

function loadRuntimeModule() {
  runtimeModulePromise ??= import("./harness/runtime.js");
  return runtimeModulePromise;
}

async function startRuntime() {
  const { start } = await loadRuntimeModule();
  await start();
}

async function stopRuntime() {
  const { stop } = await loadRuntimeModule();
  await stop();
}

async function speakWithRuntime() {
  const { speak } = await loadRuntimeModule();
  await speak();
}

// Render controls immediately
renderControls();

// Load the experiment and frontend manifests independently — not gated on
// runtime init
Promise.all([loadExperimentManifest(), loadFrontendManifest()]).then(() => {
  const experimentSelect = document.getElementById("experimentSelect");
  if (experimentSelect) {
    experimentSelect.addEventListener("change", onExperimentChange);
  }
  // Auto-pair frontend -> experiment on load and populate the voice dropdown.
  pairExperimentToFrontend();
  refreshSpeakerOptions();
});

// Generic frontend -> experiment auto-pairing, from data: the frontend's
// manifest entry may name a defaultExperiment (dectalk-english names
// dectalk-vtm); without one, the experiment whose id equals the frontend id.
// A frontend with neither leaves the experiment as-is, so qlatt-english keeps
// whatever experiment is selected (default klatt80-baseline). Selecting fires
// the change handler so the matching synth graph is loaded.
function pairExperimentToFrontend() {
  const frontendSelect = document.getElementById("frontendSelect");
  const experimentSelect = document.getElementById("experimentSelect");
  if (!frontendSelect || !experimentSelect) return;
  let experimentId;
  try {
    experimentId = defaultExperimentFor(
      frontendSelect.value,
      state.frontendManifest,
      Array.from(experimentSelect.options).map((o) => o.value),
    );
  } catch (err) {
    state.status.textContent = `Status: ${err.message}`;
    console.error("[QLATT] Frontend pairing failed:", err);
    return;
  }
  if (experimentId && experimentSelect.value !== experimentId) {
    experimentSelect.value = experimentId;
    experimentSelect.dispatchEvent(new Event("change"));
  }
}

// Frontend change: re-pair the experiment graph and repopulate the voices.
document.getElementById("frontendSelect")?.addEventListener("change", () => {
  pairExperimentToFrontend();
  refreshSpeakerOptions();
});

// Initialize
(async () => {
  attachSpectrogram();
  bindControls();
  applyUrlParams();
})();

// DOM event listeners
document.getElementById("startBtn").addEventListener("click", startRuntime);
document.getElementById("stopBtn").addEventListener("click", stopRuntime);
document.getElementById("speakBtn").addEventListener("click", speakWithRuntime);
document.getElementById("rate").addEventListener("input", () => {
  document.getElementById("rateValue").textContent =
    Number(document.getElementById("rate").value).toFixed(2) + "x";
});
document.getElementById("copyDiagBtn").addEventListener("click", async () => {
  if (!state.lastRun) return;
  updateDiagnostics();
  await navigator.clipboard.writeText(state.lastDiagnostics);
});
document.getElementById("clearSpecBtn").addEventListener("click", () => {
  clearSpectrogram();
});
document.getElementById("diagEngineToggle")?.addEventListener("change", (e) => {
  state.useEngineOutput = e.target.checked;
  if (state.lastRun) updateDiagnostics();
});
document.getElementById("clearDiagBtn").addEventListener("click", () => {
  state.diagnosticsEl.value = "";
  state.lastDiagnostics = "";
  state.lastRun = null;
  state.runStartTime = 0;
  state.plstepEvents.length = 0;
  state.plstepTotalCount = 0;
  state.telemetry.clear();
  state.telemetryMax.clear();
  state.playHistory.length = 0; // P7: Clear play history
});
