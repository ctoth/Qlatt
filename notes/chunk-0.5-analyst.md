# Chunk 0.5 Analyst — Notes

## 2026-05-24

### Task
Analyze commit `13bd3013` (Chunk 0.5: support `{ predicate: name }` in dispatch when:). Branch `declarative-cleanup`. Write `reports/chunk-0.5-analyst.md`.

### Read so far
- prompts/chunk-0.5-analyst.md
- reports/chunk-0.5-coder.md
- The commit diff (engine.ts +14, validation.ts -1)
- test/declarative-frontend-dispatch-predicate.test.ts
- engine.ts:897-967 — `evaluateConditionInContext` closure (the one now exposed via NavigationBundle)

### Key facts observed
- Validator (validation.ts:811-820): three-way check —
  - `isPlainObject(row.when)` → require `{ predicate: <string> }` exact shape (single key, string value). Other shapes rejected.
  - String → existing CEL syntax check.
  - Else → E_RULE_EXPRESSION_INVALID.
- Engine evaluateActionExpression (engine.ts:1507): early-return branch detects single-key `{predicate: string}` and routes to `navigation.evaluateConditionInContext`.
- evaluateConditionInContext (engine.ts:897-967) already handles predicate/expr/all/any/not, throws E_PREDICATE_UNKNOWN when predicate name missing from library.
- Test: covers predicate=true (S), predicate=false (AA non-fricative, Z voiced fricative). Does NOT test `prev`/`next` references, does NOT test full-default-fallthrough.
- Coder reported 2 pre-existing failures in `declarative-frontend-slice.test.ts` (materializes inserted release targets / preserves weak phrase-final stop timing).

### Probes still to do
1. Edge cases on validator + engine for malformed `{predicate: ...}` (extra keys, non-string, null, empty, undefined name).
2. Other callers of NavigationBundle (search engine.ts for evaluateConditionInContext usage).
3. Read the 2 failing slice tests, check conceptual intersection with this change.
4. Run vitest declarative-frontend suite, confirm exactly 2 failures.

### Current state
Mid-probe. About to investigate edge cases.
