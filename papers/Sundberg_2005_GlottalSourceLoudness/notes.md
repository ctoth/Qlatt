# Effects on the Glottal Voice Source of Vocal Loudness Variation in Untrained Female and Male Voices

**Authors:** Johan Sundberg, Ellinor Fahlstedt, Anja Morell
**Year:** 2005
**Venue:** Journal of the Acoustical Society of America, Vol. 117, No. 2, pp. 879-885
**DOI:** 10.1121/1.1841612

## One-Sentence Summary
Provides quantitative equations relating subglottal pressure to voice source parameters (MFDR, closed quotient, pulse amplitude, H1-H2, compliance) for untrained male and female voices across three F0 levels — directly usable for effort-dependent voice quality control in synthesis.

## Problem Addressed
Prior work established that subglottal pressure (Ps) affects voice source waveform parameters, but only measured at 3-4 pressure levels, making it impossible to specify the functional form of these relationships quantitatively. This paper uses 10 pressure levels per condition to derive analytic approximations.

## Key Contributions
- Quantitative equations (linear regressions and power functions) relating normalized excess pressure (PSEN) to MFDR, Qclosed, peak-to-peak amplitude, compliance, and H1-H2
- Sex-differentiated parameter tables (15 female, 14 male untrained speakers)
- Three F0 conditions per speaker (mean speaking F0, +6 semitones, +12 semitones)
- Complete Table I with regression constants usable for synthesis parameter derivation

## Methodology
- 15 female, 14 male untrained speakers (age 20-40)
- Produced /pae/ syllables at varied loudness while maintaining constant pitch
- Subglottal pressure estimated from oral pressure during /p/ occlusion
- 10 equidistant pressure values selected per F0 condition
- Voice source analyzed by inverse filtering airflow (Rothenberg mask)
- Three F0 conditions: mean speaking F0, +6 semitones, +12 semitones
- Mean F0: females 219.2 Hz (SD 15.7), males 117.1 Hz (SD 17.7)

## Key Equations

### Normalized Excess Pressure
$$
P_{SEN} = \frac{P_s - P_{thr}}{P_{thr}}
$$
Where: $P_s$ = subglottal pressure, $P_{thr}$ = phonation threshold pressure (softest phonation for each F0 condition). Proposed by Titze (1992).

### Closed Quotient vs. Pressure (Power Function)
$$
Q_{closed} = A - e^{(-\alpha \cdot P_{SEN}) + B}
$$
Where: $A$ = asymptote, $\alpha$ = curvature, $B = \ln(A)$.

This is Eq. (3) in the paper. Qclosed rises quickly at low pressures, approaches asymptote at high pressures.

### MFDR vs. Pressure (Linear)
$$
MFDR = C \cdot P_{SEN} + Icpt
$$
Linear regression with high correlation (mean r = 0.940 female, 0.921 male).

### Peak-to-Peak Amplitude vs. Pressure (Linear)
$$
\hat{U} = C \cdot P_{SEN} + Icpt
$$
Strong linear relationship (0.953 >= mean r >= 0.884).

### Glottal Compliance
$$
C_{Gl} = (U_{pulse} - U_{dc}) \cdot T_{op} / P_s
$$
Where: $U_{pulse}$ = mean airflow during open phase, $U_{dc}$ = leakage (mean airflow during closed phase), $T_{op} = T - T_{closed}$ = open phase duration.

### H1-H2 vs. Closed Quotient (Linear)
$$
H_1 - H_2 = C \cdot Q_{closed} + Icpt
$$

## Parameters

### Qclosed = A - exp(-alpha * PSEN + B) constants

| Sex | F0 Condition | A (asymptote) | SD | alpha (curvature) | SD | B | Diff^2 |
|-----|-------------|-------|------|-------|------|-------|--------|
| Female | Mean F0 | 0.49 | 0.12 | 0.56 | 0.3 | -0.74 | 0.07 |
| Male | Mean F0 | 0.49 | 0.09 | 1.09 | 0.78 | -0.73 | 0.09 |
| Female | Mean F0+6 | 0.44 | 0.17 | 0.65 | 0.47 | -0.94 | 0.04 |
| Male | Mean F0+6 | 0.52 | 0.08 | 0.83 | 0.94 | -0.66 | 0.11 |
| Female | Mean F0+12 | 0.32 | 0.13 | 0.76 | 0.46 | -1.26 | 0.04 |
| Male | Mean F0+12 | 0.44 | 0.14 | 1.43 | 1.13 | -0.88 | 0.15 |

