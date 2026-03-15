# Gerratt & Kreiman (2001) - Measuring Vocal Quality with Speech Synthesis

## Implementation-Relevant Notes

### Core Concept: Analysis-Synthesis for Perceptual Voice Quality Measurement

The paper proposes replacing traditional rating scales (which show poor inter-rater reliability) with a listener-mediated analysis-synthesis protocol. Listeners adjust synthesizer parameters to match natural voice samples, producing objective parametric measurements of perceived voice quality.

### Synthesizer Architecture

Custom MATLAB formant synthesizer with the following controllable parameters:
- **F0** (fundamental frequency)
- **Glottal volume velocity derivative shape** (LF model parameters)
- **Noise spectrum** (inharmonic source component)
- **Overall signal-to-noise ratio** (SNR)
- **Formant frequencies and bandwidths**
- **Tremor**: rate, extent, regularity of F0 modulation (sine wave or irregular)

### Source Model: Modified LF

- Uses Fant et al. (1985) LF model with two modifications:
  1. **Return phase fit improved** -- beginning of closed phase explicitly parameterized
  2. **Equal area constraint abandoned** -- requiring equal areas under positive/negative flow derivative curves caused return phases not to reach zero for some pathological voices, introducing high-frequency artifacts at pulse onset (see Epstein et al. 1999)
- LF parameters derived by inverse filtering a single glottal pulse from microphone recordings (Javkin et al. 1987 method)

### Noise Synthesis Pipeline

1. Cepstral-domain comb filter (de Krom 1993 style) removes harmonic component, leaving inharmonic residual
2. Inverse filter residual to remove vocal tract resonance effects, isolating inharmonic source
3. Fit noise spectrum with 25-segment piecewise linear approximation
4. Synthesize 100-tap FIR filter from fitted spectrum
5. Pass white noise through FIR filter to create spectrally shaped noise
6. Jitter and shimmer effects NOT modeled separately -- subsumed into overall spectral noise

### F0 Interpolation for Quantization Avoidance

At 10 kHz sampling rate, F0 quantization is a problem. Solution:
- Generate F0-vs-time plot for full 1s token duration (incorporating tremor)
- Synthesize source **pulse by pulse** using interpolation
- Track absolute beginning/ending times of each pulse (can occur between samples)
- At each new pulse onset, interpolate F0 curve to find current F0
- Stretch/compress LF pulse template to exact desired period
- Calculate sample points accordingly
- Effect: equivalent to digitizing an analog pulse train at exact desired frequencies

### Signal Processing Details

- Sampling rate: **10 kHz** (downsampled from original 20 kHz recordings)
- LPC analysis window: **25.6 ms** (increased to **51.2 ms** when F0 near/below 100 Hz)
- SNR range: **0 dB** (very noisy) to **50 dB** (noise-free) -- spans pathological voice range
- SNR adjustment resolution: **0.05 dB steps**
- Stimulus duration: **1 second** vowel /a/
- Onset/offset ramps: **30 ms** to eliminate clicks

### Key Perceptual Finding: Masking by Harmonic Energy

- Voices with source spectra having little energy above H1/H2: listeners agreed precisely on SNR
- Voices with significant high-frequency harmonic energy (voices 5, 9, 11): listeners showed higher variance in SNR matching
- The two groups differed significantly in LF composite parameter **RA** (Fant & Lin 1988), which measures high-frequency harmonic source energy: F(1,10) = 75.35, p < 0.05
- Interpretation: small noise differences are harder to discriminate when masked by harmonic energy in upper frequencies

### Reliability Results (Table I)

Rating variances (synthesis vs. visual analog):

| Voice | Synthesis | Visual Analog | F(9,9) |
|-------|-----------|---------------|--------|
| 1     | 6.27      | 234.54        | 37.41, p<0.05 |
| 2     | 35.13     | 806.27        | 22.95, p<0.05 |
| 3     | 10.27     | 407.78        | 39.71, p<0.05 |
| 4     | 17.34     | 131.96        | 7.61, p<0.05 |
| 5     | 485.88    | 144.10        | 3.37, n.s. |
| 6     | 13.97     | 86.46         | 6.19, p<0.05 |
| 7     | 33.69     | 157.51        | 4.68, p<0.05 |
| 8     | 30.97     | 356.27        | 11.50, p<0.05 |
| 9     | 433.49    | 317.73        | 1.36, n.s. |
| 10    | 3.58      | 241.96        | 67.59, p<0.05 |
| 11    | 295.52    | 402.23        | 1.36, n.s. |
| 12    | 11.42     | 554.18        | 48.52, p<0.05 |

- 9/12 voices: synthesis variance significantly lower
- 3 voices (5, 9, 11) where variances didn't differ: ROC analysis showed listeners' settings were within a difference limen (perceptually equivalent)
- 72.5% of all listener responses in synthesis task were perceptually identical (ROC area <= 0.5)
- Only 2.5% (3/120) of responses were consistently discriminable (ROC >= 0.9), and these were from different listeners on different voices (random errors)

### Relevance to Qlatt

1. **LF model modifications**: The equal-area-constraint abandonment and explicit closed-phase parameterization may improve Qlatt's LF source model for pathological/non-modal voices
2. **Noise synthesis pipeline**: The cepstral comb filter -> inverse filter -> piecewise linear fit -> FIR filter chain is a well-defined approach for modeling voice source noise that could extend Qlatt's noise capabilities
3. **F0 interpolation algorithm**: The pulse-by-pulse interpolation with sub-sample tracking is directly relevant to avoiding F0 quantization artifacts in Qlatt's source generation
4. **RA parameter as perceptual discriminator**: High-frequency harmonic energy masks noise perception -- relevant for setting noise parameters in voice quality modeling
5. **Validation methodology**: The analysis-synthesis-as-measurement paradigm provides a framework for validating Qlatt's output quality against human perception
