# Discovering Dynamical Laws for Speech Gestures

**Authors:** Sam Kirkham
**Year:** 2025
**Venue:** Cognitive Science (Vol. 49, e70064)
**DOI:** 10.1111/cogs.70064

## One-Sentence Summary
Uses sparse symbolic regression (SINDy) on X-ray microbeam articulatory data to discover that speech gestures are governed by under-damped (not critically damped) second-order differential equations, with ~1/3 of trajectories requiring a nonlinear cubic term.

## Problem Addressed
The standard task-dynamic model (AP/TD) assumes articulatory gestures are critically damped harmonic oscillators, but this fails to capture empirical velocity asymmetries and time-to-peak velocity patterns. What are the actual dynamical equations governing speech gestures, discovered directly from data rather than assumed a priori?

## Key Contributions
- Applies SINDy (Sparse Identification of Nonlinear Dynamics) to 13,742 articulatory gesture trajectories from 48 speakers
- Discovers that a second-order linear model ($\ddot{x} = -b\dot{x} - k(x - T)$) fits ~2/3 of trajectories with mean $R^2 = 0.98$
- Shows the system is under-damped (not critically damped as AP/TD assumes), with $b < 2\sqrt{k}$
- Demonstrates ~1/3 of trajectories require a nonlinear cubic restoring force for accurate dynamics
- First-order models are rejected: despite good position fits ($R^2 \approx 0.95$), Hooke portrait analysis reveals fundamental qualitative failures
- Proposes the "virtual target" concept: SINDy discovers $T_v = x_0 + (T - x_0)/2$, halfway between initial position and empirical target

## Methodology
1. **Data**: X-Ray Microbeam (XRMB) corpus, 48 speakers of American English, continuous speech
2. **Articulatory variables**: Lip Aperture (LA), Tongue Tip (TT), Tongue Dorsum (TD), Tongue Root (TR) — each reduced to 1D via PCA
3. **Gesture segmentation**: Velocity zero-crossings define gesture boundaries; multi-peak and >200ms trajectories excluded
4. **Model discovery**: SINDy with two sparsity algorithms — STLSQ for first-order, constrained SR3 for second-order
5. **Model ensembling**: Per-token models ensembled by majority model structure across the dataset
6. **Evaluation**: Variance-weighted $R^2$ on 80/20 train/test split; phase portraits and Hooke portraits for qualitative assessment

## Key Equations

### Standard task dynamic model (critically damped harmonic oscillator)
$$m\ddot{x} + b\dot{x} + k(x - T) = 0 \tag{2}$$
Where: $x$ = position, $\dot{x}$ = velocity, $\ddot{x}$ = acceleration, $m$ = mass (set to 1), $b$ = damping, $k$ = stiffness, $T$ = target

### Critical damping condition
$$b = 2\sqrt{mk} \tag{implicit}$$

### Step activation function
$$a(t) = \begin{cases} 1, & t \in [t_a, t_b] \\ 0, & \text{otherwise} \end{cases} \tag{4}$$

### Ramped activation function (Kroger et al., 1995)
$$a(t) = \begin{cases} 0, & t < t_a \\ \sin\left(\frac{2\pi(t-t_a)}{4(t_b-t_a)}\right), & t_a \leq t < t_b \\ 1, & t_b \leq t < t_c \\ \sin\left(\frac{2\pi(t-t_d)}{4(t_c-t_d)}\right), & t_c \leq t < t_d \\ 0, & t \geq t_d \end{cases} \tag{5}$$

### Nonlinear task dynamic model (Sorensen & Gafos, 2016)
$$\ddot{x} + a(t)[b\dot{x} + kx - dx^3] = 0 \tag{6}$$
Where: $d$ = nonlinear force coefficient

### SINDy framework
$$\dot{X} = \Theta(X)\Xi \tag{10}$$
Where: $\Theta(X)$ = feature library (polynomials), $\Xi$ = sparse coefficient matrix

