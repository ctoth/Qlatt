# Pages 160-199 Notes

## Chapters/Sections Covered

This chunk covers portions of **Chapter 4: The Phonetic Interpretation of Tones** (sections 4.3 through 4.9):

- 4.3 Left-To-Right Tonal Implementation in Other Contexts (p. 161)
- 4.4 The Scaling of Downsteps (p. 168)
- 4.5 Upstep (p. 177)
- 4.6 Does an Upstepping Pitch Accent Exist in English? (p. 183)
- 4.7 Ambiguities (p. 186)
- 4.8 The Representation of Pitch Range (p. 190)
- 4.9 The Hierarchical Representation of Downstep (p. 196)

## Key Concepts

### Left-to-Right Iterative Tone Mapping

The tone mapping rules apply iteratively from left to right, with each tone's value computed in relation to the immediately preceding tone. This is central to the exponential character of downstep - it strongly suggests an iterative process is at work. The value of all tones, whether downstepped or not, are computed in relation to immediately preceding tonal values.

Key observations:
- The value of an H tone is carried through onto a following H tone of equal prominence
- Differences in prominence are scaled accordingly (following H may be readjusted by downstep)
- The value of L tones is computed in relation to immediately preceding tones
- In bitonal accents, the L phrase accent and L% are related differently to a preceding H

### Downstep Scaling - Exponential Model

The downstep rule produces an exponential decay in baseline units above the baseline. The key formula for successive H values in a downstepped sequence:

$$
H_{i+1} = k \cdot H_i / \quad \text{where } 0 < k < 1
$$

This means the total sequence of values can be described as:

$$
V(k^n)
$$

Where:
- V = /H_1/, n is the index
- k is the downstep coefficient
- The value of tones is expressed in baseline units above the baseline

**Critical finding**: The model predicts that the size of the first step is constant, regardless of the number of steps in the phrase (no look-ahead). The phonetic value of the nuclear accent is lower the longer the phrase.

### Downstep Step Size Data

From the pilot experiment (Table I, page 172):

| Sentence | Step Size (semitones) |
|----------|----------------------|
| 12) "I really believe him" | -6.4 |
| 13) "I really believe Ebenezer" | -5.2 to -4.7 |
| 14) "I really believe Ebenezer was a dealer" | -5.7 to -4.1 to -3.4 |
| 15) "I really believe Ebenezer was a dealer in magnesium" | -5.9 to -3.9 to -1.6 to -2.4 |

**Key result**: Steps are NOT equal in semitones - they decrease as the phrase progresses.

### Baseline Units Model vs. Equal Interval Model

Two alternative hypotheses tested:
1. **Equal Interval Model**: Constant musical interval (semitones) - predicts constant step size
2. **Baseline Units Model**: Constant ratio of baseline units above baseline - predicts decreasing step sizes

**Results** (Tables III and IV, pp. 173-174):
- Equal Interval Model: Mean absolute deviation = 1.5 semitones, 19.5 Hz
- Baseline Model: Mean absolute deviation = 0.5 semitones, 6.2 Hz

The baseline model fits **three times better** than the constant interval model. The baseline was estimated from 150 Hz to 140 Hz; step size was taken to be 0.60 (the mean ratio of baseline units).

### Upstep

Upstep is the boundary tone being upstepped after H- phrase accent. The magnitude of the difference between L% and H% after H- appears comparable to that after L-; but L%, whose value is 0 after L-, has a higher value of H- after H-, and H% is accordingly higher.

Key properties:
- Unlike downstep, upstep has an **addend** (not a pure ratio rule)
- Rule 9 formulation: When T is L%, the old value is 0 and new value is /H-/. When T is H%, the old value can be anywhere in a fairly large range
- The upstepped /H%/ is also quite variable since /H%/ varies as an expression of how non-final the utterance is
- Upstep readjusts a tone whose value is 0 to have the non-zero value of the preceding tone

### General Upstep/Downstep Formula

A possible general recursive formula for subsequent upstepped or downstepped tones:

$$
|T_{n+1}| = (1-a) \cdot |T_n| + at \quad \text{where } 0 < a < 1
$$

This is a reexpression of:

$$
|T_{n+1}| = a/T_n/ + b
$$

Which brings out the asymptotic value, t. The form takes as a readjustment rule if recursion is carried out by independent rules such as rule 2:

$$
|T| = (1-a) \cdot |T| + at
$$

- For **downstep**: t = 0 and the addend is therefore 0; perhaps all downstep rules have t = 0
- For **upstep**: t is the ceiling of the pitch range for the phrase as a whole; t need not correspond to the absolute top of the range

### Upstep Function and Asymptote

Because downstep generates an exponential curve asymptotic to the baseline, downstepped sequences can in principle be of indefinite length. The upstep function has no asymptote - nothing in principle prevents the upstep rule from generating values higher than the top of the speaker's range. What prevents this in practice is that one's normal speaking range is nearer the bottom than the top of one's maximum range, and that the context for upstep is not met iteratively.

