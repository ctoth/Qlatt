# Investigation: "good book" Still Sounds Wrong (2025-01-23)

## Problem Statement

Phrase "good book" sounds wrong with all four symptoms:
1. Stops still sound like approximants (y-like)
2. Overall too quiet or muffled
3. Clicking/popping artifacts
4. Formant/vowel quality wrong

## Facts (verified from code review)

### Fixes Already Applied (committed)

1. **Cascade filter order** - FIXED in klatt-synth.js lines 232-240
   - Now: F6→F5→F4→F3→F2→F1→NZ→NP (matches Klatt 80)
   - Previously: F1→F2→...→F6 (wrong)

2. **Mutual exclusion** - FIXED in klatt-synth.js lines 506-514
   - When SW=0: `parallelSrcGain = 0`, `parallelDiffGain = 0`
   - Parallel voice is zeroed when cascade is active
   - Matches Klatt 80 COEWAV.FOR lines 212-225

3. **SW=1 correctly set** for stop releases (tts-frontend.js line 581)
   - stop_release type → SW=1

### Remaining Differences from Klatt 80

| Issue | Ours | Klatt 80 | Impact |
|-------|------|----------|--------|
| PLSTEP amplitude | G0-50 dB | G0-28 dB | 22 dB quieter (intentional, avoids clipping) |
| Parallel nasal input | Undifferentiated | Differentiated | MEDIUM - affects nasal sounds |
| F0 amplitude scaling | None | IMPULS * NNF0 | LOW - loudness varies with pitch |
| SINAMP (AVS) multiplier | 1x | 10x | LOW - quasi-sinusoidal voicing |
| A2COR/A3COR | Removed | Applied | LOW - intentionally removed |

### Telemetry Observations

From Q's diagnostic output for "good book":
```
Phrase: good book
Total time: 0.671s
SW=1 events: 3 (G_REL, B_REL, K_REL)
SW=1 time: 0.343s (51.1%)

Events:
0. t=0.000  SIL    SW=0
1. t=0.055  G_CL   SW=0  AV=20 AVS=20
2. t=0.080  G_REL  SW=1  AV=40 AVS=40 AF=50  ← parallel mode
3. t=0.223  UH     SW=0  AV=62            ← cascade mode
4. t=0.262  D_CL   SW=0  AV=20 AVS=20
5. t=0.307  B_CL   SW=0  AV=20 AVS=20
6. t=0.327  B_REL  SW=1  AV=40 AVS=40 AF=50  ← parallel mode
7. t=0.427  UH     SW=0  AV=62            ← cascade mode
8. t=0.487  K_CL   SW=0  AV=0
9. t=0.571  K_REL  SW=1  AH=33 AF=18      ← parallel mode
10. t=0.671 SIL    SW=0
```

**Suspicious**: PLSTEP burst times (0.991s, 1.238s, 1.482s) exceed phrase duration (0.671s)
- Likely stale telemetry from previous playback, or audio context time offset

## Theories

### T1: Mutual exclusion not working at runtime
- Code is correct but maybe browser caching old worklets?
- Or parameter scheduling race condition?
- **Test**: Force hard refresh, check console for worklet loading

### T2: Problem was misdiagnosed
- Maybe the approximant quality comes from something other than parallel voice bleeding
- Could be formant target values themselves
- **Test**: Compare formant trajectories to reference recordings

