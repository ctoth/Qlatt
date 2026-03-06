# Plan: Declarative Nasal Subsystem (TDD First)

Status: Proposed  
Scope: Architecture + implementation plan  
Priority: High  
Primary goal: Replace the current nasal `0 => bypass` workaround with a paper-faithful, more powerful declarative nasal subsystem that cleanly separates vowel nasalization from consonant nasal murmur.

## 1. Objective

Build a first-class nasal subsystem for Qlatt that:

1. removes the current nasal pole-zero sweep artifact at the architectural level rather than via step-scheduling band-aids,
2. matches the literature better than the current single-`FNZ` design,
3. stays declarative at the authoring surface,
4. preserves explainability through provenance and citations,
5. increases synthesis power by making nasal timing and place controllable through contours and high-level rules rather than brittle raw filter toggles.

This plan explicitly prefers the most principled and highest-leverage design over the smallest local patch.

## 2. Why The Current Design Must Change

### 2.1 Current implementation

Today the baseline runtime uses:

1. `bypassAtZero: true` on nasal nodes in `public/experiments/klatt80-baseline/graph.yaml`
2. `FNP/FNZ/BNP/BNZ = 0` defaults in `public/rules/frontends/qlatt-english/inventory.yaml`
3. step-scheduled nasal realize rules in `public/experiments/klatt80-baseline/semantics.yaml`

That architecture means “oral” is represented as “nasal nodes do not exist”, not “nasal nodes cancel acoustically”.

### 2.2 Why that is wrong

Klatt 1980 does not model oral speech by bypassing the nasal pair. It models oral speech by cancellation:

1. `FNP` is fixed for the utterance.
2. `BNP` and `BNZ` are fixed.
3. `FNZ = FNP` for non-nasal speech.

Source: `papers/Klatt_1980_CascadeParallelFormantSynthesizer/notes.md`

### 2.3 Deeper modeling error

The current frontend also conflates two different acoustic phenomena:

1. vowel nasalization:
   - Hawkins and Stevens 1985 places a pole-zero pair near `F1`
   - recommended nasal-vowel zero: `FNZ = (FNP + F1) / 2`
2. consonant nasal murmur place:
   - Fujimura 1962 identifies place-specific oral-cavity antiformants
   - `/m/` low, `/n/` mid, `/ng/` high

Those are not the same control. A single raw `FNZ` parameter should not be expected to do both jobs simultaneously.

Sources:

1. `papers/Hawkins_Stevens_1985_NasalVowelCorrelates/notes.md`
2. `papers/Fujimura_1962_NasalConsonantAnalysis/notes.md`

## 3. Design Principles

### 3.1 Declarative first

Rules and inventories should express phonetic intent, not low-level DSP accidents.

Recommended declarative controls:

1. `velopharyngealCouplingRatio` as the primary continuous scalar contour in `[0, 1]`
2. `nasalCoupling` as the friendly alias if the shorter name is preferable at the rule-authoring surface
3. `nasalPlace` as a symbolic frontend feature with values `none|m|n|ng`
4. `nasalMurmurStrength` as a continuous scalar for consonant murmur prominence
5. optional `nasalOralClosure` or `oralCavityClosure` scalar if the runtime needs a more explicit murmur gate

Only the runtime/semantics layer should convert those into filter coefficients or node parameters.

Preference:

When the implementation must choose between an arbitrary synthesis knob and a physically interpretable one, prefer the physically interpretable control. The best current candidate is Feng/Rossato's coupling ratio:

`d = An / (An + Aoral)`

Sources:

1. `papers/Feng_1996_NasalVowelTarget/notes.md`
2. `papers/Rossato_1998_RecoveringGesturesNasalVowels/notes.md`

### 3.2 Separate phonetic causes

The subsystem must distinguish:

1. oral vowel / oral sonorant: cancellation state
2. nasalized vowel: gradual coupling onset with near-`F1` pole-zero effect
3. nasal consonant murmur: place-specific oral-cavity antiresonance and nasal parallel energy

Recommended frontend regime labels:

1. `oral`
2. `nasalized_vowel`
3. `nasal_murmur`

These regime labels should be treated as declarative phonetic states, not as direct DSP modes.

### 3.3 Continuous where speech is continuous

