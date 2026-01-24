# From Text to Speech: The MITalk System

**Authors:** Jonathan Allen, M. Sharon Hunnicutt, Dennis Klatt
**Year:** 1987
**Publisher:** Cambridge University Press (Cambridge Studies in Speech Science and Communication)

## One-Sentence Summary

This book provides a complete, production-ready blueprint for implementing a text-to-speech system, documenting every module from text normalization through the Klatt formant synthesizer with explicit algorithms, parameter tables, and phonetic rules that achieved 93% word recognition accuracy.

## Book Structure Overview

1. **Introduction** (Ch. 1) - System constraints, synthesis techniques, MITalk functional outline
2. **Part I: Analysis**
   - **Text Preprocessing** (Ch. 2) - FORMAT module: abbreviations, numbers, punctuation
   - **Morphological Analysis** (Ch. 3) - DECOMP module: morph lexicon, decomposition algorithm
   - **Phrase-Level Parser** (Ch. 4) - PARSER module: ATN-based phrase parsing
   - **Morphophonemics & Stress** (Ch. 5) - SOUND1 module: palatalization, plurals, stress
   - **Letter-to-Sound & Stress** (Ch. 6) - LTS rules, cyclic stress rules
3. **Part II: Synthesis**
   - **Synthesis Technology Survey** (Ch. 7) - Synthesis units, storage requirements
   - **Phonological Component** (Ch. 8) - PHONO1/PHONO2: segmental recoding, pauses
   - **Prosodic Component** (Ch. 9) - PROSOD: duration rules
   - **F0 Generator** (Ch. 10) - F0TARG: intonation, declination
   - **Phonetic Component** (Ch. 11) - PHONET: formant targets, transitions
   - **Klatt Synthesizer** (Ch. 12) - CWTRAN/COEWAV: formant synthesis
   - **Intelligibility Measures** (Ch. 13) - MRT results, comprehension tests
   - **Implementation** (Ch. 14) - System architecture, UNIX version
4. **Appendices**
   - A: Part-of-speech processor
   - B: Klatt symbols
   - C: Context-dependent PHONET rules (critical implementation reference)
   - D-G: Test materials

## Key Contributions

- **Complete TTS pipeline architecture**: FORMAT -> DECOMP -> PARSER -> SOUND1 -> PHONO1/PHONO2 -> PROSOD -> F0TARG -> PHONET -> CWTRAN -> COEWAV
- **12,000-morph lexicon** covering 95% of English text via morphological decomposition
- **Cascaded/parallel hybrid Klatt synthesizer** with 39 control parameters
- **10 duration rules** explaining 84% of variance in segment durations
- **F0 algorithm** with declination, accent peaks, and continuation rises
- **Context-dependent phonetic rules** specifying formant targets and transitions
- **Evaluation data**: 6.9% MRT error rate, 93.2% Harvard sentence accuracy

## Text Analysis Pipeline

### Text Normalization (FORMAT Module)

**Input:** Unrestricted ASCII text
**Output:** Uppercase words and punctuation marks

**Abbreviation Expansion (Table 2-1):**
| Input | Output |
|-------|--------|
| Ms | MIZ |
| Mr | MISTER |
| Mrs | MIZZES |
| Dr | DOCTOR |
| Jan-Dec | JANUARY-DECEMBER |
| etc | ET CETERA |
| Jr | JUNIOR |
| Prof | PROFESSOR |

**Number Pronunciation Rules:**
- Integers with commas: Pronounced as triads with "HUNDRED", "THOUSAND", etc.
- Decimals: Period becomes "POINT", following digits spoken individually
- Dollar amounts: Integer + "DOLLARS AND" + cents + "CENTS"
- Years (4 digits starting with 1): First two digits as teens, last two as number or "HUNDRED" if 00

**Special Symbols:**
- % -> PER CENT
- & -> AND

**Punctuation Classification:**
- EPM (End Punctuation Mark): period, question mark, exclamation
- IPM (Internal Punctuation Mark): all others

### Morphological Analysis (DECOMP Module)

