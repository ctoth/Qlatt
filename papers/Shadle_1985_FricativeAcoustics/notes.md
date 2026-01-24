# The Acoustics of Fricative Consonants

**Author:** Christine Helen Shadle
**Year:** 1985
**Venue:** MIT PhD Thesis, Technical Report 506 (Research Laboratory of Electronics)
**Pages:** 200
**Thesis Supervisor:** Kenneth N. Stevens

## One-Sentence Summary

This thesis provides a rigorous acoustic-phonetic foundation for fricative synthesis, establishing that fricatives divide into three distinct source classes (obstacle-generated sibilants, surface-generated long-cavity, and surface-generated short-cavity), with quantitative spectral parameters and transfer functions validated through mechanical models.

## Problem Addressed

Unlike vowels where source-tract independence is well-established, fricative production mechanisms were poorly understood. The pressure source used in fricative models did not derive from specific knowledge of sound generation, leaving no principled way to alter it for different constriction shapes, flowrates, or source-tract interaction. Cross-speaker variation was so large that plotting fricative spectra on common axes was "not very illuminating."

## Key Contributions

1. **Three-class fricative model** based on dominant sound generation mechanism:
   - **Class 1**: /s/, /sh/ - jet impinges on obstacle (teeth), high-amplitude dipole source
   - **Class 2**: /x/, /c/ - long front cavity, sound from jet on wall surfaces
   - **Class 3**: /phi/, /f/, /theta/ - short front cavity, constriction shape crucial

2. **Source-filter validation**: Linear source-filter model works well for obstacle case; source can be derived from far-field measurements and combined with transmission-line tract model

3. **Quantitative spectral parameters**: A_T (total dynamic range), A_0 (low-frequency dynamic range) distinguish fricative classes

4. **Transfer function derivation** with poles, zeros, and bandwidths for various front cavity configurations

5. **Whistle conditions**: Documented when fricatives transition to whistles, providing guidance for stable fricative production

## Methodology

1. **Mechanical models**: Plastic tubes (17 cm, 2.54 cm diameter) with insertable constrictions and obstacles
2. **Controlled airflow**: 50-690 cc/sec through flowmeter and muffler
3. **Spectral analysis**: B&K microphone, HP spectrum analyzer, 16-average RMS spectra (0-10 kHz)
4. **Speech recordings**: 5 speakers, 6 sustained fricatives at normal and intense levels
5. **Theory**: Transmission-line modeling with TBFDA program for transfer functions

## Key Equations

### Fluid Dynamics

**Reynolds Number** (determines laminar vs turbulent flow):
$$Re = \frac{Vd}{\nu}$$
- V = flow velocity, d = constriction diameter, nu = 0.15 cm^2/sec (air)
- Re < 160: laminar (no sound)
- 160 < Re < 1200: unstable (whistles possible)
- Re > 1200: fully turbulent (fricative noise)

**Strouhal Number** (peak of free jet spectrum):
$$S = \frac{fd}{V} = 0.15 \text{ at peak}$$

### Pressure-Flow Relationship

**Pressure drop across constriction** (Heinz 1956):
$$\Delta p = K_2 \frac{\rho U^2}{2A_c^2} + K_3 U$$

**Incremental flow resistance**:
$$R_i = K_2 \frac{\rho U}{A_c^2} + K_3$$

### Acoustic Source Model

**Far-field dipole pressure** (obstacle case):
$$\hat{p}_0(r,\theta,\omega) = \frac{\omega^2 \rho}{4\pi c} S \left[\frac{\cos\theta}{r}e^{-jkr} - \frac{\cos\phi}{R}e^{-jkR}\right]$$

**Equivalent pressure source**:
$$\hat{p}_s = j\left(\frac{\omega\rho}{A}\right)(\hat{U}d)$$

### Resonance Frequencies

**Front cavity quarter-wavelength resonances**:
$$f_n = \frac{(2n+1)c}{4l_e}, \quad n = 0, 1, 2, \ldots$$

