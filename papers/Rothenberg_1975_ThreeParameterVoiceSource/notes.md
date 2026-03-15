# Implementation Notes: Rothenberg et al. (1975) — A Three-Parameter Voice Source

## Overview

A "black box" analog circuit model of the glottal source with three physiologically-motivated control parameters. Precursor to later parametric models (LF, CALM). The key insight is that three high-level neurological commands (frequency, loudness, tightness) can drive a simple circuit to produce naturally-varying glottal waveforms without explicitly modeling vocal fold mechanics.

## The Three Control Parameters

### F — Frequency
- Controls fundamental frequency linearly
- Increasing F also slightly reduces pulse amplitude (simulates effect of increased longitudinal vocal cord tension)
- Optional: F can vary slightly with L to simulate subglottal pressure dependence on F0 (not used in reported experiments)
- No jitter modeled explicitly, but additive noise introduces some aperiodicity

### L — Loudness
- Corresponds approximately to subglottal pressure (Psg)
- Six equally spaced steps correspond roughly to Psg values: 2.5, 5, 7.5, 10, 12.5, 15 cm H2O
- Typical conversational value: ~8 cm H2O (approximately half of maximum)
- **Key waveform effect:** Increasing L makes pulses narrower with steeper closing phase
- Peak-to-peak amplitude increases only slightly (less than percentage increase in Psg)
- Intensity change is mainly spectral, not amplitude — higher L increases energy ratio in F2/F3 region relative to mean airflow
- L changes for consonants are approximately twice as fast as glottal/subglottal dynamics

### T — Tightness
- Corresponds to "glottal abduction" and "laryngeal closure" (Lindqvist 1972)
- Similar to Ladefoged's (1973) "glottal stricture" dimension
- Increasing T from zero: simulates glottal adduction until voicing position is reached
- Further increase: simulates "laryngeal closure" (tight voice → creak → cessation of oscillation)
- **Waveform effects at varying T (from breathy to tight):**
  - Very low T: near-sinusoidal oscillation, folds don't contact, increased noise
  - Low T: broad, smooth pulses, DC offset (incomplete posterior closure), little energy above 4th-5th harmonic
  - Normal T (4th trace from bottom in Fig. 4): typical modal voice
  - High T: smaller, narrower pulses
  - Higher T: period lengthens, then irregular low-frequency pulses
  - Maximum T: oscillation ceases entirely
- Normalized waveform changes with T are similar to changes with L (expected: pressure-induced loudness increase includes increased adduction)

## Circuit Model (Fig. 1)

Basic circuit: RC lowpass filter (R1, C) with two diode branches.

### Operation
1. **Rising phase:** When diodes D1 and D2 are not conducting (V2 > [V1 + VB] and V2 > 0), the lowpass filter R1C produces sinusoidal output smaller than input, delayed up to 1/4 cycle
2. **Falling phase:** When V2 > [V1 + VB], diode D1 conducts through R2, causing V2 to fall more rapidly than it rose
3. **Closed phase:** When V2 goes negative, D2 conducts and holds V2 just below zero (glottis closed)
4. **Opening phase:** V2 stays zero until [V1 + VB] becomes positive again, then rises slowly controlled by R1C time constant

### Enhancements to basic circuit
- R2-D1 branch replaced by more complex resistor-diode network to improve falling segment shape
- Added derivative component: 1.8 x 10^-4 * dV2/dt to steepen closing phase termination (constant chosen by informal listening as minimum for adequate high-frequency energy)
- Filtered Gaussian noise added to simulate glottal noise
- Some source-tract interaction effects present (from inverse-filtered reference waveforms) but not modeled: F1-frequency oscillations in rising phase, vowel-dependent differences

### Parameter-to-circuit mapping
- **F:** Controls frequency of input sinusoid V1
- **L:** Controls amplitude of V1 (small changes produce waveform changes similar to Psg variation)
- **T:** Controls DC voltage VB:
  - VB negative → smaller, narrower pulses (tighter adduction)
  - VB positive → larger, broader pulses (more abducted)

## Synthesis Rules (with OVE III)

Used smoothed step commands (Liljencrants 1971). Key rules demonstrated on "He eats what Heddy heated":

### Constituent boundaries
- Brief positive T command → simulated glottal stop gesture
- Lowers pulse amplitude and frequency, as in natural speech
- Used for disambiguation (e.g., "an ice man" vs "a nice man")

### [h] allophony
- [h] always associated with moderately negative-going step in T
- Post-pausal/post-voiceless: results in voiceless [h]
- Intervocalic/voiced context: results in voiced [h]
- Coarticulation handled naturally by the T dynamics

### Unvoiced stops
- During occlusion: T set low (voiceless) + L lowered → zero source output
- Time constants for articulatory-driven changes ~2x faster than glottal/subglottal dynamics
- Release: L raised → aspiration if T stays constant; voicing if T raised simultaneously
- Short burst added for stop explosion energy

### Voiced stops
- L and T modified to produce steep spectral slope (simulates voiced murmur)
- Wall radiation not modeled, so murmur introduced functionally

### Fricatives
- Unvoiced: glottal control similar to [h] + separate articulatory noise source
- Voiced fricatives/semivowels: L and T differ from voicing values by ~half the stop offset, with slower time constants

### Lexical stress
- Supra-segmental: slow L and F0 variations
- Lexical stress: either T or L change (laryngeal vs subglottal innervation)
- In reported experiments: lexical stress signaled partly by different T during vowel

## Relevance to Qlatt

### Direct applicability
- **Conceptual framework:** The F/L/T parameterization maps well to Klatt's source parameters:
  - F → F0
  - L → AV (amplitude of voicing) + spectral tilt (TL)
  - T → OQ (open quotient) + aspiration noise
- **The coupling insight:** L and T produce coupled changes in multiple acoustic parameters simultaneously (amplitude, spectral tilt, pulse width, noise). This is what the LF model later formalized mathematically. In Qlatt, this coupling is currently handled by explicit parameter rules rather than an inherent source model.
- **Synthesis rules for glottal transitions:** The rules for stops, fricatives, [h], and boundaries using T commands provide a template for Qlatt's rule system. The idea that aspiration arises naturally from articulatory delay in adduction (rather than as a separate noise parameter) is elegant.

### Limitations
- Analog circuit model — not directly implementable in digital domain
- No explicit mathematical waveform parameterization (contrast with LF model)
- The derivative term (1.8 x 10^-4 * dV2/dt) was tuned by ear, not derived from measurements
- No vowel-dependent source variation
- No jitter/shimmer modeling beyond additive noise

### Historical significance
- This paper establishes the three-parameter (F, L, T) framework that influenced:
  - Fant's later work on the LF model (1985), which parameterized the waveform shape mathematically
  - The "behavioral model" approach to glottal source modeling
  - The idea of physiologically-motivated but acoustically-implemented control parameters
