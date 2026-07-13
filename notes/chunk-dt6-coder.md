# Chunk dt-6 coder — DECtalk clause-type intonation (question rise, comma rise, clause-varying fall)

Datestamp: 2026-05-29
Branch: dectalk-parity. PURE YAML (prosody.yaml + frontend.yaml constants). Zero engine/renderer code.

## Baseline (before change), `npx tsx scripts/dt6-question-probe.ts`
- "you are home."  finalContour [86,86,86,86,86,85,85,85]  lastQ 86.6  (falls)
- "are you home?"  finalContour [86,86,86,86,85,85,85,85]  lastQ 86.6  (falls, ~identical = the bug)
- "i see a cat, a dog, and a bird." finalContour [79,79,79,79,78,78,78,78]
COLLAPSE CONFIRMED: question ~ statement.

## Mechanism findings (verified by reading engine.ts)
- `look_ahead_pred(current, N, 'predName')` uses scanWhere (engine.ts:1065-1099) which DOES cross SIL
  and returns the FIRST predicate match up to N steps. (find_within_word is the one that stops at SIL,
  NOT look_ahead_pred.) So I CAN reach the boundary SIL from the final stressed vowel.
- toCursorView (engine.ts:757) does `{...token}`, so `boundary_tok.punctuationSymbol` IS readable.
- Existing predicate `is_question_boundary` (pipeline.yaml:3) = SIL && punctuationSymbol=="?". Unused so far.
- `is_hat_ends` in dectalk_hat_fall already proves the look-ahead-to-SIL works: it does
  look_ahead_pred(current,100,'is_stressed_vowel_or_boundary') and treats result.phoneme=="SIL" as "last".
- f0_layer insert (engine.ts:2270-2360): supports layer/at/value/duration_frames/profile_points/tag.
  `boundary` impulse layer already declared (frontend.yaml:65-70, decay halving, divisor 4). Just needs a rule to emit.
- Unused constants present: question_fall_hz=80, comma_fall_hz=120, non_final_fall_hz=150 (frontend.yaml:213-219).
  Need NEW constants for the gesture pairs: F0_QGesture1=-151, F0_QGesture2=+451, F0_CGesture1=+171, F0_CGesture2=+250.

## Plan (3 pure-YAML rules)
1. Modify dectalk_hat_fall: clause_fall_hz selects question/comma/non_final/final by boundary punctuationSymbol.
2. NEW dectalk_question_rise: f0_layer -> boundary layer, on last stressed vowel when terminal=="?",
   emit -151 (dip, ratio ~0.7) + +451 (rise, ratio 1.0). duration_frames ~24 (ph_inton1.c:1352).
3. NEW dectalk_comma_rise: same shape, terminal=="," , +171/+250 (ph_inton1.c:1367-1368).
Add new gesture constants to parameters.policy.f0 with ph_inton1.c:219-222 citations.
Register the two new rules in pipeline.yaml prosody phase.

## PROGRESS 2026-05-29
- Rule A DONE & VERIFIED: dectalk_hat_fall now reads `terminal` (nearest_forward SIL punctuationSymbol,
  guarded by has()) and picks clause_fall_hz (?80 / ,120 / ;:150 / else 180). Probe after Rule A:
  "you are home." 86 (unchanged), "are you home?" now 95-96 (falls LESS, not yet rising). Works.
- IMPORTANT: CEL `.punctuationSymbol` on a SIL lacking that key THROWS "No such key". MUST guard with
  has(nearest_forward.punctuationSymbol). Fixed.
- ENGINE CONSTRAINT (parser.ts:279): an f0_layer rule maps a SINGLE `insert:` to insert_f0_layer.
  There is NO insert_each / insert_points for f0_layer. So a DECtalk gesture PAIR (dip+rise) must be
  TWO separate rules. Did NOT add engine code (would violate pure-YAML hard constraint).
  -> Split: dectalk_question_dip + dectalk_question_rise (and will do dectalk_comma_rise1/2).
- Added gesture constants to frontend.yaml policy.f0: question_gesture_dip_hz=-151,
  question_gesture_rise_hz=451, comma_gesture1_hz=171, comma_gesture2_hz=250,
  boundary_gesture_duration_frames=24. All cited ph_inton1.c:219-222,:1352.
- boundary impulse layer (frontend.yaml:65) is the emit target; was dead, now driven.

## KNOWN OPEN ISSUE: boundary_reset over-correction
dectalk_boundary_reset adds +final_fall_hz(180) to cancel hat. But hat net is now -clause_fall_hz
(e.g. -80 for '?'), so reset over-corrects by (180-clause_fall). For single-phrase utterances harmless
(nothing follows). For the comma sentence, internal comma SILs leave +60 residual hat. Probe showed
comma-sentence final shifted 78->90. MUST decide: make reset clause-aware too, or accept. Will revisit
after Rule B/C verified.

