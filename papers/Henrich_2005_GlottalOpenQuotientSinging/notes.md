---
title: "Glottal Open Quotient in Singing: Measurements and Correlation with Laryngeal Mechanisms, Vocal Intensity, and Fundamental Frequency"
authors: "Nathalie Henrich, Christophe d'Alessandro, Boris Doval, Michele Castellengo"
year: 2005
venue: "Journal of the Acoustical Society of America, Vol. 117(3), pp. 1417-1430"
doi_url: "10.1121/1.1850031"
---

# Glottal Open Quotient in Singing: Measurements and Correlation with Laryngeal Mechanisms, Vocal Intensity, and Fundamental Frequency

## One-Sentence Summary
Provides empirical measurements of glottal open quotient ($O_q$) across laryngeal mechanisms, vocal intensities, and fundamental frequencies in 18 trained singers, establishing quantitative ranges and correlations essential for voice source modeling.

## Problem Addressed
No prior study had systematically explored open quotient variations in western operatic singing across all main tessituras, taking laryngeal mechanisms into account. Previous studies showed conflicting results because they failed to distinguish between laryngeal mechanisms (M1 vs M2), confounding the relationship between $O_q$, vocal intensity, and $f_0$.

## Key Contributions
- Establishes that $O_q$ depends strongly on **laryngeal mechanism**: M1 range 0.3-0.8, M2 range 0.5-0.95
- Shows $O_q$ is **negatively correlated with vocal intensity** in mechanism 1 (louder = lower $O_q$, more pressed)
- Shows $O_q$ is **negatively correlated with fundamental frequency** in mechanism 2 (higher pitch = lower $O_q$)
- Provides quantitative ranges and correlation coefficients across 18 singers (7 voice types)
- Introduces the DECOM (DEgg Correlation-based Open quotient Measurement) method

## Methodology
- 18 classically trained singers (7 baritones, 2 tenors, 3 counter tenors, 3 mezzo-sopranos, 3 sopranos)
- Simultaneous recording of acoustic signal and EGG (electroglottograph)
- Open quotient derived from differentiated EGG (DEGG) using the DECOM method
- Tasks: sustained vowels [a, e, u], crescendos/decrescendos, sung sentences, glissandos
- Statistical analysis using Pearson correlation and partial correlation coefficients

## Key Equations

### Open Quotient Definition

$$O_q = \frac{t_{open}}{T_0}$$

Where:
- $t_{open}$ = duration from glottal opening to glottal closing
- $T_0$ = fundamental period (opening to next opening)
- $O_q$ ranges from 0 (no opening) to 1 (no closure)
- Related to closed quotient: $C_q = 1 - O_q$

### Pearson Correlation Coefficient

$$r_{xy} = \frac{\frac{1}{n}\sum_{i=1}^{n}(x_i - \bar{x})(y_i - \bar{y})}{\sqrt{\left(\frac{1}{n}\sum_{i=1}^{n}(x_i - \bar{x})^2\right)\left(\frac{1}{n}\sum_{i=1}^{n}(y_i - \bar{y})^2\right)}}$$

### Partial Correlation Coefficient
(Factoring out the effect of variable $z$)

$$r_{xy \cdot z} = \frac{r_{xy} - r_{xz}r_{yz}}{\sqrt{(1-r_{xz}^2)(1-r_{yz}^2)}}$$

## Parameters

| Name | Symbol | Units | Default | Range | Notes |
|------|--------|-------|---------|-------|-------|
| Open quotient | $O_q$ | dimensionless | — | 0-1 | Ratio of open time to fundamental period |
| Open quotient (M1) | $O_q$ | dimensionless | ~0.5 | 0.3-0.8 | Mechanism 1 (chest/modal register) |
| Open quotient (M2) | $O_q$ | dimensionless | ~0.7 | 0.5-0.95 | Mechanism 2 (falsetto/head register) |
| Fundamental frequency | $f_0$ | Hz | — | varies | Pitch of vibration |
| Vocal intensity | $I$ | dB SPL | — | 50-110 | Sound pressure level at 50 cm |
| Piano intensity (M1) | — | dB SPL | — | 60-70 | Soft singing |
| Forte intensity (M1) | — | dB SPL | — | 95-105 | Loud singing |

