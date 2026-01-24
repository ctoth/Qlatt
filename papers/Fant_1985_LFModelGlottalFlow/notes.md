# A Four-Parameter Model of Glottal Flow

**Authors:** Gunnar Fant, Johan Liljencrants, Qi-guang Lin
**Year:** 1985
**Venue:** STL-QPSR (Speech Transmission Laboratory - Quarterly Progress and Status Report), Vol. 26, No. 4, pp. 1-13
**Institution:** KTH (Royal Institute of Technology), Stockholm
**URL:** http://www.speech.kth.se/qpsr

## One-Sentence Summary

The LF-model defines glottal flow derivative using four parameters (t_p, t_e, t_a, E_e) that uniquely determine the pulse shape, enabling synthesis of voice sources from modal to breathy phonation with a single continuous mathematical formulation.

## Problem Addressed

Previous glottal flow models either had discontinuities at the flow peak (F-model, Fant 1979) or did not account for the residual "return phase" after glottal closure - the progressive decay of flow after the main excitation discontinuity. The LF-model addresses both issues with a continuous formulation that handles incomplete closure and breathy phonation.

## Key Contributions

1. **Unified continuous model** - Single formulation covers the entire glottal cycle without discontinuities
2. **Return phase modeling** - Exponential decay after closure captures dynamic leakage/breathiness
3. **Four parameters** with clear physical interpretation and interrelationships
4. **Area balance constraint** - Zero net flow gain within fundamental period ties parameters together
5. **Spectral tilt prediction** - Return phase time constant directly predicts high-frequency roll-off

## Methodology

The model describes the **derivative of glottal flow** E(t) = dU_g/dt in two phases:

1. **Opening/closing phase** (0 < t < t_e): Exponentially growing sinusoid
2. **Return phase** (t_e < t < t_c): Exponential decay toward closure

## Key Equations

### L-Model (Liljencrants) - Flow Derivative Opening Phase

$$
E(t) = \frac{dU_g(t)}{dt} = E_0 e^{\alpha t} \sin(\omega_g t)
$$

Where:
- $E_0$ = initial amplitude scale factor
- $\alpha$ = exponential growth constant (positive = negative damping)
- $\omega_g = 2\pi F_g$ = angular frequency of the glottal "formant"
- $t$ = time from start of opening

### Flow from L-Model (by integration)

$$
U(t) = \frac{E_0 \left[ e^{\alpha t}(\alpha \sin\omega_g t - \omega_g \cos\omega_g t) + \omega_g \right]}{\alpha^2 + \omega_g^2}
$$

### LF-Model Return Phase (t_e < t < t_c)

$$
E_2(t) = \frac{-E_e}{\varepsilon \cdot t_a} \left[ e^{-\varepsilon(t-t_e)} - e^{-\varepsilon(t_c-t_e)} \right]
$$

Where:
- $E_e$ = negative peak amplitude (excitation strength)
- $t_a$ = effective return time constant
- $\varepsilon$ = decay rate, related to $t_a$ by Eq. 12
- $t_c$ = end of cycle (typically = T0 = 1/F0)

### Epsilon-Ta Relationship

$$
\varepsilon t_a = 1 - e^{-\varepsilon(t_c - t_e)}
$$

For small $t_a$: $\varepsilon \approx 1/t_a$

### Dimensionless Shape Parameters

$$
R_d = \frac{2\alpha}{\omega_g} = \frac{-B}{F_g}
$$

$$
R_k = \frac{t_e - t_p}{t_p} = \frac{t_n}{t_p}
$$

Where:
- $R_d$ = "negative bandwidth" normalized parameter
- $R_k$ = relative closing time
- $B$ = negative bandwidth in Hz
- $t_n$ = closing time = $t_e - t_p$

### Return Phase Ratio

$$
R_a = \frac{t_a}{t_c - t_e}
$$

### Ka Approximation for Residual Flow

$$
\text{If } R_a < 0.5: \quad K_a = 2 - 2.34 R_a^2 + 1.34 R_a^4
$$

