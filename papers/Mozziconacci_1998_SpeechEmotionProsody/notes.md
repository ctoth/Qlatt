# Speech Variability and Emotion: Production and Perception

**Author:** Sylvie J. L. Mozziconacci
**Year:** 1998
**Type:** PhD Thesis
**Institution:** Technische Universiteit Eindhoven
**DOI:** 10.6100/IR516785

## One-Sentence Summary

This thesis provides quantitative prosodic parameter values (pitch level, pitch range, speech rate, intonation patterns) for synthesizing seven distinct emotions in speech, achieving 63% recognition accuracy using rule-based synthesis.

## Problem Addressed

Synthetic speech, despite being reasonably intelligible, sounds dull, unnatural, and uninvolved because TTS systems fail to exploit prosodic variation the way humans do. This research identifies the specific prosodic parameters that convey emotional states and derives optimal values for implementing emotional expression in speech synthesis.

## Key Contributions

- Establishes optimal values for pitch level (Hz), pitch range (semitones), and speech rate (% of neutral) for seven emotions
- Demonstrates that the complex F0 curve of emotional speech can be replaced by a simple rule-based approximation requiring only three parameters
- Shows that the '1&A' intonation pattern (pointed hat) is versatile across all seven emotions when combined with appropriate pitch level/range
- Identifies which intonation patterns to prefer and avoid for each emotion
- Proves that 63% emotion recognition is achievable with prosody alone (vs. 73% for natural speech)
- Establishes that voice quality is essential for sadness and fear expression (prosody alone is insufficient)
- Provides regression equations for accented/unaccented segment duration proportions

## Emotions Studied

1. **Neutrality** - Reference baseline for all comparisons
2. **Joy** - Fast speech, high pitch, wide range
3. **Boredom** - Very slow speech, low pitch, narrow range
4. **Anger** - Fast speech, elevated pitch, wide range
5. **Sadness** - Slow speech, moderate pitch; requires voice quality cues
6. **Fear** - Slightly fast, highest pitch; often confused with indignation
7. **Indignation** - Slower speech, high pitch, wide range; distinctive accented segment lengthening

## Prosodic Parameters for Emotion

### Master Table: Emotion Parameters

| Emotion | Pitch Level (Hz) | Pitch Range (st) | Speech Rate (%) | Duration Multiplier | Preferred Patterns | Avoid Patterns |
|---------|------------------|------------------|-----------------|---------------------|-------------------|----------------|
| Neutrality | 65 | 5 | 100% | 1.00 | 1&A | 12, 3C |
| Joy | 155 | 10 | 83% | 0.83 | 1&A, 5&A | A, EA, 12 |
| Boredom | 65 | 4 | 150% | 1.50 | 3C | 5&A, 12 |
| Anger | 110 | 10 | 79% | 0.79 | 5&A, A, EA | 1&A, 3C |
| Sadness | 102 | 7 | 129% | 1.29 | 3C | 5&A |
| Fear | 200 | 8 | 89% | 0.89 | 12, 3C | A, EA |
| Indignation | 170 | 10 | 117% | 1.17 | 12, 3C, A, EA | 1&A |

Note: Pitch level values are end frequency of declination baseline for male Dutch speaker. Female speakers use proportionally higher values.

### Pitch Level

Pitch level is represented by the end frequency of the declination baseline:

| Category | Emotions | End Frequency (Hz) |
|----------|----------|-------------------|
| Low | Neutrality, Boredom | 65 |
| Medium | Sadness, Anger | 102-110 |
| High | Joy, Indignation | 155-170 |
| Very High | Fear | 200 |

Estimation formula:
$$F_{end} = \bar{F_0} - 2 \cdot \sigma_{F_0}$$

### Pitch Range

Pitch range is the excursion size of pitch movements in semitones:

| Category | Emotions | Range (st) |
|----------|----------|------------|
| Narrow (4-5) | Boredom, Neutrality | 4-5 |
| Medium (7-8) | Sadness, Fear | 7-8 |
| Wide (10) | Joy, Anger, Indignation | 10 |

Estimation formula:
$$pitch\_range \approx 2 \cdot \sigma_{F_0}$$ (in semitones)

### Speech Rate

Duration relative to neutral (100%):

| Category | Emotions | Duration % | Rate Multiplier |
|----------|----------|------------|-----------------|
| Faster | Anger | 79% | 1.27x |
| Slightly Faster | Joy, Fear | 83-89% | 1.12-1.20x |
| Neutral | Neutrality | 100% | 1.00x |
| Slightly Slower | Indignation | 117% | 0.85x |
| Slower | Sadness | 129% | 0.78x |
| Much Slower | Boredom | 150% | 0.67x |

