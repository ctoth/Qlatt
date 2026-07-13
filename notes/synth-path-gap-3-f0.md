# Synth-Path Gap 3 — F0 / Intonation Engine: DECtalk 4.63 vs Qlatt Port

Scout report, 2026-05-29. Read-only diff of DECtalk 4.63 US F0 engine against the
Qlatt layered F0 renderer. Every claim cites file:line. Observations only.

REFERENCE (DECtalk 4.63 C):
- `C:\Users\Q\src\dectalk\463\dapi\src\PH\ph_inton1.c`   (command generation; US via `phinton_classic`)
- `C:\Users\Q\src\dectalk\463\dapi\src\PH\Ph_drwt02.c`   (per-frame renderer: additive layers + filters + jitter)
- `C:\Users\Q\src\dectalk\463\dapi\src\PH\ph_vset.c`     (speaker-param → engine-var mapping)

PORT (Qlatt):
- `C:\Users\Q\code\Qlatt\src\track-assembler.ts`         (renderLayeredF0 marshalling)
- `C:\Users\Q\code\Qlatt\crates\f0-filters\src\lib.rs`   (per-frame DSP kernel)
- `C:\Users\Q\code\Qlatt\public\rules\frontends\dectalk-english\phases\prosody.yaml` (f0_layer rules)
- `C:\Users\Q\code\Qlatt\public\rules\frontends\dectalk-english\frontend.yaml`       (f0_model + speaker policy)

---

## Q1 — Layer / command inventory

DECtalk's `make_f0_command` (ph_inton1.c:1857) emits commands of 6 TYPES, consumed by
the renderer switch (Ph_drwt02.c:1848-1958). Each command carries {type, tar, delay, length}.

| DECtalk command | What it does in renderer | ph_inton1.c gen site | Ph_drwt02.c consume | PORT status |
|---|---|---|---|---|
| **STEP** | `tarhat += f0command` — persistent hat level; opposite-sign cancels pending impulse | hat rise Rule 1 (713), hat fall Rule 3 (1274), Rule 31 (1514), Rule 7 (1721 — US-excluded) | 1864-1888 | **IMPLEMENTED** as `hat` layer (`type: glide`, frontend.yaml:133-134; prosody.yaml hat_rise/hat_fall/boundary_reset). Note: port renders hat as GLIDE not STEP — see Q7. |
| **IMPULSE** | `tarimp = f0command<<1` (or `<<0` in reading mode), then decays | stress Rule 2 (1024); question gestures Rule 4/41 (1351-1352); comma Rule 4 (1367-1368); glottalize Rule 5/6 (1586-1597, 1683-1693 — under `#ifdef CUT_THIS_RULE`) | 1908-1957 | **PARTIAL**: stress impulse (prosody.yaml dectalk_stress_impulse → `stress` layer); question dip -151 + comma 171/250 (`boundary` layer). question +451 RISE rendered as GLIDE not impulse (Q7). |
| **GLIDE** | `glide_inc = f0command/length`; `glide_tot += glide_inc`/frame until target, then HELD | US: only `#ifdef ENGLISH_UK`/`#ifdef GERMAN` paths (631-647, 715, 906, 1001-1018). **US classic path emits ZERO native GLIDE commands.** | 1889-1894, 2161-2184 | **IMPLEMENTED as primitive** (LAYER_GLIDE=3, lib.rs:33; frontend.yaml `hat`+`question_glide` layers). But its USE for US hat/question is a DEVIATION (Q7). |
| **GLOTTAL** | `enddrop = -f0command; glotalize = 1` (a per-cycle end-of-utterance drop) | US: Rule 5 only under `#ifdef GERMAN`/`#ifdef FRENCH` (1573, 1617). **US emits no GLOTTAL command.** | 1896-1906 | **ABSENT.** No GLOTTAL command and no `enddrop`/`glotalize` mechanism in port. |
| **F0_RESET** | zeroes `tarhat`, `glotalize`, glide accumulators (clause-local reset) | Rule 7 (1736), Rule 8 (1746) at GEN_SIL/FSENTENDS | 1854-1863 | **PARTIAL**: `dectalk_boundary_reset` (prosody.yaml:464) resets `hat`; `dectalk_question_glide_reset` (prosody.yaml:306) resets question_glide. Does not zero a glottalize state (none exists). |
| **USER** | user-specified target (singing / phoneme-target modes) | Rule 0 (580) | 1850-1852 | **ABSENT** (out of scope; no singing/user-F0 mode in port). |

