# Goal
Record successful runtime graph connections through the existing optional provenance collector for #91.

# State
Implemented the bounded slice, isolated from origin/master 1e39c896. Production/caller diff is 27 lines; existing fixtures cover resolved node and AudioParam endpoints, named output ports, omitted/throwing connection behavior, and the real VTM destination connection while retaining speaker/run ancestry assertions.
Accepted Claude's full five-file review: no defects. Supervisor independently verified the source, diff, host contract, VTM graph/report and fixtures, and completed the review gate.

# Decisions and why
Smallest change: about 22–32 production/caller lines and 35–55 existing fixture lines. Record only after actual node/AudioParam or destination connect success, naming resolved endpoints/ports and the selected graph. Cite the software host contract, without inventing scientific attribution. Forward the existing VTM collector into runtime construction; its actual graph has no internal edges and does connect its vtm output to the destination.
Preserve missing endpoint and throwing connection behavior. No init-semantics tracing, new collector, playback timestamps, ancestry claims, or general runtime caller coverage.

# Surprises
None.

# Next step
Await final-head hosted CI and supervisor merge of PR #428. No local CI run.
