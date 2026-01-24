# The Perceptual Relevance of Glottal-Pulse Parameter Variations

**Authors:** Ralph van Dinther, Raymond N.J. Veldhuis, Armin Kohlrausch
**Year:** 2001
**Venue:** Eurospeech 2001 - Scandinavia
**DOI:** 10.21437/Eurospeech.2001-372

## One-Sentence Summary
Demonstrates that perceptual discrimination of LF glottal model parameters can be predicted using excitation pattern distance, and that the 3-parameter LF model effectively operates as a 1-2 parameter model perceptually.

## Problem Addressed
While glottal-pulse models (especially LF) are well-studied for production, the *perceptual relevance* of their parameters has been largely ignored. Understanding which parameters matter perceptually could simplify voice quality modeling.

## Key Contributions
1. Validates excitation pattern distance as a predictor of audibility discrimination thresholds for LF R-parameter changes
2. Shows that LF model effectively operates as 1-2 parameter model perceptually (not 3)
3. Demonstrates that $R_a$ (return phase) is the most perceptually relevant parameter
4. Shows R-parameter sets from different voice qualities lie on a single trajectory in parameter space

## Methodology
- Used 5-stage auditory model (Moore et al. 1997) to compute excitation patterns
- L2-norm between excitation patterns as perceptual distance measure
- Eigenvalue analysis of Hessian matrix to determine sensitivity directions
- Validated with 4-subject discrimination experiment (3IFC adaptive procedure)

## The LF Model (Brief Review)

### T-Parameters (Time Domain)
| Symbol | Definition | Description |
|--------|------------|-------------|
| $T_0$ | $1/F_0$ | Glottal cycle period |
| $T_p$ | - | Time of maximum airflow |
| $T_e$ | - | Time of maximum excitation (vocal fold collision) |
| $T_a$ | $E_e/g''(T_e)$ | Return phase duration |

### R-Parameters (Normalized, used in this paper)
| Symbol | Definition | Description | Typical Range |
|--------|------------|-------------|---------------|
| $R_o$ | $T_e/T_0$ | Relative open phase duration | 0.56-0.68 |
| $R_k$ | $(T_e - T_p)/T_p$ | Glottal pulse asymmetry | 0.31-0.33 |
| $R_a$ | $T_a/T_0$ | Relative return phase duration | 0.01-0.03 |

**Note:** Shape fully specified by $R_a$, $R_k$, $R_o$ (given $F_0$).

## Key Equations

### Excitation Pattern Distance (L2-norm)
$$
\|f\| := \left( \int_0^{40} |f(x)|^2 dx \right)^{1/2}
$$
Where: $x$ is ERB-rate (0-40 range), sampled at 0.1 ERB steps.

### Perceptual Distance Approximation
$$
\|\psi_v(\mathbf{r} + \mathbf{h}) - \psi_v(\mathbf{r})\|^2 \approx \frac{1}{2}\mathbf{h}^T H(\mathbf{r}) \mathbf{h}
$$
Where:
- $\psi_v$ = mapping from R-parameters to excitation pattern for vowel $v$
- $H(\mathbf{r})$ = positive-definite 3×3 Hessian matrix
- $\mathbf{h}$ = small variation in R-parameters

### Eigenvalue Analysis
- $\lambda_1 \geq \lambda_2 \geq \lambda_3 \geq 0$ = eigenvalues of $H(\mathbf{r})$
- $\sqrt{\lambda_1}$ = maximum perceptual sensitivity
- $\sqrt{\lambda_2/\lambda_1}$ and $\sqrt{\lambda_3/\lambda_1}$ = relative contributions of orthogonal directions
- $\mathbf{v}_1$ = eigenvector of maximum perceptual sensitivity

## Parameters

### Experimental Stimuli Parameters
| Parameter | Value |
|-----------|-------|
| Fundamental frequency ($F_0$) | 110 Hz |
| Number of harmonics ($N$) | 36 |
| Sampling frequency | 8 kHz |
| Presentation level | ~55 dB SPL |

### Reference R-Parameter Sets Used
| Set | $R_a$ | $R_k$ | $R_o$ |
|-----|-------|-------|-------|
| $\mathbf{r}_1$ | 0.03 | 0.31 | 0.56 |
| $\mathbf{r}_2$ | 0.01 | 0.33 | 0.68 |

