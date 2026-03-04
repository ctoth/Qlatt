# Investigation on Pleasure Related Acoustic Features of Affective Speech

**Authors:** Dandan Cui, Lianhong Cai, Yongxin Wang, Xiaozhou Zhang
**Year:** 2006
**Venue:** ISCSLP 2006 (International Symposium on Chinese Spoken Language Processing), Kent Ridge, Singapore
**DOI/URL:** ISCA Archive

## One-Sentence Summary
Identifies 5 acoustic features (spectral rolloff, spectral low-high ratio, average F0, min F0, F0 dominant ratio) correlated with the pleasure-displeasure dimension of emotional speech in Mandarin, demonstrating that spectral features are the primary carriers of pleasure/valence while F0 features primarily encode arousal.

## Problem Addressed
Most acoustic correlates of emotion map to arousal rather than valence/pleasure. This paper attempts to find features specifically correlated with the pleasure-displeasure (P) dimension of the PAD emotion model, independent of arousal (A).

## Key Contributions
- Uses PAD (Pleasure-Displeasure, Arousal-Nonarousal, Dominance-Submissiveness) continuous emotion model instead of discrete categories
- Introduces a novel feature: **F0 Dominant Ratio** designed to capture the dominant pitch distribution
- Demonstrates through factor analysis and co-clustering that P-correlated features are separable from A-correlated features
- Shows spectral features (rolloff, low-high ratio) are more strongly correlated with pleasure than prosodic features (F0, duration)
- Validates through perceptual testing that modifying pleasure features does not alter perceived arousal

## Methodology
Three-stage process on a Mandarin Chinese emotional speech corpus:
1. **Feature selection**: 76 candidates → 37 (correlative coefficients with P) → 15 (factor analysis + co-clustering) → 5 (second round factor analysis + co-clustering)
2. **Modeling**: Stepwise linear regression with 6 basis functions to predict feature values from P ordinate
3. **Modification**: TD-PSOLA for prosodic features, LP-PSOLA for spectral features, perceptual evaluation

### Corpus
- 11 emotional categories: exuberant, relaxed, docile, disdainful, disgusted, angry, fearful, anxious, surprised, sad, neutral
- 10 passages per category, ~100 syllables each, with embedded emotionally unbiased sentence
- 20 college speakers (10 male, 10 female)
- 2200 passages total
- Study analysis on 124 sentences from one male speaker
- PAD values annotated using validated Chinese PAD scales

## Key Equations

### Correlative Coefficient
$$R(i,j) = \frac{C(i,j)}{\sqrt{C(i,i) \cdot C(j,j)}}$$
Where: $C(i,j)$ is covariance between feature $i$ and PAD ordinate $j$

### Factor Analysis Model
$$x = \mu + \Lambda f + \varepsilon$$
Where: $x$ = observed variables, $\mu$ = mean, $\Lambda$ = factor loadings matrix (MLE), $f$ = common factors (set to 3 for PAD), $\varepsilon$ = error

### Mutual Information (Co-clustering)
$$I(S;E) = \sum_s \sum_e p(s,e) \log_2 \frac{p(s,e)}{p(s) \cdot p(e)}$$
Where: $E = \{e_1,...,e_M\}$ features, $S = \{s_1,...,s_N\}$ samples; 11 sample clusters, 3 feature clusters

### F0 Dominant Ratio (novel feature)
$$\text{DominantRatio}(F0) = \frac{\text{Average}(F0) - \text{Min}(F0)}{\text{Range}(F0)}$$
Where: Range(F0) = Max(F0) - Min(F0). Designed to reflect the dominant distribution of pitch within an utterance.

### Regression Basis Functions
Six elementary functions used for stepwise regression of P to feature values:
$$P, \quad P^2, \quad \exp(P), \quad \exp(-P), \quad \arctan(P), \quad \text{atanh}(P/2.5)$$

## Parameters

### Initial Candidate Feature Set (76 features)

