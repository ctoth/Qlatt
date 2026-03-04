# Iskarous & Pouplier (2022) — Implementation Notes

## Paper Identity
- **Title**: As time goes by: A critical appraisal of space and time in Articulatory Phonology in the 21st century
- **Authors**: Khalil Iskarous (USC), Marianne Pouplier (LMU Munich)
- **Keywords**: Articulatory Phonology, Task Dynamics, dynamical systems, π-gesture, syllable, prosody, planning
- **Type**: Review/theoretical paper (not empirical with new data)

## Overview

This is a comprehensive review of Articulatory Phonology (AP) and Task Dynamics (TD) as of the early 2020s. It covers three main areas: (1) how spatial goals and contrast are modeled via dynamical systems, (2) how timing is organized through coupled oscillators and prosodic gestures, and (3) how speech planning emerges from dynamic field theory. The paper also argues for extending AP toward "Acoustic Phonology" — better integrating articulation-acoustics mappings.

## Core Equations and Models

### 1. Task Dynamics Equation (Central to AP)
The fundamental gesture equation (critically damped second-order linear system):

```
x_tt + 2bx_t + k(x - x_0) = 0
```

Where:
- `x` = tract variable (e.g., lip aperture LA, tongue tip constriction degree TTCD)
- `x_0` = gestural target
- `k` = stiffness (controls speed of approach to target)
- `b` = damping coefficient (set for critical damping: b = √k)
- First-order simplification: `x_t = -k(x - x_0)` (exponential approach)

**Linguistic effects of parameters:**
- **Target (x_0)**: Determines place/degree of constriction → phonemic contrast
- **Stiffness (k)**: Higher k → faster movement → shorter duration; lower k → slower → longer duration
- **Initial condition**: Starting position affects trajectory shape

### 2. Synergy (Articulator Weighting)
Mapping from task variables to articulators via weighted Jacobian:

```
LA_t = w^{LA_UL} · UL_t + w^{LA_LL} · LL_t + w^{LA_JW} · JW_t
```

Where `w` = articulatory weights. This allows different articulators to contribute differently to the same task variable. Weights can be language-specific.

### 3. Nonlinear Extension (Sorensen & Gafos 2016)
Adds negative quartic term to potential:

```
V(x) = ½k(x - x_0)² - ¼c(x - x_0)⁴
```

Produces:
- Near-symmetric velocity profiles (real speech kinematics)
- Nonlinear amplitude-velocity covariation
- Inverse peak-velocity/amplitude ratio vs duration relationship
- Sigmoid-like trajectories with soft velocity saturation

### 4. Gestural Blending
When gestures overlap, targets blend with weighted averaging:
- Same tract variable: weighted average of targets
- Different tract variables: independent (no blending)
- Blending weights are language-specific (explains cross-language coarticulation differences)

### 5. Coupled Oscillator Model (Syllable Timing)
Planning oscillators (one per gesture) are coupled to establish temporal coordination:

- **CV coupling**: In-phase (0°) — consonant and vowel gestures start together
- **CC coupling in onset**: Anti-phase (180°) — onset consonants alternate
- **C-center effect**: Multiple onset consonants shift to maintain center alignment with vowel
- Coupling equations involve sine of phase difference: `φ_dot = ω + Σ a_ij sin(φ_j - φ_i - θ_ij)`

### 6. π-gesture (Prosodic Boundary Lengthening)
The π-gesture (Byrd & Saltzman 2003) is a time-warping gesture that:
- Slows the clock of nearby constriction gestures at prosodic boundaries
- Operates by modulating the time variable itself (not stiffness or target)
- Activation function is bell-shaped (Gaussian-like)
- Strength proportional to prosodic boundary strength
- Creates boundary-adjacent lengthening that decays with distance from boundary

### 7. μ-gestures (Prominence and Boundary Modulation)
Generalization of π-gesture (Saltzman et al. 2008):
- Operate at the planning oscillator level, not directly on constriction gestures
- Can modulate both timing (clock slowing for boundaries) and spatial extent (hyperarticulation for prominence)
- Boundary μ-gestures: slow planning oscillators → longer durations
- Prominence μ-gestures: increase spatial magnitude → larger/clearer articulations

### 8. Dynamic Field Theory for Planning (Roon & Gafos 2016)
Speech planning modeled as activation fields over gestural representations:
- Competitive inhibition between alternative gestures
- Cooperative excitation between compatible gestures
- Self-sustaining activation for gesture selection
- Explains serial ordering, speech errors, and phonological processes

## Relevance to Qlatt/Formant Synthesis

### Direct Applications

1. **Formant Transition Shapes**: The task dynamics equation predicts that formant transitions should follow critically damped approach curves toward targets, not linear interpolation. The nonlinear extension (Sorensen & Gafos) suggests sigmoid-like transitions with near-symmetric velocity profiles.