**Effective length with end correction**:
$$l_e = l_f + \frac{8r}{3\pi}$$

**Back cavity half-wavelength resonances**:
$$f_m = \frac{mc}{2l_b}, \quad m = 0, 1, 2, \ldots$$

**Helmholtz resonance** (whistle frequency):
$$f = \frac{c}{2\pi}\sqrt{\frac{A_m}{l_m A_f l_f}}$$

### Bandwidth

**Q factor**:
$$Q = \frac{f}{\Delta f}$$

**Bandwidth from constriction resistance**:
$$\Delta f_c = \frac{\rho c^2 R_c}{\pi A_f l (R_c^2 + (\omega L_c)^2)}$$

**Glottal loss bandwidth**:
$$\Delta f_g = \frac{c A_g}{\pi A_b l_b}$$

### Sound Power

**Total sound power from free jet** (Lighthill/Goldstein):
$$P_T \propto V^8 d^2$$

**Power exponent relationship**:
$$20 \log_{10}|p(V)| = \frac{n}{2} \cdot 20\log_{10}V + b$$
- n ~ 7-8 for quadrupole (free jet)
- n ~ 6 for dipole (obstacle case)

## Parameters

### Physical Constants

| Name | Symbol | Units | Value | Notes |
|------|--------|-------|-------|-------|
| Speed of sound | c | cm/sec | 34480-35000 | Dry air, room temperature |
| Air density | rho | g/cm^3 | 1.14-1.18 x 10^-3 | Standard conditions |
| Kinematic viscosity | nu | cm^2/sec | 0.15 | For air |
| Viscosity coefficient | mu | dyne-s/cm^2 | 1.86 x 10^-4 | Air |
| Heat conduction | lambda | cal/cm-s-deg | 5.5 x 10^-5 | Air |
| Adiabatic constant | eta | - | 1.4 | Air |

### Experimental Setup

| Name | Symbol | Units | Value | Notes |
|------|--------|-------|-------|-------|
| Tract tube length | l_T | cm | 17 | Experimental setup |
| Tract inner diameter | - | cm | 2.54 | |
| Back cavity area | A_b | cm^2 | 5.067 | |
| Front cavity area | A_f | cm^2 | 5.07 | |
| Glottis area | A_g | cm^2 | 0.97 | |
| Constriction area | A_c | cm^2 | 0.02-0.318 | Most common: 0.079 |
| Constriction length | l_c | cm | 1.0-3.0 | |
| Flowrate range | U | cc/sec | 50-690 | Fricative-producing |
| Mach number range | M | - | 0.02-0.25 | Subsonic |

### Pressure-Flow Coefficients (Table 2.2)

| Shape | A_c (cm^2) | l_c (cm) | K_2 | K_3 (g/sec-cm^4) |
|-------|------------|----------|-----|------------------|
| Circle | 0.020 | 1.0 | 0.34 | 175.7 |
| Circle | 0.020 | 2.5 | 0.43 | 297.6 |
| Circle | 0.079 | 1.0 | 1.00 | 8.7 |
| Circle | 0.079 | 2.5 | 1.07 | 15.5 |
| Circle | 0.318 | 1.0 | 1.03 | 0.88 |
| Rectangle | 0.079 | 1.0 | 1.10 | 19.0 |
| Rectangle | 0.318 | 1.0 | 1.01 | 1.36 |

## Fricative Classification

### Three-Class Model

| Class | Fricatives | Source Mechanism | Front Cavity | Amplitude | Model Type |
|-------|------------|------------------|--------------|-----------|------------|
| 1 | /s/, /sh/ | Jet on obstacle (teeth) | 1-3 cm | High (+20 dB) | Series pressure source at teeth |
| 2 | /x/, /c/ | Jet on wall surfaces | 4-8 cm | Medium | Distributed source along palate |
| 3 | /phi/, /f/, /theta/ | Constriction shape | 0-2 cm | Low | Distributed source + evanescent modes |

