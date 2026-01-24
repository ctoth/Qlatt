# Language-Universal and Language-Specific Components in the Multi-Language ETI-Eloquence Text-to-Speech System

**Authors:** Susan R. Hertz, Rebecca J. Younes, Nina Zinovieva
**Year:** 1999
**Venue:** Proceedings 14th International Congress of Phonetic Sciences (ICPhS), San Francisco
**Affiliation:** Eloquent Technology, Inc. & Cornell University Linguistics

## One-Sentence Summary

Describes the Delta System architecture for multi-language TTS, separating language-universal components (timing templates, coarticulation patterns, voice filters) from language-specific components (phoneme inventories, formant targets, duration rules).

## Problem Addressed

How to build a scalable multi-language TTS system that maximizes code reuse while accommodating language-specific phonetic and phonological differences. Extended from American English to 9 languages/dialects in ~1 year with a team of 9 linguists.

## Languages Supported

- General American English
- British English
- Mexican Spanish, Castilian Spanish
- Canadian French, Parisian French
- Mandarin Chinese
- German
- Italian
- Brazilian Portuguese

## Key Contributions

1. **Delta representation**: Multi-tiered utterance structure with synchronized streams (sentence, phrase, word, morpheme, syllable, phone, acoustic values)
2. **Phone-and-transition model**: Segmentation based on F2 patterns - phones are articulatory targets, transitions are movements between targets
3. **Acoustic nucleus concept**: Syllable nucleus + voiced transitions into/out of nuclear phones - key timing unit
4. **Universal/specific separation**: Clear methodology for factoring rules into reusable vs. language-dependent components

## Architecture Overview

### Two Main Modules

1. **Text Module**: text → linguistic delta representation
   - Text normalization (tokenization, abbreviation expansion, number conversion)
   - Text parsing (phrases, words, morphemes, syllables, phones)

2. **Speech Module**: delta → acoustic parameters → formant synthesizer
   - Phone/transition insertion with durations
   - Acoustic nucleus grouping
   - Formant, amplitude, F0 value assignment
   - Voice filters (male/female/child/breathy/rough)
   - 5 ms frame generation for Klatt synthesizer

## Delta Representation

Multi-tiered structure with **sync marks** (vertical bars) coordinating units across streams:

```
sentence:    |sent                                                    |
inton_phr:   |phrase                    |           |phrase           |
text:        |i|t |' '|r|a|i|n|e|d|...
word:        |wrd |   |wrd      |   |wrd     |...
morph:       |root|   |root |suf|   |root |suf|...
syllable:    |syl |   |syl  |   |syl|syl  |...
phone:       |I|t |   |r|e  |n|d|   |f|a|y|v|...
```

### Stream Contents

| Stream | Contains |
|--------|----------|
| sentence | Sentence boundaries |
| inton_phr | Intonational phrases with tonal info (high/low boundary tone) |
| word | Grammatical category, prominence degree, voice characteristics |
| syllable | Lexical stress, pitch accent type (Pierrehumbert model) |
| phone | Place and manner of articulation |

## Phone-and-Transition Model

**Key insight**: Second formant (F2) patterns in spectrograms decompose into:
- **Phones**: Portions attributable to articulation of a specific segment
- **Transitions**: Portions from articulatory movement between phones

### Acoustic Nucleus

The syllable nucleus plus voiced transitions into/out of first and last nuclear phones:

```
phone:        |f    |    |a    |    |y    |    |v    |
transition:        |tr |      |tr |      |tr |      |
acoustic_nuc:           |nucleus              |      |
ms:           |110 |30 |84   |75 |10   |20 |60    |
```

For English: nucleus = vowel + tautosyllabic sonorants

### Duration Trading Relationship

Language-universal procedure:
1. Language-specific rules assign total duration to acoustic nucleus
2. Universal procedure subtracts transition and non-vowel phone durations
3. Remaining duration assigned to vowel

This captures the **trading relationship** between vowel and non-vowel durations within the nucleus.

