# Pages 480-519 Notes

## Chapters/Sections Covered

This chunk primarily contains:
- **Appendix A: F0 Contour Examples** (pages 481-493) - Numerous F0 contour plots for various sentence types
- **Section on Sub-contour Variations** (page 494) - Time variation in sub-contours
- **Statistical Analysis of F0 Patterns** (pages 495-496) - Quantitative data on F0 peaks, rises, and descents
- **Algorithm Flowcharts** (pages 497-505) - Decision trees for assigning tunes, breaks, accents, and phonetic divisions
- **Predicted vs Actual F0 Contours** (pages 506-507) - Comparison plots
- **Table Legends / Test Sentences** (pages 508-520) - Extensive list of test sentences used in experiments

## Key Findings

### F0 Peak Statistics (page 495)
Statistical analysis of F0 values on peaks from 22 words:
- Mean peak F0: 172.1 Hz (SD = 8.1)
- Mean for type 'x': 130.7 Hz (SD = 6.5)
- Mean for type '&': 119.1 Hz (SD = 6.5)

F0 rise accent or CR statistics:
- Mean o: +7.7 Hz (SD = 3.5, N = 22)
- Mean x: +15.4 Hz (SD = 3.8)
- Mean &: +4.5 Hz (SD = 3.6)

### F0 Descent Statistics (page 496)
F0 descents analysis:
- Mean x: -27.0 Hz (SD = 11.0, N = 22)
- Mean *: -28.0 Hz (SD = 6.0)
- Mean $: -17.8 Hz (SD = 8.9)

Secondary descent statistics:
- Mean o: -14.0 Hz (SD = 7.6, N = 22)
- Mean &: -0.4 Hz (SD = 3.3)
- Mean +: -9.9 Hz (SD = 2.4)

### Sub-contour Time Variations (page 494)
Three types of sub-contour shape variations illustrated:
1. **Basic** - Simple rise-fall pattern
2. **Variation** - Modified timing of the contour
3. **Overshoot** - Contour extends beyond expected peak

F0 values shown for different numbers of stressed syllables (SCs):
- 1 SC: 165 Hz start, 90 Hz end (145 Hz range)
- 2 SCs: 165 Hz start, 90 Hz end, 110-140 Hz mid-range
- 3 SCs: 165 Hz start, 90 Hz end, 120-135 Hz intermediate values

## Equations Found

### Head Peak Assignment (page 500)
$$
\text{head peak} = \min(185, (123-8x) + (12-2x) \times y)
$$
Where:
- x = number of clauses
- y = number of phrases

### F0 Room Calculation (page 500)
$$
\text{F0 room} = \text{head peak} - z
$$
Where:
- z = 110 for Tune A
- z = 125 for Tune B

### Peak Differentials (page 500)
$$
\text{peak differentials} = \frac{\text{room}}{\text{number of content words}}
$$

Adjustments by peak position:
- First peak: +15%
- Next to last peak: +15%
- Other peaks: -15%

### Accent Number Calculation (page 500)
$$
\text{accent number} = \text{accent number} + 10\% \times (\text{accent number} - 8) \times \text{local F0 room}
$$

### F0 Adjustments for NP Level (page 500)
- Level +1: +40%
- Level 0: 0%
- Level -1: -40%

### CR Value Assignment (page 501)
$$
\text{CR value} = \text{CR number} \times 8 \text{ Hz}
$$

### US Drop-off Calculation (page 502)
$$
\text{US drop-off} = (\text{end-point of one AS}) - (\text{start-point of next AS})
$$

## Parameters Found

| Name | Symbol | Value | Units | Context |
|------|--------|-------|-------|---------|
| Head peak max | - | 185 | Hz | Maximum initial peak value |
| Tune A baseline | z | 110 | Hz | Subtracted from head peak for room |
| Tune B baseline | z | 125 | Hz | Subtracted from head peak for room |
| Fall accent base | - | 85 | Hz | Used when fall accent on AS |
| Peak-110 adjustment | - | peak-110 | Hz | Head accent calculation |
| CR multiplier | - | 8 | Hz | Per CR number |
| Rise accent voiced AS ratio | - | 80%:20% | - | Start to rise ratio |
| Fall:drop consonant ratio | - | 4:1 | - | When ending with voiced consonant |
| Fall:drop consonant ratio | - | 1:2 | - | Without voiced consonant ending |
| F0 descent type x mean | - | -27.0 | Hz | SD=11.0 |
| F0 descent type * mean | - | -28.0 | Hz | SD=6.0 |
| F0 descent type $ mean | - | -17.8 | Hz | SD=8.9 |
| F0 peak mean (o) | - | 172.1 | Hz | SD=8.1, N=22 |
| F0 peak mean (x) | - | 130.7 | Hz | SD=6.5 |
| F0 peak mean (&) | - | 119.1 | Hz | SD=6.5 |

## Rules/Algorithms

### High Level System - Tune Assignment (page 497, Fig. 136-137)
1. Syntax information + Semantic information -> High Level System -> prosodic indicators
2. Phonemical data + Lexical stress data -> Low Level System -> Fundamental Frequency Contour

### Sentence-Level Tune Assignment (page 497, Fig. 137)
Decision tree for assigning tunes:
1. Is it a statement or question?
   - Statement: Check for tag question
     - Yes: Use A+B or A pattern
   - Question: Check Wh- or yes/no
     - Wh-question: Check if example -> A+B or A
     - Yes/no question: Check alternative -> B+A or B
