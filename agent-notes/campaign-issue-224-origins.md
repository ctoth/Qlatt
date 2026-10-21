# Goal
Replace duplicate map/rule resource-origin bookkeeping with projections of the composed document-span index (#224).

# State
Isolated from master 4cba779c. Implemented existing accessor projections and deleted both duplicate origin stores, including shadow-candidate labels. Existing sync/async inheritance fixtures assert unique declaration spans, frozen results and a literal dotted map key. No local CI.

# Decisions and why
Smallest change: retain existing accessor contracts, derive declaration resources using typed effective paths, remove the two parallel WeakMaps and their composition writes. Estimate 35–55 added / 60–85 deleted production lines plus 25–40 existing fixture lines. No cache or runtime record changes.
The YAML walker emits one entry per authored node. Include dictionary collisions throw; extends removes overridden source paths; shadow inheritance selects complete winning entries. Parser path remapping concerns nested expressions, not depth-two rule declarations or depth-three map literals. Existing bundled maps use direct mappings, with literal dotted keys retained as single path components. Programmatic compilation has no authored span index and keeps empty origins.

# Surprises
None established. Topology has no bundled declaration producer and is outside this change.

Claude reviewed the full three-file PR451 range 4cba779c..69fca6f9 in session 1d493d0a-9d02-49f2-b110-ae6cf364ee2d and found no actionable defects. Implementer accepts the review without code changes. Rebuilding projections has an unmeasured cost; no speculative cache or guard added. Root independently verified the source and review. Response recorded at a natural measurement boundary, after the separate PR256 baseline Node run completed.

# Next step
Await final-head hosted CI and supervisor merge. PR256 measurements continue separately; its baseline Node report completed successfully.
