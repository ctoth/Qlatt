# Age, Sex, and Vowel Dependencies of Acoustic Measures Related to the Voice Source

**Authors:** Markus Iseli, Yen-Liang Shue, Abeer Alwan
**Year:** 2007
**Venue:** Journal of the Acoustical Society of America, Vol. 121(4), 2283-2295
**DOI:** 10.1121/1.2697522

## One-Sentence Summary
Provides a spectral magnitude correction formula that removes vocal tract formant influence from harmonic measurements, then uses it to quantify age, sex, and vowel dependencies of F0, H1*-H2* (open quotient), and H1*-A3* (spectral tilt) across 335 speakers ages 8-39.

## Problem Addressed
Acoustic measures of the voice source (H1-H2, H1-A3) are contaminated by vocal tract resonance effects, making it difficult to compare source characteristics across speakers with different formant frequencies. A correction formula is needed, plus systematic data on how corrected source measures vary with age, sex, and vowel.

## Key Contributions
- Spectral magnitude correction formula (Eq. 1/A5) that compensates for formant frequency and bandwidth effects on harmonic amplitudes
- Systematic analysis of F0, H1*-H2*, H1*-A3* across 335 speakers (185 male, 150 female), ages 8-39, 5 vowels
- Demonstrates that age dependencies are stronger for males, vowel dependencies stronger for females
- Shows H1*-H2* is linearly related to F0 for low-pitched talkers (Eq. 3)

## Methodology
- 335 speakers from CID database (Miller et al., 1996), ages 8-39
- 10 age groups, 5 vowels (/iy, ih, eh, ae, uw/) in CVC carrier "I say uh, bVt again"
- 3145 total utterances analyzed
- Formant correction applied using both frequency and bandwidth
- ANOVA with age, sex, vowel as factors; Pearson correlations between measures

## Key Equations

### Spectral Magnitude Correction Formula (Eq. 1)

$$
H^*(\omega_0) = H(\omega_0) - \sum_{i=1}^{N} 10 \log_{10} \frac{(1 - 2r_i \cos(\omega_i) + r_i^2)^2}{(1 - 2r_i \cos(\omega_0 + \omega_i) + r_i^2)(1 - 2r_i \cos(\omega_0 - \omega_i) + r_i^2)}
$$

where $r_i = e^{-\pi B_i / F_s}$ and $\omega_i = 2\pi F_i / F_s$, $F_i$ and $B_i$ are formant frequencies and bandwidths, $F_s$ is sampling frequency, $N$ is number of formants corrected for.

### Bandwidth Estimation (Eq. 2)
$$
B_i = 80 + 120 F_i / 5000
$$
(Mannell 1998 formula, in Hz)

### H1*-H2* vs F0 Relationship (Eq. 3, Group 2 talkers)
$$
H_1^* - H_2^* \approx 0.22 F_0 - 28 \quad \text{for } F_0 \text{ between 80 and 175 Hz}
$$

### Vocal Tract Transfer Function (Appendix, Eq. A2)
$$
|T(f)|^2 = \prod_{i=1}^{N} \frac{((B_i/2)^2 + F_i^2)^2}{((B_i/2)^2 + F_i^2 - f^2)^2 + B_i^2 f^2}
$$

### Final Correction Formula (Eq. A5)
$$
H^*(\omega) = H(\omega) - \sum_{i=1}^{N} 10 \log_{10} \frac{(1 - 2r_i \cos(\omega_i) + r_i^2)^2}{(1 - 2r_i \cos(\omega + \omega_i) + r_i^2)(1 - 2r_i \cos(\omega - \omega_i) + r_i^2)}
$$

## Parameters

### Formant Frequencies and Bandwidths Used (Table I, Peterson & Barney 1952 + Mannell 1983)

| Vowel | F1 | F2 | F3 | B1 | B2 | B3 |
|-------|----|----|----|----|----|----|
| **Male** |
| /a/ | 730 | 1090 | 2440 | 98 | 106 | 139 |
| /i/ | 270 | 2290 | 3010 | 86 | 135 | 152 |
| /u/ | 300 | 870 | 2240 | 87 | 101 | 134 |
| **Female** |
| /a/ | 850 | 1220 | 2810 | 100 | 109 | 147 |
| /i/ | 310 | 2790 | 3310 | 87 | 147 | 159 |
| /u/ | 370 | 950 | 2670 | 89 | 103 | 144 |
| **Children** |
| /a/ | 1030 | 1370 | 3170 | 105 | 113 | 156 |
| /i/ | 370 | 3200 | 3730 | 89 | 157 | 170 |
| /u/ | 430 | 1170 | 3260 | 90 | 108 | 158 |

### ANOVA Results (Table IV, all talkers)

| Factor | F0: F (partial eta^2) | H1*-H2*: F (partial eta^2) | H1*-A3*: F (partial eta^2) |
|--------|------|------|------|
| Age | 235.0 (0.410) | 23.9 (0.066) | 35.0 (0.094) |
| Sex | 1012.3 (0.250) | 57.7 (0.019) | 4.1 (0.001) |
| Vowel | 28.0 (0.036) | 52.7 (0.065) | 68.9 (0.083) |

