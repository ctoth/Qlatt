---
title: "The Role of Femininity and Averageness of Voice Pitch in Aesthetic Judgments of Women's Voices"
authors: "David R Feinberg, Lisa M DeBruine, Benedict C Jones, David I Perrett"
year: 2008
venue: "Perception, volume 37, pages 615–623"
doi_url: "10.1068/p5514"
---

# The Role of Femininity and Averageness of Voice Pitch in Aesthetic Judgments of Women's Voices

## One-Sentence Summary
Demonstrates that men prefer higher (more feminine) F0 in women's voices over average F0, with a linear pitch–attractiveness relationship (r = 0.341) and preference for +20 Hz pitch shifts even in already-high-pitched voices.

## Problem Addressed
Whether vocal attractiveness in women is driven by averageness of pitch (as seen in faces and music) or by femininity (high pitch). Prior work showed averageness is attractive in faces and non-face objects, but no study had tested whether this extends to voice pitch.

## Key Contributions
- Showed that linear model of pitch–attractiveness fits significantly better than quadratic (averageness) model (AIC: linear 3145.7× more likely)
- Demonstrated that raising F0 by 20 Hz increases attractiveness ratings even for voices already higher than average
- Found sex difference: men prefer raised pitch at all starting levels; women show no preference when starting pitch is already high (~240 Hz)
- Confirmed that PSOLA pitch manipulation preserves formant structure, isolating F0 as the attractiveness cue

## Methodology
**Study 1:** Correlational analysis of 123 women's voices (monophthong vowels /e i ɑ oʊ ʊ/) rated by 10 male raters on 7-point attractiveness scale. Linear vs quadratic regression compared using AIC.

**Study 2:** PSOLA manipulation of F0 (±20 Hz) in 15 voices at three starting pitch levels (low ~200 Hz, average ~220 Hz, high ~240 Hz). Forced-choice paradigm with 342 male and 263 female raters for attractiveness, plus separate rater groups for perceived age and femininity.

## Key Equations

Linear model of pitch–attractiveness:
$$
\text{Attractiveness} = \beta_0 + \beta_1 \cdot F_0
$$
Where: $F_0$ is fundamental frequency in Hz. Linear model: $F_{1,121} = 15.93$, $p < 0.0001$.

Quadratic model:
$$
\text{Attractiveness} = \beta_0 + \beta_1 \cdot F_0 + \beta_2 \cdot F_0^2
$$
Quadratic model: $F_{2,120} = 8.99$, $p < 0.0001$. But AIC difference = 16.11 in favour of linear; linear model 3145.7× more likely.

## Parameters

| Name | Symbol | Units | Default | Range | Notes |
|------|--------|-------|---------|-------|-------|
| Female F0 (sample) | F0 | Hz | 207.82 | 170.20–273.21 | SD = 20.52; lower than Childers & Wu 1991 (~220 Hz) |
| Pitch manipulation | ΔF0 | Hz | ±20 | — | Applied via PSOLA |
| Low starting pitch | F0_low | Hz | ~200 | — | 5 speakers |
| Average starting pitch | F0_avg | Hz | ~220 | — | 5 speakers; matches Childers & Wu 1991 |
| High starting pitch | F0_high | Hz | ~241 | — | 5 speakers |
| Lowered pitch (low group) | — | Hz | 180 | SD = 1.40 | After −20 Hz manipulation |
| Raised pitch (low group) | — | Hz | 220 | SD = 1.40 | After +20 Hz manipulation |
| Lowered pitch (avg group) | — | Hz | 200 | SD = 0.26 | After −20 Hz manipulation |
| Raised pitch (avg group) | — | Hz | 240 | SD = 0.26 | After +20 Hz manipulation |
| Lowered pitch (high group) | — | Hz | 221 | SD = 0.95 | After −20 Hz manipulation |
| Raised pitch (high group) | — | Hz | 261 | SD = 0.95 | After +20 Hz manipulation |
| Attractiveness–pitch correlation | r | — | 0.341 | — | N = 123, p < 0.0001 |
| Stimulus duration | — | ms | 500 | — | Normalised via PSOLA |
| Stimulus amplitude | — | dB SPL | 87.5 | — | RMS normalised |
| Recording sample rate | — | kHz | 44.1 | — | 16-bit quantisation |
| Analysis sample rate | — | kHz | 11.025 | — | For increased frequency resolution |

### Formant Frequencies (Table 3, unmanipulated voices)

| Formant | Low pitch group | Average pitch group | High pitch group |
|---------|----------------|-------------------|-----------------|
| F1 | 584 (99.7) | 530 (66.2) | 534 (65.5) |
| F2 | 1725 (219.8) | 1773 (86.1) | 1840 (109.4) |
| F3 | 2848 (81.6) | 2937 (207.4) | 3004 (100.8) |
| F4 | 4008 (246.8) | 4067 (162.2) | 4122 (20.9) |
| Fdisp | 1141 (64.1) | 1179 (48.9) | 1196 (26.2) |

Fdisp = [(F4−F3) + (F3−F2) + (F2−F1)] / 3 (Fitch 1997)

## Implementation Details
- PSOLA (Pitch-Synchronous Overlap Add) used to manipulate F0 independently of formant frequencies
- Formant frequencies confirmed invariant across manipulation (all F < 1.659, p > 0.230)
- Vowels used: /e i ɑ oʊ ʊ/ (monophthongs only)
- Playback order: /ɑ i e oʊ ʊ/ (fixed per speaker, randomised across speakers)

