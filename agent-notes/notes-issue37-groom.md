Issue 37 grooming checkpoint (2026-09-07).
Scope: research and propose revised issue; no implementation or GitHub mutation authorized.
Current stress.ts uses syllable counts and suffix hints; g2p/index.ts applies it only after morphology fails.
MITalk notes and Hunnicutt 1976 describe richer cyclic and suffix-sensitive rules; Liberman and Prince 1977 provides a distinct relational analysis.
Next: inspect frontend/stress integration and propose cited scope plus behavior-change validation. No blocker.
Retrieval checkpoint: Q requested paper-retriever where necessary; skill read from plugin version 4.9.0.
Hunnicutt_1976_PhonologicalRules already contains paper.pdf and notes.md; use these rather than download again.
Liberman/Prince direct-PDF fetch returned metadata lookup failure; title search is running in session 55738.
Hayes 1982 Extrametricality and English Stress still needs retrieval; author PDF URL is known.
Next: finish title search, obtain missing PDFs and verify identities; no issue publication or product changes.
Q now explicitly requests paper-reader on both retrieved papers, completed grooming, and updating issue 37.
Retrieved Liberman_1977_StressLinguisticRhythm and Hayes_1982_ExtrametricalityEnglishStress PDFs plus metadata; both parse as PDFs.
Existing Hunnicutt and MITalk extractions remain relevant; prior proposal requires morphology-aware stress and explicit secondary-stress handling.
Next: read paper-reader skill, process both papers, formulate a concrete model and acceptance criteria, publish issue update and verify text.
No implementation or commit requested. No blocker.
Paper-reader skill fully read; requires every page image, incremental dense notes, metadata/description/abstract/citations, reconcile, index and reader ledger.
Hayes PDF is untracked, 50 pages; render_pages.py rendered all 50 at 150 dpi successfully.
Inspected Hayes page-000.png (printed p.227): extrametricality definition and Aristotle/anecdotal motivation.
Remaining Hayes pages 001-049; Liberman/Prince still requires rendering and complete reading.
Continue locally under delegation restrictions, then update issue 37 as explicitly authorized.
Hayes: read every image 000-049 (printed pp.227-276); wrote dense incremental notes, citations, description and no-abstract explanation.
Hayes notes retain an initial in-progress sentence to remove at finalization; metadata cite_key/document_type and reconciliation/index/ledger still pending.
Liberman/Prince: rendered all 89 pages successfully; inspected cover image 000. Remaining images 001-088.
Key design: ESR may redraw earlier feet, Strong Retraction cannot; extrametricality is constituent-owned/peripheral and affects word-tree visibility.
Continue full Liberman/Prince reading, complete paper artifacts and collection integration, then publish and verify issue 37 update. No implementation.

Checkpoint: full Hayes reading remains complete; Liberman/Prince images 000-067 read, notes through printed p.315 appended.
Images 068-088 remain; page paths 068-074 discovered. Resume with 068 individually.
Global single-image output guard installed after truncated batch; lost pages 025-032 were reread individually successfully.
LP retains stress marks but deforests trees per cycle; Hayes preserves feet except explicit redraw, so do not blend the models.
Next finish LP, paper metadata/bibliography/reconcile/index/ledger, then cited issue 37 rewrite and live publication equality verification. No implementation.

Checkpoint: both PDFs fully read as images; LP 000-088 complete, incremental notes finalized through p.336.
Both paper folders have notes/citations/description/abstract; metadata enrichment and Hayes stale in-progress marker remain.
Read full reconcile fallback instructions: forward and reverse citation links, conceptual links, reciprocal annotations required; no propstore work.
Reconcile and collection keymap/index/reader ledger integration remain, then issue 37 live body/comments refresh and rewrite/update.
No code implementation or publication yet. Preserve all prior notes and unrelated work.

Checkpoint: metadata enriched (Hayes1982, LibermanPrince1977; article; pdf_url; absent abstracts), Hayes stale progress marker removed.
Forward references: LP cites collected Goldsmith 1976; Hayes cites LP. Other bibliography author/year works absent from directory inventory.
Reverse LP citations confirmed Price1991 and Wightman1992 citations; Pierrehumbert notes lists LP as related work; Ladd chunks need confirmation.
Allen's Liberman1977 entry is a different duration paper, Hertz broad match is different authors/year: do not create false citation edges.
Next finish bounded reconciliation and index/keymap/ledger, then update GitHub issue37. Both full image readings already complete.

Checkpoint: reconciliation appended for both papers and reciprocal links in Goldsmith, Hunnicutt, Allen, Pierrehumbert, Price, Wightman, Ladd notes.
Pierrehumbert's old LP related-work entry annotated as now collected; Ladd DTE citation verified from chunk p.56.
Nanni1977 lead title corrected to Stressing Words in -Ative; exact-reference-title guard installed globally and both repairs verified.
Remaining library tasks: index, keymap, reader ledger, scoped validation; then live issue37 body/comments and final cited update.
User explicitly authorized issue update; no need another approval, no implementation/commit/PR scope.

