# Acoustic Characteristics of English Fricatives

**Authors:** Allard Jongman, Ratree Wayland, Serena Wong
**Year:** 2000
**Venue:** Journal of the Acoustical Society of America, Vol. 108(3), pp. 1252-1263
**DOI:** S0001-4966(00)02909-X

## One-Sentence Summary

Comprehensive acoustic analysis identifying spectral peak location, spectral moments, and amplitude measures as robust cues distinguishing all four English fricative places of articulation.

## Problem Addressed

Prior to this study, no single acoustic metric reliably classified all four fricative places of articulation (labiodental, dental, alveolar, palato-alveolar). Previous work distinguished sibilants from nonsibilants, and /s/ from /ʃ/, but not /f,v/ from /θ,ð/.

## Key Contributions

1. Spectral peak location distinguishes ALL four places (contrary to prior reports)
2. Spectral moments (especially variance and skewness) distinguish all four places
3. Both normalized and relative amplitude distinguish all four places
4. Comprehensive parameter set enabling 77% classification accuracy

## Methodology

- 20 speakers (10F, 10M), native American English
- 8 fricatives /f,v,θ,ð,s,z,ʃ,ʒ/ in CVC syllables
- 6 vowel contexts /i,e,æ,ɑ,o,u/
- 3 repetitions = 144 tokens/subject
- Carrier phrase: "Say ___ again"
- 22 kHz sampling, 16-bit

## Key Findings

### Spectral Peak Location

| Place | Mean Peak (Hz) |
|-------|----------------|
| /f,v/ (labiodental) | 7733 |
| /θ,ð/ (dental) | 7470 |
| /s,z/ (alveolar) | 6839 |
| /ʃ,ʒ/ (palato-alveolar) | 3820 |

- Peak decreases as articulation moves further back
- All four places significantly different (p<0.003 for labiodental vs dental, p<0.0001 for others)
- Females higher than males (~700 Hz difference)
- 40-ms Hamming window at fricative midpoint

### Spectral Moments

| Place | M1 Mean (Hz) | M2 Variance (MHz) | M3 Skewness | M4 Kurtosis |
|-------|--------------|-------------------|-------------|-------------|
| /f,v/ | 5108 | 6.37 | 0.077 | 2.11 |
| /θ,ð/ | 5137 | 6.19 | -0.083 | 1.27 |
| /s,z/ | 6133 | 2.92 | -0.229 | 2.36 |
| /ʃ,ʒ/ | 4229 | 3.38 | 0.693 | 0.42 |

**Interpretation:**
- **M1 (mean):** Highest for /s,z/, lowest for /ʃ,ʒ/
- **M2 (variance):** Low for sibilants (well-defined peaks), high for nonsibilants (flat spectrum)
- **M3 (skewness):** Positive = energy in lower frequencies; /ʃ,ʒ/ most positive
- **M4 (kurtosis):** Positive = peaked spectrum; /s,z/ highest (clearest peaks)

**Best window locations:** Onset (window 1) and fricative-vowel transition (window 4)

### Amplitude Measures

**Normalized Amplitude** (fricative RMS - vowel RMS):

| Place | Normalized Amplitude (dB) |
|-------|---------------------------|
| /f,v/ | -17 |
| /θ,ð/ | -18 |
| /s,z/ | -10 |
| /ʃ,ʒ/ | -9 |

- Sibilants 10-15 dB louder than nonsibilants
- All four places significantly different

**Relative Amplitude** (fricative - vowel at specific frequency region):

| Fricative | Relative Amplitude (dB) |
|-----------|-------------------------|
| /f/ | -12.5 |
| /v/ | -16.6 |
| /θ/ | -7.9 |
| /ð/ | -12.5 |
| /s/ | -16.6 |
| /z/ | -16.3 |
| /ʃ/ | -1.8 |
| /ʒ/ | 0.002 |

- Measured at F3 region for sibilants, F5 region for nonsibilants
- All four places significantly different

### Duration

| Fricative | Duration (ms) | Normalized Duration |
|-----------|---------------|---------------------|
| /f/ | 166 | 0.420 |
| /v/ | 80 | 0.245 |
| /θ/ | 163 | 0.415 |
| /ð/ | 88 | 0.264 |
| /s/ | 178 | 0.438 |
| /z/ | 118 | 0.326 |
| /ʃ/ | 178 | 0.448 |
| /ʒ/ | 123 | 0.338 |

- Duration does NOT distinguish /f,v/ from /θ,ð/
- Voiceless substantially longer than voiced
- Sibilants longer than nonsibilants

### F2 Onset and Locus Equations

- F2 onset increases as place moves back: /f,v/ < /θ,ð/ ≈ /s,z/ < /ʃ,ʒ/
- Locus equations: Only /f,v/ has distinct slope (0.77 vs ~0.5 for others)
- **NOT reliable for distinguishing all four places**

## Parameters for Implementation

