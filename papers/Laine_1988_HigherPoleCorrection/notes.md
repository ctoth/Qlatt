# Higher Pole Correction in Vocal Tract Models and Terminal Analogs

**Authors:** Unto K. Laine
**Year:** 1988
**Venue:** Speech Communication, Vol. 7, No. 1, pp. 21-40
**DOI:** 10.1016/0167-6393(88)90019-2

## One-Sentence Summary

This paper derives the mathematical model for the Higher Pole Correction (HPC) needed when an all-pole formant synthesizer models only N formants, showing the correction depends primarily on effective vocal tract length and proposing an all-zero filter model where each formant pole is paired with a wide-bandwidth zero.

## Problem Addressed

When a vocal tract is modeled using only N formant resonators (poles), the infinite number of higher formants that exist in the real vocal tract are neglected. This creates an increasingly attenuated spectral response at higher frequencies. The correction needed (HPC) was previously studied by Fant (1959) and Gold & Rabiner (1968), but several questions remained open: how much effective length variation affects HPC, whether digital systems truly need no HPC, and how to design practical variable HPC filters.

## Key Contributions

1. **Validates Fant's HPC formula** against a Transmission Line (TL) reference model, showing it is accurate up to ~4th formant frequency
2. **Shows effective vocal tract length is the dominant parameter** controlling HPC -- vowel-specific profile variations are unimportant
3. **Disproves the assumption** that digital all-pole models don't need HPC: they do, whenever the "digital length" (c*N/Fs) differs from real effective length
4. **Derives an all-zero model** for HPC via polynomial factorization of the vocal tract transfer function
5. **Proposes a pole-zero model** where each formant is paired with a wide-bandwidth zero, providing automatic HPC
6. **Relates the pole-zero model** to the PARCAS terminal analog, showing they are structurally equivalent

## Methodology

1. Validated a Transmission Line (TL) model against physical measurements of a tube in an anechoic chamber
2. Compared analog and digital all-pole models against TL for Russian vowel configurations
3. Used Taylor series expansion of the hyperbolic transfer function to derive polynomial models
4. Factored the polynomial into formant (narrow-bandwidth) and correction (wide-bandwidth) components
5. Derived a simplified all-zero HPC filter by reciprocal polynomial truncation

## Key Equations

### Vocal Tract Transfer Function (Eq. 2)

$$H(s) = \frac{1}{\cosh(\gamma l)}$$

Where: $\gamma$ = propagation constant, $l$ = tube length.

### Infinite Product Factorization (Eq. 3)

$$\frac{1}{\cosh(\gamma l)} = \prod_{n=1}^{\infty} \frac{s_n \cdot s_n^*}{(s - s_n)(s - s_n^*)}$$

Where $s_n$ are the complex zeros of $\cosh(\gamma l)$.

### Fant's HPC Formula (Eq. 4)

$$20\log|C(s)| = 20\log\left|\prod_{n=r+1}^{\infty} \frac{s_n \cdot s_n^*}{(s - s_n)(s - s_n^*)}\right| = 20\log\left|\exp\left[\sum_{n=r+1}^{\infty}\left(\frac{x_f^2}{8(2n-1)^2} + \frac{x_f^4}{96(2n-1)^4}\right)\right]\right|$$

Where:
- $r$ = number of formants in the all-pole model
- $x_f = \omega / \omega_1$ (frequency normalized to first formant of neutral tract)
- $\omega_1$ = first formant angular frequency for effective length $l_e$

### Effective Length

$$l_e = l + 0.8\sqrt{A/\pi}$$

Where $l$ = physical length, $A$ = cross-sectional area at lip opening.

### HPC Sensitivity (Eq. 5)

For the **4-pole case** (change in HPC from reference at $l_e$ = 17.5 cm):
$$\Delta y_4(f, \Delta l_e) = [0.5f^2 - 0.65f] \cdot \Delta l_e$$

