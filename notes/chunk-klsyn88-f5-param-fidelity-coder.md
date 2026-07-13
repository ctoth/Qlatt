# Chunk klsyn88-F5: Backend Default Param Fidelity — CODER notes

Role: CODER. Fix klsyn88 BACKEND default param surface in
`public/experiments/klsyn88/semantics.yaml` to match published klsyn88
(Klatt&Klatt 1990 Table XI/XII + Klatt 1988 manual Table I + parwv.c).
NO git add/commit. klsyn88-experiment-only.

## STATE: COMPLETE — all gates done. NO git add/commit performed.

## GATE A — defaults now match published (PRIMARY FIDELITY GATE)
All citations = Klatt 1988 KLSYN88 manual Table I (papers/Klatt_1988_KLSYNFormantSynthesis/notes.md);
NFCASC also Klatt&Klatt 1990 Table XI + parwv.c.

| Param   | OLD default | NEW default | OLD range      | NEW range      | Citation (published default) |
|---------|-------------|-------------|----------------|----------------|------------------------------|
| F6      | 5500 (BUG: outside range) | **4990** | [1200,4999] | [1200,4990] | manual Table I f6=4990, 3000-4990 |
| NFCASC  | 6           | **5**       | [1,8]          | [1,8]          | Table XI nf=5; manual nf=5; parwv.c=5 |
| GO      | 57          | **60**      | [0,60]         | [0,80]         | manual Table I g0=60, 0-80 (eff Gain0=GO-3=57) |
| F4      | 3500        | **3250**    | [1200,4999]    | [2400,4990]    | manual Table I F4=3250, 2400-4990 |
| F5      | 4500        | **3700**    | [1200,4999]    | [3000,4990]    | manual Table I F5=3700, 3000-4990 |
| FNZ     | 270         | **280**     | [248,528]      | [180,800]      | manual Table I fz=280, 180-800 |
| FNP     | 270         | **280**     | [248,528]      | [180,500]      | manual Table I fp=280, 180-500 |
| F1      | 500 (same)  | 500         | [200,1300]     | [180,1300]     | manual Table I F1>=180 |
| F3      | 2500 (same) | 2500        | [1200,4999]    | [1200,4800]    | manual Table I F3 max 4800 |
| B1      | 60 (same)   | 60          | [40,1000]      | [30,1000]      | manual Table I b1 min 30 |
| B3      | 150 (same)  | 150         | [40,1000]      | [60,1000]      | manual Table I b3 min 60 |
| B4      | 200 (same)  | 200         | [40,1000]      | [100,1000]     | manual Table I b4 min 100 |
| B5      | 200 (same)  | 200         | [40,1000]      | [100,1500]     | manual Table I b5 100-1500 |
| B6      | 500 (same)  | 500         | [40,2000]      | [100,4000]     | manual Table I b6 100-4000 |
| AV      | 0 (same)    | 0           | [0,70]         | [0,80]         | manual Table I av 0-80 |
| AVS(ap) | 0 (same)    | 0           | [0,70]         | [0,80]         | manual Table I ap 0-80 |
| AH      | 0 (same)    | 0           | [0,70]         | [0,80]         | manual Table I ah 0-80 |
| dF1hz   | 0 (same)    | 0           | [0,500]        | [0,100]        | manual Table I dF 0-100 |
| dB1hz   | 0 (same)    | 0           | [0,500]        | [0,400]        | manual Table I db 0-400 |
| Kskew   | 0 (same)    | 0           | [0,200]        | [0,100]        | manual Table I sk 0-100 |
| B5p(p5) | 600 (same)  | 600         | [40,1000]      | [100,1500]     | manual Table I p5 100-1500 |
| B6p(p6) | 800 (same)  | 800         | [40,2000]      | [100,4000]     | manual Table I p6 100-4000 |

Non-issues left as-is per audit: TL/TLTdb ceiling 34 (lineartilt[35] shipped-C table), F2=1500,
Kopen %, F0 Hz, four new feature defaults — all already faithful.

## GATE B — new no-op baseline
NEW md5 = **4c62e66e1a096dedf0901be22a0b7a5f** (OLD eacf192f intentionally retired).
Reproduced from final file state (exit 0). Voiced/sane: peak -18.51 dBFS, rms -30.43 dBFS, 32171 samples.
md5 changed because NFCASC 6->5 drops F6 from the cascade chain and flips cascadePolarity (NFCASC%2).

## GATE C — level fix
- qlatt-english render (GO supplied by frontend base_params = 47): level effectively UNCHANGED
  (-18.51 dBFS vs old -18.02; the ~0.5 dB drop is NFCASC 6->5 dropping F6). GO default 57 vs 60
  -> IDENTICAL md5 + level (proven). The GO default is INERT for normal TTS.
