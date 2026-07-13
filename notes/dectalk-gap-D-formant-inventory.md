# DECtalk vs Qlatt Port — Formant Inventory & Transition/Coarticulation Gap Report

Date: 2026-05-28. Scope: phoneme→acoustic-target map + inter-phoneme parameter
interpolation (locus, forward/backward smoothing, coarticulation, parallel A2-A6/AB,
TILT, burst timing, SW). NOT LTS, NOT duration rules, NOT F0, NOT DSP filter math.

All claims cite file:line. Current state verified against the working tree on 2026-05-28
(NOT taken from the older scout reports, which predate `phases/formant.yaml`).

---

## 1. DECtalk 4.63 — inventory + transition/coarticulation components (file refs)

The 16-parameter transition engine iterates over: F1,F2,F3,FZ,B1,B2,B3,AV,AP,A2,A3,A4,A5,A6,AB,TILT
(`dapi/src/PH/ph_setar.c:29`). Per-parameter handling per phone:

- **Target tables (gettar / us_gettar)** — `dapi/src/PH/p_us_st1.c` (us_gettar near top; TILT
  block `p_us_st1.c:250-284`, `:774`, `:1170`). Context modifications to targets live here
  (fricative F1 +40 near vowel; /n,en/ B2/B3; voiced-stop AV gating; /h/ AV/AP).
- **Parallel amplitude tables (p_amp via ptram)** — `dapi/src/PH/p_us_rom.h:2926` (`us_ptram[]`),
  `p_us_rom.h:2991` (`us_malamp[]`), `p_us_rom.h:3599` (`us_femamp[]`). Looked up at
  `p_us_st1.c:229-237` (`ptram(phone_temp)` → `pDph_t->p_amp[tartemp]`).
- **TILT targets** — `p_us_st1.c:250-284` (0 silence, 7 obstruents, 20 /h/, 40 b/d/g,
  6 nasal murmur, female front-vowel tilt-down). Jump-to-target near stops/silence
  `p_us_st1.c:774`, `:1170`.
- **General coarticulation** — 10% default / 15% / 25%(F2) blend toward neighbor average.
  `dapi/src/PH/ph_setar.c` coartic block (per scout-ph-setar §B.3).
- **Special coarticulation** — `us_special_coartic()` `p_us_st1.c:301-413` (F3 -=150 near
  W/R/RX; F2 offsets near LX/W/LL; UW after alveolar; ±400 Hz cap).
- **Forward smoothing** — `us_forw_smooth_rules()` `p_us_st1.c:413-810`. Per-parameter
  boundary value + per-parameter transition duration (NF20MS–NF130MS), soncon→vowel 25/75
  rule, /R/ NF70MS, B1 widen after voiceless, etc.
- **Backward smoothing** — `us_back_smooth_rules()` `p_us_st1.c:810+`. Mirror of forward;
  `tbacktr = durfon - durtran`.
- **Locus-based transitions** — `setloc()` `dapi/src/PH/ph_sttr2.c:71`. Tables
  `us_maleloc[]` `p_us_rom.h:4449`, `us_femloc[]` `p_us_rom.h:5366` (also in
  `p_us_romref.h:4099`/`:4953`). 3 entries per formant per obstruent indexed by vowel
  category (front/back-unrounded/back-rounded). `bouval = locus + prcnt*(curval-locus)/100`.
- **V-V coarticulation across consonant (F2 only)** — `vv_coartic_across_c()` in `ph_sttr2.c`.
- **Special rules (burst/VOT/voicebar)** — `us_special_rules()` `p_us_st1.c:1219-1394+`.
  Burst dur `burdr()`/`us_burdr[]` (`p_us_st1.c:1249`); A2-AB zeroed during closure; VOT
  NF60MS stressed / NF7MS|2fr unstressed, AP=48-50 (+5 sonorant) `p_us_st1.c:1362-1394`.
- **Diphthong make_dip** — piecewise-linear from `p_diph[]`; coartic per segment
  (per scout-ph-setar §B.12).

Phoneme inventory: 59 synth phonemes, code 0-58 (SIL..CZ). Each has features, place,
inherent/min/burst duration, and male+female targets (F1-F3,B1-B3,AV as steady/default/
diphthong). Documented in `scout-dectalk-data-report.md` (extracted `inventory.yaml`,
4417 lines).

