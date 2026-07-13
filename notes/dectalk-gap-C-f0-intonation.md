# DECtalk 4.63 vs Qlatt dectalk-english — F0 / INTONATION Gap Report

Datestamp: 2026-05-28
Author: scout (read-only survey)
Scope: F0 contour generation ONLY (baseline, hat, stress impulses, glides, reset,
layered+IIR rendering, speaker F0 scaling). NOT duration/formants/LTS/DSP.

All claims cite file:line. Where the prior chunk notes were stale, this report
states the CURRENT verified state and flags the discrepancy.

---

## 0. Headline findings (verified against current source)

1. **Speaker F0 scaling IS now fully wired** — contradicts the stale notes
   (`notes-f0-speaker-scaling.md`, `notes-prosody-rules.md` line 42-44 which say
   "renderLayeredF0 is called WITHOUT speakerParams"). It is now called WITH
   `context.speakerParams` (`src/track-assembler.ts:1358`), the params are built
   from the frontend speaker policy (`src/tts-frontend.ts:524-544`), and the
   `speaker_scale` block is live in config (`frontend.yaml:52-59`), no longer
   commented out.

2. **The port reproduces only the DECLARATIVE clause type.** No question, comma,
   exclamation, or short-phrase baseline profile; no boundary gestures. DECtalk
   has 5 clause-type baseline profiles plus question/comma IMPULSE gestures.

3. **The port renders hat rise/fall and stress as STEP+IMPULSE.** The real
   DECtalk 4.63 renders them as **GLIDE** commands (linearly interpolated ramps),
   not STEP/IMPULSE. The earlier scout report (`scout-ph-inton-report.md` line
   64-91) described them as STEP — that matches commented-out / older code paths,
   but the live `make_f0_command(...,GLIDE,...)` calls in `ph_inton1.c` show
   GLIDE is the active path. See Gap G3.

4. **Four DECtalk F0 components are entirely absent** from the port: the
   segmental F0 micro-contour (`f0seg` / `us_f0msegtars[]`), the glottalization
   dip, the pseudo-jitter/flutter, and the `nrises_sofar` phrase-position decay
   of stress impulses. See Gaps G4-G7.

---

## 1. DECtalk 4.63 F0 model components (reference)

Two-phase system. Phase 1 = command generation (`ph_inton1.c`, 1903 lines).
Phase 2 = frame-level realization (`Ph_drwt02.c`, 4287 lines, 6.4 ms frames).

### 1.1 Baseline declination — `Ph_drwt02.c`
- 2D table `f0basetypes[clause_type][0..16]`, 17 equidistant points in Hz*10,
  mapped proportionally across total clause duration.
- Clause types: 0=declarative, 1=comma, 2=exclamation, 3=question, 4=short.
- Declarative male: `1157,1145,...,952,863` (`scout-ph-inton-report.md:218`).
- Per-frame baseline: `tarbas = (lastbase>>2) - scaled_enddrop` (`Ph_drwt02.c:2040`).

### 1.2 Hat rise / fall — `ph_inton1.c`
- `FHAT_BEGINS` placed on first stressed syllabic in phrase (ph_aloph.c);
  `FHAT_ENDS` on last primary stress before clause end.
- **Rendered as GLIDE** in the live path:
  - Hat rise: `make_f0_command(phTTS, GLIDE, 1, hatsize, delayf0, 30, ...)`
    (`ph_inton1.c:715`).
  - Hat fall: a sequence of GLIDEs of `-(hatsize>>2)`, `-((hatsize>>1)+(hatsize>>2))`,
    `-(hatsize>>1)`, `-(hatsize>>2)` (`ph_inton1.c:1001,1007,1012,1018`).
  - `hatsize = size_hat_rise` (Paul HR*10 path); quartered (`>>=2`) for questions
    or `<3` words (`scout-ph-inton-report.md:62, 102`).
- Draw engine GLIDE handling: `glide_step = f0command; glide_inc = glide_step/length`
  (`Ph_drwt02.c:1891-1892`); accumulates each frame `glide_tot += glide_inc`
  (`Ph_drwt02.c:2161`), zeroes `glide_inc` at target (`2170-2184`).
- STEP path also exists (`Ph_drwt02.c:1864-1888`, `tarhat += f0command`) but the
  hat gestures in `ph_inton1.c` use GLIDE, not STEP.

