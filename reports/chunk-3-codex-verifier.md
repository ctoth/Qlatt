# Verdict: NO-MERGE

Workflow used: `prompts/chunk-3-codex-verifier.md`, default NO-MERGE.

NO-MERGE reason: Gate 7 is not clean. `npm run test:golden` exited 1. The `lf-source-wasm-compare` RMS is within the prompt's bound (`0.32504812202227573 <= 0.326`), but the child script still exits 1 because `maxDelta = 0.790002666` exceeds its internal `1e-5` threshold. The prompt says any other anomaly is NO-MERGE.

## Gate 1 - Commit Shape

PASS.

`git show --stat --oneline 1f6e0b9c` lists only:

- `src/declarative-frontend/engine.ts`
- `src/declarative-frontend/parser.ts`
- `src/declarative-frontend/rule-pack.ts`
- `src/declarative-frontend/validation.ts`
- `public/rules/frontends/qlatt-english/pipeline.yaml`
- `public/rules/frontends/qlatt-english/phases/orthography.yaml`
- `test/declarative-frontend-string-sets-maps.test.ts`

No extra path was present.

## Gate 2 - TDD Evidence

PASS.

I read `test/declarative-frontend-string-sets-maps.test.ts`. It has real assertions for:

- `string_sets:` membership in `where:` conditions: `expect(out[0].isLetter).toBe(true)`, `expect(out[1].isLetter).toBeUndefined()`, `expect(out[2].isLetter).toBe(true)`.
- `maps:` lookup in `value:` expressions: `expect(out[0].pronunciationKey).toBe("ALPHA")`, `expect(out[1].pronunciationKey).toBe("BRAVO")`.
- validator rejection of malformed shapes: `expect(() => runRuleEngine(...)).toThrowError(/E_STRING_SET_INVALID/)` and `/E_MAP_INVALID/`.

Spot-check result: the checked tests contain `expect(...).toBe(...)` or `expect(...).toThrowError(...)`, not blanket pass assertions.

## Gate 3 - Deletion Verification

PASS.

Both required searches returned zero matches against commit `1f6e0b9c`:

- `git grep -nE "\['a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z'\]" 1f6e0b9c -- public/rules/frontends/qlatt-english/phases/orthography.yaml`
- `git grep -nE "current\.word == 'a' \?" 1f6e0b9c -- public/rules/frontends/qlatt-english/phases/orthography.yaml`

## Gate 4 - Line-Count Delta

PASS.

`git show 1f6e0b9c:public/rules/frontends/qlatt-english/phases/orthography.yaml | Measure-Object -Line` reports 26 lines. The overshoot is not padding: the rule preserves the original "run of at least three single-letter words" semantics with a three-position disjunction:

- middle token: `prev + current + next`
- left-edge token: `current + next + ahead(current, 2)`
- right-edge token: `behind(current, 2) + prev + current`

The comment explains this, and the body is the needed disjunction plus the map lookup.

## Gate 5 - Schema Visibility And Validation

PASS.

`engine.ts` binds both blocks directly into CEL evaluation context:

- `sets: stringSetsBinding`
- `maps: mapsBinding`

Rule authors can use `sets.ascii_letter` and `maps.letter_to_pronunciation[current.word]` directly; no extra author-side setup is required.

`validation.ts` adds `E_STRING_SET_INVALID` and `E_MAP_INVALID`. These match the existing validator convention of `E_*` uppercase error codes such as `E_STREAM_SCHEMA`, `E_CEL_INVALID`, and `E_RULE_EXPRESSION_INVALID`.

## Gate 6 - `rule-pack.ts` Merge-Fix Probe

PASS for chunk 3; non-blocking latent bug found.

`parser.ts` declares these `ROOT_DSL_KEYS`, with merge status in `mergeChildIntoRoot`:

| ROOT_DSL_KEY | Merge status in `mergeChildIntoRoot` |
|---|---|
| `version` | Dropped from child; root wins |
| `inventory_path` | Dropped from child; root wins |
| `lts_path` | Dropped from child; root wins |
| `f0_model` | Dropped from child; root wins |
| `parameters` | Dropped from child; root wins |
| `input_contract` | Dropped from child; root wins |
| `streams` | Merged by key; duplicate key errors |
| `topology` | Merged only for `hierarchy`, `parallel`, and `point` arrays with dedup |
| `predicates` | Merged by key; duplicate key errors |
| `string_sets` | Merged by key; duplicate key errors |
| `maps` | Merged by key; duplicate key errors |
| `patterns` | Merged by key; duplicate key errors |
| `phases` | Concatenated root first, then child |
| `rules` | Merged by key; duplicate key errors |
| `interpolation` | Dropped from child; root wins |
| `output` | Dropped from child; root wins |
| `transcription` | Dropped from child; root wins |
| `include` | Consumed by recursive include resolution; not merged as root data |

Non-blocking finding: existing root-level keys beyond the four old dictionaries plus chunk 3's two new keys are still silently dropped when they appear in child includes. The most likely risky dropped keys are `parameters`, `input_contract`, `interpolation`, `output`, `transcription`, `inventory_path`, `lts_path`, and `f0_model`.

## Gate 7 - Locked Baselines

NO-MERGE.

`npx vitest run` exited 1 with exactly the locked 9 failures:

- 2 failures in `test/declarative-frontend-slice.test.ts`
- 6 snapshot failures in `test/tts-frontend-snapshot.test.ts`
- 1 golden-summary failure in `test/tts-frontend-declarative-golden-summary.test.ts`

Summary: `Test Files 3 failed | 120 passed (123)`, `Tests 9 failed | 1085 passed (1094)`.

`npm run test:golden` exited 1. Child-script isolation:

- `scripts/klatt-tract-wasm-compare.ts`: exit 0.
- `scripts/lf-source-wasm-compare.ts`: exit 1, output `rmsError = 0.32504812202227573`, `maxDelta = 0.790002666`.
- `scripts/render-phrase.ts`: exit 0.

The RMS satisfies the prompt threshold, but the command itself failed because `scripts/lf-source-wasm-compare.ts` enforces `maxDelta > 1e-5` as failure. This is an anomaly under the gate wording.

## Gate 8 - Pathspec Audit

PASS.

`git show --name-only --format= 1f6e0b9c` contains zero `knowledge/` paths.

Note: the current worktree has many unrelated dirty `knowledge/` paths, but they are not in commit `1f6e0b9c` and I did not use them as evidence for the commit audit.

## Gate 9 - Missing-Key Semantics Decision

PASS with note.

The missing-key test asserts a specific regex:

`expect(() => runRuleEngine(input, spec)).toThrowError(/No such key/)`

That is specific enough to distinguish the chosen cel-js missing-key behavior from a generic throw, though it does not assert the full key name.
