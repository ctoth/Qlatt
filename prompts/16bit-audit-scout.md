# Task: Audit ALL 16-bit Conversion Issues

## Context

Klatt 80 FORTRAN uses 16-bit integer space. Our `klatt-synth.js` uses normalized floating-point (-1.0 to 1.0). Direct application of Klatt 80 dB offsets causes amplitude problems.

Example of the bug (already fixed):
- Klatt 80 formula: `G0 - 28` for PLSTEP amplitude
- In 16-bit space: works correctly
- In our normalized float: gives ~9.0 linear amplitude (clips badly)
- Fix: Changed to `G0 - 50` which gives ~0.7 (safe)

## Objective

Find EVERY place in `src/klatt-synth.js` where we apply Klatt 80 dB offsets that may not translate correctly to normalized float space.

## What to Look For

1. **All uses of `ndbScale.*`** - these are Klatt 80's 16-bit offsets:
   - ndbScale.AV = -72
   - ndbScale.AH = -72 (was -102 in original Klatt 80)
   - ndbScale.AF = -72
   - ndbScale.AVS = -44
   - ndbScale.A1 = -58, A2 = -65, A3 = -73, A4 = -78, A5 = -79, A6 = -80
   - ndbScale.AB = -84
   - ndbScale.AN = -58

2. **Any hardcoded dB offsets** like `+ 44`, `- 28`, `- 50`, etc.

3. **Ad-hoc multipliers** like `* 10` that might be compensating for the issue

4. **Any `_dbToLinear()` calls** with calculated offsets

## Reference

Compare against `~/src/klatt-syn/parwave.c` to understand original intent.

## Output

Write to `reports/16bit-audit-scout.md`:

For EACH issue found, document:
```
### Issue N: [Brief name]
- **File**: src/klatt-synth.js
- **Line(s)**: XXX
- **Current code**: `exact code snippet`
- **ndbScale or offset used**: value
- **What Klatt 80 does**: description
- **Potential problem**: why this might be wrong in float space
- **Severity**: CRITICAL / HIGH / MEDIUM / LOW
```

Be exhaustive. Miss nothing.

## DO NOT

- Fix anything
- Edit any code
- Stage or commit