### STLSQ objective (first-order)
$$\min_{\Xi} ||\dot{X} - \Theta(X)\Xi||_2^2 + \alpha||\Xi||_2^2 \tag{13}$$

### SR3 objective (second-order, constrained)
$$\min_{\Xi, W} \frac{1}{2}||\dot{X} - \Theta(X)\Xi||^2 + \lambda R(W) + \frac{1}{2\nu}||\Xi - W||^2 \quad \text{s.t. } C\xi = d \tag{19}$$

### Discovered first-order model
$$\dot{x} = a - bx + cx^2 - dx^3 \tag{20}$$

### Discovered second-order linear model
$$\ddot{x} = kT - kx - b\dot{x} \tag{21}$$
Equivalently: $\ddot{x} = -b\dot{x} - k(x - T)$ — the standard harmonic oscillator form (Eq. 22)

### Virtual target relationship
$$T_v = x_0 + \frac{T - x_0}{2} \tag{24}$$
$$T = 2T_v - x_0 \tag{25}$$

### Reformulated model with initial condition
$$\ddot{x} = -b\dot{x} - kx + \frac{k}{2}(T + x_0) \tag{26}$$

### Final nonlinear model (with cubic term and optional nonlinear damping)
$$\ddot{x} + a(t)[b\dot{x} + k(x - T) - d(x - T)^3] = 0 \tag{27}$$

### With nonlinear damping variant
$$\ddot{x} + a(t)[b\dot{x}^3 + k(x - T) - d(x - T)^3] = 0 \tag{28}$$

## Parameters

| Name | Symbol | Units | Typical Value | Range | Notes |
|------|--------|-------|---------------|-------|-------|
| Mass | $m$ | - | 1 | Fixed | Conventionally set to 1 |
| Stiffness | $k$ | s$^{-2}$ | 592 | 500-2000+ | Controls movement speed |
| Damping | $b$ | s$^{-1}$ | 0.264 | ~0 to $2\sqrt{k}$ | Under-damped: $b \ll 2\sqrt{k}$ |
| Target | $T$ | mm | varies | - | Empirical target at velocity zero-crossing |
| Virtual target | $T_v$ | mm | varies | - | $T_v = x_0 + (T-x_0)/2$, midpoint |
| Nonlinear coefficient | $d$ | mm$^{-2}$s$^{-2}$ | varies | - | Cubic restoring force strength |
| STLSQ threshold | $\lambda$ | - | 0.001-0.1 | {0.001, 0.01, 0.1} | Sparsity threshold |
| SR3 regularization | $\lambda$ | - | $\eta^2/2\nu$ | - | Sparsity promoting |
| Critical damping | $b_c$ | s$^{-1}$ | $2\sqrt{k}$ | - | $b_{crit} = 2\sqrt{k} \approx 89.44$ for $k=2000$ |

## Implementation Details

### SINDy Algorithm Steps
1. Collect position $x(t)$ and velocity $\dot{x}(t)$ trajectories
2. Compute numerical derivatives (acceleration $\ddot{x}$ for second-order)
3. Construct feature library $\Theta(X)$ from polynomial basis (e.g., $[1, x, x^2, x^3]$ for first-order; $[x, \dot{x}]$ for second-order)
4. Solve sparse regression to find coefficient matrix $\Xi$
5. Threshold small coefficients to zero
6. Iterate until convergence (max 20-30 iterations)
7. Ensemble across tokens: use majority model structure

### Gesture Segmentation
- Divide signal at interpause intervals
- Identify velocity zero-crossings
- Each gesture = one velocity peak/trough bounded by zero-crossings
- Exclude: multi-peak trajectories (13.3%), trajectories > 200ms (24.4%)
- Final dataset: 13,742 gestures (62.3% of total)

### Library Selection
- First-order: third-degree polynomial ($x, x^2, x^3$) selected
- Second-order: first-degree polynomial ($x, \dot{x}$) selected (linear model)
- Higher-degree libraries for second-order cause negative $R^2$ (overfitting)

