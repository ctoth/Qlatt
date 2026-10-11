2026-09-08 checkpoint: Issue #77 authorized for isolated TDD, PR with Closes #77, CI monitoring and normal merge.
Worktree C:/Users/Q/code/Qlatt-issue-77, branch fix/issue-77, base 32c63af5; original checkout has unrelated untracked files preserved.
Six new g2p-resources regressions confirmed red; removed shared asset defaults and added frontend resource checks, implementation in progress.
Typecheck identifies remaining explicit-resource caller migrations; morphology has another implicit phonotactics dependency to fix.
Next: finish callers and resource tests, run focused/full WASM prerequisites and golden parity, review, commit/PR, monitor exact-head CI, merge and clean.
2026-09-08 checkpoint: Candidate c9acd2a2 committed on fix/issue-77; 27 scoped files, worktree clean after hooks.
Removed all qlatt-english strings from src/g2p, required asset inputs, explicit bundled declarations and nested morphology phonotactics.
Focused G2P/resource and locked corpus-summary tests pass; typecheck and npm run check pass; WASM build completed in candidate checkout.
Full npm test running as session 68821, log C:/Users/Q/AppData/Local/Temp/qlatt-77-tests.log. No blocker currently.
Next: inspect full gate, run golden/build, publish Closes #77 PR, monitor exact-head CI, normal merge, verify issue closure and clean worktree removal.
2026-09-08 checkpoint: PR #183 published with literal Closes #77; remote head c9acd2a254c456a34b15a8b835e2051f0e6de58e.
Full npm test passed (182 files), npm run check/typecheck/build passed, candidate worktree clean.
Standalone test:golden reproduces identical BASE_URL failure in unchanged base 32c63af5; DSP comparison outputs unchanged; locked corpus summary passes.
CI run 34247455749 is in progress on exact head; lint/typecheck passed. Base control worktree removed after verification.
Next: await CI green, verify mergeability and exact head, normal two-parent merge, verify #77 closure, remove task worktree/branch.
2026-09-08 checkpoint: PR #183 remains mergeable at c9acd2a2, with Closes #77 verified remotely.
CI run 34247455749 completed audio/native and WASM builds and is now running npm test.
All local gates completed successfully except standalone golden CLI's exact-base-reproduced BASE_URL error; golden data unchanged.
Control worktree removed; task worktree clean, original checkout preserved.
Next: wait for terminal CI success, normal merge and verify parents/closure, then remove task worktree and branch.
2026-09-08 final checkpoint: CI 34247455749 passed on c9acd2a2; PR #183 normal-merged as 118bdc8d03546ef6a97e7369c3cbc8606c60b9ce.
Verified merge commit has two parents and includes candidate; issue #77 CLOSED with Closes #77 retained in PR body.
Task and base worktrees removed; local/remote fix/issue-77 branches deleted; original checkout tracked state unchanged.
Local full tests, lint, typecheck, build and locked corpus summary passed. Standalone golden CLI exact-base failure documented in PR.
Authorized delivery complete; no remaining task work.
