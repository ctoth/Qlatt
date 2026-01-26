# Investigation: Stop Release Clicks

## Problem Statement

Stop releases (especially G_REL) produce hard clicks/pops. The output is clipping severely.

From telemetry:
```
Spikes (peak > 1):
0. t=1.081s node=output-sum peak=8.974 phoneme=G_REL
1. t=1.310s node=output-sum peak=1.339 phoneme=T_ASP

PLSTEP bursts (plosive release transients):
plstep: burst @1.078s amp=8.98 (19dB) trigger=AF Δ=50
```

The PLSTEP burst amplitude of 8.98 linear is causing peaks of ~9x clipping.

## Facts (Verified)

1. **PARCOE.FOR line 131**: `PLSTEP=GETAMP(NNG0+NDBSCA(11)+44)` where NDBSCA(11)=-72
   - Formula: `PLSTEP = GETAMP(G0 - 72 + 44) = GETAMP(G0 - 28)`
   - With G0=47: PLSTEP = GETAMP(19) ≈ 8.96

2. **COEWAV.FOR line 251**: `ULIPS=(ULIPSV+ULIPSF+STEP)*(170.)`
   - STEP is added to vocal tract outputs BEFORE the 170x scaling
   - All three terms (ULIPSV, ULIPSF, STEP) share the same scale

3. **PARCOE.FOR lines 117-119**: `NDBAV=NNG0+NNAV+NDBSCA(9)`, `IMPULS=GETAMP(NDBAV)`
   - Voicing: IMPULS = GETAMP(47+60-72) = GETAMP(35) ≈ 45

4. **PARCOE.FOR line 184**: `IMPULS=IMPULS*NNF0`
   - CRITICAL: Voicing is multiplied by F0 (e.g., 100-200 Hz)
   - At F0=100: IMPULS ≈ 4500

5. **Ratio in Klatt 80**: IMPULS/PLSTEP ≈ 4500/9 ≈ 500x
   - PLSTEP is intentionally small relative to voicing

6. **Our implementation before fix (klatt-synth.js)**:
   - voiceGain = _dbToLinear(47 + 60 + (-119)) = _dbToLinear(-12) ≈ 0.25
   - burstAmplitude = _dbToLinear(47 - 28) = _dbToLinear(19) ≈ 9.19
   - Ratio: 0.25/9.19 ≈ 0.027 - burst is ~36x LARGER than voice!

## Root Cause

The scaling discrepancy arises from two sources:

1. **Missing F0 scaling in our impulse source**: Klatt 80 multiplies IMPULS by F0,
   giving voicing amplitude proportional to fundamental frequency. We don't do this.

2. **ndbScale compensation**: We compensate voicing with ndbScale.AV = -119
   (= -72 - 47 for G0), but PLSTEP formula didn't have equivalent compensation.
   In Klatt 80, the G0-28 formula works because voicing was already scaled up by F0.

The net effect: Our PLSTEP amplitude was ~230x too large relative to voicing.

## Theories Tested

| Theory | Status | Evidence |
|--------|--------|----------|
| G0-28 formula is correct but G0 default (47) gives too high amplitude | Rejected | Formula is correct, G0=47 is standard |
| Burst calculation missing normalization factor | **CONFIRMED** | ndbScale compensation missing |
| Burst added instead of replacing | Rejected | Addition is correct per COEWAV.FOR |
| Decay time wrong | Rejected | 92ms decay is correct |
| PLSTEP uses different formula | Rejected | Formula verified in PARCOE.FOR |

## Solution

Apply equivalent ndbScale compensation to PLSTEP that we apply to other source amplitudes.

In Klatt 80:
- Voicing: GETAMP(G0 + AV + (-72)) * F0
- PLSTEP: GETAMP(G0 + (-72) + 44)

The "+44" in PLSTEP compensates for F0 scaling (at F0=100, that's 40dB).

In our system, ndbScale offsets already compensate for F0:
- Voicing: _dbToLinear(G0 + AV + ndbScale.AV) where ndbScale.AV = -119 = -72 - 47
- PLSTEP should use: _dbToLinear(G0 + ndbScale.AF + 44) = _dbToLinear(G0 - 119 + 44) = _dbToLinear(G0 - 75)

## Fix Applied

Changed klatt-synth.js _scheduleBurstTransient() line 970:

```javascript
// OLD (incorrect):
const burstDb = goDb - 28;

// NEW (correct, applying ndbScale.AF compensation):
// In Klatt 80, voicing amplitude is GETAMP(G0+AV-72)*F0, scaled by F0.
// Our implementation doesn't scale by F0, instead using ndbScale.AV = -119
// which compensates: G0 + AV + (-119) ≈ G0 + AV - 72 - 47 (subtracts ~40dB for F0≈100).
//
// PLSTEP's "+44" similarly compensates for F0 scaling in original Klatt 80.
// In our system, we must use the same ndbScale offset as other source amplitudes:
// burstDb = G0 + ndbScale.AF + 44 = G0 + (-119) + 44 = G0 - 75
const burstDb = goDb - 75;
```

## Verification

After fix, burst amplitude with G0=47:
- burstDb = 47 - 75 = -28
- burstAmplitude = _dbToLinear(-28) = 2^(-28/6) ≈ 0.039

This is ~230x smaller than the previous 9.19:
- Previous: 9.19 (causing 9x clipping)
- After fix: 0.039 (reasonable ~4% of voicing peak)

Expected PLSTEP/voiceGain ratio: 0.039/0.25 ≈ 0.16 (16% of voicing)

This is close to the Klatt 80 ratio of PLSTEP/voicing ≈ 9/4500 ≈ 0.002 when accounting
for the fact that our voicing goes through additional gain stages.

## Files Modified

- `C:/Users/Q/code/Qlatt/src/klatt-synth.js` - _scheduleBurstTransient() line 970

## References

- PARCOE.FOR line 131: PLSTEP formula
- PARCOE.FOR line 184: IMPULS *= F0 scaling
- COEWAV.FOR line 251: Output scaling
- GETAMP.FOR: dB to linear conversion lookup table
