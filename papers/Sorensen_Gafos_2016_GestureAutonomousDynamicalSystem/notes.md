# The Gesture as an Autonomous Nonlinear Dynamical System

**Authors:** Tanner Sorensen and Adamantios Gafos
**Year:** 2016
**Venue:** Ecological Psychology, 28(4), 188-215
**DOI:** 10.1080/10407413.2016.1230368

## One-Sentence Summary
Proposes that the speech gesture is a nonlinear autonomous dynamical system with an anharmonic potential, replacing the standard linear (critically damped harmonic oscillator) model to correctly predict kinematic relationships among movement amplitude, peak velocity, and duration.

## Problem Addressed
The standard task-dynamic model of speech gestures uses a critically damped linear harmonic oscillator (Saltzman & Munhall, 1989). This linear model fails to predict experimentally observed kinematic properties:
1. Velocity profiles are nearly symmetric (proportional time to peak velocity ~0.50), but the linear model with step activation predicts 0.20
2. Peak velocity and amplitude covary nonlinearly (saturating at large amplitudes)
3. The ratio of peak velocity to amplitude varies inversely with movement duration

Previous attempts to fix the linear model used continuous (non-step) activation functions, making the gesture nonautonomous (dependent on an external timekeeper). This paper argues that nonautonomy is theoretically undesirable and proposes a nonlinear autonomous alternative instead.

## Key Contributions
- Formal distinction between autonomous ($\dot{x} = f(x)$) and nonautonomous ($\dot{x} = f(x,t)$) dynamical systems as applied to speech gestures
- Introduction of an anharmonic (quartic) potential that replaces the harmonic potential of the standard model
- Demonstration that the nonlinear model with simple step activation correctly predicts all three kinematic properties that the linear model fails on
- Quantitative validation against X-ray microbeam data from 43 speakers (159 recordings)
- Extension to isochronous (metronomic) speech tasks showing chaotic attractor dynamics

## Methodology

### Theoretical Framework
The paper distinguishes:
- **Autonomous systems**: $\dot{x} = f(x)$ — force depends only on state, not time. Trajectories cannot cross in phase space. Gesture timing is intrinsic.
- **Nonautonomous systems**: $\dot{x} = f(x,t)$ — force depends on state AND time. Requires an external timekeeper. Trajectories can cross.

### The Standard Linear Model (Task Dynamics)
The critically damped harmonic oscillator:

$$\ddot{x} + b\dot{x} + kx = 0$$

where $b = 2\sqrt{mk}$ (critical damping, $m=1$), activated by a step function $a(t)$:

$$\ddot{x} + a(t)(b\dot{x} + kx) = 0$$

With potential:

$$V(x) = kx^2/2$$

This is the standard Saltzman & Munhall (1989) / Browman & Goldstein (1990) gestural model.

### The Proposed Nonlinear Model
Adds a negative quartic term to the potential:

$$V(x) = kx^2/2 - dx^4/4$$

Yielding the equation of motion:

$$\ddot{x} + b\dot{x} + \nabla(kx^2/2 - dx^4/4) = 0$$

Which expands to:

$$\ddot{x} + b\dot{x} + kx - dx^3 = 0$$

The restoring force becomes:

$$F(x) = -\nabla V(x) = -kx + dx^3$$

Key properties of the anharmonic potential:
- Near the target ($x \approx 0$): behaves like the linear model ($dx^3 \approx 0$)
- Far from target: the cubic term opposes the linear restoring force, weakening it
- Basin of attraction exists for $|x| < \sqrt{k/d}$
- The potential slope is shallower than the harmonic potential everywhere in the basin

### Activation Mechanism
Step activation (same as standard model):

$$a(t) = \begin{cases} 1, & t \in [t_a, t_b] \\ 0, & \text{otherwise} \end{cases}$$

This remains piecewise autonomous — during activation, the system is fully autonomous.

### Continuous Activation Alternative (for comparison)
Kröger et al. (1995) proposed continuous activation with quarter-sine ramps:

$$f(x) = \begin{cases} 0, & t < t_a \\ \sin\left(\frac{2\pi(t-t_a)}{4(t_b-t_a)}\right), & t_a \leq t < t_b \\ 1, & t_b \leq t < t_c \\ \sin\left(\frac{2\pi(t-t_d)}{4(t_c-t_d)}\right), & t_c \leq t < t_d \\ 0, & t \geq t_d \end{cases}$$

This fixes proportional time to peak velocity but makes the system nonautonomous.

## Key Equations

### Equation (1) — Autonomous system
$$\dot{x} = f(x)$$

### Equation (2) — Nonautonomous system
$$\dot{x} = f(x, t)$$

### Equation (8) — Standard gestural model (critically damped harmonic oscillator)
$$\ddot{x} + b\dot{x} + kx = 0, \quad b = 2\sqrt{mk}$$

### Equation (9) — Harmonic potential
$$V(x) = kx^2/2$$

### Equation (10) — Rewritten with potential gradient
$$\ddot{x} + b\dot{x} + \nabla kx^2/2 = 0$$

### Equation (11) — With step activation
$$\ddot{x} + a(t)(b\dot{x} + \nabla kx^2/2) = 0$$