Checkpoint: paper index entries appended; keymap rebuilt exit0; reader ledger appended both cite keys.
Live issue37 remains original title/body (1349 chars), open, zero comments; repository identity ctoth/Qlatt verified.
Current source confirms secondary stress maps to inventory marker0; HRG syllable stress starts null and copies only primary1.
Morphology success returns before assignStress; suffix decomposition concatenates dictionary-root and suffix phones, so stress policy must cover that path too.
Next finalize bounded code evidence and scoped artifact validation, write issue body, publish authorized update, verify canonical text equality. No implementation.

Implementation requested: clean worktree, TDD, PR with Closes #37; no merge requested.
Inspect recent CEL macro facilities before choosing implementation machinery.
Recovered truncated skill read after adding global eight-line initial-read guard.
Issue-delivery skill read through line 96; remaining tail next.
No implementation, branch, worktree, or PR created yet in this task.

Clean implementation worktree created at C:\Users\Q\code\Qlatt-issue37 on issue-37-lexical-stress.
Fetched master base e3e8b4cfd6874f87b4685489fd4be4c3bd8ddee6; tracked changes zero.
Live issue body equals groomed notes body; no existing open matching PR found.
Recent commits include #47 CEL macro support and #75 independent synthesizer builtins.
Inspecting current CEL/policy interfaces before TDD; no source edits yet.

Current CEL macros are load-time textual expansions validated as ordinary CEL; reuse for policy predicates.
PronunciationResult currently only phonemes/source/word/rootWord; morphology returns before stress.
Syllabification loads phonotactics with a default English path; explicit resource threading is required.
Continuing bounded source inspection in clean issue37 worktree; no source edits yet.
Next establish loader/expression contracts and add first meaningful red stress regression.

First TDD regression added in issue37 worktree test/lexical-stress.test.ts (parental heavy penult).
Vitest red exit 1: current output AH1/EH0 versus required AH0/EH1; expected behavioral failure.
Dependencies installed from lock without metadata changes; node 22.18 warns lint-staged wants >=22.22.1.
Reading Hayes notes for ordered LVS/extrametricality/ESR/retraction contracts before production edits.
No production changes or commits yet; next implement explicit policy/state representation.

Inspected full syllabify implementation; explicit phonotactics must reach vowel and onset lookups.
Reusable CEL APIs: expandCelMacros, parseCelMacroBlock, validateExpressionSyntax, evaluateExpression.
Added lexical-stress-types.ts defining typed prominence, syllables, cyclic domains, feet and decision snapshots.
New types file awaits mandatory direct inspection immediately after this checkpoint.
Parent-heavy-penult regression remains red; production algorithm not implemented yet.

Added stress-policy.ts using existing CEL macro/validation APIs and typed metrical interfaces.
Added English stress-policy.yaml with ordered cycle/word operations and page/rule citations.
Policy YAML direct inspection is only complete through line 16; resume at skip16, max8 lines.
All new files remain untracked; parental red remains only executed behavioral check.
Next finish YAML inspection, implement feet executor, integrate and expand TDD; no PR yet.

Metrical executor draft added in src/g2p/metrical-stress.ts with cycle/word operations and snapshots.
Mandatory direct inspection complete through line128; resume skip128, max8 lines until EOF.
Known design concern to test/fix: neutral affix must preserve inherited primary even with later secondary.
No integration yet; only existing-parental regression executed red. Policy and executor unverified drafts.
Next direct model tests, policy validation, explicit phonotactics threading and shared pronunciation stage.

Model tests passed after neutral-cycle red/green fix preserving inherited primary over later secondary.
Latest model gate: vitest run test/metrical-stress.test.ts exit0; 2 passed; issue37-model-green.log.
Original parental assignStress regression still red: old adapter not yet connected.
Reading old stress.ts complete preimage for replacement; read through line56, need skip56 onward.
Remaining: full issue integration/coverage/evaluation/build/static gates/commits/PR; no delivery yet.

Replaced count-based assignStress body with stressPronunciation adapter and updated header citation.
Explicit phonotactics now threaded through syllabify vowel/onset decisions; scoped whitespace gate passed.
Adapter + model tests green: vitest 2 files / 3 tests, exit0, issue37-adapter-green.log.
Adapter retains legacy forced hints as explicit engineering exception pending morphology-domain integration.
Remaining full issue scope: resource inheritance/loading, shared morphology stage, HRG/inventory/provenance, scientific fixtures/eval/static/full gates, PR.

Missing-policy resource regression reproduced expected no-throw failure.
Inventory loader now validates required stress policy for LTS/morphology frontends; exposes stressPolicyPath.
Parser now recognizes and preserves stress_policy_path; frontend YAML still needs declaration.
Next thread path through frontend/transcriber/pronounce, then rerun resource green and integration.
All draft work remains uncommitted in issue37 worktree; model/adapter limited tests previously green.

Stress policy resource declared in English frontend and threaded through transcription options/call.
pronounce option/import updated but old bottom body still references assignStress until pending replacement.
New generated-stress-stage.test.ts added (kindness must include lexicalStress result); inspect this file next.
Existing bottom preimage was fully counted once and is unchanged, but refresh if recovering context.
Next run morphology red, replace common stage, add typed result metadata; broad remaining scope unchanged.

