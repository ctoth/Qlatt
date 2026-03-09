# Glottal Adduction and Subglottal Pressure in Singing

**Authors:** Christian T. Herbst, Markus Hess, Frank Muller, Jan G. Svec, Johan Sundberg
**Year:** 2015
**Venue:** Journal of Voice, Vol. 29, No. 4, pp. 391-402
**DOI:** http://dx.doi.org/10.1016/j.jvoice.2014.08.009

## One-Sentence Summary
This paper demonstrates that trained singers can independently control vocal loudness, phonation type (breathy/flow/neutral/pressed), and vocal register (chest/falsetto) by manipulating subglottal pressure and glottal adduction independently, with quantitative measurements of how these three phonatory dimensions affect voice source parameters.

## Problem Addressed
Previous research suggested that independent variation of vocal loudness and glottal configuration does not occur in untrained speech production (Stathopoulos & Sapienza). This study investigates whether a trained singer can vary these parameters independently and documents the resulting effects on subglottal pressure, glottal airflow, and voice source characteristics.

## Key Contributions
- Demonstrates that a trained singer can independently control three phonatory dimensions: vocal register, phonation type (adduction), and vocal loudness
- Provides quantitative data on how each dimension affects subglottal pressure, airflow, MFDR, FPA, H1-H2, and sound pressure
- Establishes the relationship patterns between subglottal pressure and glottal flow for each control dimension
- Characterizes the Breathy-Flow-Neutral-Pressed phonation continuum with observable laryngeal configurations

## Methodology
- Single subject: 40-year-old semiprofessional baritone
- Sustained vowel [i:] at D4 (~294 Hz)
- Three independent variation tasks: (a) vocal register change, (b) phonation type change, (c) vocal loudness change
- Simultaneous recording of: EGG, oral airflow, subglottal pressure (percutaneous), videokymography (VKG), endoscopy
- 79 phonations analyzed, normalized to 0-100% for relative comparison
- Voice source parameters extracted via inverse filtering using Sopran software

## Key Findings

### Vocal Register (Chest vs Falsetto)
- Falsetto: lower P_sub, higher flow, stronger H1-H2 (voice fundamental), lower MFDR
- Chest: higher P_sub, lower flow, lower H1-H2, higher MFDR
- Register change is abrupt (within ~0.5 seconds)
- VKG contact quotient (CQ): chest ~0.45, falsetto ~0.21
- Chest register: ~50% closed phase, falsetto: ~20% closed phase
- Subglottal pressure and flow show **inverse** relationship when register changes

### Phonation Type (Breathy-Flow-Neutral-Pressed Continuum)
- Breathy: posterior glottal gap, CQ_VKG ~0.18, membranous chink present
- Flow: smaller posterior chink, CQ_VKG ~0.58
- Neutral: fully adducted posterior glottis, CQ_VKG ~0.56
- Pressed: ventricular fold medialization, CQ_VKG ~0.77, epiglottis tilted posteriorly
- H1-H2 saturated at ~6 dB for Neutral and Pressed
- MFDR varied between 40-100% for Neutral/Pressed, but only below 20% for Breathy/Flow

### Vocal Loudness
- Increasing loudness: increased P_sub, increased flow, increased SP, increased MFDR
- P_sub and Flow strongly correlated (linear, r = 0.88)
- Glottal configuration remained constant (adduction unchanged)
- This demonstrates true independent loudness control

### Pressure-Flow Relationships (Critical Finding)
- **Loudness variation**: P_sub and Flow **covariate** (positive slope, high R^2) - glottal resistance constant
- **Adduction variation**: P_sub and Flow show **inverse** relationship (negative slope) - changing glottal resistance
- **Register variation**: P_sub and Flow show inverse relationship - also changing glottal resistance

## Parameters

| Name | Symbol | Units | Description | Notes |
|------|--------|-------|-------------|-------|
| Subglottal Pressure | P_sub | cmH2O (normalized 0-100%) | Lung driving pressure | Measured percutaneously |
| Glottal Airflow | Flow_N | normalized 0-100% | Mean airflow through glottis | Inverse-filtered from oral flow |
| Sound Pressure | SP_N | normalized 0-100% | RMS of airflow derivative | 100ms window, 25ms steps |
| MFDR | MFDR | normalized % | Maximum flow declination rate | Primary voice source strength |
| FPA | FPA | normalized % | Flow pulse amplitude | Peak-to-peak glottal flow |
| H1-H2 | H1-H2 | dB | First-second harmonic difference | Spectral tilt measure |
| Contact Quotient | CQ_VKG | ratio 0-1 | Closed phase / total cycle | From VKG wavegrams |

## Table 1: Laryngeal Configuration by Phonation Type

| Phonation Type | Cartilaginous Glottal Chink | Membranous Glottal Chink | Ventricular Fold Medialization |
|----------------|---------------------------|--------------------------|-------------------------------|
| Breathy | Yes | Yes | No |
| Flow | Yes | No | No |
| Neutral | No | No | No |
| Pressed | No | No | Yes* |

*Ventricular fold medialization observed only in chest register.

## Figures of Interest
- **Fig 1 (page 395):** Vocal register change effects - VKG images, dEGG wavegrams, normalized parameters, scatter plots showing P_sub vs Flow_N inverse relationship for register
- **Fig 2 (page 396):** Phonation type change - VKG images for Breathy/Flow/Neutral/Pressed, wavegrams, scatter plots showing H1-H2 saturates around 6 dB for Neutral/Pressed
- **Fig 3 (page 397):** Vocal loudness change in Breathy falsetto - demonstrates positive covariation of P_sub and Flow_N with constant glottal configuration
- **Fig 4 (page 398):** Overall R^2 and regression slopes for all 76 phonation sequences - V-shaped distribution showing positive slopes for loudness (circles) and negative slopes for adduction/register (stars/diamonds)
- **Fig 5 (page 400):** Schematic pressure-flow diagrams for each control parameter varied independently
- **Fig 6 (page 400):** Schematic of dependent (speech) vs independent (singing) control of subglottal pressure and adduction

