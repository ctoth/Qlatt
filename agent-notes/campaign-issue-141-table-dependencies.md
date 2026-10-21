# Goal

Remove DECtalk's unused shared morphology/stress dependencies while preserving table pronunciation (#141).

# State

Fresh branch from 6675ed72. Implementation complete: 59 production additions /
30 removals, 74 fixture additions / 7 removals and 11 declaration/manifest removals.
Owner, selected-table predicate, shared consumers, explicit overrides and owned
diff inspected. PR #408 published; Claude completed its review of the initial
10-file range with no runtime defects. Final hosted CI pending. No local CI ran.

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
Hosted quality job119156643823 reported one formatter wrap in the evaluation
script's error. Applied its exact correction; no behavior change.
Accepted Claude's stale lexical-stress introduction finding: document the shared
Qlatt/Beauty stage separately from DECtalk's compiled-table path. Also qualified
the document-model proposal's obsolete DECtalk dependency claims as historical.
The supervisor independently verified those source paths and the formatter delta.

# Next step

Await final hosted CI and supervisor verification of this review response. Supervisor owns merge;
#141 remains open.
