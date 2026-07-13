# Chunk dt-6 — DECtalk clause-type intonation (question / comma / final-vs-nonfinal) recon

Datestamp: 2026-05-29
Author: scout (read-only survey, no files modified except this report)
Mission: design how to add DECtalk 4.63 clause-type intonation (yes/no question
terminal rise, comma continuation, final-vs-non-final declarative fall) to the
Qlatt `dectalk-english` F0 model DECLARATIVELY.

Prerequisite read: `notes/dectalk-gap-C-f0-intonation.md` (gaps C-G1/G2/G3).

All claims cite file:line. "Not determined" where unknown.

---

## 1. DECtalk 4.63 clause-type intonation — what each terminal type does

Reference: `C:\Users\Q\src\dectalk\463\dapi\src\PH\ph_inton1.c`
(US-English path; `#ifdef ENGLISH_US`, `#ifndef FRENCH`).

### 1.1 The two mechanisms DECtalk uses per clause type

DECtalk combines **two** F0 effects keyed on the boundary feature of the
clause-final stressed vowel (`struccur & FBOUNDARY`):

1. **`f0fall`** — how far the hat-fall drops *below baseline* at the end of the
   clause. Applied as `pDphsettar->hat_loc_re_baseline -= f0fall`
   (`ph_inton1.c:1282`, `:1516`) and emitted as a negative STEP
   (`make_f0_command(...STEP...-f0fall...)`, `ph_inton1.c:1514`).
2. **A boundary GESTURE** — an explicit IMPULSE pair added on the final stressed
   vowel for questions and commas (`ph_inton1.c:1351-1352`, `:1367-1368`).

The constants (`ph_inton1.c:219-228`):
```
F0_QGesture1 = -151      F0_QGesture2 = +451   (question gesture pair)
F0_CGesture1 = +171      F0_CGesture2 = +250   (comma gesture pair)
F0_FINAL_FALL    = 180   (declarative sentence-final)
F0_NON_FINAL_FALL = 150  (non-final clause)
F0_COMMA_FALL    = 120   (comma clause)
F0_QSYLL_FALL    =  80   (question final syllable)
```
All in DECtalk internal units (Hz*10), i.e. ÷10 for Hz.

### 1.2 Per-terminal-type behavior (definitive)

| Terminal | Boundary feature | `f0fall` (below baseline) | Boundary gesture | Net contour at end |
|----------|------------------|---------------------------|------------------|--------------------|
| `.` `!` (sentence-final declarative) | FPERNEXT / FEXCLNEXT / FSENTENDS | `F0_FINAL_FALL = 180` (`ph_inton1.c:1125`, `:1406`) | none; plus a `F0_GLOTTALIZE=-60` dip on the final syllable (`:1553`) | **largest fall** |
| `,` (comma / continuation) | FCBNEXT or `clausetype==COMMACLAUSE` | `F0_COMMA_FALL = 120` (`:1137`, `:1418`) | comma IMPULSE pair `+171`, `+250` on final stressed vowel (`:1367-1368`), timed `delayf0 -= NF20MS` (`:1364`) | **small fall + a continuation rise** (the +171/+250 push F0 up at the boundary) |
| `?` (yes/no question) | FQUENEXT | `F0_QSYLL_FALL = 80` (`:1210`, `:1483`) — the SMALLEST fall | question IMPULSE pair `-151`, **`+451`** on final stressed vowel (`:1351-1352`) | **terminal RISE** (the +451 dominates; small fall is overwhelmed) |
| non-final clause (`;` `:`, intra-sentence clause break) | FCBNEXT / `< FVPNEXT` | `F0_NON_FINAL_FALL = 150` (`:1142`, `:1194`, `:1470`) | none | **medium fall, less than final** |
| non-final *phrase* (FVPNEXT) | FVPNEXT | `f0fall = 0` (`:1151`, `:1424`) | none | **no drop below baseline** (more clause coming) |

### 1.3 DEFINITIVE answer: does a yes/no question RISE?

**YES — a DECtalk yes/no question produces a terminal RISE, not merely a smaller
fall.** Evidence:

- On the sentence-final stressed vowel followed by `?` (FQUENEXT), DECtalk emits
  two IMPULSE commands (`ph_inton1.c:1350-1352`):
  ```c
  make_f0_command(phTTS, IMPULSE, 41, F0_QGesture1 /*-151*/, delayf0, 24, ...);
  make_f0_command(phTTS, IMPULSE, 41, F0_QGesture2 /*+451*/, allodurs[nphon], 24, ...);
  ```
  The second impulse is **+451** (Hz*10 = +45.1 Hz pre-speaker-scaling), placed at
  the very end of the vowel (`delay = allodurs[nphon]`). That is a large UPWARD
  gesture at the clause end.
- Simultaneously the hat-fall for a question is reduced to the smallest value
  (`F0_QSYLL_FALL = 80` vs declarative `180`, `ph_inton1.c:1210`, `:1483`), so
  there is little downward motion to cancel the rise.
- The comment at the rule head names it explicitly: *"Rule 4: Add positive pulse
  to approximate nonterminal fall-rise ... or in sentence ending in a question
  mark"* (`ph_inton1.c:1288-1292`).
- This gesture fires in the **stressed-final-syllable** branch
  (`ph_inton1.c:1308-1378`, guarded by `FCBNEXT || FQUENEXT`). The
  **unstressed-final-syllable** question rise (Rule 6, `ph_inton1.c:1623-1642`,
  same `F0_QGesture1/2` pair) is wrapped in `#ifdef CUT_THIS_RULE`
  (`ph_inton1.c:1621`) and is therefore **DEAD** in the 4.63 build. So the live
  question rise requires the clause-final syllable to be stressed; if the final
  syllable is unstressed there is only the reduced `F0_QSYLL_FALL` fall (no rise).
  (Recommendation §3 mirrors the live path: rise on the final STRESSED vowel.)

A secondary GLIDE-form question gesture exists at `ph_inton1.c:1634-1635`
(`IMPULSE -151` + `GLIDE +451`) but it too is inside `#ifdef CUT_THIS_RULE` —
dead. The live US path is the IMPULSE pair.

### 1.4 wh-question vs yes/no question

**Not distinguished by ph_inton1.c.** The intonation code keys only on the
terminal feature `FQUENEXT` (set from the `?` symbol), not on whether the clause
begins with a wh-word. There is no `wh`/`yesno` test in `ph_inton1.c`
(grep for `FQUENEXT`/`NotQuest` shows only punctuation-feature tests:
`:1208`, `:1294`, `:1323`, `:1480`, `:1630`). So DECtalk 4.63 applies the SAME
terminal rise to "how are you?" and "are you home?". (Some TTS systems fall on
wh-questions; DECtalk 4.63 does not make that distinction at the F0 layer.)
Linguistically the wh/yes-no split would be a Qlatt *enhancement* beyond parity,
not a DECtalk behavior — keep it out of the parity port unless Q asks.

### 1.5 How gestures render into the contour — `Ph_drwt02.c`

`make_f0_command(type, tar, delay, length, ...)` (`ph_inton1.c:1857`) records a
command tuple `{f0tim (cumulative time), f0tar (value), f0type (STEP/IMPULSE/
GLIDE/GLOTTAL/F0_RESET), f0length}` (`ph_inton1.c:1885-1891`). The frame engine
`Ph_drwt02.c` realizes them (per gap report C §1.2/§1.3):
- **STEP**: `tarhat += f0command` — persists (`Ph_drwt02.c:1864-1888`).
- **IMPULSE**: `tarimp = f0command<<1`, `delimp = f0command>>2`; per frame
  `tarimp += delimp; delimp >>= 1` over `length` frames — a transient that rises
  then settles (`Ph_drwt02.c:1931-1955`, `:2194-2200`).
- **GLIDE**: `glide_inc = f0command/length`; accumulates `glide_tot += glide_inc`
  each frame until target, then zeroes (`Ph_drwt02.c:1891-1892`, `:2161-2184`) —
  a **linear ramp to a target over `length` frames**. (This is the missing
  primitive — C-G3.)

