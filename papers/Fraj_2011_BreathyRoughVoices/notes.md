# Synthesis of Breathy and Rough Voices with a View to Validating Perceptual and Automatic Glottal Cycle Pattern Recognition

**Authors:** S. Fraj, F. Grenez, J. Schoentgen
**Year:** 2011
**Venue:** 7th International Workshop on Models and Analysis of Vocal Emissions for Biomedical Applications (MAVEBA), Florence
**Affiliation:** L.I.S.T, Faculty of Applied Sciences, Université Libre de Bruxelles; National Fund for Scientific Research, Belgium

## One-Sentence Summary

Provides equations and parameter values for synthesizing breathy and rough (dysphonic) voices via frequency jitter modulation and pulsatile glottal noise addition, with a corpus of 21 test stimuli at known jitter/noise levels.

## Problem Addressed

How to synthesize controlled dysphonic voice qualities (breathiness, roughness) for validating perceptual ratings and automatic voice analysis software, with exact knowledge of the underlying perturbation parameters.

## Key Contributions

1. **Frequency jitter model**: Sample-by-sample phase perturbation formula for generating cycle-to-cycle frequency variations
2. **Pulsatile noise model**: Breathiness via noise modulated by glottal volume velocity (not constant aspiration)
3. **Parameter corpus**: 21 stimuli with 7 jitter levels × 3 noise levels, with measured jitter% and SNR values
4. **Shimmer via modulation**: Amplitude perturbations emerge naturally from frequency jitter through vocal tract filtering

## Synthesizer Architecture

### Three-Module Design (Fig. 1)

```
(A) Initialization     (B) Glottal Source      (C) Acoustic Propagation
─────────────────      ────────────────────    ─────────────────────────
Klatt glottal area  →  Harmonic driving    →  Trachea (36 cylinders)
template               functions               - 1.2 cm² cross-section
        ↓                     ↓
Fourier coeffs      →  Wave-shaping        →  Vocal tract (40-45 cyl)
        ↓              polynomials              - Vowel-dependent areas
Polynomial coeffs   →  Glottal area        →  Lip radiation
                       waveform                      ↓
                            ↓                   Speech signal
                       Aerodynamic model
                       (volume velocity)
```

### Sampling Rates
- Module B top: 176 kHz
- Module B bottom: 88 kHz

## Key Equations

### Frequency Jitter (Equation 1)

$$
\theta(n) = \theta(n-1) + 2\pi f_0 \Delta + 2\pi b \xi(n)
$$

$$
\xi(n) = \begin{cases} +1, & p = 0.5 \\ -1, & p = 0.5 \end{cases}
$$

Where:
- $\theta(n)$ = instantaneous phase at sample n
- $f_0$ = unperturbed vocal frequency (Hz)
- $\Delta$ = sampling step (seconds)
- $b$ = jitter control parameter (higher = more jitter)
- $\xi(n)$ = random ±1 with equal probability

**Effect**: Small sample-by-sample phase perturbations accumulate over one cycle → observed cycle length perturbations (jitter). Also causes minor glottal area shape perturbations.

### Pulsatile Noise / Breathiness (Equation 2)

$$
\text{noisy\_velocity}(n) = u_g(n) + n_1 \cdot u_g(n-d) \cdot \text{noise}(n) + n_2
$$

Where:
- $u_g(n)$ = clean glottal volume velocity
- $n_1$ = pulsatile noise coefficient (controls breathiness level)
- $n_2$ = constant aspiration noise offset (small)
- $d$ = delay (1 ms)
- noise(n) = low-pass filtered white Gaussian noise (fixed σ)

**Key insight**: Pulsatile noise (proportional to volume velocity) sounds more natural than constant aspiration noise because strong stationary noise segregates perceptually from the voice.

### Amplitude Shimmer

Not synthesized directly - emerges naturally from frequency jitter via **modulation distortion**:
- Frequency perturbations shift harmonics on frequency axis
- Non-flat vocal tract transfer function converts frequency shifts to amplitude changes
- Result: cycle-to-cycle amplitude perturbations (shimmer)

## Parameters

| Parameter | Symbol | Units | Range | Notes |
|-----------|--------|-------|-------|-------|
| Jitter control | b | - | 0.315 - 4.5 | Higher = more jitter |
| Pulsatile noise | n₁ | - | 0.15 - 0.55 | Higher = more breathiness |
| Aspiration noise | n₂ | - | small | Constant offset |
| Base F0 | f₀ | Hz | 100 | Default for corpus |
| Noise delay | d | ms | 1 | Delay before adding noise |
| Trachea ducts | - | - | 36 | Fixed count |
| Trachea area | - | cm² | 1.2 | Constant cross-section |
| Vocal tract ducts | - | - | 40-45 | Vowel dependent |

### Corpus Parameter-to-Measurement Mapping (Table 1)

