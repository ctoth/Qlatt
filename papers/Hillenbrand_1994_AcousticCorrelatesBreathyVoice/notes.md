# Hillenbrand, Cleveland, & Erickson (1994) — Implementation Notes

## Key Finding: Hierarchy of Breathiness Correlates

Ranked by squared correlation with breathiness ratings (r^2):

| Measure | Unfiltered | Bandpass 2.5-3.5 kHz | Highpass 2.5 kHz |
|---------|-----------|---------------------|-----------------|
| CPP     | 0.85      | 0.81                | 0.79            |
| RPK     | 0.29      | 0.83                | 0.79            |
| P/A     | 0.09      | 0.29                | 0.34            |
| BRI     | 0.17      | —                   | —               |
| H/L     | 0.26      | —                   | —               |
| H1A     | 0.44      | —                   | —               |

**Critical takeaway**: Periodicity measures (CPP, RPK on filtered signals) predict ~80% of breathiness variance. H1 amplitude predicts ~44%. Spectral tilt predicts only ~17-26%.

## Acoustic Measures Defined

### CPP (Cepstral Peak Prominence)
- Compute cepstrum of signal (25.6 ms window, every 10 ms)
- Fit linear regression line relating quefrency to cepstral magnitude (from 1 ms to max quefrency)
- CPP = amplitude difference between cepstral peak and the regression line value at that quefrency
- Measures how far the cepstral peak emerges from cepstral "background noise"
- Average CPP over all frames
- Works well on both filtered and unfiltered signals
- **Robust to pitch tracking errors** — no need to verify cepstral peak corresponds to actual F0

### RPK (Pearson r at Autocorrelation Peak)
- Standard autocorrelation pitch tracker (period search: 3.3-16.7 ms = 60-303 Hz)
- At each frame, compute Pearson product-moment correlation between signal and delayed copy at delay of autocorrelation peak
- Normalized measure of inter-period correlation
- Average over all frames (30 ms window, every 10 ms)
- **Only works well on filtered signals** (bandpass or highpass at 2.5 kHz)
- Also robust to pitch tracking errors

### P/A (Peak-to-Average Ratio)
- Ratio of peak amplitude to average amplitude from full-wave rectified signal
- Averaged over non-overlapping 10 ms segments
- Suggested by Klatt & Klatt (1990)
- Weak predictor on unfiltered signals; moderate on filtered

### BRI (Breathiness Index)
- Modified version of Fukazawa et al. (1988) spectral tilt measure
- Ratio of energy in second derivative of signal to energy in non-derived signal
- 25.6 ms window, every 10 ms, averaged over all frames
- Weak predictor (r^2 = 0.17)

### H/L (High-to-Low Frequency Energy Ratio)
- Average spectral energy >= 4 kHz divided by average energy < 4 kHz
- 128-point (6.4 ms) FFT every 3.2 ms, averaged over all frames
- Weak predictor (r^2 = 0.26)

### H1A (First Harmonic Amplitude)
- H1 amplitude relative to H2, measured from 512-point (25.6 ms) spectrum
- Measured by visual inspection at signal center
- Moderate predictor (r = 0.66, r^2 = 0.44)
- Works slightly better for women than men

## Stepwise Multiple Regression (Table 4)

| Step | Added Measure | Cumulative R^2 |
|------|--------------|----------------|
| 1    | CPP          | 0.84           |
| 2    | BRI          | 0.88           |
| 3    | H1A          | 0.90           |
| 4    | RPK          | 0.92           |
| 5    | RPK-BP       | 0.94           |

CPP alone explains 84% of variance; adding all other measures only gains 10%.

## Intercorrelation Matrix (Table 3) — Key Relationships

- CPP and RPK (filtered) are strongly correlated (r ~ 0.91-0.93)
- BRI and H/L are strongly correlated (r = 0.81) — both measure spectral tilt
- H1A correlates moderately with CPP (r ~ -0.52 to -0.58) and RPK filtered (r ~ -0.57 to -0.58)
- Spectral tilt measures (BRI, H/L) correlate weakly with periodicity measures

## Implications for Klatt Synthesizer

### Mapping Breathiness to Klatt Parameters

1. **AH (aspiration amplitude)**: Primary parameter for breathiness. Increasing AH adds aspiration noise, which is the dominant perceptual cue. The periodicity measures (CPP, RPK) essentially quantify the signal-to-noise ratio where "noise" is aspiration noise.

2. **OQ (open quotient) / TL (spectral tilt)**: Secondary. H1 amplitude increases with more sinusoidal (higher OQ) glottal pulses. H1-H2 difference maps to OQ in the Klatt model. But H1A alone only explains 44% of variance.

3. **Spectral tilt alone is insufficient**: BRI and H/L were weak predictors. Don't rely solely on TL parameter for breathiness.

### Recommended Synthesis Strategy for Breathy Voice
- **Primary**: Increase AH by 10-20 dB from baseline
- **Secondary**: Increase OQ (open quotient) to raise H1 relative to H2 (~6 dB H1-H2 difference for moderate breathiness based on Figure 3 showing H1/H2 = 6.3 dB normal vs 12.0 dB breathy)
- **Tertiary**: Slight increase in spectral tilt (TL)
- Klatt & Klatt (1990) found H1 increases alone heard as nasal, not breathy — aspiration noise must accompany H1 boost

### Quantitative Benchmarks from Figure 3
- Normal phonation: H1/H2 ~ 6.3 dB
- Moderately breathy: H1/H2 ~ 12.0 dB
- Difference: ~5.7 dB increase in H1-H2 for moderate breathiness

### Peak-to-Average Ratio (from Figure 2, bandpass 2.5-3.5 kHz)
- Normal phonation: P/A ~ 8.7
- Moderately breathy: P/A ~ 5.2
- Decrease of ~40% in periodicity strength in mid-frequency band

## Experimental Design Notes
- 15 speakers (8M, 7F), ages 22-37, normal voices
- 3 breathiness levels: normal, moderately breathy, very breathy
- 4 vowels: /a/, /i/, /ae/, /o/ — sustained ~1 sec
- 20 listeners, direct magnitude estimation, rescaled 0-1
- Listener reliability: intra-judge r = 0.91 mean; inter-judge Cronbach alpha = 0.95 mean
- No vowel effect on breathiness ratings
- Men rated slightly breathier than women (only in "very breathy" condition)

## Limitations Noted by Authors
- Used simulated breathiness (normal talkers), not naturally occurring dysphonic voices
- Sustained vowels only — continuous speech untested
- Dysphonic voices may show more complex patterns than simple breathiness
