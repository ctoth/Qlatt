---
title: "Beyond Arousal: Valence and Potency/Control Cues in the Vocal Expression of Emotion"
authors: "Martijn Goudbeek, Klaus Scherer"
year: 2010
venue: "Journal of the Acoustical Society of America, 128(3), 1322-1336"
doi_url: "10.1121/1.3466853"
---

# Beyond Arousal: Valence and Potency/Control Cues in the Vocal Expression of Emotion

## One-Sentence Summary

Demonstrates that vocal emotion expression encodes not only arousal (via F0 and intensity) but also valence (via spectral slope and intensity variability) and potency/control (via F0 level, spectral noise/HNR, and low-frequency spectral dominance), using the balanced GEMEP corpus of 12 emotions.

## Problem Addressed

Most vocal emotion research has focused on arousal, which dominates F0 and intensity measures, leaving valence and potency/control dimensions largely unexplored. This paper asks: are there acoustic parameters that specifically encode valence and potency/control beyond arousal?

## Key Contributions

- First systematic investigation of all three emotion dimensions (arousal, valence, potency/control) with a balanced corpus design
- Identifies spectral balance and spectral noise as the acoustic domains carrying valence and potency/control information
- Cross-cultural validation comparing French (GEMEP) and German (Munich) actor corpora
- Seven composite acoustic scores derived via PCA that reduce 24 parameters to interpretable dimensions

## Methodology

- **Corpus:** GEMEP (Geneva Multimodal Emotional Portrayals) — 10 professional French-speaking actors (5M, 5F), coached by a stage director using Stanislavski method
- **Emotions:** 12 emotions balanced across arousal (high/low) x valence (positive/negative), with potency/control as a third dimension
- **Stimuli:** Two meaningless carrier sentences ("ne kali bam soud molen" and "koun se mina loud belam") plus sustained vowel /a/
- **Selection:** 120 portrayals from 480 total, filtered by correct recognition AND believability (>1.5 SD above mean)
- **Analysis:** Praat extraction of 24 acoustic parameters, PCA, stepwise logistic regression

## The 12 Emotions and Their Dimensional Positions

| Emotion | Abbreviation | Arousal | Valence | Potency/Control |
|---------|-------------|---------|---------|-----------------|
| Elation/Joy | joy | High | Positive | **High** |
| Amusement | amu | High | Positive | Low |
| Pride | pri | High | Positive | **High** |
| Hot anger/Rage | ang | High | Negative | **High** |
| Panic fear | fea | High | Negative | Low |
| Despair | des | High | Negative | Low |
| Pleasure | ple | Low | Positive | **High** |
| Relief | rel | Low | Positive | Low |
| Interest | int | Low | Positive | **High** |
| Cold anger/Irritation | irr | Low | Negative | **High** |
| Anxiety/Worry | anx | Low | Negative | Low |
| Sadness/Depression | sad | Low | Negative | Low |

## Acoustic Parameters Extracted (Table II)

### Duration parameters
- Duration: total utterance duration (s)
- Duration of voiced parts (excluding silences)
- Duration of unvoiced parts (excluding silences)
- Duration of silent parts (threshold -25 dB)
- Speech rate: 1 / (duration * no. of syllables)

### F0 parameters
- F0 mean: mean of voiced parts
- F0 sd: standard deviation
- F0 maximum: 95th percentile
- F0 minimum: 5th percentile
- F0 range: F0 max - F0 min
- F0 slope: mean absolute difference between adjacent F0 points / time between them

### Intensity parameters
- Intensity mean, sd, maximum, minimum, range (all in dB)

### Voice quality — spectral balance
- Energy below 500 Hz: proportion of total energy
- Energy below 1 kHz: proportion of total energy
- Hammarberg index: difference between energy maxima in 0-2 kHz and 2-5 kHz ranges
- Spectral slope: regression line slope through LTAS
- Spectral flatness: ratio of geometric to arithmetic mean of power spectrum
- Spectral skewness: asymmetry of spectral shape around mean

### Voice quality — variability
- HNR: harmonics-to-noise ratio (dB)
- Autocorrelation: signal periodicity at 0.01 s lag
- Jitter: mean absolute period difference / mean period
- Shimmer: mean absolute amplitude difference / mean amplitude

## Seven Composite Scores (from PCA)

| # | Name | Components | Interpretation |
|---|------|-----------|----------------|
| 1 | F0 level | F0 mean + F0 min | Higher mean F0 |
| 2 | F0 variability | F0 sd + F0 slope | More variable F0 |
| 3 | Intensity level | Int mean + Int min | Louder signal |
| 4 | Intensity variability | Int sd + Int range | More dynamic intensity |
| 5 | Speech rate | Speech rate + Duration voiced | More voiced parts, faster rate |
| 6 | Low spectral dominance | I<500 Hz + spectral skewness + (inverse) Hammarberg | Steep spectral slope (more low-freq energy) |
| 7 | Spectral noise | HNR + Autocorrelation | More regular/harmonic signal |

Plus 5 individual measures kept separate: Jitter, Shimmer, Spectral slope, Spectral flatness, Duration of silence parts.

