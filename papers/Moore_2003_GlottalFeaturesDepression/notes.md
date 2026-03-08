# Investigating the Role of Glottal Features in Classifying Clinical Depression

**Authors:** Elliot Moore II, Mark Clements, John Peifer, Lydia Weisser
**Year:** 2003
**Venue:** EMBC 2003 (25th Annual International Conference of the IEEE Engineering in Medicine and Biology Society)
**DOI/URL:** 0-7803-7789-3/03/$17.00 ©2003 IEEE

## One-Sentence Summary
This paper demonstrates that glottal waveform features (timing ratios, shimmer, spectral tilt) can classify clinical depression with up to 100% accuracy for females, providing specific feature extraction methods for voice-based affect detection.

## Problem Addressed
Prior work on depression classification focused primarily on prosodic features (pitch, energy, speaking rate) and spectral characteristics (formants, PSD). Glottal waveform features, despite showing strong correlations in speaker characterization and stress analysis, had not been systematically evaluated for emotional disorder classification.

## Key Contributions
- Identifies specific glottal waveform features that distinguish depressed from non-depressed speakers
- Achieves 100% classification accuracy for females using spectral tilt at 3700 Hz
- Introduces a two-level statistical analysis framework (intra-sentence and inter-sentence statistics)
- Provides threshold-based method for consistent glottal phase boundary detection

## Methodology
1. Glottal waveform estimation via inverse filtering (LP analysis)
2. Feature extraction: timing phases, ratios, shimmer, spectral characteristics
3. Two-level statistical aggregation (intra-sentence → inter-sentence)
4. ANOVA for feature significance testing
5. GMM classification with leave-one-out validation

## Key Equations

### Speech Production Model
$$
Speech = G(z) \cdot V(z) \cdot R(z)
$$
Where:
- $G(z)$ = glottal waveform transfer function
- $V(z)$ = vocal tract transfer function
- $R(z)$ = lip radiation (modeled as differentiator)

### Vocal Tract Model (LP)
$$
V(z) \Rightarrow \frac{1}{A(z)} \Rightarrow \frac{1}{1 + \sum_{i=1}^{p} a_i z^i}
$$
Where:
- $a_i$ = LP coefficients
- $p$ = LP order

### Shimmer (Linear)
$$
Shm = \frac{\frac{1}{N-1} \sum_{i=1}^{N-1} |A_i - A_{i+1}|}{\frac{1}{N} \sum_{i=1}^{N} A_i}
$$
Where:
- $A_i$ = amplitude of glottal pulse $i$
- $N$ = number of pulses

### Shimmer (dB)
$$
Shm_{dB} = \frac{1}{N-1} \sum_{i=1}^{N-1} \left| 20 \log \left( \frac{A_{i+1}}{A_i} \right) \right|
$$

## Parameters

| Name | Symbol | Units | Default | Range | Notes |
|------|--------|-------|---------|-------|-------|
| Opening Phase | OP | samples/ms | - | - | Time from glottal opening to max |
| Closing Phase | CP | samples/ms | - | - | Time from max to closure |
| Closed Phase | C | samples/ms | - | - | Time glottis remains closed |
| Open Phase | O | samples/ms | - | O = OP + CP | Total open time |
| Total Cycle | TC | samples/ms | - | TC = O + C | One complete glottal period |
| Opening threshold | - | % | 15% | - | Rise from min to detect opening |
| Closing threshold | - | % | 80% | - | Drop from max to detect closure |
| Spectral tilt interval 1 | gSt1000 | dB/octave | - | peak to 1000 Hz | Slope of fitted line |
| Spectral tilt interval 2 | gSt3700 | dB/octave | - | peak to 3700 Hz | Slope of fitted line |
| Spectral bias 1 | gSb1000 | dB | - | - | Y-intercept at peak freq |
| Spectral bias 2 | gSb3700 | dB | - | - | Y-intercept at peak freq |

### Glottal Ratios (Table I)

| Abbreviation | Description |
|--------------|-------------|
| rCPOP | Ratio of closing phase to opening phase (CP/OP) |
| rOTC | Ratio of open phase to total cycle (O/TC) |
| rCTC | Ratio of closed phase to total cycle (C/TC) |
| rOPO | Ratio of opening phase to open phase (OP/O) |
| rCPO | Ratio of closing phase to open phase (CP/O) |

### Statistical Measures (Table II)

| Statistic | Equation |
|-----------|----------|
| Average (AVG) | $\bar{x} = \frac{1}{N} \sum_{i=1}^{N} x_i$ |
| Median (MED) | 50th percentile |
| Standard Deviation (STD) | $\sqrt{\frac{1}{N-1} \sum_{i=1}^{N} (x_i - \bar{x})^2}$ |
| Minimum (MIN) | 5th percentile |
| Maximum (MAX) | 95th percentile |
| Range (RNG) | MAX - MIN |
| Dynamic Range (DRNG) | $\log_{10}(MAX) - \log_{10}(MIN)$ |
| Interquartile Range (IQR) | 75th percentile - 25th percentile |

