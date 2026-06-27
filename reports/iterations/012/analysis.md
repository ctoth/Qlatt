# Iteration 012 - Initial silence formant preconditioning

## Baseline

- Baseline run: `J:\Qlatt-oracle-output\dectalk-onset-y-stress-50\dectalk-us-v1`
- Baseline summary: `J:\Qlatt-oracle-output\dectalk-onset-y-stress-50\trace-summary.json`
- Corpus gate: `46 / 50` phrases still produce convergence warnings.
- Corpus F2 meanAbs: `132.74605745805388`.
- Current worst F2 phrase: `vowels-boat-bought`, F2 meanAbs `250.9756398642534`.

## Observation

Fifteen phrases have their F2 max error at frame 0 with Qlatt at the generic
default `F2=1500`. Example, `vowels-boat-bought`:

- Oracle frame 0: `PH=256` (`GEN_SIL`), `PH2=302`, `F1=220`, `F2=690`,
  `F3=2179`, `AV=0`.
- Qlatt event 0: `F1=500`, `F2=1500`, `F3=2500`, `AV=0`.
- Qlatt event 1 at 19.2ms: first `B` target, `F1=220`, `F2=691`,
  `F3=2177`, `AV=47`.

So the initial interval is silent, but DECtalk has already preconditioned the
formant targets toward the following phone. Qlatt currently starts with
`fillDefaultParams(SIL, baseParams)`, and the DECtalk `SIL` inventory only
declares silence amplitude/timing, so generic base formants leak into the first
three 6.4ms frames.

## Hypothesis

When `initial_silence_ms > 0`, seed the initial track event's formant and
bandwidth fields from the first segment while keeping silence/source amplitude
fields from `SIL`. This should reduce the shared frame-0 F2 error without
turning the leading silence voiced.

## Planned verification

1. Run `typecheck:core`.
2. Run one phrase: `vowels-boat-bought`.
3. If improved, run 5, 10, and 50 phrase oracle batches.
4. Keep only if the 50-phrase warning count does not increase and corpus F2
   meanAbs improves.

## Citations

- `public/rules/frontends/dectalk-english/frontend.yaml`:
  `initial_silence_ms` cites DECtalk 4.63 `-lt` traces showing
  clause-initial `GEN_SIL` before voiced obstruents spans three synthesis
  frames at 6.4ms.
- DECtalk 4.63 `-lt` oracle trace for `vowels-boat-bought` frame 0 shows
  `GEN_SIL` with first-phone formants and silent amplitudes.

## Result

Kept.

- `npm run typecheck:core`: passed.
- 1 phrase (`vowels-boat-bought`): F2 meanAbs improved
  `250.9756398642534 -> 243.19679371040723`; max F2 error moved from frame 0
  to frame 38.
- 5 phrases: F2 meanAbs improved
  `96.22480940034815 -> 94.37751875995406`; warnings stayed `5 / 5`,
  token similarity stayed `1`.
- 10 phrases: F2 meanAbs improved
  `157.09181206763927 -> 155.3891867693099`; warnings stayed `10 / 10`,
  token similarity stayed `1`.
- 50 phrases: F2 meanAbs improved
  `132.74605745805388 -> 129.2832193319339`; warnings stayed `46 / 50`,
  token similarity stayed `1`.

The count of phrases whose F2 max error occurs at frame 0 dropped from `15` to
`1`, confirming this slice removed the shared generic-startup-formant artifact.
