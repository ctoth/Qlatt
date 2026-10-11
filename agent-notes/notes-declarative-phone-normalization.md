# Declarative Phone Normalization Layer

## Goal
Replace hardcoded `phoneme-map.ts` with a declarative normalize rule phase (`phases/normalize.yaml`) that runs first in the pipeline, with citations on every mapping.

## What Changed

### Created
- `public/rules/phases/normalize.yaml` — Three splice rules: AX->AH, NX->NG, WH->W

### Modified
- `public/rules/pipeline.yaml` — Added normalize phase before postlexical
- `public/rules/frontend.yaml` — Added normalize.yaml include
- `src/g2p/syllabify.ts` — Added AX to VOWELS set (so Hunnicutt stress counts schwas)
- `src/g2p/lts-engine.ts` — Removed mapElovitzToQlatt import/call, inlined prosodic marker filter
- `test/g2p-lts-engine.test.ts` — Removed mapElovitzToQlatt tests, updated expectations (AX no longer mapped to AH at LTS level)

### Deleted
- `src/g2p/phoneme-map.ts` — Responsibilities reassigned to normalize.yaml + inline filter

## CEL issue
- `string(int(current.stress))` failed — cel-js doesn't have `int()` builtin
- Used ternary chain instead: `current.stress == 1 ? "AH1" : (current.stress == 2 ? "AH2" : "AH0")`

## Behavioral changes
- `pronounce()` now returns raw Elovitz symbols (AX, NX, WH) instead of mapped (AH, NG, W)
- Full TTS pipeline output unchanged — normalize phase maps them before downstream rules fire
- G2P benchmark accuracy: "the" now shows as mismatch at pronounce() level (AX vs AH), but pipeline produces correct AH

## Test results
- All G2P tests: 178/178 pass (6/6 files)
- Full suite: 10 files failed, 17 tests failed — ALL pre-existing (voice quality snapshots, schema validation)
- No regressions from these changes
