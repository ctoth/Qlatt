---
title: "Different Vocal Parameters Predict Perceptions of Dominance and Attractiveness"
authors: "Carolyn R. Hodges-Simeon, Steven J. C. Gaulin, David A. Puts"
year: 2010
venue: "Human Nature, Vol. 21, 406-427"
doi_url: "10.1007/s12110-010-9101-5"
---

# Different Vocal Parameters Predict Perceptions of Dominance and Attractiveness

## One-Sentence Summary
Demonstrates that different acoustic parameters predict dominance vs attractiveness in male voices: F0 variation (F0-SD) and content predict physical dominance, while mean F0, F0-SD, Df (formant dispersion), and intensity predict attractiveness, with Df effects modulated by female fertility phase.

## Problem Addressed
Previous studies used standardized/manipulated speech; this study uses natural ecologically valid speech from a dating-game paradigm to examine which vocal parameters independently predict male-male dominance vs female mate-choice attractiveness.

## Key Contributions
- Shows physical dominance predicted by low F0-SD (beta=-.16) and physically dominant content (beta=.62)
- Social dominance predicted only by socially dominant content (beta=.56)
- Short-term attractiveness predicted by low F0 (beta=-.21), high intensity (beta=.25), and attractive content (beta=.25)
- Long-term attractiveness predicted by low F0 (beta=-.21), low Df (beta=-.17), high intensity (beta=.26), and content (beta=.26)
- Df effect on attractiveness only significant for fertile-phase women (beta=-.19)

## Methodology
- 111 male speakers in mock dating-game (control, courtship, competitive recordings)
- 264 total participants (86 male audio raters, 142 female audio raters, 102 content raters)
- 5 acoustic parameters: mean F0, F0-SD (variation), intensity (dB), utterance duration, Df (formant dispersion)
- Multiple regression with VIFs < 1.3 confirming no multicollinearity
- Content rated separately to control for semantic content

## Parameters

### Multiple Regression: Physical Dominance (Table 4, R=0.705, 49.7% variance)

| Predictor | B | SE B | beta |
|-----------|------|------|------|
| F0-SD | -0.47 | .23 | -.16** |
| F0 Mean | -0.13 | .08 | -.14* |
| Df | -0.01 | .01 | -.06 |
| Duration | 0.19 | .15 | .09 |
| Intensity | 0.24 | .22 | .08 |
| Content (physical) | 8.48 | 1.01 | .62**** |

### Multiple Regression: Social Dominance (Table 4, R=0.625, 39% variance)

| Predictor | B | SE B | beta |
|-----------|------|------|------|
| F0-SD | -0.27 | .27 | -.09 |
| F0 Mean | -0.13 | .09 | -.14 |
| Df | -0.01 | .02 | -.06 |
| Duration | -0.04 | .17 | -.02 |
| Intensity | 0.34 | .26 | .11 |
| Content (social) | 10.05 | 1.53 | .56**** |

### Multiple Regression: Short-Term Attractiveness (Table 5, fertile-phase)

| Predictor | B | SE B | beta |
|-----------|------|------|------|
| F0-SD | -0.66 | .45 | -.15 |
| F0 Mean | -0.32 | .12 | -.27*** |
| Df | -0.05 | .02 | -.19** |
| Duration | -0.13 | .16 | -.07 |
| Intensity | 0.89 | .40 | .20** |
| Content | 6.16 | 2.25 | .25*** |

### Multiple Regression: Long-Term Attractiveness (Table 5, fertile-phase)

| Predictor | B | SE B | beta |
|-----------|------|------|------|
| F0-SD | -0.92 | .44 | -.20** |
| F0 Mean | -0.28 | .12 | -.24** |
| Df | -0.04 | .02 | -.17** |
| Duration | 0.12 | .16 | -.05 |
| Intensity | 1.16 | .39 | .27*** |
| Content | 5.27 | 1.86 | .26*** |

### Correlation Matrix (Table 2, competitive recording)

| | Mean F0 | F0-SD | Df | Intensity | Duration |
|--|---------|-------|-----|-----------|----------|
| Physical Dominance | -.18* | -.29*** | .03 | .07 | .18* |
| Social Dominance | -.15 | -.21** | .07 | .19** | .11 |
| Mean F0 | — | .35**** | -.10 | .31*** | -.07 |
| F0-SD | — | — | .03 | .10 | .11 |

## Figures of Interest
- **Tables 2-3 (pages 9-10):** Correlation matrices for competitive and courtship recordings
- **Table 4 (page 11):** Regression models for dominance
- **Table 5 (page 12):** Regression models for attractiveness by menstrual phase

## Results Summary
1. **Physical dominance**: Predicted by low F0-SD and physically dominant content; mean F0 approaches significance
2. **Social dominance**: Predicted only by socially dominant content — no acoustic parameter significant alone
3. **Attractiveness**: Predicted by low mean F0, high intensity, and attractive content across all conditions
4. **Df (formant dispersion)**: Only predicts attractiveness for fertile-phase women — key fertility-dependent effect
5. **F0-SD decreases** from control to courtship recordings when men perceive themselves as more dominant
6. Mean F0 and F0-SD are positively correlated (r=.35) but predict different social outcomes

