# Acoustic Characterization and Machine Prediction of Perceived Masculinity and Femininity in Adults

**Authors:** Fuling Chen, Roberto Togneri, Murray Maybery, Diana Tan
**Year:** 2022
**Venue:** Preprint submitted to Speech Communication (arXiv:2102.07982v2)
**DOI/URL:** https://arxiv.org/abs/2102.07982

## One-Sentence Summary
Identifies F0 mean as the dominant acoustic predictor of perceived masculinity/femininity (43.5% for males, 23.8% for females), with F3/F4/VTL estimators second, using hierarchical clustering to build 8-9 independent acoustic factor groups from 23 measures.

## Problem Addressed
Prior studies examined small subsets of acoustic measures and did not address multicollinearity among features, limiting ability to determine which independent acoustic factors truly drive perceived masculinity and femininity ratings.

## Key Contributions
- First machine learning model (Extreme Random Forest) for predicting perceived masculinity/femininity ratings from acoustic measures (r_test = .77 males, .63 females)
- Novel hierarchical clustering method to build independent acoustic feature groups, eliminating multicollinearity (all VIF < 5)
- Comprehensive characterization of 9 independent clusters (females) and 8 independent clusters (males) with weighted importance rankings
- Optimal speech duration of 7 seconds for masculinity/femininity assessment
- First study to identify F0 SD as an independent predictor comparable in importance to F1 mean and F2 mean

## Methodology
- 225 Caucasian Australian speakers (96 male, 129 female), reading Rainbow Passage
- Rated by 25-30 listeners on masculinity (males, 1-10) and femininity (females, 1-10/1-100) scales
- 23 acoustic measures extracted via Praat/Parselmouth (see Table 3)
- Extreme Random Forest (ERF) regression with exhaustive hyperparameter search, 4-fold cross-validation
- Hierarchical clustering on correlation matrix using Euclidean distance measure with average linkage
- VIF monitoring to determine optimal number of clusters (VIF < 5 threshold)
- PCA representation of multi-measure clusters as single variables

## Key Equations

Distance between two acoustic measures:
$$d(u,v) = \sqrt{\sum_{k=1}^{23} (|r(u,k)| - |r(v,k)|)^2}$$

Average linkage cophenetic distance:
$$D(s,t) = \frac{\sum_{u=1}^{N_s} \sum_{v=1}^{N_t} d(u,v)}{N_s \cdot N_t}$$

Variance Inflation Factor:
$$VIF_i = 1/(1 - R_i^2)$$
Where $R_i^2$ is the coefficient of determination from regressing measure $x_i$ on all other measures.

## Parameters

### 23 Acoustic Measures (Table 3)

| # | Name | Category | Notes |
|---|------|----------|-------|
| 1 | F0 mean | Pitch | Mean fundamental frequency |
| 2 | F0 SD | Pitch | Standard deviation of F0 |
| 3 | HNR | Perturbation | Harmonics-to-Noise Ratio |
| 4 | local Jitter | Jitter | |
| 5 | local absolute Jitter | Jitter | |
| 6 | rap Jitter | Jitter | |
| 7 | ppq5 Jitter | Jitter | |
| 8 | ddp Jitter | Jitter | |
| 9 | local Shimmer | Shimmer | |
| 10 | apq3 Shimmer | Shimmer | |
| 11 | apq5 Shimmer | Shimmer | |
| 12 | apq11 Shimmer | Shimmer | |
| 13 | dda Shimmer | Shimmer | |
| 14 | F1 mean | Formant | First formant frequency |
| 15 | F2 mean | Formant | Second formant frequency |
| 16 | F3 mean | Formant | Third formant frequency |
| 17 | F4 mean | Formant | Fourth formant frequency |
| 18 | pF | VTL estimate | Formant position |
| 19 | fdisp | VTL estimate | Formant dispersion |
| 20 | avgFormant | VTL estimate | Average formant frequency |
| 21 | mff | VTL estimate | Geometric mean formant frequency |
| 22 | Fitch VTL | VTL estimate | Fitch vocal tract length estimate |
| 23 | ΔF | VTL estimate | Formant spacing |

### Cluster Importance Weights (Figure 7)

**Females (9 independent clusters):**

| Rank | Cluster | Weight | Enclosed Measures | VIF |
|------|---------|--------|-------------------|-----|
| 1 | F0 mean | 23.80% | F0 mean | 1.46 |
| 2 | F3, F4 mean, VTL estimators | 12.95% | F3, F4, pF, fdisp, avgFormant, mff, Fitch VTL, ΔF | 1.81 |
| 3 | F1 mean | 11.23% | F1 mean | 1.09 |
| 4 | F2 mean | 11.14% | F2 mean | 1.86 |
| 5 | F0 SD | 10.64% | F0 SD | 1.09 |
| 6 | apq11 shimmer | 7.70% | apq11 shimmer | 1.65 |
| 7 | jitter | 7.68% | local, absolute, rap, ppq5, ddp jitter | 2.22 |
| 8 | HNR | 7.61% | HNR | 2.50 |
| 9 | shimmer | 7.27% | local, apq3, apq5, dda shimmer | 2.86 |

