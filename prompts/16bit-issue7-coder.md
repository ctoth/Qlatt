# Task: Update A2COR/A3COR Comment (Issue 7)

## HARD CONSTRAINT: No Deviation

You implement the plan exactly as specified.

## The Fix

In `src/klatt-synth.js`, find the A2COR/A3COR comment (around lines 461-462).

Current:
```javascript
// Note: Klatt 80 A2COR/A3COR corrections removed - we use A1-A6 dB values directly
// like klatt-syn, to avoid muting issues when F1 is low (e.g., stop releases).
```

Change to:
```javascript
// Note: Klatt 80 A2COR/A3COR corrections removed - we use A1-A6 dB values directly
// like klatt-syn, to avoid muting issues when F1 is low (e.g., stop releases).
// See reports/16bit-issue6-a2cor.md for detailed analysis.
```

## Output

1. Make the code change
2. Write brief confirmation to `reports/16bit-issue7-coder.md`

## DO NOT

- Change anything else
- Stage or commit
