---
title: "The Effects of Pitch Manipulation on Male Ratings of Female Speakers and Their Voices"
authors: "Christina Krumpholz, Cliodhna Quigley, Karsan Ameen, Christoph Reuter, Leonida Fusani, Helmut Leder"
year: 2022
venue: "Frontiers in Psychology, 13:911854"
doi_url: "10.3389/fpsyg.2022.911854"
---

# The Effects of Pitch Manipulation on Male Ratings of Female Speakers and Their Voices

## One-Sentence Summary
Increasing female voice pitch by ~20 Hz via PSOLA increases perceived femininity and decreases perceived age, but does not significantly affect perceived attractiveness or health in naturalistic audio or audiovisual conditions.

## Problem Addressed
While prior studies using vowels or non-speech stimuli found higher female voice pitch increases attractiveness, this study tests whether the effect holds with naturalistic spoken sentences and synchronized audiovisual stimuli.

## Key Contributions
- Uses naturalistic speech stimuli (full sentences) rather than isolated vowels
- Tests cross-modal effects: does voice pitch manipulation affect face ratings?
- F0 manipulation of ~20 Hz (0.5 ERB) using PSOLA in Praat
- Original female voice F0 range: 171-267 Hz
- N=104 male raters (within-subject design across two sessions)

## Methodology
- 20 female speakers (ages 18-45) from Vienna Talking Faces database
- Two German sentences recorded as audio and synchronized video
- Voice pitch increased by 0.5 ERB (~20 Hz) via PSOLA
- Audio block (voice only) and audiovisual block (synchronized video)
- 7-point Likert scales for attractiveness, femininity, health, age (years)
- Linear mixed models with random intercepts and slopes

## Parameters

| Variable | Original (M, SD) | Increased Pitch (M, SD) | p |
|----------|------------------|-------------------------|---|
| Voice Attractiveness | 3.89, 0.68 | 4.00, 0.73 | 0.128 (n.s.) |
| Voice Femininity | 5.00, 0.65 | 5.16, 0.67 | 0.002** |
| Voice Health | 5.03, 0.69 | 4.98, 0.69 | 0.271 (n.s.) |
| Voice Age (years) | 27.20, 3.11 | 25.20, 2.74 | <0.001*** |
| Face Attractiveness | 3.50, 0.72 | 3.47, 0.72 | 0.442 (n.s.) |
| Face Femininity | 4.54, 0.75 | 4.58, 0.75 | 0.422 (n.s.) |
| Face Health | 4.43, 0.75 | 4.41, 0.71 | 0.699 (n.s.) |
| Face Age (years) | 27.20, 2.29 | 26.70, 2.31 | 0.007** |

## Results Summary
- Audio block: Increased pitch significantly increased femininity ratings (beta=0.159, p=0.002) and decreased perceived age (beta=-1.982, p<0.001)
- Audio block: No significant effect on attractiveness (beta=0.113, p=0.128) or health (beta=-0.048, p=0.271)
- Audiovisual block: Increased pitch decreased perceived face age (beta=-0.5, p=0.007) but did not affect face attractiveness, femininity, or health
- Cross-modal effect limited to age perception only
- Pitch discrimination task: participants could discriminate original vs increased (S=100, p<0.001) but none reported noticing manipulation

## Figures of Interest
- **Fig 1 (page 5):** Experimental design showing within-subject two-session protocol
- **Fig 3 (page 8):** Rating difference distributions for increased vs original pitch across all four variables
- **Fig 4 (page 9):** LMM results for audio block showing voice pitch effects
- **Table 4 (page 9):** Complete LMM estimates for voice ratings
- **Table 5 (page 9):** Complete LMM estimates for face ratings

## Limitations
- Modest pitch manipulation (~20 Hz) may have been too small for attractiveness effects
- Most speakers had F0 between 200-240 Hz, the range where prior studies found smallest attractiveness effects
- Within-subject design may reduce sensitivity compared to between-subjects
- Only heterosexual/bisexual male raters tested
- Austrian German speakers only

## Testable Properties
- A 20 Hz increase in female F0 should reliably increase femininity ratings
- A 20 Hz increase in female F0 should reliably decrease perceived age by ~2 years
- Voice pitch effects on attractiveness are not reliably detectable at 20 Hz increments for speakers already in the 200-240 Hz range
- Cross-modal pitch effects on face perception are limited to age, not attractiveness

## Relevance to Project
This paper provides evidence that voice pitch manipulation has asymmetric effects on social perception: femininity and age perception are pitch-sensitive, but attractiveness is not, at least for the modest manipulation levels typical of natural variation. For Qlatt voice preset design, this means F0 adjustments of ~20 Hz will change perceived femininity and age without necessarily changing attractiveness. The paper's use of PSOLA with 0.5 ERB shifts provides a reference methodology for perceptual pitch experiments with Qlatt output.

## Open Questions
- [ ] Would larger pitch manipulations (e.g., 40+ Hz) produce attractiveness effects?
- [ ] Do the null attractiveness results replicate with non-European listeners?
- [ ] How do breathiness and formant dispersion interact with pitch for attractiveness?

## Collection Cross-References

### Already in Collection
- [[Collins_2003_VocalVisualAttractiveness]] — cited for positive correlation between voice pitch and attractiveness in unmanipulated voices
- [[Feinberg_2008_FemininityAveragenessVoicePitch]] — cited as key prior finding that higher female pitch increases attractiveness; this paper's null attractiveness result at 20 Hz manipulation challenges Feinberg's linear relationship at small effect sizes

### Cited By (in Collection)
- (none found)

### Conceptual Links (not citation-based)
- [[Borkowska_2011_F0DominanceAttractiveness]] — **Strong.** Borkowska found an inverted-U relationship between F0 and female attractiveness peaking at ~280 Hz. Krumpholz's null attractiveness result with ~20 Hz increase (speakers mostly at 200-240 Hz) is consistent with a plateau in the 200-260 Hz range before the peak. Together they suggest attractiveness sensitivity to F0 is nonlinear and region-dependent.
- [[Liu_2011_FemaleVoiceAttractiveness]] — **Moderate.** Liu found no significant difference between original and raised (+2 st) female pitch for attractiveness, consistent with Krumpholz's null result at 0.5 ERB. Both papers converge on the finding that modest upward pitch shifts do not reliably increase attractiveness.
- [[Schild_2019_AttractiveVoiceFormantF0]] — **Moderate.** Schild tests whether F0 or broader voice quality better predicts attractiveness; Krumpholz's null F0-attractiveness result with naturalistic speech supports Schild's hypothesis that voice quality measures beyond F0 are needed to predict attractiveness.
- [[Feinberg_2011_IntegratingF0FormantPreferences]] — **Moderate.** Feinberg 2011 shows F0 and formant preferences interact (cue amplification); Krumpholz manipulated only F0 without formants, which may explain the null attractiveness result if coherent size cues are needed.
- [[Cumbers_2013_PerceptualCorrelatesVocalVariability]] — **Moderate.** Cumbers shows pitch variability (SdF0) is the strongest correlate of perceived vocal variability; Krumpholz's manipulation of mean F0 affected femininity/age perception but not attractiveness, suggesting mean pitch and pitch variability serve different perceptual functions.

## Related Work Worth Reading
- Collins, S. A. & Missing, C. (2003). Vocal and visual attractiveness are related in women. Already in collection.
- Feinberg, D. R. et al. (2008). The role of femininity and averageness of voice pitch in aesthetic judgments of women's voices.
- Mook and Mitchel (2019). Cross-modal effects of voice pitch manipulation.
