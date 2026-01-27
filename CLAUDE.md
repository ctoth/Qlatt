# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Qlatt is a WebAudio Klatt formant synthesizer with TTS frontend. It implements the Klatt 1980 synthesizer model using WASM-backed AudioWorklets for DSP processing, driven by a declarative YAML-based configuration system.

## Core Principles

- ALWAYS CITE YOUR WORK: when we write code from a paper, cite that paper in the code.

## Build Commands

```bash
# Build WASM modules (required first)
pwsh -File build.ps1          # Windows
./build.sh                     # Unix

# Run dev server
npm run dev                    # Vite server at http://localhost:8000

# Golden tests
npm run test:golden            # Run golden comparison tests

# Build CMU dictionary
npm run build:dict
```

## Testing Audio in Chrome

Dev server: `npm run dev` → `http://localhost:8000`

audio):
```javascript
Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Speak')).click()
```

## Architecture

### Data Flow

```
Text → TTS Frontend → Klatt Track (frames) → Interpreter → WebAudio Graph
```

1. **TTS Frontend** (`src/tts-frontend.js`, `src/tts-frontend-rules.js`)
   - Text normalization and pronunciation lookup (CMU dictionary)
   - Phoneme target generation and prosody rules (F0 contour, duration)
   - Outputs a **track**: array of time-stamped Klatt parameter frames

2. **Runtime/Interpreter System** (`src/klatt-runtime.ts`, `src/klatt-interpreter.ts`)
   - **Runtime**: Creates WebAudio graph from YAML graph definition
   - **Interpreter**: Schedules track frames to AudioParams
   - Uses CEL expressions for parameter derivation (semantics evaluation)

3. **Legacy Synthesizer** (`src/klatt-synth.js`)
   - Standalone implementation with hardcoded graph topology
   - Used by test harness, parallel to runtime system

### Declarative Configuration (Bacon IR)

Configuration lives in `experiments/klatt80-baseline/`:

- **`registry.yaml`**: Primitive node definitions (resonator, gain, etc.)
- **`graph.yaml`**: Audio graph topology (nodes + connections)
- **`semantics.yaml`**: Parameter derivation rules using CEL expressions

### Semantics Evaluation Pipeline

```
src/semantics/
├── types.ts              # Type definitions (SemanticsDocument, etc.)
├── cel-evaluator.ts      # CEL expression evaluation (uses cel-js)
├── topological-evaluator.ts  # Dependency-ordered rule evaluation
└── jmespath-resolver.ts  # JMESPath queries (for nested constants)
```

Key concepts:
- **params**: Input parameters (F0, F1, AV, etc.) with defaults/ranges
- **constants**: Static values (ndbScale offsets, correction tables)
- **realize**: CEL expressions that derive output values (e.g., `voiceGain: dbToLinear(GO + AV + ndbScale.AV)`)

The interpreter:
1. Builds context from frame params + constants + defaults
2. Evaluates realize rules in topological order (respecting deps)
3. Applies realized values to bound AudioParams

### WASM Primitives (crates/)

Rust DSP modules compiled to WASM:
- `resonator` - Two-pole formant filter
- `antiresonator` - Two-zero nasal filter
- `lf-source` - Liljencrants-Fant glottal source
- `decay-envelope` - Exponential decay for PLSTEP bursts
- `edge-detector` - Threshold crossing detector
- `signal-switch` - N-to-1 signal selector

Shared utilities in `crates/klatt-wasm-common/`.

### Builtin Functions

`src/builtin-functions.ts` is the single source of truth for:
- `dbToLinear()` - Klatt dB conversion (6 dB per doubling)
- `proximity()` - Formant proximity correction
- `ndbScale` - Source amplitude scale factors (includes G0 compensation)

These are registered with the CEL evaluator for use in semantics expressions.

## Key References

- Klatt (1980) - Synthesizer specification (PARCOE.FOR, COEWAV.FOR)
- Peterson & Barney (1952) - Canonical vowel formants
- Local reference implementations:
  - `~/src/klatt80/` - Original FORTRAN
  - `~/src/klatt-syn/` - TypeScript implementation (chdh)
  - `~/src/klsyn/` - klsyn88 Nim implementation

## Important Patterns

### Ramp vs Step Parameters

Aspiration (AH) and frication (AF) use `linearRampToValueAtTime` for smooth transitions.
Most other parameters use `setValueAtTime` for instantaneous changes.
The semantics marks ramp params with `ramp: true`.

### PLSTEP Burst Mechanism

Plosive releases inject DC step via edge-detector → decay-envelope chain.
Triggered when AF or AH rises by ≥49 dB between frames.

### SW (Cascade/Parallel Switch)

`SW=0` routes through cascade formant chain (vowels).
`SW=1` enables parallel branch (fricatives, stops).
Critical: Branch gains must use `setValueAtTime`, not ramp, for instantaneous switching.
