# Story & Titze 1995 — Voice Simulation with a Body-Cover Model of the Vocal Folds

## Implementation-Focused Notes

### Core Concept

Three-mass lumped-element model extending the IF72 (Ishizaka & Flanagan 1972) two-mass model by adding a third "body" mass. The model separates the vocal fold into:
- **Cover**: upper mass (m_u) + lower mass (m_l) — represents epithelium, superficial layer, and intermediate layer of lamina propria
- **Body**: single mass (m_b) — represents the deep layer of lamina propria and muscle tissue

This structure allows independent control of body and cover vibration, enabling simulation of different laryngeal configurations (CT vs TA muscle activation).

### Model Geometry (Section I)

- Vocal fold dimensions: 0.3 cm thick (vertical, coronal view), 0.23 cm deep, 1.0 cm long
- Cover portion: 0.3 cm thick, divided into two equal upper/lower masses
- Each mass thickness: T_u = T_l = 0.15 cm
- Effective vibrating length: L_g (length of glottis)

### Equations of Motion (Eqs. 1a-1c)

Three coupled differential equations:

```
F_u = m_u * x_u'' = F_ku + F_du - F_kc + F_eu + F_u_col    (1a)
F_l = m_l * x_l'' = F_kl + F_dl + F_kc + F_el + F_l_col    (1b)
F_b = m_b * x_b'' = F_kb + F_db - [F_ku + F_dl + F_kl + F_dl]  (1c)
```

Where:
- F_du, F_dl, F_db: damping forces
- F_ku, F_kl: lateral spring forces (upper/lower cover)
- F_kb: body spring force
- F_kc: coupling spring force between upper and lower cover masses
- F_eu, F_el: external (pressure) forces
- F_u_col, F_l_col: collision forces

### Spring Forces (Eqs. 2-5)

**Upper cover spring** (nonlinear):
```
F_ku = -k_u * [{(x_u - x_u0) - (x_b - x_b0)} + eta_u * {(x_u - x_u0) - (x_b - x_b0)}^3]
```

**Lower cover spring** (nonlinear):
```
F_kl = -k_l * [{(x_l - x_l0) - (x_b - x_b0)} + eta_l * {(x_l - x_l0) - (x_b - x_b0)}^3]
```

**Body spring** (nonlinear):
```
F_kb = -k_b * [(x_b - x_b0) + eta_b * (x_b - x_b0)^3]
```

**Coupling spring** (linear):
```
F_kc = -k_c * [(x_l - x_l0) - (x_u - x_u0)]
```

- Nonlinearity coefficients (eta): set to 100 for cover springs, 500 for collision
- Coupling spring k_c accounts for shear forces between masses

### Collision Forces (Eqs. 6a, 6b)

When left and right folds collide (medial motion):
```
F_u_col = -h_u_col * [(x_u - x_u_col) + eta_u * (x_u - x_u_col)^3]
F_l_col = -h_l_col * [(x_l - x_l_col) + eta_l * (x_l - x_l_col)^3]
```

Where h's are linear spring coefficients (3*k_u and 3*k_l), and eta's are nonlinear coefficients set to 500.

### Damping (Eqs. 7-8, 9-10)

**Damping forces:**
```
F_dl = -d_l * (x_l_dot - x_b_dot)     (7a)
F_du = -d_u * (x_u_dot - x_b_dot)     (7b)
F_db = -d_b * x_b_dot                  (7c)
```

**Open-glottis damping coefficients:**
```
d_l = 2 * zeta_l * (m_l * k_l)^0.5     (8a)
d_u = 2 * zeta_u * (m_u * k_u)^0.5     (8b)
d_b = 2 * zeta_b * (m_b * k_b)^0.5     (8c)
```

**Damping ratios:**
- zeta_u = 0.4
- zeta_l = 0.4
- zeta_b = 0.2

**Collision damping:** During collision, damping ratio for cover masses increased from zeta to (zeta + 1.0) in stepwise fashion. Only 0.4 added (not full 1.0 as in IF72) to avoid over-damping. Body damping unchanged during collision.

### Glottal Area (Eqs. 11a, 11b)

Upper and lower glottal areas (symmetric folds):
```
a_u = | 2*L_g * x_u,  x_u > 0
      | 0,             x_u <= 0                (11a)

a_l = | 2*L_g * x_l,  x_l > 0
      | 0,             x_l <= 0                (11b)
```

Where L_g is the glottal length.

### Pressure Equations (Section I.B)

Based on Titze (personal communication) general method for intraglottal pressure:

**Bernoulli regime** (convergent glottis or uniform):
```
P(a) = P_s - 0.5 * rho * u^2 * (1/a^2 - 1/A*^2)   (12)
P_m = P_s - 0.5 * rho * u^2 * (1/a_m^2 - 1/A*^2)   (13)
P_a = P_s - 0.5 * rho * k_e * u^2 / a^2              (14)
```

**Pressure recovery coefficient:**
```
k_e = (2*a_m / a_i) * (1 - a_m / a_i)               (18)
```

**Simplified pressure equations:**
- Bernoulli regime: P = P_s - (P_s - P_i) * (a_m/a)^2    (19)
- Jet regime: P = P_i                                      (20)

**Lower mass region pressure:**
```
P_l = P_s - (P_s - P_i) * (a_u / a_l)^2             (21)
```

When upper/lower are in same config:
```
P_u = P_l = P_i                                       (22)
```

**External forces on masses:**
```
F_eu = P_u * L_g * T_u                               (23a)
F_el = P_l * L_g * T_l                               (23b)
```

### Flow Equation (Eq. 24)

```
u = (a_m * c / k_t) * {(-a_m / A*) +/- [(a_m / A*)^2 + (4*k_t / c^2*rho) * (P_s+ - P_i-)]^0.5}
```

