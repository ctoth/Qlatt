---
title: "Keating 1984 — Phonetic and Phonological Representation of Stop Consonant Voicing"
year: 1984
---

# Keating 1984 — Phonetic and Phonological Representation of Stop Consonant Voicing

## Implementation-Relevant Summary

This paper proposes a structured three-level model for relating phonological features to phonetic implementation, using stop consonant voicing as the case study. The key architectural insight is that between the binary phonological feature [+/-voice] and continuous physical parameters (like VOT), there exists an intermediate level of **phonetic categories** that constrains cross-language variation.

## Three Levels of Representation

1. **Phonological features**: Binary [+voice] / [-voice], as in SPE. Used for phonological rules.
2. **Phonetic categories**: Three universal categories along the voicing dimension:
   - {voiced} — fully voiced (voicing lead / negative VOT)
   - {vl.unasp.} — voiceless unaspirated (short-lag VOT, ~0-30 ms)
   - {vl.asp.} — voiceless aspirated (long-lag VOT, ~40-100+ ms)
3. **Phonetic detail rules**: Language-specific quantitative rules mapping categories to physical parameter values along continuous scales (VOT, closure voicing duration, F0 perturbation, etc.)

## The Voicing Dimension and VOT

### VOT Definition
- VOT = time interval between stop release and onset of vocal-fold vibration
- Stop release is the 0 ms reference point
- Negative VOT (lead): voicing onset precedes release
- Positive VOT (lag): voicing onset follows release
- Short lag: ~0-30 ms (place-dependent: labials ~+20, alveolars ~+30, velars ~+40)
- Long lag: aspiration region, values above ~40 ms

### Three-Category VOT Continuum Division
- Lead region (negative VOT) → {voiced}
- Short-lag region (0 to ~+30 ms) → {vl.unasp.}
- Long-lag region (>~+40 ms) → {vl.asp.}
- Gap exists between lead and short-lag regions (roughly -10 to 0 ms is rarely occupied)
- Category boundaries have perceptual basis: discrimination peaks at ~+20 and ~-20 ms VOT

### VOT Values by Place of Articulation (short-lag / {vl.unasp.})
- Labials: up to ~+20 ms
- Alveolars: up to ~+30 ms
- Velars: up to ~+40 ms

## Language-Specific Category Mappings

### Mapping [+/-voice] to phonetic categories

| Language | [+voice] | [-voice] | Notes |
|----------|----------|----------|-------|
| Polish | {voiced} | {vl.unasp.} | Simple: fully voiced vs. voiceless unaspirated |
| English | {voiced} or {vl.unasp.} | {vl.unasp.} or {vl.asp.} | Complex: varies by position and speaker |
| German | {voiced} or {vl.unasp.} | {vl.unasp.} or {vl.asp.} | Similar to English but less aspiration variation |