Use contours for nasal opening/closing timing. Do not step raw resonator frequencies unless the phenomenon is actually discrete.

This follows Hawkins and Stevens 1985, where nasalization is synthesized as a time-varying pole-zero trajectory rather than a binary switch.

### 3.4 Explainability is mandatory

Every non-trivial nasal decision must emit:

1. provenance with citations
2. diagnostics when values are clamped, defaulted, or fall back

Required affected systems:

1. `src/provenance.ts`
2. `src/tts-frontend-provenance.ts`
3. `src/diagnostics.ts`

### 3.5 Prefer powerful abstractions over ad hoc rule piles

The recommended end state is a dedicated nasal primitive or composite runtime block. That is more beautiful and more reusable than scattering nasal special cases across `inventory.yaml`, `formant.yaml`, and `semantics.yaml`.

## 4. Paper Model To Implement

## 4.1 Oral baseline: cancellation, not bypass

Implement the oral baseline as:

1. `FNP = nasalPoleBaseHz`
2. `BNP = nasalPoleBwHz`
3. `BNZ = nasalZeroBwHz`
4. `FNZ_core = FNP`

That reproduces Klatt 1980 oral behavior while keeping the nasal cascade pair always present.

Source:

1. `papers/Klatt_1980_CascadeParallelFormantSynthesizer/notes.md`

## 4.2 Vowel nasalization: core coupling near F1

For nasalized vowels, the core zero should move away from the pole toward a vowel-conditioned target:

`FNZ_core_target = (FNP + F1_effective) / 2`

Use `velopharyngealCouplingRatio` to interpolate between oral cancellation and the nasalized target:

`FNZ_core = lerp(FNP, FNZ_core_target, velopharyngealCouplingRatio)`

Recommended starting behavior:

1. `velopharyngealCouplingRatio = 0`: exact oral cancellation
2. `velopharyngealCouplingRatio = 1`: full nasal-vowel target
3. transition duration controlled declaratively by contour rules, not by runtime hacks

Sources:

1. `papers/Hawkins_Stevens_1985_NasalVowelCorrelates/notes.md`
2. `papers/Klatt_1980_CascadeParallelFormantSynthesizer/notes.md`
3. `papers/Feng_1996_NasalVowelTarget/notes.md`

## 4.3 Nasal consonant murmur: place-specific oral-cavity antiformant

During nasal murmur, add a second antiresonance for oral-cavity closure place:

1. `/m/`: low antiformant
2. `/n/`: mid antiformant
3. `/ng/`: high antiformant

The exact starter targets should come from frontend policy constants sourced from Fujimura 1962 and Stevens 1998, with any chosen defaults labeled explicitly if they are smoothed or speaker-normalized.

Sources:

1. `papers/Fujimura_1962_NasalConsonantAnalysis/notes.md`
2. `papers/Stevens_1998_AcousticPhonetics/notes.md`

## 4.4 Secondary cues

The subsystem should support, but not reduce nasality to, these secondary cues:

1. `B1` widening
2. F1 prominence reduction / local spectral flattening
3. modest overall level reduction
4. stronger parallel nasal murmur contribution (`AN`)
5. context-appropriate center-of-gravity movement in the low-frequency vowel region

Sources:

1. `papers/House_Stevens_1956_NasalizationVowels/notes.md`
2. `papers/Maeda_1982_VowelNasalizationCues/notes.md`
3. `papers/Hawkins_Stevens_1985_NasalVowelCorrelates/notes.md`
4. `papers/Chen_1997_NasalizedVowelAcoustics/notes.md`
5. `papers/Beddor_1986_NasalVowelHeight/notes.md`

Important constraint:

The plan should not stop at `B1 *= 2`. House and Stevens 1956 and Maeda 1982 both argue that the cue is broader than bandwidth inflation alone.

## 5. Recommended Architecture

## 5.1 New runtime abstraction

Create a dedicated runtime unit for nasality, either:

1. a new composite primitive `nasal-tract`, preferred, or
2. a graph-level reusable block assembled from smaller primitives with a single declarative binding surface

Recommendation: choose option 1.

Reason:

1. It localizes nasal DSP semantics.
2. It exposes a clean declarative API.
3. It prevents future rule authors from directly manipulating unstable low-level nodes.
4. It gives room to model both vowel nasalization and consonant nasal murmur in one explainable unit.

