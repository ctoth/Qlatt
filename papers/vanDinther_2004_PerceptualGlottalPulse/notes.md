# A Method for Analysing the Perceptual Relevance of Glottal-Pulse Parameter Variations

**Authors:** R. van Dinther, A. Kohlrausch, R. Veldhuis
**Year:** 2004
**Venue:** Speech Communication 42 (2004) 175-189
**DOI:** 10.1016/j.specom.2003.07.002

## One-Sentence Summary

Develops and validates a perceptual distance measure (EPD) based on excitation patterns to predict JNDs for LF glottal-pulse R-parameter variations, finding that 4.3 dB EPD corresponds to one JND across all tested conditions.

## Problem Addressed

How to quantify which variations in glottal-pulse parameters (specifically LF model R-parameters) are perceptually relevant, without requiring extensive listening experiments for every parameter combination.

## Key Contributions

1. **Perceptual distance measure D** based on excitation pattern distance (EPD) that predicts audibility discrimination thresholds for R-parameter changes
2. **Quadratic approximation Q** enabling analytical computation of directions of maximum/minimum perceptual sensitivity
3. **Empirical validation** establishing 4.3 dB EPD as the threshold for one JND across diverse conditions
4. **Method for computing JNDs** in R-parameter space using inverse functions D⁻¹ and Q⁻¹

## Methodology

1. Map R-parameters to excitation patterns using Moore et al. (1997) loudness model (first 3 stages)
2. Compute EPD between two excitation patterns as L² norm
3. Approximate D² with quadratic functional Q using Taylor expansion
4. Use eigenvalue analysis of Hessian to find directions of max/min sensitivity
5. Validate with listening experiments using 3-interval forced-choice adaptive procedure

## Key Equations

### ERB-rate Scale (Eq. 1)
$$\text{number of ERBs} = 9.26 \log(4.37F + 1)$$
Where: F = frequency in kHz. Range 0-40 ERB corresponds to 0-15 kHz.

### Excitation Pattern Distance (Eq. 2)
$$\|e_1 - e_2\|_2 := \left( \int_0^{40} |e_1(x) - e_2(x)|^2 dx \right)^{1/2}$$
Where: e₁, e₂ = excitation patterns in dB, x = ERB-rate. Numerically approximated at 0.1 ERB steps.

### Perceptual Distance Measure (Eq. 3)
$$D_r(\mathbf{h}) := \|e(\mathbf{r} + \mathbf{h}) - e(\mathbf{r})\|_2$$
Where: r = R-parameter vector [Rₐ, Rₖ, Rₒ]ᵀ, h = parameter change vector

### Taylor Expansion of D² (Eq. 4-5)
$$D_r^2(\mathbf{h}) = \frac{1}{2}\mathbf{h}^T H_r \mathbf{h} + o(\|\mathbf{h}\|^2)$$
Where: Hᵣ = Hessian matrix with elements hᵢⱼ = ∂²D²ᵣ/∂rᵢ∂rⱼ (gradient is zero at minimum)

### Quadratic Approximation Q (Eq. 6)
$$Q_r(\mathbf{h}) := \sqrt{\frac{1}{2}\mathbf{h}^T H_r \mathbf{h}}$$

### Sensitivity in Eigenvector Direction (Eq. 7)
$$Q_{r,v_i}(\tau) = \left(\frac{\lambda_i}{2}\right)^{1/2} \tau$$
Where: λᵢ = eigenvalue, vᵢ = eigenvector, τ = scalar amount of change

### Inverse Function for JND Calculation (Eq. 8)
$$Q_{r,u}^{-1}(\nu) := \left(\frac{2}{\mathbf{u}^T H_r \mathbf{u}}\right)^{1/2} \nu$$
Where: u = unit direction vector, ν = threshold in perceptual space

### JND Size in Direction of Maximum Sensitivity
$$\text{JND}_{\text{max}} = \sqrt{2/\lambda_1} \cdot \nu_0$$
Where: λ₁ = largest eigenvalue, ν₀ = perceptual threshold (4.3 dB EPD)

## Parameters

