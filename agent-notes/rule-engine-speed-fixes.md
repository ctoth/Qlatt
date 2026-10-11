# Rule engine speed fixes (two PRs)

## Goal
Land the four changes the DECtalk phrase profile measured (see `dectalk-phrase-profile.md`):
- PR A `engine-local-speedups` (base 652f4330): memoize `projectPolicyValues`, cache the `regexReplace` RegExp,
  non-throwing union validation in `hrg/item.ts`. No behaviour change; corpus hashes identical in every column.
- PR B `lazy-rule-definitions` (on A's head): a rule's `define:` entries evaluated on first read. Decisions
  column changes by design (parents = reads made); tracks, frames, diagnostics, messages identical.
Worktree: `C:\Users\Q\code\Qlatt-dectalk-phrase-profile`. Neither PR is merged by me.

## State
- Branch `engine-local-speedups` created at 652f4330, `npm ci` done.
- "Before" corpus hash running on the unedited base: scratchpad `hash-base-652f4330.tsv` (about 20 min).
  No edits to the tree until it finishes.

- Base sources exported with `git archive` to scratchpad `engine-speed/base` for side-by-side timing
  (`tmp-ab-run.ts` run from there against the worktree's run; no git state touched).

## Decisions and why
- Take the before-hash in the same worktree before editing (no `git stash`, no second worktree).
- PR A designs (decided from reading, not yet written):
  - `projectPolicyValues`: WeakMap per input object at every level, but only for deeply frozen inputs (compiled
    rulepacks are frozen by `freezeRecursively`; `mergedPolicy` in tts-frontend.ts makes fresh top levels each
    call that share the spec's frozen subtrees, so a top-level-only memo would miss). Memoized results frozen.
  - regex: one cache keyed flags -> pattern (two maps, so no separator collision); `lastIndex = 0` before
    `replace`, because a cached sticky regex keeps it.
  - union: one walker returning a REJECTED sentinel; path and expected text built only on a second walk made
    when the value is rejected. Keep `in` check so sparse arrays behave as `map` did.
- PR B plan: `evaluateRuleDefinitions` -> `context.defineLazily`; then `constraintFailsOnTrial`, the `trial`
  option and TRIAL_REFUSED are redundant (the real context is lazy) and go. `test/hrg-rule-engine-definitions.test.ts`
  pins the old counts and parents and must change.

## Surprises
- Load validation puts every `define:` name in scope of every define expression: forward references and names
  that shadow `current`/`phrase`/bindings are not rejected. Eager and lazy differ for those; the bundled
  rulepacks must be checked for both before PR B (script).
- `projects/declarative-frontend/spec.md` 2.8 and Part 6 say define is evaluated once per firing, top to bottom.

- `scripts/tmp-define-order.ts` (throwaway, never commit) over the three bundled rulepacks at 652f4330:
  255 define blocks, 3335 entries, 0 forward/self references, 0 names shadowing a context name. Detector has
  no positive control yet (add a count of backward references before quoting it).

## Next step
Wait for the base hash; then edit PR A's three files.
