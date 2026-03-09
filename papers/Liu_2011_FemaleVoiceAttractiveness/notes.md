# What Makes a Female Voice Attractive?

**Authors:** Xuan Liu, Yi Xu
**Year:** 2011
**Venue:** ICPhS XVII (International Congress of Phonetic Sciences), Hong Kong
**DOI/URL:** N/A (conference proceedings, pp. 1274-1277)

## One-Sentence Summary
This paper demonstrates that female vocal attractiveness is primarily driven by voice quality (breathy > normal > pressed), with secondary contributions from formant shift (shorter vocal tract) and pitch height, all consistent with a "small body size projection" hypothesis.

## Problem Addressed
What acoustic features make a female voice attractive to male listeners, and can this be explained by the evolutionary "size projection" framework (Morton's motivational-structural rules, Ohala's frequency code)?

## Key Contributions
- Establishes voice quality as the strongest acoustic cue for female vocal attractiveness (F(2,18) = 73.71, p < 0.0001), far exceeding formant shift and pitch effects
- Shows breathy voice is always rated most attractive, pressed voice always least attractive
- Demonstrates that formant condensation (shorter apparent vocal tract) increases attractiveness, but only down to the speaker's natural length — further shortening provides no extra benefit
- Links the posterior glottal chink prevalent in young women to a functional motivation: producing breathy voice quality for attractiveness signaling
- Finds that final F0 slope (local pitch contour) has no significant main effect on attractiveness, suggesting local prosodic contours carry linguistic rather than attractiveness information

## Methodology
- Perception experiment with 81 stimuli: 1 female speaker producing "Good luck with your exams" in 3 voice qualities (normal, breathy, pressed), acoustically manipulated along 3 additional dimensions (formant shift, pitch shift, final F0 slope) — full factorial 3x3x3x3 design
- Manipulations done in Praat using "Change gender" function
- 10 male native English listeners rated attractiveness on 1-5 scale
- Four-way repeated measures ANOVA with Bonferroni/Dunn post-hoc tests

## Key Equations
No formal equations presented. The core statistical results serve as the primary quantitative contribution.

## Parameters

| Name | Symbol | Units | Levels | Notes |
|------|--------|-------|--------|-------|
| Formant shift ratio | — | ratio | 0.9, 1.0, 1.1 | Simulates vocal tract length change; 1.1 = shorter VT (condensed formants) |
| Pitch shift | — | semitones | -2, 0, +2 | Relative to original F0 |
| Final F0 slope | — | st/s | -15 (height -4 st), 0, +15 (height +3 st) | Rate of F0 fall in final syllable |
| Voice quality | — | categorical | breathy, normal, pressed | Produced by speaker, not manipulated |

### ANOVA Main Effects

| Factor | df | F | p |
|--------|-----|-------|---------|
| Voice quality | 2,18 | 73.71 | < 0.0001 |
| Formant shift | 2,18 | 21.31 | < 0.0001 |
| Pitch shift | 2,18 | 11.00 | 0.0008 |
| Final slope | 2,18 | 2.27 | 0.1319 (n.s.) |

### Significant Interactions

| Interaction | df | F | p |
|-------------|-----|------|------|
| Voice quality x Final slope | 4,36 | 4.61 | 0.0041 |
| Voice quality x Formant shift | 4,36 | 8.33 | < 0.0001 |
| Voice quality x Pitch shift | 4,36 | 3.00 | 0.0311 (marginal) |
| Formant shift x Pitch shift | — | — | significant (value not reported) |

### Mean Attractiveness Ratings (from figures)

**Voice quality x Formant shift (Fig. 1b):**

| Formant ratio | Breathy | Normal | Pressed |
|---------------|---------|--------|---------|
| 1.1 (short VT) | 3.46 | 2.78 | 2.45 |
| 1.0 (neutral) | 3.75 | 2.93 | 2.22 |
| 0.9 (long VT) | 3.20 | 2.40 | 1.83 |

**Voice quality x Pitch shift (Fig. 1c):**

| Pitch shift | Breathy | Normal | Pressed |
|-------------|---------|--------|---------|
| +2 st | 3.16 | 2.93 | 2.45 |
| 0 | 3.29 | 2.93 | 2.68 |
| -2 st | 2.99 | 2.52 | 2.09 |

## Implementation Details
- Formant shift ratio of 1.1 corresponds to formant condensation (simulating a shorter vocal tract); 0.9 corresponds to formant dispersion (simulating a longer vocal tract)
- Voice quality manipulation was done at production level (speaker produced breathy/normal/pressed), not by acoustic transformation — this is important for ecological validity
- Breathy voice is characterized by increased spectral tilt from modal voice and reduced high-frequency energy (citing Klatt 1990)
- Pressed voice has increased high-frequency energy, harsher quality
- The Praat "Change gender" function was used for formant and pitch manipulations

## Figures of Interest
- **Fig 1a (page 3):** Voice quality x Final F0 slope interaction — pressed voice with normal slope is excessively unattractive
- **Fig 1b (page 3):** Voice quality x Formant shift — breathy always highest; long VT (0.9) penalizes all qualities
- **Fig 1c (page 3):** Voice quality x Pitch shift — lowered pitch is always disfavored
- **Fig 2 (page 3):** Formant shift x Pitch shift interaction — when formants are neutral or condensed, original pitch is most attractive; the 1.1 ratio with 0 pitch shift peaks at 3.57

## Results Summary
1. Voice quality is the dominant factor: breathy >> normal >> pressed (effect size ~3x larger than formant shift)
2. Formant condensation (shorter VT) increases attractiveness, but no significant difference between 1.0 and 1.1 ratios — only 0.9 (longer VT) is significantly less attractive
3. Original or raised pitch is preferred over lowered pitch; no significant difference between original and +2 st
4. Final F0 slope has no significant main effect
5. All significant factors are consistent with "small body size projection" hypothesis