### English Allophonic Variation (detailed)
- **Initial [+voice]**: {voiced} (prevoiced) OR {vl.unasp.} (short-lag), varies by speaker
- **Initial [-voice]**: {vl.asp.} (long-lag), sensitive to stress level
- **Medial post-stress [+voice]**: generally {voiced} with closure voicing
- **Medial post-stress [-voice]**: {vl.unasp.} or {vl.asp.}, less aspiration than initial
- **Medial before reduced vowels**: [-voice] flapped, less aspiration
- English allophones of /t/: [t^h], [t], [r], [t'] (Kahn 1976 syllable-based rules)

### Phonetic Category Selection Rules (Figure 7 schematic)
- [+voice] maps to {voiced} in some contexts, {vl.unasp.} in others
- [-voice] maps to {vl.unasp.} in some contexts, {vl.asp.} in others
- {vl.unasp.} acts as a "swing" category: can implement either [+voice] or [-voice]
- In any given contrast, [+voice] member is ALWAYS more voiced than [-voice] member

## Vowel Duration Before Voiced/Voiceless Stops

- Vowels are longer before [+voice] stops than before [-voice] stops across languages
- This is correlated with the phonological feature value, not with degree of phonetic voicing
- English has more vowel lengthening before [+voice] stops than French, despite having less closure voicing
- Ranking of consonant effect on preceding vowel duration: p < p^h < b < b^h

## F0 Perturbation After Stop Release

- [+voice] stops lower F0 of following vowel, [-voice] stops raise F0
- English {vl.unasp.} [-voice] and {vl.asp.} [-voice] both perturb F0 of following vowel by similar magnitude
- F0 perturbation depends on phonological feature value, not just phonetic category
- F0 differences must have articulatory cause (larynx height, glottal opening extent)

## Polarization Principle

- Within discrete phonetic categories, adjacent categories may show "polarization": maximal separation of distributions
- Polish /b/ vs /p/ and English /b/ vs /p/ contrasts both show polarization away from the category boundary
- This operates within phonetic categories, not over the full continuous space
- Could explain subtle cross-language differences in VOT distributions for same phonetic category

## Neutralization

- Physically unmarked category is {vl.unasp.}: default state when vocal tract is in typical settings
- Westbury & Keating 1980: electrical analog model of vocal tract shows {vl.unasp.} results from neutral settings
- In neutralization, devoiced stops are {vl.unasp.}, not identical to underlying voiceless stops
- Polish word-final devoicing: underlying [+voice] stops still have more closure voicing than [-voice] stops (Dinnsen 1982)
- Neutralization is incomplete at the phonetic level: phonological feature values remain available to phonetic detail rules

## Relevance to Klatt Synthesizer

### Parameter Mapping for Stop Voicing
For implementing the [voice] contrast in a Klatt synthesizer:

1. **AV (voicing amplitude)**: Must be set differently for {voiced}, {vl.unasp.}, {vl.asp.}
   - {voiced}: AV active during closure
   - {vl.unasp.}: AV off during closure, onset near release (short delay)
   - {vl.asp.}: AV off during closure, onset well after release (long delay = VOT)

2. **AH (aspiration amplitude)**: Key differentiator for {vl.unasp.} vs {vl.asp.}
   - {vl.asp.}: AH active from release until voicing onset
   - {vl.unasp.}: AH minimal or absent
   - {voiced}: AH absent

3. **F0 perturbation**: Must be applied based on phonological [+/-voice], not just phonetic category
   - After [+voice]: lower F0 onset on following vowel
   - After [-voice]: raise F0 onset on following vowel

4. **Vowel duration**: Must be conditioned on [+/-voice] feature, not on amount of closure voicing

5. **Closure duration**: Varies by position and voicing category
   - {voiced} closures shorter than {vl.unasp.}/{vl.asp.} closures in English

### Implementation Architecture
The paper's three-level model maps naturally to a synthesizer pipeline:
- Phonological level → the input phoneme identity (/b/ vs /p/)
- Phonetic category selection → context-dependent allophone rules (position, stress)
- Phonetic detail → quantitative parameter values (exact VOT, F0 perturbation magnitude, vowel duration multiplier)

## Collection Cross-References

### Already in Collection
- `Lisker_Abramson_1964_CrossLanguageVoicingStops` — Cross-language VOT data establishing three-category system, foundational to this paper
- `Pierrehumbert_1980_EnglishIntonation` — Phonology-phonetics interface for intonation, cited for the multi-level representation approach
- `Hombert_1979_PhoneticToneDevelopment` — F0 perturbation by stop voicing, cited for phonetic explanation of tone development
- `Goldsmith_1976_AutosegmentalPhonology` — Autosegmental phonology framework referenced for feature representation
- `Blumstein_Stevens_1979_AcousticInvariance` — Acoustic invariance for place of articulation, related to Stevens & Blumstein 1981 cited here
- `Abramson_Whalen_2017_VOTat50` — Modern retrospective on VOT, directly extends the framework formalized here
- `Cho_1999_VariationUniversalsVOT` — Cross-language VOT variation within the three-category framework established here
- `Klatt_1975_VoiceOnsetTimeFrication` — Klatt's VOT measurements, relevant to the quantitative phonetic detail level

### New Leads
- Chen (1970) — "Vowel length variation as a function of the voicing of the consonant environment." Cross-language vowel duration conditioned by voicing
- Stevens & Klatt (1974) — "Role of formant transitions in the voiced-voiceless distinction for stops." JASA 55, 653-659
- Westbury & Keating (1980) — Aerodynamic model showing {vl.unasp.} as default vocal tract state
- Kahn (1976) — Syllable-based allophone rules for English stops

### Supersedes or Recontextualizes
- None

### Cited By (in Collection)
- No direct citations found in existing collection notes

### Conceptual Links (not citation-based)
- `Port_1979_ClosureDurationVoicingPlace` — Closure duration data fits the three-level framework: phonological [+/-voice] maps to phonetic categories with different closure durations
- `Zue_1976_StopConsonantAcoustics` — Acoustic analysis of stops that provides the phonetic detail data for the lowest level of this model
- `Stevens_1993_ModelsProductionAcousticsStop` — Aerodynamic models that explain the physical basis of the three phonetic categories
- `Stevens_1998_AcousticPhonetics` — Comprehensive acoustic phonetics reference that operationalizes the three-level framework
- `Hanson_2003_AspiratedStopsModels` — Models of aspirated stops, directly implementing the {vl.asp.} phonetic category
- `Haskins_StopRecognition` — Stop recognition research grounded in the cue-weighting approach that this paper's framework helps organize
