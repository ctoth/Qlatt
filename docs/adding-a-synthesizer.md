# Adding a New Synthesizer to Qlatt

This guide explains how to add a new formant synthesizer to Qlatt using the YAML-driven architecture. Qlatt uses a declarative approach where synthesizer topology, parameter semantics, and signal routing are defined in YAML files rather than hardcoded in source.

## Overview

Qlatt's YAML-driven synthesis architecture separates concerns into three layers:

1. **Semantics** (`semantics.yaml`) - Parameter definitions and derivation rules
2. **Topology** (`graph.yaml`) - Audio node graph and signal routing
3. **Primitives** (`registry.yaml`) - Node type definitions and implementations

This separation enables:
- Adding new synthesizers without modifying runtime code
- Reusing primitives across synthesizers
- Declarative parameter conversion (dB to linear, proximity corrections)
- Automatic dependency ordering for derived parameters
- A stable boundary from the frontend's typed `Utterance` to backend frames

A synthesizer experiment is a backend. It does not own transcription,
phonological rules, or frontend Item structure. If the new backend needs a
backend-neutral control that the selected frontend does not produce, add that
typed feature or control Relation to the frontend schema/rules with citations,
then project it in final lowering. Do not add a parallel control-score object or
infer linguistic intent from completed frames.

## Architecture

### Data Flow

```
Text Input
    |
    v
[tts-frontend.ts] normalizeText() -> transcribeText() -> selected frontend inventory
    |
    v
[declarative-frontend/hrg/rule-engine.ts] enrich one typed Utterance
  structural -> duration -> prosody -> finalize
    |
    v
[declarative-frontend/hrg/lowering.ts] project once to KlattTrack frames
    |
    v
[klatt-interpreter.ts] Evaluate semantics.yaml rules per frame
    |
    v
[klatt-runtime.ts] Build WebAudio graph from graph.yaml + Apply values
    |
    v
WebAudio destination -> Audio output
```

Each frontend package owns its declared inventory and resources. The compiled
frontend spec resolves those resources before graph construction; generic
runtime code does not fall back to qlatt-English inventory data. Frontend
behavioral rules operate on typed Relations declared by the package. The
default bundled frontend entrypoint is
`public/rules/frontends/qlatt-english/frontend.yaml`, which includes the
frontend-local `pipeline.yaml` and `phases/*.yaml`.

If you add another frontend, register it in `src/declarative-frontend/rule-pack.ts` so callers can select it by `frontendId` instead of hardcoding a path.

The frontend compiler accepts `relations:` and `select.relation`. The removed
`streams:`/`select.stream` vocabulary is not a compatibility surface. Every
rule requires citations, and every behavioral application requires a tag so
the transaction can stamp the resulting feature or topology write.

### File Relationships

```
semantics.yaml              graph.yaml              registry.yaml
     |                           |                        |
     | params, constants         | nodes, connections     | primitive definitions
     | realize rules             | bindings               | (native, worklet, wasm)
     v                           v                        v
     +----------- klatt-runtime.ts ----------+
                        |
                        v
               klatt-interpreter.ts
                        |
                        v
                topological-evaluator.ts
                        |
                        v
                  cel-evaluator.ts (CEL expressions)
                        |
                        v
                builtin-functions.ts (dbToLinear, proximity, etc.)
```

### Semantics Evaluation

1. Build context from frame parameters + constants
2. Topologically sort rules by `deps` field
3. Evaluate each CEL expression in order
4. Store results in context for downstream rules
5. Return realized values for binding

## Available Primitives

### Native WebAudio Nodes

| Type | Description | Parameters |
|------|-------------|------------|
| `gain` | WebAudio GainNode - multiplies signal | `gain` (float, default 1.0) |
| `constant-source` | WebAudio ConstantSourceNode | `offset` (float, default 1.0) |

### WASM-Backed AudioWorklet Nodes

These primitives use Rust/WASM for DSP with JavaScript worklet wrappers.

