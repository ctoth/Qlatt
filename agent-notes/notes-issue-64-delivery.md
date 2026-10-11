## Checkpoint 2026-09-08
Issue #64 open; no existing PR found; requires one PR per table across nine papers, plus per-PR golden changes.
Clean worktree C:/Users/Q/code/Qlatt-issue-64, branch issue-64-duration-tables, base 1af37573; npm ci completed; no product edits/tests/commits/PR yet.
Read repository instructions, issue-delivery skill, and all nine paper notes. Crystal 0.79 concerns pauses; speech ratios approximately 0.82-0.85; rate_scale YAML is overwritten by runtime rate.
Async scope question pending: full PR series or first Crystal table PR; single-table work cannot truthfully close entire issue. Next: resolve scope and choose source-context-correct regression before changes.
## Checkpoint 2026-09-08 11:24
Proceeding with full table series per issue while optional scope question remains unanswered; no PR/commit yet.
First table Chen V: focused red observed 83 vs expected ~69 ms; production now inverts Klatt floor-aware multiplier to apply measured 146/238 total-duration ratio to adjacent-stop branch. Focused/schema tests passed before added floor edge cases.
Candidate changes: English duration policy/rule, English+beauty durationFloor declarations, chen-duration-table.test.ts, reusable review-duration-tables.ts. WASM build complete.
Detached control worktree C:/Users/Q/code/Qlatt-issue-64-control at 1af37573 with node_modules junction; its unchanged golden-summary test passes. Before segment snapshot captured there (verify asset-root correctness).
Next: capture candidate, review segment changes, regenerate goldens, full gates, scoped Chen PR; then remaining tables and final closing phrase. No source edits in original root.
## Checkpoint 2026-09-08 11:30
Chen focused tests now pass including explicit/default floor and zero-denominator cases; typecheck and biome check passed (one preexisting warning).
Full npm test still running session 78509, output in control/chen-full-test.log; so far four expected tone-association hashes failed. Reviewed exact affected segments for all 12 compatibility cases, then updated only four Qlatt hashes; focused snapshot test passes, DECtalk unchanged.
Review script now changes cwd as well as Vite root for correct YAML assets, captures corpus plus compatibility cases, checks phoneme identity and DECtalk control, can regenerate summary via Vite. docs/chen-1970-duration-review.md and summary golden generated.
Original golden CLI fails due preexisting import.meta.env.BASE_URL outside Vite; used review script golden mode. Added hmr:false to avoid inspection-port conflicts. No commits/PRs yet.
Next: finish full gate, diagnose other failures on exact base if needed, final diff + scoped Chen PR, then remaining table series. Optional user scope answer still pending.
## Checkpoint 2026-09-08 11:40
Chen part published as PR #192, commit ca14560c; candidate full npm test/check/typecheck/build passed, worktree clean. No merge authorized. PR references #64; closing phrase reserved for final part.
Crystal Table VI part in C:/Users/Q/code/Qlatt-issue-64-crystal, branch issue-64-crystal-table-vi based on ca14560c, node_modules junction to Chen. Focused red/green + schema/inheritance tests pass; WASM build completed.
Crystal uses five category FAST/SLOW means and explicitly labeled power-law interpolation anchored to vowel ratio; scales whole durations subject to floors, rate=1 unchanged. Added table regression and pending fast-rate golden test.
Review script extended with optional rate; base fast capture complete at control/crystal-before.json; candidate capture session 61014 still to poll. Need compare, generate default+fast goldens, review and full gates, stacked PR.
Read adversary skill to evaluate relevance but did not activate (read-only role conflicts with current execution); no agents spawned. Remaining tables still require work; optional user question unanswered.
## Checkpoint 2026-09-08 11:48
Chen PR #192 CI quality passed on ca14560c. Crystal commit 80379c96 ready locally; full npm test session 17424 and static/build session 52081 running. Default golden unchanged; separate fast-rate golden and segment report reviewed, flaps explicitly classified as stops.
Peterson worktree C:/Users/Q/code/Qlatt-issue-64-peterson, branch issue-64-peterson-table-i, based on 80379c96. Test-only TDD red: 15 stressed baseline values wrong; unstressed control passes. No production edits yet there.
Peterson Table I original PDF checked (control/peterson.txt): all-CNC centiseconds map IY207 IH161 EY200 EH204 AE284 AH181 AA265 AO250 OW222 UH163 UW235 AW302 AY310 OY360 ER256 ms. Notes incorrectly gloss IY/IH; original table resolves mapping.
Inventory loader drops root citations and frontend materialization only cites asset path. Plan preserve optional inventory citation metadata and include it in selection/materialization decisions so the new table is visible in provenance.
Next: Peterson values/provenance + goldens/gates; publish Crystal once gates pass; then Klatt Table I VOT with Cho citation. Acceptance criteria explicitly require intrinsic vowels, speech-rate, VOT; other listed sources are competing/context-specific calibrations, not automatically additive models.
## Checkpoint 2026-09-08 11:57
Crystal passed full/static/build gates and published stacked PR #194 on #192 (80379c96). Chen #192 CI green; no merges authorized/performed.
Peterson implementation in its worktree passes focused table/provenance, inherited frontends/schema, and unchanged Hertz nucleus tests. New hertz_nucleus_floor commits timeline floor before budget rule because atomic transaction reads do not see staged writes; shared predicate declared in both English/beauty.
Preserved root inventory citations in loader and frontend provenance; quoted a DECtalk root citation whose colon previously parsed as a map. No DECtalk acoustic changes. Both default/fast corpus goldens regenerated and passed; four English-only compatibility hashes reviewed/updated, other eight unchanged.
Peterson reports docs/peterson-1960-duration-review.md and docs/peterson-1960-fast-duration-review.md list all changed segments against 80379c96. Fast captures must use identical quoted numeric rate (PowerShell unquoted doubles lose precision); strict comparison caught mismatch and base was recaptured correctly.
WASM/typecheck done; next commit scoped Peterson files, full/static/build gates, then Klatt VOT table. No Peterson commit or PR yet.

