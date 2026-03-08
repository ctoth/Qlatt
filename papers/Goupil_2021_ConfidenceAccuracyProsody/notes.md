# Distinct Signatures of Subjective Confidence and Objective Accuracy in Speech Prosody

**Authors:** Louise Goupil, Jean-Julien Aucouturier
**Year:** 2021
**Venue:** Cognition (Elsevier), Volume 212, Article 104661
**DOI:** https://doi.org/10.1016/j.cognition.2021.104661

## One-Sentence Summary
This paper demonstrates that subjective confidence and objective accuracy are encoded in distinct prosodic features (intonation, loudness, duration) with different timings, providing empirical acoustic parameters for synthesizing confident vs. uncertain speech.

## Problem Addressed
Previous research conflated confidence with accuracy and sensory evidence when studying "epistemic prosody." It was unclear whether prosodic markers truly reflect subjective metacognitive states (confidence) or merely objective task performance (accuracy/competence). The paper disentangles these contributions.

## Key Contributions
- **Dissociation of confidence vs. accuracy**: Intonation and duration reflect *subjective confidence*, while loudness reflects *objective accuracy*
- **Temporal dynamics**: Accuracy affects pitch early in utterances; confidence dominates pitch at utterance end
- **Non-social context**: Prosodic markers appear even without an audience (no deliberate communication intent)
- **Machine classification**: Accuracy and confidence can be decoded separately from prosody alone (~60% for accuracy when confident, ~56% for confidence overall)
- **Individual differences**: More competent speakers show stronger prosodic signaling

## Methodology
- 40 participants performed visual detection task (masked pseudo-words)
- Verbal responses recorded in isolation (no audience)
- 4-level confidence ratings + accuracy measured
- SOA manipulation (16-116ms) to vary sensory evidence
- Acoustic analysis: F0 (pitch) in 20 temporal windows, RMS loudness, duration
- Hierarchical linear mixed models + k-NN and SVM classifiers

## Key Equations

No explicit equations for synthesis, but critical relationships:

### Confidence effects on pitch (intonation pattern)
- **High confidence**: Rising-falling (LHL%) pattern
- **Low confidence**: Falling-rising (HLH%) pattern

Regression coefficients from hierarchical model:
$$
\text{pitch} \sim \beta_{\text{conf}} \times \text{confidence} + \beta_{\text{acc}} \times \text{accuracy} + \beta_{\text{SOA}} \times \text{SOA}
$$

Where (global model):
- $\beta_{\text{conf}} = 0.08 \pm 0.008$ (t = 10.7, p < 0.001)
- $\beta_{\text{acc}} = 0.017 \pm 0.016$ (t = 1.07, p = 0.29, NS when confidence included)
- Confidence × segment interaction: $\beta = -0.002 \pm 0.0004$ (t = -5.53, p < 0.001)

### Loudness (accuracy-driven)
$$
\text{loudness} \sim \beta_{\text{acc}} \times \text{accuracy}
$$
- $\beta_{\text{acc}} = 0.07 \pm 0.03$ (t = 2.7, p = 0.007)
- Confidence effect NS when accuracy included (p = 0.21)

### Duration (confidence-driven)
$$
\text{duration} \sim \beta_{\text{conf}} \times \text{confidence}
$$
- $\beta_{\text{conf}} = 0.035 \pm 0.01$ (t = 3, p = 0.003)
- Accuracy effect NS (p > 0.7)

## Parameters

| Parameter | Dimension | Confidence Effect | Accuracy Effect | Notes |
|-----------|-----------|-------------------|-----------------|-------|
| Mean pitch | Hz (z-scored) | NS (p = 0.5) | - | No static pitch difference |
| Intonation (early, seg 5-11) | Hz (z-scored) | +0.08 (p < 0.001) | +0.06 (p = 0.016) | Both affect early pitch |
| Intonation (late, seg 16-20) | Hz (z-scored) | -0.03 (p = 0.002) | NS (p > 0.8) | Confidence-only at end |
| Loudness (RMS) | z-scored | NS when acc included | +0.07 (p = 0.007) | Accuracy-driven |
| Duration | ms (z-scored) | +0.035 (p = 0.003) | NS (p > 0.7) | Confident = longer |

### Intonation Pattern Summary
| Confidence Level | Intonation Pattern | Description |
|------------------|-------------------|-------------|
| High (3-4) | LHL% | Rise then fall (pitch up early, down late) |
| Low (1-2) | HLH% | Fall then rise (pitch down early, up late) |

### Temporal Windows
| Window | Segments | Primary Driver |
|--------|----------|----------------|
| Early | 5-11 | Accuracy + Confidence (mixed) |
| Late | 16-20 | Confidence only |

