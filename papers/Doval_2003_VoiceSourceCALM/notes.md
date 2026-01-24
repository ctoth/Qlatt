# The Voice Source as a Causal/Anticausal Linear Filter

**Authors:** Boris Doval, Christophe d'Alessandro, Nathalie Henrich
**Year:** 2003
**Venue:** VOQUAL'03, Geneva, August 27-29, 2003
**HAL ID:** hal-00371680

## One-Sentence Summary

Proposes the CALM (Causal-Anticausal Linear Model) which unifies time-domain and spectral approaches to glottal flow modeling by treating the voice source as a mixed causal/anticausal linear filter with 2 anticausal poles (glottal formant) and 1 causal pole (spectral tilt).

## Problem Addressed

Time-domain glottal flow models (LF, Rosenberg, etc.) and spectral models used in linear prediction seemed incompatible:
- Spectral models assume causal linear filters, but their impulse responses don't resemble actual glottal waveforms
- Time-domain models use nonlinear functions (polynomials, exponentials) with model-specific parameters, lacking unified spectral analysis

## Key Contributions

1. Shows glottal flow can be modeled as impulse response of a **mixed causal-anticausal linear filter**
2. Identifies the "glottal formant" - a spectral maximum in low frequencies controlled by open quotient
3. Demonstrates that LF model's open phase is a **truncated anticausal** impulse response
4. Provides complete digital filter design equations for the CALM
5. Links CALM parameters to voice quality perception (tense/lax, loud/weak)

## Methodology

### Glottal Flow Model (GFM) Parameters

Five universal parameters characterize most GFMs:

| Symbol | Name | Description |
|--------|------|-------------|
| $E$ | Maximum excitation | Value of glottal flow derivative at max excitation |
| $T_0$ | Fundamental period | Period of one glottal cycle |
| $O_q$ | Open quotient | Ratio of open phase to period |
| $\alpha_m$ | Asymmetry coefficient | Ratio of opening duration to period |
| $T_a$ or $TL$ | Spectral tilt | Time constant (LF) or attenuation at 3000Hz (Klatt) |

## Key Equations

### GFM Derivative Spectrum (Abrupt Closure)

For abrupt closure ($TL = 0$ or $T_a = 0$):

$$
U'_g(t) = E \cdot n'_g\left(\frac{t}{O_q T_0}; \alpha_m\right) * \perp\!\!\!\perp_{T_0}(t)
$$

Fourier transform:

