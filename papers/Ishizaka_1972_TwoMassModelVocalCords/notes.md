---
title: "Synthesis of Voiced Sounds From a Two-Mass Model of the Vocal Cords"
authors: "K. Ishizaka, J. L. Flanagan"
year: 1972
venue: "The Bell System Technical Journal, Vol. 51, No. 6, July-August 1972"
pages: "1233-1268"
doi_url: "https://doi.org/10.1002/j.1538-7305.1972.tb02651.x"
---

# Synthesis of Voiced Sounds From a Two-Mass Model of the Vocal Cords

## One-Sentence Summary
Complete derivation and difference-equation implementation of the canonical two-mass self-oscillating vocal-cord model coupled to a bilateral vocal-tract transmission line, with every mechanical, aerodynamic, and circuit parameter numerically specified for direct simulation.

## Problem Addressed
The earlier one-mass self-oscillating cord model (Flanagan & Landgraf) produced acceptable voiced synthesis but was physiologically inadequate: acoustic source-tract interaction was greater than observed in human speech; it was congenitally incapable of sustained oscillation for a capacitive vocal-tract input load (oscillation just above a formant frequency); and it lacked a natural correlate of chest/falsetto registers and lacked a phase difference in the motion of upper and lower cord edges *(p.1235)*. Earlier multi-mass attempts produced realistic phase differences and chest-falsetto dichotomy but unrealistic dependence on acoustic load, due to the equivalent circuit of the glottal orifice, the manner of its control, and the available physiological data *(p.1235)*.

## Key Contributions
- A two-mass, stiffness-coupled, self-oscillating cord model with nonlinear springs, piecewise-linear (state-dependent) losses, and collision springs *(p.1236-1238)*.
- A momentum-based (rather than van den Berg empirical) treatment of pressure recovery at the glottal outlet, giving a smaller and more realistic source-tract interaction *(p.1239-1240)*.
- A full equivalent acoustic circuit of the glottis (contraction, two viscous glottal sections, junction kinetic-energy term, expansion) *(p.1241)*.
- Difference-equation formulation of the whole continuous cord + bilateral tract system, programmed interactively on a DDP-516 *(p.1233)*.
- Measured functional relations: F0 vs subglottal pressure 2-3 Hz/cm H2O, essentially independent of vowel configuration; cord-edge phase difference 0-60 degrees; chest/falsetto analogue under cord-tension control; phonation-neutral rest area as the critical factor for self-oscillation *(p.1233)*.

## Study Design (empirical papers)
Not an empirical human study. Computational modelling plus simulation on a DDP-516 laboratory computer, calibrated against published physiological measurements (excised human cords, van den Berg plaster-cast larynx flow measurements).

## Methodology
The vocal cords are assumed bilaterally symmetric, so only one cord is modelled and displacements are doubled to get area variation *(p.1237)*. Each cord is divided in depth (thickness) into an upper and a lower part; each part is a simple mechanical oscillator with mass, spring, and damping (m, s, r). The two masses `m1` and `m2` are permitted only lateral motion `x1` and `x2` and are coupled by a linear spring of stiffness `k_c` *(p.1236)*. The trachea (to lungs) and larynx tube (to vocal tract) are cylindrical and fixed in size; the glottis is the constriction between them. Inlet contraction occurs over distance `l_c`; expansion back to the vocal-tract cross section occurs over distance `l_e` *(p.1236)*.

One-dimensional quasi-steady Bernoulli flow is used for the glottal pressure distribution, justified by the small glottal dimensions relative to wavelength and by the high glottal flow velocity relative to cord velocity *(p.1238-1239)*.

## Symbol Glossary (Fig. 1, p.1236)

| Symbol | Meaning |
|--------|---------|
| `l_g` | effective length of the vocal cords (of the glottal slit) |
| `d1`, `d2` | thickness (depth) of `m1` and `m2` |
| `s1`, `s2` | equivalent springs |
| `r1`, `r2` | equivalent viscous resistances |
| `A_g01`, `A_g02` | cross-sectional areas of the glottal slit when `m1`, `m2` are at rest (the "phonation neutral" areas) |
| `U_g` | average volume velocity across the glottal area |
| `k_c` | linear coupling-spring stiffness between the two masses |
| `l_c` | inlet contraction distance |
| `l_e` | outlet expansion distance |
| `P_s` | subglottal (lung) pressure |
| `P_11`, `P_12`, `P_21`, `P_22` | pressures at the section boundaries along the glottis |
| `P_1` | pressure at the vocal-tract input |
| `A_1` | input area to the vocal tract |

## Key Equations / Statistical Models

### Glottal areas from lateral displacement

$$
A_{g1} = A_{g01} + 2 l_g x_1
$$
$$
A_{g2} = A_{g02} + 2 l_g x_2
$$
Where: `A_g1`, `A_g2` are the instantaneous glottal cross-sectional areas at the lower and upper masses (cm^2); `A_g01`, `A_g02` are the rest ("phonation neutral") areas; `l_g` is the effective cord length (cm); `x_1`, `x_2` are lateral displacements (cm). The factor 2 arises from bilateral symmetry (both cords move). *(p.1237)*

### Eq. (1) Nonlinear cord spring

$$
f_{sj} = k_j x_j (1 + \eta_{kj} x_j^2), \qquad j = 1, 2
$$
Where: `f_sj` is the force required to produce displacement `x_j`; `k_j` is the linear stiffness; `η_kj` is the coefficient describing the nonlinearity of spring `s_j`, positive in this case (hardening spring). Chosen to conform to stiffness measured on fresh excised human vocal cords. *(p.1237)*

### Eq. (2) Nonlinear collision (contact) spring

$$
f_{hj} = h_j\left(x_j + \frac{A_{g0j}}{2 l_g}\right)\left\{1 + \eta_{hj}\left(x_j + \frac{A_{g0j}}{2 l_g}\right)^2\right\}
$$
valid for
$$
x_j + A_{g0j}/(2 l_g) \le 0, \qquad j = 1, 2
$$
Where: `f_hj` is the force required to produce the deformation of mass `m_j` during collision with its opposing counterpart; `h_j` is the linear collision stiffness; `η_hj` is a positive nonlinearity coefficient of the contacting cords. The resultant restoring force on `m_j` during closure is the sum of eq. (1) and eq. (2). *(p.1237)*

The collision threshold defines
$$
x_{MIN} = -A_{g0j}/(2 l_g)
$$
which is the plane of symmetry (full closure) in Fig. 2. *(p.1238)*

### Eq. (3) Damping ratios to viscous resistances

$$
r_1 = 2 \zeta_1 \sqrt{m_1 k_1}, \qquad r_2 = 2 \zeta_2 \sqrt{m_2 k_2}
$$
Where: `r_1`, `r_2` are equivalent viscous resistances; `ζ_1`, `ζ_2` are damping ratios for the uncoupled oscillators; `k_1`, `k_2` are the linear stiffness components of springs `s_1`, `s_2`. *(p.1238)*

### Eq. (4) Piecewise-linear loss switching at closure

$$
\zeta_1 = (1.0 + 0.1), \qquad \zeta_2 = (1.0 + 0.6)
$$
During open glottis, `ζ_1 = 0.1` and `ζ_2 = 0.6`. During the closed-glottis condition, loss is taken as essentially critical damping, with the additional 1.0 added, representing the "stickiness" of the soft, moist contacting surfaces as they form together. *(p.1238)*

### Inlet (contraction) pressure drop

$$
P_{B1}(1.00 + 0.37), \qquad \text{or} \qquad 0.69 \rho \left(U_g^2 / A_{g1}^2\right)
$$
Where: `P_B1 = (1/2) ρ u_g1^2` is the Bernoulli pressure, `ρ` the air density, `u_g1` the particle velocity at the lower cord edge. The 0.37 loss factor is the vena-contracta contraction loss taken from van den Berg's plaster-cast larynx flow measurements; general fluid-flow experiments give 0.4 to 0.5. *(p.1239)*

### Viscous drop in each glottal section

Resistance to volume flow in the lower section is `12 μ d_1 l_g^2 / A_g1^3`, and in the upper section `12 μ d_2 l_g^2 / A_g2^3`, where `μ` is the shear viscosity coefficient. Pressure falls linearly with distance in these regions, consistent with van den Berg's measurements. *(p.1239)*

### Eq. (5) Kinetic-energy pressure change at the m1/m2 junction

$$
\Delta p = \tfrac{1}{2}\rho\left(u_{g1}^2 - u_{g2}^2\right) = \tfrac{1}{2}\rho U_g^2 \left(\frac{1}{A_{g2}^2} - \frac{1}{A_{g1}^2}\right)
$$
Where: `U_g` is continuous across the junction but the particle velocity changes; `u_g1`, `u_g2` are the particle velocities at the lower and upper cord edges. *(p.1239)*

### Eq. (6) Momentum-based pressure recovery at the glottal outlet

$$
(P_1 - P_{22}) = \tfrac{1}{2}\rho u_{g2}^2\left[2N(1-N)\right] = \tfrac{1}{2}\rho \frac{U_g^2}{A_{g2}^2}\left[2N(1-N)\right] = P_{B2}\left[2N(1-N)\right]
$$
Where: `N = A_g2 / A_1`, `P_B2 = (1/2) ρ u_g2^2`, and `A_1` is the input area to the vocal tract. Derived from Newton's law `f = (d/dt)(mv)` with `U_g` continuous: `ρ U_g (u_1 - u_g2) = A_1 (P_22 - P_1)`. The value of `2N(1-N)` is typically of order **0.05 to 0.40**, somewhat smaller than van den Berg's empirical recovery of about `0.5 P_B`. This difference is significant to the acoustic interaction between the vocal tract and the cord source. *(p.1240)*

### Eq. (7) Complete pressure distribution along the glottis (time-varying, with inertance)

$$
P_s - P_{11} = 1.37\,\frac{\rho}{2}\left(\frac{U_g}{A_{g1}}\right)^2 + \int_0^{l_c}\frac{\rho}{A_c(x)}\,dx \cdot \frac{dU_g}{dt}
$$
$$
P_{11} - P_{12} = 12\,\frac{\mu l_g^2 d_1}{A_{g1}^3}\,U_g + \frac{\rho d_1}{A_{g1}}\cdot\frac{dU_g}{dt}
$$
$$
P_{12} - P_{21} = \frac{\rho}{2}U_g^2\left(\frac{1}{A_{g2}^2} - \frac{1}{A_{g1}^2}\right)
$$
$$
P_{21} - P_{22} = 12\,\frac{\mu l_g^2 d_2}{A_{g2}^3}\,U_g + \frac{\rho d_2}{A_{g2}}\cdot\frac{dU_g}{dt}
$$
$$
P_{22} - P_1 = -\frac{\rho}{2}\left(\frac{U_g}{A_{g2}}\right)^2 \cdot 2\,\frac{A_{g2}}{A_1}\left(1 - \frac{A_{g2}}{A_1}\right)
$$
Where: `A_c(x)` is the contraction-region area profile; the footnote states that the `U_g (dL/dt)` term in `(d/dt)(L U_g)` is negligible, where `L = ρ d / A`. *(p.1240)*

