# Ratings of Voice Attractiveness Predict Sexual Behavior and Body Configuration

**Authors:** Susan M. Hughes, Franco Dispenza, Gordon G. Gallup Jr.
**Year:** 2004
**Venue:** Evolution and Human Behavior, 25, 295-304
**DOI:** 10.1016/j.evolhumbehav.2004.06.001

## One-Sentence Summary
Demonstrates that opposite-sex ratings of voice attractiveness correlate with sexually dimorphic body ratios (SHR in males, WHR in females) and predict multiple measures of sexual behavior, supporting voice as a multidimensional fitness indicator.

## Problem Addressed
Whether the sound of a person's voice conveys reliable information about body configuration (sexually dimorphic traits shaped by sex hormones) and mating-related behaviors, given that the same hormones (testosterone, estrogen) influence both vocal development and body morphology during puberty.

## Key Contributions
- First empirical demonstration that voice attractiveness ratings predict sexually dimorphic body configuration (male SHR r=.503, female WHR r=-.376)
- First empirical evidence (beyond anecdotal) linking voice attractiveness to sexual behavior patterns (age of first sex, number of partners, EPC)
- Showed that BMI is not related to voice attractiveness, ruling out body mass as a confound — the relationship is driven by WHR/SHR specifically
- Demonstrated sex-asymmetric predictive strength: voice attractiveness is a better predictor of female sexual behavior than WHR, while SHR is a better predictor than voice for males

## Methodology
- 149 undergraduates (77F, 72M), final sample 76F and 70M after exclusions
- Voice recordings: counting 1-10 at ~1 numeral/sec, unidirectional mic (Andrea NC-8) ~1 inch from mouth, quiet room
- 12 +/- 2 raters per voice on 5-point attractiveness scale (1=very unattractive to 5=very attractive), balanced by rater sex
- Interrater reliability: Cronbach alpha r=.651, Kendall W=.315 (both p<.01)
- Body measurements: shoulder, waist, hip circumference to nearest 0.5cm with anthropometric tape; remeasurement reliability r>.995
- Sexual behavior questionnaire (subset: 34F, 43M): age of first masturbation, age of first sex, number of partners, EPC partners, times chosen as EPC partner
- Analysis: Pearson correlations, partial correlations controlling for BMI

## Key Equations

No formal equations. The key quantitative relationships are correlational:

**Males (opposite-sex voice attractiveness):**
- SHR: $r = .503$, $p < .01$ (partial $r = .467$ controlling for WHR/BMI)
- Age of first sex: $r = -.410$, $p < .05$
- Number of sex partners: $r = .359$, $p < .05$
- Number of EPC partners: $r = .400$, $p < .01$
- Times chosen as EPC partner: $r = .317$, $p < .05$

**Females (opposite-sex voice attractiveness):**
- WHR: $r = -.376$, $p < .01$ (partial $r = -.375$ controlling for SHR/BMI)
- Age of first sex: $r = -.397$, $p < .05$
- Number of sex partners: $r = .491$, $p < .01$
- Number of EPC partners: $r = .374$, $p < .05$
- Times chosen as EPC partner: $r = .353$, $p < .05$

## Parameters

| Name | Symbol | Units | Default | Range | Notes |
|------|--------|-------|---------|-------|-------|
| Male SHR | SHR | ratio | M=1.15 | 1.01-1.47 | SD=0.076 |
| Female SHR | SHR | ratio | M=1.04 | 0.84-1.19 | SD=0.075 |
| Male WHR | WHR | ratio | M=0.86 | 0.74-1.18 | SD=0.75 |
| Female WHR | WHR | ratio | M=0.78 | 0.64-0.97 | SD=0.61 |
| Male BMI | BMI | kg/m^2 | M=25.35 | - | SD=4.06 |
| Female BMI | BMI | kg/m^2 | M=23.87 | - | SD=4.24 |
| Voice attractiveness scale | - | points | - | 1-5 | 5-point Likert |

