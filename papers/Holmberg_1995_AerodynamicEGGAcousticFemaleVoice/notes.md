---
title: "Implementation Notes: Holmberg et al. 1995"
year: 1995
---

# Implementation Notes: Holmberg et al. 1995

## Overview

Normative data on aerodynamic, EGG, and acoustic spectral measures for 20 normal female speakers (ages 20-43, mean 27.5). Two speech tasks: repeated /pae/ syllables and sustained /ae/. Two loudness conditions: comfortable (C) and loud (L, ~6 dB above comfortable).

## Key Measures Defined

### Glottal Airflow Waveform Measures
- **AC flow** (l/sec): modulated portion of glottal airflow, reflecting magnitude of vocal fold oscillation
- **DC flow** (l/sec): unmodulated (mean) airflow
- **Flow-adduction quotient (LAQ-F)**: closed time/T from glottal waveform at 30% criterion (previously 25%)
- **Maximum flow declination rate (MFDR)** (l/sec/sec): maximum negative peak of first derivative of glottal airflow; indirect measure of vocal fold closing velocity

### EGG Measure
- **EGG-adduction quotient (LAQ-E)**: closed time/T from EGG signal at 65% criterion (previously 75%)

### Acoustic Spectral Measures
- **H1-H2** (dB): amplitude difference between first two harmonics; reflects degree of sinusoidal shape / glottal adduction
- **H1-F1** (dB): amplitude difference between first harmonic and peak harmonic in F1 region (corrected for F1 influence, see below)
- **H1-F3** (dB): amplitude difference between first harmonic and peak spectral component (harmonic or noise) in F3 region
- **F1-F3** (dB): amplitude difference between peak in F1 and peak in F3

### H1 Correction Formula (footnote 3, K. N. Stevens personal communication)
Correction for influence of F1 on measured H1 and H2 amplitudes:
```
AH1_corrected = AH1 - (20 * log10(1/(1 - (FrH1/FrF1)^2)))
AH2_corrected = AH2 - (20 * log10(1/(1 - (FrH2/FrF1)^2)))
```
Where:
- AH1, AH2 = amplitude of first and second harmonics (dB)
- FrH1, FrH2 = frequency of first and second harmonics (Hz)
- FrF1 = frequency of first formant (Hz)

This correction removes the boosting effect of F1 resonance on harmonics near it.

## F3 Spectral Content Classification

Three qualitative categories for energy in the F3 region:
1. **Harmonics**: predominantly harmonic energy (clear, well-defined peaks)
2. **Noise**: predominantly noise energy (diffuse spectral energy)
3. **Mix**: mixture of harmonic and noise energy

Distribution (Table 4, N=20 speakers, 240 tokens per condition):

| F3 Content | Comfortable | Loud | Total |
|---|---|---|---|
| Harmonic | 34 | 144 | 178 |
| Noise | 84 | 28 | 112 |
| Mix | 122 | 68 | 190 |

**Key finding**: In comfortable voice, F3 region is predominantly noise or mixed. In loud voice, it shifts to predominantly harmonic. This reflects increased vocal fold adduction and more abrupt closure in loud voice.

## Normative Female Voice Parameters (Appendix)

Mean (M) and standard deviation (SD) for vowel in /pae/ and sustained /ae/, comfortable (C) and loud (L).

### Acoustic Measures

| Parameter | /pae/ C (M, SD) | /pae/ L (M, SD) | /ae/ C (M, SD) | /ae/ L (M, SD) |
|---|---|---|---|---|
| SPL (dB) | 74.5, 3.5 | 83.1, 3.9 | 73.2, 3.7 | 82.3, 4.0 |
| H1-H2 (dB) | 6.6, 3.8 | 2.4, 3.5 | 7.7, 4.3 | 2.9, 3.9 |
| H1-F1 (dB) | -4.0, 7.7 | -11.7, 6.2 | -2.2, 7.4 | -12.0, 6.1 |
| H1-F3 (dB) | 21.0, 7.9 | 12.3, 8.4 | 22.0, 8.0 | 12.6, 8.9 |
| F1-F3 (dB) | 25.0, 5.6 | 24.0, 5.1 | 24.3, 6.0 | 24.6, 5.8 |

### Glottal Airflow Measures

| Parameter | /pae/ C (M, SD) | /pae/ L (M, SD) | /ae/ C (M, SD) | /ae/ L (M, SD) |
|---|---|---|---|---|
| AC flow (l/sec) | 0.147, 0.045 | 0.213, 0.058 | 0.140, 0.033 | 0.198, 0.049 |
| DC flow (l/sec) | 0.097, 0.042 | 0.081, 0.039 | 0.087, 0.045 | 0.070, 0.030 |
| MFDR (l/sec/sec) | 190.8, 75.8 | 421.4, 140.9 | 171.8, 70.9 | 372.0, 139.5 |
| Adduction quot. flow | 0.50, 0.06 | 0.59, 0.07 | 0.48, 0.07 | 0.59, 0.08 |
| Adduction quot. EGG | 0.46, 0.07 | 0.46, 0.07 | 0.48, 0.06 | 0.49, 0.07 |
| Pressure (cm H2O) | 5.5, 1.1 | 8.3, 1.9 | N/A | N/A |

## Key Correlations (Table 2, group data)

