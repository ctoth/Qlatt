# Bifurcations and Limit Cycles in a Model for a Vocal Fold Oscillator

**Authors:** Jorge C. Lucero
**Year:** 2005
**Venue:** Communications in Mathematical Sciences, 3(4), 517-529
**DOI:** 10.4310/CMS.2005.v3.n4.a3

## One-Sentence Summary

Provides a complete bifurcation analysis of a two-mass vocal fold oscillator model, characterizing the Hopf bifurcation type (sub/supercritical) and oscillation hysteresis as functions of subglottal pressure and tissue damping.

## Problem Addressed

The Titze (1988) mucosal wave model for vocal fold oscillation produces realistic self-sustained oscillation, but its nonlinear dynamics -- particularly the nature of oscillation onset/offset and the conditions for hysteresis -- had not been fully analyzed. Understanding these bifurcation properties is essential for modeling phonation onset, register transitions, and voice quality.

## Key Contributions

- Derives the Lyapunov number (first focus quantity) for the vocal fold oscillator, determining whether the Hopf bifurcation at phonation onset is supercritical or subcritical
- Shows that for physiologically typical parameters, the bifurcation is always supercritical (soft onset), but subcritical (hard onset with hysteresis) behavior is possible for low tissue damping
- Introduces even-powered polynomial nonlinear damping to model amplitude-limiting effects (glottal aerodynamics, tissue viscoelasticity, vocal fold collision)
- Demonstrates the Appleton-van der Pol oscillation hysteresis phenomenon in vocal fold oscillation

## Methodology

The analysis uses the Titze (1988) mucosal wave model reduced to a single-degree-of-freedom oscillator with nonlinear damping. The equilibrium is analyzed for Hopf bifurcation using the Lyapunov number formula for planar systems. Limit cycles are computed numerically to map bifurcation diagrams as functions of the control parameter (subglottal pressure ratio).

## Key Equations

### Vocal Fold Displacement (Mucosal Wave)

$$
\xi(y, t) = x(t) - \frac{y}{c} \dot{x}(t)
$$

Where: $x(t)$ is medial surface displacement, $y$ is vertical coordinate along glottal height, $c$ is mucosal wave velocity.

### Glottal Area

$$
a(y, t) = a_0 + 2L\xi(y, t)
$$

Where: $a_0$ is prephonatory glottal half-width area, $L$ is vocal fold length.

### Equation of Motion (Dimensionless)

$$
\ddot{u} + (1 + \eta u^2)\left[\delta - \frac{\gamma}{(1 + u)^2}\right]\dot{u} + \alpha^2 u = 0
$$

Where:
- $u = x/x_0$ (dimensionless displacement, $x_0 = a_0 / 2L$)
- $\alpha = \omega_0 / \omega$ (ratio of natural frequency to a reference frequency)
- $\delta = B / M\omega$ (dimensionless damping)
- $\gamma = \rho c P_s T / (3 K T x_0^2)$ (dimensionless subglottal pressure parameter)
- $\eta$ = nonlinear damping coefficient

### Oscillation Threshold (Hopf Bifurcation)

At equilibrium $u = 0$, oscillation onset occurs when:

$$
\gamma_H = \delta
$$

i.e., when the aerodynamic energy input equals the dissipation.

### Lyapunov Number (Determines Bifurcation Type)

For the system rewritten as:
$$
\dot{u} = v
$$
$$
\dot{v} = -\alpha^2 u - (1 + \eta u^2)\left[\delta - \frac{\gamma}{(1+u)^2}\right] v
$$

At the Hopf bifurcation ($\gamma = \delta$), the Lyapunov number is:

$$
\sigma = \frac{-3\pi}{2\alpha} \left[ \eta \delta^2 - \frac{\delta(5\delta + 3)}{(3 + \delta^2)} \right]
$$

- $\sigma < 0$: **supercritical** Hopf bifurcation (soft onset, stable limit cycle born at threshold)
- $\sigma > 0$: **subcritical** Hopf bifurcation (hard onset, unstable limit cycle, hysteresis possible)

### Critical Condition ($\sigma = 0$)

The bifurcation switches type when:

$$
\eta = \frac{5\delta + 3}{\delta(3 + \delta^2)}
$$

### Extended Nonlinear Damping (for hysteresis)

To model both sub- and supercritical behavior, the nonlinear damping is extended:

$$
(1 + \eta_1 u^2 + \eta_2 u^4)[\delta - \gamma/(1+u)^2] \dot{u}
$$

With $\eta_1 = 0$ (removed quadratic term) and varying $\eta_2$ (quartic term), the model produces:
- Subcritical Hopf bifurcation at onset
- Fold bifurcation between limit cycles
- Oscillation hysteresis between onset and offset pressures

## Parameters

