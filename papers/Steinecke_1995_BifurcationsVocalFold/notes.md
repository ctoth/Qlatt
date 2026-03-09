# Steinecke & Herzel (1995) — Implementation Notes

**Paper:** "Bifurcations in an asymmetric vocal-fold model," JASA 97(3), 1874–1884.

## Summary

Simplified two-mass vocal fold model (reduced from Ishizaka & Flanagan 1972) analyzed with nonlinear dynamics methods. The paper locates bifurcations in two physiologically meaningful parameter planes: subglottal pressure Ps vs. stiffness k1 (symmetric case) and Ps vs. asymmetry ratio Q (asymmetric case). Key finding: sufficiently large tension imbalance between left/right folds produces subharmonics, toroidal oscillations, and chaos — corresponding to clinically observed voice disorders (diplophonia, octave jumps, creaky voice).

---

## 1. Model Equations

Each vocal fold (left = l, right = r) is represented by two masses (lower m1, upper m2) coupled by spring kc. The four mechanical equations of motion per side (a = l or r):

```
dx1a/dt = v1a                                                    (11)
dv1a/dt = (1/m1a) * (P1*l*d1 - r1a*v1a - k1a*x1a
           - Theta(-a1)*c1a*(a1/2) - kca*(x1a - x2a))           (12)

dx2a/dt = v2a                                                    (13)
dv2a/dt = (1/m2a) * (-r2a*v2a - k2a*x2a
           - Theta(-a2)*c2a*(a2/2) - kca*(x2a - x1a))           (14)
```

State variables: x1a, v1a, x2a, v2a (displacement and velocity of lower/upper mass, each side).

### Glottal areas

```
a1 = a1l + a1r        (total lower glottal area)
a2 = a2l + a2r        (total upper glottal area)
a1a = a01a + l*x1a    (area contribution from side a, lower)
a2a = a02a + l*x2a    (area contribution from side a, upper)
a_min = min(a1l, a2l) + min(a1r, a2r)                           (5)
```

### Pressure equations (Bernoulli + jet assumption)

```
P1 = Ps * [Theta(a_min) - a_min/a1] * Theta(a1)                (6)
P2 = 0                                                          (7)
U  = sqrt(2*Ps/rho) * a_min * Theta(a_min)     (volume flow)   (8)
```

Where Theta(x) is a smoothed step function:
```
Theta(x) = tanh(50 * x/x0)   for x > 0                         (9)
Theta(x) = 0                  for x <= 0
```

For Theta(a1), x0 = a01. For Theta(a_min), a_min is first clamped: a_min = max(0, a_min).

### Forces on masses

```
Fi = l * di * Pi                                                 (3)
```

### Collision terms

When the glottis closes (ai < 0), additional restoring springs cia activate:
```
c1a = 3*k1a    (collision spring = 3x stiffness)
c2a = 3*k2a
```
The Theta(-a) terms in Eqs. 12, 14 engage these only during collision.

---

## 2. Standard Parameter Set (Symmetric Case)

All units: **centimeters, grams, milliseconds** (and combinations thereof).

| Parameter | Symbol | Value | Notes |
|-----------|--------|-------|-------|
| Lower mass (each side) | m1 | 0.125 g | |
| Upper mass (each side) | m2 | 0.025 g | m2 = m1/5 |
| Lower spring | k1 | 0.08 g/ms^2 | Principal stiffness |
| Upper spring | k2 | 0.008 g/ms^2 | k2 = k1/10 |
| Coupling spring | kc | 0.025 g/ms^2 | |
| Lower damping | r1 | 0.02 g/ms | |
| Upper damping | r2 | 0.02 g/ms | |
| Collision spring (lower) | c1 | 3*k1 = 0.24 | |
| Collision spring (upper) | c2 | 3*k2 = 0.024 | |
| Lower rest area (total) | a01 | 0.05 cm^2 | |
| Upper rest area (total) | a02 | 0.05 cm^2 | Rectangular rest shape |
| Glottal length | l | 0.25 cm | (inferred from Eq. context) |
| Lower thickness | d1 | 0.25 cm | |
| Upper thickness | d2 | 0.05 cm | d2 = d1/5 |
| Subglottal pressure | Ps | 0.008 g/(cm*ms^2) | ~8 cm H2O |
| Air density | rho | 0.00113 g/cm^3 | |

