# Contribution of Laryngeal Size to Differences Between Male and Female Voice Production

**Author:** Zhaoyan Zhang
**Year:** 2021
**Venue:** Journal of the Acoustical Society of America, Vol. 150, No. 6, December 2021, pp. 4511-4521
**DOI:** 10.1121/10.0009033
**PMCID:** PMC8716178

## One-Sentence Summary

Uses 216,000 computational simulations of a 3D body-cover vocal fold model to demonstrate that sex/age differences in voice production (F0, SPL, voice quality, contact pressure) are primarily explained by vocal fold length and thickness differences, with length dominating F0 and SPL while thickness dominates closed quotient and spectral tilt.

## Problem Addressed

Prior work had established that adult males have longer, thicker vocal folds than females and children, but the specific contribution of each geometric dimension to observed acoustic and aerodynamic sex differences had not been systematically isolated. This study uses computational modeling to disentangle the independent effects of length, thickness, and depth on voice production.

## Key Contributions

- Demonstrates that cause-effect relationships between vocal fold physiology and voice production identified in male-like geometry remain qualitatively the same across female and child geometries
- Isolates length as the dominant factor for F0, flow rate, vibration amplitude, and SPL differences
- Isolates thickness as the dominant factor for closed quotient, maximum flow declination rate, and spectral tilt (H1-H2) differences
- Shows vocal fold depth has generally small effects
- Demonstrates that adult males experience lower peak contact pressure than females/children at equivalent SPL targets, partially explaining higher vocal pathology rates in women
- Shows very thin vocal folds (children) have elevated phonation threshold pressure

## Methodology

- 3D body-cover vocal fold model (finite element, left-right symmetric)
- One-dimensional quasi-steady glottal flow model with viscous loss
- No vocal tract included (source-only analysis)
- 9 control parameters varied systematically across discrete levels
- Total: 216,000 simulation conditions
- Multi-factorial ANOVA with eta-squared effect sizes
- Separate analyses for: (a) all conditions, (b) target SPL conditions, (c) phonation threshold pressure

## Key Parameters

### Vocal Fold Dimensions by Group

| Group | Length (L) | Thickness (T) | Body Depth (Db) | Cover Depth (Dc) |
|-------|-----------|---------------|-----------------|-------------------|
| Children | 6 mm | 1 mm | 4 mm | 1 mm |
| Adult Females | 10 mm | 2 mm | 6 mm | 1 mm |
| Adult Males | 17 mm | 3 mm | 8 mm | 1 mm |

### Simulation Parameter Space

| Parameter | Symbol | Values | Units |
|-----------|--------|--------|-------|
| Vocal fold length | L | 6, 10, 17 | mm |
| Vertical thickness | T | 1, 2, 3, 4.5 | mm |
| Cover layer depth | Dc | 1, 1.5 | mm |
| Body layer depth | Db | 4, 6, 8 | mm |
| Transverse Young's modulus | Et | 1, 2, 4 | kPa |
| Cover AP shear modulus | Gapc | 1, 10, 20, 30, 40 | kPa |
| Body AP shear modulus | Gapb | 1, 10, 20, 30, 40 | kPa |
| Initial glottal angle | alpha | 0, 1.6, 4, 8 | degrees |
| Subglottal pressure | Ps | 200-1800 (13 steps) | Pa |

### Fixed Material Properties

| Property | Value |
|----------|-------|
| Vocal fold density | 1030 kg/m^3 |
| AP Poisson's ratio | 0.495 |
| Loss factor | 0.4 |

## Key Results: Effect Sizes (eta-squared)

### All-Conditions Analysis

| Output Measure | Largest Factor | eta^2 | 2nd Factor | eta^2 |
|---------------|---------------|-------|------------|-------|
| F0 | Length (L) | 0.306 | Thickness (T) | 0.056 |
| SPL (A-weighted) | Subglottal Pressure (Ps) | 0.490 | Length (L) | 0.097 |
| Closed Quotient (CQ) | Thickness (T) | 0.290 | — | — |
| Normalized Amplitude Quotient (NAQ) | Thickness (T) | 0.518 | — | — |
| Peak Contact Pressure (Pc) | Subglottal Pressure (Ps) | 0.429 | — | — |

### Laryngeal Size Group Comparisons (children vs females vs males)

| Measure | eta^2 | Direction |
|---------|-------|-----------|
| F0 | 0.555 | males < females < children |
| H1-H2 | 0.228 | males < females < children |
| Closed Quotient | 0.174 | males > females > children |
| NAQ | 0.194 | males < females < children |
| Mean Glottal Flow (Qmean) | 0.261 | males > females > children |

### Target SPL Contact Pressure Analysis

| SPL Target | Largest Factor | eta^2 | 2nd Factor | eta^2 |
|-----------|---------------|-------|------------|-------|
| 60 dB | Length (L) | 0.272 | Thickness (T) | 0.165 |
| 70 dB | Glottal angle (alpha) | 0.284 | Length (L) | 0.244 |
| 75 dB | — | — | — | — |

