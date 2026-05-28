# Declarative Track Assembler Workstream - 2026-05-27

## Workflow Used

This document is the executable workstream for replacing the imperative track assembler policy path with a declarative control-score lowering path.

Requested execution timing: execute only after the current branch work is complete and merged down to `master`.

## Execution Prerequisites

- Current branch is `master`.
- `master` contains the completed and merged work from `beautify-declarative-f0-structural-templates`.
- `git status --short` has no tracked dirty or staged files before the first implementation edit.
- Unrelated untracked diagnostics, notes, caches, and generated folders remain untouched.
- If the checkout is not on `master`, stop and report the current branch, requested branch, and dirty/staged tracked paths.

## Final State

- The final track assembler is a mechanical lowering pass from a validated declarative control score plus a validated lowering spec into `KlattFrame[]`.
- `assembleKlattTrack(phoneSequence, parameterSequence, options)` no longer exists as a raw-token production API.
- The production frontend builds one complete `DeclarativeControlScore` and passes that score to the track lowering path.
- Timing, transition, F0, overlay, silence, and event-generation policy is declared in rulepack YAML and validated before lowering.
- TypeScript implements named lowering operators only. It does not choose frontend policy from raw token shape.
- Provenance and diagnostics distinguish score construction, lowering-spec validation, and frame emission.
- Tests and search gates prove no production caller still uses the old raw token assembler path.

## Owner Boundaries

Owned production files:
- `src/track-assembler.ts`
- `src/control-score.ts`
- `src/tts-frontend.ts`
- `src/tts-frontend-types.ts`
- `src/declarative-frontend/parser.ts`
- `src/declarative-frontend/validation.ts`
- `public/rules/frontends/qlatt-english/frontend.yaml`
- `public/rules/frontends/dectalk-english/frontend.yaml`

Owned tests:
- `test/track-assembler.test.ts`
- `test/track-assembler-output-config.test.ts`
- `test/control-score-builder.test.ts`
- `test/control-score-schema.test.ts`
- `test/declarative-frontend-schema.test.ts`
- `test/declarative-frontend-sync-axis.test.ts`
- `test/declarative-frontend-point-actions.test.ts`
- `test/declarative-frontend-integration-phases.test.ts`
- `test/declarative-frontend-integration-diagnostics.test.ts`

Non-owned paths:
- Rust DSP crates.
- AudioWorklet implementations.
- Paper library contents.
- Golden audio artifacts. Updating golden audio artifacts is a separate task outside this workstream.
- Unrelated diagnostics under `notes/`, `knowledge/`, `pyghidra_mcp_projects/`, and ad hoc debug scripts.

## Deletion Targets

- Delete the production raw-token assembler API: `assembleKlattTrack(phoneSequence, parameterSequence, options)`.
- Delete direct production reads of raw `control_windows` from `phoneSequence` inside the assembler.
- Delete direct production extraction of F0 point and F0 layer command tokens from `parameterSequence` inside the assembler.
- Delete assembler-owned loading of the default accent inventory.
- Delete assembler-owned frontend policy defaults and frontend-specific paths.
- Delete `AssembleTrackOptions` fields that encode frontend policy: `outputConfig`, `voiceQuality`, `sagDepthHz`, `sagMinSpanMs`, `f0Model`, and `speakerParams`.
- Delete tests whose only purpose is to prove missing raw-token `outputConfig` rejection after the new lowering spec is mandatory.

## Dependency Order

The phases are topologically ordered. Each item depends only on earlier items:

1. Control-score target schema
2. Lowering spec schema
3. Score builder completion
4. Mechanical lowering API
5. Frontend cutover
6. Old-path deletion and search gates
7. Provenance and diagnostics
8. Verification

Order check: every listed dependency appears earlier than its dependent item.

## Execution Rules

- Complete one phase at a time.
- Before each edit slice, run `git status --short`.
- Commit each intentionally edited source, test, or documentation slice before starting the next slice.
- Use path-limited `git status --short -- <paths>` and `git diff -- <paths>` before every commit.
- Commit with explicit paths only: `git commit -m "..." -- <explicit paths>`
- Do not commit generated diagnostics, caches, screenshots, audio output, or regenerated golden files.
- After every passing substantial targeted test run, reread this document and continue to the next unchecked phase.
- If a phase is blocked, stop and report the exact phase and unfinished checklist item.

## Phase 1 - Control-Score Target Schema

Status: completed