## Implementation Details

### Laryngeal Mechanism Classification
- **Mechanism 0 (M0)**: Vocal fry — produced below normal speech range
- **Mechanism 1 (M1)**: Chest register (male), modal register — thick vocal folds, vertical phase difference, longer closing phase. Corresponds to male speech phonation.
- **Mechanism 2 (M2)**: Falsetto (male), head register (female) — thin vocal folds, no vertical phase difference
- **Mechanism 3 (M3)**: Flageolet/whistle register — rare, very high pitch

### Open Quotient by Laryngeal Mechanism
- M1: $O_q$ = 0.3 to 0.8 (mean values ~0.4 to 0.65 depending on singer and intensity)
- M2: $O_q$ = 0.5 to 0.95 (mean values ~0.65 to 0.85)
- M1 values are **always lower** than M2 values for the same singer
- Overlap zone exists: $O_q$ ranges 0.5-0.7 can be either M1 or M2

### Correlation with Vocal Intensity (M1)
- **Strong negative correlation** in mechanism 1: louder singing → lower $O_q$
- A 20 dB increase in vocal intensity → decrease in $O_q$ from ~0.7 to ~0.5
- Pearson r values: strong (>0.70) for most baritones and tenors on vowel [a]
- Table IV partial correlation coefficients (factoring out $f_0$):
  - B1: -0.72 [a], -0.48 [e], -0.20 [u]
  - B5: **-0.90** [a], **-0.76** [e], -0.65 [u] (strongest)
  - B6: **-0.86** [a], **-0.83** [e], **-0.85** [u]
  - T1: 0.07 [a], n.s. [e], -0.12 [u] (exception — uses voix mixte)

### Correlation with Vocal Intensity (M2)
- **No consistent correlation** in mechanism 2
- Some singers show decrease (CT1, MS1, S1), some show increase (MS2, CT3, S1)
- Vocalis muscle less active in M2, reducing the intensity-$O_q$ coupling

### Correlation with Fundamental Frequency (M1)
- **No strong correlation** in most male singers (mechanism 1)
- Partial correlations (factoring out intensity) mostly non-significant
- Exception: some singers show positive partial correlation (higher pitch → higher $O_q$)

### Correlation with Fundamental Frequency (M2)
- **Strong negative correlation** for counter tenors and sopranos: higher $f_0$ → lower $O_q$
- Table VII partial correlation coefficients:
  - CT1: **-0.74** [a], **-0.69** [e], **-0.77** [u]
  - CT2: **-0.73** [a], **-0.71** [e], -0.69 [u]
  - S1: -0.60 [a], **-0.71** [e], **-0.79** [u]
  - S2: -0.59 [a], **-0.73** [e], -0.46 [u]
- Mezzo-sopranos show **opposite** trend (positive correlation): MS1 +0.63, MS2 +0.44

### Sustained Vowel Data (Counter Tenor CT1, D4=293 Hz, same pitch both mechanisms)

| Mechanism | Vowel | $O_q$ mean (SD) | $I$ mean (SD) dB |
|-----------|-------|-----------------|-------------------|
| M1 | [a] | 0.64 (0.02) | 88 (3) |
| M1 | [e] | 0.64 (0.01) | 83 (3) |
| M1 | [u] | 0.65 (0.02) | 82 (2) |
| M2 | [a] | 0.77 (0.02) | 79 (3) |
| M2 | [e] | 0.77 (0.04) | 77 (3) |
| M2 | [u] | 0.77 (0.03) | 79 (3) |

### Transition Between Mechanisms
- Smoothed transitions involve lowering vocal intensity to reach a common $O_q$ zone
- M1→M2: $O_q$ increases from ~0.62 to ~0.78 at transition
- M2→M1: $O_q$ decreases from ~0.76 to ~0.6 at transition
- Counter tenor CT1 smooths transition; tenor T2 shows abrupt break
- Smoothing technique: lower intensity before transition to reach overlapping $O_q$ range

