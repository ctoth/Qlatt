# Plan: Frontend Speech Quality Improvement (Rules + G2P + Prosody)

## 1. Objective

Improve perceived naturalness and intelligibility of Qlatt speech output by upgrading:

1. Text normalization and G2P fallback behavior
2. Duration, coarticulation, and intonation rules
3. Segmental acoustic targets (formants, bandwidths, frication, releases)
4. Voice-source controls where frontend policy should drive source quality

All new rule/policy logic must carry explicit literature citations in code/comments.

## 2. Scope

### In scope

1. `public/rules/*.yaml` policy/rule/inventory updates
2. `src/g2p/*` normalization, LTS fallback behavior, stress/allomorph behavior
3. `src/tts-frontend.ts` pipeline wiring and provenance behavior
4. Metric and regression scripts/tests under `scripts/` and `test/`

### Out of scope

1. Replacing formant synthesis with neural TTS
2. Re-architecting the declarative engine core unless required for correctness
3. Interactive dashboard work as a prerequisite

## 3. Observability Strategy (CLI First)

Current explain infrastructure is already strong for rule-level debugging:

1. `scripts/explain-phrase.ts`
2. `scripts/explain-summary.ts`
3. `scripts/tts-dsl.ts`
4. `scripts/export-declarative-corpus-summary.ts`

Plan decision:

1. Keep CLI + JSON artifacts as source-of-truth instrumentation
2. Extend batch metric export and CI gates first
3. Defer dashboard to optional future work if CLI/report iteration proves too slow

## 4. Quality Gates (Applied Across All Phases)

1. No uncited new paper-derived constants/rules
2. Golden corpus regression remains controlled (`test:golden` and declarative summary tests)
3. New scripts produce machine-readable outputs suitable for CI diffing
4. Rule changes include explicit rationale and citations in YAML fields or adjacent comments

## 5. Workstreams

## 5.1 Workstream A: Baseline Metrics + Regression Expansion

### Why

Without objective and perceptual tracking, tuning is anecdotal.

### Literature

1. Eyben et al. 2015 (GeMAPS feature families)
2. Kreiman & Gerratt 2010 (measurement validity cautions)
3. Ericsson 2020 (formant evaluation pitfalls)

### Deliverables

1. Extend corpus summary export beyond event count/time/F0 min-max
2. Add batch acoustic metrics export script for phrase sets
3. Add test assertions for non-regression envelopes (not exact waveform equality)
4. Add listening-test-ready artifact generation (paired A/B JSON manifests)

### Code touchpoints

1. `scripts/export-declarative-corpus-summary.ts`
2. `scripts/` new metric export script(s)
3. `test/tts-frontend-declarative-golden-summary.test.ts`
4. `test/golden/declarative-corpus-summary.json` update process

### Acceptance

1. CI-visible summary includes duration/prosody/segmental metric families
2. Rule changes can be compared by corpus-level metric deltas

## 5.2 Workstream B: Citation and Parameter Audit in Existing Rules

### Why

Several current citations/values are mismatched or underspecified.

### Literature

1. Stevens & House 1956
2. Sproat & Fujimura 1993
3. Recasens 2012
4. Fujimura 1962
5. Jongman 1989/2000
6. Hombert et al. 1979
7. O'Shaughnessy 1976

### Deliverables

1. Correct citation-year/topic mismatches in `frontend.yaml`
2. Mark engineering estimates explicitly where data is absent
3. Align parameter ranges to cited empirical ranges where feasible
4. Add a strict-citation check step in dev workflow docs

### Code touchpoint

1. `public/rules/frontend.yaml`

### Acceptance

1. No known high-severity citation conflicts remain
2. `explain-phrase --strict-citations` is clean for target corpora

## 5.3 Workstream C: Text Normalization Upgrade (Semiotic Classes)

### Why

Normalization errors are high-salience and degrade perceived quality immediately.

### Literature

