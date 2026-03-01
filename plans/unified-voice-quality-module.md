# Unified Voice Quality Module - Implementation Specification

**Date:** 2026-01-27
**Status:** Complete Implementation Specification
**Supersedes:** voice-quality-fa-parameter.md, vocal-effort-modeling.md, fant1997-voice-source-dynamics.md, emotional-glottal-excitation.md

---

## 1. Overview

This module provides unified voice quality control for the Qlatt synthesizer through the Rd parameter (0.3-2.7), which derives all LF source coefficients and maps to perceptual voice qualities (pressed, modal, breathy). Five modulation factors are applied additively to a base Rd value.

**Core equation:**
```
Rd_final = clamp(Rd_base + ΔRd_phoneme + ΔRd_stress + ΔRd_effort + ΔRd_emotion + ΔRd_phrase, 0.3, 2.7)
```

---

## 2. Core Equations

### 2.1 Rd to LF Parameter Derivation

**Source:** Perrotin et al. (2021) "Perceptual Equivalence of LF and Linear Filter Models", JASA 150(2):1273-1285, Appendix A, Eq. A1

The single Rd parameter derives the three R-parameters (Ra, Rk, Rg), which then derive the timing parameters:

```
Step 1: Rd → R-parameters
────────────────────────────────────────────────────────────────────
Ra = (-1 + 4.8 × Rd) / 100
Rk = (22.4 + 11.8 × Rd) / 100
Rg = Rk × (0.5 + 1.2 × Rk) / (0.44 × Rd - 4 × Ra × (0.5 + 1.2 × Rk))

Step 2: R-parameters → Timing quotients
────────────────────────────────────────────────────────────────────
Oq = (1 + Rk) / (2 × Rg)           // Open quotient
αm = 1 / (1 + Rk)                  // Asymmetry coefficient
Ta = Ra × T0                        // Return phase time (seconds)

Where:
  T0 = 1 / F0                       // Fundamental period
```

**Rd range interpretation:**

| Rd Value | Ra | Rk | Oq | αm | Voice Quality |
|----------|-----|-----|-----|-----|---------------|
| 0.3 | 0.004 | 0.26 | 0.31 | 0.79 | Very pressed |
| 0.7 | 0.024 | 0.31 | 0.52 | 0.76 | Modal (male default) |
| 1.0 | 0.038 | 0.34 | 0.57 | 0.75 | Modal |
| 1.4 | 0.057 | 0.39 | 0.64 | 0.72 | Modal (female default) |
| 2.0 | 0.086 | 0.46 | 0.73 | 0.69 | Breathy |
| 2.7 | 0.120 | 0.54 | 0.82 | 0.65 | Very breathy |

### 2.2 LFLM Filter Implementation

**Source:** Perrotin et al. (2021), Eq. C2-C6

The LFLM (Linear Filter LF Model) provides a 10-100x more efficient implementation than the time-domain LF model, with perceptual equivalence validated experimentally.

**Architecture:** Two cascaded filters:
1. **Glottal formant biquad** - Resonant filter creating the glottal formant peak
2. **Spectral tilt 1-pole lowpass** - Adding high-frequency rolloff

```
LFLM Digital Implementation
════════════════════════════════════════════════════════════════════

Step 1: Compute glottal formant parameters (Eq. C3)
────────────────────────────────────────────────────────────────────
Fg = 1 / (2 × Oq × T0)                    // Glottal formant frequency (Hz)
Bg = 1 / (Oq × T0 × tan(π × (1 - αm)))    // Glottal formant bandwidth (Hz)
Ag = E / sin(π × (1 - αm))                // Amplitude normalization (CRITICAL!)

Where:
  E = peak excitation amplitude (arbitrary units, typically 0.2)

Step 2: Compute spectral tilt cutoff (Eq. C5)
────────────────────────────────────────────────────────────────────
Fa = 1 / (2 × π × Ta)                     // Spectral tilt cutoff (Hz)

Step 3: Convert to digital filter coefficients (Eq. C2)
────────────────────────────────────────────────────────────────────
Glottal formant biquad (input: pulse train at GOIs):
  b0 = 0
  b1 = -Ag
  b2 = Ag
  a1 = -2 × exp(-π × Bg / Fs) × cos(2π × Fg / Fs)
  a2 = exp(-2π × Bg / Fs)

Spectral tilt 1-pole lowpass:
  b_ST = 1 - exp(-2π × Fa / Fs)
  a_ST = -exp(-2π × Fa / Fs)

Where:
  Fs = sample rate (e.g., 44100 Hz)

Step 4: Synthesis recursion (Eq. E3-E4)
────────────────────────────────────────────────────────────────────
// Glottal formant filter (pulse at GOI triggers)
x_gf[n] = b1 × δ_goi[n-1] + b2 × δ_goi[n-2] - a1 × x_gf[n-1] - a2 × x_gf[n-2]

// Spectral tilt filter
x_out[n] = b_ST × x_gf[n-1] - a_ST × x_out[n-1]
```