### DECOM Method (DEgg Correlation-based Open quotient Measurement)
1. Apply to 4-period windowed DEGG signal
2. Separate into positive part (strong peaks = closing instants) and negative part (weaker peaks = opening instants)
3. Fundamental period: autocorrelation of positive part (consecutive closing instants)
4. Open time: intercorrelation between positive and negative parts
5. Automatically rejects cycles with double/multiple peaks

## Figures of Interest
- **Fig. 1 (page 3):** Tessitura of all 18 singers showing M1 and M2 pitch ranges
- **Fig. 2 (page 4):** Mean $O_q$ values for spoken, shouted, and sung sentences — clear M1 vs M2 difference
- **Fig. 4 (page 4):** Sustained vowel [a] comparison between M1 and M2 for counter tenor CT1
- **Fig. 5 (page 5):** Glissando showing $O_q$ vs $f_0$ correlation in M2 (counter tenor CT1)
- **Fig. 6 (page 5):** Glissando by tenor T2 showing abrupt mechanism transition with $O_q$ jump
- **Fig. 7 (page 6):** Crescendo-decrescendo in M1 showing $O_q$ decrease with intensity increase
- **Fig. 9 (page 7):** Vocal intensity vs $O_q$ scatter plots for all M1 male singers — strong negative trend
- **Fig. 10 (page 8):** Same for M2 singers — much weaker/variable trend
- **Fig. 11 (page 9):** Ave Maria task in M1 — $O_q$ decreases with loudness
- **Fig. 12 (page 9):** Ave Maria task in M2 — variable behavior across singers

## Results Summary

### Primary Findings
1. **$O_q$ is mechanism-dependent**: M1 = 0.3-0.8, M2 = 0.5-0.95
2. **In M1, $O_q$ decreases with increasing vocal intensity** (partial r up to -0.90)
3. **In M2, $O_q$ decreases with increasing $f_0$** (partial r up to -0.79)
4. **In M1, $O_q$ is NOT correlated with $f_0$** (after factoring out intensity)
5. **In M2, $O_q$ is NOT correlated with intensity** (after factoring out $f_0$)
6. Vowel type may affect $O_q$ but was not extensively explored

### Voice Quality Implications
- Pressed voice: low $O_q$ (~0.3-0.4), high intensity, mechanism 1
- Breathy voice: high $O_q$ (~0.7-0.9), low intensity or mechanism 2
- Modal voice: intermediate $O_q$ (~0.5-0.6)

## Limitations
- Only singing voice studied (not speech, though results likely transfer)
- Glissandos not recorded for statistical analysis
- Vowel effect on $O_q$ not fully explored
- Some singers (B4, B7, T1) did not show strong correlations
- DECOM method requires EGG signal (not applicable to acoustic-only analysis)
- Counter tenors (N=3) and sopranos (N=3) are small groups

## Relevance to Project

### For LF Model Voice Source
- $O_q$ maps directly to the LF model open quotient parameter
- The Rd parameter in the LF model encodes a combination of $O_q$, spectral tilt, and asymmetry
- These empirical ranges constrain what $O_q$ values are realistic for different voice qualities

### For Voice Quality Synthesis
- **Pressed/tense voice**: use $O_q$ = 0.3-0.4 (low end of M1 range)
- **Modal voice**: use $O_q$ = 0.5-0.6 (mid M1 range)
- **Breathy voice**: use $O_q$ = 0.7-0.8 (high M1 range or low M2 range)
- **Falsetto**: use $O_q$ = 0.7-0.9 (M2 range)

### For Intensity Modeling
- When increasing vocal effort/loudness in M1: decrease $O_q$ (more closed quotient)
- This creates a more pressed/tense quality at higher intensities — matches natural behavior
- At very high intensities in M1, $O_q$ drops to ~0.35 (strongly pressed)

### Mapping to Klatt Parameters
- $O_q$ relates to Klatt's OQ parameter and the voice quality continuum
- Low $O_q$ → more excitation of higher harmonics → brighter spectrum
- High $O_q$ → steeper spectral tilt → darker, breathier spectrum
- The TL (tilt) parameter in Klatt can partially compensate for $O_q$ changes

## Testable Properties
Invariants derived from this paper's empirical data that should hold in any voice source implementation:

