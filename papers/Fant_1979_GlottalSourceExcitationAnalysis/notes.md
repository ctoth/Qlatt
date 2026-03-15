# Fant 1979 — Glottal Source and Excitation Analysis

## Implementation Notes for Klatt Synthesizer

### 1. Source-Filter Separation

Fant defines the source as the hypothetical volume velocity flow passing through the glottis when working into a short circuit (instead of into the vocal tract impedance). This follows Fant (1960). The glottal impedance is time-variable and non-linear, shaping the source waveform and acting as an element of the vocal tract filter function.

### 2. Glottal Flow Resistance (Eq. 1)

The kinetic resistance at glottal openings larger than ~0.02 cm^2:

```
R_g = k * v_s^2 / A_g
```

- `A_g` = instantaneous glottal area
- `v_s` = particle velocity of the air flow
- `k` is set to 0.875
- This resistance is twice the aerodynamic flow resistance relating total pressure drop to total flow

### 3. Particle Velocity (Eq. 2)

```
v_s = (2 * P_G / rho)^(1/2)
```

where `P_G` is the pressure drop in the supraglottal constriction. If no supraglottal constriction exists, `P_G = P_s` (subglottal pressure). Volume velocity `U_s = A_g * v_s`.

### 4. Glottal Bandwidth Contribution (Eqs. 3-4)

The supraglottal impedance in the F1 region may be approximated by a parallel LRC circuit. The glottal parallel resistance:

```
B_g1 = 1 / (2*pi*R_ge*C) = gc / (2*pi*R_ge*V)  =  c^2 * A_g / (2*pi*k*v_s*V)
```

- `C` = Helmholtz resonator capacitance = `V / (rho * c^2)`
- `V` = total volume of the vocal tract
- `R_ge` = glottal parallel resistance

The glottal bandwidth component of any formant:

```
B_g = Z*c / (pi*R_ge) = gc^2 / (4*pi*R_ge*V) = c^2*A_g / (pi*k*v_s*V)
```

This is twice that of the simple resonator with the same volume.

### 5. Typical Glottal Bandwidth Values

From Wakita and Fant (1978):
- Maximum instantaneous glottal bandwidth at flow peak: ~600 Hz
- For vowel [a]: A_g = 0.16 cm^2, P_s = 6 cm H2O, B_g ~ 200 Hz
- For vowel [e]: B_g ~ 200 Hz
- Effective (mean) values from perceptual study (Fant & Liljencrants 1979): 20-160 Hz range
- Glottal bandwidth increases with voice fundamental frequency and with the relative duration of the open part of the glottal cycle
- At high glottal losses, the latter parameters are more important than the particular scale value of B_g(t)

### 6. Glottal Source Model (Fant's 3-Parameter Model)

The model has a smoothly rising branch and a falling branch controlled by three parameters:

**Rising branch** (0 < t < T_2):
```
U = U_0 * (1/2) * (1 - cos(omega_g * t))
```

**Falling branch** (T_2 < t < T_3):
```
U = U_0 * [K * cos(omega_g * (t - T_2) - pi) - K + 1]
```

Which hits zero at:
```
T_3 = T_2 + (1/omega_g) * arccos((K-1)/K)
```

**Three parameters:**
1. **U_0** — peak value (pulse height)
2. **F_g** — pulse rise frequency = 1/(2*T_2), where T_2 = pi/omega_g is the duration of the rising branch
3. **K** — steepness factor of the falling branch
   - K = 0.5: falling branch is symmetric to rising branch
   - K = 1: standard case (cosine rising, linear falling at closure)
   - K = infinity: falling branch is a step function (abrupt closure)

### 7. Offset Time T_d (Eq. 6)

The "offset time" (equivalent to "closing time" S_c of Sundberg & Gauffin 1978):

```
T_d = -U_0 / (dU/dt at t=T_3) = 1 / (omega_g * sqrt(2K - 1))
```

This is the intersection of a tangent through T_3 and a horizontal line through the peak. It is a major determinant of excitation strength.

### 8. Excitation Transform — Closure Approximation (Eq. 7)

The simplest excitation transform treats the closing phase as a ramp with slope `-U_0/T_d`:

```
U_3(s) = -dU/dt(t=T_3) / s^2 = U_0 / (T_d * s^2) = U_0 * omega_g * sqrt(2K-1) / s^2
```

This carries most of the excitation at non-extreme voice levels.

### 9. Complete Source Transform (Eq. 9)

The exact Laplace transform of the entire pulse U(t):

```
U(s) = U_0 * [1 + (1-2K)*e^(-s*T_2) + 2*(K-1+s*(2K-1)^(1/2)/omega_g)*e^(-s*T_3)] / [2*s*(1 + s^2/omega_g^2)]
```

where:
- `T_2 = pi / omega_g`
- `T_3 = T_2 + (1/omega_g) * arccos((K-1)/K)`

### 10. Source Spectrum Magnitude (Eq. 56)

The overall source spectrum (absolute value):

```
|H(x)| = [(A^2+B^2)(C^2+(D*E+F)^2)]^(1/2) / (2*pi*x*(x^2 - 1))
```

where `x = f/F_g` (normalized frequency), and:
- `A = cos[pi*(x + phi_1)]`
- `B = (1 - 2K) * cos(x*phi_1)`
- `C = 2K - 2`
- `D = 2*x*sqrt(2K-1)`
- `E = sin[pi*(x + phi_1)]`
- `F = (1 - 2K) * sin(x*phi_1)`
- `phi_1 = arccos((K-1)/K)`

### 11. Source Spectrum Slopes

