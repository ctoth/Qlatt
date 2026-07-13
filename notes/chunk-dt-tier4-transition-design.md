# Chunk DT Tier-4 — DECtalk Formant Transition / Coarticulation Design

Date: 2026-05-29. Scout recon. RECON ONLY — no Qlatt files modified.
Builds on `notes/dectalk-gap-D-formant-inventory.md` (which located all the pieces).
All claims cite file:line. Reference tree: `C:\Users\Q\src\dectalk\463\dapi\src\PH\`.

---

## 1. DECtalk 4.63 transition algorithm (reimplementation detail)

### 1.0 Per-segment target fields and the linear-ramp draw mechanism

`phsettar()` (`ph_setar.c`) runs once per phoneme `nphone`, per parameter `np`
(iterating F1,F2,F3,FZ,B1,B2,B3,AV,AP,A2..A6,AB,TILT — `ph_setar.c:29`/`:373`).
Each parameter struct carries four targets (`ph_setar.c:377,384,398,619`):
- `tarlas` = target at END of previous phone (`= old tarend`, L377)
- `tarcur` = target at BEGINNING of current phone (`gettar`, L398)
- `tarend` = target at END of current phone (set L619, after general coartic)
- `tarnex` = target at BEGINNING of next phone (`getbegtar`, L384)

A "transition" is NOT a blend between two segments' steady values. It is a
**boundary value `bouval` placed AT the segment boundary, decaying LINEARLY to
`tarcur` over `durtran` frames.** Two transitions per segment:
- **forward** smoothing = the segment's START (boundary with previous phone),
  decaying inward to `tarcur` over `durtran` frames from segment onset.
- **backward** smoothing = the segment's END (boundary with next phone),
  ramping over the last `durtran` frames toward `bouval`.

Draw conversion (`ph_setar.c:840-855`, forward):
```
ftran  = (bouval - tarcur) << 3              // initial offset, *8 fixed-point
dftran = mlsh1(ftran, divtab[durtran])        // per-frame decrement = ftran/durtran
ftran  = dftran * durtran                      // re-quantize
```
Per-frame draw (`ph_draw.c:402,433`):
```
value = tarcur + (ftran >> 3);  ftran -= dftran;   // linear decay tarcur+offset -> tarcur
```
Backward smoothing is symmetric, gated on `tcum >= tbacktr` where
`tbacktr = durfon - durtran` (so it only runs in the last `durtran` frames;
`ph_draw.c:379-383,442-445`). **The blend shape is strictly LINEAR.** Default
when no rule fires: forward `bouval = (tarlas+tarcur)/2`, `durtran = NF30MS`
(`ph_setar.c:784-785`); backward `bouval = (tarend+tarnex)/2`, `durtran = NF25MS`
(`ph_setar.c:903-904`). Note the default IS a 50% blend toward the neighbor —
this is exactly what Qlatt currently does (see §2). The locus model and the
smoothing rules OVERRIDE this default for specific contexts.

`durtran` is universally clamped: `> durfon -> durfon`; `> NF130MS -> NF130MS`
(`p_us_st1.c:794-799`). `NF*MS` are frame counts (ph_defs.h); `mstofr()`
converts ms->frames. Frame period = 6.4 ms (`frontend.yaml:59`).

### 1.1 General coarticulation (10/15/25%) — `ph_setar.c:419-619`

Applied to `tarcur` (and a separate pass to `tarnex`) for FORM_FREQ params only,
BEFORE smoothing. English path (`gencoartic` default `N10PRCNT` L421; the
standard-DT3 block L558-568):
```
gencoartic = N10PRCNT           (10%) default
if segment UNSTRESSED: gencoartic = N15PRCNT (15%); if np==F2: N25PRCNT (25%)
if segment is NASAL: gencoartic = 0    (L607-611)
arg1 = ((tarlas + tarnex)/2) - tarcur                    (L605)
tarcur += mlsh1(arg1, gencoartic)                        (L615)
tarend = tarcur                                          (L619)
```
So tarcur is pulled `gencoartic`% toward the average of the two neighbor
targets. The comment (L416) states "5% tarlas, 5% tarnex, 90% tarcur" =
the 10% default. A second pass (L624-773) coarticulates `tarnex` with `tarend`
at `N10PRCNT`. "Only effective for -diph -obst because the locus tables override
obstruent transitions" (L417). Nasals are excluded (gencoartic=0).

### 1.2 Locus model — `setloc()` `ph_sttr2.c:71-369`

`setloc` is called from BOTH smoothers — forward (`p_us_st1.c:509,514`) and
backward (`:894,899`) — to handle the obstruent<->sonorant boundary. It returns
0 (no-op, keep default) unless the boundary is exactly obstruent-on-one-side,
sonorant-on-the-other (`ph_sttr2.c:115-118`: bails if param > F3, or obst side
isn't OBSTRUENT, or son side IS OBSTRUENT).

**Vowel category `sontyx` (1/2/3)** from the sonorant's begin/end type
(`begtyp`/`endtyp`, `ph_sttr2.c:95-101,131`):
- rounded sonorant consonant -> use BACK_ROUNDED (`sontyx` -> 3, L134-135)
- low vowel (type 6) -> use back (`sontyx` -> 2, L142-145)
- final categories: 1 = front-unrounded, 2 = back-unrounded, 3 = back-rounded.

**Table index** (US path, `ph_sttr2.c:159-170`):
```
ploc = us_plocu[ fonobst + 59*(sontyx-1) ]      // 59 = US_TOT_ALLOPHONES
if ploc == 0: return 0                          // no locus for this obstruent
ploc += 3 * (np - &PF1)                          // pick formant block (F1=0,F2=3,F3=6)
locus  = us_maleloc[ploc]                         // [0] locus freq (Hz)
prcnt  = us_maleloc[ploc+1]                       // [1] % of (curval-locus) to keep
durtran= mstofr(us_maleloc[ploc+2])               // [2] transition duration (ms)
```
`us_plocu` is the per-allophone INDEX table (`p_us_rom.h:4207`): codes 0-30 are
0 (silence/vowels/sonorants — no locus); obstruents get 1,10,19,28,37,...
(step 9 = 3 formants x 3 entries). `plocu()` is a 2D deref
`all_plocu[index>>8][index&0xFF]` (`ph_setar.c:1955-1957`; `all_plocu` =
32 pointers all -> us_plocu for the US allophone range, `ph_romi.c:448-453`).

**Boundary value** (`ph_sttr2.c:308-329`):
```
curval  = sonorant's target at the boundary (getbegtar/getendtar, L124/129)
bouval  = locus + muldv(prcnt, (curval - locus), 100)
        = locus + prcnt% of the distance from locus to the vowel target
