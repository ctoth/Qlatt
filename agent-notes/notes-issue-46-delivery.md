2026-09-08 checkpoint: issue #46 is a 13-entry residual-policy tracker; most entries remain live.
Worktree C:/Users/Q/code/Qlatt-issue-46, branch fix/issue-46, base add90010; original checkout preserved.
Amplitude schema/PFE slice implemented: red 6 regressions, then 55 focused tests green; typecheck session 14154 pending result.
LTS slice only has new fixture/tests, both red; no LTS production edits. Bank-count design question pending.
User asks whether to split/close only part; resolve scope before further changes/publication. Merge and exact-head CI monitoring authorized.
2026-09-08 checkpoint: user approved split; created #202-#214 and linked all as sub-issues of #46, reused #160; parent remains open with full ownership map.
Amplitude/PFE child is #202. Clean candidate 8e70db504e39feb020109a155c90bf3932c84ba0 in Qlatt-issue-46; 11 scoped files, 65 focused tests pass.
WASM build, repository check (one unrelated existing warning), typecheck and Vite build pass. Full npm test session 27344 remains running; output notes-issue-46-test.log.
Exploratory LTS tests preserved in main checkout notes-issue-46-lts-regression.patch and notes-issue-46-lts-policy.yaml, removed from PR worktree.
Next: finish full gate, publish PR with Closes #202, monitor exact-head CI, normal merge, verify child closure and check only amplitude/PFE entries in #46; clean task worktree.
2026-09-08 delivery complete: PR #215 merged normally as 6b470360ec7975f639ab668031746aed43dbaec9; verified two parents and #202 CLOSED.
Exact head 8e70db504e39feb020109a155c90bf3932c84ba0 passed CI run 34289358087 (native and quality); local 1820 tests/210 files, typecheck, check and build passed.
#46 remains OPEN; exactly amplitude configuration and PFE fallback entries checked. Sub-issues #202-#214 created/linked; #203/#212 audit-only, #160 reused.
Task worktree and local/remote fix/issue-46 branch removed after clean-status and merge-ancestry verification; primary checkout kept in place.
Issue split scripts, bodies, gate logs and deferred LTS regression examples remain uncommitted under main checkout notes-issue-46-* for handoff.