## 5.2 Primitive interface

Recommended exposed params:

1. `velopharyngealCouplingRatio`
2. `F1`
3. `nasalPlaceIndex`
4. `nasalMurmurStrength`
5. `nasalPoleBaseHz`
6. `nasalPoleBwHz`
7. `nasalZeroBwHz`
8. `nasalPlaceMFnzHz`
9. `nasalPlaceNFnzHz`
10. `nasalPlaceNgFnzHz`
11. optional place-specific bandwidth controls
12. optional `nasalFlattening` or `f1NasalAttenDb` if phase 2 adds local spectral shaping

Recommended debug / telemetry outputs:

1. `effectiveCoupling`
2. `coreFnz`
3. `coreFnp`
4. `placeFnz`
5. `placeBnz`
6. `nasalRegime`

These should be exposed at least to provenance/diagnostic tooling, even if not to end-user track frames.

Internal behavior:

1. core cascade pole/zero pair always active
2. oral state implemented as cancellation
3. nasal-vowel state implemented by moving the core zero relative to `F1`
4. consonant murmur place implemented by a separate oral-cavity antiresonance path
5. parallel nasal branch remains available for `AN`

## 5.3 Why a dedicated primitive is better than “just change semantics”

Semantics-only cancellation is enough to remove the gross artifact, but it is not enough to express the two-layer nasal model cleanly.

A dedicated primitive gives:

1. cleaner declarative parameters
2. fewer fragile graph-level invariants
3. better diagnostics
4. a reusable surface for future nasal vowels, coarticulation, and multilingual work

## 5.4 Default Sound Targets

The implementation should not only define parameter defaults; it should define what those defaults are expected to sound like.

### Default control values

Recommended baseline defaults:

1. `velopharyngealCouplingRatio = 0`
2. `nasalPlaceIndex = none`
3. `nasalMurmurStrength = 0`
4. `nasalPoleBaseHz = 250`
5. `nasalPoleBwHz = 100`
6. `nasalZeroBwHz = 100`
7. consonant murmur place targets:
   - `/m/`: ~1000 Hz
   - `/n/`: ~1700 Hz
   - `/ng/`: ~3000 Hz
8. anticipatory nasalization timing:
   - onset delay: ~40 ms
   - rise time: ~40 ms
9. first-pass secondary cue baseline:
   - `B1` nasal addition: ~107 Hz

Sources:

1. `papers/Klatt_1980_CascadeParallelFormantSynthesizer/notes.md`
2. `papers/Hawkins_Stevens_1985_NasalVowelCorrelates/notes.md`
3. `papers/Chen_1997_NasalizedVowelAcoustics/notes.md`
4. `papers/Fujimura_1962_NasalConsonantAnalysis/notes.md`

### What should sound different from the current system

The new defaults should produce these audible changes:

1. no sweep artifact when entering or leaving nasals
2. vowels before nasals acquire nasality gradually rather than flipping at the boundary
3. `/m/`, `/n/`, and `/ng/` have clearly different murmur color
4. oral vowels adjacent to nasals remain more stable and less accidentally muffled
5. nasal murmur has a real resonant body, not just a bandwidth hack or moving notch

### What should not change

The new defaults should NOT cause:

1. ordinary non-nasal vowels to sound unintentionally nasal
2. unrelated consonant classes to change outside nasal contexts
3. authoring complexity to increase at the rule-writing surface

### First listening targets

These phrases should be used as explicit listening references during development:

1. `nina`
   - first vowel should gently nasalize before `/n/`
2. `many`
   - `/m/` and `/n/` should sound categorically different in murmur quality
3. `singing`
   - `/ng/` should have a distinct back/velar murmur quality
4. `an ember`
   - cross-word anticipatory nasalization should be smooth, not stepped

### Acoustic acceptance intent

The defaults do not need to match every paper value exactly on day one, but they should be good enough that:

1. the output is clearly closer to paper-grounded nasal acoustics than the current bypass system
2. Chen-style amplitude relations and House/Maeda-style low-frequency flattening move in the correct direction
3. Beddor-style coupling-strength differences remain possible to express without redesigning the control surface

## 6. Declarative Surface

## 6.1 Inventory changes

Stop storing raw low-level nasal filter parameters in the phone inventory as first-class phone targets.

