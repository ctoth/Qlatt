// test/harness/controls.js — Control spec, slider rendering, URL param application

import { state } from "./state.js";

export const controlSpec = [
  { id: "f0", label: "F0 (Hz)", min: 50, max: 300, step: 1 },
  { id: "rd", label: "Rd", min: 0.3, max: 2.7, step: 0.01 },
  {
    id: "lfMode",
    label: "LF Mode (0=Legacy, 1=LF_LM, 2=LF_CALM)",
    min: 0,
    max: 2,
    step: 1,
    format: "fixed0",
  },
  {
    id: "sourceMode",
    label: "Source Mode (0=Impulse, 1=LF)",
    min: 0,
    max: 1,
    step: 1,
    format: "fixed0",
  },
  {
    id: "openPhaseRatio",
    label: "Open Phase Ratio",
    min: 0.1,
    max: 0.95,
    step: 0.01,
  },
  { id: "voiceGain", label: "Voice Gain", min: 0, max: 1, step: 0.01 },
  { id: "noiseGain", label: "Noise Gain", min: 0, max: 0.5, step: 0.01 },
  { id: "noiseCutoff", label: "Noise Cutoff", min: 200, max: 6000, step: 10 },
  { id: "fricationCutoff", label: "Frication Cutoff", min: 500, max: 9000, step: 10 },
  { id: "masterGain", label: "Output Boost", min: 0, max: 5, step: 0.05 },
  { id: "parallelMix", label: "Parallel Mix", min: 0, max: 1, step: 0.01 },
  { id: "parallelGainScale", label: "Parallel Gain Scale", min: 0, max: 1, step: 0.01, format: "fixed2" },
  { id: "parallelVoiceGain", label: "Parallel Voice", min: 0, max: 1, step: 0.01 },
  { id: "parallelFricationGain", label: "Parallel Frication", min: 0, max: 1, step: 0.01 },
  { id: "AB", label: "Bypass (AB dB)", min: -70, max: 70, step: 1 },
  { id: "AN", label: "Nasal (AN dB)", min: -70, max: 70, step: 1 },
  { id: "A1", label: "A1 (dB)", min: -70, max: 70, step: 1 },
  { id: "A2", label: "A2 (dB)", min: -70, max: 70, step: 1 },
  { id: "A3", label: "A3 (dB)", min: -70, max: 70, step: 1 },
  { id: "A4", label: "A4 (dB)", min: -70, max: 70, step: 1 },
  { id: "A5", label: "A5 (dB)", min: -70, max: 70, step: 1 },
  { id: "A6", label: "A6 (dB)", min: -70, max: 70, step: 1 },
  { id: "F1", label: "F1 (Hz)", min: 200, max: 1000, step: 1 },
  { id: "F2", label: "F2 (Hz)", min: 500, max: 2500, step: 1 },
  { id: "F3", label: "F3 (Hz)", min: 1500, max: 3500, step: 1 },
  { id: "B1", label: "B1 (Hz)", min: 30, max: 200, step: 1 },
  { id: "B2", label: "B2 (Hz)", min: 40, max: 300, step: 1 },
  { id: "B3", label: "B3 (Hz)", min: 60, max: 400, step: 1 },
  { id: "FNZ", label: "Nasal Zero (FNZ)", min: 100, max: 1000, step: 1 },
  { id: "BNZ", label: "Nasal Zero BW", min: 50, max: 500, step: 1 },
  { id: "FNP", label: "Nasal Pole (FNP)", min: 100, max: 1000, step: 1 },
  { id: "BNP", label: "Nasal Pole BW", min: 50, max: 500, step: 1 },
];

export function renderControls() {
  for (const spec of controlSpec) {
    const wrapper = document.createElement("div");
    wrapper.className = "control";
    const label = document.createElement("label");
    label.textContent = spec.label;
    const input = document.createElement("input");
    input.type = "range";
    input.min = spec.min;
    input.max = spec.max;
    input.step = spec.step;
    input.id = spec.id;
    const value = document.createElement("div");
    value.className = "value";
    value.id = `${spec.id}-value`;
    wrapper.append(label, input, value);
    state.controls.append(wrapper);
  }
}

export function formatValue(spec, value) {
  if (spec.format === "fixed4") return Number(value).toFixed(4);
  if (spec.format === "fixed2") return Number(value).toFixed(2);
  if (spec.format === "fixed0") return Number(value).toFixed(0);
  return Number(value).toFixed(2);
}

export function getSemanticsDefault(paramName, fallback) {
  const entry = state.newRuntimeSemantics?.params?.[paramName];
  return entry?.default ?? fallback;
}

// Build an object of current slider values for use by diagnostics helpers
export function getCurrentSliderParams() {
  const params = {};
  for (const spec of controlSpec) {
    const input = document.getElementById(spec.id);
    if (input) params[spec.id] = Number(input.value);
  }
  return params;
}

export function bindControls() {
  // Default slider values: use semantics when available, otherwise midpoint
  const sliderDefaults = {
    f0: 110, rd: 1.0, lfMode: 1, sourceMode: 1, openPhaseRatio: 0.7,
    voiceGain: 1, noiseGain: 0, noiseCutoff: 4000, fricationCutoff: 5000,
    masterGain: 1, parallelMix: 0, parallelGainScale: 1, parallelVoiceGain: 0,
    parallelFricationGain: 0, AB: -70, AN: -70,
    A1: -70, A2: -70, A3: -70, A4: -70, A5: -70, A6: -70,
    F1: 500, F2: 1500, F3: 2500, B1: 60, B2: 90, B3: 150,
    FNZ: 280, BNZ: 90, FNP: 280, BNP: 90,
  };

  for (const spec of controlSpec) {
    const input = document.getElementById(spec.id);
    const value = document.getElementById(`${spec.id}-value`);
    const initial = getSemanticsDefault(spec.id, sliderDefaults[spec.id] ?? spec.min);
    input.value = initial;
    value.textContent = formatValue(spec, initial);
    input.addEventListener("input", () => {
      const v = Number(input.value);
      value.textContent = formatValue(spec, v);
    });
  }
}

export function applyUrlParams() {
  const params = new URLSearchParams(window.location.search);

  // Apply phrase
  if (params.has('phrase')) {
    document.getElementById('phrase').value = params.get('phrase');
  }

  // Apply baseF0
  if (params.has('baseF0')) {
    const val = Number(params.get('baseF0'));
    if (Number.isFinite(val)) {
      document.getElementById('baseF0').value = val;
    }
  }

  // Apply slider controls
  for (const spec of controlSpec) {
    if (params.has(spec.id)) {
      const val = Number(params.get(spec.id));
      if (Number.isFinite(val) && val >= spec.min && val <= spec.max) {
        const input = document.getElementById(spec.id);
        const valueEl = document.getElementById(`${spec.id}-value`);
        if (input) {
          input.value = val;
          if (valueEl) valueEl.textContent = formatValue(spec, val);
        }
      }
    }
  }

}
