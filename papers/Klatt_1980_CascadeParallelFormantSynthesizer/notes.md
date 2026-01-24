# Software for a Cascade/Parallel Formant Synthesizer

**Authors:** Dennis H. Klatt
**Year:** 1980
**Venue:** Journal of the Acoustical Society of America, Vol. 67, No. 3, March 1980
**DOI/URL:** 0001-4966/80/030971-25

## One-Sentence Summary
This paper provides the complete specification and FORTRAN implementation of a flexible cascade/parallel formant synthesizer that became the foundation for nearly all subsequent formant-based TTS systems.

## Problem Addressed
The need for a flexible, well-documented research tool for speech perception studies that could run on general-purpose laboratory computers, avoiding the calibration problems and design deficiencies of existing hardware synthesizers.

## Key Contributions
- Complete specification of a hybrid cascade/parallel formant synthesizer architecture
- Full FORTRAN source code for the synthesizer (PARCOE.FOR, COEWAV.FOR, HANDSY.FOR)
- Detailed parameter tables for English vowels and consonants
- Synthesis strategies for imitating natural speech
- Mathematical framework using digital resonators with impulse-invariant transformation
- Explanation of when to use cascade vs. parallel configurations

## Methodology

### Approach
The synthesizer models speech production using three components:
1. **Sound sources** (voicing, aspiration, frication)
2. **Vocal tract transfer function** (cascade or parallel resonators)
3. **Radiation characteristic** (first-difference filter)

The output spectrum P(f) = S(f) * T(f) * R(f), where S is source, T is transfer function, R is radiation.

### Algorithm
1. Generate impulse train at fundamental frequency F0
2. Shape impulses through glottal resonator RGP (low-pass) and antiresonator RGZ
3. Generate noise sources (aspiration, frication) with optional amplitude modulation
4. Route sources through appropriate vocal tract model:
   - Laryngeal sources (voicing, aspiration) -> Cascade branch
   - Frication sources -> Parallel branch
5. Apply radiation characteristic (first difference)
6. Sum cascade and parallel outputs

## Key Equations

### Digital Resonator Difference Equation
$$
y(nT) = Ax(nT) + By(nT-T) + Cy(nT-2T)
$$
Where:
- $y(nT)$ = output sample at time nT
- $x(nT)$ = input sample at time nT
- $T$ = sampling period (0.0001 s for 10 kHz)
- $A, B, C$ = difference equation coefficients

### Resonator Coefficients (Impulse-Invariant Transform)
$$
C = -\exp(-2\pi \cdot BW \cdot T)
$$
$$
B = 2\exp(-\pi \cdot BW \cdot T) \cos(2\pi \cdot F \cdot T)
$$
$$
A = 1 - B - C
$$
Where:
- $F$ = formant frequency (Hz)
- $BW$ = formant bandwidth (Hz)
- $T$ = sampling period

### Antiresonator Coefficients
$$
A' = 1.0/A, \quad B' = -B/A, \quad C' = -C/A
$$
Where A, B, C are computed from the antiresonance frequency and bandwidth.

### Resonator Transfer Function
$$
T(f) = \frac{A}{1 - Bz^{-1} - Cz^{-2}}
$$
Where $z = \exp(j2\pi fT)$

### Cascade Vocal Tract Transfer Function
$$
T(f) = \prod_{n=1}^{5} \frac{A(n)}{1 - B(n)z^{-1} - C(n)z^{-2}}
$$

### Analog Equivalent (Laplace domain)
$$
T(f) = \prod_{n=1}^{\infty} \frac{s(n) \cdot s^*(n)}{[s + s(n)][s + s^*(n)]}
$$
Where:
- $s(n) = \pi \cdot BW(n) + j2\pi \cdot F(n)$
- $s^*(n) = \pi \cdot BW(n) - j2\pi \cdot F(n)$

### Radiation Characteristic
$$
p(nT) = u(nT) - u(nT - T)
$$
This is a first-difference (high-pass) filter adding +6 dB/octave spectral tilt.

