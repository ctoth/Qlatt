# Goal

Deliver the browser-harness consolidation slice of #251, using the shared experiment loader.

# State

Implemented from base 95d3165a: harness change adds 5 lines and removes 77;
existing lifecycle test gains 25 lines for the bundled inheritance fixture.
Own only this note, test/harness/experiment.js and
test/harness-runtime-lifecycle.test.ts. Dependencies are absent in this
worktree, so no local test was run; validation awaits PR CI.

# Decisions and why

Smallest change: remove roughly 80 lines of duplicate merge/load logic and add
roughly 6 lines calling loadExperimentConfig and assigning its three documents.
Keep UI manifest metadata, frontend vocabulary validation and cache, runtime
teardown, status, errors, and extends logging in the harness. Shared-loader
manifest fetch errors propagate through the existing harness error handler;
there is no new fallback or cache. The loader's recursive inheritance and
plain-map constants semantics now apply to the harness as well.

Extend the existing lifecycle test using the bundled test-inherit fixture
(AV default 50, inherited baseline graph/registry), without relying on the UI
manifest cache. Retain the cached frontend rejection and teardown tests.
PR CI supplies validation; no local CI duplication or dependency installation.

# Surprises

None. #251 remains open: document-relative resources, origins, serialization,
and relocation are outside this slice. No URL, asset, API, or schema changes.

# Next step

Commit and push the PR, read CI, then respond to Claude review. Supervisor owns merge.
