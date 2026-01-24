# Cortical Voice Processing is Grounded in Elementary Sound Analyses for Vocalization Relevant Sound Patterns

**Authors:** Matthias Staib, Sascha Frühholz
**Year:** 2021
**Venue:** Progress in Neurobiology (Volume 200)
**DOI:** https://doi.org/10.1016/j.pneurobio.2020.101982

## One-Sentence Summary

The temporal voice area (TVA) in auditory cortex is not exclusively selective for voices but processes basic acoustic and perceptual features of sounds along a "voice similarity" dimension, responding to non-voice sounds with voice-like patterns when they share rudimentary perceptual similarity with voices.

## Problem Addressed

Previous research claimed the TVA selectively processes voices, but this selectivity is questionable because:
1. The TVA spans too large an area to be solely reserved for voice processing
2. Voice patches overlap with regions for social tasks and visual processing
3. Acoustic/textural differences between voices and non-voices could explain TVA activity

## Key Contributions

1. Demonstrated that textural sound patterns (TSPs) - synthetic non-voice sounds - can elicit activity in large subregions of the TVA
2. Successfully reconstructed TVA voice-processing activation patterns using linear combinations of TSP activation patterns
3. Showed that perceptual "voice similarity" ratings drive TVA activity over and above acoustic features
4. Cross-classification analysis confirmed common neural representation between voices and TSPs in TVA

## Methodology

### Participants
- 25 volunteers for fMRI experiment (14 female, mean age 26.4 years)
- 23 independent volunteers for sound ratings (not in fMRI)

### Stimuli
- **Natural sounds:** 70 vocalizations (speech/non-speech) + 70 non-vocal sounds (500ms each) from Belin et al., 2000
- **TSPs:** 400 textural sound patterns generated from modulated noise using Gaussian Sound Synthesis Toolbox
  - Selected from 10,000 initial TSPs based on k-nearest neighbor classification
  - Varied in frequency and temporal correlation parameters (0.01-2 range)
  - Final selection: 200 lowest + 200 highest voice similarity ratings

### fMRI Protocol
- 3T Philips Ingenia scanner with 32-channel head coil
- TR 1.6s, TE 30ms, FA 82°, voxel size 2.75 × 2.75 × 3.5mm
- 5 blocks of 80 TSPs each, followed by TVA localizer block (140 natural sounds)
- One-back task (orthogonal to main analysis)

### Key Analyses
1. **Parametric modulation:** Voice similarity ratings as modulator with 15 acoustic features
2. **Pattern reconstruction:** L1-regularized regression to reconstruct voice-minus-non-voice pattern from TSP patterns
3. **Multi-voxel pattern analysis (MVPA):** SVM classification within and across sound sets

## Key Equations

### Reconstruction Model (Full)
$$
\text{Weights} \sim \text{Acoustic feature}_1 + \ldots + \text{Acoustic feature}_{15} + \text{voice similarity} + \text{Error}
$$

### Nested Baseline Model
$$
\text{Weights} \sim \text{Acoustic feature}_1 + \ldots + \text{Acoustic feature}_{15} + \text{Error}
$$

Model comparison via likelihood ratio test ($\chi^2_1$ distributed).

## Parameters

| Name | Symbol | Value/Range | Notes |
|------|--------|-------------|-------|
| TSP frequency correlation | - | 0.01-2 | Steps of 0.02 |
| TSP temporal correlation | - | 0.01-2 | Steps of 0.02 |
| Sound duration | - | 500 ms | All stimuli |
| Sound intensity | - | 70 dB | Scaled in Praat |
| Voice similarity rating | - | 1-10 scale | 1=dissimilar, 10=similar |
| Max reconstruction weights | - | 140 | L1 regularization constraint |
| Classification train/test split | - | 80%/20% | 5-fold cross-validation |

## Acoustic Features Analyzed (15 total, from GeMAPS)

**Energy/Amplitude:**
- Loudness (perceived intensity from auditory spectrum)

**Spectral balance:**
- Spectral slope 0-500 Hz
- Spectral slope 500-1500 Hz

**Spectral balance/shape/dynamics:**
- MFCC 1-4 (mel-frequency cepstral coefficients)
- Spectral flux (difference between consecutive frames)

For loudness: 20th, 50th, 80th percentiles; range 20-80th; mean/SD of rising/falling slopes.

## Implementation Details

### TSP Generation (Gaussian Sound Synthesis Toolbox v1.1)
- Cochleagrams have multivariate, Gaussian-distributed, log-energy time-frequency decomposition
- Controllable decay constants for frequency and temporal correlation
- Results in varying degrees of structure over time and frequency