### Sexual Behavior Descriptive Statistics

| Measure | Males (n) | Male Mean | Male SD | Females (n) | Female Mean | Female SD |
|---------|-----------|-----------|---------|-------------|-------------|-----------|
| Age first masturbation | 36 | 13.16 | 1.78 | 17 | 13.82 | 2.98 |
| Age first sex | 34 | 16.94 | 1.37 | 28 | 16.82 | 1.68 |
| Number of sex partners | 43 | 4.44 | 6.61 | 34 | 2.94 | 2.95 |
| Number of EPC partners | 43 | 0.53 | 1.22 | 34 | 0.23 | 0.55 |
| Times chosen as EPC partner | 43 | 0.19 | 0.045 | 34 | 0.21 | 0.48 |

## Implementation Details
- Voice stimuli: neutral content (counting 1-10), one numeral per second, first-trial recording
- Exclusion criteria: chronic smokers (>1 pack/week), non-native English, obvious accents, cold/illness, broken nose, throat/larynx surgery, hearing impairment, auditory surgery
- Raters scored voices blind (no visual contact, no identification of speakers)
- Each voice heard once (unless rater requested second hearing)
- Raters checked for recognition of voices; none recognized
- Body measurements taken by investigator blind to questionnaire responses

## Figures of Interest
- **Table 1 (page 5):** Full correlation matrix for males — voice attractiveness, WHR, SHR, BMI, and all sexual behavior measures
- **Table 2 (page 6):** Full correlation matrix for females — same variables
- **Table 3 (page 7):** Descriptive statistics for sexual behavior measures by sex

## Results Summary
- Voice attractiveness correlates with sexually dimorphic body shape: higher male SHR and lower female WHR predict more attractive voices
- BMI is unrelated to voice attractiveness in both sexes
- Voice attractiveness predicts sexual behavior in both sexes: earlier first sex, more partners, more EPC
- Opposite-sex ratings are better predictors of sexual behavior than same-sex ratings
- For females, voice attractiveness is a stronger predictor of sexual behavior than WHR (r=.491 vs r=-.349 for number of partners)
- For males, SHR is a stronger predictor of sexual behavior than voice (SHR accounts for 28% of variance in promiscuity vs 13% for voice)
- Male SHR accounts for 25% of variance in opposite-sex voice attractiveness; female WHR accounts for 14%

## Limitations
- Correlational design — cannot establish causality
- Self-report sexual behavior data (social desirability bias possible)
- Small subsample for sexual behavior questionnaire (34F, 43M)
- College student sample (limited age range, WEIRD population)
- No acoustic analysis of the voice samples — the specific acoustic features driving attractiveness ratings are unknown
- Voice stimuli limited to counting 1-10 (neutral content only)
- No control for oral contraceptive use in females (which affects vocal characteristics)
- Interrater reliability moderate (Cronbach alpha .651)

## Testable Properties
- Voice attractiveness ratings should be positively correlated with SHR in males (r ~ .5)
- Voice attractiveness ratings should be negatively correlated with WHR in females (r ~ -.37)
- BMI should NOT significantly correlate with voice attractiveness in either sex
- Opposite-sex voice ratings should be better predictors of sexual behavior than same-sex ratings
- The voice-body configuration relationship should persist after controlling for BMI (partial correlations should remain significant)

## Relevance to Project
This paper provides empirical evidence that voice carries reliable information about the speaker's body configuration and reproductive fitness, supporting the design of speaker personality/profile systems that map acoustic parameters to perceived speaker characteristics. The correlations between voice attractiveness and sexually dimorphic body ratios suggest that hormonally driven vocal features (F0, formant frequencies, voice quality) encode biologically meaningful information. For a synthesizer building speaker presets, this supports the idea that coordinated parameter settings (e.g., lower F0 + specific formant patterns for "masculine" voices) should covary with implied body characteristics to sound natural.

