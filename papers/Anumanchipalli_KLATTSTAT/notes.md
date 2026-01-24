# KLATTSTAT: Knowledge-based Parametric Speech Synthesis

**Authors:** Gopala Krishna Anumanchipalli, Ying-Chang Cheng, Joseph Fernandez, Xiaohan Huang, Qi Mao, Alan W Black
**Year:** ~2009-2010 (based on references)
**Venue:** Likely Interspeech or similar (CMU paper)
**DOI/URL:** Not provided; contact: {gopalakr, awb}@cs.cmu.edu

## One-Sentence Summary

This paper demonstrates automatic extraction of Klatt formant synthesizer parameters from natural speech for use in statistical parametric speech synthesis (SPSS), bridging classical knowledge-based synthesis with modern machine learning approaches.

## Problem Addressed

Statistical parametric speech synthesis (SPSS) typically uses spectral parameterizations derived from FFT (like MFCCs or LSFs) that are not directly tied to human speech production. This paper investigates whether knowledge-based Klatt parameters, which are grounded in speech production theory, can be automatically extracted from speech databases and used effectively in SPSS frameworks.

## Key Contributions

- Automatic extraction of all 40 Klatt parameters from natural speech signals
- GMM-based discriminative detection of articulatory features (nasality, aspiration, frication)
- Integration of Klatt parameters with Clustergen statistical parametric synthesizer
- Demonstration that Klatt parameters can produce intelligible TTS output
- Complete parameter reference table with ranges and defaults

## Methodology

### Approach

1. Extract Klatt parameters automatically from a speech database (CMU ARCTIC rms)
2. Train CART trees on these parameters using Clustergen framework
3. At synthesis time, predict Klatt parameters from text
4. Feed predicted parameters to Klatt synthesizer for waveform generation

### Formant Parameter Extraction

- Use ESPS toolkit `formant` package for F1-F6 frequencies and bandwidths
- 50ms analysis window with 5ms shift
- FFT magnitude spectrum computed for amplitude extraction
- Amplitude at formant frequencies taken as formant amplitudes
- Manual tuning of smoothing window, FFT points, window size/shift

### Articulatory Feature Detection (Nasality, Aspiration, Frication)

GMM-based discriminative approach:
1. Train positive and negative GMMs using labeled phoneme data
2. Use middle HMM states only (avoid transitional effects)
3. Phonemes bordering positive-state phonemes excluded from negative training

**Positive state phoneme sets:**
- Nasality: n, m, ng
- Frication: f, hh, s, sh, th, v, z, zh
- Aspiration: hh

## Key Equations

### Maximum Likelihood Detector Score

$$
S = \log_{10}(L_+ - L_- + 1)
$$

Where:
- $L_+$ = likelihood from positive state GMM
- $L_-$ = likelihood from negative state GMM
- Score is 0 if $L_- > L_+$ (thresholding negative/imaginary values)

### Bayes Detector Score

$$
S = \begin{cases}
\log(L_+) & \text{if } P(+|x) > P(-|x) \\
0 & \text{if } P(+|x) < P(-|x)
\end{cases}
$$

Where:
- $P(i|x)$ obtained via Bayes rule: $P(x|i)P(i)$ vs $P(x|j)P(j)$
- Prior probabilities weight the decision

## Parameters

### Complete Klatt Parameter Table (40 parameters)

