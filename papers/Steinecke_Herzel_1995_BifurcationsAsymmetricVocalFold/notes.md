# Steinecke & Herzel 1995 — Bifurcations in an Asymmetric Vocal-Fold Model

## Key Contribution

Systematic bifurcation analysis of a simplified two-mass vocal fold model with left-right asymmetry. Shows how tension imbalance between left and right folds produces subharmonic regimes, period doubling, toroidal oscillations, and deterministic chaos — explaining irregular voice quality in conditions like unilateral laryngeal paralysis.

## The Simplified Two-Mass Model

Based on Ishizaka & Flanagan (1972) but significantly reduced:
- Retains only the mechanical equations of the coupled oscillators
- Neglects vocal tract coupling, subglottal resonances, cubic tissue nonlinearities
- Separates vocal fold dynamics from vocal tract acoustics
- Uses Bernoulli flow assumption (jet at narrowest glottal constriction)

### Model Variables

Each fold (left `l`, right `r`) has upper and lower masses:
- `x_{ia}` — displacement of mass `i` (1=lower, 2=upper) on side `a` (l or r)
- `i,j = {1: lower mass, 2: upper mass}`
- `a = {l: left side, r: right side}`

### Equations of Motion (Eq. 1)

```
m_{ia} * x''_{ia} + r_{ia} * x'_{ia} + k_{ia} * x_{ia} + Theta(-a_i) * c_{ia}(a_i / 2l)
  + k_{ca}(x_{ia} - x_{ja})
  = F_i(x_{1l}, x_{1r}, x_{2l}, x_{2r})
```

Where:
- `Theta(x) = 1 if x > 0, else 0` (Heaviside function — collision restoring force only during contact)
- `k_{ia}` — spring constants
- `k_{ca}` — coupling constants between upper and lower masses
- `c_{ia}` — additional spring constants during collision
- `r_{ia}` — damping constants
- `F_i` — aerodynamic driving forces from subglottal pressure

### Glottal Area Definitions

- `a_i = a_{0i} + d_i` — glottal area for each section (lower/upper)
- `a_{0i}` = rest area of section i
- `a_min = min(a_{0il} + x_{il}, a_{0ir} + x_{ir})` if areas positive; min of relevant sides

### Aerodynamic Forces (Eq. 6)

Pressure on lower mass:
```
P_1 = P_s [1 - Theta(a_min)(a_min/a_1)^2] * Theta(a_1)
```

Volume flow velocity (Eq. 8):
```
U = sqrt(2 * P_1 / rho) * a_min * Theta(a_1)
```

Theta function approximation for numerical simulation (Eq. 9):
```
Theta(x) ~ tanh(50 * (x / x_0)) for x > 0, else 0
```
where x_0 is a scale value for gradient of Theta.

## Standard Parameter Set (Table on p. 1876)

All units: centimeters, grams, milliseconds.

| Parameter | Value |
|-----------|-------|
| m_1l = m_1r | 0.125 |
| r_1l = r_1r = r_2l = r_2r | 0.02 |
| m_2l = m_2r | 0.025 |
| r_1l = r_1r = r_2l = r_2r | 0.02 |
| k_1l = k_1r = k_1 | 0.08 |
| c_1l = c_1r = c_1 | 3 * k_1 |
| k_2l = k_2r | 0.008 |
| c_2l = c_2r | 3 * k_2 |
| k_cl = k_cr = k_c | 0.025 |
| a_01 | 0.05 |
| a_02l = a_02r | 0.05 |
| d_1 | 0.25 |
| d_2 | 0.05 |
| P_0 | 0.008 (~8 cm H2O) |
| g (grid) | 0.00113 |

## Symmetric Model Analysis (Section II)

### Phonation Onset — Hopf Bifurcation

The phonation onset is a Hopf bifurcation in the `P_s - k_1` plane:
- `P_s` (subglottal pressure) is related to intensity
- `k_1` (lower mass stiffness) is related to frequency

### Critical Subglottal Pressure (Eq. 24)

For the onset of oscillation:
```
P_crit = (a_0 / (4 * l^2 * d_1)) * (k_1 * k_2 + k_c * (k_1 + k_2)) / k_2
```

Key results:
- Threshold pressure increases with damping constants
- Threshold pressure proportional to glottal rest area (as predicted by Titze 1988)
- For `k_c = 0` (uncoupled masses), instability condition is `dF_1/dx_1 > k_1`

## Asymmetric Model — Tension Parameters (Section III-IV)

### Modeling Laryngeal Paralysis

Two tension parameters model the cricothyroid and vocalis muscles:
- `Q` — tension imbalance ratio (ratio of eigenfrequencies right/left): `Q = Q_r / Q_l`
- `Q_tilde` — vocalis muscle activity (affects mass only)

