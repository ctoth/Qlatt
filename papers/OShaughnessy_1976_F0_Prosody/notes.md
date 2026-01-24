# Modelling Fundamental Frequency, and Its Relationship to Syntax, Semantics, and Phonetics

**Author:** Douglas O'Shaughnessy
**Year:** 1976
**Venue:** MIT PhD Thesis, Department of Electrical Engineering and Computer Science
**Supervisor:** Jonathan Allen

## One-Sentence Summary

A comprehensive rule-based system for generating F0 contours in text-to-speech that models intonation as a two-level architecture: a High Level System (HLS) mapping semantic/syntactic information to prosodic indicators, and a Low Level System (LLS) converting those indicators to actual F0 values with phonetic adjustments.

## Problem Addressed

Prior TTS systems lacked principled models for generating natural-sounding F0 (fundamental frequency) contours. This thesis develops a complete rule-based algorithm that:
1. Assigns accent levels to words based on their syntactic class and semantic importance
2. Places phrase boundaries and continuation rises based on syntax
3. Generates F0 peaks, rises, and falls following declination and phonetic constraints
4. Handles questions, statements, focus transformations, and other sentence types

## Key Contributions

1. **Two-Level F0 Architecture**: HLS (psychological/linguistic) + LLS (physiological/phonetic) design
2. **Accent Priority List**: 16-level word class hierarchy determining inherent accent potential
3. **Prosodic Indicators (PIs)**: Formal representation linking syntax/semantics to F0 (accent, break, CR, level, Tune)
4. **Quantitative F0 Rules**: Specific percentages and Hz values for generating contours
5. **Sub-contour (SC) Model**: Rise-peak-fall patterns superimposed on declination
6. **P-unit (Phonological Unit)** concept: Syntactically coherent phrases marked by rise+level+fall F0 pattern
7. **Comprehensive phonetic adjustments**: Consonant voicing, vowel height, separation, competition effects

## Methodology

- Recorded 5 speakers (JA, KS, ML, DO, DK) reading carefully constructed test sentences
- Extracted F0 contours at 10 msec intervals using Gold & Rabiner (1969) algorithm
- Linearized F0 contours to straight-line segments for analysis
- Systematically varied syntactic structures, word classes, discourse contexts
- Derived quantitative rules from statistical analysis of F0 measurements
- Validated by comparing predicted vs. actual F0 contours

## Key Equations

### Head Peak Calculation
```
head_peak = min(185, (123 - 8*num_clauses) + (12 - 2*num_clauses) * num_phrases)
```

### F0 Room (Available Range)
```
F0_room = head_peak - baseline
  where baseline = 110 Hz (Tune A/statement)
                 = 125 Hz (Tune B/question)
```

### Peak Differential Between Accented Syllables
```
drop_per_AS = F0_room / num_ASs_in_clause
```

### Peak Adjustment by Accent Number
```
peak += (accent_number - 8) * 0.10 * local_F0_room
```

### Rise Accent on Accented Syllable
```
rise = 0.40 * local_F0_room
if word.break != 0:
    rise += 0.20 * break * rise
```

### Fall Accent on Accented Syllable
```
fall = -0.20 * local_F0_room
if word.break != 0:
    fall += break * 0.20 * local_F0_room
```

### Continuation Rise
```
CR_value = CR_number * 8 Hz
```

### US (Unaccented Syllable) F0 Drop Distribution
```
If 3+ USs in sequence outside P-unit:
  US1 gets 45% of (AS_endpoint - 105)
  US2 gets 35%
  US3 gets 20%
```

### Declination Rate
```
~3% per 100 msec at utterance start
Decays exponentially to ~0.5% per 100 msec after 5 seconds
```

## Parameters

### Speaker Reference Values

| Parameter | Value | Units | Notes |
|-----------|-------|-------|-------|
| Standard F0 range | 100 | Hz | Reference speaker range |
| Bottom of Range (BOR) | 85 | Hz | Lowest normal F0 |
| BOR band | 95-110 | Hz | Where F0 "bottoms out" |
| Male BOR center | ~93 | Hz | Average across speakers |
| Head peak base | 115 | Hz | For 2-phrase utterance |
| Head peak max | 185 | Hz | Upper saturation limit |
| Phrase increment | +10 | Hz | Per additional phrase |
| Utterance minimum | BOR - 15 | Hz | Final F0 at sentence end |

