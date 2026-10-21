# Goal

Complete the remaining embedded voice/emphasis/break attribution correction in #213.

# State

Implemented approved bounded slice from 0a6045ac. Only parse.ts, existing input.test.ts, and this note changed; other agents' work is preserved.

# Decisions and why

Smallest change: approximately 5–8 production lines and 45–70 focused test lines. The three input records copy authored metadata or requests; they do not derive an acoustic policy from Cahn, Pierrehumbert, or Crystal & House. Replace those fixed references with explicit host engineering conventions. Keep record types, stages, subjects, labels, numeric behavior, and parent contracts intact.

Extend the existing local-affect ancestry case with alternate configured preset citations and exact preset-application parent assertions. Existing preset boundary validation rejects missing citations. Tokenization/anchor normalization emits no citation-bearing record; gesture and affect already use their definition/preset attribution. No new policy registry, numeric rules, or validation guard.

# Surprises

Local dependencies remain unavailable in fresh worktrees and the main checkout's dependency versions are stale. Per supervisor, publish for hosted CI without local test or CI execution.

# Next step

Commit/push for independent Claude review and hosted CI. Focused regressions cover host attribution and record payloads/stages/subjects/parents, plus alternate preset citations with exact global/local preset-application ancestry. Tests are authored but not locally run; no failing-test run is claimed. Supervisor owns merge and full #213 acceptance assessment.
