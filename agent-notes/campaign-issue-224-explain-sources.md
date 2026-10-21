# Issue 224: explain compiled definition sources

## Goal
Expose existing source spans and macro parents alongside whole compiled rule/pattern definitions in --why output.

## State
Implemented on isolated branch from d557b403. Existing ruleExpressions now carries matching compiled rule/pattern source entries and their macro parents. Existing CLI cases cover rule/pattern sources, plus fired vocal_effort in "hello world" for the has_voiced_formants call-site/body relationship. No local CI run.

## Decisions and why
Smallest approved change: add matching existing DiagnosticDocumentSpans to ruleExpressions using compiledPath ?? value.path and the actual committed transaction ruleId/named pattern. About 12–20 production lines plus 25–40 existing fixture lines. Preserve the whole-definitions/not-selected-branches label. This is source navigation, not executed-literal completeness. No effect tracing, DecisionRecord fields, collector, compiler or new source index.

## Surprises
None. Other agents own compiler/package work; preserve their edits.

## Next step
Publish, obtain full private Claude review and respond. Hosted CI only; root owns gate/merge. Execution-source identity and checked artifact work remain separate.
