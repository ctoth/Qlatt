# Acoustical Properties of Speech as Indicators of Depression and Suicidal Risk

**Authors:** Daniel J. France, Richard G. Shiavi, Stephen Silverman, Marilyn Silverman, D. Mitchell Wilkes
**Year:** 2000
**Venue:** IEEE Transactions on Biomedical Engineering, Vol. 47, No. 7
**DOI/URL:** S 0018-9294(00)05121-1

## One-Sentence Summary
This paper demonstrates that multivariate acoustic features (formants, power spectral density, amplitude modulation) can discriminate between normal, depressed, and suicidal speech with 75-94% accuracy, providing quantitative evidence for how psychological state affects vocal production.

## Problem Addressed
Healthcare providers need improved physiologically-based indicators to complement clinical judgment when assessing depression and suicidal risk. Traditional single-parameter acoustic analyses (e.g., F0 mean alone) have proven inadequate; this paper tests whether multi-parameter classifiers using formant, PSD, and AM features can achieve better discrimination.

## Key Contributions
- First multivariate acoustic analysis comparing normal, depressed, and high-risk suicidal speech
- Demonstrated that formant and PSD features outperform F0 features for classification
- Achieved 82% accuracy discriminating control vs. major depressed (males), 80% for control vs. suicidal
- Found that suicidal speech has unique acoustic characteristics distinct from depression
- Identified power spectral flattening (shift from low to high frequencies) as marker of depression/suicidality

## Methodology
Two independent studies:
1. **Study #1 (Females):** 10 control, 17 dysthymic, 21 major depressed - all unmedicated
2. **Study #2 (Males):** 24 control, 21 major depressed, 22 high-risk suicidal

Speech samples: ~2.5 minutes continuous speech per subject, segmented into 20-second frames
Recording: 10 kHz sampling, 16-bit ADC, 5 kHz anti-aliasing filter

Four acoustic analysis domains:
- Fundamental frequency (F0): cepstral analysis
- Amplitude modulation (AM): RMS averaging
- Formants: 12th-order LPC, 15ms frames
- Power spectral density (PSD): Welch method, 40ms frames, 1024-pt FFT

Statistical methods: ANOVA with Bonferroni correction, MANOVA, linear/quadratic discriminant analysis with jackknife validation

## Key Equations

### F0 Statistics Computed
Six statistics per 20-second segment:
- Range: $F_{0,max} - F_{0,min}$
- Variance: $\sigma^2_{F_0}$
- Mean: $\bar{F_0}$
- Skewness
- Kurtosis
- Coefficient of variation: $CV = \sigma_{F_0} / \bar{F_0}$

### Power Spectral Density Bands
$$PSD_1 = \text{0-500 Hz}, \quad PSD_2 = \text{501-1000 Hz}$$
$$PSD_3 = \text{1001-1500 Hz}, \quad PSD_4 = \text{1501-2000 Hz}$$

Power percentages in each band were computed relative to total 0-2000 Hz power.

### Formant Analysis
12th-order AR model using LPC:
$$H(z) = \frac{G}{\prod_{k=1}^{6}(1 - z_k z^{-1})(1 - z_k^* z^{-1})}$$

Formant frequencies $F_1, F_2, F_3$ and bandwidths $FBW_1, FBW_2, FBW_3$ extracted from pole locations.

## Parameters

| Name | Symbol | Units | Normal (Control) | Depressed | Suicidal | Notes |
|------|--------|-------|------------------|-----------|----------|-------|
| First formant | $F_1$ | Hz | 331-383 (M) | 381-422 | 414-463 | Elevated in depression |
| Second formant | $F_2$ | Hz | 1130-1212 (M) | 1158-1250 | 1188-1296 | Elevated in depression |
| Third formant | $F_3$ | Hz | 2002-2072 (M) | 2105-2191 | 2072-2186 | Elevated in depression |
| F1 bandwidth | $FBW_1$ | Hz | 225-259 (M) | 288-336 | 270-322 | Increased in depression |
| F2 bandwidth | $FBW_2$ | Hz | 598-644 (M) | 543-595 | 507-575 | Decreased in depression |
| F3 bandwidth | $FBW_3$ | Hz | 605-660 (M) | 608-660 | 566-642 | Variable |
| PSD Band 1 | $PSD_1$ | % | 0.67-0.81 (M) | 0.70-0.78 | 0.60-0.72 | Lower in suicidal |
| PSD Band 2 | $PSD_2$ | % | 0.12-0.16 (M) | 0.16-0.24 | 0.19-0.25 | Higher in dep./suicidal |
| PSD Band 3 | $PSD_3$ | % | 0.04-0.08 (M) | 0.02-0.03 | 0.05-0.09 | Variable |
| PSD Band 4 | $PSD_4$ | % | 0.03-0.09 (M) | 0.02-0.04 | 0.03-0.07 | Variable |
| AM Range | - | - | - | Elevated | Normal | Males only |
| AM Skewness | - | - | - | Elevated | Normal | Males only |

## Implementation Details

### Pre-processing Pipeline
1. Digitize at 10 kHz with 5 kHz anti-aliasing filter
2. Remove extraneous noise and non-subject voices
3. Remove silent pauses > 0.5 seconds
4. Segment into ~20-second frames at zero-crossings
5. Detrend and normalize: subtract mean, divide by standard deviation

### Formant Extraction (LPC)
- Frame size: 15 ms
- Model order: 12 (yields 6 pole pairs)
- Extract $F_1, F_2, F_3$ from pole angles
- Extract $FBW_1, FBW_2, FBW_3$ from pole radii
- Time-average across all frames

