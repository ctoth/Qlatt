# Acoustic Voice Variation Within and Between Speakers

**Authors:** Yoonjeong Lee, Patricia Keating, Jody Kreiman
**Year:** 2019
**Venue:** Journal of the Acoustical Society of America, 146(3), 1568-1579
**DOI:** 10.1121/1.5125134

## One-Sentence Summary
PCA on 26 psychoacoustic voice quality measures across 100 speakers reveals that the balance between high-frequency harmonic and inharmonic energy is the dominant axis of voice variation both within and between speakers, followed by higher formant frequencies and formant dispersion, with remaining variability largely idiosyncratic to individual voices.

## Problem Addressed
Neither the extent nor the acoustic structure of within-speaker voice variability was known, despite being critical input for models of voice perception and speaker recognition. Existing studies used only sustained vowels from small speaker pools.

## Key Contributions
- First large-scale (100 speakers, 3 days, multiple sentences) PCA of dynamic voice quality measures
- Identifies a shared core of acoustic dimensions (harmonic/inharmonic balance + formant dispersion) common across virtually all speakers
- Shows within-speaker and between-speaker voice spaces have nearly identical structure
- Provides evidence consistent with prototype-based models of voice perception
- F0 is notably NOT a major component of acoustic voice variability (emerges only in PC4-PC6)

## Methodology
- 50 female + 50 male speakers from UCLA Speaker Variability Database
- Recorded on 3 different days, reading 5 Harvard sentences twice per day (6 repetitions each)
- 22 kHz sampling rate, Bruel & Kjaer 4193 microphone
- Acoustic measurements every 5 ms on vowels and approximants only (voiced segments excluding nasals and stops)
- 13 base measures -> 26 variables (moving averages + moving coefficients of variation per 50 ms window)
- PCA with oblique rotation, eigenvalue > 1 criterion

## The 13 Acoustic Measures

From Kreiman et al. (2014) psychoacoustic model of voice quality:

| Category | Variables | Description |
|---|---|---|
| F0 | F0 | Fundamental frequency |
| Formant frequencies | F1, F2, F3, F4, FD | First four formants + formant dispersion |
| Harmonic source spectral shape | H1*-H2*, H2*-H4*, H4*-H2kHz*, H2kHz*-H5kHz | Corrected harmonic amplitude differences at spectral tilt regions |
| Spectral noise | CPP, Energy, SHR | Cepstral peak prominence, energy, subharmonic-to-harmonic ratio |

All 13 measures normalized to 0-1 range. Each measure yields two variables: moving average (50 ms window) and moving coefficient of variation (CoV).

## Principal Component Results

### Within-Speaker PCA (individual analyses for each of 100 speakers)

Most speakers: 7-8 PCs with eigenvalue > 1, explaining ~68-69% of total variance.

**PC1 (20-22% of variance):** Variability (CoVs) in source spectral shape and spectral noise
- H2kHz*-H5kHz CoV and CPP CoV most heavily weighted
- Captures the balance between higher harmonic amplitudes and inharmonic energy
- Associated with perceived breathiness/brightness (Samlan et al. 2013)
- Consistent across virtually all 100 speakers

**PC2 (~12% of variance):** Formant frequencies
- F4, formant dispersion (FD), and F3 most heavily weighted
- Associated with vocal tract length and perceived speaker size (Fitch 1997)
- Relatively independent of vowel quality (Fant 1960)
- Consistent across virtually all 100 speakers

**PC3-PC6 (~28-29% combined):** Idiosyncratic
- Different measures, different combinations, different orderings across speakers
- No single component accounts for substantial variance
- F0 appears sporadically, only in PC1/PC2 for 4 out of 100 speakers

### Between-Speaker Group PCA (pooled 50F or 50M)

8 PCs extracted, explaining 66-67% of variance. Structure mirrors within-speaker results:

**Female speaker group:**

