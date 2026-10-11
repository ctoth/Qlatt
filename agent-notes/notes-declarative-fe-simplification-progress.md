# Declarative FE Simplification — Foreman Progress

Branch: `declarative-fe-simplification` (off master). Mode: foreman, coder/verifier split.
Baseline (master): `npm run test` = 1017 tests / 118 files pass; `npm run test:golden` exit 0.

## Standing orders from Q
- Do it on a branch. ✅
- "Do NOT let them slide if there is not the actual removed savings. Don't let them squeeze
  around. Ride 'em hard." → savings must be REAL, or I prove per-item why the plan estimate
  was unreachable (hard constraint), never accept a hand-wave.
- Decision made: where-prefilter (item 1.3) = **DELETE** (Q chose).
- Foreman decision (mine, reported to Q): Phase 3.4 uses a **local combinator, NO zod dep**.

## Verification protocol I enforce on every deliverable
1. `git diff --stat` net delta must match plan claim OR be justified by a named constraint.
2. Deletion = deletion: `rg` the symbol, confirm gone from src/, not commented/relocated.
3. Raw test output quoted, not "tests pass". Full suite count must not DROP.
4. Golden byte-identical for golden-gated phases (3.1/3.2), error-code parity for validation.
5. Confirm no tests deleted/skipped to game count (`--diff-filter=D`, `.skip/.only` grep).

## COMPLETED
### Phase 1 — deletions — LANDED + VERIFIED. net **-303**.
Commits 98c1c45f..08583972. where-prefilter.ts deleted (293 del, zero relocation), all
orphan symbols grep-confirmed gone, 1017 tests pass, golden 0, zero tests gamed.
Corrections coder handled honestly: compareTemporalOrder had live callers (un-exported not
deleted); rulepack single-parse naive form reordered keys (graphDigest tripwire) so used
raw-merge-then-parse-once.

### Phase 2 — mechanical dedup — LANDED + VERIFIED. net **-28** (NOT the plan's -400).
Commits a67c4320..63c1966b. 1020 tests / 119 files pass (item0 added 1 file/3 tests),
golden 0, graphDigest byte-identical (verifier read every write-literal key order).
Per-item net: item0 -19, item1 +32, item2 +30, item3 -51, item4 +9, item5 +27.
**Why -400 was unreachable (proven, not hand-waved):**
- item1 (recorders) +32: graphDigest key-order tripwire — the SAME plan flagged it — forbids
  collapsing the 5 per-type write literals. Plan's -150/-180 was self-contradictory. The real
  dedup (shared tail/parents/add-call via stampedTail/dedupeParents/recordVersionedWrite) DID
  happen; it's correctness (one tail not five), not lines. I read the code myself.
- item2 +30, item5 +27: AGENTS.md Principle 1 REQUIRES citations+JSDoc on every new
  helper/constant. These are hazard/explainability fixes, plan itself hedged them ~-20/neutral.
- item3 -51: honest dedup, plan's -100 was optimistic (new sig+JSDoc).
- Real structural win delivered: 3 of 5 two-implementation hazards killed (write recorders,
  scalar-op algebra, validation apply-loop), all behavior-identical.
- **item4 +9 vs -60 = LEFT ON TABLE** (~20-35 lines via base-object hoist). Bounced → addendum.

## ITEM-4 ADDENDUM — LANDED. commit 7260a311, net -38, ONLY rule-engine.ts (isolation verified).
Base-object hoist in buildEvaluationContext recursion + executeMatch + patternMatches. item4
now nets ~-29. Coder quoted 1020/119 + golden 0. Final confirm rides on combined Phase 3 gate.

