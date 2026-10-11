Issue 80: derive WASM builds from Cargo workspace and validate registry bindings.
Authorized: clean worktree, TDD, commit and PR with Closes #80; no merge.
Worktree: C:\Users\Q\code\Qlatt-issue80; branch issue-80-workspace-build.
Base: 8d8d1844bde52c425690aa71f359c5f34f0a5c09; no matching open PR found.
Next: inspect tooling and bindings, write focused red regression; no blocker.

Issue 80 checkpoint: build scripts manually build/copy 18 DSP targets; common crate is not WASM.
Plan: shared Cargo metadata mapping, preserve per-package build flags, validate TS worklet producer outputs.
CI runs npm check/typecheck, bash build.sh, npm test; local Node v22.18.0 supports native TS stripping.
npm ci finished exit 0 in isolated worktree; manifest/lock diff empty.
Next: add focused test and minimal seams, establish red, implement checker/build mapping. No blocker.

Issue 80 checkpoint: red test gave five behavioral failures (empty artifact mapping/missing diagnostics).
Implemented scripts/build-wasm.ts and scripts/check-registry-bindings.ts; both platform wrappers delegate to shared builder.
Registry checker uses Cargo workspace cdylib outputs and parsed TypeScript worklet outputs; wired before vitest in npm test.
Focused test command now exits 0; log C:\Users\Q\code\Qlatt-issue80.log awaits bounded summary.
Next: CLI integration and stale-artifact coverage, build byte comparison, typecheck/format, final commit and PR.

Issue 80 checkpoint: focused unit+CLI tests 10 passed; npm run typecheck exit 0; Biome fixed four new TS files.
Old build copied verbatim to C:\Users\Q\code\Qlatt-issue80-baseline.ps1 and ran successfully.
Baseline public/worklets hashes (41 nonempty files) saved in functions store baselineWorkletHashes.
New build.ps1 ran exit 0; output inventory is 41 files, none empty; next compare hashes and restore incidental generated churn.
Next: final review/diff, commit, full suite with artifact inventory, fetch latest base, PR with Closes #80. No blocker.

Issue 80 checkpoint: committed d227df5fe4bde24c9e35b485dea1ea1da110de8e with seven scoped files.
Old/new build SHA-256 records identical for all 41 public/worklets files; no generated file changes.
Full npm test running in session 16888, stdout/stderr in C:\Users\Q\code\Qlatt-issue80.log; do not read log or change inputs until exit.
Fresh fetch advanced origin/master to 577c9c549ce8a0888c1f145280e3f8213e6193c9; inspect and integrate after test exits.
PR body prepared and inspected at C:\Users\Q\code\Qlatt-issue80-pr.md with Closes #80; publication pending.