---

## 2. Qlatt `dectalk-english` port — current state (verified 2026-05-28)

Files: `public/rules/frontends/dectalk-english/{frontend.yaml, pipeline.yaml, inventory.yaml,
phases/{structural,duration,formant,prosody}.yaml}`.

### 2.1 `phases/formant.yaml` — EXISTS (148 lines). Contains exactly 3 rules:
- `dectalk_sw_explicit_override` (`formant.yaml:3-15`): sets `params.SW` from
  `current.inventorySW` when present.
- `dectalk_sw_default_assignment` (`formant.yaml:17-29`): SW=1 for
  fricative/affricate/stop_release/stop_aspiration, else 0.
- `dectalk_obstruent_parallel_amplitudes` (`formant.yaml:31-147`): per-phoneme A3/A4/A5/A6/AB
  dispatch for F,V,TH,DH,S,Z,SH,ZH,CH,JH, conditioned on a derived `following_class`
  (obstruent / back_rounded / front / back_unrounded) computed at `formant.yaml:41-59`.
  Cites `p_us_st1.c` + `p_us_rom.h` (us_ptram/us_malamp).

NOTE: this closes part of the old scout's "GAP #21/#10" — A2-A6/AB ARE now supplied for
continuant obstruents. But it covers only steady-state fricative/affricate amplitudes by
following-segment class; it is NOT the locus/smoothing transition engine.

### 2.2 `inventory.yaml` (1559 lines). 123 phoneme entries (`grep -cE "^  [A-Z]"`).
Per-phoneme keys present (counts via grep): F1/F2/F3 (73), B1/B2/B3 (74), AV (70),
AF (16), AH (10), AN (4), A1-A10 (A7-A10: 9; A5: 6; A4/A6: 4; A2/A3: 2; A1: 3),
AB (3), SW (6), FNP/FNZ/BNP/BNZ (4 each), `diph` (10), `trajectory` (10),
`burstDuration` (6), `stopReleaseProfiles` (6), `inventorySW` (0 — none),
feature flags (voiced/voiceless/front/back/hi/mid/low/rhotic/place flags).
`base_params` includes A1-A10, AB, SW, TL=0, FNP/FNZ, FGP/FGZ etc.

- **Diphthongs** stored as `diph: [AA1, IH1]` + a `trajectory:` map of F1/F2/F3 →
  ordered `{value, time}` waypoints (last `time: null`). Example AY1 at
  `inventory.yaml:278-319`. Realized by structural rule (see 2.3).
- **Stop releases** (`*_REL`) carry per-following-class A2-A6/AB burst profiles in
  `stopReleaseProfiles:` (`inventory.yaml:1300,1328,1356,1385,1414,1443`), keyed
  front_vowel/back_unrounded_vowel/back_rounded_vowel/obstruent. Example P_REL
  `inventory.yaml:1300-1304`, T_REL `:1328-1332`. Plus inline A4/A5/A7-A10 steady values.
- **TILT (TL)**: only `base_params.TL: 0` (`inventory.yaml:30`). NO per-phoneme TL.
- **Nasal pole/zero**: FNP/FNZ/BNP/BNZ present on 4 phonemes (nasals).

### 2.3 `phases/structural.yaml` (680 lines) — 10 rules (`grep "^  [a-z_]+:"`):
- `dectalk_apply_diphthong_trajectories` (`structural.yaml:3-18`): replaces a diphthong
  vowel with `control_windows: trajectory_to_windows(...)` — renders the inventory
  trajectory as time-ordered control windows. (This is the make_dip analog, but WITHOUT
  general/special coarticulation blending of the trajectory toward neighbors.)
- voiceless/voiced stop release + aspiration insertion (`:20,113,221,299,368`): inserts
  `*_REL`/`*_ASP` segments, computes VOT split from policy, applies burst-amplitude
  reductions and open-glottis B1/B2 widening (`+250/+70`), sets SW=1 on burst windows.
  This is the burst-timing / VOT analog of `us_special_rules()`.
