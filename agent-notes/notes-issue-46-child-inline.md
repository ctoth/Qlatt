Parent: #46. This child covers only the scope below; it does not close the parent tracker.

Use existing YAML loaders, CEL/HRG, diagnostics and provenance contracts. Cite speech policy or label engineering estimates explicitly. Preserve unrelated behavior and extending frontend declarations. Implementation requires focused failing regressions, fixes, and the applicable repository gates.

## Scope
src/input/inline.ts hardcodes two regexes, excludes digits/hyphens from preset names, maps emphasis only to strong, and selects the first global affect marker.

## Acceptance
- Add a validated inline_markers table in the input-policy owner, consumed by the existing convenience serializer. The Direction Track remains the authoritative input representation.
- Declare marker delimiters, emphasis mapping and global-affect selection policy. Preserve existing syntax and first-global-wins behavior in bundled defaults; support preset names containing digits and hyphens without restricting the preset vocabulary in TypeScript.
- Treat configured delimiters as literals, including regex metacharacters. Validate malformed declarations and handle unmatched markers as ordinary score text.
- Test configurable delimiters/levels, multiple global markers, numeric/hyphenated presets, degree parsing, malformed text and stable word anchors. No new inline-first authoring model.
