# Chunk klsyn88-f6 "deferred paper-vs-code parity" — CODER notes

Branch: klsyn88-1990-fidelity. Edit ONLY public/experiments/klsyn88/semantics.yaml
(+ graph/registry if a new gain node is genuinely needed). No git add/commit.

Baseline no-op md5 (LOCKED): 4c62e66e1a096dedf0901be22a0b7a5f
Render gate: render-phrase --experiment-id klsyn88 --phrase "she sees a dog" --out-wav tmp/f6.wav --compare-golden 0

## Source facts gathered (reads done)
- semantics.yaml current state read in full.
- Klatt 1990 Table XI (constants): NF 1/5/6, SS 1/2/3, RS 1/8/8191, SB 0/1/1,
  CP 0/0/1, OS 0/0/20, GV/GH/GF each 0/60/80 dB ("Gain for AV/AH/AF").
- Klatt 1990 Table XII parallel voicing amps: ANV 0/0/80, A1V-A4V 0/60/80, ATV 0/0/80.
- Klatt 1988 manual Table I: rs 1-99 (prose 0-99999), tl 0-34, g0 0-80 def 60.
- signalpath §2.9/§2.10/§3/§5.1: shipped parwv.c has NO GV/GH/GF, NO ATV, NO SB,
  NO parallel-tracheal resonator. Folded scales: voicing ×0.03 (in source),
  asp ×0.05, fric ×0.25, master Gain0=G0-3. The fixed scales effectively bake in
  GH/GF=60. So spec GV/GH/GF default 60 == current baked behavior.

## Plan (4 items)
1. TL/TLTdb collapse: make TL canonical (paper symbol + manual semantics, range
   0-34 per audit §3.1 lineartilt[35] ceiling). Keep TLTdb as deprecated alias.
   New effectiveTiltDb = clamp( TL>0 ? TL : (TLTdb>0 ? TLTdb : rdDerivedTiltDb), 0, 34).
   Default (TL=0,TLTdb=0): rdDerivedTiltDb. At Rd=0.7 -> rdProxy=55.5 -> tilt=3.3.
   OLD default also = clamp(0 + (0>0?:rdProxy)) = 3.3. EXACT MATCH -> no-op.
2. GV/GH/GF: add params default 60, range [0,80], cite Table XI. Apply as
   (GX-60) dB offset:
     voiceGain: dbToLinearKlsyn(max(avDb+eeGainDb+(GV-60),0))
     aspGain:   dbToLinearKlsyn(AH+(GH-60))*0.05
     fricGain:  dbToLinearKlsyn(AF+(GF-60))*0.25
   Default GX=60 -> +0 dB -> exact no-op. GV applies to cascade voicing only.
   Proof: voiceGain(GV=66)/voiceGain(GV=60) ~= 2 (=+6 dB).
3. seed: range -> [1,8191] (Klatt 1990 Table XI RS), keep default 1 (shipped-C
   ranseed; preserves no-op). Cite Table XI.
4. ATV + SB: DEFER both. Rationale: shipped parwv.c §5.1 has no parallel-tracheal
   resonator and no ATV scale/frequency binding (Table XII gives range/default but
   not the fold scale or resonator freq) -> underspecified, not no-op-safe without
   guessing a new node. SB governs cross-utterance noise-seed reuse; inert in a
   single render and no crate hook -> would be a dangling non-functional param.
   Document, do not implement.

## EDITS DONE (semantics.yaml only; graph/registry untouched)
- TL: marked canonical (Table XII), comment on 34 ceiling = lineartilt[35].
- TLTdb: marked DEPRECATED alias.
- effectiveTiltDb: collapsed to override hierarchy TL -> TLTdb -> rdDerivedTiltDb.
  Default = rdDerivedTiltDb = 3.3 (Rd=0.7), == old formula. No-op preserved.
- GV/GH/GF params added (Table XI, 0/60/80). Wired as (GX-60) dB offsets:
  voiceGain += (GV-60); aspGain on AH+(GH-60); fricGain on AF+(GF-60).
  Default 60 -> +0 dB exact no-op. dbToLinearKlsyn floors to int table index;
  table[53]=638, table[59]=1276 -> +6 dB = x2.000 exactly (proof basis).
- seed range [1,8191] (Table XI RS), default 1 kept (shipped-C ranseed).
- ATV + SB: DEFERRED (documented in report).

## builtin confirmed: dbToLinearKlsyn(db) = klsynAmpTable[floor(clamp(db,0,len-1))]*.001;
   returns 0 for db<0. So offset of exactly 0 at default = byte-identical.

## GATE RESULTS
- Gate A (no-op md5): PASS. tmp/f6.wav md5 = 4c62e66e1a096dedf0901be22a0b7a5f (UNCHANGED).
  Invocation: node --loader ts-node/esm/transpile-only --experimental-specifier-resolution=node
  scripts/render-phrase.ts --experiment-id klsyn88 --phrase "she sees a dog" --out-wav tmp/f6.wav --compare-golden 0
- Gate B (test:golden): PASS, EXIT=0.
- Gate C: dectalk-english + qlatt-english git diff --exit-code = 0 (PRISTINE).
  NOTE: other working-tree changes (qlatt-beauty/*, src/declarative-frontend/rule-pack.ts,
  design/.../BUILD.md) are PRE-EXISTING, NOT mine. My only tracked edit: semantics.yaml.
- Gate D (GV proof): IN PROGRESS. Proof script outside repo tree hit ERR_REQUIRE_CYCLE_MODULE
  (relative imports escaping project). Moving proof script into repo root tmp, run, then delete.

## Gate D (GV proof) — PASS (via real topological evaluator on real semantics.yaml)
  AV=AH=AF=60 reference frame:
  voiceGain GV60=0.638 -> GV66=1.276  ratio 2.000  => +6.021 dB
  aspGain   GH60=0.0719 -> GH66=0.14375 ratio 1.99930 => +6.018 dB
  fricGain  GF60=0.3595 -> GF66=0.71875 ratio 1.99930 => +6.018 dB
  cross-isolation: GV=66 leaves aspGain & fricGain at base (true/true).
  Temp proof script (tmp-gv-proof.ts) deleted after run.

## FINAL: ALL GATES PASS. Only edit: public/experiments/klsyn88/semantics.yaml
  (+68/-12). graph.yaml & registry.yaml untouched (no new node needed).

## DEFERRED (item 4) rationale — precise:
- ATV (parallel tracheal amp, Table XII 0/0/80): shipped parwv.c §5.1 parallel
  amplitude set is {A1..A6, ANP, AB} — there is NO parallel-tracheal resonator and
  NO ATV fold-scale or resonator-frequency binding anywhere in the C. Table XII gives
  ATV's range/default but not (a) the parallel scale factor (cf. A1 x0.4, A2 x0.15...)
  nor (b) which frequency the parallel tracheal formant sits at. Implementing it would
  require inventing a new graph node + scale + freq => a guess, and a 0 dB amplitude is
  NOT guaranteed no-op (0 dB -> linear>0 in some paths). Underspecified -> DEFERRED.
- SB (same noise burst, Table XI 0/1/1): a config flag controlling reuse of the noise
  seed across utterances/bursts (for stimulus continua). Inert within a single render;
  no crate hook exists. Adding it = a dangling non-functional param. DEFERRED.
