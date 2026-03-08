# Expression of Affect in Spontaneous Speech: Acoustic Correlates and Automatic Detection of Irritation and Resignation

**Authors:** Petri Laukka, Daniel Neiberg, Mimmi Forsell, Inger Karlsson, Kjell Elenius
**Year:** 2011
**Venue:** Computer Speech and Language 25, 84–104
**DOI:** 10.1016/j.csl.2010.03.004

## One-Sentence Summary
Provides quantitative acoustic correlates of authentic (non-acted) irritation and resignation from a 200-utterance call-center corpus, comparing within-speaker affective vs. neutral speech across 73 acoustic measures related to F0, intensity, formants, voice source, and duration.

## Problem Addressed
Most vocal emotion research uses posed (acted) expressions. This paper investigates whether the same acoustic correlates hold for authentic, spontaneous affective speech — specifically mild irritation and resignation as they occur in real human–computer telephone interactions.

## Key Contributions
- Within-speaker acoustic analysis of authentic irritation and resignation vs. neutral speech (64 speakers, 200 utterances)
- Comprehensive 73-measure acoustic battery covering pitch, intensity, formants, voice source, and temporal cues (reduced to 23 via PCA)
- Perceptual validation via 20-listener rating task with high inter-rater reliability (R = 0.88–0.93)
- LDA automatic classification achieving 54–62% average recall (3-class: irritated/resigned/neutral), comparable to human performance (58%)
- Evidence that authentic affective states share acoustic direction with posed emotions but with much smaller effect sizes

## Methodology
- **Corpus:** 61,078 utterances from Voice Provider (Swedish call-center), 8 kHz telephone speech
- **Selection:** 200 utterances from 64 speakers (81 neutral, 31 emphatic, 21 resigned, 67 irritated); each speaker contributed both neutral and affective samples
- **Acoustic analysis:** 73 measures extracted via Praat, reduced to 23 via PCA with oblimin rotation
- **Listening test:** 20 listeners rated all 200 stimuli on irritation, resignation, neutral, and emotion intensity scales (0–7)
- **Classification:** Majority voting for affect labels; within-speaker t-tests for acoustic comparisons
- **Automatic detection:** LDA with 3-fold cross-validation, brute-force forward feature selection, with and without speaker adaptation (mean subtraction)

## Key Results: Acoustic Correlates

### Table 1: Summary of Expected Directions (from posed expression literature)

| Acoustic measure | Anger (≈Irritation) | Sadness (≈Resignation) |
|-----------------|---------------------|----------------------|
| F0 mean | + (high) | − (low) |
| F0 variability | + | − |
| Intensity mean | + | − |
| Intensity variability | + | − |
| F1 mean | + | − |
| F1 bandwidth | − | + |
| High-frequency energy | + | − |
| Speech rate | + | − |

### Table 4: Irritated vs. Neutral (within-speaker, N=24–26)

| Measure | Irritated M(SD) | Neutral M(SD) | t | Sig |
|---------|----------------|---------------|---|-----|
| F0M (log Hz) | 2.29 (0.10) | 2.22 (0.10) | 4.88 | *** |
| F0Q1 | 2.18 (0.11) | 2.12 (0.11) | 2.88 | ** |
| F0Q5 | 2.37 (0.11) | 2.31 (0.12) | 4.90 | *** |
| IntM (dB) | 71.77 (6.21) | 67.46 (5.33) | 4.94 | *** |
| IntQ5 | 82.73 (5.10) | 78.01 (5.05) | 6.33 | *** |
| IntFracRise | 0.171 (0.055) | 0.210 (0.065) | −2.65 | * |
| F2B (median BW) | 366.9 (180.5) | 298.3 (144.2) | 2.29 | * |
| SyllableDurM | 0.451 (0.120) | 0.412 (0.143) | 2.37 | * |

**Irritation summary:** Higher F0 (mean, Q1, Q5), higher intensity (mean, Q5), wider F2 bandwidth, longer syllable duration (slower rate), lower IntFracRise (fewer frames with intensity rise)

### Table 5: Resigned vs. Neutral (within-speaker, N=15–17)

| Measure | Resigned M(SD) | Neutral M(SD) | t | Sig |
|---------|---------------|---------------|---|-----|
| F0M | 2.20 (0.12) | 2.26 (0.11) | −2.24 | * |
| F0SD | 0.045 (0.022) | 0.057 (0.027) | −2.31 | * |
| F0FracRise | 0.208 (0.122) | 0.258 (0.219) | −2.15 | * |
| IntM | 60.84 (4.21) | 64.93 (6.28) | −2.57 | * |
| IntQ1 | 47.20 (5.68) | 51.54 (6.34) | −2.68 | * |
| IntQ5 | 71.06 (5.06) | 75.71 (4.69) | −3.67 | ** |
| IntSD | 8.97 (1.94) | 9.69 (1.92) | −2.28 | * |
| IntFracRise | 0.206 (0.130) | 0.225 (0.105) | −2.28 | * |
| SyllableDurM | 0.462 (0.165) | 0.343 (0.113) | 2.51 | * |

