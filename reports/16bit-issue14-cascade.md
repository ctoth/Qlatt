# Analysis: Cascade Resonator Gain Accumulation (Issue 14)

## Question

Does Klatt 80 have gain compensation for cascade resonators, or is the signal expected to stay within bounds naturally?

## Investigation Summary

Examined three implementations:
1. **Klatt 80 COEWAV.FOR** - Original FORTRAN cascade implementation
2. **klatt-syn Klatt.ts** - Modern TypeScript reference by chdh
3. **Qlatt klatt-synth.js** - Our JavaScript implementation

## Klatt 80 Cascade Handling (COEWAV.FOR lines 173-209)

```fortran
C   SEND GLOTTAL SOURCE THRU CASCADE VOCAL TRACT RESONATORS
C     DO FORMANT EQUATIONS FOR NNXFC FORMANTS IN DESCENDING ORDER
C     TO MINIMIZE TRANSCIENTS
      IF (NXSW.EQ.1) GO TO 430
C     BYPASS R6 IF NNXFC LESS THAN 6
      Y6C=UGLOT
      IF (NNXFC.LT.6) GO TO 415
      Y6C=A6*UGLOT + B6*YL61C + C6*YL62C
      ...
      Y5C=A5*Y6C + B5*YL51C + C5*YL52C
      ...
      Y4C=A4*Y5C + B4*YL41C + C4*YL42C
      Y3C=A3*Y4C + B3*YL31C + C3*YL32C
      Y2C=A2*Y3C + B2*YL21C + C2*YL22C
      Y1C=A1*Y2C + B1*YL11C + C1*YL12C
C     NASAL ZERO-PAIR RNZ:
      YZC=ANZ*Y1C + BNZ*YLNZ1C + CNZ*YLNZ2C
C     NASAL RESONATOR RNP:
      YPC=ANP*YZC + BNP*YLNP1C + CNP*YLNP2C
      ULIPSV=YPC
```

### Key Finding: NO Explicit Gain Compensation

Klatt 80 cascade resonators use coefficients A1-A6 directly with **no gain compensation applied**:
- Each resonator's `A` coefficient is computed by `SETABC(F, BW, A, B, C)`
- There is no division by number of resonators
- There is no explicit attenuation factor for cascade path
- The only scaling happens at the very end: `ULIPS = (ULIPSV + ULIPSF + STEP) * 170`

### Gain Is Controlled Implicitly

Klatt 80 keeps cascade output bounded through:

1. **Source amplitude control**: `IMPULS = GETAMP(NNG0 + NNAV + NDBSCA.AV)` with NDBSCA.AV = -72 dB
   - This makes the input to cascade quite small in the first place

2. **Bandwidth-dependent peak gain**: Each resonator's peak gain is approximately `1/r` where `r = exp(-PI * BW / sampleRate)`
   - Wide bandwidths = lower peak gain
   - Narrow bandwidths = higher peak gain, but energy spreads less

3. **Signal already normalized in 16-bit space**: Klatt 80 works in 16-bit integer space where the 170x final scaling ensures output uses the full range

4. **Hard clipping as safety net** (lines 257-261):
   ```fortran
   IF (ULIPS.LE.WAVMA) GO TO 510
   ULIPS=WAVMA                    ! Clip to +32767
   IF (ULIPS.GE.WAVMAX) GO TO 520
   ULIPS=WAVMAX                   ! Clip to -32767
   ```

## klatt-syn Cascade Handling (Klatt.ts lines 647-659)

```typescript
private computeCascadeBranch (voice: number) : number {
  ...
  let v = cascadeVoice + aspiration;
  v = this.nasalAntiformantCasc.step(v);
  v = this.nasalFormantCasc.step(v);
  for (let i = 0; i < maxOralFormants; i++) {
    v = this.oralFormantCasc[i].step(v);
  }
  return v;
}
```

klatt-syn's `setOralFormantCasc` (line 780-786):
```typescript
function setOralFormantCasc (oralFormantCasc: Resonator, fParms: FrameParms, i: number) {
  const f =  (i < fParms.oralFormantFreq.length) ? fParms.oralFormantFreq[i] : NaN;
  const bw = (i < fParms.oralFormantBw.length)   ? fParms.oralFormantBw[i]   : NaN;
  if (f && bw) {
    oralFormantCasc.set(f, bw);    // DEFAULT dcGain=1
  }
  ...
}
```

