# Glottal Source Modeling for Singing Voice Synthesis

**Authors:** Hui-Ling Lu, Julius O. Smith III
**Year:** ~1999 (inferred from references)
**Venue:** CCRMA, Stanford University (likely ICMC or similar conference)
**DOI/URL:** N/A

## One-Sentence Summary
Provides a complete LF-model + pitch-synchronous aspiration noise framework for singing synthesis with detailed parameter tables and analysis algorithms for extracting voice quality from recordings.

## Problem Addressed
Singing voice synthesis requires natural voice quality variations (pressed → normal → breathy) but existing methods lack proper aspiration noise modeling and parameter estimation from real recordings.

## Key Contributions
1. Combined LF-model with pitch-synchronous amplitude-modulated Gaussian noise for complete glottal excitation
2. Novel source-filter deconvolution algorithm using convex optimization with KLGLOTT88 constraints
3. Wavelet Packet Analysis for separating noise residual from derivative glottal wave
4. Empirical parameter tables from baritone singing analysis across phonation types

## Methodology
- Source-filter model: glottal excitation → all-pole vocal tract filter → radiation (1-z⁻¹)
- Glottal excitation = LF derivative glottal wave + high-pass aspiration noise
- Analysis: inverse filtering → wavelet decomposition → LF fitting

## Key Equations

### LF-Model (Open Phase)
$$g(t) = E_0 e^{\alpha t} \sin(\omega_g t), \quad 0 \leq t \leq T_e$$

### LF-Model (Return Phase)
$$g(t) = -\frac{E_e}{\varepsilon T_a}\left[e^{-\varepsilon(t-T_e)} - e^{-\varepsilon(T_c-T_e)}\right], \quad T_e \leq t \leq T_c \leq T_0$$

Where:
- $E_0$ = initial amplitude
- $\alpha$ = exponential growth constant
- $\omega_g = \pi / T_p$ = glottal angular frequency
- $T_p$ = instant of maximum glottal flow
- $T_e$ = instant of maximum negative peak (excitation)
- $T_c$ = end of return phase
- $T_a$ = effective duration of return phase
- $T_0$ = fundamental period
- $E_e$ = excitation amplitude at glottal closure
- $\varepsilon$ = return phase decay constant (derived from $T_a$)

### Normalized Timing Parameters
$$R_a = T_a / T_0$$
$$R_g = T_o / (2 \cdot T_p)$$
$$R_k = (T_e - T_p) / T_p$$

### Rd Parameter (Voice Quality)
$$R_d = (1/0.11)(0.5 + 1.2 \cdot R_k)(R_k / 4R_g + R_a)$$

Accuracy within 0.5dB for $R_d < 1.4$, max error 1.5dB at $R_d = 2.7$

### Predicting LF Parameters from Rd
$$R_{ap} = (-1 + 4.8R_d) / 100$$
$$R_{kp} = (22.4 + 11.8R_d) / 100$$

### Open Quotient Relationships
$$H_1 - H_2 = -6 + 0.27 \exp(5.5 \cdot OQ)$$
$$H_1 - H_2 = -7.6 + 11.1 R_d$$

Where $OQ = T_e / T_0$ (open quotient)

### KLGLOTT88 Basic Waveform
$$g(n) = \begin{cases} 2an/F_s - 3b(n/F_s)^2, & 0 \leq n \leq T_0 \cdot OQ \cdot F_s \\ 0, & T_0 \cdot OQ \cdot F_s < n \leq T_0 \cdot F_s \end{cases}$$

$$a = \frac{27 \cdot AV}{4 \cdot (OQ^2 \cdot T_0)}$$
$$b = \frac{27 \cdot AV}{4 \cdot (OQ^3 \cdot T_0^2)}$$

### Spectral Tilt Filter (KLGLOTT88)
$$H(z) = \frac{1}{1 - \mu z^{-1}}$$

### De-emphasis Filter for Noise
$$H(z) = \frac{1}{1 - p \cdot z^{-1}}, \quad p = 0.9$$

## Parameters

| Name | Symbol | Units | Default | Range | Notes |
|------|--------|-------|---------|-------|-------|
| Fundamental period | T₀ | sec | - | - | 1/F0 |
| Open quotient | OQ | ratio | 0.64 | 0.49-0.78 | Pressed→Breathy |
| Rd parameter | Rd | - | 1.19 | 0.84-2.90 | Voice quality index |
| Spectral tilt frequency | Fa | Hz | 515 | 161-675 | Fa = 1/(2πTa) |
| Deviation constant Ka | Ka | ratio | ~1.0 | 0.89-1.35 | Ra/Rap |
| Deviation constant Kk | Kk | ratio | ~1.0 | 0.90-1.07 | Rk/Rkp |
| Noise lag | L | % period | 10% | - | After GCI |
| Noise strength | An | ratio | 0.04 | - | Relative to Ee |
| Noise duty cycle | - | % | 42% | varies | Width of burst |
| Noise floor | - | ratio | 0.02 | - | Min envelope |
| De-emphasis pole | p | - | 0.9 | - | For noise shaping |
| HP cutoff (noise) | - | Hz | 4000 | 1200-4000 | Spectral shaping |

### Voice Quality Parameter Table (Baritone)

