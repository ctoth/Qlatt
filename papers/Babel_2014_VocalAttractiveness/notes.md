# Towards a More Nuanced View of Vocal Attractiveness

**Authors:** Molly Babel, Grant McGuire, Joseph King
**Year:** 2014
**Venue:** PLoS ONE 9(2): e88616
**DOI:** 10.1371/journal.pone.0088616

## One-Sentence Summary

Investigates which acoustic parameters (f0, formant frequencies, voice quality measures, duration) predict vocal attractiveness ratings for 30 male and 30 female Californian English speakers, finding that attractiveness judgments depend on a constellation of features related to apparent vocal tract size, voice quality, and conformity to community speech norms rather than simple f0 or formant position alone.

## Problem Addressed

Prior vocal attractiveness research focused narrowly on f0 and formant dispersion as proxies for sexual dimorphism. This study expands the acoustic feature set to include voice quality measures (H1-H2, H1-A1, H1-A2, H1-A3, HNR, jitter, shimmer), duration, and energy alongside traditional f0 and formant measures, testing whether these additional parameters significantly predict attractiveness ratings.

## Key Contributions

- Demonstrates that vocal attractiveness is multidimensional: a constellation of acoustic features predicts ratings, not just f0 or apparent vocal tract size
- For female voices: voice quality (breathiness via H1-H2 loading on Voice PC1, plus vowel quality PC1 dominated by F2 of /u/) and slightly lower f0 predict attractiveness; breathier female voices rated more attractive
- For male voices: shorter duration and lower F1 for /i/ and /u/ (indicating larger back cavity / apparent vocal tract size) predict attractiveness; f0 is not a significant predictor
- Male and female raters largely agree on attractiveness (r = 0.74 for males, r = 0.86 for females)
- /u/-fronting (higher F2 of /u/) in female voices correlates with attractiveness, suggesting conformity to California speech community norms matters

## Methodology

- 60 speakers (30M, 30F), all Californian English, ages 18-57
- 15 monosyllabic words containing vowels /i, a, u/ (5 each) in CVC frames
- Recordings at 44.1 kHz, normalized to same RMS amplitude
- 30 raters (15M, 15F) rated attractiveness 1-9 scale
- Acoustic measures: f0, f0 SD, F1-F4 per vowel (Bark-transformed), standardized formant position, duration, H1-H2, H1-A1, H1-A2, H1-A3, HNR (0-3.5 kHz), CPP, energy, jitter, shimmer
- PCA to reduce dimensionality separately for vowel quality (F1/F2) and voice quality measures
- Stepwise linear regression with backward selection (p < 0.15) using PCs, duration, f0 mean, f0 SD

## Key Equations

No novel equations. Standard acoustic measures and PCA/regression methodology.

## Parameters

### Table 6: Mean attractiveness ratings (1-9 scale)

| Voice Gender | Rater Gender | Mean | s.d. |
|-------------|-------------|------|------|
| Female | Female raters | 5.05 | 1.89 |
| Female | Male raters | 5.07 | 1.67 |
| Male | Female raters | 4.67 | 1.98 |
| Male | Male raters | 4.05 | 1.99 |

### Table 7: Traditional regression for female voices (f0 + formant position only)

F[2,27] = 5.07, Adjusted r^2 = 0.22, p < 0.05

| Predictor | Estimate | Std. Error | t | p |
|-----------|----------|-----------|---|---|
| Intercept | 6.73 | 1.98 | 3.4 | < 0.01 |
| Average f0 | -0.01 | 0.01 | -1.34 | 0.19 |
| Formant Position | 3.27 | 1.03 | -3.17 | < 0.01 |

### Table 8: Traditional regression for male voices (f0 + formant position only)

F[2,27] = 1, Adjusted r^2 = 0.02, p = 0.27

| Predictor | Estimate | Std. Error | t | p |
|-----------|----------|-----------|---|---|
| Intercept | 5.98 | 1.11 | 5.37 | < 0.001 |
| Average f0 | -0.01 | 0.01 | -1.65 | 0.11 |
| Formant Position | 0.1 | 1.15 | 0.09 | 0.93 |

### Table 9: Full regression for female voices

F[4,25] = 9.4, Adjusted r^2 = 0.54, p < 0.001

| Predictor | Estimate | Std. Error | t | p |
|-----------|----------|-----------|---|---|
| Intercept | 7.93 | 1.57 | 5.05 | < 0.001 |
| Average f0 | -0.02 | 0.01 | -2.21 | < 0.05 |
| Vowel PC1 | 0.48 | 0.17 | 2.85 | < 0.01 |
| Vowel PC3 | 0.52 | 0.28 | 1.82 | 0.08 |
| Female Voice PC3 | -0.26 | 0.09 | -2.95 | < 0.01 |

### Table 10: Full regression for male voices

