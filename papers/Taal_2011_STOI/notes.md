# An Algorithm for Intelligibility Prediction of Time-Frequency Weighted Noisy Speech

**Authors:** Cees H. Taal, Richard C. Hendriks, Richard Heusdens, Jesper Jensen
**Year:** 2011
**Venue:** IEEE Transactions on Audio, Speech, and Language Processing, Vol. 19, No. 7, pp. 2125-2136
**DOI:** 10.1109/TASL.2011.2114881

## One-Sentence Summary
STOI is a short-time objective intelligibility measure that computes correlation coefficients between normalized/clipped temporal envelopes of clean and degraded speech in one-third octave bands over 384 ms segments, achieving higher correlation with subjective intelligibility than five competing measures across diverse noise conditions.

## Problem Addressed
Existing objective intelligibility measures (AI, SII, CSII, CSTI, etc.) either rely on global statistics across entire sentences (tens of seconds), poorly handle time-frequency weighted noisy speech (e.g., ITFS-processed, single-channel noise-reduced), or fail to predict intelligibility of nonlinear processing. STOI addresses this by using short-time (384 ms) segments and a normalization+clipping procedure that limits the signal-to-distortion ratio, making it robust to various processing types.

## Key Contributions
- A simple, two-free-parameter intelligibility measure based on short-time temporal envelope correlation
- Normalization and clipping procedure that bounds the signal-to-distortion ratio (SDR), preventing noise-only regions from inflating scores
- Better correlation with speech intelligibility than five reference measures (DAU, CSII, CSTI, NSEC, FWS) across three different listening experiments
- Free MATLAB implementation provided

## Methodology
STOI compares temporal envelopes of clean and degraded speech in one-third octave bands over short-time segments, using normalization and clipping to limit the influence of noise-only regions.

## Key Equations

### Equation 1: One-Third Octave Band Energy (TF-unit)

$$X_j(m) = \sqrt{\sum_{k=k_1(j)}^{k_2(j)-1} |\hat{x}(k,m)|^2}$$

Where:
- $\hat{x}(k,m)$ = $k^{th}$ DFT-bin of the $m^{th}$ frame of the clean speech
- $j$ = one-third octave band index (1 to 15)
- $k_1(j)$, $k_2(j)$ = lower and upper DFT bin indices for band $j$
- The one-third octave band edges are rounded to the nearest DFT bin
- Same computation applies to degraded speech $Y_j(m)$

### Equation 2: Short-Time Temporal Envelope Vector

$$\mathbf{x}_{j,m} = [X_j(m-N+1), X_j(m-N+2), \ldots, X_j(m)]^T$$

Where:
- $N = 30$ frames (equals an analysis length of 384 ms)
- Similarly, $\mathbf{y}_{j,m}$ denotes the short-time temporal envelope of the degraded speech

### Equation 3: Normalization and Clipping

$$\tilde{\mathbf{y}}_{j,m}(n) = \min\left(\frac{\|\mathbf{x}_{j,m}\|}{\|\mathbf{y}_{j,m}\|} \mathbf{y}_{j,m}(n),\ (1 + 10^{-\beta/20}) \mathbf{x}_{j,m}(n)\right)$$

Where:
- $\beta = -15$ dB refers to the lower signal-to-distortion (SDR) bound
- $\|\cdot\|$ represents the $\ell_2$ norm
- The first term normalizes $\mathbf{y}$ to have the same energy as $\mathbf{x}$
- The second term clips $\mathbf{y}$ so it cannot exceed $(1 + 10^{-\beta/20})$ times $\mathbf{x}$
- The applied scaling from normalization does not directly affect the correlation coefficient

### Equation 4: SDR Bound Verification

$$SDR = 10 \log_{10}\left(\frac{\mathbf{x}_{j,m}(n)^2}{(\tilde{\mathbf{y}}_{j,m}(n) - \mathbf{x}_{j,m}(n))^2}\right) \geq \beta$$

### Equation 5: Intermediate Intelligibility Measure (Sample Correlation Coefficient)

