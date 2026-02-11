# Declarative Frontend v11 Direct Migration Plan (No Backward-Compat Path)

This is the execution plan for completing the full v11 declarative frontend from `projects/declarative-frontend/spec.md` and replacing the current hybrid implementation in `src`.

Status baseline date: 2026-02-10.

## 0) Non-Negotiable Migration Rules

- `textToKlattTrack()` remains the public API, but internals are fully declarative.
- `normalizeText()` + `transcribeText()` remain upstream preprocessing (outside DSL), per spec Part 0.4.
- No `frontendEngine: imperative|declarative` option.
- No shadow execution in production path.
- Imperative frontend sequencing and rule mutators are deleted as part of cutover, not deferred.
- No new imperative frontend behavior is allowed in `src/tts-frontend.js` or `src/tts-frontend-rules.js` during migration.
- No new bespoke `rule.op` domain behavior is allowed once declarative primitives exist; behavior should be expressed as DSL rules.

## 1) Plan Maintenance Protocol

Update this file at the end of every migration work session:

1. Update the checklist item statuses in Section 3.
2. Add one line to Section 2 with date and concrete evidence.
3. If scope changes, update acceptance criteria before code changes.

Allowed status values: `NOT_STARTED`, `IN_PROGRESS`, `BLOCKED`, `DONE`.

## 2) Current Repository Observations (Audit Log)

