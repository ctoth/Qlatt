# Issue 12b: Remove Differentiator Compensation from _setParallelFormantGain

## Change Made

Removed differentiator compensation from `_setParallelFormantGain()` in `src/klatt-synth.js`.

**Before (lines 354-372):**
- Calculated `diffGain = Math.sqrt(2 - 2 * Math.cos(w))`
- Divided linear gain by `diffGain` for formants 1+
- Applied `sign * compensated`

**After (lines 354-367):**
- Removed `compensated` variable
- Removed frequency-based diffGain calculation block
- Applied `sign * linear` directly
- Added explanatory comment per spec

## Rationale

Klatt 80 applies parallel formant gains directly to the first-differenced signal without compensation. The low-frequency attenuation from the differentiator is intentional - it prevents F2-F6 energy from polluting the F1 region.

## Status

Complete. Not staged/committed per instructions.
