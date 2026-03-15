# Hertz & Huffman 1992 — A Nucleus-Based Timing Model Applied to Multi-Dialect Speech Synthesis by Rule

## Key Concept: The Acoustic Nucleus

The central innovation is the **acoustic nucleus** — a unit not recognized in conventional segment-based models.

- The acoustic nucleus consists of the **vowel** of the syllable, any **non-nasal tautosyllabic sonorants**, and any **voiced portions of transitions** on either side
- For the word *tied*: nucleus = transition from `a` to `y`, the phone `y`, and the transition from `y` to `d`
- Initial transition from `t` to `a` is NOT part of nucleus (unvoiced)
- In *died*, the initial transition WOULD be part of the nucleus (voiced)
- Acoustic nuclei in English can have up to **three phones** (e.g., *wild* = `a`, `y`, `l`)

### Why Nuclei Matter for Duration

- Speakers tend to give the acoustic nucleus **as a whole** a particular duration, depending on context
- The nucleus duration is **distributed among the component phones and transitions** in a principled fashion
- This creates a trading relationship: longer transitions = shorter vowel within the nucleus
- This cannot be captured in conventional phone-by-phone timing models

## Delta Representation (Multi-Stream)

The utterance is represented as a **delta** — a multi-stream structure with interconnected streams and sync marks.

### Streams

| Stream | Contains | Function |
|--------|----------|----------|
| `word` | word boundaries | Delimits words |
| `syll` | syllable boundaries | Delimits syllables, encodes stress |
| `diaphon` | diaphoneme labels | Underlying "phonemes" common to all dialects |
| `phone` | phone labels | Dialect-specific phones |
| `F2` | F2 formant targets (Hz) | Formant frequency values |
| `asp_amp` | aspiration amplitude (dB) | Aspiration envelope |
| `voic_amp` | voicing amplitude (dB) | Voicing envelope |
| `acst_nuc` | nucleus markers | Marks acoustic nucleus boundaries |
| `trans` | transition markers | Marks formant transitions |
| `ms` | duration (ms) | Timing values |

Additional streams (not shown in detail): other formants, nasalization, fundamental frequency, noise.

### Sync Marks

Vertical bars (sync marks) align events across streams. All acoustic values are aligned precisely with the **edges of higher-level linguistic units**.

### Example: *Say tied for me* (General American)

```
word:    |         |word           |
syll:    |stress1  |               |
diaphon: |t    |ay      |d        |
phone:   |t    |a    |y    |d     |
F2:      |1800||1800|    ||1800|  |1800|
asp_amp: |0    |170 |0            |
voic_amp:|0         |60           |0
acst_nuc:|     |nuc               |
trans:   |     |tr   |tr|  |tr   |
ms:      |95   |70  |55 |90|20  |15|60|0
```

## Duration Rules

### Rule Hierarchy

Rules are divided into three categories:
1. **Language-universal** — abstract acoustic representation common to all languages (Section I of paper, not detailed)
2. **Dialect-universal** — apply to all or most American English dialects
3. **Dialect-specific** — generate values for particular dialects

### Dialect-Universal Duration Rules

Applied first. Assign initial duration to the nucleus.

- Duration assigned to acoustic nucleus based on context: `Say [b_t] for me`
- Example values:
  - Nucleus of `a y` (two phones ending in `r`): **145 ms**
  - Nucleus of two phones (other): **160 ms** starting duration

### Duration Distribution Within Nucleus

After total nucleus duration is assigned:
1. Non-vowel phones in nucleus get **assigned durations** first (transitions already have durations)
2. For `y` in *tied*: assigned **10 ms**
3. Vowel duration = total nucleus duration - transitions - non-vowels
4. Example: 145 ms total, transitions take some, y gets 10 ms, vowel gets remainder (30 ms in example)

**Key property**: The vowel is pliable — whatever duration will yield the correct total nucleus duration, receiving what's left.

### Lengthening Before Voiced Consonants

- Nucleus before a tautosyllabic voiced consonant: lengthened to **1.5x** current duration, or to a specified **maximum duration**, whichever is less
- Three-phone nucleus: max **250 ms**
- Vowel + glide (ay, oy, aw): max **200 ms**

### Non-Vowel Phone Durations (Outside Nucleus)

- Non-vowel phones are lengthened to a duration that depends on the particular phone
- Then the vowel phone gets whatever duration is needed to yield correct total nucleus duration
- Similar to vowel's starting duration determination

### Shortening Rules

- Phone `a` shortened to **55 ms** due to preceding aspiration (Hertz reference [4])
- Factors determining final duration of acoustic nucleus:
  - Segmental context of the nucleus
  - Degree of stress
  - Whether in a function or content word
  - Position in word and phrase

### Cross-Dialect Duration Observations

- Durations of acoustic nuclei in different dialects are modified in the **same kinds of contexts**
- Dialects differ primarily in **degrees of lengthening and shortening** and in **maximum durations**
- This enables a dialect-universal set of duration adjustment rules with dialect-specific variables for the lengthening/shortening percentages and max durations

## Formant Rules

### Dialect-Universal Formant Rules

- Rules divided into **dialect-universal** (apply to all/most dialects) and **dialect-specific** (particular dialects)
- Dialect-universal rules generate formant patterns for stretches of the delta **outside** the acoustic nucleus
- Dialect-specific rules generate patterns **inside** the nucleus

