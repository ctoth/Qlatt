# DECtalk Internal Trace Oracle Plan

## Goal

Extend the DECtalk 4.63 oracle harness so it compares against DECtalk's
internal synthesis traces, not just:

- `-lp` phoneme logs
- rendered WAV audio

For DECtalk specifically, we have source. That means the right oracle is the
engine's own frame/timing/F0/parameter state, not an estimate derived from the
audio waveform.

## Why

The current harness is strong at two levels:

- symbolic phoneme comparison via `say.exe -lp`
- acoustic comparison via paired WAVs

But it is still weak in the middle, where the real port work lives:

- phone timing by frame
- F0 after DECtalk speaker scaling
- burst/VOT windows
- `SW`-like source routing intervals
- source amplitudes (`AV`, `AP`, `A2-A6`, `AB`)
- bandwidth windows (`B1`, `B2`, `B3`)

Those are exactly the parts we are porting. Because we have the source tree,
we should expose them directly and compare model output to model output.

## Success Criteria

This work is done when one oracle run for a phrase can produce:

- `oracle.wav`
- `oracle.phonemes.txt`
- `oracle.trace.json`

And `oracle.trace.json` includes at least:

- per-frame time index
- current/next phone IDs
- current phone duration in frames
- post-speaker-scaling F0 (`f0prime`)
- output `T0`
- key output parameters from `parstochip[]`

The Qlatt oracle comparer should then ingest that trace and add direct parity
metrics for:

- F0 min/max/mean
- phone/frame duration alignment
- key parameter envelopes
- special-rule windows (burst/VOT/voicebar proxies)

## Scope

- Instrument DECtalk 4.63 in `~/src/dectalk/463`
- Add a new trace output mode to the CLI path used by the harness
- Parse that trace in Qlatt
- Extend `compare.json` to include direct DECtalk-vs-Qlatt internal metrics

This plan does not include:

- replacing the WAV comparison path
- changing Qlatt synthesis behavior
- estimating pitch from audio

## Source Anchors

These are the correct DECtalk instrumentation points.

### Frame-Aligned Output Parameters

`C:\Users\Q\src\dectalk\463\dapi\src\PH\ph_claus.c`

This is the best place to dump frame-aligned output state because it already
owns the frame stepping and exports aligned metadata into `parstochip[]`.

Useful existing fields:

- `parstochip[OUT_PH]`
- `parstochip[OUT_DU]`
- `parstochip[OUT_PH2]`
- `parstochip[OUT_T0]`
- `parstochip[OUT_F1]`, `OUT_F2`, `OUT_F3`
- `parstochip[OUT_B1]`, `OUT_B2`, `OUT_B3`
- `parstochip[OUT_AV]`, `OUT_AP`
- `parstochip[OUT_A2]` through `OUT_A6`
- `parstochip[OUT_AB]`
- `parstochip[OUT_TLT]`
- `parstochip[OUT_BRST]`

`ph_claus.c` is also where phone-aligned outputs are updated with correct tie
alignment, which makes it better than trying to reconstruct this later.

### Post-Scaling F0

`C:\Users\Q\src\dectalk\463\dapi\src\PH\Ph_drwt02.c`

This is where:

- hat/baseline/impulse contributions are combined
- flutter/jitter are applied
- speaker scaling is applied
- `f0prime` is clamped
- `OUT_T0` is derived from the final `f0prime`

The trace must capture the final post-scaling `f0prime`, not a pre-scaled
intermediate.

### Special-Rule Timing Windows

`C:\Users\Q\src\dectalk\463\dapi\src\PH\p_us_st1.c`

This file sets the exact kinds of timed windows we care about:

- `PAV.tspesh`
- `PAP.tspesh`
- `PB1.tspesh`
- `PB2.tspesh`
- `PB3.tspesh`

We do not necessarily need to log from this file directly if the final frame
stream in `ph_claus.c` already reflects the effect, but it is the source of
truth for what the windows mean and how to label them.

## Trace Format

Use a stable JSON Lines format first. It is easier to append incrementally,
debug manually, and parse in Node.

Recommended file:

- `oracle.trace.jsonl`

One line per rendered frame:

```json
{
  "frame": 123,
  "timeFrames": 123,
  "phone": 45,
  "phoneNext": 17,
  "phoneDurFrames": 9,
  "f0prime": 1127,
  "out": {
    "T0": 355,
    "F1": 500,
    "F2": 1500,
    "F3": 2500,
    "B1": 60,
    "B2": 90,
    "B3": 150,
    "AV": 52,
    "AP": 0,
    "A2": 0,
    "A3": 0,
    "A4": 0,
    "A5": 0,
    "A6": 0,
    "AB": 0,
    "TLT": 3,
    "BRST": 0,
    "PH": 45,
    "DU": 9,
    "PH2": 17
  }
}
```

Then wrap it in a final artifact JSON alongside the metadata if needed.

## DECtalk Changes

### 1. Add an Optional Trace Sink

Add a trace file path option to the `SAY` sample CLI used by the harness.

Recommended shape:

- `-lt traceFile`

Meaning:

- "log trace"

This should be parallel to the existing:

- `-w` WAV output
- `-lp` phoneme log output

The `SAY` sample should accept `-lt` and pass the file path into the speech
pipeline through a small global config or an explicit API field.

Target file:

- `C:\Users\Q\src\dectalk\463\samples\SAY\say.c`

### 2. Add Trace State to the DECtalk Runtime

Add a small trace state struct to the phoneme engine state.

