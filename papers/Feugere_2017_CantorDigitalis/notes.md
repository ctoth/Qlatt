# Cantor Digitalis: Chironomic Parametric Synthesis of Singing

**Authors:** Lionel Feugère, Christophe d'Alessandro, Boris Doval, Olivier Perrotin
**Year:** 2017
**Venue:** EURASIP Journal on Audio, Speech, and Music Processing
**DOI:** 10.1186/s13636-016-0098-5

## One-Sentence Summary

A complete parametric formant synthesizer for real-time singing with spectral voice source model (glottal formant + spectral tilt), parallel formant vocal tract with anti-resonance, and comprehensive source/filter dependency rules linking f0, vocal effort, and formants.

## Problem Addressed

Creating a performative singing synthesizer that allows real-time expressive musical control with high-quality vocal sounds, using chironomic (hand gesture) control via graphic tablet.

## Key Contributions

1. Complete parametric formant synthesizer architecture with spectral voice source model
2. Comprehensive mapping rules between control parameters and synthesis parameters
3. Source/filter dependencies: f0-dependent formant tuning, vocal effort effects on spectral tilt
4. Hypo-pharynx anti-resonance modeling via notch filter
5. Long-term perturbations (heartbeat, slow noise) for naturalness

## Architecture Overview

Three-layer system:
1. **Interface** - Graphic tablet with pen (pitch, effort) and finger (vowels)
2. **Rules** - High-level to low-level parameter mapping
3. **Synthesizer** - Parametric formant synthesis

## Key Equations

### Voice Source Model

The overall vocal sound spectrum:

$$
S(f) = G'(f) \cdot V(f)
$$

Where $G'$ is glottal flow derivative, $V$ is vocal tract.

### Glottal Formant Transfer Function (Eq. 2)

$$
GF(z) = \frac{-A_g z^{-1}(1 - z^{-1})}{1 - 2e^{-\pi B_g T_s} \cos(2\pi F_g T_s) z^{-1} + e^{-2\pi B_g T_s} z^{-2}}
$$

Where:
- $A_g$ = voice source amplitude
- $F_g$ = glottal formant center frequency (Hz)
- $B_g$ = glottal formant bandwidth (Hz)
- $T_s$ = sampling period (1/96000 s)

### Spectral Tilt Filter (Eqs. 3-5)

$$
ST(z) = ST_1(z) \times ST_2(z)
$$

$$
ST_i(z) = \frac{1 - (\nu_i - \sqrt{\nu_i^2 - 1})}{1 - (\nu_i - \sqrt{\nu_i^2 - 1})z^{-1}}, \quad i = 1, 2
$$

$$
\nu_i = 1 - \frac{\cos(2\pi \cdot 3000 \cdot T_s) - 1}{10^{T_{l_i}/10} - 1}
$$

Where $T_{l_i}$ = attenuation in dB at 3000 Hz.

### Vocal Tract Resonator (Eq. 6)

$$
R_i(z) = \frac{A_i(1 - e^{-\pi B_i T_s})(1 - e^{-\pi B_i T_s} z^{-2})}{1 - 2e^{-\pi B_i T_s} \cos(2\pi F_i T_s) z^{-1} + e^{-2\pi B_i T_s} z^{-2}}
$$

Where:
- $F_i$ = formant center frequency (Hz)
- $B_i$ = formant bandwidth (Hz)
- $A_i$ = formant amplitude (dB)

### Anti-Formant (Notch Filter) (Eqs. 7-9)

$$
BQ(z) = \frac{1 + \beta_{BQ} z^{-1} + z^{-2}}{1 + \alpha_{BQ} + \beta_{BQ} z^{-1} + (1 - \alpha_{BQ}) z^{-2}}
$$

$$
\alpha_{BQ} = \frac{\sin(2\pi F_{BQ} T_s)}{2Q_{BQ}}
$$

$$
\beta_{BQ} = -2\cos(2\pi F_{BQ} T_s)
$$

Default: $F_{BQ} = 4700$ Hz, $Q_{BQ} = 2.5$ (piriform sinus anti-resonance)

### Glottal Formant Parameters from Voice Quality (Eqs. 14-15)

$$
F_g = \frac{f_0}{2O_q}
$$

$$
B_g = \frac{f_0}{O_q \tan(\pi(1 - \alpha_m))}
$$

Where:
- $O_q$ = open quotient (0.1 to 1)
- $\alpha_m$ = asymmetry coefficient (0.51 to 0.9)

