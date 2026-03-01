# Investigation: Why is /f/ Still Quiet?

## Problem Statement

After adding A3-A6 parallel formant values to /f/, it still sounds too quiet compared to other fricatives and vowels.

Current F phoneme values (`tts-frontend-rules.js`):
- AF: 48
- A3: 20, A4: 25, A5: 30, A6: 50
- AB: 57

## Investigation Date
2026-01-25

---

## FACTS (verified with evidence)

### Fact 1: Current /f/ Values in tts-frontend-rules.js
**Source:** `C:/Users/Q/code/Qlatt/src/tts-frontend-rules.js` lines 508-530
```javascript
F: {
  F1: 340,
  F2: 1100,
  F3: 2080,
  B1: 200,
  B2: 120,
  B3: 150,
  AV: 0,
  AF: 48,  // -12 dB vs S per Jongman (2000)
  AH: 0,
  AVS: -70,
  A3: 20,   // Mild mid-frequency content
  A4: 25,   // Building toward high-frequency peak
  A5: 30,   // Slightly above TH (28) for broader spectrum
  A6: 50,   // Peak emphasis near 7.7 kHz (above TH's 48)
  AB: 57,   // Bypass for diffuse component
  dur: 90,
  type: "fricative",
  voiceless: true,
  labiodental: true,
},
```

### Fact 2: Klatt 80 ndbScale Offsets Applied to Parameters
**Source:** `C:/Users/Q/code/Qlatt/src/klatt-synth.js` lines 642-658
```javascript
const ndbScale = {
  A1: -58,
  A2: -65,
  A3: -73,
  A4: -78,
  A5: -79,
  A6: -80,
  AN: -58,
  AB: -84,
  AV: -119,   // -72 - 47: compensates for G0 addition
  AH: -134,   // -87 - 47: compensates for G0 addition
  AF: -119,   // -72 - 47: compensates for G0 addition
  AVS: -91,   // -44 - 47: compensates for G0 addition
};
```

### Fact 3: Linear Gain Calculation for /f/ Parameters
**Source:** `_dbToLinear()` function and `_applyKlattParams()` in klatt-synth.js

Using `2^(dB/6)` conversion and ndbScale offsets:

| Parameter | Input dB | ndbScale | Sum | Linear Gain | Notes |
|-----------|----------|----------|-----|-------------|-------|
| AF | 48 | -119 | -71 | 0.00 (below -72 cutoff) | **Frication source SILENT** |
| A3 | 20 | -73 | -53 | 0.0015 | Very quiet |
| A4 | 25 | -78 | -53 | 0.0015 | Very quiet |
| A5 | 30 | -79 | -49 | 0.0027 | Quiet |
| A6 | 50 | -80 | -30 | 0.0312 | Moderate |
| AB | 57 | -84 | -27 | 0.0469 | Moderate |

**CRITICAL FINDING:** With GO=47 (default), AF=48 + G0=47 + ndbScale.AF=-119 = **-24 dB**, which gives linear gain of **0.0625**. But without G0 in the calculation for AF, the gain is approximately **0**.

Wait - let me verify. The code uses:
```javascript
const fricGain = this._dbToLinear(goDb + fricDbAdjusted + ndbScale.AF) * parallelScale;
```

So: 47 + 48 + (-119) = **-24 dB** → `2^(-24/6) = 2^(-4) = 0.0625`

This is NOT silent. Let me recalculate:

| Parameter | Input dB | GO | ndbScale | Sum | Linear Gain |
|-----------|----------|-----|----------|-----|-------------|
| AF | 48 | 47 | -119 | -24 | 0.0625 |

But A3-A6 do NOT get G0 added:
```javascript
const parallelLinear = [
  this._dbToLinear((params.A1 ?? -70) + n12Cor + ndbScale.A1),
  ...
];
```

So A3-A6 have NO G0 boost:

| Parameter | Input dB | ndbScale | Sum | Linear Gain |
|-----------|----------|----------|-----|-------------|
| A3 | 20 | -73 | -53 | 0.0015 |
| A4 | 25 | -78 | -53 | 0.0015 |
| A5 | 30 | -79 | -49 | 0.0027 |
| A6 | 50 | -80 | -30 | 0.0312 |
| AB | 57 | -84 | -27 | 0.0469 |

### Fact 4: Comparison with S and SH Fricatives
**Source:** `tts-frontend-rules.js`

**S:**
- AF: 60
- A5: 52, A6: 55

| Parameter | Input dB | GO | ndbScale | Sum | Linear Gain |
|-----------|----------|-----|----------|-----|-------------|
| AF | 60 | 47 | -119 | -12 | 0.25 |
| A5 | 52 | - | -79 | -27 | 0.047 |
| A6 | 55 | - | -80 | -25 | 0.0625 |

**SH:**
- AF: 66
- A3: 57, A4: 48, A5: 48, A6: 46