**Morph Types:**
| Type | Code | Description | Example |
|------|------|-------------|---------|
| FREE ROOT | ROOT | Can appear alone or with affixes | side, cover, spell |
| ABSOLUTE | - | No affixes allowed | the, into, of |
| PREFIX | PREFIX | Precedes roots | pre, dis, mis |
| INITIAL | INITIAL | Only at word beginning | meta, centi |
| DERIVATIONAL | DERIV | Changes meaning/POS | ness, ment, y |
| INFLECTIONAL | INFL | Changes tense/number | ing, ed, s |
| LEFT FUNCTIONAL ROOT | LF-ROOT | Must be followed by DERIV suffix | absorb (in absorption) |
| RIGHT FUNCTIONAL ROOT | RF-ROOT | Must be preceded by prefix | mit (in permit) |
| STRONG | STRONG | Root with tense/number encoded | went = go+PAST |

**Decomposition Algorithm (Right-to-Left):**
```
find longest morph matching right end of string
WHILE match exists DO
    IF morph compatible with current FSM state
    THEN remove matched letters,
         update state and score,
         find spelling changes at boundary,
         recursive decomposition for each variation,
         save best-scoring result,
         restore original string/state/score
    find next longest matching morph
END WHILE
```

**Decomposition Scoring (Cost Units):**
- 34 units per PREFIX
- 101 units for first effective-root
- 133 units for additional effective-roots (+64 if rightmost is STRONG)
- 35 units per DERIV
- 64 units per INFL
- 512-unit penalty for non-standard transitions

**Spelling Changes at Morph Boundaries:**
| Pattern | Change | Example |
|---------|--------|---------|
| y+i | y->i | embody+ment -> embodiment |
| xx+i | xx->x | pad+ing -> padding |
| e+. | drop e | fire+ing -> firing |
| .+i | ->e | dare+ing -> daring |

### Letter-to-Sound Rules

**Three-Stage Process:**
1. **Affix stripping** (right-to-left, longest match first)
2. **Consonant conversion** (left-to-right, least context-dependent)
3. **Vowel and affix conversion** (left-to-right, most context-dependent)

**Context Pattern Notation:**
- $C$ = single consonant
- $C_0$ = zero or more consonants
- $V$ = single vowel
- $X$, $Y$ = strings of any length

**Palatalization Rules:**
| Context | Change | Example |
|---------|--------|---------|
| t before -ion after n,s | t -> SH | retention |
| t before -ion after s | t -> CH | question |
| s before -ure after l,s | s -> SH | emulsion |
| s before -ure after r,vowel | s -> ZH | subversion |

## Prosody System

### Duration Rules (PROSOD Module)

**Core Duration Formula:**
$$DUR = \frac{(INHDUR - MINDUR) \times PRCNT}{100} + MINDUR$$

**Percentage Update:**
$$PRCNT = \frac{PRCNT \times PRCNT1}{100}$$

**The 10 Duration Rules:**

| Rule | Description | PRCNT1 |
|------|-------------|--------|
| 1 | Pause insertion before main clause | 200 ms pause |
| 2 | Clause-final lengthening | 140 |
| 3 | Non-phrase-final shortening | 60 (syllabic), 140 (phrase-final sonorant) |
| 4 | Non-word-final shortening | 85 |
| 5 | Polysyllabic shortening | 80 |
| 6 | Non-initial-consonant shortening | 85 |
| 7 | Unstressed shortening | 50-70, MINDUR/=2 |
| 8 | Emphasis lengthening | 140 |
| 9 | Postvocalic context | 70-160 (see table) |
| 10 | Cluster shortening | 50-120 |

**Rule 9 - Postvocalic Context Effects:**
| Following Context | PRCNT1 |
|-------------------|--------|
| Open syllable, word-final | 120 |
| Voiced fricative | 160 |
| Voiced plosive | 120 |
| Nasal | 85 |
| Voiceless plosive | 70 |
| Other | 100 |

Non-phrase-final adjustment: $PRCNT1 = 70 + 0.3 \times PRCNT1$

### F0/Intonation Rules (F0TARG Module)