- 2026-02-10: only a first migration slice exists in runtime and tests.
- Evidence: `src/declarative-frontend/rule-pack.js` is `version: "v11-slice"` with only structural + duration rules.
- Evidence: `src/declarative-frontend/engine.js` supports only 4 hardcoded ops and throws for others.
- Evidence: `src/tts-frontend.js` still runs imperative steps (`rule_K_Context`, punctuation pause loop, SW assignment, `rule_GenerateF0Contour`) in addition to two declarative phase calls.
- Evidence: `test/declarative-frontend-slice.test.ts` is explicitly named "first migration slice".
- Evidence: no `tts-dsl` CLI entrypoint exists in `package.json`.
- 2026-02-10: parser/validator expanded to include broader v11 schema sections and cross-reference checks while keeping slice compatibility.
- Evidence: `src/declarative-frontend/parser.js` now normalizes `streams`, `topology`, `patterns`, `interpolation`, and `output`.
- Evidence: `src/declarative-frontend/validation.js` now validates stream types, topology references, pattern schema, rule shape/select/match links, and phase `resolve_points`/`resolve_scalars`.
- Evidence: `test/declarative-frontend-schema.test.ts` added for schema normalization and cross-reference diagnostics; declarative frontend tests pass.
- 2026-02-10: expression validation work started with forward point-reference policy enforcement.
- Evidence: `src/declarative-frontend/validation.js` now emits `E_POINT_FWD_REF` when `insert_point.value` references `$next_point(...)`.
- Evidence: `test/declarative-frontend-schema.test.ts` includes coverage for forward-reference rejection and expression diagnostics.
- 2026-02-10: token status lattice groundwork added and wired into slice execution path using ACTIVE-token filtering.
- Evidence: `src/declarative-frontend/model.js` adds `TokenStatus`, normalization, lattice join, and active-token predicates.
- Evidence: `src/declarative-frontend/engine.js` now normalizes token status and applies structural/duration slice rules over ACTIVE tokens only.
- Evidence: `test/declarative-frontend-model.test.ts` and new ACTIVE-filter tests in `test/declarative-frontend-slice.test.ts` pass.
- 2026-02-10: first generic rule execution path added for select rules (`select` + `apply` + `suppress`) with deterministic rule order and ACTIVE filtering.
- Evidence: `src/declarative-frontend/engine.js` executes `rule.select` before legacy `rule.op` switch.
- Evidence: `test/declarative-frontend-generic-rules.test.ts` validates declared rule order and suppress-then-filter behavior.
- Note: initial limited evaluator replaced by JSONata integration in later entries.
- 2026-02-10: initial pattern-rule execution path added (`match` + capture targeting + suppress).
- Evidence: `src/declarative-frontend/engine.js` resolves `rule.match` against parsed patterns and applies capture-targeted effects.
- Evidence: `test/declarative-frontend-pattern-rules.test.ts` validates pattern suppression and capture-target `apply`.
- Limitation: pattern matching is currently contiguous, single-stream, and scope/cross-boundary/quantifier semantics are not implemented yet.
- 2026-02-10: JSONata integration started for runtime expression evaluation and compile-time validation.
- Evidence: `src/declarative-frontend/expressions.js` added; engine where/value expressions now evaluate through JSONata.
- Evidence: validator emits `E_JSONATA_INVALID` for malformed expressions in pattern/rule expression fields.
- Evidence: `test/declarative-frontend-jsonata.test.ts` passes for runtime JSONata expressions and malformed-expression diagnostics.
- Limitation: helper function coverage is partial and still expanding.
- 2026-02-10: first navigation helper set implemented with ACTIVE-token filtering semantics.
- Evidence: engine registers `$prev`, `$next`, `$index`, `$total` via JSONata function bindings against snapshot active stream order.
- Evidence: `test/declarative-frontend-navigation.test.ts` validates navigation behavior and suppressed-token filtering.
- Note: `$parent`, `$children`, `$assoc` implemented in subsequent entries.
- 2026-02-10: hierarchy navigation helpers `$parent` and `$children` implemented with ACTIVE-token filtering.
- Evidence: `src/declarative-frontend/engine.js` adds parent/child lookup functions over active tokens and stream filters.
- Evidence: `test/declarative-frontend-hierarchy-navigation.test.ts` validates parent stress lookup and child counting with suppressed-child exclusion.
- Note: `$assoc` implemented in subsequent entry.
- 2026-02-10: association navigation helper `$assoc` implemented for active association edges.
- Evidence: engine resolves association IDs from `token.associations[name]` and returns active associated tokens.
- Evidence: `test/declarative-frontend-association-navigation.test.ts` validates suppressed associated tokens are excluded.
- 2026-02-10: association actions implemented in generic rule runtime (`associate`/`disassociate`).
- Evidence: engine now mutates association edges with monotonic status (ACTIVE/SUPPRESSED) and `$assoc` reads active edges only.
- Evidence: `test/declarative-frontend-association-actions.test.ts` validates associate + downstream query behavior and disassociate suppression.
- 2026-02-10: point helper and point insertion runtime landed (`$spanning`, `$midpoint`, `$at_ratio`, `$at_sync`, `$prev_point`, `$next_point`, `insert_point` action).
- Evidence: `src/declarative-frontend/engine.js` now builds point-stream runtime metadata, evaluates anchor expressions, inserts ACTIVE point tokens with deterministic IDs, and exposes new JSONata helper bindings.
- Evidence: `test/declarative-frontend-point-actions.test.ts` validates midpoint/ratio/sync anchors, `$prev_point` composition, `$next_point` reads, and `$spanning` usage.
- Evidence: full declarative frontend suite passes (`12` files / `32` tests via `npx vitest run ...declarative-frontend...`).
- 2026-02-10: splice action runtime implemented with TDD for `replace_range` and `insert_at_boundary`.
- Evidence: `src/declarative-frontend/engine.js` now applies `rule.splice` in both select and pattern execution paths, supports suppression+insertion for `replace_range`, and boundary insertion for `insert_at_boundary`.
- Evidence: expression context for actions now includes captures/current in pattern rules, enabling splice expressions like `c.sync_left` / `v.sync_right`.
- Evidence: `test/declarative-frontend-splice-actions.test.ts` added and passing; full declarative suite now passes (`13` files / `34` tests).
- 2026-02-10: initial finalize-stage runtime implemented for `compute_times` + `resolve_points` with deterministic phase behavior.
- Evidence: `src/declarative-frontend/engine.js` now computes mark times from ACTIVE base tokens when `phase.compute_times` is set, resolves point token `time` when `phase.resolve_points` is set, and records finalize trace events.
- Evidence: point ordering now prefers resolved `time` before anchor tuple fallback for `$prev_point` / `$next_point`.
- Evidence: `test/declarative-frontend-finalize.test.ts` added and passing; full declarative suite now passes (`14` files / `36` tests).
- 2026-02-10: compute-times interpolation expanded with base36-rank support and strict unresolved-mark diagnostics.
- Evidence: `src/declarative-frontend/engine.js` now interpolates referenced interior marks using numeric/base36 order when possible, and throws `E_TIME_NO_BASE_SUPPORT` if marks remain untimed.
- Evidence: `test/declarative-frontend-finalize.test.ts` now covers interior base36 interpolation and `E_TIME_NO_BASE_SUPPORT`; full declarative suite passes (`14` files / `38` tests).
- 2026-02-10: multi-token splice insertion now supports base36 rank boundaries in addition to numeric boundaries.
- Evidence: `src/declarative-frontend/engine.js` `splitRange` now emits interior base36 marks for `N > 1` insertions and raises `E_RANK_NO_SPACE` when no representable split exists.
- Evidence: `test/declarative-frontend-splice-actions.test.ts` now includes base36 multi-token replace-range coverage; full declarative suite passes (`14` files / `39` tests).
- 2026-02-10: rule `constraint` execution semantics implemented for both select and pattern rules.
- Evidence: `src/declarative-frontend/engine.js` now evaluates `rule.constraint` after select `where` filtering and after full pattern capture binding, before actions are applied.
- Evidence: `test/declarative-frontend-constraints.test.ts` added; full declarative suite now passes (`15` files / `41` tests).
- 2026-02-10: initial finalize-dirty lifecycle guard implemented (`E_FINALIZE_DIRTY`).
- Evidence: runtime now rejects structural rewrites (`splice`, `insert_point`, suppression, association rewrites, structural ops) after any finalize phase (`compute_times` or `resolve_points`) has executed.
- Evidence: `test/declarative-frontend-finalize-dirty.test.ts` added and passing; full declarative suite now passes (`16` files / `43` tests).
- 2026-02-10: point ratio diagnostics tightened to spec behavior (`E_INVALID_RATIO`).
- Evidence: `src/declarative-frontend/engine.js` now rejects out-of-range explicit anchor ratios and invalid point-token ratios during point resolution instead of silently clamping.
- Evidence: `test/declarative-frontend-point-actions.test.ts` now covers invalid-ratio failure; full declarative suite now passes (`16` files / `44` tests).
- 2026-02-11: F0 generation path in `textToKlattTrack()` migrated from imperative contour function to declarative point rules + finalize timing.
- Evidence: `src/tts-frontend.js` no longer calls `rule_GenerateF0Contour`; declarative phases `prosody` + `finalize` now produce point tokens and runtime interpolation consumes those resolved points.
- Evidence: `src/declarative-frontend/rule-pack.js` now defines citation-tagged F0 rules (`f0_baseline_start`, `f0_targets`, `f0_stress_peak`, `f0_question_rise`) and point stream config.
- Evidence: `test/tts-frontend-declarative-prosody.test.ts` asserts imperative `rule_GenerateF0Contour` is not invoked and question-rise behavior remains present.
- Evidence: citation anchors now used for F0 defaults/rules are available locally in `papers/Pierrehumbert_1980_EnglishIntonation/notes.md`, `papers/OShaughnessy_1976_F0_Prosody/notes.md`, and `papers/Allen_1987_MITalk_TTS/notes.md` (with `Ladd 2008` still referenced from spec bibliography).
- 2026-02-11: K-context F2, punctuation pause duration, and SW assignment behavior migrated from imperative runtime loops into declarative duration-phase rules.
- Evidence: `src/declarative-frontend/rule-pack.js` adds `k_context_cl_f2`, `k_context_rel_copy`, `punctuation_pause`, `sw_explicit_override`, and `sw_default_assignment` with citation tags and declared rule order in `duration`.
- Evidence: `src/declarative-frontend/engine.js` `apply` runtime now supports dotted field paths (e.g., `params.F2`, `params.SW`) for nested declarative scalar updates.
- Evidence: `src/tts-frontend.js` no longer imports/calls `rule_K_Context` and no longer applies imperative punctuation/SW post-processing loops; inventory SW hints are carried as token metadata for declarative override semantics.
- Evidence: `test/declarative-frontend-rulepack-context.test.ts` added for K-context, punctuation pause, and SW behavior; `test/tts-frontend-declarative-prosody.test.ts` now asserts imperative `rule_K_Context` is not invoked.
- Evidence: regression suite passes via `npx vitest run ...declarative-frontend-*.test.ts test/tts-frontend-declarative-prosody.test.ts` (`19` files / `52` tests).
- 2026-02-11: stop release/aspiration duration lock migrated from imperative post-processing loop to declarative duration-phase rule.
- Evidence: `src/declarative-frontend/rule-pack.js` adds `lock_stop_release_duration` so `duration` phase owns fixed burst/aspiration timing from `inherentDuration`.
- Evidence: `src/tts-frontend.js` removed the post-duration imperative loop that rewrote stop release/aspiration durations from inventory.
- Evidence: `test/declarative-frontend-rulepack-context.test.ts` adds coverage for release/aspiration duration lock; declarative regression run now passes (`19` files / `53` tests).
- 2026-02-11: structural stop-release insertion now materializes full target payloads declaratively, allowing removal of runtime refill logic.
- Evidence: `src/declarative-frontend/engine.js` `ruleInsertStopReleases` now emits inserted release/aspiration tokens with filled `params`, `duration`/`inherentDuration`, copied metadata flags, `inventorySW`, and weak-release attenuation.
- Evidence: `src/tts-frontend.js` no longer contains the imperative "refill params/durations for releases" loop after structural phase.
- Evidence: `test/declarative-frontend-slice.test.ts` now verifies inserted tokens are fully materialized during structural phase; declarative regression run now passes (`19` files / `54` tests).
- 2026-02-11: removed obsolete imperative frontend mutators from shared rule module exports.
- Evidence: `src/tts-frontend-rules.js` no longer exports `rule_K_Context` or `rule_GenerateF0Contour`; declarative rulepack is now the sole owner of those behaviors.
- Evidence: `test/tts-frontend-declarative-prosody.test.ts` now enforces absence of those exports while keeping behavioral question-rise coverage; declarative regression run passes (`19` files / `53` tests).
- 2026-02-11: declarative F0 declination updated to phrase-local reset behavior (boundary-aware) instead of global utterance index slope.
- Evidence: `src/declarative-frontend/engine.js` adds generic navigation helpers `$phrase_index` and `$phrase_total` (boundary-aware for phone stream punctuation tokens).
- Evidence: `src/declarative-frontend/rule-pack.js` `f0_targets` now computes declination from phrase-local position (`$phrase_index/$phrase_total`) rather than global `$index/$total`.
- Evidence: `test/declarative-frontend-rulepack-prosody.test.ts` adds punctuation-reset coverage; declarative regression run passes (`19` files / `54` tests).
- 2026-02-11: integration coverage for phase sequencing/finalize trace started.
- Evidence: `test/declarative-frontend-integration-phases.test.ts` added to validate end-to-end phase order (`structural`->`duration`->`prosody`->`finalize`) plus `times_resolved`/`points_resolved` trace events and finite resolved point times.
- Evidence: declarative regression run now passes (`20` files / `55` tests).
- 2026-02-11: integration diagnostics coverage added at engine entrypoint.
- Evidence: `test/declarative-frontend-integration-diagnostics.test.ts` verifies invalid-spec diagnostics (`E_RULE_UNKNOWN`, `E_PHASE_RESOLVE_POINT_STREAM_INVALID`) surface through `runRuleEngine`.
- Evidence: declarative regression run now passes (`21` files / `56` tests).
- Limitation: multi-token splice insertion still rejects non-numeric, non-base36 boundary schemes (full explicit sync-axis/rank object support remains pending).
- Limitation: finalize timing still uses runtime-inferred marks rather than a full explicit sync-axis object model (spec sentinel semantics and full Part 9 diagnostics remain incomplete).
- Limitation: declination now resets phrase-locally, but remains index-based and does not yet implement the prior imperative time-based phrase-shape details (initial boost/continuation-rise decomposition).