### Obstacle vs No-Obstacle Distinction

- **Obstacle (teeth) present**: +20 dB amplitude, dipole-like directivity, spectral zeros from path-length differences
- **No obstacle**: Lower amplitude, simpler spectrum, poles only (no zeros from obstacle reflection)

## Implementation Notes for Klatt Synthesizer

### Source Spectrum Characteristics by Fricative

| Fricative | Source Slope (dB/oct) | Frequency Range | Peak Frequency |
|-----------|----------------------|-----------------|----------------|
| /s/ | 0 | 800-4000 Hz | 7000 Hz |
| /s/ | -6 | 4000-10000 Hz | - |
| /sh/ apical | 0 | 300-6000 Hz | 2000-5000 Hz |
| /sh/ dental | 0, then -12 | 300-2000, 2000-10000 Hz | - |
| /f/, /theta/ | -3 to -6 | 800-10000 Hz | 2000 Hz broad |
| /x/ | -6 | 300-4000 Hz | 3000 Hz |

### Amplitude Parameters for Synthesis

From speech measurements (Table 4.2-4.3):

| Fricative | A_S (dB SPL) | A_T (dB) | A_0 (dB) | Relative Level |
|-----------|--------------|----------|----------|----------------|
| /s/ | 62 | 20 | 18 | High |
| /sh/ | 68 | 32 | 28 | Highest |
| /x/ | 62 | 37 | 19 | High |
| /f/ | 53 | 22 | 12 | Low |
| /theta/ | 50 | 22 | 7 | Low |
| /phi/ | 48 | 24 | 12 | Low |

**Key insight**: Sibilants (/s/, /sh/) are 10-15 dB louder than non-sibilants (/f/, /theta/, /phi/)

### Front Cavity Resonance Frequencies

For f = c / (4 * l_effective):

| l_f (cm) | First Resonance (Hz) | Second Resonance (Hz) | Third (Hz) |
|----------|---------------------|----------------------|------------|
| 1.5 | 5750 | 17250 | - |
| 2.0 | 4300 | 12900 | - |
| 3.2 | 2690 | 8080 | - |
| 6.0 | 1440 | 4300 | 7200 |
| 12.0 | 720 | 2160 | 3600 |

### Transfer Function Poles (Key Values)

**Short front cavity (l_f = 3.2 cm, like /s/):**
- Pole 1: ~1790 Hz, bandwidth 265 Hz
- Pole 2: ~6110 Hz, bandwidth 2340 Hz

**Long front cavity (l_f = 12 cm, like /x/):**
- Pole 1: 730 Hz, bandwidth 70 Hz
- Pole 2: 2010 Hz, bandwidth 115 Hz
- Pole 3: 3370 Hz, bandwidth 270 Hz
- Pole 4: 4870 Hz, bandwidth 490 Hz
- Higher poles: ~650-870 Hz bandwidth

### Bandwidth Increases with Frequency

Due to radiation losses, bandwidth follows approximately:
- Below 2 kHz: 70-200 Hz
- 2-4 kHz: 200-500 Hz
- Above 6 kHz: 500-900 Hz

### Practical Klatt AF (Frication Amplitude) Guidance

