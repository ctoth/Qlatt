# Alku, Strik & Vilkman 1997 — Parabolic Spectral Parameter: Implementation Notes

## What PSP Is

Parabolic Spectral Parameter (PSP) is a frequency-domain measure of glottal flow spectral decay. It quantifies how the low-frequency spectral envelope of the estimated glottal volume velocity waveform compares to the theoretical maximum spectral decay (a DC-flow / sinc^2 spectrum).

- PSP gives a **single numerical value** per glottal cycle
- Higher PSP = steeper spectral decay = breathier phonation
- Lower PSP = shallower spectral decay = pressed phonation
- PSP monotonically decreased from breathy to pressed for **all 10 speakers** tested

## Why PSP Exists (Motivation)

Time-based parameters (OQ, SQ, CQ) depend on accurately locating glottal opening and closure instants, which is error-prone due to noise and formant ripple. HRF (Harmonic Richness Factor) uses spectral harmonics but depends on pitch-asynchronous analysis, making it sensitive to F0 changes. PSP uses pitch-synchronous analysis of the low-frequency spectral envelope only, avoiding both problems.

## Core Algorithm

### Step 1: Parabolic Matching (Sub-routine)

Given a discrete spectrum X(k), fit a parabola Y(k) = ak^2 + b by minimizing mean-square error:

**Error function:**
```
E = sum_{k=0}^{N-1} (X(k) - ak^2 - b)^2
```

**Optimal parameter a (Eq. 5):**
```
a = [N * sum(X(k)*k^2) - sum(X(k)) * sum(k^2)] / [N * sum(k^4) - (sum(k^2))^2]
```
where all sums run k = 0 to N-1.

**Optimal parameter b (Eq. 4):**
```
b = (1/N) * sum(X(k) - ak^2)
```

**Normalized error (Eq. 6):**
```
NE = sum((X(k) - ak^2 - b)^2) / sum(X(k)^2)
```

### Step 2: Full PSP Computation

1. Estimate glottal volume velocity waveform (via inverse filtering, e.g., DAP method from Alku & Vilkman 1994)
2. Cut one glottal cycle: span from minimum amplitude instant in one cycle to the corresponding instant in the next cycle
3. Adjust minimum amplitude of the glottal flow to zero by subtracting the minimum value. Denote result g_p(n).
4. Scale energy of g_p(n) to unity
5. Compute pitch-synchronous power spectrum via FFT with rectangular windowing, on dB scale. Zero-pad to FFT size of 2048 for sufficient spectral resolution. Result: X(k).
6. Compute optimal parabolic parameter *a* using the parabolic matching sub-routine (Eq. 5)
7. Repeat steps 4-6 for a signal with amplitude = 1, length = T_0 (the hypothetical DC-flow). The resulting *a* value is a_max — the theoretical maximum spectral decay for this fundamental period.
8. Compute PSP:

```
PSP = a / a_max                     (Eq. 7)
```

### Adaptive Frequency Range

The frequency range N over which the parabola is fit is determined adaptively:

1. Start with N = 3 (minimum to get non-zero energy)
2. Compute optimal *a* and *b*
3. Compute NE (normalized error, Eq. 6)
4. If NE < 0.01: increment N by 1, go to step 2
5. Otherwise: exit — current N is the upper limit

This ensures the parabola only fits the "main lobe" of the pitch-synchronous low-pass spectrum where the fit is accurate. The threshold 0.01 was validated: for a hypothetical glottal source with F0 = 80 Hz, the NE within the main lobe of the sinc^2 function was ~0.04, confirming 0.01 keeps fits within the main lobe.

## Key Properties of PSP

- **F0-invariant**: By normalizing against the DC-flow (sinc^2) spectrum of the same period length, PSP removes the effect of fundamental frequency on spectral decay. Two signals with same waveform shape but different F0 yield the same PSP.
- **Always positive**: Both the natural glottal flow spectrum and the DC-flow spectrum are low-pass, so both yield negative *a* values. The ratio of two negatives is positive.
- **Monotonic with phonation type**: PSP decreased monotonically from breathy to normal to pressed for all 10 subjects (5 female, 5 male).
- **Stable**: Coefficient of variation across 10 consecutive glottal periods was 1.1% to 8.4% (mean 4.1%).
- **Uses low frequencies only**: Focuses on frequency range where glottal source has largest energy, avoiding noisy high-frequency regions.

## Comparison Parameters

### Time-domain parameters used for comparison:
- **OQ** (Open Quotient): ratio of glottal open phase to fundamental period. Typical: breathy ~0.9-1.0, normal ~0.8-0.9, pressed ~0.6-0.8
- **SQ** (Speed Quotient): ratio of opening phase to closing phase. Typical: breathy ~1.0-2.5, normal ~1.4-2.0, pressed ~1.3-1.9
- **CQ** (Closing Quotient): ratio of closing phase to fundamental period. Typical: breathy ~0.2-0.4, normal ~0.2-0.4, pressed ~0.1-0.3

### Frequency-domain comparison:
- **HRF** (Harmonic Richness Factor, Childers & Lee 1991): ratio of sum of harmonic amplitudes above fundamental to fundamental amplitude. Computed pitch-asynchronously with Hamming window spanning 5 glottal periods.

## Results Summary (Tables 1 & 2)

PSP was the only parameter that showed **perfect monotonic ordering** (breathy > normal > pressed) for all 10 speakers. CQ came close but failed for one female speaker (F5). OQ and SQ showed large inter-speaker variation and inconsistent trends.

### Typical PSP ranges (dimensionless):
- Female speakers: breathy 0.04-0.21, normal 0.07-0.36, pressed 0.06-0.17
- Male speakers: breathy 0.08-0.43, normal 0.13-0.39, pressed 0.08-0.17

Note: PSP values in the tables show breathy > normal > pressed consistently.

## Inverse Filtering Method

- Uses Discrete All-pole Modeling (DAP) from El-Jaroudi & Makhoul 1991
- Applied to speech pressure waveform recorded in free field (no flow mask needed)
- All-pole filter orders: 8 (breathy), 10 (normal), 12 (pressed)
- Sampling: original 22.050 kHz, downsampled to 8.0 kHz
- Anti-aliasing: linear phase FIR low-pass at 4.0 kHz before downsampling
- High-pass FIR at 50.0 Hz to remove low-frequency air pressure variations
- Block length for glottal flow estimation: 32 ms with Hamming window

## Relevance to Klatt Synthesis

PSP provides a way to **validate synthesized glottal waveforms** against target voice qualities:
- Compute PSP from the LF-model output of the synthesizer
- Compare against typical PSP ranges for breathy/normal/pressed phonation
- Can serve as a diagnostic metric: "is the synthesized glottal source spectrally appropriate for the intended phonation type?"

However, PSP cannot be used to directly synthesize the time-domain glottal waveform (acknowledged by the authors). It is an analysis/validation tool, not a synthesis parameter. For synthesis, the LF-model parameters (Ee, Rd, etc.) remain the primary controls.
