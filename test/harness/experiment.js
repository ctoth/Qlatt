// test/harness/experiment.js — Experiment manifest loading and config management

import { assertFrontendVocabulary } from "../../src/experiments/frontend-vocabulary.ts";
import { loadExperimentConfig } from "../../src/experiments/load-experiment-config.ts";
import { state } from "./state.js";

let validatedSemantics = null;
let validatedFrontend = null;

async function validateSelectedFrontend() {
  const frontendId = document.getElementById("frontendSelect")?.value || "qlatt-english";
  if (validatedSemantics === state.newRuntimeConfig?.semantics && validatedFrontend === frontendId) return;
  try {
    await assertFrontendVocabulary(frontendId, {
      graph: state.newRuntimeConfig?.graph,
      semantics: state.newRuntimeConfig?.semantics,
    });
    validatedSemantics = state.newRuntimeConfig?.semantics;
    validatedFrontend = frontendId;
  } catch (err) {
    state.status.textContent = `Status: ${err.message}`;
    throw err;
  }
}

export function getSelectedExperiment() {
  const select = document.getElementById("experimentSelect");
  return select ? select.value : "klatt80-baseline";
}

export async function loadExperimentManifest() {
  const select = document.getElementById("experimentSelect");
  try {
    const res = await fetch("./experiments/manifest.json");
    if (!res.ok) throw new Error("Failed to fetch manifest");
    state.experimentManifest = await res.json();
    // Populate dropdown
    select.innerHTML = "";
    for (const exp of state.experimentManifest.experiments) {
      const option = document.createElement("option");
      option.value = exp.id;
      option.textContent = exp.name;
      option.title = exp.description;
      select.appendChild(option);
    }
    // Default to first experiment
    if (state.experimentManifest.experiments.length > 0) {
      select.value = state.experimentManifest.experiments[0].id;
    }
    console.log(
      "[QLATT] Experiment manifest loaded:",
      state.experimentManifest.experiments.map((e) => e.id),
    );
  } catch (err) {
    console.error("[QLATT] Failed to load experiment manifest:", err);
    // Fallback to hardcoded default
    select.innerHTML = '<option value="klatt80-baseline">klatt80-baseline</option>';
  }
}

/**
 * Load the frontend manifest, which says which experiment each frontend is
 * paired with by default (src/experiments/frontend-pairing.ts). Without it the
 * pairing falls back to the same-id rule.
 */
export async function loadFrontendManifest() {
  try {
    const res = await fetch("./rules/frontends/manifest.json");
    if (!res.ok) throw new Error("Failed to fetch frontend manifest");
    state.frontendManifest = await res.json();
  } catch (err) {
    console.error("[QLATT] Failed to load frontend manifest:", err);
    state.frontendManifest = null;
  }
}

export function onExperimentChange() {
  const selected = getSelectedExperiment();
  if (selected !== state.currentExperimentId) {
    // Clear cached config so it reloads on next play
    state.newRuntimeConfig = null;
    // Also clear runtime and interpreter since they depend on config
    if (state.diagEngine) {
      state.diagEngine.destroy();
      state.diagEngine = null;
    }
    if (state.newRuntime) {
      state.newRuntime.disconnect();
      state.newRuntime = null;
    }
    state.newRuntimeInitPromise = null;
    state.newInterpreter = null;
    console.log("[QLATT] Experiment changed to:", selected);
  }
}

export async function loadNewRuntimeConfig() {
  const experimentId = getSelectedExperiment();
  // Check if already loaded for current experiment
  if (
    state.newRuntimeConfig?.graph &&
    state.newRuntimeConfig?.semantics &&
    state.newRuntimeConfig?.registry &&
    state.currentExperimentId === experimentId
  ) {
    await validateSelectedFrontend();
    return; // Already loaded for this experiment
  }
  state.status.textContent = `Status: loading ${experimentId} config...`;
  try {
    // Find this experiment's manifest entry
    const manifest = state.experimentManifest?.experiments?.find((e) => e.id === experimentId);
    const config = await loadExperimentConfig(experimentId);
    state.newRuntimeConfig = config;

    await validateSelectedFrontend();
    state.currentExperimentId = experimentId;
    state.status.textContent = `Status: ${experimentId} config loaded`;
    console.log("[QLATT] Runtime config loaded", {
      experiment: experimentId,
      extends: manifest?.extends || null,
      graph: state.newRuntimeConfig?.graph?.name,
      semantics: state.newRuntimeConfig?.semantics?.name,
      primitives: Object.keys(state.newRuntimeConfig?.registry?.primitives ?? {}).length,
    });
  } catch (err) {
    state.status.textContent = `Status: failed to load ${experimentId} config: ${err.message}`;
    console.error("[QLATT] Failed to load runtime config:", err);
    throw err;
  }
}
