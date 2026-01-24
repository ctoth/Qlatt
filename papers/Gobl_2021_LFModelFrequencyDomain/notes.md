# The LF Model in the Frequency Domain for Glottal Airflow Modelling without Aliasing Distortion

**Authors:** Christer Gobl
**Year:** 2021
**Venue:** INTERSPEECH 2021, Brno, Czechia
**DOI:** http://dx.doi.org/10.21437/Interspeech.2021-1625

## One-Sentence Summary

Provides closed-form frequency-domain equations for the LF glottal source model that eliminate aliasing distortion when generating discrete-time voice source waveforms.

## Problem Addressed

Discrete-time implementations of continuous-time glottal flow models (LF, Fujisaki-Ljungqvist, Rosenberg) introduce aliasing distortion because the source spectrum is not bandlimited. This distortion:
- Creates spurious inharmonic frequency components when Fs is not a multiple of f0
- Alters harmonic amplitudes and phases even when Fs is a multiple of f0
- Worsens at low sampling frequencies and high f0 (e.g., female/child voices)
- Changes dynamically as f0 varies during speech

## Key Contributions

1. Complete Laplace transform of the LF model (open phase + return phase)
2. Closed-form expressions for amplitude and phase spectra
3. Method to generate alias-free discrete LF pulses via IDFT
4. No anti-aliasing filters or postfiltering required

## Methodology

**Five-step process:**
1. Obtain Laplace transform for each piecewise function of the model
2. Derive frequency response by substituting s → jω
3. Derive closed-form expressions for overall spectrum using phasor arithmetic
4. Sample the spectrum up to Nyquist frequency to get ideal discrete spectrum
5. Compute IDFT to get the sampled glottal pulse

## Key Equations

### LF Model Time-Domain Definition (recast with te = 0)

$$
U'_g(t) = \begin{cases}
-E_e \dfrac{e^{\alpha t} \sin(\omega_g(t + T_e))}{\sin \omega_g T_e} & -T_e \leq t < 0 \\[2ex]
-E_e \dfrac{e^{-\varepsilon t} - e^{-\varepsilon T_b}}{1 - e^{-\varepsilon T_a}} & 0 \leq t < T_b
\end{cases}
$$

Where:
- $E_e$ = amplitude of main glottal excitation (negative peak)
- $T_e$ = duration of open phase
- $\omega_g$ = glottal angular frequency = $2\pi R_g f_0$
- $\alpha$ = exponential growth rate during open phase (estimated iteratively)
- $\varepsilon$ = exponential decay rate during return phase
- $T_b$ = duration of return phase
- $T_a$ = effective duration of return phase

### Auxiliary Parameter Relationships

$$
E_0 = -E_e \cdot e^{-\alpha T_e} / \sin \omega_g T_e
$$

$$
T_a = (1 - e^{-\varepsilon T_b}) / \varepsilon
$$

### R-Parameter Conversions

$$
T_e = \frac{1 + R_k}{2 R_g f_0}
$$

$$
\omega_g = 2\pi R_g f_0
$$

### Laplace Transform - Open Phase

$$
H_{LFopen}(s) = \frac{E_e \csc \omega_g T_e \left( \cos \omega_g T_e - e^{(s-\alpha)T_e} \right)}{[s - (\alpha + j\omega_g)] \times [s - (\alpha - j\omega_g)]}
$$

### Laplace Transform - Return Phase

$$
H_{LFret}(s) = -E_e \frac{s - \varepsilon e^{-\varepsilon T_b}(1 - e^{-\varepsilon T_b})^{-1}(1 - e^{-sT_b})}{s(s + \varepsilon)}
$$

### Complete LF Model Transform

$$
H_{LF}(s) = H_{LFopen}(s) + H_{LFret}(s)
$$

### Amplitude Spectrum - Open Phase

$$
A_o(f) = E_e \times \frac{\sqrt{[\text{Re}_1(f)]^2 + [\text{Im}_1(f)]^2}}{\sqrt{\alpha^2 + (2\pi f - \omega_g)^2} \sqrt{\alpha^2 + (2\pi f + \omega_g)^2}}
$$

Where:
$$
\text{Re}_1(f) = \omega_g \left( \cot \omega_g T_e - e^{-\alpha T_e} \frac{\cos 2\pi f T_e}{\sin \omega_g T_e} \right) - \alpha
$$

