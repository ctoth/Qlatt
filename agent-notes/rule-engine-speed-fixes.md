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
- "Before" corpus hash done on the unedited base: scratchpad `hash-base-652f4330.tsv`
  (3668 texts, 11004 lines, 5 errors; 10m36s with 12 jobs).
- PR A edits written (uncommitted): `hrg/rule-engine.ts` (policy projection memo), `cel-expressions.ts`
  (`cachedRegex`, also used by `matches` and `regexSplit`), `hrg/item.ts` (`fitFeatureValue`), and new tests in
  `test/hrg-schema.test.ts`, `test/normalization-lexical.test.ts`, `test/hrg-rule-engine-select.test.ts`.
  The new tests pass on the edited tree AND on the exported base sources (20/20 each), so they pin old behaviour.
- PR A measured so far (uncommitted tree):
  - `npm run typecheck` exit 0. `npm run check` exits 1 in this worktree only because biome also reads the
    untracked `scripts/tmp-*` probes (all 22 errors are in them); over `git ls-files` it reports 0 errors and
    1 warning (`scripts/frication-spectrum.ts`, not touched).
  - Side by side, `scripts/tmp-ab-run.ts --count 39 --passes 5`, base export vs worktree, two rounds:
    wall min 214.0 -> 190.9 ms/phrase and 214.3 -> 193.3; cpu min 253.6 -> 238.4 and 249.2 -> 235.6;
    tracks sha1 78042f98d3d7 and 14713 transactions in all four runs.
  - Targeted tests: 53 files, 515 tests passed (hrg-*, schema, single-parse, tone-association-compatibility,
    dectalk-frame-gate-1, declarative-frontend-cel-*, normalization-lexical, normalization-validation,
    dectalk-commands-exact, dectalk-commands-inside-text).
  - Corpus compare base vs PR A: 11004 lines, 0 differing in every column; files byte-identical
    (`engine-speed/hash-pr-a.tsv`).
- PR A DONE: PR #317, head b9978aaf, pushed, not merged; team lead messaged with the numbers.
- PR B: not started in code. Branch `lazy-rule-definitions` to be cut from b9978aaf.

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