| Name | Symbol | Units | Default/Typical | Range | Notes |
|------|--------|-------|-----------------|-------|-------|
| Return phase ratio | Rₐ | - | 0.025 | 0.010-0.092 | Rₐ = Tₐ/T₀ |
| Symmetry quotient | Rₖ | - | 0.310-0.420 | 0.25-0.50 | Rₖ = (Tₑ-Tₚ)/Tₚ |
| Open quotient | Rₒ | - | 0.560-0.680 | 0.40-0.80 | Rₒ = Tₑ/T₀ |
| Perceptual threshold | ν₀ | dB EPD | 4.3 | 1.5-10 | Grand mean across subjects |
| F₀ | F₀ | Hz | 110 | - | Fundamental frequency in experiments |
| Harmonics | N | - | 36 | - | Number of harmonics |
| Sampling rate | fs | kHz | 8 | - | |

### R-Parameter Sets Used in Experiments

| Point | Rₐ | Rₖ | Rₒ | Voice Quality | √λ₁ (sensitivity) |
|-------|-----|-----|-----|---------------|-------------------|
| r₁ | 0.025 | 0.310 | 0.560 | Modal | 2390 |
| r₂ | 0.010 | 0.330 | 0.680 | Modal/tense | 3267 |
| r₃ | 0.092 | 0.463 | 0.791 | Lax/breathy | 536 (low) |
| r₄ | 0.028 | 0.420 | 0.660 | Modal | 1960 (intermediate) |
| r₅ | 0.012 | 0.374 | 0.545 | Modal/tense | 3338 (high) |

### Eigenvectors for Maximum Perceptual Sensitivity

| Point | v₁ (max sensitivity direction) |
|-------|-------------------------------|
| r₃ | [0.78, -0.57, 0.25]ᵀ |
| r₄ | [0.98, -0.18, 0.03]ᵀ |
| r₅ | [0.99, -0.13, 0.005]ᵀ |

Note: Entries show contributions of [Rₐ, Rₖ, Rₒ]. Rₐ dominates maximum sensitivity direction.

## Implementation Details

### Computing Excitation Patterns
1. Use Moore et al. (1997) loudness model, stages 1-3 only
2. Stage 1: Free-field to eardrum transfer function
3. Stage 2: Middle ear transfer function
4. Stage 3: Calculate excitation pattern from effective cochlear spectrum
5. Filter shape varies with input level (level-dependent auditory filters)
6. Sample at 0.1 ERB steps from 0-40 ERB

### Computing Perceptual Distance
```
function EPD(r1, r2):
    e1 = excitation_pattern(glottal_spectrum(r1))
    e2 = excitation_pattern(glottal_spectrum(r2))
    return sqrt(sum((e1[i] - e2[i])^2 * 0.1) for i in ERB_samples)
```

### Computing Hessian for Q Approximation
- Numerical differentiation of D² around point r
- Compute eigenvalues λ₁ ≥ λ₂ ≥ λ₃ > 0
- Eigenvectors v₁, v₂, v₃ give directions of max, intermediate, min sensitivity
- √λ₁ gives overall perceptual sensitivity at point r

### JND Calculation Procedure
1. Choose direction u (unit vector) in R-parameter space
2. Compute uᵀHᵣu
3. JND = √(2/(uᵀHᵣu)) × 4.3 dB EPD

### Important Finding: Phase Effects
- For F₀ > 150 Hz: Phase effects smaller than 2 dB/oct spectral slope change
- At F₀ = 110 Hz: No systematic phase effects observed
- Implication: Can ignore phase when computing perceptual distance

## Figures of Interest

- **Fig. 1 (p. 177):** LF glottal pulse derivative showing T₀, Tₚ, Tₑ, Tₐ, Eₑ timing parameters
- **Fig. 2 (p. 179):** Waveforms for 5 R-parameter sets with voice quality labels
- **Fig. 3 (p. 180):** Measured JNDs in R-parameter space (Exp I) - shows 3 magnitude groups by parameter
- **Fig. 4 (p. 181):** Thresholds in EPD for Exp I - relatively flat around 4.3 dB
- **Fig. 5 (p. 182):** Contour plot showing elliptical equal-perception contours and eigenvector directions
- **Fig. 6 (p. 184):** Measured JNDs (Exp II) showing divergence correlates with √λ₁
- **Fig. 7 (p. 184):** Thresholds in EPD for Exp II - confirms 4.2 dB mean
- **Fig. 8 (p. 186):** Validation plot showing Q⁻¹ predictions vs measured JNDs cluster around 45° line

## Results Summary

### Key Finding: Universal Perceptual Threshold
- **Grand mean threshold: 4.3 dB EPD** (4.4 Exp I, 4.2 Exp II)
- Trained subjects: ~2.4 dB EPD (closer to Rao et al. 2001 value of 2.3 dB)
- Individual variation: 1.5-10 dB EPD range across subjects
- Within-subject variation: ~factor of 2 across conditions

