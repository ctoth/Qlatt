---
title: "Are Attractive Female Voices Really Best Characterized by Feminine Fundamental and Formant Frequencies?"
authors: "Christoph Schild, David R. Feinberg, David A. Puts, Julia Junger, Vanessa Fasolt, Iris Holzleitner, Kieran O'Shea, Rebecca Lai, Ruben Arslan, Amanda Hahn, Rodrigo A. Cardenas, Lisa M. DeBruine, & Benedict C. Jones"
year: 2019
venue: "Evolution and Human Behavior (Stage 1 Registered Report)"
doi_url: "Not provided in manuscript; OSF: https://osf.io/8hma7/"
---

# Are Attractive Female Voices Really Best Characterized by Feminine Fundamental and Formant Frequencies?

## One-Sentence Summary
A large-sample (N=450) registered replication of Babel et al. (2014) testing whether a data-driven PCA model of voice quality measures (HNR, spectral tilt, jitter, shimmer, CPP, energy, duration) predicts women's vocal attractiveness better than a theory-driven model using only F0 and formant frequencies.

## Problem Addressed
Most research on vocal attractiveness has focused almost exclusively on fundamental frequency (F0) and formant frequencies as predictors, based on theory that these sexually dimorphic traits signal mate quality. Babel et al. (2014) challenged this with a small-sample (N=30 female) bottom-up PCA approach showing other acoustic characteristics (HNR, spectral tilt, shimmer, etc.) predicted attractiveness better. This study tests whether those findings replicate at scale.

## Key Contributions
- Pre-registered replication with 15x the voice sample size (450 vs 30 female voices)
- Direct comparison of theory-driven (F0 + formant position) vs data-driven (PCA of broader acoustic measures) models
- Tests four specific hypotheses about which acoustic features predict vocal attractiveness
- Open materials and analysis code (OSF)

## Methodology
1. **Stimuli**: 450 mono voice recordings of young adult women saying "Hi, I'm a student at the University of Glasgow" (Audio-Technica AT-4041, 44.1 kHz, 16-bit)
2. **Attractiveness ratings**: 90 raters (45 heterosexual men, 45 heterosexual women) rate each voice 1-7; each rater evaluates 150 randomly selected voices; ICC target > 0.8
3. **Acoustic measures** (following Babel et al., 2014):
   - Mean F0, SD of F0 (Praat, Gaussian windows, 2.5 ms step)
   - F1, F2, F3, F4 from both vowels in "students," averaged across vowels
   - Standardized formant position: mean of standardized F1-F4
   - HNR (0-3.5 kHz)
   - Duration (onset to offset of each word)
   - Spectral tilt (5 measures per Babel et al. 2014)
   - Jitter (average pitch period deviation)
   - Shimmer (average amplitude deviation of pitch periods)
   - CPP (cepstral peak prominence, breathiness measure)
   - Energy (RMS over pitch pulses)
4. **Analysis**: Four hypothesis tests using linear regression, backwards selection, PCA, 10-fold cross-validation (100 repeats, 1000 resamples), AIC comparison, t-tests on variance explained

## Parameters

| Name | Symbol | Units | Default | Range | Notes |
|------|--------|-------|---------|-------|-------|
| Mean F0 | f0 | Hz | — | ~150-300 (female) | Measured via Praat |
| SD of F0 | f0_sd | Hz | — | — | Variability measure |
| Formant 1 | F1 | Hz | — | — | From "students" vowels |
| Formant 2 | F2 | Hz | — | — | From "students" vowels |
| Formant 3 | F3 | Hz | — | — | From "students" vowels |
| Formant 4 | F4 | Hz | — | — | From "students" vowels |
| Standardized formant position | Pf | — | — | — | Mean of z-scored F1-F4 / 4 |
| HNR | HNR | dB | — | — | 0-3.5 kHz range |
| Duration | dur | s | — | — | Onset to offset |
| Spectral tilt | — | dB | — | — | 5 measures (Babel et al. 2014) |
| Jitter | — | — | — | — | Avg pitch period deviation |
| Shimmer | — | — | — | — | Avg amplitude deviation |
| CPP | CPP | dB | — | — | Cepstral peak prominence |
| Energy | — | dB | — | — | RMS over pitch pulses |

