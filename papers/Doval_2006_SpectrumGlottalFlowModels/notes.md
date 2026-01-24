# The Spectrum of Glottal Flow Models

**Authors:** Boris Doval, Christophe d'Alessandro, Nathalie Henrich
**Year:** 2006
**Venue:** Acta Acustica united with Acustica, Vol. 92
**DOI:** 10.1016/S0003-682X(06)00031-2

## One-Sentence Summary

Unifies KLGLOTT88, Rosenberg C, R++, and LF glottal flow models using 5 generic parameters, derives analytical spectral formulas, and shows the glottal formant frequency is controlled by Oq while its bandwidth is controlled by αm.

## Problem Addressed

Time-domain glottal flow models (LF, KLGLOTT88, etc.) use different parameterizations, making comparison difficult. No analytical spectral formulas existed, preventing understanding of how time-domain parameters map to spectral features.

## Key Contributions

1. **Unified 5-parameter framework** for all common GFMs: T₀, E, Oq, αm, Qa
2. **Analytical Laplace transforms** for KLGLOTT88, Rosenberg C, R++, and LF models
3. **Glottal formant theory**: frequency controlled by Oq, bandwidth by αm
4. **Critical finding**: H1-H2 depends on BOTH Oq AND αm, not just Oq
5. **Spectral tilt theory**: controlled by Qa (return phase quotient)

## The 5 Generic Parameters

| Parameter | Symbol | Definition | Range | Perceptual Role |
|-----------|--------|------------|-------|-----------------|
| Fundamental period | T₀ | Period duration | - | Pitch |
| Maximum excitation | E | Amplitude of derivative minimum at GCI | - | Gain, SPL |
| Open quotient | Oq | Te/T₀ (open phase / period) | 0.3-0.8 | Pressed↔lax voice |
| Asymmetry coefficient | αm | Tp/Te (opening / open phase) | 0.5-1.0 | Glottal formant bandwidth |
| Return phase quotient | Qa | Ta/[(1-Oq)T₀] | 0-1 | Spectral tilt |

### Parameter Relationships

```
Te = Oq × T₀           (glottal closing instant)
Tp = αm × Oq × T₀      (time of flow maximum)
Ta = Qa × (1-Oq) × T₀  (return phase time constant)
```

### Conversion to Other Parameter Sets

**Speed quotient Sq:**
```
αm = Sq / (1 + Sq)
Sq = αm / (1 - αm)
```

**LF model R-parameters:**
```
Rk = 1/Sq = (1 - αm)/αm
Ro = Oq (same definition)
Ra = Qa × (1 - Oq)  (approximately)
```

## Key Equations

### Generic Glottal Flow Model (Eq. 1-2)

For abrupt closure (Qa=0), any GFM can be written:
$$U_g(t; P) = E \cdot O_q T_0 \cdot n_g\left(\frac{t}{O_q T_0}; \alpha_m\right)$$

Where ng(τ; αm) is the "generic model" - a normalized waveform depending only on αm.

### GFM Spectrum (Eq. 6-7)

$$\tilde{U}'_g(f; P) = E \cdot O_q T_0 \cdot \tilde{n}'_g(f \cdot O_q T_0; \alpha_m) \cdot (F_0 \perp\!\!\!\perp_{F_0}(f))$$

Key insight: E scales amplitude, OqT₀ scales frequency, αm controls shape.

### Asymptotic Spectral Behavior

**Low frequency (f→0):**
$$|\tilde{U}_g(0)| = I \text{ (total flow integral)}$$
Slope: +6 dB/oct for derivative

**High frequency (f→∞):**
$$|\tilde{U}_g(f)| \sim \frac{E}{(2\pi f)^2}$$
Slope: -6 dB/oct for derivative (with abrupt closure)

### Glottal Formant Frequency (Eq. 10, 12)

$$F_g = \frac{1}{2\pi}\sqrt{\frac{E}{I}} = \frac{f_g(\alpha_m)}{O_q T_0} = \frac{f_g(\alpha_m) \cdot F_0}{O_q}$$

**Critical insight:** Fg is inversely proportional to Oq, roughly proportional to F0.

For typical values:
- Fmax/F0 ranges from ~0.75 to ~4
- Glottal formant is between 1st and 4th harmonic

### Glottal Formant Amplitude (Eq. 11, 13)

$$A_g = \sqrt{EI} = E \cdot O_q T_0 \cdot a_g(\alpha_m)$$

Amplitude is proportional to E and Oq.

### Quality Coefficient (Eq. 16)

$$Q_g = \frac{A_{max}}{A_g} = q_g(\alpha_m)$$

The glottal formant bandwidth depends ONLY on αm - not on E, T₀, or Oq.

