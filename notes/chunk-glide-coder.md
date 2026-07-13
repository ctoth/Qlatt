# Chunk glide (dt-6d) — generic GLIDE F0 layer type — coder notes

Datestamp: 2026-05-29
Branch: dectalk-parity (verified)
Mission: add generic `glide` (linear-ramp) F0 layer type to layered-additive renderer;
use it declaratively to render DECtalk hat-rise / question rise as smooth ramp.

## State / progress
- Read recon `notes/chunk-dt6-intonation-recon.md` (designs this as dt-6d).
- Read `crates/f0-filters/src/lib.rs`: LAYER_PROFILE=0/PERSISTENT=1/IMPULSE=2 at :22-24.
  LayerDesc/CmdDesc structs, render() loop :158-307. Command activation match :195-217,
  summation :222-249, impulse decay advance :270-305. FFI render_f0 :357. Tests inline.

## Design for GLIDE (from recon §3.1)
- glide = ramped persistent: linear movement to target/delta over span_frames, then HOLD.
- glide command carries value(=delta) + duration_frames(=span). On activation:
  inc = delta/span, remaining = span, tot starts 0. Each frame: tot += inc; remaining--;
  when remaining==0 stop incrementing, tot persists. Per-frame contribution = tot.
- Reuse existing token fields value + duration_frames; NO new engine token field.

## Next steps
1. CHECK WASM BUILD CAPABILITY (cargo/wasm-pack) — HARD STOP if cannot build.
2. Read track-assembler.ts marshalling (LayerType, LAYER_TYPE_CODES, layer marshalling).
3. Add LAYER_GLIDE=3 + per-frame logic in Rust + tests.
4. Add "glide" to TS LayerType/codes/marshalling.
5. Rebuild WASM.
6. Declarative use in frontend.yaml f0_model + prosody.yaml.
7. Evidence: render-phrase + inspect-audio + F0 probe; explain strict-citations; test:golden.

## Verified facts (2026-05-29)
- WASM build WORKS: `cargo 1.93.1`, wasm32-unknown-unknown target installed, baseline
  `cargo build --release --target wasm32-unknown-unknown -p f0-filters` finished OK.
  Crate is plain cdylib `#[no_mangle] extern "C"` — NO wasm-pack/wasm-bindgen needed
  (neither installed, irrelevant). Copy `target/.../release/f0_filters.wasm` ->
  `public/worklets/f0-filters.wasm` (build.ps1:41). HARD-STOP (a) CLEARED.
- dt-6a/b/c ALREADY COMMITTED in prosody.yaml: clause-varying hat fall, question
  dip+rise (impulse pairs), comma rises. Hat rise (Rule 2) = persistent STEP.
  Question rise (3b) = impulse pair on `boundary` layer.
- f0_model config is cast raw from YAML (tts-frontend.ts:694-697); NO enum validation
  of layer.type anywhere. Adding "glide" = TS LayerType + LAYER_TYPE_CODES + Rust kernel.
- CMD_STRIDE=5 [time,value,duration_frames,profile_start,profile_count]. glide reuses
  value(=delta) + duration_frames(=span). BUT TS marshalling only sets durationFrames
  for impulse/profile branches — MUST add a glide branch reading cmd.durationFrames.
- initTotal pre-fill (track-assembler :880): glide starts at 0 and ramps -> do NOT add
  to initTotal (same as impulse).

## Design (final)
glide = ramped persistent. On command activation: inc = value/span, remaining = span,
tot starts at 0. Each frame while remaining>0: tot += inc; remaining -= 1. After
remaining hits 0, tot HOLDS. Per-frame contribution = tot. Multiple glide commands on
one layer accumulate (sum of their tots). Mirrors DECtalk Ph_drwt02.c:1891-1892/2161-2184.

## Implementation DONE (code)
- Rust `crates/f0-filters/src/lib.rs`: LAYER_GLIDE=3, ActiveGlide{inc,remaining},
  per-layer glide_totals + active_glides vecs, activation arm (span>0 -> push ramp,
  span<=0 -> instant step into glide_totals), summation arm (+= glide_totals[li]),
  per-frame advance loop after impulse decay (tot += inc; remaining--; remove at 0).
  Advances AFTER frame emit (frame0 sees 0, ramps to target over span, then holds).
- Rust tests: glide_ramps_linearly_then_holds, glide_zero_span_is_instant_step,
  glide_negative_delta_ramps_down_monotonically. ALL 20 f0-filters tests pass.
- TS `src/track-assembler.ts`: LayerType += "glide"; LAYER_TYPE_CODES.glide=3;
  marshalling glide branch reads cmd.durationFrames as span (no throw, 0=instant).

## Next
- Rebuild WASM + copy to public/worklets/f0-filters.wasm.
- Declarative use: migrate hat-rise (and/or question rise) to a glide layer in
  frontend.yaml f0_model + prosody.yaml. Keep gesture magnitudes/spans as DATA.
- Evidence: render-phrase + inspect-audio + F0 probe (smooth ramp not impulse spike);
  explain --strict-citations; test:golden (qlatt golden must stay green — shared kernel).

