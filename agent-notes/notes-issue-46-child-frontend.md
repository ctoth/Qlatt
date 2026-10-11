Parent: #46. This child covers only the scope below; it does not close the parent tracker.

Use existing YAML loaders, CEL/HRG, diagnostics and provenance contracts. Cite speech policy or label engineering estimates explicitly. Preserve unrelated behavior and extending frontend declarations. Implementation requires focused failing regressions, fixes, and the applicable repository gates.

## Scope
src/tts-frontend.ts still uses rate ?? 1, clamp limits 0.5/2, transitionMs=30 at public entry points, and excludes dur/SW/type by literal name while deriving parameter keys.

## Acceptance
- Move default rate and normalized rate bounds into cited frontend policy; runtime reads the selected frontend's values. Preserve current bundled values and explicit caller overrides.
- Use the existing lowering.transitions.default_transition_ms declaration when the caller omits an override, rather than overwriting it with a TypeScript default. Preserve configured transition scaling and fallback reporting already required by #70.
- Declare the excluded parameter names in the owning configuration, or derive them from existing schema metadata where that already expresses the same distinction. No frontend-name branches or second registry.
- Validate finite defaults/bounds and required declarations, and test changed policy values, omission, explicit overrides, inherited frontends and unchanged controls.
- Coordinate with #160: that issue owns rate/reference diagnostics and removal of 8/5 Hz continuation fallbacks; this child owns the remaining declarative defaults/bounds and parameter-selection policy. Avoid duplicate diagnostics or competing rate configuration.
