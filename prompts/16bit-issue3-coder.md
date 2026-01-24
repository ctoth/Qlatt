# Task: Remove AVS *10 Multiplier (Issue 3)

## HARD CONSTRAINT: No Deviation

You implement the plan exactly as specified.

## The Fix

In `src/klatt-synth.js`, find the voiceParGain calculation (line ~474):

Current code:
```javascript
const voiceParGain =
  this._dbToLinear(voiceParDb + ndbScale.AVS) * 10 * parallelScale;
```

Change to:
```javascript
// Klatt 80 uses 10*GETAMP(NDBAVS) to compensate for filter cascade attenuation
// In normalized float, that causes 200x amplification at max AVS. Remove it.
// If too quiet, adjust ndbScale.AVS from -44 to -24 instead.
const voiceParGain =
  this._dbToLinear(voiceParDb + ndbScale.AVS) * parallelScale;
```

## Rationale

Per `reports/16bit-issue3-avs.md`:
- The *10 was Klatt 80's compensation for signal attenuation through RGS->RGP cascade
- At max AVS=70: `_dbToLinear(26) * 10 = 202` - guaranteed clipping
- klatt-syn doesn't use this multiplier

## Output

1. Make the code change
2. Write confirmation to `reports/16bit-issue3-coder.md`

## DO NOT

- Change ndbScale.AVS (try removing *10 first)
- Stage or commit
