# Iteration 014 - OW-to-T late F2 locus window

## Baseline

- Baseline run: `J:\Qlatt-oracle-output\dectalk-initial-formants-50\dectalk-us-v1`
- Baseline summary: `J:\Qlatt-oracle-output\dectalk-initial-formants-50\trace-summary.json`
- Corpus gate: `46 / 50` phrases still produce convergence warnings.
- Corpus F2 meanAbs: `129.2832193319339`.
- Target phrase: `vowels-boat-bought`, F2 meanAbs `243.19679371040723`.

## Observation

Iteration 013 proved that letting boundary smoothing override trajectory control
windows fixes the `OW -> T` tail in `vowels-boat-bought`, but the global
precedence change regressed the 10-phrase gate:

- `vowels-boat-bought`: `243.19679371040723 -> 232.09996953458307`.
- First 10 phrases: `155.3891867693099 -> 156.07777602287345`.
- Regressing 10-phrase cases included `g2p-about` and `prosody-how-are-you`.

The rejected mechanism was too broad. The known wrong frame is specifically the
late F2 of `OW` before alveolar `T` in `boat`.

## Kept change

Added a narrow declarative structural rule that appends an F2-only locus control
window for `OW -> T` after the generic diphthong trajectory. The parameters live
under `parameters.policy.formant` and the rule is registered in the structural
pipeline immediately after `dectalk_apply_diphthong_trajectories`.

The final selector is intentionally narrower than the initial hypothesis:

- Requires `current.phoneme == 'OW'`.
- Requires a following stop with guarded `has(next.is_stop_base)`.
- Requires `next.phoneme == 'T'`.
- Requires guarded `has(next.alveolar)` and `next.alveolar == true`.

## Corrections during the slice

- Moved literal window and locus values into `frontend.yaml` policy parameters
  so the rule remains data-driven and cited.
- Added the rule to `pipeline.yaml`; an earlier run had no effect because the
  rule existed but was not scheduled.
- Changed the window from an absolute `at_ms: current.duration - ...` to
  `suffix_ms`; the absolute value was computed before duration rules shortened
  the vowel, so the window could start beyond the final segment.
- Guarded optional feature fields with `has(...)` after 50-phrase validation
  exposed missing-property failures.
- Narrowed from `OW` before any alveolar stop to `OW -> T`; the broader form
  changed `OW -> D` in `liquid-clear-light` and regressed that phrase.

## Verification

- `npm run typecheck:core`: passed.
- One phrase, `vowels-boat-bought`:
  - Run: `J:\Qlatt-oracle-output\dectalk-ow-t-f2-014-1`
  - F2 meanAbs: `243.19679371040723 -> 236.03974242835596`.
- First 5 phrases:
  - Run: `J:\Qlatt-oracle-output\dectalk-ow-t-f2-014-5`
  - F2 meanAbs unchanged at `94.37751875995406`.
- First 10 phrases:
  - Run: `J:\Qlatt-oracle-output\dectalk-ow-t-f2-014-10`
  - F2 meanAbs unchanged at `155.3891867693099`.
- First 50 phrases:
  - Run: `J:\Qlatt-oracle-output\dectalk-ow-t-f2-014-50`
  - Command failures: `0`.
  - Corpus warnings unchanged at `46 / 50`.
  - Token similarity unchanged at `1`.
  - Corpus F2 meanAbs improved `129.2832193319339 -> 129.0926740635663`.
  - The only per-phrase F2 change was `vowels-boat-bought`:
    `243.19679371040723 -> 236.03974242835596`.

## Citations

- DECtalk 4.63 `ph_sttr2.c` `setloc`: obstruent loci provide boundary formant
  values for adjacent sonorants.
- DECtalk 4.63 `p_us_rom.h` `us_place[]`: `T` is alveolar.
- DECtalk 4.63 oracle `-lt` trace for `vowels-boat-bought`: `OW -> T` tail F2
  rises toward the alveolar stop locus before the stop frame.
