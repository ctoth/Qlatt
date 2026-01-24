# Pages 240-279 Notes

## Chapters/Sections Covered

- **Chapter 5 Conclusion (continued)** - pages 241-245
- **References** - pages 246-253
- **Figures** - pages 254-280 (F0 contour examples from multiple speakers)

## Key Concepts

### Two-Tone Theory Justification (page 241)

The two-tone theory (H and L) explains why there is no three-way distinction in phrase boundary slots. A theory with "level" as a third option would predict three possibilities (rise/fall/level), but English only shows a two-way distinction. Czech exhibits the pattern missing in English (level boundary), supporting the theory that languages may or may not upstep boundary tones.

### Local vs. Nonlocal Aspects of Intonation (pages 241-242)

- **Tonal correlates at the phrase level are LOCAL**: phrase accent and boundary tone are elements in the string of tones
- **Rules implementing tones phonetically are LOCAL**: they can only refer back as far as the previous pitch accent
- **Text-tune alignment is NONLOCAL**: controlled by a well-formedness condition requiring interaction with metrical structure

The nonlocal side of intonation arises from its interaction with metrical structure, which is well known for its nonlocal properties.

### Downstep as Local Rule (page 242)

Generating downstepped contours using local rules correctly predicts an **exponential form** for the decay pattern. A hierarchical representation of downstep was rejected because it neither supplanted nor supplemented phonetic rules relating tonal values.

### Phrasal Intonation Contours (pages 242-243)

One consequence of the analysis is that phrasal contours must be developed:
- What phrasal contours are possible
- How they are aligned with text
- How interpolation between alignment points is carried out

### Chronic Ambiguity in Four-Tone System (page 243)

An F0 contour with two phonetically equal tones could represent:
1. Two phonologically equal tones riding on a flat phrasal contour, OR
2. A lower and higher tone riding on a falling contour

This is a mathematically underdetermined problem if variation in either layer is too rich.

### Window for Tonal Implementation Rules (page 244)

For English, tonal implementation rules:
- Have **no right context** requirement
- Can **refer only as far back as the previous pitch accent**

This hypothesis may not be universal - Zulu requires right phonological context for tonal implementation.

### Three Open Questions About F0 Production (page 245)

1. **Timing of unstarred tones in bitonal accents** - related to our description
2. **Scaling of baseline units above the baseline** - may arise from respiratory/laryngeal interaction
3. **Character of interpolation rules** - different interpolation accounts could yield different tonal analyses

## Tonal Inventory

From the extensive figure appendix, the following tonal patterns are demonstrated:

### Pitch Accents (starred tones mark the accented syllable)
- **H\*** - High pitch accent (most common)
- **L\*** - Low pitch accent
- **H\*+L-** - Bitonal: High star with trailing Low
- **L\*+H-** - Bitonal: Low star with trailing High
- **L+H\*** - Bitonal: Leading Low with High star
- **H+L\*** - Bitonal: Leading High with Low star (not shown in these figures)

### Phrase Accents
- **H-** - High phrase accent
- **L-** - Low phrase accent

### Boundary Tones
- **H%** - High boundary tone (rising)
- **L%** - Low boundary tone (falling)

### Common Complete Contour Patterns Demonstrated

| Figure | Pattern | Example Sentence |
|--------|---------|------------------|
| 7.1A | H* L- L% | "Anna" (falling declarative) |
| 7.1B | H* L- H% | "Anna" (rising, continuation) |
| 7.1C | H*+L- H- L% | "Anna" (fall-rise) |
| 7.1D | L*+H- L- H% | "Anna" (scooped rise) |
| 7.1E | L* H- H% | "Anna" (low rise question) |
| 7.2 | H* H* L- L% | "Another orange" |
| 7.3 | H* L* H- H% | "Another orange" (contrast) |
| 7.4 | H% L* H* L- L% | "It's really too good to be true" |
| 7.5 | H* L- H% | "Legumes are a good source of vitamins" (statement) |
| 7.5B | H* L- H% | Same sentence, different reading |
| 7.6 | L* H- H% | "Are legumes a good source of vitamins?" (yes/no Q) |

## Phonological Rules

### L Tone Computation Rule (page 244)
> "We did propose: wherever possible, /L/ is computed in relation to a neighboring H rather than a neighboring L."

This rule governs how Low tones are scaled relative to their context.

### Tonal Implementation Window
- Rules are **local** - no access to right context
- Can look back only to **previous pitch accent**
- This constrains the complexity of phonetic implementation

## Phonetic Implementation

### Figure Conventions (page 254)
- **Vertical axis**: Fundamental frequency in Hz
- **Horizontal axis**: Time, with ticks marking one-second intervals
- **Speaker initials**: Upper left corner of each figure
- **Circled letters with arrows**: Point to F0 region corresponding to phoneme
- **Tonal transcription**: Given under text, marked on F0 contour

### Low F0 Representation (page 254)
When low F0 values occur at phrase end (L- and L%):
- Produced with vocal fry
- Results in scattered points near speaker's baseline
- Pitch tracker fails to compute continuous F0 contour
- Representation chosen to reflect perceptual impression of such patterns

### Baseline Units System (pages 270-271)

Critical implementation detail showing F0 scaling in **baseline units**:

**Figure 1.19 (page 270)**: Shows baseline grid with:
- 70 Hz = 0 baseline units
- 95 Hz = 0.5 baseline units
- 120 Hz = 1.0 baseline units
- 145 Hz = 1.5 baseline units

