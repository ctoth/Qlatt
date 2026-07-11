# Declarative Frontend HRG Convergence Plan

Status: complete as of 2026-07-11. All phases and gates are recorded in
`plans/declarative-frontend-hrg-convergence-log.md`; no phase was deferred.

Authority: this plan specializes and amends `plans/declarative-architecture-completion-plan.md` for the frontend IR boundary. The architecture decision comes from `design/beauty-synthesis/11-sota-frontend-architecture.md` and `design/beauty-synthesis/12-fe-architecture-recommendation.md`.

## 1. Objective

Qlatt will have one frontend working representation: a provenance-stamped Heterogeneous Relation Graph (`Utterance`). Text input enriches that graph. Direction Track attachment is implemented and directly tested before the production flag day, then wired as an input enrichment stage during the cutover. Declarative rules read and write the graph. One final lowering projects the graph into backend frames. No completed flat frontend track is converted back into an HRG, and no standalone mutable control-score token array exists beside the graph.

The completed production flow is:

```text
Score + Direction Track
  -> normalization and transcription into Utterance
  -> graph-native declarative rule phases
  -> graph-native symbolic and phonetic control relations
  -> one final HRG lowering
  -> backend frame track
  -> runtime and audio graph
```

This plan resolves all of the following:

1. the backwards additive HRG bridge;
2. trace-derived provenance;
3. the untyped, mutable rulepack lifecycle;
4. the qlatt-English inventory resolver hidden inside the generic entrypoint;
5. duplicated select/pattern rewrite execution and duplicate cache invalidation;
6. DECtalk-specific policy embedded in the generic CEL engine;
7. rerun-based tooling and the fake debug test;
8. the contradiction between the older standalone `DeclarativeControlScore` roadmap and the later HRG architecture.

## 2. Authority and supersession

The authority order for this work is:

1. `AGENTS.md` for explainability, citation, diagnostics, Git, and execution rules;
2. `design/beauty-synthesis/12-fe-architecture-recommendation.md` for the unified frontend architecture;
3. `design/beauty-synthesis/11-sota-frontend-architecture.md` for the HRG rationale and one-lowering requirement;
4. this focused plan for implementation order and deletion gates;
5. `plans/declarative-architecture-completion-plan.md` for the broader declarative program where it does not conflict with the documents above.

The older completion plan remains the coordinator for normalization, policy extraction, runtime concepts, and backend adapters. Its statements that a standalone control score is the canonical working IR are superseded here. In the converged architecture, "control score" means the backend-neutral control relations and typed feature histories inside the HRG. It is not a second production object.

`plans/declarative-control-score-roadmap/README.md` becomes historical design input. Any still-valid field vocabulary is migrated into HRG relation schemas or final-lowering policy. It does not authorize retaining `DeclarativeControlScore`, `buildDeclarativeControlScore()`, or `public/rules/control-score.yaml` as a parallel IR.

## 3. Resolved terminology

- **Score:** clean text plus its token and phrase ranges before linguistic realization.
- **Direction Track:** typed, cited, aligned expressive intent over the Score.
- **Utterance:** the one HRG item pool, relation registry, temporal axis, provenance collector, and diagnostics context for a frontend run.
- **Item:** stable shared identity with typed, versioned feature writes.
- **Relation:** an ordered list or tree view over shared Items.
- **Control relations:** HRG relations such as `Transition`, `Intonation`, `Tilt`, `PhraseCommand`, and `Affect` whose features express backend-neutral phonetic intent.
- **Current value:** the latest write for an Item feature.
- **Append-mostly:** Items, relation membership, and all feature-write history remain addressable. A new version can supersede a feature's current value but never erases its prior write.
- **Trace:** observational execution telemetry. Trace is not provenance truth.
- **Transaction:** one matched rule's fully validated set of feature and relation writes, committed atomically.
- **Final lowering:** the only projection from HRG state into a flat backend frame track.
- **Legacy flat vocabulary:** `TokenLike[]`, token `stream` fields, `streams:` declarations, `select.stream`, token-status mutation as structural deletion, standalone control-score arrays, and completed-track-to-HRG reconstruction.

## 4. Non-negotiable invariants

1. Exactly one production frontend IR exists after the flag day: `Utterance`.
2. A flat frame track exists only after final lowering.
3. The production code never reconstructs linguistic structure from realized frames or phone summaries.
4. Every feature write and every structural relation mutation creates its `DecisionRecord` in the same transaction.
5. Every rule transaction carries the rule id, application tag, citations, reason, and read-set parent decisions.
6. Diagnostics report fallback, clamp, default, rejected mutation, and runtime observation; they do not substitute for provenance.
7. The selected frontend spec owns its inventory and resources. Generic code names no bundled frontend.
8. A rulepack is include-resolved, normalized, validated, CEL-checked, and frozen once before execution.
9. Decoded YAML shapes do not cross into the runtime. `Record<string, any>` stops at the parse boundary.
10. Match discovery and rewrite execution are separate, but there is exactly one rewrite executor.
11. One transaction owns cache/index invalidation. A structural rule cannot invalidate the same cache in both the firing loop and phase loop.
12. The generic CEL language contains only frontend-neutral operations.
13. All three bundled frontends (`qlatt-english`, `dectalk-english`, and `qlatt-beauty`) use the same graph-native engine. There is no beauty-only HRG route. For `qlatt-beauty`, this is a structural guarantee—resource identity, graph construction, rule execution, and structural lowering—not a content-parity guarantee: its current frontend header identifies placeholder inventory/phases and it has no production corpus. Replacing that placeholder content remains in the beauty-synth content workstream, outside this IR convergence plan.
14. No compatibility adapter, bridge, alias, fallback reader, dual schema, or old/new production branch survives convergence.
15. Missing required duration, timing, relation attachment, or lowering data is a validation/runtime error with diagnostics; it is not silently replaced with `100 ms`, `30 ms`, `SIL`, or another magic fallback unless the selected frontend explicitly declares and cites that policy.

