# Review of Text-to-Speech Conversion for English

**Authors:** Dennis H. Klatt
**Year:** 1987
**Venue:** Journal of the Acoustical Society of America, Vol. 82, No. 3, September 1987
**DOI:** 0001-4966/87/090737-57$00.80
**Pages:** 737-793

## One-Sentence Summary

A comprehensive historical and technical review of all components of text-to-speech systems, from early synthesizers through modern formant synthesis and synthesis-by-rule programs, with detailed coverage of the Klattalk system.

## Problem Addressed

The paper traces the development of systems for converting text to speech, documenting progress in linguistic theory, acoustic-phonetic characterization, perceptual psychology, mathematical speech production modeling, structured programming, and computer hardware design that have enabled the creation of intelligible, reasonably natural synthetic speech.

## Key Contributions

- Comprehensive historical survey of speech synthesizer development from 1939 (Voder) to 1987
- Detailed description of the Klattalk synthesizer architecture and all 19 control parameters
- Complete synthesis-by-rule methodology including formant-based and articulation-based approaches
- Duration rules, fundamental frequency (F0) rules, and allophone selection algorithms
- Extensive bibliography of text-to-speech research (over 300 references)
- Perceptual evaluation methods and benchmarks for TTS systems
- Discussion of commercial TTS systems (DECtalk, Prose-2000, Infovox, etc.)

## Methodology

### TTS Pipeline Architecture (Figure 1)

```
INPUT TEXT -> ANALYSIS ROUTINES -> ABSTRACT LINGUISTIC DESCRIPTION -> SYNTHESIS ROUTINES -> OUTPUT SPEECH
```

Analysis routines produce:
- Pronunciation of each word (phonemes and stress)
- Syntactic structure of sentence
- Semantic focus, ambiguity resolution

Synthesis routines produce:
- Phonetic realization of each phoneme
- Duration pattern
- Fundamental frequency contour
- Phonetic-to-acoustic transformation

### Phoneme Inventory

English uses approximately 40 phonemes (Table IV shows the DECtalk phoneme set):
- Vowels: IY, IH, EY, EH, AE, AA, AO, OW, UH, UW, AH, AY, OY, AW
- Consonants: P, B, T, D, K, G, M, N, NG, F, V, TH, DH, S, Z, SH, ZH, CH, JH, H, W, Y, R, L
- Special: flap (DX), glottal stop (?), schwa variants

### Klattalk Synthesizer Architecture (Figure 12)

Two synthesis branches:
1. **Cascade branch** for voicing (vowels, nasals, liquids)
   - Formant resonators B1, B2, B3, BZ (zero) in series
   - Voiced source: AV (amplitude of voicing)

2. **Parallel branch** for frication sources
   - Formant resonators with individual amplitude controls A2-A6, AB
   - Frication source: AF (amplitude of frication)

Additional features:
- Aspiration source: AH
- Voicing source parameters: OQ (open quotient), TL (spectral tilt)
- Radiation characteristic (-6 dB/octave)

## Key Equations

### Duration Model (Equation 2)

$$
DUR = MINDUR + \frac{(INHDUR - MINDUR) \times PRCNT}{100}
$$

Where:
- $DUR$ = computed segment duration (ms)
- $INHDUR$ = inherent duration of segment type (ms)
- $MINDUR$ = minimum duration if stressed (ms)
- $PRCNT$ = percentage shortening from rules (%)

### Locus Theory for Formant Transitions (Equation 1)

$$
F2_{onset} = F2_{locus} + k \times [F2_{vowel} - F2_{locus}]
$$

Where:
- $F2_{onset}$ = F2 frequency at consonant release
- $F2_{locus}$ = locus frequency for consonant place
- $F2_{vowel}$ = target F2 of following vowel
- $k$ = coarticulation coefficient (0-1)

### Voicing Waveform Model

Basic voicing waveform shape:
$$
aT^2 - bT^3
$$

Where:
- $a$, $b$ = coefficients determined by AV, OQ, TL
- $T$ = time within glottal period

## Parameters

### Klattalk Synthesizer Parameters (19 time functions)

| Name | Symbol | Units | Range | Notes |
|------|--------|-------|-------|-------|
| Fundamental frequency | F0 | Hz | 50-500 | Pitch control |
| Amplitude of voicing | AV | dB | 0-70 | Voice source level |
| First formant frequency | F1 | Hz | 200-1000 | Mandible/tongue body |
| First formant bandwidth | B1 | Hz | 40-1000 | Damping of F1 |
| Second formant frequency | F2 | Hz | 500-3000 | Tongue body front/back |
| Second formant bandwidth | B2 | Hz | 40-500 | |
| Third formant frequency | F3 | Hz | 1500-4500 | Tongue tip position |
| Third formant bandwidth | B3 | Hz | 40-500 | |
| Nasal formant frequency | FN | Hz | 200-500 | Fixed at ~280 Hz |
| Nasal formant bandwidth | BN | Hz | 40-500 | |
| Amplitude of aspiration | AH | dB | 0-70 | Breathiness |
| Amplitude of frication | AF | dB | 0-80 | Fricative noise |
| Parallel formant amplitudes | A1-A6 | dB | 0-80 | Individual control |
| Bypass amplitude | AB | dB | 0-80 | High-frequency path |
| Open quotient | OQ | % | 10-90 | Glottal duty cycle |
| Spectral tilt | TL | dB | 0-24 | Source spectrum slope |