### MFDR = C * PSEN + Icpt

| Sex | F0 Condition | C (slope) | SD | Icpt | SD | r | SD |
|-----|-------------|-----------|------|------|------|-------|------|
| Female | Mean F0 | 142.8 | 46 | -44.7 | 111 | 0.967 | 0.016 |
| Male | Mean F0 | 140.6 | 61.1 | 105.9 | 108 | 0.889 | 0.112 |
| Female | Mean F0+6 | 145 | 50.4 | 24.2 | 86 | 0.919 | 0.067 |
| Male | Mean F0+6 | 232.3 | 79.8 | 64.7 | 143 | 0.925 | 0.086 |
| Female | Mean F0+12 | 177.9 | 57.1 | 49.1 | 88.9 | 0.934 | 0.06 |
| Male | Mean F0+12 | 343.5 | 105 | 95.6 | 103 | 0.949 | 0.039 |

MFDR units: l/s^2. Males reach 2-3x higher MFDR than females for given PSEN.

### U-hat (peak-to-peak amplitude) = C * PSEN + Icpt

| Sex | F0 Condition | C (slope) | SD | Icpt | SD | r | SD |
|-----|-------------|-----------|------|------|------|-------|------|
| Female | Mean F0 | 0.051 | 0.01 | 0.49 | 0.25 | 0.934 | 0.051 |
| Male | Mean F0 | 0.085 | 0.03 | 0.31 | 0.21 | 0.892 | 0.088 |
| Female | Mean F0+6 | 0.053 | 0.02 | 0.51 | 0.23 | 0.884 | 0.095 |
| Male | Mean F0+6 | 0.12 | 0.04 | 0.4 | 0.19 | 0.937 | 0.065 |
| Female | Mean F0+12 | 0.077 | 0.03 | 0.57 | 0.36 | 0.91 | 0.106 |
| Male | Mean F0+12 | 0.164 | 0.06 | 0.43 | 0.17 | 0.953 | 0.029 |

U-hat units: l/s. Range ~0.15 to >1 l/s.

### H1-H2 = C * Qclosed + Icpt

| Sex | F0 Condition | C (slope) | SD | Icpt | SD | r | SD |
|-----|-------------|-----------|------|------|------|-------|------|
| Female | Mean F0 | -40.7 | 12.3 | 24.6 | 5 | 0.878 | 0.094 |
| Male | Mean F0 | -30 | 11.5 | 21.8 | 5.9 | 0.928 | 0.071 |
| Female | Mean F0+6 | -40.6 | 13.4 | 24.2 | 4.3 | 0.907 | 0.1 |
| Male | Mean F0+6 | -25.9 | 6.9 | 19.8 | 2.9 | 0.912 | 0.1 |
| Female | Mean F0+12 | -39.3 | 17.6 | 25.6 | 5.1 | 0.783 | 0.12 |
| Male | Mean F0+12 | -23.5 | 5.9 | 17.6 | 2.6 | 0.886 | 0.09 |

H1-H2 units: dB. Negative slope means increasing Qclosed reduces H1-H2 (more harmonics).

### Compliance = C * PSEN + Icpt

| Sex | F0 Condition | C (slope) | SD | Icpt | SD | r | SD |
|-----|-------------|-----------|------|------|------|-------|------|
| Female | Mean F0 | -0.005 | 0 | 0.065 | 0.02 | -0.73 | 0.211 |
| Male | Mean F0 | -0.028 | 0.02 | 0.253 | 0.15 | -0.83 | 0.189 |
| Female | Mean F0+6 | -0.00 | 0 | 0.038 | 0.01 | -0.59 | 0.482 |
| Male | Mean F0+6 | -0.02 | 0.02 | 0.172 | 0.09 | -0.78 | 0.17 |
| Female | Mean F0+12 | 0 | 0 | 0.023 | 0.01 | 0.036 | 0.682 |
| Male | Mean F0+12 | -0.01 | 0.02 | 0.09 | 0.05 | -0.61 | 0.499 |