1. **Sibilants (/s/, /sh/)**: AF should be 10-15 dB higher than non-sibilants
2. **Non-sibilants (/f/, /theta/)**: Lower AF, use spectral tilt to roll off high frequencies
3. **Velar /x/**: Intermediate AF, strong first formant peak around 3 kHz

### What Makes Sibilants Different

1. **Obstacle (teeth)**: Creates dipole source, adds ~20 dB
2. **Front cavity length**: Short (1-3 cm) gives high-frequency peak
3. **Spectral zeros**: Obstacle distance creates interference zeros
4. **A_0 value**: High (18-28 dB) indicating significant low-frequency energy

### Whistle Avoidance

Whistles occur when:
- Constriction inlet is tapered (not rounded)
- l_c/d ratio between 0.5-2.0
- A_m >= 0.32 cm^2 AND A_t >= 0.71 cm^2
- Reynolds number 1400-2000

Human fricatives avoid whistles by:
- Using rounded (untapered) constriction edges
- Staying in fully turbulent flow regime (Re > 1200)
- Maintaining constriction dimensions outside whistle range

## Per-Fricative Summary

### /s/ (alveolar sibilant)

- **Front cavity length**: 1.5-2.5 cm
- **Source mechanism**: Jet impinges on upper incisors (obstacle/teeth)
- **Source type**: Series pressure source at teeth, dipole-like
- **Spectral characteristics**:
  - Smoothly rising spectrum to broad peak at 7000 Hz
  - 0 dB/oct slope 800-4000 Hz, -6 dB/oct above 4000 Hz
  - High A_0 (18.4 dB) - significant low-frequency content
- **Amplitude**: A_S = 62 dB SPL (high amplitude group)
- **First resonance**: ~3500-5750 Hz

### /sh/ (post-alveolar sibilant)

- **Front cavity length**: 2-3 cm (slightly longer than /s/)
- **Source mechanism**: Jet on teeth, but constriction further back
- **Source type**: Series pressure source at teeth
- **Spectral characteristics**:
  - Trough at ~2 kHz, peaks clustered 2-5 kHz and around 8 kHz
  - Apical source: 0 dB/oct 300-6000 Hz
  - Dental source: 0 dB/oct 300-2000 Hz, -12 dB/oct above
  - Highest A_T (31.7 dB) and A_0 (27.6 dB)
- **Amplitude**: A_S = 68 dB SPL (highest of all fricatives)
- **First resonance**: ~2500-4300 Hz

### /f/ (labiodental)

- **Front cavity length**: 0-1 cm (very short, at lips)
- **Source mechanism**: Surface-generated, jet contacts lip/teeth surfaces
- **Source type**: Distributed pressure source, constriction shape crucial
- **Spectral characteristics**:
  - Two broad peaks with trough between at low frequencies
  - -3 to -6 dB/oct slope 800-10000 Hz
  - Low A_0 (12.0 dB)
- **Amplitude**: A_S = 53 dB SPL (low amplitude group)
- **Model**: Flat-topped plug (FTP) configuration best matches speech

### /theta/ (dental)

- **Front cavity length**: 0-1 cm (at dental position)
- **Source mechanism**: Surface-generated, tongue between teeth
- **Source type**: Distributed, two-slot (tongue shape) produces best match
- **Spectral characteristics**:
  - Two broad peaks with distinctive dip at ~4 kHz
  - Lowest A_0 value (7.1 dB)
  - Second lowest energy overall
- **Amplitude**: A_S = 50 dB SPL (low amplitude group)
- **Model**: Double rectangular slot best represents tongue shape

### /x/ (velar)

- **Front cavity length**: 4-8 cm
- **Source mechanism**: Jet on wall of oral cavity (palate/velum)
- **Source type**: Distributed pressure source along roof of mouth
- **Spectral characteristics**:
  - Single high-amplitude broad peak ~3000 Hz
  - Pronounced dip at 6 kHz
  - -6 dB/oct slope 300-4000 Hz
  - Well-defined formant-like structure
- **Amplitude**: A_S = 62 dB SPL (high amplitude group)
- **First resonance**: 700-1000 Hz due to long front cavity

### /phi/ (bilabial)

- **Front cavity length**: 0 cm (at lips, no front cavity)
- **Source mechanism**: Surface-generated at lip aperture
- **Source type**: Distributed, long narrow slit
- **Spectral characteristics**:
  - Broad peak at low frequencies (~2 kHz)
  - Sharp decrease below peak
  - A_T ~24 dB, A_0 ~12 dB
- **Amplitude**: A_S = 48 dB SPL (lowest amplitude)
- **Model**: Circular constriction produces nearly flat spectrum

## Figures of Interest

### Vocal Tract Anatomy
- **Fig 1.1 (p. 18)**: Midsagittal cross-section during /sh/ production
- **Fig 4.1 (p. 131)**: Midsagittal view for all six recorded fricatives

### Turbulent Jet Regions
- **Fig 1.2 (p. 21)**: Mixing region (4d), transition region (4d), fully developed region

### Experimental Setup
- **Fig 2.1 (p. 31)**: Complete system: air tank, flowrator, muffler, tract, baffle, microphone
- **Fig 2.3-2.4 (p. 33-34)**: Detailed tract diagram with dimensions

### Spectral Data
- **Fig 2.9 (p. 46)**: Resonance peaks for different front-cavity lengths
- **Fig 2.14-2.15 (p. 54-55)**: Obstacle effect on spectrum (zeros/troughs)
- **Fig 4.3-4.7 (p. 143-148)**: Speech fricative spectra for all subjects

### Transfer Functions
- **Fig 3.9 (p. 80)**: Models I, II, III for l_f = 3.2 and 12 cm
- **Fig 3.16 (p. 105)**: Correction functions and final transfer functions

### Mechanical Models for Speech
- **Fig 4.9 (p. 163)**: /s/-like and /sh/-like configurations
- **Fig 4.11 (p. 165)**: /phi/, /f/, /theta/ configurations
- **Fig 4.14 (p. 168)**: /x/, /c/ configurations

## Relevance to Qlatt Project

### Direct Implementation Guidance

1. **AF (Frication Amplitude) scaling**:
   - Sibilants (/s/, /sh/): +10-15 dB relative to non-sibilants
   - /sh/ should be loudest fricative (~6 dB above /s/)
   - /f/, /theta/, /phi/: baseline or lower AF

2. **Spectral Tilt**:
   - /s/: Flat to 4 kHz, then -6 dB/oct
   - /sh/: Flat to 2-6 kHz depending on production, then steep rolloff
   - /f/, /theta/: -3 to -6 dB/oct from start
   - /x/: -6 dB/oct from low frequencies

3. **Formant frequencies for fricative filtering**:
   - F5 (frication formant) placement should follow front-cavity length
   - /s/: F5 ~ 4000-5000 Hz
   - /sh/: F5 ~ 2500-4000 Hz
   - /x/: F5 ~ 2000-3000 Hz

4. **Zeros (antiformants)**:
   - Obstacle case (sibilants) introduces zeros
   - Zero frequency ~ c/(2 * l_obstacle)
   - Creates spectral troughs at predictable frequencies

5. **Bandwidth settings**:
   - Increase bandwidth with frequency
   - Low resonances: 100-200 Hz bandwidth
   - High resonances (>6 kHz): 600-900 Hz bandwidth

### Validation Approach

Compare synthesized fricative spectra against:
- A_T (total dynamic range) targets
- A_0 (low-frequency dynamic range) targets
- Peak frequency locations
- Overall SPL levels

## Open Questions

- [ ] How to model distributed source for /f/, /theta/, /phi/ in Klatt framework?
- [ ] Should F5/F6 be used for front-cavity resonances, or separate frication filter?
- [ ] How to implement evanescent mode effects for very short front cavities?
- [ ] Perceptual significance of pole-zero pairs vs poles-only for sibilant perception?
- [ ] Cross-speaker normalization strategy given large individual variation?

## Related Work Worth Reading

1. **Lighthill (1952)** - Foundational turbulence acoustics, V^8 power law
2. **Strevens (1960)** - Early fricative classification by spectral characteristics
3. **Fant (1960)** - Source spectral slopes for synthesizer design
4. **Heinz (1956)** - Pressure-flow relationships in constrictions
5. **Beranek (1954)** - Radiation impedance formulas
6. **Catford (1977)** - Effect of teeth on fricative spectra (with/without teeth recordings)
7. **Goldstein (1976)** - Free jet sound power formulas
8. **Morse and Ingard** - Acoustic line source model for distributed jet source
