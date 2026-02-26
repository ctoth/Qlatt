# In a Nervous Voice: Acoustic Analysis and Perception of Anxiety in Social Phobics' Speech

**Authors:** Petri Laukka, Clas Linnman, Fredrik Åhs, Anna Pissiota, Örjan Frans, Vanda Faria, Åsa Michelgård, Lieuwe Appel, Mats Fredrikson, Tomas Furmark
**Year:** 2008
**Venue:** Journal of Nonverbal Behavior, 32:195-214
**DOI:** 10.1007/s10919-008-0055-9

## One-Sentence Summary
Provides empirically validated acoustic correlates of anxiety in authentic (not posed) speech, showing that F0 mean/max, spectral tilt (HF500), and pause proportion increase with anxiety level.

## Problem Addressed
Previous research on vocal emotion expression relied primarily on *posed* expressions (actors portraying emotions), which may be exaggerated or lack ecological validity. This study addresses the gap by measuring acoustic correlates of *authentic* anxiety using clinical data from social phobia patients.

## Key Contributions
- First study to show causal relationship between anxiety reduction and changes in nonverbal vocal behavior
- Establishes correlations between experienced anxiety, expressed acoustic features, and perceived nervousness
- Validates findings from posed expression literature using authentic emotional speech
- Demonstrates that proportion of pauses (% Silence) shows the largest effect size for anxiety

## Methodology
- **Participants:** 71 social phobia patients (DSM-IV criteria)
- **Design:** Within-subjects, pre/post pharmacological treatment
- **Task:** 2-minute public speech about vacation/travel (anxiety-provoking)
- **Groups:** Responders (anxiety decreased after treatment) vs Non-responders (control)
- **Speech samples:** First 10 seconds from each recording
- **Listening test:** 16 listeners rated content-masked (low-pass filtered at 500 Hz) speech for nervousness

## Key Equations

No mathematical equations presented - this is an empirical behavioral study using standard acoustic analysis (PRAAT) and ANOVA statistics.

## Parameters

| Name | Symbol | Units | Description | Effect of Anxiety |
|------|--------|-------|-------------|-------------------|
| Mean F0 | F0 M | Hz | Mean fundamental frequency | + (increases) |
| Max F0 | F0 max | Hz | Maximum fundamental frequency | + (increases) |
| F0 Variability | F0 SD | Hz | Standard deviation of F0 | - (decreases) |
| Mean Intensity | Intensity M | dB | Mean voice intensity/loudness | no significant effect |
| High-Frequency Energy | HF500 | ratio | Spectral energy above/below 500 Hz | + (increases, sharper voice) |
| Speech Rate | - | syllables/sec | Number of syllables / total duration | no significant effect |
| Silent Pauses | % Silence | % | Ratio of silent parts to total duration | + (increases) - **LARGEST EFFECT** |

### Effect Sizes (from ANOVA interaction effects, Table 2)

| Voice Cue | Partial η² | Significance |
|-----------|------------|--------------|
| % Silence | 0.21 | p < 0.001 |
| F0 M | 0.10 | p < 0.01 |
| F0 max | 0.08 | p < 0.05 |
| HF500 | 0.13 | p < 0.05 |

### Correlations with Self-Reported Anxiety (STAI-S) at Post-Trial (Table 3)

| Voice Cue | r | p |
|-----------|---|---|
| % Silence | 0.36 | < 0.01 |
| F0 SD | -0.24 | < 0.05 |

### Correlations with Perceived Nervousness at Post-Trial (Table 3)

| Voice Cue | r | p |
|-----------|---|---|
| Intensity M | -0.59 | < 0.001 |
| % Silence | 0.34 | < 0.01 |
| F0 M | 0.33 | < 0.01 |

## Implementation Details

### Acoustic Measurement (using PRAAT)
- **F0 extraction:** Autocorrelation algorithm with manual correction of octave jumps
- **Voice intensity:** Mean level contour in dB (relative, not absolute)
- **HF500:** Long-term average spectrum using Cooley-Tukey FFT (0-5 kHz), ratio of energy above vs below 500 Hz
- **Speech rate:** Syllable count from transcription / total duration (excluding pauses)
- **% Silence:** Defined by absence of speech activity in amplitude envelope AND spectrogram

### Content Masking for Listening Test
- Low-pass filter at 500 Hz (Hann-shaped filter in PRAAT)
- Removes phonetic information, renders speech unintelligible
- Preserves F0, intensity, temporal cues
- Some laryngeal voice quality information preserved (van Bezooijen & Boves 1986)

### Statistical Analysis
- Mixed-model ANOVA: Group (responder/non-responder) × Treatment (baseline/post-trial)
- Pitch cues z-transformed separately for men and women before analysis
- Change scores (Δ) computed as baseline - post-trial

