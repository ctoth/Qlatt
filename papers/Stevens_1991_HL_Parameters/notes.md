# Constraints among parameters simplify control of Klatt formant synthesizer

**Authors:** Kenneth N. Stevens, Corine A. Bickley
**Year:** 1991
**Venue:** Journal of Phonetics, 19, 161-174
**DOI/URL:** 0095-4470/91/010161

## One-Sentence Summary

This paper proposes a 10-parameter "higher-level" (HL) control system for the Klatt synthesizer that maps articulatory/aerodynamic parameters to the 40+ low-level KL parameters, incorporating physical production constraints automatically.

## Problem Addressed

The Klatt synthesizer (KLSYN88) requires specification of 40+ parameters, with complex interdependencies constrained by articulatory, aerodynamic, and acoustic processes. Users must manually maintain these constraints (e.g., F1 lowering with constriction, pressure buildup, voicing cessation). This makes synthesis tedious and error-prone, and doesn't capture speech production knowledge.

## Key Contributions

- Definition of 10 higher-level (HL) parameters that capture essential articulatory/acoustic aspects
- Framework for mapping HL parameters to KL (Klatt) parameters
- Demonstration that stop consonants and nasals with same place differ only in 2-3 HL parameters
- Application to analysis-by-synthesis (Wu Chinese voicing contrast)
- Explicit aerodynamic calculations for airflow, intraoral pressure, and noise sources

## Methodology

### Approach

Define a quasi-articulatory parameter set (HL) that represents:
1. Vocal tract natural frequencies (acoustic representation of shape)
2. Orifice sizes (glottal, oral constriction, velopharyngeal)
3. Source-related attributes (stridency, pressure manipulation)

Transform HL parameters to KL parameters using physical models of:
- Aerodynamics (flow, pressure)
- Acoustic coupling (nasalization, tracheal coupling)
- Source generation (voicing, aspiration, frication)

### Algorithm

1. Specify HL parameters (f1, f2, f3, f4, f0, ag, ac, an, st, pm)
2. Calculate intermediate aerodynamic variables:
   - Airflow at glottis (Ug) and constriction (Uc)
   - Intraoral pressure (Pm)
3. Derive noise source amplitudes:
   - Aspiration noise (Ng) from glottal airflow
   - Frication noise (Nc) from constriction airflow
4. Determine voicing parameters:
   - Open quotient (OQ) from transglottal pressure and abduction
   - Amplitude of voicing (AV)
5. Adjust formant frequencies:
   - F1 shifts due to glottal opening
   - Pole-zero pairs for nasalization (FNP, FNZ)
6. Set filter parameters for noise shaping

## Key Equations

### Turbulence Noise Source Amplitude

$$
N \propto U^3 A^{-2.5}
$$

Where:
- $N$ = sound-pressure source amplitude of turbulence noise (dB scale: $20 \log(U^3 A^{-2.5})$)
- $U$ = airflow through constriction (L/s or cm^3/s)
- $A$ = cross-sectional area of constriction (cm^2)

### Flow-Pressure Relations

Standard approximations for flow through constrictions (Stevens, 1971):
$$
U = A \sqrt{\frac{2 \Delta P}{\rho}}
$$

Where:
- $U$ = volume velocity (airflow)
- $A$ = constriction area
- $\Delta P$ = pressure drop across constriction
- $\rho$ = air density

### F1 Shift Due to Glottal Opening

When glottal opening $ag > 0.1-0.2$ cm^2, F1 shifts upward relative to f1 (Fant, 1960).

### Nasal Pole-Zero Cancellation

Pole and zero cancel at approximately 500 Hz (natural frequency of closed nasal cavity with complete velopharyngeal closure).

## Parameters

### HL Parameters (Higher-Level)