### Classification Performance
| Decoded Variable | Overall Accuracy | High Conf Trials | Low Conf Trials |
|------------------|------------------|------------------|-----------------|
| Speaker Accuracy | 54.5% | 60.2% (conf=4) | ~50% (NS) |
| Speaker Confidence | 56.3% | - | - |

## Implementation Details

### For Confident Speech Synthesis
1. **Pitch contour**: Apply LHL% pattern (rise in first half, fall in second half)
2. **Loudness**: Increase overall amplitude (accuracy cue, but correlates)
3. **Duration**: Slightly longer utterances
4. **Timing**: Ensure pitch peak occurs around segment 10/20 (midpoint)

### For Uncertain Speech Synthesis
1. **Pitch contour**: Apply HLH% pattern (fall early, rise late)
2. **Loudness**: Lower amplitude
3. **Duration**: Slightly shorter utterances
4. **Ending intonation**: Rising terminal pitch (classic uncertainty marker)

### Pitch Extraction Method (from paper)
- Divided each utterance into 20 equal temporal segments
- Extracted F0 using Praat in each segment
- Normalized per participant, word, and segment (z-scored)

### Acoustic Features Used
- Fundamental frequency (F0) profiles - 20 windows
- RMS amplitude profiles - 20 windows
- Word duration

## Figures of Interest
- **Fig 2 (page 4):** Differential prosodic profiles - shows pitch/RMS/duration differences for high-low confidence, correct-incorrect, long-short SOA
- **Fig 3 (page 8):** Intonation profiles by accuracy within confidence levels - shows accuracy affects pitch even when controlling confidence
- **Fig 4 (page 8):** Classification performance - shows decoder can separate accuracy and confidence

## Results Summary
1. **Intonation** reflects both accuracy (early) and confidence (late), with confidence dominating at utterance end
2. **Loudness** primarily reflects accuracy, not subjective confidence
3. **Duration** reflects confidence (longer = more confident) - opposite to some prior claims about speech rate
4. Both can be automatically decoded from prosody (~55-60% accuracy)
5. More competent individuals show stronger prosodic markers
6. Effects present without audience (natural signs, not deliberate communication)

## Limitations
- Only bisyllabic pseudo-words (French), may not generalize to longer utterances
- Non-social context only - doesn't address deliberate manipulation in communication
- Duration/speech rate relationship may depend on speed-accuracy tradeoff (task-dependent)
- Classification performance modest (~55-60%), though reliably above chance
- Individual speaker normalization required - no absolute acoustic values provided

## Relevance to Qlatt Project

### Direct Applications
1. **Epistemic prosody modeling**: Can implement confidence/uncertainty as prosodic parameter affecting F0 contour shape
2. **Intonation patterns**: LHL% for confident, HLH% for uncertain - implementable as F0 contour templates
3. **Loudness modulation**: Could tie to accuracy/certainty state in TTS frontend

### Potential Implementation
- Add `confidence` parameter (0-1) to utterance specification
- High confidence: boost early F0, lower late F0
- Low confidence: lower early F0, raise late F0
- Modulate AV (voicing amplitude) based on confidence
- Adjust segment durations (longer = more confident)

### Caveats for Implementation
- Paper uses z-scored values, not absolute Hz/dB
- Effects are relative within speaker, need adaptation for synthesis
- Duration finding (confident = longer) contradicts some perception studies - may be task-dependent

## Open Questions
- [ ] What are the absolute Hz magnitudes of the pitch differences?
- [ ] How do these effects scale with utterance length?
- [ ] Does the LHL%/HLH% pattern hold for declarative sentences?
- [ ] How to map z-scored effects to Klatt parameter ranges?
- [ ] Interaction with emotional prosody (paper mentions this as future work)?

## Related Work Worth Reading
- Kimble & Seidel (1991) - Vocal signs of confidence (loudness and speech rate without audience)
- Jiang & Pell (2017) - The sound of confidence and doubt (perception study)
- Brennan & Williams (1995) - Prosody and filled pauses as metacognitive cues
- Goupil et al. (2021) - Listeners' perceptions of certainty and honesty (companion perception paper)
- Ponsot et al. (2018) - Cracking the social code of speech prosody (reverse correlation method)
- Van Zant & Berger (2019) - How the voice persuades (deliberate manipulation of prosody)

---

## Collection Cross-References

### Already in Collection
- [[Jiang_2017_SoundOfConfidenceDoubt]]

### New Leads (Not Yet in Collection)
- **Kimble & Seidel (1991)** - "Vocal signs of confidence" - Foundational work showing prosodic markers present without audience; only measured loudness and speech rate, not intonation
- **Brennan & Williams (1995)** - "Prosody and filled pauses as cues to listeners about metacognitive states" - Classic paper on how prosody conveys epistemic states; relevant for TTS implementation
- **Ponsot et al. (2018)** - "Cracking the social code of speech prosody using reverse correlation" - Data-driven method for uncovering prosodic signatures; from same lab, complementary methodology
