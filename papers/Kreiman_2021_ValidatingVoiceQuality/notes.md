# Validating a Psychoacoustic Model of Voice Quality

**Authors:** Jody Kreiman, Yoonjeong Lee, Marc Garellek, Robin Samlan, Bruce R. Gerratt
**Year:** 2021
**Venue:** Journal of the Acoustical Society of America, Vol. 149, No. 1, pp. 457-465
**DOI:** https://doi.org/10.1121/10.0003331

## One-Sentence Summary
This paper validates a psychoacoustic model of voice quality by demonstrating that its parameter set (harmonic source, inharmonic source, vocal tract, F0, amplitude) is both sufficient (198/200 synthetic voices indistinguishable from natural) and necessary (removing any harmonic source parameter degrades perceptual match).

## Problem Addressed
No agreed-upon method exists for objective measurement of perceived voice quality. Traditional protocols (CAPE-V, GRBAS) partition quality into separate perceptual dimensions (breathiness, roughness, grade) but cannot capture overall voice quality as a whole. Two voices with identical scale ratings can sound substantially different. This paper validates an alternative model treating quality as perceptually integral.

## Key Contributions
- Demonstrates that the psychoacoustic model's parameter set is **sufficient**: 198/200 synthetic copies were perceptually indistinguishable from natural voices (d' < 2.10 criterion)
- Demonstrates that all four harmonic source parameters are **necessary**: removing any one significantly degrades perceptual match
- Shows no relationship between severity of vocal pathology and model failure rate (r = -0.28, r^2 = 0.078)
- The two failures were due to temporal unsteadiness in noise levels, not model parameter limitations
- Validates use of automatic acoustic analysis tools (VoiceSauce) for parameter extraction

## The Psychoacoustic Model Parameters (Table I)

| Model Component | Parameters |
|----------------|------------|
| Harmonic voice source | H1-H2, H2-H4, H4-2kHz, 2kHz-5kHz |
| Inharmonic voice source | Spectral slope in four ranges (0-961 Hz, 961-2307 Hz, 2307-3653 Hz, 3653 Hz-5 kHz); HNR mean |
| Pitch | F0 mean; F0 contour |
| Loudness | Amplitude mean; amplitude contour |
| Vocal tract | Formants 1-11; bandwidths 1-11; spectral zeros 1-3; zero bandwidths 1-3 |

### Harmonic Source Model Detail
The harmonic source spectrum is modeled as a **four-piece piecewise linear approximation** in dB vs frequency:
1. **H1 to H2** — lowest harmonics (open quotient / spectral tilt region)
2. **H2 to H4** — low-mid harmonics
3. **H4 to harmonic nearest 2 kHz** — mid-frequency slope
4. **Harmonic nearest 2 kHz to harmonic nearest 5 kHz** — high-frequency slope

This smoothing eliminates differences in amplitude between adjacent harmonics within each range, capturing only the overall spectral shape.

### Inharmonic (Noise) Source Model Detail
The noise source spectrum is estimated via cepstral-domain comb filtering (de Krom 1993 / Qi & Hillman 1997), then smoothed with a four-piece approximation spanning:
1. 0-961 Hz
2. 961-2307 Hz
3. 2307-3653 Hz
4. 3653 Hz-5 kHz

A 100-tap FIR filter is synthesized from this spectral shape, and white noise is passed through it to create the noise source time series. The ratio of noise to harmonic energy (HNR mean) is also included.

### Vocal Tract Model
- **11 formants** with frequencies and bandwidths
- **3 spectral zeros** with bandwidths (for nasal coupling and other anti-resonances)
- Formant values imported from inverse filtering, then adjusted during analysis-by-synthesis

## Methodology

### Experiment 1: Sufficiency
- 200 voices: 100 with diagnosed vocal pathology (50M, 50F), 100 normal (50M, 50F)
- All sustained /a/ at comfortable pitch/loudness, 1-s steady-state portion, downsampled to 10 kHz
- Synthetic copies created via analysis-by-synthesis using UCLA voice synthesizer
- Inverse filtering (Javkin et al. 1987) to extract source pulses
- Harmonic source fitted with four-piece model
- Noise source extracted via cepstral comb filter, smoothed with four-piece model
- F0 and amplitude contours measured from originals
- Vocal tract modeled from inverse filtering formants/bandwidths
- Final perceptual adjustment by first author
- 400 voice pairs tested: 200 same (natural-natural or synthetic-synthetic), 200 different (natural-synthetic)
- Same/different task + confidence rating (1-5) -> 10-point scale -> d' calculation
- d' = 2.10 corresponds to 75% correct (criterion for discriminability)

### Experiment 2: Necessity of Harmonic Source Parameters
- 24 voices (12M, 12F) selected to span low/mid/high values for each source parameter
- Four versions per voice:
  1. Original four-piece source model
  2. H1-H2 and H2-H4 merged -> single H1-H4
  3. H2-H4 and H4-2kHz merged -> single H2-2kHz
  4. H4-2kHz and 2kHz-5kHz merged -> single H4-5kHz
