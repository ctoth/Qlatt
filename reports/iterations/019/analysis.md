# Iteration 019 - ER0 rhotic target correction

## Baseline

- Fixed oracle root: `J:\Qlatt-oracle-output\dectalk-ow-t-f2-014-50\dectalk-us-v1`.
- Baseline summary: `J:\Qlatt-oracle-output\dectalk-methodology-016-50\trace-summary.json`.
- Corpus warnings: `46 / 50`.
- Corpus F2 meanAbs: `129.0926740635663`.
- Corpus F3 meanAbs: `94.61155218022016`.

## Target

Iteration 017 selected a clean phase-aligned target:

- `g2p-measure`, F3, same-segment bucket.
- Phones: `ER/ER/ER`.
- Baseline same-segment F3 meanAbs: `625.715`.
- Max frame: oracle `1619`, Qlatt `2500`.
- Phase delta: `-0.0005`.

The same phrase also had phase-aligned F2 error in the rhotic region.

## Kept change

Updated the `dectalk-english` `ER0` inventory target:

- F2 `1650 -> 1320`.
- F3 `2500 -> 1540`.

The values are cited in-place to DECtalk 4.63 `p_us_rom.h` `us_maltar` RR steady
targets and the `measure.` oracle trace. This targets reduced rhotic quality
without changing `ER1` or adding a new rule.

## Verification

- One phrase, `g2p-measure`, cached oracle:
  `J:\Qlatt-oracle-output\dectalk-er0-rhotic-target-019-1`.
  - F3 same-segment meanAbs dropped from `625.715` to `118.764`.
  - F2 same-segment meanAbs dropped to `60.136`.
- First 5 cached oracle:
  `J:\Qlatt-oracle-output\dectalk-er0-rhotic-target-019-5`.
  - Failures `0`; warnings `5`; token similarity `1`.
- First 10 cached oracle:
  `J:\Qlatt-oracle-output\dectalk-er0-rhotic-target-019-10`.
  - Failures `0`; warnings `10`; token similarity `1`.
- First 50 cached oracle:
  `J:\Qlatt-oracle-output\dectalk-er0-rhotic-target-019-50`.
  - Failures `0`; warnings `46`; token similarity `1`.
  - F2 meanAbs improved `129.0926740635663 -> 126.14112188334613`.
  - F3 meanAbs improved `94.61155218022016 -> 87.05570270500895`.
  - Same-segment F2 improved `120.65204164209926 -> 116.9865065706473`.
  - Same-segment F3 improved `88.83632377004473 -> 79.47908585142359`.
- `npm run typecheck:core`: passed.

## Result

Kept as a source convergence slice. This is the first source slice verified with
the cached-oracle harness path from iteration 018.
