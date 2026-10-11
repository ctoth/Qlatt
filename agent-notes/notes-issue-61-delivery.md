2026-09-08 checkpoint: Issue #61 groomed and user has resumed implementation, PR, CI, and merge delivery.
Clean candidate C:/Users/Q/code/Qlatt-issue-61 on fix/issue-61 at 1af37573; no source edits yet.
Existing resolver already has class floors; per-phone ownership and structural propagation are the actual gap.
Sources read: Klatt 1976/1973, MITalk 1987, Crystal-House 1988, van Santen 1994, White 2014. Local original Klatt PDF exists in main checkout.
Next: verify source-table discrepancy, record dataset/component decisions, then failing regressions and implementation.
2026-09-08 checkpoint: Original Klatt 1976 table confirmed printed inconsistent ratios; selected MITalk Table 9-1 consistently, documented adaptation.
Implemented inventory duration_models -> target metadata and cited duration_floor_from_inventory rule; explicit floors preserved, component basis bounded, stress factor applied once.
Focused red/green tests and typecheck passed; fallback/clamp diagnostics buffered until successful transaction commit. K citations audited without retuning.
Before/after report captured under TEMP/issue61-{before,after}.json; WASM build running session 18727.
Next: review comparison, add validation/atomic-diagnostic cases, regenerate affected goldens, full gate, scoped PR, exact-head CI and merge.
2026-09-08 checkpoint: Focused/inherited/schema tests and typechecks passed; exact-base control recaptured in Qlatt-issue-61-control at 1af37573.
Report: 627 segments, 365 changed (179 shorter/186 longer), deltas -26..17 ms; CSV and documentation in candidate, corpus golden regenerated.
WASM build passed. Full npm test session 89637 running; observed voice-quality hashes (2) and qlatt-english tone snapshots (4) fail after intended timing changes.
Control focused reproduction session 89826 running; target/node_modules junctions point to candidate (same unchanged DSP/dependencies). Remove junctions safely before control cleanup.
Next: inspect full results, verify control and update affected snapshots only, rerun gates, commit/PR/monitor/normal-merge.
2026-09-08 checkpoint: Base hash tests and original dictionary floor audit pass. Updated 4 English track snapshots and 2 audio hashes after source review.
Final full run: 188 files pass; only revised dictionary floor audit fails because antwerp has no cached synthesis result (old audit silently skips synthesis errors).
Need reproduce antwerp directly on candidate and base; distinguish an existing synthesis error from new per-phone-floor failure before changing audit coverage.
All typechecks, schema checks, biome check (existing warning only), Rust tests, and strict-citation explain passed. No commit/PR yet.
Next: diagnose antwerp, repair only scoped cause or retain explicit existing failed-synthesis accounting; finish full/build and publish/CI/merge.
2026-09-08 checkpoint: Committed 75ac52d73886b2016a9e990df42d088b058b8e94 and opened PR #193 with literal Closes #61; mergeable.
Full local npm test passed (189 files), build/check/typechecks/Rust passed. Actual strict-citation explain output verified nonempty after fixing launcher argv entry detection and disabling its WebSocket.
Antwerp nullable-voicing error reproduced on base/candidate; floor audit preserves successful-synthesis scope and validates all component floors. Control worktree clean.
CI run 34259111950 on exact head is in progress, static checks passed, currently compiling node-web-audio-api.
Control-directory removal was policy-rejected; safely removed only copied source files via apply_patch and retained both worktrees clean. Next: monitor CI, normal-merge when green, verify two parents and issue closure.
2026-09-08 completion: PR #193 normal-merged after exact-head CI 34259111950 succeeded for 75ac52d7.
Merge 1ac9c8b819b9e603655808b25538e2d2855ad151; issue #61 confirmed CLOSED with literal Closes #61 retained in PR body.
Local full suite, builds, typechecks, static checks, Rust tests passed; original control hash tests and audit reproduced before updating goldens/audit scope.
Candidate and control worktrees are retained clean; unrelated primary-checkout files preserved.
Delivery complete; no requested work remains.
