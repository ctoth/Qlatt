# Issue 94: full-corpus citation command

## Goal
Check complete provenance for the full linguistic corpus across every bundled/inherited frontend, with optional frontend selection; expose the requested package command and hosted CI step.

## State
Implemented from origin/master 11840871 in an isolated worktree. The active test file passed: npx vitest run test/strict-citations-check.test.ts (eight cases). Actual limited corpus runs cover all frontends and individual Beauty/DECtalk selection; a mocked synthesis regression verifies full corpus enumeration without duplicating the hosted full-corpus gate. No other local CI steps run.

## Decisions and why
Smallest change: about 35-55 script lines, 60-90 focused test lines and one package/workflow entry each. Default to listBundledFrontendIds; validate optional --frontend; identify frontend in summaries and uncited entries. Keep --limit for focused invocation, but package/CI run without it. Reuse full getDecisions after the existing frontend call; normalization is already included. Preserve exits 0/2/1. Run in quality after the existing WASM build supplies f0-filters.wasm. No new build, validation framework, warning suppression, or strict-lint CI activation. Keep #94 open for the unclassified lint gate.

## Surprises
None yet. Full all-frontend corpus citation status will be established by the requested hosted gate, not assumed from earlier limited tests.

## Next step
Publish for hosted full-corpus CI and Claude review, then respond to findings. Keep strict lint CI excluded and #94 open.