Remove from `public/rules/frontends/qlatt-english/inventory.yaml`:

1. `FNP`
2. `FNZ`
3. `BNP`
4. `BNZ`

Replace with phonetic features:

1. `nasal_place: m|n|ng`
2. `nasal_segment: true|false`
3. optional `nasal_murmur_strength`
4. optional `nasal_vowel_ready: true|false` for rulepack convenience
5. optional `nasal_regime: oral|nasalized_vowel|nasal_murmur`

Inventory should keep `AN` if it remains a useful direct parallel-amplitude target, but the long-term preference is to derive `AN` from higher-level nasal controls in semantics or rules.

## 6.2 Frontend policy changes

Add a dedicated nasal policy block in `public/rules/frontends/qlatt-english/frontend.yaml`:

```yaml
parameters:
  policy:
    nasal:
      pole_base_hz:
        value: 250
        citations:
          - Klatt 1980 Table I
      pole_bw_hz:
        value: 100
        citations:
          - Klatt 1980 Table I
      zero_bw_hz:
        value: 100
        citations:
          - Klatt 1980 Table I
      vowel_onset_delay_ms:
        value: 40
        citations:
          - Hawkins & Stevens 1985
      vowel_ramp_ms:
        value: 40
        citations:
          - Hawkins & Stevens 1985
      murmur_fnz_m_hz:
        value: 1000
        citations:
          - Fujimura 1962
      murmur_fnz_n_hz:
        value: 1700
        citations:
          - Fujimura 1962
      murmur_fnz_ng_hz:
        value: 3000
        citations:
          - Fujimura 1962
```

If any values differ from raw paper table values because of speaker normalization, interpolation smoothing, or synthesis constraints, mark them explicitly as engineering estimates with the source of the directionality.

## 6.3 Rulepack changes

In `public/rules/frontends/qlatt-english/phases/formant.yaml`:

1. remove direct `params.FNZ` rewriting for nasal place
2. remove direct coupling of “nasality” to only `params.B1`
3. add scalar rules that assign:
   - `params.nasalPlaceIndex`
   - `params.nasalMurmurStrength`
4. add contour or point rules that write `nasalCoupling` trajectories for:
   - anticipatory nasalization before nasal consonants
   - sustained nasal murmur over nasal segments
   - decay after nasal release

Tags to require:

1. `nasal_place`
2. `nasal_coupling`
3. `nasal_murmur`
4. `nasalization_secondary_cue`

Each rule must carry citations.

## 6.4 Contour strategy

Use declarative contour technology for timing.

Recommended pattern:

1. before a nasal consonant:
   - vowel gets a rising `nasalCoupling` contour
2. during nasal consonant:
   - `nasalCoupling` near max
   - `nasalMurmurStrength` near max
3. after nasal consonant:
   - `nasalCoupling` decays back to oral baseline

This is preferable to editing raw frame-by-frame `FNZ` values directly in rules because it preserves a high-level articulatory interpretation.

## 7. Semantics And Graph Changes

## 7.1 Semantics changes

In `public/experiments/klatt80-baseline/semantics.yaml`:

1. deprecate `FNZ/FNP/BNZ/BNP` as author-facing frontend params
2. add high-level params:
   - `nasalCoupling`
   - `nasalPlaceIndex`
   - `nasalMurmurStrength`
3. keep low-level realized values if the runtime still needs them internally:
   - `nasalCoreFnz`
   - `nasalCoreFnp`
   - `nasalCoreBnz`
   - `nasalCoreBnp`
   - `nasalPlaceFnz`
   - optional `nasalPlaceBnz`
4. remove the current step-scheduled nasal realize band-aid once the new model is in place

Recommended realize rules:

1. `nasalCoreFnp = nasalPoleBaseHz`
2. `nasalCoreBnp = nasalPoleBwHz`
3. `nasalCoreBnz = nasalZeroBwHz`
4. `nasalCoreFnzTarget = (nasalCoreFnp + F1) / 2`
5. `nasalCoreFnz = nasalCoreFnp + (nasalCoreFnzTarget - nasalCoreFnp) * nasalCoupling`
6. `nasalPlaceFnz = dispatch(nasalPlaceIndex)`

These rules should all include citations in comments or metadata matching project standard.

## 7.2 Graph changes

