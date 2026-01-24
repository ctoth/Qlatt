# Vocal Quality Factors: Analysis, Synthesis, and Perception

**Authors:** D. G. Childers, C. K. Lee
**Year:** 1991
**Venue:** Journal of the Acoustical Society of America, Vol. 90, No. 5, pp. 2394-2410
**DOI:** 10.1121/1.401349

## One-Sentence Summary
Identifies four key glottal source factors (pulse width, pulse skewness, closure abruptness, turbulent noise) that characterize voice quality types and develops a new LF-based source model with turbulent noise for synthesizing natural-sounding speech with selectable vocal qualities.

## Problem Addressed
Existing source excitation models for formant synthesizers lack the ability to synthesize different voice qualities (modal, vocal fry, falsetto, breathy) with perceptually natural results. Need controllable parameters that map to physiological and perceptual characteristics.

## Key Contributions
1. Systematic analysis of four voice types using speech and EGG signals
2. Identification of four major glottal factors for vocal quality
3. New source excitation model combining LF glottal pulse generator with turbulent noise
4. Perceptual validation of source parameters for voice quality synthesis

## Voice Types Studied

| Voice Type | F0 Range (Male) | F0 Range (Female) | Characteristics |
|------------|-----------------|-------------------|-----------------|
| Modal | 94-287 Hz | 144-538 Hz | Normal, medium pitch |
| Vocal Fry | 24-52 Hz | 18-46 Hz | Low pitch, rough, pulsed |
| Falsetto | 275-634 Hz | 495-1131 Hz | High pitch, flutelike |
| Breathy | Wide range | Wide range | Friction noise, incomplete closure |

## Key Equations

### Two-Pole Glottal Model (Modal/Vocal Fry)
$$
U_g(z) = \frac{K}{(1 - z_a z^{-1})(1 - z_b z^{-1})}
$$
- Produces -12 dB/octave spectral slope
- $z_a$, $z_b$ are real poles inside unit circle

### Three-Pole Model (Falsetto/Breathy)
$$
U_g(z) = \frac{K}{(1 - z_a z^{-1})(1 - z_b z^{-1})(1 - z_c z^{-1})}
$$
- Produces -18 dB/octave spectral slope
- For falsetto/breathy: $z_a = 1.0$, $z_b$ varies 0.2-0.9, $z_c$ added

### LF Model Equations
Opening phase (0 < t < t_e):
$$
u'_g(t) = A e^{\alpha t} \sin(\omega_g t)
$$
Where $\omega_g = \pi / t_p$

Return phase (t_e < t < t_0):
$$
u'_g(t) = \frac{u'_g(t_e)}{\epsilon t_a} \left( e^{-\epsilon(t-t_e)} - e^{-\epsilon(t_0-t_e)} \right)
$$

### Open Quotient (LF Model)
$$
OQ_{LF} = \frac{t_e + k \cdot t_a}{t_0}
$$
Where k = 2.0-3.0 when 0% < t_a < 10%

### Speed Quotient (LF Model)
$$
SQ_{LF} = \frac{t_p}{t_e + k \cdot t_a - t_p}
$$

### Harmonic Richness Factor
$$
HRF = \frac{\sum_{i \geq 2} H_i}{H_1}
$$
Where $H_i$ = amplitude of ith harmonic

### Noise-to-Harmonic Ratio (High Frequency)
$$
NHR_h = \frac{\sum N_i}{\sum H_i} \quad \text{(above 2 kHz)}
$$

### Waveform Peak Factor
$$
WPF = \frac{\max(|x_i|)}{\left[ \frac{1}{N} \sum_{i=1}^{N} x_i^2 \right]^{1/2}}
$$

## Parameters

| Parameter | Symbol | Voice Type | Typical Value | Notes |
|-----------|--------|------------|---------------|-------|
| Open Quotient | OQ | Modal | 0.70 | Medium |
| Open Quotient | OQ | Vocal Fry | 0.45 | Short |
| Open Quotient | OQ | Falsetto | 0.99 | Long |
| Open Quotient | OQ | Breathy | 0.91 | Long |
| Speed Quotient | SQ | Modal | 2.6 | Medium |
| Speed Quotient | SQ | Vocal Fry | 3.5 | High |
| Speed Quotient | SQ | Falsetto | 1.5 | Low |
| Speed Quotient | SQ | Breathy | 1.4 | Low |
| Closure Abruptness | t_a | Modal | 2.0% | Abrupt |
| Closure Abruptness | t_a | Vocal Fry | 0.7% | Very abrupt |
| Closure Abruptness | t_a | Falsetto | 8.8% | Progressive |
| Closure Abruptness | t_a | Breathy | 8.4% | Progressive |
| Spectral Slope | - | Modal | -12 dB/oct | Two-pole |
| Spectral Slope | - | Vocal Fry | -6 dB/oct | Slight |
| Spectral Slope | - | Falsetto | -18 dB/oct | Steep |
| Spectral Slope | - | Breathy | -18 dB/oct | Steep |
| HRF | - | Modal | -9.9 dB | Medium |
| HRF | - | Vocal Fry | 2.1 dB | High |
| HRF | - | Falsetto | -19.1 dB | Low |
| HRF | - | Breathy | -16.7 dB | Low |
| NHR_h | - | Modal | -5.3 dB | Low noise |
| NHR_h | - | Falsetto | -6.6 dB | Low noise |
| NHR_h | - | Breathy | 2.8 dB | High noise |
| WPF | - | Modal | 2.8 | Medium |
| WPF | - | Vocal Fry | 4.0 | High (pulsed) |
| WPF | - | Falsetto | 1.8 | Low (sinusoidal) |

