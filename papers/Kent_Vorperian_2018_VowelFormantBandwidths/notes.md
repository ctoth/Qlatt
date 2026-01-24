# Kent & Vorperian 2018 - Static Measurements of Vowel Formant Frequencies and Bandwidths: A Review

**Source:** Journal of Communication Disorders, 2018; 74: 74-97
**Focus:** Comprehensive review of vowel formant frequencies and bandwidths for American English across the lifespan

---

## Key Equations

### Vowel Space Area (VSA)
```
VSA = 0.5 × |F1i(F2æ - F2u) + F1æ(F2u - F2i) + F1u(F2i - F2æ)|
```
Where i = /i/, æ = /æ/, u = /u/ (corner vowels)

### Formant Centralization Ratio (FCR)
```
FCR = (F2u + F2æ + F1i + F1u) / (F2i + F1æ)
```
- Values > 1.0 indicate centralization
- Inverse of VAI

### Vowel Articulation Index (VAI)
```
VAI = (F2i + F1æ) / (F2u + F2æ + F1i + F1u)
```
- Values < 1.0 indicate centralization
- Inverse of FCR

### F2i/F2u Ratio
```
F2 ratio = F2i / F2u
```
- Simple measure of vowel contrast
- Larger values = greater differentiation

### Formant Bandwidth (Half-Power)
```
B = f2 - f1
```
Where f1, f2 are frequencies at -3 dB from peak amplitude

---

## Critical Parameters

### Adult Male Formant Frequencies (Hz) - Peterson & Barney 1952
| Vowel | F1    | F2    | F3    |
|-------|-------|-------|-------|
| /i/   | 270   | 2290  | 3010  |
| /ɪ/   | 390   | 1990  | 2550  |
| /ɛ/   | 530   | 1840  | 2480  |
| /æ/   | 660   | 1720  | 2410  |
| /ɑ/   | 730   | 1090  | 2440  |
| /ɔ/   | 570   | 840   | 2410  |
| /ʊ/   | 440   | 1020  | 2240  |
| /u/   | 300   | 870   | 2240  |
| /ʌ/   | 640   | 1190  | 2390  |
| /ɝ/   | 490   | 1350  | 1690  |

### Adult Female Formant Frequencies (Hz) - Peterson & Barney 1952
| Vowel | F1    | F2    | F3    |
|-------|-------|-------|-------|
| /i/   | 310   | 2790  | 3310  |
| /ɪ/   | 430   | 2480  | 3070  |
| /ɛ/   | 610   | 2330  | 2990  |
| /æ/   | 860   | 2050  | 2850  |
| /ɑ/   | 850   | 1220  | 2810  |
| /ɔ/   | 590   | 920   | 2710  |
| /ʊ/   | 470   | 1160  | 2680  |
| /u/   | 370   | 950   | 2670  |
| /ʌ/   | 760   | 1400  | 2780  |
| /ɝ/   | 500   | 1640  | 1960  |

### Sex-Based Scaling Factors
- Female F1 ≈ 1.17 × Male F1
- Female F2 ≈ 1.18 × Male F2
- Female F3 ≈ 1.14 × Male F3
- Non-uniform scaling (NOT constant multiplier)
- Higher formants show less sex difference

### Formant Bandwidths (Hz) - Typical Adult Values
| Formant | Male   | Female |
|---------|--------|--------|
| B1      | 50-80  | 60-100 |
| B2      | 70-120 | 80-140 |
| B3      | 100-180| 120-200|

Bandwidths increase with:
- Higher formant number
- Higher fundamental frequency (f0)
- Nasalization
- Increased vocal effort

---

## Implementation Notes

### Measurement Timing
**Steady-state target:**
- Center of vowel nucleus (temporal midpoint)
- Avoid transitions from/to consonants
- Minimum ~50ms from boundaries for reliable measurement

**Dynamic measurement:**
- 20%, 50%, 80% points through vowel
- Or onset, midpoint, offset
- Captures coarticulation effects

### Analysis Parameter Selection

**Window length:**
- Short window = better time resolution, worse frequency resolution
- Long window = better frequency resolution, worse time resolution
- Typical: 25-50ms for adults
- Shorter for children (higher f0): 10-25ms

**LPC order (number of poles):**
- Rule of thumb: (sampling rate / 1000) + 2
- For 10 kHz sampling: 12 poles
- For 16 kHz sampling: 18 poles
- Adjust for speaker: +2 for females, +4 for children
- Higher order may be needed for nasalized vowels

**Pre-emphasis:**
- +6 dB/octave high-frequency boost
- Compensates for natural spectral roll-off
- Improves high-frequency formant tracking

### Sources of Error

**F1-f0 proximity:**
- When F1 approaches f0, measurement becomes unreliable
- Critical for high vowels (/i/, /u/) in high-pitched speakers
- Children's /i/: F1 ≈ 350-400 Hz, f0 ≈ 300 Hz → problematic