1. Ebden & Sproat 2014/2015 (Kestrel architecture)
2. Allen, Hunnicutt & Klatt 1987 (MITalk text analysis practices)

### Deliverables

1. Move from regex-only normalization toward semiotic class handling:
   1. cardinal/ordinal/decimal
   2. currency
   3. time/date
   4. structured abbreviation handling
2. Preserve style/order where needed to support correct verbalization
3. Add normalization corpus tests for NSW categories

### Code touchpoints

1. `src/g2p/text-normalize.ts`
2. `test/g2p-text-normalize.test.ts`

### Acceptance

1. NSW test set shows improved verbalization correctness
2. No regressions on existing normalization behavior

## 5.4 Workstream D: G2P Fallback + Disambiguation Improvements

### Why

Dictionary misses are inevitable; fallback quality dominates perceived errors for OOV words.

### Literature

1. Elovitz et al. 1976 (NRL LTS)
2. Hunnicutt 1976
3. Black et al. 1998 (CART LTS strategy)
4. Liu 2008 (TTBL disambiguation pattern)
5. Montoyo et al. 2005 (hybrid disambiguation concept)

### Deliverables

1. Improve fallback behavior for OOV and ambiguous forms
2. Expand morphology/stress interactions and edge-case handling
3. Add contextual disambiguation strategy for homograph-like failures
4. Add focused G2P evaluation corpus and tests

### Code touchpoints

1. `src/g2p/lts-engine.ts`
2. `src/g2p/stress.ts`
3. `src/g2p/morphology.ts`
4. `src/g2p/index.ts`
5. `public/rules/lts-rules.yaml`
6. `public/rules/morphology.yaml`
7. `test/g2p-*.test.ts`

### Acceptance

1. OOV/hard-word test corpus improves versus current baseline
2. No regression in dictionary-path pronunciations

## 5.5 Workstream E: Duration Model Modernization

### Why

Timing is a primary perceptual cue; independent multipliers are insufficient.

### Literature

1. Klatt 1976
2. Campbell & Isard 1991
3. van Santen 1994
4. van Santen 1997
5. Crystal & House 1988

### Deliverables

1. Keep incompressibility floors explicit and enforced
2. Add stronger syllable/phrase-level duration behavior
3. Improve release vs closure timing logic for connected speech contexts
4. Expand duration regression tests with context classes

### Code touchpoints

1. `public/rules/frontend.yaml`
2. `test/tts-frontend-declarative-prosody.test.ts`
3. `test/tts-frontend-declarative-corpus.test.ts`

### Acceptance

1. Duration metrics align better with known contextual trends
2. Phrase-final and stress effects are audibly and measurably improved

## 5.6 Workstream F: Intonation/Prosody Model Expansion

### Why

Current F0 behavior is functional but limited in expressiveness and boundary behavior.

### Literature

1. O'Shaughnessy 1976
2. Pierrehumbert 1980
3. Ladd 2008
4. Beckman/Jun 2022 (ToBI conventions)
5. Taylor 2000 (Tilt model)
6. Fujisaki model references in collection

### Deliverables

1. Add clearer phrase-accent and boundary-tone behaviors
2. Improve downstep/reset handling across phrase boundaries
3. Expand punctuation/prosodic boundary mapping beyond current heuristics
4. Add prosodic pattern test phrases for declarative/question/continuation contours

### Code touchpoints

1. `public/rules/frontend.yaml`
2. `test/declarative-frontend-rulepack-prosody.test.ts`
3. `test/tts-frontend-declarative-prosody.test.ts`

### Acceptance

1. F0 contour classes are distinguishable and stable across corpus phrases
2. Question and continuation contour handling is robust

## 5.7 Workstream G: Coarticulation and Transition Fidelity

### Why

Static per-phoneme targets create synthetic discontinuities.

### Literature

