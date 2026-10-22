// test/harness/experiment.js — Experiment manifest loading and config management

import { preloadBundledFrontendManifest } from "../../src/declarative-frontend/rule-pack.ts";
import { defaultExperimentFor } from "../../src/experiments/frontend-pairing.ts";
import { assertFrontendVocabulary } from "../../src/experiments/frontend-vocabulary.ts";
import {
  assertExperimentPair,
  loadExperimentConfig,
  loadExperimentManifest as readExperimentManifest,
} from "../../src/experiments/load-experiment-config.ts";
import { state } from "./state.js";

let validatedSemantics = null;
let validatedFrontend = null;
let explicitExperimentSelection = false;

async function validateSelectedFrontend() {
  const frontendId = document.getElementById("frontendSelect")?.value || "qlatt-english";
  try {
    await assertExperimentPair(frontendId, getSelectedExperiment());
    if (
      validatedSemantics === state.newRuntimeConfig?.semantics &&
      validatedFrontend === frontendId
    )
      return;
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
  if (!select?.value) throw new Error("E_FRONTEND_DEFAULT_EXPERIMENT: no experiment selected");
  return select.value;
}

export async function loadExperimentManifest() {
  const select = document.getElementById("experimentSelect");
  try {
    state.experimentManifest = await readExperimentManifest();
    // Populate dropdown
    select.innerHTML = "";
    for (const exp of state.experimentManifest.experiments) {
      const option = document.createElement("option");
      option.value = exp.id;
      option.textContent = exp.name;
      option.title = exp.description;
      select.appendChild(option);
    }
    select.selectedIndex = -1;
    explicitExperimentSelection = false;
    console.log(
      "[QLATT] Experiment manifest loaded:",
      state.experimentManifest.experiments.map((e) => e.id),
    );
  } catch (err) {
    console.error("[QLATT] Failed to load experiment manifest:", err);
    state.status.textContent = `Status: ${err.message}`;
    throw err;
  }
}

/**
 * Load the frontend manifest, which says which experiment each frontend is
 * paired with by default (src/experiments/frontend-pairing.ts).
 * Missing defaults are configuration errors.
 */
export async function loadFrontendManifest() {
  try {
    state.frontendManifest = await preloadBundledFrontendManifest();
  } catch (err) {
    console.error("[QLATT] Failed to load frontend manifest:", err);
    state.frontendManifest = null;
    state.status.textContent = `Status: ${err.message}`;
    throw err;
  }
}

export function onExperimentChange() {
  explicitExperimentSelection = true;
  invalidateSelectedExperiment();
}

/** Automatic defaults follow the frontend until the user chooses a backend. */
export function applyFrontendDefault() {
  const frontend = document.getElementById("frontendSelect");
  const experiment = document.getElementById("experimentSelect");
  if (!frontend || !experiment) return;
  try {
    const selected = explicitExperimentSelection
      ? experiment.value
      : defaultExperimentFor(
          frontend.value,
          state.frontendManifest,
          (state.experimentManifest?.experiments ?? []).map((entry) => entry.id),
        );
    const supported =
      state.frontendManifest?.frontends.find((entry) => entry.id === frontend.value)
        ?.supportedExperiments ?? [];
    experiment.innerHTML = "";
    for (const entry of state.experimentManifest?.experiments ?? []) {
      if (!supported.includes(entry.id) && entry.id !== selected) continue;
      const option = document.createElement("option");
      option.value = entry.id;
      option.textContent = `${entry.name ?? entry.id}${supported.includes(entry.id) ? "" : " (unsupported for selected frontend)"}`;
      option.title = entry.description ?? "";
      experiment.appendChild(option);
    }
    experiment.value = selected;
    invalidateSelectedExperiment();
    if (!supported.includes(selected))
      throw new Error(
        `E_SYNTH_PAIRING: frontend '${frontend.value}' and backend '${selected}' are not a declared supported pair`,
      );
  } catch (err) {
    state.status.textContent = `Status: ${err.message}`;
    throw err;
  }
}

function invalidateSelectedExperiment() {
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
