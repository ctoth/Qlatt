# Acoustic Profiles in Vocal Emotion Expression

**Authors:** Rainer Banse (Humboldt University), Klaus R. Scherer (University of Geneva)
**Year:** 1996
**Venue:** Journal of Personality and Social Psychology, Vol. 70, No. 3, 614-636
**DOI:** 0022-3514/96/$3.00

## One-Sentence Summary

Comprehensive empirical study establishing acoustic parameter profiles (F0, energy, spectral distribution, speech rate, articulation duration) for 14 distinct emotions, providing quantitative targets for emotional speech synthesis.

## Problem Addressed

Prior research on vocal emotion expression lacked:
1. Replication across studies with consistent findings
2. Sufficient number and variety of emotions studied
3. Identification of activation-arousal vs. valence-quality cues
4. Systematic confusion pattern analysis between emotions

## Key Contributions

1. **29 acoustic parameters** measured across 14 emotions with 224 actor portrayals
2. **Emotion-specific acoustic profiles** (Table 6) with means and standard deviations
3. **Recognition accuracy data** (~48% overall, up to 78% for hot anger)
4. **Confusion matrices** revealing emotion similarity dimensions
5. **Component process model predictions** validated against empirical data

## Methodology

- 12 professional actors (6M, 6F) in Munich
- 14 emotions: hot anger, cold anger, panic fear, anxiety, despair, sadness, elation, happiness, interest, boredom, shame, pride, disgust, contempt
- 2 scenarios × 2 sentences × 2 portrayals = 1,344 voice samples
- Acoustic analysis via GISYS (Giessen Speech Analysis System) at 16 kHz
- Recognition study: 12 naive judges, 280 portrayals

## Emotions Studied (Grouped by Family)

| Family | High Intensity | Low Intensity |
|--------|---------------|---------------|
| Anger | Hot anger | Cold anger |
| Fear | Panic fear | Anxiety |
| Sadness | Despair | Sadness |
| Joy | Elation | Happiness |
| Other | Pride, Disgust, Contempt, Interest, Boredom, Shame |

## Key Acoustic Parameters Measured

### Fundamental Frequency (F0)

| Parameter | Symbol | Description |
|-----------|--------|-------------|
| MF0 | Mean F0 | Mean fundamental frequency |
| P25F0 | 25th percentile | Lower quartile of F0 |
| P75F0 | 75th percentile | Upper quartile of F0 |
| SdF0 | SD of F0 | Standard deviation of F0 |

### Energy/Intensity

| Parameter | Description |
|-----------|-------------|
| MElog | Mean log-transformed microphone voltage (loudness indicator) |
| PE500 | Proportion of voiced energy up to 500 Hz |
| PE1000 | Proportion of voiced energy up to 1000 Hz |
| DO1000 | Slope of spectral energy above 1000 Hz |

### Spectral Distribution (Long-Term Average Spectrum)

**Voiced spectrum bands:**
- v-0.2K: 125-200 Hz
- v-0.3K: 200-300 Hz
- v-0.5K: 300-500 Hz
- v-0.6K: 500-600 Hz
- v-0.8K: 600-800 Hz
- v-1K: 800-1000 Hz
- v1-1.6K: 1000-1600 Hz
- v1.6-5K: 1600-5000 Hz
- v5-8K: 5000-8000 Hz

**Unvoiced spectrum bands:**
- uv-0.25K: 125-250 Hz
- uv-0.4K: 250-400 Hz
- uv-0.5K: 400-500 Hz
- uv0.5-1K: 500-1000 Hz
- uv1-1.6K: 1000-1600 Hz
- uv-2.5K: 1600-2500 Hz
- uv2.5-4K: 2500-4000 Hz
- uv4-5K: 4000-5000 Hz
- uv5-8K: 5000-8000 Hz

### Temporal Parameters

| Parameter | Symbol | Description |
|-----------|--------|-------------|
| DurArt | Articulation duration | Duration of nonsilent periods |
| DurVo | Voiced duration | Duration of voiced segments per utterance |
| HammI | Hammarberg index | Energy difference: max(0-2000 Hz) minus max(2000-5000 Hz) |

## Acoustic Profiles by Emotion (Table 6 - Z-Transformed Residuals)

### High-Arousal Emotions

| Parameter | Hot Anger | Panic Fear | Elation | Disgust |
|-----------|-----------|------------|---------|---------|
| MF0 | +1.13 | +0.99 | -0.31 | -0.45 |
| P25F0 | +0.92 | +1.15 | +0.15 | +0.15 |
| P75F0 | +1.13 | +0.73 | -0.08 | -0.08 |
| SdF0 | +0.71 | +0.81 | +1.03 | +0.43 |
| MElog | +0.53 | +0.53 | +0.47 | +0.49 |
| DurArt | -0.31 | +0.32 | +1.04 | -0.06 |
| DurVo | -0.45 | +0.07 | -0.51 | -0.42 |
| HammI | +0.63 | +0.91 | +0.48 | +0.52 |
| DO1000 | -0.55 | -0.51 | +0.23 | -0.30 |
| PE500 | +0.76 | +0.74 | +1.07 | -0.09 |
| PE1000 | -1.34 | -0.59 | +0.90 | -0.17 |
| v1-1.6K | +1.19 | +0.52 | -0.84 | +0.20 |
| v1.6-5K | +1.48 | +0.86 | +0.04 | -0.07 |

