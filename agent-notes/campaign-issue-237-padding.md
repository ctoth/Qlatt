# Goal
Forward existing render padding so NVDA chunks keep only exterior utterance padding (#237).

# State
PR #453 is open from master 325df1b1. Claude reviewed the full five-file range through 06d82432; response implemented, final hosted CI pending. No local CI.

# Decisions and why
- Smallest change: optional existing leadTime/tailTime server fields, Python forwarding, first/last nonempty chunk selection; about 25–40 production lines and 45–70 existing fixture lines.
- Preserve server defaults (0.02/0.05 seconds), index-only chunks, cancellation, and rate/pitch handling.
- Tail time is post-track render duration, not proven silent samples. Separate chunk prosody, whole-utterance rendering, source offsets, scoped commands, and live NVDA acceptance remain unfinished.

# Surprises
Claude found no correctness defect and identified duplicated Python padding defaults. Accepted: exterior values are now omitted, leaving the server as the default owner; only interior zeros are sent. Existing fixtures assert omission and explicit zero.

Review coverage limits remain explicit: no rendered zero-padding or live NVDA verification, no combined rate/pitch fixture, no guarantee an interior tail is silent or that a failed last render retains padding. These observations do not expand this slice. Transcript: 029aa0e8-bf8f-4fe0-9577-ec866d441860; supervisor independently verifies the final delta.

# Next step
Await final hosted CI and supervisor verification/merge. Larger #237 acceptance remains open.