| Type | Description | Parameters |
|------|-------------|------------|
| `resonator` | Two-pole bandpass (formant filter) | `frequency` (Hz), `bandwidth` (Hz) |
| `antiresonator` | Two-zero notch (nasal zero) | `frequency` (Hz), `bandwidth` (Hz) |
| `lf-source` | LF model glottal source | `f0` (Hz), `rd` (0.3-2.7), `lfMode` (int) |
| `impulsive-source` | Doublet impulse glottal source (klsyn88) | `f0` (Hz), `oq` (%) |
| `triangular-source` | Symmetric triangle glottal source (klsyn88) | `f0` (Hz), `oq` (%) |
| `square-source` | Pulse waveform glottal source (klsyn88) | `f0` (Hz), `oq` (%) |
| `oversampled-glottal-source` | 4x oversampled source with tilt | `f0` (Hz), `oq` (%), `tilt` (dB) |
| `signal-switch` | N-to-1 signal selector for source selection | `selector` (0=input0, 1=input1, ...) |
| `edge-detector` | PLSTEP trigger (delta detection) | `threshold` (dB), `input` (dB) |
| `decay-envelope` | Exponential decay envelope | `trigger`, `amplitude`, `decay` |
| `tilt-filter` | One-pole spectral tilt lowpass (klsyn88) | `tilt` (dB, 0-34) |
| `biquad-notch` | Biquad band-reject filter (nasal antiformants) | `frequency` (Hz), `bandwidth` (Hz) |
| `pitch-sync-mod` | Pitch-synchronous F1/B1 resonator | `frequency`, `bandwidth`, `dF`, `db` |
| `fujisaki-resonator` | Resonator with Fujisaki history compensation | `frequency` (Hz), `bandwidth` (Hz) |
| `reconstruction-filter` | Fixed output reconstruction lowpass | — |
| `aerodynamic-model` | Stevens & Bickley 1991 aerodynamic coupling | (physical params) |

