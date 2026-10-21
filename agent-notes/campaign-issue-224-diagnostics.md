# Goal
Use the shared position-preserving YAML parser for diagnostics configuration (#224).

# State
Based on master 7ac62761. Smallest approved change: two production lines and one existing parser-parity corpus line. No local CI.

# Decisions and why
The browser harness reads public/diagnostics/default.yaml and calls parseDiagConfig; its existing shape validation remains intact. Reuse parseYamlString without new flags or wrappers. Empty and explicit-null documents remain rejected, now with shared YAML parser/schema error wording. No caller or test branches on the prior mapping message. Add public/diagnostics to the existing bundled parser comparison so the actual document is covered. This removes the final runtime js-yaml import; script/test imports and the package remain until their separate retirement. Executed literal explain joins are outside this change.

# Surprises
None.

# Next step
Publish for hosted CI and full Claude review. PR256 remains held separately and untouched.
