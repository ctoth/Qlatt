# Glottal Flow: Models and Interaction

**Authors:** Gunnar Fant
**Year:** 1986
**Venue:** Journal of Phonetics, 14, 393-399
**DOI/URL:** 0095-4470/86/030393

## One-Sentence Summary
This paper presents the LF (Liljencrants-Fant) four-parameter model for glottal flow derivative and analyzes source-filter interaction effects that cause the actual glottal flow to deviate from the idealized glottal area function.

## Problem Addressed
Parametric voice source models don't account for how supraglottal pressure variations (especially F1 resonance) affect glottal flow shape, causing pulse skewing, ripple, and other interaction phenomena that are observable in real speech but absent from simple models.

## Key Contributions
- Introduces the **LF four-parameter model** of glottal flow derivative (building on Fant 1979 and Ananthapadmanabha 1984)
- Documents **source-filter interaction phenomena**: pulse skewing, double-peak flow derivative, superposition ripple
- Shows that **F1 close to F0** minimizes air consumption (supporting Rothenberg 1985)
- Explains spectral roll-off in terms of the return time constant $t_a$

## Methodology
Computational simulation using a one-formant vocal tract load model, comparing glottal area functions with resulting glottal flow under various conditions (leaky vs non-leaky phonation, varying F0/F1 ratios).

## Key Equations

### LF Model - Opening Phase (flow derivative)
$$
E(t) = E_0 e^{\alpha t} \sin(\omega_g t)
$$
Where:
- $E(t) = dU_g(t)/dt$ = glottal flow derivative
- $E_0$ = amplitude scaling factor
- $\alpha$ = exponential growth parameter
- $\omega_g = 2\pi F_g$ = angular frequency parameter
- Valid for $0 \leq t \leq t_e$ (up to discontinuity point)

### LF Model - Return Phase (after discontinuity)
$$
E(t) = \frac{-E_0}{\varepsilon t_a} \left[ e^{-\varepsilon(t-t_e)} - e^{-\varepsilon(t_c-t_e)} \right]
$$
Where:
- $t_e$ = time of maximum discontinuity (negative peak)
- $t_c$ = closure time (start of next period, $t_c = T_0 = 1/F_0$)
- $t_a$ = return time constant (fourth parameter)
- $\varepsilon$ = decay rate constant

### Return Phase Spectral Effect
$$
F_a = (2\pi t_a)^{-1}
$$
Where $F_a$ is the cutoff frequency after which spectrum falls off at additional 6 dB/octave.

### Spectral Roll-off Formula
$$
\Delta L = -10 \log_{10}[1 + (2\pi t_a f)^2]
$$

## Parameters

| Name | Symbol | Units | Typical Value | Range | Notes |
|------|--------|-------|---------------|-------|-------|
| Amplitude factor | $E_0$ | - | - | - | Scales flow derivative amplitude |
| Frequency parameter | $F_g$ | Hz | - | - | $F_g = \omega_g / 2\pi$ |
| Exponential growth | $\alpha$ | 1/s | - | - | Controls opening phase shape |
| Return time constant | $t_a$ | ms | 0.15-0.6 | 0-∞ | Controls spectral tilt; $t_a=0$ is ideal closure |
| Discontinuity time | $t_e$ | ms | - | - | Time of max negative derivative |
| Closure time | $t_c$ | ms | $T_0$ | - | Period duration |
| First formant | F1 | Hz | 500-750 | - | Key interaction driver |
| F1 bandwidth | B1 | Hz | 50-143 | 50-150 | Increases with leakage |
| Vocal tract inductance | L | mH | 5.0 | - | Input impedance parameter |
| Subglottal pressure | P | cm H₂O | 8 | - | Driving pressure |
| Peak glottal area | $A_{g0}$ | cm² | 0.01-0.3 | - | Maximum opening |

## Implementation Details

### Four Wave-Shape Parameters
The LF model requires exactly four parameters to define a pulse: $t_p$ (time of positive peak), $t_e$ (discontinuity time), $t_a$ (return constant), and $E_e$ (excitation amplitude at discontinuity).