### Accent Thresholds

| Parameter | Value | Notes |
|-----------|-------|-------|
| Accented syllable (AS) | accent >= 5 | Gets F0 peak |
| Unaccented syllable (US) | accent < 5 | Follows declination |
| Head syllable | first accent > 5 | Highest peak in clause |

### Timing Parameters

| Parameter | Value | Units | Notes |
|-----------|-------|-------|-------|
| Rise timing | ~50 | msec before vowel | For prominence |
| Fall timing | ~50 | msec after vowel onset | For prominence |
| Abrupt rise rate | 25-35% | F0/100 msec | Fast rises |
| Abrupt fall rate | 40-50% | F0/100 msec | Falls are steeper |
| JND for rise | 1.5 | semitones | Perceptual threshold |
| JND for fall | 3.0 | semitones | Falls less salient |
| Smoothing threshold | 50 | msec | Variations < 50ms averaged |

### Voicing Effect Parameters

| Parameter | Value | Notes |
|-----------|-------|-------|
| Unvoiced initial boost | +20% | Peak F0 after voiceless C |
| Unvoiced jump:rise | 80:20 | Most rise before vowel |
| Voiced jump:rise | 20:80 | Most rise during vowel |
| Unvoiced fall:drop | 1:2 | More drop after nucleus |
| Voiced fall:drop | 4:1 | More fall within nucleus |
| Voicing interrupt recovery | +1 semitone | F0 rises after resumption |

### Separation Effects

| Parameter | Value | Notes |
|-----------|-------|-------|
| Adjacent AS reduction | -40% | Both rise accents reduced |
| Adjacent first peak | -20% | Of local room |
| Adjacent second peak | +20% | Of local room |
| Extra US (+1) rise boost | +15% | For better separation |
| Extra US (+2) rise boost | +10% | Diminishing returns |
| AS inhibition duration | ~3 USs | After AS, inhibits next |

### Question Parameters

| Parameter | Value | Notes |
|-----------|-------|-------|
| Question endpoint F0 | 170-190 Hz | Cues QUESTION |
| Statement endpoint F0 | 70-100 Hz | Cues STATEMENT |
| Terminal rise slope | 0.6 Hz/msec | For 60 Hz total rise |
| Tune B final rise | +20% | Above highest prior peak |

## F0 Rules and Algorithms

### Syntactic Effects on F0

#### Terminal Pattern Selection (Tune A vs Tune B)

1. **Statements/Exclamations**: Tune A (falling terminal)
   - F0 falls to ~85 Hz at utterance end
   - Exception: tag question gets Tune A before question, Tune B on tag

2. **Yes/No Questions**: Tune B (rising terminal)
   - F0 stays above BOR throughout
   - Final syllable rises to 20% above highest prior peak
   - Rise spread gradually over post-stress syllables

3. **Wh-Questions**: Tune A (falling) but higher register
   - Wh-word receives heavy accent (like quantifier)
   - Large peak differential to next accent
   - Falls to low value at end

#### Phrase Boundary Markers

1. **Clause boundaries**: F0 break with fall+CR pattern
   - Independent clause: break = -4, CR = 3
   - Dependent clause (first): break = -2, CR = 1
   - Dependent clause (second): break = -3, CR = 2

2. **Intra-clause boundaries**: Allocate 1 break per 4 content words
   - Place at strongest syntactic boundary
   - Even word counts between breaks

3. **Syntactic transformation boundaries**:
   - Focus/clefting: break = -4
   - There-insertion: break = -3
   - Preposing: break = -2, CR = 1
   - Left-offsetting: break = -4, CR = 2-3
   - Right-offsetting: break = -4 (no CR, afterthought)

#### Continuation Rises (CRs)

Two types:
1. **Fall+Rise CR**: Most common; follows Tune A fall, then rises
2. **Monotonic CR**: No prior fall; used for lists, quantifier scope, gnomic expressions

CR size depends on:
- Strength of syntactic boundary (major = larger)
- Length of following material (longer = larger)
- Information importance (more important = larger)

### Semantic Effects on F0

#### Accent Priority List (Word Class Hierarchy)

