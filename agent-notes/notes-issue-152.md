2026-09-08 checkpoint: Issue #152 authorized through PR, CI monitoring, normal merge, cleanup.
Worktree C:/Users/Q/code/Qlatt-issue-152; branch issue-152-syllable-stress; base 32c63af5. Original checkout untracked files preserved.
TDD: five new input regressions failed as expected; implemented stress schema, syllable resolution, tagged feature writes before annotation, DECtalk fallback guard.
Current blocker: included YAML cannot supply parameters; need use supported policy loading rather than broadening include merge semantics. Typecheck passes.
Next: wire accent policy, finish syllable-local deltas and edge regressions, run focused/full gates, review, publish and monitor CI then merge.
2026-09-08 checkpoint: Focused schema suite passes; input now has two failures, exposing existing behavior inconsistent with issue assumptions.
Qlatt beauty intentionally omits accent assignment; must add authored-only accent assignment without changing neutral beauty renders. DECtalk omits isAccentCarrier entirely; verify its stress impulses instead.
DECtalk has two single-word fallback rules; both now guarded against authored stress. Two additions in its emphasis rule read the same transaction snapshot, so currently total is 38 instead of 57 ms.
Accent policy is loaded via new accent_policy_path into static parameters; no include merge semantics changes. Temporary inspection script/test/JSON exist only in worktree.
Next: split DECtalk emphasis additions into ordered rules, add authored beauty accent rule, finish range/precedence/delta tests, clean temporary files, full validation and publication.
2026-09-08 checkpoint: Implementation complete in 17 scoped files including documentation; temporary inspection files removed.
Focused input, schema, single-parse tests pass; explicit accent-policy false and exact syllable-local rate delta covered. WASM build, typecheck, biome check, Vite build pass.
Full npm test running as session 32474, log C:/Users/Q/code/Qlatt-issue-152-test.log; caught existing minimal-HRG fixture regression from unnecessary syllable lookup.
Fixed lookup to run only for stress/syllable anchors; input + input-hrg-attachment tests now pass. Need full final-tree validation/CI; no PR yet.
Origin/master remains base 32c63af5, issue open. Next commit scoped changes, publish Closes #152 PR, monitor exact-head CI, normal merge and clean worktree.
2026-09-08 completion: PR #184 https://github.com/ctoth/Qlatt/pull/184 contained Closes #152 and merged normally at a962b0158ecb3fdedf508380a06d42ed63faa94e.
CI run 34247764489 succeeded on exact head 72aa61072cd6bd1765bf389b47b93b4bc1b89f82, including full tests and production build.
Verified merge has two parents (118bdc8d, 72aa6107), head is ancestor of origin/master, and issue #152 is CLOSED.
Removed clean worktree C:/Users/Q/code/Qlatt-issue-152 plus local and remote issue-152-syllable-stress branches. Original tracked checkout unchanged; user untracked files preserved.
Local full pre-fix suite had only the attachment regression, which was fixed and focused-tested before the successful final-head CI run.