- `dectalk_weaken_interdental_frication` (`:402`): /th,dh/ weak-tail hack.
- breathy onset/offset rules (`:474,548,622`): AP-style breathy onsets/offsets via
  prefix/suffix windows — declarative approximations of source-amplitude backward smoothing.

### 2.4 Formant interpolation between phones = generic track-assembler blend.
Configured in `frontend.yaml` output block, NOT a DECtalk transition engine:
- `output.transitions.blend.factor: 0.5` (`frontend.yaml:352-355`),
  `keys: [F1,F2,F3,B1,B2,B3]` (`:356`), `smooth_types: [vowel,nasal,liquid,glide]` (`:357`).
- `default_transition_ms: 30` (`frontend.yaml:347`).
- `parameters.policy.formant.coarticulation_weight: 0.3`, `transition_time_ms: 30`
  (`frontend.yaml:255-256`) — declared but no rule consumes them for locus/smoothing
  (they are referenced only as policy values; no rule in formant.yaml/structural.yaml reads
  `coarticulation_weight`).

### 2.5 Search confirmation (no transition engine in port):
`grep -rniE "locus|maleloc|femloc|forw_smooth|back_smooth|coartic"` over the port returns
ONLY comment text in frontend.yaml/structural.yaml citations and the
`coarticulation_weight` policy key — NO rule logic. No `setloc`, no per-formant transition
durations (NF20MS-NF130MS), no general-coartic averaging, no special-coartic Hz offsets,
no V-V coarticulation.

---

## 3. GAP enumeration

Each: DECtalk source (file:line), port status, rough size.

| # | Component | DECtalk file:line | Port status | Size |
|---|-----------|-------------------|-------------|------|
| D1 | **Locus tables + setloc obstruent↔sonorant transitions** | `ph_sttr2.c:71` (setloc); tables `p_us_rom.h:4449` (us_maleloc), `:5366` (us_femloc) | **MISSING.** No locus table ported; no rule computes `locus + prcnt*(curval-locus)/100`. Generic 0.5 blend used instead. | Large — ~900 lines of table per sex + setloc logic; needs new inventory locus block + new rule phase |
| D2 | **Forward smoothing (per-parameter bouval + durtran)** | `us_forw_smooth_rules()` `p_us_st1.c:413-810` | **MISSING.** No per-parameter transition durations (NF20-130MS); no soncon→vowel 25/75 rule, /R/ NF70MS, B1-widen-after-voiceless, silence-onset rules. Replaced by fixed 30ms / 0.5 blend (`frontend.yaml:347,352`). | Large — ~400 src lines of branching |
| D3 | **Backward smoothing** | `us_back_smooth_rules()` `p_us_st1.c:810+` | **MISSING.** No `tbacktr`/per-param backward transition. Breathy offset rule (`structural.yaml:622`) covers only source-amplitude tail, not formant backward transitions. | Large — ~mirror of D2 |
| D4 | **General coarticulation (10/15/25% neighbor-average blend)** | `ph_setar.c` coartic block | **MISSING.** `coarticulation_weight: 0.3` declared (`frontend.yaml:255`) but unused by any rule. Track-assembler 0.5 blend is symmetric, not the average-minus-self model, and applies only to smooth_types boundaries. | Medium |
| D5 | **Special coarticulation (context Hz offsets, ±400 cap)** | `us_special_coartic()` `p_us_st1.c:301-413` | **MISSING.** No F3 -=150 near W/R/RX, no F2 offsets near LX/W/LL, no UW-after-alveolar, no unstressed +50%/phrase-final -50% scaling. | Medium — ~110 src lines |
| D6 | **V-V coarticulation across consonant (slow F2 drift)** | `vv_coartic_across_c()` in `ph_sttr2.c` | **MISSING.** No slow-F2-drift superimposed component. | Medium |
| D7 | **Per-phoneme TILT targets** | `p_us_st1.c:250-284` (TILT assignment), `:774`,`:1170` (jump near stop/sil) | **MISSING.** Only `base_params.TL: 0` (`inventory.yaml:30`); no per-phoneme TL (7 obstruent / 20 /h/ / 40 bdg / 6 nasal). Also note synth-side: scout-qlatt-synth-capabilities §5.1.3 reported impulse source has no tilt param, so TL has no audible effect at sourceMode=0 — verify separately. | Small (data) + possible synth gap |
| D8 | **Steady parallel amplitudes for continuant obstruents (A3-A6/AB by following class)** | `p_us_st1.c:229-237` + `p_amp` tables `p_us_rom.h:2926,2991,3599` | **PARTIAL / PRESENT.** `dectalk_obstruent_parallel_amplitudes` (`formant.yaml:31-147`) supplies A3-A6/AB for 10 continuant obstruents by `following_class`. A2 not set by this rule (only A3-A6/AB dispatched). Coverage vs the full `us_malamp[]`/`us_femamp[]` tables and female speaker amps NOT verified. | Small remaining — A2 + female amps + table-completeness audit |
| D9 | **Stop burst amplitude profiles (A2-A6/AB during release)** | `us_special_rules()` `p_us_st1.c:1219+`, `us_burdr[]` | **PRESENT.** `stopReleaseProfiles` per following-class in inventory (`inventory.yaml:1300+`) + structural insertion rules (`structural.yaml:20-401`). Closure-zeroing + burst timing approximated. Fidelity vs us_burdr[] not numerically diffed. | Small remaining — numeric audit |
| D10 | **VOT / aspiration (AP)** | `us_special_rules()` `p_us_st1.c:1362-1394` | **PRESENT (as AH).** VOT split + aspiration windows in structural rules; AP modeled as AH (`*_ASP` segments). Policy values mirror DECtalk (`frontend.yaml:90-113`). No distinct AP signal path. | Small / design-choice |
| D11 | **SW cascade/parallel switch per frame** | `ph_setar.c` (set in phsettar) | **PRESENT.** `formant.yaml:3-29` (explicit override + type-based default). | Done |
| D12 | **Diphthong trajectories (make_dip)** | `ph_setar.c` make_dip; `p_diph[]` | **PARTIAL.** Inventory `trajectory:` waypoints (`inventory.yaml:278+`) realized via `trajectory_to_windows` (`structural.yaml:3-18`). MISSING the per-segment coarticulation blend toward tarlas/tarnex that make_dip applies (10/15/25%). | Small remaining |
| D13 | **us_gettar context target modifications** (fricative F1+40 near vowel; /n,en/ B2/B3; voiced-stop AV gating; /h/ AV/AP by context) | `p_us_st1.c` us_gettar | **MISSING / PARTIAL.** No rule raises fricative F1 by 40 after a vowel, no /n/ B2 widen / B3 set near front vowels, no voiced-stop AV→0 after voiceless. (Some /h/ and voiced-onset behavior approximated by structural breathy rules.) | Medium |

