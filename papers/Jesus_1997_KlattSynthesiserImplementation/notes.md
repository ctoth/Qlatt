# An Implementation of the Klatt Speech Synthesiser

**Authors:** Luis Miguel Teixeira de Jesus, Francisco Vaz, José Carlos Principe
**Year:** 1997
**Venue:** Revista do DETUA, Vol. 2, No. 1, Setembro 1997
**DOI/URL:** N/A (Portuguese academic journal)

## One-Sentence Summary

Teaching-focused MATLAB implementation of Klatt synthesizer with LF glottal model, Portuguese vowel formant data, and complete parameter documentation including GUI screenshot showing typical working values.

## Problem Addressed

Need for a didactic tool to teach speech synthesis concepts, allowing students to interactively explore how synthesis parameters affect vowel characteristics.

## Key Contributions

- Complete Klatt synthesizer implementation in MATLAB with GUI
- Integration of LF (Liljencrants-Fant) glottal source model
- Portuguese vowel formant frequency data (Table 2)
- Full parameter table with ranges (Table 1)
- Resonator/antiresonator coefficient equations with clear derivation
- GUI screenshot showing actual working parameter values

---

## Resonator Implementation (CRITICAL)

### Second-Order Resonator (Two Poles)

The resonator models a spectral peak (formant). It's characterized by:
- **F** = resonant (formant) frequency in Hz
- **Bw** = bandwidth in Hz

#### Difference Equation
```
y(n) = A*x(n) + B*y(n-1) + C*y(n-2)
```

#### Coefficient Calculation
```
T = 1 / sampleRate           // sampling period in seconds

C = -exp(-2 * π * Bw * T)

B = 2 * exp(-2 * π * Bw * T) * cos(2 * π * F * T)

A = 1 - C - B
```

#### Block Diagram (Figure 9)
```
x(n) ──►[×A]──►(+)──────────────────►y(n)
                ▲                      │
                │                      │
                │    ┌────[z⁻¹]◄───────┤
                │    │                 │
                │    ▼                 │
                ├───[×B]◄── y(n-1)     │
                │                      │
                │    ┌────[z⁻¹]◄───────┘
                │    │
                │    ▼
                └───[×C]◄── y(n-2)
```

#### Special Case: F = 0 (Low-Pass Filter)
When F = 0:
- Becomes a **low-pass filter** with **-12 dB/octave** slope
- 3dB cutoff frequency = **Bw / 2**
- Used to model natural glottal impulse shape
- Used for spectral tilt control

#### JavaScript Implementation
```javascript
function calculateResonatorCoeffs(F, Bw, sampleRate) {
    const T = 1.0 / sampleRate;
    const piT = Math.PI * T;

    const expTerm = Math.exp(-2 * piT * Bw);

    const C = -expTerm;
    const B = 2 * expTerm * Math.cos(2 * piT * F);
    const A = 1 - C - B;

    return { A, B, C };
}

function resonator(input, state, coeffs) {
    // state = { y1: 0, y2: 0 }  // y(n-1), y(n-2)
    const output = coeffs.A * input + coeffs.B * state.y1 + coeffs.C * state.y2;
    state.y2 = state.y1;
    state.y1 = output;
    return output;
}
```

---

### Antiresonator (Two Zeros)

Introduces spectral zeros (antiformants) for:
- Nasal coupling effects in cascade configuration
- Voicing source spectrum shaping

#### Difference Equation
```
y(n) = A'*x(n) + B'*x(n-1) + C'*x(n-2)
```

#### Coefficient Calculation
First compute resonator coefficients A, B, C for the antiresonance frequency and bandwidth, then:
```
A' = 1 / A
B' = -B / A
C' = -C * A      // Note: paper shows C'=-CA, equivalent to -C*A
```