| No. | Name | Description | Range | Default |
|-----|------|-------------|-------|---------|
| 1 | f0 | Fundamental frequency (pitch) | - | - |
| 2 | av | Amplitude of voicing (cascade branch) | 0-70 dB | - |
| 3 | f1 | First formant frequency | 200-1300 Hz | - |
| 4 | b1 | Cascade bandwidth of F1 | 40-1000 Hz | - |
| 5 | f2 | Second formant frequency | 550-3000 Hz | - |
| 6 | b2 | Cascade bandwidth of F2 | 40-1000 Hz | - |
| 7 | f3 | Third formant frequency | 1200-4999 Hz | - |
| 8 | b3 | Cascade bandwidth of F3 | 40-1000 Hz | - |
| 9 | f4 | Fourth formant frequency | 1200-4999 Hz | - |
| 10 | b4 | Cascade bandwidth of F4 | 40-1000 Hz | - |
| 11 | f5 | Fifth formant frequency | 1200-4999 Hz | - |
| 12 | b5 | Cascade bandwidth of F5 | 40-1000 Hz | - |
| 13 | f6 | Sixth formant frequency | 1200-4999 Hz | - |
| 14 | b6 | Cascade bandwidth of F6 | 40-2000 Hz | - |
| 15 | fnz | Nasal zero frequency (cascade only) | 248-528 Hz | - |
| 16 | bnz | Nasal zero bandwidth (cascade only) | 40-1000 Hz | - |
| 17 | Fnp | Nasal pole frequency | 248-528 Hz | 200 Hz |
| 18 | Bnp | Nasal pole bandwidth | 40-1000 Hz | 30 Hz |
| 19 | asp | Amplitude of aspiration | 0-70 dB | - |
| 20 | Kopen | Open quotient of voicing waveform | 0-60 | 40 |
| 21 | Aturb | Amplitude of turbulence (breathiness) | 0-80 dB | 0 |
| 22 | tilt | Voicing spectral tilt | 0-24 dB | 0 |
| 23 | af | Amplitude of frication (parallel branch) | 0-80 dB | - |
| 24 | Skew | Spectral skew (alternate period skewness) | 0-40 | 0 |
| 25 | a1 | Parallel branch F1 amplitude | 0-80 dB | - |
| 26 | b1p | Parallel branch F1 bandwidth | Hz | - |
| 27 | a2 | Parallel branch F2 amplitude | 0-80 dB | - |
| 28 | b2p | Parallel branch F2 bandwidth | Hz | - |
| 29 | a3 | Parallel branch F3 amplitude | 0-80 dB | - |
| 30 | b3p | Parallel branch F3 bandwidth | Hz | - |
| 31 | a4 | Parallel branch F4 amplitude | 0-80 dB | - |
| 32 | b4p | Parallel branch F4 bandwidth | Hz | - |
| 33 | a5 | Parallel branch F5 amplitude | 0-80 dB | - |
| 34 | b5p | Parallel branch F5 bandwidth | Hz | - |
| 35 | a6 | Parallel branch F6 amplitude | 0-80 dB | - |
| 36 | b6p | Parallel branch F6 bandwidth | Hz | - |
| 37 | anp | Parallel branch nasal formant amplitude | dB | - |
| 38 | ab | Amplitude of bypass frication | 0-80 dB | - |
| 39 | avp | Amplitude of voicing (parallel branch) | 0-70 dB | - |
| 40 | Gain | Overall gain | 0-80 dB | 80 |

### Parameter Categories

1. **F0 and Formant Parameters**: f0, f1-f6, b1-b6 (frequencies and bandwidths)
2. **Articulatory Features**: asp, af, nasality parameters (aspiration, frication, nasality amplitudes)
3. **Source/Global Parameters**: av, avp, Gain, Kopen, tilt, Skew, Aturb

## Implementation Details

### Data Structures
- 40-dimensional parameter vector per 5ms frame
- Same contextual questions used as MCEP-based voice building
- CART trees built for each of 3 HMM states within a phoneme

### Extraction Pipeline
1. Use ESPS `formant` for formant frequencies/bandwidths
2. Use FFT for magnitude spectrum and formant amplitudes
3. Train GMMs on labeled phoneme data for articulatory features
4. Set gain, skew, aturb empirically
5. Default values used for 5 of 40 parameters

### Detector Performance (Error Rates)

| TrueState | Naive | Bayes | GMM LDA | GMM LDAE | MCEP LDA | MCEP LDAE |
|-----------|-------|-------|---------|----------|----------|-----------|
| Nasal | 1.43% | 3.40% | 7.26% | 19.90% | 15.95% | 4.79% |
| Non-Nasal | 0.75% | 0.40% | 0.23% | 0.40% | 0.37% | 1.41% |
| Fricative | 3.78% | 6.60% | 20.38% | 6.33% | 12.62% | 7.79% |
| Non-Fricative | 5.00% | 3.82% | 6.80% | 12.36% | 7.05% | 9.22% |
| Aspiration | 3.01% | 13.28% | 63.66% | 8.52% | 89.47% | 10.03% |
| Non-Aspiration | 1.32% | 0.21% | 0.07% | 4.00% | 0.09% | 15.89% |
| MCD mean | 11.88 | 11.95 | 11.96 | 11.95 | 11.79 | 11.67 |
| MCD variance | 0.36 | 0.37 | 0.38 | 0.38 | 0.26 | 0.26 |

**Chosen method:** MCEP LDAE (best cepstral distortion despite not lowest error rates)

### Synthesis Pipeline
1. Duration model generates phone durations (same as MCEP voice)
2. F0 model generates pitch contour (same as MCEP voice)
3. Klatt parameter trees generate 40-dimensional vectors
4. C implementation of Klatt synthesizer (Iles & Ing-Simmons 1995) generates waveform

## Figures of Interest

