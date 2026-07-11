# Declarative Frontend HRG Convergence Execution Log

This is the Git-accountability ledger for
`plans/declarative-frontend-hrg-convergence-plan.md`. It records the baseline,
each kept or reverted slice, the current next action, and the final fixed-point
proof. The plan remains the control surface until every phase is complete or
the user explicitly defers an item.

## Target architecture

- The provenance-stamped HRG `Utterance` is the sole mutable frontend working IR.
- Frontend selection resolves resources once and compiles one immutable program.
- Rules match relations and commit typed, cited, tagged, atomic graph mutations.
- Direction records attach to the graph; no standalone control-score authority remains.
- One final lowering projects the completed HRG to Klatt frames exactly once.
- Explain, why-not, checkpoints, and replay consume graph history from that same run.

## Fixed-point deletion targets

The exact production/search surfaces in plan section 15 remain deletion targets.
They include the backwards HRG bridge, flat-token engine and axis, standalone
control score and track assembler, trace-derived provenance, mutable raw rulepack,
qlatt-specific resource fallback, duplicate executors/invalidation, DECtalk-named
generic CEL, replay-by-rerun tooling, old `streams` DSL, and fake debug coverage.
Renaming a semantic surface does not satisfy deletion.

The final run must execute every exact search in plan section 15 and record its
zero-hit output here. The additional structural gates are: one invalidation per
transaction, one rewrite executor, one production lowering call, no conversion
chain around the HRG, topology mutation only through stamped Utterance APIs, no
uncited rule or untagged application, and no frontend-named generic CEL symbol.

## Runtime authorities

The complete targeted family list is plan section 16.1. Static and full gates are:

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

Final behavioral proof also requires qlatt-English and DECtalk baseline parity,
beauty structural proof, field-level provenance, shared relation identity, replay
digest parity, and actual browser speech through each user-selectable frontend.

## Iteration 001 — Phase 0 baseline and immutable oracles

Status: kept. No production code was edited.

Hypothesis: freezing current graph reconstruction, control intent, and production
frames before deleting the bridge gives later lowerer and flag-day work an
independent historical oracle without retaining a backwards conversion path.

Starting state:

```text
base commit before branch: e4ac7647609c48bbf4979b00af330179f151d7bc
governing-plan commit: c42bc439baaeb582249494fd1c0971f572d6d086
branch: declarative-frontend-hrg-convergence
Node: v22.18.0
npm: 10.9.3
```

Pre-existing unrelated tracked changes, never staged by this work:

```text
M crates/oversampled-glottal-source/src/lib.rs
M public/worklets/oversampled-glottal-source.wasm
M test/klsyn88.test.ts
```

The checkout also contained many unrelated untracked notes, reports, scripts,
render artifacts, and oracle outputs. They remain outside this work. Before the
baseline build, the only relevant generated artifact reported dirty was
`public/worklets/oversampled-glottal-source.wasm`; `npm run build` did not add a
new tracked generated-artifact diff.

### Baseline results

Targeted HRG/debug command:

```text
npm test -- test/hrg.test.ts test/hrg-bridge.test.ts test/debug-duration-tmp.test.ts
PASS: 3 files, 19 tests
```

The debug file's green result is invalid evidence: its first test catches and
prints three failures (`whyNotRule`, `explainField`, and `buildPhaseSnapshots`)
before asserting `true`; its second test uses untyped casts. This is the exact
Phase 1A deletion target, not a migration-owned failure.

Static checks:

```text
npm run typecheck:core     PASS
npm run typecheck:scripts  PASS
npm run typecheck:audio    PASS
npm run typecheck:golden   PRE-EXISTING FAIL
```

`typecheck:golden` fails before migration with TS5097 `.ts`-extension errors in
the rendering scripts, missing `f0LayerCommands` on
`TextToKlattTrackDetailedResult`, an experiment-config `unknown` assignment,
and missing `toposort` declarations. Core and script authorities required by
Phase 0 pass. These failures are not attributed to HRG convergence.

Full Vitest baseline:

```text
npm test
FAIL: 4 files; 126 passed
FAIL: 9 tests; 1165 passed
PASS: audit-dictionary processed 5400 tracks with 0 processing errors
```

The nine pre-existing failures are:

1. `test/track-assembler.test.ts`: F3 locus-ramp expectation (2154.545... vs 2700).
2. `test/tts-frontend-rhotic-vowels.test.ts`: `authorshipGap` 260.75 below 300.
3. `test/tts-frontend-declarative-golden-summary.test.ts`: 85 events vs locked 81.
4. Six cases in `test/tts-frontend-snapshot.test.ts`: current frames differ from stale snapshots, including bandwidths/formants, removed `GO`, and added transition frames.

Build and runtime baselines:

```text
npm run build        PASS (92 modules; production bundle emitted)
npm run test:golden  PASS (resonator, antiresonator, and reconstruction comparisons)
strict explain qlatt-english   PASS (225 decisions, 0 uncited)
strict explain qlatt-beauty    PASS (500 decisions, 0 uncited)
strict explain dectalk-english PASS (262 decisions, 0 uncited)
```

### Immutable historical oracles

The one-time capture script was typechecked, run, and deleted before commit. No
fixture generator or bridge extension is retained. Each fixture contains the
input/frontend/citations, complete reconstructed item/relation topology,
versioned feature writes, provenance decisions, old bridge lowering, old
declarative control score, resolved speaker data, and old production frames.

```text
test/fixtures/hrg-convergence-baseline/qlatt-english-fricatives.json
  "She sells seashells by the seashore."
  citations: Jongman et al. 2000; Klatt 1980

test/fixtures/hrg-convergence-baseline/qlatt-beauty-bridge-demo.json
  "She sees a calm blue moon."
  citations: Taylor, Black & Caley 2001; Klatt 1980

test/fixtures/hrg-convergence-baseline/dectalk-english-stops.json
  "Pat tapped a pot and picked a paper cup."
  citations: DECtalk 4.63 p_us_st1.c; Klatt 1980
```

These JSON files are comparison data only. Production code and future tests may
read them, but no code may regenerate them through the deleted bridge.

Decision: keep and commit the baseline ledger and three historical fixtures.

Next slice: Phase 1A. Prove the meaningful rate-scaling assertion already has
an owning test (or move only that assertion), delete
`test/debug-duration-tmp.test.ts`, prove no unconditional-pass debug assertion
remains, run its owning targeted tests, reread the plan, and commit.

## Slice ledger

