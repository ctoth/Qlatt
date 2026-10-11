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
- PR B: branch `lazy-rule-definitions` cut from b9978aaf. Edits written, uncommitted:
  - `hrg/rule-engine.ts`: `declareRuleDefinitions` (calls the existing `defineLazily` on the rule's own
    context); removed `constraintFailsOnTrial`, the `trial` option, `TRIAL_REFUSED`, and the eager
    `context.define`. `beginTransaction` has no side effects, so dropping the trial transaction changes nothing.
  - `test/hrg-rule-engine-definitions.test.ts` rewritten (7 tests pass; 6 of them fail on the eager base
    sources, as a control).
  - typecheck exit 0; biome clean on the two files.
  - PR A sources exported to scratchpad `engine-speed/pra` for side-by-side timing.
  - Before-hash for PR B = `engine-speed/hash-pr-a.tsv` (byte-identical to the base hash).
- PR B measured (uncommitted tree; src unchanged since the hash except nothing):
  - Corpus compare PR A -> PR B (`engine-speed/hash-pr-b.tsv`, `compare-a-b.txt`):
    `{"before":11004,"after":11004,"linesDiffering":10993,"track":132,"decisions":10993,"diagnostics":119,"frames":0,"messages":0,"missing":0}`
    `decisionRecords`: dectalk-english sum -7 (4 texts), qlatt-beauty -79 (64 texts), qlatt-english -79 (64).
    By frontend (classify-hashes.mjs): decisions differ in 3665 / 3664 / 3664 lines; track differs only in the
    texts whose record count changed (4 / 64 / 64), diagnostics in 0 / 62 / 57 of those; 0 id-column
    differences without a count change; 5 error lines, unchanged.
  - Why counts drop: a `vocabulary()`/`number_phonemes()` call in a define entry nothing reads is no longer
    made, so its `normalization_vocabulary_lookup` record is not written (seen: "$0.99" on qlatt-english,
    tn_currency_units["dollar.many"]). Being verified for all 132 texts by `dump-changed-counts.mjs`
    (background; report in `engine-speed/changed-counts-report.txt`).
  - "Hello world." dectalk-english, dump diff: 2110 decisions both, no field differs but parents; 150 decisions
    lose parents (1357 ids of 81773), none gains; 561 same set in another order. Example: segment_2.stress by
    dectalk_consonant_stress, 18 -> 13 parents (n2/n3 = ahead(current, 2/3) are not read when syl1 holds).
  - Tests: targeted + all 79 provenance/hash-touching files: 103 files passed, 1 failed:
    `test/voice-quality-port.test.ts` 2 tests timed out at 30 s while the 12-job hash was running. Must be
    rerun alone on a quiet machine before saying anything about it. No pinned value needed regenerating.
  - Timing vs PR A side by side was noisy (other agents running): round 1 wall min 201.9 -> 205.8 (medians
    9151 -> 8098 ms/pass), round 2 214.1 -> 198.3 (8704 -> 7913). Rerun more rounds when quiet.
  - `scripts/tmp-define-order.ts`: 139 define entries call vocabulary/number_phonemes/target.
- PR B still owed: rerun voice-quality-port alone, timing rounds, docs (`projects/declarative-frontend/spec.md`
  2.8 and Part 6), rerun changed tests after the empty-block check, commit, push, PR, final report.

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
