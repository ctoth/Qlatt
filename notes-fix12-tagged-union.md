# Fix 12: Tagged Union Bindings - Foreman Notes

## Goal
Replace the fragile triple-partition of bindings (realizedBindingsList, passthroughBindingsList, rampBindingsList) in klatt-interpreter.ts with a single CategorizedBinding[] using a tagged union discriminant.

## Evidence
Scout report at reports/scout-architecture-review-issues.md, Issue 7:
- Three lists at lines 235, 247, 258
- Mutual exclusion logic spread across lines 219-266
- Consumed in compileSchedule at lines 412, 420, 431/439

## Status
- [x] Tests written and passing (2 new tests in binding categorization describe block)
- [x] Refactor complete (CategorizedBinding tagged union, single allBindings list, switch in compileSchedule)
- [x] All 166 tests pass (11 pre-existing failures unrelated)
- [x] Committed: 047ea2d
- [x] Report written: reports/fix12-tagged-union-bindings.md