### 1.3 Stress impulses — `ph_inton1.c`
- IMPULSE per stressed vowel; magnitude = `f0_mstress_level[level]` +
  `f0_mphrase_position[nrises_sofar]` (`ph_inton1.c:806`).
- Male tables: `f0_mstress_level[] = {1,71,31,281}`,
  `f0_mphrase_position[] = {140,90,60,40,10,10,10}` (`scout-ph-inton-report.md:196-197`).
- `nrises_sofar` increments per stressed vowel (`ph_inton1.c:1031-1032, 1057-1058`)
  and resets to 0 at boundaries (`ph_inton1.c:425, 1061`) — so each successive
  stress in a phrase gets a SMALLER position component (140→90→60→40→10...).
- Draw engine IMPULSE: `tarimp = f0command<<1` (reading mode `= f0command`),
  `delimp = f0command>>2`, `nimp = length` (`Ph_drwt02.c:1931-1955`). Decay each
  frame: `tarimp += delimp; delimp = delimp>>1` (`Ph_drwt02.c:2194-2200`) — note
  this is an additive-then-halving-rate ramp, not a simple subtract.

### 1.4 Glides (other than hat) — `ph_inton1.c`
- Generic GLIDE commands used for question final rise, continuation, dummy-vowel
  transitions: e.g. `GLIDE 23 -200`/`GLIDE 23 +250` (`ph_inton1.c:631-632`),
  `GLIDE 20 targf0` (`646`), `GLIDE 22 targf0` (`906`).

### 1.5 Question / comma boundary gestures — `ph_inton1.c`
- Question (FQUENEXT): IMPULSE pair `F0_QGesture1=-151`, `F0_QGesture2=+451`
  (`ph_inton1.c:219-220, 1351-1352`); also a GLIDE variant (`1634-1635`).
- Comma/continuation (FCBNEXT): IMPULSE pair `F0_CGesture1=171`, `F0_CGesture2=250`
  (`ph_inton1.c:221-222, 1367-1368`).
- Below-baseline falls by boundary type: `F0_FINAL_FALL=180`, `F0_NON_FINAL_FALL=150`,
  `F0_COMMA_FALL=120`, `F0_QSYLL_FALL=80` (`scout-ph-inton-report.md:186-189`).

### 1.6 Glottalization — `ph_inton1.c` + `Ph_drwt02.c`
- GLOTTAL command (`F0_GLOTTALIZE=-60`, `ph_inton1.c:229, 1553, 1573, 1617`).
- Draw engine: sets `enddrop = -f0command`, `glotalize=1` (`Ph_drwt02.c:1903-1904`).
- Per-frame triangular dip near glottal-stop time: `f0prime += (dtglst*70)-550`
  within 7 frames (`Ph_drwt02.c:2266-2273`).

### 1.7 Segmental F0 micro-contour — `Ph_drwt02.c`
- `f0seg = us_f0msegtars[phocur & 0xff]` per phoneme (`Ph_drwt02.c:2102`).
- Filtered SEPARATELY through its own 2-pole filter (`filter_seg_commands`,
  `Ph_drwt02.c:2207`) into `f0s`, then added AFTER the main filter:
  `f0prime = f0 + f0s` (`Ph_drwt02.c:2217`).

### 1.8 Per-frame additive combination + filter — `Ph_drwt02.c`
- Main sum: `f0in = tarbas + tarhat + tarimp` then `f0in += glide_tot`
  (`Ph_drwt02.c:2186, 2210`).
- `filter_commands(f0in)` → `f0` (2-pole low-pass, coefficient from
  `f0_lp_filter`, Paul `1500+15*QU`).
- Then `f0prime = f0 + f0s` (segmental added post-filter, `2217`).

### 1.9 Pseudo-jitter / flutter — `Ph_drwt02.c`
- Two cosine waves (prime increments 131 and 79 over a 4096 period):
  `pseudojitter = getcosine[..] - getcosine[..]`, `f0prime += mlsh1(pseudojitter,700)`
  (`Ph_drwt02.c:2279-2289`). ~±1 Hz flutter.

### 1.10 Speaker F0 scaling — `Ph_drwt02.c:2309`
- `f0prime = f0minimum + frac4mul((f0prime - 1300), f0scalefac)` where
  `frac4mul(x,y) = (x*y)>>12 = x*y/4096`. Internal units Hz*10; divide by 10 for Hz.
