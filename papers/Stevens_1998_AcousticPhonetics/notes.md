# Acoustic Phonetics - Expanded Notes

**Author:** Kenneth N. Stevens
**Year:** 1998
**Publisher:** MIT Press
**Pages:** 607

## One-Sentence Summary

This comprehensive textbook provides the theoretical foundation for Klatt synthesizer implementation by establishing quantitative relationships between articulatory configurations, acoustic transfer functions, and source mechanisms for all major speech sound classes.

---

# PART I: FOUNDATIONAL THEORY

---

## Chapter 1: Anatomy and Physiology of Speech Production (pp. 2-54)

### 1.1 Speech Production System Overview

The speech production system divides into three parts:
1. System below larynx (subglottal)
2. Larynx and surrounding structures
3. Structures above larynx (supraglottal)

The glottis (constricted region at vocal folds) forms the dividing line between subglottal and supraglottal systems. For most speech sounds, the subglottal system provides energy in the airflow; laryngeal and supraglottal structures modulate this airflow to produce audible sound.

### 1.2 Subglottal System Dimensions

| Parameter | Value | Units |
|-----------|-------|-------|
| Trachea cross-sectional area | 2.5 | cm^2 |
| Trachea length | 10-12 | cm |
| Vital capacity (adults) | 3000-5000 | cm^3 |
| Normal breathing volume excursions | <1000 | cm^3 |
| Speech lung volume excursions | 500-1000 | cm^3 |
| Lung pressure during speech | 5-10 | cm H2O |
| Pressure variation (max-min) | <30% | - |

### 1.3 Vocal Fold Dimensions and Properties

| Parameter | Male | Female | Units |
|-----------|------|--------|-------|
| Vocal fold length | 1.5 | 1.0 | cm |
| Cartilaginous portion | 0.3 | 0.3 | cm |
| Total thickness | 2-3 | 2-3 | mm |
| Cover thickness at midpoint | 0.5 | 0.4 | mm |
| Vocalis muscle diameter | ~2 | ~2 | mm |
| Natural frequency | ~120 | ~200 | Hz |

**Vocal Fold Damping (Q factor):**
- At resonant frequency ~100 Hz: Q ~ 4
- At 200 Hz: Q ~ 7

**Effective resistance per unit length:**
- Male: ~8 dyne-s/cm^2
- Female: ~4 dyne-s/cm^2

### 1.4 Vocal Tract Dimensions

| Measurement | Adult Female | Adult Male | Units |
|-------------|--------------|------------|-------|
| Total vocal tract length | 14.1 | 16.9-17.7 | cm |
| Pharynx length | 6.3 | 8.9 | cm |
| Oral cavity length | 7.8 | 8.1 | cm |
| Nasal cavity length | 11 | 11 | cm |
| Nasal cavity volume | 25 | 25 | cm^3 |

**Vocal Tract Scaling Ratio:**
- Female/Male tract length ratio: ~0.83
- Can be used to scale formant frequencies between speakers

### 1.5 Cross-Sectional Areas

| Region/Sound | Cross-sectional Area | Units |
|--------------|---------------------|-------|
| Pharyngeal region for /a/ | ~0.60 | cm^2 |
| Pharyngeal region for /i/ | ~7.6 | cm^2 |
| Oral region (low vowel) | 4-5 | cm^2 |
| Oral region (high vowel) | 0.7-1.1 | cm^2 |

**Area-dimension relationship:**
$$A = Kd^\alpha$$
- Oral region: alpha ~ 2.0
- Pharyngeal region: alpha ~ 0.9

### 1.6 Soft Palate and Velopharyngeal Opening

| Parameter | Value | Units |
|-----------|-------|-------|
| Velum size | 4 x 2 x 0.5 | cm |
| Velopharyngeal opening (fully lowered) | ~1.0 | cm^2 |
| Velopharyngeal opening (nasal sounds) | 0.2-0.8 | cm^2 |
| Sinus volumes (maxillary) | 10-20 | cm^3 each |
| Sinus volumes (frontal/sphenoidal) | 3-10 | cm^3 each |

### 1.7 Lip Opening Dimensions

| Parameter | Range | Units |
|-----------|-------|-------|
| Lip width | 10-45 | mm |
| Lip height | 5-20 | mm |
| Cross-sectional area | 0.3-7 | cm^2 |
| Length/area ratio (lowered mandible) | 0.2 | cm^-1 |
| Length/area ratio (protruded lips) | 6.0 | cm^-1 |

### 1.8 Physical Constants

| Parameter | Symbol | Value | Units |
|-----------|--------|-------|-------|
| Air viscosity (37C) | mu | 1.94 x 10^-4 | dyne-s/cm^2 |
| Air density | rho | 1.14 x 10^-3 | gm/cm^3 |
| Sound velocity (body temp) | c | 35,400 | cm/s |
| Specific heat ratio | gamma | 1.4 | - |

### 1.9 Airflow Classifications

| Sound Class | Constriction Area | Airflow | Pressure Drop |
|-------------|-------------------|---------|---------------|
| Vowels | 0.2-3.0 cm^2 | 200-500 cm^3/s | 3-8 cm H2O |
| Fricatives | 0.05-0.2 cm^2 | 300-600 cm^3/s | 5-10 cm H2O |
| Aspiration | 0.1-0.4 cm^2 (glottal) | 500-1500 cm^3/s | 5-10 cm H2O |
| Stops (closure) | 0 cm^2 | 0 cm^3/s | buildup |

### 1.10 Aerodynamic Equations

**Reynolds Number:**
$$Re = \frac{Vh\rho}{\mu}$$
- Critical Re for smooth tubes: ~2000

**Laminar Flow Pressure Drop (circular tube):**
$$\frac{\Delta P}{L} = \frac{128\mu U}{\pi D^4}$$

**Laminar Flow Pressure Drop (rectangular tube, a << b):**
$$\frac{\Delta P}{L} = \frac{12\mu U}{ba^3}$$

**Turbulent Flow Pressure Drop:**
$$\frac{\Delta P}{L} = \frac{k}{D}\left(\frac{\rho V^2}{2}\right)$$
- k ranges 0.02-0.08 depending on wall roughness

**Bernoulli Pressure:**
$$P_1 + \frac{\rho V_1^2}{2} = P_2 + \frac{\rho V_2^2}{2}$$

**Pressure Drop at Contraction/Expansion:**
$$\Delta P = k_L \frac{\rho V_2^2}{2}$$
- k_L range: 0.05 (smooth) to 1.0 (abrupt expansion)
- Total k_L for constrictions: 1.2-1.7 typical

**Airflow-Area-Pressure Relation:**
$$\Delta P = 1.0\frac{\rho U^2}{2A^2}$$

### 1.11 Mechanical Impedance of Vocal Tract Walls

$$Z_s = \frac{1}{j\omega C_s} + j\omega M_s + R_s$$

Typical values (valid up to 100-200 Hz):
- C_s: 1.0-3.0 x 10^-5 cm^5/dyne
- M_s: 1.0-2.0 gm/cm^2
- R_s: 800-2000 dyne-s/cm^3
- Resonant frequency of surface tissue: 30-40 Hz

### 1.12 Articulatory Timing Constraints

| Movement Type | Duration | Notes |
|--------------|----------|-------|
| Unidirectional (T1) | varies | Time to complete one direction |
| Cyclic (T2) | ~3 x T1 | Full there-and-back cycle |
| Minimum cyclic time | ~200 ms | Average across articulators |
| Glottal open-close cycle | 80-150 ms | Aspiration maneuver |
| Aspiration interval | ~50 ms | Before stressed vowel |
| Complete glottal abduction-adduction | ~200 ms | Full cycle |

**Maximum Velocity for Sinusoidal Displacement (Eq 1.13):**
$$R = \frac{\pi}{T_2} D$$
- R = maximum velocity
- T2 = period of cyclic movement
- D = peak-to-peak displacement

### 1.13 Articulator Movement Timing

| Articulator | Movement | Duration | Notes |
|-------------|----------|----------|-------|
| Tongue root | Back to front | ~100 ms | Minimum |
| Tongue body | Vowel-to-vowel | ~100 ms | With consonant overlay |
| Soft palate | Open-close cycle | 200-300 ms | Complete VPP cycle |
| Soft palate | Opening rate | 10 cm^2/s | Before nasal |
| Soft palate | 0.5 cm^2 opening | ~50 ms | Time to create |
| Soft palate | Maximum velocity | 7-10 cm/s | Movement rate |
| Lips | Rounding movement | 50-100 ms | Unrounded to rounded |
| Lips | Protrusion cycle | 200-300 ms | Full cycle |
| Lips | Stop closure cycle | 150-200 ms | Complete cycle |