## 5. Target HRG model

### 5.1 Utterance ownership

`Utterance` owns:

1. the stable Item pool;
2. named Relations and their topology;
3. typed relation/item schemas compiled from the frontend spec;
4. the synchronization axis and resolved time marks;
5. versioned feature and relation-write histories;
6. the `ProvenanceCollector`;
7. runtime diagnostics for graph construction and mutation;
8. phase checkpoints and the deterministic transaction journal used by tooling and replay.

Temporal ordering currently split between `axis.ts`, token mark fields, engine caches, and flat sequence order moves behind the Utterance/Relation owner. Rules never coordinate raw `sync_left`, `sync_right`, rank ids, and relation membership through loose token fields.

### 5.2 Canonical relations

| Relation | Kind | Item identity | Required role |
|---|---|---|---|
| `Token` | list | orthographic token | Score alignment and normalization history |
| `Word` | list | lexical word | pronunciation, POS, given/new, phrase membership |
| `Syllable` | list | syllable | stress, accent carrier, syllable position |
| `Segment` | list | realized segment/subsegment | phoneme/allophone, duration, inventory and scalar targets |
| `SylStructure` | tree | shared Word/Syllable/Segment Items | word to syllable to segment backbone |
| `Transition` | list | transition event | locus, smoothing, control windows, boundary behavior |
| `Intonation` | list | symbolic event | accent/boundary label as provenance handle |
| `Tilt` | list | phonetic intonation event | continuous amplitude, duration, and tilt |
| `PhraseCommand` | list | phrase command | Fujisaki/declination controls |
| `Affect` | list | direction/gesture event | voice-quality and affect deltas |
| `Break` | list | break event | explicit and inferred prosodic boundaries |
| `F0Point` | list | time-anchored point | final explicit point controls where a frontend uses them |

Subsegmental releases, aspirations, closures, and bursts are Segment Items with explicit subtype features and shared structural attachment. They are not anonymous flat tokens.

### 5.3 Typed features

The current free `Item.type: string` and free `set(key, FeatureValue)` surface is insufficient. The compiled frontend spec defines the allowed Item types, allowed relation membership, feature names, value schemas, required features by phase, and whether a feature is writable by a phase.

TypeScript models durable graph concepts as discriminated types. Structured feature values are immutable validated values, not arbitrary nested dictionaries. The implementation must not add a wrapper around the existing untyped `Item`; it must make the Item/Utterance owner enforce the compiled schema directly.

Each successful feature write records:

```text
itemId
feature
typed value
version
decisionId
ruleId or producing stage
tag
reason
citations[]
parents[]
timestamp/anchor when applicable
```

Each successful relation write records membership/topology operation, relation name, involved Item ids, decision id, reason, citations, parents, and version. Relation operations that currently mutate links silently (`append`, `addRoot`, `addDaughter`) become stamped Utterance-owned mutations.

### 5.4 Transactions

A rule firing first builds an in-memory transaction. The transaction resolves every target, evaluates every expression, validates every value and relation constraint, and collects its read-set. Only then does it commit writes. Failure produces diagnostics and no partial graph mutation.

The transaction journal is the source for deterministic replay and phase inspection. Provenance is produced by committed writes; trace can additionally record timings and rejected matches.

### 5.5 CEL read-set instrumentation

Read-set capture is explicit and transaction-local; it is not inferred from expression text after evaluation.

1. Every CEL-visible Item/cursor is a per-evaluation tracking `Proxy` backed by the live Item and the active transaction's `ReadTracker`.
2. A property read resolves the current typed feature through the Item owner and records that feature version's `decisionId` in the transaction-local set before returning the value.
3. Optional access, `has`, bracket access, nested structured features, predicate calls, navigation results, and relation-path reads use tracking views tied to the same `ReadTracker`.
4. A relation/topology read records the stamped membership or edge decision that made the navigation result reachable.
5. Policy/resource values record the compiled frontend/resource decision that supplied them where those values participate in provenance.
6. Short-circuited CEL branches contribute no parents because they were not read.
7. The tracker is passed explicitly with the evaluation context. No module-global or thread-local mutable tracker is allowed.

This design is compatible with the installed CEL evaluator's object property access, which resolves plain-map fields through JavaScript property reads. The implementation must prove direct, optional, bracket, nested, navigation, predicate, and short-circuit tracking in focused tests before rule transactions depend on it.

The existing module-global `_currentFunctions` dispatch in `cel-expressions.ts` is deleted during this work. Per-evaluation function bindings and read tracking cannot rely on synchronous global mutable state or become non-reentrant.

## 6. Compiled frontend and rulepack boundary

The construction pipeline is:

```text
frontend path/id
  -> load YAML sources
  -> resolve includes into a fresh document
  -> normalize once
  -> validate schema, citations, tags, relations, policies, and CEL
  -> compile immutable frontend spec
  -> cache by resolved identity/path
```

`loadRulepackSpecFromPath()` and `loadBundledRulepackSpec()` return only this compiled immutable representation. `runRuleEngine()` does not accept `unknown`, raw YAML objects, or mutable parsed objects. The `SPEC_VALIDATED` symbol, mutable validation marker, duplicate `ROOT_DSL_KEYS`, and runtime parse-or-trust branch are deleted.

Include merge rules belong to the loader. Normalization and DSL root knowledge belong to the parser/compiler. Validation consumes typed normalized nodes. Runtime consumes the compiled representation and does not repeat `typeof`/`Array.isArray` schema checks.

