Duration rounding depended on the field name, and Klatt resolution selected linguistic fallback ratios in TypeScript. Rounding now follows declared millisecond units for all numeric operations. A cited scalar `floor_fallback` CEL expression supplies the floor only when the declared per-phone floor is unavailable, including writes before the duration phase.

Fallback reads and citations flow into transaction provenance, and committed diagnostics include the requested value, applied result and effective floor. Scalar validation checks floor fields, CEL references and citations. Both qlatt-english and its beauty frontend declare the policy.

Closes #206

Validation:
- TDD: observed failures for unrounded duration, undeclared floor fields and fallback evaluation on the wrong pattern target; regressions pass after fixes.
- 159 focused tests pass, including schema/inherited single-parse checks, Klatt duration controls, provenance and rollback. Additional rounding checks cover set/add/mul/min/max.
- WASM build, TypeScript, Biome and production build pass.
- Full `npm test`: 1,861 passed, one failed (215 files). The sole failure is the area-formants CLI inventory-hash snapshot, reproduced unchanged on detached base 867552c5. The expanded numeric-operation test also passes separately.

