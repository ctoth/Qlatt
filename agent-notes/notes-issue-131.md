Issue 131: move midpoint arithmetic into cited CEL policy; preserve behavior and public fields.
Authorized: TDD, clean worktree, commit and PR with Closes #131; no merge requested.
Worktree: C:\Users\Q\code\Qlatt-issue-131; branch issue-131-midpoint-policy; base e3e8b4cfd6874f87b4685489fd4be4c3bd8ddee6.
Issue is open; no matching open PR found. Repository instructions and package scripts read; no implementation yet.
Next: inspect phrase tests and rule consumers, install locked dependencies, add regression and establish red.

Consumer inventory: midpoint_index and is_midpoint are exercised by test/hrg-rule-engine-scan.test.ts; retain public fields.
Read target rule: count >= 7, punctuation-SIL reset, last phone of content-word run; citations and boundary tag preserved.
Locked npm ci completed with exit 0 and empty manifest/lock diff in isolated worktree.
No source edits yet. Existing prosody tests use textToKlattTrackDetailed and active Segment items; CEL tests expose evaluateExpression.
Next: add policy-only CEL red plus end-to-end odd/even, threshold, punctuation/function-word and provenance regressions; validate/typecheck and PR.

Added and directly inspected test/prosody-long-phrase-break.test.ts in issue worktree.
Red: npx vitest run test/prosody-long-phrase-break.test.ts exited 1: 3 arithmetic cases fail with No such key: is_midpoint; 10 controls pass.
Controls cover frontend counts 5-9, punctuation reset, excluded the/and, citation/tag and grouping write-parent provenance.
Diagnostic log: C:\Users\Q\AppData\Local\Temp\tmpsnthqn.tmp (reused between completed gates). No production edit yet.
Next: replace rule expression/comment after fresh preimage checks, rerun focused/schema tests and CI-configured typechecks, build/full test, commit and PR.

Production YAML expression/comment updated; engine fields retained. New test formatted by Biome (processed 1 file).
Focused Vitest: 4 files, 46 tests passed including scan/schema/single-parse and new regressions; full npm typecheck exited 0.
WASM build via pwsh -NoProfile -File build.ps1 exited 0; tracked status shows only intended annotation edit.
Exactly annotation.yaml and test/prosody-long-phrase-break.test.ts staged; standalone cached diff whitespace gate exited 0.
Next: inspect staged test, commit, inventory WASM outputs immediately before full npm test, fetch/integrate base if changed, publish PR with Closes #131; no merge.

PR #137 published at 6947fcf98840f756b91be0ce8d2703744d1ffa13 with verified Closes #131; full suite passed before publication.
Q now requests finding all midpoint consumers; this follow-up is inventory only, no removal authorized yet.
Current issue worktree HEAD remains 6947fcf98840f756b91be0ce8d2703744d1ffa13.
All tracked text search across 4942 tracked paths found 12 matching lines, only rule-engine.ts and hrg-rule-engine-scan.test.ts.
Next: inspect complete consumer tests and scan exposure for indirect uses, report production versus test consumers.

Q authorized removing obsolete engine midpoint fields and updating PR #137; no merge requested.
PR live ownership isCrossRepository=false; head 6947fcf98840f756b91be0ce8d2703744d1ffa13 and OPEN.
Replaced two midpoint-specific scan tests with singleton/long generic scan metadata cases expecting four fields via size(phrase).
Test patch complete preimage count=1 and original file uniformly LF; production still unchanged for red run.
Next: run red scan gate, remove midpoint calculation/fields/docs and unused fixture schema fields, verify and push cleanup.

Red cleanup gate: 2 scan cases failed expected 6 to be 4; then removed engine midpoint calculation, fields and obsolete comment/citation.
Removed dead test fixture mid/isMid declarations and replaced their old tests with generic context regression.
Complete tracked text scan: 4942 paths, removed_field_matches=0, git grep exit 1.
Focused 4-file suite passed; Biome processed both changed files; npm run typecheck exited 0; scoped diff inspected.
Next: whitespace/stage/commit cleanup, full test using existing WASM artifacts, fetch base, push and update PR #137 body with removal and Closes #131.

Cleanup committed as e2ca26ec564c916a6ca1c8f3ff3c7914d5ceecc8 and pushed to PR #137.
Worktree change count 0; fetched master is an ancestor of cleanup HEAD.
PR body updated to describe removal of engine midpoint fields and retain Closes #131.
Focused regression/typecheck evidence from cleanup reused; no new source changes since those gates.
Next: verify remote head and canonical PR body, report delivery.
