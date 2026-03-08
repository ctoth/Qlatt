# An Algorithm for Predicting the Intelligibility of Speech Masked by Modulated Noise Maskers

**Authors:** Jesper Jensen and Cees H. Taal
**Year:** 2016
**Venue:** IEEE/ACM Transactions on Audio, Speech, and Language Processing, vol. 24, no. 11, pp. 2009-2022
**DOI:** 10.1109/TASLP.2016.2585878

## One-Sentence Summary
ESTOI extends STOI by replacing per-subband temporal correlation with spectral correlation across a full row-and-column-normalized spectrogram, enabling accurate intelligibility prediction for speech degraded by temporally modulated noise maskers where STOI fails.

## Problem Addressed
STOI assumes mutual independence between frequency bands when computing intelligibility, averaging per-band temporal correlation coefficients. This assumption breaks down for highly modulated noise maskers (e.g., amplitude-modulated speech-shaped noise, competing talker babble), where the noise occupies different time-frequency regions across time. STOI shows correlation as low as rho = 0.47 for these conditions, where ESTOI achieves rho > 0.87.

## Key Contributions
- ESTOI: a Class-2 intelligibility predictor that does not require separated speech and noise signals
- Row-and-column normalization of short-time spectrograms that removes temporal envelope information and retains only spectral correlation
- Orthogonal intelligibility subspace decomposition showing which spectro-temporal modulation patterns matter most for intelligibility
- Demonstrates that temporal modulation frequencies of 2-6 Hz and spectral modulations of 0.2-0.8 cycles/kHz are most important for intelligibility

## Methodology
ESTOI is a Class-2 method (no access to separated speech and noise) that computes a scalar intelligibility index d from the clean speech signal s(n) and the noisy/processed signal x(n). The algorithm:
1. Extracts one-third octave band temporal envelopes
2. Segments envelopes into short-time spectrogram matrices
3. Normalizes rows (time) and columns (frequency) of spectrograms
4. Computes spectral correlation between normalized clean and noisy spectrograms
5. Averages correlation across time segments

## Key Equations

### STFT computation
$$
S(k, m) = \sum_{n=0}^{N'-1} s(mD + n) w(n) e^{-j2\pi kn/N'}
$$
Where k is frequency bin index, m is frame index, D = 128 samples (frame shift), N' = 512 (FFT order), w(n) is Hann window.

### One-third octave band envelope extraction
$$
S_j(m) = \sqrt{\sum_{k \in CB_j} |S(k,m)|^2}, \quad j = 1, \ldots, J
$$
Where CB_j is the index set of STFT coefficients for the jth one-third octave band, J = 15 subbands.

### Short-time spectrogram matrix
$$
S_m = \begin{bmatrix} S_1(m-N+1) & \cdots & S_1(m) \\ \vdots & & \vdots \\ S_J(m-N+1) & \cdots & S_J(m) \end{bmatrix}
$$
The jth row represents the temporal envelope of subband j. Typical: J = 15, N = 30 (corresponding to 384 ms).

### Row normalization (mean- and variance-normalization)
For the jth row of S_m:
$$
s_{j,m} = [S_j(m-N+1) \; S_j(m-N+2) \cdots S_j(m)]^T
$$

$$
\bar{s}_{j,m} = \frac{1}{\|(s_{j,m} - \mu_{s_{j,m}} \mathbf{1})\|} (s_{j,m} - \mu_{s_{j,m}} \mathbf{1}) \tag{1}
$$

$$
\mu_{s_{j,m}} = \frac{1}{N} \sum_{m'=0}^{N-1} S_j(m - m') \tag{2}
$$

Where ||y|| = sqrt(y^T y) is the vector 2-norm, 1 is an all-one vector, and mu is the sample mean.

### Column normalization (spectral normalization)
After row normalization, define the row-normalized spectrogram matrix:
$$
\bar{S}_m = \begin{bmatrix} \bar{s}_{1,m}^T \\ \vdots \\ \bar{s}_{J,m}^T \end{bmatrix}
$$

Then normalize each column n = 1, ..., N of the matrix (same mean-and-variance normalization as rows), yielding the doubly-normalized matrix:
$$
\check{S}_m = [\check{s}_{1,m} \cdots \check{s}_{N,m}]
$$

The columns of the doubly-normalized matrix represent unit-norm, zero-mean normalized spectra.

### Intermediate intelligibility index (per time segment)
$$
d_m = \frac{1}{N} \sum_{n=1}^{N} \check{s}_{n,m}^T \check{x}_{n,m} \tag{4}
$$