In `public/experiments/klatt80-baseline/graph.yaml`:

1. remove nasal `bypassAtZero: true` from the steady-state nasal path
2. either:
   - replace `np` + `nz` with the new composite primitive, preferred, or
   - keep them as implementation details inside the composite primitive
3. add a separate place antiresonator for nasal murmur if the chosen primitive is built from graph nodes rather than monolithic DSP

Important rule:

Oral speech must no longer rely on frequency `0` as an on/off switch for nasal filters.

## 7.3 Secondary-cue support

Phase 1 should support:

1. `B1` widening as a function of `nasalCoupling`
2. increased `AN` or nasal parallel contribution for nasal murmur

Phase 2 should consider:

1. a local F1 attenuation or flattening control if the current topology cannot reproduce House/Stevens and Maeda cues convincingly with pole-zero motion alone

This phase is explicitly optional for the first merge, but it should be planned, not ignored.

## 8. Provenance And Diagnostics Requirements

## 8.1 Provenance

Add decision records for:

1. oral cancellation baseline chosen
2. nasal place assignment
3. anticipatory nasalization contour insertion
4. nasal coupling target derivation from `F1`
5. any fallback from missing place data to default values

Suggested stages:

1. `rules`
2. `semantics`
3. `runtime`

Suggested decision types:

1. `nasal_place_assigned`
2. `nasal_coupling_contour_applied`
3. `nasal_core_zero_derived`
4. `nasal_murmur_antiformant_derived`
5. `nasal_fallback_applied`

## 8.1.1 Locked provenance vocabulary

The implementation should not invent nasal provenance event names ad hoc. Use the following event vocabulary as the default contract.

### Rules-stage decision types

1. `nasal_regime_selected`
   - subject: token or token group
   - reason: declarative rule chose `oral`, `nasalized_vowel`, or `nasal_murmur`
2. `nasal_place_assigned`
   - subject: token
   - reason: nasal place set to `m`, `n`, or `ng`
3. `nasal_coupling_contour_applied`
   - subject: token span or contour token
   - reason: anticipatory, sustained, or decay contour inserted
4. `nasal_secondary_cue_applied`
   - subject: token
   - reason: secondary cue such as `B1` widening or murmur gain applied

### Semantics-stage decision types

1. `nasal_core_zero_target_derived`
   - subject: frame or realized param
   - reason: target zero derived from `F1` and the nasal pole
2. `nasal_core_zero_derived`
   - subject: frame or realized param
   - reason: effective core zero derived from target plus coupling ratio
3. `nasal_murmur_antiformant_derived`
   - subject: frame or realized param
   - reason: place-specific antiformant selected or interpolated
4. `nasal_legacy_param_mapped`
   - subject: frame or param
   - reason: deprecated raw nasal params mapped into the new subsystem during migration only

### Runtime-stage decision types

1. `nasal_runtime_binding_applied`
   - subject: node or primitive param
   - reason: realized nasal values bound onto the runtime primitive
2. `nasal_runtime_mode_applied`
   - subject: primitive instance
   - reason: runtime entered oral cancellation, vowel nasalization, or murmur-emphasis behavior

### Cross-stage fallback decision types

1. `nasal_fallback_applied`
   - subject: token, frame, or param
   - reason: missing data, unsupported place, or temporary compatibility path forced a fallback

### Provenance field expectations

Every nasal provenance event should include:

1. `stage`
2. `type`
3. `subject`
4. `reason`
5. `citations`
6. `parents` where applicable

Preferred parent linkage:

1. `nasal_regime_selected` -> parent phonological/inventory choice
2. `nasal_place_assigned` -> parent inventory selection or assimilation rule
3. `nasal_coupling_contour_applied` -> parent regime selection
4. `nasal_core_zero_target_derived` -> parent contour + regime selection
5. `nasal_core_zero_derived` -> parent target derivation
6. `nasal_runtime_binding_applied` -> parent semantics derivation

### Minimal reason-string pattern

To keep provenance readable and consistent, use the pattern:

`<mechanism> because <trigger> (tag: <tag-name>)`

Example:

`nasal coupling contour inserted because vowel precedes alveolar nasal (tag: nasal_coupling)`

## 8.2 Diagnostics

Emit diagnostics when:

1. `nasalCoupling` is clamped outside `[0, 1]`
2. `nasalPlaceIndex` is unknown
3. `F1` is missing when computing a vowel nasalization target
4. place antiformant defaults are used
5. the runtime disables place murmur because the primitive is absent or unsupported

## 8.2.1 Locked diagnostic codes

Use stable nasal diagnostic codes rather than free-text-only warnings.

Recommended codes:

1. `W_NASAL_COUPLING_CLAMPED`
   - `velopharyngealCouplingRatio` outside `[0,1]`
2. `W_NASAL_UNKNOWN_PLACE`
   - unknown or unsupported `nasalPlaceIndex`
3. `W_NASAL_F1_MISSING`
   - `F1` unavailable when deriving vowel nasalization target
4. `W_NASAL_PLACE_DEFAULT_USED`
   - place antiformant default substituted
5. `W_NASAL_LEGACY_PARAM_USED`
   - deprecated raw nasal param path hit during migration
6. `W_NASAL_RUNTIME_DEGRADED`
   - primitive or graph cannot realize full nasal behavior and falls back
7. `I_NASAL_RUNTIME_BOUND`
   - optional info event when realized values are bound for debug tracing

Diagnostic payload should include, where relevant:

1. offending param name
2. offending value
3. clamped value
4. token or frame identifier
5. fallback/default that was chosen
6. citations if the fallback is paper-justified

## 9. TDD Strategy

All substantive implementation phases should follow red -> green -> refactor.

## 9.1 Phase 0 test scaffolding

Before any implementation:

1. add failing tests for the desired declarative surface
2. add regression tests that lock in the existing artifact-producing behavior only where needed to prove we changed it intentionally
3. add or expand analysis scripts in `scripts/` for repeatable nasal inspection

Recommended new script:

1. `scripts/nasal-report.ts`

Responsibilities:

1. render phrase track summaries for nasal phrases
2. dump realized nasal params over time
3. optionally compute simple trajectory metrics:
   - continuity
   - maximum derivative
   - time spent in cancellation
   - place antiformant occupancy

This follows the repository rule to script repeatable inspection work instead of using shell one-liners.

## 9.2 Test files to extend

Primary:

1. `test/declarative-frontend-rulepack-context.test.ts`
2. `test/declarative-frontend-contour.test.ts`
3. `test/track-assembler.test.ts`
4. `test/semantics/topological-evaluator.test.ts`
5. `test/semantics/klatt-runtime.test.ts`
6. `test/klatt-interpreter.test.ts`
7. `test/provenance-middleware.test.ts`
8. `test/declarative-frontend-integration-diagnostics.test.ts`
9. `test/tts-frontend-declarative-corpus.test.ts`
10. `test/tts-frontend-declarative-golden-summary.test.ts`

Optional new dedicated files:

1. `test/nasal-subsystem.test.ts`
2. `test/nasal-runtime-primitive.test.ts`
3. `test/nasal-provenance.test.ts`

## 9.3 Red tests to add first

### Declarative frontend tests

1. `assigns nasalPlaceIndex declaratively for M N NG`
2. `does not emit raw FNZ rewrites for nasal place rules`
3. `applies anticipatory nasalCoupling contour to vowel before nasal`
4. `keeps nasalCoupling at zero for non-nasal contexts`
5. `preserves phrase-local contour timing across word boundaries and silence`

### Semantics tests

1. `oral baseline realizes nasalCoreFnz equal to nasalCoreFnp`
2. `nasalCoupling=1 realizes nasalCoreFnz toward (FNP + F1)/2`
3. `unknown nasalPlaceIndex falls back with diagnostic`
4. `nasal coupling outputs are finite and dependency-ordered`

### Runtime tests

1. `nasal primitive cancels in oral state without bypass`
2. `nasal primitive exposes separate place antiformant path`
3. `parameter updates do not require step scheduling to avoid sweeps`

### Provenance / diagnostics tests

1. `records nasal_place_assigned with citations`
2. `records nasal_core_zero_derived with citations`
3. `emits clamp/default diagnostics for invalid nasal controls`
4. `records nasal_regime_selected with citations`
5. `records nasal_coupling_contour_applied with correct parent linkage`
6. `emits W_NASAL_LEGACY_PARAM_USED when compatibility path is exercised`
7. `emits W_NASAL_COUPLING_CLAMPED on out-of-range coupling values`

