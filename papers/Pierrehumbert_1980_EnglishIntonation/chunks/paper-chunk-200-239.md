# Pages 200-239 Notes

## Chapters/Sections Covered

- **Chapter 4 (continued)**: Section 4.10 - Downstep and the Layered Theory of Intonation, Footnotes to Chapter 4
- **Chapter 5**: Tone Spreading
  - 5.1 Introduction
  - 5.2 Rightward Spreading
  - 5.3 The H*+H- Accent
  - 5.4 Leftward Spreading
  - Footnotes for Chapter 5
- **Chapter 6**: Conclusion (begins on page 236)

## Key Concepts

### Downstep Mapping Rules (from African tone languages comparison)

The downstepping sequence has an exponential form in baseline units above the baseline. Rules 24-28 describe systems with total downdrift, total downstep, or both depending on how tones are organized into tree structures.

**Rule 26 - F0 Mapping for Downstep:**
$$
/n/ = V(k^n) \quad \text{where } 0 < k < 1
$$
Where:
- V = V(k^0) is the value of the highest tone
- k is the downstep factor
- Values are in baseline units above the baseline

**Rule 27 - Two-tone System:**
- a) /T_1/ = V
- b) /T_{i+1}/ = k/T_i/ for H_i L_{i+1}, else = /T_i/ otherwise

**Rule 28 - Detailed Tone Mapping:**
- a) /T_1/ = V
- b) /L_{i+1}/ = k/H_i/
- c) /H_{i+1}/ = (1/k)/L_i/
- d) /H_{i+1}/ = /L_i^-/
- e) /[alpha high]_{i+1}/ = /[alpha high]_i/

### English Downstep Characteristics

- English has **partial downstep** in H L+H and **total downstep** in H*+L-H
- The downstep coefficient k varies between its minimum value and 1 as a reflex of the relevant semantic continuum
- Interrogative sentences exhibit declination even though they are not downstepped
- H tones later in the phrase are somewhat lower than H's earlier (exponential in baseline units)

### Pitch Interpretation Principle (Rule 29 - Partial Downstep)

Given two non-adjacent like tones T_j, T_k separated in the tone group only by tones not identical to them:
- i) T_j is higher in pitch than T_k if the (unique pair of) sister nodes dominating T_j and T_k are labelled (h, l) respectively
- ii) Otherwise (i.e., if nodes are labelled (h, l)), T_k is higher in pitch than T_j
- b) Neighboring tones do not cross levels

### Layered Theory of Intonation (Section 4.10)

Two approaches to building F0 patterns:
1. **Pierrehumbert's approach**: Differences in overall configuration traced to tonal differences and local phonetic rules
2. **Layered/superposition approach**: Bottom layer represents phrasal intonation type, pitch accents added onto it

Key observations:
- F0 contours with steeper downslope than declination are analyzed as downstepping pitch accents
- Extra high pitch at end of yes/no questions attributed to upstep rule affecting boundary tones
- Same theoretical primitives (tones) describe both stress (pitch accents) and phrasal intonation (phrase accent + boundary tone)

### Danish Intonation (Thorsen's Data)

- Danish has only one type of pitch accent corresponding to L*+H- in Pierrehumbert's framework
- Stressed syllable is low, then rapid rise on following unstressed material, gradual fall to next low
- Questions distinguished from declaratives by overall trend of F0 contour rather than local features
- Completed declaratives: line falls steeply
- Questions: line falls slightly if at all
- Non-final declarative: slope in between

## Tonal Inventory

### Pitch Accents with Floating Tones

| Accent | Floating Tone | Can Spread Right | Notes |
|--------|---------------|------------------|-------|
| L*+H- | H- | Yes (to H%) | Common pattern |
| H*+H- | H- | Yes | Creates sustained high plateau |
| L*+H- | H- | Yes (before L%) | Falls gradually |
| H*+L- | L- | No target value | L- not mapped |

### Spreading Behavior Summary (Table I, page 232)

