2026-09-08 checkpoint: Issue 42 open; no existing delivery PR. Worktree C:/Users/Q/code/Qlatt-issue-42, branch issue-42-inventory-conventions, base 2ec12406.
TDD: custom nucleus/stress/duration, cross-stress rejection, invalid-symbol provenance regressions failed for expected reasons; now pass.
Implemented inventory declarations, parser validation, symbol rejection diagnostics/provenance, engine/lowering plumbing, delimited onset data.
Current typecheck identifies fixture migrations plus isNucleus scope in applyEffects; no external blocker.
Next: fix scopes/fixtures, add alternate-silence prosody and onset collision coverage, run build/full gates, review and publish PR with Closes #42; no merge authority.
2026-09-08 checkpoint: Alternate pause/nucleus fixture preserves full phrase acoustic/timing output; Unicode suffix decoding, onset collisions, schema validation covered.
WASM build and typecheck passed; lint passed with one existing warning. First full npm test is still running (session 61183), log Qlatt-issue-42/test-42.log.
Full run exposed six duration-table fixtures missing new declarations and one lexical-stress golden review failure; inspect final failure before attributing it.
Changes include explicit stress-target errors, inventory dependency provenance, default-duration observation, docs/inventory-conventions.md. All work remains uncommitted in isolated worktree.
Next: finish full run, migrate duration fixture, diagnose lexical control on exact base if needed, rerun justified gates, commit/push/PR with Closes #42.
2026-09-08 final checkpoint: PR https://github.com/ctoth/Qlatt/pull/199 published, body includes Closes #42; commit 4af0e140680816cb9c607ebef8f0832d3f5809f2.
Final full npm test passed (201 files / 1683 tests) on the committed tree; WASM build, check, typecheck, Vite build passed. One existing check warning.
Earlier golden differences came from an incidental createStructure indexing change; reverted that change while retaining inventory nucleus classification. All golden controls passed final run.
Worktree C:/Users/Q/code/Qlatt-issue-42 is clean and pushed; original checkout unrelated untracked files preserved. No merge performed or authorized.
PR CI is newly queued; task milestone is PR publication, not merge.
2026-09-08 rebase checkpoint: User requests rebase PR 199 onto latest origin/master; no merge requested.
Clean issue worktree at 4af0e140; remote PR reports CONFLICTING and matches local head.
Fetched origin/master 47628abb (normalization epic PR 200 and Rust primitives PR 198 now merged).
Explicit lease expectation is origin/issue-42-inventory-conventions at 4af0e140680816cb9c607ebef8f0832d3f5809f2.
Next: rebase, resolve preserving upstream normalization and inventory conventions, validate affected paths, push with lease and verify mergeability.
2026-09-08 rebase complete: PR 199 rebased onto origin/master 47628abb and pushed with explicit old-head lease; new head d81d4542d3152234d43188b7babb1b3c81a7e74b.
Only conflict was chen-duration-table fixture options; retained upstream phases selection and issue inventory resource. Range-diff reviewed.
Focused conventions/schema/single-parse/duration tests, typecheck, static check and WASM build passed.
Full npm test passed on rebased commit (210 files, 1804 tests); worktree clean. GitHub reports MERGEABLE, fresh CI running.
No merge performed; user request was rebase and update PR.
