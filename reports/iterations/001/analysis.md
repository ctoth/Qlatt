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
