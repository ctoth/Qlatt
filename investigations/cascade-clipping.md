# Investigation: Why Does SW=0 for Voiced Stops Cause Clipping?

## Facts (verified)

1. **Current SW logic** (tts-frontend.js:577-582):
   - All `stop_release` types use SW=1 (parallel branch)
   - The proposed fix: only voiceless stop_releases use SW=1
   - Result: voiced stop releases (G_REL, B_REL, D_REL) would use SW=0 (cascade)

2. **G_REL parameters** (tts-frontend-rules.js:847-864):
   ```javascript
   G_REL: {
     F1: 200,      // Very low formant
     F2: 1990,
     F3: 2850,
     B1: 60,       // Narrow bandwidth
     B2: 150,
     B3: 280,
     AV: 40,
     AF: 0,
     AVS: 40,
     // A3-A6 parallel amplitudes also defined
   }
   ```

3. **UH1 (vowel) parameters** for comparison (tts-frontend-rules.js:151-163):
   ```javascript
   UH1: {
     F1: 440,
     F2: 1020,
     F3: 2240,
     B1: 65,
     B2: 110,
     B3: 140,
     AV: 62,
   }
   ```

4. **Cascade branch signal path** (klatt-synth.js:216-228):
   ```
   mixer -> nz (antiresonator) -> np (nasal pole) -> R1 -> R2 -> R3 -> R4 -> R5 -> R6 -> cascadeOutGain
   ```
   Six resonators in series, each can amplify at its resonance frequency.

5. **Parallel branch signal path** (klatt-synth.js:237-247):
   Each formant has independent amplitude control (A1-A6) with heavy dB offsets (-58 to -80).

6. **Voice gain calculation for cascade** (klatt-synth.js:459):
   ```javascript
   const voiceGain = this._dbToLinear(voiceDb + ndbScale.AV);
   // For G_REL: _dbToLinear(40 + (-72)) = _dbToLinear(-32) = 0.024
   // For UH1:   _dbToLinear(62 + (-72)) = _dbToLinear(-10) = 0.315
   ```

## Theories (plausible)

### Theory A: Low F1 + Cascade Resonator Gain Amplification (LIKELY)
G_REL has F1=200 Hz, which is much lower than typical vowels (440-700 Hz). When the cascade branch processes this:
- Each resonator in cascade has gain ~1/bandwidth at center frequency
- Low F1 with narrow B1 (60 Hz) creates a high-Q peak
- The **six resonators in series** can compound this amplification
- Vowels have higher F1 and the energy distribution is different

**Prediction:** If we raised G_REL's F1 or widened B1, clipping would reduce.

### Theory B: Missing Parallel Amplitude Attenuation in Cascade
The parallel branch uses ndbScale offsets (-58 to -80 dB for A1-A6) to prevent each formant from being too loud. The cascade branch doesn't have per-formant attenuation - it relies only on the single AV gain.

**Prediction:** The cascade branch lacks the compensating attenuation that parallel branch has.

### Theory C: B_REL/D_REL/G_REL F1 Values Are Stop-Closure Values
Looking at the F1 values:
- G_REL F1: 200 Hz
- D_REL F1: 200 Hz
- B_REL F1: 200 Hz
- G_CL F1: 200 Hz (closure!)

The release phonemes have F1=200, which matches closure position! During release, F1 should **transition from closure (~200) to vowel (~400-700)**, not stay at 200.

**Prediction:** The static F1=200 during the entire release segment causes cascade to resonate strongly at 200 Hz.

### Theory D: No Proximity Correction for Cascade
The parallel branch has n12Cor, n23Cor, n34Cor corrections (klatt-synth.js:449-457) that reduce gain when formants are close. Cascade branch doesn't have this - it just passes through all resonators.

With G_REL's formant spacing, there may be formant interaction the cascade doesn't compensate for.

## Tests Run

| Test | Hypothesis | Result | Rules Out | Supports |
|------|------------|--------|-----------|----------|
| Code analysis | Find gain path differences | Cascade has 6 resonators in series | - | A, B |
| Parameter comparison | Compare G_REL vs UH1 | G_REL F1=200 vs UH1 F1=440 | - | A, C |
| ndbScale analysis | Check attenuation differences | Parallel has -58 to -80 dB per formant | - | B |

## Current Best Theory

**Theory A + C combined:** The root cause is that **G_REL has F1=200 Hz (closure position)** being processed through the **cascade's 6 resonators in series**.

The cascade branch amplifies at each resonant frequency. With a very low F1 (200 Hz) and narrow B1 (60 Hz), the first resonator creates a strong peak. This gets compounded through subsequent resonators.

Vowels work fine because:
1. Higher F1 values (400-700 Hz) spread energy differently
2. Wider bandwidths reduce peak gain
3. The formant positions are naturally spaced for speech

Voiced stop releases don't work because:
1. F1=200 Hz is at the closure position (should transition)
2. The entire 20-25ms release segment uses this low F1
3. Cascade amplifies this strongly

## Root Cause

**The voiced stop release targets (B_REL, D_REL, G_REL) use F1=200 Hz, which is appropriate for the moment of release but NOT for the entire release segment.**

When routed through cascade:
1. Low F1 + narrow B1 = high-Q resonance
2. Six resonators in series = compounded gain
3. No per-formant attenuation like parallel has
4. Result: excessive low-frequency energy = clipping

## Open Questions

1. Should voiced stop releases use parallel branch (current behavior) or should their F1 values transition from closure to vowel target?
2. Would adding cascade gain compensation fix this without changing branch routing?
3. Is the parallel branch actually the correct choice for voiced stops per Klatt 80 spec?

## Proposed Fixes

### Fix A: Keep Current Behavior (Recommended Short-Term)
Keep all stop_releases on parallel branch (SW=1). The parallel branch has:
- Independent amplitude control per formant
- Heavy attenuation via ndbScale
- No resonator cascade amplification

This is why the current code works.

### Fix B: Add F1 Transition to Voiced Releases
Instead of static F1=200, have the release transition from closure F1 to the following vowel's F1. This would make cascade viable but requires:
- Coarticulation logic
- Per-frame interpolation

### Fix C: Add Cascade Gain Compensation
Add attenuation before or after cascade to match parallel branch levels. Would require:
- Measuring actual cascade gain for various formant configurations
- Adding compensation factor to cascadeOutGain

## Conclusion

**Do NOT route voiced stop releases to cascade branch** without first fixing the F1=200 Hz static values or adding cascade gain compensation.

The parallel branch is working as intended for stop releases because it has individual formant amplitude control that prevents the cascading gain problem.
