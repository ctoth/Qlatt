# Pages 320-359 Notes

## Chapters/Sections Covered

This chunk contains primarily **Appendix figures** (Chapter 3 and Chapter 4 examples) showing F0 contours from various speakers with tonal annotations. These are empirical data figures that illustrate the intonation patterns described in the theoretical chapters.

- **Figures 3.9-3.15**: Peak value comparisons and baseline fitting (pages 320-327)
- **Figures 4.1-4.43**: Extensive F0 contour examples with tonal transcriptions (pages 328-360)

## Key Concepts

### Baseline Units and F0 Scaling

The thesis uses "baseline units" as a normalized measure of F0. Key examples from Figure 3.10 (page 322):

- Speaker MYL example A: B = 180 Hz = 1 baseline unit; A = 185 Hz = 1.45 baseline units
- Ratio: A = 1.45 * B
- Speaker MYL example B: A = 210 Hz = 1.33 baseline units; B = 141 Hz = 0.87 baseline units
- Ratio: A = 1.53 * B

This demonstrates that peak heights are measured relative to a speaker-specific baseline, not in absolute Hz.

### First Peak vs Second Peak Relationships

Figures 3.9, 3.11-3.14 (pages 320-326) show scatter plots of First Peak vs Second Peak values for multiple speakers (JBP, MYL, KXG, DUS). These demonstrate:

- Strong linear correlation between successive peaks
- AB order vs BA order shows different patterns (X = AB order, I = BA order)
- Each speaker has characteristic slope relating consecutive peaks

### Baseline Fitting (Maeda 1976)

Figure 3.15 (page 327) shows baseline fitting from Maeda 1976:
- Text: "In the jungles of Peru there are huge bird with brilliant colors, red feathers on their wings, yellow..."
- Shows how the baseline (reference line around 80-130 Hz) declines gradually across the utterance
- Caption: "An illustration of the baseline as fit by Maeda"

## Tonal Inventory

### Pitch Accent Types Observed in Examples

| Type | Description | Example Sentences |
|------|-------------|-------------------|
| H* | High pitch accent | "Manny" (4.16), "Carefully selected varieties" (4.8) |
| L* | Low pitch accent | Various examples throughout |
| H*+L | High with following low | "Amanda voted for LeMay" (4.6) |
| H*+L- | High accent + low phrase accent | "It's spelled with two dots" (4.10) |
| L*+H | Low with following high | "There's a lovely one in Canada" (4.30-4.31) |
| L*+H- | Low accent + high phrase accent | List intonation examples |
| H-+L* | High phrase accent + low accent | "I really believe Ebenezer" (4.17-4.18) |

### Phrase Accents

| Type | Description |
|------|-------------|
| H- | High phrase accent (plateau or rise before boundary) |
| L- | Low phrase accent (fall or low before boundary) |
| H-+ | High phrase accent with following rise |

### Boundary Tones

| Type | Description |
|------|-------------|
| H% | High boundary tone (questions, continuation rise) |
| L% | Low boundary tone (statements, finality) |

## Phonological Rules

### Downstep Algorithm (Figure 4.15-4.16, pages 337-338)

This is a **critical implementation algorithm**. Step-by-step derivation for a downstepped sequence:

**Given**: Sequence H* H-+L* H-+L* with k = 0.6

**Step A - Initialization**:
- |H*| = 3 (initial H* value in baseline units)

**Step B - Increment (computing H-)**:
- |H-| = |H*| * Prominence(H-) / Prominence(H*)
- = 3 * 2 / 2.5 = 2.4
- Then interpolation between H* and H-

**Step C - Increment (computing L*)**:
- |L*| = k * |H-|
- = 0.6 * 2.4 = 1.4
- Then interpolation

**Step D - Increment (computing next H-)**:
- |H-_j| = |H-_i| * Prominence(H-_j) / Prominence(H-_i)
- = 2.4 * 2.8 / 2 = 3.4
- Then interpolation

**Step E - Downstep**:
- |H-_j| = k * |H-_j|
- = 0.6 * 3.4 = 2.0 (THIS IS THE DOWNSTEP!)
- Then interpolation

**Step F - Increment (computing next L*)**:
- |L*| = k * |H-_j|
- = 0.6 * 2.0 = 1.2
- Then interpolation

### Basic Schema for Downstep (Figure 4.16A, page 339)

Shows the canonical downstep pattern:
```
     H    H H H        H
F0   L    L L    L L   L
     |__________________|
            time -->
```

The pattern shows H tones staying on a declining "ceiling" line while L tones track a parallel declining "floor" line.

### Downstep and Declination in Akan (Figure 4.16B, page 340)

Schematized representation showing:
- H and L tones measured in "baseline units above the baseline"
- Scale: 0-3 baseline units
- Shows multiple H-L alternations with progressive lowering
- Note: "Coefficients relating H and L are arbitrary. Local effects of L% on tonal value are ignored."

## Phonetic Implementation

### F0 Range Examples from Figures

| Speaker | Range (Hz) | Context |
|---------|-----------|---------|
| JBP (female) | 100-400 Hz | Various sentences |
| MYL (male) | 75-220 Hz | Various sentences |
| MB (female) | 100-400 Hz | Various sentences |
| KXG (female) | 100-250 Hz | Various sentences |

### Typical Contour Shapes