## Results Summary
- Trained singer successfully varied three phonatory parameters independently
- Register shifts: abrupt transitions in CQ, H1-H2, flow parameters
- Phonation type: gradual changes in adduction produce systematic voice quality changes
- Vocal loudness: pressure and flow covariate with constant glottal resistance
- Key distinction: loudness = covarying P_sub and flow; adduction/register = inverse P_sub and flow relationship
- H1-H2 range: ~6-20+ dB across conditions; saturates for pressed phonation
- MFDR range: ~20-100% across conditions; highest for chest register and pressed phonation

## Limitations
- Single subject study (trained baritone singer)
- Only one pitch tested (D4 ~294 Hz)
- Only one vowel tested ([i:])
- Normalized parameters only (no absolute calibration of P_sub and airflow)
- Cannot estimate absolute glottal flow resistance due to normalization
- Vibrato amplitude modulation introduced some noise in scatter plots
- Three phonations had to be removed due to accidental adduction changes

## Relevance to Project
This paper provides empirical evidence for how the three main voice control dimensions (register, phonation type, loudness) map to physical voice source parameters. For Klatt synthesis:

1. **Voice quality presets**: The Breathy-Flow-Neutral-Pressed continuum with Table 1 configurations directly maps to Klatt voice quality settings (OQ, TL, AV, AH adjustments)
2. **Loudness modeling**: Loudness changes should modulate AV and source amplitude without changing spectral tilt (H1-H2), since trained speakers maintain constant adduction
3. **Register modeling**: Falsetto should use higher H1-H2, lower MFDR (softer spectral slope), shorter closed quotient
4. **Independent control**: Confirms that for natural-sounding synthesis, loudness, voice quality, and register should be independently controllable parameters

## Open Questions
- [ ] How do these relationships generalize to female voices and different pitch ranges?
- [ ] What are the absolute P_sub and airflow values for each condition?
- [ ] How do these findings translate to specific Klatt parameter trajectories (AV, OQ, TL, AH)?
- [ ] Does the H1-H2 saturation at ~6 dB for pressed phonation have implications for spectral tilt limits in synthesis?

## Related Work Worth Reading
- Sundberg J et al. "Effects of vocal loudness variation on spectrum balance" (ref 42) - alpha measure of spectral balance
- Titze IR. "Regulation of Vocal Power and Efficiency by Subglottal Pressure and Glottal Width" (ref 50) - Flow phonation efficiency
- Stathopoulos & Sapienza (ref 17) - independent variation limitations in untrained speakers
- Herbst CT et al. "Using electroglottographic real-time feedback to control posterior glottal adduction" (ref 41) - biofeedback methodology

---

## Collection Cross-References

### Already in Collection
- [[Fant_1960_AcousticTheorySpeechProduction]] -- cited for acoustic theory foundation
- [[Holmberg_1988_GlottalAirflowPressure]] -- cited (via Dromey 1992); provides glottal airflow and pressure measurements for speech that complement the singing measurements here
- [[Hu_2012_DynamicsModelSpeechRecognitionSynthesis]]
- [[Klatt_1990_VoiceQualityVariations]] -- cited; defines KLSYN88 voice quality framework
- [[Stevens_1998_AcousticPhonetics]] -- cited for acoustic phonetics foundation
- [[Sun_2006_VocalTractGlottalSource]]

### Cited By (in Collection)
- [[Bjorklund_2016_SubglottalPressureSPL]] -- references this for independent control of subglottal pressure and glottal adduction in trained singers
- [[Ericsson_2020_FormantEstimationEvaluation]] -- references this in voice production context

### New Leads (Not Yet in Collection)
- **Laver 1980 (ref 9)** - The Phonetic Description of Voice Quality. Foundational framework for the Breathy-Flow-Neutral-Pressed continuum used in this paper.
- **Titze 1988/2006 (refs 5, 36)** - Framework for vocal registers and myoelastic aerodynamic theory. Provides the physiological underpinning for register modeling in synthesis.
- **Stathopoulos & Sapienza 1997 (ref 17)** - Developmental changes in laryngeal function with intensity variation. Important for understanding untrained vs trained voice control.

### Conceptual Links (not citation-based)
- [[Henrich_2005_GlottalOpenQuotientSinging]] -- Strong. Both study voice source parameters in trained singers. Henrich provides the complementary EGG-based Oq measurements across laryngeal mechanisms that map directly to the Breathy-Flow-Neutral-Pressed continuum documented here.
- [[Titze_1992_VocalIntensity]] -- Strong. Titze models the analytical relationships between subglottal pressure, glottal parameters, and vocal intensity that Herbst measures empirically; Titze's Table I constants provide the mathematical framework for the pressure-flow relationships Herbst observes.
- [[Titze_1989_MaleFemaleVoices]] -- Strong. Titze's physiological model of male-female voice differences predicts the prephonatory adduction configurations that Herbst measures directly via videokymography.
- [[Alku_1999_SPL_DpeakLinearity]] -- Moderate. Alku's finding of a linearity knee in the relationship between d-peak and SPL may correspond to the boundary between adduction-mediated and pressure-mediated intensity control that Herbst documents.
- [[Lienard_1999_VocalEffortVowelSpectral]] -- Moderate. Lienard quantifies how vocal effort modifies spectral tilt and F0, which are the acoustic consequences of the pressure-adduction interactions Herbst measures at the source level.