### Total Flow (Eq. 3)

$$I = i_n(\alpha_m) \cdot E \cdot (O_q T_0)^2$$

### Amplitude of Voicing

$$A_v = a_v(\alpha_m) \cdot E \cdot O_q T_0$$

### NAQ Parameter (Alku et al.)

$$NAQ = \frac{A_v}{E \cdot T_0} = a_v(\alpha_m) \cdot O_q$$

NAQ captures both Oq and αm effects on tense/lax voice quality.

### Spectral Tilt Cut-off Frequency (Eq. 18)

$$F_c \approx F_a = \frac{1}{2\pi T_a}$$

Spectral tilt adds -6 dB/oct (or -12 dB/oct for 2nd order) above Fc.

### H1-H2 Relationship (Eq. 20)

$$H_1 - H_2 = 20\log_{10}\left|\frac{\tilde{n}'_g(O_q; \alpha_m)}{\tilde{n}'_g(2O_q; \alpha_m)}\right|$$

**Critical finding:** H1-H2 depends on BOTH Oq AND αm, not just Oq!

Fant's empirical approximation (LF model, αm=2/3):
$$H_1 - H_2 = -6 + 0.27 \cdot e^{5.5 O_q}$$

## Model-Specific Details

### KLGLOTT88 Model

**Fixed parameters:**
- αm = 2/3 (cannot be varied!)
- Only 4 degrees of freedom

**Generic model:**
```
ng(t) = t² - t³
n'g(t) = 2t - 3t²
```

**Shape factors:**
```
av = 4/27
in = 1/12
fg = √3/π ≈ 0.551
ag = 1/(2√3) ≈ 0.289
```

**Spectral tilt:** First or second-order low-pass filter with attenuation TL dB at 3 kHz.

### LF Model

**Generic derivative:**
$$n'_g(t; \alpha_m) = -e^{a_n(t-1)} \frac{\sin(\pi t/\alpha_m)}{\sin(\pi/\alpha_m)}$$

Where an satisfies implicit equation.

**Valid range:** αm ∈ [0.65, 1.0)
- Below 0.65, negative peak shifts away from Te

**Shape factors (depend on an which depends on αm):**
```
av(αm) = π/αm × (1 + e^(an×αm)) / [-e^an × sin(π/αm) × (an² + (π/αm)²)]
in(αm) = 1 - (π/αm) / [e^an × sin(π/αm) × (an² + (π/αm)²)]
```

### R++ Model

**Valid range:** αm ∈ [0.5, 0.75]

**Generic derivative:**
$$n'_g(t; \alpha_m) = \frac{2-3\alpha_m}{(1-\alpha_m)(2\alpha_m-1)} \cdot 2t(t-\alpha_m)\left(t - \frac{3-4\alpha_m}{2(2-3\alpha_m)}\right)$$

### Rosenberg C Model

**Generic flow:**
$$n_g(t; \alpha_m) = \begin{cases}
\frac{1-\alpha_m}{\pi}(1 - \cos(\pi t/\alpha_m)) & 0 \le t \le \alpha_m \\
\frac{2(1-\alpha_m)}{\pi}\sin(\frac{\pi}{2(1-\alpha_m)}(1-t)) & \alpha_m \le t \le 1
\end{cases}$$

**Shape factors:**
```
av(αm) = (2/π)(1 - αm)
in(αm) = (2/π)² × (1 - αm(1 - π/4)) × (1 - αm)
```

## Spectral Stylization

The GFM derivative spectrum can be stylized with 3 linear segments (in log-log):

```
        Ag ----+
       /       \
      /         \  -6 dB/oct
     / +6 dB/oct \
    /             \
   /               +---- -12 dB/oct (with spectral tilt)
  /                 \
 /                   \
Fg                   Fc
```

**Breakpoints:**
1. (Fg, Ag) - glottal formant (controlled by Oq, αm)
2. (Fc, Ac) - spectral tilt onset (controlled by Qa)

## Parameter Effects Summary

| Parameter | Low Freq | Mid Freq | High Freq | Voice Quality |
|-----------|----------|----------|-----------|---------------|
| E | - | +6 dB/doubling | +6 dB/doubling | Loudness |
| Oq | Shifts Fg | Minor | None | Pressed↔lax |
| αm | Bandwidth | Minor | None | Tense↔lax |
| Qa | Minor | Minor | Adds tilt | Soft↔loud |
| T₀ | Stretches | Stretches | Stretches | Pitch |

### Keeping E constant vs Av constant

When E is constant:
- Oq and αm mainly affect low frequencies
- Mid/high frequencies unchanged

When Av is constant:
- Changes in Oq/αm also affect E
- Entire spectrum shifts

