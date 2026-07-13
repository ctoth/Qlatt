# ToBI accent collapse — implementation log

Datestamp: 2026-05-28. Task: collapse 8 near-identical `tobi_accent_*` rules
(prosody.yaml:65–317) into one, per `notes/tobi-accent-table-design.md` Design B.

## Baselines (clean master, before any edit)
- `npm test` (vitest): **1109 passed, 125 files, exit 0**. GREEN.
- `npm run test:golden`: **exit 1, RED**. Pre-existing. The failing item is a
  full-phrase render (`scripts/render-phrase.ts`, sampleRate 22050,
  maxDelta 0.79, rmsError 0.325). Primitive comparisons (resonator, etc.) pass.
  NOT related to accents — separate declarative-core regression to report to Q.

## The 8 rules (verified prosody.yaml:65–317)
- Shared selector anchor `&where_voiced_accent_stressed_vowel` (71–75).
- Two shared define anchors: `&define_downstep_with_nuclear` (77–86, used by H*,
  H*+L), `&define_downstep_no_nuclear` (137–148, used by L+H*, H*+H).
- H+!H*, H+L*, L*, L*+H have bespoke defines (prev_point-relative leads / low_hz).
- Point counts: H* and L* = 1 point; other 6 = 2 points. Tags all distinct.

## Engine facts (engine.ts)
- `applyInsertPointSpec` (2142) emits UNCONDITIONALLY — no skip path. So a single
  fixed 2-point array would add spurious points to H*/L*. Design B adds an
  optional per-point `when:` CEL guard here (~5 lines) + validation allowance.
- `prev_point('f0')` = `prevPointFn` (923), driven by `pointCursorByStream`
  (507, 558, 2169). applyInsertPointSpec sets cursor = current active f0-point
  count (2163-2169). INVESTIGATING whether this is order-dependent (see blocker).

## BLOCKER / open question (empirical, resolvable by reading code)
The 8 rules currently run as 8 SEPARATE pipeline passes (pipeline.yaml:235–242):
all H* points emit first across all tokens, then all H*+L, etc. — grouped by
accent. Collapsing to ONE rule changes emission to TOKEN order. This is
output-identical ONLY IF:
  (a) the downstream F0 contour depends only on the SET of (time,value) points
      (i.e. points are sorted by time before contour build), AND
  (b) `prev_point('f0')` resolves identically under token-order emission.
Must verify both before collapsing. If either fails, the collapse is NOT a pure
refactor and I report to Q rather than silently change output.