| Category | Features | Count |
|----------|----------|-------|
| Spectral | Spectral Centroid, Roll off, Slope, Low-high Ratio, Flux, Band Periodicity (2000-4000 Hz), MFCC 1-13, first-order diffs of above | ~40 |
| Energy | Short Term Energy (avg, std dev) | 2 |
| F0 | Average, Std dev, Max, Min, Range, Dominant Ratio, avg/std of 1st-order diffs, slope, intercept, median, avg/median ratio, (avg-min)/(median-min) | ~18 |
| Syllable duration | Average, Std dev, Max, Min, Range, Dominant Ratio, avg/std of 1st-order diffs, slope, intercept | ~12 |
| Pause duration | Average, Std dev, Max, Min, Range, Dominant Ratio, avg/std of 1st-order diffs, slope, intercept | ~12 |
| Other | Ratio of syllable duration to total utterance length | 1 |

### Final 5 Selected Features

| Feature | Symbol | Factor Loading (P) | Description |
|---------|--------|-------------------|-------------|
| Spectral Roll off | Rolloff | 0.96255 (F1) | Frequency below which some % of spectral energy is contained |
| Spectral Low-high Ratio | LhRatio | 0.93921 (F1) | Ratio of low-frequency to high-frequency spectral energy |
| Average F0 | MeanF0 | 0.19521 (F1) | Mean fundamental frequency of utterance |
| Min. F0 | MinF0 | 0.96265 (F1) | Minimum fundamental frequency of utterance |
| F0 Dominant Ratio | DominantRatio | 0.25862 (F3) | (Avg F0 - Min F0) / Range(F0) |

### Factor Analysis Results (Table 2, 15-feature set)

| Feature | Factor 1 (P) | Factor 2 (A?) | Factor 3 (D?) |
|---------|-------------|---------------|---------------|
| Rolloff | **0.89543** | -0.04424 | 0.43671 |
| LhRatio | **0.96255** | -0.06584 | 0.21523 |
| MeanF0 | **0.19521** | -0.0567 | -0.02901 |
| MinF0 | **0.96265** | 0.021872 | 0.061001 |
| DominantRatio | 0.0076053 | 0.032609 | **0.25862** |
| P (pleasure) | **0.8336** | 0.19723 | -0.04077 |
| A (arousal) | -0.26857 | 0.20011 | **-0.4571** |
| D (dominance) | 0.0076053 | 0.032609 | **0.25862** |

## Implementation Details

### Feature Extraction
- All features computed at utterance level (intonation phrase), not segment level
- Features normalized using z-scores to eliminate segmental dependence
- Focus on global/long-term features, not local micro-prosody

### Modification Pipeline
1. Prosodic features (F0, duration) modified using **TD-PSOLA**
2. Spectral features modified using **LP-PSOLA**
3. Features integrated and sequenced carefully to minimize artifacts
4. Modifications applied as z-score offsets: -1 (displeasure) to +1 (pleasure) in 7 steps

### Perceptual Test Design
- 8 untrained listeners
- 5 groups: (1) spectral only, (2) MeanF0+MinF0, (3) spectral+MeanF0+MinF0, (4) MeanF0+MinF0+DominantRatio, (5) all 5 features
- 7 samples per group from displeasure to pleasure
- Rated on 5-degree scale [-2, 2]
- Listeners also chose favorite group

## Figures of Interest
- **Fig 1 (page 4):** Feature selection pipeline flowchart: 76 → 37 → 15 → 5
- **Fig 2 (page 7):** Scatter plot of 11 emotions in PA space with bar charts of 5 features for selected emotion categories. Shows spectral features (Rolloff, LhRatio) vary clearly with P while MeanF0 and MinF0 vary with A.

## Results Summary

### Feature Selection
- Spectral features show highest correlative coefficients with P
- In factor analysis, P and A land in separate groups/factors
- Co-clustering confirms P, A, D are in separate groups
- DominantRatio groups with D rather than P in co-clustering

### Perceptual Test
- **Group 1** (spectral only) and **Group 3** (spectral + F0 avg/min) perform best — listeners prefer spectral modification
- No listener reported feeling arousal variation — P-oriented features are successfully separated from A-oriented ones
- F0 Dominant Ratio provides little perceptual benefit in conversion
- F0 features (MeanF0, MinF0) perform poorly alone — may function in P intensity but differently from how they affect A

