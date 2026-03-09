# Spectral Correlates of Voice Open Quotient and Glottal Flow Asymmetry: Theory, Limits and Experimental Data

**Authors:** Nathalie Henrich, Christophe d'Alessandro, Boris Doval
**Year:** 2001
**Venue:** Proceedings of Eurospeech 2001 (7th European Conference on Speech Communication and Technology), pp. 47-50
**DOI:** 10.21437/Eurospeech.2001-11

## One-Sentence Summary
This paper demonstrates analytically and experimentally that H1*-H2* (the amplitude difference of the first two harmonics after inverse filtering) is NOT a reliable measure of open quotient alone, because it depends jointly on both open quotient and asymmetry coefficient, and that experimental voice data often falls outside the domain predicted by any glottal flow model.

## Problem Addressed
The voice analysis literature widely assumes that H1*-H2* is a reliable spectral correlate of the glottal open quotient (Oq). This paper tests that hypothesis by deriving analytical spectral formulas for three glottal flow models (LF, R++, KLGLOTT88) and comparing the predicted H1*-H2* domains against real speech and singing measurements.

## Key Contributions
- Derives closed-form spectral formulas for the LF model and KLGLOTT88 model derivatives
- Shows that H1*-H2* depends on BOTH Oq and asymmetry coefficient (alpha_m) for 5-parameter models (LF, R++)
- Shows the KLGLOTT88 model gives a unique Oq-to-H1*-H2* mapping ONLY because it lacks an asymmetry parameter (4 parameters)
- Demonstrates that many experimental H1*-H2* measurements from speech and singing fall OUTSIDE the domain predicted by any glottal flow model
- Concludes that source/filter interaction may invalidate inverse filtering assumptions

## Methodology
- Analytical derivation of spectra for LF, R++, and KLGLOTT88 glottal flow models
- Computation of H1*-H2* domains as functions of Oq and alpha_m for each model
- Experimental validation using:
  - Male speech: sustained vowel /a/ from relaxed to pressed voice, with EGG reference for Oq
  - Singing: database of 18 professional singers, crescendo on /a/ at C4 (261 Hz) by a baritone
  - Two inverse filtering methods: LPC-based and Hanson's formant-based correction

## Key Equations

### LF Model Derivative Spectrum (abrupt closure, Ta = 0)

$$U'(f) = \frac{E}{\omega_g} \cdot \frac{1}{1 + (f/f_g)^2} \cdot \left| \frac{\sin(\pi f O_q T_0)}{\pi f O_q T_0} \right| \cdot (\text{asymmetry-dependent terms})$$

The full formula (Eq. 1 in paper) involves the implicit parameter alpha satisfying:

$$e^{-\alpha} + \alpha \frac{\alpha_m}{\pi} \sin\left(\frac{\pi}{\alpha_m}\right) - \cos\left(\frac{\pi}{\alpha_m}\right) = 0$$

### KLGLOTT88 Model Spectrum (Eq. 2)

The KLGLOTT88 spectrum has a simpler closed form because alpha_m is fixed (constant asymmetry), giving a direct Oq-to-H1*-H2* mapping.

### H1*-H2* Definition

$$\text{H1*-H2*} = 20 \log_{10}\left(\frac{|U'(f_0)|}{|U'(2f_0)|}\right)$$

Where H1* and H2* are the amplitudes of the first and second harmonics of the glottal flow derivative spectrum after inverse filtering (removing vocal tract influence).

### Hanson's Formant Correction Formula

$$C_k = 10 \log_{10}\left(1 + \left(\frac{f_k}{F_1}\right)^2\right)$$

Where $F_1$ is the first formant frequency and $f_k$ is the frequency of harmonic $k$. This value is subtracted from harmonic amplitudes to remove the effect of the first formant.

## Parameters