## Open Questions
- [ ] Which specific acoustic features of voice drive the attractiveness ratings? (The paper does not analyze this — see Babel 2014, Collins & Missing 2003)
- [ ] Does the voice-body configuration relationship hold for non-WEIRD populations?
- [ ] How do oral contraceptives affect the voice-WHR relationship in females?
- [ ] What is the relative contribution of F0 vs formant structure vs voice quality to these correlations?

## Related Work Worth Reading
- Hughes, Harrison, & Gallup (2002) — voice attractiveness and bilateral symmetry (predecessor study)
- Hughes & Gallup (2003) — SHR/WHR and sexual behavior (body morphology study this paper extends)
- Collins & Missing (2003) — vocal and visual attractiveness are related in women
- Abitbol, Abitbol, & Abitbol (1999) — sex hormones and the female voice (hormonal mechanism)
- Zuckerman & Driver (1989) — the vocal attractiveness stereotype
- Singh (1993) — WHR and female physical attractiveness

## Collection Cross-References

### Already in Collection
- [[Collins_2003_VocalVisualAttractiveness]] — cited for finding that vocal attractiveness was negatively related to female body size; Hughes et al. argue the relationship is driven by WHR variation, not BMI, refining Collins's finding

### Cited By (in Collection)
- [[Balasubramanium_2012_CepstralSexuallyAppealingVoice]] — cites this paper as motivation for investigating acoustic correlates of sexually appealing voices using cepstral measures
- [[Xu_2013_VocalAttractivenessBodySizeProjection]] — cites this paper for the voice-body configuration link; Xu provides the theoretical framework (body size projection) that explains why voice maps onto body morphology
- [[Weiss_2020_VoiceAttractiveness]] — cites Hughes for evolutionary perspective on voice attractiveness; connects to sexual selection and reproductive success
- [[Quene_2021_PitchTempoAttractiveness]] — cites Hughes for evolutionary context linking voice attractiveness to sexual behavior and body morphology

### New Leads (Not Yet in Collection)
- Hughes, Harrison, & Gallup (2002) — "The sound of symmetry: voice as a marker of developmental instability" — predecessor study linking voice attractiveness to bilateral symmetry
- Hughes & Gallup (2003) — "Sex differences in morphological predictors of sexual behavior" — body configuration and sexual behavior data that this paper extends with voice attractiveness
- Abitbol, Abitbol, & Abitbol (1999) — "Sex hormones and the female voice" — hormonal mechanisms linking vocal development to body morphology

### Supersedes or Recontextualizes
- Refines [[Collins_2003_VocalVisualAttractiveness]] by showing that the voice-body relationship is driven by WHR (not BMI), and extends it to males (SHR) and sexual behavior outcomes

### Conceptual Links (not citation-based)
- [[Babel_2014_VocalAttractiveness]] — Babel identifies the specific acoustic features (breathiness, apparent vocal tract size) that predict voice attractiveness ratings, providing the acoustic mechanism for the perceptual ratings Hughes reports. Hughes shows voice attractiveness predicts body configuration; Babel shows which acoustic parameters drive those ratings.
- [[Xu_2013_VocalAttractivenessBodySizeProjection]] — provides the evolutionary "body size projection" framework that explains why voice attractiveness maps onto sexually dimorphic body ratios: voices that project smaller apparent size (higher F0, shorter VTL) are preferred in females, larger apparent size preferred in males
- [[Feinberg_2008_FemininityAveragenessVoicePitch]] — demonstrates that F0 alone drives vocal attractiveness preferences in women (via PSOLA manipulation), providing a candidate acoustic mechanism for the voice-WHR correlation Hughes reports
- [[Puts_2006_DominanceVoicePitch]] — examines F0 and dominance perception in males, complementing Hughes's finding that male voice attractiveness correlates with SHR (a testosterone-mediated trait)
