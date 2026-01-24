# Acoustic Theory of Speech Production

**Author:** Gunnar Fant
**Year:** 1960 (2nd printing 1970)
**Publisher:** Mouton, The Hague
**Affiliation:** Royal Institute of Technology, Stockholm

## One-Sentence Summary

This foundational text establishes the source-filter model of speech production (P = S * T) and provides complete mathematical framework, equations, and empirical formant data required for implementing formant synthesizers.

## Book Structure

- **Part I: Acoustic Theory of Speech** (pp. 14-90)
  - Source-filter theory, network representation, F-pattern concept, transfer functions, compound resonator models
- **Part II: Calculations Based on X-Ray Data** (pp. 91-204)
  - X-ray derived area functions, vowel formant calculations, nasalization, liquids, fricatives, stops
- **Part III: Summary** (pp. 205-225)
  - Segmentation, F-pattern/articulation relationships, distinctive features
- **Appendices** (pp. 226-311)
  - Speech wave analysis methods, source characteristics, analytical resonator models, damping calculations

## Core Theoretical Framework

### The Source-Filter Model

The fundamental equation: $|P(f)| = |S(f)| \cdot |T(f)|$

- **Source S(f)**: Glottal excitation (periodic pulses for voiced, noise for fricatives)
- **Filter T(f)**: Vocal tract transfer function (cascade of formant resonators)
- **Output P(f)**: Radiated speech spectrum

Key insight: "The speech wave may be uniquely specified in terms of source and filter characteristics." The filter function is approximately independent of the source.

### Transfer Function Decomposition

$$|P(f)| = |U(f)| \cdot |H(f)| \cdot |R(f)|$$

Where:
- $|U(f)|$ = voice source spectrum
- $|H(f)|$ = vocal tract transfer function (product of formant contributions)
- $|R(f)|$ = radiation characteristic

## Key Equations for Implementation

### Source Spectrum

Voice source model (Eq. 2.3-6):
$$|U_g(f)| = \frac{150}{1 + f^2/100^2} \text{ cm}^3/\text{sec}$$

- DC flow: 150 cm^3/sec
- Two poles at 100 Hz on negative real axis
- Slope: **-12 dB/octave** above 100 Hz

Additional voice source poles (Eq. 1.23-14):
- $s_{r1}, s_{r2} = 2\pi \cdot 100$ c/s (variable with stress)
- $s_{r3} = 2\pi \cdot 2000$ c/s
- $s_{r4} = 2\pi \cdot 4000$ c/s

### Transfer Function (Single Formant)

$$H_n(f) = \frac{F_n^2 + (B_n/2)^2}{\sqrt{(f-F_n)^2 + (B_n/2)^2} \cdot \sqrt{(f+F_n)^2 + (B_n/2)^2}}$$

Where:
- $F_n$ = formant frequency (Hz)
- $B_n$ = 3-dB bandwidth (Hz)
- At $f = \sqrt{2} F_n$: response = 0 dB, then falls at -12 dB/octave

Quality factor: $Q = F_n / B_n$

Damping relationship: $\sigma_n = -\pi B_n$ (rad/s)

### Radiation Characteristic

- **+6 dB/octave** rise at low frequencies
- Radiation inductance at lips: $L_0 = 0.8(A/\pi)^{1/2} \cdot \rho/A$
- Maximum correction factor $K_T$: 7 dB at high frequencies, 5 dB at 2000 Hz

### Net Source + Radiation Slope

Combined effect above ~100 Hz: **-6 dB/octave** (from -12 source + 6 radiation)

### Higher Pole Correction Factors

$$20\log_{10}k_{r4} = 0.54 x^2 + 0.00143 x^4 \text{ dB}$$

Where $x = f/f_1$ and $f_1 = c/4l_{tot}$ (quarter-wavelength frequency, ~500 Hz)

### Helmholtz Resonator Frequency

$$F = \frac{c}{2\pi} \sqrt{\frac{A}{l_e \cdot V}}$$

Where: c = speed of sound, A = neck area, $l_e$ = effective length, V = volume

### Bandwidth Components

Total bandwidth has multiple sources:

$$B = B_{R0} + B_{Rf} + B_g + B_w$$

- $B_{R0}$ = radiation resistance (increases with $f^2$)
- $B_{Rf}$ = frictional losses (increases with $\sqrt{f}$)
- $B_g$ = glottal damping
- $B_w$ = wall vibration (decreases with $f^{-2.5}$)

Empirical attenuation constant (Eq. A.34-23):
$$a = 0.007 \cdot (\pi/A)^{1/2} \text{ neper/cm}$$

## Vowel Synthesis Parameters

### Formant Frequencies - Neutral Vowel

For uniform tube, length 17.6 cm (Eq. A.33-7):

| Formant | Frequency (Hz) |
|---------|---------------|
| F1 | 500 |
| F2 | 1500 |
| F3 | 2500 |
| F4 | 3500 |

