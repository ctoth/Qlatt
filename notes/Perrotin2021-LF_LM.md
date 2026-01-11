# Perrotin 2021 (JASA 150(2) 1273–1285) LF / LF_CALM / LF_LM

Source: `papers/1273_1_online.pdf`

## Verified from PDF (Appendix A/C/D, page 1283)

### Rd → (Ra, Rk, Rg)
From Appendix A (Eq. A1), as shown in `papers/lf-lm-page-11-crop-a2.png`:

```
Ra = (-1 + 4.8 * Rd) / 100
Rk = (22.4 + 11.8 * Rd) / 100
Rg = Rk * (0.5 + 1.2 * Rk) / (0.44 * Rd - 4 * Ra * (0.5 + 1.2 * Rk))
```

### Reparameterization → (Oq, alpha_m, Ta)
From Appendix A (Eq. A1):

```
Oq      = (1 + Rk) / (2 * Rg)
alpha_m = 1 / (1 + Rk)
Ta      = Ra * T0
```

### LF_CALM open-phase filter (2nd order resonant biquad)
From Appendix C (Eq. C1/C2/C3), as shown in `papers/lf-lm-page-11-crop-c2.png`
and `papers/lf-lm-page-11-crop-c3.png`:

```
H_CALM_open(z) = (b1 z + b2 z^2) / (1 + a1 z + a2 z^2)

b1 = -Ag
b2 =  Ag
a1 = -2 * exp(-pi * Bg / Fs) * cos(2 * pi * Fg / Fs)
a2 =  exp(-2 * pi * Bg / Fs)

Fg = 1 / (2 * Oq * T0)
Bg = 1 / (Oq * T0 * tan(pi * (1 - alpha_m)))
Ag = E
```

### Spectral-tilt filter (1st order lowpass)
From Appendix C (Eq. C5/C6), as shown in `papers/lf-lm-page-11-crop-c4.png`:

```
H_ST(z) = b_ST / (1 + a_ST z^-1)

Fa   = 1 / (2 * pi * Ta)
b_ST = 1 - exp(-2 * pi * Fa / Fs)
a_ST = -exp(-2 * pi * Fa / Fs)
```

### LF_LM causality constraint
From Appendix D (Eq. D1), as shown in `papers/lf-lm-page-11-crop-d1.png`:

```
H_LM_open(z) = (b1 z^-1 + b2 z^-2) / (1 + a1 z^-1 + a2 z^-2)
```

The coefficients come from (C2)/(C3), with the note that convergence requires:

```
a_LM < 0
a_LM = -pi * Bg
b_LM =  2 * pi * Fg
```

## Notes

- The formulas above are taken directly from the PDF images.
- This replaces earlier heuristic LF_LM mappings in the current implementation.
