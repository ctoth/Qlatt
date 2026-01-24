# Pages 040-079 Notes

## Chapters/Sections Covered

- Chapter 1 (continued): Sections 1.4 Tonal Implementation, 1.5 F0 Levels versus F0 Changes, 1.6 Intonational Meaning
- Chapter 2: SOME BASIC INTONATIONAL PHENOMENA
  - 2.1 Introduction
  - 2.2 L*, H*, and the Difference between L and H
  - 2.3 The L*+H- Pitch Accent

## Key Concepts

### Text-Tune Alignment via Metrical Trees (pp. 41-46)

Pierrehumbert discusses Liberman's (1975) approach to text-tune alignment using metrical tree structures. Key points:

- Tones in the tune are matched to designated terminal elements of text tree structures
- The Word Rule from Liberman and Prince (1977): In a pair of sister nodes N1 N2, N2 is **s** (strong) iff it branches
- Congruence between trees requires matching of both metrical strength AND bracketing
- Complications arise because matching requires both metrical strength and bracketing to be matched

### Tonal Implementation (Section 1.4, pp. 47-51)

Two kinds of rules are involved in mapping tune to phonetic representation:
1. **Tone evaluation rules** - evaluate tones phonetically
2. **Interpolation rules** - construct F0 contour between target values