### Low-Pass Integration Filter (for frication source)
$$
y(nT) = x(nT) + y(nT - T)
$$

## Parameters

### Variable Control Parameters (updated every 5 ms)

| Name | Symbol | Units | Default | Range | Notes |
|------|--------|-------|---------|-------|-------|
| Amplitude of voicing | AV | dB | 0 | 0-80 | ~60 dB for strong vowel |
| Amplitude of frication | AF | dB | 0 | 0-80 | ~60 dB for strong fricative |
| Amplitude of aspiration | AH | dB | 0 | 0-80 | Sent to cascade branch |
| Amplitude of sinusoidal voicing | AVS | dB | 0 | 0-80 | For voicebars, voiced fricatives |
| Fundamental frequency | F0 | Hz | 0 | 0-500 | 0 = voicing off |
| First formant frequency | F1 | Hz | 450 | 150-900 | |
| Second formant frequency | F2 | Hz | 1450 | 500-2500 | |
| Third formant frequency | F3 | Hz | 2450 | 1300-3500 | |
| Fourth formant frequency | F4 | Hz | 3300 | 2500-4500 | |
| Fifth formant frequency | F5 | Hz | 3750 | 3500-4900 | |
| Nasal zero frequency | FNZ | Hz | 250 | 200-700 | Set = FNP for non-nasal |
| First formant bandwidth | B1 | Hz | 50 | 40-500 | |
| Second formant bandwidth | B2 | Hz | 70 | 40-500 | |
| Third formant bandwidth | B3 | Hz | 110 | 40-500 | |
| Parallel formant amplitudes | A1-A6 | dB | 0 | 0-80 | For frication spectra |
| Nasal formant amplitude | AN | dB | 0 | 0-80 | Parallel branch |
| Bypass path amplitude | AB | dB | 0 | 0-80 | For flat-spectrum fricatives |

### Constant Control Parameters

| Name | Symbol | Units | Default | Range | Notes |
|------|--------|-------|---------|-------|-------|
| Cascade/parallel switch | SW | - | 0 | 0-1 | 0=cascade, 1=all-parallel |
| Glottal resonator frequency | FGP | Hz | 0 | 0-600 | 0 Hz = low-pass |
| Glottal resonator bandwidth | BGP | Hz | 100 | 100-2000 | |
| Glottal zero frequency | FGZ | Hz | 1500 | 0-5000 | Shapes source spectrum |
| Glottal zero bandwidth | BGZ | Hz | 6000 | 100-9000 | |
| Fourth formant bandwidth | B4 | Hz | 250 | 100-500 | |
| Fifth formant bandwidth | B5 | Hz | 200 | 150-700 | |
| Sixth formant frequency | F6 | Hz | 4900 | 4000-4999 | For [s,z] high-freq noise |
| Sixth formant bandwidth | B6 | Hz | 1000 | 200-2000 | |
| Nasal pole frequency | FNP | Hz | 250 | 200-500 | Fixed |
| Nasal pole bandwidth | BNP | Hz | 100 | 50-500 | |
| Nasal zero bandwidth | BNZ | Hz | 100 | 50-500 | |
| Glottal resonator 2 bandwidth | BGS | Hz | 200 | 100-1000 | For quasi-sinusoidal voicing |
| Sampling rate | SR | Hz | 10000 | 5000-20000 | |
| Samples per update | NWS | - | 50 | 1-200 | 50 = 5 ms at 10 kHz |
| Overall gain | G0 | dB | 47 | 0-80 | Master gain |
| Number of cascade formants | NFC | - | 5 | 4-6 | 4 for female, 5-6 for male |

### dB Scale Factors (NDBSCA array in PARCOE.FOR)
Used to convert user dB values to internal amplitudes:

