# On the Linearity of the Relationship Between the Sound Pressure Level and the Negative Peak Amplitude of the Differentiated Glottal Flow in Vowel Production

**Authors:** Paavo Alku, Juha Vintturi, Erkki Vilkman
**Year:** 1999
**Venue:** Speech Communication 28 (1999) 269-281
**DOI:** 10.1016/S0167-6393(99)00020-5

## One-Sentence Summary

This paper demonstrates that the SPL-dpeak relationship is better modeled by two linear segments (one for soft phonation, one for normal/loud) rather than a single line, because glottal waveform shape changes at the soft-to-normal transition contribute to SPL independently of dpeak amplitude.

## Problem Addressed

Previous work (Gauffin & Sundberg, 1989) established a single linear relationship between SPL and dpeak (the negative peak amplitude of the differentiated glottal flow, equivalent to Ee in LF-model notation). This paper shows that relationship breaks down when a wide intensity range (soft through loud) is analyzed, revealing a "knee" at the soft-to-normal phonation boundary.

## Key Contributions

- SPL-dpeak graphs show a clear "knee" between soft and normal phonation, requiring two linear segments for accurate modeling
- The slope for soft phonation (slope1) is consistently larger than the slope for normal/loud phonation (slope2) across all 11 speakers
- The knee is caused by changes in glottal waveform shape (spectral decay), not by F0 changes
- Both H1-H2 and PSP (parabolic spectral parameter) decrease at the knee point, confirming spectral tilt reduction
- The phenomenon persists when F0 effects are removed (ESP analysis)

## Methodology

- 11 Finnish speakers (5 female, 6 male) produced /pa:p:a/ at gradually increasing loudness from softest possible to ~105-110 dB SPL
- Glottal flow estimated via inverse filtering (DAP-based, not LPC) from speech recorded at 40 cm
- SPL-dpeak graphs modeled with two optimal linear functions, dividing data points to minimize MSE
- ESP (Energy of Synthesized Period) computed to remove F0 effects
- H1-H2 and PSP measured to quantify spectral decay changes

## Key Equations

### SPL Computation
$$
SPL_{speech} = 94 \text{ dB} + 20 \log \frac{RMS_{speech}}{RMS_{calibration}}
$$
Where: calibration tone = 94 dB at 40 cm distance.

### Lip Radiation Differentiator
$$
H(z) = 1.0 - 0.98z^{-1}
$$
Used to compute the differentiated glottal flow from the estimated glottal volume velocity.

### Parabolic Spectral Parameter (PSP)
$$
y(k) = ak^2 + b
$$
Where: $k$ is discrete frequency, $a$ is the parabolic parameter (more negative = steeper spectral decay), matched to pitch-synchronous glottal spectrum via MSE criterion.

## Parameters

| Name | Symbol | Units | Default | Range | Notes |
|------|--------|-------|---------|-------|-------|
| Negative peak amplitude | dpeak (Ee) | dB | - | - | Main excitation parameter; equivalent to LF-model Ee |
| Sound pressure level | SPL | dB | - | ~55-110 | At 40 cm from lips |
| Slope (soft phonation) | slope1 | dB/dB | - | Female: 0.82 (s.d. 0.29), Male: 1.14 (s.d. 0.27) | Steeper segment |
| Slope (normal/loud) | slope2 | dB/dB | - | Female: 0.36 (s.d. 0.27), Male: 0.54 (s.d. 0.34) | Shallower segment |
| H1-H2 | H1-H2 | dB | - | - | Spectral tilt measure; decreases with intensity |
| PSP | a | - | - | - | Parabolic spectral parameter; closer to zero = less spectral decay |
| F1 center (female) | F1 | Hz | - | 646-851 | From pitch-synchronous spectra |
| F1 center (male) | F1 | Hz | - | 528-635 | From pitch-synchronous spectra |
| F0 range (female) | F0 | Hz | - | 125-500 | Min to max across intensity range |
| F0 range (male) | F0 | Hz | - | 75-315 | Min to max across intensity range |

### Knee-Point SPL Values (Tables 1 & 2)

**Female speakers** (SPL at knee, dB):

| Speaker | SPL1 (last soft) | dpeak1 | SPL2 (first normal) | dpeak2 |
|---------|------------------|--------|---------------------|--------|
| HR | 72 | 65 | 73 | 63 |
| HS | 65 | 59 | 71 | 59 |
| AS | 82 | 69 | 86 | 69 |
| EL | 87 | 68 | 97 | 74 |
| LM | 84 | 72 | 88 | 77 |

**Male speakers** (SPL at knee, dB):