| Pitch Accent | Phrase Accent | Phonetic Relation | With Spreading | Without Spreading |
|--------------|---------------|-------------------|----------------|-------------------|
| L* | H- | > | no | yes |
| H* | L- | < | no | yes |
| L*+H- | L- | < | no | yes |
| L-+H* | L- | < | no | yes |
| H*+L- | L- | < | no | yes |
| H*+L- | H- | < | no | yes |
| H-+L* | L- | < | no | yes |
| H*+H- | L- | < | no | yes |
| H* | H- | = | yes | maybe |
| L*+H- | H- | = | yes | yes |
| L-+H* | H- | = | yes | maybe |
| H-+L* | H- | = | yes | yes |
| H*+H- | H- | = | yes | yes |
| L* | L- | = | yes | yes |

## Phonological Rules

### Tone Spreading Rules

**Rule 1 - Rightward Spreading:**
$$
T^-_i \text{ spreads towards } T_{i+1} \text{ if } /T_{i+1}/ \geq /T^-_i/
$$

**Rule 2 - Leftward Spreading:**
$$
T^-_i \text{ spreads towards } T_{i-1} \text{ if } /T_{i-1}/ = /T^-_i/
$$

Key observations:
- Rightward spreading is more common than leftward spreading (anticipation less marked than perseveration)
- Spreading only occurs when the floating tone (T-) would persist in time
- The rule must be stated in terms of phonetic values (not tonal values) because prominence and upstep contribute to determining when spreading occurs

### Conditions for Spreading

Spreading of phrase accent to the right occurs in:
- H- H%
- L- H%
- L*+H- H*

Spreading does NOT occur in:
- L- L% (boundary tone is lower)
- L*+H- L (fails Rule 1)

### Echo Accents

- Accentable syllables past the nuclear accent often carry a miniature replica of the nuclear accent
- In H* L- contours: small peaks on accentable syllables following nuclear accent
- In L* H- contours: small dips
- Echo accents are marked by parenthesized tones in transcription

## Phonetic Implementation

### F0 Values for Boundary Tones

- L% in utterance final position: median 137 Hz for JBP
- In L- H% contours: F0 never falls below ~160 Hz
- In L- L% contours: gradual fall after nuclear accent ~20 Hz
- For L- H%: value somewhat above baseline maintained until rise for H% begins
- For L- L%: fall from baseline begins immediately at phrase accent

### Downstep Phonetic Realization

The downstep coefficient k reduces the pitch range:
- Rises from L to H grow smaller through the course of a declarative sentence
- Even when plotted in semitones, this is visible (Figure 54)
- Different phrasal intonation types (questions, declaratives, non-finals) can be described by variation of a single parameter k

### H*+H- Accent Characteristics

- Creates sustained high F0 on unaccented syllables instead of dipping between H* accents
- Only contrasts with H* in environments where H- would spread (when next tone is equal or higher)
- In non-spreading environments, H*+H- realized as single peak (neutralized with H*)
- Distinctive attributes seen only in level or rising configurations

### Prominence and F0 Plateau

In H*+H- H* sequences:
- Two H tones in an H*+H- would have same phonetic value
- The H- which produces the plateau must belong to H*+H- accent on preceding word
- "Intermediate" uses up its unstarred tone generating downstep to the F0 plateau on the left

## Equations Found

$$
/n/ = V(k^n) \quad \text{where } 0 < k < 1
$$
Where: V is peak F0 value, k is downstep factor, n is tone position

$$
P_n(DS) = k^n P_n
$$
Where: P_n is underlying prominence for nth step, P_n(DS) is derived value after downstep

$$
\frac{P_n(DS)}{P_{n-1}(DS)} = \frac{kP_n}{P_{n-1}}
$$

$$
P_n(DS) = \frac{k \cdot P_{n-1}(DS) \cdot P_n}{P_{n-1}}
$$

$$
P_{n-1} = \frac{P_{n-1}(DS)}{k^{n-1}}
$$

## Parameters Found

| Name | Symbol | Value | Units | Context |
|------|--------|-------|-------|---------|
| Downstep factor | k | 0 < k < 1 | ratio | Multiplicative factor for each downstep |
| L% median (JBP) | - | 137 | Hz | Utterance final L% |
| L- H% floor | - | ~160 | Hz | F0 never falls below this before H% |
| L- L% fall | - | ~20 | Hz | Gradual fall after nuclear H* |
| MYL L- H% rise | - | ~10 | Hz | Smaller pitch range speaker |

## Figures of Interest

