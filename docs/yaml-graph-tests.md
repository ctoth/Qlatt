# YAML Graph Tests

This repo supports **declarative, YAML-first tests** for graph/semantics behavior.
They run under Vitest via `npm test`.

The current harness focuses on:
- Semantics math (realized values)
- Scheduling behavior (step vs ramp)
- Track snapshots ("this phoneme frame should set X to Y")
- Track invariants ("this must hold for every frame")
- Parameter fingerprints (ranges over time)

Entry points:
- Harness: `test/utils/yaml-graph-harness.ts:1`
- Vitest loader: `test/yaml-graph.test.ts:1`
- Example suite: `experiments/klsyn88/tests.yaml:1`

## Quick Start

1. Create a suite YAML in your experiment folder:
   - Example: `experiments/klsyn88/tests.yaml`
2. Point it at your experiment files:
   - `semantics`, `graph`, and (optionally) `registry`
3. Add tests (see patterns below)
4. Run:

```bash
npm test
```

## Suite Structure

At the top level:

```yaml
suite: klsyn88-semantics-and-schedule
semantics: experiments/klsyn88/semantics.yaml
graph: experiments/klsyn88/graph.yaml
registry: experiments/klsyn88/registry.yaml
defaultTol: 1e-6

tests:
  - name: example
    inputs: { SW: 1 }
    assert:
      approx: { cascadeGain: 0 }
```

Notes:
- Paths are resolved from the repo root (`process.cwd()`).
- `defaultTol` is used by numeric comparisons unless overridden.

## Test Patterns

Each test uses **one** of the following modes:
- `inputs` (single evaluation)
- `frames` (schedule compilation)
- `track` (phoneme-style sequences)

### 1) Single-Frame Semantics (`inputs`)

Use this for pure math/invariant checks.

```yaml
- name: SW gates cascade in parallel mode
  inputs:
    SW: 1
  assert:
    approx:
      cascadeGain: 0
      parallelVoiceGain: 1
    expr:
      - "cascadeGain + parallelVoiceGain == 1"
```

Assertions:
- `assert.approx`: numeric equality within tolerance
- `assert.expr`: CEL expressions evaluated against realized values

### 2) Scheduling Checks (`frames` + `assertSchedule`)

Use this to test **step vs ramp behavior**.

```yaml
- name: aspGain ramps after frame 0
  frames:
    - time: 0.0
      params: { GO: 47, AH: 0 }
    - time: 0.05
      params: { GO: 47, AH: 30 }
  assertSchedule:
    stepAt:
      - bind: aspGain
        time: 0.0
    rampAt:
      - bind: aspGain
        time: 0.05
```

Notes:
- `bind` must match a `{ bind: ... }` used somewhere in the graph.
- The harness mirrors interpreter behavior:
  - ramp params step at frame 0, ramp thereafter.

### 3) Phoneme-Style Tracks (`track`)

This is the most useful pattern for “phoneme should set these things.”

```yaml
- name: /s/ snapshot favors frication in parallel mode
  track:
    - time: 0.0
      phoneme: "AA"
      params: { ss: 2, GO: 47, AV: 45, AF: 0, AH: 0, SW: 0 }
    - time: 0.1
      phoneme: "S"
      params: { ss: 2, GO: 47, AV: 0, AF: 60, AH: 10, SW: 1 }
  snapshot:
    time: 0.1
    assert:
      approx:
        cascadeGain: 0
        parallelVoiceGain: 1
      expr:
        - "fricDbAdjusted == max(AF, AH)"
        - "fricGainScaled > voiceGain"
```

Snapshot selection:
- `snapshot.index`: exact frame index
- `snapshot.time`: last frame whose `time <= snapshot.time`
- If omitted, the last track frame is used

#### Track Invariants (`assertAllExpr`)

Use this to assert something holds at *every* frame.

```yaml
- name: source switches always sum to 1
  track:
    - time: 0.0
      params: { ss: 1 }
    - time: 0.1
      params: { ss: 2 }
    - time: 0.2
      params: { ss: 3 }
  assertAllExpr:
    - "impulsiveSourceSwitch + naturalSourceSwitch + triangularSourceSwitch == 1"
```

### 4) Parameter Fingerprints (`fingerprint`)

A fingerprint is a simple, stable summary: **min/max ranges over a track**.

```yaml
- name: gates stay within valid ranges
  track:
    - time: 0.0
      params: { ss: 2, SW: 0 }
    - time: 0.1
      params: { ss: 2, SW: 1 }
  fingerprint:
    keys: [cascadeGain, parallelVoiceGain]
    assertRange:
      cascadeGain: { min: 0, max: 1 }
      parallelVoiceGain: { min: 0, max: 1 }
```

## Practical Advice (What to Test)

High-value, stable assertions:
- Switch logic:
  - `SW` gating (`cascadeGain`, `parallelVoiceGain`)
  - Source selection (`ss` switches sum to 1)
- Sign conventions:
  - Parallel formants alternate sign (`a2Linear < 0`, etc.)
- Conditional rules:
  - `fricDbAdjusted` behavior under `SW == 1`
- Ramp behavior:
  - `aspGain`, `fricGain`, `fricGainScaled`

## Current Limits (Important)

These tests **do not render audio** yet.

They assert:
- Realized values from semantics
- Scheduling intent inferred from semantics + graph binds

This is intentional: they are fast, deterministic, and “math-first.”
If you want waveform/spectral assertions, the next step is to add an
offline rendering layer (likely via the existing Puppeteer offline render
path) and compute audio fingerprints there.

