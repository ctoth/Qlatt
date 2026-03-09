# The Sound of Confidence and Doubt

**Authors:** Xiaoming Jiang, Marc D. Pell
**Year:** 2017
**Venue:** Speech Communication 88 (2017) 106-126
**DOI:** http://dx.doi.org/10.1016/j.specom.2017.01.011

## One-Sentence Summary
Comprehensive perceptual-acoustic study identifying the specific prosodic features (F0, intensity, duration, voice quality) that distinguish confident, close-to-confident, unconfident, and neutral speech expressions.

## Problem Addressed
Prior research on vocal confidence was limited to trivia question responses or formal legal arguments, with unclear acoustic profiles distinguishing graded levels of confidence. This study establishes systematic acoustic correlates for communicating "feeling of knowing" along a continuum.

## Key Contributions
- First comprehensive acoustic profile of graded confidence levels (confident, close-to-confident, unconfident, neutral)
- Distinguishes global (full-utterance) vs. local (constituent-level) acoustic markers
- Identifies voice quality measures (HNR, jitter, shimmer) as confidence indicators
- Documents sex-specific vocal strategies for expressing confidence
- Provides linear discriminant functions for automatic confidence classification

## Methodology
**Experiment 1 (Perceptual):** 6 speakers (3F/3M) produced 151 sentences in 4 confidence conditions. 72 listeners rated perceived confidence on 1-5 scale in two conditions: LEX+VOC (with probability phrase) and VOC (voice only).

**Experiment 2 (Acoustic):** Detailed acoustic analysis of perceptually-validated tokens, measuring global and local features plus voice quality.

## Key Findings

### Global Acoustic Correlates of Confidence

| Level | Mean F0 | F0 Range | Mean Amplitude | Amplitude Range | Duration | Pauses |
|-------|---------|----------|----------------|-----------------|----------|--------|
| Confident | Medium | Highest | Highest | Highest | Short | Few |
| Close-to-confident | Low | Medium | Medium | Medium | Medium | Few |
| Unconfident | Highest | Low | Low | Medium | Longest | Most |
| Neutral | Lowest | Lowest | Lowest | Lowest | Shortest | Fewest |

### Voice Quality Measures

| Level | HNR | Jitter | Shimmer |
|-------|-----|--------|---------|
| Confident | Lowest (12.87) | Medium (0.010) | Medium (0.231) |
| Close-to-confident | Medium (13.57) | Highest (0.011) | Medium (0.248) |
| Unconfident | Highest (15.43) | Lowest (0.008) | Lowest (0.226) |
| Neutral | Medium (13.86) | Medium (0.010) | Highest (0.288) |

### Key Acoustic Parameters

| Parameter | Symbol | Units | Confident | Close-to-confident | Unconfident | Neutral |
|-----------|--------|-------|-----------|-------------------|-------------|---------|
| Normalized mean F0 | - | ratio | 0.51 | 0.49 | 0.70 | 0.28 |
| F0 variation | - | ratio | 1.32 | 1.13 | 1.09 | 0.78 |
| Normalized mean amplitude | - | ratio | 0.88 | 0.70 | 0.66 | 0.65 |
| Amplitude variation | - | ratio | 1.47 | 1.15 | 1.17 | 1.07 |
| Normalized duration | - | ratio | 1.11 | 1.12 | 1.38 | 1.00 |
| Mean HNR | - | dB | 12.87 | 13.57 | 15.43 | 13.86 |

### Local (Constituent) Effects

Critical finding: **Intonation contour shape matters more than mean F0**

- **Confident:** High F0 at initial/intermediate positions, falling toward end
- **Unconfident:** Lower F0 initially, rising toward end (terminal rise)
- **Initial position:** F0 range uniquely high for confident expressions
- **Final position:** Mean F0 highest for unconfident (rising intonation marks doubt)

### Sex Differences in Vocal Strategies

**Female speakers:**
- Use F0 variation: confident > close-to-confident > unconfident
- Intensity differences more pronounced across confidence levels
- Higher jitter/shimmer differentiation

**Male speakers:**
- Use F0 variation: unconfident > close-to-confident > confident (opposite pattern)
- More pauses in unconfident speech
- Less variation in intensity across confidence levels

## Linear Discriminant Analysis Results

Three canonical functions explain variance:
1. **Function 1 (77.9%):** Normalized mean F0 (r=.75), final word F0 (r=.39), HNR (r=.35)
2. **Function 2 (16.5%):** Amplitude measures, initial word F0, utterance duration
3. **Function 3 (5.7%):** Mean utterance amplitude, initial word amplitude range

**Classification accuracy:** 59.1% overall (chance = 25%)
- Confident: 55%
- Close-to-confident: 42%
- Unconfident: 76%
- Neutral: 63%

## Implementation Details

### Normalization Procedure (per speaker)
```
Normalized mean F0 = (mean F0 - mean_min_F0_neutral) / mean_min_F0_neutral
Normalized mean amplitude = (mean amp - mean_min_amp_neutral) / mean_min_amp_neutral
Normalized duration = utterance_duration / mean_duration_neutral
```

### Probability Phrases Used
- **High confidence:** "Definitely", "For sure", "I'm certain", "I'm positive"
- **Close-to-confident:** "I think", "Most likely", "I'm pretty sure", "I'm almost certain"
- **Low confidence:** "Maybe", "Perhaps", "It's possible", "There's a chance"