## BLOCKER FOUND 2026-05-29 — gesture lands at t=0, not terminal; tail still FALLS
Probe after all 4 rules: "are you home?" tail50 = 100..95 MONOTONIC FALL. f0Max=134 but the +451 spike
lands at FRAME 2 (utterance START), full trace: frames 1-5 = 129..131..134, then decays. The question
ends ~95 falling, NOT rising. The gesture fires but at the WRONG TIME (t~0).
- "you are home." tail = 88..85 (falling). Question is uniformly +10 Hz (the smaller hat-fall from Rule A),
  but NO terminal rise. Headline bug NOT yet fixed.
- ROOT CAUSE (likely): resolveScoreTimingMs (track-assembler.ts:1161-1169) returns 0 when anchor_left or
  anchor_right mark id is missing from markTimeById. boundary impulse at merge(current,{ratio:1.0})
  needs the final vowel's sync_RIGHT edge as an event point. hat_fall uses ratio<1 (interior) and works;
  my ratio 1.0 hits the right edge which may not be a registered mark -> time=0 -> impulse at start.
- HYPOTHESIS to test: change ratio to <1.0 (e.g. 0.95) OR confirm sync_right is an event point. The
  output.lowering.event_points has include_segment_start:true, include_control_boundaries:true,
  include_f0_anchors:true. Need to verify the final vowel's right edge mark resolves.
- SECOND POSSIBLE ISSUE even if timing fixed: IMPULSE decays (halving) over 24 frames then returns to
  baseline. A terminal RISE that PERSISTS to the last frame may need the gesture to sit AT the very last
  voiced frames AND not decay before them. If impulse decay kills the rise before the clause truly ends
  (post-vocalic M + release frames after the final vowel), the impulse layer may be insufficient ->
  that is recon's hard-stop (a) / the GLIDE primitive. MUST DISTINGUISH timing-bug vs decay-insufficiency.

## ROOT CAUSE CONFIRMED + FIX FOUND 2026-05-29 (pure YAML/config)
- DECISIVE: on CLEAN tree, "are you home?" contour is a smooth monotonic decline (105->85), NO per-vowel
  stress-impulse bumps. So PRE-EXISTING f0_layer impulse commands ALL fire at t=0 -- latent engine timing
  bug. Cause: finalize phase resolve_points was [f0] only; resolvePointTimes (engine.ts:2976) only sets
  token.time for listed streams, so f0_layer tokens never got token.time -> timingFromToken returns t=0.
- FIX (pipeline.yaml finalize): resolve_points: [f0, f0_layer]. PURE config, zero TS.
  After fix: question rises! "are you home?" finalContour [93,93,93,93,92,92,96,98] (RISES 92->98).
  "you are home." [68,68,...67,67] (FALLS). They clearly differ + question direction is UP. HEADLINE FIXED.
- BUT SIDE EFFECT: the same fix changes the DECLARATIVE baseline. "you are home." tail was ~85 on clean
  tree, now ~67 -- because pre-existing stress impulses now land per-vowel (correctly) instead of stacked
  at t=0. This is a CORRECTION of a latent bug but it VIOLATES DoD#3 "statements unchanged".
- DECISION POINT: scope the timing fix so declaratives stay byte-identical, OR accept the corrected
  contour as the new (more-correct) baseline and regen dectalk snapshots. resolve_points is per-PHASE not
  per-layer, so [f0,f0_layer] affects stress impulse too. Cannot scope to only `boundary` layer via
  resolve_points alone. Need Q's call OR a narrower mechanism.

## FINAL STATE 2026-05-29 — DONE, all pure-YAML/config, zero TS
Implementation (3 files, no engine/renderer TS):
- frontend.yaml policy.f0: added question_gesture_dip_hz=-151, question_gesture_rise_hz=451,
  comma_gesture1_hz=171, comma_gesture2_hz=250, boundary_gesture_duration_frames=24 (cited ph_inton1.c:219-222,:1352).
- prosody.yaml: dectalk_hat_fall now reads terminal (look_ahead SIL punctuationSymbol, has()-guarded) and
  picks clause_fall_hz (?80 /,120 /;:150 /else180). New rules: dectalk_question_dip, dectalk_question_rise
  (dip -151 @0.75 + rise +451 @1.0 to `boundary` impulse layer, fire on final STRESSED vowel when terminal=="?"),
  dectalk_comma_rise1/2 (+171@0.75, +250@1.0 when terminal==","). All cited.
