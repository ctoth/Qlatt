# Some Acoustic Features of Nasal and Nasalized Vowels: A Target for Vowel Nasalization

**Authors:** Gang Feng and Eric Castelli
**Year:** 1996
**Venue:** Journal of the Acoustical Society of America, Vol. 99, No. 6
**DOI:** 10.1121/1.414866

## One-Sentence Summary
Proposes the pharyngonasal tract (velar nasal [ŋ]-like configuration) as a stable acoustic "target" for vowel nasalization, characterized by two resonances at ~300 Hz and ~1000 Hz, enabling systematic modeling of pole-zero evolution during nasalization.

## Problem Addressed
Traditional nasal vowel simulations using transmission line models produce too many poles/zeros that vary with coupling degree, making it difficult to extract reliable acoustic cues for nasality or produce high-quality synthetic nasal sounds.

## Key Contributions
1. **Nasal Target Concept**: The pharyngonasal tract (velum completely lowered, oral cavity disconnected) serves as a stable endpoint for nasalization
2. **Two Characteristic Frequencies**: Target characterized by resonances at ~300 Hz (Fn1) and ~1000 Hz (Fn2)
3. **Pole-Zero Evolution Patterns**: Complete classification of how transfer functions evolve from oral vowels to the nasal target
4. **Experimental Validation**: Measured transfer functions confirm the resonator nature of the low-frequency peak

## Methodology
- Lossy transmission line vocal tract model for simulations
- External sweep-tone measurements of pharyngonasal transfer functions (9 subjects)
- Helmholtz resonator model with wall vibration correction for low-frequency peak

## Key Equations

### Helmholtz Resonance with Wall Vibration Correction
$$
F_0 = \sqrt{F_{Helm}^2 + F_{wall}^2}
$$
Where:
- $F_0$ = observed resonance frequency (Hz)
- $F_{Helm}$ = hard-wall Helmholtz resonance frequency (Hz)
- $F_{wall}$ = wall vibration frequency (150-220 Hz, typically)

### Helmholtz Resonator Frequency
$$
F_{Helm} = \frac{c}{2\pi} \sqrt{\frac{S}{V \cdot L_{eff}}}
$$
Where:
- $c$ = speed of sound (cm/s)
- $S$ = neck area (cm²)
- $V$ = resonator volume (cm³)
- $L_{eff}$ = effective neck length (cm)

## Parameters

| Name | Symbol | Units | Default | Range | Notes |
|------|--------|-------|---------|-------|-------|
| First nasal peak | Fn1 | Hz | 250-300 | 200-300 | Pharyngonasal tract |
| Second nasal peak | Fn2 | Hz | ~1000 | 900-1100 | Pharyngonasal tract |
| Wall vibration freq | F_wall | Hz | 200 | 150-220 | Yielding wall effect |
| Nostril output area | - | cm² | 0.6 | 0.6-1.0 | At limen nasi |
| Nasal tract length | - | cm | 11 | - | From velum to nostrils |
| Neck length (Helmholtz) | L_eff | cm | 3 | 2.7-3 | Effective acoustic length |
| Sinus volume (maxillary) | - | cm³ | 18 | <20 | When included in model |
| Sinus resonance | - | Hz | ~650 | - | Maxillary sinus |

### Measured Pharyngonasal Peak Frequencies (Simple Pattern)

| Peak | Frequency Range (Hz) | Notes |
|------|---------------------|-------|
| Fn1 | 250-300 | First pharyngonasal resonance |
| Fn3 | 650-700 | Possibly sinus-related |
| Fn5 | 900-1100 | Second pharyngonasal resonance |
| Fn8 | 1900-2200 | Higher resonance |
| Fn9 | 2800-3300 | Higher resonance |
| Fn10 | ~4000 | Higher resonance |

### Measured Pharyngonasal Peak Frequencies (Complex Pattern)

| Peak | Frequency Range (Hz) | Notes |
|------|---------------------|-------|
| Fn1 | 250-300 | First pharyngonasal resonance |
| Fn2 | 400-450 | Possibly sinus coupling |
| Fn3 | 650-700 | - |
| Fn4 | 850-900 | - |
| Fn5 | 1200-1300 | - |
| Fn6-7 | 1500-1700 | Nasal tract asymmetry |
| Fn8 | 1800-2200 | - |
| Fn9 | 2800-3300 | - |
| Fn10 | ~4000 | - |

## Implementation Details

### Nasal Target for Synthesis
The nasal target (pharyngonasal configuration) can be modeled as a **single tube** with two characteristic resonances:
- **Fn1 ≈ 300 Hz**: Fundamental resonance of pharynx cavity tuned by nasal cavities (acts as resonator neck)
- **Fn2 ≈ 1000 Hz**: Close to first nasal resonance

### Coupling Coefficient Method
For simulating nasalization degree, use area ratios at coupling point:
```
Area ratios: 0.0, 0.025, 0.05, 0.1, 0.3, 0.7, 0.9, 0.95, 0.975, 1.0
```
- 0.0 = oral vowel (no nasal coupling)
- 1.0 = pharyngonasal configuration (complete nasal coupling)
- Sum of nasal input area + oral input area = constant

### Pole-Zero Evolution Categories (7 valid patterns)
For a coupled system with two branches (oral + nasal), the pole-zero evolution depends on where each branch's antiresonance falls relative to the other's poles. See Fig. 8 patterns (b)-(h).

**General rule**: The system zero always evolves between Z1 and Z2, weakens and disappears at extremes by joining a system pole.

### Nasalization Strategies by Vowel Category

