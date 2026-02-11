# Declarative Frontend v11 Direct Migration Plan (No Backward-Compat Path)

This is the execution plan for completing the full v11 declarative frontend from `projects/declarative-frontend/spec.md` and replacing the current hybrid implementation in `src`.

Status baseline date: 2026-02-10.

## 0) Non-Negotiable Migration Rules

- `textToKlattTrack()` remains the public API, but internals are fully declarative.
- `normalizeText()` + `transcribeText()` remain upstream preprocessing (outside DSL), per spec Part 0.4.
- No `frontendEngine: imperative|declarative` option.
- No shadow execution in production path.
- Imperative frontend sequencing and rule mutators are deleted as part of cutover, not deferred.
- No new imperative frontend behavior is allowed in `src/tts-frontend.ts` or `src/tts-frontend-rules.ts` during migration.
- No new bespoke `rule.op` domain behavior is allowed once declarative primitives exist; behavior should be expressed as DSL rules.

## 1) Plan Maintenance Protocol

Update this file at the end of every migration work session:

1. Update the checklist item statuses in Section 3.
2. Add one line to Section 2 with date and concrete evidence.
3. If scope changes, update acceptance criteria before code changes.

Allowed status values: `NOT_STARTED`, `IN_PROGRESS`, `BLOCKED`, `DONE`.

## 2) Current Repository Observations (Audit Log)

