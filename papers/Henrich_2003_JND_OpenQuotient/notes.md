---
title: "Just Noticeable Differences of Open Quotient and Asymmetry Coefficient in Singing Voice"
authors: "Nathalie Henrich, Gunilla Sundin, Daniel Ambroise, Christophe d'Alessandro, Michele Castellengo, Boris Doval"
year: 2003
venue: "Journal of Voice, Vol. 17, No. 4, pp. 481-494"
doi_url: "10.1067/S0892-1997(03)00005-5"
---

# Just Noticeable Differences of Open Quotient and Asymmetry Coefficient in Singing Voice

## One-Sentence Summary
This paper measures the just noticeable differences (JNDs) of glottal open quotient and asymmetry coefficient in singing voice synthesis, establishing that the relative JND for open quotient is constant at ~10-14% (Weber's law) while asymmetry coefficient JND is ~4%, providing perceptual resolution limits for voice quality parameter control.

## Problem Addressed
While glottal flow parameters like open quotient (Oq) and asymmetry coefficient (alpha_m) are known to affect perceived voice quality, no study had systematically measured how finely these parameters can be perceived across different parameter values, pitches, vowels, and amplitude conditions. This information is essential for determining the meaningful resolution of voice quality control in synthesizers.

## Key Contributions
- Measured absolute and relative JNDs of open quotient at three target values (0.4, 0.6, 0.8)
- Measured JNDs of asymmetry coefficient at two target values (2/3, 0.8)
- Demonstrated Weber's law holds for open quotient: relative JND (delta_Oq/Oq) is constant (~14% untrained, ~10% trained)
- Showed asymmetry coefficient JND is NOT constant but decreases as alpha_m increases (relative JND ~4%)
- Tested effects of vowel, pitch, vibrato, and amplitude on JNDs
- Linked JND of open quotient to Bouguer-Weber law through the E parameter (negative peak amplitude of differentiated glottal flow)

## Methodology
- Psychoacoustic three-interval forced-choice two-down one-up adaptive procedure
- Synthesis using LF glottal model with pitch-synchronous GCI extraction from real baritone EGG recordings
- Natural vibrato replicated by varying f0 from GCI timing
- Output pressure signal (at the lips) via fixed vocal tract transfer function estimated from real singer
- 27 subjects total: 20 untrained (G1), 10 trained who repeated 3x (G2), 7 with auditive weakness (G3)
- Nine experimental sessions varying Oq, alpha_m, vowel, pitch, vibrato, amplitude

## Key Equations

### Glottal flow (LF model, abrupt closure, no return phase)

For $0 < t < O_q T_0$:

$$u_g(t) = A_v n_g\left(\frac{t}{O_q T_0}, \alpha_m\right)$$

$$u'_g(t) = \frac{A_v}{O_q T_0} n'_g\left(\frac{t}{O_q T_0}, \alpha_m\right)$$

For $O_q T_0 < t < T_0$ (closed phase):

$$u_g(t) = 0, \quad u'_g(t) = 0$$

### Normalized glottal flow functions (Eq. 3)

$$n_g(t, \alpha_m) = \frac{1 + e^{at}\left(a\frac{\alpha_m}{\pi}\sin\left(\frac{\pi}{\alpha_m}t\right) - \cos\left(\frac{\pi}{\alpha_m}t\right)\right)}{1 + e^{a\alpha_m}}$$

Where $a$ is the implicit solution of:

$$e^{-a} + a\frac{\alpha_m}{\pi}\sin\left(\frac{\pi}{\alpha_m}\right) - \cos\left(\frac{\pi}{\alpha_m}\right) = 0$$

### Negative peak amplitude of differentiated glottal flow (Eq. 4)

$$E = \frac{A_v}{O_q T_0} \cdot \frac{-e^a \sin\left(\frac{\pi}{\alpha_m}\right)\left(a^2 + \left(\frac{\pi}{\alpha_m}\right)^2\right)}{\frac{\pi}{\alpha_m}(1 + e^{a\alpha_m})}$$

### Asymmetry coefficient definition

$$\alpha_m = \frac{S_q}{1 + S_q}$$

Where $S_q$ is the speed quotient (flow rise time / flow fall time).

### Relative JND relationship (Weber's law for Oq)

$$\frac{\Delta E}{E} = \frac{\Delta O_q}{O_q}$$

This means the relative JND of open quotient directly equals the relative JND of E (the excitation parameter), consistent with the Bouguer-Weber law for intensity perception.

## Parameters

| Name | Symbol | Units | Default | Range | Notes |
|------|--------|-------|---------|-------|-------|
| Open quotient | $O_q$ | dimensionless | 0.6 | 0.2-0.95 | Ratio of open phase to fundamental period |
| Asymmetry coefficient | $\alpha_m$ | dimensionless | 2/3 | 0.55-0.9 | Ratio of flow rise time to open phase duration |
| Speed quotient | $S_q$ | dimensionless | 2 | 0-inf | Flow rise time / flow fall time |
| Amplitude of voicing | $A_v$ | - | 1 | - | Peak glottal flow amplitude |
| Fundamental period | $T_0$ | seconds | 1/196 | - | $T_0 = 1/f_0$ |
| Negative peak amplitude | $E$ | - | varies | - | Peak of differentiated glottal flow derivative |

## JND Results (Key Data)

### Open Quotient JNDs (Absolute, Table 2)

| Target Oq | G1 (untrained) mean | G1 SD | G2 (trained) mean | G2 SD |
|-----------|-------------------|-------|------------------|-------|
| 0.4 | 0.058 | 0.019 | 0.037 | 0.010 |
| 0.6 | 0.087 | 0.027 | 0.063 | 0.015 |
| 0.8 | 0.106 | 0.043 | 0.079 | 0.014 |

### Open Quotient Relative JNDs (%, Table 5)

| Target Oq | G1 (untrained) | G2 (trained) |
|-----------|---------------|-------------|
| 0.4 | 14.5% (SD 4.7) | 9.3% (SD 2.6) |
| 0.6 | 14.6% (SD 4.5) | 10.5% (SD 2.5) |
| 0.8 | 13.2% (SD 4.8) | 9.9% (SD 1.7) |

**Key finding:** Relative JND is constant across Oq values (Weber's law):
- **Untrained: ~14% relative JND**
- **Trained: ~10% relative JND**

### Asymmetry Coefficient JNDs (Absolute, Table 2)

| Target alpha_m | G1 (untrained) mean | G1 SD | G2 (trained) mean | G2 SD |
|---------------|-------------------|-------|------------------|-------|
| 2/3 | 0.033 | 0.009 | 0.027 | 0.010 |
| 0.8 | 0.027 | 0.009 | 0.022 | 0.008 |

### Asymmetry Coefficient Relative JNDs for E (%, Table 6)

| Target alpha_m | G1 (untrained) | G2 (trained) |
|---------------|---------------|-------------|
| 2/3 | 23.1% (SD 6.7) | 19.0% (SD 7.7) |
| 0.8 | 19.9% (SD 7.9) | 15.2% (SD 6.3) |

**Note:** The relative JND for alpha_m is NOT constant -- it decreases as alpha_m increases. The relative JND in terms of E is ~4% (Table 5, sessions 7-8: G1 5.0/3.4, G2 4.1/2.7).

### Effects of Experimental Conditions on Oq JND (Table 4)

| Factor | Untrained effect | Trained effect |
|--------|-----------------|---------------|
| Vowel [AA] vs [IY] | Not significant | Significant (p<0.05), slight |
| Pitch 130 Hz vs 196 Hz | Not significant | Not significant |
| Vibrato presence | Significant (p<0.05) | Significant (p<0.01) |
| Amplitude (E fixed vs Av fixed) | Highly significant (p<0.001) | Significant (p<0.05) |

## Implementation Details

### Synthesis method
1. Detect glottal closing instants (GCI) from differentiated EGG signal using wavelet transform
2. Synthesize glottal flow derivative impulse between consecutive GCIs using LF model with fixed parameters
3. Filter through fixed vocal tract transfer function estimated by linear prediction from real baritone recording
4. Two pitches: C3 (~130 Hz) and G3 (~196 Hz)
5. Two vowels: [AA] (F1=560 Hz) and [IY] (F1=330 Hz)

### Psychoacoustic procedure
- Three-interval forced choice: two standard, one comparison
- 500 ms pause between intervals
- Two-down one-up adaptive staircase
- Initial step: 0.04-0.08 depending on session
- Final step: 0.01
- Step halved every second run
- 14 runs for Oq, 12 runs for alpha_m
- Last 8 runs used for JND calculation
- Sound level: 70-80 dBA fixed for all subjects

## Figures of Interest
- **Fig 1a (p. 483):** Glottal flow parameters diagram showing Av, E, Oq, T0, alpha_m on one period
- **Fig 1b (p. 483):** Relationship between speed quotient Sq (log scale) and asymmetry coefficient alpha_m
- **Fig 4 (p. 486):** Open quotient variations in time and frequency domain -- shows spectral effects of Oq changes
- **Fig 5 (p. 487):** Asymmetry coefficient variations in time and frequency domain -- shows spectral effects of alpha_m changes
- **Fig 6 (p. 489):** Individual JND values for untrained subjects across three Oq targets
- **Fig 7 (p. 489):** Individual JND values for trained subjects across three Oq targets
- **Fig 10 (p. 492):** E as function of alpha_m -- nonlinear relationship explains why relative JND of alpha_m is not constant

## Results Summary
- Open quotient JND follows Weber's law: relative JND is constant at ~14% (untrained) and ~10% (trained)
- Asymmetry coefficient JND decreases as alpha_m increases (not Weber's law for alpha_m directly, but related to the nonlinear E(alpha_m) relationship)
- No significant effect of vowel choice on JND
- No significant effect of pitch (130 Hz vs 196 Hz) on JND
- Vibrato slightly increases JND (naturalness masks fine variations)
- Amplitude parameter has the largest effect: when E (not Av) is kept constant, JND increases significantly because the spectral slope change associated with Oq variation is the primary perceptual cue
- Trained listeners have lower JNDs than untrained (~30% lower)
- Subjects with high-frequency hearing loss (G3) had highest JNDs, confirming high-frequency spectral information is important

## Limitations
- Only two values of asymmetry coefficient tested (2/3 and 0.8) -- more needed
- Only one voice type (baritone)
- Only two vowels and two pitches tested
- Fixed vocal tract transfer function (no coarticulation)
- Return phase of LF model not used (abrupt closure assumption)
- Stimuli used pressure signal at the lips, not glottal flow directly

## Testable Properties
- **Relative JND of Oq is constant:** For any target Oq in [0.4, 0.8], delta_Oq/Oq should be ~0.10-0.14
- **Absolute JND of Oq increases with Oq:** JND(0.4) < JND(0.6) < JND(0.8)
- **JND of alpha_m decreases with alpha_m:** JND at alpha_m=0.8 < JND at alpha_m=2/3
- **No vowel effect:** Synthesizing with different vowels should not change the perceptual resolution of Oq
- **No pitch effect:** Changing f0 within a given register should not change Oq perceptual resolution
- **Amplitude coupling:** When Av is constant and Oq varies, E also varies -- this creates larger spectral changes and lower JNDs than when E is held constant
- **Minimum perceptible Oq change:** ~0.037 (trained) to ~0.058 (untrained) at Oq=0.4
- **Minimum perceptible alpha_m change:** ~0.022 (trained) to ~0.027 (untrained) at alpha_m=0.8

## Relevance to Project

This paper is directly relevant to the Qlatt voice quality synthesis work in several ways:

1. **Parameter resolution for voice quality presets:** When defining voice quality presets (breathy, tense, modal), parameter differences must exceed the JND to be perceptible. An Oq change of less than ~10% of the target value will not be perceived by trained listeners.

2. **Prioritizing voice quality parameters:** The asymmetry coefficient has a smaller relative JND (~4% in terms of E) compared to open quotient (~10-14%), meaning listeners are MORE sensitive to asymmetry changes. This suggests alpha_m (or equivalently, spectral tilt/Rd) deserves careful control in synthesis.

3. **Amplitude-Oq coupling:** The finding that keeping E constant (vs Av constant) dramatically changes the JND has direct implications for the Klatt synthesizer's AV parameter. When AV is held constant while OQ varies, the resulting E variation provides additional perceptual information. This is how Klatt synthesis typically works -- AV is set per-frame while OQ varies.

4. **Practical synthesis thresholds:** For parameter scheduling and interpolation, changes smaller than JND can be quantized without perceptual loss. This could inform parameter scheduling resolution.

5. **Connection to Doval_2003_VoiceSourceCALM and Doval_2006_SpectrumGlottalFlowModels:** The spectral analysis framework (glottal formant frequency controlled by Oq, bandwidth controlled by alpha_m) is consistent with the CALM model already in our collection.

## Open Questions
- [ ] How do these JNDs extend to non-singing voice (speaking voice)?
- [ ] What is the JND for the return phase parameter (ta/Ra) which this study did not test?
- [ ] How do JNDs change for female voices at higher pitches?
- [ ] Does the Weber's law relationship hold for Oq values below 0.4 (pressed voice) or above 0.8 (very breathy)?

## Related Work Worth Reading
- Scherer et al, 1998 (ref 13) - Previous JND study for Oq and Sq at single values
- Rao, van Dinther, Veldhuis, Kohlrausch 2001 (ref 11) - Audibility discrimination thresholds for spectral envelope distortions in vowels
- van Dinther, Veldhuis, Kohlrausch 2001 (ref 12) - Perceptual relevance of glottal-pulse parameter variations (already in our collection as vanDinther_2004)
- Veldhuis 1998 (ref 10) - Spectral relevance of glottal-pulse parameters
- Fant, Liljencrants, Lin 1985 (ref 19) - LF model (already in collection as Fant_1985_LFModelGlottalFlow)

## Collection Cross-References

### Already in Collection
- [[Doval_2003_VoiceSourceCALM]] - cited indirectly (ref 14, Doval & d'Alessandro 1999 is a predecessor); provides the spectral framework for understanding Oq and alpha_m effects
- [[Doval_2006_SpectrumGlottalFlowModels]] - extends the spectral analysis of glottal parameters used here
- [[Fant_1985_LFModelGlottalFlow]] - the LF model used in this study (ref 19)
- **vanDinther_2004_PerceptualGlottalPulse** - companion study using excitation pattern distance to quantify perceptual relevance of LF parameter variations; complements the psychoacoustic JND data here
- [[Henrich_2005_GlottalOpenQuotientSinging]] - follow-up by same first author measuring Oq in real singers across laryngeal mechanisms

### New Leads (Not Yet in Collection)
- Scherer, Arehart, Gent Guo, Milstein, Horii 1998 - "Just Noticeable Differences for glottal flow waveform characteristics" - J Voice 12(1):21-30 -- predecessor study with single Oq/Sq values
- Veldhuis 1998 - "The spectral relevance of glottal-pulse parameters" -- theoretical framework for parameter perception
- Rao, van Dinther, Veldhuis, Kohlrausch 2001 - "A measure for predicting audibility discrimination thresholds for spectral envelope distortions in vowel sounds" - JASA 109:2085-2097

### Cited By (in Collection)
- [[Doval_2006_SpectrumGlottalFlowModels]] — cites this (ref 31) for JND data on Oq and αm, validating their spectral parameter framework against perceptual thresholds
- [[Feugere_2017_CantorDigitalis]] — cites this (ref 40) for perceptual resolution of open quotient in singing voice synthesis
- **vanDinther_2004_PerceptualGlottalPulse** — compares EPD-based perceptual model predictions against the psychoacoustic JND data from this study

### Supersedes or Recontextualizes
- **vanDinther_2004_PerceptualGlottalPulse** - This Henrich 2003 study provides complementary psychoacoustic JND data that validates and extends van Dinther's EPD-based perceptual model. Van Dinther found Ra (return phase) most perceptible; Henrich found Oq follows Weber's law at ~10-14%. Together they establish the full perceptual resolution landscape for LF parameters.
