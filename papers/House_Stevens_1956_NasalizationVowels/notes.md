# Analog Studies Of The Nasalization Of Vowels

**Authors:** Arthur S. House, Kenneth N. Stevens
**Year:** 1956
**Venue:** Journal of Speech and Hearing Disorders, Vol. 21, No. 2, pp. 218-232
**DOI/URL:** N/A (presented at 1955 ASHA Convention in Los Angeles)

## One-Sentence Summary

Quantifies the acoustic effects of nasal coupling on vowel spectra using electrical analogs, establishing that F1 amplitude reduction (~8 dB), F1 bandwidth increase, and F1 frequency shift are primary perceptual cues for nasality.

## Problem Addressed

The acoustic correlates of vowel nasalization were unclear - literature agreed "extra resonances" appear but disagreed on their location and the overall effect on speech signal level. This study uses electrical analogs of the vocal and nasal tracts to systematically measure spectral changes with controlled nasal coupling.

## Key Contributions

1. First systematic electrical analog study of nasal-oral coupling effects on vowel spectra
2. Quantified F1 amplitude reduction as primary acoustic cue (~8 dB at 50% nasality perception)
3. Demonstrated vowel-dependent sensitivity to nasalization (high vowels /i, u/ nasalize more readily than low vowels /ɑ, ɔ/)
4. Established nasal coupling area values corresponding to perceptual nasality thresholds
5. Showed overall output level decreases with nasalization (5-9.5 dB reduction)

## Methodology

### Electrical Analogs
- **Vocal Tract Analog (VTA):** 35 cascaded LC sections (0.5 cm each), ~17 cm total length, variable cross-sectional area via adjustable inductance/capacitance
- **Nasal Tract Analog:** 12 cm length, based on anatomical measurements from skulls and X-rays
- **Coupling:** Nasal analog coupled to VTA at 8 cm from glottis (velum position)
- **Excitation:** Periodic sawtooth voltage source (12 dB/octave rolloff) simulating glottal source

### Coupling Areas Tested
Five degrees of velopharyngeal opening (average cross-sectional area in cm²):
- 0 (closed)
- 0.25
- 0.71
- 1.68
- 3.72

### Vowels Tested
Six standard vowel configurations: /i/, /ɛ/, /æ/, /ɑ/, /ɔ/, /u/

## Key Equations

### Vocal Tract Shape (Parabolic Model)
$$
r - r_o = 0.025 (1.2 - r_o) x^2
$$

Where:
- $r$ = effective radius at distance $x$ from constriction point (cm)
- $r_o$ = radius at point of greatest constriction (cm)
- $x$ = horizontal distance from constriction point (cm)

For /i/ vowel: $d_o = 12.0$ cm, $r_o = 0.4$ cm, $A/\ell = 5.0$ cm (unrounded front vowel)

## Parameters

| Name | Symbol | Units | Default | Range | Notes |
|------|--------|-------|---------|-------|-------|
| Vocal tract length | L | cm | 17 | 14.5-17 | Male average |
| VTA sections | N | - | 35 | - | 0.5 cm each |
| Nasal tract length | - | cm | 12 | - | From coupling point |
| Coupling area | $A_m$ | cm² | 0-3.72 | 0-3.72 | Velopharyngeal opening |
| Glottal source slope | - | dB/oct | -12 | - | Sawtooth approximation |
| Nasal formant BW | - | Hz | 200-500 | - | Much wider than oral |

### Nasal Tract Dimensions (Figure 2)
| Distance from coupling (cm) | Cross-section area (cm²) |
|----------------------------|-------------------------|
| 0 | 3.7 (max coupling) |
| 4 | 5.9 |
| 8 | 2.6 |
| 12 | 1.1 (nostril) |

## Implementation Details

### Spectral Effects of Nasalization

**Primary Effects (F1 region):**
1. F1 amplitude reduction: 5-12 dB depending on vowel and coupling
2. F1 bandwidth increase: from ~150 cps (oral) to ~200-500 cps (nasal)
3. F1 frequency shift: generally upward for most vowels

**Secondary Effects:**
1. Anti-resonance introduction: 700-1800 Hz range
2. F3 amplitude reduction or elimination
3. Additional spectral peaks near 1000 Hz and above F1
4. Double peak may appear in F3 region with reduced nasal tract damping

### Vowel-Dependent Nasalization Sensitivity

From perceptual data (Figure 11), coupling area needed for 50% "nasal" response:
- /i/: ~0.7 cm² (most sensitive)
- /u/: ~0.9 cm²
- /ɛ/: ~1.5 cm²
- /ɔ/: ~2.2 cm²
- /ɑ/: ~2.8 cm² (least sensitive)

**Rule:** High vowels nasalize more readily than low vowels.

### Overall Level Changes (Table 1)