**CRITICAL: Amplitude normalization**
The factor `Ag = E / sin(π × (1 - αm))` is essential. Without it, output level swings wildly (±20 dB) as αm changes with voice quality. This normalization ensures consistent perceived loudness across Rd values.

### 2.3 Spectral Tilt Derivation

**Source:** Doval et al. (2006) "The Spectrum of Glottal Flow Models", Acta Acustica 92, Eq. 18

The spectral tilt adds -6 dB/octave rolloff above frequency Fa, controlled by the return phase time constant Ta:

```
Fa = 1 / (2π × Ta)

For Klatt TL parameter (dB attenuation at 3000 Hz):
  Ta = sqrt(10^(TL/10) - 1) / (2π × 3000)

Relationship to Rd:
  Ra = Ta / T0 = (-1 + 4.8 × Rd) / 100
  Ta = Ra × T0 = Ra / F0

Therefore:
  Fa = F0 / (2π × Ra) = F0 × 100 / (2π × (-1 + 4.8 × Rd))
```

**Spectral tilt values by voice quality:**

| Rd | Ra | Fa (at F0=110Hz) | TL equivalent |
|----|-----|------------------|---------------|
| 0.5 | 0.014 | 1251 Hz | ~2 dB |
| 1.0 | 0.038 | 460 Hz | ~10 dB |
| 1.5 | 0.062 | 282 Hz | ~16 dB |
| 2.0 | 0.086 | 203 Hz | ~20 dB |
| 2.5 | 0.110 | 159 Hz | ~23 dB |

---

## 3. Voice Quality Presets

### 3.1 Gobl & Ni Chasaide (2003) KLSYN88 Parameters

**Source:** Gobl & Ni Chasaide (2003) "The Role of Voice Quality in Communicating Emotion, Mood and Attitude", Speech Communication 40:189-212, Fig. 1

Complete parameter trajectories for 7 voice qualities:

| Quality | AV (dB) | OQ (%) | TL (dB) | SQ (%) | AH (dB) | DI (%) | B1 (Hz) | Rd equiv |
|---------|---------|--------|---------|--------|---------|--------|---------|----------|
| **Modal** | 50-55 | 50-55 | 10-15 | 270-300 | 0 | 0 | 120-150 | 1.0 |
| **Tense** | 42-48 | 35-40 | 5-8 | 350-400 | 0 | 0 | 50-70 | 0.5 |
| **Harsh** | 42-48 | 35-40 | 5-8 | 350-400 | 0 | 10-20 | 50-70 | 0.5 |
| **Breathy** | 35-42 | 85-95 | 20-30 | 130-170 | 35-50 | 0 | 200-250 | 2.2 |
| **Whispery** | 30-40 | 70-80 | 22-30 | 170-220 | 45-55 | 5 | 200-250 | 2.0 |
| **Creaky** | 50-55 | 45-55 | 10-15 | 270-300 | 0 | 5-25 | 120-150 | 1.0* |
| **Lax-creaky** | 35-42 | 45-55 | 20-30 | 130-170 | AH-20 | 15-25 | 200-250 | 1.8 |

*Creaky voice requires additional F0 reduction (~30 Hz) and diplophonia (DI parameter).

**Key transformations from modal:**

```javascript
// Modal → Tense
OQ -= 15;        // Shorter open phase
SQ += 80;        // Faster closing
TL -= 5;         // Less spectral tilt (brighter)
B1 -= 70;        // Narrower first formant
F0 += 5;         // Slightly higher pitch

// Modal → Breathy
AV -= 15;        // Lower voicing amplitude
OQ += 40;        // Longer open phase
SQ -= 140;       // Slower closing
TL += 15;        // More spectral tilt (darker)
B1 += 80;        // Wider first formant bandwidth
AH = 40;         // Add aspiration noise

// Modal → Creaky
F0 -= 30;        // Lower pitch
DI = 15;         // Diplophonia (period doubling)

// Modal → Lax-creaky
// Breathy settings + creaky F0/DI
```

### 3.2 Burkhardt (2009) Rate Formulas

**Source:** Burkhardt (2009) "Rule-Based Voice Quality Variation with Formant Synthesis", Interspeech 2009

Single `rate` parameter (0-100) controls voice quality. All formulas use additive/subtractive pattern from global defaults.

