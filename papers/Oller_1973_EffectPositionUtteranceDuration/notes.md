---
title: "Oller 1973 — The Effect of Position in Utterance on Speech Segment Duration in English"
year: 1973
---

# Oller 1973 — The Effect of Position in Utterance on Speech Segment Duration in English

## Implementation-Relevant Summary

This paper provides the foundational empirical data for position-in-utterance duration rules. It quantifies final-syllable lengthening, initial-consonant lengthening, and their interaction with stress, intonation type, and syllable structure. The data directly inform Klatt 1976 Rules 4 (phrase-final lengthening), 7 (non-initial shortening), and related positional duration adjustments.

## Key Findings

### 1. Final-Syllable Vowel Lengthening (Experiment 1)

- **Average increment**: ~100 msec for both stressed and unstressed final-syllable vowels
- Stressed vowels: 5 of 7 subjects show greater increments for stressed vowels (range: 70-160 msec)
- The rightmost vowel in each word cluster is invariably longer than any other vowel
- Effect is consistent across all 7 subjects — no subject fails to show it

### 2. Final-Syllable Consonant Lengthening (Experiment 1)

Unstressed consonants show three distinct positional increments:
- **Absolute final**: ~20 msec increment
- **Penultimate**: ~15 msec increment
- **Word-initial**: ~30 msec increment over medial consonants

For stressed consonants, increments are virtually zero for penultimate and ~20 msec for word-initial.

Penultimate stressed consonant lengthening does NOT reach statistical significance (p > 0.05).

### 3. Intonation Type Does Not Eliminate Lengthening (Experiment 2)

- Final-syllable vowel lengthening occurs in declarative, interrogative, AND imperative utterances
- For interrogative (S1): ~100 msec stressed, ~130 msec unstressed vowel increments
- For declarative (S1): ~90 msec stressed, ~80 msec unstressed
- Weak trend: interrogative utterances may show slightly greater increments (but t-test of unstressed data only: t=3.78, df=3, p<0.05)
- Initial-consonant lengthening also present across all intonation types

### 4. Phrase-Final AND Word-Final Lengthening (Experiment 3)

- Final-syllable vowel increments occur in both phrase-final and word-final positions
- S1's average unstressed vowel increment: phrase-final ~92 msec, word-final ~96 msec
- These are comparable to utterance-final increments (~100 msec from Exp. 1)
- Trend toward lesser magnitude in word-final vs utterance-final, approaching but not reaching statistical significance (t=1.92, df=15, p<0.10)
- Final consonant increments in phrase-final and word-final positions are small (~4 msec)

### 5. Various Syllable Structures (Experiments 4-8)

| Inventory | Stressed vowel increment | Unstressed vowel increment |
|-----------|------------------------|---------------------------|
| [baib] diphthong | 112 msec | 76 msec |
| [sas] fricative | — | 136 msec (unstressed only available) |
| [stast] cluster | 96 msec | 88 msec |
| [ba] open syllable | 48 msec (stressed) | 32 msec (unstressed) |
| [pap] voiceless stop | 40 msec (seg. 2) | 0 msec (seg. 2) |

Key observations:
- Open syllables (CV) show final-syllable lengthening but of lesser magnitude
- Absolute final fricatives [s] show very large increments — the largest consonantal increment of any experiment
- Consonant clusters [st] also show lengthening for both components
- Voiceless stops [p] differ from voiced stops [b] — under Segmentation 2 (aspiration excluded from vowel), stressed vowels lengthened by ~40 msec, unstressed by 0

### 6. Consonantal Increment Summary (Table II — Experiment 1)

| Position | S1 Interrog. stressed | S1 Interrog. unstressed | S1 Declar. stressed | S1 Declar. unstressed | S2 Declar. stressed | S2 Declar. unstressed |
|----------|----------------------|------------------------|--------------------|-----------------------|--------------------|-----------------------|
| Initial  | 8 | 24 | 8 | 16 | 24 | 32 |
| Penult.  | 0 | 16 | 8 | 8 | 0 | 8 |
| Final    | ... | 40 | ... | 24 | ... | 0 |

### 7. Consonantal Increments by Syllable Type (Table III)

