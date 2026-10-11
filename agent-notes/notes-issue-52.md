2026-09-08 checkpoint: issue 52 authorized isolated TDD, PR with Closes #52, CI monitoring and normal merge.
Worktree C:/Users/Q/code/Qlatt-issue-52; branch issue-52-nasal-side-branch; base f8d4d6da.
Read Maeda/Feng/Recasens notes. Added failing regressions, area-controlled two-pair baseline graph, reduced nasal params, Table II inventory targets; migrating shared frontend to cm2 (beauty converts back to its own solver ratio).
Current focused run: schema passes, two of four nasal tests pass; man/nine exact steady targets need inspection of downstream transitions. WASM build session 84917.
Next: inspect failing frame values, fix murmur target propagation/assimilation, add spectral check and diagnostics, full gate, scoped commit, PR/CI/merge. No PR yet.
2026-09-08 checkpoint: focused nasal/schema/single-parse tests 30 passed; typecheck passed; WASM built successfully.
Runtime spectral regression passes man/nine/sing. Coupled-vs-closed relative spectral differences .314789/.081181/.148378; peaks .121135/.125480/.117633. Reports/WAVs under worktree target/nasal-check.
Murmur F2 was overwritten by place loci; new cited nasal_murmur_targets runs after assimilation and selects inventory F1-F4/B1. Added required F4/B1 declarations in both shared-rule frontends.
Current implementation remains uncommitted, no PR. Remaining: diagnostic coverage for area bounds, stronger graph/assimilation/provenance checks, documentation, full gate and final review.
Then scoped commit and PR with Closes #52, monitor exact-head CI, normal merge and verify closure.
2026-09-08 checkpoint: candidate committed 0a683283 (18 files); focused 37 passed, typecheck/check/build passed (two preexisting Biome warnings).
Full npm test session 7217 still running; failures found in historical lowering column helper, corpus golden metrics, and DECtalk vocabulary (raw nasal declarations inherited from baseline were removed).
Confirmed DECtalk graph binds raw FNP/FNZ/BNP/BNZ directly; restore their declarations only in DECtalk experiment. Preserve historical fixtures with explicit retired-column handling, not production aliases.
Control worktree C:/Users/Q/code/Qlatt-issue-52-control at f8d4d6da, dependency junction to candidate; both corpus golden tests pass there, proving corpus updates are feature-induced.
Next: finish full run, fix integrations, review corpus delta with script, rerun gate, publish Closes #52 PR and monitor/normal-merge. No PR yet.
2026-09-08 checkpoint: full first gate completed 12 failures / 1369 pass (175 files); all failures explained by intended migrations/golden changes.
Restored raw nasal declarations in DECtalk-specific semantics and explicit retired-column allowance in historical test helper; 21 integration regressions now pass.
Added scripts/review-nasal-goldens.ts using Vite SSR (plain ts-node frontend import fails import.meta.env); dry review shows only F1/F2/B1 means plus one event-count delta for Gag, gang, and gunk go together.
Temporary scripts/inspect-nasal-events.mjs confirms changed Holmes transition knots inside K_CL after NG: old 1.4935/1.4938235294/1.4965555556, new 1.4929310345/1.4978421053; segment boundaries remain same. Reports in target.
Next: inspect Holmes knot calculation, document/guard that one event delta, write reviewed goldens, remove temp script, commit integration fix, full gate then PR/CI/merge. No PR yet.
2026-09-08 checkpoint: PR #182 opened with Closes #52, recognized closingIssuesReferences. Head 56214b8b; full local gate passed 175 files / 1381 tests.
PR initially CONFLICTING, no CI; fetched master fd23a8af with #67/#133/#163 and PLSTEP changes. Normal merge in progress; only conflict was interpreter imports (upstream removes dbToLinear, ours adds diagnostics).
Resolved import conflict preserving diagnostics and upstream PLSTEP changes. Interpreter now defaults to runtime.getDiagnostics() when available; 47 merged-tree targeted tests pass, including new nasal renders/goldens.
Integration commit 56214b8b includes explicit DECtalk raw declarations, historical fixture handling, reviewed goldens plus docs/script; corpus knot delta explained in docs/nasal-golden-review.md.
Next: finish merge commit/push, monitor exact-head CI, update PR test status, normal merge and verify #52 closure. Worktree C:/Users/Q/code/Qlatt-issue-52; temporary control worktree still exists.
2026-09-08 checkpoint: merged master into branch and pushed fd2e880b. PR #182 is MERGEABLE; CI run 34204180911 on exact head is in progress (audit/check/typecheck passed, building node-web-audio-api).
Combined-tree focused tests: 47 plus 29 runtime diagnostics pass; typecheck passes. Added range observation forwarding to runtime and interpreter shared Diagnostics collector, regression red/green verified.
PR diff against master is scoped to 25 issue files, no incoming paper changes. Branch clean. PR body records spectral results and 1381-test pre-integration full pass, with final full gate delegated to CI.
Automatic policy rejected cleanup command for clean temporary control worktree (Remove-Item junction plus git worktree remove); do not retry through alternate deletion mechanisms. Must mention retained clean control worktree in final.
Next: monitor exact-head CI, normal gh pr merge --merge --match-head-commit fd2e880b..., verify merge parents and issue closure, final report.
2026-09-08 checkpoint: CI run 34204180911 failed only 8 new tone-association full-track hashes (1471 tests passed / 180 files). Added upstream test hashes include all params, so even nonnasal cases change under column migration.
Control worktree switched cleanly to master fd23a8af; tone-association compatibility tests all 12 pass there. Added repeatable scripts/review-nasal-track-snapshots.mjs to compare underlying fields before updating hashes.
Captured master tracks to target/master-tone-tracks.json from control cwd using Vite SSR. Candidate comparison pending; asserts frame metadata/timing, column migration, and only F1/F2/F3/F4/B1 acoustic changes in nasal phrases; DECtalk exact control.
Current PR head remains fd2e880b; no rerun requested because failure is real expected snapshot drift. User informed; will push reviewed snapshots and monitor new exact-head CI.
Cleanup of control worktree remains policy-blocked; leave clean on disk and mention in final.
2026-09-08 checkpoint: reviewed snapshot migration committed d6aa3218. Master advanced to 5d30839b (#56 voice-quality), causing only frontend column-list conflicts; resolved preserving six new voice columns and nasal area controls.
Pushed second normal integration merge 3e7f172e24eb2b33c3a54ffc5447b63466d29aec. PR #182 mergeable, current CI 34205328525 now running npm test (audit/check/typecheck/native/WASM builds passed).
Combined focused 31 tests/typecheck pass; snapshot field-review script passes against master capture, including upstream neutral-control assertions. Refreshed man/nine/sing renders exactly match original PR spectral numbers.
PR body updated with evidence, Closes #52 still present. Working branch clean. Previous CI failed only eight expected full-track hashes; those are now reviewed/updated, DECtalk four hashes untouched.
Next: await current exact-head CI then normal merge with match-head SHA; verify parents and issue closure. Temporary clean control worktree still retained because automatic policy blocked cleanup; explain in final.
2026-09-08 final: PR #182 normal-merged at 32c63af5c1f35f190e53c34518c4ea2c6284a148; issue #52 CLOSED. Exact head 3e7f172e CI run 34205328525 SUCCESS: 181 files / 1503 tests, audit/check/typecheck/WASM/build.
PR body has Closes #52 and recorded final-head spectral results. Working branch remains clean at C:/Users/Q/code/Qlatt-issue-52; original dirty checkout preserved.
Control worktree C:/Users/Q/code/Qlatt-issue-52-control remains clean at fd23a8af, retained after automatic policy rejected cleanup; no alternate deletion attempted.
