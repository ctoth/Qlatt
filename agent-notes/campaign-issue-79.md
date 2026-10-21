# Issue 79: relocate rendering implementations

## Goal
Move library rendering implementations from scripts/rendering into src/rendering.

## State
Started from origin/master 2ca6220a after #81 merged. Separate campaign/issue-79 worktree. Seven modules moved with apply_patch, their imports and callers updated, and current documentation paths corrected. A source search found no remaining scripts/rendering references in scripts, test, src, or docs. No local CI checks were run.

## Decisions and why
Smallest complete change: move the seven existing modules, update relative imports and actual callers, and correct current documentation paths. Approximately 60-90 changed lines plus file moves. browser-runtime uses browser-session, so the shared session moves too; dectalk-vtm-render is the remaining library rendering module in the old directory. Preserve all behavior, including resource caching and disposal. No wrappers, new APIs, request options, tests, or guards. PR CI performs validation; no local CI duplication.

## Surprises
Current source has additional oracle/browser-session and DECtalk VTM callers beyond the original issue inventory. Include them in the same path migration.

## Next step
Commit/push and open a PR closing #79. Await PR CI and Claude review, respond to findings, and record any validation limitations; supervisor owns merge.
