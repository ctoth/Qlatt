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
| 013 | Phase 3 checkpoints and replay | kept | pending slice commit | digest-equal replay; 29 HRG tests; core/scripts typecheck pass |

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
