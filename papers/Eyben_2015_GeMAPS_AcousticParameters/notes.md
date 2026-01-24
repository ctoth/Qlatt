# The Geneva Minimalistic Acoustic Parameter Set (GeMAPS) for Voice Research and Affective Computing

**Authors:** Florian Eyben, Klaus Scherer, Björn Schuller, Johan Sundberg, Elisabeth André, Carlos Busso, Laurence Devillers, Julien Epps, Petri Laukka, Shrikanth Narayanan, Khiet Truong

**Year:** 2015

**Venue:** IEEE Transactions on Affective Computing

**DOI:** 10.1109/TAFFC.2015.2457417

## One-Sentence Summary

Proposes a standardized minimalistic set of 62 acoustic parameters (GeMAPS) for voice analysis and emotion recognition, with detailed extraction algorithms implemented in openSMILE.

## Problem Addressed

- Proliferation of acoustic parameters in voice research with no standardization
- Different studies use overlapping but non-identical parameter sets, preventing comparison
- Large brute-force feature sets (6000+ parameters) lead to overfitting and poor generalization
- Need for interpretable parameters linked to voice production physiology

## Key Contributions

1. **GeMAPS (62 parameters)**: Minimalistic standard acoustic parameter set
2. **eGeMAPS (88 parameters)**: Extended set with MFCCs and spectral flux
3. **Open-source implementation** in openSMILE toolkit
4. **Selection criteria**: physiological relevance, proven effectiveness, theoretical significance
5. **Comprehensive evaluation** on 6 emotion databases showing competitive performance

## Methodology

Parameters selected based on three criteria:
1. Potential to index physiological changes in voice production during affective processes
2. Frequency and success of use in past literature
3. Theoretical significance

## Parameter Sets

### GeMAPS - Minimalistic Set (62 parameters)

#### 18 Low-Level Descriptors (LLDs)

**Frequency Related (6 LLDs):**
| Parameter | Description | Units |
|-----------|-------------|-------|
| Pitch (F0) | Logarithmic F0 on semitone scale starting at 27.5 Hz | semitones |
| Jitter | Deviations in consecutive F0 period lengths | ratio |
| Formant 1 freq | Centre frequency of first formant | Hz |
| Formant 2 freq | Centre frequency of second formant | Hz |
| Formant 3 freq | Centre frequency of third formant | Hz |
| Formant 1 bandwidth | Bandwidth of first formant | Hz |

**Energy/Amplitude Related (3 LLDs):**
| Parameter | Description | Units |
|-----------|-------------|-------|
| Shimmer | Difference of peak amplitudes of consecutive F0 periods | ratio |
| Loudness | Perceived signal intensity from auditory spectrum | sone-like |
| HNR | Harmonics-to-Noise Ratio | dB |

**Spectral Balance (9 LLDs):**
| Parameter | Description | Units |
|-----------|-------------|-------|
| Alpha Ratio | Energy ratio: 50-1000 Hz / 1-5 kHz | ratio |
| Hammarberg Index | Strongest peak 0-2 kHz / strongest peak 2-5 kHz | ratio |
| Spectral Slope 0-500 Hz | Linear regression slope of log power spectrum | slope |
| Spectral Slope 500-1500 Hz | Linear regression slope of log power spectrum | slope |
| F1 relative energy | Energy at F1 / energy at F0 | ratio |
| F2 relative energy | Energy at F2 / energy at F0 | ratio |
| F3 relative energy | Energy at F3 / energy at F0 | ratio |
| H1-H2 | Energy ratio of 1st to 2nd F0 harmonic | dB |
| H1-A3 | Energy ratio of 1st harmonic to highest in F3 range | dB |

#### Functionals Applied

- **All 18 LLDs**: Arithmetic mean + coefficient of variation = 36 parameters
- **Loudness & Pitch additionally**: 20th, 50th, 80th percentile; range 20-80; mean/std of rising/falling slopes = +16 parameters
- **Spectral parameters in unvoiced regions**: Alpha Ratio, Hammarberg Index, spectral slopes mean = +4 parameters

