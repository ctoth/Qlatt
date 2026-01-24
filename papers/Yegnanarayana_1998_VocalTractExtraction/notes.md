# Extraction of Vocal-Tract System Characteristics from Speech Signals

**Authors:** B. Yegnanarayana, Raymond N. J. Veldhuis
**Year:** 1998
**Venue:** IEEE Transactions on Speech and Audio Processing, Vol. 6, No. 4
**DOI/URL:** S 1063-6676(98)04219-9

## One-Sentence Summary
Provides a pitch-synchronous formant analysis method using glottal closure instants (GCI) detection via group delay, enabling accurate tracking of time-varying formant parameters in voiced speech.

## Problem Addressed
Traditional block-based speech analysis (10-20ms frames) smears spectral information and produces inconsistent formant estimates because:
1. Formant parameters vary within a pitch period (open vs closed glottal phases)
2. Frame position relative to pitch period affects estimates
3. High F0 voices have short closed phases making analysis difficult
4. Multiple pitch periods in one frame corrupt parameter estimation

## Key Contributions
1. **Group-delay based GCI detection** - Method to find instants of significant excitation (glottal closure) from speech signal alone
2. **Pitch-synchronous analysis** - Analysis frames positioned relative to GCI for consistent estimates
3. **Multicycle covariance method** - Averaging covariance matrices across pitch periods for high-F0 or noisy speech
4. **Pre/post-excitation distinction** - Separate formant estimates for open vs closed glottal phases

## Methodology

### Source-Filter Model
Speech signal modeled as differentiated glottal pulses exciting vocal tract filter. Glottal closure produces spike-like excitation due to differentiator.

### Two Glottal Phases
- **Closed phase**: Vocal tract closed at glottis, speech = free resonances only, all-pole model appropriate
- **Open phase**: Trachea coupled to vocal tract, time-varying characteristics, higher damping, pole-zero model

## Key Equations

### Short-Time Fourier Transform
$$
X(m,n) = \frac{1}{\sqrt{N}} \sum_{k=0}^{N-1} w_a(k) x(k - mS) e^{-ikn(2\pi/N)}
$$
Where:
- $m \in \mathbb{Z}$ = time index
- $n = 0, \ldots, N-1$ = frequency index
- $S$ = window shift (typically $S=1$)
- $f_s$ = sampling frequency
- $w_a(k)$ = Hanning window function
- Window length ≈ 2× average pitch period

### Frequency-Derivative STFT
$$
Y(m,n) = \frac{1}{\sqrt{N}} \sum_{k=0}^{N-1} k \cdot w_a(k) x(k - mS) e^{-ikn(2\pi/N)}
$$

### Group Delay Function
$$
\tau(m,n) = \frac{X_R(m,n) Y_R(m,n) + X_I(m,n) Y_I(m,n)}{X_R^2(m,n) + X_I^2(m,n)}
$$
Where $X(m,n) = X_R(m,n) + iX_I(m,n)$ and $Y(m,n) = Y_R(m,n) + iY_I(m,n)$

### Phase-Slope Function
$\psi(m)$ = average of median-filtered $\tau(m,n)$ over frequency index $n$

**GCI Detection**: Positive-going zero crossings of $\psi(m)$ mark instants of significant excitation

### Formant Resonance Model
$$
r(n) = \sum_{k=1}^{p} A_k \rho_k^n e^{i\theta_k n} = \sum_{l=1}^{p/2} \rho_l^n (A_l e^{i\theta_l n} + \bar{A_l} e^{-i\theta_l n})
$$
Where:
- $n$ = time index
- $p$ = 2× number of formants below $f_s/2$
- $\theta_k, -\pi < \theta \leq \pi$ = normalized formant frequency
- $\rho_k, 0 \leq \rho < 1$ = determines formant damping
- $A_k$ = complex formant amplitude

### Formant Frequency and Bandwidth
$$
F_k = \frac{f_s}{2\pi} \theta_k
$$

$$
B_k = -\frac{f_s}{\pi} \ln(\rho_k)
$$