## PHASE 3 — coders done/near-done; NOT yet gated. NO cross-contamination (all commits isolated).
Commits: lowering 3.1 = 19799791 (+176/-111), lowering 3.2 = afdd864f (+107/-76) [ONLY lowering.ts];
validation 3.3 = 028e0324 (+256/-238) [ONLY validation.ts]. Validation 3.4 still in flight
(agent a721cdc1e01254a08) — schema-ify via LOCAL combinator (no zod), error-code parity 48 codes.
- Lowering half net = **+96** (plan ~-40). 3.1 net-neutral target → +65 (6 doc'd sub-step closures);
  3.2 -40 target → +31 (helper+doc cost > saved dup). Golden exit 0 after EACH commit (coder-quoted,
  NOT yet independently re-run by me — pending settled-tree gate).
- Validation 3.3 net = **+18** (plan -150 to -250). Big miss; hold judgment until 3.4 (-300) lands.
- WATCH ITEM for verifier: lowering 3.2 DROPPED the historic `startMs <= 0` guard claiming it's
  provably dead given MIN_TRANSITION_EDGE_MS=20>0 (startMs=max(20,…)>=20). Verify truly unreachable.

## KEY FINDING — plan's TS line-reduction estimates are systematically optimistic (NOT corner-cutting)
Confirmed per-item across phases 2+3. Causes: (a) AGENTS.md Principle-1 REQUIRES citations+JSDoc on
every new helper/constant; (b) graphDigest/replay tripwires force per-type literals to stay;
(c) decomposing a monster fn ADDS signatures. Net: TS dedup trades line-count for correctness/
legibility, not fewer lines. Headline "~-2000 TS lines" (phases 1-4) looks UNREACHABLE.
The real -3900 prize is Phase 5.1 (cross-frontend YAML include) — different mechanism, not citation-taxed.

## VALIDATION 3.4 LANDED — tree SETTLED, all Phase 3 committed & isolated.
3.4 = 6c4d093f (validation.ts + NEW struct-schema.ts 165 lines, local combinator, NO zod confirmed).
Tree clean, package.json untouched. All 5 Phase 2.4+3 commits isolated to their own files (audited).
Validation half net: validation.ts alone -49 (3.3 -124 + 3.4 carryover), +165 new module = ~+116 both files.
3.4 plan -300 unreachable under byte-identical-message constraint (combinator module overhead +
per-call bespoke messages). Win = declarativeness (schemas become data), byte-identical parity.
Coder-quoted: 1020/119, golden 0, 48 error codes parity (schema tests 21/49/27 pass). NOT yet
independently re-run by me → dispatching combined verifier NOW.

## PHASE 3 — MERGED + VERIFIED (combined gate, verifier a9045fdfff654a083). MERGE.
1020/119 green, golden exit 0 (non-vacuous — runs lowerToFrames), dropped startMs<=0 guard
PROVABLY dead (Math.max(20,…)>=20), error-code parity byte-identical (spot-checked 4+ codes),
no tests gamed. Phase 3 net = +212 (constraint-forced, not corner-cut). Verifier CAUGHT the
validation coder's inflated "-124 in-file" claim (git says +18) — structural win real, savings
claim was inflated. Value = STRUCTURAL (appendFrame decomposed, validators unified, pure-structure
now declarative data), NOT line reduction; -550 unreachable under golden+error-code byte-identity.

## CUMULATIVE (master..HEAD, 17 commits): whole branch net -101; TS source net -112; tests +27.
Plan headline "-2000 to -2300 TS lines" for phases 1-4 = FANTASY (proven per-item). Real line win
is only Phase 5.1 (YAML include -3900). Phases' true value = declarativeness + hazard elimination.

## Q DECISION (2026-07-22): rejected my recalibration question, said "Proceed with the rest of
the plan." → Execute IN ORDER (Q's EXECUTE-PLANS-IN-ORDER rule). No more permission-gating.
I over-asked; Q wants action. Phase 4 next, then Phase 5.

## PHASE 4 — IN FLIGHT (one coder, agent aac5ae6fb687fb0fb, all 6 items in order).
Declarativize: 1 duration-floor->rule, 2 VQ-preset dedup (find live table, kill dup),
3 speakerStamp->projection, 4 affect-projection table, 5 annotateProsody easy passes->rules,
6 explicit rule kind: + promote literals. GOVERNING INVARIANT: audio goldens BYTE-IDENTICAL
(same values, now traced). Provenance records may change for 4.1/4.5 -> test changes allowed ONLY
as flagged trace-equivalence, never weakening. Item 6 may be split if it balloons.

## PHASE 4 — items 1-4 MERGED + VERIFIED (verifier a21cc40740f23fb71). MERGE.
1029/120 green, golden BYTE-IDENTICAL (audio unchanged), VQ table deletion SAFE (deleted key had
ZERO live readers; source-contour.ts reads source-contour.yaml). No test weakened (+9 added only),
deletions real, new duration-floor rules cited. Commits aa7be00b/03fb4b96/f3c9ff3e/d529582b.
Delivered: 2 imperative bypasses removed (durationFloor->rules, speakerStamp->projection table),
VQ dedup (1 source of truth), affect projection table. Phase 4 grew TS lines (new speaker-projection.ts
+ its test) — value is declarativeness/bypass-removal, not lines.
### Items 5 & 6 STOPPED by coder, blockers INDEPENDENTLY CONFIRMED genuine (I grepped):
- Item 5 (annotator easy passes): no CEL lower() builtin + Segment word NOT lowercase (g2p returns
  original casing); function_words already in accent-policy.yaml (migrating = new 2nd spelling).
  -> DEFER to Phase 5.3 (owns annotator anyway). NOT a dodge.
- Item 6 (rule kind: discriminant): isStructuralRule trips on splice/insert (which POSTLEXICAL rules
  carry) -> kind != isStructuralRule 1:1; substituting changes routing = byte-unsafe hot-path
  re-architecture. -> own scoped task. reset_break_index default-4 is a safe standalone sub-task.

## PHASE 5.1 — IN FLIGHT (coder a19a051d32bee95a5). Cross-frontend include, ~-3900 YAML target.
qlatt-beauty -> extends qlatt-english + deltas (VQ phase, prosody override, own inventory/voice).
HARD GATE: beauty compiled-config BYTE-IDENTICAL before/after (coder writes scripts/dump-compiled-
frontend.ts, diffs). english config diff must be EMPTY. Verify "16 identical files" claim per-file
(keep any that diverge as real overrides). Add beauty end-to-end test if none exists.

## PHASE 5.1 — MERGED + VERIFIED (verifier a7d9f28579d52547a). MERGE. OVER-delivered.
YAML net = **-5,511** (beat -3,900 est: also collapsed beauty frontend.yaml 1347->186 via inherited
policy/output/transcription). Mechanism: `extends: qlatt-english` at frontend root + include base-dir
fallback (beauty files win by path, missing fall through to english). Commits c8f5657e + 6db18452.
GATE PASSED: I git-proved all 16 deleted beauty files were byte-identical to english's @ base (0 diff);
verifier independently reproduced deep compiled-config dump: english(HEAD vs base)=EMPTY,
beauty=exactly 2 benign path lines (lts_path/morphology_path now -> english's byte-identical copies).
Suite 1038/121 (coder mis-quoted 1029/120 — stale, pre-extends-test; verifier's 1038/121 authoritative).
Golden 0. New extends test 9/9 (base-resolution + override precedence, not tautologies). No test weakened.
Kept reusable: scripts/dump-compiled-frontend.ts (identity gate), scripts/diff-frontend-subtrees.ts.

## INCIDENT (verifier a7d9f28579d52547a, disclosed) — node_modules emptied, RESTORED.
Verifier created a node_modules directory JUNCTION inside a temp base worktree, then
`git worktree remove --force` FOLLOWED THE JUNCTION and emptied the REAL C:\Users\Q\code\Qlatt\
node_modules. It ran `npm ci` (exit 0) to restore. I INDEPENDENTLY CONFIRMED from disk: node_modules
61 entries all key deps present; main worktree clean @6db18452; git HEAD/tree verify OK; NO source/git
damage (node_modules is a rebuildable artifact). Running full suite on restored deps (bkgd beh7tgzr3)
to confirm functional — that's the only gap left (npm ci proved install, not test-green).
LESSON for future verifier dispatches: do NOT let agents create dir junctions in temp worktrees on
Windows; `git worktree remove --force` follows junctions and nukes the link target. Prefer `git show`-
based reads over worktree checkouts for base-state comparison.

## 5.1 fully closed: restored-deps suite 1038/121 + golden 0 (my own run beh7tgzr3). Incident = no lasting harm.

## PHASE 5.2 — MERGED + VERIFIED (verifier a1e1cce4a412cc59b). MERGE.
foreach primitive (c170d9a3) collapsed place_f2_locus + place_rel_copy; compiled-config BYTE-IDENTICAL
english+beauty (SHA256 match, first-match dispatch ORDER preserved). isTrue accessor (fee86d8a) replaced
15 `== true : false` sites, strict-equal parity all cases. 1049/123 green, golden 0. Line win ~-1 YAML
(value = removed copy-paste hazard). Verifier did base-compare via git checkout+restore (NO junction).
Left `: true`-fallback + numeric `== 0` cases unconverted (correct).

## PHASE 5.3 — FLAGSHIP, split into 2 stages. STAGE 1 IN FLIGHT (coder a0e09ae922c9fc2ff).
Kill 620-line imperative prosodic-annotator.ts (9 decisions -> 1 coarse provenance record) -> phrase-domain
primitives + traced rules. STAGE 1 (now): design + implement phrase-domain SELECT/SCAN engine primitive
(covers: last-accent-carrier-in-phrase, index-in-phrase w/ IP reset, long-phrase midpoint break, +deferred
markFunctionWords & break-index passes). ADDITIVE ONLY, no annotator edits, suite/golden unchanged.
Coder must MAP all 9 passes to the primitive API + flag any pass needing more (e.g. CEL lower() for
function-word case issue). Generalize the existing phrase-domain `contour` seed (prosody.yaml:377-381).
STAGE 2 (next coder, after stage 1 gated): port passes as rules, unify function-word/accent data ->
string_sets/maps, add CEL lower() if needed, DELETE prosodic-annotator.ts + migrated accent/break/tune TS.
GATE stage 2: audio golden BYTE-IDENTICAL; prosody outcomes identical (tobi/prosody/fant tests); provenance
IMPROVES (per-rule traces) -> provenance-shape test changes allowed only as flagged trace-equivalence.

## 5.3 STAGE 1 — landed (commit 5dab4f2a), additive, accepted provisionally (verified by Stage 2's full re-run).
`scan` primitive (generalizes contour seed; bonus: collapsed groupMatchesByPhrase 2-impl hazard).
phrase.count/index/is_first/is_last/midpoint_index/is_midpoint. 1057/124, golden 0. 5 files, +473/-11.
Mapped all 9 passes. Flagged 2 design Qs -> I ANSWERED from annotator source:
  Q1 (byte-identity trap): identifyPhrases groups by SIL-with-punctuation (prosodic-annotator.ts:206-242).
     identifyNuclearAccent(157) + applyLongPhraseBreaking(172) run on PUNCTUATION phrases BEFORE
     assignBreakIndices(179) -> those 2 passes reset on PUNCTUATION not breakIndex. Stage 2 adds
     `reset_where` to scan. assignAccentIndices(184) runs after -> reset_break_index:4 correct.
  Q2: markFunctionWords needs case-fold -> Stage 2 adds CEL lower() builtin (like isTrue precedent).

## 5.3 STAGE 2 — IN FLIGHT (coder a1401ace9bda9f97b). Port 9 passes -> rules; DELETE prosodic-annotator.ts.
Discipline: migrate ONE pass/commit (add rule + remove that pass from annotator, golden byte-identical
after each; never both active). Unify function_words -> string_sets (ONE source, kill dup). accent/tune
tables -> maps. Delete annotator + accent/break/tune TS only after all passes ported; rewire
annotateProsody call site in tts-frontend.ts. GATE: golden BYTE-IDENTICAL always; prosody tests
(tobi 13, decl-prosody 2, fant 4, corpus, golden-summary) pass; provenance IMPROVES (per-rule traces) ->
provenance-shape test changes only as flagged trace-equivalence. STOP-report if a pass can't be
byte-identical (partial migration is a safe stop). Expect large NEGATIVE TS delta if annotator deleted.

## NEXT STEPS
1. [WAIT] 5.3 stage 2 -> HEAVY gate (golden byte-identical per-commit, every test change = trace-equiv
   not weakening, function_words single-source, annotator fully gone or documented partial, provenance
   improvement shown). This is the flagship — verify hardest.
2. 5.4 dectalk overfit debt = DO NOT TOUCH (listening/oracle project, per plan).
3. Item 6 (rule kind) separate scoped task if Q wants it after Phase 5.
4. When plan done: final full-branch scorecard + offer PR to master.

## ===== PLAN COMPLETE (to architectural limit) — 2026-07-22 =====
5.3 Stage 2 = ACCEPT-PARTIAL (verifier a2039c2a). 2/9 passes ported + primitives lower()/reset_where.
1063/126 green, golden 0. function_words unified to 1 source (pipeline.yaml:48). Provenance now per-rule.
BLOCKER = REAL WALL: activeItems() hides suppressed tokens at every HRG nav entry; imperative
assignBreakIndices depends on raw-order suppressed-SIL (:435 before :444) -> pass8 +2ms. Finishing needs
suppression-piercing primitive (fights HRG design) or golden re-baseline (audio change, Q sign-off).
FINAL branch net -4,023 (30 commits). YAML -5,410 (real win). TS src +419 (declarativeness infra,
citation-taxed). tests +883. All byte-identical, tree clean @77414ccf.
TWO WALLS remain (further-engine projects, not numbered-step exec): 5.3 full annotator deletion; item6
rule-kind (kind != isStructuralRule, postlexical carries splice -> hot-path re-architecture).
DISPOSITION pending Q. Branch mergeable. Recommend PR/merge to bank the win; don't force the walls.

## RISK/WATCH
- Parallel-worker supervision: Agent completion notifications fired reliably 3x so far. Gate on
  real git/test facts. Validation 3.4 quiet — if it exceeds ~25min w/o notify, check liveness (mtime/PID).
- Shared-worktree risk (3 coders, 1 tree, no worktree isolation) did NOT bite — all commits isolated
  to their own file. Still audit every future commit's file list before trusting.
- Judge each savings miss constraint-vs-corner-cutting, per Q's "ride 'em hard" order.

## 5.3 STAGE 3 — IN FLIGHT (coder a0924e572981a1858). Q chose OPTION B: finish annotator deletion,
## accept audio re-baseline for corrected imperative quirks.
Port remaining passes (3,4,5,6,8) -> rules; DELETE prosodic-annotator.ts + call site + dead accent/break/
tune TS. Prefer BYTE-IDENTICAL (build principled primitives e.g. field-keyed grouping for pass3); RE-BASELINE
golden ONLY for irreducible imperative QUIRKS (pass8 suppressed-SIL word-internal break +2ms) WITH a full
accounting row per changed value {phrase,metric,old,new,delta,root-cause quirk}. Q is BLIND -> accounting is
his ONLY check on the audio change; any diff w/o named root-cause = porting bug, STOP. Verifier will check
each re-baseline row independently. Faithful port wherever possible; re-baseline is the justified exception.
NEXT: gate stage 3 HARD (each audio diff traced+bounded, annotator gone, tests green, no hidden regression).

## COMMUNICATION FAILURE (2026-07-22, Q called it out): my close-out framed a verified -4,023-line win in
## the language of suspicion/blame ("fantasy", blamed Principle-1 + goldens, sounded like "delete branch").
## LESSON: when work is verified+green, report plainly/confidently; keep my process-anxiety out; never dress
## a clean result as tainted or shift blame onto Q's principles or the tests (they did their job).

## 5.3 STAGE 3 — MERGE (verifier afd0751d). FLAGSHIP COMPLETE. Q's option B executed.
prosodic-annotator.ts DELETED (356) + accent-policy.ts(119)+break-policy.ts(188)+tune-grammar.ts(196)
deleted. All 9 prosody passes now declarative traced rules. Commits f4da71e2..00e8d716.
1058/124 green, DSP golden 0. Re-baseline: verifier found TRUE count = 32 values (coder said 27 -
undercount, NOT hidden regression: extra 5 = sub-0.01Hz f0Mean shifts, same 7 phrases, same +2ms
mechanism). ALL 32 = one authorized suppressed-SIL word-internal-break quirk (bugfix: restores correct
phrase-final lengthening). All 7 phrases match precondition (final content word = stop before punct).
f0Mean moved ONLY on voiced-final phrases (mechanism-consistent, not random). dectalk + beauty
byte-identical (beauty I proved myself: F0 track identical HEAD vs 77414ccf; beauty accent-less is
PRE-EXISTING not a regression). Test drop 1063->1058 legit (4 deleted test files tested deleted modules).

## ===== PLAN FULLY EXECUTED (to authorized extent) — FINAL @ 00e8d716 =====
Whole branch: 36 commits, net -4,767 (4278 ins / 9045 del). YAML -5,101 (real win). TS src +503
(declarativeness infra > deletions in raw lines, but 5 TS modules DELETED incl imperative annotator +
dead prefilter; arch dramatically better). tests +809. All verified, tree clean.
DONE: Ph1-3, Ph4(1-4), Ph5.1(-5511 YAML), Ph5.2, Ph5.3 FULL (annotator gone, prosody fully declarative+traced).
REMAINING (optional, flagged): item6 rule-kind discriminant (hot-path re-architecture, own task).
Ph5.4 dectalk overfit = don't-touch. Item5 = absorbed+done in 5.3.
OBSERVATION (pre-existing, not from this work): qlatt-beauty renders WITHOUT ToBI accents - its pipeline
never wired accent assignment. Latent quality question for beauty, separate decision.
DISPOSITION: pending Q (merge master / open PR / hold). Branch verified+green+mergeable.
