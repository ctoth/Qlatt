# STOI Implementation Notes

## Goal
Implement STOI/ESTOI (Short-Time Objective Intelligibility) measure in Qlatt as a quality metric for synthesized speech.

## Research Complete

### Papers Processed
1. **Taal et al. 2011** — `papers/Taal_2011_STOI/` — Full STOI algorithm, all 8 equations, constants, logistic mapping. 12 pages read.
2. **Jensen & Taal 2016** — `papers/Jensen_2016_ESTOI/` — ESTOI extension, row-column normalization, spectral correlation. 14 pages read.

### Reference Implementation Scouted
- **pystoi** at `~/src/pystoi` — full report at `reports/stoi-scout-pystoi.md`
- ~200 lines Python total
- Key insight: OBM matrix is static (15x257 binary), can be hardcoded
- Key insight: resampling can be avoided by using WebAudio OfflineAudioContext
- Key insight: FFT is the only DSP primitive needed beyond basic linear algebra

## Algorithm Summary

### Shared Steps (STOI and ESTOI)
1. Resample both signals to 10 kHz
2. Remove silent frames (40 dB dynamic range threshold, based on clean signal only)
3. STFT: 256-sample Hann window, 50% overlap, 512-point FFT
4. Apply 15-band 1/3 octave matrix (150 Hz to ~4.3 kHz) → (15, T) envelopes
5. Extract N=30 frame segments (384 ms) → (S, 15, 30)

### STOI-Specific
6. Energy-normalize y segments to match x (per-band, per-segment)
7. Clip to SDR floor: β = -15 dB
8. Compute Pearson correlation per band per segment
9. Average → scalar d

### ESTOI-Specific
6. Row normalize (per-band: zero-mean, unit-variance) both x and y
7. Column normalize (per-frame: zero-mean, unit-variance) both x and y
8. Inner product of normalized columns, average → scalar d

## Constants
| Constant | Value |
|----------|-------|
| FS | 10000 Hz |
| N_FRAME | 256 samples |
| NFFT | 512 |
| NUMBAND | 15 |
| MINFREQ | 150 Hz |
| N | 30 frames (~384 ms) |
| BETA | -15 dB |
| DYN_RANGE | 40 dB |

## JS Dependencies Needed
- FFT library (fft.js or similar) for rfft
- Hanning window (trivial to implement)
- Matrix multiply, norms, means (manual on Float64Array)
- Resampling: either port Octave-compatible Kaiser filter OR use OfflineAudioContext

## Status
- [x] Papers processed (Taal 2011, Jensen 2016)
- [x] Reference implementation scouted (pystoi)
- [x] Implementation plan drafted
- [x] Core module implemented (`src/metrics/stoi.ts`)
- [x] CLI tool implemented (`scripts/stoi-eval.ts`)
- [x] Unit tests implemented (`test/metrics/stoi.test.ts`) — 22/22 passing
- [x] package.json updated (fft.js dep, stoi script)
- [x] tsconfig files updated (core + scripts)
- [x] Typecheck clean (no new errors; pre-existing engine.ts error unrelated)
- [x] Full test suite: no regressions introduced
