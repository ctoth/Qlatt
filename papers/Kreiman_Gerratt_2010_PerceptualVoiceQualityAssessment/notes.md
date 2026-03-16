---
title: "Perceptual Assessment of Voice Quality: Past, Present, and Future"
authors: "Jody Kreiman, Bruce R. Gerratt"
year: "2010 (presented at 2009 ASHA Convention)"
venue: "Perspectives on Voice and Voice Disorders, ASHA"
doi_url: "http://journals.asha.org/perspectives/"
---

# Perceptual Assessment of Voice Quality: Past, Present, and Future

## One-Sentence Summary
This paper critiques traditional voice quality rating scales (GRBAS, CAPE-V) as lacking theoretical grounding and proposes a psychoacoustic approach using synthesis-based method-of-adjustment tasks to derive perceptually valid acoustic parameters.

## Problem Addressed
Voice quality measurement has remained essentially unchanged for 2000 years, using subjective rating scales (harsh, breathy, rough, etc.) that lack theoretical foundation, cannot be validated experimentally, and show poor inter-rater reliability at the individual voice level.

## Key Contributions
- Critique of existing protocols: GRBAS, CAPE-V, MDVP, Dysphonia Severity Index all lack grounding in a model of voice quality
- Identification of four factors causing listener disagreement in quality ratings
- Proposal for psychoacoustic model using ANSI quality definition and synthesis-based validation
- Report of 96% listener agreement using method-of-adjustment tasks

## Methodology
The authors propose:
1. Use ANSI definition of quality: "attributes other than pitch and loudness allowing same/different judgments"
2. Develop reliable measurement via method-of-adjustment tasks (not rating scales)
3. Systematically vary acoustic parameters in synthesis to identify perceptually salient ones
4. Build model of minimal, non-redundant parameters that capture integral voice quality

## Key Concepts

### Four Factors Causing Rating Variability
1. **Difficulty isolating individual attributes** in complex acoustic patterns (most important)
2. **Instability of listeners' internal standards** for different qualities
3. **Measurement scale resolution** (number of scale points)
4. **Magnitude of attribute being measured**

### ANSI Definition of Quality (ANSI, 1960)
Quality = those attributes of a sound other than pitch and loudness that allow a listener to judge two sounds as same or different. Implies goal is to capture "integral, overall, personal vocal quality" - not specific features.

### Perceptual-Acoustic Interactions
The perceptual importance of spectral noise depends on harmonic energy:
- More harmonic energy in upper spectrum → more inharmonic energy change needed before listeners notice
- Parallels equal-loudness curves (Fletcher, 1934)
- Implies need for interaction-corrected scales

### Problems with Current Acoustic Measures
- Jitter/shimmer: listeners quite insensitive to changes in sustained vowels
- Cepstral peak prominence, H1-A1, H1-A2, soft phonation index: validity based only on correlations with ratings, not psychoacoustic experiments

## Parameters

| Name | Symbol | Units | Default | Range | Notes |
|------|--------|-------|---------|-------|-------|
| N/A | - | - | - | - | Paper is theoretical; no specific parameter values provided |

## Key Rating Protocols Discussed

| Protocol | Scales | Scale Type | Source |
|----------|--------|------------|--------|
| GRBAS | Grade, Roughness, Breathiness, Asthenicity, Strain | 4-point | Hirano, 1981 |
| CAPE-V | Overall severity, Roughness, Breathiness, Strain, Pitch, Loudness | Visual analog | Kempster et al., 2009 |
| MDVP | Multiple acoustic measures | Instrumental | Kay Elemetrics, 1993 |
| Dysphonia Severity Index | Composite | Instrumental | Wuyts et al., 2000 |

## Implementation Details

### Proposed Approach for Deriving Valid Measures
1. Identify acoustic attributes that best differentiate voices across population
2. Test perceptual significance of each parameter
3. Use speech synthesis to verify parameters capture individual voice quality
4. Iterate to identify redundant or interacting parameters
5. Build correction factors for interactions (like equal-loudness curves)

### Method-of-Adjustment Task
- Listeners adjust synthesis parameters until they match a target voice
- Controls all four variability factors
- Achieved 96% exact agreement (Kreiman, Gerratt, & Ito, 2007)

### Ultimate Goal
Derive a small set of acoustic parameters that are:
- Necessary and sufficient to reproduce integral voice quality
- Non-redundant
- Perceptually valid (like sone for loudness, mel for pitch)

## Figures of Interest
- None (theoretical/review paper)

