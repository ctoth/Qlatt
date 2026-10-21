# Requested attributes on supplied graphs (#261)

## Goal
Expose memoized requests for existing compiled rule definitions on supplied typed
HRGs using the existing CEL evaluator, with immutable actual-read evidence.

## State
Implementation authorized by the campaign supervisor from origin/master 36953f15.
Checked definition selection, request-local caches/read evidence, monotonic mutation
generation and focused fixtures are implemented. No local CI or local tests run.
Initial estimate: 465–625 production lines and 180–240 focused fixture lines.

## Decisions and why
- Compile selected existing define expressions with the existing CEL AST/checker;
  retain typed definition paths, source spans, and honest inferred CEL types.
- Permit pure catalog operations and bounded graph readers; do not demand-run
  vocabulary, inventory materialization, controller state, or diagnostic kernels.
- Cache within one request/artifact/environment and committed graph generation.
  Generations never repeat, including rollback. Block reads across the entire
  atomic apply/undo lifetime, not only UndoLog.capturing.
- Capture executed reads, missing lookups, and child definition evidence. Values
  and evidence must not retain live Item views. Values-only caches are separate.
- Preserve production transaction, Frame, scalar, journal, and diagnostic behavior.
  PR256 and dirty main documentation are outside this task.
- Compiler success identities are recorded only after existing assertValidSpec;
  freezing or a TypeScript alias alone cannot mint a checked definition handle.
- Reuse existing policy projection and overlay helpers without changing semantics.
- The initial pure graph surface is path/assoc/ahead/behind and anchor constructors.
  Anchor evidence records authored anchor values; it does not claim resolved-time
  dependencies for helpers that do not read resolved mark times.

## Surprises
UndoLog.rollback clears capturing before running inverses; a separate atomic
lifetime is necessary for committed reads. Detached Items share the stamper but
must not become cached committed graph inputs.
Initial hosted quality job119207414923 reported formatting in five authored
files. Applied the formatter layout through apply_patch; its truncated diagnostic
required obtaining formatted stdout only. No local checks or formatter writes.
Claude full-PR review is running in session b47a09cf-295e-4b57-a381-23eecb34ce89.
Initial test shard3 job119207509989 rejected every fixture because its definition
name `optional` collides with CEL's registered optional namespace. Renamed that
fixture definition to `missingValue`; production namespace validation unchanged.

## Next step
Publish for hosted CI and independent Claude review; correct actual findings and
record the implementer response. Counts/timing are a supplied-graph fixture only,
not evidence of production speedup or the final browser performance gate.
