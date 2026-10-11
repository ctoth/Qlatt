2026-09-08 checkpoint: User authorized issue update, isolated worktree, TDD, PR and normal merge after green CI.
Issue #67 updated; working in C:\Users\Q\code\Qlatt-issue-67, branch issue-67-tone-association, base 5ad69ccf. #98 already has separate PR #166.
Seven algorithm regressions failed then passed; production tone/link tests now pass; declarative schema and single-parse checks pass.
Compatibility hashes differ for English/beauty (DECtalk unchanged); need inspect actual frame differences before changing expectations. Typecheck session 48592 pending.
Next: diagnose compatibility, strengthen validation/provenance/domain tests, document contract, integrate #166 when merged, full WASM/test/static gates and delivery. No commits yet.
2026-09-08 checkpoint: All 12 synthesis-payload compatibility hashes match clean base 5ad69ccf; only provenance IDs changed, excluded after exact-base recapture.
Generic association, all eight accent labels, YAML melody override and replay are implemented; malformed point-selector regressions failed then passed after validation.
PR #166 is merged on origin/master d7add81f; integrate before delivery. Candidate remains uncommitted in Qlatt-issue-67.
Latest checks: 37/38 focused tests pass; ancestry test incorrectly treats leading unstarred accent tone as boundary, fix fixture classification. Typecheck requires narrowing base.maps in test.
An unrelated duration CEL null-voiced failure on a long phrase reproduced on exact base; using supported fixtures. Next: fix test issues, review architecture/remaining edge coverage, docs, commit, integrate master, full gate and PR.
2026-09-08 checkpoint: Tone implementation committed e18e7605; docs and 67 focused tests added. Inactive-unit test now passes after bypassing assoc()'s intentional inactive filtering.
Merged origin/master d7add81f into worktree but merge commit pending; two prosody conflicts resolved by retaining tone selectors and moving master's has_voiced_formants predicate into association eligibility.
Fixed HrgNode nullability and two test phases missing compute_times; typecheck now passes. Earlier compatibility payload controls all matched original base.
No PR yet, no full gate yet; main checkout and publication notes remain untouched/uncommitted. Worktree C:\Users\Q\code\Qlatt-issue-67.
Next: commit integration, build WASM in this checkout, complete check/test/build gate, publish PR, wait exact-head green CI, normal merge and verify #67 closed.
2026-09-08 checkpoint: PR #179 published: https://github.com/ctoth/Qlatt/pull/179, head 308675b1c18fe26768225bd819bbb7e6726a0c16.
Integrated master through f8d4d6da (#98 atomicity, #45 profile, #135 eligibility). Repaired inherited source-recognition includes and eligibility tests; snapshot edits only provenance links/point IDs.
Full candidate gate passed: WASM build, check, typecheck, npm test 176 files/1411 tests, production build, production dependency audit 0 vulnerabilities. Twelve original-base payload hashes unchanged.
CI quality running at https://github.com/ctoth/Qlatt/actions/runs/34201992991, exact head verified. PR mergeable, latest base now 66b4c375; no need to chase base absent failure/conflict.
Next: monitor exact-head CI and review state; fix evidenced failures if any; normal two-parent merge and verify issue #67 closed. Main notes and worktree publication notes remain uncommitted.
2026-09-08 final checkpoint: PR #179 merged normally at e8b7267c2ed44621c6b4ff853b9935b65848bc24; #67 verified CLOSED at 08:05:06Z.
Exact head 308675b1c18fe26768225bd819bbb7e6726a0c16 CI quality succeeded, run 34201992991. Mergeable/CLEAN checked immediately before --merge --match-head-commit.
Local final gate: 176 test files/1411 tests pass, check/typecheck/WASM/production build/audit pass. Original 12 payload controls unchanged; provenance snapshot intentionally migrated.
Two-parent merge verified through GitHub commit API. Implementation and baseline worktrees retained; main checkout dirty work preserved.
All authorized milestones complete: groom/update issue, isolated worktree TDD, PR, green CI, merge and closure.
