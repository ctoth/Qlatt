# Cause-Effect Relationship Between Vocal Fold Physiology and Voice Production in a Three-Dimensional Phonation Model

**Authors:** Zhaoyan Zhang
**Year:** 2016
**Venue:** Journal of the Acoustical Society of America, 139(4), 1493-1507
**DOI:** 10.1121/1.4944754

## One-Sentence Summary
This paper uses a 3D continuum phonation model to systematically map how vocal fold physiology (stiffness, geometry, subglottal pressure) affects voice output (F0, intensity, spectral characteristics, voice quality), establishing quantitative cause-effect relationships essential for controlling voice source parameters in synthesis.

## Problem Addressed
Previous studies could not fully map the cause-effect relationships between vocal fold physiology and voice acoustics because real-life experiments cannot independently vary individual physiological parameters. Computational models enable systematic parameter sweeps that isolate each factor's contribution, but prior models were simplified (1D/2D) and lacked the fidelity to capture complex 3D vibratory patterns and flow interactions.

## Key Contributions
- Comprehensive parameter sweeps across 5 physiological dimensions (subglottal pressure, vocal fold length, body/cover stiffness, medial surface thickness) in a validated 3D model
- Quantitative mappings: which physiological parameters control F0, intensity, spectral tilt, voice onset, and voice quality
- Demonstration that vocal fold vibration and voice production are primarily controlled by medial surface thickness and vocal fold stiffness
- Evidence that CQ (contact quotient) and OQ (open quotient) are strongly correlated but may decorrelate in extreme conditions
- Identification of conditions producing different phonation types (breathy, modal, pressed)

## Methodology
- 3D finite-element vocal fold model with linear elastic body and cover layers
- Coupled to a simplified Bernoulli flow solver with empirical viscous losses
- Vocal fold geometry: two-layer (body + cover) structure with variable medial surface thickness T
- Subglottal system: single-resonance model (Fg = 500 Hz, Bg = 40 Hz, Zg characteristic)
- Supraglottal tract: uniform tube 17.5 cm with radiation impedance
- Flow separation at minimum glottal area; empirical turbulence noise model (Re > 1200)
- Systematically varied: Ps (0.2-1.2 kPa), L (1.0-2.0 cm), body AP stiffness (1-20 kPa), cover AP stiffness (1-8 kPa), medial surface thickness T (0.3-4.5 mm)

## Key Equations

### Phonation Threshold Pressure
$$P_{th} \propto B_1 \cdot \mu \cdot c / T^2$$
Where:
- $B_1$ = first-mode damping coefficient
- $\mu$ = tissue viscosity
- $c$ = mucosal wave speed
- $T$ = medial surface thickness