**Nasalization:**
- Introduces nasal pole/zero pairs
- Widens bandwidths
- Can cause spurious formant peaks
- LPC may track nasal rather than oral formants

**High f0 (children, females):**
- Sparse harmonic spacing
- Formants between harmonics cannot be estimated
- Shorter analysis windows needed
- Higher LPC order may help

### Age-Related Changes

**Children → Adults:**
- F1, F2, F3 decrease with age (vocal tract lengthening)
- Most dramatic changes: birth to 3 years
- Sex differences emerge around age 11-12
- Formant frequencies stabilize around 15-18 years

**Adults → Elderly:**
- Formant frequencies may increase slightly in elderly males
- Increased variability in elderly speakers
- Possible increased nasality affects bandwidths

### Derived Metrics for Clinical Use

| Metric | Formula | Interpretation |
|--------|---------|----------------|
| VSA | Area of vowel polygon | Larger = better articulation |
| FCR | (F2u+F2æ+F1i+F1u)/(F2i+F1æ) | >1.0 = centralization |
| VAI | (F2i+F1æ)/(F2u+F2æ+F1i+F1u) | <1.0 = centralization |
| F2i/F2u | F2(/i/) / F2(/u/) | Larger = better front-back contrast |

**Clinical applications:**
- Dysarthria assessment
- Speech development tracking
- Accent/dialect characterization
- Hearing impairment effects

---

## Key Findings for Synthesizer Implementation

### Formant Target Ranges
For realistic synthesis, formant targets should fall within:
- F1: 250-850 Hz (vowel-dependent)
- F2: 850-2800 Hz (vowel-dependent)
- F3: 1700-3300 Hz (relatively stable)
- F4: 3000-4000 Hz (speaker-dependent)

### Bandwidth Scaling
- B1: ~50-80 Hz (increases with F1)
- B2: ~70-120 Hz
- B3: ~100-180 Hz
- Bandwidths wider for:
  - Higher fundamental frequency
  - Nasalized vowels
  - Female/child voices

### Coarticulation Considerations
- Formant transitions take 50-100ms
- Target undershoot common in connected speech
- Consonant context affects vowel formants significantly
- Locus equations describe C→V transitions

### Sex/Age Adaptation
For female voice synthesis:
- Scale all formants by ~1.15-1.20
- Use narrower F1 range (vowels more peripheral)
- Increase f0 to 180-220 Hz

For child voice synthesis:
- Scale formants by 1.2-1.5 depending on age
- Use higher f0 (250-350 Hz for young children)
- Increase bandwidths

---

## Tables of Interest

### Table 1: Adult Formant Data Sources
Lists 12 major studies from 1952-2009 with sample sizes, vowels measured, and analysis methods.
Key sources: Peterson & Barney (1952), Hillenbrand et al. (1995), Hagiwara (1997)

### Table 2: Formant Ranges by Sex
Comprehensive ranges for F1-F3 showing male/female differences and overlap zones.

### Table 3: Child Formant Development
Age-related formant data from infancy through adolescence.
Shows non-linear decrease with age, sex divergence at puberty.

### Table 4: Elderly Formant Data
Limited data showing increased variability and possible formant frequency changes.

### Table 5: Bandwidth Measurements
Sparse data - bandwidths less studied than frequencies.
Values highly dependent on measurement method and analysis parameters.

### Table 6: Derived Metrics
Formulas for VSA, FCR, VAI, and other clinical measures.
Includes normative ranges where available.

---

## Questions/Gaps

1. **Bandwidth variability:** Limited normative data for bandwidths across populations
2. **Dynamic formants:** Most data is static (midpoint) - limited transition data
3. **Connected speech:** Most studies use isolated words - running speech differs
4. **Dialect variation:** Data predominantly from "General American" - other dialects underrepresented
5. **Measurement reliability:** Inter-/intra-rater reliability data limited

---

## References of Interest

- **Peterson & Barney (1952)** - Classic vowel formant study, still widely cited
- **Hillenbrand et al. (1995)** - Modern replication with larger sample
- **Fant (1960)** - Acoustic Theory of Speech Production (formant theory)
- **Klatt (1980)** - Software for cascade/parallel formant synthesizer
- **Stevens (1998)** - Acoustic Phonetics (comprehensive reference)

---

## Implementation Checklist

- [ ] Verify formant targets against Peterson & Barney / Hillenbrand data
- [ ] Implement sex-based formant scaling (non-uniform)
- [ ] Add bandwidth parameters that scale with formant frequency
- [ ] Consider f0-dependent bandwidth adjustments for high-pitched voices
- [ ] Implement formant transition durations of 50-100ms
- [ ] Add derived metrics (VSA, FCR) for synthesis quality assessment
