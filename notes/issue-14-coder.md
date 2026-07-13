# Issue #14 — Validate normalization table schema at load time

## 2026-05-27 — coder checkpoint

### State
- Branch: `fix/validate-normalization-tables` (off master at d51a2070).
- Implementation done. Tests written. Typecheck just passed clean (`tsc -p tsconfig.core.json --noEmit` zero output).

### Changes
- `src/g2p/text-normalize.ts`
  - Added `validateNormalizationTables(tables: unknown): asserts tables is NormalizationTables` (exported).
  - Added two internal helpers: `assertStringArray(value, name, expectedLength)` and `assertStringMap(value, name, expectedSize | null)`.
  - Modified `getTables()` to load as `unknown`, call validator, then cache. All errors prefixed `E_NORMALIZE_CONFIG:`.
  - Coverage: `ones`/`teens`/`tens` length 10, `month_names` length 12, `digit_words` length 10. Maps `ordinal_ones`/`ordinal_tens`/`abbreviations` required non-empty string-valued. All array entries and map values must be strings.
- `test/text-normalize-declarative.test.ts`
  - New `describe("validateNormalizationTables", ...)` block with 10 cases: accepts shipped tables; rejects null/string/array top-level; missing required array; wrong-length fixed arrays (parameterized); non-string array entries; missing required map; digit_words wrong size; empty abbreviations; non-string map entries; map-that-is-array.

### Remaining
- Run full test suite for the normalization file to confirm assertion regex matches my error strings (typecheck doesn't exercise runtime).
- Commit with explicit pathspec (two files only — shared-index discipline).
- Report to Q.

### Risks / unknowns
- None observed. Validator runs once per process (cache gate), zero runtime perf concern.
- The `validateNormalizationPipelineConfig` call in `getPipeline()` already calls `getTables()`, so pipeline-load path now also runs the table validator. Intentional and desired.