### F0 by Age Group (Table VIII)

| Age | F0 males Min/Mean/Max (Hz) | F0 females Min/Mean/Max (Hz) |
|-----|---------------------------|------------------------------|
| 8 | 170/255/420 | 152/283/423 |
| 9 | 160/264/454 | 187/267/437 |
| 10 | 141/256/407 | 146/266/367 |
| 11 | 167/256/378 | 185/254/494 |
| 12 | 125/230/328 | 178/236/338 |
| 13 | 119/190/285 | 180/251/394 |
| 14 | 101/177/272 | 169/228/293 |
| 15 | 95/125/251 | 179/228/310 |
| 18 | 84/129/239 | 199/246/310 |
| 20-39 | 88/127/191 | 156/235/356 |

### Summary of Key Dependencies (Table IX)

| Measure | Female change (8-39) | Male change (8-39) | Vowel/Intercorrelations |
|---------|---------------------|-------------------|------------------------|
| F0 | down 50 Hz | down 130 Hz | Linearly related to H1*-H2* for low-pitched; to F3 for all |
| H1*-H2* | ... | down 4 dB | Linearly related to F0 for low-pitched; to F1 for high-pitched |
| H1*-A3* | down 4 dB | down 10 dB | Dependent on F1, F2, F3 for all talkers |

## Implementation Details

### Correction Formula Usage
- For H1*-H2*: correct using N=2 (first two formants F1, F2)
- For H1*-A3*: correct using N=3 (all three formants F1, F2, F3), no normalization to neutral vowel
- Using bandwidth estimate of B1=50 Hz (F1B50) yields similar results to exact bandwidths
- When F1 is close to F0 or 2*F0, correction error becomes large/infinite — these cases need special handling

### Group Definitions
- **Group 1**: Children and females, generally high-pitched (F0 > 175 Hz)
- **Group 2**: Older males, generally low-pitched (F0 <= 175 Hz)

### Key Findings by Measure
- **H1*-H2* (open quotient)**: Males drop ~4 dB between ages 8 and 20-39; females relatively unchanged; adult females ~3.4 dB higher than adult males (indicating more open/breathy phonation)
- **H1*-A3* (spectral tilt)**: Males drop ~10 dB between ages 8 and 20-39; females drop ~4 dB; vowel-dependent with /ae/ and /eh/ highest, /uw/ lowest
- **Vowel effects on H1*-A3***: High F1 vowels (/ae/, /eh/) have highest spectral tilt; low F1 vowels (/uw/) have lowest

## Figures of Interest
- **Fig 1 (page 2):** LF model diagram with parameters
- **Fig 2 (page 4):** H1-H2 error vs F1 for single-formant synthetic signals
- **Fig 5 (page 5):** Bar chart of average |H1-H2| error for NoC, F1noB1, F1B1, F1B50
- **Fig 6 (page 7):** H1*-H2* vs age by sex — males drop ~4 dB, females stable
- **Fig 7 (page 8):** H1*-H2* as function of vowel for Group 1 — vowel height effect
- **Fig 9 (page 8):** H1*-H2* vs F0 for both groups — linear relationship
- **Fig 10 (page 9):** H1*-A3* vs age by sex — both drop, males more
- **Fig 11 (page 9):** H1*-A3* as function of vowel — /ae/ and /eh/ highest

## Results Summary
1. The correction formula significantly reduces estimation error (from ~24 dB to <1 dB)
2. Even a fixed bandwidth estimate of 50 Hz works nearly as well as exact bandwidths
3. Age has the largest effect on all three measures; sex effect largest for F0
4. For males, F0 drops 130 Hz and H1*-A3* drops 10 dB between ages 8-39
5. Vowel dependencies on H1*-A3* are strong, driven by F1, F2, F3
6. H1*-H2* is linearly related to F0 for low-pitched talkers

## Limitations
- Cross-sectional study (not longitudinal)
- Age range limited to 8-39 (no elderly speakers)
- CID database recorded in 1990s — potential cohort effects
- Correction formula assumes linear source-filter independence
- F1 close to F0 or 2*F0 produces large correction errors
- Only 5 vowels analyzed (no /o/, /ʌ/, etc.)

## Testable Properties
- Correction formula error must be < 1 dB when F1 > 2.5*F0
- H1*-H2* must decrease with age for male talkers (monotonic between ages 8-20)
- H1*-A3* must decrease with age for both sexes
- For Group 2 talkers: H1*-H2* ≈ 0.22*F0 - 28 (linear relationship)
- H1*-A3* must be higher for /ae/ than for /uw/ (vowel height effect)
- Bandwidth estimate B = 80 + 120*F/5000 must produce correction errors within 1 dB of exact bandwidths

## Relevance to Project
This paper is essential for the Qlatt synthesizer in two ways:
1. **Correction formula** — needed to validate synthesized voice source parameters against natural speech measurements
2. **Age/sex parameter targets** — provides quantitative H1*-H2* and H1*-A3* values that should be achieved by different speaker profiles (child, adult male, adult female)
3. **Vowel-dependent voice source** — shows that voice source parameters vary by vowel, suggesting that OQ and TL rules should be vowel-conditioned

