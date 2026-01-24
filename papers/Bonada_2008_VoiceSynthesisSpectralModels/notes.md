# Voice Processing and Synthesis by Performance Sampling and Spectral Models

**Author:** Jordi Bonada Sanjaume
**Year:** 2008
**Type:** PhD Dissertation, Universitat Pompeu Fabra, Barcelona
**Supervisors:** Dr. Xavier Serra, Music Technology Group
**Funding:** Yamaha Corporation (research incorporated into Vocaloid)

## One-Sentence Summary

This dissertation presents a comprehensive framework for singing voice synthesis combining spectral voice models (source-filter decomposition with harmonic analysis) and performance sampling (concatenative synthesis with intelligent trajectory generation), achieving near-human quality as validated by perceptual tests.

## Problem Addressed

Existing singing synthesizers suffered from:
1. Unnatural timbre due to inadequate source-filter separation
2. Phase discontinuities causing artifacts during pitch/time transformations
3. Mickey Mouse effect when pitch transposition ignores formant-pitch independence
4. Loss of expressive nuances in purely parametric approaches
5. Time-frequency resolution tradeoffs limiting either temporal precision or harmonic accuracy

## Key Contributions

1. **MFPA (Maximally Flat Phase Alignment)**: Algorithm for estimating Glottal Closure Instants (GCIs) from harmonic phase relationships, achieving 89% accuracy within 15% of period
2. **WBVPM (Wide-Band Voice Pulse Modeling)**: Pitch-synchronous analysis combining time-domain pulse control with frequency-domain harmonic representation
3. **EpR (Excitation plus Resonances)**: Three-stage spectral voice model separating source, vocal tract resonances, and residual envelope
4. **Phase Model**: Predicting harmonic phases from amplitude envelope derivatives without storing phase data
5. **Shape Invariance**: Preserving waveform shape at pulse onsets during pitch modification
6. **Performance Sampling Architecture**: Complete system for trajectory generation and sample concatenation

## Methodology Overview

The system operates in three stages:

**Analysis:**
- Detect voice pulse onsets using MFPA
- Extract harmonic parameters (amplitude, frequency, phase) per frame
- Decompose spectral envelope into EpR components (source curve, resonances, residual)
- Model residual as difference between smooth resonance model and actual spectrum

**Transformation:**
- Apply pitch transposition via pulse sequence modification
- Transform timbre by warping spectral envelope
- Preserve shape invariance by maintaining phase coherence at pulse onsets
- Handle roughness/growl via sub-harmonic addition

**Synthesis:**
- Generate performance trajectories from score + performer model
- Select optimal sample sequence via cost function
- Concatenate samples with phase/amplitude smoothing
- Render via IFFT overlap-add

## Key Equations

### Source-Filter Model
The voice signal is modeled as source filtered by vocal tract:
- Voice source: LF model (Fant 1986) with glottal pulse parameters
- Vocal tract: ARMA filter representing formants (AR) and antiresonances (MA)
- Radiation: Differentiator representing lip radiation

### Harmonic Signal Model
$$s(t) = \sum_{h=0}^{H-1} a_h(t) \cos(\phi_h(t))$$

Where $a_h(t)$ is amplitude and $\phi_h(t)$ is instantaneous phase of harmonic $h$.

### MFPA Phase Alignment
For each fundamental phase candidate, compute:
$$\phi_{diff} = \sum_h |\text{princarg}(\tilde{\phi}_{0,h+1} - \tilde{\phi}_{0,h})|$$

The minimum identifies window position closest to pulse onset.

### EpR Source Curve
$$\text{Source}_{dB}(f) = \text{Gain}_{dB} + \text{SlopeDepth}_{dB}(e^{\text{Slope} \cdot f} - 1)$$

Parameters obtained from linear regression on harmonic peaks in log-frequency domain.

### EpR Resonance Filter (Klatt-based)
$$H(z) = \frac{A}{1 - Bz^{-1} - Cz^{-2}}$$

With coefficients:
- $C = -e^{-2\pi R_{bw}/f_s}$
- $B = 2\cos(\pi)e^{-\pi R_{bw}/f_s}$
- $A = 1 - B - C$

### Phase Prediction from Amplitude
$$\hat{\phi}_h = \alpha \cdot 20\log_{10}\left(\frac{a_{h+1}}{a_h}\right)$$

Where $\alpha = \pi/19$ (19 dB amplitude difference = $\pi$ radians phase shift).

### Phase Continuity at Concatenation
$$\Delta\phi_h^c = \text{princarg}\left(\phi'_{0,h,m} - 2\pi \frac{f'_{h,m-1} + f'_{h,m}}{2} \Delta_t - \phi'_{0,h,m-1}\right)$$

