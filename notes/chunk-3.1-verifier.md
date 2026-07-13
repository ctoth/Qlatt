# Chunk 3.1 Verifier Notes

2026-05-24 (datestamp)

## Task
Verify commit `66b7ac27` on `declarative-cleanup`. Default NO-MERGE. Output: `reports/chunk-3.1-verifier.md`.

## Gates Status

### Gate 1 — Commit shape: PASS
`git show --stat 66b7ac27` lists exactly two paths:
- `src/declarative-frontend/rule-pack.ts`
- `test/declarative-frontend-rule-pack-includes.test.ts`

### Gate 2 — Guard implementation correctness: PASS
Read diff of `rule-pack.ts`. Verified:
- Throw happens AFTER explicit merges (added after the merge loop, not before).
- Error code: `E_UNMERGED_CHILD_ROOT_KEY` (matches E_* convention).
- Error message names key AND childPath.
- `hasNonEmptyValue` is recursive — strings trimmed, arrays/objects recursed via `.some`.
- `ALLOWED_UNMERGED_CHILD_ROOT_KEYS = new Set(["version", "include"])` — exactly two keys.

### Gate 3 — Allowlist grounded: PASS
- `parser.ts:63-83` has ROOT_DSL_KEYS — 18 keys: version, inventory_path, lts_path, f0_model, parameters, input_contract, streams, topology, predicates, string_sets, maps, patterns, phases, rules, interpolation, output, transcription, include.
- `rule-pack.ts` ROOT_DSL_KEYS is identical 18 keys.
- `MERGED_CHILD_ROOT_KEYS` is exactly: rules, predicates, patterns, streams, string_sets, maps, phases, topology (8 keys).
- Allowed-unmerged exception: version, include (2 keys).
- Remaining 8 keys that would trip the guard: inventory_path, lts_path, f0_model, parameters, input_contract, interpolation, output, transcription. Matches gate spec.

### Gate 4 — Test asserts specific error: PASS
Test file `test/declarative-frontend-rule-pack-includes.test.ts` uses:
`/E_UNMERGED_CHILD_ROOT_KEY.*output.*does not merge/`. Specific regex, not blanket toThrow.

### Gate 5/6 — Existing valid includes still work / locked baselines
- Two parent files with `include:` in `public/rules/frontends/`: qlatt-english/frontend.yaml, dectalk-english/frontend.yaml.
- Need to run `npx vitest run` to confirm 9 pre-existing failures + 1086+ passing including new test.
- Need to run `npm run test:golden` — locked thresholds: lf-source rmsError <= 0.326, maxDelta <= 0.791.

### Gate 7 — Pathspec audit: PASS
Zero `knowledge/` paths in commit. Worktree has unstaged `knowledge/` deletions but those are unrelated to this commit.

### Gate 8 — Spirit of the fix: PASS (by code reading)
Thought experiment: A future author adds `output: { format: 'foo' }` to a child include today.
- `mergeChildIntoRoot` runs explicit merges (rules/predicates/etc — does nothing for `output`).
- Then the new validation loop iterates `Object.entries(child)`.
- For key `output`: NOT in MERGED, NOT in ALLOWED, IS in ROOT_DSL_KEYS, `hasNonEmptyValue({format: 'foo'})` returns true → throws.
- Guard fires as designed.

## Current State
Static gates 1-4, 7, 8 verified by inspection. Need runtime gates 5 and 6: full vitest and golden.

## Blocker
None. Running gates next.
