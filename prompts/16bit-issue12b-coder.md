# Task: Remove Differentiator Compensation from _setParallelFormantGain (Issue 12b)

## HARD CONSTRAINT: No Deviation

You implement the plan exactly as specified.

## Context

Issue 12 removed differentiator compensation from `_applyKlattParams`. The coder flagged that similar code exists in `_setParallelFormantGain()` helper method (lines ~354-372).

See `prompts/16bit-conversion-guide.md` for background on 16-bit conversion issues.

## The Fix

In `src/klatt-synth.js`, find `_setParallelFormantGain()` method (~line 354-372).

Remove the differentiator compensation logic that divides by `diffGain`.

Add comment explaining why:
```javascript
// Klatt 80 applies parallel formant gains directly to first-differenced signal
// without compensation. The low-frequency attenuation is intentional -
// it prevents F2-F6 energy from polluting the F1 region.
```

## Output

1. Make the code change
2. Write brief confirmation to `reports/16bit-issue12b-coder.md`

## DO NOT

- Change anything else
- Stage or commit
