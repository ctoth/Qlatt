# Investigation: Stop Consonants Sound Wrong

## Problem Statement
"good book" (phonemes: `G UH1 D` + `B UH1 K`) sounds terrible:
- Sounds like "yoo... something then f hiss"
- Stop consonants (G, B, K, D) don't sound like stops
- K at end sounds like "f hiss" (fricative?)

## Facts (verified)

1. **G2P is correct** - "good" = `G UH1 D`, "book" = `B UH1 K`
   - Evidence: CMU dictionary lookup in tts-frontend.js

2. **Stops are converted to closure+release pairs** - G -> G_CL + G_REL
   - Evidence: tts-frontend.js line 413-415 maps P/T/K/B/D/G to _CL variants
   - Evidence: insertStopReleases() adds _REL after each _CL (line 341-381)

3. **Stop releases use SW=1 (parallel branch)** - stop_release type triggers parallel mode
   - Evidence: tts-frontend.js line 577-581: `ph.type === "stop_release"` -> `ph.params.SW = 1`

4. **Current stop closure parameters (from PHONEME_TARGETS)**:
   | Stop | AV | AVS | AF | AH | dur |
   |------|-----|-----|-----|-----|-----|
   | G_CL | 20 | 20 | 0 | 0 | 55ms |
   | B_CL | 20 | 20 | 0 | 0 | 45ms |
   | K_CL | 0 | 0 | 0 | 0 | 60ms |
   | D_CL | 20 | 20 | 0 | 0 | 35ms |

5. **Current stop release parameters**:
   | Release | AV | AVS | AF | AH | A3-A6 | dur |
   |---------|-----|-----|-----|-----|-------|-----|
   | G_REL | 40 | 40 | 0 | 0 | 53/43/45/45 | 25ms |
   | B_REL | 40 | 40 | 0 | 0 | 0/0/0/0 | 20ms |
   | K_REL | 0 | 0 | 18 | 33 | 53/43/45/45 | 60ms |
   | D_REL | 40 | 40 | 0 | 0 | 47/60/62/60 | 20ms |

6. **Voiced stop closures have AV=20, AVS=20** - attempting voiced closure (voice bar)
   - Evidence: G_CL, B_CL, D_CL all have AV: 20, AVS: 20

7. **Voiced stop releases have AV=40, AVS=40** - high voicing amplitude
   - Evidence: G_REL, B_REL, D_REL have AV: 40, AVS: 40

8. **Voiceless stop releases use AF+AH for burst/aspiration**:
   - K_REL: AF=18, AH=33 (frication burst + aspiration)
   - Evidence: tts-frontend-rules.js line 797-813

9. **Parallel branch gain structure** (from klatt-synth.js):
   - When SW=1: parallelSrcGain = 1.0 (full gain)
   - fricGain = dbToLinear(max(AF, AH) + ndbScale.AF) where ndbScale.AF = -72
   - Evidence: klatt-synth.js lines 466-468, 491-497

10. **B_REL and G_REL have AB=63 (bypass amplitude)**:
    - Evidence: B_REL has AB: 63, G_REL does NOT have AB set
    - This is inconsistent - only B_REL has bypass

## Theories (plausible)

### Theory 1: Voiced stop closures produce wrong sound (G sounds like Y)
- G_CL has AV=20, AVS=20 which produces voiced formants at F1=200, F2=1500, F3=2800
- F2=1500 for velar is too fronted, could sound like /j/ (Y)
- **Would explain**: "good" sounding like "yoo"
- **Predicts**: Reducing AV during closure and fixing F2 locus would improve

### Theory 2: Stop releases have no transient burst (just sustained sound)
- Current releases just set AF/AH to fixed values for their duration
- Real stops have:
  1. Brief silence (closure) - already have this
  2. Transient burst (few ms, high amplitude noise) - MISSING
  3. Aspiration (for voiceless) or voicing onset (for voiced)
- **Would explain**: Stops sounding mushy, no percussive quality
- **Predicts**: Adding burst transient would give stops percussive onset

### Theory 3: K_REL sounds like "f hiss" because only frication, no burst shaping
- K_REL has AF=18, AH=33, duration 60ms
- This produces 60ms of steady frication noise - sounds like sustained fricative
- Real /k/ release has:
  - 5-10ms burst localized to F2/F3 region
  - Then 30-40ms aspiration
- **Would explain**: Final K sounding like "f hiss"
- **Predicts**: Shortening AF burst, separating burst from aspiration would help