```
So `prcnt=0` -> formant sits AT the locus at the boundary (full locus pull);
`prcnt=100` -> sits at the vowel target (no pull). The locus is the virtual
target the formant aims toward at the consonant; `prcnt` controls how much the
vowel "wins" at the actual boundary.

**Two prcnt adjustments** (still in setloc):
- rounded-soncon + non-palatal/non-dental obstruent, F2/F3: `prcnt = prcnt/2 + 50`
  (reduce transition extent, `ph_sttr2.c:294-298`).
- F2 of a back-cavity-affiliated vowel (e.g. [iy], `f2backaffil`): `prcnt +=
  25 - prcnt/4`; `durtran = durtran/2 + 2` (`ph_sttr2.c:303-307`).

**Locus table structure (`us_maleloc[]` `p_us_rom.h:4449`, `us_femloc[]`
`:5366`):** a flat `short[]`. Logical shape = `[sontyx 1..3][obstruent allophone]
[formant F1,F2,F3][locus, prcnt, durtran_ms]`. The first obstruent block
(ploc=1) at `p_us_rom.h:4452-4478`:
```
F1: 280, 30, 30      // locus 280 Hz, keep 30% toward vowel, 30 ms
F2: 1200, 10, 25
F3: 2000, 30, 40
```
The data is fully transcribable: read 9 shorts per obstruent allophone, 3
sontyx blocks of 59 allophones each, male + female. (Index 0 = the leading `0`
at L4451; real obstruent data starts at the us_plocu indices.)

### 1.3 V-V coarticulation across a consonant — `ph_sttr2.c:336-361,395-417`

For F2 only, when both flanking segments are vowels: `vv_coartic_across_c()`
computes a slow superimposed F2 drift (`vvbouval`, `vvdurtran`) added in
ph_draw (`ph_draw.c:386-396`). **DISABLED in 4.63**: the body hardcodes
`vvbouval = 0; vvdurtran = 0` (`ph_sttr2.c:410-411`) — the real formula is
commented out. So V-V coartic is effectively a no-op in this release. (Gap D6
can be DEFERRED / dropped — matching 4.63 means doing nothing here.)

### 1.4 Special coarticulation — `us_special_coartic()` `p_us_st1.c:314-410`

Called only for diphthongized vowels; returns an Hz offset added to the target:
- **F3** (`:329-339`): vowel adjacent to W/R/RX -> `temp = -150`.
- **F2** (`:341-407`):
  - front vowel (IY..AE, or IX) before LX -> -150; AY/OY before LX -> -250
    (diphpos==1) / -350 (diphpos>1).
  - front vowel after W/LL/LX -> -150 (not cumulative with the "before" case).
  - UW after an alveolar -> +200; UW/YU before an alveolar -> +200.
  - unstressed: `temp += temp/2` (50% bigger); unstressed YU 2nd half -> +400.
  - phrase-final stressed: `temp = temp/2` (halved).
  - clamp `|temp| <= 400` (`:403-406`).

### 1.5 Forward smoothing rules — `us_forw_smooth_rules()` `p_us_st1.c:431-803`

Sets `bouval`/`durtran` for the segment START. Branches by `par_type`:

**FORM_FREQ (F1/F2/F3) (`:442-591`):**
- current is sonorant, not soncon (= vowel):
  - prev was soncon: 25/75 rule `bouval = (bouval + tarlas)/2` (`:453`);
    light /LL/ F1 += 80 (`:457`); out-of-/R/ F2/F3 `durtran = NF70MS` (`:462`).
  - prev was vowel: vowel-vowel/[h] — only /HX/ averages with tarlas (`:471`).
- current is soncon:
  - prev vowel: 75/25 `bouval = (bouval + tarcur)/2`, `durtran = NF30MS` (`:481-482`).
  - prev soncon: `durtran = NF30MS` (`:487`).
- current is SIL (`:493-505`): `bouval = tarlas` (or tarnex if first phone),
  `durtran = durfon`.
- else (`:509-579`): call `setloc` for obst->sonor (`:509`) AND sonor->obst
  (`:514`). Then:
  - voiceless plosive prev, F1: `bouval += 100` (`:527-532`).
  - current obstruent: `durtran = NF30MS`, F1 -> NF20MS, plosive ->
    `durtran = durfon` (`:535-545`).
  - current nasal: `durtran = durfon`; F1 jumps (`durtran = 0`); /n,en/ murmur
    after front vowel lowers F2/F3 by 100 (more if F2BACKF); /m/ near [i,e]
    F2 -= 150 (`:548-579`).
- shrink rule: non-obst, prev not obst, scale `durtran` by `shrif` (rate)
  (`:583-590`).

**NASAL_ZERO_FREQ (FZ) (`:593-602`):** nasal->non-nasal sets
`bouval = NASAL_ZERO_BOUNDARY`, `durtran = NF80MS`.

**FORM_BW (B1/B2/B3) (`:604-667`):** default `durtran = NF40MS`. B1 widens
after a voiceless seg (`durtran = NF50MS`, `bouval = tarcur + F1.tarcur/8`,
`:610-618`); voiceless current -> NF20MS; silence boundaries set
`bouval = tarcur + (PB3-np)*50`, NF50MS; nasal-prev widens B1 (NF100MS, +70),
/n/ B2 +60; nasal current -> `durtran = 0` (constant) (`:644-666`).

**PARALLEL_FORM_AMP / AV_OR_AH (AV,AP,A2-A6,AB) (`:671-792`):** onset detect
`bouval = tarcur - 10` when source rising / after plosive / after JH (`:676-708`);
gradual voicing buildup from silence (NF45MS); abrupt after obstruent/plosive;
nasal onset abrupt (`:709-724`); offset detect `bouval = tarlas - 13`,
fall-into-silence NF70MS, AV offset abrupt (`:725-739`); CH/JH A3 buildup
(`:741-748`); breathy vowel->voiceless-open-tract AP onset (bouval 42-46,
NF45-80MS, `:751-771`).

**TILT (`:774-792`):** `durtran = NF25MS`; jumps to target near silence
(`bouval = parstochip[OUT_TLT]` / `tarcur`); near stops `durtran = 0`.

### 1.6 Backward smoothing rules — `us_back_smooth_rules()` `p_us_st1.c:826-1180`

Mirror of forward, for the segment END. `tbacktr = durfon - durtran`
(applied in ph_draw `:379`). Same branch structure:
- FORM_FREQ (`:837-964`): `durtran = NF45MS` default for sonorant; vowel->soncon
  75/25 `(bouval+tarnex)/2`, F3 -> NF64MS, /LL/ F1 +80 (`:847-858`);
  soncon->vowel 25/75 `(bouval+tarend)/2`, NF20MS (`:875-877`); next is SIL ->
  `durtran = 0` (`:887-889`); else `setloc` sonor->obst (`:894`) and obst->sonor
  (`:899`); obstruent/plosive/nasal durtran rules mirror forward (`:903-953`);
  voiceless-plosive F1 +100 (`:914-917`); /n,m/ murmur F2/F3 lowering before
  front vowels (`:931-951`).
- FORM_BW (`:980-1040`): default NF40MS; **B1 widens before a voiceless C**
  (glottis opens early): NF50MS, `bouval = tarend + F1.tarcur/8`, FEMALE ->
  NF100MS (`:986-999`); silence/nasal boundaries as forward.
- PARALLEL_AMP/AV (`:1043-1167`): onset/offset detect; voicing onset abrupt
  except after voiced fric (V/DH/JH/ZH/Z, `:1059-1063`); voicebar dies in voiced
  plosive (`:1066-1080`); next-burst -> `durtran = 0` (`:1138-1144`);
  **vowel->silence breathy offset AP `bouval=52, durtran=NF130MS`** (`:1160-1166`);
  vowel-from-voiceless-open-tract breathy onset AP `bouval=52, NF40MS` (`:1145-1158`).
- TILT (`:1171+`): NF25MS, jumps near silence/stops.

### 1.7 Call order summary (one phone, FORM_FREQ)

1. `tarlas/tarcur/tarnex/tarend` set + diphthong make_dip (`ph_setar.c:377-408`).
2. **general coartic** pulls tarcur/tarnex toward neighbor average (`:419-619`).
3. forward default `bouval=(tarlas+tarcur)/2, durtran=NF30MS` (`:784`).
4. `us_forw_smooth_rules` (overrides, calls `setloc` for obst<->sonor) (`:797`).
5. convert to `ftran/dftran` (`:840-855`).
6. backward default `bouval=(tarend+tarnex)/2, durtran=NF25MS` (`:903`).
7. `us_back_smooth_rules` (`setloc` again) -> `btran/dbtran`, `tbacktr`.
8. ph_draw draws each 6.4 ms frame: linear decay forward + linear ramp backward.

---

## 2. Qlatt current state (verified 2026-05-29)

### 2.1 The blend = `blendParams` in the track-assembler

`src/track-assembler.ts:1014-1029`:
```ts
function blendParams(baseParams, nextParams, blendKeys, blendFactor) {
  const blended = { ...baseParams };
  for (const key of blendKeys)
    blended[key] = a + (b - a) * blendFactor;   // a=base, b=next, factor=0.5
  return blended;
}
```
Applied at `track-assembler.ts:1351-1365`:
- `phTransitionSec = segment.alignment.transition_ms ?? transitionMs` (default 30).
- `canSmooth = transition>0 && smoothTypes.has(seg.type) && smoothTypes.has(next.type)`
  — only fires between two segments whose `type` is in `smooth_types`
  (`vowel,nasal,liquid,glide`, `frontend.yaml:414`). **Obstruents are NOT in
  smooth_types, so no transition is emitted at any vowel<->obstruent boundary** —
  exactly where DECtalk's locus model operates. The largest parity gap.
- `steadyTime = max(start+0.02, target - transition)` — a single steady->target
  ramp over the last `transition` ms of the segment.
- `transitionParams = blendParams(finalParams, nextParams, [F1,F2,F3,B1,B2,B3], 0.5)`
  — symmetric 50% blend toward the NEXT segment's steady values.

This is structurally a **backward-only, symmetric, fixed-50%, fixed-30ms** blend
that mirrors DECtalk's *default* (`(tarend+tarnex)/2`, §1.0) but: (a) has no
locus override, (b) has no per-parameter durtran, (c) has no forward smoothing
of the segment START, (d) skips obstruent boundaries entirely.

`applyControlWindowsAtOffset` (`track-assembler.ts:335-346`) picks
`transitionParams` for events at/after `steadyTime`, else `baseParams` — i.e. a
step from steady to blended value at `steadyTime` (then the AudioParam ramp in
the interpreter linearly interpolates between event points). Event points
include `transition_steady_time` (`frontend.yaml:402`, `track-assembler.ts:295`).

### 2.2 Inventory / formant.yaml provide the steady map only

Per gap report D §2.1-2.2 (re-confirmed): `inventory.yaml` has per-phoneme
F1-F3/B1-B3/AV steady targets + diphthong `trajectory:` waypoints +
`stopReleaseProfiles`. `phases/formant.yaml` (148 lines) supplies SW + steady
parallel amplitudes by following-class for continuant obstruents — NO transition
logic. No locus table, no `tarlas/tarnex` concept, no `durtran`, no per-formant
boundary value.

### 2.3 Concepts that ALREADY exist in the engine (reusable scaffolding)

- **control_windows** (`track-assembler.ts:344, applyControlWindowsAtOffset`):
  per-segment time-ordered `{value, time}` overrides. Diphthong trajectories use
  these via `trajectory_to_windows` (`structural.yaml:3-18`). **This is the
  closest existing primitive to a per-segment time-varying formant track** — a
  locus transition could be expressed as a control window if the boundary value
  and span can be computed declaratively.
- **transition_ms / steadyTime / transition_steady_time event point**: an
  existing per-segment "transition window" concept (last N ms), but ONE window,
  symmetric, both-ends-shared, not per-parameter.
- **policy values declared-but-unused**: `formant.coarticulation_weight: 0.3`,
  `transition_time_ms: 30` (`frontend.yaml:312-313`) — no rule reads them
  (gap D confirms). Available hooks.
- **CEL navigation** (`prev`, `next`, `ahead/behind`, `look_*`) — enough to
  inspect neighbor phoneme features for context-dependent rules.

---

## 3. DESIGN — expressing locus transitions + smoothing declaratively

### 3.1 What is genuinely DATA vs what is ENGINE

DATA (pure YAML, no code):
- locus tables: per obstruent allophone x sontyx(1/2/3) x formant(F1/F2/F3) ->
  `{locus_hz, prcnt, durtran_ms}`. 59 allophones x 3 x 3 x 3 shorts = transcribe
  `us_maleloc`/`us_femloc` (male + female). Only obstruents have non-zero
  entries (per us_plocu). Realistically ~15 obstruent allophones x 3 x 3.
- per-parameter default `durtran` constants (NF20-130MS) and the named special
  durations (NF45/70/64MS etc.) — these are data tables keyed by context class.
- general-coartic weights (10/15/25%) and special-coartic Hz offset rules —
  the special offsets are already shaped like declarative conditional rules.
- per-phoneme TILT targets (D7) — pure inventory data.

ENGINE (the smallest generic primitive that must be added to track-assembler):
the boundary-value + linear-decay mechanism. DECtalk's model is:
> at a segment boundary, place a boundary value `bouval`; over `durtran` ms the
> parameter ramps LINEARLY from `bouval` to the segment's steady `tarcur`.

The track-assembler already does a degenerate version of this (one symmetric
window). The generic capability needed is: **per-parameter, per-boundary
(forward AND backward), arbitrary boundary value + arbitrary span, where the
boundary value is supplied by a rule and the ramp is linear toward the steady
target.** This is a strict generalization of the existing `transitionParams`
single-window blend — it is NOT dectalk-specific.

### 3.2 Option A — locus-as-data + generic "boundary-value transition" primitive

Add to inventory: a `loci:` data block per obstruent (locus_hz/prcnt/durtran_ms
per formant per vowel-category). Add a generic track-assembler primitive
`boundaryTransition(param, boundaryValue, spanMs, direction)` that produces a
forward (segment-start) or backward (segment-end) linear ramp between
`boundaryValue` and the steady target — replacing the single hardcoded
`blendParams` window with N per-parameter windows whose values+spans come from
rule output.

A new declarative rule kind (or extension of `scalar`) computes, at each
obstruent<->sonorant boundary, `bouval = locus + prcnt*(curval-locus)/100` and
emits a forward/backward transition window. The rule reads the locus from the
inventory `loci:` block (data), the neighbor's steady formant (`curval`) via
navigation, and the obstruent's vowel-category classification.

- Pure-data: locus tables, durtran tables, prcnt adjustments, TILT targets.
- Engine work: (1) generalize `blendParams`/the transition window into a
  per-parameter forward+backward boundary-value primitive (~moderate change to
  `track-assembler.ts:1351-1399` + `applyControlWindowsAtOffset`); (2) expose
  `muldv` and the linear-ramp evaluation to rules, OR have the rule emit a
  `control_window` with explicit `{value, time}` pairs (reuse 2.3's
  control_windows — likely the LOWEST-engine-cost path).
- Risk: medium. The control_window route reuses an existing, tested primitive;
  the main risk is computing `curval` (neighbor steady target at the boundary)
  inside a rule — needs a navigation accessor for "next/prev segment's resolved
  F2 target". Size: locus data ~150-300 YAML lines; primitive +1 rule phase.

### 3.3 Option B — pure declarative transition rules (no new engine primitive)

Express each transition as a `control_windows` insertion via existing
`trajectory_to_windows`-style machinery: a rule at each obstruent<->sonorant
boundary writes time-ordered F1/F2/F3 waypoints `[{value: bouval, time: 0},
{value: tarcur, time: durtran_ms}, {value: tarcur, time: null}]` onto the
sonorant segment. Reuses the diphthong path entirely (no track-assembler
change). The locus tables are still data; `bouval` is computed in CEL.

- Pure-data: same locus tables.
- Engine work: NONE if control_windows already accept absolute-Hz waypoints with
  ms times AND the rule engine can compute `bouval` in CEL (needs `muldv`/integer
  ops + neighbor-target navigation — verify CEL has these; `look_ahead_pred`
  exists but reading a neighbor's RESOLVED formant target may not be exposed).
- Risk: the forward+backward+general-coartic stack means MANY overlapping
  windows per segment; control_windows may not compose (last-writer-wins vs
  additive). Backward smoothing writes the END of the PREVIOUS segment from the
  current segment's perspective — control_windows are per-segment, so a rule
  would need to write onto the neighbor. Size: large rule count, fragile.

### 3.4 Option C — HYBRID (recommended for orchestrator's consideration)

- **Locus tables, durtran tables, general-coartic weights, special-coartic
  offsets, TILT targets = DATA** in inventory/policy (Option A's data).
- **General coartic (§1.1) and special coartic (§1.4) = declarative scalar
  rules** mutating per-segment steady targets BEFORE assembly. These are
  target-modification rules (the engine already supports scalar field mutation)
  — they fit the existing rule model cleanly and need no new primitive. Special
  coartic is literally a list of conditional Hz offsets.
- **Locus + forward/backward smoothing = one generic track-assembler primitive**
  (Option A's `boundaryTransition`), driven by a small per-boundary rule that
  reads the locus data and emits boundary value + span. This is the irreducible
  engine addition: the linear boundary-value ramp generalizes the existing
  symmetric blend and is reusable by any frontend (qlatt-english included).

The smallest GENERIC capability: **"smooth a parameter from a rule-supplied
boundary value to its steady target over a rule-supplied span, at either segment
edge, per parameter."** Everything else (which value, which span, which
contexts) is data + scalar rules. This replaces the fixed
`blendFactor=0.5 / keys / smooth_types` block (`frontend.yaml:408-414`) with a
data-driven per-parameter mechanism that, with the right data, reproduces both
DECtalk's locus transitions AND its default 50% blend as the no-locus fallback.

### 3.5 Note on the default blend already being correct

DECtalk's NON-locus default (`(tarlas+tarcur)/2` forward, `(tarend+tarnex)/2`
backward, §1.0) IS the symmetric 50% blend Qlatt already does. So Option C's
primitive, with EMPTY locus data, degenerates to the current behavior — the
migration is additive and the broken-intermediate is small. The parity gain
comes from (a) extending it to obstruent boundaries (remove the smooth_types
gate for the locus path) and (b) supplying locus data + per-param durtran.

---

## 4. Suggested chunk breakdown (dependency-ordered)

Each verifiable by `npm run explain -- "<CV/VC word>"` and inspecting that F2 at
the consonant boundary moves toward the consonant's locus (not the vowel target).

- **t4a — Locus data + generic boundary-transition primitive.** Transcribe
  `us_maleloc`/`us_femloc` into an inventory `loci:` block (per obstruent x
  sontyx x formant `{locus_hz, prcnt, durtran_ms}`). Add the generic
  per-parameter forward+backward boundary-value linear-ramp primitive to
  track-assembler (generalizing `blendParams`/the single window) + the
  per-boundary rule that computes `bouval = locus + prcnt*(curval-locus)/100`
  and emits forward smoothing. Verify: `explain "bah"` (B->AA) shows F2 starting
  near the /b/ F2 locus (~1200) and rising to AA's F2. **Foundational; blocks
  t4b/t4c.**
- **t4b — Forward smoothing rules (sonorant contexts).** The 25/75 soncon->vowel,
  75/25 vowel->soncon, /R/ NF70MS, /LL/ F1+80, nasal-murmur F2/F3 lowering, B1
  widening, per-param default durtran tables (`p_us_st1.c:442-803`). Data-driven
  durtran + scalar/transition rules. Verify: `explain "lah"`, `"rah"` show the
  correct slow F3 out of /r/, F1 discontinuity for /l/.
- **t4c — Backward smoothing rules.** Mirror (`p_us_st1.c:826-1180`): vowel->C
  edge, B1 widen before voiceless C, breathy vowel->silence AP NF130MS,
  `tbacktr` end-window. Verify: `explain "ahb"`, `"aht"` show F-transition into
  the closure + B1 widening before voiceless.
- **t4d — General + special coarticulation (scalar target rules).** General
  10/15/25% neighbor-average pull on F1-F3 steady targets (skip nasals);
  special-coartic Hz offsets (F3-150 near W/R; F2 offsets near LX/W/LL; UW
  +200 near alveolar; unstressed x1.5; phrase-final x0.5; +-400 cap). No new
  primitive (scalar field mutation). Verify: `explain "wiy"` shows F2/F3 lowered;
  unstressed vowel shows larger coartic shift.
- **t4e — Per-phoneme TILT.** Inventory `TL:` per phoneme (7 obstruent / 20 /h/ /
  40 b/d/g / 6 nasal-murmur, `p_us_st1.c:250-284`) + TILT jump-near-stop rule
  (NF25MS, durtran=0 near stops). Verify: `explain` shows TL nonzero on
  obstruents. NOTE: verify synth-side TILT audibility separately (gap D7 flags
  impulse source may ignore TL).
- **(V-V coartic, gap D6): SKIP.** 4.63 hardcodes it to zero
  (`ph_sttr2.c:410-411`); matching 4.63 = no work.

Risk ranking: t4a (engine primitive) is the only one needing a track-assembler
change and is the highest-leverage; t4b/t4c are large rule/data sets but no new
primitive once t4a's mechanism exists; t4d is pure scalar rules (low risk);
t4e is pure data (low risk, pending synth audibility check).

---

## 5. Key file:line index

- setloc + V-V coartic: `ph_sttr2.c:71-369` (V-V disabled `:410-411`).
- Locus tables: `us_maleloc[]` `p_us_rom.h:4449`; `us_femloc[]` `:5366`;
  index table `us_plocu[]` `:4207`; `plocu()` `ph_setar.c:1955`;
  `US_TOT_ALLOPHONES 59` `INCLUDE/l_all_ph.h:391`.
- Forward smoothing: `us_forw_smooth_rules()` `p_us_st1.c:431-803`.
- Backward smoothing: `us_back_smooth_rules()` `p_us_st1.c:826-1180`.
- Special coartic: `us_special_coartic()` `p_us_st1.c:314-410`.
- General coartic: `ph_setar.c:419-619` (English weights `:558-568`).
- Target fields + draw conversion + call order: `ph_setar.c:373-905`.
- Per-frame linear draw: `ph_draw.c:369-402,427-449`.
- Qlatt blend: `track-assembler.ts:1014-1029` (blendParams),
  `:1351-1365` (apply), `:335-346` (window selection).
- Qlatt config: `frontend.yaml:403-414` (transitions/blend),
  `:312-313` (unused coartic policy).