| Name | Symbol | Units | Default | Range | Notes |
|------|--------|-------|---------|-------|-------|
| Natural freq 1 | f1 | Hz | - | ~180-800 | Vocal tract with VP closed, no tracheal coupling |
| Natural freq 2 | f2 | Hz | - | ~800-2500 | Same conditions |
| Natural freq 3 | f3 | Hz | - | ~2000-3500 | Same conditions |
| Natural freq 4 | f4 | Hz | - | ~3000-4500 | Same conditions |
| Fundamental freq | f0 | Hz | - | ~80-300 | Usually identical to KL parameter F0 |
| Glottal area | ag | cm^2 | 0.03-0.05 | 0-0.4 | Modal voicing ~0.03-0.05; aspiration ~0.3 |
| Constriction area | ac | cm^2 | - | 0-0.4 | Only for consonants; vowels >0.4 cm^2 |
| Velopharyngeal area | an | cm^2 | 0 | 0-1.0 | Nasalization coupling |
| Stridency | st | dB | 0 | -10 to 0 | Obstacle effectiveness; 0=full, -10=minimal |
| Pressure manipulation | pm | fraction of Ps | 0 | -0.5Ps to +0.2Ps | Active vocal tract volume change |

### Key KL Parameters Referenced

| Name | Symbol | Description |
|------|--------|-------------|
| F1, F2, F3, F4 | **F1-F4** | Formant frequencies |
| FNP | **FNP** | Nasal pole frequency |
| FNZ | **FNZ** | Nasal zero frequency |
| AV | **AV** | Amplitude of voicing (dB) |
| AH | **AH** | Aspiration noise amplitude |
| AF | **AF** | Frication noise amplitude |
| OQ | **OQ** | Open quotient (%) |
| B1 | **B1** | First formant bandwidth |
| TL | **TL** | High-frequency spectral tilt |
| A1-A6 | **A1-A6** | Parallel formant gains |

## Implementation Details

### Data Structures Needed

```
HLParameters {
    f1, f2, f3, f4: number  // Natural frequencies (Hz)
    f0: number              // Fundamental frequency (Hz)
    ag: number              // Glottal area (cm^2)
    ac: number              // Constriction area (cm^2)
    an: number              // Velopharyngeal area (cm^2)
    st: number              // Stridency (dB, 0 to -10)
    pm: number              // Pressure manipulation (fraction of Ps)
}

AerodynamicState {
    Ug: number    // Glottal airflow (L/s)
    Uc: number    // Constriction airflow (L/s)
    Pm: number    // Intraoral pressure (cm H2O)
    Ps: number    // Subglottal pressure (cm H2O), typically 8
}
```

### Initialization Procedures

1. Set subglottal pressure Ps (typically 8 cm H2O)
2. Initialize glottal area ag for modal voicing (~0.03-0.05 cm^2)
3. Set velopharyngeal area an = 0 for oral sounds
4. Natural frequencies f1-f4 from vowel targets

### Critical Timing Values

| Event | Duration/Rate |
|-------|---------------|
| F1 movement at consonant release | ~20 ms |
| Constriction area change rate | ~100 cm^2/s |
| Glottal abduction for aspirated stop | peaks at release |
| Glottal return to modal after release | ~60 ms |
| Peak airflow after stop release | ~1200 cm^3/s |

### Edge Cases

- F1 during complete closure: ~180 Hz (alveolar closure + glottal closure)
- F2 at alveolar boundaries: ~1700 Hz
- Nasalization threshold: an < 0.15 cm^2 = minimal acoustic effect (FNP/FNZ close together)
- Voicing threshold: determined by transglottal pressure and ag

### Computational Complexity

- Per-frame: O(1) - fixed number of aerodynamic calculations
- Requires solving flow equations iteratively if pressure/flow are coupled
- Nasal pole-zero calculation requires knowledge of f2, f3, f4

## Figures of Interest

- **Fig 1:** Block diagram of KLSYN88 synthesizer showing glottal source, noise source, pole-zero pairs, transfer function, and parallel filters
- **Fig 2:** HL parameters for /atha/ and /ana/ - shows f1, f2, ac, ag, an trajectories. Critical: same f1, f2, ac for both; only ag (stop) vs an (nasal) differs
- **Fig 3:** Derived KL parameters from HL for /atha/: F1, airflows (Ug, Uc), intraoral pressure (Pm), noise sources (Ng, Nc), OQ, AV. Shows the complex KL timing derived from simple HL parameters
- **Fig 4:** KL parameters for /ana/: F1, F2, FNP, FNZ trajectories showing nasal pole-zero behavior
- **Fig 5:** Analysis-by-synthesis of Wu Chinese /ta/ vs /da/ - spectral comparison showing breathy vs modal voicing

