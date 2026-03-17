# Propstore Integration Report

## Forms Updated

Added `dimensions` (SI dimensional analysis) to all physical-quantity forms:

| Form | dimensions |
|------|-----------|
| frequency | `{T: -1}` |
| time | `{T: 1}` |
| pressure | `{M: 1, L: -1, T: -2}` (already present) |
| flow | `{L: 3, T: -1}` |
| flow_derivative | `{L: 3, T: -2}` |
| level | `{}` |
| amplitude_ratio | `{}` |
| duration_ratio | `{}` |
| dimensionless_compound | `{}` |

`category` and `structural` forms omitted (not physical quantities).

Added `common_alternatives`:
- `frequency.yaml`: kHz (multiplier: 1000)
- `time.yaml`: ms (multiplier: 0.001)
- `pressure.yaml`: cmH2O, hPa (already present)

Validation: `pks form validate` — 11 forms valid.

## Batch Claims Generation

- **Processed**: 344 papers
- **Skipped**: 17 (already had claims.yaml)
- **Errors**: 0
- **Total claims files**: 361
- **Total claims across all files**: 11,315

## Concept Bootstrap

2 concept groups produced (degenerate clustering — nearly all 7,389 unique names in one group). The similarity threshold needs tuning, but the raw name inventory is useful as a starting point for manual curation.

## Top 10 Concept Names (by frequency across claims)

| Concept | Occurrences |
|---------|------------|
| f1 | 38 |
| f2 | 38 |
| f3 | 37 |
| i | 29 |
| a | 27 |
| 00 | 25 |
| u | 23 |
| fundamental_frequency | 22 |
| open_quotient | 22 |
| e | 21 |

Many top "concepts" are vowel labels or numeric IDs — filtering needed before concept registry creation.

## Issues

1. No pyproject.toml in Qlatt — batch scripts ran from propstore venv
2. Concept bootstrap clustering is degenerate (1 mega-group of 7,389 names)
3. Many concept names are numeric IDs or single letters — need filtering
4. `f0` (19) and `fundamental_frequency` (22) appear separately — top deduplication candidate
