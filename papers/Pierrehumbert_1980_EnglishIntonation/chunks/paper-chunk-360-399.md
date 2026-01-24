# Pages 360-399 Notes

## Chapters/Sections Covered

This chunk contains:
- End of Chapter 4 (F0 contour figures 4.44-4.54)
- Chapter 5 F0 contour examples (figures 5.1-5.25)
- Chapter 6 F0 contour examples (figures 6.1-6.9)
- **Appendix to the Figures** (page 390) - Critical documentation of all possible tonal combinations

## Key Concepts

### Upstepping Formula (page 362)

Figure 4.45 shows the **upstepping tones** computation formula - the inverse of downstep:

$$
T_{n+1} = (1-a)T_n + at
$$

Where:
- $T_1 = 0.7$ (initial value in baseline units)
- $a = 0.2$ (step factor)
- $t = 3$ (target/asymptote)

This creates a logarithmic approach to an upper bound, opposite to the exponential decay of downstep.

### Hierarchical Representation of Downstep (pages 367-369)

Figure 4.51 shows the **tree structure** for downstep computation:
- Terminal nodes are H and L tones
- Internal nodes labeled 'h' and 'l'
- The tree structure: root 'l' dominates two 'h' nodes, which each dominate H-L pairs
- Pattern: H H L L | H L | H H L

Figure 4.52 extends this to **total downdrift** in tone languages:
- Shows how tone levels are derived from hierarchical representation
- Uses counting algorithm: count L tones dominated by each node
- Final values: 0, 0, 1, 1, 2, 2, 3, 3, 4, 4
- Applies formula with k=0.6 to convert counts to baseline units

Figure 4.53 shows **Kikuyu tone derivation**:
- L- is a "floating L tone"
- Complex tree with multiple l and h nodes
- Demonstrates how African tone languages fit the same framework

### Danish Intonation (page 370)

Figure 4.54 from Thorsen 1979c shows F0 in ASC Danish:
- Three sentence types distinguished by F0 pattern:
  1. Syntactically unmarked questions
  2. Interrogative sentences with word order inversion and/or interrogative particle, and non-final periods (variable)
  3. Declarative sentences
- Large dots = stressed syllables
- Small dots = unstressed syllables
- Small squares = unstressed syllable between two stressed ones
- Full lines = F0 pattern associated with stress groups
- Broken lines = intonation contours

## Tonal Inventory

### Complete Pitch Accent + Phrase Accent + Boundary Tone Combinations (page 390)

The appendix documents **22 distinct patterns** out of 28 logically possible combinations. The test phrase was "The Uruguayan bulldozer drivers' union."

**Neutralized combinations** (6 patterns omitted):
- H*+L- L- L% and H*+L- L- H% → neutralized with H* L- L% and H* L- H% respectively
- H* L- L% and H* L- H% → neutralized with H*+H- for either phrase accent
- All four cases of H*+H- → neutralized with H* for either phrase accent

### Pitch Accents Observed in Figures

| Accent | Description | Example Figures |
|--------|-------------|-----------------|
| H* | Simple high | 4.44, 5.7, 5.19, 6.1 |
| L* | Simple low | 4.44, 4.48, 5.7, 6.2 |
| H*+H- | High with high phrase accent | 4.46, 5.5, 5.14, 5.17, 5.18, 6.3, 6.6 |
| H*+L- | High with low phrase accent | 4.50, 5.15, 5.16, 5.21, 5.23 |
| L*+H | Low with leading high | 4.47, 5.3, 5.4, 5.13 |
| L*+H- | Low rising | 5.1, 5.8, 5.12 |
| L-+H* | Scooped accent | 5.22, 5.24, 5.25 |
| H-+L* | High phrase accent + low pitch accent | 4.48 |
| H-+H* | Rise to high | 5.25 |

### Phrase Accents

| Accent | Function |
|--------|----------|
| H- | High phrase accent - maintains/raises pitch after nuclear accent |
| L- | Low phrase accent - lowers pitch after nuclear accent |

### Boundary Tones

| Tone | Function | Typical Use |
|------|----------|-------------|
| H% | High boundary - final rise | Questions (yes/no), continuation |
| L% | Low boundary - final fall | Statements, finality |

## Phonological Rules

### Neutralization Rules (page 390)

1. **H*+L- neutralization**: H*+L- L- L% → H* L- L% (phrase accent absorbed)
2. **H*+H- neutralization**: H*+H- with either phrase accent → H* (trailing tone absorbed)

### Nuclear Accent Placement

In each F0 contour, the vertical dotted line marks the location of /b/ in "bulldozer" - the syllable with **nuclear stress**. A bar marks the location of the syllable with nuclear stress in schematized patterns.

### Prenuclear Accent Variation

The prenuclear accents vary naturally - "since the speaker produced the contours in whatever manner seemed most natural." In some cases, both feet in "Uruguayan" carry an accent.

## Phonetic Implementation

### F0 Ranges Observed

| Speaker | Range (Hz) | Notes |
|---------|------------|-------|
| JBP (female) | 100-400 | Most examples |
| MYL (male) | 60-150 | Lower range |
| MB | 100-350 | Questions |
| KXG | 100-250 | Fig 6.8 |
| KS (Maeda 1976) | 110-150 | Fig 6.9, narrow range |

### Baseline and Scaling

- Figure 4.52 and 4.53 show baseline units (0, 1, 2, 3...) derived from tree structure
- Conversion formula uses k=0.6 as scaling factor
- IOI (inter-onset interval) = 2.5 in example

### Schematized Contour Patterns

