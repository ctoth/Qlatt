# Coker, Umeda, Browman (1973) — Automatic Synthesis from Ordinary English Text

## Implementation-Focused Notes

### System Architecture (Fig. 1)

Pipeline: English Text → Dictionary → Partial Syntax Analysis → Stress & Pause Assignment → Pitch & Timing Assignment → Dynamic Vocal-Tract Model → Eigenfrequency Calculation → Digital Synthesizer → Audio

The process is **hierarchical**:
1. Pauses assigned within the sentence
2. "Key word" / emphatic stresses selected
3. Stress assignments to other words
4. Higher-level assignments interpreted at successively lower levels: syllable → phoneme → time interval

### Articulatory Model (Fig. 2)

Uses approximate **orthogonalization of variables** so major articulatory gestures are accomplished with independent, noninteracting dynamics.

**Control variables:**
- X — tongue body horizontal
- Y — tongue body vertical
- B — tongue blade
- L — lip opening
- W — lip rounding
- R — tongue retroflex (added post-1967, for /θ/, /ð/, some /r/)
- N — nasal coupling (for nasals and interactions with vowels, fricatives, stops)
- G — voiced-voiceless control
- K — decouples tongue body and jaw angle for velar consonants

**Data per phoneme per variable:**
- Target values
- Priorities (relative importance of reaching each parameter target)
- Characteristic dynamics (filter time constants)

Target values presented as step functions to "characteristic filters." Priority differences can delay/advance transitions by half the rise time of the characteristic filter — causing transitions during adjacent phonemes.

### Syntax Analyzer

Based on Teranishi-Umeda design. Key features:
- Small number of grammatical categories, large number of word types
- Almost as many word classes as function words in English
- Table-driven (vs. original programmed decision tree)
- Deterministic: exactly one output per input sentence
- Locates boundaries, gives degree of separation between units
- Backtracking and "second-guessing" on word usage
- Detects specific usages: common verbs (stress decrease), particles as predicate adjectives (stress increase)

### Pause Assignment

Numerical **pause potential** assigned to every word-pair boundary via grammatical-category transition matrix:
- Low potentials: natural subject-verb-object-dangling modifier progression
- Slightly higher: long subject → verb, object → trailing modifier
- Higher: clause boundaries (reversals in grammatical category sequence)

**Pseudopauses**: smaller breaks than full pauses — vowel elongation + pitch change, but no silence. System relies more on pseudopauses for moderately rapid speech.

### Vowel Duration Model

**Equation [1]:**
```
T = K1 + S * (K2 + K3 * C)
```

Where:
- T = vowel duration (ms)
- K1, K2, K3 = per-vowel constants
- S = stress-situation factor (0–1 range, combines stress level and position relative to pause)
- C = consonant-following factor (0–1 range)

**Example values** for phoneme /ɔɪ/:
- K1 ≈ 80 ms
- K2 ≈ 130 ms
- K3 ≈ 130 ms

**Consonant following effect (Fig. 3)** — C factor ordering (longest to shortest vowel):
- Open vowels (no following C) → longest
- Voiced fricatives & clusters
- Nasals, liquids, voiced stops
- Voiceless fricatives
- Voiceless stops → shortest

**Stress-situation factor S (Fig. 4):**
- S ≈ 0: vowels in typical function words
- S ≈ 0.2-0.4: normal reading, polysyllables
- S ≈ 0.6: slow reading, monosyllables, approx. mean voiceless stops & clusters
- S ≈ 0.8: approx. mean voiced fricatives
- S ≈ 1.0: prepausal vowels (longest)

Two major pitch-change effects interact with duration:
1. Upward/downward glide immediately preceding pause
2. Conspicuous pitch drop on main vowel of important word (usually last word before pause)

Combined effect on same vowel → much greater duration increase.

### Stress Scale (Table I)

9-level stress scale with physical correlates:

| Level | Example | Boundary Consonant Elongation (ms) | Main Vowel Pitch (Hz) |
|-------|---------|------------------------------------|-----------------------|
| 1 | New nouns | 60 | 160 |
| 2 | Prepositions used as complements | 60 | 160 |
| 3 | New infrequent verbs, adjectives, adverbs, repeated nouns | 60 | 150 |
| 4 | Repeated infrequent verbs | 60 | 140 |
| 5 | Interrogatives, quantitatives | 50 | 132 |
| 6 | Frequent verbs | 40 | 125 |
| 7 | Less frequent function words | 25 | 120 |
| 8 | Ordinary function words | 10 | 115 |
| 9 | Schwa function words | 0 | 100 |

Authors note stress is likely **continuous** rather than quantized in natural speech. 3 levels adequate for short sentences; 6+ needed for paragraph-length material.

### Information Content Effect (Fig. 5)

Word duration vs. frequency of occurrence (Kucera & Francis corpus):
- Monosyllabic words: almost 10:1 range of duration across frequency
- Polysyllabic words: better than 2:1 range
- Relationship approximately 1/P (inverse of probability)

### Repeated Word Effect (Fig. 6)

F0 contour of "traveler" across multiple occurrences in a passage:
- First occurrence: highest pitch, largest pitch range
- Each repetition: progressively lower pitch and flatter contour
- Effect observed across three different speakers (DJM, RWS, CHC)

### Pitch Control

**Per-phoneme pitch targets** — not archetypical contour:
- Every phoneme gets a pitch target value
- Processed through characteristic filter (same as articulatory parameters)
- Filter is slow enough that pitch never quite reaches target (even for longest vowels)
- Based on expanded version of Pike's intonation rules
- Content/function distinction maps to the multilevel stress scale

### Word Boundary Consonant Duration

Consonant duration at word boundaries is a physical attribute of stress:
- Minimal durations for weakest function words
- Strong substantive boundaries: consonants ~60 ms longer (scaled by per-consonant "lengthening sensitivity factor")
- Boundary between two strong substantives: ~120 ms excess duration (equivalent to total duration of a small function word)

### Allophonic Variation

Two classes of allophones identified:

**1. Coarticulation allophones** — "mechanical" averaging, minimum-effort corner cutting. Produced directly by proper articulatory modeling.

**2. Intentional/voluntary allophones** — crucial for distinguishing word groups. Example: "I speak/ice peak", "at ease/a tease", "grey tie/great eye".

**Allophone scale** (one-dimensional, initial → final):
- Word-initial stressed voiceless stops: loud plosive bursts, long aspiration (>60 ms VOT)
- Initial voiced consonants: lower intensity, rapid large increase at vowel onset
- Medial position: intermediate
- Word-final voiceless stops: weakly or totally unaspirated
- Final fricatives: weak
- Final voiced consonants: louder, more syllabic

**"Grey tie" vs. "great eye" (Fig. 7):**
- /t/ in "tie": open glottis, plosive burst, >60 ms aspiration before voicing
- /t/ in "great": closed glottis, no burst, no aspiration

### Inside-Word Rules (Specific Exceptions)

- /ɪ/ conspicuously shorter before syllable-final nasal
- Voiceless stops and fricatives shorter after nasals
- Voiceless stop between consonant and weak vowel may have burst/aspiration
- Voiceless stop after voiceless consonant definitely has burst, even word-finally

Two origins for these exceptions:
1. "Lower effort" substitutions (assimilation of weak vowels by loud consonants)
2. "Higher effort" concessions to intelligibility (special aspiration of word-final voiceless stops)

## Key References from Paper

- [1] Coker 1967 — Synthesis by rule from articulatory parameters (1967 IEEE Boston Speech Conf.)
- [2] Teranishi & Umeda 1968 — Use of pronouncing dictionary in speech synthesis (6th ICA)
- [4] Pike 1945 — The Intonation of American English
- [6] Coker & Umeda 1970 — On vowel duration and pitch prominence (JASA 47:1)
- [7] Coker & Umeda 1970 — Acoustic properties of word boundaries (JASA 47:1)
- [9] Umeda & Coker 1971 — Some prosodic details of American English (JASA 49:1)
- [11] Umeda 1972 — Vowel duration in polysyllabic words (JASA 52:1)
- [12] Monsen, Molter, Umeda 1972 — Spectrographic study of allophones of voiceless stops (JASA 52:1)
- [13] Coker & Umeda 1972 — On significance of allophonic variation in voiceless stops (JASA 52:1)