#### JavaScript Implementation
```javascript
function calculateAntiresonatorCoeffs(F, Bw, sampleRate) {
    // First get resonator coefficients
    const { A, B, C } = calculateResonatorCoeffs(F, Bw, sampleRate);

    // Convert to antiresonator
    return {
        A: 1 / A,
        B: -B / A,
        C: -C * A
    };
}

function antiresonator(input, state, coeffs) {
    // state = { x1: 0, x2: 0 }  // x(n-1), x(n-2)
    const output = coeffs.A * input + coeffs.B * state.x1 + coeffs.C * state.x2;
    state.x2 = state.x1;
    state.x1 = input;  // Note: stores INPUT history, not output
    return output;
}
```

---

## Synthesizer Architecture (Figure 10)

### Signal Flow Diagram
```
                                    ┌─────────────────────────────────────────────────────────┐
                                    │                    CASCADE BRANCH                        │
                                    │  fnp,bnp   fnz,bnz   f1,b1   f2,b2   f3,b3   f4,b4   f5,b5  │
                                    │    ▼         ▼        ▼       ▼       ▼       ▼       ▼   │
 ┌──────────┐    ┌─────────┐       │  [rnpc]──►[rnz]──►[r1c]──►[r2c]──►[r3c]──►[r4c]──►[r5c]──┼──►(+)
 │  Sound   │───►│Low-Pass │──[av]─┼──►                                                        │   │
 │  Source  │    │ (tilt)  │       │                                                           │   │
 │   f0     │    └─────────┘       └───────────────────────────────────────────────────────────┘   │
 └────┬─────┘         │                                                                            │
      │               │                                                                            │
      │          [avp]┼────────────────────────────────────────────────────────────────────────────┤
      │               │                                                                            │
 [aturb]              │            ┌─────────────────────────────────────────────────────────┐     │
      │               │            │                    PARALLEL BRANCH                       │     │
      ▼               │            │                                                          │     │
   ┌──────┐           │            │  [anp]──►[rnpp]─────────────────────────────────────────┼─►   │
   │Noise │           │            │     b2p                                                  │     │
   └──┬───┘           │            │  [a1]──►[r1p]───────────────────────────────────────────┼─►   │
      │               │            │     b1p                                                  │     │
      ├───[asp]──►[LPF]──►[Preemph]┼──►[a2]──►[r2p]───────────────────────────────────────────┼─►(+)──►OUT
      │               │            │     b2p                                                  │     │
      │               │            │  [a3]──►[r3p]───────────────────────────────────────────┼─►   │
      └───[af]────────┼────────────┼──►    b3p                                                │     │
                      │            │  [a4]──►[r4p]───────────────────────────────────────────┼─►   │
                      │            │     b4p                                                  │     │
                      │            │  [a5]──►[r5p]───────────────────────────────────────────┼─►   │
                      │            │     b5p                                                  │     │
                      │            │  [a6]──►[r6p]───────────────────────────────────────────┼─►   │
                      │            │     b6p                                                  │     │
                      │            │  [ab]───────────────────────────────────────────────────┼─►   │
                      │            └─────────────────────────────────────────────────────────┘     │
                      │                                                                            │
                      └────────────────────────────────────────────────────────────────────────────┘
```

### Component Legend

| Block | Function |
|-------|----------|
| Sound Source | Generates voiced excitation (impulse train or LF model) at frequency f0 |
| Low-Pass (tilt) | Spectral tilt filter, attenuates high frequencies |
| av | Voicing amplitude for cascade branch |
| avp | Voicing amplitude for parallel branch (for mixed sounds) |
| aturb | Turbulence noise added to voiced source |
| Noise | White noise generator |
| asp | Aspiration amplitude (noise through low-pass) |
| af | Frication amplitude (noise direct to parallel) |
| Preemph | Preemphasis filter (high-frequency boost) |
| rnpc | Nasal pole resonator (cascade) |
| rnz | Nasal zero antiresonator (cascade) |
| r1c-r5c | Formant resonators (cascade) |
| rnpp | Nasal pole resonator (parallel) |
| r1p-r6p | Formant resonators (parallel) |
| a1-a6 | Formant amplitude controls (parallel) |
| anp | Nasal amplitude (parallel) |
| ab | Bypass path amplitude (flat spectrum fricatives) |

### Key Signal Routing

