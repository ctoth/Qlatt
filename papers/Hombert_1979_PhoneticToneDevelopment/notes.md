# Phonetic Explanations for the Development of Tones

**Authors:** Jean-Marie Hombert, John J. Ohala, William G. Ewan
**Year:** 1979
**Venue:** Language, Vol. 55, No. 1, pp. 37-58
**DOI:** 10.2307/412518

## One-Sentence Summary
This paper provides quantitative F0 perturbation data showing that prevocalic voiceless consonants raise F0 of following vowels by ~10 Hz (approximately 8% for male speakers) while voiced consonants lower it, with perturbation lasting 100+ ms in English and 40-60 ms in Yoruba -- the key phonetic mechanism underlying the historical development of tone from consonant voicing distinctions.

## Problem Addressed
The paper explains why tone systems develop in languages that lose voicing distinctions on consonants (tonogenesis). The central question: what is the phonetic "seed" that allows listeners to reinterpret consonantal F0 perturbations as tonal contrasts?

## Key Contributions
- Quantitative F0 measurements after voiced vs. voiceless stops in English (5 speakers) and Yoruba (2 speakers)
- Perceptual experiment establishing minimum detectable F0 perturbation (~10 Hz difference perceptible when slope duration >= 60 ms)
- Evidence comparing aerodynamic vs. vocal-cord tension hypotheses for the perturbation mechanism
- Cross-linguistic evidence that the same perturbation pattern appears in both tonal and non-tonal languages
- Data on effects of glottal consonants, vowel height, and postvocalic consonants on F0

## Methodology
1. **Production study (English):** 5 male American English speakers, sentence "Say C[i] again" where C = [p t k b d g] and sonorants [w m]. Sampled F0 at 20 ms intervals from vowel onset to 100 ms post-onset. Each token repeated 10 times.
2. **Production study (Yoruba):** 2 speakers, velar stops before three tones (high, mid, low). Same sampling methodology.
3. **Perceptual study:** 10 English listeners, synthesized vowel [i] with initial F0 ramp of +/-10 Hz over varying durations (40, 60, 100, 150, 250 ms). Task: match pitch of ramp onset to steady-state comparison.
4. **Glottal consonant study (Arabic):** 4 speakers, F0 of vowels preceding [?] vs [h].

## Key Equations

No formal equations presented. The paper is primarily empirical.

## Parameters

| Name | Symbol | Units | Value | Context | Notes |
|------|--------|-------|-------|---------|-------|
| F0 after voiceless stops (English) | F0_vl | Hz | ~137 | Onset, males | Average across p,t,k from Hombert 1975a |
| F0 after voiced stops (English) | F0_vd | Hz | ~127 | Onset, males | Average across b,d,g from Hombert 1975a |
| F0 voiceless-voiced difference | delta_F0 | Hz | ~10 | At vowel onset | From Fig. 1 data |
| F0 perturbation duration (English) | t_pert | ms | >100 | Post-onset | Still significantly different at 100 ms |
| F0 perturbation duration (Yoruba) | t_pert | ms | 40-60 | Post-onset | Shorter than English |
| F0 perturbation duration (Thai) | t_pert | ms | ~30-50 | Post-onset | From Gandour 1974 |
| Perceptual threshold | delta_F0_min | Hz | +/-10 | Minimum | Perceptible when ramp >= 60 ms |
| Intrinsic F0 of /i/ (men) | F0_i | Hz | ~136 | Steady-state | From Peterson & Barney 1952 |
| Intrinsic F0 of /a/ (men) | F0_a | Hz | ~124 | Steady-state | From Peterson & Barney 1952 |
| Intrinsic F0 of /u/ (men) | F0_u | Hz | ~141 | Steady-state | From House & Fairbanks 1953 |
| F0 rise before [?] (Arabic) | delta_F0_? | Hz | +9 | Pre-consonantal | 70+ ms before vowel offset |
| F0 drop before [h] (Arabic) | delta_F0_h | Hz | -25 | Pre-consonantal | 70+ ms before vowel offset |

### Table 1: F0 of vowels by preceding consonant (Hz)

| Study | p | t | k | b | d | g |
|-------|---|---|---|---|---|---|
| House & Fairbanks 1953 | 127.9 | 127.1 | 127.2 | 120.9 | 120.6 | 122.8 |
| Lehiste & Peterson 1961 | 175 | 176 | 176 | 165 | 163 | 163 |
| Mohr 1968 | 130.7 | 129.8 | 131.1 | 125.1 | 124.8 | 125 |

### Table 3: Intrinsic F0 of vowels (Hz)

