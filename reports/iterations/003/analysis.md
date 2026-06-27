# Iteration 003 - F2 sonorant-consonant to vowel smoothing

Start state:

- Baseline 50-phrase run: `J:\Qlatt-oracle-output\dectalk-stop-closure-sil-smooth-50`
- Failure count: `46 / 50` convergence warnings.
- Active target family: `F2`.
- F2 meanAbs: `146.8509545970659`.

## Candidate selection

The top F2 phrase in the baseline summary was `prosody-wh-question`
(`"Where are they going?"`), but focused trace inspection showed its max F2
miss is dominated by duration alignment. At oracle frame `125`, DECtalk is in
the final `NG`/silence transition (`F2 = 2063`) while Qlatt is still inside the
long `OW` span (`F2 = 905`). A direct F2 retune there would substitute for a
duration/scheduling fix, so this slice stayed within the F2 family and moved to
the next phrase with an actual formant-transition miss: `glide-young-yard`
(`"Young yaks yelled."`).

For `glide-young-yard`, the max F2 miss was early in `young`: DECtalk holds a
high Y-like F2 into the following AH vowel (`F2 = 1831` at frame `16`), while
Qlatt dropped to the AH target too soon (`F2 = 1170`). DECtalk source explains
the difference: `us_forw_smooth_rules()` applies a FORM_FREQ
sonorant-consonant-to-vowel 25/75 boundary and `NF45MS` span.

The kept source slice applies that DECtalk rule to the active target family
only: F2 at vowel starts after nasal/liquid/glide gets the 25/75 boundary and a
45 ms keyed transition. Existing midpoint behavior for F1/F3/B1-B3 is left
unchanged for this F2 iteration.

Citations:

- DECtalk 4.63 `p_us_st1.c:442-455` (FORM_FREQ current vowel after sonorant
  consonant uses 25/75 forward smoothing and `NF45MS`).
- DECtalk 4.63 `ph_defs.h` (`NF45MS` frame constant).
- Observed DECtalk `-lt` trace for `Young yaks yelled.`.

Verification:

- `npm test -- track-assembler` -> 31 tests passed.
- 1 phrase: `J:\Qlatt-oracle-output\dectalk-soncon-vowel-f2-1` -> 0
  failures, 1 warning, token similarity 1.0; `glide-young-yard` F2 meanAbs
  `245.27054662004664` (`247.29336713286713` before this slice), maxAbs `579`
  (`661` before this slice).
- 5 phrases: `J:\Qlatt-oracle-output\dectalk-soncon-vowel-f2-5` -> 0
  failures, 5 warnings, token similarity 1.0.
- 10 phrases: `J:\Qlatt-oracle-output\dectalk-soncon-vowel-f2-10` -> 0
  failures, 10 warnings, token similarity 1.0.
- 50 phrases: `J:\Qlatt-oracle-output\dectalk-soncon-vowel-f2-50` -> 0
  failures, 46 warnings, token similarity 1.0.
- `npm run typecheck:core`

After the kept slice, the 50-phrase L1 ranking is:

- `F2`: meanAbs `146.40834089282495`
- `F3`: meanAbs `100.46691099923201`
- `F1`: meanAbs `60.904983360354976`
- `F0`: meanAbs `59.91977283479464`
- `B3`: meanAbs `52.49637341070057`
- `B1`: meanAbs `34.0015359672327`
- `B2`: meanAbs `27.86786415223142`
- `AV`: meanAbs `8.52188753306596`

Compared with the previous kept scoreboard, the selected target improved:
`F2` meanAbs `146.8509545970659` -> `146.40834089282495`, with no increase in
50-phrase command failures or convergence warnings. Current evidence path:
`J:\Qlatt-oracle-output\dectalk-soncon-vowel-f2-50\trace-summary.json`.
