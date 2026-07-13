# Chunk 7 Coder Notes — for_each_field engine schema

Date: 2026-05-25
Branch: declarative-cleanup
Mission: Add `for_each_field` template expansion to engine; collapse burst_spectral_template (9 effects A2-A10) and weak_stop_release_parallel_attenuation (10 effects A1-A10) in formant.yaml. Reshape 27 flat burst_a<n>_<place> policy keys into nested burst_amplitudes[A<n>].{bilabial,alveolar,velar}.

## Observations

### Existing code layout
- Rule parsing/normalization happens in `src/declarative-frontend/parser.ts` at `normalizeRule()` (line 172). Line 207 shallow-clones `rule.apply` entries via `cloneObject`. This is the place to inject `for_each_field` expansion at LOAD time.
- Validation in `src/declarative-frontend/validation.ts` walks `r.apply[i]` (line 1532+) and inspects `effect.value` / `effect.dispatch`.
- Engine's runtime processing at `applyEffectsToTargets` (line 1481, engine.ts) reads `effects = Array.isArray(rule.apply) ? rule.apply : []` — so if expansion happens at parse-time, runtime is unchanged.

### YAML state
- `public/rules/frontends/qlatt-english/frontend.yaml` line 568-691: 27 flat `burst_a<n>_<place>` keys (A2..A10 only — NOT A1; prompt was slightly off but intent clear).
- `public/rules/frontends/qlatt-english/phases/formant.yaml`:
  - line 359-496: `burst_spectral_template` has 9 effect blocks (A2..A10), each 3-arm dispatch on bilabial/alveolar/velar with a default. NOT A1..A10 as prompt said.
  - line 497-546: `weak_stop_release_parallel_attenuation` has 10 effect blocks (A1..A10), each `op: add value: -18`.
- `dectalk-english` has NO parallel rules and NO burst_a* keys — skip per "if applicable".

### Test patterns to copy
- `test/declarative-frontend-dispatch-predicate.test.ts` is a perfect template for an engine integration test: build a small spec, feed input tokens through `runRuleEngine`, assert on output. I'll mirror that pattern.

## Plan

1. **Failing test first**: New file `test/declarative-frontend-for-each-field.test.ts` with the spec shape from the prompt. Two cases: (a) `for_each_field` expands and writes per-field values; (b) rule without `for_each_field` unaffected. Confirm RED.
2. **Engine**: in `parser.ts` `normalizeRule`, when an entry in `apply` has `for_each_field`, expand to N entries replacing `{field}` literal substring in `field`, `value`, `tag`, and recursively in `dispatch` values. Same in `contour.apply` for symmetry (cheap).
3. **Validation**: in `validation.ts`, after expansion has happened, an unexpanded `for_each_field` should never reach validation. But validate the SHAPE of `for_each_field` itself at parse time (reject non-array / non-string-entries). Add a check that runs at the start of `for ... r.apply ...` loop and errors if `for_each_field` remains (defense-in-depth). Plus, ensure `cloneObject` in parser preserves `for_each_field` so the expander sees it.
4. **Reshape frontend.yaml**: replace lines 568-691 with nested `burst_amplitudes: { A2: {bilabial, alveolar, velar}, ..., A10: {...} }`. Preserve all citations (group by amplitude — citation set differs A2-A6 vs A7-A10).
5. **Rewrite formant.yaml rules**:
   - `burst_spectral_template`: one effect with `for_each_field: [A2..A10]`, `field: "params.{field}"`, dispatch reads `params.policy.formant.burst_amplitudes.{field}.bilabial` etc., default `"has(current.?params.{field}) ? current.params.{field} : 0"`.
   - `weak_stop_release_parallel_attenuation`: one effect with `for_each_field: [A1..A10]`, `op: add value: -18`.
6. **Verify**: vitest + golden. Target: formant.yaml -130 lines; frontend.yaml -20 lines; zero flat keys.
7. **Pathspec-only commit**.

## Open questions / decisions

- **Where does expansion live?** Parser (normalizeRule) is best — it's BEFORE validation, BEFORE SPEC_VALIDATED marker. Engine never sees `for_each_field`. Validation never sees it either; only the shape of the raw input may need shape-checking. Choosing parser.
- **`{field}` substitution scope**: Per prompt, in `field` and `value`. Also need it in `dispatch[*].value` strings since the rewritten rule uses dispatch. Recursive string substitution within the cloned effect (skipping non-strings) is the cleanest approach.
- **`{field_lower}`**: prompt mentions "if you need it". I won't use it for these rules (A2..A10 are uppercase). Implement it anyway since trivially cheap — but skip if it complicates anything.

## Current blocker

None.

## Progress (2026-05-25 ~01:37)

### Engine done
- `src/declarative-frontend/parser.ts`: added `substituteFieldPlaceholders()` (replaces `{field}` / `{field_lower}` in all string-valued nested positions of a cloned template) and `expandForEachField()` (walks an apply[] list, expands entries with `for_each_field:`, throws `E_FOR_EACH_FIELD_INVALID` on non-array / empty / non-string entry shapes). Wired in at `normalizeRule`'s `apply:` line.
- `src/declarative-frontend/validation.ts`: defense-in-depth diagnostic `E_FOR_EACH_FIELD_UNEXPANDED` if `for_each_field` ever reaches validation (should never happen post-parse).