### PSD Estimation (Welch Method)
- Frame size: 40 ms
- FFT size: 1024 points
- Window: 100-point Hamming (non-overlapping)
- Frequency range: 0-2000 Hz
- Output: percentage power in each 500 Hz subband

### Classification Approach
1. Compute features for each 20-second segment
2. Average to get mean feature vector per subject
3. Check multivariate normality (Q-Q plots, projections)
4. Compare covariance matrices (Chi-square test)
5. Apply linear discriminant (equal covariance) or quadratic discriminant (unequal)
6. Use jackknife (hold-one-out) for small samples (N < 30)

## Figures of Interest
- **Table IV (page 834):** Female classification scores - FBW2, FBW3, PSD1, PSD2 best discriminators
- **Table VI (page 834):** Female formant statistics with 95% CI
- **Table VII (page 834):** Female PSD statistics with 95% CI
- **Table IX (page 835):** Male formant statistics - shows elevated F1, F2, F3 in depression
- **Table X (page 835):** Male PSD statistics - shows power shift to higher frequencies
- **Table XI (page 835):** Male classification scores - 82% control vs. depressed, 80% control vs. suicidal

## Results Summary

### Best Discriminating Features
| Comparison | Features | Accuracy |
|------------|----------|----------|
| Control vs. Major Depressed (F) | FBW2, FBW3, PSD1, PSD2 | 94% |
| Control vs. Major Depressed (M) | F1, FBW1, PSD2 | 82% |
| Control vs. Suicidal (M) | F1, PSD2 | 80% |
| Major Depressed vs. Suicidal (M) | AM Range, AM CoeffVar, PSD3 | 81% |
| All three classes (M) | AM Skewness, F1, F3, PSD2 | 75% |

### Key Acoustic Patterns in Depression/Suicidality
- **Increased formant frequencies** (F1, F2, F3) - contradicts some earlier studies
- **Increased FBW1** (wider first formant bandwidth)
- **Decreased FBW2, FBW3** (narrower higher formant bandwidths)
- **Spectral flattening**: less power in 0-500 Hz, more power in 500-1500 Hz
- **F0 features generally ineffective** as discriminators

## Limitations
- Small sample sizes (N < 30 per group) reduce statistical power
- Recording equipment/environment not standardized for suicidal samples
- Some subjects in Study #2 were medicated (tricyclic antidepressants can cause dry mouth)
- LPC formant estimation less accurate than LTAS method
- Power spectrum highly influenced by phonation loudness
- Study #1 (females) had no suicidal group for comparison
- Study #2 (males) included medicated subjects, potentially confounding results

## Relevance to Project

### For Qlatt Speech Synthesis
This paper provides empirical acoustic profiles for different emotional/psychological states that could inform:

1. **Voice quality modeling**: Depression/suicidality correlates with:
   - Elevated formant frequencies (slight vocal tract constriction?)
   - Narrower higher formant bandwidths (increased vocal tract tension?)
   - Spectral flattening (reduced source energy in low frequencies?)

2. **Prosody modeling**: F0 features were surprisingly ineffective - suggests the "monotone" quality of depressed speech may be more about:
   - Formant rigidity than pitch flatness
   - Spectral tilt changes rather than F0 contour changes

3. **Affect synthesis parameters**: If implementing emotional voice quality, consider:
   - F1, F2, F3 shifts as primary markers
   - FBW (formant bandwidth) modulation
   - Power distribution across frequency bands (spectral tilt)
   - AM characteristics (for male voices especially)

### Cautions
- The finding that formant frequencies *increase* in depression contradicts earlier work (Hargreaves & Starkweather 1965, Whitman & Flicker 1966) - unclear why
- Results may reflect psychomotor retardation (increased muscle tension/rigidity) rather than emotional state per se

## Open Questions
- [ ] Why do formant frequencies increase in depression when earlier studies found decreases?
- [ ] How much does medication affect these acoustic markers?
- [ ] Are there sex differences in how depression manifests acoustically?
- [ ] What is the relationship between perceived "flat affect" and measured acoustic flatness?
- [ ] Can these features be modeled parametrically in a synthesizer?

## Related Work Worth Reading
- Stassen (1988) "Modeling affect in terms of speech parameters" - multi-parameter models [42]
- Scherer (1986) "Vocal affect expression: A review and model for future research" - comprehensive review [37]
- Darby, Simons & Berger (1984) "Speech and voice parameters of depression: A pilot study" [8]
- Sobin & Sackeim (1997) "Psychomotor symptoms of depression" - theoretical basis for motor symptoms [41]
- Flint et al. (1992) "Acoustic analysis in differentiation of Parkinson's disease and major depression" [10]

---

## Collection Cross-References

### Already in Collection
- [[Stevens_1989_QuantalNatureSpeech]]

### New Leads (Not Yet in Collection)
- **Scherer (1986) [37]** - "Vocal affect expression: A review and a model for future research" - Comprehensive theoretical framework for how emotion affects voice production. Essential for understanding the mechanisms behind the acoustic changes observed.
- **Stassen (1988, 1991) [42, 43]** - Multi-parameter modeling of affect in speech. Provides theoretical justification for why single-parameter (F0-only) approaches fail, which this paper empirically confirms.
- **Laver (1980) [20]** - "The Phonetic Description of Voice Quality" - Authoritative framework for describing voice quality features phonetically. Important for understanding how to parameterize the observed acoustic changes.
- **Flint et al. (1992) [10]** - Differentiating Parkinson's disease from depression acoustically. Relevant because it explores how different neurological/psychological conditions with similar "flat affect" perception differ acoustically.
- **Hargreaves & Starkweather (1965) [12]** - Earlier study that found *decreased* formant frequencies in depression (opposite to this paper's findings). Important to understand why results conflict.
