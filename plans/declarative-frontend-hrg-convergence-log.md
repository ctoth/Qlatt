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
| 001 | Phase 0 baseline/oracles | kept | pending baseline commit | results and fixture paths above |