| Parameter | Scale Factor |
|-----------|--------------|
| A1 | -58 |
| A2 | -65 |
| A3 | -75 |
| A4 | -78 |
| A5 | -79 |
| A6 | -80 |
| AN | -58 |
| AB | -84 |
| AV | -72 |
| AH | -102 |
| AF | -72 |
| AVS | -44 |

### Proximity Correction (NDBCOR array)
Formant amplitude boost when two formants are close:

| Frequency Difference | dB Correction |
|---------------------|---------------|
| 50 Hz | +10 |
| 100 Hz | +9 |
| 150 Hz | +8 |
| 200 Hz | +7 |
| 250 Hz | +6 |
| 300 Hz | +5 |
| 350 Hz | +4 |
| 400 Hz | +3 |
| 450 Hz | +2 |
| 500 Hz | +1 |

## Implementation Details

### Data Structures
- **IPAR(39)**: Array of 39 integer control parameters
- **C(50)**: Array of 50 real coefficients for synthesizer hardware
- **IWAVE(10050)**: Output waveform buffer
- **Resonator state variables**: YLnnn1, YLnnn2 for each resonator (two delay elements)

### Initialization Procedures
1. Set INITPC = -1 to initialize
2. Zero all resonator memory registers (YL variables)
3. Initialize pulse counters (NPULSE, MPULSE)
4. Compute sampling period T = 1/SR
5. Set TWOPIT = 2*PI*T for coefficient calculations

### Key Processing Steps

#### Source Generation
1. **Normal voicing**: Impulse -> RGP (low-pass, F=0, BW=100) -> RGZ (antiresonator)
2. **Quasi-sinusoidal voicing**: Impulse -> RGP -> RGS (additional low-pass, BW=200)
3. **Frication/aspiration**: Random numbers -> Sum 16 for Gaussian -> LPF (-6 dB/octave)
4. **Amplitude modulation**: 50% square-wave modulation when F0 > 0 and AV > 0

#### Voicing Amplitude Update
- AV and AVS only take effect at glottal pulse onset (prevents clicks)
- AF and AH interpolate linearly over 5 ms
- Exception: If AF increases by >50 dB, instant change (plosive burst)

#### PLSTEP Mechanism
When AF increases by >50 dB from previous frame:
```
PLSTEP = GETAMP(G0 + NDBSCA[11] + 44)
```
This adds a step excitation at plosive release.

#### Cascade/Parallel Routing Details (COEWAV)
- **UGLOT** is the radiated glottal flow (voicing + AVS) after RGZ and first-difference radiation.
- **Aspiration** noise is added to UGLOT before any tract routing (AASPIR*NOISE).
- **Cascade branch** (when SW=0): UGLOT goes through F6→F1, then nasal zero then nasal pole. Output is ULIPSV.
- **Parallel branch**:
  - F1 is excited by UGLOT (direct voicing) when SW=1.
  - UGLOT1 = first-difference of UGLOT; if SW!=1, UGLOT1 is forced to 0.
  - F2–F4 are excited by (UGLOT1 + UFRIC), F5–F6 by UFRIC only.
  - Alternating signs: ULIPSF = Y1P - Y2P + Y3P - Y4P + Y5P - Y6P + YN - AB*UFRIC.
- **Mutual exclusion**: when cascade branch is used, UGLOT and UGLOTL are zeroed to prevent any voicing from entering the parallel branch.

#### Parallel Branch Amplitude Correction (A2COR)
```
DELF1 = F1/500
A2COR = DELF1 * DELF1 / DELF2
```
Where DELF2 = F2/1500. This corrects for the effect of F1 on higher formant amplitudes.

#### A3COR (Higher formant correction)
```
A2SKRT = DELF2 * DELF2
A3COR = A2COR * A2SKRT
```

### Edge Cases
- F0 = 0 or AV = 0: No glottal pulses issued
- F0 < 40 Hz: Clamped to 40 Hz minimum
- Voicing onset timing: First pulse issued exactly when both F0 > 0 and AV > 0
- Female voices: Set NFC = 4 (remove 5th formant from cascade)
- Noise sample variations: Use same random seed or average multiple tokens