Probable home:

- `C:\Users\Q\src\dectalk\463\dapi\src\PH\ph_data.h`

Suggested fields:

- `FILE *trace_fp`
- `long trace_frame_index`
- `int trace_enabled`

This must be strictly optional and default off.

### 3. Emit One Record Per Rendered Frame

Emit the trace from `ph_claus.c` after the frame's `parstochip[]` values are
finalized for that output step.

Why here:

- `parstochip[]` is already aligned
- `OUT_PH/OUT_DU/OUT_PH2` are already available
- it avoids reconstructing timing later

The emission helper should serialize:

- frame index
- current phone
- next phone
- current phone duration
- selected `parstochip[]` values
- `f0prime` if available from the shared state

If `f0prime` is not reliably visible there, store the post-scaled value in
shared state when `Ph_drwt02.c` computes it, then read it in `ph_claus.c`.

### 4. Preserve the Existing CLI Behavior

If `-lt` is not supplied:

- no trace file is opened
- no trace records are emitted

This must not change normal speech or WAV output behavior.

## Qlatt Harness Changes

### 1. Extend the DECtalk Adapter

Update:

- `scripts/oracle/adapters/render-dectalk.ts`

New behavior:

- pass `-lt oracle.trace.jsonl`
- record that path in `oracle.json`
- parse the trace into structured metadata

Artifacts per phrase should become:

- `oracle.wav`
- `oracle.phonemes.txt`
- `oracle.trace.jsonl`
- `oracle.json`

### 2. Add a DECtalk Trace Parser

Create:

- `scripts/oracle/dectalk-trace.ts`

Responsibilities:

- parse JSONL records
- normalize frame times to milliseconds/seconds
- decode the subset of output params we care about
- compute summary stats

Initial summary fields:

- frame count
- rendered duration
- F0 min/max/mean (convert `f0prime` to Hz if needed)
- phone/frame spans
- simple voiced-frame ratio (`AV > 0`)

### 3. Extend the Comparison Schema

Update:

- `scripts/oracle/types.ts`
- `scripts/oracle/compare-audio.ts`

Add a new `oracleTrace`/`internal` metrics section.

Recommended fields in `compare.json`:

- `oracle.traceSummary`
- `metrics.internal.f0`
- `metrics.internal.duration`
- `metrics.internal.source`

Example metrics:

- `oracleF0MinHz`
- `oracleF0MaxHz`
- `qlattF0MinHz`
- `qlattF0MaxHz`
- `f0MeanDeltaHz`
- `oracleFrameDurationSec`
- `qlattTrackDurationSec`
- `avActiveRatioDelta`
- `apActiveRatioDelta`

### 4. Add Direct F0 Parity Checks

Do not estimate F0 from the WAV for DECtalk.

Instead:

- use DECtalk trace `f0prime`
- compare it against Qlatt track `F0`

This should become the main prosody debugging signal.

### 5. Add Direct Phone Timing Parity

Use:

- DECtalk `OUT_PH` / `OUT_DU`
- Qlatt `frontendPhones`

This gives us a better phone-duration oracle than the current coarse symbolic
token comparison alone.

## Metrics to Add First

Start with the smallest set that materially improves debugging.

1. F0 min/max/mean
2. Total rendered duration
3. Per-phone frame spans
4. Voiced-frame ratio (`AV > 0`)
5. Aspiration activity ratio (`AP > 0`)
6. Parallel-frication activity ratios (`A2-A6`, `AB`)

These are enough to diagnose:

- pitch baseline errors
- duration drift
- missing VOT windows
- over/under-active frication

## Validation Strategy

### Phase 1: Smoke Trace

For a one-word phrase:

- verify `-lt` creates a trace file
- verify frame count is non-zero
- verify `f0prime` and `OUT_T0` are populated

### Phase 2: Cross-Check Against Existing Outputs

For the same phrase:

- trace duration should align with WAV duration
- `OUT_PH/OUT_DU` should align with the phoneme log structure
- frame `T0` should be consistent with `f0prime`

### Phase 3: Harness Integration

Run the existing corpus and confirm:

- no regressions in WAV/phoneme generation
- `compare.json` contains trace-derived metrics
- summary can identify worst phrases by direct F0 mismatch, not just STOI

## Implementation Order

1. Patch `SAY` CLI to accept `-lt`.
2. Add optional trace state to DECtalk runtime structs.
3. Add post-scaling `f0prime` visibility if needed.
4. Emit frame-level JSONL records from `ph_claus.c`.
5. Rebuild `say.exe`.
6. Extend `render-dectalk.ts` to request and persist the trace.
7. Add a trace parser in Qlatt.
8. Extend `compare.json` schema and metrics.
9. Re-run the corpus and baseline the new internal metrics.

## Risks

1. Frame emission overhead
   - JSONL trace output will slow renders.
   - This is acceptable for offline oracle runs.

2. Wrong instrumentation point
   - Dumping too early could capture pre-adjusted values.
   - That is why `ph_claus.c` should be the primary sink.

3. F0 visibility split
   - `Ph_drwt02.c` computes post-scaling `f0prime`; make sure the traced value
     is the final scaled/clamped one, not a pre-scale intermediate.

4. Trace schema drift
   - Keep the initial format minimal and versioned.

## Non-Goals

This plan does not attempt to:

- replace the black-box fallback path for other synthesizers
- remove audio metrics
- infer pitch from the WAV for DECtalk

For DECtalk, direct internal traces are the correct oracle.
