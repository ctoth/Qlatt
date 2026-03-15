# Tier 4-2 ndbScale Report: PFE Amplitude Computation

## Summary

Replaced the formant bank codegen layer (proximity correction rules + static ndbScale-based `a{N}Linear` realize rules) with evaluator-native PFE (Partial Fraction Expansion) amplitude computation. The topological evaluator now computes `a{N}Linear` values directly per-frame using `resonatorMagnitudeDb()`, which calculates the actual transfer function magnitude of each resonator at every other formant's frequency.

## Citations

- Lin 1995 (Partial Fraction Expansion for parallel formant amplitude correction)
- Klatt 1980 (original synthesizer specification)

## Files Changed

### `src/builtin-functions.ts` (lines 89-127 added)
- Added `resonatorMagnitudeDb(evalFreq, poleFreq, poleBW, sampleRate)` function
- Computes magnitude (in dB) of a 2-pole digital resonator at a given evaluation frequency
- Uses z-transform pole distance method: evaluates `|H(e^jw)|^2 = 1/(d1sq * d2sq)` where d1, d2 are distances from evaluation point to conjugate pole pair
- All existing functions (ndbScale, proximity, dbToLinear, etc.) preserved for legacy synth

### `src/semantics/register-builtins.ts` (lines 10, 59-69 added)
- Imported `resonatorMagnitudeDb` from builtin-functions
- Registered `resonatorMagnitudeDb` as a CEL function with arity 4
- All existing registrations preserved (including `proximity`)

### `src/semantics/types.ts` (lines 32-47 added)
- Added `FormantBankFormantSpec` interface (index, freqDefault, bwDefault, ndbScale, sign, parallelSource)
- Added `FormantBankEvalSpec` interface (formants array)
- Added `formantBanks?: Record<string, FormantBankEvalSpec>` to `SemanticsDocument`

### `src/formant-bank.ts` (lines 184-205, was 184-267)
- **KEPT**: Graph topology expansion (cascade resonators, parallel resonators + gains, cascade chain, parallel channels) — lines 72-152
- **KEPT**: Semantics param generation (F{N}, B{N}, A{N}) — lines 154-182
- **REMOVED**: ndbScale constant generation (old lines 184-196)
- **REMOVED**: Proximity correction rule generation (old lines 199-213)
- **REMOVED**: Parallel amplitude linear rule generation (old lines 215-262)
- **ADDED**: Bank spec preservation — copies formant specs to `semantics.formantBanks` for evaluator-native PFE computation (lines 184-200)
- Fixed destructuring from `[, bank]` to `[bankName, bank]` to capture bank name

### `src/semantics/topological-evaluator.ts` (lines 7, 98-125 added)
- Imported `resonatorMagnitudeDb` and `dbToLinear` from builtin-functions
- Added PFE amplitude computation block after normal realize rule evaluation
- For each formant bank, iterates all formants with parallel sources
- Computes inter-formant correction: sum of `resonatorMagnitudeDb(evalFreq, otherFreq, otherBw, sr)` over all other formants
- Applies: `a{N}Linear = sign * dbToLinear(A{N} + correctionDb + ndbScale) * parallelScale`
- Uses `sampleRate` from the evaluation result (semantics param, default 48000)

### `test/resonator-magnitude-pfe.test.ts` (new file, 13 tests)
- Unit tests for `resonatorMagnitudeDb()`: peak at pole frequency, approximate gain formula, DC/Nyquist rolloff, symmetry, bandwidth effect
- PFE regression tests: corrections at default formant positions vs old static ndbScale values
- Proximity subsumption tests: large correction for close formants, small for distant

### `test/proximity-from-semantics.test.ts` (rewritten, 5 tests)
- Updated to verify the new PFE path instead of old proximity correction rules
- Tests: a{N}Linear values produced for all parallel formants, values are finite, sign alternation respected, PFE correction increases for close formants, no evaluation errors

## Test Results

### New tests: 18/18 passing
- `test/resonator-magnitude-pfe.test.ts`: 13 passed
- `test/proximity-from-semantics.test.ts`: 5 passed

### Related existing tests: all passing
- `test/build-context-cleanup.test.ts`: 5 passed
- `test/evaluator-factory.test.ts`: 5 passed
- `test/graph-validation.test.ts`: 7 passed

### Full suite: 909 passed, 15 failed (all pre-existing)
Pre-existing failures (not caused by this change):
- `test/semantics/jmespath-resolver.test.ts` — missing module
- `test/audio-node-guards.test.ts` — AudioWorkletNode mock issue
- `test/coarticulation.test.ts` (4 tests) — coarticulation model issues
- `test/declarative-frontend-rulepack-*.test.ts` (4 tests) — rulepack migration issues
- `test/duration-model.test.ts` — obstruent/sonorant lengthening
- `test/prosodic-annotator.test.ts` (2 tests) — accent type assignment
- `test/yaml-frontend-config.test.ts` — transition_ms value changed

## Key Behavioral Difference: PFE vs Old Static ndbScale

The old system used static ndbScale constants (e.g., A1=-58, A2=-65) that were the same regardless of actual formant positions. The new PFE system computes corrections dynamically based on actual per-frame formant frequencies and bandwidths.

This means:
1. **Close formants**: PFE automatically produces larger corrections (subsuming the old discrete proximity correction table)
2. **Moving formants**: Corrections track formant transitions in real time
3. **All formant interactions**: Not just adjacent pairs (1-2, 2-3, 3-4) but all N*(N-1) pairs including higher formants

The `ndbScale` values from `FormantSpec` are preserved in the computation as additive offsets (`f.ndbScale`), maintaining the overall amplitude calibration.

## Commit

`0bb992d` — Replace formant bank codegen with evaluator-native PFE amplitude computation (Lin 1995)