### Corpus / regression tests

Use phrases that isolate the three nasal regimes:

1. `nina`
2. `many`
3. `mumble`
4. `gag gang and gunk go together`
5. `say oh ee and oo again`
6. `an ember`
7. `ten mice`
8. `singing`

## 10. Implementation Phases

## 10.1 Phase 0: Design lock and audit

Deliverables:

1. this plan
2. nasal inspection script
3. failing tests
4. citation map for every new rule/constant/primitive

Acceptance criteria:

1. all intended files and new param names are agreed
2. paper-derived defaults are documented
3. every non-trivial constant has a citation or `engineering estimate` label

## 10.2 Phase 1: Declarative surface migration without final runtime cutover

Goal:

Introduce new frontend-facing controls first, while preserving temporary compatibility under the hood.

Implementation:

1. add nasal policy block
2. add `nasalCoupling`, `nasalPlaceIndex`, `nasalMurmurStrength`
3. migrate rulepack from raw `FNZ` rewrites to high-level controls
4. keep compatibility shims if needed in semantics for a short transition window

TDD:

1. frontend rulepack tests first
2. contour tests second
3. provenance tests third

Acceptance criteria:

1. no new rule writes raw `params.FNZ` for place assignment
2. nasalization timing is represented by declarative contour controls
3. `npm run explain -- "nina" --strict-citations` stays clean

## 10.3 Phase 2: Core cancellation runtime

Goal:

Replace oral bypass behavior with always-present core cancellation.

Implementation:

1. remove nasal zero-frequency `0 => bypass` oral modeling
2. implement constant core `FNP/BNP/BNZ`
3. derive `FNZ_core` from `nasalCoupling` and `F1`
4. remove step scheduling workaround for nasal core params

TDD:

1. runtime unit tests first
2. semantics realization tests second
3. interpreter scheduling test to verify no step hack is required

Acceptance criteria:

1. oral state uses cancellation, not bypass
2. no semantic requirement remains that `FNZ=0` or `FNP=0`
3. nasal sweep artifact cannot recur through ordinary ramped coupling trajectories

## 10.4 Phase 3: Nasal consonant murmur place path

Goal:

Add separate place-specific oral-cavity antiresonance.

Implementation:

1. add separate place antiformant inside the nasal primitive or block
2. drive it from `nasalPlaceIndex` and `nasalMurmurStrength`
3. keep it independent from the vowel nasalization zero

TDD:

1. `/m/`, `/n/`, `/ng/` placement tests
2. context-fallback tests
3. regression tests ensuring vowel nasalization rules do not overwrite consonant murmur place

Acceptance criteria:

1. consonant place is represented separately from vowel nasal coupling
2. `/m/`, `/n/`, `/ng/` have distinct realized place antiformant targets

## 10.5 Phase 4: Secondary cue enrichment

Goal:

Move beyond the current `B1` hack while staying paper-grounded.

Implementation order:

1. `B1` widening as a function of `nasalCoupling`
2. stronger nasal parallel contribution for murmur
3. optional local F1 attenuation / flattening control if needed after listening and analysis

TDD:

1. tests for `B1` coupling behavior
2. tests for `AN` / murmur strength mapping
3. optional tests for local flattening control if implemented

Acceptance criteria:

1. `B1` cue is no longer the only nasalization mechanism
2. secondary cues are additive to the pole-zero model, not substitutes for it

## 10.6 Phase 5: Cleanup and deletion

Delete:

1. old nasal step-scheduling realize rules
2. old raw-`FNZ` place assignment rules
3. legacy inventory low-level nasal defaults that only existed for bypass mode

Acceptance criteria:

1. no dead compatibility path remains
2. no uncited nasal rules remain
3. diagnostics and provenance describe only the new architecture

## 11. Migration Notes

## 11.1 Backward compatibility

For a short migration window, semantics may accept both:

1. new high-level nasal controls
2. old raw `FNZ/FNP/BNZ/BNP`

But this must be temporary and diagnostic-backed.

Required diagnostic:

1. `W_NASAL_LEGACY_PARAM_USED`

## 11.2 Explainability migration

During compatibility mode:

1. provenance should explicitly record when legacy raw params are mapped into the new subsystem
2. strict-citation mode should still pass