### Computational Complexity
- Real-time factor: ~6x on PDP-11/45, ~200x on PDP-11/40
- Each formant resonator: 2 multiplies, 2 adds per sample
- 5 cascade + 6 parallel + nasal + glottal resonators = ~30+ resonator computations per sample

## Figures of Interest

- **Fig. 3**: Cascade vs. parallel resonator configurations
- **Fig. 4**: Full cascade/parallel synthesizer block diagram - THE KEY ARCHITECTURE DIAGRAM
- **Fig. 5**: Digital resonator transfer function showing frequency response
- **Fig. 6**: Complete synthesizer block diagram with all components
- **Fig. 7**: Normal vs. quasi-sinusoidal voicing waveforms and spectra
- **Fig. 9**: Vocal tract transfer functions for vowels [i], [a], [u]
- **Fig. 11**: Effects of bandwidth changes and formant proximity on transfer function
- **Fig. 12**: Cascade vs. parallel model comparison for vowels
- **Fig. 13**: Problems with naive parallel synthesis (same sign vs. alternating sign)
- **Fig. A1**: External 5 kHz elliptic low-pass filter circuit

## Results Summary
- 98% vowel identification accuracy
- 95% consonant identification accuracy
- Tested on 337 CV syllables
- Validated by trained phoneticians unfamiliar with synthetic speech

## Limitations
- Glottal waveform lacks proper phase spectrum and spectral zeros seen in natural voicing
- Subglottal resonances not modeled (approximated by increasing B1 to ~300 Hz for aspiration)
- Nasal murmur details approximated by bandwidth adjustments rather than proper pole-zero insertion
- Parameter values in tables are for one male speaker (the author)
- Coarticulation effects on fricatives before back vowels not specified

## Relevance to TTS Systems

### Formant Synthesis
- This is THE foundational paper for Klatt-style formant synthesis
- Architecture directly applicable to any formant synthesizer implementation
- Parameter tables provide baseline values for English phonemes

### Source Modeling
- Normal voicing: -12 dB/octave spectral tilt from RGP
- Breathy voice: AH = AV - 3, AVS = AV - 6
- Voiced fricatives require quasi-sinusoidal voicing (AVS) plus frication (AF)

### Nasalization
- Use FNZ = (F1_new + FNP)/2 for nasalized vowels
- Increase F1 by ~100 Hz during nasalization
- Nasal murmurs: approximate high-frequency details via bandwidth, not pole-zero

### Prosody
- F0 contour specification every 5 ms
- Voicing amplitude (AV) contour for intensity
- VOT control via AV=0, F0=0 during closure/burst/aspiration phases

### Duration
- Parameter update rate: 5 ms (can be changed via NWS parameter)
- Typical CV durations in example: 200-500 ms

## Open Questions
- [ ] What are the perceptual effects of the missing phase spectrum in the glottal source?
- [ ] How should A2-A6 be set for fricatives before back/rounded vowels?
- [ ] What are the complete formant trajectories for consonant clusters?
- [ ] How to properly model subglottal resonances?
- [ ] What modifications needed for languages other than English?

## Related Work Worth Reading
- Fant (1960) - Acoustic Theory of Speech Production (foundational theory)
- Holmes (1973) - Influence of glottal waveform on parallel synthesizer
- Gold & Rabiner (1968) - Digital and analog formant synthesizers (impulse-invariant transform)
- Fujimura (1962) - Analysis of nasal consonants
- Fujimura & Lindqvist (1971) - Swept-tone bandwidth measurements
- Stevens (1971, 1972) - Airflow and turbulence noise; Quantal theory
- Flanagan (1957, 1958) - Terminal analog design; Glottal sound source

## Vowel Parameter Table (Table II)