So the question/comma boundary gestures use **IMPULSE** in the live US path, not
GLIDE. The GLIDE type is used elsewhere (hat, dead question variant). For the
Qlatt port, the question/comma RISE can be realized with the EXISTING impulse
layer mechanism (see §3) — a generic glide primitive is the more faithful and
reusable route but is NOT strictly required to make questions rise.

---

## 2. Qlatt `dectalk-english` F0 model — current state

### 2.1 Renderer (`crates/f0-filters/src/lib.rs`, called from `src/track-assembler.ts`)

`renderLayeredF0` was extracted to WASM. The per-frame loop lives in
`crates/f0-filters/src/lib.rs` (`render`, lines 158-307); TS marshals config into
flat buffers (`track-assembler.ts` ~750-935) and reads the contour back.

**Layer types supported (the C-G3 gap):**
- `crates/f0-filters/src/lib.rs:22-24`: `LAYER_PROFILE=0`, `LAYER_PERSISTENT=1`,
  `LAYER_IMPULSE=2`. **No GLIDE/ramp type.**
- `src/track-assembler.ts:378`: `export type LayerType = "profile" | "persistent" | "impulse";`
- `src/track-assembler.ts:789-792`: `LAYER_TYPE_CODES = { profile:0, persistent:1, impulse:2 }`.

Per-frame semantics (`lib.rs:195-249`):
- PROFILE: piecewise-linear interpolation of `profile_points` across
  `time/total_duration` (`lib.rs:226-237`).
- PERSISTENT: `persistent_levels[li] += cmd.value` on command, summed every frame
  (STEP that holds, `lib.rs:196-198`, `:239-241`).
- IMPULSE: pushes an `ActiveImpulse{value, decay=value/divisor, remaining_frames}`
  (`lib.rs:199-205`); summed each frame (`:242-246`); decayed after each frame by
  `halving`/`linear`/`exponential` (`:291-304`).

**There is NO linear-ramp-to-a-target-over-a-span layer.** A glide must be ADDED
(this is C-G3 / G11).

### 2.2 f0_layer token / `insert` schema (`src/declarative-frontend/engine.ts`)

A `kind: f0_layer` rule's `insert` block produces an `f0_layer` point token with
fields (`engine.ts:2304-2358`):
- `layer` (name) — required (`engine.ts:2280`).
- `value` — numeric CEL expression (`:2305-2308`).
- `at` — anchor expression: `at_sync(...)` (`:1180`) or `merge(current,{"ratio":r})`;
  produces `{anchor_left, anchor_right, ratio}` (`:2297-2302`, `:2342-2344`).
- `duration_frames` — optional numeric (`:2310-2317`, used by impulse layers).
- `profile_points` — optional numeric array (`:2319-2331`, used by profile layers).
- `tag` — provenance label (`:2356-2358`).

The token carries NO "ramp target" / "span" field today — a glide layer would
need a new optional field (e.g. `glide_to` + `duration_frames` reused as the span,
see §3.1).

### 2.3 Clause-type signal — IS IT VISIBLE? YES.

- The boundary SIL token carries `punctuationSymbol` (`transcribe-text.ts:218`,
  `tts-frontend.ts:382`, type `tts-frontend-types.ts:269`). It reaches phone-stream
  rules: the pipeline predicate `is_question_boundary` already reads it
  (`pipeline.yaml:3`: `current.phoneme == "SIL" && current.punctuationSymbol == "?"`).
- `punctuation_tokens: [",", ".", "?", "!", ";", ":"]` (`frontend.yaml:464`).
- So a prosody `f0_layer` rule CAN detect clause type. The gesture must fire on the
  final stressed vowel (before the SIL), so the rule selects the stressed vowel and
  **looks ahead** to the next SIL's `punctuationSymbol` — using the existing
  `look_ahead_pred` / `look_back_where` navigation (already used by `dectalk_hat_fall`,
  `prosody.yaml:145`) or a new look-ahead returning the boundary token so its
  `.punctuationSymbol` can be read.
