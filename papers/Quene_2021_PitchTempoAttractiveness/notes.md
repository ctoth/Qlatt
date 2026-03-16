---
title: "Attractiveness of Male Speakers: Effects of Pitch and Tempo"
authors: "Hugo Quené, Geke Boomsma, Romée van Erning"
year: 2021
venue: "Chapter 9 in B. Weiss et al. (eds.), *Voice Attractiveness*, Prosody, Phonology and Phonetics, Springer"
doi_url: "https://doi.org/10.1007/978-981-15-6627-1_9"
---

# Attractiveness of Male Speakers: Effects of Pitch and Tempo

## One-Sentence Summary
Demonstrates that both increased pitch (+1.5 semitones) and decreased tempo (factor 0.85) independently reduce perceived attractiveness of male speakers by female listeners, with pitch having a larger effect than tempo.

## Problem Addressed
Whether speech tempo, in addition to pitch, affects subjective vocal attractiveness of male speakers as rated by female listeners — a factor relevant to sexual selection.

## Key Contributions
- First study to manipulate both pitch AND tempo simultaneously in sentence-length stimuli
- Shows tempo independently affects attractiveness (slower = less attractive)
- Shows pitch and tempo effects are additive, not interactive
- Demonstrates that only negative deviations (higher pitch, slower tempo) reduce attractiveness — positive deviations (lower pitch, faster tempo) do NOT increase it
- Finds that adding portrait photos introduces a floor effect that complicates voice-only ratings

## Methodology
- 24 male Dutch speakers (age M=18.0, s=0.7), spontaneous monologues
- 150 female heterosexual listeners (age 17-29, median 20)
- Tempo manipulated: factors 0.85, 1.00, 1.15 (using SoX)
- Pitch manipulated: -1.5, 0, +1.5 semitones (using SoX)
- 7-point Likert attractiveness scale
- Cumulative Link Mixed Model (CLMM) analysis
- Two sessions: voice-only (session 1), voice+photo (session 2)

## Parameters

| Name | Symbol | Units | Default | Range | Notes |
|------|--------|-------|---------|-------|-------|
| Male speaker F0 | - | Hz | 116 | s_u=16, s_e=7 | Average across 24 speakers |
| Male speaker syllable duration | - | s | 0.188 | s_u=0.015, s_e=0.026 | Average across 24 speakers |
| Tempo manipulation factors | - | ratio | 1.00 | 0.85, 1.00, 1.15 | ~±1s_e |
| Pitch manipulation | - | semitones | 0 | -1.5, 0, +1.5 | ~±0.5s_u |
| Baseline attractiveness rating | - | 1-7 | 3.30 | SE=0.02 | Unchanged condition |

## Key Results (Table 9.2)

| Tempo\Pitch | Lower | Unchanged | Higher |
|---|---|---|---|
| Slower | 2.78 (0.06) | 2.94 (0.06) | 2.47 (0.05) |
| Unchanged | 3.28 (0.06) | 3.30 (0.02) | 2.55 (0.05) |
| Faster | 3.15 (0.06) | 3.39 (0.06) | 2.55 (0.06) |

## CLMM Fixed Effects (Table 9.3, significant only)

| Condition | Estimate (log odds) | z | p |
|---|---|---|---|
| Slower+Higher (SH) | -1.75 | -8.11 | <0.0001 |
| Slower+Lower (SL) | -0.97 | -4.54 | <0.0001 |
| Unchanged+Higher (UH) | -1.29 | -6.05 | <0.0001 |
| Faster+Higher (FH) | -1.84 | -8.55 | <0.0001 |
| Photo main effect | -1.38 | -8.84 | <0.0001 |

## Implementation Details
- Speech manipulated using SoX (Sound eXchange) version 14-4-1
- All stimuli scaled to -0.5 dB relative to maximum amplitude
- ICC for F0 = 0.82 (most variance between speakers); ICC for duration = 0.25 (most variance within speakers)
- Pitch varies more between speakers; tempo varies more within speakers

