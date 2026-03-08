# Towards Models of Phonation

**Authors:** Helen M. Hanson, Kenneth N. Stevens, Hong-Kwang Jeff Kuo, Marilyn Y. Chen, Janet Slifka
**Year:** 2001
**Venue:** Journal of Phonetics, 29, 451-480
**DOI:** 10.1006/jpho.2001.0146

## One-Sentence Summary
This paper reviews and extends acoustic models of nonmodal phonation (breathy, irregular, disordered) by linking glottal configuration types to measurable spectral characteristics (H1*-H2*, H1*-A1, H1*-A3*, B1, noise ratings), validates these models against data from 43 normal speakers and disordered populations, and describes HLsyn — a higher-level Klatt controller with 13 quasi-articulatory parameters.

## Problem Addressed
Earlier phonation models assumed modal voicing with complete glottal closure during each cycle. Normal speech routinely involves nonmodal phonation (breathy voice, irregular vibration, glottalization), and disordered speech exhibits even greater deviation. Models that cannot represent these variations fail to capture voice quality differences across and within speakers, limiting both synthesis naturalness and clinical speech analysis.

## Key Contributions
- Taxonomy of four glottal configurations that affect the voice source: (1) modal (complete closure), (2) posterior glottal opening (PGO) with simultaneous membranous closure, (3) nonsimultaneous closure without PGO, (4) PGO with nonsimultaneous closure
- Five corrected acoustic measures (H1*-H2*, H1*-A1, H1*-A3*, B1, noise ratings N_w and N_s) that reflect these configurations, with formant-correction procedures
- Experimental validation on 43 adult speakers (21 male, 22 female) showing wide individual variation and clear gender group separation (23 dB threshold on H1*-A3* divides female speakers into two groups)
- HLsyn synthesizer: a 13-parameter higher-level controller for Klatt that maps quasi-articulatory parameters to ~50 Klatt acoustic parameters
- Application to vocal-fold nodules using a modified two-mass model (Kuo 1998) showing nodules patients compensate with higher subglottal pressure
- Application to dysarthria (spastic, ataxic, athetoid) showing acoustic measures can characterize disordered phonation

## Methodology
1. Developed acoustic models predicting how spectral tilt, B1, open quotient, and aspiration noise vary with glottal configuration
2. Recorded citation words from 43 adults (21M, 22F) — 5 tokens of vowels /ae, ^, E/ in carrier phrase
3. Measured corrected spectral parameters (H1*-H2*, H1*-A1, H1*-A3*) and noise ratings
4. Compared measured ranges to model predictions
5. Validated female speaker groups via nasal endoscopy and breathiness perception tests
6. Applied two-mass vocal fold model with nodule modifications (Kuo 1998)
7. Applied acoustic measures to dysarthric speakers (Chen, in prep.)

## Key Equations

### Spectral Measure Corrections
The paper uses corrected harmonic and formant amplitude measures (asterisk notation). The corrections account for formant boosting effects:

$$H1^*-H2^* = (H1 - H2) - \text{correction for } F_1 \text{ effects}$$

$$H1^*-A1 = (H1 - A1) - \text{correction for } F_1 \text{ boosting}$$

$$H1^*-A3^* = (H1 - A3) - \text{correction for } F_1 \text{ and } F_2 \text{ effects}$$

Where: H1 = amplitude of first harmonic, H2 = amplitude of second harmonic, A1 = amplitude of F1 peak, A3 = amplitude of F3 peak. Correction equations are given in Hanson (1997).

### SPL vs Subglottal Pressure
The relationship between SPL and subglottal pressure follows a 3/2 power law:

$$\text{SPL} \propto P_s^{3/2}$$

This was validated in both the two-mass model simulations and experimental data (Fig. 18).

## Parameters

