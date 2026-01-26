# Investigation: /f/ Parallel Formant Issue

## Problem Statement

The fricative /f/ renders with A1=A2=A3=A4=A5=A6=0 in the track, leaving only AB=57 (bypass) active. This produces an unclear /f/ sound.

From telemetry:
```
1. t=0.000 F F0=0.0 AV=0 AVS=-70 AH=0 AF=48 SW=1 | A1=0 A2=0 A3=0 A4=0 A5=0 A6=0 AB=57
```

## Investigation Date
2026-01-25

---

## FACTS (verified with evidence)

### Fact 1: F phoneme definition lacks A1-A6 values
**Source:** `C:/Users/Q/code/Qlatt/src/tts-frontend-rules.js` lines 505-521
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
  AB: 57,
  dur: 90,
  type: "fricative",
  voiceless: true,
  labiodental: true,
},
```
**Note:** No A1, A2, A3, A4, A5, A6 properties are defined.

### Fact 2: BASE_PARAMS sets A1-A6 to 0
**Source:** `C:/Users/Q/code/Qlatt/src/tts-frontend-rules.js` lines 27-32
```javascript
A1: 0,
A2: 0,
A3: 0,
A4: 0,
A5: 0,
A6: 0,
```

### Fact 3: fillDefaultParams only copies defined values
**Source:** `C:/Users/Q/code/Qlatt/src/tts-frontend-rules.js` lines 1039-1069
The function starts with BASE_PARAMS then only overrides with values explicitly defined in the target. Since F doesn't define A1-A6, they remain at 0.

### Fact 4: Other fricatives DO define parallel formant amplitudes
**Source:** `C:/Users/Q/code/Qlatt/src/tts-frontend-rules.js`
- S (line 437-438): `A5: 52, A6: 55`
- SH (line 475-478): `A3: 57, A4: 48, A5: 48, A6: 46`
- TH (line 550-551): `A5: 28, A6: 48`
- HH (line 588-593): `A1: 30, A2: 35, A3: 40, A4: 45, A5: 50, A6: 50`

### Fact 5: V (voiced /v/) also lacks A1-A6
**Source:** `C:/Users/Q/code/Qlatt/src/tts-frontend-rules.js` lines 522-538
Same issue - only AB: 57 defined.

### Fact 6: Research indicates /f/ requires broad spectrum energy
**Source:** Jongman 2000 (papers/Jongman_2000_FricativeAcoustics/notes.md)
- Spectral peak: 7733 Hz (labiodental)
- High variance (6.37 MHz) indicating flat/diffuse spectrum
- Normalized amplitude: -17 dB relative to vowel
- "Sibilants are 10-15 dB louder than non-sibilants"

**Source:** Shadle 1985 (papers/Shadle_1985_FricativeAcoustics/notes.md)
- Class 3 fricative (surface-generated, short front cavity)
- Low amplitude (A_S = 53 dB SPL)
- "-3 to -6 dB/oct slope 800-10000 Hz"
- "Two broad peaks" in spectrum

---

## THEORIES

### Theory 1: F phoneme definition intentionally bypass-only (REJECTED)
**Hypothesis:** The design intended /f/ to use only bypass path.

**Evidence against:**
- Other fricatives (S, SH, TH, HH) define A values
- Shadle 1985 shows /f/ has spectral structure (two broad peaks)
- The resulting synthesis sounds unclear/unnatural

**Conclusion:** This appears to be an omission, not intentional design.

### Theory 2: A1-A6 values not being copied from target (CONFIRMED)
**Hypothesis:** The values are defined but not being copied.

**Test:** Read the F phoneme definition directly.
**Result:** The A1-A6 values are simply NOT DEFINED in the F phoneme object.

**Conclusion:** This is the root cause. The F (and V) phoneme definitions are missing their parallel formant amplitude specifications.

### Theory 3: Some code path is zeroing the A values (REJECTED)
**Hypothesis:** A rule or processing step is setting A values to 0.

**Evidence against:**
- Traced fillDefaultParams() - it preserves any A values from the target
- No code path modifies A values for fricatives
- The issue is simply that F doesn't define them

---

## Test Results Table

| Test | Expected | Actual | Pass/Fail |
|------|----------|--------|-----------|
| F phoneme has A1-A6 defined | Yes | No | FAIL |
| V phoneme has A1-A6 defined | Yes | No | FAIL |
| S phoneme has A5-A6 defined | Yes | Yes (A5=52, A6=55) | PASS |
| TH phoneme has A5-A6 defined | Yes | Yes (A5=28, A6=48) | PASS |
| fillDefaultParams preserves A values | - | Yes (when defined) | PASS |

---

## ROOT CAUSE

The F and V phoneme definitions in `PHONEME_TARGETS` are missing their parallel formant amplitude (A1-A6) specifications. Since `fillDefaultParams()` starts with BASE_PARAMS (where A1-A6=0) and only overrides with values explicitly defined in the target, /f/ and /v/ end up with A1=A2=A3=A4=A5=A6=0.

This means the parallel branch (SW=1) has no formant-shaped noise, only:
- AF=48 (frication source amplitude)
- AB=57 (bypass - unfiltered noise)

Without A values, the frication source has no spectral shaping from the parallel formant resonators, producing only flat noise through the bypass path.

---

## SOLUTION

Add A5 and A6 values to the F and V phoneme definitions based on:
1. Jongman 2000: spectral peak ~7.7 kHz suggests emphasis on A5/A6
2. Shadle 1985: "two broad peaks", "-3 to -6 dB/oct slope"
3. TH as reference (similar non-sibilant): A5=28, A6=48
4. 10-15 dB quieter than sibilants (Jongman 2000)

**Proposed values:**
- A5: 30 (slightly above TH's 28 given broader spectrum)
- A6: 50 (slightly above TH's 48 for 7.7 kHz peak)
- AB: Keep at 57 for diffuse component

Since /f/ has a diffuse spectrum with "two broad peaks" (Shadle), some lower formant contribution may help:
- A3: 20 (mild mid-frequency content)
- A4: 25 (building toward peak)

---

## Files Modified

- `C:/Users/Q/code/Qlatt/src/tts-frontend-rules.js` - Added A3-A6 values to F and V phonemes

---

## References

- Jongman, A., Wayland, R., Wong, S. (2000). "Acoustic Characteristics of English Fricatives." JASA 108(3):1252-1263
- Shadle, C.H. (1985). "The Acoustics of Fricative Consonants." MIT PhD Thesis
