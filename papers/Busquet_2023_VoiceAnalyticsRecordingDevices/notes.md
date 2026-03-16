---
title: "Voice Analytics in the Wild: Validity and Predictive Accuracy of Common Audio-Recording Devices"
authors: "Francesc Busquet, Fotis Efthymiou, Christian Hildebrand"
year: 2023
venue: "Behavior Research Methods"
doi_url: "https://doi.org/10.3758/s13428-023-02139-9"
---

# Voice Analytics in the Wild: Validity and Predictive Accuracy of Common Audio-Recording Devices

## One-Sentence Summary

This paper provides causal evidence that consumer-grade audio-recording devices systematically distort amplitude and f0 measurements compared to a studio-quality baseline, with high-proximity devices (headset, lavalier) inflating amplitude and smartphones inflating f0.

## Problem Addressed

Crowdsourced voice data collection using consumer devices is increasingly common in research, but no prior study had systematically and causally examined whether different consumer-grade recording devices produce valid and reliable measures of fundamental frequency and amplitude. Prior work was correlational, not causal, and could not disentangle device effects from speaker and distance effects.

## Key Contributions

- First controlled within-subjects causal experiment comparing five recording devices (studio baseline, headset, lavalier, smartphone, laptop) on the same speakers simultaneously
- Demonstrates that high-proximity devices (headset, lavalier) systematically inflate amplitude by 5-15 dB relative to baseline
- Shows that smartphones systematically inflate f0 by ~11 Hz compared to all other devices, likely due to built-in high-pass filters
- Demonstrates that device-induced amplitude and f0 biases reduce emotion classification accuracy (from 51% baseline to 46% smartphone/lavalier)
- Provides initial evidence for a random-forest-based machine-learning bias correction approach ($R^2 = .93$)
- Publishes a comprehensive set of recording guidelines (Fig. 12)

## Methodology

- 30 participants (50% female), $M_{\text{Age}} = 24.73$, $SD_{\text{Age}} = 5.09$
- Within-subjects nested design: 5 devices x 2 intonation types (phonetic amplification "i" vs "a") x 2 headset conditions x 3 emotions (neutral, happy, sad)
- 1,800 voice samples total (30 subjects x 5 devices x 2 phrases x 2 headset x 3 emotions)
- All devices recorded simultaneously in the same room
- Features extracted using Parselmouth (Praat Python wrapper): mean f0 and mean amplitude
- One-way repeated-measures ANOVAs with Tukey HSD post-hoc contrasts
- Two-way repeated-measures ANOVAs for device x sex and device x emotion interactions
- Random forest for emotion prediction and bias correction (5-fold subject-wise cross-validation)

## Key Equations

No novel equations. Statistical analyses are standard repeated-measures ANOVA.

Bias correction approach uses random forest regression:

$$
\hat{y}_{\text{baseline}} = f_{\text{RF}}(\text{amplitude}_{\text{device}}, \text{f0}_{\text{device}}, \text{device\_type})
$$

Where the random forest learns to map distorted device features back toward the studio baseline distribution.

## Parameters

| Name | Symbol | Units | Baseline Mean | Notes |
|------|--------|-------|---------------|-------|
| Mean Amplitude (Baseline) | $M_{\text{Baseline}}$ | dB | 57.67 | Studio microphone (Blue Yeti, Logitech), ~60 cm distance |
| Mean Amplitude (Headset) | $M_{\text{Headset}}$ | dB | 59.73 | Beats by Dr. Dre EP, high proximity |
| Mean Amplitude (Lavalier) | $M_{\text{Lavalier}}$ | dB | 63.68 | Rode SmartLav+, high proximity, largest inflation |
| Mean Amplitude (Smartphone) | $M_{\text{Smartphone}}$ | dB | 52.90 | Samsung A6, low proximity (~60 cm) |
| Mean Amplitude (Laptop) | $M_{\text{Laptop}}$ | dB | 46.91 | MacBook Pro 2017, low proximity (~60 cm) |
| Mean f0 (Baseline) | $M_{\text{Baseline}}$ | Hz | 169.31 | Studio microphone reference |
| Mean f0 (Smartphone) | $M_{\text{Smartphone}}$ | Hz | 180.70 | Significantly inflated vs all others |
| Mean f0 (Laptop) | $M_{\text{Laptop}}$ | Hz | 168.42 | Not significantly different from baseline |
| Mean f0 (Headset) | $M_{\text{Headset}}$ | Hz | 170.88 | Not significantly different from baseline |
| Mean f0 (Lavalier) | $M_{\text{Lavalier}}$ | Hz | 170.86 | Not significantly different from baseline |
| f0 Correlation (cross-device) | $r$ | - | .94 | Average correlation, $p < .001$ |
| Amplitude Correlation (cross-device, excl. lavalier) | $r$ | - | .95-.97 | High-proximity lavalier shows weaker correlation (.64-.68) |

