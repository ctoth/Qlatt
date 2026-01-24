# Glottal Characteristics of Female Speakers

**Author:** Helen M. Hanson
**Year:** 1995
**Venue:** PhD Thesis, Harvard University
**Adviser:** Kenneth N. Stevens

## One-Sentence Summary

This thesis provides quantitative acoustic measures (H1*-A3* spectral tilt, H1*-A1 F1 bandwidth proxy, and aspiration noise) that can be directly mapped to Klatt synthesizer parameters (TL, B1, AH) for synthesizing natural female voice quality, with spectral tilt being the most perceptually important parameter.

## Problem Addressed

Female speakers exhibit incomplete glottal closure more frequently than males (due to anatomical differences), leading to breathier voice qualities that require specific parameterization in speech synthesizers. Previous work lacked systematic acoustic measures that could be extracted from simple microphone recordings and mapped to synthesizer parameters for natural-sounding female voice synthesis.

## Key Contributions

- Developed acoustic measures (H1*-H2*, H1*-A1, H1*-A3*, noise ratings) extractable from speech spectra without inverse filtering
- Identified two distinct groups of female speakers based on glottal configuration (abrupt vs. non-simultaneous closure)
- Validated acoustic measures against physiological data (oral airflow, fiberscopy)
- Demonstrated spectral tilt (TL) is the most important parameter for perceived breathiness (more than OQ)
- Provided correction equations for F1/F2 influence on spectral measurements
- Established quantitative mappings between acoustic measures and KLSYN88 synthesizer parameters

## Thesis Structure

1. **Chapter 1: Introduction** - Overview of speaker individuality sources
2. **Chapter 2: Background** - Vocal fold anatomy, glottal waveform parameters, measurement methods, related work
3. **Chapter 3: Acoustic Measures** - Theory of incomplete closure effects, measurement methods, 22 female speaker study
4. **Chapter 4: Physiological Measures** - Oral airflow and fiberscopy validation on subset of speakers
5. **Chapter 5: Perception Tests** - Breathiness ratings and synthesis matching experiments
6. **Chapter 6: Summary** - Conclusions and future work
7. **Appendix A: Spectral Corrections** - Equations for correcting H1, H2, A3 measurements

## Key Equations

### Glottal Waveform Parameters

**Speed Quotient:**
$$SQ = \frac{t_1}{t_2}$$
- $t_1$ = rise time (flow onset to peak)
- $t_2$ = fall time (peak to closure)
- Female range: 1.6-3.2

**Open Quotient:**
$$OQ = \frac{t_1 + t_2}{T}$$
- $T$ = pitch period
- Female range: 42-60%

### Spectral Corrections (Appendix A)

**Correction for F1 effect on H1 and H2 (subtract from raw measurement):**
$$\text{Correction} = 20\log_{10}\frac{F_1^2}{F_1^2 - f^2}$$
- $f = F_0$ for H1
- $f = 2F_0$ for H2

**Correction for F1 and F2 effect on A3 (add to raw measurement):**
$$\text{Correction} = 20\log_{10}\left(\frac{\left[1 - \left(\frac{F_3}{\bar{F_1}}\right)^2\right]\left[1 - \left(\frac{F_3}{\bar{F_2}}\right)^2\right]}{\left[1 - \left(\frac{F_3}{F_1}\right)^2\right]\left[1 - \left(\frac{F_3}{F_2}\right)^2\right]}\right)$$
- $\bar{F_1}$, $\bar{F_2}$ = neutral reference formants (555 Hz, 1665 Hz for females)

### F1 Bandwidth from Waveform Decay

$$B_1 = \frac{1}{\pi} \frac{\ln(X_1/X_2)}{\frac{1}{2}(T_1+T_2)}$$
- $X_1$, $X_2$ = peak-to-peak oscillation amplitudes
- $T_1$, $T_2$ = time between maximum and minimum amplitudes