## Principal Component Loadings (Table V)

| Component | Var% | Cumul% | Key loadings |
|-----------|------|--------|-------------|
| 1 | 38 | 38 | Spectral balance + intensity: Hammarberg (0.89), I<500 (-0.88), I<1000 (-0.84), spec skewness (-0.77), Int mean (0.80), Int min (0.59) |
| 2 | 14 | 52 | All F0: F0 mean (0.70), F0 sd (0.91), F0 max (0.85), F0 min (0.48), F0 range (0.93) |
| 3 | 11 | 63 | Spectral noise: Autocorrelation (0.93), HNR (0.95), Jitter (-0.17), Shimmer (-0.88) |
| 4 | 10 | 73 | Duration: Dur (0.97), Dur voiced (0.83), Dur unvoiced (-0.66), Dur silence (0.69), Speech rate (-0.88) |
| 5 | 6 | 79 | Intensity variability: Int sd (0.89), Int range (0.83) |
| 6 | 4 | 83 | Spectral slope (0.93) |
| 7 | 4 | 87 | Shimmer (-0.09); unclear single-measure component |

## Key Results: Logistic Regression (Table VI)

### Overall model (all emotions)

| Dimension | R² | Significant predictors | Wald | p |
|-----------|-----|----------------------|------|---|
| **Arousal** | **0.82** | F0 level | 6.95 | 0.01 |
| | | Intensity level | 17.3 | 0.01 |
| | | Intensity variability | 7.03 | 0.01 |
| | | Shimmer | 4.19 | 0.04 |
| **Valence** | **0.22** | Intensity variability | 9.82 | 0.01 |
| | | Spectral slope | 7.03 | 0.01 |
| **Potency/Control** | **0.23** | F0 level | 8.80 | 0.03 |
| | | Spectral noise (HNR) | 7.20 | 0.01 |
| | | Low spectral dominance | 11.4 | 0.01 |
| | | Spectral flatness | 3.80 | 0.05 |

### Arousal-dependent models

| Condition | Dimension | R² | Significant predictors | Wald | p |
|-----------|-----------|-----|----------------------|------|---|
| Low arousal | Valence | 0.29 | Intensity variability | 3.86 | 0.05 |
| | | | Spectral slope | 8.74 | 0.01 |
| Low arousal | Potency/control | 0.15 | Shimmer | 5.43 | 0.02 |
| High arousal | Valence | 0.49 | Spectral noise | 3.31 | 0.07 |
| | | | Intensity level | 9.31 | 0.02 |
| | | | Intensity variability | 10.5 | 0.01 |
| | | | Spectral slope | 2.91 | 0.09 |
| | | | Spectral flatness | 5.01 | 0.03 |
| High arousal | Potency/control | 0.38 | F0 level | 7.73 | 0.01 |
| | | | Intensity variability | 2.92 | 0.09 |
| | | | Spectral slope | 3.10 | 0.08 |
| | | | Spectral flatness | 7.24 | 0.01 |

### Summary of dimension-parameter mappings

- **Arousal:** F0 level + Intensity level + Intensity variability (R² = 0.82)
- **Valence (positive):** Steeper spectral slope, less intensity variation; at high arousal also less noisy (higher HNR), flatter spectrum
- **Potency/control (high):** Higher F0, less noisy (higher HNR), flatter spectrum, more low-spectral dominance

## Cross-Cultural Validation (Table III)

GEMEP (French) vs Munich corpus (German, Banse & Scherer 1996):
- 3 of 8 acoustic parameters showed significant positive profile correlation
- 5 of 9 shared emotions showed significant positive profile correlation
- Only irritation/cold anger showed negative correlation (different portrayal concept between corpora)
- F0 mean was the only parameter with a significant mean z-score difference (French actors lower F0 for irritation vs German actors)

## Figures of Interest

- **Fig. 1 (page 5/1327):** Duration, F0, and intensity measures for all 12 emotions grouped by valence and arousal. Shows pleasure has longest duration (~3.5 s) vs fear shortest (~1 s); joy has highest F0 mean (~300 Hz); anger highest intensity
- **Fig. 2 (page 7/1329):** Voice quality measures (spectral balance and regularity) for all 12 emotions. Shows joy has steepest Hammarberg index; sadness highest energy below 500 Hz; joy highest HNR

## Limitations

- Uses acted emotional expressions (GEMEP corpus with professional actors)
- Parameters extracted from whole utterances, not phoneme-level
- Only 24 acoustic parameters; prosodic contour shape, F0 dynamics, and glottal source spectrum not analyzed
- 120 portrayals total (10 per emotion) is relatively small
- Meaningless carrier sentences avoid linguistic confounds but may limit ecological validity
- Dimensional categorization of some emotions was theoretical rather than purely empirical

## Testable Properties

- Arousal classification from F0 level + Intensity level should achieve R² > 0.80
- Spectral slope should differ significantly between positive and negative valence emotions at matched arousal
- HNR should differ significantly between high and low potency/control emotions at matched arousal
- The seven composite scores should be largely independent (low inter-correlation)
- Cross-profile correlations between French and German emotional expression should be positive for most emotions

## Relevance to Project