## 3) Master Checklist (Spec-to-Code Execution)

### [A] Execution Grounding

- [ ] `A1` `NOT_STARTED`: Add this plan status check into CI or PR template so status updates are enforced.
- [ ] `A2` `NOT_STARTED`: Create a migration branch rule: no new imperative frontend logic merged into `src/tts-frontend.js` or `src/tts-frontend-rules.js`.
- [ ] `A3` `IN_PROGRESS`: Enforce declarative-maximization guardrail: no new domain behavior via custom `rule.op`; prefer generic DSL actions.

### [B] Engine Core (Spec Parts 0, 1, 5, 9)

- [ ] `B1` `IN_PROGRESS`: Implement full typed model for sync marks, interval/point tokens, token status lattice, associations, and stream topology.
- [ ] `B2` `IN_PROGRESS`: Replace slice executor with deterministic phase/rule/match execution with quiescence and match identity semantics.
- [ ] `B3` `NOT_STARTED`: Implement complete diagnostics catalog from spec Part 9 with stable codes and blame paths.
- [ ] `B4` `IN_PROGRESS`: Implement finalize lifecycle guards (`E_FINALIZE_DIRTY`) and enforce no structural rewrites after finalize.

Acceptance criteria:
- Active-token filtering behavior is implemented exactly as spec for matching/navigation/output.
- All invariants in Part 9.2 are validated post-phase/finalize.
- Engine can execute standalone fixture specs end-to-end with deterministic output.