Parameter scaling (Eqs. 29-37):
```
k_{ia} = Q_a * k_{ia0}     (springs scale with Q)
k_{ca} = Q_a * k_{ca0}     (coupling scales with Q)
c_{ia} = Q_a * c_{ia0}     (collision springs scale with Q)
m_{ia} = m_{ia0} / Q_a     (masses scale inversely with Q)
omega_{ia} = Q_a * omega_{ia0}  (eigenfrequencies scale with Q)
omega^2_{ia} = k_{ia} / m_{ia}  (definition)
```

### Modeling Superior Nerve Paralysis

Unilateral superior nerve paralysis modeled by tension imbalance `Q_l != Q_r`:
- Time transformation `t -> Q_l * t` and pressure scaling `P_s -> P_s / Q_l`
- Reduces to analysis where only `Q = Q_r / Q_l` matters (ratio of tensions)
- Can restrict analysis to `Q <= 1` (affected side has lower tension)

### Modeling Recurrent Nerve Paralysis

- All intralaryngeal muscles except cricothyroid involved
- Vocal fold fixed in paramedian/intermediate position
- Glottal gap asymmetry effect modeled through `Q_tilde` parameter
- Changes phonation onset (discussed in Sec. II analysis)

## Bifurcation Diagram Results (Section IV-A)

### Q-P_s Parameter Plane (Fig. 7)

For the standard parameter set, bifurcations primarily occur at significant asymmetry (low Q values, 0.5 < Q < 0.6):

| Q range | Behavior |
|---------|----------|
| Q ~ 1.0 | Normal 1:1 phonation |
| Q ~ 0.6 | 1:1 locking (both folds entrained) |
| Q ~ 0.57 | 2:2 period doubling (alternating amplitudes) |
| Q ~ 0.53 | 5:8 complex locking ratio |
| Q ~ 0.529 | Chaotic/aperiodic oscillations |

### Attractor Types Observed

1. **1:1 locking** — Normal phonation, both folds vibrate in sync
2. **Period doubling (2:2)** — Two closure phases per total period, alternating amplitudes; associated with "octave jumps" or "diplophonia"
3. **Subharmonic regimes (n:m)** — Complex locking ratios (e.g., 3:5, 4:7, 5:8); associated with "vocal fry" or "creak"
4. **Toroidal oscillations** — Two independent frequencies; Fourier spectrum shows independent peaks and their linear combinations
5. **Chaos** — Unstructured spectrum, strange attractor in phase space

### Key Physical Insight

- The **frequency** of oscillation is governed by the flaccid (lower-tension) side
- Lower Q -> lower fundamental frequency (patients with paralysis struggle to phonate higher tones)
- Healthy fold (`x_{1l}`) precedes the affected side with greater amplitude
- Period doubling manifests as alternating pulses in the airflow signal
- Bifurcations occur at **low Q and high P_s** — instabilities expected at high voice effort and low fundamental frequency

### Recurrent Nerve Paralysis (Section IV-B, Fig. 17)

In the `Q-P_s` plane with `Q_tilde` variations:
- Small Q interval with period doubling/tripling at low P_s
- At Q ~ 5-6, variety of different regions: period doubling, toroid, chaos
- "Periodic windows" interspersed with chaotic behavior
- Transitions associated with hysteresis

## Relevance to Voice Quality Modeling

### Phonation Types Mapped to Bifurcations

The paper identifies three main attractor types matching clinically observed voice disorders:
1. **Subharmonics** — "octave jump," "diplophonia," "dicrotic dysphonia"
2. **Toroidal oscillations** — Two independent frequency components
3. **Chaos** — Irregular, aperiodic vibration; "creaky voice," "rough voice"

### Implications for Synthesizer Implementation

1. **Jitter/shimmer from asymmetry**: Even small left-right tension imbalance produces cycle-to-cycle perturbation; this provides a principled mechanism for jitter generation in synthesis
2. **Subharmonic register**: Period-doubling bifurcation provides a mathematical framework for modeling vocal fry/creak as a specific regime rather than ad hoc parameter adjustment
3. **Pressure-dependent voice quality**: The bifurcation diagrams show that voice quality transitions depend on the interaction of subglottal pressure and asymmetry — not just one parameter in isolation
4. **Two-parameter control**: Voice quality can be parametrically controlled via the (Q, P_s) plane — Q controls the tension asymmetry, P_s controls the driving pressure

### Connection to Klatt Synthesizer

- The bifurcation analysis explains why certain parameter combinations in the Klatt synthesizer produce "naturalness" — slight asymmetries produce natural jitter
- For modeling pathological voice, the Q parameter could drive systematic variation in AV, F0 perturbation, and spectral noise
- The period-doubling route to chaos maps well onto the Klatt AH (aspiration) and DI (diplophonia) parameters
- Subglottal pressure thresholds for phonation onset (Eq. 24) could inform the relationship between AV ramp-up and P_s in the Klatt model
