Issue 19: declarative assembly fallback policy; TDD and PR with Closes #19 authorized, no merge.
Clean worktree: C:\Users\Q\code\Qlatt-issue-19, branch issue-19-fallback-policy.
Fetched master: 6223e67a2078fcf23ab58078ab8abfb5e43d9048; issue is open, no matching open PR.
Original track-assembler.ts is absent; current tests import HRG lowering and policy reader.
Next: trace lowering policy and validation, identify remaining acceptance gaps before regression.

Remaining gap: src/declarative-frontend/hrg/lowering.ts owns MIN_TRANSITION_EDGE_MS=20 (leading and trailing clamps).
Duration floors and F0 clamps already come from policy. Add required cited transitions.min_transition_edge_ms.
Validation owner: src/declarative-frontend/validation.ts validateCitedNumber near 2739, transitions validation near 3051.
Dependencies installed with npm ci; manifest/lock diff empty. No implementation edits yet.
Next: red regressions in output-config and midpoint tests, migrate policy fixtures and bundled frontend YAML, typecheck and PR.

Red regression added at test/hrg-lowering-fallback-policy.test.ts: missing config and 20/80ms edge behavior.
Initial fixture omitted initial silence; repaired assertions after standalone AGENTS guard commit 9b7ec505.
Corrected red: 2 failed / 1 passed; 20ms baseline passes, 80ms ignored and missing policy accepted.
New test file is directly inspected; original checkpoint remains uncommitted in main checkout.
Next: add min_transition_edge_ms to lowering/validation, both frontend YAML files, and explicit test policy fixtures.

Implemented cited positive finite min_transition_edge_ms; removed inline edge constant; updated both bundled frontends and explicit fixtures.
Focused initial gate: 5 files / 38 tests passed. Added invalid-value and missing-citation tests afterward.
Core typecheck exit 0. Biome checked 12 files, fixed new test formatting. WASM build exit 0 (session 79644 completed).
Migration helper outside repo: C:\Users\Q\code\Qlatt-issue-19-migrate.py; no product commit yet beyond instruction-only guard.
Next: artifact inventory, full suite, inspect candidate diff, commit, refresh base, publish PR with Closes #19.

Full suite passed: 131 files / 1107 tests, exit 0; core typecheck exit 0, build exit 0.
Implementation commit 53bcfb206da8b246aef906127f23ca05e6fb78cd pushed to origin/issue-19-fallback-policy.
Refetched origin/master unchanged at 6223e67a2078fcf23ab58078ab8abfb5e43d9048.
Restored only build-produced changes to tracked f0-filters.wasm and reconstruction-filter.wasm; no binary changes intended.
Live GitHub branch lookup confirms head in ctoth/Qlatt. Next: create PR with Closes #19 and verify body/ownership/clean status.

User requested diagnose/fix CI for PR 114. Live head unchanged 53bcfb20; isCrossRepository=false.
CI run 34164003246 quality failed npm test: hrg-lowering-intonation.test.ts:298 expected 5.200000000000003 < 1.
Failure is time-zero persistent-control filter test; no current diff in that test against fetched master a2ecc215.
CI builds WASM via bash build.sh before tests; prior local run restored build-produced tracked WASM while suite was running.
Next: compare generated versus checked-in F0 WASM and reproduce focused failure before assigning cause or repair scope.

Installed global guard in C:\Users\Q\.codex\AGENTS.md forbidding input mutation during live gates; guard_count=1.
Rebuilt candidate WASM and reran intonation test with artifacts frozen: 10 tests passed.
Current master adds commits 8c3d7434 and a2ecc215 changing DECtalk speaker smoothing; alpha_param now f0_lp_filter_alpha.
Created detached base reproduction worktree C:\Users\Q\code\Qlatt-issue-19-ci-base at a2ecc215988936e5ff4df46a0dc059784e175624.
Next: install base lock dependencies and reproduce intonation failure on exact base, then determine whether base fixture requires repair separately.

Exact base a2ecc215 reproduces CI failure (1 failed / 9 passed), proving base defect independent of #19.
Captured speaker alpha is 0.5126953125 (8400/16384), scale 4100, minimum 1100; corrected binding activates that coefficient.
Separate base branch fix-dectalk-intonation-filter-expectation replaces obsolete <1Hz assertion with explicit captured coefficient and 5.2Hz expectation.
Focused intonation test after correction exits 0; no feature-PR code changes made this turn.
Next: inspect/commit/publish separate base repair, obtain merge authority if needed, then update #114 and verify its CI.

Q authorized merging base repair #115 after green CI, then updating #114 and verifying its CI; no merge of #114 authorized.
#115 quality SUCCESS at head 4fd85ba439c09ccac8e2b839ab2e369acf38cfc6; reviewed one test file.
Merged #115 with --merge --match-head-commit; merge b1e0f9dd8e9d7b514e42dd51696de67c7066f2cf.
Live commit API verifies two parents a2ecc215 and 4fd85ba4.
Next: fetch repaired master into issue-19 worktree, normal merge into feature, push, verify exact-head CI and Closes #19.

Merged repaired base into #114 and pushed f3d8e0e17c10b25df39ab149dfeffbde8f86d0e8; worktree clean, Closes #19 intact.
Exact-head CI run 34167350456 failed with a different failure: test/dectalk-trace.test.ts:274 JSON.parse(stdout).
SyntaxError expected colon at position 146176 (line 4339 column 38); 1 failed / 1118 passed.
Failure log C:\Users\Q\code\Qlatt-issue-19-ci-updated-failed.log. No retry yet; need evidence of output corruption cause.
Next: inspect trace test and CLI stdout construction, distinguish nondeterministic transport from candidate behavior, then repair or justified one retry.