### Inharmonicity Near Formants
$$d_h = 1200 \cdot \log_2\left(1 + \frac{A}{2\pi W f_h}v\right) \text{ cents}$$

Where $A$ = phase excursion (~$\pi$), $W$ = formant bandwidth, $v$ = formant movement speed.

## Parameters

| Name | Symbol | Units | Value/Range | Notes |
|------|--------|-------|-------------|-------|
| **Voice Source** |||||
| Period duration | $T_0$ | seconds | varies | Inverse of f0 |
| Flow amplitude | $\hat{U}$ | - | - | Maximum glottal flow |
| Closed quotient | $Q_{closed}$ | ratio | $T_{cl}/T_0$ | Ratio of closed to period |
| Max flow declination rate | MFDR | 1/s | - | Peak negative derivative |
| **Analysis** |||||
| Sampling frequency | $f_s$ | Hz | 44100 | Standard audio rate |
| FFT size | $N$ | samples | 512-8192 | Powers of 2 |
| Window type | - | - | Blackman-Harris 92dB | -92dB sidelobes, 8-bin main lobe |
| Window periods (NBVPM) | $R$ | periods | 3-5 | Narrow-band analysis |
| Window periods (WBVPM) | - | periods | 1 | Period-synchronous |
| Hop size | $\Delta_t$ | samples | 256 | Frame advance |
| Zero-padding factor | - | ratio | 8-1000 | For frequency accuracy |
| **MFPA** |||||
| Phase candidates | - | count | ~80 | In interval $[-\pi, \pi]$ |
| Phase correction decay | $\theta_{correc}$ | radians | 0.1 | For smoothing |
| **Phase Model** |||||
| Phase scaling factor | $\alpha$ | - | $\pi/19$ | 19dB = $\pi$ radians |
| Smoothing filter order | $o$ | - | 3 (odd) | Running average |
| Phase offset | $\phi_M$ | radians | -2 | Base offset |
| High-freq correction start | $D$ | - | First harmonic > 8kHz | Sinusoidal correction |
| High-freq sinusoid rate | $E$ | - | 35 | Period of correction |
| **EpR Model** |||||
| Source gain | $\text{Gain}_{dB}$ | dB | varies | From regression |
| Source slope | $\text{Slope}$ | - | varies | Exponential decay rate |
| Source slope depth | $\text{SlopeDepth}_{dB}$ | dB | varies | Decay magnitude |
| Resonance frequency | $R_f$ | Hz | F1, F2, F3... | Formant centers |
| Resonance bandwidth | $R_{bw}$ | Hz | varies | Klatt-style bandwidth |
| Resonance amplitude | $R_a$ | linear | 1 = on curve | Relative to source |
| **Transformation** |||||
| Pitch transposition | $T_{pitch}$ | ratio | 0.5-2.0 | 0.5 = octave down |
| Timbre scaling | $T_{timbre}$ | ratio | 0.95-1.18 | Formant scaling |
| **Roughness/Growl** |||||
| Jitter variance | - | % of period | 3% | Cycle-to-cycle f0 variation |
| Shimmer variance | - | dB | 3 | Cycle-to-cycle amplitude |
| Sub-harmonics for growl | $N$ | count | 3 | Typical value |
| **Voice Quality** |||||
| Bandwidth coefficient | $\eta$ | - | 0-1 | 0=pure sinusoid, 1=pure noise |
| Formant bandwidth | $W$ | Hz | ~250 | Typical vocal tract |
| Phase excursion | $A$ | radians | ~$\pi$ | Formant phase influence |
| Vibrato rate | $R$ | Hz | 2-7 | Typical singing |
| Vibrato depth | $M$ | ratio | 0.05-0.3 | Typical range |

## Algorithms

### MFPA Algorithm (Maximally Flat Phase Alignment)
1. Define fundamental phase candidates $\phi_0$ in $[-\pi, \pi]$
2. For each candidate, apply time-shift $\Delta_t$ to each harmonic peak
3. Rotate phases: $\tilde{\phi}_{0,h} = \phi_{0,h} + 2\pi f_h \Delta_t$
4. Compute phase difference sum: $\phi_{diff} = \sum_h |\text{princarg}(\tilde{\phi}_{0,h+1} - \tilde{\phi}_{0,h})|$
5. Find $\phi_{min}$ (minimum of $\phi_{diff}$) - corresponds to pulse onset
6. Estimate onset time: $t_{MFPA} = t_{frame} + \text{princarg}(\phi_{min} - \phi_{0,0}) / (2\pi f_0)$