### Eq. (8) Glottal equivalent-circuit elements (Fig. 4)

$$
R_c = 1.37\,\frac{\rho}{2}\,\frac{|U_g|}{A_{g1}^2}, \qquad L_c = \int_0^{l_c}\frac{\rho\,dx}{A_c(x)}
$$
$$
R_{v1} = 12\,\frac{\mu l_g^2 d_1}{A_{g1}^3}, \qquad L_{g1} = \frac{\rho d_1}{A_{g1}}
$$
$$
R_{12} = \frac{\rho}{2}\left(\frac{1}{A_{g2}^2} - \frac{1}{A_{g1}^2}\right)|U_g|
$$
$$
R_{v2} = 12\,\frac{\mu l_g^2 d_2}{A_{g2}^3}, \qquad L_{g2} = \frac{\rho d_2}{A_{g2}}
$$
$$
R_e = -\frac{\rho}{2}\cdot\frac{2}{A_{g2} A_1}\left(1 - \frac{A_{g2}}{A_1}\right)|U_g|
$$
Where: `R_c`, `L_c` are contraction (inlet) resistance and inertance; `R_v1`, `R_v2` viscous resistances of the lower/upper glottal sections; `L_g1`, `L_g2` their inertances; `R_12` the junction kinetic-energy resistance; `R_e` the expansion (outlet) resistance, which is **negative** (pressure recovery). All flow-dependent resistances use `|U_g|` so they are odd-symmetric in flow direction. The `U_g` current is continuous through the whole series circuit. *(p.1241)*

## Figures of Interest
- **Fig. 1 (p.1236):** Schematic of the two-mass approximation. Left panel shows trachea/lungs at `P_s`, contraction of length `l_c`, glottis of depth `d = d1 + d2`, expansion `l_e`, and vocal tract; pressures `P_11`, `P_12`, `P_21`, `P_22`, `P_1`; springs `s1`, `s2`, resistances `r1`, `r2`, coupling spring `k_c`. Right panel is a cross section showing `A_g1 = (A_g0 + 2 l_g x_1)`.
- **Fig. 2 (p.1238):** Characteristics of the nonlinear stiffnesses. Force vs displacement showing `k_j x_j` linear line, the hardening `f_sj` curve, the collision branch `f_hj` with slope `h_j (x_j - x_MIN)` left of the plane of symmetry, and `x_MIN = -A_g0j / (2 l_g)`.
- **Fig. 3 (p.1241):** Pressure distribution along the glottal flow: `P_s` flat in trachea, falling through contraction to `P_11`, linear viscous falls to `P_12`, step down at the `P_12`/`P_21` boundary, further viscous fall to `P_22` (the minimum, below atmospheric `P_0`), then recovery through the expansion (larynx tube) to `P_1`.
- **Fig. 4 (p.1241):** Equivalent circuit for the glottis: series `R_c, L_c` (contraction), `R_v1, L_g1` (m1), `R_12` (boundary), `R_v2, L_g2` (m2), `R_e` (expansion), with node pressures `P_s, P_11, P_12, P_21, P_22, P_1`.

## Design Rationale
- **Two masses rather than one** because a two-mass approximation can account for most of the relevant glottal detail, including the phase difference between upper and lower cord edges and oscillation for a capacitive vocal-tract input impedance; a full distributed periodic mass-spring-loss chain is possible but unnecessary *(p.1235)*.
- **Nonlinear (hardening) springs** chosen to match stiffness measured on fresh, excised human vocal cords *(p.1237)*.
- **Separate collision springs `h_j` with the same nonlinear form** so that closure produces a realistic contact restoring force from flesh deformation, rather than a hard stop *(p.1237)*.
- **Piecewise-linear damping stepped up at closure** to represent the "stickiness" of the soft moist contacting surfaces *(p.1238)*.
- **Momentum-based outlet recovery instead of van den Berg's empirical 0.5 P_B**, because for small constrictions the direct measurement is difficult and uncertain, and momentum considerations hold in fluid-flow theory. This lowers the recovery factor to 0.05-0.40 and is stated to matter significantly for source-tract interaction *(p.1239-1240)*.
- **Inlet loss factor 0.37 taken from van den Berg's plaster-cast larynx measurements** in preference to the 0.4-0.5 range from general fluid-flow contraction experiments, because it is larynx-specific *(p.1239)*.

## Arguments Against Prior Work
- The one-mass model showed **greater source-tract acoustic interaction than observed in human speech**; the footnote attributes this to the trans-glottal pressure distribution, since the first work used van den Berg's glottal pressure measurements *(p.1235)*.
- The one-mass model was **congenitally incapable of sustained oscillation for a capacitive input load** of the vocal tract, i.e., oscillation at a frequency just above a formant frequency *(p.1235)*.
- The one-mass model **lacked a physiologically natural correlate of chest and falsetto registers** and lacked a phase difference in cord-edge motion *(p.1235)*.
- An earlier multi-mass computer simulation gave realistic phase differences and chest-falsetto dichotomy but **unrealistic dependence on acoustic load**, blamed on the glottal-orifice equivalent circuit, the manner of its control, and the available physiological data *(p.1235)*.
- Van den Berg's measured pressure recovery of about `0.5 P_B` is treated as **unreliable for small constrictions** and replaced by the momentum estimate *(p.1239-1240)*.

## Key Equations (continued)

### Eq. (9) Total glottal acoustic impedance

$$
Z_g = \frac{\rho}{2}|U_g|\left\{\frac{0.37}{A_{g1}^2} + \frac{1 - 2\frac{A_{g2}}{A_1}\left(1 - \frac{A_{g2}}{A_1}\right)}{A_{g2}^2}\right\} + (R_{v1} + R_{v2}) + j\omega(L_{g1} + L_{g2} + L_c)
$$
Where: the braced group collects the flow-dependent (kinetic) resistances of contraction and expansion; `R_v1`, `R_v2` are the viscous resistances; the imaginary part is the total inertance. *(p.1242)*

### Eq. (10) Impedance in R_k form

$$
Z_g = (R_{k1} + R_{k2})|U_g| + (R_{v1} + R_{v2}) + j\omega(L_{g1} + L_{g2} + L_c)
$$
with
$$
R_{k1} = \frac{0.19\rho}{A_{g1}^2}, \qquad R_{k2} = \frac{\rho\left[0.5 - \frac{A_{g2}}{A_1}\left(1 - \frac{A_{g2}}{A_1}\right)\right]}{A_{g2}^2}
$$
Where: `R_k1`, `R_k2` are the kinetic (flow-dependent) resistance coefficients at glottal inlet and outlet. **In general `L_c` can be neglected in comparison to `(L_g1 + L_g2)`.** *(p.1242)*

### Eq. (11) Van den Berg-equivalent impedance (comparison case)

Using van den Berg's outlet pressure recovery of `(1/2) P_B2` instead of the momentum relation of eq. (6) gives `R_e = -(rho/4)|U_g| / A_g2^2`. For `A_g1 = A_g2 = A_g`, the total glottal impedance becomes

$$
z_g = -0.87\,\frac{\rho}{2}\,\frac{|U_g|}{A_g^2} + 12\,\frac{\mu l_g^2 d}{A_g^3} + j\omega L_g
$$
The real part of this impedance is identical with that given by van den Berg. *(p.1242)*

## Model System for Voiced Sounds (Section VI, Fig. 5)

- **Subglottal system** (trachea, bronchi, lungs) is **neglected**; subglottal pressure is approximated by a constant excess pressure in the lungs. Justified because its first resonance is relatively high: **mean 650 Hz, bandwidth 250 Hz**, from direct measurements of subglottal driving-point impedance on **five laryngectomized subjects**. The 650 Hz figure is considerably higher than the 300 Hz reported by van den Berg. *(p.1243)*
- **Vocal tract** is a transmission line of `n` cylindrical, hard-walled sections with element values from cross-sectional areas `A_1 ... A_n` and lengths `l_1 ... l_n`. **In the present work `n = 4`.** *(p.1243)*
- Inductances `L_n = rho l_n / (2 A_n)`. Capacitances `C_n = l_n A_n / (rho c^2)`, where `c` is the sound velocity. *(p.1243)*
- Serial tract resistances take the form of viscous loss at the pipe wall:

$$
R_n = \frac{S_n}{A_n^2}\sqrt{\frac{\rho \mu \omega}{2}}
$$
where `S_n` is the circumference of the nth section and `omega` the radian frequency. The frequency for evaluating this loss is fixed at the natural frequency of the lower oscillator, `f = (1/2 pi) sqrt(k_1/m_1)`. A multiplicative coefficient **ATT** is applied to increase the loss beyond wall viscous loss, so as to produce formant bandwidths appropriate to a closed-glottis condition. **Typical range for ATT is 20 to 25.** *(p.1243)*
- Footnote: other tract losses not included per se are non-rigid walls (quite significant in lower-formant damping) and heat conduction at the wall (essentially negligible). *(p.1243)*
- **Radiation load** is that of a circular piston in an infinite baffle: `L_R = 8 rho / (3 pi sqrt(pi A_n))` and `R_R = 128 rho c / (9 pi^2 A_n)`, where `A_n` is the final (mouth) area. *(p.1243)*
- A **cord-tension parameter `Q`** constitutes an input to the vocal-cord model and determines the mechanical constants of the oscillator *(p.1248, footnote)*.

### Eq. (12) Continuous loop equations for the network of Fig. 5

