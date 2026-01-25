# Perceptual Equivalence of the Liljencrants-Fant and Linear-Filter Glottal Flow Models

**Authors:** Olivier Perrotin, Lionel Feugere, Christophe d'Alessandro
**Year:** 2021
**Venue:** Journal of the Acoustical Society of America, Vol. 150(2), pp. 1273-1285
**DOI:** https://doi.org/10.1121/10.0005879

## One-Sentence Summary

Demonstrates that computationally efficient linear-filter implementations (LFCALM, LFLM) of the LF glottal flow model are perceptually equivalent to the original LF model, enabling real-time voice synthesis applications.

## Problem Addressed

The LF (Liljencrants-Fant) model is the most widely used glottal flow model for speech analysis and synthesis, but it requires solving implicit equations numerically, making it computationally expensive and unsuitable for real-time applications. This paper establishes whether simpler linear-filter approximations can produce perceptually equivalent results.

## Key Contributions

- Unified analytic formulation expressing LF, LFCALM, and LFLM under a single mathematical framework
- Perceptual validation showing LFLM and LFCALM are perceived similarly to LF
- Demonstration that LFCALM/LFLM are 10-100x faster than LF computationally
- Clear mapping between Rd (voice quality parameter) and perceptual equivalence across models
- Digital filter implementations ready for real-time synthesis

## Methodology

### Approach

1. Reformulate all three glottal flow models (LF, LFCALM, LFLM) as truncated second-order filter responses
2. Compare models analytically in time and frequency domains
3. Conduct perceptual experiments using 2AFC (two-alternative forced choice) same/different paradigm
4. Statistical analysis of perceptual equivalence across Rd values

### Algorithm

1. Generate glottal flow derivative using one of three models
2. For LF: solve implicit equations numerically for open phase damping (aLF) and closed phase coefficient (epsilon)
3. For LFCALM: filter pulse train at GCIs with anti-causal bandpass, truncate at GOI, apply causal spectral tilt
4. For LFLM: filter pulse train at GOIs with causal bandpass, apply causal spectral tilt (no truncation needed)
5. Optionally convolve with vocal tract filter for vowel synthesis

## Key Equations

### General Open Phase Formulation (Eq. 1)

$$
h_T(t) = G_n e^{a_n t} \sin(b_n t + \phi_n) \quad \text{if } t \in \mathcal{D}
$$

Where:
- $G_n$ = amplitude scaling factor
- $a_n$ = damping coefficient (s^-1)
- $b_n$ = angular frequency (rad/s)
- $\phi_n$ = phase offset (rad)
- $\mathcal{D}$ = domain (anti-causal: $[-T, 0]$; causal: $[0, T]$ or $[0, \infty)$)

### LF Open Phase (Eq. 2)

$$
h_{LF_{open}}(t) = \frac{-E}{\sin\left(\frac{\pi}{\alpha_m}\right)} e^{a_{LF} t} \sin\left(\frac{\pi}{\alpha_m O_q T_0} t + \frac{\pi}{\alpha_m}\right), \quad t \in [-O_q T_0, 0]
$$

Laplace transform:
$$
H_{LF_{open}}(s) = \frac{G_{LF} b_{LF} (e^{-sT_{LF}} - 1) + Es}{(a_{LF} - s)^2 + b_{LF}^2}
$$

### LFCALM Open Phase (Eq. 3)

$$
h_{CALM_{open}}(t) = -\frac{E}{\sin(\pi(1-\alpha_m))} e^{a_{CALM} t} \sin\left(\frac{\pi}{O_q T_0} t + \pi(1-\alpha_m)\right), \quad t \in [-O_q T_0, 0]
$$

Laplace transform:
$$
H_{CALM_{open}}(s) = \frac{(1 + e^{(a_{CALM}-s)T_{CALM}}) Es}{(a_{CALM} - s)^2 + b_{CALM}^2}
$$

### LFLM Open Phase (Eq. 4)

$$
h_{LM_{open}}(t) = \frac{E}{\sin(\pi(1-\alpha_m))} e^{a_{LM} t} \sin\left(\frac{\pi}{O_q T_0} t - \pi(1-\alpha_m)\right), \quad t > 0
$$

Laplace transform:
$$
H_{LM_{open}}(s) = \frac{Es}{(a_{LM} - s)^2 + b_{LM}^2}
$$

### LF Closed Phase (Eq. 5)

$$
h_{LF_{closed}}(t) = \frac{-E}{\epsilon T_a} (e^{-\epsilon t} - e^{-\epsilon(T_0 - O_q T_0)}), \quad t \in [0, T_0 - O_q T_0]
$$

Where $\epsilon$ is the closed phase coefficient satisfying:
$$
1 - e^{-\epsilon(T_0 - O_q T_0)} = \epsilon T_a
$$

