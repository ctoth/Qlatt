# Goal

Pass the frontend owner's cached morphology document into runtime consumers (#141).

# State

Fresh isolated branch from 8a5d86b5. Implementation complete: 13 production
additions/21 removals; existing fixtures 15 additions/28 removals. Actual callers,
remaining symbol references and the owned diff inspected. Publishing for CI/review.

# Decisions and why

Smallest change: approximately 12–20 production additions/18–25 removals and
15–30 existing fixture lines. Add the existing MorphologyData type to context.data,
attach the owner's already-cached raw document, delete the private loader/cache,
and pass the context to both actual stress-hint callers. Retain the source path,
distinct allomorph phonotactics, recursive decomposition and DECtalk early return.
No parser, validation framework, new cache or algorithm changes. Existing fixtures
cover the selected data and existing owner errors; #141 remains open.

# Surprises

The existing YAML-contract fixture duplicated the document type and reloaded it;
it now inspects selected context.data. Existing hint coverage also verifies an
explicit cloned-data override; owner fixtures verify cached document identity.
Other worktrees and adjacent edits are preserved. No local CI ran.

# Next step

Await hosted CI and Claude review; respond to actual findings.
No local CI; supervisor owns final review and merge.
