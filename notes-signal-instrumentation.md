# Toggleable Signal Instrumentation

## Goal
Add runtime-toggleable debug telemetry to all worklet processors, graph-aware metering, and data-driven signal flow display.

## Done looks like
1. All worklet processors respond to `{ type: 'set-debug', enabled }` messages
2. `KlattRuntime` interface has `setTelemetryEnabled()` and `getNativeNodeIds()`
3. Meters attach dynamically to all native nodes in any graph
4. `formatSignalFlow()` iterates live data, not hardcoded names
5. Toggle functions exist to enable/disable all instrumentation

## Steps
1. Add `addDebugToggleHandler` to wasm-utils.js
2. Add one-liner to all 20 worklet processors
3. Add `setTelemetryEnabled()` and `getNativeNodeIds()` to klatt-runtime.ts
4. Make `attachMetersNewRuntime()` graph-aware
5. Add toggle functions to telemetry.js
6. Make `formatSignalFlow()` data-driven

## Progress
- [x] Step 1 — `addDebugToggleHandler` added to wasm-utils.js
- [x] Step 2 — All 20 worklet processors updated (import + one-liner), verified with grep (40 matches)
- [x] Step 3 — `setTelemetryEnabled()` and `getNativeNodeIds()` added to KlattRuntime interface + impl
- [x] Step 4 — `attachMetersNewRuntime()` now uses `getNativeNodeIds()` for dynamic discovery
- [x] Step 5 — `setMetersEnabled()` and `setInstrumentationEnabled()` added to telemetry.js
- [x] Step 6 — `formatSignalFlow()` now iterates `state.telemetryMax` and `state.meterMax` dynamically
- [x] Bonus — Updated runtime.js play history to scan all meters (graph-agnostic)
- [x] Tests — 17 failures all pre-existing (snapshot/schema/prosody), none from our changes

## Investigation: Why is klsyn88 quiet?

### Observed signal levels (phrase: "How are we lookin'?")

| Node | klsyn88 rms | klatt80 rms | Notes |
|------|------------|------------|-------|
| glottalSource (worklet) | 69,549 | 0.699 (lf-source) | klsyn88 at C integer scale |
| voiceGain (native) | 2.37 | — | voiceGain = dbToLinearKlsyn(avDb+eeGainDb) |
| cascadeMix (native) | 2.37 | — | = voiceGain (aspGain=0) |
| cascadeF2 (worklet) | 146,211 | 0.699 | Enormous internal amplification |
| cascadeF1 (worklet) | 132,327 | — | cascadeF1 is pitch-sync-mod |
| outputSum (native) | 13,162 | — | cascade + parallel |
| gain0Gain (native) | 0.091 | — | gain0Linear = dbToLinearKlsyn(54) * 1/32768 |
| finalPolarityGain (native) | 0.091 | — | gain = -1.0 (polarity flip) |
| masterGain (native) | — | 0.699 | klatt80 final output |

### Gain structure analysis

**klsyn88 gain0Linear formula** (semantics.yaml line 450-451):
```
gain0Db = (GO - 3) <= 0 ? 57 : (GO - 3)     # GO=57 → gain0Db=54
gain0Linear = dbToLinearKlsyn(gain0Db) * 0.000030517578125   # 1/32768
```

- `dbToLinearKlsyn(54)` = klsynAmpTable[54] * 0.001 = 719 * 0.001 = 0.719
- `gain0Linear` = 0.719 * 3.0518e-5 = **2.194e-5**

**Comment says**: WASM primitives emit raw klsyn88-scale values (up to ±13M DOUBLET).
The 1/32768 normalizes fixed-point to WebAudio [-1,1].

**The 0.001 factor**: `dbToLinearKlsyn()` applies `* 0.001` to the amptable integer.
This happens at BOTH the source gains (voiceGain, aspGain, fricGain) AND the output gain
(gain0Linear). In C, amptable values are used as raw integers without 0.001.

### Key finding: double 0.001 attenuation

In C parwav.c:
- voiceGain = amptable[avDb] = 638 (raw integer)
- gain0 = amptable[gain0Db] = 719 (raw integer)
- Output: signal * voiceGain * ... * gain0 / 32768

In our WebAudio:
- voiceGain = amptable[avDb] * 0.001 = 0.638
- gain0Linear = amptable[gain0Db] * 0.001 * (1/32768) = 2.194e-5
- Relative to C: our signal is 0.001 * 0.001 = 1e-6 x smaller at gains

BUT the cascade resonators are linear — if input is 0.001x, output is 0.001x.
So the total discrepancy from C should be 0.001 (from voiceGain) * 0.001 (from gain0Linear)
divided by 1/32768 (both have this) = **1e-6 times C output**.

The fact that we get 0.091 rms (not essentially zero) suggests the WASM source
output is NOT at raw C integer scale despite the comment saying so.

### Output level comparison

- klsyn88: 0.091 rms (~-21 dBFS)
- klatt80: 0.699 rms (~-3 dBFS)
- Difference: **~17 dB** — klsyn88 is about 7.7x quieter

### Root cause (confirmed)

1. **WASM source IS faithful to C**: natural_source() returns `vwave * 0.03` in
   BOTH the C reference (parwav.c:526) and the WASM Rust port (lib.rs:370).
   The `* 0.001` in DBtoLIN/dbToLinearKlsyn is also in the C reference (parwav.c:874).
2. **The 1/32768 normalization IS correct**: parwav.c clamps to ±32767 for PCM;
   dividing by 32768 converts to WebAudio [-1, 1] float range.
3. **The quietness is from GO convention mismatch**: inventory.yaml sets GO=47
   (Klatt 1980 Table I default). In klatt80, ndbScale offsets (-47) cancel GO out.
   In klsyn88, GO goes directly to amp_gain0 at output. GO=47 → gain0Db=44.
   klsyn88 reference expects GO=60 → gain0Db=57. Difference: amptable[57]/amptable[44]
   = 1024/227 = 4.511x = ~13 dB.

### Fix applied

1. Fixed misleading comment (C uses float, not fixed-point)
2. Named the 1/32768 constant `pcmNorm` with citation
3. Added `goCompensation: 4.511` constant (Klatt 1980 / Jesus 1997 cited)
4. gain0Linear now uses: `dbToLinearKlsyn(gain0Db) * pcmNorm * goCompensation`
5. Added `masterGain` node (like klatt80-baseline has) for user output control
6. Expected output: ~0.41 rms (from 0.091 * 4.511) — comfortable listening level