## Figures of Interest
- **Fig 1 (page 203):** STAI-S anxiety scores before/after treatment for responders vs non-responders
- **Fig 2 (page 205):** Acoustic measures (F0 M, F0 max, HF500, % Silence) by group and treatment
- **Fig 3 (page 205):** Listeners' nervousness ratings by group and treatment

## Results Summary

### Effect of Anxiety on Voice Cues (Responders only)
1. **F0 M decreased** after treatment (mean pitch lowered when less anxious)
2. **F0 max decreased** after treatment (pitch ceiling lowered)
3. **HF500 decreased** after treatment (voice became less sharp/tense)
4. **% Silence decreased** after treatment (fewer pauses, more fluent speech)

### Perception
- Listeners could reliably perceive anxiety from content-masked speech (Cronbach's α = 0.91)
- Responders rated less nervous after treatment; non-responders unchanged
- Correlation between experienced (STAI-S) and perceived (listener ratings) anxiety: r = 0.24, p < 0.05

### Key Finding
The largest and most consistent effect of anxiety was on **proportion of pauses** (% Silence), suggesting that cognitive interference from anxiety (word-finding difficulties, discourse planning disruption) may be harder to mask than physiological effects on laryngeal tension.

## Limitations
- All speakers were clinical social phobics (generalizability to non-clinical population unclear)
- No emotionally neutral baseline - comparison was high vs moderate anxiety
- Low sound quality (PET scanner noise) prevented measurement of jitter, shimmer, formants
- Linguistic content not controlled
- Possible medication effects on voice (though treatments distributed equally across groups)
- Speakers may have attempted to suppress anxiety expression (pull effects vs push effects)

## Relevance to Project

### For Qlatt TTS Emotional Prosody
This paper provides **empirically validated targets** for synthesizing anxious/nervous speech:

1. **F0 manipulation:**
   - Increase mean F0 (raise baseline pitch)
   - Increase F0 max (higher pitch peaks)
   - Possibly decrease F0 variability (F0 SD) - more monotone

2. **Spectral tilt (HF500):**
   - Increase high-frequency energy ratio
   - Could be implemented via:
     - Reduced spectral tilt in source
     - Boosted formant amplitudes in higher formants
     - Modified AH (aspiration) or TL (tilt) parameters

3. **Temporal manipulation:**
   - Increase pause duration/frequency
   - Insert hesitation pauses
   - This was the STRONGEST cue - prioritize for anxious speech

### Mapping to Klatt Parameters
| Acoustic Correlate | Possible Klatt Parameter(s) |
|-------------------|----------------------------|
| Higher F0 mean | F0 (baseline) |
| Higher F0 max | F0 (peak values in contour) |
| Lower F0 variability | F0 contour flattening |
| More HF energy | TL (tilt) reduced, or higher formant amplitudes |
| More pauses | Temporal: insert silent frames, increase segment durations |

## Open Questions
- [ ] What is the absolute magnitude of F0 changes? (Paper shows relative/z-transformed values)
- [ ] How do these effects compare to fear (higher arousal state)?
- [ ] Would jitter/shimmer show effects if measurable? (Smith 1977 found jitter correlates with anxiety)
- [ ] How to model cognitive-based pauses vs physiological voice quality changes?

## Related Work Worth Reading
- Juslin & Laukka (2003) - Review of 104 studies on vocal emotion expression (meta-analysis)
- Scherer (1986) - Theoretical predictions for vocal cues based on appraisal theory
- Williams & Stevens (1972) - Comparison of posed vs authentic fear expressions
- Siegman (1987) - Review of anxiety effects on speech (primarily temporal aspects)
- Banse & Scherer (1996) - Acoustic profiles of emotions (likely in project's paper collection)

---

## Collection Cross-References

### Already in Collection
- **Banse_1996_VocalEmotionAcousticProfiles**

### New Leads (Not Yet in Collection)
- **Juslin, P. N., & Laukka, P. (2003)** - "Communication of emotions in vocal expression and music performance: Different channels, same code?" *Psychological Bulletin*
- Meta-analysis of 104 studies on vocal emotion expression. Essential reference for acoustic correlates of ALL basic emotions, not just anxiety.
- **Scherer, K. R. (1986)** - "Vocal affect expression: A review and a model for future research." *Psychological Bulletin*
- Theoretical framework predicting how cognitive appraisals map to physiological changes and resulting voice cues. Foundation for understanding WHY emotions affect the voice.
- **Williams, C. E., & Stevens, K. N. (1972)** - "Emotions and speech: Some acoustical correlates." *JASA*
- Classic paper comparing posed vs authentic fear expressions. Important for understanding differences between acted and real emotional speech.
- Likely already in project collection. Provides acoustic profiles for multiple emotions.
- **Siegman, A. W. (1987)** - "The telltale voice: Nonverbal messages of verbal communication"
- Comprehensive review specifically on anxiety effects on speech, particularly temporal aspects (pauses, dysfluencies).