- **Currently NO rule reads `punctuationSymbol` for F0.** The predicate
  `is_question_boundary` is defined (`pipeline.yaml:3`) but UNUSED by any rule
  (confirmed by gap report C §2.1). The five live F0 rules
  (`prosody.yaml`, `pipeline.yaml:82-87`) are all clause-type-agnostic:
  `dectalk_baseline_declination`, `dectalk_hat_rise`, `dectalk_hat_fall`,
  `dectalk_stress_impulse`, `dectalk_boundary_reset`.

### 2.4 The dead `boundary` layer + unused constants — what they were FOR

- `frontend.yaml:65-70` declares a `boundary` IMPULSE layer (decay halving,
  divisor 4) — clearly intended to receive the question/comma boundary gestures
  (the DECtalk `F0_QGesture`/`F0_CGesture` IMPULSE pairs, §1). **No rule emits to
  it** (gap report C §2.4) — it is dead scaffolding.
- `frontend.yaml:213` `non_final_fall_hz=150`, `:216` `comma_fall_hz=120`,
  `:219` `question_fall_hz=80` are the `F0_NON_FINAL_FALL`/`F0_COMMA_FALL`/
  `F0_QSYLL_FALL` constants — intended to vary the hat-fall depth by clause type.
  **Referenced by NO rule** (gap report C §2.5). Only `final_fall_hz=180` is used
  (in `dectalk_hat_fall`, `prosody.yaml:163`), so every clause type currently gets
  the declarative -180 fall — that is the measured "you are home." ≈ "are you
  home?" collapse.

### 2.5 Why "are you home?" ≈ "you are home." today (root cause, from the above)

1. No rule reads `punctuationSymbol`, so the `?` is invisible to F0 (§2.3).
2. `dectalk_hat_fall` always uses `final_fall_hz=180` regardless of clause type
   (`prosody.yaml:163`), so both end with the same big fall (§2.4).
3. No rule emits any boundary gesture, so there is no +451 question rise (the
   `boundary` layer is dead, §2.4). Net: both contours fall ~identically.

---

## 3. DESIGN — adding clause-type intonation DECLARATIVELY

Principle (project memory: "declarative first"): linguistic logic stays in YAML;
only a generic, data-driven primitive goes in engine/renderer code.

### 3.0 What is pure-YAML vs needs an engine/renderer extension

| Effect | Pure YAML? | Needs code? |
|--------|------------|-------------|
| Vary hat-fall depth by clause type (`.`→180, `;`→150, `,`→120, `?`→80) | **YES** — modify `dectalk_hat_fall` to read the boundary `punctuationSymbol` and pick the constant | none |
| Question terminal rise via the EXISTING `boundary` impulse layer (+451 pair) | **YES** — new rule emitting to the already-declared `boundary` layer | none (layer + constants already scaffolded) |
| Comma continuation rise via the `boundary` impulse layer (+171/+250 pair) | **YES** — new rule | none |
| Faithful **GLIDE** (linear ramp to target over a span) for hat fall & question rise (C-G3/G11 parity) | rule is YAML | **YES** — new generic `glide` layer primitive in renderer + engine token field |

So the MINIMUM to make questions rise and clause types differ is **pure YAML**
(reuse the existing `boundary` impulse layer + unused constants). The GLIDE
primitive is the faithful-parity upgrade and the reusable infrastructure the gap
report asks for; it is separable.

### 3.1 (a) The generic `glide` / `ramp` layer primitive (C-G3)

Add a fourth layer type, fully generic and data-driven from prosody.yaml — a
**linear movement to a target value over a span of frames**, mirroring DECtalk's
GLIDE (`Ph_drwt02.c:1891-1892`, `:2161-2184`).

Generic semantics (reusable for hat fall, question rise, continuation, any future
ramp — NOT question-specific):
- A glide command carries `{ start_time, delta (or target), span_frames }`.
- On activation at `start_time`: set `glide_inc = delta / span_frames`,
  `glide_remaining = span_frames`, `glide_tot += 0`.
- Each frame while active: `glide_tot += glide_inc; glide_remaining -= 1`; when
  remaining hits 0, stop incrementing (the accumulated `glide_tot` PERSISTS, like
  DECtalk where `glide_tot` stays summed into `f0in` after the ramp completes,
  `Ph_drwt02.c:2161-2184`).
