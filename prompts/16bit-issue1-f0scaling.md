# Task: Investigate F0 Amplitude Scaling (Issue 1)

## Context

See `prompts/16bit-conversion-guide.md`.

From the audit report:
> In Klatt 80, the F0 scaling (`IMPULS*NNF0`) occurs after amplitude calculation. Our code does not include this F0 scaling.

In `src/klatt-synth.js` lines ~442-451, 474:
```javascript
const voiceGain = this._dbToLinear(voiceDb + ndbScale.AV);
```

This may be missing the F0-dependent amplitude boost.

## Question

What does Klatt 80's `IMPULS=IMPULS*NNF0` do? Is it essential for proper pitch-dependent loudness?

## Investigation

1. Read `~/src/klatt80/PARCOE.FOR` IMPULS calculation
2. Understand what NNF0 represents and how it scales
3. Read `~/src/klatt-syn/src/Klatt.ts` for comparison
4. Determine if this affects perceived loudness across pitches

## Output

Write analysis to `reports/16bit-issue1-f0scaling.md`:
- What F0 scaling does in Klatt 80
- Whether it's essential for our implementation
- Recommended action

## DO NOT

- Make code changes
- Stage or commit
