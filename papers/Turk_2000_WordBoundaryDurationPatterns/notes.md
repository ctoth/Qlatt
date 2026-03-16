---
title: "Turk & Shattuck-Hufnagel 2000 — Implementation Notes"
year: 2000
---

# Turk & Shattuck-Hufnagel 2000 — Implementation Notes

## Paper Reference
Turk, A. E. & Shattuck-Hufnagel, S. (2000). Word-boundary-related duration patterns in English. *Journal of Phonetics*, 28, 397-440. DOI: 10.1006/jpho.2000.0123

## Summary for Implementers

This paper evaluates five proposed word-level duration adjustment mechanisms using carefully controlled English stimuli (11 triads like *tune acquire* / *tuna choir* / *tune a choir*). The key finding: **word-final lengthening does not exist as a separate mechanism** -- the patterns attributed to it are better explained by word-initial lengthening, polysyllabic shortening, accentual lengthening, and syllable ratio equalization.

## The Five Mechanisms Evaluated

### 1. Word-Final Lengthening -- NOT SUPPORTED
- Prediction: segments at word ends should be longer than identical segments in word-medial position
- Result: No consistent lengthening of word-final segments independent of phrase position
- Previous claims of word-final lengthening (Oller 1973, Umeda 1975) may actually be phrase-final lengthening or polysyllabic shortening effects
- **Implementation: Do NOT add a word-final lengthening rule. Phrase-final lengthening is a separate, well-established phenomenon.**

### 2. Word-Initial Lengthening -- SUPPORTED
- Prediction: word-initial consonant constriction is longer than word-medial consonant
- Result: Consistent lengthening of word-initial consonants (VOT, closure duration)
- Oller (1973), Cooper (1991), Fougeron & Keating (1997) all confirm
- Cooper (1991): longer VOT for word-initial /p, t, k/ than word-medial, in context of following unreduced unstressed vowel
- Effect concentrated on syllable **onset** (consonant), with minimal effects on following vowel
- Evidence for phrase-initial lengthening at higher levels is on initial consonant only (Fougeron 1998, Byrd 2000)
- **Implementation: Apply lengthening factor to word-initial onset consonants**

### 3. Polysyllabic Shortening -- SUPPORTED (symmetric)
- Lehiste (1972): stressed stem syllable shortens as more syllables are added to word
  - "stick" (mono) > "sticky" (2-syl) > "stickiness" (3-syl)
- First added syllable shortened the stem most; second added syllable shortened further but less
- Lindblom & Rapp (1972) for Swedish: asymmetric model -- greater shortening from syllables added to the right
- Barnwell (1971) for English: more symmetric effect
- Huggins (1975): most polysyllabic shortening occurs at the word level
- **This study's finding**: Evidence supports **symmetric** polysyllabic shortening distributed **fairly uniformly** across the syllable
- **Implementation: Shorten all segments in a word proportionally based on syllable count. Apply uniformly across sub-syllabic components.**

### 4. Accentual Lengthening -- SUPPORTED
- All syllables of a pitch-accented word are longer than in unaccented words (Nooteboom 1972, Eefting 1991, Sluijter 1995)
- Effect operates near the word level, attenuated at word boundaries
- Asymmetric: syllable following the pitch-accented syllable is lengthened to a greater degree than syllable preceding it (Sluijter 1995, Turk & White 1999, Cambier-Langeveld & Turk 1999)
- Word boundaries appear to attenuate the spread of accentual lengthening
- **Implementation: Already handled by standard accent/stress duration rules; word boundaries should attenuate the spread**

### 5. Syllable Ratio Equalization -- PARTIALLY SUPPORTED
- Abercrombie (1965), elaborated by Albrow (1968): syllable durations within an Abercrombian foot tend toward equal ratios
- Predicts /tun/ and /schwa/ in *tuna#choir* more equal in duration than in *tune#a#choir*
- Only supported for first syllable of foot (stressed syllable); no effect on second syllable
- Makes no predictions about sub-syllabic distribution
- **Implementation: Weak effect, hard to isolate. May apply ratio equalization to first syllable of foot but effect is marginal.**

## Experimental Design

### Stimuli
- 11 triads (Table I), each with three word boundary conditions:
  - Word-initial: bisyllabic + monosyllabic content word (e.g., *tuna choir*)
  - Word-final: monosyllabic + bisyllabic content word (e.g., *tune acquire*)
  - Function word: three monosyllabic words with function word medially (e.g., *tune a choir*)
- Example triads: caw#forbid / caw#for#bid / coffer#bid; pop#oppose / pop#a#pose / poppa#pose; tune#acquire / tune#a#choir / tuna#choir

### Speakers
- 6 native speakers of American English (2 male, 4 female)

### Accent Conditions (4 per triad)
- Accent-on-Say: contrastive pitch accent on *say*, no accent on test syllables
- Accent-on-/tun/: contrastive pitch accent on syllable 1
- Accent-on-/kwair/: contrastive pitch accent on syllable 3
- (Combined: all three accent conditions pooled)

### Elicitation
- Frame sentence: "Don't say (syl 1) (syl 2) (syl 3) again"
- Preceding contrastive sentence controlled pitch accent placement
- 1728 total utterances (12 triads x 3 boundary x 4 accent x 2 reps x 6 speakers)

### Measurement
- Syllable durations for all three target syllables
- Sub-syllabic: first consonant (onset), syllable center (nucleus + sonorant), final consonant (coda)
- First-consonant VOT measured separately where applicable
- "Rime" = center + final consonant

## Key Quantitative Results

