---
title: "The Structure Underlying Core Affect and Perceived Affective Qualities of Human Vocal Bursts"
authors: "Demetrio Grollero, Valentina Petrolini, Marco Viola, Rosalba Morese, Giada Lettieri, Luca Cecchetti"
year: 2023
venue: "Cognition and Emotion, 37(1), 1-17"
doi_url: "https://doi.org/10.1080/02699931.2022.2139661"
---

# The Structure Underlying Core Affect and Perceived Affective Qualities of Human Vocal Bursts

## One-Sentence Summary

This paper demonstrates that the valence-arousal relationship in human vocal bursts follows a V-shaped (quadratic) pattern rather than a linear one, and that stimulus ambiguity (high between-participant variability in valence ratings) predicts violations of this V-shape and elevated arousal ratings.

## Problem Addressed

The affect circumplex model (Russell 1980) assumes valence and arousal are independent dimensions, yet empirical findings consistently show a V-shaped relationship between them (high arousal for extreme positive or negative valence). Most evidence comes from visual stimuli; this paper tests whether the V-shape holds specifically for nonlinguistic vocal bursts and whether it applies to both subjective experience (Core Affect, CA) and semantic attribution (Perception of Affective Quality, PAQ).

## Key Contributions

- Confirms the V-shaped valence-arousal relationship holds for vocal bursts across two studies (n=12 deep phenotyping, n=925 large cohort) and two rating conditions (CA and PAQ)
- Demonstrates that quadratic (V-shaped) models consistently outperform linear models: adjusted R^2 of 0.38 vs 0.17 (Study 1 CA), 0.40 vs 0.06 (Study 1 PAQ), 0.10 vs 0.01 (Study 2 CA), 0.22 vs 0.01 (Study 2 PAQ)
- Shows that CA and PAQ ratings are strongly correlated but not identical: PAQ ratings are more extreme, more consistent between participants, and more reproducible across studies
- Introduces valence ambiguity as a predictor of V-shape violations: ambiguous stimuli (high between-participant standard deviation in valence) have higher fitting errors and elevated arousal ratings
- 11-17% of stimuli receive opposite valence ratings across CA and PAQ conditions

## Methodology

### Study 1 (Deep Phenotyping)
- 12 Italian native speakers (6F, 6M; mean age 29.02)
- 1,008 vocal bursts (600 female speakers), duration 567-1700ms, loudness normalized to EBU R 128
- Duration equalized to 850ms using audioStretch pitch-preserving phase-vocoder
- All stimuli rated under both CA and PAQ conditions (counterbalanced, 5-day minimum separation)
- 9 blocks of 112 stimuli each; ~48,000 total ratings
- Visual analog scales for valence ("very negative" to "very positive") and arousal ("not at all" to "very aroused"/"very much")
- Implemented in MATLAB R2019b

### Study 2 (Large Cohort)
- 925 participants (545F, 14 non-binary; mean age 31.6) via Qualtrics online survey
- Same 1,008 vocal bursts, original (unmodified) durations
- Each participant rated 12 stimuli per batch (84 batches), 48 responses total
- Valence and arousal collected in separate blocks to avoid spurious correlations (Lima et al. 2013)
- ~38,000 total ratings

### Stimulus Source
- 2,032 vocal bursts from 56 speakers (26F, 30M, ages 18-35)
- 425 from VENEC corpus (Laukka et al. 2013) — 11 professional actors
- 1,607 from Cowen et al. (2019) — 45 naive subjects (US, India, Kenya, Singapore)
- 30 target emotions (sadness, fear, sexual desire, etc.)

### Statistical Analysis
Three regression models compared:
- **Formula A** (linear): Arousal = α + β * Valence
- **Formula B** (quadratic): Arousal = α + β * Valence + β * Valence²
- **Formula C** (absolute difference): Arousal = α + β * |Valence - 50|

