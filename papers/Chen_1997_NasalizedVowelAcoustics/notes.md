# Acoustic Correlates of English and French Nasalized Vowels

**Authors:** Marilyn Y. Chen
**Year:** 1997
**Venue:** Journal of the Acoustical Society of America, Vol. 102(4), pp. 2360-2370
**DOI:** S0001-4966(97)02010-9

## One-Sentence Summary

Provides two acoustic measures (A1-P1 and A1-P0) for quantifying vowel nasalization based on spectral peak amplitudes, with measured values and vowel-type normalization equations directly applicable to Klatt synthesizer parameter setting.

## Problem Addressed

Objective acoustic quantification of vowel nasalization that is:
- Independent of subjective perception judgments
- Applicable across different vowel types
- Based only on microphone output (no invasive measurement)

## Key Contributions

1. **Two acoustic correlates for nasalization:**
   - A1-P1: Difference between first formant amplitude and nasal peak near 950 Hz
   - A1-P0: Difference between first formant amplitude and low-frequency nasal peak (250-450 Hz)

2. **Measured values** for English (phonetic nasalization) and French (phonemic nasalization)

3. **Vowel-type adjustment technique** to normalize measures across vowel types

4. **Theoretical predictions** from speech production models validated against measurements

## Methodology

### English Study
- 8 speakers (4 male, 4 female)
- Minimal pairs: nasal context (mean, men, man, moon, mom, mum) vs oral context (beeb, bed, bad, booed, bob, bud)
- Measured at beginning, middle, and end of vowels
- 30-ms Hamming window, 512-pt DFT

### French Study
- 8 speakers (3 male, 5 female)
- Nasal vowels /ẽ/, /ã/, /õ/, /œ̃/ preceded by stop consonants
- Compared least-nasalized (onset) vs most-nasalized (end) portions

## Key Equations

### Sinus Antiresonance Frequency (Helmholtz Resonator)

$$
f_{zs} = \frac{c}{2\pi} \sqrt{\frac{S_o}{V L_o}}
$$

Where:
- $c$ = speed of sound
- $S_o$ = cross-sectional area of ostium (cm²)
- $L_o$ = length of ostium (cm)
- $V$ = volume of paranasal cavity (cm³)

### Shape Factor (Bandwidth Contribution)

$$
S_f = \frac{S}{\sqrt{4\pi A}}
$$

Where:
- $S$ = cross-sectional perimeter
- $A$ = cross-sectional area

### Vowel-Type Adjustment for P0

Effect of F1 on P0:

$$
T1(F_{P0}) = \frac{(0.5B1)^2 + F1^2}{[((0.5B1)^2 + (F1-F_{P0})^2) \cdot ((0.5B1)^2 + (F1+F_{P0})^2)]^{1/2}}
$$

Effect of F2 on P0:

$$
T2(F_{P0}) = \frac{(0.5B2)^2 + F2^2}{[((0.5B2)^2 + (F2-F_{P0})^2) \cdot ((0.5B2)^2 + (F2+F_{P0})^2)]^{1/2}}
$$

Adjusted P0 = P0 - T1 - T2 (in dB)

## Parameters

### Nasal Peak Frequencies (English Nasalized Vowels)

| Vowel | F_P0 (Hz) | F1 (Hz) | F_P1 (Hz) | F2 (Hz) |
|-------|-----------|---------|-----------|---------|
| /i/   | ---       | 273     | 964       | 2529    |
| /u/   | 206       | 397     | 1032      | 1213    |
| /ε/   | 223       | 520     | 982       | 1895    |
| /ʌ/   | 223       | 627     | 938       | 1194    |
| /æ/   | 212       | 562     | 924       | 1903    |
| /ɑ/   | 217       | 655     | 953       | 1178    |
| **avg** | **216** | ---     | **966**   | ---     |

### French Nasal Vowel Frequencies (Most-Nasal Portion)

| Vowel | F_P0 (Hz) | F1 (Hz) | F_P1 (Hz) | F2 (Hz) |
|-------|-----------|---------|-----------|---------|
| /ẽ/   | 236       | 536     | 958       | 1302    |
| /ã/   | 256       | 555     | 883       | 1019    |
| /õ/   | 238       | 475     | 1029      | 828     |
| /œ̃/   | 216       | 481     | 874       | 1277    |
| **avg** | **237** | ---     | **936**   | ---     |

