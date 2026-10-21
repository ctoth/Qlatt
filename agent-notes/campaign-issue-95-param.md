# Issue 95: lowered parameter query

## Goal
Expose --why-param P --at ms through the existing lowered-frame ancestry query. Keep scheduled/interpolated/realized value tracing explicitly outside this slice.

## State
Implemented on isolated branch from 505b0b2e: helpers consume existing frame provenance; CLI query reports layer/time/value and selects ancestry for existing renderers. Focused real-vowel, endpoint/missing-parameter, output-label and argument fixtures added. No local CI; hosted PR checks and private Claude review follow publication.

## Decisions and why
Smallest change: about 10 helper lines, 35–50 CLI lines and 40–60 existing-test lines plus flag docs. Narrow helper inputs to the fields they consume, and use the frame's existing provenance object rather than adding a second returned lowerer payload. Reuse current selection and renderers; include lowered layer, requested milliseconds, selected frame time and value. Preserve earliest-frame selection before the first frame and final-frame selection after the last frame; correct comments that imply a bounded coverage interval. Preserve other agents' TTS/compiler edits; no changes to those modules.

## Surprises
Hosted quality job119224627011 found two test formatting reflows; corrected exactly. Supervisor identified that the ancestry fixture compared IDs from independent runs; it now captures the actual CLI frontend result with the existing spy pattern and checks that run's frame/value/provenance. A prior run only chooses an interior vowel time. Full #95 remains open for scheduled ancestry, citation links and cross-run diffs.

## Next step
PR437 is published. Inspect replacement hosted CI and obtain Claude review (exec99457). Root owns the review ledger and merge. No local CI run.