## Verification plan
Real gate = a custom before/after F0-point diff harness (battery of phrases
covering all 8 accents) + full vitest staying green. Loose tobi-intonation
assertions alone are insufficient (they're threshold checks, not snapshots).

## PROGRESS (2026-05-28)
- Baseline F0 fingerprint captured: `/tmp/tobi-before.txt` (20 phrases, 40 lines)
  via `scripts/tobi-accent-fingerprint.ts` (textToKlattTrack per-voiced-frame F0).
- prev_point('f0') RESOLVED: `prevPointFn`(923)/`getPointCursor`(557) — cross-stream
  lookup is TEMPORAL (last f0 point at/before current token's right bound), but only
  over points that EXIST when the rule fires. 8 separate ordered passes vs 1 token-order
  pass => H+!H*/H+L* may see different earlier points. NOT provably identical => the
  fingerprint diff is the decider. Empty diff => ship; diff => escalate to Q.
- DONE: engine.ts applyInsertPointSpec — per-point `when:` guard added (skip emit if falsy).
- DONE: validation.ts — `when:` CEL validation added in point-spec loop.
- WROTE: scripts/collapse-tobi-accents.mjs — content-anchored splice replacing the 8
  rules (prosody.yaml ~55-317) with one `tobi_accent` rule (14 self-guarded point slots,
  all original tags preserved). Verified all value formulas equal originals; unified
  downstep_factor reproduces with_nuclear (H*,H*+L) and no_nuclear (rest).
- NEXT: run splice script -> run tts-frontend-fingerprint after -> diff vs before;
  run full vitest (must stay 1109). Also need pipeline.yaml: replace 8 rule names w/ tobi_accent.

## KEY FINDING (2026-05-28) — divergence is ORDER, not values
- Implemented collapse (engine when-guard + validation + 1 rule + pipeline). YAML
  flow-map comma bug fixed (quote at:/value: exprs containing commas).
- Per-frame F0 fingerprint DIVERGED on 8/20 phrases (all multi-accent).
- BUT point-level probe (scripts/tobi-point-probe.ts) shows f0_points are
  IDENTICAL (tag,time,value) when SORTED BY TIME. before==after exactly.
- => The divergence is purely the ARRAY ORDER of f0_points. 8 separate passes
  emit grouped-by-accent (all H* first, then H*+L, ...); 1 pass emits token-order.
  Same points, different sequence. The downstream points->contour conversion is
  ORDER-SENSITIVE (likely coincident-time points resolved by array position, or
  sequential interpolation). NOT a prev_point issue (that theory was wrong).
- RECOVERABLE: either (a) make unified rule emit in the same grouped order, or
  (b) fix the contour builder to sort points by time (order-insensitive) — the
  latter is arguably a latent-bug fix but changes more surface. INVESTIGATING
  the builder (buildF0ContourFromScore / control-score) to choose.
- State right now: working tree REVERTED to master (prosody.yaml + pipeline.yaml
  via git checkout). engine.ts + validation.ts STILL carry the when-guard (benign,
  unused until a rule uses it). Need to re-apply collapse once order is solved.

## DONE (2026-05-28) — 3-rule collapse landed in working tree (uncommitted)
- ROOT CAUSE confirmed: prev_point('f0') does NOT see a point rule's OWN same-pass
  insertions; only across rules. 8 separate passes gave H+!H*/H+L* leads visibility
  of earlier accents' peaks. 1-rule collapse broke this (leads 178->174 = floor).
  Evidence: array-order point diff showed ONLY f0_h_leading + f0_h_plus_l_star_lead
  changed, both to 174.
- FIX: 3 dependency-grouped rules preserving exact visibility:
  A=tobi_accent_basic {H*,H*+L,L+H*}; B=tobi_accent_downstepped {H+!H*,H*+H};
  C=tobi_accent_low {H+L*,L*,L*+H}. Pipeline runs A,B,C in order. Shared define
  via &accent_define anchor; per-point `when:` guards select slots.
- VERIFIED: fingerprint diff (20-phrase battery) IDENTICAL to master; full vitest
  1109/1109 PASS (was 1109 baseline). Output-preserving.
- Files changed: prosody.yaml (-183 lines region; net -133 overall), pipeline.yaml
  (8 names->3), engine.ts (+10 per-point when-guard, now USED), validation.ts (+24
  when CEL validation). Temp scripts deleted.
- RESIDUAL RISK (honest): contour builder dedups f0_points by time, last-write-wins
  (track-assembler.ts:1249). Within a group, two different accent types on coincident
  f0-point times could flip the winner vs the old per-accent passes. Battery+vitest
  found NO such case (accented vowels are segment-separated), but it's not a universal
  proof. This last-write-wins dedup is itself latent ugliness (non-explainable winner).
- NOT committed (Q hasn't asked). Engine when-guard is now load-bearing (keep).

## DISCOVERED UGLINESS (report to Q as important findings)
1. prev_point('f0') same-rule-invisibility: rule output depends on PASS BOUNDARIES,
   not just rule content. Fragile, undocumented, made the 8->1 collapse impossible.
2. f0_points->contour dedup is last-write-wins on coincident times
   (track-assembler.ts:1249-1258) — non-deterministic-feeling, non-explainable.

## Q DECISIONS (2026-05-28) + EXECUTION PLAN
Q directives: #1 fix both order-deps; #2 DELETE dead sag (confirmed); #1b dedup =
deterministic+diagnostic (no voice change); #3 renderLayeredF0 -> own branch +
codex review; #4 ignore golden RED.

#1a MECHANISM CRACKED: same-rule prev_point invisibility comes from
`insert_points_order: by_point` -> PHASED insertion (engine.ts:2566 usePhasedPointInsertion,
2605-2618): all defines evaluated in the token loop BEFORE any phased point is inserted.
Singular `insert_point` (e.g. tobi_unaccented_declination) and non-by_point `insert_points`
(else branch 2569) insert INLINE in the loop + cache invalidated at 2592-2594
(`if (structural) navigation.invalidateStreamCache()`). So fixing #1a is CONTAINED to
by_point rules, NOT a global declination change. NEED TO VERIFY: is `structural` true for
insert_points so inline insertion invalidates cache -> next token's prev_point sees prior
same-rule points. If yes: ToBI single-rule WITHOUT by_point => prev_point works => clean
1-rule collapse, output becomes *correct* (leads track true temporal previous peak), likely
DIFFERS from master's 8-pass artifact -> MEASURE delta, present to Q (voice change).

SEQUENCE (each its own verified unit / commit):
1. [DONE, uncommitted, output-identical, vitest 1109] ToBI 8->3 rule collapse + engine
   per-point `when:` guard + validation. HOLD (superseded by #1a's 1-rule form).
2. #1a: collapse ToBI 3->1 rule, drop by_point, verify prev_point chains; MEASURE F0 delta
   vs master (expect H+!H*/H+L* leads change); vitest. Present voice delta to Q.
3. #1b: thread Diagnostics into TrackLoweringContext -> buildF0ContourFromScore; warn on
   coincident-time point drop; keep last-wins (output-identical).
4. #2: delete sag everywhere (prosody rule, pipeline ref, applySaggingTransitions + call,
   operator type track-assembler.ts:93, qlatt+dectalk frontend.yaml sag policy + validation
   contract). delete-first; output-identical (sag is dead).
5. #3: renderLayeredF0 -> crates/f0-filters on its own branch, codex review, merge down.

## FULL EXECUTION PROGRESS (2026-05-28, Q said "fully execute")
- #1a DONE: ToBI 8->1 rule, dropped by_point (inline insertion => prev_point sees
  prior same-token-loop points). Verified: leads now connect to RECENT pitch, not a
  pass-grouping artifact (probe: H+!H* lead at t=820 was 178 reaching back past
  intervening accents; now 174 = local high floor — MORE correct). Locked golden
  regenerated (npm run golden:declarative-summary): ONLY f0Mean moved on 7 phrases,
  sub-Hz to <1Hz shifts, no f0Min/Max/Span/f1/duration drift. vitest 1109/1109.
- #1b DONE: threaded Diagnostics into TrackLoweringContext -> buildF0ContourFromScore.
  Coincident-time dedup keeps last-pipeline-point (unchanged winner = output-identical)
  but now emits F0_POINT_COINCIDENT_OVERRIDE warn on each drop. Files: track-assembler.ts
  (import Diagnostics, context field, dedup warn, thread arg), tts-frontend.ts (pass
  diagnostics into context). tsc errors seen are PRE-EXISTING in scripts/ (dump-track.ts,
  oracle/symbolic.ts) NOT my src/ files; no typecheck script in package.json.
- NEXT: verify #1b (vitest), then #2 delete sag (both frontends + TS operator +
  validation contract), then #3 renderLayeredF0 -> crates/f0-filters on own branch + codex.
- Engine when-guard (engine.ts) + validation when: now LOAD-BEARING for the 1-rule ToBI.

## #2 SAG DELETE — in progress (2026-05-28)
DONE (TS/validation): track-assembler.ts call-site simplified to `f0Contour = rawF0Contour`,
applySaggingTransitions function deleted, TrackLoweringSpec f0.sag field deleted;
validation.ts f0.sag required-block deleted.
REMAINING (YAML): prosody.yaml sagging_transition rule (~277-318) + comment;
pipeline.yaml `- sagging_transition`; qlatt frontend.yaml policy.f0.sag_depth_hz(359)+
sag_min_span_ms(365) AND output.lowering.f0.sag block(963-970); dectalk frontend.yaml
policy sag_depth_hz(207)+sag_min_span_ms(211) AND lowering f0.sag block(362-372).
NOTE: two sag surfaces per frontend — policy.f0.sag_* (read by the rule) AND
output.lowering.f0.sag (read by the deleted TS path). Both go.
After: rebuild/regen golden (should be IDENTICAL — sag was dead), vitest.

#2 PROGRESS: deleted — qlatt frontend.yaml policy.f0.sag_* + lowering f0.sag;
dectalk frontend.yaml policy sag_* + lowering f0.sag; prosody.yaml sagging_transition
rule. REMAINING: pipeline.yaml line 242 `- sagging_transition` (linter touched file,
re-reading). Then validate (engine rejects unknown pipeline rule names) + golden + vitest.

#2 near-done: all sag deleted incl accent-inventory.yaml sag_policy (dead) + F0Point
comment. vitest after deletion: 13 fails in 2 files = the dead feature's OWN tests.
Deleted test/sagging-transitions.test.ts. Fixing track-assembler-output-config.test.ts
sag assertions (qlatt done; dectalk lines 45-46 + a `sag:` fixture at line 98 remain).
Golden unchanged by #2 (sag was dead) — only #1a's 7 f0Mean remain in golden diff.

#2 DONE: removed dead `sag:` fixture blocks from 5 more test files (integration-diagnostics,
point-actions, schema, sync-axis, track-assembler). Re-running vitest to confirm green.
After #2 verified: #3 renderLayeredF0 -> crates/f0-filters on OWN BRANCH + codex review.

## NOT in scope (these are the "important decisions" for Q, not mechanical)
- Dead sag (both paths never fire) — values call.
- renderLayeredF0 → crate extraction — own-a-crate + FFI + f32/f64, not mechanical.
- Golden RED full-phrase render — pre-existing, report with path.