## Implementation Details
- **Standardized formant position (Pf)**: Standardize each formant measure (F1-F4) across the sample, sum the four z-scores, divide by 4. This is a composite measure of overall vocal tract resonance position.
- **PCA procedure**: Two separate PCAs: (1) on F1-F4 to get formant PCs, (2) on HNR, duration, spectral tilt, jitter, shimmer, CPP, energy to get voice quality PCs. Number of PCs selected by parallel analysis (Horn, 1965).
- **Backwards selection regression**: Start with all PCs + mean F0 + SD of F0 as predictors. Remove non-significant predictors stepwise.
- **Cross-validation**: 10-fold CV with 100 repeats (1000 total resamples) to estimate variance reliably explained by each model.
- **Tools**: Praat 6.0.37 for F0/formants/jitter/shimmer/HNR; VoiceSauce for spectral tilt/CPP/energy.
- **Amplitude normalization**: All voices normalized to 70 dB RMS before rating.

## Figures of Interest
- **Fig 1 (page 7):** Rating interface screenshot (1-7 Likert scale with "play" button)

## Hypotheses Tested

1. **H1**: Simple linear regression with mean F0 + standardized formant position significantly predicts attractiveness
2. **H2**: Backwards selection model with broader acoustic PCA measures significantly predicts attractiveness
3. **H3**: The data-driven model (H2) explains significantly more variance than the theory-driven model (H1)
4. **H4**: A model with mean F0 + first formant PC explains less variance than a model with first two voice quality PCs (HNR, spectral tilt, jitter, shimmer, CPP, energy PCs)

## Results Summary
This is a Stage 1 Registered Report (accepted in principle). Results were not yet collected at time of manuscript. The paper describes methodology and planned analyses in detail.

## Limitations
- Only female voices analyzed (results may not generalize to male voices)
- Single utterance per speaker (limited phonetic context)
- University-age sample only (16-30 years)
- Does not test oral contraceptive effects on voice
- Attractiveness rated by Western listeners (cultural generalizability unknown)
- This is a registered report — no results at manuscript stage

## Testable Properties
- Standardized formant position Pf = mean(z(F1), z(F2), z(F3), z(F4)), always bounded by individual z-score extremes
- ICC for attractiveness ratings must exceed 0.8 for analyses to proceed
- Cross-validated R^2 must be non-negative (model must outperform null)
- If H3 supported: data-driven model R^2_cv > theory-driven model R^2_cv
- Exclusion criterion: voices with any acoustic measure > 3 SD from sample mean are removed

## Relevance to Project
This paper provides methodological detail on how to measure and compare acoustic predictors of vocal attractiveness, including a clear operationalization of formant position, voice quality PCA, and cross-validated model comparison. For Qlatt's speaker personality system, the acoustic measure definitions (particularly standardized formant position, HNR measurement range, and the PCA decomposition of voice quality into orthogonal dimensions) could inform how voice quality presets are parameterized. The paper also provides a comprehensive list of Praat/VoiceSauce measurement procedures that could serve as validation targets.

## Open Questions
- [ ] What were the actual results? (Need to find the Stage 2 publication)
- [ ] Did the data-driven model actually outperform the F0+formant model at N=450?
- [ ] Which PCs survived backwards selection?