1. **Voiced sounds (vowels)**: Sound Source → tilt → av → CASCADE → output
2. **Voiceless fricatives**: Noise → af → PARALLEL → output
3. **Voiced fricatives**: Sound Source + Noise(aturb) → both branches
4. **Aspiration**: Noise → LPF → asp → Preemph → PARALLEL
5. **Nasals**: Uses both rnpc (pole) and rnz (zero) in cascade

---

## Complete Parameter Reference

### Table 1: All Synthesis Parameters

| Symbol | Name | Min | Max | Default/Typical | Notes |
|--------|------|-----|-----|-----------------|-------|
| **Source Parameters** |||||
| f0 (Hz) | Fundamental frequency | 0 | 500 | 150 | Pitch; 0 = unvoiced |
| av (dB) | Voicing amplitude (cascade) | 0 | 80 | 60 | Vowels typically 60dB |
| avp (dB) | Voicing amplitude (parallel) | 0 | 80 | 0 | For voiced fricatives |
| asp (dB) | Aspiration amplitude | 0 | 80 | 0 | Breathy/aspirated sounds |
| aturb (dB) | Turbulence amplitude | 0 | 80 | 0 | Breathy voice ~40dB |
| af (dB) | Frication amplitude (parallel) | 0 | 80 | 0 | Fricatives |
| ab (dB) | Bypass amplitude | 0 | 80 | 0 | Flat-spectrum frication |
| tilt (dB) | Spectral tilt at 3kHz | 0 | 41 | 0 | Low-freq emphasis |
| **Formant Frequencies (shared)** |||||
| f1 (Hz) | 1st formant frequency | 150 | 1300 | 350 | |
| f2 (Hz) | 2nd formant frequency | 500 | 3000 | 2221 | |
| f3 (Hz) | 3rd formant frequency | 1200 | 4800 | 2859 | |
| f4 (Hz) | 4th formant frequency | 2400 | 4990 | 3664 | |
| f5 (Hz) | 5th formant frequency | 3000 | 4990 | 3750 | |
| f6 (Hz) | 6th formant frequency | 3000 | 4990 | 4900 | Parallel only |
| **Cascade Bandwidths** |||||
| b1 (Hz) | 1st formant bandwidth | 30 | 1000 | 50 | |
| b2 (Hz) | 2nd formant bandwidth | 40 | 1000 | 70 | |
| b3 (Hz) | 3rd formant bandwidth | 40 | 1000 | 110 | |
| b4 (Hz) | 4th formant bandwidth | 100 | 1000 | 250 | |
| b5 (Hz) | 5th formant bandwidth | 100 | 1500 | 200 | |
| b6 (Hz) | 6th formant bandwidth | 100 | 4000 | 1000 | |
| **Parallel Bandwidths** |||||
| b1p (Hz) | 1st formant bandwidth | 40 | 1000 | 50 | |
| b2p (Hz) | 2nd formant bandwidth | 40 | 1000 | 70 | |
| b3p (Hz) | 3rd formant bandwidth | 60 | 1000 | 110 | |
| b4p (Hz) | 4th formant bandwidth | 100 | 1000 | 250 | |
| b5p (Hz) | 5th formant bandwidth | 100 | 1500 | 200 | |
| b6p (Hz) | 6th formant bandwidth | 100 | 4000 | 1000 | |
| **Parallel Amplitudes** |||||
| a1 (dB) | 1st formant amplitude | 0 | 80 | 0 | |
| a2 (dB) | 2nd formant amplitude | 0 | 80 | 0 | |
| a3 (dB) | 3rd formant amplitude | 0 | 80 | 0 | |
| a4 (dB) | 4th formant amplitude | 0 | 80 | 0 | |
| a5 (dB) | 5th formant amplitude | 0 | 80 | 0 | |
| a6 (dB) | 6th formant amplitude | 0 | 80 | 0 | |
| anp (dB) | Nasal amplitude (parallel) | 0 | 80 | 0 | |
| **Nasal Parameters** |||||
| fnp (Hz) | Nasal pole frequency | 180 | 500 | 250 | |
| bnp (Hz) | Nasal pole bandwidth | 40 | 1000 | 100 | |
| fnz (Hz) | Nasal zero frequency | 180 | 500 | 250 | Cascade only |
| bnz (Hz) | Nasal zero bandwidth | 40 | 1000 | 100 | Cascade only |
| **Global Parameters** |||||
| gain (dB) | Overall output gain | 0 | 80 | 47 | Unity = 60dB per Klatt |
| n | Number of cascade resonators | 1 | 6 | 5 | |
| s (Hz) | Sampling frequency | 5000 | 10000 | 10000 | |
| f (ms) | Frame length | 5 | 5000 | 5 | Update rate |
| c | Configuration | - | - | - | cascade/parallel selector |
| v | Voice source type | - | - | - | impulse/LF |

