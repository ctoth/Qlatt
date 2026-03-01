# Investigation: Parallel Branch Silent for /h/ and Fricatives

## Problem Statement
The parallel branch produces near-zero output (RMS ~0.0003) even when SW=1 (parallel mode).
This causes /h/ and fricatives to be inaudible or very quiet.

## Facts (verified)

1. **HH phoneme has SW=1, AVS=0, AF=0** - evidence: diagnostics output shows `t=0.080 HH F0=0.0 AV=0.0 AVS=0.0 AF=0.0 SW=1`

2. **Parallel formants DO receive signal during HH** - evidence: telemetry shows `parallel-formant-4: max rms=0.019 @0.099s HH`

3. **Parallel-out is near zero** - evidence: `parallel-out: max rms=0.000359`

4. **parallelSourceGain is controlled by voiceParGain** - evidence: line 486 `this._scheduleAudioParam(this.nodes.parallelSourceGain.gain, voiceParGain, atTime, ramp);`

5. **voiceParGain is derived from AVS (quasi-sinusoidal voicing)** - evidence: line 458-459 `voiceParGain = this._dbToLinear(voiceParDb + ndbScale.AVS) * 10 * parallelScale` where voiceParDb comes from AVS parameter

6. **For HH, AVS=0 so voiceParGain ≈ 0.016** - evidence: `_dbToLinear(0 + (-44)) * 10 = 2^(-44/6) * 10 ≈ 0.0157`

