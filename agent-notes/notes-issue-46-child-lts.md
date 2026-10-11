Parent: #46. This child covers only the scope below; it does not close the parent tracker.

Use existing YAML loaders, CEL/HRG, diagnostics and provenance contracts. Cite speech policy or label engineering estimates explicitly. Preserve unrelated behavior and extending frontend declarations. Implementation requires focused failing regressions, fixes, and the applicable repository gates.

## Scope
src/g2p/lts-engine.ts fixes A-Z, NUMBER/PUNCT, uppercase conversion, space padding and prosodic markers in TypeScript, and silently skips unmatched input.

## Acceptance
- Put input case mode, boundary marker, category membership/fallback and filtered prosodic markers in the cited LTS resource. Use Unicode rule keys instead of assuming only A-Z can own rules.
- Validate policy at load, cache compiled categories/marker sets with the rule resource, and migrate both bundled LTS tables without changing current English pronunciations.
- Emit bounded diagnostics for unmatched real input, identifying the original word, character and position; distinguish generated boundary markers from dropped user input. Wire diagnostics through pronounce/transcription into the existing frontend collector.
- Test Unicode rule keys, alternate categories/boundaries/case, configurable marker filtering, unmatched characters, no-rule categories and unchanged bundled words. Keep symbol normalization in its existing HRG phase.
- Local exploratory failing tests were started during #46 delivery and saved outside the clean PR; they are examples, not an approved public schema or implementation.
