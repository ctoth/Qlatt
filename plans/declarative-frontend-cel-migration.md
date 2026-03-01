# Declarative Frontend CEL Flag-Day Plan

## Non-Negotiable Constraint

This is a **flag-day cutover**.

1. No dual runtime.
2. No compatibility flag.
3. No staged JSONata/CEL coexistence in `main`.
4. One integrated change set lands together and switches the declarative frontend to CEL + typed cursor.

## Scope

Replace JSONata + function navigation with CEL + typed cursor across the declarative frontend runtime, validation, rulepack, tests, and public entrypoints.

## Current Gaps (Audit)

1. JSONata evaluator: `src/declarative-frontend/expressions.ts`.
2. Function-driven navigation context in engine: `src/declarative-frontend/engine.ts`.
3. No `define` normalization: `src/declarative-frontend/parser.ts`.
4. Validator still emits `E_JSONATA_INVALID`: `src/declarative-frontend/validation.ts`.
5. Default rulepack is JSONata-based: `src/declarative-frontend/rule-pack.ts`.
6. Entrypoint defaults still tied to v11 rulepack: `src/declarative-frontend/index.ts`.
7. Tests include JSONata and `$...` navigation syntax.

## Flag-Day Change Set (Single PR)

### 1) Runtime

1. Replace JSONata expression backend with CEL backend.
2. Introduce typed cursor context materialization (`current`, `prev`, `next`, hierarchy fields, `current_index`).
3. Remove runtime registration of deprecated navigation functions (`parent`, `children`, `spanning`, `prev`, `next`, etc. as callable helpers).
4. Keep only v12 CEL function surface:
   - `midpoint`
   - `at_ratio`
   - `at_sync`
   - `prev_point`
   - `total`
   - `target`
   - optional `assoc` only if required by rules

### 2) Rule Evaluation Semantics

1. Implement rule-level `define` evaluation once per firing, top-to-bottom.
2. Bind `define` outputs into all expression fields in that firing (`constraint`, `apply`, `splice`, `insert_point`).
3. Preserve deterministic match/apply ordering.

### 3) Parser + Validation

1. Parse/normalize `define`.
2. Switch expression syntax validation to CEL.
3. Rename diagnostic `E_JSONATA_INVALID` -> `E_CEL_INVALID`.
4. Enforce v12-oriented static checks where practical:
   - unknown identifiers/functions
   - bad stream names for `total()` / `prev_point()`
   - undeclared features/scalars from stream schemas

### 4) Rulepack

1. Rewrite `src/declarative-frontend/rule-pack.ts` fully to CEL syntax.
2. Replace JSONata let-bindings with `define`.
3. Resolve velar double-lookahead case with explicit v12-compatible approach (prefer pattern-based rewrite).
4. Rename/export v12 rulepack constant and wire it as default.

### 5) Tests + Tooling

1. Update all declarative-frontend tests to CEL syntax and v12 diagnostics.
2. Replace JSONata-only test file semantics (current `declarative-frontend-jsonata.test.ts`) with CEL behavior tests.
3. Update CLI/tooling expectations (`scripts/tts-dsl.ts`, `src/declarative-frontend/tooling.ts`) only where diagnostics/messages changed.
4. Ensure existing public behavior contracts still hold (run/validate/explain/why-not/diff).

### 6) Dependency Cleanup

1. Remove JSONata runtime usage from declarative frontend code.
2. Remove `jsonata` from `package.json`.

## Files Expected in the Flag-Day Diff

1. `src/declarative-frontend/engine.ts`
2. `src/declarative-frontend/parser.ts`
3. `src/declarative-frontend/validation.ts`
4. `src/declarative-frontend/rule-pack.ts`
5. `src/declarative-frontend/index.ts`
6. `src/declarative-frontend/expressions.ts` (deleted/replaced)
7. `src/declarative-frontend/cursor.ts` (new)
8. `src/declarative-frontend/cel-expressions.ts` (new)
9. `scripts/tts-dsl.ts` (if diagnostics/output text changes)
10. `test/declarative-frontend*.test.ts`
11. `package.json`

## Merge Gates (All Must Pass Together)

1. Declarative-frontend test suite fully green.
2. No `jsonata` imports in `src/declarative-frontend`.
3. No `E_JSONATA_INVALID` in runtime/validator/tests.
4. Default `runDeclarativeFrontend` path uses CEL-native v12 rulepack.
5. CLI contract tests remain green.

## Risk Notes

1. Rulepack behavior drift is the highest risk.
2. Typed cursor parent resolution must be validated at boundaries.
3. Point ordering with `prev_point` must remain deterministic.
4. Phrase-relative helper policy (`phrase_index` / `phrase_total`) must be chosen and applied consistently in runtime + validation + rulepack in the same PR.

