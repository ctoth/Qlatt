# CHUNK F1 — FLUTTER (FL) — Coder Report (COMPLETE; not committed)

## RESULT: all gates resolved. No git add/commit performed.
- GATE A (no-op byte-identical): PASS. md5(tmp/flutter-regress.wav) =
  eacf192fb9d7fcaa6c8171ae6fce0d07 == baseline. FL=0 path is bit-identical.
- GATE B (flutter signature): PASS (scripts/verify-flutter-signature.ts drives the
  COMPILED wasm directly). FL=0 ptp=0.039 Hz (flat); FL=50 ptp=3.197 Hz wander
  (eq.1 bound ±3.6 Hz / 7.2 ptp). DFT of F0 contour: 4.7Hz=0.913, 7.1Hz=0.597,
  12.7Hz=0.240 — all three dominate every off-target control bin (max 0.147);
  FL=0 has ~0 energy at those freqs. 5/5 checks PASS.
- GATE C (test:golden): only failure is scripts/lf-source-wasm-compare.ts — a different
  crate (lf-source) I never touched; lf-source.wasm unmodified in git → PRE-EXISTING,
  unrelated. render-phrase (klsyn88 pipeline) and klatt-tract goldens PASS. No regression
  from F1.

## Files changed
- crates/oversampled-glottal-source/src/lib.rs (DSP: output-sample clock + flutter_f0 +
  threading + FFI)
- src/worklets/oversampled-glottal-source-processor.ts (flutter AudioParam + wasm call)
- public/worklets/oversampled-glottal-source-processor.js (built from .ts)
- public/worklets/oversampled-glottal-source.wasm (built from crate)
- public/experiments/klsyn88/registry.yaml (flutter param)
- public/experiments/klsyn88/graph.yaml (flutter <- FL)
- public/experiments/klsyn88/semantics.yaml (FL frame param)
- scripts/verify-flutter-signature.ts (NEW; reusable feature-signature test)

---

# CHUNK F1 — FLUTTER (FL) — Coder Notes (history)

Role: CODER. Add Klatt&Klatt 1990 eq.1 flutter to klsyn88 oversampled glottal source.
No git add/commit.

## Spec
Δf0(t) = (FL/50)*(F0/100)*[sin(2π·12.7t)+sin(2π·7.1t)+sin(2π·4.7t)] Hz, t=sec since start.
f0_eff = F0 + Δf0; use f0_eff for t0. FL=0 → byte-identical (no added term).

## Plan / files to touch
1. crates/oversampled-glottal-source/src/lib.rs — add output_sample_count clock +
   flutter param threaded through process/process_sample/pitch_sync_reset + FFI export.
2. src/worklets/oversampled-glottal-source-processor.ts — add `flutter` AudioParam
   (default 0), thread ptr/len to wasm.
3. registry.yaml — add `flutter` param to oversampled-glottal-source (default 0, unit %).
4. graph.yaml — bind glottalSource `flutter: { bind: FL }`.
5. semantics.yaml — add frame param FL (default 0, range [0,100], unit %); bind direct
   (like `as`/`Kskew` which are bound as raw params, not realized).

## Key findings from recon
- Binding values may be a param name OR a realize name. `as`,`Kskew`,`F0` bound directly
  as params; `avDb` is realized. So `flutter: { bind: FL }` (direct param) works.
- Source runs 4x oversampled internally; process_sample = 1 output sample. So increment
  output_sample_count once per process_sample → t = count/sample_rate.
- pitch_sync_reset called (a) at top of process_sample when t0<=0 (utterance start,
  count=0→t=0) and (b) at period boundary inside the 4x inner loop. Both use current count.
- No-op guarantee: `if flutter > 0.0 { ...f0+delta } else { f0_hz }` returns f0_hz with
  no arithmetic when FL=0 → bit-identical.
- FFI arg order: appended flutter AFTER seed (minimizes disruption), threaded positionally
  in Rust FFI + TS call.

## Gates
A. md5 of tmp/flutter-regress.wav (FL=0) MUST == eacf192fb9d7fcaa6c8171ae6fce0d07
   render: node --loader ts-node/esm/transpile-only ... scripts/render-phrase.ts
     --phrase "she sees a dog" --experiment-id klsyn88 --out-wav tmp/flutter-regress.wav
     --compare-golden 0
B. FL=50 sustained vowel → F0 wander at 12.7/7.1/4.7 Hz, ptp ≈ several Hz.
C. npm run test:golden passes.