| Condition | OQ | Fa (Hz) | Kk | Ka | Rd |
|-----------|-----|---------|-----|-----|-----|
| Pressed | 0.49 | 675 | 1.07 | 1.23 | 0.84 |
| Normal | 0.64 | 515 | 1.04 | 0.95 | 1.19 |
| Breathy | 0.78 | 161 | 0.89 | 1.21 | 2.90 |
| Low F0 | 0.61 | 349 | 1.05 | 0.97 | 1.30 |
| Medium F0 | 0.64 | 326 | 1.02 | 1.05 | 1.63 |
| High F0 | 0.69 | 301 | 0.90 | 1.35 | 2.26 |
| Vowel /a/ | 0.63 | 349 | 0.99 | 1.10 | 1.57 |
| Vowel /e/ | 0.66 | 319 | 1.01 | 1.10 | 1.79 |
| Vowel /i/ | 0.65 | 298 | 1.00 | 1.12 | 1.81 |

## Implementation Details

### Synthesis Pipeline
1. Generate LF derivative glottal wave from Rd:
   - Predict Ra, Rg, Rk from Rd using regression equations
   - Convert to timing parameters: Ta, Tp, Te, Tc
   - Derive direct synthesis parameters: E0, α, ωg, ε

2. Generate aspiration noise:
   - Gaussian white noise (zero mean, unit variance)
   - Amplitude modulate with Hanning window centered at GCI + L
   - Scale by An parameter
   - Apply spectral shaping: de-emphasis (p=0.9) + high-pass (4kHz)

3. Sum derivative glottal wave + noise → glottal excitation
4. Filter through all-pole vocal tract filter
5. Apply radiation: (1 - z⁻¹)

### Noise Residual Synthesis Model
```
Gaussian Noise → Amplitude Modulation → Spectral Shaping → Noise Residual
                       ↑
                  An, GCI, L
```

### Key Implementation Notes
- Noise bursts occur at BOTH glottal closure AND opening instants
- Noise maximum occurs ~10% of period AFTER GCI
- Interval between excitation and noise burst < 1ms for perceptual integration
- Stationary noise segregates perceptually; pitch-synchronous noise integrates
- High-pass cutoff 1200-2000 Hz for greater breathiness
- Wavelet Packet Analysis (level 4, Daubechies-2) best for noise extraction

### Analysis Algorithm (for parameter estimation)
1. GCI detection via group-delay method + Frobenius norm refinement
2. Source-filter deconvolution via SUMT (convex optimization)
3. Noise separation via Wavelet Packet Analysis
4. LF fitting via constrained nonlinear optimization (SQP)

## Figures of Interest
- **Fig 2 (p1):** Simplified source-filter model showing derivative glottal wave + aspiration noise
- **Fig 3 (p2):** LF-model glottal wave and derivative with parameter annotations
- **Fig 4 (p4):** Noise residual synthesis model block diagram
- **Fig 5 (p4):** Frequency spectra of noise residuals showing consistent spectral shape
- **Fig 10 (p6):** WPA de-noising comparison - best noise extraction method
- **Fig 12 (p7):** Extracted noise showing bursts at GCI and GOI
- **Fig 13 (p7):** Histogram confirming pitch-synchronous nature of noise

## Results Summary
- LF + noise model successfully captures pressed/normal/breathy phonation
- Rd single parameter effectively controls voice quality spectrum
- Deviation constants (Ka, Kk) close to 1.0 → can predict LF params from Rd alone
- Breathing increases Rd (0.84 pressed → 2.90 breathy)
- Higher F0 increases Rd (1.30 low → 2.26 high)
- Noise is highly pitch-synchronous (Fig 13 histogram)
- Synthetic vowels "sound almost like the original" (informal listening)

## Limitations
- Only non-nasal voiced sounds considered (all-pole vocal tract)
- Source-tract interaction causes "formant ripples" in closed phase
- KLGLOTT88 used for analysis (simpler than LF) - some model mismatch
- Noise spectral shaping is "still under investigation"
- Double noise pulses (open + close) simplified to single burst
- Only tested on baritone singer
- No formal perceptual evaluation

## Relevance to Project

### Direct Applications to Qlatt
1. **LF source crate** - already exists, this provides parameter guidelines:
   - Use Rd as primary voice quality control
   - Rd ≈ 0.8-1.0 for pressed, 1.0-1.5 for normal, 2.0-3.0 for breathy

2. **Aspiration noise modeling** - not yet implemented:
   - Add pitch-synchronous Hanning-windowed noise
   - Position 10% after GCI
   - Amplitude ~4% of Ee
   - HP filter at 4kHz, de-emphasis at 0.9

3. **Voice quality variation** - ties to AH/AV balance:
   - Klatt AH parameter maps to noise strength An
   - Klatt TL (spectral tilt) maps to Fa/Ta

### Parameter Mapping to Klatt
| Lu/Smith | Klatt | Notes |
|----------|-------|-------|
| Rd | OQ, TL | Voice quality index |
| OQ | OQ | Direct mapping |
| Fa | TL | Spectral tilt frequency |
| An | AH | Aspiration amplitude |
| L | - | Not in Klatt (fixed at GCI) |

## Open Questions
- [ ] How does Rd map to Klatt's OQ parameter precisely?
- [ ] Should noise be added at BOTH open and close instants?
- [ ] What's the perceptual threshold for noise strength?
- [ ] How to handle source-tract interaction (formant ripples)?
- [ ] Does the 10% lag after GCI apply to speech as well as singing?

## Related Work Worth Reading
- Fant et al. 1985 - Original LF-model paper (STL-QPSR)
- Fant 1995 - LF-model revisited (prediction equations)
- Klatt & Klatt 1990 - Voice quality analysis (already in papers/)
- Childers & Hu 1994 - Glottal excited linear prediction
- Hermes 1991 - Perception of synthetic breathy vowels
- Strik 1998 - Automatic LF parameterization