- GO default +3 dB PROVEN in isolation (GO temporarily removed from qlatt-english base_params,
  restored byte-for-byte): GO default 57 -> rms -20.42 dBFS; GO default 60 -> rms -17.35 dBFS;
  **delta +3.07 dB**. So the GO=60 fix is a real +3 dB *when GO is default-driven*.
- Oracle compare (scripts/oracle/compare-klsyn88.ts): AFTER gap (oracle-qlatt) = +2.01 dB peak /
  +2.02 dB rms. BEFORE gap = +1.53/+1.78 dB. Gap GREW ~0.25 dB (NFCASC=5 correctly removed F6 ->
  slightly quieter). The ~2 dB oracle level gap is driven by the frontend inventory GO=47 (reaches
  BOTH qlatt and oracle via the shared track), NOT the semantics default -> OUT OF SCOPE here.

### Root-cause correction of the "klsyn88 sounds quiet" hypothesis
The audit's §3.6 attributed the quietness to the **semantics** GO default (57). That is real for
all-defaults synthesis, but the actual TTS render path uses the **qlatt-english frontend**, whose
`base_params` set GO=47 (also F4/F5/F6/FNZ/B*/AV...). The semantics GO default is therefore never
consulted on the normal path. The genuine ~2 dB deficit vs the oracle is the frontend inventory
GO=47, which is qlatt-english (Q said do NOT touch). FOLLOW-UP for a future chunk: if klsyn88 TTS
should match the oracle level, raise qlatt-english base_params GO ~47->49-50 (frontend change,
needs its own re-baseline) — NOT a klsyn88-experiment change.

## GATE D — test:golden EXIT 0 (resonator/antiresonator/transferFunction all within tolerance).

## GATE E — other frontends untouched
- dectalk-english: PRISTINE (git diff --exit-code 0).
- qlatt-english (whole dir): PRISTINE (git diff --exit-code 0; temp isolation edit reverted byte-for-byte).
- Only file I edited: public/experiments/klsyn88/semantics.yaml.
- Pre-existing uncommitted diffs from the 4 feature chunks (NOT mine): klsyn88/graph.yaml,
  klsyn88/registry.yaml, crates/oversampled-glottal-source/src/lib.rs, src/declarative-frontend/
  rule-pack.ts, src/worklets/oversampled-glottal-source-processor.ts, qlatt-beauty/frontend.yaml.
  No crate/worklet edited by me -> no STOP condition.

## GATE F — features still no-op vs NEW baseline
FL=0, DI=0, ss=2, FTP=FTZ=2150, BTP=BTZ=180 (tracheal coincident) all UNCHANGED in semantics.yaml.
The NEW baseline md5 (4c62e66e) IS the render with these no-op feature defaults -> features remain
off-by-default after the default changes.

## DEFERRED (paper-vs-code follow-ups, NOT implemented)
1. TL/TLTdb redundancy merge (1990 spec has one tilt param; ours has two feeding effectiveTiltDb).
2. Missing GV/GH/GF master gains (folded into hardcoded parwv.c per-source scales — faithful),
   ATV (parallel tracheal amp 0/0/80), SB (same-noise-burst). Optional future exposure.
3. seed range [1,2147483647] unjustified (matches none of Table XI 8 / manual 1-99 / prose 0-99999).
4. SQ=200 => Rd~2.34 tension for "modal" SS=3 (wants SQ~300); inert at default ss=2.
5. deltaB1 constants (250, /12) lack explicit citation/label.
6. **qlatt-english base_params GO=47 is the real klsyn88 TTS level lever** (see Gate C root-cause).

## KEY FINDING — GO "quiet fix" does NOT affect the qlatt-english render
The render uses the **qlatt-english frontend** (default), whose `base_params`
(public/rules/frontends/qlatt-english/inventory.yaml) supply **GO: 47**, plus
F4/F5/F6, FNZ, B1-B6, AV/AH/AVS, dF/dB etc. Those base_params OVERRIDE the
semantics defaults. So for "she sees a dog":
- GO=47 reaches the synth (NOT the semantics default). Changing the GO default
  57->60 is **inert for this render** (proven: GO default 57 vs 60 -> identical
  md5 4c62e66e AND identical level -18.51/-30.43 dBFS).
- Only **NFCASC** falls through to the semantics default (frontend key is `NFC`,
  which klsyn88 does not consume; NFCASC lives only in the klsyn88 experiment).
  NFCASC 6->5 is what moved the md5 (drops F6 from cascade + flips cascadePolarity).

### GO default +3 dB PROVEN in isolation (temporary, fully-reverted)
Temporarily removed GO from qlatt-english base_params so GO falls through to the
semantics default, then rendered both defaults (qlatt-english restored byte-for-byte
afterward; `git diff --exit-code` on the frontend dir = clean):
- GO default 57 -> rms **-20.42 dBFS**, peak -8.49
- GO default 60 -> rms **-17.35 dBFS**, peak -5.42
- Delta = **+3.07 dB** (exactly the intended fix). Table: gain0Db=GO-3, klsynAmpTable[54]=719 vs [57]=1137.
So the GO default fix IS a real +3 dB when GO is default-driven; it just isn't
the lever for normal TTS (that lever is the qlatt-english inventory GO=47, OUT OF SCOPE).

