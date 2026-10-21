// test/test-harness.js — Entry point: imports modules, wires DOM events, runs init

import { applyUrlParams, bindControls, renderControls } from "./harness/controls.js";
import { updateDiagnostics } from "./harness/diagnostics.js";
import {
  applyFrontendDefault,
  loadExperimentManifest,
  loadFrontendManifest,
  onExperimentChange,
} from "./harness/experiment.js";
import { refreshSpeakerOptions } from "./harness/speaker.js";
import { attachSpectrogram, clearSpectrogram } from "./harness/spectrogram.js";
import { state } from "./harness/state.js";
// `?tap=1`: window.__qlattTap from the start (harness/tap.js); nothing otherwise.
import "./harness/tap.js";
import { warmFrontendOnce } from "./harness/warmup.js";
import { waitForWarmup } from "./harness/warmup-wait.js";

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

function selectedFrontendId() {
  return document.getElementById("frontendSelect")?.value || "qlatt-english";
}

// Get the selected frontend ready ahead of the first Speak (harness/warmup.js).
// `?warmup=0` in the page URL turns this off, so that the first Speak loads
// everything itself: the comparison case when measuring.
const warmupEnabled = new URLSearchParams(location.search).get("warmup") !== "0";
function warmSelectedFrontend() {
  if (!warmupEnabled) return Promise.resolve(null);
  return warmFrontendOnce(selectedFrontendId(), loadRuntimeModule);
}

async function speakWithRuntime() {
  // If the frontend is still being prepared, let that finish: it is the same
  // work Speak would otherwise repeat with blocking requests. The wait has a
  // limit (harness/warmup-wait.js): Speak never depends on the warm-up.
  await waitForWarmup(warmSelectedFrontend(), selectedFrontendId());
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
  // Auto-pair frontend -> experiment on load and populate the voice dropdown,
  // then prepare the frontend with the voice the dropdown shows.
  applyFrontendDefault();
  refreshSpeakerOptions().then(warmSelectedFrontend);
});

// Frontend change: re-pair the experiment graph and repopulate the voices.
document.getElementById("frontendSelect")?.addEventListener("change", () => {
  applyFrontendDefault();
  refreshSpeakerOptions().then(warmSelectedFrontend);
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
