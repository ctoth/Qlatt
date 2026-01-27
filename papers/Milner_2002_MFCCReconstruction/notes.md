# Speech Reconstruction from Mel-Frequency Cepstral Coefficients Using a Source-Filter Model

**Authors:** Ben Milner, Xu Shao
**Year:** 2002
**Venue:** 7th International Conference on Spoken Language Processing (ICSLP 2002), Denver, Colorado, USA
**DOI:** 10.21437/ICSLP.2002-110

## One-Sentence Summary

This paper shows how to invert MFCC feature vectors back into speech by deriving LPC vocal tract filter coefficients from the smoothed magnitude spectrum, combined with simple pitch-pulse/noise excitation.

## Problem Addressed

Distributed speech recognition (DSR) systems transmit MFCC feature vectors for recognition but lose the ability to reconstruct the speech signal. This paper provides a method to reconstruct intelligible speech from MFCCs using only an additional pitch element, enabling dual-use vectors for both recognition and voice communication.

## Key Contributions

- Method to invert MFCCs to a smoothed magnitude spectrum estimate
- Technique to derive LPC vocal tract filter coefficients from that magnitude spectrum via Wiener-Khintchine theorem
- Equalization method for mel-filterbank and pre-emphasis distortions in the cepstral domain
- Demonstration that 13-D truncated MFCCs produce intelligible speech comparable to direct LPC analysis

## Methodology

1. Invert MFCC vector to smoothed magnitude spectrum (IDCT + exponential)
2. Apply cepstral-domain equalization for mel-filterbank area and pre-emphasis
3. Convert magnitude spectrum to autocorrelation coefficients via Wiener-Khintchine
4. Solve Levinson-Durbin to get vocal tract filter coefficients
5. Generate excitation signal (pitch pulses for voiced, white noise for unvoiced)
6. Synthesize speech through source-filter model

## Key Equations

### Source-Filter Speech Production

$$
s(n) = \sum_{i=1}^{p} a_i s(n-i) + G e(n)
$$

Where:
- $s(n)$ = output speech signal
- $a_i$ = $i$-th coefficient of $p$-th order vocal tract filter
- $G$ = gain term
- $e(n)$ = excitation signal (pitch pulses or noise)

### LPC Coefficient Calculation (Autocorrelation Method)

$$
\sum_{i=1}^{p} a_i r_{|j-i|} = r_j \quad 1 \leq j \leq p
$$

Matrix form: $\mathbf{aR} = \mathbf{p}$

Where:
- $r_j$ = $j$-th autocorrelation coefficient of windowed speech
- $\mathbf{R}$ = Toeplitz matrix of autocorrelation coefficients

### MFCC Computation (Forward)

$$
c_y(n) = u_n \sum_{k=0}^{K-1} (\log Y_k) \cos\left(\frac{(2k+1)n\pi}{2K}\right)
$$

Where:
- $u_n = \frac{1}{\sqrt{K}}$ for $n=0$; $u_n = \sqrt{\frac{2}{K}}$ for $n > 0$
- $Y_k$ = mel-filterbank output for channel $k$
- $K$ = number of filterbank channels (23)

### MFCC Inversion to Log Filterbank

$$
\log \hat{Y}_k = \sum_{n=0}^{K-1} u_n c_y(n) \cos\left(\frac{(2k+1)n\pi}{2K}\right)
$$

Zero-pad truncated MFCC (13-D) to filterbank dimensionality (K=23), then apply IDCT.

### Cepstral Equalization for Mel-Filterbank Area Distortion

$$
c_w(n) = u_n \sum_{k=0}^{K-1} (\log w_k) \cos\left(\frac{(2k+1)n\pi}{2K}\right)
$$

Where $w_k$ = area of $k$-th triangular mel-filter.

### Equalized MFCC Vector

$$
\mathbf{c}_x = \mathbf{c}_y - \mathbf{c}_w - \mathbf{c}_p
$$

Where:
- $\mathbf{c}_y$ = original speech MFCC
- $\mathbf{c}_w$ = mel-filterbank area distortion (cepstral)
- $\mathbf{c}_p$ = pre-emphasis filter effect (cepstral)

### Wiener-Khintchine: Autocorrelation from Magnitude Spectrum

