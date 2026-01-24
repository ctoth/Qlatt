# Task: Implement Issue 12 Fix - Remove Differentiator Compensation

## HARD CONSTRAINT: No Deviation

You implement the plan exactly as specified. You do not have authority to change the approach.

If you believe the plan is wrong:
1. STOP immediately
2. Write your objection to reports/16bit-issue12-coder.md
3. Exit without implementing anything

You are NOT authorized to:
- Choose a "more pragmatic" approach
- Implement a partial solution
- Rationalize why the plan should be different

Implement the plan or report why you cannot. There is no third option.

## The Fix

In `src/klatt-synth.js`, remove the differentiator compensation (lines 567-576).

The code currently looks like:
```javascript
for (let i = 0; i < this.nodes.parallelFormantGains.length; i += 1) {
  const sign = i >= 1 ? (i % 2 === 1 ? -1 : 1) : 1;
  let linear = parallelLinear[i] * parallelScale;
  if (i >= 1) {
    const freq = params[`F${i + 1}`] ?? this.params[`F${i + 1}`];
    if (Number.isFinite(freq) && freq > 0) {
      const w = (2 * Math.PI * freq) / this.ctx.sampleRate;
      const diffGain = Math.sqrt(2 - 2 * Math.cos(w));
      if (diffGain > 0) {
        linear /= diffGain;
      }
    }
  }
  this._scheduleAudioParam(/* ... */);
}
```

Change it to:
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

## Rationale (for the comment)

Per analysis in `reports/16bit-issue12-differentiator.md`:
- Klatt 80 COEWAV.FOR does NOT compensate for differentiator gain
- The low-frequency attenuation is intentional per Klatt (1980)
- Previous compensation caused 38x amplification at low frequencies, causing clipping

## Output

1. Make the code change
2. Write brief confirmation to `reports/16bit-issue12-coder.md`

## DO NOT

- Add any other changes
- Stage or commit