PLUS a non-command **baseline profile** (`f0baseline`): a 17-point declination curve
selected by clause type, summed every frame as `tarbas` (Ph_drwt02.c:1658-1707, 2040,
2186). Port: `baseline` profile layer, 17 points (prosody.yaml:40-69). **IMPLEMENTED**
for the declarative profile only — see Q8 for the missing clause-type profiles.

Verdict: of 6 command types, port implements STEP, IMPULSE, F0_RESET (partial), the GLIDE
primitive (but mis-applied), and the baseline. **GLOTTAL = GAP. USER = absent (OK).**

---

## Q2 — IIR smoothing filter (2-pole low-pass)

REFERENCE — Ph_drwt02.c `filter_commands()` (4144-4181) is **two cascaded identical
one-pole sections** (NOT a biquad):
```
f0a2 = f0_lp_filter          // speaker param (see below)
f0b  = FRAC_ONE - f0a2       // FRAC_ONE = 16384 (viphdefs.h:179)
pole1: out1 = a2*f0in  + b*f0las1 ;  f0las1 = out1     (4153-4158)
pole2: out2 = a2*out1  + b*f0las2 ;  f0las2 = out2     (4160-4167)
f0 = out2 >> F0SHFT          // F0SHFT=3 only for round-off headroom (245-247, 4168)
```
So each section is `y = α·x + (1-α)·y_prev` with the SAME α = `f0a2/16384`. Two in series.

The coefficient is set per voice from the **QU** ("quickness") speaker param, NOT
smoothness/SM (ph_vset.c:679):
```
f0_lp_filter = 1500 + 15 * QU            (ph_vset.c:679; alt older form :596 = 1500+15*(QU+40))
```
(SM/smoothness maps instead to spectral TILT, ph_vset.c:689-691 — NOT the F0 filter.)
Comment "QU in % -> lp cutoff" (ph_vset.c:679). For Paul the converted α ≈ 2100/4096.

PORT — frontend.yaml:116-122 selects `type: lowpass_1pole` with
`alpha = f0_lp_filter_alpha = 0.5126953125 = 2100/4096`. The kernel applies it as a
**single** one-pole (lib.rs one_pole path; frontend default_alpha:122). The 2-pole
Butterworth path also exists (`computeButterworth2Coefficients`, track-assembler.ts:668;
`iirFilter2Pole` :690) but is a standard bilinear-transform biquad — NOT used by dectalk
(frontend selects 1pole), and structurally unlike DECtalk's cascaded-identical-α design.

VERDICT — **PARTIAL / DEVIATION.**
1. Pole count: DECtalk = TWO cascaded one-pole stages; port (as configured) = ONE. The
   port's value 0.5127 matches a single DECtalk stage's α, but DECtalk runs that α twice
   in series — a steeper, more sluggish smoother. Port under-smooths relative to reference.
2. Speaker control: DECtalk recomputes α per voice from QU (`1500+15·QU`); the port hard-codes
   a single Paul-specific alpha (frontend.yaml:122,531-533) — other voices do not get their
   own QU-derived cutoff. The available 2-pole biquad is also not the DECtalk topology.

---

## Q3 — Stress impulse shape (IMPULSE decay + phrase-position)

