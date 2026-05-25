# MERGE

Workflow used: `prompts/chunk-3-codex-verifier.md`, rerun against commit `1f6e0b9c` with default NO-MERGE until the gate evidence cleared it.

Current checkout note: the repo was on `declarative-cleanup` at `caf9cb02`, whose only intervening commit over `1f6e0b9c` is the prior verifier report. `git diff --name-status 1f6e0b9c..HEAD -- <gate-owned paths>` was empty, so the code/test/config surfaces exercised by the test gates matched `1f6e0b9c`.

## Gate 1 - Commit shape

PASS.

`git show --name-only --format= 1f6e0b9c` lists exactly:

- `public/rules/frontends/qlatt-english/phases/orthography.yaml`
- `public/rules/frontends/qlatt-english/pipeline.yaml`
- `src/declarative-frontend/engine.ts`
- `src/declarative-frontend/parser.ts`
- `src/declarative-frontend/rule-pack.ts`
- `src/declarative-frontend/validation.ts`
- `test/declarative-frontend-string-sets-maps.test.ts`

No other paths were in the commit.

## Gate 2 - TDD evidence

PASS.

I read `test/declarative-frontend-string-sets-maps.test.ts` from `1f6e0b9c`. It has real assertions for:

- `string_sets:` membership in `where:`: `expect(out[0].isLetter).toBe(true)`, `expect(out[1].isLetter).toBeUndefined()`, `expect(out[2].isLetter).toBe(true)`.
- `maps:` lookup in `value:`: `expect(out[0].pronunciationKey).toBe("ALPHA")`, `expect(out[1].pronunciationKey).toBe("BRAVO")`.
- malformed shapes rejected by validation: multiple `expect(() => runRuleEngine(...)).toThrowError(/E_STRING_SET_INVALID/)` and `/E_MAP_INVALID/`.

Spot-check result: the first, second, and third tests all contain concrete `expect(...)` assertions. The third missing-key test asserts `toThrowError(/No such key/)`.

## Gate 3 - Deletion verification

PASS.

Both target-commit greps returned no matches:

```text
git grep -nE "\['a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z'\]" 1f6e0b9c -- public/rules/frontends/qlatt-english/phases/orthography.yaml
exit=1

git grep -nE "current\.word == 'a' \?" 1f6e0b9c -- public/rules/frontends/qlatt-english/phases/orthography.yaml
exit=1
```

## Gate 4 - Line-count delta

PASS.

`git show 1f6e0b9c:public/rules/frontends/qlatt-english/phases/orthography.yaml | Measure-Object -Line` reports 26 lines. The prompt expected the coder-reported 27, but the target-commit content measured here is 26.

The overshoot beyond the 20-line target is not padding. The body is the three-case disjunction needed to preserve "run of at least three single-letter words" semantics:

- middle token: `prev` and `next` are letters
- left-edge token: `next` and `ahead(current, 2)` are letters
- right-edge token: `prev` and `behind(current, 2)` are letters

That preserves the distinction between spelling runs like "U C L A" and ordinary one/two-letter contexts such as article "a".

## Gate 5 - Schema visibility and validator codes

PASS.

`engine.ts` binds the new data into CEL context directly:

- runtime carries `string_sets` and `maps` from the parsed spec.
- `buildContext` exposes them as top-level identifiers `sets` and `maps` beside `params`.
- Rule authors can write `current.word in sets.ascii_letter` and `maps.letter_to_pronunciation[current.word]` without any extra setup.

`validation.ts` adds dedicated validators and error codes:

- `E_STRING_SET_INVALID`
- `E_MAP_INVALID`

Those follow the existing all-caps `E_*` validator error-code convention.

## Gate 6 - `rule-pack.ts` merge-fix probe

PASS for chunk 3, with a non-blocking latent merge-surface finding.

`ROOT_DSL_KEYS` in `parser.ts`, verbatim:

- `version`
- `inventory_path`
- `lts_path`
- `f0_model`
- `parameters`
- `input_contract`
- `streams`
- `topology`
- `predicates`
- `string_sets`
- `maps`
- `patterns`
- `phases`
- `rules`
- `interpolation`
- `output`
- `transcription`
- `include`

Merge status in `rule-pack.ts`:

| Key | Merge status |
|---|---|
| `version` | root wins; child value ignored |
| `inventory_path` | root wins; child value ignored |
| `lts_path` | root wins; child value ignored |
| `f0_model` | root wins; child value ignored |
| `parameters` | root wins; child value ignored |
| `input_contract` | root wins; child value ignored |
| `streams` | merged by key; duplicate key errors |
| `topology` | merged by subkey `hierarchy`, `parallel`, `point` with dedup |
| `predicates` | merged by key; duplicate key errors |
| `string_sets` | merged by key; duplicate key errors |
| `maps` | merged by key; duplicate key errors |
| `patterns` | merged by key; duplicate key errors |
| `phases` | concatenated root first, then child |
| `rules` | merged by key; duplicate key errors |
| `interpolation` | root wins; child value ignored |
| `output` | root wins; child value ignored |
| `transcription` | root wins; child value ignored |
| `include` | consumed during recursive include resolution; not merged upward as a root field |

Non-blocking finding: `parameters`, `interpolation`, `output`, and `transcription` are ROOT_DSL_KEYS that can carry meaningful root-level data but are silently dropped when declared in child includes. This is not chunk 3's responsibility, but it is the same class of include-surface risk that caused `string_sets`/`maps` to be dropped before the chunk fix.

## Gate 7 - Locked baselines

PASS.

Full Vitest command:

```text
npx.cmd vitest run
```

The PowerShell `npx.ps1` wrapper misparsed inside my first timeout job as `npm exec px vitest run`; I reran through `npx.cmd`, which starts the same local `npx` command path correctly on Windows.

Result:

```text
Test Files  3 failed | 120 passed (123)
Tests       9 failed | 1085 passed (1094)
Snapshots   6 failed
Duration    77.57s
```

The 9 failures are the locked set:

- 2 in `test/declarative-frontend-slice.test.ts`
- 6 in `test/tts-frontend-snapshot.test.ts`
- 1 in `test/tts-frontend-declarative-golden-summary.test.ts`

Golden command:

```text
npm.cmd run test:golden
```

Result: exited `1`, as locked.

Observed wasm comparison values:

```text
resonator:     rmsError 0.0000010582808756434203, maxDelta 0.00000187047980833039
antiresonator: rmsError 0.00017063198707248313,   maxDelta 0.002229056500027582
lf-source:     rmsError 0.32504812202227573,      maxDelta 0.790002666
```

`lf-source` remains inside the locked bounds named in the prompt: `rmsError <= 0.326` and `maxDelta <= 0.791`.

## Gate 8 - Pathspec audit

PASS.

`git show --stat 1f6e0b9c` and `git show --name-only --format= 1f6e0b9c` show zero `knowledge/` paths.

## Gate 9 - Missing-key semantics decision

PASS with a non-blocking looseness note.

The missing-key test documents the selected semantics: unguarded `maps.letter_to_word[current.word]` propagates cel-js missing-key failure, and rule authors are expected to guard lookups with membership tests.

The assertion is specific enough to require the cel-js message family:

```ts
expect(() => runRuleEngine(input, spec)).toThrowError(/No such key/);
```

Non-blocking note: it does not assert the exact key text, such as `No such key: q`; it only matches `/No such key/`.

## Verdict

MERGE. All blocking gates passed. The only findings are non-blocking: child include merge currently drops other meaningful ROOT_DSL_KEYS, and the missing-key assertion could be tightened to the exact missing-key message.
