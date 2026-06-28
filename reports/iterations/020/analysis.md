# Iteration 020 - ER1 DECtalk tail target

## Baseline

- Fixed oracle root: `J:\Qlatt-oracle-output\dectalk-ow-t-f2-014-50\dectalk-us-v1`.
- Baseline summary: `J:\Qlatt-oracle-output\dectalk-er0-rhotic-target-019-50\trace-summary.json`.
- Corpus warnings: `46 / 50`.
- Corpus F2 meanAbs: `126.14112188334613`.
- Corpus F3 meanAbs: `87.05570270500895`.
- Same-segment F2 meanAbs: `116.9865065706473`.
- Same-segment F3 meanAbs: `79.47908585142359`.

## Target

After iteration 019, the phase-aligned same-segment ranking selected:

- `g2p-church`, F3, same-segment bucket.
- Phones: `ER/ER/ER`.
- Baseline same-segment F3 meanAbs: `226.97471910112358`.
- Max frame: oracle `1671`, Qlatt `2702.5`.
- Phase delta: `0.0346`.

The same phrase also had phase-aligned ER F2 error.

## Source basis

`US_ER` in DECtalk 4.63 `p_us_rom.h` `us_maltar` is a trajectory pointer into
`us_maldip`, not a single static target. Extracting `US_ER` with the existing
`scripts/extract-dectalk-diphthong-trajectories.ts` showed male:

- F2: `1650 @ 110`, `1500 @ 190`, `1500 tail`.
- F3: `2500 @ 100`, `1790 @ 190`, `1750 tail`.

Qlatt already had ER1's entry target (`F2=1650`, `F3=2500`) but held the static
target there. This slice sets the static ER1 target to DECtalk's male tail values:

- F2 `1650 -> 1500`.
- F3 `2500 -> 1750`.

That is intentionally narrower than implementing full ER trajectory support.

## Verification

- One phrase, `g2p-church`, cached oracle:
  `J:\Qlatt-oracle-output\dectalk-er1-tail-target-020-1`.
  - F3 same-segment meanAbs improved `226.97471910112358 -> 191.303`.
  - F2 same-segment meanAbs improved `115.964 -> 89.729`.
- First 5 cached oracle:
  `J:\Qlatt-oracle-output\dectalk-er1-tail-target-020-5`.
  - Failures `0`; warnings `5`; token similarity `1`.
- First 10 cached oracle:
  `J:\Qlatt-oracle-output\dectalk-er1-tail-target-020-10`.
  - Failures `0`; warnings `10`; token similarity `1`.
- First 50 cached oracle:
  `J:\Qlatt-oracle-output\dectalk-er1-tail-target-020-50`.
  - Failures `0`; warnings `46`; token similarity `1`.
  - F2 meanAbs improved `126.14112188334613 -> 125.33449260000893`.
  - Same-segment F2 improved `116.9865065706473 -> 116.28123922971945`.
  - Same-segment F3 improved `79.47908585142359 -> 78.19802334460566`.
  - F3 meanAbs regressed slightly `87.05570270500895 -> 87.2055875074665`,
    due to different-segment frames increasing `117.34179850124896 -> 122.96211490424646`.
- `npm run typecheck:core`: passed.

## Result

Kept as a source convergence slice because the fixed-oracle gates pass, the
target phrase improves, same-segment F2/F3 improve, and combined corpus F2+F3
meanAbs improves `213.19682458835508 -> 212.54008010747542`. The F3 aggregate
regression is recorded as a known caveat and points at remaining timing/segment
alignment work rather than a reason to keep the old non-DECtalk ER1 target.