| Vowel | F1 | F2 | F3 | B1 | B2 | B3 |
|-------|-----|------|------|-----|-----|-----|
| [iY] | 310/290 | 2020/2070 | 2960/2960 | 45/60 | 200/200 | 400/400 |
| [I] | 400/470 | 1800/1600 | 2570/2600 | 50/50 | 100/100 | 140/140 |
| [eY] | 480/330 | 1720/2020 | 2520/2600 | 70/55 | 100/100 | 200/200 |
| [ae] | 620/650 | 1660/1490 | 2430/2470 | 70/70 | 150/100 | 320/320 |
| [a] | 700 | 1220 | 2600 | 130 | 70 | 160 |
| [A] | 620 | 1220 | 2550 | 80 | 50 | 140 |
| [oW] | 540/450 | 1100/900 | 2300/2300 | 80/80 | 70/70 | 70/70 |
| [uW] | 350/320 | 1250/900 | 2200/2200 | 65/65 | 110/110 | 140/140 |
| [3r] | 470/420 | 1270/1310 | 1540/1540 | 100/100 | 60/60 | 110/110 |

(Two values indicate diphthong onset/offset)

## Consonant Parameter Table (Table III - before front vowels)

### Sonorants
| Sound | F1 | F2 | F3 | B1 | B2 | B3 |
|-------|-----|------|------|-----|-----|-----|
| [w] | 290 | 610 | 2150 | 50 | 80 | 60 |
| [y] | 260 | 2070 | 3020 | 40 | 250 | 500 |
| [r] | 310 | 1060 | 1380 | 70 | 100 | 120 |
| [l] | 310 | 1050 | 2880 | 50 | 100 | 280 |

### Fricatives (voiceless: AF=60, AV=0; voiced: AF=50, AV=47, AVS=47)
| Sound | F1 | F2 | F3 | B1 | A2 | A3 | A4 | A5 | A6 | AB |
|-------|-----|------|------|-----|----|----|----|----|----|----|
| [f] | 340 | 1100 | 2080 | 200 | 0 | 0 | 0 | 0 | 0 | 57 |
| [v] | 220 | 1100 | 2080 | 60 | 0 | 0 | 0 | 0 | 0 | 57 |
| [th] | 320 | 1290 | 2540 | 200 | 0 | 0 | 0 | 0 | 28 | 48 |
| [dh] | 270 | 1290 | 2540 | 60 | 0 | 0 | 0 | 0 | 28 | 48 |
| [s] | 320 | 1390 | 2530 | 200 | 0 | 0 | 0 | 0 | 52 | 0 |
| [z] | 240 | 1390 | 2530 | 70 | 0 | 0 | 0 | 0 | 52 | 0 |
| [sh] | 300 | 1840 | 2750 | 200 | 0 | 57 | 48 | 48 | 46 | 0 |

### Plosive Bursts
| Sound | F1 | F2 | F3 | B1 | A2 | A3 | A4 | A5 | A6 | AB |
|-------|-----|------|------|-----|----|----|----|----|----|----|
| [p] | 400 | 1100 | 2150 | 300 | 0 | 0 | 0 | 0 | 0 | 63 |
| [b] | 200 | 1100 | 2150 | 60 | 0 | 0 | 0 | 0 | 0 | 63 |
| [t] | 400 | 1600 | 2600 | 300 | 0 | 30 | 45 | 57 | 63 | 0 |
| [d] | 200 | 1600 | 2600 | 60 | 0 | 47 | 60 | 62 | 60 | 0 |
| [k] | 300 | 1990 | 2850 | 250 | 0 | 53 | 43 | 45 | 45 | 0 |
| [g] | 200 | 1990 | 2850 | 60 | 0 | 53 | 43 | 45 | 45 | 0 |

### Nasals
| Sound | FNP | FNZ | F1 | F2 | F3 | B1 | B2 | B3 |
|-------|-----|-----|-----|------|------|-----|-----|-----|
| [m] | 270 | 450 | 480 | 1270 | 2130 | 40 | 200 | 200 |
| [n] | 270 | 450 | 480 | 1340 | 2470 | 40 | 300 | 300 |