$$
(R_{k1}+R_{k2})|U_g|U_g + (R_{v1}+R_{v2})U_g + (L_{g1}+L_{g2})\frac{dU_g}{dt} + L_1\frac{dU_g}{dt} + R_1 U_g + \frac{1}{C_1}\int_0^t (U_g - U_1)\,dt - P_s = 0
$$
$$
(L_1+L_2)\frac{dU_1}{dt} + (R_1+R_2)U_1 + \frac{1}{C_2}\int_0^t (U_1-U_2)\,dt + \frac{1}{C_1}\int_0^t (U_1-U_g)\,dt = 0
$$
$$
(L_2+L_3)\frac{dU_2}{dt} + (R_2+R_3)U_2 + \frac{1}{C_3}\int_0^t (U_2-U_3)\,dt + \frac{1}{C_2}\int_0^t (U_2-U_1)\,dt = 0
$$
$$
(L_3+L_4)\frac{dU_3}{dt} + (R_3+R_4)U_3 + \frac{1}{C_4}\int_0^t (U_3-U_L)\,dt + \frac{1}{C_3}\int_0^t (U_3-U_2)\,dt = 0
$$
$$
(L_4+L_R)\frac{d U_L}{dt} + R_4 U_L - L_R\frac{dU_R}{dt} + \frac{1}{C_4}\int_0^t (U_L - U_3)\,dt = 0
$$
$$
L_R\frac{d}{dt}(U_R - U_L) + R_R U_R = 0
$$
Where: these are the g-loop, 1-loop, 2-loop, 3-loop, 4-loop and 5-loop equations respectively. `U_g` is glottal volume velocity, `U_1..U_3` are tract loop currents, `U_L` and `U_R` are the currents through the radiation inductance and resistance branches. *(p.1243-1244)*

### Eq. (13) Driving pressures on the two masses

$$
P_{m1} = \tfrac{1}{2}(P_{11}+P_{12}) = P_s - 1.37\frac{\rho}{2}\left(\frac{U_g}{A_{g1}}\right)^2 - \frac{1}{2}\left(R_{v1}U_g + L_{g1}\frac{dU_g}{dt}\right)
$$
$$
P_{m2} = \tfrac{1}{2}(P_{21}+P_{22}) = P_{m1} - \tfrac{1}{2}\left\{(R_{v1}+R_{v2})U_g + (L_{g1}+L_{g2})\frac{dU_g}{dt}\right\} - \frac{\rho}{2}U_g^2\left(\frac{1}{A_{g2}^2} - \frac{1}{A_{g1}^2}\right)
$$
Where: the masses are driven by the **mean** pressures acting on their exposed faces. The exposed areas are `l_g d_1` and `l_g d_2` respectively. *(p.1244)*

### Eq. (14) Force table (closure-dependent driving forces)

A cord shape is assumed such that the forces `F_1` and `F_2` acting on `m_1` and `m_2` over displacements `x_1` and `x_2` are:

| `x_1` condition | `x_2` condition | `F_1 / (l_g d_1)` | `F_2 / (l_g d_2)` |
|---|---|---|---|
| `x_1 > x_1min` | `x_2 > x_2min` | `P_m1` | `P_m2` |
| `x_1 <= x_1min` | `x_2 > x_2min` | `P_s` | `0` |
| `x_1 > x_1min` | `x_2 <= x_2min` | `P_s` | `P_s` |
| `x_1 <= x_1min` | `x_2 <= x_2min` | `P_s` | `0` |

where `x_1min = -(A_g01 / 2 l_g)` and `x_2min = -(A_g02 / 2 l_g)`, and `A_g01`, `A_g02` are the phonation-neutral values of the glottal area. *(p.1244-1245)*

Interpretation: when the lower mass is closed, full subglottal pressure `P_s` acts on it. When only the upper mass is closed, both masses see `P_s`. Whenever the upper mass is closed together with the lower, the upper mass sees zero force (it is shielded from the subglottal pressure).

### Eq. (15) Equations of motion for the two masses

$$
m_1\frac{d^2 x_1}{dt^2} + r_1\frac{dx_1}{dt} + s_1(x_1) + k_c(x_1 - x_2) = F_1
$$
$$
m_2\frac{d^2 x_2}{dt^2} + r_2\frac{dx_2}{dt} + s_2(x_2) + k_c(x_2 - x_1) = F_2
$$
with
$$
A_{g1} = A_{g01} + 2 l_g x_1, \qquad A_{g2} = A_{g02} + 2 l_g x_2
$$
$$
s_j(x_j) = k_j\left(x_j + \eta_{kj} x_j^3\right), \quad j = 1,2, \quad \text{for } x_j > -\frac{A_{g0j}}{2 l_g}
$$
$$
s_j(x_j) = k_j\left(x_j + \eta_{kj} x_j^3\right) + h_j\left\{\left(x_j + \frac{A_{g0j}}{2 l_g}\right) + \eta_{hj}\left(x_j + \frac{A_{g0j}}{2 l_g}\right)^3\right\}, \quad \text{for } x_j \le -\frac{A_{g0j}}{2 l_g}
$$
Where `F_1`, `F_2` come from the force table of eq. (14). These equations are coupled to the flow equations through the fact that `x_1` and `x_2` determine `A_g1` and `A_g2`. *(p.1245)*

Note that eq. (15) writes the spring law in the `k_j (x_j + eta_kj x_j^3)` form, which is algebraically the same as eq. (1)'s `k_j x_j (1 + eta_kj x_j^2)`.

**Coupling linearization caveat:** the coupling between the masses, permitted only lateral motion, has been **linearized** to be proportional to `(x_2 - x_1)`. A more detailed consideration of the elongation produced in the coupling spring by a displacement difference `(x_2 - x_1)`, and of the lateral component of restoring force, leads to modifying the coupling term to

$$
\frac{2 k_c (x_2 - x_1)^3}{(d_1 + d_2)^2}
$$
*(p.1245)*

## Digital Simulation (Section VIII)

### Eq. (16) Discretization scheme

$$
\frac{df(t)}{dt} \cong \frac{f(t_i) - f(t_{i-1})}{t_i - t_{i-1}} = \frac{f_i - f_{i-1}}{T}
$$
$$
\int_0^t f(t)\,dt \cong (t_i - t_{i-1})\sum_{j=0}^{i-1} f(t_j) = T\sum_{j=0}^{i-1} f_j
$$
Backward-difference derivative and rectangular-rule (running-sum) integral, with sampling interval `T`. *(p.1245)*

### Eq. (17) Difference-equation network loops

