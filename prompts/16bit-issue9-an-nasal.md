# Task: Investigate AN Nasal Scaling (Issue 9)

## Context

See `prompts/16bit-conversion-guide.md`.

In `src/klatt-synth.js` line ~580:
```javascript
this._dbToLinear(params.AN + ndbScale.AN) * parallelScale
```

With ndbScale.AN = -58.

Similar pattern to Issue 8 (AB bypass).

## Question

1. Is ndbScale.AN = -58 correct per Klatt 80?
2. Is the parallelScale multiplier appropriate?
3. Any differences from AB handling?

## Investigation

1. Read `~/src/klatt80/PARCOE.FOR` nasal pole handling (NDBSCA(7) = -58)
2. Read `~/src/klatt80/COEWAV.FOR` nasal pole path
3. Verify the -58 offset and check for any additional scaling
4. Compare with `~/src/klatt-syn/src/Klatt.ts`

## Output

Write analysis to `reports/16bit-issue9-an-nasal.md`:
- How Klatt 80 handles nasal pole amplitude
- Whether our implementation is correct
- Recommended action

## DO NOT

- Make code changes
- Stage or commit