### Tests done (test/declarative-frontend-for-each-field.test.ts)
- 5 tests, all GREEN after parser implementation:
  1. expands templated effect into one effect per field (top-level value)
  2. plain rules without for_each_field unaffected
  3. rejects non-array shape
  4. rejects non-string entries
  5. {field} substitution inside dispatch row values

### Remaining
1. Reshape frontend.yaml lines 568-691: collapse 27 flat `burst_a<n>_<place>` keys into nested `burst_amplitudes: { A2: {bilabial,alveolar,velar}, ... A10: {...} }`.
2. Rewrite formant.yaml `burst_spectral_template` (9 blocks → 1 templated block, A2..A10).
3. Rewrite formant.yaml `weak_stop_release_parallel_attenuation` (10 blocks → 1 templated block, A1..A10).
4. Run full vitest + golden + line-count checks.
5. Single pathspec-only commit.

### Key constraint discovered
- The policy tree validator may reject `burst_amplitudes.A2.bilabial` if the policy access syntax requires flat keys. Need to confirm policy tree access via `params.policy.formant.burst_amplitudes.A2.bilabial` works. Will discover during vitest run.
- Validation enforces "no inline critical numeric literals" in `apply.value`. Reading from `params.policy.formant.burst_amplitudes.{field}.bilabial` (a string CEL expression after substitution) is the same pattern as the existing flat-key reads — should be fine.

### Policy projection mechanics (verified)
- `engine.ts:projectPolicyValues` recurses into nested objects but when it encounters a node with a `value` key, returns just `node.value` (clones it). So `{ A2: { bilabial: { value: 50, citations: [...] }, ... } }` projects to `{ A2: { bilabial: 50, ... } }`. Good — nested shape works.
- `validation.ts:policyPathExists` walks dotted paths, segment by segment, against the projected tree. So `params.policy.formant.burst_amplitudes.A2.bilabial` validates if the projected tree has nested objects with those keys. Good.

### Shared-machine state observed
- src/track-assembler.ts has 244 lines of modifications by ANOTHER agent (unstaged). I must NOT touch it.
- public/rules/frontends/qlatt-english/accent-inventory.yaml is staged add by another agent.
- I will use strictly pathspec-only commit naming only MY files.

### Plan still
1. ~~Reshape frontend.yaml burst_a*_* keys → nested burst_amplitudes.A<n>.{bilabial,alveolar,velar}.~~ DONE.
2. ~~Rewrite formant.yaml burst_spectral_template (9 blocks → 1, A2..A10).~~ DONE.
3. ~~Rewrite formant.yaml weak_stop_release_parallel_attenuation (10 blocks → 1, A1..A10).~~ DONE.
4. ~~Run vitest + golden + line-count checks.~~ DONE.
5. Pathspec-only commit.
6. Write report.

## Verification results (2026-05-25 ~01:46)

### Tests
- New chunk 7 tests: 5/5 PASS.
- Full vitest: 1093 passed, 7 failed — same 7 pre-existing failures (1 declarative-golden-summary + 6 snapshot regressions). No new failures.

### Golden
- lf-source `maxDelta = 0.790002666` (target ≤ 0.791) ✓
- lf-source `rmsError = 0.32504812202227573` (target ≤ 0.326) ✓

### Line counts
- formant.yaml: 752 → 612 = **-140 lines** (target ≥ -130 ✓)
- frontend.yaml: 1064 → 1077 = **+13 lines** (target was -20 ✓ NOT met — nested shape with indentation actually GROWS the line count because each nested {value, citations:} sub-object spreads across 3+ lines instead of 1)

### Concern: frontend.yaml line target NOT met
The frontend.yaml line-count target (-20 lines) was based on the assumption that nesting 27 flat keys into 9 A<n> groups of 3 places would shrink. But the nested YAML is actually LONGER (1077 vs 1064 = +13) because each leaf `{value: N, citations: [...]}` already takes 4+ lines; nesting just adds indentation depth without removing leaves.

This is structural, not a bug. The chunk's PRIMARY deliverable is the engine feature + collapsed rules (formant.yaml -140 lines, target met). The frontend.yaml reshape is a structural one — 27 flat top-level keys collapse to 1 top-level `burst_amplitudes` key with nested sub-keys. The 27 flat keys are GONE (`grep` verifies).

Q would want me to note this honestly in the report rather than try to artificially shrink frontend.yaml.

### Deletion check pending — run grep next.

### Current blocker
None — proceeding to deletion check and commit.

## Committed (2026-05-25 ~01:50)

- Commit hash: **e9877195**
- Branch: declarative-cleanup
- Diff stat: 5 files changed, 411 insertions(+), 279 deletions(-)
  - public/rules/frontends/qlatt-english/frontend.yaml | 261 ±
  - public/rules/frontends/qlatt-english/phases/formant.yaml | 168 ±
  - src/declarative-frontend/parser.ts | 67 +
  - src/declarative-frontend/validation.ts | 12 +
  - test/declarative-frontend-for-each-field.test.ts | 182 + (new)
- Pathspec-only commit (no other agents' files swept in — verified `git diff --cached --stat` empty before commit).
- Deletion check: `grep -nE "burst_a[0-9]+_(bilabial|alveolar|velar)"` returns ZERO matches. All 27 flat keys gone.

## Remaining work
- Write report to reports/chunk-7-coder.md (do NOT auto-commit it per prompt).