$$
\hat{r}_j = \frac{1}{N} \sum_{f=0}^{N-1} |\hat{X}(f)|^2 e^{\frac{j 2\pi f j}{N}}
$$

Where:
- $\hat{X}(f)$ = estimated magnitude spectrum (squared and reflected)
- $N$ = number of spectral bins

## Parameters

| Name | Symbol | Units | Default | Range | Notes |
|------|--------|-------|---------|-------|-------|
| MFCC dimensions (truncated) | - | - | 13 | - | ETSI Aurora standard |
| MFCC dimensions (full) | K | - | 23 | - | Filterbank channels |
| Spectral bins | M | - | 128 | - | For magnitude spectrum |
| Frame rate | - | fps | 100 | - | 10ms update period |
| Speech bandwidth | - | Hz | 4000 | - | 8kHz sample rate |
| Bit rate | - | kbps | 4.8 | - | ETSI Aurora compressed |
| LPC order | p | - | not specified | typically 10-14 | Standard LPC practice |

## Implementation Details

### MFCC Inversion Pipeline

1. **Zero-pad truncated MFCC**: Pad 13-D vector to 23-D with zeros
2. **Inverse DCT**: Apply equation (4) to get log filterbank estimate
3. **Exponential**: Convert log filterbank to linear filterbank
4. **Interpolation**: Convert K mel-spaced bins to M linearly-spaced bins
   - Motorola approach: High-resolution (3933-D) IDCT for fine mel-scale resolution
5. **Equalization**: Subtract cepstral representations of mel-filter area and pre-emphasis

### Equalization Rationale

- Triangular mel-filters have increasing area at higher frequencies
- This imposes high-frequency tilt on filterbank outputs
- Pre-emphasis also adds high-frequency tilt
- Both effects are additive in cepstral domain, so subtract to equalize

### Excitation Signal

- **Voiced**: Pitch pulses at estimated pitch period
- **Unvoiced**: White noise (pitch = 0)
- **Pitch estimation**: Comb filter method (reference [8])
- **Gain**: Estimated from log energy element of feature vector

### Synthesis

Use standard LPC synthesis: apply all-pole vocal tract filter to excitation signal.

## Figures of Interest

- **Fig 3 (page 2):** Complete MFCC computation pipeline with equations at each stage
- **Fig 4 (page 3):** Magnitude spectrum reconstruction comparison (original vs 23-D vs 13-D MFCC)
- **Fig 5 (page 3):** Vocal tract frequency response comparison - shows 13-D loses F3/F4 distinction
- **Fig 6a/6b (page 4):** Spectrograms of original vs reconstructed speech (digit sequence 9-8-1-8-8-3-0)

## Results Summary

- Reconstructed speech is intelligible from both 23-D and 13-D MFCCs
- Slight quality degradation with 13-D truncation
- Quality comparable to speech synthesized from direct LPC analysis of original
- 23-D MFCCs preserve F3/F4 distinction; 13-D merges them into single peak
- F1 and F2 well-preserved in both cases

## Limitations

- Higher frequency formants (F3, F4) may be lost or merged with truncated MFCCs
- Simple pitch-pulse/noise excitation - more sophisticated codebook approaches not explored
- Requires additional pitch element in feature vector
- Phase information completely lost - reconstructed from model only
- Evaluation limited to informal listening tests and spectrogram comparison

## Relevance to Project

**Low relevance for Qlatt.** This paper addresses the *inverse* problem (features → speech) for distributed recognition systems. Qlatt generates speech from phoneme specifications, not from acoustic features.

However, the paper reinforces understanding of:
- Source-filter model fundamentals
- LPC coefficient calculation via autocorrelation
- Relationship between spectrum and filter coefficients (Wiener-Khintchine)
- Formant preservation properties of different spectral representations

## Open Questions

- [ ] What LPC order was used? (not specified)
- [ ] How does excitation model quality compare to Klatt's mixed-source excitation?
- [ ] Could this approach be used for analysis-resynthesis in Qlatt debugging?

## Related Work Worth Reading

- Kleijn & Paliwal (1995) - "Speech coding and synthesis" - comprehensive reference
- Chasan et al (2000) - "Speech reconstruction from mel frequency cepstral coefficients and pitch" - predecessor work
- McAuley & Quatiery (1986) - Sinusoidal speech representation - alternative reconstruction model
