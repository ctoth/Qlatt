# Issue 9: AN Nasal Pole Scaling Analysis

## Summary

**Finding:** The `ndbScale.AN = -58` offset is correct per Klatt 80. The `parallelScale` multiplier is a Qlatt extension (not in Klatt 80) but is appropriate as a user control.

**Status: VERIFIED CORRECT** - No changes required.

## Evidence from Klatt 80 FORTRAN

### PARCOE.FOR (line 53) - NDBSCA Definition

```fortran
C     SCALE FACTORS IN DB FOR GENERAL ADJUSTMENT TO:
C                    A1  A2  A3  A4  A5  A6  AN  AB  AV   AH  AF AVS
      DATA NDBSCA/-58,-65,-73,-78,-79,-80,-58,-84,-72,-102,-72,-44/
```

NDBSCA(7) = -58 for AN (nasal pole amplitude).

### PARCOE.FOR (lines 149-151) - Nasal Pole Amplitude Computation

```fortran
C     SET AMPLITUDE OF PARALLEL NASAL FORMANT
       NDB=NNAN+NDBSCA(7)
      ANPP=GETAMP(NDB)
```

The nasal pole amplitude is computed as:
1. `NNAN` - the input AN parameter (dB value 0-60)
2. `NDBSCA(7)` = -58 dB offset
3. `GETAMP(NDB)` - converts dB to linear amplitude

**No A2COR/A3COR correction is applied to AN.** Compare:
- A2P: `A2COR*GETAMP(NDB)` (has F1/F2 correction)
- A3P-A6P: `A3COR*GETAMP(NDB)` (has F1/F2 correction)
- ANPP: `GETAMP(NDB)` (no correction)
- ABP: `GETAMP(NDB)` (no correction)

This makes sense because:
- A2COR/A3COR compensate for proximity effects between adjacent formants
- The nasal pole is typically around 250-300 Hz, below F1
- It doesn't interact with F1/F2 proximity in the same way

### COEWAV.FOR (lines 222-228) - Nasal Pole in Parallel Branch

```fortran
C     NASAL POLE RN' (EXCITED BY FIRST DIFF. OF VOICING SOURCE)
      UGLOT1=UGLOT-UGLOTL
      UGLOTL=UGLOT
      IF (NXSW.NE.1) UGLOT1=0.
      YN=ANP*ANPAR*UGLOT1 + BNP*YLNP1 + CNP*YLNP2
      YLNP2=YLNP1
      YLNP1=YN
```

Key observations:
1. `ANPAR` (which is ANPP from PARCOE) is the amplitude coefficient
2. The nasal pole is excited by first-differenced voicing (`UGLOT1`)
3. The resonator uses `ANP*ANPAR*UGLOT1` where:
   - `ANP` = resonator's 'a' coefficient (from SETABC)
   - `ANPAR` = amplitude from dB conversion with -58 offset
   - `UGLOT1` = first-differenced glottal source

### COEWAV.FOR (line 247) - Parallel Output Sum

```fortran
      ULIPSF=Y1P-Y2P+Y3P-Y4P+Y5P-Y6P+YN-ABPAR*UFRIC
```

The nasal pole output (`YN`) is added directly to the parallel branch output without negation. Compare:
- F1 (Y1P): +1 (positive)
- F2 (Y2P): -1 (negative)
- Nasal (YN): +1 (positive)

## klatt-syn TypeScript Implementation (lines 788-793)

```typescript
function setNasalFormantPar (nasalFormantPar: Resonator, fParms: FrameParms) {
   if (fParms.nasalFormantFreq && fParms.nasalFormantBw && dbToLin(fParms.nasalFormantDb)) {
      nasalFormantPar.set(fParms.nasalFormantFreq, fParms.nasalFormantBw);
      nasalFormantPar.adjustPeakGain(dbToLin(fParms.nasalFormantDb)); }
    else {
      nasalFormantPar.setMute(); }}
```

klatt-syn uses `nasalFormantDb` directly without an offset. This is a deviation from Klatt 80 - klatt-syn expects the dB value to already be in the appropriate range, rather than applying the NDBSCA offset.

## Current Qlatt Implementation

