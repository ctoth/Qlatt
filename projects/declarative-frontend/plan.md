# Declarative TTS Frontend DSL v11 — Full Implementation Plan (TDD)

This plan translates the spec into an executable, tested frontend implementation. It is structured for a coding agent to follow end‑to‑end, with explicit milestones, architecture decisions, and a test‑first sequence.

Scope: the full compilation contract, rule evaluation pipeline, validation, tracing/introspection, CLI features, and deterministic behavior described in `spec.md`, `tracing.md`, `cli.md`, and `implementation-notes.md`.

Assumptions:
- Target runtime: Node 18+ with TypeScript 5.x (as suggested by `implementation-notes.md`).
- JSONata is the expression language and must follow the “data root” evaluation model.
- Determinism is mandatory; iteration order and sorting rules are fixed by the spec.


---
## 1) Project Outcomes

Deliverables:
- A TypeScript library that loads a DSL YAML spec and executes the compilation pipeline.
- A CLI `tts-dsl` matching `cli.md` functionality (run, validate, explain, why-not, diff, visualize, profile, debug, lsp, completion).
- A trace system that emits events and provenance per `tracing.md`.
- A complete test suite driven by TDD, covering spec invariants, pipeline phases, ordering, resolution, and error codes.

Non-goals (unless explicitly requested later):
- G2P, audio backend, or actual synthesis. The frontend ends at output mapping.
- Full LSP IDE integration beyond a minimal mode if not required for acceptance tests.


---
## 2) Architecture Overview

High-level modules (suggested folder layout):
- `src/core/` data model + ordering + ranks
- `src/parser/` YAML schema, AST, spec validation
- `src/engine/` pipeline, matching, patching, normalization, resolution
- `src/expr/` JSONata integration and registered functions
- `src/trace/` tracing, diffing, provenance, profiling
- `src/cli/` command implementations + wiring
- `src/visualize/` timeline HTML/SVG generator
- `src/lsp/` LSP server (if required by tests)
- `test/` unit + integration + golden tests

Key data structures:
- `SyncMark`, `OrderKey`, `IntervalToken`, `PointToken`, `ScalarState`, `ResolvedEffect`
- Stream registries: base, span, parallel, point
- Snapshot state: immutable views per phase, with copy‑on‑write patch application

Core invariants:
- Deterministic order of phases, rules, matches, and patch application.
- Base stream partitions `[START, END]` in order‑space with no gaps.
- Sync marks order total, ranks fixed‑length base‑36.
- Span boundaries recomputed from children; empty spans collapse right to left.


---
## 3) Implementation Milestones (TDD)

Each milestone is test‑first. Do not implement production logic before its tests exist.

### Milestone 1: Rank and Order Utilities
Goal: deterministic order comparison and rank insertion/rebalance.

Tests:
- `compareOrder` START < FINITE < END; FINITE lex order by ASCII.
- Rank validation for `[0-9a-z]{RANK_LEN}`.
- `rankBetween` produces rank strictly between lo/hi; error on no space.
- `rebalanceRanks` returns strictly increasing fixed‑length ranks.

Implementation:
- Use `implementation-notes.md` as reference for `order_rank.ts`.


### Milestone 2: Core Data Model and Stream Ordering
Goal: model tokens, marks, and stream ordering semantics.

Tests:
- Token and mark shape validation (interval vs point).
- Stream ordering:
  - Base stream order is list order.
  - Non‑base interval stream ordering is `(sync_left.order, sync_right.order, id)`.
  - Point stream ordering is `(anchor_left.order, anchor_right.order, ratio, id)`.
- `$prev/$next` semantics for base stream adjacency (list order only).

Implementation:
- TypeScript interfaces and ordering functions.
- Stable ID generator (deterministic in tests).


### Milestone 3: YAML Parse + Schema Validation (Part 9)
Goal: parse YAML to AST, validate schema and invariants.

Tests:
- Valid spec parses and loads with defaults.
- Invalid ranks → `E_RANK_INVALID`.
- Duplicate sync mark IDs → `E_MARK_ID_DUP`.
- Invalid phase dependencies → `E_PHASE_ORDER_VIOLATION`.
- Invalid JSONata expression → `E_JSONATA_INVALID`.

Implementation:
- JSON schema or zod-based validator.
- Pre‑validation of JSONata: compile once, errors map to rules.


### Milestone 4: JSONata Integration
Goal: correct evaluation context and registered functions.

