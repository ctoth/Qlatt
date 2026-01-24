# Analysis: Master Gain Formula (Issue 4)

## Executive Summary

The current master gain formula conflates two unrelated Klatt 80 mechanisms:
1. **PLSTEP scaling** - used for plosive burst transients only
2. **G0 overall gain** - the actual global gain parameter

The 170x output scaling from Klatt 80 is for 16-bit integer left-justification and has no relevance to normalized float output. The formula needs a complete rewrite.

---

## 1. What Klatt 80 Does for Overall Output Scaling

### 1.1 The 170x Multiplier (COEWAV.FOR Line 251)

```fortran
C     ADD CASCADE AND PARALLEL VOCAL TRACT OUTPUTS
C     (SCALE BY 170 TO LEFT JUSTIFY IN 16-BIT WORD)
450     ULIPS=(ULIPSV+ULIPSF+STEP)*(170.)
```

This 170x factor is **purely for 16-bit integer format**:
- `ULIPS` is the final output sample
- The comment explicitly states: "TO LEFT JUSTIFY IN 16-BIT WORD"
- 170x scales the internal floating-point signal to fill the 16-bit range (-32768 to 32767)

**This has no relevance for normalized float output (-1.0 to +1.0).**

### 1.2 Truncation at 16-bit Boundaries (COEWAV.FOR Lines 256-261)

```fortran
C     TRUNCATE WAVEFORM SAMPLES TO ABS[WAVMA]
        DATA WAVMA,WAVMAX/32767,-32767/
        IF (ULIPS.LE.WAVMA) GO TO 510
        ULIPS=WAVMA
510     IF (ULIPS.GE.WAVMAX) GO TO 520
        ULIPS=WAVMAX
520     IWAVE(NTIME)=ULIPS
```

Hard clipping at 16-bit integer limits. The original Klatt explicitly clips; there's no soft limiting or AGC.

---

## 2. What the G0 Parameter Controls

### 2.1 G0 is Added to ALL Amplitude Parameters (PARCOE.FOR)

G0 acts as a **global dB offset** added to every amplitude parameter before the dB-to-linear conversion:

```fortran
C     SET AMPLITUDE OF VOICING
        NDBAV=NNG0+NNAV+NDBSCA(9)      ! G0 + AV + (-72)
        IMPULS=GETAMP(NDBAV)

C     AMPLITUDE OF ASPIRATION
150     NDBAH=NNG0+NNAH+NDBSCA(10)     ! G0 + AH + (-102)
        AHH=GETAMP(NDBAH)

C     AMPLITUDE OF FRICATION
        NDBAF=NNG0+NNAF+NDBSCA(11)     ! G0 + AF + (-72)
        AFF=GETAMP(NDBAF)

C     AMPLITUDE OF QUASI-SINUSOIDAL VOICING SOURCE
        NDBAVS=NNG0+NNAVS+NDBSCA(12)   ! G0 + AVS + (-44)
        SINAMP=10.*GETAMP(NDBAVS)
```

### 2.2 Typical G0 Values

From Klatt 80 documentation and practice:
- Default G0 = 47-50 dB (sets overall loudness)
- Range: ~40-60 dB typically
- Lower G0 = quieter output, higher G0 = louder output

### 2.3 G0 in PLSTEP (The Misunderstood Formula)

```fortran
C     ADD A STEP TO WAVEFORM AT A PLOSIVE RELEASE
        PLSTEP=0.
        IF (NNAF-NAFLAS.LT.49) GO TO 151
        PLSTEP=GETAMP(NNG0+NDBSCA(11)+44)     ! G0 + (-72) + 44 = G0 - 28
151     NAFLAS=NNAF
```

This PLSTEP amplitude calculation (`G0 + (-72) + 44 = G0 - 28`) is **ONLY for burst transients** at plosive releases. It is NOT a master gain formula.

---

## 3. The GETAMP Function (dB to Linear Conversion)

### 3.1 Algorithm (GETAMP.FOR)

