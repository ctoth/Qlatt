# Issue 95: lowered parameter query

## Goal
Expose --why-param P --at ms through the existing lowered-frame ancestry query. Keep scheduled/interpolated/realized value tracing explicitly outside this slice.

## State
Implemented on isolated branch from 505b0b2e: helpers consume existing frame provenance; CLI query reports layer/time/value and selects ancestry for existing renderers. Focused real-vowel, endpoint/missing-parameter, output-label and argument fixtures added. PR437 is published. Claude completed two passes over the initial seven-file range with no source-grounded findings; accepted. Transcript155a6ed1-c5ff-47d3-90d9-c4c5bbbf10e1, exec99457. Root reviews the subsequent fixture/formatting delta and owns the ledger. No local CI.

## Decisions and why
Smallest change: about 10 helper lines, 35–50 CLI lines and 40–60 existing-test lines plus flag docs. Narrow helper inputs to the fields they consume, and use the frame's existing provenance object rather than adding a second returned lowerer payload. Reuse current selection and renderers; include lowered layer, requested milliseconds, selected frame time and value. Preserve earliest-frame selection before the first frame and final-frame selection after the last frame; correct comments that imply a bounded coverage interval. Preserve other agents' TTS/compiler edits; no changes to those modules.

## Surprises
Hosted quality job119224627011 found two test formatting reflows; corrected exactly. Supervisor identified that the ancestry fixture compared IDs from independent runs; it now captures the actual CLI frontend result with the existing spy pattern and checks that run's frame/value/provenance. A prior run only chooses an interior vowel time. Full #95 remains open for scheduled ancestry, citation links and cross-run diffs.

## Next step
Wait for final-head hosted CI and root verification/merge. Reviewer's compact-text observation was explicitly unverified and describes the existing --why selection; no speculative new behavior added. Reviewer could not execute explain because this worktree lacks ts-node; no install or local CI occurred. Replacement formatting job119225434299 requested only the captured ReturnType wrap, applied in3f4de286.