**Note on units:** Ps = 0.008 in cgs-ms units corresponds to ~8 cm H2O (stated explicitly in paper).

---

## 3. Asymmetry Parameterization

### Superior nerve paralysis (Q parameter — eigenfrequency ratio)

Tension parameter Q scales the stiffness/mass of one side relative to the other. With time rescaling t -> Q_l * t and pressure rescaling Ps -> Ps/Q_l, the asymmetry reduces to a single ratio Q = Q_r/Q_l:

```
Left side (unaffected):
  m1l = m10,  k1l = k10,  kcl = kc0,  c1l = c10

Right side (affected, Q <= 1):
  m1r = m10/Q,  k1r = Q*k10,  kcr = Q*kc0,  c1r = Q*c10       (38)
```

The eigenfrequency scales as:
```
omega_ia = Q_a * omega_ia0                                       (33)
omega_i^2 = k_ia / m_ia                                          (34)
```

Q = 1 is symmetric. Q < 1 means the right fold is flaccid (lower eigenfrequency). The analysis restricts to 0.4 <= Q <= 1.

### Recurrent nerve paralysis (Phi parameter — vocalis tension)

Phi affects only the lower mass (vocalis muscle representation):
```
k1a = Phi_a * k10                                               (35)
c1a = Phi_a * c10                                                (36)
m1a = m10 / Phi_a                                                (37)
```

This changes the lower eigenfrequency without affecting the upper mass or coupling.

---

## 4. Bifurcation Analysis Results

### 4.1 Symmetric case: Phonation onset (Ps vs. k1 plane)

**Hopf bifurcation** — the primary bifurcation for phonation onset:
- Fixed point x1 = x2 = 0 (rectangular glottis) loses stability via Hopf bifurcation
- Requires coupling kc > 0 (if kc = 0, get transcritical bifurcation instead)
- Onset pressure increases with damping r1, r2 (Fig. 5)
- Onset pressure increases with stiffness k1 (stiffer folds need more pressure)
- Oscillations cease for high k1 values

**Transcritical bifurcation** (kc = 0 only):
- At Ps = P_crit, rectangular glottis becomes convergent
- Exchange of stability between two fixed points
- Condition: dP1/dx1 > k1 (Eq. 27), equivalent to Ps > P_crit (Eq. 28)

**Phonation threshold pressure** depends linearly on glottal rest area (consistent with Titze 1988).

### 4.2 Superior nerve paralysis: Q-Ps plane (Fig. 7)

Bifurcation diagram computed on grid with Delta_Q = 0.001, Delta_Ps = 0.0002, using 400 ms simulations.

**Attractor types labeled by ratio of maxima** (x1r maxima : x1l maxima per total cycle):

| Region | Q range | Ps range | Attractor type |
|--------|---------|----------|----------------|
| 1:1 | Q > ~0.58 | all shown | Normal phonation (limit cycle) |
| 2:2 | ~0.55–0.58 | ~0.012–0.015 | Period doubling (alternating amplitudes) |
| 3:6 | ~0.53–0.55 | ~0.014–0.015 | Period tripling |
| 5:8 | ~0.53 | ~0.0145 | Higher-order locking |
| Chaos | Q < ~0.53 | ~0.013–0.015 | Aperiodic, broadband spectrum |

