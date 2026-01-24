# Issue 12: Differentiator Compensation Analysis

## Summary

The current Qlatt implementation attempts to compensate for the differentiator's frequency-dependent gain by dividing parallel formant amplitudes by `diffGain`. At low frequencies, this causes extreme amplification (up to 38x at F2=200Hz), leading to clipping.

## Current Implementation (Qlatt)

In `src/klatt-synth.js` lines 567-576:

```javascript
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
```

The formula `sqrt(2 - 2 * cos(w))` is the correct frequency response of a first-difference filter `y[n] = x[n] - x[n-1]`. The problem is:

| Frequency | w (at 48kHz) | diffGain | Compensation |
|-----------|--------------|----------|--------------|
| 200 Hz    | 0.0262       | 0.026    | 38.4x        |
| 500 Hz    | 0.0654       | 0.065    | 15.3x        |
| 1000 Hz   | 0.1309       | 0.131    | 7.6x         |
| 2000 Hz   | 0.2618       | 0.260    | 3.8x         |
| 3000 Hz   | 0.3927       | 0.385    | 2.6x         |

Low F2 values during nasal/stop closures trigger massive amplification.

## Klatt 80 (COEWAV.FOR) Analysis

The original Klatt 80 uses the parallel branch with first-differenced voicing for F2-F4:

```fortran
C     Nasal pole RN' (excited by first diff. of voicing source)
      UGLOT1=UGLOT-UGLOTL
      UGLOTL=UGLOT
      IF (NXSW.NE.1) UGLOT1=0.
      YN=ANP*ANPAR*UGLOT1 + BNP*YLNP1 + CNP*YLNP2

C     Excite formants R2'-R4' with fric noise plus first-diff. voicing
      Y2P=A2*A2PAR*(UFRIC+UGLOT1) + B2*YL21P + C2*YL22P
      Y3P=A3*A3PAR*(UFRIC+UGLOT1) + B3*YL31P + C3*YL32P
      Y4P=A4*A4PAR*(UFRIC+UGLOT1) + B4*YL41P + C4*YL42P
```

Key observations:
1. **No compensation at all** - Klatt 80 does NOT compensate for differentiator gain
2. The AmPAR values (A2PAR, A3PAR, etc.) come directly from dB-to-linear conversion
3. The spectral shaping from the differentiator is **intentional** - it removes low-frequency energy that would otherwise distort the F1 region

The purpose of the differentiator, per Klatt (1980):
> "... using a first difference calculation to remove low-frequency energy from the higher formants; this energy would otherwise distort the spectrum in the region of F1 during the synthesis of some vowels."

## klatt-syn (Klatt.ts) Analysis

The klatt-syn implementation in `setOralFormantPar()` (lines 795-814):

```typescript
function setOralFormantPar (oralFormantPar: Resonator, mParms: MainParms, fParms: FrameParms, i: number) {
   const formant = i + 1;
   const f = fParms.oralFormantFreq[i];
   const bw = fParms.oralFormantBw[i];
   const db = fParms.oralFormantDb[i];
   const peakGain = dbToLin(db);
   if (f && bw && peakGain) {
      oralFormantPar.set(f, bw);
      const w = 2 * Math.PI * f / mParms.sampleRate;
      const diffGain = Math.sqrt(2 - 2 * Math.cos(w));    // gain of differencing filter
      const filterGain = (formant >= 2) ? peakGain / diffGain : peakGain;  // compensate for F2-F6
      oralFormantPar.adjustPeakGain(filterGain);
   }
}
```

klatt-syn does exactly what Qlatt does - compensates by dividing by diffGain. However, it has the same problem: no clamping means extreme amplification at low frequencies.

**Important note**: klatt-syn was written as a clean modern implementation but is not necessarily authoritative. The comment in klatt-syn (lines 801-806) reveals the reasoning:
> "We are not doing this here, because then the output of the parallel branch would no longer match the specified formant levels. Instead, we use the specified dB value to set the peak gain instead of taking it as the DC gain."

This is a design choice that prioritizes matching specified dB levels over following Klatt 80's actual behavior.

## Recommended Fix

**Option D: Remove compensation entirely (match Klatt 80)**

The differentiator's spectral shaping is intentional behavior, not something to be compensated. Klatt 80 uses the first-difference signal directly without compensation.

### Rationale

1. **Klatt 80 doesn't compensate** - The original algorithm applies A2PAR/A3PAR/A4PAR directly to the first-differenced signal
2. **The attenuation is the feature** - Low-frequency attenuation prevents F2/F3/F4 energy from polluting the F1 region
3. **klatt-syn's compensation is a deviation** - Not based on Klatt 80, just a design choice for level matching
4. **No clipping risk** - Without compensation, signals stay in range

### Code Change

In `src/klatt-synth.js`, remove lines 567-576 entirely:

```javascript
// BEFORE (lines 564-583):
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

// AFTER:
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

### Alternative: Clamp diffGain (if level matching is desired)

If matching specified dB levels is important for the TTS frontend, clamp diffGain to a minimum value:

```javascript
if (i >= 1) {
  const freq = params[`F${i + 1}`] ?? this.params[`F${i + 1}`];
  if (Number.isFinite(freq) && freq > 0) {
    const w = (2 * Math.PI * freq) / this.ctx.sampleRate;
    const diffGain = Math.sqrt(2 - 2 * Math.cos(w));
    const clampedDiffGain = Math.max(diffGain, 0.25);  // Max 4x compensation
    linear /= clampedDiffGain;
  }
}
```

A clamp of 0.25 limits compensation to 4x, preventing the 38x amplification at low frequencies.

## Impact Assessment

### If compensation is removed:
- F2-F6 parallel branch output will be quieter (especially at higher frequencies)
- Low formant values will no longer cause clipping
- May require adjusting A2-A6 dB values in TTS frontend to compensate
- More faithful to Klatt 80 behavior

### If clamped:
- Maintains some level matching for mid/high frequencies
- Prevents extreme amplification at low frequencies
- Still a deviation from Klatt 80

## Recommendation

**Remove compensation entirely** to match Klatt 80 behavior. The differentiator's spectral shaping is a feature, not a bug. If the parallel branch sounds too quiet after this change, increase the parallel dB values (A2-A6) uniformly in the TTS frontend rather than fighting the synthesizer's intended behavior.
