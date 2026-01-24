# Pages 120-159 Notes

## Chapters/Sections Covered

- **Chapter 3 (continued)**: Section 3.2 - Pitch range experiments (conclusion)
  - Tables I, II, III, IV - Statistical data on L%, H*, peak scaling
  - Section 3.3 - Is the Baseline Invariant?
  - Section 3.4 - Hypotheses about the Implementation of Intonation
- **Chapter 4**: DOWNSTEP, UPSTEP, AND LEFT-TO-RIGHT TONAL IMPLEMENTATION
  - Section 4.1 - Introduction
  - Section 4.2 - The Qualitative Behaviour of the Downstepping Accents

## Key Concepts

### F0 Baseline Model

The baseline is a speaker-invariant reference level representing the lowest F0 value a speaker would reach at any point in the utterance. Key properties:

- L% is the only tone whose value is ON the baseline
- L-, H%, and H* are all ABOVE the baseline
- Their values increase with overall pitch range
- The baseline declines during the utterance (declination)
- Baseline slope varies in inverse proportion to utterance length
- Total drop remains constant regardless of length (~14 Hz for male, ~33 Hz for female speakers)

### Peak Scaling Model

F0 peaks are scaled as the peak-to-baseline difference divided by the baseline value at the location of the peak:

$$
\hat{P} = \frac{P - b_p}{b_p}
$$

Where:
- P = peak F0 value in Hz
- b_p = baseline value at the peak location
- $\hat{P}$ = scaled peak value

The A and B peaks in a two-accent phrase are related by a constant ratio regardless of pitch range:

$$
\hat{A} = c \cdot \hat{B}
$$

Where c is a constant greater than 1 (typically 1.4-1.5 for speakers studied).

### Three Key Hypotheses for Intonation Implementation

1. **Baseline is speaker-invariant**: The hypothetical bottom of the pitch range to which tonal values are referenced is an invariant feature of the speaker's voice. Differences in F0 contour configuration arise from differences in tonal specification and prominence, not from declination.

2. **Local prominence relations apply within the phrase**: A gradually declining baseline is defined within the phrase, and the phonetic value of tones is computed in baseline units above the baseline. The notation /T/ represents the phonetic value of a tone in these units. Prominence relations between two H tones are expressed as a ratio between their phonetic values.

3. **Baseline plays a role in perception**: Listeners can tell whether the F0 contour has reached the speaker's baseline or not, enabling categorical decisions in the intonation system (e.g., distinguishing declarative terminal fall from vocative).

### Declination vs Downstep

Both shift downward the pitch range location at which a tonal type is implemented:
- **Declination**: Gradual, continuous baseline decline over the utterance
- **Downstep**: Discrete lowering triggered by specific tonal sequences (H after L)

Downstep in English has substantial similarities to downstep in African tone languages:
- The tonal value for H is lowered after L
- The new value for H governs not only the downstepped H but also any H's to the right
- Lowering due to downstep is OVER AND ABOVE lowering due to declination

Key difference: In English, downstep is conditioned by the morphological organization of intonation (H+L H and H L+H sequences in pitch accents), not by alternating tonal sequences as in African languages.

### Downstep Rule Formulation

The downstep rule (Rule 8):

$$
\text{In H+L } H_i \text{ and H L+H}_i: \quad /H_i/ = k/H_i/
$$

Where 0 < k < 1 (the downstep factor).

The upstep rule (Rule 9):

$$
\text{In H}^- \text{ T}: \quad /T/ = /H^-/ + /T/
$$

This raises the target for L or H after an H- phrase accent to be either at the same level as H- (if L%, giving L%) or higher (if H%, giving H%).

### Left-to-Right Implementation

The F0 contour can be computed by local rules applying iteratively left to right:
- Each level is a constant ratio of the previous level above the baseline
- The increment for computing a new tone value can refer back at most as far as the previous pitch accent
- Values computed under previous iterations are not subject to modification
- This produces exponential decay asymptotic to the baseline

## Tonal Inventory

### Bitonal Pitch Accents that Trigger Downstep

The four bitonal accents which trigger downstepping are:
- **H-+L*** (shown in Figures 1-4)
- **H*+L-**
- **L*+H-**
- **L-+H***

Of these, all but H*+L- occur transparently in F0 contours.

### Accent Types by F0 Pattern

- **Figures 1, 5**: F0 sustained on accented syllable with sharp fall at next accented syllable (British English pattern, described by Kingdon 1958, Crystal 1969)
- **Figures 2, 6**: Gradual fall from one accented syllable to the next, F0 on accented syllable is local maximum (American pattern)
- **Figures 3, 7**: Relatively low F0 on stressed syllable with rise immediately following - suggests L*+H- accent
- **Figures 4, 8**: Similar rising-falling pattern but peaks occur on the accented syllables

### Boundary Tones and Phrase Accents

- **L%**: Boundary tone at utterance end, value is ON the baseline (= 0 in baseline units)
- **H%**: Boundary tone for rising contours, value is ABOVE baseline
- **L-**: Low phrase accent
- **H-**: High phrase accent

