# Flexible Formant Synthesizer: A Tool for Improving Speech Production Quality

**Authors:** Ajit L. Lalwani (Advisor: D. G. Childers)
**Year:** 1992
**Venue:** Ph.D. Dissertation, University of Florida
**DOI/URL:** N/A

## One-Sentence Summary

A comprehensive extension of Klatt's cascade/parallel formant synthesizer with flexible architecture, multiple glottal source models, and improved procedures for matching cascade and parallel filter bank responses.

## Problem Addressed

Current formant synthesizers (Klatt, Holmes) produce speech rated as "buzzy," "bassy," "metallic," or "monotonic" due to:
1. Limited flexibility in parameter specification and architecture
2. Overly simplified glottal source models
3. Smooth formant transitions that ignore fast transitions in natural speech
4. Inadequate scale factor methods for parallel filter bank matching

## Key Contributions

- 62 control and filter bank parameters for fine-grained synthesis control
- Multiple glottal source models (9 types) controlling time-domain factors (pitch, skewness, width, closure abruptness, jitter, shimmer) and frequency-domain factors (spectral tilt, HRF, HNR)
- Flexible filter bank configuration: variable number of filters, switchable cascade/parallel operation
- New procedure for matching cascade filter bank response with parallel filter bank (superior to Klatt's scale factors)
- Algorithm for creating "zeros" (anti-formants) in parallel filter bank magnitude response
- Source-tract interaction simulation via f1/b1 modulation during glottal open-phase
- Click/pop detection and removal algorithms

## Methodology

### Approach

Based on acoustic theory of speech production (Fant, 1960):
$$P(f) = S(f) \cdot T(f) \cdot R(f)$$

Where:
- S(f) = Source volume-velocity spectrum
- T(f) = Vocal tract transfer function
- R(f) = Radiation characteristics
- P(f) = Radiated sound pressure

### Synthesizer Architecture

Three configurations selectable via `arch_typ` parameter:
1. Cascade only
2. Parallel only
3. Cascade/parallel (Klatt default)

## Key Equations

### Digital Resonator (Impulse Invariant Transform)

$$y(nT) = A \cdot x(nT) + B \cdot y(nT-T) + C \cdot y(nT-2T)$$

Coefficients:
$$C = e^{-2\pi BW \cdot T}$$
$$B = 2e^{-\pi BW \cdot T} \cos(2\pi FT)$$
$$A = 1 - B - C$$

### Digital Anti-Resonator

$$y(nT) = A' \cdot x(nT) + B' \cdot x(nT-T) + C' \cdot x(nT-2T)$$

Coefficients:
$$A' = 1.0/A$$
$$B' = -B/A$$
$$C' = -C/A$$

### First Order Systems

FIR filter: $y(n) = x(n) + a \cdot x(n-1)$
IIR filter: $y(n) = x(n) + a \cdot y(n-1)$

## Parameters

### Control Parameters

| Name | Symbol | Units | Min | Typical | Max | Notes |
|------|--------|-------|-----|---------|-----|-------|
| Sampling rate | sam_rat | Hz | 5000 | 10000 | 20000 | |
| Frame size | frame_size | samples | 0 | 50 | 256 | 50 samples @ 10kHz = 5ms |
| Architecture type | arch_typ | - | 1 | 3 | 3 | 1=cascade, 2=parallel, 3=both |
| Glottal source type | src_typ | - | 1 | 7 | 9 | Multiple source models |
| Fundamental frequency | f0 | Hz | 0 | - | 500 | Pitch control |
| Voicing amplitude | av | dB | 0 | - | 80 | 60 dB = strong, 0 = off |
| Aspiration noise | ah | dB | 0 | - | 80 | |
| Frication noise | af | dB | 0 | - | 80 | |
| Overall volume | g0 | dB | 0 | - | 500 | |

### Formant Parameters (Male Voice)

| Formant | Freq Min | Freq Typ | Freq Max | BW Min | BW Typ | BW Max |
|---------|----------|----------|----------|--------|--------|--------|
| F1 | 150 | 450 | 900 | 40 | 50 | 500 |
| F2 | 500 | 1450 | 2500 | 40 | 70 | 500 |
| F3 | 1300 | 2450 | 3500 | 40 | 110 | 500 |
| F4 | 2500 | 3300 | 4500 | 100 | 250 | 500 |
| F5 | 3500 | 3750 | 4900 | 150 | 200 | 700 |
| F6 | 4000 | 4900 | 4999 | 200 | 1000 | 2000 |

### Nasal Parameters (Fixed)

| Name | Freq | BW | Notes |
|------|------|-----|-------|
| Nasal pole (FNP) | 270 Hz | 250 Hz | Resonator and anti-resonator equal to cancel for non-nasal |
| Nasal zero (FNZ) | 270 Hz | 250 Hz | Shift to 450 Hz for nasal murmur |

### First Order Filter Coefficients

| Name | Min | Typical | Max | Purpose |
|------|-----|---------|-----|---------|
| g_filt | -1.0 | -1.0 | 1.0 | FOS with glottal source (radiation) |
| n_filt | -1.0 | 0.0 | 1.0 | FOS with noise source |
| o_filt | -1.0 | 0.0 | 1.0 | FOS at output |
| ph_filt | -1.0 | -1.0 | 1.0 | Highpass in parallel bank |
| pl_filt | -1.0 | 0.99 | 1.0 | Lowpass in parallel bank |

### Source-Tract Interaction

| Name | Min | Typical | Max | Purpose |
|------|-----|---------|-----|---------|
| ST_FRAME | 0 | 0 | 1 | Abrupt f1/b1 change |
| ST_SMP | 0 | 0 | 1 | Smooth f1/b1 change |
| for_frq | 0.0 | 1.2 | 2.0 | Fractional f1 change during open-phase |
| for_bw | 0.0 | 1.2 | 2.0 | Fractional b1 change during open-phase |
| op | 0.0 | 0.8 | 1.0 | Open-phase duration fraction |

## Implementation Details

### Filter Bank Configuration

**Cascade filter bank processing order:**
f8 -> f7 -> f5 -> f4 -> f3 -> f2 -> f1 (series connection)

**Parallel filter bank routing:**
- Voicing source: f1 (with a1 gain), f7/nasal (with a7 gain)
- First differenced source: f2, f3, f4, f5 (with respective gains)
- Frication source: f6 (with a6 gain), f9/bypass (with a9 gain)

### Creating Anti-formants in Parallel Filter Bank

Anti-resonators cannot create zeros in parallel configuration due to high-frequency skirt response. Instead:
- **Same polarity (+1, +1)**: Creates anti-formant (zero) between the two poles
- **Opposite polarity (+1, -1)**: No anti-formant, cascade-like behavior

For voiced sounds, alternate +1 and -1 to avoid spurious anti-formants.

### Cascade-Parallel Matching (New Procedure)

For resonators in parallel bank matching cascade:
1. Compute scale factor = negative of Q factor value
2. Set amplitude control parameters to 0 dB for voiced sounds
3. Alternate initial phase (+1, -1) between adjacent resonators

This produces better match than Klatt's original scale factors, especially when formant frequencies shift significantly.

### Plosive Burst Implementation

When "ah" or "af" suddenly increases by 50 dB:
1. Do NOT interpolate - set gain instantaneously
2. Add exponentially decaying pulse (time constant = step_size parameter)
3. Simulates burst of air flow at plosive release

### Nasal Sound Synthesis

**For nasal murmur:**
- Shift nasal anti-resonator from 250 Hz to 450 Hz
- Set nasal resonator amplitude to ~60 dB (Klatt's rules) or 0 dB (new procedure)

**For nasalized vowels:**
- Increase F1 by 100 Hz
- Set nasal anti-resonator frequency = average(250 Hz, F1)

### Mixed Excitation (Voiced Fricatives/Plosives)

- Both f0/av AND ah/af nonzero
- Noise source amplitude modulated pitch-synchronously
- Three-part AM waveform: amp1, amp2, offset, dur parameters

### Fricative Synthesis

- Set a1 = 0 dB (F1 not excited by frication)
- Use F6 for sibilants (/s/, /sh/, /z/, /zh/)
- Use bypass path for /f/, /v/, /theta/, /delta/, /p/, /b/ (flat spectrum)

## Figures of Interest

- **Fig 2-3 (p40):** Full block diagram of flexible formant synthesizer
- **Fig 2-4a (p47):** Klatt's cascade/parallel formant synthesizer block diagram
- **Fig 2-4b (p48):** Holmes' all-parallel formant synthesizer block diagram
- **Fig 2-11 (p72):** Default filter bank configurations
- **Fig 2-13 (p69):** Effect of polarity on parallel resonators (creating zeros)
- **Fig 2-14 (p72-73):** Comparison of cascade-parallel matching methods
- **Fig 2-19 (p86):** Spectrogram comparison: natural vs synthesized "We were away a year ago"

## Results Summary

- Synthesizer can match Klatt's cascade/parallel or Holmes' all-parallel configuration via parameters
- New cascade-parallel matching procedure produces better spectral match than Klatt's scale factors
- Visual spectrogram comparison shows good match of formant tracks and duration
- Formal listening tests used for quality assessment (no quantitative synthesizer assessment method found in literature)

## Limitations

- Scale factor method inadequate when center frequencies have large shifts
- Klatt's rules don't consider relative bandwidth shifts
- Scale factor method requires exactly five resonators for 5 KHz bandwidth
- Speech still sounds "smooth" due to piece-wise linear parameter variation
- No quantitative method for assessing synthesizer performance

## Relevance to TTS Systems

### Formant Synthesis
- Complete parameter set reference for Klatt-type synthesizers (62 parameters)
- Improved cascade-parallel matching for hybrid synthesis
- Anti-formant creation in parallel bank via polarity control

### Voice Quality
- Time-domain glottal factors: pitch, skewness, width, closure abruptness, jitter, shimmer
- Frequency-domain factors: spectral tilt, HRF, HNR
- Source-tract interaction simulation via f1/b1 modulation

### Consonant Synthesis
- Plosive burst via exponential decay (step_size parameter)
- VOT implementation: nonzero ah/af with zero f0/av, then switch
- Voice-bar: low-energy glottal pulses during closure
- Mixed excitation with pitch-synchronous AM noise

### Nasal Synthesis
- Pole-zero pair at 270 Hz, 250 Hz BW
- Shift anti-resonator to 450 Hz for nasal murmur
- For nasalized vowels: F1+100 Hz, anti-resonator at average(250, F1)

## Open Questions

- [ ] How do the 9 glottal source models (src_typ 1-9) differ in detail?
- [ ] What are the exact AM waveform parameters (amp1, amp2, offset, dur) for voiced fricatives?
- [ ] How is the Q-factor computed for the new cascade-parallel matching procedure?
- [ ] What are the click/pop detection and removal algorithms?
- [ ] Time and frequency scaling algorithms mentioned but not detailed in these pages

## Related Work Worth Reading

- Klatt (1980) - Original cascade/parallel formant synthesizer
- Klatt and Klatt (1990) - Updated synthesizer with voice quality modeling
- Holmes (1983), Holmes et al. (1990) - All-parallel formant synthesizer
- Fant (1960) - Acoustic theory of speech production
- Flanagan (1957, 1972) - Vocal tract transfer function formulations
- Peterson and Barney (1952) - Canonical vowel formants
- Childers and Wu (1990) - Stylized pulses for LPC, quality assessment
- Gold and Rabiner (1968) - Impulse invariant transform for resonator coefficients
- Klatt (1987) - Minimum and inherent durations table
