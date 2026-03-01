# Diagnostics Bug Fixes — Progress Notes

**Goal**: Fix 6 issues found in 50-second passage diagnostics. Red-green test-first.

## Status

- [x] Fix 1: Antiresonator bypass at freq=0 (AUDIO BUG) — `freq < 0.0` → `freq <= 0.0`
- [x] Fix 2: masterGain formula always 0 — removed broken `outputScale`, use `dbToLinear(go) * baseBoost`
- [x] Fix 3: voice/asp/fric gains missing GO — added `go` to all cascade gain formulas
- [x] Fix 4: Formant automation wrong node names — `cascade-1` → `cascadeF1` with fallback
- [x] Fix 5: PLSTEP buffer 10→50, added total counter
- [x] Fix 6: AH for HH — test passes, was purely diagnostic (masked by Fix 3)

## Follow-up Fixes

- [x] DRY: test-harness.js imported 10 functions from track-analysis.ts, deleted ~400 lines of duplicates
- [x] WASM cache-busting: `wasm-utils.ts` now appends `?v=timestamp` to all WASM fetch URLs
- [x] F0 exponential declination: linear `base - 20*t` → exponential `base * exp(-0.12*t)` (O'Shaughnessy 1976)
  - Added `exp()` to CEL: cel-expressions.ts (knownFunctions + allowedFunctions), engine.ts (implementation)
  - New `declination_tau=0.12` param in frontend.yaml, wired through tts-frontend.ts
  - prosody.yaml formula updated in both public/ and dist/
  - "hello world" F0 now: min ~97 Hz (was ~90), gentler decline
  - Golden test needs regeneration (`--write-golden 1`)

## Observations

- `antiresonator/lib.rs:33`: checks `freq < 0.0`, misses freq=0
- `track-analysis.ts:303`: `outputScale = dbToLinear(ndbScale.AF + 44) = dbToLinear(-119 + 44) = dbToLinear(-75) = 0` (below -72 floor)
- `track-analysis.ts:323-325`: gains computed without GO
- `test-harness.js:1547-1549`: uses `cascade-1` but runtime sends `cascadeF1`
- `test-harness.js:1454`: caps PLSTEP buffer at 10
- ndbScale.AV = -119, ndbScale.AH = -134, ndbScale.AF = -119