### Spectral Tilt Control
- $t_a = 0$: Ideal abrupt closure, maximum high-frequency content
- $t_a = 0.15$ ms → $F_a = 1060$ Hz: Moderate spectral tilt
- $t_a = 0.6$ ms → $F_a = 265$ Hz: Breathy phonation, steep roll-off
- Even small $t_a$ values have noticeable spectral effect

### Dynamic Leakage
When discontinuity point is "uphill" from fully closed phase, this creates "dynamic leakage" typical of breathy phonation. The glottal flow correlate is incomplete closure.

### Source-Filter Interaction Effects
1. **Pulse skewing**: Flow pulse shifts rightward compared to area function
2. **Superimposed ripple**: F1 oscillation from previous excitations
3. **Double peak**: Flow derivative shows two negative peaks when F1 interaction is strong
4. **Amplitude perturbations**: Successive pulses differ in shape/amplitude even at constant F0

### F0/F1 Interaction
- **F1 ≈ F0**: Minimizes air consumption (soprano singing optimization)
- **F1 ≈ 1.6×F0**: Increases air consumption
- **F1 ≈ 2×F0**: Secondary optimization point (less pronounced)

### Leaky Phonation Effects
Adding constant glottal shunt (1/5 peak area):
- Increases B1 from 50 Hz to 143 Hz
- Creates superimposed F2 oscillation in closed phase
- Spectral roll-off rate unchanged, but low-frequency emphasis increases

## Figures of Interest
- **Fig 1 (p.394):** LF-model waveform showing $t_p$, $t_e$, $t_a$, $E_e$ parameters
- **Fig 2 (p.394):** Effect of $t_a$ on flow shape and spectrum (0.15 ms vs 0.6 ms)
- **Fig 3 (p.395):** Real inverse-filtered glottal flow showing double-peak structure
- **Fig 4 (p.396):** Simulation of flow derivative, supraglottal pressure, and spectrum
- **Fig 5 (p.397):** Leaky phonation simulation with 0.05 cm² added area
- **Fig 6 (p.397):** Soprano voice simulation (F0=476 Hz, F1=750 Hz, F1/F0=1.58)
- **Fig 7 (p.398):** Lower F0/F1 ratio showing increased air consumption

## Results Summary
- The four-parameter LF model adequately captures glottal flow derivative shape
- Source-filter interaction is primarily driven by F1 component of supraglottal pressure
- Interaction effects are more severe at high F0 due to accumulated pressure from previous periods
- Glottal friction contributes minimally to flow waveform (0-2 dB effect)
- Glottal inductance effect is also small

## Limitations
- Model is parametric and doesn't capture all interaction physics
- Simulations use simplified one-formant vocal tract load
- Return phase is approximated rather than physically modeled
- No systematic treatment of combined mechanical-aerodynamic interactions

## Relevance to Project
**High relevance for Qlatt's LF source implementation:**
- The LF model equations are what `crates/lf-source/` implements
- $t_a$ parameter directly controls spectral tilt / breathiness
- Understanding that $F_a = 1/(2\pi t_a)$ helps set appropriate $t_a$ values
- Interaction effects explain why synthesized voice may sound different from natural speech
- The double-peak phenomenon is NOT a bug if inverse filtering shows it in real speech

## Open Questions
- [ ] Does Qlatt's LF source correctly implement the return phase equation?
- [ ] How should $t_a$ be parameterized for different voice qualities?
- [ ] Should interaction effects be modeled, or is the parametric LF model sufficient?

## Related Work Worth Reading
- **Fant, Liljencrants & Lin (1985)** - Full LF model specification (the primary source)
- **Fant, Lin & Gobl (1985)** - Detailed interaction analysis
- **Ananthapadmanabha (1984)** - Five-parameter model predecessor
- **Rothenberg (1985)** - F0/F1 coincidence theory for soprano singing
- **Fant (1979)** - Earlier glottal source model (baseline)