### Covariance Matrix Elements (Prony/Covariance Method)
$$
c_{kl} = \sum_{n=p}^{N-1} s(n-k) s(n-l), \quad k,l = 1, \ldots, p
$$

$$
\mathbf{c}_k = \sum_{n=p}^{N-1} s(n-k) s(n), \quad k = 1, \ldots, p
$$

Solve: $\mathbf{C}\mathbf{a} = -\mathbf{c}$ for prediction coefficients $a_1, \ldots, a_p$

### Multicycle Covariance Method
For $K$ consecutive pitch periods:
$$
\left( \sum_{k=0}^{K-1} \mathbf{C}_k \right) \mathbf{a} = -\left( \sum_{k=0}^{K-1} \mathbf{c}_k \right)
$$

### Preemphasis Filter
$$
s'(n) = s(n) - \alpha s(n-1), \quad 0.8 < \alpha < 1
$$
Used to reduce influence of glottal source spectrum (6-12 dB/octave roll-off above ~100 Hz)

## Parameters

| Name | Symbol | Units | Default | Range | Notes |
|------|--------|-------|---------|-------|-------|
| Sampling frequency | $f_s$ | Hz | 8000-10000 | - | Paper uses 8-10 kHz |
| Window length | $N$ | samples | - | 2× pitch period | Hanning window |
| Window shift | $S$ | samples | 1 | - | For GCI detection |
| Preemphasis coeff | $\alpha$ | - | 0.9 | 0.8-1.0 | Reduces glottal influence |
| Prediction order | $p$ | - | 9 | - | 4 formants + 1 real pole |
| Frame length (male) | - | ms | 3.75 | 2.5-10 | < pitch period |
| Frame length (female) | - | ms | 2.5 | - | Shorter for high F0 |
| Pole magnitude threshold | $\rho_{min}$ | - | 0.8 | - | BW > 570 Hz rejected |
| Min formant frequency | $F_{min}$ | Hz | 200 | - | Below = spurious |
| Multicycle frames | $K$ | - | 3 | - | For high F0/noisy |
| Min SNR | - | dB | 40 | - | For reliable GCI |
| Pre-excitation offset | - | ms | 0.6125-1.25 | - | Before GCI |
| Post-excitation delay | - | samples | 2 | - | After GCI (noise robustness) |

## Implementation Details

### GCI Detection Algorithm
1. Compute STFT $X(m,n)$ with Hanning window (~2× pitch period)
2. Compute frequency-weighted STFT $Y(m,n)$
3. Compute group delay $\tau(m,n)$ at each time-frequency point
4. Median filter $\tau(m,n)$ in frequency domain
5. Average over frequency to get phase-slope function $\psi(m)$
6. Mark positive-going zero crossings as GCI

### Formant Extraction Algorithm
1. Identify GCIs using above method
2. Select analysis frame:
   - **Post-excitation**: Starts immediately after GCI (closed phase)
   - **Pre-excitation**: Ends ~1.25ms before GCI, use first-order difference signal
3. Compute covariance matrix and vector
4. Solve for LP coefficients (order 9)
5. Find roots of prediction polynomial
6. Filter roots: keep only $|\rho| > 0.8$ and $|F| > 200$ Hz
7. Convert to formant frequencies and bandwidths

### Multicycle Covariance Method (High F0)
- Combine covariance matrices from K=3 consecutive pitch periods
- Avoids short-frame unreliability while maintaining pitch-synchrony
- Required when closed phase < 2ms (e.g., female voices, F0 > 200 Hz)

### Edge Cases
- **High F0 voices**: Use multicycle covariance (K=3)
- **Noisy speech (SNR < 40dB)**: Unreliable GCI detection
- **No closed phase**: Analysis still works but estimates represent open-phase averages
- **Unvoiced/silence**: GCIs randomly positioned, distinguish by periodicity