Mixed-effects models (Poisson distribution, log link):
- **Formula D** (linear): Arousal = α + β * Valence + (1 | Participant) + (1 | Stimulus)
- **Formula E** (quadratic): Arousal = α + β * Valence + β * Valence² + (1 | Participant) + (1 | Stimulus)

Ambiguity interaction model:
- **Formula F**: Arousal = α + β * |Valence-50| + β * Ambiguity + β * (Ambiguity × |Valence-50|) + (1 | Participant) + (1 | Stimulus)

## Key Equations

**V-shaped model (Formula B):**
$$\text{Arousal} = \alpha + \beta_1 \cdot \text{Valence} + \beta_2 \cdot \text{Valence}^2$$

**Absolute difference model (Formula C):**
$$\text{Arousal} = \alpha + \beta \cdot |\text{Valence} - 50|$$

**CA-PAQ linear relationship (Figure 5):**
$$\text{PAQ}_{\text{valence}} = -8.88 + 1.19 \cdot \text{CA}_{\text{valence}} \quad (R^2_{\text{adj}} = 0.87, \text{Study 1})$$
$$\text{PAQ}_{\text{valence}} = -5.85 + 1.18 \cdot \text{CA}_{\text{valence}} \quad (R^2_{\text{adj}} = 0.71, \text{Study 2})$$
$$\text{PAQ}_{\text{arousal}} = 3.21 + 1.21 \cdot \text{CA}_{\text{arousal}} \quad (R^2_{\text{adj}} = 0.83, \text{Study 1})$$
$$\text{PAQ}_{\text{arousal}} = 12.72 + 0.96 \cdot \text{CA}_{\text{arousal}} \quad (R^2_{\text{adj}} = 0.58, \text{Study 2})$$

## Parameters

| Name | Value | Context | Notes |
|------|-------|---------|-------|
| Valence scale | 0-100 au | Visual analog | 50 = neutral anchor |
| Arousal scale | 0-100 au | Visual analog | Study 1: midpoint = "moderately aroused"; Study 2: left anchor = "not at all" |
| Stimulus duration | 567-1700 ms | Selection criterion | Bursts outside this range discarded |
| Equalized duration | 850 ms | Study 1 only | audioStretch phase-vocoder, pitch-preserving |
| Ambiguity threshold | 97.5th percentile | Between-subject SD | SD > 97.5th percentile of null distribution → ambiguous |
| Unambiguous threshold | 2.5th percentile | Between-subject SD | SD < 2.5th percentile of null distribution → unambiguous |
| Consistent rating proportion | 89% (Study 1), 83% (Study 2) | Cross-condition valence polarity | Stimuli rated same polarity (pleasant/unpleasant) across CA and PAQ |
| Opposite valence proportion | 11% (Study 1), 17% (Study 2) | Cross-condition disagreement | Stimuli rated opposite polarity across CA and PAQ |

## Figures of Interest

- **Fig 1 (page 8):** V-shaped vs linear fits for valence-arousal relationship across both studies and conditions. Quadratic AdjR² = 0.38 (Study 1 CA) vs Linear AdjR² = 0.17. Clear visual demonstration of the V-shape.
- **Fig 2 (page 9):** Adjusted R² distributions after equating emotion categories via random sampling (1000 iterations). V-shaped fit consistently better than linear across all conditions.
- **Fig 3 (page 10):** Cross-study reproducibility. Valence ratings: AdjR² = 0.58 (CA), 0.74 (PAQ). Arousal ratings: AdjR² = 0.32 (CA), 0.57 (PAQ). PAQ ratings more reproducible.
- **Fig 4 (page 11):** Mixed-effects model results (Poisson, log link). Observed vs fitted arousal for CA and PAQ conditions.
- **Fig 5 (page 12):** Linear relationship between CA and PAQ ratings. Slopes ~1.19 for valence, ~1.21 for arousal — PAQ consistently more extreme.
- **Fig 6 (page 13):** Distributions of CA-PAQ differences by stimulus type. Arousal significantly higher in PAQ (z = -26.6 Study 1, z = -23.6 Study 2). Unpleasant stimuli show larger arousal and pleasantness differences.

