# Acoustic and Perceptual Correlates of the Non-Nasal-Nasal Distinction for Vowels

**Authors:** Sarah Hawkins (Haskins Laboratories), Kenneth N. Stevens (MIT)
**Year:** 1985
**Venue:** Journal of the Acoustical Society of America, Vol. 77(4), April 1985, pp. 1560-1575
**DOI:** 0001-4966/85/041560-16$00.80

## One-Sentence Summary

This paper establishes that nasalization of vowels is perceptually cued by a pole-zero pair near F1, with the nasal zero placed midway between F1 and the nasal pole (FNZ = (FNP + F1)/2), providing systematic parameters for synthesizing nasal vowels using the Klatt synthesizer.

## Problem Addressed

The acoustic property underlying the phonemic distinction between nasal and oral vowels was not well understood. While nasalization modifies the spectrum near F1, the specific acoustic feature that listeners use to identify nasality (independent of language background) was unknown.

## Key Contributions

1. Identified a **universal acoustic correlate** of vowel nasality: a pole-zero pair in the vicinity of F1
2. Established that the **optimal nasal zero frequency** lies midway between F1 and the nasal pole: FNZ = (FNP + F1)/2
3. Demonstrated that listeners from different language backgrounds (with and without nasal-nonnasal vowel contrast) respond similarly to this acoustic property
4. Provided **systematic Klatt synthesizer parameters** for generating nasal vowel continua
5. Showed that the **pole-zero spacing at perceptual crossover** is 75-110 Hz across vowels

## Methodology

- Synthesized [tV] syllables (dental stop + vowel) for five vowels [i e a o u] using Klatt (1980) cascade synthesizer
- Created nasal-nonnasal continua by varying pole-zero pair parameters
- Tested listeners from five language groups: Gujarati, Hindi, Bengali (have nasal vowel contrast), and naive/non-naive American English speakers
- Conducted identification and discrimination experiments

## Key Equations

### Optimal Nasal Zero Frequency
$$
\text{FNZ} = \frac{\text{FNP} + F1}{2}
$$

Where:
- FNZ = frequency of nasal zero (Hz)
- FNP = frequency of nasal pole (Hz)
- F1 = first formant frequency of the vowel (Hz)

This relationship ensures the zero is placed midway between F1 and the nasal pole.

### Pole-Zero Spacing at Identification Boundary
$$
\text{Spacing} = \text{FNP} - \text{FNZ} \approx 75-110 \text{ Hz}
$$

The average pole-zero spacing at the 50% crossover point (nasal/non-nasal boundary) is vowel-dependent but falls in the range 75-110 Hz.

## Parameters

### Klatt Synthesizer Stimulus Parameters (Table I, page 1563)

| Parameter | [i] | [e] | [a] | [o] | [u] | Units | Notes |
|-----------|-----|-----|-----|-----|-----|-------|-------|
| F1 (steady-state) | 270 | 400 | 700 | 430 | 270 | Hz | Non-nasal vowel target |
| F1i (transition start) | 200 | 270 | 350 | 270 | 200 | Hz | Following [t] release |
| F2 | 2300 | 2025 | 1150 | 850 | 850 | Hz | |
| F2i | 1800 | 1700 | 1500 | 1350 | 1350 | Hz | |
| F3 | 2900 | 2915 | 2500 | 2500 | 2500 | Hz | |
| F3i | 3000 | 3100 | 2800 | 2800 | 2800 | Hz | |
| B1 | 60 | 60 | 80 | 100 | 80 | Hz | First formant bandwidth |
| B2 | 80 | 80 | 100 | 100 | 100 | Hz | Second formant bandwidth |
| F4 | 3500 | 3500 | 3500 | 3500 | 3700 | Hz | F4 = 3700 Hz for [i] only |
| F5 | 4500 | 4500 | 4500 | 4500 | 4500 | Hz | |
| B3, B4, B5 | 150, 170, 250 | | | | | Hz | Higher formant bandwidths |

