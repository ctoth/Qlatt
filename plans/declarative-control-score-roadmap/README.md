# Declarative Control Score Roadmap

**Status (2026-07-11): completed by supersession; historical field-vocabulary
input only.** The authoritative execution record is
`plans/declarative-frontend-hrg-convergence-plan.md`. Useful backend-neutral
fields and citations from this roadmap now live in typed HRG control relations
or final-lowering policy. The standalone score object, builder, validator,
output field, schema, flat engine, and old assembly path were deleted. Do not
execute the proposed file/phase/commit lists below; they remain only as the
historical rationale and vocabulary record that preceded the HRG decision.

## Historical Goal

Move Qlatt toward a two-layer architecture:

1. A backend-neutral declarative control score that represents linguistic and
   phonetic intent.
2. Backend adapters that realize that score into concrete parameters for
   `klatt80-baseline`, `klsyn88`, `stevens91`, and later experiments.

This is the path to higher paper fidelity without concentrating more policy in
`src/tts-frontend.ts`.

## Historical Architectural Target

### Layer 1: Control Score

The control score should carry:

- Prosodic structure: `initialBoundaryTone`, `accentType`, `phraseAccent`,
  `boundaryTone`, `downstepDomain`, `focusState`
- Alignment intent: `anchor_left`, `anchor_star`, `anchor_right`,
  compression/truncation policy
- Duration intent: lexical target, contextual scaling, boundary scaling
- Source intent: `Rd`, `RdRef`, `EePhraseDb`, `RdPhraseOffset`, `OQ`, `TL`,
  noise terms, speaker defaults
- Filter intent: vowel/formant targets, coarticulation trajectories,
  bandwidth targets

This should be a declarative intermediate representation, not a backend's raw
parameter map.

### Layer 2: Backend Adapters

Each experiment should define how it consumes the control score:

- `klatt80-baseline`: mostly direct LF/source/filter mapping
- `klsyn88`: proxy mapping to `Kopen`, `TLTdb`, classic gains, legacy B1/B2
- `stevens91`: reduced proxy mapping

The frontend should stop embedding backend-specific branches once this exists.

## Proposed Files

### New / Expanded Specs

- `public/rules/control-score.yaml`
  - Canonical schema for the control score fields and defaults.
- `public/rules/frontends/qlatt-english/policy/tune-grammar.yaml`
  - Declarative tune inventory and legal tune sequencing.
- `public/rules/frontends/qlatt-english/policy/phonetic-implementation.yaml`
  - Declarative realization of tonal targets into alignment anchors and F0
    events.
- `public/rules/policy/source-contour.yaml`
  - Declarative source dynamics (Fant-style phrase, segment, and stress rules).
- `public/rules/backend-adapters/klatt80.yaml`
  - Mapping from control score to `klatt80-baseline` params.
- `public/rules/backend-adapters/klsyn88.yaml`
  - Mapping from control score to `klsyn88` params.
- `public/rules/backend-adapters/stevens91.yaml`
  - Mapping from control score to `stevens91` params.

### Existing Runtime / Pipeline Files To Refactor

- `src/tts-frontend.ts`
  - Reduce to orchestration, policy injection, and provenance.
- `src/prosodic-annotator.ts`
  - Shrink to structural annotations only, or replace with declarative score
    generation if feasible.
- `src/track-assembler.ts`
  - Consume a score/timing IR instead of inferring contour intent from raw tags.
- `src/tts-frontend-provenance.ts`
  - Add decision records for score generation and backend adaptation.
- `public/rules/pipeline.yaml`
  - Introduce the new phases and isolate finalization from policy generation.

### Experiment Semantics To Simplify

- `public/experiments/klatt80-baseline/semantics.yaml`
  - Consume already-planned source contour fields, not generate policy.
- `public/experiments/klsyn88/semantics.yaml`
  - Remain a proxy backend, but consume the same abstract source fields.
- `public/experiments/stevens91/semantics.yaml`
  - Proxy consumption of the same score where possible.

## Proposed Schema Changes

### Control Score Token Fields

Add or standardize these frontend token fields:

- `isAccentCarrier: boolean`
- `initialBoundaryTone: string | null`
- `accentType: string | null`
- `phraseAccent: string | null`
- `boundaryTone: string | null`
- `downstepDomain: string | null`
- `focusState: "broad" | "narrow" | "given" | null`
- `alignmentPlan: object | null`
- `sourcePlan: object | null`
- `durationPlan: object | null`

### Alignment Plan Shape

```yaml
alignmentPlan:
  anchors:
    onset: sync_left
    star: { kind: ratio, value: 0.45 }
    trail: sync_right
  compression:
    strategy: compress
    min_window_ms: 40
  interpolation:
    shape: linear
```

### Source Plan Shape

```yaml
sourcePlan:
  rd:
    base: 0.7
    phrase_offset: 0.0
  ee:
    covary_with_rd: true
    phrase_db: 0.0
  explicit_overrides:
    oq: 0
    tl: 0
```

### Tune Grammar Shape