### GUI-Extracted Working Values (Figure 11)

From the screenshot, a working vowel configuration:
```
f0=150Hz    av=60dB     f1=350Hz    b1=50Hz
f2=2221Hz   b2=70Hz     f3=2859Hz   b3=110Hz
f4=3664Hz   b4=250Hz    f5=3750Hz   b5=200Hz
f6=4900Hz   b6=1000Hz
fnz=250Hz   bnz=100Hz   fnp=250Hz   bnp=100Hz
asp=0dB     kopen=10    aturb=0dB   tilt=0dB
al=0dB      skew=0
gain=47dB   n=5         s=10000Hz   f=5ms

LF Model: Te=58%  Tp=44%  Ta=2%
```

---

## LF Glottal Source Model

### Parameters (from Figure 2 and GUI)

The LF model describes the **derivative** of glottal flow (not flow itself).

| Parameter | Symbol | Description | Typical |
|-----------|--------|-------------|---------|
| Time to positive peak | tp | Time from glottal opening to max opening velocity | 44% of T0 |
| Time of excitation | te | Time of glottal closure (main excitation) | 58% of T0 |
| Return phase time constant | ta | Exponential return after closure | 2% of T0 |
| Excitation amplitude | Ee | Amplitude at moment of closure | - |

### Waveform Shape (Figure 2)
```
     dB
     30 ┤        ┌─────────────────────────────────
        │        │
     20 ┤        │                     ta
        │       ╱│                    ╱
     10 ┤      ╱ │                   ╱
        │     ╱  │                  ╱
      0 ┼────╱───┼─────────────────╱───────────────
        │  t0   t1      tp       te              tc
    -10 ┤        │        ╲      ╱
        │        │         ╲    ╱
    -20 ┤        │          ╲  ╱
        │        │           ╲╱
    -30 ┤        │
        │        │
    -40 ┤        │           Ee
        │        │            │
    -50 ┼────────┴────────────┴───────────────────
        0    1    2    3    4    5    6    7    8 ms
```

### Key Timing Relationships
- T0 = 1/f0 = fundamental period
- tp, te, ta are typically expressed as percentages of T0
- Opening phase: t0 to tp (positive slope)
- Closing phase: tp to te (negative slope, reaches Ee)
- Return phase: te to tc (exponential recovery with time constant ta)

---

## Portuguese Vowel Formant Data (Table 2)

| Vowel | IPA | Example Word | F1 (Hz) | F2 (Hz) | F3 (Hz) |
|-------|-----|--------------|---------|---------|---------|
| /i/ | [i] | "vir" | 225 | 2100 | 2750 |
| /e/ | [e] | "pêra" | 390 | 1850 | 2503 |
| /E/ | [ɛ] | "leve" | 651 | 1629 | 2580 |
| /a/ | [a] | "cara" | 714 | 1528 | 2425 |
| /6/ | [ɐ] | "canto" | 680 | 1688 | 2470 |
| /o/ | [o] | "dor" | 453 | 946 | 2553 |
| /O/ | [ɔ] | "corda" | 588 | 1070 | 2365 |
| /u/ | [u] | "cume" | 311 | 953 | 2070 |
| /@/ | [ə] | "pequenina" | 179 | 1610 | 2413 |

### Comparison with English (Peterson & Barney)