## Results Summary
- 96% listener agreement achievable with method-of-adjustment tasks
- Traditional reliability statistics (Cronbach's alpha, ICC) can show "complete reliability" while individual agreement is below chance in midrange

## Limitations
- Paper is theoretical/critique; no new experimental data
- Proposed psychoacoustic model not yet complete
- Authors acknowledge being only "near a solution"

## Relevance to Project
**Low-Medium for implementation, High for evaluation methodology:**
- Validates approach of parameterizing voice quality via synthesis
- Suggests jitter/shimmer parameters may be less perceptually important than commonly assumed
- Highlights need for perceptual validation of any voice quality parameters
- ANSI definition supports Klatt's approach: quality = everything except F0 and amplitude

## Open Questions
- [ ] What is the minimal parameter set for voice quality?
- [ ] How do parameters interact perceptually?
- [ ] How to validate synthesizer output perceptually?

## Related Work Worth Reading
- Hanson, H. M. (1997). Glottal characteristics of female speakers: Acoustic correlates. JASA, 101, 466-481. [H1-A1, H1-A2 measures]
- Hillenbrand, J., Cleveland, R. A., & Erickson, R. L. (1994). Acoustic correlates of breathy vocal quality. JSHR, 37, 769-778. [cepstral peak prominence]
- Gerratt, B. R., & Kreiman, J. (2001). Measuring vocal quality with speech synthesis. JASA, 110(5), 2560-2566. [synthesis-based measurement]
- Kreiman, J., Gerratt, B. R., & Ito, M. (2007). When and why listeners disagree in voice quality assessment tasks. JASA, 122, 2354-2364. [four factors, 96% agreement]

---

## Collection Cross-References

### Already in Collection
- [[Hanson_1997_GlottalCharacteristicsFemaleAcoustic]] — cited for H1-A1, H1-A2 spectral tilt measures; defines acoustic correlates of breathy/tense voice
- [[Klatt_1990_VoiceQualityVariations]] — cited indirectly via KLSYN88; the voice quality analysis-synthesis framework this paper critiques
- [[Kreiman_2007_GlottalSourceSpectrum]] — same first author; PCA analysis of glottal source measures yielding four independent factors that motivate the psychoacoustic model proposed here
- [[Kreiman_2012_VoiceQualityHarmonicOQ]] — same first author; empirical demonstration that OQ-H1*-H2* relationship is speaker-dependent, supporting the critique of simple acoustic measures
- [[Kreiman_2021_ValidatingVoiceQuality]] — same first author; validates the psychoacoustic model proposed in this paper with 200-voice synthesis experiment

### Cited By (in Collection)
- [[Kreiman_2012_VoiceQualityHarmonicOQ]] — references this paper's perceptual framework
- [[Kreiman_2021_ValidatingVoiceQuality]] — builds on this paper's framework as a precursor to validation

### New Leads (Not Yet in Collection)
- **Gerratt, B. R., & Kreiman, J. (2001). Measuring vocal quality with speech synthesis. JASA, 110(5), 2560-2566.** — Core methodology paper: how to use synthesis for perceptual measurement
- **Hillenbrand, J., Cleveland, R. A., & Erickson, R. L. (1994). Acoustic correlates of breathy vocal quality. JSHR, 37, 769-778.** — Cepstral peak prominence measure; acoustic basis for breathiness quality
- **Kreiman, J., Gerratt, B. R., & Ito, M. (2007). When and why listeners disagree in voice quality assessment tasks. JASA, 122, 2354-2364.** — Details the four factors causing disagreement; method achieving 96% agreement
- **Fletcher, H. (1934). Loudness, pitch, and the timbre of musical tones. JASA, 6, 59-69.** — Equal loudness curves methodology; model for building perceptual interaction correction factors

### Conceptual Links (not citation-based)
- [[Gobl_2003_VoiceQualityEmotion]] — **Strong.** Gobl uses KLSYN88 parameters to synthesize voice quality continua for emotion perception; this paper critiques the same kind of rating-scale methodology Gobl uses and proposes an alternative psychoacoustic approach. Both address voice quality measurement but from different angles.
- [[Childers_Lee_1991_VoiceQualityFactors]] — **Moderate.** Childers & Lee define physiological voice quality factors (OQ, SQ, closure abruptness); this paper argues that acoustic measures derived from such factors lack perceptual validity without synthesis-based validation.
- [[Burkhardt_2009_VoiceQualityFormantSynthesis]] — **Moderate.** Burkhardt provides rule-based voice quality modification using Klatt parameters; this paper's framework suggests such rules should be validated via method-of-adjustment tasks rather than rating scales.