| Name | Symbol | Units | Typical Male | Typical Female | Notes |
|------|--------|-------|-------------|----------------|-------|
| Spectral tilt (low) | H1*-H2* | dB | ~0 to 6 | ~0 to 15 | Reflects open quotient; correlated with PGO size |
| First-formant prominence | H1*-A1 | dB | -15 to 5 | -10 to 10 | Reflects B1 and OQ; correlated with PGO |
| Spectral tilt (full) | H1*-A3* | dB | 5 to 20 | 10 to 35 | Best gender differentiator; ~9.6 dB lower for males |
| First-formant bandwidth | B1 | Hz | varies | varies | Measured from time-domain F1 decay; increases with PGO |
| Noise rating (waveform) | N_w | 1-4 | ~1-2 | ~1-4 | Bandpass at F3, rate periodicity of time waveform |
| Noise rating (spectrum) | N_s | 1-4 | ~1-2 | ~1-4 | Observe spectrum in F3 region for noise evidence |

### Female Speaker Group Classification (H1*-A3* threshold = 23 dB)
| Group | H1*-A3* | Hypothesized Configuration | Breathiness |
|-------|---------|---------------------------|-------------|
| Group 1 | < 23 dB | Simultaneous closure along fold length, may have PGO | Less breathy |
| Group 2 | > 23 dB | Nonsimultaneous closure of membranous folds | More breathy |

### Table I: Aerodynamic and Acoustic Data (Normals vs Nodules)
| Condition | Group | P_s (cm H2O) | H1-A1 (dB) | SPL (dB) |
|-----------|-------|-------------|------------|---------|
| Comfortable | Normals | 6 | -1 | 77.5 |
| Comfortable | Nodules | 11 | 1 | 80.1 |
| Loud | Normals | 9 | -9 | 86.6 |
| Loud | Nodules | 15 | -6 | 88.8 |

### HLsyn Parameters (13 quasi-articulatory parameters)
The HLsyn synthesizer maps these parameters to ~50 Klatt parameters:

| HLsyn Parameter | Abbrev | Controls |
|-----------------|--------|----------|
| Subglottal pressure | **ps** | AV, AH (via aerodynamic model) |
| Glottal area (membranous) | **ag** | OQ, AV, AH, B1 (voiceless consonants) |
| Posterior glottal opening | **ap** | TL, AH, B1 (breathiness) |
| Fundamental frequency | **f0** | F0 |
| Vocal fold compliance | **dc** | Tension, phonation threshold |
| (plus formant frequencies, nasal coupling, oral constriction parameters) | | |

### HLsyn Mapping Rules (Section 3.4, p. 467)
- **ag increase** (abduction): AV decreases, AH increases. Subglottal pressure (**ps**) increase raises both AV and AH.
- **ap increase** (posterior opening): TL increases, AH increases, formant bandwidths increase (especially B1). Produces breathy percept.
- **ag for voiceless consonants**: OQ increases, aspiration noise increases, open quotient increases. Extending abduction gesture into adjacent vowel emulates breathy phonation near voiceless obstruents.
- **Voicing cutoff**: AV = 0 when glottal area is too small or too large, or if transglottal pressure is too low. Threshold adjusted via **dc**.
- **Small ag (near cutoff)**: DI parameter activates irregular vibration / glottalization.

## Implementation Details

### Acoustic Measure Extraction
- H1, H2 amplitudes: Read from DFT spectrum of vowel midpoint
- A1, A3 amplitudes: Peak amplitudes in F1 and F3 regions
- Corrections (asterisk values): Apply Fant (1960)-based formant boosting corrections (equations in Hanson 1997)
- B1 estimation: Bandpass filter speech at F1, measure decay rate of F1 oscillation in time domain (Fig. 6 bottom)
- Noise ratings: Bandpass filter at F3 frequency, rate periodicity on scale 1-4 (1 = full voice, 4 = mostly noise); uses 25-35 ms window depending on speaker gender

### HLsyn Architecture
1. 13 quasi-articulatory input parameters
2. Mapping relations transform these to ~50 Klatt acoustic parameters
3. Klatt synthesizer generates output speech
4. Key advantage: physiological constraints are automatically enforced (e.g., increasing ag affects AV, AH, OQ, B1 simultaneously and consistently)

