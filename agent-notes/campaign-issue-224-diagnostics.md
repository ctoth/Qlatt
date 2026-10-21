# Goal
Use the shared position-preserving YAML parser for diagnostics configuration (#224).

# State
Based on master 7ac62761. Smallest approved change: two production lines and one existing parser-parity corpus line. No local CI.

# Decisions and why
The browser harness reads public/diagnostics/default.yaml and calls parseDiagConfig; its existing shape validation remains intact. Reuse parseYamlString without new flags or wrappers. Empty and explicit-null documents remain rejected, now with shared YAML parser/schema error wording. No caller or test branches on the prior mapping message. Add public/diagnostics to the existing bundled parser comparison so the actual document is covered. This removes the final runtime js-yaml import; script/test imports and the package remain until their separate retirement. Executed literal explain joins are outside this change.

# Surprises
None.

Claude reviewed the full three-file 7ac62761..5d11957d range in session 94598469-c2c2-47c2-8082-8299acd57811, including the real browser caller and diagnostics document, and found no actionable defects. Implementer accepts the review without code changes. Existing top-level sequence handling and HTTP response handling were observations outside this change. Initial hosted quality/native/audio checks passed; test shards were pending at response time.

# Next step
Await final-head hosted CI and supervisor review gate/merge. PR256 remains held separately and untouched.