The upstep rule interacts with boundary tones:
- After H- phrase accent, L% stays at the same level as H-
- After H- phrase accent, H% is raised higher

## Phonological Rules

### Complete Rule Set (Rules 1-10)

**Rule 1**: First pitch accent value is a free choice (pragmatic/expressive)

$$
/H^*_{i+1}/ = /H^*_i/ \times \frac{\text{Prominence}(H^*_{i+1})}{\text{Prominence}(H^*_i)}
$$

**Rule 2**: For phrase accent following pitch accent:

$$
/H_j/ = /H_i/ \times \frac{\text{Prominence}(H_j)}{\text{Prominence}(H_i)}
$$

Where H_j is the phrase accent following H_i, and the prominence ratio is apparently constrained to be 1.

**Rule 3**: In H+L: /L/ = k/H/ where 0 < k < 1

**Rule 4**: In H(+T) L+: /L/ = n/H/ * Prominence(H)/Prominence(L) where 0 < n < k

**Rule 5**: In H(+T) L-: /L-/ = p/H/ where 0 < p < k

**Rule 6**: /L%/ = 0 (as a ratio: /L%_{i+1}/ = 0/T_i/)

**Rule 7**: L pitch accent or phrase accent following L* gets same value as L* nuclear accent

**Rule 8** (Downstep): In H+L H_i and H L+H_i: /H_i/ = k/H_i/

**Rule 9** (Upstep): In H- T: /T/ = /H-/ + /T/

**Rule 10**: In H-+L*: /L*/ = k/H-/

### Key Rule Properties

- Rules are assignment operators (=), not logical equations
- They assign new values to tones based on old values
- Rules 8 and 2 interact multiplicatively with prominence to determine downstepped H values
- Rules 3 and 4 interact with rule 8 to lower successive L tones in downstepped sequences
- The downstep factor k in rule 3 is the same as k in rule 8 (H+L H exhibits total downstep)
- The factor n in rule 4 is smaller than k (H L+H exhibits partial downstep)

## Phonetic Implementation

### Quantitative Baseline Measurements

From Table III - Fitted model parameters for each speaker:

| Subject | c    | b1 (Hz) | b2 (Hz) | Measured b1 | Measured b2 | Mean Deviation (Hz) |
|---------|------|---------|---------|-------------|-------------|---------------------|
| JBP     | 1.4  | 158     | 134     | 156         | 137         | 12.3                |
| MYL     | 1.5  | 89      | 75      | 87          | 77          | 6.6                 |
| KXG     | 1.5  | 142     | 105     | 143         | 103         | 12.3                |
| DWS     | 1.4  | 116     | 101     | 124         | 101         | 7.3                 |

Where:
- c = constant relating A and B peak heights
- b1 = baseline at first peak location
- b2 = baseline at second peak location

### Declination Amount

- Maximum baseline decline for a speaker with this pitch range: ~40 Hz
- At 1 2/3 baseline units above baseline, effect of declination would be at most 67 Hz
- Nuclear accent can be ~140 Hz lower than it would be if it had the same phonetic value as the first peak

### F0 Values for Vocative Contours

- After H*+L- H- phrase accent, the contour shows levels at about 190 Hz
- This is ~50 Hz above the terminal baseline point for the speaker
- Compared to H-+L* L- H% where L- is lower than L* in the nuclear accent

## Equations Found

### Peak Scaling (Equation 3)
$$
\hat{P} = \frac{P - b_p}{b_p}
$$
Where: P = peak value in Hz, b_p = baseline at peak, P-hat = scaled value

### Constant Ratio Relation (Equation 4)
$$
\hat{A} = c \cdot \hat{B}
$$
Where: c > 1 is a speaker constant relating first and second peaks

### BA Order Peak Relation (Equation 5)
$$
P_2 = c(b_2/b_1) P_1 + (1-c)b_2
$$
Where: P1 = first peak, P2 = second peak, b1, b2 = baselines at each peak

### AB Order Peak Relation (Equation 6)
$$
P_2 = (1/c)(b_2/b_1) P_1 + (1-1/c)b_2
$$

### Alternative Scaling (Rejected - Equation 7)
$$
\hat{P} = \frac{P}{b}
$$

### Linear Scaling (Rejected - Equation 8)
$$
\hat{P} = P - b
$$

### Downstep H Scaling (Rule 1/Equation 1 from Section 4)
$$
/H^*_{i+1}/ = /H^*_i/ \times \frac{\text{Prominence}(H^*_{i+1})}{\text{Prominence}(H^*_i)}
$$

### L Scaling in H+L (Rule 3)
$$
/L/ = k/H/ \quad \text{where } 0 < k < 1
$$

### L Scaling in H(+T) L+ (Rule 4)
$$
/L/ = n/H/ \times \frac{\text{Prominence}(H)}{\text{Prominence}(L)} \quad \text{where } 0 < n < k
$$

### L- Scaling (Rule 5)
$$
/L^-/ = p/H/ \quad \text{where } 0 < p < k
$$

