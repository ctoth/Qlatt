// test/harness/state.js — Shared mutable state object
// All modules import `state` and read/write properties directly.

export const state = {
  // Audio
  ctx: new AudioContext(),
  WORKLET_BASE_PATH: `${import.meta.env.BASE_URL}worklets/`,

  // Runtime instances
  newRuntime: null,
  newInterpreter: null,
  newRuntimeGraph: null,
  newRuntimeSemantics: null,
  newRuntimeRegistry: null,

  // Experiment
  currentExperimentId: null,
  experimentManifest: null,

  // Session
  sessionId: 0,
  lastRun: null,
  runStartTime: 0,

  // DOM elements
  status: document.getElementById("status"),
  controls: document.getElementById("controls"),
  diagnosticsEl: document.getElementById("diagnostics"),
  specCanvas: document.getElementById("spectrogram"),
  specCtx: null,

  // Spectrogram
  specState: {
    analyser: null,
    running: false,
    rafId: 0,
  },

  // Telemetry
  telemetry: new Map(),
  telemetryMax: new Map(),
  telemetryTimer: null,

  // Meters
  meters: new Map(),
  meterValues: new Map(),
  meterMax: new Map(),
  meterTimer: null,
  meterBindingMode: null,
  meterBindingOwner: null,

  // Spikes
  spikeEvents: [],
  lastSpikeAt: new Map(),
  spikeThreshold: 1.0,
  spikeCooldown: 0.2,

  // PLSTEP
  plstepEvents: [],
  plstepTotalCount: 0,

  // SW window tracking
  swWindowMax: new Map(),
  swWindowMaxTime: new Map(),

  // Diagnostics
  lastDiagnostics: "",

  // Play history
  playHistory: [],
  MAX_PLAY_HISTORY: 5,
};

state.specCtx = state.specCanvas?.getContext("2d");

// Expose for console debugging
window.__qlatt = state;
