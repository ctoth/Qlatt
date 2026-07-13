# Chunk tilt — Spectral TILT wiring into dectalk audio path RECON (read-only)

Datestamp: 2026-05-29
Scope: recon only. No files changed except this report. Mission: design how to
wire spectral TILT into the Qlatt `dectalk-english` audio path so per-phoneme
TILT and per-voice tilt/breathiness shape the sound. The dispatch referenced
`notes/dectalk-gap-E-synth-voices.md` and `notes/chunk-dt7-timbre-recon.md`;
**gap-E does NOT exist** (only gap-A..gap-D under `notes/`). The TILT/breathiness
content the dispatch attributed to gap-E lives in `chunk-dt7-timbre-recon.md`
(SM->tilt, BR->B1/aturb) and `dectalk-parity-backlog.md` (items D-G7, E-G3).
Findings below are verified directly against source.

---

## 0. Correction to dispatch premise

- "gap report E (`notes/dectalk-gap-E-synth-voices.md`)" — FILE ABSENT. The
  backlog item **E-G3** is recorded in `notes/dectalk-parity-backlog.md:59`:
  "spectral TILT wiring — tilt-filter crate/worklet exist but unwired in dectalk
  graph; impulse source has no tilt param." And **D-G7** at
  `dectalk-parity-backlog.md:54`: "per-phoneme TILT targets (inventory only has
  TL=0)." Both confirmed below from primary sources.

---

## 1. DECtalk 4.63 — what TILT is, per-frame application, per-phoneme + per-voice

TILT is a **per-frame synthesizer parameter** ("source spectral tilt"), one of
the 16 control params iterated by the transition engine. Comment listing the
param order: `ph_setar.c:29` and `:365`
(`F1,F2,F3,FZ,B1,B2,B3,AV,AP,A2,A3,A4,A5,A6,AB,TILT`). The engine loops
`for (np = &PF1; np <= &PTILT; np++)` (`ph_setar.c:366`), so TILT gets the same
target/transition machinery as the formants — it is NOT a one-time chip config
(contrast the dt-7 voice fields). It is written to the chip slot `OUT_TLT`
(`ph_draw.c:640` `parp = &(parstochip[OUT_TLT])`).

### 1a. Per-PHONEME TILT targets (gettar) — `p_us_st1.c:250-294`

When the current param is PTILT (`p_us_st1.c:252`), the target `tartemp` is set
by phone class:
- silence (`GEN_SIL`): 0 (`:255-258`)
- /hx/ (USP_HX): 20 (`:260-263`)
- FDUMMY_VOWEL: 10 (`:265-268`)
- obstruent (FOBST): 7 (`:269-271`); **voiced plosive (b/d/g) or /jh/: 40**
  "Max tilt for [b,d,g]" (`:272-277`)
- nasal (FNASAL): `tartemp += 6` "Tilt down nasal murmurs" (`:279-282`)
- female front vowel (begtyp/endtyp == 1): `tartemp += 6` (`:285-289`)
- else (default vowel): `tartemp += 3` (`:290-293`)

So per-phoneme TILT targets are roughly: 0 sil, 3 vowels, 6 nasal/female-front-V,
7 obstruents, 10 dummy-vowel, 20 /hx/, 40 voiced-stop/affricate.

### 1b. Per-frame tilt assembly in the synth-prep — `ph_draw.c:625-723`

The chip TILT value is built additively each frame:
1. **F0-dependence** (`:645-657`): male `temptilt = frac4mul(f0-900, f0_dep_tilt)`,
   female `frac4mul(1400-f0, f0_dep_tilt)`; then `temptilt = 8 - temptilt`,
   floored at 0. "source spectrum becomes less smooth as F0 decreases"
   (`:628-637` table). `f0_dep_tilt` is spdef par FT (`:642`).
2. /ih/ special `+3` (`:662-665`).
3. `*parp += temptilt` (`:668`).
4. **Per-voice smoothness offset**: `*parp += (spdeftltoff - 3)` (`:671`).
   `spdeftltoff` is computed from SM (smoothness) per voice in
   `ph_vset.c:691,699-700` (`spdeftltoff = (SM*25)/100`, +8 if SM<=18) — recorded
   in `chunk-dt7-timbre-recon.md:41`.
