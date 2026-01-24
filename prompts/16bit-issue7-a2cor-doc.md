# Task: Document A2COR/A3COR Removal Rationale (Issue 7)

## Context

Issue 6 analyzed whether A2COR/A3COR corrections should be restored.
Issue 7 is about ensuring the code has proper documentation explaining WHY they were removed.

## Question

Is the existing code comment sufficient, or does it need improvement?

Current comment in `src/klatt-synth.js` (around lines 462-463):
```javascript
// Note: Klatt 80 A2COR/A3COR corrections removed - we use A1-A6 dB values directly
// like klatt-syn, to avoid muting issues when F1 is low (e.g., stop releases).
```

## Investigation

1. Read the current comment in `src/klatt-synth.js`
2. Read the Issue 6 report `reports/16bit-issue6-a2cor.md`
3. Determine if the comment accurately captures the rationale
4. Suggest improved wording if needed

## Output

Write analysis to `reports/16bit-issue7-a2cor-doc.md`:
- Current comment evaluation
- Whether Issue 6 findings are captured
- Recommended comment if update needed

## DO NOT

- Make code changes yet
- Stage or commit