| Vowel | Coupling 0 | 0.25 | 0.71 | 1.68 | 3.72 |
|-------|-----------|------|------|------|------|
| /i/ | 0.0 dB | +1.5 | -3.0 | -4.5 | -5.0 |
| /ɛ/ | +7.5 | +6.0 | +2.0 | 0.0 | -1.0 |
| /æ/ | +10.0 | +9.0 | +5.5 | +2.5 | +1.5 |
| /ɑ/ | +8.0 | +8.5 | +7.0 | +5.0 | +3.0 |
| /ɔ/ | +10.0 | +9.0 | +7.0 | +2.5 | +0.5 |
| /u/ | +2.0 | +3.0 | -1.0 | -3.5 | -5.0 |

(Referenced to /i/ with no coupling = 0 dB)

### F1 Amplitude vs. Coupling (Figure 10)

Relative F1 amplitude drops approximately:
- 5 dB at 1 cm² coupling
- 8 dB at 2 cm² coupling
- 10 dB at 3 cm² coupling
- 12-13 dB at 4 cm² coupling

This is relatively vowel-independent.

## Figures of Interest

- **Fig 1 (p. 219):** Idealized vocal tract schematization showing coupling point
- **Fig 2 (p. 220):** Nasal tract dimensions as cylindrical sections
- **Fig 3 (p. 222):** Driving-point impedance of nasal tract and internal impedance of VTA
- **Fig 4-9 (pp. 223-224):** Spectrum envelopes for /i/, /ɛ/, /æ/, /ɑ/, /ɔ/, /u/ with varying coupling
- **Fig 10 (p. 226):** F1 amplitude vs. coupling area (key implementation curve)
- **Fig 11 (p. 228):** Perceptual nasality threshold vs. coupling area per vowel
- **Fig 12 (p. 228):** F1 reduction required for nasality perception by vowel

## Results Summary

### Physical Measurements
1. Nasal coupling primarily affects F1 region of vowel spectrum
2. F1 amplitude reduction is the dominant acoustic change
3. Overall vowel output level decreases with nasalization
4. High-impedance vowels (/i/, /u/) show greater spectral modification than low-impedance vowels (/ɑ/)

### Perceptual Results
1. ~8 dB F1 reduction needed for 50% nasality perception (vowel-independent)
2. High vowels /i, u/ perceived as nasal with less coupling than low vowels
3. Listeners can reliably discriminate nasal from non-nasal with analog stimuli
4. /æ/ behaves anomalously - sounds nasal even without coupling (wider bandwidths)

## Limitations

1. Analog dimensions are approximations - individual nasal tract variation is large
2. Nasal tract damping values are estimated, not directly measured
3. Coupling point fixed at 8 cm - real velum position varies
4. No dynamic transitions studied (steady-state vowels only)
5. Single "average male" dimensions used

## Relevance to Project

### For Klatt Synthesizer Implementation

1. **Nasal formant parameters:**
   - FNZ (nasal zero/anti-resonance): 700-1800 Hz range
   - FNP (nasal pole): additional resonance near 1000 Hz
   - BNZ/BNP: wider bandwidths than oral formants (200-500 Hz)

2. **F1 modification for nasalized vowels:**
   - Reduce A1 by 5-10 dB
   - Increase B1 bandwidth by 1.5-3x
   - Consider small F1 frequency shift

3. **Vowel-dependent nasalization:**
   - /i, u/: easier to nasalize (smaller parameter changes needed)
   - /ɑ, ɔ/: harder to nasalize (larger changes needed)

4. **Overall amplitude:** Reduce AV slightly for nasalized vowels

### Key Implementation Rule
**For perceived nasality, reduce F1 amplitude by ~8 dB.** This is more important than adding extra nasal formants.

## Open Questions

- [ ] Exact frequency of nasal zero for different vowels
- [ ] Dynamic behavior during VN/NV transitions
- [ ] Interaction with voice quality (breathy, creaky)
- [ ] Effect of nasal tract length variation

## Related Work Worth Reading

- Stevens, Kasowski, & Fant (1953) - Electrical analog of vocal tract (ref 25)
- Fant (1952) - Transmission properties of vocal tract (ref 11)
- Chiba & Kajiyama (1941) - The Vowel, Its Nature and Structure (ref 3)
- House & Stevens (1955) - Quantitative description of vowel articulation (ref 24)
- Dunn (1950) - Vowel resonances and electrical vocal tract (ref 9)

## Quotes Worth Preserving

> "The results of the physical measurements with the analog devices strongly suggest that the first-formant effects may be primary cues for nasality." (p. 225)

> "At the 50 per cent level, the required reduction is approximately eight db, and is relatively independent of the vowel." (p. 228)

> "On the basis of the physical and perceptual studies reported, it seems reasonable to conclude that the act of coupling the nasal cavity to the vocal tract during vowel production results in: (1) a differential reduction in the amplitude of the first formant of various vowels, with a concomitant increase in formant bandwidth and an upward shift in the center frequency of the formant; (2) a reduction in the overall level of the vowel" (p. 230)