## Implementation Details

### Glottal Phase Detection Algorithm
1. For each glottal cycle, identify minimum and maximum points
2. Calculate total amplitude change between min and max
3. **Opening point**: where 15% rise from minimum occurs (on rising slope)
4. **Closing point**: where 80% drop from maximum occurs (within 20% of next minimum)
5. These thresholds are empirical, chosen for consistency across diverse waveforms

### Feature Extraction Pipeline
1. Extract glottal waveform estimates frame-by-frame from voiced speech
2. Compute 15 glottal features per frame
3. Apply 8 statistical measures to each feature within each sentence (intra-sentence)
4. Yields 120 intra-sentence measures per sentence
5. Group sentences (G1: 5 sentences, G2: 13 sentences)
6. Apply 8 statistical measures across sentence groups (inter-sentence)
7. Total: 960 statistical measures per speaker

### Spectral Tilt Estimation
1. Compute glottal frequency response (FFT of glottal waveform)
2. Fit line from peak frequency response to target frequency (1000 Hz or 3700 Hz)
3. Spectral tilt = slope of fitted line (dB/octave)
4. Spectral bias = y-intercept (constant term)

## Figures of Interest
- **Fig 1 (page 2):** Speech production model block diagram (G(z) → V(z) → R(z))
- **Fig 2 (page 2):** Glottal waveform example showing OP, CP, C, O phases with min/max/closure points
- **Fig 3 (page 3):** Spectral tilt graph showing fitted lines to 1000 Hz and 3700 Hz

## Results Summary

### Males (N=15: 6 patient, 9 control)
- Best single features: 87% accuracy (13/15 correct)
- Best features: rCPOP, rOPO, rCPO, gSt1000, gSb3700
- Feature combination (CP DRNG + CP IQR): 93% accuracy (14/15)

### Females (N=18: 9 patient, 9 control)
- Best single feature: **100% accuracy** using gSt3700 (MAX, Std)
- Other strong features: C (closed phase), TC (total cycle)
- Closed phase MIN with DRng: 94% accuracy

### Key Finding
Spectral tilt at 3700 Hz (gSt3700) with MAX intra-sentence and STD inter-sentence statistics achieved perfect separation for females.

## Limitations
- Small sample size (15 males, 18 females total)
- Classification requires 3-5 minutes of speech observation
- Glottal extraction algorithm's accuracy not validated against ground truth
- Opening/closing thresholds (15%, 80%) are empirical, may not represent true physiological events
- Relationship between glottal features and audible perception unclear

## Relevance to Project

### Direct Relevance: Low-Medium
This paper is about **analysis** (depression classification) rather than **synthesis**. However, it provides:

1. **Glottal waveform parameterization**: The timing ratios (rCPOP, rOTC, etc.) could inform LF model parameter settings for emotional speech synthesis
2. **Feature definitions**: Shimmer equations (3, 4) are standard measures that could be used for synthesis quality assessment
3. **Spectral tilt as affect marker**: The strong correlation of spectral tilt with depression suggests it's a key parameter for emotional voice synthesis

### Potential Applications for Qlatt
- Spectral tilt control could be added as an expressive parameter
- Glottal ratio targets (OP/CP, O/TC) could inform voice quality presets
- The 15%/80% thresholds could validate LF waveform shape analysis

## Open Questions
- [ ] What LF model parameters correspond to the glottal ratios (rCPOP, rOTC)?
- [ ] How does spectral tilt map to Klatt's TL (tilt) parameter?
- [ ] Could these features be used to evaluate synthesized emotional speech quality?

## Related Work Worth Reading
- Cummings (1992) - Analysis, synthesis, and recognition of stressed speech (glottal extraction algorithm source)
- Cummings & Clements (1995) - Analysis of glottal excitation of emotionally stressed speech
- Necioglu (1998) - Objectively measurable descriptors of speech
- Nilsonne et al. (1988) - Rate of change of F0 in fluent speech during mental depression

---

## Collection Cross-References

### Already in Collection
- [[Cummings_1995_GlottalExcitationEmotionalSpeech]]
- [[France_2000_SpeechDepressionSuicideAcoustics]]

### New Leads (Not Yet in Collection)
- **Cummings (1992) [7]** - Ph.D. thesis on stressed speech analysis/synthesis. Source of the glottal extraction algorithm used in this paper. Directly relevant for understanding how to extract glottal features and potentially for stress-related voice synthesis.
- **Nilsonne et al. (1988) [1]** - Classic paper on F0 rate of change in depression. Includes Johan Sundberg as co-author, known for singing voice research. Provides baseline for prosodic features in depressed speech.
- **Necioglu (1998) [5]** - Thesis on objectively measurable speech descriptors. May contain useful feature definitions and measurement techniques for speaker characterization that could inform voice quality synthesis.
