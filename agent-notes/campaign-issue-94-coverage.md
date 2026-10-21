# Issue 94: recorded rule coverage

## Goal
Add the requested corpus report using existing rule-attempt and recognition evidence. This slice does not close #94 or introduce strict lint/CI gates.

## State
Based on origin/master bbe108a7. Implemented the script, focused tests and reports/rule-coverage.md. Existing corpus shape and default path are reused. The actively written test file passed all five tests. Full report execution completed successfully across all 20 linguistic phrases and all three bundled frontends; saved its 74,070-character stdout through apply_patch. Node emitted loader/deprecation warnings before the report; no execution failure. No other local CI checks ran.

## Decisions and why
- Seed compiled named rules and phase membership so unobserved and unscheduled rules remain visible. Parser foreach directives expand effects within a rule, not independent coverage rows.
- Count recorded outcomes, not effect writes. Frame rules record deduplicated firing units only (rule-engine.ts:2777-2789); their attempt denominator and failure status stay unavailable.
- Use captureTooling on the existing detailed frontend; normalization and orthography share its utterance. Recognition outcomes come separately from text_recognition provenance, not invented RuleAttempt records.
- Zero fires means not observed in this corpus, never proof of unreachable code. The report does not reinterpret W_RULE_DEAD or ordered-writer warnings.
- Emit the report on stdout, then save through apply_patch. No report-writing shell redirection. Only dependency setup, the actively written test file and requested report execution run locally.

## Surprises
Fresh isolated worktree needed npm ci before report execution; supervisor authorized dependency provisioning. Full tooling capture took over 95 CPU seconds for the corpus. Frame evidence remains deliberately labeled as firing units rather than frame attempts.

## Next step
Commit/push the script, tests, report and note; respond to Claude review. Stop/report substantive setup, test or report failures.