### 3.1 Summary
The port now has the **steady-state per-phoneme acoustic map** (formants, bandwidths, AV/AF/
AH/AN, parallel A2-A10/AB for obstruents and stop bursts), **SW switching**, **diphthong
trajectory rendering**, **stop release/VOT/burst insertion**, and **source-amplitude breathy
onset/offset approximations**.

The port LACKS the **inter-phoneme formant transition engine**: locus tables (D1),
forward/backward smoothing with per-parameter transition durations (D2/D3), general (D4) and
special (D5) coarticulation, V-V coarticulation (D6), per-phoneme TILT (D7), and the us_gettar
context target modifications (D13). Between phones the port uses the generic track-assembler
symmetric 0.5 blend over F1-F3/B1-B3 at smooth_type boundaries (`frontend.yaml:347-357`). This
matches the prior notes' assessment that formant transitions/coarticulation are the largest
outstanding frontend gap — and verifies it is STILL outstanding, except that parallel
amplitudes (old GAP #10) are now substantially closed.

### 3.2 Caveats / not verified
- DECtalk `us_malamp[]`/`us_femamp[]` not numerically diffed against the port's A-value
  dispatch (D8); female-speaker amplitudes appear absent from the port (port amps are single
  values, not male/female).
- TILT having no audible effect at sourceMode=0 is from an older scout report, not re-verified
  this session (synth-side, out of this report's strict scope).
- `coarticulation_weight: 0.3` and `transition_time_ms: 30` policy keys are present but I found
  no rule that consumes them; the consumer (if any) would be in the track-assembler TS, not the
  YAML rules — not traced here.