**Males (8 independent clusters):**

| Rank | Cluster | Weight | Enclosed Measures | VIF |
|------|---------|--------|-------------------|-----|
| 1 | F0 mean | 43.54% | F0 mean | 1.62 |
| 2 | F3, F4 mean, VTL estimators | 16.36% | F3, F4, pF, fdisp, avgFormant, mff, Fitch VTL, ΔF | 1.50 |
| 3 | F0 SD | 7.91% | F0 SD | 1.61 |
| 4 | F2 mean | 7.74% | F2 mean | 1.45 |
| 5 | F1 mean | 7.17% | F1 mean | 1.14 |
| 6 | HNR and shimmer | 6.76% | HNR, local, apq3, apq5, dda shimmer | 2.05 |
| 7 | jitter | 5.76% | local, absolute, rap, ppq5, ddp jitter | 1.69 |
| 8 | apq11 shimmer | 4.77% | apq11 shimmer | 1.42 |

### Model Performance (Table 5, 7-second duration)

| Metric | Female Train | Female Test | Male Train | Male Test |
|--------|-------------|-------------|------------|-----------|
| R² | .73 | .37 | .78 | .57 |
| MSE | .09 | .22 | .13 | .25 |
| r | .91 | .63 | .90 | .77 |

### Model Performance After Clustering (Table 7)

| Sex | Clusters | R²_test | MSE_test | r_test |
|-----|----------|---------|----------|--------|
| Female | 9 | .34 | .23 | .61 |
| Male | 8 | .53 | .28 | .73 |

## Implementation Details

### Dataset
- Two cohorts: 2015 (22M, 22F) and 2019 (74M, 107F)
- Second sentence of Rainbow Passage only (~2-3 seconds)
- Segmented into 1, 2, 5, 7, and 10-second windows
- 7-second duration optimal for both genders
- Ratings z-scored per listener, then averaged per speaker

### ERF Hyperparameters (Appendix A)
- n_estimator = 1000
- Grid search: max_depth = 10, max_leaf_nodes = 300, min_samples_leaf = 2, min_samples_split = 2
- 4-fold cross validation, splits by speaker ID
- StandardScaler normalization on all 23 measures

### Hierarchical Clustering (Appendix B)
- Distance: Euclidean between correlation profiles (Eq. 2), NOT 1-r
- Linkage: average
- Multi-measure clusters represented by first PCA component
- Iteration: 23 clusters → progressively merge until 1 cluster, monitoring VIF at each step
- Stop at max VIF < 5

## Figures of Interest
- **Fig 2 (page 10):** Correlation matrices for females (left) and males (right) — shows multicollinearity structure
- **Fig 3 (page 15):** Dendrograms for females and males — shows clustering order
- **Fig 4 (page 16):** VIF vs. number of clusters — threshold at VIF = 5
- **Fig 5 (page 16):** Correlation matrix of clustered measures — shows independence achieved
- **Fig 7 (page 19):** Cluster importance pie charts for females (left) and males (right) — KEY RESULT

## Results Summary

### Key Findings
1. **F0 mean is the dominant predictor** for both genders, contributing 43.54% for male masculinity and 23.80% for female femininity — nearly 2x more important for males
2. **F3, F4 mean and VTL estimators** are the second most important cluster (~13-16%), reflecting vocal tract length
3. **F1 mean, F2 mean, and F0 SD** each contribute ~7-11% — approximately equal importance
4. **Voice perturbation measures** (HNR, jitter, shimmer) are the least important, collectively ~22% for females and ~17% for males
5. **F0 SD** is an independent predictor — first study to demonstrate this
6. For males, HNR groups with shimmer; for females, they remain separate clusters
7. Machine prediction better for males (r=.77) than females (r=.63), consistent with vocal cues being more salient for male masculinity judgments

### Correlation Structure
- F0 mean and ΔF (formant spacing/VTL) are **independent** of each other (consistent with Cartei et al., Feinberg et al.)
- F0 mean, F1 mean, and F2 mean are independent
- F3 mean highly correlated with VTL estimators: r(F3,ΔF) = .87 females, .70 males
- F4 mean even more strongly correlated with VTL estimators than F3 mean
- All 5 jitter measures cluster tightly together
- Shimmer measures cluster together (except apq11 which is somewhat independent)

## Limitations
- Read speech only (Rainbow Passage) — spontaneous speech may differ
- Caucasian Australian speakers only
- Binary biological sex categories only
- One rating per speaker applied to all segments (no within-speaker variation)
- Training/test gap suggests some overfitting (R²_train=.73 vs R²_test=.37 for females)

## Testable Properties
- F0 mean should be the strongest single predictor of perceived masculinity/femininity
- F0 and formant dispersion (ΔF) should be independent (low correlation)
- F0 mean and F1 mean should be independent
- F3 and F4 mean should be highly correlated with VTL estimators (r > .7)
- All 5 jitter measures should form a single cluster (inter-r > .6)
- F0 mean should contribute proportionally more to male masculinity than female femininity
- Optimal speech duration for stable ratings: ~7 seconds
- VIF should drop below 5 at 8-9 clusters from 23 original measures

