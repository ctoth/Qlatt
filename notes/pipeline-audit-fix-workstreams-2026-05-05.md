# Qlatt Pipeline Audit Fix Workstreams - 2026-05-05

## Workflow Used

This document is the active control surface for the pipeline audit fixes requested on 2026-05-05. It converts the audit findings into executable workstreams and defines the order in which they must be completed.

## Dependency Order

The workstreams are topologically ordered. Each item may depend only on earlier items:

1. Coordination document
2. Voiced-stop duration bug
3. Normalize phase execution
4. Rule tags completion
5. No silent fallback constants
6. Klatt 1976 duration model
7. Aspiration/frication routing
8. A7-A10 versus 5 kHz output low-pass
9. Glottal modulation OQ and Fant source model
10. Nasal pole-zero model
11. Phase boundary cleanup
12. Final verification

Order check: every listed dependency is earlier than its dependent item.

## Execution Rules

- Complete one workstream at a time.
- Before each edit slice, check `git status --short`.
- After editing a file, inspect the path-limited diff and create an atomic commit for the intentionally owned file(s) before moving to the next slice.
- Do not use broad git commands. Stage and commit only explicit paths.
- After every passing substantial targeted test run, reread this document and continue to the next unchecked item.
- If an item is blocked, stop and report the exact blocked item.

## Workstreams

### 1. Coordination document

Status: completed

Completion criteria:
- This document exists.
- The dependency order is explicit and passes the order check above.
- The document is committed before production edits.

### 2. Voiced-stop duration bug

Status: in_progress

Scope:
- Update the voiced-stop branch in `public/rules/frontends/qlatt-english/phases/duration.yaml` so vowels before voiced stop closures can receive the voiced-stop duration multiplier.
- Add or update a focused test proving a vowel before /d/ or /b/ uses the voiced-stop branch after structural expansion.

Verification:
- Targeted duration/frontend test passes.
- An explain trace or test fixture proves the branch is reachable.

### 3. Normalize phase execution

Status: pending

Scope:
- Wire the declared `normalize` phone phase into the main `tts-frontend.ts` sequence before `postlexical`.
- Add a focused test for a normalized phone symbol such as `AX`, `NX`, or `WH`.

Verification:
- Targeted normalize/frontend tests pass.

### 4. Rule tags completion

Status: pending

Scope:
- Add tags to non-trivial scalar apply entries missing `tag`, especially formant locus and SW assignment rules.
- Add validation or a focused test requiring tags for non-trivial apply entries in the qlatt English phases.

Verification:
- Rulepack validation or new tag coverage test passes.
- `npm run explain -- "hello world" --strict-citations` still passes.

### 5. No silent fallback constants

Status: pending

Scope:
- Remove silent fallback constants that duplicate declarative policy or semantics values.
- Replace with typed errors or diagnostics when required configuration is missing.
- Prioritize `engine.ts`, `klatt-interpreter.ts`, `prosodic-annotator.ts`, and `track-assembler.ts`.

Verification:
- Focused malformed-config tests prove missing required constants fail loudly.
- Existing targeted tests pass.

### 6. Klatt 1976 duration model

Status: pending

Scope:
- Replace multiply-then-floor duration shortening with Klatt 1976 Eq. 1 semantics for compressible duration.
- Keep each duration change cited and traceable.

Verification:
- Tests cover Klatt Eq. 1 examples from `papers/Klatt_1976_SegmentalDuration/notes.md`.
- Affected golden snapshots are updated only if the new behavior is intended.

### 7. Aspiration/frication routing

Status: pending

Scope:
- Stop routing AH through the frication source via `max(AF, AH)` in parallel mode.
- Make the AF/AH routing decision declarative and cited.

Verification:
- A targeted semantics/runtime test proves stop aspiration can have AH without forced AF-derived frication gain.
- PLSTEP behavior remains intentional.

### 8. A7-A10 versus 5 kHz output low-pass

Status: pending

Scope:
- Resolve the contradiction between high-frequency fricative targets and the Klatt80 output reconstruction filter.
- Either make high-frequency fricative rendering use an experiment path without the 5 kHz low-pass or make the low-pass configurable with citations.

Verification:
- Spectral or config tests prove high-frequency formants are audible only in a configuration that permits them.
- Comments no longer claim inaudible high-frequency output in the baseline path.

### 9. Glottal modulation OQ and Fant source model

Status: pending

Scope:
- Do not rely on Fant 1995 until notes exist.
- Align `glottalModOQ` with a checked paper source or rename it if it intentionally differs from Fant OQi.

Verification:
- Semantics tests cover Fant 1997 Rd/OQi table values or the renamed non-OQi control.

### 10. Nasal pole-zero model

Status: pending

Scope:
- Add vowel-dependent nasal pole and zero endpoint controls.
- Move both FNP and FNZ during vowel nasalization windows where Hawkins & Stevens requires it.
- Keep nasal murmur place antiformants separate from vowel nasalization.

Verification:
- Tests cover a vowel-nasal context and assert the intended FNZ/FNP relationship.

### 11. Phase boundary cleanup

Status: pending

Scope:
- Move formant/locus/coarticulation rules out of the `duration` phase into the `formant` phase after behavior is stable.
- Preserve ordering dependencies explicitly.

Verification:
- Trace tests show decisions are labeled by the correct phase.
- Existing frontend integration tests pass.

### 12. Final verification

Status: pending

Scope:
- Run the targeted tests created above.
- Run broader frontend/declarative tests if feasible.
- Run `npm run explain -- "hello world" --strict-citations`.
- Confirm `git status --short` has no uncommitted changes in touched files.