- The layer's per-frame contribution is the persisted `glide_tot` (so a glide is a
  *ramped persistent* — STEP that takes `span` frames to arrive instead of jumping).

Code touch points (all generic, no linguistic content):
- `crates/f0-filters/src/lib.rs`: add `LAYER_GLIDE = 3` (`:22-24`); per-command
  state `{inc, remaining, tot}`; activation branch in the command loop (`:195-217`);
  summation branch `total += glide_tot` (`:222-249`); per-frame advance (alongside
  impulse decay, `:270-305`). Mirror the DECtalk accumulate-then-hold.
- `src/track-assembler.ts`: extend `LayerType` (`:378`) to include `"glide"`;
  add `LAYER_TYPE_CODES.glide = 3` (`:789-792`); marshal a glide command's
  `delta` (`cmd.value`) and `span_frames` (reuse `cmd.durationFrames`,
  `:462`) into the flat buffer (`:843-870`); include glide in `initTotal`?
  No — a glide starts at 0 and ramps, so it contributes 0 at t=0 (do NOT pre-fill).
- `src/declarative-frontend/engine.ts`: the existing f0_layer token already has
  `value` (=delta) and `duration_frames` (=span). A glide layer needs NO new token
  field — reuse `value` as the ramp delta and `duration_frames` as the span. The
  layer's `type: glide` in `frontend.yaml` selects the behavior. (Confirm the
  config layer-type parser accepts `glide`; it is driven by
  `f0_model.layers.<name>.type`.)
- `frontend.yaml`: declare e.g. a `glide` layer (or change `boundary`/hat to
  `type: glide`). Keep generic.

This is the only new code. It is reusable (hat fall, continuation, any ramp).

### 3.2 (b) Clause-type detection — declarative prosody rules

All rules select the **final stressed vowel of the phrase** (same selector as
`dectalk_hat_fall`: `is_hat_ends`, `prosody.yaml:146-147`) and read the upcoming
boundary SIL's `punctuationSymbol`.

Need a navigation that returns the next SIL token so `.punctuationSymbol` is
readable. Either:
- reuse `look_ahead_pred(current, N, 'candidate.phoneme == "SIL"')` (already
  available, `prosody.yaml:145` pattern) — returns the boundary token; then read
  `boundary.punctuationSymbol`; OR
- add the boundary symbol to the stressed vowel via a `define` look-ahead.

Define a `clause_terminal` helper in each rule's `define`:
```yaml
boundary_tok: look_ahead_pred(current, 100, 'candidate.phoneme == "SIL"')
terminal:     boundary_tok != null ? boundary_tok.punctuationSymbol : null
```
(`punctuationSymbol` is null on a SIL with no punctuation — utterance-internal.)

### 3.2.1 Rule A — clause-type-varying hat fall (pure YAML, modifies existing rule)

Modify `dectalk_hat_fall` (`prosody.yaml:134-173`) so `fall_hz` picks the fall
depth by `terminal`, reading the already-present unused constants:
```yaml
clause_fall_hz: >-
  terminal == "?" ? params.policy.f0.question_fall_hz       # 80
  : terminal == "," ? params.policy.f0.comma_fall_hz        # 120
  : (terminal == ";" || terminal == ":") ? params.policy.f0.non_final_fall_hz  # 150
  : params.policy.f0.final_fall_hz                          # 180  (. ! or null)
fall_hz: params.policy.f0.hat_rise_hz + clause_fall_hz
```
This alone differentiates the fall depth across clause types (DECtalk §1.2).
Citations: ph_inton1.c:1125/1137/1142/1210 (the F0_*_FALL selection).

### 3.2.2 Rule B — question terminal rise (pure YAML, NEW rule, existing layer)