Checkpoint 2026-09-08: Peterson final commit 58d56f80 refreshes reviewed PCM baselines; voice-quality tests pass.
PRs 192 and 194 published; Peterson final full gate running before stacked publication.
VOT branch fast-forwarded to Peterson; 21 red regressions cover measured voiceless onset rows.
VOT metadata declarations and preservation through s-cluster duration rule are implemented; table selector remains.
Next: complete VOT table, regenerate reviewed goldens, run gates, publish final Closes #64 PR; no merge authorized.

Checkpoint: Peterson full final gate passes, published stacked PR 195 at 58d56f80; PR 194 CI passes.
VOT table and citations implemented; 44 focused/schema tests now pass after the red run.
Navigation uses 2.0 because HRG ahead integer CEL arguments currently fall back to one step.
Protected prestressed /tr, tw, str/ from existing broad t-glottalization; unchanged medial control renders 36ms.
Next: verify base control, review default/fast golden changes, complete VOT build/full gates and final closing PR.

Checkpoint: VOT default/fast corpus changes reviewed; two Qlatt cat snapshots refreshed, ten controls unchanged.
Base medial/unstressed/glottal controls pass on Peterson parent; VOT table tests pass.
Added red/green adjacent-identical-word regression; new selector now uses HRG Word identity instead of spelling.
Focused schema, table, compatibility and fast golden tests pass after the identity fix; WASM build complete.
Next: commit final VOT candidate, run full gates, publish stacked closing PR, verify all CI and clean worktrees.

Checkpoint: VOT candidate 8e320166 full local suite passes before integration.
Master advanced to 1ac9c8b8 with #61 duration floors and #161 observable substitutions; PR 192 conflicted.
Merged master into Chen worktree, resolved policy/schema/citation conflicts; 56 focused tests pass with refreshed snapshots.
Control checkout advanced to exact current master; integrated corpus captures/golden generation running.
Next: commit/push resolved Chen, propagate through Crystal/Peterson/VOT, refresh per-parent reports and rely on exact-head CI full gates.

Checkpoint: integrated Chen 8a258e0c and Crystal 995b9867 pushed; exact-head CI pending.
Peterson merge resolved preserving both duration-model parsing and inventory citations; focused substitution/floor/table tests pass.
Final default/fast/hello-world segment comparisons regenerated against integrated parent.
Peterson PCM baseline now 7fbd3b... after reviewed AO1/W timing changes; Beauty/DECtalk controls unchanged.
Next: finish Peterson merge and CI, propagate to VOT, publish final Closes #64 PR, verify clean state.

Checkpoint: final PR 196 published at d34a8e94; remote body verified with literal Closes #64.
Stack 192@8a258e0c -> 194@995b9867 -> 195@b67810f9 -> 196@d34a8e94; all mergeable.
Exact-head CI passes 192 and 194; 195 and 196 still running. No merge authorized/performed.
All table reports refreshed after master 1ac9c8b8 integration; focused regressions pass.
Next: remove verified temporary control checkout, verify implementation worktrees clean, await remaining CI.

Final checkpoint: all four exact-head CI quality gates pass; final PR 196 run 34263752993 passes in 6m25s.
PRs 192/194/195/196 remain open and form the documented one-table-per-PR stack; 196 contains Closes #64.
Heads: 8a258e0c, 995b9867, b67810f9, d34a8e94. No merge performed.
All four implementation worktrees verified clean; temporary control worktree and its junction removed safely.
Original checkout's unrelated work preserved; this checkpoint file intentionally remains uncommitted.

Merge checkpoint: user authorized merging all four PRs; exact heads and successful CI verified live.
PR 192 normal-merged as 28741096d53a4545a732bc644fd46f20b05bd3d3.
PR 194 retargeted to master, preserving head 995b9867 and its passing checks.
PRs 195 and 196 remain pending ordered merges; final closing phrase remains verified.
Next: verify retargeted mergeability, normal-merge remaining PRs, verify two-parent commits and issue closure.

Merge complete: 192 -> 28741096, 194 -> e8c0a637, 195 -> 519889fd, 196 -> ede7752b.
All four normal merge commits verified with two parents; tested PR heads remained unchanged.
Final merge tree verified identical to the green d34a8e94 candidate tree.
Issue 64 verified CLOSED at 2026-09-08T18:43:56Z through the final PR closing phrase.
Original checkout preserved; no branch/worktree deletion or local master update performed.