| Vowel | Portuguese F1 | English F1 (P&B) | Notes |
|-------|---------------|------------------|-------|
| /i/ | 225 | 270 | Portuguese slightly lower |
| /a/ | 714 | 730 | Very similar |
| /u/ | 311 | 300 | Very similar |

### Prosody for Isolated Vowels
- F0 decreases linearly from **130 Hz to 100 Hz**
- av amplitude reduced progressively toward utterance end

---

## Synthesis Strategy by Sound Class

### Oral Vowels (/i/, /e/, /E/, /a/, /6/, /o/, /O/, /u/, /@/)
- Source: LF model glottal pulses
- Path: CASCADE branch only
- av: ~60 dB
- All parallel amplitudes: 0 dB

### Nasal Vowels
- Source: LF model
- Path: CASCADE with nasal pole (fnp) and nasal zero (fnz) active
- Nasal zero creates spectral notch

### Semivowels and Diphthongs
- Source: LF model
- Path: CASCADE
- Formants transition smoothly

### Voiceless Fricatives (/f/, /s/, /S/, ...)
- Source: White noise only (f0 = 0)
- Path: PARALLEL branch only
- af controls frication amplitude
- ab for flat-spectrum component

### Voiced Fricatives
- Source: MIXED (LF model + noise via aturb)
- Path: Both CASCADE and PARALLEL
- Requires careful amplitude balancing

### Voiced Plosives
- Source: MIXED
- Closure: noise burst through parallel
- Release: voicing resumes through cascade

### Aspiration (breathy sounds, /h/)
- Source: Noise through low-pass filter
- asp: ~40-60 dB
- Can combine with voicing

---

## Implementation Notes

### Cascade vs Parallel Usage

| Sound Type | Cascade | Parallel | Notes |
|------------|---------|----------|-------|
| Vowels | YES | no | Automatic amplitude relationships |
| Nasals | YES | optional | Zero+pole in cascade |
| Fricatives | no | YES | Need individual amplitude control |
| Plosives | burst:no | burst:YES | Closure through parallel |
| Voiced fric | YES | YES | Both branches active |

### Why Cascade for Vowels?
- Cascade automatically produces correct relative formant amplitudes
- No need to specify a1, a2, a3... individually
- Natural spectral tilt emerges from cascaded resonators

### Why Parallel for Fricatives?
- Fricative spectra don't follow cascade amplitude relationships
- Need independent control of each spectral peak
- ab bypass provides flat high-frequency energy

### Frame-Based Processing
- Parameters updated every frame (typically 5ms)
- Interpolation needed for smooth transitions
- Filter states persist across frames

---

## Acoustic Theory Foundation

### Source-Filter Model (Equation 1)
```
P(f) = U(f) · T(f) = U(f) · H(f) · R(f)
```

| Term | Meaning | Implementation |
|------|---------|----------------|
| P(f) | Output speech pressure spectrum | Final output |
| U(f) | Glottal source volume velocity | LF model or impulse |
| T(f) | Total transfer function | H(f) × R(f) |
| H(f) | Vocal tract transfer function | Resonator cascade |
| R(f) | Radiation characteristic | +6 dB/octave (lips) |

### Radiation Approximation
Conversion from volume velocity to pressure at lips:
- Theoretically: +6 dB/octave (differentiation)
- Often built into source model or added as preemphasis

---

## Figures Reference

| Figure | Page | Content | Implementation Value |
|--------|------|---------|---------------------|
| 1 | 1 | Source-filter model block diagram | Conceptual overview |
| 2 | 1 | LF model waveform with parameters | Critical: tp, te, ta, Ee definitions |
| 3 | 1 | Source type options | Voice/Unvoice/Mixed routing |
| 4 | 2 | Tract options | Cascade/Parallel selection |
| 5 | 2 | GUI component diagram | System architecture |
| 6 | 2 | Full system diagram | File I/O structure |
| 7 | 2 | Parallel configuration | A1→R1, A2→R2... summed |
| 8 | 2 | Cascade configuration | R5→R4→R3→R2→R1 series |
| 9 | 3 | Resonator block diagram | **Direct Form II implementation** |
| 10 | 3 | Complete synthesizer | **Master reference diagram** |
| 11 | 5 | GUI screenshot | **Working parameter values** |
| 12 | 5 | /E/ natural vs synthetic | Waveform + LPC comparison |
| 13 | 6 | "Baby" spectrograms | Natural vs synthetic comparison |

