# Iteration 016 - max-error segment phase attribution

## Baseline

- Baseline summary: `J:\Qlatt-oracle-output\dectalk-methodology-015-50\trace-summary.json`
- Corpus gate: `46 / 50` phrases still produce convergence warnings.
- Corpus F2 meanAbs: `129.0926740635663`.
- Corpus same-segment F2 meanAbs: `120.65204164209926`.

## Methodology problem

Iteration 015 separated same-segment, different-segment, and unknown-segment
errors, but the next target showed another invalid substitution: a same-segment
label match can still compare different positions inside that segment.

`vowels-boat-bought` had the worst same-segment F2 meanAbs. Its same-segment max
frame was AH vs AH in `but`, but the trace window showed DECtalk early in AH while
Qlatt was already near the end of AH. Treating that as a pure AH target error would
again risk patching the wrong mechanism.

## Kept change

Extended `scripts/oracle/summarize-trace-run.ts` so both the overall parameter max
and each segment bucket max now report:

- oracle segment start/end seconds,
- oracle segment phase,
- Qlatt segment start/end seconds,
- Qlatt segment phase,
- phase delta (`qlattPhase - oraclePhase`).

Oracle phase is derived from contiguous DECtalk `phoneIndex` runs. Qlatt phase is
derived from contiguous normalized track `phoneme` runs.

## Verification

- `npm run typecheck:core`: passed.
- Diagnostic summary over the one-phrase artifact:
  `J:\Qlatt-oracle-output\dectalk-methodology-016-1\trace-summary.json`.
- Diagnostic summary over the first 5 artifact:
  `J:\Qlatt-oracle-output\dectalk-methodology-016-5\trace-summary.json`.
- Diagnostic summary over the first 10 artifact:
  `J:\Qlatt-oracle-output\dectalk-methodology-016-10\trace-summary.json`.
- Diagnostic summary over the first 50 artifact:
  `J:\Qlatt-oracle-output\dectalk-methodology-016-50\trace-summary.json`.

Key 50-phrase evidence:

- Headline F2 meanAbs remains `129.0926740635663`.
- Same-segment F2 meanAbs remains `120.65204164209926`.
- `vowels-boat-bought` same-segment F2 max:
  - frame `145`,
  - oracle source/output/Qlatt phone: `AH` / `AH` / `AH`,
  - oracle F2 `1091`, Qlatt F2 `1616.1352941176474`,
  - oracle phase `0.25000000000000056`,
  - Qlatt phase `0.9592592592592597`,
  - phase delta `0.7092592592592591`.

## Result

Kept as a measurement/tooling slice. The next real convergence target should be
chosen with segment phase visible; the `vowels-boat-bought` AH hotspot is currently
evidence of timing/phase divergence, not a proven steady AH formant target error.
