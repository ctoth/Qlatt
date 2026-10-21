# Static TTS schema declarations (#227)

## Goal
Move the static schema directly owned by TTS into frontend root schema declarations.

## State
Authorized scope stacked on PR439, pending its merge. Estimated110–160 TS additions,
130–160 deletions,250–320 YAML lines and80–120 existing fixture lines. No local CI.
Implemented the shared schema compiler, declarations in Qlatt/DECtalk roots
(Beauty inherits), TTS composition, and existing metadata/extends fixtures.
Included PR439's renamed-inventory fixture corrections through51c0c99d.

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
Publish for hosted CI and private Claude review/response; integrate master after
PR439 merges. Full227 remains open for other schema owners/reference work.