### Tonal Ambiguities

Several sources of ambiguity arise from the downstep rules:

1. **Downstep vs. Prominence**: An F0 contour with higher peak on first w than second could arise because:
   - First w is more prominent than second
   - Second accent was downstepped (even with first less prominent)

2. **Rule 10 neutralization**: L- in H*+L- doesn't appear on surface, neutralizing H*+L- with H* before a L phrase accent

3. **H*+H- vs. H* H* ambiguity**: F0 configuration in Figure 48 is three ways ambiguous - H*+H- H* H* possible in addition to the two analyses mentioned

### Pitch Range Representation

Three levels contribute to the phonetic value of a tone:
1. Speaker's choice of pitch range for the phrase (cutsy style, aside, etc.)
2. Effects of prominence on tonal values within the phrase
3. Tonal values defined at each tonal position (e.g., in H-+L* L-, /L*/ != /L-/ even though both under same prominence)

Two alternative formulations for pitch range representation:

**Clements (1979) approach**: Pitch range is reified at each tonal location - a value for both (or all) possible tones is computed, and then the actually occurring tone is instantiated as an F0 target. Prominence effects would be handled by computing range on the basis of prominence for each tonal location.

**Amana approach**: A unit of range (the "Amana") is initialized at x baseline units above the baseline but whose definition in baseline units above the baseline could be changed by rules like downstep. This allows rules to expand or compress the "graph paper" on which tonal values are computed.

## Tonal Inventory

### Pitch Accents Discussed
- H* (simple high)
- L* (simple low)
- H*+L- (high with trailing low)
- L*+H- (low with leading high)
- H-+L* (leading high with low)
- L-+H* (leading low with high)
- H*+H- (high with trailing high - generates plateau, introduced in Chapter 5)

### Phrase Accents
- H- (high phrase accent)
- L- (low phrase accent)

### Boundary Tones
- H% (high boundary)
- L% (low boundary)

## Phonological Rules

### Rule 2 (H tone scaling)
Computes the value of H* or H in a bitonal accent in relation to that of a preceding H tone. The value of the following H may then be readjusted by downstep.

### Rule 7 (L* scaling)
According to rule 7, equally prominent L*s are also assigned equal phonetic values. This behaviour is NOT shared by all L tones - the value of the L tone is computed differently in different contexts.

### Rule 8 (Downstep)
H is downstepped only after H-L and H in L-H, only after H. Rule 5 for L- after H(+T) computes L- as a ratio of the value of the preceding accent, the nuclear accent. Rules 3, 4, 6, and 7 also look no further back than the previous accent.

### Rule 9 (Upstep)
Preliminary statement: When T is L%, the old value is 0 and so the new value is /H-/. When T is H%, the old value can be anywhere in a fairly large range.

### Rule 10 (L- non-appearance)
Prevents the L- in H*+L- from appearing on the surface. Since downstep affects only H tones, this rule neutralizes H*+L- with H* before a L phrase accent or a L* pitch accent.

## Phonetic Implementation

### Downstep Coefficient
From experimental data, the downstep coefficient k is approximately **0.60** (mean of observed steps measured as ratio of baseline units above baseline).

### Baseline Estimation
- Initial baseline (start of phrase): ~150 Hz
- Terminal baseline (end of phrase): ~140 Hz
- Baseline declines linearly through the phrase

### Step Size Measurements
- First step: ~6 semitones (or ~30 Hz)
- Later steps: progressively smaller
- Step size is constant when measured in baseline units above baseline (not Hz or semitones)

### F0 Measurement Points
- For H*s: F0 peak
- For L*s in H-+L*: amplitude maximum of the vowel (no F0 peak on accented vowel)

## Equations Found

### Downstep Sequence
$$
H_{i+1} = k \cdot H_i / \quad \text{where } 0 < k < 1
$$

Where H values are in baseline units above baseline.

### Total Downstep Sequence
$$
V(k^n)
$$

Where V = /H_1/, k is downstep coefficient, n is index.

### General Recursive Formula (Downstep + Upstep)
$$
|T_{n+1}| = (1-a) \cdot |T_n| + at \quad \text{where } 0 < a < 1
$$

Equivalent to:
$$
|T_{n+1}| = a/T_n/ + b
$$

Where t is the asymptotic value.

### Simplified Adjustment Rule
$$
|T| = (1-a) \cdot |T| + at
$$

### Upstep in H- T context (for L%)
$$
\text{In H}^- \text{T: } |T| = (1 - |H^-|/) \cdot |T| + |H^-|/
$$

Taking at = /H-/ and assuming t = 3 baseline units above baseline:

$$
\text{In H}^- \text{T: } |T| = (1 - |H^-|/3) \cdot |T| + |H^-|/3
$$

## Parameters Found

