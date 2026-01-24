# Revert P3: PLSTEP Amplitude Fix

## Date
2026-01-23

## Change
In `src/klatt-synth.js`, `_scheduleBurstTransient` method:

Changed:
```javascript
const burstDb = goDb - 28;
```

To:
```javascript
const burstDb = goDb - 50;
```

## Rationale

P3 had applied the Klatt 80 formula directly: `G0 + ndbScale.AF + 44 = G0 - 28`.

However, Klatt 80 operates in 16-bit integer space where amplitudes are scaled differently. In our normalized floating-point audio context:

- **G0-28** with G0=47 gives burstDb=19, which converts to ~9.0 linear amplitude (causes clipping/distortion)
- **G0-50** with G0=47 gives burstDb=-3, which converts to ~0.7 linear amplitude (safe, no clipping)

The original G0-50 offset was chosen empirically to produce reasonable burst amplitudes in normalized audio without distortion.

## Files Modified

- `src/klatt-synth.js` (line 675)
