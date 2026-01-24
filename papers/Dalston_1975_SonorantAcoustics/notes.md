# Acoustic Characteristics of English /w,r,l/ Spoken Correctly by Young Children and Adults

**Authors:** Rodger M. Dalston
**Year:** 1975
**Venue:** Journal of the Acoustical Society of America, Vol. 57, No. 2, February 1975
**DOI/URL:** Published by Acoustical Society of America

## One-Sentence Summary
Provides spectrographic measurements of F1-F3 frequencies, steady-state durations, transition durations, and transition rates for word-initial /w/, /r/, and /l/ that can be used to set synthesis parameters for sonorant consonants.

## Problem Addressed
Prior studies of sonorants focused on spectral characteristics but ignored temporal characteristics. This study documents both spectral and temporal acoustic features that distinguish /w/, /r/, and /l/.

## Key Contributions
- Comprehensive formant frequency data for /w/, /r/, /l/ across adults (male/female) and children
- Temporal characteristics: steady-state duration, transition duration, transition rate for F1-F3
- Evidence that /l/ is marked by abrupt F1 transition with transient click
- F3 transition rate strongly distinguishes /r/ from /w/ and /l/

## Methodology
- 5 adults, 10 children (3-4 years old)
- Word-initial sonorants in /i/, /ɑ/, /u/ contexts
- Spectrographic analysis (Kay Spectrograph 6061A)
- Measurements: F1-F3 frequencies, steady-state durations, transition durations, transition rates

## Key Equations

Transition rate:
$$
\text{Transition Rate} = \frac{\Delta F \text{ (Hz)}}{\text{Transition Duration (ms)}}
$$

Where ΔF = frequency change between sonorant steady state and following vowel steady state.

Formant ratio normalization (for cross-speaker comparison):
$$
\text{Ratio} = \frac{F_n}{F_1}
$$

Where F1 = 1.00, enabling F2:F1 and F3:F1 ratios to be plotted on 2D plane.

## Parameters

### Formant Frequencies (Hz)

| Sound | Formant | Adult Males M (SD) | Adult Females M (SD) | Children M (SD) |
|-------|---------|-------------------|---------------------|-----------------|
| /r/ | F1 | 348 (45.9) | 350 (38.3) | 431 (49.8) |
| /w/ | F1 | 336 (39.2) | 337 (30.4) | 402 (59.7) |
| /l/ | F1 | 344 (55.2) | 365 (11.6) | 412 (38.4) |
| /r/ | F2 | 1061 (92.5) | 1165 (85.4) | 1503 (191.8) |
| /w/ | F2 | 732 (87.6) | 799 (87.8) | 1020 (148.8) |
| /l/ | F2 | 1179 (141.2) | 1340 (96.8) | 1384 (175.3) |
| /r/ | F3 | 1546 (94.8) | 2078 (346.1) | 2491 (369.8) |
| /w/ | F3 | 2290 (335.8) | 2768 (141.7) | 3547 (223.7) |
| /l/ | F3 | 2523 (197.8) | 2935 (174.4) | 3541 (283.0) |

### Temporal Characteristics - Adults (ms and Hz/ms)

| Measurement | /r/ M (SD) | /w/ M (SD) | /l/ M (SD) | Significant? |
|-------------|-----------|-----------|-----------|--------------|
| F1 steady-state duration | 39.2 (23.2) | 39.6 (16.1) | 67.0 (19.0) | Yes (p<0.001) |
| F2 steady-state duration | 35.5 (14.8) | 44.4 (20.2) | 57.0 (19.9) | Yes (p<0.01) |
| F3 steady-state duration | 30.9 (18.7) | 18.4 (20.6) | 45.4 (23.7) | Yes (p<0.01) |
| F1 transition duration | 33.7 (20.4) | 32.7 (18.7) | 21.3 (15.7) | Yes (p<0.01) |
| F2 transition duration | 50.4 (17.3) | 58.3 (26.8) | 41.3 (26.7) | Yes (p<0.01) |
| F3 transition duration | 71.4 (19.7) | 22.5 (19.7) | 31.1 (18.9) | Yes (p<0.001) |
| F1 transition rate | 3.9 (2.2) | 3.5 (3.5) | 8.5 (6.6) | Yes (p<0.01) |
| F2 transition rate | 10.5 (6.6) | 11.8 (6.9) | 11.4 (4.5) | No |
| F3 transition rate | 12.8 (1.5) | 3.1 (3.8) | 1.5 (5.0) | Yes (p<0.001) |

### Temporal Characteristics - Children (ms and Hz/ms)

| Measurement | /r/ M (SD) | /w/ M (SD) | /l/ M (SD) | Significant? |
|-------------|-----------|-----------|-----------|--------------|
| F1 steady-state duration | 40.3 (15.3) | 39.0 (23.1) | 56.7 (14.6) | Yes (p<0.01) |
| F2 steady-state duration | 41.2 (15.0) | 39.5 (21.9) | 55.4 (15.9) | Yes (p<0.01) |
| F3 steady-state duration | 38.9 (19.5) | 13.5 (18.0) | 15.0 (16.6) | Yes (p<0.001) |
| F1 transition duration | 32.7 (19.2) | 36.9 (18.2) | 21.8 (14.1) | p<0.059 |
| F2 transition duration | 52.3 (21.5) | 55.0 (24.7) | 41.1 (28.1) | No |
| F3 transition duration | 61.0 (20.1) | 10.2 (13.0) | 8.6 (9.4) | Yes (p<0.001) |
| F1 transition rate | 8.0 (7.7) | 7.7 (7.5) | 11.2 (9.5) | Yes (p<0.05) |
| F2 transition rate | 11.7 (6.9) | 17.4 (9.5) | 19.0 (7.0) | Yes (p<0.001) |
| F3 transition rate | 14.3 (3.7) | 1.2 (2.1) | 1.1 (4.4) | Yes (p<0.001) |