### Phonation Threshold Pressure

| Factor | eta^2 |
|--------|-------|
| Initial glottal angle (alpha) | 0.158 |
| Transverse stiffness (Et) | 0.144 |
| Vertical thickness (T) | 0.041 |

- Lowest phonation threshold pressure at alpha = 1.6 degrees
- Increases at alpha = 0, 4, 8 degrees
- Very thin folds (T=1mm, children) show elevated threshold pressure

## Output Measures (Dependent Variables)

**Vibratory/Aerodynamic:**
- Glottal area: baseline (Ag0), amplitude (Agamp)
- Glottal flow: mean (Qmean), amplitude (Qamp)
- Closed quotient (CQ)
- Normalized amplitude quotient (NAQ)
- Peak vocal fold contact pressure (Pc)
- Phonation threshold pressure (Pth)

**Acoustic:**
- Fundamental frequency (F0)
- A-weighted SPL
- H1-H2 (first harmonic minus second harmonic amplitude)
- H2-H4
- H1-H2k (first harmonic minus 2 kHz harmonic)
- Cepstral peak prominence (CPP)

## Key Physical Relationships

### Length Effects (dominant for F0 and SPL)
- Longer folds -> lower F0 (eta^2 = 0.306)
- Longer folds -> higher airflow rate
- Longer folds -> larger vibration amplitude
- Longer folds -> higher SPL
- Mechanism: longer folds have lower eigenfrequencies

### Thickness Effects (dominant for voice quality)
- Thicker folds -> larger closed quotient (more complete closure)
- Thicker folds -> higher maximum flow declination rate (sharper closure)
- Thicker folds -> lower H1-H2 (less breathy spectral tilt)
- Thicker folds -> lower NAQ (more abrupt closure)
- Mechanism: thickness affects eigenfrequencies of coronal cross-section vibration modes

### Depth Effects
- Generally small effects on most measures
- Body depth (Db) has minimal acoustic impact

## Synthesis Implementation Notes

### For Speaker Profile Parameterization
1. **F0 control**: Vocal fold length is the primary physical determinant. For a synthesizer, this maps to default F0 range setting per speaker type.
2. **Voice quality (spectral tilt)**: Thickness controls H1-H2 and closed quotient. For Klatt-type synthesis:
   - Male presets: lower H1-H2 (less breathy), higher OQ complement
   - Female presets: higher H1-H2 (more breathy), lower OQ
   - Child presets: highest H1-H2, lowest OQ
3. **SPL relationship**: At equivalent SPL, females experience higher contact pressure than males, implying:
   - Female voices at comparable loudness require more vocal effort
   - This could inform effort-dependent parameter curves per speaker type
4. **Phonation threshold**: Children's thinner folds need higher onset pressure, consistent with observed higher subglottal pressures in child speech

### Mapping to Klatt Parameters
| Physical Property | Klatt Parameter | Male | Female | Child |
|------------------|----------------|------|--------|-------|
| Length -> F0 | F0 | ~110-130 Hz | ~190-220 Hz | ~260-300 Hz |
| Thickness -> closure | OQ (open quotient) | ~50-60% | ~60-75% | ~70-85% |
| Thickness -> spectral tilt | TL (tilt) | lower | higher | highest |
| Thickness -> H1-H2 | AV vs AH balance | more AV | more AH relative | most AH relative |
| Length -> flow | — | higher flow | lower flow | lowest flow |

### Key Insight for Multi-Speaker Synthesis
The study shows that length and thickness effects are largely independent and operate on different output dimensions. This means a synthesizer can parameterize speaker sex/age differences using two orthogonal controls:
1. A "size" or "length" parameter affecting F0 range and amplitude
2. A "thickness" parameter affecting voice quality (spectral slope, closure pattern)

These can be varied independently without acoustic interaction artifacts.

## Limitations
- No vocal tract model included (source-only)
- Linear elastic material model (no nonlinear tissue behavior)
- Quasi-steady flow model (no unsteady flow effects)
- Discrete parameter sampling rather than continuous variation
- Does not model mucosal wave propagation differences

## Related Papers in Collection
- Holmberg et al. 1988 — empirical glottal airflow data for male/female speakers
- Titze 1989 — theoretical male/female voice differences (ref 33 in paper)
- Iseli et al. 2007 — age/sex effects on H1*-H2* and spectral tilt
- Fant 1985 — LF model parameters that this study's output measures map to
- Gobl 2003 — voice quality and emotion (H1-H2 manipulation)
- Kreiman 2012 — voice quality and harmonic/OQ relationships

## Collection Cross-References

### Conceptual Links (not citation-based)
- **Bjorklund_2016_SubglottalPressureSPL** — Bjorklund's finding that males produce ~2 dB higher SPL at equivalent subglottal pressure provides empirical validation for Zhang's simulation result that female vocal folds require higher contact pressure to achieve equivalent SPL, attributable to the length/thickness differences this paper quantifies.
