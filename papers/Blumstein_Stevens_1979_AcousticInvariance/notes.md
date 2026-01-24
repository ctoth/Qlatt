# Acoustic Invariance in Speech Production: Evidence from Measurements of the Spectral Characteristics of Stop Consonants

**Authors:** Sheila E. Blumstein, Kenneth N. Stevens
**Year:** 1979
**Venue:** Journal of the Acoustical Society of America, Vol. 66(4), pp. 1001-1017
**DOI:** 10.1121/1.383319

## One-Sentence Summary

Demonstrates that stop consonant place of articulation can be classified ~85% correctly using three spectral templates (diffuse-rising for alveolars, diffuse-falling for labials, compact for velars) applied to the short-time spectrum at consonantal release.

## Problem Addressed

Whether invariant acoustic properties exist for stop consonant place of articulation that are independent of vowel context, voicing, syllable position, and speaker - challenging the prevailing view that context-dependent cues (like formant transitions) are necessary for speech perception.

## Key Contributions

1. **Three spectral templates** for place of articulation classification:
   - **Diffuse-rising**: Alveolar [d, t] - spread energy with higher amplitude at high frequencies
   - **Diffuse-falling/flat**: Labial [b, p] - spread energy with higher amplitude at low frequencies
   - **Compact**: Velar [g, k] - single prominent midfrequency peak

2. **Quantitative validation**: ~85% correct classification across 1800 CV and VC utterances from 6 speakers

3. **Invariance demonstration**: Properties hold across vowel contexts, voicing (voiced/voiceless), syllable position (initial/final), and speakers (male/female)

## Methodology

### Spectral Analysis Procedure
1. Low-pass filter at 4800 Hz, sample at 10 kHz
2. Calculate first difference (high-frequency pre-emphasis)
3. Multiply by modified raised cosine window (26 ms)
4. Calculate 14-pole linear prediction spectrum

### Template Matching
- Conservative strategy: spectrum must meet ALL template conditions
- Tested 1800 utterances (6 speakers × 6 consonants × 5 vowels × 5 repetitions × 2 positions)

## Key Parameters

### Spectral Analysis

| Parameter | Value | Notes |
|-----------|-------|-------|
| Sampling rate | 10 kHz | |
| Low-pass filter | 4800 Hz | |
| Time window | 26 ms | Modified raised cosine |
| LPC order | 14 poles | |
| Pre-emphasis | First difference | High-frequency boost |

### Template Specifications

**Diffuse-Rising (Alveolar):**
- Two reference lines ~10 dB apart
- At least 2 peaks between reference lines, separated by ≥500 Hz
- Peak above 2200 Hz must be higher than lower-frequency peak
- Subglottal resonances (800-1600 Hz) within 10-12 dB ignored
- F2 locus peak (~1800 Hz) allowed to exceed reference

**Diffuse-Falling (Labial):**
- Spectral peak between 1200-3500 Hz fitted to top reference line
- At least 2 peaks within reference lines
- One peak below 2400 Hz, one peak between 2400-3600 Hz
- No amplitude constraint below 1200 Hz

**Compact (Velar):**
- Overlapping peaks in midfrequency range (1200-3500 Hz)
- Peak widths increase with frequency (300 Hz at 1200 Hz to 800 Hz at 3500 Hz)
- Two peaks ≤500 Hz apart treated as single peak
- No other peak of equal/greater magnitude outside 1200-3500 Hz

## Results

### Initial Consonants (CV)

| Template | Correct Acceptance | Correct Rejection |
|----------|-------------------|-------------------|
| Diffuse-rising | [d] 84%, [t] 88% | [b] 86%, [p] 80%, [g] 88.5%, [k] 85.3% |
| Diffuse-falling | [b] 82.5%, [p] 80% | [d] 80.7%, [t] 95.3%, [g] 90%, [k] 94.7% |
| Compact | [g] 86.7%, [k] 84.7% | [b] 91.3%, [p] 86.7%, [d] 82.7%, [t] 88% |

