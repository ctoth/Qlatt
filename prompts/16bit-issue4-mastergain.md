# Task: Investigate Master Gain Formula (Issue 4)

## Problem

In `src/klatt-synth.js` lines 487-492:

```javascript
// Match Klatt80 PLSTEP scaling: GETAMP(G0 + NDBSCA(AF) + 44).
const outputScale = this._dbToLinear(ndbScale.AF + 44);
const masterGain = Math.min(
  5.0,
  this._dbToLinear(goDb) * baseBoost * outputScale
);
```

The comment says this is for PLSTEP scaling, but it's being used for master gain. The formula `ndbScale.AF + 44 = -72 + 44 = -28` comes from PLSTEP burst calculation, not overall output scaling.

The `Math.min(5.0, ...)` clamp suggests awareness of potential clipping - ad-hoc fix.

## Questions to Answer

1. What is Klatt 80's actual output scaling? (COEWAV.FOR line 251 uses 170x)
2. Is that 170x relevant for normalized float output?
3. What should master gain actually be based on?
4. What is the G0 parameter supposed to do?

## Reference Files

1. `src/klatt-synth.js` - current implementation
2. `~/src/klatt80/COEWAV.FOR` - original output scaling (line 251: `ULIPS=(ULIPSV+ULIPSF+STEP)*(170.)`)
3. `~/src/klatt80/PARCOE.FOR` - G0 parameter handling
4. `~/src/klatt-syn/src/Klatt.ts` - klatt-syn's approach

## Output

Write analysis to `reports/16bit-issue4-mastergain.md`:

1. What Klatt 80 does for overall output scaling
2. What G0 parameter controls
3. Why current formula is wrong
4. Recommended fix with exact code

## DO NOT

- Make code changes
- Stage or commit