| Iteration | Phase/slice | Result | Commit | Evidence |
|---:|---|---|---|---|
| 001 | Phase 0 baseline/oracles | kept | `bf303b2f` | results and fixture paths above |
| 002 | Phase 1A invalid debug coverage | kept | `80392caf` | 148 owning tests pass; unconditional-pass search zero-hit |
| 003 | Phase 1B backwards bridge deletion | kept | `01f4c48c` | bridge search zero-hit; HRG core 14/14; core/scripts typecheck pass |
| 004 | Phase 2A selected resource ownership | kept | `2c3e53fa` | three inventory identities pass; 87 adjacent tests; core/scripts typecheck pass |
| 005 | Phase 2B immutable compiled rulepacks | kept | `46903895` | 204 declarative tests; 57 integration tests; core/scripts typecheck pass |
| 006 | Phase 2C final relation DSL vocabulary | kept | `e1a16553` | 205 declarative tests; 124/125 downstream baseline; three strict explain runs; core/scripts typecheck pass |
| 007 | Phase 2D CEL neutrality | kept | `c76fcfe6` | 246 focused tests; DECtalk strict explain 192/0; core/scripts typecheck pass |
| 008 | Phase 2E structural invalidation owner | kept | `f5f30bc1` | exact two-firing count; 207 declarative tests; core/scripts typecheck pass |
| 009 | Phase 3 typed Item/relation schemas | kept | `9980a7ac` | 19 HRG tests; core/scripts typecheck pass; no HRG any |
| 010 | Phase 3 stamped relation topology | kept | `4360c5f5` | 22 HRG tests; immutable histories; core/scripts typecheck pass |
| 011 | Phase 3 Utterance temporal axis | kept | `70ababdd` | 232 declarative/HRG tests; old axis zero-hit; core/scripts typecheck pass |
| 012 | Phase 3 atomic HRG transactions | kept | `343b181e` | 28 HRG tests; rejection diagnostics; core/scripts typecheck pass |
| 013 | Phase 3 checkpoints and replay | kept | `725530cc` | digest-equal replay; 29 HRG tests; core/scripts typecheck pass |
| 014 | Phase 3 Direction Track attachment | kept | `6f41d95c` | 50 input/HRG tests; provenance parent proof; core/scripts typecheck pass |
| 015 | Phase 3 graph engine select/scalar core | kept | `c5dcf35e` | exact tracked read parents; 31 HRG tests; core/scripts typecheck pass |
| 016 | Phase 3 graph engine patterns/associations | kept | `7f5b0e03` | atomic pattern rewrites; versioned association replay; 36 HRG tests; core/scripts typecheck pass |
| 017 | Phase 3 graph engine replace-range splice | kept | `e9180fb2` | typed insertion and anchor partition replay; 38 HRG tests; core/scripts typecheck pass |
| 018 | Phase 3 graph engine explicit points | kept | `d3c5f467` | midpoint/ratio/sync point replay; 39 HRG tests; core/scripts typecheck pass |
| 019 | Phase 3 boundary-insertion proof | kept | `e6c7ded5` | relation/temporal adjacency proof; 40 HRG tests; core/scripts typecheck pass |
| 020 | Phase 3 graph engine phrase contours | kept | `bf4f956a` | selected-duration progress and break reset; 41 HRG tests; core/scripts typecheck pass |
| 021 | Phase 3 graph engine F0 layers | kept | `eb320851` | typed profile/gesture commands and replay; 42 HRG tests; core/scripts typecheck pass |
| 022 | Phase 3 graph engine finalization | kept | `246fd8ba` | journaled timing, dirty guard, replay; 45 HRG tests; core/scripts typecheck pass |
| 023 | Phase 3 CEL isolation/topology reads | kept | `fd8e6b0e` | nested evaluation isolation and exact navigation parents; 53 focused tests; core/scripts typecheck pass |
| 024 | Phase 3 graph predicate navigation | kept | `7ca960f2` | tracked inline/named scans; 54 focused tests; core/scripts typecheck pass |
| 025 | Phase 3 graph path/resource catalog and exit gate | kept | `7fb4fdbc` | shared-tree/resource catalog; guarded/prior points; 72 combined focused tests; core/scripts typecheck pass |
| 026 | Phase 4 lowering family 1: timing | invalid evidence; reconciled | `a40b6230` | used deleted bridge samples instead of production events; validation retained, parity claim withdrawn |
| 027 | Phase 4 lowering family 2: scalar histories | invalid evidence; reconciled | `6c920c3f` | used a graph-to-itself scalar comparison; policy columns/history retained, parity claim withdrawn |
| 028 | Phase 4 production-contract reconciliation | kept | `cd7efe64` | sparse boundary events match captured production schedules; bridge oracles deleted from Phase 4 tests; 20 tests; core/scripts typecheck pass |
| 029 | Phase 4 lowering family 2: production scalar cells | kept | `5d481234` | 1,443 base-scalar boundary cells exact against production events; latest-write provenance retained |
| 030 | Phase 4 family 3A: graph control windows | kept | `42e2f0a4` | DECtalk next-target production cells exact; all field ops/targets/span forms; window provenance |
| 031 | Phase 4 family 3B: midpoint transitions | kept | `0b4b2e01` | qlatt EH-to-L production event and 5 ordinary blend cells exact; policy-driven types/keys/factor/span |
| 032 | Phase 4 family 3C: sonorant F2 ramps | kept | `18a9b829` | cited 45 ms/75% policy; qlatt F2 ramp start/interior production cells exact; compiler range validation |
| 033 | Phase 4 family 3D: universal midpoint fallback | kept | `1df89f04` | DECtalk P-to-release 72.2 ms event and 6 cells exact; selected smooth-all policy only |
| 034 | Phase 4 family 3E: locus and forward transitions | kept | pending slice commit | 5 captured AE locus states + 2 universal T states exact; per-key spans/adjustments/glue policy |

## Iteration 002 — Phase 1A invalid debug coverage

Status: kept.

Evidence before edit showed that pre-boundary lengthening was already owned by
`test/duration-model.test.ts`, including direct BI=4 comparisons and full-pipeline
ordering. Qlatt-English speech-rate behavior was unique to the debug file; the
only other frontend-rate test selected DECtalk.

Kept reduction:

- moved qlatt-English inverse duration/rate behavior into the duration owner as
  an API-level slow/normal/fast comparison;
- deleted `test/debug-duration-tmp.test.ts` and its caught errors, logs, unsafe
  casts, and unconditional assertion;
- deleted two logging-only cases from `test/contraction-probe.test.ts` while
  preserving its two real typography assertions;
- replaced the G2P benchmark's unconditional summary assertion with the actual
  90 percent accuracy floor already met by its 18/20 baseline.

Verification:

```text
rg -n "expect\(true\)\.toBe\(true\)|Always pass|debug duration|debug-duration-tmp" test src scripts
ZERO HIT

npm test -- test/duration-model.test.ts test/contraction-probe.test.ts test/g2p-pipeline.test.ts test/dectalk-e2e.test.ts test/declarative-frontend-rulepack-context.test.ts
PASS: 5 files, 148 tests

npm run typecheck:core
PASS
```

Next slice: Phase 1B. Delete the completed-track reconstruction bridge first,
then delete its bridge-only test and renderer, update only status prose that
claims it is a live architecture, prove the retained HRG core, and commit.

## Iteration 003 — Phase 1B backwards bridge deletion

Status: kept.

The production bridge was deleted first. Its resulting references were exactly
the bridge-only test, bridge-only renderer, historical WAV demo, and stale
morning-report claims. The test's reusable expectations—shared relation identity,
non-empty final lowering, complete parameter columns, and field-level provenance—
remain scheduled as graph-native Phase 4/5 acceptance tests and are preserved in
the immutable Phase 0 fixtures; no conversion implementation was retained.

Kept reduction:

- deleted `src/declarative-frontend/hrg/bridge.ts`;
- deleted `test/hrg-bridge.test.ts`;
- deleted `scripts/render-hrg.ts`;
- deleted `design/beauty-synthesis/demo/hrg-moon.wav`;
- corrected `design/beauty-synthesis/MORNING-REPORT.md` to call the old route a
  historical reconstruction feasibility demo, not graph-native execution.

Verification:

```text
rg -n "buildUtteranceFromPhrase|hrg/bridge|scripts/render-hrg|test/hrg-bridge|HRG drives synthesis end-to-end|proven via render-hrg" src test scripts design -g "!test/fixtures/hrg-convergence-baseline/**"
ZERO HIT

npm test -- test/hrg.test.ts
PASS: 1 file, 14 tests

npm run typecheck:core
PASS

npm run typecheck:scripts
PASS
```

Next slice: Phase 2A resource ownership. Delete `defaultInventoryResolver`, make
the selected frontend's compiled resource declaration authoritative, add three
direct inventory-identity tests first, then commit the kept convergence.

## Iteration 004 — Phase 2A selected resource ownership

Status: kept.

The new direct test was red before implementation: qlatt-English materialized
its expected K release, qlatt-beauty incorrectly received qlatt-English F2=1990
instead of 2288, and DECtalk failed because its structural rule received the
qlatt target shape. This isolated the hardcoded resolver as the cause.

Kept convergence:

- deleted `_defaultResolver` and `defaultInventoryResolver()`;
- made the existing `loadFrontendResources()` perimeter accept and validate
  unknown input without type assertions;
- derive the rule engine's inventory resolver from the selected spec's declared
  `inventory_path`, while custom test specs without inventory declarations keep
  no implicit production inventory;
- added one table-driven direct identity test covering `qlatt-english`,
  `dectalk-english`, and `qlatt-beauty` through the real structural phase.