(From Titze 1988, validated by this model's results)

### F0 Dependence on Stiffness
$$F_0 \approx \frac{1}{2L}\sqrt{\frac{E_{AP,cover}}{\rho}}$$
Where:
- $L$ = vocal fold length
- $E_{AP,cover}$ = cover layer anteroposterior stiffness
- $\rho$ = tissue density

Key finding: F0 is primarily determined by cover AP stiffness (not body stiffness), consistent with body-cover theory.

### Spectral Tilt (H1-H2)
The relationship between H1-H2 and physiological parameters is complex:
- Increasing Ps: H1-H2 decreases (more pressed, less spectral tilt)
- Increasing medial surface thickness T: H1-H2 decreases (more pressed)
- Increasing vocal fold stiffness: variable effect depending on regime

### Contact Quotient
$$CQ = \frac{t_{contact}}{T_0}$$
Where $t_{contact}$ is the duration of vocal fold contact per cycle and $T_0$ is the fundamental period.

## Parameters

| Name | Symbol | Units | Range Tested | Key Effects |
|------|--------|-------|-------------|-------------|
| Subglottal pressure | Ps | kPa | 0.2-1.2 | Controls intensity (primary), slight F0 rise, decreased H1-H2 |
| Vocal fold length | L | cm | 1.0-2.0 | Controls F0 (inversely proportional), minor spectral effects |
| Body AP stiffness | Gab | kPa | 1-20 | Moderate F0 increase, negligible intensity/quality effect |
| Cover AP stiffness | Gap | kPa | 1-8 | Primary F0 control, slight intensity increase |
| Medial surface thickness | T | mm | 0.3-4.5 | Voice quality control (breathy↔pressed), phonation threshold, CQ |
| Cover transverse stiffness | Gtp | kPa | 0.5-8 | Similar to cover AP but weaker effect on F0 |
| Body transverse stiffness | Gtb | kPa | 0.5-20 | Minimal effect on F0; affects medial compression |
| Subglottal resonance freq | Fg | Hz | 500 (fixed) | Shapes source-tract interaction |
| Subglottal bandwidth | Bg | Hz | 40 (fixed) | Shapes source-tract interaction |

## Implementation Details

### Voice Quality Control via Medial Surface Thickness
- **T < 1 mm**: Breathy phonation - incomplete closure, high OQ, high H1-H2, low intensity
- **T ≈ 1-3 mm**: Modal phonation - regular vibration, moderate CQ (0.3-0.5), balanced spectrum
- **T > 3 mm**: Pressed phonation - long closed phase, high CQ (>0.6), low H1-H2, high intensity, higher harmonics

This is the most important mapping for synthesis: medial surface thickness acts as the primary "voice quality dial."

### F0 Control Hierarchy
1. **Vocal fold length** (L): Inversely proportional, ~1/(2L) relationship
2. **Cover AP stiffness** (Gap): Primary stiffness control of F0
3. **Body AP stiffness** (Gab): Secondary F0 control, weaker effect
4. **Subglottal pressure** (Ps): Minor F0 increase (~2-5 Hz per 0.1 kPa increase)

### Intensity Control
- **Primary**: Subglottal pressure Ps (nearly linear in dB scale)
- **Secondary**: Medial surface thickness T (thicker → louder, by reducing air leak)
- **Tertiary**: Vocal fold stiffness (stiffer → slightly louder at same Ps)

### Spectral Characteristics (H1-H2, Spectral Tilt)
- Ps increase → decreased H1-H2 (flatter spectrum, more pressed)
- T increase → decreased H1-H2 (more pressed quality)
- Stiffness increase → complex effect; generally slight H1-H2 decrease
- H1-H2 ranges: approximately -5 dB (very pressed) to +12 dB (very breathy)

### Mean Flow Rate
- Decreases with increasing medial surface thickness (less DC leak)
- Increases with subglottal pressure
- Higher flow rates correlate with breathier voice quality

### Voice Onset (Phonation Threshold)
- Lower threshold with: thicker medial surface, lower stiffness, shorter vocal folds
- Threshold Ps ranges from ~0.1 kPa (easy onset) to ~0.8 kPa (difficult onset)
- Falsetto-like conditions (thin, stiff folds) require higher onset pressures

### CQ vs OQ Relationship
- Generally inversely correlated: CQ + OQ ≈ 1
- **Decorrelation occurs** when: vocal fold stiffness is very high, or medial surface is very thin
- In these cases, vocal folds vibrate but may not contact → CQ=0 but OQ<1

### Source-Tract Interaction
- Subglottal resonance (Fg=500 Hz) introduces spectral features
- F0 near Fg can cause subharmonic vibration
- Supraglottal tract (uniform tube, F1≈500 Hz) affects voice quality measures
- H1 and H2 amplitudes are affected by proximity to vocal tract formants

## Figures of Interest
- **Fig 1 (page 4):** 3D vocal fold model geometry showing body/cover layers, medial surface thickness T, and flow direction
- **Fig 2 (page 4):** Glottal flow waveform and flow derivative for different conditions - shows how waveform shape changes with parameters
- **Fig 3 (page 6):** Surface plots of F0, mean flow, H1-H2, and MFDR vs Ps×T for different vocal fold lengths - KEY REFERENCE for parameter mapping
- **Fig 4 (page 6):** Vocal fold vibration, glottal closure, and CQ surface plots
- **Fig 5 (page 7):** Phonation threshold pressure contours
- **Fig 6 (page 8):** Effects of vocal fold stiffness on voice parameters (12 surface plots)
- **Fig 7 (page 9):** Effects of resting glottal opening and AP stiffness variations
- **Fig 8 (page 10):** Effects of body-cover stiffness ratios
- **Fig 9 (page 10):** Effects of vocal fold surface stiffness
- **Fig 10 (page 11):** Glottal flow waveforms for pressed, modal, and breathy conditions with varying T (1mm and 4.5mm)
- **Fig 11 (page 12):** Flow waveforms showing effect of medial surface shape (rectangular vs convergent vs divergent)
- **Fig 12 (page 12):** Flow waveforms at different Ps levels and their spectra
- **Fig 13 (page 13):** Table of R-parameters (Rd, Ra, Rk, Rg) mapped to physiological conditions

## Results Summary

### Primary Findings
1. **Medial surface thickness (T) is the dominant voice quality controller** - it determines whether phonation is breathy, modal, or pressed, more than any other single parameter
2. **F0 is controlled by vocal fold stiffness and length**, with cover stiffness being the primary stiffness control
3. **Intensity is primarily controlled by subglottal pressure**, with secondary effects from medial surface geometry
4. **CQ and H1-H2 generally covary** but can decouple in extreme conditions (very stiff or very thin folds)
5. **Phonation threshold pressure** depends strongly on medial surface thickness (thicker = easier onset)

### R-Parameter Mapping (Table II, page 13)
The paper maps LF model R-parameters to physiological conditions:

| Condition | Ps (kPa) | Gap (kPa) | L (cm) | T (mm) | F0 (Hz) | Rd | Ra | Rk | Rg |
|-----------|----------|-----------|--------|--------|----------|----|----|----|-----|
| Soft, low | 0.4 | 3 | 1.6 | 1.0 | 127 | 2.70 | 0.053 | 0.34 | 1.10 |
| MF, mid | 0.6 | 6 | 1.4 | 1.5 | 179 | 1.06 | 0.012 | 0.39 | 0.91 |
| MF, high | 0.6 | 8 | 1.2 | 1.5 | 263 | 1.01 | 0.009 | 0.40 | 0.81 |
| Loud, low | 0.8-1.0 | 4 | 1.6 | 3.0 | 128 | 0.70 | 0.002 | 0.35 | 0.68 |
| Loud, mid | 0.8-1.0 | 6 | 1.4 | 3.0 | 173 | 0.72 | 0.003 | 0.32 | 0.78 |
| Loud, high | 0.8-1.0 | 8 | 1.2 | 3.0 | 240 | 0.74 | 0.001 | 0.34 | 0.72 |

### Key Spectral Observations
- Pressed voice: Strong harmonics, steep spectral roll-off above ~2 kHz, low H1-H2
- Modal voice: Balanced harmonic structure, moderate roll-off
- Breathy voice: Weak harmonics, prominent H1, noisy above ~2 kHz
- The spectral differences are primarily determined by the glottal closure pattern

## Limitations
- Simplified flow model (Bernoulli-based, not full Navier-Stokes)
- Linear tissue elasticity (real vocal folds are viscoelastic and nonlinear)
- Simplified subglottal/supraglottal coupling (single resonance + uniform tube)
- No mucus, surface tension, or collision damping modeled
- Results are for sustained phonation only (no transients, onsets, or connected speech dynamics)
- Parameter ranges may not cover all pathological voice conditions

## Relevance to Project
This paper provides the physiological grounding for voice quality control in the Qlatt synthesizer:

1. **Voice quality mapping**: Medial surface thickness → Rd parameter → spectral tilt in LF model. This gives a principled way to control breathiness/pressedness.
2. **R-parameter values**: Table II provides concrete LF R-parameter values for different voice conditions (soft, medium, loud × low/mid/high pitch), directly usable for voice quality presets.
3. **Independent control dimensions**: Confirms that F0 (stiffness/length), intensity (pressure), and voice quality (medial surface) are largely independent, validating separate control of these in synthesis.
4. **CQ-OQ decorrelation warning**: CQ and OQ don't always sum to 1 - synthesis models shouldn't assume they do in extreme voice conditions.

## Open Questions
- [ ] How do the R-parameter values in Table II compare to the presets currently used in Qlatt's voice quality system?
- [ ] Can the medial surface thickness concept be directly mapped to Burkhardt's "rate" parameter for voice quality modification? [See Burkhardt_2009_VoiceQualityFormantSynthesis — provides explicit formulas using rate (0-100%) for breathy, tense, whispery, creaky, falsetto phonation types]
- [ ] How should source-tract interaction effects be handled when F0 approaches a formant frequency?
- [ ] The paper shows H1-H2 depends on both physiology AND acoustic coupling - how much does the vocal tract correction matter for Qlatt?

## Related Work Worth Reading
- Titze (1988) - Phonation threshold pressure theory (validated here)
- Berry et al. (2001) - 2D continuum model of vocal fold vibration
- Zhang (2009, 2010) - Earlier 2D versions of this modeling approach
- Alipour et al. (2000) - Finite element vocal fold models
- Fant (1995) - LF model R-parameter definitions
- Titze and Talkin (1979) - Simulation using two-mass model
- Story and Titze (1995) - Voice simulation with body-cover model

---

## Collection Cross-References

### Already in Collection
- [[Fant_1985_LFModelGlottalFlow]]
- [[Holmberg_1988_GlottalAirflowPressure]]
- [[Hu_2012_DynamicsModelSpeechRecognitionSynthesis]]
- [[Kreiman_2012_VoiceQualityHarmonicOQ]]
- [[Scherer_2001_VocalEmotionCrossCultural]]

### New Leads (Not Yet in Collection)
- **Fant (1995) - LF model revisited** - Defines the R-parameters (Rd, Ra, Rk, Rg) used in Table II of this paper; essential for implementing LF source control
- **Story and Titze (1995) - Body-cover model** - The vocal fold model architecture that Zhang extends to 3D; foundational for understanding body/cover stiffness parameters
- **Titze (1988) - Small-amplitude oscillation physics** - Derives phonation threshold pressure theory validated by Zhang's results; critical for voice onset modeling
