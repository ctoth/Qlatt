# Pages 400-439 Notes

## Chapters/Sections Covered
- **Appendix** (pp. 400-402): Test paragraph sets C, D, E, F used for experimental recordings
- **Bibliography** (pp. 403-417): Comprehensive bibliography on intonation, prosody, and F0 research
- **Figures Section** (pp. 418-439): Detailed figure legends and F0 contour plots

## Key Findings

### Test Paragraphs (Appendix)
The appendix contains carefully constructed test paragraphs used in the experimental portion of the thesis. These paragraphs were designed to elicit specific prosodic patterns:

- **Set C**: Narrative paragraphs about "Joe" with various sentence structures
- **Set D**: Paragraphs about "Joe Smith" with embedded questions and statements
- **Set E**: Varied sentence types (questions, statements, commands)
- **Set F**: Simple sentences for testing specific prosodic features

The paragraphs contain numbered target sentences (underlined in original) for F0 analysis, designed to test various syntactic structures and their effects on intonation.

### Figure Legends - Critical Implementation Details

#### Three Types of F0 Accent (Fig. 3, p. 429)
1. **Rise accent**: Jump followed by rise, fall, drop
2. **Basic primary accent**: Jump followed by fall and drop
3. **Fall primary accent**: Fall-off followed by fall-off
4. **Secondary accent**: Smaller fall-off patterns

#### Hierarchy of F0 Patterns (Fig. 4, p. 429)
Four hierarchical levels affecting F0:
- a) **Utterance level**: Overall contour shape
- b) **Clause/phrase level**: Phrase-level patterns
- c) **Word level**: Word accent patterns
- d) **Phoneme level**: Segmental effects

#### Effect of Initial Consonant Voicing (Fig. 5, p. 430)
- **Unvoiced initial consonant**: F0 starts higher, falls more steeply
- **Voiced initial consonant**: F0 starts lower, more gradual rise

#### Sub-contour Forms (Fig. 6, p. 430)
Three forms of F0 sub-contours:
- a) **Normal sub-contour**: Standard rise-fall pattern
- b) **Sub-contour with secondary accent**: Additional prominence marker
- c) **Sub-contour of a phonological unit**: Smallest prosodic unit

### F0 Distribution Statistics (Figs. 8-13, pp. 431-433)

#### F0 Peak Values (Fig. 8)
| Symbol | Description | Mean (Hz) | SD | N |
|--------|-------------|-----------|-----|-----|
| o | "Say" final Fo | 114.8 | 4.0 | 229 |
| x | Word X peak Fo | 111.1 | 5.5 | 226 |
| & | "instead" peak Fo | 95.1 | 3.9 | 226 |

#### F0 Rise Accents (Fig. 9)
| Symbol | Context | Mean (Hz) | SD | N |
|--------|---------|-----------|-----|-----|
| o | Word X (1st syl, unvoiced) | +3.2 | 4.0 | 87 |
| x | Word X (1st syl, voiced) | +6.9 | 3.6 | 110 |
| & | Word X (2nd syl stressed) | +16.1 | 5.1 | 15 |
| + | Word X (monosyl, unvoiced) | +1.1 | 1.7 | 9 |
| * | Word X (monosyl, voiced) | +4.5 | 5.1 | 8 |
| $ | "instead" | +17.3 | 4.1 | 229 |

#### F0 Fall/Descent Statistics (Figs. 10-13)
**Fall accents on AS of word X:**
| Symbol | Context | Mean (Hz) | SD | N |
|--------|---------|-----------|-----|-----|
| o | 1st syl unvoiced | -23.9 | 7.3 | 87 |
| x | 1st syl voiced | -18.1 | 6.5 | 110 |
| $ | 2 separate words | -19.7 | 7.7 | 101 |
| @ | Not decomposable | -21.7 | 7.1 | 96 |

**Fall-off values:**
- Mean fall-off (o): -1.9 Hz, SD = 2.9, N = 194
- Mean fall-off (x): -3.8 Hz, SD = 2.9, N = 32

### Simplified F0 Generation Block Diagram (Fig. 136, p. 427)
The thesis describes a block diagram for rule-based F0 generation with these components:
- Input: Phonetic/phonological representation
- Processing stages for different prosodic levels
- Output: F0 contour

### Sentence Structure Notation (pp. 420-421)
The thesis uses a systematic notation for sentence types:
- **Capital letters**: Primary-accented words (e.g., "JOE")
- **Symbols**: A = adverb, N = negative, X = auxiliary verb, C = negative contraction, M = class A modal, B = class B modal, P = pronoun, Q = quantifier, V = main verb

## Parameters Found

| Name | Symbol | Value | Units | Context |
|------|--------|-------|-------|---------|
| Mean F0 peak ("Say") | o | 114.8 | Hz | Final word position |
| Mean F0 peak (Word X) | x | 111.1 | Hz | Target word |
| Mean F0 peak ("instead") | & | 95.1 | Hz | Reference word |
| Rise accent (voiced 1st syl) | x | +6.9 | Hz | Mean rise magnitude |
| Rise accent (unvoiced 1st syl) | o | +3.2 | Hz | Mean rise magnitude |
| Rise accent ("instead") | $ | +17.3 | Hz | Mean rise magnitude |
| Fall accent (1st syl unvoiced) | o | -23.9 | Hz | Mean fall magnitude |
| Fall accent (1st syl voiced) | x | -18.1 | Hz | Mean fall magnitude |
| F0 sampling interval | - | 10 | msec | Data collection |
| Time axis marking | - | 200 | msec | Figure intervals |