**Key transitions:**
- **1:1 -> 2:2**: Period-doubling bifurcation. Diplophonia / "octave jump."
- **2:2 -> higher**: Cascade toward chaos through frequency locking (3:6, 5:8, etc.)
- **Hysteresis**: In transition regions, two attractors coexist (e.g., 1:1 and 2:2 at Q=0.585, Ps=0.0145). Basins of attraction are intertwined (Fig. 16) — weak perturbations can trigger abrupt regime switches.

**Fundamental frequency** governed by the flaccid (affected) side: lower Q -> lower F0.

### 4.3 Recurrent nerve paralysis: Phi-Ps plane (Fig. 17)

| Region | Phi range | Ps range | Attractor type |
|--------|-----------|----------|----------------|
| 1:1 | Phi > ~0.7 | most | Normal phonation |
| 2:2 | ~0.7 | all Ps | Period doubling (narrow band) |
| 3:3 | ~0.68 | ~0.011–0.014 | Period tripling |
| Chaos + tori | Phi < ~0.65 | ~0.008–0.014 | Toroidal oscillations, chaos, periodic windows |

**Key differences from Q asymmetry:**
- Bifurcations occur at *less* asymmetry (higher Phi values ~0.7 vs Q ~0.55)
- Standard Ps = 8 cm H2O is sufficient to reach chaotic regime (unlike Q case which needs higher Ps)
- Toroidal oscillations (quasiperiodic, two independent frequencies) are prominent
- Period-doubling strip at Phi ~ 0.7 exists across all Ps values

### 4.4 One-parameter bifurcation diagrams (Figs. 15, 18)

- **Ps = 0.01, varying Q**: Smooth attractor evolution except small interval
- **Ps = 0.015, varying Q**: Abrupt transitions to multiple-period limit cycles
- **Ps = 0.01, varying Phi**: Large regions of irregular motion with periodic windows interspersed

---

## 5. Key Figures Reference

| Figure | Content |
|--------|---------|
| Fig. 1 | Schematic of two-mass model (masses, springs, dampers) |
| Fig. 2 | Normalized pressure P1(a1, a2) showing Bernoulli term and closure |
| Fig. 3 | Standard parameter oscillations: x1, x2, U (normal phonation) |
| Fig. 4 | Stability of equilibria: transcritical (kc=0) vs Hopf (kc=0.025) |
| Fig. 5 | **Phonation threshold Ps vs k1** for different damping values |
| Fig. 6 | Oscillation frequency vs k1 (approximately sqrt(k1)) |
| Fig. 7 | **Two-parameter bifurcation diagram: Q vs Ps** (superior nerve paralysis) |
| Fig. 8–11 | Time series at four points in Q-Ps plane: 1:1, 2:2, 5:8, chaos |
| Fig. 12 | Fourier spectra for the four regimes |
| Fig. 13 | Phase portraits (x1l vs x1r) for the four regimes |
| Fig. 14 | Next-maximum maps |
| Fig. 15 | One-parameter bifurcation diagrams (maxima of x1r vs Q) |
| Fig. 16 | **Basins of attraction** for coexisting 1:1 and 2:2 attractors |
| Fig. 17 | **Two-parameter bifurcation diagram: Phi vs Ps** (recurrent nerve paralysis) |
| Fig. 18 | One-parameter bifurcation diagram (maxima of x1r vs Phi) |
| Fig. 19–20 | Time series: toroidal oscillations and chaos (Phi case) |
| Fig. 21 | Spectra for toroidal and chaotic cases |
| Fig. 22 | Phase portraits and next-maximum maps for toroidal/chaotic cases |

---

## 6. Relevance to Voice Quality and Register Transitions

### Direct relevance to vocal synthesis

1. **Register transitions as bifurcations**: The transition from modal to irregular voice (diplophonia, vocal fry, creak) maps onto bifurcations in the Q-Ps or Phi-Ps plane. A synthesizer modeling voice quality can treat register transitions as parameter trajectories crossing bifurcation boundaries.