Average formant spacing: $c/2l \approx 1000$ Hz for 17.5 cm tract

### Russian Vowel Formant Data (Table 2.31-1)

| Vowel | F1 (Hz) | F2 (Hz) | F3 (Hz) | F4 (Hz) |
|-------|---------|---------|---------|---------|
| [u] | 240 | 610 | 2370 | 3400 |
| [o] | 500 | 860 | 2320 | 3500 |
| [a] | 630 | 1072 | 2400 | 3550 |
| [e] | 420 | 1960 | 2750 | 3410 |
| [i] | 230 | 2220 | 2970 | 3570 |
| [schwa] | 285 | 1480 | 2320 | 3200 |

### Twin-Tube Model Vowel Data (Fig. 1.4-3)

| Vowel | F1 | F2 | F3 | F4 |
|-------|-----|-----|-----|-----|
| [schwa] | 500 | 1500 | 2500 | 3500 |
| [a] | 780 | 1240 | 2720 | 3350 |
| [i] | 260 | 1990 | 3050 | 4130 |
| [y] | 220 | 1800 | 2280 | 3800 |
| [ae] | 630 | 1770 | 2280 | 3400 |

### Formant Bandwidths (Table 2.34-1)

| Vowel | B1 (Hz) | B2 (Hz) | B3 (Hz) | B4 (Hz) |
|-------|---------|---------|---------|---------|
| [a] | 57 | 72 | 130 | 175 |
| [o] | 54 | 65 | 100 | 135 |
| [u] | 69 | 50 | 110 | 115 |
| [i] | 43 | 125 | 77 | 134 |
| [e] | 39 | 95 | 170 | 325 |

Typical ranges: B1 = 40-70 Hz, B2 = 50-125 Hz, B3 = 77-240 Hz

### Radiation Bandwidth at Neutral Configuration (l=17.6 cm, A=8 cm^2)

| Formant | B_R0 (Hz) |
|---------|-----------|
| F1 (500 Hz) | 3.9 |
| F2 (1500 Hz) | 46 |
| F3 (2500 Hz) | 137 |
| F4 (3500 Hz) | 224 |

## Consonant Synthesis Parameters

### Nasals

Fixed nasal formant frequencies (approximately):
- 250 Hz, 1000 Hz, 2000 Hz, 3000 Hz, 4000 Hz

Primary cue for nasalization: **F1 intensity reduction and bandwidth increase**

Nasal consonant characteristics:
- F1 at ~250-300 Hz (pharynx/nasal resonance)
- Strong antiresonance typically 100-200 Hz above F1
- First zero frequency: ~1000 Hz for [m], shifting with place

Pole-zero contribution (Eq. 1.3-12):
$$|N_a(f)| = \left[\frac{(1-x_{zn}^2)^2 + x_{zn}^2/Q_{zn}^2}{(1-x_{pn}^2)^2 + x_{pn}^2/Q_{pn}^2}\right]^{1/2}$$

### Fricatives

Source spectrum slopes by place:
- [s], [z]: Flat (0 dB/octave) from ~1000-8000 Hz
- [f], [v]: -6 dB/octave from ~800-10000 Hz
- [x]: -6 dB/octave from ~300-4000 Hz

Constriction cutoff frequency:
$$F_c = v/(2\pi l)$$

Where v = air velocity (~3000 cm/s), l = constriction length

Key frequencies:
- [s] main peak: 7000-7500 Hz
- [f] minimum overpressure: 6 cm H2O
- [s] minimum overpressure: 1 cm H2O

### Stops

Burst spectrum: **-6 dB/octave** average slope (3 poles minus 2 zeros)

Place-specific characteristics:
- **Labials**: Flat spectrum, even energy 0-10000 Hz, lip cavity resonance 6000-7000 Hz
- **Dentals**: High-pass, zero at ~3500 Hz, main peak 4000-7000 Hz
- **Velars/Palatals**: Lower main peak than dentals (quarter-wavelength resonance)

Limiting F-pattern after stop release:
- F1 = 400 Hz, F2 = 1750 Hz, F3 = 2600 Hz

Burst duration: ~70 msec for initial [p], [t], [k]
Labial transition time: ~15 msec

### Liquids

| Sound | F1 | F2 | F3 | F4 |
|-------|----|----|----|----|
| [l] non-palatalized | 350 | 620-850 | 2300 | 3050 |
| [l] palatalized | 210 | 1700 | 2500 | 3100 |
| [r] non-palatalized | 500 | 1800-2000 | 2700 | 3000 |

For lateral [l]: Anti-resonance zero at ~2000 Hz ($l_s = 4.4$ cm)

## Articulatory-Acoustic Mappings

### Three-Parameter Vocal Tract Model

Parameters:
1. **Place of articulation** (tongue constriction center, cm from front)
2. **Constriction area** ($A_3$, 0.16-8 cm^2)
3. **Lip rounding** ($l_1/A_1$ ratio)

