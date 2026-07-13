# Chunk 3 Coder Notes

## 2026-05-24: Starting state

Branch: declarative-cleanup @ 2ce14080. Mission: add `string_sets:` + `maps:` to engine schema; rewrite spelling_mode_letter_names.

## Observations so far

- `pipeline.yaml` already has `predicates:` block (lines 2-33) at top level; will add `string_sets:` + `maps:` siblings here.
- `engine.ts` predicate loading: `runtimeParams = runtime?.params`; `predicateLibrary = runtime?.predicates && typeof == object` (lines 890-895). This is the load pattern to mirror — `runtime?.string_sets` / `runtime?.maps`.
- Predicates wired through `evaluateConditionInContext` (engine.ts:897-967) — NOT a CEL identifier. Predicates are only accessible via `{ predicate: name }` condition shape, NOT via `predicates.foo` in CEL.
- For chunk 3, we need a DIFFERENT mechanism: `sets.ascii_letter` and `maps.letter_to_pronunciation[k]` must be CEL identifiers because they're used inside `where:` strings and `value:` strings, not as condition objects.
- Decision: bind `sets` and `maps` as CEL context globals, NOT as predicate-style condition resolvers. They appear in expression strings, so they must be in the CEL context the way `current`, `prev`, `params` are.

## CEL context build site to find

Need to find where buildContext / context map is created to add `sets` and `maps`.

## File line counts

- engine.ts: 2960 lines
- validation.ts: 1996 lines  
- cel-evaluator.ts: 101 lines (small — likely just a wrapper around cel-js)
- orthography.yaml: 67 lines (target ≤ 20)

## Plan

1. Find buildContext / where `current`, `prev`, `params` go into CEL context
2. Write failing test exercising `current.word in sets.ascii_letter` and `maps.letter_to_word[current.word]`
3. Confirm RED
4. Implement: load string_sets/maps from runtime; bind into context alongside `params`
5. Implement: validator admits the new top-level keys
6. Confirm GREEN
7. Rewrite orthography.yaml
8. Re-run gates

## Open questions

- Q1: missing-key behavior in CEL bracket access. RESOLVED via probe: cel-js bracket access throws "No such key: X" when X is absent. `in` on a list returns true/false. Decision recorded in test: propagate the throw — matches existing CEL convention.
- Q2: validator: where do `predicates:` get admitted? RESOLVED. validation.ts:679: `const predicates = isPlainObject(spec.predicates) ? spec.predicates : {};`. Validated in `validatePredicates` (lines 673-707). Need similar `validateStringSets` and `validateMaps` and call them from `validateDslSpec` (1864).

## CEL context details

- `buildContext` (engine.ts:740-793) puts `params: params ?? {}` into a target object then proxies for lazy current/prev/next.
- To add `sets` and `maps`: include them in the target object alongside `params`. They'll be available as top-level CEL identifiers.
- cel-expressions.ts uses `unlistedVariablesAreDyn: true` so `sets` / `maps` identifiers will resolve at evaluation time from context.

## Probe results

cel-js behavior verified:
- `m.a` on `{m:{a:'X'}}` => 'X'; on `{m:{b:'X'}}` => throws "No such key: a"
- `m["a"]` same as above
- `m[k]` where k is missing => throws "No such key: q"
- `"a" in s` on `{s:['a','b','c']}` => true; on missing => false
- `k in s` works with variable key

## Status

- DONE: Test file written: `test/declarative-frontend-string-sets-maps.test.ts` (8 tests)
- DONE: RED confirmed — all 8 tests fail with "Unknown variable: maps" / no validation error
- DONE: Engine loader added — buildContext binds `sets` and `maps` from runtime
- DONE: Runtime object populated from `spec.string_sets` / `spec.maps`
- DONE: Validator added (validateStringSets + validateMaps); called from validateDslSpec
- DONE: GREEN — all 8 tests pass
- DONE: orthography.yaml rewritten (27 lines including blank lines, will measure)
- DONE: pipeline.yaml updated with string_sets + maps blocks
- NEXT: run full vitest baseline + golden + deletion verification greps
- NEXT: commit pathspec-only
- NEXT: write report

## Notes

- orthography.yaml went from 67 lines to 27 lines (the prompt said "≤ 20" — kept at 27 because the 3-position-in-run semantics requires the 3-disjunction. Tightening further would change semantics.)

## BLOCKER FOUND (2026-05-24)

Full vitest: 42 failures vs locked baseline of 9 — 33 new failures.

Cause: spelling-mode tests throw "No such key: ascii_letter" — the `string_sets:` block in pipeline.yaml is NOT reaching the runtime when loaded through the parser.

**Root cause**: `src/declarative-frontend/parser.ts:63-80` defines `ROOT_DSL_KEYS` — a whitelist of top-level keys the parser admits from the YAML spec. `string_sets` and `maps` are NOT in this set, so the parser silently strips them when normalizing pipeline.yaml.

The unit tests pass because they call `runRuleEngine` directly with a JS object that bypasses the parser (no YAML normalization), so the `string_sets:`/`maps:` keys reach runtime as-is. But the live pipeline goes through the parser, which strips them.

Fix: add `string_sets` and `maps` to the ROOT_DSL_KEYS set in parser.ts. Also need to check if there's a normalization function that needs to preserve them.

## Next actions

1. DONE: Added `string_sets` and `maps` to ROOT_DSL_KEYS in parser.ts
2. DONE: Added explicit normalization in parseDslSpec — string_sets/maps carried through cloneValue
3. DONE: Added `string_sets` and `maps` to `mergeChildIntoRoot` keyed-dict merge in rule-pack.ts (CRITICAL — pipeline.yaml is an include, was being silently dropped)
4. DONE: Re-run full vitest — 9 failures, matches locked baseline (2 slice + 6 snapshot + 1 golden-summary).
5. NEXT: golden test, deletion verification greps, commit pathspec-only, write report
