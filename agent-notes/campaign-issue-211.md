# Issue 211: selected transcription conventions

## Goal
Move compound recovery, dictionary candidate conventions, empty-pronunciation timing, diagnostic delimiters and remaining pronunciation-layer attribution to the existing selected frontend transcription declaration.

## State
PR435 published at 2d43cbb7; formatting response4e06b6ad. Replacement quality119212884031 passed formatting, then caught seven fixture typing errors: parsed config fields are unknown and parents optional. Typed the fixture at its config boundary and retained parent assertions with optional indexed access. Private Claude full-range review active (exec19736). No local CI or test run.

## Decisions and why
Smallest full change: roughly 160–220 production/type/forwarding lines, 55–80 YAML lines and 130–180 focused fixture lines. Reuse requireTranscriptionTables and transcription.sources. Keep CMU candidate order and original-case alternate fallback exactly; preserve DECtalk's separate written-apostrophe path. Compound policy is independent of that path. Existing empty-pronunciation warning and direct source parents remain; no new collector or policy service. Number/phonemic attribution is required only when the actual selected LTS table supports those producers.

## Surprises
The TTS caller explicitly projects transcription fields, so new fields must be forwarded there. The #141 agent owns only resource acquisition/import/type/call hunks, coordinated separately; preserve those changes when branches merge. Existing bundled Beauty inherits transcription from Qlatt.

## Next step
Commit and publish the scoped change, inspect hosted CI and request full-range private Claude review. Supervisor owns merge and issue closure.
