# Issue 12 Fix: Differentiator Compensation Removal

## Status: COMPLETE

## Change Made

Removed differentiator compensation from `src/klatt-synth.js` lines 564-576.

**Before:** The loop calculated `diffGain = sqrt(2 - 2*cos(w))` for F2-F6 and divided the linear gain by this factor, attempting to "undo" the differentiator's frequency response.

**After:** The loop applies parallel formant gains directly without compensation, matching Klatt 80 behavior. Added comment explaining the intentional spectral shaping.

## Verification

The edited code now reads:
```javascript
// Klatt 80 applies A2PAR/A3PAR/A4PAR directly to first-differenced signal
// without compensation. The differentiator's spectral shaping is intentional -
// it prevents F2-F6 energy from polluting the F1 region.
for (let i = 0; i < this.nodes.parallelFormantGains.length; i += 1) {
  const sign = i >= 1 ? (i % 2 === 1 ? -1 : 1) : 1;
  const linear = parallelLinear[i] * parallelScale;
  this._scheduleAudioParam(
    this.nodes.parallelFormantGains[i].gain,
    sign * linear,
    atTime,
    ramp
  );
}
```

## Note

There is also differentiator compensation in `_setParallelFormantGain()` (lines 354-372) which is used by `_applyAllParams()`. This was not in scope for this fix per the task specification. If consistency is desired, that helper should also be updated.