- Paul: `f0minimum = 1100` ((AP-12)*10 path), `f0scalefac = 4100` (PR*41).
- Clamp `LOWEST_F0=500` (50 Hz) .. `HIGHEST_F0=5121` (512.1 Hz)
  (`Ph_drwt02.c:243-244, 2316-2321`).

### 1.11 Reset — `ph_inton1.c` / `Ph_drwt02.c`
- F0_RESET zeroes `tarhat`, `glide_step/tot/inc`, `glotalize` (`Ph_drwt02.c:1854-1863`).
- Issued at clause/sentence boundaries (`scout-ph-inton-report.md:133-137`);
  `nrises_sofar` reset to 0 (`ph_inton1.c:425, 1061`).

---

## 2. Qlatt port — CURRENT verified state

### 2.1 Rendering engine — `src/track-assembler.ts`
`renderLayeredF0(commands, modelConfig, totalDuration, speakerParams?)`
(`track-assembler.ts:658`). Verified behavior:
- Internal fixed-rate frame loop at `frame_period_sec` (config 0.0064 s)
  (`track-assembler.ts:666-671`).
- Layer types: `profile`, `persistent`, `impulse` (`track-assembler.ts:768-773`).
- Filter: ONE-pole OR two-pole (`track-assembler.ts:679, 713-715`); the
  dectalk config selects **`lowpass_1pole`** with `alpha=0.5126953125`
  (`frontend.yaml:21-26`). DECtalk uses a 2-pole filter — the port approximates
  with a 1-pole (alpha = 2100/4096). See Gap G8.
- Steady-state pre-fill of filter to avoid startup transient
  (`track-assembler.ts:785-816`) — NOT in DECtalk.
- Additive sum of all layers then single filter (`track-assembler.ts:858-883`).
- Speaker scaling (`track-assembler.ts:893-898`):
  `f0Hz = (f0Minimum + (filtered - f0Reference) * f0ScaleFactor / scaleDivisor) * scaleOutput + baseF0BiasHz`.
  With config `divisor=4096`, `output_scale=0.1`, `reference=1300`
  (`frontend.yaml:55-59`) this reproduces DECtalk `Ph_drwt02.c:2309` exactly,
  PLUS a `baseF0BiasHz` term (= `base_f0_hz - f0Minimum*output_scale`,
  `track-assembler.ts:740-743`) that DECtalk does NOT have — an added bias so the
  contour centers on the UI `base_f0_hz`. See Gap G9.
- Output clamp 50..500 Hz (`frontend.yaml:63-65`) — matches DECtalk floor (50)
  but DECtalk ceiling is 512.1 Hz (`Ph_drwt02.c:243`), port uses 500.
- Impulse decay modes: `halving`/`linear`/`exponential` (`track-assembler.ts:925-932`).
  dectalk config selects `halving` with `initial_decay_divisor=4`
  (`frontend.yaml:34-44`): `decay = value/4`, `value -= decay; decay /= 2`
  (`track-assembler.ts:844, 926-927`). This is a SUBTRACT-and-halve-the-rate decay;
  DECtalk IMPULSE is ADD `delimp` then halve `delimp` (`Ph_drwt02.c:2194-2200`).
  Sign/semantics differ. See Gap G6.

### 2.2 Speaker-scaling wiring — VERIFIED LIVE (notes were stale)
- `renderLayeredF0` called WITH `context.speakerParams` (`track-assembler.ts:1358`).
- `speakerParams` built from `parameters.policy.speaker` numeric entries +
  `base_f0_hz` (`tts-frontend.ts:528-544`), passed into
  `lowerControlScoreToKlattTrack` (`tts-frontend.ts:594`).
- Resolved speaker numbers `f0_minimum=1100`, `f0_scale_factor=4100`,
  `f0_lp_filter_alpha=0.5126953125` come from `frontend.yaml:296-307`.
- `speaker_scale` config block ACTIVE at `frontend.yaml:52-59` (not commented).

### 2.3 Prosody rules — `phases/prosody.yaml`, wired in `pipeline.yaml`
Five `f0_layer` rules, in pipeline order (`pipeline.yaml:58-62`):
1. `dectalk_baseline_declination` (`prosody.yaml:40-72`) — profile layer, 17 pts,
   declarative only. Fires at first non-SIL of each phrase.