| PC | Key Variables | Weight | Variance |
|---|---|---|---|
| 1 | H2kHz*-H5kHz CoV, CPP CoV, H4*-H2kHz* CoV, H2*-H4* CoV | 0.82, 0.76, 0.59, 0.57 | 18% |
| 2 | F4, FD, F3 | 0.90, 0.83, 0.70 | 11% |
| 3 | H4*-H2kHz*, F2, H2kHz*-H5kHz, F2 CoV | 0.85, 0.76, 0.65, 0.62 | 10% |
| 4 | H2*-H4*, F1 | 0.83, 0.76 | 8% |
| 5 | H1*-H2*, F0, H1*-H2* CoV, SHR | 0.73, 0.53, 0.52, 0.42 | 6% |
| 6 | SHR CoV, F0 CoV, Energy CoV, CPP | 0.71, 0.68, 0.57, 0.50 | 5% |
| 7 | FD CoV, F4 CoV, F3 CoV, F1 CoV | 0.93, 0.90, 0.52, 0.43 | 5% |
| 8 | Energy | 0.79 | 4% |

**Male speaker group:**

| PC | Key Variables | Weight | Variance |
|---|---|---|---|
| 1 | H2kHz*-H5kHz CoV, CPP CoV, H1*-H2* CoV, H2*-H4* CoV, H4*-H2kHz* CoV | 0.81, 0.76, 0.69, 0.65, 0.56 | 20% |
| 2 | H4*-H2kHz*, F2, H2kHz*-H5kHz, F2 CoV | 0.82, 0.69, 0.66, 0.63 | 10% |
| 3 | F4, FD, F3 | 0.97, 0.92, 0.54 | 9% |
| 4 | F0, Energy, H2*-H4* | 0.73, 0.57, 0.57 | 7% |
| 5 | H1*-H2*, SHR, CPP | 0.79, 0.69, 0.52 | 6% |
| 6 | F1, F1 CoV | 0.90, 0.35 | 5% |
| 7 | F0 CoV, SHR CoV, Energy CoV | 0.70, 0.69, 0.46 | 5% |
| 8 | FD CoV, F4 CoV, F3 CoV | 0.96, 0.93, 0.53 | 4% |

## Key Finding: F0 Is Not a Major Variability Axis

F0 only emerged in PC1 or PC2 for 4 out of 100 speakers. In group analyses, F0 appears in PC4 (males) or PC5 (females), accounting for only 6-7% of variance. The authors note this may partly reflect:
1. Limited F0 variation in read speech
2. Normalization technique not accounting for perceptual sensitivity differences
3. Previous studies reporting F0 as important used sustained vowels, not continuous speech

However, F0 does emerge as important for *discriminating* among voices in LDA (Keating & Kreiman 2016), suggesting F0 matters for between-speaker discrimination even though it is not a major axis of variability.

## Relevance to Qlatt

### Speaker Personality System
This paper directly informs which acoustic parameters matter most for creating distinguishable speaker profiles:

1. **Primary voice identity axis:** H2kHz*-H5kHz and CPP (spectral tilt and noise in upper frequencies). In Klatt terms, this maps to the balance between source spectral slope (TL) and aspiration/frication noise levels (AH, AF).

2. **Secondary voice identity axis:** Higher formant frequencies (F3, F4) and formant dispersion. These are vocal tract length cues — scaling F3/F4 and overall formant spacing creates size/gender impressions.

3. **F0 is necessary but not sufficient:** F0 is important for speaker discrimination but is NOT the primary axis of acoustic voice variability. Speaker profiles should not rely primarily on F0 differences.

4. **Variability matters as much as means:** CoVs (coefficients of variation) for spectral measures are as important as their means. A voice is characterized not just by its average spectral tilt but by how much that tilt fluctuates. This suggests speaker profiles should include variability parameters, not just static targets.

### Mapping to Klatt Parameters