## Limitations
- Only 1 female speaker — individual voice characteristics may confound results
- Only 10 male listeners — limited statistical power for individual differences
- Voice quality was produced (not synthesized), creating potential confounds with other acoustic properties
- Only one sentence tested — generalizability to other linguistic contexts unknown
- The "too short" vocal tract ceiling effect needs further investigation
- Cross-cultural validity not tested

## Testable Properties
- Breathy voice quality should always be rated more attractive than normal, which should always be rated more attractive than pressed, for female voices judged by male listeners
- Formant condensation (simulating shorter vocal tract) should not decrease attractiveness relative to neutral; formant dispersion (longer vocal tract) should decrease attractiveness
- Lowering pitch by 2 st should decrease attractiveness relative to original pitch
- Voice quality effect size should be larger than formant shift effect size, which should be larger than pitch shift effect size
- Final F0 slope should have minimal impact on attractiveness ratings compared to voice quality

## Relevance to Project
This paper provides empirical evidence for implementing attractive female voice presets in the Klatt synthesizer. The key parameters to manipulate are: (1) spectral tilt / breathiness via AH and TL parameters (most important), (2) formant spacing / vocal tract length simulation, and (3) F0 height. The finding that voice quality (breathiness) dominates attractiveness perception aligns with Klatt 1990's voice quality variation framework already in the project's paper collection.

## Open Questions
- [ ] What specific spectral tilt values (H1-H2, H1-A1) correspond to the "breathy" quality rated most attractive?
- [ ] Does the size projection framework apply equally to male vocal attractiveness?
- [ ] What is the ceiling effect for formant condensation — at what ratio does "short VT" become "child-like"?
- [ ] How do these findings interact with speaking rate and rhythm?

## Related Work Worth Reading
- Klatt 1990 — voice quality variations among female and male talkers (already in collection)
- Xu, Kelly & Smillie (forthcoming at time of paper) — bio-informational dimensions theory for emotional expressions
- Morton 1977 — motivational-structural rules in animal sounds (foundational for size projection)
- Ohala 1984 — frequency code and cross-language F0 utilization
- Henton & Bladon 1985 — breathiness in normal female speech
- Collins 2000 — body size and voice/facial attractiveness

## Collection Cross-References

### Already in Collection
- [[Klatt_1990_VoiceQualityVariations]] — cited as ref [7]; provides the synthesis parameter framework for modeling breathiness (aspiration noise, spectral tilt, H1-H2) that this paper identifies as the dominant attractiveness cue

### New Leads (Not Yet in Collection)
- Henton, C.G., Bladon, R.A.W. (1985) — "Breathiness in normal female speech: inefficiency versus desirability" — quantifies female breathiness and the intelligibility trade-off; directly relevant for setting spectral tilt bounds
- Ohala, J.J. (1984) — "An ethological perspective on common cross-language utilization of F0 of voice" — foundational frequency code theory underlying the size projection framework
- Morton, E.S. (1977) — "On the occurrence and significance of motivational-structural rules in some bird and mammal sounds" — motivational-structural rules that form the evolutionary basis for the size projection hypothesis
- Collins, S.A. (2000) — "Men's voice and women's choice" — body size and vocal/facial attractiveness link

### Cited By (in Collection)
- (none found)

### Conceptual Links (not citation-based)
**Breathiness and voice quality as attractiveness cue:**
- [[Babel_2014_VocalAttractiveness]] — Babel's regression analysis of 60 speakers independently confirms Liu's perception finding: breathier voice quality (higher spectral tilt) is the strongest predictor of female vocal attractiveness (r^2 = 0.54), with F0 and formant position being poor predictors alone. Both papers converge on voice quality > F0 > formants as the effect size ordering.
- [[XuLee_VocalAttractivenessMandarinListeners]] — Same research group (Yi Xu), extends the breathy/modal/pressed paradigm to Mandarin listeners with VocalTractLab synthesis; cross-culturally validates the voice quality preference ordering (breathy > modal > pressed) and provides concrete spectral tilt measurements (H1-H2*, H1-A1*, H1-A3*) for each quality type.

**F0 and attractiveness — nonlinearity question:**
- [[Borkowska_2011_F0DominanceAttractiveness]] — Borkowska finds an inverted-U relationship between F0 and female voice attractiveness (peak ~280 Hz, declining above), while Liu finds no significant difference between original and +2 st raised pitch. Both agree that lowered pitch is disfavored. The apparent tension may reflect different manipulation ranges: Borkowska tested natural voices spanning 184-310 Hz, while Liu used +/-2 st around a single speaker.
- [[Feinberg_2008_FemininityAveragenessVoicePitch]] — Feinberg finds a linear pitch-attractiveness relationship for female voices (higher = more attractive), which partially aligns with Liu's finding that lowered pitch is disfavored but original and raised pitch are statistically equivalent. The three papers together suggest a plateau rather than a strict linear or inverted-U function.

**Formant dispersion and body size:**
- [[Collins_2003_VocalVisualAttractiveness]] — Collins finds higher formant frequencies predict higher female attractiveness, consistent with Liu's finding that formant condensation (shorter apparent vocal tract) increases attractiveness. Both papers support the body-size projection mechanism.
- [[Feinberg_2011_IntegratingF0FormantPreferences]] — Tests F0 x formant interaction for male voice attractiveness; Liu tests the same interaction for female voices. Liu finds a significant formant x pitch interaction (Fig. 2), and Feinberg finds a similar cue-amplification effect, suggesting coherent size cues are preferred for both sexes.
