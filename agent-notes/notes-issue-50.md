# Issue 50 checkpoint
Finding: pitch.semitones must scale mean F0 by 2^(semitones/12), while rangeScale must target f0VarianceScale.
State: issue is open with no existing PR; isolated branch issue-50-pitch-routing starts at origin/master 4fed5749.
Blocker: the worktree has no node_modules, so dependencies must be restored from package-lock.json before tests.
Next: inspect the current parser and tests, add the focused failing regression, then implement and deliver through CI and merge.

Finding: the regression failed on all three original routing cases, then exposed the established formatter's `0.50` precision after the production fix.
State: production now separates `f0Scale` and `f0VarianceScale`; a repository-scoped exact-number assertion guard is added to worktree `AGENTS.md`.
Blocker: Rule 0 requires the `AGENTS.md` guard to be committed alone before correcting the test expectation.
Next: make the standalone instruction commit, fix `0.5` to `0.50`, and verify both Rule 0 repairs independently.

Finding: the committed candidate passes focused tests and core typecheck; the first full suite exited 1 after 123/125 files passed.
State: seven klsyn88 failures are missing WASM artifacts; runtime-output-level also reported peak 1.9502713680267334 above 1.05.
Blocker: launching the full suite without the documented WASM prerequisite is a Rule 0 workflow failure.
Next: install a durable artifact-preflight guard, build and verify WASM artifacts, then rerun the unchanged candidate gate once.

Finding: the documented WASM build produced all seven missing target modules; the rerun had 124/125 files and 1074/1075 tests pass.
State: only runtime-output-level remains red with the identical 1.9502713680267334 peak; the candidate worktree is tracked-clean.
Blocker: base-vs-candidate attribution is still pending for that audio test.
Next: run only runtime-output-level at detached origin/master, then classify the failure and proceed with the CI-equivalent build.
