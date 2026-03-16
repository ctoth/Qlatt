---
title: "Relationship Between Subglottal Pressure and Sound Pressure Level in Untrained Voices"
authors: "Staffan Bjorklund, Johan Sundberg"
year: 2016
venue: "Journal of Voice, 30(1), 15-20"
doi_url: "10.1016/j.jvoice.2015.03.006"
note: "PDF retrieval failed (sci-hub served wrong paper for this DOI). Notes compiled from PubMed abstract, citing papers, and metadata. Full-text verification needed."
---

# Relationship Between Subglottal Pressure and Sound Pressure Level in Untrained Voices

## One-Sentence Summary
Provides normative regression data relating subglottal pressure (Ps) to sound pressure level (SPL) in untrained voices, establishing that SPL = a + b*log2(Ps) with gender-specific slopes and intercepts.

## Problem Addressed
Clinical voice assessment needs objective measures of phonatory efficiency. The ratio of acoustic output (SPL) to aerodynamic input (Ps) quantifies how efficiently the larynx converts pressure to sound. This paper establishes normative values for untrained speakers.

## Key Contributions
- Established average Ps-SPL correlation of r = 0.83 across 31 healthy speakers
- Quantified gender differences: males produce ~2 dB higher SPL at equivalent Ps but gain less SPL per pressure doubling
- At Ps = 10 cm H2O: females produce 78.1 dB SPL, males produce 80.0 dB SPL (at 0.3 m)
- SPL gain per doubling of Ps: 11.1 dB (females), 9.3 dB (males)
- Both gender differences statistically significant
- Pitch did not significantly affect the Ps-SPL relationship

## Methodology
- 16 female and 15 male healthy speakers (untrained voices)
- Subjects produced sequences of syllable [pae]
- Subglottal pressure estimated from oral pressure during [p] occlusion (standard Smitheran-Hixon method)
- SPL measured at 0.3 m distance
- Testing at four pitch levels
- Regression analysis of log(Ps) vs SPL

## Key Equations

The Ps-SPL relationship is linear on a log-log scale (i.e., SPL in dB vs Ps in log scale):

$$
SPL = a + b \cdot \log_2(P_s)
$$

Where:
- $SPL$ = sound pressure level in dB at 0.3 m
- $P_s$ = subglottal pressure in cm H2O
- $a$ = intercept (gender-dependent)
- $b$ = slope in dB per doubling of Ps (gender-dependent)

### Gender-Specific Values

| Parameter | Female | Male | Units |
|-----------|--------|------|-------|
| SPL at Ps=10 cm H2O | 78.1 | 80.0 | dB at 0.3 m |
| SPL gain per Ps doubling | 11.1 | 9.3 | dB |
| Mean correlation (r) | ~0.83 | ~0.83 | - |

Note: The theoretical expectation for an ideal source is ~8-9 dB per doubling (Titze 1994). Females exceed this, suggesting additional glottal efficiency changes at higher pressures.

## Parameters

| Name | Symbol | Units | Default | Range | Notes |
|------|--------|-------|---------|-------|-------|
| Subglottal pressure | Ps | cm H2O | - | ~3-30 | Estimated from oral pressure during /p/ |
| Sound pressure level | SPL | dB | - | ~60-95 | Measured at 0.3 m |
| Regression slope | b | dB/doubling | 11.1 (F), 9.3 (M) | - | dB increase per doubling of Ps |
| SPL at reference Ps | a(10) | dB | 78.1 (F), 80.0 (M) | - | At Ps = 10 cm H2O |
| Correlation coefficient | r | - | 0.83 | - | Average across subjects |

## Implementation Details

### For a Synthesizer (Ps -> SPL mapping)
1. Given a target Ps (from effort/loudness control), compute expected SPL:
   - Female voice: SPL = 78.1 + 11.1 * log2(Ps/10)
   - Male voice: SPL = 80.0 + 9.3 * log2(Ps/10)
2. This gives the "normal" SPL for a given driving pressure
3. Deviation from this norm indicates phonatory dysfunction or trained technique

### Measurement Protocol (Smitheran-Hixon method)
- Subject produces repeated /pae/ syllables
- Oral pressure during /p/ occlusion approximates Ps
- SPL measured simultaneously
- Regression of SPL on log2(Ps)

### Distance Correction
- All SPL values at 0.3 m distance
- To convert to other distances: SPL_d = SPL_0.3 - 20*log10(d/0.3)

## Figures of Interest
- Paper contains regression plots of SPL vs Ps for male and female subjects (not accessible)

## Results Summary
- Ps-SPL correlation is robust (r = 0.83) and clinically useful
- Gender difference in slope: females gain more SPL per unit Ps increase
- Gender difference in intercept: males louder at same pressure
- Pitch has no significant effect on the Ps-SPL relationship
- The relationship can be reliably established from series of repetitions of [pae]

## Limitations
- Only untrained voices studied (no singers or voice professionals)
- Only healthy voices (no pathological voices for comparison)
- SPL measured at single distance (0.3 m)
- Only one vowel context [ae] tested
- Regression coefficients may vary for sustained vowels vs syllable repetitions
- Full-text not available for verification of exact regression equations