The selected frontend spec supplies `inventory_path`, LTS, morphology, dictionary, normalization, speakers, source contour, lowering policy, and other resources. The generic engine has no default inventory resolver. A direct engine test supplies a compiled spec and an Utterance fixture; frontend orchestration loads resources from its selected spec.

## 7. Graph-native rule semantics

### 7.1 Matching

Select and pattern forms both produce a `Match` containing bound Item identities and their relation nodes. A select match is the one-binding case; a pattern match contains named bindings. Contour context is derived from relation/axis state and attached to the Match.

The two forms do not own separate mutation pipelines. One rewrite executor handles:

1. feature effects;
2. scalar effect accumulation and resolution;
3. relation association/disassociation;
4. Item insertion and structural attachment;
5. point, contour, and F0-layer insertion;
6. versioned suppression when a rule removes an Item from the active view;
7. stamped provenance;
8. transaction journal emission;
9. one cache/index invalidation after commit.

Physical Item deletion is forbidden during a run because it destroys explanation and replay. A suppress/delete rule creates a stamped lifecycle-state version and removes the Item from active relation views without erasing identity or prior topology.

### 7.2 Navigation

CEL `current`, `prev`, `next`, `ahead`, and `behind` operate on the selected Relation. HRG path navigation (`R:Relation`, `parent`, daughters, next/previous) operates on shared Item identity. Word, syllable, phrase, boundary, and association queries derive from graph structure instead of rescanning loose token fields.

The engine retains generic mathematical, temporal, lookup, merge, path, and relation functions. It does not retain `dectalk_obstruent_profile` or any frontend-named operation. DECtalk profile selection is expressed in its inventory/rule data with ordinary conditions and map access. `trajectory_to_windows` remains only if its semantics are frontend-neutral and its name/documentation are generalized.

CEL function names, signatures, zero-argument status, validation allowlist, and runtime implementation contract have one typed catalog owner. The environment and engine cannot maintain independent name lists.

### 7.3 DSL vocabulary convergence

The final DSL uses `relations:` declarations, `select.relation`, and relation-aware patterns. `streams:`, `select.stream`, token `stream` fields, and topology inferred from `base|span|point` token streams are rejected before the graph-native engine is built.

Relation declarations specify relation kind, Item type, temporal role, feature schema, and scalar definitions. Temporal role can be base interval, point, span, or non-temporal; it does not change the HRG relation's list/tree topology.

All bundled rulepacks migrate in the Phase 2 schema flag day while the existing flat engine is still the production runtime. That engine is mechanically updated to consume the final relation-named compiled fields without changing its representation. The parser never accepts both old and new keywords. A checked-in migration script may mechanically rewrite authoring files, but it is deleted after the migration unless it remains a useful validator; no compile-time or runtime compatibility reader is allowed. The replacement graph engine is therefore developed and tested against the final DSL, and the production flag day needs no stream-to-relation adapter.

## 8. Provenance and diagnostics

The existing trace-to-provenance middleware is deleted. `emitRuleTraceDecisions()`, `buildRuleCitationsMap()`, `RULE_CITATIONS`, provenance-only engine execution, and the token-id side map do not survive.

Rule metadata is present in the compiled rule. The transaction reads it at the point of mutation. Every write's parents include:

1. the latest decisions for features read by CEL;
2. relation membership/topology decisions read through navigation;
3. prior version decision when superseding a feature;
4. upstream input/Direction decisions consumed by the rule.

Trace remains optional observational data for phase/rule timing, match diagnostics, and rejected-transaction debugging. Turning trace on or off cannot change provenance or synthesis.

`why` queries read feature/relation write history. `why not` evaluates and returns structured predicate/constraint evidence against the recorded phase checkpoint. It does not merely report the absence of a match trace.

## 9. One final lowering

`src/declarative-frontend/hrg/lowering.ts` becomes the sole frontend-to-frame lowering owner. It must consume Segment, Transition, Intonation, Tilt, PhraseCommand, Affect, Break, explicit point, speaker, and lowering-policy data without reconstructing intent from a completed track.

Capabilities currently owned by `src/track-assembler.ts` receive a breakage review after that file is deleted in the flag-day worktree:

1. capability already represented in HRG relations: implement it in final lowering;
2. frontend policy disguised as lowering: move it to cited rules/relations;
3. backend-specific realization: move it to the selected backend lowering/semantics policy;
4. duplicate, fallback, or obsolete behavior: delete it.

There is no midpoint sampling, one-syllable-per-word fabrication, generic citation restamping, stepwise approximation presented as parity, implicit duration default, or `sourceTrack` comparison path.

The final lowering produces frames plus a per-frame provenance projection pointing to the graph decisions that produced each value. The provenance stays owned by the Utterance; lowering does not invent replacement decisions for values it projects.

## 10. Standalone control-score disposition

Backend-neutral control intent survives as typed HRG features and control relations. The following standalone production surfaces do not:

1. `DeclarativeControlScore` as a parallel object;
2. `buildDeclarativeControlScore()` and `validateDeclarativeControlScore()`;
3. `controlScore` on detailed frontend output;
4. `public/rules/control-score.yaml` as a schema for a second IR;
5. tests whose sole contract is the standalone object.

Reusable field definitions and citations from those surfaces move into compiled relation schemas or lowering policy before deletion. Nothing converts HRG to a control-score array and then to frames.

## 11. Public API end state

The graph-native core APIs are conceptually:

```text
loadBundledRulepackSpec(frontendId) -> immutable compiled frontend spec
runRuleEngine(utterance, compiledSpec, options) -> graph execution result
runDeclarativeFrontend(utterance, compiledSpec, options) -> utterance or traced result
lowerToFrames(utterance, loweringPolicy) -> lowered backend track
```

