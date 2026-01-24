# Issue 15: Default Parallel dB Values (-70 dB)

## Question

In `src/klatt-synth.js` `_defaultParams()`, the parallel formant amplitudes are set to -70 dB:
```javascript
AN: -70,
A1: -70,
A2: -70,
A3: -70,
A4: -70,
A5: -70,
A6: -70,
AB: -70,
```

With `ndbScale` offsets applied:
- A1: -70 + (-58) = -128 dB → cutoff (0)
- A2: -70 + (-65) = -135 dB → cutoff (0)
- etc.

**Is this intentional?**

## Investigation

### 1. How Values Flow Through the System

The `_defaultParams()` values are used in two scenarios:

**A) Direct synth use** (e.g., unit tests, direct API):
- If no Klatt frame is provided, defaults apply
- A1=-70 → A1+ndbScale.A1 = -70+(-58) = -128 dB → `_dbToLinear` returns 0
- Result: Parallel branch is **completely muted**

**B) TTS frontend use** (normal speech synthesis):
- `BASE_PARAMS` in `tts-frontend-rules.js` sets A1-A6, AN, AB to **0**
- `PHONEME_TARGETS` override with specific values for fricatives, stops, etc.
- A1=0 → A1+ndbScale.A1 = 0+(-58) = -58 dB → `_dbToLinear` returns ~0.001 (very quiet but audible)
- A5=52 (fricative /S/) → 52+(-79) = -27 dB → `_dbToLinear` returns ~0.05 (audible)

**Key insight**: The `-70` defaults are **never used in practice** for TTS because `_applyKlattParams()` uses `params.A1 ?? -70` - the `??` fallback only triggers if `params.A1` is `undefined` or `null`. When the TTS frontend provides `A1: 0`, that value is used.

### 2. Klatt 80 Design

From `PARCOE.FOR` line 137:
```fortran
NDB=NNA1+N12COR+NDBSCA(1)
A1P=GETAMP(NDB)
```

If `NNA1=0` (parameter input), then `NDB = 0 + 0 + (-58) = -58`.

Klatt 80 expects the parameter file to explicitly set A1-A6 values. There are no hardcoded "defaults" in the same sense - the parameters must be provided per frame.

### 3. klatt-syn Design

The TypeScript implementation (`~/src/klatt-syn/src/Klatt.ts`) has no default A1-A6 values. It expects `oralFormantDb: number[]` to be provided per frame in `FrameParms`. If not provided or set to `NaN`, the formant is muted.

### 4. Our Design Philosophy

The -70 dB defaults serve as **safe muting**:
- If no frame data is provided, parallel branch produces silence
- This prevents accidental noise/garbage output from uninitialized resonators
- For TTS use, the frontend always provides explicit values

This is a reasonable design choice - "fail silent" rather than "fail loud".

## The Real Issue

The investigation revealed a **non-issue** with defaults but exposed how the values are used:

| Source | A1 Value | After ndbScale | Linear Gain |
|--------|----------|----------------|-------------|
| _defaultParams() | -70 | -128 | 0 (muted) |
| BASE_PARAMS | 0 | -58 | 0.001 (very quiet) |
| Fricative /S/ A5 | 52 | -27 | 0.048 (audible) |
| Fricative /S/ A6 | 55 | -25 | 0.059 (audible) |
| /HH/ A1 | 30 | -28 | 0.044 (audible) |
| Stop B_REL A1 | 60 | 2 | 1.26 (loud) |

The `BASE_PARAMS` value of 0 produces -58 dB after offset, which is very quiet (gain ≈ 0.001). This is effectively "off" for most practical purposes. Only when phoneme targets explicitly set higher values (like S: A5=52) do the parallel formants become audible.

## Analysis

### Is -70 Intentional?

**Yes.** The -70 dB default is intentional "safe muting":
1. It ensures uninitialized synth produces silence
2. It avoids the `-72 dB cutoff` edge case (exactly -72 would be 0, but -71 would be tiny nonzero)
3. The `-70 + ndbScale = -128 to -150 dB` is well below cutoff, ensuring true silence

### Is BASE_PARAMS = 0 Correct?

**Probably yes, but could be reconsidered.** Setting A1-A6 to 0 in BASE_PARAMS means:
- After ndbScale: -58 to -80 dB
- Linear gain: 0.0001 to 0.001
- Effect: Essentially off, but not completely zero

This is consistent with Klatt 80's approach where parallel formants are only active when explicitly set for specific phonemes (fricatives, some stops).

### Any Issues?

**No issues found.** The current design is:
1. **Safe**: Uninitialized synth is silent
2. **Correct**: TTS frontend provides explicit values per phoneme
3. **Consistent**: Matches Klatt 80's per-frame parameter model

## Recommendation

**No changes needed.**

The -70 dB defaults are intentional and correct:
- They ensure "fail silent" behavior for the synth layer
- The TTS frontend provides explicit values that override these defaults
- The design correctly separates "synth layer safe defaults" from "TTS frontend phoneme parameters"

The only documentation improvement would be adding a comment to `_defaultParams()` explaining this design choice:

```javascript
// Parallel formant amplitudes default to -70 dB (effectively muted).
// This ensures silence when no frame data is provided.
// The TTS frontend provides explicit values per phoneme that override these.
AN: -70,
A1: -70,
// ...
```

## Summary

| Aspect | Status |
|--------|--------|
| -70 dB defaults | Intentional, correct |
| Muting behavior | Expected, by design |
| TTS frontend override | Works correctly |
| klatt-syn comparison | Both expect per-frame values |
| Recommended action | None (optional documentation) |

**Issue 15: RESOLVED - No action required**