**Note**: `signal-switch` is particularly useful for synthesizers with multiple source types (e.g., klsyn88's impulsive/natural/triangular sources). Wire all sources to the switch, bind the selector to a source-select parameter.

### JavaScript AudioWorklet Nodes

| Type | Description | Parameters |
|------|-------------|------------|
| `impulse-train` | Periodic impulse source | `f0` (Hz), `gain`, `openPhaseRatio` |
| `noise-source` | Filtered noise generator | `gain`, `cutoff` (Hz) |
| `differentiator` | First difference (radiation) | (none) |
| `glottal-mod` | 50% duty cycle square wave | `f0` (Hz) |

### Primitive Options

Some primitives accept `options` (compile-time configuration):

```yaml
cascadeF1:
  type: resonator
  options:
    bypassAtZero: true   # Pass through if frequency is 0
  params:
    frequency: { bind: F1 }
    bandwidth: { bind: B1 }
```

## CEL Functions

### Currently Available

The following functions are registered in the CEL evaluator and available in semantics expressions:

| Function | Signature | Description |
|----------|-----------|-------------|
| `dbToLinear(db)` | `float -> float` | Convert dB to linear (6 dB/doubling). Returns 0 below -72 dB. |
| `min(a, b)` | `float, float -> float` | Minimum of two values |
| `max(a, b)` | `float, float -> float` | Maximum of two values |
| `pow(base, exp)` | `float, float -> float` | Power function |

**Note on `proximity`**: The `proximity(delta)` function for formant proximity correction exists in `builtin-functions.ts` and is added to the interpreter's static context, but is **not currently registered as a CEL function in the runtime**. If you need proximity correction in your semantics, ensure it's registered via `celEvaluator.registerFunction('proximity', proximity)`.

### Functions Needed for Future Synthesizers

For klsyn88 and similar synthesizers, consider adding:

| Function | Signature | Purpose |
|----------|-----------|---------|
| `exp(x)` | `float -> float` | Exponential (for resonator coefficients if exposed to CEL) |
| `ln(x)` | `float -> float` | Natural logarithm |
| `cos(x)` | `float -> float` | Cosine (for resonator coefficients if exposed to CEL) |
| `floor(x)` | `float -> float` | Floor/truncate |
| `clip(v, lo, hi)` | `float, float, float -> float` | Clamp value to range |

To register a new function:

```typescript
// In klatt-runtime.ts or klatt-interpreter.ts
celEvaluator.registerFunction('exp', Math.exp);
celEvaluator.registerFunction('ln', Math.log);
celEvaluator.registerFunction('floor', Math.floor);
celEvaluator.registerFunction('clip', (v, lo, hi) => Math.max(lo, Math.min(hi, v)));
```

### Expression Syntax

Expressions use CEL (Common Expression Language) syntax:

```yaml
# Simple arithmetic
voiceGain:
  expr: "dbToLinear(G0 + AV + ndbScale.AV)"
  deps: [G0, AV]

# Conditionals
cascadeGain:
  expr: "SW == 1 ? 0 : 1"
  deps: [SW]

# Nested constant access
a2Linear:
  expr: "-dbToLinear(A2 + n12Cor * 2 + n23Cor + ndbScale.A2) * parallelScale"
  deps: [A2, n12Cor, n23Cor, parallelScale]
```

## Creating a New Synthesizer

### Step 1: Define Parameters (semantics.yaml)

Create `public/experiments/<synth-name>/semantics.yaml`:

```yaml
bacon: "0.1"
name: my-synth

# Input parameters - what the TTS frontend provides
params:
  F0:
    type: float
    range: [50, 500]
    default: 120
    unit: Hz
    description: Fundamental frequency

  F1:
    type: float
    range: [200, 1000]
    default: 500
    unit: Hz

  AV:
    type: float
    range: [0, 80]
    default: 60
    unit: dB
    description: Voicing amplitude

  # ... more parameters

# Constants - values that don't change
constants:
  ndbScale:
    AV: -119
    # ... scaling factors

  # Lookup tables as arrays
  ndbCor: [10, 9, 8, 7, 6, 5, 4, 3, 2, 1]

# Realize rules - derive intermediate values from params
realize:
  # Proximity corrections
  n12Cor:
    expr: "proximity(F2 - F1)"
    deps: [F1, F2]

  # Linear gains from dB
  voiceGain:
    expr: "dbToLinear(G0 + AV + ndbScale.AV)"
    deps: [G0, AV]
    ramp: true   # Use linear interpolation (not step)

  # Conditional switching
  cascadeGain:
    expr: "SW == 1 ? 0 : 1"
    deps: [SW]
```

**Key Points:**

- `params`: Input parameters with metadata (type, range, default, unit)
- `constants`: Static values accessible in expressions (supports nested objects)
- `realize`: CEL expressions with explicit dependencies
  - `deps`: Required for topological ordering
  - `ramp: true`: Enables smooth interpolation between frames

### Step 2: Define Topology (graph.yaml)

Create `public/experiments/<synth-name>/graph.yaml`:

```yaml
bacon: "0.1"
name: my-synth
meta:
  primitives: ./registry.yaml
  semantics: ./semantics.yaml

nodes:
  # Source nodes
  lfSource:
    type: lf-source
    params:
      f0: { bind: F0 }
      rd: { bind: Rd }

  # Gain stages
  voiceGain:
    type: gain
    params:
      gain: { bind: voiceGain }   # Binds to realized value

  # Formant filters
  cascadeF1:
    type: resonator
    options:
      bypassAtZero: true
    params:
      frequency: { bind: F1 }
      bandwidth: { bind: B1 }

  # More nodes...

connections:
  # Source routing
  - [lfSource, voiceGain]
  - [voiceGain, mixer]

  # Cascade chain
  - [mixer, nz]
  - [nz, np]
  - [np, cascadeF1]
  - [cascadeF1, cascadeF2]
  # ... continues through F6

  # Output
  - [cascadeF6, outputGain]

outputs:
  - outputGain
```

**Key Points:**

- `nodes`: Named audio nodes with type and parameter bindings
- Parameter values can be:
  - Literals: `gain: 1.0`
  - Bindings: `{ bind: F0 }` - resolved from semantics
- `connections`: Array of `[source, destination]` pairs
- `outputs`: Terminal nodes connecting to audio destination

### Step 3: Register Primitives (registry.yaml)

Either extend `public/experiments/klatt80-baseline/registry.yaml` or create your own:

```yaml
bacon: "0.1"

primitives:
  # Native WebAudio node
  gain:
    description: "WebAudio GainNode"
    native: GainNode
    params:
      gain:
        type: float
        default: 1.0
    inputs: 1
    outputs: 1

  # WASM-backed worklet
  resonator:
    description: "Two-pole resonator"
    worklet: "resonator-processor.js"
    wasm: "resonator.wasm"
    options:
      bypassAtZero:
        type: bool
        default: false
    params:
      frequency:
        type: float
        unit: Hz
        default: 500
      bandwidth:
        type: float
        unit: Hz
        default: 100
    inputs: 1
    outputs: 1

  # JS-only worklet
  differentiator:
    description: "First difference filter"
    worklet: "differentiator-processor.js"
    params: {}
    inputs: 1
    outputs: 1
```

**Implementation Categories:**

| Field | Type | Description |
|-------|------|-------------|
| `native: <NodeType>` | WebAudio built-in | Uses standard WebAudio API |
| `worklet` + `wasm` | WASM-backed | Rust DSP with JS wrapper |
| `worklet` only | Pure JS | JavaScript AudioWorkletProcessor |

### Step 4: Add New Primitives (if needed)

#### WASM Primitive (Rust)

1. Create crate in `crates/<primitive-name>/`:

```rust
// crates/my-primitive/src/lib.rs
#[repr(C)]
pub struct MyPrimitive {
    state: f32,
}

impl MyPrimitive {
    fn new() -> Self {
        Self { state: 0.0 }
    }

    fn process(&mut self, input: &[f32], output: &mut [f32]) {
        for (i, x) in input.iter().enumerate() {
            // DSP logic here
            output[i] = x * self.state;
        }
    }
}

#[no_mangle]
pub extern "C" fn my_primitive_new() -> *mut MyPrimitive {
    Box::into_raw(Box::new(MyPrimitive::new()))
}

#[no_mangle]
pub extern "C" fn my_primitive_free(ptr: *mut MyPrimitive) {
    if !ptr.is_null() {
        unsafe { drop(Box::from_raw(ptr)); }
    }
}

#[no_mangle]
pub extern "C" fn my_primitive_process(
    ptr: *mut MyPrimitive,
    input_ptr: *const f32,
    output_ptr: *mut f32,
    len: usize,
) {
    if ptr.is_null() || input_ptr.is_null() || output_ptr.is_null() || len == 0 {
        return;
    }
    unsafe {
        let input = core::slice::from_raw_parts(input_ptr, len);
        let output = core::slice::from_raw_parts_mut(output_ptr, len);
        (*ptr).process(input, output);
    }
}

klatt_wasm_common::export_alloc_fns!();
```

2. Create the worklet wrapper in `src/worklets/` and build it into `public/worklets/` with `npm run build:worklets`:

```typescript
// src/worklets/my-primitive-processor.ts
class MyPrimitiveProcessor extends AudioWorkletProcessor {
    constructor(options) {
        super();
        // Load WASM, initialize
    }

    process(inputs, outputs, parameters) {
        // Call WASM functions
        return true;
    }
}

registerProcessor('my-primitive-processor', MyPrimitiveProcessor);
```

3. Register in `registry.yaml`:

```yaml
my-primitive:
  description: "My custom primitive"
  worklet: "my-primitive-processor.js"
  wasm: "my-primitive.wasm"
  params:
    myParam:
      type: float
      default: 1.0
  inputs: 1
  outputs: 1
```

#### JavaScript-Only Primitive

For simpler primitives, skip WASM:

```typescript
// src/worklets/simple-processor.ts
class SimpleProcessor extends AudioWorkletProcessor {
    static get parameterDescriptors() {
        return [
            { name: 'gain', defaultValue: 1.0, automationRate: 'a-rate' }
        ];
    }

    process(inputs, outputs, parameters) {
        const input = inputs[0];
        const output = outputs[0];
        const gain = parameters.gain;

        for (let channel = 0; channel < output.length; channel++) {
            for (let i = 0; i < output[channel].length; i++) {
                const g = gain.length > 1 ? gain[i] : gain[0];
                output[channel][i] = input[channel]?.[i] * g || 0;
            }
        }
        return true;
    }
}

registerProcessor('simple-processor', SimpleProcessor);
```

### Step 5: Integration

Wire your synthesizer into the TTS pipeline:

```javascript
// In tts-frontend.ts or new file

import { createKlattRuntime } from './klatt-runtime.js';

async function createMySynthRuntime(audioContext) {
    const semantics = await loadYaml('public/experiments/my-synth/semantics.yaml');
    const graph = await loadYaml('public/experiments/my-synth/graph.yaml');
    const registry = await loadYaml('public/experiments/my-synth/registry.yaml');

    return createKlattRuntime({
        audioContext,
        semantics,
        graph,
        registry
    });
}
```

## Case Study: klsyn88 Port

This section documents concrete findings from investigating klsyn88 (Dennis Klatt's evolved C implementation, circa 1988) as a target for porting. These findings illustrate the decision-making process for any new synthesizer.

### Parameter Inventory

klsyn88 has 49 parameters (vs klatt80's smaller set):

**Constants (6):**
| Symbol | Name | Default | Range | Description |
|--------|------|---------|-------|-------------|
| sr | SAMRAT | 11025 | 5000-22050 | Sample rate |
| nf | NFCASC | 5 | 1-8 | Cascade formant count |
| du | Duration | 500 | 30-5000 | Duration (ms) |
| ss | SOURCE_SEL | 2 | 1-3 | Source type |
| ui | Update | 5 | 1-20 | Frame rate (ms) |
| rs | RANSEED | 1 | 1-99 | Noise seed |

**Variables (43):**
- Source: f0, av, ah, af, oq, tl, at, sk
- Cascade: F1-F5, f6, b1-b6
- Nasal: fp, bp, fz, bz
- Parallel: a1-a6, p1-p6, an, ab, ap
- Other: g0, dF, db

### Formula Mapping: klsyn88 vs klatt80

**Key Difference**: klsyn88 uses simple multiplicative scaling instead of ndbScale offsets:

| Parameter | klsyn88 Formula | klatt80 Formula | CEL Expression |
|-----------|-----------------|-----------------|----------------|
| amp_parF1 | `DBtoLIN(A1) * 0.4` | ndbScale offset | `dbToLinear(A1) * 0.4` |
| amp_parF2 | `DBtoLIN(A2) * 0.15` | ndbScale offset | `dbToLinear(A2) * 0.15` |
| amp_parF3 | `DBtoLIN(A3) * 0.06` | ndbScale offset | `dbToLinear(A3) * 0.06` |
| amp_parF4 | `DBtoLIN(A4) * 0.04` | ndbScale offset | `dbToLinear(A4) * 0.04` |
| amp_parF5 | `DBtoLIN(A5) * 0.022` | ndbScale offset | `dbToLinear(A5) * 0.022` |
| amp_parF6 | `DBtoLIN(A6) * 0.03` | ndbScale offset | `dbToLinear(A6) * 0.03` |
| amp_bypas | `DBtoLIN(AB) * 0.05` | ndbScale offset | `dbToLinear(AB) * 0.05` |

Both use the same dB-to-linear conversion (6 dB per doubling), so `dbToLinear()` works for both.

### What Can Be CEL vs What Needs Primitives

**Can Be Expressed in CEL (Pure Arithmetic):**

1. All dB-to-linear conversions - existing `dbToLinear()` works
2. Parallel formant amplitude scaling - simple multiplication
3. T0 and nopen calculations - `T0 = 4 * sampleRate / F0`
4. Filter frequency calculations - arithmetic only
5. Spectral tilt lookup - could add as constant array

**Needs New CEL Functions:**

| Function | Purpose | Example Usage |
|----------|---------|---------------|
| `exp(x)` | Resonator coefficient calculation | `r = exp(-PI * bw / sampleRate)` |
| `cos(x)` | Resonator coefficient calculation | `b = r * cos(2*PI*f/sampleRate) * 2` |
| `ln(x)` | Logarithmic calculations | Tilt linearization |
| `floor(x)` | Integer truncation | Frame indexing |
| `clip(v, lo, hi)` | Value clamping | `max(lo, min(hi, v))` |

Note: `exp()` and `cos()` are needed if you want CEL transparency for coefficient calculation. Our WASM primitives already implement these formulas internally, so you can just pass F and BW directly.

**Needs New Runtime Primitives (State-Dependent):**

1. **Pitch-synchronous F1/B1 modulation** - dF/db params modulate F1/B1 during open phase
2. **Glottal-phase noise modulation** - reduce noise 50% during semi-closed portion
3. **Fujisaki formant compensation** - scale resonator history when formant drops suddenly
4. **Skewness/jitter** - alternating period skew for naturalness
5. **Triangular/Square sources** - additional glottal source types

### Feature Comparison

| Feature | klatt80 | klsyn88 | Impact |
|---------|---------|---------|--------|
| Cascade formants | 5 | 8 (F7=6500, F8=7500 fixed) | Graph topology change |
| Glottal sources | Natural only | Impulsive, Natural, Triangular, Square | New primitives needed |
| dB conversion | ndbScale offsets | Simple multipliers | Semantics change |
| Proximity correction | ndbCor lookup | Not implemented | Can add if desired |
| Spectral tilt | Not in klatt80 | lineartilt[] lookup (0-34 dB) | New constant array |
| Pitch-sync F1 | None | dF, db params | New primitive |
| Open quotient | Fixed | oq param (10-80%) | Source parameter |
| Parallel bandwidths | Shared with cascade | Separate p1-p6 | Graph topology change |
| 4x oversampling | None | Glottal source at 4x | New worklet |
| Sample rate | Fixed | Variable (5000-22050) | Runtime config |

### Primitives Needed for klsyn88

**All required primitives now exist as WASM crates in `crates/`:**

| Primitive | Status | Crate |
|-----------|--------|-------|
| `signal-switch` | Done | `crates/signal-switch` |
| `impulsive-source` | Done | `crates/impulsive-source` |
| `triangular-source` | Done | `crates/triangular-source` |
| `square-source` | Done | `crates/square-source` |
| `tilt-filter` | Done | `crates/tilt-filter` |
| `pitch-sync-mod` | Done | `crates/pitch-sync-mod` (pitch-synchronous F1/B1 modulation) |
| `fujisaki-resonator` | Done | `crates/fujisaki-resonator` (Fujisaki history compensation) |
| `oversampled-glottal-source` | Done | `crates/oversampled-glottal-source` (4x oversampled with tilt) |

### Primitive Registry Entries

These primitives are registered in the klsyn88 experiment's registry. See `public/experiments/klsyn88/registry.yaml` for the active definitions. Example entries:

```yaml
impulsive-source:
  description: "Doublet impulse glottal source"
  worklet: "impulsive-source-processor.js"
  wasm: "impulsive-source.wasm"
  params:
    f0: { type: float, unit: Hz, default: 120 }
    oq: { type: float, default: 50 }

tilt-filter:
  description: "One-pole lowpass for spectral tilt (klsyn88)"
  worklet: "tilt-filter-processor.js"
  wasm: "tilt-filter.wasm"
  params:
    tilt: { type: float, unit: dB, default: 0 }

pitch-sync-mod:
  description: "Pitch-synchronous F1/B1 resonator"
  worklet: "pitch-sync-mod-processor.js"
  wasm: "pitch-sync-mod.wasm"
  params:
    frequency: { type: float, unit: Hz }
    bandwidth: { type: float, unit: Hz }
    dF: { type: float, unit: Hz, default: 0 }
    db: { type: float, unit: Hz, default: 0 }
```

### Source Selection

Use `signal-switch` primitive with `ss` (source select) parameter:

```yaml
# graph.yaml
nodes:
  naturalSource:
    type: lf-source
    params:
      f0: { bind: f0 }

  impulsiveSource:
    type: impulsive-source
    params:
      f0: { bind: f0 }
      oq: { bind: oq }

  sourceSwitch:
    type: signal-switch
    params:
      selector: { bind: ss }

connections:
  - [naturalSource, sourceSwitch]      # input 0
  - [impulsiveSource, sourceSwitch]    # input 1
  - [sourceSwitch, voiceGain]
```

### Reusable from klatt80

The following can be directly reused without changes:

1. **CEL Evaluator** (`cel-evaluator.ts`) - Expression parsing and evaluation
2. **Topological Evaluator** (`topological-evaluator.ts`) - Dependency ordering
3. **JMESPath Resolver** (`jmespath-resolver.ts`) - Nested data access
4. **Runtime Core** (`klatt-runtime.ts`) - Graph instantiation, worklet loading
5. **Interpreter Core** (`klatt-interpreter.ts`) - Track scheduling, parameter automation
6. **Type System** (`types.ts`) - SemanticsDocument, RealizationRule, etc.
7. **Functions** - `dbToLinear()`, `min()`, `max()`, `pow()`
8. **Primitives** - resonator, antiresonator, noise-source, gain, signal-switch

### Suggested Semantics Structure for klsyn88

```yaml
bacon: "0.1"
name: klsyn88

params:
  # Keep all klatt80 params, add:
  TLTdb:
    type: float
    range: [0, 34]
    default: 0
    unit: dB
    description: "Voicing spectral tilt"

  oq:
    type: int
    range: [10, 80]
    default: 50
    unit: percent
    description: "Open quotient"

  Aturb:
    type: float
    range: [0, 80]
    default: 0
    unit: dB
    description: "Turbulent aspiration amplitude"

  # Parallel bandwidths
  p1: { type: float, range: [30, 1000], default: 80, unit: Hz }
  p2: { type: float, range: [40, 1000], default: 200, unit: Hz }
  # ... etc

constants:
  # klsyn88 parallel amplitude scaling factors
  parallelScale:
    A1: 0.4
    A2: 0.15
    A3: 0.06
    A4: 0.04
    A5: 0.022
    A6: 0.03

  # Spectral tilt lookup (0-34 dB)
  lineartilt: [
    0.000, 0.100, 0.167, 0.233, 0.300, 0.367, 0.433, 0.467, 0.500, 0.533,
    0.567, 0.600, 0.633, 0.667, 0.700, 0.730, 0.750, 0.770, 0.790, 0.810,
    0.825, 0.840, 0.855, 0.870, 0.885, 0.900, 0.915, 0.925, 0.935, 0.945,
    0.955, 0.965, 0.975, 0.985, 0.995
  ]

realize:
  # klsyn88-style parallel amplitude
  a1Linear:
    expr: "dbToLinear(A1) * parallelScale.A1"
    deps: [A1]

  turbGain:
    expr: "dbToLinear(G0 + Aturb + ndbScale.AH)"
    deps: [G0, Aturb]
```

## Testing Strategy

When porting a synthesizer, you need test inputs and reference outputs for validation.

### Test File Formats

Different synthesizers use different parameter file formats. Document the format for your synthesizer.

**Example: klsyn88 .klp Format**

```
# Header comments

constant_param    value    # optional comment
constant_param    value

_varied_params_
_msec_    f0    av    F1    ...
0         100   60    500   ...
5         101   60    505   ...
```

**Example: klsyn88 .doc Format (Legacy)**

```
            Synthesis specification for file:    'name.wav'

    Max output signal ... is  X.X dB
    Total number of waveform samples = NNNNN

  CURRENT CONFIGURATION:
    49 parameters

       SYM V/C  MIN   VAL   MAX       SYM V/C  MIN   VAL   MAX
       ------------------------       ------------------------
       sr   C  5000 XXXXX 20000       ...

Varied Parameters:
time   f0   av   ...
   0  XXX  XXX  ...
```

### Generating Reference WAVs

1. Locate the reference C implementation
2. Compile with the same sample rate as your target
3. Generate WAV output for each test file
4. Store as golden outputs for comparison

```bash
# Example for klsyn88
cd ~/src/klsyn
./klsyn doc/shUt.doc -o golden/shUt.wav
```

### Golden Test Selection

Choose test files that exercise the most features. For klsyn88, **shUt.doc** is recommended because it:

- Uses natural glottal source (ss=2)
- Exercises fricative + vowel + stop transitions
- Has time-varying formants
- Uses parallel branch (af, a3-a6)
- Tests source transitions

However, it does **not** test:
- Nasalization
- Aspiration
- Voice quality variations (tilt, skew)
- Cascade-only synthesis

Create additional test files for untested parameters if needed.

### Comparison Methods

1. **Waveform comparison**: RMS difference (should be < 1% for numerical equivalence)
2. **Spectrogram comparison**: Visual inspection for formant structure
3. **Parameter sweep**: Vary one parameter, check expected acoustic change
4. **A/B listening**: Perceptual comparison

### Test Coverage Tracking

Track which parameters are exercised in your test suite:

| Parameter | Static Test | Varied Test | Notes |
|-----------|-------------|-------------|-------|
| f0 | a.doc | a2.doc, shUt.doc | Covered |
| av | a.doc | shUt.doc | Covered |
| F1-F4 | a.doc, i.doc, u.doc | shUt.doc | Covered |
| ah | - | - | NEEDS TEST |
| tl | - | - | NEEDS TEST |

## Porting Checklist

Use this checklist when adding a new synthesizer.

### Phase 1: Analysis

- [ ] Identify all input parameters (name, type, range, default, unit)
- [ ] Identify all constant tables (lookup arrays, scaling factors)
- [ ] Map formulas to CEL expressions where possible
- [ ] Identify state-dependent logic that needs primitives
- [ ] Document differences from existing synthesizers (klatt80)

### Phase 2: YAML Definitions

- [ ] Create `public/experiments/<synth-name>/semantics.yaml`
  - [ ] Define all params with type/range/default/unit
  - [ ] Define constants section with lookup tables
  - [ ] Define realize rules with CEL expressions
- [ ] Create `public/experiments/<synth-name>/graph.yaml`
  - [ ] Define all nodes with type and params
  - [ ] Define connections array
  - [ ] Define outputs array
- [ ] Extend or create `registry.yaml` for new primitives

### Phase 3: Primitives

- [ ] Identify which existing primitives can be reused
- [ ] Implement new primitives (JS worklet or WASM)
- [ ] Register new primitives in registry.yaml
- [ ] Unit test each new primitive in isolation

### Phase 4: Integration

- [ ] Wire YAML files into runtime
- [ ] Implement parameter file parser (if different format)
- [ ] Generate reference WAVs from original implementation
- [ ] Compare output against reference

### Phase 5: Validation

- [ ] All test files produce correct output
- [ ] Parameter sweeps show expected acoustic changes
- [ ] Edge cases handled (zero values, out-of-range)
- [ ] Performance acceptable (no audio glitches)

### Common Pitfalls

1. **Missing dependencies**: Ensure all `deps` are listed in realize rules
2. **Binding vs literal**: Remember `{ bind: X }` vs just `1.0`
3. **Constant access**: Use dot notation for nested constants (`ndbScale.AV`)
4. **Ramp metadata**: Set `ramp: true` for parameters that should interpolate smoothly
5. **Sample rate**: Ensure primitives use the correct sample rate from context

## Reference

### Key Files

| File | Purpose |
|------|---------|
| `public/experiments/klatt80-baseline/semantics.yaml` | Parameter definitions, CEL rules |
| `public/experiments/klatt80-baseline/graph.yaml` | Audio topology, bindings |
| `public/experiments/klatt80-baseline/registry.yaml` | Primitive definitions |
| `src/klatt-runtime.ts` | WebAudio graph builder |
| `src/klatt-interpreter.ts` | Track scheduling, semantics evaluation |
| `src/semantics/cel-evaluator.ts` | CEL expression parser |
| `src/semantics/topological-evaluator.ts` | Dependency ordering |
| `src/builtin-functions.ts` | dbToLinear, proximity, ndbScale |
| `crates/*/src/lib.rs` | WASM primitive implementations |
| `src/worklets/*-processor.ts` | AudioWorklet processor sources (compiled to `public/worklets/`) |

### WASM Primitive API Pattern

All WASM primitives follow this pattern:

```rust
// Constructor
#[no_mangle]
pub extern "C" fn primitive_new(/* init params */) -> *mut Primitive;

// Destructor
#[no_mangle]
pub extern "C" fn primitive_free(ptr: *mut Primitive);

// Parameter setter
#[no_mangle]
pub extern "C" fn primitive_set_params(ptr: *mut Primitive, /* params */);

// Audio processing
#[no_mangle]
pub extern "C" fn primitive_process(
    ptr: *mut Primitive,
    input_ptr: *const f32,
    output_ptr: *mut f32,
    len: usize,
);

// Memory allocation (required for WASM)
klatt_wasm_common::export_alloc_fns!();
```

### Known Limitations

1. **Conditional Routing**: Bacon IR 0.1 supports conditional signal selection via the `signal-switch` primitive (N-to-1 selector). For simpler cases, gain nodes can also serve as switches (0 or 1).

2. **No Computed Bindings**: Cannot use expressions directly in bindings. Create realized rules in semantics instead:
   ```yaml
   # Wrong: { bind: "SW == 1 ? X : Y" }
   # Right: Create a realized rule, then bind to it
   realize:
     switchedValue:
       expr: "SW == 1 ? X : Y"
       deps: [SW, X, Y]
   ```

3. **Static Graph**: The audio graph is built once. Dynamic node creation/destruction requires runtime changes.

### Resources

- [Klatt 1980 JASA Paper](papers/Klatt_1980_CascadeParallelFormantSynthesizer/klatt1980.pdf) - Original synthesizer specification
- [CEL Specification](https://github.com/google/cel-spec) - Expression language reference
- [WebAudio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API) - Browser audio processing
