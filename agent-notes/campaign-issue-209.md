# Issue 209: resource-owned YAML LTS input policy

## Goal
Move case, boundary, category and marker choices to the existing cited YAML LTS resource and report unmatched original input through the frontend diagnostics collector.

## State
Implemented on isolated branch from505b0b2e: existing cache now owns validated input policy, scalar mapping preserves original offsets, both resource acquisition callbacks validate, and pronunciation forwards the existing diagnostics collector. Existing fixture files cover policy variants, load-time rejection, Beauty identity and real transcription. No local CI. Other agents own unrelated schema/resource work; preserve their edits.

## Decisions and why
Smallest plan:140–190 production lines,15–20 YAML lines and100–140 existing fixture lines. Extend the existing document-keyed cache with validated policy category/marker maps; use the same parser in sync/async resource owners and direct engine calls. Unicode scalar case mapping is an explicit engineering convention, with original word UTF-16 offsets retained across expansion. One warning per affected word, no warning for generated boundaries. Dictionary/morphology/DECtalk behavior and HRG symbol normalization stay owned by their existing paths.

## Surprises
The issue's two YAML tables are stale: only languages/english/lts-rules.yaml remains tracked; Beauty inherits it, and DECtalk uses a separate JSON/table engine.

## Next step
Publish for hosted CI and private Claude review. Root owns ledger and merge.