### Key Finding: Under-Damping
- SINDy consistently discovers $b \approx 0.264$ while critical damping requires $b = 2\sqrt{k} \approx 48.7$ (for $k = 592$)
- The system is dramatically under-damped: $b/b_c \approx 0.005$
- This means the oscillator would ring/oscillate if not deactivated at the target
- Gesture deactivation mechanism is required to prevent oscillation

## Figures of Interest
- **Fig. 1 (p. 4):** Damped mass-spring model diagram and trajectory visualization
- **Fig. 2 (p. 6):** Linear vs nonlinear position/velocity trajectories showing velocity asymmetry
- **Fig. 4 (p. 10):** SINDy recovering known model from simulated data ($R^2 = 1.00$)
- **Fig. 5 (p. 18):** First-order model predictions on test data (10 random trajectories per variable)
- **Fig. 6 (p. 20):** Second-order model predictions — visually superior fits
- **Fig. 7 (p. 22):** Phase and Hooke portraits for first-order model showing systematic errors
- **Fig. 9 (p. 24):** Phase and Hooke portraits for second-order model — quasi-linear dynamics confirmed
- **Fig. 10 (p. 25):** Key figure showing under-damped behavior: SINDy target vs empirical target, oscillation beyond gesture duration
- **Fig. 11 (p. 27):** Effect of varying $k$ and $b$ on trajectory shape
- **Fig. 12 (p. 29):** Hooke portraits at different $R^2$ percentiles showing where nonlinearity appears
- **Fig. 13 (p. 30):** Distribution of $R_H^2$ values — ~69% have $R_H^2 > 0.95$, ~15% have $R_H^2 < 0.9$
- **Fig. 14 (p. 30):** Linear vs cubic second-order Hooke portraits for worst-fitting trajectories

## Results Summary

### First-Order Models
- Third-degree polynomial library selected: $\dot{x} = a - bx + cx^2 - dx^3$
- Mean $R^2 = 0.95-0.96$ (training), $0.95$ (test) across all articulatory variables
- **Rejected**: Hooke portraits reveal qualitative failure — predicts nonlinearity where data is quasi-linear, and vice versa

### Second-Order Linear Models
- First-degree library: $\ddot{x} = -b\dot{x} - k(x - T)$
- Mean $R^2 = 0.98-0.99$ (training), $0.98-0.99$ (test)
- 100% of models contain all three terms ($b\dot{x}$, $kx$, $kT$)
- No trajectory below $R^2 = 0.64$ in training or test
- Excellent phase and Hooke portrait fits for majority of tokens

### Nonlinearity Analysis
- ~69% of trajectories have highly linear Hooke portraits ($R_H^2 > 0.95$)
- ~15% show substantial nonlinearity ($R_H^2 < 0.9$)
- ~30% show some degree of nonlinearity requiring cubic term
- Adding $x^3$ or $(x-T)^3$ to second-order model captures nonlinear cases
- LA and TT models also require $\dot{x}^3$ (nonlinear damping)

## Limitations
- Gesture segmentation relies on velocity zero-crossings, excluding overlapping gestures (~37% of data excluded)
- Cannot model gesture overlap/blending (fundamental to connected speech)
- Single articulatory dimension per variable (PCA projection)
- Under-damping finding needs reconciliation with how gestures achieve targets without oscillation
- Nonlinear (cubic) model is harder to parameterize than linear model
- Only tested on American English; cross-language validation needed

## Testable Properties
- Second-order linear model must achieve $R^2 \geq 0.64$ on any single-gesture trajectory
- Mean $R^2$ across gestures should be $\geq 0.98$ for second-order linear model
- Discovered damping coefficient $b$ should be substantially less than $2\sqrt{k}$ (under-damped)
- Virtual target $T_v$ should be approximately midpoint between $x_0$ and empirical $T$: $T_v \approx (x_0 + T)/2$
- Adding cubic term should improve $R_H^2$ for trajectories with $R_H^2 < 0.9$ under linear model
- First-order models should show worse Hooke portrait fits despite comparable position $R^2$
- Stiffness $k$ should correlate with $|T|$ (target magnitude) for LA ($r = 0.94$) and TR ($r = 0.91$)