$$d_{j,m} = \frac{(\mathbf{x}_{j,m} - \mu_{\mathbf{x}_{j,m}})^T (\tilde{\mathbf{y}}_{j,m} - \mu_{\tilde{\mathbf{y}}_{j,m}})}{\|\mathbf{x}_{j,m} - \mu_{\mathbf{x}_{j,m}}\| \|\tilde{\mathbf{y}}_{j,m} - \mu_{\tilde{\mathbf{y}}_{j,m}}\|}$$

Where:
- $\mu_{\mathbf{x}_{j,m}}$ = sample average of $\mathbf{x}_{j,m}$
- $\mu_{\tilde{\mathbf{y}}_{j,m}}$ = sample average of $\tilde{\mathbf{y}}_{j,m}$
- This is the Pearson correlation coefficient between the clean and normalized+clipped degraded temporal envelopes

### Equation 6: Final STOI Score

$$d = \frac{1}{JM} \sum_{j,m} d_{j,m}$$

Where:
- $J = 15$ (number of one-third octave bands)
- $M$ = total number of frames (after removing silent frames)
- The average is taken over all bands and all frames

### Equation 7: Ideal Binary Mask (IBM)

$$IBM(t, f) = \begin{cases} 1, & \text{if } T(t,f) - M(t,f) > LC \\ 0, & \text{otherwise} \end{cases}$$

Where:
- $T(t,f)$ and $M(t,f)$ = signal power in dBs for target (clean) and masker (noise) at time $t$ and frequency $f$
- $LC$ = local criterion threshold parameter

### Equation 8: Logistic Mapping Function

$$f(d) = \frac{100}{1 + \exp(ad + b)}$$

Where:
- $a$ and $b$ are free parameters fitted via nonlinear least squares
- Maps STOI score $d$ to predicted intelligibility percentage
- $f_{\text{Dantale}}(d)$: $a = -14.5435$, $b = 7.0792$
- $f_{\text{IEEE}}(d)$: $a = -17.4906$, $b = 9.6921$

## Parameters

| Name | Symbol | Units | Default/Value | Range | Notes |
|------|--------|-------|---------------|-------|-------|
| Sample rate | $f_s$ | Hz | 10,000 | - | Resampled to capture relevant frequency range for intelligibility |
| Frame length | $N_{\text{frame}}$ | samples | 256 | - | Hann-windowed frames |
| FFT size | $N_{\text{FFT}}$ | points | 512 | - | Zero-padded to 512 |
| Frame overlap | - | % | 50% | - | 50% overlapping segments |
| Number of 1/3 octave bands | $J$ | - | 15 | - | Lowest center freq = 150 Hz, highest ~4.3 kHz |
| Segment length (frames) | $N$ | frames | 30 | [10, 500] tested | 30 frames = 384 ms; optimal value |
| SDR bound | $\beta$ | dB | -15 | $[-\infty, -35, -25, -15, -10]$ tested | Lower bound on signal-to-distortion ratio |
| Silent frame threshold | - | dB | 40 | - | Frames with energy < max energy - 40 dB are excluded |
| Analysis window duration | - | ms | 384 | - | $N \times$ frame hop = $30 \times 128/10000$ = 384 ms |
| Lowest 1/3 oct center freq | - | Hz | 150 | - | First band |
| Highest 1/3 oct center freq | - | Hz | ~4300 | - | 15th band (approximately 4.3 kHz) |

## Implementation Details

### Complete STOI Algorithm

1. **Resample** both clean ($x$) and degraded ($y$) signals to 10 kHz
2. **Segment** both signals into 50% overlapping, Hann-windowed frames of 256 samples, zero-padded to 512
3. **DFT** each frame to obtain $\hat{x}(k,m)$ and $\hat{y}(k,m)$
4. **1/3 Octave Band Decomposition**: Group DFT bins into 15 one-third octave bands (Eq. 1)
   - Lowest center frequency: 150 Hz
   - Highest center frequency: ~4.3 kHz
   - Band edges rounded to nearest DFT bin
