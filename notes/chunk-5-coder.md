# Chunk 5 Coder Notes

## Date: 2026-05-25
## Branch: declarative-cleanup (HEAD = 9020cfb7 chunk-4-tip)

## Task
Consolidate ndbCor, ndbScale, klsynAmpTable from src/builtin-functions.ts to YAML.
NO TS fallback. End state: builtin-functions.ts is a thin loader.

## Status: COMPLETE pending commit + report

## Changes made
1. `public/experiments/klatt80-baseline/semantics.yaml` — extended
   `constants.ndbScale` with A1..A10, added `constants.klsynAmpTable` (88-entry array).
2. `src/builtin-functions.ts` — replaced three hardcoded arrays with sync
   loader (`loadYamlDocumentSync`) reading from semantics.yaml. Throws on
   missing/invalid. Same export signatures preserved (`ndbCor`, `ndbScale`,
   `klsynAmpTable`).

## Verification

### Baseline (with my changes stashed but other agent's structural.yaml/pipeline.yaml mods present)
- 7 failed tests in 2 files: tts-frontend-snapshot (6 snapshots), tts-frontend-declarative-golden-summary (1)
- This is the "7 master-debt set" from the prompt.

### With my changes
- Same 7 failed tests in same 2 files. Identical baseline.
- All 1088 other tests pass.
- First run showed 28 transient file-level failures from cold-import — re-run clean.

### Golden test
- lf-source-wasm-compare rmsError = 0.32504812202227573 (limit ≤ 0.326) ✓
- lf-source-wasm-compare maxDelta = 0.790002666 (limit ≤ 0.791) ✓

### Deletion verification — to do
- grep 'ndbScale\\s*=\\s*\\[' src/ → only ts file has `ndbScale: Record<string, number>` assignment via `klattAmpTables.ndbScale`; no inline literal in src/.
- Need to run final grep batch and write report.

## Pre-existing modifications detected on disk (not mine)
- public/rules/frontends/qlatt-english/phases/structural.yaml
- public/rules/frontends/qlatt-english/pipeline.yaml

These are another agent's work. I will NOT touch them. Commit will be pathspec-only naming ONLY my changed files.

## Files to commit
- src/builtin-functions.ts
- public/experiments/klatt80-baseline/semantics.yaml

## Next
1. Final grep verification
2. Pathspec-only commit
3. Write report file (no auto-commit per hard-stop)