$$
(R_{k1i}+R_{k2i})|U_{gi}|U_{gi} + (R_{v1i}+R_{v2i})U_{gi} + (L_{g1i}+L_{g2i})\frac{U_{gi}-U_{gi-1}}{T} + L_1\frac{U_{gi}-U_{gi-1}}{T} + R_1 U_{gi} + \frac{T}{C_1}\sum_{j=0}^{i-1}(U_{gj}-U_{1j}) - P_s = 0
$$
$$
\left\{\frac{L_1+L_2}{T} + (R_1+R_2)\right\}U_{1i} - \frac{L_1+L_2}{T}U_{1i-1} + \frac{T}{C_2}\sum_{j=0}^{i-1}(U_{1j}-U_{2j}) + \frac{T}{C_1}\sum_{j=0}^{i-1}(U_{1j}-U_{gj}) = 0
$$
$$
\left\{\frac{L_2+L_3}{T} + (R_2+R_3)\right\}U_{2i} - \frac{L_2+L_3}{T}U_{2i-1} + \frac{T}{C_3}\sum_{j=0}^{i-1}(U_{2j}-U_{3j}) + \frac{T}{C_2}\sum_{j=0}^{i-1}(U_{2j}-U_{1j}) = 0
$$
$$
\left\{\frac{L_3+L_4}{T} + (R_3+R_4)\right\}U_{3i} - \frac{L_3+L_4}{T}U_{3i-1} + \frac{T}{C_4}\sum_{j=0}^{i-1}(U_{3j}-U_{Lj}) + \frac{T}{C_3}\sum_{j=0}^{i-1}(U_{3j}-U_{2j}) = 0
$$
$$
\left\{\frac{L_4+L_R}{T} + R_4\right\}U_{Li} - \frac{L_4+L_R}{T}U_{Li-1} - \frac{L_R}{T}(U_{Ri}-U_{Ri-1}) + \frac{T}{C_4}\sum_{j=0}^{i-1}(U_{Lj}-U_{3j}) = 0
$$
$$
\frac{L_R}{T}\left\{(U_{Ri}-U_{Li}) - (U_{Ri-1}-U_{Li-1})\right\} + R_R U_{Ri} = 0
$$
with the **key delay structure** (impedance elements use the previous sample's glottal areas, which is what closes the iteration loop):
$$
R_{k1i} = \frac{0.19\rho}{A_{g1\,i-1}^2}, \qquad R_{k2i} = \frac{\left[0.5 - \frac{A_{g2\,i-1}}{A(1)}\left(1 - \frac{A_{g2\,i-1}}{A(1)}\right)\right]\rho}{A_{g2\,i-1}^2}
$$
$$
L_{g1i} = \frac{\rho d_1}{A_{g1\,i-1}}, \qquad L_{g2i} = \frac{\rho d_2}{A_{g2\,i-1}}
$$
$$
R_{v1i} = 12\mu l_g^2\frac{d_1}{A_{g1\,i-1}^3}, \qquad R_{v2i} = 12\mu l_g^2\frac{d_2}{A_{g2\,i-1}^3}
$$
Here `A(1)` is the first vocal-tract section area (the `A_1` of eq. 10). *(p.1246)*

### Eq. (18) Difference equations for the mechanical system

$$
\frac{m_1}{T^2}(x_{1i} - 2x_{1i-1} + x_{1i-2}) + \frac{r_1}{T}(x_{1i} - x_{1i-1}) + s_1(x_{1i}) + k_c(x_{1i-1} - x_{2i-1}) = F_{1i}
$$
$$
\frac{m_2}{T^2}(x_{2i} - 2x_{2i-1} + x_{2i-2}) + \frac{r_2}{T}(x_{2i} - x_{2i-1}) + s_2(x_{2i}) + k_c(x_{2i-1} - x_{1i-1}) = F_{2i}
$$
with
$$
A_{g1i} = A_{g01} + 2 l_g x_{1i}, \qquad A_{g2i} = A_{g02} + 2 l_g x_{2i}
$$
$$
s_1(x_{1i}) = k_1(x_{1i} + \eta_{k1} x_{1\,i-1}^3), \quad \text{for } x_{1i} > -\frac{A_{g01}}{2 l_g}
$$
$$
s_1(x_{1i}) = k_1(x_{1i} + \eta_{k1}x_{1\,i-1}^3) + h_1\left\{\left(x_{1i} + \frac{A_{g01}}{2l_g}\right) + \eta_{h1}\left(x_{1\,i-1} + \frac{A_{g01}}{2l_g}\right)^3\right\}, \quad \text{for } x_{1i} \le -\frac{A_{g01}}{2l_g}
$$
$$
s_2(x_{2i}) = k_2(x_{2i} + \eta_{k2} x_{2\,i-1}^3), \quad \text{for } x_{2i} > -\frac{A_{g02}}{2 l_g}
$$
$$
s_2(x_{2i}) = k_2(x_{2i} + \eta_{k2}x_{2\,i-1}^3) + h_2\left\{\left(x_{2i} + \frac{A_{g02}}{2l_g}\right) + \eta_{h2}\left(x_{2\,i-1} + \frac{A_{g02}}{2l_g}\right)^3\right\}, \quad \text{for } x_{2i} \le -\frac{A_{g02}}{2l_g}
$$
$$
F_{1i}/(d_1 l_g) = P_{m1i} = P_s - 1.37\frac{\rho}{2}\left(\frac{U_{gi}}{A_{g1\,i-1}}\right)^2 - \frac{1}{2}\left\{R_{v1i}U_{gi} + \frac{L_{g1i}}{T}(U_{gi}-U_{gi-1})\right\}
$$
$$
F_{2i}/(d_2 l_g) = P_{m2i} = P_{m1i} - \left\{\frac{1}{2}(R_{v1i}+R_{v2i})U_{gi} + (L_{g1i}+L_{g2i})\frac{U_{gi}-U_{gi-1}}{T}\right\} - \frac{\rho}{2}U_{gi}^2\left(\frac{1}{A_{g2\,i-1}^2} - \frac{1}{A_{g1\,i-1}^2}\right)
$$
**Delay placement matters:** the cubic nonlinear terms use `x_{i-1}` (previous sample) while the linear term uses `x_i`, keeping each equation linear in the unknown `x_i`. The coupling term also uses previous-sample displacements. Glottal areas inside the pressure terms are previous-sample. *(p.1247)*

## Algorithm: Simulation Iteration Loop *(p.1247-1248)*

1. Programmed in **Fortran IV**, compiled for a **DDP-516** laboratory computer in the Acoustics Research Department at Bell Laboratories.
2. Simultaneous solution of eqs. (17) and (18) yields all relevant volume velocities, glottal areas, and displacements.
3. The **time derivative of the mouth volume velocity** (through the radiation load) is a good approximation to the radiated sound pressure; mouth output samples are taken as the synthetic speech signal.
4. Cords and tract are initially assumed at rest; initial currents are zero.
5. The first sample of `U_gi` is calculated from loop-g using `A_g,i-1 = A_g0` (i.e., `x_{i-1} = 0`).
6. The initial samples of all other loop currents are likewise calculated, out to the radiation load.
7. The first sample of `U_gi` is then used to calculate the first samples of the forcing functions and, from the mechanical equations, the first samples of the displacements `x_1i` and `x_2i`.
8. The displacements dictate new values of `A_g1` and `A_g2`, entered back into the glottal impedance elements for the next sample of `U_g` and all other currents.
9. Continue until as much of the solution as desired is obtained.
10. The loop closes because glottal impedance elements and forcing functions use only **past** values of glottal area.
11. For continuous speech, tract areas, `P_s`, `A_g0`, and cord constants change slowly compared to sample variations in volume velocity, displacement and pressure; the solutions are therefore treated as quasi-steady solutions of eqs. (17) and (18).

### Sampling-rate stability rule
The sampling interval `T` is chosen as the **longest interval that yields a stable solution**. It is determined primarily by the time required for sound to transit the **shortest** length of the vocal tube. `T` must be considerably shorter than that transit time because the distributed tract is approximated as lumped-constant T-sections and the behavior of those elements is further approximated by finite differences. In the absence of appropriate sampling theory for this situation, the broad range of stable solutions was determined interactively on the DDP-516 and the longest stable interval used. **Sampling rates in the range 10 kHz to 30 kHz were used.** *(p.1248)*

## Self-Oscillation Region (Section IX, Fig. 6)

Few numerical values are available for the physiological parameters of the vocal cords; the DDP-516 simulation was used to establish relevant ranges *(p.1249)*. The oscillation region was studied for a **uniform vocal tract, 16 cm long, 5 cm^2 in cross-section, terminated in the radiation load** *(p.1249)*. Fig. 6 plots the allowed oscillation region as a function of `k_2` and `k_c`, with axes normalized by the factor `m_1/(m_2 k_1)`: the abscissa is `(k_c/k_1)(m_1/m_2)` and the ordinate is `(k_2/k_1)(m_1/m_2)`. The contour parameter is the open-glottis damping-ratio pair `zeta_1/zeta_2`.

**Fig. 6(a) conditions** (vowel /schwa/): `k_1 = 50 kdyn/cm`, `d_1 = d_2 = 0.15 cm`, `m_1 = m_2 = 0.075 g`. Contours for `zeta_1/zeta_2 = 0.1/0.15` and `0.2/0.3`. The `0.1/0.15` region peaks near ordinate 1.3 and extends as a thin dashed band far to the right.

**Fig. 6(b) conditions** (vowel /schwa/): `k_1 = 80 kdyn/cm`, `d_1 = 0.25 cm`, `d_2 = 0.05 cm`, `m_1 = 0.125 g`, `m_2 = 0.025 g`. Contours for `zeta_1/zeta_2 = 0.1/0.6` (largest, reaching ordinate about 5.4 and abscissa about 8.7), `0.2/0.6` (ordinate about 2.2, abscissa about 4.3), and `0.4/0.6` (ordinate about 1.1, abscissa about 2.5). A small open circle marks a chosen operating point near abscissa 2, ordinate 0.2.

**Qualitative result:** the asymmetric-mass configuration (b) admits a far larger oscillation region than the symmetric configuration (a), and lower open-glottis damping enlarges the region monotonically. *(p.1249)*

## Physiological Constants (Section IX, p.1250)

Held constant at physiologically realistic values for the oscillation-region study:

| Name | Symbol | Units | Default | Range | Page | Notes |
|------|--------|-------|---------|-------|------|-------|
| Subglottal pressure | `P_s` | cm H2O | 8 | 2-32 | 1250 | Minimum for vowel production about 2 cm H2O (p.1258) |
| Effective cord length | `l_g` | cm | 1.4 | - | 1250 | Held constant |
| Phonation-neutral area (lower) | `A_g01` | cm^2 | 0.05 | 0.05-0.30 | 1250 | Equal to `A_g02` in the standard condition |
| Phonation-neutral area (upper) | `A_g02` | cm^2 | 0.05 | 0.05-0.30 | 1250 | |
| Total cord thickness | `d_1 + d_2` | cm | 0.3 | - | 1250 | Held constant |
| Total cord mass | `m_1 + m_2` | g | 0.15 | - | 1250 | Held constant across Fig. 6a and 6b |
| Spring nonlinearity coefficient | `eta_k1`, `eta_k2` | cm^-2 | 100 | 0, 50, 100 | 1250, 1257 | Deduced on the order of 50 to 100 from excised-larynx static tensile stress vs displacement |
| Collision nonlinearity coefficient | `eta_h1`, `eta_h2` | cm^-2 | 500 | - | 1250 | Taken as `eta_h = 5 eta_k` (p.1257) |
| Collision stiffness | `h_1`, `h_2` | - | `3 k_1`, `3 k_2` | - | 1250 | Also given as 150 kdyn/cm in the Fig. 12 conditions |
| Shear viscosity coefficient | `mu` | poise | - | - | 1239 | Value not stated numerically in text |

### Fig. 6a configuration (symmetric masses)

| Name | Symbol | Units | Value | Page |
|------|--------|-------|-------|------|
| Lower stiffness | `k_1` | kdyn/cm | 50 | 1250 |
| Lower thickness | `d_1` | cm | 0.15 | 1250 |
| Upper thickness | `d_2` | cm | 0.15 | 1250 |
| Lower mass | `m_1` | g | 0.075 | 1250 |
| Upper mass | `m_2` | g | 0.075 | 1250 |

### Fig. 6b / "typical" configuration (asymmetric masses; used throughout the study)

| Name | Symbol | Units | Value | Page |
|------|--------|-------|-------|------|
| Lower stiffness | `k_1` | kdyn/cm | 80 | 1250 |
| Upper stiffness | `k_2` | dyn/cm | 8 | 1250 |
| Coupling stiffness | `k_c` | kdyn/cm | 25 | 1250 |
| Lower thickness | `d_1` | cm | 0.25 | 1250 |
| Upper thickness | `d_2` | cm | 0.05 | 1250 |
| Lower mass | `m_1` | g | 0.125 | 1250 |
| Upper mass | `m_2` | g | 0.025 | 1250 |
| Open-glottis damping ratio (lower) | `zeta_1` | - | 0.1 | 1238, 1250 |
| Open-glottis damping ratio (upper) | `zeta_2` | - | 0.6 | 1238, 1250 |

Masses are chosen proportional to the thicknesses, keeping the same total mass of 0.15 g as in Fig. 6a *(p.1250)*.

**Note on the printed value `k_2 = 8 dyn/cm`:** the text states "`k_1 = 80 kdyn/cm`, `k_2 = 8 dyn/cm`, and `k_c = 25 kdyn/cm`" *(p.1250)*. The units on `k_2` are almost certainly a typographical slip for kdyn/cm; the Fig. 6b normalized operating point (ordinate about 0.2, i.e. `(k_2/k_1)(m_1/m_2) = 0.2` giving `k_2 = 0.2 * 80 / 5 = 3.2` kdyn/cm) does not reconcile exactly either way. Treat this value with caution when reimplementing.

### Fig. 12 conditions (one-mass vs two-mass comparison)

| Name | Symbol | Units | Value | Page |
|------|--------|-------|-------|------|
| Thicknesses | `d_1 = d_2` | cm | 0.15 | 1259 |
| Stiffnesses | `k_1 = k_2` | kdyn/cm | 50 | 1259 |
| Damping ratio (lower) | `zeta_1` | - | 0 | 1259 |
| Damping ratio (upper) | `zeta_2` | - | 0.01 | 1259 |
| Neutral area | `A_g0` | cm^2 | 0.05 | 1259 |
| Collision stiffnesses | `h_1 = h_2` | kdyn/cm | 150 | 1259 |
| Spring nonlinearity | `eta_k1 = eta_k2` | cm^-2 | 100 | 1259 |
| Collision nonlinearity | `eta_h1 = eta_h2` | cm^-2 | 500 | 1259 |

### Damping ratio from excised larynx (Kaneko)
Kaneko measured the damped oscillations of a fresh excised human larynx excited by a mechanical impulse with no air flow through the glottis. From this data the damping ratio for excised human cords is estimated **on the order of 0.1 to 0.2**, the same order as deduced in the earlier one-mass simulations. This range seems particularly appropriate for the bulk of the cords, i.e. for `m_1` of the model. *(p.1250)*

### Equivalent damping ratio (footnote, p.1250)

$$
(r_1 + r_2) = 2\zeta_1\sqrt{m_1 k_1} + 2\zeta_2\sqrt{m_2 k_2}
$$
For `k_c -> infinity`,
$$
(r_1 + r_2) = 2\zeta_{equi}\sqrt{(m_1+m_2)(k_1+k_2)}
$$
Substituting the typical conditions `m_2 = m_1/5`, `k_2 = k_1/10`, `zeta_1 = 0.1`, `zeta_2 = 0.6` gives
$$
\zeta_{equi} = \frac{1}{\sqrt{66}}\left(\sqrt{50}\,\zeta_1 + \zeta_2\right) = 0.16
$$
which corresponds favorably with Kaneko's measurements. *(p.1250)*

**Important:** this footnote states the typical condition as `k_2 = k_1/10`, i.e. `k_2 = 8 kdyn/cm` for `k_1 = 80 kdyn/cm`. This resolves the ambiguity noted above: **`k_2 = 8 kdyn/cm`**, and the printed "8 dyn/cm" on p.1250 is a typographical error.

### Qualitative loading effects on oscillation *(p.1250)*
- An acoustic load whose driving-point impedance has an **inductive reactance** at the fundamental frequency of cord vibration **acts to enhance** oscillation of the model.
- An increase in vocal-tract damping at lower frequencies, as would be caused by wall vibration, **acts to oppose** oscillation.
- The tendency to oscillate is **suppressed** by an increase in the mechanical damping of `m_1` and **especially** of `m_2`.

## Results of the Digital Simulation (Section X)

### 10.1 Waveforms for typical glottal conditions *(p.1251-1252)*
Fig. 7 shows `A_g1`, `A_g2`, `U_g`, and mouth sound pressure for the **initial 30 ms** of voicing, uniform tract, vowel /schwa/.
- **Phase difference between `m_1` and `m_2` is about 55 degrees**; **duty ratio (glottis open time to total period) is about 0.6**. These compare well with observations on human cords by high-speed motion picture techniques and by inverse filtering. *(p.1251)*
- Negative values of `A_g1` and `A_g2` indicate glottal closure; one can imagine the cords forming into one another upon contact, the negative areas corresponding to continued displacement of the center of mass of the cords. *(p.1251)*
- The **glottal flow wave** is characterized by temporal detail, asymmetry, and a **steep falling slope**; the **area wave** shows little temporal detail, is less steep, and tends to be more symmetrical. Because the cords are massive and are generally forced at a frequency **above** their natural frequency, their mechanical displacement does not reflect the detail of acoustic interaction which the glottal flow displays. *(p.1251-1252)*
- The greatest formant oscillation (excitation) typically occurs, **with about 0.5 ms delay**, at the **closing phase** of the `U_g` wave. *(p.1252)*

### 10.2 Effect of cord stiffnesses *(p.1252-1253)*
Fig. 8 sketches `U_g`, `A_g1`, `A_g2` waveforms at points on the normalized `k_2`-`k_c` plane, uniform pipe /schwa/, other glottal conditions typical.
- **Increasing `k_c`** above typical: reduces the phase difference between `A_g1` and `A_g2`; diminishes the steep falling slope of the flow waveform; makes the wave more symmetrical and triangular; increases the build-up time required for oscillation to settle to steady state. For still larger `k_c` close to the bounds of the oscillation range, both glottal flow and area waveforms become **sinusoidal on a dc component, and the glottis does not close**. *(p.1252-1253)*
- The range of sinusoidal behavior expands if the damping coefficients are made smaller. In Fig. 6a with `zeta_1 = 0.1`, `zeta_2 = 0.15`, **`k_c` has no limitation for oscillation when `k_2` is less than 20 kdyn/cm**. Owing to the large `k_c`, the two-mass model behaves just as the one-mass model in this extended region, where oscillation is sustained by the inductive reactance of the vocal tract and glottis. This projecting tail disappears with an increase in the losses of either the vocal tract or the vocal cords. *(p.1253)*
- **Increasing `k_2`** with other conditions constant: decreases the amplitude of `A_g2` **without a change of the phase difference**. Further increase leads to **no closure of `A_g2` while `A_g1` can close completely** during the cycle. Owing to the small amplitude of `A_g2` and its dc component, the glottal flow increases in upward roundness and increases in duty ratio. A small, broad hump appears on the rising slope of the glottal flow wave, at the point where `A_g1` equals `A_g2`. *(p.1253)*
- **Decreasing `k_2`** increases the amplitude of `A_g2` and the glottal waves tend to a symmetrical form. The same dependence on `k_2` and `k_c` also occurs for equal thicknesses `d_1 = d_2 = 0.15 cm`. *(p.1253)*
- **Damping proportions:** the typical condition `zeta_1 = 0.1`, `zeta_2 = 0.6` produces an amplitude of `A_g1` slightly larger than `A_g2` for /schwa/ (Fig. 7). A **smaller `zeta_2`** for the same `zeta_1` produces an amplitude of `A_g2` larger than `A_g1` **without a change in phase difference**; a steeper rising slope of the glottal area wave also results, but the **falling slope remains unchanged**. *(p.1253)*

### 10.3 Effect of neutral area *(p.1253-1254)*
Fig. 9 shows glottal area for `A_g0` = 0.30, 0.20, 0.15, 0.05 cm^2, typical glottal conditions, `zeta_1 = 0.1`, `zeta_2 = 0.6`, vowel /i/, over 50 ms.
- **Build-up time to steady state increases as `A_g0` gets larger.** *(p.1253)*
- **`A_g0 = 0.30 cm^2` surpasses a critical limit of about 0.25 cm^2 beyond which the model does not oscillate** for these conditions. *(p.1253-1254)*
- During voicing build-up the pitch period is much longer than the steady-state one. The change in pitch at voicing onset is similar to the starting motion of human cords brought to the phonation position from an open position. Unestablished low subglottal pressure also contributes to the reduction of the fundamental frequency. **The oscillation period before cord closure is a value between the damped natural frequencies of the two mechanical oscillators**, consistent with the value calculated from the acoustic theory of the two-mass model neglecting collision and spring nonlinearity. *(p.1254)*
- The maximum glottal area for phonation depends on the damping of the mechanical oscillators and of the vocal tract and on the subglottal pressure. **For `zeta_1 = 0.2`, `zeta_2 = 0.6`, `P_s = 8 cm H2O`, the maximum glottal area reduces to about 0.20 cm^2.** *(p.1254)*
- An increase in the phonation-neutral area also causes an **increase in the amplitude of vibration with no significant change in the period** of steady-state oscillation. *(p.1254)*

### 10.4 Effect of tract shape *(p.1255-1257)*
Figs. 10a, 10b, 10c show area waves, glottal flow, and mouth-output pressure for /i/, /u/, /a/; Fig. 10d shows spectrograms for /i, e, a, o/.
- **Glottal area waveforms and fundamental frequency are almost independent of vocal-tract shape**, while tract shape can substantially influence the waveform of glottal flow, similar to the one-mass result. *(p.1255)*
- The acoustic interaction between glottal flow and acoustic load depends on the resonance characteristics of the tract. **Vowels with high resonant Q for the first formant show noticeable interaction in the glottal flow wave**, as seen for /a/. A **low first formant** can also affect the glottal flow wave considerably, e.g. /i/. *(p.1255)*
- The relatively large dissipation of the tract in the frequency range of low first formants (as for /i/ and /u/), caused primarily by vocal-tract wall vibration, acts to **reduce** the interaction, but the glottal flow waveforms still differ markedly from each other. *(p.1255)*
- In all these cases tract losses are set to give **first-formant bandwidths equal to values measured on the human tract for the closed-glottis condition**. *(p.1255)*
- **Delay time difference of about 0.5 ms** between glottal wave and speech pressure wave, corresponding to the time required for sound to travel from glottis to lips. *(p.1256-1257)*
- The waveforms for /a/, /i/, /u/ show that **formants are excited largely at the closure of the cords**. Output pressure waves **attenuate rapidly with increasing glottal area during the opening phase** of the glottal cycle. *(p.1257)*

### 10.5 Effect of subglottal pressure *(p.1257-1258)*
Fig. 11 plots fundamental frequency vs subglottal pressure with the spring nonlinear coefficient `eta_k` as the parameter, vowel /schwa/; the /i/ and /a/ data correspond to `eta_k = 100` only. In all these cases `eta_h = 5 eta_k`. *(p.1257)*

| Outcome | Measure | Value | Context | Page |
|---------|---------|-------|---------|------|
| F0 slope vs subglottal pressure | Hz per cm H2O | about 2.5 | `eta_k = 100`, independent of vowel configuration | 1257 |
| F0 slope vs subglottal pressure (abstract statement) | Hz per cm H2O | 2 to 3 | essentially independent of vowel configuration | 1233 |
| F0 at `P_s` about 2 cm H2O | Hz | about 122-127 | Fig. 11 | 1258 |
| F0 at `P_s` = 30 cm H2O, `eta_k = 100` | Hz | about 193 | Fig. 11 | 1258 |
| F0 at `P_s` = 30 cm H2O, `eta_k = 50` | Hz | about 178 | Fig. 11 | 1258 |
| F0 saturation, `eta_k = 0` (linear springs) | Hz | about 148, flat | for `P_s` greater than 8 cm H2O | 1257, 1258 |
| Minimum subglottal pressure for vowel production | cm H2O | about 2 | - | 1258 |
| Duty ratio asymptote at high `P_s` | - | about 0.5 | Fig. 13; compares well with natural-speech measurements | 1259 |
| Duty ratio at `P_s` about 2 cm H2O | - | about 1.0 | Fig. 13 (no closure) | 1259 |

- The 2.5 Hz/cm H2O slope represents good agreement with measurements on human speech in the **chest register by Hixon et al.** *(p.1257)*
- **Two causes of pitch variation with subglottal pressure** are suggested: (1) the **collision of the vocal cords at closure**, when the vibration amplitude is not too large and `P_s` is less than several cm H2O; (2) the **nonlinearity of the deflection of the muscles and ligaments** at large vibration amplitudes and at `P_s` more than several cm H2O. In the latter case the nonlinearity becomes dominant when large displacement amplitude increases the effective stiffness of the springs, tending to increase fundamental frequency. *(p.1257-1258)*
- **On the earlier one-mass work:** significant influences on fundamental frequency as a function of tract configuration were found, due in large part to the pressure recovery assumed at the glottal outlet, namely `(1/2) P_B` per van den Berg's data. **When the intraglottal pressure distribution derived here is used in the one-mass model, the interaction across vowels and with subglottal pressure is much less.** *(p.1258)*
- **The two-mass model becomes a one-mass model if `k_c` is increased to a large value.** Under these conditions the F0-vs-`P_s` behavior is similar; the duty ratio of the one-mass case tends to be **slightly greater** than the two-mass case. *(p.1258)*
- **Duty ratio decreases with increasing subglottal pressure** (increased glottal flow and glottal amplitude), asymptotic to about 0.5 (Fig. 13). *(p.1258-1259)*

### 10.6 Effect of cord tension *(p.1259-1260)*
- A **tension parameter `Q`** controls fundamental frequency: the masses and thicknesses are **scaled down** by `Q` and the springs **scaled up** by `Q`, causing the fundamental frequency to vary proportionally with `Q`. *(p.1259)*
- **Phase difference, duty ratio, and glottal area waveforms are essentially uninfluenced by `Q`**; the amplitudes of glottal area and glottal flow **decrease gradually with increasing `Q`**. *(p.1259)*
- The glottal flow waveform varies in detail with fundamental frequency because the formants contributing to the temporal detail of the flow are unchanged while the period of the glottal flow varies with `Q`. Changes in flow waveform with pitch variation are greatest where acoustic interaction is especially pronounced, such as for /a/. *(p.1259-1260)*
- In human speech the **duty ratio tends to increase with fundamental frequency**. This feature is given to the model by modifying the coupling-tension parameter `k_c` to increase **more than in linear proportion to `Q`**; a **variation as `Q^2` appears more realistic**. Physiologically this corresponds to the considerable decrease in compliance and thickness of the cords when they are stretched by contraction of the cricothyroid muscle and other muscles associated with contracting of the vocalis. *(p.1260)*
- Increasing `k_c` more than proportionally to `Q` is equivalent to shifting the glottal operating condition **along a line parallel to the abscissa in Fig. 6**. As indicated in Fig. 8, a shift to the right **reduces the phase difference and increases the duty ratio** without changing other features of cord vibration, except near the boundaries of the oscillation range. *(p.1260)*
- Fig. 14 shows waveforms for /a/ at `Q = 0.8`, `1.0`, `1.5`; Fig. 15 plots F0, duty ratio, and glottal-area amplitude vs `Q`. Variation of duty ratio with frequency falls into the range measured in inverse filtering experiments. *(p.1260)*

## Section XI: Interaction Effects with Large Acoustic Loads

### 11.1 Differences between two-mass and one-mass models *(p.1261-1264)*
Fundamental frequency and area waveforms of the cord model are **not strongly influenced by tract geometry**; the interaction with glottal flow, however, is marked. The effect of acoustic load was further investigated by **lowering the frequency of the lowest resonance of the acoustic load (the first formant) into the range of the fundamental frequency**, which increases the driving-point impedance at F0 so strong source-load coupling is expected. *(p.1261-1262)*

Formant frequencies are lowered by **lengthening the simulated vocal tract**. Fig. 16 shows F0 as a function of the length of a uniform vocal-tract tube of **5 cm^2 cross-section**, for both the two-mass model and an equivalent one-mass model (`k_c -> infinity`), at the typical glottal conditions. The shunt impedance of the vocal-tract wall (wall vibration) is **not taken into account per se**; the effect is only approximated by an increase in damping for the **first 16-cm section** of the tube (as used for the /schwa/ configuration). The remaining tube is regarded as an ideal hard-wall tube. `F_01` (solid line) is the first resonance frequency of the tube. *(p.1262)*

Findings:
- The two-mass model's frequency **decreases more gradually** than the one-mass model's with increasing tube length. *(p.1262)*
- When the oscillation frequency of the two-mass model **meets the first formant frequency**, a **sharp increase (jump) of the fundamental frequency occurs** for further increase in tube length. The frequency returns to almost the same value as for a short tube. *(p.1262-1263)*
- The **frequency jump occurs at the resonant frequency of the vocal-tract tube, independent of dissipation and of glottal conditions.** For example, an increase in acoustic dissipation of the tract and a decrease in mechanical damping of `m_1` and `m_2` raises the onset frequency of the jump, but the frequency at which the jump occurs is still the first resonant frequency of the tube. *(p.1263)*
- The curve `F_01` vs tube length marks the boundary between an **inductive** driving-point impedance (to the left) and a **capacitive** one (to the right). The two-mass frequency jump, occurring at `F_01` regardless of glottal conditions, places its new oscillation **in the capacitive region, between the first pole and second zero of the driving-point impedance.** *(p.1263)*
- A frequency jump also occurs in the one-mass model, but there the jump is **to the original frequency for which the driving-point impedance is still inductive, that is, between the second zero and second pole** of the driving-point impedance. This behavior can be predicted by an analysis of the oscillator with a uniform transmission line as a load. *(p.1263-1264)*

**Fig. 16 conditions shown:** `ATT = 25 (4)`, `zeta_1/zeta_2 = 0.1/0.3`; `ATT = 25 (1)` and `5 (3)`, `zeta_1/zeta_2 = 0.1/0.6`; `ATT = 5 (4)`, `zeta_1/zeta_2 = 0.01/0.03`. Tube lengths span 0 to 160 cm; F0 spans 80 to 200 Hz. `F_01'` marks the first zero of the driving-point impedance. *(p.1263)*

### 11.2 Effects of acoustic load on human voicing *(p.1264-1266)*
**Experimental protocol** (a real human measurement, not simulation):
1. To bring a first-formant resonance into the range of the voice pitch, subjects **phonated into a long metal tube whose length was periodically changed from 39 cm to 73 cm by a motor** (a bazooka-like sliding pipe). *(p.1264)*
2. Subjects were instructed to pronounce the **sustained vowel /schwa/ at medium sound level with constant glottal adjustment** regardless of the change in tube length. *(p.1264)*
3. Fundamental frequency measurements were made at **several frequencies in the chest register**. *(p.1264)*
4. Voice pitch was measured at **10-ms intervals by a pitch-extracting program** (Gold & Rabiner parallel-processing pitch extractor, ref. 20). *(p.1264)*

**Results (Fig. 17, one subject):**
- **Frequency jumps similar to those in the two-mass model are observed in the human subject.** *(p.1264)*
- However, the **observed onset frequencies of the jumps are generally higher than the resonant frequency of the compound tube** (metal tube plus the subject's vocal tract, neglecting the shunt impedance of the tract wall). The deviation from the resonant frequency becomes **especially noticeable for lower frequencies.** *(p.1264)*
- **Interpretation:** the shunting impedance caused by vibration of the vocal-tract walls produces a **"cutoff frequency" of the sound transmission** and constrains the lowest first-formant frequency of the vocal tract (Fant, ref. 21). This contributes to raising the resonant frequency of the compound tube near the cutoff frequency. The walls of the cheeks, pharynx and soft velum would yield to vibration given the /schwa/ tract geometry and the long wavelength. At the cutoff frequency of the vocal tract, the first resonance frequency of the combined tract-plus-metal-pipe is essentially that of the metal pipe alone (broken line in Fig. 17). *(p.1264)*
- From Fig. 17 the **cutoff frequency of the vocal tract for /schwa/ is presumed to be a little lower than 200 Hz**. Wall vibration could thus account for the rightward shift of the observed pitch jumps, most noticeable at lower frequencies. *(p.1264)*
- **Note added in proof:** after the paper was written, the authors measured the cutoff frequency for the vocal tract and tube combination and found its value to be **195 Hz**. *(p.1265, footnote)*
- Fig. 17 spans tube lengths 39-74 cm over 0-0.9 s, F0 110-230 Hz. Adjacent open and closed points (circles or triangles) pertain to different cycles of the pipe in one set of measurements.
- Even with these uncertainties, there is a **close similarity in the dependence of fundamental frequency on acoustic load between the human larynx and the two-mass model.** *(p.1265)*
- It is further of interest that **the vocal cords can self-oscillate without regenerative feedback from the subglottal and supraglottal system.** In addition, **vibration of the soft walls of the vocal tract acts as a buffer to aid stable operation** in the presence of coupling between the cords and the tract as the latter takes on a wide variety of shapes. *(p.1265-1266)*

## Section XII: Conclusion *(p.1266-1267)*

- The two-mass formulation yields **physiologically realistic behavior**. The phase differences between upper and lower cord edges correspond well with motion observed in high-speed photography. *(p.1266)*
- The two-mass formulation leads to a **natural correlate of chest and falsetto register**, with **coupling stiffness (lax in chest, tense in falsetto)** being an important factor along with mass and thickness of the cords. *(p.1266)*
- The two-mass model is **capable of oscillation just above the resonant frequencies of the acoustic load** (i.e. the formant frequencies), duplicating a capability of human cords. The **one-mass model cannot oscillate in this frequency range, where the driving-point reactance is capacitive.** *(p.1266)*
- The intra-glottal pressure distribution derived here yields **cord-tract interaction similar to human speech**. *(p.1266)*
- **F0 varies with subglottal pressure approximately as 2 to 3 Hz/cm H2O**, and changes in vowel configuration do not markedly influence F0. Closures tighter than those in vowel shapes (e.g. at consonant-vowel boundaries) can of course influence F0. *(p.1266)*
- The **improved intra-glottal pressure distribution is also applicable to a one-mass formulation** and produces physiologically realistic cord-tract interactions with a one-mass model. *(p.1266)*
- The programmed cord oscillator plus digitally simulated tract constitute a **complete synthesizer for voiced sounds**, with potential for computer voice response and text synthesis, offering natural control via **subglottal pressure, cord tension, neutral area, and tract shape**. These parameters appear sufficient for describing both voiced and voiceless sounds in continuous speech. *(p.1266)*
- **For some synthesis applications the complexity of the two-mass model may not be needed and a simpler one-mass formulation may serve.** In normal voice production, phonation occurs at a fundamental frequency always **below** the first vocal resonance; there the driving-point impedance is inductive and the one-mass oscillator performs acceptably, **particularly with the improved intra-glottal pressure distribution.** *(p.1266-1267)*
- The two-mass model provides a potential tool for **medical analysis of voice disorder**. Although the present simulation assumes bilateral symmetry, **asymmetric configurations can be implemented**, so deficiencies such as **unilateral cord paralysis** can be investigated and quantified. The technique permits acoustic analysis of voice functions and of human respiration. *(p.1267)*

## Results Summary
The two-mass model reproduces the principal features of human cord behavior. At typical glottal conditions it gives a cord-edge phase difference of about 55 degrees, a duty ratio of about 0.6, an F0 that rises about 2.5 Hz per cm H2O of subglottal pressure independently of vowel, and a duty ratio that falls toward 0.5 as subglottal pressure rises *(p.1251, 1257, 1259)*. Glottal area waveforms and F0 are almost independent of tract shape while glottal flow waveforms are strongly shaped by the tract, especially for vowels with a high-Q first formant such as /a/ *(p.1255)*. The model self-oscillates for phonation-neutral areas up to a critical limit of about 0.25 cm^2 for the typical condition, or about 0.20 cm^2 when `zeta_1` is raised to 0.2 *(p.1254)*. Unlike the one-mass model, it oscillates above a formant frequency where the load reactance is capacitive, and reproduces the frequency-jump behavior measured in a human subject phonating into a variable-length pipe *(p.1263-1265)*.

## Limitations
- The **subglottal system is entirely neglected**, replaced by a constant lung pressure, on the argument that its first resonance is high (650 Hz, bandwidth 250 Hz) *(p.1243)*.
- **Only 4 vocal-tract sections** (`n = 4`) are used in the present work *(p.1243)*.
- **Vocal-tract wall vibration is not modelled per se**; its effect is approximated only by an increased damping coefficient `ATT` (20-25) applied to the wall viscous loss, and in the long-tube experiment only for the first 16 cm section. Non-rigid walls are acknowledged as quite significant in lower-formant damping *(p.1243, 1262)*.
- **Heat-conduction loss at the tract wall is omitted** as essentially negligible *(p.1243)*.
- The **coupling between the masses is linearized** to be proportional to `(x_2 - x_1)`; the paper itself gives the more accurate cubic form `2 k_c (x_2 - x_1)^3 / (d_1 + d_2)^2` but does not use it *(p.1245)*.
- **Bilateral symmetry is assumed**, so unilateral pathologies are outside the present simulation (though the authors say asymmetric configurations could be implemented) *(p.1236, 1267)*.
- **Few numerical values are available for the physiological parameters** of the vocal cords; ranges had to be established by simulation rather than measurement *(p.1249)*.
- There is **no appropriate sampling theory** for the lumped-plus-finite-difference tract approximation; the stable sampling range had to be found empirically on the DDP-516 *(p.1248)*.
- The `U_g (dL/dt)` term in `(d/dt)(L U_g)` is **dropped as negligible** without quantification *(p.1240, footnote)*.
- In the human-voicing experiment, the **observed jump onset frequencies deviate from the predicted compound-tube resonance**, especially at low frequencies, and the explanation (wall-vibration cutoff) is offered as an interpretation rather than demonstrated *(p.1264)*.
- Masses are permitted **only lateral motion**; no vertical or longitudinal degrees of freedom *(p.1236)*.

## Testable Properties
- Phase difference between the two cord edges lies in the range **0 to 60 degrees**, about 55 degrees at the typical condition *(p.1233, 1251)*.
- Duty ratio at the typical condition is about **0.6**, and decreases monotonically with increasing subglottal pressure, asymptotic to about **0.5** *(p.1251, 1259)*.
- **dF0/dP_s is 2 to 3 Hz per cm H2O** (about 2.5 for `eta_k = 100`) and is essentially independent of vowel configuration *(p.1233, 1257)*.
- With **linear springs (`eta_k = 0`) F0 saturates** for subglottal pressures greater than 8 cm H2O *(p.1257)*.
- **Minimum subglottal pressure for vowel production is about 2 cm H2O** *(p.1258)*.
- The model **does not self-oscillate for `A_g0` greater than about 0.25 cm^2** at the typical condition, and the limit falls to about 0.20 cm^2 for `zeta_1 = 0.2`, `zeta_2 = 0.6`, `P_s = 8 cm H2O` *(p.1253-1254)*.
- **Build-up time to steady-state oscillation increases monotonically with `A_g0`** *(p.1253)*.
- **Increasing `A_g0` increases vibration amplitude with no significant change in steady-state period** *(p.1254)*.
- **Increasing `k_c` reduces the phase difference and increases the duty ratio**; sufficiently large `k_c` makes the waveforms sinusoidal on a dc component with no glottal closure *(p.1252-1253, 1260)*.
- **Increasing `k_2` decreases the amplitude of `A_g2` without changing the phase difference**; a large enough `k_2` gives no closure of `A_g2` while `A_g1` still closes completely *(p.1253)*.
- **Decreasing `zeta_2` (with `zeta_1` fixed) makes `A_g2` amplitude exceed `A_g1` without changing phase difference**, steepens the rising slope of the area wave, and leaves the falling slope unchanged *(p.1253)*.
- The oscillation period **before cord closure lies between the damped natural frequencies of the two mechanical oscillators** *(p.1254)*.
- **F0 scales proportionally with the tension parameter `Q`**, while phase difference, duty ratio, and area waveform shape are essentially unchanged and glottal-area and flow amplitudes decrease gradually *(p.1259)*.
- **Making `k_c` scale as `Q^2` rather than `Q` reproduces the human tendency for duty ratio to increase with F0** *(p.1260)*.
- **Formants are excited largely at cord closure**, with the greatest formant oscillation about **0.5 ms** after the closing phase of `U_g` *(p.1252, 1257)*.
- The **glottis-to-lips delay between the glottal wave and the speech pressure wave is about 0.5 ms** *(p.1256-1257)*.
- **The two-mass model can oscillate where the tract driving-point reactance is capacitive; the one-mass model cannot** *(p.1266)*.
- **The F0 jump occurs at the tube's first resonance `F_01`, independent of dissipation and glottal conditions**; the two-mass model jumps into the capacitive region between the first pole and second zero, the one-mass model into the inductive region between the second zero and second pole *(p.1263)*.
- **An inductive load reactance at F0 enhances oscillation; low-frequency tract damping opposes it; increased mechanical damping of `m_1` and especially `m_2` suppresses it** *(p.1250)*.
- The **equivalent damping ratio for the bulk of the cords is about 0.16** under typical conditions, consistent with Kaneko's excised-larynx estimate of 0.1 to 0.2 *(p.1250)*.
- The **momentum-based outlet recovery factor `2N(1-N)` lies in the range 0.05 to 0.40**, smaller than van den Berg's 0.5 *(p.1240)*.
- The **vocal-tract wall-vibration cutoff frequency for /schwa/ plus tube is 195 Hz** as measured *(p.1265)*.
- **Two-mass with `k_c -> infinity` degenerates to a one-mass model**, whose duty ratio is slightly greater than the two-mass case at the same conditions *(p.1258)*.

## Relevance to Project
This is the canonical source-model reference for any glottal-source implementation beyond a fixed waveform generator. Concretely useful to a formant/articulatory synthesizer project:

- **A drop-in self-oscillating glottal source.** Eqs. (17) and (18) are a complete, causal, sample-by-sample update rule needing only `P_s`, `A_g0`, `Q`, and the tract's first-section area. Every constant is given.
- **Physiologically meaningful voice-quality controls.** Subglottal pressure, cord tension `Q`, phonation-neutral area `A_g0`, and tract shape are the four knobs, replacing ad-hoc source-waveform parameters (open quotient, spectral tilt) with parameters that produce those effects as consequences. Breathy voice corresponds to large `A_g0` (with a hard 0.25 cm^2 non-oscillation ceiling), pressed voice to small `A_g0`, register to `k_c`.
- **A pitch-loudness coupling law for free.** The 2-3 Hz/cm H2O relation and the duty-ratio-vs-`P_s` curve give a principled way to couple intensity and F0, and a reason the coupling saturates without spring nonlinearity.
- **Source-tract interaction.** The paper's central technical improvement, the momentum-based outlet recovery of eq. (6), is exactly the term that sets how much the tract perturbs the flow pulse. Anyone implementing an interactive (non-linear-separable) source will want this rather than van den Berg's 0.5.
- **The one-mass fallback is explicitly endorsed.** For normal phonation below F1 the authors say a one-mass model with the improved intra-glottal pressure distribution suffices. That is a much cheaper implementation path with a citation behind it.
- **Numerical implementation guidance.** The delay placement in eqs. (17)-(18) (impedances and nonlinear terms use sample `i-1`) is what makes the loop explicit and solvable, and the 10-30 kHz stable sampling range with the shortest-tube-transit-time rule transfers directly.

## Open Questions
- [ ] The printed `k_2 = 8 dyn/cm` on p.1250 conflicts with the p.1250 footnote's `k_2 = k_1/10`; confirm 8 kdyn/cm before implementing.
- [ ] The numerical value of the shear viscosity coefficient `mu` is never stated; it must be supplied from standard air properties.
- [ ] The contraction inertance integral `L_c = integral(rho dx / A_c(x))` requires an area profile `A_c(x)` and a contraction length `l_c` that the paper never specifies numerically; the paper says `L_c` is negligible, so this may not matter.
- [ ] Air density `rho` and sound velocity `c` values are not stated; assume standard body-temperature values.
- [ ] The exact form of the collision-damping switch is stated only as `zeta_j = (1.0 + zeta_j_open)`; whether the transition is instantaneous per sample is unstated.
- [ ] The tract section lengths `l_1..l_4` used for the four-section vowel configurations are not tabulated.
- [ ] Fig. 15 relates F0, duty ratio, and glottal-area amplitude to `Q` over roughly `Q = 0.75` to `1.5` and F0 = 120 to 210 Hz, but no closed-form fit is given.
- [ ] Reference 7 (Ishizaka & Matsudaira, "Acoustic Theory of a Two-Mass Model of the Vocal Cords") is cited as unpublished work and carries the underlying theory; it may be hard to obtain.

## Related Work Worth Reading
- **Flanagan & Landgraf 1968** (ref. 1) - the one-mass self-oscillating source this paper supersedes; needed to understand what changed.
- **van den Berg, Zantema & Doornenbal 1957** (ref. 10) - the plaster-cast larynx flow measurements supplying the 0.37 inlet loss factor and the 0.5 `P_B` recovery figure the paper argues against.
- **Ishizaka & Matsudaira 1968** (refs. 6, 7) - the two-mass acoustic theory underlying the whole formulation.
- **Flanagan, Speech Analysis Synthesis and Perception, 2nd ed. 1972** (ref. 12) - source of the tract transmission-line element values, radiation load, and the mouth-flow-derivative-as-pressure approximation.
- **Hixon, Mead & Klatt 1971** (ref. 18) - the human F0-vs-transglottal-pressure measurements the 2.5 Hz/cm H2O slope is validated against.
- **Fant 1964** (ref. 21) - vocal-tract wall vibration and the transmission cutoff frequency, needed to explain the human pitch-jump offsets.
- **Flanagan, Coker, Rabiner, Schafer & Umeda 1970** (ref. 22) - "Synthetic Voices for Computers", the text-synthesis application target.

## Collection Cross-References

### Already in Collection
- (none - none of this paper's own key citations (Flanagan & Landgraf 1968, van den Berg et al. 1957, Ishizaka & Kaneko 1968, Flanagan's 1972 textbook, Hixon Mead & Klatt 1971) are present in the collection under their own directories)

### New Leads (Not Yet in Collection)
- Flanagan & Landgraf (1968) - "Self-Oscillating Source for Vocal-Tract Synthesizers" - the one-mass self-oscillating source model this paper supersedes; every criticism in this paper's Section II is aimed at it.
- van den Berg, Zantema & Doornenbal (1957) - "On the Air Resistance and the Bernoulli Effect of the Human Larynx" - the plaster-cast larynx flow measurements supplying the 0.37 inlet contraction loss factor this paper adopts.
- Ishizaka & Kaneko (1968) - "On Equivalent Mechanical Constants of the Vocal Cords" - static tensile stress vs. displacement measurements, source of the nonlinear collision-spring form and the eta_k = 50-100 range.
- Flanagan (1972) - *Speech Analysis, Synthesis and Perception*, 2nd ed. - source of the tract transmission-line element values and the radiation-load approximation needed to implement the tract half of this system.
- Hixon, Mead & Klatt (1971) - "Influence of Forced Transglottal Pressure Changes on Vocal Fundamental Frequency" - the human transglottal-pressure-to-F0 measurements validating this paper's 2.5 Hz/cm H2O slope.

### Cited By (in Collection)
This is a foundational, heavily-cited model; the following collection papers cite Ishizaka & Flanagan (1972) directly:
- [Boersma (1991) — Articulatory Speech Synthesis From Lungs to Lips](../Boersma_1991_MultiMassSpeechSynthesis/notes.md) - cites for the pressure-recovery equation (its Eq. 21 matches this paper's Eq. 6 at v_crit = 0), the relative-tension formulation, and open-glottis damping factors.
- [Cranen (1995) — Physiological Voice Source Modelling](../Cranen_1995_PhysiologicalVoiceSourceModelling/notes.md) - cites as the two-mass model basis for its aerodynamic equations.
- [Herzel (1994) — Vocal Disorders and Nonlinear Dynamics](../Herzel_1994_VocalDisordersNonlinearDynamics/notes.md) - cites as the reference two-mass model for its bifurcation-type survey.
- [Holmes (2001) — Speech Synthesis and Recognition](../Holmes_2001_SpeechSynthesisRecognition/notes.md) - cites as the foundational vocal-fold vibration model in its Section 2.7.1.
- [Lucero (1993) — Dynamics of the Two-Mass Model of the Vocal Folds: Equilibria, Bifurcations, and Oscillation Region](../Lucero_1993_TwoMassModelBifurcations/notes.md) - performs the bifurcation analysis of this exact model.
- [Lucero (1999) — Bifurcations of Voice Onset/Offset](../Lucero_1999_BifurcationsVoiceOnsetOffset/notes.md) - numerical simulation of this model to demonstrate oscillation hysteresis.
- [Lucero (2005) — Vocal Fold Bifurcations](../Lucero_2005_VocalFoldBifurcations/notes.md) - analytical Lyapunov-number derivation for this model family.
- [Rothenberg (1975) — A Three-Parameter Voice Source](../Rothenberg_1975_ThreeParameterVoiceSource/notes.md) - contrasts this "physiological approach" with its own behavioral three-parameter model.
- [Steinecke & Herzel (1995) — Bifurcations in an Asymmetric Vocal-Fold Model](../Steinecke_Herzel_1995_BifurcationsAsymmetricVocalFold/notes.md) - reduces this model for asymmetric bifurcation analysis.
- [Steinecke (1995) — Bifurcations in a Simplified Two-Mass Vocal Fold Model](../Steinecke_1995_BifurcationsVocalFold/notes.md) - simplifies this model to locate bifurcations in Ps/stiffness and Ps/asymmetry planes.
- [Story (1995) — Body-Cover Vocal Fold Model](../Story_1995_BodyCoverVocalFoldModel/notes.md) - extends this two-mass model by adding a third "body" mass.
- [Titze (1979) — Laryngeal Configurations for Phonation](../Titze_1979_LaryngealConfigurationsPhonation/notes.md) - applies this paper's glottal resistances and inductances per duct.
- [Titze (2008) — Nonlinear Source-Filter Coupling in Phonation](../Titze_2008_NonlinearSource-filterCouplingPhonation/notes.md) - notes this model (unlike Flanagan & Landgraf's one-mass model) retains vocal-tract interaction via its second mode.

### Conceptual Links (not citation-based)
- (not surveyed beyond the citation network above - the ~30-paper citing set already documents this paper's engagement with the collection comprehensively; see Cited By)

## Figures of Interest (complete index)

- **Fig. 1 (p.1236):** Schematic of the two-mass approximation. Trachea/lungs at `P_s`, contraction `l_c`, glottis depth `d = d1 + d2`, expansion `l_e`, vocal tract. Pressures `P_11, P_12, P_21, P_22, P_1`; springs `s1, s2`; resistances `r1, r2`; coupling spring `k_c`. Right panel is a cross section showing `A_g1 = (A_g0 + 2 l_g x_1)`.
- **Fig. 2 (p.1238):** Characteristics of the nonlinear stiffnesses. Force vs displacement: linear line `k_j x_j`, hardening curve `f_sj`, collision branch `f_hj` with slope `h_j (x_j - x_MIN)` left of the plane of symmetry, and `x_MIN = -A_g0j / (2 l_g)`.
- **Fig. 3 (p.1241):** Pressure distribution along the glottal flow. `P_s` flat in trachea, falling through contraction to `P_11`, linear viscous falls to `P_12`, step down at the boundary to `P_21`, further viscous fall to `P_22` (the minimum, below atmospheric `P_0`), then recovery through the larynx-tube expansion to `P_1`.
- **Fig. 4 (p.1241):** Equivalent circuit for the glottis. Series `R_c, L_c` (contraction), `R_v1, L_g1` (m1), `R_12` (boundary), `R_v2, L_g2` (m2), `R_e` (expansion), with node pressures `P_s, P_11, P_12, P_21, P_22, P_1`.
- **Fig. 5 (p.1242):** Network model for the synthesis of voiced sounds. `P_s` source at left, vocal-cord block with `R_k1|U_g|, R_v1, L_g1, R_k2|U_g|, R_v2, L_g2` driven by `A_g1(t)`, `A_g2(t)` from the vocal-cord model, which takes `Q` and `A_g0` as inputs. Then the four-section tract ladder `R_1 L_1 / C_1 / ... / R_n L_n / C_n`, terminated at the mouth in `L_R, R_R` with output `U_R`.
- **Fig. 6 (p.1249):** Allowed regions of oscillation in the normalized `k_2`-`k_c` plane, parameterized by open-glottis damping ratio, vowel /schwa/. (a) symmetric masses; (b) asymmetric masses with the operating point marked by a small circle.
- **Fig. 7 (p.1251):** Vocal-cord and vocal-tract functions from the DDP-516 simulation. Glottal areas `A_g1`, `A_g2` (0 to 0.3 cm^2), glottal volume velocity `U_g` (0 to 1000 cm^3/s), and mouth-output sound pressure, over the initial 30 ms of voicing for /schwa/. Shows the 55-degree phase lead of `A_g1` over `A_g2`.
- **Fig. 8 (p.1252):** Sketches of cord-tract functions (`U_g`, `A_g1`, `A_g2`) at points on the `k_2`-`k_c` plane, overlaid on the Fig. 6b oscillation boundary. The single most useful figure for seeing how waveform shape maps to stiffness.
- **Fig. 9 (p.1254):** Effect of the phonation-neutral area `A_g0` on glottal area, vowel /i/, over 50 ms, for `A_g0` = 0.30, 0.20, 0.15, 0.05 cm^2. The 0.30 panel shows failure to oscillate (small ripple on a dc level).
- **Fig. 10a (p.1255):** Area waves, glottal flow, mouth-output pressure for /i/.
- **Fig. 10b (p.1256):** Same for /u/.
- **Fig. 10c (p.1256):** Same for /a/. Shows the strongest source-tract interaction (high-Q F1), with visible ripple on the flow pulse and a large mouth pressure.
- **Fig. 10d (p.1257):** Sound spectrograms of the computed mouth-output sound pressure for the vowels /i, e, a, o/, 0 to 4 kHz over 1.6 s.
- **Fig. 11 (p.1258):** Fundamental frequency vs subglottal pressure (0-35 cm H2O, 120-200 Hz), parameterized by the spring nonlinear coefficient `eta_k` = 0, 50, 100, with /schwa/, /i/, /a/ data points.
- **Fig. 12 (p.1259):** F0 vs subglottal pressure for the one-mass and two-mass models, parameterized by vowel configuration, with the full parameter set printed on the figure.
- **Fig. 13 (p.1259):** Duty ratio (open time / period) vs subglottal pressure, falling from 1.0 near 2 cm H2O toward about 0.51 at 32 cm H2O.
- **Fig. 14a (p.1260):** Effect of tension parameter `Q = 0.8` on cord-tract output for /a/, 50 ms.
- **Fig. 14b (p.1261):** Same with `Q = 1.0`.
- **Fig. 14c (p.1261):** Same with `Q = 1.5`. Amplitudes of `A_g1`, `A_g2` visibly reduced.
- **Fig. 15 (p.1262):** Effect of `Q` on fundamental frequency (F), duty ratio (DR), and glottal-area amplitude (`A_g`), for /schwa/, `P_s = 8 cm H2O`, `A_g0 = 0.05 cm^2`. F0 rises linearly with `Q` from about 120 Hz at `Q = 0.75` to about 210 Hz at `Q = 1.5`; DR rises gently from about 0.68 to 0.75; `A_g` amplitude falls from about 0.22 to 0.12 cm^2.
- **Fig. 16 (p.1263):** Variation of fundamental frequency with acoustic load for the two-mass and one-mass models, as a function of uniform-tube length 0 to 160 cm. `F_01` marks the first pole and `F_01'` the first zero of the driving-point impedance, dividing the plane into inductive, capacitive, and inductive regions. Shows the frequency jumps at `F_01`.
- **Fig. 17 (p.1265):** Fundamental frequency measurements on a human subject phonating into a motor-driven sliding tube of length 39 to 73 cm, pitch extracted at 10-ms intervals over 0.9 s. Broken line is the first resonant frequency of the uniform tube. Shows human frequency jumps offset to the right of `F_01`.
