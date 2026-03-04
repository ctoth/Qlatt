# Consolidate qlatt-english Frontend — Kill All Globals

## Goal
Eliminate all hardcoded resource paths AND module-level inventory globals. Every path from frontend.yaml, every consumer gets inventory via params.

## Progress
- [x] Phase 1: Remove globals (inventory.ts, lts-engine.ts, morphology.ts, tts-frontend-provenance.ts)
- [x] Phase 2: Fix production consumers (track-assembler, tts-frontend, g2p/index, transcribe-text, scripts)
- [x] Phase 3: Introduce FrontendResources type + loadFrontendResources()
- [x] Phase 4: Thread morphologyPath through G2P chain
- [x] Phase 5: Move files + add YAML declarations
- [ ] Phase 6: Verify + test (IN PROGRESS)

## Bug Found & Fixed
**lts_path → noOpDictLookup regression**: Adding `lts_path` to qlatt-english's frontend.yaml
triggered `dictLookup: ltsPath ? noOpDictLookup : undefined` — disabling CMU dict for qlatt-english.
Fix: Added `skip_dictionary: true` to dectalk-english's frontend.yaml; changed condition to check
`frontendSpec.skip_dictionary` instead of `ltsPath`.

## Test Fix Progress
Starting: 22 failing files / 120 failures (+ 8 pre-existing)
After source fixes + test updates: 14 failing files / 59 failures

### Fixed test files:
- test/inventory-materialization.test.ts — explicit inventory loading (done in Phase 2)
- test/tts-frontend-output-contract.test.ts — explicit inventory loading (done in Phase 2)
- test/provenance-middleware.test.ts — dynamic citation (done in Phase 2)
- test/g2p-lts-engine.test.ts — added QLATT_LTS_PATH to all applyLtsRules calls
- test/g2p-morphology.test.ts — added QLATT_MORPHOLOGY_PATH to decomposeWord/getStressHintForWord
- test/declarative-frontend-slice.test.ts — added qlattInventoryResolver
- test/declarative-frontend-stop-closure-remap.test.ts — added qlattInventoryResolver
- test/declarative-frontend-rulepack-impact.test.ts — added qlattInventoryResolver
- test/declarative-frontend-integration-phases.test.ts — added qlattInventoryResolver
- Created test/utils/qlatt-english-inventory.ts — shared test fixture

### Pre-existing failures (confirmed on clean master):
- test/audio-node-guards.test.ts — 1 failure (AudioWorkletNode mock)
- test/semantics/jmespath-resolver.test.ts — 1 failure (module not found)
- test/declarative-frontend-rulepack-shape.test.ts — 1 failure (null vs undefined)
- test/declarative-frontend-schema.test.ts — 1 failure (validation)
- test/audit-dictionary.test.ts — 2 failures (envelope sanity, contrast separation)
- test/tts-frontend-output-contract.test.ts — 1 failure (EePhraseDb/RdPhraseOffset keys)
- test/dectalk-e2e.test.ts — 3 failures (AF non-finite params)
- test/declarative-frontend-rulepack-prosody.test.ts — 2 failures (numerical precision, AVS key)

### Remaining to fix:
- test/tts-frontend-snapshot.test.ts — 6 snapshot mismatches (need update)
- test/audit-dictionary.test.ts — 2 additional failures from our changes?
- Remaining declarative frontend tests? Check if any still fail
- Need to verify dectalk-e2e regression count

## Key Design Decisions
1. Tests explicitly name qlatt-english paths (e.g., QLATT_LTS_PATH) — correct for unit tests pinned to specific configurations
2. Created test/utils/qlatt-english-inventory.ts for shared inventoryResolver fixture
3. `skip_dictionary: true` in dectalk frontend.yaml — explicit flag instead of inferring from lts_path
