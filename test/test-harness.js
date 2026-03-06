// test/test-harness.js — Entry point: imports modules, wires DOM events, runs init

import { state } from "./harness/state.js";
import { renderControls, bindControls, applyUrlParams } from "./harness/controls.js";
import { loadExperimentManifest, onExperimentChange } from "./harness/experiment.js";
import { start, stop, speak } from "./harness/runtime.js";
import { attachSpectrogram, clearSpectrogram } from "./harness/spectrogram.js";
import { updateDiagnostics } from "./harness/diagnostics.js";

// Render controls immediately
renderControls();

// Load experiment manifest independently — not gated on runtime init
loadExperimentManifest().then(() => {
  const experimentSelect = document.getElementById("experimentSelect");
  if (experimentSelect) {
    experimentSelect.addEventListener("change", onExperimentChange);
  }
});

// Initialize
(async () => {
  attachSpectrogram();
  bindControls();
  applyUrlParams();
})();

// DOM event listeners
document.getElementById("startBtn").addEventListener("click", start);
document.getElementById("stopBtn").addEventListener("click", stop);
document.getElementById("speakBtn").addEventListener("click", speak);
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