### Spectral Slope Breakpoint Frequency

$$f_T = \frac{1}{2\pi T} = \frac{1}{\pi T_D}$$
- $T$ = time constant of exponential closure
- $T_D$ = time from anterior closure initiation to posterior end
- Above $f_T$, spectrum increases by 12 dB/octave additional tilt

### Glottal Chink Contribution to B1

$$B_g = \frac{\rho c^2}{\pi A_v \ell_v R_{ch}(1 + \frac{4\pi^2 f^2 M_{ch}^2}{R_{ch}^2})}$$
- $\rho$ = air density
- $R_{ch} = \sqrt{2P_s\rho}/A_{ch}$ = glottal resistance
- $A_{ch}$ = chink area

### AC/MFDR Ratio Correlation

$$20\log_{10}(\text{AC flow}/\text{MFDR}) \propto H1^* - A1$$

This validates that H1*-A1 estimates glottal characteristics from the spectrum.

## Parameters

### Acoustic Measures from 22 Female Speakers

| Measure | Symbol | Mean | Range | Units | Notes |
|---------|--------|------|-------|-------|-------|
| First two harmonics | H1*-H2* | 3.1 | -2.6 to 6.9 | dB | Correlates with OQ |
| F1 prominence | H1*-A1 | -4.3 | -12.4 to 3.9 | dB | Correlates with B1 |
| Spectral tilt | H1*-A3* | 22.8 | 8.6 to 35.0 | dB | Best breathiness predictor |
| F1 bandwidth | B1 | 165 | 53 to 280 | Hz | Wide range for females |
| Noise rating | Ns | 2.1 | 1 to 4 | scale | Higher = more noise |

### Aerodynamic Measures (4 Speakers)

| Parameter | Symbol | Range | Units | Notes |
|-----------|--------|-------|-------|-------|
| Sound pressure level | SPL | 77-88 | dB | Higher in carrier phrases |
| Intraoral pressure | P | 5.5-10.3 | cm H2O | |
| DC flow | DC | 62-130 | cm^3/sec | Higher in Group 2 |
| AC flow | AC | 147-338 | cm^3/sec | |
| Open quotient | OQ | 42-60 | % | |
| Speed quotient | SQ | 1.6-3.2 | - | |
| MFDR | MFDR | 191-676 | l/sec^2 | Correlates with SPL |
| F0 | F0 | 178-262 | Hz | Female typical |

### Glottal Chink Effects (Table 3.1, Complete)

| A_ch (cm²) | B_g (Hz) | B1 (Hz) | 20log₁₀(B1) (dB) | U_ch (cm³/s) | T (ms) | Tilt (dB) |
|------------|----------|---------|------------------|--------------|--------|-----------|
| 0.00 | 0 | 50 | 34 | 0 | 0 | 0 |
| 0.01 | 25 | 75 | 38 | 31 | 0.13 | 7 |
| 0.02 | 50 | 100 | 40 | 62 | 0.16 | 9 |
| 0.03 | 76 | 126 | 42 | 93 | 0.20 | 11 |
| 0.04 | 101 | 151 | 44 | 124 | 0.23 | 12 |
| 0.05 | 126 | 176 | 45 | 155 | 0.27 | 13 |
| 0.06 | 151 | 201 | 46 | 186 | 0.30 | 14 |
| 0.07 | 176 | 226 | 47 | 217 | 0.33 | 15 |
| 0.08 | 202 | 252 | 48 | 249 | 0.37 | 16 |
| 0.09 | 227 | 277 | 49 | 280 | 0.40 | 17 |
| 0.10 | 252 | 302 | 50 | 311 | 0.43 | 18 |

*Assumes: vocal tract losses contribute 50 Hz to B1, subglottal pressure 5500 dynes/cm²*

