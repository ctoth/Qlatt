# Issue 3 Fix Confirmation: AVS *10 Multiplier Removed

## Change Made

File: `src/klatt-synth.js` (lines 475-479)

**Before:**
```javascript
const voiceParGain =
  this._dbToLinear(voiceParDb + ndbScale.AVS) * 10 * parallelScale;
```

**After:**
```javascript
// Klatt 80 uses 10*GETAMP(NDBAVS) to compensate for filter cascade attenuation
// In normalized float, that causes 200x amplification at max AVS. Remove it.
// If too quiet, adjust ndbScale.AVS from -44 to -24 instead.
const voiceParGain =
  this._dbToLinear(voiceParDb + ndbScale.AVS) * parallelScale;
```

## Rationale

- The `*10` was Klatt 80's compensation for signal attenuation through RGS->RGP cascade
- In normalized float audio, this caused up to 200x amplification at max AVS=70
- klatt-syn (reference implementation) does not use this multiplier

## Next Steps

- Test audio output for volume levels
- If too quiet, adjust `ndbScale.AVS` from -44 to -24 instead of re-adding multiplier