### Downstep Rule (Rule 8)
$$
\text{In H+L } H_i \text{ and H L+H}_i: \quad /H_i/ = k/H_i/
$$

### Upstep Rule (Rule 9)
$$
\text{In H}^- \text{ T}: \quad /T/ = /H^-/ + /T/
$$

### L* Scaling in H-+L* (Rule 10)
$$
/L^*/ = k/H^-/
$$

## Parameters Found

| Name | Symbol | Value | Units | Context |
|------|--------|-------|-------|---------|
| Peak ratio constant | c | 1.4-1.5 | dimensionless | Relates A and B peak heights across pitch ranges |
| Baseline at first peak | b1 | 87-158 | Hz | Speaker-dependent, male speakers 87-124 Hz |
| Baseline at second peak | b2 | 75-134 | Hz | Speaker-dependent |
| Baseline drop (male) | - | 14 | Hz | Difference between L% values in AB vs BA order |
| Baseline drop (female) | - | 33 | Hz | Difference between L% values in AB vs BA order |
| Maximum baseline decline | - | 40 | Hz | For speaker with typical pitch range |
| Downstep factor | k | 0 < k < 1 | dimensionless | Factor for lowering H after L |
| Partial downstep factor | n | 0 < n < k | dimensionless | Factor for L in L+H (smaller than k) |
| Phrase accent L factor | p | 0 < p < k | dimensionless | Factor for L- phrase accent |

## Figures of Interest

- **Figures 1-4** (p. 139): Four members of the downstepping intonation family on "There are many intermediate levels"
- **Figures 5-8** (p. 139): Additional examples showing steeply falling configurations
- **Figures 9-14** (referenced p. 123-127): Scatter plots of first-peak/second-peak relationships showing linear scaling model fit
- **Figure 10** (p. 125): Shows how the scaling model determines relative peak heights in AB and BA cases
- **Figure 15** (p. 131, from Maeda): Shows baseline drops constant amount regardless of utterance length
- **Figure 16** (p. 136): Contrast between vocative and declarative terminal fall
- **Figures 17-19** (p. 153): H-+L* downsteps following H*
- **Figures 22-25** (p. 154): Vocative contours with H*+L- H- phrase accent

## Quotes Worth Preserving

> "Each speaker has a declining F0 baseline which is a characteristic of his voice. This baseline is invariant, in the sense that the onset level and the total drop remain the same as overall pitch range and utterance length are varied. The slope does vary in inverse proportion to length, since the drop remains fixed. The baseline represents the lowest F0 value the speaker would be disposed to reach at any given point in the utterance." (page 124)

> "F0 peaks are scaled as the peak-to-baseline difference (in Hz), divided by the baseline value at the location of the peak." (page 124)

> "The overall contour arises only as a byproduct of the application of local tonal implementation rules." (page 143)

> "The F0 contour can be computed by local rules applying iteratively left to right. If it had turned out instead that the step size depended on the number of upcoming steps, or the number of steps so far, then a non-local implementation would have been required." (page 143)

> "The implication of the description is that tones can be mapped into F0 contours by a finite state machine." (page 147)

> "The downstepping observed in English has substantial similarities to downdrift and downstep as they have been studied in African tone languages." (page 147)

> "The main similarities between English downstep and the classic cases of downstep in African tone languages are that the tonal value for H is lowered after L; that the new value for H governs not only the downstepped H, but also the value for any H's to the right; and that lowering due to downstep is over and above lowering due to declination." (page 148)

## Implementation Notes

### For TTS F0/Prosody Generation

1. **Baseline tracking**: Implement a declining baseline that:
   - Starts at speaker-dependent onset level (87-158 Hz for males)
   - Drops a fixed amount over the utterance (~14 Hz male, ~33 Hz female)
   - Slope = total_drop / utterance_duration

2. **Peak computation**: For each H* tone:
   - Compute baseline value at tone location: b(t) = b0 - (slope * t)
   - Apply scaling: P = b(t) * (1 + scaled_value)
   - For downstepped H: multiply scaled_value by k

3. **Left-to-right processing**: Process tones iteratively:
   - First H* is free (set by pragmatics/emphasis)
   - Subsequent tones computed relative to immediately preceding tones
   - Apply prominence ratios for non-equal stresses
   - Apply downstep factor k when H follows L in H+L H or H L+H

4. **Downstep implementation**:
   - Track whether previous accent contained L component
   - If current H follows L in a bitonal accent sequence, apply k factor
   - The downstepped value persists for subsequent H tones

5. **Upstep for H- phrase accent**:
   - After H- phrase accent, add /H-/ value to following boundary tone
   - Results in L% staying level (not falling to baseline)
   - Results in H% being raised higher

6. **Interpolation between targets**:
   - Interpolation is monotonic (but can include sagging between sufficiently separated targets)
   - Skip over floating tones (tones with no computed target value)
   - L- in H*+L- may not surface overtly but still affects subsequent computations

7. **Key insight for efficiency**: The system can be implemented as a finite state machine since:
   - Each tone value depends only on the immediately preceding pitch accent
   - No lookahead is required
   - Values once computed are not modified