**Sentence Types and Tunes:**
- **Tune A** (Declaratives): Base 110 Hz, steep falling declination
- **Tune B** (Yes/no questions): Base 125 Hz, flat with terminal rise
- **Tune C** (Wh-questions): High peak on question word, steeper fall

**Part-of-Speech Accent Levels (Table 10-1):**
| Level | POS Categories |
|-------|----------------|
| 0 | article |
| 1 | conjunction, relative pronoun |
| 2 | preposition, auxiliary verb, modal |
| 3 | personal pronoun |
| 6 | verb, demonstrative pronoun |
| 7 | noun, adjective, adverb |
| 8 | reflexive pronoun |
| 9 | stressable modal |
| 10 | quantifier |
| 11 | interrogative adjective |
| 12 | negative element |
| 14 | sentential adverb |

Levels 6+ are "content words" that receive F0 peaks.

**F0 Target Calculation:**
- Basic rise = 40% of distance from declination base to peak
- Basic fall = 20% of distance from peak to declination
- Maximum F0 ~ 190 Hz
- Final F0 lowered by 10 Hz in statements

**Adjacent Accent Adjustments:**
- Two adjacent accented syllables: rise reduced 40%
- Separated by 2-3 unaccented: rise increased 15-30%
- Peak height on accented preceded by 2-3 unaccented: decreased 15-25%

**Continuation Rise:**
- 16 Hz on last syllable after nonterminal punctuation/conjunction
- 8 Hz if more than 5 words since last content word

### Stress Assignment

**Stress Levels:**
- 1-stress (primary): marked with `'` or `1`
- 2-stress (secondary): marked with `"` or `2`
- 0-stress (unstressed): no mark

**Main Stress Rule (Cyclic):**
$$V \rightarrow [1\text{-stress}] / X - C_0 \left\{ \begin{bmatrix} \text{short} \\ V \end{bmatrix} C_0^1 / V \right\} \left\{ \begin{bmatrix} \text{short} \\ V \end{bmatrix} C_0 / V \right\}$$

**Destressing Rule (Noncyclic):**
$$V \rightarrow [-\text{stress}] / C_0 V C_0 X - C \begin{bmatrix} \text{stress} \\ V \end{bmatrix} Y$$

With vowel shortening: EY->AE, IY->EH, AY->IH, OW->AA, UW->UH

**Suffix Stress Categories:**
| Category | Effect | Examples |
|----------|--------|----------|
| 1 | Force stress on final/penultimate | -ify, -ory, -ific |
| 2 | Skip cycle (suffix not in domain) | -dom, -ment, -less |
| 3 | Stress on suffix vowel, skip cyclic | -eer, -self, -ship |
| 4 | Replace Main Stress with first-syllable | -ic |

### Pause Durations

| Context | Duration |
|---------|----------|
| Sentence boundary | 800 ms |
| After 5+ words | 800 ms (breath) |
| End of paragraph | 1200 ms |
| Sentence-internal punctuation | 400 ms |

## Synthesizer (Klatt)

### Architecture

The synthesizer consists of two modules:
- **CWTRAN**: Computes filter coefficients from parameters
- **COEWAV**: Generates waveform samples

**Key Design Choices:**
- Hybrid cascade/parallel configuration
- 10 kHz sampling rate
- 5 ms parameter update rate (50 samples per frame)
- 5 formants for male vocal tract

### Parameters (Table 12-1 - Complete 39 Parameters)

