# Iteration 007 - rejected LL inventory target slice

Target surface: L1 F2 convergence, still focused on `glide-young-yard` after iteration 006 rejected postvocalic `LL -> LX`.

Baseline:
- 50-phrase run: `J:\Qlatt-oracle-output\dectalk-unstressed-floor-50`
- Corpus warnings: 46 / 50
- Corpus F2 meanAbs: `134.70500022091034`
- Target phrase F2 meanAbs: `265.26930388909335`

Attempt:
- Observed that `YELLED` intentionally emits `LL`, but `LL` has no inventory target.
- The baseline target phrase emits `W_PHONEME_NOT_IN_INVENTORY` for `LL` and falls back to silence-like/default acoustics.
- Tried adding `LL` as a source-faithful alias of the existing DECtalk `US_LL` code 27 lateral target currently stored under `L`.

Result:
- Run root: `J:\Qlatt-oracle-output\dectalk-ll-target-1`
- One phrase still warned: 1 / 1
- Token similarity improved to `1`, but duration regressed badly:
  - Baseline target phrase duration delta: about `+0.0102s`
  - New target phrase duration delta: `-0.17180000000000017s`
- Target phrase F2 meanAbs worsened:
  - Baseline: `265.26930388909335`
  - New: `277.0227104825`
- The final `LL` duration changed from `219ms` to `41ms`, because materializing the real liquid target caused the existing duration rules to apply non-initial and unstressed consonant shortening.

Decision:
- Rejected. Adding the real `LL` target alone fixes the inventory warning but worsens the target phrase F2 and duration.
- Restored source files to the iteration 006 state.
- This is the second consecutive no-kept-improvement source slice on `glide-young-yard` / L1 F2 (`006` and `007`), so exact-convergence rules require stopping instead of widening the target surface.