### Formant Target Assignment

- Dialect-specific rules assign formant values to phones in the nucleus
- Rules generally position target values at the **beginning and end of each phone** (with some exceptions)
- Rules include a separate procedure for each phone that assigns appropriate formant values via a **context-sensitive rule set**
- For *tied*: F2 targets for `a` and `y` shown as:
  ```
  phone:   |a       |y      |
  F2:      |1350|   |1350|  |1900|   |1900|
  acst_nuc:|nuc                      |
  trans:   |    |tr  |      |tr|
  ms:      |0  |55  |0     |90|0    |20|0  |15|
  ```

### Target Duration

- Each formant target is assigned a duration of **0 ms** even though natural speech targets often exhibit non-zero durations
- Perceptual tests showed this is not perceptually important — abstracted away

### Phone-Edge Formant Values

- Same phone in the nucleus of *tied* may receive:
  - Same values at beginning and end
  - Different values at each edge
  - Some phones intrinsically have different begin/end values
  - Others get different values only in specific contexts
- After all formant and other acoustic values are generated, **identical adjacent values are collapsed**, producing a delta like the one shown in Section I

## The Delta System

- Rules developed with the **Delta System** — a software system by S. R. Hertz for building and manipulating deltas
- Rules expressed in the **Delta programming language** (Hertz [8]-[9])
- Tested and refined using **DeltaTools** (interactive environment)
- Rules operate on text, building a multi-stream delta of linguistic and acoustic information
- Values generated for a Klatt synthesizer [11] (but synthesizer is not integral — could generate values for other formant synthesizers)

### Rule Development Methodology

- Cyclical: formulation and testing of hypotheses, alternating analysis and synthesis
- Analysis phase: examine spectrograms (Kay DSP Sona-Graph 5500, Entropic Waves/ESPS)
- Synthesis phase: build deltas embodying hypotheses, test as rules in Delta program or via DeltaTools
- Evaluation: listening to synthesized speech, visual spectrogram comparison, periodic intelligibility tests (Modified Rhyme Test)
- Intelligibility: above **80%** on Modified Rhyme Tests, improving steadily; compares favorably with 84% reported by Logan et al. [12] for best of eight TTS systems

## Multi-Dialect Database

### Structure

- Three logical levels: **utterance**, **syllable**, **acoustic** (phone-level) tables
- **Utterance table**: text, spelling, phonetic context, rate of speech, speaker, language, dialect
- **Syllable table**: degree of lexical stress, context of syllable (focus, word type, phrase-finality)
- **Acoustic tables**: the core — phones paired with following transitions, containing:
  - Formant target values at phone edges
  - Duration of each formant target
  - Duration of stretch between formant targets
  - Location and duration of glottalization, noise, aspiration, voicing, nasalization periods
  - Duration of phone-to-next-phone transition
  - Duration and location of glottalization, noise, aspiration, voicing, nasalization for the transition

### Implementation

- Currently implemented with **Paradox** relational database (Borland)
- Running on IBM PC networked to Sun Workstations
- Speech analyzed using Entropic Waves/ESPS for segmenting spectrograms, marking transitions, extracting durations and formant values
- Data entered via customized computer program

### Utility

- Can query by dialect, context, speaker to obtain durations and acoustic values
- Enables extraction of cross-dialect and intra-dialect generalizations
- Valuable for both synthesis rule development and speech recognition

## Perceptual Experiments (Section 3.2)

- Designed to determine when observed timing variability is perceptually significant
- Key finding: in nuclei with phones `I` and `l`, trading off phone durations has **very little perceptual effect** — total nucleus duration matters more
- In nuclei containing `e` and `l`, the `e` must have a certain **minimum duration** to avoid sounding like a tense vowel
- Speaker variability in `I l` distribution is perceptually insignificant, but variability in `e l` distribution is perceptually significant (for the two speakers studied)

## References (from paper)

1. Hertz 1982 — "From Text-to-Speech with SRS" JASA 72, pp. 1155-1170
2. Klatt 1976 — "Linguistic Uses of Segmental Duration in English" JASA 59, pp. 1208-1221
3. Hertz 1990 — "A Modular Approach to Multi-Dialect and Multi-Language Speech Synthesis using the Delta System" ECSSS 1990, pp. 225-228
4. Hertz 1991 — "Streams, Phones, and Transitions" Journal of Phonetics 19, pp. 91-109
5. Hertz 1992 — "The Timing of Phones and Transitions" Working Papers of the Cornell Phonetics Lab 7, pp. 135-149
6. Hertz & Beckman — "A Look at the SRS Synthesis Rules for Japanese" ICASSP pp. 1336-1339
7. Hertz 1988 — "Delta: Flexible Solutions to Tough Problems in Speech Synthesis by Rule" Speech Tech 88
8. Hertz 1990 — "The Delta Programming Language" Papers in Laboratory Phonology I, pp. 215-257
9. Charif, Hertz & Weber 1992 — The Delta System Version 2 User's Manual
10. Klatt & Klatt 1990 — "Analysis, Synthesis, and Perception of Voice Quality Variations" JASA 87, pp. 820-857
11. House, Williams, Hecker & Kryter 1965 — "Articulation-testing methods" JASA 37, pp. 158-166
12. Logan, Greene & Pisoni 1989 — "Segmental Intelligibility of Synthetic Speech" JASA 86, pp. 566-581