REFERENCE — IMPULSE realization (Ph_drwt02.c):
- On command: `tarimp = f0command<<1` (reading mode `<<0`/`<<1`), `delimp = f0command>>2`,
  `nimp = length` (1931-1955).
- Per frame: `if(--nimp<0){tarimp=0}` else `tarimp -= delimp` (2064-2073); then a re-add
  `tarimp += delimp` and **`delimp = delimp>>1`** (2194-2200). Net: a geometric/halving
  decay — the increment halves every frame, so the impulse rises ~16 frames then trails.
  Duration `nimp = length` (stress length=20 frames, ph_inton1.c:1024).
- Magnitude is **phrase-position dependent**: `targf0 = f0_mstress_level[stress] +
  f0_mphrase_position[nrises_sofar]` (ph_inton1.c:776-808). `nrises_sofar` counts accents so
  far in the phrase (incremented :1031-1032). Table `f0_mphrase_position[] = {140,90,60,40,10,10,10}`
  (ph_inton1.c:258-260) — earlier accents get LARGER impulses. Plus last-stress reduction
  (`targf0 -= Reduce_last=50`, earlier `delayf0 = -NF20MS`, lines 845-857) and `>>2` in
  questions (829).

PORT — `dectalk_stress_impulse` (prosody.yaml:418-444): `stress` layer `type: impulse,
decay: halving, initial_decay_divisor: 4` (frontend.yaml:135-139). Kernel
(lib.rs:226 `decay = value/initial_decay_divisor`; :333-337 `value -= decay; decay /= 2`).
Duration = `stress_impulse_duration_frames: 20` (frontend.yaml:388).

- DECAY SHAPE: **MATCH.** `decay=value/4` then halving each frame == DECtalk `delimp=f0command>>2`,
  `delimp>>=1`. (frontend.yaml comments at 138 cite this; lib.rs:335-336.)
- DURATION: **MATCH** (20 frames both).
- PHRASE-POSITION DEPENDENCE (C-G6/C-G7): **GAP.** Port uses a FIXED magnitude
  `stress_level_primary_hz(71) + stress_phrase_position_hz(82.5)` (frontend.yaml:378,384;
  prosody.yaml:428-435). The 82.5 is a hand-averaged constant ("(140+90+60+40)/4=82.5",
  prosody.yaml:408-410) — it does NOT vary with accent index. DECtalk's per-accent
  `f0_mphrase_position[nrises_sofar]` decline (140→90→60→40→10) is absent; the
  last-stress `-Reduce_last` reduction and the `number_words==1` `targf0-(targf0>>2)`
  taper (ph_inton1.c:810-811, 852) are also absent. So every accent in the port gets the
  same impulse height; DECtalk front-loads the phrase.

---

## Q4 — Segmental F0 micro-contour (C-G4)

REFERENCE — DECtalk has a **separate, parallel segmental F0 path** with its OWN filter:
- Per-phoneme target `f0seg = us_f0msegtars[phocur]` (Ph_drwt02.c:2099-2102) — a per-phoneme
  perturbation table (consonant voicing raises/lowers F0 at vowel edges).
- Voicing-dependent timing: voiceless segments delay/shape the gesture
  (`extrad`, `tarseg1` fast path, VOT-keyed delays, Ph_drwt02.c:2125-2147).
- Filtered by `filter_seg_commands()` (4196-4233): again **two cascaded one-pole** stages,
  fixed cutoff `F_SEG_LOWPASS = 3000` (Ph_drwt02.c:245), independent of QU.
- Output `f0s` is **added on top** of the command-filtered F0: `f0prime = f0 + f0s`
  (Ph_drwt02.c:2217).

PORT — **GAP (entirely absent).** track-assembler.ts has no `us_f0msegtars` table, no
second filter path, no per-segment voicing perturbation, no `f0s` term. The kernel
(lib.rs) sums only the declarative layers (baseline/hat/stress/boundary/question_glide)
and applies ONE filter. Confirmed: no `seg`/`f0msegtars` symbol anywhere in
track-assembler.ts (grep clean) or lib.rs.