- Vocal tract (formants/bandwidths) re-adjusted for each three-piece version to isolate source model effects
- HNR levels also reset to compensate for changed harmonic-noise interaction
- 20 listeners, same/different task with confidence ratings

## Key Results

### Experiment 1: Discrimination Performance
| Measure | Mean d' | SD | Range |
|---------|---------|-----|-------|
| Sample matching (across voices) | 0.81 | 0.50 | -0.14 to 1.86 |
| Talker matching (across voices) | 0.42 | 0.46 | -0.43 to 1.34 |
| Sample matching, females (across listeners) | 0.54 | 0.39 | -0.45 to 1.99 |
| Talker matching, females (across listeners) | 0.19 | 0.54 | -2.57 to 1.17 |
| Sample matching, males (across listeners) | 0.55 | 0.47 | -0.44 to 2.40 |
| Talker matching, males (across listeners) | 0.18 | 0.40 | -0.87 to 1.22 |

- **No listener exceeded criterion (d' >= 2.10) across voices** for either task
- **Only 2/200 voices** (both male, pathological) exceeded criterion across listeners for sample matching (d' = 2.28, 2.40)
- Even those 2 voices were **below criterion for talker matching** (d' = 1.14, 0.87) — listeners recognized them as the same speaker
- The 2 failures showed temporal variation in noise levels (CPP fluctuation) that the steady-state model couldn't capture

### Experiment 2: Three-Piece vs Four-Piece Source Models (Table II)
| Model | Mean d' | SD | Min | Max |
|-------|---------|-----|-----|-----|
| Natural vs four-piece | 1.48 | 0.58 | 0.40 | 2.48 |
| Natural vs H1-H4 (merged H1-H2, H2-H4) | 1.92 | 0.92 | 0.71 | 3.74 |
| Natural vs H2-2kHz (merged H2-H4, H4-2kHz) | 1.95 | 1.03 | 0.58 | 5.06 |
| Natural vs H4-5kHz (merged H4-2kHz, 2kHz-5kHz) | 2.25 | 0.94 | 0.77 | 4.30 |

- All three-piece models significantly worse than four-piece (matched pair t-tests):
  - vs H1-H4: t(23) = -3.69, p < 0.001
  - vs H2-2kHz: t(23) = -2.98, p < 0.007
  - vs H4-5kHz: t(23) = -3.70, p < 0.001
- **H4-5kHz merger produced the worst match** (mean d' = 2.25, exceeding criterion)
- Low-frequency mergers (H1-H4, H2-2kHz) primarily affected vowel quality (partially correctable via formant adjustment)
- High-frequency merger (H4-5kHz) affected "breathy/turbulent" quality and brightness, **not correctable** by formant adjustment

## Implementation Details

### Source-Filter Interaction
- Low-frequency source changes (below H4) strongly interact with F1/F2 amplitudes, creating vowel quality shifts
- This means source and vocal tract are not independently adjustable below ~500 Hz
- High-frequency source changes affect perceived breathiness/brightness independent of formant positions
- The paper explicitly states: "speakers must adjust source and filter jointly if they are to simultaneously achieve both voice quality and vowel quality goals"

### Synthesis Architecture
- Harmonic source: pulse train with individual pulse periods and amplitudes from F0/amplitude contours
- Noise source: white noise filtered through 100-tap FIR filter shaped by four-piece noise spectrum model
- Complete source = pulse train + shaped noise (ratio controlled by HNR)
- Source filtered through vocal tract model (11 formants + 3 zeros with bandwidths)
- Sampling: 10 kHz (analysis and synthesis)

### Temporal Limitation
- Model describes only steady-state phonation
- F0 and amplitude variability are included (individual pulse periods/amplitudes track original)
- Other parameters (source spectral shape, noise levels, formant values) are static per token
- The 2 synthesis failures were caused by **time-varying noise levels** not captured by static HNR mean
- Coefficients of variation for model parameters may quantify within-sample variability (noted as future work)

## Figures of Interest
- **Fig. 1 (page 3):** Distribution of severity ratings — spans full 0-1000 range, confirming wide pathology coverage
- **Fig. 2 (page 4):** Parameterization of harmonic and inharmonic sources — shows before/after model fitting
- **Fig. 3 (page 5):** CPP over time for the 2 failed voices vs their synthetic copies — shows noise temporal variation
- **Fig. 4 (page 7):** Three-piece source model variants — visual comparison of spectral approximations

## Relevance to Qlatt

### Source Spectrum Parameterization
The four-piece harmonic source model (H1-H2, H2-H4, H4-2kHz, 2kHz-5kHz) provides a validated perceptual decomposition of the glottal source spectrum. This is relevant to:
- **Voice quality presets**: These four parameters are necessary and sufficient to capture voice source quality differences
- **Spectral tilt rules**: The H4-5kHz region is most critical for breathiness/brightness perception and cannot be compensated by formant adjustment
- **ndbScale calibration**: The finding that source and formant changes interact below H4 has implications for how Qlatt's cascade branch calibrates source-tract amplitude relationships

### Noise Source Modeling
The four-piece noise spectral model with independent HNR control validates:
- Separate noise source shaping (not just flat aspiration noise)
- The importance of noise spectral slope for voice quality
- The need for **time-varying** noise parameters for pathological/unsteady voices

### Vocal Tract Parameters
- 11 formants with bandwidths + 3 zeros with bandwidths
- This is significantly more than Qlatt's current formant count (F1-F6 in cascade, F1-F10 in parallel)
- The 3 spectral zeros are relevant to nasal coupling modeling

### Perceptual Thresholds
- d' = 2.10 as criterion for discriminability (75% correct) — useful benchmark for evaluating synthesis quality
- The fact that 198/200 voices passed this threshold sets a high bar for what "perceptually adequate" synthesis means

## Limitations
- Only sustained /a/ vowels tested (not connected speech)
- Steady-state model — no time-varying source spectral shape
- Analysis-by-synthesis by a single expert (first author) — not automated
- 10 kHz sampling rate limits analysis to 5 kHz
- Token-vs-type distinction not fully resolved (matching the specific sample vs the speaker's general quality)

## Open Questions
- [ ] How would the four-piece source model translate to Qlatt's current source parameterization (LF model + spectral tilt)?
- [ ] Could time-varying HNR/noise spectral shape improve synthesis of unsteady voices?
- [ ] What is the relationship between this model's H1-H2 parameter and the LF model's Rd parameter?
- [ ] Would extending Qlatt to 11 formants + 3 zeros improve synthesis quality measurably?

## Related Work Worth Reading
- Kreiman et al. (2014) - "Toward a unified theory of voice production and perception" — original proposal of this model
- Kreiman et al. (2007) - "Measures of the glottal source spectrum" — PCA analysis showing 4 independent source factors (already in collection as Kreiman_2007_GlottalSourceSpectrum)
- Garellek et al. (2016) - "Modeling the voice source in terms of spectral slopes" — spectral slope parameterization
- de Krom (1993) - Cepstral HNR estimation technique used for noise source extraction
- Kreiman et al. (2016) - UCLA voice synthesizer methods (analysis-by-synthesis procedures)

---

## Collection Cross-References

### Already in Collection
- [[Kreiman_2007_GlottalSourceSpectrum]] — PCA of source measures yielding four factors; this paper validates those factors perceptually
- [[Kreiman_2012_VoiceQualityHarmonicOQ]] — Speaker-dependent H1*-H2* vs OQ relationship; complements this paper's finding that H1-H2 alone is insufficient
- [[Kreiman_Gerratt_2010_PerceptualVoiceQualityAssessment]] — Perceptual framework for voice quality; precursor to this validation
- [[Gobl_2003_VoiceQualityEmotion]] — KLSYN88 parameters for voice qualities; this paper's model offers an alternative parameterization
- [[Klatt_1990_VoiceQualityVariations]] — KLGLOTT88/KLSYN88 source model; this paper's four-piece model is a different approach to the same problem
- [[Childers_Lee_1991_VoiceQualityFactors]] — Voice quality factors including OQ, SQ, closure abruptness; complements this model's source decomposition
- [[Hanson_2001_ModelsPhonation]] — HLsyn quasi-articulatory controller; alternative high-level parameterization approach
- [[Lee_2019_AcousticVoiceVariation]] — cited as ref [25]; PCA on the same 13 psychoacoustic measures across 100 speakers, showing harmonic/inharmonic balance as the dominant variability axis. Provides the acoustic variability structure that this paper's perceptual validation builds upon.

### New Leads (Not Yet in Collection)
- **Garellek, Samlan, Gerratt, and Kreiman (2016)** — "Modeling the voice source in terms of spectral slopes," JASA 139, 1404-1410. Provides the spectral slope framework underlying the four-piece source model. Essential companion paper.
- **Kreiman, Gerratt, Garellek, Samlan, and Zhang (2014)** — "Toward a unified theory of voice production and perception," Loquens. Original proposal of the psychoacoustic model validated here. Foundational reference.
- **Signorello, Rhee, Gerratt, and Kreiman (2016)** — Psychoacoustic model of spectral noise in the voice source. Complements the inharmonic source component of this model.

### Conceptual Links (not citation-based)
- [[Fant_1985_LFModelGlottalFlow]] — The LF model parameterizes the glottal pulse shape; this paper's four-piece harmonic model parameterizes the resulting spectrum directly. Different levels of description for the same phenomenon.
- [[Doval_2003_VoiceSourceCALM]] / [[Doval_2006_SpectrumGlottalFlowModels]] — Analytical spectral formulas for glottal models; could be used to derive the four-piece spectral slopes from LF parameters.
- [[Burkhardt_2009_VoiceQualityFormantSynthesis]] — Rule-based voice quality modification using Klatt parameters; this paper's model provides a validated target space for those modifications.