**Category 1: High/Front vowels [i, y, e, ø, ɛ, œ]**
- F1 becomes low pole (~300 Hz)
- F2 disappears (joins zero)
- Acquires high pole at ~1000 Hz
- Pattern similar to Fig. 8(h)

**Category 2: Mid vowels [u, o]**
- F1 lowering and/or F2 elevation
- Pole-zero pair moves between F1 and F2
- Pattern similar to Fig. 8(e)
- Wide validation domain for nasality

**Category 3: Low/Back vowels [a, ɑ, ɔ]**
- F1 disappears
- F2 shifts downward → becomes high nasal pole
- Acquires low pole at ~300 Hz
- Pattern similar to Fig. 8(d)
- Requires greater velopharyngeal opening to be perceived as nasal

### Key Implementation Insight
The **topology of acquired poles** is the most useful technique for categorizing nasal vowels:
- If F1 disappears → vowel acquires low pole
- If F2 disappears → vowel acquires high pole

### Nasal Vowel Plateau Ranges (Measured French)
| Vowel | Plateau Range (Hz) | Notes |
|-------|-------------------|-------|
| [ɔ̃] | 250-700 | Narrowest |
| [ã] | 250-950 | Intermediate |
| [ɛ̃] | 250-1200 | Widest |

Lower limit is always the pharyngonasal first peak (~250 Hz).

### Area Function for Nasal Tract (Fig. 1)
- First 3 sections (velic region): variable, depend on vowel and coupling degree
- Nostril output area: 0.6 cm²
- Total length: ~11 cm
- Typical sections given in cm² from velum to nostrils (see paper Fig. 1)

## Figures of Interest
- **Fig. 1 (p. 3696)**: Nasal tract area function used in simulations
- **Fig. 2 (p. 3696)**: Pharyngonasal resonances in F1-F2 plane for 11 French vowels - shows small target region around 300-1000 Hz
- **Fig. 4 (p. 3697)**: Two principal patterns (simple/complex) for measured pharyngonasal transfer functions
- **Fig. 5 (p. 3698)**: Fn1 variation with nostril diameter - confirms wall vibration model
- **Fig. 8 (p. 3700)**: All 7 valid pole-zero evolution patterns for coupling
- **Fig. 9 (p. 3701)**: Simulated nasalization of [i], [u], [ɑ] - key reference for implementation
- **Fig. 10 (p. 3702)**: Simulated nasalization of French nasal vowel [ã]
- **Fig. 11 (p. 3702)**: Same as Fig. 9 but with 18 cm³ sinus included
- **Fig. 12 (p. 3703)**: Measured French nasal vowel transfer functions [ã, ɛ̃, ɔ̃]

## Results Summary
- Pharyngonasal target occupies small region in F1-F2 plane around 300-1000 Hz
- No French oral vowels occupy this region
- Measured transfer functions show 4-10 peaks between 200-5000 Hz
- Two groups of subjects: "simple" (4-6 peaks) and "complex" (8-10 peaks) patterns
- Fn1 limited to minimum ~200 Hz due to wall vibration
- Only Fn1 and Fn5 noticeably decrease with nostril area (confirms resonator hypothesis)
- Peak locations stable within subject (SD < 3% for most peaks)

## Limitations
- Nasal tract asymmetry ignored in basic model
- Sinus cavities omitted from main simulations (adds complexity without changing basic patterns)
- Helmholtz model may be oversimplified for complex nasal cavity geometry
- Measured pharyngonasal volumes (~70-120 cm³) insufficient to explain 250 Hz resonance via simple Helmholtz formula
- Possible oral-nasal coupling through closed velum not fully explored

## Relevance to Project

### For Klatt Synthesis
1. **Nasal Formant Targets**: Use Fn1 ≈ 300 Hz, Fn2 ≈ 1000 Hz as targets for FNP, FNZ parameters during nasal sounds
2. **Pole-Zero Placement**: The coupling zero should fall between these poles during nasalization
3. **Bandwidth Effects**: Wall vibration limits Fn1 minimum to ~200 Hz
4. **Coupling Transitions**: Model nasalization as trajectory from oral formants toward these fixed targets

### Specific Parameter Suggestions for Klatt
- FNP (nasal pole) should trend toward 300 Hz for nasalization
- FNZ (nasal zero) should be placed to create appropriate pole-zero pair
- For low vowels: additional low pole appears below F1
- For high vowels: F2 effectively disappears (canceled by zero)

### Synthesis Quality Insight
The paper explains why traditional nasal synthesis sounds poor: modeling just adds coupling without understanding the target structure. A perceptually better approach is to interpolate toward the pharyngonasal target rather than just adding nasal poles/zeros.

## Open Questions
- [ ] How to map Klatt's FNP/FNZ to this pole-zero evolution framework?
- [ ] Should nasal coupling be modeled as trajectory toward target or instantaneous?
- [ ] How do sinus effects map to Klatt's additional nasal parameters?
- [ ] What are appropriate transition durations for velum lowering?

## Related Work Worth Reading
- House & Stevens (1956) - First nasal simulation study
- Fant (1960) - Acoustic Theory of Speech Production (nasal consonant area functions)
- Fujimura & Lindqvist (1971) - Sweep-tone measurements of vocal tract (reference data used)
- Hawkins & Stevens (1985) - Perceptual correlates of nasality
- Maeda (1982a, 1982b, 1984, 1993) - Sinus role in nasality, spectral correlates
- Stevens et al. (1987) - Pole-zero-pole combination for F1 in nasalization
