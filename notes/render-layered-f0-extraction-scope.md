# renderLayeredF0 → Rust/WASM extraction scope

**Date:** 2026-05-28
**Author:** scout (read-only survey)
**Mission:** Feasibility + phased plan for moving `src/track-assembler.ts` F0 DSP into a `crates/` Rust→WASM module.

Blocker status (summary): **REAL** for the current architecture, **SOLVABLE** but the cost is significant. The sync-WASM problem the 2026-05-24 note describes is confirmed by code; the resolution is not free.

---

## (1) FACTS — DSP operations to extract

All in `src/track-assembler.ts`. Each is pure-numeric, no I/O, no DOM.

### `computeButterworth2Coefficients(cutoffHz, sampleRate)` — line 541
- Inputs: 2 numbers. Output: `{b0,b1,b2,a1,a2}`. Pure, stateless.
- Bilinear-transform Butterworth design. Uses `Math.tan`, `Math.SQRT2`.

### `iirFilter2Pole(input, state, coeffs)` — line 563
- Inputs: scalar, mutable `{x1,x2,y1,y2}` state, coeffs. Output: scalar.
- Mutates state in place (direct-form I, 2-pole). Hot per-sample call.

### `onePoleLowpass(input, state, alpha)` — line 603
- Inputs: scalar, mutable `{y}`, alpha. Output: scalar. Clamps alpha to [0,1].
- `state.y += alpha*(input-state.y)`.

### `createFilterState()` / `createOnePoleFilterState()` — lines 584 / 589
- Trivial zeroed-state constructors. In Rust these collapse into struct `::new()`.

### `interpolateProfile(points, normalizedPosition)` — line 628
- Inputs: `number[]`, scalar [0,1]. Output: scalar. Pure.
- Piecewise-linear lookup over equidistant points.

### `renderLayeredF0(commands, modelConfig, totalDuration, speakerParams?)` — line 658–948
The orchestrator and the real prize. Distinct operations inside:
- **Config resolution (lines 666–748):** reads `frame_period_sec`, filter type (`lowpass_1pole` | `lowpass_2pole`), alpha/cutoff incl. speaker-param path walks, `speaker_scale` (reference/divisor/output_scale/minimum_param/range_param), `base_f0_hz` bias, output clamp min/max. *Throws* `E_F0_MODEL_REQUIRED` on missing fields. This part is config plumbing, NOT DSP.
- **Command bucketing by layer (lines 750–779):** Map building from `modelConfig.layers` (types: `persistent`, `impulse`, `profile`).
- **Filter pre-fill / steady-state seeding (lines 781–816):** sums persistent + profile-at-0 contributions, seeds filter state to avoid startup transient.
- **Per-frame loop (lines 821–935):** for `numFrames = ceil(totalDuration/framePeriod)+1`:
  - command-cursor advance per layer (persistent accum, impulse push with `decay = value/initial_decay_divisor`, profile-point swap);
  - layer summation (profile interpolation at `time/totalDuration`, persistent level, impulse value sum);
  - filter step (1-pole or 2-pole);
  - speaker-scale formula `(f0Minimum + (filtered - f0Reference)*f0ScaleFactor/scaleDivisor)*scaleOutput + baseF0BiasHz` (DECtalk Ph_drwt02.c) or pass-through;
  - clamp to [minHz,maxHz];
  - impulse decay advance per layer: modes `halving` / `linear` / `exponential`, with `termination_threshold` and `exponential_factor`.
- **Output assembly (lines 937–947):** builds `F0Point[]` (`{time,f0,tag:"layered_f0"}`).

State carried across frames: persistent levels (Map), active-impulse arrays (Map), profile data (Map), command cursors (Map), filter state. All numeric/array — WASM-representable.

**Observation:** the inner per-frame loop is the only hot/imperative DSP. The config-resolution block (666–748) is dominated by string param-path walks and dictionary lookups against loosely-typed `speakerParams: Record<string,unknown>` and YAML config — awkward to move to Rust and not performance-sensitive. A clean extraction would resolve config in TS, then call a Rust kernel with already-numeric inputs (frame loop + filters + interpolation + impulse decay).

---

## (2) FACTS — verified call context: SYNCHRONOUS