### Rd to Low-Level Parameters (Appendix A, Eq. A1)

$$
\begin{cases}
R_a = (-1 + 4.8 R_d) / 100 \\
R_k = (22.4 + 11.8 R_d) / 100 \\
R_g = \frac{R_k(0.5 + 1.2 R_k)}{0.44 R_d - 4 R_a(0.5 + 1.2 R_k)}
\end{cases}
\Rightarrow
\begin{cases}
O_q = \frac{1 + R_k}{2 R_g} \\
\alpha_m = \frac{1}{1 + R_k} \\
T_a = R_a T_0
\end{cases}
$$

### Glottal Formant Parameters (LFCALM/LFLM) (Eq. C3)

$$
\begin{cases}
F_g = \frac{1}{2 O_q T_0} \\
B_g = \frac{1}{O_q T_0 \tan(\pi(1-\alpha_m))} \\
A_g = E
\end{cases}
$$

### Digital Filter Coefficients (Eq. C2)

$$
\begin{cases}
b_1 = -A_g \\
b_2 = A_g \\
a_1 = -2 e^{-\pi B_g / F_s} \cos(2\pi F_g / F_s) \\
a_2 = e^{-2\pi B_g / F_s}
\end{cases}
$$

### Spectral Tilt Filter (Eq. C5, C6)

$$
H_{ST}(z) = \frac{b_{ST}}{1 + a_{ST} z^{-1}}
$$

Where:
$$
\begin{cases}
b_{ST} = 1 - e^{-2\pi F_a / F_s} \\
a_{ST} = -e^{-2\pi F_a / F_s}
\end{cases}
$$

And $F_a = \frac{1}{2\pi T_a}$ is the spectral tilt cutoff frequency.

### LFLM Synthesis Recursion (Eq. E3, E4)

Open phase (glottal formant):
$$
x_{LM_{open}}[n] = b_1 \delta_{goi}[n-1] + b_2 \delta_{goi}[n-2] - a_1 x_{LM_{open}}[n-1] - a_2 x_{LM_{open}}[n-2]
$$

Spectral tilt:
$$
x_{LM}[n] = b_{ST} x_{LM_{open}}[n-1] - a_{ST} x_{LM}[n-1]
$$

## Parameters

| Name | Symbol | Units | Default | Range | Notes |
|------|--------|-------|---------|-------|-------|
| Rd parameter | $R_d$ | dimensionless | 1.0 | 0.4-2.7 | High-level voice quality control |
| Fundamental frequency | $F_0$ | Hz | 110 | 70-1000 | $F_0 = 1/T_0$ |
| Period | $T_0$ | s | - | - | $T_0 = 1/F_0$ |
| Peak excitation | $E$ | arbitrary | 0.2 | - | Max absolute value of GFD |
| Open quotient | $O_q$ | ratio | - | 0.3-0.9 | Derived from $R_d$ |
| Asymmetry coefficient | $\alpha_m$ | ratio | - | 0.5-0.9 | Derived from $R_d$ |
| Return time | $T_a$ | s | - | - | Derived from $R_d$: $T_a = R_a T_0$ |
| Glottal formant frequency | $F_g$ | Hz | - | 64-121 | $F_g = 1/(2 O_q T_0)$ |
| Glottal formant bandwidth | $B_g$ | Hz | - | - | From $\alpha_m$ and $O_q$ |
| Spectral tilt cutoff | $F_{ST}$ | Hz | - | - | $F_{ST} = 1/(2\pi T_a)$ |
| Open phase damping | $a_n$ | s^-1 | - | - | Model-specific |
| Open phase frequency | $b_n$ | rad/s | - | - | Model-specific |
| Sampling frequency | $F_s$ | Hz | 96000 | - | For digital implementation |

## Implementation Details

### Data Structures Needed

- Pulse train arrays (GOI or GCI positions depending on model)
- Filter state variables (2 for open phase biquad, 1 for spectral tilt)
- Parameter cache for Rd-derived values

### Initialization Procedures

1. Convert Rd to intermediate parameters (Ra, Rk, Rg)
2. Compute low-level parameters (Oq, alpha_m, Ta)
3. Compute filter parameters (Fg, Bg, Ag) for glottal formant
4. Compute spectral tilt cutoff Fa
5. Convert to digital filter coefficients using sampling frequency

### Model-Specific Details

**LF Model:**
- Requires numerical solution of implicit equations (B3) and (B4)
- Computationally expensive, real-time factor > 0.1 at high F0
- Anti-causal open phase, truncated at -OqT0

**LFCALM Model:**
- Anti-causal bandpass filter for open phase
- Truncate at previous GOI each period
- Real-time factor ~0.001-0.01

**LFLM Model:**
- Causal bandpass filter, no truncation needed
- Simplest implementation, period leaks slightly into next
- Real-time factor ~0.001-0.01
- Pulse train placed at GOIs (not GCIs)