### Equation (17) — Proposed nonlinear model
$$\ddot{x} + b\dot{x} + \nabla(kx^2/2 - dx^4/4) = 0$$

### Equation (18) — Nonlinear restoring force
$$F(x) = -\nabla V(x) = -kx + dx^3$$

### Equation (19) — Anharmonic potential
$$V(x) = kx^2/2 - dx^4/4$$

### Equation (20) — Objective function for fitting
$$f(\theta) = \sum_i (d_i(t) - d_{\text{proj}_u}\gamma(t))^2 / T$$

where $\theta = k, d$ for linear and $\theta = k, d, \Delta$ for nonlinear; $d_i(t)$ is velocity profile from dynamical system; $d_{\text{proj}_u}\gamma/dt$ is observed velocity.

### Equation (21) — Driven nonlinear model (isochronous task)
$$\ddot{x} + b\dot{x} + \nabla(kx^2/2 - dx^4/4) = \Gamma\sin\omega t$$

where $\omega < \sqrt{k/m}$ (forcing frequency slower than natural frequency).

## Parameters

| Name | Symbol | Units | Default | Range | Notes |
|------|--------|-------|---------|-------|-------|
| Stiffness | $k$ | — | — | >0 | Controls natural frequency of gesture |
| Damping | $b$ | — | $2\sqrt{mk}$ | — | Critical damping condition |
| Mass | $m$ | — | 1 | — | Assumed unit mass |
| Nonlinearity coefficient | $d$ | — | — | $0 < d < k$ | Controls strength of anharmonic correction |
| Activation onset | $t_a$ | s | — | — | When gesture turns on |
| Activation offset | $t_b$ | s | — | — | When gesture turns off |
| Forcing amplitude | $\Gamma$ | — | — | — | For isochronous task only |
| Forcing frequency | $\omega$ | rad/s | — | $< \sqrt{k/m}$ | Must be slower than natural frequency |

## Implementation Details

### Fitting Procedure
- Parameters $(k, d)$ for linear or $(k, d, \Delta)$ for nonlinear are estimated per velocity profile
- Uses simplex search method (Lagarias et al., 1998) in MATLAB
- Objective: minimize sum-of-squared-errors between model velocity profile and observed velocity projected onto principal component
- Initial conditions: $x = 1, \dot{x} = 0$ (displacement starts at 1, velocity at 0)

### Data Reduction
- 2D X-ray microbeam pellet positions projected onto principal component of movement
- Movement onset/offset determined by relative velocity criterion: 20% of peak velocity
- Separate criteria for raising (positive peak) vs. lowering (negative peak) movements

### Key Quantitative Results
- **Proportional time to peak velocity**: 0.49 ± 0.07 (observed); nonlinear predicts 0.36–0.52 depending on $d$; linear predicts 0.20
- **Peak velocity vs amplitude**: nonlinear predicts saturation (soft ceiling); linear predicts strict proportionality
- **Equation of constraint**: (peak velocity) / (amplitude) = c / (settling time), where c is constant — holds for nonlinear but NOT for linear model

## Figures of Interest
- **Fig 8 (page 8/195):** Phase plane trajectories for critically damped harmonic oscillator — the standard gestural model
- **Fig 9 (page 8/195):** Harmonic potential V(x) = kx²/2
- **Fig 13 (page 11/198):** Proportional time to peak velocity = 0.20 for step activation
- **Fig 16 (page 13/200):** Comparison of velocity profiles: step activation (0.20) vs continuous activation (0.34, 0.42)
- **Fig 17 (page 14/201):** Nonlinear stiffness function: linear (-kx) + cubic (+dx³)
- **Fig 18 (page 14/201):** Harmonic vs anharmonic potential comparison
- **Fig 19 (page 15/202):** Proportional time to peak velocity for d=0 (0.20), d=0.7k (0.36), d=0.95k (0.52)
- **Fig 20 (page 16/203):** Peak velocity vs amplitude — linear, weakly nonlinear, strongly nonlinear
- **Fig 22 (page 17/204):** Amplitude-normalized peak velocity vs settling time for nonlinear system
- **Fig 25 (page 21/208):** Log error histograms — nonlinear fits better than linear
- **Fig 26 (page 22/209):** Best/median/worst velocity profile fits for both models
- **Fig 29 (page 23/210):** Chaotic attractor for driven nonlinear dynamics
- **Fig 30 (page 23/210):** Hooke diagram showing N-shapes (anharmonicity indicator)
- **Fig 31 (page 24/211):** Phase portraits of lip aperture for isochronous speech

## Results Summary

### Qualitative Predictions (all confirmed by data)
1. **Velocity profile symmetry**: Nonlinear model produces proportional times to peak velocity of 0.36–0.52, matching observed ~0.49. Linear model gives 0.20.
2. **Nonlinear amplitude-velocity relation**: Peak velocity saturates at large amplitudes in nonlinear model, consistent with observed data. Linear model predicts strict proportionality.
3. **Inverse duration-velocity/amplitude ratio**: The "equation of constraint" — (peak velocity)/(amplitude) = c/(settling time) — emerges naturally from the anharmonic potential. Does NOT emerge from the linear model.