## Results Summary

### V-Shape Confirmation
- Quadratic model significantly outperforms linear model in both studies and conditions
- Effect holds after equating number of exemplars per emotion category (random resampling, 1000 iterations)
- Mixed-effects models confirm: likelihood ratio test p < 0.001 for quadratic over linear in all conditions
- CA: AdjR² = 0.683 (quadratic) vs 0.679 (linear); PAQ: AdjR² = 0.643 vs 0.636 — significant via LRT despite small R² differences

### CA vs PAQ Differences
- PAQ valence scores explained 74% variance in CA valence (Study 1); 58% in CA (Study 2)
- PAQ ratings are more extreme (slope > 1), more consistent between participants (lower CV), and more reproducible across studies
- Arousal significantly higher in PAQ than CA across both studies
- CA valence scores closer to neutral compared to PAQ

### Ambiguity and V-Shape Violations
- Ambiguous stimuli (high between-participant valence SD) have significantly greater fitting errors to the V-shape (Wilcoxon p < 0.001)
- Ambiguous vocal bursts rated as more arousing than unambiguous ones (p < 0.001 in both studies)
- Ambiguity significantly predicts arousal in mixed-effects model (CA: t = 4.820, p < 0.001; PAQ: t = 3.958, p < 0.001)
- No significant ambiguity × |valence| interaction — ambiguity effect is additive, not multiplicative

## Limitations

- Both studies used Italian speakers only — generalizability to other cultures unknown
- Study 1 participants were graduate students from a local university (homogeneous sample)
- Studies conducted remotely (MATLAB executable or Qualtrics) — limited control over environment
- Some stimuli were acted, others spontaneous — ecological validity concerns
- Study 1 modified temporal structure (850ms equalization) which could affect perception, though only 6% detected as modified
- Poisson distribution used for arousal modeling; zero-one-inflated Beta might have been more appropriate (though adjusted R² values were large and Q-Q plots showed no substantial departure)

## Testable Properties

- Arousal ratings for vocal bursts should follow a quadratic (V-shaped) function of valence, with minimum arousal near neutral valence (50 on 0-100 scale)
- The quadratic model should explain more variance than a linear model for the valence-arousal relationship in vocal bursts
- PAQ ratings should be systematically more extreme than CA ratings (regression slope > 1.0)
- PAQ ratings should show lower between-participant coefficient of variation than CA ratings
- Stimuli with high between-participant variance in valence (ambiguous) should have higher arousal ratings than stimuli with low variance (unambiguous)
- Ambiguous stimuli should show larger residuals from the quadratic valence-arousal fit
- At least 80% of vocal bursts should receive consistent valence polarity (positive/negative) across CA and PAQ conditions

## Relevance to Project

This paper provides empirical constraints for modeling the emotional dimensions of nonlinguistic vocalizations. For a synthesizer generating vocal bursts or emotionally expressive speech, the V-shaped valence-arousal mapping means that extreme emotional states (highly positive or highly negative) should both produce high-arousal acoustic features, not just negative ones. The CA/PAQ distinction and ambiguity findings are relevant for understanding how listeners interpret synthetic vocal expressions — the same acoustic signal may evoke different subjective and attributive responses.

## Open Questions

- [ ] What specific acoustic features of vocal bursts drive the V-shape? (Paper does not analyze acoustics)
- [ ] Does the V-shape hold cross-culturally for vocal bursts?
- [ ] What acoustic parameters differentiate ambiguous from unambiguous vocal bursts?
- [ ] How does the V-shape interact with discrete emotion categories at the acoustic level?

## Related Work Worth Reading

