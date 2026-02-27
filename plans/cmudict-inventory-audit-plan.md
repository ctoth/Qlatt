# Plan: CMUdict-Driven Inventory QA Expansion

## 1. Objective

Build an automated inventory quality gate that detects weak/incorrect realizations (like underpowered `TH/DH`) by sweeping CMUdict words through `textToKlattTrack()` and validating realized acoustic-control envelopes and phoneme contrasts.

This plan extends existing audit infrastructure; it does not replace it.

## 2. Existing Assets To Reuse

1. `test/audit-dictionary.test.ts`
2. `scripts/build-cmudict.ts`
3. `scripts/profile-tts.ts`
4. `test/tts-frontend-declarative-corpus.test.ts`

Key reusable mechanics already present:

1. CMUdict loading
2. Deterministic subset/full-audit selection (`FULL_AUDIT=1`)
3. Track caching
4. Segment extraction from frame streams
5. Audit-style fail-fast test blocks

## 3. Gaps To Close

Current audit checks structure and timing behaviors, but does not yet verify:

1. Per-phoneme realized parameter envelopes (`AF`, `AH`, `AV`, `SW`, `A1..A6`, duration)
2. Contrast separation between confusable classes (`TH` vs `S`, `DH` vs `Z`, etc.)
3. Dead/rare phoneme detection in selected corpora
4. Stable machine-readable reporting for CI diff review

## 4. Workstreams

## 4.1 Workstream A: Extract Shared Audit Utilities

### Deliverables

1. Add `test/utils/cmudict-audit.ts` for:
   1. dictionary loading
   2. subset/full selection
   3. segment extraction
   4. realized token collectors
2. Refactor `test/audit-dictionary.test.ts` to consume these utilities.

### Acceptance

1. Existing audit tests remain green with no behavior regression.
2. New utility module becomes the single source for CMUdict sweep mechanics.

## 4.2 Workstream B: Phoneme Envelope Audit Block

### Deliverables

1. Add new audit block in `test/audit-dictionary.test.ts`:
   1. collect realized frames by `phoneme`
   2. compute per-phoneme stats (`count`, `min`, `p10`, `p50`, `p90`, `max`) for key params
2. Define envelope assertions for critical classes:
   1. fricatives: `SW` routing and frication floors
   2. voiced/voiceless obstruent voicing sanity (`AV`)
   3. class-specific checks for known fragile phones (`TH`, `DH`, `HH`)
3. Emit compact failure diagnostics showing offending words/tokens.

### Acceptance

1. The audit fails when a phoneme class collapses to near-silence.
2. Failure output identifies which phoneme and which parameter broke.

## 4.3 Workstream C: Contrast-Separation Audit Block

### Deliverables

1. Add contrast checks to `test/audit-dictionary.test.ts` using realized distributions:
   1. `TH` vs `S`
   2. `DH` vs `Z`
   3. `F` vs `TH`
2. Use robust criteria (distribution overlap and minimum median deltas), not exact point values.

### Acceptance

1. Audit fails if contrasts become indistinguishable by configured thresholds.
2. Failure output includes both class summaries and overlap metrics.

## 4.4 Workstream D: Dead-Phoneme + Coverage Guardrails

### Deliverables

1. Add minimum-sample checks per phoneme in chosen audit mode.
2. Report phones missing from subset and require full-audit mode for complete coverage assertions.
3. Add allowlist for expected-low-frequency phones when justified.

### Acceptance

1. Audit distinguishes true regressions from expected subset sparsity.
2. Full-audit mode provides deterministic complete-coverage checks.

## 4.5 Workstream E: CI-Friendly Artifact Export

### Deliverables

1. Add script `scripts/export-cmudict-inventory-audit.ts` that writes JSON summary artifact:
   1. per-phoneme envelope stats
   2. contrast metrics
   3. coverage status
2. Wire docs in `README.md` with commands for:
   1. quick subset run
   2. full audit run
   3. artifact export

### Acceptance

1. JSON artifact is stable and diffable in CI.
2. Engineers can inspect regressions without rerunning interactive debugging first.

## 5. Suggested Threshold Policy

1. Keep thresholds conservative initially and anchored to current known-good behavior.
2. Store thresholds in one location (test constants or small JSON config).
3. Require commit justification when threshold changes are made.
4. Prefer percentile-based thresholds over hard maxima/minima where possible.

## 6. Citation Discipline

When introducing or adjusting envelope thresholds tied to phonetic behavior:

1. Add citations in code comments next to threshold definitions.
2. Mark heuristics as `engineering estimate` when direct empirical bounds are unavailable.
3. For conflicting sources, note which source governs and why.

## 7. Issue Triage And Resolution Playbook

When audits surface many findings, process them with a fixed triage policy:

1. Classify issue type:
   1. data/coverage gap
   2. inventory target issue (`public/rules/inventory.yaml`)
   3. context/rule logic issue (`public/rules/frontend.yaml`)
   4. G2P/pipeline source issue (`src/g2p/*`, transcription path)
   5. expected variance (documented)
2. Attach evidence bundle:
   1. failing metric and threshold
   2. top offending words/contexts
   3. subset vs full-audit reproduction status
   4. concise A/B phrase examples
3. Assign priority:
   1. P0 intelligibility/collapse
   2. P1 major naturalness
   3. P2 moderate drift
   4. P3 low-impact tails
4. Resolve using strict dispositions:
   1. fix now (high confidence, harmful)
   2. temporary allowlist (ticketed, low impact)
   3. threshold adjustment (only with evidence/citation)
5. Require closure artifacts:
   1. code/rule change
   2. focused regression test
   3. updated audit output proving improvement

## 8. Execution Sequence

1. Workstream A
2. Workstream B
3. Workstream C
4. Workstream D
5. Workstream E

## 9. Completion Criteria

Plan is complete when:

1. Existing CMUdict audit suite includes envelope and contrast checks.
2. At least one prior real defect class (e.g., weak `TH/DH`) is caught automatically by audit.
3. CI can run subset mode by default and full mode optionally.
4. Audit results are available as machine-readable artifact for regression review.