- 2026-02-10: only a first migration slice exists in runtime and tests.
- Evidence: `src/declarative-frontend/rule-pack.ts` is `version: "v11-slice"` with only structural + duration rules.
- Evidence: `src/declarative-frontend/engine.ts` supports only 4 hardcoded ops and throws for others.
- Evidence: `src/tts-frontend.ts` still runs imperative steps (`rule_K_Context`, punctuation pause loop, SW assignment, `rule_GenerateF0Contour`) in addition to two declarative phase calls.
- Evidence: `test/declarative-frontend-slice.test.ts` is explicitly named "first migration slice".
- Evidence: no `tts-dsl` CLI entrypoint exists in `package.json`.
- 2026-02-10: parser/validator expanded to include broader v11 schema sections and cross-reference checks while keeping slice compatibility.
- Evidence: `src/declarative-frontend/parser.ts` now normalizes `streams`, `topology`, `patterns`, `interpolation`, and `output`.
- Evidence: `src/declarative-frontend/validation.ts` now validates stream types, topology references, pattern schema, rule shape/select/match links, and phase `resolve_points`/`resolve_scalars`.
- Evidence: `test/declarative-frontend-schema.test.ts` added for schema normalization and cross-reference diagnostics; declarative frontend tests pass.
- 2026-02-10: expression validation work started with forward point-reference policy enforcement.
- Evidence: `src/declarative-frontend/validation.ts` now emits `E_POINT_FWD_REF` when `insert_point.value` references `$next_point(...)`.
- Evidence: `test/declarative-frontend-schema.test.ts` includes coverage for forward-reference rejection and expression diagnostics.
- 2026-02-10: token status lattice groundwork added and wired into slice execution path using ACTIVE-token filtering.
- Evidence: `src/declarative-frontend/model.ts` adds `TokenStatus`, normalization, lattice join, and active-token predicates.
- Evidence: `src/declarative-frontend/engine.ts` now normalizes token status and applies structural/duration slice rules over ACTIVE tokens only.
- Evidence: `test/declarative-frontend-model.test.ts` and new ACTIVE-filter tests in `test/declarative-frontend-slice.test.ts` pass.
- 2026-02-10: first generic rule execution path added for select rules (`select` + `apply` + `suppress`) with deterministic rule order and ACTIVE filtering.
- Evidence: `src/declarative-frontend/engine.ts` executes `rule.select` before legacy `rule.op` switch.
- Evidence: `test/declarative-frontend-generic-rules.test.ts` validates declared rule order and suppress-then-filter behavior.
- Note: initial limited evaluator replaced by JSONata integration in later entries.
- 2026-02-10: initial pattern-rule execution path added (`match` + capture targeting + suppress).
- Evidence: `src/declarative-frontend/engine.ts` resolves `rule.match` against parsed patterns and applies capture-targeted effects.
- Evidence: `test/declarative-frontend-pattern-rules.test.ts` validates pattern suppression and capture-target `apply`.
- Limitation: pattern matching is currently contiguous, single-stream, and scope/cross-boundary/quantifier semantics are not implemented yet.
- 2026-02-10: JSONata integration started for runtime expression evaluation and compile-time validation.
- Evidence: `src/declarative-frontend/expressions.ts` added; engine where/value expressions now evaluate through JSONata.
- Evidence: validator emits `E_JSONATA_INVALID` for malformed expressions in pattern/rule expression fields.
- Evidence: `test/declarative-frontend-jsonata.test.ts` passes for runtime JSONata expressions and malformed-expression diagnostics.
- Limitation: helper function coverage is partial and still expanding.
- 2026-02-10: first navigation helper set implemented with ACTIVE-token filtering semantics.
- Evidence: engine registers `$prev`, `$next`, `$index`, `$total` via JSONata function bindings against snapshot active stream order.
- Evidence: `test/declarative-frontend-navigation.test.ts` validates navigation behavior and suppressed-token filtering.
- Note: `$parent`, `$children`, `$assoc` implemented in subsequent entries.
- 2026-02-10: hierarchy navigation helpers `$parent` and `$children` implemented with ACTIVE-token filtering.
- Evidence: `src/declarative-frontend/engine.ts` adds parent/child lookup functions over active tokens and stream filters.
- Evidence: `test/declarative-frontend-hierarchy-navigation.test.ts` validates parent stress lookup and child counting with suppressed-child exclusion.
- Note: `$assoc` implemented in subsequent entry.
- 2026-02-10: association navigation helper `$assoc` implemented for active association edges.
- Evidence: engine resolves association IDs from `token.associations[name]` and returns active associated tokens.
- Evidence: `test/declarative-frontend-association-navigation.test.ts` validates suppressed associated tokens are excluded.
- 2026-02-10: association actions implemented in generic rule runtime (`associate`/`disassociate`).
- Evidence: engine now mutates association edges with monotonic status (ACTIVE/SUPPRESSED) and `$assoc` reads active edges only.
- Evidence: `test/declarative-frontend-association-actions.test.ts` validates associate + downstream query behavior and disassociate suppression.
- 2026-02-10: point helper and point insertion runtime landed (`$spanning`, `$midpoint`, `$at_ratio`, `$at_sync`, `$prev_point`, `$next_point`, `insert_point` action).
- Evidence: `src/declarative-frontend/engine.ts` now builds point-stream runtime metadata, evaluates anchor expressions, inserts ACTIVE point tokens with deterministic IDs, and exposes new JSONata helper bindings.
- Evidence: `test/declarative-frontend-point-actions.test.ts` validates midpoint/ratio/sync anchors, `$prev_point` composition, `$next_point` reads, and `$spanning` usage.
- Evidence: full declarative frontend suite passes (`12` files / `32` tests via `npx vitest run ...declarative-frontend...`).
- 2026-02-10: splice action runtime implemented with TDD for `replace_range` and `insert_at_boundary`.
- Evidence: `src/declarative-frontend/engine.ts` now applies `rule.splice` in both select and pattern execution paths, supports suppression+insertion for `replace_range`, and boundary insertion for `insert_at_boundary`.
- Evidence: expression context for actions now includes captures/current in pattern rules, enabling splice expressions like `c.sync_left` / `v.sync_right`.
- Evidence: `test/declarative-frontend-splice-actions.test.ts` added and passing; full declarative suite now passes (`13` files / `34` tests).
- 2026-02-10: initial finalize-stage runtime implemented for `compute_times` + `resolve_points` with deterministic phase behavior.
- Evidence: `src/declarative-frontend/engine.ts` now computes mark times from ACTIVE base tokens when `phase.compute_times` is set, resolves point token `time` when `phase.resolve_points` is set, and records finalize trace events.
- Evidence: point ordering now prefers resolved `time` before anchor tuple fallback for `$prev_point` / `$next_point`.
- Evidence: `test/declarative-frontend-finalize.test.ts` added and passing; full declarative suite now passes (`14` files / `36` tests).
- 2026-02-10: compute-times interpolation expanded with base36-rank support and strict unresolved-mark diagnostics.
- Evidence: `src/declarative-frontend/engine.ts` now interpolates referenced interior marks using numeric/base36 order when possible, and throws `E_TIME_NO_BASE_SUPPORT` if marks remain untimed.
- Evidence: `test/declarative-frontend-finalize.test.ts` now covers interior base36 interpolation and `E_TIME_NO_BASE_SUPPORT`; full declarative suite passes (`14` files / `38` tests).
- 2026-02-10: multi-token splice insertion now supports base36 rank boundaries in addition to numeric boundaries.
- Evidence: `src/declarative-frontend/engine.ts` `splitRange` now emits interior base36 marks for `N > 1` insertions and raises `E_RANK_NO_SPACE` when no representable split exists.
- Evidence: `test/declarative-frontend-splice-actions.test.ts` now includes base36 multi-token replace-range coverage; full declarative suite passes (`14` files / `39` tests).
- 2026-02-10: rule `constraint` execution semantics implemented for both select and pattern rules.
- Evidence: `src/declarative-frontend/engine.ts` now evaluates `rule.constraint` after select `where` filtering and after full pattern capture binding, before actions are applied.
- Evidence: `test/declarative-frontend-constraints.test.ts` added; full declarative suite now passes (`15` files / `41` tests).
- 2026-02-10: initial finalize-dirty lifecycle guard implemented (`E_FINALIZE_DIRTY`).
- Evidence: runtime now rejects structural rewrites (`splice`, `insert_point`, suppression, association rewrites, structural ops) after any finalize phase (`compute_times` or `resolve_points`) has executed.
- Evidence: `test/declarative-frontend-finalize-dirty.test.ts` added and passing; full declarative suite now passes (`16` files / `43` tests).
- 2026-02-10: point ratio diagnostics tightened to spec behavior (`E_INVALID_RATIO`).
- Evidence: `src/declarative-frontend/engine.ts` now rejects out-of-range explicit anchor ratios and invalid point-token ratios during point resolution instead of silently clamping.
- Evidence: `test/declarative-frontend-point-actions.test.ts` now covers invalid-ratio failure; full declarative suite now passes (`16` files / `44` tests).
- 2026-02-11: F0 generation path in `textToKlattTrack()` migrated from imperative contour function to declarative point rules + finalize timing.
- Evidence: `src/tts-frontend.ts` no longer calls `rule_GenerateF0Contour`; declarative phases `prosody` + `finalize` now produce point tokens and runtime interpolation consumes those resolved points.
- Evidence: `src/declarative-frontend/rule-pack.ts` now defines citation-tagged F0 rules (`f0_baseline_start`, `f0_targets`, `f0_stress_peak`, `f0_question_rise`) and point stream config.
- Evidence: `test/tts-frontend-declarative-prosody.test.ts` asserts imperative `rule_GenerateF0Contour` is not invoked and question-rise behavior remains present.
- Evidence: citation anchors now used for F0 defaults/rules are available locally in `papers/Pierrehumbert_1980_EnglishIntonation/notes.md`, `papers/OShaughnessy_1976_F0_Prosody/notes.md`, and `papers/Allen_1987_MITalk_TTS/notes.md` (with `Ladd 2008` still referenced from spec bibliography).
- 2026-02-11: K-context F2, punctuation pause duration, and SW assignment behavior migrated from imperative runtime loops into declarative duration-phase rules.
- Evidence: `src/declarative-frontend/rule-pack.ts` adds `k_context_cl_f2`, `k_context_rel_copy`, `punctuation_pause`, `sw_explicit_override`, and `sw_default_assignment` with citation tags and declared rule order in `duration`.
- Evidence: `src/declarative-frontend/engine.ts` `apply` runtime now supports dotted field paths (e.g., `params.F2`, `params.SW`) for nested declarative scalar updates.
- Evidence: `src/tts-frontend.ts` no longer imports/calls `rule_K_Context` and no longer applies imperative punctuation/SW post-processing loops; inventory SW hints are carried as token metadata for declarative override semantics.
- Evidence: `test/declarative-frontend-rulepack-context.test.ts` added for K-context, punctuation pause, and SW behavior; `test/tts-frontend-declarative-prosody.test.ts` now asserts imperative `rule_K_Context` is not invoked.
- Evidence: regression suite passes via `npx vitest run ...declarative-frontend-*.test.ts test/tts-frontend-declarative-prosody.test.ts` (`19` files / `52` tests).
- 2026-02-11: stop release/aspiration duration lock migrated from imperative post-processing loop to declarative duration-phase rule.
- Evidence: `src/declarative-frontend/rule-pack.ts` adds `lock_stop_release_duration` so `duration` phase owns fixed burst/aspiration timing from `inherentDuration`.
- Evidence: `src/tts-frontend.ts` removed the post-duration imperative loop that rewrote stop release/aspiration durations from inventory.
- Evidence: `test/declarative-frontend-rulepack-context.test.ts` adds coverage for release/aspiration duration lock; declarative regression run now passes (`19` files / `53` tests).
- 2026-02-11: structural stop-release insertion now materializes full target payloads declaratively, allowing removal of runtime refill logic.
- Evidence: `src/declarative-frontend/engine.ts` `ruleInsertStopReleases` now emits inserted release/aspiration tokens with filled `params`, `duration`/`inherentDuration`, copied metadata flags, `inventorySW`, and weak-release attenuation.
- Evidence: `src/tts-frontend.ts` no longer contains the imperative "refill params/durations for releases" loop after structural phase.
- Evidence: `test/declarative-frontend-slice.test.ts` now verifies inserted tokens are fully materialized during structural phase; declarative regression run now passes (`19` files / `54` tests).
- 2026-02-11: removed obsolete imperative frontend mutators from shared rule module exports.
- Evidence: `src/tts-frontend-rules.ts` no longer exports `rule_K_Context` or `rule_GenerateF0Contour`; declarative rulepack is now the sole owner of those behaviors.
- Evidence: `test/tts-frontend-declarative-prosody.test.ts` now enforces absence of those exports while keeping behavioral question-rise coverage; declarative regression run passes (`19` files / `53` tests).
- 2026-02-11: declarative F0 declination updated to phrase-local reset behavior (boundary-aware) instead of global utterance index slope.
- Evidence: `src/declarative-frontend/engine.ts` adds generic navigation helpers `$phrase_index` and `$phrase_total` (boundary-aware for phone stream punctuation tokens).
- Evidence: `src/declarative-frontend/rule-pack.ts` `f0_targets` now computes declination from phrase-local position (`$phrase_index/$phrase_total`) rather than global `$index/$total`.
- Evidence: `test/declarative-frontend-rulepack-prosody.test.ts` adds punctuation-reset coverage; declarative regression run passes (`19` files / `54` tests).
- 2026-02-11: integration coverage for phase sequencing/finalize trace started.
- Evidence: `test/declarative-frontend-integration-phases.test.ts` added to validate end-to-end phase order (`structural`->`duration`->`prosody`->`finalize`) plus `times_resolved`/`points_resolved` trace events and finite resolved point times.
- Evidence: declarative regression run now passes (`20` files / `55` tests).
- 2026-02-11: integration diagnostics coverage added at engine entrypoint.
- Evidence: `test/declarative-frontend-integration-diagnostics.test.ts` verifies invalid-spec diagnostics (`E_RULE_UNKNOWN`, `E_PHASE_RESOLVE_POINT_STREAM_INVALID`) surface through `runRuleEngine`.
- Evidence: declarative regression run now passes (`21` files / `56` tests).
- 2026-02-11: declarative-only corpus behavior coverage started on linguistic phrase set.
- Evidence: `test/tts-frontend-declarative-corpus.test.ts` validates finite/monotonic track output across `test/phrase-sets/linguistic.json` using `textToKlattTrack()` declarative runtime path.
- Evidence: declarative + frontend migration suite now passes (`22` files / `57` tests).
- 2026-02-11: corpus-level declarative golden summary baseline locked for deterministic regression checking.
- Evidence: `test/tts-frontend-declarative-golden-summary.test.ts` compares per-phrase summary metrics (`events`, `totalTime`, `voicedEvents`, `f0Min`, `f0Max`) against `test/golden/declarative-corpus-summary.json`.
- Evidence: `scripts/export-declarative-corpus-summary.ts` + `npm run golden:declarative-summary` provide explicit regeneration workflow for the locked baseline.
- Evidence: declarative + frontend migration suite now passes (`23` files / `58` tests).
- 2026-02-11: docs updated to describe declarative frontend as the current architecture (not future migration work).
- Evidence: `README.md` now documents declarative frontend ownership and migration verification commands.
- Evidence: `docs/parameter-scheduling.md` now documents phase-driven declarative frontend flow (`structural`/`duration`/`prosody`/`finalize`) and removes legacy mutator framing.
- Evidence: `docs/adding-a-synthesizer.md` data flow now routes frontend behavior through `src/declarative-frontend/engine.ts` + rule pack phases.
- 2026-02-11: scalar-resolution phase semantics (`resolve_scalars`) started with explicit `standard`/`klatt` resolution handling.
- Evidence: `src/declarative-frontend/engine.ts` now accumulates phase-scoped scalar effects for fields with explicit scalar `resolution`, resolves them deterministically at phase boundary, applies standard min/max clamp, and applies Klatt incompressibility-floor semantics for `mul`.
- Evidence: `test/declarative-frontend-scalar-resolution.test.ts` added and passing for standard and klatt resolution behavior.
- Evidence: declarative + frontend migration suite now passes (`24` files / `60` tests).
- 2026-02-11: validator now blocks unknown imperative `rule.op` additions to enforce declarative-maximization guardrail.
- Evidence: `src/declarative-frontend/validation.ts` now emits `E_RULE_OP_UNKNOWN` for unsupported `rule.op` values.
- Evidence: `test/declarative-frontend-schema.test.ts` covers unknown `rule.op` rejection; declarative + frontend migration suite passes (`24` files / `61` tests).
- 2026-02-11: duration heuristics migrated from imperative `rule.op` handlers to declarative `select`/`apply` rules with Klatt scalar resolution.
- Evidence: `src/declarative-frontend/rule-pack.ts` `stress_duration`, `vowel_shortening`, and `pre_boundary_lengthening` are now declarative rules (no `op`) with citation tags and phase-local `resolve_scalars: ["duration"]` over `duration` scalar `resolution: "klatt"`.
- Evidence: `src/declarative-frontend/engine.ts` no longer contains duration `rule.op` handlers; only structural `insert_stop_releases` remains as a temporary op path.
- Evidence: `test/declarative-frontend-rulepack-shape.test.ts` added to enforce op-free duration rules; declarative + frontend migration suite passes (`25` files / `62` tests).
- 2026-02-11: structural stop release/aspiration insertion migrated to declarative `select` + `splice` rules with inventory-backed token materialization.
- Evidence: `src/declarative-frontend/rule-pack.ts` now uses `insert_voiceless_stop_release_and_aspiration` and `insert_voiced_stop_release` declarative structural rules (with citation tags) and no longer defines `insert_stop_releases` op.
- Evidence: `src/declarative-frontend/engine.ts` adds `$target(...)` helper-backed inventory materialization for declarative templates and no longer has any `rule.op` handlers.
- Evidence: `src/declarative-frontend/validation.ts` now disallows all `rule.op` usage (`E_RULE_OP_UNKNOWN` for any op).
- Evidence: `test/declarative-frontend-rulepack-shape.test.ts` now enforces fully op-free rulepack; declarative + frontend migration suite passes (`25` files / `63` tests).
- 2026-02-11: structural phase now initializes base-stream sync marks up front, and boundary insertion is fully boundary-driven (no target-index fallback path).
- Evidence: `src/declarative-frontend/engine.ts` adds `initializeBaseStreamSyncMarks(...)` invoked at rule-engine startup for active base streams missing sync bounds.
- Evidence: `src/declarative-frontend/engine.ts` `insert_at_boundary` now requires an explicit boundary and no longer branches to target-index insertion when stream tokens are unmarked.
- Evidence: `test/declarative-frontend-slice.test.ts` adds coverage that structural-phase phone tokens have initialized `sync_left`/`sync_right` and voiced-stop structural behavior (`B/D/G` release only); `test/declarative-frontend-splice-actions.test.ts` adds boundary-required guard coverage; declarative + frontend migration suite passes (`25` files / `66` tests).
- 2026-02-11: base coverage invariant checks started, and boundary insert semantics were aligned with non-overlap partitioning in order space.
- Evidence: `src/declarative-frontend/engine.ts` now enforces active-base adjacency checks per base stream and throws `E_BASE_OVERLAP` / `E_BASE_NOT_CONTIGUOUS` at phase boundaries.
- Evidence: `src/declarative-frontend/engine.ts` `insert_at_boundary` now emits zero-width boundary spans (`sync_left == sync_right == boundary`) to avoid overlap with adjacent base intervals under current axis model.
- Evidence: `test/declarative-frontend-base-coverage.test.ts` added for contiguous/gap/overlap coverage, and `test/declarative-frontend-splice-actions.test.ts` now locks deterministic ordering for repeated same-boundary inserts; declarative + frontend migration suite passes (`26` files / `70` tests).
- 2026-02-11: sync-axis bootstrap moved from numeric placeholders to sentinel/rank order keys for missing base streams.
- Evidence: `src/declarative-frontend/engine.ts` now initializes missing base boundaries as `START`/`FINITE`/`END` order objects with fixed-length base36 finite ranks.
- Evidence: `src/declarative-frontend/engine.ts` `splitRange` now supports equal-boundary multi-token insertion for non-numeric order keys (required for same-mark structural inserts).
- Evidence: `test/declarative-frontend-sync-axis.test.ts` added for sentinel bootstrap and finite-boundary multi-insert behavior; declarative + frontend migration suite passes (`27` files / `72` tests).
- 2026-02-11: locked a TS-native (Vite-first) cleanup track focused on full sync-axis object model, stronger invariants, and module boundary cleanup.
- Evidence: plan now includes a dedicated checklist for `SyncAxis` entities, invariant hardening, structural rewrite semantics, scalar unification, timing on mark entities, TS-native modularization, and stronger determinism fixtures.
- 2026-02-11: base-coverage invariants now enforce START/END anchoring for object-order base streams in addition to gap/overlap checks.
- Evidence: `src/declarative-frontend/engine.ts` `assertActiveBaseCoverage` now raises `E_BASE_NOT_CONTIGUOUS` when object-order active coverage does not begin at `START` or end at `END`.
- Evidence: `test/declarative-frontend-base-coverage.test.ts` now covers anchored object-order acceptance and missing-START/missing-END rejection; suppression-focused rule tests were updated to keep valid active coverage under stricter invariants.
- Evidence: declarative + frontend migration suite passes (`27` files / `75` tests).
- 2026-02-11: TS-native migration sweep landed across frontend/runtime/tooling; tracked source tree is now `.ts`-native.
- Evidence: tracked `*.js` source files were renamed to `.ts` across `src`, `scripts`, `test`, and Vite config; `git ls-files "*.js"` is empty.
- Evidence: TS entrypoints now run through `ts-node` ESM loader (`scripts/build-cmudict.ts`, `scripts/run-golden.ts`, `scripts/export-declarative-corpus-summary.ts`) and import specifiers were normalized to extensionless TS-native module paths.
- Evidence: `test/klsyn88.test.ts` assertions now match current klsyn88 primitive behavior (normalized impulsive amplitudes, bipolar square source, sustained-excitation delta modulation), and full suite passes via `npx vitest run` (`33` files / `115` tests).
- Evidence: production build passes via `npm run build` (Vite); emitted JS in `dist/` remains expected build artifact output.
- 2026-02-11: SyncAxis identity moved to runtime-internal mark entities with single-shape token fields (no dual `*_id` token fields).
- Evidence: `src/declarative-frontend/engine.ts` now resolves mark identity through `runtime.axis` for splice/finalize/invariant logic while keeping tokens canonical on `sync_left/sync_right/anchor_left/anchor_right`.
- Evidence: `test/declarative-frontend-axis-identity.test.ts` added to assert mark-ID-based runtime behavior and absence of dual token fields; full suite passes via `npx vitest run` (`34` files / `118` tests).
- 2026-02-11: scalar execution unified to phase-boundary resolution for all declared stream scalars (no mixed immediate/deferred declared-scalar path).
- Evidence: `src/declarative-frontend/engine.ts` now defaults declared scalars without explicit `resolution` to `standard`, accumulates declared scalar effects uniformly during rule execution, and resolves declared scalar fields at each phase boundary (explicit `resolve_scalars` still supported as override).
- Evidence: `test/declarative-frontend-scalar-resolution.test.ts` now validates automatic phase-boundary resolve for a declared scalar without explicit `resolution`/`resolve_scalars`; full suite passes via `npx vitest run` (`34` files / `118` tests).
- 2026-02-11: `textToKlattTrack()` output contract is now explicitly locked with schema-level tests.
- Evidence: `test/tts-frontend-output-contract.test.ts` verifies frame-key schema (`time`, `params`, optional `phoneme`/`word`), monotonic finite time, and stable full param-key coverage on every emitted frame.
- Evidence: full suite passes via `npx vitest run` (`35` files / `119` tests).
- 2026-02-11: runtime diagnostics hardened with stable error codes for rule-execution failures plus deterministic rule blame-path annotation.
- Evidence: `src/declarative-frontend/engine.ts` now emits coded runtime errors (e.g. `E_EFFECT_TARGET_UNKNOWN`, `E_SPLICE_BOUNDARY_REQUIRED`, `E_POINT_STREAM_INVALID`) and annotates thrown rule errors with `phase=<name> rule=<name> path=rules.<name>`.
- Evidence: `test/declarative-frontend-integration-diagnostics.test.ts` now validates runtime error code + blame path propagation; full suite passes via `npx vitest run` (`35` files / `120` tests).
- 2026-02-11: initial `tts-dsl` tooling surface landed with trace-backed `run|validate|explain|why-not|diff` workflows and contract tests.
- Evidence: `scripts/tts-dsl.ts` now provides CLI entrypoint with subcommands `run`, `validate`, `explain`, `why-not`, and `diff` over declarative engine/runtime.
- Evidence: `src/declarative-frontend/tooling.ts` now provides reusable snapshot/analysis APIs (`buildPhaseSnapshots`, `explainField`, `whyNotRule`, `diffPhaseState`) and runtime trace now includes `match`/`rewrite`/`error` events in addition to phase/rule/resolution events.
- Evidence: `test/declarative-frontend-cli.test.ts` validates CLI output contracts and trace schema event presence; full suite passes via `npx vitest run` (`36` files / `121` tests).
- 2026-02-11: strict SyncAxis order-object enforcement completed for runtime/test path (legacy numeric/string marks removed from declarative fixtures).
- Evidence: `src/declarative-frontend/engine.ts` now throws `E_SYNC_MARK_INVALID` when token sync/anchor fields are not `START|FINITE|END` order objects.
- Evidence: declarative fixture inputs were migrated to explicit order objects using `test/utils/order-marks.ts`; declarative/frontend suite passes via `npx vitest run` (`30` files / `88` tests).
- 2026-02-11: removed adapter indirection and made declarative frontend package entrypoint the single runtime surface.
- Evidence: `src/declarative-frontend/adapter.ts` deleted; `runDeclarativeFrontend` now lives in `src/declarative-frontend/index.ts` and callers import from `src/declarative-frontend`.
- Evidence: declarative rulepack + frontend regression subset passes via `npx vitest run test/declarative-frontend-slice.test.ts test/declarative-frontend-rulepack-context.test.ts test/declarative-frontend-rulepack-prosody.test.ts test/declarative-frontend-integration-phases.test.ts test/tts-frontend-declarative-prosody.test.ts test/tts-frontend-declarative-corpus.test.ts` (`6` files / `19` tests).
- 2026-02-11: TypeScript toolchain activation and project-scope typecheck baseline established.
- Evidence: `package.json`/`package-lock.json` include `typescript` as dev dependency, and `tsconfig.json` `rootDir` is now `"."` so scripts/tests/config are included consistently.
- Evidence: `npx tsc --noEmit` now runs project-wide and reports current strict-type backlog (primarily `scripts/*.ts`, `src/declarative-frontend/*.ts`, and `test/test-harness.ts`).
- 2026-02-11: targeted strict typing cleanup landed for sync-axis/util tooling surfaces and axis identity tests.
- Evidence: `src/declarative-frontend/axis.ts` now has explicit `OrderObject`/`SyncAxis` types with finite-rank comparison narrowing fixed in `compareOrderValue`.
- Evidence: `test/declarative-frontend-axis-identity.test.ts` and `test/declarative-frontend-sync-axis.test.ts` now use explicit token typing and runtime axis guards, eliminating local strict `implicit any`/nullable-axis type noise.
- Evidence: focused regression remains green via `npx vitest run test/declarative-frontend-axis-identity.test.ts test/declarative-frontend-sync-axis.test.ts test/declarative-frontend-cli.test.ts` (`3` files / `7` tests), and filtered strict check for axis/tooling/test files is clean.
- 2026-02-11: layered TypeScript gate bootstrapped for typed declarative primitives (`axis`/`order`/`model`) and made CI-ready via npm script.
- Evidence: `tsconfig.core.json` added and `package.json` now exposes `npm run typecheck:core` (`tsc -p tsconfig.core.json --noEmit`) to validate the strict typed subset independently of broader backlog.
- Evidence: `src/declarative-frontend/order.ts` and `src/declarative-frontend/model.ts` now have explicit exported domain types/signatures and strict-safe narrowing/indexing.
- Evidence: `npm run typecheck:core` passes and full regression remains green via `npx vitest run` (`36` files / `122` tests).
- 2026-02-11: core type gate expanded to include JSONata expression runtime typing.
- Evidence: `src/declarative-frontend/expressions.ts` now has explicit compile/validate/evaluate signatures and Promise-like guard typing, and `tsconfig.core.json` includes this module.
- Evidence: `npm run typecheck:core` remains green and focused regression (`jsonata` + `order/model` + `sync-axis`) passes (`5` files / `15` tests).
- 2026-02-11: parser typing cleanup landed and core type gate now covers parse layer in addition to primitives/expressions.
- Evidence: `src/declarative-frontend/parser.ts` now uses explicit plain-object guards, typed normalizers, and a typed `parseDslSpec` signature; `@types/js-yaml` was added for strict compile support.
- Evidence: `tsconfig.core.json` now includes `src/declarative-frontend/parser.ts`; `npm run typecheck:core` remains green and full regression remains green via `npx vitest run` (`36` files / `122` tests).
- 2026-02-11: validator typing cleanup landed and core gate now validates parser+validation layers together.
- Evidence: `src/declarative-frontend/validation.ts` now has explicit diagnostic/spec signatures and strict-safe narrowing for scalar/phase ordering checks.
- Evidence: `tsconfig.core.json` now includes `src/declarative-frontend/validation.ts` and `test/declarative-frontend-schema.test.ts`; `npm run typecheck:core` remains green and full regression remains green (`36` files / `122` tests).
- Limitation: runtime now rejects legacy numeric/string sync-mark inputs (`E_SYNC_MARK_INVALID`); no temporary auto-migration adapter exists for non-object mark payloads.
- Limitation: finalize timing still uses runtime-inferred marks rather than a full explicit sync-axis object model (spec sentinel semantics and full Part 9 diagnostics remain incomplete).
- Limitation: project-wide strict typecheck (`npx tsc --noEmit`) remains red due broad implicit-`any` and typing gaps in runtime/scripts; a first staged gate (`typecheck:core`) exists, but additional layered gates are still needed.
- Limitation: declination now resets phrase-locally, but remains index-based and does not yet implement the prior imperative time-based phrase-shape details (initial boost/continuation-rise decomposition).
- Limitation: locked corpus golden currently validates track-summary metrics, not full sample-level rendered waveform equivalence.
- Limitation: scalar unification now applies to declared top-level scalar fields; nested dotted fields (e.g. `params.F2`) remain immediate unless promoted to declared scalar fields in stream metadata.
- Limitation: sync-axis order keys now use sentinel/rank objects for bootstrap, but the runtime still treats marks as inline values on tokens (not full `SyncMark` entities with stable IDs/time cells), so full Part 1.1/1.2 object-model parity remains incomplete.