The exact TypeScript signatures must preserve strong inference and avoid boolean-controlled ambiguous return types where a discriminated result is clearer. No overload or options bag may conceal selection of a different frontend's resources.

This explicitly replaces both current boundaries: `runRuleEngine(sequence: TokenLike[], specSource: unknown, options)` becomes graph-plus-compiled-spec execution, and the overloaded `runDeclarativeFrontend(sequence, options)` entrypoint stops hiding raw spec selection and inventory fallback inside its options bag. Every caller is migrated in the Phase 5 flag day.

`textToKlattTrackDetailed()` can remain as the application convenience API, but internally it constructs one Utterance, enriches it, and lowers it once. Its detailed output exposes the Utterance/provenance and final frames; it does not expose duplicate phone/control-score representations as independent authorities.

## 12. File and surface dispositions

| Surface | Final disposition | Owner after convergence |
|---|---|---|
| `src/declarative-frontend/hrg/bridge.ts` | delete | direct graph construction in frontend orchestration |
| `test/hrg-bridge.test.ts` | delete and replace with graph-native end-to-end proof | graph-native integration tests |
| `scripts/render-hrg.ts` and bridge-only demo artifacts | delete or rewrite to call the default path; no bridge | normal render path |
| `src/declarative-frontend/hrg/item.ts` | rewrite/enforce typed schema | Utterance/Item |
| `src/declarative-frontend/hrg/relation.ts` | rewrite structural mutations as stamped operations | Utterance/Relation |
| `src/declarative-frontend/hrg/utterance.ts` | extend as graph, axis, transaction, history owner | Utterance |
| `src/declarative-frontend/hrg/lowering.ts` | rewrite into complete sole lowering | final lowering |
| `src/declarative-frontend/axis.ts` | move/consolidate temporal ownership into HRG, then delete if empty | Utterance temporal axis |
| `src/declarative-frontend/engine.ts` | graph-native rewrite; delete flat `TokenLike[]` runtime | rule engine over Utterance |
| `src/declarative-frontend/parser.ts` | typed normalization/compiler boundary | compiled frontend spec |
| `src/declarative-frontend/validation.ts` | validate normalized typed spec; delete runtime-shape duplication | compiler validation |
| `src/declarative-frontend/rule-pack.ts` | immutable include/resource loader and cache | compiled frontend spec |
| `SPEC_VALIDATED` and duplicate root-key sets | delete | typed compiler boundary |
| `src/declarative-frontend/index.ts` qlatt default resolver | delete | selected frontend resources |
| `src/declarative-frontend/dectalk-helpers.ts` | delete after remaining generic trajectory math is moved or renamed | DECtalk YAML/inventory plus generic temporal math owner |
| `dectalk_obstruent_profile` CEL function | delete | DECtalk rule data and ordinary lookup |
| `src/tts-frontend-provenance.ts` trace conversion | delete; retain only non-rule orchestration provenance still needed | stamped graph writes |
| `src/control-score.ts` | delete after field/schema migration | HRG control relations |
| `DeclarativeControlScore` types/output | delete | Utterance |
| `public/rules/control-score.yaml` | migrate useful schema/citations, then delete | relation schemas/lowering policy |
| `test/control-score-schema.test.ts` | delete after retained schema requirements move to compiled relation validation tests | compiled relation schema tests |
| `test/control-score-builder.test.ts` | delete after unique construction assertions move to graph construction tests | Utterance construction tests |
| `src/track-assembler.ts` | delete after breakage review and capability placement | HRG final lowering or backend semantics |
| `FrontendPhoneSummary` as duplicate authority | delete or reduce to a derived tooling view with no production ownership | Utterance queries |
| `src/declarative-frontend/tooling.ts` rerun snapshots | rewrite from one transaction journal | graph history/tooling |
| `test/debug-duration-tmp.test.ts` | delete; preserve any unique real assertion in its owning test before deletion | duration/tooling tests |

No whole file is retained merely because callers exist. Deleting a file initiates the required capability/ownership review for each breakage.

## 13. Execution protocol

Implementation follows the repository's Git accountability and exact-convergence rules.

1. Work on a dedicated branch created from the then-current requested base.
2. Before every source slice, record branch and tracked-file state.
3. Never touch or stage unrelated dirty files.
4. One source slice is active at a time.
5. A slice ends in a committed kept reduction or a full Git restore/reverse patch before another begins.
6. Required baseline, parity, search, and gate results are recorded in `plans/declarative-frontend-hrg-convergence-log.md` and committed.
7. After every substantial targeted or full-suite pass, reread this plan and continue to the next unchecked item.
8. No phase milestone is a stopping point while later plan items remain.
9. If two consecutive experimental slices on the same target produce no kept improvement, stop and report rather than widening scope.
10. Never use a green narrow test as a substitute for the named phase and final gates.

## 14. Phased work plan

### Phase 0: Baseline and ledger

Objective: create the reproducible starting record before changing production code.

Actions:

1. Record commit, branch, `git status --short`, Node/npm versions, and relevant generated-artifact state.
2. Run and record the current targeted declarative frontend/HRG/tooling tests.
3. Run and record `npm run typecheck:core`, `npm run typecheck:scripts`, the full Vitest suite, `npm run build`, golden tests, and strict explain runs for each bundled frontend that the CLI supports.
4. Separate pre-existing failures from migration-owned failures with exact command output.
5. Before deleting the reconstruction bridge, run it once over a fixed, cited phrase set and commit immutable test-oracle fixtures containing input text/frontend id, the reconstructed graph serialization, and the old production source frames. These fixtures are historical comparison data only; no fixture generator or bridge code survives Phase 1.
6. Capture the old production frames/control decisions for the qlatt-English and DECtalk corpus subsets used by Phase 4/5 parity. This baseline, not a retained conversion path, is the lowering oracle.
7. Create the fixed-point execution log with target architecture, forbidden surfaces, search gates, runtime gates, baseline results, and next slice.