## Implementation Details

### Recording Setup (Table 2)

| Device | Brand | Model | Proximity | Software | Audio Type | Sampling Rate |
|--------|-------|-------|-----------|----------|------------|---------------|
| Lavalier | Rode | SmartLav+ | High | Easy Voice Recorder | Peripheral | 44,100 Hz |
| Headset | Apple | Beats by Dr. Dre EP | High | Easy Voice Recorder | Peripheral | 44,100 Hz |
| Studio (Baseline) | Logitech | Blue Yeti | Low | Audacity | Peripheral | 44,100 Hz |
| Smartphone | Samsung | A6 | Low | Easy Voice Recorder | Built-in | 44,100 Hz |
| Laptop | Apple | MacBook Pro, 2017 | Low | Audacity | Built-in | 44,100 Hz |

### Feature Extraction
- Tool: Parselmouth (Python Praat wrapper)
- Features: mean f0 (Hz), mean amplitude (dB)
- All files: WAV 32-bit float PCM, 44,100 Hz sampling rate

### Bias Correction (Machine Learning)
- Model: Random forest
- Input features: amplitude and f0 from device, device type indicator
- Target: baseline (studio microphone) amplitude/f0
- Validation: 5-fold subject-wise cross-validation
- Result: $R^2 = .93$ for amplitude correction, shifting the distribution of high-proximity device measurements toward baseline

## Figures of Interest

- **Fig. 1 (page 9):** Correlograms of f0 and amplitude across all device pairs. f0 correlations high (.86-.98) except lavalier-amplitude correlations are notably lower (.64-.68).
- **Fig. 2 (page 9):** Bar chart of amplitude by device. Lavalier highest (~63 dB), laptop lowest (~47 dB), baseline in middle (~58 dB).
- **Fig. 3 (page 10):** Amplitude by device, split by biological sex. High-proximity amplitude inflation is more pronounced for females.
- **Fig. 4 (page 10):** f0 by device. Smartphone captures ~11 Hz higher f0 than all other devices.
- **Fig. 5 (page 11):** f0 by device and sex. Smartphone f0 inflation is driven primarily by male speakers.
- **Fig. 6 (page 12):** Amplitude by device and emotion. Happy > Neutral > Sad across all devices, but device amplifies/compresses these differences.
- **Fig. 7 (page 13):** f0 by device and emotion. Happy state reliably captured by all devices; smartphone inflates all emotion conditions.
- **Fig. 8 (page 13):** Emotion prediction accuracy by device. Baseline best (~51%), smartphone/lavalier worst (~46%).
- **Fig. 9 (page 14):** Biological sex prediction accuracy. Baseline best (~97%), smartphone worst (~87%).
- **Fig. 10 (page 15):** Simulation showing emotion detection effect size shrinks from large ($d = .45$) to negligible ($d = .18$) as high-proximity device share increases from 0% to 100%.
- **Fig. 11 (page 16):** Before/after bias correction. Random forest shifts high-proximity amplitude distribution toward baseline ($R^2 = .93$).
- **Fig. 12 (page 17):** Comprehensive recording guidelines infographic covering microphone type, placement, recording specs, and environment.

## Results Summary

### Amplitude Effects
- Significant main effect of device on amplitude: $F(4, 116) = 148.70$, $p < .001$, $\eta_p^2 = .84$
- High-proximity devices (lavalier, headset) inflate amplitude by 5-15 dB
- Low-proximity devices (smartphone, laptop) record lower amplitude than baseline
- Device x sex interaction: amplitude inflation more pronounced for female speakers ($F(4, 112) = 3.14$, $p < .05$)

### f0 Effects
- Significant main effect of device on f0: $F(4, 116) = 9.82$, $p < .001$, $\eta_p^2 = .25$
- Smartphone captures significantly higher f0 (~11 Hz) than all other devices
- No significant differences among baseline, headset, lavalier, and laptop for f0
- Device x sex interaction for f0: $F(4, 112) = 6.92$, $p < .001$; smartphone inflation is driven by males

### Emotion Classification
- Baseline microphone achieves best emotion prediction accuracy (~51.40%)
- Smartphone and lavalier achieve worst (~45.88% and ~46.17%)
- Simulation: increasing proportion of high-proximity device data progressively reduces emotion detection effect sizes

### Biological Sex Classification
- Baseline: 96.81% accuracy
- Smartphone: 86.78% (worst, ~10 percentage point drop)

## Limitations