```yaml
tune_inventory:
  initial_boundaries: ["%H", null]
  pitch_accents: ["H*", "L*", "L+H*", "L*+H", "H+!H*", "H*+L", "H+L*", "H*+H"]
  phrase_accents: ["H-", "L-"]
  boundary_tones: ["H%", "L%"]

tune_templates:
  declarative_broad:
    initial: null
    prenuclear: ["L+H*", "H+!H*"]
    nuclear: ["H*", "H*+L"]
    phrase_accent: "L-"
    boundary: "L%"
```

## Phase-by-Phase Migration

### Phase 1: Control Score Spec

Objective:
Create the canonical control-score schema without changing output behavior.

Changes:

- Add `public/rules/control-score.yaml`
- Add typed helpers in `src/tts-frontend-types.ts` for score-bearing tokens
- Add provenance event types for score creation

Success criteria:

- Existing pipeline still produces identical audio
- New fields are validated and visible in provenance

### Phase 2: Tune Grammar Extraction

Objective:
Move tune selection out of `src/prosodic-annotator.ts` into declarative specs.

Changes:

- Add `public/rules/frontends/qlatt-english/policy/tune-grammar.yaml`
- Reduce `src/prosodic-annotator.ts` to phrase segmentation, content-word marking,
  and accent-carrier marking
- Add a small interpreter in the rule engine or frontend orchestration for
  selecting legal tune templates

Success criteria:

- Accent-family changes become spec-only
- Current ToBI tests still pass after rewiring

### Phase 3: Phonetic Implementation Layer

Objective:
Separate tune selection from contour realization.

Changes:

- Add `public/rules/frontends/qlatt-english/policy/phonetic-implementation.yaml`
- Move alignment constants and target timing out of `public/rules/frontends/qlatt-english/phases/prosody.yaml`
- Simplify `src/track-assembler.ts` to consume explicit anchor points

Success criteria:

- Contour timing changes become data edits
- Compression/truncation policies can be swapped declaratively

### Phase 4: Source Contour Extraction

Objective:
Move Fant-style source planning into declarative policy.

Changes:

- Add `public/rules/policy/source-contour.yaml`
- Move phrase, stress, and segment source dynamics out of `src/tts-frontend.ts`
- Keep semantics responsible only for numeric realization

Success criteria:

- `src/tts-frontend.ts` stops computing `EePhraseDb` and `RdPhraseOffset` directly
- Source contour behavior is shared across backends

### Phase 5: Backend Adapter Specs

Objective:
Make experiment mapping explicit and replace ad hoc frontend-to-backend logic.

Changes:

- Add backend adapter specs under `public/rules/backend-adapters/`
- Add a generic adapter execution step before track assembly / runtime binding
- Reduce direct `sourceMode`/proxy logic in `src/tts-frontend.ts`

Success criteria:

- One score feeds multiple backends
- Backend differences are isolated to adapter specs

### Phase 6: Runtime Simplification

Objective:
Reduce imperative glue once policy is fully declarative.

Changes:

- Minimize branching in `src/tts-frontend.ts`
- Minimize inference in `src/track-assembler.ts`
- Expand provenance to show:
  - tune template selected
  - implementation rule selected
  - backend adapter mapping selected

Success criteria:

- Frontend code is primarily orchestration and validation
- Paper-backed changes mostly touch specs, not TS

## Commit Plan

### Commit Series A: Spec Foundation

1. Add control-score schema and typing helpers
2. Add provenance support for control-score decisions
3. Add no-op validation tests for the new schema

### Commit Series B: Tune Grammar

1. Add tune-grammar spec and interpreter
2. Migrate current ToBI inventory to the grammar
3. Remove duplicated heuristic assignment paths

### Commit Series C: Phonetic Implementation

1. Add alignment/implementation spec
2. Rewire F0 point generation through explicit alignment plans
3. Add compression/truncation test fixtures

### Commit Series D: Source Contours

1. Add source-contour spec
2. Move Fant phrase/source planning from TS into declarative policy
3. Add tests for phrase, stress, and segment source dynamics

### Commit Series E: Backend Adapters

1. Add `klatt80` adapter spec
2. Add `klsyn88` adapter spec
3. Add `stevens91` adapter spec
4. Add backend parity tests on shared input phrases

### Commit Series F: Cleanup

1. Remove obsolete imperative logic
2. Tighten provenance and diagnostics
3. Update docs and experiment authoring guidance

## Test Plan

Add or expand:

- `test/control-score-schema.test.ts`
- `test/tune-grammar.test.ts`
- `test/phonetic-implementation.test.ts`
- `test/source-contour.test.ts`
- `test/backend-adapter-parity.test.ts`
- `test/strict-citations-check.test.ts`

Each should check paper-backed claims directly, not just snapshot audio shape.

## Risks

- A too-clever DSL will become harder to maintain than the current TS.
- Backend adapters can leak backend assumptions back into the score if the score
  schema is under-specified.
- If provenance is not expanded alongside the migration, explainability will
  regress even if the architecture improves.

## Recommendation

Start with Phases 1 and 2 only. Do not begin backend adapters before the control
score and tune grammar are stable. The main failure mode here is trying to make
everything declarative at once, which would scatter current behavior across too
many half-defined specs.
