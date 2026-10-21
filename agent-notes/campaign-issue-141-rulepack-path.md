# Goal

Remove the generic rulepack path default while preserving explicit frontend selection (#141).

# State

Fresh isolated branch from origin/master at 8203114c. Constant, loader signatures,
actual callers and dump script read. Implementation complete; publishing for
hosted CI and Claude review. No local CI ran.

# Decisions and why

Smallest approved change: about 3 additions / 8 removals across rule-pack.ts and
dump-spec.ts. Require the existing path arguments; the dump script explicitly
selects qlatt-english through the bundled loader. All other callers already pass
paths. Keep the bundled path map and default frontend ID under their existing scope.
No new tests, machinery or local CI. Preserve other agents' changes.

# Surprises

None. Dictionary harness acquisition remains a separate task.

# Next step

Publish for hosted CI and Claude review. Supervisor owns merge; #141 stays open.
