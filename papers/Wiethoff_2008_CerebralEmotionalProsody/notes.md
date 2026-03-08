# Cerebral Processing of Emotional Prosody — Influence of Acoustic Parameters and Arousal

**Authors:** Sarah Wiethoff, Dirk Wildgruber, Benjamin Kreifelts, Hubertus Becker, Cornelia Herbert, Wolfgang Grodd, Thomas Ethofer
**Year:** 2008
**Venue:** NeuroImage 39, 885–893
**DOI:** 10.1016/j.neuroimage.2007.09.028

## One-Sentence Summary

This fMRI study demonstrates that the right mid superior temporal gyrus (STG) responds more strongly to all emotional prosodies (happy, erotic, angry, fearful) than to neutral prosody, and that this effect is explained by the conjoint combination of acoustic parameters (intensity, F0, F0 variability, duration) expressing emotional arousal rather than any single acoustic feature alone.

## Problem Addressed

Prior work showed that right mid STG responds more strongly to emotional than neutral prosody, but it was unclear whether this was driven by a specific acoustic parameter (e.g. intensity or F0), by perceived emotional arousal, or by a combination of features. Matching stimuli for all acoustic parameters would remove the emotional content, so the authors used regression-based variance partitioning instead.

## Key Contributions

- Demonstrated that right mid STG responds significantly more strongly to all four emotional prosody categories (happy, erotic, angry, fearful) compared to neutral, confirming this region as a general emotional prosody detector
- Showed that no single acoustic parameter alone can explain the emotional vs. neutral difference — the effect persists after regressing out any one parameter
- Showed that the conjoint effect of all five acoustic parameters (mean intensity, intensity variability, mean F0, F0 variability, duration) fully explains the emotional > neutral effect — residuals are no longer significant
- Similarly, correcting for perceived emotional arousal alone also abolishes the effect
- Concluded that the brain's enhanced response to emotional prosody is driven by the interplay of multiple acoustic cues that collectively express emotional arousal

## Methodology

- 24 right-handed participants (12F, 12M, mean age 25.1) in passive-listening fMRI
- 50 German words (25 nouns, 25 adjectives) spoken by 6 professional actors in 5 prosodic categories: neutral, happy, erotic, angry, fearful
- Stimuli balanced for arousal across emotional categories (~5.6–5.9 on 9-point SAM) vs. neutral (2.45)
- Acoustic parameters extracted with Praat: mean I, SD of I, mean F0, SD of F0, duration
- Event-related fMRI with 3T scanner, SPM2 analysis
- Simple regression analyses: regress each acoustic parameter or arousal against STG responses, then test whether residuals still show emotional > neutral effect
- Multiple regression: regress all 5 acoustic parameters jointly, test residuals

## Key Equations

No formal equations are presented. The statistical approach is standard regression/ANOVA.

## Parameters

| Name | Symbol | Units | Neutral | Happy | Erotic | Angry | Fearful | Notes |
|------|--------|-------|---------|-------|--------|-------|---------|-------|
| Mean intensity | I | dB | 75 ± 2 | 77 ± 3 | 75 ± 1 | 75 ± 3 | 74 ± 4 | Normalized to same max peak |
| Intensity variability | SD(I)/I | % | 19 ± 1 | 22 ± 2 | 16 ± 1 | 22 ± 4 | 20 ± 3 | |
| Mean F0 | F0 | Hz | 156 ± 19 | 182 ± 20 | 138 ± 13 | 174 ± 27 | 185 ± 16 | |
| F0 variability | SD(F0)/F0 | % | 10 ± 4 | 23 ± 7 | 16 ± 10 | 16 ± 9 | 12 ± 5 | |
| Duration | dur | s | 0.7 ± 0.2 | 0.7 ± 0.2 | 1.2 ± 0.3 | 0.8 ± 0.3 | 0.8 ± 0.3 | |
| Arousal rating | | SAM 1–9 | 2.45 ± 0.45 | 5.65 ± 0.64 | 5.89 ± 0.36 | 5.72 ± 0.47 | 5.60 ± 1.09 | |

### Correlation strengths with right mid STG responses

| Parameter | Mean r | t(23) | p |
|-----------|--------|-------|---|
| Mean intensity | 0.19 | 7.0 | < 0.001 |
| Duration | 0.32 | 8.8 | < 0.001 |
| Mean F0 | 0.10 | 2.8 | < 0.05 |
| F0 variability | 0.09 | 4.1 | < 0.001 |
| Intensity variability | −0.05 | −1.8 | 0.08 (ns) |
| Emotional arousal | 0.14 | 5.6 | < 0.001 |

## Implementation Details

This paper does not provide synthesis algorithms. Its value is as a perceptual ground truth for what acoustic dimensions matter when conveying emotional prosody.

**Key implementation-relevant observations:**
- Happy prosody: highest F0 variability (23%), elevated mean F0, elevated intensity
- Erotic prosody: lowest mean F0 (138 Hz), lowest intensity variability (16%), longest duration (1.2s)
- Angry prosody: elevated F0 and intensity variability
- Fearful prosody: highest mean F0 (185 Hz), relatively low F0 variability
- Neutral: lowest across all dimensions except mean intensity (comparable to emotional)
- No single parameter distinguishes emotional from neutral — it's the combination that matters

## Figures of Interest

- **Fig. 1 (p. 888):** Right mid STG activation map and contrast estimates for all 5 prosodic categories. Shows erotic and happy with strongest responses.
- **Fig. 2 (p. 889):** Brain maps of correlations between hemodynamic responses and each acoustic parameter + arousal. Duration and mean intensity show largest bilateral temporal clusters.
- **Fig. 3 (p. 891):** Scatter plots of right mid STG responses vs. each acoustic parameter and arousal. Shows fairly linear relationships within measured ranges.
- **Table 1 (p. 886):** Acoustic parameter values by emotion category (reproduced above).
- **Table 2 (p. 890):** Full listing of brain regions correlated with each acoustic parameter.