2. `dectalk_hat_rise` (`prosody.yaml:90-115`) — persistent `hat` layer,
   value `hat_rise_hz=180`, at first stressed vowel. **STEP semantics**, not GLIDE.
3. `dectalk_hat_fall` (`prosody.yaml:134-173`) — persistent `hat`, value
   `-(hat_rise_hz + final_fall_hz)` = -360, at last stressed vowel, placed via
   `ratio` from a duration-based delay. **Single STEP**, not the 4-GLIDE sequence.
4. `dectalk_stress_impulse` (`prosody.yaml:195-221`) — impulse `stress` layer,
   value `(stress_level_primary_hz=71 + stress_phrase_position_hz=82.5) * (scale_str_rise/32)`,
   `duration_frames=20`. FIXED phrase-position constant (82.5), no `nrises_sofar` decay.
5. `dectalk_boundary_reset` (`prosody.yaml:241-261`) — persistent `hat`, value
   `+final_fall_hz=180` at SIL, to cancel net -180 hat residue.
Plus `dectalk_connected_speech_source_contour` (`prosody.yaml:269-327`) — this is
Ee/Rd SOURCE shaping (Fant 1997), NOT an F0-contour layer; out of F0 scope.

### 2.4 Layers actually present
- `baseline` (profile) ✓, `hat` (persistent) ✓, `stress` (impulse) ✓ — all fed.
- `boundary` (impulse) declared in config (`frontend.yaml:39-44`) but **NO RULE
  emits to it** — the `boundary` layer is dead. (grep: only baseline/hat/stress
  appear as `layer:` targets in prosody.yaml.)

### 2.5 Config constants present but UNUSED by any rule
`frontend.yaml` defines `non_final_fall_hz=150` (`:187`), `comma_fall_hz=120`
(`:190`), `question_fall_hz=80` (`:193`), `hat_fall_following_sonorant_delay_ms`,
`stress_level_secondary_hz`, `stress_level_emphasis_hz` (`:187-198`). grep of
prosody.yaml shows `comma_fall_hz`/`question_fall_hz`/`non_final_fall_hz`/
`stress_level_secondary`/`stress_level_emphasis` are referenced by NO rule. Only
`hat_rise_hz`, `final_fall_hz`, `stress_level_primary_hz`, `stress_phrase_position_hz`,
`hat_fall_*`, `stress_impulse_duration_frames` are consumed.

---

## 3. GAP enumeration

Each gap: DECtalk evidence → port status → rough size.

### G1 — Only the declarative clause-type baseline exists
- DECtalk: `f0basetypes[5][17]`, 5 clause types incl. question (rises at end,
  `scout-ph-inton-report.md:151`) and comma (rise at pos 14-15, `:170`).
- Port: single hard-coded 17-point declarative profile
  (`prosody.yaml:51-68`); no clause-type selection. `is_question_boundary`
  predicate EXISTS (`pipeline.yaml:3`) but no rule uses it for baseline.
- Size: MEDIUM. Add 1-4 more profile arrays + a selector rule keyed on clause
  punctuation. Constants for falls already in config (unused).

### G2 — No question / comma boundary gestures
- DECtalk: IMPULSE pairs `F0_QGesture1/2` (`ph_inton1.c:1351-1352`),
  `F0_CGesture1/2` (`ph_inton1.c:1367-1368`); below-baseline boundary falls
  (`F0_*_FALL`).
- Port: NONE. The `boundary` impulse layer is declared (`frontend.yaml:39-44`)
  but no rule emits to it (§2.4); `comma_fall_hz`/`question_fall_hz` unused (§2.5).
- Size: MEDIUM. Rules emitting to the existing `boundary` layer at SIL tokens
  carrying `?`/`,`; constants/layer already scaffolded.

### G3 — Hat rise/fall use STEP, DECtalk uses GLIDE
- DECtalk: hat rise `GLIDE 1 hatsize ... 30` (`ph_inton1.c:715`); fall = 4-segment
  GLIDE ramp (`ph_inton1.c:1001-1018`). GLIDE = linear ramp over `length` frames
  (`Ph_drwt02.c:1891-1892, 2161-2184`).
- Port: single persistent STEP for rise (`prosody.yaml:108-112`) and one negative
  STEP for fall (`prosody.yaml:165-169`); smoothing comes only from the 1-pole
  filter, not an explicit timed glide. There is NO `glide`/ramp layer type in
  `renderLayeredF0` (`track-assembler.ts:768-773` lists only profile/persistent/impulse).