**Resignation summary:** Lower F0 (mean), lower F0 variability (SD), lower intensity (mean, Q1, Q5, SD), fewer frames with F0/intensity rise, longer syllable duration (slower rate)

### Table 6: Correlations with Listener Ratings (N=200)

**Strongest correlates of perceived irritation:**
- IntQ5: r = .45***
- IntM: r = .44***
- IntQ1: r = .27***
- F0M: r = .19**
- SyllableDurM: r = .20**
- H1MA3: r = −.19** (negative correlation — creakier voice = more irritated)

**Strongest correlates of perceived resignation:**
- IntQ5: r = −.58***
- IntM: r = −.46***
- F0Q5: r = −.25***
- F0SD: r = −.40***
- F0FracRise: r = −.34***
- IntFracRise: r = −.29***

**Strongest correlates of emotion intensity:**
- IntQ5: r = .46***
- IntM: r = .47***
- IntQ1: r = .30***
- F0M: r = .21**
- F2B: r = .23***

### Table 7: Multiple Regression (β weights, N=195–200)

| Predictor | Irritation (R²=.39) | Resignation (R²=.54) | Neutral (R²=.32) | Emotion Intensity (R²=.38) |
|-----------|--------------------|-----------------------|-------------------|--------------------------|
| IntQ5 | .54*** | −.47*** | −.19** | .51*** |
| F0FracRise | −.31*** | −.34*** | .41*** | −.21* |
| F0FracFall | −.27** | — | .32*** | — |
| F2B | .13* | .12* | −.18** | .23*** |
| Jitter | .16* | — | −.19** | .17** |
| H1MA3 | −.17* | — | — | — |
| IntFracRise | −.17** | — | .16* | −.13* |
| F0Q1 | .13 ns | — | −.14 ns | .10 ns |

**Key finding:** IntQ5 (5th quantile of intensity ≈ maximum intensity) and F0FracRise (% frames with F0 rise) are the two most important predictors across all scales.

## Automatic Detection Results (Table 8)

### Confusion Matrices (% recall)

| Classifier | Irritation | Resignation | Neutral |
|-----------|-----------|-------------|---------|
| LDA (no adapt) | **69.7** | **64.3** | **50.0** |
| LDA (speaker adapt) | **57.6** | **42.9** | **62.5** |
| Human listeners | **56.7** | **45.3** | **71.2** |

- Average recall: 62.3% (no adapt), 54.3% (adapt), 57.7% (human)
- Chance level: 33%
- Key confusion: Irritation↔Neutral, Resignation↔Neutral; rarely Irritation↔Resignation

### Feature Ranking for LDA (Table 9)

**Without speaker adaptation (top 5):**
1. IntQ5 (rank 1.00)
2. IntFracRise (0.56)
3. F1M (0.53)
4. F3M (0.46)
5. F0FracRise (0.41)

**With speaker adaptation (top 5):**
1. F0Q5 (rank 0.63)
2. SyllableDurM (0.56)
3. IntQ5 (0.44)
4. IntSD (0.40)
5. F0FracFall (0.35)

## Parameters

| Name | Description | Irritation Direction | Resignation Direction |
|------|------------|---------------------|---------------------|
| F0M | Mean F0 (log scale) | ↑ higher | ↓ lower |
| F0Q1 | 1st quantile F0 | ↑ higher | — |
| F0Q5 | 5th quantile F0 | ↑ higher | — |
| F0SD | F0 standard deviation | — | ↓ lower |
| F0FracRise | % frames with F0 rise | — | ↓ lower |
| IntM | Mean intensity (dB) | ↑ higher | ↓ lower |
| IntQ1 | 1st quantile intensity | — | ↓ lower |
| IntQ5 | 5th quantile intensity | ↑ higher | ↓ lower |
| IntSD | Intensity std deviation | — | ↓ lower |
| IntFracRise | % frames with intensity rise | ↓ lower | ↓ lower |
| F2B | Median F2 bandwidth | ↑ wider | — |
| H1MA3 | H1* minus A3 amplitude | ↓ lower (creakier) | — |
| SyllableDurM | Mean syllable duration | ↑ longer (slower) | ↑ longer (slower) |
| Jitter | Average period perturbation | — (ns) | — |