Artifact: committed baseline/log record only. No production edit belongs in this phase.

Exit gate: the exact starting behavior and failures are reproducible from the log.

### Phase 1: Delete invalid demonstrations and test debris

Objective: remove artifacts that falsely claim graph-native execution or passing tooling proof.

Slice 1A:

1. Verify whether the real duration assertion in `test/debug-duration-tmp.test.ts` already exists in an owning duration/rule test.
2. If covered, delete the file. If unique, move only the meaningful assertion into the owning test and then delete the file.
3. Prove no unconditional-pass debug test remains.
4. Commit.

Slice 1B:

1. Delete `src/declarative-frontend/hrg/bridge.ts` first.
2. Review each breakage from `test/hrg-bridge.test.ts`, `scripts/render-hrg.ts`, and demo references.
3. Delete bridge-only tests and scripts; preserve reusable end-to-end expectations as graph-native acceptance tests scheduled in Phases 4-5 and use the committed Phase 0 oracle fixtures for historical comparison.
4. Update status prose that calls the additive bridge “HRG drives synthesis end-to-end” to say it was a historical feasibility demonstration and has been removed for convergence.
5. Commit.

Exit gates:

- no production completed-track-to-HRG path;
- no bridge import;
- no fake/unconditional debug test;
- `hrg.test.ts` still proves the retained HRG core.

### Phase 2: Frontend-neutral compiled program boundary

Objective: make frontend selection, rulepack construction, and CEL vocabulary single-owner and immutable before the IR cutover.

Slice 2A — resource ownership:

1. Delete `defaultInventoryResolver()` from `src/declarative-frontend/index.ts`.
2. Resolve inventory and resources from the selected compiled frontend spec in the existing resource owner.
3. Add direct tests proving `qlatt-english`, `dectalk-english`, and `qlatt-beauty` use their own declared inventories.
4. Commit.

Slice 2B — compiled rulepack:

1. Define the typed normalized/compiled spec at the parser/compiler boundary.
2. Make include resolution produce fresh values rather than mutate cached roots.
3. Validate once and freeze before cache insertion.
4. Change engine/tooling call sites to accept only the compiled type.
5. Delete `SPEC_VALIDATED`, the runtime parse-or-trust branch, duplicate root-key knowledge, and defensive schema checks made impossible by the compiled type.
6. Commit.

Slice 2C — final relation DSL vocabulary:

1. Change the compiler to accept only `relations:` declarations and relation-aware selectors/patterns.
2. Migrate all bundled frontend YAML together: `streams` to `relations`, `select.stream` to `select.relation`, patterns and topology to relation declarations, and token `stream` fields/predicates to relation naming.
3. Mechanically update the existing flat engine to consume the final compiled relation field names without adding a second representation or compatibility reader.
4. Update schema tests, CLI fixtures, includes, docs, and error codes.
5. Prove the compiler rejects an old-shape fixture and commit atomically.

Slice 2D — CEL neutrality:

1. Rewrite DECtalk structural rules so profile selection is ordinary cited rule/data logic.
2. Delete `dectalk_obstruent_profile` from YAML, validator allowlists, environment registration, engine context, and helper code.
3. Consolidate CEL names/signatures/arity into one typed catalog owner.
4. Classify the remaining `dectalk-helpers.ts` symbols. Before deleting it, prove `trajectory_to_windows` is frontend-neutral, move and rename that operation in its correct generic temporal/lowering owner, and migrate DECtalk structural rules to the new generic name in the same slice. If it is not frontend-neutral, express it as DECtalk rule/data policy instead. Then delete the file.
5. Commit.

Slice 2E — duplicate invalidation:

1. Prove the phase loop is sufficient owner of structural invalidation in the current engine.
2. Delete the duplicate per-firing invalidations, or delete the phase invalidation if evidence establishes transaction-level ownership instead.
3. Add an exact invalidation-count or behavior test so duplication cannot return.
4. Commit.

Exit gates:

- no generic code names `qlatt-english` except the explicit bundled frontend registry/default selection constant;
- no `SPEC_VALIDATED`;
- cached rulepacks cannot be mutated by callers;
- no DECtalk-named CEL function or generic-engine import;
- no old stream DSL keywords or compatibility normalization;
- one invalidation owner.

### Phase 3: Complete the HRG owner

Objective: make the existing HRG capable of safely owning production execution.

Slices, in order:

1. Typed Item/relation schema enforcement and immutable structured feature values.
2. Stamped relation membership/topology writes with history and why queries.
3. Utterance-owned temporal axis, anchors, and resolved time marks; move/delete the old axis owner as appropriate.
4. Atomic transaction construction, validation, commit, rejection diagnostics, read-set capture, and journal.
5. Phase checkpoints and deterministic transaction replay.
6. Implement Direction Track-to-HRG attachment in the existing input owner against static Utterance fixtures. It must attach typed records to `Affect`, `Intonation`, `Break`, or other declared relations and preserve the input `DecisionRecord` as a parent. This is completed and committed before production wiring.
7. Build the complete replacement graph-native rule engine under the HRG owner against the final compiled relation DSL. It must implement match production and the single transaction-rewrite executor with direct tests over static Utterance fixtures. It is the intended replacement engine, not a helper, wrapper, adapter, or second production path. It remains unexported from the production entrypoint until Phase 5.

Each slice ends in a commit and focused tests. These are extensions of the chosen owner, not an alternate production engine.

Exit gates:

- an untyped/undeclared feature write fails before mutation;
- a relation mutation is provenance-queryable;
- failed multi-write rules leave no partial state;
- replay of a journal reconstructs the same graph digest;
- axis identity/order survives insertion and structural suppression;
- no `Record<string, any>` in the HRG runtime owner;
- Direction Track attachment is provenance-correct on static graph fixtures;
- the replacement engine passes select, pattern, association, splice, point, scalar, contour, finalization, transaction, and invalidation tests without calling the flat engine.

### Phase 4: Make final lowering complete

Objective: make `hrg/lowering.ts` capable of replacing track assembly before switching production.

Precondition: `qlatt-english`, `dectalk-english`, and `qlatt-beauty` each declare `output.lowering` in their selected frontend spec. Missing lowering policy is a compiled-spec error; the lowerer has no bundled-frontend fallback.

Work one lowering family at a time:

1. segment timing and required-duration validation;
2. scalar/current-value resolution from write histories;
3. transition/control-window realization;
4. explicit point and contour realization;
5. Tilt and PhraseCommand realization;
6. Affect and voice-quality deltas;
7. speaker/source policy projection;
8. backend-specific semantics handoff;
9. per-frame provenance projection;
10. diagnostics for clamp/default/rejected/missing data.

For every family, build direct graph fixtures and compare against the committed Phase 0 production-frame/oracle fixtures using the named existing corpus/golden harness. Keep only measured parity or an explicitly approved intentional correction. Commit each kept family before the next. The deleted bridge is never recreated or retained for fixture generation.

No production caller switches in this phase. The retained lowerer is the chosen final owner being completed ahead of the flag day, not a second production path.

Exit gates:

- representative qlatt-English and DECtalk graph fixtures lower with the required columns/timing and satisfy captured baseline parity;
- `qlatt-beauty` proves its own declared resource identity, graph-native execution, and required structural lowering columns/timing, but carries no corpus parity requirement while it remains a documented content scaffold;
- qlatt-English/DECtalk output differences from the captured path are zero or individually documented, cited, and approved;
- no implicit 100 ms/30 ms fallback;
- provenance for each frame parameter reaches its producing graph write.

### Phase 5: Production HRG flag day

Objective: replace the flat engine, provenance side-log, standalone control score, and track assembler in one coherent production cutover.

This is intentionally one atomic source slice because splitting it by retaining adapters or dual paths would violate the architecture.

Deletion-first worktree order:

1. Delete the flat `engine.ts` implementation, trace-derived rule provenance surfaces, standalone control-score implementation/types/schema, and `track-assembler.ts` production path.
2. Let compiler/test failures enumerate every caller and capability.
3. Make normalization/transcription/inventory create and enrich an Utterance directly, including real Word/Syllable/Segment/SylStructure identity.
4. Wire the already-implemented Direction Track attachment stage into production graph enrichment.
5. Wire the already-implemented and unit-tested graph-native engine to the production entrypoint.
6. Activate its existing select/pattern-to-transaction executor; no matching or rewrite algorithm is first implemented in this commit.
7. Make every rule write carry compiled rule citations/tags/reason and graph read-set parents.
8. Route the default frontend path through the sole final lowerer.
9. Replace duplicate phone/control-score detailed outputs with Utterance queries.
10. Update every production caller and test to the graph-native API or delete the caller if its capability should not survive.
11. Run the entire phase gate before committing.

Required phase gate:

- all declarative engine unit families;
- qlatt-English and DECtalk integration/corpus suites, plus qlatt-beauty resource-identity/graph-native/structural-lowering tests;
- HRG identity, relation, transaction, provenance, replay, and lowering suites;
- control-window, duration, formant, prosody, Direction Track, affect, speaker, and source tests;
- `npm run typecheck:core` and `npm run typecheck:scripts`;
- strict explain for representative phrases;
- full Vitest and build.

The commit is not allowed while any old production route remains searchable.

### Phase 6: Graph-native tooling and explanation

Objective: make tooling consume one real execution rather than rerun prefixes.

Actions:

1. Rewrite phase snapshots as views/checkpoints from the transaction journal.
2. Rewrite field explanation from versioned feature/relation writes.
3. Implement structured `why not` evidence showing failed select predicates, pattern steps, constraints, missing targets, or rejected transaction validation.
4. Implement deterministic replay and graph digest comparison.
5. Update `scripts/tts-dsl.ts` and explain CLI integration.
6. Delete JSON-clone prefix reruns and absence-only answers.
7. Commit.

Exit gates:

- one engine execution supplies all phase views;
- replay digest equals original digest;
- `why` reaches cited write parents;
- `why not` names the exact failed condition;
- tooling does not synthesize a second authority from snapshots.

### Phase 7: Fixed-point deletion and documentation convergence

Objective: exhaustively prove that no substitute or old surface survived.

Actions:

1. Run every forbidden-surface search gate.
2. Classify every remaining hit as delete/move/consolidate/rewrite/keep; production hits force another iteration.
3. Remove obsolete tests, exports, comments, demo artifacts, status claims, and plan language.
4. Amend the coordinator plan, control-score roadmap status, architecture docs, adding-a-synthesizer guide, parameter-scheduling docs, and explain docs to describe the graph-native path.
5. Run final static, unit, integration, corpus, golden, explain, build, and browser/runtime gates.
6. Record final commits and zero-hit evidence in the execution log.

Exit gate: every phase is complete or explicitly deferred by the user; no old/new production coexistence remains.

## 15. Forbidden-surface search gates

These searches must be zero-hit in production scope at completion. Tests may contain an explicitly named rejection fixture for old input syntax.