## Testable Properties
- SPL must increase monotonically with Ps (positive correlation)
- Correlation between log2(Ps) and SPL should be >= 0.7 for healthy voices
- At Ps = 10 cm H2O, SPL should be in range 75-85 dB at 0.3 m
- Doubling Ps should increase SPL by 8-12 dB (healthy untrained voice)
- Pitch should not significantly affect the Ps-SPL slope
- Male SPL at equivalent Ps should be slightly higher than female SPL

## Relevance to Project
This paper provides the quantitative link between subglottal pressure (a physiological parameter controlled by respiratory effort) and acoustic output level. For a speaker personality system, this mapping is critical:
1. **Effort modeling**: Different speakers may have different Ps-SPL efficiency curves
2. **Gender differences**: The 2 dB intercept difference and slope difference between male/female voices should be reflected in the speaker model
3. **Loudness control**: When the synthesizer adjusts "vocal effort," the Ps-SPL relationship determines how much acoustic level change results
4. **Voice quality interaction**: At higher Ps, voice quality changes (more pressed phonation) -- this paper establishes the baseline acoustic effect

## Open Questions
- [ ] Full regression equation form (exact intercepts and slopes) -- need full text
- [ ] Individual variation around the mean regression -- standard deviations of slope/intercept
- [ ] How does the Ps-SPL relationship interact with voice source parameters (H1-H2, spectral tilt)? [Addressed by Sundberg_2005_GlottalSourceLoudness — provides quantitative equations relating Ps to MFDR, closed quotient, H1-H2 in untrained voices]
- [ ] What are the corresponding values for trained singers? (See Sundberg 2017 follow-up)

## Collection Cross-References

### Already in Collection
- (none confirmed -- citations list is incomplete due to PDF retrieval failure)

### New Leads (Not Yet in Collection)
- Sundberg J. (2017/2018) "Flow Glottogram and Subglottal Pressure Relationship in Singers and Untrained Voices" — direct follow-up extending Ps analysis to voice source parameters (MFDR, H1-H2, closed quotient), comparing trained singers to untrained voices
- Smitheran JR, Hixon TJ. (1981) "A clinical method for estimating laryngeal airway resistance during vowel production" — foundational method for Ps estimation used in this study

### Cited By (in Collection)
- (none found)

### Conceptual Links (not citation-based)

**Ps-SPL transfer function:**
- [[Isshiki_1964_VoiceIntensityRegulation]] — The foundational 1964 study that first simultaneously measured SPL, subglottic pressure, flow rate, and glottal resistance. Isshiki found I proportional to P^3.3 across all pitch registers, consistent with Bjorklund's log2-based regression. Critically, Isshiki showed the *mechanism* differs by pitch register (resistance-dominant at low pitch, flow-dominant at high pitch) even though the Ps-SPL power law holds throughout — which may explain why Bjorklund found pitch has no significant effect on the Ps-SPL slope. Isshiki's single-subject data is complemented by Bjorklund's 31-speaker normative dataset.
- [[Titze_1992_VocalIntensity]] — Titze's theoretical derivation predicts 8-9 dB SPL increase per doubling of excess pressure over phonation threshold; Bjorklund's empirical 9.3-11.1 dB per doubling of total Ps is higher, likely because total Ps conflates threshold and excess components. The discrepancy is informative: Bjorklund measures the gross input-output curve while Titze models the mechanism.

**Voice source parameters and effort:**
- [[Sundberg_2005_GlottalSourceLoudness]] — Uses the identical protocol (same /pae/ syllables, same Ps estimation method, similar untrained population) but measures voice source parameters rather than just SPL. Sundberg 2005 provides the voice quality dimension (how Ps changes MFDR, closed quotient, H1-H2) that complements Bjorklund's acoustic output dimension.
- [[Herbst_2015_GlottalAdductionSubglottalPressure]] — Demonstrates that trained singers can independently control Ps and glottal adduction, achieving different voice qualities at the same SPL. Bjorklund's untrained speakers presumably cannot decouple these, so the 0.83 correlation reflects the natural covariation of pressure and adduction in untrained phonation.

**Sex differences in vocal efficiency:**
- [[Zhang_2021_LaryngealSizeSexDifferences]] — Zhang's simulation finding that females require higher vocal fold contact pressure to achieve equivalent SPL provides the physical mechanism for Bjorklund's observed gender difference: males produce 2 dB more SPL at the same Ps because their longer, thicker folds convert pressure to acoustic output more efficiently.
- [[Titze_1989_MaleFemaleVoices]] — Titze predicts females are ~25% more glottally efficient due to higher F0, but Bjorklund finds males produce higher SPL at equivalent Ps. This apparent tension likely reflects different efficiency definitions: Titze measures glottal efficiency (acoustic power / aerodynamic power) while Bjorklund measures the Ps-to-SPL transfer function which includes vocal tract radiation effects.

## Related Work Worth Reading
- Sundberg J. (2017/2018) "Flow Glottogram and Subglottal Pressure Relationship in Singers and Untrained Voices" -- extends this work to voice source parameters
- Titze IR. (1994) "Principles of Voice Production" -- theoretical framework for Ps-SPL relationship
- Titze IR et al. (2003) -- earlier work on Ps-SPL correlation
- Smitheran JR, Hixon TJ. (1981) -- method for estimating Ps from oral pressure
- Espinoza VM et al. (2017) -- confirms strong Ps-SPL correlation