$$
\text{If } R_a > 0.5: \quad K_a = 2.16 - 1.32 R_a + 0.64(R_a - 0.5)^2
$$

$$
\text{If } R_a < 0.1: \quad K_a = 2.0
$$

### Residual Flow at t_e

$$
U_e = \frac{E_e \cdot t_a}{2} \cdot K_a
$$

### Peak Ratio (Ee/Ei)

$$
\frac{E_i}{E_e} = \frac{-e^{\frac{R_d}{2}(-\frac{\pi}{2} + \arctan\frac{R_d}{2} - \pi R_k)} \cdot \sin(\frac{\pi}{2} + \arctan\frac{R_d}{2})}{\sin\omega_g t_e}
$$

### Spectral Tilt from Return Phase

The return phase acts as an additional first-order low-pass filter:

$$
F_a = \frac{1}{2\pi t_a}
$$

Spectral loss in dB:

$$
\Delta L = -10 \log_{10}\left(1 + \frac{f^2}{F_a^2}\right) = -10 \log_{10}\left(1 + (2\pi t_a f)^2\right)
$$

Example: $t_a = 0.15$ ms gives $F_a = 1060$ Hz, causing 3 dB loss at 1060 Hz, 12 dB at 4000 Hz.

## Parameters

| Name | Symbol | Units | Typical Range | Description |
|------|--------|-------|---------------|-------------|
| Period | T0 | ms | 5-20 | Fundamental period = 1/F0 |
| Peak time | t_p | ms | 2-4 | Time of flow derivative positive maximum |
| Excitation time | t_e | ms | 3-6 | Time of negative peak (main excitation) |
| Return time constant | t_a | ms | 0-1.5 | Effective duration of return phase |
| Closure time | t_c | ms | = T0 | End of cycle |
| Excitation amplitude | E_e | - | - | Negative peak amplitude (sets spectrum level) |
| Positive peak | E_i | - | - | Positive maximum of flow derivative |
| Glottal frequency | F_g | Hz | - | F_g = 1/(2*t_p) |
| Growth constant | alpha | 1/s | - | Exponential growth rate |
| Angular frequency | omega_g | rad/s | - | = 2*pi*F_g |

### Dimensionless Parameters

| Name | Symbol | Definition | Typical Values | Notes |
|------|--------|------------|----------------|-------|
| R_d | 2*alpha/omega_g | - | 0-3 | Controls pulse asymmetry |
| R_k | (t_e-t_p)/t_p | - | 0.3-1 | Relative closing phase |
| R_a | t_a/(t_c-t_e) | - | 0-1.5 | Relative return phase |
| A_e | E_e/E_i | Peak ratio | 1.25-4 | Higher = more "pressed" |

### Voice Quality Parameter Ranges

| Voice Type | t_a (ms) | A_e | R_d | Notes |
|------------|----------|-----|-----|-------|
| Modal | 0-0.2 | 1.5-2.5 | 0.5-1 | Normal phonation |
| Pressed | ~0 | 3-4 | 0.8-1.2 | Tense, "thin" quality |
| Breathy | 0.6-1.5 | 1-2 | 0.3-0.8 | As in voiced [h] |

## Implementation Details

### Algorithm for Parameter Extraction from Inverse-Filtered Speech

1. Mark cursor positions: t_0=0, t_p, t_e, t_r=t_e+t_a, T0
2. Measure E_e from the waveform
3. Normalize flow functions by u_e/(E_e * t_p)
4. Apply iterative solution starting from zero return flow:
   - Use Eqs. (4), (5), (13) to find R_d
   - Then derive E_0 and E_i
5. Synthesize model curve and compare with inverse-filtered data
6. If E_e/E_i doesn't fit, shift starting point by adding fixed quantity to t_p and t_e
7. Update parameters and verify

### Area Balance Constraint

The integral of E(t) over one period must equal zero (no net DC flow gain):

$$
\int_0^{T0} E(t) \, dt = 0
$$

This constraint ties the four shape parameters together - given t_p, t_e, t_a, the growth constant alpha is determined by requiring area balance.

