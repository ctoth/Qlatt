# Task: Fix AH Offset (Issue 2)

## HARD CONSTRAINT: No Deviation

You implement the plan exactly as specified.

## The Problem

Per `reports/16bit-issue2-ah-offset.md`:

- Klatt 80 uses AH offset -102 (30 dB quieter than AV/AF's -72)
- The 30 dB difference is physically motivated (aspiration lacks resonant amplification)
- Our code changed offset to -72 but only reduced input values by 15 dB
- Result: aspiration is 15 dB too loud

## The Fix

In `src/klatt-synth.js`, find the ndbScale definition (around line 452-454).

Change:
```javascript
// AH was -102 in Klatt 80, but we use -72 to match AV/AF scaling.
// Input AH values are now scaled to Klatt 80 levels (40 vs 55).
AH: -72,
```

To:
```javascript
// AH: Klatt 80 uses -102 (aspiration 30 dB quieter than voicing).
// Our input AH values are ~15 dB lower than Klatt 80 (max ~40 vs ~55),
// so we use -87 to maintain the same output amplitude relationship.
// Math: G0 + 40 - 87 = G0 - 47 matches G0 + 55 - 102 = G0 - 47
AH: -87,
```

## Verification

- Original: AH=55, offset=-102 → G0 + 55 - 102 = G0 - 47
- Fixed: AH=40, offset=-87 → G0 + 40 - 87 = G0 - 47
- Same output amplitude.

## Output

1. Make the code change
2. Write confirmation to `reports/16bit-issue2-coder.md`

## DO NOT

- Change input AH values (that's a separate concern)
- Stage or commit
