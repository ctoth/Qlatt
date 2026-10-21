# Goal
Thread declared affect preset libraries through existing consumers, a bounded #141 slice.

# State
Implemented from c7a47b7f. Qlatt declares affect_presets; existing resource acquisition parses/caches it. Affect helpers require the parsed library, parser options carry it only to named-affect consumers, and TTS/render-beauty supply the selected resource. PR #355 awaits final CI and Claude review; no local CI run.

# Decisions and why
- Smallest change: roughly 90-140 production lines plus 100-180 fixture lines. Reuse FrontendResources, requireAsset and its existing cache; no new resolver or cache.
- Declare resources.affect_presets for Qlatt; Beauty inherits, DECtalk does not. Require the role only when a named affect is compiled; preserve no-affect paths.
- Pass the parsed library and degree curve explicitly. Preserve clinical selection, arithmetic, and direct local-to-global provenance parent edges.
- Global VQ validation/algebra and reference ownership remain outstanding. This is not full parse-only isolation or completion of #141. Resource relocation remains a follow-up.
- Other agents are active. Do not alter adjacent rate logic or revert others' changes.

# Surprises
The old unknown-channel fixture depended on import-time loading; it now calls the parser explicitly. Existing snapshot, clinical, projection and provenance assertions remain, with explicit fixture libraries. Added inherited-resource, absent-role and selected-library curve coverage. Fixture reformatting increases the line diff beyond the initial estimate without expanding runtime scope.

Initial hosted quality job 119055685746 reported one import ordering error at src/input/affect.ts:35. Corrected the named-import order exactly as emitted; no behavior change.

# Next step
Inspect replacement hosted CI and respond to independent Claude review. #141 remains open.