Where each term is the inner product (sample correlation) between the nth column of the clean and noisy/processed normalized spectrogram matrices.

### Final intelligibility index
$$
d = \frac{1}{M} \sum_{m=1}^{M} d_m \tag{5}
$$

Where M is the number of time segments in the signal. Since -1 <= d_m <= 1, it follows that -1 <= d <= 1.

### Matrix form of d (for theoretical analysis)
$$
d = \frac{1}{MN} \text{Tr}(\check{S}^T \check{X}) \tag{7}
$$

Where the "super matrices" are formed by concatenating all time segments' column-normalized supervectors.

### Logistic mapping to absolute intelligibility
$$
\hat{I} = \frac{100}{1 + \exp(a\tilde{I} + b)} \tag{10}
$$

Where a, b are constants fit to listening test data (test paradigm and listener dependent), and I-tilde is the raw predictor output.

## Parameters

| Name | Symbol | Units | Default | Range | Notes |
|------|--------|-------|---------|-------|-------|
| Sampling rate | f_s | Hz | 10000 | -- | Signals resampled to 10 kHz |
| Frame length | -- | samples | 256 | -- | Analysis frame size |
| Frame shift | D | samples | 128 | -- | 50% overlap |
| FFT order | N' | -- | 512 | -- | Zero-padded |
| Window | w(n) | -- | Hann | -- | Hann window applied |
| Number of subbands | J | -- | 15 | -- | One-third octave bands |
| Frequency range | -- | Hz | 150-4300 | -- | Center freqs of lowest and highest bands |
| Segment length | N | frames | 30 | -- | Corresponds to 384 ms |
| Silence threshold | -- | dB | -40 | -- | Frames with energy < max_energy - 40 dB are discarded |
| Logistic param a | a | -- | data-dependent | -- | Fit per test condition |
| Logistic param b | b | -- | data-dependent | -- | Fit per test condition |

## Implementation Details

### Step-by-step algorithm:
1. **Resample** both clean s(n) and noisy/processed x(n) to 10 kHz
2. **Time-align** s(n) and x(n) perfectly; remove regions where s(n) has no speech activity
3. **STFT**: Frame into 256-sample frames with D=128 shift, Hann window, N'=512 FFT
4. **One-third octave bands**: Group DFT coefficients into J=15 bands, center frequencies 150 Hz to ~4300 Hz. Compute band envelope S_j(m) = sqrt(sum |S(k,m)|^2) for each band j
5. **Silence detection**: Identify speech-active frames as those where reference signal s(n) frame energy >= max_frame_energy - 40 dB
6. **Form spectrogram matrices**: For each time segment m, collect N=30 consecutive frames of band envelopes into J x N matrices S_m (clean) and X_m (noisy)
7. **Row normalization**: For each row j of S_m and X_m, subtract mean and normalize to unit norm (Eqs. 1-2)
8. **Column normalization**: For each column n of the row-normalized matrices, subtract mean and normalize to unit norm. This yields doubly-normalized matrices
9. **Compute d_m**: Average inner product of corresponding columns of the doubly-normalized clean and noisy matrices (Eq. 4)
10. **Average over time**: d = mean(d_m) over all M time segments (Eq. 5)

### Key difference from STOI:
- **STOI**: Row-normalizes, then computes inner product of corresponding rows (temporal correlation per subband), averages across subbands. This assumes frequency-band independence.
- **ESTOI**: Row-normalizes AND column-normalizes, then computes inner product of corresponding columns (spectral correlation per time frame), averages across time frames. This captures cross-frequency dependencies.

### Note on clipping:
STOI applies a clipping operation to limit the dynamic range of the noisy signal relative to clean. ESTOI does NOT use clipping.

### Edge cases:
- Very short signals (N < 20 frames, i.e., < 256 ms): performance degrades significantly. Recommended minimum is N = 30 (384 ms), practical minimum is N = 20 (~256 ms).
- For highly modulated noise, longer test signals (tens of seconds) are recommended over shorter ones to reduce estimation variance.

## Figures of Interest
- **Fig 1 (page 3):** STOI vs. measured intelligibility for 10 additive modulated noise sources -- shows rho = 0.47, demonstrating STOI's failure mode
- **Fig 2 (page 4):** ESTOI block diagram -- complete signal flow from input signals through cochlear filterbank, envelope extraction, segmentation, row+column normalization, projection length averaging, to final d
- **Fig 3 (page 5):** Visualization of the normalization stages on example spectrograms -- shows how row and column normalization progressively removes level information
- **Fig 4 (page 8):** Intelligibility subspace decomposition for modulated noise -- 11 dominant subspaces carry 46% of intelligibility, characterized by low-frequency temporal modulations
- **Fig 5 (page 9):** Intelligibility subspace decomposition for cafeteria noise
- **Fig 6 (page 10):** Performance (rho) vs. segment length N -- fairly insensitive for N >= 20