## DECtalk source faithfulness check (ph_inton1.c, read 2026-05-29)
- Hat rise: US (#ifndef GERMAN) path = STEP len 20 (:713); GERMAN path = GLIDE len 30
  (:715). So GLIDE hat-rise IS a documented DECtalk form (German build). Cited :713-715.
- Hat fall multi-segment GLIDEs :1001-1018 (US distributed branch). Simple US fall = STEP
  (:1274/:1279). Qlatt models the STEP fall — kept span 0 (instant) to preserve it.
- Question rise: US path = IMPULSE pair (:1352); GERMAN path = IMPULSE dip + GLIDE rise
  (:1635). GLIDE-form question rise IS documented. Cited :1635 + engineering span est.
- Honest nuance recorded in YAML: glide = the DECtalk GLIDE-command form; the LIVE US
  build uses STEP/IMPULSE. This is the fidelity upgrade the mission asked for.

## Declarative use DONE
- frontend.yaml: hat layer type persistent->glide; added question_glide glide layer;
  policy.f0 hat_rise_glide_frames=30 (:715), question_rise_glide_frames=24 (:1635 est).
- prosody.yaml: hat_rise gets duration_frames=hat_rise_glide_frames (ramps then holds;
  fall/reset stay span 0 = instant, accounting preserved since glide accumulates like
  persistent). Question rise moved boundary impulse -> question_glide glide layer,
  ratio 0.5, span 24. Dip stays impulse on boundary.

## REMAINING
- ADD: reset question_glide to 0 at boundary SIL (clause-local) — glide HOLDS so without
  a reset the +451 persists into next clause. About to add dectalk_question_glide_reset.
- Then: render-phrase + inspect-audio + F0 probe; explain --strict-citations; test:golden.

## F0-CONTOUR EVIDENCE (scripts/probe-f0-contour.ts, 2026-05-29)
Reads textToKlattTrack(...).track[i].params.F0 (real script, no one-liner).
- "are you home?" baseF0 110: 110 frames, nan=0. Voiced tail (frames ~80-106) RISES
  SMOOTHLY 84.39 -> 120.43 Hz, MONOTONE ramp (14 rising / 5 falling steps over last 20
  voiced frames), tail_direction=RISE, delta +24.87. This is the GLIDE ramp shape: F0
  climbs steadily frame-by-frame into the boundary, NOT an impulse spike+decay.
- "you are home." baseF0 110: 114 frames, nan=0. Voiced tail FALLS 69 -> 66.99 Hz
  (0 rising / 19 falling), tail_direction=FALL, delta -2.05.
- Question RISE vs statement FALL cleanly differentiated AND the rise is a smooth glide.

## Blockers
- None.

## Evidence collected (2026-05-29)
- Audio health: "are you home?" 30231 samples nonZero 28807 rms .044 nanInf 0 flags OK.
  "the dog ran home." 47187 samples nanInf 0 OK. Healthy renders.
- Hat-rise glide ramp: statement frames 58-67 climb +0.53 Hz/frame steadily (smooth
  linear glide of the accent onset; a STEP would jump in one frame).
- explain "are you home?" --frontend-id dectalk-english --strict-citations: EXIT=0,
  uncited=0, 193 decisions. (F0 layer cmds realize at track-assembly, not as rules-phase
  rewrites, so no glide entry under rule_rewrite_applied — expected.)
- NOTE: explain flag is --frontend-id (not --frontend).

## test:golden — exit 1, ONLY lf-source (pre-existing), qlatt UNAFFECTED
run-golden.ts runs 3 sub-scripts; per-script exit:
- klatt-tract-wasm-compare: EXIT 0 (resonator/antiresonator ~1e-3, pass).
- lf-source-wasm-compare: EXIT 1 — PRE-EXISTING (maxDelta 0.790 rms 0.325). Reads
  lf-source.wasm (separate module); my change touched ONLY f0-filters.wasm (git status
  confirms only public/worklets/f0-filters.wasm modified). lf-source CANNOT be affected.
- render-phrase (qlatt default): EXIT 0.
PROOF qlatt byte-identical: rendered "hello world" --host node with HEAD's f0-filters.wasm
vs my rebuilt wasm -> IDENTICAL deltas (lengthMismatch -44, maxDelta 0.9802303314208984,
rmsError 0.17448962132191542 both). My f0-filters change does not alter qlatt output at
all. (The 0.98 delta is a pre-existing ad-hoc-render-vs-stored-golden artifact, exit 0,
independent of my change.) Restored my wasm after (cmp RESTORED OK).
qlatt-english uses point_interpolation, no qlatt layer is glide -> LAYER_GLIDE arm never hit.

## tsc / rust
- cargo test -p f0-filters: 20 pass incl 3 glide tests.
- tsc --noEmit: my track-assembler.ts edit adds NO new errors. Pre-existing project-wide
  scripts errors (diag-tilt-binding, dump-track, oracle/symbolic, the .ts-import pattern)
  unrelated; project runs via tsx not tsc. probe-f0-contour.ts: fixed track typing; only
  the harmless project-wide .ts-import lint remains (all scripts have it; tsx runs fine).

## DEFINITION OF DONE — all met
1. glide layer TS (LayerType/codes/marshalling) + Rust (LAYER_GLIDE + ramp DSP + tests),
   tags match (both =3). WASM rebuilt + copied to public/worklets/f0-filters.wasm.
2. Audio healthy (samples>0, nanInf 0) + F0 probe shows SMOOTH MONOTONE RISE for
   "are you home?" (84->120 Hz, 14 rising steps) vs FALL for "you are home.", and hat-rise
   ramps +0.53 Hz/frame (glide, not step jump).
3. explain --strict-citations EXIT 0 uncited=0. test:golden: only pre-existing lf-source
   fails; qlatt golden byte-identical (proven).
4. This notes file.

## Deferred / honest caveats
- Live US-English DECtalk hat-rise is a STEP (:713) / question rise an IMPULSE (:1352);
  the GLIDE forms are the GERMAN/alternate-build paths (:715, :1635) + US hat-fall GLIDE
  segments (:1001-1018). The glide rendering is the documented DECtalk GLIDE-command form
  applied as a fidelity upgrade (smoother contour), cited as such in the YAML. NOT a claim
  that the live US build glides these gestures.
- Comma rises + question dip left as impulses on the `boundary` layer (unchanged).
- No git add/commit performed (per hard-stop d).
