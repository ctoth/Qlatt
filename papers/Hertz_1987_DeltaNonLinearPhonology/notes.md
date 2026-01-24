# The Delta Programming Language: An Integrated Approach to Non-Linear Phonology, Phonetics, and Speech Synthesis

**Authors:** Susan R. Hertz
**Year:** 1987 (written December 1987)
**Venue:** Working Papers of the Cornell Phonetics Laboratory, No. 2, pp. 69-122
**Institution:** Eloquent Technology / Cornell University

## One-Sentence Summary

Detailed presentation of the Delta programming language showing how multi-level synchronized "delta" structures can represent both phonological models (Bambara tone) and phonetic models (English formant transitions) for speech synthesis.

## Problem Addressed

- Previous systems (SRS, Klatt's) used linear phoneme-sized representations
- Linear representations can't elegantly express:
  - Non-linear phonological phenomena (tone spreading, floating tones)
  - Multi-level synchronization (syllables, morphs, tones, phonemes)
  - Sub-phonemic units (aspiration, formant transitions)
- Need flexible rule language to test alternative phonetic models

## Key Contributions

1. **Delta data structure**: Multiple synchronized "streams" representing different linguistic levels
2. **Bambara tone model**: Complete implementation showing tone assignment and F0 generation
3. **Three English formant models**: Progressive refinement showing how Delta accommodates different theoretical approaches
4. **Aspiration as independent unit**: Novel representation solving the stop-segmentation problem

## The Delta Data Structure

### Streams and Sync Marks

A **delta** consists of user-defined **streams** of **tokens** synchronized at **sync marks** (vertical bars):

```
(1)  phrase:   |         NP           |    |         VP           |
     word:     |       noun           |    |        verb          |
     morph:    |       root           |    |        root          |
     phoneme:  | m |  u  | s | o      |    | j |    a    | b | i  |
     CV:       | C |  V  | C | V      |    | C |  V | V  | C | V  |
     nucleus:  |   | nuc |   | nuc    |    |   |   nuc   |   | nuc|
     syllable: |   syl   |   syl     |    |      syl    |   syl  |
     tone:     |    L    |     H     | L  |             H         |
               1    2    3    4       5  6  7     8    9   10    11
```

### Token Structure

Each token has **fields** with **values** (attributes):

```
(6)  name:      m
     place:     labial
     manner:    sonorant
     class:     cons
     nasality:  nasal
```

Field types:
- **Name-valued**: token names as possible values
- **Multi-valued**: multiple values (place, manner, height, backness)
- **Binary**: two values (`<nasal>` / `<~nasal>`)
- **Numeric**: integers (F0, duration, formant values)

### Stream Definitions (Figure 1)

```delta
stream %phoneme;
  :: Fields and Values:
  name:      m, n, ng, b, d, j, g, p, t, c, k,...,
             i, in, I, e, en, E, a, an,...u, un;
  place:     labial, alveolar, palatal, velar,...;
  manner:    sonorant, obstruent,...;
  class:     cons;
  nasality:  nasal;
  voicing:   ~voiced;
  height:    high, mid, low;
  backness:  front, central, back;
  ...

  :: Initial Features:
  m  has labial, sonorant, nasal, cons;
  n  like m except alveolar;
  ...
  j  has voiced, palatal, stop, cons;
  g  like j except velar;
  ...
  u  has back, high;
  un like u except nasal;
end %phoneme;

:: F0 Stream Definition:
stream %F0;
  name: int;    :: defines all integers as possible names
end %F0;
```

## Delta Rule Syntax

### Basic Rule Structure

```delta
[%phoneme _^left <cons> !^ac] -> insert [%CV C] ^left...^ac;
```

Components:
- `[%phoneme ...]` - delta test on phoneme stream
- `_^left` - anchor at pointer ^left
- `<cons>` - test for consonant feature
- `!^ac` - set pointer ^ac as side-effect
- `->` - action arrow
- `insert [%CV C] ^left...^ac` - insert C token in CV stream

### Pointer Variables

| Syntax | Meaning |
|--------|---------|
| `^name` | Pointer variable |
| `_^ptr` | Anchor pattern at pointer |
| `!^ptr` | Set pointer (side-effect) |
| `^left` | Built-in: leftmost sync mark |
| `^right` | Built-in: rightmost sync mark |

### Context Operators

| Operator | Meaning |
|----------|---------|
| `\\` | Left context (take left boundary) |
| `//` | Right context (take right boundary) |

Example - test if vowel o is "contained in" H tones:
```delta
[%tone _(\\ %tone ^5) H (// %tone ^6)]
```

### Time Streams and Expressions

```delta
time stream %duration;
  name: int;
end %duration;
```

Time expressions:
```delta
(30) %duration ^2 + 75      :: 75ms after sync mark 2
(31) %duration ^3 - 75      :: 75ms before sync mark 3
(32) %duration ^4 - 75      :: same (sync 4 = sync 3 in this case)
(33) %duration ^5 - 215     :: 215ms before sync mark 5
(34) %duration ^2 + (.5 * dur(^2...^3))  :: midway between 2 and 3
```

The `dur(^a...^b)` function returns duration between sync marks.

### Forall Loops

```delta
loop forall [%phoneme _^bc <cons> !^ac];
  insert [%CV C] ^bc...^ac;
pool;
```

Applies rule to every consonant phoneme in the delta.

### Fences

Limit rule scope to prevent crossing boundaries:

```delta
loop forall [%morph _^lfence <> !^rfence];
  loop forall [%phoneme _^bv <~cons> !$vowel $vowel !^av]
              advance from ^lfence
              fence %morph;
    insert [%phoneme $vowel] ^bv...^av;
  pool;
pool;
```

## Parameters

### Duration Values (English, from examples)

| Context | Duration (ms) |
|---------|---------------|
| Consonant /s/ | 60, 90 |
| Short vowel /o/ | 150 |
| Long vowel /a/ (diphthong) | 200 |
| Consonant /j/ | 140 |
| Transition sonorant→obstruent | 40 |
| Transition sonorant→sonorant | 90 |

### Formant Values (English, Section 5)

| Phoneme Class | F2 (Hz) |
|---------------|---------|
| High vowels | 2000 |
| Low vowels | 1400 |
| Alveolar consonants | 1800 |

### F0 Values (Bambara, Section 4)

| Parameter | Value (Hz) |
|-----------|------------|
| H_start_freq (high tone start) | 230 |
| H_end_freq (high tone end) | 150 |
| L_start_freq (low tone start) | 170 |
| L_end_freq (low tone end) | 130 |

F0 targets placed **halfway through each syllable nucleus**.

## Section 4: Bambara Tone Model

### Tone Patterns

Bambara words have inherent tone patterns:
- Low-toned: *muso* [mùsò] 'woman'
- High-toned: *jaabi* [já:bí] 'answer'
- Mixed: *mangoro* [mángóró] or [mángòrò] 'mango'

Plus floating tones:
- Floating L after definite nouns
- Floating H (content tone) after content morphs

### Tone Assignment Algorithm (Figure 6)

```delta
:: Forall floating H tones (^bh = "before H", ^ah = "after H")...
loop forall ([%tone _^bh H !^ah] & [%morph _^bh ^ah]);
  if
    :: If floating H occurs before floating L, move H to end of preceding morph
    ([%tone ^ah L !^al] & [%morph _^ah ^al])
      -> Insert [%tone H] ...^bh;
    :: Otherwise, insert H at beginning of following morph
    else -> insert [%tone H] ^ah...;
  fi;

  :: Delete the original floating H and following sync mark:
  delete %tone ^bh...^ah;
  delete ^ah;
pool;
```

### F0 Generation (Figure 10)

```delta
H_start_freq = 230;    :: Starting frequency of high tone line
H_end_freq   = 150;    :: Ending frequency of high tone line
L_start_freq = 170;    :: Starting frequency of low tone line
L_end_freq   = 130;    :: Ending frequency of low tone line

sent_dur = dur(^left...^right);    :: Sentence Duration

H_slope = (H_end_freq - H_start_freq) / sent_dur;
L_slope = (L_end_freq - L_start_freq) / sent_dur;

:: Insert an F0 value for each nucleus:
loop forall [%nucleus _^bn nuc !^an];
  :: Compute duration from sentence start to midpoint of nucleus:
  half_nuc_dur = .5 * dur(^bn...^an);
  elapsed_time = dur(^left...(^bn + half_nuc_dur));

  :: Compute F0 depending on whether nucleus is H or L toned:
  if
    [%tone _\\^bn H //^an]
      -> f0_val = H_slope * elapsed_time + H_start_freq;
    else -> f0_val = L_slope * elapsed_time + L_start_freq;
  fi;

  :: Insert the computed F0 value halfway through the nucleus:
  insert [%F0 f0_val] at (^bn + half_nuc_dur);
pool;
```

## Section 5: English Formant Models

### Model 1: Linear Representations, Implicit Transitions

Every phoneme has intrinsic duration modified by context/stress. Formant targets set at **20% and 80%** of segment duration.

```delta
loop forall [%phoneme _^1 <> !^2];
  :: F2 values:
  if
    [%phoneme _^1 high]     -> insert [%F2 2000] ^1...^2;
    [%phoneme _^1 low]      -> insert [%F2 1400] ^1...^2;
    [%phoneme _^1 alveolar] -> insert [%F2 1800] ^1...^2;
  fi;
  ...
pool;
```

**Problem**: Complicated rules for target placement relative to segment edges.

### Model 2: Multi-level Representations, Implicit Transitions

Treat diphthongs like [aɪ] as single syllable nucleus with independent phoneme components:

```
(60) syllable: |        syl         |
     nucleus:  |        nuc         |
     phoneme:  |  a  |  i  |   s    |
```

Each phoneme [i] gets single F2 target (2000 Hz) regardless of context.

**Duration rules** modify first vowel portion in diphthongs:

```delta
loop forall [%phoneme _^bv <~cons> !^av] fence %syllable;
  [%nucleus _^bv <nuc> [%phoneme <~voic>]]
    -> dur(^bv...^av) *= .6;   :: Shorten vowel before voiceless
  ...
pool;
```

Result for "ice" [aɪs]:
```
(66) syllable: |        syl         |
     nucleus:  |        nuc         |
     phoneme:  |  a  |  i  |   s    |
     F2:       | 1400|  2000 | 1800 |
     duration: |  45 |  30  |  90   |
```

### Model 3: Multi-level Representations, Explicit Transitions

Transitions are represented as **independent durational units** rather than implicit interpolations:

```
(61) syllable: |                 syl                  |
     nucleus:  |                 nuc                  |
     phoneme:  |   a    |      i      |      s       |
     F2:       |  1400  |            |2000|          | 1800  |
     duration: |   45   |     90     | 30 |    40    |   90  |
```

The [i] in the diphthong has:
- 90ms transition portion (no F2 target of its own)
- 30ms steady-state portion (with F2 = 2000)
- 40ms transition to following [s]

```delta
loop forall [%phoneme _^1 <> !^2];
  if
    [_^1 <sonorant> <obstruent>]
      -> insert [%duration 40] ^2... project;
    [_^1 <sonorant> <sonorant>]
      -> insert [%duration 90] ^2... project;
  ...
  fi;
pool;
```

### Aspiration Representation

[h] is represented as **aspiration superimposed on transition**, not associated with C or V in CV stream:

```
(70) syll:     |                 syl                  |
     nucleus:  |                 nuc                  |
     CV:       |   C   |           V         |   C   |
     phoneme:  |   g   |           a         |   i   |
     aspiration:|      |  asp  |             |       |
     F2:       | 2000  |       |    1400     | 2000  |
     asp_amp:  |       |  15   |             |       |
     duration: |  50   |  60   |     45      |90| 30 |
```

**Key insight**: The `asp` token is NOT synchronized with C or V - it has duration but no associated phoneme. This:
- Simplifies transition rules (g→a is just C→V, regardless of aspiration)
- Eliminates debate about whether aspiration "belongs to" stop or vowel
- Peterson & Lehiste (1960) found aspiration adds ~25ms (same duration increment as [h])

## Figures of Interest

- **Fig. 1 (p. 111)**: Sample Delta Definition showing phoneme and F0 stream definitions
- **Fig. 2 (p. 112)**: Sample Delta Program structure
- **Fig. 3 (p. 113)**: Underlying Deltas for Bambara Utterances
- **Fig. 9 (p. 119)**: Baseline and Topline for Bambara F0 - declination model
- **Fig. 10 (p. 120)**: Delta Program for F0 Target Assignment
- **Fig. 11 (p. 121)**: Second Formant Pattern for [g h aɪ s] - with aspiration
- **Fig. 12 (p. 122)**: Second Formant Pattern for [g aɪ s] - without aspiration

## Relevance to Qlatt Project

### Highly Relevant: Formant Transition Models

1. **Target placement**: Qlatt could adopt the 20%/80% rule for formant targets within segments

2. **Explicit transitions as duration units**: Model 3's approach of representing transitions as independent timing units maps well to Klatt synthesizer frames

3. **Aspiration handling**:
   - Qlatt's Klatt synthesizer has AH (aspiration amplitude) parameter
   - Hertz's model of aspiration as overlay on formant transition is implementable
   - Duration: ~60ms for aspiration, ~25ms added to vowel duration

4. **Duration modification rules**:
   - Vowel shortening before voiceless: 60% (matches Klatt 1976)
   - Transition durations: 40ms (sonorant→obstruent), 90ms (sonorant→sonorant)

### Applicable Parameters for Qlatt

| Rule | Value | Application |
|------|-------|-------------|
| Vowel before voiceless | 0.6x duration | Pre-fortis clipping |
| Transition dur (son→obs) | 40ms | Formant interpolation |
| Transition dur (son→son) | 90ms | Formant interpolation |
| F0 target position | 50% through nucleus | Pitch contour |
| Aspiration duration | ~60ms | AH parameter timing |

### Multi-level Structure Insights

Qlatt's current linear phoneme representation could be enhanced with:
- Syllable stream for stress-dependent rules
- CV stream for coarticulation rules
- Nucleus stream for F0 placement

## Limitations

- Transition duration rules "hypothetical" - not systematically investigated at time of writing
- Model focused on F2; other formants not detailed
- No handling of F0 downstep phenomena mentioned for Bambara (see Rialland & Sangare 1985)

## Open Questions

- [ ] Are the 40ms/90ms transition durations from measurements or estimates?
- [ ] How do these models compare to Klatt's (1980) transition rules?
- [ ] Did Hertz implement these models in a working synthesizer?

## Related Work Cited

- Peterson & Lehiste (1960) - Duration of Syllable Nuclei in English (aspiration adds ~25ms)
- Rialland & Sangare (1985) - Bambara tone analysis
- Mountford (1983) - Bambara declarative sentence intonation
- Clements & Keyser (1983) - CV phonology
- Keating (1985) - Phonological patterns in coarticulation
- Holmes, Mattingly, Shearme (1964) - Target-and-transition synthesis model

## Quotes Worth Preserving

> "The F0 targets tend to have no durations of their own, serving only to shape the overall F0 contour." (p. 98)

> "Given a CV stream, one might hypothesize that every C and V is associated with a single value for each formant, reflecting the segment's place of articulation. However, this assumption immediately gets us in trouble with [h]..." (p. 103)

> "[h] adds no duration of its own, but rather, is realized by aspiration superimposed on the transition between the preceding and following segment." (p. 104)

> "The absence of h in the phoneme stream... completely eliminates the much-debated problem of whether aspiration of stops in English should be considered for segmentation purposes as part of the preceding stop or part of the following vowel." (p. 105)