- `renderLayeredF0` is called at `src/track-assembler.ts:1354`, inside `lowerControlScoreToKlattTrack` (`track-assembler.ts:1315`) — a plain `export function`, no `async`, returns `KlattFrame[]` directly.
- `lowerControlScoreToKlattTrack` is called synchronously at:
  - `src/tts-frontend.ts:586`, inside `buildTextToKlattTrackDetailed` (`tts-frontend.ts:187`) — a plain `function`, no `await` on the call.
  - `scripts/profile-tts-stages.ts:184` (CLI/profiling, sync).
  - `test/track-assembler.test.ts:135` (test harness, sync).
- Public entry points `textToKlattTrackDetailed` (619), `textToKlattTrack` (628), `textToControlScore` (637) — none `async`.

So track assembly is a fully synchronous pipeline. This is the entire DSP-result path used by the explain CLI, tests, and (transitively) the WebAudio scheduling — it produces a frame array, not audio samples.

## (3) FACTS — verified WASM build + load pattern (all ASYNC)

- **Build:** `build.ps1` / `build.sh` run `cargo build --release --target wasm32-unknown-unknown -p <crate>` for 16 crates, then copy `target/.../release/<name>.wasm` → `public/worklets/<name>.wasm`. Each crate exports C-ABI `#[no_mangle]` functions plus `klatt_wasm_common::export_alloc_fns!()` (alloc_f32/dealloc_f32/memory). Pattern shown by `crates/resonator/src/lib.rs` (struct + `_new`/`_free`/`_set_params`/`_process` raw-pointer FFI).
- **Load:** WASM is consumed exclusively inside AudioWorklet processors. `src/worklets/wasm-utils.ts:58` `initWasmModule()` is `async` and uses only `WebAssembly.instantiateStreaming` / `WebAssembly.instantiate(bytes)` — both return Promises. Worklets call it as `.then(...)` (e.g. `aerodynamic-model-processor.ts:126`), and the worklet runs in a not-ready state until the promise resolves.
- **`src/klatt-synth.ts`** loads wasm *bytes* async (fetch, lines ~1094–1107) on the main thread and hands `wasmBytes` into worklet `processorOptions`; instantiation still happens async inside the worklet.
- **Grep result:** `new WebAssembly.Instance` / `new WebAssembly.Module` (the synchronous constructors) appear **nowhere** in the repo. There is zero synchronous-WASM precedent. The 2026-05-24 note (`notes/imperative-and-ugly-rules-investigation.md` line 21) is accurate on this point.

---

## (4) FACTS + RECOMMENDATION — is the sync-WASM blocker real, and what resolves it

### Why it's real
`renderLayeredF0` runs in a synchronous function with no async ancestor up to the public API and the CLI/test callers. The repo's only WASM-load helper (`initWasmModule`) is async. You cannot `await` inside `lowerControlScoreToKlattTrack` without making it (and `buildTextToKlattTrackDetailed`, `textToKlattTrack*`, the explain CLI, every test caller) async — a wide blast radius.

### Why it's nonetheless solvable (FACT about the platform, then RECOMMENDATION)
- FACT: `WebAssembly` has fully **synchronous** constructors — `new WebAssembly.Module(bytes)` and `new WebAssembly.Instance(module, imports)` — usable on the main thread in Node and browsers (the only caveat being the browser 4KB synchronous-compile size limit, which `instantiate` async sidesteps; these DSP crates are tiny, well under typical limits — verify per build). The repo simply never uses them.
- The wasm *bytes* can be acquired once at startup (Node: `fs.readFileSync`; browser: a one-time async fetch during app init, before any synthesis call), and a single module instantiated **synchronously** and reused. The track assembler is single-threaded numeric code, so one shared instance with reset-able state is sufficient.

### RECOMMENDATION — two resolution shapes (pick one before any extraction)
- **Option A — synchronous instance, injected.** Build an `f0-render` crate. At app/CLI/test startup, read the wasm bytes and `new WebAssembly.Instance(new WebAssembly.Module(bytes))` synchronously; store the instance in a module-level singleton (or pass it through `TrackLoweringContext`). `renderLayeredF0` calls the sync instance. No function signature goes async. This matches the existing "instantiate once, reuse" spirit and keeps the whole pipeline sync. Add a sync helper `initWasmModuleSync(bytes)` to `wasm-utils.ts` (new, does not replace the async one — the worklets still need async streaming).
- **Option B — make the assembly path async.** Thread `await` from `renderLayeredF0` up through `lowerControlScoreToKlattTrack` / `buildTextToKlattTrackDetailed` / `textToKlattTrack*` and every caller (CLI, tests). Larger, more invasive, and gains nothing the sync instance doesn't — NOT recommended.

