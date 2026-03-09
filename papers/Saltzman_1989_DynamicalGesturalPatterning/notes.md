# Saltzman & Munhall 1989 — A Dynamical Approach to Gestural Patterning in Speech Production

**Citation**: Saltzman, E. L., & Munhall, K. G. (1989). A dynamical approach to gestural patterning in speech production. *Ecological Psychology*, 1(4), 333–382. DOI: 10.1207/s15326969eco0104_2

---

## Overview

This paper presents the **task-dynamic model** of speech production, a computational framework where speech gestures are modeled as dynamical systems (point attractors in tract-variable space) that are temporally overlapped ("coproduced") according to a **gestural score**. The model has two levels:

1. **Intergestural level** — activation coordinates that gate gestures on/off over time
2. **Interarticulatory level** — tract-variable and model-articulator dynamics that produce actual movement

The central claim: coarticulation arises naturally from the temporal overlap of context-independent gestural primitives, without requiring context-dependent rules.

---

## Key Concepts

### Gestural Primitives

A gesture is a **context-independent** set of dynamical parameters associated with a tract-variable point attractor:
- **Target position** (z₀) — equilibrium position of the attractor
- **Stiffness** (k) — spring constant determining movement speed
- **Damping** (b) — critically damped (b² = 4mk for second-order; b/m = 2√(k/m))
- **Mass-normalized parameters**: ω₀² = k/m (natural frequency), β = b/(2m) (damping ratio)

Each gesture is **identified with a specific tract variable** (e.g., lip aperture, tongue-tip constriction degree).

### Tract Variables and Model Articulators

**Tract variables** (abstract vocal-tract coordinates):

| Tract Variable | Abbreviation | Description |
|---|---|---|
| Lip protrusion | LP | Forward extension of lips |
| Lip aperture | LA | Vertical distance between lips |
| Tongue-tip constriction location | TTCL | Where tongue tip constricts |
| Tongue-tip constriction degree | TTCD | How narrow tongue-tip constriction is |
| Tongue-dorsum constriction location | TDCL | Where tongue body constricts |
| Tongue-dorsum constriction degree | TDCD | How narrow tongue-body constriction is |
| Velic aperture | VEL | Velopharyngeal port opening |
| Glottal aperture | GLO | Glottal opening degree |
| Lower tooth height | LTH | Jaw opening (vertical) |

**Model articulators** (physical articulators, each 1–2 DOF):
- Upper lip (ULy)
- Lower lip (LLx, LLy)
- Jaw (JWx, JWy) — contributes to LP, LA, TTCD, TDCD, LTH
- Tongue tip (TTx, TTy)
- Tongue dorsum (TDx, TDy)
- Velum (VEL)
- Glottis (GLO)

The mapping from articulators to tract variables is **many-to-one**: multiple articulators contribute to each tract variable via a weighted Jacobian matrix J.

### Gestural Score

The gestural score is a **time × gesture** matrix specifying when each gesture is active. In the simplest form, activation is binary (0 or 1) with rectangular on/off pulses. The score for a word like /pʌb/ includes:
- Wide pharyngeal gesture (tongue body for /ʌ/)
- Bilabial closure gesture (lips for /p/)
- Bilabial closure gesture (lips for /b/)
- Glottal opening gesture (for aspiration in /p/)

Temporal overlap of activation intervals produces **coproduction** (coarticulation).

---

## Mathematical Framework

### Tract-Variable Dynamics (Appendix 1, Eq A1)

The tract-variable layer is a second-order damped mass-spring system:

```
z̈ = M⁻¹(-Bż - KΔz)
```

Where:
- z = tract-variable position vector
- M = diagonal mass matrix
- B = diagonal damping matrix
- K = diagonal stiffness matrix
- Δz = (z - z₀) = displacement from target

For a single tract variable: `z̈ = -(b/m)ż - (k/m)(z - z₀)`

With critical damping: b/m = 2√(k/m), the system is a **critically damped point attractor**.

### Parameter Blending (Equations 1a–1d)

When multiple gestures target the same tract variable simultaneously, their parameters blend:

