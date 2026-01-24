# Task: Investigate Frication Gain SW=1 Behavior (Issue 10)

## Context

See `prompts/16bit-conversion-guide.md`.

In `src/klatt-synth.js` lines ~481-483:
```javascript
const fricDbAdjusted = params.SW === 1 ? Math.max(fricDb, aspDb) : fricDb;
const fricGain =
  this._dbToLinear(fricDbAdjusted + ndbScale.AF) * parallelScale;
```

The SW=1 case uses `Math.max(fricDb, aspDb)` to select the louder of frication vs aspiration.

## Question

Does this match Klatt 80's SW=1 behavior? PARCOE.FOR line 125 has the original logic.

## Investigation

1. Read `~/src/klatt80/PARCOE.FOR` line 125 and surrounding context
2. Understand what SW controls in Klatt 80
3. Verify our `Math.max` logic matches
4. Check if parallelScale is appropriate here

## Output

Write analysis to `reports/16bit-issue10-sw1.md`:
- What SW=1 does in Klatt 80
- Whether our implementation matches
- Recommended action

## DO NOT

- Make code changes
- Stage or commit