```javascript
// Constants (typical defaults)
const OQ_glob = 50;   // %
const OQ_min = 10;    // %
const OQ_max = 100;   // %
const TL_glob = 12;   // dB
const TL_max = 24;    // dB
const B1_glob = 90;   // Hz
const B1_min = 30;    // Hz
const B1_max = 250;   // Hz
const AV_base = 60;   // dB
const BTP_glob = 180; // Hz (tracheal pole bandwidth)
const BNP_glob = 100; // Hz (nasal pole bandwidth)

// ─────────────────────────────────────────────────────────────────
// BREATHY VOICE (rate 0-100)
// ─────────────────────────────────────────────────────────────────
OQ = OQ_glob + (OQ_max - OQ_glob) * rate / 100;        // 50 → 100%
TL = TL_glob + (TL_max - TL_glob) * rate / 100;        // 12 → 24 dB
B1 = B1_glob + (B1_max - B1_glob) * rate / 100;        // 90 → 250 Hz
AV = AV_base - 6 * rate / 100;                          // 60 → 54 dB
AH = (AV_base - 3) * rate / 100;                        // 0 → 57 dB

// Tracheal coupling (Klatt 1990)
BTP = BTP_glob - (BTP_glob - 30) * rate / 100;         // 180 → 30 Hz
BNP = BNP_glob - (BNP_glob - 30) * rate / 100;         // 100 → 30 Hz

// Simplified Rd approximation:
Rd = 1.0 + 1.7 * rate / 100;                            // 1.0 → 2.7

// ─────────────────────────────────────────────────────────────────
// TENSE VOICE (rate 0-100)
// ─────────────────────────────────────────────────────────────────
OQ = OQ_glob - (OQ_glob - OQ_min) * rate / 100;        // 50 → 10%
TL = TL_glob - TL_glob * rate / 100;                    // 12 → 0 dB
B1 = B1_glob - (B1_glob - B1_min) * rate / 100;        // 90 → 30 Hz
AV = AV_base + 6 * rate / 100;                          // 60 → 66 dB

// Simplified Rd approximation:
Rd = 1.0 - 0.7 * rate / 100;                            // 1.0 → 0.3

// ─────────────────────────────────────────────────────────────────
// WHISPERY VOICE (rate 0-100)
// ─────────────────────────────────────────────────────────────────
AV = AV_base - AV_base * rate / 100;                    // 60 → 0 dB
AH = AV_base * rate / 100;                              // 0 → 60 dB
OQ = OQ_glob + (OQ_max - OQ_glob) * rate / 100;
TL = TL_glob + (TL_max - TL_glob) * rate / 100;
B1 = B1_glob + (B1_max - B1_glob) * rate / 100;
// ... B2-B5 similarly widened

// ─────────────────────────────────────────────────────────────────
// CREAKY VOICE / LAX-CREAKY (rate 0-100)
// ─────────────────────────────────────────────────────────────────
DI = rate;                                              // 0 → 100%
OQ = OQ_glob + (OQ_max - OQ_glob) * rate / 200;        // Half increment
AV = AV_base - 6 * rate / 100;
B1 = B1_glob + (B1_max - B1_glob) * rate / 100;

// ─────────────────────────────────────────────────────────────────
// FALSETTO (rate 0-100)
// ─────────────────────────────────────────────────────────────────
F0 = F0_base + F0_base * rate / 100;                   // Doubled at max
OQ = OQ_glob + (OQ_max - OQ_glob) * rate / 100;
TL = TL_glob + (TL_max - TL_glob) * rate / 100;
FL = rate;                                              // F0 flutter
```

### 3.3 Emotion to Rd Mapping

**Sources:**
- Cummings & Clements (1995) "Analysis of the Glottal Excitation of Emotionally Styled Speech", JASA 98(1):88-98
- Gobl & Ni Chasaide (2003)

**Cummings slope ratios (relative to neutral):**

| Emotion | Opening Slope | Closing Slope | ΔRd |
|---------|---------------|---------------|-----|
| Neutral | 1.00 | 1.00 | 0.0 |
| Angry | 1.93 | 2.07 | -0.5 |
| Loud | 1.93 | 1.93 | -0.4 |
| Soft | 0.55 | 0.55 | +1.2 |
| Sad | ~0.8 | ~0.8 | +0.3 |
| Happy | ~1.3 | ~1.3 | -0.2 |

**Complete emotion profiles:**