- Cowen, A. S., Elfenbein, H. A., Laukka, P., & Keltner, D. (2019). Mapping 24 emotions conveyed by brief human vocalization. *American Psychologist, 74*(6), 698-712. — Source of 1,607 stimuli; foundational taxonomy of vocal burst emotions
- Brainerd, C. J. (2018). The emotional-ambiguity hypothesis: A large-scale test. *Psychological Science, 29*(10), 1706-1715. — Tests ambiguity as predictor of arousal across large dataset
- Kuppens, P., Tuerlinckx, F., Russell, J. A., & Barrett, L. F. (2013). The relation between valence and arousal in subjective experience. *Psychological Bulletin, 139*(4), 917-940. — Systematic review of V-shaped relation across modalities
- Russell, J. A. (1980). A circumplex model of affect. *Journal of Personality and Social Psychology, 39*(6), 1161-1178. — Foundational circumplex model that this paper tests
- Holz, N., Larrouy-Maestri, P., & Poeppel, D. (2021). The paradoxical role of emotional intensity in the perception of vocal affect. *Scientific Reports, 11*(1), 9663. — Intensity-arousal paradox in vocal emotion perception

## Collection Cross-References

### Already in Collection
- [[Banse_1996_VocalEmotionAcousticProfiles]] — cited as foundational work on acoustic profiles for vocal emotion expression; provides the 29-parameter acoustic correlates that Grollero's perceptual V-shape model lacks

### Cited By (in Collection)
- (none found)

### New Leads (Not Yet in Collection)
- Cowen et al. (2019) — "Mapping 24 emotions conveyed by brief human vocalization" — source of 1,607/2,032 stimuli used in this study; foundational taxonomy of vocal burst emotions with dimensional ratings
- Kuppens et al. (2013) — "The relation between valence and arousal in subjective experience" — systematic review establishing the V-shaped valence-arousal relationship across modalities
- Brainerd (2018) — "The emotional-ambiguity hypothesis: A large-scale test" — tests ambiguity as predictor of arousal decoupling; directly relevant to the ambiguity findings in this paper
- Holz et al. (2021) — "The paradoxical role of emotional intensity in the perception of vocal affect" — intensity-arousal paradox in vocal emotion that may interact with the V-shape

### Conceptual Links (not citation-based)
**Vocal emotion acoustic structure:**
- [[Belyk_2014_AcousticValenceEmotion]] — Belyk's finding that valence encoding in vocal exclamations is family-specific (motivational vs moral vs aesthetic emotions use different pitch-loudness rules) provides a potential acoustic mechanism for Grollero's V-shape: the V-shape may emerge because high-arousal positive and negative emotions recruit different acoustic strategies that converge on similar arousal ratings but differ in spectral and F0 details
- [[Goudbeek_2010_ValencePotencyVocalEmotion]] — Goudbeek demonstrates that arousal dominates vocal expression (R^2=0.82) while valence is secondary (R^2=0.22-0.49), encoded primarily in spectral slope and intensity variability. This is consistent with Grollero's finding that the V-shape (arousal as a function of valence) explains only moderate variance — arousal may be the primary vocal dimension, with valence modulating it nonlinearly
- [[Scherer_2001_VocalEmotionCrossCultural]] — Scherer's cross-cultural findings (66% recognition accuracy, correlated confusion patterns) address Grollero's open question about whether the V-shape holds across cultures: the universal recognition of arousal-related emotions suggests the V-shape's arousal component may be robust, but the cultural specificity of valence judgments remains untested for vocal bursts
- [[Mozziconacci_1998_SpeechEmotionProsody]] — Mozziconacci's finding that the most recognizable emotions (joy 87.5%, boredom 82.5%) have the most extreme arousal-correlated prosodic parameters (speech rate, pitch level) aligns with Grollero's V-shape model where extreme valence maps to high arousal. (Moderate)
- [[Weninger_2013_AcousticsEmotionAudio]] — Moderate. Weninger examines cross-domain arousal/valence recognition including environmental sounds (a domain that overlaps with vocal bursts). Their finding that arousal features generalize across domains while valence features are domain-specific aligns with Grollero's V-shape model where arousal is the dominant dimension.