| Name | Symbol | Value | Units | Context |
|------|--------|-------|-------|---------|
| Downstep coefficient | k | 0.60 | ratio | Mean step size in baseline units |
| Initial baseline | - | 150 | Hz | Start of declarative phrase |
| Terminal baseline | - | 140 | Hz | End of declarative phrase |
| First step size | - | ~6.4 | semitones | Short sentence |
| First step size | - | ~30 | Hz | Short sentence |
| Upstep ceiling | t | ~3 | baseline units | Estimated value above baseline |

## Figures of Interest

- **Figure 35** (referenced): F0 contour for H*+L- H*+H- H*, illustrates how medial H* is downstepped in context of first accent
- **Figure 36** (referenced): All patterns with H*+H- accents, /H-/ = /H*/
- **Figure 37** (referenced): Two F0 contours for H*+L- H* L- L% sharing same phonetic value for H* in H*+L-
- **Figure 38** (referenced): H-+L* H- pattern
- **Figure 39** (referenced): Behavior of H-+L* sequences under changes in overall pitch range
- **Figure 40** (referenced): L* L- cases where L- is assigned same phonetic value as preceding L*
- **Figure 41** (referenced): Relationship between H% and H* for a typical subject
- **Figure 42** (p. 170): Results of downstep pilot experiment - F0 values showing stepping pattern
- **Figure 43** (referenced): H% after H- phrase accent
- **Figure 44** (referenced): Utterances with two successive upsteps
- **Figure 45** (referenced): Upstepped sequence curve with t = 3 baseline units
- **Figure 46** (referenced): Rising F0 contour with H*+H- accents
- **Figure 47** (referenced): L* H* H* contour generating three-level rise
- **Figure 48** (referenced): Three-way ambiguous F0 configuration (H*+H- H* H*)
- **Figure 49** (referenced): Downstep vs. prominence ambiguity (w w s structure)
- **Figure 50** (referenced): Two peaks slightly higher than first - H* H* or H*+L- H*
- **Figure 51** (referenced): Hierarchical representation example with terracing spans

## Quotes Worth Preserving

> "In the case of downstep, the exponential character of the result strongly suggests that an iterative process is at work." (page 161)

> "The model predicts that the size of the first step is constant, regardless of the number of steps in the phrase. This follows because the model has no look-ahead." (page 168)

> "The results of the pilot experiment confirmed our proposal over both of the alternatives." (page 169)

> "Thus, even a rough estimate of the baseline enables the downstep rule operating in the domain of baseline units above the baseline to fit three times better than the constant interval model." (page 175)

> "Because downstep generates an exponential curve asymptotic to the baseline, downstepped sequences can in principle be of indefinite length." (page 179)

> "The fact that upstep, unlike downstep, has an addend follows from the qualitative features of the patterns observed. Upstep readjusts a tone whose value is 0 to have the non-zero value of the preceding tone." (page 179)

> "The lack of an iteratively upstepping pitch accent is not accidental, but appears to be related to the relationship of phonetic value and prominence in English." (page 186)

> "In our discussion of English, we have seen three levels which contribute to the phonetic value of a tone." (page 197)

## Implementation Notes

### For TTS F0 Generation

1. **Downstep Implementation**:
   - Use exponential decay model: `H_next = k * H_current` where k ~ 0.60
   - Values should be computed in "baseline units above baseline" not raw Hz
   - Baseline itself declines through the phrase (150 Hz -> 140 Hz for declarative)
   - Convert back to Hz only after all scaling is computed

2. **Left-to-Right Processing**:
   - Process tones strictly left to right
   - Each tone's value depends only on the immediately preceding tone
   - No look-ahead is needed or used

3. **No Look-Ahead Consequence**:
   - First downstep is constant size regardless of phrase length
   - Nuclear accent will be lower in longer phrases
   - This is a feature, not a bug - matches natural speech

4. **Upstep Implementation**:
   - After H- phrase accent, boundary tone is upstepped
   - Use formula: `T_new = (1-a) * T_old + a*t` where t is ceiling (~3 baseline units)
   - L% after H- gets value of /H-/ (since L% old value is 0)
   - H% after H- is higher than H% after L-

5. **Downstep Triggers**:
   - L*+H-, L-+H*, H*+L-, and H-+L* all trigger downstep
   - Specifically: H is downstepped only after H-L or H in L-H, only after H

6. **Terracing Spans**:
   - Each new downstep trigger starts a new terracing span
   - If no downstep context, whole utterance can be one span
   - In H+L accent chain: new span begins with H of each accent
   - In L+H accent chain: new span includes tone governed by one prominence and first tone governed by next
   - H- phrase accent starts new span for H+L H-
   - Boundary tone starts new span after H- (when upstepped) but not after L-

7. **Pitch Range Initialization**:
   - Speaker chooses pitch range for phrase
   - Can be compressed (parenthetical, aside) or expanded (emphasis)
   - After series of downsteps, reinitialization to initial range is typical