| Parameter | Input dB | GO | ndbScale | Sum | Linear Gain |
|-----------|----------|-----|----------|-----|-------------|
| AF | 66 | 47 | -119 | -6 | 0.5 |
| A3 | 57 | - | -73 | -16 | 0.15 |
| A4 | 48 | - | -78 | -30 | 0.0312 |
| A5 | 48 | - | -79 | -31 | 0.028 |
| A6 | 46 | - | -80 | -34 | 0.019 |

### Fact 5: Research Data on /f/ Amplitude
**Source:** Jongman 2000 (papers/Jongman_2000_FricativeAcoustics/notes.md)

- Normalized amplitude /f,v/: **-17 dB** relative to vowel
- Normalized amplitude /s,z/: **-10 dB** relative to vowel
- Difference: /f/ is 7 dB quieter than /s/

**Source:** Behrens & Blumstein 1988 (papers/Behrens_Blumstein_1988_FricativeAmplitude/notes.md)

- [f] noise-to-vowel ratio: **-12 to -23 dB** (average ~-18 dB)
- [s] noise-to-vowel ratio: **-1 to -8 dB** (average ~-4 dB)
- Difference: /f/ is 14 dB quieter than /s/

### Fact 6: /f/ vs /s/ AF Relationship in Current Implementation
- S: AF=60
- F: AF=48
- Difference: 12 dB

This matches Jongman 2000's "non-sibilants 10-15 dB quieter than sibilants" guideline.

### Fact 7: Shadle 1985 on /f/ Spectral Characteristics
**Source:** Shadle 1985 (papers/Shadle_1985_FricativeAcoustics/notes.md)

- Class 3 fricative (surface-generated, short front cavity)
- Low amplitude: A_S = 53 dB SPL
- "-3 to -6 dB/oct slope 800-10000 Hz"
- "Two broad peaks"
- Low A_0 (12.0 dB) - limited low-frequency content

### Fact 8: PARCOE.FOR Scale Factors
**Source:** `~/src/klatt80/PARCOE.FOR` lines 51-53
```fortran
C     SCALE FACTORS IN DB FOR GENERAL ADJUSTMENT TO:
C                    A1  A2  A3  A4  A5  A6  AN  AB  AV   AH  AF AVS
      DATA NDBSCA/-58,-65,-73,-78,-79,-80,-58,-84,-72,-102,-72,-44/
```

The Klatt 80 scale factors match our implementation (allowing for G0 compensation).

---

## THEORIES

### Theory 1: AF=48 is Correct, A3-A6 Values Too Low (LIKELY)

**Hypothesis:** The 12 dB AF offset from /s/ is correct per research, but the A3-A6 values for formant shaping are too low to create audible spectral peaks.

**Evidence:**
- S has A5=52, A6=55
- F has A3=20, A4=25, A5=30, A6=50
- Linear gains for F are 20-40x lower than S:
  - F A5 (30): 0.0027 vs S A5 (52): 0.047 = **17x quieter**
  - F A6 (50): 0.0312 vs S A6 (55): 0.0625 = **2x quieter**

**Calculation:** If /f/ spectral peak should be 7-14 dB below /s/ (per research), then A5/A6 values should be approximately:
- S A5=52 → F A5 should be ~38-45 (not 30)
- S A6=55 → F A6 should be ~41-48 (not 50 - this one is close)

### Theory 2: A3-A6 Should Match Bypass (AB) Level (PARTIAL)

**Hypothesis:** Since /f/ has a diffuse spectrum, the formant amplitudes should be comparable to the bypass amplitude.

**Evidence:**
- AB=57 gives linear 0.047
- A6=50 gives linear 0.031
- A3=20 gives linear 0.0015 (32x quieter than bypass!)

If formants are 30x quieter than bypass, the spectral shaping will be inaudible.

### Theory 3: Missing G0 Boost for A Parameters (UNLIKELY ROOT CAUSE)

**Hypothesis:** A1-A6 don't receive G0 boost while AF does, causing imbalance.

**Evidence:**
- True per code: AF gets G0, A1-A6 do not
- But this is consistent with Klatt 80 FORTRAN (PARCOE.FOR lines 137-148)
- The issue is the relative values, not the G0 boost

### Theory 4: Bypass (AB) is Drowning the Formants (PARTIAL)

**Hypothesis:** AB=57 produces flat noise that masks the A3-A6 formant peaks.

**Evidence:**
- AB linear gain: 0.047
- A3 linear gain: 0.0015 (31x quieter)
- Flat bypass noise will dominate over formant peaks

**However:** Reducing AB isn't the answer - the research says /f/ has a diffuse spectrum. The solution is raising A values to compete with AB.

---

## Test Results Table