**klatt-syn also uses gain=1 for cascade resonators** - no explicit compensation.

## Our Implementation (klatt-synth.js lines 321-327)

```javascript
for (let i = 0; i < this.nodes.cascade.length; i += 1) {
  const node = this.nodes.cascade[i];
  const formant = formants[i];
  this._setAudioParam(node.parameters.get("frequency"), formant.f, atTime);
  this._setAudioParam(node.parameters.get("bandwidth"), formant.b, atTime);
  this._setAudioParam(node.parameters.get("gain"), 1.0, atTime);  // <-- Same as Klatt 80 & klatt-syn
}
```

**We match both Klatt 80 and klatt-syn**: gain=1.0 for all cascade resonators.

## Analysis: Is Gain Accumulation a Real Problem?

### Theoretical Concern

Six 2nd-order resonators in series with gain=1 could theoretically produce very high peaks when:
- Formant frequencies align
- Bandwidths are very narrow
- Input amplitude is high

**Peak resonator gain** = approximately `1 / (1 - r)` where `r = exp(-PI * BW / sampleRate)`

For typical speech formants:
| Formant | Freq | BW | r (at 44.1kHz) | Peak Gain |
|---------|------|----|--------------|-----------|
| F1 | 700 | 60 | 0.9957 | ~233 |
| F2 | 1200 | 90 | 0.9936 | ~156 |
| F3 | 2600 | 120 | 0.9915 | ~118 |
| F4 | 3300 | 250 | 0.9823 | ~56 |
| F5 | 3750 | 200 | 0.9858 | ~70 |
| F6 | 4900 | 1000 | 0.9312 | ~15 |

However, **peak gains don't simply multiply** because:
1. Formants are at different frequencies - only F1's frequency sees F1's peak gain
2. The signal energy is distributed across the spectrum
3. Each resonator amplifies a different frequency region

### Real-World Behavior

The cascade works correctly in Klatt 80 because:

1. **Input is attenuated**: Voice gain uses NDBSCA.AV = -72 dB, making the cascade input very small
2. **Energy distribution**: Speech signals distribute energy across formants, not concentrated at one frequency
3. **Bandwidth limits gain**: Wide bandwidths (especially F4, F6) prevent extreme amplification
4. **Source spectrum shape**: The glottal source has falling spectrum, so higher formants get less input energy

### When It DOES Become a Problem

As documented in `investigations/cascade-clipping.md`, cascade clipping occurs with:
- Very low F1 (200 Hz) - as in voiced stop releases
- Narrow B1 (60 Hz)
- Full AV amplitude

This is why voiced stop releases currently use parallel branch (SW=1).

## Comparison Summary

| Implementation | Cascade Resonator Gain | Compensation | Notes |
|----------------|----------------------|--------------|-------|
| **Klatt 80** | Unity (implicit A coefficient) | None | Hard clips at ±32767 |
| **klatt-syn** | dcGain=1 | None | Same approach |
| **Qlatt** | gain=1.0 | None | Matches both |

## Conclusions

1. **Klatt 80 does NOT apply cascade gain compensation** - our implementation matches the original

2. **Unity gain is correct** for cascade resonators - this is by design

3. **Clipping protection comes from**:
   - Source amplitude control (voice gain with -72 dB offset)
   - Careful parameter selection (appropriate bandwidths)
   - Proper routing decisions (use parallel branch for problematic configurations)

4. **The existing clipping issue** with voiced stop releases is a **parameter problem**, not a gain formula problem. The solution is either:
   - Keep using parallel branch for stop releases (current behavior)
   - Fix F1 transition during release (make F1 climb from 200 to vowel target)
   - Add cascade output attenuation (but this changes the whole system)

## Recommendation

**No code change needed for cascade resonator gain.**

Our gain=1.0 setting matches both Klatt 80 and klatt-syn. The cascade gain accumulation concern is theoretical; in practice, source amplitude control and appropriate parameter selection prevent issues.

The voiced stop release clipping issue (documented in `investigations/cascade-clipping.md`) should be addressed through:
1. **Short-term**: Continue using parallel branch for stop releases (current behavior)
2. **Medium-term**: Implement proper F1 coarticulation for voiced release transitions

## Status

**Issue 14: DOCUMENTED AS ACCEPTABLE**

The cascade uses gain=1.0 per Klatt 80 specification. No implementation change required.