For the **5-pole case**:
$$\Delta y_5(f, \Delta l_e) = [0.32f^2 - 0.27f] \cdot \Delta l_e$$

Where $f$ is in kHz, $\Delta l_e$ in cm, result in dB.

### Digital Effective Length (Eq. 8)

$$l_{ed} = \frac{cN}{F_s}$$

Where $N$ = number of formants, $F_s$ = sampling frequency, $c$ = speed of sound.

### Polynomial Transfer Function (Eq. 9-10)

$$H(s) = \frac{1}{P(s)}$$

$$P(s) = 1 + \lambda s + \frac{s^2}{2!} + \frac{\lambda s^3}{3!} + \frac{s^4}{4!} + \cdots$$

Where $\lambda = Y_c Z_r$ (characteristic admittance times radiation impedance).

### Factorization for HPC (Eq. 11-13)

$$P(s) = P_p(s) \cdot P_c(s)$$

$$P_p(s) = \prod_{i=1}^{N} \frac{(s - s_i)(s - s_i^*)}{s_i \cdot s_i^*}$$

$$H(s) \approx \frac{P_q(s)}{P_p(s)}$$

Where $P_p(s)$ = pole polynomial (first N formants), $P_c(s)$ = correction polynomial (remaining roots), $P_q(s) = 1/P_c(s)$ = all-zero HPC filter (truncated to practical order).

### Zero Frequency Rule (for neutral tube)

$$Z_i = (2i - 1) \cdot Z_1, \quad i = 1, 2, 3, \ldots$$

Where $Z_1 = c/(4 l_e)$ = first formant frequency of neutral tube.

### Scaling Rule (Table 1 notes)

For tube of length $l$:
$$f_{zero} = \sigma \cdot \frac{c}{2\pi l} \quad \text{(Hz)}$$
$$B_{zero} = -\sigma \cdot \frac{c}{\pi l} \quad \text{(Hz, bandwidth)}$$

### PARCAS Decomposition (Eq. 14)

$$H_o = \frac{Z_1 Z_2 Z_5}{P_1 P_3 P_5}, \quad H_e = \frac{Z_3 Z_4}{P_2 P_4}$$

Where $H_o \cdot H_e \approx H(s)$.

## Parameters

| Name | Symbol | Units | Default | Range | Notes |
|------|--------|-------|---------|-------|-------|
| Effective length | $l_e$ | cm | 17.5 | 14-21 | Across vowels; male speaker |
| Sound velocity | $c$ | cm/s | 35000 | - | Standard value used in paper |
| First formant (neutral) | $F_1$ | Hz | 500 | 417-625 | = c/(4*l_e); varies with l_e |
| Lambda (loss parameter) | $\lambda$ | - | 0.1 | - | Controls formant bandwidths (~70 Hz at 0.1) |
| Zero bandwidths | $B_{zero}$ | kHz | 1.5 | 1.25-2.0 | Much wider than formant BW |
| Zero BW (last zero) | $B_{last}$ | kHz | 2.0 | - | Widened to compensate missing higher zeros |
| Polynomial order for 0.5 dB accuracy | - | - | 30-34 | - | At 4 kHz; ~15 pole pairs |
| HPC sensitivity (4-pole) | - | dB/cm | ~4 | - | At 3.5 kHz per cm of l_e change |
| HPC sensitivity (5-pole) | - | dB/cm | ~3 | - | At 3.5 kHz per cm of l_e change |
| Max HPC variation (5-pole) | - | dB | +/-20 | - | At 5 kHz, l_e range 14-21 cm |

## Implementation Details

### All-Zero HPC Filter Design (4-zero, for 4-formant system)

1. Zero frequencies at odd multiples of neutral F1: 500, 1500, 2500, 3500 Hz (for l_e = 17.5 cm)
2. Bandwidths: 1500, 1500, 1500, 2000 Hz
3. Scale frequencies proportionally when l_e changes: $Z_i = (2i-1) \cdot c/(4 l_e)$
4. Scale bandwidths proportionally: from 1.25 kHz (l_e=21 cm) to 1.875 kHz (l_e=14 cm)
5. The filter is minimum-phase with approximately linear phase