### Voice Quality Definitions
- **HNR:** Harmonics-to-noise ratio - higher = cleaner voice, lower = breathier
- **Jitter:** Cycle-to-cycle F0 perturbation - pitch instability
- **Shimmer:** Cycle-to-cycle amplitude perturbation - amplitude instability

### Perceptual Thresholds for Confidence Classification
- **Confident:** Mean rating > 4.2 (on 1-5 scale)
- **Close-to-confident:** Mean rating 3.2-3.8
- **Unconfident:** Mean rating < 2.8

## Figures of Interest
- **Fig. 2 (p. 115):** F0 and amplitude distributions by confidence level and speaker sex
- **Fig. 3 (p. 116):** Duration and pause patterns
- **Fig. 4 (p. 118):** Local constituent measures showing position effects
- **Fig. 5 (p. 120):** Voice quality measures (HNR, jitter, shimmer)
- **Fig. 6 (p. 121):** LDA scatter plots showing classification boundaries

## Results Summary
- Confident speech: loud, varied in pitch/amplitude, fast, low HNR (relaxed voice)
- Unconfident speech: high pitch, slow, many pauses, high HNR (tense voice), rising final intonation
- Close-to-confident: intermediate values, harder to classify automatically
- Neutral: lowest pitch/intensity/variation, fastest rate

## Limitations
- Only 6 speakers (3 per sex) - limited generalizability
- Posed expressions, not spontaneous speech
- Canadian English only
- Close-to-confident expressions difficult to classify (42% accuracy)
- No multimodal cues (face, gesture) considered

## Relevance to Qlatt Project

**Direct applications:**
1. **Prosody generation for affect:** Can modulate confidence level by adjusting:
   - F0 contour shape (falling = confident, rising = doubtful)
   - F0 range (larger = confident)
   - Amplitude (higher = confident)
   - Duration/rate (faster = confident)
   - Voice quality via source parameters

2. **Voice quality parameters:** HNR, jitter, shimmer correlates suggest:
   - Confident: more relaxed phonation (lower glottal tension)
   - Unconfident: more tense phonation (higher glottal tension)
   - Maps to OQ (open quotient), TL (spectral tilt) in Klatt model

3. **Local prosody control:** Initial position marks confidence strongly via F0 range

**Potential parameter mappings:**
- Confident → lower TL, higher AV, faster rate, larger F0 range
- Unconfident → higher TL, lower AV, slower rate, rising F0, more pauses

## Open Questions
- [ ] How do voice quality measures map to Klatt source parameters (OQ, TL)?
- [ ] What specific F0 contour shapes best signal each confidence level?
- [ ] How to generate appropriate pause patterns for unconfident speech?
- [ ] Can LF model parameters (Rd, OQ) achieve the HNR/jitter differences?

## Related Work Worth Reading
- Scherer et al. (1973) - Voice of confidence: paralinguistic cues
- Pell (2007) - Prosodic attitudes and right hemisphere damage
- Brennan & Williams (1995) - Prosody and metacognitive states
- Bänziger et al. (2014) - Voice quality in emotion communication
- Cheang & Pell (2008) - Sound of sarcasm (voice quality methodology)

---

## Collection Cross-References

### Already in Collection
- [[Hellbernd_2016_ProsodySpeechActIntention]]

### Cited By (in Collection)
- [[Fish_2017_SoundOfInsincerity]] — from same lab (Pell); cites this paper for prosodic cues of confidence/uncertainty that interact with sincerity perception
- [[Goupil_2021_ConfidenceAccuracyProsody]] — cites this as the perception-side complement; Goupil's production study dissociates confidence from accuracy in prosody, extending Jiang & Pell's perception findings

### New Leads (Not Yet in Collection)
- **Scherer, London, Wolf (1973)** - "The voice of confidence" - Foundational paper on paralinguistic cues for confidence perception. Direct precursor to this work.
- **Bänziger, Patel, Scherer (2014)** - Voice quality in emotion communication. Methodology for HNR/jitter/shimmer analysis applicable to synthesis.
- **Cheang & Pell (2008)** - "The sound of sarcasm" - Same methodology applied to different pragmatic meaning. Good comparison for voice quality measures.
- **Patel et al. (2011)** - Mapping emotions into acoustic space via voice production. Links acoustic features to phonation mechanisms relevant for Klatt source modeling.
- **Pell (2001)** - Influence of emotion and focus on prosody. Shows constituent-level prosodic variation methodology that could inform local prosody control in synthesis.

### Conceptual Links (not citation-based)
- [[Caballero_2018_SoundOfImpoliteness]] — Both study prosodic encoding of pragmatic attitudes using similar methodology (same lab tradition). Caballero's impoliteness cues (higher F0, louder) partially overlap with Jiang's confident speech cues, suggesting a shared acoustic profile for assertive/dominant social signals (Moderate)
- [[VaughanJohnston_2024_VocalIntonationPersuasion]] — Vaughan-Johnston studies how intonation signals persuasiveness; Jiang's finding that falling F0 signals confidence while rising F0 signals doubt provides the mechanism: listeners infer speaker certainty from intonation, which then drives persuasion (Strong)
- [[Trott_2022_ProsodyIndirectRequests]] — Both papers examine how prosodic features signal speaker epistemic state; Trott's indirect requests use rising intonation (uncertainty marker) that maps to Jiang's unconfident profile (Moderate)
- [[Kamiloglu_2021_VoiceProductionPerception]] — Kamiloglu's arousal-valence framework predicts Jiang's findings: confident speech maps to moderate arousal (loud, varied) while unconfident speech shows the tense voice quality (high HNR) characteristic of high arousal without positive valence (Moderate)