```javascript
const EMOTION_PROFILES = {
  neutral: {
    rdDelta: 0.0,
    f0Scale: 1.0,
    f0Variance: 1.0,
    durationScale: 1.0,
    intensityBoost: 0,     // dB
    ahBoost: 0,            // dB
    jitter: 0              // %
  },
  angry: {
    rdDelta: -0.5,         // Very adducted (Cummings: 2.07× closing slope)
    f0Scale: 1.3,          // Higher pitch
    f0Variance: 1.5,       // More pitch movement
    durationScale: 0.85,   // Faster
    intensityBoost: 6,     // Louder
    ahBoost: 0,
    jitter: 0
  },
  loud: {
    rdDelta: -0.4,         // Cummings: 1.93× slopes
    f0Scale: 1.1,
    f0Variance: 1.2,
    durationScale: 0.95,
    intensityBoost: 8,
    ahBoost: 0,
    jitter: 0
  },
  soft: {
    rdDelta: +1.2,         // Very breathy (Cummings: 0.55× slopes)
    f0Scale: 0.95,
    f0Variance: 0.7,
    durationScale: 1.1,
    intensityBoost: -6,
    ahBoost: 8,
    jitter: 0
  },
  sad: {
    rdDelta: +0.3,
    f0Scale: 0.9,
    f0Variance: 0.6,       // Monotone
    durationScale: 1.2,    // Slower
    intensityBoost: -3,
    ahBoost: 4,
    jitter: 0
  },
  happy: {
    rdDelta: -0.2,
    f0Scale: 1.15,
    f0Variance: 1.3,
    durationScale: 0.9,
    intensityBoost: 3,
    ahBoost: 0,
    jitter: 0
  },
  fearful: {
    rdDelta: +0.1,
    f0Scale: 1.2,
    f0Variance: 1.4,
    durationScale: 1.0,
    intensityBoost: 0,
    ahBoost: 2,
    jitter: 1
  },
  bored: {
    rdDelta: +0.8,         // Lax-creaky voice (Gobl 2003)
    f0Scale: 0.85,
    f0Variance: 0.5,
    durationScale: 1.15,
    intensityBoost: -4,
    ahBoost: 6,
    jitter: 0
  }
};
```

---

## 4. Factor Modulation

### 4.1 Phoneme Rd Table

**Source:** Fant (1997) "The Voice Source in Connected Speech", Speech Communication 22:125-139

Delta values are added to the speaker's base Rd (male: 0.7, female: 1.4).

```javascript
/**
 * Phoneme-specific Rd deltas
 * Source: Fant (1997) "The Voice Source in Connected Speech"
 */
const PHONEME_RD = {
  // Open vowels - reference baseline
  'AA': 0.0,   // father
  'AE': 0.0,   // cat
  'AH': 0.0,   // cut
  'AO': 0.0,   // thought

  // Mid vowels - slight increase (supraglottal constriction minor)
  'EH': 0.05,  // bed
  'ER': 0.05,  // bird

  // Close vowels - increased (supraglottal constriction raises subglottal pressure)
  'IY': 0.15,  // beat
  'IH': 0.15,  // bit
  'UW': 0.15,  // boot
  'UH': 0.15,  // book

  // Diphthongs - average of components
  'EY': 0.05,  // bait
  'AY': 0.05,  // bite
  'OW': 0.05,  // boat
  'AW': 0.05,  // bout
  'OY': 0.05,  // boy

  // Voiced stop closures - breathy voicing maintenance
  'B_CL': 0.5,
  'D_CL': 0.5,
  'G_CL': 0.5,

  // Nasals - soft voicing, open velopharyngeal port
  'M': 0.3,
  'N': 0.3,
  'NG': 0.3,

  // Voiced fricatives - moderate constriction
  'V': 0.2,
  'DH': 0.2,
  'Z': 0.2,
  'ZH': 0.2,

  // Approximants - relatively open vocal tract
  'L': 0.1,
  'R': 0.05,   // Lower than others (more constricted)
  'W': 0.1,
  'Y': 0.1,

  // Voiced [h] - maximum breathiness
  'HH': 1.2,

  // Reduced vowel
  'AX': 0.1
};
```

### 4.2 Stress Modulation

**Sources:** Fant (1997), Cummings & Clements (1995)

Stressed syllables exhibit greater glottal adduction (lower Rd, clearer voice quality).

```javascript
/**
 * Stress-based Rd modulation
 * Source: Fant (1997) "Rd decreases by 0.1-0.3 for stressed"
 * Source: Cummings (1995) "Closing slope increases 1.04-1.15× for stressed"
 */
function getStressRdDelta(stress) {
  switch (stress) {
    case 1:  return -0.15;  // Primary stress: more adducted, clearer
    case 2:  return -0.05;  // Secondary stress: slight adduction
    case 0:  return +0.10;  // Unstressed: slightly breathier, reduced
    default: return 0.0;
  }
}
```

### 4.3 Effort Modulation

**Source:** Lienard & Di Benedetto (1999) "Effect of Vocal Effort on Spectral Properties of Vowels", JASA 106(1):411-422