- **A_ch** = glottal chink area
- **B_g** = bandwidth contribution from glottal opening
- **B1** = total first-formant bandwidth (B_g + 50 Hz vocal tract losses)
- **U_ch** = DC flow through chink
- **T** = time constant of exponential decay after fold closure
- **Tilt** = additional spectral tilt at F3 (2750 Hz) relative to complete closure

## Measurement Procedures (for Speech Analysis)

### Measuring F1 Bandwidth from Waveform Decay

1. Bandpass filter waveform with 600 Hz bandwidth centered at F1 frequency
2. Identify first two oscillations during initial (closed) part of glottal cycle
3. Measure peak-to-peak amplitudes X1, X2 and periods T1, T2
4. Apply equation: $B_1 = \frac{1}{\pi} \frac{\ln(X_1/X_2)}{\frac{1}{2}(T_1+T_2)}$
5. Average across 8 consecutive pitch periods
6. Average 40 estimates per speaker for each vowel

### Measuring H1* - H2* (Open Quotient Indicator)

1. Center 22.3 ms Hamming window during initial part of glottal cycle (where F1 bandwidth estimated)
2. Take 8 measurements per vowel token for /æ/
3. Take 3 measurements at midvowel (20 ms apart) for /ʌ/ and /ɛ/
4. Correct H1 and H2 for first-formant boosting (Appendix A equations):
   - Correction = $20\log_{10}\frac{F_1^2}{F_1^2 - f^2}$ where f = F0 for H1, f = 2F0 for H2
5. Compute H1* - H2* = (H1 - correction₁) - (H2 - correction₂)
6. Average values for each repetition, then compute mean per speaker

### Measuring H1* - A3* (Spectral Tilt)

1. Estimate A3 using strongest harmonic near F3 peak
2. Correct H1 for F1 influence (subtract correction from raw H1)
3. Correct A3 for F1 and F2 influence (add correction to raw A3):
   - Correction = $20\log_{10}\left(\frac{[1 - (F_3/\bar{F_1})^2][1 - (F_3/\bar{F_2})^2]}{[1 - (F_3/F_1)^2][1 - (F_3/F_2)^2]}\right)$
   - Reference formants: $\bar{F_1}$ = 555 Hz, $\bar{F_2}$ = 1665 Hz (female averages)
4. Apply F3 bandwidth corrections: +4 dB for /æ/, +3 dB for /ɛ/ (based on male B3 data)
5. Compute H1* - A3*

### Noise Rating Procedure

1. Bandpass filter vowels around F3 (600 Hz bandwidth)
2. Two judges independently rate noise on scale 1-4:
   - 1 = no evidence of noise interference
   - 2 = slight noise visible
   - 3 = moderate noise, periodicity still visible
   - 4 = little evidence of periodicity
3. Rate from both waveforms and spectra
4. Average waveform and spectra ratings (correlation r > 0.92)

### Harmonics-to-Noise Ratio (HNR) Calculation

1. Calculate spectrum with 22.3 ms Hamming window (bandwidth ~90 Hz)
2. Measure level of harmonic with greatest amplitude in F3 region (~3 kHz)
3. Measure aspiration noise level in 50-Hz band at same frequency
4. HNR = harmonic level - noise level (in dB)
5. Perceptual reference: HNR of 8 dB = just-noticeable breathiness threshold

## Implementation for Klatt Synthesizer

### Voice Quality Control Parameters

The four key KLSYN88 parameters for female voice quality control:

| Parameter | KLSYN88 | Female Range | Perceptual Importance |
|-----------|---------|--------------|----------------------|
| Spectral tilt | TL | 0-25 dB | **Highest** - best breathiness predictor |
| F1 bandwidth | B1 | 60-280 Hz | Moderate |
| Aspiration noise | AH | 32-50 dB | Moderate |
| Open quotient | OQ | 57-70% | **Low** - poor perceptual predictor |

**Critical finding:** TL (spectral tilt) is far more perceptually important than OQ (open quotient) for voice quality, despite OQ being commonly emphasized in voice source literature.