New `dectalk_question_rise` emitting to the **existing `boundary` impulse layer**
(`frontend.yaml:65-70`), on the final stressed vowel when `terminal == "?"`:
```yaml
dectalk_question_rise:
  kind: f0_layer
  select: { stream: phone, where: is_stressed_vowel }   # reuse predicate
  define:
    boundary_tok: look_ahead_pred(current, 100, 'candidate.phoneme == "SIL"')
    terminal: boundary_tok != null ? boundary_tok.punctuationSymbol : null
    is_last_stress: <same look_ahead as is_hat_ends>
    q_rise_hz: F0_QGesture2   # +451 (add as a policy.f0 constant, cite ph_inton1.c:220)
  constraint: terminal == "?" && is_last_stress
  insert:
    layer: boundary
    at: merge(current, {"ratio": 1.0})   # end of the vowel (delay=allodurs[nphon])
    value: q_rise_hz
    duration_frames: <24, the DECtalk length, cite ph_inton1.c:1352>
    tag: f0_question_rise
  citations: ["DECtalk 4.63 ph_inton1.c:1351-1352 (F0_QGesture pair, terminal rise)"]
```
Optionally also emit `F0_QGesture1=-151` (the small pre-dip) as a second boundary
command at an earlier ratio for full fidelity (ph_inton1.c:1351). NEW constants
`question_gesture_rise_hz=451`, `question_gesture_dip_hz=-151`,
`comma_gesture1_hz=171`, `comma_gesture2_hz=250` must be added to
`parameters.policy.f0` with citations to ph_inton1.c:219-222.

NOTE the live DECtalk rise requires a STRESSED final syllable (§1.3). Mirror that
with `is_last_stress`. If Q wants a rise on unstressed-final questions too (DECtalk's
dead `#ifdef CUT_THIS_RULE` path), that is an enhancement beyond 4.63 parity — flag,
don't silently add.

### 3.2.3 Rule C — comma continuation rise (pure YAML, NEW rule, existing layer)

New `dectalk_comma_rise` identical in shape to Rule B but `terminal == ","` and
values `F0_CGesture1=+171`, `F0_CGesture2=+250` (ph_inton1.c:1367-1368), timed
`delayf0 -= NF20MS` earlier (ph_inton1.c:1364). Emit to the `boundary` layer.

### 3.3 (c) Pure-YAML vs code summary

- **Pure YAML, no code:** Rule A (clause-varying fall depth), Rule B (question
  rise via existing `boundary` impulse layer), Rule C (comma rise). These reuse the
  already-declared `boundary` IMPULSE layer and the already-present (currently
  unused) constants — making questions rise and clause types diverge needs ZERO
  engine/renderer change.
- **Generic code (C-G3 faithful upgrade):** the `glide` layer primitive (§3.1).
  Strictly optional for *correct direction* (rise vs fall); required for DECtalk's
  *ramp shape* fidelity on hat fall and a glide-form question rise. Keep it a
  separate, independently-verifiable chunk.

---

## 4. Suggested chunk breakdown (ordered, each F0-contour-verifiable)

Each chunk verified with an F0-contour probe: run the dectalk frontend on a test
phrase, read the rendered F0 contour (e.g. `npm run explain` filtered to prosody /
the existing `scripts/f0-fingerprint.ts`), assert the END-of-contour F0.

- **dt-6a — clause-varying hat fall (pure YAML).**
  Modify `dectalk_hat_fall` to select `question_fall_hz`/`comma_fall_hz`/
  `non_final_fall_hz`/`final_fall_hz` by the look-ahead boundary `punctuationSymbol`.
  Add a `look_ahead_pred` for the boundary SIL. Verify: "you are home." ends with a
  -180 fall; "are you home?" ends with only a -80 fall (less deep). Probe: final-frame
  F0 of `?` > final-frame F0 of `.`. (Does NOT yet rise — just falls less.)

- **dt-6b — question terminal rise (pure YAML, existing `boundary` impulse layer).**
  Add `parameters.policy.f0` constants for the Q-gesture pair (cite ph_inton1.c:219-220);
  add `dectalk_question_rise` emitting `+451` (and optionally `-151`) to the `boundary`
  layer on the final stressed vowel when `terminal=="?"`. Verify: "are you home?" F0
  RISES at the end (final-frame F0 noticeably above the pre-boundary F0 and above the
  declarative ending). This is the chunk that fixes the headline bug.