---

## Q5 — Glottalization dip (C-G5) + GLOTTAL command

Two DISTINCT DECtalk mechanisms; both absent from port.

(a) **Glottal-stop F0 dip** (the C-G5 "dip"): Ph_drwt02.c:2264-2275 —
```
dtglst = |nframg - tglstp|;
if (dtglst <= 7)  f0prime += (dtglst*70) - 550;   // a ±7-frame V-shaped dip, ~−55 Hz at center
```
Driven by `set_tglst()` (called :2153) which marks glottal-stop gesture times. This is a
linear-ramp dip about a glottal-stop instant.

(b) **GLOTTAL command** (end-of-utterance creak drop): renderer case GLOTTAL
(Ph_drwt02.c:1896-1906) sets `enddrop`, consumed at :2039-2040
(`tarbas = lastbase>>2 - scaled_enddrop`). In US classic this command is emitted only by
Rule 5 under `#ifdef GERMAN`/`#ifdef FRENCH` (ph_inton1.c:1573,1617); the US final-fall
glottalization is instead the `F0_GLOTTALIZE = -60` IMPULSE (ph_inton1.c:229, 1553) — but
those Rule 5/6 IMPULSE bodies sit under `#ifdef CUT_THIS_RULE` (ph_inton1.c:1621-1700) and
are DEAD in this build. There is also a male-only CREEKMALE halving of f0prime at
utterance end (Ph_drwt02.c:2237-2244, `#ifdef CREEKMALE`).

PORT — **GAP.** No `tglstp`/`dtglst` dip, no `enddrop`/GLOTTAL, no end-utterance creak.
The port's terminal lowering is only the declarative hat-fall depth (final_fall_hz=180,
frontend.yaml:324) — a smooth fall, not a glottal/creak gesture.

---

## Q6 — Jitter / flutter (C-G10)

REFERENCE — Ph_drwt02.c:2277-2298 adds deterministic pseudo-jitter EVERY frame:
```
timecos5 += 131 (mod TWOPI); timecos3 += 79;
pseudojitter = getcosine[timecos5>>6] - getcosine[timecos3>>6];   // ~5 Hz minus ~3 Hz cosines
f0prime += mlsh1(pseudojitter, 700);                              // 700 = FLUTTER, ≈ ±1 Hz
```
Comment: "approx 3 and 5-Hz sine waves, each +/-1.0 Hz" (2277). DETERMINISTIC (sum of two
incommensurate cosines, not RNG). The female variant (Ph_drwt02.c:3785-3791) uses the
speaker `f0flutter` param; the male/US classic path hard-codes 700 (2289). 100% → ±10 Hz max.

PORT — **GAP (in the F0 contour).** The F0 kernel (lib.rs) and renderLayeredF0 add NO
per-frame cosine jitter to the rendered F0 — the contour is the smoothed layer sum only.
NOTE: there IS a `flutter`/`jitter` pair in the port (track-assembler.ts:273-275,
1399-1401) but those are **Klatt voice-quality source params** injected into the synth
frame (params.flutter/params.jitter), NOT the F0-contour micro-modulation DECtalk applies
at Ph_drwt02.c:2289. Whether the synth's flutter param reproduces the ±1 Hz F0 wobble is
UNKNOWN from this scout (would need to read the source worklet); but the declarative F0
contour the renderer produces has none.

---

## Q7 — GLIDE faithfulness — IS THE PORT'S GLIDE A US-PARITY DEVIATION?

**YES — the port's GLIDE rendering of the hat rise and the question rise DEVIATES from
strict US 4.63 parity.**

Evidence the US classic path uses STEP (hat) and IMPULSE (question), never GLIDE:
- HAT RISE: ph_inton1.c:712-716 —
  `#ifndef GERMAN  make_f0_command(STEP, 1, hatsize, ...)  #else  make_f0_command(GLIDE,...)`.
  US compiles the `#ifndef GERMAN` arm → **STEP**. (The HAT_F0_SIZES path :734 is also STEP.)
