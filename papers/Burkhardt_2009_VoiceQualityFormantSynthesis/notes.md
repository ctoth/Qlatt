---
title: "Rule-Based Voice Quality Variation with Formant Synthesis"
authors: "Felix Burkhardt"
year: 2009
venue: "Interspeech 2009, Brighton, UK"
doi_url: "10.21437/Interspeech.2009-499"
---

# Rule-Based Voice Quality Variation with Formant Synthesis

## One-Sentence Summary
Provides explicit formulas for modifying Klatt synthesizer parameters (OQ, TL, AV, AH, B1-B5, DI, FL) to simulate Laver's phonation types (breathy, tense, whispery, creaky, falsetto) with perceptual validation.

## Problem Addressed
Simulating different phonation types (voice qualities) in formant synthesis to enable emotional expression and speaking style variation, using the KLGLOTT88 model.

## Key Contributions
- Explicit rule-based formulas for 5 phonation types using Klatt parameters
- Perceptual validation linking phonation types to emotional impressions
- Open-source implementation (emoSyn based on Sensyn)

## Methodology
- Uses KLGLOTT88 revised source model (Klatt & Klatt 1990)
- Phonation types parameterized by `rate` (0-100%)
- Tested with 30 listeners in forced-choice emotion recognition

## Key Parameters (Klatt KLGLOTT88)

| Name | Symbol | Description | Range |
|------|--------|-------------|-------|
| F0 | F0 | Fundamental frequency | Hz |
| AV | AV | Amplitude of voicing | dB, relates to Ee |
| OQ | OQ | Open quotient (open phase / period) | 10-100% |
| AH | AH | Amplitude of aspiration noise | dB |
| TL | TL | Spectral tilt (high freq damping) | 0-24 dB, relates to Ta |
| FL | FL | F0 flutter (jitter simulation) | 0-100 |
| DI | DI | Diplophonic double pulsing | 0-100 |
| B1-B5 | B1-B5 | Formant bandwidths | Hz |
| FNP/FNZ | - | Nasal pole/zero frequency | Hz |
| FTP/FTZ | - | Tracheal pole/zero frequency | Hz |
| BNP/BTP | - | Nasal/tracheal pole bandwidth | Hz |

### Default/Limit Values

| Parameter | Default (glob) | Min | Max |
|-----------|----------------|-----|-----|
| OQ | OQglob | 10% | 100% |
| TL | TLglob | 0 dB | 24 dB |
| B1 | B1glob | 30 Hz | 250 Hz |
| B2-B5 | BXglob | 30-60 Hz | BXmax |
| BTP | 180 Hz | 30 Hz | - |
| BNP | 100 Hz | 30 Hz | - |

## Phonation Type Formulas

All formulas use `rate` (0-100) as the phonation strength parameter.

### Breathy Voice

```
OQ_add  = (OQ_max - OQ_glob) * rate/100
TL_add  = (TL_max - TL_glob) * rate/100
B1_add  = (B1_max - B1_glob) * rate/100
AV_sub  = 6 * rate/100
AH_add  = (AMP - 3) * rate/100
```

**Tracheal coupling (from Klatt 1990):**
- FNP = FNZ = 550 Hz
- FTP = FTZ = 2100 Hz

```
BTP_sub = (BTP_glob - BTP_min) * rate/100
BNP_sub = (BNP_glob - BNP_min) * rate/100
```

Where: BTP_glob=180 Hz, BNP_glob=100 Hz, BTP_min=BNP_min=30 Hz

**Effect:** Almost sinusoidal excitation from high-frequency damping.

### Tense Voice

```
AV_add  = 6 * rate/100
OQ_sub  = (OQ_glob - OQ_min) * rate/100
TL_sub  = TL_glob * rate/100
B1_sub  = (B1_glob - B1_min) * rate/100
...
B5_sub  = (B5_glob - B5_min) * rate/100
```

Where: OQ_min=10, BX_min=30-60 Hz