### Voice Quality Parameters (Table I)

| Physical quantity | Nearest subjective attribute |
|-------------------|------------------------------|
| Intensity pattern | syllabic structure, vocal effort, stress |
| Duration pattern | speaking rate, rhythm, stress, emphasis |
| F0 pattern | intonation, stress, emphasis, gender, head size, attitude |

### Duration Rules (Table II - Klatt 1979a)

1. PAUSE INSERTION: Brief pause before each sentence-internal main clause
2. CLAUSE-FINAL LENGTHENING: Vowel or syllabic consonant lengthened before pause
3. PHRASE-FINAL LENGTHENING: Syllabic segments lengthened at noun-phrase/verb-phrase boundary
4. NON-WORD-FINAL SHORTENING: Non-word-final syllabic segments shortened
5. POLYSYLLABIC SHORTENING: Segments in polysyllabic words shortened
6. NON-INITIAL-CONSONANT SHORTENING: Consonants shortened in non-word-initial position
7. UNSTRESSED SHORTENING: Unstressed segments shorter than stressed
8. LENGTHENING FOR EMPHASIS: Emphasized vowels significantly lengthened
9. POSTVOCALIC CONTEXT: Vowel duration affected by following consonant voicing
10. SHORTENING IN CLUSTERS: Segments shortened in consonant-consonant sequences
11. LENGTHENING DUE TO PLOSIVE ASPIRATION: Stressed vowel preceded by voiceless plosive lengthened

## Implementation Details

### Phoneme-to-Phonetics Conversion Process (Figure 30)

```
INPUT WORD
    |
    v
[DICTIONARY PROBE] --yes--> (whole word found)
    |no
    v
[AFFIX STRIPPING]
    |
    v
["ROOT" DICTIONARY PROBE] --yes-->
    |no
    v
LETTER-TO-SOUND & STRESS RULES
    |
    v
AFFIX REATTACHMENT
    |
    v
PHONEMES, STRESS, PARTS-OF-SPEECH
```

### Text Analysis Pipeline

1. **Word formatting**: Handle digits, abbreviations, punctuation
2. **Dictionary lookup**: 6000-word exceptions dictionary
3. **Morpheme decomposition**: Handle prefixes, suffixes, compounds
4. **Letter-to-sound rules**: ~500 rules for English
5. **Stress assignment**: Chomsky-Halle (1968) rules plus exceptions
6. **Syntactic analysis**: Crude comma-based phrase detection

### Synthesis-by-Rule Categories

1. **Heuristic acoustic-domain rules**: Direct formant parameter control
2. **"Natural" articulatory rules**: Control articulatory model parameters
3. **Concatenation methods**: Diphone/demisyllable unit selection

### Formant Transition Rules

For CV syllables, formant transitions depend on:
- Nature of phonetic segment preceding/following vowel
- Consonant place of articulation
- Vowel fronting/backing and rounding

Ohman (1966) data shows transitions for [g] vary systematically with vowel context (Figure 29).

### Burst Spectra by Place of Articulation (Figure 21)