### Two-Mass Model Modifications for Nodules (Kuo 1998)
1. Masses increased (representing nodule mass)
2. Coupling stiffness between upper and lower masses increased
3. Collision forces activated when nodules meet (air continues to flow after collision)
4. Nodule width = 0.02 cm, fold length = 1.0 cm
5. Result: incomplete closure, nonzero minimum flow, less abrupt closing, increased return phase, increased OQ

## Figures of Interest
- **Fig 1 (p. 452):** Glottal waveform derivatives and spectra for modal vs nonmodal (return phase). Modal: 6 dB/octave falloff. Nonmodal: 12 dB/octave falloff. Key: MFDR (maximum flow declination rate) marked.
- **Fig 2 (p. 454):** F3 amplitude as function of average glottal opening — periodic component decreases and noise component increases as opening grows. Defines modal/breathy/voiceless continuum.
- **Fig 3 (p. 455):** Spectrogram showing allophonic glottalization in American English. Shows glottalization at vowel onset, vowel-to-vowel junction, and phrase-final position.
- **Fig 4 (p. 456):** Voicing termination example showing irregular vibration during vocal-fold abduction (not adduction) — suggests phrase-final irregularity is due to unstable combination of pressures, not glottalization per se.
- **Fig 6 (p. 460):** Vowel spectrum with labeled H1, H2, A1, A3; bandpass-filtered waveform at F3 for noise rating N_w; F1 oscillation decay for B1 estimation.
- **Fig 7 (p. 461):** H1*-A3* vs H1*-A1 scatter for 22 female speakers. Model prediction lines overlaid. Nearly all points within predicted ranges.
- **Fig 8 (p. 462):** Male speaker spectra comparison — M20 (low measures, clean spectrum) vs M18 (high measures, noisy above 2 kHz).
- **Fig 9 (p. 463):** H1*-A3* vs H1*-A1 for all 43 speakers with gender group separation. Male and Group 2 female overlap is minimal.
- **Fig 10 (p. 464):** Breathiness perception ratings for female Group 1 vs Group 2. Group 2 consistently rated breathier, confirming acoustic grouping.
- **Fig 11 (p. 465):** Spectra of full vs reduced vowels from connected speech. Reduced vowel has wider B1, greater spectral tilt — indicates larger glottal opening during reduction.
- **Fig 12 (p. 466):** F1 amplitude reduction of ~7-13 dB in reduced vowels compared to prominent vowels across 4 speakers.
- **Fig 13 (p. 468):** Copy synthesis using HLsyn — natural vs synthetic spectrogram of "played basketball" showing irregular vibration (I), breathiness (B), and spectral tilt (T) events.
- **Fig 14 (p. 471):** Two-mass model schematic with bilateral vocal-fold nodules.
- **Fig 15 (p. 472):** Nodule geometry schematic — 0.02 cm nodule width, 1.0 cm fold length, 0.05 cm posterior opening.
- **Fig 16-17 (pp. 473-474):** Normal vs nodules two-mass model output (volume velocity and derivative) at different subglottal pressures.
- **Fig 18 (p. 475):** SPL vs subglottal pressure (3/2 power law) — nodules model requires higher P_s for same SPL.
- **Fig 19 (p. 476):** Spectrograms of "see" by normal vs dysarthric (spastic cerebral palsy) speaker.
- **Fig 20 (p. 477):** H1*-A3* vs H1*-A1 scatter for normal and dysarthric speakers — dysarthric speakers show much wider range, some falling well outside normal ranges.
- **Fig 21 (p. 478):** Noise ratings for normal and dysarthric speakers — dysarthric uniformly higher.

