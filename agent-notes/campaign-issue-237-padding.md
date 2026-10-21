# Goal
Forward existing render padding so NVDA chunks keep only exterior utterance padding (#237).

# State
Implementation starting from master 325df1b1 in an isolated worktree. No local CI.

# Decisions and why
- Smallest change: optional existing leadTime/tailTime server fields, Python forwarding, first/last nonempty chunk selection; about 25–40 production lines and 45–70 existing fixture lines.
- Preserve server defaults (0.02/0.05 seconds), index-only chunks, cancellation, and rate/pitch handling.
- Tail time is post-track render duration, not proven silent samples. Separate chunk prosody, whole-utterance rendering, source offsets, scoped commands, and live NVDA acceptance remain unfinished.

# Surprises
None.

# Next step
Implement scoped forwarding and fixtures, publish for hosted CI and full Claude review; supervisor owns merge.
