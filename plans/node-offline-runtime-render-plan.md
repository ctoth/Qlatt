# Node Offline Runtime Render Plan

## Goal

Add a true Node-hosted offline renderer for the existing runtime/interpreter stack so
`render-phrase` and the oracle harness can render runtime WAVs without launching a
browser. Keep the browser app intact. Replace the current CLI spike with a clean
backend abstraction.

## Scope

- Keep browser-based interactive rendering unchanged.
- Add a Node WebAudio host for offline runtime WAV rendering.
- Refactor the CLI into a thin wrapper.
- Centralize experiment loading and host-specific asset loading.
- Keep browser fallback explicit and opt-in only.

## Design Principles

1. The browser runtime stays. It remains the interactive host.
2. Node becomes a second host for the same runtime/interpreter core.
3. Backend selection must be polymorphic.
4. Host-specific concerns live at the edge, not in the CLI.
5. Shared runtime code only gets generic extension points.

## Architecture

### Rendering Layers

1. Shared render types and utility helpers.
2. `RenderBackend` implementations.
3. Host adapters (Node runtime, browser fallback, track-only).
4. Thin CLI wrapper.

### Core Contracts

- `RenderRequest`
- `RenderPayload`
- `RenderBackend`

### Backends

1. `TrackOnlyBackend`
   - JSON-only output
   - No audio context
   - Uses `textToKlattTrackDetailed()`

2. `NodeRuntimeBackend`
   - Default backend for runtime WAV rendering
   - Uses `node-web-audio-api`
   - Uses real `createKlattRuntime()` and `createKlattInterpreter()`

3. `BrowserRuntimeBackend`
   - Explicit fallback only
   - Disabled by default
   - Isolated from normal runtime CLI flow

## Shared Modules

### Rendering

- `src/rendering/types.ts`
- `src/rendering/track-summary.ts`
- `src/rendering/write-wav.ts`
- `src/rendering/select-backend.ts`
- `src/rendering/backends/track-only.ts`
- `src/rendering/backends/node-runtime.ts`
- `src/rendering/backends/browser-runtime.ts`

### Experiments

- `src/experiments/load-experiment-config.ts`

This module should:

- Load `public/experiments/manifest.json`
- Resolve `extends`
- Load `graph.yaml`, `semantics.yaml`, and `registry.yaml`
- Merge parent and child config

### Runtime Assets

- `src/runtime-assets/types.ts`
- `src/runtime-assets/browser-loader.ts`
- `src/runtime-assets/node-loader.ts`

This adds an explicit `RuntimeAssetLoader` abstraction:

- `resolveWorkletModule(moduleName)`
- `loadWasmModule(wasmName)`

## Runtime Changes

### Host Injection

`createKlattRuntime()` should accept:

- `audioWorkletNodeCtor?: typeof AudioWorkletNode`
- `assetLoader?: RuntimeAssetLoader`

This avoids mutating `globalThis` and makes host differences explicit.

### Asset Loading

The runtime should stop guessing whether it is in Node or the browser on a
per-call basis. Instead:

- Browser host uses a browser asset loader.
- Node host uses a filesystem asset loader.

Filesystem byte loading remains generic and reusable.

## CLI Responsibilities

`scripts/render-phrase.ts` should only:

1. Parse arguments.
2. Build `RenderRequest`.
3. Select a backend.
4. Run the backend.
5. Write JSON/WAV outputs.
6. Run optional golden comparison.

No host-specific implementation details belong in the CLI.

## Browser Policy

- Browser runtime rendering is not removed.
- Browser fallback remains available for explicit opt-in use.
- Default runtime WAV rendering must use the Node backend.
- No implicit browser launch is allowed.

## Testing

### Unit Tests

- Backend selection
- Experiment inheritance merge
- Node asset loader resolution

### Smoke Tests

- Runtime offline render to WAV in Node with no browser launch
- JSON-only render stays browser-free
- Browser fallback requires explicit opt-in

### Oracle Validation

- `scripts/oracle/adapters/render-qlatt.ts` should continue to call
  `render-phrase.ts` with runtime options and automatically benefit from the new
  Node backend.

## Acceptance Criteria

1. `render-phrase --engine runtime --out-wav ...` renders entirely in Node.
2. No browser process launches for default runtime WAV renders.
3. The browser app remains unchanged for interactive use.
4. `render-phrase.ts` is thin and backend-driven.
5. Host-specific differences are isolated through explicit abstractions.
6. The oracle harness uses the runtime/interpreter path without browser
   automation.

## Implementation Order

1. Extract shared render types/utilities.
2. Add backend abstraction and selection.
3. Centralize experiment loading.
4. Add runtime asset loader abstraction.
5. Add host injection points to the runtime.
6. Implement `NodeRuntimeBackend`.
7. Quarantine browser fallback in `BrowserRuntimeBackend`.
8. Rewrite `render-phrase.ts` as a thin wrapper.
9. Run smoke validation for runtime WAV rendering in Node.