## Figures of Interest
- **Fig 1 (p2)**: Male /a/ showing s(t), glottal pulse g(t), and derivative dg/dt with open (O) and closed (C) phases marked
- **Fig 2 (p4)**: Male diphthong /eI/ waveform with extracted GCI impulses - shows GCIs align with acoustic excitation
- **Fig 3 (p6)**: Postexcitation F1-F3 tracks for /eI/ comparing 2.5ms, 5ms, 10ms frames
- **Fig 5 (p8)**: Female /u/ comparing single-cycle vs multicycle covariance - dramatic improvement
- **Fig 6 (p8)**: Bandwidth tracks B1-B4 for male /eI/ using multicycle method
- **Fig 7 (p9)**: Comparison of uniformly-spaced vs postexcitation frames - postexcitation more consistent
- **Fig 10-11 (p12-13)**: CV transitions /ba/, /da/, /ga/ for male/female showing formant dynamics
- **Fig 12-13 (p13-14)**: Sentence "any dictionary" formant tracks

## Results Summary

### Noise Sensitivity (Table I, p10)
| Voice | Vowel | Single-cycle σ(F1) Hz | Single-cycle σ(F2) Hz | Multicycle σ(F1) Hz | Multicycle σ(F2) Hz |
|-------|-------|----------------------|----------------------|---------------------|---------------------|
| Male | /a/ | 3.3 | 3.4 | 0.29 | 0.45 |
| Male | /i/ | 8.2 | 6.5 | 0.21 | 1.9 |
| Female | /a/ | 8.0 | 9.5 | 0.74 | 1.8 |
| Female | /i/ | 26.3 | 49.9 | 0.42 | 2.1 |

Multicycle method reduces error by ~10× for most vowels at SNR=40dB.

### Key Findings
- Post-excitation formants more consistent than pre-excitation
- Pre-excitation F1 typically higher than post-excitation (open phase coupling)
- F3 often missed with longer frames due to high bandwidth (>570 Hz)
- Bandwidth estimates less reliable than frequency estimates
- Method tracks heavily damped formants that block methods miss

## Limitations
- Requires SNR > 40 dB for reliable GCI detection
- Bandwidth estimation less reliable than frequency estimation
- Pre-excitation analysis requires preemphasis, still less consistent
- Cannot reliably distinguish open/closed phases without EGG
- Very high F0 (short pitch periods) limits frame size and reliability
- Nonlinear glottal effects during open phase not modeled

## Relevance to Project

### For Klatt Synthesizer
1. **Formant dynamics**: Paper shows formants change rapidly during CV transitions - important for realistic synthesis
2. **Open vs closed phase**: Different formant values in open/closed phases - Klatt's cascade/parallel architecture might benefit from phase-aware parameter setting
3. **Bandwidth tracking**: Method can extract bandwidth variations - useful for natural synthesis
4. **GCI timing**: Understanding excitation timing relative to formants informs Klatt frame timing

### For Analysis-Synthesis
1. **Pitch-synchronous analysis**: If implementing analysis-by-synthesis, use GCI-aligned frames
2. **Multicycle averaging**: For female/child voice synthesis parameter extraction
3. **Pre/post-excitation separation**: Could inform separate cascade (closed) vs parallel (open) parameter sets

### For Voice Quality
- Method distinguishes characteristics of different glottal phases
- Relevant for breathy/pressed voice modeling in Klatt

## Open Questions
- [ ] How does this relate to Klatt's frame update rate (typically 5-10ms)?
- [ ] Could GCI detection improve synthesis timing for voiced sounds?
- [ ] Should formant parameters differ for open vs closed phase in synthesis?
- [ ] What is optimal analysis frame relative to Klatt's frame rate?

## Related Work Worth Reading
- [6] Flanagan (1965) - Speech Analysis Synthesis and Perception - classic formant bandwidth data
- [7] Fant (1970) - Acoustic Theory of Speech Production - foundational
- [11] Klatt & Klatt (1990) - Voice quality variations - relevant to synthesis
- [13] Klatt (1980) - Cascade/parallel formant synthesizer - **already have**
- [16] Markel & Gray (1976) - Linear Prediction of Speech - LP fundamentals
- [17] Murthy & Yegnanarayana (1991) - Formant extraction from group delay - related prior work
- [20] Smits & Yegnanarayana (1995) - GCI detection using group delay - core method paper
- [23] Fant, Liljencrants & Lin (1985) - LF glottal model - **relevant to synthesis**
