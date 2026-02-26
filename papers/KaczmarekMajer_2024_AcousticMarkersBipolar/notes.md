# Acoustic Features from Speech as Markers of Depressive and Manic Symptoms in Bipolar Disorder: A Prospective Study

**Authors:** Katarzyna Kaczmarek-Majer, Monika Dominiak, Anna Z. Antosik, Olgierd Hryniewicz, Olga Kaminska, Karol Opara, Jan Owsinski, Weronika Radziszewska, Malgorzata Sochacka, Lukasz Swiecicki
**Year:** 2024 (published 2025)
**Venue:** Acta Psychiatrica Scandinavica
**DOI:** 10.1111/acps.13735

## One-Sentence Summary
This study provides empirically-validated correlations between acoustic speech features (prosodic, spectral, voice quality) and affective states in bipolar disorder patients, with specific parameter values and sex-differentiated patterns useful for implementing emotional/affective speech synthesis.

## Problem Addressed
Voice features could be sensitive markers of affective state in bipolar disorder, but prior studies were short (up to 3 months), included few participants, and examined only selected voice parameters. This study addresses the need for validation of various speech parameters as markers of depressive and manic symptoms across a large sample with long-term monitoring.

## Key Contributions
- Largest prospective study (n=51 patients, avg 208 days) correlating acoustic features with clinically-assessed BD symptoms
- Identified significant correlations between 89 acoustic parameters and mood states
- Discovered strong sex differences: male and female patterns are often exactly opposite
- Achieved 70.9-71.4% accuracy predicting BD phase from voice features alone
- Identified specific feature subsets for BD phase prediction

## Methodology
- Smartphone app (BDmon) collected voice during daily phone calls
- Voice signal processed in 20ms frames, parameters extracted using openSMILE (eGeMAPS feature set)
- Psychiatrists assessed symptoms using HDRS-17 (depression) and YMRS (mania) scales every 3 months
- Linear mixed-effects regression models with patient-specific random intercepts
- Features from 7 days before to 2 days after psychiatric visit associated with that assessment

## Key Equations

### Mixed Effects Model Structure
$$
y_{ij} = \beta_0 + \beta_1 x_{ij} + u_j + \epsilon_{ij}
$$
Where:
- $y_{ij}$ = symptom score (HDRS or YMRS)
- $x_{ij}$ = acoustic parameter value
- $\beta_0$ = fixed intercept
- $\beta_1$ = fixed effect coefficient for acoustic parameter
- $u_j$ = patient-specific random intercept
- $\epsilon_{ij}$ = residual error

## Parameters

### Prosodic Features

| Name | Symbol/Variable | Units | Correlation (Male Mania) | Correlation (Male Depression) | Notes |
|------|-----------------|-------|--------------------------|-------------------------------|-------|
| Loudness | loudness_sma3 | dB (relative) | β = 1.6 (louder) | β = -1.07 (quieter) | Primary prosodic marker |
| Log Energy | pcm_LOGenergy_sma | dB | β = 1.4 (more energetic) | β = -1.15 (less energetic) | Correlates with loudness |
| F0 (pitch) | f0_final_sma | Hz | β = 0.7 (higher) | - | Higher tone in mania |
| F0 envelope | f0_env_sma | Hz | β = 0.51 | - | Pitch contour |
| F1 frequency | f1_frequency_sma3nz | Hz | β = 0.71 | - | First formant |
| F2 frequency | f2_frequency_sma3nz | Hz | β = 0.69 | - | Second formant |
| Bandwidth | bandwidth_sma3nz | Hz | β = 0.99 | - | Formant bandwidth |
| Speaking time | patient_speaking_in_sec | seconds | β = 1.64 | β = 0.56 | Duration marker |
| Call length | length_of_call_sec | seconds | β = 1.22 | β = 0.42 | Total call duration |
| Speaking rate | patient_speaking_rate | words/sec | β = 0.61 | - | Speech tempo |

### Spectral Features

| Name | Symbol/Variable | Units | Correlation (Male Mania) | Correlation (Male Depression) | Notes |
|------|-----------------|-------|--------------------------|-------------------------------|-------|
| Spectral flux | pcm_fftmag_spectralflux_sma | - | β = 1.35 (clearer speech) | β = -1.0 (more slurred) | Speech clarity marker |
| Spectral harmonicity | pcm_fftmag_spectralharmonicity_sma_compare | - | β = 0.69 | β = -1.0 | Harmonic content |
| Psychoacoustic sharpness | pcm_fftmag_psysharpness_sma_compare | - | β = 0.95 (sharper) | - | Perceptual sharpness |

### Voice Quality Features

| Name | Symbol/Variable | Units | Correlation (Male Mania) | Correlation (Male Depression) | Notes |
|------|-----------------|-------|--------------------------|-------------------------------|-------|
| Jitter (DDP) | jitter_ddp_sma | % | β = 1.15 (rougher) | β = -0.63 (less rough) | Pitch perturbation |
| Jitter (local) | jitter_local_sma | % | β = 1.11 | β = -0.57 | Local pitch variation |
| Shimmer (local) | shimmer_local_sma | % | β = 1.13 | - | Amplitude perturbation |
| HNR | loghnr_sma | dB | β = 0.57 | - | Harmonics-to-noise ratio |

### Female Patterns (Often Opposite to Males)

| Feature | Mania Correlation | Depression Correlation | Notes |
|---------|-------------------|------------------------|-------|
| Loudness | β = -0.27 (quieter) | No significant correlation | Opposite to males |
| Energy | β = -0.24 | - | Opposite to males |
| F1 frequency | β = -0.21 (lower) | - | Opposite to males |
| F2 frequency | β = -0.23 (lower) | - | Opposite to males |
| Spectral flux | β = -0.25 (less clear) | - | Opposite to males |
| Jitter | β = -0.18 (less rough) | - | Opposite to males |