## Results Summary
- Model predictions accurately bound the observed acoustic measures for 43 normal speakers
- Female speakers divide into two groups at H1*-A3* = 23 dB, corresponding to different glottal configurations (confirmed by endoscopy)
- Males cluster at lower spectral tilt values; H1*-A3* is the strongest gender differentiator
- Within-individual variation is significant: reduced vowels show 7-13 dB less F1 amplitude than full vowels, suggesting greater glottal opening
- Emotional state also affects voice source (anger: more high-frequency energy; sorrow: less)
- HLsyn successfully reproduces nonmodal phenomena in copy synthesis including irregular vibration, breathiness near voiceless consonants, and phrase-final spectral tilt changes
- Nodules two-mass model accurately captures the compensatory higher subglottal pressure strategy and the resulting near-normal SPL
- Dysarthric speakers show wider acoustic measure ranges and uniformly higher noise ratings than normals

## Limitations
- Model predictions for nonsimultaneous closure are approximate because the time constant of closure is independent of PGO size
- Maximum H1*-A3* prediction is a "soft" upper bound that may be exceeded when nonsimultaneous closure combines with PGO
- The clinical applications (nodules, dysarthria) use small sample sizes
- Dysarthric speaker analysis is preliminary (6 speakers, 4 controls)
- Aspiration noise rating is subjective (1-4 scale) rather than a fully automatic measure
- No formal perceptual validation of HLsyn output against natural speech (only copy synthesis demonstration)

## Testable Properties
- H1*-A1 should be positively correlated with H1*-A3* across speakers (both increase with PGO)
- H1*-H2* should correlate with both H1*-A1 and H1*-A3* (all reflect open quotient/tilt)
- Females should show higher mean and wider range for all measures compared to males
- H1*-A3* < 23 dB should correspond to simultaneous membranous closure (Group 1 females and most males)
- Reduced vowels should have larger H1*-H2*, larger B1, greater spectral tilt than stressed vowels in the same utterance
- SPL should follow 3/2 power law with subglottal pressure for both normal and nodules models
- Nodules model at same P_s should produce lower SPL than normal model (requiring higher P_s compensation)

## Relevance to Project
This paper is directly relevant to the Qlatt Klatt synthesizer in several ways:
1. **HLsyn parameter mapping**: The 13 quasi-articulatory parameters and their mapping to Klatt parameters (AV, AH, TL, B1, OQ, DI) provide a principled higher-level control layer for voice quality. This extends the Stevens & Bickley (1991) higher-level parameter work already referenced in the project.
2. **Voice quality measures**: The H1*-H2*, H1*-A1, H1*-A3* measures and their formant corrections are the same measures used in Hanson (1995, 1997, 1999) papers already in the collection, providing the unified framework for voice quality characterization.
3. **Prosodic voice quality variation**: The finding that reduced vowels have greater spectral tilt and wider B1 informs how Klatt parameters should vary within an utterance — not just across speakers but across syllable prominence levels.
4. **Irregular vibration model**: The description of how DI (diplophonia) parameter activates when **ag** is small provides rules for when to trigger irregular vibration in synthesis (phrase-final, low pitch accents, etc.).
5. **Gender-specific presets**: The 23 dB H1*-A3* threshold and the detailed gender differences inform male vs female voice quality preset design.

## Open Questions
- [ ] What are the exact mapping equations from HLsyn's 13 parameters to Klatt parameters? (Referenced as "Hanson & Stevens, submitted" but may be in Stevens & Bickley 1991 or subsequent publications) [Addressed by Hanson_2002_HLsynSourceParameters — provides complete equations (Eqs. 23-37) for AV, AF, AH, OQ, TL, DI, F0 derivation from HL parameters, plus aerodynamic circuit model (Eqs. 15-22) and comprehensive speaker constants tables (Tables IV-VIII)]
- [ ] How should the nonmodal effects be timed within an utterance — what triggers transitions between glottal configurations?
- [ ] Can the 23 dB H1*-A3* female group threshold be used as a continuous parameter rather than a binary classification?
- [ ] How do the two-mass model nodule modifications translate to Klatt parameter adjustments for disordered voice synthesis?

