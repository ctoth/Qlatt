# Perception of Vocal Attractiveness by Mandarin Native Listeners

**Authors:** Anqi Xu, Albert Lee
**Year:** 2018
**Venue:** 9th International Conference on Speech Prosody, Poznan, Poland
**DOI:** 10.21437/SpeechProsody.2018-70

## One-Sentence Summary
Mandarin native listeners prefer breathy and modal male voices with low f0, narrow formant spacing, and normal pitch range, while for female voices they prefer breathy quality with moderately spaced formants and normal pitch range -- partially replicating but also diverging from Western studies.

## Problem Addressed
Most vocal attractiveness research has been conducted on Western English-speaking populations. This study tests whether Mandarin native listeners show similar preferences or language/culture-specific divergences, especially for voice quality (adding creaky voice as a condition).

## Key Contributions
- First study of vocal attractiveness with creaky voice parameter using Mandarin listeners
- Uses VocalTractLab articulatory synthesis for ecologically valid stimuli
- Tests four voice qualities: breathy, modal, creaky, pressed
- Manipulates f0, formant dispersion, and pitch range independently
- Cross-cultural comparison with Western findings

## Methodology
- Synthetic Mandarin sentence generated via VocalTractLab 2.1
- Four voice qualities with acoustic parameters verified (Table 1)
- Three f0 levels (+2 semitone, 0, -2 semitone from medium)
- Three formant dispersion levels (x1.1, x1, x0.9)
- Three pitch range levels (x2, x1, x0.25)
- 108 stimuli per gender (4 x 3 x 3 x 3), rated by 32 Mandarin listeners (16F, 16M)
- 1-5 Likert attractiveness scale
- Linear mixed-effects models in R

## Parameters

| Voice Quality | H1-H2* | H1-A1* | H1-A3* | Center of Gravity | Jitter (%) | Shimmer (%) | HNR |
|---|---|---|---|---|---|---|---|
| Breathy | -0.5 | -0.5 | 23.7 | 402.8 | 0.8 | 5.2 | 17.8 |
| Modal | -1.3 | -2.3 | 12.0 | 540.8 | 0.6 | 6.6 | 15.2 |
| Creaky | -1.4 | -2.2 | 12.2 | 536.4 | 1.2 | 6.1 | 15.5 |
| Pressed | -3.5 | -4.6 | 6.9 | 652.0 | 1.0 | 9.4 | 14.0 |

| Body Size Projection | Voice Quality | Pitch Shift | Formant Shift | Pitch Range Shift |
|---|---|---|---|---|
| Small | Breathy | +2 semitone | x1.1 | x2 |
| Medium | Modal | 0 | x1 | x1 |
| Large | Creaky/Pressed | -2 semitone | x0.9 | x0.25 |

## Results Summary

### Male voices rated by female listeners:
- Voice quality: significant (chi2=17.306, df=3, p<.001); breathy (p=.013) and modal (p=.010) rated more attractive than pressed
- f0: significant (chi2=8.33, df=2, p=.015); low f0 preferred
- Formant dispersion: significant (chi2=530.79, df=2, p<.001); narrowly distributed formants preferred
- Pitch range: significant (chi2=496.55, df=2, p<.001); narrow range significantly worse than normal and wide

### Female voices rated by male listeners:
- Voice quality: significant (chi2=69.519, df=3, p<.001); breathy preferred over creaky and pressed (p<.001); modal preferred over creaky (p<.001)
- f0: significant (chi2=6.928, df=2, p=.031)
- Formant dispersion: significant (chi2=20.366, df=2, p<.001); widely distributed formants did not benefit; narrowly spaced preferred (p=.016)
- Pitch range: significant (chi2=10.58, df=2, p=.005); narrow range inferior

### Cross-cultural divergences from Western studies:
- Narrow pitch range lowers attractiveness regardless of gender (opposite to some Japanese/tone language studies)
- Narrow formant dispersion preferred for both sexes (similar to Western)
- Creaky voice did NOT benefit attractiveness (consistent with non-US findings)
- Medium f0 for males similar to low f0 (p=.489) -- not a strong preference for very low pitch

## Figures of Interest
- **Fig 1 (page 1):** Band energy profiles of four voice qualities
- **Fig 2 (page 2):** Violin plots of male voice attractiveness by acoustic parameters
- **Fig 3 (page 2):** Violin plots of female voice attractiveness by acoustic parameters

## Limitations
- Synthetic stimuli only (VocalTractLab) -- no natural speech
- Small sample (32 listeners)
- Single sentence in Mandarin
- Formant dispersion manipulation was uniform scaling -- not individual formant control
- Only attractiveness rated; no femininity, dominance, or age ratings

## Testable Properties
- Breathy and modal voice qualities should be rated more attractive than pressed voice
- Narrowly distributed formants should increase attractiveness for both genders
- Narrow pitch range should decrease attractiveness ratings
- For male voices: low f0 should be preferred, but medium f0 should be nearly equivalent

## Relevance to Project
This paper provides cross-cultural data on voice quality preferences, with direct parameter values for four voice quality types using VocalTractLab synthesis. The spectral measurements (H1-H2*, H1-A1*, H1-A3*, HNR, jitter, shimmer) for breathy, modal, creaky, and pressed voice map onto Klatt synthesizer parameters (OQ, TL, AH, DI). The finding that narrow formant spacing and normal pitch range are universally preferred informs voice preset design. The creaky voice results are particularly interesting since creaky phonation is increasingly common in American English but does not enhance attractiveness for Mandarin listeners.

## Open Questions
- [ ] Would the results replicate with natural speech stimuli?
- [ ] How does tone language background affect pitch range preferences?
- [ ] What specific H1-A3* threshold separates attractive from unattractive voice quality?

## Related Work Worth Reading
- Xu, Y., A. Lee, W. Wu, X. Liu and P. Birkholz (2013). Human vocal attractiveness as signaled by body size projection. PLoS ONE 8(4): e62397.
- Gobl, C. & Ni Chasaide, A. (2003). The role of voice quality in communicating emotion, mood and attitude. Already in collection.
