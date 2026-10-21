# Goal

Remove DECtalk's unused shared morphology/stress dependencies while preserving table pronunciation (#141).

# State

Fresh branch from 6675ed72. Implementation complete: 59 production additions /
30 removals, 74 fixture additions / 7 removals and 11 declaration/manifest removals.
Owner, selected-table predicate, shared consumers, explicit overrides and owned
diff inspected. Publishing for hosted CI/Claude. No local CI ran.

# Decisions and why

Approved scope: 80–130 production additions / 35–55 removals plus 50–90 fixture
lines and declaration/manifest deletions. Permit absent shared contexts only for
the selected compiled-table pronouncer; acquire any explicitly declared resource.
Require optional contexts at the actual shared consumers, with selected frontend
identity in errors. Preserve Qlatt owner errors and explicit context overrides.
Delete DECtalk's temporary declarations and three corresponding manifest entries.
Keep transcription.sources.morphology: table suffix processing still reports that
source truthfully. No algorithm/schema/cache changes or local CI; preserve others.

# Surprises

Existing Qlatt fixtures explicitly narrow their selected contexts. DECtalk's table
suffix fixture confirms the unchanged cats pronunciation and morphology provenance.
Existing resource fixtures cover missing shared contexts on explicit non-table
overrides, acquisition of declared table-frontend resources, and Qlatt errors.

# Next step

Await hosted CI/Claude and respond to findings. Supervisor owns merge;
#141 remains open.