### 1.14 Stop Consonant Release Rates

| Place | Rate of Area Change | Notes |
|-------|---------------------|-------|
| Labial | 100 cm^2/s | Initial release rate |
| Alveolar | 50-100 cm^2/s | Tongue tip |
| Velar | 25 cm^2/s | Tongue body slower |

**Lip Movement Details:**
- Initial separation rate for /p/: 75 cm/s
- Initial separation rate for /m/: 30 cm/s
- Peak lip velocity after stop release: <= 25 cm/s

---

## Chapter 2: Source Mechanisms (pp. 55-126)

### 2.1 Vocal Fold Vibration Model

**Two-Mass Model Parameters:**

| Parameter | Male | Female | Units |
|-----------|------|--------|-------|
| Lower mass per unit length (M1) | 0.1 | 0.04 | gm/cm |
| Upper mass per unit length (M2) | 0.008 | - | gm/cm |
| Compliance (C1') | 1.9 x 10^-5 | 3.1 x 10^-5 | cm^2/dyne |
| Coupling compliance (Cc) | 5 x 10^-5 | - | cm^2/dyne |
| Rest position (x0) | 0.01 | 0.005 | cm |
| Vertical length (d1) | 0.2 | 0.133 | cm |
| Glottal length | 1.0 | 0.7 | cm |
| Natural frequency (lower mass) | 92 | 183 | Hz |
| Natural frequency (upper mass) | 294 | - | Hz |

**Fundamental Frequency (Eq. 2.4):**
$$f_0 = \frac{1}{2\pi\sqrt{M_1 C'_1}}$$

### 2.2 Glottal Area and Airflow Parameters

**Table 2.1: Glottal Flow Parameters**

| Parameter | Males (Measured) | Males (Model) | Females (Measured) | Females (Model) |
|-----------|------------------|---------------|---------------------|-----------------|
| Subglottal pressure (cm H2O) | 9.0 | 8.0 | 8.2 | 8.0 |
| Fundamental frequency (Hz) | 126 | 123 | 223 | 238 |
| Sound pressure level (dB) | 86.0 | 82 | 83.3 | 78 |
| Max airflow declination rate (cm^3/s/ms) | 481 | 490 | 249 | 230 |
| DC component of flow (cm^3/s) | 110 | - | 90 | - |
| AC flow (cm^3/s) | 380 | 380 | 180 | 130 |
| Average flow (cm^3/s) | 200 | - | 150 | - |
| Open quotient | 0.57 | 0.54 | 0.71 | 0.64 |

**Maximum Glottal Area:**
- Male: 0.107 cm^2 per cycle
- Female: 0.037 cm^2 per cycle

**Time Glottis is Open:**
- Male (at 125 Hz): ~4.0 ms
- Female (at 230 Hz): ~2.4 ms

### 2.3 Transglottal Pressure Equations

**Transglottal Pressure Drop (Eq. 2.5):**
$$\Delta P_g = \frac{12\mu h}{\ell d^3} U_g + k\frac{\rho U_g^2}{2(\ell d)^2}$$

**Simplified (Eq. 2.6):**
$$\Delta P_g = \frac{\rho U_g^2}{2A_g^2}$$

**With Acoustic Mass (Eq. 2.7):**
$$\Delta P = R_g U_g + M_A \frac{dU_g}{dt}$$

### 2.4 Sound Pressure at Distance r

**Eq. 2.8:**
$$p_r(t) = \frac{\rho}{4\pi r} \frac{\partial U_o(t - r/c)}{\partial t}$$

**Frequency Domain (Eq. 2.9):**
$$p_r(\omega) = \frac{j\omega\rho U_o(\omega)e^{-jkr}}{4\pi r}$$

Key insight: Sound pressure is proportional to the **derivative** of glottal flow, not flow itself.

### 2.5 Source Spectrum Characteristics

- Fundamental component dominates at low frequencies
- Slope: -6 dB/octave above ~500 Hz
- Slight peak (~few dB) around 2.5 kHz region
- Male spectrum ~5 dB higher than female above 1 kHz
- Negative pulse with rapid rise and abrupt fall

### 2.6 Voice Quality Parameters

**Modal Voicing:**
- Normal vocal fold tension
- Typical period: ~8 ms for males
- Open quotient: ~0.5

**Pressed Voicing (Creaky Voice):**
- Vocal folds pushed tightly together
- Smaller glottal pulse area
- Spectrum amplitude greater at high frequencies (1-2 kHz bulge)
- Spectrum lower at low frequencies

**Breathy Voicing:**
- Arytenoid cartilages separated
- Continuous airflow through posterior glottis
- Interarytenoid space: ~0.03 cm^2
- DC airflow: ~110 cm^3/s
- Spectrum ~6 dB weaker above 2000 Hz vs modal
- High-frequency amplitude 15 dB weaker than modal

### 2.7 LF Model Parameters (Fant et al., 1985)

**LF Model Derivative (Eq. 2.18):**
$$U'_g(t) = E_o e^{at} \sin 2\pi F_g t \quad \text{for } 0 < t < T_1$$

- T_1 = OQ x T_o
- OQ = open quotient (typically 0.5)
- T_2 = return time constant (typically 0.1 ms)

**Effect of OQ on Spectral Tilt:**
- OQ = 0.5: H1-H2 ~ -5 dB (modal)
- OQ = 0.7: H1-H2 ~ +5 dB (breathy)

### 2.8 Rosenberg/Klatt Model (Eq. 2.19)

$$U'_g(t) = a\left(2t - \frac{3t^2}{OQ \cdot T_o}\right)$$

Parameters: amplitude a, frequency 1/T_o, open quotient OQ, return time T_2

### 2.9 Conditions for Glottal Vibration

**Vibration Initiation (Eq. 2.10):**
$$P_s d_1 C'_1 > (-x_0)$$

Requirements:
- Subglottal pressure P_s sufficient
- Vocal fold thickness d_1 adequate
- Mechanical compliance C'_1 appropriate
- Vocal fold rest position x_0 allows movement

**Minimum glottal width for vibration:** ~0.12 cm
**Minimum transglottal pressure:** ~3 cm H2O

### 2.10 Effect of Vocal Tract Constriction

**Intraoral Pressure (Eq. 2.17):**
$$P_m = P_s \cdot \frac{1}{1 + \left(\frac{A_c}{A_g}\right)^2}$$

- Constriction area < 0.1-0.2 cm^2: significant effects on airflow waveform
- At 0.07 cm^2 constriction: vocal fold vibration ceases

### 2.11 Turbulence Noise Sources

**Three Mechanisms at Constriction:**
1. Free jet from constriction exit (dipole source)
2. Obstacle in airstream downstream (dipole source)
3. Fluctuations in airstream within constriction (monopole source)

**Sound Pressure Source Magnitude (Eq. 2.21):**
$$p_s = KU^3 A^{-2.5}$$

**Reference Spectrum Level:** ~212 dB (from Figure 2.33)

**Dipole vs Monopole Dominance:**
- Dipole: dominant at mid/high frequencies (>3 kHz)
- Monopole: dominant at low frequencies (<1.5 kHz)
- Dipole ~30 dB stronger than without obstacle

**Scaling Relationships:**
- Sound power proportional to U^6
- Pressure proportional to Delta-P^3
- Sound pressure proportional to Delta-P^(3/2) x A^(1/2)

### 2.12 Voiced vs Voiceless Fricative Noise

- Voiced fricative: intraoral pressure ~50% of subglottal
- Voiceless fricative: intraoral pressure ~80-90% of subglottal
- **Voiced fricative noise ~7 dB below voiceless**
- Calculation: 20 log(0.6^1.5) = 7 dB

### 2.13 Stop Release Transient Rules

**Initial Rate of Area Increase:**
| Place | Rate (cm^2/s) | Notes |
|-------|---------------|-------|
| Labial | 100 | Fastest |
| Alveolar | 50-100 | Variable |
| Velar | 25 | Slowest |

**Burst Duration (within 5 dB of max):** 9-19 ms depending on place
**Transient source magnitude:** comparable to glottal pulse at high frequencies (>1000 Hz)

**Transient Source Spectrum (p. 120):**
$$U(f) = \left|\frac{dU}{dt}\right|_0 \cdot \frac{1}{(2\pi f)^2}$$

### 2.14 Click Consonants

- Volume between constrictions: ~1 cm^3
- 10% volume expansion: ~100 cm H2O pressure decrease
- Release duration: ~20 ms
- Click transient amplitude ~11 dB greater than pulmonic stop at high frequencies
- Click low-frequency spectrum ~12 dB weaker than pulmonic stop

### 2.15 Trill Characteristics

- Tongue tip trill natural frequency: ~30 Hz
- Produces transient bursts spaced ~30 ms apart

---

## Chapter 3: Basic Acoustics of Vocal Tract Resonators (pp. 127-202)

### 3.1 Source-Filter Theory

**Output Spectrum:**
$$p_r(f) = S(f) \cdot T(f) \cdot R(f)$$

- S(f) = Source spectrum
- T(f) = Transfer function
- R(f) = Radiation characteristic

**Radiation Characteristic (Eq. 3.4):**
$$|R(f)| = \frac{f\rho}{2r}$$

Characteristic: +6 dB/octave up to ~4000 Hz

### 3.2 Transfer Function Form

**General Form (Eq. 3.16):**
$$T(s) = K \frac{(s-s_a)(s-s_b)(s-s_c)...}{(s-s_1)(s-s_2)(s-s_3)...}$$

**Complex Pole:**
$$s_n = \sigma_n + j2\pi F_n$$

**Bandwidth:**
$$B_n = \frac{|\sigma_n|}{\pi}$$

**Peak Amplitude at Resonance:** ~pi x f_n / sigma_n

**Above Peak:** amplitude falls at 12 dB/octave per pole

### 3.3 Uniform Tube Model

**Formant Frequencies (Eq. 3.39):**
$$F_n = \frac{2n-1}{4} \cdot \frac{c}{\ell}$$

**Standing Wave Distributions:**
$$p(x) = P_m \sin\frac{2\pi F_n x}{c}$$
$$U(x) = jP_m \frac{A}{\rho c} \cos\frac{2\pi F_n x}{c}$$

**Calculated Formants for Uniform Tube:**

| Speaker | Tract Length | F1 | F2 | F3 | F4 |
|---------|--------------|----|----|----|----|
| Adult female | 14.1 cm | 630 Hz | 1880 Hz | 3140 Hz | - |
| Adult male | 16.9 cm | 520 Hz | 1570 Hz | 2620 Hz | - |
| Adult male (corrected) | 17.7 cm | 500 Hz | 1500 Hz | 2500 Hz | 3500 Hz |

Radiation correction adds ~5% to effective length.

### 3.4 Helmholtz Resonator

**Natural Frequency (Eq. 3.42):**
$$f_1 = \frac{c}{2\pi}\sqrt{\frac{A_c}{V \ell_c}}$$

- V = volume behind constriction
- A_c = constriction cross-sectional area
- l_c = constriction length

### 3.5 Coupled Resonator Effects

**Frequency Shift (Eq. 3.44):**
$$f'_o \cong f_o \left(1 \pm \frac{2}{\pi}\sqrt{\frac{A_1}{A_2}}\right)$$

When natural frequencies are equal, coupling causes splitting.

### 3.6 Perturbation Theory

**Formant Shift from Local Area Change:**
- At pressure maximum: area decrease -> formant frequency **increase**
- At velocity maximum: area decrease -> formant frequency **decrease**
- At midpoint: no effect

**Number of zero crossings for formant n:** 2n-1 along tube length

**Lip Rounding:**
- Decreases cross-sectional area at open end
- Increases effective length
- **Decreases ALL formant frequencies**

**Larynx Position:**
- Lowering: increases tract length, decreases all formants
- Raising: decreases tract length, increases all formants

### 3.7 Formant Bandwidth Contributions

**Total Bandwidth Sources:**
$$B_{total} = B_r + B_w + B_v + B_h + B_c + B_g$$

| Source | Symbol | Frequency Dependence | Notes |
|--------|--------|----------------------|-------|
| Radiation | B_r | Increases as f^2 | Dominates at high freq |
| Wall losses | B_w | Decreases with freq | Dominates at low freq |
| Viscosity | B_v | Increases as sqrt(f) | Proportional to S/A |
| Heat conduction | B_h | Increases as sqrt(f) | Proportional to S/A |
| Constriction | B_c | Decreases with freq | - |
| Glottal opening | B_g | Greatest for F1 | - |

**Radiation Bandwidth (Eq. 3.40):**
$$B_r = \frac{f^2 A_m}{\ell c} K_s(f)$$
- K_s ~ 1.5 in 2000-6000 Hz range

**Viscosity Bandwidth (Eq. 3.49):**
$$B_v = \frac{R_v A}{2\pi\rho}$$
where $R_v = \frac{S}{A^2}\sqrt{\omega\rho\mu/2}$

### 3.8 Bandwidth Values for Uniform Tube (17.7 cm, 3 cm^2)

| Formant | Frequency | B_radiation | B_wall | B_viscosity | B_heat | B_total |
|---------|-----------|-------------|--------|-------------|--------|---------|
| F1 | 500 Hz | ~2 Hz | ~11 Hz | ~5 Hz | ~3 Hz | ~21 Hz |
| F2 | 1500 Hz | ~16 Hz | - | ~8 Hz | ~4 Hz | ~28 Hz |
| F3 | 2500 Hz | ~50 Hz | - | ~11 Hz | ~5 Hz | ~66 Hz |
| F4 | 3500 Hz | ~90 Hz | - | ~14 Hz | ~6 Hz | ~110 Hz |

**Table 3.1a: 15 cm tube, 3 cm^2 area:**
| Formant | Freq (Hz) | B_r | B_w | B_v | B_h | Total |
|---------|-----------|-----|-----|-----|-----|-------|
| F1 | 592 | 3 | 8 | 6 | 3 | 20 Hz |
| F2 | 1682 | 24 | 1 | 10 | 4 | 39 Hz |
| F3 | 2804 | 67 | 0 | 12 | 5 | 84 Hz |
| F4 | 3927 | 131 | 0 | 15 | 6 | 152 Hz |

### 3.9 Glottal Impedance Effects

**Glottal Impedance (Eq. 3.57):**
$$Z_g = R_g + j2\pi f M_g$$

**Glottal Contribution to F1 Bandwidth (Eq. 3.58):**
$$B_g = \frac{\rho c^2}{\pi l A R_g\left(1 + \frac{4\pi^2 f^2 M_g^2}{R_g^2}\right)}$$

**Key Values:**
- Average glottal area during open phase: ~0.06 cm^2
- Contribution to F1 bandwidth during open phase: ~120 Hz
- For breathy voicing: F1 bandwidth can approach F1 frequency
- Wide glottal opening (like /h/): F1 shift of 50-100 Hz upward

### 3.10 Wall Compliance Effects

**F1 with Wall Correction (Eq. 3.59):**
$$F_1 = \sqrt{(F_1')^2 + F_{1c}^2}$$

- F_1' = formant frequency with hard walls
- F_1c = lowest natural frequency with complete closure

**F_1c Values:**
- Adults: 150-200 Hz (Fant, 1972)
- Measured during bilabial stop closure: 180-190 Hz

### 3.11 Transfer Function for Different Sources

**Volume Velocity Source at Glottis:**
$$T(f) = \frac{1}{\cos kl}$$

Excites all modes maximally.

**Turbulence Noise Transfer Function:**
$$\left|\frac{U_o}{p_s}\right| = \left|\frac{A_t \sin kl_s}{\rho c \cos kl_t}\right|$$

Position-dependent excitation.

### 3.12 Peak-to-Valley Ratio

For uniform tube (15 cm female tract, 1180 Hz spacing, 80 Hz bandwidth):
$$\frac{2S}{\pi B} \approx 19 \text{ dB}$$

### 3.13 Nasal Coupling Effects

**Nasal Tract Properties:**
- Total length: ~11 cm
- Introduces pole-zero pairs in transfer function

**Nasal Pole-Zero Frequencies:**
| Configuration | Pole (Hz) | Zero (Hz) |
|---------------|-----------|-----------|
| Nasal murmur (labial) | ~250 | 1000-1200 |
| Nasal murmur (alveolar) | ~250 | 1600-1900 |
| Nasal murmur (velar) | all-pole | - |
| Sinus coupling | ~400, ~1300 | varies |

**Nasal Coupling Area Effects:**
- Small opening (0.1-0.2 cm^2): pole-zero pair at ~700 Hz
- Pole-zero separation: ~45 Hz
- Bandwidth perturbations: ~100 Hz

### 3.14 Subglottal Coupling

**Subglottal Pole Frequencies:**
| Pole | Female | Male |
|------|--------|------|
| 1 | ~700 Hz | ~600 Hz |
| 2 | ~1650 Hz | ~1550 Hz |
| 3 | ~2350 Hz | ~2200 Hz |

**Subglottal Bandwidths:** 200-400 Hz range

**Effect:** +/- 3 dB perturbations near subglottal resonances

### 3.15 Side Branch Effects (Laterals/Retroflexes)

**General:**
- Side branch introduces zeros at frequencies c/(4*l_s)
- For lateral/retroflex: total length l_1 + l_2 = 8-15 cm
- Most significant acoustic effects in 1200-2200 Hz range (F2-F3 region)

### 3.16 Sound Radiation from Mouth

**Radiation Pressure (Eq. 3.71):**
$$p_r = \frac{j\omega\rho U_o}{4\pi r}e^{-jkr}$$

**Directivity:**
- Below ~300 Hz: omnidirectional (monopole)
- Above ~300 Hz: directional effects increase gradually
- At 2 kHz: ~5 dB increase on axis vs simple source

---

## Chapter 4: Auditory Processing of Speechlike Sounds (pp. 203-241)

### 4.1 Ear Canal Properties

| Parameter | Value | Units |
|-----------|-------|-------|
| Ear canal length | ~2.5 | cm |
| Outer diameter | ~0.7 | cm |
| Cross-sectional area | ~0.4 | cm^2 |
| Resonance frequency | ~3000 | Hz |
| Gain at resonance | 15-20 | dB |

**Middle ear reflex:** Contracts when SPL > ~90 dB, decreasing transfer function by ~10 dB below 1 kHz

### 4.2 Cochlear Properties

| Parameter | Value | Units |
|-----------|-------|-------|
| Cochlear length | 35 | mm |
| Effective diameter | 1.3-2.2 | mm |
| Basilar membrane width (base) | 0.15-0.25 | mm |
| Basilar membrane width (apex) | 0.52 | mm |
| Stapes velocity at 1 kHz | 4 x 10^-5 | cm^3/s per dyne/cm^2 |

**Frequency-to-Place Mapping:**
- High frequencies: maximum near base (stapes end)
- Low frequencies: maximum near apex
- Midpoint (~1700 Hz): center of cochlea
- Below ~500 Hz: roughly linear
- Above ~500 Hz: logarithmic

**Time Delay:**
- Maximum ~3 ms for points near apex
- For signals >1000 Hz: delay <1 ms near base

### 4.3 Hair Cell and Nerve Properties

| Parameter | Value |
|-----------|-------|
| Outer hair cells | ~12,000 |
| Inner hair cells | ~3,500 |
| Auditory nerve fibers | ~30,000 |
| Afferent fibers per inner hair cell | ~8 |
| Resting potential | ~-70 mV |
| Spontaneous firing rate (most fibers) | 40-80 spikes/s |
| Maximum firing rate | 100+ spikes/s |

### 4.4 Just Noticeable Differences (JNDs)

**Amplitude JND:**
- Pure tones and wideband noise: 0.3-1.0 dB
- F2 formant peak: ~3 dB

**Bandwidth JND:**
- Narrow formants (BW ~50 Hz): 15-20 Hz
- Wider formants (BW ~100 Hz): 20-30 Hz
- Periodic excitation: 35-80 Hz

**Frequency JND:**
| Frequency | JND |
|-----------|-----|
| 1000 Hz | ~1 Hz |
| 2000 Hz | ~2 Hz |
| 4000 Hz | ~10 Hz |

**Formant Frequency JND:**
- Single-prominence vowel: 10-20 Hz (F1, F2)
- F2 in natural vowels: 20-100 Hz (depends on F1-F2 spacing)

**Duration JND:**
$$\Delta T \propto \sqrt{T}$$
- T = 100 ms: Delta T ~ 10 ms
- T = 200 ms: Delta T ~ 20 ms

**Temporal Order Threshold:** 15-20 ms separation required

### 4.5 Masking Effects

**Forward Masking:** extends ~50 ms after masker offset
**Backward Masking:** extends few ms before masker onset
**Critical Ratio:** ~17-18 dB (constant up to ~1 kHz)

### 4.6 Critical Bandwidth Formula (Eq. 4.1)

$$CB = 25 + 75[1 + 1.4f^2]^{0.69}$$
- f = frequency in kHz
- CB = critical bandwidth in Hz
- Accuracy: +/- 10%

**Critical Band Width:** ~100 Hz up to ~500 Hz center frequency, increases above

### 4.7 Bark Scale (24 Critical Bands)

| Bark | Center (Hz) | CB (Hz) | | Bark | Center (Hz) | CB (Hz) |
|------|------------|---------|--|------|------------|---------|
| 1 | 50 | 100 | | 13 | 1850 | 280 |
| 2 | 150 | 100 | | 14 | 2150 | 320 |
| 3 | 250 | 100 | | 15 | 2500 | 380 |
| 4 | 350 | 100 | | 16 | 2900 | 450 |
| 5 | 450 | 110 | | 17 | 3400 | 550 |
| 6 | 570 | 120 | | 18 | 4000 | 700 |
| 7 | 700 | 140 | | 19 | 4800 | 900 |
| 8 | 840 | 150 | | 20 | 5800 | 1100 |
| 9 | 1000 | 160 | | 21 | 7000 | 1300 |
| 10 | 1170 | 190 | | 22 | 8500 | 1800 |
| 11 | 1370 | 210 | | 23 | 10500 | 2500 |
| 12 | 1600 | 240 | | 24 | 13500 | 3500 |

### 4.8 Two-Formant Integration

**Critical Distance:** ~3.5 bark

When F_b - F_a < 3.5 bark:
- Listeners perceive single spectral prominence
- Perceived frequency F' depends on relative amplitudes
- Equal amplitudes: F' ~ (F_a + F_b)/2

---

# PART II: PHONEME-SPECIFIC ACOUSTICS

---

## Chapter 5: Phonological Representation (pp. 242-255)

### 5.1 Articulator-Free Features

| Feature | Definition |
|---------|------------|
| Vocalic | Forms syllable nucleus |
| Consonantal | Has oral closure or narrowing |
| Continuant | No complete oral closure |
| Sonorant | Spontaneous voicing possible |
| Strident | High-amplitude turbulence noise |

### 5.2 Articulator-Bound Features

**Oral Region:**
- Round, Anterior, Distributed, Lateral, High, Low, Back

**Pharyngeal-Laryngeal:**
- Nasal, Advanced tongue root, Constricted tongue root
- Spread glottis, Constricted glottis

**Surface Stiffness:**
- Stiff vocal folds, Slack vocal folds

### 5.3 Six Articulators

1. Lips
2. Tongue blade
3. Tongue body
4. Soft palate
5. Pharynx
6. Glottis/Vocal folds

### 5.4 Acoustic Landmarks

- **Vocalic landmarks:** Maxima in F1 amplitude/frequency (syllable nuclei)
- **Consonantal landmarks:** Abrupt acoustic discontinuities
- **Glide landmarks:** Minimum in low-frequency amplitude

---

## Chapter 6: Vowels (pp. 255-322)

### 6.1 Vowel Classification System

| Vowel | [high] | [low] | [back] |
|-------|--------|-------|--------|
| /i/ | + | - | - |
| /e/ | - | - | - |
| /ae/ | - | + | - |
| /a/ | - | + | + |
| /o/ | - | - | + |
| /u/ | + | - | + |

### 6.2 Formant Frequencies (Peterson & Barney 1952, Table 6.2)

| Vowel | F1 (M) | F2 (M) | F3 (M) | F1 (F) | F2 (F) | F3 (F) | F0 (M) | F0 (F) |
|-------|--------|--------|--------|--------|--------|--------|--------|--------|
| /i/ | 270 | 2290 | 3010 | 310 | 2790 | 3310 | 136 | 235 |
| /e/ | 460 | 1890 | 2670 | 560 | 2320 | 2950 | - | - |
| /ae/ | 660 | 1720 | 2410 | 860 | 2050 | 2850 | - | - |
| /a/ | 730 | 1090 | 2440 | 850 | 1220 | 2810 | - | - |
| /o/ | 450 | 1050 | 2610 | 600 | 1200 | 2540 | - | - |
| /u/ | 300 | 870 | 2240 | 370 | 950 | 2670 | - | - |

### 6.3 High Vowel Characteristics

**Distinguishing Features:**
- F1 low (250-350 Hz), close to F0
- F1-F0 spacing < 3 bark defines [+high]
- Narrow spectral dip below first spectral peak

**F1-F0 Bark Difference:**
| Vowel | Female | Male |
|-------|--------|------|
| /i/ | ~0.9 | ~1.4 |
| /u/ | ~1.6 | ~1.7 |
| /a/ | ~5.2 | ~5.2 |

**Speaker Adjustment:**
- High vowels produced with F0 10-20 Hz higher than non-high vowels
- This reduces F1-F0 difference, enhancing high vowel identification

### 6.4 Low Vowel Characteristics

- High F1 (600-800 Hz)
- Pharyngeal narrowing creates high F1
- Minimum cross-sectional area: 0.2-0.4 cm^2
- Lateral tongue edges contact lower teeth for stability

### 6.5 Front-Back Distinction

**Front Vowels:**
- Large F2-F1 spacing (>3.5 bark)
- "Empty" mid-frequency region between F1 and F2
- B2-B1 spacing: 2.1-4.7 bark

**Back Vowels:**
- Small F2-F1 spacing (<3.0 bark)
- F2 close to F1
- B3-B2 spacing: 1.1-2.3 bark

**Perceptual Boundary:**
- F2-F3 spacing < 3.0 bark: perceived as merged

### 6.6 Equivalent F2' (F2-prime)

For front vowels, F2' is effective high-frequency center of gravity formed by F2, F3, F4.

For back vowels, F2' = F2 (no clustering effect).

### 6.7 Rounding Effects

**Acoustic Consequences:**
- Decreases cross-sectional area at anterior end
- Lengthens front cavity
- Lowers ALL front-cavity resonance frequencies

**Specific Effects:**
- /i/ -> rounded: F2, F3, F4 all decrease
- Back vowels: F1 and F2 closer together
- F3 bandwidth decreases with rounding

### 6.8 Tense-Lax Distinction

**Tense (Peripheral) Vowels:**
- Extreme tongue positions
- More extreme formant values
- Form outer quadrilateral in F1-F2 space
- Longer duration

**Lax (Non-Peripheral) Vowels:**
- Less extreme positions
- Formants closer to neutral (schwa)
- Shorter duration

### 6.9 First Formant Equations for Vowels

**Helmholtz Approximation (Eq. 6.1):**
$$F_1' = \frac{c}{2\pi}\sqrt{\frac{A_c}{V\ell_c}}$$

**With Wall Correction (Eq. 6.2):**
$$F_1 = \sqrt{(F_1')^2 + F_c^2}$$
- F_c = 150-200 Hz for adults

### 6.10 Formant Bandwidths for Vowels

| Vowel Type | B1 Typical |
|------------|------------|
| High vowels (modal) | ~80 Hz |
| Open vowels | Higher (increased radiation) |
| Nasal vowels | +100-200 Hz |

### 6.11 Nasalization Effects

**Transfer Function for Nasalized Vowels (Eq. 6.3):**
$$T(s) = a \frac{(s - s_m)(s - s_m^*)}{s_m s_m^*} P(s) + (1-a) \frac{(s - s_n)(s - s_n^*)}{s_n s_n^*} P(s)$$

**Key Effects:**
1. Add nasal formant Fn between F1 and F2 (500-1000 Hz)
2. Add zero fz slightly above Fn
3. Zero-to-pole ratio fz/fm: 1.1-1.4
4. Widen F1 bandwidth by 100-200 Hz
5. Spectral flattening below 1200 Hz

**Table 6.3: Nasalized Vowel Parameters**
| Parameter | /o/ | /a/ (0.3 cm^2) | /a/ (0.8 cm^2) |
|-----------|-----|----------------|----------------|
| F1 non-nasal | 550 | 720 | 720 Hz |
| fn (nose zero) | 1625 | 1745 | 1500 Hz |
| fm (mouth zero) | 750 | 750 | 910 Hz |
| fz (calculated) | 820 | 810 | 1145 Hz |
| Fn (nasal pole) | 730 | 850 | 910 Hz |
| F1n (nasalized F1) | 540 | 600 | 640 Hz |

---

## Chapter 7: Stop Consonants (pp. 323-377)

### 7.1 Overview

Stop consonant production involves:
1. Closure (implosion)
2. Closure interval (hold)
3. Release (explosion)

**Closure Duration Minima:** 200-300 ms between successive maxima

### 7.2 Articulatory Movements

**Rate of Cross-Sectional Area Change:**
| Place | Rate (cm^2/s) |
|-------|---------------|
| Labial | 100 |
| Alveolar | 50-100 |
| Velar | 25 |

**Constriction Length:**
- Lips/tongue tip: few mm
- Tongue body: 1-2 cm

### 7.3 Aerodynamic Properties During Closure

| Parameter | Value | Units |
|-----------|-------|-------|
| Time before implosion with no effect | 3-10 | ms |
| Intraoral pressure at equilibrium | ~6 | cm H2O |
| Time to reach equilibrium | ~20 | ms |
| Glottal area increase during closure | 0.04 -> 0.14 | cm^2 |
| Average wall displacement | ~1 | mm |
| Wall displacement (8 cm H2O) | ~1 | mm |
| Volume increase after closure | ~8 | cm^3 |

### 7.4 Low-Frequency Output During Closure

**F1 During Closure:**
- Falls to ~200 Hz (wall compliance effect)
- With partially open glottis: ~180 Hz
- Sound radiated from face/neck surfaces

**Voicing During Closure:**
- Continues 25 ms with reduced amplitude (-10 dB)
- Voicing continuation time: 50-100 ms before pressure equilibrates
- Low-amplitude pulses: 10-20 ms

### 7.5 Initial Transient at Release

**Volume Flow Transient (Eq. 7.1):**
$$U(t) = \sqrt{\frac{2P_o}{\rho}} A_c(t)$$

When A_c(t) < 0.05 cm^2: viscous resistance dominates

### 7.6 F1 Trajectories by Place

| Place | Transition Time | Notes |
|-------|-----------------|-------|
| Labial | 10-20 ms | Most movement complete |
| Alveolar | 10 ms rapid + slow | Two-component |
| Velar | ~50 ms | Slowest |

### 7.7 Acoustic Event Sequence at Release (Figure 7.17)

| Phase | Time | Description |
|-------|------|-------------|
| 1 | 0-1 ms | Initial transient (volume velocity pulse) |
| 2 | 1-5 ms | Turbulence/frication at constriction |
| 3 | 5-15 ms | Aspiration noise at glottis |
| 4 | 2-15 ms | Voicing onset |
| 5 | 0-40 ms | Formant transitions to vowel |

**Turbulence Noise:**
- Maximum: 1-2 ms after release
- Decay: ~8 dB over 6 ms

### 7.8 Labial Stop Characteristics (/p/, /b/)

**Acoustic Features:**
- No front cavity resonance (burst relatively flat)
- All formants rise from closure values
- F2 falls into back vowels, rises into front vowels
- Burst amplitude ~17 dB less than alveolar

**Model Parameters (back vowel context):**
- A1 = 0.7 cm^2, A2 = 7.0 cm^2
- Overall length: 17 cm
- Coupled resonances: 800 Hz and 1180 Hz

### 7.9 Alveolar Stop Characteristics (/t/, /d/)

**Acoustic Features:**
- Front cavity (1.5-2.5 cm) creates resonance at ~4.5 kHz
- Burst emphasis in F4/F5 range
- Two-component transition: rapid F1/F2/F3 rise (10 ms), then slower F2 movement
- Burst amplitude +17 dB relative to labial

**Front Cavity:**
- Length: 1.5-2.5 cm
- Resonance: ~4500 Hz
- Bandwidth: ~600 Hz
- Frication 2 dB higher than burst

### 7.10 Velar Stop Characteristics (/k/, /g/)

**Acoustic Features:**
- F2-F3 convergence near closure ("velar pinch")
- Burst peak in F2/F3 range (~1500 Hz)
- Slowest transitions (~50 ms)
- Transient amplitude ~12 dB below labial
- Release-to-voicing time: ~22 ms (vs ~10 ms for labials)

**Constriction:**
- Length: 5-6 cm from lips
- For /i/ context: front cavity 2.5 cm, resonance 3.0-3.5 kHz

### 7.11 Burst Amplitude Differences

| Comparison | Difference |
|------------|------------|
| /d/ burst vs /b/ burst | +17 dB |
| /g/ burst vs /b/ burst | -12 dB |
| Aspirated vs unaspirated | +5 dB |

### 7.12 VOT (Voice Onset Time)

| Stop Type | VOT |
|-----------|-----|
| Voiceless aspirated | 50-60 ms |
| Voiceless unaspirated | <10 ms |
| Voiced | 0-10 ms (prevoicing possible) |

### 7.13 F0 Perturbations

| Context | F0 Change |
|---------|-----------|
| After voiceless stop | +5-10% initially |
| F0 fall after voicing onset | ~18 Hz over 20-30 ms |
| After voiced stop | -5-7% |

---

## Chapter 8: Obstruent Consonants (pp. 378-483)

### 8.1 Fricative Consonants - General

**Key Attributes:**
- Narrow constriction generating turbulence noise
- Glottal area ~2x supraglottal constriction area
- F1 ~400 Hz during constriction
- Transition duration: 30-40 ms

**Pressure Drop Equation:**
$$\Delta P_c = \frac{P_s}{1 + (A_c/A_g)^2}$$

If A_g = 2*A_c: Delta P_c ~ 80% of P_s

**Glottal Parameters During Fricatives:**
- Maximum glottal area: 0.18 + 0.14 = 0.32 cm^2
- Glottal width increase for 8 cm H2O: ~0.07 cm

### 8.2 Turbulence Noise Source for Fricatives

**Noise Amplitude:**
$$20 \log U^3 A_c^{-2.5}$$

Reference spectrum level: ~212 dB

**Optimal Constriction Area:** ~45% of glottal area (for maximum noise)

### 8.3 Labial Fricatives (/f/, /v/)

| Parameter | Value |
|-----------|-------|
| Constriction location | ~0.9 cm from lip edge |
| Front-cavity resonance | ~10 kHz |
| Frication vs F2 peak | -10 dB |
| Frication vs F3-F4 | -20 to -25 dB |
| F2 boundary frequency | ~200 Hz lower than vowel |

### 8.4 Alveolar Fricatives (/s/, /z/)

| Parameter | Value |
|-----------|-------|
| Source type | Dipole on incisors |
| Obstacle angle correction | -5 dB |
| Front cavity length (male) | 2.0 cm |
| Front cavity natural frequency | 4500 Hz |
| Frication vs alveolar burst | +2 dB |
| Subglottal resonance contribution | ~1800 Hz |

### 8.5 Palatoalveolar Fricatives (/sh/)

| Parameter | Value |
|-----------|-------|
| Total front cavity length | 8.5 cm |
| Palatal channel length | 4.7 cm |
| Sublingual cavity length | 2.6 cm |
| Lip cavity length | 1.2 cm |
| Lowest zero | ~1000 Hz |
| Second zero | ~3000 Hz |
| F2 (male) | ~1900 Hz |
| F2 (female) | ~2000 Hz |
| F3 prominence | ~2500 Hz |
| F4 prominence | ~3250 Hz |

### 8.6 Vowel-Fricative Spectral Differences

**Table 8.2: /f/ Differences (dB)**
| Parameter | Measured | Calculated |
|-----------|----------|------------|
| deltaA2 | 30(3) | 33 |
| deltaA3 | 19(6) | 23 |
| deltaA4 | 9(7) | 6 |
| deltaA5 | -19(6) | -16 |

**Table 8.3: /S/ Differences (dB)**
| Parameter | Measured | Calculated |
|-----------|----------|------------|
| deltaA2 | 15(4) | 19 |
| deltaA3 | -5(5) | 0 |
| deltaA4 | -6(7) | -10 |

### 8.7 Affricates (/ch/, /j/)

**Temporal Parameters:**
| Event | Duration |
|-------|----------|
| Initial release | 1-2 ms |
| Cross-sectional area increase | ~50 ms |
| Release to voicing onset | ~110 ms (range 85-160 ms) |
| Initial frication phase | ~10 ms |

**Three Phases:**
1. Initial brief transient with F4 peak (~3500 Hz), 6 dB less than alveolar stop
2. Early frication (0-10 ms): F4 dominant
3. Late frication (10-50 ms): F3 peak at ~2500 Hz

**Table 8.4: F4 Peak Amplitude (dB re vowel F4)**
| Time | Measured | Calculated |
|------|----------|------------|
| Initial transient | -3(7) | +6 |
| 10 ms after release | -5(6) | +3 |
| 50 ms after release | +9(4) | +9 |

### 8.8 Aspiration /h/

**Glottal Configuration:**
| Parameter | Value |
|-----------|-------|
| Maximum glottal area | ~0.25 cm^2 |
| Membranous portion length | ~1.5 cm |
| Cartilaginous portion length | ~0.3 cm |
| Peak airflow (8 cm H2O) | ~1000 cm^3/s |
| Complete modal-to-abducted cycle | ~200 ms |
| Peak flow duration | 100-200 ms |

**H1-H2 Difference:**
- Change during /h/ transition: 8-10 dB
- Transition duration: 40-50 ms
- Maximum change without voicing cessation: ~15 dB
- Breathy H2 reduction: ~6 dB

**Noise Source Location:**
- Distance from glottis: 1.0-2.5 cm (epiglottis/ventricular folds)
- Dipole source at 0.5, 1.5, 2.5 cm
- Monopole at glottis
- Epiglottis (3-5 kHz) dominates at high frequencies
- Monopole dominates below ~2 kHz

**Spectral Balance:**
- Above 3 kHz: noise can equal/exceed periodic source
- Below 2 kHz: periodic source dominant (at least 15 dB above noise)

**Bandwidth Effects:**
- B1 during /h/: ~280 Hz (vs ~70 Hz modal)
- B1 increase factor: 3-4x

**Tracheal Coupling (Table 8.5):**
| Pole | Female | Male |
|------|--------|------|
| P1 | 750 | -- |
| P2 | 1650 | 1550 |
| P3 | 2350 | 2200 |

### 8.9 Voiceless Aspirated Stops

**Timing Parameters:**
| Parameter | Value |
|-----------|-------|
| Voicing onset after release | 50-60 ms |
| Peak airflow (labial) | ~1000 cm^3/s |
| Critical glottal area for vibration | ~0.12 cm^2 |
| Frication duration (aspirated) | 6 ms |
| Frication duration (unaspirated) | 3 ms |

**Source Sequence:**
1. Transient (at release)
2. Frication (at/near constriction)
3. Aspiration (near glottis)

**Spectral Characteristics by Place:**
- Labial: spectrum slopes downward, weaker at F4/F5
- Alveolar: F4/F5 range > vowel (short front cavity)
- Velar: midfrequency peak at F2/F3

**Aspiration vs Vowel (dB):**
| Formant | Difference |
|---------|------------|
| F2 | -13 |
| F3 | -12 |
| F4 | -9 |
| F5 | 0 |

### 8.10 Voiced Obstruents

**Voicing Maintenance Methods:**
1. Lower larynx (4-6 mm for voiced stops)
2. Forward tongue root displacement (3-5 mm)
3. Passive wall displacement
4. Volume expansion (~15 cm^3 total)

**Glottal Pulse During Closure:**
- Amplitude proportional to Delta P^1.5
- Transglottal pressure ratio: 0.5-0.7 of vowel
- H1 amplitude: 5-9 dB below vowel

**Voiced vs Voiceless F0 Difference:**
- Voiced stop slackening: 5-7% F0 reduction
- Voiceless stop stiffening: 5-10% F0 increase
- Total difference: 10-15%

**Vocal Fold Stiffness Changes:**
- Decrease for voiced stops: 9-15%
- Slackening extends into following vowel

---

## Chapter 9: Sonorant Consonants (pp. 483-555)

### 9.1 Nasal Consonants - General

**Articulatory Characteristics:**
- Like stops but with velopharyngeal port open
- No pressure increase behind constriction
- Velopharyngeal opening: ~0.2 cm^2
- Total soft palate movement: 200-250 ms
- Velopharyngeal port open: ~200 ms

**Transfer Function Properties:**
- Lowest pole: 250-300 Hz (Helmholtz resonance)
- Pole bandwidth: ~100 Hz
- Zero-frequency gain: 1.5-4.0 dB above 0 dB
- Second pole: 750-1000 Hz

### 9.2 Nasal Consonant Zero Frequencies

| Place | Mouth Cavity | Lowest Zero |
|-------|--------------|-------------|
| Labial /m/ | Half tract length | 1000-1200 Hz |
| Alveolar /n/ | 5-6 cm | 1600-1900 Hz |
| Velar /ng/ | Very short | All-pole (no zero) |

### 9.3 Labial Nasal /m/

| Parameter | Value |
|-----------|-------|
| Lowest zero | 1000-1200 Hz |
| Average pole spacing | 650-750 Hz |
| F2 prominence at release | ~1500 Hz |
| A2 increase at release | ~17 dB |
| F2 rise over transition | ~200 Hz |
| Transition duration | ~15 ms |

### 9.4 Alveolar Nasal /n/

| Parameter | Value |
|-----------|-------|
| Mouth cavity length | 5-6 cm |
| Lowest zero | 1600-1900 Hz |
| F2 spectral peak (murmur) | ~850 Hz |
| F2 increase at release | ~17 dB |
| F2 frequency rise | ~200 Hz |
| Transition duration | ~10-15 ms |

### 9.5 Velar Nasal /ng/

| Parameter | Value |
|-----------|-------|
| Transfer function | All-pole (no zeros) |
| Poles | 250, 1200, 2100, 3200 Hz |
| 1800 Hz resonance | Prominent at release |
| Crossover time (mouth > nasal) | 10-15 ms |

### 9.6 Nasal Release Characteristics

**Universal Features:**
- Low-frequency prominence at ~250 Hz
- Weaker prominence at 750-1000 Hz
- At release: 15-20 dB amplitude jump in F2/F3 region
- Jump occurs over 10-20 ms

### 9.7 Glides - General

**Characteristics:**
- Constriction narrow but no turbulence
- Continuous voicing
- Minimum cross-sectional area: 0.17 cm^2
- A_c should be ~1.7x A_g

**F1 for Glides:**
$$F_1 = \sqrt{F_{1c}^2 + (F_1')^2}$$
- F_1c = 180 Hz (wall effect constant)
- Minimum F1: ~260 Hz

### 9.8 Labial Glide /w/

| Parameter | Value |
|-----------|-------|
| F1 minimum (male) | 255-298 Hz |
| F1 minimum (female) | 245-280 Hz |
| F2 at maximum constriction | ~700 Hz |
| F2 prominence vs F1 | >30 dB lower |
| F3 vs vowel | >30 dB lower |
| Transition duration | 100+ ms |
| Area change rate | ~10 cm^2/s |

### 9.9 Palatal Glide /j/

| Parameter | Value |
|-----------|-------|
| F1 minimum | ~250-253 Hz |
| F2 (calculated, l_b=10 cm) | 1770 Hz |
| F3 (calculated, l_f=6 cm) | 2950 Hz |
| F4 (calculated) | 3540 Hz |
| F3 bandwidth | 200-300 Hz |
| Energy concentration | 3-4 kHz |

### 9.10 Glide Amplitude Effects

**Table 9.1: Glide F1 and A1 Reduction**
| Speaker | /w/ F1 | /j/ F1 | A1 reduction (high V) | A1 reduction (non-high V) |
|---------|--------|--------|----------------------|--------------------------|
| Female | 280 | 253 | 12.2 dB | 6.9 dB |
| Male | 298 | 250 | 9.1 dB | 5.1 dB |

F1 is ~40 Hz lower before high vowels than non-high vowels.

### 9.11 Liquids - General

**Characteristics:**
- No significant pressure drop or turbulence
- Tongue creates bifurcation in acoustic path
- F1 slightly higher than glides (~400 Hz)
- Constriction area >= 0.17 cm^2

**F1 for Liquids (Table 9.2):**
| Speaker | F1 Range |
|---------|----------|
| Female | 350-480 Hz |
| Male | 330-430 Hz |

**Bandwidth:** ~80 Hz (20 Hz above baseline due to losses)

**A1 vs Vowel:** at least 7 dB below (2 dB freq, 5 dB bandwidth)

### 9.12 Retroflex /r/

**Articulatory:**
- Tongue blade raised, tip lowered (bunched) OR raised blade with sublingual space
- Front-cavity resonance F_R close to F2

**Formant Parameters (Table 9.2):**
| Speaker | F1 | F2 | F_R |
|---------|-----|------|------|
| Female | 360-480 | 1030-1240 | 1800-2050 Hz |
| Male | 330-430 | 880-1200 | 1380-1610 Hz |

**Acoustic Pattern:**
- Pair of spectral peaks in F2 range (1.5-2.5 kHz)
- Pole-zero pair creates "shoulder" on F2
- Back cavity: ~13.5 cm
- Front cavity: ~8 cm^3
- At release: F_R and Z_R merge, amplitude rise 10-20 dB over 40 ms

### 9.13 Lateral /l/

**Articulatory:**
- Tongue blade contact at midline
- Lateral edges NOT in contact (side branch)
- Side branch length: ~2.5 cm
- Side branch volume: ~2-3 cm^3

**Pole-Zero Structure:**
- Cluster of 3 poles and 1 zero in 2500-4000 Hz
- Zero at ~3400-4000 Hz
- Creates broad irregular high-frequency prominence

**Formant Parameters (Table 9.3):**
| Position | Speaker | F1 | F2 | Delta-A1 | Delta-A2 | Delta-A3 |
|----------|---------|-----|------|----------|----------|----------|
| Prestressed | Female | 350 | 1180 | 6 dB | 13 dB | 14 dB |
| Prestressed | Male | 360 | 900 | 9 dB | 13 dB | 12 dB |
| Poststressed | Female | - | - | 2 dB | 5 dB | 3 dB |
| Poststressed | Male | - | - | 1 dB | 5 dB | 3 dB |

**Calculated Spectrum (Figure 9.44):**
- Poles: 360 (160), 1100 (140), 2800 (150), 3500 (300), 3900 (1000), 4500
- Zero: 3400 (300)

### 9.14 Liquid Transition Timing

- Acoustic influence extends 200-250 ms in intervocalic position
- Similar to glides in this respect
- Prestressed position shows larger formant changes than poststressed

---

## Chapter 10: Context Effects (pp. 556-581)

### 10.1 Consonant Sequences at Syllable Onset

**Stop + Liquid Clusters:**
| Cluster | VOT | Notes |
|---------|-----|-------|
| /dr/ | ~50 ms | Constriction maintained |
| /pl/ | ~80 ms | Labial release to voicing |
| Simple CV voiced | ~10 ms | Burst duration |

**Fricative + Stop Clusters:**
- /sp/: front-cavity resonance ~5.9 kHz (1.5 cm cavity)
- Lip area decrease rate: ~50 cm^2/s
- Lip closure time: ~20 ms
- Front-cavity Helmholtz: 2.5-3.5 kHz (female)

### 10.2 Voicing Modifications Across Syllables

**Timing:**
- Voicing assimilation extends 200-250 ms
- Time from fricative to stop release: ~120 ms
- Glottis modal return: 20-30 ms after /k/ onset
- VOT after /k/: ~50-60 ms

**Amplitude Changes:**
- Following voiceless: additional 10 dB reduction in glottal amplitude
- Noise reduction: 5-10 dB relative to voiced environment

### 10.3 Vowel Coarticulation

**Timing Constraints:**
- Tongue body back-to-front: ~100 ms
- Complete cycle (back-front-back): 200-300 ms
- If vowel < 200-300 ms: consonants influence throughout

**Average Vowel Durations in /h-d/ Context:**
- 150-350 ms
- Lax vowels at lower end

**F2 Undershoot:**
- Lax vowel /I/ with blade consonants: F2 ~200 Hz lower than null context

### 10.4 Reduced Vowels (Schwa)

**Duration:**
- Typical: ~50 ms
- Minimum: ~30 ms (e.g., third vowel in "monopoly")
- Articulator movement: 130-140 ms (shorter than full vowels)

**Maximum Oral Opening:** ~0.3 cm^2

**Formant Frequencies:**

**Table 10.2: Schwa in Context**
| Utterance | Female F1 | Female F2 | Male F1 | Male F2 |
|-----------|-----------|-----------|---------|---------|
| "pass a dip" | 494 | 1785 | 423 | 1491 Hz |
| "rub a book" | 410 | 1071 | 488 | 912 Hz |

**Calculated F1 (with Helmholtz + wall correction):** ~330 Hz

### 10.5 Glottalization

- Syllable-final alveolar stop before velar often produced with glottalization
- Alveolar closure may be omitted
- Tongue body articulator for velar becomes articulator for preceding consonant

---

# PART III: IMPLEMENTATION GUIDE

---

## Voice Source Implementation

### Source Spectrum Parameters

| Parameter | Klatt Equivalent | Typical Value | Notes |
|-----------|------------------|---------------|-------|
| Fundamental frequency | F0 | 125 Hz (M), 230 Hz (F) | Modal voice |
| Open quotient | OQ | 0.5 (modal), 0.7 (breathy) | Controls H1-H2 |
| Spectral tilt | TL | 0-50 dB | -6 dB/octave above 500 Hz |
| Amplitude of voicing | AV | 0-80 dB | Glottal flow amplitude |
| Amplitude of aspiration | AH | 0-80 dB | Aspiration noise |
| Amplitude of frication | AF | 0-80 dB | Turbulence noise |

### Spectral Tilt Guidelines

| Voice Quality | H1-H2 | High-Freq Reduction |
|---------------|-------|---------------------|
| Modal (OQ=0.5) | -5 dB | - |
| Breathy (OQ=0.7) | +5 dB | 6-15 dB above 2 kHz |
| Pressed | lower | boost 1-2 kHz |

---

## Transfer Function Implementation

### Formant Bandwidth Rules

| Formant | Baseline | During /h/ | Nasalization | During closure |
|---------|----------|------------|--------------|----------------|
| B1 | 50-80 Hz | 280 Hz (3-4x) | +100-200 Hz | high (damping) |
| B2 | 50-80 Hz | - | - | - |
| B3 | 80-150 Hz | - | - | - |
| B4 | 150+ Hz | - | - | - |

### Bandwidth Variation with Voicing

- During glottal open phase: add ~120 Hz to F1 bandwidth
- F1 bandwidth greatest for high vowels
- F3+ bandwidth increases with frequency (radiation dominates)

---

## Stop Consonant Implementation

### Release Event Timing

| Place | Rate (cm^2/s) | F1 Transition | Burst Character |
|-------|---------------|---------------|-----------------|
| Labial | 100 | 10-20 ms | Flat |
| Alveolar | 50 | 10 ms + slow | F4/F5 peak at 4.5 kHz |
| Velar | 25 | ~50 ms | F2/F3 peak |

### Burst Amplitude Relative to Vowel

| Formant Region | Labial | Alveolar | Velar |
|----------------|--------|----------|-------|
| F2 | similar | +17 dB | similar |
| F4/F5 | lower | +15-20 dB | - |

### F1 During Closure

Set F1 to ~200 Hz (wall compliance effect).

---

## Fricative Implementation

### Noise Source Level

$$AF = 20 \log U^3 A_c^{-2.5}$$

Reference: 212 dB

### Front-Cavity Resonance

| Fricative | Front Cavity | Resonance | Peak Location |
|-----------|--------------|-----------|---------------|
| /f/ | 0.9 cm | ~10 kHz | Flat below 5 kHz |
| /s/ | 2.0 cm | 4500 Hz | F4/F5 range |
| /sh/ | 8.5 cm (total) | 2500, 3250 Hz | F3/F4 range |

---

## Nasal Implementation

### Nasal Murmur Parameters

| Parameter | Labial /m/ | Alveolar /n/ | Velar /ng/ |
|-----------|------------|--------------|------------|
| Low-freq pole | 250 Hz | 250 Hz | 250 Hz |
| Low-freq zero | 1000-1200 Hz | 1600-1900 Hz | None (all-pole) |
| Pole bandwidth | 100 Hz | 100 Hz | 100 Hz |

### Nasal Release Transition

- Duration: 10-20 ms
- F2/F3 amplitude increase: 15-20 dB
- F2 frequency rise: ~200 Hz

---

## Glide and Liquid Implementation

### Glide Parameters

| Parameter | /w/ | /j/ |
|-----------|-----|-----|
| F1 minimum | ~260 Hz | ~260 Hz |
| F2 at minimum | ~700 Hz | near F3 |
| Transition duration | 100+ ms | 100+ ms |
| A1 reduction | 5-12 dB | 5-12 dB |

### Liquid Parameters

| Parameter | /r/ | /l/ |
|-----------|-----|-----|
| F1 | 330-480 Hz | 350-360 Hz |
| F2 | 880-1240 Hz | 900-1180 Hz |
| Additional resonance | F_R at 1380-2050 Hz | cluster 2800-4500 Hz |
| Associated zero | above F_R | at ~3400 Hz |
| Release amplitude rise | 10-20 dB / 40 ms | abrupt |

---

## Timing Parameters Summary

### Duration Guidelines

| Event | Duration |
|-------|----------|
| Minimum syllable (stressed) | 200 ms |
| Glottal cycle (male) | 8 ms |
| Glottal cycle (female) | 4.3 ms |
| Aspiration interval | 50 ms |
| VOT (aspirated) | 50-60 ms |
| VOT (unaspirated) | <10 ms |
| Stop closure | 50-100 ms |
| Glide transition | 100+ ms |
| Liquid acoustic influence | 200-250 ms |
| Soft palate cycle | 200-250 ms |
| Full coarticulation window | 200-300 ms |
| Schwa duration | 30-50 ms |

---

## F0 Perturbation Rules

| Context | F0 Change | Duration |
|---------|-----------|----------|
| After voiceless stop | +5-10% | initial 20-30 ms |
| F0 fall after voiceless | ~18 Hz | 20-30 ms |
| After voiced stop | -5-7% | - |
| High vowel | +10-20 Hz | intrinsic |

---

## Key Figure References

| Figure | Page | Content | Use |
|--------|------|---------|-----|
| 2.9 | 68 | Derivative of glottal flow | Source spectrum |
| 2.28 | 98 | LF model waveform | OQ, T2 parameters |
| 3.9 | 140 | Standing wave distributions | Perturbation theory |
| 3.32 | 171 | Vowel spectrum envelopes | Formant amplitudes |
| 6.1 | 257 | Formant bandwidth vs freq | BW parameters |
| 6.4 | 263 | Spectra of /i/, /u/, /a/ | Target patterns |
| 6.17 | 287 | F1-F2 vowel space | Vowel targets |
| 7.11 | 335 | F1 trajectories stops | Transition timing |
| 7.17 | 348 | Stop release sequence | Source timing |
| 8.9 | 388 | Fricative noise amplitudes | AF/AH timing |
| 8.34 | 424 | Glottal area for /h/ | AH trajectory |
| 9.5 | 491 | Nasal pole-zero trajectories | Nasal parameters |
| 10.7 | 571 | Voicing assimilation | Coarticulation |

---

## Open Questions for Implementation

1. **Subglottal Coupling:** Pole-zero pairs at 600, 1550, 2200 Hz from subglottal resonances. Perceptually significant enough to add?

2. **Wall Compliance During Closures:** F1 drops to ~180-200 Hz. Current implementation may not capture correctly.

3. **Breathy Voice Turbulence:** During breathy voicing, turbulence noise becomes comparable to periodic source above 3 kHz. Should AH be increased during breathy phonation?

4. **Liquid Pole-Zero Pairs:** Retroflex /r/ and lateral /l/ require specific pole-zero configurations. Current implementation uses formants only.

5. **Coarticulation Extent:** 200-250 ms windows documented. Current interpolation may be too short or too linear.

6. **Critical Distance for Formant Integration:** When formants within 3.5 bark, listeners perceive single prominence. Should synthesis account for this?

7. **Ear Canal Resonance:** 15-20 dB boost at ~3 kHz. Should synthesizer pre-compensate?

---

## References for Parameter Verification

- Peterson & Barney (1952): Canonical vowel formants
- Klatt (1980): Synthesizer parameters
- Fant (1960, 1972): Vocal tract modeling
- Klatt & Klatt (1990): Voice source modeling
- LF model: Fant et al. (1985)

---

*Document generated from Stevens (1998) Acoustic Phonetics, MIT Press.*
*Total source material: 607 pages across 10 chapters.*
