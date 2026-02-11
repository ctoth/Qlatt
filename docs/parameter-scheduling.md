# Parameter Scheduling Architecture

This document describes how Klatt parameters flow from text to audio output in the current declarative frontend runtime.

## Data Flow Overview

```
Text -> preprocess -> declarative frontend -> Klatt track -> interpreter -> WebAudio graph
         (normalize/transcribe)   (structural/duration/prosody/finalize)
         src/tts-frontend.js      src/declarative-frontend/*
```

`src/tts-frontend.js` still owns text normalization/transcription and final frame emission. Rule behavior is owned by `src/declarative-frontend/rule-pack.js` and executed by `src/declarative-frontend/engine.js`.

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

Defined in `experiments/klatt80-baseline/semantics.yaml` under `params:` section.

## Frontend: Declarative Track Generation

### Active pipeline

`textToKlattTrack()` in `src/tts-frontend.js` executes:

1. `normalizeText()` and `transcribeText()`
2. baseline inventory mapping from `PHONEME_TARGETS` in `src/tts-frontend-rules.js`
3. declarative phases via `runDeclarativeFrontend()`:
   - `structural`
   - `duration`
   - `prosody`
   - `finalize`
4. final `KlattFrame[]` emission with F0 interpolation from resolved declarative point stream tokens

Legacy imperative frontend mutators (`rule_K_Context`, `rule_GenerateF0Contour`) are removed from runtime usage and exports.

### Inventory Targets (not rule mutators)

`src/tts-frontend-rules.js` is now inventory/default data plus helpers (for example `PHONEME_TARGETS`, `fillDefaultParams`). Runtime phonological/phonetic sequencing behavior is in the declarative rule pack.

### Current transition smoothing in frame emission

```javascript
const blendFactor = 0.35;
const smoothTypes = new Set(["vowel", "nasal", "liquid", "glide"]);
const blendKeys = ["F1", "F2", "F3", "B1", "B2", "B3"];
```

Only applies to vowel/sonorant transitions at frame emission time; most transitions remain stepwise.

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

Set `ramp: true` in `semantics.yaml` realization rules.

```yaml
aspGain:
  expr: "dbToLinear(GO + AH + ndbScale.AH)"
  deps: [GO, AH]
  ramp: true

voiceGain:
  expr: "dbToLinear(GO + AV + ndbScale.AV)"
  deps: [GO, AV]
```

Current ramped params are `aspGain`, `fricGain`, and `fricGainScaled`. Most other bindings remain step-scheduled.

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

1. No spectral-distance metric in frame blending (`blendFactor` is fixed)
2. Limited smoothing coverage (mainly vowel/sonorant handoff)
3. No explicit delta/delta-delta trajectory model
4. Most formant/frequency controls remain step-scheduled
5. Transition window is fixed by `transitionMs` (default 30 ms)

## Potential Improvements

SPG-style trajectory smoothing (Hu 2012) remains a candidate:

1. Track-level trajectory optimization before scheduling
2. Wider ramp usage where acoustically safe
3. Higher frame density where needed

See `plans/spg-trajectory-smoothing.md`.
