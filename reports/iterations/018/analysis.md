# Iteration 018 - cached oracle harness path

## Baseline

- Fixed oracle root: `J:\Qlatt-oracle-output\dectalk-ow-t-f2-014-50\dectalk-us-v1`.
- Baseline summary: `J:\Qlatt-oracle-output\dectalk-methodology-016-50\trace-summary.json`.
- Corpus gate: `46 / 50` phrases still produce convergence warnings.
- Corpus F2 meanAbs: `129.0926740635663`.

## Methodology problem

`npm run oracle:run` rendered DECtalk and Qlatt together on every iteration.
That is the wrong default for convergence slices: DECtalk is the fixed oracle,
and rerunning it every time makes the proof less clean. A source slice should
rerender Qlatt only, then compare it against a fixed DECtalk artifact set.

The aborted ER0 acoustic candidate was restored before this work started, so
this slice contains only harness methodology.

## Kept change

Added `--oracle-root <existing-corpus-run-dir>` to `scripts/oracle/run-corpus.ts`.
When present, the harness:

- copies `oracle/` artifacts for each phrase from the fixed oracle root,
- rewrites copied `oracle.json` path fields to the current run directory,
- appends a note that DECtalk was reused and not rerun,
- renders only Qlatt,
- writes `oracleRoot` into the run summary.

The output directory shape remains compatible with existing comparison and trace
summary tooling: `outRoot/dectalk-us-v1/<phrase>/oracle` and `.../qlatt`.

## Verification

- Cached one-phrase run:
  `npm run oracle:run -- --phrase-id g2p-measure --oracle-root J:\Qlatt-oracle-output\dectalk-ow-t-f2-014-50\dectalk-us-v1 --out-root J:\Qlatt-oracle-output\dectalk-cached-oracle-018-1b --continue-on-error 1`
- The run summary records `oracleRoot`.
- The copied `oracle.json` records:
  `Reused cached DECtalk oracle ... DECtalk was not rerun.`
- `scripts/oracle/summarize-trace-run.ts` succeeded on the cached-output layout.
- `npm run typecheck:core`: passed.
- Process check after the smoke run found no active `oracle:run`, `run-corpus.ts`,
  or `say.exe` process.

## Result

Kept as a harness methodology slice. Future convergence source slices should use
`--oracle-root` against a fixed DECtalk corpus artifact unless the oracle corpus,
DECtalk binary, voice/rate environment, or requested phrase set changes.