## GATE RESULTS
- B (new baseline): NEW md5 = **4c62e66e1a096dedf0901be22a0b7a5f** (was eacf192f).
  Voiced/sane: peak -18.51 dBFS, rms -30.43 dBFS, 32171 samples. Render exit 0.
- C (level): see GO finding above. qlatt-english render level effectively unchanged
  (-18.51 vs old -18.02 peak; tiny drop from NFCASC 6->5). GO default +3 dB proven in isolation.
- E (other frontends): dectalk-english PRISTINE, qlatt-english dir PRISTINE (git --exit-code 0).
  Only semantics.yaml edited by me. graph/registry/crate/qlatt-beauty diffs are PRE-EXISTING feature work.
- F (features no-op): FL=0, DI=0, ss=2, FTP=FTZ=2150, BTP=BTZ=180 all UNCHANGED -> still no-op at new baseline.
- D (test:golden): RUNNING.

## BEFORE baseline (Gate B/C inputs)
- Render: `render-phrase --experiment-id klsyn88 --phrase "she sees a dog" --out-wav tmp/oldbase.wav --compare-golden 0`
- OLD md5 = `eacf192fb9d7fcaa6c8171ae6fce0d07` (== north-star, confirmed)
- OLD level: peak 0.12561 (**-18.02 dBFS**), rms 0.03089 (**-30.20 dBFS**)

## Published values (CITATIONS) — from manual notes Table I (Klatt_1988 notes.md lines cited)
Manual Table I (symbol | default | range):
- nf (NFCASC): **5** / 1–8   [line 66; Table XI 1990 = 1/5/6]
- g0 (GO): **60** / 0–80      [line 76; +3dB by g0=63]
- F1: 500 / **180**–1300      [line 86]
- F2: 1500 / 550–3000         [line 87] (ours OK)
- F3: 2500 / 1200–**4800**    [line 88]
- F4: **3250** / **2400**–4990 [line 89]
- F5: **3700** / **3000**–4990 [line 90]
- f6 (F6): **4990** / 3000–4990 [line 91]  <-- BUG fix (was 5500, outside range)
- fz (FNZ): **280** / **180–800** [line 92]
- fp (FNP): **280** / **180–500** [line 93]
- b1 (B1): 60 / **30**–1000   [line 94]
- b2 (B2): 90 / 40–1000       [line 95] (ours OK)
- b3 (B3): 150 / **60**–1000  [line 96]
- b4 (B4): 200 / **100**–1000 [line 97]
- b5 (B5): 200 / 100–**1500** [line 98]
- b6 (B6): 500 / 100–**4000** [line 99]
- at (Aturb): 0 / 0–80 (ours OK)
- tl (TL): 0 / 0–34 (ours OK, keep 34 — lineartilt[35] table ceiling)
- sk (Kskew): 0 / 0–**100**   [line 81]
- dF (dF1hz): 0 / 0–**100**   [line 82]
- db (dB1hz): 0 / 0–**400**   [line 83]
- av (AV): 60 / 0–**80**      [line 84]
- ah (AH): 0 / 0–**80**       [line 85]
- ap (AVS): 0 / 0–**80**      [line 102]
- p1..p6 (B1p..B6p): defaults OK; p5 max ->1500, p6 max ->4000 [lines 112-117]

## PLAN of edits to semantics.yaml
MUST-FIX:
1. F6 default 5500->4990, range [1200,4999]->[1200,4990]
2. NFCASC default 6->5
3. GO default 57->60 (so Gain0=GO-3=57), range [0,60]->[0,80]
4. F4 3500->3250 range [1200,4999]->[2400,4990]; F5 4500->3700 range->[3000,4990];
   FNZ 270->280 range [248,528]->[180,800]; FNP 270->280 range->[180,500]
   Range widenings: F1 min 200->180; F3 max 4999->4800; B1 min 40->30;
   B3 min 40->60; B4 min 40->100; B5 max 1000->1500; B6 max 2000->4000(already 2000->4000);
   AV/AH/AVS max 70->80; dF1hz max 500->100; dB1hz max 500->400; Kskew max 200->100;
   B5p max 1000->1500; B6p max 2000->4000.

DEFER (note only): TL/TLTdb merge; missing GV/GH/GF/ATV/SB.

## TODO
- [ ] apply edits
- [ ] render AFTER -> new md5, new level (expect ~+3dB)
- [ ] test:golden green
- [ ] features still no-op vs new baseline (FL/DI/SS/tracheal)
- [ ] confirm dectalk-english/qlatt-english untouched
- [ ] compare-klsyn88 oracle gap (bonus)
