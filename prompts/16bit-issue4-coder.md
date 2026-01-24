# Task: Fix Master Gain Formula (Issue 4)

## HARD CONSTRAINT: No Deviation

You implement the plan exactly as specified. You do not have authority to change the approach.

If you believe the plan is wrong:
1. STOP immediately
2. Write your objection to reports/16bit-issue4-coder.md
3. Exit without implementing anything

## The Fix

In `src/klatt-synth.js`, find lines 484-492 (approximately) with the master gain calculation.

Replace this broken code:
```javascript
const baseBoost = Number.isFinite(this.params.masterGain)
  ? this.params.masterGain
  : 1.0;
// Match Klatt80 PLSTEP scaling: GETAMP(G0 + NDBSCA(AF) + 44).
const outputScale = this._dbToLinear(ndbScale.AF + 44);
const masterGain = Math.min(
  5.0,
  this._dbToLinear(goDb) * baseBoost * outputScale
);
```

With this correct code:
```javascript
// Master gain: simple user-controllable scaling
// G0 is already incorporated in individual source amplitudes (voiceGain, aspGain, etc.)
// No G0-based scaling here - that would double its effect
const masterGain = Number.isFinite(this.params.masterGain)
  ? this.params.masterGain
  : 1.0;
```

## Rationale

Per analysis in `reports/16bit-issue4-mastergain.md`:
1. The PLSTEP formula (`G0 + ndbScale.AF + 44`) is for burst transients only, not master gain
2. G0 is already added to AV, AH, AF etc. in individual amplitude calculations
3. Applying `_dbToLinear(goDb)` to master gain doubles G0's effect
4. The `Math.min(5.0, ...)` clamp was a symptom, not a fix

## Output

1. Make the code change
2. Write brief confirmation to `reports/16bit-issue4-coder.md`

## DO NOT

- Add any other changes
- Stage or commit