2. End in vocative?
   - Yes: Shift Tune back, check which Tune (A -> delete end Tune, B -> 0)
   - No: 0 (no action)

### Phrase Level - Break and CR Assignment (page 498, Fig. 138)
Inter-clause processing:
- Independent clause: (-4,3)
- Dependent clause: Check which boundary
  - First: (-2,1)
  - Second: (-3,2)
- Check for syntactic transformation offset by punctuation

Intra-clause deviations:
- Before a list, appositive, or vocative: yes (-3,0), no (-3,2)
- Conjunction or comma: yes (-2,1), no (-2,2)

### Word Level - Accent Number Revision (page 499, Fig. 139)
Syntactic transformation adjustments:
- Focus/preposing: +2 for switched words, +3 for focus, -2 for other words
- Cleft: +4 for focus, -2 for other words
- Passive: +2 for verb
- Multisyllabic second compound: yes +2, no 0
- Repetition/successive: yes -> check parallel structure
- Paragraph considerations: -3 on first, -2 on both in same clause

### Accent Peak Modifications (page 501, Fig. 142)
Number of USs between 2 ASs:
- 0 USs: -40% for both rise accents, -20% first peak, +20% second peak
- 2 USs: +15% for both accents, +10% first peak, -15% second peak
- 3+ USs: peak - 105 for 2nd accent, +15% first peak, -25% second peak

For 3 ASs in a row:
- Yes: reverse accents
For 4 or more ASs:
- Yes: -30% for first accent
- No: -25% for first accent

### Phonetic Division - US Assignment (page 502, Fig. 144)
For each AS:
- Start-point = peak - rise accent
- End-point = peak - fall accent
- US drop-off = (end-point of one AS) - (start-point of next AS)

Ratio of (drop:fall) in US:
- Voiced AS start? Yes: 80%:20%, No: 20%:80%
- +20% increase on peak and accents

Assign ratio of (fall:drop):
- AS non-final in word? Yes: end with voiced consonant?
  - Yes: 4:1
  - No: 1:2
- Replace fall with rise: use 85 as low value, adjust accents to null the drop-off

### Equal Drops Distribution (page 502, Fig. 146)
Number of USs in P-unit:
- 1: equal drops for each US (100%)
- 2: 60% for 1st, 40% for 2nd
- 3+: 45% for 1st, 35% for 2nd, 20% for 3rd, 0% for rest

## Figures of Interest

- **Figs. 101-130** (pages 481-493): Extensive collection of F0 contour plots for various sentence types including questions, statements, lists, compound sentences
- **Fig. 131** (page 494): Variations with different numbers of sub-contours (1 SC, 2 SCs, 3 SCs)
- **Fig. 132** (page 494): Time variation in sub-contour showing basic, variation, and overshoot patterns
- **Figs. 133-135** (pages 495-496): Statistical distributions of F0 peaks, rises, and descents
- **Fig. 136** (page 497): System architecture diagram showing High Level System and Low Level System
- **Fig. 137** (page 497): Decision tree for assigning tunes at sentence level
- **Fig. 138** (page 498): Decision tree for break and CR assignment at phrase level
- **Fig. 139** (page 499): Decision tree for accent number revision at word level
- **Figs. 140-143** (pages 500-501): Peak values, accents, modifications, and CR assignment flowcharts
- **Figs. 144-146** (page 502): Phonetic division algorithms for US assignment
- **Figs. 147a-147c** (pages 503-505): Detailed algorithm operation illustrations with example sentences
- **Figs. 148a-148c** (pages 506-507): Predicted vs actual F0 contour comparisons

## Quotes Worth Preserving

> "Predicted versus actual spoken Fo contours: The actual plot is similar to those above, with selected peak values shown. The predicted plot is aligned with the actual durations, and is illustrated by dotted lines." (page 506)

## Implementation Notes

### Architecture
The F0 generation system has two main levels:
1. **High Level System**: Takes syntax and semantic information, produces prosodic indicators (tunes, breaks)
2. **Low Level System**: Takes phonemical and lexical stress data, produces the actual F0 contour

### Key Implementation Decisions

1. **Tune Selection**: Binary choice between Tune A and Tune B based on sentence type (statement vs question) and structure

2. **Peak Calculation Formula**:
   - Base formula: min(185, (123-8x) + (12-2x)*y) where x=clauses, y=phrases
   - This gives decreasing peak heights as sentence complexity increases

3. **F0 Room Concept**: The "room" between head peak and baseline (110 or 125 Hz) determines available range for accent variation

4. **Accent Scaling**: Accents are scaled as percentages of local F0 room, not absolute Hz values

5. **CR (Continuation Rise) Quantization**: CR values are quantized at 8 Hz steps

6. **Timing Ratios**:
   - Voiced AS start: 80% rise, 20% fall
   - Unvoiced AS start: 20% rise, 80% fall
   - These ratios control the timing of pitch movements

7. **Multi-AS Handling**: Special rules for 3+ accented syllables in sequence with percentage adjustments

### Test Corpus
Pages 508-519 contain extensive test sentences (Tables 1-111) covering:
- Simple declaratives
- Questions (yes/no, wh-, tag)
- Negation patterns
- Quantifiers
- Adverb placement
- Focus/topicalization
- Parallel structures
- Complex embedded clauses
- Passive constructions

These sentences systematically test the F0 generation rules across different syntactic constructions.