## Figures of Interest
- **Table 9.2 (p.7):** Mean attractiveness ratings by condition — clear asymmetry (higher pitch/slower tempo hurt, but lower pitch/faster tempo don't help)
- **Table 9.3 (p.8):** Full CLMM output with all fixed effects, random effects, and interactions

## Results Summary
- Higher pitch: significantly reduces attractiveness (all three tempo conditions)
- Slower tempo: significantly reduces attractiveness (at unchanged and higher pitch)
- Lower pitch: does NOT significantly increase attractiveness
- Faster tempo: does NOT significantly increase attractiveness
- No interaction between pitch and tempo effects
- Photo presence reduces ratings overall (floor effect) but mitigates negative voice effects
- Effect of pitch > effect of tempo

## Limitations
- Only Dutch speakers and listeners
- Only heterosexual female listeners rating male speakers
- Pitch manipulations (~±0.5 s_u) were smaller relative to between-speaker variation than tempo manipulations (~±1 s_e)
- SoX manipulations may introduce artifacts
- Photos may have introduced confounding floor effects

## Testable Properties
- Higher pitch must reduce attractiveness ratings (monotonic for upward direction)
- Slower tempo must reduce attractiveness ratings
- Effects should be asymmetric: negative deviations reduce attractiveness more than positive deviations increase it
- Pitch and tempo effects should be additive (no significant interaction)

## Relevance to Project
Provides empirical constraints for voice parameter selection in TTS: the asymmetric effect (deviations hurt but don't help) means that for a "neutral attractive" male voice, the default F0 and tempo should be at or slightly below/above the population mean respectively. The finding that F0~116 Hz with syllable duration ~188ms represents the Dutch male baseline is consistent with the project's default base-f0 of 110 Hz. The tempo finding suggests that speaking rate should not be slowed below natural baseline for male voices.

## Open Questions
- [ ] Do these effects generalize to non-Dutch, non-Western listeners?
- [ ] Is the asymmetry (only negative deviations matter) universal or culture-specific?
- [ ] How do these attractiveness effects interact with intelligibility?

## Collection Cross-References

### Already in Collection
- [[Collins_2003_VocalVisualAttractiveness]] — cited as Collins 2000; foundational study on men's voices and women's mate choices that this paper extends by adding tempo manipulation
- [[Simpson_2009_PhoneticGenderDifferences]] — cited for phonetic sex differences; provides the broader context of sex-linked acoustic variation within which pitch attractiveness operates
- [[Babel_2014_VocalAttractiveness]] — cited for a more nuanced view of vocal attractiveness; Babel shows attractiveness depends on multiple acoustic dimensions, consistent with Quene's finding that pitch and tempo contribute independently
- [[Holmberg_1988_GlottalAirflowPressure]] — cited for glottal airflow measurements in male and female speakers; provides the source-level data underlying the F0 differences manipulated here

### Cited By (in Collection)
- [[Weiss_2020_VoiceAttractiveness]] — Quene is a contributor to this edited volume; the pitch/tempo findings are discussed in the broader attractiveness framework

### Conceptual Links (not citation-based)
- [[Schild_2019_AttractiveVoiceFormantF0]] — Schild uses PCA on voice quality measures including F0 and formants to predict attractiveness; Quene's finding that F0 has a larger effect than tempo on attractiveness aligns with Schild's finding that the F0-loaded component is the strongest predictor. (Strong)
- [[Liu_2011_FemaleVoiceAttractiveness]] — Liu studies female voice attractiveness via breathiness and size projection; together with Quene's male voice study, the two papers suggest that attractiveness operates through different acoustic channels for male voices (F0, tempo) vs. female voices (breathiness, formant spacing). (Moderate)
- [[Hughes_2004_VoiceAttractivenessSexualBehavior]] — Hughes links voice attractiveness to sexual behavior and body morphology; provides the evolutionary context for why the pitch-attractiveness relationship Quene documents exists. (Moderate)
- [[Cumbers_2013_PerceptualCorrelatesVocalVariability]] — Cumbers shows that F0 variability affects voice perception; Quene's finding that only negative pitch deviations reduce attractiveness suggests a ceiling effect that interacts with variability. (Moderate)

## Related Work Worth Reading
- Collins 2000 — Men's voices and women's choices (already in collection as Collins_2003_VocalVisualAttractiveness)
- Feinberg et al. 2005 — Fundamental and formant frequency effects on male voice attractiveness
- Simpson 2009 — Phonetic gender differences (already in collection)
- Babel 2014 — Vocal attractiveness (already in collection)
