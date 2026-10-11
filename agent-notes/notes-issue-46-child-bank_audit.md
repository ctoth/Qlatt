Parent: #46. This child covers only the scope below; it does not close the parent tracker.

Use existing YAML loaders, CEL/HRG, diagnostics and provenance contracts. Cite speech policy or label engineering estimates explicitly. Preserve unrelated behavior and extending frontend declarations. Implementation requires focused failing regressions, fixes, and the applicable repository gates.

## Scope
Read-only design audit of src/formant-bank.ts's exactly-one-bank check. Generated names such as F1, A1 and cascadeF1 currently share a namespace. Removing the check alone risks collisions.

## Deliverable and acceptance
- Trace generated node/parameter/rule names and all consumers; demonstrate the collision behavior for two banks using concrete source references or a disposable probe.
- Distinguish an acoustic policy restriction from a compiler naming constraint. Record the compatibility cost and required ownership of any namespace change.
- Produce a reviewable recommendation for retaining/documenting the constraint or adding multiple banks, with a complete proposed naming/caller migration contract if expansion is recommended.
- This issue delivers an audit only. It does not authorize a namespace redesign, and closing it does not complete the bank-cardinality item in #46. Record the adopted decision and any implementation follow-up in the parent before that item is checked off.