- **Fig 52** (referenced p.201): Two-tone system with total downdrift and no downstep
- **Fig 53** (referenced p.201): Kikuyu result - no downdrift of H after surface L, total downstep of H after floating L
- **Fig 54** (referenced p.210): Thorsen's Danish data - L*s and F0 contour on last L*
- **Figures 1 & 2** (referenced p.219): Tone spreading examples - L- or H- before H%
- **Figures 3 & 4** (referenced p.219): H- in L*+H- spreads to right when followed by H*
- **Figure 5** (p.219): H*+H- example - high F0 sustained on unaccented syllables
- **Figure 6** (p.222): F0 contours for L- H% vs L- L%
- **Figure 7** (p.223): MYL F0 contours with smaller pitch range
- **Figures 8 & 9** (p.223): Echo accents marked by parenthesized tones
- **Figure 10** (p.223): Echo accent outcome when minimally present
- **Figures 11 & 12** (p.224): F0 contour showing echo accents reverting toward H- level
- **Figures 14, 17, 18** (p.228-229): H*+H- accent examples showing level/rising configurations
- **Figure 19** (p.229): Typical H* contour with alternating prominence
- **Figures 20, 21** (p.229): Hypothetical impossible contours predicted by Rule 1
- **Figure 22** (p.229): Actual contour closest to hypothetical (H*+H- H-+L* H* L- L%)
- **Figures 23, 24** (p.233): H-+L* contours - H- higher vs same as preceding tone
- **Figure 25** (p.234): Two possible outcomes for H-+H* context

## Quotes Worth Preserving

> "The most interesting of these rules was tone spreading, which spreads T- when the next tone is equal or higher. One of the main themes of the thesis was that the phonetic implementation rules have interesting and language specific properties." (page 237)

> "A quantitative representation of the intonation pattern is computed from the phonological representation by a package of local context-sensitive rules, which applies iteratively left to right." (page 236)

> "We argued that downstep and upstep should be accounted for by tone evaluation rules, and compared the English versions of these rules to versions required in African tone languages." (page 237)

> "The bitonal accents in our theory share an additional advantage of the approach in Bolinger (1958) over tone level theories in which each tone in the string is taken to be selected independently." (page 238)

> "Not all pitch accents are implemented as F0 excursions." (page 235, footnote 3)

## Implementation Notes

### For TTS F0 Generation

1. **Downstep Implementation**:
   - Use exponential decay: each H after an L is scaled by factor k (typically 0.8-0.9)
   - The downstep factor k can vary semantically (closer to 1 = less downstep = more emphasis)
   - Apply downstep rules iteratively left-to-right

2. **Tone Spreading Algorithm**:
   - Check phonetic values, not just tone types
   - Rightward spreading: T- spreads if next target >= current T- value
   - Leftward spreading: T- spreads only if previous target = current T- value (more restricted)
   - Result: T- perseverates in time (plateau effect)

3. **Echo Accent Generation**:
   - On accentable syllables after nuclear accent
   - Small-scale replica of nuclear pattern
   - H* L-: small peaks; L* H-: small dips
   - Scale is very small - difficult to separate from segmental effects

4. **H*+H- vs H* Distinction**:
   - H*+H- creates plateau; H* creates peak
   - Only distinguishable when followed by tone >= H- value
   - In non-spreading contexts, neutralize to single peak

5. **Interpolation Rules**:
   - Between L and any other tone: monotonic interpolation produces flat contour
   - L% is upped to level of H- in L- L% when L- significantly above baseline
   - The fall to L% in H* L- L% is gradual (~20 Hz over phrase)

6. **Key Insight for Implementation**:
   - Spreading rules must reference phonetic values (after prominence/upstep applied)
   - Cannot be formulated purely in terms of tone types
   - This is why the system uses quantitative phonetic representation computed from phonological representation

### Three-Component Phonological Representation

1. **Grammar for tunes**: Generates well-formed strings of H and L tones (pitch accents = single tone or bitonal pair with strength relation + phrase accent + boundary tone)
2. **Metrical grid**: For the text of the phrase
3. **Alignment rules**: Connect tune to text based on structure of both

### Advantages of Two-Tone Theory

- Simple mathematical form for rules
- Explains asymptotic approach to baseline without extra assumptions
- Captures prominence differences via single transcription (range differences from prominence, not tone choice)
- Handles downstepped contours with >4 distinct levels using just 2 tones + context rules
