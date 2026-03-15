# Veldhuis 1998 - A Computationally Efficient Alternative for the Liljencrants-Fant Model

## Key Contribution

Proposes the **Rosenberg++ (R++)** model as a drop-in replacement for the LF glottal source model. Uses the same T/R parameter set but avoids the costly nonlinear equation solve required by LF. Perceptual experiment confirms equivalence in synthetic speech.

## The Problem with LF

The LF model (Fant et al. 1985) uses:

```
f(t) = B * sin(pi * t / t_p) * exp(alpha * t)    for 0 <= t < t_e
```

The generation parameter `alpha` must be solved numerically from a nonlinear continuity equation (Eq. 7), which involves iterative root-finding (typically ~16 iterations). This is expensive when T parameters change every ~10 ms in a synthesizer.

## General Framework for Glottal-Pulse Models

All models share this structure for the time derivative of glottal flow:

**Open phase** (0 <= t < t_e):
```
g_dot(t) = f(t)
```

**Return phase** (t_e <= t < t_0):
```
g_dot(t) = f(t_e) * [exp(-(t - t_e)/t_a) - exp(-(t_0 - t_e)/t_a)] / [1 - exp(-(t_0 - t_e)/t_a)]
```

**Continuity condition** (ensures g(0) = g(t_0) = 0, no leakage):
```
integral_0^{t_e} f(t) dt + t_a * f(t_e) * D(t_0, t_e, t_a) = 0     (Eq. 4)
```

where:
```
D(t_0, t_e, t_a) = 1 - (t_0 - t_e) / t_a / [exp((t_0 - t_e) / t_a) - 1]     (Eq. 5)
```

### T and R Parameters

- T parameters: t_0 (cycle length), t_p (peak flow time), t_e (excitation time), t_a (return phase time constant)
- R parameters (normalized):
  - r_o = t_e / t_0 (relative open phase duration)
  - r_a = t_a / t_0 (relative return phase duration)
  - r_k = (t_e - t_p) / t_p (pulse symmetry/skewness)

### Shape parameter r_d

```
r_d = U_0 / (E_e * t_0)     (Eq. 14)
```

Statistical relations exist between r_d and all R parameters (Fant et al. 1994, Fant 1995), enabling single-parameter voice quality control.

## The R++ Model

### Open Phase Function

```
f(t) = 4A * t * (t_p - t) * (t_x - t)     (Eq. 9)
```

Its integral:
```
integral_0^t f(tau) d_tau = A * t^2 * (t^2 - (4/3)*t*(t_p + t_x) + 2*t_p*t_x)
```

### Computing t_x (closed-form, no iteration)

```
t_x = t_e * (1 - (0.5*t_e^2 - t_e*t_p) / (2*t_e^2 - 3*t_e*t_p + 6*t_a*(t_e - t_p)*D(t_0, t_e, t_a)))     (Eq. 10)
```

This is the key advantage: t_x is computed directly from specification parameters. No iterative solve needed.

### Degenerate Case: R+ Model

When the denominator of Eq. 10 vanishes (specific t_p value from Eq. 11), the model reduces to:

```
f(t) = 3A * t * (t_p - t)     (Eq. 12)
```

which is the original Rosenberg model + return phase.

### Validity Constraint on t_p

```
(1/2) * t_e <= t_p <= (3/4) * t_e * |[t_e + 4*t_a*D] / [t_e + 3*t_a*D]|     (Eq. 13)
```

Ensures g(t) >= 0. Left bound matches LF's symmetry limit. Right bound is R++-specific but not a practical limitation.

### Waveform Approximation Quality

- R++ closely approximates LF waveforms when r_k < 0.5
- Slightly worse for higher r_k, but differences are small compared to LF vs. real measured waveforms

## Discrete-Time Implementation

### LF: Second-order recursive (open phase, Eq. 15)

```
s_n = 2 * exp(alpha * T_s) * cos(pi * T_s / t_p) * s_{n-1} - exp(alpha * T_s)^2 * s_{n-2}
    = a1 * s_{n-1} + a2 * s_{n-2}
```

Cost: 2 multiplications, 1 addition per sample. Requires reset of s_0, s_1 at cycle start.

### Return phase (both models, Eq. 16)

```
s_m = exp(-T_s / t_a) * s_{m-1} - (1 - exp(-T_s/t_a)) * exp(-(t_0-t_e)/t_a) / (1 - exp(-(t_0-t_e)/t_a))
    = rho * s_{m-1} + c
```

Cost: 1 multiplication, 1 addition per sample.

### R++: Direct polynomial (open phase)

```
g_dot(t) = t * (t - t_p) * (t - t_x)
```

Cost: 2 multiplications, 3 additions per sample (each factor incremented by T_s).

## Computational Cost Comparison (Table I)

| Operation      | +          | x          | /   | f(.) eval  | Measured (us) |
|----------------|------------|------------|-----|------------|---------------|
| LF sample      | 1          | r_0 + 1    | 0   | 0          | 9.4           |
| R++ sample     | 2*r_0 + 1  | r_0 + 1    | 0   | 0          | 13.6          |
| LF update      | 5 + 4*N_it | 10 + 4*N_it| 7   | 8 + N_it   | 57.8          |
| R++ update     | 8          | 8          | 3   | 1          | 10.7          |

- N_it typically ~16 for alpha accuracy of 10^-4
- R++ update is **5.4x faster** than LF update
- R++ overall is **2.8x faster** (higher for shorter glottal cycles / higher F0)
- LF samples are ~30% faster per-sample due to fewer additions

## Perceptual Evaluation

- 3-interval 3AFC paradigm, 3 subjects
- Vowels /a/, /i/, /u/, male (~110 Hz) and female (~200 Hz)
- 6 values of r_d: {0.05, 0.13, 0.21, 0.29, 0.37, 0.45}
- Result: For r_d < 0.2, no discrimination detected. For higher r_d, discrimination occasionally possible but rare
- Conclusion: perceptually equivalent for practical speech synthesis

## Implementation Notes for Qlatt

1. **The R++ model could replace the LF source in the AudioWorklet** — avoids iterative alpha solve entirely, which matters at audio-rate parameter updates
2. **Same parameter interface**: uses identical T/R parameters as LF, so no change to the rule system or parameter scheduling
3. **Direct computation of t_x** from Eq. 10 replaces iterative solve — pure arithmetic, no convergence concerns
4. **Return phase is identical** to LF (exponential decay), so spectral slope behavior is preserved
5. **The r_d shape parameter** (Eq. 14) with Fant's statistical R-parameter mappings enables single-knob voice quality control — relevant for speaker personality system
6. **Constraint check** (Eq. 13) should be implemented to ensure valid waveform when parameters are interpolated dynamically
