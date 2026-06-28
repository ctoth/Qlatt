# Iteration 017 - phase-aligned trace target ranking

## Baseline

- Baseline summary: `J:\Qlatt-oracle-output\dectalk-methodology-016-50\trace-summary.json`.
- Corpus gate: `46 / 50` phrases still produce convergence warnings.
- Corpus F2 meanAbs: `129.0926740635663`.
- Corpus same-segment F2 meanAbs: `120.65204164209926`.

## Methodology problem

Iteration 016 proved that a same-segment label match is not enough to select a
formant-target patch: `vowels-boat-bought` was AH vs AH, but DECtalk was early in
the segment while Qlatt was near the end. The next target needs to be selected
from same-segment errors whose max frame is also close in segment phase.

## Kept change

Added `scripts/oracle/rank-trace-targets.ts`, a reusable diagnostic utility that
reads a `trace-summary.json` and ranks phrase/parameter bucket errors. It can
filter by:

- parameter,
- segment bucket (`sameSegment`, `differentSegment`, `unknownSegment`),
- maximum absolute segment phase delta,
- minimum compared-frame count.

The output includes phrase id, parameter, compared frame count, mean/max error,
max-frame values, phone attribution, and oracle/Qlatt segment phases.

## Verification

- `npm run typecheck:core`: passed.
- F2 same-segment ranking with `--max-phase-delta 0.10` found the top clean F2
  targets:
  - `g2p-dog`: SIL/SIL/SIL, meanAbs `246.035`, phase delta `0.0013`.
  - `g2p-thought`: T/T/T, meanAbs `222.653`, phase delta `0.0914`.
  - `g2p-measure`: ER/ER/ER, meanAbs `222.457`, phase delta `-0.0005`.
- F3 same-segment ranking with `--max-phase-delta 0.10` found a stronger clean
  target:
  - `g2p-measure`: ER/ER/ER, meanAbs `625.715`, oracle `1619`, Qlatt `2500`,
    phase delta `-0.0005`.

## Result

Kept as a measurement/tooling slice. The next convergence candidate is
`g2p-measure` ER0 F3: it is a same-segment, phase-aligned mismatch, not a known
timing artifact.
