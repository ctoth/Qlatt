# CHUNK F4 — TRACHEAL POLE-ZERO (FTP/BTP/FTZ/BTZ) — Coder Notes (IN PROGRESS)

Role: CODER. Add Klatt&Klatt 1990 tracheal (subglottal) pole-zero pair to klsyn88 cascade.
Config-only (graph + semantics). NO crate change. NO git add/commit.

## North-star md5 (Gate A): eacf192fb9d7fcaa6c8171ae6fce0d07 ("she sees a dog", klsyn88, SS=2 default)

## FACTS ESTABLISHED (reads complete)

### Cascade structure (public/experiments/klsyn88/graph.yaml)
- Cascade chain: cascadeMix -> nz -> np -> cascadePolarityGain -> cascadeF8 -> F7..F1 -> outputSum
- nasal pair: `nz` (antiresonator, freq<-FNZ bw<-BNZ, bypassAtZero, explosionRmsThreshold 1e6)
  then `np` (resonator, freq<-FNP bw<-BNP, bypassAtZero). Defaults FNZ=FNP=270, BNZ=BNP=90
  -> ALREADY coincident in baseline (they cancel) and the baseline md5 includes them.
- Params bound DIRECTLY (no realize layer): nz.frequency {bind: FNZ}, etc. So FTP/BTP/FTZ/BTZ
  can be plain params bound directly to tz/tp nodes — no realize rules needed.

### Insertion point (mirrors nasal pair, spec §4.2: nasal pole-zero -> tracheal -> F1)
Insert `tz` (antiresonator FTZ/BTZ) then `tp` (resonator FTP/BTP) BETWEEN `np` and
`cascadePolarityGain`. New chain: ... np -> tz -> tp -> cascadePolarityGain -> cascadeF8 ...

### Primitives (registry.yaml) — reuse existing, no change
- resonator: y=b0*x+a1*y1+a2*y2 (b0=a=1-b-c, a1=b, a2=c). setabc math.
- antiresonator: y=a0*x+b1*x1+b2*x2 (a0=1/a, b1=-a0*b, b2=-a0*c). setzeroabc math (inverse).
- COINCIDENT CANCELLATION: H_zero=(1/a)(1-b z^-1-c z^-2); H_pole=a/(1-b z^-1-c z^-2).
  Product=1 exactly in real arithmetic. In f32 there is a sub-LSB rounding residual, but
  final WAV is 16-bit PCM so a <1e-6 residual quantizes to the SAME sample -> expect md5
  byte-identity (same reason the already-coincident nasal pair is stable). Will verify.

### Params/defaults (spec §4.3, Table XII, K&K1990)
FTP 300/2150/3000 Hz; BTP 40/180/1000 Hz; FTZ 300/2150/3000 Hz; BTZ 40/180/2000 Hz.
Coincident default (FTP=FTZ=2150, BTP=BTZ=180) = transparent no-op. No on/off knob.

### Signature script plan (Gate B)
render-phrase.ts has NO per-param override. So mirror verify-flutter-signature.ts pattern:
drive COMPILED public/worklets/antiresonator.wasm + resonator.wasm directly.
- ABI: *_new(), *_set_params(ptr,freq,bw,sr), *_process(ptr,inPtr,outPtr,len), alloc_f32.
- Feed white noise / impulse through tz(FTZ,BTZ)->tp(FTP,BTP). Coincident -> flat spectrum
  (within tol). Separated (FTZ=1500,FTP=2150) -> NOTCH near 1500, PEAK near 2150.

## IMPLEMENTED (round 1) + Gate A FINDING
- graph.yaml: added tz(antiresonator FTZ/BTZ)+tp(resonator FTP/BTP), rewired
  np->tz->tp->cascadePolarityGain. semantics.yaml: added FTP/BTP/FTZ/BTZ params.
- Gate A FAIL with naive coincident binding: md5 47825ceff6931bbd9431c6bd61117d9c != north-star.
  - Reproduced north-star EXACTLY from a temp git-HEAD copy (public/experiments/klsyn88-base)
    = eacf192fb9d7fcaa6c8171ae6fce0d07, confirming baseline faithful.
  - Float residual: maxDelta 1.22e-6 (rms 1.78e-7), peak 0.1256, = 0.04 of a 16-bit LSB.
  - int16 quantized: 82/32171 samples (0.255%) flip by exactly 1 LSB (max diff = 1 LSB).
  - ROOT CAUSE: two extra active f32 IIR biquads. Coincident pole/zero cancel in REAL
    arithmetic (H_zero*H_pole=1 exactly; setzeroabc is exact inverse of setabc — verified)
    but f32 rounding (a*(1/a) != 1, non-associative mults) leaves a ~1.2e-6 residual; 82
    samples sit within 0.04 LSB of a rounding boundary and flip. Not a wiring bug.

