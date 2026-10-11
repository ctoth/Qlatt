Parent: #46. This child covers only the scope below; it does not close the parent tracker.

Use existing YAML loaders, CEL/HRG, diagnostics and provenance contracts. Cite speech policy or label engineering estimates explicitly. Preserve unrelated behavior and extending frontend declarations. Implementation requires focused failing regressions, fixes, and the applicable repository gates.

## Scope
The old MIN_TRANSITION_EDGE_MS literal has already moved to lowering.transitions.min_transition_edge_ms on current master. Remaining evidence is the profilePoints three-role requirement in src/declarative-frontend/hrg/lowering.ts and the type == silence pauseScale gate.

## Acceptance
- Make pause-scale eligibility use the selected inventory/rulepack's declared silence identity or an authored eligibility expression, preserving punctuation pauses and ordinary-segment controls.
- Declare the profile role order and count in the owning F0 model schema, and validate against the consuming model's contract before lowering. Preserve the DECtalk model's existing voiceless/plosive/stressed ordering; do not silently generalize a fixed DSP ABI.
- Verify the configured minimum transition edge is consumed, and record existing evidence rather than duplicating its completed migration.
- Test renamed silence symbols/types, pauseScale controls, malformed/missing/reordered profile declarations and valid DECtalk rendering. Include initial-silence offsets in time assertions.
- Coordinate with #164 for transition/time-projection diagnostics; that broader observation work is excluded.
