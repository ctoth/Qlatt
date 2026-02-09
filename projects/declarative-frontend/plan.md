# Declarative Frontend v11 Direct Migration Plan (No Backward-Compat Path)

This is a hard migration plan. There is no dual-engine runtime, no feature flag switch, and no imperative fallback path kept alive after cutover.

## 0) Non-Negotiable Migration Rules

- `textToKlattTrack()` remains the public API, but its internals are fully replaced by the declarative engine.
- `normalizeText()` + `transcribeText()` remain upstream preprocessing (outside DSL), per spec Part 0.4.
- No `frontendEngine: imperative|declarative` option.
- No shadow execution in production path.
- Imperative rule pipeline code in `src/tts-frontend.js` and rule functions in `src/tts-frontend-rules.js` are deleted as part of migration, not deferred.

## 1) Scope

Implement fully:

- v11 rule engine from `projects/declarative-frontend/spec.md`
- tracing/introspection from `projects/declarative-frontend/tracing.md`
- CLI surface from `projects/declarative-frontend/cli.md`
- integration into current TTS frontend entrypoint (`src/tts-frontend.js`)
- dead code removal caused by declarativing frontend

## 2) Target Architecture After Migration

- `src/tts-frontend.js`
  - keeps: text normalization, dictionary/G2P fallback, call into declarative adapter, final track return.
  - removes: imperative phoneme rule sequencing and imperative F0/formant/duration mutation pipeline.
- `src/declarative-frontend/**` (new)
  - owns parse/validate/execute/finalize/emit.
- `src/tts-frontend-rules.js`
  - reduced to shared phoneme inventory/constants only if still needed by preprocessing.
  - imperative `rule_*` mutators removed.

## 3) Work Plan

### Phase 1: Engine Core

Build:
- sync marks, rank/order, token status lattice, stream ordering
- parser + static validation + diagnostics
- JSONata integration with required navigation functions
- deterministic phase/rule/match execution and quiescence

Tests:
- deterministic ordering, rank edge cases, diagnostics catalog

Exit:
- engine can run standalone fixtures end-to-end.

### Phase 2: Full Rule Semantics

Build:
- select + pattern rules
- apply/splice/insert_point/suppress/associate/disassociate
- scalar resolution (standard + Klatt)
- compute_times + resolve_points
- finalize invariants and validation errors

Tests:
- one fixture for each rule/action family and critical diagnostics

Exit:
- spec Appendix-style examples execute correctly and deterministically.

### Phase 3: Qlatt DSL Rule Pack

Build declarative replacements for existing frontend behavior:
- stop release/aspiration insertion
- K-context F2 behavior
- stress/vowel shortening/pre-boundary duration behavior
- punctuation pause behavior
- SW/source assignment behavior
- F0 target generation and question rise behavior

Tests:
- phrase corpus fixtures that assert expected track-level behavior.

Exit:
- declarative outputs match required behavior envelope for current synth runtime.

### Phase 4: Direct Integration Cutover

Build:
- replace internals of `textToKlattTrack()` to call declarative engine directly
- keep output contract as current `KlattFrame[]` shape for interpreter/runtime consumers

Tests:
- `test/test-harness.js` and runtime smoke continue to work with migrated frontend
- golden/parity checks against expected outputs

Exit:
- production/frontend path is declarative-only.

### Phase 5: Immediate Dead Code Removal

Delete:
- imperative sequencing blocks in `src/tts-frontend.js` (rule_K_Context, duration mutators, imperative F0 pipeline, refill loops)
- imperative rule functions in `src/tts-frontend-rules.js` replaced by DSL rules
- disabled debug scaffolding only used by removed imperative path

Refactor:
- move retained inventory/constants to declarative assets where possible to avoid dual sources of truth

Tests:
- full suite passes after deletions

Exit:
- no operational dependency on legacy imperative frontend code.

### Phase 6: Tooling Completion

Build:
- `tts-dsl` commands from `cli.md`
- trace/provenance/diff/reporting from `tracing.md`

Tests:
- CLI command contract tests + trace schema tests

Exit:
- spec-required tooling available on migrated codebase.

## 4) Test Strategy (Direct Migration)

- Unit: order/rank/parser/evaluator/resolution functions
- Integration: phase execution and diagnostics
- Frontend behavior tests: declarative-only track generation on representative phrase corpus
- Runtime smoke: generated track schedules in both harness runtime modes
- Golden verification: regenerated expected outputs reviewed and locked

Note:
- Comparisons to old imperative behavior are used only as migration verification during development; no dual runtime path remains in code.

## 5) Definition of Done

- Declarative v11 engine is the only frontend rule engine in runtime path.
- `textToKlattTrack()` is declarative-backed and keeps consumer output contract.
- Legacy imperative frontend rule code is removed.
- Required tests pass.
- CLI + tracing + explain/why-not/diff capabilities are implemented.
- docs reflect declarative frontend as the actual architecture, not planned architecture.

## 6) First Implementation Slice

Execute first:

1. Create `src/declarative-frontend/` core + parser + validation + rank/order utilities.
2. Add direct call from `textToKlattTrack()` into a minimal declarative adapter (no feature flag).
3. Migrate first concrete ruleset (duration + one structural rewrite) and delete corresponding imperative code immediately after tests pass.

