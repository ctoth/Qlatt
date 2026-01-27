# Modeling Glottal Source for High Quality Voice Conversion

**Authors:** Jun Sun, Beiqian Dai, Jian Zhang, Yanlu Xie
**Year:** 2006
**Venue:** Proceedings of the 6th World Congress on Intelligent Control and Automation (WCICA), Dalian, China
**DOI/URL:** IEEE 1-4244-0332-4/06

## One-Sentence Summary
Proposes a codebook-based glottal source model that links LSF (vocal tract) parameters to normalized glottal waveforms, outperforming both Rosenberg and LF models for voice conversion.

## Problem Addressed
LF and Rosenberg models lose high-frequency glottal information and cannot capture breathiness/roughness from turbulent noise and aperiodicity. Polynomial models (Milenkovic, Childers) lack physical interpretation for cross-speaker conversion.

## Key Contributions
1. LSF-glottal codebook linking vocal tract shape to glottal waveform
2. Demonstrates high correlation between vocal tract and glottal source within phonetic classes
3. 27-30% improvement in glottal correlation, 50% reduction in spectral distance vs. LF/Rosenberg

## Methodology
1. Extract vocal tract (LSF) and glottal derivative per pitch-synchronous frame via closed-phase LPC
2. Cluster all LSF vectors into classes (optimal: 9 classes)
3. For each class, select LSF closest to centroid + its normalized glottal derivative as codebook entry
4. At synthesis: find closest LSF match in codebook, use corresponding glottal waveform

## Key Equations

### Source-Filter Model (Time Domain)
$$
s[n] = \sum_{k=1}^{p} a_k \cdot s[n-k] + b_n \cdot \sum_{m=1}^{q} \delta[n - mp]
$$

### Source-Filter Model (Z Domain)
$$
s(z) = \frac{B(z)}{A(z)} p(z) = B(z)V(z)p(z) = AG(z)R(z)V(z)p(z)
$$
Where:
- $V(z) = 1/A(z)$ = vocal tract (all-pole filter)
- $R(z)$ = lip radiation factor
- $B(z) = AG(z) \cdot R(z)$ = glottal derivative transform
- $p(z)$ = pitch pulse train

### Glottal Inverse Filtering
$$
B(z) = S(z) \cdot A(z)
$$

### Adaptive Pre-emphasis Coefficient
$$
v = \frac{v_{max}}{2} \left( \frac{\arctan(\mu \rho_s)}{\arctan(\mu)} + 1 \right)
$$
Where:
- $v_{max} = 0.95$
- $\mu = 2$
- $\rho_s = R_s(1) / R_s(0)$ = normalized autocorrelation coefficient

### LF Model (Discrete)
$$
g_R(n) = \begin{cases}
A_{go} e^{\alpha_{go} n} \sin(\omega_{go} n + \Phi_{go}), & n = 0,1,...,N-1 \\
-A_{gc} e^{-\alpha_{gc}(n-N)}, & n = N,...,M-1
\end{cases}
$$
Where: M = pitch period samples, N = open phase end sample

### Rosenberg Model
$$
g_R(n) = \begin{cases}
\frac{1}{2}(1 - \cos(\pi n / N_1)), & n = 0,1,...,N_1-1 \\
\cos(\pi(n-N_1) / 2N_2), & n = N_1,...,N_1+N_2 \\
0 & \text{otherwise}
\end{cases}
$$

### Spectral Distance Metric
$$
SD = \frac{1}{M} \sum_{p=0}^{M-1} \left[ \frac{1}{N} \sum_{k=0}^{N-1} \left[ |S_{org}(pL, \omega_k)| - |S_{con}(pL, \omega_k)| \right]^2 \right]^{1/2}
$$
Where:
- $S_{org}$, $S_{con}$ = STFT of original and converted speech
- $N$ = DFT points in 0-4kHz band
- $M$ = frame length
- $\omega_k = 2\pi k / N$

