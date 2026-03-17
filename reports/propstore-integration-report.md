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

## Concept Proposal Pipeline

New `propose_concepts.py` script extracts unique concept names from claims, infers forms from units and name patterns, and creates concept YAML files.

| Stage | Count |
|-------|-------|
| Total raw concept names | 7,390 |
| Filtered as junk | 139 |
| Form inferred + created | 2,546 |
| No form match (skipped) | 4,706 |

Key concepts created: `fundamental_frequency` (22 claims, 19 papers), `open_quotient` (22 claims, 20 papers), `f0`-`f6`, `b1`-`b6`, etc.

## Claims Import

`pks import-papers` copies claims from `papers/*/claims.yaml` into `knowledge/claims/` with globally unique claim IDs (auto-renumbered from `claim1` to `claim11315`).

## Validation Status

`pks validate` runs but reports 15,484 errors across 11,315 claims:

| Error type | Count | Notes |
|-----------|-------|-------|
| Missing unit | 6,894 | Auto-generated claims often lack unit field |
| Nonexistent concept | 6,181 | Concepts without inferrable form (4,706 names) |
| Missing value | 809 | Claims without value or bounds |
| Missing observation concepts | 707 | Observation claims need `concepts` list |
| Missing equation variables | 488 | Equation claims need `variables` list |
| Unit mismatch | 405 | Unit doesn't match concept's form |

These are data quality issues in auto-generated claims, not pipeline bugs.

## Propstore Fixes Applied

1. **UTF-8 encoding** — all YAML file reads now use `encoding="utf-8"` (was crashing on `deCheveigné`)
2. **Canonical name registry** — `build_concept_registry` now indexes by ID, canonical_name, and aliases (claims can reference concepts by name, not just ID)
3. **Sympy error handling** — `generate_sympy_with_error` catches all exceptions (was crashing on LaTeX expressions)
4. **Unique claim IDs on import** — `import-papers` auto-renumbers claim IDs to be globally unique

## Research-Papers-Plugin Additions

1. **`propose_concepts.py`** — batch concept creation from claims with form inference

## Next Steps

1. Add `category` form concepts for vowel/speaker labels (i, a, u, male, female)
2. Enrich auto-proposed concept definitions (currently just "Auto-proposed from N claims")
3. Fix missing units in batch_generate_claims.py
4. Deduplicate `f0` ↔ `fundamental_frequency` via aliases
5. Manual curation pass on high-frequency concepts