### Whole-Syllable Duration Differences
- Differences between boundary conditions are **relatively small** (less than 10% across syllable types)
- Differences approached 10% on first syllable (/tun/) in Accent-on-/tun/ and Accent-on-/kwair/ conditions
- This is within the range of potential perceptual relevance (Klatt & Cooper 1975)
- Minimal differences (< 5%) in Accent-on-Say (unaccented) condition

### Duration Differences by Syllable Position
| Syllable | tune#acquire longer? | tuna#choir longer? | Pattern |
|----------|---------------------|-------------------|---------|
| Syl 1 /tun/ | YES (p<.01 in accented) | -- | Word-initial lengthening + polysyllabic shortening |
| Syl 2 /schwa/ | Not confirmed | Not confirmed | Central syllable shows weak/inconsistent effects |
| Syl 3 /kwair/ | -- | YES (p<.05 in accented) | Word-initial lengthening + polysyllabic shortening |

### Sub-Syllabic Distribution (Critical Finding)
For Syllable 1 (/tun/):
- **Syllable center** shows largest and most reliable differences (p<.01 in multiple conditions)
- **First consonant** shows differences for VOT and closure duration (significant or near-significant)
- **Final consonant** shows differences in expected direction but rarely reaches significance alone
- The "rime" (center + final C) shows larger and more reliable differences than either component alone
- This pattern is **NOT** consistent with word-final lengthening predictions (which expect progressive lengthening on rime > center > onset)
- Pattern IS consistent with polysyllabic shortening (uniform) + word-initial lengthening (on onset)

For Syllable 3 (/kwair/):
- Syllable center differences are larger than or comparable to onset differences
- First consonant differences are significant in most conditions
- Consistent with polysyllabic shortening + word-initial lengthening

### Function Word Boundaries
- Durations of /tun/ in *tune#a#choir* are intermediate between *tune#acquire* and *tuna#choir*
- Boundaries between content word and function word are **weaker** than between two content words
- In Accent-on-Say condition, function word boundary may be nearly unrealized
- Consistent with prosodic word formation: function words cliticize to adjacent content words

### Discriminant Analysis
- All three accent conditions pooled: 57.21% correct classification of boundary location
- Excluding unaccented condition: 66.89% correct classification
- Duration cues most useful when one word bears pitch accent
- Duration provides only a partial cue to word boundary location

## Most Parsimonious Duration Model (Authors' Conclusion)

The data can be accounted for by:
1. **Word-initial lengthening** -- on onset consonant
2. **Symmetric polysyllabic shortening** -- uniform across syllable
3. **Accentual lengthening** -- all syllables in accented word, plus possibly pitch-accented-word-final lengthening
4. **Syllable ratio equalization** -- on first syllable of foot (weak effect)
5. **No word-final lengthening** -- not supported as independent mechanism

## Implementation Recommendations for Qlatt

### Duration Rules
1. **Word-initial lengthening**: Lengthen word-initial onset consonants. Effect is on consonant closure and VOT primarily. Scale with accent/stress level.
2. **Polysyllabic shortening**: For N-syllable words, apply shortening factor to all syllables symmetrically. Distribute uniformly across sub-syllabic components.
3. **No word-final lengthening**: Do not implement. Phrase-final and utterance-final lengthening (Crystal & House 1988, Wightman et al. 1992) are separate phenomena driven by prosodic boundaries.
4. **Function word boundary attenuation**: Reduce word-boundary duration effects when either neighbor is a function word.

### What This Paper Does NOT Provide
- No absolute duration values suitable for direct parameter setting (relative comparisons only)
- No F0 or formant data
- No spectral information
- Duration effects are relative to matched segmental contexts, not absolute targets

## Collection Cross-References

### Already in Collection
- `Klatt_1976_SegmentalDuration` — Klatt 1976, duration model that Turk's findings refine (cited)
- `Crystal_House_1988_StopConsonantDuration` — Crystal & House 1988, segmental durations in connected speech (cited)
- `Wightman_1992_SegmentalDurationsProsodic` — Wightman et al. 1992, phrase-boundary lengthening (cited)
- `Oller_1973_EffectPositionUtteranceDuration` — Oller 1973, positional duration effects (cited)
- `Beckman_1990_LengtheningsShorteningsProsodic` — Beckman & Edwards 1990, phrase-final vs word-final lengthening (cited)
- `Umeda_1975_VowelDurationAmericanEnglish` — Umeda 1975, vowel duration in connected speech (cited indirectly via Oller)

### Cited By (in Collection)
- `Sorensen_Gafos_2016_GestureAutonomousDynamicalSystem` — references Turk & Shattuck-Hufnagel 2000
- `Kirkham_2025_DynamicalLawsSpeechGestures` — references Turk & Shattuck-Hufnagel 2000
- `White_2014_ProsodicTimingFunction` — references Turk & Shattuck-Hufnagel 2000

### New Leads
- Lehiste 1972 — timing of utterances and linguistic boundaries (polysyllabic shortening)
- Fougeron & Keating 1997 — articulatory strengthening at prosodic domain edges

### Conceptual Links (not citation-based)
- `Umeda_1977_ConsonantDurationAmericanEnglish` — consonant duration patterns in connected speech; Turk's word-boundary findings refine the positional effects Umeda documented
- `Gay_1978_SpeakingRateFormantMovements` — speaking rate effects on duration interact with the word-boundary patterns found here
- `Chen_1970_VowelLengthVariationVoicing` — voicing-conditioned vowel duration is another duration mechanism operating alongside word-boundary effects
