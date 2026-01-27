# Frequency Domain Interpretation and Derivation of Glottal Flow Parameters

**Authors:** Gunnar Fant & Qiguang Lin
**Year:** 1988
**Venue:** STL-QPSR, Vol. 29, No. 2-3, pp. 1-21
**Institution:** KTH Royal Institute of Technology, Stockholm

## One-Sentence Summary
Establishes the theoretical framework for relating LF model time-domain parameters to frequency-domain spectral characteristics, enabling both synthesis parameter control and analysis through inverse filtering.

## Problem Addressed
- Time-domain LF parameters (Tp, Te, Ta, etc.) don't directly reveal their spectral consequences
- Need to understand how source parameters affect formant amplitudes and spectral tilt
- Frequency-domain inverse filtering can derive LF parameters without high-fidelity low-frequency recording
- Source-filter separation is ambiguous; what's "source" vs "filter" affects parameter interpretation

## Key Contributions
1. **Complete derivation of LF model spectrum** from time-domain parameters
2. **Normalized parameter set** (Rg, Rk, Ra, Qo) that's F0-independent
3. **Spectral tilt parameter Fa** = 1/(2πTa) as primary voice quality control
4. **Frequency-domain inverse filtering** technique for parameter extraction
5. **Quantitative male/female voice differences** explained through LF parameters

## The LF Model (Recap with Frequency Insights)

### Time-Domain Equations

For $t < T_e$:
$$E(t) = E_0 e^{\alpha t} \sin(\omega_g t)$$

For $T_e < t < T_c$:
$$E(t) = -\frac{E_e}{\varepsilon T_a} \left[ e^{-\varepsilon(t-T_e)} - e^{-\varepsilon(T_c-T_e)} \right]$$

### Normalized Parameters (Fig. 1, page 4)

| Parameter | Definition | Meaning | Typical Range |
|-----------|------------|---------|---------------|
| $R_g$ | $F_g / F_0$ | Glottal frequency ratio | 0.7 - 1.6 |
| $R_k$ | $(T_e/T_p) - 1$ | Steepness factor | - |
| $R_a$ | $T_a / T_0$ | Normalized return time | - |
| $Q_o$ | $(T_e + T_a) / T_0$ | Open quotient | 0.3 - 0.8 |
| $Q_o'$ | $T_e / T_0$ | Alternative open quotient | - |
| $F_g$ | $1 / (2T_p)$ | Glottal frequency | ~100-200 Hz |
| $F_a$ | $1 / (2\pi T_a)$ | Return phase cutoff | 100-3000 Hz |

Where:
- $T_p$ = time of positive flow peak
- $T_e$ = time of maximum excitation (glottal closure)
- $T_a$ = return time constant (effective duration of return phase)
- $T_0$ = fundamental period
- $F_0$ = fundamental frequency

## Key Equations

### Fundamental Spectral Relations

**Source-Filter-Radiation Model (Eq. 2-4):**
$$P(s) = G(s) \cdot H(s) \cdot R(s)$$

$$|R(\omega)| = \frac{\rho \omega}{4\pi a} \cdot k_T(\omega)$$

Where $\rho$ = air density (1.14 g/cm³), $a$ = lip-microphone distance (cm), $k_T(\omega)$ ≈ 1 (head baffle correction, ~5 dB from 300-4000 Hz).

**Voice Fundamental Amplitude (Eq. 5):**
$$A_0 = U_0 \cdot k \cdot \pi \cdot F_0 \cdot \frac{\rho}{4\pi a}$$

Where $U_0$ = peak glottal flow, $k$ = open quotient correction factor:
- k = 1 for Qo = 0.5
- k = -1 dB for Qo = 0.4
- k = -3 dB for Qo = 0.3
- k = +0.6 dB for Qo = 0.6-0.8

**Excitation-to-Formant Relation (Eq. 6-7):**
$$A_i = E_e \cdot \frac{\rho}{4\pi a}$$