Key finding from Chapter 3 experiments:
- Two intonation patterns (H* L- L% vs H* L- H%) were studied as subjects varied pitch range
- The L% values remained fixed for each speaker as higher values varied
- L% defines the **baseline** (bottom of speaker's range)

### The Baseline Transform (p. 49)

$$
\hat{P} = \frac{P - B}{B}
$$

Where:
- P = F0 value of the peak
- B = F0 value of the baseline at the peak location
- P-hat = transformed value (baseline units above baseline)

This transform allows comparison of F0 values across different pitch ranges. The phonetic value of tones is expressed in **baseline units above the baseline**.

### Downstep and Exponential F0 Patterns (pp. 50-51)

The pattern involving downstep is exponential and asymptotic to the baseline:
- Each H following H+L is lowered relative to the preceding H by a constant factor **k** (with k < 1)
- This creates a sequence of phonetic values: k/H1, k^2/H1, ... k^n/H1

Example transcription (p. 50):
```
44) I really believe Ebenezer was a dealer in magnesium.
    |       |         |        |        |
    H*   H-+L*     H-+L*    H-+L*   H-+L* L- L%
```

In H+L H, the L's are related to the H in the same accent by the same factor k that controls downstep. As a result, the last two tones are on the same level if the prominence is the same.

### Tone Evaluation Rules - Iterative Left-to-Right Processing (pp. 51-52)

- Once the sequence of tonal values for the phrase is initialized, T(i+1) is computed as a function of:
  - Its prominence
  - Phonological values of tones to the left
  - Phonetic values of tones to the left
- Downstep only applies when H(i+1) is in contexts H+L ___ or H L+ ___
- Rules are **local** - they refer no further back than the pitch accent preceding the tone being evaluated

### F0 Levels vs F0 Changes (Section 1.5, pp. 54-59)

Pierrehumbert argues for a **two-tone theory** (H and L) over previous four-tone theories:

Arguments against four-tone theories:
1. Tonal specification is sparse in English - many phrases don't contain all four tones
2. Pitch range is used expressively - same phrasal pattern produced at many different pitch ranges
3. The four-tone system creates ambiguity (e.g., L* H* L- L% in moderate range vs L* LM* L- L% in larger range)

Arguments for two-tone with downstep:
- Downstep rule which lowers H after H+L pitch accent creates stepping patterns
- This explains patterns that would require six different levels in a four-tone theory

### Intonational Meaning (Section 1.6, pp. 59-63)

Two approaches to establishing linguistic distinctiveness of intonation patterns:
1. Deduce phonological representation from observed F0 contours, then compare
2. Begin with patterns conveying same/different meanings, construct phonology giving same/different representations

Key observations:
- Intonational meanings are extremely context dependent
- Same pattern (e.g., H% L* H* L- L%) can seem "disgruntled and overbearing" OR "polite and involved" depending on context
- Choice of tune always conveys pragmatic meaning
- Yes/no question patterns (H* H- H%) are pragmatic markers, not grammatical markers

## Chapter 2: Basic Intonational Phenomena

### Introduction (Section 2.1, pp. 64-67)

- Text is divided into **intonation phrases** whose tunes are the basic units of description
- Tunes analyzed in terms of **melodic correlates of stress and phrasing**
- Pitch accents found on at least one but not necessarily all stressed syllables
- Different kinds of pitch accents exist

The **intonation phrase** corresponds to:
- "tone unit" in Liberman (1975)
- "sense group" in Armstrong and Ward (1926)
- "tone group" in Ashby (1978) and Halliday (1967)
- "breath group" in Lieberman (1977)

Structure of intonation phrase:
- H* nuclear accent + L- phrase accent + L% boundary tone = "unmarked breathgroup" (F0 fall at end)
- Contour with H phrase accent and/or boundary tone = "marked breath group" (F0 rise at end)

### L* and H* Pitch Accents (Section 2.2, pp. 68-74)

Three surface differences between H* and L*:

1. **Level difference**: L* is lower than H* in the same context
2. **Prominence behavior**:
   - L* phonetic value **decreases** if prominence increases (saturates toward baseline)
   - H* phonetic value **increases** if prominence increases
3. **Interpolation behavior**:
   - Between two H*s: **nonmonotonic** (dipping) interpolation
   - Between L* and any other tone (L or H): **monotonic** interpolation

Important finding on dipping between H*s (pp. 70-71):
- F0 falls until time to start aiming for next H* level
- Amount of dipping less for H*s closer in time
- Dipping can disappear for H*s sufficiently close together
- Pierrehumbert (1979a) describes a synthesis program computing local minimum between two H* accents as function of separation in time and frequency

### The L*+H- Pitch Accent (Section 2.3, pp. 75-80)

The L*+H- is a **bitonal accent** with L* as the starred (stressed-aligned) tone and H- following.

Phonetic characteristics:
- Primary stressed syllable has very low F0 (the L tone)
- F0 peak (H tone) occurs on following syllable
- Contrasts with H* which has peak on the stressed syllable

Pragmatic uses:
- Indicating incredulousness
- Indicating speaker views reply as incomplete
- Polite hedging ("I do" with L*+H- implies others may also want tea)

Tone spreading rule (from Chapter 5):
- Spreads T- (unstarred tone) to the right when next tone is phonetically equal or higher
- Applied to L*+H- H*: creates plateau (low start, then sustained high)

Timing of H- in L*+H-:
- H- located at fixed time interval after L* (~19-20 centiseconds)
- Speaker KXG: mean 19.1 cs (sigma = 1.8)
- Speaker MB: mean 20.2 cs (sigma = 3.9)
- This interval may represent time needed to execute the F0 change

H- alignment with text in L*+H-:
- L* associates with stressed syllable
- H- follows immediately after L* (governed by stress derivatively)
- In words with long post-accent syllables (newsreel, windmill), H falls in first half of second syllable
- In words with moderate length post-accent syllable, H at end of post-accented syllable
- In words with extremely reduced CV syllable, H falls on next syllable after that

## Tonal Inventory

### Pitch Accents Discussed
| Accent | Description |
|--------|-------------|
| H* | High pitch accent - peak on stressed syllable |
| L* | Low pitch accent - valley on stressed syllable |
| L*+H- | Bitonal rising accent - L on stress, H follows |
| H*+L | Bitonal falling accent (mentioned) |
| H-+L* | Bitonal accent with leading H phrase accent |

### Phrase Accents
| Accent | Description |
|--------|-------------|
| H- | High phrase accent |
| L- | Low phrase accent |

### Boundary Tones
| Tone | Description |
|------|-------------|
| H% | High boundary tone (rising end) |
| L% | Low boundary tone (falling to baseline) |

## Phonological Rules

### Downstep Rule
- Lowers the location of H after a H+L pitch accent
- Each subsequent H is lowered by factor k relative to preceding H
- k < 1 (constant ratio)
- Creates exponential decay toward baseline
- In H+L H, both tones following H+L are related by same factor k

### Tone Spreading Rule (mentioned, detailed in Ch. 5)
- Spreads T- to the right when next tone is phonetically equal or higher
- Creates plateaus in contours like L*+H- H*

### Interpolation Rules
- **Between two H*s**: Nonmonotonic (dipping) - F0 falls then rises
- **Between L* and any tone**: Monotonic (straight line interpolation)
- **Between L and H in general**: Monotonic

### H- Timing Rule for L*+H-
- H- occurs at fixed time interval (~19-20 cs) after L*
- Independent of segmental content between L* and H-

## Phonetic Implementation

### Baseline
- L% values remain fixed for each speaker across pitch ranges
- Defines bottom of speaker's range
- Falls slightly through utterance (declination)

### F0 Scaling Transform
$$
\hat{P} = \frac{P - B}{B}
$$
- Expresses tonal values in baseline units above baseline
- Allows cross-speaker and cross-range comparison

### Peak Location
- H* peak: near end of accented syllable (or earlier if followed by L- phrase accent and syllable is lengthened)
- L* valley: readily located at point where rise to following H* starts
- L*+H- timing: H- at fixed interval (~19-20 cs) after L*

### Prominence Effects
- Increased prominence -> H* goes UP (toward ceiling)
- Increased prominence -> L* goes DOWN (saturates toward baseline)
- L* lowering saturates because it cannot go below baseline
- H* raising shows no practical ceiling saturation

### Dipping Between H*s
- Local minimum computed as function of:
  - Separation in time between H*s
  - Separation in frequency between H*s
- Closer H*s -> less dipping
- Sufficiently close H*s -> no dipping (direct interpolation)

## Equations Found

### Baseline Transform
$$
\hat{P} = \frac{P - B}{B}
$$
Where:
- P = F0 value at peak
- B = baseline value at that location
- P-hat = transformed value in baseline units

### Downstep Sequence
$$
T_{n} = k^n \cdot H_1
$$
Where:
- H1 = first H value
- k = downstep factor (0 < k < 1)
- Tn = nth H tone value after n downsteps

## Parameters Found

| Name | Symbol | Value | Units | Context |
|------|--------|-------|-------|---------|
| Downstep factor | k | < 1 | ratio | Multiplicative factor for each downstep |
| L*+H- timing (KXG) | - | 19.1 | centiseconds | Mean interval from L* to H- |
| L*+H- timing (KXG) sigma | sigma | 1.8 | centiseconds | Standard deviation |
| L*+H- timing (MB) | - | 20.2 | centiseconds | Mean interval from L* to H- |
| L*+H- timing (MB) sigma | sigma | 3.9 | centiseconds | Standard deviation |

## Figures of Interest

- **Fig 17, 18** (referenced): F0 contours showing foregrounded vs backgrounded peaks with constant ratio
- **Fig 19** (referenced): Graph paper for phonetic value of tones (baseline units)
- **Fig 20** (referenced): Shows how assumptions apply to peak relations
- **Fig 21** (referenced): Downstep pattern - exponential decay toward baseline
- **Figures 1-8** (referenced): Show H* and L* contrasts in various contexts
- **Fig 9** (referenced): H% L* H* L- L% contour at two degrees of emphasis
- **Figures 10, 11** (referenced): Dipping between two H*s
- **Figure 12** (referenced): Flat contour between two L*s
- **Figure 13** (referenced): F0 configurations with/without dips
- **Figure 14** (referenced): Spontaneous speech L* L- L% contour
- **Figure 15** (referenced): "Contradiction contour" with L* nuclear between L- and L*
- **Figures 16, 17** (referenced): Comparison of accented vs deaccented syllables
- **Figures 18, 19** (referenced): Dipping between two H*s in different contexts
- **Figure 20** (referenced): H-+L* H* showing straight interpolation (downstepped H*)
- **Figure 21** (referenced): L- phrase accent raising H* under increased prominence
- **Figures 22, 23** (referenced): L*+H- vs H* contrast on "legumes" and monosyllables
- **Figure 24** (referenced): L*+H- H* contour with tone spreading
- **Figure 25** (referenced): L*+H- alignment examples

## Quotes Worth Preserving

> "In our model, the interpolation between one target and the next is carried out when the value of the target on the right becomes available." (page 52)

> "The two basic patterns were produced by the subjects in a wide variety of pitch ranges, in response to a number indicating the degree of overall emphasis with which the pattern was to be produced." (page 48)

> "It was found that the lowest F0 values, corresponding to L%, remained fixed for each speaker as higher values varied. These values may be taken as defining the bottom of the speaker's range, or the lowest value he is disposed to produce at the given location in the utterance." (page 48)

> "The course of this bottom of the range over the utterance will be referred to as the baseline." (page 48)

> "The nonmonotonic interpolation rule for H*s means that they typically show up as peaks in the F0 contour." (page 71)

> "The hypothesis suggested by this corpus of F0 contours was that the H- is located at a given time interval after the L*, regardless of the stress pattern on the material following the accented syllable." (page 77)

## Implementation Notes

### For TTS F0 Generation

1. **Baseline computation**:
   - Establish speaker's baseline (lowest comfortable F0)
   - Baseline falls slightly through utterance (declination)
   - All tonal targets computed relative to baseline

2. **Two-pass processing**:
   - First pass: Identify pitch accents, phrase accents, boundary tones
   - Second pass: Compute F0 targets iteratively left-to-right

3. **Downstep implementation**:
   - Track "current reference H level"
   - After each H+L accent, multiply reference by k
   - Subsequent H values scaled to new reference
   - Typical k value to be determined from Chapter 4

4. **Interpolation strategy**:
   - H* to H*: Compute local minimum based on time/frequency separation
   - L* to anything: Linear interpolation
   - L to H: Linear interpolation
   - Only unstarred tones subject to spreading

5. **L*+H- timing**:
   - Place L* on stressed syllable
   - Place H- approximately 190-200 ms after L*
   - This is relatively invariant to segmental content

6. **Prominence scaling**:
   - Higher prominence -> raise H* targets
   - Higher prominence -> lower L* targets (toward baseline, saturates)
   - Prominence affects relative height but not baseline

7. **Key insight for synthesis**:
   - F0 targets are computed in baseline units, then scaled
   - This allows same tune to be produced at different pitch ranges
   - Transform: actual_F0 = baseline * (1 + target_in_baseline_units)
