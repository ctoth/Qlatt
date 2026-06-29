# Qlatt klsyn88 Backend — Current Signal Path (Scout Recon)

Reconnaissance for fidelity diff against the published klsyn88 C reference
(`~/src/klsyn/c/parwv.c`, `parwvt.h`). Every claim cites file:line. This is the
"Qlatt side" of the divergence diff.

Experiment dir: `C:\Users\Q\code\Qlatt\public\experiments\klsyn88\`
- `graph.yaml` (topology), `registry.yaml` (primitives), `semantics.yaml` (CEL realize), `tests.yaml`.

---

## TL;DR / corrections to prior recon

- **The glottal source is NOT an LF source.** The graph wires
  `oversampled-glottal-source` (graph.yaml:14-25), implemented by
  `crates/oversampled-glottal-source/src/lib.rs`. This is the klsyn88 *classic*
  4x-oversampled source with 4 selectable shapes (impulsive/natural/triangular/
  square), integrated noise, spectral-tilt filter, and breathiness — a direct
  port of parwv.c, not a Fant LF/Rd model.
- **`Rd`/`lfMode` are NOT passed to any LF worklet.** An `lf-source` primitive
  exists in the registry (registry.yaml:122-141) but is **not referenced** by
  the klsyn88 graph. `Rd` is only a *frontend proxy* param in semantics.yaml
  (lines 162-166) that is mapped onto the native klsyn88 controls `Kopen`
  (effectiveKopen), spectral tilt (effectiveTiltDb), and excitation gain (Ee).
  The prior "uses an LF source with Rd/lfMode/sourceMode" claim is wrong for
  this backend.
- **No KLGLOTT88 / polynomial source exists** anywhere in `crates/` or
  `src/worklets/`. Grep for `KLGLOTT|klglott|polynomial` (case-insensitive)
  returns matches only in `papers/` and `notes/` prose — zero hits under
  `crates/` and zero under `src/`. Nothing to "wire in"; it would have to be
  built from scratch.
- **No SW (signal-switch) node.** klsyn88 graph runs cascade and parallel
  branches in *parallel*, both summed into `outputSum`. (A `signal-switch`
  primitive exists in registry.yaml:143-153 but is unused here.)
- **No AGC node** anywhere in the graph.
- **Scheduling defaults to STEP, not ramp** for this backend — see §7. This is
  a divergence from klatt80-baseline.

---

## 1. Glottal source — `oversampled-glottal-source`

Crate: `crates/oversampled-glottal-source/src/lib.rs`. Worklet:
`src/worklets/oversampled-glottal-source-processor.ts` (compiled to
`public/worklets/oversampled-glottal-source-processor.js`). 0 inputs, **2
outputs**: `output[0]=voice`, `output[1]=noise` (processor header lines 1-6,
registry.yaml:375-376).

Graph binding (graph.yaml:14-25):
```
glottalSource: oversampled-glottal-source
  f0 <- F0          av <- avDb        aturb <- Aturb
  tilt <- effectiveTiltDb   openQuotient <- effectiveKopen
  skew <- Kskew     asymmetry <- as   source <- ss   seed <- seed