**Damping**: `b̃ᵢᵢ = Σⱼ αᵢⱼ · bᵢⱼ / Σⱼ αᵢⱼ`
**Stiffness**: `k̃ᵢᵢ = Σⱼ αᵢⱼ · kᵢⱼ / Σⱼ αᵢⱼ`
**Target**: `z̃₀ᵢ = Σⱼ αᵢⱼ · z₀ᵢⱼ / Σⱼ αᵢⱼ`

Where αᵢⱼ is the post-blending activation strength of gesture j on tract variable i.

Three blending modes:
1. **Averaging** — weighted mean (default, shown above)
2. **Suppression** — dominant gesture replaces weaker one
3. **Addition** — parameters sum (used for multi-gesture cooperation)

### Post-Blending Activation (Equations 2a–2b)

Raw activation aᵢₖ undergoes competitive dynamics:

```
αᵢₖ = f(aᵢₖ - Σⱼ≠ₖ αᵢⱼ · aᵢⱼ) + βᵢₖ · f(aᵢₖ)
```

Where:
- α = lateral inhibition coefficient (suppresses competing gestures)
- β = gatekeeper coefficient (minimum activation floor)
- f(x) = max(x, 0) — half-wave rectifier

### Transformation Gating (Equations 3a–3b, Appendix 2)

Maps tract-variable dynamics to model-articulator movements via gated weighted pseudoinverse:

```
J*_G = W⁻¹ · J_G^T · (C + [I_m - G_A])⁻¹
```

Where:
- J_G = gated Jacobian (columns zeroed for inactive tract variables)
- W = diagonal weight matrix on articulators
- C = J_G · W⁻¹ · J_G^T (weighted inner product)
- G_A = diagonal gating matrix (1 for active tract variables, 0 for inactive)

The active articulatory acceleration (Appendix 2, Eq A3):
```
φ̈_A = J*_G · (M⁻¹{-B·J·φ̇ - K·Δz(φ)}) - J̇*_G · J · φ̇
```

### Neutral Attractor (Equation 4)

When no gesture drives an articulator, a neutral attractor pulls it toward schwa-like rest position:

```
φ̈_N = G_N · (-B_N · φ̇ - K_N · [φ - φ₀_N])
```

Where:
- G_N = I - G_φ (complement of active articulator gating)
- φ₀_N = neutral articulatory configuration
- B_N, K_N = neutral damping and stiffness (weaker than gestural)

### Total System (Equation 5)

```
φ̈_T = φ̈_A + φ̈_N
```

Total articulatory acceleration = active gestural influence + neutral attractor return.

---

## Coarticulation Mechanism

The model explains coarticulation through **three mechanisms**:

1. **Coproduction** — temporal overlap of gestures in the score means articulators are driven by multiple targets simultaneously; blending produces context-dependent trajectories from context-independent gestures

2. **Articulatory freedom** — when a gesture specifies only some tract variables, uninvolved articulators are free to be "captured" by other concurrent gestures (e.g., tongue body during bilabial closure)

3. **Neutral attractor** — articulators not under active gestural control drift toward neutral position, creating contextual variation in how quickly articulators transition between targets

---

## Intergestural Timing and Cohesion

### Phase Relationships

Gestures within a phonological segment (a "constellation") are hypothesized to have **stable phase relationships** maintained by dynamical coupling:
- In-phase (0°) coupling for synchronous gestures
- Anti-phase (180°) coupling for alternating gestures
- Fixed-offset coupling for sequential gestures

### Speaking Rate Effects

Rate changes manifest as:
1. **Sliding** — activation intervals overlap more at faster rates (primary mechanism)
2. **Shrinking** — individual gesture durations decrease
3. **Truncation** — gestures may not reach their targets before the next onset

The model predicts that faster rates produce more coarticulation (more overlap), matching empirical observations.

### Serial Dynamics (Jordan Network)

For sequencing gestures across words/phrases, the authors propose adapting **Jordan's (1986) connectionist sequential model**:
- Plan layer holds activation patterns for upcoming gestures
- State layer provides feedback about current articulatory state
- Output layer maps to gestural activation coordinates
- The network learns to produce ordered sequences of gestural activations

