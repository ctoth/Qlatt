# Laryngeal Factors in Voiceless Consonant Production in Men, Women, and 5-Year-Olds

**Authors:** Laura L. Koenig
**Year:** 2000
**Venue:** Journal of Speech, Language, and Hearing Research, Vol. 43, pp. 1211-1228
**Affiliation:** Haskins Laboratories, New Haven, CT

## One-Sentence Summary

VOT variability in children reflects not just interarticulator timing but also developing laryngeal control, with systematic age and gender differences in voicing behavior demonstrated through /h/ voicing patterns that correlate with stop consonant VOTs.

## Problem Addressed

Whether VOT acquisition in children can be interpreted purely in terms of developing interarticulator timing control, or whether laryngeal factors (glottal aperture, tissue characteristics, aerodynamic conditions) also contribute to VOT variability across age and gender.

## Key Contributions

1. **VOTh measure**: Novel quantitative measure of /h/ voicing (time from flow peak to voice onset)
2. **Age/gender effects**: Clear group differences in /h/ voicing - men mostly voiced, women variable, children highly variable
3. **VOT-VOTh correlation**: Individual speakers' /h/ voicing patterns correlate with their stop VOT distributions
4. **Laryngeal control hypothesis**: Children's VOT variability reflects developing laryngeal control, not just timing
5. **Gender-specific strategies**: Men and women may need different strategies for voicing contrasts due to structural differences

## Key Findings

### VOT Categories (Lisker & Abramson 1964)

| Category | VOT Range | Examples |
|----------|-----------|----------|
| Voiceless aspirated | Long positive (long-lag) | English /p t k/ |
| Voiceless unaspirated | Near zero (short-lag) | |
| Voiced | Negative | English /b d g/ (closure voicing) |

### VOT Results by Group (Table 1)

| Consonant | Men (ms) | Women (ms) | 5-year-olds (ms) |
|-----------|----------|------------|------------------|
| /b/ M | 10.2 | 12.5 | 12.6 |
| /p/ M | 42.6 | 48.1 | 52.6 |
| /p/ SD | 10.9 | 12.0 | **20.9** |
| /d/ M | 11.9 | 14.7 | 12.0 |
| /t/ M | 49.8 | 61.6 | 58.2 |
| /t/ SD | 9.9 | 10.7 | **21.8** |

**Key finding**: No significant group differences in VOT means, but children show **2x higher SDs** than adults.

### /h/ Voicing Results (Table 4)

| Measure | Men | Women | 5-year-olds |
|---------|-----|-------|-------------|
| % Fully voiced /h/ | **87%** | 35% | 56% |
| VOTh range (all) | 32.9 ms | 52.9 ms | **107.1 ms** |
| VOTh range (devoiced only) | 31.3 ms | 54.2 ms | 80.7 ms |

### Correlations Between VOTh and Stop VOTs (Table 6)

| Measure | /p/ VOT | /t/ VOT |
|---------|---------|---------|
| VOTh median | r = .64* | r = .65* |
| VOTh maximum | r = .64* | r = .55* |
| VOTh SD | r = .64* | r = .72* |

*p ≤ .05

### Peak Airflow in /h/ (Table 3)

| Group | Mean (l/m) | SD |
|-------|------------|-----|
| Men | 44.0 | 7.3 |
| Women | 34.5 | 7.7 |
| 5-year-olds | 18.5 | 8.8 |

Men show significantly higher peak flows, reflecting larger glottal openings.

## Parameters

| Parameter | Symbol | Units | Typical Values | Notes |
|-----------|--------|-------|----------------|-------|
| Voice Onset Time | VOT | ms | 35-80 (voiceless) | Release to voice onset |
| VOT for /h/ | VOTh | ms | 0 (voiced) to 150+ | Flow peak to voice onset |
| Peak airflow /h/ | Pkflow | l/m | 18-68 | Indicates abduction extent |
| Subglottal pressure | Pres | cm H₂O | 4-9 | ~6-7 typical |
| Phonation threshold pressure | Pth | cm H₂O | varies | Minimum for voicing |

### Factors Affecting Voicing Onset

From Titze (1988), phonation threshold pressure depends on:
- Vocal fold coupling stiffness (↑ stiffness → ↑ Pth)
- Tissue damping/viscosity
- Prephonatory glottal half-width (↑ width → ↑ Pth)
- Vocal fold thickness (↑ thickness → ↓ Pth)
- Glottal convergence angle (↓ angle → ↓ Pth)