## Related Work Worth Reading
- Hanson & Stevens (submitted): Full HLsyn mapping equations — the detailed parameter transformation rules
- Stevens & Bickley (1991): Earlier version of higher-level Klatt parameter control (already in collection as Stevens_1991_HL_Parameters)
- Kuo (1998): Two-mass model with nodules — detailed aerodynamic equations
- Slifka (2000): Respiratory system correlates at prosodic boundaries — links to phrase-final voice quality changes
- Redi & Shattuck-Hufnagel (2001): Variation in glottal events in normal speakers — companion paper in same journal issue
- Williams & Stevens (1972): Emotions and voice source acoustics
- Cranen & Schroeter (1995): Modeling a leaky glottis

## Collection Cross-References

### Already in Collection
- [[Stevens_1991_HL_Parameters]] — cited as the earlier version of higher-level Klatt parameter control (10 parameters). This paper extends it to 13 parameters as HLsyn.
- [[Hanson_1995_GlottalCharacteristicsFemale]] — Hanson's PhD thesis developing the acoustic measures (H1*-A3*, B1, noise ratings) that this paper applies to a larger population and extends to males.
- [[Hanson_1997_GlottalCharacteristicsFemaleAcoustic]] — The journal paper version of the female acoustic measures; this 2001 paper combines those results with the male data (Hanson & Chuang 1999) and new synthesis work.
- [[Hanson_1999_GlottalMaleSpeakers]] — The companion male speaker study; this 2001 paper presents the combined 43-speaker dataset (21M+22F) and cross-gender analysis.
- [[Klatt_1990_VoiceQualityVariations]] — cited for KLGLOTT88 model and KLSYN88 synthesizer, which HLsyn extends with quasi-articulatory control.
- [[Fant_1985_LFModelGlottalFlow]] — cited for the LF model as one of the first phonation models to include nonmodal effects (nonabrupt return phase).
- [[Fant_1960_AcousticTheorySpeechProduction]] — cited for the formant boosting correction formulas used to compute H1*, H2*, A3* corrected measures.
- [[Childers_Lee_1991_VoiceQualityFactors]] — related work on voice quality parameterization; this 2001 paper takes a more acoustic-model-driven approach vs Childers & Lee's EGG-based approach.

### New Leads (Not Yet in Collection)
- Kuo (1998) — "Voice source modeling and analysis of speakers with vocal-fold nodules" PhD thesis, MIT — two-mass model with nodule modifications, aerodynamic equations
- Slifka (2000) — "Respiratory constraints at prosodic boundaries in speech" PhD thesis, MIT — links breathing mechanics to phrase-final voice quality
- Redi & Shattuck-Hufnagel (2001) — "Variation in the realization of glottal events in normal speakers" J. Phonetics 29:407-429 — companion paper documenting when glottalization occurs in American English
- Story & Titze (1995) — "Voice simulation with a body-cover model of the vocal folds" JASA 97:1249-1260 — body-cover vocal fold model for more realistic fold vibration

### Supersedes or Recontextualizes
- [[Stevens_1991_HL_Parameters]] — This 2001 paper describes HLsyn as an extension of the Stevens & Bickley (1991) system, adding 3 parameters (for a total of 13) including posterior glottal opening (**ap**) which is critical for modeling breathy voice quality. HLsyn is the successor system.
- [[Hanson_1997_GlottalCharacteristicsFemaleAcoustic]] and [[Hanson_1999_GlottalMaleSpeakers]] — This paper synthesizes and extends both studies by presenting the combined male+female dataset, adding cross-gender comparisons, and connecting the acoustic measures to the HLsyn synthesizer framework.

### Conceptual Links (not citation-based)
- **Larrouy-Maestri_2024_EmotionalProsody** — emotional prosody review identifies voice quality as critical for emotion encoding (especially valence), but notes the field lacks mechanistic understanding. HLsyn's 13-parameter quasi-articulatory control provides exactly this mechanism: linking physiological configurations (subglottal pressure, glottal area, posterior opening) to the spectral measures (H1*-H2*, H1*-A3*) the review identifies as emotion-discriminating. The finding that reduced vowels show 7-13 dB greater spectral tilt connects prosodic prominence to voice quality, a dimension the review argues is underexplored.

### Cited By (in Collection)
- (none found)