| Name | Symbol | Units | Default | Range | Notes |
|------|--------|-------|---------|-------|-------|
| Amplitude of voicing | AV | dB | 0 | 0-80 | 60 dB for strong vowel |
| Amplitude of quasi-sinusoidal voicing | AVS | dB | 0 | 0-80 | Breathy voice, voicebars |
| Amplitude of aspiration | AH | dB | 0 | 0-80 | To cascade branch |
| Amplitude of frication | AF | dB | 0 | 0-80 | 60 for strong fricative |
| Amplitude of bypass | AB | dB | 0 | 0-80 | For TH, DH, FF, VV |
| Amplitude of nasal formant | AN | dB | 0 | 0-80 | Parallel nasal branch |
| Amplitude of formants 1-6 | A1-A6 | dB | 0 | 0-80 | Parallel branch |
| Fundamental frequency | F0 | Hz | 100 | 0-500 | Males ~100-200 Hz |
| First formant frequency | F1 | Hz | 500 | 150-900 | 180-750 Hz typical |
| Second formant frequency | F2 | Hz | 1500 | 500-2500 | 600-2300 Hz typical |
| Third formant frequency | F3 | Hz | 2500 | 1300-3500 | 1300-3100 Hz typical |
| Fourth formant frequency | F4 | Hz | 3300 | 2500-4500 | Often constant |
| Fifth formant frequency | F5 | Hz | 3850 | 3500-4900 | |
| Sixth formant frequency | F6 | Hz | 4900 | 4000-4999 | |
| First formant bandwidth | B1 | Hz | 50 | 40-500 | Wider for consonants |
| Second formant bandwidth | B2 | Hz | 70 | 50-500 | |
| Third formant bandwidth | B3 | Hz | 110 | 50-500 | |
| Fourth formant bandwidth | B4 | Hz | 250 | 100-500 | |
| Fifth formant bandwidth | B5 | Hz | 200 | 150-700 | |
| Sixth formant bandwidth | B6 | Hz | 1000 | 200-2000 | |
| Nasal pole frequency | FNP | Hz | 250 | 200-500 | Fixed at 270 Hz typically |
| Nasal pole bandwidth | BNP | Hz | 100 | 50-500 | |
| Nasal zero frequency | FNZ | Hz | 250 | 200-700 | Variable for nasalization |
| Nasal zero bandwidth | BNZ | Hz | 100 | 50-500 | |
| Glottal resonator frequency | FGP | Hz | 0 | 0-600 | Voicing source shaping |
| Glottal resonator bandwidth | BGP | Hz | 100 | 100-2000 | |
| Glottal zero frequency | FGZ | Hz | 0 | 0-5000 | |
| Glottal zero bandwidth | BGZ | Hz | 6000 | 0-9000 | |
| Glottal resonator 2 bandwidth | BGS | Hz | 200 | 100-1000 | For AVS |
| Cascade/parallel switch | SW | - | 0 | 0/1 | 0=cascade, 1=all-parallel |
| Number of cascaded formants | NFC | - | 5 | 4-6 | 5 typical for male |
| Number of waveform samples | NWS | - | 50 | 1-200 | 50 = 5 ms at 10 kHz |
| Overall gain | G0 | dB | 48 | 0-80 | |
| Sampling rate | SR | Hz | 10000 | 5000-20000 | |

### Key Equations

**Digital Resonator Difference Equation:**
$$y(nT) = Ax(nT) + By(nT-T) + Cy(nT-2T)$$

**Resonator Coefficients:**
$$C = -e^{-2\pi BW \cdot T}$$
$$B = 2e^{-\pi BW \cdot T}\cos(2\pi f \cdot T)$$
$$A = 1 - B - C$$

Where:
- $T$ = 0.0001 seconds (1/10000)
- $BW$ = bandwidth in Hz
- $f$ = resonant frequency in Hz

**Digital Antiresonator Coefficients:**
$$A' = 1/A$$
$$B' = -B/A$$
$$C' = -C/A$$

**Radiation Characteristic:**
$$p(nT) = u(nT) - u(nT-T)$$

(First-difference adds +6 dB/octave slope)

**Cascade Vocal Tract Transfer Function:**
$$T(f) = \prod_{n=1}^{5} \frac{A(n)}{1 - B(n)z^{-1} - C(n)z^{-2}}$$

### Implementation Details

**Voicing Source:**
- Impulse generator at F0
- RGP low-pass resonator smooths impulses to glottal pulses
- RGZ antiresonator shapes spectrum
- Normal voicing: -12 dB/octave
- Quasi-sinusoidal (AVS): -24 dB/octave via additional RGS filter

**Frication Source:**
- Pseudo-random noise (sum of 16 random numbers)
- LPF at -6 dB/octave
- For voiced fricatives: 50% amplitude modulation at F0