## Acoustic Parameter Alignment

### Universal Template (all languages)

| Parameter | Alignment |
|-----------|-----------|
| Formants (F1, F2, F3...) | Edges of each phone |
| Voicing amplitude (AV) | Beginning and end of acoustic nucleus |
| Aspiration ([h], aspirated stops) | Aligned with transition |
| Stop burst | Rightmost edge of stop phone |

### Example: Word "five"

```
phone:        |f    |    |a    |    |y    |    |v    |
transition:        |tr |      |tr |      |tr |      |
acoustic_nuc:           |nucleus              |      |
AV:           |0        |52                   |30    |
AF:           |55       |0                    |55    |
F2:           |1300|    |1000|    |1200|    |1400|    |1775|    |1300|
ms:           |0   |110 |0   |30 |0   |84  |0   |75 |10  |15 |60  |
```

### Key Values

| Parameter | Phone f | Transition | Phone a | Phone y | Phone v |
|-----------|---------|------------|---------|---------|---------|
| Duration | 110 ms | 30 ms | 84 ms | 75+10 ms | 60 ms |
| AV | 0 dB | 52 dB on | - | - | 30 dB |
| AF | 55 dB | 0 dB off | - | - | 55 dB |
| F2 start | 1300 Hz | 1000 Hz | 1200 Hz | 1400 Hz | 1775 Hz |
| F2 end | - | - | - | - | 1300 Hz |

**Note**: 0 ms durations represent **non-steady-state targets** (inflection points) that shape formant contours via interpolation.

## F0 Model

Based on Pierrehumbert intonation model [1, 10]:

### F0 Alignment

- F0 values positioned relative to phone and nucleus units (not necessarily at edges)
- For pitch accents: language-specific rules determine F0 values and positions
- Sensitive to: pitch range, word prominence, voice characteristics

### Example: "five inches"

```
phone:  |f    |    |a    |    |y    |    |v    |    |I    |    |n    |...
F0:          |113 |         |122 |         |104 |         |121 |    |92 |    |85  |
ms:     |55|0 |55 |30 |84 |46|0  |29 |10|15|6 |0  |54 |40 |40  |...
```

- High tone on "five": 113 Hz → 122 Hz
- High tone on "inches": 104 Hz → 121 Hz
- Low phrase tone: 92 Hz
- Boundary tone: 85 Hz

**Rule**: Second F0 value for a tone positioned a percentage through the acoustic nucleus of the accented syllable.

## Language-Universal Components

### Text Module
- Token parsing (digit sequences, acronyms, abbreviations, punctuation)
- Phrase break selection from candidates (using minimum words/phrase)
- Sentence boundary detection (when no language-specific rule applies)

### Speech Module
- Transition insertion between adjacent phones
- Transition duration rules (based on place/manner of articulation)
- Nucleus duration allocation (trading relationship)
- Parameter alignment template
- Coarticulation rules (large subset common across languages)
- Voice filters (male/female/child/breathy/rough/high-pitched)
- Frame generation (5 ms frames to formant synthesizer)

## Language-Specific Components

### Text Module
- Text normalization rules (number pronunciation, abbreviation expansion)
- Phrase prediction rules (grammatical categories)
- Homograph disambiguation (English: "present" verb vs. noun)
- Liaison rules (French)
- Phoneme prediction from orthography
- Lexical stress assignment
- Morphological analysis

### Speech Module
- Phoneme inventory
- Formant target values for each phone (default voice)
- Total nucleus duration rules
- Pitch accent realization rules
- Specific coarticulation adjustments

## Implementation Details

### Processing Pipeline

1. Text normalization → input stream with sentence boundaries
2. Text parsing → full delta with linguistic streams
3. Transition insertion → phone-transition structure
4. Acoustic nucleus grouping
5. Duration assignment (language-specific total, universal allocation)
6. Formant/amplitude/F0 value placement
7. Voice filter modification
8. Interpolation between sync marks
9. 5 ms frame generation
10. Klatt formant synthesizer → waveform