Where:
- k_t: transglottal pressure coefficient (Scherer and Titze 1983)
- a_m: minimum glottal area
- c: speed of sound
- A*: effective vocal tract area for acoustic loading
- 1/A* = 1/A_s + 1/A_i (subglottal + supraglottal areas)

### Parameter Values (Section I.E)

**Masses (grams):**
- m_u = 0.01 g
- m_l = 0.01 g
- m_b = 0.05 g

**Cover mass derivation:**
- Cover depth (D_cover) = 0.065 cm
- Mucosa density = 1.02 g/cm^3
- M_cover = 0.065 * 0.3 * 1.0 * 1.02 = 0.0199 g
- m_l = m_u = M_cover / 2 ~ 0.01 g

**Body mass derivation:**
- D_body = 0.165 cm (deep layer + muscle portion)
- Muscle density = 1.04 g/cm^3
- m_b = 0.165 * 0.3 * 1.0 * 1.04 = 0.05148 g ~ 0.05 g

**Thicknesses (cm):**
- T_u = 0.15
- T_l = 0.15

**Passive stiffness (N/m):**
- k_u = 3.5 (cover, upper)
- k_l = 5.0 (cover, lower)
- k_b = variable (body) — 20-1000 N/m range explored
- k_c = variable (coupling) — 0.5-3.0 N/m range explored

**Stiffness derivation:**
- Fundamental frequency formula: F_0 = (1/2*L_g) * (sigma/rho)^0.5 = (1/2*pi) * (k/m)^0.5
- k = pi^2 * sigma * m * L_g^2
- Passive cover stiffness: k_cover ~ 5.0 N/m (from 10% strain, ~4.0 kPa stress)
- Passive body stiffness: k_body ~ 50.0 N/m (from same strain assumption)
- Active body stiffness: up to ~850 N/m (supramaximal stimulation); normal phonation much lower, set to 100 N/m

**Initial displacements (cm):**
- x_u0 = 0.0179 (prephonatory)
- x_l0 = 0.018
- x_b0 = 0.30

**Lung pressure:**
- P_l = 0.80 kPa (subglottal)

### Simulation Parameters

- Integration: 4th-order Runge-Kutta
- Sampling frequency: 22050 Hz
- Vocal tract: wave-reflection analog (Kelly & Lochbaum 1962; Liljencrants 1985)
- Vocal tract shape: uniform tube, 5 cm^2 cross-section, nasal sections not used
- Compute time: ~100:1 ratio on Decstation 5000

### Four Hirano Cases (Table II, Section II.A)

| Parameter | Case A | Case B | Case C | Case D |
|-----------|--------|--------|--------|--------|
| m_u (g) | 0.01 | 0.01 | 0.01 | 0.01 |
| m_l (g) | 0.01 | 0.01 | 0.01 | 0.01 |
| m_b (g) | 0.05 | 0.05 | 0.05 | 0.015 |
| T_u (cm) | 0.15 | 0.15 | 0.15 | 0.15 |
| T_l (cm) | 0.15 | 0.15 | 0.15 | 0.15 |
| k_u (N/m) | 3.5 | 3.5 | 3.5 | 79.0 |
| k_l (N/m) | 5.0 | 5.0 | 5.0 | 80.0 |
| k_b (N/m) | 20.0 | 700.0 | 100.0 | 200.0 |
| k_c (N/m) | 0.5 | 2.0 | 2.0 | 2.0 |
| x_u0 | 0.0179 | 0.0179 | 0.0179 | 0.0179 |
| x_l0 | 0.018 | 0.018 | 0.018 | 0.018 |
| x_b0 | 0.30 | 0.30 | 0.30 | 0.30 |
| P_l (kPa) | 0.80 | 0.80 | 0.80 | 0.80 |

### Simulation Results (Table III)

| Case | F_0 (Hz) | VPD (deg/mm) | AR (lower/upper) | MWV (m/s) |
|------|----------|--------------|-------------------|-----------|
| A | 95 | 36 | 1.05 | 0.9 |
| B | 150 | 96 | 1.85 | 0.3 |
| C | 134 | 43 | 1.29 | 1.1 |
| D | 339 | 17 | 0.84 | 6.9 |

**Case interpretations:**
- **A**: Low pitch, soft phonation (lax body + cover, both vibrating together)
- **B**: Loud heavy voice (stiff body, only cover vibrates, high VPD)
- **C**: Normal phonation (moderate body stiffness, both body and cover involved)
- **D**: Falsetto (very stiff cover + body, small m_b, nearly sinusoidal flow, high F0)

### Phase Difference and Mucosal Wave Velocity

```
phi = 360 * tau / T                                  (37)
c = 360 * z / (phi * T)                              (38)
```

Where tau is time delay between upper and lower cover masses, T is fundamental period, z is distance between mass centers.

Measured mucosal wave velocities: 1.0-2.0 m/s range (Baer 1975; Titze et al. 1993; Sloan et al. 1993).

### Relevance to Klatt Synthesis

This model provides the physical basis for understanding:
1. **Voice quality variation**: The body-cover interaction determines F0, vertical phase difference, amplitude ratio, and mucosal wave velocity — all correlates of voice quality
2. **CT vs TA muscle effects**: CT contraction primarily increases cover stiffness (raising F0), while TA contraction increases body stiffness (affecting amplitude and phase difference)
3. **Glottal flow waveform shapes**: Different laryngeal configurations produce characteristically different glottal flow waveforms (sinusoidal for falsetto, pulse-like for chest voice)
4. **Source parameter relationships**: The model shows how F0, open quotient, speed quotient, and amplitude are mechanistically linked through the tissue properties
