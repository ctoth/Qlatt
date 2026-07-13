# f0-filters extraction — coder notes

**Date:** 2026-05-29
**Branch:** renderlayeredf0-crate
**Mission:** Extract renderLayeredF0 per-frame DSP into Rust→WASM crate `crates/f0-filters`, synchronous instance (Option A), byte-exact parity.

## State: IN PROGRESS — surveying before writing

## Verified facts so far
- Plan = `notes/render-layered-f0-extraction-scope.md`. Implement Option A + Phase 1.
- DSP lives in `src/track-assembler.ts` lines 530–948.
  - `computeButterworth2Coefficients` 541 (pure)
  - `iirFilter2Pole` 563 (stateful, direct-form I)
  - `onePoleLowpass` 603 (clamps alpha [0,1])
  - `interpolateProfile` 628 (piecewise linear, equidistant points)
  - `renderLayeredF0` 658–948: config resolve 666–748 (STAYS in TS), command bucketing 750–779, prefill 781–816, per-frame loop 821–935, output assembly 937–947.
- All math is JS doubles / Float64Array → **f64 in Rust** required for parity.
- Per-frame loop details:
  - layer types: persistent / impulse / profile
  - impulse decay modes: halving / linear / exponential; termination_threshold; exponential_factor
  - impulse push: decay = value / initial_decay_divisor; remainingFrames = durationFrames
  - command bucketing per layer, cursor advance `cmds[cursor].time <= time + framePeriod*0.5`
  - prefill: sum persistent (time<=framePeriod*0.5) + profile-at-0; seed filter state
  - filtered → speaker scale (if scaleConfig) → clamp [minHz,maxHz]
- Resonator crate pattern: `#[repr(C)]` struct, `#[no_mangle] extern "C"` new/free/set/process raw-ptr FFI, `klatt_wasm_common::export_alloc_fns!()`. crate-type cdylib, dep klatt-wasm-common path.
- wasm-utils.ts: `initWasmModule` is async (instantiateStreaming/instantiate). `export_alloc_fns!` gives memory + alloc_f32/dealloc_f32 (f32!). Need f64 alloc OR reuse f32 alloc and view as Float64Array (alloc by element count differs). WasmBuffer is Float32Array-typed.

## Open questions / next reads
- Read klatt-wasm-common export_alloc_fns! to see if there's alloc_f64 or only f32.
- Read build.ps1 / build.sh crate list + copy pattern.
- Read types: F0LayerCommand, LayeredF0ModelConfig, F0Point, constants (defaults).
- Find how to select dectalk frontend (test/dectalk-e2e.test.ts).
- Establish baseline: npm test count, fingerprint script.

## Survey COMPLETE — all types/constants/build known
- Defaults (track-assembler.ts): MIN_HZ=50, MAX_HZ=500, SCALE_DIVISOR=4096, SCALE_OUTPUT=0.1, INITIAL_DECAY_DIVISOR=4, TERMINATION_THRESHOLD=0.01, EXPONENTIAL_FACTOR=0.9.
- LayerType = profile|persistent|impulse. DecayMode = halving|linear|exponential.
- export_alloc_fns! only gives alloc_f32/dealloc_f32 (f32). For f64 I will add my own alloc_f64/dealloc_f64 exports in the crate (alloc by byte size via Vec<f64>), OR alloc_f32(2*n) and view as Float64Array. Decision: add alloc_f64/dealloc_f64 to the crate directly (cleaner; keeps common macro untouched).
- build.ps1/build.sh: add `cargo build ... -p f0-filters` + copy f0_filters.wasm -> public/worklets/f0-filters.wasm.
- dectalk selection: textToKlattTrack(phrase, baseF0, transitionMs, { frontendId: "dectalk-english" }). Frame F0 is frame.params.F0.
- Fingerprint script written: scripts/f0-fingerprint.ts (dumps IEEE-754 hex of time+F0 for every frame, 12 phrases x 3 configs, dectalk-english).