7. **Aspiration (AH) is the intended source for /h/** - evidence: Klatt 1980 paper describes /h/ as aspiration noise shaped by formants

8. **Mixer now receives aspiration** - evidence: routing fix connected mixer → parallelSourceGain (line 230)

## Theories (plausible)

1. **parallelSourceGain attenuates aspiration** - would explain why signal reaches parallel formants but output is tiny. Predicts: setting parallelSourceGain=1.0 for SW=1 would restore output.

2. **Per-formant gains (A1-A6) are too low** - would explain weak output. Predicts: A1-A6 values during HH are near zero.

3. **parallelSum → parallelOutGain path is broken** - would explain signal in formants but not in output. Predicts: parallelOutGain.gain is near zero.

4. **Klatt architecture mismatch** - the current design uses AVS-based pre-gain which doesn't match Klatt 80's per-formant gain architecture. Predicts: removing parallelSourceGain attenuation and relying on A1-A6 would match reference.

## Tests Run

| Test | Hypothesis | Result | Rules Out | Supports |
|------|------------|--------|-----------|----------|
| Check parallel formant RMS | Signal reaches formants | formants have ~0.02 RMS during HH | Theory 3 (path not broken) | Theory 1 (attenuation upstream) |
| Check voiceParGain calculation | AVS=0 causes low gain | voiceParGain ≈ 0.016 for HH | - | Theory 1, Theory 4 |
| Check parallelOutGain | Output gain is zero | mix=0.6-1.0, so gain should be okay | Theory 3 | Theory 1 |

## Current Best Theory

**Theory 1 + Theory 4 combined**: The parallelSourceGain node attenuates the input signal by AVS-derived gain (~0.016 for /h/), but this doesn't match Klatt 80 architecture. In original Klatt:
- The parallel branch source is voice+aspiration mixed
- The SW switch selects cascade vs parallel output
- Per-formant gains (A1-A6) control parallel formant amplitudes
- There is NO pre-formant voice-amplitude gate

The fix: When SW=1 (parallel mode), parallelSourceGain should be 1.0, letting A1-A6 control the output levels.

## Open Questions

- What should parallelSourceGain be when SW=0 (cascade mode)? Probably still low to avoid parallel leakage.
- Should parallelDiffGain also be adjusted for SW=1?

## Test Log

### Test 1: Set parallelSourceGain=1.0 when SW=1
**Hypothesis**: Theory 1 - parallelSourceGain attenuating signal
**Action**: Modified line 486-492 in klatt-synth.js to use `parallelSrcGain = allParallel ? 1.0 : voiceParGain`
**Result**: parallel-out STILL near zero (0.000010, actually worse than before!)
**Rules out**: parallelSourceGain is not the only bottleneck
**Supports**: There's another issue upstream or in formant gains

### Test 2: Check HH phoneme AH value
**Hypothesis**: Maybe AH isn't set for HH
**Action**: Read tts-frontend-rules.js line 551-566
**Result**: HH has `AH: 55` which should be non-zero aspiration
**Finding**: The phoneme rules ARE setting AH=55 for HH

### Test 3: Check aspiration gain in diagnostics
**Hypothesis**: AH=55 should result in meaningful aspiration gain
**Action**: Look at diagnostics output
**Result**: `asp 0.000000 - 0.004385` - aspiration gain max is only 0.004!
**Finding**: Despite AH=55 in rules, the actual aspiration gain is near zero

## New Facts (verified)

9. **HH phoneme rules specify AH=55** - evidence: tts-frontend-rules.js line 560

10. **Actual aspiration gain during playback is near zero (0.004)** - evidence: diagnostics `asp 0.000000 - 0.004385`

11. **There's a disconnect between AH=55 in rules and actual aspGain** - this is the new mystery

## Updated Theories

5. **AH is not being passed through track scheduling** - would explain why AH=55 in rules but aspGain=0.004 in output. Predicts: tracking AH through the pipeline will show it gets lost or miscalculated.

6. **ndbScale.AH offset is too aggressive** - line 430 shows `AH: -102`. So aspGain = _dbToLinear(55 + (-102)) = _dbToLinear(-47) ≈ 0.004. This EXACTLY matches the observed 0.004!

## Current Best Theory

**Theory 6**: The ndbScale.AH value of -102 is making aspiration way too quiet.
- AH=55 dB input
- ndbScale.AH = -102 offset
- Net: 55 + (-102) = -47 dB
- Linear: 2^(-47/6) ≈ 0.004

This perfectly explains the 0.004 aspiration gain!

### Test 4: Verify AH value reaches track
**Hypothesis**: Theory 6 - AH=55 should be in track, but ndbScale.AH=-102 makes it quiet
**Action**: Added AH to diagnostic display, ran diagnostics
**Result**: `1. t=0.080 HH F0=0.0 AV=0.0 AVS=0.0 AH=55.0 AF=0.0 SW=1`
**Finding**: AH=55 IS in the track! Theory 6 CONFIRMED.

Calculation verification:
- AH = 55 dB
- ndbScale.AH = -102
- aspGain = _dbToLinear(55 + (-102)) = _dbToLinear(-47) = 2^(-47/6) = 0.00397
- Observed aspGain max = 0.004385 ✓ MATCHES!

Compare with other scales:
- AV: ndbScale = -72, so AV=57 → _dbToLinear(57-72) = _dbToLinear(-15) = 0.177 (reasonable)
- AH: ndbScale = -102, so AH=55 → _dbToLinear(55-102) = _dbToLinear(-47) = 0.004 (44x quieter!)

## Confirmed Root Cause

**ndbScale.AH = -102 is 30 dB too aggressive compared to AV (-72).**

This makes aspiration 44x quieter than voicing for similar dB input values.
The /h/ sound relies on aspiration, so it's nearly inaudible.

## Fix

Change ndbScale.AH from -102 to -72 (matching AV and AF).

### Test 5: Verify aspiration gain after AH scale fix
**Hypothesis**: AH scale change should increase aspiration gain
**Action**: Changed ndbScale.AH from -102 to -72 in both klatt-synth.js and test-harness.html
**Result**: asp gain increased from 0.004 to 0.140 (35x increase)
**Finding**: AH scale fix works, but parallel-out still near-zero (0.0005)

### Test 6: Check parallel formant gains (A1-A6) for HH
**Hypothesis**: A1-A6 might be unset for HH
**Action**: Read tts-frontend-rules.js HH definition
**Result**: HH does NOT set A1-A6. DEFAULT_PARAMS has A1-A6 = 0.
**Finding**: Parallel formant gains are 0 for HH, blocking output even with good source signal

## New Facts (verified)

12. **HH is type="fricative" which triggers SW=1** - evidence: tts-frontend.js lines 564-568

13. **HH doesn't set A1-A6** - evidence: tts-frontend-rules.js lines 551-566

14. **DEFAULT_PARAMS has A1-A6 = 0** - evidence: tts-frontend-rules.js lines 25-30

15. **Other SW=1 phonemes (T_REL, K_REL) set A3-A6** - evidence: lines 781-784, 798-801

## Updated Root Cause

Two issues combined:
1. ✓ FIXED: ndbScale.AH = -102 was too aggressive
2. **REMAINING**: HH lacks A1-A6 values, so parallel formant gains are 0

### Test 7: Add A1-A6 to HH and test
**Hypothesis**: Adding A1-A6 should enable parallel output for HH
**Action**: Added A1=30, A2=35, A3=40, A4=45, A5=50, A6=50 to HH definition
**Result**:
- Parallel formants now show significant signal (0.12-0.17 RMS during HH)
- parallel-out improves across plays:
  - First play: 0.000007 (near zero)
  - Second play: 0.001153
  - Third play: 0.018305 @HH (success!)
**Finding**: Fix works, but reveals first-play initialization issue (same as original bug)

## Summary of Fixes Applied

1. ✓ **Routing fix**: N.mixer → parallelSourceGain (instead of N.rgp)
2. ✓ **SW=1 gain fix**: parallelSourceGain = 1.0 when SW=1
3. ✓ **AH scale fix**: ndbScale.AH changed from -102 to -72
4. ✓ **HH A1-A6 fix**: Added parallel formant gains to HH phoneme

## Remaining Issue

First-play initialization still shows weak parallel output. This is the same "first play sounds weird" bug that existed before. The filters/gains need warm-up time.

## Committed

`341fe0d Fix parallel branch for aspiration and fricatives`

---

# New Issue: Hissing/Breathing with Longer Phrases

## Symptom
"this is a test of the speech synthesizer" - breath all over the place, hissing in and out

## Diagnostics from Longer Phrase

```
Events: 33, Total time: 2.672s
SW=1 events: 15 | SW=1 time: 52.5%

Gains (linear):
voice: 0.000 - 0.397
asp:   0.000 - 0.079
fric:  0.000 - 0.794  <-- VERY HIGH

Event switching pattern:
DH(SW=1) → IH(SW=0) → S(SW=1) → IH(SW=0) → Z(SW=1) → AH(SW=0)...
```

## Potential Causes

1. **Frication too loud**: fric gain (0.79) is 2x voice gain (0.40)
   - ndbScale.AF = -72, same as AV
   - But S has AF=65 vs AV typically 57-63

2. **Frequent mode switching**: 15 SW transitions in 33 events
   - Each switch crossfades cascade↔parallel
   - Could cause audible pumping/breathing

3. **Noise source characteristics**: May not match natural speech spectrally

4. **Aspiration bleeding**: When SW=1, `fricGain = max(AF, AH)` - could boost unintentionally

## Next Investigation Steps

- Compare frication levels with reference implementations (klatt80, klatt-syn)
- Check if noise source spectral shape is correct
- Analyze whether SW switching needs smoothing
- Consider if cascade/parallel mix strategy matches Klatt 80
