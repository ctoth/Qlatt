# Goal
Declare #208's inline convenience syntax in the selected frontend while keeping the Direction Track authoritative.

# State
Approved bounded implementation on isolated base 5c18e8d1 is complete. No local CI runs. Other agents own unrelated inventory resource changes; preserve their work.

# Decisions and why
Smallest plan: about 170–220 production/data lines and 90–120 lines in existing input tests. Add optional inline_markers to the existing frontend document, validate it at resource acquisition, and require an explicit policy argument to parseInline. The DSL parser already preserves additional root fields. No new resource service, registry, automatic inline interpretation or authoring model.

Bundled policy keeps ((preset@degree)), *word*, strong emphasis and first global wins. Literal delimiter handling must preserve incomplete/malformed markers as score text; valid global markers are removed before computing word anchors. Preset names remain strings owned by the downstream affect library, not a TypeScript vocabulary. Keep existing unsigned decimal degree syntax. Selected emphasis levels use the existing DirectionTrack type.

# Surprises
The sole executable parseInline caller is the existing input test; src/input/index.ts exports it as a convenience API. It is not called automatically by TTS or the UI. Existing token cleanup strips unmatched asterisks; fix that cause by removing wrappers only after a complete match.

# Next step
Publish for hosted CI and respond to supervisor-owned Claude review. Actual scope is about 125 production/data additions and 90 existing-test additions, plus the existing API documentation update. Existing regressions cover inherited defaults, literal regex metacharacters, first/last selection, numeric/hyphenated names with downstream library authority, malformed text/declarations and stable anchors. No local CI gate or self-merge.