Verification:

```text
npm test -- test/declarative-frontend-resource-identity.test.ts test/inventory-materialization.test.ts test/declarative-frontend-ruleset-override.test.ts test/declarative-frontend-slice.test.ts test/duration-model.test.ts test/dectalk-e2e.test.ts
PASS: 6 files, 87 tests

npm run typecheck:core
PASS

npm run typecheck:scripts
PASS

rg -n "defaultInventoryResolver|/rules/frontends/qlatt-english/inventory.yaml" src/declarative-frontend/index.ts
ZERO HIT
```

Next slice: Phase 2B. Specify the compiled rulepack type at the parser boundary,
write immutability/cache tests first, make include resolution non-mutating,
freeze before caching, move engine/tooling to compiled-only input, and delete
the `SPEC_VALIDATED` trust marker and parse-or-trust branch.

## Iteration 005 — Phase 2B immutable compiled rulepacks

Status: kept.

The first test proved the bundled cache was mutable. After the initial freeze,
deleting duplicate root-key knowledge exposed a fabricated child
`skip_dictionary: false`; the parser was corrected to preserve absence rather
than manufacturing an optional declaration. Failure count then returned to the
starting state before caller migration continued.

Kept convergence:

- introduced inferred `NormalizedDslSpec` and `CompiledRulepack` boundary types;
- added `compileRuleEngineSpec()` as the sole raw authoring-spec compiler for
  engine-only fixtures;
- changed include composition to clone and return fresh roots/children instead
  of mutating parsed inputs;
- deeply froze validated programs before cache insertion and proved cache
  poisoning fails;
- made the rule engine accept only `CompiledRulepack` and deleted
  `SPEC_VALIDATED`, its symbol mutation, and the runtime parse-or-trust branch;
- removed the duplicate root-key set from the loader and made the parser's root
  catalog authoritative;
- removed compiled-shape defensive branches from engine initialization;
- moved production orchestration, tooling, CLI, profiles, and all direct engine
  tests to the compiler boundary;
- used and then deleted a temporary TypeScript AST migration script for the 99
  direct test calls.

Verification:

```text
npm run typecheck:core
PASS

npm run typecheck:scripts
PASS

$tests = (Get-ChildItem -File test\declarative-frontend-*.test.ts).FullName; npm test -- $tests
PASS: 36 files, 204 tests

npm test -- test/explain-phrase-cli.test.ts test/provenance-range.test.ts test/tts-frontend-declarative-corpus.test.ts test/dectalk-e2e.test.ts test/declarative-frontend-rule-pack-includes.test.ts test/declarative-frontend-resource-identity.test.ts
PASS: 6 files, 57 tests

rg -n "SPEC_VALIDATED|ROOT_DSL_KEYS|alreadyValidated|parseDslSpec\(QLATT_ENGLISH_RULEPACK\)" src test scripts
ZERO HIT
```

Next slice: Phase 2C. Replace the authoring vocabulary atomically with
`relations`/`relation`, migrate all bundled YAML and fixtures, make the compiler
reject the old `streams`/`stream` shape, and keep only the final vocabulary in
the existing executor before committing.

## Iteration 006 — Phase 2C final relation DSL vocabulary

Status: kept.

The compiler-rejection test was red first: a raw authoring spec with a
`streams:` root still compiled. The implementation then cut over the parser,
validator, executor, bundled YAML, fixtures, scripts, and public DSL spec as one
atomic vocabulary migration. No alias or compatibility reader was added.

Kept convergence:

- made `relations:` the only declaration root and `relation` the only token,
  selector, pattern, point-insertion, and output-mapping field;
- added explicit `E_LEGACY_STREAMS` rejection before root normalization and a
  test proving compiled rulepacks expose no `streams` property;
- renamed relation-owned validation diagnostics and executor state rather than
  retaining stream-named internal concepts;
- migrated all three bundled frontends, direct engine fixtures, CLI fixtures,
  profiles, extraction/splitting tools, downstream token consumers, and
  `plans/frontend-spec.md`;
- used and deleted three temporary TypeScript migration scripts; and
- repaired generic Node read/write-stream and MIME vocabulary caught by the
  mechanical corruption scan.

Verification:

```text
npm run typecheck:core
PASS

npm run typecheck:scripts
PASS

$tests = (Get-ChildItem -File test\declarative-frontend-*.test.ts).FullName; npm test -- $tests
PASS: 36 files, 205 tests

npm test -- test/control-score-builder.test.ts test/duration-model.test.ts test/g2p-postlexical.test.ts test/nasal-subsystem.test.ts test/track-assembler-output-config.test.ts test/track-assembler.test.ts test/tts-frontend.test.ts test/tts-frontend-declarative.test.ts test/tts-frontend-declarative-corpus.test.ts test/dectalk-e2e.test.ts test/explain-phrase-cli.test.ts
BASELINE: 11 files, 124 passed, 1 known track-assembler F3 failure

npm run explain -- "hello world" --frontend qlatt-english --strict-citations
PASS: 225 decisions, 0 uncited

npm run explain -- "hello world" --frontend qlatt-beauty --strict-citations
PASS: 500 decisions, 0 uncited

npm run explain -- "hello world" --frontend dectalk-english --strict-citations
PASS: 262 decisions, 0 uncited

npm test -- test/tts-frontend-declarative-corpus.test.ts
PASS: 1 file, 1 test

rg -n "^\\s*streams:|^\\s*stream:|select\\.stream|token\\.stream|\\.stream\\b" public/rules src test scripts plans/frontend-spec.md -g "*.yaml" -g "*.ts" -g "*.md"
ONLY: explicit E_LEGACY_STREAMS compiler rejection and its test fixture
```

The first full-suite attempt was terminated after the normally silent
dictionary audit exceeded five minutes under parallel load. Before termination
it showed the known baseline failures plus one corpus-test failure; the exact
corpus test passed immediately in isolation, so that extra result was not a
persistent migration regression and is not represented as a passing full gate.

Next slice: Phase 2D. Replace DECtalk profile selection with cited rule/data
logic, delete DECtalk-named CEL machinery, consolidate the CEL catalog, classify
and relocate or declaratively express `trajectory_to_windows`, delete
`dectalk-helpers.ts`, and commit.

## Iteration 007 — Phase 2D CEL neutrality

Status: kept.

Two direct contracts were red before implementation: the CEL catalog did not
exist as one typed value, and the generic trajectory-to-window behavior was not
owned by `control-score.ts`. The first DECtalk end-to-end run then exposed an
unguarded optional feature read in the declarative replacement; adding the
ordinary CEL `has()` guard restored the complete suite.

Kept convergence:

- replaced all five `dectalk_obstruent_profile` calls with cited DECtalk rule
  definitions that classify the adjacent token and index the inventory-owned
  `stopReleaseProfiles` map directly;
- deleted the DECtalk-named CEL implementation, environment registration, and
  allowlist entry;
- consolidated every accepted CEL name, exact supported arity, and builtin vs
  context binding in the typed `CEL_FUNCTION_CATALOG`, which now drives both
  syntax validation and environment overload registration;
- removed the unused custom allowlist option so a second function-name owner
  cannot be supplied;
- proved the trajectory conversion is frontend-neutral timed-control lowering,
  moved it to `control-score.ts`, and renamed the CEL operation to
  `trajectory_control_windows`;
- replaced the DECtalk helper test with an owner-native trajectory lowering
  test; and
- deleted `src/declarative-frontend/dectalk-helpers.ts` and its old test.

Verification:

```text
npm run typecheck:core
PASS

npm run typecheck:scripts
PASS

$tests = (Get-ChildItem -File test\declarative-frontend-*.test.ts).FullName; npm test -- $tests test/trajectory-control-windows.test.ts test/dectalk-e2e.test.ts
PASS: 38 files, 246 tests

npm run explain -- "hello world" --frontend dectalk-english --strict-citations
PASS: 192 decisions, 0 uncited

rg -n "dectalk_obstruent_profile|trajectory_to_windows|dectalk-helpers" src test public/rules/frontends scripts plans/frontend-spec.md -g "*.ts" -g "*.yaml" -g "*.md"
ONLY: the two negative CEL catalog assertions for the deleted DECtalk function
```

