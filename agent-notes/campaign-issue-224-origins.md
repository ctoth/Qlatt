# Goal
Replace duplicate map/rule resource-origin bookkeeping with projections of the composed document-span index (#224).

# State
Isolated from master 4cba779c. Implemented existing accessor projections and deleted both duplicate origin stores, including shadow-candidate labels. Existing sync/async inheritance fixtures assert unique declaration spans, frozen results and a literal dotted map key. No local CI.

# Decisions and why
Smallest change: retain existing accessor contracts, derive declaration resources using typed effective paths, remove the two parallel WeakMaps and their composition writes. Estimate 35–55 added / 60–85 deleted production lines plus 25–40 existing fixture lines. No cache or runtime record changes.
The YAML walker emits one entry per authored node. Include dictionary collisions throw; extends removes overridden source paths; shadow inheritance selects complete winning entries. Parser path remapping concerns nested expressions, not depth-two rule declarations or depth-three map literals. Existing bundled maps use direct mappings, with literal dotted keys retained as single path components. Programmatic compilation has no authored span index and keeps empty origins.

# Surprises
None established. Topology has no bundled declaration producer and is outside this change.

# Next step
Publish for hosted CI and Claude review. PR256 remains held separately for fresh measurements.