5. **Breathy offset** (`:676-706`): when `breathysw==1` (set per-clause in
   `ph_setar.c:347-360` — on during last syllable of a clause, "generally
   restricted to female voices via spdef LX"), and AV>40: ramp `breathytilt`
   up 1/frame to 16 ("tilt decrease 16 dB/100 ms", `:695-698`) and add
   `frac4mul(spdeflaxprcnt, breathytilt)` (`:699`). `spdeflaxprcnt` is the
   per-voice LX breathy percent.
6. **Clamp 0..31** (`:714-723`) — "Source tilt can't be more than 31 dB."
7. **AV loudness compensation** for strong tilt (`ph_draw.c:4224-4230`):
   if AV>3, `temptilt=(TLT>>2)-4` (>=0 only when tilt>=20), `OUT_AV += temptilt`.
   Loud-up to offset the energy a strong lowpass removes.

### 1c. How the chip APPLIES TILT to sound

TILT is a **source spectral tilt** = a one-pole lowpass applied to the glottal
source spectrum (more tilt = more high-frequency rolloff = "less smooth /
breathier" spectrum). The comment at `ph_draw.c:638` references "old tilt filter"
and the value is the dB-at-some-reference rolloff. NOTE: the exact chip-side
filter math (COEWAV/PARWAV descendant) was not read in this pass — but the Qlatt
`tilt-filter` crate is explicitly the klsyn88 implementation of this same TLTdb->
one-pole-lowpass map (see 2a), so the model is established.

---

## 2. Qlatt current state

### 2a. tilt-filter crate + worklet — EXIST, capabilities

- **Crate** `crates/tilt-filter/src/lib.rs`: a one-pole lowpass
  `y[n] = (1-decay)*x[n] + decay*y[n-1]` (`:42-46`). `set_tilt(tilt_db: i32)`
  clamps to 0..34 and indexes `TILT_TABLE` (`:35-39`). The table is "Linearized
  tilt table from klsyn88 (c/parwv.c lines 706-711)" mapping TLTdb 0-34 to decay
  (`:5-13`) — i.e. **exactly the DECtalk-family source spectral tilt**. FFI:
  `tilt_filter_new/free/reset/set_tilt/process` (`:50-83`).
- **Worklet** `src/worklets/tilt-filter-processor.ts`: registers processor name
  `"tilt-filter-processor"` (`:139`). One AudioParam `tilt`, k-rate,
  default 0, min 0, max 34 (`:42-44`). Reads `parameters.tilt[0]`, rounds,
  calls `tilt_filter_set_tilt` when changed (`:102-106`), processes 1-in/1-out.
- **Primitive definition** EXISTS but only in non-dectalk registries:
  `public/experiments/stevens91/registry.yaml:9-20` and `klsyn88/registry.yaml`
  (grep hit) define `tilt-filter` (worklet `tilt-filter-processor.js`, wasm
  `tilt-filter.wasm`, param `tilt`). The compiled worklet ships at
  `public/worklets/tilt-filter-processor.js`. **The dectalk path does NOT see
  this primitive** (see 2c).

PARAM RANGE MISMATCH: crate/worklet accept tilt 0..34; DECtalk OUT_TLT clamps
0..31; Klatt `TL` semantics param range is 0..41 (`klatt80-baseline/semantics.yaml:176`).
A binding from TL->tilt is within range for the DECtalk 0..31 envelope but
should clamp/round (worklet already clamps & rounds).

### 2b. Where TILT currently (dis)connects in the dectalk graph

- `TL` is a defined semantics param, range 0..41
  (`klatt80-baseline/semantics.yaml:172-177`), inherited by dectalk (dectalk
  semantics has no TL override; grep for TL/tilt in
  `dectalk-english/semantics.yaml` = no match).
- In `dectalk-english/graph.yaml` TL binds to **exactly one place**: the LF
  source `tl: { bind: TL }` (`graph.yaml:112`). The impulse source node
  (`graph.yaml:116-121`) has params `f0`, `gain`, `openPhaseRatio` ONLY — no
  tilt.
- DECtalk uses `sourceMode=0` (impulse) — set in inventory base_params and
  defaulted in `dectalk-english/semantics.yaml:16-20`. The semantics gate
  `lfSourceSwitch` turns the LF branch OFF at sourceMode=0, so the only node
  consuming TL is silenced. **Therefore TL is inert on the dectalk path.**
- Impulse-train processor `src/worklets/impulse-train-processor.ts` confirms
  NO tilt param (descriptors at `:31-37` = f0/gain/openPhaseRatio only).
- Inventory: `public/rules/frontends/dectalk-english/inventory.yaml:32` sets
  `TL: 0` in base_params, and there is NO per-phoneme TL override
  (`dectalk-gap-D-formant-inventory.md:87,134`).

### 2c. Can the node-host backend run a tilt-filter worklet HEADLESSLY?

**YES — verified by code.** `scripts/rendering/backends/node-runtime.ts` builds
the graph with `node-web-audio-api`'s `OfflineAudioContext` and passes
`NodeAudioWorkletNode` as `audioWorkletNodeCtor` (`:68,85-86`), loading worklet
modules from `public/worklets` via `createNodeRuntimeAssetLoader` (`:70-72`).
`registerWorklets` (`src/klatt-runtime.ts:144-173`) iterates
`getWorkletModules(registry)` and `addModule`s each — so a worklet is registered
**iff its primitive is in the merged registry**. The instantiation path is the
SAME for all worklet primitives (`createKlattRuntime` -> processorName =
`primitive.worklet.replace('.js','')` -> `new audioWorkletNodeCtor(...)`,
`klatt-runtime.ts:819,833`). The tilt-filter worklet is already
`registerProcessor`'d and its compiled JS + wasm ship in `public/worklets/`.

**Therefore a new tilt-filter node will render headlessly** with no
browser, provided the `tilt-filter` primitive is added to a registry the dectalk
experiment loads. NO HARD-STOP — headless audio verification IS feasible.

CAVEAT (registry merge): `dectalk-english` `extends: klatt80-baseline`
(`manifest.json:28-31`) and has NO own `registry.yaml`
(loadExperimentConfig globs `${basePath}/registry.yaml`,
`load-experiment-config.ts:97` -> null for dectalk). The merged registry is just
klatt80-baseline's primitives (`mergeRegistry`, `:37-43`), which DOES NOT define
`tilt-filter` (grep `tilt` in `klatt80-baseline/registry.yaml` = no match). So
adding the primitive is a prerequisite — see design.

---

## 3. DESIGN (declarative-first)

Goal: a `tilt-filter` node in the dectalk graph, on the SOURCE, driven by a
per-frame `TL` param, where per-phoneme TILT (inventory) and per-voice tilt
(speaker layer) feed `TL`. The DSP already exists; the work is configuration +
data + one binding + making the primitive visible to dectalk.

### 3.1 What is PURE DATA / config

1. **Register the primitive for dectalk.** Add `tilt-filter` to a registry the
   dectalk experiment loads. Cleanest: add it to `klatt80-baseline/registry.yaml`
   (so it is inherited; the worklet + wasm already exist and other experiments
   already declare it identically — `stevens91/registry.yaml:9-20` is the
   copy-source). Pure YAML. (Alternative: create
   `dectalk-english/registry.yaml` with just the tilt-filter primitive; the
   merge keeps base primitives and adds it — also pure data, smaller blast.)
2. **graph.yaml node + connection.** Insert a `tiltFilter` node of type
   `tilt-filter` with `params: { tilt: { bind: TL } }`, placed on the SOURCE
   between `impulseSource`/`sourceSum` region. RECOMMENDED insertion point: on
   the **summed source** at `sourceSum` (`graph.yaml:196-199`) — splice
   `impulseGain -> tiltFilter -> sourceSum` (and keep `lfSourceGain -> sourceSum`
   as-is, since LF already self-tilts via its `tl` param at `:112`). This tilts
   the impulse glottal source ONLY, matching DECtalk where TILT is a *source*
   spectral tilt and the LF branch is off for dectalk. Pure data (node + two
   connection edits). NOTE: this is the single load-bearing topology choice —
   source-side (pre-cascade) matches DECtalk semantics; an output-side tilt
   would also color frication/aspiration, which DECtalk's source TILT does not.
3. **semantics binding.** TL already exists (range 0..41); the worklet clamps to
   0..34 and the DECtalk envelope is 0..31, so no new semantics needed for a
   pass-through bind. OPTIONAL: a `realize` rule could clamp/round TL or add the
   AV loudness compensation (`ph_draw.c:4224-4230`) as `+ tiltAvComp` on the
   voice gain — that is a calibration choice (flag to Q), not required to wire.
4. **Per-phoneme TILT data in inventory.** Add per-phoneme `TL` targets to
   `dectalk-english/inventory.yaml` per the DECtalk class map (1a): vowels ~3,
   nasals ~6, obstruents 7, voiced-stops/affricates 40, /hx/ 20, silence 0.
   Pure data. Base_params `TL: 0` already exists (`inventory.yaml:32`); per-
   phoneme entries override it. (D-G7 backlog item.)
5. **Per-voice tilt.** Feed `spectral_tilt_offset_db` (already imported per voice
   from SM, dt-1) onto frame `TL` via the existing
   `applySpeakerProfileToParams` path — it ALREADY does
   `params.TL += spectral_tilt_offset_db` (`tts-frontend.ts:181-183`, per
   `chunk-dt7-timbre-recon.md:73`). So per-voice tilt reaches `TL` TODAY; it just
   has no audio destination until step 2 wires it. Pure data once node exists.

### 3.2 What needs DSP / crate change

- **Nothing for the core wire.** The tilt-filter crate + worklet are complete and
  match the klsyn88/DECtalk one-pole model (2a). Allowed as a real primitive.
- OPTIONAL crate work only if we want F0-dependent tilt or breathysw ramp
  computed in DSP — but those are better expressed as semantics realize rules
  feeding TL (F0-dependence: `max(0, 8 - f0term)` per `ph_draw.c:645-657`) or as
  prosody/structural rules (breathysw clause-final breathy ramp). Keep in YAML.

### 3.3 Insertion-point summary

- SOURCE (recommended): `impulseGain -> tiltFilter -> sourceSum`. Tilts voiced
  source only; matches DECtalk OUT_TLT being a source param. LF branch keeps its
  own `tl`.
- OUTPUT (not recommended): tilting `outputSum`/`masterGain` would also tilt
  frication + PLSTEP bursts, which DECtalk does not — and would interact with the
  compressor. Reject.

---

## 4. Chunk breakdown (each verifiable by real audio render)

Verification for ALL chunks is the headless render
(`scripts/rendering` node-runtime backend; render-phrase --out-wav) plus a
spectral measure — TILT is a lowpass, so the observable is **high-frequency
energy / spectral centroid DROPS as TILT rises** (and overall RMS drops unless
AV-comp is applied). A small analysis script (FFT band-energy ratio, e.g.
energy>2kHz / total) on the rendered WAV is the non-visual evidence. The 0..31
DECtalk envelope at the source is audible/measurable.

- **tilt-a — Wire the tilt-filter node into the dectalk graph, driven by TL.**
  (1) add `tilt-filter` primitive to the registry dectalk loads (3.1#1);
  (2) add `tiltFilter` node + splice `impulseGain -> tiltFilter -> sourceSum`
  (3.1#2). VERIFY: render a fixed phrase at TL=0 vs an injected TL=20/31 (via a
  temporary base_params bump or a `--param TL=` if supported) and show
  high-freq band-energy ratio drops monotonically with TL. Confirms the DSP is
  in-path and headless render works. This is the load-bearing chunk; if the
  registry/headless wiring fails, STOP here. (No hard-stop expected — 2c shows it
  works.)

- **tilt-b — Per-phoneme TILT data in inventory** (D-G7). Add per-phoneme `TL`
  to `dectalk-english/inventory.yaml` per the DECtalk class map (1a), with
  citations (`p_us_st1.c:250-294`). VERIFY: render a phrase mixing a vowel, a
  voiced stop (TL=40 clamped to ~31), and a fricative; dump per-frame TL (explain
  / frame dump) to show TL differs by phone, AND render to show the b/d/g
  segments have measurably lower high-freq energy than vowels.

- **tilt-c — Per-voice tilt** (SM/smoothness, breathiness). The
  `spectral_tilt_offset_db` path already adds to TL (`tts-frontend.ts:181-183`);
  after tilt-a it becomes audible. VERIFY: render the SAME phrase as Paul (low
  SM offset) vs Betty (`spectral_tilt_offset_db` 2.5, per dt-7 notes) and show
  Betty's spectral centroid / high-freq ratio is lower. OPTIONAL extension:
  clause-final breathy ramp (breathysw, `ph_draw.c:676-699`) as a prosody/
  structural rule adding to TL on the last syllable — flag as values-laden.

- **tilt-d (optional, calibration) — F0-dependent tilt + AV loudness comp.**
  F0-dependence (`ph_draw.c:645-657`) and AV compensation (`:4224-4230`) as
  semantics realize rules. Values-laden / calibration; FLAG to Q. Not required
  for the core wire.

Recommended order: tilt-a (proves the path + headless render), then tilt-b
(per-phoneme, the biggest perceptual payoff for b/d/g and obstruents), then
tilt-c (per-voice character), tilt-d optional.

---

## Headless-render feasibility — NO HARD-STOP

The node-host backend CAN run a new tilt-filter worklet headlessly
(node-runtime.ts:68,85-86 + registerWorklets + existing compiled
`public/worklets/tilt-filter-processor.js` + `tilt-filter.wasm`). The ONLY
prerequisite is adding the `tilt-filter` primitive to a registry the dectalk
experiment merges (it is absent from klatt80-baseline's registry today). Audio
verification of every chunk via render-phrase --out-wav is feasible.

---

## Verified facts index (file:line)
- DECtalk TILT is per-frame param: `ph_setar.c:29,365,366`; chip slot OUT_TLT
  `ph_draw.c:640`.
- Per-phoneme TILT targets: `p_us_st1.c:250-294` (sil 0, /hx/ 20, dummy-V 10,
  obstruent 7, voiced-stop/jh 40, nasal +6, female-front-V +6, else +3).
- Per-frame tilt assembly: `ph_draw.c:625-723`; F0-dep `:645-657`; SM offset
  `spdeftltoff` `:671` (computed `ph_vset.c:691,699-700`); breathysw ramp
  `:676-699` (set `ph_setar.c:347-360`); clamp 0..31 `:714-723`; AV comp
  `:4224-4230`.
- Qlatt crate: `crates/tilt-filter/src/lib.rs:5-13,35-46,50-83` (klsyn88 parwv.c
  706-711 table, one-pole lowpass, 0..34).
- Qlatt worklet: `src/worklets/tilt-filter-processor.ts:42-44,102-106,139`
  (param `tilt` k-rate 0..34, processor `tilt-filter-processor`).
- Primitive defined only in stevens91/klsyn88 registries:
  `stevens91/registry.yaml:9-20`; ships `public/worklets/tilt-filter-processor.js`.
- TL inert on dectalk: binds only lfSource `graph.yaml:112`; impulse source has
  no tilt `graph.yaml:116-121` + `src/worklets/impulse-train-processor.ts:31-37`;
  LF off at sourceMode=0 (`dectalk-english/semantics.yaml:16-20`).
- TL semantics param: `klatt80-baseline/semantics.yaml:172-177` (0..41).
- Inventory TL=0, no per-phoneme: `dectalk-english/inventory.yaml:32`;
  `dectalk-gap-D-formant-inventory.md:87,134`.
- Per-voice tilt already added to TL: `tts-frontend.ts:181-183` (per
  `chunk-dt7-timbre-recon.md:73`).
- Registry merge / extends: `manifest.json:28-31`;
  `load-experiment-config.ts:37-43,94-98`; klatt80-baseline registry has NO
  tilt-filter (grep `tilt` = no match).
- Headless worklet path: `scripts/rendering/backends/node-runtime.ts:68,70-72,85-86`;
  `src/klatt-runtime.ts:144-173,819,833`.
- Backlog items: `dectalk-parity-backlog.md:54` (D-G7 per-phoneme TILT), `:59`
  (E-G3 spectral tilt wiring).