**Effect:** +6 dB voicing amplitude, shorter open phase, steeper flanks, narrower formant bandwidths (tissue tenseness).

### Whispery Voice

```
AV_sub  = AV * rate/100
AH_add  = AV * rate/100
OQ_add  = (OQ_max - OQ_glob) * rate/100
TL_add  = (TL_max - TL_glob) * rate/100
B1_add  = (B1_max - B1_glob) * rate/100
...
B5_add  = (B5_max - B5_glob) * rate/100
```

**Effect:** Voiced component replaced by noise, all formant bandwidths broadened.

### Creaky Voice (Lax Creaky)

```
DI      = rate
OQ_add  = (OQ_max - OQ_glob) * rate/200
AV_sub  = 6 * rate/100
B1_add  = (B1_max - B1_glob) * rate/100
```

**Effect:** Diplophonic double pulsing (every first period damped and displaced), elongated opening phase (half of max), broader B1, reduced voicing amplitude.

Note: This is "lax creaky" (low arousal emotions like sadness/boredom). Classic creaky has short opening phase and steep flanks (high medial compression).

### Falsetto Voice

```
F0_add  = F0 * rate/100
OQ_add  = (OQ_max - OQ_glob) * rate/100
TL_add  = (TL_max - TL_glob) * rate/100
FL      = rate
```

**Effect:** F0 doubled at max rate, strong spectral tilt, elongated open phase, flutter for irregularities from incomplete glottal closure.

## Implementation Details

### Parameter Modification Pattern

All parameters follow additive/subtractive pattern:
```javascript
// Additive (increase toward max)
param_new = param_glob + (param_max - param_glob) * rate/100

// Subtractive (decrease toward min)
param_new = param_glob - (param_glob - param_min) * rate/100
```

### Experiment Settings
- Rates used: modal, falsetto, tense, breathy = 70%; creaky = 30%
- Whispery excluded from perceptual test

## Results Summary

| Phonation Type | Primary Emotion | Secondary |
|----------------|-----------------|-----------|
| Breathy | Sadness, Boredom | - |
| Creaky | Sadness, Boredom | - |
| Falsetto | Frightened | Sadness ("whiny") |
| Modal | Neutral (not angry) | - |
| Tense | Anger | Sadness |

