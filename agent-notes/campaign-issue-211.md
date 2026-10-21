# Issue 211: selected transcription conventions

## Goal
Move compound recovery, dictionary candidate conventions, empty-pronunciation timing, diagnostic delimiters and remaining pronunciation-layer attribution to the existing selected frontend transcription declaration.

## State
PR435 published at 2d43cbb7; formatting response4e06b6ad and fixture typing6f93b8c9. Claude Opus5.5 reviewed the full eight-file range36953f15..6f93b8c9 in two passes (3 initial findings, 0 new). Transcript: C:/Users/Q/.claude/projects/C--Users-Q-code-Qlatt-campaign-211/0ace32f0-960f-4543-b051-4cd4f06310c5.jsonl. Accepted the already-fixed fixture typing finding and two attribution wording corrections. Root owns the review ledger. No local CI or test run.

## Decisions and why
Smallest full change: roughly 160–220 production/type/forwarding lines, 55–80 YAML lines and 130–180 focused fixture lines. Reuse requireTranscriptionTables and transcription.sources. Keep CMU candidate order and original-case alternate fallback exactly; preserve DECtalk's separate written-apostrophe path. Compound policy is independent of that path. Existing empty-pronunciation warning and direct source parents remain; no new collector or policy service. Number/phonemic attribution is required only when the actual selected LTS table supports those producers.

## Surprises
The TTS caller explicitly projects transcription fields, so new fields must be forwarded there. The #141 agent owns only resource acquisition/import/type/call hunks, coordinated separately; preserve those changes when branches merge. Existing bundled Beauty inherits transcription from Qlatt.

Review response: C ls_task.c:2161 performs lookup, so the disabled compound policy is now explicitly preserved engineering compatibility, with that reference limited to lookup-as-written. Moved the previously recorded say.exe apostrophe observation to dictionary_candidates and left the flag comment on strip-on-miss only. No oracle was run and no historical observation is claimed as newly verified. The final source/parent behavior remains unchanged; exact-head CI supplies validation.

Integrated master after #433 merged fd8710d1: retained the unified rulepack resource owner/imports, resolveFrontend TTS caller and required TranscriptionOptions.resources. Resolved the empty-pronunciation test conflict by keeping both configured timing coverage and the required resolved resources; added resources to the new DECtalk fixtures that did not exist on the other branch. No local CI.

## Next step
Push this attribution-only review response and monitor its hosted CI. Supervisor owns final source verification, merge and issue closure.
