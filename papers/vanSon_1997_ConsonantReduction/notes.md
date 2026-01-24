# An Acoustic Profile of Consonant Reduction

**Authors:** R.J.J.H. van Son and Louis C.W. Pols
**Year:** 1997 (inferred from page numbers 1529-1532, conference proceedings style)
**Venue:** Proceedings (likely Eurospeech or ICSLP based on format and citations)
**Institution:** Institute of Phonetic Sciences & IFOTT, University of Amsterdam

## One-Sentence Summary

Consonants reduce acoustically in spontaneous speech similarly to vowels - showing decreased duration, lower spectral center of gravity (reduced effort), decreased coarticulation, and maintained relative vowel-consonant energy differences.

## Problem Addressed

Vowel reduction is well-established, but how consonants behave acoustically when speaking style becomes informal was poorly understood. Previous studies were limited to few consonant classes with limited speech material.

## Key Contributions

1. First comprehensive acoustic inventory of consonant reduction across all major consonant classes
2. Demonstrates consonant reduction parallels vowel reduction in type and extent
3. Identifies four measurable acoustic correlates of consonant reduction
4. Shows consonant-type-dependent variation in reduction patterns

## Methodology

- **Speech material:** Experienced newscaster telling stories spontaneously, then reading the transcription
- **Duration:** 2 × 20 minutes (spontaneous + read)
- **Sampling:** 16-bit, 48 kHz
- **Analysis:** 791 matched VCV pairs with identical syllable structure, boundary type, and stress
- **G2P:** Used University of Nijmegen experimental speech synthesizer

### Dutch Consonants Analyzed

| Manner | Velar | Palatal | Alveolar | Labial |
|--------|-------|---------|----------|--------|
| Plosives | k, g | | t, d | p, b |
| Fricatives | x, γ | ʃ, ʒ | s, z | f, v |
| Nasals | ŋ | | n | m |
| Vowel-like | r | j | l | w |

### Sample Sizes by Category

| Category | Velar | Palatal | Alveolar | Labial | Total |
|----------|-------|---------|----------|--------|-------|
| Plosives | 63 | | 65 | 61 | 189 |
| Fricatives | 77 | 3 | 63 | 75 | 218 |
| Nasals | 14 | | 72 | 63 | 149 |
| Vowel-like | 60 | 21 | 94 | 60 | 235 |
| **Total** | 214 | 24 | 294 | 259 | 791 |

## Key Findings

### 1. Formant Values (F1/F2 Centralization)

- Vowels from spontaneous VCV segments show **centralization** in F1/F2 plane compared to read speech
- Pre-consonantal vowels affected
- Figure 1 shows Dutch vowel space contraction (p ≤ 0.001)

### 2. F2 Slope Differences (Coarticulation Strength)

- **Method:** Measured F2 slope at CV and VC boundaries, normalized for vowel duration
- **Finding:** Fricatives and plosives show **significantly lower slope differences** in spontaneous speech (p ≤ 0.001)
- **Interpretation:** Decreased coarticulation strength = reduced articulatory precision
- Individual phoneme behavior is erratic (none reach significance alone)

### 3. Duration

- **Both vowels AND consonants shorten** in spontaneous speech
- **Critical finding:** They shorten by the **same relative amount** - the consonant/VCV ratio remains constant
- Duration reduction is a "global" feature of speaking style change
- **Exception:** Vowel-like consonants (w, l, j, r) show constant or slightly increased duration (not significant)

### 4. Center of Gravity (COG)

$$
\text{COG} = \frac{\int f \cdot E(f) \, df}{\int E(f) \, df}
$$

Where $E(f)$ is spectral energy at frequency $f$.

**Interpretation:**
- For sonorants: COG relates to spectral slope steepness → steeper slope = lower COG
- Spectral slope determined by glottal pulse steepness → measure of speech effort
- For turbulent noise: COG determined by (airflow speed)/(constriction area) → also speech effort
- Higher COG correlates with perceived sentence accent

**Findings:**
- All vowels: lower COG in spontaneous (reduced effort)
- Sonorants and fricatives: lower COG in spontaneous
- **Plosives:** Erratic - /t,d,k,g/ COG indistinguishable or higher in spontaneous (not significant)
- Vowel-like /p,b/ show influence of open oral cavity behind sound source

**COG Distribution by Category:**
- Very high: Obstruents (plosives, fricatives)
- For fricatives: COG inversely related to front cavity size
- Quite low: Sonorants (vowels > nasals > vowel-like consonants)
- Vowel-like consonants have lowest COG due to closed articulation damping high frequencies