### Turbulent Noise Parameters
| Parameter | Symbol | Typical Value | Description |
|-----------|--------|---------------|-------------|
| Noise onset | T_n | 75% of pitch period | Location in cycle |
| Duty cycle | D_n | 50% | Duration of noise |
| Noise energy ratio | A_n | 0.25% | Noise/pulse energy |
| HP filter cutoff | F_n | 2 kHz | 3-dB frequency |

## Implementation Details

### Two-Pass Inverse Filtering Method
1. **First pass**: Fixed-frame LP analysis → LP error signal q_1(n)
2. **Peak detection**: Find main pulses (glottal closure instants)
3. **Second pass**: Pitch-synchronous covariance LP analysis
4. Analysis interval: Start 1 sample after main pulse, ~35% of pitch period
5. **Formant refinement rules**:
   - Discard roots with F < 250 Hz
   - Discard roots with BW > 500 Hz
   - Merge adjacent roots

### Source Model Architecture
```
LF Glottal Waveform Model
         ↓
    [t_p, t_e, t_a, t_0]
         ↓
    Pulse Generator ──────┐
                          ├─→ [+] → Output
Random Noise → HP Filter → Amplitude Modulation
              (2 kHz)      (T_n, D_n, A_n)
```

### Turbulent Noise Generator
1. Random number generator (normal distribution, flat spectrum)
2. High-pass filter (3-dB at 2 kHz)
3. Amplitude modulation (pitch-synchronous square wave)
4. Parameters: T_n (onset), D_n (duty cycle), A_n (amplitude)

## Perceptual Findings

### Hypo-/Hyperfunction (Vocal Effort)
- **High SQ (7.3)**: Perceived as tense/hyperfunctional
- **Low SQ (1.2)**: Perceived as lax/hypofunctional
- **Normal SQ (3.0)**: Perceived as normal voice quality
- OQ not useful for predicting hypo-/hyperfunction

### Breathiness Synthesis
1. Amplitude modulation of noise is **critical** for naturalness
2. Duty cycle D_n ≈ 50% preferred
3. Noise onset T_n ≈ 75% (near glottal closure) sounds most natural
4. High-pass filtering not critical (low-freq noise masked by harmonics)
5. Breathiness correlates strongly with NHR_h (above 2 kHz)

## Figures of Interest
- **Fig. 2 (p. 3)**: EGG, DEGG, and LP residual alignment showing closure detection
- **Fig. 5 (p. 5)**: Glottal spectra with two-pole model fits for all voice types
- **Fig. 7 (p. 6)**: First 10 harmonics showing HRF differences
- **Fig. 11 (p. 10)**: EGG/DEGG waveforms for all four voice types
- **Fig. 12 (p. 11)**: LF model waveform parameters
- **Fig. 13 (p. 12)**: Glottal waveform, derivative, and speech alignment
- **Fig. 14 (p. 12)**: Inverse-filtered waveforms matched with LF model
- **Fig. 15 (p. 13)**: Block diagram of new source model

## Results Summary
- Four factors characterize voice quality: pulse width (OQ), pulse skewness (SQ), closure abruptness (t_a), turbulent noise (NHR_h)
- Two-pole model adequate for modal/vocal fry; three-pole needed for falsetto/breathy
- LF model can approximate wide range of glottal waveforms
- Perceptual tests validated that SQ controls perceived vocal effort
- Turbulent noise parameters (T_n, D_n, A_n) enable breathy voice synthesis

## Limitations
- Only sustained vowels /i/ and /o/ tested perceptually
- Connected speech synthesis "involved additional factors not part of this study"
- Only 3 expert judges used for perceptual evaluation
- Vocal fry and falsetto synthesis "require parameters not primary interest of this study" (F0, perturbations, multiple pulses)
- EGG-based OQ estimates underestimate for falsetto/breathy (progressive closure)

## Relevance to Qlatt Project
- **Direct application**: LF model parameters (t_p, t_e, t_a) for voice quality control
- **Turbulent noise**: Implementation pattern for breathiness in parallel branch
- **Spectral slope**: Two-pole vs three-pole models explain need for AV (voicing amplitude) control
- **OQ/SQ ranges**: Concrete parameter values for different voice qualities
- **NHR measurement**: Could add as diagnostic feature

## Open Questions
- [ ] How do LF parameters vary in connected speech?
- [ ] Best way to transition between voice qualities during synthesis?
- [ ] Relationship between LF parameters and Klatt AV, OQ, TL parameters?

## Related Work Worth Reading
- Fant et al. (1985) - Original LF model paper
- Klatt & Klatt (1990) - Voice quality variations (already have)
- Rosenberg (1971) - Effect of glottal pulse shape on vowel quality
- Holmes (1973) - Influence of glottal waveform on parallel synthesizer
