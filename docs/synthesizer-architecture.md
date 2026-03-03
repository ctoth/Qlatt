# Qlatt Synthesizer Architecture

> This document explains how the synthesizer works so you can implement findings from speech synthesis papers.

## Quick Orientation

Qlatt is a WebAudio Klatt formant synthesizer. It implements the Klatt 1980 cascade/parallel architecture using WASM-backed AudioWorklets for DSP, driven by a declarative YAML configuration system. The architecture separates concerns cleanly: YAML files define *what* the synthesizer is, TypeScript runtime code handles *how* it runs.

When implementing findings from a paper, you typically work at one of three levels:
1. **Parameter derivation** (semantics.yaml) - change how input parameters map to node parameters
2. **Signal topology** (graph.yaml) - add/remove nodes or change connections
3. **DSP algorithms** (crates/) - implement new filter types or sources

Most paper implementations touch only semantics.yaml. New filter types require new WASM crates.

## Data Flow Overview

```
                            YAML Configuration
                                    |
          +-------------------------+-------------------------+
          |                         |                         |
    registry.yaml             graph.yaml             semantics.yaml
    (primitives)              (topology)             (param rules)
          |                         |                         |
          +------------+------------+-------------------------+
                       |
                       v
+------+    +---------------+    +-------------+    +-----------+    +----------+
| Text | -> | TTS Frontend  | -> | Klatt Track | -> |Interpreter| -> | WebAudio |
+------+    | (rules, CMU)  |    | (frames)    |    | (schedule)|    | Graph    |
            +---------------+    +-------------+    +-----------+    +----------+
                                       |                  |
                                       |                  v
                                       |           CEL Evaluator
                                       |           (topological)
                                       |                  |
                                       +------------------+
                                   Frame params + semantics rules
                                        = realized AudioParams
```

**Track**: Array of time-stamped frames, each containing Klatt parameters (F0, F1-F6, AV, AH, AF, etc.)

**Interpreter**: For each frame, evaluates semantics rules to derive node parameters, then schedules AudioParam changes using `setValueAtTime` (step) or `linearRampToValueAtTime` (ramp).

## The Three Configuration Files

The active baseline configuration lives in `public/experiments/klatt80-baseline/`.

### registry.yaml - Available Primitives

Defines all node types the graph can instantiate. Three categories:

| Category | Example | Detection |
|----------|---------|-----------|
| Native WebAudio | `gain`, `constant-source` | Has `native:` field |
| WASM AudioWorklet | `resonator`, `lf-source` | Has both `worklet:` and `wasm:` |
| JS AudioWorklet | `differentiator`, `noise-source` | Has `worklet:` only |

Full primitive list:

| Primitive | Purpose |
|-----------|---------|
| `resonator` | Two-pole formant filter (bandpass) |
| `antiresonator` | Two-zero notch filter (nasal zeros) |
| `lf-source` | Liljencrants-Fant glottal source |
| `impulsive-source` | Doublet impulse glottal source (klsyn88) |
| `triangular-source` | Symmetric triangle glottal source (klsyn88) |
| `square-source` | Pulse waveform glottal source (klsyn88) |
| `oversampled-glottal-source` | 4x oversampled glottal source with tilt |
| `decay-envelope` | Exponential decay for PLSTEP bursts |
| `edge-detector` | Threshold crossing detector |
| `signal-switch` | N-to-1 selector (cascade/parallel) |
| `tilt-filter` | One-pole spectral tilt lowpass (klsyn88) |
| `biquad-notch` | Biquad band-reject filter (nasal antiformants) |
| `pitch-sync-mod` | Pitch-synchronous F1/B1 modulation |
| `fujisaki-resonator` | Resonator with Fujisaki history compensation |
| `reconstruction-filter` | Fixed output reconstruction lowpass |
| `aerodynamic-model` | Stevens & Bickley 1991 aerodynamic coupling |
| `impulse-train` | Periodic impulse source at F0 |
| `noise-source` | Filtered noise for aspiration/frication |
| `differentiator` | First-difference filter (radiation) |
| `glottal-mod` | 50% duty cycle square wave AM |
| `gain` | WebAudio GainNode |
| `constant-source` | Outputs constant value |

### graph.yaml - Audio Topology

Defines node instances and their connections. Signal flow follows Klatt 1980:

```
SOURCES                          GLOTTAL SHAPING              BRANCHES
=======                          ==============               ========
lfSource ----+
             +-> sourceSum -> rgp -> rgz -> radiation ->+
impulseSource+                                          |
                                                        +-> Cascade: F1->F2->...->F6 -> output
noiseSource ----> noiseGain --------------------------->+
                                                        |
fricSource -----> fricGain ---------------------------->+-> Parallel: F1||F2||...||F6 -> output

PLSTEP
======
AF/AH -> edgeDetector -> decayEnvelope ----------------->+-> output
```

**Cascade branch** (SW=0, vowels): Serial formant filters F1-F6, voicing + aspiration mixed.

**Parallel branch** (SW=1, fricatives/stops): Parallel formant filters with per-formant amplitude controls (A1-A6), frication input.

**Branch merge**: Both branches sum at `outputSum`. SW parameter gates which contributes.

**PLSTEP mechanism**: Edge detectors on AF/AH trigger decay envelope when amplitude rises >= 49 dB. Injects transient burst at stop releases.

#### Cascade Branch Detail

```
sourceSum
    |
    +-> rgp -> rgz -> radiation -> voiceGain --> mixer
                                                   |
noiseSource -> noiseGain ------------------------->+
                                                   |
                                                   v
                           nz -> np -> F1 -> F2 -> F3 -> F4 -> F5 -> F6
                                                                      |
                                                                cascadeOutGain
                                                                      |
                                                                  outputSum
```

- `rgp`/`rgz`: Glottal resonator pole/zero (glottal shaping)
- `nz`/`np`: Nasal antiresonator/resonator (nasal coupling)
- `F1-F6`: Serial formant resonators

#### Parallel Branch Detail

```
parallelMixer (voicing + aspiration)
    |
    +-> parallelSourceGain --> parallelF1 -> parallelF1Gain --+
    |                                                          |
    +-> diff -> parallelDiffGain --+-> parallelF2 -> gain ----+
                                   |                           |
fricSource -> parallelFricGain ----+-> parallelF3 -> gain ----+-> parallelSum -> outputSum
                                   |                           |
                                   +-> parallelF4 -> gain ----+
                                   |                           |
                                   +-> parallelF5 -> gain ----+
                                   |                           |
                                   +-> parallelF6 -> gain ----+
                                   |                           |
                                   +-> parallelBypassGain ----+
```

Input routing by formant:
- F1, nasal: UGLOT (voicing + aspiration)
- F2-F4: UGLOT1 (differentiated) + frication
- F5-F6: Frication only
- Bypass (AB): Frication only

### semantics.yaml - Parameter Derivation

Transforms input parameters (from track frames) into node parameters using CEL expressions.

```yaml
params:      # Input parameter definitions with defaults/ranges
constants:   # Static lookup tables (ndbScale, ndbCor, etc.)
realize:     # CEL expressions deriving output values
```

**Key input parameters**:

| Category | Parameters |
|----------|------------|
| Fundamental | `F0`, `Rd`, `lfMode`, `sourceMode` |
| Formants | `F1-F6` (Hz), `B1-B6` (Hz bandwidth) |
| Source amplitudes | `GO`, `AV`, `AH`, `AF`, `AVS` (dB) |
| Parallel amplitudes | `A1-A6`, `AN`, `AB` (dB) |
| Routing | `SW` (0=cascade, 1=parallel) |

**Example derivation chain**:

```yaml
# Voice gain derivation
voiceGain:
  expr: "dbToLinear(GO + AV + ndbScale.AV)"
  deps: [GO, AV]

# Proximity correction (when F2-F1 < 550 Hz)
n12Cor:
  expr: "proximity(F2 - F1)"
  deps: [F1, F2]

# Parallel F2 gain with corrections
a2Linear:
  expr: "-dbToLinear(A2 + n12Cor * 2 + n23Cor + ndbScale.A2) * parallelScale"
  deps: [A2, n12Cor, n23Cor, parallelScale]
```

**Builtin functions** (defined in `src/builtin-functions.ts`):

| Function | Purpose |
|----------|---------|
| `dbToLinear(db)` | Klatt dB to linear (6 dB/doubling, -72 dB = 0) |
| `proximity(delta)` | Formant proximity correction lookup |
| `min(a, b)`, `max(a, b)` | Standard min/max |
| `pow(base, exp)` | Power function |

## Runtime Layer