Flow-adduction quotient (LAQ-F) correlations with spectral measures (pooled /ae/ and /pae/, comfortable + loud):
- H1-H2: r = -0.69 (strong negative)
- H1-F1: r = -0.36
- H1-F3: r = -0.28
- F1-F3: NS (not significant)
- SPL: r = -0.25 (marginal)

EGG-adduction quotient (LAQ-E) correlations:
- H1-H2: r = -0.46 (moderate negative)
- H1-F1: r = -0.15
- H1-F3: NS
- SPL: NS

DC flow (LDCFL) correlations:
- H1-H2: r = 0.23
- All others: NS or weak

SPL correlations:
- H1-H2: r = -0.49
- H1-F1: r = -0.39
- H1-F3: r = -0.32
- F1-F3: NS

## Key Relationships for Synthesis

### Adduction quotient vs H1-H2
- Strong negative correlation (r = -0.69 group, r > 0.70 for 15/20 individuals)
- Higher adduction (more closed time) -> lower H1-H2 (steeper spectral tilt toward H2)
- **H1-H2 can substitute for adduction quotient** when glottal waveform is unavailable
- 30% level criterion on flow waveform is sensitive enough to separate gradual vs abrupt closure

### Comfortable vs loud voice parameter shifts (female)
- SPL increases ~8.5 dB
- H1-H2 decreases by ~4-5 dB (more abrupt closure)
- H1-F1 decreases by ~8-10 dB
- H1-F3 decreases by ~9-10 dB
- AC flow increases ~45%
- DC flow decreases slightly
- MFDR more than doubles
- Flow-adduction quotient increases from ~0.50 to ~0.59
- F3 region shifts from noise/mixed to predominantly harmonic

### F1-F3 as complement to flow measures
- F1-F3 correlates with flow-adduction quotient for tokens with F3 noise (r = 0.42, p < 0.001)
- F1-F3 captures abrupt closure information that may be lost in glottal waveform due to low-pass filtering at 1100 Hz
- Useful complement to MFDR, especially for voices with high closing velocities

### Glottal configuration model (from Stevens 1977, Figure 2)
Three configurations with distinct spectral and flow signatures:
1. **Neutral position (a)**: abrupt closure, sharp waveform corners, strong high-frequency energy, steep spectral slope
2. **Spread arytenoids (b)**: gradual closure, sinusoidal waveform, relatively high H1, shallow spectral slope, breathy quality
3. **Constricted glottis (c)**: very abrupt closure, sharp waveform, strong high-frequency energy

## Comparison with Previous Male Data

This paper is a companion to Holmberg et al. 1988 and 1989 (male speakers). The same measurement paradigm is used. Female-specific notes:
- Flow signal low-pass filtered at 1100 Hz (vs higher for males) due to face mask resonance near 1 kHz (Badin et al. 1990)
- EGG adduction quotient criterion changed to 65% (from 75%) due to waveform irregularities
- Flow adduction quotient criterion changed to 30% (from 25%) for same reason
- The inverse filtering center frequency was determined via LPC and DFT for each token

## Collection Cross-References

### Already in Collection
- `Klatt_1990_VoiceQualityVariations` — Klatt & Klatt 1990, analysis/synthesis/perception of voice quality (cited directly)
- `Hillenbrand_1994_AcousticCorrelatesBreathyVoice` — Hillenbrand et al. 1994, acoustic correlates of breathiness (cited)
- `Childers_Lee_1991_VoiceQualityFactors` — Childers & Lee 1991, voice quality factors (cited)
- `Holmberg_1988_GlottalAirflowPressure` — Holmberg et al. 1988, companion male speaker study (cited as foundation)
- `Hanson_1995_GlottalCharacteristicsFemale` — related female voice source work
- `Hanson_1997_GlottalCharacteristicsFemaleAcoustic` — related female voice acoustics

### Cited By (in Collection)
- `Hanson_1997_GlottalCharacteristicsFemaleAcoustic` — references Holmberg's female voice data
- `Hanson_1995_GlottalCharacteristicsFemale` — references Holmberg's normative female data
- `Hanson_1999_GlottalMaleSpeakers` — references Holmberg's methodology
- `Sundberg_2005_GlottalSourceLoudness` — cites Holmberg on loudness and glottal source
- `Herbst_2015_GlottalAdductionSubglottalPressure` — references adduction quotient data
- `Isshiki_1964_VoiceIntensityRegulation` — related through pressure-intensity relationships
- `Koenig_LaryngealFactors` — references Holmberg's female voice measures
- `Rothenberg_1975_ThreeParameterVoiceSource` — related source parameterization

### New Leads
- Stevens 1977 — Physics of laryngeal behavior (glottal configuration model, Figure 2 in this paper)
- Stevens & Hanson 1995 — Classification of glottal vibration from acoustic measurements
- Karlsson 1985 — Glottal waveforms for normal female speakers

### Conceptual Links (not citation-based)
- `Iseli_2007_VoiceSourceAgeSexVowel` — Voice source variations by age, sex, and vowel; complements Holmberg's female normative data
- `Gauffin_1989_SpectralCorrelatesGlottalVoice` — Spectral correlates of glottal voice source; provides spectral framework for Holmberg's H1-H2 findings
- `Fant_1997_VoiceSourceConnectedSpeech` — Voice source in connected speech extends the sustained vowel paradigm used here