## FIX: coincidence-detected bypass (true byte-identity, config-only, honors spec)
Spec intent: "coincident pole+zero => TRANSPARENT, no spectral effect." Make that EXACT
instead of f32-approximate. Add realize rules that route tz/tp frequency to 0 (=> node
bypassAtZero => pure passthrough) when the pair is coincident (FTP==FTZ && BTP==BTZ),
else to the real FTP/FTZ. User-facing params keep spec defaults 2150/180. Separating FTZ
from FTP => non-coincident => real filters => signature. This picks the EXACT output
(input) over the f32-rounded approximation of the same value — mathematically justified.
- VERIFIED bypassAtZero passthrough is exact: both resonator-processor.ts and
  antiresonator-processor.ts do `output[i] = input[i] * gain` (gain=1) when freq<=0;
  the node render backend loads these same compiled public/worklets/*.js. Byte-identical.

## FINAL IMPLEMENTATION (as built)

### Files changed (config-only; NO crate, NO worklet .ts, NO wasm rebuild)
- public/experiments/klsyn88/graph.yaml:
  - Added `tz` (antiresonator, bypassAtZero, explosionRmsThreshold 1e6, freq<-trachealZeroFreq,
    bw<-BTZ) and `tp` (resonator, bypassAtZero, freq<-trachealPoleFreq, bw<-BTP) nodes,
    placed after the nasal pole/zero (np) — mirroring nz/np exactly.
  - Rewired cascade: `np -> cascadePolarityGain` is now `np -> tz -> tp -> cascadePolarityGain`.
    Final cascade: cascadeMix -> nz -> np -> tz -> tp -> polarity -> F8..F1 -> outputSum.
- public/experiments/klsyn88/semantics.yaml:
  - Added params FTP(300/2150/3000), BTP(40/180/1000), FTZ(300/2150/3000), BTZ(40/180/2000),
    cited K&K1990 Table XII.
  - Added realizes: trachealCoincident=(FTP==FTZ && BTP==BTZ)?1:0; trachealZeroFreq=
    coincident?0:FTZ; trachealPoleFreq=coincident?0:FTP. (Coincidence -> freq 0 -> exact
    bypass passthrough; separated -> real freqs.)
- scripts/verify-tracheal-signature.ts: NEW Gate B test (drives compiled antiresonator.wasm
  + resonator.wasm zero->pole, white-noise Goertzel sweep).
- registry.yaml: NOT changed — resonator/antiresonator primitives already present (reused).
- dectalk-english / qlatt-english: untouched. FTP/FTZ default coincident => no-op everywhere.

### GATE RESULTS (all PASS)
- GATE A (no-op byte-identical): PASS. md5("she sees a dog", klsyn88, default) =
  eacf192fb9d7fcaa6c8171ae6fce0d07 == north-star. (Baseline reproduced exactly from a temp
  git-HEAD experiment copy = same md5; temp dir removed afterward.)
  - Note: a NAIVE coincident binding (tz/tp running at 2150/180) was NOT byte-identical
    (md5 47825ceff6931bbd9431c6bd61117d9c): float maxDelta 1.22e-6 (=0.04 LSB) -> 82/32171
    int16 samples flipped by 1 LSB. Inherent f32 IIR cancellation residual, not a wiring
    bug. The coincidence-bypass makes the default an EXACT no-op, so Gate A is fully green.
- GATE B (signature): PASS 6/6. Coincident: 0.000 dB ripple (transparent). Separated
  (FTZ=1500, FTP=2150, BW=180): NOTCH 1500 Hz @ -13.24 dB, PEAK 2150 Hz @ +22.15 dB
  (ref@200Hz -0.07 dB). Notch within 0 Hz of FTZ, peak within 0 Hz of FTP.
- GATE C (test:golden): PASS, EXIT=0 (fully green). resonator/antiresonator/render-phrase
  goldens all within tolerance (render-phrase golden = full klsyn88 pipeline, unchanged).

### Build: no wasm rebuild needed (reused existing resonator/antiresonator primitives;
  no crate or worklet .ts edits). Verified artifacts present in public/worklets.

NO git add/commit performed.