## Rules/Algorithms

### F0 Accent Measurement Rules (from Fig. 9 legend)
1. For **rise accent**: Measure sum of F0 jump between syllable nuclei AND amount of F0 rise during the accented syllable (AS)
2. The **degree of fall** = amount of fall accent a syllable has
3. **Secondary accent** measured by comparing fall-off on AS with fall-offs of adjacent syllables

### F0 Contour Plotting Rules (p. 418)
1. Fo values sampled every 10 msec
2. Linear amplitude curve displayed at bottom (max value per 10 msec section)
3. Circles represent F0 data points
4. Straight lines through circles = linearized abstraction
5. Data median-smoothed to eliminate deviant points (Rabiner et al. 1975)

### Voicing Effect Rules (implicit from data)
1. **Voiced initial consonant**: F0 rise is larger (+6.9 Hz vs +3.2 Hz for unvoiced)
2. **Unvoiced initial consonant**: F0 fall is steeper (-23.9 Hz vs -18.1 Hz for voiced)

## Figures of Interest

- **Fig. 1** (p. 428): Sentence structure diagram showing Operators, Nucleus, Verb hierarchy
- **Fig. 2** (p. 428): Sample F0 contour for "Joe has not studied his books" showing actual data points and linearized contour
- **Fig. 3** (p. 429): Three types of F0 accent (rise, basic primary, fall primary, secondary)
- **Fig. 4** (p. 429): Hierarchy of F0 patterns at utterance, clause/phrase, word, and phoneme levels
- **Fig. 5** (p. 430): Effect of initial consonant voicing on sub-contour shape
- **Fig. 6** (p. 430): Three forms of F0 sub-contours
- **Fig. 7** (p. 430): F0 contour with 3 sub-contours, middle one having double-rise
- **Figs. 8-13** (pp. 431-433): Statistical distributions of F0 values, rises, falls, and fall-offs
- **Figs. 14-26** (pp. 434-440): Actual F0 contour plots for various sentence types with different speakers

## Quotes Worth Preserving

> "The circles represent Fo values, spaced every 10 msec; the continuous curve at the bottom displays the linear amplitude of the utterance, obtained by taking the maximum value of the 10 KHz-sampled waveform of speech over every 10 msec section." (p. 418)

> "As a quantifier of the degree of rise accent, the basic measure was chosen to be the sum of the Fo jump between syllable nuclei and the amount of Fo rise during the AS; the degree of ensuing Fo fall and drop constitutes the amount of fall accent a syllable has." (p. 418)

> "To represent a single Fo curve for the adverbs in these figures, the Fo rises/falls were averaged within each section. However, since some of the adverbs lacked the first and/or last section (i.e., lacked USs before and/or after the AS), it was necessary to treat their missing sections as having zero change in Fo and zero duration." (p. 423)

## Implementation Notes

### For TTS Prosody System

1. **F0 Rise Magnitude by Voicing**:
   - Use +6.9 Hz rise for voiced initial consonants
   - Use +3.2 Hz rise for unvoiced initial consonants
   - "instead" pattern uses larger +17.3 Hz rise

2. **F0 Fall Magnitude by Voicing**:
   - Use -23.9 Hz fall for unvoiced initial consonants (steeper)
   - Use -18.1 Hz fall for voiced initial consonants (gentler)

3. **Hierarchical F0 Model**:
   - Implement four levels: utterance > clause/phrase > word > phoneme
   - Each level contributes additively to final F0 contour

4. **Sub-contour Types**:
   - Normal: rise-fall within accented syllable
   - With secondary accent: additional smaller prominence
   - Phonological unit: smallest prosodic boundary marker

5. **Data Smoothing**:
   - Apply median smoothing to eliminate F0 tracking errors
   - Sample at 10 msec intervals for rule derivation

6. **Speaker Variation**:
   - Figures show data from multiple speakers (JA, KS, ML, DO)
   - Patterns are consistent but absolute values vary by speaker
   - Consider speaker-dependent scaling factors

### Key Bibliography References for Implementation

- **Klatt (1973)**: "Discrimination of fundamental frequency contours in synthetic speech" - JASA 53
- **Lea (1973)**: "Segmental and Suprasegmental Influences on Fundamental Frequency Contours"
- **Lieberman (1960, 1967)**: Acoustic correlates of stress and intonation perception
- **Mattingly (1966, 1968, 1970)**: Synthesis by rule of prosodic features
- **Olive & Nakatani (1974)**: Rule-synthesis of speech by word concatenation
- **Rabiner et al. (1969, 1971)**: Speech synthesis by rule and formant-coded speech
- **Collier (1974, 1975)**: Physiological correlates of intonation patterns