## Figures of Interest
- **Table 1 (page 3/87):** Summary of expected acoustic correlates from posed expression literature
- **Table 2 (page 5/89):** Complete acoustic measure definitions (73 measures)
- **Table 4 (page 8/92):** Irritated vs. neutral within-speaker comparison (key data table)
- **Table 5 (page 9/93):** Resigned vs. neutral within-speaker comparison
- **Table 6 (page 10/94):** Correlations between acoustic measures and listener ratings
- **Table 7 (page 12/96):** Multiple regression β weights
- **Table 8 (page 13/97):** LDA confusion matrices vs. human performance
- **Table 9 (page 13/97):** Feature rankings for LDA classifiers

## Results Summary
1. Authentic irritation shows higher F0, higher intensity, wider F2 bandwidth, and slower speech rate — same direction as posed anger but with much smaller effect sizes
2. Authentic resignation shows lower F0, lower F0 variability, lower intensity, and slower speech rate — same direction as posed sadness
3. Irritated speech was unexpectedly *slower* than neutral (contrary to posed anger findings), likely because many "irritated" utterances were originally labeled "emphatic" (hyper-articulated)
4. H1MA3 (spectral tilt at higher formants) was negatively correlated with perceived irritation, suggesting creaky voice quality
5. Clearly perceived exemplars of irritation and resignation were rare — most authentic affective speech is subtle
6. LDA automatic detection (62% recall) matched or exceeded human listener performance (58%)

## Limitations
- Telephone speech at 8 kHz (limited bandwidth, noise)
- Swedish language only
- Short utterances (mostly single words or brief commands)
- Lexical content not controlled (semantic content may confound acoustic measures)
- Small number of resigned utterances (N=14–23)
- Emphatic/hyper-articulated speech classified as "irritated" may have slowed speech rate
- Voice source measures were spectral approximations (H1-H2, H1-A1-3), not inverse-filtered

## Testable Properties
- Irritation: F0 mean increases, intensity mean increases, F0 Q1 and Q5 increase relative to neutral baseline
- Resignation: F0 mean decreases, intensity mean/Q1/Q5 decrease, F0 SD decreases relative to neutral baseline
- Both: syllable duration increases (slower speech rate)
- IntQ5 should be the single best predictor of emotion intensity (r ≈ .46)
- F0FracRise should differentiate neutral (high) from affective (low) speech
- Irritation and resignation rarely confused with each other — they are acoustically distinct

## Relevance to Project
Provides empirically grounded acoustic targets for synthesizing mild, realistic irritation and resignation affects in the Qlatt TTS system. Unlike posed-expression studies that give exaggerated targets, this paper's within-speaker comparisons show the actual magnitude of acoustic changes in spontaneous speech. The key parameters (F0 mean/variability, intensity mean/Q5, F2 bandwidth, syllable duration, H1MA3 spectral tilt) all map directly to Klatt synthesizer controls. Particularly useful finding: intensity cues (IntQ5) are more important than pitch for distinguishing mild affective states from neutral speech.

## Open Questions
- [ ] Would the same acoustic correlates hold for non-telephone (wideband) spontaneous speech?
- [ ] How does the slower speech rate for irritation generalize? Is it specific to emphatic/hyper-articulated irritation?
- [ ] Can the H1MA3 → creaky voice association for irritation be confirmed with EGG or inverse filtering?
- [ ] How do these mild-affect acoustic profiles interact with Qlatt's existing emotion parameter system?

## Related Work Worth Reading
- Banse & Scherer (1996) — posed emotion acoustic profiles (already in collection)
- Laukka (2005) — categorical perception of vocal expressions
- Scherer (1986) — component process theory predictions for emotion acoustics
- Juslin & Laukka (2003) — comprehensive review of vocal expression correlates
- Burkhardt et al. (2008) — anger detection in real call-center data

## Collection Cross-References

### Already in Collection
- [[Banse_1996_VocalEmotionAcousticProfiles]] — cited for posed emotion acoustic profiles; Table 1 directions based on this work
- [[Laukka_2008_AnxietyVocalExpression]] — same first author, different paper (anxiety in social phobics' speech)
- [[Burkhardt_2005_GermanEmotionalSpeechDatabase]] — cited for EmoDB call-center emotion detection work
- [[Hanson_1997_GlottalCharacteristicsFemaleAcoustic]] — cited for voice source spectral correlates
- [[Scherer_2001_VocalEmotionCrossCultural]] — same research group, cross-cultural vocal emotion

### New Leads (Not Yet in Collection)
- Juslin & Laukka (2003) — "Communication of emotions in vocal expression and music performance" — comprehensive review, frequently cited throughout
- Scherer (1986) — "Vocal affect expression: a review and a model for future research" — foundational review, component process theory
- Williams & Stevens (1972) — "Emotions and speech: some acoustical correlates" — early empirical work on authentic emotional speech
- Cowie & Cornelius (2003) — "Describing the emotional states that are expressed in speech" — framework for authentic vs. posed distinctions