Next slice: Phase 2E. Establish the transaction-level invalidation owner with
an exact count/behavior test, delete the duplicate invalidation site, prove one
owner remains, and commit.

## Iteration 008 — Phase 2E structural invalidation owner

Status: kept.

Source inspection established that select and pattern rules snapshot their
matches before applying them, but later firings still evaluate defines,
constraints, and navigation after earlier firings may have changed the
sequence. The per-firing invalidation is therefore the transaction owner; the
phase loop's additional post-rule invalidation was redundant.

The exact-count contract was red at zero because invalidation was not yet
observable in the existing rule trace. After tracing the existing operation,
the pre-deletion implementation would produce three events for two firings.
Deleting the phase-level call leaves exactly two.

Kept convergence:

- emits one `relation_cache_invalidated` trace record from the existing cache
  invalidation operation;
- proves a two-token structural rule produces exactly two invalidations; and
- deletes the phase-loop invalidation and updates its ownership comment, while
  retaining the select- and pattern-firing calls that share the single
  transaction-level policy.

Verification:

```text
npm run typecheck:core
PASS

npm run typecheck:scripts
PASS

$tests = (Get-ChildItem -File test\declarative-frontend-*.test.ts).FullName; npm test -- $tests
PASS: 36 files, 207 tests

rg -n "invalidateRelationCache\\(\\)|relation_cache_invalidated" src/declarative-frontend/engine.ts test/declarative-frontend-splice-actions.test.ts
ONLY: the trace emission, the exact-count assertion, and the select/pattern per-firing calls
```

Next phase: Phase 3. Complete the HRG owner in the plan's stated slice order,
starting with typed Item/relation schema enforcement and immutable structured
feature values.

## Iteration 009 — Phase 3 typed Item/relation schemas

Status: kept.

Five direct schema contracts were red against the old free-form owner:
undeclared Item types and features were accepted, value types were unchecked,
structured values could not be stored safely, relation membership was
unconstrained, and caller-owned schema objects could poison an existing graph.

Kept convergence:

- introduced discriminated primitive, literal, array, object, and union feature
  schemas plus Item type, relation, and complete Utterance schema types;
- made `Utterance` require and privately compile a frozen schema copy;
- made `createItem()` reject undeclared Item types before pool mutation;
- made the existing `Item.set()` owner validate declared feature keys and
  recursively validate, clone, and freeze structured values before stamping;
- made the existing `Relation` owner enforce its declared allowed Item types
  before node or topology mutation;
- deleted caller-selected relation kinds from `Utterance.relation()` so the
  schema is the sole topology-kind authority; and
- migrated the static HRG fixtures to an explicit schema without adding a
  facade, wrapper Item, or parallel graph representation.

Verification:

```text
npm run typecheck:core
PASS

npm run typecheck:scripts
PASS

npm test -- test/hrg-schema.test.ts test/hrg.test.ts
PASS: 2 files, 19 tests

rg -n "Record<string, any>|\\bany\\b" src/declarative-frontend/hrg
ZERO CODE HIT
```

Next slice: stamp relation membership/topology writes through the Utterance
owner, retain append-only history, and add direct why queries before committing.

## Iteration 010 — Phase 3 stamped relation topology

Status: kept.

Three direct contracts were red: relation methods returned unstamped nodes,
tree topology carried no parentage, and rejected mutations had no queryable
empty-history authority.

Kept convergence:

- added immutable, versioned `RelationWrite` records for list append, tree root,
  and tree daughter operations;
- made every relation mutation require reason/citations input and stamp a
  `DecisionRecord` through the owning Utterance;
- automatically parent ordered-list/root writes to the prior sibling and tree
  daughter writes to both their parent membership and prior sibling membership;
- attached each node to the exact write that made it reachable;
- retained immutable append-only relation and feature history snapshots;
- added `whyRelationMembership()` as the direct provenance-DAG query; and
- proved validation failure occurs before relation history, graph topology, or
  provenance mutation.

Verification:

```text
npm run typecheck:core
PASS

npm run typecheck:scripts
PASS

npm test -- test/hrg-relation-history.test.ts test/hrg-schema.test.ts test/hrg.test.ts
PASS: 3 files, 22 tests
```

Next slice: move temporal axis identity, anchors, and resolved time marks behind
the Utterance owner, then delete or reduce the old axis owner as the evidence
requires before committing.

## Iteration 011 — Phase 3 Utterance temporal axis

Status: kept.

Three HRG contracts were red before implementation: no Utterance axis existed,
Items could not own interval/point anchors, and mark times had no versioned
provenance. Moving the flat rank implementation initially exposed two
compatibility errors: START/END lookups replaced order-object identity, and an
invalid finite rank failed too early. Exact failed tests drove restoration of
lookup purity and the old nullable/lexical comparison semantics.

Kept convergence:

- added the Utterance-owned `TemporalAxis` with stable START/END/finite mark
  identity, deterministic equal-range insertion, and identity-preserving
  rebalance;
- added stamped/versioned interval and ratio-point anchors directly to the
  Utterance owner;
- added stamped/versioned resolved mark times and anchor-time interpolation;
- proved later axis insertion and structural Item suppression do not destroy
  mark or anchor identity;
- made invalid/reversed anchors and unknown marks fail before provenance
  mutation;
- moved the temporary flat engine to consume the HRG axis implementation
  directly; and
- deleted `src/declarative-frontend/axis.ts`, with no compatibility module or
  loose-token axis factory retained.

Verification:

```text
npm run typecheck:core
PASS

npm run typecheck:scripts
PASS

$declarative = (Get-ChildItem -File test\declarative-frontend-*.test.ts).FullName
$hrg = (Get-ChildItem -File test\hrg*.test.ts).FullName
npm test -- $declarative $hrg
PASS: 40 files, 232 tests

rg -n -F "declarative-frontend/axis" src test scripts -g "*.ts"
rg -n -F "./axis" src test scripts -g "*.ts"
rg -n "buildSyncAxis" src test scripts -g "*.ts"
ZERO HIT
```

Next slice: atomic transaction construction, whole-transaction validation and
commit, rejection diagnostics, explicit read-set capture, and the deterministic
journal owner.

## Iteration 012 — Phase 3 atomic HRG transactions

Status: kept.

Three contracts were red before implementation: an invalid later feature write
could not be batched with an earlier write, invalid relation attachment had no
whole-batch boundary, and reads had no transaction-local path into write
parentage or a journal.

Kept convergence:

- added the durable `HrgTransaction` owner with required rule id, phase, tag,
  reason, citations, and optional stage/timestamp metadata;
- stages feature, list-append, tree-root, and tree-daughter operations without
  mutation;
- prevalidates every target, feature value, relation kind/membership, duplicate
  membership, and parent reachability before the first commit;
- records explicit feature reads in a transaction-local set and parents every
  committed feature/relation write to that read set;
- retains rule id and application tag on the exact versioned writes;
- emits `HRG_TRANSACTION_REJECTED` diagnostics and closes rejected
  transactions without graph, provenance, or journal mutation; and
- appends only committed, serializable, deeply immutable operation/read/decision
  records to the Utterance-owned journal.

Verification:

```text
npm run typecheck:core
PASS

npm run typecheck:scripts
PASS

$hrg = (Get-ChildItem -File test\hrg*.test.ts).FullName
npm test -- $hrg
PASS: 5 files, 28 tests

rg -n "Record<string, any>|\\bany\\b" src/declarative-frontend/hrg/transaction.ts
ZERO HIT
```

Next slice: phase checkpoints and deterministic transaction replay, including
an exact graph digest equality proof without reevaluating expressions.

## Iteration 013 — Phase 3 checkpoints and deterministic replay

Status: kept.

The replay contract was red because Item creation was still outside the
journal. The transaction owner was extended rather than introducing a snapshot
adapter: explicit-ID Item creation is now a first-class staged, stamped, and
journaled operation.

Kept convergence:

- journals and stamps Item creation in the same atomic batch as its initial
  feature and topology writes;
- adds immutable phase checkpoints containing the journal position and graph
  digest from the one live execution;
- adds a canonical digest over Item creation/feature histories, relation
  topology histories, temporal marks, anchors, and resolved-time histories;
- adds deterministic replay from serializable journal operations into a fresh
  schema-bound Utterance;
- restores recorded read-set parents directly during replay without evaluating
  expressions against current external state; and
- proves replayed transaction ids, DecisionRecord ids, journals, frozen
  structured values, and final/checkpoint digests match after the source object
  has been mutated.

Verification:

```text
npm run typecheck:core
PASS

npm run typecheck:scripts
PASS

$hrg = (Get-ChildItem -File test\hrg*.test.ts).FullName
npm test -- $hrg
PASS: 6 files, 29 tests

rg -n "Record<string, any>|\\bany\\b" src/declarative-frontend/hrg -g "*.ts"
ZERO CODE HIT
```

Next slice: implement Direction Track attachment in the existing input owner
against static Utterance fixtures, attach typed records to declared control
relations, and preserve input DecisionRecords as parents before production
wiring.

## Iteration 014 — Phase 3 Direction Track attachment

Status: kept.

The static attachment contract was red because the existing input parser only
advertised future HRG-compatible shapes. Its resolved Directions and upstream
DecisionRecords were already the correct owners; no parsing replacement was
needed.

Kept convergence:

- added the discriminated `DIRECTION_ITEM_SCHEMA` in the existing input owner,
  covering kind/tag, utterance or token-range scope, labels, the complete typed
  voice-quality delta, compiled affect summary, voice identity, and citations;
- added `attachDirectionsToUtterance()` beside `parseDirectionInput()`;
- requires the static Utterance to share the ParseResult provenance collector,
  preventing dangling parent ids;
- attaches each resolved record through one atomic HRG transaction to its
  declared `Affect`, `Intonation`, or `Break` relation;
- uses the originating input `DecisionRecord` as an explicit parent of Item
  creation, every feature version, and relation membership; and
- leaves the attachment function absent from production orchestration until the
  Phase 5 flag day.

Verification:

```text
npm run typecheck:core
PASS

npm run typecheck:scripts
PASS

$hrg = (Get-ChildItem -File test\hrg*.test.ts).FullName
npm test -- $hrg test/input.test.ts test/input-hrg-attachment.test.ts
PASS: 8 files, 50 tests

rg -n "attachDirectionsToUtterance" src test -g "*.ts"
ONLY: definition in src/input/parse.ts and static fixture test
```

Next slice: build the complete graph-native rule engine under the HRG owner
against the final compiled relation DSL, with direct static-Utterance tests and
no production export or flat-engine call.

## Iteration 015 — Phase 3 graph engine select/scalar core

Status: kept as the first target-owner sub-slice of the replacement engine.

The initial select/scalar contracts were red because no graph-native engine
module existed. The retained implementation is under `hrg/`, imports the
compiled rulepack and generic CEL evaluator only, and is intentionally absent
from the HRG public/production entrypoint.

Kept convergence:

- executes compiled select rules over active Items in the selected HRG
  relation without materializing token dictionaries;
- exposes transaction-local Item tracking views for direct, bracket, nested,
  optional/`has`, and short-circuited CEL property reads;
- resolves sequential define bindings, predicate/expr/all/any/not conditions,
  constraints, and dispatch values;
- supports set/add/mul/min/max/unset and nested structured feature effects;
- commits every matched firing through one `HrgTransaction`, with exact read
  decisions as parents of every effect; and
- proves an invalid later effect rejects the complete firing without an earlier
  scalar write or journal entry.

Verification:

```text
npm run typecheck:core
PASS

npm run typecheck:scripts
PASS

$hrg = (Get-ChildItem -File test\hrg*.test.ts).FullName
npm test -- $hrg
PASS: 7 files, 31 tests

rg -n "from .*engine|runRuleEngine" src/declarative-frontend/hrg/rule-engine.ts
ZERO HIT
```

Next graph-engine sub-slice: pattern matching and association/disassociation
semantics through the same transaction rewrite owner.

## Iteration 016 — Phase 3 graph engine patterns and associations

Status: kept as the second target-owner sub-slice of the replacement engine.

The graph-native tests were red because the replacement engine ignored pattern
rules and the HRG had no durable owner for named directed association edges.
The retained implementation extends the existing Utterance and transaction
owners; it does not recreate mutable token association fields or a second
rewrite pipeline.

Kept convergence:

- makes select and pattern matching produce one internal Match shape consumed
  by one transaction rewrite executor;
- binds named pattern captures to shared Item identities and supports targeted
  effects, pattern constraints, definitions, and the same tracked CEL context
  as select rules;
- records association and disassociation as append-only versioned graph writes
  with provenance, prior-version parents, journal operations, and digest state;
- implements transaction-local `assoc()` navigation over active association
  versions and active target Items, recording association and lifecycle reads;
- implements rule suppression as stamped `active = false` feature versions,
  preserving Item identity and relation topology;
- replays association histories deterministically to an identical graph digest;
  and
- proves a transaction containing an association and an invalid feature write
  rejects without either partial mutation.

Verification:

```text
npm run typecheck:core
PASS

npm run typecheck:scripts
PASS

npm test -- --run test/hrg
PASS: 8 files, 36 tests

rg -n "from .*engine|runRuleEngine" src/declarative-frontend/hrg/rule-engine.ts
ZERO HIT
```

The repository has no configured ESLint script or config. The attempted
`npm run lint` and `npx eslint` commands therefore could not provide a lint
gate; the configured core/scripts TypeScript authorities passed.

Next graph-engine sub-slice: structural splice/insertion, point/contour/F0
actions, and finalization through this same Match-to-transaction executor.

## Iteration 017 — Phase 3 graph engine replace-range splice

Status: kept as the third target-owner sub-slice of the replacement engine.

The direct structural fixture was red because Match execution had no structural
mutation path and list Relations only supported append. The retained slice
extends the existing Relation, Utterance, transaction, temporal-axis, journal,
replay, and single rewrite owners.

Kept convergence:

- adds stamped `insert_after` list topology writes without rebuilding or
  copying the relation;
- evaluates `replace_range` bounds through transaction-tracked synthetic
  `sync_left`/`sync_right` views backed by Utterance temporal anchors;
- suppresses every active Item covered by the evaluated range as versioned
  lifecycle writes;
- materializes typed replacement Items from both flat templates and the bundled
  nested `segment` template, including targeted copy fields;
- partitions replacement Items over the retained outer interval with stamped
  mark creation and interval-anchor writes;
- journals and deterministically replays insertion topology and anchor
  partition operations to an identical graph digest; and
- keeps all feature, topology, temporal, and suppression writes in the one
  matched rule transaction.

Verification:

```text
npm run typecheck:core
PASS

npm run typecheck:scripts
PASS

npm test -- --run test/hrg
PASS: 9 files, 38 tests
```

Next graph-engine sub-slice: boundary insertion and explicit point actions,
followed by contour/F0-layer and phase finalization behavior.

## Iteration 018 — Phase 3 graph engine explicit point actions

Status: kept as the fourth target-owner sub-slice of the replacement engine.

The direct point fixture was red because the graph engine ignored
`insert_point`/`insert_points`, the transaction could not stage point anchors,
and the CEL context did not bind the existing anchor helper vocabulary.

Kept convergence:

- binds `midpoint`, `at_ratio`, and `at_sync` per evaluation against stamped
  Utterance anchors, with anchor reads added to the transaction read set;
- exposes `current_index` without reintroducing flat token state;
- derives the point Item type from the declared target Relation and rejects an
  ambiguous relation schema;
- creates typed point Items and commits value/tag features, relation
  membership, and point anchors in the matched rule transaction;
- journals and replays point-anchor operations; and
- proves midpoint, fractional, and coincident-boundary points reproduce the
  same graph digest.

Verification:

```text
npm run typecheck:core
PASS

npm run typecheck:scripts
PASS

npm test -- --run test/hrg
PASS: 10 files, 39 tests
```

