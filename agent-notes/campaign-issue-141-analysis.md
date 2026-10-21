# Goal
Remove the implicit baseline semantics load from track gain analysis, one bounded slice of #141.

# State
Implemented from 955a2e80: analyzer requires explicit semantics, formatter reports missing semantics after its no-track guard, and existing fixtures load and expand their selected experiment explicitly. Preparing PR for hosted CI and Claude review; no local CI run.

# Decisions and why
- Smallest change: about 5-10 production lines added and 18 removed, plus 30-50 existing test lines. Require explicit analyzer semantics and preserve optional diagnostics state with a missing-semantics display status.
- The actual harness already supplies selected semantics (test/harness/runtime.js:144), expanded by createKlattRuntime (src/klatt-runtime.ts:450). No arithmetic changes are needed.
- Keep the shared baseline reference load and its thresholds untouched. Reference ownership and broader resource acquisition remain outstanding under #141; this PR does not close it.
- Own track-analysis, display-formatter, their existing analysis/formatter tests, and this note only. Other agents are active; preserve their work.

# Surprises
None.

# Next step
Publish PR, inspect hosted CI, and respond to independent Claude review. #141 remains open.
