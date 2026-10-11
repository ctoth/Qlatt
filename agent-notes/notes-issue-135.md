2026-09-08: Issue #135 authorized clean worktree, TDD, PR with Closes #135; no merge requested.
Worktree C:/Users/Q/code/Qlatt-issue-135, branch issue-135-acoustic-eligibility, base e9d6e049.
Found six identical English/Beauty acoustic selectors; DECtalk uses distinct null guards; phonological is_voiced differs.
Added inherited has_voiced_formants(item) macro; red proved missing macro, green 41 tests incl schema/single-parse and baseline F0/match snapshots.
Next: review tests/citation propagation, format/static checks, WASM build and full gate, scoped commit/push/PR. No blockers.
2026-09-08 delivery: commit c2078dbd6296d9b99469509ac540ba3e7ec489f7 pushed; PR https://github.com/ctoth/Qlatt/pull/175 includes Closes #135.
Full npm test passed 171 files / 1357 tests; typecheck/check/build and WASM build passed. Check has two warnings in unchanged code.
Regression snapshots were recorded before macro extraction; complete selector matrix retains absent/null/error behavior and runtime citations augment originals.
Worktree git status clean after removing temporary PR body; original checkout changes preserved, these checkpoints uncommitted.
GitHub CI run 34199777890 still in progress at handoff. PR left open; user requested PR, not merge.
2026-09-08 merge: user explicitly authorized monitoring CI and merging when green.
CI run 34199777890 succeeded on exact head c2078dbd; watcher reported ready_to_merge with no review feedback or failed checks.
PR #175 merged normally as f8d4d6da026d9eff71971bd9648ebd3ab9fc63e6; verified two parents through GitHub API.
Issue #135 confirmed CLOSED by the PR closing phrase; worktree remains clean.
Delivery complete; no CI retries or additional fixes required.