Next graph-engine sub-slice: boundary insertion, then contour/F0-layer and
phase finalization behavior.

## Iteration 019 — Phase 3 boundary-insertion proof

Status: kept as focused coverage of the second splice form.

The graph engine's structural transaction already contained the
`insert_at_boundary` branch from Iteration 017, but it had no direct static-HRG
contract. The focused fixture proves an inserted release is placed between the
selected left Item and its right neighbor in Relation order and receives the
adjacent right interval from the Utterance axis.

Verification:

```text
npm run typecheck:core
PASS

npm run typecheck:scripts
PASS

npm test -- --run test/hrg
PASS: 10 files, 40 tests
```

Next graph-engine sub-slice: contour/F0-layer actions and phase finalization.

## Iteration 020 — Phase 3 graph engine phrase contours

Status: kept as the fifth target-owner sub-slice of the replacement engine.

The direct contour fixture was red before the Match owner supplied phrase-local
timing context. The retained implementation computes that context from the
matched shared Items and their typed duration/break features.

Kept convergence:

- groups selected Items into phrases at the rule's declared break-index
  threshold;
- computes midpoint elapsed time, selected phrase duration, and normalized
  progress without counting unselected boundary/silence duration;
- exposes the frozen contour context to both sequential `define` expressions
  and contour effects;
- records every contributing duration and break feature version in each
  matched transaction read set; and
- keeps contour effects in the single Match-to-transaction rewrite executor.

Verification:

```text
npm run typecheck:core
PASS

npm run typecheck:scripts
PASS

npm test -- --run test/hrg
PASS: 11 files, 41 tests
```

Next graph-engine sub-slice: F0-layer commands and phase finalization.

## Iteration 021 — Phase 3 graph engine F0 layers

Status: kept as the sixth target-owner sub-slice of the replacement engine.

The direct F0-layer fixture was red because normalized `kind: f0_layer` inserts
had no graph action. The retained implementation treats them as typed,
point-anchored Items on the declared `f0_layer` Relation rather than creating a
second contour representation.

Kept convergence:

- stages layer, value, tag, optional duration-frame, and optional profile-point
  features in the matched rule transaction;
- binds the existing `merge(current, {ratio: ...})` form to the current Item's
  stamped temporal interval while preserving generic map merge behavior;
- appends profile and gesture commands to the one declared layer Relation;
- anchors every command through the existing journaled point-anchor operation;
  and
- proves profile and gesture histories replay to the identical graph digest.

Verification:

```text
npm run typecheck:core
PASS

npm run typecheck:scripts
PASS

npm test -- --run test/hrg
PASS: 12 files, 42 tests
```

Next graph-engine sub-slice: phase finalization, timing writes, point
resolution, dirty guard, and checkpoint/invalidation proof.

## Iteration 022 — Phase 3 graph engine finalization

Status: kept as the seventh target-owner sub-slice of the replacement engine.

The finalization fixtures were red because phase metadata was ignored and mark
times could only be written outside the transaction journal. The retained
implementation adds timing to the existing transaction/replay owner and keeps
phase control in the graph engine.

Kept convergence:

- identifies the sole compiled base Relation for `compute_times` and rejects an
  ambiguous base topology;
- validates active base interval contiguity and finite non-negative duration;
- records all interval-anchor and duration reads as parents of one phase timing
  transaction;
- journals, stamps, and replays resolved mark-time writes;
- verifies every requested point Relation has base-time support;
- records one graph-digest checkpoint after each executed phase;
- rejects matched point, association, suppression, or splice rules after timing
  finalization before they mutate the graph; and
- retains scalar-only post-finalization behavior explicitly covered by the old
  contract.

Verification:

```text
npm run typecheck:core
PASS

npm run typecheck:scripts
PASS

npm test -- --run test/hrg
PASS: 13 files, 45 tests
```

Next Phase 3 slice: delete module-global CEL function dispatch, complete tracked
navigation/path/predicate read proofs, and run the complete replacement-engine
exit gate before advancing to Phase 4.

## Iteration 023 — Phase 3 CEL isolation and topology reads

Status: kept as the eighth target-owner sub-slice of the replacement engine.

The nested-evaluation test was red because the shared CEL Environment dispatched
custom functions through `_currentFunctions`; an inner evaluation cleared its
caller's bindings before the caller's second function invocation. The topology
fixtures also established the missing exact relation-read contract.

Kept convergence:

- deletes `_currentFunctions` and its synchronous-global safety assumption;
- binds each explicit function-registry object to its own CEL Environment and
  weakly cached compiled-expression set;
- preserves the existing syntax cache/counters independently of runtime
  function bindings;
- proves nested evaluation cannot corrupt the caller's function registry;
- wraps evaluation variables so `current`, `prev`, `next`, and named capture
  access records the selected Relation membership decision lazily;
- makes `ahead`/`behind` record the reached membership decision; and
- proves a short-circuited navigation branch contributes neither its feature
  nor membership decision, while an executed branch contributes both.

Verification:

```text
npm run typecheck:core
PASS

npm run typecheck:scripts
PASS

npm test -- --run test/declarative-frontend-cel-expressions.test.ts test/hrg
PASS: 15 files, 53 tests

rg -n "_currentFunctions" src test
ZERO HIT
```

Next Phase 3 slice: finish graph-native predicate/path/catalog navigation and
run the complete replacement-engine exit gate before advancing to Phase 4.

## Iteration 024 — Phase 3 graph predicate navigation

Status: kept as the ninth target-owner sub-slice of the replacement engine.

The direct scan fixture required inline and named-predicate lookaround to run
against shared relation Items while retaining the caller's transaction-local
read tracker.

Kept convergence:

- implements `look_back_where`, `look_back_pred`, and `look_ahead_pred` over the
  selected Relation's active Item order;
- evaluates each candidate with `current`, `candidate`, `source`, and signed
  scan offset bound to the same explicit transaction;
- supports recursive predicate objects through the compiled predicate library;
- records each visited membership and only the candidate features actually read;
- adds graph-native `total` and prior-point relation query ownership with
  topology/anchor parents; and
- proves inline and named scans agree on shared Item identity.

Verification:

```text
npm run typecheck:core
PASS

npm run typecheck:scripts
PASS

npm test -- --run test/declarative-frontend-cel-expressions.test.ts test/hrg
PASS: 16 files, 54 tests
```

Next Phase 3 slice: shared-tree word/syllable/path catalog functions and the
complete replacement-engine exit gate.

## Iteration 025 — Phase 3 graph path and resource catalog

Status: kept as the tenth target-owner sub-slice of the replacement engine.

The shared-tree fixture established the remaining graph-query contract, while
the target fixture exposed that inventory materialization needed an explicit
resource DecisionRecord parent. The trajectory function was still incorrectly
owned by the standalone control-score module scheduled for deletion.

Kept convergence:

- derives owning Word/Syllable, daughters, parent, word-local segments, vowel
  count, syllable index/role/position, consonant-cluster position, phone/clause
  counts, and temporal spans from shared HRG identity;
- implements tracked `find_within_word` without loose token-array word scans;
- adds catalog-owned `path(item, pathname)` with tracked Festival relation
  switches, parent/daughter/list traversal, and terminal feature reads;
- makes `target()` require the selected inventory resource plus its provenance
  DecisionRecord and parents every materialized value on that decision;
- moves trajectory-to-window projection out of the standalone control-score
  owner into a frontend-neutral declarative owner used by both engines; and
- proves tree/path/resource values all parent their exact topology, feature, or
  resource decisions.

Final capability closure in this slice also makes `insert_points[*].when`
transaction-local and makes `prev_point()` return the latest active command in
the requested point Relation, including a command in the same source interval.

Verification:

```text
npm run typecheck:core
PASS

npm run typecheck:scripts
PASS

npm test -- --run test/declarative-frontend-cel-expressions.test.ts test/trajectory-control-windows.test.ts test/hrg
PASS: 17 files, 57 tests

npm test -- --run test/declarative-frontend-point-actions.test.ts test/declarative-frontend-navigation.test.ts test/declarative-frontend-cel-expressions.test.ts test/trajectory-control-windows.test.ts test/hrg
PASS: 19 files, 72 tests

rg -n "buildTrajectoryControlWindows" src test
ZERO HIT
```