### For N-formant system:
- Need N zeros for HPC
- Zeroes at frequencies: $(2(N+k)-1) \cdot F_{1,neutral}$ for k = 1, 2, ..., N
- Or equivalently: each formant pole paired with a zero at the same frequency but with BW ~1.5-2 kHz

### Pole-Zero Module Approach (Section 5)

Each formant module consists of:
- One narrow-bandwidth pole (the formant resonator)
- One wide-bandwidth zero at the same frequency

Properties:
- In neutral tube: pole and zero at same frequency
- Above the highest module, response is approximately flat (~10 dB constant attenuation)
- Each new module extends the accurate frequency range
- 5 modules give accuracy to ~5 kHz

### Edge Cases

- When effective length is very short (l_e < 16 cm), one HPC zero may cross the Nyquist frequency -- the model still works
- The lambda parameter has no significant influence on HPC; bandwidth mismatch between model and reality doesn't affect HPC validity
- Cross-modes above ~7 kHz in physical tubes don't affect the lower-frequency HPC

## Figures of Interest

- **Fig. 3 (p. 24):** Measured vs. TL model response of uniform tube, showing good match to 7 kHz
- **Fig. 5 (p. 26):** Deviation of Fant's formula from theoretical HPC; valid to ~3.5 kHz
- **Fig. 6 (p. 26):** Relative HPC as function of effective length for 4-pole and 5-pole cases; shows +/-20 dB variation
- **Fig. 8 (p. 28):** HPC difference curves for 5 Russian vowels; confirms HPC depends only on l_e
- **Fig. 9 (p. 28):** Digital formant filter responses showing mirror poles
- **Fig. 14 (p. 31):** T-network approximation showing how more sections progressively add correct poles
- **Fig. 15 (p. 32):** Polynomial approximation accuracy vs. order
- **Fig. 17 (p. 33):** All-zero HPC models of order 8, 12, 16 compared to Fant's formula
- **Fig. 18 (p. 34):** Reduced-order 8th-order all-zero model; errors < 2 dB to 4 kHz
- **Fig. 20 (p. 35):** Progressive pole-zero model building up neutral tube response
- **Fig. 21 (p. 36):** Individual pole-zero module transfer functions
- **Fig. 24 (p. 38):** Augmented PARCAS model with controllable HPC multipliers

## Results Summary

1. Fant's HPC formula is valid up to ~4th formant frequency (~3.5 kHz for 17.5 cm tract)
2. HPC is insensitive to local vocal tract profile variations; depends only on effective length
3. Digital all-pole models DO need variable HPC (contrary to Gold & Rabiner 1968)
4. An 8th-order all-zero model achieves < 2 dB accuracy to 4 kHz across all vowels
5. The simplified 4-zero model has zeros at odd multiples of F1_neutral with BW ~1.5-2 kHz
6. Each pole-zero pair acts locally; the response above the highest pair is flat
7. The PARCAS structure inherently implements HPC through its parallel-cascade topology

## Limitations

- Physical measurements limited to ~7 kHz due to tube cross-modes
- Yielding wall effects not included in most simulations (Rw, Lw, Kw parameters exist but secondary)
- Lambda parameter assumed constant (frequency-independent losses); real vocal tract has frequency-dependent losses
- The "practical value of controllable HPC has not yet been evaluated" (direct quote from conclusion)
- Analysis assumes closed glottis condition; open-phase effects not considered

## Testable Properties