## 12. Verification Checklist

## 12.1 Targeted tests

Run at each phase:

```bash
npx vitest test/declarative-frontend-rulepack-context.test.ts
npx vitest test/declarative-frontend-contour.test.ts
npx vitest test/semantics/topological-evaluator.test.ts
npx vitest test/semantics/klatt-runtime.test.ts
npx vitest test/klatt-interpreter.test.ts
npx vitest test/provenance-middleware.test.ts
```

## 12.2 Explainability checks

```bash
npm run explain -- "nina mumbled many minimal numbers" --strict-citations
npm run explain -- "gag gang and gunk go together" --strict-citations
```

Review:

1. `nasal_place_assigned`
2. `nasal_coupling_contour_applied`
3. `nasal_core_zero_derived`
4. `nasal_murmur_antiformant_derived`

## 12.3 Corpus and golden checks

```bash
npx vitest test/tts-frontend-declarative-corpus.test.ts
npx vitest test/tts-frontend-declarative-golden-summary.test.ts
npm run test:golden
```

## 12.4 Scripted nasal inspection

```bash
npx tsx scripts/nasal-report.ts --phrase "nina mumbled many minimal numbers"
npx tsx scripts/nasal-report.ts --phrase "gag gang and gunk go together"
```

The script should report at least:

1. per-frame `nasalCoupling`
2. realized core zero trajectory
3. realized place antiformant trajectory
4. diagnostics/provenance summaries

## 13. Acceptance Criteria

This plan is complete when the implementation satisfies all of the following:

1. oral speech no longer uses nasal filter bypassing as its ordinary representation
2. vowel nasalization and consonant nasal murmur are modeled as separate controls
3. rules author nasal behavior declaratively through contours and high-level nasal features
4. the runtime exposes a clean nasal abstraction rather than scattering nasal assumptions across unrelated files
5. all new rules, policy values, semantics formulas, and primitive docs carry citations
6. provenance answers “why is this segment nasalized?” with stage, rule, tag, and citations
7. diagnostics report clamping, fallback, and legacy-param usage
8. the old step-scheduling nasal workaround is removed

## 14. Risks And Mitigations

1. Risk: the new primitive is more work than a semantics-only fix.
   Mitigation: that is intentional; phase the work and keep Phase 1 compatibility short.
2. Risk: exact numeric mappings from articulatory coupling to acoustic parameters are underdetermined.
   Mitigation: use paper-grounded defaults, mark speaker-normalized values as engineering estimates, and keep them policy-tunable.
3. Risk: the current topology may not reproduce the full flattening cue with pole-zero movement alone.
   Mitigation: plan Phase 4 explicitly instead of pretending the current B1 hack is sufficient.
4. Risk: migration complexity could leave dead paths.
   Mitigation: Phase 5 is mandatory cleanup, not optional polish.

## 15. Deferred But Intentionally Tracked

These are not required for the first merge, but the design should not block them:

1. multilingual nasal policy packs
2. vowel-quality-dependent nasal coupling strength
3. speaker-normalized place antiformant tables
4. automated acoustic analysis comparing nasal spectral flattening across corpora
5. a richer nasal tract primitive with sinus side-branch modeling if later papers justify it

## 16. Sources

Primary sources for this plan:

1. `papers/Klatt_1980_CascadeParallelFormantSynthesizer/notes.md`
2. `papers/Hawkins_Stevens_1985_NasalVowelCorrelates/notes.md`
3. `papers/House_Stevens_1956_NasalizationVowels/notes.md`
4. `papers/Fujimura_1962_NasalConsonantAnalysis/notes.md`
5. `papers/Maeda_1982_VowelNasalizationCues/notes.md`
6. `papers/Stevens_1998_AcousticPhonetics/notes.md`
7. `papers/Fant_1960_AcousticTheorySpeechProduction/notes.md`

Current implementation references:

1. `public/experiments/klatt80-baseline/graph.yaml`
2. `public/experiments/klatt80-baseline/semantics.yaml`
3. `public/rules/frontends/qlatt-english/inventory.yaml`
4. `public/rules/frontends/qlatt-english/frontend.yaml`
5. `public/rules/frontends/qlatt-english/phases/formant.yaml`
6. `src/tts-frontend-provenance.ts`
7. `src/diagnostics.ts`