```

Worklet constructs WASM with `oversampled_glottal_source_new(sampleRate)`
(processor ts:139) — internal `sample_rate` = the AudioContext rate (22050 by
default, see §7).

### Period / pitch-sync (lib.rs:222-320, `pitch_sync_reset`)
Runs at **4x sample rate** (lib.rs:236):
- `t0 = floor(4 * sample_rate / f0)` (lib.rs:236), min 4.
- `nopen = floor(t0 * open_quotient/100)` (lib.rs:241); clamped: if source∈{1,2}
  and nopen>263 → 263 (lib.rs:243-245); if nopen ≥ t0-1 → t0-2; min 40
  (lib.rs:246-251).
- `nmod = (av_db>0) ? nopen : t0` (lib.rs:253) — av only selects noise-modulation
  window; **voice amplitude scaling is external** (the `voiceGain` GainNode).
- Skew: `kskew = round(Kskew)`, clamped to `t0-nopen`, alternates sign each
  period, `t0 += skew` (lib.rs:293-304).
- Tilt: `tilt = clamp(round(tl_db),0,34)`; `decay = LINEAR_TILT[tilt]`;
  `onemd = 1-decay` (lib.rs:307-311). LINEAR_TILT table at lib.rs:9-14.
- Breathiness gain: `amp_breth = db_to_linear(aturb_db) * 0.1` (lib.rs:239).

### Source shapes (lib.rs:356-392, inner 4x loop)
- **source=1 impulsive**: DOUBLET = `[0, 13e6, -13e6]` (lib.rs:16); emit doublet
  for nper<3 then a 2-pole LP `rgl` (coeffs set lib.rs:262-268) shapes it
  (lib.rs:359-365).
- **source=2 natural (DEFAULT, ss default=2)**: parabolic flow — `a -= b;
  vwave += a; out = vwave*0.03` during open phase, else vwave=0 (lib.rs:366-375).
  Coeffs from B0 table: `b0 = B0_TABLE[nopen-40]; b=b0; a=b0*nopen*0.333`
  (lib.rs:257-259, table lib.rs:37-83).
- **source=3 triangular**: two-slope ramp to afinal=-7000, asymmetry-controlled
  split (lib.rs:271-290 setup, 376-388 gen).
- **source=4 (else) square**: ±1750 (lib.rs:389-391).

Each period end (`nper >= t0`) re-runs pitch_sync_reset (lib.rs:394-406).

### Per-sample post-processing
- 4x **downsample LP** `rlp` 2-pole (coeffs `setabc(sr, 0.095*sr, 0.063*sr)`,
  lib.rs:144, applied 408-412).
- **Tilt filter** 1-pole: `voice = voice*onemd + vlast*decay` (lib.rs:418-419).
- **Breathiness**: during open phase `voice += amp_breth * nrand` (lib.rs:421-424).
- **Noise** (lib.rs:346-353): `nrand = (rand31()>>17) - 8192`;
  `noise = nrand + 0.75*nlast`; halved when `nper > nmod`. RNG is an ANSI-C LCG
  `state = state*1103515245 + 12345 & 0x7fffffff` (lib.rs:207-211), seeded from
  `seed` param (lib.rs:200-205).

`db_to_linear` inside the crate uses `KLSYN_AMPTABLE[round(db)] * 0.001`
(lib.rs:213-220, table lib.rs:17-36) — used only for `amp_breth`. The main
voice/noise gains are applied by external GainNodes (below).

---

## 2. AV → gain scaling (semantics.yaml + builtin)

CEL (semantics.yaml):
```
avDb:      max(AV - 7, 0)                                    (396-398)
voiceGain: dbToLinearKlsyn(max(avDb + eeGainDb, 0))         (400-402)
parVoiceGain: dbToLinearKlsyn(max(AVS + eeGainDb, 0))       (404-406)
aspGain:   dbToLinearKlsyn(AH) * 0.05                        (408-410)
fricGain:  dbToLinearKlsyn(AF) * 0.25                        (412-414)
```
`avDb` is fed BOTH to the source `av` param (graph.yaml:18) and to `voiceGain`.

`dbToLinearKlsyn` (src/builtin-functions.ts:120-124):
```ts
if (!Number.isFinite(db) || db < 0) return 0;
const index = Math.max(0, Math.min(Math.floor(db), klsynAmpTable.length-1));
return klsynAmpTable[index] * 0.001;
```
`klsynAmpTable` from `klattAmpTables.klsynAmpTable` (builtin-functions.ts:106) —
same 88-entry table as the crate's KLSYN_AMPTABLE (lib.rs:17-36). Source:
parwvt.h amptable. Note this is a *table lookup*, NOT the 6 dB/doubling
`dbToLinear` (builtin-functions.ts:112-115) used by other backends.

`eeGainDb` is the Fant-1997 Ee proxy covariation (semantics.yaml:324-330):
`eeCovaryDb = 40*log(max(RdRef,0.3)/effectiveRd)/log(10)` + `EePhraseDb`.

voiceGain → `voiceGain` GainNode (graph.yaml:27-30), applied to source output[0].

---

## 3. Cascade formant chain

Execution order (graph.yaml:300-312):
```
cascadeMix -> nz -> np -> cascadePolarityGain
 -> cascadeF8 -> F7 -> F6 -> F5 -> F4 -> F3 -> F2 -> F1 -> outputSum