## Relevance to Project
This paper is primarily relevant to the articulatory-to-acoustic mapping and coarticulation modeling aspects of the Qlatt project:

1. **Formant transition dynamics**: The finding that gestures are under-damped (not critically damped) suggests that Klatt formant transitions may benefit from slight overshoot rather than monotonic approach to targets — this matches Hertz's observation of "stable transition durations"
2. **Coarticulation modeling**: The discovered equations could generate articulatory trajectories that are then mapped to formant tracks, providing a principled alternative to ad-hoc interpolation
3. **Duration-stiffness relationship**: Higher $k$ = faster movement, providing a principled basis for the relationship between gesture magnitude and duration in duration rules
4. **Gesture overlap**: The paper explicitly acknowledges it cannot handle overlapping gestures, which is the normal case in connected speech — this is a significant limitation for practical synthesis use

The paper does NOT provide:
- Direct formant frequency targets or acoustic parameters
- Implementation of gesture overlap/blending
- A complete articulatory-to-acoustic mapping
- Parameters usable in Klatt synthesis without an articulatory intermediate layer

## Open Questions
- [ ] How does gesture deactivation work if the system is under-damped? (Feedback mechanism needed)
- [ ] Can the cubic nonlinear model be reliably parameterized from text input?
- [ ] How do overlapping gestures interact dynamically? (Excluded from this study)
- [ ] Does under-damping produce perceptible overshoot in formant trajectories?
- [ ] What is the mapping from these articulatory dynamics to acoustic (formant) dynamics?

## Related Work Worth Reading
- Sorensen & Gafos (2016) — The nonlinear autonomous task dynamic model with cubic term
- Saltzman & Munhall (1989) — Original task-dynamic approach (already in collection)
- Turk & Shattuck-Hufnagel (2020) — General Tau model for articulatory movements
- Tilsen (2020) — Alternative view: gestures as continuously active with varying force
- Brunton, Proctor, & Kutz (2016) — SINDy method for discovering dynamical equations from data

## Collection Cross-References

### Already in Collection
- [[Saltzman_1989_DynamicalGesturalPatterning]] — The original task-dynamic model that this paper tests and extends; Kirkham finds it is under-damped rather than critically damped
- [[Recasens_1997_LingualCoarticulationDAC]] — DAC model of coarticulation; Kirkham's dynamical approach offers an alternative mechanism
- [[Sering_2020_AnticipatoryCoarticulation]] — Uses VocalTractLab articulatory synthesis; Kirkham's model provides the underlying gestural dynamics

### Now in Collection
- **Sorensen & Gafos (2016)** — [[Sorensen_Gafos_2016_GestureAutonomousDynamicalSystem]] — the cubic model validated here

### New Leads (Not Yet in Collection)
- Turk & Shattuck-Hufnagel (2020) — General Tau model of speech timing
- Tilsen (2019a) — Continuously active gestures model
- Elie, Lee, & Turk (2023) — Modeling articulatory trajectories using general tau theory
- Iskarous, Cole, & Steffman (2024) — Minimal dynamical model of intonation

### Conceptual Links (not citation-based)
- [[Iskarous_Pouplier_2022_ArticulatoryPhonologyAppraisal]] — Moderate. Iskarous & Pouplier appraise the theoretical foundations of articulatory phonology; Kirkham's empirical finding that gestures are under-damped (not critically damped) provides data-driven evidence relevant to the dynamical primitives discussed in their appraisal.

### Supersedes or Recontextualizes
- [[Saltzman_1989_DynamicalGesturalPatterning]] — Kirkham's data-driven approach provides empirical evidence that the critical damping assumption in Saltzman & Munhall (1989) is incorrect; the actual dynamics are under-damped with $b \ll 2\sqrt{k}$