## Open Questions
- [ ] Should vowel-dependent H1*-H2* variation be modeled in Qlatt's rules?
- [ ] How do these values compare with Hanson 1997/1999 data already in collection?
- [ ] Can the correction formula be used as a diagnostic to compare Qlatt output against natural speech targets?

## Related Work Worth Reading
- Hanson (1995, 1997) — Glottal characteristics of female speakers (already in collection)
- Hanson & Chuang (1999) — Male speaker glottal characteristics (already in collection)
- Holmberg et al. (1995) — H1*-H2* correlated with open quotient
- Fant (1995) — LF model frequency domain analysis
- Lee et al. (1999) — F0 and formant developmental data

## Collection Cross-References

### Already in Collection
- [[Fant_1960_AcousticTheorySpeechProduction]] — cited for acoustic theory of speech production; the vocal tract transfer function model (Eq. A2) derives from Fant's formant theory
- [[Fant_1985_LFModelGlottalFlow]] — cited for the LF glottal flow model; the voice source measures (H1-H2, spectral tilt) relate to LF parameters
- [[Hanson_1995_GlottalCharacteristicsFemale]] — cited for glottal characteristics of female speakers; directly comparable corrected measures
- [[Hanson_1997_GlottalCharacteristicsFemaleAcoustic]] — cited for acoustic correlates of female speaker glottal characteristics; provides the original correction approach this paper improves
- [[Hanson_1999_GlottalMaleSpeakers]] — cited for male speaker glottal characteristics with same measures
- [[Klatt_1990_VoiceQualityVariations]] — cited for voice quality analysis and synthesis; the KLSYN88 synthesizer uses parameters (AV, OQ, TL) that map to measures corrected here
- [[Peterson_Barney_1952_VowelControl]] — cited for canonical vowel formant frequencies used as correction input (Table I)

### Cited By (in Collection)
- [[Kreiman_2012_VoiceQualityHarmonicOQ]] — uses Iseli et al. (2007) correction formula for H1*-H2* vocal tract effects; Iseli is a co-author
- [[Kreiman_2007_GlottalSourceSpectrum]] — uses Iseli & Alwan (2004) correction for H1-A1/H1-A3 measures (the earlier version of this formula)
- [[Lee_2019_AcousticVoiceVariation]] — cites this for harmonic correction formulas used in their voice variation study
- [[Keating_2015_CreakyVoiceAcoustics]] — references the formant-corrected H1*-H2* measure from Hanson 1995 / Iseli 2007
- [[Henrich_2001_SpectralOqAsymmetry]] — cites this for the formant correction formula for H1*-H2* estimation
- [[Starr_2015_SweetVoiceJapaneseFeminine]] — cites this for age/sex voice source dependencies
- [[Schild_2019_AttractiveVoiceFormantF0]] — cites this for age- and sex-specific norms for spectral tilt measures
- [[Zhang_2021_LaryngealSizeSexDifferences]] — cites this for voice source age/sex variation data
- [[Titze_1989_MaleFemaleVoices]] — related F0 and voice source sex difference data
- [[Fitch_1999_VocalTractMorphology]] — related developmental vocal tract data

### New Leads (Not Yet in Collection)
- Holmberg et al. (1995) — "Comparisons among aerodynamic, electroglottographic, and acoustic spectral measures of female voice" — links H1*-H2* to physiological open quotient
- Lee et al. (1999) — "Acoustics of children's speech: Developmental changes" — extends the age range of speaker modeling data
- Mannell (1998) — "Formant diphone parameter extraction" — source of the bandwidth estimation formula (Eq. 2)

### Conceptual Links (not citation-based)
- [[Childers_Lee_1991_VoiceQualityFactors]] — both papers characterize voice source differences across speaker populations; Childers & Lee examines voice quality factors while Iseli provides the corrected spectral measures needed to compare voice source characteristics accurately
- [[Gobl_2003_VoiceQualityEmotion]] — Gobl's emotion-voice quality mappings use the same spectral tilt and H1-H2 measures that Iseli provides age/sex norms for; together they establish that voice source parameters vary systematically with both speaker identity (age/sex) and communicative intent (emotion)
- [[Hanson_2001_ModelsPhonation]] — extends Hanson's phonation modeling approach that Iseli's correction formula supports
- [[Hanson_2002_HLsynSourceParameters]] — HLsyn uses parameters (OQ, TL) directly related to the H1*-H2* and H1*-A3* measures Iseli characterizes; the age/sex norms here could parameterize HLsyn speaker profiles
- [[Xue_2000_RaceSexAcousticVoice]] — Xue's SPI (soft phonation index) finding in elderly speakers — males have higher low-to-high harmonic energy ratio due to lower F0 — is the same spectral tilt phenomenon captured by H1*-A3*, but measured with MDVP rather than corrected spectral measures. Extends the age range to 70-80 and adds race as a non-significant variable.
