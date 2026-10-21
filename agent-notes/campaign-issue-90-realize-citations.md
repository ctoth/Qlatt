# Goal
Make existing realization-rule citations an explicit, validated optional field for #90.

# State
Implemented the optional type field and shared post-expansion validation across all four loader paths. Existing fixtures cover invalid supplied arrays, citation template substitution, whole-entry child replacement, and preserved raw constants/string rules. Isolated branch from origin/master 572d39e2.

# Decisions and why
Smallest change: about 25–40 production lines and 35–55 existing fixture lines. Add optional string-array citations to RealizationRule. All four semantics load paths expand first, then reject supplied empty/non-string/blank citation arrays. Preserve absent citations, string rules, raw constants, and whole-entry inheritance. Existing Laine citations remain unchanged; no new scientific attribution or YAML migration.
This is partial #90: required citations for every rule, typed source kinds, portable build-time catalog, constants metadata, and Bacon-owned registry validation remain separate. No runtime papers dependency or new collector.

# Surprises
None.

# Next step
Publish for hosted CI and Claude review. No local CI or test commands run.
