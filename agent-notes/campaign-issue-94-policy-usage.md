# Issue 94: cited policy group usage

## Goal
Correct the existing unused-policy diagnostic when a CEL expression reads a child of a cited policy group.

## State
Implemented a one-line usage condition change and a focused schema regression from origin/master 8441cdf2. Active test file passed: npx vitest run test/declarative-frontend-schema.test.ts (24 cases). Source evidence: analyzePolicyState records cited groups as leaves; markPolicyPathUsed previously recognized exact/descendant paths but not a cited ancestor. DECtalk duration.yaml reads timing.pause_added_ms.comma and timing.frame_ms beneath the cited timing group in frontend.yaml. No other local CI checks run.

## Decisions and why
Smallest change: one condition in markPolicyPathUsed (roughly three production lines), plus 30-45 lines in the existing schema tests. Treat a child reference as use of its cited ancestor using dot boundaries; preserve unused unrelated groups and similar-prefix siblings. No warning suppression, other diagnostic categories, or strict-lint CI activation. Keep #94 open.

## Surprises
None.

## Next step
Publish for hosted CI and independent Claude review, then respond to review. Keep remaining warning categories and strict-lint CI out of this slice.