### Open Quotient from Tension (Eq. 16)

$$
O_q = \begin{cases}
10^{-2(1-O_{q_0})T} & \text{if } T \leq 0.5 \\
10^{2O_{q_0}(1-T)-1} & \text{if } T > 0.5
\end{cases}
$$

Where:
- $O_{q_0} = 0.903 - 0.426E_p$ for M=1 (chest)
- $O_{q_0} = 0.978 - 0.279E_p$ for M=2 (falsetto)

### Asymmetry Coefficient from Tension (Eq. 17)

$$
\alpha_m = \begin{cases}
0.5 + 2(\alpha_{m_0} - 0.5)T & \text{if } T \leq 0.5 \\
0.9 - 2(0.9 - \alpha_{m_0})(1 - T) & \text{if } T > 0.5
\end{cases}
$$

Where:
- $\alpha_{m_0} = 0.66$ for M=1
- $\alpha_{m_0} = 0.55$ for M=2

### Spectral Tilt from Vocal Effort (Eqs. 18-19)

$$
T_{l_1} = \begin{cases}
27 - 21E_p \text{ dB} & \text{for } M = 1 \\
45 - 36E_p \text{ dB} & \text{for } M = 2
\end{cases}
$$

$$
T_{l_2} = \begin{cases}
11 - 11E_p \text{ dB} & \text{for } M = 1 \\
20 - 18.5E_p \text{ dB} & \text{for } M = 2
\end{cases}
$$

### Voicing Amplitude (Eq. 20)

$$
A_g = \begin{cases}
0 & \text{if } E_p \leq E_{thr} - 0.05 \cdot p_{hon} \\
\left((1 - C_{A_g})\frac{E_p - E_{thr}}{1 - E_{thr}} + C_{A_g}\right)(1 + R \cdot \mathcal{N}_R)/O_q & \text{otherwise}
\end{cases}
$$

Where:
- $E_{thr} = 0.2$ (phonation threshold)
- $C_{A_g} = 0.2$ (amplitude at threshold)
- $R$ = roughness parameter (shimmer)
- $\mathcal{N}_R$ = Gaussian noise (unity variance)

### Fundamental Frequency with Perturbations (Eq. 12)

$$
f_0 = 440 \cdot 2^{(P_0 + 35P + p_{heart} + p_{slow} - 69)/12}(1 + 0.3R\mathcal{N}_R)
$$

Where:
- $P_0$ = pitch offset (semitones, 69 = A440)
- $P$ = normalized pitch (0-1, maps to 35 semitones)
- $p_{heart}$ = heartbeat perturbation
- $p_{slow}$ = slow pink noise perturbation
- Jitter term: $0.3R\mathcal{N}_R$ (max 30% jitter)

### Heartbeat Perturbation (Eq. 11)

$$
p_{heart} = A_{heart} e^{-\beta t} \begin{cases}
\cos(8\pi f_c t - \frac{\pi}{2}) & \text{for } t \in [0, \frac{1}{4f_c}] \\
\cos(4\pi f_c t + \frac{\pi}{2}) & \text{for } t \in [\frac{1}{4f_c}, \frac{1}{f_c}]
\end{cases}
$$

Where:
- $\beta = 0.001$ ms⁻¹ (damping)
- $f_c = 1$ Hz (heartbeat frequency)
- $A_{heart}$ = 0.15 ST (low effort) to 0.01 ST (high effort)

### Vocal Tract Length Scaling (Eqs. 22-24)

$$
\alpha_S = 1.7S + 0.5
$$

$$
K = 1.25 \times 10^{-4} f_0 + 0.975
$$

$$
F_i = K \cdot \alpha_S \cdot F_{iG}(V, H) \quad \text{for } i \in [1, 6]
$$

Where:
- $S$ = vocal tract size parameter (0-1)
- $\alpha_S$ = scale factor (0.5 to 2.2)
- $K$ = larynx position factor (~10% shift from 200-1000 Hz)

### First Formant Tuning (Eq. 25)

$$
F_1 = \max\left(f_0 + 50 \text{ Hz}, K\alpha_S F_{1G}(V,H) + \frac{140}{1-E_{thr}}E - 70 \text{ Hz}\right)
$$

Includes:
- Tuning to f0 for high-pitched singing (soprano)
- ~3.5 Hz/dB increase with vocal effort (140 Hz range over 40 dB)

### Second Formant Tuning (Eq. 26)

