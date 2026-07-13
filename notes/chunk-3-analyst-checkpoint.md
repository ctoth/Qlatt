# Chunk 3 Analyst — Checkpoint

2026-05-24

## Task
Analyst for chunk 3 of declarative-cleanup. Branch `declarative-cleanup` at `1f6e0b9c`.
Focus per Q: probe 3 (orthography semantic equivalence) and probe 6 (ROOT_DSL_KEYS merge generalization). Skip other probes.

## State
DONE. Report written: `reports/chunk-3-analyst.md`. Verdict: ANALYST-CONCERNS.

## Findings

### Probe 3 — CLEAN
- OLD orthography.yaml (commit 1f6e0b9c^): 3-disjunction `where` (middle / left-edge / right-edge), 26-letter inline literal × 4, 26-arm ternary in `define.pronunciation_key`.
- NEW orthography.yaml: identical 3-disjunction structure referencing `sets.ascii_letter`; `apply.value` = `maps.letter_to_pronunciation[current.word]`.
- `sets.ascii_letter` (pipeline.yaml:38-39) is the same 26 letters in same order.
- `maps.letter_to_pronunciation` (pipeline.yaml:43-69) has all 26 a→LETTER_A...z→LETTER_Z entries.
- `where` guard ensures map lookup always hits → no missing-key throw possible.
- Test case "a cat" — `a` does not trigger LETTER mode in OLD or NEW (cat fails ascii_letter membership). Article preserved.
- No silent behavior change. Not a chunk-1-shaped regression.

### Probe 6 — CONCERNS
- ROOT_DSL_KEYS (parser.ts:63-83) has 18 keys.
- mergeChildIntoRoot (rule-pack.ts:29-77) merges only: rules, predicates, patterns, streams, string_sets, maps, phases, topology (8 keys).
- 10 keys NOT merged: version, inventory_path, lts_path, f0_model, parameters, input_contract, interpolation, output, transcription. Plus `include` (consumed before merge).
- Comment in mergeChildIntoRoot explicitly says "root wins, child ignored" — documented behavior.
- Coder's intermediate-run breakage (42 failures with "No such key: ascii_letter") is the same shape — they fixed it for string_sets/maps but not generalized.
- Currently dormant: scanned all qlatt-english and dectalk-english includes; every included file only declares `version: v1`. No latent bug being exercised right now.
- Foot-gun for future splits — if anyone factors `parameters:` or `transcription.letter_names` into a sibling include, it'll silently disappear.
- Recommended: chunk 3.x follow-up. Option A (defensive): mergeChildIntoRoot throws on any non-empty non-merged top-level key in a child include. Option B (full generalization): handle each remaining root key with explicit deep-merge semantics.

## Blockers
None. Task complete.