### Final Consonants (VC)

**Burst Release:** ~76% correct acceptance, ~84% correct rejection
**Closure:** Inconsistent - labials best (~77%), velars worst (~52%)

### Vowel Context Effects
- High front vowels [i, e] → labials/velars sometimes misclassified as alveolars
- Back vowels [u] → alveolars sometimes misclassified as velars
- Effects explainable by coarticulation affecting F2/F3 onset frequencies

### Nasal Consonants (Preliminary)
- [n] accepted by diffuse-rising: 72%
- [m] accepted by diffuse-falling: 81%
- Higher error rate possibly due to low-frequency masking by nasal murmur

## Implementation Details

### For Stop Consonant Classification

```
1. Sample spectrum at consonantal release (26 ms window)
2. Apply high-frequency pre-emphasis (first difference)
3. Calculate LPC spectrum (14 poles)
4. Test against each template:

DIFFUSE-RISING (Alveolar):
  - Find highest peak above 2200 Hz
  - Adjust spectrum so this peak touches upper reference
  - Check: ≥2 peaks within reference lines?
  - Check: high-freq peak > some lower-freq peak?
  - If yes to both → ALVEOLAR

DIFFUSE-FALLING (Labial):
  - Find highest peak in 1200-3500 Hz
  - Adjust spectrum so this peak touches upper reference
  - Check: ≥1 peak below 2400 Hz within lines?
  - Check: ≥1 peak in 2400-3600 Hz within lines?
  - If yes to both → LABIAL

COMPACT (Velar):
  - Find prominent midfrequency peak (1200-3500 Hz)
  - Match to corresponding template peak
  - Check: no other peak protrudes through reference?
  - Check: this peak > peaks outside 1200-3500 Hz?
  - If yes to both → VELAR
```

### Window Considerations
- 26 ms optimal for most cases
- Shorter windows (3.2-6 ms) can improve some classifications
- Nasal consonants: use 6 ms window to avoid murmur contamination

## Figures of Interest

- **Fig. 1 (p.4):** Waveforms and spectra for [ba, da, ga, pu, ta, ka]
- **Fig. 2 (p.5):** Schematic of three templates
- **Fig. 3-8:** Template fitting examples with accept/reject cases
- **Fig. 12 (p.8):** VC syllable showing closure and burst spectra
- **Fig. 13 (p.10):** Vowel context effects across all conditions
- **Fig. 15 (p.13):** Effect of window size on spectral shape

## Limitations

1. Closure spectra (VC offset) not reliably classified - may be due to devoicing before closure
2. Nasal consonants show higher error rates (~76% vs ~85% for stops)
3. Some vowel context effects remain (especially high front vowels)
4. Templates not optimized - represent first approximation
5. 15% of spectra fit multiple templates; 7% fit no template

## Relevance to Qlatt

1. **Stop consonant synthesis**: Burst spectrum shapes should follow these templates
   - Alveolars: Energy rising with frequency
   - Labials: Flat or falling energy distribution
   - Velars: Prominent midfrequency peak (F2-F3 proximity)

2. **Parallel branch amplitudes**: A2-A6 settings should produce these spectral shapes

3. **Burst modeling**: The 10-20 ms post-release window is critical for place perception

4. **Quality assessment**: Can use templates to verify synthesized stop bursts match natural patterns

## Open Questions

- [ ] Do current Qlatt burst spectra match these templates?
- [ ] Should burst amplitude parameters be adjusted to produce correct spectral tilt?
- [ ] Can template-matching be used for synthesis quality assessment?

## Related Work Worth Reading

- Zue (1976) - Acoustic characteristics of stop consonants (PhD thesis)
- Stevens & Blumstein (1978) - Invariant cues for place of articulation
- Halle, Hughes & Radley (1957) - Acoustic properties of stop consonants
- Fant (1960) - Acoustic Theory of Speech Production