```fortran
C     CONVERT DB ATTEN. (FROM 96 TO -72) TO A LINEAR SCALE FACTOR.
        IF (NDB1.LE.-72) RETURN    ! 0 below -72 dB
        IF (NDB1.GT.96) NDB1=96    ! clip at 96 dB
        NDB2=NDB1/6                ! coarse: 6 dB steps (power of 2)
        NDB3=NDB1-(6*NDB2)         ! fine: 0-5 dB interpolation
        XX1=STABLE(17-NDB2)        ! power-of-2 table
        XX2=DTABLE(6-NDB3)         ! sub-6dB interpolation table
        GETAMP=XX1*XX2
```

### 3.2 Conversion Table Values

The STABLE array provides 6 dB steps (each step is 2x):
```
Index  dB    Linear
  1    96    65536
  2    90    32768
 ...
 17     0    1.0
 18    -6    0.5
 ...
 28   -66    0.000487
```

The DTABLE array provides sub-6dB interpolation:
```
Index  dB offset  Factor
  6      0        1.0
  5     +1        1.12
  4     +2        1.26
  ...
  1     +5        1.8
```

### 3.3 Equivalent JavaScript Formula

The current implementation's `_dbToLinear` is close but uses a slightly different formula:
```javascript
_dbToLinear(db) {
  if (!Number.isFinite(db) || db <= -72) return 0;
  const clamped = Math.min(96, db);
  return 2 ** (clamped / 6);  // 6 dB = 2x (power of 2)
}
```

Note: Klatt 80 uses `2^(dB/6)` for coarse steps, but the DTABLE provides smoother interpolation. The JS approximation `2^(dB/6)` is mathematically equivalent to `10^(dB/20)` scaled by `2^(dB/6) / 10^(dB/20) = 2^(dB/6) / 2^(dB/6.0206)` which is close but not exact.

---

## 4. Why the Current Formula is Wrong

### Current Implementation (klatt-synth.js lines 487-492)

```javascript
// Match Klatt80 PLSTEP scaling: GETAMP(G0 + NDBSCA(AF) + 44).
const outputScale = this._dbToLinear(ndbScale.AF + 44);  // = _dbToLinear(-72 + 44) = _dbToLinear(-28)
const masterGain = Math.min(
  5.0,
  this._dbToLinear(goDb) * baseBoost * outputScale
);
```

### Problems

1. **Wrong context**: The comment mentions PLSTEP, but this is master gain, not burst transient amplitude

2. **Formula conflation**: `ndbScale.AF + 44 = -72 + 44 = -28` is from PLSTEP burst calculation, not output scaling
   - PLSTEP uses: `G0 + NDBSCA(AF) + 44 = G0 - 28`
   - This gives the burst amplitude relative to G0, not a scaling factor

3. **outputScale is constant garbage**: `_dbToLinear(-28) = 2^(-28/6) = 0.032`
   - This 0.032 multiplier doesn't come from Klatt 80 anywhere
   - It's an artifact of misinterpreting the PLSTEP formula

4. **Ad-hoc clamp**: `Math.min(5.0, ...)` indicates awareness of clipping issues but doesn't solve them properly

5. **G0 applied twice**:
   - G0 is already added to AV, AH, AF etc. in `_applyKlattParams` via `ndbScale` offsets
   - Then `_dbToLinear(goDb)` applies G0 again to master gain
   - This doubles the effect of G0

### Calculation with typical values:

With G0=47 (default):
```
outputScale = _dbToLinear(-28) = 2^(-28/6) = 0.032
_dbToLinear(47) = 2^(47/6) = 246.7
masterGain = min(5.0, 246.7 * 1.0 * 0.032) = min(5.0, 7.9) = 5.0
```

The 5.0 clamp is always hit for typical G0 values, so master gain is effectively a constant 5.0x.

---

## 5. klatt-syn's Approach (Reference)

From `Klatt.ts`:

```typescript
// No master gain from G0 - instead uses gainDb/gainLin
fState.gainLin = dbToLin(fParms.gainDb || 0);

// In computeNextOutputSignalSample:
out *= fState.gainLin;
```