## Parameters

| Name | Symbol | Units | Default | Range | Notes |
|------|--------|-------|---------|-------|-------|
| Pre-emphasis max | $v_{max}$ | - | 0.95 | - | Empirically determined |
| Pre-emphasis shape | $\mu$ | - | 2 | - | Empirically determined |
| Glottal waveform length | - | samples | 80 | - | Normalized length for codebook |
| Optimal codebook size | - | classes | 9 | 1-20 | Best performance at 9 |
| Sample rate | - | Hz | 8000 | - | Experiment setup |
| Bits per sample | - | bits | 16 | - | Experiment setup |

## Implementation Details

### Training Stage
1. For each pitch-synchronous frame of voiced speech:
   - Extract LSF parameters (vocal tract)
   - Extract glottal wave derivative via closed-phase LPC
   - Normalize glottal derivative: length=80 samples, amplitude normalized
2. Cluster all LSF vectors using Vector Quantization
3. For each cluster:
   - Find LSF vector closest to centroid
   - Store this LSF + its glottal derivative as codebook entry

### Synthesis Stage
1. Given input LSF parameters
2. Compute Euclidean distance to all codebook LSF entries
3. Select codebook entry with minimum distance
4. Output corresponding normalized glottal wave derivative
5. Scale to actual pitch period and amplitude

### Glottal Extraction (Closed-Phase Analysis)
- Uses sliding window within glottal cycle
- Searches for region with smoothest output residues
- LP analysis during glottal closed interval avoids nonlinear components
- First-order differentiator $p(z) = 1 - vz^{-1}$ models lip radiation

## Figures of Interest
- **Fig 2 (page 3):** System diagram showing training and conversion stages
- **Fig 3 (page 3):** Spectral distance vs. number of codebook classes (optimal at 9)
- **Fig 4 (page 4):** Waveform comparison: original vs. LF vs. Rosenberg vs. proposed model

## Results Summary

| Model | Glottal Correlation | Spectral Distance |
|-------|---------------------|-------------------|
| Rosenberg | 0.6287 | 0.1196 |
| LF | 0.6136 | 0.122 |
| Proposed | 0.7985 | 0.0592 |

- Correlation improvement: +27% to +30.13%
- Spectral distance reduction: -50.5% to -51.48%
- Optimal codebook: 9 classes (performance plateaus/fluctuates beyond 9)

## Limitations
- Requires pitch-synchronous analysis (needs F0 detection)
- Codebook is speaker-specific (trained per speaker)
- Only tested on Mandarin speech (2 male speakers)
- 8kHz sample rate limits high-frequency detail
- Correlation assumption may not hold across all phonetic contexts

## Relevance to Project

**For Qlatt synthesis:**
- The core insight (vocal tract shape predicts glottal shape) could inform:
  - Phoneme-specific glottal source variations
  - Automatic selection of voice quality parameters based on phoneme class
- The 9-class finding suggests ~9 distinct glottal "types" per speaker
- Could map Qlatt phoneme categories to glottal parameter presets

**Limited direct applicability:**
- Qlatt uses parametric LF-style source, not waveform codebooks
- This paper's approach requires analysis of natural speech (not rule-based TTS)
- However, the phoneme→glottal-shape correlation could guide rule design

## Open Questions
- [ ] What phonetic classes correspond to the 9 optimal clusters?
- [ ] How does this generalize across speakers and languages?
- [ ] Could similar clustering inform Klatt's AV/OQ/TL parameter selection per phoneme?

## Related Work Worth Reading
- [2] Moore & Clements 2004 - Automatic glottal waveform estimation (the extraction algorithm used)
- [3] Childers 1995 - Glottal source modeling for voice conversion (polynomial approach)
- [6] Childers & Lee 1991 - Vocal quality factors (already in papers/)
- [7] Fant et al. 1985 - LF model (already in papers/)
