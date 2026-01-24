# Task: Evaluate A2COR/A3COR Corrections (Issue 6)

## Context

See `prompts/16bit-conversion-guide.md`.

From the audit report (lines 462-463):
```javascript
// Note: Klatt 80 A2COR/A3COR corrections removed - we use A1-A6 dB values directly
// like klatt-syn, to avoid muting issues when F1 is low (e.g., stop releases).
```

Klatt 80 uses A2COR/A3COR corrections (PARCOE.FOR lines 86-92, 140-148) to scale formant amplitudes based on F1 and F2 values.

## Question

1. What exactly do A2COR/A3COR do?
2. Why were they intentionally removed?
3. Should they be conditionally applied (only when F1>threshold)?

## Investigation

1. Read `~/src/klatt80/PARCOE.FOR` lines 86-92 (correction calculation)
2. Read lines 140-148 (correction application)
3. Understand the formula and its purpose
4. Evaluate if conditional application would help

## Output

Write analysis to `reports/16bit-issue6-a2cor.md`:
- What A2COR/A3COR do mathematically
- Why they cause problems at low F1
- Whether conditional application is worthwhile
- Recommendation

## DO NOT

- Make code changes
- Stage or commit