## Figures of Interest
- **Fig 1 (page 3):** Scatter plot of F0 vs attractiveness with linear and quadratic fits overlaid. Linear clearly dominates.
- **Fig 2 (page 5):** Spectrograms of "ee" vowel at 220 Hz starting F0, showing ±20 Hz manipulation. Harmonic spacing clearly differs.
- **Fig 3 (page 7):** Bar chart of % raised-pitch chosen across starting pitch groups × attribution type. Shows diminishing returns of pitch raising at higher starting pitches for attractiveness but not for age.

## Results Summary
- **Study 1:** Positive linear correlation between F0 and attractiveness (r = 0.341, p < 0.0001). Linear model 3145.7× more likely than quadratic by AIC.
- **Study 2 (men):** Preferred raised pitch at all starting levels (low: t₃₄₁ = 18.34; avg: t₃₄₂ = 16.27; high: t₃₃₉ = 8.54; all p < 0.0001). Effect size decreased with increasing starting pitch.
- **Study 2 (women):** Preferred raised pitch at low (t₂₅₄ = 11.43, p < 0.0001) and average (t₂₅₄ = 7.83, p < 0.0001) but NOT high starting pitch (t₂₅₅ = 0.99, p = 0.324).
- Men more affected by pitch manipulation than women at all starting levels (all t > 2.63, p < 0.01).

## Limitations
- Sample mean F0 (207.82 Hz) is ~13 Hz lower than Childers & Wu 1991 reference (220 Hz); may reflect population or methodological differences
- Only monophthong vowels tested, not connected speech
- PSOLA preserves formants but may introduce subtle artifacts at large shifts
- No acoustic analysis beyond F0 and F1–F4 (e.g., no jitter, shimmer, HNR, or spectral tilt measures)
- Web-based ratings for Study 2 (though validated against lab-based)

## Testable Properties
- F0–attractiveness relationship should be monotonically increasing (linear, not inverted-U)
- ±20 Hz PSOLA shift should not significantly alter F1–F4 or formant dispersion
- Effect of +20 Hz on attractiveness should be larger for low-F0 voices than high-F0 voices (diminishing returns)
- Female raters should show weaker pitch preference than male raters, especially at high starting F0

## Relevance to Project
Provides empirical F0 targets for an attractive female voice preset: higher is better, with diminishing returns above ~240 Hz. The linear pitch–attractiveness relationship means the synthesizer's female voice presets should target F0 well above the population average (~220 Hz), perhaps 240–260 Hz range. Also confirms that formant structure (F1–F4) is independent of F0 manipulation, validating the Klatt synthesizer's separate control of source and filter.

## Open Questions
- [ ] Is there a ceiling for pitch preference in men? (paper suggests >261 Hz was still preferred, but didn't test higher)
- [ ] Does the linear pitch–attractiveness relationship hold for connected speech or only isolated vowels?
- [ ] How does this interact with other voice quality parameters (breathiness, jitter, spectral tilt)? [Partially addressed by Feinberg_2011_IntegratingF0FormantPreferences — shows F0 × formant frequency interaction via cue amplification; breathiness/jitter not tested]

## Related Work Worth Reading
- Collins & Missing 2003 — vocal and visual attractiveness correlation in women
- Feinberg et al 2005b — F0 and formant frequency manipulation effects on male voice attractiveness
- Childers & Wu 1991 — gender recognition from speech (reference F0 values)
- Abitbol et al 1999 — sex hormones and female voice
- Feinberg et al 2005a — voice and face as quality ornament

## Collection Cross-References

### Already in Collection
- [[Collins_2003_VocalVisualAttractiveness]] — cited for positive correlation between voice pitch and attractiveness in unmanipulated voices; this paper extends those findings with manipulation experiments
- [[Childers_Lee_1991_VoiceQualityFactors]] — cited for reference female F0 value of ~220 Hz used as "average" baseline

### New Leads (Not Yet in Collection)
- Feinberg et al (2005b) — "Manipulations of fundamental and formant frequencies influence the attractiveness of human male voices" — relevant for male voice preset design
- Abitbol et al (1999) — "Sex hormones and the female voice" — hormonal basis for F0 variation
- Fitch (1997) — formant dispersion measure (Fdisp) used here, relevant for vocal tract length estimation

### Cited By (in Collection)
- [[Babel_2014_VocalAttractiveness]] — cites this for F0 manipulation and attractiveness findings
- [[Belin_2017_SoundOfTrustworthiness]] — cites this in trustworthiness-voice quality context
- [[Feinberg_2011_IntegratingF0FormantPreferences]] — extends this work by showing F0 and formant preferences interact (cue amplification), not independent as treated here
- [[Krumpholz_2022_PitchManipulationFemaleRatings]] — cites this for prior finding that higher pitch = more attractive; Krumpholz's null attractiveness result with ~20 Hz PSOLA manipulation using naturalistic sentences challenges the linear relationship at small effect sizes

### Supersedes or Recontextualizes
- [[Collins_2003_VocalVisualAttractiveness]] — Feinberg 2008 extends Collins 2003 by showing pitch alone (via PSOLA manipulation) drives attractiveness, not just correlated vocal qualities

**See also:** Chen_2022_AcousticMasculinityFemininity — quantifies F0 mean as 23.8% (females) and 43.5% (males) of perceived masculinity/femininity importance using hierarchical clustering on 23 acoustic measures, providing weighted importance context for Feinberg's F0 manipulation findings
