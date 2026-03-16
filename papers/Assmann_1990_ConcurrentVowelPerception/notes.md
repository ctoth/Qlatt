---
title: "Assmann & Summerfield (1990) — Modeling the perception of concurrent vowels: Vowels with different fundamental frequencies"
year: 1990
---

# Assmann & Summerfield (1990) — Modeling the perception of concurrent vowels: Vowels with different fundamental frequencies

## Key Parameters

### Vowel Formant Frequencies and Bandwidths (Table I)

Five British English monophthongal vowels used to synthesize stimuli via Klatt (1980) cascade formant synthesizer:

| Formant | /i/ | /a/ | /u/ | /open-o/ | /turned-v/ |
|---------|-----|-----|-----|----------|------------|
| F1 (Hz) | 250 | 650 | 250 | 350 | 450 |
| F2 (Hz) | 2250 | 950 | 850 | 750 | 1250 |
| F3 (Hz) | 3050 | 2950 | 1950 | 2850 | 2650 |
| F4 (Hz) | 3350 | 3350 | 3350 | 3350 | 3350 |
| F5 (Hz) | 3850 | 3850 | 3850 | 3850 | 3850 |

**3-dB bandwidths** (Hz): F1=90, F2=110, F3=170, F4=250, F5=300

These are the "normal bandwidth" values referenced in the lead description. They provide a standard set for synthesizing British English vowels.

### Synthesis Parameters

- Klatt (1980) cascade formant synthesizer
- 10,000 samples/s, 12-bit amplitude quantization
- Onsets and offsets shaped by halves of a 10.7-ms Kaiser window
- f0 = 100 Hz base for first set; other sets at f0 differences of 0.25, 0.5, 1, 2, and 4 semitones (Table II)
- Stimuli durations: 51.2 ms and 200 ms
- Double vowels created by mixing analog waveforms of pairs of single vowels
- Presentation level: average of 53 dB(A), SD ~5 dB

## Auditory Model Architecture

Four-stage computational model:

### Stage 1: Peripheral Auditory Analysis

**Filter bank:**
- 256 linear, overlapping bandpass filters
- Spaced evenly on ERB-rate scale (Moore & Glasberg, 1983a)
- Range: 0-30 ERBs (0-6.2 kHz), Eq. (5) from Moore & Glasberg
- Amplitude responses defined by Roex(p) function (Patterson & Moore, 1986, Eq. (8))
- Bandwidths varied with CF per Moore & Glasberg (1983a, Eq. (3))
- Most sensitive region: 30-40 dB
- Implemented with 1024-point minimum-phase impulse responses (Rabiner & Gold, 1975; Quatieri & Tribolet, 1979)
- Sampling rate: 10 kHz
- Ringing response: 251.2 ms per channel (200-ms stimuli), 102.4 ms (51.2-ms stimuli)

**Absolute sensitivity variation:**
- Analytic expression from Moore & Glasberg (1987, Eq. (12)) to modify filter amplitude responses

**Compressive nonlinearity (nonlinear versions):**
- Meddis (1986, 1988) hair-cell simulation
- Simulates saturating, compressive nonlinearity
- Limited dynamic range (~40 dB) matching primary auditory nerve fibers
- Parameters from "new values" in Table I of Meddis (1988): low-threshold fiber, high spontaneous rate

### Stage 2: Pitch Determination

**Place models:**
- Modified Duifhuis-Willems-Sluyter (MDWS) pitch extractor (Scheffers, 1983a,b)
- Uses harmonic sieves: bar with narrow slots spaced at frequencies of harmonics of candidate f0
- Candidate f0's: 50-250 Hz in steps of 3%
- Each sieve has 12 slots centered on lowest 12 harmonics
- Slots extend 3% above and 3% below center frequency
- Quality score Q_s computed based on accepted/rejected/shared peaks between two sieves

**Place-time models:**
- Pool ACFs across all 256 channels
- f0-related periodicities reinforced, CF-related periodicities diffused
- Peak-picking on pooled ACF, search range: 4-20 ms (f0's of 50-250 Hz)
- Most intense peak -> f0_1, second most intense -> f0_2
- Additional constraints in Appendix A for rejecting spurious estimates

### Stage 3: Source Segregation

**Place models:**
- Sample excitation pattern at harmonic frequencies of each f0
- Generate "target" and "reference" patterns
- Comparison yields segregated spectral patterns

**Place-time models:**
- Determine synchrony to each fundamental in each channel
- Sample ACF at delays corresponding to period of each fundamental
- Linear interpolation for sub-sample precision
- Generate synchrony spectra for each f0

### Stage 4: Vowel Classification

- Template matching using PEAK spectral-distance metric (Assmann & Summerfield, 1989)
- Three steps: (1) locate peaks in spectrum envelope, (2) estimate candidate formant frequencies, (3) compare with five reference patterns
- Reference patterns built from median formant frequencies of six tokens per vowel
- Spectral-distance formula with formant weights: 2.2115 (F1), 1.7915 (F2), 1.2070 (F3)
- Probability of response = product of individual vowel probabilities (Appendix C)

## Key Results

1. **Nonlinear place-time model** performed best overall:
   - Closest to predicting listeners' identification accuracy (~62% for 200-ms, ~50% for 51.2-ms when both constituents correct)
   - Best at estimating f0's of double vowels
   - Best at predicting pattern of correct identifications AND confusions (Table III: r = 0.75 for 200-ms with true f0's)

2. **Performance by f0 difference:**
   - Human performance improved ~18% when f0 difference introduced
   - Maximum ~62% correct for f0 differences of 1-2 semitones
   - All models showed improvement with f0 difference but underestimated the improvement

3. **Pitch estimation accuracy:**
   - Place-time models more accurate than place models
   - Nonlinear version better than linear (compressive nonlinearity helps)
   - Mean absolute errors: ~2-5 Hz for single vowels, ~5-15 Hz for double vowels

## Implementation Details for Klatt Synthesizer

The stimuli were generated using the Klatt (1980) cascade formant synthesizer, which is directly relevant to the Qlatt project. Key implementation details:

- Standard cascade configuration with 5 formants
- Fixed bandwidths across all vowels (not varied per vowel)
- F4 and F5 fixed at 3350 and 3850 Hz for all vowels (common higher-formant values)
- Kaiser window for onset/offset shaping (10.7 ms)

## Relevance to Qlatt

**Moderate relevance.** The paper is primarily about auditory perception models rather than synthesis, but it provides:

1. A complete set of British English vowel formant frequencies and bandwidths (Table I) that could serve as a reference inventory
2. Validation that the Klatt cascade synthesizer produces perceptually adequate vowels for identification experiments
3. The synthesis parameters (sampling rate, quantization, windowing) serve as a reference configuration
4. The bandwidth values (F1=90, F2=110, F3=170, F4=250, F5=300 Hz) at 3-dB are a useful cross-reference for formant bandwidth settings
