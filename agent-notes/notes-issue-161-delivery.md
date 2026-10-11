2026-09-08 checkpoint: Issue 161 open; isolated worktree Qlatt-issue-161 on issue-161-observable-substitutions, base 1af37573.
Added failing regressions then implemented selected inventory evidence, cited per-segment records, and aggregated structured fallback diagnostics.
Focused tests and typecheck passed; WASM build, production build, cargo lf-source tests and check completed (one existing warning).
Full npm test is running (session 35533, worktree test-run.log); no blocker identified yet.
Next: inspect full results and final diff, commit scoped files, publish PR with Closes #161, verify clean worktree. No merge authorization.
Final checkpoint: Published PR https://github.com/ctoth/Qlatt/pull/191 with Closes #161, commit eaa89c1111e1716961a4b727384e68eb5756873a.
Full initial gate caught token-range truncation by new selection records; repaired and added selection-plus-write regression.
Final npm test exited 0; focused tests, typecheck, check, WASM/production builds, and cargo lf-source tests completed successfully.
Worktree is clean; original checkout's unrelated files preserved. CI has passed setup, audit, lint, typecheck, WASM build and Rust tests; npm test is running.
PR remains open; merge was not requested.
Merge checkpoint: User authorized CI monitoring and merge after green.
CI quality passed on exact head eaa89c1111e1716961a4b727384e68eb5756873a.
PR 191 merged with normal merge commit 501e617be786c035b440122451a44d86de313fbf; issue 161 closed.
Merge parent list verified through GitHub API; worktree remains clean.
Delivery complete.
