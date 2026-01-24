# A2COR/A3COR Correction Analysis

## Summary

Klatt 80's A2COR and A3COR are frequency-dependent amplitude corrections for parallel formants F2-F6. They compensate for the natural spectral tilt of speech by boosting higher formant amplitudes when F1 and F2 are at typical vowel frequencies. **The corrections were intentionally removed from Qlatt** because they cause muting at low F1 values (stops, schwa-like sounds).

## What A2COR/A3COR Do Mathematically

From PARCOE.FOR lines 85-92:

```fortran
C     COMPUTE PARALLEL BRANCH AMPLITUDE CORRECION TO F2 DUE TO F1
      DELF1=FLOAT(NNF1)/500.
      A2COR=DELF1*DELF1
C     COMPUTE AMPLITUDE CORRECTION TO F3-5 DUE TO F1 AND F2
      DELF2=FLOAT(NNF2)/1500.
      A2SKRT=DELF2*DELF2
      A3COR=A2COR*A2SKRT
C     TAKE INTO ACCOUNT FIRST DIFF OF GLOTTAL WAVE FOR F2
      A2COR=A2COR/DELF2
```

**Decoded:**
- `DELF1 = F1 / 500` — Normalized F1 (1.0 at 500 Hz)
- `DELF2 = F2 / 1500` — Normalized F2 (1.0 at 1500 Hz)
- `A2COR = (F1/500)² / (F2/1500)` — Applied to F2 amplitude
- `A3COR = (F1/500)² × (F2/1500)²` — Applied to F3, F4, F5, F6 amplitudes

Application (lines 140-148):
```fortran
      A2P=A2COR*GETAMP(NDB)        ! F2 parallel
      A3P=A3COR*GETAMP(NDB)        ! F3 parallel
      A4P=A3COR*GETAMP(NDB)        ! F4 parallel
      A5P=A3COR*GETAMP(NDB)        ! F5 parallel
      A6P=A3COR*GETAMP(NDB)        ! F6 parallel
```

## Numerical Examples

### Typical vowel (F1=500 Hz, F2=1500 Hz):
- `DELF1 = 500/500 = 1.0`
- `DELF2 = 1500/1500 = 1.0`
- `A2COR = 1.0² / 1.0 = 1.0` (no change)
- `A3COR = 1.0² × 1.0² = 1.0` (no change)

### Low vowel (F1=700 Hz, F2=1200 Hz):
- `DELF1 = 700/500 = 1.4`
- `DELF2 = 1200/1500 = 0.8`
- `A2COR = 1.4² / 0.8 = 2.45` (+7.8 dB boost)
- `A3COR = 1.4² × 0.8² = 1.25` (+1.9 dB boost)

### Stop burst/schwa (F1=250 Hz, F2=1500 Hz):
- `DELF1 = 250/500 = 0.5`
- `DELF2 = 1500/1500 = 1.0`
- `A2COR = 0.5² / 1.0 = 0.25` (-12 dB attenuation)
- `A3COR = 0.5² × 1.0² = 0.25` (-12 dB attenuation)

### Very low F1 (F1=100 Hz, F2=1500 Hz):
- `DELF1 = 100/500 = 0.2`
- `DELF2 = 1500/1500 = 1.0`
- `A2COR = 0.2² / 1.0 = 0.04` (-28 dB attenuation)
- `A3COR = 0.2² × 1.0² = 0.04` (-28 dB attenuation)

## Why They Cause Problems at Low F1

1. **Quadratic scaling**: The F1 term is squared, causing dramatic attenuation when F1 drops below 500 Hz

2. **Stop consonant releases**: During stop releases (p/t/k/b/d/g), F1 transitions from near-zero to vowel target. At F1=100 Hz, all parallel formants are attenuated by 28 dB — effectively muted.

3. **Schwa and reduced vowels**: These have F1 around 300-400 Hz, causing 4-8 dB attenuation on parallel formants.