## Figures of Interest
- **Fig 1 (p.2):** LF model parametrization (Ug(t), Ug'(t), Ee, te, tp, Ta)
- **Fig 2 (p.2):** Source signals for 6 phonation types (modal/tense/breathy/creaky/falsetto/whispery)
- **Fig 3 (p.4):** Emotion perception results by phonation type

## Limitations
- "Lax creaky" modeled rather than classic creaky (which has steep flanks)
- Added noise from incomplete closure in falsetto not modeled
- Category "sadness" too broad (quiet vs whiny sadness)

## Relevance to Qlatt Project
**Direct implementation value:** These formulas can be added to `klatt-synth.js` to enable voice quality variation for emotional TTS. Key parameters already exist in Klatt:
- OQ (open quotient)
- TL (spectral tilt)
- AV/AH (voicing/aspiration amplitude)
- B1-B5 (formant bandwidths)
- DI (diplophonia)
- FL (flutter)

Tracheal/nasal coupling (FTP, FTZ, FNP, FNZ, BTP, BNP) may need addition for breathy voice.

## Open Questions
- [ ] Does Qlatt's Klatt implementation include DI (diplophonia) parameter?
- [ ] Are tracheal pole/zero parameters (FTP/FTZ/BTP) implemented?
- [ ] What are reasonable default values for OQglob, TLglob, BXglob?

## Related Work Worth Reading
- Klatt & Klatt 1990 (ref [7]) - KLGLOTT88 model specification
- Laver 1980 (ref [4]) - Phonation type terminology
- Gobl & Chasaide 2003 (ref [5]) - Voice quality and emotion
- Fant et al. 1985 (ref [8]) - LF model (4 parameters)
- Klatt 1990 unpublished (ref [14]) - KLATTALK tracheal coupling details

---

## Collection Cross-References

### Already in Collection
- [[Burkhardt_2005_GermanEmotionalSpeechDatabase]]
- [[Fant_1960_AcousticTheorySpeechProduction]]
- [[Fant_1985_LFModelGlottalFlow]]
- [[Gobl_2003_VoiceQualityEmotion]]
- [[Klatt_1990_VoiceQualityVariations]]

### New Leads (Not Yet in Collection)
- **[4] Laver 1980** - The canonical reference for phonation type terminology (modal, breathy, whispery, creaky, tense, lax). Defines the voice quality categories being simulated.

### Cited By (in Collection)
- [[Zhang_2016_VocalFoldPhysiologyVoiceProduction]] — references this paper's "rate" parameter concept in an open question about mapping medial surface thickness to voice quality modification
- [[Zhang_2016_MechanicsVoiceProductionControl]] — this review provides the physiological grounding for why Burkhardt's voice quality modification rules work: medial surface thickness (controlled by CT/TA balance) is the primary voice quality controller
- [[Kreiman_2021_ValidatingVoiceQuality]] — references this paper's rule-based voice quality modification as a validated target space for Klatt parameter settings
- [[Lee_2019_AcousticVoiceVariation]] — the spectral tilt and noise dimensions identified by Lee map to Burkhardt's Klatt parameters TL and AH
- [[Nittrouer_1990_AcousticMeasurementsVoice]] — Burkhardt's formulas for TL and AH implement the spectral tilt and aspiration noise dimensions Nittrouer shows are related but partially independent
- [[Starr_2015_SweetVoiceJapaneseFeminine]] — cites this paper for voice quality phonation types in Klatt synthesis; sweet voice findings complement Burkhardt's breathy/tense/falsetto parameter rules
- [[Titze_1991_NeurologicAperiodicity]] — Burkhardt's FL (flutter/jitter) parameter simulates F0 perturbation; Titze provides the physiological basis for setting FL values
- [[Larrouy-Maestri_2024_EmotionalProsody]] — cites this paper for Klatt parameter formulas for voice quality types discussed in the review

### Conceptual Links (not citation-based)
- [[Mozziconacci_1998_SpeechEmotionProsody]] — Mozziconacci provides the prosodic parameter space (pitch level, pitch range, speech rate) for seven emotions but identifies voice quality as the missing component for sadness and fear. Burkhardt provides exactly those missing voice quality formulas, making the two papers complementary halves of a full emotional synthesis system. (Strong)
- [[Scherer_TaskLoadStressAcoustics]] — Moderate. Scherer's load/stress acoustic distinctions inform synthesis parameter selection: cognitive load presets should modify rate and energy envelopes (Burkhardt's rate parameter), while stress presets should modify F0 and spectral tilt (Burkhardt's voice quality parameters).
- [[Titze_2014_BistableVocalFoldAdduction]] — Moderate. Titze provides the physical basis for why Burkhardt's falsetto voice quality parameters take their values: convergent vs divergent glottal geometry determines OQ and spectral tilt.
- [[Weiss_2020_VoiceAttractiveness]] — Moderate. Burkhardt is Ch.13 co-author in this volume, connecting emotional speech synthesis to likeability perception.
- [[Weninger_2013_AcousticsEmotionAudio]] — Moderate. Weninger identifies which acoustic features best predict arousal (loudness, spectral flux) vs valence (F0, spectral shape), directly informing which of Burkhardt's synthesis parameters to prioritize for each emotional dimension.

### Supersedes or Recontextualizes
- Extends **Burkhardt & Sendlmeier 2000** (ref [3]) — the 2000 paper verified acoustic correlates of emotional speech using formant synthesis; this 2009 paper provides the mature, explicit rule-based formulas with perceptual validation. Burkhardt_2005 lists the 2000 paper as a new lead; this paper covers that ground more comprehensively.