$$
F_2 = \max(2f_0 + 50 \text{ Hz}, K\alpha_S F_{2G}(V,H))
$$

Tuning to 2f0 for high-pitched voices.

### Formant Amplitude Attenuation (Eq. 27)

$$
\text{if } |(k+1)f_0 - F_i| < \Delta F_i: \quad A_i = A_{iG} - \left(1 - \frac{|(k+1)f_0 - F_i|}{\Delta F_i}\right) \cdot Att_{max_i}
$$

Where:
- $\Delta F_i$ = 15-100 Hz (frequency window, linear in f0)
- $Att_{max_i}$ = 10-25 dB (max attenuation, linear in f0)
- Applied to first 3 formants when harmonic k∈[0,7] approaches Fi

## Parameters

### High-Level Control Parameters (Table 1)

| Name | Symbol | Range | Control | Description |
|------|--------|-------|---------|-------------|
| Pitch | P | 0-1 | stylus x | Maps to 35 semitones |
| Vocal effort | E | 0-1 | stylus pressure | Dynamics control |
| Vowel height | H | 0-1 | finger y | Open/close axis |
| Vowel backness | V | 0-1 | finger x | Front/back axis |
| Roughness | R | 0-1 | GUI | Jitter/shimmer |
| Tension | T | 0-1 | GUI | Lax/tense voice |
| Breathiness | B | 0-1 | GUI | Aspiration noise |
| Vocal tract size | S | 0-1 | GUI | Maps to 0.5-2.2x scale |
| Pitch offset | P0 | semitones | GUI | 69 = A440 |
| Mechanism | M | 1, 2 | GUI | Chest/falsetto |

### Low-Level Synthesis Parameters (Table 4)

| Parameter | System | Description | Unit |
|-----------|--------|-------------|------|
| f0 | Voice source GF | Fundamental frequency | Hz |
| Fg | Voice source GF | Glottal formant center frequency | Hz |
| Bg | Voice source GF | Glottal formant bandwidth | Hz |
| Ag | Voice source GF | Voice source amplitude | 1 |
| Tl1, Tl2 | Voice source ST | Voice source spectral tilt | dB |
| An | Noise source NS | Aspiration noise amplitude | 1 |
| F1-F6 | Vocal tract R1-R6 | Formant center frequency | Hz |
| B1-B6 | Vocal tract R1-R6 | Formant bandwidth | Hz |
| A1-A6 | Vocal tract R1-R6 | Formant amplitude | dB |
| FBQ | Vocal tract BQ | Anti-formant center frequency | Hz |
| QBQ | Vocal tract BQ | Anti-formant quality factor | 1 |

### Generic Voice Formant Values (Table 3)

French vowels measured from tenor voice:

| Vowel | V | H | F1 | F2 | F3 | F4 | F5 | B1 | B2 | B3 | B4 | B5 |
|-------|---|---|----|----|----|----|----|----|----|----|----|----|
| /i/ | 1 | 0 | 215 | 1900 | 2630 | 3170 | 3710 | 10 | 18 | 20 | 30 | 40 |
| /e/ | 1 | 1/3 | 410 | 2000 | 2570 | 2980 | 3900 | 10 | 15 | 20 | 30 | 40 |
| /ɛ/ | 1 | 2/3 | 590 | 1700 | 2540 | 2800 | 3900 | 10 | 15 | 30 | 50 | 40 |
| /y/ | 1/2 | 0 | 250 | 1750 | 2160 | 3060 | 3900 | 10 | 10 | 20 | 30 | 40 |
| /œ/ | 1/2 | 1/3 | 350 | 1350 | 2250 | 3170 | 3900 | 10 | 10 | 20 | 30 | 40 |
| /ø/ | 1/2 | 2/3 | 620 | 1300 | 2520 | 3310 | 3900 | 10 | 10 | 20 | 30 | 40 |
| /u/ | 0 | 0 | 290 | 750 | 2300 | 3080 | 3900 | 10 | 10 | 20 | 30 | 40 |
| /o/ | 0 | 1/3 | 440 | 750 | 2160 | 2860 | 3900 | 10 | 12 | 20 | 30 | 40 |
| /ɔ/ | 0 | 2/3 | 610 | 950 | 2510 | 2830 | 3900 | 10 | 12 | 20 | 30 | 40 |
| /a/ | - | 1 | 700 | 1200 | 2500 | 2800 | 3600 | 13 | 13 | 40 | 60 | 40 |

F6 = 2×F4, A6 = -15 dB, B6 = 150 Hz (constant)

