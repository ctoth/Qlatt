
Issue 70: implement with TDD in clean worktree and publish PR with Closes #70; no merge requested.
Worktree: C:\Users\Q\code\Qlatt-issue-70; branch issue-70-target-transition; base 3703354b4488174c85202194548f4e1892e3d1be.
Read issue and Holmes/Hertz notes; Holmes extracted table appears misaligned and lacks explicit proportions.
No implementation yet. Skill issue-delivery read; existing open PR search returned empty.
Next: inspect lowering and declarative timing, resolve cited table values, write focused red regressions.

Q requested paper-reader skill during issue 70 source investigation.
Using installed skill C:/Users/Q/.codex/plugins/cache/research-papers-marketplace/research-papers/4.9.0/skills/paper-reader/SKILL.md; read through extraction guidelines so far.
Canonical Holmes PDF exists in original checkout, absent from clean worktree; text extraction was ambiguous and is superseded by required page-image reading.
No production/test edits or running children. Need inspect existing canonical pngs and use skill render_pages.py if absent.
Continue issue 70 TDD/PR after source reading; keep scope to needed source corrections and implementation.

Read all Holmes page images 000–017 and all Hertz 000–003 using view_image; no rendering needed.
Updated both worktree notes with authoritative page-cited corrections/table data; scoped whitespace checks exit 0.
Hertz p1173: AY starts 145ms, two-phone ending R 160ms; prevoiced 1.5x capped 200ms vowel+glide/250ms three-phone; nasal-voiceless-stop exception; transitions unchanged.
Holmes table p140 columns alternate steady/fixed, E/I durations; S→OO boundary F2=1450, E30/I20. Notes contain corrected consonant table.
Installed worktree npm ci; manifest/lock diff empty. Next inspect inventory/pipeline and add focused regressions (no code/tests yet).

Current implementation discovery: inventory materializer preserves object/array fields; tts-frontend derives feature schema from inventory dynamically.
QLatt pipeline has structural expansion AY→AA+Y, ER→ER+R; duration scalar rules run before formant and final timing.
Lowering currently makes midpoint blends from transition_ms or default, and separate locus/sonorant overrides. Need add Holmes path without overriding DECtalk policy.
HRG rule-engine exposes current.syllable as SylStructure ancestor when no scalar feature, enabling same-syllable nucleus selection.
Next write tests for S→OO boundary 1450 / 20-30ms, fallback diagnostics, and Hertz starting/voiced-capped nucleus distribution; then production changes.

Focused test test/hrg-lowering-holmes.test.ts added and run red: 3 assertions fail behaviorally (missing event, 1468 vs 1450, missing fallback diagnostic).
Log C:\Users\Q\code\Qlatt-issue-70-red.log. Test fixture follows existing HRG constructors/transactions and 30ms initial silence policy.
Added src/declarative-frontend/hrg/holmes-transitions.ts (NOT YET DIRECTLY INSPECTED; must inspect next after this mandated checkpoint).
New module plans cited per-formant boundary curves, rank dominance and overlap intersection; not wired to lowering yet. Need scrutinize zero-span handling and schema array shape.
Next inspect new module, wire curves/events/provenance/fallback, run focused green, add inventory + Hertz declarative timing tests and changes.

Holmes module inspected and wired into lowering (curves, event offsets, provenance, fallback diagnostics); focused tests and typecheck:core exit 0, logs outside worktree.
A diagnostic used unsupported js-yaml default import; Rule0 repaired durable global C:\Users\Q\.codex\AGENTS.md first, then confirmed source named load import and reran successfully. Global guard count1, not Git repository; worktree AGENTS diff quiet0.
Inventory consonants grouped: fricative S Z SH ZH F V TH DH HH; nasal M N NG; liquid L R; glide W Y; closures/releases/aspiration and CH JH, GS DX.
Need actual inventory population script and Hertz rule/tests still. Proposed Hertz selected AY source marker145 and rhotic160, same-syllable nucleus sharing with voiced cap200/three-phone250, no blanket160 assumption.
Stop at PR with Closes #70, no merge authority. Next inspect frontend detailed-result tests for integration fixtures, then finish inventory/nucleus timing and full gates.

Hertz integration tests added and ran red: 5 failures (tie177 vs145, tied175 vs200, pint175 vs145, her146 vs160, no provenance).
Added scripts/apply-holmes-inventory.mjs, inspected fully. It preflights all anchors before writes; run rejected Nonunique anchor N; no inventory write occurred.
Active Rule0 repair: global diagnostic guard added, bounded rerun recovered Error: Nonunique anchor N. Literal N header count0 though parsed target N exists, likely quoted YAML key; must inspect exact key and strengthen guard before fixing matcher.
Prior range-probe defect repaired durable global Substring clamp instruction and corrected read; no repository instruction edits.
Next complete active repair (quoted header evidence + durable guard + matcher + successful migration), then Hertz rule and validation. Note active bounded output ceiling after truncated diagnostic.