| b | n₁ | Jitter (%) | SNR (dB) |
|---|-----|------------|----------|
| 0.315 | 0.15 | 2.6 | 28.8 |
| 0.315 | 0.35 | 2.5 | 23.5 |
| 0.315 | 0.55 | 2.6 | 17.5 |
| 0.63 | 0.15 | 4.5 | 30.0 |
| 0.63 | 0.35 | 5.3 | 22.7 |
| 0.63 | 0.55 | 5.6 | 18.5 |
| 1.26 | 0.15 | 9.5 | 29.4 |
| 1.26 | 0.35 | 8.8 | 21.7 |
| 1.26 | 0.55 | 10.0 | 17.4 |
| 1.89 | 0.15 | 14.7 | 28.8 |
| 1.89 | 0.35 | 14.7 | 22.9 |
| 1.89 | 0.55 | 15.7 | 19.2 |
| 2.52 | 0.15 | 21.9 | 29.4 |
| 2.52 | 0.35 | 20.4 | 22.2 |
| 2.52 | 0.55 | 20.9 | 18.6 |
| 3.45 | 0.15 | 24.4 | 29.6 |
| 3.45 | 0.35 | 24.1 | 22.7 |
| 3.45 | 0.55 | 27.2 | 17.7 |
| 4.5 | 0.15 | 31.4 | 29.2 |
| 4.5 | 0.35 | 31.6 | 22.0 |
| 4.5 | 0.55 | 35.8 | 18.5 |

**Observations**:
- Jitter % scales roughly linearly with b (2.6% at b=0.315 → 35.8% at b=4.5)
- SNR decreases ~11 dB as n₁ goes from 0.15 to 0.55
- Even "very breathy" voices have high glottal SNR (>17 dB) because:
  - Lip radiation boosts high frequencies (noise is broadband)
  - Pulsatile noise is only strong during open phase

## Implementation Details

### Wave-Shaping for Glottal Area

1. Start with Klatt glottal area template
2. Compute Fourier series coefficients of template
3. Linear transform to polynomial coefficients
4. During synthesis: drive polynomials with harmonic functions
5. Driving amplitude = 1 → template shape
6. Driving amplitude → 0 → quasi-sinusoidal → constant

### Tracking True Cycle Lengths

Cannot predict cycle lengths exactly due to stochastic components. Instead:
1. Track phase θ of harmonic driving functions
2. Cycle onset = when phase resets from 2π to 0
3. Cycle length = samples between successive onsets

### Computing True SNR

$$
\text{SNR (dB)} = 10 \log_{10} \frac{\sum u_g^2(n)}{\sum \text{noise}^2(n)}
$$

Sum clean velocity² and noise² separately over signal length.

## Figures of Interest

- **Figure 1 (p.135)**: Synthesizer block diagram - shows three modules A/B/C
- **Figure 2 (p.136)**: Glottal area and volume velocity waveforms - two cycles
- **Figure 3 (p.137)**: Extremely hoarse voice (b=4.5, n₁=0.55) - shows phase perturbations and noisy volume velocity

## Relevance to Qlatt

### Implementing Jitter

Current Klatt synthesis likely uses fixed F0 per frame. To add jitter:

```javascript
// Per-sample phase accumulator with jitter
function updatePhase(theta, f0, sampleRate, jitterParam) {
  const delta = 1 / sampleRate;
  const xi = Math.random() < 0.5 ? 1 : -1;  // ±1 with equal probability
  return theta + 2 * Math.PI * f0 * delta + 2 * Math.PI * jitterParam * xi;
}
```

**Jitter parameter mapping** (from Table 1):
- Normal voice: b ≈ 0 (no jitter)
- Mild disorder: b ≈ 0.3-0.6 (2-5% jitter)
- Moderate: b ≈ 1.3-1.9 (9-15% jitter)
- Severe: b ≈ 2.5-4.5 (20-35% jitter)

### Implementing Pulsatile Breathiness

More natural than Klatt's AH (constant aspiration):

```javascript
// Pulsatile noise - modulated by glottal flow
function addPulsatileNoise(volumeVelocity, n1, n2, delayedVelocity, noise) {
  return volumeVelocity + n1 * delayedVelocity * noise + n2;
}
```

**Breathiness parameter mapping**:
- Normal: n₁ ≈ 0 (no pulsatile noise)
- Mild breathy: n₁ ≈ 0.15 (SNR ~29 dB)
- Moderate: n₁ ≈ 0.35 (SNR ~22 dB)
- Severe: n₁ ≈ 0.55 (SNR ~18 dB)

### Shimmer for Free

If jitter is implemented via frequency modulation, shimmer emerges automatically through vocal tract filtering. No need for separate shimmer parameter.

### Key Design Insight

Pulsatile noise >> constant aspiration for natural breathiness:
- Constant noise perceptually segregates from voice (sounds like two sources)
- Pulsatile noise stays integrated with voice (sounds like one breathy voice)

## Limitations

1. Only sustained vowel [a] tested
2. No connected speech
3. No diplophonia/biphonation (unusual dynamics excluded)
4. Fixed F0 = 100 Hz
5. Short paper - minimal implementation details

## Open Questions

- [ ] How does pulsatile noise interact with Klatt's existing AH parameter?
- [ ] What low-pass filter cutoff for the noise?
- [ ] How to scale jitter parameter b for different F0 values?
- [ ] Does the 1ms noise delay matter perceptually?

## Related Work Worth Reading

- Klatt (1980) - Cascade/parallel formant synthesizer (glottal area template source)
- Schoentgen (2001) - Stochastic models of jitter
- Schoentgen (2003a) - Shaping function models of phonatory excitation
- Schoentgen (2003b) - Spectral models of additive and modulation noise
- Titze (2006) - Myoelastic aerodynamic theory of phonation
