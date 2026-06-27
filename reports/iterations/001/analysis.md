# Iteration 001 analysis

## Starting point

- Branch: `master`
- Baseline commit: `e906d43b`
- Baseline run: `J:\Qlatt-oracle-output\dectalk-per-formant-f3-45-50\dectalk-us-v1\summary.json`
- Corpus size: 50 phrases
- Command failures: 0
- Convergence warnings: 46
- Current pass count under this ledger: 4 / 50

## Pre-ledger committed slices

The branch already contains three kept slices for the current DECtalk work:

- `e4c7eb7d` traced DECtalk locus lowering decisions.
- `8b6295ad` honored per-formant locus transition timing.
- `e906d43b` shortened the DECtalk TH-RR F3 transition.

Those commits are the baseline for this ledger. Iteration 001 starts from that
committed state rather than trying to treat earlier chat-only notes as the record.

## Next decision

The next source slice should be selected from current 50-phrase evidence. The
largest actionable discrepancy must be identified from oracle-vs-Qlatt trace output
before editing YAML or TypeScript.

## Scoreboard correction

The first aggregate scoreboard run ranked `T0` highest, but that was a measurement
bug: the comparator was checking oracle `OUT_T0` against Qlatt `F0 * 10`.
DECtalk source binds the frontend `F0` parameter to `OUT_T0`, assigns
`parstochip[OUT_T0] = f0prime`, and labels the value as Hz*10 in `vtm_i.h`.
The correct per-frame comparison is oracle `f0prime / 10` against Qlatt `F0`.

After correcting the measurement, the 50-phrase L1 ranking is:

- `A2`: meanAbs 548.2396962198139
- `F2`: meanAbs 208.234138578377
- `F3`: meanAbs 128.45517791620446
- `F1`: meanAbs 78.0924396279546
- `B3`: meanAbs 72.360098984555
- `F0`: meanAbs 59.97648324799537

Current evidence path:
`J:\Qlatt-oracle-output\dectalk-per-formant-f3-45-50\trace-summary-f0hz.json`.