### Low-Arousal Emotions

| Parameter | Sadness | Boredom | Contempt | Shame |
|-----------|---------|---------|----------|-------|
| MF0 | -0.64 | -0.17 | -0.80 | -0.46 |
| P25F0 | -0.62 | +0.41 | -0.29 | -0.37 |
| P75F0 | -0.52 | +0.31 | -0.69 | -0.51 |
| SdF0 | -0.26 | +0.72 | +0.07 | -0.13 |
| MElog | -0.48 | +0.89 | -0.54 | -0.51 |
| DurArt | +0.17 | -0.43 | -0.13 | -0.26 |
| DurVo | +0.61 | +0.78 | +0.35 | +0.87 |
| HammI | -0.43 | +0.58 | -0.40 | -0.46 |
| DO1000 | +0.37 | +0.15 | -0.21 | +0.34 |
| PE500 | -0.29 | +0.83 | -0.05 | -0.17 |
| PE1000 | -0.05 | +0.39 | +0.11 | +0.35 |
| v1-1.6K | -0.35 | +0.53 | +0.28 | -0.15 |
| v1.6-5K | -0.37 | +0.83 | +0.49 | +0.03 |

## Predicted Emotion Effects (Table 2 from Scherer 1986)

Based on component process theory, predictions for acoustic changes:

| Emotion | F0 Mean | F0 Range | F0 Var | Intensity | Speech Rate | HF Energy |
|---------|---------|----------|--------|-----------|-------------|-----------|
| Hot anger | ↑↑ | ↑↑ | ↑ | ↑↑ | ↑ | ↑↑ |
| Cold anger | ↑ | ↓ | ↓ | ↑ | ↓ | ↑ |
| Fear/Panic | ↑↑ | ↑↑ | ↑ | ↑ | ↑ | ↑↑ |
| Anxiety | ↑ | - | ↑ | - | - | - |
| Sadness | ↓↓ | ↓ | ↓ | ↓↓ | ↓ | ↓↓ |
| Despair | ↓ | ↓ | ↓ | ↑ | - | ↓ |
| Joy/Elation | ↑↑ | ↑↑ | ↑ | ↑↑ | ↑ | ↑↑ |
| Happiness | ↑ | ↑ | ↑ | ↑ | - | ↑ |
| Boredom | ↓ | ↓ | ↓ | ↓ | ↓ | ↓ |
| Disgust | ↓ | ↓ | ↓ | ↓ | ↓ | ↓ |
| Contempt | ↓ | ↓ | ↓ | ↓ | ↓ | ↓ |
| Shame | ↓ | ↓ | ↓ | ↓ | ↓ | ↓ |

(↑↑ = strong increase, ↑ = increase, ↓ = decrease, ↓↓ = strong decrease, - = no change)

## Recognition Accuracy (Table 4)

| Emotion | Pairs Separate | Pairs Combined |
|---------|----------------|----------------|
| Hot anger | 78% | 88% |
| Cold anger | 34% | 51% |
| Panic fear | 36% | 63% |
| Anxiety | 42% | 55% |
| Despair | 47% | 55% |
| Sadness | 52% | 73% |
| Elation | 38% | 39% |
| Happiness | 52% | 54% |
| Interest | 75% | 75% |
| Boredom | 76% | 76% |
| Shame | 22% | 22% |
| Pride | 43% | 43% |
| Disgust | 15% | 15% |
| Contempt | 60% | 60% |
| **Mean** | **48%** | **55%** |

## Variance Explained by Acoustic Parameters (Table 5)

Best predictors for emotion (Total R² adjusted):

| Parameter | R² | Primary Emotion Associations |
|-----------|-----|------------------------------|
| MF0 | .71 | All "intense" emotions |
| P25F0 | .76 | F0 floor indicator |
| P75F0 | .55 | F0 ceiling indicator |
| SdF0 | .42 | F0 variability |
| MElog | .68 | Overall loudness |
| DurVo | .34 | Voicing proportion |
| DurArt | .31 | Articulation rate |
| HammI | .31 | Spectral tilt |
| DO1000 | .61 | High-frequency energy |
| PE500 | .49 | Low-frequency energy |
| PE1000 | .53 | Mid-frequency energy |
| v1-1.6K | .46 | Upper formant region |
| v1.6-5K | .50 | High-frequency voiced |

## Key Correlations Between Parameters (Table 7)