### Voice Characteristics (per-word)

Users can annotate words with:
- Degree of breathiness
- Vocal tract size
- Pitch range
- Overall pitch level

### Diphthong Handling

Whether a "gliding vowel" is one phone or two is determined empirically based on:
- Timing patterns
- Other phonetic criteria

Example: "five" = /f a y v/ (two phones for nucleus), "rained" = /r e n d/ (one phone for nucleus, even though /e/ is diphthongized)

## Coarticulation Rules

Context-sensitive formant modifications:

- Example: F2 of /f/ raised when preceded by alveolar segment
- Example: Different F2 values at edges of /a/ based on surrounding phones

Large subset of coarticulation rules identified as **universal** across languages.

## Limitations

- Nasal status in acoustic nucleus unclear - "still investigating"
- Sample deltas in paper simplified from actual system output
- Dialect-specific components mentioned but not detailed

## Relevance to Qlatt Project

### Direct Applications

1. **Phone-and-transition segmentation**: Could improve timing model in `tts-frontend-rules.js`
2. **Acoustic nucleus concept**: Useful for vowel duration allocation
3. **Parameter alignment template**: Universal rules for where to place formant/amplitude values
4. **Trading relationship**: Vowel duration = nucleus duration - transitions - consonants

### Implementation Insights

- 5 ms frame rate for Klatt synthesizer (matches Klatt 1980)
- Non-steady-state targets (0 ms duration) as interpolation inflection points
- Voicing amplitude at nucleus boundaries (not phone boundaries)
- F0 positioning relative to nucleus percentage, not absolute time

### Coarticulation

- Formant values at phone edges, modified by context
- Large subset of coarticulation rules can be language-universal
- Consider factoring coarticulation into separate module

## Open Questions

- [ ] What exactly are the universal coarticulation rules?
- [ ] How is the "percentage through nucleus" for F0 determined?
- [ ] What phonetic criteria determine diphthong treatment?
- [ ] How do voice filters modify parameters mathematically?

## Related Work Worth Reading

1. **Hertz 1991** - "Streams, phones, and transitions" - Journal of Phonetics (detailed phone-transition model)
2. **Hertz & Huffman 1992** - Nucleus-based timing model (ICSLP proceedings)
3. **Clements & Hertz 1995** - Integrated phonology/phonetics approach
4. **Pierrehumbert 1980** - English intonation (MIT thesis) - F0 model basis
5. **Klatt & Klatt 1990** - Voice quality variations (JASA) - synthesizer reference

## Key Equations

None explicitly provided - the system is rule-based rather than equation-driven.

## Parameters

| Name | Value | Context |
|------|-------|---------|
| Frame rate | 5 ms | Synthesizer output |
| Default AV (voiceless) | 0 dB | Fricative /f/ |
| Default AF (fricative) | 55 dB | Fricative /f/ |
| Default AV (voiced) | 52 dB | Vowel onset |
| F2 /f/ (after alveolar) | 1300 Hz | Coarticulated |
| F2 /f/ → /a/ transition start | 1000 Hz | Default male |
| F2 /a/ onset | 1200 Hz | Default male |
| F2 /a/ offset | 1400 Hz | Default male |
| F2 /y/ (glide) | 1775 Hz | Default male |
| Fricative /f/ duration | 110 ms | Example |
| Transition duration | 30 ms | f→a example |
| Vowel /a/ duration | 84 ms | Example |

## Figures of Interest

- **Fig 1 (p1)**: Delta after text normalization - shows input→text stream transformation
- **Fig 2 (p1-2)**: Delta after text parsing - full multi-tiered structure
- **Fig 3 (p3)**: Phone/transition/nucleus structure for "five"
- **Fig 4 (p4)**: AV, AF, F2 alignment for "five" - **key implementation reference**
- **Fig 5 (p4)**: F0 alignment for "five inches" - prosody positioning