```yaml
# Effort coefficients from Lienard 1999
effortCoeffs:
  f0HzPerDb: 5.1       # F0 increases 5.1 Hz per dB effort
  f1HzPerDb: 3.5       # F1 increases ~3.5 Hz per dB effort
  rdPerDb: -0.05       # Rd decreases (more adducted) with effort
  a1Slope: 1.10        # A1 changes 1.10 dB per dB effort
  a2Slope: 1.24        # A2 changes 1.24 dB per dB effort
  a3Slope: 1.30        # A3 changes 1.30 dB per dB effort
```

**Stress-to-effort mapping:**

```javascript
/**
 * Map stress level to vocal effort
 * Source: Lienard (1999) - conversational range ~±4.5 dB
 */
const EFFORT_BY_STRESS = {
  0: -1.5,  // Unstressed: reduced effort
  1: +3.0,  // Primary stress: increased effort
  2: +1.0   // Secondary stress: mild increase
};
```

**Effort-derived acoustics in semantics.yaml:**

```yaml
realize:
  # F0 shift from effort
  f0Effective:
    expr: "F0 + effort * effortCoeffs.f0HzPerDb"
    deps: [F0, effort]

  # F1 shift from effort
  f1Effective:
    expr: "F1 + effort * effortCoeffs.f1HzPerDb"
    deps: [F1, effort]

  # Spectral tilt in parallel amplitudes
  a1Linear:
    expr: "dbToLinear(A1 + n12Cor + ndbScale.A1 + (effortCoeffs.a1Slope - 1) * effort) * parallelScale"
    deps: [A1, n12Cor, parallelScale, effort]

  a2Linear:
    expr: "-dbToLinear(A2 + n12Cor * 2 + n23Cor + ndbScale.A2 + (effortCoeffs.a2Slope - 1) * effort) * parallelScale"
    deps: [A2, n12Cor, n23Cor, parallelScale, effort]

  a3Linear:
    expr: "dbToLinear(A3 + n23Cor * 2 + n34Cor + ndbScale.A3 + (effortCoeffs.a3Slope - 1) * effort) * parallelScale"
    deps: [A3, n23Cor, n34Cor, parallelScale, effort]
```

### 4.4 Phrase Contour

**Source:** Fant (1997) "The Voice Source in Connected Speech"

Voice quality varies systematically through phrases:
1. **Onset**: More adducted (attack)
2. **Declination**: Gradual relaxation
3. **Final**: Characteristic breathiness

```javascript
/**
 * Phrase-level Rd contour
 * Source: Fant (1997)
 */
function computeRdPhraseContour(time, phraseStart, phraseEnd) {
  const posInPhrase = time - phraseStart;
  const phraseDuration = phraseEnd - phraseStart;
  let rdContour = 0;

  // 1. Onset attack: Rd starts -0.2 lower, rises over first 50ms
  //    More adducted at phrase start for "attack" quality
  if (posInPhrase < 0.05) {
    const onsetFactor = posInPhrase / 0.05;
    rdContour -= 0.2 * (1 - onsetFactor);
  }

  // 2. Main declination: +0.1 Rd per second
  //    Gradual relaxation through phrase
  rdContour += 0.1 * posInPhrase;

  // 3. Final breathiness: last 300ms, accelerated increase
  //    Characteristic phrase-final breathiness
  const timeToEnd = phraseEnd - time;
  if (timeToEnd < 0.3) {
    const finalFactor = 1 - (timeToEnd / 0.3);
    rdContour += 0.3 * finalFactor;
  }

  return rdContour;
}
```

### 4.5 Rd-AV Covariation

**Source:** Fant (1997) - 2:1 relationship

When Rd changes, voicing amplitude (AV) must compensate to maintain perceived loudness:

```javascript
// After computing final Rd
const rdRatio = baseRd / finalRd;
const avAdjust = 40 * Math.log10(rdRatio);  // 2:1 covariation
frame.params.AV = (frame.params.AV || 60) + avAdjust;
```

---

## 5. Perceptual Constraints

**Source:** van Dinther et al. (2004) "A Method for Analysing the Perceptual Relevance of Glottal-Pulse Parameter Variations", Speech Communication 42:175-189

### 5.1 Just Noticeable Difference

```
Key finding: 4.3 dB EPD (Excitation Pattern Distance) = 1 JND

Where EPD is computed via Moore et al. (1997) loudness model on ERB scale.
```

### 5.2 Parameter Sensitivity Ranking

From van Dinther's eigenvalue analysis:

| Parameter | Relative Sensitivity | JND Magnitude |
|-----------|---------------------|---------------|
| Ra (return phase) | **Highest** | ~10⁻³ |
| Rk (symmetry) | Intermediate | ~10⁻² |
| Ro (open quotient) | **Lowest** | ~10⁻¹ |

**Practical implication:** Focus control effort on Ra (via Rd), not Oq.

### 5.3 Minimum Audible Rd Step

Derived from 4.3 dB EPD threshold:

```
Minimum audible Rd change ≈ 0.15

Changes smaller than this are imperceptible.
```