$$
\text{Im}_1(f) = 2\pi f - \omega_g e^{-\alpha T_e} \frac{\sin 2\pi f T_e}{\sin \omega_g T_e}
$$

### Phase Spectrum - Open Phase

$$
\phi_o(f) = \text{atan2}(\text{Im}_1(f), \text{Re}_1(f)) - \text{atan2}(2\pi f - \omega_g, -\alpha) - \text{atan2}(2\pi f + \omega_g, -\alpha)
$$

### Amplitude Spectrum - Return Phase

$$
A_r(f) = E_e \times \frac{\sqrt{[\text{Re}_2(f)]^2 + [\text{Im}_2(f)]^2}}{2\pi f \sqrt{\varepsilon^2 + (2\pi f)^2}}
$$

Where:
$$
\text{Re}_2(f) = \frac{\varepsilon e^{-\varepsilon T_b}}{1 - e^{-\varepsilon T_b}} (1 - \cos 2\pi f T_b)
$$

$$
\text{Im}_2(f) = \frac{\varepsilon e^{-\varepsilon T_b}}{1 - e^{-\varepsilon T_b}} \sin 2\pi f T_b - 2\pi f
$$

### Phase Spectrum - Return Phase

$$
\phi_r(f) = \text{atan2}(\text{Im}_2(f), \text{Re}_2(f)) - \text{atan2}(2\pi f, \varepsilon) - \frac{\pi}{2}
$$

### Combined LF Model Spectrum (Phasor Addition)

$$
A_{LF}(f) = \sqrt{A_o^2 + A_r^2 + 2 A_o A_r \cos(\phi_o - \phi_r)}
$$

$$
\phi_{LF}(f) = \text{atan2}(A_o \sin \phi_o + A_r \sin \phi_r, A_o \cos \phi_o + A_r \cos \phi_r)
$$

### atan2 Function Definition

$$
\text{atan2}(y, x) = \arctan\left(\frac{y}{x}\right) \cdot \text{sgn}(x)^2 + \pi \left( \frac{1 - \text{sgn}(x)}{2} \right) \left( 1 + \text{sgn}(y) - \text{sgn}(y)^2 \right)
$$

### Discrete Spectrum Sampling

Replace continuous frequency $f$ with discrete samples:
$$
f_k = \frac{k F_s}{N} \quad \text{for } k = 0, 1, 2, \ldots, N/2 - 1
$$

Where:
- $F_s$ = sampling frequency
- $N$ = FFT size (must be > samples needed for glottal pulse)

### IDFT Normalization

$$
\text{Normalization factor} = \frac{F_s}{N}
$$

### Multiple Pulse Concatenation

For pulse n starting at time $t_{start,n}$, add linear phase component:
$$
\phi_{delay} = -2\pi f \cdot t_{start,n}
$$

## Parameters

| Name | Symbol | Units | Default | Range | Notes |
|------|--------|-------|---------|-------|-------|
| Main excitation amplitude | $E_e$ | cm³/s² | 10000 | - | Negative peak of flow derivative |
| Glottal angular frequency | $\omega_g$ | rad/s | 2π·295 | - | = 2πRg·f0 |
| Open phase duration | $T_e$ | s | 0.002102 | - | = (1+Rk)/(2Rg·f0) |
| Exponential growth rate | $\alpha$ | 1/s | 1400.6 | - | Estimated iteratively for zero net flow |
| Return phase decay rate | $\varepsilon$ | 1/s | 7539.8 | - | Derived from Ta and Tb |
| Return phase duration | $T_b$ | s | 0.001898 | - | |
| Open quotient parameter | $R_g$ | - | 1.18 | - | = T0/(2Tp) |
| Skew parameter | $R_k$ | - | 0.240 | - | = Tn/Tp |
| Return phase parameter | $R_a$ | - | 0.0332 | - | = Ta/T0 |
| Waveshape parameter | $R_d$ | - | - | 0.11-3.0 | = (1/110)·f0·Up/Ee |
| Return phase corner freq | $F_a$ | Hz | 1200 | - | ≈ 1/(2πTa), slope change frequency |

## Implementation Details

