# Issue 94: full-run citation checking

## Goal
Make explain's strict-citations exit status independent of display filters. This is one bounded slice of #94; keep that issue open for coverage, corpus and lint work.

## State
Started from merged #104 at 18810328. Implemented a separate full-run citation summary and updated both documentation references. Existing CLI test covers stage, range, empty subject window and ancestry selections, each with an uncited fixture and non-strict control. No new API or validation framework. Tests have not been run locally; hosted CI owns validation.

## Decisions and why
- scripts/explain-phrase.ts captures allDecisions before filtering but currently gates on payload.summary after filtering. Compute a separate summary from allDecisions for strict checking; preserve displayed decisions and summary.
- Test hidden uncited decisions and an empty selected window by wrapping the real frontend in a scoped Vitest spy and adding one uncited decision to its existing collector. Restore the spy; preserve non-strict behavior. No production injection API.
- Update AGENTS.md and docs/README.md together after #104, whose deliberately accurate old filtered-window wording would otherwise become stale.
- Do not implement coverage/lint/CI scope in this slice. Existing ordered-writer warnings need source-backed disposition, and Frame attempt reporting currently omits failed attempts.

## Surprises
None in this slice. No local CI steps run.

## Next step
Commit/push/open a PR referencing #94 without closing it, then respond to Claude review. Hosted CI owns validation.