### Theory 4: Voiced stop releases using parallel branch incorrectly
- G_REL, B_REL, D_REL have SW=1 (parallel mode) because type="stop_release"
- But they have AV=40, AVS=40 (voicing) and AF=0 (no frication)
- In parallel mode with SW=1, parallelSrcGain=1.0
- **However**: Voiced stop releases should use CASCADE, not parallel
- Parallel is for frication; voiced releases need formant voicing
- **Would explain**: Voiced releases sounding wrong
- **Predicts**: Using SW=0 for voiced releases (cascade) would sound better

### Theory 5: F2 transition from closure to vowel is wrong
- G_CL has F2=1500 (velar locus)
- UH1 has F2=1020 (back vowel)
- Transition should be smooth formant movement
- Currently: abrupt jump at segment boundary
- **Would explain**: Harsh transitions, unnatural sound
- **Predicts**: Adding formant interpolation would smooth transitions

### Theory 6: Voiced closure voicing is too quiet/wrong quality
- AV=20 for voiced closures is very weak (voicing barely audible)
- Real voiced stop closures have "voice bar" - low frequency murmur
- Need strong F1 (low, ~200-300Hz) with weak higher formants
- **Would explain**: Voiced stops lacking voice bar, sounding mushy
- **Predicts**: Increasing AV, emphasizing F1 would improve voice bar

## Tests Run

| Test | Hypothesis | Result | Rules Out | Supports |
|------|------------|--------|-----------|----------|
| Examine release type handling | Theory 4: voiced releases using wrong mode | SW=1 for ALL stop_release types, including voiced | - | Theory 4 |
| Check formant settings | Theory 1: G sounds like Y | G_CL F2=1500, but Y has F2=2070 - not identical | Theory 1 partially | - |
| Check burst implementation | Theory 2/3: no burst | No burst transient, just steady-state parameters | - | Theory 2, 3 |

### Test 1: Detailed analysis of "good" synthesis path

**Expected phoneme sequence for "good":**
1. G -> G_CL (55ms, AV=20, AVS=20, F2=1500)
2. G_CL triggers G_REL insertion (25ms, AV=40, AVS=40, SW=1)
3. UH1 (110ms, AV=62, F1=440, F2=1020)
4. D -> D_CL (35ms, AV=20, AVS=20, F2=1800)
5. D_CL triggers D_REL insertion (20ms, AV=40, AVS=40, SW=1)

**Problem identified:** G_REL uses SW=1 (parallel branch) but has AV=40, AF=0.
- In parallel mode, AV doesn't directly drive the voicing
- The parallel branch expects frication (AF) or aspiration (AH) as input
- With AF=0, AH=0 but AV=40, the parallel formants are getting voiced excitation but through wrong path

### Test 2: Analysis of K_REL in "book"

**Expected phoneme sequence for "book":**
1. B -> B_CL (45ms, AV=20)
2. B_REL (20ms, AV=40, SW=1)
3. UH1 (110ms)
4. K -> K_CL (60ms, AV=0 - voiceless closure = silence)
5. K_REL (60ms, AF=18, AH=33, SW=1)

**Analysis of K_REL:**
- AF=18 means fricGain = dbToLinear(18 + (-72)) = dbToLinear(-54) = very low
- Wait, actually: `fricDbAdjusted = max(AF, AH) = max(18, 33) = 33`
- So fricGain = dbToLinear(33 + (-72)) = dbToLinear(-39) = 0.0022
- That's very quiet frication

But the A3-A6 values are high (53/43/45/45), which boost parallel formants.
- This could create audible output through the parallel formant resonators

**Question:** With low fricGain but high A3-A6, what drives the parallel formants?
Looking at klatt-synth.js signal flow:
- parallelDiffSum gets: parallelDiffGain (from voice) + parallelFricGain (from frication)
- When SW=1, parallelSrcGain = 1.0 (full voice into parallel)
- So F1 resonator gets full voice signal
- F2-F6 resonators get differentiated voice + frication

**Finding:** K_REL with AV=0 means no voice source at all. The sound comes entirely from:
- aspGain (AH=33 -> aspGain = dbToLinear(33-72) = ~0.003)
- fricGain (from max(AF,AH) = 33)

This is VERY quiet. The A3-A6 values boost relative formant levels, but the input signal is weak.

## Current Best Theory

**PRIMARY ROOT CAUSE: Theory 4 - Voiced stop releases incorrectly use parallel branch**

The fundamental issue is architectural:
- ALL stop releases (voiced and voiceless) use SW=1 (parallel branch)
- Parallel branch is designed for noise-excited sounds (fricatives, bursts)
- Voiced stop releases (G_REL, B_REL, D_REL) need VOICING, not frication
- They should use SW=0 (cascade) to properly synthesize voiced formants