### Dynamic Programming for Pulse Sequence
1. Initialize: $e_{acum}(0) = 0$, $k_0 = 0$
2. Add onset at beginning if $t_0 = 0$
3. For each onset $k_i$, choose previous $k_{i-1}$ minimizing: $e_{acum}(k_{i-1}) + e_{MFPA}(k_i, k_{i-1})$
4. Add onset at signal end if needed

### EpR Model Estimation
1. Estimate harmonic spectral envelope $S_{harm}(f)$ by interpolating harmonics
2. Perform linear regression on harmonic peaks in log-frequency domain to get Gain, Slope, SlopeDepth
3. Compute source curve using exponential decay formula
4. Add source resonance below F1 if needed (low pitch voices)
5. Estimate vocal tract resonances as second-order filters
6. Compute residual envelope as difference between model and original spectrum

### WBVPM Analysis
1. Segment input into consecutive periods defined by pulse onsets
2. For each period T samples, use rectangular window of length N = T
3. Compute DFT - each bin k corresponds to k-th harmonic
4. Extract: $f_k = kf_s/T$, $a_k = |X(k)|$, $\theta_k = \angle X(k)$
5. Handle non-integer periods via periodization or upsampling

### Phase Concatenation
1. For each harmonic at boundary, compute ideal phase continuation
2. Calculate phase correction: $\Delta\phi_h^c = \text{princarg}(\phi'_{0,h,m} - 2\pi \frac{f'_{h,m-1} + f'_{h,m}}{2} \Delta_t - \phi'_{0,h,m-1})$
3. Time-shift right sample using fundamental phase difference
4. Spread correction across several frames for smooth transition

### Roughness Transformation
1. Transpose original signal down by factor $T_{pitch} = 1/N$
2. Create N delayed copies with random delays: $\Delta_i = iT_0 + X_i$
3. Scale each version by random gain (unity mean)
4. Overlap all versions to create irregular pulse pattern

### Growl Transformation
1. Add sub-harmonics at frequencies $f_0(h + (k+1)/4)$ for $h \in [0, H-1]$, $k \in \{0,1,2\}$
2. Set sub-harmonic phases: $\phi_h^k = \phi_h + (2\pi/(N+1))(k+1)p$
3. Apply automatic growl control based on F0 derivatives and energy

## Key Figures

- **Fig 1.1 (p.24):** Voice organ diagram showing source-filter model
- **Fig 1.3 (p.25):** Source-filter model with ARMA vocal tract
- **Fig 2.18 (p.51):** Formant to spectral-phase relation - phase flat under formants at pulse onset
- **Fig 2.19 (p.53):** Shape invariance - waveform shape independent of pitch
- **Fig 2.24 (p.56):** MFPA phase difference function - minimum indicates pulse onset
- **Fig 2.48 (p.82):** Blackman-Harris 92dB window characteristics
- **Fig 2.50 (p.85):** Harmonic mapping strategies comparing Mickey Mouse effect
- **Fig 2.70 (p.111):** WBVPM algorithm block diagram
- **Fig 2.107-2.110 (pp.159-160):** EpR model components (source curve, resonances, residual)
- **Fig 2.113 (p.163):** Envelope vs resonance interpolation - resonance preserves formant identity
- **Fig 3.2 (p.173):** Performance-based sampling synthesizer architecture
- **Fig 3.26 (p.203):** Concatenation smoothing effect on waveform discontinuities

## Results Summary

### MFPA Accuracy
- 76.27% of predictions within 10% of period
- 89.11% within 15% of period
- Mean errors: 0.032 (laryngograph-to-MFPA), -0.028 (MFPA-to-laryngograph)
- Tested on Keele Pitch Database (10 speakers, 22kHz)

### WBVPM Performance
- Residual 11.14 dB below standard sinusoidal model
- 4-5x real-time performance (13-1000 Hz range)
- Superior to narrow-band for transient/vibrato utterances

### Perceptual Evaluation (50 participants)
- Thesis synthesis rated higher than competing synthesizers
- Best example ("ansiedad male synth") convinced 34% of subjects it was real
- Expressiveness ~3.5/5 (real singers ~4/5)
- Naturalness approaching real singer performance

## Limitations

1. **Breathy transitions:** Audible discontinuities at breathy-to-non-breathy connections
2. **Fast transitions:** May exceed WBVPM quasi-stationary assumption
3. **Unvoiced handling:** MFPA relies on f0, not applicable to unvoiced regions
4. **Low f0:** Weak fundamental energy affects MFPA reliability
5. **Timbre realism:** Machine learning needed for more natural timbre modeling
6. **Expression modeling:** Requires manual control; HMM-based automation suggested as future work