## Limitations
- Undergraduate sample only
- Mock dating-game paradigm (not real-world)
- Menstrual cycle phase self-reported (not hormone-verified)
- F0-SD operationalized as within-utterance standard deviation (not variation across utterances)
- Only 5 acoustic parameters — no voice quality, spectral tilt, or formant frequency measures

## Testable Properties
- F0-SD must negatively correlate with physical dominance ratings
- Mean F0 must negatively correlate with attractiveness ratings
- Intensity must positively correlate with attractiveness ratings
- Df effect on attractiveness should be stronger for fertile-phase listeners
- F0 and F0-SD should be partially independent (r ~ .35, not ~ 1.0)

## Relevance to Project
For the Qlatt speaker personality system, this paper establishes that dominance and attractiveness are predicted by different vocal parameters, which has implications for voice preset design:
- **Dominant preset**: Lower F0-SD (less pitch variation), potentially lower mean F0
- **Attractive preset**: Lower mean F0, higher intensity, lower Df (formant spacing)
- The dissociation between dominance (F0-SD) and attractiveness (mean F0, intensity, Df) means these are separable voice quality dimensions
- F0 variation (prosodic dynamism) is a key parameter not typically controlled in synthesis rules

## Open Questions
- [ ] How should F0-SD be implemented in Qlatt? As a prosody rule modifying pitch range?
- [ ] Does the Df-fertility interaction suggest we need listener-dependent voice modeling?
- [ ] How does this relate to Borkowska 2011 findings on F0 and dominance/attractiveness?

## Related Work Worth Reading
- Puts et al. (2006) — Dominance and male voice pitch (source data)
- Borkowska & Pawlowski (2011) — F0 and female dominance/attractiveness (next paper)
- Feinberg et al. (2005, 2008) — Pitch manipulation studies (already in collection)

## Collection Cross-References

### Already in Collection
- [[Puts_2006_DominanceVoicePitch]] — cited for the original dating-game paradigm data and dominance-voice pitch analysis that this study extends
- [[Feinberg_2008_FemininityAveragenessVoicePitch]] — cited for pitch manipulation studies on voice attractiveness; this paper complements with natural speech data
- [[Feinberg_2011_IntegratingF0FormantPreferences]] — cited for integrated F0-formant preference models
- [[Collins_2003_VocalVisualAttractiveness]] — cited for vocal and visual attractiveness in women; provides female voice data for comparison
- [[Fitch_1999_VocalTractMorphology]] — cited for vocal tract morphology and formant dispersion (Df) as body size indicator
- [[Scherer_2001_VocalEmotionCrossCultural]] — cited for vocal affect expression model relating acoustic parameters to emotion/personality perception

### Cited By (in Collection)
- [[Borkowska_2011_F0DominanceAttractiveness]] — cites this for male voice F0/dominance/attractiveness showing linear relationships; extends analysis to female voices with nonlinear attractiveness finding
- [[Schild_2019_AttractiveVoiceFormantF0]] — cites Arnocky, Hodges-Simeon et al. (2018) on voice-immunocompetence links
- [[Cartei_2014_VoiceMasculinity]] — cites this for dominance/attractiveness dissociation and voice-mating success
- [[Babel_2014_VocalAttractiveness]] — cites this for different vocal parameters predicting dominance vs attractiveness
- [[Karthikeyan_2023_ArticulatoryStatusAttractiveness]] — cites Hodges-Simeon via Zhang et al. (2021) on pitch lowering and aggressive intent

### New Leads (Not Yet in Collection)
- Bruckert et al. (2006) — "Women use voice parameters to assess men's characteristics" — voice-based mate assessment
- Puts et al. (2007) — "Men's voices as dominance signals" — vocal F0 and formant frequencies as dominance cues

### Conceptual Links (not citation-based)
- [[Borkowska_2011_F0DominanceAttractiveness]] — direct female-voice counterpart: Hodges-Simeon shows low F0 linearly predicts male attractiveness, while Borkowska shows female attractiveness peaks at intermediate F0 (~260 Hz), establishing sex-specific voice-perception mappings
- [[Schild_2019_AttractiveVoiceFormantF0]] — uses PCA to decompose the same set of voice parameters (F0, formants, spectral tilt) into orthogonal components predicting attractiveness; provides a data-driven complement to Hodges-Simeon's regression approach
- [[Liu_2011_FemaleVoiceAttractiveness]] — examines female voice attractiveness through voice quality dimensions (breathiness, size projection) rather than Hodges-Simeon's F0/Df/intensity framework; together they show attractiveness operates through different parameters for male vs female voices
- [[Cumbers_2013_PerceptualCorrelatesVocalVariability]] — examines how F0 variability (which Hodges-Simeon identifies as key dominance predictor F0-SD) relates to personality perception more broadly