**SECONDARY ROOT CAUSE: Theory 2/3 - No proper burst transient**

Stop consonants lack their characteristic percussive quality because:
- Releases just set steady-state parameters for their duration
- Real bursts are transients: very brief (5-15ms), high amplitude, broadband
- Current implementation produces sustained sounds, not transients

**TERTIARY ISSUE: Weak or wrong voicing during closures**

The "yoo" quality of G may come from:
- AV=20 is weak voicing during closure
- Formant structure during closure leaking into release
- Poor transition modeling between segments

## Proposed Fix

### Fix 1: Use cascade (SW=0) for voiced stop releases
Change tts-frontend.js line 577-581:
```javascript
const useParallel =
  ph.type === "fricative" ||
  ph.type === "affricate" ||
  (ph.type === "stop_release" && ph.voiceless);  // Only voiceless releases use parallel
```

### Fix 2: Restructure voiceless stop release timing
For K_REL, T_REL, P_REL, change from single segment to:
1. **Burst phase** (5-10ms): High AF, high A3-A6, wide bandwidth
2. **Aspiration phase** (40-50ms): High AH, gradual formant transition to vowel

This may require splitting each release into two segments in the frontend.

### Fix 3: Strengthen voiced closure voicing
For G_CL, B_CL, D_CL:
- Increase AV to 35-40 for more prominent voice bar
- Keep bandwidth wide to create muffled quality
- Consider adding very low F1 (~150-200Hz) emphasis

### Fix 4: Implement formant transitions
Add coarticulation: formant values should interpolate smoothly between segments rather than jumping abruptly.

## Verification Steps (before implementing)

1. Test SW=0 for G_REL in isolation - does it produce better /g/ release?
2. Compare Klatt 80 stop burst parameters to current settings
3. Measure actual stop burst durations in natural speech (~5-15ms)
4. Review eSpeak-ng stop implementation for reference

## Open Questions

1. What AF/AH values did Klatt 80 use for stop bursts?
2. How does klatt-syn handle stop releases?
3. Should burst transient be a separate "burst" segment type?
4. Is the formant interpolation happening at track generation time?

## Additional Test: Analyzing Parallel Formant Gains

After examining klatt-synth.js more carefully, I found a critical issue:

### G_REL Parallel Formant Gains

G_REL has: A1=undefined, A2=undefined, A3=53, A4=43, A5=45, A6=45

When SW=1, the parallel branch uses A1-A6 to control formant amplitudes:
```javascript
const parallelLinear = [
  dbToLinear((A1 ?? -70) + ndbScale.A1),  // A1 undefined -> -70 + (-58) = -128dB = near zero
  dbToLinear((A2 ?? -70) + ndbScale.A2),  // A2 undefined -> -70 + (-65) = -135dB = near zero
  dbToLinear((A3 ?? -70) + ndbScale.A3),  // A3=53 -> 53 + (-73) = -20dB = audible
  dbToLinear((A4 ?? -70) + ndbScale.A4),  // A4=43 -> 43 + (-78) = -35dB = audible
  dbToLinear((A5 ?? -70) + ndbScale.A5),  // A5=45 -> 45 + (-79) = -34dB = audible
  dbToLinear((A6 ?? -70) + ndbScale.A6),  // A6=45 -> 45 + (-80) = -35dB = audible
];
```

**CRITICAL FINDING: G_REL has NO A1 or A2 set!**

This means:
- F1 (200Hz) is effectively silent
- F2 (1990Hz) is effectively silent
- Only F3-F6 produce output

For a voiced velar stop /g/, we need STRONG F1 and F2 formants! The current settings produce only high-frequency content, which sounds like weak hiss or nothing.

### B_REL Analysis

B_REL has: A1=undefined, A2=undefined, A3=undefined, A4=undefined, A5=undefined, A6=undefined, AB=63

With no A1-A6 set, the only output is through:
- AB=63 (bypass) -> dbToLinear(63 + (-84)) = -21dB
- AV=40 through voice path

The bypass lets undifferentiated signal through, but formant resonances are near-zero.

### D_REL Analysis

D_REL has: A1=undefined, A2=undefined, A3=47, A4=60, A5=62, A6=60

Similar to G_REL - no F1/F2, only F3-F6.

### K_REL Analysis (voiceless)

K_REL has: A1=undefined, A2=undefined, A3=53, A4=43, A5=45, A6=45, AF=18, AH=33

For voiceless K, frication drives the parallel branch:
- fricGain from max(AF=18, AH=33) = dbToLinear(33 + (-72)) = -39dB = very weak
- But A3-A6 boost the high frequency content