## 3) Master Checklist (Spec-to-Code Execution)

### [A] Execution Grounding

- [ ] `A1` `NOT_STARTED`: Add this plan status check into CI or PR template so status updates are enforced.
- [ ] `A2` `NOT_STARTED`: Create a migration branch rule: no new imperative frontend logic merged into `src/tts-frontend.ts` or `src/tts-frontend-rules.ts`.
- [x] `A3` `DONE`: Enforce declarative-maximization guardrail: no new domain behavior via custom `rule.op`; prefer generic DSL actions.

### [B] Engine Core (Spec Parts 0, 1, 5, 9)

- [ ] `B1` `IN_PROGRESS`: Implement full typed model for sync marks, interval/point tokens, token status lattice, associations, and stream topology.
- [ ] `B2` `IN_PROGRESS`: Replace slice executor with deterministic phase/rule/match execution with quiescence and match identity semantics.
- [ ] `B3` `IN_PROGRESS`: Implement complete diagnostics catalog from spec Part 9 with stable codes and blame paths.
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
- [ ] `E3` `IN_PROGRESS`: Implement scalar resolution (`set`, `mul`, `add`) including Klatt incompressibility handling.
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
- [x] `G2` `DONE`: Remove imperative post-processing loops in `src/tts-frontend.ts`.
- [x] `G3` `DONE`: Keep output contract as current `KlattFrame[]` shape for downstream runtime.

