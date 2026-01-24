# Task: Investigate Default Parallel dB Values (Issue 15)

## Context

See `prompts/16bit-conversion-guide.md`.

In `src/klatt-synth.js` lines ~56-62 (`_defaultParams`):
```javascript
AN: -70,
A1: -70,
A2: -70,
A3: -70,
A4: -70,
A5: -70,
A6: -70,
AB: -70,
```

With ndbScale offsets:
- A1: -70 + (-58) = -128 dB → cutoff (0)
- A2: -70 + (-65) = -135 dB → cutoff (0)
- etc.

All defaults effectively mute the parallel branch.

## Question

1. Is this intentional? (silence until explicitly configured)
2. Is this the right design, or should defaults be non-zero?
3. Does Klatt 80 have default parameter values?

## Investigation

1. Check how these defaults are used in practice
2. Trace what happens when no A1-A6 values are provided
3. Check `~/src/klatt-syn/src/Klatt.ts` for comparison
4. Determine if this is intentional design or oversight

## Output

Write analysis to `reports/16bit-issue15-defaults.md`:
- Whether muting is intentional
- Any issues with current defaults
- Recommended action

## DO NOT

- Make code changes
- Stage or commit
