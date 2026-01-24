# A Comparison of Spectral Smoothing Methods for Segment Concatenation Based Speech Synthesis

**Authors:** David T. Chappell, John H.L. Hansen
**Year:** 2002
**Venue:** Speech Communication 36 (2002) 343-374
**DOI:** S0167-6393(01)00008-5

## One-Sentence Summary
Comprehensive comparison of four spectral smoothing algorithms (optimal coupling, waveform interpolation, LP techniques, and psychoacoustic closure) for improving concatenative speech synthesis with limited databases.

## Problem Addressed
When speech is synthesized via segment concatenation, spectral discontinuities occur at segment boundaries because formants don't align properly. These discontinuities make speech sound unnatural - listeners perceive abrupt changes as speaker changes rather than natural speech flow.

## Key Contributions
1. Systematic comparison of four spectral smoothing methods with formal listener tests
2. Auditory-Neural Based Measure (ANBM) for assessing perceived spectral discontinuity
3. Phoneme-class-based recommendations for which smoothing algorithm to use
4. Novel application of psychoacoustic continuity effect to spectral smoothing
5. Comprehensive table of ANBM statistics and smoothing recommendations by phoneme class pair

## Methodology
- Compared algorithms on TIMIT database and custom corpus (~2300 phones per speaker)
- Formal MOS (Mean Opinion Score) listener test with 33 listeners
- Objective evaluation using ANBM measure
- Analysis of 124,193 phone transitions from TIMIT

## Key Equations

### ANBM Distance Measure (City-Block Metric)
$$
d_1(\vec{x}, \vec{y}) = \sum_{k=1}^{N} |x_k - y_k|
$$
Where:
- $\vec{x}, \vec{y}$ = feature vectors (primary firing frequencies from auditory model)
- $N$ = number of auditory nerve channels (32 channels, 100-3587 Hz)
- Lower score = less perceived discontinuity

### Pole Distance Measure for LP Pole Matching
$$
D(p_0, p_1) = \begin{cases}
\left|\ln\frac{p_1}{p_0}\right| \left\{\frac{\ln((1-r_0^2)/(1-r_1^2))}{\ln(r_1/r_0)}\right\}, & r_0 \neq r_1 \\
\left|\ln\frac{p_1}{p_0}\right| \{2r^2/1-r^2\}, & r = r_0 = r_1
\end{cases}
$$
Where:
- $p_i$ = complex pole positions
- $r_i$ = pole radii

### Formant Frequency and Bandwidth from Poles
$$
F_i = \frac{\theta_i}{2\pi T_s}, \quad BW_i = \frac{-\ln(r_i)}{\pi T_s}
$$
Where:
- $\theta_i$ = pole angle
- $r_i$ = pole radius
- $T_s$ = sampling period

### Pole Interpolation
$$
\theta_i = k_1\theta_1 + k_2\theta_2 \quad \text{and} \quad r_i = r_1^{k_1} + r_2^{k_2}
$$
Where:
- $k_1 + k_2 = 1$ (interpolation fractions)
- Angle interpolated linearly, radius geometrically

### LSF Interpolation
$$
P_i = k_1 P_1 + k_2 P_2 \quad \text{and} \quad Q_i = P_i + k_1(Q_1 - P_1) + k_2(Q_2 - P_2)
$$
Where:
- $P_i, Q_i$ = LSF zero pairs
- Position parameters relate to formant position
- Difference parameters relate to bandwidth

## Parameters

| Name | Symbol | Units | Default | Range | Notes |
|------|--------|-------|---------|-------|-------|
| LP Model Order | P | - | 9 | - | For 8 kHz, ~4 formant pole-pairs + 1 shaping pole |
| Auditory Channels | N | - | 32 | - | Cover 100-3587 Hz |
| Sampling Rate | $f_s$ | Hz | 8000 | - | TIMIT resampled |
| Interpolated Periods | - | frames | 3-5 | 0-10 | Pitch periods for smoothing |
| Shaped Noise Duration | - | ms | 45-125 | - | For continuity effect |
| Noise Amplitude | - | - | 1/4 | - | Fraction of RMS of adjacent frames |
| Formant JND (F1) | - | dB | 1.5 | - | Just noticeable difference |
| Formant JND (F2) | - | dB | 3 | - | Just noticeable difference |
| Formant Freq JND | - | % | 3-14 | - | Of formant frequency value |
| Formant BW JND | - | % | 20-40 | - | Of bandwidth value |

