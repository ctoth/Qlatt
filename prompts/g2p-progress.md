# G2P Implementation Progress

## Goal
Replace naive guessPronunciation() with multi-layered G2P: text normalization, Elovitz LTS rules, morphological decomposition, Hunnicutt stress, postlexical rules.

## Phase Status

| Phase | Status | Commit | Notes |
|-------|--------|--------|-------|
| 0 - Rule extraction | DONE | (no commit) | 329 rules in src/g2p/lts-rules.json, cross-verified from 3 impls |
| 1 - Text normalize | DONE | cef89f9 | 31/31 tests pass. numberToWords to 999M, ordinals, abbreviations |
| 2 - Elovitz LTS engine | DONE | 10dd7af | 40/40 tests pass. 329 rules, phoneme-map, lts-engine |
| 3 - Morphology | DONE | 0fc7041 | 18/18 tests pass. types.ts, morphology.ts, morphology.yaml created |
| 4 - Stress assignment | DONE | 0b90835 | 27/27 tests pass. syllabify.ts, stress.ts |
| 5 - Pipeline integration | DONE | a3b39ed | 40/40 pipeline tests, 426/427 full suite (1 pre-existing). Punctuation fixed. 95% accuracy benchmark. guessPronunciation deleted |
| 6 - Postlexical rules | DONE | 1aa8f01 | Added postlexical phase + rules (`the_prevocalic_reduction`, `t_flapping`), DX inventory target, and `test/g2p-postlexical.test.ts` (7/7). |

## Dispatch Log
- Wave 1: Phase 0, Phase 1, Phase 3 dispatched in parallel
- Phase 6 completion verified on workspace state: `test/g2p-postlexical.test.ts` 7/7 pass; `test/declarative-frontend-integration-phases.test.ts` 1/1 pass; full suite currently has 2 unrelated failures in declarative frontend tests.
