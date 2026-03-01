# Notes: Remove KlattSynth from Test Harness

## Goal
Remove all KlattSynth usage from test harness. Keep klatt-synth.ts file itself.

## Key findings from reading the code

### `synth` usage locations:
1. **Line 1**: `import { KlattSynth }`
2. **Line 21**: `const synth = new KlattSynth(ctx);`
3. **Line 145-146**: `bindControls()` reads `synth.params[spec.id]` for initial values
4. **Line 151**: `synth.setParam(spec.id, v)` on slider input
5. **Line 157**: `await synth.initialize()` in `start()`
6. **Line 192**: `await synth.initialize()` in legacy speak path
7. **Lines 191-243**: Entire legacy speak path
8. **Line 248-251**: `getSelectedRuntime()` reads radio buttons
9. **Line 591**: `synth.setParam(spec.id, val)` in `applyUrlParams()`
10. **Line 609**: `synth.setTelemetryHandler(handleTelemetry)` in IIFE
11. **Line 610**: `await synth.initialize()` in IIFE
12. **Line 611**: `attachMeters()` in IIFE (legacy meters)
13. **Line 655**: `synth.nodes.masterGain.connect(specState.analyser)` in `attachSpectrogram()`
14. **Line 1269**: `synth.params.lfMode` fallback in `buildDiagnostics()`
15. **Line 1272**: `synth.params.f0` fallback
16. **Line 1275-1281**: `synth.params.F1/F2/F3` fallbacks
17. **Line 1287**: `analyzeTrackGains(track, synth.params)`
18. **Line 1342-1343**: `synth.params.FNZ/BNZ/FNP/BNP` in bypass check
19. **Line 1380**: `formatGainDerivation(track, synth.params)`
20. **Line 1395-1423**: `attachMeters()` function uses `synth.nodes`

## Done
- [x] index.html: remove runtime radio fieldset
- [x] Remove import + instantiation
- [x] Delete getSelectedRuntime(), attachMeters()
- [x] Simplify speak() to always use declarative
- [x] Update start()
- [x] Update attachSpectrogram() to defer connection
- [x] Update bindControls()
- [x] Update applyUrlParams()
- [x] Update buildDiagnostics()
- [x] Simplify main IIFE
- [x] Remove unused imports (proximity, ndbCor)
- [x] Build verification: vite build succeeds
- [x] No remaining `synth.` references in test-harness.js (only comments, updated)