### Pattern Reconstruction Procedure
1. Model each TSP trial with separate GLM (least-squared single trial approach)
2. Use 400 resulting β-maps as basis functions
3. Compute L1-regularized (lasso) regression weights to match target [voice - non-voice] pattern
4. 10-fold cross-validation for optimal λ penalty parameter
5. Maximum 140 non-zero weights allowed

### Classification Schemes
- (i) natural → natural (5-fold CV)
- (ii) TSP → TSP (5-fold CV)
- (iii) natural → TSP (cross-classification)
- (iv) TSP → natural (cross-classification)

### ROI Definition
- **TVA:** Anatomical region Te3 (Morosan et al., 2005)
- **Primary AC:** Te1.0, Te1.1, Te1.2
- **Secondary AC:** BA42
- **Higher AC:** Te3, MTG, STG
- Functional ROI: voxels responding to any sound at p=0.01 uncorrected

## Key Results

### Voice Similarity Ratings
- TSP ratings: 2.0-57.9% (highest TSP rated 3.42, comparable to non-vocal animal sound at 3.52)
- Acoustic features explain 38.9% of TSP voice similarity variance
- Only 6 of 12 predictive acoustic features shared between TSPs and natural sounds

### Pattern Reconstruction
- Reconstruction accuracy: R² > 0.9 for both hemispheres
- Average 110 non-zero weights (out of max 140)
- Voice similarity explains weight variance over acoustic features:
  - Left TVA: χ²₁ = 13.3, p = 2.6 × 10⁻⁴
  - Right TVA: χ²₁ = 32.5, p = 1.2 × 10⁻⁸

### Classification Accuracies
- Voices vs non-voices: 66.3% (L), 66.4% (R), p = 2 × 10⁻⁷
- High vs low TSPs: 61.0% (L, p=0.005), 58.9% (R, p=0.0002)
- Cross-classification (TSP→natural): 58.2% (L), 57.2% (R), p = 0.0009

### Cross-Prediction Model Comparison
- Left TVA: χ²₁ = 19.1, p = 1.3 × 10⁻⁵
- Right TVA: χ²₁ = 24.4, p = 7.9 × 10⁻⁷

## Figures of Interest

- **Fig. 1 (p.3):** Acoustic space comparison (shimmer, harmonics-to-noise ratio), experimental design, TVA localizer results, parametric modulation
- **Fig. 2 (p.4):** Acoustic features modulating primary and higher AC activity
- **Fig. 3 (p.7):** Pattern reconstruction from synthetic sounds - target vs reconstructed TVA patterns
- **Fig. 4 (p.8):** Common neural representation - classification accuracies across sound domains

## Limitations

1. TSP selection based on perceptual quality, not acoustic features - precludes perfect acoustic matching
2. Results capture categorical voice/non-voice distinction only - does not challenge TVA's role in encoding specific voice information (identity, etc.)
3. Some acoustic features may be underestimated due to selection strategy

## Relevance to Project

### Direct Relevance to Klatt Synthesis
- **Acoustic features that matter:** Spectral flux had largest extended activations in TVA; loudness parameters and MFCCs also relevant
- **Perceptual voice similarity:** Abstract perceptual quality beyond measurable acoustics influences voice perception
- **TSP generation approach:** Could inform how to create "voice-like" synthetic stimuli

### Implications for TTS
1. **Quality metrics:** Perceptual voice similarity as abstract dimension separate from acoustic matching
2. **Feature priorities:** Spectral flux (temporal spectral change) particularly important for voice perception
3. **Neural basis:** TVA uses similar processing for voices and non-voices along perceptual similarity gradient

### Not Directly Applicable
- This is a neuroscience study of perception, not a synthesis paper
- No specific parameter values for synthesis
- No algorithmic procedures for TTS

## Open Questions

- [ ] What specific acoustic manipulations would maximize perceptual voice similarity in synthetic speech?
- [ ] How does the voice similarity gradient relate to naturalness/intelligibility in TTS?
- [ ] Could reconstruction weights inform feature weighting in synthesis quality metrics?

## Related Work Worth Reading

- Belin et al., 2000 - Original TVA localizer methodology and stimuli
- McDermott et al., 2011 - Gaussian Sound Synthesis Toolbox (TSP generation)
- Eyben et al., 2016 - GeMAPS acoustic parameter set
- Norman-Haignere & McDermott, 2018 - Primary vs higher AC computational differences
- Formisano et al., 2008 - MVPA approach to voice/speech processing

## Tools/Resources Mentioned

- **Gaussian Sound Synthesis Toolbox v1.1** - TSP generation
- **openSmile v2.3.0** - Acoustic feature extraction
- **SPM12** - fMRI preprocessing
- **CAT12** - Computational Anatomy Toolbox
- **The Decoding Toolbox v3.96** - MVPA classification
- **Praat** - Sound intensity scaling
- **Prevalence-Permutation toolbox** - Statistical testing for information-like measures