### Nasalization Differences (Oral vs Nasal)

**English Δ(A1-P1) for nonlow vowels:**

| Vowel | Mean (dB) | Min (dB) | Max (dB) |
|-------|-----------|----------|----------|
| /i/   | 15        | 5        | 23       |
| /u/   | 11        | 7        | 17       |
| /ε/   | 10        | 4        | 17       |
| /ʌ/   | 12        | 8        | 17       |

**English Δ(A1-P0) for nonhigh vowels:**

| Vowel | Mean (dB) | Min (dB) | Max (dB) |
|-------|-----------|----------|----------|
| /ε/   | 8         | 5        | 13       |
| /ʌ/   | 8         | 4        | 13       |
| /æ/   | 8         | 4        | 16       |
| /ɑ/   | 6         | 4        | 8        |

**French Δ(A1-P1):**

| Vowel | Mean (dB) | Min (dB) | Max (dB) |
|-------|-----------|----------|----------|
| /ẽ/   | 12        | 4        | 21       |
| /ã/   | 9         | -6       | 20       |
| /õ/   | 11        | 3        | 19       |
| /œ̃/   | 9         | -6       | 18       |

**French Δ(A1-P0):**

| Vowel | Mean (dB) | Min (dB) | Max (dB) |
|-------|-----------|----------|----------|
| /ẽ/   | 7         | 1        | 17       |
| /ã/   | 8         | 2        | 13       |
| /õ/   | 9         | 1        | 16       |
| /œ̃/   | 3         | -5       | 11       |

### Theoretical Predictions

| Parameter | Theoretical Change | Notes |
|-----------|-------------------|-------|
| A1 lowering | ~5 dB | Due to increased B1 from nasal tract losses |
| P1 raising | ~13 dB | For large v-p opening, /ɑ/ at 910 Hz pole |
| P0 raising | 3-6 dB | Due to sinus pole-zero pair |
| Δ(A1-P1) | ~18 dB | Total expected change |
| Δ(A1-P0) | 8-11 dB | Total expected change |

### Bandwidth Contributions from Nasal Tract

| Region | B1 Contribution (Hz) |
|--------|---------------------|
| Pharyngeal + oral | 60 |
| Posterior nasal | 15 |
| Middle nasal | 66 |
| Anterior nasal | 26 |
| **Total nasal addition** | **107** |

### Estimated F1 Bandwidth with Nasalization

| Condition | Male (Hz) | Female (Hz) | A1 Decrease |
|-----------|-----------|-------------|-------------|
| Oral /æ/  | 131       | 165         | ---         |
| Nasal /æ/ | 238       | 272         | 5.2 / 4.3 dB |

### Vocal Tract Dimensions (Fig. 1)

| Structure | Length (cm) | Area (cm²) | Circumference (cm) | Volume (cm³) |
|-----------|-------------|------------|-------------------|--------------|
| Nostrils  | 1.0         | 0.5        | ---               | ---          |
| Anterior nasal | 3.4    | 1.4        | 8.6               | ---          |
| Middle nasal | 4.4      | 2.4        | 20.2              | ---          |
| Posterior nasal | 3.9   | 2.0        | 5.8               | ---          |
| V-P opening | 2.0       | 0.8        | ---               | ---          |
| Pharynx   | 8.0         | 4.0        | 7.1               | ---          |
| Oral cavity | 8.0       | 4.0        | 7.1               | ---          |
| Sinus ostium | 0.4      | 0.02       | ---               | ---          |
| Maxillary sinus | ---   | ---        | ---               | 8.8          |

### Shape Factors (Nasal Tract)

| Region | Shape Factor S_f |
|--------|-----------------|
| Posterior nasal | 1 |
| Middle nasal | 4 |
| Anterior nasal | 2 |

## Implementation Details

### Measuring A1
- Amplitude of peak harmonic closest to expected F1

### Measuring P1
- Amplitude of highest peak harmonic around 950 Hz
- For oral vowels: use harmonic closest to P1 frequency in nasalized vowel

### Measuring P0
- Amplitude of harmonic with greatest amplitude at low frequencies
- Typically first or second harmonic (depends on F0)
- For high vowels (/i/), F1 may be too close to P0 for reliable measurement