**Figure 1.20 (page 271)**: Demonstrates proportional scaling
- Speaker MYL examples showing H* peaks at different absolute Hz
- When converted to baseline units, peaks maintain consistent ratios
- Example A: B = 180 Hz (1 baseline unit), A = 185 Hz (1.45 baseline units)
- Example B: A = 210 Hz (1.33 baseline units), B = 141 Hz (0.87 baseline units)
- **Key finding**: A = 1.45 * B and A = 1.53 * B - consistent proportional relationship

### Pitch Range Variation (page 269)
Figure 1.16 shows same utterance "Manny" (H* L- L%) produced in **six different pitch ranges**:
- Demonstrates that tonal patterns are preserved across pitch range changes
- F0 values scale proportionally, not additively

## Parameters Found

| Name | Symbol | Value | Units | Context |
|------|--------|-------|-------|---------|
| Baseline reference | - | 70 | Hz | Figure 1.19 lower bound |
| Baseline unit step | - | ~25-30 | Hz | Approximate Hz per baseline unit |
| Typical H* peak (female) | - | 300-350 | Hz | Figures with JBP speaker |
| Typical H* peak (male) | - | 150-200 | Hz | Figures with MYL, MB speakers |
| Typical L% endpoint | - | 100-120 | Hz | Vocal fry region |
| Time scale tick | - | 1 | second | Standard figure convention |
| Duration per word | - | ~0.4 | seconds | Typical from figures |

## Figures of Interest

### F0 Contour Exemplars

- **Fig 7.1 (page 255-256)**: "Anna" with 5 different tonal patterns (A-E) - excellent minimal pairs
- **Fig 7.2 (page 257)**: "Another orange" - H* H* L- L% showing two prenuclear accents
- **Fig 7.3 (page 259)**: "Another orange" with H* L* contrast patterns
- **Fig 7.4 (page 260)**: Multi-word sentences showing L* scoop patterns
- **Fig 7.5 (page 261-262)**: "Legumes are a good source of vitamins" - statement patterns
- **Fig 7.6 (page 262-263)**: Same sentence as yes/no question - L* H- H%
- **Fig 7.7 (page 264)**: Japanese speaker (from Maeda 1976) showing declination over long utterance
- **Fig 7.8-7.9 (page 265)**: "Does Manitowoc have a library?" - yes/no question patterns
- **Fig 1.16 (page 269)**: Pitch range scaling demonstration - same pattern in 6 ranges
- **Fig 1.19 (page 270)**: Baseline unit grid explanation
- **Fig 1.20 (page 271)**: Proportional scaling proof across two speakers
- **Fig 1.21 (page 272)**: Downstep cascade - "I really believe Ebenezer is a dealer in magnesium"
- **Fig 1.24 (page 274)**: From Liberman 1975 - comparing two realizations
- **Fig 1.25 (page 275)**: "There are many intermediate levels" - multiple L*+H- accents
- **Fig 2.10 (page 280)**: From O'Shaughnessy 1976 - "What's for dinner Stan"

## Quotes Worth Preserving

> "One of the issues raised in the thesis was to what extent intonation can be described using local specifications and rules. We claimed that the tonal correlates of the phrase taken as a whole are local: these are the phrase accent and the boundary tone, which are elements in the string of tones. We also claimed that the rules which implement tones phonetically are local." (page 241)

> "In this framework, features of the melody which are attributed to a nonlocal level of tonal representation in other accounts arise through the interaction of local specifications and rules." (page 242)

> "Associated with our claim that tonal implementation rules were local was a hypothesis about what the window for such rules is in English: they have no right context and can refer only as far back as the previous pitch accent." (page 244)

> "The basic problem, as we pointed out in Chapter 3, is that recovering two independently varying layers from an F0 contour is a mathematically underdetermined problem if the variation in either is too rich." (page 243)

## Implementation Notes

### For TTS F0 Generation

1. **Baseline unit scaling is key**: F0 should be computed in baseline units (proportional to speaker range), then converted to Hz. This allows pitch range adjustment without changing tonal patterns.

2. **Downstep produces exponential decay**: When implementing downstep, use multiplicative/exponential scaling, not additive. Each downstepped H should be a fixed proportion of the previous H.

3. **L tones reference neighboring H**: When computing L tone values, reference the nearest H tone (preferably previous H) rather than another L tone.

4. **No lookahead required**: Tonal implementation rules need only look back to the previous pitch accent - no forward planning is needed for the current accent.

5. **Phrase-final patterns**:
   - L- L% produces falling to baseline with possible vocal fry
   - H- H% produces final rise
   - L- H% produces fall-rise (continuation)
   - H- L% is rare but possible

6. **Interpolation between targets**: The specific interpolation method (linear, spline, etc.) can affect perceived tonal pattern. This remains an open question but linear interpolation is a reasonable default.

### Key References from Bibliography

- **Liberman (1975)**: "The Intonation System of English" - PhD dissertation MIT, foundational work
- **O'Shaughnessy (1976)**: "Modelling Fundamental Frequency" - F0 modeling for synthesis
- **Pierrehumbert (1979a)**: "Intonation Synthesis Based on Metrical Grids" - practical synthesis approach
- **Pierrehumbert (1980)**: "Synthesizing Intonation" - J. Acoust. Soc. Am. (the synthesis paper)
- **Collier & 't Hart (1971)**: "A Grammar of Pitch Movements in Dutch Intonation" - IPO approach
- **Cooper & Sorensen (1977)**: "Fundamental Frequency Contours at Syntactic Boundaries"
- **Thorsen (1979a-d)**: Multiple papers on Danish intonation - comparative data
