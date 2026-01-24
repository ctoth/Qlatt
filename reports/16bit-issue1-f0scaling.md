# Investigation: F0 Amplitude Scaling (IMPULS*NNF0)

## Summary

Klatt 80 multiplies the glottal impulse amplitude by the fundamental frequency (F0). Our implementation does NOT do this. However, this scaling is primarily relevant for the original 16-bit integer design and is **not essential** for our floating-point implementation.

## Klatt 80 FORTRAN Analysis

From `PARCOE.FOR` lines 118-119 and 182-184:

```fortran
C     SET AMPLITUDE OF VOICING
      NDBAV=NNG0+NNAV+NDBSCA(9)
      IMPULS=GETAMP(NDBAV)
      ...
C     MAKE AMPLITUDE OF IMPULSE INCREASE WITH INCREASING F0
      IMPULS=IMPULS*NNF0
```

### What NNF0 Is

`NNF0` is the fundamental frequency in Hz (typically 80-300 Hz for speech). The parameter is stored in `I(5)` (see line 39).

### What This Scaling Does

1. **Energy Compensation**: At higher F0, there are more glottal pulses per second. Each pulse has less time to ring through the formant filters before the next pulse arrives. Without F0 scaling, higher-pitched voices would sound quieter.

2. **Physical Reality**: The glottal source generates a sequence of impulses. Total power per second = (impulse amplitude)^2 * (pulses per second). To maintain constant loudness, impulse amplitude should scale with F0.

3. **Quantization**: In the original 16-bit integer implementation, this also maximized dynamic range usage. At low F0 (80 Hz), IMPULS gets an 80x multiplier. At high F0 (300 Hz), it gets 300x. This ensures the glottal source signal uses the available integer range effectively.

## How It's Used in COEWAV.FOR

From `COEWAV.FOR` lines 116-117:

```fortran
C     SET AMPLITUDE OF NORMAL VOICING IMPULSE
      INPUT=IMPULS
```

The `IMPULS` coefficient (already multiplied by NNF0) is used directly as the input amplitude when a new glottal pulse is generated. The impulse then passes through the RGP resonator (glottal pole) which shapes it into the glottal waveform.

## klatt-syn TypeScript Comparison

The `klatt-syn` implementation (`~/src/klatt-syn/src/Klatt.ts`) does NOT implement F0 amplitude scaling either:

- Line 712: `fState.breathinessLin = dbToLin(fParms.breathinessDb);`
- Line 717: `fState.cascadeVoicingLin = dbToLin(fParms.cascadeVoicingDb);`

The voicing amplitude is computed directly from dB values without any F0 multiplication. This is consistent with our implementation.

## Our Implementation (klatt-synth.js)

From line 471:

```javascript
const voiceGain = this._dbToLinear(voiceDb + ndbScale.AV);
```

No F0 scaling is applied. The voice gain is computed purely from the AV (amplitude of voicing) parameter.

## Is This Essential?

**No, for the following reasons:**

1. **Floating-Point vs Integer**: The original F0 scaling served two purposes:
   - Energy normalization (still relevant)
   - Dynamic range optimization (NOT relevant for float)

   With 64-bit float, we have effectively unlimited dynamic range. We don't need to maximize integer utilization.

2. **Perceptual Compensation**: Modern implementations often handle pitch-loudness compensation at higher levels (e.g., in the prosody model or post-processing) rather than in the raw synthesizer.

3. **Existing Practice**: The klatt-syn reference implementation (which produces good quality speech) does not include this scaling.

4. **Simpler Model**: Without F0 scaling, the AV parameter directly controls loudness regardless of pitch. This is actually more intuitive for parameter control.

## Potential Issues Without F0 Scaling

1. **High-pitched voices may sound slightly louder**: Since pulses are closer together, their cumulative energy is higher. This is a subtle effect.

2. **Low-pitched voices may sound slightly quieter**: Fewer pulses per second means less total energy.

These effects are typically small (a few dB) and can be compensated by adjusting AV values in the TTS frontend if needed.

## Recommendation

**DO NOT implement F0 amplitude scaling.**

Rationale:
1. klatt-syn (our reference) doesn't implement it
2. Our floating-point architecture doesn't need the dynamic range optimization
3. The perceptual effect is minor and can be handled in prosody modeling if needed
4. Adding it would change the current behavior and require re-tuning parameters

If pitch-loudness issues are observed in practice, the proper fix is to adjust AV values in the prosody model based on F0, not to add a multiplicative factor in the synthesizer core.

## Alternative: Prosody-Level Compensation

If pitch-loudness normalization is desired, implement it in `tts-frontend-rules.js`:

```javascript
// Hypothetical prosody-level F0-loudness compensation
// NOT RECOMMENDED unless specific problems are observed
const f0LoudnessBoost = -0.5 * Math.log2(f0 / 100); // ~3dB quieter per octave above 100Hz
const adjustedAV = baseAV + f0LoudnessBoost;
```

This keeps the synthesizer simple and moves the compensation to where it can be tuned alongside other prosodic effects.

## Task Status

This investigation is complete. The F0 amplitude scaling from Klatt 80 is understood but not recommended for implementation.