- **dt-6c — comma continuation rise (pure YAML, existing `boundary` layer).**
  Add C-gesture constants (`+171`/`+250`, cite ph_inton1.c:221-222, :1367-1368) and
  `dectalk_comma_rise`. Verify: "well, ..." shows a continuation rise at the comma
  boundary, distinct from a period.

- **dt-6d — generic GLIDE layer primitive (renderer + engine, C-G3) [optional/parity].**
  Add `LAYER_GLIDE` to `crates/f0-filters/src/lib.rs`, `"glide"` to
  `track-assembler.ts` `LayerType`/`LAYER_TYPE_CODES`/marshalling, accept `type: glide`
  in config. Unit-test the ramp in the Rust crate (linear accumulate-then-hold, mirror
  Ph_drwt02.c:1891-1892/2161-2184) with a property test (monotonic ramp, reaches target
  at span, holds after). Verify with a golden contour probe that existing
  profile/persistent/impulse layers are byte-unchanged (no regression to dt-6a..c).

- **dt-6e — migrate hat fall & question/comma rise to GLIDE (YAML) [optional/parity].**
  Switch the hat-fall and boundary gestures from STEP/IMPULSE to the new `glide`
  layer for DECtalk-faithful ramp shape (4-segment hat fall, ph_inton1.c:1001-1018;
  glide-form gestures). Verify contour shape vs the IMPULSE approximation.

Recommended stop point for the headline bug: **dt-6a + dt-6b** make "are you home?"
rise and differ from "you are home." with ZERO renderer/engine code. dt-6c extends to
commas. dt-6d/6e are the faithful-parity GLIDE upgrade and can be deferred.

---

## 5. Files cited (absolute)

DECtalk reference:
- `C:\Users\Q\src\dectalk\463\dapi\src\PH\ph_inton1.c`
  (constants :219-230; final fall :1125,:1406; comma/nonfinal fall :1134-1142,:1414-1418;
  question fall :1208-1210,:1480-1483; question gesture pair :1351-1352; comma gesture
  pair :1367-1368; dead unstressed question rise #ifdef CUT_THIS_RULE :1621-1642;
  Rule-4 comment :1288-1292; make_f0_command :1857-1902; FQUENEXT/NotQuest tests
  :1294,:1308,:1323,:1480,:1630)
- `C:\Users\Q\src\dectalk\463\dapi\src\PH\Ph_drwt02.c` (GLIDE :1891-1892,:2161-2184;
  IMPULSE :1931-1955,:2194-2200; STEP :1864-1888 — per gap report C §1.2-1.3)

Qlatt port:
- `C:\Users\Q\code\Qlatt\crates\f0-filters\src\lib.rs` (layer types :22-24; render loop
  :158-307; command activation :195-217; summation :222-249; impulse decay :270-305)
- `C:\Users\Q\code\Qlatt\src\track-assembler.ts` (LayerType :378; LAYER_TYPE_CODES
  :789-792; marshalling :750-935; durationFrames/profilePoints :462-465)
- `C:\Users\Q\code\Qlatt\src\declarative-frontend\engine.ts` (f0_layer insert
  :2280-2360; at_sync :1180; punctuationSymbol on SIL :603,:654)
- `C:\Users\Q\code\Qlatt\public\rules\frontends\dectalk-english\frontend.yaml`
  (f0_model layers incl. dead `boundary` :53-70; unused fall constants :211-219;
  punctuation_tokens :464)
- `C:\Users\Q\code\Qlatt\public\rules\frontends\dectalk-english\phases\prosody.yaml`
  (5 live F0 rules :40-261; hat_fall to modify :134-173; stress predicate use :145)
- `C:\Users\Q\code\Qlatt\public\rules\frontends\dectalk-english\pipeline.yaml`
  (is_question_boundary predicate :3 — UNUSED; prosody phase :80-87)
- `C:\Users\Q\code\Qlatt\src\transcribe-text.ts` (:218 punctuationSymbol set),
  `src\tts-frontend.ts` (:382), `src\tts-frontend-types.ts` (:269)
- Probe helper that exists: `C:\Users\Q\code\Qlatt\scripts\f0-fingerprint.ts`