```
`cascadeMix` = voiceGain + aspGain (graph.yaml:286-287).

Primitives:
- `nz` = **antiresonator** (graph.yaml:65-76), FNZ/BNZ. Crate
  `crates/antiresonator/src/lib.rs`: 2-zero, coeffs `set_params` lib.rs:27-58
  (`r=exp(-pi*bw/sr)`, normalized `a0=1/(1-b-c)`, `b1=-a0*b`, `b2=-a0*c`);
  difference eq `y = a0*x + b1*x1 + b2*x2` (lib.rs:76). `bypassAtZero` + raised
  `explosionRmsThreshold:1000000` (graph.yaml:66-72).
- `np` = **resonator** FNP/BNP (graph.yaml:77-83).
- `cascadePolarityGain` = ±1, `cascadePolarity = NFCASC%2==0 ? -1 : 1`
  (graph.yaml:85-88, semantics.yaml:463-465).
- `cascadeF8..F4` = **resonator** (graph.yaml:90-128).
- `cascadeF3, cascadeF2` = **fujisaki-resonator** (graph.yaml:130-144).
- `cascadeF1` = **pitch-sync-mod** (graph.yaml:146-156) — see §3b.

**resonator** crate (`crates/resonator/src/lib.rs:27-72`): 2-pole, `c =
-exp(-2pi*bw/sr)`, `b = 2*exp(-pi*bw/sr)*cos(2pi*f/sr)`, `a = 1-b-c`; difference
eq `y = b0*x + a1*y1 + a2*y2` (lib.rs:67). Bypass if freq<0 or freq≥sr/2
(lib.rs:28-40). Coeffs verified == klsyn88 `setabc` in crate test (lib.rs:134-156).

**fujisaki-resonator** crate (`crates/fujisaki-resonator/src/lib.rs`): same 2-pole
setabc (lib.rs:50-53) PLUS history compensation when freq drops: if
`freq_i < prev_freq` then `anorm = freq_i/anorm; y1*=anorm; y2*=anorm`
(lib.rs:55-62). Mirrors parwv.c F2/F3 compensation. Note: rounds freq/bw to int
(lib.rs:45-46); no bypass branch (always filters).

Cascade frequencies gated by NFCASC (semantics.yaml:467-521): each
`cascadeFnFreq/Bw = NFCASC >= n ? Fn : 0`. F7=6500/B7=500, F8=7500/B8=600 are
constants (semantics.yaml:301-304). At default NFCASC=6, F7/F8 freq=0 → bypass.

---

## 3b. cascadeF1 = pitch-sync-mod (F1/B1 pitch-synchronous modulation)

Crate `crates/pitch-sync-mod/src/lib.rs` (struct `PitchSyncResonator`, wasm
`pitch-sync-mod.wasm`). Graph binding (graph.yaml:146-156): f0<-F0,
openQuotient<-effectiveKopen, f1<-F1, b1<-effectiveB1, dF1<-dF1hz, dB1<-dB1hz,
skew<-Kskew, source<-ss.

- Same 4x period model as the source (`t0=floor(4*sr/f0)`, nopen clamp,
  skew) lib.rs:112-149.
- `set_r1` applies setabc + Fujisaki downward-shift compensation on F1
  (lib.rs:100-110).
- `apply_pitch_sync_modulation` (lib.rs:151-178): for impulsive source (ss=1)
  switches F1+dF1/B1+dB1 during closed phase; for others applies the
  dF1/dB1 increment at period boundary during open phase (`f1hzmod/b1hzmod`).
- Output 2-pole `y = a*x + b*y1 + c*y2` (lib.rs:222-225).

`effectiveB1` = `max(B1 + deltaB1, 40)` (semantics.yaml:380-382). `deltaB1`/
`deltaB2` are the Fant-1997 Rd-driven bandwidth widening (semantics.yaml:364-394):
`Ra = max(-1+4.8*effectiveRd,0)`, `deltaB1 = 250*(F1/500)^2*(Ra-RaRef)/12`,
`deltaB2 = deltaB1*F1/(2*F2)`.

---

## 4. Parallel branch (always on, summed — NO switch)

Sources:
- `parVoiceGain` = source[0]*parVoiceGain (graph.yaml:32-35, 281).
- `parallelVoiceMix` = parVoiceGain + aspGain (graph.yaml:290-291).
- `diff` = differentiator(parallelVoiceMix) → "UGLOT1" (graph.yaml:293-294).
- `parallelSourceSum` = diff + fricGain (graph.yaml:297-298).

Resonators (all plain **resonator**, bypassAtZero):
- `parallelF1` (F1/effectiveB1p) and `parallelNasal` (FNP/BNP) fed from
  **parallelVoiceMix** (par_glotout) (graph.yaml:158-172, 314-321).
- `parallelF2..F6` (F2..F6 / effectiveB2p,B3p..B6p) and `parallelBypassGain`
  fed from **parallelSourceSum** (UGLOT1+fric) (graph.yaml:174-212, 323-345).

Parallel gains (semantics.yaml:416-446), **alternating sign** (Klatt parallel
convention):
```
a1Gain = dbToLinearKlsyn(A1)*0.4     anpGain = dbToLinearKlsyn(AN)*0.6
a2Gain = -dbToLinearKlsyn(A2)*0.15   abGain  = dbToLinearKlsyn(AB)*0.05
a3Gain =  dbToLinearKlsyn(A3)*0.06
a4Gain = -dbToLinearKlsyn(A4)*0.04
a5Gain =  dbToLinearKlsyn(A5)*0.022
a6Gain = -dbToLinearKlsyn(A6)*0.03
```
parallelF1Gain + parallelNasalGain → `outputSum` directly (graph.yaml:317,321);
F2-F6 + bypass → `parallelSum` (gain 1.0) → `outputSum` (graph.yaml:326-348).

---

## 5. Aspiration & frication paths

- Both drawn from source **output[1]=noise** (graph.yaml:282-283).
- Aspiration: noise → `aspGain` (`dbToLinearKlsyn(AH)*0.05`) → cascadeMix AND
  parallelVoiceMix (graph.yaml:286-291).
- Frication: noise → `fricGain` (`dbToLinearKlsyn(AF)*0.25`) → parallelSourceSum
  (graph.yaml:298). Frication therefore only excites the parallel F2-F6/bypass
  branch, not the cascade.

PLSTEP burst constants (`plstepThreshold=49`, `plstepBurstOffsetDb=75`) are
declared (semantics.yaml:306-313, 526-532) for the shared interpreter telemetry,
but **no edge-detector / decay-envelope nodes are in this graph** — the burst
chain present in klatt80-baseline is absent here.

---

## 6. Radiation / differentiation / final gain

- **Radiation differentiation**: only the **parallel** voicing path is
  differentiated (`diff`, graph.yaml:293-294). The **cascade** path has NO
  differentiator node. `differentiator-processor.js:41`:
  `out = (x - prev) * scale`, `scale = sampleRate/10000` (js:17). FLAG for diff:
  in the C reference radiation is a global first-difference on the summed output;
  here it is applied only to UGLOT1 pre-parallel-filters and not to cascade.
- **Final gain**: `outputSum -> gain0Gain -> finalPolarityGain` (graph.yaml:350-352).
  - `gain0Db = (GO-3) <= 0 ? 57 : (GO-3)` (semantics.yaml:448-450).
  - `gain0Linear = dbToLinearKlsyn(gain0Db) * 0.000030517578125` (= 1/32768)
    (semantics.yaml:459-461). This 1/32768 is the documented klsyn88 16-bit
    fixed-point → WebAudio float normalization (semantics.yaml:452-458; sources
    emit klsyn-scale values up to ±13e6).
  - `finalPolarityGain = -1.0` (graph.yaml:273-276).
- **No AGC.** Output node = `finalPolarityGain` (graph.yaml:354-355).

---

## 7. Sample rate & frame scheduling

- **Sample rate 22050 default** — `scripts/render-phrase.ts:28`
  `Number(args.get("sample-rate") ?? 22050)`. Worklets read the AudioContext
  `sampleRate` global (e.g. oversampled processor ts:139). The source then runs
  its glottal loop at **4x** that rate internally (lib.rs:236).
- **Scheduling = STEP (setValueAtTime) for ALL params.** klsyn88
  `semantics.yaml` does **not** declare `defaultScheduling` (grep: 0 matches for
  `ramp`), unlike klatt80-baseline which sets `defaultScheduling: ramp`
  (klatt80-baseline/semantics.yaml:10). Interpreter:
  `const defaultRamp = semantics.defaultScheduling === 'ramp'`
  (src/klatt-interpreter.ts:227) → false here. No binding sets `ramp:true`.
  Precedence `step > ramp > defaultScheduling` (klatt-interpreter.ts:267).
  **Divergence candidate**: klsyn88 C interpolates parameters per-frame; this
  backend steps them.

---

## 8. Klatt frame param keys carried by the klsyn88 track

From `semantics.yaml` `params:` block (lines 7-298). These are the accepted
per-frame inputs:

Formants/bw: `F0, F1, F2, F3, F4, F5, F6`; `B1..B6`; parallel `B1p..B6p`.
Nasal: `FNZ, BNZ, FNP, BNP`.
Gains/excitation: `GO, AV, AVS, AH, AF`.
Parallel amplitudes: `A1, A2, A3, A4, A5, A6, AN, AB`.
Voice-quality proxies: `Rd, RdRef, RdPhraseOffset, EePhraseDb, OQ, TL`.
Source/shape: `dF1hz, dB1hz, ss (1-4), Kopen, Kskew, as, Aturb, TLTdb`.
Topology: `NFCASC (1-8)`, `seed`.
Constants (not frame params): `F7=6500,B7=500,F8=7500,B8=600`,
`plstepThreshold=49, plstepBurstOffsetDb=75` (lines 300-313).

---

## Divergence-candidate summary (for the C-side diff)

1. Cascade path lacks radiation differentiation (only parallel UGLOT1 is
   differentiated). graph.yaml:293-294 vs no diff on cascade chain.
2. Parameters are STEP-scheduled, not ramped (no `defaultScheduling: ramp`). §7.
3. No PLSTEP burst chain (edge-detector/decay-envelope) despite constants. §5.
4. `Rd`/`OQ`/`TL`/`Ee` are *proxy* layers on top of native Kopen/tilt/gain
   (semantics.yaml:315-414); confirm these proxies don't perturb fidelity when
   driving the synth from raw klsyn88 params (Kopen/TLTdb/AV directly).
5. Excitation gain coefficients (asp*0.05, fric*0.25, a1*0.4, a2*0.15, …,
   gain0*1/32768) are Qlatt scaling choices to be checked against parwv.c
   COEWAV/amp_gain scaling (semantics.yaml:408-461).
6. fujisaki-resonator and pitch-sync-mod round freq/bw to integers (lib.rs:45-46,
   pitch-sync 196-197) — matches C int math; plain `resonator` does NOT round.

---

## Key files

- Graph: `C:\Users\Q\code\Qlatt\public\experiments\klsyn88\graph.yaml`
- Semantics: `C:\Users\Q\code\Qlatt\public\experiments\klsyn88\semantics.yaml`
- Registry: `C:\Users\Q\code\Qlatt\public\experiments\klsyn88\registry.yaml`
- Tests: `C:\Users\Q\code\Qlatt\public\experiments\klsyn88\tests.yaml`
- Source crate: `C:\Users\Q\code\Qlatt\crates\oversampled-glottal-source\src\lib.rs`
- Source worklet: `C:\Users\Q\code\Qlatt\src\worklets\oversampled-glottal-source-processor.ts`
- pitch-sync F1: `C:\Users\Q\code\Qlatt\crates\pitch-sync-mod\src\lib.rs`
- fujisaki F2/F3: `C:\Users\Q\code\Qlatt\crates\fujisaki-resonator\src\lib.rs`
- resonator: `C:\Users\Q\code\Qlatt\crates\resonator\src\lib.rs`
- antiresonator: `C:\Users\Q\code\Qlatt\crates\antiresonator\src\lib.rs`
- differentiator: `C:\Users\Q\code\Qlatt\public\worklets\differentiator-processor.js`
- dB conversion: `C:\Users\Q\code\Qlatt\src\builtin-functions.ts` (lines 106, 120-124)
- scheduling: `C:\Users\Q\code\Qlatt\src\klatt-interpreter.ts` (lines 227, 267)
- sample rate: `C:\Users\Q\code\Qlatt\scripts\render-phrase.ts:28`
