# CHUNK F3 — LF GLOTTAL SOURCE (SS=3) + SPEED QUOTIENT (SQ) — Coder Notes (IN PROGRESS)

Role: CODER. Add Fant LF source as klsyn88 source option SS=3, driven by Klatt OQ/SQ.
No git add/commit. Report gates here.

## STATUS: investigation done, design forming. Not yet implemented.

## Key facts established

### The crate is ready (notes/klsyn88-lf-source-investigation.md confirmed by reading lib.rs)
- crates/lf-source/src/lib.rs exports 14-arg `lf_source_process`:
  (ptr, f0_ptr, f0_len, rd_ptr, rd_len, oq_ptr, oq_len, tl_ptr, tl_len,
   flutter, jitter, di, output_ptr, len)
- It is a Perrotin-2021 CALM biquad realization of the Fant LF spectrum (NOT time-domain
  E0·e^(αt)·sin). Driven by f0 + rd, with OPTIONAL oq override (Klatt 1990, %) and tl
  override (Klatt 1990, dB@3kHz). oq=0 → derive from Rd; tl=0 → derive from Rd.
- Single output (1 channel) — glottal flow derivative. No separate noise channel
  (unlike oversampled-glottal-source which has voice=0, noise=1).
- lf-source worklet (src/worklets/lf-source-processor.ts) already exists, 0 inputs/1 output,
  params: f0(a), rd(a), lfMode(k), oq(a), tl(a), flutter(k), jitter(k), di(k). Already calls
  the 14-arg ABI correctly. registry.yaml already has `lf-source` primitive (f0/rd/lfMode).

### The stale test (Gate D fix)
- scripts/lf-source-wasm-compare.ts calls the OLD 7-arg ABI (state,f0,f0len,rd,rdlen,out,len).
  Must update to 14-arg: insert oq_ptr=0,oq_len=0,tl_ptr=0,tl_len=0,flutter=0,jitter=0,di=0
  between rd and out. Golden compares LFLM mode (set_mode(state,1)) output vs klatt_paper.json
  lfLm block (f0=110, rd=1, 256 samples). This fixes the long-standing test:golden failure
  that F1/F2 saw as "pre-existing unrelated".

### klsyn88 graph structure (public/experiments/klsyn88/graph.yaml)
- glottalSource = oversampled-glottal-source, outputs: port0=voice, port1=noise.
- port0 → voiceGain + parVoiceGain; port1 → aspGain + fricGain.
- ss param already exists (semantics range [1,4] default 2). Bound to glottalSource.source
  and cascadeF1 (pitch-sync-mod).source.

## DESIGN (forming)

### Source routing for SS=3
Problem: oversampled-glottal-source produces voice AND noise; LF source produces only voice.
SS=1/2/4 stay on oversampled-glottal-source. SS=3 must feed LF voice into the cascade/parallel
voice path while keeping aspiration/frication noise from oversampled source.

Plan: add an `lfSource` node (type lf-source) driven by F0 + LF-derived oq/tl. Use a
`signal-switch` (2-in/1-out, selector param) to choose between oversampled voice (port0)
and lf voice for the VOICE path only. Noise path (port1) stays from oversampled source.
selector bound to a realize `lfSelect = ss == 3 ? 1 : 0`.

CRITICAL no-op (Gate A): SS=2 default → selector=0 → signal-switch must pass input0
(oversampled voice) BIT-IDENTICALLY. MUST verify signal-switch introduces zero latency /
zero perturbation when selector=0. Need to read signal-switch crate + node-runtime to
confirm switch passes through sample-accurate with no added delay. If it adds latency or
alters the default path md5, redesign (e.g. gated-mix: voice*(1-sel) + lf*sel) or STOP+report.