| Name | Symbol | Units | Default | Range | Notes |
|------|--------|-------|---------|-------|-------|
| Open quotient | $O_q$ | dimensionless | ~0.5 | 0.2-0.9 | Ratio of open phase to fundamental period |
| Asymmetry coefficient | $\alpha_m$ | dimensionless | ~2/3 | 0.55-0.9 | Ratio of opening phase to open phase |
| Speed quotient | $S_q$ | dimensionless | 2 | >0 | $\alpha_m = S_q / (1 + S_q)$ |
| Return phase | $T_a$ | seconds | 0 (abrupt) | >=0 | Fifth LF parameter; smooths closure |
| H1*-H2* (LF) | — | dB | — | -5 to +10 | Depends on both Oq AND alpha_m |
| H1*-H2* (R++) | — | dB | — | -5 to +15 | Wider range than LF |
| H1*-H2* (KLGLOTT88) | — | dB | — | ~0 to +8 | Depends on Oq only (alpha_m fixed) |

## Implementation Details

### Model comparison (key differences)
- **LF model**: 5 parameters (T0, Av, Oq, alpha_m, Ta). H1*-H2* depends on both Oq and alpha_m.
- **R++ model**: 5 parameters. Also has Oq-alpha_m ambiguity for H1*-H2*.
- **KLGLOTT88**: 4 parameters (no independent alpha_m; fixed asymmetry). Only model where H1*-H2* uniquely determines Oq.

### H1*-H2* domain of variation (from Figure 3)
- **LF model**: H1*-H2* ranges from about -5 dB (low Oq, high alpha_m) to +10 dB (high Oq, low alpha_m)
- **R++ model**: H1*-H2* ranges from about -5 dB to +15 dB (wider than LF)
- **KLGLOTT88**: H1*-H2* ranges from about 0 dB to +8 dB (narrower, monotonic with Oq)

### Ambiguity in parameter estimation (Figure 4)
For the LF model, iso-H1*-H2* contours in the (Oq, alpha_m) plane show that a single H1*-H2* value corresponds to a continuous curve of (Oq, alpha_m) pairs. For example:
- H1*-H2* = 0 dB could mean Oq=0.35, alpha_m=0.67 OR Oq=0.75, alpha_m=0.88
- H1*-H2* = 4 dB could mean Oq=0.5, alpha_m=0.67 OR Oq=0.85, alpha_m=0.85

### Experimental findings
- **Speech** (Figure 5): Male /a/ from relaxed to pressed. LPC-inverse-filtered H1*-H2* values partially fall outside the LF model's predicted domain. Formant correction gives different values than LPC inverse filtering.
- **Singing** (Figure 6): Baritone crescendo on /a/ at C4. H1*-H2* values range from -30 to +20 dB, massively exceeding ANY model's predicted range.

## Figures of Interest
- **Fig 1 (p. 2):** Oq variations in time and frequency domains (LF model). Shows how increasing Oq shifts spectral energy toward lower harmonics.
- **Fig 2 (p. 2):** Alpha_m variations in time and frequency domains (LF model). Shows how changing asymmetry affects the low-frequency spectral shape.
- **Fig 3 (p. 2):** Domain of H1*-H2* variation as function of Oq for LF, R++, and KLGLOTT88 models. Critical figure showing KLGLOTT88's unique monotonic relationship vs. the ambiguous bands of LF/R++.
- **Fig 4 (p. 2):** Iso-H1*-H2* contours in the (Oq, alpha_m) plane for the LF model. Demonstrates the many-to-one mapping.
- **Fig 5 (p. 3):** Experimental H1*-H2* vs. EGG-measured Oq for male speech. Shows data partially outside LF model bounds.
- **Fig 6 (p. 3):** Experimental H1*-H2* vs. EGG-measured Oq for singing (baritone crescendo). Shows data massively outside all model bounds.

## Results Summary

### Theoretical findings
1. For KLGLOTT88 only: H1*-H2* is a monotonic function of Oq (because alpha_m is fixed). Hanson's work using KLGLOTT88 to estimate Oq from H1*-H2* is valid only within this limited model.
2. For LF and R++ models: H1*-H2* is a function of BOTH Oq and alpha_m. A single H1*-H2* measurement cannot uniquely determine Oq. Additional spectral measures are needed.
3. The return phase (Ta) has a secondary effect on H1*-H2* but is less important than Oq and alpha_m.

