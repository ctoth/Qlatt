Parent: #46. This child covers only the scope below; it does not close the parent tracker.

Use existing YAML loaders, CEL/HRG, diagnostics and provenance contracts. Cite speech policy or label engineering estimates explicitly. Preserve unrelated behavior and extending frontend declarations. Implementation requires focused failing regressions, fixes, and the applicable repository gates.

## Problem
Generated A{N} parameters in src/formant-bank.ts use a hardcoded [0, 80] dB range and 0 default. Direct calls to src/semantics/pfe-codegen.ts silently substitute ndbScale=0 and sign=1.

## Acceptance
- Add ampRange and ampDefault to each parallel formant declaration; require both whenever parallelSource is present. Reject nonfinite/reversed ranges, defaults outside the range, and parallel-only fields on cascade-only formants before expansion mutates its inputs.
- Generate A{N} parameter ranges/defaults from those declarations. Migrate every bundled bank and affected fixture, preserving current values with explicit engineering-estimate attribution.
- PFE generation rejects missing/nonfinite ndbScale and missing/invalid sign, with an identifiable error, rather than substituting acoustic coefficients. Preserve valid positive/negative-sign calculations.
- Test custom authored values, missing fields, invalid declarations, cascade-only behavior, and bundled expansion/interpreter integration.
- Document the authored amplitude contract. Bank cardinality and namespacing are excluded and remain separately tracked under #46.