## Implementation Details

### Distinguishing Features for Synthesis

1. **F1**: Low frequency (~340-410 Hz) for all three sonorants; does NOT distinguish between them

2. **F2**: Distinguishes /w/ from /l/ and /r/
   - /w/: lowest F2 (~730-800 Hz adult males)
   - /r/: intermediate F2 (~1060-1165 Hz)
   - /l/: highest F2 (~1180-1340 Hz)

3. **F3**: Distinguishes /r/ from /w/ and /l/
   - /r/: very low F3 (~1550-2080 Hz) - KEY DISTINGUISHING FEATURE
   - /w/: higher F3 (~2290-2770 Hz)
   - /l/: highest F3 (~2520-2940 Hz)

### Temporal Implementation Notes

1. **/l/ requires longer steady-state** than /w/ or /r/ (F1: 67ms vs 39ms; F2: 57ms vs 35-44ms)
   - Attributed to tongue contact with palate (ballistic articulation)

2. **/l/ has abrupt F1 transition**
   - Short F1 transition duration: 21ms vs 33ms for /r/, /w/
   - Fast F1 transition rate: 8.5 Hz/ms vs 3.5-3.9 Hz/ms
   - Accompanied by **transient click** in 86% of adult productions before /i,u/

3. **/r/ has long F3 transition**
   - F3 transition duration: 71ms for /r/ vs 22-31ms for /w/, /l/
   - High F3 transition rate: 12.8 Hz/ms vs 1.5-3.1 Hz/ms

4. **Missing F3 transitions**
   - No F3 shift in 21% of adult /l/ productions (73% children)
   - No F3 shift in 49% of adult /w/ productions (75% children)
   - When absent, F3 steady-state duration = 0

### Synthesis Implications

For word-initial sonorants before vowels:

| Sound | F1 (Hz) | F2 (Hz) | F3 (Hz) | F1 SS (ms) | F1 Trans (ms) | F3 Trans (ms) | Transient? |
|-------|---------|---------|---------|------------|---------------|---------------|------------|
| /w/ | 340 | 750 | 2300 | 40 | 33 | 23 | No |
| /r/ | 350 | 1100 | 1600 | 39 | 34 | 71 | No |
| /l/ | 350 | 1200 | 2550 | 67 | 21 | 31 | Yes (before /i,u/) |

## Figures of Interest

- **Fig. 1 (p. 465):** F3/F1 vs F2/F1 ratio plot for adult males - shows clear separation of /w/, /r/, /l/
- **Fig. 2 (p. 466):** Same for adult females
- **Fig. 3 (p. 467):** Same for children - shows more overlap, larger variance
- **Fig. 4 (p. 468):** Spectrograms of "Leap" and "Loop" showing transient click associated with /l/ before high vowels

## Results Summary

Key acoustic cues that distinguish sonorants:

| Cue | Distinguishes |
|-----|---------------|
| F2 frequency | /w/ (low) from /l/, /r/ (high) |
| F3 frequency | /r/ (very low) from /w/, /l/ (high) |
| F1/F2 steady-state duration | /l/ (long) from /w/, /r/ (short) |
| F1 transition duration/rate | /l/ (short/fast) from /w/, /r/ (long/slow) |
| F3 transition duration/rate | /r/ (long/fast) from /w/, /l/ (short/slow) |
| Transient click | /l/ before /i,u/ (present) vs /w/, /r/ (absent) |

## Limitations

- Study focused on word-initial position only
- No investigation of intervocalic or word-final positions
- Synthetic speech studies needed to determine perceptual importance of each cue
- No analysis of incorrect (misarticulated) productions in this paper

## Relevance to Project

**Direct application to Klatt synthesis:**

1. **Formant targets for /w/, /r/, /l/**:
   - Current implementation can use these F1-F3 values as targets
   - F3 lowering for /r/ is critical distinguishing feature

2. **Transition timing**:
   - /r/ needs ~70ms F3 transition (longer than other sonorants)
   - /l/ needs abrupt ~21ms F1 transition
   - /w/ uses moderate transitions (~30-60ms)

3. **Steady-state durations**:
   - /l/ needs longer steady-state (~60-70ms) than /w/ or /r/ (~40ms)

4. **Transient for /l/**:
   - May need noise burst or click for /l/ before high vowels
   - Absence may explain poor /l/ synthesis quality

## Open Questions

- [ ] Does current synthesis implement the very low F3 for /r/?
- [ ] Is /l/ steady-state duration appropriately longer than /w/, /r/?
- [ ] Should a transient click be added for /l/ before /i/, /u/?
- [ ] Are F3 transition rates properly differentiated for /r/ vs /w/, /l/?

## Related Work Worth Reading

- O'Connor et al. (1957) - "Acoustic cues for perception of initial /w,j,r,l/ in English" - synthesis study
- Ainsworth (1968) - "First formant transitions and perception of synthetic semi-vowels"
- Fant (1960) - *Acoustic Theory of Speech Production* - for /l/ identification cues
- Lisker (1957) - "Minimal cues for separating /w,j,r,l/ in intervocalic position"
- Mattingly (1968) - "Synthesis by rule of General American English"
