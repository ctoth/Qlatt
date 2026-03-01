# Test Harness Breakup Notes

## Goal
Split `test/test-harness.js` (1508 lines) into 7 focused modules under `test/harness/` + slim entry point.

## Module Map (actual line counts)
- state.js — shared mutable state (74 lines)
- controls.js — controlSpec, render, bind, URL params (158 lines)
- experiment.js — manifest loading, config merge (147 lines)
- runtime.js — init, start, stop, speak (180 lines)
- spectrogram.js — attach, clear, start (47 lines)
- diagnostics.js — all format*(), buildDiagnostics, updateDiagnostics (613 lines)
- telemetry.js — handleTelemetry, meters, spikes (291 lines)
- test-harness.js — slim entry point (60 lines)
- Total: 1570 lines (original: 1508; +62 lines from import statements and module headers)

## Status
- [x] Create test/harness/ directory
- [x] Write state.js
- [x] Write controls.js
- [x] Write experiment.js
- [x] Write spectrogram.js
- [x] Write diagnostics.js
- [x] Write telemetry.js
- [x] Write runtime.js
- [x] Rewrite test-harness.js entry point
- [x] Verify Vite serves all modules (all 8 files resolve correctly)
- [x] Verify npm test passes (22 pre-existing failures, none related to harness)

## Dependency Graph (verified: no circular deps)
- state.js ← (no deps)
- controls.js ← state
- experiment.js ← state, yaml-loader
- spectrogram.js ← state
- diagnostics.js ← state, controls, track-analysis, builtin-functions
- telemetry.js ← state, diagnostics (one-way)
- runtime.js ← state, experiment, telemetry, spectrogram, diagnostics, klatt-runtime, klatt-interpreter, tts-frontend, track-analysis
- test-harness.js ← state, controls, experiment, runtime, spectrogram, diagnostics
