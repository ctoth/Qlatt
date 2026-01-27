# A Comparative Study of Glottal Source Estimation Techniques

**Authors:** Thomas Drugman, Baris Bozkurt, Thierry Dutoit
**Year:** 2020 (arXiv preprint, submitted to Computer Speech and Language)
**Venue:** Preprint submitted to Computer Speech and Language
**DOI/URL:** arXiv:2001.00840v1

## One-Sentence Summary
This paper compares three state-of-the-art methods for estimating glottal flow from speech (CPIF, IAIF, CCD), finding that mixed-phase decomposition (CCD) and closed-phase inverse filtering (CPIF) work best for clean speech while iterative adaptive inverse filtering (IAIF) is most robust to noise.

## Problem Addressed
Source-tract decomposition (separating glottal flow from vocal tract filtering) is fundamental for speech analysis but difficult because:
1. No ground-truth reference exists for natural speech
2. Most prior studies used only sustained vowels or synthetic speech
3. No systematic comparison of methods existed on real connected speech with varying voice qualities

## Key Contributions
- First comprehensive comparison of three state-of-the-art glottal source estimation techniques
- Systematic evaluation on both synthetic speech (with known ground truth) and real speech (De7 corpus)
- Analysis of sensitivity to noise, fundamental frequency, and vocal tract characteristics
- Demonstration that estimated glottal features can discriminate voice qualities (tensed, modal, soft)

## Methodology

### Three Methods Compared

1. **Closed Phase Inverse Filtering (CPIF)**
   - Estimates vocal tract during glottal closed phase (when subglottal effects are minimized)
   - Uses Discrete All Pole (DAP) modeling with Itakura-Saito distance
   - Requires accurate GCI/GOI detection
   - LPC order: 18 (= Fs/1000 + 2)

2. **Iterative Adaptive Inverse Filtering (IAIF)**
   - Iteratively refines both vocal tract and glottal estimates
   - Does not require precise GCI location
   - More robust to noise due to iterative convergence
   - Implementation from TKK Aparat toolbox

3. **Complex Cepstrum Decomposition (CCD)**
   - Exploits mixed-phase nature of speech
   - Vocal tract = minimum-phase (causal), Glottal open phase = maximum-phase (anticausal)
   - Separates components using unit circle as discriminant boundary in z-domain
   - Requires GCI-centered windows with correct phase properties
   - Uses 2-pitch-period Blackman windows, 4096-point FFT

### Test Conditions
- Synthetic speech: LF glottal model + LPC filter from female vowels
- F0 range: 100-240 Hz
- Oq (Open Quotient): 0.3, 0.05, 0.9
- αm (Asymmetry coefficient): 0.55, 0.05, 0.8
- 14 vowel types
- SNR: 10, 10, 80 dB (clean to noisy)
- Total: ~250,000 synthetic test conditions

### Real Speech Testing
- De7 corpus: German female speaker
- Three voice qualities: modal, soft, loud
- ~50 minutes per voice quality (~2.5 hours total)
- 16 kHz sampling rate

## Key Equations

### Z-Transform Decomposition (ZZT)
$$X(z) = \sum_{n=0}^{N-1} x(n)z^{-n}$$

$$= x(0)z^{-N+1} \prod_{k=1}^{M_o}(z - Z_{max,k}) \prod_{k=1}^{M_i}(z - Z_{min,k})$$

Where:
- $Z_{max,k}$ = roots outside unit circle (maximum-phase, glottal)
- $Z_{min,k}$ = roots inside unit circle (minimum-phase, vocal tract)

### Complex Cepstrum
$$X(\omega) = \sum_{n=-\infty}^{\infty} x(n)e^{-j\omega n}$$

$$\log[X(\omega)] = \log(|X(\omega)|) + j\angle X(\omega)$$

$$\hat{x}(n) = \frac{1}{2\pi}\int_{-\pi}^{\pi} \log[X(\omega)]e^{j\omega n}d\omega$$

The complex cepstrum $\hat{x}(n)$:
- $n < 0$: maximum-phase (glottal) contribution
- $n > 0$: minimum-phase (vocal tract) contribution

### Spectral Distortion Measure
$$SD(x,y) = \sqrt{\int_{-\pi}^{\pi}(20\log_{10}|\frac{X(\omega)}{Y(\omega)}|)^2\frac{d\omega}{2\pi}}$$

Practical version (20 Hz to 4000 Hz):
$$SD(Estimated, Reference) \approx \sqrt{\frac{2}{8000}\int_{20}^{4000}(20\log_{10}|\frac{S_{Estimated}(f)}{S_{Reference}(f)}|)^2df}$$

### Kullback-Leibler Divergence
$$D_{KL}(A,B) = \sum_i A(i)\log_2\frac{A(i)}{B(i)}$$

### Jensen-Shannon Divergence (symmetric)
$$D_{JS}(A,B) = \frac{1}{2}D_{KL}(A,M) + \frac{1}{2}D_{KL}(B,M)$$

Where $M = 0.5*(A+B)$

## Parameters

| Name | Symbol | Units | Default | Range | Notes |
|------|--------|-------|---------|-------|-------|
| Fundamental Frequency | F0 | Hz | - | 100-240 | Test range for synthetic speech |
| Open Quotient | Oq | ratio | 0.6 | 0.3-0.9 | LF model parameter |
| Asymmetry Coefficient | αm | ratio | 0.67 | 0.55-0.8 | LF model parameter |
| LPC Order (DAP) | p | - | 18 | Fs/1000+2 | For CPIF method |
| FFT Size | N | points | 4096 | - | For CCD method |
| Window Length | - | periods | 2 | - | Pitch periods for CCD |
| SNR | - | dB | 80 | 10-80 | Noise conditions tested |
| Error Threshold | - | % | 20 | - | For QOQ/NAQ error rate |

