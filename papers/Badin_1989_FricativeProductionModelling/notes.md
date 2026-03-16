---
title: "Fricative Production Modelling: Aerodynamic and Acoustic Data"
authors: "Pierre Badin, Gunnar Fant"
year: 1989
venue: "EUROSPEECH '89, Paris, France, September 27-29, 1989"
doi_url: "10.21437/Eurospeech.1989-174"
---

# Fricative Production Modelling: Aerodynamic and Acoustic Data

## One-Sentence Summary

This paper provides empirical equations relating fricative sound pressure level (SPL) to intra-oral pressure (IOP) and constriction area, plus acoustic transfer function modeling with area functions for [f], [s], and [ʃ].

## Problem Addressed

The aerodynamic and acoustic phenomena in fricative consonant production are not completely understood. Prior work lacked quantitative relationships between aerodynamic parameters (pressure, area) and radiated sound, particularly for dynamic (not just sustained) fricatives.

## Key Contributions

1. Empirical "IOP" and "Area" exponents quantifying how SPL depends on pressure drop and constriction area
2. Evidence that spectral tilt changes with overall SPL (high frequencies increase faster than low)
3. Acoustic transfer function matching with simplified area functions for [ʃ], [s], [f]
4. Explanation of "obstacle effect" in terms of filter characteristics (dental vs constriction source location)

## Methodology

**Aerodynamic experiments:**
- Circumferentially vented pneumotachograph mask measuring oral flow U
- Intra-oral pressure (IOP) Δp via polyethylene tube
- Two series: (1) with mask for flow+IOP+SPL, (2) without mask for IOP+SPL (better acoustic)
- Sustained fricatives: [aʃ], [as], [af] at varied effort levels, ≥500ms
- Dynamic fricatives: [CataC] logatoms, 5ms RMS windows, 80Hz lowpass, 1kHz resampling

**Acoustic modeling:**
- Electric quadrupole representation of vocal tract
- Frequency domain transfer functions
- Trial-and-error area function fitting to match measured spectra

## Key Equations

### Orifice Equation (Constriction Area)

$$
A_c = \frac{U}{\sqrt{2 \cdot \Delta p / \rho}}
$$

Where:
- $A_c$ = constriction cross-sectional area (cm²)
- $U$ = oral airflow (cm³/s)
- $\Delta p$ = intra-oral pressure drop (cmH₂O)
- $\rho$ = air density

### SPL-Pressure-Area Relationship

$$
SP \sim (\Delta p)^p \cdot (A_c)^q
$$

Or in dB form:

$$
SPL = G_0 + p \cdot 20\log(\Delta p) + q \cdot 20\log(A_c)
$$

Where:
- $SP$ = sound pressure (RMS)
- $SPL$ = sound pressure level (dB)
- $G_0$ = constant offset
- $p$ = "IOP exponent"
- $q$ = "Area exponent"

### Recommended Exponent Values

For [ʃ] and [s]:
$$
p = 1.3, \quad q = 0.3
$$

For [f]:
$$
p = 0.8, \quad q = 0.2
$$

## Parameters

| Name | Symbol | Units | Default | Range | Notes |
|------|--------|-------|---------|-------|-------|
| Constriction area [f] | A_c | cm² | - | 0.1-0.4 | Variable strategy |
| Constriction area [s], [ʃ] | A_c | cm² | 0.1 | ~0.1 | IOP-independent |
| IOP exponent [ʃ] sustained | p | - | 1.32 | 1.27-1.34 | From mask/no-mask |
| IOP exponent [s] sustained | p | - | 1.26 | 1.26-1.42 | |
| IOP exponent [f] sustained | p | - | 1.04 | 1.04-1.31 | |
| Area exponent [ʃ] sustained | q | - | 0.11 | - | |
| Area exponent [s] sustained | q | - | 0.28 | - | |
| Area exponent [f] sustained | q | - | 0.97 | - | |
| IOP exponent [ʃ] dynamic | p | - | 1.34 | 0.98-1.66 | |
| IOP exponent [s] dynamic | p | - | 1.43 | 0.81-2.09 | |
| IOP exponent [f] dynamic | p | - | 0.77 | 0.62-1.68 | |
| Area exponent [ʃ] dynamic | q | - | 0.42 | -0.09-0.68 | |
| Area exponent [s] dynamic | q | - | 0.29 | -0.19-0.82 | |
| Area exponent [f] dynamic | q | - | 0.07 | -0.20-0.99 | |
| Glottal area | A_g | cm² | 0.13 | 0.13-0.3 | |
| Subglottal pressure | P_sgl | cmH₂O | 8.0 | 2.4-8.0 | Lower = more coupling |
| Front cavity area | A_FC | cm² | 1-2 | - | |