### 5.4 Saturation Limits

Each factor is capped independently before summation:

| Factor | Max |ΔRd| |
|--------|------|
| Phoneme | ±1.0 |
| Stress | ±0.3 |
| Effort | ±0.5 |
| Emotion | ±0.7 |
| Phrase | ±0.5 |

Final Rd always clamped to [0.3, 2.7].

---

## 6. Advanced Features

### 6.1 Pulsatile Noise for Breathiness

**Source:** Fraj et al. (2011) "Synthesis of Breathy and Rough Voices", MAVEBA Florence

More natural than constant AH aspiration:

```
Pulsatile noise equation:
────────────────────────────────────────────────────────────────────
noisy_velocity(n) = u_g(n) + n1 × u_g(n-d) × noise(n) + n2

Where:
  u_g(n)    = clean glottal volume velocity
  n1        = pulsatile noise coefficient (0.15-0.55)
  n2        = constant aspiration offset (small)
  d         = delay (1 ms = ~44 samples at 44.1kHz)
  noise(n)  = lowpass filtered white Gaussian noise
```

**Parameter-to-SNR mapping (from Fraj 2011 Table 1):**

| n1 | SNR (dB) | Perceptual Level |
|----|----------|------------------|
| 0.15 | ~29 | Mild breathiness |
| 0.35 | ~22 | Moderate |
| 0.55 | ~18 | Severe |

**Key insight:** Pulsatile noise (modulated by glottal flow) integrates perceptually with the voice. Constant aspiration noise segregates and sounds like two sources.

### 6.2 Jitter Model

**Source:** Fraj et al. (2011)

Sample-by-sample phase perturbation for cycle-to-cycle F0 variation:

```
Jitter equation:
────────────────────────────────────────────────────────────────────
θ(n) = θ(n-1) + 2π × f0 × Δ + 2π × b × ξ(n)

Where:
  θ(n)  = instantaneous phase at sample n
  f0    = nominal fundamental frequency (Hz)
  Δ     = 1/Fs (sampling period in seconds)
  b     = jitter control parameter
  ξ(n)  = random ±1 with equal probability
```

**Jitter parameter mapping:**

| Voice Quality | b | Jitter % | Notes |
|---------------|---|----------|-------|
| Modal | 0 | 0.5-1% | Natural micro-variation |
| Mild rough | 0.3-0.6 | 2-5% | Slight hoarseness |
| Moderate | 1.3-1.9 | 9-15% | Noticeable roughness |
| Creaky | 2.5-4.5 | 20-35% | Strong irregularity |

**Implementation:**

```javascript
function updatePhaseWithJitter(theta, f0, sampleRate, jitterParam) {
  const delta = 1 / sampleRate;
  const xi = Math.random() < 0.5 ? 1 : -1;
  return theta + 2 * Math.PI * f0 * delta + 2 * Math.PI * jitterParam * xi;
}

// Cycle boundary when theta crosses 2π
if (theta >= 2 * Math.PI) {
  theta -= 2 * Math.PI;
  // New glottal cycle starts here
}
```

**Note:** Shimmer (amplitude perturbation) emerges automatically from jitter through vocal tract filtering - no separate parameter needed.

### 6.3 Bandwidth Modulation

**Source:** Fant (1997), Childers & Lee (1991)

First formant bandwidth (B1) correlates with voice quality:

| Voice Quality | B1 Range | Mechanism |
|---------------|----------|-----------|
| Tense | 50-70 Hz | Narrow (strong closure) |
| Modal | 90-120 Hz | Normal |
| Breathy | 150-250 Hz | Wide (incomplete closure, glottal leakage) |

**Formula:**

```javascript
// B1 modulation from Rd
const B1_base = 90;  // Hz, modal default
const B1_delta = (Rd_final - 1.0) * 80;  // +80 Hz per Rd unit above modal
const B1_final = Math.max(50, Math.min(250, B1_base + B1_delta));
```

---

## 7. Implementation Steps

### Step 1: Add Rd and effort parameters to semantics.yaml

**File:** `experiments/klatt80-baseline/semantics.yaml`

```yaml
params:
  # Voice quality - Fant (1995), Perrotin (2021)
  Rd:
    type: float
    range: [0.3, 2.7]
    default: 1.0
    description: "LF Rd parameter (0.3=pressed, 1.0=modal, 2.7=breathy)"

  # Vocal effort - Lienard (1999)
  effort:
    type: float
    range: [-10, 10]
    default: 0
    unit: dB
    description: "Vocal effort in dB"

constants:
  # Lienard & Di Benedetto (1999) JASA 106(1):411-422
  effortCoeffs:
    f0HzPerDb: 5.1
    f1HzPerDb: 3.5
    rdPerDb: -0.05
    a1Slope: 1.10
    a2Slope: 1.24
    a3Slope: 1.30
```

