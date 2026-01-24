# Task: Investigate AB Bypass Scaling (Issue 8)

## Context

See `prompts/16bit-conversion-guide.md`.

In `src/klatt-synth.js` line ~572:
```javascript
this._dbToLinear(params.AB + ndbScale.AB) * parallelScale
```

With ndbScale.AB = -84.

## Question

The `* parallelScale` multiplier is not in Klatt 80. Is this correct, or does it deviate from original behavior?

## Investigation

1. Read `~/src/klatt80/COEWAV.FOR` bypass path handling (line 247: `ABPAR*UFRIC`)
2. Understand what ABPAR represents and how it's used
3. Determine if `parallelScale` is appropriate here
4. Compare with `~/src/klatt-syn/src/Klatt.ts`

## Output

Write analysis to `reports/16bit-issue8-ab-bypass.md`:
- How Klatt 80 handles bypass amplitude
- Whether parallelScale is appropriate
- Recommended action

## DO NOT

- Make code changes
- Stage or commit