$$\frac{A_i}{A_0} = \frac{E_e}{U_0} \cdot \frac{1}{k \pi F_0}$$

**Formant Spectrum Peak (Eq. 8):**
$$A_s = A_i \cdot \frac{F_0}{\pi B_n}$$

Where $B_n$ = formant bandwidth.

### The Critical Ee/Uo Ratio (Eq. 11)

$$\frac{E_e}{U_0} = \frac{A_k'(f)}{A_0} \cdot \pi^2 \cdot k \cdot F_0$$

This is the **key equation** for frequency-domain parameter extraction. $A_k'(f)/A_0$ is the spectral level at frequency f vs. fundamental in a +12 dB/oct compensated spectrum.

### Flow-to-Derivative Relation (Eq. 14)

$$U_0 = \frac{2}{\pi} T_p \cdot E_i = \frac{E_i}{\pi F_g} = \frac{E_i}{\pi F_0 \cdot R_g}$$

Error in $U_0$: +2% at $E_e/E_i$=2, +11% at $E_e/E_i$=4.

### Spectral Tilt from Ta (Eq. 16)

$$A_k' = A_k'' \cdot (1 + f^2/F_a^2)^{1/2}$$

Where $F_a = 1/(2\pi T_a)$ is the return phase cutoff frequency.
- **Fa acts as a first-order low-pass filter** on the source spectrum
- This is the **main parameter for spectral slope change**

### Typical Fa Values (from text)

| Voice Type | Fa Range |
|------------|----------|
| Breathy voice, voiced [h] | ~100 Hz |
| Average female vowels | 500-1500 Hz |
| Average male vowels | 1000-3000 Hz |

### Bandwidth Increase from Glottal Flow (Eq. 20)

$$\Delta B(t) = B_{ref} \cdot U_g(t) / 55$$

Where $U_g(t)$ is glottal flow in cm³/sec. This predicts bandwidth increase during open phase.

## Parameters

| Name | Symbol | Units | Male Typical | Female Typical | Notes |
|------|--------|-------|--------------|----------------|-------|
| Peak glottal flow | $U_0$ | cm³/sec | 420 | 210 | From Fant 1959 data |
| Excitation amplitude | $E_e$ | 10³ cm³/sec² | 360 | 190 | Negative peak of dU/dt |
| Flow/excitation ratio | $U_0/E_e$ | ms | 1.15 | 1.10 | Remarkably constant M/F |
| Excitation ratio | $E_e/E_i$ | - | 3.2 | 2.2 | Fant 1987 data |
| Glottal frequency ratio | $R_g$ | - | 1.1-1.2 | 0.9-1.0 | Fg/F0 |
| Steepness | $R_k$ | % | 28-30 | 30 | (Te/Tp)-1 |
| Return phase cutoff | $F_a$ | Hz | 1000-3000 | 430-2000 | 1/(2πTa) |
| Fundamental frequency | $F_0$ | Hz | 125 | 217 | Sustained vowels |

## Implementation Details

### Frequency-Domain Inverse Filtering (Eq. 17)

$$L_k'(f) = L(f) + 20\log_{10}(f/F_0) - 20\log_{10}\left[ K_{rr} \cdot (f) \cdot \prod_{n=1}^{r} |H_n(f)| \right]$$

Where:
- $L(f)$ = input spectrum level (dB)
- First term = +6 dB/oct differentiation
- Second term = formant inverse filtering

**Higher Pole Correction (Eq. 18):**
$$k_{rr} = 0.433 x_1^2 + 0.000712 x_1^4$$
$$x_1 = f/f_{ref} = c/(4\ell)$$

Scale to vocal tract length derived from F4: $\ell_e = (7/4) \cdot (c/F_4)$

### Formant Transfer Function

$$|H_n(f)| = [(1-x_n^2)^2 + x_n^2/Q_n^2]^{-1/2}$$
$$x_n = f/F_n$$

### Procedure for Parameter Extraction

1. **Measure harmonic spectrum** with absolute calibration
2. **Inverse filter** each formant using estimated Fn, Bn
3. **Differentiate** (+6 dB/oct or +12 dB/oct for flow derivative)
4. **Estimate Fa** from spectral tilt above 2·Fg
5. **Calculate Uo** from fundamental amplitude using Eq. 5
6. **Calculate Ee/Uo** from upper harmonic levels using Eq. 11
7. **Estimate Rg** by matching first three harmonics

## Figures of Interest

- **Fig. 1 (page 4):** LF model waveform with all parameter labels, plus normalized parameter definitions
- **Fig. 2 (page 6):** Wave shapes and spectral changes with varying Ta - shows Fa low-pass effect
- **Fig. 3 (page 7):** Flow, derivative, and spectra at varying Ee/Ei with constant Uo
- **Fig. 4 (page 9):** Flow shapes at constant Uo AND Ee, varying Rg/Rk
- **Fig. 5 (page 9):** Basic analytical relations diagram - key summary figure
- **Fig. 11-12 (page 19):** Frequency domain inverse filtering examples for male/female [a:]
- **Fig. 13 (page 20):** Selective F1 inverse filtering showing Fa variation from [h] to vowel

## Key Insights for Synthesis

### Spectral Balance Control

1. **Uo determines low-frequency level** (fundamental region)
2. **Ee determines high-frequency level** (above 2·Fg)
3. **Fa (via Ta) controls spectral tilt** - the main voice quality knob
4. **Rg affects only 2nd-3rd harmonic balance** - subtle effect

### Male vs Female Differences Explained

Despite similar Uo/Ee ratios:
- Females have **5 dB higher F0** → compensates for 5 dB lower Ee
- Females have **lower Fa** (longer Ta) → steeper spectral tilt
- Result: Similar formant amplitudes but different spectral slope

### Perceptual Importance Ranking

1. **Ta/Fa** - Most dramatic effect (breathy vs pressed)
2. **Ee** - Overall excitation strength
3. **Uo** - Fundamental amplitude
4. **Rg, Rk** - Subtle, barely audible in [a] context

## Relevance to Project

**HIGH relevance for Qlatt's LF source:**

1. **Fa = 1/(2πTa) is THE voice quality parameter** - should be primary control in semantics
   - Current: Qlatt uses OQ, SQ parameters
   - Better: Direct Fa control for spectral tilt

2. **The spectral tilt filter** - Ta creates a first-order low-pass
   - Already implicit in LF model
   - Could add explicit Fa parameter to semantics for easier voice quality control

3. **Ee/Uo ratio is constant across male/female** (~1.1 ms)
   - Simplifies parameter rules - can derive one from the other

4. **Bandwidth increase during voicing** (Eq. 20)
   - $\Delta B = B_{ref} \cdot U_g / 55$
   - Could improve formant bandwidth modeling during voiced segments

5. **Frequency-domain inverse filtering equations** (Eq. 17-18)
   - Useful if building analysis tools
   - Higher pole correction formula for accurate formant estimation

## Limitations

- Assumes linear source-filter (ignores acoustic interaction)
- Fa determination can be ambiguous with spectral irregularities
- Some formulas assume small Ta (εTa close to 1)
- Absolute calibration difficult in practice

## Open Questions

- [ ] Should Qlatt expose Fa directly as a voice quality parameter?
- [ ] How does current OQ mapping relate to Fa?
- [ ] Could the bandwidth increase formula (Eq. 20) improve synthesis?

## Related Work Worth Reading

- **Fant, Liljencrants, & Lin (1985)** - Original LF model paper (already have)
- **Fant (1960)** - Acoustic Theory of Speech Production (the book)
- **Gobl (1988)** - Voice Source Dynamics in Connected Speech
- **Holmberg, Hillman, & Perkell (1988)** - Glottal flow measurements
- **Sundberg & Gauffin (1979)** - Glottal voice source waveform and spectrum
