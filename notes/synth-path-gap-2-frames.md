# Synth-Path Gap 2 — Frame Generation (target-setting, frame timing, smoothing)

Date: 2026-05-29. Scout recon, observations only. REFERENCE = DECtalk 4.63 C
(`C:\Users\Q\src\dectalk\463\dapi\src\PH\`). PORT = Qlatt
(`src/track-assembler.ts`, `public/rules/frontends/dectalk-english/`). Every
claim cites file:line. "UNKNOWN" where the source does not settle it.

Pipeline frame loop confirmed: `ph_claus.c:365` "For each 6.4 msec frame of
current clause"; `ph_claus.c:383` `if (++tcum >= durfon)` advances `nphone++`
(`:400`), resets `tcum -= durfon` (`:449`), reloads `durfon = allodurs[nphone]`
(`:450`), and calls `phsettar()` (`:466`) to recompute all per-phone targets;
THEN `phdraw()` (`:482`) emits one control frame EVERY 6.4 ms. So DECtalk: one
`phsettar` per phone, one `phdraw` per 6.4 ms frame.

---

## Q1. Target setting — does Qlatt produce the same per-phoneme target set?

REFERENCE. `phsettar()` (`ph_setar.c`) runs once per phone and, per parameter
`np`, iterates the full list F1,F2,F3,FZ,B1,B2,B3,AV,AP,A2,A3,A4,A5,A6,AB,TILT
(`ph_draw.c:33-35` ordering; param loop `ph_draw.c:343` F1..B3, `:427` AV..TILT).
For each it sets four targets (`ph_setar.c:377,384,398,619`): `tarlas` (end of
prev), `tarcur` (begin of cur), `tarend` (end of cur), `tarnex` (begin of next).
`gettar()` (`p_us_st1.c:79-298`) builds the per-phone target with context rules:
fricative F1 +40 after a vowel (`p_us_st1.c:115-121`); /n/ B2 +60 before
non-front (`:124-131`); /n/ B3=1600 near high-front (`:133-141`); FZ nasal-zero
(`:149-156`); AV with glottal-stop/dummy-vowel/devoicing/unstressed reductions
(`:162-206`); AP aspiration for /h/ (`:210-222`); parallel amps A2-A6/AB from the
obstruent `taram`/`p_amp` table keyed by following begtyp (`:226-247`); and
**TILT** per-phone (`:252-294`): 0 default, 7 obstruent, 40 voiced plosive/JH,
+6 nasal/front-vowel, +3 else, 20 for /h/, 10 dummy-vowel.

PORT. Inventory + structural produce a per-segment steady `params` map
(`track-assembler.ts:1672-1678`: `segment.params` coerced, else SIL defaults).
The blended keys are only `[F1,F2,F3,B1,B2,B3]` (`frontend.yaml:582`). AV/AF/AH,
A1-A6, AB, TILT, FZ are carried as per-segment steady values, not as a
four-target (tarlas/tarcur/tarend/tarnex) structure.

- **PARTIAL.** Qlatt has a single steady target per segment, NOT DECtalk's
  4-target (begin/end/prev/next) structure. DECtalk distinguishes a phone's
  BEGIN target from its END target (`tarcur` vs `tarend`); they differ after
  general coartic on `tarnex` (`ph_setar.c:773`) and for diphthongs (`make_dip`
  `:404`). Qlatt represents within-segment motion only via diphthong
  `trajectory` control_windows (`structural.yaml` trajectory_to_windows) — there
  is no generic per-segment begin≠end target.
- **MATCH (data present):** TILT per-phone targets exist as DATA — the
  special-coartic/tilt values were extracted (`frontend.yaml:454-505` special
  coartic). Per-phone TILT inventory targets: UNKNOWN whether inventory carries
  the gettar TILT table (7/40/+6/+3/20/10); the tier-4 design flagged TILT as a
  deferred chunk t4e (`chunk-dt-tier4-transition-design.md:433-437`). Could not
  confirm a `TL:` field per phoneme in inventory from frame-stage files.
- **GAP:** `gettar` context micro-rules (fricative F1+40 after vowel; /n/ B2+60,
  B3=1600; AV glottal/dummy/devoice reductions) are target-build rules. Whether
  these are replicated in `phases/structural.yaml`/`formant.yaml` is UNKNOWN from
  the frame-stage read (they would be in those phase YAMLs, not the assembler).

---

## Q2. Smoothing model — forward & backward smoothing; linear vs filtered

REFERENCE. A transition is a **boundary value `bouval` placed AT a segment edge,
ramping LINEARLY to the segment's steady `tarcur` over `durtran` frames**. This
is unambiguous and integer-linear, NOT a filter/exponential:
- Conversion (`ph_setar.c:840-855`): `ftran = (bouval - tarcur) << 3` (×8 fixed
  point); `dftran = mlsh1(ftran, divtab[durtran])` (= ftran/durtran per frame);
  `ftran = dftran*durtran` (re-quantize).
- Per-frame draw, FORM_FREQ/BW loop (`ph_draw.c:369-402`):
  `value = dipcum + ftran; if (ftran) ftran -= dftran;` (forward decays),
  `if (tcum >= tbacktr) { value += btran; btran += dbtran; }` (backward ramps in
  the LAST `durtran` frames, gate `tbacktr = durfon - durtran`, set
  `p_us_st1.c:1206`), then `*parp = (value DIV_BY8) + tarcur`.
- Amplitude loop (`ph_draw.c:427-450`): same linear `ftran`/`btran` mechanism.

Forward smoothing = segment START edge; rules `us_forw_smooth_rules`
(`p_us_st1.c:431-803`). Backward = segment END edge; `us_back_smooth_rules`
(`p_us_st1.c:826-1180`). Per-PARAMETER `durtran` (e.g. F1 NF20MS vs F2/F3 NF45MS;
/r/ NF70MS `:462`; nasal F1 jumps durtran=0 `:554`; B-widening NF50/100MS). The
default (no rule) is forward `bouval=(tarlas+tarcur)/2, durtran=NF30MS`
(`ph_setar.c:784-785`) and backward `bouval=(tarend+tarnex)/2, durtran=NF25MS`
(`ph_setar.c:903-904`). Universal clamp `durtran>durfon→durfon`, `>NF130MS→
NF130MS` (`p_us_st1.c:795-799`, `:1201-1205`).

PORT. `resolveBoundaryParams` (`track-assembler.ts:1239-1264`) +
`midpointBoundaryResolver` (`:1211-1223`): `bouval = steady + (neighbor-steady)*
factor` with factor 0.5 (`frontend.yaml:578-581`) — this IS DECtalk's no-rule
default 50% midpoint. Locus override `resolveLocusBoundary`
(`track-assembler.ts:1304-1371`): `bouval = locus + prcnt*(curval-locus)/100`
(`:1362`), matching `ph_sttr2.c:328-329`, with both setloc prcnt adjustments
implemented (`:1351-1359`). Forward AND backward edges both emitted
(`track-assembler.ts:1745-1821`). The interpreter ramps LINEARLY between event
points (`klatt-interpreter.ts:433-436` `linearRampToValueAtTime`).

- **MATCH (shape):** linear ramp, both edges, boundary-value model, default 50%
  midpoint, locus formula, per-formant durtran from locus data
  (`resolveLocusBoundary` reads `entry.durtran_ms` `:1366`). The blend is linear
  in both, not filtered/exponential — correct.
- **GAP (coverage):** Qlatt's MIDPOINT smoothing (the no-locus default) fires
  ONLY when BOTH segments are in `smooth_types`
  (`vowel,nasal,liquid,glide` `frontend.yaml:583`; gate
  `canMidpointSmooth` `track-assembler.ts:1749-1752`). DECtalk's default 50%
  blend applies at EVERY sonorant boundary including the obstruent-obstruent and
  sonorant-default cases via `us_forw/back_smooth_rules` for ALL params. Qlatt
  emits NO midpoint transition when one side is an obstruent without locus data,
  and NO transition for B1-B3 except where the locus block has them (locus only
  populates F1/F2/F3 — `resolveLocusBoundary:1342` `B1-B3 keep steady`).
- **GAP (per-parameter durtran for sonorant-sonorant):** the midpoint path uses
  ONE shared `phTransitionSec` (default 30ms `frontend.yaml:573`) for all of
  F1/F2/F3/B1/B2/B3 (`track-assembler.ts:1754,1762`). DECtalk's
  `us_forw/back_smooth_rules` assign DIFFERENT durtran per parameter even on
  sonorant boundaries (F3 NF64MS backward `:852`; /r/ F2/F3 NF70MS `:462`; /l/
  F1 +80 discontinuity `:457,857`; B-widening NF40/50/100MS `:607-666,982-1034`;
  nasal F1 durtran=0 jump `:554,929`). NONE of these per-param sonorant rules are
  in the midpoint path — Qlatt uses a flat 30ms 50% blend for all six keys.
- **GAP (specific forward/backward rules):** the 25/75 soncon→vowel
  (`p_us_st1.c:453`), 75/25 vowel→soncon (`:481`), /HX/ averaging (`:471`),
  voiceless-plosive F1+100 (`:531,916`), nasal-murmur F2/F3 lowering
  (`:558-577,931-951`), B1 widen before voiceless C (`:986-999`), NASAL_ZERO FZ
  smoothing (`:593-602,966-977`), and the entire AV/AP/A2-A6 onset/offset
  detection (`:671-792,1043-1167`) are NOT in the midpoint path. Several of these
  values ARE present as DATA in `frontend.yaml` (e.g. open_glottis_b1/b2 widen
  `:222-223`, vowel_breathy_offset `:446-448`, voiceless_open_tract breathy
  `:435-436`) — but they are consumed by duration/formant PHASE rules, not the
  frame-stage smoothing primitive; whether those phase rules reproduce the
  forward/backward edge ramps is UNKNOWN from the assembler read.

---

## Q3. Coarticulation — general / special / V-V; active vs #ifdef'd

REFERENCE.
- **General coartic** (`ph_setar.c:419-619`, English `:558-568`): pulls `tarcur`
  toward neighbor average, `gencoartic`=N10PRCNT default, N15PRCNT unstressed,
  N25PRCNT unstressed-F2 (`:562-565`), nasals 0 (`:607-611`). Second pass on
  `tarnex` at N10PRCNT (`:627-773`). ACTIVE in 4.63 (English path runs).
- **Special coartic** `us_special_coartic` (`p_us_st1.c:314-410`): F3 -150 near
  W/R/RX (`:336`); F2 front-vowel offsets near LX/W/LL (`:348,367`), AY/OY before
  LX -250/-350 diphpos-dependent (`:353,359`), UW±200 near alveolar (`:375,383`),
  unstressed ×1.5 (`:389`), phrase-final ×0.5 (`:400`), clamp ±400 (`:403-406`).
  ACTIVE.
- **V-V coartic across C** (F2 only, `ph_draw.c:386-396`; setup
  `ph_setar.c:875-897`): DISABLED in 4.63 — `vv_coartic_across_c` hardcodes
  `vvbouval=0; vvdurtran=0` (per `chunk-dt-tier4-transition-design.md:130-137`,
  `ph_sttr2.c:410-411`). Effectively no-op.

PORT.
- General + special coartic are implemented as SCALAR TARGET rules in
  `phases/formant.yaml` (special-coartic DATA at `frontend.yaml:454-505`:
  alveolar/front_vowels lists, the -150/+200 offsets, unstressed 1.5,
  phrase-final 0.5, ±400 clamp). **MATCH (diphpos-independent cases).**
- **GAP (deferred):** diphpos-dependent special cases (AY/OY before LX -250/-350;
  unstressed YU 2nd-half +400) are DEFERRED — `frontend.yaml:454-460` states
  diphpos is not exposed to scalar rules. DECtalk applies them (`:353-359,392`).
- **MATCH (V-V):** Qlatt does nothing for V-V coartic; 4.63 also does nothing
  (disabled). Matching 4.63 = correct.
- General-coartic weights (10/15/25%) present as DATA UNKNOWN at frame stage —
  the tier-4 design banked them as chunk t4d (`chunk-dt-tier4-transition-design.md
  :427-432`); whether t4d landed in `formant.yaml` is UNKNOWN from this read.

---

## Q4. Frame rate / durtran

REFERENCE. Frame interval = **6.4 ms** (`ph_claus.c:200,365`; `ph_draw.c:25`).
`durfon`/`durtran` are FRAME COUNTS; `mstofr()` converts ms→frames. `phdraw`
emits a control frame every 6.4 ms unconditionally (`ph_claus.c:482`). durtran is
computed PER BOUNDARY, PER PARAMETER inside the smooth rules (Q2), clamped to
`[0, min(durfon, NF130MS)]`.

PORT. F0 control cadence = 6.4 ms (`frontend.yaml:111` `frame_period_sec:
0.0064`; `track-assembler.ts:565-567`). BUT the FORMANT/amplitude track frames
are emitted at EVENT POINTS, not a fixed cadence: `buildSegmentEventTimes`
(`track-assembler.ts:355-426`) emits frames only at segment_start, F0 anchors,
the transition steady time(s), and control-window boundaries. The interpreter
then `linearRampToValueAtTime` BETWEEN those sparse points
(`klatt-interpreter.ts:433-436`).

- **MATCH (transition cadence):** DECtalk's per-frame linear decay between two
  endpoints is mathematically the SAME line the interpreter draws between
  steadyTime and the boundary event — both are straight lines. Sampling density
  (6.4ms vs event-point) does not change a linear segment's value at any time, so
  formant/BW transitions are numerically equivalent IF endpoints + span match.
- **GAP (non-linear per-frame effects lost):** DECtalk's `phdraw` runs PER FRAME
  and applies effects that are NOT piecewise-linear between segment endpoints, so
  sparse event-point sampling cannot reproduce them:
  - **F0-dependent source TILT** computed every frame
    (`ph_draw.c:645-723`): `temptilt = 8 - frac4mul(f0-900, f0_dep_tilt)` (male),
    clamped 0..31, plus breathy tilt buildup (`:676-712` increments per frame).
    This is a per-frame function of the instantaneous F0 contour — not a value
    interpolable from two segment endpoints.
  - **Per-frame formant scaling** `fnscale` (`ph_draw.c:733-736`): F1/F2/F3 scaled
    each frame AFTER smoothing (with an F1>250 guard and different additive terms
    per formant). UNKNOWN whether Qlatt applies an equivalent post-smoothing
    formant scale at frame stage (`speaker.formant_scale: 1.0` exists
    `frontend.yaml:513` but its application site is UNKNOWN).
  - **AV reduction by glottal stop** `avglstop` per frame (`ph_draw.c:619-622`).
  - **`tspesh`/`pspesh` special-rule overrides** (`ph_draw.c:406-412,454-460`):
    for `tcum < tspesh`, `*parp = pspesh` — a HARD STEP for the first N frames
    (VOT aspiration, voicebar, B1/B2 widening during aspiration
    `p_us_st1.c:1441-1448,1463-1477`). This is a per-frame conditional override,
    not a ramp; a sparse two-point track cannot express "hold pspesh for the
    first tspesh frames then resume the ramp." Whether Qlatt models VOT via a
    control_window of the right span is PARTIAL — VOT data exists
    (`frontend.yaml:201-227`) but the open-glottis B1/B2 widening as a held step
    over the VOT window is UNKNOWN at frame stage.

---

## Q5. Amplitude / bandwidth smoothing — smoothed like formants, or stepped?

REFERENCE. AV/AP/A2-A6/AB use the SAME linear `ftran`/`btran` boundary-value ramp
as formants (`ph_draw.c:427-450`), with their OWN onset/offset durtran rules
(`p_us_st1.c:671-792` forward, `:1043-1167` backward): e.g. voicing onset abrupt
(durtran=0) except after voiced fric (`:1059-1063`); gradual buildup from silence
NF45MS (`:692`); fall-into-silence NF70MS (`:734`); breathy AP offset NF130MS
(`:1164-1166`); next-burst → durtran=0 (`:1138-1144`). Bandwidths B1-B3 likewise
ramp with B-specific durtran (`:604-667,980-1040`). So in DECtalk amplitudes and
bandwidths ARE smoothed (ramped), with abrupt cases expressed as durtran=0.

PORT. `smooth_types`/blend keys = `[F1,F2,F3,B1,B2,B3]` only
(`frontend.yaml:582`). AV/AF/AH/A1-A6/AB are NOT blend keys — they are carried as
per-segment steady values and scheduled by the interpreter's ramp/step policy:
semantics `ramp:true` params (AH/AF use `linearRampToValueAtTime`) vs
`setValueAtTime` for the rest (`klatt-interpreter.ts:48-51,239-240,432-436`;
AGENTS.md "Ramp vs Step": AH/AF ramp, SW step). So amplitude transitions in Qlatt
happen as interframe ramps ONLY between event points, with no per-boundary
onset/offset durtran rule.

- **PARTIAL.** B1-B3 ARE in the blend keys, so they get the 50% midpoint /
  locus ramp like formants — but the locus table only populates F1/F2/F3
  (`resolveLocusBoundary:1342`), so B1-B3 only get the sonorant-sonorant midpoint
  blend, never DECtalk's B-widening rules (B1 +250 during aspiration, +F1/8 after
  voiceless, NF100MS nasal widening `p_us_st1.c:617,993,1031`). **GAP.**
- **GAP:** amplitude (AV/AF/AH/A2-A6/AB) onset/offset durtran rules
  (`p_us_st1.c:671-792,1043-1167`) have no frame-stage equivalent — Qlatt's AH/AF
  ramp is a generic interframe ramp, not a per-boundary onset-detect with the
  DECtalk spans (NF20/45/70/130MS) and abrupt (durtran=0) cases. Some values are
  present as DATA (breathy onset/offset ms, source_onset_boundary_drop
  `frontend.yaml:435-448`) but their application path is the duration/formant
  PHASE, not the frame smoother; reproduction UNKNOWN.

---

## Q6. Present in DECtalk frame stage, ABSENT/UNCONFIRMED in the port

1. **Per-frame `phdraw` pass with non-linear effects** (`ph_draw.c`): F0-dep
   TILT (`:645-723`), breathy tilt/AH buildup (`:676-712`), `fnscale` formant
   scaling (`:733-736`), `avglstop` (`:619-622`), `tspesh`/`pspesh` step
   overrides (`:406-412,454-460`). Qlatt has no per-frame post-smoothing pass;
   the track is sparse event points with linear interpolation. The TILT-vs-F0 and
   tspesh-step behaviors are the most clearly non-reproducible by linear track.
2. **4-target (begin/end/prev/next) per-phone model** (`ph_setar.c:377-619`).
   Qlatt has one steady target per segment (begin=end) except diphthong windows.
3. **General 50% midpoint blend at ALL boundaries** — Qlatt gates it on both
   sides ∈ smooth_types (`track-assembler.ts:1749-1752`); obstruent-adjacent
   non-locus boundaries get NO transition.
4. **Per-parameter durtran on sonorant-sonorant boundaries** — Qlatt midpoint
   path uses one flat 30 ms span for all 6 keys (`track-assembler.ts:1754,1762`);
   DECtalk varies per param (F3 NF64MS, /r/ NF70MS, nasal F1 durtran=0, etc.).
5. **Forward/backward amplitude & bandwidth onset/offset rules**
   (`p_us_st1.c:604-792,980-1167`) — no frame-stage equivalent (Q5).
6. **NASAL_ZERO (FZ) boundary smoothing** (`p_us_st1.c:593-602,966-977`,
   `NASAL_ZERO_BOUNDARY`, NF80/130MS) — FZ is not a blend key; UNKNOWN if a phase
   rule handles it.
7. **`tspesh`/`pspesh` special rules** (`p_us_st1.c:1235-1479`): burst-duration
   closure gains, VOT aspiration with held B1/B2 widening, voicebar — these are
   per-frame held-step overrides applied in `phdraw`. PARTIAL: VOT/burst data
   exist as policy (`frontend.yaml:201-227`) but the held-step-over-N-frames
   shape is UNKNOWN at frame stage.
8. **`durmin` floors** — the backlog flagged DECtalk durmin floors as deferred;
   Qlatt has `duration_floors.stop_release_ms=7`, `default_ms=30`
   (`frontend.yaml:558-566`). Whether these match DECtalk's per-class durmin is
   UNKNOWN (a duration-phase question, not frame stage).
9. **Pre-emphasis / global smoothing pass** — DECtalk has NO global post-pass
   smoothing beyond per-frame `phdraw`; Qlatt has none either. No gap here.

---

## GAP SUMMARY (ranked by likely audible impact)

1. **[HIGH] Obstruent-adjacent & general default smoothing coverage.** Qlatt's
   50% midpoint blend fires only between two smooth_types segments
   (`track-assembler.ts:1749-1752`); every vowel↔obstruent boundary WITHOUT
   locus data, and all B1-B3 at obstruent boundaries, get no transition. DECtalk
   smooths every boundary for every parameter (`p_us_st1.c` forw/back rules).
   Locus F1/F2/F3 (which DO fire) mitigate this for the ~25 obstruents in the
   `loci` table, but bandwidths and non-locus cases remain stepped. Audible as
   abruptness / clicks at consonant boundaries.
2. **[HIGH] Per-frame F0-dependent TILT + tspesh step overrides** (`ph_draw.c
   :645-723`, `:406-412`). The source spectral tilt tracks instantaneous F0 every
   frame and VOT/voicebar hold a stepped value for the first N frames; a sparse
   linear track cannot reproduce either. Affects voice timbre and stop release
   crispness (parity-relevant given the recent impulse-source/tilt work).
3. **[MEDIUM] Per-parameter durtran on sonorant boundaries.** Flat 30 ms 50%
   blend for all 6 keys vs DECtalk's per-param spans (/r/ F2/F3 NF70MS, F3
   NF64MS, /l/ F1+80 jump, nasal F1 durtran=0). Audible in liquid/nasal
   transitions (the /r/, /l/, /n/, /m/ "shape").
4. **[MEDIUM] Amplitude/bandwidth onset-offset rules** (`p_us_st1.c:604-792,
   980-1167`): voicing onset abruptness, breathy AP offset NF130MS, B1 widening
   before voiceless C, gradual-from-silence buildup. Qlatt's generic AH/AF ramp
   lacks these per-boundary spans/abrupt cases. Affects naturalness of
   voicing/breathiness boundaries.
5. **[LOW] 4-target begin≠end model** — matters only where a phone's begin and
   end targets genuinely differ (mainly diphthongs, already handled via
   trajectory windows). Low incremental impact.
6. **[LOW] diphpos-dependent special coartic** (AY/OY before LX; YU 2nd-half) —
   small, context-narrow F2 offsets, explicitly deferred.
7. **[CONFIRMED-OK] V-V coartic** — disabled in 4.63; Qlatt also no-op. No gap.

UNKNOWNs to resolve outside the frame stage (in duration/formant phase YAML, not
read here): whether general-coartic weights, gettar micro-rules, per-phone TILT
inventory, FZ smoothing, VOT held-step windows, and durmin floors are reproduced
by phase rules. These were banked as tier-4 chunks t4b/t4c/t4d/t4e
(`chunk-dt-tier4-transition-design.md:404-444`); their landing status is not
determinable from the frame-generation files alone.