## Status
- DONE (lib.rs FULLY EDITED):
  - struct field output_sample_count + new()/reset() init (=0).
  - flutter_f0() helper with full Klatt&Klatt 1990 eq.1 doc comment; returns f0_hz
    unchanged when flutter<=0 (bit-identical no-op).
  - pitch_sync_reset(+flutter arg): computes f0_eff = flutter_f0(...) then t0 from f0_eff.
  - process_sample(+flutter arg): threads to both pitch_sync_reset calls; increments
    output_sample_count once per output sample at end.
  - process(+flutter slice): flutter_val default 0.0 when len==0; passes to process_sample.
  - FFI export oversampled_glottal_source_process(+flutter_ptr/flutter_len after seed).
- NEXT: worklet TS (AudioParam flutter default 0 + ptr/len in wasm call signature + buffer);
  registry.yaml flutter param; graph.yaml flutter<-FL; semantics.yaml FL param; build.ps1;
  gates A/B/C.
- NOTE: FFI arg order = flutter appended AFTER seed, BEFORE voice/noise ptrs. TS call must
  match this positional order exactly.

## DONE (round 2)
- worklet TS: interface sig +flutterPtr/flutterLen; OversampledParamName +"flutter";
  descriptor flutter default 0 [0,100] k-rate; paramBuffers.flutter; flutterValues default
  [0]; flutterLen fillParamBuffer; call passes flutter.ptr/flutterLen after seed.
- registry.yaml: flutter param (default 0, unit %, cite K&K1990 eq.1).
- graph.yaml: glottalSource flutter <- FL.
- semantics.yaml: param FL (default 0, [0,100], unit %, cite). Bound directly (no realize).

## BUILD investigation
- build.ps1 only builds/copies .wasm (not worklet JS).
- worklet JS comes from `npm run build:worklets` = tsc -p tsconfig.worklets.json →
  emits public/worklets/*.js.
- render-phrase.ts has NO direct worklet/wasm refs → uses a node graph runner that loads
  wasm. Need to confirm node render path picks up: (a) new wasm (build.ps1) AND (b) the new
  flutter binding/param. Whether it executes worklet JS or wasm directly under node is the
  open question. NEXT: find render-phrase's graph/runtime import + how it instantiates
  oversampled-glottal-source under node.
- BLOCKER: none yet. Plan: build wasm (build.ps1) + build:worklets, then run gate A (md5).

## BUILD + GATE A RESULTS
- build.ps1 OK (cargo wasm rebuilt + copied to public/worklets). build:worklets OK (tsc).
- node runtime serves worklet JS from public/worklets/*.js (node-runtime.ts:74,
  node-loader.ts http server) — so BOTH builds required. Confirmed.
- GATE A PASS: md5(tmp/flutter-regress.wav) = eacf192fb9d7fcaa6c8171ae6fce0d07 == baseline.
  No-op (FL=0) path is BIT-IDENTICAL.
## GATE C (test:golden)
- Overall exit 1, but the SOLE failure is scripts/lf-source-wasm-compare.ts (exit 1,
  maxDelta 0.79 / rmsError 0.325). PRE-EXISTING + UNRELATED:
  - per-script exits: klatt-tract-wasm-compare EXIT=0, lf-source-wasm-compare EXIT=1,
    render-phrase EXIT=0.
  - lf-source-wasm-compare loads lf-source.wasm (lf-source crate) — I never touched it.
    git status shows lf-source.wasm NOT modified (build.ps1 rebuilt it byte-identical),
    and I did not edit the lf-source crate or compare script. So this failure is
    independent of flutter — NO regression introduced by F1.
  - render-phrase golden (full klsyn88+other pipeline) PASSES → my path is clean.
- My diff is confined to: oversampled-glottal-source crate, its worklet (.ts/.js/.wasm),
  klsyn88 {graph,registry,semantics}.yaml.

## GATE B plan
- render-phrase only takes text. Build scripts/verify-flutter-signature.ts: load the
  compiled oversampled-glottal-source.wasm directly in node, drive constant F0=120/AV=60/
  source=2 for ~1.5s with FL=50 (and FL=0 control), autocorrelation+parabolic-interp F0
  contour, assert ptp wander (several Hz) for FL=50 vs flat for FL=0, and DFT of the F0
  contour shows energy concentrated at 12.7/7.1/4.7 Hz vs off-target control bins.
</content>
</invoke>
