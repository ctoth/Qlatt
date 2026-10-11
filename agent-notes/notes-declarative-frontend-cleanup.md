# Declarative Frontend YAML Cleanup — Progress Notes

## Goal
Restructure monolithic `frontend.yaml` (1547 lines) into smaller focused YAML files, wire up `include` resolution, hoist magic numbers, standardize provenance.

## Verification Strategy
Golden tests (`npm run test:golden`) are the safety net, NOT byte-for-byte JSON diff.
When splitting files, normalize as we go (citations → array, kind consistency).
Baseline JSON is for sanity-checking rule counts, not exact match.

## Task Tracker
- [x] Step 0: Baseline spec snapshot — commit eea503b, 77,683 bytes, 49 rules, 5 phases
- [x] Step 1: Wire include resolution in rule-pack.ts — commit 5c59d0d
- [x] Step 2: Split rules + normalize citations — commits 7c099c0, 64f46b1
- [x] Step 3: Extract pipeline orchestration — commit 136d3de
- [x] Step 4: Hoist CEL magic numbers to parameters — commit 918e085
- [x] Step 5: MERGED INTO Step 2
- [x] Step 6: Version alignment — commit 80cc458

## Progress Log
### Step 0 (done)
- Commit: eea503b
- Export: `QLATT_V12_CEL_RULEPACK` from rule-pack.ts:71
- Baseline: tmp/baseline-spec.json, 77,683 bytes, 49 rules, 5 phases, v12-cel
- Top-level keys: version, parameters, input_contract, streams, topology, predicates, patterns, phases, rules, interpolation, output, transcription, include

### Step 1 (done)
- Commit: 5c59d0d
- Added resolveIncludePath to yaml-loader.ts
- Added mergeChildIntoRoot, resolveIncludesSync, resolveIncludesAsync to rule-pack.ts
- Merge semantics: rules/predicates/patterns/streams by key (error on dup), phases concat, topology concat+dedup, others root-wins
- All 568 tests pass, spec dump identical (no-op since no includes yet)
- Pre-existing golden test length mismatch noted

### Step 2 (done)
- Commits: 7c099c0 (parser+provenance), 64f46b1 (YAML split)
- Migration script: scripts/split-rules.ts — read/parse/split/normalize/rewrite
- Parser: citation → citations array, handles both formats
- Provenance: reads citations array directly
- 5 rule files created: postlexical(2), structural(6), duration(13), formant(18), prosody(10) = 49 total
- All 568 tests pass, golden test failure is pre-existing

### Step 3 (done)
- Commit: 136d3de
- Migration script: scripts/extract-pipeline.ts
- pipeline.yaml: predicates(2), streams(2), phases(5)
- frontend.yaml: now 391 lines, only version + include + parameters + output + transcription
- All 568 tests pass

### Step 6 (done)
- Commit: 80cc458
- frontend.yaml: v12-cel → v13-cel
- Added version: v1 to pipeline.yaml, all 5 rule files, lts-rules.yaml, morphology.yaml
- Converted _source/_reference_impl and comment citations to structured citations arrays

### Step 4 (done)
- Commit: 918e085
- Migration script: scripts/hoist-magic-numbers.ts (549 lines)
- Added 31 new named parameters: 3 duration, 2 f0, 26 formant
- Replaced 41 hardcoded values across 4 rule files with params.policy.* references
- All 568 tests pass
