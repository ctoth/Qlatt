# Goal
Remove the obsolete #210 branch-timing helper and its unsupported clearance message, retaining configured diagnostic check results.

# State
Approved deletion-only slice, isolated base 870944c0. Deleted the helper and sole display use; existing regression now asserts no unsupported clearance text. Configured diagnostic checks and their display remain unchanged. No local tests or CI run.

# Decisions and why
Smallest change: delete approximately 40 lines (helper, sole import/call and clearance line), add one assertion in the existing signal-flow regression. The helper reads tap names from the worklet telemetry map, but current telemetry is keyed by worklet node. Existing configured checks independently measure AnalyserNode taps and remain untouched. No replacement framework, policy or measurement.

# Source evidence
At base 870944c0: track-analysis.ts579–615 assumes cascade-out/parallel-out keys; test/harness/telemetry.js43–91 records data.node; harness-diagnostics/index.ts76–78 supplies that external map separately from checkResults; tap-manager.ts30–39 creates separate tap analysers. public/diagnostics/default.yaml40–47 already owns the measured cascade check. Baseline graph.yaml718–725 and semantics.yaml1026–1031 allow parallel frication when SW=0, contradicting the removed helper's opposite assumption.

# Surprises
No new measurement is needed. The displayed absence of mismatches was not evidence that configured taps had been checked.

# Next step
Publish for hosted CI and Claude review, then respond. Supervisor owns merge; switch-count policy remains a separate #210 slice.
