---
title: "Peterson & Lehiste 1960 — Duration of Syllable Nuclei in English"
year: 1960
---

# Peterson & Lehiste 1960 — Duration of Syllable Nuclei in English

## Reference
Peterson, G. E., & Lehiste, I. (1960). Duration of syllable nuclei in English. *Journal of the Acoustical Society of America*, 32(6), 693–703. DOI: 10.1121/1.1908183

## Overview
Systematic spectrographic study of how preceding and following consonants affect the duration of stressed vowels and diphthongs in American English CNC (consonant-nucleus-consonant) words. 1263 words from one speaker (GEP), plus 70 words from five speakers.

## Key Findings for Synthesis

### 1. Voicing Effect on Nucleus Duration (Following Consonant)
The single most important finding: vowel duration is strongly conditioned by the voicing of the following consonant.

- **Ratio of vowel before voiceless to voiced consonant: approximately 2:3**
- Average nucleus before voiceless final consonant: 19.7 csec (from 1263-word set)
- Average nucleus before voiced final consonant: 29.7 csec (from 1263-word set)
- For minimal pairs (5 speakers, 30 pairs): voiceless = ~20 csec, voiced = ~30 csec

### 2. Following Consonant Manner Effects (Table II)
Duration of syllable nuclei as a function of the following consonant (csec):

| Following consonant | Short nucleus | Long nucleus |
|---------------------|--------------|--------------|
| p | 13.8 | 18.8 |
| b | 20.3 | 30.7 |
| t | 14.7 | 21.0 |
| d | 20.6 | 31.8 |
| k | 14.5 | 20.0 |
| g | 24.3 | 31.4 |
| m | 22.0 | 31.3 |
| n | 21.6 | 32.2 |
| ng | 21.8 | 35.0 |
| f | 19.2 | 26.1 |
| v | 23.1 | 37.4 |
| theta | 20.8 | 26.5 |
| eth | 26.0 | 38.1 |
| s | 19.9 | 26.9 |
| z | 26.2 | 39.0 |
| sh | 21.2 | 27.8 |
| zh | ... | 41.0 |
| r | 22.6 | 29.6 |
| l | 21.8 | 29.3 |
| ch | 14.5 | 19.8 |
| j | 19.1 | 30.0 |

**Ordering by manner class (nucleus duration, longest to shortest):**
1. Voiced fricatives (longest)
2. Voiced plosives / nasals (similar)
3. Voiceless fricatives
4. Voiceless plosives (shortest)

Affricates [ts] and [dz] pattern like plosives.

### 3. Intrinsic Vowel Duration (Table I)
Average intrinsic durations of syllable nuclei in American English (csec), computed from minimal pairs differing only in voicing of following consonant:

| Syllable nucleus | 5 speakers (csec) | GEP minimal pairs (csec) | All CNC list (csec) |
|------------------|-------------------|--------------------------|---------------------|
| i (as in "bit") | 24 | 20.6 | 20.7 |
| I (as in "beat") | 18 | 16.0 | 16.1 |
| eI | 27 | 24.3 | 20.0 |
| epsilon | 20 | 20.3 | 20.4 |
| ae | 33 | 28.0 | 28.4 |
| schwa | 23 | 19.3 | 18.1 |
| a (as in "cot") | 26 | 26.1 | 26.5 |
| open-o | 31 | 26.5 | 25.0 |
| oU | 22 | 22.0 | 22.2 |
| U (as in "book") | 20 | 16.3 | 16.3 |
| u | 26 | 23.8 | 23.5 |
| aU | 30 | 30.2 | 30.2 |
| aI | 22 | 30.3 | 31.0 |
| oI | 37 | 36.0 | 36.0 |
| r-colored | 24 | 25.3 | 25.6 |

**Two durational classes:**
- **Short nuclei:** [I], [epsilon], [U], [schwa] — approximately 16-20 csec
- **Long nuclei:** [i], [eI], [ae], [a], [open-o], [oU], [u], [r], [aU], [aI], [oI] — approximately 22-36 csec

### 4. Initial Consonant Effect
- Initial consonants have **negligible effect** on nucleus duration
- No discernible voicing contrast for initial consonants (Fig. 8)
- Exception: aspiration after initial voiceless plosives is part of the consonant, not the vowel
  - Average aspiration duration: /p/ = 5.8 csec, /t/ = 6.9 csec, /k/ = 7.5 csec
  - Aspiration increases with place of articulation moving back