| PCA Dimension | Acoustic Measures | Klatt Parameter Mapping |
|---|---|---|
| Harmonic/inharmonic balance | H2kHz*-H5kHz, CPP | TL (spectral tilt), AH (aspiration), noise source levels |
| Source spectral shape | H1*-H2*, H2*-H4* | OQ (open quotient) via H1-H2; spectral tilt via H2-H4 |
| Formant dispersion | F3, F4, FD | F3, F4 absolute values; overall vocal tract length scaling |
| Mid-frequency spectral detail | H4*-H2kHz*, F2 | Interaction of source tilt and F2 region |

### Implementation Implications
- Speaker presets should vary TL/AH/noise levels as the primary differentiator
- Formant dispersion (F3/F4 scaling) is the second most important differentiator
- Consider adding per-speaker variability parameters (CoV-like jitter in spectral tilt)
- F0 mean and range should be set per speaker but are not the dominant voice quality axis

## Limitations
1. Read speech only (5 Harvard sentences) — does not capture full range of natural vocal variability
2. Homogeneous speaker pool (UCLA undergrads, 18-29 years, native English)
3. Normalization to 0-1 range may underweight perceptually important F0 variation
4. Only vowels and approximants analyzed (excludes nasals, stops, fricatives)
5. PCA explains 66-69% of variance; 31-34% is unexplained

## Open Questions
1. Do the same principal components emerge for spontaneous/conversational speech?
2. How does acoustic variability structure differ across age groups, languages, or vocal pathologies?
3. Can the idiosyncratic PC3-PC6 dimensions be predicted from physiological speaker characteristics?

## Collection Cross-References

### Already in Collection
- [[Keating_2016_AcousticSimilarityFemaleVoices]] — earlier LDA study by same group, same database (50 female speakers); identifies F0, SHR, F3, F4, CPP as top speaker discriminators. This paper extends to 100 speakers (50F+50M) and shows F0 is not a major variability axis despite being a strong discriminator.
- [[Kreiman_Gerratt_2010_PerceptualVoiceQualityAssessment]] — the psychoacoustic model whose 13 measures are used here
- [[Fant_1960_AcousticTheorySpeechProduction]] — cited for formant frequencies being independent of vowel quality (formant dispersion interpretation)
- [[Childers_Lee_1991_VoiceQualityFactors]] — source spectral measures and voice quality

### Cited By (in Collection)
- [[Kreiman_2021_ValidatingVoiceQuality]] — cites this paper as ref [25] for acoustic voice variation structure

### Conceptual Links (not citation-based)
- [[Cartei_2014_VoiceMasculinity]] — **Strong.** Cartei identifies F0 and formant spacing (deltaF) as independent voice gender perception dimensions. This paper's PC2 (formant dispersion: F3, F4, FD) aligns with Cartei's deltaF pathway, and the finding that F0 is a weak variability axis supports their independence.
- [[Iseli_2007_VoiceSourceAgeSexVowel]] — **Strong.** Provides the harmonic correction formulas (H1*, H2*, etc.) for the spectral measures used here. The sex-specific correction norms from Iseli are critical to interpreting this paper's between-sex PCA differences.
- [[Eyben_2015_GeMAPS_AcousticParameters]] — **Moderate.** Standardized acoustic feature set with substantial overlap in spectral and prosodic measures used here.
- [[Stathopoulos_2011_VoiceAcrossLifespan]] — **Moderate.** Voice acoustics across lifespan; relevant context for this paper's age-homogeneous sample limitation.
- [[Burkhardt_2009_VoiceQualityFormantSynthesis]] — **Moderate.** Voice quality variation in formant synthesis; the spectral tilt and noise dimensions identified here (PC1) map to Klatt parameters TL and AH.
- [[Banse_1996_VocalEmotionAcousticProfiles]] — **Moderate.** Emotional speech acoustics; the within-speaker variability dimensions here overlap with emotion-related acoustic changes in Banse's profiles.
- [[Schild_2019_AttractiveVoiceFormantF0]] — **Moderate.** Schild's PCA-based approach to voice attractiveness uses many of the same spectral measures; the variability structure identified here provides context for which dimensions separate speakers versus which vary within speakers.