### Intonation Patterns

The thesis uses the Dutch IPO intonation grammar ('t Hart, Collier, and Cohen, 1990).

**Pitch Movement Labels:**
- **Rises:** 1 (early prominence-lending), 2 (very late non-prominence-lending), 3 (late prominence-lending), 4 (slow rise), 5 (half rise/overshoot)
- **Falls:** A (late prominence-lending), B (early non-prominence-lending), C (very late), D (slow fall), E (half fall)

**Key Patterns:**
- **1&A** (pointed hat): Rise-fall on single accented syllable - versatile across all emotions
- **1A** (hat pattern): Rise on accented syllable, fall on next
- **3C** (cap pattern): Late rise and very late fall - signals non-neutral emotion
- **12**: Rise followed by very late rise - strongly associated with indignation
- **5&A**: Overshoot after rise with full fall - preferred for anger

**Pattern-Emotion Associations:**
| Pattern | Best For | Never Use For |
|---------|----------|---------------|
| 1&A | Neutrality, Joy | Anger, Indignation |
| 3C | Boredom, Sadness, Fear | Neutrality, Anger |
| 12 | Indignation, Fear | Neutrality, Joy |
| 5&A | Anger, Joy | Boredom, Sadness |
| A, EA | Anger, Indignation | Joy, Fear |

## Duration Rules

### Overall Duration
Apply the duration multiplier from the Master Table to scale the entire utterance.

### Accented vs Unaccented Segments
For most emotions, linear stretching is sufficient. However:

- **Neutrality**: Maintain strict linear relationship; any deviation signals emotion
- **Indignation**: Stretch accented segments 40% more than unaccented segments
- **Other emotions**: Linear model acceptable

### Regression Equations for Accented Proportion
Where x = overall sentence duration (seconds), y = proportion of accented segments:

**General pattern:**
$$y = 0.4206 - (0.0388 \times x)$$ (Sentence 1)

For some sentences, piecewise linear:
- If $x < 1.83$: $y = 0.3246 + (0.0387 \times x)$
- Else: $y = 0.4845 - (0.0487 \times x)$

## Voice Quality Notes

The thesis focused on pitch and temporal parameters; voice quality was NOT manipulated. However, key findings about voice quality:

- **Sadness** requires voice source and micro-duration features for clear expression (prosody alone insufficient)
- **Fear** was poorly recognized in rule-based versions, suggesting distinctive acoustic cues beyond F0 and duration
- Relevant parameters mentioned: breathiness, laryngealization (creaky voice), sighs, voice breaks, jitter, harshness, tremulousness, whisper
- Mutual compensation exists: if F0 cues are strong, voice quality can be weaker (and vice versa)

Referenced parameters from DECtalk3:
- Breathiness
- Brilliance
- Laryngealization
- Loudness (scale -10 to +10)

## Implementation Guidelines

### Generating Emotional Speech from Neutral

1. Start with neutral synthetic utterance
2. Apply emotion-specific pitch level (end frequency of baseline)
3. Apply emotion-specific pitch range (excursion size)
4. Apply duration multiplier for overall speech rate
5. Select appropriate intonation pattern from preferred list
6. For indignation: additionally stretch accented syllables 40% more than unaccented

### F0 Contour Generation

1. Set baseline declination: ~3.5 semitones/second decline
2. Apply end frequency for target emotion (determines pitch level)
3. Apply excursion size for pitch movements (determines pitch range)
4. Time pitch movements relative to vowel onset:
   - Rise '1': starts 70 ms before vowel onset, duration 120 ms
   - Fall 'A' (in 1&A): starts 80 ms after vowel onset, duration 120 ms

### Dutch IPO Standard Values for Neutral Speech
- End frequency: 75 Hz
- Pitch movement excursion: 6 semitones
- Declination: automatically computed from end frequency and utterance duration

### Emotion Classification Algorithm

```
if (pitch_level < average) and (pitch_range < average):
    emotion = neutrality or boredom
elif (pitch_level > average) and (pitch_range > average):
    emotion = fear, anger, joy, or indignation
else:
    emotion = sadness (high pitch, small range is special case)
```

## Key Equations

### Pitch Level Estimation
$$F_{end} = \bar{F_0} - 2 \cdot \sigma_{F_0}$$

### Pitch Range Estimation
$$pitch\_range = 2 \cdot \sigma_{F_0}$$ (semitones)

### Normalization Formula
$$n_i = \frac{x_i - \bar{x}}{s}$$

### F0 Transformations (Kitahara & Tohkura 1992)
For joy:
$$(F_0(t) - F_0min) \times 1.4 + F_0min + 30$$

For anger:
$$F_0(t) + 30$$ (except end of sentence)

For sadness:
$$(F_0(t) - F_0min) \times 0.6 + F_0min$$

## Figures of Interest

- **Fig 1 (p.33-34):** Schematized intonation patterns with IPO labels (1, 3, 4, 5, A, C, D, E)
- **Fig 1 (p.66):** Two-component model showing floor, ceiling, baseline, topline, tonal space, pitch range, pitch level
- **Fig 2 (p.71):** Mean F0 and standard deviation for three speakers (MR, RS, LO) and optimal values per emotion
- **Fig 3 (p.72):** Normalized pitch level and pitch range representation
- **Fig 4 (p.80):** Intonation pattern examples with pitch movement labels
- **Fig 5 (p.87):** Averaged pitch curves per speaker and emotion showing F0 at 6 anchor points
- **Figs 1-4 (p.137-141):** Accented segment proportion in emotional speech
- **Figs 1-4 (p.169):** Duration vs. standard deviation vs. mean F0 for three speakers and optimal values

## Limitations

- **Voice quality not modeled**: Sadness and fear recognition remained poor without voice source manipulation
- **Fear-indignation confusion**: Fear was often confused with indignation (32.5% recognition vs. 87.5% for indignation)
- **Anger-joy confusion**: Anger confused with joy and neutrality (42.5% recognition)
- **Dutch-specific**: IPO grammar and parameters derived from Dutch speakers; cross-linguistic validation needed
- **Limited sentence types**: Tested on declarative sentences; questions, commands not studied
- **Single speaker synthesis**: Optimal values averaged across speakers may not suit individual voices
- **Intensity not studied**: Loudness variations were not included

## Relevance to Qlatt Project

This thesis is directly applicable to the Qlatt Klatt formant synthesizer:

1. **Prosody rules**: The pitch level, pitch range, and speech rate parameters can be implemented in `tts-frontend-rules.js`
2. **F0 contour generation**: The declination baseline + pitch movements model aligns with Klatt's F0 parameter (F0)
3. **Duration control**: The segment duration rules can be applied when generating Klatt frames
4. **Voice quality extension**: Future work could implement the voice quality parameters mentioned (breathiness via TL/AH, laryngealization via OQ/DI)

### Specific Parameter Mappings to Klatt

| Mozziconacci Parameter | Klatt Parameter | Notes |
|------------------------|-----------------|-------|
| Pitch level | F0 | End frequency of baseline |
| Pitch range | F0 excursions | Semitone deviations from baseline |
| Speech rate | Frame duration | Duration multiplier on segments |
| Breathiness | AH (aspiration) | Voice quality for sadness |
| Laryngealization | OQ (open quotient) | Creaky voice for sadness |

## Open Questions

- [ ] How do optimal values change for female voices? (Female speaker LO had ~2x higher F0 values)
- [ ] Can the IPO patterns be approximated with simpler rise/fall interpolation in the Klatt framework?
- [ ] What specific AH/TL values correspond to "breathy" sadness voice quality?
- [ ] How does intensity (AV parameter) vary with emotion?
- [ ] Are the Dutch-derived patterns applicable to English synthesis?

## Related Work Worth Reading

From the thesis bibliography:

- **Cahn, J.E. (1990)** - "Generating expression in synthesized speech" - DECtalk3 Affect Editor implementation
- **Murray, I.R. & Arnott, J.L. (1993)** - "Toward the simulation of emotion in synthetic speech" - Review of emotional speech synthesis
- **Williams, C.E. & Stevens, K.N. (1972)** - "Emotions and speech: some acoustical factors" - Classic study on emotion acoustics
- **'t Hart, J., Collier, R. & Cohen, A. (1990)** - "A perceptual study of intonation" - Dutch IPO intonation grammar
- **Klatt, D.H. (1975, 1976)** - Vowel lengthening and segmental duration in English
- **Carlson, R., Granstrom, B. & Nord, L. (1992)** - Experiments with emotive speech synthesis
- **Laukkanen et al. (1997)** - Voice quality in emotional speech
- **Scherer, K.R. (1986)** - Vocal affect expression: A review
