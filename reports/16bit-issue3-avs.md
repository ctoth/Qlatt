# Issue 3: AVS *10 Multiplier Analysis

## Summary

The `*10` multiplier in the AVS (quasi-sinusoidal voicing amplitude) calculation is **correct per Klatt 80** but produces clipping in our normalized float implementation. The multiplier should be **removed** for float output.

## What Klatt 80 Does

### PARCOE.FOR Line 134-135
```fortran
C     AMPLITUDE OF QUASI-SINUSOIDAL VOICING SOURCE
      NDBAVS=NNG0+NNAVS+NDBSCA(12)
      SINAMP=10.*GETAMP(NDBAVS)
```

Key observations:

1. **NDBSCA(12) = -44** (line 53) - This is the base offset for AVS
2. **SINAMP is the ONLY source with a `10.*` multiplier** - Compare:
   - `IMPULS=GETAMP(NDBAV)` (line 119) - no multiplier
   - `AHH=GETAMP(NDBAH)` (line 122) - no multiplier
   - `AFF=GETAMP(NDBAF)` (line 127) - no multiplier
   - `SINAMP=10.*GETAMP(NDBAVS)` (line 135) - **10x multiplier**

### Why Does Klatt 80 Use 10x for SINAMP?

The quasi-sinusoidal voicing source (AVS) generates a more sinusoidal waveform compared to the impulsive glottal source. Looking at COEWAV.FOR:

1. **INPUTS (SINAMP)** is fed through RGS (glottal spectral filter) and RGP (glottal pole) in cascade (lines 132-138)
2. **INPUT (IMPULS)** only goes through RGP and RGZ (lines 125-131)

The quasi-sinusoidal path has more filtering stages that attenuate the signal. The 10x compensates for this additional attenuation so that at the same dB setting, AVS produces comparable output level to AV.

### GETAMP Output Range

From GETAMP.FOR, the STABLE table contains values like:
```fortran
DATA STABLE/65536.,32768.,16384.,8192.,4096.,2048.,1024.,512.,256.,128.
     1,64.,32.,16.,8.,4.,2.,1.,.5,.25,.125,.0625,.0312,.0156,.0078,.0039,.00195
     1,.000975,.000487/
```

This is 16-bit integer space. A 0 dB reference produces 1.0, but higher dB values produce values up to 65536.

## Current Qlatt Code (klatt-synth.js ~line 476)

```javascript
const voiceParGain =
  this._dbToLinear(voiceParDb + ndbScale.AVS) * 10 * parallelScale;
```

With:
- `voiceParDb = params.AVS ?? -70`
- `ndbScale.AVS = -44`

At max AVS=70:
- `_dbToLinear(70 + (-44)) = _dbToLinear(26) = 10^(26/20) = 20.0`
- `20.0 * 10 = 200` (clips badly in float -1 to 1 space)

## klatt-syn Comparison

klatt-syn (Klatt.ts) does NOT implement quasi-sinusoidal voicing at all. It uses `parallelVoicingDb` and calls `dbToLin()` directly without any multiplier (line 725):

```typescript
fState.parallelVoicingLin = dbToLin(fParms.parallelVoicingDb);
```

This confirms that the 10x is specific to Klatt 80's quasi-sinusoidal source compensation.

## Why the *10 Doesn't Apply to Our Implementation

1. **Different audio pipeline**: Our Web Audio implementation uses normalized float samples. The 10x was needed for 16-bit integer math with different filter implementations.

2. **Different filter cascade**: The Klatt 80 10x compensates for signal loss through RGS->RGP. Our glottal source generation may have different gain characteristics.

3. **Already at risk of clipping**: With ndbScale.AVS = -44 and max AVS = 70, we get linear gain of 20. Adding 10x guarantees clipping.

4. **Consistency with other sources**: IMPULS, AHH, and AFF don't use multipliers in our code. AVS shouldn't either for consistency.

## Recommendation

**Remove the `* 10` multiplier from the AVS calculation.**

Change from:
```javascript
const voiceParGain =
  this._dbToLinear(voiceParDb + ndbScale.AVS) * 10 * parallelScale;
```

To:
```javascript
const voiceParGain =
  this._dbToLinear(voiceParDb + ndbScale.AVS) * parallelScale;
```

### Rationale

1. The 10x was Klatt 80's compensation for filter-stage attenuation in their specific implementation
2. Our normalized float pipeline doesn't need this compensation
3. Removing it brings AVS gain handling in line with AV, AH, AF
4. Maximum gain becomes 20.0 (still high but manageable with output limiting) vs 200.0

### Alternative: Adjust ndbScale.AVS

If the 10x removal makes AVS too quiet, increase ndbScale.AVS from -44 to match the effective level:
- Original: `_dbToLinear(AVS - 44) * 10`
- Equivalent without 10x: `_dbToLinear(AVS - 44 + 20) = _dbToLinear(AVS - 24)`

So `ndbScale.AVS = -24` would preserve the original Klatt 80 amplitude relationship without the explicit 10x multiplier.

## Files Analyzed

- `~/src/klatt80/PARCOE.FOR` - line 135: `SINAMP=10.*GETAMP(NDBAVS)`
- `~/src/klatt80/GETAMP.FOR` - dB to linear conversion in 16-bit space
- `~/src/klatt80/COEWAV.FOR` - line 119: `INPUTS=SINAMP` usage
- `~/src/klatt-syn/src/Klatt.ts` - does not implement quasi-sinusoidal voicing
- `C:\Users\Q\code\Qlatt\src\klatt-synth.js` - current implementation
