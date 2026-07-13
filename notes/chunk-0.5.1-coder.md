# Chunk 0.5.1 — Validator tighten + edge tests (Coder notes)

2026-05-24

## State
- Branch `declarative-cleanup`, parent commit `13bd3013` (chunk 0.5).
- Working tree clean for `src/declarative-frontend/` and `test/` paths (lots of unrelated `D knowledge/claims/...` deletions outside scope — ignore).

## Done
- Edit 1+2 combined in `src/declarative-frontend/validation.ts` ~line 814:
  - Tightened object-form `when:` validator to require ONLY `predicate` key, value typeof string, length > 0.
  - Error message: "when object must be { predicate: <non-empty name> } with no extra keys".

## Observed
- Existing test file `test/declarative-frontend-dispatch-predicate.test.ts` has 1 test (not 5 as prompt states). Prompt count "167+4=171" may be off. Will verify with actual test runner.
- E_PREDICATE_UNKNOWN at `engine.ts:932` — confirmed existing error code, will reuse.
- E_CONDITION_INVALID at `engine.ts:929` for empty-string predicate name at runtime, but we now reject at validation.

## TODO
- Add 4 new tests (prev/next predicate, unknown predicate name, malformed shape rejection, empty-name rejection).
- Run vitest declarative-frontend.
- Run golden tests.
- Commit with pathspec.
- Write report.

## Risk
- Shared machine: many unrelated working-tree deletions — must use explicit pathspec on commit.

## Progress update 2026-05-24 16:58
- Validator edit applied (validation.ts ~line 814): rejects empty predicate name AND extra keys with unified error "when object must be { predicate: <non-empty name> } with no extra keys". Used `predicateValue` local for clarity.
- 4 new tests added to dispatch-predicate test file (total now 5):
  1. evaluates predicates that reference prev/next neighbors
  2. throws E_PREDICATE_UNKNOWN when dispatch when: references an unknown predicate
  3. rejects malformed predicate shape at validation time
  4. rejects { predicate: "" } at validation time
- vitest run test/declarative-frontend → 173 tests, 171 passed, 2 failed (both pre-existing slice failures in test/declarative-frontend-slice.test.ts: "materializes inserted release targets during structural phase" expected 15 got 6.475..., "preserves weak phrase-final stop timing through duration locking" expected 15 got 5). Matches prompt's hard-baseline expectation 171 pass / 2 pre-existing fail.
- Golden tests exited with code 1 BUT this is the locked baseline: lf-source-wasm-compare rmsError=0.32504812... ≤ 0.326. The script exits non-zero because there's a residual failure but it's within the locked baseline ceiling. Prompt says "locked baseline: 1 failure lf-source-wasm-compare rmsError ≤ 0.326". Result matches baseline.

## Next
- Pathspec commit for validation.ts + dispatch-predicate.test.ts only.
- Write report file.