### [C] Parser + Validator (Spec Parts 3, 4, 6, 7, 9)

- [ ] `C1` `IN_PROGRESS`: Expand parser beyond phases/rules to full DSL schema (`streams`, `topology`, `patterns`, `rules`, `phases`, `output`, interpolation sections).
- [ ] `C2` `IN_PROGRESS`: Validate cross-references (streams, captures, fields, patterns, rules, phases).
- [ ] `C3` `IN_PROGRESS`: Validate phase dependencies and ordering constraints.
- [ ] `C4` `IN_PROGRESS`: Validate expression fields and point forward-reference policy.

Acceptance criteria:
- Parser supports full v11 grammar used in `spec.md` appendix examples.
- Validator emits deterministic diagnostics for invalid specs and accepts valid appendix-style specs.

### [D] Expression Runtime (Spec Part 2)

- [ ] `D1` `IN_PROGRESS`: Integrate JSONata evaluation for rule expressions and constraints.
- [ ] `D2` `IN_PROGRESS`: Implement required helper functions (`$prev`, `$next`, `$parent`, `$children`, `$assoc`, `$spanning`, `$prev_point`, `$next_point`, etc.).
- [ ] `D3` `IN_PROGRESS`: Enforce ACTIVE-token filtering in navigation helpers.
- [ ] `D4` `IN_PROGRESS`: Add deterministic error handling for JSONata parse/eval failures (`E_JSONATA_INVALID`).