| Speaker | SPL1 (last soft) | dpeak1 | SPL2 (first normal) | dpeak2 |
|---------|------------------|--------|---------------------|--------|
| EV | 69 | 62 | 74 | 64 |
| HP | 70 | 63 | 74 | 61 |
| PA | 68 | 64 | 73 | 61 |
| JK | 63 | 57 | 70 | 56 |
| TB | 87 | 70 | 92 | 75 |
| JV | 66 | 63 | 68 | 62 |

## Implementation Details

### Inverse Filtering Method
- Based on Alku (1992) with DAP modeling instead of LPC for vocal tract estimation
- Analysis window: 50 ms (increased to 70 ms for low-pitched males to cover 4 glottal cycles)
- Lip radiation canceled by first-order all-pole filter with pole at z = 0.98
- DC-gain of vocal tract filter scaled to unity for amplitude estimation
- dpeak measured as mean of negative peak amplitudes over 4 consecutive glottal cycles

### Two-Line Fitting Algorithm
1. Divide N SPL-dpeak data points into Group1 (softest K) and Group2 (remaining N-K)
2. Fit optimal linear function to each group (least squares)
3. Sweep K from 3 to N-3, computing total MSE for each partition
4. Select partition with minimum total MSE
5. Result: lineopt,1 (soft) and lineopt,2 (normal/loud)

### ESP Computation (to remove F0 effects)
1. Cut one glottal cycle from estimated flow waveform
2. Differentiate the single cycle
3. Filter through the same vocal tract model used in inverse filtering
4. Compute energy of resulting single-period synthetic speech signal

## Figures of Interest

- **Fig. 1 (p. 3):** Glottal volume velocity waveform and its first derivative, defining fAC, fDC, and dpeak
- **Fig. 2 (p. 5):** Example SPL-dpeak graph showing the knee between soft and normal phonation
- **Fig. 3 (p. 6):** Glottal flow and differentiated flow waveforms at and just past the knee point, illustrating shape change
- **Fig. 4 (p. 6):** SPL-dpeak graph with two optimal lines, female speaker
- **Fig. 5 (p. 7):** SPL-dpeak graph with two optimal lines, male speaker
- **Fig. 6 (p. 9):** Four-panel plot: SPL-dpeak, ESP-dpeak, H1-H2 vs SPL, PSP vs SPL
- **Fig. 7 (p. 10):** Spectra of radiated speech at softest, pre-knee, and post-knee phonations

## Results Summary

- slope1 > slope2 for all 11 speakers (p = 0.0033, Wilcoxon)
- Mean slopes: Female slope1=0.82, slope2=0.36; Male slope1=1.14, slope2=0.54
- Correlation coefficients for two-line model: 0.94 (lineopt,1) and 0.93 (lineopt,2)
- ESP-dpeak graphs show same knee (p = 0.026), ruling out F0 as cause
- H1-H2 and PSP both decrease significantly at the knee (p = 0.0033 each)
- Softest phonation: F0 is strongest spectral component (mean energy difference without F0: 8.51 dB)
- Pre/post-knee phonation: overtones near F1 dominate (energy difference: 0.92 dB and 0.36 dB)
- Formant tuning ruled out as cause of knee (F1-harmonic proximity analysis)

## Limitations

- Small sample size (11 speakers, all Finnish)
- Only vowel /a:/ analyzed (from /pa:p:a/)
- dpeak alone is an "extremely compressed" representation of the LF model (only 1 of 4 parameters)
- Authors acknowledge need for a single parameter that captures both amplitude and shape of the differentiated flow

## Testable Properties

- slope1 > slope2 for any speaker's SPL-dpeak graph when wide intensity range is analyzed
- Male speakers show steeper slopes than female speakers on average
- H1-H2 must decrease monotonically with increasing SPL (overall trend)
- PSP parameter a must increase (toward zero) with increasing SPL
- At soft phonation levels, F0 component dominates SPL; at normal/loud levels, F1-region harmonics dominate
- The knee in SPL-dpeak persists when F0 effects are removed (ESP analysis)
- dpeak in dB corresponds to Ee in LF-model notation

## Relevance to Project

This paper refines the relationship between voice source amplitude (Ee/dpeak) and radiated SPL, which is critical for the Qlatt synthesizer's intensity control. The key insight is that a single linear mapping from Ee to SPL is inaccurate across a wide dynamic range -- at soft phonation levels, SPL is more sensitive to Ee changes (steeper slope), while at normal/loud levels, waveform shape (spectral tilt) becomes the dominant factor. This means the synthesizer's amplitude-to-SPL mapping should account for this nonlinearity, particularly when implementing voice quality variations across intensity levels. The connection between dpeak and Ee (LF model) is explicitly stated, linking directly to the Fant 1985/1995 LF model implementations already in the project.