## Related Work Worth Reading
- Babel, M., McGuire, G., & King, J. (2014). Towards a More Nuanced View of Vocal Attractiveness. *PLOS ONE* — the original study being replicated
- Holzleitner et al. (2018). A data-driven model of women's facial attractiveness reliably outperforms theory-driven models. *PsyArXiv* — parallel approach for faces
- Pisanski et al. (2016). Voice parameters predict sex-specific body morphology. *Animal Behaviour* — voice-body links
- Fraile & Godino-Llorente (2014). Cepstral peak prominence: A comprehensive analysis — CPP methodology
- Shue et al. (2011). VoiceSauce: A program for voice analysis — tool used for spectral tilt/CPP/energy

## Collection Cross-References

### Already in Collection
- [[Babel_2014_VocalAttractiveness]] — the original study being replicated; Schild et al. test whether Babel's finding (voice quality PCA outpredicts F0+formants) holds at N=450
- [[Collins_2003_VocalVisualAttractiveness]] — cited as prior small-sample (N=30 female) bottom-up study of attractive voice characteristics
- [[Feinberg_2008_FemininityAveragenessVoicePitch]] — cited for F0 manipulation studies showing higher F0 increases women's vocal attractiveness
- [[Feinberg_2011_IntegratingF0FormantPreferences]] — cited for evidence that F0 and formant frequencies interact when judging men's vocal attractiveness

### New Leads (Not Yet in Collection)
- Holzleitner et al. (2018) — "A data-driven model of women's facial attractiveness reliably outperforms theory-driven models" — parallel face study using same data-driven vs theory-driven comparison methodology
- Shue, Keating, Vicenik, & Yu (2011) — "VoiceSauce: A program for voice analysis" — tool for spectral tilt/CPP/energy measurement, relevant for voice quality analysis pipeline

### Cited By (in Collection)
- (none found — Karthikeyan_2023 cites a different Schild 2020 paper, not this one)

### Conceptual Links (not citation-based)

**Vocal attractiveness and voice quality:**
- [[Borkowska_2011_F0DominanceAttractiveness]] — Borkowska found a nonlinear (inverted-U) F0-attractiveness relationship for female voices peaking ~280 Hz; Schild's H1 tests whether F0 is even a reliable predictor at all when broader voice quality is controlled — potential convergence if Schild's data-driven model subsumes the nonlinear F0 effect
- [[Weiss_2020_VoiceAttractiveness]] — comprehensive edited volume consolidating voice attractiveness research including chapters by Babel and others; provides broader context for the theory-driven vs data-driven debate Schild addresses
- [[Karthikeyan_2023_ArticulatoryStatusAttractiveness]] — found that jitter (not F0/formants) differentiated attractive male speakers, paralleling Schild's hypothesis that voice quality measures beyond F0/formants matter more for attractiveness
- [[Quene_2021_PitchTempoAttractiveness]] — Quene manipulates F0 and tempo in male speakers and finds pitch has a larger effect than tempo, with an asymmetric pattern (only negative deviations reduce ratings). Consistent with Schild's finding that the F0-loaded PCA component is a strong predictor. (Moderate)

**Voice source and spectral measures:**
- [[Iseli_2007_VoiceSourceAgeSexVowel]] — provides age- and sex-specific norms for the spectral tilt measures (H1-H2, H1-A1, etc.) that Schild uses as predictors via PCA; the sex differences in spectral tilt documented by Iseli are exactly the kind of "other acoustic characteristics" Schild hypothesizes drive attractiveness

**Speaker discrimination and voice variability:**
- [[Keating_2016_AcousticSimilarityFemaleVoices]] — Keating identifies CPP, SHR, F3, F4, and energy as the top discriminators of individual female voices via LDA; these overlap with the spectral measures Schild uses in PCA for attractiveness prediction, suggesting the same acoustic dimensions that make voices distinct also relate to attractiveness judgments
- [[Lee_2019_AcousticVoiceVariation]] — Lee's PCA on voice variability (same measures, same database) identifies harmonic/inharmonic balance and formant dispersion as the dominant axes, providing context for which of Schild's PCA dimensions reflect within-speaker versus between-speaker variation