### Nasal Pole-Zero Parameters

| Parameter | Value | Units | Notes |
|-----------|-------|-------|-------|
| Initial FNP | 400 | Hz | At 40ms after voicing onset |
| Initial FNZ | 400 | Hz | At 40ms (cancels with pole) |
| Initial bandwidth (FNP, FNZ) | 100 | Hz | |
| Transition duration | 40 | ms | 40-80ms piecewise linear motion |
| Vowel duration | 325 | ms | |
| F0 | Rising-falling contour | Hz | Appropriate for statement |
| Initial stop burst | 15 | ms | From burst onset |
| Voicing onset | 10 | ms | After stop release |
| Non-nasal interval | 40 | ms | Before nasalization begins |

### Nasal Endpoint Parameters (from Fig. 5, page 1565)

| Vowel | F1 (non-nasal) | F1 (nasal) | FNP (nasal endpoint) | FNZ (nasal endpoint) |
|-------|----------------|------------|----------------------|----------------------|
| [i] | 270 | 270 | ~800-1000 | ~400-600 |
| [e] | 400 | 350 | ~750 | ~525 |
| [a] | 700 | 700 | ~800 | ~750 |
| [o] | 430 | 430 | ~700 | ~550 |
| [u] | 270 | 270 | ~600-800 | ~400-500 |

Note: For [i] and [u], F1 does not shift; for [e a o], there is a change in F1 along the continuum.

### Pole-Zero Spacing at 50% Crossover (Fig. 9, page 1569)

| Vowel | Spacing at Boundary | Spacing at Nasal Endpoint |
|-------|---------------------|---------------------------|
| [i] | ~110 Hz | ~200 Hz |
| [e] | ~90 Hz | ~150 Hz |
| [a] | ~80 Hz | ~100 Hz |
| [o] | ~75 Hz | ~110 Hz |
| [u] | ~100 Hz | ~175 Hz |

## Implementation Details

### Synthesis Method (Klatt 1980 Cascade)

1. **Base vowel**: Use cascade formant synthesizer with standard F1-F5 formants
2. **Add nasal pole-zero pair**: Insert additional resonance (FNP) and anti-resonance (FNZ) near F1
3. **Timing**:
   - Stop burst: 15 ms
   - Voicing onset: 10 ms after release
   - Non-nasal portion: first 40 ms after voicing onset
   - Nasalization onset: 40 ms after voicing onset
   - Nasalization transition: 40 ms (piecewise linear)
   - Steady-state nasal: remaining vowel duration

### Pole-Zero Trajectory

```
Time (ms)    FNP (Hz)    FNZ (Hz)    Effect
0-40         400         400         Cancel each other (non-nasal)
40-80        400→FNPf    400→FNZf    Linear transition to nasal values
80-325       FNPf        FNZf        Steady-state nasal
```

Where FNPf and FNZf are the final (nasal endpoint) values.

### Key Constraint for Good Nasal Vowels

The preferred pole-zero combinations satisfy:
$$
\text{FNZ} \approx \frac{\text{FNP} + F1}{2}
$$

With at least 100 Hz separation between the zero and each pole (FNP and F1).

### Perceptual Effects by Vowel

| Vowel | Primary Cue | Secondary Effects |
|-------|-------------|-------------------|
| [i] | F1 prominence reduced | High-frequency changes less salient |
| [e] | F1 prominence reduced | Possible vowel quality shift |
| [a] | F1 prominence broadened | Center of gravity shift |
| [o] | F1 prominence broadened | Perceived vowel height change |
| [u] | F1 prominence reduced | Similar to [i] |

## Figures of Interest

