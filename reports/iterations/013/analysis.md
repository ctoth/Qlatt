# Iteration 013 - Boundary smoothing precedence over formant control windows

## Baseline

- Baseline run: `J:\Qlatt-oracle-output\dectalk-initial-formants-50\dectalk-us-v1`
- Baseline summary: `J:\Qlatt-oracle-output\dectalk-initial-formants-50\trace-summary.json`
- Corpus gate: `46 / 50` phrases still produce convergence warnings.
- Corpus F2 meanAbs: `129.2832193319339`.
- Current worst F2 phrase: `vowels-boat-bought`, F2 meanAbs
  `243.19679371040723`.

## Observation

For the `boat` `OW -> T` boundary:

- Oracle frame 38: `F2=1597`.
- Qlatt frame 38: `F2=905`.
- Qlatt then jumps at the `T` event to `F2=1360`.

The assembler computes backward obstruent-locus smoothing for sonorants before
obstruents, but `applyControlWindowsAtOffset()` currently applies smoothing
first and then applies segment control windows. For diphthongs, that means the
`OW` trajectory control window overwrites the backward `T` locus ramp across
the vowel tail.

## Hypothesis

Apply segment control windows before forward/backward boundary smoothing inside
`applyControlWindowsAtOffset()`. This preserves amplitude/source control
windows, but lets DECtalk boundary smoothing win for F1/F2/F3 transition keys
when both mechanisms target the same event.

## Planned verification

1. Run `typecheck:core`.
2. Run one phrase: `vowels-boat-bought`.
3. If improved, run 5, 10, and 50 phrase oracle batches.
4. Keep only if the 50-phrase warning count does not increase and corpus F2
   meanAbs improves.

## Citations

- DECtalk 4.63 `ph_setar.c` computes diphthong targets via `make_dip`.
- DECtalk 4.63 `p_us_st1.c` / `ph_sttr2.c` boundary smoothing applies
  formant transition values toward adjacent obstruent loci.

## Result

Rejected at the 10-phrase gate.

- `npm run typecheck:core`: passed.
- First implementation exposed an unintended side effect: applying full
  smoothing snapshots after control windows also overwrote amplitude windows.
  The slice was corrected to only let changed boundary fields override the
  control-window result.
- 1 phrase (`vowels-boat-bought`): F2 meanAbs improved
  `243.19679371040723 -> 232.09996953458307`.
- 5 phrases: F2 meanAbs stayed `94.37751875995406`; warnings stayed `5 / 5`,
  token similarity stayed `1`.
- 10 phrases: F2 meanAbs regressed
  `155.3891867693099 -> 156.07777602287345`.

The mechanism is partly right for `OW -> T`, but as a general precedence change
it worsens the 10-phrase gate. The next attempt should be narrower than global
control-window precedence, probably limited to DECtalk diphthong formant windows
adjacent to obstruent-locus transitions or by reproducing `make_dip`'s internal
coarticulation rather than changing all control-window ordering.
