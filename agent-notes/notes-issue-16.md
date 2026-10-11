Checkpoint 2026-09-03: issue #16 requires punctuation cleanup policy to come from declarative frontend configuration.
Current branch: issue-16-declarative-punctuation from clean master at cb33d84952819c4174439004ec17f9bdd32ac25f.
Finding: punctuationCleanup still hardcodes apostrophe protection, `[,.?!;:]`, and the strip allowlist in src/g2p/text-normalize.ts.
Acceptance gate: a config punctuation-token change must affect normalization and transcription consistently; npm.cmd run typecheck:core must pass.
Next: add a focused failing regression, implement the smallest table-driven policy, then verify, commit, push, and open the PR.

Checkpoint 2026-09-03: the focused regression failed with received `hello world !` versus expected `hello ~ world`.
Current state: normalization now accepts the selected frontend punctuation inventory and tts-frontend passes the same transcription config to both stages.
Finding: the private placeholder and literal punctuation regexes were replaced by a scanner governed by YAML apostrophe and strip policy.
Blocker: none; config-shape coverage and the first green run remain.
Next: finish focused assertions, run scoped tests and typecheck, inspect the diff, then deliver the PR.