### Voice Type Presets (Table 2)

| Voice | P0 | M | S | B | R | T |
|-------|----|----|------|------|------|------|
| Bass | 32 | 1 | 0.21 | 0.2 | 0.06 | 0.5 |
| Tenor | 44 | 1 | 0.29 | 0.15 | 0.06 | 0.5 |
| Alto | 44 | 1 | 0.32 | 0.1 | 0.06 | 0.5 |
| Soprano | 56 | 2 | 0.35 | 0.1 | 0.06 | 0.5 |
| Bulgarian Soprano | 56 | 1 | 0.53 | 0.1 | 0.06 | 0.66 |
| Baby | 68 | 2 | 0.59 | 0.1 | 0.06 | 0 |

## Implementation Details

### Sampling Rate
- $T_s = 1/96000$ s (96 kHz)

### Noise Source
- Unvoiced component: Gaussian white noise filtered by 2nd-order Butterworth bandpass (1000-6000 Hz)
- Modulated by glottal flow derivative for mixed voice qualities

### Signal Flow
1. **Glottal source**: Pulse train → Glottal formant (GF) → Spectral tilt (ST)
2. **Noise**: White noise → Bandpass (NS) → Modulated by glottal source
3. **Combined source**: Voiced + noise components
4. **Vocal tract**: 6 parallel formant filters (Ri) → Anti-formant cascade (BQ)

### Lip Radiation
- Modeled as differentiation, incorporated into glottal formant filter (the z^-1(1-z^-1) term)

### Phonation Threshold
- $E_{thr} = 0.2$ with hysteresis of 0.05 for smooth onset/offset
- Below threshold: only aspiration noise

### Interpolation
- Vowels between canonical points use 2D bilinear interpolation
- All formant parameters (F, B, A) interpolated together

## Figures of Interest

- **Fig. 2 (p.7):** Complete system architecture showing interface, rules, and synthesizer blocks
- **Fig. 3 (p.10):** Open quotient Oq vs tension T and effort E for both mechanisms
- **Fig. 4 (p.10):** Asymmetry coefficient αm vs tension T for both mechanisms
- **Fig. 5 (p.11):** Glottal flow derivative spectra showing effect of E and T
- **Fig. 7 (p.15):** Spectrograms of different voice types (bass, Bulgarian soprano, whisper, bells)

## Limitations

1. **Vowels only** - Consonants handled separately in "Digitartic" system
2. **No automatic voice learning** - Presets must be manually configured
3. **French vowel targets** - May need adjustment for other languages
4. **Fixed 6 formants** - Not dynamically configurable

## Relevance to Qlatt Project

### Direct Applications
1. **Spectral tilt model** - Two-stage lowpass filter more sophisticated than Klatt's single TL parameter
2. **Glottal formant equations** - Alternative to Klatt's Rg/Oq parameterization
3. **Formant amplitude attenuation** - Rule to prevent harmonic-formant resonance artifacts (Eq. 27)
4. **F1/F2 tuning rules** - Formant tuning to f0 harmonics for soprano singing
5. **Long-term perturbations** - Heartbeat and slow noise for naturalness
6. **Anti-formant (BQ)** - Piriform sinus modeling at ~4700 Hz

### Key Differences from Klatt
1. **Parallel-only formants** (not cascade+parallel hybrid)
2. **Spectral domain glottal model** (magnitude only, not LF time domain)
3. **Different parameterization** - Open quotient Oq and asymmetry αm instead of Klatt's RG/OQ
4. **No nasal tract** - Vowels only
5. **No frication sources** - Vowels only

### Implementation Considerations
- Their 96 kHz sample rate is higher than typical speech synthesis
- Spectral tilt parameters tied to specific 3000 Hz reference
- Formant amplitude units in dB (relative to first formant)

## Open Questions

- [ ] How does Eq. 27 formant attenuation compare to practice? Values seem empirical
- [ ] What determines the ±50 Hz offset in F1/F2 tuning equations?
- [ ] How was 4700 Hz chosen for piriform sinus anti-resonance?
- [ ] How do the Oq/αm → Fg/Bg equations compare to LF model fitting?

## Related Work Worth Reading

- Doval et al. (2006) - "The spectrum of glottal flow models" - CALM model details
- Henrich et al. (2005) - "Glottal open quotient in singing" - Oq measurements
- Sundberg papers on singing formant and formant tuning
- LF model paper: Fant, Liljencrants, Lin (1985)