5. **Remove silent regions**: Find frame with maximum energy in clean speech; exclude all frames where clean speech energy is lower than 40 dB below this maximum
6. **Form temporal envelope vectors**: For each band $j$ and frame $m$, collect $N=30$ consecutive TF-unit values into vector $\mathbf{x}_{j,m}$ (Eq. 2)
7. **Normalize and clip** degraded envelope vector $\mathbf{y}_{j,m}$ (Eq. 3):
   - First: scale $\mathbf{y}_{j,m}$ to have same $\ell_2$ norm as $\mathbf{x}_{j,m}$
   - Then: element-wise clip so each sample does not exceed $(1 + 10^{-\beta/20}) \cdot \mathbf{x}_{j,m}(n)$
   - With $\beta = -15$ dB, the multiplier is $(1 + 10^{0.75}) \approx 6.62$
8. **Compute intermediate intelligibility** $d_{j,m}$ as sample correlation coefficient between $\mathbf{x}_{j,m}$ and $\tilde{\mathbf{y}}_{j,m}$ (Eq. 5)
9. **Average** over all bands and frames to get final STOI score $d$ (Eq. 6)

### 1/3 Octave Band Construction

The 15 one-third octave bands span from 150 Hz to approximately 4.3 kHz. The center frequencies follow the standard:

$$f_c(j) = f_0 \cdot 2^{j/3}$$

At 10 kHz sample rate with 512-point FFT, the frequency resolution is $10000/512 \approx 19.53$ Hz per bin. Band edges are:
- Lower edge: $f_c / 2^{1/6}$
- Upper edge: $f_c \cdot 2^{1/6}$

These are rounded to the nearest DFT bin indices $k_1(j)$ and $k_2(j)$.

### Normalization and Clipping Rationale

- **Normalization**: Compensates for global level differences between clean and degraded speech that should not affect intelligibility (e.g., different playback levels)
- **Clipping**: Prevents noise-only regions (where speech is absent) from artificially inflating the correlation. The SDR bound $\beta = -15$ dB means the degraded signal cannot exceed the clean signal by more than ~16.5 dB in any sample
- The clipping is mainly effective in noise-only regions (frames where $n < 11$ and $n > 23$ in a 30-frame window), leaving speech-dominant regions largely unaffected
- Without clipping ($\beta = -\infty$), the correlation is computed without normalization

### Silent Frame Removal

- Find the frame with maximum energy across the entire clean speech signal
- Reconstruct the signals excluding all frames where clean speech energy is lower than 40 dB below this maximum
- This prevents silence regions from contributing to the STOI score

## Figures of Interest

- **Fig. 1 (page 3):** Block diagram of the complete STOI algorithm showing data flow from clean/degraded speech through DFT-based 1/3 octave decomposition, short-time segmentation, normalization+clipping, correlation computation, and final averaging
- **Fig. 2 (page 3):** Example of normalization and clipping effect on a single band/frame, showing scatter plots before and after clipping ($d_{j,n} = 0.81$ without clipping vs $d_{j,n} = 0.96$ with clipping)
- **Fig. 6 (page 8):** Scatter plots of STOI vs measured intelligibility for three experiments, showing strong monotonic relationships ($\rho \geq 0.92$, $\sigma \leq 9\%$)
- **Fig. 10 (page 10):** Effect of $N$ and $\beta$ parameters on correlation coefficient, showing optimal at $N=30$, $\beta=-15$ dB
- **Fig. 11 (page 10):** Performance comparison of STOI vs five reference measures across three listening tests

## Results Summary

### Performance Metrics
- ITFS experiment: $\rho = 0.96$, $\sigma = 9\%$
- Single-channel noise reduction: $\rho = 0.92$, $\sigma = 7.7\%$
- ITFS with errors: $\rho = 0.96$, $\sigma = 7.1\%$

### Optimal Parameters
- Best performance at $N = 30$ (384 ms) and $\beta = -15$ dB
- These settings used for all evaluations

### Comparison with Other Measures
STOI has the best average performance across all three listening tests compared to:
1. DAU auditory model (20 ms correlation windows)
2. CSII (coherence speech-intelligibility index)
3. CSTI (normalized covariance speech transmission index)
4. NSEC (normalized subband envelope correlation)
5. FWS (frequency-weighted segmental SNR)

Only CSII has similar performance for the "single-channel noise reduction" test, and DAU shows slightly better results for "ITFS with errors" data.

### Logistic Mapping Parameters
| Corpus | $a$ | $b$ |
|--------|-----|-----|
| Dantale | -14.5435 | 7.0792 |
| IEEE | -17.4906 | 9.6921 |