- **/b/**: Weak, diffuse energy concentration
- **/d/**: Energy concentration at ~4 kHz (before front vowels) or falling spectrum (back vowels)
- **/g/**: Compact energy burst, frequency varies with F2 of following vowel

## Figures of Interest

- **Fig. 4**: Historical flowchart of text-to-speech system development
- **Fig. 7**: OVE II speech synthesizer - 3 separate circuits for vowels, nasals, obstruents
- **Fig. 8**: Holmes parallel formant synthesizer with 4 parallel formants + nasal
- **Fig. 12**: Klattalk synthesizer block diagram - the core architecture
- **Fig. 19**: Locus theory demonstration - F2 onset vs F2 target for vowels
- **Fig. 20**: F1/F2/F3 onset frequencies as function of vowel target (single speaker data)
- **Fig. 21**: Burst spectra for /b/, /d/, /g/ before 16 different vowels
- **Fig. 25**: Three typical clause-final intonation contours (fall, question rise, continuation)
- **Fig. 28**: Formant transitions for CVC syllables - model vs. measured
- **Fig. 29**: Formant transitions for [g] as function of vowel context (Ohman 1966)
- **Fig. 31**: Historical flowchart of text-to-phoneme algorithms
- **Fig. 33**: DECtalk 1.8 hardware block diagram
- **Fig. 34**: Critical-band spectra showing F2 shift, B2 increase, and spectral tilt effects

## Results Summary

### Intelligibility Benchmarks (Table VII - Modified Rhyme Test)

| Device | % correct |
|--------|-----------|
| Type-n-Talk | 73 |
| Infovox | 88 |
| MITalk-79 | 93 |
| Prose-2000 3.0 | 94 |
| DECtalk 1.8 | 97 |
| Natural speech | 99 |

### Harvard Sentence Test (Table IX)

| Device | % words correct | Anomalous % |
|--------|-----------------|-------------|
| Prose-2000 | 84 | 65 |
| MITalk-79 | 93 | 79 |
| DECtalk | 95 | 87 |
| Natural speech | 99 | 98 |

### Consonant Intelligibility in Nonsense Syllables (Table VIII)

| Condition | % correct | Typical errors |
|-----------|-----------|----------------|
| OLIVE (1977) DIPHONE | 66 | voicing, nasality |
| LPC-10, no quantization | 86 | b-v-d, m-n-n |
| DIGITIZED NATURAL, 5 kHz | 93 | f-th, v-dh |

## Limitations

1. **Female voice synthesis**: Tracheal resonance coupling creates spectral details hard to model with simple formant synthesizer
2. **Breathy vowels**: Adjacent to voiceless consonants, simplified glottal models don't capture spectral zeros
3. **Proper names**: Error rate ~20% for random names even with large exceptions dictionary
4. **Semantic understanding**: No current TTS system can resolve ambiguity based on meaning
5. **Emotional/attitudinal prosody**: Rules don't capture speaker affect convincingly
6. **Articulatory models**: Computationally expensive, data on articulator constraints incomplete

## Relevance to TTS Systems

### For Formant Synthesis (Klatt)
- Complete specification of cascade/parallel hybrid architecture
- All 19 control parameters with ranges and semantics
- Voicing source model with OQ and TL controls
- Formant transition rules based on locus theory

### For Duration Modeling
- 11 detailed duration rules with percentages
- Hierarchy: clause-final > phrase-final > word-final > unstressed
- Interaction with stress pattern and speaking rate

### For Prosody/F0 Generation
- "Hat pattern" model: rises at stressed syllables, falls at phrase boundaries
- Three stress levels: primary, secondary, unstressed
- Declination line slopes down across utterance
- Question intonation: rising contour at end

### For G2P (Grapheme-to-Phoneme)
- Dictionary-first approach with morpheme decomposition fallback
- ~500 letter-to-sound rules needed for English
- Stress rules based on Chomsky-Halle with exceptions
- NETtalk neural network achieves 90% phoneme accuracy

### For Allophonic Variation
- Flapping: /t,d/ -> [dx] intervocalically in unstressed syllables
- Glottalization: word-final [t,d] before stressed vowel
- Aspiration: word-initial voiceless stops
- Vowel reduction: unstressed vowels toward schwa
- Palatalization: /d/ + /y/ -> [dj] ("did you")

## Open Questions

- [ ] How to model tracheal resonances for female voice (extra pole-zero pairs needed?)
- [ ] Optimal number of formants for cascade vs parallel branches
- [ ] Best strategy for natural-sounding F0 micro-prosody within syllables
- [ ] How much syntactic analysis improves perceived naturalness vs. complexity cost
- [ ] Neural network vs rule-based approaches for letter-to-sound (NETtalk comparison)

## Related Work Worth Reading

- **Fant (1960)**: *Acoustic Theory of Speech Production* - source-filter model foundation
- **Peterson & Barney (1952)**: Canonical vowel formant measurements
- **Ohman (1966)**: Coarticulation data for VCV sequences
- **Chomsky & Halle (1968)**: *Sound Pattern of English* - stress rules
- **Flanagan (1972)**: *Speech Analysis Synthesis and Perception* - comprehensive textbook
- **Holmes et al. (1964)**: Parallel formant synthesizer design
- **Allen et al. (1987)**: *From Text to Speech: The MITalk System* - complete TTS system
- **Hunnicutt (1976, 1980)**: Letter-to-sound rules and morpheme decomposition

## Commercial Systems Discussed (circa 1987)

| System | Organization | Key Features |
|--------|--------------|--------------|
| DECtalk | Digital Equipment Corp. | Klattalk-based, MC68000 processor, 6000-word dictionary |
| Prose-2000 | Speech Plus Inc. | 3000-word exceptions, TMS-5220 LPC chip |
| Type-n-Talk | Votrax | SC-01 chip, inexpensive |
| Infovox SA-101 | Stockholm | Multi-language, 3000 words |
| Kurzweil Reading Machine | Kurzweil | OCR + TTS for blind users |
| Echo | Street Electronics | Low-cost consumer device |

## Appendix: Demonstration Recording Contents

The 33 1/3 rpm record included with the paper demonstrates:
1. Homer Dudley's VODER (1939)
2. Haskins Pattern Playback (1951)
3-4. PAT and OVE I parallel formant synthesizers (1956)
5-6. OVE II cascade formant synthesizer copying natural sentences (1962)
7-8. Holmes OVE II with parallel formants (1961, 1973)
9. DECtalk "Perfect Paul" voice demo
10. Female voice synthesis attempts
11-14. Various analysis/resynthesis examples
15-36. Rule-based synthesis examples from different systems
