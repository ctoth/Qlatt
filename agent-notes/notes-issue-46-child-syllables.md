Parent: #46. This child covers only the scope below; it does not close the parent tracker.

Use existing YAML loaders, CEL/HRG, diagnostics and provenance contracts. Cite speech policy or label engineering estimates explicitly. Preserve unrelated behavior and extending frontend declarations. Implementation requires focused failing regressions, fixes, and the applicable repository gates.

## Problem
src/tts-frontend.ts:createStructure still substitutes nucleus counting when syllabification tables are absent, assigning every role onset and only/medial positions. DECtalk declares tables; Qlatt relies on the fallback.

## Acceptance
- Every bundled frontend supplies or inherits cited syllabification tables consumed by the existing syllabifyWord implementation. Author Qlatt phone mappings against its own inventory; do not blindly copy incompatible DECtalk symbols.
- Require valid tables when loading an executable frontend, in synchronous and asynchronous paths. Keep low-level programmatic rule fixtures independent of unrelated frontend resources.
- Remove the fallback and preserve shared Word/Syllable/Segment identity and source ancestry.
- Test multisyllabic words, onset/nucleus/coda roles, first/medial/last/only positions, missing/malformed tables, and inherited qlatt-beauty loading. Include a second word so local phone indexing cannot accidentally read the first word's segments.
- Identify intended annotation corrections explicitly; run affected input-anchor, schema, single-parse and frontend regressions.