| Study | i | e | ae | a | o | u |
|-------|---|---|-----|---|---|---|
| Peterson & Barney 1952 (men) | 136 | 130 | 127 | 124 | 129 | 141 |
| Peterson & Barney 1952 (women) | 235 | 223 | 210 | 212 | 216 | 231 |
| Peterson & Barney 1952 (children) | 272 | 260 | 251 | 256 | 263 | 274 |
| Lehiste & Peterson 1961 (1) | 129 | 127 | 125 | 120 | 116 | 134 |
| Lehiste & Peterson 1961 (2) | 183 | 166 | 162 | 163 | 165 | 182 |
| House & Fairbanks 1953 | 127.9 | - | 119.8 | 118 | - | 129.9 |
| Mohr 1971 | 128.8 | - | - | 124.2 | - | 129.9 |

## Implementation Details

### F0 Perturbation Pattern for Synthesis

**After voiceless (aspirated) stops:**
- F0 starts HIGH at vowel onset (approximately 8% above steady-state)
- Falls to steady-state over ~100 ms in English, ~40-60 ms in tone languages
- Pattern: high-falling F0 contour at vowel onset

**After voiced stops:**
- F0 starts LOW at vowel onset
- Rises to steady-state over ~100 ms in English
- The rising contour after voiced stops may partly reflect intonation contour rather than pure perturbation (sonorants show similar pattern -- see Fig. 2)
- Pattern: low-rising F0 contour at vowel onset

**Key finding from Fig. 1:** The greatest F0 difference between voiced and voiceless is at vowel onset. The curves converge by ~100 ms. The difference at onset is approximately 10 Hz for male speakers averaging ~130 Hz F0 -- roughly 7-8%.

**Important caveat:** The F0 perturbation does NOT vary consistently by place of articulation (labial vs. dental vs. velar). Only voicing matters.

### Perceptual Threshold for F0 Perturbation

From Section 2.5 experiment:
- Synthesized [i] vowels with initial F0 ramps of +/-10 Hz
- Listeners can discriminate rising from falling ramps when duration >= 60 ms
- At 40 ms duration, ramps are NOT perceptually distinguishable
- This means perturbations of 10 Hz magnitude need at least 60 ms to be perceived
- Larger perturbations (> +/-10 Hz) would be perceptible at shorter durations

### Glottal Consonant Effects on Preceding Vowel

From Arabic data (Section 5.2, Fig. 9):
- [?] (glottal stop): raises F0 of preceding vowel by ~9 Hz, significantly different 70+ ms before vowel offset
- [h]: drops F0 of preceding vowel by ~25 Hz, significantly different 70+ ms before vowel offset
- Perceptual test: [?] and [h] effects on F0 are perceptually differentiable when delta_F = +/-10 Hz and delta_t = 40 ms

### Vowel Height and Intrinsic F0

High vowels (/i/, /u/) have intrinsically higher F0 than low vowels (/a/) by approximately 10-15 Hz in male speakers. This is the same order of magnitude as consonant-induced perturbation, but the two effects are perceived differently because:
- Consonant perturbation is a dynamic change (slope)
- Vowel height effect is a steady-state level difference
- Auditory system is more sensitive to dynamic F0 changes than steady-state level differences

## Figures of Interest
- **Fig 1 (page 39):** Average F0 of vowels following English voiced [b] and voiceless [p] stops. Shows ~10 Hz difference at onset, converging by 100 ms. Voiceless starts at ~137 Hz, voiced at ~127 Hz.
- **Fig 2 (page 40):** Individual speaker F0 curves for voiced/voiceless stops and sonorants. Shows speaker variation and that sonorants pattern similarly to voiced stops.
- **Fig 3 (page 41):** F0 after voiced/voiceless velar stops in Yoruba across three tones. Perturbation duration is shorter (40-60 ms) than English.
- **Fig 4 (page 43):** Computer simulation of aerodynamic events during voiceless aspirated vs. voiced stop VCV utterances (from Ohala 1974b). Shows oral airflow, glottal airflow, subglottal pressure, and oral volume differences.
- **Fig 5 (page 44):** Larynx elevation data for French, English, and Thai. Shows higher larynx position for voiceless vs. voiced stops, with difference greatest at consonant closure end.
- **Fig 7 (page 46):** Perceptual experiment results -- subjects' estimates of starting pitch as function of ramp duration. Falling ramps perceived as higher onset, rising ramps as lower onset, but only differentiated at >= 60 ms duration.
- **Fig 9 (page 50):** F0 before Arabic [?] and [h] -- shows diverging F0 curves 70+ ms before consonant onset.
- **Fig 8 (page 49):** Schematic showing how vowel truncation before voiceless final consonants creates different terminal F0 contours.

## Results Summary

