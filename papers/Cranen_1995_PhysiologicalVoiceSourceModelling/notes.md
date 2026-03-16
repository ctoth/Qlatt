---
title: "Cranen & Schroeter 1996 — Physiologically Motivated Modelling of the Voice Source"
year: 1995
---

# Cranen & Schroeter 1996 — Physiologically Motivated Modelling of the Voice Source

## Key Contribution

Parametric glottal geometry model that distinguishes two types of glottal leakage — "linked leak" (incomplete closure of membranous glottis due to abduction) and "parallel chink" (independent secondary glottal duct) — with distinct spectral consequences. Extends Titze (1984) parameterization for use in articulatory analysis/synthesis.

## Core Assumption

All relevant acoustic features of the glottal source signal can be modelled adequately if geometric waveforms of the glottal inlet and outlet openings are parameterized in sufficient detail (rather than modelling the full self-oscillating vocal fold mechanics).

## Titze Parameterization (Baseline)

Static displacement (Eq. 1):
```
xi_0(y,z) = { xi_01 - [(xi_01 - xi_02)/d_g] * z } * (1 - y/l_g)
```

Dynamic displacement (Eq. 2):
```
xi_t(y,z,t) = -xi_m * sin(pi*y/l_g) * cos(2*pi*F0*t - phi*z/d_g)
```

Parameters:
- xi_01: distance between posterior fold ends at glottal inlet (z=0)
- xi_02: distance between posterior fold ends at glottal outlet (z=d_g)
- xi_m: amplitude of vibration
- phi: phase angle between lower and upper margins of vocal folds
- F0: fundamental frequency = 1/T
- l_g: length of glottis
- d_g: depth of glottis

Three dimensionless control parameters:
- **Abduction quotient**: Q_a = xi_02 / xi_m
- **Shape quotient**: Q_s = (xi_01 - xi_02) * xi_m
- **Vertical phase quotient**: Q_p = phi / (2*pi)

Combined displacement (Eq. 3):
```
xi(y,z,t) = max{ 0, xi_m * [ (1 - y/l_g) * (Q_a + Q_s*z/d_g)
              - sin(pi*y/l_g) * cos[2*pi*(F0*t - Q_p*z/l_g)] ] }
```

## Glottal Area Waveforms

### Time-varying component (membranous glottis)
From integrating xi_t (Eq. 4):
```
A_t(z,t) = -A_hat * cos[2*pi*(F0*t - Q_p*z/l_g)]
```
where A_hat = 4*xi_m*l_g/pi

### DC-offset (minimum) areas
At glottal inlet (z=0), Eq. 9:
```
A_min1 = (Q_a + Q_s)*xi_m*l_g - A_hat = A_hat * ((Q_a + Q_s)/pi - 1)
```

At glottal outlet (z=d_g), Eq. 10:
```
A_min2 = Q_a*xi_m*l_g - A_hat = A_hat * (Q_a/pi - 1)
```

### Polynomial fit for minimum areas during collision (Eqs. 11-12)
When folds collide, minimum area at outlet:
```
A_min1(t) ≈ { xi_m*l_g * [-0.051 + 0.219*(Q_a+Q_s) + 0.126*(Q_a+Q_s)^2]   if Q_a+Q_s < pi
             { xi_m*l_g * (Q_a+Q_s - 4/pi)                                   if Q_a+Q_s >= pi

A_min2(t) ≈ { xi_m*l_g * [-0.051 + 0.219*Q_a + 0.126*Q_a^2]   if Q_a < pi
             { xi_m*l_g * (Q_a - 4/pi)                           if Q_a >= pi
```

### Four-component area derivative model (Eq. 13)

The membranous glottal area derivative dA_g^(m)/dt is decomposed into four components:

```
g_0(t) = C_0                          (0 <= t < T)      [linked leak dc-offset]

g_2(t) = d/dt{ A_hat * [1 - cos(2*pi*t/T)] }   (t_o <= t <= t_c)   [core cosine wave]
       = 0                                        otherwise

g_1(t) = C_1*(t - t_o + T_1)^3        (t_o - T_1 <= t <= t_o)     [opening correction]
       = C_1*(t - t_o - T_1)^3        (t_o < t <= t_o + T_1)
       = 0                            otherwise

g_3(t) = C_3*(t - t_c + T_3)^3        (t_c - T_3 <= t <= t_c)     [closing correction]
       = C_3*(t - t_c - T_3)^3        (t_c < t <= t_c + T_1)
       = 0                            otherwise
```

