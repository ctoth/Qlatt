# 16-bit Issue 13: 170x Output Scaling Analysis

**Generated:** 2026-01-23
**Task:** Scout - Verify 170x is not used and determine if documentation is needed

## Background

Klatt 80 COEWAV.FOR line 250-251:
```fortran
C     (SCALE BY 170 TO LEFT JUSTIFY IN 16-BIT WORD)
      ULIPS=(ULIPSV+ULIPSF+STEP)*(170.)
```

The 170x multiplier scales the synthesizer output to left-justify values in a 16-bit integer word (range -32768 to +32767). This is a format conversion step for integer output, not part of the acoustic model.

## Investigation Results

### 1. Verification: 170x Not Used Operationally

Searched `src/` for any operational use of 170 as a multiplier:

| File | Line | Usage | Verdict |
|------|------|-------|---------|
| `klatt-synth.js` | 655 | Comment in JSDoc | Documentation only |
| `tts-frontend-rules.js` | 106, 145, 238 | `dur: 170` | Phoneme duration (ms), unrelated |
| `tts-frontend-rules.js` | 273, 614 | `F2: 1700` | Formant frequency (Hz), unrelated |
| `tts-frontend-rules.js` | 539, 743, 839 | `B3: 170` | Bandwidth (Hz), unrelated |
| `tts-frontend-rules.js` | 647 | `F3: 1700` | Formant frequency (Hz), unrelated |

**CONFIRMED:** The 170x output scaling is NOT used operationally in klatt-synth.js.

### 2. Existing Documentation

The 170x scaling is already documented in multiple locations:

**a) `reports/16bit-audit-scout.md` - Issue 13:**
```
Issue 13: Klatt 80's 170x Output Scaling Not Implemented
- Line(s): N/A - missing
- Severity: LOW - Not needed for float output
- The 170x is specific to 16-bit output formatting. In float space, we don't
  need this. However, the lack of explicit output normalization means all
  internal gains must be carefully balanced to produce output in the -1 to +1 range.
```

**b) `prompts/16bit-conversion-guide.md`:**
```
## The 170x Output Scaling (COEWAV.FOR line 251)
```fortran
ULIPS=(ULIPSV+ULIPSF+STEP)*(170.)
```
This 170x is **ONLY for 16-bit integer output** ("TO LEFT JUSTIFY IN 16-BIT
WORD"). **It has NO relevance for normalized float output.**
```

**c) `src/klatt-synth.js` line 655:**
```javascript
*   ULIPS = (ULIPSV + ULIPSF + STEP) * 170  -- added to output
```
This appears in the PLSTEP burst JSDoc, showing the Klatt 80 context.

### 3. Reference Implementation Comparison

**klatt-syn (TypeScript):** Does not implement 170x scaling. Uses pure float throughout. This aligns with our approach.

### 4. Analysis

The documentation is **sufficient**:
- The audit scout report explicitly calls out Issue 13 as intentionally not implemented
- The 16bit-conversion-guide explains why 170x doesn't apply to float output
- The code comment in `_scheduleBurstTransient()` shows the Klatt 80 original for reference

The current approach is correct:
- 170x is a 16-bit format conversion, not acoustic modeling
- Float output (-1.0 to +1.0) doesn't need left-justification
- Internal gains are already calibrated for normalized float space

## Recommendation

**No action required.**

The 170x scaling omission is:
1. Intentional and correct for float output
2. Already documented in the audit scout report
3. Explained in the 16bit-conversion-guide
4. Referenced in code comments for historical context

A code comment is not needed because:
- Adding "we don't use 170x" would be documenting absence of something
- The existing JSDoc at line 655 provides sufficient historical context
- The reports directory serves as the definitive source for design decisions

## Summary

| Question | Answer |
|----------|--------|
| Is 170x used operationally? | No |
| Is the omission documented? | Yes, in 3 places |
| Is a code comment needed? | No |
| Are there implications? | Gains must stay in [-1, +1] range - already handled |
| Recommended action | None - documentation is sufficient |
