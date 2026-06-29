# LF-Source Investigation (CHUNK F3 prep)

Read-only investigation. Goal: understand the `scripts/lf-source-wasm-compare.ts` golden
failure and whether it blocks reusing the `lf-source` crate for a klsyn88 LF glottal source.

## VERDICT

**The lf-source path IS usable as-is for CHUNK F3.** The crate is sound, the wasm matches the
crate, and reuse is not blocked.

The golden failure is a **stale TEST SCRIPT**, not a broken crate and not a stale wasm:
- The compare script was written against an OLDER 7-argument `lf_source_process` ABI.
- The crate now exports a 14-argument ABI (oq/tl/flutter/jitter/di were added 2026-03-15).
- The 7-arg call leaves the real `len`/`output_ptr` params as 0, so the function early-returns
  and never writes output. The test then compares golden samples against an all-zero buffer.

A wasm rebuild does NOT fix it (proven: rebuilt wasm is byte-identical to committed). The fix
is to update `scripts/lf-source-wasm-compare.ts` to the new ABI (out of scope for this
read-only investigation; flag for CHUNK F3).

## What the compare script tests

`scripts/lf-source-wasm-compare.ts`:
- Loads `public/worklets/lf-source.wasm`.
- Reads golden `test/golden/klatt_paper.json` -> `lfLm` block:
  - sampleRate 22050, params {f0:110, rd:1, amplitude:1}, 256 samples, max abs 0.790002666.
- Calls `lf_source_new(22050)`, `lf_source_set_mode(state, 1)` (LFLM mode).
- Calls `lf_source_process(...)` and compares output to the 256 golden samples.
- Fails if maxDelta > 1e-5.

Observed run output:
```
{ "sampleRate": 22050, "length": 256, "maxDelta": 0.790002666, "rmsError": 0.325048 }
```
maxDelta 0.790002666 == the golden max-abs exactly. i.e. the wasm wrote ~nothing and the delta
is just the golden signal itself. Exit code 1.

## Root cause: ABI mismatch (script is stale)

Script call site (lines 17-26, 58-66) uses a **7-arg** signature:
```
lf_source_process(state, f0Ptr, f0Len, rdPtr, rdLen, outPtr, len)
```

Current crate (`crates/lf-source/src/lib.rs` lines 421-437) exports a **14-arg** signature:
```
lf_source_process(ptr, f0_ptr, f0_len, rd_ptr, rd_len,
                  oq_ptr, oq_len, tl_ptr, tl_len,
                  flutter, jitter, di, output_ptr, len)
```

With only 7 args supplied, WASM zero-fills the rest. The call effectively becomes:
ptr=state, f0=ok, rd=ok, oq_ptr=outputBuffer.ptr, oq_len=length, tl_*=0,
flutter/jitter/di=0, output_ptr=0, len=0. The function early-returns on `len == 0`
(lib.rs line 438), so the real output buffer is never written -> stays ~zero -> test fails.

## Crate & wasm are in sync (NOT a stale wasm)

- `crates/lf-source/src/lib.rs`   last commit `fa84c772` 2026-03-15 "Add DI parameter ..."
- `public/worklets/lf-source.wasm` last commit `fa84c772` 2026-03-15 (SAME commit)
- `scripts/lf-source-wasm-compare.ts` last commit `c8df1eb1` 2026-02-14 (OLDER, pre oq/tl/DI)
- All three clean in `git status`.

The DI/oq/tl/flutter/jitter params were added to BOTH crate and wasm together (2026-03-15);
the compare script was never updated past 2026-02-14.

wasm exports confirmed present: lf_source_new / lf_source_process / lf_source_set_mode /
lf_source_free + alloc_f32 / dealloc_f32.

### Rebuild test (PROVEN: rebuild is NOT the fix)
- `cargo build --release --target wasm32-unknown-unknown -p lf-source` -> Finished.
- sha256 of freshly built `target/.../lf_source.wasm`:
  `e70b137ac9191e6c6c8b75a576d08f06d7b85a834804ba5f5440cb2412b2b65e`
- sha256 of committed `public/worklets/lf-source.wasm`:
  `e70b137ac9191e6c6c8b75a576d08f06d7b85a834804ba5f5440cb2412b2b65e`
- **Byte-identical.** The committed wasm already reflects the current crate. Rebuilding cannot
  change the (deterministic) test result; it still fails because the SCRIPT is stale.

## Crate sanity (is the LF model usable for F3?)

Yes. `crates/lf-source/src/lib.rs` implements a real, well-cited Fant LF model:
- Fant 1997 Rd->R-param mapping (Ra, Rk, Rg), Eq A1 (lines 189-197).
- OQ derivation OQ=(1+Rk)/(2Rg), with Klatt-1990-style OQ override in % (lines 199-213).
- Glottal formant via Perrotin 2021 Eq C2/C3 biquad (Fg, Bg) (lines 227-251).
- Spectral tilt 1st-order lowpass; TL override = dB down @3kHz (Klatt 1990) (lines 253-268).
- Modes: Legacy(0)/LFLM(1)/LFCALM(2); CALM mapped to causal LFLM for realtime (lines 164-171).
- Extras: flutter (Klatt&Klatt 1990 Eq1), jitter (Fraj 2011), diplophonia DI (Gobl 2003).
- Rust unit tests present (determinism, Rd-derived-OQ vs OQ=65, oq/tl override divergence,
  flutter/jitter, DI). Causal sample-by-sample core (impulse -> glottal biquad -> tilt pole),
  driven by f0 + rd with optional OQ/TL overrides -> exactly what F3 would drive from Klatt
  OQ/SQ.

Caveat (not a defect): it is the Perrotin/CALM **biquad** realization of the LF spectrum, not a
literal time-domain `E0*e^(at)*sin` open-phase + return-phase integrator. It is the standard LF
glottal model, parameterized by Rd / lfMode / OQ / TL, suitable for klsyn88 reuse.

## Bottom line for CHUNK F3
- Reuse the lf-source crate/wasm as-is. No deeper problem, no rebuild needed.
- The golden gate noise from `lf-source-wasm-compare.ts` is a pre-existing stale-script bug
  (7-arg vs 14-arg ABI). Fix that script's call to the current 14-arg signature when convenient;
  it is independent of the F3 reuse work.