Where:
- t_o = instant of glottal opening
- t_c = instant of glottal closure
- T_1 = duration of opening correction
- T_3 = duration of closing correction
- A = C_1*T_1^3 = maximum amplitude of opening correction
- D = C_3*T_3^3 = maximum amplitude of closing correction (can differ from A)
- B = maximum of core cosine wave at opening
- C = maximum of core cosine wave at closing

### Nominal T_1 and T_3 values (Eq. 14)
Polynomial fit for the outlet area:
```
T_1/T = T_3/T = { 10^-2 * (-0.16*Q_a^5 + 0.44*Q_a^4 - 0.76*Q_a^3 + 2.16*Q_a^2 + 3.45*Q_a + 3.41)   if Q_a <= pi
                 { 0                                                                                     if Q_a > pi
```
For the inlet area: same equation with Q_a replaced by Q_a + Q_s.

## Two Types of Leakage

### Linked Leak
- Incomplete glottal closure due to vocal fold abduction
- Created by abduction (opening connected to membranous glottis)
- Increases DC-flow and source/tract interaction
- **Spectral effect**: steeper roll-off of entire glottal flow spectrum
- Higher frequencies attenuated more than lower frequencies
- Becomes linked leak as soon as folds are abducted
- Represented by linked leak areas A_l1 (inlet) and A_l2 (outlet), which equal the dc-offset areas A_min1 and A_min2

### Parallel Chink
- Independent second glottal duct, separate from membranous glottis
- Models cartilaginous portion opening
- Can only exist when folds are adducted
- Has inlet area A_c1 and outlet area A_c2 (cross-sectional)
- Same depth d_g as membranous glottis
- **Spectral effect**: decreases energy of lower frequencies more than higher frequencies
- Slope at higher frequencies ~same as no-leakage case
- Acts as a "short circuit" for lower frequencies
- Causes high-frequency noise boost (due to turbulence at chink)

## Synthesis Equations (Section 3)

Three flow regions (Fig. 6):
1. **Region I** (common inlet): single flow U_tot, lossless kinetic-to-potential energy conversion
2. **Region II** (split): flow splits into U_g (membranous) and U_c (chink), independent laminar flow
3. **Region III** (common outlet/expansion): flows reunite, momentum conservation assumed

### Kinetic pressure drop equation (Eq. 15):
```
Delta_P = 0.5 * rho * U^2 * { 1/A_2^2 - 1/A_1^2 + eta*(1/A_2 - 1/A_1)^2 }
```
Where eta accounts for energy losses:
- eta = 0: lossless (Bernoulli flow)
- eta = 1: energy lost (strongly diverging duct)

### Entrance loss factor:
```
eta_i: 0 < eta_i < 0.37
```

### Tapering loss coefficient:
```
eta_12(t) = { 0.4   if [A_g1(t) + A_l1(t)] >= [A_g2(t) + A_l2(t)]
            { 1.0   if [A_g1(t) + A_l1(t)] < [A_g2(t) + A_l2(t)]
```

### Flow splitting (Eq. 17):
```
U_tot / A_i = U_g / A_ig = U_c / A_ic
```
(uniform velocity profile assumed at splitting point)

### Transglottal pressure equations

**Pressure across membranous glottis including linked leak (Eq. 18)**:
Includes terms for:
- Pressure across common inlet region
- Pressure across common outlet region
- Pressure across membranous inlet region
- Viscous loss and inertance of air
- Kinetic pressure change due to widening/narrowing of duct

**Pressure across parallel chink (Eq. 19)**:
Similar structure, with chink-specific areas A_c1, A_c2

### Viscous resistance (membranous glottis and chink):
```
R_v,g(t) = 12*mu*l_g^2 * integral_0^d_g { 1 / [A_g(y,t) + A_l(y,t)]^3 } dy

R_v,c(t) = 12*mu*l_g^2 * integral_0^d_g { 1 / A_c^3(y,t) } dy
```

### Inductance:
```
L_g(t) = rho * [ Delta_d_1/(A_g1+A_l1) + integral_0^d_g { 1/[A_g(y,t)+A_l(y,t)] } dy + Delta_d_2/(A_g2+A_l2) ]

L_c(t) = rho * [ Delta_d_1,c/A_c1 + integral_0^d_g { 1/A_c(t) } dy + Delta_d_2,c/A_c2 ]
```