**Plosive Burst Generation:**
- AF jump > 50 dB triggers instantaneous onset (not 5 ms interpolation)
- Random number generator reset for predictable burst spectrum
- Burst durations: BB=5ms, DD=10ms, GG=20ms, PP=5ms, TT=15ms, KK=25ms, CH=15ms

**Nasalization:**
- Increase F1 by ~100 Hz
- Set FNZ = (new_F1 + 270) / 2
- FNP fixed at 270 Hz

**Formant Amplitude Rules (Parallel Branch):**
- Amplitude inversely proportional to bandwidth (-6 dB per doubling)
- Amplitude proportional to frequency (+6 dB per doubling)

## Complete Rule Sets

### Phoneme Inventory (Klatt Symbols)

**Vowels:** AA, AE, AH, AO, AW, AX, AXR, AY, EH, ER, EXR, EY, IH, IX, IXR, IY, OW, OXR, OY, UH, UW, UXR, YU

**Sonorant Consonants:** EL, HH, HX, LL, LX, RR, RX, WW, WH, YY

**Nasals:** EM, EN, MM, NN, NG

**Fricatives:** DH, FF, SS, SH, TH, VV, ZZ, ZH

**Plosives:** BB, DD, DX, GG, GP, KK, KP, PP, TT, TQ

**Affricates:** CH, JJ

**Pseudo-vowel:** AXP (plosive release into pause)

### Segment Duration Table (Table 9-1)

| Phoneme | MIN (ms) | INHERENT (ms) |
|---------|----------|---------------|
| **Vowels** |||
| AA | 100 | 240 |
| AE | 80 | 230 |
| AH | 60 | 140 |
| AO | 100 | 240 |
| AW | 100 | 260 |
| AX | 60 | 120 |
| AXR | 120 | 260 |
| AY | 150 | 250 |
| EH | 70 | 150 |
| ER | 80 | 180 |
| EXR | 130 | 270 |
| EY | 100 | 190 |
| IH | 40 | 135 |
| IX | 60 | 110 |
| IXR | 100 | 230 |
| IY | 55 | 155 |
| OW | 80 | 220 |
| OXR | 130 | 240 |
| OY | 150 | 280 |
| UH | 60 | 160 |
| UW | 70 | 210 |
| UXR | 110 | 230 |
| YU | 150 | 230 |
| **Sonorants** |||
| EL | 110 | 260 |
| HH | 20 | 80 |
| LL | 40 | 80 |
| LX | 70 | 90 |
| RR | 30 | 80 |
| WW | 60 | 80 |
| YY | 40 | 80 |
| **Nasals** |||
| EM | 110 | 170 |
| EN | 100 | 170 |
| MM | 60 | 70 |
| NN | 50 | 60 |
| NG | 60 | 95 |
| **Fricatives** |||
| DH | 30 | 50 |
| FF | 80 | 100 |
| SS | 60 | 105 |
| SH | 80 | 105 |
| TH | 60 | 90 |
| VV | 40 | 60 |
| ZZ | 40 | 75 |
| ZH | 40 | 70 |
| **Plosives** |||
| BB | 60 | 85 |
| DD | 50 | 75 |
| DX | 20 | 20 |
| GG | 60 | 80 |
| KK | 60 | 80 |
| PP | 50 | 90 |
| TT | 50 | 75 |
| **Affricates** |||
| CH | 50 | 70 |
| JJ | 50 | 70 |
| **Pseudo-vowel** |||
| AXP | 70 | 70 |

### Vowel Formant Targets (Table 11-1)

| Vowel | F1 (Hz) | F2 (Hz) | F3 (Hz) | B1 (Hz) | B2 (Hz) | B3 (Hz) |
|-------|---------|---------|---------|---------|---------|---------|
| IY | 310/290 | 2200/2070 | 2960/2980 | 50 | 200 | 400 |
| IH | - | - | - | - | - | - |
| EY | - | - | - | - | - | - |
| EH | - | - | - | - | - | - |
| AE | 620/650 | 1660/1490 | 2430/2470 | 70 | 130 | 300 |
| AA | 700 | 1220 | 2600 | 130 | 70 | 160 |
| AO | - | - | - | - | - | - |
| OW | - | - | - | - | - | - |
| UH | - | - | - | - | - | - |
| UW | 350/320 | 1250/900 | 2200 | 65 | 110 | 140 |
| AX | 550/520 | 1260/1400 | 2470/1650 | 80 | 50 | 140 |