This creates a weak, high-frequency focused burst - explaining the "f hiss" quality.

## ROOT CAUSE CONFIRMED

**The fundamental problem is that voiced stop releases (G_REL, B_REL, D_REL) are missing A1 and A2 amplitude settings, and all stop releases are using SW=1 (parallel-only mode) which mutes the cascade branch.**

For voiced stops:
1. SW=1 mutes cascade (cascadeOutGain = 0)
2. A1=undefined, A2=undefined means F1/F2 parallel formants are muted
3. Result: only high-frequency (F3-F6) content, no proper vowel-like formants

For voiceless stops (K_REL):
1. SW=1 correctly uses parallel for burst
2. But A1=undefined, A2=undefined means burst has no low/mid frequency content
3. Frication input (AF/AH) is very weak after scaling
4. Result: weak, high-frequency only burst sounds like soft hiss

## Proposed Fix (Refined)

### Option A: Fix voiced releases to use cascade (SW=0)

Change tts-frontend.js to NOT use parallel for voiced stop releases:
```javascript
const useParallel =
  ph.type === "fricative" ||
  ph.type === "affricate" ||
  (ph.type === "stop_release" && ph.voiceless);  // Only voiceless
```

This would let G_REL, B_REL, D_REL use the cascade branch with AV=40.

### Option B: Add A1, A2 to voiced stop releases

Keep SW=1 but add proper parallel formant amplitudes:
```javascript
G_REL: {
  A1: 60,  // Strong F1 for voicing
  A2: 55,  // Strong F2 for formant transitions
  A3: 53,
  // ... rest unchanged
}
```

### Option C: Increase AF/AH for voiceless stop bursts

Current K_REL: AF=18, AH=33
Needed: AF=40-50, AH=45-55 (to get reasonable fricGain after -72dB offset)

### Recommended: Combination Approach

1. **Voiced releases (G_REL, B_REL, D_REL)**: Use SW=0 (cascade) - they need voiced formants
2. **Voiceless releases (K_REL, T_REL, P_REL)**: Keep SW=1 but increase AF/AH values significantly

## Summary

| Issue | Cause | Fix |
|-------|-------|-----|
| G/B/D releases sound wrong | SW=1 mutes cascade, no A1/A2 | Use SW=0 for voiced releases |
| K release sounds like "f hiss" | AF/AH too low after -72dB scale, no A1/A2 | Increase AF/AH to 40-50 dB |
| No percussive burst quality | No transient modeling | Consider adding burst segment |

## Detailed Fix Recommendations

### 1. Change SW mode for voiced stop releases

**File:** `src/tts-frontend.js`
**Line:** 577-581
**Change:**
```javascript
// Before:
const useParallel =
  ph.type === "fricative" ||
  ph.type === "affricate" ||
  ph.type === "stop_release";

// After:
const useParallel =
  ph.type === "fricative" ||
  ph.type === "affricate" ||
  (ph.type === "stop_release" && ph.voiceless);
```

This ensures voiced stop releases (G_REL, B_REL, D_REL) use cascade (SW=0).

### 2. Increase voiceless stop burst amplitudes

**File:** `src/tts-frontend-rules.js`
**Changes to K_REL, T_REL, P_REL:**

```javascript
K_REL: {
  // ...existing formants...
  AF: 50,   // was 18 - need louder burst after -72dB offset
  AH: 55,   // was 33 - need louder aspiration
  A1: 50,   // ADD - burst needs some low frequency
  A2: 50,   // ADD - burst needs mid frequency (F2 locus)
  // A3-A6 stay the same
}

T_REL: {
  AF: 52,   // was 20
  AH: 57,   // was 35
  A1: 45,
  A2: 52,
  // A3-A6 stay the same
}

P_REL: {
  AF: 47,   // was 15
  AH: 52,   // was 30
  A1: 55,   // bilabials have strong F1
  A2: 40,   // lower F2 emphasis
  // add A3-A6 similar to others
}
```

### 3. Strengthen voiced stop closure voicing (optional)

**File:** `src/tts-frontend-rules.js`
**Changes to G_CL, B_CL, D_CL:**

```javascript
G_CL: {
  // ...existing...
  AV: 35,   // was 20 - stronger voice bar
  AVS: 35,  // was 20
}
```

## Verification Plan

After implementing fixes:
1. Synthesize "good book" - G should sound like /g/, not /j/
2. Synthesize "kick" - K should have clear burst, not hiss
3. Synthesize "dad" - D should be percussive
4. Compare spectrograms with natural speech

---

*Investigation started 2026-01-21*
*Root cause identified 2026-01-21*
