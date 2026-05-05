// test/harness/state.js — Shared mutable state object
// All modules import `state` and read/write properties directly.

export const state = {
  // Audio
  ctx: new AudioContext(),
  WORKLET_BASE_PATH: `${import.meta.env.BASE_URL}worklets/`,

  // Runtime instances
  newRuntime: null,
  newRuntimeInitPromise: null,
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

  // PLSTEP
  plstepEvents: [],
  plstepTotalCount: 0,

  // Diagnostics
  lastDiagnostics: "",

  // Diagnostics engine
  diagEngine: null,
  diagConfig: null,
  useEngineOutput: false,

  // Play history
  playHistory: [],
  MAX_PLAY_HISTORY: 5,
};

state.specCtx = state.specCanvas?.getContext("2d");

// Expose for console debugging
window.__qlatt = state;