2. **Coarticulation Model**: Gestural blending provides a principled framework for how adjacent segment targets should be averaged. The blending weights concept maps to the DAC (Degree of Articulatory Constraint) model already in the collection (Recasens 1997).

3. **Phrase-Final Lengthening**: The π-gesture model explains why segments near prosodic boundaries lengthen — the "clock" slows down. For Qlatt's duration rules, this validates multiplicative lengthening that decreases with distance from the boundary.

4. **Stiffness = Duration**: The stiffness parameter directly relates to segment duration. Higher stiffness (faster approach) = shorter segments. This maps to Klatt's duration rules where consonant intrinsic durations vary by manner class.

5. **Prominence Effects**: μ-gestures predict that stressed/accented syllables have both longer duration AND more extreme formant targets (hyperarticulation), not just one or the other.

### Indirect/Theoretical Value

6. **C-center Effect**: Validates that onset consonant clusters should be temporally organized around a center point relative to the vowel, not simply concatenated left-to-right.

7. **Anticipatory Coarticulation**: The coupled oscillator model explains why upcoming vowels affect current consonant formants — the vowel gesture is already active (in-phase coupling).

8. **Acoustic Phonology Gap**: The authors explicitly note that AP lacks a strong articulation-to-acoustics mapping. This is exactly what Qlatt's formant synthesis addresses — converting articulatory descriptions to acoustic parameters.

## Key Figures

- **Figure 1** (p.5): Comparison of real /ap/ kinematics with linear 2nd-order, cubic nonlinear, and time-varying stiffness models
- **Figure 2** (p.12): Coupled oscillator model of syllable structure showing c-center effect
- **Figure 3** (p.18): π-gesture schematic showing temporal warping of constriction gestures at boundaries
- **Figure A2** (p.31): Linguistic effects of initial condition, target, and stiffness on trajectories
- **Figure A3** (p.32): Comparison of real LA kinematics with first-order and second-order models
- **Figure B1** (p.34): Limit cycle oscillator behavior — amplitude stability and phase resetting

## Cross-References to Collection

- **Saltzman_1989_DynamicalGesturalPatterning**: The foundational task dynamics paper reviewed here
- **Sorensen_Gafos_2016_GestureAutonomousDynamicalSystem**: The nonlinear extension with cubic term
- **Kirkham_2025_DynamicalLawsSpeechGestures**: Empirical validation using SINDy showing under-damped dynamics
- **Recasens_1997_LingualCoarticulationDAC**: DAC model relates to gestural blending weights
- **Ohman_1966_CoarticulationVCV**: Vowel-to-vowel diphthongal gesture model confirmed by AP framework
- **Klatt_1976_SegmentalDuration**: Duration rules relate to stiffness parameter in task dynamics
- **White_2014_ProsodicTimingFunction**: Boundary lengthening effects relate to π-gesture
- **Liberman_Mattingly_1985_MotorTheory**: Motor theory validated by AP's gesture-based phonology
- **Sering_2020_AnticipatoryCoarticulation**: Neural network coarticulation maps to AP gestural overlap

### Conceptual Links (not citation-based)
- **Hertz_1991_StreamsPhonesTransitions** — Hertz's observation that only steady states lengthen phrase-finally while transitions remain durationally stable maps to AP's π-gesture mechanism: prosodic clock-slowing at boundaries affects low-stiffness gestures (steady states) but high-stiffness gestures (transitions) resist stretching. Hertz provides the empirical data; AP provides the dynamical mechanism.

## Key Terminology

| AP Term | Qlatt Equivalent |
|---------|-----------------|
| Tract variable | Formant parameter (F1, F2, etc.) |
| Gestural target | Formant target value |
| Stiffness | Transition rate / segment duration |
| Gestural overlap | Coarticulation window |
| Blending | Formant interpolation weights |
| π-gesture | Phrase-final lengthening multiplier |
| μ-gesture | Stress/accent hyperarticulation |
| Planning oscillator | Syllable timing clock |

## Limitations for Synthesis

- This paper is primarily theoretical — no new acoustic measurements or synthesis parameters
- AP framework operates in articulatory space, not acoustic space (the "Acoustic Phonology" gap)
- The equations describe articulatory trajectories, not formant trajectories directly
- Converting task dynamics to Klatt parameters requires an articulatory-to-acoustic mapping (like Stevens 1991 HL parameters)

---

**See also:** Browman_Goldstein_1992_ArticulatoryPhonologyOverview - the foundational 1992 overview paper that this 2022 appraisal extends and critically evaluates; provides the original tract variable taxonomy, gestural score notation, and overlap-based accounts of coarticulation and allophony