### Quantitative Fit (X-ray microbeam, 43 speakers, 159 recordings)
- Nonlinear system produces lower objective function values (better fits) than linear system
- Mean proportional time to peak velocity across all profiles: 0.49 ± 0.07
- Nonlinear fits capture velocity profile shapes more accurately, especially for large-amplitude movements

### Isochronous Speech Task
- Driven nonlinear system (Eq. 21) produces chaotic dynamics when forcing amplitude $\Gamma$ is large enough to push $x$ beyond the basin of attraction
- Phase portraits and Hooke diagrams from the model match those derived from real lip aperture recordings
- N-shaped Hooke diagrams confirm anharmonicity in real speech data

## Limitations
- Model is for intragestural dynamics only — does not address intergestural coordination
- Parameters $k$ and $d$ must be estimated per movement (no predictive rules given)
- Fitting uses simplex search which may find local minima
- Validation limited to tongue dorsum raising/lowering; other articulators not tested
- The cubic nonlinearity ($dx^3$) is the simplest correction; higher-order terms could be added but are argued to be inessential

## Testable Properties
- Proportional time to peak velocity must be in range [0.36, 0.52] for the nonlinear model (vs. 0.20 for linear)
- Peak velocity must saturate (not grow linearly) with increasing amplitude
- The ratio (peak velocity)/(amplitude × settling time) must be approximately constant across movements of different amplitudes
- For $d = 0$, the nonlinear model must reduce exactly to the linear model
- Basin of attraction boundary: $|x| < \sqrt{k/d}$
- Hooke diagrams of real speech movements should show N-shaped curves (not straight lines)

## Relevance to Project
This paper provides the theoretical foundation for **how articulatory gestures evolve over time** — which directly determines formant transition trajectories in Klatt synthesis. The key insight for Qlatt:

1. **Formant transitions are NOT linear interpolations**: The nonlinear dynamics predict that formant movements toward targets should show near-symmetric velocity profiles with soft saturation at large excursions. This means formant tracks should use sigmoid-like trajectories rather than linear ramps.

2. **The "equation of constraint"** (peak velocity / amplitude = c / duration) provides a principled rule for relating transition speed to transition extent and segment duration — directly applicable to formant transition rule design.

3. **Step activation is sufficient**: Contrary to proposals requiring smooth activation ramps, the nonlinear model works with simple on/off gestural activation. This simplifies the gestural score for synthesis.

4. **Coarticulation and overlap**: The paper explicitly notes that intergestural coordination (how gestures overlap) is outside its scope, but the intragestural dynamics it defines are the building blocks for models like Saltzman_1989 that Qlatt already references.

## Open Questions
- [ ] How do $k$ and $d$ values vary across different articulators and phoneme classes?
- [ ] Can the nonlinear model be used to derive formant transition shapes directly?
- [ ] What is the relationship between the nonlinearity parameter $d$ and speaking rate or stress?
- [ ] How does this interact with the gestural overlap/blending model of Saltzman & Munhall (1989)?

## Related Work Worth Reading
- Browman & Goldstein (1990) — Gestural specification using dynamically-defined articulatory structures
- Saltzman & Munhall (1989) — Task-dynamic model (the standard model this paper revises)
- Byrd & Saltzman (1998, 2003) — Intragestural dynamics at prosodic boundaries
- Fowler (1980) — Coarticulation and intrinsic timing theory
- Kröger et al. (1995) — Continuous activation function proposal
- Tilsen (2009, 2015) — Nonstationarity in articulatory timing

## Collection Cross-References

### Already in Collection
- [[Saltzman_1989_DynamicalGesturalPatterning]] — This is THE paper being revised/extended. Sorensen & Gafos keep the same framework but replace the harmonic potential with an anharmonic one.
- [[Fant_1960_AcousticTheorySpeechProduction]] — Cited for acoustic theory context
- [[Stevens_2000_AcousticPhonetics]] — Cited for acoustic theory context
- [[Sering_2020_AnticipatoryCoarticulation]] — Uses the same task-dynamic framework for coarticulation modeling

### Now in Collection
- **Fowler (1980)** — [[Fowler_1980_CoarticulationTheoriesExtrinsicTiming]] — theoretical motivation for intrinsic timing and coordinative structures

### New Leads (Not Yet in Collection)
- Browman & Goldstein (1990) — "Gestural specification using dynamically-defined articulatory structures" — foundational for gestural phonology
- Byrd & Saltzman (1998) — "Intragestural dynamics of multiple prosodic boundaries" — directly relevant for prosodic lengthening
- Byrd & Saltzman (2003) — "The elastic phrase" — boundary-adjacent lengthening dynamics
- Kröger et al. (1995) — Continuous activation function (the nonautonomous alternative this paper argues against)

### Supersedes or Recontextualizes
- [[Saltzman_1989_DynamicalGesturalPatterning]] — This paper proposes a revision to the core dynamical law. The linear harmonic oscillator of Saltzman & Munhall is replaced with a nonlinear anharmonic oscillator. The gestural score concept and blending equations remain unchanged.