**Men** have: longer, thicker folds, lower stiffness, smaller convergence → **easier voicing**
**Women/children** have: shorter, stiffer folds → **harder to maintain voicing during abduction**

## Implementation Details

### Measuring VOT from Airflow

1. **Stop release**: Peak in 2nd time derivative of smoothed flow signal (rapid increase at release)
2. **Voice onset**: First visible pulse in lightly smoothed flow signal
3. **VOT** = voice onset time - release time

### Measuring VOTh

1. **Flow peak**: Zero crossing in 1st derivative of smoothed flow
2. **Voice onset**: Spectral changes in narrow-band DFT waterfall display
   - Look for emergence of F1 and F2 harmonics
3. **VOTh** = voice onset - flow peak time
4. If voicing never stops: VOTh = 0 (fully voiced /h/)

### Signal Processing

- Acoustic: filtered 9.5 kHz, digitized 20 kHz
- Flow/pressure: filtered 4.5 kHz, digitized 10 kHz
- Smoothing: 133-point triangular window (removes glottal pulses)
- DFT for voicing onset: 512-point window, Hamming, 64-point slide

## Figures of Interest

- **Figure 1 (p.1215)**: Labels for VOT measurement - shows spectrogram, airflow, 2nd derivative
- **Figure 2 (p.1216)**: VOTh labeling for voiced vs devoiced /h/ tokens
- **Figure 3 (p.1222)**: Overlaid histograms of VOTh and /p,t/ VOTs by speaker - shows correlation
- **Figure 4 (p.1223)**: Airflow contours for /h/ by speaker - men show consistent patterns, children highly variable

## Relevance to Qlatt

### Voice Source Modeling

1. **Gender differences**: Men vs women may need different AV (voicing amplitude) and AH (aspiration) parameter ranges
2. **/h/ synthesis**: Should vary voicing proportion based on speaker model:
   - Male voice: predominantly voiced /h/ (breathy, not silent)
   - Female voice: more variable, often with voiceless interval
   - Child voice: highly variable

### VOT Implementation

1. **Mean VOT values**: Similar across groups - use standard values
2. **VOT variability**: Children show ~2x adult variability - could model for child voices
3. **VOT-voicing correlation**: Speakers with longer VOTs tend to have longer /h/ devoicing

### Practical Guidelines

```
For /h/ synthesis:
  Male speaker:
    - VOTh typically 0 (fully voiced)
    - Breathy voice quality throughout
    - Peak airflow ~40-60 l/m

  Female speaker:
    - VOTh 0-90 ms (variable)
    - May have voiceless interval at peak abduction
    - Peak airflow ~10-70 l/m

  Child speaker:
    - VOTh highly variable (0-150 ms)
    - Inconsistent abduction patterns
    - Lower peak flows ~5-30 l/m

For stop VOT:
  All speakers:
    - /p/ mean ~45-55 ms
    - /t/ mean ~50-60 ms
  Children:
    - Double the variance (SD ~20 ms vs ~10 ms)
```

### Breathy Voice Without Abduction

One female speaker (AF6) produced /h/ with minimal flow increase but clear breathy quality. This suggests breathiness can be achieved through laryngeal adjustments that alter vibratory properties without much glottal area change (cf. Hanson 1997). For synthesis, this means AH (aspiration) and TL (spectral tilt) can vary somewhat independently.

## Limitations

1. Small sample sizes (7 per group)
2. Only one speaking context (intervocalic stressed /h/)
3. No direct laryngeal imaging - inferences from airflow
4. Only 5-year-olds studied - no full developmental trajectory
5. Pressure measured in final syllable (may underestimate)

## Open Questions

- [ ] How does /h/ voicing vary with stress and position?
- [ ] What is the developmental trajectory of laryngeal control (ages 5-puberty)?
- [ ] Do men and women use different articulatory strategies for voicing contrasts?
- [ ] Can speakers learn to modify their voicing patterns?

## Related Work Worth Reading

- Lisker & Abramson (1964) - Original VOT cross-language study
- Titze (1988) - Phonation threshold pressure physics
- Klatt & Klatt (1990) - Voice quality variations male/female
- Hanson (1997) - Glottal characteristics of female speakers
- Fant (1995) - LF model revisited (breathiness parameters)
- Stevens (1977) - Physics of laryngeal behavior