Acceptance criteria:
- Expressions in appendix examples run unchanged.
- Function outputs and ordering are deterministic and tested.

### [E] Rule Semantics (Spec Parts 4, 5, 6)

- [ ] `E1` `IN_PROGRESS`: Implement select and pattern rule execution.
- [ ] `E2` `IN_PROGRESS`: Implement all actions: `apply`, `splice`, `insert_point`, `suppress/delete`, `associate`, `disassociate`.
- [ ] `E3` `NOT_STARTED`: Implement scalar resolution (`set`, `mul`, `add`) including Klatt incompressibility handling.
- [ ] `E4` `IN_PROGRESS`: Implement compute times and point resolution stages.

Acceptance criteria:
- One integration fixture per action family.
- Appendix-style multi-phase examples execute with deterministic ordering.

### [F] Qlatt Rule Pack Migration (Current Behavior Coverage)

- [x] `F1` `DONE`: Stop release/aspiration insertion migrated in slice rulepack.
- [x] `F2` `DONE`: Stress/vowel shortening/pre-boundary duration migrated in slice rulepack.
- [x] `F3` `DONE`: Migrate K-context F2 behavior into declarative rules.
- [x] `F4` `DONE`: Migrate punctuation pause duration behavior into declarative rules.
- [x] `F5` `DONE`: Migrate SW/source assignment behavior into declarative rules.
- [x] `F6` `DONE`: Migrate F0 target generation/question rise into declarative point rules.

Acceptance criteria:
- No frontend behavior for synthesis-relevant parameters is implemented imperatively.
- Golden phrase corpus stays within agreed tolerance envelope.

### [G] Direct Runtime Cutover