### Graph Construction

`src/klatt-runtime.ts` creates the WebAudio graph:

1. Load WASM modules from registry
2. Register AudioWorklet processors
3. Create node instances from graph.yaml
4. Build binding map (semantic name -> AudioParam)
5. Connect nodes per graph.yaml connections
6. Apply initial parameter values

### Parameter Scheduling

`src/klatt-interpreter.ts` schedules track frames to AudioParams:

1. **For each frame**: Build evaluation context (params + constants + defaults)
2. **Evaluate semantics**: CEL expressions in topological order
3. **Generate schedule**: List of (time, param, value, ramp) entries
4. **Execute schedule**: Apply to AudioParams

**Ramp vs step**:
- Parameters with `ramp: true` in semantics use `linearRampToValueAtTime` (smooth)
- All others use `setValueAtTime` (instantaneous)
- Currently ramped: `aspGain`, `fricGain`, `fricGainScaled`
- All formants, bandwidths, switches use step

## DSP Primitives

### Inventory

| Crate | Purpose | Key Params |
|-------|---------|------------|
| `resonator` | Two-pole formant filter | frequency, bandwidth |
| `antiresonator` | Two-zero notch filter | frequency, bandwidth |
| `lf-source` | LF glottal source | f0, rd, lfMode |
| `impulsive-source` | Doublet impulse source (klsyn88) | f0, oq |
| `triangular-source` | Symmetric triangle source (klsyn88) | f0, oq |
| `square-source` | Pulse waveform source (klsyn88) | f0, oq |
| `oversampled-glottal-source` | 4x oversampled source with tilt | f0, oq, tilt |
| `decay-envelope` | PLSTEP burst envelope | trigger, amplitude, decay |
| `edge-detector` | PLSTEP trigger | threshold, input |
| `signal-switch` | N-to-1 selector | selector |
| `tilt-filter` | One-pole spectral tilt lowpass | tilt (dB) |
| `biquad-notch` | Band-reject filter | frequency, bandwidth |
| `pitch-sync-mod` | Pitch-synchronous F1/B1 resonator | frequency, bandwidth, dF, db |
| `fujisaki-resonator` | Resonator with history compensation | frequency, bandwidth |
| `reconstruction-filter` | Fixed output reconstruction lowpass | — |
| `aerodynamic-model` | Stevens & Bickley 1991 coupling | (physical params) |

WASM primitives live in `crates/`. Each has:
- Rust implementation (`src/lib.rs`)
- FFI exports (`primitive_new`, `primitive_free`, `primitive_process`)
- AudioWorkletProcessor source in `src/worklets/` (compiled to `public/worklets/`)

### Adding a New Primitive

**Step 1: Create Rust crate**
```bash
cd crates
cargo new --lib my-filter
```

Edit `Cargo.toml`:
```toml
[lib]
crate-type = ["cdylib"]

[dependencies]
klatt-wasm-common = { path = "../klatt-wasm-common" }
```

**Step 2: Implement DSP**
```rust
// crates/my-filter/src/lib.rs
//! My Filter - implements Holmes 1983 eq. 4.2

#[repr(C)]
pub struct MyFilter { /* state */ }

impl MyFilter {
    fn new() -> Self { ... }
    fn process(&mut self, input: &[f32], output: &mut [f32]) { ... }
}

#[no_mangle]
pub extern "C" fn my_filter_new() -> *mut MyFilter { ... }

#[no_mangle]
pub extern "C" fn my_filter_free(ptr: *mut MyFilter) { ... }

#[no_mangle]
pub extern "C" fn my_filter_process(...) { ... }

klatt_wasm_common::export_alloc_fns!();
```

**Step 3: Create AudioWorkletProcessor**
```typescript
// src/worklets/my-filter-processor.ts
import { initWasmModule, WasmBuffer } from "./wasm-utils.js";

class MyFilterProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() { return [{ name: "frequency", ... }]; }
  constructor(options) { /* init WASM */ }
  process(inputs, outputs, parameters) { /* call WASM */ }
}
registerProcessor("my-filter-processor", MyFilterProcessor);
```

**Step 4: Wire it into the build**

- Add the WASM crate to `build.ps1` and `build.sh`
- Run `npm run build:worklets` (or rely on `predev` / `prebuild`) to emit `public/worklets/*.js`

