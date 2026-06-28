# Iteration 015 - segment-aware L1 diagnostic

## Baseline

- Baseline run: `J:\Qlatt-oracle-output\dectalk-ow-t-f2-014-50\dectalk-us-v1`
- Baseline summary: `J:\Qlatt-oracle-output\dectalk-ow-t-f2-014-50\trace-summary.json`
- Corpus gate: `46 / 50` phrases still produce convergence warnings.
- Corpus F2 meanAbs: `129.0926740635663`.

## Methodology problem

The pre-existing trace summarizer compared each DECtalk `-lt` frame at
`frameIndex * 0.0064s` to the last Qlatt track event at or before that same time.
That headline number is useful as a coarse regression score, but it is not enough
to decide the next frontend patch because it mixes:

- same-segment parameter errors,
- duration or boundary alignment errors,
- symbolic/allophonic mismatches.

For example, the old 50-phrase summary reported `prosody-hello-world` as the worst
F2 phrase. At its max F2 error frame, DECtalk is in an `L` output/source segment
while Qlatt is still in `ER`. Chasing that as a pure `ER` or `L` formant target
would be methodologically invalid.

## Kept change

Extended `scripts/oracle/summarize-trace-run.ts` without changing the existing
headline fields:

- each parameter summary now reports max-error phone attribution:
  `maxOraclePhone`, `maxOracleOutputPhone`, `maxQlattPhone`, `maxSegmentMatch`;
- each parameter summary now splits error into `sameSegment`,
  `differentSegment`, and `unknownSegment` buckets;
- corpus `byParam` entries now include same-segment and different-segment
  compared-frame counts plus mean absolute error;
- corpus summary now includes aggregate frame alignment counts.

The classifier uses DECtalk symbolic comparison tokens for source-phone identity,
DECtalk trace `PH` for output-phone identity, and Qlatt track `phoneme` labels for
the local event identity. Qlatt labels are normalized for release/aspiration suffixes,
stress digits, and known DECtalk-equivalent allophones.

## Verification

- `npm run typecheck:core`: passed.
- Diagnostic summary over the one-phrase artifact:
  `J:\Qlatt-oracle-output\dectalk-methodology-015-1\trace-summary.json`.
- Diagnostic summary over the first 5 artifact:
  `J:\Qlatt-oracle-output\dectalk-methodology-015-5\trace-summary.json`.
- Diagnostic summary over the first 10 artifact:
  `J:\Qlatt-oracle-output\dectalk-methodology-015-10\trace-summary.json`.
- Diagnostic summary over the first 50 artifact:
  `J:\Qlatt-oracle-output\dectalk-methodology-015-50\trace-summary.json`.

Corrected 50-phrase F2 attribution:

- Headline F2 meanAbs remains `129.0926740635663`.
- Same-segment F2 meanAbs is `120.65204164209926` across `9167` compared frames.
- Different-segment F2 meanAbs is `166.63562931632393` across `2402` compared frames.
- Unknown-segment F2 meanAbs is `43.74` across `150` compared frames.
- Corpus alignment counts: `9167` same-segment frames, `2402` different-segment
  frames, `150` unknown frames, `11719` total frames.
- `prosody-hello-world` max F2 frame is now explicitly labeled:
  oracle source `L`, oracle output `L`, Qlatt `ER`, `maxSegmentMatch=false`.

## Result

Kept as a measurement/tooling slice. The old headline remains available for
continuity, but future formant-rule patches should be selected from same-segment
parameter evidence or from an explicitly diagnosed alignment/symbolic mismatch,
not from raw mixed time-aligned error alone.
