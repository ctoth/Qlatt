# Code review notes: formant-bank contract branch

## Scope and state

- Reviewing `HEAD` (`96a042a7`) against merge base `e7ea6d3b5a496f3e29d04104656c64230885d6dd`.
- Changed production areas: formant-bank Zod validation/expansion, PFE rule compilation, topological-order caching, and bundled graph declarations.
- Existing unrelated untracked files were left untouched.

## Observations

- Targeted changed-area tests passed (38 tests), and core/audio/scripts TypeScript checks passed.
- The full suite's fricative-heavy runtime-output-level case fails at peak `1.9502713680267334 > 1.05`; the same test also fails at the merge base (`1.7594326734542847 > 1.05`), so the failure is pre-existing and is not currently a review finding.
- Considered the `TopologicalEvaluator` cache keyed by `semantics.realize` object identity. Repository runtime/interpreter lifecycles expand the document before creating their evaluators and do not mutate rules afterward; the change explicitly adopts that compiled-document invariant, so no actionable repository regression was established.
- Schema/contract validation has been inspected for generated node, parameter, realization, and connection-reference collisions. No confirmed defect recorded yet.

## Blocker / next action

- No blocker. Review is complete with no confirmed introduced finding; return the required JSON verdict without treating the merge-base output-level failure as branch-caused.