## ANBM Statistics for TIMIT

| Metric | Value |
|--------|-------|
| Number of speakers | 326 |
| Number of phone transitions | 124,193 |
| Sample mean | 222.24 |
| Sample standard deviation | 100.27 |
| Maximum score | 732 |
| Minimum score | 6 |

## Spectral Smoothing Algorithms Summary

### 1. Optimal Coupling
- **Concept:** Adjust segment boundaries to find better spectral match
- **Pros:** Doesn't modify signal, can combine with other methods
- **Cons:** Limited benefit, requires search per joint
- **Result:** Most consistent improvement (MOS 3.82 vs 3.53 raw)

### 2. Waveform Interpolation (WI)
- **Concept:** Interpolate pitch-period waveforms between anchor frames
- **Pros:** Simple, computationally fast
- **Cons:** Doesn't actually smooth formants
- **Result:** Small improvement, best on vowel-vowel (MOS 2.80)

### 3. LP Techniques

#### 3a. LP Pole Shifting
- **Concept:** Match and interpolate poles in z-plane
- **Pros:** Direct formant manipulation
- **Cons:** Pole matching difficult, can fail
- **Result:** Good when it works (MOS 2.69)

#### 3b. LSF Interpolation
- **Concept:** Interpolate Line Spectral Frequencies
- **Pros:** Inherent ordering, always stable
- **Cons:** Ordering may not be optimal for formants
- **Result:** Better than pole shifting (MOS 3.14)

### 4. Continuity Effect (Closure)
- **Concept:** Insert spectrally-shaped noise to mask discontinuity
- **Pros:** Perceptually motivated, works on fricatives
- **Cons:** Still sounds noisy in some cases
- **Result:** Promising for stops/fricatives (MOS 2.43)

## Listener Test Results (MOS Scale 1-5)

| Algorithm | MOS | Better than Raw | Worse than Raw |
|-----------|-----|-----------------|----------------|
| Natural speech | 4.13 | N/A | N/A |
| Raw concatenation | 3.53 | N/A | N/A |
| Optimal coupling | 3.82 | 77.0% | 23.0% |
| LSF interpolation | 3.14 | 39.4% | 60.6% |
| Waveform interpolation | 2.80 | 40.1% | 59.9% |
| Pole shifting | 2.69 | 38.4% | 61.6% |
| Shaped noise (closure) | 2.43 | 20.1% | 79.9% |

## Phoneme-Class Smoothing Recommendations

### Use LP Techniques for:
- Nasal → Nasal (large)
- Nasal → Semi-vowel (large)
- Nasal → Vowel (large)
- Nasal → Diphthong (large)
- Semi-vowel → Nasal (small)
- Semi-vowel → Semi-vowel (large)
- Semi-vowel → Vowel (large)
- Semi-vowel → Diphthong (large)
- Vowel → Nasal (large)
- Vowel → Semi-vowel (large)
- Vowel → Vowel (large)
- Vowel → Diphthong (large)
- Diphthong → Nasal (large)
- Diphthong → Semi-vowel (large)
- Diphthong → Vowel (large)

### Use Closure/Shaped Noise for:
- All Stop transitions (large amount)
- All Fricative transitions (varies)
- Whisper transitions (small)
- Affricate transitions (varies)

## Acoustic Correlates of Articulation