- **Fig. 1 (page 1561):** Spectrograms comparing nasal vs non-nasal vowels in Gujarati - shows spectral differences
- **Fig. 2 (page 1562):** Spectrogram of synthetic [tẽ] - shows nasalization beginning at 80ms
- **Fig. 3 (page 1563):** Formant trajectories for F1, F2, F3, FNP, FNZ during synthetic nasal vowel
- **Fig. 4 (page 1564):** Parameter space plots showing acceptable nasal vowel regions (FNP vs FNZ)
- **Fig. 5 (page 1565):** Critical - shows F1, FNP, FNZ values for nasal endpoints across all vowels
- **Fig. 6 (page 1566):** FNP and FNZ values across the stimulus continua
- **Fig. 7 (page 1567):** Spectra of stimuli from identification test - visual comparison of spectral changes
- **Fig. 8 (page 1568):** Identification functions for all language groups - shows similar crossover points
- **Fig. 9 (page 1569):** Pole-zero spacing at crossover vs vowel - key implementation reference
- **Fig. 10 (page 1570):** Context effects on nasality identification
- **Fig. 11 (page 1570):** Range effects on identification boundary
- **Fig. 12 (page 1571):** Discrimination functions showing within-category vs between-category accuracy

## Results Summary

1. **Cross-linguistic consistency**: All five language groups (including American English speakers with no phonemic nasal vowel contrast) showed similar 50% crossover points for identifying nasal vowels
2. **Pole-zero spacing**: The boundary between nasal and non-nasal perception occurs at approximately 75-110 Hz pole-zero spacing
3. **Vowel effects**: High vowels [i, u] required slightly greater pole-zero spacing than mid/low vowels
4. **Discrimination**: Better discrimination occurred at category boundaries, consistent with categorical perception
5. **Context effects**: Immediately preceding nasal stimuli shifted identification boundary toward non-nasal, especially for front vowels

## Limitations

1. Stimuli were synthetic - natural speech may have additional cues
2. Only tested CV syllables with [t] onset - other contexts may differ
3. Bengali speakers showed variable responses due to unclear nasal vowel status in their dialect
4. The pole-zero model is a simplification - real nasal coupling introduces multiple pole-zero pairs
5. Higher formant modifications (F2, F3 amplitude changes) were not independently manipulated

## Relevance to Project

### For Klatt Synthesizer Implementation

1. **Nasal vowel synthesis**: Add FNP (nasal pole) and FNZ (nasal zero) parameters
2. **Parameter calculation**: FNZ = (FNP + F1)/2 for perceptually good nasal vowels
3. **Timing**: Nasalization should begin ~40ms into vowel with ~40ms transition
4. **Bandwidth**: Use ~100 Hz bandwidth for both FNP and FNZ

### For TTS Frontend

1. **Phoneme targets**: Nasal vowels need additional FNP/FNZ targets
2. **Coarticulation**: Model nasal anticipation - nasalization may begin before nasal consonant
3. **Vowel-dependent values**: Different vowels require different FNP/FNZ configurations

### Implementation Checklist

- [ ] Add FNP (nasal pole frequency) parameter to synthesizer
- [ ] Add FNZ (nasal zero frequency) parameter to synthesizer
- [ ] Add BNP/BNZ (nasal pole/zero bandwidths) parameters
- [ ] Implement pole-zero pair in cascade synthesis path
- [ ] Add nasal vowel phoneme targets to tts-frontend-rules.js
- [ ] Implement nasal coarticulation timing rules

## Open Questions

- [ ] How do nasal consonants (not just vowels) interact with this model?
- [ ] Should the parallel branch also include nasal pole-zero modification?
- [ ] What are the exact formant frequency shifts for nasal vowels (Table I shows F1i differs)?
- [ ] How does nasalization interact with other voice quality parameters (breathiness, etc.)?

## Related Work Worth Reading

- House and Stevens (1956) - Analog studies of vowel nasalization
- Maeda (1982a, 1982b) - Acoustic correlates of vowel nasalization
- Fant (1960) - Acoustic Theory of Speech Production (nasal coupling theory)
- Klatt (1980) - Cascade/parallel formant synthesizer (synthesis method)
- Stevens et al. (1985) - Acoustical and perceptual correlates of nasal vowels (companion paper)
- Fujimura (1960, 1961) - Spectra/analysis of nasalized vowels