1. **Prevocalic voiceless stops raise F0 by ~10 Hz** at vowel onset relative to voiced stops, independent of place of articulation.
2. **Perturbation lasts >100 ms in English**, 40-60 ms in Yoruba, suggesting tone languages may actively minimize perturbation duration.
3. **Perceptual threshold:** +/-10 Hz F0 perturbation is detectable when the slope lasts >= 60 ms.
4. **Mechanism:** Probably vocal-cord tension (vertical larynx position) rather than pure aerodynamics. Larynx is higher for voiceless stops, which increases vocal fold tension and F0.
5. **Glottal consonants** also perturb F0: [?] raises it, [h] lowers it.
6. **Intrinsic vowel F0** (high vowels higher F0) is of similar magnitude to consonant perturbation but perceived differently.
7. **Falling tones are more common than rising tones** cross-linguistically, possibly due to laryngeal constraints making F0 lowering easier than raising.

## Limitations
- Small sample sizes (5 speakers for English, 2 for Yoruba, 4 for Arabic)
- Only male speakers in the English production study
- Perceptual experiment used only synthesized stimuli, not natural speech
- The paper acknowledges the aerodynamic vs. vocal-cord tension debate is not fully resolved
- No F0 perturbation measurements for fricatives or affricates

## Testable Properties
- F0 after voiceless stops must be higher than after voiced stops at vowel onset
- The F0 difference should be approximately 5-15 Hz for male speakers
- F0 perturbation should decay to < 3 Hz difference by 100 ms post-onset
- Place of articulation should NOT significantly affect F0 perturbation magnitude
- The perturbation magnitude as a percentage of mean F0 should be approximately 7-10%
- Synthesized F0 ramps of +/-10 Hz should be imperceptible at durations < 40 ms

## Relevance to Project
This paper provides the empirical basis for the F0 microprosody rule in Qlatt's frontend. Specifically:
- **Voiceless onset F0 perturbation:** The current rule uses +20% F0 raising. This paper's data suggests the actual perturbation is ~8% (10 Hz on a 130 Hz baseline). The 20% value may be an overestimate, though it could include aspiration effects not measured here.
- **Perturbation duration:** The paper shows perturbation persists for >100 ms in English, which should inform the decay time of the F0 microprosody adjustment.
- **Voiced consonants:** The paper shows voiced stops have lower F0 at onset, but this may partly be an intonation artifact (sonorants show similar patterns). Implementing a voiced-consonant F0 lowering rule should be done cautiously.
- **No place-of-articulation effect:** The perturbation should be the same for all voiceless stops regardless of place.

## Open Questions
- [ ] Should our F0 microprosody rule use ~8% (from this data) or +20% (current implementation)? Need to check if the +20% comes from a different source or includes aspiration effects.
- [ ] What is the exact decay function? The paper shows it's roughly exponential, but doesn't give a time constant.
- [ ] Should we also implement F0 lowering after voiced consonants, or is the current voiceless-only rule sufficient?
- [ ] How do fricatives and affricates affect F0? This paper only covers stops.

## Related Work Worth Reading
- Hombert 1975a - Original F0 perturbation data for English (more detailed than this review)
- Hombert & Ladefoged 1976 - Effect of aspiration on F0
- Ohala 1974b - Mathematical model of speech aerodynamics (Fig. 4 data)
- Halle & Stevens 1971 - Vocal cord tension hypothesis
- Lea 1973 - Segmental and suprasegmental influences on F0
- Gandour 1974 - F0 perturbation data for Thai (shorter perturbation in tone languages)
- Ewan & Krones 1974 - Larynx height measurements

## Collection Cross-References

### Already in Collection
- **Peterson_Barney_1952_VowelControl** - cited for intrinsic vowel F0 data (Table 3)
- **Lisker_Abramson_1964_CrossLanguageVoicingStops** - cited for VOT and voicing framework
- **OShaughnessy_1976_F0_Prosody** - related F0 generation work

### New Leads (Not Yet in Collection)
- Hombert 1975a - "Towards a theory of tonogenesis" - primary source for the English F0 perturbation data used in our rule
- Halle & Stevens 1971 - "A note on laryngeal features" - vocal-cord tension hypothesis for F0 perturbation
- Lea 1973 - "Segmental and suprasegmental influences on fundamental frequency contours" - F0 perturbation data
- Lofqvist 1975 - "Intrinsic and extrinsic F0 variations in Swedish tonal accents" - Swedish data showing similar perturbations

### Supersedes or Recontextualizes
- None directly, but this paper provides the foundational data that our F0 microprosody rule cites, so it contextualizes the +20% voiceless onset raising value we currently use (which may be an overestimate based on this data).
