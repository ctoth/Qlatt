# Issue 94: rulepack lint wrapper

## Goal
Expose stored validation diagnostics for every bundled/inherited frontend with an optional strict exit status. Keep #94 open for full-corpus citations and eventual CI activation.

## State
Implemented the wrapper and focused test in isolated campaign/issue-94-lint, base ae3fb3f1. The active file passed with npx vitest run test/lint-rules.test.ts: four cases covering actual bundled warnings, clean strict mode, loader failure with continued inspection, and invalid arguments. No other local CI steps run.

## Decisions and why
Smallest change: about 45-65 script lines plus 50-80 focused test lines. Reuse the loader's validateDslSpec path, preserving inventory vocabulary, required tags/lowering, inheritance and source diagnostics. Print every warning with frontend/code/path/message. Return 1 for load/validation/argument errors and 2 for warnings under --strict, otherwise 0. Continue to other frontends after a load failure. No warning suppression, new classification policy, duplicate validator, package/workflow change, or strict CI activation. Existing warnings include legitimate ordered writes and require separate disposition before strict CI.

## Surprises
None for this slice. Existing full-decision citation checks and coverage reporting are already delivered separately.

## Next step
PR #333: Claude found no code/test defects; supervisor verified the review gate and seven hosted checks passed on the implementation head. Implementer response: accepted the note's incorrect test-line count finding and removed the brittle counts; no runtime change or local CI rerun. Await final-head CI and supervisor merge. No strict CI activation or citation scope added; #94 remains open.