(Two values indicate target / diphthong endpoint)

### Forward Smoothing Durations (Tcf - Table C-3)

| Parameter | Default Tcf (ms) |
|-----------|------------------|
| av | 25 |
| an | 40 |
| f1 | 80 |
| f2-f4 | 80 |
| b1-b3 | 80 |
| fnz | 150 |
| af | 40 |
| asp | 20 |
| f0 | 120 |

### Boundary Smoothing Percent (Bper - Table C-4)

| Transition | Bper |
|------------|------|
| vowel -> vowel | 50 |
| stop -> vowel | 65 |
| sonorant -> vowel | 75 |
| f0 (all) | 75 |

### Diphthong Timing Parameters (Table C-5)

| Vowel | Tcdiph | Tdmid |
|-------|--------|-------|
| AA | 0 | 80 |
| AE | 100 | 75 |
| AO | 110 | 80 |
| AW | 120 | 70 |
| AY | 100 | 55 |
| EH | 60 | 70 |
| EY | 140 | 55 |
| IH | 90 | 65 |
| IY | 200 | 45 |
| OW | 150 | 50 |
| OY | 150 | 60 |
| UH | 90 | 65 |
| UW | 140 | 55 |
| YU | 100 | 45 |

### Plosive Burst Durations (Table C-7)

| Consonant | Burdur (ms) |
|-----------|-------------|
| BB | 5 |
| DD | 10 |
| GG | 20 |
| PP | 5 |
| TT | 15 |
| KK | 25 |
| CH | 15 |
| JJ | 10 |

### Phonetic Segment Classes

| Class | Members |
|-------|---------|
| affricate | CH, JJ |
| alveolar | DD, DX, EN, NN, SS, TQ, TT, ZZ |
| dental | DH, TH |
| diphthong | AE, AO, AW, AXR, AY, EH, EXR, EY, IH, IXR, IY, OW, OXR, OY, UH, UW, YU |
| fricative | DH, FF, SS, SH, TH, VV, ZH, ZZ |
| front | AE, EH, EXR, EY, IH, IX, IXR, IY, YU |
| high | IH, IX, IXR, IY, UH, UW, UXR, WH, WW, YU, YY |
| labial | BB, EM, FF, MM, PP, VV, WW, WH |
| lateral | EL, LL, LX |
| liqglide | EL, LL, LX, RR, RX, WH, WW, YY |
| low | AA, AE, AO, AW, AXR, AY |
| nasal | EM, EN, MM, NN, NG |
| palatal | CH, JJ, SH, YY, ZH |
| plosive | BB, CH, DD, GG, GP, JJ, KK, KP, PP, TQ, TT |
| retro | ER, RR, RX |
| round | AO, OW, OXR, OY, UH, UW, WH, WW, YU |
| sonorant | All vowels + LL, LX, RR, RX, WW, WH, YY, MM, NN, NG |
| stop | BB, CH, DD, DX, EM, EN, GG, GP, JJ, KK, KP, MM, NG, NN, PP, QQ, TQ, TT |
| velar | GG, KK, NG |
| voiced | All voiced segments |
| vowel | All vowels |

### Transition Types

| Type | Description |
|------|-------------|
| DISCON | Discontinuous - step change at boundary |
| SETSMO | Set-smooth - settable boundary values with smooth transitions |
| SMODIS | Smooth-discontinuous - smooth approach, discontinuous after |
| DISSMO | Discontinuous-smooth - discontinuous onset, smooth departure |
| SMOOTH | Fully smooth transition |

### Coarticulation Formulas

**LL coarticulation:**
$$Target[f2] = 0.9 \times Target[f2] + 0.1 \times TARGET[f2,X]$$