This paper provides the empirical basis for implementing emotional speech synthesis beyond simple arousal (F0 + intensity) modulation. For Qlatt, the key insight is that valence requires spectral slope control (steeper for positive emotions) and potency/control requires HNR/spectral noise control (less noisy for high potency), both of which map to Klatt parameters: spectral slope maps to TL (tilt) and source parameters, while spectral noise maps to AH (aspiration) and voice quality parameters. The arousal-dependent interaction means emotion presets should be organized hierarchically: set arousal level first (F0 + intensity), then adjust spectral parameters for valence and potency.

## Open Questions

- [ ] How do these findings map to specific Klatt parameter modifications beyond the broad spectral categories?
- [ ] Would phoneme-level analysis reveal different valence/potency cues?
- [ ] How stable are the valence effects in spontaneous (non-acted) speech?
- [ ] Can the composite scores be computed from Klatt output parameters for synthesis verification?

## Related Work Worth Reading

- Banse & Scherer (1996) — Munich corpus comparison (already in collection)
- Fontaine et al. (2007) — Four-dimensional emotion space including potency/control
- Juslin & Laukka (2003a, 2003b) — Reviews of vocal emotion expression
- Gobl & Ni Chasaide (2003) — Voice quality and emotion (already in collection)
- Scherer (2003) — Vocal communication of emotion review

## Collection Cross-References

### Already in Collection
- [[Banse_1996_VocalEmotionAcousticProfiles]] — Munich corpus used as cross-cultural comparison; 3/8 parameters and 5/9 emotions showed significant positive profile correlations between French GEMEP and German Munich data
- [[Gobl_2003_VoiceQualityEmotion]] — Voice quality and emotion; Goudbeek references Hanson (1997) on glottal tension and spectral shape, complementing Gobl's voice quality parameter trajectories
- [[Burkhardt_2005_GermanEmotionalSpeechDatabase]] — EmoDB cited as comparable emotion corpus
- [[Mozziconacci_1998_SpeechEmotionProsody]] — Emotional prosody in Dutch; Mozziconacci (2002) cited for prosodic contour analysis
- [[Mozziconacci_2002_ProsodyEmotions]] — Cited for methodology of isolating F0 contour from implementation
- [[Hanson_1997_GlottalCharacteristicsFemaleAcoustic]] — Referenced in discussion for relationship between glottal tension and spectral shape
- [[Eyben_2015_GeMAPS_AcousticParameters]] — Goudbeek's composite scores and dimensional approach directly informed GeMAPS parameter selection

### Cited By (in Collection)
- [[Eyben_2015_GeMAPS_AcousticParameters]] — cites this as foundational for understanding which acoustic features correlate with emotional dimensions
- [[Belyk_2014_AcousticValenceEmotion]] — cites this for the dimensional approach to vocal emotion; Belyk's family-specific valence rules extend Goudbeek's finding that valence is reflected in spectral slope
- [[Kamiloglu_2021_VoiceProductionPerception]] — cites this in the context of vocal emotion perception research
- [[Larrouy-Maestri_2024_EmotionalProsody]] — cites this for arousal/valence/potency dimensional analysis showing spectral slope encodes valence

### New Leads (Not Yet in Collection)
- Fontaine et al. (2007) — "The world of emotions is not two-dimensional" — establishes potency/control as a necessary third dimension; theoretical foundation for this paper's design
- Juslin & Laukka (2003a) — "Communication of emotions in vocal expression and music performance" — comprehensive review of vocal emotion expression
- Tamarit, Goudbeek & Scherer (2008) — "Spectral slope measurements in emotionally expressive speech" — more detailed spectral analysis using the same GEMEP corpus

### Supersedes or Recontextualizes
- [[Banse_1996_VocalEmotionAcousticProfiles]] — Goudbeek extends the Banse & Scherer (1996) Munich corpus work by adding the potency/control dimension and demonstrating that spectral balance specifically encodes valence beyond arousal, which the Munich analysis did not examine separately

### Conceptual Links (not citation-based)
- [[Wiethoff_2008_CerebralEmotionalProsody]] — Wiethoff's fMRI study shows that the brain's right mid STG responds to the conjoint effect of F0, intensity, and duration (the arousal-correlated parameters). Goudbeek's work explains why: these parameters primarily encode arousal, while valence requires spectral measures that Wiethoff did not include. Together they suggest the brain region Wiethoff identified is an arousal detector, not a full emotion discriminator.
- [[Grollero_2023_CoreAffectVocalBursts]] — Grollero confirms the nonlinear valence-arousal relationship (V-shape) in vocal bursts, consistent with Goudbeek's finding that arousal dominates vocal expression while valence is secondary. The V-shape (extreme valence → high arousal) aligns with arousal being the primary vocal dimension that valence modulates nonlinearly.
- [[Weninger_2013_AcousticsEmotionAudio]] — Moderate. Weninger extends Goudbeek's dimensional approach cross-domain (speech, music, sound), confirming that arousal features generalize while valence features are domain-specific. Weninger's finding of inverse valence correlations across domains strengthens Goudbeek's conclusion that valence requires domain-specific spectral features.