- [ ] `G1` `IN_PROGRESS`: Keep `textToKlattTrack()` public signature; replace internals with declarative engine call only.
- [x] `G2` `DONE`: Remove imperative post-processing loops in `src/tts-frontend.js`.
- [ ] `G3` `NOT_STARTED`: Keep output contract as current `KlattFrame[]` shape for downstream runtime.

Acceptance criteria:
- `src/tts-frontend.js` contains no imperative phonological/phonetic rule pipeline.
- Frontend path is declarative-only in production runtime.

### [H] Dead Code Removal and Source of Truth Cleanup

- [x] `H1` `DONE`: Remove `rule_K_Context` and `rule_GenerateF0Contour` from runtime usage.
- [x] `H2` `DONE`: Remove obsolete imperative rule mutators from `src/tts-frontend-rules.js`.
- [ ] `H3` `NOT_STARTED`: Decide and enforce single source of truth for inventory/constants (prefer declarative assets).

Acceptance criteria:
- No operational dependency on removed imperative rule code.
- Code ownership boundaries are clear (`declarative-frontend/**` owns rule behavior).

### [I] Tooling Completion (Spec Part 10 + CLI doc)

- [ ] `I1` `NOT_STARTED`: Implement trace model sufficient for match/rewrite/resolve/error sequencing.
- [ ] `I2` `NOT_STARTED`: Implement explain/why-not/diff APIs on top of trace/provenance data.
- [ ] `I3` `NOT_STARTED`: Add `tts-dsl` CLI entrypoint and subcommands from `projects/declarative-frontend/cli.md`.
- [ ] `I4` `NOT_STARTED`: Add contract tests for CLI outputs and trace schemas.

Acceptance criteria:
- `tts-dsl run|validate|explain|why-not|diff` are functional.
- Trace and debugger-oriented introspection are usable for rule debugging.

### [J] Test and Release Gate

- [ ] `J1` `IN_PROGRESS`: Keep and expand unit tests for order/parser/validation/engine determinism.
- [ ] `J2` `IN_PROGRESS`: Add integration tests for phases, diagnostics, and finalize behavior.
- [ ] `J3` `NOT_STARTED`: Add declarative-only frontend behavior tests on phrase corpus.
- [ ] `J4` `NOT_STARTED`: Run golden verification and lock outputs after review.
- [ ] `J5` `NOT_STARTED`: Update docs to describe declarative frontend as current architecture.

Acceptance criteria:
- Required tests pass in CI.
- Docs no longer describe declarative frontend as future work.

## 4) Sequenced Event Plan (Agent Execution Order)

1. Complete missing declarative primitives first: remaining `D2/D3` helpers + `E2` actions + `E4` finalize/point timing.
2. Complete `E3` scalar resolution semantics and diagnostics hardening (`B3/B4`).
3. Complete any remaining runtime behavior parity adjustments in declarative rules (core migration items `F3-F6` are now done) only after required primitives are in place.
4. Execute hard cutover and deletions in one set: `G` + `H`.
5. Complete `I` (tooling) on declarative-only runtime.
6. Complete `J` and finalize docs/release.

Declarative optimization policy:
- Prefer building generic rule primitives once over adding special-case imperative behavior.
- If a temporary workaround is added, record its removal trigger and target checklist item in Section 2.

## 5) Design Decisions to Lock Before Implementation

- `LOCKED 2026-02-10`: Point forward-reference policy for `$next_point` is **reject at validation** with `E_POINT_FWD_REF` (no implicit multi-pass point solver in v1 cutover).
- `LOCKED 2026-02-10`: Splice conflict mode default is **permissive** with final invariant rejection (`E_BASE_OVERLAP` / `E_BASE_NOT_CONTIGUOUS`); strict `E_SPLICE_CONFLICT` may be added as opt-in.
- `LOCKED 2026-02-10`: Post-cutover rule/inventory source of truth is **declarative assets**. Legacy constants may be mirrored only as temporary compatibility scaffolding during migration, then removed.

## 6) Definition of Done

- Declarative v11 engine is the only frontend rule engine in runtime path.
- `textToKlattTrack()` is declarative-backed and keeps consumer output contract.
- Legacy imperative frontend rule code is removed.
- Required tests pass.
- CLI + tracing + explain/why-not/diff capabilities are implemented.
- Docs reflect declarative frontend as current architecture.