**Step 5: Register in registry.yaml**
```yaml
my-filter:
  description: "Holmes 1983 phase correction"
  worklet: "my-filter-processor.js"
  wasm: "my-filter.wasm"
  params:
    frequency: { type: float, default: 500 }
```

**Step 6: Add to graph.yaml** (nodes + connections)

**Step 7: Add to semantics.yaml** (if new params needed)

## Common Implementation Patterns

### "Paper says add a new filter type"

1. Create WASM crate in `crates/` following resonator as template
2. Cite the paper in the Rust doc comment
3. Create the AudioWorkletProcessor in `src/worklets/` and compile it into `public/worklets/`
4. Add to registry.yaml
5. Wire into graph.yaml where needed
6. Add parameter derivation to semantics.yaml if needed

### "Paper says change how parameter X is derived"

1. Find the realize rule in semantics.yaml
2. Modify the `expr:` CEL expression
3. Update `deps:` if dependencies changed
4. If new builtin function needed:
   - Add to `src/builtin-functions.ts`
   - Register in runtime and interpreter

### "Paper says change signal routing"

1. Edit graph.yaml:
   - Add/remove nodes in `nodes:` section
   - Add/remove/modify `connections:` section
2. Bind new params with `{ bind: semanticName }`
3. Add realize rules in semantics.yaml if needed

### "Paper says add a new control parameter"

1. Add to semantics.yaml `params:`:
   ```yaml
   myNewParam:
     type: float
     range: [0, 100]
     default: 50
   ```
2. Add realize rule if derivation needed:
   ```yaml
   myDerivedValue:
     expr: "dbToLinear(myNewParam + someOffset)"
     deps: [myNewParam]
   ```
3. Bind in graph.yaml:
   ```yaml
   myNode:
     params:
       gain: { bind: myDerivedValue }
   ```
4. TTS frontend can now set `myNewParam` in track frames

## Key Files Reference

| File | Purpose | When to modify |
|------|---------|----------------|
| `public/experiments/klatt80-baseline/registry.yaml` | Primitive definitions | Adding new node types |
| `public/experiments/klatt80-baseline/graph.yaml` | Audio topology | Changing signal routing |
| `public/experiments/klatt80-baseline/semantics.yaml` | Parameter derivation | Changing how params map to nodes |
| `src/klatt-runtime.ts` | Graph construction | Changing how graph is built |
| `src/klatt-interpreter.ts` | Parameter scheduling | Changing how params are scheduled |
| `src/builtin-functions.ts` | CEL functions | Adding new derivation functions |
| `src/semantics/cel-evaluator.ts` | Expression evaluation | Changing CEL behavior |
| `crates/*/src/lib.rs` | DSP algorithms | Implementing new filter types |
| `src/worklets/*-processor.ts` | AudioWorklet wrapper sources | Matching new crates |

## Gotchas and Tips

1. **Ramp vs step matters for clicks**: Branch switches (SW, cascade/parallel gains) must use step, not ramp, or you get clicks during transitions.

2. **PLSTEP threshold is 49 dB**: The edge detector fires when AF or AH rises by >= 49 dB between frames. If your stops don't have bursts, check the amplitude delta.

3. **ndbScale includes G0 compensation**: The -47 offset in ndbScale values compensates for G0's default of 47 dB. Don't double-compensate.

4. **Proximity corrections are asymmetric**: n12Cor uses `F2-F1`, n23Cor uses `F3-F2-50`, n34Cor uses `F4-F3-150`. The offsets are intentional (Klatt 80).

5. **Cascade order doesn't matter mathematically**: Graph uses F1->F6 order. Original FORTRAN used F6->F1 "to minimize transients" but transfer function is identical.

6. **CEL dependency declaration is manual**: If your expression uses a variable, it must be in `deps:` or evaluation order may be wrong.

7. **Build WASM before testing**: `pwsh -File build.ps1` must complete before `npm run dev` will work with new primitives.

8. **Cite your sources**: Per project principles, always cite the paper in code when implementing findings.

## Further Reading

- `CLAUDE.md` - Project principles and build commands
- `docs/parameter-scheduling.md` - Detailed scheduling documentation
- `reports/infra-scout-*.md` - Detailed layer reports this document synthesizes
- Klatt (1980) - Original synthesizer specification
- `~/src/klatt80/` - Original FORTRAN reference
- `~/src/klsyn/` - klsyn88 Nim implementation reference
