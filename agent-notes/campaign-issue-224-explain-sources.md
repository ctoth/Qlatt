# Issue 224: explain compiled definition sources

## Goal
Expose existing source spans and macro parents alongside whole compiled rule/pattern definitions in --why output.

## State
PR #468 published from d557b403. Existing ruleExpressions now carries matching compiled rule/pattern source entries and their macro parents. Existing CLI cases cover rule/pattern sources, plus vocal_effort in "hello world" for the has_voiced_formants call-site/body relationship. Hosted execution is pending; no local CI run.

## Decisions and why
Smallest approved change: add matching existing DiagnosticDocumentSpans to ruleExpressions using compiledPath ?? value.path and the actual committed transaction ruleId/named pattern. About 12–20 production lines plus 25–40 existing fixture lines. Preserve the whole-definitions/not-selected-branches label. This is source navigation, not executed-literal completeness. No effect tracing, DecisionRecord fields, collector, compiler or new source index.

## Surprises
None. Other agents own compiler/package work; preserve their edits.

## Next step
Private review and implementer response complete. Await hosted CI and root gate/merge. Execution-source identity and checked artifact work remain separate.

## Review response
Accepted Claude Code Opus5.5's no-findings review of the complete three-file d557b403...601ed25b range, matched to the GitHub PR and read twice. Transcript6bbd42cf-e49f-4346-93e5-5e098ab2746d.jsonl, session30317. Source matching, compiled-path projection and actual macro/pattern declarations were inspected. No code correction was requested. Limits remain explicit: whole indexed definitions, not selected branches or all executed literals; predicates/functions appear only through existing indexed parents. The independent fixture assertions cover the macro call-site/body identity and pattern presence; hosted CI establishes whether the phrase commits the expected rule. Reviewer made no writes or local executions.
