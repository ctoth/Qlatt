# Task: Audit _dbToLinear Callers for Clipping (Issue 11)

## Context

See `prompts/16bit-conversion-guide.md` for background.

The `_dbToLinear()` function can return values up to 65536 (at +96 dB):
```javascript
_dbToLinear(db) {
  if (!Number.isFinite(db) || db <= -72) return 0;
  const clamped = Math.min(96, db);
  return 2 ** (clamped / 6);  // At +96 dB: 2^16 = 65536
}
```

In normalized float space (-1.0 to +1.0), values > 1.0 clip.

## Objective

Find ALL places that call `_dbToLinear()` and verify:
1. The input dB value cannot exceed safe levels
2. If it can exceed, proper clamping is applied afterward
3. The signal path stays within normalized float range

## Investigation

1. Find all calls to `_dbToLinear()` in `src/klatt-synth.js`
2. For each call, trace what dB values are possible
3. Identify any that could produce > 1.0 output
4. Recommend fixes for problematic cases

## Reference

Typical parameter ranges:
- G0: 40-60 dB (default 47)
- AV: 0-70 dB
- AH: 0-70 dB
- AF: 0-80 dB
- A1-A6: 0-80 dB (but ndbScale offsets make effective range much lower)

## Output

Write analysis to `reports/16bit-issue11-dbtolinear.md`:

For each _dbToLinear call:
```
### Call site N: [location]
- **Line**: XXX
- **Formula**: _dbToLinear(...)
- **Max possible dB**: calculated value
- **Max output**: resulting linear
- **Risk**: HIGH/MEDIUM/LOW/NONE
- **Fix needed**: yes/no and what
```

## DO NOT

- Make code changes
- Stage or commit
