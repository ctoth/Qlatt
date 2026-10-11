2026-09-08 checkpoint: User authorized implementation after grooming and explicitly required a worktree.
Worktree C:/Users/Q/code/Qlatt-issue-243, branch issue-243-frame-foundation, baseline ad9c73d5968e3491e98e9cccf7979703900e2e4e; no publication/merge authority yet.
WASM build completed in worktree. Added scripts/frame-baseline.mjs and frame-baseline-run.ts; Node baseline running in exec session 27583.
Contract: event-driven Frames, separate control/output clocks, preserve zero-duration rejection, bounded intermediate value provenance; migration into rules remains #244-247.
Next: capture browser baseline, then Frame schema/navigation/clock and stamped lowering transformations; preserve all unrelated files.
2026-09-08 checkpoint: Frame foundation basic regression red then green; core typecheck passed. Production uses FrameValues bounded writes and emits from Frame Items; ancestry still needs transition/F0 tightening.
Node baseline captured before production edits at test/fixtures/frame-foundation/baseline-node.json, all three frontends tooling/ordinary hashes equal. Initial concurrent timings need controlled rerun if used as performance gate.
Frozen baseline worktree C:/Users/Q/code/Qlatt-issue-243-baseline at ad9c73d5 created; WASM build session 43915, browser baseline session 32966 active. node_modules junction to candidate.
Browser harness needs explicit missing /rules asset 404 to permit inherited include fallback; added middleware. Earlier candidate browser run was invalidated by HMR, no artifact used.
Next: fixture schema updates, YAML Frames declarations, actual input ancestry, targeted/full gates and before/after measurement. No commit/PR yet.
2026-09-08 checkpoint: Existing lowering fixtures now explicitly use withFrameSchema; 66/73 focused tests pass, 7 fail only because old expectations point directly to source IDs rather than new Frame writes.
Need update these assertions to validate both Frame write and source ancestry, not remove provenance coverage. Core typecheck previously passed.
Remaining substantive gaps: transition endpoint source dependencies, F0 interpolation both parents, composed affect ancestors, YAML Frames declarations/navigation validation, repeat-lowering lifecycle.
Frozen browser baseline running session 32966; baseline WASM build session 43915 completed/pending poll. Candidate no longer hosts baseline browser.
Next: finish ancestry/schema, precise regression updates, then full output/hash and measurement gates; no publication authorized.
2026-09-08 checkpoint: 96 focused lowering/schema tests passed after updating provenance assertions to require Frame writes plus original source ancestry.
Frozen browser baseline completed; browser and Node hashes match for all three frontends. Artifacts ~21 MB each, need compact dedup/compression before final inventory.
Added transition endpoint Frame writes and explicit contributing source lists, F0 interpolation both endpoints, composed affect parents; remaining F0-layer/variance-center/timing ancestry needs tightening.
New tests for unrelated-source exclusion, clock preservation, coincident rows and association tracking currently fail on fixture trying to mutate frozen policy; clone policy first.
Next: finish these regressions, schema-output coverage, benchmark artifact hardening, full tests/golden and candidate measurements. Work remains uncommitted in dedicated worktree.
2026-09-08 checkpoint: New negative ancestry, clock, navigation and zero-duration regressions pass. All three bundled schemas now include public/rules/frame-schema.yaml; YAML merge alias attempt was removed because parser did not expose merged fields.
Frame schema coverage verifies every emitted parameter for each frontend. Current.segment validation checks Segment fields, with dependency tracking in rule-engine view.
Added F0 sample intermediate writes, variance-center source ancestry, composed affect source lists and speaker parent for Rd fallback. Need add affect/timing ancestry tests and final review.
Full npm test running session 46873 to test-frame-full.log (started before latest schema fixes, so focused failures known). Browser baseline recorded, candidate benchmark not yet run.
Next: finish harness compression/metadata, static checks, final full/golden gates, then sequential Node/browser candidate measurements. No commits/PR.
2026-09-08 checkpoint: Core typecheck and targeted Frame/F0/affect tests passed; golden command finished exit 0. Output clocks now have separate value transactions with duration/affect ancestry.
Initial full suite worker consumed ~650 CPU seconds and 6.5GB without progress. Stopped only verified candidate worker/PID and restarted full Vitest with temporary scripts/frame-test-progress.mjs; session 78130 logs test-frame-progress.log.
Baseline reports losslessly packed to .json.gz (~669KB each), raw JSON still present pending cleanup. Harness now records source digests and rejects mismatched comparison configuration; candidate runs still pending.
Biome formatted changed production and harness files; fixed remaining assignment-expression/unused-argument findings; need final lint rerun.
Next: identify slow full-suite test via progress log, complete gates and sequential candidate measurements, document exact results. No commit/publication.
2026-09-08 checkpoint: Full suite completed successfully: 221 files, 1885 tests, 435.92 seconds (test-frame-progress.log). Long-running work was the 5k-word dictionary audit beforeAll, not a hang.
Golden gate exit 0; strict explain rules trace uncited=0; core typecheck and 105 focused tests passed. Additional affect ancestry/clock assertions passed afterward.
Candidate Node benchmark running sequentially, session 87762 -> after-node.json.gz, progress frame-benchmark-node.log. Browser candidate must run after it finishes; no production source edits since start.
Moved fixture helper imports from EOF to header; test-only cleanup. Pending cleanup: raw baseline JSON, temporary progress reporter/read script, build-only public/worklets churn (preserve target WASM).
Next: await Node exact hash/metrics, run browser comparison, document results and final diff/inventory. User authorized implementation/worktree, no PR/merge requested.
Checkpoint: implementation and focused/full validation complete in isolated issue-243 worktree.
Full suite: 221 files / 1885 tests; golden, core typecheck, strict citations passed.
Candidate Node benchmark is on DECtalk tooling pass 4/5; sources remain frozen.
Baseline gzip reports retain exact rows; candidate reports will enforce field/order/hash parity.
Next: finish Node, run browser sequentially, document measured cost and clean generated artifacts.
Checkpoint: Node and browser after reports completed; all 12 baseline comparisons pass exact output hashes.
Ordinary browser ratios: English 1.52x, Beauty 1.29x, DECtalk 3.48x; DECtalk exceeds umbrella #228 final 2x budget.
Recorded timings, decision/journal growth, CEL counts, heap limitations in docs/frame-foundation.md.
Added reusable summary script; all four gzip reports retained with configuration and source digests.
Next: restore generated worklet churn, remove own explain output, final focused formatting/inventory checks; leave implementation uncommitted.
Checkpoint: user authorized stage, commit, push, PR; committed 546ef8aa and opened PR #256 (Closes #243).
Native CI passed; quality CI caught 14 import/format errors in migrated test fixtures omitted from the prior scoped lint.
Applied Biome to all 13 migrated fixtures; full npm run check now passes (existing warning only).
No production changes; exact synthesis benchmarks remain applicable.
Next: verify focused tests, commit formatting correction, push and check CI on the new head.
Checkpoint: PR #256 latest head b67cae06 includes fixture formatting and benchmark Measurement type.
Full local npm run check and npm run typecheck pass; focused 14 files / 79 tests pass.
CI run 34318763037: native green; quality passed audit/check/typecheck, audio dependency and WASM build.
Quality is currently running npm test on the exact pushed head; worktree clean.
Next: monitor suite/build result, repair real failures if any, report PR status; merge not explicitly requested.
Checkpoint: PR #256 CI green at b67cae06; user questions transaction-based optimization against adopted design.
Read live #226/#230 and docs/attribute-model.md: target is derived definitions, demand-driven memoized evaluation, generic accumulator.
Current #228/#243 explicitly require bounded stamped transactions as an intermediate slice; this differs from target architecture.
No implementation edits during this review; prior efficiency answer focused too narrowly on current machinery.
Next: read original attribute design notes and reconcile sequencing before recommending optimization work.