### Experimental findings
4. A significant portion of measured H1*-H2* values in speech fall outside the domain predicted by the LF model.
5. In singing, the discrepancy is even larger -- H1*-H2* values from -30 to +20 dB are observed, far beyond any model's range of approximately -5 to +15 dB.
6. This suggests either: (a) current GFM models cannot capture the full variability of voice production, or (b) source/filter interaction invalidates the inverse filtering assumption.

### Practical implication
The covariation of parameters in natural speech may reduce the ambiguity in practice. For example, lax voice tends to have high Oq, high spectral tilt, low asymmetry, and low voicing amplitude simultaneously, which constrains the plausible (Oq, alpha_m) combinations for a given H1*-H2*.

## Limitations
- Only analyzes the abrupt closure case (Ta=0) in detail; smooth closure effects are mentioned but not fully explored
- Limited experimental data (one male speaker for speech, one baritone for singing)
- Inverse filtering quality is not independently validated
- Does not propose a solution for the parameter estimation ambiguity
- Does not account for source-filter interaction in the models

## Testable Properties
- **KLGLOTT88 Oq-H1*-H2* monotonicity**: In the KLGLOTT88 model, H1*-H2* must be a monotonically increasing function of Oq
- **LF model H1*-H2* range**: For the LF model with abrupt closure, H1*-H2* must fall in approximately [-5, +10] dB for Oq in [0.2, 0.9] and alpha_m in [2/3, 0.9]
- **R++ model wider range**: R++ H1*-H2* domain is strictly wider than LF H1*-H2* domain for the same Oq range
- **Ambiguity**: For LF model, any H1*-H2* value in [0, 5] dB must correspond to at least two distinct (Oq, alpha_m) pairs
- **Increasing Oq increases H1*-H2* (at fixed alpha_m)**: At any fixed asymmetry coefficient, increasing Oq must increase H1*-H2*
- **Increasing alpha_m decreases H1*-H2* (at fixed Oq)**: At any fixed open quotient, increasing asymmetry coefficient must decrease H1*-H2*

## Relevance to Project

### For the Qlatt synthesizer's voice source model
This paper is a critical warning against naive use of H1*-H2* as a proxy for open quotient. The Qlatt synthesizer uses the LF model (via the CALM parameterization from Doval 2003), which has 5 parameters including asymmetry. When interpreting voice quality literature that reports H1*-H2* measurements, one cannot simply map these to Oq -- the asymmetry coefficient must also be considered.

### For voice quality presets
When defining breathy/modal/pressed voice quality presets, the system should set BOTH Oq and alpha_m (or equivalently, the Rd parameter which encodes their covariation). Setting only Oq based on H1*-H2* targets from the literature will produce incorrect spectral shapes if alpha_m is wrong.

### For parameter estimation and validation
When comparing synthesized output against natural speech measurements, H1*-H2* alone is insufficient for validating voice source parameters. Additional spectral measures (H1*-A3*, harmonic richness factor, etc.) or time-domain measures (from EGG) are needed.

### Connection to existing collection papers
- **Doval_2003_VoiceSourceCALM** and **Doval_2006_SpectrumGlottalFlowModels**: Same research group. The CALM model was developed partly to address the spectral ambiguity documented here, by providing a more perceptually relevant parameterization.
- **Henrich_2003_JND_OpenQuotient**: Follow-up by same first author establishing the perceptual resolution of Oq and alpha_m.
- **Henrich_2005_GlottalOpenQuotientSinging**: Follow-up providing empirical Oq ranges across laryngeal mechanisms.
- **Hanson_1995/1997/1999**: The KLGLOTT88-based Oq estimation approach that this paper shows is model-limited.
- **Klatt_1990_VoiceQualityVariations**: Uses the KLGLOTT88 model, so its Oq estimates are valid within that model's constraints but may not transfer to LF-based synthesis.

## Open Questions
- [ ] How should the Qlatt synthesizer handle the Oq-alpha_m ambiguity when targeting specific H1*-H2* values from the literature?
- [ ] Is the CALM model (Doval 2003) less susceptible to this ambiguity because it parameterizes differently?
- [ ] What additional spectral measures beyond H1*-H2* should be tracked in the synthesizer for voice quality validation?
- [ ] The out-of-range experimental data: is it primarily a source-filter interaction issue or a model inadequacy issue?