| Test | Expected | Actual | Pass/Fail |
|------|----------|--------|-----------|
| AF=48 is 12 dB below S=60 | Yes | Yes (12 dB) | PASS |
| A3-A6 values create audible spectral peaks | Yes | No (too quiet) | FAIL |
| A values comparable to SH pattern | Similar | Much lower | FAIL |
| /f/ linear fricGain (AF calc) | ~0.06 | 0.0625 | PASS |
| A3 linear gain | >0.01 | 0.0015 | FAIL |

---

## ROOT CAUSE

The A3-A6 values for /f/ are too low relative to:
1. The bypass amplitude (AB=57)
2. The sibilant formant amplitudes (S: A5=52, A6=55; SH: A3=57, A4=48)
3. What's needed to create audible spectral peaks above the flat bypass noise

The AF=48 value is appropriate (12 dB below S=60 per research), but the formant amplitudes need to be higher to shape the spectrum.

**Key insight from research:** Behrens & Blumstein 1988 found that **spectral properties are more important than amplitude** for fricative perception. The problem isn't AF being too quiet - it's the A values being too quiet to create the spectral shape that distinguishes /f/.

---

## SOLUTION

### Option A: Raise A3-A6 to Create Audible Spectral Shape

Following SH as a template (sibilant with clear spectral peaks) but scaling down:

| Parameter | Current | Proposed | Rationale |
|-----------|---------|----------|-----------|
| A3 | 20 | 40 | Match broad mid-freq peak (Shadle "two broad peaks") |
| A4 | 25 | 45 | Transition toward HF |
| A5 | 30 | 48 | Main spectral energy (Jongman: peak ~7.7 kHz) |
| A6 | 50 | 55 | Peak at highest formant |
| AB | 57 | 55 | Slightly reduce to let formants show |

**Verification:** New linear gains:
- A3=40: 2^((40-73)/6) = 2^(-5.5) = 0.022 (vs old 0.0015)
- A4=45: 2^((45-78)/6) = 2^(-5.5) = 0.022 (vs old 0.0015)
- A5=48: 2^((48-79)/6) = 2^(-5.2) = 0.028 (vs old 0.0027)
- A6=55: 2^((55-80)/6) = 2^(-4.2) = 0.055 (vs old 0.031)
- AB=55: 2^((55-84)/6) = 2^(-4.8) = 0.036 (vs old 0.047)

This brings formant amplitudes within 2x of bypass (audible competition).

### Option B: Raise AF Instead

If the overall /f/ level is too quiet, raising AF is simpler:

| Parameter | Current | Proposed | Rationale |
|-----------|---------|----------|-----------|
| AF | 48 | 55 | Only 5 dB below S (still quieter per research) |

**Issue:** This doesn't address spectral shape - /f/ would just be louder flat noise.

### Recommended: Option A (Raise A Values)

Per Behrens & Blumstein 1988: "Spectral properties of fricative noise are the dominant perceptual cue for place of articulation, not amplitude."

The priority is getting the spectral shape right. Raising A values creates the "two broad peaks" Shadle describes.

---

## Proposed Fix

**File:** `C:/Users/Q/code/Qlatt/src/tts-frontend-rules.js`

**Change F phoneme definition:**
```javascript
F: {
  F1: 340,
  F2: 1100,
  F3: 2080,
  B1: 200,
  B2: 120,
  B3: 150,
  AV: 0,
  AF: 48,  // Keep at -12 dB vs S per Jongman (2000)
  AH: 0,
  AVS: -70,
  // Raised A values to create audible spectral shape above bypass
  // Shadle (1985): "two broad peaks", diffuse spectrum
  // Behrens & Blumstein (1988): spectral shape > amplitude for perception
  A3: 40,   // Raised from 20 - mid-frequency peak
  A4: 45,   // Raised from 25 - transition to HF
  A5: 48,   // Raised from 30 - near spectral peak ~7.7 kHz
  A6: 55,   // Raised from 50 - highest frequency emphasis
  AB: 55,   // Slightly reduced from 57 to let formants compete
  dur: 90,
  type: "fricative",
  voiceless: true,
  labiodental: true,
},
```

**Apply similar changes to V phoneme:**
```javascript
V: {
  ...
  A3: 35,   // Raised from 15 (slightly less than F due to voicing)
  A4: 40,   // Raised from 20
  A5: 43,   // Raised from 25
  A6: 50,   // Raised from 45
  AB: 55,   // Same as F
  ...
},
```

---

## References

- **Jongman et al. (2000)** - Normalized amplitude: /f,v/ at -17 dB vs vowel, /s,z/ at -10 dB
- **Behrens & Blumstein (1988)** - Spectral properties > amplitude for fricative perception
- **Shadle (1985)** - /f/ has "two broad peaks", Class 3 surface-generated fricative
- **Klatt (1980)** - PARCOE.FOR ndbScale values for amplitude conversion
- **Previous investigation** - `C:/Users/Q/code/Qlatt/investigations/f-formants.md`