F[7,22] = 7.23, Adjusted r^2 = 0.60, p < 0.001

| Predictor | Estimate | Std. Error | t | p |
|-----------|----------|-----------|---|---|
| Intercept | 5.67 | 0.63 | 8.96 | < 0.001 |
| Vowel PC1 | -0.31 | 0.18 | -1.75 | 0.09 |
| Vowel PC2 | 0.25 | 0.13 | 1.98 | 0.06 |
| Vowel PC3 | -0.37 | 0.25 | -1.52 | 0.14 |
| Vowel PC4 | -1.75 | 0.33 | -5.27 | < 0.001 |
| Male Voice PC1 | 0.03 | 0.02 | 1.85 | 0.08 |
| Male Voice PC4 | -0.07 | 0.05 | -1.46 | 0.16 |
| Duration | -4.10 | 1.26 | -3.26 | < 0.01 |

### PCA loadings summary

**Vowel Quality PCA** (combined M+F, F1/F2 Bark-transformed per vowel):
- PC1 (70.5% variance): positive loadings on all formants, dominated by F2 /u/ — reflects apparent vocal tract size
- PC4: highly loaded with F1 of /i/ and /u/ — back cavity length indicator

**Female Voice Quality PCA** (Table 3):
- PC1 (64.7% variance): H1-H2u (0.258), H1-A1u (0.258), H1-A2u (0.677), H1-A3u (0.618), HNR35 (0.925), CPP (-0.156) — spectral tilt / breathiness dimension
- PC3 (5.4%): negative H1-H2 loading — secondary breathiness component

**Male Voice Quality PCA** (Table 4):
- PC1 (69.3% variance): similar structure to female — general voice quality
- PC4 (1.7%): loaded with F1 of /i/ and /u/ — back cavity indicator
- PC7 (0.5%): loaded with shimmer and jitter — irregularity

### Zero-order correlations with attractiveness (Tables 11-13)

**All voices pooled (Table 11):**
- F2 /i/: r = 0.54, p < 0.001
- F2 /u/: r = 0.51, p < 0.001
- H1-A2: r = 0.43, p < 0.001
- H1-A3: r = 0.37, p < 0.01
- CPP: r = -0.36, p < 0.01

**Female voices only (Table 12):**
- F2 /i/: r = 0.57, p < 0.01
- F2 /u/: r = 0.55, p < 0.01
- H1-A2: r = 0.48, p < 0.01
- H1-A3: r = 0.43, p = 0.02

**Male voices only (Table 13):**
- F1 /i/: r = -0.64, p < 0.001
- F1 /u/: r = -0.53, p < 0.01
- H1-A2: r = 0.44, p = 0.01

## Implementation Details

### Acoustic measurement procedure
- Praat 5.1.20, Gaussian windows, 2.5 ms step
- Formants: 5 formants in 0-5 kHz (males), 0-5.5 kHz (females); F1-F4 used, F5 unreliable
- Standardized formant position: computed from F1-F4 following Puts et al. [14]
- HNR: VoiceSauce, 0-3.5 kHz range
- Spectral tilt: VoiceSauce measures — H1-H2 (short distance), H1-A1, H1-A2, H1-A3 (longer distance)
- Jitter: average deviation of pitch periods
- Shimmer: average deviation of amplitude across pitch periods
- Duration: onset to offset of spectral energy per word

## Figures of Interest

- **Fig. 1 (page 6):** Scatter plot of male vs. female rater attractiveness ratings showing strong correlation (r = 0.74 for males, r = 0.86 for females); males consistently rate male voices lower
- **Fig. 2 (page 5, implied):** Examples of aspiration noise ratings — not present, but waveform examples from noise judgment scale referenced

## Results Summary

- f0 and formant position alone explain only 22% of female voice attractiveness variance and 2% (non-significant) for males
- Full model with voice quality PCs explains 54% for females and 60% for males
- Female voices: lower f0 (small effect), breathier voice quality (negative Voice PC3 with negative H1-H2 loading), and higher F2 /u/ (fronted /u/, community norm conformity) predict attractiveness
- Male voices: shorter duration and lower F1 for /i/ and /u/ (larger apparent back cavity) are the main predictors; f0 is not significant
- Males rate fellow males as less attractive than females do (mean 4.05 vs 4.67)
- Inter-rater reliability: Kendall's W = 0.274-0.476 (all p < 0.001)

## Limitations

- Correlational design — cannot establish causal links between acoustic features and attractiveness
- Small sample: 30 speakers per gender, 30 raters
- All speakers and raters from California — community-specific norms (especially /u/-fronting) may not generalize
- Monosyllabic words only — no connected speech, prosodic, or rhythmic features
- No control for individual speaker characteristics beyond acoustic measures
- Attractiveness task instructions were deliberately vague — listeners may have used different criteria (mate selection vs. social desirability)