- Only two vocal features analyzed (mean f0 and mean amplitude); spectral measures, jitter, shimmer, HNR not examined
- Only sustained vowels in short phrases ("I go to the bar" / "I drink a beer"), not continuous speech
- 30 participants in a lab setting; does not capture real-world crowdsourced noise conditions
- Only five specific device models tested; results may not generalize to other brands/models
- Simulated emotions only (not spontaneous)
- Bias correction requires a measured baseline, which may not be available in crowdsourced settings
- Only amplitude bias correction demonstrated; f0 correction not explicitly shown

## Testable Properties

- High-proximity microphones (headset, lavalier at <20 cm) must produce higher amplitude measurements than a studio microphone at 60 cm for the same speaker and utterance
- Smartphone built-in microphones should show systematically inflated f0 (~5-12 Hz) compared to external microphones for the same speaker
- Cross-device f0 correlations should be high (r > .85) for all device pairs
- Cross-device amplitude correlations should be high (r > .90) except for lavalier vs. other devices (r ~ .64-.68)
- Increasing the proportion of high-proximity device recordings in a mixed dataset must reduce the detectable effect size for amplitude-based group comparisons (monotonically)
- A random forest trained on device-specific features and device type should achieve $R^2 > .90$ for mapping amplitude back toward studio baseline

## Relevance to Project

This paper is relevant to Qlatt primarily as **calibration context** for any future work involving comparison of synthesized speech parameters against recorded speech. If Qlatt's synthesized output is ever compared to recordings from different devices (e.g., validating naturalness against crowdsourced voice samples), the systematic biases documented here (especially the ~11 Hz f0 inflation from smartphones and ~6-15 dB amplitude inflation from high-proximity mics) must be accounted for. The recording guidelines (Fig. 12) are useful for any future data collection efforts. The paper does not provide parameters, algorithms, or models directly usable in synthesis.

## Open Questions

- [ ] How do these device biases affect spectral measures (formant frequencies, spectral tilt, HNR) relevant to voice quality synthesis?
- [ ] Would the bias correction approach generalize to formant frequency distortion?
- [ ] How does background noise interact with device-specific biases in real crowdsourced settings?

## Related Work Worth Reading

- Titze & Winholtz (1993) - Effect of microphone type and placement on voice perturbation measurements (foundational reference for device effects)
- Svec & Granqvist (2010) - Guidelines for selecting microphones for human voice production research
- Parsa & Jamieson (2001) - Effect of different microphones on acoustic voice parameters (external microphones tested)
- Hildebrand et al. (2020) - Review of vocal feature extraction across time, amplitude, frequency, and spectrum domains

## Collection Cross-References

### Already in Collection
- [[Banse_1996_VocalEmotionAcousticProfiles]] — cited indirectly via Scherer (1991, 2003) and the emotion detection framework; Banse's 14-emotion acoustic profiles (f0, energy, spectral) are exactly the kind of features Busquet shows are distorted by device choice
- [[Borkowska_2011_F0DominanceAttractiveness]] — cited for f0 and perceived dominance/attractiveness; Busquet's finding that smartphones inflate f0 by ~11 Hz is relevant to any voice attractiveness study using crowdsourced recordings

### New Leads (Not Yet in Collection)
- Titze & Winholtz (1993) — "Effect of microphone type and placement on voice perturbation measurements" — foundational study this paper builds upon; perturbation measures 3x higher on consumer mics vs professional
- Svec & Granqvist (2010) — "Guidelines for selecting microphones for human voice production research" — canonical microphone selection guidelines for voice research
- Parsa & Jamieson (2001) — "Acoustic discrimination of pathological voice" — device effects on pathological vs sustained speech comparison

### Supersedes or Recontextualizes
- (none)

### Cited By (in Collection)
- (none found)

### Conceptual Links (not citation-based)
- [[Hartenstein_2025_VoiceDirectivityHELS]] — Busquet's core finding (high-proximity devices inflate amplitude by 5-15 dB) is partly explained by voice directivity physics: Hartenstein shows that human voice directivity is frequency-dependent and requires spherical harmonic orders >9 above 2 kHz, meaning microphones at different positions around the head capture genuinely different signals, not just distance-scaled versions of the same signal. The proximity effect Busquet attributes to "device type" is confounded with directivity pattern and near-field effects.
- [[Banse_1996_VocalEmotionAcousticProfiles]] — Busquet demonstrates that the emotion-differentiating acoustic features Banse catalogued (amplitude differences between happy/sad/neutral) are systematically compressed or inflated by device choice, reducing emotion detection accuracy by ~5 percentage points. This means Banse's emotion profiles are only valid when recording conditions are controlled --- a practical constraint on applying those profiles to crowdsourced data.