$$
\widetilde{U'_g}(f) = E O_q T_0 \tilde{n}'_g(f O_q T_0; \alpha_m)(F_0 \perp\!\!\!\perp_{F_0}(f))
$$

### Asymptotic Behavior

Near DC and high frequencies:

$$
\widetilde{U'_g}(f) \xrightarrow{f=0} I 2\pi f
$$

$$
\widetilde{U'_g}(f) \xrightarrow{f \to +\infty} \frac{E}{2\pi f}
$$

Where $I$ is total flow over one period.

### Glottal Formant Frequency and Amplitude

$$
F_g = \frac{1}{2\pi} \sqrt{\frac{E}{I}} = \frac{f_g(\alpha_m)}{O_q T_0}
$$

$$
A_g = \sqrt{EI} = E O_q T_0 a_g(\alpha_m)
$$

Where $f_g(\alpha_m)$ and $a_g(\alpha_m)$ are model-dependent functions of asymmetry.

### With Spectral Tilt (Smooth Closure)

Additional -6 dB/oct slope after cutoff $F_c$:

$$
\widetilde{U'_g}(f) \xrightarrow{f \to +\infty} \frac{E 2\pi F_c}{(2\pi f)^2}
$$

### LF Model as Truncated Linear Filter

Open phase transfer function (Laplace domain):

$$
H_1(s) = -E_0 e^{(a-s)T_e} \frac{(s-a)\sin(\omega_g T_e) + \omega_g \cos(\omega_g T_e)}{(s-(a+j\omega_g))(s-(a-j\omega_g))}
$$

Where:
- $a$ is positive (anticausal poles in right half-plane)
- Poles at $a + j\omega_g$ and conjugate
- Zero at $a - \omega_g \cot g(\omega_g T_e)$

### CALM Digital Filter Design

**Anticausal pole position** (glottal formant):

$$
p = a_p + / - j b_p
$$

$$
a_p = -\frac{\pi}{O_q T_0 \tan(\pi \alpha_m)}
$$

$$
b_p = \frac{\pi}{O_q T_0}
$$

**Digital filter transfer function:**

$$
H(z) = \frac{b_1 z}{1 + a_1 z + a_2 z^2}
$$

**Filter coefficients** ($T_e$ is sampling period):

$$
a_1 = -2 e^{-a_p T_e} \cos(b_p T_e)
$$

$$
a_2 = e^{-2 a_p T_e}
$$

$$
b_1 = E \frac{\pi^2}{b_p^3} e^{-a_p T_e} \sin(b_p T_e)
$$

**Recurrence equation** (compute in **reversed time direction**):

$$
y_n = -a_1 y_{n+1} - a_2 y_{n+2} + b_1 x_{n+1}
$$

### Spectral Tilt Filter (Causal)

$$
H(z) = \frac{b_{TL}}{1 - a_{TL} z^{-1}}
$$

Where:

$$
a_{TL} = \nu - \sqrt{\nu^2 - 1}
$$

$$
b_{TL} = 1 - a_{TL}
$$

$$
\nu = 1 - \frac{1}{\eta}
$$

$$
\eta = \frac{e^{-TL/10.0 + a_2(10.0)}}{\cos(2\pi \frac{3000}{F_s}) - 1} - 1
$$

## Parameters

| Name | Symbol | Units | Typical Range | Notes |
|------|--------|-------|---------------|-------|
| Open quotient | $O_q$ | ratio | 0.3-1.0 | 0.3 = pressed, 1.0 = soft |
| Asymmetry coefficient | $\alpha_m$ | ratio | 0.6-0.8 | Controls glottal formant Q |
| Maximum excitation | $E$ | volume velocity/s | - | Amplitude scaling |
| Fundamental period | $T_0$ | seconds | 1/F0 | - |
| Spectral tilt | $TL$ | dB | 0-24 | Attenuation at 3000 Hz |
| Sampling period | $T_e$ | seconds | 1/Fs | Digital filter param |

### Glottal Formant Frequency Values

- Soft phonation ($O_q \approx 1$): $F_g \approx 0.75 \times F_0$
- Pressed phonation ($O_q \approx 0.3$): $F_g \approx 3 \times F_0$

### Dynamic Range

- Glottal formant amplitude: ~20 dB dynamic range for reasonable $\alpha_m$ (0.6-0.8) and $O_q$ (0.35-1.0)
- Model-dependent variation: 10 dB to 22 dB among different GFMs

## Implementation Details

### Synthesis Process

1. Design filter using equations 8-20
2. **Two options:**
   - Convolve impulse response with train of impulses at period $T_0$
   - Filter spectral comb at $F_0$ with filter amplitude/phase responses
3. **Critical:** Compute anticausal part in **reversed time direction**

### Stability Conditions

- **Causal filter:** poles must be inside unit circle
- **Anticausal filter:** poles must be **outside** unit circle
- **Mixed filter:** convergence region is annulus containing unit circle (Figure 7)

### Truncation Effects

Truncation in time domain:
- Equivalent to convolving spectrum with sinc function
- Induces regularly spaced zeros and ripples
- Asymptotic -12 dB/oct slope preserved (Figure 10)

### Algorithm for GFM Generation

```
1. Given: E, T0, Oq, αm, TL, Fs
2. Compute pole position:
   ap = -π / (Oq * T0 * tan(π * αm))
   bp = π / (Oq * T0)
3. Compute Te = 1/Fs
4. Compute filter coefficients:
   a1 = -2 * exp(-ap * Te) * cos(bp * Te)
   a2 = exp(-2 * ap * Te)
   b1 = E * (π² / bp³) * exp(-ap * Te) * sin(bp * Te)
5. Initialize output buffer y[]
6. Place impulse x[closure_sample] = 1
7. Filter BACKWARDS from closure:
   for n = closure_sample down to 0:
     y[n] = -a1 * y[n+1] - a2 * y[n+2] + b1 * x[n+1]
8. Apply spectral tilt filter FORWARD:
   for n = 0 to end:
     y_tilt[n] = bTL * y[n] + aTL * y_tilt[n-1]
```

## Figures of Interest

- **Fig 1 (p2):** GFM derivative with 5 parameters labeled
- **Fig 2 (p2):** Amplitude spectrum stylization: +6, -6, -12 dB/oct slopes
- **Fig 3 (p3):** Effect of $O_q$ - spectrum scales by $1/O_q$
- **Fig 4 (p3):** Effect of $\alpha_m$ - controls glottal formant Q factor
- **Fig 5 (p3):** Phase spectrum shows increasing phase (anticausal evidence)
- **Fig 6 (p3):** R++ model vs anticausal filter impulse response - both skewed right
- **Fig 7 (p4):** Convergence region for mixed causal/anticausal filter
- **Fig 8 (p4):** Pole-zero plot of extended LF open phase
- **Fig 9 (p5):** CALM pole configuration: 2 anticausal + 1 causal
- **Fig 10 (p5):** Truncation effects on spectrum

## Results Summary

### Voice Quality Perception Mapping

| CALM Component | Spectral Feature | Perceptual Quality |
|----------------|------------------|-------------------|
| Causal pole(s) | Spectral tilt | Loud/weak |
| Anticausal poles | Glottal formant position | Tense/lax |

Key insight: Tenseness and loudness can be varied **independently** in both model and actual voice production.

### Source Parameter Estimation

- Open quotient estimation via LPC of inverse filtered speech works well for low $O_q$, underestimates high values
- Caveat: If glottal flow is linear filter, inverse filtering validity is questionable (can't distinguish glottal formant from low vocal tract formants)
- Promising approach: Separate causal/anticausal parts directly using differential phase spectra [ref 5]

## Limitations

1. Model assumes quasi-periodic voicing (doesn't handle noise/aspiration natively)
2. Truncation effects add spectral ripples (Figure 10)
3. Inverse filtering becomes theoretically problematic if source is linear
4. LPC may erroneously capture glottal formant in "filter" estimate
5. Relationship between CALM parameters and perceptual voice quality needs systematic study

## Relevance to Project

**Direct relevance to Klatt synthesizer:**

1. **Glottal source modeling:** CALM provides alternative to Klatt's polynomial glottal source
2. **Parameter mapping:** $O_q$, $\alpha_m$ map to Klatt's AV, OQ parameters
3. **Spectral tilt:** TL parameter directly corresponds to Klatt's TL
4. **Voice quality:** Explains relationship between source parameters and tense/lax, loud/weak qualities
5. **Implementation insight:** Anticausal filtering explains why glottal waveforms are right-skewed

**Key implementation insight:** The "glottal formant" frequency is proportional to $F_0/O_q$, so it tracks fundamental frequency. For $O_q = 0.5$, glottal formant is at $\approx 1.5 \times F_0$.

## Open Questions

- [ ] How does CALM compare perceptually to Klatt's polynomial source?
- [ ] Can anticausal filtering be approximated efficiently for real-time synthesis?
- [ ] What is the relationship between CALM's $\alpha_m$ and Klatt's skewness parameters?
- [ ] Does separating causal/anticausal components improve voice quality modification?

## Related Work Worth Reading

- [8] Fant G., Liljencrants J., Lin Q. "A four-parameter model of glottal flow." STL-QPSR, 85(2):1-13, 1985. **(LF model definition)**
- [13] Klatt D. and Klatt L. "Analysis, synthesis, and perception of voice quality variations." JASA, 87(2):820-857, 1990. **(Klatt voice quality)**
- [5] Bozkurt B. & Dutoit T. "Mixed-phase speech modeling using differential phase spectrums." VOQUAL'03 **(Causal/anticausal separation)**
- [17] Veldhuis R. "A computationally efficient alternative for the LF model" JASA 103:566-571, 1998. **(R++ model)**