## Relevance to Klatt Synthesis

### Direct References to Klatt
- "The most known system is the Klatt Formant Synthesizer (Klatt 1980)" (p.28)
- "Cascade structures are more suited for non-nasal voiced sounds, while parallel structures have found to be better for nasals, fricatives and stop-consonants" (p.28)
- EpR resonance filter explicitly "based on the Klatt formant synthesizer (Klatt 1980)" (p.159)

### Applicable Concepts

1. **Source-Filter Decomposition:** EpR model directly parallels Klatt's cascade/parallel architecture
2. **Formant Filters:** Same second-order resonator structure as Klatt formants
3. **Spectral Tilt:** EpR source curve models the -6dB/octave voice source decay
4. **Bandwidth Control:** Resonance bandwidth parameter matches Klatt's BW parameters
5. **Phase at GCI:** Shape invariance concept explains why Klatt's impulse response matters
6. **Aspiration Noise:** Bandwidth coefficient $\eta$ models breathiness similar to AH parameter

### Implementation Insights for Klatt

1. **Phase matters:** Formant phase relationships affect perceived naturalness
2. **19dB = pi rule:** Amplitude-to-phase correspondence for natural timbre
3. **GCI alignment:** Synthesis quality depends on proper pulse onset timing
4. **Residual envelope:** Captures spectral details not modeled by smooth resonances
5. **Inharmonicity:** Formants cause up to 50 cents frequency deviation during transitions

## Open Questions

1. How to handle machine-learned timbre models in real-time synthesis?
2. What is the minimum training data needed to capture a singer's expression style?
3. How to extend these concepts to instruments beyond voice?
4. Can MFPA be improved for very low f0 or highly creaky voice?
5. What is the optimal number of EpR residual anchor points?

## Related Work

### Essential Papers
- **Klatt 1980** - "Software for a cascade/parallel formant synthesizer" JASA
- **Fant 1986** - "Glottal flow: models and interaction" (LF model)
- **McAulay & Quatieri 1986** - "Speech Analysis/Synthesis based on Sinusoidal Representation"
- **Childers 1994** - "Measuring and Modeling Vocal Source-Tract Interaction"

### Concatenative Synthesis
- **Moulines & Charpentier 1989** - TD-PSOLA
- **Macon 1996** - Sinusoidal modeling for speech synthesis

### Singing Voice
- **Sundberg 1987** - "The Science of the Singing Voice"
- **Rodet 1984** - CHANT synthesis
- **Cook 1992** - SPASM physical model

### Phase Vocoder
- **Laroche & Dolson 1999** - Improved phase-vocoder time-scale modification

## Data Structures (for implementation reference)

```javascript
// Harmonic trajectory frame
{
  time: float,           // frame center time in seconds
  pitch: float,          // f0 in Hz
  harmonics: [{
    freq: float,         // harmonic frequency in Hz
    amp: float,          // amplitude (linear or dB)
    phase: float,        // phase in radians
    bandwidth: float     // noise bandwidth coefficient eta
  }],
  residual_envelope: float[]  // spectral envelope for noise component
}

// EpR voice model
{
  source: {
    gain_dB: float,
    slope: float,
    slopeDepth_dB: float
  },
  resonances: [{
    freq: float,         // R_f center frequency
    bandwidth: float,    // R_bw
    amplitude: float     // R_a relative to source curve
  }],
  residual: {
    anchor_freqs: float[],    // formant frequencies
    anchor_values_dB: float[] // residual values at anchors
  }
}

// Voice pulse (WBVPM)
{
  onset: float,          // pulse onset time in seconds
  period: float,         // T = 1/f0 for this pulse
  spectrum: {
    magnitude: float[],  // |X(k)| for k = 0..N/2
    phase: float[]       // angle(X(k)) for k = 0..N/2
  }
}

// Transformation parameters
{
  pitch_scale: float,    // T_pitch
  timbre_scale: float,   // T_timbre
  time_scale: float,     // duration modification
  spectral_tilt: float   // brightness adjustment dB/octave
}
```

## Glossary

- **EpR:** Excitation plus Resonances - spectral voice model
- **GCI:** Glottal Closure Instant - moment of vocal fold closure
- **MFPA:** Maximally Flat Phase Alignment - GCI estimation algorithm
- **NBVPM:** Narrow-Band Voice Pulse Modeling - multi-period window analysis
- **WBVPM:** Wide-Band Voice Pulse Modeling - single-period analysis
- **Shape Invariance:** Waveform shape at pulse onsets independent of pitch
- **princarg:** Principal argument function mapping phase to $[-\pi, \pi]$