#### Temporal Features (6 parameters)
| Parameter | Description |
|-----------|-------------|
| Loudness peaks rate | Number of loudness peaks per second |
| Voiced region mean length | Mean length of continuous F0 > 0 regions |
| Voiced region std | Standard deviation of voiced region lengths |
| Unvoiced region mean length | Mean length of F0 = 0 regions (approx. pauses) |
| Unvoiced region std | Standard deviation of unvoiced region lengths |
| Voiced regions per second | Pseudo syllable rate |

**Total: 62 parameters**

### eGeMAPS - Extended Set (88 parameters)

Additional 7 LLDs beyond GeMAPS:
| Parameter | Description |
|-----------|-------------|
| MFCC 1-4 | Mel-Frequency Cepstral Coefficients 1-4 |
| Spectral flux | Difference of spectra of two consecutive frames |
| Formant 2 bandwidth | Bandwidth of second formant |
| Formant 3 bandwidth | Bandwidth of third formant |

Plus: Equivalent sound level (LEq)

**Total: 88 parameters**

## Key Equations

### Jitter (period-to-period)

$$
J_{pp,rel} = \frac{\frac{1}{N'-1} \sum_{n'=2}^{N'} |T_0(n') - T_0(n'-1)|}{\frac{1}{N'} \sum_{n'=1}^{N'} T_0(n')}
$$

Where:
- $T_0(n')$ = length of pitch period $n'$
- $N'$ = number of pitch periods in frame

### Shimmer (relative)

$$
S_{pp,rel} = \frac{\frac{1}{N'-1} \sum_{n'=2}^{N'} S_{pp}(n')}{\frac{1}{N'} \sum_{n'=1}^{N'} A(n')}
$$

Where:
- $S_{pp}(n') = |A(n') - A(n'-1)|$
- $A(n') = x_{max,n'} - x_{min,n'}$ (peak-to-peak amplitude)

### Harmonics-to-Noise Ratio

$$
HNR_{acf,log} = 10 \log_{10} \left( \frac{ACF_{T_0}}{ACF_0 - ACF_{T_0}} \right) \text{ dB}
$$

Where:
- $ACF_{T_0}$ = autocorrelation amplitude at fundamental period
- $ACF_0$ = 0-th ACF coefficient (frame energy)
- Floored to -100 dB for low-energy noise

### Hammarberg Index

$$
\eta = \frac{\max_{m=1}^{m_{2k}} X(m)}{\max_{m=m_{2k}+1}^{M} X(m)}
$$

Where:
- $m_{2k}$ = highest spectral bin where $f \leq 2$ kHz
- $X(m)$ = magnitude spectrum

### Alpha Ratio

$$
\rho_\alpha = \frac{\sum_{m=1}^{m_{1k}} X(m)}{\sum_{m=m_{1k}+1}^{M} X(m)}
$$

Where:
- $m_{1k}$ = highest spectral bin where $f \leq 1$ kHz

### Spectral Flux

$$
S_{flux}^{(k)} = \sum_{m=m_l}^{m_u} \left( X^{(k)}(m) - X^{(k-1)}(m) \right)^2
$$

Where:
- Range 0-5000 Hz
- Quadratic, unnormalized version

## Implementation Details

### Frame Parameters

| Feature Group | Window | Step | Window Function |
|---------------|--------|------|-----------------|
| F0, harmonics, HNR, jitter, shimmer | 60 ms | 10 ms | Gaussian (σ=0.4) |
| Loudness, spectral slope, formants, etc. | 20 ms | 10 ms | Hamming |

### F0 Extraction (Sub-Harmonic Summation)

- 15 harmonics considered
- Compression factor: 0.85 per octave shift
- F0 range: 55-1000 Hz
- Maximum 6 F0 candidates
- Viterbi post-smoothing for path selection
- Voicing probability threshold: 0.7
- Output: semitone scale starting at 27.5 Hz (semitone 0)

### Jitter/Shimmer Pitch Period Detection

- Correlation-based waveform matching
- Uses SHS F0 estimate to limit correlation range
- Operates on unwindowed 60 ms frames

### Loudness (Auditory Spectrum)

1. 26 triangular Mel filters (20-8000 Hz)
2. Equal loudness weighting (from PLP)
3. Cubic root amplitude compression per band
4. Sum over all bands

### Formant Extraction

- Linear Predictor (LP) coefficient polynomial roots
- Algorithm follows Praat implementation

### MFCC Extraction

- 26-band power Mel-spectrum (20-8000 Hz)
- Audio scaled to 16-bit integer range (not [-1,+1])
- Liftering with L = 22

### Smoothing

- All LLDs smoothed with symmetric 3-frame moving average
- For F0, jitter, shimmer: smoothing only within voiced regions

## Parameters Summary Table

| Set | LLDs | Functionals | Temporal | Total |
|-----|------|-------------|----------|-------|
| GeMAPS | 18 | 52 | 6 | 62 |
| eGeMAPS | 25 | 78 | 6 (+LEq) | 88 |

## Results Summary

### Average Performance (UAR %)

| Parameter Set | # Params | Arousal | Valence |
|---------------|----------|---------|---------|
| GeMAPS | 62 | 79.59 | 65.32 |
| eGeMAPS | 88 | **79.71** | 66.44 |
| InterSp09 | 384 | 76.08 | 64.88 |
| InterSp10 | 1,582 | 76.50 | 64.44 |
| InterSp11 | 4,368 | 76.43 | 65.96 |
| InterSp12 | 6,125 | 77.26 | 66.71 |
| ComParE | 6,373 | 78.00 | 67.17 |

Key findings:
- GeMAPS achieves ~80% arousal UAR with <2% of ComParE's parameters
- eGeMAPS best for arousal, third for valence
- MFCCs important for valence classification
- Minimalistic sets show better generalization potential

## Databases Evaluated

| Database | Content | Labels |
|----------|---------|--------|
| FAU AIBO | Children + robot, German | 5 emotions → valence |
| TUM-AVIC | Product presentations, English | 3 levels of interest |
| EMO-DB | Acted sentences, German | 7 basic emotions |
| GEMEP | Acted multimodal, French | 12 emotions |
| SING | Opera singers | 10 sung emotions |
| VAM | TV talk show, German | Arousal/valence/dominance |

## Limitations

1. Only parameters reliably extractable without supervision included
2. Vowel-based formant analysis requires automatic vowel detection (not included)
3. Valence classification lags behind large feature sets
4. No glottal inverse filtering (voice source parameters)
5. Static pivot points (e.g., Hammarberg 2kHz) not dynamically adapted to speaker F0

## Relevance to Qlatt Project

**Direct Applications:**
- Spectral slope parameters (0-500 Hz, 500-1500 Hz) for voice quality
- H1-H2 ratio indicates glottal adduction (open quotient proxy)
- Formant bandwidth relates to damping/nasalization
- Alpha ratio, Hammarberg index for spectral tilt/balance

**For Prosody:**
- F0 functionals (percentiles, slopes) for intonation modeling
- Loudness patterns for stress/prominence
- Temporal features (syllable rate, pause duration) for rhythm

**Voice Quality Parameters:**
- Jitter/shimmer for naturalness
- HNR for breathiness/noise
- H1-H2 for pressed vs. breathy phonation

## Open Questions

- [ ] How to dynamically adapt spectral slope pivot points to speaker F0?
- [ ] Would inverse filtering for voice source parameters improve valence detection?
- [ ] How do GeMAPS parameters map to Klatt synthesizer controls (AV, OQ, TL)?
- [ ] Can MFCC-like features be derived from Klatt parallel formant outputs?

## Related Work Worth Reading

- Scherer (1986) - Vocal affect expression review
- Banse & Scherer (1996) - Acoustic profiles in vocal emotion
- Juslin & Laukka (2003) - Communication of emotions in vocal expression
- Patel & Scherer (2013) - Vocal behaviour chapter
- openSMILE documentation for implementation details

## Implementation Reference

**Toolkit:** openSMILE v2.1+ (open source)
- Configuration files for GeMAPS and eGeMAPS extraction
- GUI available for out-of-box extraction
- Outputs: per-frame LLDs or segment-level functionals

**Code location:** http://audeering.com/research-and-open-source/
