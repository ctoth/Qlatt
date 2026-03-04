# Investigation: Clicky Speech Between Transitions (qlatt-english frontend)

## Root Cause

Klatt 1980 linearly interpolates ALL parameters between update frames (5 ms rate).
The WebAudio implementation defaulted to `setValueAtTime` (instant step functions)
for nearly all parameters, creating sample-accurate discontinuities at every
phoneme boundary. Only aspGain, fricGain, fricGainScaled were ramped.

Every transition produced:
- Instantaneous amplitude jump (voiceGain, avsGain) → click
- Instantaneous formant frequency jump (F1-F6) → resonator transient → click
- Instantaneous bandwidth jump (B1-B6) → resonator transient → click

## Fix Applied

Added `defaultScheduling` field to semantics documents (types.ts, SemanticsDocument).

- `defaultScheduling: ramp` → all bindings use `linearRampToValueAtTime` by default
  (matches Klatt 1980 inter-frame interpolation)
- Individual realize rules can override with `step: true` (binary switches) or
  `ramp: true` (explicit opt-in when default is step)
- Precedence: `step: true` > `ramp: true` > `defaultScheduling`

### Files changed:
- `src/semantics/types.ts` — added `step?: boolean` to RealizationRule, `defaultScheduling` to SemanticsDocument
- `src/klatt-interpreter.ts` — rewrote binding categorization (source × scheduling axes)
- `test/utils/yaml-graph-harness.ts` — updated test scheduling to match interpreter
- `public/experiments/klatt80-baseline/semantics.yaml` — set `defaultScheduling: ramp`,
  marked 7 binary switches with `step: true`, removed now-redundant per-rule `ramp: true`

### Step-scheduled params (binary switches — intermediate values acoustically invalid):
- cascadeGain, parallelVoiceGain
- lfSourceSwitch, impulseSourceSwitch, sourceBypassSwitch, sourceDirectSwitch, sourceDiffSwitch

### Everything else: ramped by default
Including voiceGain, avsGain, all formant frequencies/bandwidths, nasal params,
parallel amplitudes, F0, glottal resonator params, etc.