## Glottal Source Parameters Evaluated

| Parameter | Definition | Voice Quality Correlation |
|-----------|------------|---------------------------|
| NAQ (Normalized Amplitude Quotient) | Ratio of max flow to min derivative, normalized by period | Best discriminator; higher = more breathy |
| QOQ (Quasi-Open Quotient) | Time above 50% of (max-min) flow, normalized | Good for phonation changes |
| H1-H2 | Amplitude difference between 1st and 2nd harmonics | Higher = more breathy |
| HRF (Harmonic Richness Factor) | Sum of harmonic amplitudes / fundamental amplitude | Higher = more pressed voice |

## Implementation Details

### CPIF Implementation
1. Detect GCIs and GOIs using algorithm from Drugman & Dutoit (2009)
2. Extract closed-phase segments between GCI and next GOI
3. Compute DAP model minimizing Itakura-Saito distance
4. For high-pitched voices, use multicycle closed-phase LPC (multiple adjacent periods)
5. Inverse filter speech with estimated vocal tract

### CCD Implementation
1. Locate GCIs using SEDREAMS algorithm
2. Extract GCI-centered, 2-pitch-period Blackman windows
3. Compute 4096-point FFT (facilitates phase unwrapping)
4. Take complex logarithm with phase unwrapping
5. Separate positive/negative quefrency components
6. Reconstruct glottal contribution from negative quefrencies

### IAIF Implementation
- Used TKK Aparat toolbox with default parameters
- Iteratively estimates glottal formant, vocal tract, and lip radiation

## Figures of Interest
- **Fig 1 (page 4):** LF model glottal flow and derivative showing open/closing/return phases and GCI
- **Fig 2 (page 9):** Mixed-phase decomposition in time, spectrum, ZZT, and complex cepstrum domains
- **Fig 3 (page 13):** QOQ error distributions for the three methods
- **Fig 4 (page 14):** Performance vs SNR - IAIF most robust below 40 dB
- **Fig 5 (page 15):** Performance vs F0 - all methods degrade at high F0
- **Fig 6 (page 16):** Spectral distortion vs F1 frequency
- **Fig 7 (page 19):** Glottal flow estimates for /aI/ across voice qualities
- **Fig 8 (page 20):** NAQ, H1-H2, HRF distributions for loud/modal/soft voice
- **Fig 9 (page 21):** Jensen-Shannon distances between voice quality pairs

## Results Summary

### Synthetic Speech Performance
| Method | Clean Speech | Noisy (<40dB SNR) |
|--------|--------------|-------------------|
| CPIF | Best for QOQ | Poor |
| IAIF | Worst overall | Best (most robust) |
| CCD | Best overall (lowest spectral distortion) | Sensitive to noise |

### Key Findings
1. **CCD** gives best results on clean synthetic and real TTS-quality speech
2. **CPIF** excels at QOQ estimation in low-pitched, clean conditions
3. **IAIF** is most robust to noise (outperforms others below 40 dB SNR)
4. All methods degrade with high F0 (short closed phase) and low F1 (long vocal tract response)
5. NAQ is the best feature for discriminating voice quality types
6. Glottal features clearly separate loud/modal/soft phonation types

### Interference Factors
Source-tract separation quality depends on:
- **F0**: Higher pitch = shorter time between glottal pulses
- **F1**: Lower F1 = longer minimum-phase vocal tract response
- **Fg (glottal formant)**: Controls maximum-phase component duration; function of Oq and αm

## Limitations
- Tests focus on non-pathological voices with regular phonation
- Breathy voices with additive glottal noise not addressed
- Real speech tests limited to single German female speaker
- No perceptual evaluation of reconstructed glottal flow

## Relevance to Project

### For Qlatt/Klatt Synthesis
- Provides objective measures (NAQ, QOQ, H1-H2, HRF) for evaluating synthesized voice quality
- Confirms that glottal features differ significantly between voice qualities (loud/modal/soft)
- The CCD technique could be used to analyze natural speech and extract targets for LF model parameters
- NAQ correlates strongly with perceived breathiness - useful for validating AH (aspiration) settings

### For Voice Quality Control
- NAQ is the "most effective single measure for describing voice qualities" (citing Fant 1995)
- Relationship: NAQ ~ Oq and spectral tilt
- Higher NAQ = more breathy; Lower NAQ = more pressed/tense
- H1-H2 and HRF provide additional voice quality information

### Practical Implementation Notes
- For clean TTS synthesis, CCD-based analysis would give best glottal estimates
- For analyzing noisy recordings, IAIF is recommended
- GCI detection accuracy is critical for CPIF and CCD methods
- The Rd parameter (from Fant) unifies Oq and αm into single voice quality control

## Open Questions
- [ ] How do these methods perform on English speech vs German?
- [ ] Can CCD be applied in real-time for voice quality tracking?
- [ ] What are the computational costs of each method?
- [ ] How to handle transitions between phonation types?

## Related Work Worth Reading
- Fant et al. (1985) - LF model specification
- Doval & d'Alessandro (2006) - Spectrum of glottal flow models
- Alku et al. (2002) - NAQ definition and validation
- Childers & Lee (1991) - Voice quality factors
- Drugman & Dutoit (2009) - GCI/GOI detection algorithm
- Walker & Murphy (2007) - Review of glottal waveform analysis