### Line 588 (scheduleFrame):
```javascript
this._dbToLinear(params.AN + ndbScale.AN) * parallelScale
```

### Line 304 (_applyAllParams):
```javascript
this._dbToLinear(nasalDb + (-58)) * parallelScale
```

### Line 869 (setParam case 'AN'):
```javascript
this.nodes.parallelNasalGain.gain.setValueAtTime(this._dbToLinear(value + (-58)), atTime);
```

Where:
- `ndbScale.AN` = -58 (matches NDBSCA(7) exactly)
- `parallelScale` = user configurable, defaults to 1.0

## Analysis

### 1. Is ndbScale.AN = -58 correct per Klatt 80?

**YES.** NDBSCA(7) = -58 in the FORTRAN code.

### 2. Is the parallelScale multiplier appropriate?

**YES, as a Qlatt extension.**

Klatt 80 does NOT have a parallelScale equivalent. However:
- `parallelScale` defaults to 1.0, so default behavior matches Klatt 80
- It's a user control for balancing cascade vs parallel branch outputs
- The nasal pole is part of the parallel branch output (summed into ULIPSF)
- Logically, if the user wants to scale the parallel branch, the nasal pole should be included

### 3. Any differences from AB handling?

**Minimal differences:**

| Aspect | AB | AN |
|--------|----|----|
| NDBSCA offset | -84 | -58 |
| A2COR/A3COR applied? | No | No |
| parallelScale applied? | Yes | Yes |
| First-differenced input? | No (uses UFRIC directly) | Yes (uses UGLOT1) |
| Sign in output sum? | Negative | Positive |

The main difference is:
- **AB** uses frication noise directly (UFRIC)
- **AN** uses first-differenced voicing (UGLOT1), meaning the nasal pole in the parallel branch has a +6 dB/octave slope from the differentiator

This is consistent with the other parallel formants F2-F6, which also use first-differenced input.

## Comparison Table

| Implementation | AN Formula | Notes |
|---------------|------------|-------|
| Klatt 80 | `GETAMP(AN + (-58))` | No additional scaling |
| klatt-syn | `dbToLin(nasalFormantDb)` | No offset applied (deviation from Klatt 80) |
| Qlatt | `dbToLin(AN + (-58)) * parallelScale` | Offset correct, parallelScale is Qlatt extension |

## Recommendation

**No change needed.**

The current implementation is correct because:

1. **The -58 dB offset matches Klatt 80 exactly** (NDBSCA(7))
2. **No A2COR/A3COR correction** - matches Klatt 80 (nasal pole doesn't get formant proximity correction)
3. **parallelScale defaults to 1.0** - default behavior matches Klatt 80
4. **parallelScale is logically appropriate** - the nasal pole is part of the parallel branch output

## Additional Note: First-Differenced Input

Our implementation applies the nasal pole directly to `source` (undifferenced), not `sourceDifference`. Looking at COEWAV.FOR line 226:

```fortran
YN=ANP*ANPAR*UGLOT1 + BNP*YLNP1 + CNP*YLNP2
```

Where `UGLOT1 = UGLOT - UGLOTL` (first-differenced).

This matches klatt-syn line 681:
```typescript
v += this.nasalFormantPar.step(source);  // nasal formant is directly applied to source
```

Wait - klatt-syn uses `source` directly, not `sourceDifference`. Let me check COEWAV.FOR more carefully...

Looking at COEWAV.FOR lines 222-228:
- For `NXSW.NE.1` (cascade mode), `UGLOT1=0` - the nasal pole gets zero input
- For `NXSW.EQ.1` (parallel mode), `UGLOT1 = UGLOT - UGLOTL` - first-differenced

But wait, klatt-syn comments say "nasal formant is directly applied to source" which seems to contradict Klatt 80.

However, this is a separate issue from the amplitude scaling. The -58 dB offset is correct regardless of whether the input signal is first-differenced or not. The input differentiation is a signal path question, not an amplitude scaling question.

## Status

**VERIFIED CORRECT** - The AN scaling with ndbScale.AN = -58 and parallelScale multiplier is correct.

(Note: The question of first-differenced input for the nasal pole may warrant separate investigation, but it's outside the scope of this amplitude scaling analysis.)