| Name | Symbol | Units | Default | Range | Notes |
|------|--------|-------|---------|-------|-------|
| Dimensionless frequency ratio | $\alpha$ | - | 0.32 | - | $\omega_0/\omega$, typical value from Titze 1988 |
| Dimensionless damping | $\delta$ | - | 0.97 | - | $B/M\omega$, typical value from Titze 1988 |
| Subglottal pressure param | $\gamma$ | - | varies | 0 to ~1 | Control parameter; oscillation at $\gamma = \delta$ |
| Nonlinear damping (quadratic) | $\eta$ | - | 100 | 0-300 | Must exceed critical value for supercritical |
| Nonlinear damping (quartic) | $\eta_2$ | - | varies | 10-300 | Used in extended model for hysteresis |
| Air density | $\rho$ | kg/m^3 | 1.15 | - | Standard value |
| Vocal fold length | $L$ | cm | - | - | Not specified numerically |
| Mucosal wave velocity | $c$ | m/s | - | - | Not specified numerically |
| Vocal fold thickness | $T$ | cm | - | - | Glottal height |

## Implementation Details

### Phase Portrait Structure
- Equilibrium at origin $(u, v) = (0, 0)$
- Singular point at $(u, v) = (-1, 0)$ where glottis is fully closed
- Region below the singular point trajectory is outside model validity
- Limit cycles exist in the region between origin and singular point

### Numerical Computation
- Limit cycles computed by numerical integration of the ODE system
- Phase portraits show stable/unstable limit cycles coexisting for subcritical cases
- Bifurcation diagrams plot maximum amplitude of $u$ vs. $\gamma$

### Key Implementation Insight
The nonlinear damping coefficient $\eta$ determines voice quality characteristics:
- Large $\eta$ (supercritical): smooth, gradual onset -- normal phonation
- Small $\eta$ (subcritical): abrupt onset with hysteresis -- possible register break mechanism

## Figures of Interest

- **Fig 2.1 (page 3):** Vocal fold model schematic showing mucosal wave geometry
- **Fig 3.1 (page 6):** Phase portrait showing limit cycle and trajectories for typical parameters
- **Fig 5.1 (page 8):** Limit cycle amplitude vs. $\gamma$ showing supercritical bifurcation
- **Fig 5.2 (page 8):** Amplitude vs. $\gamma$ for various $\beta$ values -- transition from super to subcritical
- **Fig 5.4 (page 9):** Coexisting stable and unstable limit cycles (subcritical case)
- **Fig 6.1 (page 11):** Extended model bifurcation diagrams showing hysteresis
- **Fig 6.2 (page 12):** Hysteresis cycle diagram (onset at $\gamma_H$, offset at CF)

## Results Summary

- For physiologically realistic parameters ($\alpha = 0.32$, $\delta = 0.97$), the Hopf bifurcation is **supercritical** for all tested values of nonlinear damping $\eta$
- Subcritical bifurcation (with hysteresis) only appears for small $\beta$ (low nonlinear damping) combined with low $\delta$ (low tissue damping)
- The extended model with quartic damping ($\eta_2 u^4$) can produce oscillation hysteresis: onset occurs at threshold $\gamma_H$ but offset requires lower pressure (at the cyclic fold bifurcation CF)
- Hysteresis range increases with decreasing $\eta_2$

## Limitations

- Single-degree-of-freedom model -- cannot capture two-mass effects or vertical phase differences beyond the mucosal wave approximation
- Nonlinear damping is phenomenological, not derived from first principles of aerodynamics or tissue mechanics
- Analysis limited to specific parameter values ($\alpha = 0.32$, $\delta = 0.97$); other values might yield different bifurcation structure
- Does not model subglottal or supraglottal acoustic coupling
- Mucosal wave approximation (linear Taylor expansion) limits validity to small amplitudes

## Testable Properties

- **Hopf bifurcation threshold:** Oscillation onset must occur at $\gamma = \delta$ (aerodynamic energy equals dissipation)
- **Lyapunov number sign:** For $\eta > (5\delta + 3)/[\delta(3 + \delta^2)]$, the bifurcation must be supercritical ($\sigma < 0$)
- **Supercritical behavior:** When $\sigma < 0$, oscillation amplitude must grow continuously from zero at threshold
- **Subcritical behavior:** When $\sigma > 0$, there must exist an unstable limit cycle below the stable one, and oscillation onset must be discontinuous (jump to finite amplitude)
- **Hysteresis:** In the extended model with subcritical Hopf, onset pressure must exceed offset pressure
- **Singular point:** The point $u = -1$ (complete glottal closure) must be a singular point of the system
- **Amplitude bound:** Limit cycle maximum displacement $u$ must satisfy $u > -1$ (glottis cannot have negative area)

## Relevance to Project