This is proposed but **not fully implemented** in the 1989 paper.

---

## Dominance Patterns

The model accounts for cross-linguistic phonotactic patterns through **dominance relationships**:

### Oral-Laryngeal Dominance
- Oral gestures (e.g., tongue-tip closure) dominate over laryngeal gestures (e.g., glottal opening)
- Predicts that in fricative+stop clusters, the glottal opening gesture for a voiceless fricative is **truncated** by the following stop closure
- Explains Dutch devoicing patterns: /v/ → [f] before voiceless stops

### Oral-Oral Dominance
- Among oral gestures, more **anterior** constrictions tend to dominate more **posterior** ones
- Predicts asymmetric cluster constraints across languages

---

## Relevance to Qlatt / Klatt Synthesis

### Direct Applicability

1. **Coarticulation rules**: The gestural overlap model provides a principled framework for generating coarticulated formant trajectories. Instead of ad-hoc transition rules, the blending equations (Eqs 1a-d) could drive smooth formant interpolation between phoneme targets.

2. **Timing model**: The gestural score provides a formal structure for the timing of parameter changes in the Klatt synthesizer — when to onset formant transitions, how long closures last, when to begin aspiration, etc.

3. **Speaking rate**: The sliding/shrinking/truncation framework explains how to scale synthesis timing with rate changes — primarily by increasing gestural overlap rather than uniformly compressing durations.

4. **Neutral attractor concept**: The schwa-like rest position that articulators return to when undriven maps directly to the "neutral" formant values in Klatt synthesis — provides principled default targets.

### Tract Variable → Klatt Parameter Mapping

The tract variables defined here don't map 1:1 to Klatt parameters but suggest a higher-level control:

| Tract Variable | Klatt Parameter(s) |
|---|---|
| LA (lip aperture) | F1, A1, mouth output routing |
| LP (lip protrusion) | F2, F3 lowering |
| TTCL/TTCD (tongue tip) | F3, F4, F5 for alveolars/dentals |
| TDCL/TDCD (tongue dorsum) | F1, F2, F3 for vowels/velars |
| VEL (velic aperture) | FNZ, FNP, AN (nasal coupling) |
| GLO (glottal aperture) | AH, AV, OQ (voicing/aspiration) |

### Gestural Score as Track Representation

The gestural score concept maps naturally to Qlatt's track structure:
- Each frame in the track corresponds to a time-slice of the gestural score
- Blended parameter values at each frame = the result of overlapping gesture activations
- The interpreter scheduling system handles the time-series playback

### Limitations for Direct Implementation

1. **Articulatory-to-acoustic mapping**: The paper works in articulatory coordinates; Klatt works in acoustic parameters. An intermediate mapping layer would be needed.

2. **Not all gestures are point attractors**: Fricatives and trills involve limit cycles or turbulent dynamics not captured by the simple mass-spring model.

3. **Computational overhead**: The full Jacobian pseudoinverse computation is expensive for real-time synthesis; simplified lookup tables for articulatory-acoustic mappings may be more practical.

---

## Key Figures

- **Figure 1** (p.335): Articulatory trajectories for /bamib/ showing coarticulation
- **Figure 2** (p.336): Two-level model architecture diagram
- **Figure 3** (p.337): Vocal tract outline with model articulators labeled
- **Figure 4** (p.338): Matrix mapping tract variables to model articulators
- **Figure 6** (p.341): Gestural score for /pʌb/
- **Figure 7** (p.349): Vocal tract shapes from simulated articulator positions
- **Figure 8** (p.350): X-ray pellet data comparison
- **Figure 9** (p.351): Simulation vs. natural speech comparison
- **Figure 10** (p.355): Jordan sequential network architecture
- **Figure 11** (p.362): Stetson's speaking rate data showing gestural overlap

---

## Equations Summary