## Relevance to Project
This paper establishes the relative perceptual importance of acoustic parameters for gendered voice quality. For Qlatt voice presets:
- **F0 mean is the primary lever** for masculinity/femininity — confirms findings from Feinberg 2008/2011 and others
- **F3/F4/VTL estimators** (second most important) map to vocal tract length, which affects all formant frequencies proportionally
- **F1 and F2** are independent factors — individual vowel formant targets matter beyond just VTL scaling
- **Perturbation measures matter little** — jitter, shimmer, and HNR contribute <25% combined, suggesting voice quality fine-tuning is less critical than F0 and formant settings for gender perception
- The nearly 2x F0 importance asymmetry (43.5% male vs 23.8% female) means male voice presets need F0 even more precisely targeted than female

## Open Questions
- [ ] How do these cluster weights translate to specific Hz changes needed for perceptual shifts?
- [ ] Would the same cluster structure hold for non-read speech (spontaneous, emotional)?
- [ ] How do these findings interact with the attractiveness findings in Feinberg 2008/2011?
- [ ] What is the minimum F0 shift needed to change perceived masculinity by 1 rating point?

## Related Work Worth Reading
- Cartei et al. [1] (2014) — F0 and ΔF correlates of women's ratings of vocal masculinity
- Feinberg et al. [2] (2006) — Menstrual cycle effects on masculinity preferences
- Feinberg et al. [3] (2005) — F0 and formant frequency manipulations on attractiveness
- Pisanski et al. [4] (2011) — Prioritization of F0 vs formants for speaker assessments
- Munson [8] (2007) — Perceived masculinity, femininity, and sexual orientation
- Biemans [10] (2000) — Gender variation in voice quality (thesis)

## Collection Cross-References

### Already in Collection
- [[Feinberg_2008_FemininityAveragenessVoicePitch]] — cited as Feinberg et al. [2] (2006) and [3] (2005) for F0 manipulation studies on femininity preferences; Chen confirms F0 dominance with quantified importance weights
- [[Feinberg_2011_IntegratingF0FormantPreferences]] — cited for F0 × formant interaction in attractiveness; Chen's clustering confirms F0 and VTL estimators are independent factors
- [[Fant_1960_AcousticTheorySpeechProduction]] — cited for acoustic theory foundations; provides the source-filter framework underlying the 23 acoustic measures used
- [[Babel_2014_VocalAttractiveness]] — related work on vocal attractiveness using overlapping acoustic features (F0, formants, spectral tilt, jitter, shimmer); Babel finds breathiness matters for female attractiveness, while Chen finds perturbation measures least important for masculinity/femininity
- [[Collins_2003_VocalVisualAttractiveness]] — related work on vocal attractiveness and formant frequencies in women; both studies confirm higher formant frequencies relate to perceived femininity
- [[Simpson_2009_PhoneticGenderDifferences]] — related review of phonetic gender differences; Chen's clustering importance weights quantify the relative contribution of each acoustic dimension Simpson surveys qualitatively
- [[Hanson_1997_GlottalCharacteristicsFemaleAcoustic]] / [[Hanson_1999_GlottalMaleSpeakers]] — related work on gender-specific voice source parameters; Hanson's spectral tilt measures relate to Chen's perturbation cluster but Chen finds these are least important for gender perception
- [[Cartei_2014_VoiceMasculinity]] — cited as [1]; direct predecessor showing F0 and deltaF mediate perceived vocal masculinity via path analysis; Chen confirms F0 dominance with quantified importance weights from random forests

### New Leads (Not Yet in Collection)
- Pisanski & Rendall (2011) — "The prioritization of voice fundamental frequency or formants in listeners' assessments of speaker size, masculinity, and attractiveness" — tests F0 vs formant weighting directly
- Munson (2007) — "The acoustic correlates of perceived masculinity, perceived femininity, and perceived sexual orientation" — extends to sexual orientation dimension
- Biemans (2000) — "Gender variation in voice quality" — PhD thesis on gender and voice quality

### Supersedes or Recontextualizes
- Partially supersedes individual findings in [[Feinberg_2008]] and [[Feinberg_2011]] by providing quantified importance weights for each acoustic factor, whereas Feinberg studies manipulated F0 and formants in isolation without addressing multicollinearity

### Cited By (in Collection)
- [[Cartei_2014_VoiceMasculinity]] — cites Chen; confirms F0 and deltaF independence with quantified importance weights
- [[Babel_2014_VocalAttractiveness]] — references Chen's finding that perturbation measures are least important for masculinity/femininity
- [[Nittrouer_1990_AcousticMeasurementsVoice]] — Chen's PCA clustering aligns with Nittrouer's sex-specific noise source findings
- [[Weiss_2020_VoiceAttractiveness]] — includes Chen in attractiveness parameter overview
- [[Fitch_1999_VocalTractMorphology]] — cites Chen for VTL sex differences