Acceptance criteria:
- `src/tts-frontend.ts` contains no imperative phonological/phonetic rule pipeline.
- Frontend path is declarative-only in production runtime.

### [H] Dead Code Removal and Source of Truth Cleanup

- [x] `H1` `DONE`: Remove `rule_K_Context` and `rule_GenerateF0Contour` from runtime usage.
- [x] `H2` `DONE`: Remove obsolete imperative rule mutators from `src/tts-frontend-rules.ts`.
- [ ] `H3` `NOT_STARTED`: Decide and enforce single source of truth for inventory/constants (prefer declarative assets).

Acceptance criteria:
- No operational dependency on removed imperative rule code.
- Code ownership boundaries are clear (`declarative-frontend/**` owns rule behavior).

### [I] Tooling Completion (Spec Part 10 + CLI doc)

- [x] `I1` `DONE`: Implement trace model sufficient for match/rewrite/resolve/error sequencing.
- [x] `I2` `DONE`: Implement explain/why-not/diff APIs on top of trace/provenance data.
- [x] `I3` `DONE`: Add `tts-dsl` CLI entrypoint and subcommands from `projects/declarative-frontend/cli.md`.
- [x] `I4` `DONE`: Add contract tests for CLI outputs and trace schemas.

Acceptance criteria:
- `tts-dsl run|validate|explain|why-not|diff` are functional.
- Trace and debugger-oriented introspection are usable for rule debugging.