### T3: Clicking from PLSTEP implementation
- PLSTEP triggers on AF delta >= 10 (lower than Klatt 80's 49 threshold)
- May be firing at wrong times
- **Test**: Disable PLSTEP entirely, see if clicks go away

### T4: Audio graph timing issues
- Web Audio API scheduling has inherent latency
- linearRampToValueAtTime may not behave as expected for short durations
- **Test**: Use setValueAtTime instead of ramps for SW transitions

### T5: Formant bandwidths too wide
- Wide bandwidths = less resonance = quieter/muffled
- Check B1, B2, B3 values during vowels
- **Test**: Narrow bandwidths by 20%, listen for clarity

## Klatt 80 FORTRAN Reference

Key code sections verified:

### COEWAV.FOR - Cascade order (lines 178-208)
```fortran
Y6C=A6*UGLOT + ...      ! F6 first
Y5C=A5*Y6C + ...        ! then F5
...
Y1C=A1*Y2C + ...        ! then F1
YZC=ANZ*Y1C + ...       ! then nasal zero
YPC=ANP*YZC + ...       ! then nasal pole
```

### COEWAV.FOR - Mutual exclusion (lines 210-225)
```fortran
C     ZERO OUT VOICING INPUT TO PARALEL BRANCH
C     IF CASCADE BRANCH HAS BEEN USED
425   UGLOT=0.
      UGLOTL=0.
      ...
      IF (NXSW.NE.1) UGLOT1=0.    ! Zero parallel diff voice if SW≠1
```

### PARCOE.FOR - PLSTEP (lines 129-131)
```fortran
IF (NNAF-NAFLAS.LT.49) GO TO 151
PLSTEP=GETAMP(NNG0+NDBSCA(11)+44)   ! = G0 + (-72) + 44 = G0 - 28
```

## ROOT CAUSE FOUND

**BUG: `linearRampToValueAtTime` timing is backwards**

The code was using `linearRampToValueAtTime(value, atTime)` for SW-related gains.
This function ramps TO the value BY atTime - meaning the transition happens BEFORE the event!

Evidence from telemetry:
```
parallel-formant-2: max rms=0.022700 @0.070s G_CL   ← SW=0, should be silent!
cascade-out: max rms=0.068866 @0.211s G_REL        ← SW=1, should be silent!
```

- At 0.070s during G_CL (SW=0), parallel formants had signal
- At 0.211s during G_REL (SW=1), cascade had signal

The ramps were:
- G_CL→G_REL: parallelSrcGain ramping UP during G_CL (before G_REL starts)
- G_REL→UH: cascadeOutGain ramping UP during G_REL (before UH starts)

**FIX APPLIED**:
Changed SW-related gains to use `setValueAtTime` instead of `linearRampToValueAtTime`:
- `parallelSourceGain.gain.setValueAtTime(...)` (line 516)
- `parallelDiffGain.gain.setValueAtTime(...)` (line 517)
- `parallelOutGain.gain.setValueAtTime(...)` (line 723)
- `cascadeOutGain.gain.setValueAtTime(...)` (line 724)

## SECOND BUG FOUND: Nasal Zero/Pole Defaults Blocking Cascade Signal

**Symptom**: After timing fix, cascade-out showed only 0.003902 RMS while cascade formants showed 0.158 RMS.
That's a 40x signal loss in the NZ/NP stage.

**Root Cause**: Our defaults for nasal parameters were:
```javascript
FNZ: 0, BNZ: 0, FNP: 0, BNP: 0  // WRONG!
```

Klatt 80 defaults (from PARAM.DOC):
```
FNZ = 250 Hz, BNZ = 100 Hz
FNP = 250 Hz, BNP = 100 Hz
```

When FNZ=FNP and BNZ=BNP, the zero and pole are at the same frequency - they **cancel out**
and signal passes through unchanged. This is correct for non-nasal sounds.

When f=0 and bw=0, the resonator has degenerate filter coefficients that block or destroy
the signal.

**FIX APPLIED**:
1. `src/klatt-synth.js` lines 49-52: Default FNZ=FNP=250, BNZ=BNP=100
2. `src/tts-frontend-rules.js` lines 22-25: BASE_PARAMS uses FNZ=FNP=250, BNZ=BNP=100
3. Removed explicit `FNP: 0, FNZ: 0` from CH and JH affricates (now inherit defaults)

## THIRD BUG FOUND: parallelFricGain Ramp Timing

**Symptom**: After nasal fix, diagnostics still showed:
```
!! parallel-formant-2 max @0.073s during G_CL (SW=0, expected cascade-only)
```

**Root Cause**: `parallelFricGain` was still using `linearRampToValueAtTime`.

Signal path for parallel-formants 2-6:
- `parallelDiffSum` feeds formants 2-6
- `parallelDiffSum` receives from `parallelDiffGain` + `parallelFricGain`
- We fixed `parallelDiffGain` to use setValueAtTime
- But `parallelFricGain` was still ramping

Timeline:
- t=0.055 (G_CL): AF=0, fricGain ≈ 0.000251
- t=0.080 (G_REL): AF=50, fricGain ≈ 0.079

With ramps, at t=0.070 (during G_CL), fricGain was already ~0.047 (ramping toward G_REL value).
The frication source runs constantly, so signal bled through before G_REL.

**FIX APPLIED**:
`src/klatt-synth.js` line 525: Changed `parallelFricGain` from `_scheduleAudioParam` to `setValueAtTime`

## Session 2: Continued Investigation (2025-01-24)

### RGP Investigation (NOT a bug)

Initially suspected RGP (glottal pole resonator) was blocking signal because telemetry showed:
```
rgp: f=0.0 bw=0.0
```

**Finding**: This is NOT a bug. The WASM resonator has bypass logic:
- When `bw <= 0`, `bypass = true`
- In bypass mode, `output = input * gain` (passthrough)

So rgpBandwidth=0 means RGP passes signal through unchanged. This matches Klatt 80 where FGP=0 is the default.

Signal path: `lfSource → rgp (bypass) → voiceGain → mixer → cascade → NZ → NP → cascadeOutGain → outputSum`

### NZ/NP Fix Verification

The diagnostics sample showing `nz: f=0.0 bw=0.0` was from BEFORE the nasal defaults fix.

**Verification of fix implementation:**
1. `klatt-synth.js` defaults (lines 49-52): FNZ=250, BNZ=100, FNP=250, BNP=100 ✓
2. `tts-frontend-rules.js` BASE_PARAMS (lines 22-25): FNZ=250, FNP=250, BNZ=100, BNP=100 ✓
3. `fillDefaultParams` spreads BASE_PARAMS into every event ✓
4. `_applyKlattParams` schedules FNZ/FNP/BNZ/BNP values ✓

**Mathematical confirmation**: When FNZ=FNP and BNZ=BNP, the antiresonator (notch) and resonator (peak) at the same frequency should mathematically cancel:
- Antiresonator: H_zero(z) = (1 - b·z⁻¹ - c·z⁻²) / a
- Resonator: H_pole(z) = a / (1 - b·z⁻¹ - c·z⁻²)
- Cascade: H_zero × H_pole = 1 (unity gain passthrough)

### voiceParGain Dead Code

Found that `voiceParGain` (computed from AVS) is defined but never used:
```javascript
const voiceParGain = this._dbToLinear(voiceParDb + ndbScale.AVS) * parallelScale;
// ^ Computed but never applied to any node!
```

This is missing functionality from Klatt 80 (separate quasi-sinusoidal voicing for parallel branch), but NOT the cause of the cascade-out issue.

### Next Steps

1. **CRITICAL: Get fresh diagnostics** - The previous diagnostics were from before fixes. Need to verify:
   - `nz: f=[250-250] bw=[100-100]`
   - `np: f=[250-250] bw=[100-100]`
   - `cascade-out: max rms` should be during UH (SW=0), not during G_REL (SW=1)

2. **If NZ/NP still show f=0 bw=0**: Check if there's a browser caching issue with worklet code

3. **If cascade-out still near zero with correct NZ/NP values**: Signal is being lost elsewhere, investigate:
   - Cascade formant coefficient calculations
   - Actual input signal to cascade (verify lfSource is active)

## Session 3: Parallel Formant Amplitude Bug (2025-01-24)

### Problem
After all timing fixes were verified working (fresh diagnostics confirmed NZ/NP=250/100, cascade-out peaks during UH), "good book" still sounds wrong - stops sound like approximants.

### Root Cause Found: Incorrect A1/A2 Values for Voiced Stops

Comparing our tts-frontend-rules.js against Klatt 1980 Table III "Plosive Bursts":

| Stop | Klatt 80 A2 | Ours A1 | Ours A2 |
|------|-------------|---------|---------|
| /b/  | 0           | 60      | 52      |
| /d/  | 0           | 58      | 56      |
| /g/  | 0           | 58      | 55      |

**Klatt 1980 specifies A2=0 for ALL plosive bursts!**

- **Labials (/b/, /p/)**: Use ONLY bypass path (AB=63), no parallel formants at all
- **Dentals (/d/, /t/)**: Use A3-A6 only, A2=0
- **Velars (/g/, /k/)**: Use A3-A6 only, A2=0

Our voiced stops had non-zero A1 and A2 values, adding low-frequency formant content
to the burst. This makes stops sound vowel-like (approximants) instead of noise-like (plosives).

### Fix Applied

Removed A1 and A2 from all voiced stop releases:

```javascript
// BEFORE (wrong):
B_REL: { A1: 60, A2: 52, A3: 45, A4: 40, AB: 63 }
D_REL: { A1: 58, A2: 56, A3: 47, A4: 60, A5: 62, A6: 60 }
G_REL: { A1: 58, A2: 55, A3: 53, A4: 43, A5: 45, A6: 45 }

// AFTER (matches Klatt 80 Table III):
B_REL: { AB: 63 }  // Only bypass, no parallel formants
D_REL: { A3: 47, A4: 60, A5: 62, A6: 60 }  // A3-A6 only
G_REL: { A3: 53, A4: 43, A5: 45, A6: 45 }  // A3-A6 only
```

### Voiceless Stops Already Correct

Our P_REL, T_REL, K_REL values matched Klatt 80 Table III:
- P_REL: AB=63 only (correct)
- T_REL: A3=30, A4=45, A5=57, A6=63 (correct)
- K_REL: A3=53, A4=43, A5=45, A6=45 (correct)

### Physical Acoustics Explanation

From Zue (1976) thesis:
- Labial bursts have no distinct spectral peak - flat spectrum through lips
- Dental bursts have high-frequency energy (3-4 kHz) - burst at alveolar ridge
- Velar bursts have mid-frequency peaks that vary with vowel context

The A1/A2 parameters add resonance at F1/F2 frequencies (200-2000 Hz). For plosive
bursts, this low-frequency energy should NOT be present - it's characteristic of
vowels and approximants, not consonant bursts.

## Session 4: VOT Duration Bug (2025-01-24)

### Problem
After fixing A1/A2 values, sound still not right. Diagnostics showed:
- G_REL at 0.080s with SW=1
- UH at 0.223s with SW=0
- **SW=1 duration: 143ms** when VOT for /g/ should be ~38ms (Zue 1976)

The parallel mode (burst) was persisting 4x too long, causing voicing to go through
the parallel branch instead of cascade.

### Root Cause
Event timing: SW is set per-phoneme type and persists until the next event.
For voiced stops, the release-to-vowel interval includes:
1. Burst (~25ms) - should be parallel (SW=1)
2. Voice onset (~25ms) - should be cascade (SW=0)
3. Formant transition - should be cascade (SW=0)

But we were keeping SW=1 for the entire interval.

### Fix Applied
Added VOT transition events after voiced stop releases (tts-frontend.js):

1. Created `VOT_MS` lookup table with Zue 1976 values:
   - B_REL: 17ms (labial)
   - D_REL: 23ms (alveolar)
   - G_REL: 38ms (velar)

2. Modified `insertStopReleases()` to insert VOT transition events
   after voiced releases

3. Added VOT transition handling in param filling:
   - Sets AF=0 (frication ends)
   - Keeps AV/AVS for voicing
   - Type is "vot_transition" → SW=0 (cascade mode)

New event sequence for "good":
- G_CL: SW=0 (closure)
- G_REL: SW=1 (burst, ~25ms)
- G_REL_VOT: SW=0 (voice onset, ~38ms) ← NEW
- UH: SW=0 (vowel)

## Related Files

- `src/klatt-synth.js` - Main synthesizer implementation
- `src/tts-frontend.js` - TTS pipeline, SW assignment, VOT transitions
- `src/tts-frontend-rules.js` - Phoneme targets
- `investigations/klatt-synth-audit.md` - Previous comprehensive audit
- `~/src/klatt80/COEWAV.FOR` - Klatt 80 waveform generation
- `~/src/klatt80/PARCOE.FOR` - Klatt 80 parameter conversion
- `papers/Klatt_1980_CascadeParallelFormantSynthesizer/notes.md` - Table III reference
- `papers/Zue_1976_StopConsonantAcoustics/notes.md` - Burst spectral characteristics, VOT values