### Discrimination Thresholds (Experimental)
- Range: 1.5-10 dB (excitation pattern distance)
- Inter-subject variation: factor of ~2
- Intra-subject variation across conditions: factor of ~2
- Phase effects: negligible (amplitude dominates)

## Key Findings

### 1. Excitation Pattern Distance Validation
- Thresholds between 1.5-10 dB across subjects/conditions
- No systematic phase effects at F0=110 Hz
- Distance measure provides reasonable indication of perceptual sensitivity

### 2. Perceptual Relevance Hierarchy
For $\sqrt{\lambda_1} > 1000$:
- **$R_a$ (return phase)**: Most perceptually relevant (largest $v_{1,1}$ component)
- **$R_k$ (asymmetry)**: Slightly relevant (small $v_{1,2}$ component)
- **$R_o$ (open phase)**: Very low relevance (minimal $v_{1,3}$ component)

### 3. Effective Model Dimensionality
| Perceptual Relevance ($\sqrt{\lambda_1}$) | Effective Parameters |
|-------------------------------------------|---------------------|
| $\geq 1500$ | 1 parameter (primarily $R_a$) |
| $< 1500$ | 2-3 parameters |

### 4. Cross-Vowel Consistency
- Strong similarities between /a/, /i/, /u/ results
- Perceptual relevance differences between vowels are small
- Same trajectory in R-parameter space applies across vowels

## Figures of Interest
- **Fig 1 (p.1):** LF glottal pulse time derivative $g'(t)$ showing $T_p$, $T_e$, $T_a$, $T_0$, $E_e$
- **Fig 2 (p.3):** Discrimination thresholds (1.5-10 dB range) for 4 subjects across 12 conditions
- **Fig 3-5 (p.3-4):** Eigenvector components and eigenvalue ratios vs $\sqrt{\lambda_1}$ for /a/, /i/, /u/

## Implementation Notes

### For Synthesis Quality
1. **Prioritize $R_a$ control**: Return phase is most audible; small changes detectable
2. **$R_k$ secondary**: Asymmetry contributes but less critical
3. **$R_o$ tertiary**: Open phase duration least perceptually relevant

### Practical Thresholds
- Changes producing excitation pattern distance < 1.5 dB likely imperceptible
- Can simplify LF control to 1-2 parameters for most voice quality variations

### Auditory Model Pipeline
1. Free field → eardrum transfer function
2. Middle ear transfer function
3. Excitation pattern computation (cochlea model)
4. L2-norm on ERB-rate scale (0-40, step 0.1)

## Limitations
- Only tested Dutch vowels /a/, /i/, /u/
- Only stationary vowels (no dynamics)
- Limited to F0=110 Hz
- Small subject pool (N=4)
- Only small parameter variations tested ($h \in [-10^{-4}, 10^{-4}]^3$)

## Relevance to Qlatt Project

### Direct Applications
1. **Voice quality parameter tuning**: Focus computational effort on $R_a$ variations
2. **Simplification opportunity**: Could reduce LF to 1-2 effective parameters
3. **Quality metrics**: Excitation pattern distance as perceptual quality measure

### Synthesis Implications
- Current Klatt implementation uses simplified voicing source
- If implementing LF model, $R_a$ (return phase / spectral tilt) is the key perceptual control
- $R_k$ provides secondary voice quality variation
- $R_o$ can use defaults without perceptual penalty

## Open Questions
- [ ] How do these findings extend to dynamic (non-stationary) speech?
- [ ] Does the 1-parameter behavior hold for larger parameter variations?
- [ ] How does F0 variation affect the perceptual relevance hierarchy?

## Related Work Worth Reading
- **Klatt & Klatt 1990** [1]: Voice quality analysis/synthesis (male/female) - referenced for LF application
- **Veldhuis 1998** [2]: Spectral relevance of glottal parameters (precursor to this perceptual study)
- **Moore et al. 1997** [4]: Loudness model used for excitation patterns
- **Childers & Lee 1991** [7]: Voice quality factors - source of R-parameter sets
- **Karlsson & Liljencrants 1996** [8]: Diverse voice qualities - source of R-parameter sets