### [J] Test and Release Gate

- [ ] `J1` `IN_PROGRESS`: Keep and expand unit tests for order/parser/validation/engine determinism.
- [x] `J2` `DONE`: Add integration tests for phases, diagnostics, and finalize behavior.
- [x] `J3` `DONE`: Add declarative-only frontend behavior tests on phrase corpus.
- [ ] `J4` `IN_PROGRESS`: Run golden verification and lock outputs after review.
- [x] `J5` `DONE`: Update docs to describe declarative frontend as current architecture.

Acceptance criteria:
- Required tests pass in CI.
- Docs no longer describe declarative frontend as future work.

### [K] Principled Cleanup Track (TS-Native, Vite)

- [ ] `K1` `IN_PROGRESS`: Introduce first-class `SyncAxis` model (`SyncMark` entities with stable IDs, order keys, and times) and stop relying on inline mark values on tokens.
- [ ] `K2` `IN_PROGRESS`: Enforce full base coverage invariant as partition of `[START, END]` per base stream (not interior adjacency only).
- [ ] `K3` `IN_PROGRESS`: Make structural rewrites fully axis-driven (`insert_at_boundary`/`replace_range` by mark identity) with deterministic conflict semantics.
- [ ] `K4` `IN_PROGRESS`: Unify scalar execution so all declared scalar fields resolve at phase boundaries (remove mixed immediate/deferred behavior).
- [ ] `K5` `IN_PROGRESS`: Resolve timing on axis entities (`mark.time`) and point-time computation from mark IDs only.
- [ ] `K6` `IN_PROGRESS`: Refactor runtime into TS-native modules (`axis`, `rewrite`, `scalars`, `timing`, `invariants`, `diagnostics`) with explicit contracts.
- [x] `K7` `DONE`: Add `ts-node`-compatible entrypoints and keep Vite/Vitest workflows green through migration.
- [ ] `K8` `IN_PROGRESS`: Add executable spec fixtures + determinism/property tests for axis ordering, rank insertion/rebalance, and rewrite stability.
- [ ] `K9` `IN_PROGRESS`: Land layered TypeScript check gates (core/frontend first, scripts/harness next) and drive `npx tsc --noEmit` to green.

Acceptance criteria:
- Declarative frontend core modules are TypeScript-first, with deterministic behavior preserved.
- Invariants and diagnostics align with spec Part 1/5/9 semantics (including sentinel anchoring and stable blame paths).
- No runtime behavior depends on imperative or transitional fallback paths.

## 4) Sequenced Event Plan (Agent Execution Order)

1. Complete missing declarative primitives first: remaining `D2/D3` helpers + `E2` actions + `E4` finalize/point timing.
2. Complete `E3` scalar resolution semantics and diagnostics hardening (`B3/B4`).
3. Execute `K` principled-cleanup slices in order: axis entities -> full coverage invariants -> axis-driven rewrites -> scalar/timing unification -> TS module split.
4. Complete any remaining runtime behavior parity adjustments in declarative rules (core migration items `F3-F6` are now done) only after required primitives are in place.
5. Execute hard cutover and deletions in one set: `G` + `H`.
6. Complete `I` (tooling) on declarative-only runtime.
7. Complete `J` and finalize docs/release.

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