### OQ/SQ → LF mapping
Spec §1.4/1.5. Drive crate via its `oq` override (Klatt %) directly + `rd` from SQ/OQ bridge:
  Rk = 100/SQ
  Rg = (1+Rk)/(2·OQ_frac),  OQ_frac = OQ/100
  Ra = ta/T0 (use Rd default / modal ta — but crate derives ta from rd internally)
  Rd = (1/0.11)(0.5+1.2 Rk)(Rk/(4 Rg) + Ra)
Lower-risk path candidate: pass oq override directly (so OQ honored exactly via Fg/Bg) and
set rd so that the crate's internal Rk = 100/SQ. BUT crate's Rk = (22.4+11.8·rd)/100 (Fant
default covary) → rd = (100·Rk − 22.4)/11.8 = (10000/SQ − 22.4)/11.8. This makes SQ drive
Rk (steepness) via rd, and OQ drive Fg via oq override. Need to confirm this gives sensible
H1-H2 vs SQ (Gate B). TL override from klsyn88 effectiveTiltDb (already computed) to set tilt.
DECISION PENDING: verify the rd-from-SQ inversion stays in crate clamp [0.3,2.7].
  SQ=200 → Rk=0.5 → rd=(50−22.4)/11.8=2.34 (breathy-ish). SQ=120→Rk=0.833→rd=60.9/11.8=5.16
  (CLAMPS to 2.7). SQ=300→Rk=0.333→rd=(33.3−22.4)/11.8=0.92.
  ⚠ SQ=120 inversion exceeds rd clamp → SQ steepness won't fully express via rd. Need a
  cleaner mapping. ALTERNATIVE: bypass rd-covary by also overriding... but crate ties alpha_m
  (open/close ratio) to rd's Rk, and oq override does NOT change alpha_m (see lib.rs comment
  lines 205-213). So SQ (steepness) can ONLY enter via rd in the current crate. Document this
  limitation; pick rd = clamp((10000/SQ − 22.4)/11.8, 0.3, 2.7) and verify Gate B still shows
  monotonic H1-H2 change SQ=120 vs 300 even with clamping.

## TODO
1. Read signal-switch crate (crates/signal-switch/src/lib.rs) + worklet + node-runtime port
   handling to PROVE selector=0 pass-through is bit-identical (Gate A blocker).
2. Read render-phrase.ts / node-runtime to know how SS frame param reaches graph + how to
   add lfSource node + selector realize.
3. Decide final OQ/SQ→(oq,rd,tl) mapping; add SQ frame param (100..500 def 200) + realizes.
4. Wire graph: lfSource node, signal-switch on voice path, bindings.
5. Fix scripts/lf-source-wasm-compare.ts to 14-arg ABI.
6. Build (pwsh build.ps1 + npm run build:worklets). Run Gate A md5, Gate B signature script,
   Gate C browser, Gate D test:golden.

## North-star md5 (Gate A): eacf192fb9d7fcaa6c8171ae6fce0d07 ("she sees a dog", klsyn88, SS=2)

## DESIGN LOCKED (2026-06-29)

### Runtime = node-web-audio-api (real WebAudio OfflineAudioContext). No per-node latency
for linear worklet chains (existing klsyn88 chains many worklets and produces stable golden).
signal-switch k-rate selector<0.5 copies in0 sample-by-sample (lib.rs signal_switch_process_krate)
=> bit-identical pass-through. Gate A md5 is the proof.

### Routing: signal-switch on the VOICE path (spec-recommended)
- NEW node lfSource (type lf-source): f0<-F0, rd<-lfRd, oq<-effectiveKopen, tl<-effectiveTiltDb,
  lfMode=1 (LFLM), flutter<-FL, di<-DI.
- NEW node lfScale (gain): gain<-lfMakeupGain (brings LF ~1.0 up to klsyn88 voice scale ~2-3k;
  calibrate empirically). LF then passes through voiceGain (AV scaling) like the natural voice.
- NEW node voiceSwitch (signal-switch): in0<-glottalSource port0, in1<-lfScale,
  selector<-lfSelect (= ss==3 ? 1 : 0).