Compliance units: ml/cmH2O. Decreases with increasing PSEN (except highest F0 where ~constant).

### MFDR = C * AC + Icpt (AC = peak-to-peak amplitude proxy)

| Sex | F0 Condition | C (slope) | SD | Icpt | SD | r | SD |
|-----|-------------|-----------|------|------|------|-------|------|
| Female | Mean F0 | 2548 | 658 | -159 | 105 | 0.954 | 0.047 |
| Male | Mean F0 | 1492 | 372 | -222 | 140 | 0.952 | 0.063 |
| Female | Mean F0+6 | 2663 | 549 | -130 | 70.2 | 0.944 | 0.065 |
| Male | Mean F0+6 | 1962 | 553 | -310 | 266 | 0.972 | 0.019 |
| Female | Mean F0+12 | 2364 | 933 | -74 | 145 | 0.963 | 0.063 |
| Male | Mean F0+12 | 2164 | 695 | -299 | 175 | 0.973 | 0.023 |

### MFDR = C * Qclosed + Icpt

| Sex | F0 Condition | C (slope) | SD | Icpt | SD | r | SD |
|-----|-------------|-----------|------|------|------|-------|------|
| Female | Mean F0 | 1760 | 483 | -163 | 149 | 0.872 | 0.06 |
| Male | Mean F0 | 1745 | 864 | -149 | 369 | 0.829 | 0.099 |
| Female | Mean F0+6 | 1676 | 694 | -51.5 | 163 | 0.852 | 0.086 |
| Male | Mean F0+6 | 1944 | 903 | -1.1 | 301 | 0.848 | 0.088 |
| Female | Mean F0+12 | 2053 | 1288 | -5.7 | 142 | 0.753 | 0.117 |
| Male | Mean F0+12 | 2866 | 943 | 63.1 | 400 | 0.834 | 0.071 |

## Implementation Details

### Pressure Range Observed
- **Female min Ps:** ~3 cmH2O (low F0) to ~5 cmH2O (high F0)
- **Female max Ps:** ~13 cmH2O (low F0) to ~20 cmH2O (high F0)
- **Male min Ps:** ~3-4 cmH2O across F0
- **Male max Ps:** ~6 cmH2O (low F0) to ~20 cmH2O (high F0)

### For Synthesis Implementation
1. **Input:** Choose a PSEN value (0 = threshold, higher = louder)
2. **Derive Qclosed** via power function: `Qclosed = A - exp(-alpha * PSEN + B)` using sex/F0-appropriate constants
3. **Derive MFDR** linearly: `MFDR = C * PSEN + Icpt`
4. **Derive H1-H2** from Qclosed: `H1-H2 = C * Qclosed + Icpt`
5. H1-H2 maps to OQ (open quotient = 1 - Qclosed), which controls spectral tilt

### Key Insight for Loudness Control
- At low PSEN: both Qclosed increase and U-hat increase contribute to MFDR increase
- At high PSEN: Qclosed saturates, so further MFDR increase comes only from U-hat increase
- This means spectral tilt (voice quality) changes mainly at low-to-moderate effort levels

### DC Flow (Leakage)
- Highly variable across subjects — no reliable systematic trend with PSEN
- Males show higher leakage than females (longer vocal folds)
- Leakage increases with F0 in males

## Figures of Interest
- **Fig. 1 (page 3):** Block diagram of experimental setup
- **Fig. 2 (page 4):** Example flow glottogram, derivative, and spectrum with labeled measurements
- **Fig. 3 (page 4):** Maximum and minimum Ps vs F0 for female and male subjects
- **Fig. 4 (page 6):** Average relationships for Qclosed, MFDR, U-hat, and compliance vs PSEN (the key figure — six curves each, three F0 x two sexes)
- **Fig. 5 (page 7):** H1-H2 vs Qclosed relationships