This paper provides the mathematical foundation for modeling phonation onset/offset behavior in the LF glottal source. The bifurcation analysis explains:
- Why phonation onset can be "soft" (breathy attack) or "hard" (glottal attack) -- supercritical vs. subcritical Hopf bifurcation
- The hysteresis between phonation onset and offset pressures, relevant to modeling phrase-final devoicing and register transitions
- How nonlinear damping parameters control voice quality characteristics

For the Qlatt synthesizer, this could inform:
- More physically motivated control of the LF source onset/offset behavior
- Modeling of phonation threshold pressure and its relationship to F0
- Register transition modeling (chest-to-falsetto involves bifurcation)

## Open Questions

- [ ] How do the bifurcation parameters map to the LF model parameters (Rd, Ra, Rk)?
- [ ] Can the hysteresis model improve phrase-boundary voicing transitions?
- [ ] What is the relationship between $\eta$ and measurable voice quality parameters (H1-H2, HNR)?
- [ ] Does the two-mass model (Ishizaka-Flanagan) show the same bifurcation structure?

## Related Work Worth Reading

- Titze I.R. 1988 "The physics of small-amplitude oscillation of the vocal folds" (the base model analyzed here)
- Lucero J.C. 1999 "A theoretical study of the hysteresis phenomenon at vocal fold oscillation onset-offset" (precursor showing hysteresis)
- Herzel H. and Knudsen C. 1995 "Bifurcation in a vocal fold model" (bifurcation analysis of a different model)
- Trevisan M.A., Eguia M.C. and Mindlin G.B. -- nonlinear dynamics of speech
- Ishizaka K. and Flanagan J.L. 1972 -- two-mass vocal fold model (the classic alternative)

## Collection Cross-References

### Already in Collection
- **Lucero_1999_BifurcationsVoiceOnsetOffset** — cited as [10]; the 1999 paper used numerical simulation of the Ishizaka-Flanagan two-mass model to demonstrate oscillation hysteresis. The 2005 paper provides the analytical proof (Lyapunov number derivation) using the simpler mucosal wave model and shows that for typical parameters the bifurcation is actually supercritical, contradicting the 1999 paper's finding of subcritical onset. The extended model with quartic damping reconciles this by recovering subcritical behavior.

### Cited By (in Collection)
- (none found)

### New Leads (Not Yet in Collection)
- Titze I.R. (1988) — "The physics of small-amplitude oscillation of the vocal folds" — the base model analyzed; essential for understanding phonation threshold pressure
- Herzel H. and Knudsen C. (1995) — "Bifurcation in a vocal fold model" — bifurcation analysis of a different vocal fold model, complements both Lucero and Steinecke

### Supersedes or Recontextualizes
- **Lucero_1999_BifurcationsVoiceOnsetOffset** — The 2005 paper partially corrects the 1999 analysis: the 1999 paper concluded onset is subcritical (hard onset with jump), but the 2005 analytical derivation shows that for physiologically typical parameters ($\alpha = 0.32$, $\delta = 0.97$) the Hopf bifurcation is supercritical (soft onset). The subcritical behavior requires either low tissue damping or the extended quartic damping model. This is a genuine tension: the 1999 numerical results showed subcritical behavior in the two-mass model, while the 2005 analytical results show supercritical in the one-mass mucosal wave model.

### Conceptual Links (not citation-based)
- **Steinecke_1995_BifurcationsVocalFold** — Both papers analyze bifurcations in vocal fold oscillator models, but from different angles: Steinecke analyzes the two-mass model with left-right asymmetry (producing subharmonics, chaos, diplophonia), while Lucero analyzes the single-DOF mucosal wave model focusing on onset/offset hysteresis. Together they map the bifurcation landscape of vocal fold dynamics: Steinecke covers pathological asymmetric vibration, Lucero covers normal phonation onset/offset.
- **Hanson_2001_ModelsPhonation** — Hanson's models of nonmodal phonation describe the acoustic consequences (spectral tilt, noise, bandwidth) of different glottal configurations, while Lucero's bifurcation analysis describes the dynamical mechanisms that produce those configurations. The connection between Lucero's nonlinear damping parameter $\eta$ and Hanson's spectral tilt measures (H1*-A3*) is an open question.
- **Fant_1985_LFModelGlottalFlow** — The LF model parameterizes glottal flow waveform shape, while Lucero's model explains how the underlying vocal fold dynamics produce different waveform shapes through bifurcation. The return phase parameter $t_a$ in LF relates to the limit cycle amplitude and shape in Lucero's model.
- **Herzel_1994_VocalDisordersNonlinearDynamics** — Herzel catalogs the full range of bifurcation phenomena (period-doubling, tori, chaos) observed in pathological voice recordings from 95 dysphonic patients, providing the empirical acoustic signatures that Lucero's mathematical onset/offset bifurcation framework predicts. Herzel's observation that tiny parameter changes cause abrupt regime transitions maps directly to Lucero's bifurcation diagrams; together they connect mathematical theory to clinical observation.