## Results Summary

### Performance across noise conditions (Table IV, rho values):

| Condition | ESTOI | STOI | GLIMPSE | SIMI | SII |
|-----------|-------|------|---------|------|-----|
| Add Noise Set I (highly modulated) | **0.915** | 0.477 | 0.872 | 0.514 | 0.541 |
| Add Noise Set II (Young, modulated) | **0.916** | 0.809 | 0.872 | 0.027 | -0.101 |
| Add Noise Set II (Elderly) | **0.960** | 0.799 | 0.875 | 0.238 | 0.107 |
| Add Noise Set III (less modulated) | 0.864 | 0.887 | 0.845 | **0.931** | 0.723 |
| ITFS | **0.948** | 0.931 | -- | 0.958 | -- |
| SC-NR | **0.981** | **0.983** | -- | 0.974 | -- |

Key observations:
- ESTOI dominates for highly modulated noise (Sets I and II): rho > 0.91 vs STOI's 0.477
- For less modulated noise (Set III), STOI and ESTOI are comparable (0.887 vs 0.864)
- For ITFS and SC-NR processed signals, both perform well (rho > 0.94)
- ESTOI never performs statistically significantly worse than the best method for any condition

## Limitations
- ESTOI is a Class-2 method that does not exploit separated speech and noise signals -- when these are available, Class-1 methods (like ESII) may have lower estimation variance
- Performance degrades for very short test signals (< ~10 seconds for modulated noise)
- The logistic mapping parameters (a, b) must be fit to each test paradigm
- ESTOI has one more free parameter than STOI (the column normalization step itself)
- Does not model binaural processing

## Testable Properties
- d must be in [-1, 1] for any input signals
- d_m must be in [-1, 1] for any time segment
- For identical clean and noisy signals (no noise), d should equal 1
- For uncorrelated signals, d should approach 0
- Row-normalized vectors must have zero mean and unit norm
- Column-normalized vectors must have zero mean and unit norm
- d = (1/MN) Tr(S_check^T X_check) -- trace form must match element-wise computation
- Sum of eigenvalues of the cross-correlation matrix must equal d
- Performance should be insensitive to N for 20 <= N <= 50 (256-640 ms)

## Relevance to Project
ESTOI provides an objective intelligibility metric for evaluating Qlatt synthesizer output. Unlike STOI (which is already in the collection as Taal_2011_STOI), ESTOI handles modulated interference conditions that may arise when testing synthesized speech in realistic noise environments. For automated regression testing of synthesis quality, both STOI and ESTOI should be implemented to provide complementary evaluation -- STOI for standard conditions, ESTOI for robustness to modulated maskers. The algorithm is simple to implement (no machine learning, just matrix operations) and the MATLAB reference implementation is available at http://kom.aau.dk/~jje/.

## Open Questions
- [ ] What one-third octave band center frequencies and edge frequencies does the implementation use exactly? (The paper says 150 Hz to ~4.3 kHz but does not give the full list)
- [ ] The MATLAB reference implementation may define the exact band edges -- should be verified against the code at http://kom.aau.dk/~jje/
- [ ] How should ESTOI handle signals shorter than N=30 frames? Reduce N? Zero-pad?

## Collection Cross-References

### Already in Collection
- [[Taal_2011_STOI]] -- STOI is the predecessor algorithm that ESTOI extends. ESTOI shares the same preprocessing (10 kHz resampling, 1/3-octave bands, 384 ms segments, row normalization) but adds column normalization to capture spectral correlation.

### New Leads (Not Yet in Collection)
- Rhebergen et al. (2006) -- Extended SII (ESII) for fluctuating noise maskers, a Class-1 method
- Cooke (2006) -- Glimpse Model for speech intelligibility
- Kates and Arehart (2014) -- HASPI hearing-aid speech perception index
- Jensen and Taal (2014) -- SIMI: speech intelligibility based on mutual information

### Supersedes or Recontextualizes
- [[Taal_2011_STOI]] -- ESTOI is the direct extension of STOI. Where STOI fails (modulated maskers, rho=0.47), ESTOI succeeds (rho=0.92). ESTOI should be preferred when modulated noise sources are present. However, both metrics are useful: STOI for standard conditions (simpler, well-validated), ESTOI for robustness.
