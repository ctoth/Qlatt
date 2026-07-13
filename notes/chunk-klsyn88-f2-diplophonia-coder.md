# CHUNK F2 — DIPLOPHONIA (DI) — Coder Report (COMPLETE; not committed)

## RESULT: all gates PASS. No git add/commit performed.

- GATE A (no-op byte-identical): PASS. md5(tmp/f2-regress.wav) at DI=0 default =
  `eacf192fb9d7fcaa6c8171ae6fce0d07` == north-star. DI=0 path is bit-identical
  (`sample * 1.0` is exact; no t0 change; skew untouched).
- GATE B (diplophonia signature): PASS (scripts/verify-diplophonia-signature.ts drives the
  COMPILED wasm directly, DI=0 vs DI=50, F0=120/AV=60/OQ=50/source=2). 7/7 checks PASS:
  - Period doubling: DI=0 r(2per)/r(1per)=0.97 (single-period); DI=50 r2/r1=30.84
    (signal repeats every TWO periods — alternate-period timing modulation).
  - Per-period peak |amp| DI=50 = 9173, 4657, 8893, 4516, ... → odd/even ratio 0.508
    ≈ 1−DI/100 = 0.5 (the paper's −6 dB attenuation of the alternate pulse). DI=0 = uniform
    (ratio 1.016).
  - F0/2 subharmonic: DI=50 DFT @60Hz=223.5 vs @120Hz=629.6 (half/fund=0.355); DI=0
    @60Hz=1.44 (half/fund=0.0013). DI=50 F0/2 energy is ~155x the DI=0 control.
- GATE C (test:golden): exit 1 but SOLE failure is scripts/lf-source-wasm-compare.ts
  (maxDelta 0.79, rmsError 0.325) — PRE-EXISTING + UNRELATED (same as F1):
  - per-script exits: klatt-tract-wasm-compare EXIT=0, lf-source-wasm-compare EXIT=1,
    render-phrase EXIT=0.
  - lf-source.wasm + lf-source crate are UNMODIFIED in git (`git status --short` empty for
    them). I never touched lf-source. render-phrase golden (full klsyn88 pipeline) PASSES.
  - NO new failures introduced by F2.

## Files changed
- crates/oversampled-glottal-source/src/lib.rs (DSP: dipl_phase/dipl_amp fields + init;
  pitch_sync_reset DI delay+attenuation block + arg; process_sample arg + 2 reset calls +
  `sample *= dipl_amp`; process arg + per-sample read; FFI ptr/len + slice + call)
- src/worklets/oversampled-glottal-source-processor.ts (diplophonia AudioParam + buffer +
  wasm call arg, positionally AFTER flutter)
- public/worklets/oversampled-glottal-source-processor.js (built from .ts)
- public/worklets/oversampled-glottal-source.wasm (built from crate)
- public/experiments/klsyn88/registry.yaml (diplophonia param, def 0, unit %)
- public/experiments/klsyn88/graph.yaml (glottalSource diplophonia <- DI)
- public/experiments/klsyn88/semantics.yaml (DI frame param, def 0, [0,100], unit %)
- scripts/verify-diplophonia-signature.ts (NEW; reusable feature-signature test)

---

## Implementation (Klatt & Klatt 1990 §3)
On ALTERNATE glottal pulses:
- delay = (DI/100)·(1−OQ/100)·T0  → mean-F0-preserving ± period modulation: the period
  ending at the (delayed) alternate pulse is lengthened by `delay`; the alternate pulse's
  own period is shortened by the same amount. `dipl_phase` toggles each period (0=normal,
  1=alternate). delay clamped to ≤ t0−nopen−1 so the shortened period keeps ≥1 closed
  sample (at DI=100 the closure meets the next opening, per the paper).
- amp_factor = 1 − DI/100 → applied as `dipl_amp` multiply on the glottal sample.
- Shipped klsyn88 C only delays (via Kskew) and never attenuates; DI is its OWN additive
  term, independent of the skew variable (no double-apply). DI=0 ⇒ dipl_amp=1.0, no t0
  change ⇒ byte-identical.
- Default DI=0; dectalk-english untouched (shared crate, no DI binding there).

## Reproduce gates
- A: `node --loader ts-node/esm/transpile-only --experimental-specifier-resolution=node
     scripts/render-phrase.ts --phrase "she sees a dog" --experiment-id klsyn88
     --out-wav tmp/f2-regress.wav --compare-golden 0` then md5 of the wav.
- B: `node --loader ts-node/esm/transpile-only --experimental-specifier-resolution=node
     scripts/verify-diplophonia-signature.ts`
- C: `npm run test:golden` (only pre-existing lf-source failure remains).
- Build: `pwsh -File build.ps1` + `npm run build:worklets`.