Option A is the principled fit: it preserves the synchronous contract the entire frame-assembly pipeline depends on, and introduces the missing-but-trivial sync-WASM precedent rather than reshaping the call graph.

### Honest cost note
Even Option A is more than a "move the math" task: you must (a) write/own a new crate + FFI surface, (b) marshal arrays across the wasm boundary using the existing `alloc_f32`/`WasmBuffer` pattern, (c) introduce and wire a sync-instantiation path that startup code must populate before first synthesis, and (d) keep the golden tests byte-stable across the f32-vs-f64 boundary (TS uses `Float64Array`/JS doubles in `renderLayeredF0`; the resonator crate is `f32`). The DECtalk speaker-scale formula and clamps must reproduce exactly or golden output shifts. This is why chunk 12 took the "externalize constants, leave algorithm in TS" pragmatic path.

---

## (5) RECOMMENDATION — phased extraction plan (smallest first step first)

**Phase 0 (smallest, lowest-risk, do this first):** Extract the three *pure stateless* helpers `computeButterworth2Coefficients`, `iirFilter2Pole` step, `onePoleLowpass` step, and `interpolateProfile` into a Rust crate `crates/f0-filters` with C-ABI exports, BUT keep `renderLayeredF0`'s orchestration in TS calling the wasm via a synchronously-instantiated instance (Option A). This proves the sync-WASM path end-to-end on the least-stateful, easiest-to-verify functions, with Rust `#[cfg(test)]` unit/property tests asserting coefficient formulas and filter step equality vs the TS reference. Deliverable boundary: one crate, one new `initWasmModuleSync`, golden tests green.
  - Decision before starting: confirm f32 vs f64. If golden parity requires f64, the crate must use `f64` throughout (the existing crates are f32 for audio; F0 is control-rate and precision-sensitive for golden diffs — likely needs f64).

**Phase 1:** Move the entire per-frame loop (lines 821–935: command processing, layer summation, filter step, speaker-scale, clamp, impulse decay) into the crate as a single `render_f0` kernel. TS resolves config (lines 666–748) into a flat numeric struct + layer descriptors, marshals commands as typed arrays, calls the kernel, reads back the `rawF0Values` buffer, and builds `F0Point[]` in TS. This isolates all loosely-typed YAML/`speakerParams` handling on the TS side and gives Rust only numbers.

**Phase 2 (optional):** Move the config resolution + `F0Point[]` assembly too, if a clean numeric ABI for layers/commands proves stable. Lower priority — it's plumbing, not DSP, and per AGENTS.md only *DSP primitives* need to be real imperative code.

Gate every phase on `npm run test:golden` + the `track-assembler.test.ts` suite staying green, and add Rust `#[cfg(test)]` property tests (filter stability, interpolation monotonic-between-points, impulse-decay termination) — these are invariant-bearing numeric functions and warrant hypothesis-style property coverage, not just hand cases.

---

## Relevant files (absolute paths)
- `C:\Users\Q\code\Qlatt\src\track-assembler.ts` — all DSP (541–948) + caller (1315, 1354)
- `C:\Users\Q\code\Qlatt\src\tts-frontend.ts` — sync caller chain (187, 586, 619, 628, 637)
- `C:\Users\Q\code\Qlatt\src\worklets\wasm-utils.ts` — async-only `initWasmModule` (58); `WasmBuffer` marshalling
- `C:\Users\Q\code\Qlatt\src\worklets\aerodynamic-model-processor.ts` — representative async worklet load (126)
- `C:\Users\Q\code\Qlatt\src\klatt-synth.ts` — async wasm bytes fetch (~1094)
- `C:\Users\Q\code\Qlatt\crates\resonator\src\lib.rs` — crate scaffold pattern (FFI + export_alloc_fns!)
- `C:\Users\Q\code\Qlatt\build.ps1` / `build.sh` — 16-crate build+copy
- `C:\Users\Q\code\Qlatt\scripts\profile-tts-stages.ts` (184), `C:\Users\Q\code\Qlatt\test\track-assembler.test.ts` (135) — sync callers