### Key Finding on Spectral vs Prosodic
- **Spectral features (Rolloff, LhRatio) are the primary carriers of the pleasure dimension**
- F0 features primarily encode arousal; their contribution to pleasure is secondary
- This aligns with findings in the broader literature that valence is harder to encode acoustically than arousal

## Limitations
- Study uses only one male speaker for analysis
- F0 Dominant Ratio promising in factor analysis but fails in conversion experiment
- Mandarin is a tonal language, complicating F0-based emotion features
- Small corpus (124 sentences for final analysis)
- Modeling uses only utterance-level global features, no contextual effects
- Conversion experiment is preliminary — only feature selection stage fully developed
- DominantRatio may be affected by creaky voice at sentence endings (observed in sad speech)

## Testable Properties
- Modifying spectral rolloff and low-high ratio should change perceived pleasure without affecting perceived arousal
- Spectral features should have higher correlation with P than F0 features
- F0 Dominant Ratio should be approximately independent of arousal (different factor in factor analysis)
- DominantRatio(F0) must be in [0, 1] by definition (bounded ratio)
- Average F0 must be >= Min F0, so DominantRatio >= 0

## Relevance to Project
This paper provides modest support for the principle that valence/pleasure in emotional speech is carried primarily by spectral properties (spectral tilt, spectral balance) rather than F0 prosodic features, which aligns with findings from ZeiPollermann 2002 and Belyk 2014 in our collection. For Qlatt, the spectral rolloff and low-high ratio features could inform voice quality parameter settings (spectral tilt via TL, formant amplitudes) when targeting pleasant vs. unpleasant voice presets. However, the study is limited to Mandarin, uses only one speaker, and the conversion experiment is preliminary.

## Open Questions
- [ ] Does DominantRatio(F0) generalize to non-tonal languages?
- [ ] How do Rolloff and LhRatio map to Klatt parameters (TL, AV, spectral tilt)?
- [ ] Would the spectral features identified here align with our existing emotion parameter profiles from Banse 1996 and Gobl 2003?

## Related Work Worth Reading
- Chuenwattanapranithi et al. 2006 — Expressing anger and joy with pitch code
- Cook et al. 2006 — Evaluation of affective valence using pitch substructure (IEEE TASLP)
- Schroder et al. 2001 — Acoustic correlates of emotion dimensions in view of speech synthesis (Eurospeech)
- Ladd et al. 1985 — Evidence for independent function of intonation contour type, voice quality, and F0 in signaling speaker affect

## Collection Cross-References

### Already in Collection
- **Ladd_2008_IntonationalPhonology** — cited as Ladd et al. 1985 (different work by same author); the 1985 JASA paper on independent function of intonation contour type, voice quality, and F0 is not in the collection, but Ladd's 2008 book is
- **ZeiPollermann_2002_AcousticPatternsEmotions** — complementary finding: F0/energy/rate differentiate arousal but not valence, while LTAS spectral energy in 300-3400 Hz differentiates anger from joy. Directly supports Cui's conclusion that spectral features carry valence
- **Belyk_2014_AcousticValenceEmotion** — demonstrates valence coding depends on emotion family (motivational vs moral vs aesthetic), with different Pitch x Loudness rules per family. Extends Cui's finding that valence is not simply one acoustic dimension
- **Gobl_2003_VoiceQualityEmotion** — voice quality primarily signals arousal/activation rather than valence. Consistent with Cui's finding that spectral balance (not voice quality parameters per se) carries pleasure information
- **Banse_1996_VocalEmotionAcousticProfiles** — comprehensive emotion profiles; high-arousal emotions show elevated F0 and energy, confirming Cui's F0-arousal association

### New Leads (Not Yet in Collection)
- Cook et al. (2006) — "Evaluation of the affective valence of speech using pitch substructure" IEEE TASLP — complementary approach using pitch distribution structure for valence detection
- Schroder et al. (2001) — "Acoustic correlates of emotion dimensions in view of speech synthesis" Eurospeech — directly relevant for mapping emotion dimensions to synthesis parameters
- Chuenwattanapranithi et al. (2006) — "Expressing anger and joy with the size code" — F0 manipulation for emotion expression

### Cited By (in Collection)
- (none found)