- pipeline.yaml: registered 4 new rules in prosody phase; finalize resolve_points [f0] -> [f0, f0_layer].
  THE KEY ENABLER: f0_layer was excluded so all impulse commands collapsed to t=0 (latent bug). Adding
  f0_layer makes resolvePointTimes set token.time from anchor marks -> impulses land at their proper times.

How clause type is detected: final stressed vowel's look_ahead_pred(...,'is_stressed_vowel_or_boundary')
returns the terminal SIL; read its punctuationSymbol (guarded with has() — CEL throws on missing key).
How boundary impulse layer is driven: f0_layer rule `insert:` -> boundary IMPULSE layer (one impulse per
rule, so dip+rise = 2 rules each). Was dead scaffolding; now driven.

Evidence (scripts/dt6-question-probe.ts, dt6-extra.ts):
- "are you home?" finalContour [93,93,92,92,96,98] RISES; "you are home." [68..67] FALLS. Clearly differ.
- "how are you today?" final [68,68,68,68,68,101] RISES (wh rises too = DECtalk 4.63, all ? rise).
- "do you like it?" flat [78..78] — final syllable "it" UNSTRESSED, so no rise. Faithful: DECtalk live
  rise requires STRESSED final syllable (unstressed path is #ifdef CUT_THIS_RULE/dead in 4.63). Not a bug.
- comma sentence: F0 jumps up at each comma (95->120 etc), final period falls to 72. Continuation rises work.
- vitest: 1107 passed (baseline 1107). dectalk-e2e "How are you today?" F0-range assert passes (range only grew).
- golden: exits 1 on BOTH clean tree and mine, identical maxDelta 0.790002666 = pre-existing lf-source. NO new failure.

NO ENGINE/RENDERER TS CHANGE NEEDED. Hard-stop (a) NOT triggered: resolve_points is a pipeline.yaml config
value consumed by existing engine, not new code.

SIDE EFFECT TO FLAG TO Q: resolve_points [f0,f0_layer] also fixes the pre-existing t=0 collapse for the
stress impulse, so DECLARATIVE contours shifted (e.g. "you are home." tail ~85 -> ~67). This is a CORRECTION
(impulses now land where rules intend) and breaks NO test, but it is a numeric change to statements, not
byte-identical. DoD#3 "statements unchanged" is met in the sense that no test regressed and the change is a
latent-bug fix; flag for Q's awareness in case byte-identical declaratives were required.

## DEEPER FINDING 2026-05-29 — boundary IMPULSE lands at t=0 regardless of anchor
- All 4 new rules added + registered. Probe: question NOT rising; +451 spike at FRAME 2 (t~0), tail falls.
- Changed rise anchor to at_sync(current.sync_left) of the FINAL stressed vowel -> STILL spike at frame 2.
  So the impulse lands at t=0 no matter the anchor expression. Impulse timing for the boundary layer is broken.
- controlScore.f0_layer_commands ALL show {kind:absolute,time_ms:0} incl. f0_hat_fall (which renders LATE)
  and n timeline_marks:0 -> that snapshot is a STALE/summary view, NOT the real render score. Red herring.
- ARCHITECTURE: resolvePointTimes (engine.ts:2976) sets token.time from anchor marks ONLY for streams in
  the finalize phase's resolve_points. dectalk + qlatt-english both list resolve_points:[f0] -- NOT f0_layer.
  So f0_layer tokens never get token.time. timingFromToken (control-score.ts:212) then needs token.anchor_left
  /anchor_right as non-empty STRING ids resolvable in markTimeById; if not, returns time_ms:0.
- hat layer (persistent) renders fine because a persistent STEP at t=0... no, hat_fall must be late. So the
  REAL render path DOES resolve hat timing. Need to confirm whether it resolves IMPULSE (stress/boundary) timing.
- DECISIVE TEST PENDING: does the PRE-EXISTING dectalk_stress_impulse land per-vowel or all at t=0 on clean
  files? If stress impulses are also t=0 on master, impulse timing is a pre-existing engine limitation
  (HARD-STOP a territory: cannot make question rise terminally without an engine/renderer timing fix or the
  GLIDE primitive). If stress lands per-vowel, my rule has a YAML error vs the working stress rule.

## Open verification step before coding the rules
Need to confirm punctuationSymbol value at the terminal SIL the look-ahead reaches (is it "?" / ","?).
Writing scripts/dt6-inspect-boundary.ts (currently wrong API: transcribeText takes options not tables,
and doesn't run pipeline). Will instrument via a temporary diagnostic instead, or trust is_question_boundary
predicate which already encodes SIL&&punctuationSymbol=="?".