The complete legacy capability-family gate also passed: model, navigation,
pattern, association actions/navigation, splice, point, scalar, contour,
sync-axis, finalize, and finalize-dirty (12 files, 51 tests). The replacement
engine remains unexported from production and has zero flat-engine calls.

Phase 3 status: complete. Next: Phase 4 lowering family 1, segment timing and
required-duration validation against the committed baseline fixtures.

## Iteration 026 — Phase 4 lowering family 1: segment timing

Status: implementation partially kept; parity evidence invalidated by Iteration 028.

Correction: the measurements below used `reconstructedLowering`, the deleted
bridge's uniform 5 ms projection, instead of `oldProduction.sourceFrames`, the
captured production automation-event contract. The duration/timing diagnostics
remain useful, but the frame counts and parity claim below are historical error,
not acceptance evidence.

The direct timing fixture was red for both required reasons: the lowerer still
looked for historical `dur_ms` by default and silently substituted 100 ms when
the final `duration` feature was absent. It also ignored the Utterance temporal
axis entirely.

Kept convergence:

- changes the final graph vocabulary default to `duration` while retaining an
  explicit feature-key option only for reading the immutable historical fixture;
- deletes `defaultDurationMs` and the implicit 100 ms policy;
- excludes lifecycle-suppressed Segment Items from the active lowering view;
- requires every active Segment to have a finite positive duration, a stamped
  interval anchor, and resolved left/right mark times;
- rejects non-contiguous or duration-disagreeing intervals instead of silently
  reconstructing timing;
- emits exact diagnostics for missing duration, unresolved time, and timing
  mismatch before throwing; and
- replaces the obsolete fallback test with required-data tests.

Measured immutable-oracle parity:

```text
qlatt-English fricatives: 2375 ms, 476 frames, exact
DECtalk English stops:    2900 ms, 581 frames, exact
qlatt-beauty structural:  2134 ms, 427 frames, exact
```

Verification:

```text
npm test -- --run test/hrg-lowering-timing.test.ts test/hrg.test.ts
PASS: 2 files, 19 tests

npm run typecheck:core
PASS

npm run typecheck:scripts
PASS

rg -n "defaultDurationMs|default 100 ms|defaultDuration" src/declarative-frontend/hrg test/hrg*.test.ts
ZERO HIT after the owning historical fallback test was deleted
```

Next Phase 4 slice: scalar/current-value resolution from versioned write
histories, compared field-by-field with the committed qlatt-English and DECtalk
frame fixtures before commit.

## Iteration 027 — Phase 4 lowering family 2: scalar histories

Status: implementation partially kept; parity evidence invalidated by Iteration 028.

Correction: the measurements below read expected scalar values from the same
reconstructed graph used to build the test Utterance. That was a round-trip
self-comparison, not production parity. The declared-column policy and
latest-write provenance unit remain useful, but the field-count parity claim
below is historical error, not acceptance evidence.

The direct scalar fixture was red because `hrg/lowering.ts` ignored the selected
frontend policy and substituted its own partial `DEFAULT_KLATT_PARAMS` list.
That list omitted backend columns including F6/B6, source selection, LF controls,
parallel amplitudes, nasal controls, and frontend-specific GO/DI values.

Kept convergence:

- deletes `DEFAULT_KLATT_PARAMS` and the optional inferred-column path;
- makes ordered `columns` a required part of the actual `TrackLoweringSpec`;
- requires every compiled bundled frontend policy to declare a non-empty column
  list, so the lowerer has no frontend-specific or present-value fallback;
- makes the lowerer's argument structurally accept the selected lowering policy
  directly, without an adapter;
- projects current values through `Item.get()` and each value's current producer
  through `Item.latestWrite()`; and
- preserves the declared column order in the lowered track.

Measured immutable-oracle parity on the first production frame:

```text
qlatt-English:          57/57 declared columns exact
DECtalk English:        52/52 declared columns exact
qlatt-beauty structural:59/59 declared columns exact
```

The history fixture writes F1 twice and proves that lowering emits the second
value and second decision id in both frame-local and parallel provenance maps.

Verification:

```text
npm test -- --run test/hrg-lowering-scalars.test.ts test/hrg-lowering-timing.test.ts test/hrg.test.ts test/declarative-frontend-schema.test.ts test/yaml-frontend-config.test.ts test/track-assembler-output-config.test.ts
PASS: 6 files, 60 tests

npm run typecheck:core
PASS

npm run typecheck:scripts
PASS

rg -n "DEFAULT_KLATT_PARAMS|paramKeys\\?:|Defaults to present-valued" src test
ZERO HIT
```

Next Phase 4 slice: transition/control-window realization from graph relations,
compared against the committed qlatt-English and DECtalk frame fixtures before
commit.

## Iteration 028 — Phase 4 production-contract reconciliation

Status: kept.

The prior two slices substituted `reconstructedLowering` for the named
production-frame oracle. Direct inspection proved the artifacts are not
equivalent:

```text
frontend          production events/end       deleted bridge samples/end
qlatt-English     46 / 2.505 s                 476 / 2.375 s
DECtalk English   309 / 2.9222 s               581 / 2.900 s
qlatt-beauty      48 / 2.264 s                 427 / 2.130 s
```

`klatt-interpreter.ts` schedules each production frame timestamp directly as a
Web Audio automation event. Ramp bindings interpolate between those events;
other bindings step. Uniform 5 ms samples therefore change the schedule and are
the stepwise approximation forbidden by plan section 9.

Independent Claude and agy reviews inspected the same repository evidence and
agreed on the correction: keep required timing validation, explicit selected
policy columns, and latest-write provenance; delete the uniform sampling loop
and both invalid parity tests. Their strongest additional finding was that the
scalar fixture was graph-to-itself rather than production-to-graph evidence.

Kept convergence:

- deletes `framePeriodSec`, `frameCount`, `findCovering`, and the uniform 5 ms
  sampling loop from the final lowerer;
- emits the first production-event family only: initial state, segment starts,
  final reset, and final-silence endpoint;
- consumes cited initial/final silence and duration-floor values from the
  selected lowering policy, with no bundled fallback;
- validates resolved axis intervals against the effective policy-floored
  duration, including DECtalk's 27 ms flap raised to its cited 30 ms floor;
- compares event times and phonemes only to the matching subset of
  `oldProduction.sourceFrames`, within the existing 1e-6 event epsilon;
- deletes every Phase 4 test read of `reconstructedLowering`; and
- removes the three tautological scalar parity cases while retaining the real
  two-write current-value/provenance unit.

Measured production-event boundary skeleton:

```text
qlatt-English:           27/27 boundary/silence events exact within epsilon
DECtalk English:         39/39 boundary/silence events exact within epsilon
qlatt-beauty structural: 22/22 boundary/silence events exact within epsilon
```

Verification:

```text
npm test -- --run test/hrg-lowering-timing.test.ts test/hrg-lowering-scalars.test.ts test/hrg.test.ts
PASS: 3 files, 20 tests

npm run typecheck:core
PASS

npm run typecheck:scripts
PASS

rg -n "reconstructedLowering|framePeriodSec|frameCount|findCovering|5 ms param track|5 ms Klatt" test/hrg-lowering-timing.test.ts test/hrg-lowering-scalars.test.ts test/hrg.test.ts src/declarative-frontend/hrg/lowering.ts
ZERO HIT
```

Phase 4 family 1 is now accepted against the production contract. Family 2
still requires a non-tautological current-value comparison at production event
cells before it can be accepted. Transition/control-window work does not begin
until that corrected scalar family is committed.

## Iteration 029 — Phase 4 lowering family 2: production scalar cells

Status: kept.

The invalid graph-to-itself cases were replaced with direct comparisons between
current versioned Segment values and the matching captured production boundary
events. Expected values come only from `oldProduction.sourceFrames`; the
historical graph supplies input values, identities, and durations.