**RR coarticulation:**
$$Target[f2] = 0.75 \times Target[f2] + 0.25 \times TARGET[f2,X]$$
$$Target[f3] = Target[f2] + 250$$

**Schwa coarticulation:**
$$Target[f2] = 0.9 \times Target[f2] + 0.1 \times 1450$$

**Velar locus calculation:**
$$Oldval[f2] = Target[f2] + (Target[f1] - 300) \times 2$$

**Boundary value calculation:**
$$Bvalf = \frac{Bper \times Target + (100 - Bper) \times Oldval}{100}$$

### Segmental Phonology Rules

1. **Velarized L**: LL -> LX if preceded by vowel and not followed by stressed vowel
2. **Flapping**: TT/DD -> DX if followed by non-primary-stressed vowel and preceded by nonnasal sonorant
3. **Word-final glottalization**: TT -> TQ if preceded by sonorant (unless next word starts with stressed sonorant)
4. **Voiceless plosive non-release**: Not released before another voiceless plosive in same clause
5. **Glottal stop insertion**: Before word-initial stressed vowel after phrase boundary
6. **"the" pronunciation**: DH IY before vowels, DH AX otherwise

## Figures of Interest

| Figure | Page | Description |
|--------|------|-------------|
| 2-1 | 18 | FORMAT processing example |
| 3-1 | 31 | FSM state transition diagram for morph sequences |
| 3-2 | 37 | Decomposition trace for "scarcity" |
| 4-1 | 47 | Noun group ATN |
| 4-2 | 48 | Verb group ATN |
| 7-1 | 72 | Complete MITalk synthesis pipeline |
| 7-2 | 74 | Spectrograms: isolation vs. continuous speech |
| 9-1 | 94 | PROSOD processing example |
| 10-1 | 105 | F0 contours with declination |
| 11-2 | 112 | F1-F2 vowel plot for speaker DHK |
| 11-3 | 113 | Plosive burst spectra by vowel context |
| 11-4 | 114 | Locus plots for F1, F2, F3 |
| 11-5 | 115 | CV synthesis strategy (VTAR/DTAR) |
| 11-6 | 117 | Transition templates (DISCON/SETSMO/SMODIS/DISSMO) |
| 12-3 | 126 | CASCADE vs PARALLEL configuration |
| 12-6 | 131 | Complete synthesizer block diagram |
| 12-7 | 135 | Normal vs. quasi-sinusoidal voicing spectra |
| 12-9 | 141 | Vocal tract transfer function examples |
| 12-10 | 143 | Nasalization effect on vowel |
| C-1 | 189 | Pre-aspiration smoothing |
| C-2 | 194 | Diphthong transition timing |

## Tables of Interest

| Table | Page | Description |
|-------|------|-------------|
| 2-1 | 19 | Abbreviation translations |
| 3-1 | 36 | Spelling change rules for vocalic suffixes |
| 8-1 | 84 | Complete Klatt symbol inventory |
| 9-1 | 96 | Segment MIN and INHERENT durations |
| 10-1 | 101 | Part-of-speech accent levels |
| 11-1 | 119 | Vowel formant targets |
| 11-2 | 121 | Consonant parameters |
| 11-3 | 122 | PHONET output parameters |
| 12-1 | 132 | Complete 39 synthesizer parameters |
| C-1 | 186 | Non-vocalic segment parameters |
| C-2 | 187 | Vocalic segment parameters |
| C-3 | 188 | Default Tcf values |
| C-4 | 188 | Default Bper values |
| C-5 | 194 | Diphthong timing parameters |
| C-6 | 196 | Obstruent forward smoothing |
| C-7 | 197 | Plosive burst durations |

## Implementation Notes

### Pipeline Architecture
```
TEXT
  |
  v
FORMAT (text normalization)
  |
  v
DECOMP (morphological decomposition)
  |
  v
PARSER (phrase-level parsing via ATN)
  |
  v
SOUND1 (morphophonemics, letter-to-sound)
  |
  v
PHONO1 (syntactic markers, pausing)
  |
  v
PHONO2 (segmental recoding, allophones)
  |
  v
PROSOD (duration rules)
  |
  v
F0TARG (intonation)
  |
  v
PHONET (formant targets, 20 params @ 5ms)
  |
  v
CWTRAN (coefficient calculation)
  |
  v
COEWAV (waveform generation)
  |
  v
SPEECH WAVEFORM (10 kHz)
```