### Algorithm: Generate Alias-Free LF Pulse

```
Input: Ee, ωg, Te, α, ε, Tb, Fs, N
Output: Sampled LF pulse (N samples)

1. For k = 0 to N/2 - 1:
   f = k * Fs / N

   2a. Compute Re1(f), Im1(f) using equations (13), (14)
   2b. Compute Ao(f) using equation (11)
   2c. Compute φo(f) using equation (12)

   3a. Compute Re2(f), Im2(f) using equations (17), (18)
   3b. Compute Ar(f) using equation (15)
   3c. Compute φr(f) using equation (16)

   4. Combine using phasor arithmetic:
      ALF(f) = sqrt(Ao² + Ar² + 2·Ao·Ar·cos(φo - φr))
      φLF(f) = atan2(Ao·sin(φo) + Ar·sin(φr), Ao·cos(φo) + Ar·cos(φr))

   5. Store complex spectrum:
      X[k] = ALF(f) · exp(j · φLF(f))

6. Mirror spectrum for k = N/2 to N-1 (conjugate symmetry)
   X[N-k] = conj(X[k])

7. Compute IDFT with normalization factor Fs/N

8. Return real part of IDFT result
```

### Edge Cases

- At f = 0: Handle division by zero in return phase (Re2, Im2)
- For concatenated pulses: Add phase delay -2πf·T0 for each subsequent pulse
- α must be estimated iteratively to achieve zero net flow (area constraint)

### Parameter Estimation Notes

- $\alpha$ and $\varepsilon$ cannot be directly computed from R-parameters
- $\varepsilon$ is derived from $T_a$ and $T_b$ using equation (6)
- $\alpha$ requires iterative estimation to satisfy the constraint that positive and negative areas of flow derivative are equal (zero net flow gain)
- For Rd to LF parameter conversion, see Gobl 2017 [35]

## Figures of Interest

- **Fig 1 (page 2):** Phasor addition diagram showing how amplitude and phase combine
- **Fig 2 (page 3):** Complete LF model waveform with all parameter definitions
- **Fig 3 (page 4):** Amplitude spectrum comparison: true (black), ideal discrete (red), aliased (blue) at Fs=10kHz
- **Fig 4 (page 4):** Time-domain comparison: proposed method (red) vs sampled (blue), difference (green)

## Results Summary

- Proposed method eliminates aliasing completely
- Largest differences between aliased and alias-free occur near main excitation
- Time-domain R-parameters are only marginally affected by aliasing
- Return phase produces expected -12 dB/octave slope above Fa = 1/(2πTa)
- Aliased spectrum shows elevated levels approaching Nyquist (not the expected steep rolloff)

## Limitations

- Requires iterative estimation of α (not directly computed)
- Author notes that extent of R-parameter differences across wide range of LF pulses "would require further investigation"
- Method requires computing full spectrum before IDFT (not sample-by-sample)

## Relevance to Project

**Direct relevance to Klatt synthesizer:**
- The LF model is a more sophisticated voice source than simple impulse/noise
- Could replace or augment the current glottal source in klatt-synth.js
- Frequency-domain approach could improve quality at lower sample rates
- The phasor arithmetic approach could be applied to other components

**Implementation considerations:**
- Current Klatt implementation uses simpler impulse-based voicing
- LF model provides better control over voice quality (breathiness, tenseness)
- The Rd parameter provides a single control for voice quality variation
- Could be implemented as an alternative voicing source option

## Open Questions

- [ ] How to efficiently estimate α iteratively in real-time synthesis?
- [ ] What is the computational cost vs. oversampling approach?
- [ ] How does this interact with Klatt formant filtering?
- [ ] Is the frequency-domain approach compatible with frame-by-frame synthesis?

## Related Work Worth Reading

- [1] Fant, Liljencrants, Lin 1985 - Original LF model (4-parameter)
- [17] Fant 1995 - LF model revisited, Rd parameter introduction
- [35] Gobl 2017 - Converting Rd to LF parameters
- [36] Doval et al. 2003 - Voice source as causal/anticausal filter (similar treatment)
- [12] Kawahara et al. 2015 - Alternative anti-aliasing approach (time-domain)
- [15] Carlson et al. 1989 - Voice source rules for TTS (practical application)
