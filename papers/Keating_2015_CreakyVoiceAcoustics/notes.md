# Keating, Garellek & Kreiman (2015) - Acoustic Properties of Different Kinds of Creaky Voice

**Citation:** Keating PA, Garellek M, Kreiman J (2015) Acoustic properties of different kinds of creaky voice. Proc. ICPhS 2015.

## Core Argument

There is no single "creaky voice." Instead, 6 subtypes exist, each characterized by a different combination of acoustic properties. No single measure captures all types.

## Taxonomy of Creaky Voice Types

### 1. Prototypical Creak
Three key properties:
- Low F0 (e.g., ~70 Hz for male)
- Irregular F0
- Constricted glottis (small peak opening, long closed phase, low airflow)

### 2. Vocal Fry
- Constricted glottis: YES
- Low F0: YES
- Irregular F0: NOT necessarily (often quite periodic)
- Special property: **high damping** of pulses ("picket fence" effect)
- Individual pulses separately audible
- Ventricular fold incursion may contribute (increased effective mass)

### 3. Multiply Pulsed Voice (Period Doubling)
- Alternating longer/shorter pulses (double or triple pulsing)
- Two simultaneous F0s: one low, one ~octave higher
- Percept: indeterminate pitch + roughness
- Long closed phase
- Low F0 NOT necessarily present
- **Subharmonics visible in spectrum** (two sets of harmonics)

### 4. Aperiodic Voice
- F0 irregularity taken to extreme: no periodicity, no perceived pitch
- Lacks low-F0 property
- Irregular F0 property enhanced
- Noisy

### 5. Nonconstricted Creak (Slifka 2000, 2006)
- F0: low and irregular (like prototypical)
- BUT: glottis is SPREADING, not constricting
- Higher airflow (somewhat breathy)
- Occurs utterance-finally as vocal folds begin to spread
- Voicing at edge of failing

### 6. Tense/Pressed Voice
- Constricted glottis: YES
- F0: neither low nor irregular
- Functions as "creaky" phonologically in languages with creaky + high tone
- Reduced amplitude due to constriction

## Properties-by-Type Matrix (Table 1)

| Property | Proto | Fry | Multi-pulse | Aperiodic | Nonconstricted | Tense |
|---|---|---|---|---|---|---|
| Low F0 | YES | YES | - | NO | YES | NO |
| Irregular F0 | YES | - | YES | YES | YES | - |
| Glottal constriction | YES | YES | YES | - | NO | YES |
| Damped pulses | - | YES | - | - | - | - |
| Subharmonics | - | - | YES | - | - | - |

## Acoustic Measures and What They Capture

| Measure | What it reflects | Creak type it characterizes |
|---|---|---|
| Low F0 | Slow vibration | Proto, Fry, Nonconstricted |
| HNR (low = noisy) | Irregular F0 / noise | Proto, Aperiodic, Nonconstricted |
| HNR (high) | Regular damped pulses | Vocal Fry |
| H1-H2 (low) | Glottal constriction | Proto, Fry, Multi-pulse, Tense |
| H1-H2 (high) | Spreading glottis | Nonconstricted |
| Spectral tilt (less) | More energy in higher harmonics | Constricted types |
| Formant BWs (narrow) | Damped pulses, long closed phase | Vocal Fry |
| SHR (high) | Subharmonics | Multi-pulse |
| Jitter | Pulse-to-pulse F0 variation | Proto, Aperiodic |
| CPP (low) | Noise | Proto, Aperiodic (via jitter or irregularity) |

## Key Acoustic Measure References
- **H1*-H2***: Formant-corrected version (Hanson 1995, Iseli et al. 2007) - best measure of glottal constriction
- **VoiceSauce**: Software for voice quality analysis (Shue et al. 2011)
- **SHR**: Sun's Subharmonic-to-Harmonic Ratio (Sun 2002)
- **STRAIGHT**: Robust pitch tracker for irregular F0 (Kawahara et al. 1999)

## Implementation Relevance
- For synthesizing creaky voice: no single parameter change suffices
- Vocal fry: lower F0 + maintain periodicity + increase pulse damping + narrow B1
- Prototypical creak: lower F0 + add jitter + reduce H1-H2
- Aperiodic creak: heavy jitter/noise, no clear F0
- Nonconstricted creak: lower F0 + increase H1-H2 (opposite of typical creak) + add breathiness
- Tense/pressed: reduce H1-H2 without lowering F0
