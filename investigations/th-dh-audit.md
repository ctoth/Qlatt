# TH/DH Phoneme Audit Against Literature

## Current Implementation Values

### TH (voiceless dental fricative)
```javascript
TH: {
  F1: 320,
  F2: 1290,
  F3: 2540,
  B1: 200,
  B2: 90,
  B3: 200,
  AV: 0,
  AF: 48,  // -12 dB vs S per Jongman (2000)
  AH: 0,
  AVS: -70,
  A5: 28,
  A6: 48,
  dur: 80,
  type: "fricative",
  voiceless: true,
  dental: true,
}
```

### DH (voiced dental fricative)
```javascript
DH: {
  F1: 270,
  F2: 1290,
  F3: 2540,
  B1: 60,
  B2: 80,
  B3: 170,
  AV: 47,
  AF: 38,  // -12 dB vs Z per Jongman (2000)
  AH: 0,
  AVS: 47,
  A5: 28,
  A6: 48,
  dur: 70,
  type: "fricative",
  voiced: true,
  dental: true,
}
```

---

## Literature Review

### Klatt 1980 - Original Synthesizer Paper (Table III)

| Sound | F1 | F2 | F3 | B1 | A2 | A3 | A4 | A5 | A6 | AB |
|-------|-----|------|------|-----|----|----|----|----|----|----|
| [th] | 320 | 1290 | 2540 | 200 | 0 | 0 | 0 | 0 | 28 | 48 |
| [dh] | 270 | 1290 | 2540 | 60 | 0 | 0 | 0 | 0 | 28 | 48 |

**IMPORTANT FINDING:** Our implementation has A5=28, A6=48 which matches Klatt's A5=0 (not 28) and A6=28 (not 48), AB=48.

Wait - re-reading Klatt 1980 Table III more carefully:
- For [th]: A5=0, A6=28, AB=48
- For [dh]: A5=0, A6=28, AB=48

But our implementation has:
- A5=28, A6=48, AB=0 (implicitly, since AB not set)

**This is a column misalignment error.** Our A5 value (28) appears to be Klatt's A6. Our A6 value (48) appears to be Klatt's AB.

### Jongman 2000 - Fricative Acoustics

**Spectral Peak Location:**
| Place | Mean Peak (Hz) |
|-------|----------------|
| /f,v/ (labiodental) | 7733 |
| /theta,eth/ (dental) | 7470 |
| /s,z/ (alveolar) | 6839 |

**Key finding:** Dental fricatives have spectral peak at ~7.5 kHz, very close to labiodentals (7.7 kHz).

**Normalized Amplitude (fricative RMS - vowel RMS):**
| Place | Normalized Amplitude (dB) |
|-------|---------------------------|
| /f,v/ | -17 |
| /theta,eth/ | -18 |
| /s,z/ | -10 |

**Key finding:** Dental fricatives are ~8 dB quieter than sibilants, 1 dB quieter than labiodentals.

**Duration:**
| Fricative | Duration (ms) |
|-----------|---------------|
| /theta/ | 163 |
| /eth/ | 88 |

Our durations (TH=80, DH=70) are somewhat shorter than Jongman's measurements.

### Shadle 1985 - Fricative Acoustics (Thesis)

**Three-Class Fricative Model:**

| Class | Fricatives | Source Mechanism | Front Cavity | Amplitude |
|-------|------------|------------------|--------------|-----------|
| 1 | /s/, /sh/ | Jet on obstacle (teeth) | 1-3 cm | High (+20 dB) |
| 2 | /x/, /c/ | Jet on wall surfaces | 4-8 cm | Medium |
| 3 | /phi/, /f/, /theta/ | Constriction shape | 0-2 cm | Low |

**Key finding:** /theta/ (TH/DH) belongs to Class 3 with /f/ - short front cavity, low amplitude, surface-generated turbulence.

**Amplitude Parameters from Speech (Table 4.2-4.3):**

| Fricative | A_S (dB SPL) | A_T (dB) | A_0 (dB) | Relative Level |
|-----------|--------------|----------|----------|----------------|
| /s/ | 62 | 20 | 18 | High |
| /f/ | 53 | 22 | 12 | Low |
| /theta/ | 50 | 22 | 7 | Lowest |