The appendix figures (391-400) show paired representations:
1. **Actual F0 trace** (dotted line) with vertical marker at nuclear syllable
2. **Schematized pattern** showing:
   - Filled rectangle = nuclear pitch accent location
   - Line segments showing pitch movement
   - Labels: pitch accent, phrase accent, boundary tone

## Equations Found

$$
T_{n+1} = (1-a)T_n + at
$$

Where:
- $T_n$ = tone value at position n (in baseline units)
- $a$ = step factor (0.2 for upstep)
- $t$ = target value (asymptote)

For upstepping: T_1=0.7, a=0.2, t=3 yields sequence approaching 3 from below.

## Parameters Found

| Name | Symbol | Value | Units | Context |
|------|--------|-------|-------|---------|
| Upstep initial | T_1 | 0.7 | baseline units | Upstepping formula |
| Upstep factor | a | 0.2 | dimensionless | Step size |
| Upstep target | t | 3 | baseline units | Asymptote |
| Downdrift scaling | k | 0.6 | dimensionless | Tree-to-F0 conversion |
| IOI | IOI | 2.5 | (time units) | Inter-onset interval |

## Figures of Interest

### F0 Contour Examples by Pattern Type

- **Fig 4.44** (p.361): "Is he a member of the bulldozer drivers' union, Manny?" - H* L* H- H- H%
- **Fig 4.45** (p.362): Upstepping tones graph - shows logarithmic rise toward asymptote
- **Fig 4.46** (p.363): "It's indexed by the keywords in the abstract" - H*+H- H*+H- H* L-L%
- **Fig 4.47** (p.364): "It's really too good to be true" - H% L* H* H* L- L%
- **Fig 4.48** (p.365): "an evanescent rainbow" - L* H-+L* L- L%
- **Fig 4.50** (p.367): "Leonora was a wise lion" - H*+L- H* L- L%
- **Fig 4.51** (p.367): Hierarchical tree representation of downstep
- **Fig 4.52** (p.368): Tone levels from hierarchical representation for total downdrift
- **Fig 4.53** (p.369): Kikuyu tone derivation with floating L tone
- **Fig 5.6** (p.373): Schematic showing H* baseline with L- and L%/H% options
- **Fig 5.20** (p.381): "Impossible pattern" - H*+H- followed by H*+H- then H* - shows constraint violation
- **Fig 5.21** (p.382): Another "impossible pattern" - L*+H- sequence
- **Fig 5.25** (p.384): "There's a lovely road from Albany to Elmira" - H* L-+H* H-+H* L-L% - shows good vs odd intonation

### Appendix Figures (pp.391-400)

Systematic presentation of all 22 valid combinations with actual F0 traces and schematized patterns:

| Page | Combinations |
|------|--------------|
| 391 | H* L- L%, H* L- H% |
| 392 | H* H- L%, H* H- H% |
| 393 | L* H- L%, L* H- H% |
| 394 | L* L- L%, L* L- H% |
| 395 | L-+H* L- L%, L-+H* L- H% |
| 396 | L-+H* H- L%, L-+H* H- H% |
| 397 | L*+H- L- L%, L*+H- L- H% |
| 398 | L*+H- H- L%, L*+H- H- H% |
| 399 | H-+L* L- L%, H-+L* L- H% |
| 400 | H-+L* H- L%, H-+L* H- H% |

## Quotes Worth Preserving

> "There are 22 different patterns. 6 of the logically possible 28 patterns are omitted because the implementation rules neutralize them with other forms." (page 390)

> "These are H*+L- L- L% and H*+L- L- H%, which are neutralized with H* L- L% and H* L- H%, respectively, and all four cases of H*+H-, which is neutralized with H* for either phrase accent." (page 390)

> "In each F0 contour, the vertical dotted line is located on /b/ in 'bulldozer'. In the schematized patterns, a bar marks the location of the syllable with nuclear stress." (page 390)

> "(an impossible pattern)" - caption for figures 5.20 and 5.21 showing phonotactically invalid sequences

> "— a good intonation" / ".... an odd intonation" - Figure 5.25 showing contrast between natural and unnatural patterns

## Implementation Notes

### For TTS F0 Generation

1. **Complete tonal inventory**: Use the 22 valid combinations from the appendix as the complete set of nuclear configurations. The 6 neutralized patterns should map to their non-neutralized equivalents.

2. **Upstepping implementation**: When generating rising sequences (e.g., for continuation rises or questions), use the formula T_{n+1} = (1-a)T_n + at with a=0.2 approaching a ceiling value.

3. **Hierarchical computation**: For complex utterances with multiple pitch accents, the tree-based computation (figs 4.51-4.53) provides a principled way to compute relative scaling.

4. **Schematized patterns**: The appendix provides canonical shapes for each combination:
   - H* L- L%: High peak, fall to low, stay low
   - H* L- H%: High peak, fall to low, rise at end
   - H* H- L%: High peak, sustained high, fall at boundary
   - H* H- H%: High peak, sustained high, rise at boundary
   - L* patterns: Low target, then phrase/boundary behavior
   - L-+H* patterns: Low lead-in, then high peak (scooped)
   - L*+H- patterns: Low star with high trailing element
   - H-+L* patterns: High lead-in, then low target

5. **Nuclear syllable alignment**: The nuclear pitch accent is strictly aligned with the nuclear stressed syllable. The phrase accent and boundary tone follow in sequence.

6. **Impossible sequences to avoid**:
   - H*+H- followed by another H*+H- (fig 5.20)
   - Certain L*+H- sequences (fig 5.21)

7. **Speaker variation**: Female speakers (JBP) show range ~100-400 Hz; male speakers (MYL) show ~60-150 Hz. Scale patterns accordingly.