1. **H* L- L%** (declarative): Sharp fall from peak to low boundary
2. **H* H- H%** (yes/no question): Rise to high boundary
3. **L* H- H%** (continuation rise): Low accent followed by rise
4. **H*+L- H- L%** (calling contour variant): High peak, fall, sustained mid, final fall

### Impossible Intonations (Figure 4.21, page 343)

Shows that certain contour shapes are phonologically impossible in English:
- Example: L*+ with H-+ leading to ambiguous T% (either H% or L%)
- This demonstrates that the tonal grammar constrains possible F0 shapes

### Impossible Contours (Figure 4.43 C-D, page 360)

Two schematized "impossible in English" contours:

**C) Impossible**: L*+ followed by flat H- plateau, then straight line to L%
- Shows a sustained high plateau that English doesn't permit

**D) Also impossible**: L*+ followed by triangular H- peak, then fall to L%
- Shows a sharp triangular peak shape not found in English

## Equations Found

### Downstep Factor

$$
|H^-_j| = k \cdot |H^-_i|
$$

Where:
- k = downstep factor (approximately 0.6 in the examples)
- |H-_j| = new phrase accent value after downstep
- |H-_i| = previous phrase accent value

### Prominence-Based Scaling

$$
|H^-| = |H^*| \cdot \frac{Prominence(H^-)}{Prominence(H^*)}
$$

Where:
- Prominence values are determined by metrical structure
- More prominent syllables get higher F0 values

### L* Value Computation

$$
|L^*| = k \cdot |H^-|
$$

Where:
- L* value is a fixed fraction of the current H- level
- k is the same downstep/scaling factor (~0.6)

## Parameters Found

| Name | Symbol | Value | Units | Context |
|------|--------|-------|-------|---------|
| Downstep factor | k | 0.6 | ratio | Scaling between H and L tones |
| Initial H* | |H*| | 3 | baseline units | Starting value for derivation |
| Baseline reference | - | ~80-130 | Hz | Speaker floor frequency |

## Figures of Interest

### Peak Correlation Figures
- **Fig 3.9** (page 320): First Peak vs Second Peak scatter plot for speaker JBP, showing AB vs BA order effects
- **Fig 3.11** (page 323): Similar plot for JBP with fitted lines
- **Fig 3.12** (page 324): Same analysis for speaker MYL
- **Fig 3.13** (page 325): Same analysis for speaker KXG
- **Fig 3.14** (page 326): Same analysis for speaker DUS

### Downstep Algorithm
- **Fig 4.15** (page 337): Step-by-step derivation showing downstep computation (CRITICAL FOR IMPLEMENTATION)
- **Fig 4.16A** (page 339): Basic schema for downstep pattern
- **Fig 4.16B** (page 340): Schematized downstep with declination in Akan

### Contour Examples
- **Fig 4.5** (page 331): "I really believe Ebenezer was a dealer in magnesium" - complex multi-accent utterance
- **Fig 4.7** (page 332): List intonation "Buy lemons melons limes..." showing L*+H- pattern
- **Fig 4.9** (page 333): "Can I go now?" showing H% vs L% boundary contrast
- **Fig 4.37** (page 353): Two F0 contours for "I imagine Madeline did it" differing in nuclear accent prominence

### Impossible Contours
- **Fig 4.21** (page 343): Shows phonologically impossible intonation pattern
- **Fig 4.43 C-D** (page 360): Schematized impossible English contours

## Quotes Worth Preserving

> "There are many intermediate levels" (page 329, describing the continuous nature of F0 between tonal targets)

> "To the ear, 'dots' is clearly not deaccented" (page 334, note on Figure 4.10, explaining that even when F0 is relatively flat, metrical prominence affects perception)

> "Two F0 contours for: I imagine Madeline did it... which differ in the prominence on the nuclear accent" (page 353, Figure 4.37 caption)

## Implementation Notes

### Downstep Implementation Algorithm

From Figure 4.15 (pages 337-338), the algorithm for computing downstepped sequences:

```
1. INITIALIZE: Set first H* to speaker's reference value (e.g., 3 baseline units)

2. For each subsequent tone:
   a. If computing H- from H*:
      H- = H* * (prominence_ratio)

   b. If computing L* from H-:
      L* = k * H-  (where k ≈ 0.6)

   c. If computing H- from previous H- with downstep:
      H-_new = k * H-_prev  (DOWNSTEP TRIGGER)

   d. INTERPOLATE between computed targets

3. The downstep factor k ≈ 0.6 applies both to:
   - H to L transitions
   - Successive H tones after L intervention (true downstep)
```

### Key Implementation Insights

1. **Baseline units are relative**: Convert Hz to baseline units by dividing by speaker's reference frequency

2. **Prominence affects scaling**: More prominent syllables get proportionally higher peaks

3. **Downstep is triggered by L tones**: Each intervening L tone causes the next H to be lowered by factor k

4. **Interpolation fills gaps**: Between computed tonal targets, F0 is interpolated (linear or smooth)

5. **Impossible contours constrain generation**: The grammar rules out certain F0 shapes, so a TTS system should not generate:
   - Sustained flat plateaus at phrase accent level
   - Sharp triangular peaks at phrase boundaries

### Boundary Tone Effects on Final F0

From the examples:
- **L%**: Final F0 drops to near baseline (often below 100 Hz for females)
- **H%**: Final F0 rises significantly (often 50-100 Hz above preceding tone)
- The boundary tone is realized on the final syllable after the phrase accent