- **Fig 1:** FFT magnitude spectrum with first 6 formants marked - shows typical formant extraction result
- **Fig 2:** Schematic of Klatt synthesizer showing impulse/noise sources, flutter, aspiration (AH), frication (AF), resonators (R1-R6), nasal components (AN, RNP), bypass (AB)
- **Fig 3:** Resynthesis vs original spectrum comparison for phoneme "eh" - peaks align in lower frequencies, high-frequency attenuation noted
- **Fig 4:** Spectrogram comparison of MCEP vs Klatt TTS for "His immaculate appearance was gone" - shows Klatt parameters model spectral aspects adequately

## Results Summary

### Resynthesis Quality
- "Perceptually almost perfect" resynthesis from extracted parameters
- Spectral peaks align precisely in lower frequency regions
- High-frequency attenuation issue still under investigation

### TTS Quality
- Completely intelligible speech
- Listeners transcribed all words correctly
- "Processed" quality distinct from MCEP synthesis
- Speaker identity preserved (sounds like rms speaker)
- Also has characteristic "DECtalk" quality

### Flexibility Advantage
Post-processing predicted parameters by phoneme identity possible:
- Increase/decrease specific parameters to modify output
- Make speech more "nasal" or "bursty" as desired
- Unique to knowledge-based parameterizations

## Limitations

1. Resynthesis quality "not as good as hoped" - closer to TTS quality than expected
2. High-frequency attenuation in resynthesis not yet resolved
3. "Processed" quality in output - characteristic Klatt distortion
4. No access to expert parameter tuning (MITalk unavailable)
5. Empirical setting required for gain, skew, aturb
6. Perceptual quality gap between expertly-tuned Klatt and automatic extraction

### Three Constraints for SPSS Parameters (identified by authors)
1. Must be automatically derivable from natural speech databases
2. Must give rise to high quality resynthesis
3. Must be predictable from text

## Relevance to TTS Systems

### Direct Applications
- **Formant synthesis:** Complete parameter specification with ranges/defaults
- **Analysis-synthesis:** Automatic Klatt parameter extraction pipeline
- **Hybrid systems:** Combining knowledge-based parameters with statistical prediction

### Articulatory Feature Detection
The GMM-based detector approach for nasality/aspiration/frication could be used for:
- Phoneme classification
- Prosody modeling (breathiness detection)
- Voice quality analysis
- Automatic labeling of speech databases

### Parameter Manipulation
Knowledge-based parameters enable:
- Targeted modification of specific speech qualities
- Style/emotion modification via parameter adjustment
- Cross-speaker voice conversion with interpretable parameters

### Comparison Insights
- MCEP synthesis sounds different from Klatt synthesis
- Both produce intelligible output
- Trade-off: MCEP is more "natural", Klatt is more "controllable"

## Open Questions

- [ ] What causes the high-frequency attenuation in resynthesis?
- [ ] How to bridge quality gap between automatic and expert-tuned parameters?
- [ ] Optimal post-processing techniques for predicted Klatt parameters?
- [ ] Can better formant tracking improve resynthesis quality?
- [ ] How do parallel vs cascade branch parameters interact in automatic extraction?
- [ ] What is the perceptual weight of each of the 40 parameters?

## Related Work Worth Reading

- Klatt (1980) - Original cascade/parallel formant synthesizer paper [1]
- Allen, Hunnicut & Klatt (1987) - MITalk system book [10]
- Zen, Tokuda & Black (2009) - Statistical parametric speech synthesis overview [4]
- Black (2006) - CLUSTERGEN statistical parametric synthesizer [14]
- Metze (2007) - Discriminative speaker adaptation using articulatory features [12]
- Iles & Ing-Simmons (1995) - C implementation of Klatt synthesizer [15]
- CMU ARCTIC database [13] - Speech synthesis research database used

## Implementation Notes for Qlatt

### Relevant Parameter Mappings
The paper's parameter numbering maps to standard Klatt parameters. Key observations:
- Cascade branch has av, f1-f6, b1-b6, fnz, bnz
- Parallel branch has avp, a1-a6, b1p-b6p, af, ab, anp
- Source parameters: f0, Kopen, tilt, Skew, Aturb, asp

### Bandwidth Ranges
- F1-F5 bandwidths: 40-1000 Hz
- F6 bandwidth: 40-2000 Hz (wider range)
- Nasal zero/pole bandwidth: 40-1000 Hz

### Default Values to Note
- Fnp (nasal pole frequency): 200 Hz
- Bnp (nasal pole bandwidth): 30 Hz
- Kopen: 40
- Aturb: 0
- tilt: 0
- Skew: 0
- Gain: 80 dB

### Analysis Window
- 50ms window, 5ms shift (200 Hz frame rate)
- Different from typical 5ms frames used in Qlatt - may need adjustment