### Step 2: Add PHONEME_RD table to tts-frontend-rules.js

**File:** `src/tts-frontend-rules.js`

Add the complete PHONEME_RD table from Section 4.1.

### Step 3: Add stress-to-effort mapping

**File:** `src/tts-frontend-rules.js`

Add `getStressRdDelta()` and `EFFORT_BY_STRESS` from Sections 4.2 and 4.3.

### Step 4: Add EMOTION_PROFILES

**File:** `src/tts-frontend-rules.js`

Add the complete emotion profiles from Section 3.3.

### Step 5: Implement rule_VoiceQuality()

**File:** `src/tts-frontend-rules.js`

```javascript
/**
 * Unified voice quality rule
 *
 * Sources:
 * - Fant (1997) "The voice source in connected speech"
 * - Lienard (1999) "Effect of vocal effort on spectral properties"
 * - Cummings (1995) "Glottal excitation of emotionally styled speech"
 * - Perrotin (2021) "LF-LFLM equivalence"
 */
function rule_VoiceQuality(phonemeList, speakerConfig, emotion = 'neutral') {
  const baseRd = speakerConfig.baseRd || 0.7;
  const emotionProfile = EMOTION_PROFILES[emotion] || EMOTION_PROFILES.neutral;

  for (const phoneme of phonemeList) {
    // Sum all Rd factors with saturation
    const phonemeRd = Math.max(-1.0, Math.min(1.0, PHONEME_RD[phoneme.phoneme] ?? 0));
    const stressRd = Math.max(-0.3, Math.min(0.3, getStressRdDelta(phoneme.stress)));
    const effort = EFFORT_BY_STRESS[phoneme.stress] ?? 0;
    const effortRd = Math.max(-0.5, Math.min(0.5, effort * -0.05));
    const emotionRd = Math.max(-0.7, Math.min(0.7, emotionProfile.rdDelta));

    let Rd = baseRd + phonemeRd + stressRd + effortRd + emotionRd;
    Rd = Math.max(0.3, Math.min(2.7, Rd));  // Final clamp

    phoneme.params.Rd = Rd;
    phoneme.params.effort = effort;

    // Emotion prosody adjustments
    if (emotionProfile.ahBoost) {
      phoneme.params.AH = (phoneme.params.AH || 0) + emotionProfile.ahBoost;
    }
    if (emotionProfile.jitter) {
      phoneme.params.jitter = emotionProfile.jitter;
    }
  }

  return phonemeList;
}
```

### Step 6: Implement rule_RdPhraseContour()

**File:** `src/tts-frontend-rules.js`

```javascript
/**
 * Phrase-level Rd contour
 * Source: Fant (1997)
 */
function rule_RdPhraseContour(frames, phrases, speakerConfig) {
  const baseRd = speakerConfig.baseRd || 0.7;

  for (const phrase of phrases) {
    for (const frame of frames) {
      if (frame.time >= phrase.start && frame.time <= phrase.end) {
        const rdDelta = computeRdPhraseContour(frame.time, phrase.start, phrase.end);
        frame.params.Rd = Math.max(0.3, Math.min(2.7, frame.params.Rd + rdDelta));
      }
    }
  }

  // Rd-AV covariation (Fant 1997: 2:1 ratio)
  for (const frame of frames) {
    const rdRatio = baseRd / frame.params.Rd;
    frame.params.AV = (frame.params.AV || 60) + 40 * Math.log10(rdRatio);
  }

  return frames;
}
```

### Step 7: Add effort-derived realize rules to semantics.yaml

**File:** `experiments/klatt80-baseline/semantics.yaml`

Add the f0Effective, f1Effective, and spectral tilt rules from Section 4.3.

### Step 8: Verify Rd binding in klatt-interpreter.ts

**File:** `src/klatt-interpreter.ts`

Ensure Rd parameter flows through to the LF source AudioParam. Check that `lf-source` WASM module accepts Rd and derives internal coefficients.

### Step 9: Add B1 bandwidth modulation to semantics.yaml

**File:** `experiments/klatt80-baseline/semantics.yaml`

```yaml
realize:
  # B1 bandwidth modulation from Rd (Fant 1997, Childers 1991)
  b1Effective:
    expr: "max(50, min(250, B1 + (Rd - 1.0) * 80))"
    deps: [B1, Rd]
```

### Step 10: Integrate into TTS pipeline

**File:** `src/tts-frontend.js`