klatt-syn:
- Does NOT use G0 for master gain
- Uses `gainDb` parameter directly for output scaling
- Has AGC (automatic gain control) mode for normalized output
- Uses standard `10^(dB/20)` for dB-to-linear conversion

---

## 6. Recommended Fix

### 6.1 Remove the Conflated PLSTEP Formula

The master gain should NOT use the PLSTEP formula. These are separate mechanisms.

### 6.2 Correct G0 Application

G0 should only be added to source amplitude parameters (AV, AH, AF, AVS, A1-A6, etc.), not applied separately to master gain. The current code adds G0 to those parameters AND applies it to master gain - this doubles its effect.

### 6.3 Proposed Master Gain Calculation

```javascript
_applyKlattParams(params, atTime, ramp) {
  // ... existing amplitude calculations that include G0 via ndbScale ...

  // Master gain: simple user-controllable scaling
  // G0 is already incorporated in individual source amplitudes
  const baseBoost = Number.isFinite(this.params.masterGain)
    ? this.params.masterGain
    : 1.0;
  const masterGain = baseBoost;  // No additional G0 or outputScale multiplication

  // Optional: outputGain provides additional post-processing gain
  // (already exists in the node graph)
}
```

### 6.4 Alternative: Follow klatt-syn Model

If normalized float output is desired:
```javascript
const masterGain = baseBoost;  // Just the user's masterGain setting
// Use outputGain node for any final adjustment
// Consider AGC mode for automatic normalization
```

### 6.5 Exact Code Change

Replace lines 484-492:
```javascript
// BEFORE (wrong):
const baseBoost = Number.isFinite(this.params.masterGain)
  ? this.params.masterGain
  : 1.0;
// Match Klatt80 PLSTEP scaling: GETAMP(G0 + NDBSCA(AF) + 44).
const outputScale = this._dbToLinear(ndbScale.AF + 44);
const masterGain = Math.min(
  5.0,
  this._dbToLinear(goDb) * baseBoost * outputScale
);

// AFTER (correct):
const masterGain = Number.isFinite(this.params.masterGain)
  ? this.params.masterGain
  : 1.0;
// G0 is already incorporated in individual source amplitudes (voiceGain, aspGain, etc.)
// No additional G0-based scaling needed for master gain
```

---

## 7. Additional Considerations

### 7.1 The 170x Factor is Irrelevant for Float

The 170x multiplier in Klatt 80 is ONLY for 16-bit integer output format. For normalized float output:
- Target range: -1.0 to +1.0
- Internal signal levels should be scaled so that typical speech stays within this range
- Clipping should be avoided or handled gracefully

### 7.2 G0 Typical Range Translation

If Klatt 80's G0=47 with 170x scaling produces proper 16-bit output, then for float output without 170x:
- The individual amplitude parameters (with G0 offsets) should produce signals roughly in the -1 to +1 range
- This depends on how `voiceGain`, `aspGain`, `fricGain` etc. are computed

### 7.3 Verify Individual Gain Calculations

After removing the broken master gain formula, check that:
1. `voiceGain = _dbToLinear(voiceDb + ndbScale.AV)` with `ndbScale.AV = -72` gives reasonable levels
2. G0 is NOT being added separately if it's already in `voiceDb` etc.

---

## 8. Summary

| Aspect | Klatt 80 | Current Code | Recommended |
|--------|----------|--------------|-------------|
| G0 application | Added to each amplitude param | Added to params AND to master gain | Add to params only |
| 170x scaling | For 16-bit output | Not used | Not needed for float |
| PLSTEP formula | Burst transient only | Misused for master gain | Remove from master gain |
| Master gain | Implicit via G0 in sources | Broken double-application | Simple user setting |
| Output clipping | Hard clip at +/-32767 | Ad-hoc 5.0 clamp | Proper normalization or AGC |

The fix is straightforward: remove the incorrect formula and let `masterGain` simply be the user's `params.masterGain` value, since G0 is already incorporated in the individual source amplitudes.
