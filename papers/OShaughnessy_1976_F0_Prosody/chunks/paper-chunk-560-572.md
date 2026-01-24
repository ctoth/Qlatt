# Pages 560-572 Notes

## Chapters/Sections Covered

This chunk contains:
- **Appendix Tables 122-161**: Extensive F0 measurement data tables for various test sentences
- **Page 573**: Biographical Note about the author Douglas O'Shaughnessy

This is the final section of the thesis, consisting almost entirely of experimental data tables.

## Key Findings

### Data Table Structure

The tables (122-161) all follow a consistent structure for reporting F0 measurements:

- **set H**: Speaker identifier (sp = speaker, N = sentence number)
- **Speakers**: JA (speaker JA), KS, DO (different speaker identifiers)
- **pk**: Peak F0 value (Hz)
- **ds**: Declination slope or deviation from expected
- **ac**: Accent-related measurement
- **CR**: Some form of correction or reference value
- **f0/fo**: Fundamental frequency values
- **rate**: Speaking rate (typically 1.00 as baseline, with variations like 1.17, 1.24, 1.65 etc.)

### Test Sentence Categories (Tables 122-161)

The tables test F0 patterns across many linguistic structures:

1. **Table 122**: "fearless and brave son" - basic adjective+noun phrases
2. **Table 123**: "John and Mary" - coordinated names
3. **Table 124**: "less/more money" comparatives
4. **Table 125**: Question structures ("Mary asked a question of her partner")
5. **Table 126**: Indirect objects, prepositional phrases
6. **Table 127**: Speech rate variations
7. **Table 128**: Clause position effects (first of 2 clauses, parallel clauses, commas)
8. **Table 129**: Clause boundary markers (no CR, possible CR, one CR, 2+ CRs)
9. **Tables 130-131**: "Joe won the race and left" - coordinated verbs
10. **Table 132**: Passive vs. topicalized vs. left-dislocated sentences
11. **Table 133**: Active vs. relative clause structures
12. **Tables 134-139**: 2-complement sentences, extraposed sentences, introductory phrases
13. **Tables 140-142**: "Bob ran his lawnmower" - gapped vs. normal sentences
14. **Tables 143-144**: Word elision effects ("he", "also", "relies", "on", "friends")
15. **Tables 145-149**: Various sentence structures with F0 peak measurements
16. **Table 148**: Peak differentials across complex noun phrases with modifiers
17. **Table 149**: Peaks and valleys for single-clause vs. multi-clause utterances
18. **Table 150**: Syntactic structure codes (Noun+Verb, N+V+N+PP, etc.)
19. **Table 151**: Various sentence types with F0 measurements (built, cleaned, tested, etc.)
20. **Tables 152-161**: Additional test sentences with various structures

### Key Observations from Tables

1. **Speaking Rate Effects** (Table 149, 153):
   - Base rate = 1.00
   - Faster rates: 1.17, 1.24, 1.25, 1.65
   - Rate affects peak timing and magnitude

2. **Peak Counts by Structure** (Table 149):
   - Single-clause utterances: 1-5 peaks tracked
   - Multi-clause utterances: up to 8 peaks tracked
   - Peak values typically range 84-190 Hz

3. **Clause Position Effects** (Table 128):
   - First of 2 clauses shows different F0 pattern than subsequent clauses
   - Parallel clauses vs. non-parallel show measurable differences
   - Commas correlate with F0 changes

4. **Elision Effects** (Tables 143-144):
   - Eliding function words ("he", "on") changes F0 contour
   - Full sentence vs. elided versions show systematic differences

## Parameters Found

| Name | Symbol | Value | Units | Context |
|------|--------|-------|-------|---------|
| Peak F0 | pk | 100-190 | Hz | Typical range across speakers |
| Speaking Rate | rate | 1.00-1.65 | ratio | Baseline = 1.00 |
| Declination | ds | varies | Hz | Deviation from expected declination |
| F0 differential | diff | -48 to +10 | Hz | Peak-to-peak differences |

## Rules/Algorithms

No explicit algorithms are presented in these pages - this section contains only raw experimental data. However, the data structure suggests the following were measured:

1. Identify F0 peaks in utterance
2. Measure absolute peak value (pk)
3. Calculate deviation from expected declination (ds)
4. Note accent status (ac)
5. Apply correction factor if applicable (CR)
6. Record speaking rate normalization

## Figures of Interest

No figures in this chunk - only data tables.

## Quotes Worth Preserving

From the Biographical Note (page 573):

> "Three recent summers were spent in E. E.-related jobs: two at a small electronics firm, testing and designing circuits, and one at an acoustic research laboratory, writing a computer software program for automatic speech recognition." (page 573)

This indicates O'Shaughnessy had practical experience in speech synthesis/recognition systems.

> "I have authored 'Consonant Durations in Clusters,' published in the IEEE Transactions on Acoustics, Speech, & Signal Processing, ASSP-22, August 1974" (page 573)

## Implementation Notes

**For TTS Prosody Implementation:**

1. **Peak Count Heuristics**: Tables 148-149 suggest complex NPs and multi-clause sentences require tracking 4-8 F0 peaks. A TTS system should:
   - Count syntactic constituents to estimate peak count
   - Single clause: 1-3 peaks
   - Multi-clause: 4-8 peaks

2. **Speaking Rate Normalization**: The consistent use of "rate" as a multiplier (1.00 baseline) suggests F0 patterns scale with speaking rate. When implementing variable rate speech:
   - Keep relative peak positions
   - Scale absolute Hz values inversely with rate

3. **Elision Handling**: When function words are elided (common in casual speech), the F0 contour needs adjustment - the data shows systematic differences between full and elided versions.

4. **Clause Boundary Detection**: The thesis treats clause boundaries as critical for F0 planning. Implementing "clause reset" behavior is essential:
   - First clause of multi-clause sentence: distinct pattern
   - Subsequent clauses: modified declination

5. **Table 150 Syntactic Codes**: The codes like "N+V+N+PP" suggest the thesis uses a simplified syntactic representation for F0 assignment. This could inform a rule-based prosody module:
   - N+V: 2 phrases, pk around 152 Hz
   - N+V+N+PP: 4 phrases, pk around 169-177 Hz
   - More complex structures: more peaks, higher initial values

**Data Quality Note**: These tables represent the raw experimental foundation for the F0 model described earlier in the thesis. The implementation rules would be derived from statistical analysis of this data, not directly from the tables themselves.
