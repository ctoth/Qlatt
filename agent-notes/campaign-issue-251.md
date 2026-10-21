# Issue 251: recursive backend inheritance, first slice

## Goal
Resolve all ancestors and merge nested constants correctly in the existing loader.
This slice leaves #251 open: harness consolidation, URL/resource ownership,
origins/override serialization and relocation remain outstanding.

## State
Read loader, existing tests, semantics types and evaluator consumers at 18810328.
Smallest change: approximately 80–150 production lines, extending existing loader
recursion and constants types; focused fixtures in test/load-experiment-config.test.ts.
No new cache, protocol, asset fields or browser harness changes.
Implemented recursive resolution and constants folding; fixtures cover three
generations, whole-entry replacements, absent intermediate documents, arrays/null,
CEL consumption, source isolation, identity errors and realize_each ordering.
Local tests/CI were not run; this fresh worktree has no installed dependencies.

## Decisions and why
Load manifest once, validate IDs, then resolve each single-parent chain bottom-up.
Keep params/realize/primitives whole-entry replacement and graph whole-document
replacement. Constants merge recursively only when both operands are plain maps;
arrays, null and scalars replace. Keep existing per-document realize_each expansion.
Return detached data so callers cannot mutate documents retained by a loader.

## Surprises
Malformed/empty optional YAML already throws; preserve the existing loader errors.
Worklet filenames also identify processors, so resource migration is excluded.

## Next step
Commit/push PR for CI and Claude review, then respond to review findings.
Do not claim full #251 completion or self-merge.