## Related Work Worth Reading
- Doval & d'Alessandro (1997) "Spectral correlates of glottal waveform models: an analytic study" ICASSP 97 -- predecessor with detailed spectral derivations
- Doval, d'Alessandro, Diard (1997) "Spectral methods for voice source parameter estimation" Eurospeech 97 -- companion spectral estimation methods
- Doval & d'Alessandro (1999) LIMSI report NDL N 99-07 -- full 22-page derivation of glottal flow model spectra (unpublished, referenced as [11])
- Veldhuis (1998) "A computationally efficient alternative for the Liljencrants-Fant model" JASA 103 -- the R++ model analyzed here

## Collection Cross-References

### Already in Collection
- [[Fant_1985_LFModelGlottalFlow]] -- cited as [1]; the LF model whose spectrum is derived here
- [[Fant_1988_LFFrequencyDomainInterpretation]] -- cited as [2]; frequency domain interpretation of LF parameters
- [[Klatt_1990_VoiceQualityVariations]] -- cited as [3]; defines KLGLOTT88 model analyzed here
- [[Hanson_1995_GlottalCharacteristicsFemale]] -- cited as [4]; uses KLGLOTT88-based H1*-H2* estimation
- [[Hanson_1997_GlottalCharacteristicsFemaleAcoustic]] -- cited as [7]; acoustic correlates using KLGLOTT88
- [[Fant_1997_VoiceSourceConnectedSpeech]] -- cited as [8]; empiric Oq-H1*-H2* formula for LF model
- [[Doval_2003_VoiceSourceCALM]] -- closely related (same group, addresses spectral parameterization)
- [[Doval_2006_SpectrumGlottalFlowModels]] -- extends the spectral analysis from this paper
- [[Henrich_2003_JND_OpenQuotient]] -- follow-up perceptual study by same first author
- [[Henrich_2005_GlottalOpenQuotientSinging]] -- follow-up empirical study by same first author

### New Leads (Not Yet in Collection)
- Veldhuis (1998) "A computationally efficient alternative for the Liljencrants-Fant model and its perceptual evaluation" JASA 103, 566-571 -- R++ model definition
- Sundberg, Andersson, Hultqvist (1999) "Effects of subglottal pressure variation on professional baritone singers' voice sources" JASA 105, 1965-1971 -- cited for Oq-H1*-H2* correlation in singing

### Cited By (in Collection)
- [[Doval_2006_SpectrumGlottalFlowModels]] -- extends the spectral formulas derived here to a complete spectral model
- [[Fant_1985_LFModelGlottalFlow]] -- lists this in its "Cited By" section
- [[Fant_1988_LFFrequencyDomainInterpretation]] -- lists this as a conceptual link
- [[Hanson_1995_GlottalCharacteristicsFemale]] -- lists this in its "Cited By" section
- [[Henrich_2003_JND_OpenQuotient]] -- uses the same parameterization framework (Oq, alpha_m) for perceptual testing
- [[Henrich_2005_GlottalOpenQuotientSinging]] -- empirical measurements building on the theoretical framework here

### Conceptual Links (not citation-based)
- [[Drugman_2020_GlottalSourceEstimation]] -- Strong. Both analyze the relationship between time-domain glottal parameters (Oq, alpha_m) and spectral measures (H1-H2); Drugman's NAQ feature captures effects of both Oq and alpha_m that this paper shows are inseparable from H1-H2 alone.
- [[Kreiman_2012_VoiceQualityHarmonicOQ]] -- Strong. Addresses the same fundamental question of how harmonic measures relate to open quotient, from a perceptual perspective.
- [[Iseli_2007_VoiceSourceAgeSexVowel]] -- Moderate. Uses a formant correction formula similar to Hanson's (analyzed here) for H1*-H2* estimation across speakers.
- [[Hanson_2001_ModelsPhonation]] -- Strong. Extends Hanson's approach to phonation modeling, directly relevant to the KLGLOTT88 limitation documented here.
- [[Titze_1992_VocalIntensity]] -- Moderate. Titze's analytical model relates source spectrum to glottal parameters using a simplified one-parameter spectral model; this paper shows the limitations of such simplification when Oq and alpha_m covary.
