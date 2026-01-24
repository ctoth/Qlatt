# Task: Investigate AVS *10 Multiplier (Issue 3)

## Context

See `prompts/16bit-conversion-guide.md`.

In `src/klatt-synth.js` line ~474:
```javascript
const voiceParGain =
  this._dbToLinear(voiceParDb + ndbScale.AVS) * 10 * parallelScale;
```

With:
- `voiceParDb = params.AVS ?? -70`
- `ndbScale.AVS = -44`

At max AVS=70: `_dbToLinear(70 + (-44)) * 10 = _dbToLinear(26) * 10 = 20.2 * 10 = 202`

This 202x amplification will clip badly.

## Question

Is the `* 10` correct per Klatt 80, or is it a 16-bit compensation that doesn't apply to float?

## Investigation

1. Read `~/src/klatt80/PARCOE.FOR` line ~135 where SINAMP is calculated
2. Check the original context - why does Klatt 80 use `10.*GETAMP(NDBAVS)`?
3. Read `~/src/klatt-syn/src/Klatt.ts` for comparison
4. Determine if the *10 should be kept, reduced, or removed

## Output

Write analysis to `reports/16bit-issue3-avs.md`:
- What Klatt 80 does and why
- Whether *10 makes sense for normalized float
- Recommended fix

## DO NOT

- Make code changes
- Stage or commit