### Critical Implementation Constants
- Speaking rate: 180 words/minute
- Parameter update: 5 ms (50 samples at 10 kHz)
- Word limit: 40 characters
- Sentence limit: 200 words
- Morph lexicon: ~12,000 entries
- Context window: 5 segments for phonetic targets

### Storage Requirements
- PHONO2 output: ~100 bits/second
- PHONET output with natural F0/durations: ~250 bits/second
- Word-level LP representation: ~1000 bits/second

### Voice Quality Control
- Normal voicing: AV only
- Breathy voice: AH=AV-3, AVS=AV-6
- Strong voicebar: AVS=47
- Aspiration: AH=60, AV=0

### Minimum Formant Separation
Enforce 200 Hz minimum separation between adjacent formants.

### Glottal Segments
SIL and glottal segments have no inherent targets - inherit from context.

## Relevance to Qlatt Project

### Direct Applicability

1. **Synthesizer Parameters**: Table 12-1 provides the complete 39-parameter specification for the Klatt synthesizer, directly applicable to `klatt-synth.js`.

2. **Duration Rules**: The 10 duration rules and segment duration table (Table 9-1) should be implemented in `tts-frontend-rules.js`.

3. **Formant Targets**: Tables 11-1, C-1, C-2 provide vowel and consonant formant targets for phoneme-to-parameter mapping.

4. **Transition Smoothing**: The DISCON/SETSMO/SMODIS/DISSMO templates with Tcf and Bper values should guide parameter interpolation.

5. **Coarticulation**: The LL/RR/schwa/velar formulas can improve consonant-vowel transitions.

6. **Burst Implementation**: AF > 50 dB jump for instantaneous burst onset; burst durations from Table C-7.

7. **Nasalization**: FNZ = (F1_new + 270)/2 formula for nasal coarticulation.

### Implementation Priorities

1. Verify formant target values against Tables C-1, C-2
2. Implement transition types and smoothing constants
3. Add coarticulation formulas for LL, RR, schwa
4. Implement velar locus calculation
5. Apply duration rules from Table 9-1
6. Add burst duration parameters

## Open Questions

- [ ] Are the bandwidth values in tables adjusted for glottal losses, or should Qlatt apply additional adjustment?
- [ ] How should the F0 declination algorithm interact with emphasis?
- [ ] What are the complete F5, F6 formant values (often held constant but no table provided)?
- [ ] How should the continuation rise interact with question intonation?
- [ ] What is the exact algorithm for the pseudo-random noise generator?

## Key Quotes

> "The MITalk system is based on a phonemic speech synthesis model developed by D. H. Klatt. All of the algorithms for the specification of the control parameters utilized by this model were developed by him." (p. 4)

> "95 percent of the input text (consisting of high-frequency, foreign, and polysyllabic words) can be transcribed to phonetic notation." (p. 13)

> "The rules account for 84 percent of the observed total variance in segmental durations for speaker DHK." (p. 98)

> "The vowel identification rate was 99 percent and the consonant identification rate was 95 percent." (p. 114)

> "A plosive burst involves a more rapid source onset than can be achieved by 5 msec linear interpolation. Therefore, if AF increases by more than 50 dB from its value specified in the previous 5 msec segment, AF is (automatically) changed instantaneously to its new target value." (p. 138)

> "The amplitude of a formant peak is inversely proportional to its bandwidth. If a formant bandwidth is doubled, that formant peak is reduced in amplitude by 6 dB." (p. 146)

> "Minimum formant separation is 200 Hz: raise Target[f2..f4] such that separation is at least 200Hz." (p. 200)

> "Glottal segments (including SIL) have no inherent 'articulatory' targets" (p. 201)

> "Substantial learning effects occur with synthetic speech... performance increased from 55 percent to 90 percent correct after the presentation of only 200 synthetic sentences." (p. 156)