### Cutoff Points for BD Phase Classification

| State | Lower Cutoff | Higher Cutoff |
|-------|--------------|---------------|
| Depression | HDRS ≥ 8, YMRS < 6 | HDRS ≥ 13, YMRS < 13 |
| Mania/Hypomania | HDRS < 8, YMRS ≥ 6 | HDRS < 13, YMRS ≥ 13 |
| Mixed | HDRS ≥ 8, YMRS ≥ 6 | HDRS ≥ 13, YMRS ≥ 13 |
| Euthymia | HDRS < 8, YMRS < 6 | HDRS < 13, YMRS < 13 |

## Implementation Details

### Signal Processing Pipeline
1. Record speech during phone calls via smartphone app
2. Process signal in 20ms frames (assumed stationary)
3. Discard first/last 500 frames (10s each end)
4. Minimum 30s speaking time required per call
5. Apply Otsu's method for automatic noise removal (threshold selection)
6. Extract parameters using openSMILE library (eGeMAPS feature set)
7. Compute arithmetic average of each parameter per call

### Feature Sets for Prediction

**RFE (Recursive Feature Elimination) Selected Features:**
- pcm_fftmag_spectralminpos
- pcm_fftmag_fband_0-250
- slope_0-500
- f0
- f1_frequency
- pcm_fftmag_mfcc_9
- f2_frequency
- pcm_zcr
- pcm_fftmag_fband_250-650_sma_compare
- f0_final

**Expert-Selected Features:**
- loudness
- pcm_log_energy
- f0_final, f0, f0env
- f1frequency, f2_frequency
- spectralflux
- fftmag_spectral_centroid
- spectral_harmonicity
- jitter_ddp, jitter_local
- shimmer_local
- loghnr

### Model Performance

| Model | Accuracy | Depression Sensitivity | Mania/Mixed Sensitivity |
|-------|----------|------------------------|-------------------------|
| GLM (expert features) | 0.71 | 0.61 | 0.52 |
| GLM (RFE features) | 0.71 | 0.62 | 0.56 |
| Random Forest | 0.63 | 0.24 | 0.20 |
| Decision Tree | 0.59 | 0.22 | 0.10 |

## Figures of Interest
- **Fig 1 (page 8):** Relations between acoustic parameters and symptoms by sex - shows regression coefficients with 95% CI for all 89 parameters
- **Fig 2 (page 9):** Relations between acoustic parameters and HDRS Q8 (psychomotor retardation) and YMRS Q6 (speech rate/amount)
- **Table 2 (page 6):** Main hypotheses - expected voice changes in mania vs depression
- **Table 3 (page 11):** Model performance comparison across classifiers
- **Table 4 (page 11):** Confusion matrix for GLM predictions

## Results Summary
- Prosodic, spectral, and voice quality parameters are valid markers of BD symptom severity
- Male patterns: mania → louder, higher pitch, clearer, sharper, longer speech; depression → quieter, less clear
- Female patterns: often exactly opposite to males, or no correlation
- 70.9-71.4% accuracy discriminating euthymia from affective states
- Spectral flux particularly promising - reflects speech clarity/accentuation

## Limitations
- Sample size relatively small (n=51), though largest prospective study to date
- Cross-validation may overestimate performance (temporal correlation not accounted)
- Medication effects on voice not considered
- Manic patients often turned off phones or uninstalled app → missing data
- No healthy control group (compared to euthymia instead)

## Relevance to Project
For Qlatt speech synthesis:
- **Voice quality modeling:** Jitter/shimmer values indicate roughness levels for different emotional states
- **Prosodic parameter targets:** Loudness, F0, speaking rate correlations provide targets for emotional speech
- **Sex-differentiated synthesis:** Male and female emotional speech require different parameter directions
- **Spectral features:** Spectral flux/harmonicity relate to speech clarity - could inform formant synthesis gain/bandwidth settings

## Open Questions
- [ ] How do medication effects manifest in voice parameters?
- [ ] Are these patterns culture/language-specific or universal?
- [ ] Can within-subject normalization improve predictions?
- [ ] What are the causal mechanisms for sex differences?

## Related Work Worth Reading
- Faurholt-Jepsen et al. (2016) - Voice analysis as objective state marker in BD
- Karam et al. (2014) - Long-term mood monitoring using speech in BD
- Eyben et al. (2016) - GeMAPS feature set specification
- Low et al. (2020) - Systematic review of psychiatric disorder assessment from speech
- Cummins et al. (2015) - Review of depression and suicide risk assessment using speech

---

## Collection Cross-References

### Already in Collection
- (none found)

### New Leads (Not Yet in Collection)
- **Eyben et al. (2016) - GeMAPS feature set** - Defines the standard acoustic feature set used in this study. Essential for understanding what parameters to extract and how they're computed. Directly relevant for implementing voice quality analysis.
- **Cummins et al. (2015) - Depression/suicide assessment from speech** - Comprehensive review of acoustic features for depression detection. Provides broader context for which features matter for emotional state recognition.
- **Faurholt-Jepsen et al. (2016a) - Voice analysis in BD** - Prior work specifically on voice as state marker in bipolar disorder. Good comparison point for parameter correlations.
- **Karam et al. (2014) - Long-term mood monitoring via speech** - Ecologically valid speech monitoring in BD - addresses similar question with different methodology.
- **Low et al. (2020) - Systematic review** - Most recent systematic review of speech-based psychiatric assessment. Provides comprehensive overview of the field and identifies gaps.