**Critical finding:** /theta/ is the LOWEST amplitude fricative, 12 dB quieter than /s/, and even ~3 dB quieter than /f/.

**Spectral Characteristics:**
- /theta/: Two broad peaks with distinctive dip at ~4 kHz
- Lowest A_0 value (7.1 dB) - minimal low-frequency content
- Source slope: -3 to -6 dB/oct from 800-10000 Hz

### Stevens 1998 - Acoustic Phonetics

Stevens does not provide separate parameters for dental fricatives in the detailed tables, but groups them with labiodentals as "non-sibilant" fricatives with:
- Similar spectral characteristics
- Lower amplitude than sibilants
- Front-cavity resonance above audible range (~10 kHz)

### Behrens & Blumstein 1988 - Fricative Perception

**Key finding:** Spectral properties of the fricative noise and formant transitions are the dominant cues for place of articulation. Amplitude manipulations have minimal perceptual effect when spectral cues are congruent.

**Implication:** Getting the spectral shape right matters more than exact amplitude values.

---

## Comparison: TH/DH vs F/V (Recently Fixed)

### Current Values

| Phoneme | AF | A3 | A4 | A5 | A6 | AB | Notes |
|---------|----|----|----|----|----|----|-------|
| F | 48 | 40 | 45 | 48 | 55 | 55 | Just fixed |
| V | 48 | 40 | 45 | 48 | 55 | 55 | Just fixed |
| TH | 48 | 0 | 0 | 28 | 48 | 0 | Current |
| DH | 38 | 0 | 0 | 28 | 48 | 0 | Current |

### Klatt 1980 Original Values

| Phoneme | A2 | A3 | A4 | A5 | A6 | AB |
|---------|----|----|----|----|----|----|
| [f] | 0 | 0 | 0 | 0 | 0 | 57 |
| [v] | 0 | 0 | 0 | 0 | 0 | 57 |
| [th] | 0 | 0 | 0 | 0 | 28 | 48 |
| [dh] | 0 | 0 | 0 | 0 | 28 | 48 |

**Key observation from Klatt 1980:**
- F/V: Uses ONLY AB (bypass) for flat spectrum frication
- TH/DH: Uses A6 (highest formant) + AB for high-frequency emphasis

This suggests Klatt intended TH/DH to have MORE high-frequency content than F/V, despite Shadle's finding that /theta/ is actually quieter overall.

---

## Analysis

### Problem 1: Missing AB (Bypass)

Klatt 1980 specifies AB=48 for TH/DH, but our implementation has no AB value set. This means frication noise is only going through formant filters (A5, A6) without the bypass path that provides flat-spectrum energy.

**Expected behavior:** Some energy across all frequencies via bypass
**Actual behavior:** Energy only at F5/F6 resonances, no broadband component

### Problem 2: A5/A6 Values Appear Shifted

| Parameter | Klatt 1980 | Our Implementation |
|-----------|------------|-------------------|
| A5 | 0 | 28 |
| A6 | 28 | 48 |
| AB | 48 | 0 (not set) |

Our values appear to be shifted by one column - A5 has what should be A6, A6 has what should be AB, and AB is missing.

### Problem 3: Missing Lower Formant Energy (A3, A4)

Unlike F/V which now has A3=40, A4=45, TH/DH have no A3/A4 values.

However, looking at Klatt 1980 and Shadle 1985:
- Klatt gives A3=0, A4=0 for all non-sibilant fricatives (F, V, TH, DH)
- Shadle: /theta/ has very low A_0 (low-frequency content) compared to even /f/

So having A3=0, A4=0 may actually be more correct for TH/DH than F/V.

**But the F/V fix worked perceptually** - users reported it sounded better. This suggests either:
1. Klatt's original values are too conservative
2. Our synthesis chain is different enough to need different values
3. The F/V fix was solving a different problem (formant audibility)

### Problem 4: Spectral Shape Comparison

Per Jongman 2000:
- TH/DH spectral peak: 7470 Hz
- F/V spectral peak: 7733 Hz

These are nearly identical. Both are non-sibilant fricatives with very high spectral peaks.

