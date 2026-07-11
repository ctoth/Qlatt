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
| 004 | Phase 2A selected resource ownership | kept | pending slice commit | three inventory identities pass; 87 adjacent tests; core/scripts typecheck pass |

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