1. Öhman 1966
2. Recasens et al. 1997 (DAC framing)
3. Stevens & House 1956
4. Sproat & Fujimura 1993
5. Espy-Wilson et al. 2000

### Deliverables

1. Strengthen VCV and transconsonantal transition modeling
2. Refine /l/ and /r/ context-dependent targets and trajectories
3. Improve anticipatory/carryover conditioning in rule policy
4. Add transition-shape regression cases in corpus tests

### Code touchpoints

1. `public/rules/frontend.yaml`
2. `public/rules/inventory.yaml`
3. `test/declarative-frontend-rulepack-context.test.ts`

### Acceptance

1. Transition metrics and listening checks show fewer abrupt artifacts
2. /l/ and /r/ contexts sound materially improved

## 5.8 Workstream H: Fricative/Stop Spectral and Timing Refinement

### Why

Obstruents are common failure points for perceived clarity and naturalness.

### Literature

1. Jongman et al. 2000
2. Shadle 1985
3. Stevens 1971
4. Blumstein & Stevens 1979
5. Zue 1976
6. Lisker & Abramson 1964

### Deliverables

1. Refine fricative place-dependent spectral shaping targets
2. Improve stop burst/release templates by place and context
3. Revisit minimum duration constraints by fricative class with explicit caveats
4. Add targeted obstruent intelligibility phrase set and tests

### Code touchpoints

1. `public/rules/inventory.yaml`
2. `public/rules/frontend.yaml`
3. `test/phrase-sets/` additions
4. `test/tts-frontend-declarative-corpus.test.ts`

### Acceptance

1. Obstruent-focused corpus shows improved separability and fewer confusions
2. No regression in existing stop/aspiration insertion logic

## 5.9 Workstream I: Vowel Targets, Bandwidths, and Source-Quality Coupling

### Why

Static vowel targets and broad bandwidth defaults cap naturalness and speaker realism.

### Literature

1. Peterson & Barney 1952
2. Hillenbrand et al. 1995
3. Kent & Vorperian 2018
4. de Cheveigné 1999
5. Fant et al. 1985
6. Fant 1997
7. Klatt & Klatt 1990
8. Childers & Lee 1991
9. Hanson 1997
10. Burkhardt 2009
11. Gobl 2021
12. Perrotin 2021

### Deliverables

1. Re-tune vowel targets/bandwidths with explicit speaker-profile assumptions
2. Add dynamic bandwidth or quality controls where justified
3. Define frontend policy hooks for voice-quality presets (without destabilizing baseline)
4. Add source-quality metric export (H1-H2/H1-A3 style proxies where feasible)

### Code touchpoints

1. `public/rules/inventory.yaml`
2. `public/rules/frontend.yaml`
3. `src/tts-frontend.ts` (policy wiring if needed)

### Acceptance

1. Vowel-space and bandwidth metrics move toward cited ranges
2. Quality presets are reproducible and citation-backed

## 6. Sequencing

Recommended execution order:

1. Workstream A
2. Workstream B
3. Workstream C
4. Workstream D
5. Workstream E
6. Workstream F
7. Workstream G
8. Workstream H
9. Workstream I

Rationale:

1. Establish measurement and citation correctness first
2. Fix highest-salience frontend errors (normalization/G2P/timing/prosody)
3. Then push segmental/acoustic realism and voice quality ceiling

## 7. Citation Discipline Rules (Implementation Policy)

For every paper-derived change:

1. Include citation directly in YAML `citation`/`citations` fields or adjacent code comments
2. If value is heuristic, mark it explicitly as `engineering estimate`
3. If two sources disagree, annotate which source governs the chosen value and why

## 8. Completion Criteria

Plan is complete when:

1. All workstreams have merged or been explicitly deferred with reason
2. Citation hygiene is enforced in changed rule areas
3. Corpus-level metric artifacts and listening-test manifests are part of normal workflow
4. Frontend quality improvements are observable in both regression metrics and A/B listening outputs
