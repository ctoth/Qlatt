# Chunk 1 Coder — Predicates Library Extraction

## Date: 2026-05-24

## Status: VERIFICATION PASSED — ready to commit

## Edits complete
- pipeline.yaml: 19 predicates added
- duration.yaml: items 1-7 (skipped pre_boundary)
- postlexical.yaml: item 9 (t_deletion, t_glottalization, d_deletion, glottal_stop_insertion)
- formant.yaml: items 10-16 (dark_l_allophony, r_f3_lowering, schwa_coronal_fronting, uw_coronal_fronting, f1_stop_onset, burst_spectral_template)
- prosody.yaml: skipped item 17 (mismatch — patterns reference prev not current)

## Golden tests result
Exit 1 — failure is `lf-source-wasm-compare.ts` with rmsError 0.32504812202227573, which matches the locked baseline 0.325 ± 0.001. EXACTLY ONE FAILURE as expected.
- klatt-tract-wasm-compare: PASS
- lf-source-wasm-compare: FAIL (expected locked baseline)
- render-phrase: PASS

## Line counts

| File | Before | After | Delta |
|------|--------|-------|-------|
| pipeline.yaml | 157 | 181 | +24 |
| duration.yaml | 435 | 439 | +4 |
| formant.yaml | 750 | 759 | +9 |
| postlexical.yaml | 307 | 312 | +5 |
| prosody.yaml | 806 | 806 | 0 |
| TOTAL | 3021 | 3063 | +42 |

LINE COUNT INCREASED by 42 lines, not decreased ~150 as prompt expected.

Reason: my conversion expanded inline CEL strings into structured `all:` blocks. Each `where: "current.type in [...] && (prev != null ? ...)"` (1 line via folded yaml) became:
```yaml
where:
  all:
    - predicate: is_pausable_consonant
    - predicate: prev_same_word
```
That's 4 lines instead of 1-2. Same for `dispatch when:` — each `when: cond` became `when:\n              predicate: name` (2 lines instead of 1).

Trading vertical lines for readability + reusability. Functionally cleaner — duplicate CEL patterns are gone — but the line count went UP. Will note in report.

## Grep verifications (final)
1. `git grep -nE "type in \[.stop_closure"` — matches remain in 5 places, ALL different lists (NOT the pausable consonant list).
2. `git grep -nE "prev\.word == current\.word \? prev\.word == current\.word"` — zero matches.
3. `git grep -nE "prev\.word \?\? prev\.word == current\.word : false"` — zero matches.
4. `git grep -n "is_coda: >-"` — only matches in pipeline.yaml (the predicate definition).
5. `git grep -nE "has\(current\.bilabial\) && current\.bilabial == true"` — 1 match in duration.yaml `aspiration_frication_carryover` define block (value expr, not where/when; out of scope).
6. Same for alveolar, velar — only in aspiration_frication_carryover.

## Working tree contamination warning
Another agent has many `knowledge/claims/` and `knowledge/concepts/` files deleted in the index. Must use explicit pathspec on commit to avoid sweeping their work.

## Next steps
1. Stage with explicit pathspec (5 files).
2. `git commit` with explicit pathspec.
3. Capture commit hash and diff stat.
4. Write report to reports/chunk-1-coder.md.
