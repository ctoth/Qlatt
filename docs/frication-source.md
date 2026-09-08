# Aerodynamic frication

The baseline frontend supplies constriction area `Ac` (cm²), volume flow `Ug`
(cm³/s), and front-cavity length for fricatives. `fricationMode=1` selects the
physical source when `Ac>0`; `fricationMode=0` retains the original dB control.
Zero flow at a physical constriction produces silence and cannot revive the
fallback. Other phones carry zero area and keep their existing source routing.

The Rust source uses Stevens (1971), p. 1184: `fc = 0.2 Ug / Ac^(3/2)`.
Its broad noise envelope approximates the equivalent pressure-source spectrum,
not the already-radiated spectrum. Pressure loss is `5.13e-8 (Ug/Ac)^2` kPa.
The level law is normalized to 0.1 cm² and 300 cm³/s and uses Badin & Fant's
(1989) pressure/area exponents: 1.3/0.3 for sibilants and 0.8/0.2 for labiodentals.
The source applies that drive once; downstream gain supplies the reference level.

Front-cavity length sets a quarter-wave resonance; independent linear parallel
gains normalize each analysis resonator at its peak. Legacy PFE compensation
remains in the dB control. An anterior /f/ source uses the bypass, without an
invented front-cavity pole (Stevens 1971; Shadle 1985). Exact inventory targets,
reference gains, and the sampled cavity-envelope approximation are engineering
choices, identified as such in the cited configuration.

## Reproduce the comparison

Build the worklets/WASM with `pwsh -NoProfile -File build.ps1` on Windows or
`bash build.sh` on Unix, then run `npm run measure:frication`.
The test uses the real Node audio backend and the installed Vite environment.
Set `FRICATION_OUTPUT_DIR` to save paired WAVs, full render JSON, and a compact
`comparison.json` in one subdirectory per seed. No artifacts are written by default.

The reference is Jongman, Wayland & Wong (2000), Table I. Analysis uses 22 kHz,
40 ms Hamming windows at onset/middle/end and across the following vowel boundary,
98% preemphasis, a zero-padded 4096-point FFT, power weighting, and excess kurtosis.
Each token and window has equal weight. The fixed distance is Euclidean error in
kHz, million Hz², skewness, and excess kurtosis; every phone must improve separately.
Table I pools speakers, voicing, vowels, and windows. This is a paired engineering
comparison to population references, not an exact reproduction of that study or
a perceptual listening-test result. Individual moments remain in the JSON report.

Calibration used “See she fee.” with seed 51. The regression uses “Sue shoe foo.
Sack shack fact. Saw shawl fall. So show foe. Say shade fade.” and independent seeds:

| Seed | Phone | dB distance | Physical distance |
| --- | --- | ---: | ---: |
| 20260214 | /s/ | 5.885929 | 3.395342 |
| 20260214 | /ʃ/ | 31.393143 | 2.994064 |
| 20260214 | /f/ | 2.100925 | 1.713711 |
| 9173 | /s/ | 4.933295 | 3.653074 |
| 9173 | /ʃ/ | 29.017753 | 3.233820 |
| 9173 | /f/ | 2.064980 | 1.740428 |

Independent Praat checks through the existing `npm run measure -- <wav>` sidecar
found the same 6.904 s duration and 159 Hz median F0 for both seed-20260214 renders.
That sidecar measures whole-waveform/voiced properties; the per-fricative spectral
comparison above is performed by `scripts/frication-spectrum.ts`.
