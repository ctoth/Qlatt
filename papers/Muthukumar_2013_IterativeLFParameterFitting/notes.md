# Optimizations and Fitting Procedures for the Liljencrants-Fant model for Statistical Parametric Speech Synthesis

**Authors:** Prasanna Kumar Muthukumar, Alan W Black, H. Timothy Bunnell
**Year:** 2013 (estimated from citations)
**Venue:** Conference paper (likely Interspeech or similar)
**Affiliations:** Carnegie Mellon University (LTI), Nemours Biomedical Research

## One-Sentence Summary
Presents a robust iterative method for fitting LF model parameters to speech using IAIF preprocessing, gradient descent optimization, and CART-based prediction refinement for statistical parametric synthesis.

## Problem Addressed
- LF model parameter estimation is difficult and sensitive to initialization
- Pure LF model misses high-frequency content, making synthesis sound hollow/muffled
- Voicing decisions are error-prone and cause jarring artifacts at transitions
- Need a method that works for statistical parametric synthesis (predictable from text)

## Key Contributions
1. **Two-stage time-domain fitting algorithm** for LF parameters using gradient descent
2. **Residual modeling with 4th-order LPC** to capture high-frequency content not in LF model
3. **Iterative refinement using ClusterGen CARTs** to improve parameter estimates
4. **F0-independent parameterization** using OQ, SQ, RQ for better synthesis control

## Methodology

### Pipeline Overview
1. IAIF (Iterative Adaptive Inverse Filtering) → separate source from vocal tract
2. Fit LF model to IAIF residual using two-stage optimization
3. Model LF residual with 4th-order LPC
4. Train ClusterGen CARTs to predict parameters from text
5. Use CART predictions to re-initialize fitting (iterative refinement)

### Analysis Parameters
- Window: 70 ms wide
- Frame step: 5 ms
- LPC residual order: 4

## Key Equations

### LF Model (Equation 1)
$$
e(t) = \begin{cases}
E_0 e^{\alpha t} \sin(\omega_g t) & t < T_e \\
\frac{-E_0}{\varepsilon T_a} \left[ e^{-\varepsilon(t-T_e)} - \varepsilon e^{(T_c - T_e)} \right] & T_e < t < T_c
\end{cases}
$$

Where:
- $T_p$ = time of positive peak
- $T_e$ = time of maximum excitation (glottal closure)
- $T_a$ = return time constant
- $T_c$ = end of glottal cycle
- $T_0$ = fundamental period
- $E_0$ = amplitude scaling
- $\alpha$ = exponential growth factor
- $\varepsilon$ = return phase decay rate
- $\omega_g$ = glottal angular frequency

### F0-Independent Quotient Parameters

$$OQ = \frac{T_e + T_a}{T_0}$$

Where: Open Quotient - fraction of cycle that glottis is "open"

$$SQ = \frac{T_p}{T_e - T_p}$$

Where: Speed Quotient - ratio of opening to closing phase duration

$$RQ = \frac{T_a}{T_0}$$

Where: Return Quotient - normalized return time

## Parameters

| Name | Symbol | Units | Default | Range | Notes |
|------|--------|-------|---------|-------|-------|
| Fundamental period | $T_0$ | samples | - | speaker-dependent | Held constant during optimization |
| Time of positive peak | $T_p$ | samples | - | $0 < T_p < T_e$ | Optimized in stage 2 |
| Time of excitation | $T_e$ | samples | - | $T_p < T_e < T_c$ | Located in stage 1, refined in stage 2 |
| Return time | $T_a$ | samples | - | $0 < T_a$ | Optimized in stage 2 |
| Cycle end | $T_c$ | samples | - | $= T_0$ | Derived from pitch |
| Amplitude | - | dB | - | - | Adjusted by 1dB per iteration |
| Open Quotient | OQ | dimensionless | - | 0-1 typical | $(T_e + T_a)/T_0$ |
| Speed Quotient | SQ | dimensionless | - | - | $T_p/(T_e - T_p)$ |
| Return Quotient | RQ | dimensionless | - | 0-1 | $T_a/T_0$ |
| LPC residual order | - | - | 4 | - | For high-frequency residual |