| Articulation | Acoustic Features |
|--------------|-------------------|
| Vowel | Formants in 0-500, 500-1500, 1500-2500 Hz bands |
| Bilabial | F2 and F3 comparatively low |
| Alveolar | F2 around 1700-1800 Hz |
| Velar | F2 usually high; common origin of F2/F3 transitions |
| Retroflex | General lowering of F3 and F4 |
| Stop | Sharp beginning of formant structure |
| Fricative | Random noise pattern dependent on place |
| Nasal | F1~250, F2~2500, F3~3250 Hz; F2 low amplitude; distinct antiresonance |
| Lateral | F1~250, F2~1200, F3~2400 Hz; higher formants reduced |
| Approximant | Like vowels; usually changing |
| Dental | F2~1600-1800 Hz; F3~2900-3050 Hz |

## Implementation Details

### ANBM Implementation
1. Use Carney's nonlinear auditory model for AN fiber responses
2. For each channel, calculate spectrum and find peak frequency
3. Store dominant frequencies in feature vector
4. Compare vectors using city-block metric

### Continuity Effect Implementation
1. Find spectral peaks in both anchor frames
2. For each frequency range between peaks:
   - If one envelope dominates, use it directly
   - Otherwise, interpolate between peaks
3. Pass Gaussian white noise through resulting filter
4. Insert 45-125 ms of shaped noise at boundary

### LP Pole Matching Strategy
1. Match conjugate pairs with minimum overall distance
2. For unmatched conjugate pairs, find nearest real pole
3. Interpolate angle linearly, radius geometrically
4. Problems: formant-connected vs. spectral-shaping poles

### Typical Interpolation Durations
- /iy/ → /aa/: ~30 ms (4 pitch periods)
- /d/ → /ah/: ~38 ms (5 pitch periods)
- /m/ → /iy/: ~23 ms (3 pitch periods)

## Figures of Interest
- **Fig. 1 (p. 5):** Acoustic correlates of articulatory features for vowels (F1 vs F2/F3 plot)
- **Fig. 3 (p. 9):** Waveform interpolation example /aa/ to /ae/
- **Fig. 5-9 (p. 10-15):** LP pole and LSF interpolation examples showing success/failure cases
- **Fig. 10-11 (p. 16):** Continuity effect illustration and noise envelope construction
- **Fig. 18 (p. 29):** Spectrograms comparing all algorithms on "carry an oily rag"

## Results Summary
- **Key finding:** No single algorithm works best for all situations
- Optimal coupling most consistently improves quality
- LP techniques best for voiced-to-voiced transitions
- Closure best for stop/fricative transitions
- Blind application of smoothing can degrade quality
- ANBM useful for automated quality checking

## Limitations
1. No single algorithm universally successful
2. Pole matching remains difficult for LP methods
3. Continuity effect still sounds noisy in some cases
4. LSF inherent ordering doesn't always yield best results
5. LP doesn't model nasals well (all-pole limitation)
6. Needs phone-specific tuning for best results

## Relevance to Project
**High relevance for Klatt synthesis coarticulation:**
- Formant transition smoothing strategies applicable to frame-by-frame synthesis
- ANBM concept could inform perceptual quality metrics
- Phoneme-class recommendations useful for rule-based coarticulation
- LP interpolation equations directly applicable to formant parameter interpolation
- Typical transition durations (20-40 ms) inform coarticulation window sizes
- JND values for formants useful for determining perceptual thresholds

## Open Questions
- [ ] How to automatically assess smoothing success without listener tests?
- [ ] Better pole distance measure that weights formant poles vs. shaping poles?
- [ ] Optimal noise envelope shape for continuity effect?
- [ ] Integration with prosody modification (PSOLA)?

## Related Work Worth Reading
- Hunt & Black, 1996 - Unit selection with target/concatenation costs
- Dutoit & Leich, 1993 - MBROLA synthesis
- Moulines & Charpentier, 1990 - PSOLA technique
- Klabbers & Veldhuis, 1998 - Concatenation artifact reduction
- Plumpe et al., 1998 - HMM-based smoothing
- Stevens & House, 1955 - Quantitative vowel articulation description