```text
src/declarative-frontend/hrg/bridge
buildUtteranceFromPhrase
sourceTrack
src/declarative-frontend/engine.ts
src/declarative-frontend/dectalk-helpers
src/declarative-frontend/axis
src/control-score
src/track-assembler
test/debug-duration-tmp
test/hrg-bridge
scripts/render-hrg
test/control-score-schema
test/control-score-builder
SPEC_VALIDATED
defaultInventoryResolver
/rules/frontends/qlatt-english/inventory.yaml in generic runtime code
type TokenLike = Record<string, any>
RuntimeLike = Record<string, any>
_currentFunctions
emitRuleTraceDecisions
buildRuleCitationsMap
RULE_CITATIONS
includeTrace used to enable provenance
DeclarativeControlScore
buildDeclarativeControlScore
validateDeclarativeControlScore
controlScore on frontend output
FrontendPhoneSummary as duplicate authority
public/rules/control-score.yaml
dectalk_obstruent_profile
selectDectalkObstruentProfile
streams: in bundled frontend specs
select.stream
token.stream or .stream used as runtime relation identity
JSON.stringify snapshot comparison in declarative tooling
phaseNames.slice(0, i + 1) replay
expect(true).toBe(true) or unconditional passing debug assertions
```

Additional structural gates:

1. one call site for structural cache/index invalidation per committed transaction;
2. one rule rewrite executor;
3. one production call to final lowering per frontend run;
4. no conversion chain `frames -> HRG`, `phone summaries -> HRG`, or `HRG -> control score -> frames`;
5. no direct relation topology mutation outside the Utterance-owned stamped API;
6. no uncited production rule;
7. no rule application without a tag;
8. no generic CEL identifier containing a bundled frontend name.

The execution log records the exact `rg` commands and their output. Search terms are not renamed away; the semantic surface is reviewed.

## 16. Runtime and verification gates

### 16.1 Targeted families

At minimum, the execution plan runs the current equivalents of:

```text
npm test -- test/hrg.test.ts
npm test -- test/declarative-frontend-model.test.ts
npm test -- test/declarative-frontend-navigation.test.ts
npm test -- test/declarative-frontend-pattern-rules.test.ts
npm test -- test/declarative-frontend-association-actions.test.ts
npm test -- test/declarative-frontend-association-navigation.test.ts
npm test -- test/declarative-frontend-splice-actions.test.ts
npm test -- test/declarative-frontend-point-actions.test.ts
npm test -- test/declarative-frontend-scalar-resolution.test.ts
npm test -- test/declarative-frontend-contour.test.ts
npm test -- test/declarative-frontend-sync-axis.test.ts
npm test -- test/declarative-frontend-finalize.test.ts
npm test -- test/declarative-frontend-finalize-dirty.test.ts
npm test -- test/declarative-frontend-rule-pack-includes.test.ts
npm test -- test/declarative-frontend-schema.test.ts
npm test -- test/declarative-frontend-integration-phases.test.ts
npm test -- test/declarative-frontend-integration-diagnostics.test.ts
npm test -- test/declarative-frontend-rulepack-context.test.ts
npm test -- test/declarative-frontend-rulepack-prosody.test.ts
npm test -- test/dectalk-e2e.test.ts
npm test -- test/tts-frontend-declarative-corpus.test.ts
npm test -- test/tts-frontend-declarative-prosody.test.ts
npm test -- test/declarative-frontend-rulepack-context.test.ts test/declarative-frontend-schema.test.ts test/declarative-frontend-slice.test.ts test/declarative-frontend-splice-actions.test.ts test/track-assembler.test.ts
npm test -- test/provenance-range.test.ts
npm test -- test/explain-phrase-cli.test.ts
```

Tests renamed or replaced during convergence are mapped in the execution log rather than silently dropped. No skipped tests are allowed.

`test/provenance-middleware.test.ts` is explicitly replaced by atomic feature/relation-write provenance and transaction-parentage tests; it is not required to remain green after its subject is deleted. `test/control-score-schema.test.ts` and `test/control-score-builder.test.ts` are explicitly replaced by compiled relation-schema and Utterance-construction tests. `test/track-assembler.test.ts` is mapped family-by-family to final-lowering tests before `track-assembler.ts` is deleted.

### 16.2 Static and full gates

```text
npm run typecheck:core
npm run typecheck:scripts
npm run typecheck:audio
npm run typecheck:golden
npm test
npm run build
npm run test:golden
npm run explain -- "hello world" --frontend qlatt-english --strict-citations
npm run explain -- "hello world" --frontend dectalk-english --strict-citations
npm run explain -- "she sees a calm blue moon" --frontend qlatt-beauty --strict-citations
```

The current explain CLI already accepts `--frontend`; a command that only exercises the default frontend does not prove multi-frontend convergence.

### 16.3 Behavioral proof

1. Qlatt-English and DECtalk graph-native output are compared against the recorded baseline corpus before intentional changes are accepted. Beauty is gated structurally while its content remains a documented scaffold.
2. Timing, phoneme identity, scalar values, F0 points/layers, and required backend columns are compared separately so aggregate audio similarity cannot hide structural drift.
3. Provenance queries prove exact field-level derivations, not only rule-level match events.
4. Relation identity tests prove the same Item appears in list and tree relations without copied feature bundles.
5. Replay tests prove one journal reproduces the graph digest without rerunning CEL against mutated external state.
6. Browser validation speaks a representative phrase through the actual default app path for each bundled frontend that is user-selectable.
7. Audio listening or measurement is additional evidence where relevant; it never replaces structural, static, provenance, or named test gates.

## 17. Commit sequence

Each bullet is one intended atomic commit unless implementation evidence requires a smaller split. Commit messages name the governing deletion-first and single-IR principles.

