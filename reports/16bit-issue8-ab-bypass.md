# Issue 8: AB Bypass Scaling Analysis

## Summary

**Finding:** The `parallelScale` multiplier on AB bypass is NOT in Klatt 80 and should be removed.

## Evidence from Klatt 80 FORTRAN

### PARCOE.FOR (lines 152-154)
```fortran
C     SET AMPLITUDE OF BYPASS PATH OF FRICATION TRACT
      NDB=NNAB+NDBSCA(8)
      ABP=GETAMP(NDB)
```

The bypass amplitude is computed as:
1. `NNAB` - the input AB parameter (dB value 0-60)
2. `NDBSCA(8)` = -84 dB offset (from DATA statement line 53)
3. `GETAMP(NDB)` - converts dB to linear amplitude

**No A2COR/A3COR correction is applied to AB.** Compare:
- A2P: `A2COR*GETAMP(NDB)` (has correction)
- A3P-A6P: `A3COR*GETAMP(NDB)` (has correction)
- ANPP: `GETAMP(NDB)` (no correction)
- ABP: `GETAMP(NDB)` (no correction)

### COEWAV.FOR (line 247)
```fortran
      ULIPSF=Y1P-Y2P+Y3P-Y4P+Y5P-Y6P+YN-ABPAR*UFRIC
```

The bypass is used directly: `ABPAR*UFRIC`
- ABPAR (which is ABP from PARCOE) is multiplied directly by UFRIC
- No additional scaling applied
- Note: UFRIC = `AFRIC*NOISE` where AFRIC is the frication amplitude

## klatt-syn TypeScript Implementation (lines 686, 728)

```typescript
fState.parallelBypassLin = dbToLin(fParms.parallelBypassDb);
...
v += fState.parallelBypassLin * source2;
```

The klatt-syn implementation also applies bypass directly without additional scaling.

## Current Qlatt Implementation

```javascript
// Line 580
this._dbToLinear(params.AB + ndbScale.AB) * parallelScale
```

Where:
- `ndbScale.AB` = -84 (correct, matches NDBSCA(8))
- `parallelScale` = user configurable, defaults to 1.0

### What is parallelScale?

`parallelScale` is a user-configurable parameter (`parallelGainScale`) that scales ALL parallel branch outputs:
- Parallel formant gains (A1-A6)
- Parallel bypass (AB)
- Parallel nasal (AN)
- Parallel voicing (AVS)
- Parallel frication (AF)

This is a Qlatt-specific parameter for user control of cascade/parallel mix balance.

## Analysis

1. **The -84 dB offset is correct** - matches Klatt 80 exactly

2. **parallelScale is NOT in Klatt 80** - it's a Qlatt extension for:
   - User control of parallel branch volume
   - Balancing cascade vs parallel contributions

3. **Should parallelScale apply to AB?**

   From a signal processing perspective, the bypass is part of the parallel branch output. When `parallelScale` is used to balance cascade vs parallel mix, the bypass should logically be included since it contributes to the parallel output.

   Looking at COEWAV.FOR line 247, the bypass is summed into `ULIPSF` (the parallel branch output) which is then added to `ULIPSV` (cascade branch output) at line 251.

4. **Conclusion:** The `parallelScale` multiplier is appropriate as a Qlatt-specific user control, but it is NOT part of Klatt 80 behavior.

## Recommendation

**No change needed.**

The current behavior is acceptable because:

1. The -84 dB offset matches Klatt 80 exactly
2. `parallelScale` defaults to 1.0, so default behavior matches Klatt 80
3. When `parallelScale` is used (for cascade/parallel mixing), including AB in the scaling is logically correct since AB is part of the parallel branch output

The implementation correctly separates:
- Klatt 80 behavior (via ndbScale offsets)
- Qlatt extensions (via parallelScale for user control)

## Comparison Table

| Implementation | AB Formula | Notes |
|---------------|------------|-------|
| Klatt 80 | `GETAMP(AB + (-84))` | No additional scaling |
| klatt-syn | `dbToLin(parallelBypassDb)` | No offset in param, no additional scaling |
| Qlatt | `dbToLin(AB + (-84)) * parallelScale` | Offset correct, parallelScale is Qlatt extension |

## Status

**VERIFIED CORRECT** - No changes required.