Scope:
- Replace `DeclarativeControlScore` v1 with a complete score shape that can drive track lowering without raw token access.
- The score contains these top-level sections:
  - `version`
  - `frontend_id`
  - `segments`
  - `timeline_marks`
  - `timed_controls`
  - `f0_points`
  - `f0_layer_commands`
  - `global_overlays`
  - `lowering_refs`
- `segments` carry phoneme, word, type, duration, transition override, sync marks, base params, source plan, filter plan, and prosody annotations.
- `timed_controls` carry resolved target segment ids, start/end offsets, field ops, and tags.
- `f0_points` carry resolved anchors or absolute time, value, tag, and accent type.
- `f0_layer_commands` carry resolved anchors or absolute time, layer, value, duration frames, profile points, and tag.
- `global_overlays` carry voice quality operations as field ops, not assembler-special-cased objects.
- `lowering_refs` names the lowering spec id and referenced YAML policy source paths.

Completion criteria:
- Type definitions in `src/tts-frontend-types.ts` express the full score shape.
- `validateDeclarativeControlScore()` rejects missing required sections and malformed ids, durations, field ops, anchors, and command references.
- No score field requires the lowering engine to inspect raw phone or parameter tokens.

Verification:
- `npm run test -- test/control-score-schema.test.ts`

## Phase 2 - Lowering Spec Schema

Status: completed

Scope:
- Replace the current flat `output:` handling with a validated lowering spec under frontend YAML.
- The spec declares:
  - timeline silence policy
  - duration floors
  - event point generation policy
  - transition blending policy
  - F0 renderer selection
  - F0 sag operator and parameters
  - layered F0 operator and parameters
  - output clamps
  - global overlay operation order
- `public/rules/frontends/qlatt-english/frontend.yaml` and `public/rules/frontends/dectalk-english/frontend.yaml` contain complete lowering specs.
- Every numeric policy value in the lowering spec has citations or an explicit engineering-estimate citation.

Completion criteria:
- Parser and validation code require a complete lowering spec.
- Missing spec sections fail loudly with stable error codes.
- Lowering spec validation does not silently supply frontend policy defaults.

Verification:
- `npm run test -- test/declarative-frontend-schema.test.ts test/track-assembler-output-config.test.ts`

## Phase 3 - Score Builder Completion

Status: completed

Scope:
- Update `buildDeclarativeControlScore()` so it is the only production reader of raw rule-engine token shapes for track-lowering data.
- Resolve segment ids, sync marks, timed control targets, F0 point anchors, F0 layer commands, voice-quality overlays, and lowering spec references into the score.
- Preserve rule tags and citations through score construction.
- Emit diagnostics for dropped malformed score inputs before validation rejects the score.

Completion criteria:
- `buildDeclarativeControlScore()` includes every field required by the Phase 1 schema.
- Score builder tests cover nasal control windows, F0 point events, layered F0 commands, voice-quality overlays, transition overrides, silence policy references, and deleted/suppressed tokens.
- `tts-frontend.ts` no longer reconstructs assembler-only options from frontend policy after score construction.

Verification:
- `npm run test -- test/control-score-builder.test.ts test/declarative-frontend-sync-axis.test.ts test/declarative-frontend-point-actions.test.ts`

## Phase 4 - Mechanical Lowering API

Status: completed

Scope:
- Replace the raw-token assembler API with a score-based lowering API.
- New production API:

```ts
lowerControlScoreToKlattTrack(
  score: DeclarativeControlScore,
  loweringSpec: TrackLoweringSpec,
  context: TrackLoweringContext,
): KlattFrame[]
```

- `TrackLoweringContext` contains only runtime values that are not frontend policy: effective base F0, resolved speaker numeric params, and inventory base params needed for already-declared segment params.
- Existing helper code for interpolation, filters, field ops, and frame emission remains only as implementation of named lowering operators.
- F0 sag reads accent type from the score and sag policy from the lowering spec.
- Layered F0 reads commands from the score and model parameters from the lowering spec.
- Control windows read from `score.timed_controls`, not segment-local raw token fields.
- Voice quality reads from `score.global_overlays`, not `AssembleTrackOptions.voiceQuality`.

Completion criteria:
- `src/track-assembler.ts` exposes the score-based lowering API.
- `src/track-assembler.ts` contains no production branch that scans raw `parameterSequence` or `phoneSequence`.
- Unit tests cover equivalent frame emission for basic segment timing, prev/next control windows, F0 point interpolation, H*-H* sag insertion, layered F0 commands, transition blending, initial silence, and final silence.

Verification:
- `npm run test -- test/track-assembler.test.ts test/track-assembler-output-config.test.ts`

## Phase 5 - Frontend Cutover