1. `docs(frontend): record HRG convergence baseline`
2. `test(frontend): delete invalid duration debug test`
3. `refactor(hrg): delete completed-track reconstruction bridge`
4. `fix(frontend): resolve inventory from selected frontend`
5. `refactor(frontend): compile immutable rulepacks once`
6. `refactor(frontend)!: rename stream DSL to relation DSL`
7. `refactor(dectalk): move profile selection out of generic CEL`
8. `refactor(frontend): make structural invalidation single-owner`
9. `feat(hrg): enforce typed item and relation schemas`
10. `feat(hrg): stamp relation topology mutations`
11. `refactor(hrg): move temporal axis into Utterance`
12. `feat(hrg): add atomic rule transactions and replay journal`
13. One commit per final-lowering family from Phase 4.
14. One or more committed, test-only target-owner slices for Direction Track attachment and the replacement graph rule engine.
15. `refactor(frontend)!: replace flat execution with the HRG`
16. `refactor(frontend): derive tooling from graph history`
17. `docs(frontend): converge architecture and authoring documentation`
18. `chore(frontend): record final fixed-point proof`

The breaking flag-day commits may be larger than ordinary commits because preserving a smaller compatibility path is explicitly forbidden. Their scope is bounded to the named frontend IR surface and must not absorb unrelated acoustic tuning or backend fidelity work.

## 18. Risk controls

### Risk: graph typing becomes a parallel wrapper

Control: enforce schemas in the existing Item/Utterance owner and delete the free write surface. Do not wrap untyped Items in typed facades.

### Risk: “control score” survives under another spelling

Control: search for duplicate arrays/DTOs/views that carry the same Segment/control fields. Derived read-only tooling output is allowed only if it cannot feed production execution and names the Utterance as authority.

### Risk: the flag day becomes unreviewable

Control: land typed graph, temporal, transaction, lowering, resource, and compiler owners as independently tested preparations. The flag day then contains deletion, caller conversion, and ownership wiring rather than new algorithms.

### Risk: parity preserves wrong fallback behavior

Control: classify every fallback as cited policy, diagnostic engineering estimate, invalid input, or obsolete behavior. Do not preserve it merely because the old output contains it.

### Risk: provenance volume or runtime cost grows

Control: provenance write creation remains mandatory. Optimize storage/indexing only after measuring with the existing harness; never omit writes or restore trace-derived summaries as the authority.

### Risk: DECtalk fidelity is damaged by generic cleanup

Control: migrate one DECtalk helper at a time against its named DECtalk tests/oracle corpus. Reject and revert a slice that does not keep measured fidelity.

### Risk: unrelated dirty work enters commits

Control: stage exact paths, inspect `git diff --cached`, and record commit contents. Never use `git add -A`, `git commit -a`, stash, reset, clean, or checkout to manage unrelated work.

### Risk: implementation stops after the impressive flag day

Control: this plan remains active through DSL cleanup, tooling, documentation, zero-hit searches, full gates, and final ledger. Passing production audio is not plan completion.

## 19. Acceptance matrix

| Finding | Required proof of resolution |
|---|---|
| Backwards bridge | bridge file/imports/tests absent; default pipeline creates Utterance before rules and lowers once |
| Trace-derived provenance | field/relation writes create decisions atomically; trace conversion symbols absent |
| Mutable untyped rulepack | immutable compiled type accepted by engine; marker/raw runtime branch absent; mutation test fails safely |
| Hardcoded resolver | three frontend resource-identity tests; generic entrypoint contains no qlatt inventory path |
| Duplicate executors/invalidation | one match-to-transaction executor; one invalidation per commit; select/pattern parity tests |
| DECtalk CEL leakage | no frontend-named generic builtin; DECtalk target tests/oracle unchanged or improved |
| Replay tooling/fake test | fake test absent; one-run checkpoints, exact why-not evidence, replay digest parity |
| Control-score contradiction | standalone object/builder/schema/output absent; control intent queryable in HRG relations |
| Full architecture | all bundled frontends graph-native; qlatt-English/DECtalk parity and beauty structural gates pass; one lowerer; old DSL/path zero-hit; full gates pass |

## 20. Definition of complete

This plan is complete only when:

1. every phase is completed or explicitly deferred by the user;
2. all bundled frontend production runs use the HRG before any final frames exist;
3. every graph feature and relation mutation is typed, versioned, cited, tagged, and provenance-stamped;
4. the standalone control-score and flat-token engine paths are deleted;
5. final lowering is the sole HRG-to-frame boundary;
6. the generic rule/CEL engine contains no bundled-frontend policy;
7. explanation and replay consume graph history from one execution;
8. every forbidden-surface search is zero-hit or an explicitly recorded rejection fixture;
9. targeted, static, full, golden, strict-citation, build, and browser gates pass or the user explicitly accepts a named pre-existing failure;
10. the execution log records baseline, every kept/reverted slice, commits, final searches, gates, and no remaining slice.

“Substantial progress,” “HRG audio works,” “the tests pass,” or “the flag day landed” are not substitutes for this definition.

## 21. Historical first implementation action

Execution began with the baseline/log artifact and Phase 1A as required. This
section is retained to record the ordering constraint that governed the now-
completed work.

## Cross-References

- `AGENTS.md`
- `design/beauty-synthesis/10-sota-control-surface.md`
- `design/beauty-synthesis/11-sota-frontend-architecture.md`
- `design/beauty-synthesis/12-fe-architecture-recommendation.md`
- `design/beauty-synthesis/13-direction-track-format.md`
- `design/beauty-synthesis/build/BUILD.md`
- `plans/declarative-architecture-completion-plan.md`
- `plans/declarative-control-score-roadmap/README.md`
- `plans/decision-provenance-rfc.md`
- `plans/control-windows-flag-day-plan.md`
- `docs/parameter-scheduling.md`
- `docs/adding-a-synthesizer.md`

## Open Questions

None. The plan intentionally resolves the IR authority, control-score disposition, rulepack boundary, transaction/provenance model, frontend resource ownership, CEL ownership, DSL end state, lowering owner, migration order, and completion gates before implementation.
