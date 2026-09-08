# Higher-pole correction

Select the `laine88` experiment for Laine (1988), Fig. 18's worked four-formant
all-zero correction. It inherits the baseline graph and registry, enables four
existing WASM antiresonators after the cascade, and fixes the active cascade count
to four even when a frontend supplies another `NFC`. Parallel frication bypasses
the correction and retains its independent formants.

The correction's only input is **effective** `tractLength` in cm (including end
correction), default 17.5. Zero frequencies are `(2i-1) * 35000 / (4*tractLength)`;
bandwidths are `[1500, 1500, 1500, 2000] * 17.5 / tractLength` Hz. Each section
has unity DC gain. The cited YAML rules own these values. Lengths outside 14–21 cm
produce `W_SEMANTICS_PARAM_RANGE` and are bounded to that range before division.

The worked filter is a four-formant approximation, not a general correction for
arbitrary cascade counts. Its reported accuracy extends to about 4 kHz; the
44.1 kHz digital realization here is not claimed to meet that error bound or to
correct digital self-compensation at every sampling rate. In particular, the
all-zero filter can strongly lift energy beyond its design band. This experiment
keeps the baseline's bypassed output low-pass for an observable comparison; it
does not establish a new default voice or a perceptual quality improvement.

`klatt80-baseline` and `stevens91` retain the **legacy alternative**: arithmetic
F7–F10 spacing and decreasing Q. Those resonators are not the Laine correction.
The baseline's new zero stages bypass exactly; its selectable cascade count and
parallel F7–F10 controls retain their existing behavior. DECtalk and the other
independent graphs retain their own topology.

Source: [Laine 1988 implementation notes](../papers/Laine_1988_HigherPoleCorrection/notes.md),
“Higher Pole Correction in Vocal Tract Models and Terminal Analogs,” Speech
Communication 7, 21–40, especially Fig. 18 and the length-scaling discussion.

## Reproduce the spectral comparison

From the candidate checkout in PowerShell:

```powershell
pwsh -NoProfile -File build.ps1
$env:HPC_OUTPUT_DIR = 'target/hpc-comparison'
npx.cmd vitest run test/higher-pole-render.test.ts
npm.cmd run measure -- target/hpc-comparison/legacy10.wav target/hpc-comparison/four-pole.wav target/hpc-comparison/laine14.wav target/hpc-comparison/laine17.5.wav target/hpc-comparison/laine21.wav
```

`npm run measure` now uses the tracked `scripts/measure-spectrum.ts`. The previous
package command referenced an untracked Praat sidecar, absent from a fresh clone.
This command accepts mono PCM16 WAVs and emits JSON spectral power fractions
(0–4 kHz, 4–8 kHz, and 8 kHz–Nyquist), plus the ratio above/below 4 kHz. It uses a
whole-record Hann window, zero-padded FFT, and no pre-emphasis. It does not report
Praat pitch, formants, or voice-quality measurements.

Measured on 2026-09-08 with “We owe you.”, noise seed 55, 44,100 Hz, identical
source and output settings, and 1.438 seconds including lead/tail silence:

| Model | Above/below 4 kHz (dB) | 4–8 kHz power (%) | 8 kHz–Nyquist power (%) |
|---|---:|---:|---:|
| Legacy, NFC=10 | -47.75 | 0.00156 | 0.000120 |
| Four poles, no correction | -51.81 | 0.000586 | 0.0000726 |
| Laine, 14 cm | -31.17 | 0.000956 | 0.0753 |
| Laine, 17.5 cm | -17.79 | 0.0115 | 1.63 |
| Laine, 21 cm | -7.97 | 0.0417 | 13.72 |

The 17.5 cm correction raises the above/below-4-kHz ratio by 34.02 dB relative
to the four-pole control and 29.97 dB relative to the old ten-pole model. Most of
that increase is above 8 kHz, outside the paper's approximation band. These are
end-to-end output measurements (including compression and PCM16 quantization),
not isolated filter transfer functions. The four-pole control separates the
effect of the zero stages from the change in cascade count. Render tests also
check finite, nonzero, unclipped output and tract-length sensitivity.