Tests:
- Data root model: context fields accessed without `$` (e.g., `current.f.manner`).
- `$` prefix is exclusively for registered functions (`$parent`, `$next`, etc.).
- TokenView facade mapping:
  - `t.f` → `t.features`
  - `t.s.<field>` → resolved scalar value if present, otherwise base
- `undefined` propagation behavior for missing features.

Implementation:
- JSONata wrapper with cache per expression string.
- TokenView facade mapping `features → f`, resolved scalars to `s`.


### Milestone 5: Pattern Matching Engine
Goal: deterministic left‑to‑right match enumeration.

Tests:
- Deterministic match order based on earliest involved sync mark (leftmost).
- Conformance tests: given a fixed snapshot, pattern matches enumerate in the spec‑defined order regardless of implementation strategy (regex/PEG/etc.).
- `max_lookahead` cap; pattern fails when exceeded.
- `optional`, `*`, `+` quantifiers shape.
- `cross_boundary` constraint and scope (phrase/word/syllable/utterance).

Implementation:
- Pattern compiler to an internal representation.
- Match enumeration returns captures and span (left/right boundary).


### Milestone 6: Patch Generation + Sorting + Splice Overlap Policy
Goal: generate patches for apply/splice/insert/delete rules with deterministic sorting.

Tests:
- Patch sorting key: `(rule_index, match_index, patch_seq)`.
- Overlapping splices resolved by sort key: earlier wins, later shadowed; trace `patch_skipped` reason = `shadowed`.
- Overlap fixtures where two splices delete the same token but with different insertions to confirm shadowing behavior (and conflict behavior only in strict mode).
- Strict mode conflict detection if enabled.
- Delete on non‑base tokens removes from stream + associations.

Implementation:
- Patch types: `insert_at_boundary`, `replace_range`, `splice_range`, `delete_token`, `insert_point`.
- Shadowing logic per Part 9.


### Milestone 7: Base Splice Application + Sync Mark GC
Goal: apply splices and maintain base coverage invariant.

Tests:
- Insert at boundary splits range correctly with new marks as needed.
- Replacement deletes correct tokens and inserts replacements with new marks.
- Base stream coverage after splice: no gaps/overlaps or `E_BASE_NOT_CONTIGUOUS`.
- Sync mark GC runs after patch application and before span rebuild (pipeline Step 8).
- Sync mark GC removes unreferenced marks outside any base interval; interior marks retained for interpolation.

Implementation:
- Splice batching and range tracking.
- Sync mark rebalancing on `E_RANK_NO_SPACE`.


### Milestone 8: Span Rebuild + Normalization
Goal: rebuild span boundaries and validate invariants after phase.

Tests:
- Span boundary recompute matches min/max child boundary.
- Empty span collapse sets `sync_right = sync_left` and emits `W_EMPTY_SPAN`.
- Normalization detects `E_TOKEN_BAD_INTERVAL`, `E_MARK_MISSING`.

Implementation:
- Normalize function in pipeline step 5.13.


### Milestone 9: Scalar Resolution (Klatt + Standard)
Goal: compute resolved scalars, apply incompressibility for duration.

Tests:
- Effect ordering preserved (global order + per‑patch order).
- `resolution: standard` applies ops in order.
- `resolution: klatt` uses `d = K * (d - floor) + floor` for `mul` (no division).
- Concrete Klatt case: base=240, floor=105, effect mul 0.8 → result 213.
- Clamp to min/max where specified.

Implementation:
- `resolve_scalars` takes `ScalarState`, `ResolvedEffect[]`, and stream config.


### Milestone 10: Time Computation + Point Resolution
Goal: compute sync mark times and resolve point values/times.

Tests:
- Base durations accumulate with `START.time = 0`.
- Interior marks interpolated by rank distance.
- `END.time` equals total duration.
- `E_TIME_NO_BASE_SUPPORT` when mark cannot be enclosed.
- Point time formula and deferred JSONata evaluation.

Implementation:
- `compute_times` and `resolve_points` steps per 5.11 and 5.12.


### Milestone 11: Tracing + Provenance + Diff
Goal: trace events, provenance, and snapshot diffing.

Tests:
- `match_attempt`, `match_success`, `match_failure` emitted with correct fields.
- `scalar_resolution` includes steps and effects.
- `explain(token, field)` returns provenance chain.
- Snapshot diff returns added/deleted/modified tokens and marks.

Implementation:
- Trace sink interface (JSONL, HTML, SQLite).
- Provenance tracking inside scalar resolution and patch application.