## Limitations
- The mapping function $f(d)$ must be fitted per corpus (Dantale vs IEEE sentences have different mappings)
- STOI slightly overestimates intelligibility for low-SNR conditions with SSN noise
- Bottles-noise and car-noise at 50% SRT with unprocessed speech are underestimated
- The model has only two free parameters, intentionally kept simple (no band-importance functions)
- Sample rate of 10 kHz limits frequency range (no information above 5 kHz)
- Not designed for or tested on quality prediction, only intelligibility

## Testable Properties

- **Output range**: STOI $d \in [-1, 1]$, but in practice $d \in [0, 1]$ for speech signals
- **Monotonicity**: STOI must have a monotonic increasing relationship with speech intelligibility
- **Identity**: When $y = x$ (clean = degraded), STOI should equal 1.0
- **Silence removal**: Frames below -40 dB relative to max must be excluded
- **SDR bound**: After clipping, $SDR \geq \beta$ for all samples (Eq. 4)
- **Normalization invariance**: Scaling the degraded signal by a constant should not change STOI (due to normalization step)
- **Band count**: Exactly 15 one-third octave bands from 150 Hz to ~4.3 kHz
- **Segment length**: N=30 frames corresponds to exactly 384 ms at 10 kHz with 256-sample frames and 50% overlap (hop = 128 samples, 30 * 128 / 10000 = 0.384 s)
- **Correlation bounds**: Each intermediate $d_{j,m} \in [-1, 1]$

## Relevance to Project

STOI provides an objective, automated intelligibility metric for evaluating the output of the Qlatt Klatt formant synthesizer. By implementing STOI, we can:
1. Quantitatively measure how rule changes affect synthesized speech intelligibility
2. Compare different frontend configurations (e.g., formant targets, duration rules) using a standardized metric
3. Establish regression tests that flag intelligibility degradation when parameters change
4. Evaluate the impact of noise or processing artifacts introduced during synthesis

## Open Questions
- [ ] What are the exact 15 center frequencies used? (The paper says lowest=150 Hz, highest~4.3 kHz, but does not list all 15 explicitly)
- [ ] The MATLAB implementation is available at ceestaal.nl -- should we port it directly or implement from the paper equations?
- [ ] How does STOI perform on synthesized speech vs natural speech? (The paper only tests natural speech with added noise/processing)
- [ ] Should we use the extended STOI (ESTOI) from Taal's later work for better handling of modulated noise?

## Collection Cross-References

### Already in Collection
None of the key citations from this paper are currently in the collection.

### New Leads (Not Yet in Collection)
- Kates & Arehart (2005) - "Coherence and the speech intelligibility index" - alternative intelligibility metric (CSII), closest competitor to STOI
- Dau et al. (1996) - "A quantitative model of the 'effective' signal processing in the auditory system" - auditory model-based intelligibility prediction (DAU)
- Hu & Loizou (2008) - "Evaluation of objective quality measures for speech enhancement" - comprehensive comparison of objective quality measures
- ANSI S3.5-1997 - "Methods for the calculation of the speech intelligibility index" - the SII standard that STOI improves upon

### Cited By (in Collection)
- [[Jensen_2016_ESTOI]] — ESTOI directly extends STOI by adding column normalization to capture spectral correlation; shares preprocessing pipeline but dramatically outperforms STOI for modulated noise maskers

### Supersedes or Recontextualizes
None -- this paper introduces a new metric rather than extending or correcting existing collection papers.

## Related Work Worth Reading
- Ma et al. (2009) [14] - Extended STOI with band-importance functions for single-channel noise reduction
- Hu and Loizou (2008) [26] - Evaluation of objective quality measures for speech enhancement
- Christiansen et al. [15] - DAU auditory model for ITFS intelligibility prediction
- Li and Loizou [20] - ITFS with artificially introduced errors
- Kjems et al. [19] - ITFS listening experiments (Dantale II corpus)

---

**See also:** Jensen_2016_ESTOI - Extends STOI by adding column normalization to capture spectral correlation across frequency bands. ESTOI dramatically outperforms STOI for highly modulated noise maskers (rho=0.92 vs 0.47) while maintaining comparable performance on standard noise conditions.