### [ʃ] Resonances from Measured Spectrum

| Resonance | Frequency (Hz) | Type |
|-----------|----------------|------|
| F1 | 430 | Helmholtz (back cavity + constriction) |
| F2 | 1750 | Back cavity 1st resonance |
| F3 | 2680 | Back cavity 2nd resonance |
| F4 | 3200 | Front cavity λ/4 |
| Z1 | 1440 | Bound zero (back cavity) |
| Z2 | 2270 | Free zero (constriction L + back cavity C) |
| Z3 | 2980 | Bound zero (back cavity) |

## Implementation Details

### SPL Computation from Aerodynamic State

```
Given: Δp (IOP), A_c (constriction area), fricative type
Output: SPL (dB)

if fricative in [ʃ, s]:
    p = 1.3
    q = 0.3
else:  # [f]
    p = 0.8
    q = 0.2

# G_0 determined empirically per fricative class
SPL = G_0 + p * 20 * log10(Δp) + q * 20 * log10(A_c)
```

### Area Function Topology for [ʃ]

1. Back cavity behind constriction
2. Constriction tube (~1 cm length)
3. Front cavity (2 cm length for reference model)
4. Dental obstacle (source location 1.5 cm anterior to constriction outlet)

### Spectral Tilt Change

- High frequencies increase more rapidly with overall SPL than low frequencies
- During fricative onset: high frequencies appear shortly after low frequencies
- During fricative offset: high frequencies disappear before low frequencies
- Suggests source spectrum itself varies with aerodynamic conditions
- [ʃ] shows greatest tilt change; [f] shows smallest/less regular

### Obstacle Effect Explanation

- Dental source (at teeth, 1.5 cm anterior to constriction): transfer function insensitive to A_c variations
- Constriction source (at constriction exit): transfer function level varies proportionally to A_c
- For A_c = 0.125 cm², dental source peak is ~20 dB higher than constriction source
- Effect depends on ratio A_FC/A_c (front cavity area to constriction area)
- Weaker for A_FC=1cm², A_c=0.3cm² than for A_FC=2cm², A_c=0.125cm²

## Figures of Interest

- **Fig.1 (p.4):** "Flow" exponents vs frequency band for [ʃ], [s], [f] and Shadle's obstacle model
- **Fig.2 (p.4):** Spectrogram and spectral sections for [ʃa] showing spectral tilt dynamics
- **Fig.3 (p.4):** Comparison of measured vs calculated SPL for dynamic [ʃ]
- **Fig.4 (p.4):** Measured spectra, simulated transfer functions, and area functions for [ʃ], [s], [f]
- **Fig.5 (p.4):** Effect of constriction area on transfer functions for dental vs constriction sources

## Results Summary