Standard dimensions:
- Total length: 15-17.6 cm
- Main cavity area: 8 cm^2
- Constriction length: 5 cm (unless extreme position)

### Formant Sensitivities

Standing wave principle: "Constriction at velocity maximum raises formant; constriction at pressure maximum lowers formant."

F1 rules:
- High F1: tongue constriction in back (pharynx) or increased constriction area
- Low F1: front constriction or decreased constriction area

F2 rules:
- High F2: tongue constriction at palatal region
- Low F2: lip narrowing/lengthening

Back cavity primarily affects F1; front cavity primarily affects F2.

### Formant Change per 1% Volume Change (Table 2.33-5)

| Vowel | dF1/F1 (back) | dF2/F2 (front) |
|-------|---------------|----------------|
| [a] | 0.19 | 0.23 |
| [o] | 0.33 | 0.37 |
| [u] | 0.28 | 0.20 |
| [i] | 0.39 | 0.49 |

## Key Figures Reference

| Figure | Page | Content |
|--------|------|---------|
| 1.1-2 | 19 | Source-filter decomposition diagram |
| 1.3-5 | 55 | Effect of F1 shift on spectrum envelope |
| 1.3-6 | 57 | Nine vowel spectrum envelopes |
| 1.4-2 | 65 | Twin-tube nomogram (F1-F4 from area/length ratios) |
| 1.4-9a,b | 76-77 | Comprehensive F1-F5 nomograms for three-parameter model |
| 1.4-12 | 85 | Standing wave patterns for F1-F4 |
| 2.3-2 | 108 | Area functions for six Russian vowels |
| 2.3-4 | 110 | Spectrum envelopes for six Russian vowels |
| 2.3-5 | 112 | F1-F2 vowel diagram with articulatory overlay |
| 2.4-4 | 144 | Nasal consonant spectrum envelopes |
| 2.6-10 | 189 | Calculated and measured stop spectra |
| 2.6-11 | 195 | Simplified front cavity models for stops/fricatives |
| A.2-1 | 271 | Voice source waveforms and spectrum envelopes |

## Implementation Checklist

- [x] Source model: -12 dB/octave above 100 Hz (two poles at 100 Hz)
- [x] Radiation: +6 dB/octave (net source+radiation: -6 dB/octave)
- [x] Formant filter: Eq. 1.3-5b, -12 dB/octave above $\sqrt{2} \cdot F_n$
- [x] Bandwidth formula: $B_n = -\sigma_n/\pi$
- [x] Higher pole correction: Eq. 1.3-4a-c
- [x] Nasalization: F1 weakening + pole-zero pairs (Eq. 1.3-12)
- [x] Fricative noise: Flat to -6 dB/octave depending on place
- [x] Stop burst: -6 dB/octave, place-dependent resonances
- [x] Lip rounding: Lowers all formants, narrows bandwidths

## Relevance to Klatt Synthesizer

Fant's work provides the theoretical foundation for Klatt 1980:

1. **Cascade formant synthesis**: Direct implementation of $H(f) = \prod H_n(f)$
2. **Parallel branch**: Needed for fricatives/stops where source location affects spectrum
3. **Bandwidth parameters**: Fant's bandwidth data (Table 2.34-1) informs Klatt's defaults
4. **Nasalization**: Pole-zero pairs from nasal coupling (Klatt's FNZ, FNP)
5. **Voice source**: -12 dB/octave matches Klatt's glottal source model
6. **Formant frequency ranges**: F0 60-240 Hz, F1 150-850 Hz, F2 500-2500 Hz, F3 1500-3500 Hz

Fant's empirical attenuation formula ($a = 0.007 \cdot (\pi/A)^{1/2}$) provides basis for realistic formant damping. Real vocal tract attenuation is 2-8x larger than ideal hard-walled tube.

## Physical Constants

| Parameter | Symbol | Value | Units |
|-----------|--------|-------|-------|
| Speed of sound | c | 35000 | cm/s |
| Air density | rho | 0.00114 | g/cm^3 |
| Characteristic impedance | Z_0 | rho*c/A | acoustical ohms |
| Viscosity coefficient | mu | 1.84e-4 | g/cm*s |
| Kinematic viscosity | nu | 0.15 | cm^2/s |
| Acoustic resistance (20C) | rho*c | 41.4 | dyne*s/cm^3 |

## Open Questions

1. **Source-filter independence**: How much does source spectrum actually vary with articulation?
2. **Dynamic bandwidth**: B1 varies within glottal period; how to model?
3. **Wall vibration losses**: Van den Berg estimates 25-50 Hz at 300 Hz, but proportional to $f^{-2.5}$
4. **Turbulent flow effects**: Reynolds number criteria for onset; critical Re ~1800
5. **Sinus piriformis**: Introduces pole-zero pair around 3500-5000 Hz; omitted in simple models