### Milestone 12: Output Mapping + Interpolation
Goal: produce output frames from scalars/points per mapping.

Tests:
- Scalar interpolation for linear/step with blend points.
- Point interpolation for monotone cubic (or stub + TODO if not required).
- Output format `klatt_frames` + JSON.

Implementation:
- Frame generator with `frame_rate_ms`.
- Extrapolation, duplicate policy per spec.


### Milestone 13: CLI + Debug + Profile + LSP
Goal: CLI matching `cli.md` behaviors.

Tests:
- `tts-dsl validate` returns correct exit codes and formats.
- `run` supports input formats and phase control.
- `explain`, `why-not`, `diff`, `visualize`, `profile` commands parse options.
- LSP mode starts and responds minimally (if required).

Implementation:
- Command routing with shared engine.
- Output formatting (text/json/sarif).


---
## 4) Detailed Test Plan (TDD Emphasis)

Test layers:
- Unit: rank utils, ordering, JSONata wrapper, scalar resolution.
- Component: matcher, patch generator, splice application, normalization.
- Integration: phase pipeline end‑to‑end with minimal spec fixtures.
- CLI: snapshots of stdout/stderr and exit codes.

Fixtures:
- Minimal spec with one base stream, one span stream, one point stream.
- Examples from `spec.md` Appendix A.
- Error fixtures for each diagnostic code in Part 9.

Golden tests:
- Token streams and sync mark times after each phase.
- Trace JSONL for a small input (deterministic output).

Coverage targets:
- All diagnostics in Part 9.
- All rule types in Part 6.
- All pipeline steps in Part 5.


---
## 5) Determinism Checklist

Ensure all tests verify:
- Phase order exactly as listed (ignoring `after` except for validation).
- Rule order in each phase = list order.
- Match enumeration left‑to‑right; sort by leftmost sync mark.
- Patch sort key `(rule_index, match_index, patch_seq)`.
- Stable ordering for non‑base streams.
- No fixpoint iteration unless explicitly added.


---
## 6) Error/Warning Handling

Diagnostic mapping must match Part 9:
- Errors: `E_*` codes thrown or emitted.
- Warnings: `W_*` emitted in trace and/or CLI when configured.

Test each diagnostic:
- Provide failing fixture and ensure code + blame field are correct.


---
## 7) Trace + Debug Integration

Trace config requirements:
- JSONL streaming output (default).
- HTML report (self‑contained with timeline).
- SQLite output (schema in `tracing.md`).

Debugger requirements:
- Breakpoints by phase, rule, match, patch, token, or condition.
- Step controls and query API.

Minimal viable debug:
- Implement a debug controller with callbacks to the engine.
- Condition evaluation uses JSONata with current context.


---
## 8) Performance and Profiling

Profiling instrumentation:
- Per phase time breakdown.
- Per rule timing and expression evaluation stats.
- Memory stats (token/mark counts, snapshot copies).

Tests:
- Ensure profile report schema matches `tracing.md`.
- Verify counts and totals for a small fixture.


---
## 9) Suggested Implementation Order (Day-by-Day)

Day 1–2:
- Rank utilities + ordering.
- Core data model + basic validation.
- JSONata wrapper + TokenView facade.

Day 3–4:
- Pattern matching + patch generation.
- Base splice application + mark GC.

Day 5–6:
- Normalization + scalar resolution + time computation.
- Point resolution + output mapping.

Day 7–8:
- Tracing/provenance + diff engine.
- CLI core commands (`run`, `validate`, `explain`, `why-not`, `diff`).

Day 9–10:
- Visualization, profiling, debug support.
- LSP mode (if required).


---
## 10) Acceptance Criteria

The implementation is accepted if:
- All tests pass with deterministic output.
- All diagnostics in Part 9 are covered with tests.
- CLI commands work per `cli.md`.
- Trace and provenance outputs align with `tracing.md`.
- Spec Appendix A runs end‑to‑end producing consistent output.


---
## 11) Risks and Mitigations

Risk: JSONata evaluation semantics differ by library version.
Mitigation: Pin JSONata version and add golden tests for expressions.

Risk: Rank insertion failures due to dense marks.
Mitigation: Implement rebalance + tests for `E_RANK_NO_SPACE`.

Risk: Overlapping splice conflicts.
Mitigation: Strict mode tests; default is shadowing with trace.


---
## 12) Definition of Done

- All milestones completed with tests.
- Full pipeline works on Appendix A example.
- CLI produces trace outputs and debug features.
- Documentation updated for any implementation-defined choices.