JNDs for Oq are ~2× larger when E is constant vs when Av is constant.

## Implementation Notes

### Computing the Glottal Formant

1. For KLGLOTT88: Fg = (√3/π) × F0/Oq ≈ 0.55 × F0/Oq
2. For LF: Fg ≈ fg(αm) × F0/Oq where fg depends on an

### Practical Fg/F0 Values

| Oq | Fg/F0 (KLGLOTT88) | Fg/F0 (LF, αm=0.7) |
|----|-------------------|-------------------|
| 0.25 | ~2.2 | ~2.0 |
| 0.50 | ~1.1 | ~1.0 |
| 0.80 | ~0.7 | ~0.65 |

### H1-H2 Ambiguity

For H1-H2 = 3.4 dB (typical female), possible (Oq, αm) pairs include:
- (0.66, 2/3)
- (0.80, 0.77)
- (1.0, 0.81)

**Cannot determine Oq from H1-H2 alone without knowing αm!**

## Relevance to Qlatt Project

### Direct Applications

1. **KLGLOTT88 limitation:** αm is fixed at 2/3 - cannot vary asymmetry
   - Klatt's OQ parameter maps directly to this paper's Oq
   - Klatt's TL parameter implements spectral tilt (Qa effect)
   - But no way to control αm (glottal formant bandwidth)

2. **Parameter mapping:**
   ```
   Klatt OQ → Oq (direct)
   Klatt TL → Qa (via Fc = 1/(2πTa))
   Klatt αm → FIXED at 2/3 (cannot vary)
   ```

3. **H1-H2 estimation:** If using H1-H2 to estimate Oq, results will be biased because αm effects are ignored

4. **Glottal formant control:**
   - In Klatt: Can only shift Fg via Oq
   - Cannot independently control Fg bandwidth
   - LF model would allow both via Oq and αm

### Voice Quality Synthesis

**For pressed voice:** Low Oq (0.3-0.5), which:
- Raises glottal formant frequency
- Reduces first harmonic relative to higher harmonics

**For breathy/lax voice:** High Oq (0.7-0.8), high Qa, which:
- Lowers glottal formant frequency
- Adds spectral tilt (high-frequency rolloff)

**For tense voice:** Would need higher αm (>0.7), but KLGLOTT88 cannot do this

### Spectral Tilt Implementation

Two equivalent methods:
1. **Return phase method** (LF): Add exponential decay after GCI
2. **Low-pass filter method** (KLGLOTT88): Filter derivative by 1st/2nd order LP

Relationship: Ta ≈ Tc = 1/(2πFc)

For TL dB attenuation at 3000 Hz:
$$T_a = \frac{\sqrt{10^{TL/10} - 1}}{2\pi \times 3000}$$

## Figures of Interest

- **Fig. 1 (p.3):** Phases and parameters of GFM - timing diagram
- **Fig. 2-3 (p.3-4):** Comparison of 4 GFMs with same parameters
- **Fig. 8 (p.9):** Glottal formant stylization with asymptotes
- **Fig. 9 (p.10):** Quality coefficient qg vs αm for all models
- **Fig. 13-15 (p.12-14):** Spectral correlates of E, Qa, αm, Oq
- **Fig. 16-17 (p.15):** Fmax/F0 and Amax/E vs αm and Oq
- **Fig. 18 (p.16):** H1-H2 vs Oq showing αm dependency

## Open Questions

- [ ] Can we add αm control to Klatt synthesizer? (Would require LF or R++ model)
- [ ] How to estimate αm from speech? (Inverse filtering + fitting?)
- [ ] Does the 4.3 dB EPD JND from van Dinther apply to these spectral parameters?
- [ ] Phase spectrum implications for synthesis quality?

## Related Papers

- Fant 1960 - Acoustic Theory of Speech Production (source-filter model)
- Fant et al. 1985 - Original LF model
- Klatt & Klatt 1990 - KLGLOTT88 analysis/synthesis (already in project)
- Veldhuis 1998 - R++ model
- Fant 1995 - LF model revisited, Rd parameter
- Henrich et al. 2003 - JNDs for Oq and αm
- van Dinther 2004 - Perceptual relevance of LF R-parameters (already read)

## Key Takeaway

**The glottal formant is a 2nd-order bandpass filter whose:**
- **Frequency** is controlled by Oq (inversely proportional)
- **Bandwidth** is controlled by αm (higher αm = narrower bandwidth)
- **Amplitude** is controlled by E and Oq

**KLGLOTT88 cannot vary the bandwidth because αm is fixed at 2/3.** This is a fundamental limitation compared to LF model.

**H1-H2 is NOT a reliable estimator of Oq** without knowing αm. Multiple (Oq, αm) pairs produce identical H1-H2 values.
