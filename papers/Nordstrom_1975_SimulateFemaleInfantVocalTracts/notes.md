---
title: "Nordstrom 1977 - Female and infant vocal tracts simulated from male area functions"
year: 1975
---

# Nordstrom 1977 - Female and infant vocal tracts simulated from male area functions

## Publication
- **Journal**: Journal of Phonetics, 5, 81-92
- **Author**: Per-Erik Nordstrom, Dept. of Phonetics, University of Stockholm
- **Received**: 1 July 1976
- **Note**: Published version of earlier QPSR report (Nordstrom 1975, STL-QPSR 2-3/1975, 20-33)

## Core Problem

How to transform male vocal tract area functions to simulate female and infant vocal tracts. Known anatomical differences (smaller pharyngeal cavity in women/children) must account for observed formant frequency differences.

## Key Finding

**Anatomical differences between men and women/children only explain part of the formant differences.** Uniform length scaling alone does not reproduce observed female formant patterns. Non-uniform scaling (different scale factors for mouth vs pharynx, and volume vs length) is needed but still does not fully account for the data. The vocal tract *form* (shape) likely varies between sexes, not just the size.

## Method

Uses Fant (1960) male Russian vowel area functions as input. A computer program (based on Pauli 1974, which is based on Heinz 1962) calculates formant frequencies from area function cross-sections.

### Two Scaling Experiments

**Experiment 1: Length scaling only**
- Reduces length of mouth and pharynx sections independently
- 9 scaling configurations tested (Table I)

**Experiment 2: Volume scaling (length + cross-sectional area)**
- Reduces both length AND cross-sectional area
- Cross-sectional area scale factors are the square of the length scale factors
- This models actual anatomical volume reduction

## Table I - Vocal Tract Scaling Factors

| Scaling no. | k_mouth | k_pharynx | Description |
|---|---|---|---|
| 1 | 1.00 | 1.00 | Male speaker (Fant 1960) |
| 2 | 0.95 | 0.65 | Arbitrary for 90% total length |
| 3 | 0.95 | 0.80 | Uniform enlargement of no. 8 to 87% total length (female VT; Chiba & Kajiyama 1941) |
| 4 | 0.85 | 0.77 | Female speaker from Eidson (cited by Fant 1966) |
| 5 | 0.88 | 0.73 | Uniform enlargement of no. 8 to 80% total length (boy tract; Chiba & Kajiyama 1941) |
| 6 | 0.90 | 0.70 | Arbitrary for 80% total length |
| 7 | 0.79 | 0.61 | Uniform scaling of no. 6 to 70% total length |
| 8 | 0.79 | 0.64 | Girl of eight (Chiba & Kajiyama 1941) |
| 9 | 0.70 | 0.70 | Uniform scaling to same total length as no. 8 |

- Non-uniform scalings (nos 2-8): mouth and pharynx sized relative to each other non-uniformly
- Uniform scaling (no. 9): both mouth and pharynx scaled by the same factor (0.70)
- The key comparison is no. 8 (actual girl data) vs no. 9 (uniform scaling to same length)

## Table II - Formant Frequencies for Scaling Configurations (Hz)

Key comparisons for Russian vowels, showing male (1), length scaling (8), volume scaling (8 volume), and uniform (9):

| Vowel | Male F1 | Male F2 | Male F3 | Length-8 F1 | Length-8 F2 | Length-8 F3 | Vol-8 F1 | Vol-8 F2 | Vol-8 F3 | Uniform-9 F1 | Uniform-9 F2 | Uniform-9 F3 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| [a] | 640 | 1082 | 2464 | 895 | 1512 | 3461 | 970 | 1498 | 3630 | 892 | 1501 | 3480 |
| [o] | 504 | 866 | 2388 | 700 | 1197 | 3224 | 759 | 1191 | 3275 | 700 | 1201 | 3393 |
| [u] | 237 | 600 | 2383 | 323 | 854 | 3343 | 352 | 847 | 3381 | 333 | 853 | 3403 |
| [i] | 289 | 1518 | 2412 | 412 | 1927 | 3597 | 482 | 1975 | 3507 | 410 | 2069 | 3437 |
| [i-bar] | 227 | 2275 | 3338 | 318 | 3338 | 4007 | 369 | 3202 | 4109 | 322 | 3241 | 4347 |
| [e] | 419 | 1967 | 2790 | 582 | 2761 | 3905 | 667 | 2702 | 4010 | 589 | 2774 | 3889 |
| [epsilon] | 515 | 1743 | 2636 | 710 | 2420 | 3757 | 806 | 2395 | 3873 | 719 | 2443 | 3703 |
| [ae] | 588 | 1477 | 2458 | 807 | 2070 | 3532 | 903 | 2051 | 3635 | 817 | 2066 | 3470 |

VT lengths: Male = 17-19.5 cm; Length-8 = 11.9 cm; Uniform-9 = 11.55-12.95 cm

## Key Quantitative Results

### Effect of non-uniform vs uniform length scaling
- For first experiment (length only): non-uniform scaling effect was **very small** -- F1, F2, F3 all close to uniform scaling line (Figures 3, 4, 5)
- The non-uniform scalings are virtually identical to uniform VT length scaling for all three formants