| Rank | Word Class | Accent Value |
|------|------------|--------------|
| 1 | Sentential adverbs | 14 |
| 2 | Negative adverbs | 12 |
| 3 | Interrogative words | 11 |
| 4 | Quantifiers | 10 |
| 5 | A modals (may, might, must) | 9 |
| 6 | Reflexive pronouns | 8 |
| 7 | Nouns, adjectives, ordinary adverbs, negative contractions | 7 |
| 8 | Finite verbs, demonstrative pronouns | 6 |
| 9 | Personal pronouns | 3 |
| 10 | Prepositions, aux's, B modals (will, would, can), vocatives | 2 |
| 11 | Conjunctions, relative pronouns | 1 |
| 12 | Articles | 0 |

Words with accent 0-3 are function words; 6-14 are content words and MOs.

#### Accent Modifications

| Condition | Adjustment |
|-----------|------------|
| Multisyllabic word | +2 |
| Second word of compound | -5 |
| Focus transformation (cleft) | +4 on focused |
| Other focus transformation | +3 on focused |
| Passive transformation | +2 on verb |
| Repeated word | -3 |
| Anaphoric reference | -3 (unless subset) |
| Parallel positions (non-final) | +2 |
| Parallel positions (final) | +1 |
| Contrastive stress | +4, others -2 |
| Quotation | +2 on quoted content |
| Indirect object | -1 |

#### New vs. Old Information

The fundamental principle: **Words least predictable in context receive heaviest accents.**

- First mention: full accent
- Repeated word: reduce by -3
- Anaphoric reference: reduce unless disambiguation needed
- Q/A context: words from question are "old" in answer
- Parallel structures: may increase accents despite repetition

### Phonetic Effects on F0

#### Consonant Voicing Effects

**After unvoiced consonant onset**:
- F0 starts 20% higher
- Peak occurs at vowel onset
- F0 falls immediately through vowel
- Prior jump = 80% of rise; nucleic rise = 20%

**After voiced consonant onset**:
- F0 starts lower
- Peak occurs in middle of vowel
- Smooth rise through syllable nucleus
- Prior jump = 20% of rise; nucleic rise = 80%

#### Vowel Height Effect
- Higher vowels (/i/) have higher F0 (~23 Hz higher than /a/)
- Larger accent rises on high vowels

#### Sub-contour (SC) Shape

Basic pattern:
1. F0 rises to peak on accented syllable
2. Rounds off at peak
3. Falls exponentially toward BOR
4. "Bottoms out" at lower declination line

Variations:
- If unvoiced initial consonant: omit rise (starts at peak, falls)
- Secondary accent: smaller fall, intermediate level
- P-unit: rise + relatively level + fall over multiple syllables

#### Declination Model

- Upper line: connects successive F0 peaks
- Lower line: connects successive valleys (BOR)
- Lines converge and decrease monotonically
- Shape: between straight and exponentially concave-upward

Peak drop-off by utterance length:
| Sub-contours | Avg Drop per Peak |
|--------------|------------------|
| 2 SCs | -38 Hz |
| 3 SCs | -24 Hz |
| 4 SCs | -17 Hz |
| 5 SCs | -10 Hz |

#### Anticipation Effect

Speaker raises initial F0 for longer utterances:
- Base = 152 Hz for 2-phrase utterance
- +12 Hz per additional phrase (up to 5)
- Saturates at ~188 Hz
- Multi-clause: +20 Hz higher than single-clause

#### Competition Effect

More accented syllables = less accent per syllable:
- American English shows "smaller but more peaks" in longer sentences
- Each AS inhibits following AS for ~3 USs
- Total accent "budget" distributed across ASs

## Implementation Notes

### Two-Pass Architecture

**Pass 1 (HLS)**: For each word, compute:
- `accent`: Integer from word class + modifications
- `break`: Positive (rise) or negative (fall) at phrase boundary
- `CR`: Continuation rise size and type
- `level`: Hold (+1), drop (-1), or default (0)
- `Tune`: 'A' (fall), 'B' (rise), or null

**Pass 2 (LLS)**: For each syllable, compute:
- Prior jump or drop (Hz)
- Rise or fall in nucleus (Hz)
- Peak F0 value (Hz)

### Syllable Nucleus Definition

Nucleus = section with energy > 40% of maximum on that syllable:
- Entire vowel
- ~50% of sonorants (/l, r, w, y/)
- Little of nasals or voiced obstruents

### P-unit Detection