### Analysis Parameters
- Window: 30-ms Hamming
- DFT: 512-pt
- Sampling: 10 kHz
- Low-pass filter: 4.8 kHz (7-pole elliptical)

### Which Measure to Use

| Vowel Height | Better Measure | Reason |
|--------------|---------------|--------|
| High (/i/, /u/) | A1-P1 | Low F1 interferes with P0 |
| Low (/æ/, /ɑ/) | A1-P0 | F1 close to P1 region |
| Mid (/ε/, /ʌ/) | Either | Both reliable |

## Figures of Interest

- **Fig. 1 (page 2361):** Average physical dimensions of vocal tract, nasal tract, and maxillary sinus
- **Fig. 2 (page 2365):** Spectra comparing oral /ε/ (bed) vs nasal /ε/ (men) with A1, P1, P0 labeled

## Results Summary

### English
- Mean Δ(A1-P1): 10-15 dB (oral vs nasal)
- Mean Δ(A1-P0): 6-8 dB (oral vs nasal)
- Adjustment reduces s.d. for A1-P1 from 10.5→1.5 dB (oral) and 8.2→3.9 dB (nasal)

### French
- Mean Δ(A1-P1): 9-12 dB (least-nasal vs most-nasal)
- Mean Δ(A1-P0): 3-9 dB (least-nasal vs most-nasal)
- Adjustment reduces s.d. for A1-P1 from 4.3→1.8 dB (least) and 3.7→1.8 dB (most)

### Statistical Significance
- A1-P1: Better for high vowels (6/8 speakers significant)
- A1-P0: Better for low vowels (8/8 speakers significant)
- Both significant for mid vowels

## Limitations

1. **Harmonic measurement approximation:** Peak amplitude approximated by nearest harmonic, varies with F0
2. **P0 difficult for /i/:** F1 too close to P0 frequency
3. **P1 difficult for /ɑ/ and /ʌ/:** F2 close to P1 frequency
4. **No sinus contribution modeled for individual speakers**
5. **Breathiness confound:** Increased OQ also raises first harmonic (P0), separate from nasalization

## Relevance to Project

### Direct Application to Klatt Synthesizer

1. **AN (nasal formant amplitude) setting:**
   - Corresponds to P1 prominence
   - Target: A1-P1 should decrease 10-15 dB for nasalized vowels
   - P1 frequency: ~950 Hz (use FNP around this value)

2. **AB (bypass path amplitude) relevance:**
   - Low-frequency energy (P0) partly controlled by AB
   - Target: A1-P0 should decrease 6-8 dB

3. **B1 (first formant bandwidth):**
   - Nasalization adds ~107 Hz to B1
   - Implement by increasing B1 during nasal vowels

4. **Coarticulation timing:**
   - No consistent trend across vowel for timing
   - Maximum nasalization at vowel end (stop-nasal context)
   - Minimum nasalization at vowel onset (after stop)

### Synthesis Parameter Guidance

For nasalized vowels compared to oral:
- **Increase AN** to create P1 prominence (by ~13 dB)
- **Decrease A1** or **increase B1** (by ~5 dB / ~107 Hz)
- **Consider AB** for low-frequency nasal pole (~300 Hz)
- **Adjust differently by vowel height:**
  - High vowels: Focus on AN/P1
  - Low vowels: Focus on AB/P0

## Open Questions

- [ ] How does OQ (open quotient) interact with nasalization measures?
- [ ] What are optimal FNP/FNZ settings for the Klatt synthesizer nasal pole-zero?
- [ ] How to model time course of nasalization through a vowel?
- [ ] Does the paper's vowel adjustment technique need implementation for synthesis?

## Related Work Worth Reading

- Klatt & Klatt (1990) - Voice quality variations, OQ effects on first harmonic
- Stevens (in press/1998) - Acoustic Phonetics (theoretical calculations referenced)
- Maeda (1982a, 1993) - Sinus cavity effects, French nasal vowels
- Hawkins & Stevens (1985) - Perceptual correlates of nasalization
- Dang & Honda (1995, 1996) - Paranasal sinus acoustics
- House & Stevens (1956) - Analog nasalization studies