## Results Summary
- MFDR increases **linearly** with PSEN (r ~0.92-0.97)
- Qclosed follows **power function** — fast rise at low pressure, saturates at high
- Males reach higher Qclosed, MFDR, and compliance than females for given PSEN
- Female Qclosed asymptote drops sharply at high F0 (0.32 vs 0.49 at low F0)
- H1-H2 correlates negatively with Qclosed (r ~0.78-0.93)
- Compliance decreases linearly with PSEN at low/mid F0, stays ~constant at high F0
- Ps variation alone causes: Qclosed 0→0.5, MFDR 0→700 (F) or 1600 (M) l/s^2, U-hat 0.15→>1 l/s, H1-H2 range 10-20 dB

## Limitations
- Untrained voices only — professional singers show different patterns (cited Sundberg et al. 1999)
- Some females may have switched register at highest F0
- DC flow showed no reliable trend — too variable across subjects
- Only vowel /ae/ studied
- Pressure estimated from oral pressure (not directly measured subglottal)

## Testable Properties
- Qclosed must be in [0, ~0.6] (observed max asymptote ~0.52)
- Increasing PSEN must increase MFDR (monotonic, linear)
- Increasing PSEN must increase Qclosed (monotonic, saturating)
- Increasing PSEN must increase U-hat (monotonic, linear)
- Increasing Qclosed must decrease H1-H2 (monotonic, negative slope)
- Compliance must decrease or stay constant with increasing PSEN (never increase)
- For given PSEN: male MFDR > female MFDR
- For given PSEN: male Qclosed >= female Qclosed
- For given PSEN: male compliance > female compliance
- At high F0: Qclosed asymptote is lower than at low F0 (especially females)

## Relevance to Project
This paper provides the quantitative mapping from vocal effort (subglottal pressure) to LF model parameters needed for Qlatt's voice quality synthesis layer. The Qclosed power function and MFDR linear regression can be directly implemented as effort-to-source-parameter derivation rules. The H1-H2 vs Qclosed relationship connects to spectral tilt control in the LF source model. Sex-differentiated constants enable male/female speaker presets.

## Open Questions
- [ ] How to map PSEN to LF model parameters (Rd, OQ, etc.) rather than flow glottogram measures?
- [ ] The paper uses Qclosed from flow glottograms — does this map directly to the LF model's closed quotient?
- [ ] How does the Qclosed power function interact with the LF model's Rd parameter (which bundles OQ + asymmetry)?
- [ ] Professional singers show less variation with F0 — should synthesis use "trained" or "untrained" constants?

## Related Work Worth Reading
- Holmberg et al. (1988) — Glottal airflow and pressure for male/female in soft/normal/loud voice
- Titze (1992) — Phonation threshold pressure (defines PSEN normalization used here)
- Sundberg et al. (1999) — Same methodology applied to professional baritone singers
- Hanson (1997) — Glottal characteristics of female speakers (H1-H2 measurements)
- Fant (1960) — Acoustic Theory of Speech Production (MFDR determines first formant level)

---

## Collection Cross-References

### Already in Collection
- [[Fant_1960_AcousticTheorySpeechProduction]]
- [[Hanson_1995_GlottalCharacteristicsFemale]]
- [[Holmberg_1988_GlottalAirflowPressure]]
- [[Titze_1992_VocalIntensity]] — cited as ref [#17]; provides the analytical-empirical vocal intensity model and excess pressure over threshold concept that this paper's PSEN normalization is based on

### Cited By (in Collection)
- [[Titze_1992_VocalIntensity]] — this paper extends the 1992 analytical model with new empirical data on untrained voices

### New Leads (Not Yet in Collection)
- **Titze (1992)** [#16] — Defines phonation threshold pressure and the PSEN normalization used throughout this paper; essential for implementing effort-based control
- **Sundberg et al. (1999)** [#14] — Same methodology on professional baritone singers; useful for comparing trained vs. untrained voice source behavior

### Conceptual Links (not citation-based)
- [[Bjorklund_2016_SubglottalPressureSPL]] — Uses the identical /pae/ protocol on a similar untrained population but measures the Ps-to-SPL transfer function rather than voice source parameters. Together, Sundberg 2005 (Ps -> voice quality) and Bjorklund 2016 (Ps -> SPL) provide the complete effort-to-output mapping needed for synthesis.
