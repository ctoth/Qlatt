# DECtalk browser worklet OOM

## Current findings

- Chrome reports repeated `WebAssembly.instantiate(): Out of memory` failures while a new 23-worklet graph initializes; only `diff` becomes ready and the other 22 nodes time out.
- The harness normally reuses `state.newRuntime` and `state.newInterpreter` across `speak()` calls.
- Changing experiments calls only `state.newRuntime.disconnect()`, clears the runtime/interpreter references, and then permits a replacement graph to be created.
- `KlattRuntime.disconnect()` currently disconnects AudioNode graph edges only. It does not close AudioWorkletNode message ports, detach telemetry listeners, or tell worklet processors to terminate.
- WASM-backed processors return `true` from `process()` indefinitely. A disconnected old graph can therefore retain its processor and per-node WebAssembly instance after the harness drops its main-thread runtime reference.
- Worklet module registration and WASM byte loading also repeat for each replacement runtime, but the immediate memory-retention question is old AudioWorkletNode processor lifetime, not ordinary repeated `speak()` scheduling.
- The already-open F0 diagnostic correction was verified, typechecked, and committed separately as `fb65d7b9` before this investigation.

## State

- Tracked worktree is clean after `fb65d7b9`; pre-existing untracked files and oracle outputs remain untouched.
- Runtime/worklet OOM diagnosis is active. No runtime source edit has started.

## Next action

- Trace the harness experiment-change event and all runtime replacement paths, then establish a failing lifecycle test showing that replacement explicitly terminates worklet processors and releases main-thread ports/listeners. If confirmed, implement that lifecycle in the existing runtime owner without adding an adapter/helper layer.

## Update: active lifecycle slice

- A new runtime lifecycle regression first failed because `KlattRuntime.disconnect()` only disconnected graph edges. The runtime now posts `{ type: "dispose" }`, closes each AudioWorkletNode port, and disconnects the node; the targeted test passes.
- A second regression proved that two nodes backed by the same worklet WASM URL called `WebAssembly.instantiate` twice. `initWasmModule()` now caches the in-flight/resolved instance per worklet WASM URL and evicts rejected initialization promises. The targeted test proves one instantiation and one shared instance.
- This cache is scoped to the AudioWorklet module realm and directly addresses the 22 identical WASM allocations visible in Chrome. Each processor still owns a separate state pointer, while same-type nodes share the Rust allocator and memory safely on the worklet render thread.
- Current tracked slice includes `src/klatt-runtime.ts`, `src/worklets/wasm-utils.ts`, and `test/klatt-runtime-worklet.test.ts`. It is not committed yet.
- Remaining confirmed retention path: experiment changes overwrite `state.diagEngine` without calling its existing `destroy()`, so the old polling loop and tap manager retain the old runtime.
- Remaining processor-lifetime requirement: worklet processors must honor the posted `dispose` message and return `false` from `process()` so Chrome may terminate them. The TypeScript worklet sources are the authority; `npm run build:worklets` regenerates `public/worklets/*.js`.

## Revised next action

- Add uniform dispose handling to the existing processor classes, destroy/null the diagnostics engine on experiment replacement, regenerate worklets, then run targeted lifecycle tests, worklet build/typechecks, the full suite, and a browser replacement stress check if the local Chrome harness is available.

## Update: processor termination and failed initialization

- All 21 authoritative TypeScript AudioWorkletProcessor classes now recognize `{ type: "dispose" }`, close their processor-side port, and return `false` from the next `process()` call. This gives Chrome an explicit termination signal instead of the previous unconditional keep-alive.
- `test/harness/experiment.js` now calls the existing diagnostics engine `destroy()` method and clears it before disconnecting/releasing an experiment runtime. A new harness lifecycle regression failed before this change and now passes.
- `npm run build:worklets` initially caught an overly narrow WASM cache promise type; the cache type was corrected and all shipped `public/worklets/*.js` files regenerated successfully.
- Source and generated worklet counts both cover all 21 processors (generated TypeScript output formats the `return false` across two lines).
- A new regression showed that runtime creation still resolved after a worklet readiness timeout. `awaitWorkletReady()` has now been changed to collect readiness failures, send dispose to every partially created worklet, close/disconnect them, and throw a single initialization error. This patch has not yet been rerun against the new red test.

## Current next action

- Rerun the targeted lifecycle tests, rebuild worklets after the readiness change, normalize the touched CRLF test file, then run typechecks/full suite and inspect the resulting exact diff before browser stress verification and commit/revert.

## Final result

- Kept and committed as `956bf091 fix(runtime): reuse and dispose worklet wasm`.
- Browser proof: 20 alternating `dectalk-english` / `klatt80-baseline` runtime replacements in one Chrome AudioContext; all 20 graphs initialized (73 DECtalk nodes, 77 baseline nodes), with zero console errors, zero page errors, and zero warnings.
- Static/build proof: `npm run build:worklets`, `npm run typecheck:core`, `npm run typecheck:audio`, and `npm run build` pass.
- Full regression proof: 118 test files and 945 tests pass; 5,400-word audit completed with zero render errors.
- The temporary browser stress script and isolated Vite server were removed/stopped. Notes and pre-existing oracle outputs remained uncommitted.

## Convergence resumed

- Corrected voiced-frame ranking selects `g2p-cake` as the worst single-word F0 target: mean absolute voiced-frame delta 39.061 Hz, max 46.173 Hz.
- `g2p-cake/compare.json` is symbolically exact (`K EY K`, token similarity 1), but oracle F0 is 114.9/140.4/128.704 Hz min/max/mean while Qlatt is 92.759/100.423/94.167 Hz, with nearly matched voiced ratio (delta -0.00448). The pitch discrepancy is therefore not primarily a voicing-duration error.
- Qlatt trace duration is still 84.024 ms shorter for this word, so pitch and timing both remain non-converged; the active target is pitch first per the user's instruction.
- Next action: inspect the exact layered F0 commands and speaker scaling for `cake.` against DECtalk trace frames, then select the first causal pitch parameter/rule rather than applying a global F0 offset.

## 2026-07-20 console-trace follow-up

- The newly supplied Chrome trace is direct evidence of the original per-node WASM failure: `diff` (the JavaScript processor) becomes ready while the other 22 worklets report `WebAssembly.instantiate(): Out of memory` and time out.
- The trace cannot have been emitted by committed runtime `956bf091`: it logs readiness failures as `Warning` and continues through `Klatt runtime initialized successfully`, whereas the current `awaitWorkletReady()` logs `Error`, disposes the partial graph, and throws before applying values or reporting initialization success.
- The harness imports `../../src/klatt-runtime.ts` directly; there is no second checked-in legacy runtime implementation on that page. The trace therefore came from a browser tab/module graph loaded before the fix (or a stale served response), not the current checked-in path.
- Current code does reuse same-type worklet WASM instances within the AudioWorklet module realm and explicitly terminates processors on runtime replacement. The retained browser proof remains 20 alternating experiment replacements with no console/page errors or warnings.

## Current state and next action

- No tracked source changes were made during this follow-up; branch remains at the committed worklet fix plus later DECtalk convergence commits.
- If live confirmation is required, reload/restart the harness so Chrome loads the current module graph and verify that the old `Warning`-then-success signature is absent. Then resume the active `g2p-cake` F0 command-timing investigation.