- **Oq range by mechanism**: M1 $O_q \in [0.3, 0.8]$; M2 $O_q \in [0.5, 0.95]$
- **M1 < M2**: For the same singer and comparable conditions, $O_q^{M1} < O_q^{M2}$
- **Intensity–Oq in M1**: Increasing vocal intensity must decrease $O_q$ (partial $r$ up to $-0.90$)
- **f0–Oq in M2**: Increasing fundamental frequency must decrease $O_q$ (partial $r$ up to $-0.79$)
- **Intensity–Oq in M2**: No consistent correlation — should NOT be strongly coupled
- **f0–Oq in M1**: No consistent correlation — should NOT be strongly coupled
- **Transition overlap**: At mechanism transitions, $O_q$ values should converge to the overlap zone $[0.5, 0.7]$

## Open Questions
- [ ] How do these singing-specific findings transfer to speech phonation?
- [ ] What is the exact mapping between $O_q$ and the LF Rd parameter for different voice qualities?
- [ ] How should $O_q$ covary with intensity in the Qlatt synthesizer's voice quality presets?
- [ ] Does vowel identity significantly affect $O_q$ in speech (not just singing)?

## Related Work Worth Reading
- Henrich et al. (2004) - DECOM method details (measurement technique)
- Childers and Lee (1991) - Voice quality factors (already in collection)
- Klatt and Klatt (1990) - Voice quality variations (already in collection as Klatt_1990_VoiceQualityVariations)
- Holmberg et al. (1988, 1989) - Glottal flow analysis in speech
- Sundberg et al. (1999a, 1999b) - Voice source in singers
- Doval et al. (2003) - CALM voice source model (already in collection)
- Fant (1985) - LF model (already in collection)

---

## Collection Cross-References

### Already in Collection
- [[Doval_2003_VoiceSourceCALM]] -- cited indirectly; CALM model provides alternative parameterization for the open quotient measured here
- [[Fant_1985_LFModelGlottalFlow]] -- cited; LF model provides the glottal flow parameterization that maps to the Oq measurements
- [[Hanson_1995_GlottalCharacteristicsFemale]] -- cited for glottal open quotient measures in female speakers
- [[Henrich_2001_SpectralOqAsymmetry]] -- cited; same first author, establishes spectral correlates of Oq
- [[Henrich_2003_JND_OpenQuotient]] -- cited; same first author, establishes perceptual resolution of Oq
- [[Holmberg_1988_GlottalAirflowPressure]] -- cited for glottal airflow measurements in speech
- [[Klatt_1990_VoiceQualityVariations]] -- cited for voice quality synthesis framework
- [[Lienard_1999_VocalEffortVowelSpectral]] -- cited for vocal effort and spectral characteristics

### Cited By (in Collection)
- [[Feugere_2017_CantorDigitalis]] -- cites this for empirical Oq ranges across laryngeal mechanisms in singing
- [[Titze_1992_VocalIntensity]] -- references this for glottal parameters in singing

### New Leads (Not Yet in Collection)
- **Henrich et al. (2004)** - DECOM method paper. Essential for understanding the open quotient measurement technique used throughout this study.
- **Sundberg et al. (1993)** - Phonatory control in male singing with subglottal pressure and voice source analysis. Provides complementary aerodynamic data to the EGG-based measurements in this paper.
- **Childers et al. (1990)** - EGG and vocal fold physiology. Foundational for understanding the relationship between EGG signals and the glottal parameters measured here.

### Conceptual Links (not citation-based)
- [[Herbst_2015_GlottalAdductionSubglottalPressure]] -- Strong. Both study phonation in trained singers; Herbst provides the subglottal pressure and adduction dimensions that complement the Oq measurements here. Herbst's Breathy-Flow-Neutral-Pressed continuum maps to the Oq ranges measured here (pressed ~0.3-0.4, breathy ~0.7-0.9).
- [[Sundberg_2005_GlottalSourceLoudness]] -- Strong. Both address voice source characteristics in singers; Sundberg provides loudness-dependent voice source data that complements the intensity-Oq correlations documented here.
- [[Childers_Lee_1991_VoiceQualityFactors]] -- Moderate. Childers & Lee's voice quality factor analysis provides a complementary acoustic perspective on the breathy-modal-pressed continuum that this paper documents from the physiological (Oq) side.