- "Flow" exponents lie between 2 and 3 for [ʃ] and [s], between 1 and 2 for [f]
- Results intermediate between Fant's SPL∝V_c² and Stevens' SPL∝V_c³√A_c
- Maximum departure between measured and calculated SPL is within 5-6 dB
- For [ʃ] and [s], fit with A_c dependency is better than without
- [f] behaves as obstacle configuration despite being labiodental (subject's incisors contact inner lip surface)
- Good spectral fit achieved for [s] and [f] with flat source assumption
- [ʃ] requires -12 dB/oct source rolloff above 2 kHz for overall spectral match
- Subglottal coupling visible in [ʃ] spectrum as extra resonances near 1 and 2.2 kHz

## Limitations

- Single French subject (PB) - more subjects needed for general rules
- Mask distorts radiated sound (required two-series measurement)
- IOP probe through mouth limits access to retracted consonants (suggest nasal insertion)
- [ʃ] area function modeling "might not be representative" - need X-ray + aerodynamic data
- Spectral tilt changes not yet fully characterized across corpus

## Relevance to Project

**For Qlatt fricative synthesis:**
- Provides empirical relationship between AF (frication amplitude), aerodynamic state, and SPL
- Suggests different amplitude scaling for labiodental [f] vs alveolar/postalveolar [s]/[ʃ]
- Spectral tilt variation with amplitude could inform dynamic noise source modeling
- Area functions and resonance data useful for validating parallel branch formant settings
- Obstacle effect explanation supports current dental source location assumption for sibilants

**Implementation priorities:**
1. Consider fricative-class-dependent amplitude exponents (p=1.3 vs p=0.8)
2. May want spectral tilt modulation as function of AF level
3. [ʃ] coupling with back cavity important - current parallel-only model may miss F1-F3 complexity

## Open Questions

- [ ] How does spectral tilt variation map to AF parameter in Klatt model?
- [ ] Should labiodental [f] use different amplitude scaling than sibilants?
- [ ] Does current parallel branch adequately model [ʃ] back-cavity coupling?
- [ ] What is appropriate source spectrum rolloff for [ʃ] in Klatt synthesis?

## Related Work Worth Reading

- Shadle (1985) - "The acoustics of fricative consonants" - PhD thesis, MIT (comprehensive fricative acoustics)
- Stevens (1971) - "Airflow and turbulence noise for fricative and stop consonants: static considerations" - JASA 50, 1180-192 (theoretical foundation)
- Fant (1960) - "Acoustic theory of speech production" - Mouton (foundational source-filter theory)
- Hixon et al. (1967) - "Correlates of turbulent noise production for speech" - J. Speech Hearing Res. 10, 133-140 (original IOP/flow experiments)

---

## Collection Cross-References

### Already in Collection
- [[Fant_1960_AcousticTheorySpeechProduction]]
- [[Fant_1988_LFFrequencyDomainInterpretation]]
- [[Shadle_1985_FricativeAcoustics]]
- [[Stevens_1971_AirflowTurbulenceNoise]]

### Cited By (in Collection)
- [[Carlson_1995_ModelsOfSpeechSynthesis]] — references Badin 1989 in survey of speech synthesis models and fricative generation approaches
- [[Feng_1996_NasalVowelTarget]] — cites Badin & Fant's vocal tract computation methods
- [[Stevens_1991_HL_Parameters]] — cites Badin 1989 in context of articulatory-acoustic parameters for fricatives
- [[Monson_2012_SpeechDirectivityHFE]] — references Badin's aeroacoustic modeling of fricative sources in relation to phoneme-specific directivity patterns

### New Leads (Not Yet in Collection)
- **Badin & Fant (1984)** - Technical details on vocal tract computation using electric quadrupole representation. Relevant for implementing acoustic transfer function calculations.
- **Hixon et al. (1967)** - Original experimental work on turbulent noise correlates that this paper replicates and extends. Useful for understanding experimental methodology.

### Conceptual Links (not citation-based)
- [[Jongman_2000_FricativeAcoustics]] — comprehensive acoustic study of all English fricatives, providing empirical spectral data that complements Badin's aerodynamic production model; Badin explains *why* fricatives have certain spectral shapes, Jongman documents *what* those shapes are across the full inventory (Strong)
- [[Shadle_2023_FricativeSpectraHighFreq]] — extends fricative spectral analysis to higher frequencies (>8 kHz); Badin's obstacle effect model predicts that dental-source fricatives should have different high-frequency behavior than constriction-source ones, which Shadle's high-frequency measurements can test (Strong)
- [[Behrens_Blumstein_1988_FricativeAmplitude]] — characterizes fricative amplitude as a function of context, complementing Badin's aerodynamic amplitude model; together they connect production mechanics to contextual amplitude variation (Moderate)
- [[Deloche_2020_StatisticalStructureSpeech]] — Deloche's time-frequency statistical structure of fricatives validates the distinct source mechanisms that Badin models; sibilants vs non-sibilants show different statistical distributions consistent with Badin's obstacle vs non-obstacle distinction (Moderate)