### Effect of volume scaling vs length scaling
- Volume scaling produces a **systematic F1 increase** compared to length scaling
- Average F1 increase from volume scaling: **11.8%** (Figure 9)
- F2 shifts are much smaller: only vowels [i] and [i-bar] show clear differences (-4.1% and +2.5%)
- F3 generally displaced positively, exception: [i] shows -2.5% shift

### Mouth/pharynx balance effect on F1
- F1 increase is directly related to mouth/pharynx balance
- Average F1 increase: **6.5%** for scaling no. 4 (lowest balance), **15.3%** for no. 6 (highest balance)

### Comparison with observed data (Figure 12)
- Female-to-male formant differences (k1, k2, k3 in %) plotted per vowel
- Interpolated values from Fant (1975a) compared with length scaling and volume scaling predictions
- Simulations show only partial agreement with observed differences
- For some vowels (especially [u], [a]) there is good correspondence
- For front vowels ([i], [e]) the match is poorer

## Implementation-Relevant Parameters for Synthesis

### Scaling approach for formant-based synthesis
For a Klatt-type formant synthesizer, the paper suggests these scaling strategies:

1. **Simple uniform frequency scaling** (baseline): Multiply all formant frequencies by a single factor inversely proportional to VT length ratio. For male-to-female: factor ~ 1.15-1.20 (VT length ratio ~ 0.83-0.87).

2. **Non-uniform scaling** (better): Different scale factors per formant:
   - F1 scaling should be **larger** than uniform (due to volume/cross-section reduction effect)
   - F1 female/male ratio: ~1.12-1.18 depending on vowel
   - F2 and F3: approximately equal to uniform length scaling (~1.15-1.20)

3. **Vowel-dependent correction**: The paper shows the scaling is NOT uniform across vowels. Front vowels and central vowels show different patterns from back vowels.

### Practical scaling factors (from Figure 12, interpolated)
Average female-to-male percentage differences (k values):
- k1 (F1): ~12-20% higher for females (vowel-dependent, highest for front vowels)
- k2 (F2): ~10-15% higher for females
- k3 (F3): ~10-15% higher for females

### VT length data used
- Adult male: 17.0-19.5 cm (Fant 1960 Russian vowels)
- Adult female: ~14.5 cm (estimated, ~83-87% of male)
- Girl (age 8): ~11.9 cm (Chiba & Kajiyama 1941)
- Boy: ~80% of male total length

## Limitations noted
1. Wall impedance losses not corrected for (Fant, Pauli: wall impedance correction would not significantly improve agreement)
2. Lip inductance not scaled with length (small systematic error)
3. Computer program limited to formants up to ~4000 Hz (F3 for some vowels had to be interpolated)
4. Area functions are step-wise approximations

## Key Citations
- Fant, G. (1960). *Acoustic Theory of Speech Production*. The Hague: Mouton. -- Source of male area functions
- Fant, G. (1966). Descriptive analysis of the acoustic aspects of speech. *Logos*, 5, 3-17.
- Fant, G. (1975a). Non-uniform vowel normalization. *STL-QPSR* 2-3/1975, 1-19.
- Fant, G. (1975b). Vocal tract area and length perturbations. *STL-QPSR* 4/1975, 1-14.
- Fant, G. & Pauli, S. (1975). Spatial characteristics of vocal tract resonance modes. In *Speech Communication*, Fant (ed.).
- Chiba, T. & Kajiyama, M. (1941). *The Vowel -- Its Nature and Structure*. Tokyo: Kaiseikan.
- Nordstrom, P.-E. & Lindblom, B. (1975). A normalization procedure for vowel formant data. Paper 212, 8th ICPhS.
- Heinz, J.M. (1962). Reduction of Speech Spectra to Descriptions in Terms of Vocal-Tract Area Functions. MIT Ph.D. thesis.
- Pauli, S. (1974). Computer program for calculating formants from the vocal tract area function. *PERK* report, KTH.
- Pols, L.C.W., Tromp, H.R.C. & Plomp, R. (1973). Frequency analysis of Dutch vowels from 50 male speakers. *JASA*, 53, 1093-1101.

## Collection Cross-References

### Already in Collection
- `Fant_1960_AcousticTheorySpeechProduction` — Fant 1960, source of male vocal tract area functions used as input data (cited)

### Cited By (in Collection)
- `Xue_2006_VocalTractDimensionsRace` — references Nordstrom on vocal tract scaling
- `Hao_2002_VocalTractDimensionsFormants` — references Nordstrom on formant scaling
- `Simpson_2009_PhoneticGenderDifferences` — references Nordstrom on male-female vocal tract differences

### New Leads
- Chiba & Kajiyama 1941 — *The Vowel*, source of child vocal tract dimensions
- Fant 1975a — non-uniform vowel normalization

### Conceptual Links (not citation-based)
- `Hao_2002_VocalTractDimensionsFormants` — empirical formant data supporting the scaling predictions tested here
- `Simpson_2009_PhoneticGenderDifferences` — gender-based acoustic differences that Nordstrom's scaling model attempts to explain