- **Effective length range:** l_e must be in [14, 21] cm for adult male vowels
- **Zero spacing:** HPC zeros must be at odd multiples of c/(4*l_e) within measurement accuracy
- **Zero bandwidth range:** HPC zero bandwidths must be in [1.25, 2.0] kHz
- **HPC sensitivity bound:** At 3.5 kHz, 4-pole HPC changes by ~4 dB per cm of l_e change
- **Digital self-correction:** When l_ed = l_e, digital all-pole model needs zero additional HPC
- **Polynomial convergence:** Order 30-34 polynomial must approximate H(s) within 0.5 dB to 4 kHz
- **Pole-zero flatness:** Above highest pole-zero pair, response must be approximately flat (~10 dB constant attenuation)
- **Order independence:** HPC all-zero model should give same results regardless of lambda (0.05-0.2)

## Relevance to Project

This is directly relevant to Qlatt's recent addition of F7-F10 cascade formants. The paper explains:
1. **Why F7-F10 help:** They absorb part of the HPC that would otherwise be missing
2. **What the ideal approach is:** Each formant should be paired with a wide-bandwidth zero
3. **Why spacing matters:** Formant frequencies should follow (2n-1)*F1_neutral pattern for neutral tube
4. **Why effective length matters:** The HPC varies with vowel, so static F7-F10 values are only an approximation
5. **How much error remains:** Even with 10 formants at 44.1 kHz, l_ed is only ~8 cm vs. real 14-21 cm

The pole-zero model (pairing each resonator with a wide-bandwidth antiresonator) would be the theoretically correct approach. Qlatt already has antiresonator WASM primitives -- this could be implemented.

## Open Questions

- [ ] What is the actual effective length variation across the vowel inventory used in Qlatt?
- [ ] Would adding paired zeros to F7-F10 improve synthesis quality?
- [ ] At 44.1 kHz with 10 formants, how large is the residual HPC error in practice?
- [ ] Does the PARCAS multiplier approach (m1, m2, m3 in Fig. 24) offer a simpler implementation?
- [ ] How does the HPC interact with the Klatt parallel branch?

## Related Work Worth Reading

- Fant, G. (1959) "Acoustic analysis and synthesis of speech" -- original HPC derivation
- Gold, B. & Rabiner, L.R. (1968) "Analysis of digital and analog formant synthesizers" -- the digital HPC debate
- Laine, U.K. (1982) "PARCAS, a new terminal analog model" -- the parallel-cascade structure
- Laine, U.K. (1984) "Analysis and validation of higher pole correction function" -- earlier conference version
- Maeda, S. (1982) "A digital simulation method of the vocal-tract system" -- T-network approach
- Flanagan, J.L. (1972) "Speech Analysis, Synthesis and Perception" -- TL model equations

## Collection Cross-References

### Already in Collection
- **Fant_1960_AcousticTheorySpeechProduction** -- cited for HPC derivation (Ch. 2.33), vocal tract acoustics (Ch. 2.2), and area function data (Appendix C)
- **Fant_1985_LFModelGlottalFlow** -- related work on glottal source (not directly cited, but same author)
- **Rabiner_1968_DigitalFormantSynthesizer** -- the Gold & Rabiner (1968) paper that this work corrects regarding digital HPC
- **Maeda_1982_VowelNasalizationCues** -- same author as the digital simulation method cited (though different paper topic)

### New Leads (Not Yet in Collection)
- Fant, G. (1959) "Acoustic analysis and synthesis of speech" -- original HPC derivation in Ericsson Technics (distinct from the 1960 book)
- Laine, U.K. (1982) "PARCAS, a new terminal analog model" -- the parallel-cascade terminal analog structure
- Laine, U.K. (1984) "Analysis and validation of higher pole correction function" -- earlier conference version of this paper
- Flanagan, J.L. (1972) "Speech Analysis, Synthesis and Perception" -- Transmission Line model equations

### Supersedes or Recontextualizes
- Extends and validates Fant (1959/1960) HPC formula, showing it is more broadly valid than originally claimed (insensitive to vowel profile)
- Corrects Rabiner_1968_DigitalFormantSynthesizer (Gold & Rabiner 1968) claim that digital systems don't need HPC -- shows they do when effective length varies