| Equation | Description | Location |
|---|---|---|
| Eq 1a–1d | Parameter blending (b, k, z₀, w) | p.345 |
| Eq 2a–2b | Post-blending activation with lateral inhibition | p.345 |
| Eq 3a–3b | Gated Jacobian pseudoinverse | p.346 |
| Eq 4 | Neutral attractor dynamics | p.347 |
| Eq 5 | Total driving influences | p.347 |
| Eq A1 | Tract-variable dynamical system | p.377 (Appendix 1) |
| Eq A2a–c | Model-articulator coordinate system | p.378 (Appendix 2) |
| Eq A3 | Active articulatory acceleration | p.379 (Appendix 2) |
| Eq A4 | Augmented form with orthogonal projection | p.379 (Appendix 2) |
| Eq A5a–b | Competitive network activation dynamics | p.380 (Appendix 3) |

---

## Collection Cross-References

### Already in Collection
- [[Ohman_1966_CoarticulationVCV]] — cited for classic VCV coarticulation data; this model explains Ohman's observations through gestural overlap
- [[Fant_1960_AcousticTheorySpeechProduction]] — cited for source-filter theory; provides the acoustic interpretation of the articulatory dynamics modeled here
- [[Klatt_1980_CascadeParallelFormantSynthesizer]] — the target synthesis system; gestural scores could drive Klatt parameter trajectories through an articulatory-to-acoustic mapping
- [[Liberman_Mattingly_1985_MotorTheory]] — cited for motor theory of speech perception; gestural primitives are the "intended gestures" that motor theory posits listeners recover
- [[Recasens_1997_LingualCoarticulationDAC]] — the DAC model of coarticulation resistance offers a complementary approach; DAC quantifies what this model explains through gestural overlap on same vs. different tract variables

### Cited By (in Collection)
- [[Kirkham_2025_DynamicalLawsSpeechGestures]] — tests and extends this model using SINDy on X-ray microbeam data; finds gestures are under-damped ($b \ll 2\sqrt{k}$), not critically damped as assumed here
- [[Sorensen_Gafos_2016_GestureAutonomousDynamicalSystem]] — replaces the linear harmonic oscillator with a nonlinear anharmonic oscillator ($V(x) = kx^2/2 - dx^4/4$), retaining step activation and autonomy
- [[Browman_1989_ArticulatoryGesturesPhonologicalUnits]] — companion paper defining gestures as phonological primitives; cites Saltzman & Kelso (1987) for the formal dynamical model
- [[Browman_Goldstein_1992_ArticulatoryPhonologyOverview]] — extends and elaborates the gestural framework with additional data; lists Saltzman & Munhall (1989) as a foundational new lead
- [[Iskarous_Pouplier_2022_ArticulatoryPhonologyAppraisal]] — comprehensive 21st-century appraisal of AP and task dynamics
- [[Volenec_2015_Coarticulation]] — reviews coarticulation theory including the coproduction/AP framework from this paper
- [[Sproat_Fujimura_1993_AllophonicVariationEnglishL]] — cites this for the gestural timing account of English /l/ allophony
- [[White_2014_ProsodicTimingFunction]] — cites this for task-dynamic timing in the context of prosodic structure
- [[Kaburagi_2007_VocalTractSpectrum]] — cites this for articulatory dynamics

### Conceptual Links (not citation-based)
- [[Sering_2020_AnticipatoryCoarticulation]] — Sering uses a neural network trained on VocalTractLab to model anticipatory coarticulation; the gestural overlap mechanism proposed here is the theoretical basis for the coarticulation patterns Sering's network learns to reproduce. (Strong)
- [[Fowler_2006_CoarticulationGesturePerception]] — Fowler's perceptual evidence for gesture-based coarticulation provides the perceptual validation for the coproduction model proposed here. (Moderate)

### Supersedes or Recontextualizes
- [[Kirkham_2025_DynamicalLawsSpeechGestures]] — Kirkham's data-driven SINDy analysis finds the critical damping assumption is incorrect; actual dynamics are under-damped. This does not invalidate the gestural score framework but revises the core dynamical law.
- [[Sorensen_Gafos_2016_GestureAutonomousDynamicalSystem]] — proposes replacing the linear harmonic oscillator with a nonlinear anharmonic oscillator. The gestural score concept and blending equations remain unchanged.