### 5. Segmentation Criteria
Useful for determining measurement boundaries in spectrograms:
- **Initial plosives:** boundary at center of release spike (voiceless) or onset of voicing after aspiration (voiced)
- **Final plosives:** boundary at cessation of periodic energy or major change in harmonic marking
- **Initial/final nasals:** identified by abrupt change from steady formant pattern to rapid singlet movement; nasal/oral boundary marked by change in harmonic marking
- **Initial/final fricatives:** onset/offset of voicing for voiced fricatives; onset/offset of high-frequency noise energy for voiceless
- **Initial/final /l/:** frequency change in third formant used as boundary marker
- **Initial/final /r/:** third formant frequency minimum or rapid rise used as boundary

### 6. Tempo and Speaker Rate
- Average frame duration for 5 speakers: 122, 130, 144, 150, 177 csec (mean 144 csec)
- Average frame for GEP (1263 words): 174 csec, standard deviation 6.9 csec
- Test word represents only 3-5% of total interval duration
- Variation in frame duration at a given speaker rate: approximately 5-15 csec
- Stressed words decreased in duration by factor ~1.5 when rate doubled; unstressed words decreased more

### 7. Acknowledgment of Fant
The authors acknowledge C. Gunnar M. Fant of KTH Stockholm for providing mingograph tracings and continuous spectrograms used in the analysis.

## Implementation Notes for Klatt Synthesizer

### Duration Rules
1. **Voicing-conditioned duration multiplier:** For vowels before voiced consonants, multiply intrinsic duration by approximately 1.5 relative to voiceless context. This is the most important duration rule.
2. **Manner-conditioned duration:** Within voiced consonants, fricatives produce longer preceding vowels than plosives. Within voiceless consonants, the ordering is similar but compressed.
3. **Intrinsic duration table (Table I):** Use as baseline durations. The four short vowels [I, epsilon, U, schwa] are approximately 60-70% the duration of the long vowels.
4. **Initial consonant:** No duration adjustment needed for initial consonant voicing.
5. **Aspiration:** Model as part of the consonant segment, not the vowel. Duration depends on place of articulation.

### Cross-references
- House & Fairbanks (1953) — earlier study of vowel duration conditioning by consonant context
- Denes (1955) — additional duration data
- Lehiste & Peterson (1959) — companion study, more detail on CNC list
- Crystal & House (1988) — later study extending to connected speech (already in collection)
- Klatt (1976) — duration model that builds on these findings (already in collection)

## Collection Cross-References

### Already in Collection
- `Crystal_House_1988_StopConsonantDuration` — Later study extending vowel duration conditioning to connected speech
- `Klatt_1976_SegmentalDuration` — Duration model that builds directly on these voicing-conditioned duration findings
- `Hillenbrand_1995_VowelAcoustics` — Updated vowel acoustics measurements comparable to the intrinsic duration data here

### New Leads
- House & Fairbanks (1953) — "The influence of consonant environment upon the secondary acoustical characteristics of vowels." Direct predecessor studying consonant influence on vowel duration
- Denes (1955) — "Effect of duration on the perception of voicing." Duration as a perceptual cue for voicing
- Lehiste & Peterson (1959) — Companion study with detailed CNC word list

### Supersedes or Recontextualizes
- None

### Cited By (in Collection)
- `Port_1979_ClosureDurationVoicingPlace` — Cites Peterson & Lehiste 1960 for vowel duration data conditioned by consonant voicing
- `Klatt_1976_SegmentalDuration` — Duration model builds on these findings (noted in Cross-references above)

### Conceptual Links (not citation-based)
- `vanSanten_1993_SegmentalDuration` / `vanSanten_1994_SegmentalDurationTTS` — Alternative duration modeling approaches that address the same voicing-conditioned duration phenomena
- `Campbell_Isard_1991_SegmentDurationsSyllable` — Segment durations in syllable context, complementary to this CNC-word study
- `Wightman_1992_SegmentalDurationsProsodic` — Prosodic effects on segmental duration, extending beyond the segmental conditioning studied here
- `Edwards_1988_ArticulatoryTimingProsodicInterpretation` — Argues that duration effects from different prosodic sources (stress vs phrase-final) are qualitatively different, not just quantitative scaling of the kind measured here