### Implementation Gotchas

- **Amplitude normalization:** Use $A_g = E / \sin(\pi(1-\alpha_m))$ (Eq. C4/D2). Omitting the $\sin$ term causes large level swings as $\alpha_m$ changes.
- **CALM is anti-causal:** True LFCALM requires reverse-time filtering over a period or buffered block. A sample-by-sample forward filter produces LFLM behavior instead.

### Edge Cases Mentioned

- High Rd values (>1.84): spectral tilt filter response overlaps next period
- Sign inversion between LFCALM and LFLM glottal flow (perceptually irrelevant)
- Phase differences between models (tested in perceptual experiments)

### Computational Complexity

- LF: O(iterations) per period for implicit equation solving
- LFCALM/LFLM: O(samples) per period, constant time per sample
- LFCALM/LFLM are 10-100x faster than LF

## Figures of Interest

- **Fig 1:** Temporal parameters on glottal flow and GFD, spectrum showing glottal formant (Fg) and spectral tilt (FST) with +20/-20/-40 dB/decade slopes
- **Fig 2:** Open phase comparison showing time-domain waveforms and frequency responses for all three models
- **Fig 3:** Full waveforms with closed phases, showing similar spectral magnitudes but phase differences
- **Fig 4:** Real-time factor comparison - LFCALM/LFLM consistently 10-100x faster
- **Fig 5:** Effect of Rd on GFD shape and spectrum for all models (Rd = 0.4 to 2.7)
- **Fig 6:** Perceptual experiment results - similarity matrices for all model pairs

## Results Summary

### Perceptual Findings

1. **LFLM vs LFCALM:** Judged perceptually equivalent when sharing the same Rd value
2. **LF vs LFCALM/LFLM:** Perceived as similar when LF has a smaller Rd value (consistent offset)
3. **Rd dominates perception:** Rd parameter has the strongest perceptual effect (chi^2 = 3620, p < 0.001)
4. **Model effect is small:** Model factor marginally significant (chi^2 = 8.8, p = 0.012)
5. **Vowel filtering increases similarity:** Vocal tract resonances mask glottal source differences

### Computational Performance

- LF real-time factor: 0.1-1x (increases with F0)
- LFCALM/LFLM real-time factor: 0.001-0.01x (constant with F0)
- Rd has no effect on computation time for any model

## Limitations

- Perceptual experiments used stationary signals (0.3s duration)
- Only two vowels tested (/a/ and /i/)
- Low F0 (110 Hz) - may not generalize to higher pitches
- Perceptual shift between LF and linear models needs further investigation
- Truncation vs causality effects not fully separated

## Relevance to TTS Systems

### Direct Applications

1. **Real-time formant synthesis:** LFLM enables real-time glottal source generation
2. **Voice quality control:** Single Rd parameter for tenseness/breathiness
3. **Expressive TTS:** Rd variations can convey emotion (low Rd = tense/loud, high Rd = relaxed/soft)
4. **Source-filter separation:** Clean spectral model for analysis-resynthesis

### For Klatt Synthesizer

- LFLM provides a modern, efficient alternative to Klatt's impulse source
- Spectral tilt filter (Ta parameter) corresponds to Klatt's TL parameter
- Glottal formant provides natural voicing bar characteristics
- Could replace or complement existing voicing source

### Voice Quality Mapping

| Rd Value | Voice Quality | Characteristics |
|----------|--------------|-----------------|
| 0.4 | Tense/Loud | Short open phase, strong asymmetry, sharp GFD closure |
| 1.0 | Modal | Balanced, typical speaking voice |
| 2.7 | Relaxed/Soft | Long open phase, symmetric, sine-like GFD |

## Open Questions

- [ ] How does the perceptual equivalence hold for F0 > 110 Hz?
- [ ] Is the Rd offset between LF and LFLM/LFCALM due to truncation or causality?
- [ ] How to map Klatt parameters (AV, TL, OQ) to Rd?
- [ ] Does equivalence hold for dynamic (time-varying) Rd trajectories?
- [ ] How does period leakage in LFLM affect concatenative contexts?

## Related Work Worth Reading

- Fant et al. (1985) - Original LF model definition
- Doval et al. (2003) - LFCALM introduction
- Doval et al. (2006) - "The spectrum of glottal flow models" - unified GFM framework
- Feugere et al. (2017) - Cantor Digitalis synthesizer (LFLM implementation)
- Klatt (1980) - Cascade/parallel formant synthesizer
- Klatt & Klatt (1990) - KLGLOTT88 model and voice quality analysis
- Gobl & Ni Chasaide (2003) - Voice quality in emotion communication
- Fant (1995) - "The LF-model revisited" - Rd parameter derivation
