# Notes: DAC Property Implementation

## Goal
Add `dac` (Degree of Articulatory Constraint) property to all 63 non-SIL phoneme entries in inventory.yaml, and fix `materializePhonemeTarget` to pass through non-BASE_PARAMS numeric values.

## Plan
1. RED: Write failing test in existing `test/inventory-materialization.test.ts`
2. GREEN: Fix inventory.ts + add dac to inventory.yaml
3. REFACTOR: Verify counts and run full tests

## Key files
- `src/declarative-frontend/inventory.ts` - lines 229-241, boolean-only copy loop
- `public/rules/inventory.yaml` - 64 entries, need dac on 63
- `test/inventory-materialization.test.ts` - existing test file to extend

## Status
- [x] RED phase - test failed as expected (undefined != 2)
- [x] GREEN phase - fix inventory.ts (else if for non-BASE_PARAMS numerics)
- [x] GREEN phase - add dac to inventory.yaml (63 entries: 23+26+14)
- [x] REFACTOR phase - counts verified (23/26/14 = 63)
- [x] Full tests pass (10 failures are all pre-existing)
- [x] Commits: a6f9404 (code fix) + 1ce90cc (yaml + test + snapshots)
