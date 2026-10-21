# Static TTS schema declarations (#227)

## Goal
Move the static schema directly owned by TTS into frontend root schema declarations.

## State
Authorized scope stacked on PR439, pending its merge. Estimated110–160 TS additions,
130–160 deletions,250–320 YAML lines and80–120 existing fixture lines. No local CI.
Implemented the shared schema compiler, declarations in Qlatt/DECtalk roots
(Beauty inherits), TTS composition, and existing metadata/extends fixtures.
Included PR439's renamed-inventory fixture corrections through51c0c99d.
Also integrated439's configured DECtalk rate correction7e525a1c. Existing resolver
fixtures in rate, speaker profile, source contour and voice rule tests now compile
their configured declarations. Mutable rate fixtures compile at request time so
their subsequent policy edits still reach the intended runtime diagnostics.
Integrated439's correction9aadbc82: each request compiles a fresh cloned source,
removing compiler-generated voice policy before regeneration. This fixes the
actual readonly-policy and reserved-voice fixture failures without runtime edits.
Claude completed two passes over the original eleven files and the four-file
fixture delta throughcf4578a6 (session dcad206c-c8ad-405c-9e51-348ac0d5ff7e).
Accepted the live-fixture freeze finding, already corrected infe083fff; the
reserved generated voice policy was independently exposed by hosted CI and
corrected in the same helper. No other production findings. Reviewer explicitly
withdrew its initial claim that no fixture lost compiler metadata. The three
other migrated fixture files start from Qlatt (no generated voice policy); the
voice-rule fixture then supplies its authored SPEAKERS registry for first compilation.

## Decisions and why
- Reuse existing HrgSchema/FeatureSchema compilation with authored input checks.
- Keep normalization, tone and dynamic direction/frame/inventory ownership explicit.
- Preserve parameter-scope injection, feature insertion order and override order.
- Compiler paths retain source diagnostics and checked metadata; no new envelope.
- Parameter-scope injection occurs after final runtime composition, not on the
  static baseline, so dynamically appended Segment fields retain their order.
- Root schema declarations are appended to preserve existing authored line numbers.
- Other agents own separate scopes; preserve their master changes on integration.

## Surprises
None yet.

## Next step
Await final hosted CI and supervisor review of the correction; retarget after
PR439 merges. Full227 remains open for other schema owners/reference work.