The asserted base-scalar family explicitly excludes columns owned by later
transition, F0, affect/voice-quality, and speaker/source lowering families. It
includes higher filter constants, nasal filter/place controls, stable parallel
amplitudes, and backend filter controls. Every bundled frontend declares its
own subset through `output.lowering.columns`.

Measured exact production cells:

```text
qlatt-English:            24 Segment events * 21 columns = 504 cells
DECtalk English:          36 Segment events * 15 columns = 540 cells
qlatt-beauty structural:  19 Segment events * 21 columns = 399 cells
total:                                                     1,443 cells
```

The independent two-write unit additionally proves that current-value lowering
uses the newest feature version and its real producing decision id in both the
frame and parallel provenance projection.

Verification:

```text
npm test -- --run test/hrg-lowering-scalars.test.ts
PASS: 1 file, 4 tests
```

Phase 4 family 2 is now accepted against the production contract. Next is
family 3, transition/control-window realization directly from typed graph state.

## Iteration 030 — Phase 4 family 3A: graph control windows

Status: kept. Family 3 remains active for neighbor-transition realization.

The final lowerer now reads the current typed `control_windows` feature directly
from Segment Items. It does not construct `ControlScoreTimedControl`, a flat
phone array, or any other second authority.

Kept capability:

- resolves `current`, `prev`, and `next` targets against active Segment identity;
- resolves explicit millisecond, ratio, prefix, and suffix spans against the
  target Segment's effective duration;
- emits exact interior start/end automation events when the selected policy
  enables control boundaries;
- applies numeric `set` shorthand plus `set`, `add`, `mul`, `max`, `min`, and
  `unset` operations in graph/window order;
- leaves versioned graph values unchanged while projecting event-local values;
- attributes affected frame cells to the real `control_windows` feature-write
  decision and reverted cells to their base Segment writes; and
- diagnoses out-of-range targets and empty spans without inventing data.

Production proof uses a direct typed three-Segment fixture for the first captured
DECtalk `P_REL -> AE` aspiration window. It declares the cited window on the
release Segment and compares only to `oldProduction.sourceFrames`:

```text
109.2 ms AE window start: AH=48, B1=380, B2=160 exact
162.2 ms AE window end:   AH=0,  B1=130, B2=90  exact
```

Verification:

```text
npm test -- --run test/hrg-lowering-control-windows.test.ts test/hrg-lowering-scalars.test.ts test/hrg-lowering-timing.test.ts test/hrg.test.ts test/trajectory-control-windows.test.ts
PASS: 5 files, 27 tests

npm run typecheck:core
PASS

npm run typecheck:scripts
PASS
```

Next source slice stays within family 3: policy-driven midpoint and locus
transitions from neighboring Segment graph state, followed by full family-3
production event/cell parity before advancing to explicit F0 points.

## Iteration 031 — Phase 4 family 3B: midpoint transitions

Status: kept. Family 3 remains active for special F2 and locus transitions.

The lowerer now realizes ordinary neighbor midpoint transitions directly from
current/next Segment Items and the selected lowering policy. Generic code owns
no frontend or phoneme names: the policy supplies smooth Segment types, affected
columns, blend factor, default span, and event-class enablement. A stamped
per-Segment `transition_ms` value may override the selected default.

The direct qlatt-English fixture reproduces the captured EH-to-L steady event at
535 ms. Expected cells come only from `oldProduction.sourceFrames`:

```text
F1=485.5, F3=2533.25, B1=63, B2=93.5, B3=154.5 exact
```

F2 is intentionally excluded from this sub-slice: the captured path applies a
separate cited 45 ms sonorant rule rather than the ordinary blend factor. That
rule must become explicit selected policy/graph intent; it will not be hidden in
generic midpoint math.

Verification:

```text
npm test -- --run test/hrg-lowering-midpoint-transitions.test.ts test/hrg-lowering-control-windows.test.ts test/hrg-lowering-scalars.test.ts test/hrg-lowering-timing.test.ts test/hrg.test.ts
PASS: 5 files, 27 tests
```

Next source slice remains family 3: migrate and prove the cited sonorant F2
edge policy, then DECtalk locus/universal transitions and full family parity.

## Iteration 032 — Phase 4 family 3C: sonorant F2 ramps

Status: kept. Family 3 remains active for DECtalk locus/universal transitions.

The previously hardcoded sonorant F2 behavior is now explicit selected lowering
policy in all three bundled frontends:

- affected key: F2;
- span: cited 45 ms;
- boundary target: cited 75% neighboring sonorant value;
- current type: vowel; and
- neighbor types: nasal, liquid, glide.

The compiler validates the complete block, citations, positive span, and
neighbor weight range. Generic lowering evaluates backward and forward per-key
ramps at every emitted event without naming a frontend or phoneme.

Captured qlatt-English EH-to-L proof:

```text
520 ms: F2=1799 exactly at the 45 ms ramp start
535 ms: F2=1574.25 exactly at the ordinary midpoint event
```

The second value is an analytic interpolation toward the 75%-neighbor boundary
target; it is not another midpoint and not a uniform sampling approximation.

Verification:

```text
npm test -- --run test/hrg-lowering-midpoint-transitions.test.ts test/declarative-frontend-schema.test.ts test/yaml-frontend-config.test.ts test/track-assembler-output-config.test.ts
PASS: 4 files, 39 tests
```

Next source slice remains family 3: DECtalk policy-driven locus and universal
boundary transitions, then a complete transition/control-event parity matrix.

## Iteration 033 — Phase 4 family 3D: universal midpoint fallback

Status: kept. Family 3 remains active for DECtalk locus transitions.

The selected `smooth_all_boundaries` policy now extends ordinary midpoint
realization to boundaries outside the declared smooth Segment types. Frontends
that omit the flag retain smooth-type-only behavior; generic code contains no
DECtalk branch.

The direct production proof covers DECtalk's first P closure to P release
boundary. At 72.2 ms, all six policy columns equal the captured 50% boundary:

```text
F1=375, F2=1075.5, F3=2150, B1=250, B2=165, B3=200
```

Verification:

```text
npm test -- --run test/hrg-lowering-midpoint-transitions.test.ts
PASS: 1 file, 2 tests
```

Next source slice remains family 3: selected locus tables, per-formant ramp
spans, forward/backward edge realization, then full family parity.

## Iteration 034 — Phase 4 family 3E: locus and forward transitions

Status: kept. Family 3 remains active for its exhaustive parity gate.

The lowerer now consumes selected locus data directly from transition policy:

- male locus table and per-edge vowel category;
- policy-declared release/aspiration glue Segment classes;
- independent F1/F2/F3 `durtran` spans;
- forward boundary-to-steady and backward steady-to-boundary analytic ramps;
- rounded-sonorant/non-palatal place adjustment; and
- F2 back-cavity percent/span adjustment.

Generic code branches only on selected data and Segment features. It does not
name DECtalk, a bundled phoneme, or a fixed locus value. Universal forward
midpoint holds are also realized through `smooth_all_boundaries`, ending at the
selected transition span before base values resume.

Captured production proof:

```text
P -> AE forward locus:
  109.2 ms, 129.2 ms, 159.2 ms: F1/F2/F3 exact (9 cells)
AE -> T backward locus:
  218.2 ms, 228.2 ms: F1/F2/F3 exact (6 cells)
AE -> T universal forward hold on T:
  263.2 ms, 293.2 ms: F1/F2/F3/B1/B2/B3 exact (12 cells)
```

The direct adjustment fixture additionally proves the selected integer formulas:
F2 percent 56 -> rounded 78 -> back-affiliation 84, and F3 percent 25 ->
rounded 62, without mutating Segment values.

Verification:

```text
npm test -- --run test/hrg-lowering-midpoint-transitions.test.ts test/hrg-lowering-locus-transitions.test.ts
PASS: 2 files, 5 tests
```

Next source slice stays in family 3: exhaustive transition/control event and
owned-cell parity against the captured qlatt-English and DECtalk schedules.