## Implementation Details

### Stage 1: Pulse Detection
1. Generate template LF pulse with $T_0$ ≈ speaker's max pitch period, default shape
2. Convolve template with windowed signal
3. Find peaks in convolved output → estimate voicing, pitch period locations, F0
4. If pitch period spans window center → pass to stage 2

### Stage 2: Parameter Optimization (Gradient Descent)
1. Hold $T_0$ constant
2. Adjust $T_p$, $T_e$, $T_a$ by ±1 sample per iteration
3. Adjust amplitude by ±1 dB per iteration
4. Generate new pulse, compute RMS error
5. Keep changes that reduce error; reverse direction otherwise
6. Stop when no parameter adjustment reduces error

### Residual Modeling
After LF fit, subtract fitted LF from glottal derivative:
```
residual = GFD - fitted_LF
lpc_coeffs = lpc_fit(residual, order=4)
```
This captures high-frequency content and handles voiced/unvoiced transitions smoothly.

### Iterative Refinement with CARTs
```
for iteration in range(30):
    params = fit_LF_to_all_frames(speech, init=cart_predictions)
    cart_model = train_clustergen(params, text_features)
    cart_predictions = cart_model.predict(database)
```

## Figures of Interest
- **Fig 1 (page 2):** LF model waveform showing Tp, Te, Tc, Ta timing parameters
- **Fig 2 (page 2):** IAIF block diagram (high-pass → LPC analysis → inverse filtering cycles)
- **Fig 3 (page 3):** Fitting visualization - black=raw GFD, blue=fitted LF, red=residual
- **Fig 4 (page 3):** Iterative estimation feedback loop diagram

## Results Summary

### Listening Test (Table implied)
- 190 A/B tests between LF model and Mixed Excitation baseline
- **116 preferred LF**, 70 preferred ME, 4 no preference
- Statistically significant (p=0.045) preference for LF model

### Iteration Metrics (Table 1)

| Iteration | Fitting RMSE | Fitting Corr | Prediction RMSE |
|-----------|--------------|--------------|-----------------|
| 0 | 406.89 | 0.482 | 4.840 |
| 10 | 391.57 | 0.534 | 5.061 |
| 30 | 390.56 | 0.551 | 4.636 |

Both fitting quality and predictability improve with iterations.

### Move Label Optimization (Table 2)
LSP+LF optimization produces smoother speech but affects durations.

## Limitations
- Fitting process is "very inefficient" (gradient descent with 1-sample steps)
- IAIF may not perfectly separate source from vocal tract
- LPC residual modeling smooths over some perceptual differences
- Duration optimization trade-offs not fully resolved

## Relevance to Project

**High relevance for Qlatt's LF source implementation:**

1. **Quotient parameterization (OQ, SQ, RQ)** - F0-independent representation is valuable for parameter scheduling, could be used in semantics expressions

2. **Residual modeling concept** - The idea of LF + LPC residual could improve voice quality, though adds complexity

3. **Fitting algorithm** - If doing analysis-synthesis or voice quality extraction, this time-domain approach is robust

4. **Key insight**: Using predicted parameters to re-initialize fitting creates a feedback loop that improves estimates. This is relevant if building parameter extraction tools.

## Open Questions
- [ ] What are typical OQ/SQ/RQ values for different voice qualities?
- [ ] How does the 4th-order LPC residual relate to aspiration noise (AH)?
- [ ] Could the quotient representation simplify Qlatt's LF parameter scheduling?

## Related Work Worth Reading
- **Fant et al. 1985** [17] - Original LF model (already have)
- **Raitio et al. 2011** [2] - HMM synthesis with glottal inverse filtering
- **Fant & Lin 1988** [23] - Frequency domain interpretation of LF parameters (OQ/SQ/RQ definitions)
- **Kane & Gobl 2009** [8] - Automatic LF parameterization (time + frequency domain)