### 5. Intervocalic Sound Energy Difference

**Definition (Figure 5):**
$$
V_{max} = \frac{V_{1,max} + V_{2,max}}{2}
$$

- For plosives and fricatives: $\Delta E = V_{max} - C_{max}$
- For nasals and vowel-like: $\Delta E = V_{max} - C_{min}$

**Findings:**
- All consonants except nasals: **smaller** intervocalic energy difference in spontaneous speech
- Effect size: ~1 dB (small)
- **Interpretation:** Vowel energy reduction largely matched by consonant energy reduction
- Nasals "weaken" more than neighboring vowels; other consonants weaken less

## Parameters

| Parameter | Symbol | Units | Notes |
|-----------|--------|-------|-------|
| First formant | F1 | Hz | Vowel height correlate |
| Second formant | F2 | Hz | Vowel frontness correlate |
| F2 slope difference | ΔF2 slope | kHz (normalized) | Coarticulation measure |
| Duration | | ms | Absolute segment duration |
| Center of Gravity | COG | kHz | Mean spectral frequency |
| Energy difference | ΔE | dB | V-C intensity contrast |

## Measurement Methods

### Phoneme Boundary Placement
- Waveform display with audio feedback (Praat)
- Synchronized displays of:
  - High (>3 kHz) vs low (<750 Hz) energy
  - Mid (750-3000 Hz) vs high+low energy
- Boundaries at zero-crossings corresponding to visible spectral balance changes
- LPC formant tracks via Split-Levinson algorithm (10 kHz downsampled, 5-pole)

### F2 Slope Calculation
- Formant tracks normalized to duration = 1
- 4th-order polynomial fit to F2 track
- Slope extracted from polynomial coefficients at boundaries

## Figures of Interest

- **Fig 1 (p.2):** Dutch vowel space F1/F2 showing centralization in spontaneous speech
- **Fig 2 (p.2):** F2 slope differences by consonant - shows decreased coarticulation
- **Fig 3 (p.3):** Duration reduction - vowels and consonants shorten equally
- **Fig 4 (p.3):** COG reduction by phoneme category (log scale, kHz)
- **Fig 5 (p.4):** Definition of intervocalic energy difference measurement
- **Fig 6 (p.4):** Energy difference changes by consonant type

## Implementation Relevance for Qlatt

### Direct Applications

1. **Prosody/Speaking Rate Modeling:**
   - When implementing faster/casual speech, reduce BOTH vowel AND consonant durations proportionally
   - Maintain consonant/VCV duration ratio across speaking rates

2. **Effort/Stress Modeling via COG:**
   - COG correlates with perceived stress
   - Lower COG = reduced effort = unstressed/casual
   - Could modulate spectral tilt parameter based on stress

3. **Coarticulation Strength:**
   - Informal speech → reduced F2 transitions at consonant boundaries
   - Could reduce formant transition extent for casual speech

4. **Energy Relationships:**
   - V-C energy difference relatively stable (~1 dB variation)
   - When reducing vowel amplitudes for unstressed syllables, reduce consonant amplitudes similarly

### Consonant-Specific Notes

- **Plosives:** COG behavior differs from other consonants - may not reduce spectrally
- **Nasals:** Weaken more than vowels in casual speech
- **Vowel-like (w,l,j,r):** Duration may NOT reduce - special case

## Limitations

- Single speaker (experienced newscaster)
- Dutch language only (though reduction considered universal)
- Ignores complete deletion (the ultimate reduction)
- Individual phoneme statistics often not significant
- COG measure conflates multiple acoustic sources

## Open Questions

- [ ] How do these findings transfer to English consonants?
- [ ] What is the relationship between COG and Klatt's TL (spectral tilt) parameter?
- [ ] How should plosive burst spectra be handled differently from fricatives?
- [ ] What threshold determines "complete deletion" vs severe reduction?

## Related Work Worth Reading

- [14] Van Bergem (1995) - Acoustic and lexical vowel reduction (PhD thesis)
- [12,13] Sluijter (1995) - Phonetic correlates of stress and accent
- [7] Koopmans-Van Beinum (1992) - Focus words in natural vs synthetic speech
- [4] Duez (1995) - Spontaneous French speech, voiced stop reduction
- [5] Farnetani (1995) - Consonant reduction in conversational Italian