## Results Summary

### Stop Consonant /atha/ Synthesis

- ag increases before implosion, peaks at 0.3 cm^2 at release
- Peak airflow ~1200 cm^3/s immediately after release
- Intraoral pressure builds to ~8 cm H2O during closure
- OQ increases during aspiration interval
- AV decreases during aspiration

### Nasal Consonant /ana/ Synthesis

- Same f1, f2, ac as stop
- ag remains constant (modal voicing maintained)
- an increases to ~0.3 cm^2 during nasal
- FNP and FNZ separate during significant VP opening
- F1 modified by nasalization (lowered for low vowels, raised during consonant)

### Wu Chinese Voice Quality

- /ta/ (voiceless): modal phonation at vowel onset
- /da/ (voiced): breathy phonation at vowel onset
- Difference captured by single HL parameter (ag) instead of 6 KL parameters
- Breathy characteristics: larger H1, increased B1, aspiration noise >1kHz, tracheal pole-zero near F2, reduced high-frequency periodic energy

## Limitations

- Mapping from HL to KL was done by hand, not yet implemented in software
- May need 2-3 additional parameters for:
  - Laterals
  - Retroflexes
  - Consonants with two constrictions
  - More versatile glottal source control
- HL-KL relations may vary by speaker (anatomical differences)
- Does not address all KL parameters (parallel filter gains, bandwidths for frication)

## Relevance to TTS Systems

### For Klatt Synthesizer Implementation

1. **Parameter Reduction**: Instead of specifying 40+ parameters, use 10 HL parameters
2. **Automatic Constraints**: Physical constraints enforced by HL-KL mapping
3. **Timing Automation**: Complex KL timing patterns derived automatically
4. **Analysis-by-Synthesis**: Reduced search space for matching natural speech

### For Formant Synthesis Generally

1. **Stop Consonant Synthesis**: Provides explicit model for:
   - Closure F1 values (~180 Hz for alveolar)
   - Constriction area trajectories (~100 cm^2/s rate)
   - Glottal timing for aspiration
   - Noise source calculations

2. **Nasal Synthesis**: Framework for:
   - FNP/FNZ placement from VP area
   - F1 modification during nasalization
   - Asymmetric nasalization at implosion vs release

3. **Voice Quality**: Model for breathy vs modal voicing using glottal area

### For Rule-Based TTS

1. **Phonetic Categories Map Naturally**: Place (f1-f4), manner (ac, an), voicing (ag)
2. **Coarticulation**: Continuous variation of HL parameters
3. **Speaking Rate**: Adjust trajectory rates rather than timing details

## Open Questions

- [ ] Exact formula for F1 shift as function of glottal opening (references Fant 1960)
- [ ] How to calculate FNP/FNZ from an, f2, f3, f4 (references Fujimura 1962)
- [ ] Detailed model for OQ and AV from transglottal pressure and ag
- [ ] How pm (pressure manipulation) affects voiced obstruent timing
- [ ] Stridency parameter st: how to determine for different consonants
- [ ] Wall compliance effects on flow calculations

## Related Work Worth Reading

- Fant, G. (1960) Acoustic theory of speech production - foundational acoustic theory
- Fant, G., Liljencrants, J. & Lin, Q. (1985) A four-parameter model of glottal flow - LF model
- Fujimura, O. (1962) Analysis of nasal consonants - nasal pole-zero calculations
- Klatt, D. H. (1980) Software for cascade/parallel formant synthesizer - original Klatt paper
- Klatt, D. H. & Klatt, L. C. (1990) Analysis, synthesis, and perception of voice quality - KLSYN88
- Stevens, K. N. (1971) Airflow and turbulence noise for fricative and stop consonants - aerodynamic noise
- Bickley, C. A. & Stevens, K. N. (1986) Effects of vocal-tract constriction on glottal source - source-tract interaction
- Shadle, C. (1985) The acoustics of fricative consonants - frication modeling
