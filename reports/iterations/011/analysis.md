# Iteration 011 - DECtalk OW F2 trajectory

## Baseline

- Baseline run: `J:\Qlatt-oracle-output\dectalk-onset-y-stress-50\dectalk-us-v1`
- Baseline summary: `J:\Qlatt-oracle-output\dectalk-onset-y-stress-50\trace-summary.json`
- Corpus gate: `46 / 50` phrases still produce convergence warnings.
- Corpus F2 meanAbs: `132.74605745805388`.
- Current worst F2 phrase: `vowels-boat-bought`, F2 meanAbs `250.9756398642534`.

## Observation

For `vowels-boat-bought`, DECtalk's oracle trace for the first word starts at
the voiced stop target (`F2 ~= 690`) and then moves through `OW` upward:

- frame 17: `F2=826`
- frame 24: `F2=948`
- frame 31: `F2=1236`
- frame 38: `F2=1597`
- frame 39, coda transition: `F2=1653`

Qlatt's emitted track holds `OW` around `1020`, then applies a trajectory down
to `905`, which is the opposite direction for the decisive F2 movement.

The current `OW1` / `OW0` inventory trajectory in
`public/rules/frontends/dectalk-english/inventory.yaml` has:

- `F2: 1020 @ 40ms`
- `F2: 790 @ 170ms`
- final `790`

That F1 trajectory in the same block matches DECtalk `p_us_rom.h` `us_maldip`
near the `OW` row (`540 @ 40`, `490 @ 170`), so this slice only changes the
DECtalk frontend inventory values for `OW` F2.

## Hypothesis

Changing the `OW1` and `OW0` declarative F2 trajectory from a falling 1020->790
shape to an up-gliding 1020->1650 shape will reduce the `vowels-boat-bought`
F2 error and improve or preserve the 50-phrase corpus F2 meanAbs without
increasing the `46 / 50` warning count.

## Planned verification

1. Run `typecheck:core`.
2. Run one phrase: `vowels-boat-bought`.
3. If improved, run 5, 10, and 50 phrase oracle batches.
4. Keep only if the 50-phrase warning count does not increase and F2 improves.

## Result

Rejected at the 10-phrase gate.

- `npm run typecheck:core`: passed.
- 1 phrase (`vowels-boat-bought`): F2 meanAbs improved
  `250.9756398642534 -> 245.341024479638`.
- 5 phrases: unchanged relative to prior baseline for that prefix; F2 meanAbs
  remained `96.22480940034815` and token similarity remained `1`.
- 10 phrases: F2 meanAbs regressed
  `157.09181206763927 -> 161.6073251941309`.

The likely reason is that a simple late `OW` target of `1650` helps `boat`
before an alveolar coda, but over-applies to other `OW` contexts such as
`world`. The right next fix is not a global `OW` inventory retarget; it needs a
context-sensitive DECtalk trajectory/coarticulation rule or a closer
implementation of `make_dip` plus the surrounding smoothing logic.
