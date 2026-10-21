# Goal

Complete the remaining embedded voice/emphasis/break attribution correction in #213.

# State

Implemented approved bounded slice from 0a6045ac. Own parse.ts, existing input.test.ts, this note, and the supervisor-authorized two-comment correction in direction-track.ts; other agents' work is preserved.
Merged origin/master 8a5d86b5 normally without conflicts, including reviewed
LTS JSON acquisition fix #387 and the intervening merged changes. Preparing
replacement hosted CI on the integrated branch; no local CI ran.

# Decisions and why

Smallest change: approximately 5–8 production lines and 45–70 focused test lines. The three input records copy authored metadata or requests; they do not derive an acoustic policy from Cahn, Pierrehumbert, or Crystal & House. Replace those fixed references with explicit host engineering conventions. Keep record types, stages, subjects, labels, numeric behavior, and parent contracts intact.

Extend the existing local-affect ancestry case with alternate configured preset citations and exact preset-application parent assertions. Existing preset boundary validation rejects missing citations. Tokenization/anchor normalization emits no citation-bearing record; gesture and affect already use their definition/preset attribution. No new policy registry, numeric rules, or validation guard.

# Surprises

Local dependencies remain unavailable in fresh worktrees and the main checkout's dependency versions are stale. Per supervisor, publish for hosted CI without local test or CI execution.

# Next step

PR #383 hosted quality job 119101459054 reported two formatter errors in parse.ts and input.test.ts and exited 1. Applied the exact citation-array, mapped-array, and predicate reflows. No behavior changes or local CI rerun. Focused regressions cover host attribution and record payloads/stages/subjects/parents, plus alternate preset citations with exact global/local preset-application ancestry. Await replacement hosted CI and independent Claude review; supervisor owns merge and full #213 acceptance assessment.

Claude completed two-pass review with no blocking defects and accepted the configured affect citation/parent coverage. Accepted its stale-comment finding: emphasis/break type comments still attributed authored requests to the replaced paper references and described acoustic effects. Correct those two comments to the authored-label/request contract, retaining every input field. Supervisor verifies the final four-file range; no runtime change or additional local gate.

Final pre-integration head ec46bab8 had eight 30000ms timeouts in hosted shard2
job119104023352, mostly first DECtalk acquisitions. Separate source-backed
diagnostics identified expensive YAML AST parsing of generated LTS JSON;
reviewed #387 now decodes that declared JSON directly using existing acquisition
and cache. This integration changes the cause-bearing code, not the timeout or
workflow. Measurements do not establish all hosted timing variability. Await
integrated-head CI and supervisor verification/merge.