Per Shadle 1985, both /f/ and /theta/ belong to Class 3 (short front cavity, surface-generated). The main acoustic difference is:
- /theta/ has even LOWER amplitude than /f/ (50 dB SPL vs 53 dB SPL)
- /theta/ has the lowest A_0 (7.1 dB vs 12.0 dB for /f/) - meaning even less low-frequency energy

---

## Recommendations

### Option A: Conservative Fix (Match Klatt 1980 Exactly)

```javascript
TH: {
  // ... existing formants ...
  A5: 0,    // Klatt 1980
  A6: 28,   // Klatt 1980
  AB: 48,   // Klatt 1980 - CRITICAL MISSING VALUE
}

DH: {
  // ... existing formants ...
  A5: 0,    // Klatt 1980
  A6: 28,   // Klatt 1980
  AB: 48,   // Klatt 1980 - CRITICAL MISSING VALUE
}
```

### Option B: Moderate Fix (Add AB, Keep Existing A5/A6)

```javascript
TH: {
  // ... existing formants ...
  A5: 28,   // Keep current
  A6: 48,   // Keep current
  AB: 48,   // ADD - provides broadband energy
}

DH: {
  // ... existing formants ...
  A5: 28,   // Keep current
  A6: 48,   // Keep current
  AB: 48,   // ADD - provides broadband energy
}
```

### Option C: Match F/V Fix Philosophy (Full Spectral Shaping)

If the F/V fix worked by adding mid-frequency formant content, apply similar reasoning:

```javascript
TH: {
  // ... existing formants ...
  A3: 35,   // Slightly less than F/V since /theta/ is quieter
  A4: 40,   // Slightly less than F/V
  A5: 45,   // Build toward high-frequency peak
  A6: 50,   // High-frequency peak near 7.5 kHz
  AB: 48,   // Bypass for broadband component
}

DH: {
  // ... existing formants ...
  A3: 35,   // Same spectral shape as TH
  A4: 40,
  A5: 45,
  A6: 50,
  AB: 48,
}
```

### Primary Recommendation: Option B (Moderate Fix)

**Rationale:**
1. The **most critical issue** is the missing AB parameter
2. Klatt 1980 uses AB=48 for TH/DH bypass path
3. Without AB, there's no broadband noise component
4. Current A5/A6 values (28, 48) provide some high-frequency shaping
5. Adding AB=48 provides the missing flat-spectrum energy

This is the minimum change most likely to improve TH/DH sound quality.

---

## Test Procedure

1. Record current "this that the other thing" audio
2. Apply fix (add AB=48 to TH and DH)
3. Record new audio
4. Compare perceptually:
   - Is TH/DH more audible?
   - Does it sound like a dental fricative vs silence?
   - Does the balance between TH/DH and surrounding sounds improve?

---

## Appendix: Complete Klatt 1980 Fricative Table (Table III)

| Sound | F1 | F2 | F3 | B1 | A2 | A3 | A4 | A5 | A6 | AB |
|-------|-----|------|------|-----|----|----|----|----|----|----|
| [f] | 340 | 1100 | 2080 | 200 | 0 | 0 | 0 | 0 | 0 | 57 |
| [v] | 220 | 1100 | 2080 | 60 | 0 | 0 | 0 | 0 | 0 | 57 |
| [th] | 320 | 1290 | 2540 | 200 | 0 | 0 | 0 | 0 | 28 | 48 |
| [dh] | 270 | 1290 | 2540 | 60 | 0 | 0 | 0 | 0 | 28 | 48 |
| [s] | 320 | 1390 | 2530 | 200 | 0 | 0 | 0 | 0 | 52 | 0 |
| [z] | 240 | 1390 | 2530 | 70 | 0 | 0 | 0 | 0 | 52 | 0 |
| [sh] | 300 | 1840 | 2750 | 200 | 0 | 57 | 48 | 48 | 46 | 0 |

**Key patterns from Klatt:**
- F/V: Bypass only (AB=57), no formant amplitudes
- TH/DH: A6 + Bypass (A6=28, AB=48)
- S/Z: A6 only (A6=52), no bypass
- SH: Multiple formants (A3-A6), no bypass

This shows F and TH have different spectral strategies in Klatt's design, despite both being non-sibilant fricatives.