- Size: MEDIUM-LARGE. Either add a ramp/glide layer type to the renderer, or
  accept the filter-smoothed STEP as an approximation (the current choice). The
  4-segment fall shape is lost entirely.

### G4 — Segmental F0 micro-contour (`f0seg`) absent
- DECtalk: per-phoneme `us_f0msegtars[]` table, separately 2-pole filtered into
  `f0s`, added post-filter `f0prime = f0 + f0s` (`Ph_drwt02.c:2102, 2207, 2217`).
- Port: no segmental F0 table, no second filter path, no per-phoneme F0 offset.
  (grep f0seg/segmental in dectalk frontend → 0 F0 hits; the inventory `f0segtars`
  column is not consumed for F0.)
- Size: LARGE. Needs a per-phoneme F0-offset table + a separately-filtered layer
  added after the main filter. The current renderer filters ALL layers together.

### G5 — Glottalization dip absent
- DECtalk: GLOTTAL command + per-frame triangular dip `(dtglst*70)-550` near
  glottal-stop timepoints (`Ph_drwt02.c:2266-2273`); `F0_GLOTTALIZE=-60`.
- Port: NONE. No glottal F0 gesture rule; inventory marks `glottal: true`
  (`inventory.yaml:1528`) but it is not wired to any F0 dip.
- Size: SMALL-MEDIUM. A localized impulse/dip rule at glottal-stop segments.

### G6 — Stress-impulse decay shape differs from DECtalk
- DECtalk IMPULSE: `tarimp = f0command<<1` (or `f0command` in reading mode),
  `delimp = f0command>>2`, then per-frame `tarimp += delimp; delimp >>= 1`
  (`Ph_drwt02.c:1931-1955, 2194-2200`) — an ADD-then-decay-the-rate ramp that
  initially RISES then settles, over `length` frames.
- Port: `decay = value/4`, per-frame `value -= decay; decay /= 2` (halving)
  (`track-assembler.ts:844, 925-927`) — strictly DECREASING from the start.
  Sign of the increment and the rise-then-fall shape differ.
- Size: SMALL (renderer already has decay modes; needs a mode matching DECtalk's
  add-then-halve) — but verify against golden audio before changing.

### G7 — `nrises_sofar` phrase-position decay of stress not modeled
- DECtalk: stress impulse += `f0_mphrase_position[nrises_sofar]`, table
  `{140,90,60,40,10,10,10}`; `nrises_sofar` increments per stress and resets at
  boundary (`ph_inton1.c:806, 1031-1058`). Earlier stresses in a phrase get a
  much larger position boost than later ones.
- Port: fixed constant `stress_phrase_position_hz=82.5` (avg of first 4 entries),
  same for every stress (`prosody.yaml:202, 208`; comment `:185-187`). No
  position-dependent decay; would require stateful counting unavailable in CEL.
- Size: MEDIUM. Needs either a stateful per-phrase counter in the engine or a
  precomputed index passed to the rule (`phrase_index` exists per
  `notes-prosody-rules.md:39`, may suffice as the table index).

### G8 — Control-smoothing filter is 1-pole, DECtalk is 2-pole
- DECtalk: `filter_commands` is a 2-pole low-pass (coeff from `f0_lp_filter`,
  Paul 2100) (`Ph_drwt02.c:2212`; `scout-ph-inton-report.md:91, 249`). Renderer
  HAS a 2-pole path (`computeButterworth2Coefficients`, `track-assembler.ts:541`).
- Port: dectalk config selects `lowpass_1pole` with alpha=0.5126953125 (=2100/4096)
  (`frontend.yaml:21-26`) — explicitly an approximation. Different transient
  response (slope, overshoot) than the genuine 2-pole.
- Size: SMALL. Switch config to `lowpass_2pole` with `cutoff_param` derived from
  `f0_lp_filter`; renderer already supports it.

### G9 — Extra `baseF0BiasHz` term not in DECtalk
- DECtalk scaling is exactly `f0minimum + frac4mul(f0prime-1300, f0scalefac)`
  (`Ph_drwt02.c:2309`), no additive UI-base-F0 bias.