Inventory migration repaired for quoted 'N' key after global durable guard; successful 41 target inserts; whitespace exit0. Global guard verification count2.
Hertz rule hertz_nucleus_timing inserted into duration.yaml, registered after aspiration_frication_carryover; nucleus_duration_ms added to pipeline and tts runtime feature schema.
Focused run failed validation (inline145/160 and undeclared durationFloor). Active Rule0: appended repo AGENTS guard, committed standalone 22ffdb67 (verified only AGENTS.md).
Immediate fixes added 5 cited nucleus params under frontend policy.duration; replaced rule constants and floor with policy paths, scoped whitespace exit0. Need rerun same focused gate to finish repair.
No PR yet; final scope notes, metadata script+inventory, lowering module/wiring, Hertz rule/config/runtime schema, two regressions. Full suite/build still pending.

After policy repair, schema+Holmes pass. Hertz tie/pint/her now pass; tied stays145 instead of200 (30 tests pass,1 fails).
Found HRG ahead bridge accepts typeof amount=number only; CEL integer offset fell back1. Scoped Hertz offsets changed to2.0/3.0/4.0; this fixed false third-phone classification. No shared engine edits.
Created temporary scripts/inspect-nucleus-timing.ts and test/issue-70-inspect.test.ts for diagnosis; standalone Node probe fails resource initialization; global guard added. Vitest diagnostic exits0 but console output suppressed.
Need change diagnostic script to write small JSON artifact, inspect tied actual coda metadata/syllable ownership, finish remaining green. Delete only these agent-created temporary diagnostic source files when done.
Prior full gates not run. Need additional overlap/zero-edge coverage, formatting, notes corrections cleanup, build WASM, full test, commit/push/PR Closes #70. All work stays worktree.

Diagnostic now writes C:\Users\Q\code\Qlatt-issue-70-{tie,tied,pint,her}.json; inspected tied real coda D_CL voiced true and parent word_0:syllable_0, same as AA1/Y.
Temporary nucleus bit probe returned3: coda present+voiced, but alias coda lacks computed syllable property. HRG path helper verified via navigation test R:SylStructure.parent syntax.
Restored nucleus_duration_ms budget_ms (removed debug probe) and changed aliased syllable lookups to explicit path(alias,'R:SylStructure.parent'). Current rule has redundant true checks to tidy later.
First replacement preflight rejected duplicate coda in debug expression; no write. Corrected preflight removed debug first and replaced longer after_coda before coda; completed counts1 each.
Next scoped whitespace and focused tests; if green remove temporary diagnostic sources, add meaningful overlap/boundary tests, static formatter/checks, build/full suite, final PR. Still no PR; no source gate currently running.

Declared SylStructure type span in pipeline (matching navigation test contract), fixing path validation. Focused schema+Holmes+Hertz all green31 before next zero-edge regression.
Added zero-duration boundary test red (blending false), then removed skip in Holmes curves so zero-span table entries override legacy blends with constant steady-state curves; provenance parents now retain zero-edge boundary decisions.
Ran pwsh -File build.ps1 redirected build.log; nested session84301 completed exit0, no live session. WASM artifact inventory still required before full suite.
Temporary script/test deletion preflight: git ls-files --error-unmatch reports both untracked. Must query targeted status then delete those exact two agent-created diagnostic sources.
Remaining: tidy redundant true conditions, focused/static/formatter checks, final staged candidate and full suite once, fix relevant failures only, scoped commit, fetch/rebase if needed, push + PR Closes #70. No merge requested.