2. **Subharmonic regimes = diplophonia**: Period-doubling (2:2) produces alternating glottal pulses — the acoustic correlate of diplophonia. This is the most common bifurcation and occurs at moderate asymmetry.

3. **Toroidal oscillations = vocal tremor/modulation**: Two independent frequencies producing amplitude modulation of the acoustic signal (Fig. 19). Quasiperiodic regime.

4. **Chaos = rough/creaky voice**: Aperiodic fold vibration producing broadband spectral energy. The unstructured spectrum (Fig. 12, lower right) is characteristic.

5. **Hysteresis implies abrupt transitions**: Because coexisting attractors have intertwined basins, small perturbations in parameters can cause sudden jumps between regular and irregular phonation — matching clinical observations of abrupt voice breaks.

6. **The asymmetry ratio Q is the key control**: For a finite-dimensional voice quality model, Q (ratio of left/right eigenfrequencies) is the most parsimonious bifurcation parameter. Values:
   - Q = 1.0: symmetric, normal phonation
   - Q ~ 0.6: onset of period doubling
   - Q ~ 0.55: higher-order subharmonics
   - Q < 0.53: chaos

7. **Subglottal pressure modulates the bifurcation structure**: Higher Ps strengthens coupling between folds (through airflow), which can either stabilize or destabilize depending on the asymmetry level.

### What this model does NOT include (simplifications)
- No vocal tract coupling (no acoustic feedback)
- No cubic nonlinearities from Ishizaka & Flanagan (collision springs are linear)
- No glottal rest area asymmetry (only stiffness asymmetry)
- Rectangular rest glottis only
- Simplified aerodynamics (no viscous losses, no vena contracta)
- No body-cover distinction (cf. Story & Titze 1995)

---

## 7. Numerical Implementation Notes

- **Integration**: 400 ms simulations on parameter grid
- **Grid resolution**: Delta_Q = 0.001, Delta_Ps = 0.0002 for Fig. 7; Delta_Phi = 0.01, Delta_Ps = 0.0002 for Fig. 17
- **Initial conditions**: x1l(0) = x1r(0) = 0.1, v1l(0) = v1r(0) = 0.1, x2l(0) = x2r(0) = 0, v2l(0) = v2r(0) = 0
- **Attractor classification**: By counting maxima of x1r and x1l per total cycle
- **Continuation**: AUTO software (Doedel 1986) used for tracking bifurcation curves
- **Smoothed step function**: tanh(50 * x/x0) approximation avoids discontinuity at glottal closure

## Collection Cross-References

### Conceptual Links (not citation-based)
- [[Lucero_2005_VocalFoldBifurcations]] — Both papers analyze bifurcations in vocal fold models. Steinecke focuses on left-right asymmetry in the two-mass model (subharmonics, chaos, diplophonia), while Lucero analyzes onset/offset hysteresis in the single-DOF mucosal wave model. Together they map the bifurcation landscape: Steinecke covers pathological asymmetric vibration, Lucero covers normal phonation onset/offset dynamics.
- [[Lucero_1999_BifurcationsVoiceOnsetOffset]] — Both use the Ishizaka-Flanagan two-mass model family. Lucero 1999 focuses on onset/offset hysteresis under symmetric conditions (subcritical Hopf at onset, fold bifurcation at offset), while Steinecke maps the asymmetry-driven bifurcation landscape (period-doubling, chaos). Together they characterize symmetric onset/offset dynamics and asymmetric pathological regimes.
- [[Titze_1991_NeurologicAperiodicity]] — Complementary aperiodicity model. Steinecke models how left-right vocal fold asymmetry produces deterministic bifurcations (period-doubling, chaos), while Titze models stochastic neurologic jitter from motor neuron firing randomness (0.2-1.2% F0 perturbation). Titze explicitly excludes asymmetry-driven nonlinear effects; Steinecke's model operates even with zero neurologic noise. Together they cover the two main aperiodicity mechanisms in phonation.