- Port adds `+ baseF0BiasHz` where `baseF0BiasHz = base_f0_hz - f0Minimum*output_scale`
  (`track-assembler.ts:740-743, 895`). With Paul `base_f0_hz=122`,
  `f0Minimum*output_scale = 110`, bias = +12 Hz. This shifts the whole contour up
  by 12 Hz versus pure DECtalk. Likely the "centering" fix for the
  too-low-F0 problem the stale notes wrestled with.
- Size: SMALL but SEMANTIC — verify whether this bias is intended parity-breaking
  or a calibration. Not a DECtalk behavior.

### G10 — Pseudo-jitter / flutter absent
- DECtalk: ±1 Hz cosine flutter every frame (`Ph_drwt02.c:2279-2289`).
- Port: NONE in the F0 path. Inventory `flutter:0, jitter:0` (`inventory.yaml:31-32`)
  — disabled. (Jitter may live in the DSP source layer, out of this report's scope,
  but the F0-contour flutter specifically is not reproduced.)
- Size: SMALL. A deterministic ±1 Hz oscillation added to the rendered contour.

### G11 — Generic glides (question rise, continuation, dummy-vowel) absent
- DECtalk: multiple non-hat GLIDE commands (`ph_inton1.c:631-632, 646-647, 906,
  1634-1635`).
- Port: no glide layer type at all (see G3); these gestures are unrepresented.
- Size: folded into G3 (needs a ramp/glide primitive first).

---

## 4. Summary table

| Gap | Component | DECtalk ref | Port status | Size |
|-----|-----------|-------------|-------------|------|
| G1 | Non-declarative baselines | f0basetypes[1..4] | declarative only | M |
| G2 | Q/comma boundary gestures | ph_inton1.c:1351-1368 | absent; boundary layer dead | M |
| G3 | Hat rise/fall as GLIDE | ph_inton1.c:715,1001-1018 | STEP approximation | M-L |
| G4 | Segmental F0 (f0seg) | Ph_drwt02.c:2102,2217 | absent | L |
| G5 | Glottalization dip | Ph_drwt02.c:2266-2273 | absent | S-M |
| G6 | Impulse decay shape | Ph_drwt02.c:2194-2200 | halving (differs) | S |
| G7 | nrises_sofar position decay | ph_inton1.c:806 | fixed 82.5 constant | M |
| G8 | 2-pole control filter | Ph_drwt02.c:2212 | 1-pole approximation | S |
| G9 | base_f0 bias (extra) | (none in DECtalk) | +baseF0BiasHz added | S |
| G10 | Pseudo-jitter flutter | Ph_drwt02.c:2279-2289 | absent (flutter=0) | S |
| G11 | Generic glides | ph_inton1.c:631-647 | absent (needs G3) | — |

WIRED & MATCHING: speaker scaling formula+wiring (§2.2, matches Ph_drwt02.c:2309),
declarative baseline values (§2.3 rule 1 == scout-ph-inton-report.md:218),
hat rise/fall/reset magnitudes, F0 floor clamp at 50 Hz.

---

## 5. Files cited (absolute)

DECtalk reference:
- `C:\Users\Q\src\dectalk\463\dapi\src\PH\ph_inton1.c` (command generation)
- `C:\Users\Q\src\dectalk\463\dapi\src\PH\Ph_drwt02.c` (frame realization + scaling)
- `C:\Users\Q\src\dectalk\463\reports\scout-ph-inton-report.md` (prior extraction)

Qlatt port:
- `C:\Users\Q\code\Qlatt\src\track-assembler.ts` (renderLayeredF0 541-948, call 1358)
- `C:\Users\Q\code\Qlatt\src\tts-frontend.ts` (speakerParams build 524-544, 594)
- `C:\Users\Q\code\Qlatt\public\rules\frontends\dectalk-english\frontend.yaml` (f0_model 11-65, speaker policy 283-319, f0 policy 145-217)
- `C:\Users\Q\code\Qlatt\public\rules\frontends\dectalk-english\phases\prosody.yaml` (5 f0_layer rules 40-261)
- `C:\Users\Q\code\Qlatt\public\rules\frontends\dectalk-english\pipeline.yaml` (predicates 3-12, f0_layer phase 58-62)

NOTE on stale prior notes: `C:\Users\Q\src\dectalk\463\notes-f0-speaker-scaling.md`
and `notes-prosody-rules.md` state speaker scaling is NOT wired and rules work in
direct Hz. Both are STALE — current source uses Hz*10 internal units with live
speaker scaling (verified §2.2). The work was completed (commit aa2aa67 per the note).
