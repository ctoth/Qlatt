# Issue 2: AH Offset Fix - Coder Confirmation

## Change Made

In `src/klatt-synth.js`, updated the `ndbScale.AH` entry:

**Before:**
```javascript
// AH was -102 in Klatt 80, but we use -72 to match AV/AF scaling.
// Input AH values are now scaled to Klatt 80 levels (40 vs 55).
AH: -72,
```

**After:**
```javascript
// AH: Klatt 80 uses -102 (aspiration 30 dB quieter than voicing).
// Our input AH values are ~15 dB lower than Klatt 80 (max ~40 vs ~55),
// so we use -87 to maintain the same output amplitude relationship.
// Math: G0 + 40 - 87 = G0 - 47 matches G0 + 55 - 102 = G0 - 47
AH: -87,
```

## Verification

- Original Klatt 80: AH=55, offset=-102 => G0 + 55 - 102 = G0 - 47
- Our implementation: AH=40, offset=-87 => G0 + 40 - 87 = G0 - 47
- Same output amplitude relationship maintained.

## Files Modified

- `src/klatt-synth.js` (lines 449-453)