Status: completed

Scope:
- Update `src/tts-frontend.ts` to build, validate, and lower the complete score.
- Remove construction of assembler-specific options from `tts-frontend.ts`.
- Provenance records name:
  - score construction
  - lowering spec validation
  - track lowering
- `textToKlattTrackDetailed()` returns the same public track shape.

Completion criteria:
- Production frontend has exactly one track-lowering call site.
- The call site uses `lowerControlScoreToKlattTrack(score, loweringSpec, context)`.
- Frontend public API remains source-compatible for callers of `textToKlattTrack()` and `textToKlattTrackDetailed()`.

Verification:
- `npm run test -- test/tts-frontend-declarative-corpus.test.ts test/tts-frontend-declarative-prosody.test.ts test/declarative-frontend-integration-phases.test.ts`
- `npm run explain -- "hello world" --strict-citations`

## Phase 6 - Old-Path Deletion and Search Gates

Status: completed

Scope:
- Delete the old raw-token API and tests tied only to that API.
- Update imports, direct tests, diagnostic scripts, and profiling scripts to the score-based API or to the public frontend API.
- Remove stale comments that say the assembler reads `f0_layer` tokens or token-local `control_windows`.

Search gates:
- `rg -F "assembleKlattTrack(" src test scripts`
- `rg -F "parameterSequence" src/track-assembler.ts src/tts-frontend.ts`
- `rg -F "phoneSequence" src/track-assembler.ts src/tts-frontend.ts`
- `rg -F "extractLayerCommands(" src test`
- `rg -F "outputConfig" src test`
- `rg -F "voiceQuality" src/track-assembler.ts src/tts-frontend.ts`
- `rg -F "loadAccentInventorySync" src/track-assembler.ts src/tts-frontend.ts`

Completion criteria:
- Search gates show no production raw-token track-lowering path.
- Remaining hits are test fixtures for score construction, documentation of deleted behavior, or explicitly public frontend pipeline variables outside the lowering path.
- Every remaining hit is inspected and recorded in the phase commit message.

Verification:
- Run all search gates above.
- `npm run typecheck:core`
- `npm run typecheck:scripts`

## Phase 7 - Provenance and Diagnostics

Status: completed

Scope:
- Add provenance records for lowering-spec validation and score-to-frame lowering.
- Add diagnostics for rejected malformed lowering specs, malformed score sections, dropped timed controls, and F0 command references that fail validation.
- Remove provenance text that infers future runtime or semantics behavior from raw track params.

Completion criteria:
- Explain output identifies the declarative score and lowering spec as sources for frame decisions.
- Strict citation mode does not report uncited lowering policy.
- Diagnostics separate malformed score input from valid score lowering.

Verification:
- `npm run explain -- "hello world" --strict-citations`
- `npm run test -- test/declarative-frontend-integration-diagnostics.test.ts`

## Phase 8 - Verification

Status: pending

Scope:
- Run focused suites from Phases 1-7.
- Run type gates.
- Run the broad test suite.
- Run explain strict citation smoke.
- Confirm touched files are committed.

Verification commands:
- `npm run test -- test/control-score-schema.test.ts test/control-score-builder.test.ts`
- `npm run test -- test/track-assembler.test.ts test/track-assembler-output-config.test.ts`
- `npm run test -- test/tts-frontend-declarative-corpus.test.ts test/tts-frontend-declarative-prosody.test.ts`
- `npm run test -- test/declarative-frontend-schema.test.ts test/declarative-frontend-sync-axis.test.ts test/declarative-frontend-point-actions.test.ts test/declarative-frontend-integration-phases.test.ts test/declarative-frontend-integration-diagnostics.test.ts`
- `npm run typecheck:core`
- `npm run typecheck:scripts`
- `npm run explain -- "hello world" --strict-citations`
- `npm run test`

Completion criteria:
- All verification commands pass.
- `git status --short -- src/track-assembler.ts src/control-score.ts src/tts-frontend.ts src/tts-frontend-types.ts src/declarative-frontend/parser.ts src/declarative-frontend/validation.ts public/rules/frontends/qlatt-english/frontend.yaml public/rules/frontends/dectalk-english/frontend.yaml test/track-assembler.test.ts test/track-assembler-output-config.test.ts test/control-score-builder.test.ts test/control-score-schema.test.ts` is clean.
- No old production track-lowering path remains.

Failure rule:
- If a verification command fails, stop and report the exact command, failing test or file scope, and unfinished phase. The workstream is incomplete until the failure is fixed or the user explicitly changes the scope.