- QUESTION GESTURE: ph_inton1.c:1350-1353 (the live `#else`, i.e. not GERMAN/SPANISH_LA) —
  `make_f0_command(IMPULSE, 41, F0_QGesture1=-151,...); make_f0_command(IMPULSE, 41,
  F0_QGesture2=+451,...)`. US → **two IMPULSEs**. The GLIDE-form question rise the port's
  comment cites (ph_inton1.c:1635) is inside Rule 6 under `#ifdef CUT_THIS_RULE`
  (1621-1700) AND its GLIDE arm is `#ifdef GERMAN` (1632-1635) — dead and German-only.
- US `phinton_classic` emits NO native GLIDE command in the executed path; every GLIDE call
  in ph_inton1.c is guarded by `#ifdef ENGLISH_UK` (631-647, 906) or `#ifdef GERMAN`
  (715, 1001-1018) or German-only Rule 6.

PORT renders BOTH as glides:
- hat layer `type: glide` (frontend.yaml:133-134); hat rise ramps over
  `hat_rise_glide_frames: 30` (prosody.yaml:116, frontend.yaml:367).
- question +451 on dedicated `question_glide` layer ramped over
  `question_rise_glide_frames: 24` (prosody.yaml:286-289; frontend.yaml:154-155,375).

So where US 4.63 produces an instantaneous STEP up to the hat top (then the 2-pole filter
smooths it) and a decaying IMPULSE pair for the question, the port produces explicit linear
RAMPs that then HOLD. Audibly smoother/more sustained than US. The commit message for
128cbfe3 and the backlog already flag this ("US DECtalk hat=STEP, question=IMPULSE; GLIDE is
German/alt form", backlog line 192). The hat FALL and resets remain span-0 (instant), so
only the rise/question RISE deviate. This is a deliberate "smoothness upgrade," not US-faithful.

---

## Q8 — Clause types / baseline profiles

REFERENCE — DECtalk stores **5 baseline profiles** `f0basetypes[0..4][0..16]` (17 points each),
populated in Ph_drwt02.c:787-882 (male) and :886+ (female). Clause-type → profile selection
(Ph_drwt02.c:1658-1703):
- `clausetype 0` declarative → `f0basetypes[0]` (long, >3 words) or `[4]` (short) (1660-1666)
- `clausetype 1` comma → `f0basetypes[1]` (1669-1674)
- `clausetype 2` exclamatory → `f0basetypes[0]` (>2 words) or `[2]` (1682-1688)
- `clausetype 3` question → `f0basetypes[3]` (1694-1697)
- index `[4]` = short-declarative variant.
The clause typer enumerates 4 user-facing types (ph_claus.c:937: "0:PERIOD, COMMA, EXCLAIM,
QUEST"); the renderer's 5th profile is the short-decl variant. Each profile is a distinct
17-point declination shape; e.g. question `[3]` RISES at the tail (1880-882: 1010,1014,1018)
vs declarative `[0]` falling tail (980,952,863).

PORT — **PARTIAL / GAP.** Only ONE baseline profile exists: the declarative `f0basetypes[0]`
17 points, hard-coded in prosody.yaml:40-69. There is NO clause-type selection of the
baseline — comma/question/exclamatory/short-decl all use the SAME declining baseline. The
port instead bolts terminal gestures on top (question_dip/rise, comma_rise) and varies only
the hat-fall DEPTH by punctuation (prosody.yaml:171-175). So:
- Number of baseline profiles: DECtalk 5, port 1 → **GAP** (no comma/question/exclam/short
  profiles; in particular the question profile's rising tail is approximated by an additive
  GLIDE instead of a distinct baseline).
- Clause typing exists in the port only as `punctuationSymbol` switching of fall depth and
  boundary gestures (prosody.yaml dectalk_hat_fall, _question_*, _comma_*), not as a baseline
  swap.

(C-G9 cross-check: the port carries a `baseF0BiasHz` term, track-assembler.ts:842-860, derived
from base_f0_hz − f0_minimum·output_scale. DECtalk's scaling is purely
`f0minimum + frac4mul(f0prime-1300, f0scalefac)` (Ph_drwt02.c:2309) with no extra additive
bias. Whether the port's bias is net-zero for Paul is UNKNOWN here; flagged in backlog C-G9.)

---

## GAP SUMMARY — ranked by likely audible impact

1. **GLIDE deviation on hat rise + question rise (Q7) — DEVIATION, HIGH.** Port ramps where US
   4.63 steps/impulses. This is the most directly audible departure from the "DECtalk voice":
   smoother, more sung accents and a sustained (not transient) question rise. Deliberate.
2. **Phrase-position stress impulse decline (Q3, C-G6/C-G7) — GAP, HIGH.** Port gives every
   accent the same height (fixed 82.5); DECtalk front-loads (140→90→60→40→10) and reduces the
   last stress. Flattens the natural early-emphasis contour.
3. **Clause-type baseline profiles (Q8, C-G1) — GAP, MEDIUM-HIGH.** Only the declarative
   profile exists; question/comma/exclam/short-decl share it. Question's distinct rising-tail
   baseline is only approximated by an additive glide.
4. **2-pole vs 1-pole smoothing + QU-per-voice control (Q2, C-G8) — DEVIATION, MEDIUM.** Port
   runs a single one-pole with a hard-coded Paul alpha; DECtalk runs two cascaded stages whose
   cutoff each voice derives from QU. Port under-smooths and is voice-invariant in smoothing.
5. **Segmental F0 micro-contour (Q4, C-G4) — GAP, MEDIUM.** No per-phoneme voicing
   perturbation / second seg-filter path. Removes consonant-conditioned F0 detail at vowel edges.
6. **Glottalization dip + GLOTTAL/creak (Q5, C-G5) — GAP, LOW-MEDIUM.** No ±7-frame glottal-stop
   dip, no end-utterance creak. US final-fall already partly handled by hat-fall depth; the
   creak/dip texture is missing.
7. **Jitter/flutter on F0 contour (Q6, C-G10) — GAP, LOW.** No deterministic 3/5-Hz ±1 Hz
   contour wobble in the rendered F0 (a separate synth-source flutter param exists but is not
   this mechanism; its effect UNKNOWN here).

## GLIDE-deviation verdict (explicit)
**YES.** US DECtalk 4.63 (`phinton_classic`) renders the hat rise as a **STEP**
(ph_inton1.c:713, `#ifndef GERMAN` arm) and the yes/no question gesture as an **IMPULSE pair**
(ph_inton1.c:1351-1352, F0_QGesture1=-151 / F0_QGesture2=+451). The port's `hat`/`question_glide`
GLIDE layers (frontend.yaml:133-134,154-155; prosody.yaml hat_rise + question_rise) ramp these
instead — a documented, intentional smoothness upgrade that is NOT strict US parity. Every native
GLIDE call in ph_inton1.c is under `#ifdef ENGLISH_UK` or `#ifdef GERMAN`; none compile for US.

## UNKNOWNs (could not verify in this scout)
- Whether the synth-source `flutter` param (track-assembler.ts:1400) reproduces the
  Ph_drwt02.c:2289 ±1 Hz F0 wobble (would require reading the synth worklet).
- Whether `baseF0BiasHz` (track-assembler.ts:842) nets to zero for Paul vs DECtalk's
  bias-free scaling (C-G9).
- Exact per-voice QU values for the non-Paul voices (the tune tables read,
  p_us_vdf_tuneint.h, are voice-param OFFSET deltas, not absolute QU; absolute QU lives in
  the base speaker-def tables not read here).