| Inventory | Initial (stressed/unstressed) | Penultimate (stressed/unstressed) | Final (stressed/unstressed) |
|-----------|------------------------------|-----------------------------------|---------------------------|
| [baib]    | 16/-4 | -4/-4 | .../16 |
| [sas]     | 8/20 | 16/16 | .../136 |
| [stast]   | 24/32 | 8/16 | .../48 |
| [ba]      | 32/32 | 16/16 | .../.-- |
| [pap] S1  | 20/32 | 12/8 | .../.-- |
| [pap] S2  | 24/40 | 8/24 | .../0 |

### 8. Absolute Final Fricative Lengthening

- Absolute final [s] shows by far the greatest consonantal increment: 136 msec (unstressed)
- This is dramatically larger than final [b] increments (~20 msec)
- Oller suggests this requires a separate explanation related to differential termination mechanisms for fricatives vs stops in final position

## Theoretical Explanations Discussed

1. **Boundary cue theory** (Haden): Lengthening serves as an acoustic cue to listeners about word/phrase/sentence boundaries. Supported by the finding that lengthening occurs at word-final and phrase-final, not just utterance-final positions.

2. **Lindblom's constant-energy theory**: Total speech energy per syllable is constant; lower intensity in final syllables is compensated by increased duration. Oller presents several objections:
   - No amplitude drop occurs for interrogative utterances, yet lengthening still occurs
   - Amplitude drop may occur over last 2-4 syllables, but duration increment applies only to the final syllable

3. **Planning theory**: Pre-articulatory planning operates in two stages — stage one plans prosodic units (phrases, sentences), stage two plans individual syllables. When stage-two planning of a word-final syllable occurs, stage-one must shut off, causing a durational increment. This would make final-syllable lengthening a language universal.

## Implementation Rules for Klatt-style Synthesizer

Based on this data, the following duration modifications apply:

1. **Final-syllable vowel**: multiply by factor producing ~100 msec increment (or add 100 msec for stressed, 100 msec for unstressed vowels in final syllables)
2. **Word-initial consonant**: add ~20-30 msec
3. **Penultimate consonant**: add ~15 msec (unstressed only; effect marginal for stressed)
4. **Absolute final consonant**: add ~20 msec for stops; much larger for fricatives
5. **Absolute final fricative**: add up to ~136 msec (this is an exceptionally large effect)
6. Effects apply across intonation types (declarative, interrogative, imperative)
7. Effects apply at word-final and phrase-final boundaries, not only utterance-final

## Connection to Klatt 1976

Klatt 1976 incorporates these findings primarily through:
- **Rule 4** (phrase-final lengthening): Directly informed by Oller's Experiments 1-3
- **Rule 7** (non-initial shortening): Related to Oller's word-initial consonant lengthening finding
- The specific magnitudes in Klatt's rules are calibrated against Oller's measurements among other sources

## Collection Cross-References

### Already in Collection
- `Klatt_1976_SegmentalDuration` — Klatt 1976 directly builds on Oller's positional measurements for Rules 4 and 7
- `Wightman_1992_SegmentalDurationsProsodic` — extends positional duration work to prosodic boundaries
- `White_2014_ProsodicTimingFunction` — references Oller in context of timing and prosodic structure

### Cited By (in Collection)
- `Klatt_1976_SegmentalDuration` — duration model directly builds on Oller's positional data
- `Klatt_1973_DurationStopConsonantClusters` — related duration work
- `Wightman_1992_SegmentalDurationsProsodic` — cites Oller on positional lengthening
- `White_2014_ProsodicTimingFunction` — cites Oller on prosodic timing
- `Beckman_1990_LengtheningsShorteningsProsodic` — cites Oller on position-in-utterance effects
- `Crystal_1982_SegmentalDurationsConnectedSpeech` — references Oller's positional effects
- `Campbell_Isard_1991_SegmentDurationsSyllable` — cites Oller on duration
- `vanSanten_1994_SegmentalDurationTTS` — references Oller's duration data

### New Leads
- Lindblom 1968 — Temporal organization of syllable production
- Barnwell 1970 — Algorithm for segment durations in a reading machine context (MIT thesis)
- Lehiste 1971 — Temporal organization in spoken language

### Conceptual Links (not citation-based)
- `Crystal_House_1988_StopConsonantDuration` — Both measure positional duration effects; Crystal & House extend to connected speech
- `vanSanten_1994_AssignmentSegmentalDuration` — Formalizes positional duration effects into a computational model
- `Umeda_1975_VowelDurationAmericanEnglish` — Complementary large-corpus vowel duration study with multiplicative rule model
