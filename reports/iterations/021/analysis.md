# Iteration 021 - rejected ER1 trajectory window

## Baseline

- Fixed oracle root: `J:\Qlatt-oracle-output\dectalk-ow-t-f2-014-50\dectalk-us-v1`.
- Baseline summary: `J:\Qlatt-oracle-output\dectalk-er1-tail-target-020-50\trace-summary.json`.
- Target phrase: `g2p-church`.
- Baseline target F3 same-segment meanAbs after iteration 020: `191.303`.
- Baseline target F2 same-segment meanAbs after iteration 020: `89.729`.

## Trial

Added the source-backed DECtalk `US_ER` male trajectory to `ER1`:

- F1: `490 @ 40`, `490 @ 230`, `490 tail`.
- F2: `1650 @ 110`, `1500 @ 190`, `1500 tail`.
- F3: `2500 @ 100`, `1790 @ 190`, `1750 tail`.

This used the existing declarative `trajectory_to_windows` structural mechanism.
No code or helper was added.

## One-phrase result

Command:

`npm run oracle:run -- --phrase-id g2p-church --oracle-root J:\Qlatt-oracle-output\dectalk-ow-t-f2-014-50\dectalk-us-v1 --out-root J:\Qlatt-oracle-output\dectalk-er1-trajectory-021-1 --continue-on-error 1`

Trace summary:

`J:\Qlatt-oracle-output\dectalk-er1-trajectory-021-1\trace-summary.json`

The target regressed:

- F3 same-segment meanAbs worsened `191.303 -> 234.528`.
- F2 same-segment meanAbs worsened `89.729 -> 103.876`.
- Max aligned F3 was oracle `1651` vs Qlatt `2500` at phase delta `0.0241`.

## Result

Rejected. Restored `public/rules/frontends/dectalk-english/inventory.yaml` with
`git restore -- public/rules/frontends/dectalk-english/inventory.yaml` before any
further source work.

Interpretation: DECtalk's raw `US_ER` trajectory cannot be dropped directly into
the current Qlatt trajectory window scaling for this shortened/contextual ER token.
The remaining `g2p-church` mismatch is likely an interaction between duration-scaled
trajectory timing and CH locus transitions, not missing raw trajectory data alone.