### Sensitivity by Parameter Direction
- **Rₐ direction:** Smallest JNDs (highest sensitivity) - ~10⁻³ magnitude
- **Rₖ direction:** Intermediate JNDs - ~10⁻² magnitude
- **Rₒ direction:** Largest JNDs (lowest sensitivity) - ~10⁻¹ magnitude

### Validation of Q Approximation
- Mean of ν̃ᵢ,ⱼ (via Q): 4.4 dB EPD, std 1.9
- Mean of νᵢ,ⱼ (via D): 4.3 dB EPD, std 1.6
- t-test confirms Q approximates D well up to 1 JND
- Q⁻¹ approximates D⁻¹ well for JND prediction

### Comparison with Other Studies
| Study | Parameter | JND | EPD |
|-------|-----------|-----|-----|
| Scherer et al. 1998 | Rₒ | 0.034 | 8.2 dB |
| Scherer et al. 1998 | Rₖ | 0.069 | 9.0 dB |
| Henrich et al. 2003 (untrained) | Rₒ | 0.058-0.106 | 6.6-8.0 dB |
| Henrich et al. 2003 (trained) | Rₒ | 0.037-0.079 | 4.1-6.1 dB |
| This study | various | various | 4.3 dB mean |

Note: Higher EPDs in other studies may be due to vibrato, amplitude constraints, or less training.

## Limitations

1. **Fixed amplitude assumption:** When U₀ or Eₑ held constant, JNDs change significantly (Scherer, Henrich findings)
2. **Single F₀ tested:** Only 110 Hz (male modal); may differ for other pitches
3. **Stationary vowels only:** Dynamic changes not investigated
4. **Limited vowel set:** Only /a/ and /i/ tested (though no vowel effect found)
5. **Training effects:** 2 dB difference between trained/untrained subjects
6. **Quadratic approximation:** Valid only up to ~1 JND; larger changes need full D computation

## Relevance to Project

### For Klatt Synthesizer Implementation
1. **Voice quality variation:** R-parameters map to voice qualities (modal, breathy, tense)
   - Modal: Rₐ ≈ 0.025, Rₖ ≈ 0.31-0.42, Rₒ ≈ 0.55-0.68
   - Breathy/lax: Higher Rₐ (0.09), higher Rₖ (0.46), higher Rₒ (0.79)
   - Tense: Lower Rₐ (0.01), lower Rₒ

2. **Perceptual quantization:** Can use 4.3 dB EPD as threshold for "good enough" parameter matching

3. **Parameter priority:** Rₐ (return phase) has highest perceptual impact; optimize this first

4. **LF model relation:** Connects Klatt's OQ, SQ parameters to LF R-parameters:
   - Rₖ = 1/Sₑ (speed quotient)
   - Rₒ = Oₑ (open quotient)

### For Voice Source Modeling
- Return phase (Rₐ/Tₐ) controls spectral slope - most perceptually salient
- Rₐ values 0.01-0.09 span breathy to tense continuum
- √λ₁ metric can identify which parameter regions need finer control

## Open Questions

- [ ] How does threshold change with F₀ (female voices, children)?
- [ ] Does the 4.3 dB EPD threshold hold for dynamic (time-varying) stimuli?
- [ ] How to relate LF R-parameters to Klatt's AV, OQ, TL parameters?
- [ ] What is the perceptual effect when vocal tract filter varies simultaneously?

## Related Work Worth Reading

- Fant et al. (1985) - Original LF model definition
- Klatt & Klatt (1990) - Voice quality analysis/synthesis (cited, already in project)
- Moore et al. (1997) - Loudness model used for excitation patterns
- Rao et al. (2001) - EPD measure development and validation
- Veldhuis (1998) - Spectral relevance of R-parameters (precursor study)
- Henrich et al. (2003) - JNDs for Oq and asymmetry coefficient in singing

## Key Takeaway for Implementation

**When implementing voice quality control in a formant synthesizer:**
1. Rₐ (return phase ratio) has the highest perceptual impact - small changes (~0.001-0.01) are audible
2. Rₒ (open quotient) has the lowest perceptual impact - larger changes (~0.05-0.1) needed for audibility
3. A perceptual distance of 4.3 dB EPD represents one JND - changes below this are imperceptible
4. Voice quality perception is relatively consistent across vowels /a/ and /i/