- REWIRE: voiceGain.input and parVoiceGain.input now come from voiceSwitch (were glottalSource
  port0). glottalSource port1 (noise) -> aspGain/fricGain UNCHANGED.
- SS=2 default => selector 0 => switch outputs glottalSource port0 exactly => voiceGain sees
  identical input => byte-identical (Gate A).

### OQ/SQ -> LF crate mapping (lower-risk path = oq override + rd-from-SQ)
- oq override = effectiveKopen (klsyn88 OQ %). Honors OQ exactly via crate Fg/Bg.
- SQ -> rd: crate ties steepness Rk=(22.4+11.8*rd)/100 and alpha_m=1/(1+Rk) (= the LF
  opening/closing asymmetry = speed quotient, matches Doval note alpha_m=1/(1+Rk)). Set
  rd so Rk=100/SQ:  rd = (10000/SQ - 22.4)/11.8, clamped [0.3,2.7].
  - SQ=200->rd=2.34 ; SQ=300->rd=0.92 ; SQ=120->rd=5.16->clamp 2.7 ; SQ=500->clamp 0.3.
  - Clean unclamped SQ range ~[184,386] (rd in [0.3,2.7]). Gate B points 120 vs 300 -> rd
    2.7 vs 0.92 -> distinct alpha_m -> distinct spectral slope/H1-H2. Documented limitation
    (spec ambiguity #8: crate's Rd-tied default Rk caps independent SQ control).
- tl override = effectiveTiltDb (resolves ambiguity #10: SS=3 drives tilt via TL override,
  NOT via ta; ta path inert when tl>0). When TL=0 the crate derives tilt from rd (modal).
- OQ definition: reduced/Klatt OQi=te/T0 (ambiguity #6 -> reduced), matching crate + spec default.
- KNOWN APPROXIMATION: crate's oq-override path sets Fg=1/(2*oq*T0), omitting the (1+Rk)
  factor of the exact Fg=(1+Rk)/(2*oq*T0); alpha_m stays from rd (lib.rs 205-213). Standard
  CALM-biquad decoupling; acceptable for Gate B. Cited.

### ss=3 semantics
Redefining ss=3 to route to LF (paper SS=3 = modified LF model, K&K1990 Table XI). Prior
oversampled triangular (source=3) becomes unreachable via ss=3 (was a non-default extension;
shipped C clamps ss<=2 per spec §6). MUST grep goldens to ensure none use ss=3.

## OPEN VERIFY BEFORE CODING
1. Connection TARGET input-port syntax for 2-input signal-switch (check klatt80-baseline graph).
2. How runtime maps node params -> AudioParams (must lf-source registry list oq/tl/flutter/di?).

## VERIFIED 2026-06-29 (reads complete, runtime understood)

- **Working tree** = clean F1+F2 state. `scripts/lf-source-wasm-compare.ts` STILL stale 7-arg
  (not in diff) — prior attempt made no material change. Confirmed by reading it.
- **lf-source worklet** (`src/worklets/lf-source-processor.ts`) ALREADY exposes AudioParams
  f0(a),rd(a),lfMode(k),oq(a),tl(a),flutter(k),jitter(k),di(k) and ALREADY calls 14-arg ABI.
  No worklet change needed for the LF node. oqLen>0 only sends oq buffer; oq=0 → derive from Rd.
- **signal-switch** crate: `signal_switch_process_krate` with selector<0.5 does a plain
  sample-by-sample copy of input0 → BIT-IDENTICAL pass-through. Worklet uses inputs[0]/inputs[1]
  + k-rate selector param. registry has inputs:2 outputs:1. Gate A relies on selector=0 copy.
- **Runtime connection ports**: `to: { node: X, port: N }` → `fromNode.connect(toNode, fromIdx, N)`
  targets input index N. So 2-input switch is wired with explicit `port: 0` / `port: 1` targets.
- **Param binding**: runtime iterates graph.nodes[].params, resolves bind, calls
  applyParamValue(node, name, value) → node.parameters.get(name). Registry param list NOT
  required for binding (worklet's own descriptors give defaults). Will still add oq/tl to
  lf-source registry for documentation parity (prompt: "ensure lf-source params wired").
- **Amplitude scale (CRITICAL for calibration)**: klsyn88 works in fixed-point; oversampled
  voice output is on a large scale (DOUBLET ±13e6); voiceGain = dbToLinearKlsyn(avDb+eeGainDb)
  expects that scale; final gain0Linear multiplies by 1/32768. LF crate outputs ~±0.79 (≈1.0).
  So lfScale gain MUST scale LF up to oversampled voice peak P2 before voiceSwitch→voiceGain,
  else SS=3 is inaudibly quiet. Plan: measure P2 (oversampled voice peak at F0=120,AV=60) with
  the verify-flutter harness pattern, set lfScale ≈ P2 (constant gain; calibrated, cited as
  engineering estimate). NOT gated for exactness; just needs audible non-clipping output.

## REMAINING WORK (execution order)
1. Measure oversampled voice peak P2 (probe script, reuse flutter harness).
2. semantics.yaml: add SQ param (100..500 def 200, cite K&K1990 Table XII); realizes
   lfRd (=clamp((10000/SQ-22.4)/11.8,0.3,2.7)), lfSelect (=ss==3?1:0), lfScaleGain (P2 const).
3. registry.yaml: add oq, tl params to lf-source primitive (doc parity).
4. graph.yaml: add lfSource(lf-source), lfScale(gain), voiceSwitch(signal-switch); rewire
   voiceGain+parVoiceGain inputs from glottalSource port0 → voiceSwitch out. noise path
   unchanged. Bind lfSource: f0<-F0, rd<-lfRd, oq<-effectiveKopen, tl<-effectiveTiltDb,
   lfMode(=1 via default? need k-param binding — bind to a const realize lfModeVal=1).
5. Fix scripts/lf-source-wasm-compare.ts → 14-arg ABI.
6. Build: pwsh build.ps1 + npm run build:worklets.
7. Gate A md5; Gate B new scripts/verify-lf-source-signature.ts (SQ 120 vs 300 spectral
   slope); Gate D test:golden; Gate C browser render SS=3.
8. grep goldens for ss:3 usage (ensure redefining ss=3 breaks nothing).

## IMPLEMENTED + GATES (2026-06-29)

### Files changed (this chunk, F3)
- public/experiments/klsyn88/semantics.yaml: +SQ param (100..500 def200); realizes
  lfRd, lfSelect, lfModeVal(=1), lfMakeupGain(=9600), psmSource(ss==3?2:ss).
- public/experiments/klsyn88/registry.yaml: lf-source primitive +oq +tl params (doc parity).
- public/experiments/klsyn88/graph.yaml: +lfSource(lf-source), +lfScale(gain),
  +voiceSwitch(signal-switch); rewired glottalSource port0 -> voiceSwitch[0],
  lfSource->lfScale->voiceSwitch[1], voiceSwitch->voiceGain/parVoiceGain; noise path
  unchanged; cascadeF1.source ss->psmSource.
- scripts/lf-source-wasm-compare.ts: 7-arg -> 14-arg ABI (the test:golden fix).
- scripts/verify-lf-source-signature.ts: NEW Gate B feature-signature test.
- No Rust change; no worklet .ts change (lf-source worklet already 14-arg + oq/tl).

### Measurements
- oversampled VOICE peak=9314 rms=2069 (F0=120,AV=60,OQ=50) -> lfMakeupGain=9600 (RMS-match).
- LF rms ~0.215-0.29 across SQ; peak 0.45(SQ120)->1.41(SQ500). rd: SQ120->2.70, 300->0.93.

### GATE RESULTS
- GATE A (no-op): PASS. md5(tmp/f3-regress.wav, SS=2 default) =
  eacf192fb9d7fcaa6c8171ae6fce0d07 == north-star. LF wiring + voiceSwitch did NOT
  perturb the KLGLOTT88 path (selector=0 -> input0 copy is bit-identical).
- GATE D (test:golden): PASS, exit 0 (FULLY GREEN). lf-source-wasm-compare maxDelta
  0.79 -> 9.88e-6 (< 1e-5) after 14-arg ABI fix. resonator/antiresonator/render-phrase all pass.
- GATE B: script written; RUNNING NEXT.
- GATE C (browser SS=3 voiced): PENDING.

### BLOCKER: none. ALL GATES PASS.

## FINAL GATE RESULTS (2026-06-29) — ALL PASS

- GATE A (no-op byte-identical): PASS x2. md5("she sees a dog", klsyn88, SS=2 default)
  = eacf192fb9d7fcaa6c8171ae6fce0d07 == north-star, both before AND after the temporary
  SS=3 browser test (ss default reverted to 2). voiceSwitch selector=0 -> input0 copy is
  bit-identical; LF wiring is fully inert at SS=2.
- GATE B (LF signature): PASS 6/6 (scripts/verify-lf-source-signature.ts drives compiled
  lf-source.wasm). SQ=120(Rd2.70): H1-H2=8.46dB tilt=49.6dB; SQ=300(Rd0.93): H1-H2=1.51dB
  tilt=36.8dB -> SQ moves spectral slope monotonically. OQ 30->70: H1-H2 -1.0->10.1dB.
  Voiced both SQ.
- GATE C (browser): PASS. SS=3 render of "she sees a dog" voiced in BOTH node
  (peak0.283 rms0.0345) and real Chrome/playwright (peak0.2827 rms0.0344) — ~identical,
  params reach the worklet (no node-voiced/browser-silent regression).
- GATE D (test:golden): PASS exit 0 (fully green). lf-source-wasm-compare maxDelta
  0.79 -> 9.88e-6 after the 7->14-arg ABI fix.

## DESIGN SUMMARY (as built)
- SS routing: signal-switch `voiceSwitch` on the VOICE path. glottalSource port0 ->
  voiceSwitch input0; lfSource->lfScale->voiceSwitch input1; selector lfSelect=(ss==3?1:0).
  voiceSwitch feeds voiceGain+parVoiceGain. Noise path (port1->asp/fric) untouched.
- OQ/SQ -> LF crate: oq override = effectiveKopen (Klatt OQ%); SQ -> rd via
  lfRd=clamp((10000/SQ-22.4)/11.8,0.3,2.7) (Fant 1988 Rk=100/SQ + Fant 1997 Rd inversion);
  tl override = effectiveTiltDb (resolves ta-vs-TL ambiguity #10 -> TL path). lfMode=LFLM(1).
- Ambiguities resolved: OQ reduced/Klatt def (#6); SQ classical open-phase ratio (#7);
  SQ default 200 is Klatt UI default, Fant covary only via rd (#8); tilt via TL not ta (#10).
- Known approximation: CALM-biquad LF realization (Perrotin 2021), not literal time-domain
  integrator; crate's Rd-default Rk caps independent SQ near rd clamps (clean SQ~[184,386]).
- lfMakeupGain=9600: engineering estimate, RMS-matched LF(~0.215) to oversampled voice(~2069).
- Redefining ss=3 (was oversampled triangular) -> LF is safe: no golden/config sets klsyn88
  ss=3 (the dectalk "smoothness:3" matches were false positives; goldens clean).
- cascadeF1.source ss->psmSource(ss==3?2:ss): LF treated as natural for F1 pitch-sync;
  SS=2 -> psmSource=2 identical (Gate A proves it).

NO git add/commit performed.
