# Investigation: Hissing/Breathing Issues in Longer Phrases

## Problem Statement
Phrase "this is a test of the speech synthesizer" has breath all over the place, hissing sort of in and out. Everything sounds very weird.

## Facts (verified)

1. **52.5% of phrase uses SW=1 (parallel mode)** - evidence: diagnostics show 15 SW=1 events in 33 total, 1.4s of 2.67s

2. **Frication gain is 2x voice gain** - evidence: fric max 0.794 vs voice max 0.397

3. **S phoneme has AF=65 dB** - evidence: tts-frontend-rules.js, diagnostics event 3

4. **Frequent SW mode switching** - evidence: DH(1)→IH(0)→S(1)→IH(0)→Z(1)→AH(0)...

5. **ndbScale.AF = -72** - evidence: klatt-synth.js line 434 (same as AV)

6. **fricGain uses max(AF, AH) when SW=1** - evidence: klatt-synth.js line 461

## Theories (plausible)

1. **AF values too high in phoneme rules** - would explain excessive frication. Predicts: reducing AF values would reduce hissing.

2. **ndbScale.AF offset wrong** - would explain frication louder than voice. Predicts: making AF offset more negative would balance fric/voice.

3. **Noise source spectrally wrong** - frication noise may not match natural speech. Predicts: comparing with reference implementations shows different noise shaping.

4. **SW switching too abrupt** - crossfade between cascade/parallel causes audible artifacts. Predicts: smoothing transitions would reduce pumping.

5. **Parallel formant gains (A1-A6) too high for fricatives** - would explain excessive output during SW=1. Predicts: checking S/Z/SH A1-A6 values shows they're boosting too much.

6. **Frication source cutoff wrong** - fricationSource has a cutoff frequency that may be wrong. Predicts: comparing with Klatt 80 shows different spectral shaping.

## Tests Run

| Test | Hypothesis | Result | Rules Out | Supports |
|------|------------|--------|-----------|----------|
| Compare klatt-syn frication | AF too high or scaling wrong | klatt-syn uses -30dB → 0.032 linear; ours is -7dB → 0.44 linear | - | Theory 1 & 2 |

### Test 1: Compare with klatt-syn frication levels

**Calculation comparison:**

| System | dB Formula | Frication Input | Resulting dB | Linear Output |
|--------|------------|-----------------|--------------|---------------|
| klatt-syn | `10^(db/20)` | fricationDb=-30 | -30 dB | 0.032 |
| Ours | `2^(db/6)` | AF=65, scale=-72 | -7 dB | 0.44 |

**Finding: Our frication is ~14x louder than klatt-syn!**

To match klatt-syn (linear 0.032):
- Need: `2^(x/6) = 0.032` → x = -30 dB
- Currently: AF(65) + ndbScale.AF(-72) = -7 dB
- Fix option A: Reduce ndbScale.AF from -72 to -95
- Fix option B: Reduce AF values in phoneme rules (65 → 42)

### Test 2: Compare AF values with original Klatt 80

**Klatt 80 SA.DOC (Japanese /sa/ syllable):**
```
Time  AV  AF
100   0   12
130   0   15  (steady state max)
```

**Klatt 80 HA.DOC (Japanese /ha/):**
- AH max = 40 dB

**Our phoneme rules:**
- S: AF = 65 dB
- HH: AH = 55 dB (and we changed scale from -102 to -72!)

**Finding: Our AF values are 50 dB too high!**

| Parameter | Klatt 80 | Ours | Difference |
|-----------|----------|------|------------|
| S frication (AF) | 15 dB | 65 dB | +50 dB (~316x) |
| H aspiration (AH) | 40 dB | 55 dB | +15 dB (~5.6x) |

## Current Best Theory

**Theory 1 CONFIRMED**: AF/AH values in phoneme rules are dramatically too high.
- S should have AF ~15, not 65
- Other fricatives similarly inflated
- This explains the excessive hissing/breathing

The ndbScale values are correct (matching Klatt 80), but the INPUT values (AF, AH) are way too high.

## Proposed Fix

**Problem**: Reducing AF by 50 dB will make output inaudible without gain compensation.

**Solution**:
1. Add `outputGain` parameter (final multiplier after all processing)
2. Scale AF/AH values to Klatt 80 levels
3. Set outputGain to ~30 (compensate for ~50 dB reduction ≈ 316x)

This gives us:
- Correct relative levels (voice vs frication vs aspiration)
- Adjustable overall volume
- Matches Klatt 80 architecture

## Open Questions

- What AF values does klatt-syn use for S, Z, SH?
- What is the frication noise spectrum in Klatt 80?
- Are the parallel formant gains (A1-A6) set for fricatives?
- Is the cascade/parallel crossfade causing artifacts?

## Fix Applied

### Changes Made:
1. Added `outputGain` parameter to klatt-synth.js (set to 1.0)
2. Reduced AF values in tts-frontend-rules.js to Klatt 80 levels:
   - S: 65 → 15
   - Z: 55 → 5
   - SH: 63 → 13
   - ZH: 53 → 3
   - F: 58 → 8
   - V: 48 → 0
   - TH: 52 → 2
   - DH: 42 → 0
   - Stop releases: reduced ~50 dB similarly
   - Affricates: reduced ~50 dB similarly
3. Reduced AH values to Klatt 80 levels:
   - HH: 55 → 40
   - P_REL: 45 → 30
   - T_REL: 50 → 35
   - K_REL: 48 → 33

### Test Results (after fix):
| Metric | Before | After | Change |
|--------|--------|-------|--------|
| fric max | 0.794 | 0.014 | 57x quieter |
| voice max | 0.397 | 0.397 | unchanged |
| fric/voice ratio | 2:1 | 1:29 | voice now dominates |
| S AF value | 65 | 15 | matches Klatt 80 |

### Initial Problem:
outputGain=30 caused severe clipping (voice × 30 = 12, way over 1.0).
Fixed by setting outputGain=1.0 since voice levels weren't changed.

## Status

**FIX APPLIED** - awaiting user verification that hissing is reduced without clipping.