### Group 1 vs Group 2 Speakers

| Characteristic | Group 1 (Modal) | Group 2 (Breathy) |
|----------------|-----------------|-------------------|
| Glottal closure | Abrupt, complete | Non-simultaneous, incomplete |
| Posterior opening | Small/none at arytenoids | Extends into membranous folds |
| H1*-A3* | <= 23 dB | > 23 dB |
| B1 | 53-100 Hz | 150-280 Hz |
| DC flow | Lower | Higher (62-130 cm^3/s) |
| Noise rating | Low (1-2) | Higher (3-4) |
| Perceived quality | Pressed/modal | Breathy |
| Breathiness rating | Mean 2.2 | Mean 4.4 (scale 0-7) |

### Mapping Acoustic Measures to Synth Parameters

| Acoustic Measure | Maps To | Method |
|------------------|---------|--------|
| H1*-H2* | OQ | Increase OQ until synth H1*-H2* matches target |
| H1*-A1 | B1 | Set B1 to achieve target H1*-A1 |
| H1*-A3* | TL (+ OQ) | Adjust TL until high-freq spectrum matches |
| Noise rating (Ns) | AH | Set aspiration so HNR at 3kHz matches |

**Perceptual correlations with breathiness ratings:**
- H1*-A1: r = 0.74 (strongest)
- Noise (Ns): r = 0.75
- H1*-A3*: r = 0.69
- B1: r = 0.50
- H1*-H2*: r = 0.25 (weak)

### Recommended Parameter Sets

**KLSYN88 Parameter Sets G1-G6 (Table 5.2):**

| Set | Voice Quality | OQ (%) | TL (dB) | B1 (Hz) | AH (dB) |
|-----|---------------|--------|---------|---------|---------|
| G1 | Most pressed | 57 | 0 | 60 | 35 |
| G2 | Pressed | 60 | 5 | 80 | 38 |
| G3 | Neutral | 63 | 10 | 110 | 42 |
| G4 | Slightly breathy | 65 | 15 | 140 | 45 |
| G5 | Breathy | 68 | 20 | 170 | 47 |
| G6 | Most breathy | 70 | 25 | 200 | 48 |

**Example synthesis parameters for specific speakers (Table 5.3):**

| Speaker | Word | OQ (%) | TL (dB) | B1 (Hz) | AH (dB) |
|---------|------|--------|---------|---------|---------|
| F9 (G1) | bud | 60 | 8 | 104 | 38 |
| F13 (G1) | bud | 63 | 10 | 91 | 39 |
| F2 (G2) | bud | 62 | 19 | 256 | 44 |
| F15 (G2) | bud | 64 | 17 | 208 | 50 |

### Synthesis Algorithm

1. Measure H1*-H2*, H1*-A1, H1*-A3* from target speech
2. Apply spectral corrections (Appendix A equations)
3. Set B1 to match H1*-A1
4. Adjust OQ until synthesized H1*-H2* and H1*-A3* match (within 0.5 dB)
5. Adjust TL for high-frequency rolloff
6. Set AH to match noise rating (HNR of 8 dB is threshold for perceptible breathiness)

## Key Figures

| Figure | Page | Description |
|--------|------|-------------|
| 2.2 | 24 | Glottal waveform showing vibratory cycle phases |
| 2.3 | 26 | Glottal configurations during closed phase (chink variations) |
| 2.4 | 27 | KLSYN88 glottal waveform with DC, AC, MFDR, t1, t2, T labeled |
| 3.1 | 39 | Effect of OQ and TL on spectrum (OQ=30/70%, TL=0/15dB) |
| 3.4 | 46 | Narrow (60 Hz) vs wide (275 Hz) B1 bandwidth spectra |
| 3.8 | 54 | Two speakers with H1-A3 of 6 dB vs 23 dB |
| 3.9 | 56 | Periodic vs noise source spectra for modal and breathy |
| 3.12 | 73 | Scatterplot showing Group 1 vs Group 2 separation |
| 4.1 | 82 | Schematic of glottal waveform parameters |
| 4.6 | 100 | Schematic of 4 speakers' glottal configurations |
| 5.5-5.6 | 117-118 | Synthesis test results showing TL as best predictor |

