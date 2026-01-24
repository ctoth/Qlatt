# Task: Fix Missing ndbScale Offsets (Issue 11 Priority 1 & 2)

## HARD CONSTRAINT: No Deviation

You implement the plan exactly as specified.

## Context

See `prompts/16bit-conversion-guide.md` and `reports/16bit-issue11-dbtolinear.md`.

Several call sites use raw dB values without ndbScale offsets, causing potential clipping.

## Fixes Required

### Fix 1: setParam() AN case (line ~860)

Find in `setParam()` switch statement the case for `'AN'` or `'parallelNasalGain'`.

Current code uses raw dB:
```javascript
case 'AN':
case 'parallelNasalGain':
  // ... uses _dbToLinear(value) directly
```

Add ndbScale.AN offset (-58):
```javascript
// Apply ndbScale.AN (-58) to convert Klatt parameter to safe linear
this._dbToLinear(value + (-58))
```

### Fix 2: setParam() AB case (line ~875)

Find the case for `'AB'`.

Add ndbScale.AB offset (-84):
```javascript
// Apply ndbScale.AB (-84) to convert Klatt parameter to safe linear
this._dbToLinear(value + (-84))
```

### Fix 3: _applyAllParams() bypass gain (line ~297)

Find in `_applyAllParams()` where AB is used.

Current code:
```javascript
this._dbToLinear(p.AB) * parallelScale
```

Add ndbScale.AB offset:
```javascript
// Apply ndbScale.AB (-84) for safe Klatt parameter conversion
this._dbToLinear(p.AB + (-84)) * parallelScale
```

### Fix 4: _applyAllParams() nasal gain (line ~302)

Find where AN/parallelNasalGain is used.

Current code:
```javascript
this._dbToLinear(nasalDb) * parallelScale
```

Add ndbScale.AN offset:
```javascript
// Apply ndbScale.AN (-58) for safe Klatt parameter conversion
this._dbToLinear(nasalDb + (-58)) * parallelScale
```

## Note

The ndbScale object exists in `_applyKlattParams()` but not in `_applyAllParams()` or `setParam()`. Either:
- Use literal values (-58, -84) with comments explaining they're ndbScale offsets, OR
- Make ndbScale a class property or extract it

Choose whichever is simpler and more consistent with existing code.

## Output

1. Make the fixes
2. Write confirmation to `reports/16bit-issue11-coder.md`

## DO NOT

- Fix the proximity correction issue (that's Priority 3)
- Fix the AVS *10 issue (that's Issue 3)
- Stage or commit
