# Iteration 002 - F2 terminal stop-closure silence smoothing

Start state:

- Baseline 50-phrase run: `J:\Qlatt-oracle-output\dectalk-f2-locus-ramp-50`
- Failure count: `46 / 50` convergence warnings.
- Active target family: `F2`.
- F2 meanAbs: `148.67747563128384`.

## Candidate: stop-closure-to-terminal-silence carry

The next target remains `g2p-thought` (`"thought."`). After the kept F2-only
locus-ramp slice, the vowel-side AO ramp improved, but the largest remaining
F2 mismatch moved to the terminal `T`/silence boundary:

- Oracle frame `73`: F2 `1259`.
- Qlatt frame `73`: F2 `1700`.

The previous no-op candidate excluded `prev.type == 'stop'` from
`dectalk_silence_carries_formants`, but inventory inspection showed DECtalk
English `T` is typed as `stop_closure`, not `stop`. The actual production path
is therefore still active: terminal `SIL` can copy the stop-closure F2 target
of `1700` Hz.

This candidate narrows the existing silence carry rule to also exclude
`stop_closure`, so terminal silence after an unreleased stop closure uses the
silence/boundary smoothing path instead of inheriting the closure locus.

Citations:

- DECtalk 4.63 `p_us_st1.c` Special Rule 2: dummy-vowel release into silence.
- Observed DECtalk `-lt` traces for `dog.` and `thought.`: terminal stop
  boundaries decay through `GEN_SIL` instead of holding the release/closure
  inventory locus.

Verification:

- 1 phrase: `J:\Qlatt-oracle-output\dectalk-stop-closure-sil-smooth-1` -> 0
  failures, 1 warning, token similarity 1.0; `g2p-thought` F2 meanAbs
  `213.46657349397591` (`275.3460915662651` before this slice), maxAbs
  `356.5` (`441` before this slice).
- 5 phrases: `J:\Qlatt-oracle-output\dectalk-stop-closure-sil-smooth-5` -> 0
  failures, 5 warnings, token similarity 1.0.
- 10 phrases: `J:\Qlatt-oracle-output\dectalk-stop-closure-sil-smooth-10` -> 0
  failures, 10 warnings, token similarity 1.0.
- 50 phrases: `J:\Qlatt-oracle-output\dectalk-stop-closure-sil-smooth-50` -> 0
  failures, 46 warnings, token similarity 1.0.
- `npm run typecheck:core`

After the kept slice, the 50-phrase L1 ranking is:

- `F2`: meanAbs `146.8509545970659`
- `F3`: meanAbs `100.46691099923201`
- `F1`: meanAbs `60.904983360354976`
- `F0`: meanAbs `59.91977283479464`
- `B3`: meanAbs `52.49637341070057`
- `B1`: meanAbs `34.0015359672327`
- `B2`: meanAbs `27.86786415223142`
- `AV`: meanAbs `8.52188753306596`

Compared with the previous kept scoreboard, the selected target improved:
`F2` meanAbs `148.67747563128384` -> `146.8509545970659`, with no increase
in 50-phrase command failures or convergence warnings. Current evidence path:
`J:\Qlatt-oracle-output\dectalk-stop-closure-sil-smooth-50\trace-summary.json`.