Group words into P-units based on syntax:
- Each major syntactic phrase (NP, VP, PP) forms one P-unit
- First AS gets sharp rise (+17 to +35 Hz)
- Medial syllables: gradual decline (-4 to -6 Hz/syllable)
- Final AS gets sharp fall (-30 to -38 Hz)

### Position-Dependent F0

| Position | Peak (Hz) | Pattern |
|----------|-----------|---------|
| Utterance-final | 126 | Sharp fall below BOR |
| Phrase-final | 148 | Fall + CR (+7-19 Hz) |
| Within-phrase | 149 | Slow fall, above BOR |

### Speaker Adaptation

To adapt for different speakers:
1. Scale all F0 changes by ratio of speaker's range to 100 Hz
2. Add offset = (speaker's BOR - 85 Hz) to all peaks
3. Use speaker-appropriate fall:drop ratio

### Post-processing

The algorithm outputs linearized F0 segments. For synthesis:
- Apply low-pass smoothing filter
- Interpolate through unvoiced regions

## Figures of Interest

| Figure | Page | Description |
|--------|------|-------------|
| Fig. 3 | 72 | F0 accent components: jump, rise, peak, fall, drop |
| Fig. 4 | 92 | Hierarchical F0: sentence, phrase, word, phoneme levels |
| Fig. 5 | 92 | Voicing effect on F0 shape |
| Fig. 6 | 94-97 | Sub-contour forms: normal, secondary accent, P-unit |
| Fig. 136 | 369 | Block diagram: HLS + LLS architecture |
| Fig. 137 | 373 | Sentence-level tune assignment flowchart |
| Fig. 138 | 374 | Phrase-level break/CR assignment flowchart |
| Fig. 139 | 377 | Word-level accent assignment flowchart |
| Figs. 140-146 | 383-389 | LLS algorithm flowcharts |
| Figs. 147-148 | 391+ | Predicted vs. actual F0 contours |

## Results Summary

- Algorithm produces F0 contours closely matching natural speech
- Predicted and actual contours aligned well for test sentences
- Rules derived from statistical analysis of multi-speaker data
- System handles declaratives, questions, focus, parallelism, discourse
- Speaker variation can be modeled by parameter scaling

## Limitations

1. **English-specific**: Rules derived from American English speakers only
2. **Read speech**: Data from careful lab recordings, not spontaneous speech
3. **Limited emotions**: No modeling of emotional/attitudinal F0 effects
4. **Five speakers**: May not capture full range of individual variation
5. **Syntax required**: Needs accurate syntactic parse as input
6. **No duration model**: Assumes durations are separately computed
7. **Linear approximation**: Real F0 is smoother than piecewise linear output
8. **Limited discourse**: Paragraph effects modeled but not full discourse structure

## Relevance to TTS

This thesis provides the foundational framework for Qlatt's prosody system:

1. **Word class accent assignment**: Implement the 16-level priority list as base F0 targets
2. **Declination**: Use the exponential decay model with phrase-based reset
3. **Phrase boundaries**: Implement break/CR system for syntactic grouping
4. **Question intonation**: Tune A vs Tune B selection based on sentence type
5. **Phonetic adjustments**: Apply voicing-based jump:rise ratios
6. **Competition/separation**: Scale accents by AS density

Key implementation priorities:
- POS tagging to determine word class
- Syntactic parse for phrase boundary detection
- Discourse tracking for new/old information
- Smooth F0 generation with proper timing

## Open Questions

1. How do emotional states modify these rules?
2. How does speaking rate interact with F0 patterns?
3. How to handle disfluencies, repairs, hesitations?
4. How do prosodic rules differ across English dialects?
5. Can neural networks learn these patterns from data?
6. How to integrate with duration and intensity models?

## Related Work

Papers cited that may be worth reading:

- **Klatt (1973)**: "Discrimination of fundamental frequency contours in synthetic speech" - JASA
- **Mattingly (1966, 1968)**: Rule synthesis of prosodic features
- **Lea (1973)**: Segmental/suprasegmental influences on F0
- **'t Hart & Cohen (1973)**: Dutch intonation research
- **Bolinger (1958, 1972)**: Intonation theory
- **Lieberman (1967)**: Intonation, Perception, and Language
- **Collier (1974, 1975)**: Physiological correlates of intonation
- **Olive & Nakatani (1974)**: Rule-synthesis by word concatenation
- **Pierrehumbert (later work)**: ToBI autosegmental-metrical theory (post-dates thesis)