| Parameter | Symbol | Value | Context |
|-----------|--------|-------|---------|
| Spectral peak /f,v/ | - | 7733 Hz | Labiodental |
| Spectral peak /θ,ð/ | - | 7470 Hz | Dental |
| Spectral peak /s,z/ | - | 6839 Hz | Alveolar |
| Spectral peak /ʃ,ʒ/ | - | 3820 Hz | Palato-alveolar |
| Normalized amp /f,v/ | - | -17 dB | Relative to vowel |
| Normalized amp /θ,ð/ | - | -18 dB | Relative to vowel |
| Normalized amp /s,z/ | - | -10 dB | Relative to vowel |
| Normalized amp /ʃ,ʒ/ | - | -9 dB | Relative to vowel |
| Duration voiceless | - | 163-178 ms | Isolated CVC |
| Duration voiced | - | 80-123 ms | Isolated CVC |
| Analysis window | - | 40 ms | Hamming, pre-emphasis 98% |
| LPC poles | - | 24 | For spectral analysis |

## Discriminant Analysis Results

Overall classification: **77%**
- /f,v/: 68%
- /θ,ð/: 64%
- /s,z/: 85%
- /ʃ,ʒ/: 91%

**Best predictors:** Spectral peak location, normalized amplitude, relative amplitude
- These three alone yield 67% classification

## Key Equations

### Spectral Moments (Forrest et al. 1988)

Given FFT spectrum treated as probability distribution $P(f)$:

$$M_1 = \sum_f f \cdot P(f)$$
(Mean frequency)

$$M_2 = \sum_f (f - M_1)^2 \cdot P(f)$$
(Variance)

$$M_3 = \frac{\sum_f (f - M_1)^3 \cdot P(f)}{M_2^{3/2}}$$
(Skewness)

$$M_4 = \frac{\sum_f (f - M_1)^4 \cdot P(f)}{M_2^2} - 3$$
(Kurtosis)

### Relative Amplitude

$$A_{rel} = A_{fric}(F_n) - A_{vowel}(F_n)$$

Where $F_n$ = F3 for sibilants, F5 for nonsibilants

### Locus Equations

$$F2_{onset} = k \cdot F2_{mid} + c$$

| Place | k (slope) | c (Hz) |
|-------|-----------|--------|
| /f,v/ | 0.768 | 356 |
| /θ,ð/ | 0.530 | 879 |
| /s,z/ | 0.517 | 914 |
| /ʃ,ʒ/ | 0.505 | 1065 |

## Implementation Details

### Spectral Analysis Procedure
1. Place 40-ms Hamming window at fricative midpoint
2. Apply 98% pre-emphasis
3. Compute FFT
4. Find highest-amplitude peak = spectral peak location
5. Treat FFT as probability distribution for moments

### Window Locations for Moments
- Window 1: First 40 ms of fricative (onset)
- Window 2: Middle 40 ms
- Window 3: Final 40 ms (offset)
- Window 4: Last 20 ms fricative + first 20 ms vowel (transition)

### Segmentation Criteria
- **Onset:** High-frequency energy appears on spectrogram AND/OR zero crossings increase rapidly
- **Offset (voiceless):** Intensity minimum before vowel periodicity
- **Offset (voiced):** First pitch period showing waveform change from frication; use preceding zero crossing

## Figures of Interest

- **Fig 1 (p.1256):** Spectral peak by place and voicing - shows clear separation
- **Fig 2 (p.1256):** Spectral peak by gender - females show dental > labiodental
- **Figs 3-6 (p.1257-1258):** Moments across window locations
- **Fig 7 (p.1259):** Relative amplitude by place and voicing

## Voicing Effects

- Voiceless fricatives: higher spectral peaks (+302 Hz), longer duration
- Voiced fricatives: greater variance (flatter spectrum)
- Voicing difference in amplitude larger for nonsibilants

## Vowel Context Effects

- Spectral peak of /s,z/ lower before /o,u/ (back-rounded vowels)
- F2 onset varies with vowel height and backness
- Minimal effect on amplitude measures

## Limitations

- Classification accuracy for nonsibilants (66%) much lower than sibilants (88%)
- F2 transition properties and duration insufficient for full classification
- No perceptual validation of acoustic findings

## Relevance to Qlatt Project

**Direct applicability for fricative synthesis:**

1. **Frication source frequency:** Use spectral peak values as center frequency for noise source
   - /f,v/: ~7.7 kHz
   - /θ,ð/: ~7.5 kHz
   - /s,z/: ~6.8 kHz
   - /ʃ,ʒ/: ~3.8 kHz

2. **Amplitude targets:** Normalized amplitude values for AF parameter
   - Sibilants ~10 dB below vowel
   - Nonsibilants ~17-18 dB below vowel

3. **Duration rules:**
   - Voiceless: 163-178 ms
   - Voiced: 80-123 ms
   - Sibilants slightly longer than nonsibilants

4. **Spectral shape:** Use moments to inform spectral tilt
   - /ʃ,ʒ/: Positive skewness (energy concentrated low)
   - /s,z/: Negative skewness (energy concentrated high)
   - Nonsibilants: High variance (flat spectrum)

## Open Questions

- [ ] How do these values translate to Klatt synthesizer parameters?
- [ ] What bandwidth should accompany each spectral peak?
- [ ] How to implement relative amplitude in formant region?

## Related Work Worth Reading

- Behrens & Blumstein (1988a,b) - Fricative amplitude perception
- Forrest et al. (1988) - Original spectral moments method
- Stevens (1998) - Acoustic Phonetics (comprehensive reference)
- Hedrick & Ohde (1993) - Relative amplitude perception
- Shadle (1990) - Articulatory-acoustic fricative relationships