From the family of source spectrum curves (Fig. III-A-5):
- Spectral energy concentration at/above F_g = 125 Hz stays almost invariant with K
- K increase causes almost parallel upward displacement, retaining -12 dB/oct slope for K between 0.51 and 4
- K = 0.5 and K = infinity: -18 dB/oct and -6 dB/oct respectively
- At K > 4, the minimum between FG and F1 disappears
- The sinx/x fine structure (spectral zeros) is apparent for K values up to 0.55

### 12. Vocal Tract Transfer Function (Eq. 11)

Conjugate pole transfer function:
```
H_F(s) = product_n [ omega_on^2 / ((s + alpha_n)^2 + omega_n^2) ]
```

### 13. Radiation Transform (Eq. 12)

```
H_R(s) = (rho * s) / (4*pi*a) * K_T(s) = K_R * s
```

With K_T(f) correction for frequency dependency of radiated power (from spherical baffle, radius 9 cm):

| f (Hz) | K_T(f) (dB) |
|---------|-------------|
| 0       | 0           |
| 315     | 0.5         |
| 625     | 2.8         |
| 1250    | 4.7         |
| 2500    | 5.2         |
| 5000    | 6.7         |

### 14. Formant Initial Amplitudes (Key Result)

**The initial amplitudes of formants in the time domain are independent of their bandwidths** (p. 98). This is a critical finding.

For a neutral vowel (single tube resonator), all formants have starting amplitudes `8*F_1` and alternating signs (Eq. 53):

```
h(t) = +8*F_1 * e^(-alpha_1*t) * sin(omega_1*t) - 8*F_1 * e^(-alpha_1*t) * sin(3*omega_1*t) + 8*F_1 * e^(-alpha_1*t) * sin(5*omega_1*t) - etc.
```

### 15. F1 Oscillation in Closed Phase (Eqs. 37-38, 44-48)

At glottal opening (t > T_1):
```
h_11(t) = (A_o/2) * (omega_g/omega_1) * e^(-alpha_1*t) * sin(omega_1*t + psi_2)
```

At peak (t > T_2):
```
h_12(t) = (A_o/2) * (omega_g/omega_1) * (1-2K) * e^(-alpha_1*(t-T_2)) * sin(omega_1*(t-T_2) + psi_2)
```

The ratio of F1 ripple amplitude at closure to the preceding glottal peak amplitude:
```
ratio = 1 / (omega_1 * T_d)
```

The F1 ripple starts as a **minus sine-function** at closure. This has been confirmed experimentally.

### 16. Effective Bandwidth for Synthesis (Eq. 57)

The recipe for waveform synthesis:
1. Select a glottal pulse form (calculate its derivative via radiation transform)
2. The derivative ends with a negative peak amplitude proportional to `U_0 * omega_g * (2K-1)^(1/2) = U_0 / T_d` at the instant of closure
3. This is the starting point and starting amplitude of a **minus cosine function**
4. It proceeds with a constant damping factor `exp(-pi*B_1*t)` until the onset of the next glottal pulse

The bandwidth is calculated from:
```
B_1(t) = (1/pi) * B_max * dt / integral
```

where `B_max` is the maximum instantaneous bandwidth during the glottal open phase.

Fant and Liljencrants (1979) method: the effective bandwidth matches the ratio of peak to rectified mean of the decay envelope. Effective values: 20-160 Hz range (order of magnitude).

### 17. Predictability of A_1 from Source Parameters (Eq. 58)

The first formant amplitude in the sound pressure wave at a distance:

```
h_1(t) ~ A_1 * e^(-pi*B_1*t) * cos(2*pi*F_1*t)
```

where:
```
A_1 = (U_0 / T_d) * K_R(f) * (U_0/T_d) * [1 - F_1^2/F_2^2]^(-1) * [1 - F_g^2/F_1^2]^(-1)
```

The prediction error using this formula holds within 1 dB over the major part of the utterance (Fig. III-A-11).

### 18. Voice Effort Variation

From experimental data (Figs. III-A-13 through III-A-17):

**Normal voice (subject JS, word "ja:"):**
- F_g = 123 Hz, F_0 = 94 Hz
- T_d = 0.8 ms
- K = 1.6 (calculated as K = 0.5 + 0.5*(T_d * omega_g)^(-2))

**Weak voice:**
- F_g = F_0 = 73 Hz
- K = 0.5 (symmetric, no abrupt closure)

**Loud voice (Fig. III-A-17):**
- Higher K values, sharper closure
- U_0 increases at about half the dB rate of 1/T_d increase going from normal to high voice effort
- U_0 is nearly the same for weak and normal voice

**Key finding:** The main change in A_1 with voice effort is correlated to the pulse steepness parameter K and to F_g. The glottal pulse amplitude U_0 stays almost constant while the dynamics are modulated through T_d and K.

### 19. Relation to Rothenberg Three-Parameter Model

From Rothenberg et al (1974), the five steps in increasing loudness parameter L:
- Each step corresponds to 5 dB in formant amplitude
- Total 10 dB range in L relates to: 10 dB increase of U_0 and 20 dB increase in 1/T_d
- F_g increase is 30% only
- Fant suggests using U_0 as a switching function and modulating dynamics with T_d and K, with prescribed internal relation between F_g and K

### 20. Connected Speech Observations (Figs. III-A-15 through III-A-18)

Volume velocity recordings through Rothenberg mask show:
- Formant ripple in closed phase starts as minus sine-function (confirmed by Eq. 40)
- F1 ripple amplitude predictable from U_0/T_d
- Truncation tendency stronger in [a] than in [o] vowels
- Consonant contexts show characteristic source variations (stops, fricatives, nasals, laterals all visible in Fig. III-A-18)