4. **No floor protection**: Unlike proximity corrections (which have min/max bounds), A2COR/A3COR can approach zero indefinitely.

## Purpose of A2COR/A3COR

The corrections exist to model the natural spectral envelope of speech:

1. **Spectral tilt compensation**: The glottal source has ~12 dB/octave roll-off. Higher formants need boosting to sound natural.

2. **F1 dependency**: When F1 is high (open vowels like /a/), more energy is present in the vocal tract. A2COR/A3COR boost F2+ accordingly.

3. **First-difference accounting** (line 92): The `A2COR=A2COR/DELF2` division accounts for the differentiator that precedes F2 in the parallel branch. This partially compensates the +6 dB/octave slope of differentiation.

## Current Qlatt Implementation

Qlatt (klatt-synth.js lines 553-560) applies:
- Proximity corrections (n12Cor, n23Cor, n34Cor) — kept
- dB scale offsets (ndbScale.A1 through A6) — kept
- A2COR/A3COR — **removed**

The parallel formant amplitudes are computed directly from the A1-A6 dB values without frequency-dependent scaling.

## Should Conditional Application Help?

### Possible approaches:

**Option A: Threshold guard**
```javascript
const a2cor = f1 > 300 ? Math.pow(f1/500, 2) / (f2/1500) : 1.0;
```
- Pro: Restores spectral shaping for vowels
- Con: Discontinuity at threshold, still attenuates at F1=350 Hz

**Option B: Clamped floor**
```javascript
const delf1 = Math.max(f1/500, 0.5); // floor at 250 Hz
const a2cor = delf1 * delf1 / (f2/1500);
```
- Pro: Smoother, prevents severe attenuation
- Con: Still have some muting effect at low F1

**Option C: Bypass for specific sounds**
Apply corrections only for vowels, not stops/fricatives.
- Pro: Targeted fix
- Con: Requires phoneme-level awareness in synth

**Option D: Status quo (no correction)**
Continue using dB values directly.
- Pro: No muting issues
- Con: Missing spectral shaping for natural vowel quality

## Analysis: Is A2COR/A3COR Actually Needed?

The parallel branch in Klatt is primarily used for:
1. Fricatives and aspiration (noise source)
2. Stop bursts (transient)
3. Mixed-mode voicing in some implementations

For **cascade mode** (SW=0), which handles most vowels in Qlatt:
- A2COR/A3COR are irrelevant — cascade formants have their own amplitude characteristics

For **parallel mode** (SW=1) or mixed:
- Fricatives: Don't need spectral tilt correction (noise is already broadband)
- Stop bursts: Low F1 is intentional; muting them defeats the purpose
- Voicing: If voicing goes through parallel (SW=1), corrections might help

**Key insight**: Qlatt uses cascade for vowels, so A2COR/A3COR would only matter for:
- Parallel voicing (rare in current implementation)
- Fricative/stop formant shaping (where low F1 is common and muting is harmful)

## Recommendation

**Keep A2COR/A3COR removed.**

Rationale:
1. Cascade branch handles vowel spectral shaping naturally
2. Parallel branch is used for noise/transients where low F1 is common
3. The muting problem is worse than the missing spectral shaping
4. Modern TTS can bake spectral adjustments into phoneme targets if needed

If natural vowel quality is a concern, the better fix is:
- Adjust dB targets in tts-frontend-rules.js per phoneme
- Add pre-emphasis/de-emphasis filtering at output stage
- Use LF model Rd parameter for source spectral control

**No conditional application is recommended** — the complexity isn't worth the marginal benefit.

## Related Tasks

- Issue 16 (16-bit Issue 7): Document A2COR/A3COR removal rationale — this report serves that purpose
- The current implementation is correct for the parallel branch use case

## References

- Klatt, D. H. (1980). Software for a cascade/parallel formant synthesizer. JASA 67(3), 971-995.
- PARCOE.FOR lines 85-92, 140-148
- klatt-synth.js lines 459-460 (removal comment), 553-560 (current implementation)