## Limitations

- **22 female speakers only** - Results may not generalize to all female voice types
- **Static measurements** - Measured at vowel midpoint; doesn't capture consonant-vowel transitions
- **Limited phonetic context** - Only /ae/, /epsilon/, /lambda/ vowels in carrier phrases
- **Rothenberg mask limitations** - Flat response only up to 1200 Hz; higher frequencies filtered
- **B1 measurement difficulty** - Waveform-based method requires careful windowing during closed glottal phase
- **No male comparison** - Male speaker parameters need separate study
- **Simplified turbulence model** - Noise amplitude relationship to glottal area is approximate

## Relevance to Qlatt Project

### Immediate Applications

1. **Female voice synthesis preset:**
   - Default to higher TL (10-20 dB) and B1 (100-200 Hz) for female voices
   - Include AH (aspiration noise) for natural breathiness

2. **Voice quality parameter implementation:**
   - Prioritize TL parameter control over OQ for perceptual voice quality
   - Current Klatt implementations often emphasize OQ; this is perceptually less important

3. **Parameter ranges for tts-frontend-rules.js:**
   ```javascript
   // Female voice quality presets
   femaleModal: { OQ: 60, TL: 8, B1: 100, AH: 38 },
   femaleBreathy: { OQ: 65, TL: 20, B1: 180, AH: 47 }
   ```

4. **B1 coupling to voice quality:**
   - B1 should covary with TL for natural voice - both increase with breathiness
   - Table 3.1 provides quantitative relationship

5. **Aspiration noise threshold:**
   - HNR of 8 dB at F3 frequency = just-noticeable breathiness
   - Below 8 dB HNR = clearly breathy voice

### Implementation Checklist

- [ ] Verify TL parameter affects spectral tilt correctly in klatt.js
- [ ] Check B1 parameter range allows 53-280 Hz for females
- [ ] Ensure AH (aspiration) can be set to produce HNR down to -10 dB
- [ ] Consider spectral correction equations for voice analysis tools
- [ ] Add female voice presets based on Table 5.2 parameter sets

## Open Questions

- [ ] How do dynamic TL/B1 trajectories during vowels affect naturalness?
- [ ] What are corresponding male parameter ranges?
- [ ] How should parameters change at consonant boundaries (especially voiceless stops)?
- [ ] Does Klatt 80 TL parameter have same definition as KLSYN88?
- [ ] Are correction equations necessary when comparing synthesized vs. natural spectra?

## Related Work Worth Reading

**Voice Quality and Synthesis:**
- Klatt & Klatt (1990) - "Analysis, synthesis, and perception of voice quality variations" - Primary reference for KLSYN88
- Karlsson (1991a,b) - "Female voices in speech synthesis" - Swedish female voice study

**Glottal Models:**
- Fant et al. (1985, 1994) - LF glottal model, four-parameter glottal waveform
- Titze (1989b) - "Four-parameter model of glottis and vocal fold contact area"

**Acoustic Theory:**
- Fant (1960) - "Acoustic theory of speech production"
- Stevens & Hanson (1995) - "Classification of glottal vibration from acoustic measurements"

**Physiological Studies:**
- Holmberg et al. (1988) - Aerodynamic measures of male and female voice
- Sodersten & Lindestad (1990) - Glottal closure patterns in females

**Measurement Methods:**
- Rothenberg (1973, 1977) - Oral airflow measurement techniques
- Fujimura & Lindqvist (1971) - F1 bandwidth measurements
