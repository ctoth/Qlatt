# Goal

Retain authored locations for rule select.where/constraint all/any/not conditions. Smallest scope: 25–40 production and 35–50 existing fixture lines using the current expansion observer and diagnostic index.

# State

Started from origin/master 8203114c. Implemented using 14 added production lines and the existing composition fixture. Covers select.where, nested constraint all/any/not, and dispatch condition expression spans, plus predicate-key control in sync/async root/include loading. All seven initial hosted checks passed. No local CI.

# Decisions and why

Keep numeric condition paths during document capture and forward actual emitted paths through the existing foreach observer. Condition normalization preserves indices. Expression leaves use value spans; structural fields retain key spans. Preserve authored coordinates and macro ancestry. No runtime literal join or native schema changes.

Accepted Claude's full five-file review of af037c5a: no actionable defects. The hypothetical foreach-condition and shadowed indexed fixture observations have no demonstrated missing behavior or real failing producer; no additional guards or scope expansion requested. This response changes only the task note.

# Surprises

None. Other agents own separate worktrees, including PR402 changes to the composition helper signature; preserve their work on integration.

# Next step

Await final-head hosted CI and supervisor merge. Keep #224 open; investigate further validator location gaps read-only.
