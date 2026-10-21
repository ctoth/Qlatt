# Declared inventory-column schemas (#227)

## Goal
Replace runtime target-value schema inference with declared inventory and phonology
column shapes, compiled through existing HRG shape/value enforcement.

## State
Implemented in an isolated checkout at fd8710d1 after PR433. Initial budget:
350–500 TypeScript lines changed including deletions, 180–300 YAML lines and
100–160 focused fixture lines. No local CI; hosted checks own validation.

## Decisions and why
- Preserve numeric base_params, host-owned features and target exclusions.
- Declare actual nested boundary, duration-model and DECtalk trajectory/profile
  shapes, including nullable booleans/times and optional bandwidth tracks.
- Reuse FeatureSchema and existing Item enforcement; no parallel validator or
  artifact envelope. Preserve shared phonology ownership and duplicate rejection.
- Cover shared parsing for sync, async and supplied programmatic inventory paths.
- Other agents own acquisition and unrelated TTS work; preserve those edits.

## Surprises
The existing area-function generator supplies derived_from/area_function metadata
that does not occur in shipped target rows. Declared that existing supported shape,
including its optional generated fields, without altering scientific computation
or the generator's pinned output. Existing inference/exclusion fixtures now declare
their additional column explicitly. No local tests or CI steps were run.
Initial hosted quality job119222031200 requested layout changes in the shared
schema compiler, inventory mapping and one fixture assertion. Applied its exact
formatting through apply_patch. The independent Claude full-PR review is running
in conversation69c91365-1ca0-479d-a6db-10f2a15b1fc2.

## Next step
Publish for hosted CI and full Claude review, correct actual scoped findings,
record the implementer response, and hand merge to supervisor. Issue227 remains
open for the broader compiler and non-inventory schema work.