## Results Summary

- Right mid STG (MNI: x=63, y=−12, z=0) responds more strongly to all emotional prosodies vs. neutral (all p < 0.01)
- No repetition suppression effect between two fMRI sessions
- After removing variance from any single acoustic parameter, emotional > neutral effect persists
- After removing variance from all 5 acoustic parameters jointly, emotional > neutral effect disappears (t(23)=0.7, p=0.25)
- After removing variance from arousal alone, emotional > neutral effect disappears (t(23)=0.9, p=0.19)
- Conclusion: emotional arousal is expressed through a combination of acoustic features, and the brain responds to this combination

## Limitations

- Stimuli were acted (professional actors), possibly overexpressing certain cues and missing subtle natural ones
- Acoustic parameters are inter-correlated in natural speech, making regression difficult to fully disambiguate
- Only linear relationships tested — non-linear responses (especially for duration > 1.2s) may be missed
- Passive-listening design lacks behavioral control confirming comprehension
- Continuous fMRI acquisition introduces scanner noise interference with stimuli

## Testable Properties

- Emotional prosody should differ from neutral on multiple acoustic dimensions simultaneously, not just one
- Happy prosody: F0 variability should be highest among emotion categories (~23%)
- Erotic prosody: mean F0 should be lowest (~138 Hz), duration longest (~1.2s)
- Fearful prosody: mean F0 should be highest (~185 Hz)
- Arousal ratings for emotional categories should cluster around 5.5–6.0 on a 9-point scale
- Neutral speech arousal should be markedly lower (~2.5)

## Relevance to Project

This paper provides empirical evidence for which acoustic parameters collectively convey emotional arousal in prosody. For Qlatt's prosody rules, this validates the approach of modifying multiple parameters simultaneously (F0 mean, F0 variability, intensity, duration) when generating emotional speech styles, rather than manipulating a single parameter. The Table 1 parameter values can serve as approximate targets for emotion-specific prosody presets. The finding that erotic prosody uses low F0 but long duration, while fearful prosody uses high F0 but normal duration, highlights that different emotions have qualitatively different acoustic profiles — not just "more or less of everything."

## Open Questions

- [ ] How do these acted-speech parameter values compare to natural emotional speech?
- [ ] What are the non-linear response characteristics for duration > 1.2s?
- [ ] How do spectral tilt and voice quality parameters (not measured here) contribute to the emotional > neutral effect?
- [ ] Would these parameters generalize to languages other than German?

## Collection Cross-References

### Already in Collection
- [[Banse_1996_VocalEmotionAcousticProfiles]] — cited as source for the claim that emotional information is transmitted via acoustic features. Banse & Scherer provide the detailed 14-emotion acoustic profiles that this paper's 5-category fMRI study draws on.

### Cited By (in Collection)
- (none found)

### New Leads (Not Yet in Collection)
- Scherer (2003) — "Vocal communication of emotion: a review of research paradigms" — comprehensive review of how emotional arousal covaries with acoustic features, theoretical framework for the interplay model
- Grandjean et al. (2005) — "The voices of wrath: brain responses to angry prosody in meaningless speech" (Nat. Neurosci.) — key predecessor showing right mid STG sensitivity without semantic content
- Ethofer et al. (2006a) — "Effects of prosodic emotional intensity on associative auditory cortex" — same group's prior work establishing the intensity dimension of emotional prosody processing

### Supersedes or Recontextualizes
- (none)

### Conceptual Links (not citation-based)

**Acoustic correlates of emotion:**
- [[Goudbeek_2010_ValencePotencyVocalEmotion]] — Strong connection. Wiethoff shows that the conjoint effect of F0, intensity, and duration drives emotional prosody perception in the brain. Goudbeek extends this by demonstrating that these parameters primarily encode arousal, while valence requires spectral balance measures (H1-H2, spectral slope) that Wiethoff did not measure. Together they suggest that Wiethoff's "combination of acoustic cues" for arousal is necessary but not sufficient for full emotion discrimination.
- [[Cummings_1995_GlottalExcitationEmotionalSpeech]] — Moderate connection. Wiethoff identifies which suprasegmental parameters (F0, intensity, duration) the brain is sensitive to for emotional prosody, while Cummings provides complementary data on how glottal waveform shape (a source-level parameter not measured by Wiethoff) varies across emotional styles. For synthesis, Cummings' glottal parameters would supplement Wiethoff's prosodic parameter targets.
- [[Weninger_2013_AcousticsEmotionAudio]] — Moderate connection. Weninger confirms cross-domain that loudness (perceptually weighted) is the primary correlate of arousal, converging with Wiethoff's finding that mean intensity correlates most strongly with right mid STG responses (r=0.19). Weninger also shows that valence features are domain-specific and sometimes inversely correlated, which may explain why Wiethoff's arousal-only model fully accounts for the brain response without needing valence-specific parameters.

## Related Work Worth Reading

- Banse & Scherer 1996 — Acoustic profiles for 14 emotions (already in collection as Banse_1996_VocalEmotionAcousticProfiles)
- Scherer 2003 — Review of vocal emotion communication and acoustic correlates
- Grandjean et al. 2005 — Brain responses to angry prosody in meaningless speech
- Ethofer et al. 2006a — Effects of prosodic emotional intensity on auditory cortex
- Lattner et al. 2005 — Voice perception: sex, pitch, and right hemisphere
