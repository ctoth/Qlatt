# Issue 209: resource-owned YAML LTS input policy

## Goal
Move case, boundary, category and marker choices to the existing cited YAML LTS resource and report unmatched original input through the frontend diagnostics collector.

## State
Implemented on isolated branch from 505b0b2e: existing cache now owns validated input policy, scalar mapping preserves original offsets, both resource acquisition callbacks validate, and pronunciation forwards the existing diagnostics collector. Existing fixture files cover policy variants, load-time rejection, Beauty identity and real transcription. No local CI. Other agents own unrelated schema/resource work; preserve their edits.

## Decisions and why
Smallest plan: 140–190 production lines, 15–20 YAML lines and 100–140 existing fixture lines. Extend the existing document-keyed cache with validated policy category/marker maps; use the same parser in sync/async resource owners and direct engine calls. Unicode scalar case mapping is an explicit engineering convention, with original word UTF-16 offsets retained across expansion. One warning per affected word, no warning for generated boundaries. Dictionary/morphology/DECtalk behavior and HRG symbol normalization stay owned by their existing paths.

## Surprises
The issue's two YAML tables are stale: only languages/english/lts-rules.yaml remains tracked; Beauty inherits it, and DECtalk uses a separate JSON/table engine.
Hosted quality 119230344870 found formatting reflows in the engine and two fixture files; applied the emitted changes. No behavior failure was reported by that job.
Hosted shard 1 job 119233265694 then exposed an old async-owner fixture using only `version: fixture` as its LTS document. Required policy validation correctly rejected that before the intended missing morphology phonotactics resource. The fixture now serves the actual bundled YAML; its nested-error assertion and blocking-request assertion are unchanged. No runtime validation was weakened.

## Review response
Claude completed two passes over all nine files at initial 8c41d64a with no source-grounded defects; accepted. Transcript 52a4b631-c690-4c42-bf54-47ac2d6f9d0d, exec 54960. Cosmetic note spacing corrected. The report's CI paragraph names the initial head incorrectly: initial quality failed formatting; replacement 55ec5b7a passes quality/native/node while shards remain pending. Source review did not execute programs or local CI; hypothetical observations were explicitly not findings. Root independently reviews the formatter delta and owns the gate.

## Next step
PR 438 published and review response recorded. Monitor final-head hosted CI, then await root verification and merge.