## Testable Properties

- For female voices: breathier voice quality (higher H1-A3, lower CPP) should correlate positively with perceived attractiveness
- For male voices: shorter segment durations and lower F1 for high vowels should correlate with higher attractiveness
- f0 should have a weak negative correlation with female voice attractiveness (slightly lower = more attractive)
- f0 should not significantly predict male voice attractiveness when other measures are controlled
- Male and female rater attractiveness judgments should be highly correlated (r > 0.7)

## Relevance to Project

This paper has marginal direct relevance to the Qlatt synthesizer's core TTS functionality. Its value is primarily as background context for understanding which acoustic features listeners attend to when evaluating voice quality. The spectral tilt correlations (H1-A2, H1-A3 positively correlated with attractiveness) and the finding that breathier female voices are preferred could inform voice preset design if "attractive" voice presets are a goal. The finding that apparent vocal tract size (via F1 of high vowels) matters for male voice attractiveness provides some guidance on formant target selection for male voice presets.

## Open Questions

- [ ] Would the attractiveness predictors generalize to non-Californian English speakers?
- [ ] Could the finding about /u/-fronting be leveraged for dialect-specific voice presets?

## Related Work Worth Reading

- Klatt and Klatt (1990) - Voice quality variations (already in collection)
- Puts et al. (2012) - Vocal tract length and dominance judgments
- Bruckert et al. (2010) - Voice averaging and attractiveness
- Feinberg et al. (2008) - F0 manipulation (PSOLA) and female voice attractiveness (now in collection: **Feinberg_2008_FemininityAveragenessVoicePitch**)

## Collection Cross-References

### Already in Collection
- [[Fitch_1999_VocalTractMorphology]] — cited for VTL-body size relationship underlying formant dispersion measures
- [[Klatt_1990_VoiceQualityVariations]] - cited as ref [43]; voice quality analysis framework
- [[Lisker_Abramson_1964_CrossLanguageVoicingStops]] - VOT framework referenced in introduction
- [[Walton_1994_SpeakerRaceVocalAcoustics]] — cited as ref [4]; race identification from perturbation measures. Both studies show within-normal-range jitter/shimmer/HNR differences are perceptually salient for speaker differentiation.

### New Leads (Not Yet in Collection)
- Puts, D. A., Gaulin, S. J. C., Verdolini, K. (2006) - "Dominance and the evolution of sexual dimorphism in human voice pitch" - vocal tract length and dominance
- Bruckert, L. et al. (2010) - "Vocal Attractiveness Increases by Averaging" - voice merging and HNR

### Now in Collection (previously listed as leads)
- [[Feinberg_2008_FemininityAveragenessVoicePitch]] — F0 manipulation via PSOLA (not vocal tract) shows linear pitch–attractiveness relationship (r = 0.341). Note tension with Babel's finding: Feinberg finds higher F0 = more attractive (zero-order correlation), while Babel's full model shows slightly lower F0 preferred (β = -0.02) once voice quality (breathiness) is controlled. This suggests breathiness covaries with F0 and may mediate the relationship — when you control for breathiness, the residual F0 effect reverses.

### Cited By (in Collection)
- [[Schild_2019_AttractiveVoiceFormantF0]] — large-sample (N=450) pre-registered replication of Babel's PCA methodology, testing whether the data-driven model outpredicting F0+formants holds at scale (Stage 1 Registered Report)
- [[Chen_2022_AcousticMasculinityFemininity]] — uses overlapping acoustic features (F0, formants, spectral tilt, jitter, shimmer); finds perturbation measures least important for masculinity/femininity, while Babel finds breathiness matters most for female attractiveness
- [[Weiss_2020_VoiceAttractiveness]] — edited volume with Babel as Ch.6 author on voice evaluation and recall, extending the attractiveness work

### Conceptual Links (not citation-based)
- [[Liu_2011_FemaleVoiceAttractiveness]] — Perception experiment independently confirms breathiness as the dominant attractiveness cue for female voices (F(2,18) = 73.71), with voice quality effect size far exceeding formant shift and pitch. Both papers converge on voice quality > F0 > formants as the effect size ordering for female vocal attractiveness.
- [[Hughes_2004_VoiceAttractivenessSexualBehavior]] — Hughes shows voice attractiveness predicts body configuration (SHR/WHR) and sexual behavior but does not identify the acoustic features driving ratings; Babel provides those acoustic features (breathiness, apparent VTL), together forming the perception-to-body link chain

- [[Quene_2021_PitchTempoAttractiveness]] — Quene cites Babel for a nuanced view of vocal attractiveness; Quene's finding that pitch and tempo contribute independently to male voice attractiveness complements Babel's finding that voice quality (breathiness) dominates female voice attractiveness. (Moderate)

### Supersedes or Recontextualizes
- None — this paper complements rather than supersedes existing collection entries.
