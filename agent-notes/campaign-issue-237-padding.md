# Goal
Forward existing render padding so NVDA chunks keep only exterior utterance padding (#237).

# State
PR #453 is open from master 325df1b1. Implementation and existing fixtures are committed; hosted CI and full Claude review pending. No local CI.

# Decisions and why
- Smallest change: optional existing leadTime/tailTime server fields, Python forwarding, first/last nonempty chunk selection; about 25–40 production lines and 45–70 existing fixture lines.
- Preserve server defaults (0.02/0.05 seconds), index-only chunks, cancellation, and rate/pitch handling.
- Tail time is post-track render duration, not proven silent samples. Separate chunk prosody, whole-utterance rendering, source offsets, scoped commands, and live NVDA acceptance remain unfinished.

# Surprises
None.

# Next step
Read hosted CI and full Claude review, respond to findings; supervisor owns independent verification and merge.
