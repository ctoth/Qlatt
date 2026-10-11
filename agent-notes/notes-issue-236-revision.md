2026-09-12 revision checkpoint
User authorized revising PR #255, separating remaining latency into a follow-up, and merging after exact-head CI; reusing clean Qlatt-issue-236 worktree.
Red immutability tests exposed runtime formant-bank expansion mutating shared graph/semantics. Cached config is now frozen; runtime receives a per-request structured clone. Concurrent A/B/A audio matches fresh render hashes.
Removed flaky second-request timing test; added deterministic resource lifetime/isolation, protocol replay, measurement summary tests, stage timing hooks, and repeated-process latency distributions.
Formatting passed; typecheck/focused tests running in session 88316. Next: inspect result, benchmark baseline/candidate, create follow-up and narrow #236, update PR, run exact-head CI, normal merge and closure verification.

2026-09-12 revision checkpoint 2
Candidate 44b0ff2e4fa67373ec90a034ac6dcb9c4d825ffe pushed; focused 6 files/12 tests, typecheck and lint passed. Worktree clean.
Created follow-up #260 with persistent lifecycle prototype and unresolved 150/400 ms targets; narrowed #236 to safe caching/measurement; PR #255 title/body revised with Closes #236 and fresh repeated-trial evidence.
Baseline/candidate warm OK p50 742.8/736.6 ms, sentence 1776.7/1763.7 ms. After-stage OK p50: worklet registration (includes worker startup) 323.7 ms vs node creation 12.1 ms. Full reports and PR generator under notes/issue-236-evidence.
CI run 34717801242: native passed; quality audit/lint/typecheck/dependency build/WASM build passed, npm test running. Next: wait exact-head green, update PR validation, normal merge with head guard, verify two parents and #236 closure. No merge yet.

2026-09-12 revision delivered
Exact-head CI 34717801242 passed at 44b0ff2e, including 224 Vitest files / 1887 tests and production build; PR validation body updated from the completed run.
PR #255 normal-merged as 5e82917cef67280376ca30dfdcabdefe7061ad9a with guarded head 44b0ff2e; #236 verified CLOSED; follow-up #260 remains OPEN for persistent sessions and unresolved latency targets.
Candidate worktree remains clean. Primary unrelated docs/host-contract.md modification preserved; no primary checkout update or cleanup of unrelated files performed.
Final reports, raw observations, PR generator and revised issue/PR bodies remain under primary notes paths, uncommitted.