## Plan for kernel ABI (Option A + Phase 1)
TS resolves config (666-748) → flat numbers. Then marshal to a single `render_f0` kernel:
- scalar inputs: framePeriod, totalDuration, numFrames, usesOnePole(0/1), onePoleAlpha, b0,b1,b2,a1,a2 (2pole coeffs), hasScale(0/1), f0Minimum, f0ScaleFactor, f0Reference, scaleDivisor, scaleOutput, baseF0BiasHz, minHz, maxHz, initTotal (prefill).
- layers: arrays. Per layer: type(0=profile,1=persistent,2=impulse), decayMode, initial_decay_divisor, termination_threshold, exponential_factor. Plus commands per layer sorted by time: time, value, durationFrames, profilePoints(variable len).
- output: rawF0Values f64[numFrames] read back.
- TS builds F0Point[] from rawF0Values (assembly stays in TS per plan).
NOTE: command bucketing/cursor logic must move into kernel too (it's part of per-frame loop 821-935). Commands already filtered per layer in TS bucketing (750-779) — that's cheap plumbing; I can do bucketing in TS and pass per-layer command arrays, OR pass all + layer index. Simpler: TS buckets per layer (preserving order), passes flattened per-layer command arrays + offsets. Prefill (781-816) computed in TS as initTotal and passed in (matches scope: prefill uses interpolateProfile which moves to crate, but initTotal is a single number — compute in TS using same interpolate? NO — must be byte-identical; interpolateProfile at pos 0 returns points[0] exactly, so initTotal = sum of persistent cmd.value (time<=fp*0.5) + profile points[0]. That's exact in TS. Keep prefill in TS, pass initTotal.)

## BASELINES CAPTURED (pre-change)
- npm test: 125 files / **1109 tests passed**. (~104s)
- Fingerprint baseline: notes/f0-baseline.fingerprint.txt (10211 lines, IEEE-754 hex).

## CRATE CREATED + BUILT + TESTED
- crates/f0-filters/{Cargo.toml,src/lib.rs} created. Added to workspace Cargo.toml.
- crate-type = ["cdylib","rlib"] so native cargo test works.
- f64 throughout. Kernel `render_f0` FFI: scalars[19] f64 + layers (stride 7) + cmds (stride 5) + profiles pool + out[num_frames]. Plus alloc_f64/dealloc_f64 exports (own, not from common macro) and export_alloc_fns! for f32 memory export.
- `cargo test -p f0-filters`: **9 passed** (butterworth hand-computed + DC gain, iir stability/convergence, one-pole clamp/monotonic, interpolate endpoints/monotonic, impulse halving/exponential termination, persistent accumulate+clamp).
- WASM built + copied to public/worklets/f0-filters.wasm (33063 bytes, well under any sync-compile limit). build.ps1/build.sh updated.

## NEXT: wire TS
- Add initWasmModuleSync(bytes) to wasm-utils.ts (new; do NOT touch async one).
- Module-level singleton in track-assembler.ts: read f0-filters.wasm bytes (Node fs.readFileSync; browser fetch at init). Sync instantiate.
- In renderLayeredF0: keep config resolve (666-748) + bucketing + prefill initTotal in TS. Marshal to kernel, read back rawF0Values, build F0Point[] in TS.
- Marshalling: layer_type map profile=0/persistent=1/impulse=2; decay halving=0/linear=1/exponential=2. Buckets preserve push order; flatten cmds per-layer with cmd_start/cmd_count; pool profilePoints.
- Then: re-run fingerprint -> diff vs baseline (MUST be identical). Re-run npm test (must be 1109).

## TS WIRING DONE (pending verification)
- Added `initWasmModuleSync(bytes, imports)` to src/worklets/wasm-utils.ts (new; async untouched).
- New src/f0-filters-loader.ts: getF0FilterExports() singleton; Node fs.readFileSync of public/worklets/f0-filters.wasm (resolves ../public or ../../public from import.meta.url); setF0FilterWasmBytes(bytes) for browser inject.
- track-assembler.ts renderLayeredF0: config resolve + bucketing + prefill(initTotal) stay in TS. Removed filterState/onePoleState objects. Marshalled scalars[19]+layers+cmds+profiles to kernel via alloc_f64; render_f0; read back rawF0Values; dealloc all. Validation throws (durationFrames, decay required) moved into marshalling loop to preserve identical error behavior.
- Kept exported helpers computeButterworth2Coefficients/iirFilter2Pole/createFilterState (test imports them). Removed now-dead local type ActiveImpulse. onePoleLowpass/createOnePoleFilterState still exported (harmless).
- Import getF0FilterExports added to track-assembler.ts.

## NEXT (verify gates)
1. Re-run fingerprint -> diff vs notes/f0-baseline.fingerprint.txt -> MUST be IDENTICAL.
2. npm test -> MUST be 1109.
3. Risk: marshalling order vs TS. Layer order = Object.keys (same). Cmd order = push order (same). Summation order same. f64 throughout. interpolate at pos0 == points[0] exact so initTotal in TS matches kernel.

## RESULT: PARITY-CONFIRMED (2026-05-29)

### Gate 1 — byte-exact parity: IDENTICAL
- scripts/f0-fingerprint.ts: 12 phrases x 3 (baseF0,transition) configs, dectalk-english, dumps IEEE-754 hex of time+F0 for every frame (10211 lines).
- Pre-change baseline vs post-change: `diff` exit 0, ZERO differing lines. BYTE-EXACT.
- First attempt failed (ReferenceError: require is not defined — ESM). Fixed loader to use path-utils.readBinaryFromFsSync (the repo's established Node-fs binary asset probe). Second attempt: identical.
- (Raw .txt dumps removed after confirmation; re-derivable from the committed script.)

### Gate 2 — vitest: 125 files / 1109 tests passed BEFORE and AFTER (unchanged).

### Gate 3 — cargo test -p f0-filters: 9 passed, 0 failed.
(butterworth hand-computed eq + DC unity gain; iir2pole stability+convergence; one-pole alpha clamp+monotonic convergence; interpolate endpoints + monotonic-between-points; impulse halving + exponential termination; persistent accumulate+clamp.)

### f32 vs f64 decision: f64 (evidence)
TS uses JS doubles / Float64Array; F0 is control-rate + golden-sensitive. Kernel uses f64 throughout, FFI buffers are f64 (own alloc_f64/dealloc_f64). Empirically: f64 gives byte-exact (Gate 1 IDENTICAL). f32 was not attempted because doubles are required for bit parity and parity held on first f64 run.

### Files changed
- Cargo.toml (added crates/f0-filters member)
- crates/f0-filters/Cargo.toml (new)
- crates/f0-filters/src/lib.rs (new — kernel + 9 tests)
- build.ps1, build.sh (added f0-filters build + copy lines)
- src/worklets/wasm-utils.ts (added initWasmModuleSync; async helper untouched)
- src/f0-filters-loader.ts (new — sync singleton loader)
- src/track-assembler.ts (renderLayeredF0 per-frame loop -> kernel call; removed dead ActiveImpulse type; kept exported helpers used by tests)
- public/worklets/f0-filters.wasm (new build artifact, 33063 bytes)
- scripts/f0-fingerprint.ts (new — parity harness)
- notes/f0-filters-extraction-coder.md (this report)

## Blocker: NONE. Extraction complete.

---

## CODEX REVIEW FIXES (2026-05-29) — IN PROGRESS

Review: notes/f0-filters-codex-review.md (CHANGES-REQUIRED). Fixing all.

### Done (edits made, not yet re-verified):
- MED durationFrames trigger (track-assembler.ts): no longer validate EVERY impulse cmd. maxProcessThreshold = (numFrames-1)*framePeriod + framePeriod*0.5; cursorLive freezes at first unreachable / NaN-time cmd; requirePositiveModelNumber only on reachable cmds (matches master). Unreachable: raw finite duration or 0, never throw.
- MED unknown decay no-op: DECAY_MODE_CODES[cfg.decay] ?? DECAY_MODE_UNKNOWN(-1). Kept `if (!cfg.decay) throw`. Kernel decay match `_ => {}` → -1 no-op = master.
- MED try/finally frees: pointer records init {ptr:0,len:0}; render_f0+readback in try; finally frees every nonzero ptr.
- MED Rust FFI validation: render_f0 returns i32. RENDER_OK=0, ERR_SCALARS=-1, ERR_OUT=-2, ERR_BUFFER=-3 (null ptr w/ nonzero count OR stride mul overflow), ERR_CMD_RANGE=-4, ERR_PROFILE_RANGE=-5. Validated BEFORE any slice/index; checked_mul/checked_add.
- TS interface: render_f0 returns number; exported RENDER_OK const.

### Done (continued):
- LOW initWasmModuleSync: now passes ArrayBufferView through unchanged (honors byteOffset/byteLength); only ArrayBuffer used as-is.
- TS render_f0 return check: status !== RENDER_OK → throw E_F0_RENDER_FAILED.
- HIGH browser preload: added preloadF0Filters(wasmUrl) + isF0FilterLoaded() to loader (fetch+setF0FilterWasmBytes, idempotent). Wired:
  - test/harness/runtime.js speak(): await preloadF0Filters(`${WORKLET_BASE_PATH}f0-filters.wasm`) before textToKlattTrack.
  - test/render-offline.html renderOffline(): await preload before textToKlattTrackDetailed (when not precomputed track). URL = `${BASE_URL}worklets/f0-filters.wasm`.
  - STILL TODO: test/render-runtime-offline.html (same pattern, line 31). 

### TODO (remaining):
- HIGH: wire preload into test/render-runtime-offline.html renderOffline (line ~31).
- cargo test: add shape-validation status-code tests + unknown-decay no-op test.
- Node vitest test: getF0FilterExports throws clear error when bytes absent in non-Node sim; works after setF0FilterWasmBytes. (Tricky — isNodeRuntime true in vitest so absent-bytes path not hit. May test loader API surface differently or via render_f0 status codes + a malformed-input vitest.)
- Rebuild wasm + copy. Re-run fingerprint diff (IDENTICAL), npm test (1109), cargo test.

### Observations:
- render-offline.html / render-runtime-offline.html default frontendId=qlatt-english (point_interpolation, no kernel) but accept dectalk-english param → must preload to be safe.

### Progress (round 2):
- All 6 codex findings now have edits: durationFrames trigger, unknown-decay no-op, try/finally frees, Rust FFI status codes, initWasmModuleSync byteOffset, browser preload (runtime.js + both offline HTMLs), TS render_f0 status check.
- cargo test -p f0-filters: 17 passed (9 original + 8 new: unknown-decay no-op + 6 FFI status-code cases + out-untouched-on-error).
- WASM rebuilt + copied (33191 bytes, was 33063 — return-code + validation added).
- New test/f0-filters-loader.test.ts: loader loads in Node, isF0FilterLoaded, setF0FilterWasmBytes re-instantiate, render_f0 RENDER_OK + 5 error codes + out-untouched.

### IMPORTANT — parity baseline:
- HEAD does NOT contain the extraction (all uncommitted in working tree, `git show HEAD:...track-assembler.ts | grep getF0FilterExports` = 0). So `git worktree add <tmp> HEAD` gives pristine master.
- Plan: worktree at HEAD → run fingerprint there = TRUE pre-change baseline → run fingerprint in main tree (post all fixes) → diff MUST be IDENTICAL. Then npm test (1109).
- Do NOT git stash (shared tree; existing stashes belong to others/other work).

## CODEX REVIEW FIXES — RESULT: ALL-GREEN (2026-05-29)

### Gate 1 — parity STILL byte-identical to master: IDENTICAL
- Generated a TRUE pre-change master baseline via `git worktree add --detach ../Qlatt-master-baseline HEAD` (HEAD has no extraction), junction-linked node_modules, ran scripts/f0-fingerprint.ts there → 10211 lines.
- Ran fingerprint in main tree (post all 6 fixes) → 10211 lines.
- `diff master-baseline post-fix` → exit 0, ZERO differing lines. The MED/LOW fixes are no-ops for valid input, confirmed empirically.
- Worktree + junction + temp .txt/.diff removed after.

### Gate 2 — vitest: 126 files / 1117 tests passed.
- 1109 original (unchanged) + 8 new in test/f0-filters-loader.test.ts.

### Gate 3 — cargo test -p f0-filters: 17 passed, 0 failed.
- 9 original + 8 new: unknown_decay_mode_is_noop; render_f0 ok/err-scalars/err-out/err-buffer/err-cmd-range/err-profile-range; does-not-touch-out-on-error.

### All 6 codex findings fixed:
1. HIGH browser preload: preloadF0Filters(url)+isF0FilterLoaded() in loader; wired into test/harness/runtime.js speak(), test/render-offline.html, test/render-runtime-offline.html (all await preload before sync textToKlattTrack*). Loader keeps absent-bytes error for true missing preload.
2. MED durationFrames trigger: validate only frame-loop-reachable impulse cmds (maxProcessThreshold + cursorLive freeze on first unreachable/NaN-time cmd) = master.
3. MED unknown decay no-op: sentinel DECAY_MODE_UNKNOWN(-1) → kernel `_ => {}` = master no-op. `if (!cfg.decay) throw` kept.
4. MED try/finally frees: every nonzero ptr freed in finally even on trap/throw.
5. MED Rust FFI validation: render_f0 returns i32 status; ALL shape checks (null-on-nonzero-count, checked stride mul, cmd_start+cmd_count<=n_cmds, profile range<=n_profiles) BEFORE any slice/index; out untouched on error. TS throws E_F0_RENDER_FAILED if status != RENDER_OK.
6. LOW initWasmModuleSync: ArrayBufferView passed through (byteOffset/byteLength honored).

### Files changed (round 2):
- crates/f0-filters/src/lib.rs (render_f0 → i32 + status codes + range validation; +8 tests)
- src/track-assembler.ts (reachability-based duration validation; unknown-decay sentinel; try/finally frees; status-code check + RENDER_OK import)
- src/f0-filters-loader.ts (RENDER_OK export; render_f0 returns number; isF0FilterLoaded; preloadF0Filters)
- src/worklets/wasm-utils.ts (initWasmModuleSync byteOffset fix)
- test/harness/runtime.js (preload in speak())
- test/render-offline.html, test/render-runtime-offline.html (preload before sync render)
- test/f0-filters-loader.test.ts (NEW — 8 tests)
- public/worklets/f0-filters.wasm (rebuilt, 33191 bytes)

### Blocker: NONE. All gates green.
