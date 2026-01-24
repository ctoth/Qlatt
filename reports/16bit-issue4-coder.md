# Issue 4 Fix Applied: Master Gain Formula

## Change Made

In `src/klatt-synth.js` (lines 484-489), replaced the broken master gain calculation:

**Before:**
```javascript
const baseBoost = Number.isFinite(this.params.masterGain)
  ? this.params.masterGain
  : 1.0;
// Match Klatt80 PLSTEP scaling: GETAMP(GO + NDBSCA(AF) + 44).
const outputScale = this._dbToLinear(ndbScale.AF + 44);
const masterGain = Math.min(
  5.0,
  this._dbToLinear(goDb) * baseBoost * outputScale
);
```

**After:**
```javascript
// Master gain: simple user-controllable scaling
// G0 is already incorporated in individual source amplitudes (voiceGain, aspGain, etc.)
// No G0-based scaling here - that would double its effect
const masterGain = Number.isFinite(this.params.masterGain)
  ? this.params.masterGain
  : 1.0;
```

## Verification

The edit was applied successfully. The master gain is now a simple user-controllable value without the erroneous G0-based scaling that was doubling G0's effect.