---

## Results and Validation

### Perceptual Testing
- Synthesized Portuguese /E/ correctly identified by listeners
- Demonstrates basic vowel synthesis works

### Spectral Comparison (Figure 12)
- 16th-order LPC analysis
- Natural vs synthetic spectra similar at low frequencies
- High-frequency mismatch due to only 3 formants used

### Word Synthesis (Figure 13)
- "Baby" /beIbi/ synthesized for English
- Duration: natural 286ms, synthetic 322ms
- Sampling: 8 kHz
- Parameters from external TTS system

---

## Limitations

1. **Speed**: MATLAB implementation too slow for real-time
2. **Formants**: Only 3 formants for Portuguese vowels (HF mismatch)
3. **Prosody**: No detailed prosody model described
4. **Language**: Portuguese-specific vowel data; English requires external parameters
5. **Source**: LF model details not fully specified (references Fant 1985)

---

## Relevance to Qlatt Project

### Directly Usable

1. **Resonator equations**: Confirmed identical to Klatt 1980
   - Same A, B, C coefficient formulas
   - Same difference equation

2. **Antiresonator equations**: Clear A', B', C' derivation
   - A' = 1/A, B' = -B/A, C' = -C*A

3. **Parameter ranges**: Validation bounds for our implementation

4. **Working values from GUI**: Real tested configuration
   - gain=47dB (not 60dB!) for reasonable output
   - Typical bandwidths: b1=50, b2=70, b3=110, b4=250, b5=200

5. **LF parameters as percentages**: Te=58%, Tp=44%, Ta=2%
   - Useful for default LF configuration

### Architecture Confirmation

- Cascade for vowels (automatic amplitude)
- Parallel for fricatives (manual amplitude)
- Nasal zero in cascade only
- Preemphasis between cascade output and parallel input
- ab bypass for flat-spectrum frication

### Cross-Reference Value

- Portuguese vowel formants for future multilingual support
- Confirms F0 declination pattern (130→100 Hz)
- Validates perceptual adequacy of basic Klatt approach

---

## Open Questions

- [ ] What is "kopen" parameter in GUI? (Possibly open quotient for LF?)
- [ ] What is "skew" parameter? (Possibly glottal pulse asymmetry?)
- [ ] What is "al" parameter? (Possibly low-frequency amplitude?)
- [ ] Exact LF model equations used? (Paper cites Fant 1985)
- [ ] How is preemphasis implemented? (Cutoff? Slope?)
- [ ] What is "F=0%" in GUI? (Frame position?)

---

## References from Paper

1. Fant, G.: **Acoustic Theory of Speech Production**, Mouton, 1960
2. Fant, G., Liljencrants, J., Lin, Q.: **A Four-Parameter Model of Glottal Flow**, STL-QPSR 4/1985, pp. 1-13 ← *LF model source*
3. Klatt, D.H.: **Software for a Cascade/Parallel Formant Synthesiser**, JASA 67(3), 1980, pp. 971-995 ← *Primary reference*
4. Klatt, D.H., Klatt, L.C.: **Analysis, Synthesis, and Perception of Voice Quality Variations**, JASA 87(2), 1990, pp. 820-857
5. Holmes, J.N.: **The Influence of Glottal Waveform on the Naturalness of Speech**, IEEE Trans. Audio Electroacoust. AU-21(3), 1973
6. Holmes, J.N.: **Formant Synthesisers: Cascade or Parallel?**, Speech Communication 2(4), 1983, pp. 251-273
7. Holmes, W.J., Holmes, J.N., Judd, M.W.: **Extension of the Bandwidth of the JSRU Parallel-Formant Synthesizer**, ICASSP 1990
8. Teixeira, A.J.: Internal Research, Universidade de Aveiro, 1995 ← *Portuguese vowel data source*