Strong correlations (|r| > 0.5):
- MF0 ↔ P25F0: r = 0.93
- MF0 ↔ P75F0: r = 0.92
- P25F0 ↔ P75F0: r = 0.76
- MElog ↔ DurArt: r = -0.29
- v1-1.6K ↔ v1.6-5K: r = -0.85 (negative correlation between adjacent bands)
- PE1000 ↔ v1-1.6K: r = -0.85

## Multiple Regression Predictors (Table 8)

Best acoustic parameters for predicting emotion category use:

| Emotion | Best Predictors (R, R_spec) |
|---------|----------------------------|
| Hot anger | MF0 (0.63), Spectral bands (0.65) |
| Sadness | MF0 (0.49), Spectral bands (0.52) |
| Elation | MF0 (0.39), Spectral bands (0.41) |
| Happiness | SdF0 (0.27), PE1000 (0.31) |
| Despair | SdF0 (0.44), DO1000 (0.46) |
| Boredom | DurVo (0.40), HammI (0.42) |

## Confusion Patterns (Table 9)

Emotions frequently confused:
- Hot anger ↔ Cold anger (within anger family)
- Panic fear ↔ Anxiety (within fear family)
- Sadness ↔ Despair (within sadness family)
- Elation ↔ Happiness (within joy family)
- Pride ↔ Contempt (both involve dominance display)
- Shame ↔ Sadness (similar low-arousal profiles)

Three dimensions of similarity:
1. **Quality** - Hot anger/cold anger, sadness/despair, panic/anxiety similar in quality but differ in intensity
2. **Intensity** - Elation/despair, hot anger/panic similar in high arousal
3. **Valence** - Pride confused with positive emotions; contempt confused with negative

## Implementation Notes

### For Emotional TTS Synthesis

1. **F0 Manipulation**
   - High-arousal emotions: Raise mean F0 by 1-2 SD
   - Low-arousal emotions: Lower mean F0 by 0.5-1 SD
   - Increase F0 variability (SdF0) for intense emotions
   - Use P25F0/P75F0 to set F0 range

2. **Energy/Intensity**
   - Angry/fearful: Increase MElog, increase HF energy
   - Sad/bored: Decrease MElog, flatten spectrum
   - Adjust HammI (spectral tilt) for perceived effort

3. **Spectral Balance**
   - Hot anger: Boost 1-5 kHz bands
   - Sadness: Reduce high-frequency energy
   - Use PE500/PE1000 ratios for "warmth" vs "brightness"

4. **Temporal Features**
   - Angry: Faster articulation (shorter DurArt)
   - Sad: Slower speech, longer voiced segments
   - Bored: Moderate rate, extended durations

### Parameter Transformation

Z-score residuals in Table 6 are after removing:
- Actor identity effects
- Gender effects
- Sentence/scenario effects

To apply: Take neutral baseline, add Z × SD for each parameter.

## Figures of Interest

- **Figure 1 (p. 627):** Mean F0 predictions vs. results for 14 emotions
- **Figure 2 (p. 629):** Mean energy predictions vs. results
- **Figure 3 (p. 630):** Low-frequency energy (PE500, PE1000) predictions vs. results
- **Figure 4 (p. 631):** Speech rate (DurArt, DurVo) predictions vs. results

## Limitations

1. Actor portrayals may differ from spontaneous emotion expression
2. German speakers only - cross-cultural validity uncertain
3. Standard sentences remove natural prosodic variation
4. Disgust and shame poorly recognized (15%, 22%) - may need different vocal cues (e.g., affect bursts like "yuck")
5. Some emotions (contempt, disgust) may be expressed more through brief vocalizations than sentence prosody

## Relevance to Qlatt Project

**Direct applications:**
- Emotion-specific F0 contour targets
- Spectral tilt (HammI) targets for voice quality
- Energy distribution targets across frequency bands
- Speech rate modulation targets

**For prosody module:**
- Table 6 provides z-score adjustments for each emotion
- Can implement as prosody "emotion profiles" that modify base parameters
- Recognition accuracy data suggests which emotions are acoustically distinct enough to synthesize

**Caveats for synthesis:**
- These are *correlates*, not causes - manipulating parameters may not produce perceived emotion
- Actor-specific variation is large - means hide individual strategies
- Interaction effects not fully characterized

## Open Questions

- [ ] How do these German-speaker values transfer to English?
- [ ] What is the minimum parameter set for emotion discrimination?
- [ ] How do emotions combine with linguistic prosody (focus, questions)?
- [ ] Can disgust be conveyed through sentence prosody or only affect bursts?

## Related Work Worth Reading

- Scherer (1986) - Component process model of emotion (theoretical basis)
- Pittam & Scherer (1993) - Vocal expression and communication of emotion
- Wallbott & Scherer (1986) - Cues and channels in emotion recognition
- Ladd et al. (1985) - F0 range and speaker affect
- Murray, I. R. & Arnott (1993) - Simulation of emotion in synthetic speech
