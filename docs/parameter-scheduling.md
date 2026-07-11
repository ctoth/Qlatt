# Parameter Scheduling Architecture

This document describes how Klatt parameters flow from text to audio output in the current declarative frontend runtime.

## Data Flow Overview

```
Text -> normalize/transcribe -> Utterance HRG -> graph rules -> final lowering -> frames -> interpreter -> WebAudio graph
        src/tts-frontend.ts       src/declarative-frontend/hrg/*
```

`src/tts-frontend.ts` orchestrates resource selection and constructs one typed
`Utterance`. Rule behavior is compiled by
`src/declarative-frontend/rule-pack.ts` and executed transactionally by
`src/declarative-frontend/hrg/rule-engine.ts`. The sole frame projection is
`src/declarative-frontend/hrg/lowering.ts`. Available bundled frontends:

- **qlatt-english** (default): `public/rules/frontends/qlatt-english/frontend.yaml` — CMU dictionary, Elovitz LTS, and its declared inventory
- **dectalk-english**: `public/rules/frontends/dectalk-english/frontend.yaml` — DECtalk 4.63 duration/F0 models, own inventory and LTS rules
- **qlatt-beauty**: `public/rules/frontends/qlatt-beauty/frontend.yaml` — graph-native scaffold with independent resource identity

For graph topology and extension points, see `docs/synthesizer-architecture.md`. For the full authoring workflow, see `docs/adding-a-synthesizer.md`.

## Track Structure

Each frame in a track (from `src/klatt-interpreter.ts`):

```typescript
interface KlattFrame {
  time: number;           // Seconds from utterance start
  phoneme?: string;       // Label (e.g., "AH1", "P_REL")
  word?: string;          // Source word
  params: Record<string, number>;  // Klatt parameters
}
```

## Klatt Parameters

### Core Parameters

| Category | Parameters | Units |
|----------|------------|-------|
| Fundamental | F0 | Hz |
| Formant frequencies | F1, F2, F3, F4, F5, F6 | Hz |
| Formant bandwidths | B1, B2, B3, B4, B5, B6 | Hz |
| Source amplitudes | AV, AH, AF, AVS | dB |
| Parallel amplitudes | A1, A2, A3, A4, A5, A6 | dB |
| Nasal | AN, AB, FN, BN, FZ, BZ | dB/Hz |
| Mode control | SW, sourceMode | 0/1/2 |
| LF source | Rd, lfMode, openPhaseRatio | - |
| Overall gain | GO, masterGain | dB |

### Default Values

Defined in `public/experiments/klatt80-baseline/semantics.yaml` under `params:` section.

## Frontend: Graph Construction and Final Lowering

### Active pipeline

`textToKlattTrack()` in `src/tts-frontend.ts` executes:

1. load the selected immutable compiled frontend and its declared resources;
2. normalize/transcribe into stable Token, Word, Syllable, and Segment Items,
   with shared SylStructure identity;
3. attach Direction Track input to typed control Relations;
4. run the selected graph-native phase sequence over the same `Utterance`;
5. commit typed feature/topology writes with citations, tags, read parents, and
   journal entries; and
6. invoke `lowerToFrames()` once to project Segment, Transition, F0Point,
   Intonation, Tilt, PhraseCommand, Affect, Break, speaker, source, and lowering
   policy into `KlattFrame[]`.

Phase ordering and frontend policy come from the selected package's
`frontend.yaml`, `pipeline.yaml`, and `phases/*.yaml`; generic code does not name
one frontend's inventory or policy as a fallback.

Legacy imperative frontend mutators (`rule_K_Context`, `rule_GenerateF0Contour`) are removed from runtime usage and exports.

### Inventory and graph features

The selected frontend's `inventory_path` is the source of its baseline Segment
targets. Rules then create versioned feature writes. The latest version is the
current value used by lowering, while earlier versions and their producing
decisions remain available to `--item ... --field ...` explanation.

### Transition scheduling before the interpreter

Transition and control-window intent is explicit HRG data, not a hardcoded
frame-emission blend. Final lowering realizes declared locus transitions,
midpoint windows, per-parameter steady times, explicit F0 points/layers, and
step-sensitive branch controls. Missing required timing or lowering data is an
error with diagnostics; it is not replaced by an implicit 30 ms or 100 ms
fallback.

## Interpreter: Parameter Scheduling

**Location**: `src/klatt-interpreter.ts`

### Scheduling Flow

```
scheduleTrack(track, startTime)
  -> compileSchedule(track, baseTime)    // pre-compile track
    -> for each frame:
      -> evaluateSemantics(frame.params)  // CEL expressions
      -> generate ScheduleEntry[]
  -> executeSchedule(schedule)            // apply to AudioParams
```

### Ramp vs step decision

The semantics document declares a `defaultScheduling` mode:

```yaml
defaultScheduling: ramp   # Klatt 1980: all params interpolated between frames
```

With `defaultScheduling: ramp`, all bindings (realized and passthrough) use
`linearRampToValueAtTime` by default, matching Klatt 1980's sample-by-sample
linear interpolation between update frames.

Binary mode switches override with `step: true` to force `setValueAtTime`,
since intermediate values (e.g., cascade gain at 0.5) are acoustically invalid:

```yaml
cascadeGain:
  expr: "SW == 1 ? 0 : 1"
  deps: [SW]
  step: true
```

Precedence: `step: true` > `ramp: true` > `defaultScheduling`.

## Semantics Evaluation

**Location**: `src/semantics/`

Pipeline:
1. Build context (frame params + constants + defaults)
2. Topological sort by dependencies
3. CEL evaluation in order
4. Emit realized values for binding

Key components:

| File | Purpose |
|------|---------|
| `types.ts` | TypeScript interfaces |
| `cel-evaluator.ts` | CEL expression engine |
| `topological-evaluator.ts` | Dependency ordering |
| `jmespath-resolver.ts` | Nested constant access |

Builtin functions (`src/builtin-functions.ts`) include `dbToLinear`, `proximity`, and related helpers used by semantics formulas.

## Current Limitations

1. No explicit delta/delta-delta trajectory model
2. The command-line `transitionMs` value remains an input policy value where a
   selected frontend consumes it; it is not a lowerer fallback

## Potential Improvements

SPG-style trajectory smoothing (Hu 2012) remains a candidate:

1. Track-level trajectory optimization before scheduling
2. Higher frame density where needed

See `plans/spg-trajectory-smoothing.md`.