## Open Questions

- [ ] How should the two-slope model be integrated into the synthesizer's gain structure? Currently `ndbScale` and `dbToLinear` assume a single mapping.
- [ ] Does the knee point correspond to a perceptual boundary (e.g., soft-to-normal voice quality shift)?
- [ ] Could the PSP parameter complement Ee for more accurate intensity control in synthesis?
- [ ] What are the knee-point SPL values for English speakers vs. Finnish?

## Related Work Worth Reading

- Gauffin & Sundberg (1989) - Original single-line SPL-dpeak relationship
- Fant (1995) - LF-model revisited, frequency domain analysis
- Fant et al. (1985) - Four-parameter LF model of glottal flow
- Alku et al. (1997) - PSP: parabolic spectral parameter for glottal flow quantification
- Holmberg et al. (1988) - Glottal airflow measurements for male/female at soft/normal/loud
- Gramming & Sundberg (1988) - Spectrum factors in phonetograms, strongest partial shifts with intensity
- Titze & Sundberg (1992) - Vocal intensity in speakers and singers
- Childers & Lee (1991) - Vocal quality factors: analysis, synthesis, perception

## Collection Cross-References

### Already in Collection
- [[Fant_1985_LFModelGlottalFlow]] — cited as the source of the LF model; dpeak is equivalent to Ee parameter
- [[Fant_1960_AcousticTheorySpeechProduction]] — cited for the source-filter theory that justifies dpeak as the main vocal tract excitation
- [[Childers_Lee_1991_VoiceQualityFactors]] — cited for frequency-domain voice source quantification (spectral decay)
- [[Holmberg_1988_GlottalAirflowPressure]] — cited for glottal airflow measurements at soft/normal/loud; Alku notes their SPL range was only ~11 dB
- [[Titze_1992_VocalIntensity]] — cited for vocal intensity in speakers/singers and H1-H2 as spectral decay measure

### New Leads (Not Yet in Collection)
- Fant (1995) — "The LF-model revisited" — frequency domain analysis of LF model parameters

### Now in Collection (previously listed as leads)
- [[Gauffin_1989_SpectralCorrelatesGlottalVoice]] — foundational paper establishing the single linear SPL-dpeak relationship that this paper refines. Alku shows this relationship breaks down across a wide intensity range, revealing a "knee" at the soft-to-normal phonation boundary where the SPL-dpeak slope changes.
- [[Alku_1997_ParabolicSpectralParameter]] — introduces the PSP method for glottal flow spectral decay quantification, used here as a key analysis tool to characterize phonation type changes across the intensity range.

### Conceptual Links (not citation-based)

**Vocal intensity and SPL regulation:**
- [[Bjorklund_2016_SubglottalPressureSPL]] — addresses the same SPL production chain from a different angle: maps subglottal pressure to SPL. Alku's finding that dpeak-to-SPL slope changes at the soft/normal boundary could explain why Bjorklund's Ps-SPL regression shows scatter at low intensities -- the mapping from pressure to acoustic output goes through a source waveform shape change that a simple regression misses.
- [[Isshiki_1964_VoiceIntensityRegulation]] — establishes that the dominant intensity mechanism shifts from laryngeal (glottal resistance) at low pitch to respiratory (flow rate) at high pitch. Alku's "knee" at the soft-to-normal boundary may reflect this same transition: at soft levels, small laryngeal adjustments change waveform shape (high slope1), while at louder levels, respiratory-driven amplitude scaling dominates (lower slope2).
- [[Sundberg_2005_GlottalSourceLoudness]] — provides quantitative equations relating subglottal pressure to voice source parameters (MFDR/dpeak, H1-H2, closed quotient) across F0 levels. Directly complements Alku's two-slope finding: Sundberg's MFDR-vs-Ps data should show the same knee if soft phonation is included.

**Spectral tilt and voice quality:**
- [[Lienard_1999_VocalEffortVowelSpectral]] — quantifies how vocal effort modifies spectral tilt, F0, and F1. Lienard's spectral tilt changes across effort levels are the same phenomenon Alku measures with H1-H2 and PSP, but from the radiated speech perspective rather than the inverse-filtered source.
- [[Herbst_2015_GlottalAdductionSubglottalPressure]] — shows independent control of adduction and pressure in trained singers, producing different phonation types. Alku's knee may correspond to the boundary where untrained speakers shift from primarily adduction-mediated intensity (soft) to primarily pressure-mediated intensity (normal/loud).

### Cited By (in Collection)
- [[Vogel_2010_FatigueSpeechAcoustics]] — cites Alku 1999 in context of voice source analysis methods for studying vocal fatigue effects on SPL-dpeak relationships