```javascript
async function textToKlattTrack(text, options = {}) {
  const { emotion = 'neutral', speakerConfig = {} } = options;

  // ... existing text normalization, transcription ...

  // Apply phonological rules
  phonemeList = applyPhonologicalRules(phonemeList);

  // Assign base acoustic parameters
  phonemeList = assignAcousticParameters(phonemeList);

  // Voice quality rules (NEW)
  phonemeList = rule_VoiceQuality(phonemeList, speakerConfig, emotion);

  // ... duration rules, F0 contour ...

  // Generate track frames
  let track = generateTrackFrames(phonemeList);

  // Phrase-level Rd contour (NEW)
  track = rule_RdPhraseContour(track, detectPhrases(phonemeList), speakerConfig);

  return track;
}
```

---

## 8. Validation

### 8.1 Unit Tests

```javascript
// Test Rd derivation
test('Rd to LF parameters', () => {
  const params = rdToLFParams(1.0);
  expect(params.Ra).toBeCloseTo(0.038, 3);
  expect(params.Rk).toBeCloseTo(0.342, 3);
  expect(params.Oq).toBeCloseTo(0.57, 2);
});

// Test LFLM filter coefficients
test('LFLM filter coefficients at Rd=1.0, F0=110Hz', () => {
  const coeffs = computeLFLMCoeffs(1.0, 110, 44100);
  expect(coeffs.Fg).toBeCloseTo(96.5, 1);  // Hz
  expect(coeffs.Fa).toBeCloseTo(460, 10);  // Hz
});

// Test saturation limits
test('Rd saturation', () => {
  const rd = computeRdFinal(0.7, 1.5, -0.3, 0.5, -0.8, 0.6);
  expect(rd).toBeGreaterThanOrEqual(0.3);
  expect(rd).toBeLessThanOrEqual(2.7);
});
```

### 8.2 Perceptual A/B Tests

1. **Rd variation audibility**: Play pairs with ΔRd = 0.10, 0.15, 0.20. Confirm 0.15 is near threshold.
2. **Emotion profiles**: Play neutral vs emotional. Verify appropriate affect.
3. **Phrase contour**: Compare flat Rd vs contoured. Verify naturalness.
4. **Pulsatile vs constant noise**: Compare AH-only vs pulsatile. Verify pulsatile sounds more integrated.

---

## 9. Full Citations

| Paper | Full Citation | Contribution |
|-------|---------------|--------------|
| **Perrotin (2021)** | Perrotin O, Feugere L, d'Alessandro C. "Perceptual equivalence of the Liljencrants-Fant and linear-filter glottal flow models." JASA 150(2):1273-1285. | LFLM digital filter coefficients, Rd derivation formulas |
| **Fant (1995)** | Fant G. "The LF-model revisited. Transformations and frequency domain analysis." STL-QPSR 2-3/1995:119-156. | Rd parameter definition |
| **Fant (1997)** | Fant G. "The voice source in connected speech." Speech Communication 22:125-139. | Phoneme Rd values, phrase contour, Rd-AV covariation |
| **Lienard (1999)** | Lienard JS, Di Benedetto MG. "Effect of vocal effort on spectral properties of vowels." JASA 106(1):411-422. | F0/F1/spectral tilt per dB effort |
| **Cummings (1995)** | Cummings KE, Clements MA. "Analysis of the glottal excitation of emotionally styled and stressed speech." JASA 98(1):88-98. | Emotion slope ratios |
| **Gobl (2003)** | Gobl C, Ni Chasaide A. "The role of voice quality in communicating emotion, mood and attitude." Speech Communication 40:189-212. | KLSYN88 parameter trajectories for 7 voice qualities |
| **Burkhardt (2009)** | Burkhardt F. "Rule-based voice quality variation with formant synthesis." Interspeech 2009. | Rate-based formulas for 5 phonation types |
| **van Dinther (2004)** | van Dinther R, Kohlrausch A, Veldhuis R. "A method for analysing the perceptual relevance of glottal-pulse parameter variations." Speech Communication 42:175-189. | 4.3 dB EPD = 1 JND, Ra most sensitive |
| **Fraj (2011)** | Fraj S, Grenez F, Schoentgen J. "Synthesis of breathy and rough voices." MAVEBA 2011. | Jitter equation, pulsatile noise model |
| **Childers (1991)** | Childers DG, Lee CK. "Vocal quality factors: Analysis, synthesis, and perception." JASA 90(5):2394-2410. | OQ/SQ/Ta values for voice types, turbulent noise |
| **Doval (2006)** | Doval B, d'Alessandro C, Henrich N. "The spectrum of glottal flow models." Acta Acustica 92. | Unified 5-parameter framework, glottal formant theory |
| **Klatt (1990)** | Klatt DH, Klatt LC. "Analysis, synthesis, and perception of voice quality variations among female and male talkers." JASA 87(2):820-857. | KLGLOTT88 model definition, AH importance |

---

*Implementation specification complete: 2026-01-27*
*Based on synthesis of 19 papers from voice-quality-paper-scout.md*
