// test/harness/experiment.js — Experiment manifest loading and config management

import { state } from "./state.js";
import { loadYamlDocument, loadYamlDocumentOrNull } from "../../src/yaml-loader.ts";

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
    console.log("[QLATT] Experiment manifest loaded:", state.experimentManifest.experiments.map(e => e.id));
  } catch (err) {
    console.error("[QLATT] Failed to load experiment manifest:", err);
    // Fallback to hardcoded default
    select.innerHTML = '<option value="klatt80-baseline">klatt80-baseline</option>';
  }
}

export function onExperimentChange() {
  const selected = getSelectedExperiment();
  if (selected !== state.currentExperimentId) {
    // Clear cached config so it reloads on next play
    state.newRuntimeGraph = null;
    state.newRuntimeSemantics = null;
    state.newRuntimeRegistry = null;
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

/**
 * Merge parent and child registry configs. Child primitives override parent primitives
 * by name; parent primitives not in child are preserved.
 */
function mergeRegistry(parent, child) {
  if (!child) return parent;
  return { ...parent, primitives: { ...parent.primitives, ...(child.primitives || {}) } };
}

/**
 * Merge parent and child semantics configs.
 * - params: shallow merge, child wins
 * - constants: deep merge, child wins
 * - realize: shallow merge, child wins
 */
function mergeSemantics(parent, child) {
  if (!child) return parent;
  return {
    ...parent,
    ...child,
    params: { ...parent.params, ...(child.params || {}) },
    constants: deepMerge(parent.constants || {}, child.constants || {}),
    realize: { ...parent.realize, ...(child.realize || {}) },
  };
}

/**
 * Recursively merge source into target. Source values win.
 * Arrays are replaced wholesale, not merged.
 */
function deepMerge(target, source) {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(result[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }
  return result;
}

export async function loadNewRuntimeConfig() {
  const experimentId = getSelectedExperiment();
  // Check if already loaded for current experiment
  if (state.newRuntimeGraph && state.newRuntimeSemantics && state.newRuntimeRegistry && state.currentExperimentId === experimentId) {
    return; // Already loaded for this experiment
  }
  state.status.textContent = `Status: loading ${experimentId} config...`;
  try {
    // Find this experiment's manifest entry
    const manifest = state.experimentManifest?.experiments?.find(e => e.id === experimentId);
    const basePath = `./experiments/${experimentId}`;

    // Load child configs (some may be absent for inheriting experiments)
    const [childGraph, childSemantics, childRegistry] = await Promise.all([
      loadYamlDocumentOrNull(`${basePath}/graph.yaml`),
      loadYamlDocumentOrNull(`${basePath}/semantics.yaml`),
      loadYamlDocumentOrNull(`${basePath}/registry.yaml`),
    ]);

    if (manifest && manifest.extends) {
      // Load parent configs
      const parentBase = `./experiments/${manifest.extends}`;
      const [parentGraph, parentSemantics, parentRegistry] = await Promise.all([
        loadYamlDocument(`${parentBase}/graph.yaml`),
        loadYamlDocument(`${parentBase}/semantics.yaml`),
        loadYamlDocument(`${parentBase}/registry.yaml`),
      ]);

      // Merge: child overrides parent
      state.newRuntimeRegistry = mergeRegistry(parentRegistry, childRegistry);
      state.newRuntimeSemantics = mergeSemantics(parentSemantics, childSemantics);
      state.newRuntimeGraph = childGraph || parentGraph;  // graph: full replacement or inherit
    } else {
      state.newRuntimeGraph = childGraph;
      state.newRuntimeSemantics = childSemantics;
      state.newRuntimeRegistry = childRegistry;
    }

    state.currentExperimentId = experimentId;
    state.status.textContent = `Status: ${experimentId} config loaded`;
    console.log("[QLATT] Runtime config loaded", {
      experiment: experimentId,
      extends: manifest?.extends || null,
      graph: state.newRuntimeGraph?.name,
      semantics: state.newRuntimeSemantics?.name,
      primitives: Object.keys(state.newRuntimeRegistry?.primitives ?? {}).length,
    });
  } catch (err) {
    state.status.textContent = `Status: failed to load ${experimentId} config`;
    console.error("[QLATT] Failed to load runtime config:", err);
    throw err;
  }
}