### Digital Implementation Notes

- L-model portion can use standard second-order digital filter with positive exponent (negative damping)
- Generated function is interrupted at t_e when flow reaches zero
- Return phase is simple exponential decay
- Convenient to set t_c = T0 (complete fundamental period)

## Figures of Interest

- **Fig. 1A-B (page 5):** Time-domain comparison of F-model vs L-model showing flow and derivative at different R_d values; spectral comparison showing L-model has less ripple
- **Fig. 2 (page 8):** Key diagram of LF-model showing all four parameters t_p, t_e, t_a, E_e on flow derivative waveform
- **Fig. 3 (page 11):** Nomogram relating R_d to R_k for different t_a/t_p ratios
- **Fig. 4 (page 11):** Nomogram relating A_e=E_e/E_i to R_k for different t_a/t_p ratios
- **Fig. 5 (page 12):** Waveshape and spectral effects of increasing t_a (0, 0.15, 0.6 ms) - shows first-order low-pass characteristic
- **Fig. 6 (page 13):** Effect of varying A_e (1.25, 2, 4) at constant E_e - shows "pressed" voice spectral characteristics
- **Fig. 7 (page 13):** LF-modeling of breathy voicing with different t_a values
- **Fig. 8 (page 15):** Waveform matching comparison of A-model vs LF-model on real speech

## Results Summary

- LF-model provides fits "not less reliable" than Ananthapadmanabha's 5-parameter model
- Better matches highly aspirated (breathy) waveforms
- Allows sinusoid as extreme limit (relevant for voicing termination)
- Has peak continuity (no secondary excitation at flow maximum)
- Spectral tilt from t_a accurately predicted by simple first-order filter formula

## Limitations

- Analytically complicated parameter interdependencies (nomograms provided to help)
- Requires iterative solution to find alpha given area balance constraint
- Initial LPC spectrum analysis for inverse filtering may not fit well at low sampling rates
- Mainly intended for non-interactive modeling (doesn't model source-tract interaction directly)

## Relevance to Qlatt Project

**Direct application to glottal source modeling:**

1. **Voice quality control** - The four LF parameters map directly to perceptual voice qualities:
   - t_a controls breathiness/spectral tilt
   - A_e (E_e/E_i ratio) controls "pressed" vs "lax" quality
   - R_k controls closing phase abruptness

2. **Spectral tilt** - The $F_a = 1/(2\pi t_a)$ formula provides a simple way to implement voice-source-dependent spectral shaping as a first-order low-pass filter

3. **Integration with Klatt** - Klatt's AV (voicing amplitude) and TL (spectral tilt) parameters roughly correspond to E_e and t_a respectively. The LF-model provides the theoretical basis for these.

4. **Breathy phonation** - For voiced /h/ and breathy vowels, large t_a (0.6-1.5 ms) creates appropriate spectral characteristics

5. **Synthesis parameters** - When implementing more sophisticated source models, the paper's nomograms (Figs. 3, 4) provide lookup relationships between the parameters

## Open Questions

- [ ] How does the LF-model interact with Klatt's OQ (open quotient) parameter?
- [ ] Can t_a be estimated from acoustic features for analysis-synthesis?
- [ ] What are typical t_a values for different vowel contexts?
- [ ] How to map between LF parameters and Klatt 1990's voice quality parameters?

## Related Work Worth Reading

- Fant, G. (1979): "Vocal source analysis - a progress report" - Earlier F-model
- Fant, G. (1980): "Voice source dynamics" - Inverse filter data for breathy phonation
- Ananthapadmanabha, T.V. (1984): "Acoustic analysis of voice source dynamics" - Five-parameter model, inverse filtering setup
- Ananthapadmanabha & Fant (1982): "Calculation of true glottal flow and its components" - Source-tract interaction
- Fant (1982): "Preliminaries to the analysis of the human voice source" - Background theory
- Klatt & Klatt (1990): Voice quality variations - Uses LF concepts in Klatt synthesizer context
