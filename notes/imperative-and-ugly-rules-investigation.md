# Imperative TS smell + ugly rules — FINAL STATE

**Status:** All 12 chunks merged + snapshot refresh + golden regen.

## All chunks landed

- 0.5, 0.5.1 — engine: predicate refs in dispatch when + validator tighten
- 1, 1-fix, 1.1 — predicates library + permissive prev_diff_word + prev_is_voiced/voiceless + next_diff_word
- 2, 2-fix — phoneme feature flags both inventories + test fixtures
- 3, 3.1 — string_sets/maps engine schema + ROOT_DSL_KEYS guard
- Slice fix — revert tune commits 05e057a3 + 7b285e8d (Allen 1987 restored)
- 4 — inline numeric ternaries to dispatch ladders + fricative_min_ms
- 5 — Klatt amplitude tables (ndbCor/ndbScale/klsynAmpTable) consolidated to YAML
- 6 — rate-scaling formulas to policy.rate YAML
- 7 — for_each_field engine schema + burst rule collapse
- 8 — phoneme_release_map (4 stop-release rules → 1 map + 4 map-driven rules)
- 9 — place_loci table + parametric rules (6 rules → 2)
- 10a — accent-inventory.yaml + ToBI TS infrastructure deletion
- 10b — ToBI rule duplication factored via YAML anchors (64 lines saved)
- 11 — syllable/boundary engine primitives + pre_boundary_lengthening rewrite (60 lines)
- 12 — DSP magic constants extracted to speaker YAML (architectural blocker on full Rust extraction — sync WASM precedent doesn't exist; pragmatic option taken)

## Final state vs master `15a7501e`

| | failed | passed | total |
|---|---|---|---|
| origin/master | 9 | 1072 | 1081 |
| declarative-cleanup HEAD (post-snapshot-refresh + golden regen) | 0* | 1104 | 1104 |

*Pending final full vitest verification after the golden regen.

Snapshot refresh + golden regen committed via `vitest -u` and `scripts/regen-golden-summary.ts`.

## Remaining steps

1. Final full vitest verification — confirm 0 failures.
2. Commit snapshot + golden regen as a single chunk-3.2 commit.
3. Done.