Removed both agent-created diagnostic source files after ownership/status preflight. Biome changed-scope check/write exit0, typecheck:core exit0, focused32 tests green after zero-edge fix.
Committed implementation 4f8d992c (12 paths,956insertions6deletions), following standalone AGENTS guard22ffdb67. Worktree original base3703354.
WASM build completed and all7 klsyn88 required wasm binaries inventoried with nonzero sizes immediately before npm test.
Full suite session60857 now exited1:11files failed124passed;10tests failed1114passed. Log C:\Users\Q\code\Qlatt-issue-70-full.log; only terminal summary inspected so far, no causal classification.
Fetched master now d6432b67cd512c68b3f99d47a93046d0d5cf320a. Next inspect bounded failure titles/diagnostics, integrate updated base now no process active, fix issue-related failures and validate new candidate, publish PR Closes #70.
Checkpoint: implementation committed on issue-70-target-transition; master merged at e2372a0524dc8bc46df5585c469aa9944bd7b59c.
HEAD 99fa628f adds inherited-rule declaration guard; beauty pipeline declarations remain uncommitted.
Focused recheck leaves rhotic event-sample comparison and golden frame-count failures; inheritance and intonation checks pass.
Next inspect rhotic probes/audit sampling and golden producer, repair actual contracts, then candidate full gate and PR with Closes #70.
No push or PR yet; full/recheck logs remain outside worktree; original checkpoint stays uncommitted.
Checkpoint: resumed after compaction; phonology-probes fixture path verified successfully.
Rhotic probe requires tail F2/F3 lower; rhotic unit test compares arithmetic averages of emitted frames.
Structural expansion uses inventory ER stress target plus R target; Holmes introduces explicit boundary/steady event sampling.
No source edits since last checkpoint; audit-dictionary path is now verified for inspection.
Next establish appropriate acoustic invariant from complete test consumers and fix any genuine transition defect before golden update.
Checkpoint: rhotic unit/probe/audit checks compare event-sample averages; formant rule applies coda/onset R F3 policy.
Added temporary test/issue-70-rhotic-inspect.test.ts and inspected it directly; diagnostic run exits zero but no console rows appear.
Do not infer no frames from suppressed console output; vitest.config.ts discovered for reporter/silent inspection next.
Temporary diagnostic must be removed after ownership checks; beauty pipeline change remains uncommitted.
Next obtain bounded rhotic frame values, resolve remaining acoustic/golden failures, finish full gate and PR.
Checkpoint: repaired PowerShell anchor-count syntax with global durable separate-variable guard; anchor_count=1 and guard_count=1 verified.
Temporary rhotic inspection now writes JSON, whose frames have time/F2/F3 but no phone/word keys; do not treat its filtering as acoustic evidence.
Standalone established rhotic suite still reproduces 1741.4980842911875 versus1698.5 average failure (other tests pass).
Investigating discrepancy between diagnostic call and established test metadata before changing any existing test contract.
No new product edits; pending beauty declaration change, temporary diagnostic cleanup, golden migration, full gate, commit and PR.
Checkpoint: diagnostic JSON has 51 annotated frames; only initial silence lacks phone/word, correcting earlier provisional metadata concern.
Other ER F3 reaches1664; R reaches1595 then1465 before exit transition. Sparse event averages conflate exit boundary and constriction.
Updated rhotic unit to compare attained minima (both ER and R); probe checks tail minimum against ER average. No fixture presence assertions removed.
Audit helper confirmed segment.frames; next migrate only rhotic-tail sample to attained minimum, then focused tests and golden producer.
Temporary diagnostic remains to remove; beauty declaration change and test edits uncommitted; PR still pending.
Checkpoint: focused rhotic suite exits0:3filespassed,7passed12skipped; dictionary rhotic audit passes attained-constriction sampling.
Scoped whitespace gate passes for beauty declaration and three rhotic test changes.
Documented golden:declarative-summary script exits1 on undefined import.meta.env.BASE_URL under direct ts-node execution.
Next run the inspected golden producer under the repository Vite environment, then verify generated artifact and focused golden test.
Temporary diagnostic cleanup, formatting/typecheck, candidate commit/full suite, fetch-before-publication and Closes #70 PR remain.
Checkpoint: golden producer ran under temporary Vitest wrapper; regenerated summary and focused golden/Holmes/Hertz tests exit0; temporary test removed after ownership checks.
Biome checked3files fixed1; core typecheck exits0; five-path follow-up committed after staged whitespace check.
Fetched master now51d572eaf34ef1401c26dc679877686f3ad710a0; normal merge currently conflicts only in AGENTS.md.
Next resolve instruction conflict preserving both scopes, complete merge, inspect candidate/build artifacts and run full suite once.
PR publication with Closes #70 remains pending; no running child process; checkpoint uncommitted in original checkout.
Checkpoint: retained both independent AGENTS additions and completed normal base merge at0fdfb91d26171299ef39936acaaf97002083233c; worktree status_rows=0.
WASM inputs unchanged from built4f8d992c; all7required binaries inventoried; final full suite running session61550 with redirected full-final.log.
Reviewed18candidate paths and6commits relative origin/master; scope includes notes, timing code/rules, regressions and summary.
PR body created and directly inspected at C:\Users\Q\code\Qlatt-issue-70-pr.md, includes Closes #70; no PR yet.
Next wait exact test process, inspect result, fetch base immediately before publication, push/create same-repo PR and verify body/head.
Checkpoint: full suite exits0 (139files/1157tests); published PR127 at https://github.com/ctoth/Qlatt/pull/127.
Remote head0fdfb91d26171299ef39936acaaf97002083233c matches tested candidate; body_equal=True, closing_phrase=True, status_rows=0.
User now explicitly authorizes monitoring CI and normal merge when green.
Initial live PR snapshot: same-repository, OPEN, quality IN_PROGRESS, mergeable UNKNOWN.
Reading babysit-pr skill before starting continuous monitoring; next verify reviews/scope and merge exact green head with --merge.