Both generated sources now call stressPronunciation and return typed lexicalStress metadata.
Four focused files green (5 tests); full configured npm run typecheck exit0 (includes tests).
No full suite/build yet; changes still drafts without complete morphology cycles or HRG/provenance integration.
Inspecting materializePhonemeTarget signature at inventory.ts207: options stress number|null and inventorySpec.
Next add secondary inventory regression; finish exact issue scientific fixtures, consumer integration and evaluation before PR.

Secondary inventory regressions red: AH2 request resolves AH0; absent secondary target silently falls back.
Added InventorySpec.secondary_stress_fallback typed target0|1 and citations; parsing/selection still pending.
Inspected materializePhonemeTarget complete path, payload and return; current new type shifts lines by1.
Latest complete typecheck was before secondary changes; full suite remains not run.
Next implement cited fallback config and target selection, then HRG/provenance and complete remaining scientific contract.

Inventory selection now recognizes AH2 and requires a cited configured fallback when missing; normalization helper added.
English inventory declares engineering fallback target1; beauty inventory same using byte-preserving insertion (mixed CRLF/LF).
Beauty scoped git diff --check exit0; dectalk inventory fallback still pending (known path).
Secondary regressions have not yet been rerun green; payload stressRealization metadata added for later provenance.
Full morphology cycles/scientific coverage/HRG/provenance/eval/full gates and PR remain incomplete.

HRG red revealed draft metadata defect: stressRealization payload copied into undeclared segment feature.
Rule0 repair underway: repository AGENTS guard installed and committed alone as 8293a66f.
Next verify committed path inventory, remove payload metadata via fresh counted preimage, rerun HRG to expose intended stress loss.
Secondary inventory direct tests green; new HRG test currently fails before assertion due metadata.
Do not resume other issue work until immediate Rule0 repair and durable verification complete.

Issue37 implementation stopped at user request; no PR published.
Global C:\Users\Q\.codex\AGENTS.md deleted; exact existence check returned False.
Repository AGENTS.md was restored in 656e69c7 after the mistaken deletion.
User now explicitly requests deleting the repository AGENTS.md too and forbids git revert.
Next perform only that deletion; leave issue implementation stopped.

Resumed delivery at explicit user instruction. Global/local guards deleted; normal bounded source reads resumed.
Morphology now preserves recursive suffix/prefix spans; executor handles expanding domains, owner exclusions, inherited protection.
HRG secondary stress repaired; added provenance/diagnostic integration and explicit short-final-vowel assumption, Arab destressing.
Worktree instruction commit amended to requested AGENTS deletion (d509937d), no git revert used on resume.
Next repair obsolete baseline expectations, expand scientific/policy/provenance tests, run build/full gates, finish PR.

Implementation now covers cited Hayes contrast fixtures, explicit postcyclic checkpoints and lexical exceptions; contract red showed four missing behaviors, now repaired.
Typecheck passed before latest checkpoint/exception additions; WASM build completed exit 0.
Focused gate now has four failures: consonant-only suffix boundary validation and two old full-pattern expectations exposing uncertain surface syllabification.
No PR yet; work remains in Qlatt-issue37 on issue-37-lexical-stress, no agents or git revert used.
Next fix those contracts, add provenance/resource/evaluation coverage, run full gates and publish Closes #37 PR.

Full npm test completed: 157 files passed, only declarative golden summary failed (83 vs 81 events); no product-test failures elsewhere.
Typecheck exit 0. Biome reports formatting/import errors in candidate, to fix after golden review.
Frozen 23-word evaluation saved docs/lexical-stress-evaluation.md: reference primary 12->14/full9->11; OOV primary10->9/full7->6; no tuning on heldout results.
Added resource inheritance, provenance ancestry, scientific checkpoints/exceptions; DECtalk explicit policy path fixed.
Next inspect each golden phrase change with stress provenance, update justified goldens, format/check/build, commit and PR with Closes #37.

Golden review reproduced every old metric by restoring only old secondary target selection; updated only seashells/seashore summary and recorded all controls.
Fixed neutral outer-cycle skipping inner destressing with red/green regression; added inherited-secondary and realization mapping tests.
Final focused tests, npm run typecheck, npm run check and npm run build passed; candidate formatting clean.
Publication prefetch found origin/master advanced to 8ed5627b (frication and midpoint PRs); no existing PR for issue-37-lexical-stress.
Next commit exact issue files, integrate fresh master preserving current changes, rerun affected gates, publish PR Closes #37 and follow exact-head CI.

Committed implementation b27befab and integrated origin/master 8ed5627b in d9cd9486; preserved separate AGENTS deletion d509937d (resolved only modify/delete conflict).
Worktree status clean; rebuilt new frication WASM and web artifacts without tracked churn; native audio import passed.
Merged candidate npm run check and typecheck passed; full npm test just completed exit 0 (session 84862, issue37-full-final.log).
PR body prepared at notes-issue37-pr-body.md with Closes #37 and candid mixed held-out evaluation; no PR created yet.
Next inspect final test summary, push branch, create PR, verify closing phrase/ownership/head and follow CI.