End correction terms:
```
Delta_d_1,g = 0.61 * sqrt((A_g1 + A_l1) / pi)
Delta_d_2,g = 0.61 * sqrt((A_g2 + A_l2) / pi)
Delta_d_1,c = 0.61 * sqrt(A_c1 / pi)
Delta_d_2,c = 0.61 * sqrt(A_c2 / pi)
```
(End corrections for small tube ending in large volume without baffle, cf. Beranek 1986, p. 133)

## Discrete-Time Implementation (Appendix A)

Linearization approximations (Eq. 20):
```
U_g^2(n) ≈ 2*U_g(n)*U_g(n-1) - U_g^2(n-1)
U_c^2(n) ≈ 2*U_c(n)*U_c(n-1) - U_c^2(n-1)
U_tot^2(n) ≈ 2*U_tot(n)*U_tot(n-1) - U_tot^2(n-1)
U_g(n)*U_c(n) ≈ U_g(n)*U_c(n-1) + U_c(n)*U_g(n-1) - U_g(n-1)*U_c(n-1)
```

After linearization, Eqs. (21)-(23) become three linear equations in U_g(n), U_c(n), U_tot(n) and P_tr(n). Eliminating P_tr and substituting U_tot = U_g + U_c yields two equations in two unknowns solvable via Cramer's rule.

## Key Measured Values

- Subglottal pressure (male, normal speaking): 8-10 cm H2O (784-980 Pa)
- Peak transglottal pressure at closure: 15-30 cm H2O (1470-2940 Pa)
- Minima during open glottis: 2-6 cm H2O (196-588 Pa)
- DC-offset glottal flow: ~100 cm^3/s
- Peak-to-peak glottal flow: 300-600 cm^3/s
- Open quotient: ~50% (typical with appreciable dc-offset)

## Relevance for Klatt Synthesizer

This paper is directly relevant for modelling breathy and female voice qualities. The key insight is that the **type** of glottal leakage matters:

1. **Linked leak** (abduction-caused): steepens spectral tilt overall — maps to Klatt's TL (spectral tilt) parameter
2. **Parallel chink** (cartilaginous opening): attenuates low frequencies, preserves high-frequency slope — maps more closely to aspiration noise (AH) behavior and explains why breathy female voices can still have relatively strong high harmonics

For a Klatt-style parametric synthesizer, the distinction suggests that:
- Breathy voice from abduction (linked leak) should be modelled with increased spectral tilt (TL)
- Breathy voice from posterior chink should be modelled with added aspiration noise (AH) plus selective low-frequency attenuation, but NOT increased overall spectral tilt
- Female voices often have posterior chink, explaining the characteristic "breathy but not dull" quality

The four-component area derivative model (Eq. 13) with opening/closing corrections provides a more detailed template for glottal pulse shaping than the simple LF model, particularly for controlling the abruptness of opening and closing independently.

## Collection Cross-References

### Already in Collection
- `Holmberg_1988_GlottalAirflowPressure` — Holmberg et al. 1988, source of measured glottal flow and pressure values (cited)
- `Fant_1988_LFFrequencyDomainInterpretation` — LF model that this work extends with physiological geometry
- `Klatt_1990_VoiceQualityVariations` — Klatt's voice quality parameter system that maps to the leakage types identified here

### Cited By (in Collection)
- `Gerratt_2001_MeasuringVocalQualitySpeechSynthesis` — references Cranen & Schroeter on glottal modeling
- `Hanson_2001_ModelsPhonation` — references Cranen & Schroeter on physiological voice source

### New Leads
- Titze 1984 — baseline parameterization that this paper extends (Q_a, Q_s, Q_p)
- Ishizaka & Flanagan 1972 — two-mass model basis for aerodynamic equations

### Conceptual Links (not citation-based)
- `Holmberg_1995_AerodynamicEGGAcousticFemaleVoice` — female voice aerodynamic data directly relevant to the parallel chink model
- `Hanson_1995_GlottalCharacteristicsFemale` — female glottal characteristics that the linked leak vs. parallel chink distinction helps explain
- `Hanson_1999_GlottalMaleSpeakers` — male voice source data for comparison with the leakage model predictions
