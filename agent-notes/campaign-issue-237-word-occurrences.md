# Goal

Preserve repeated identical spoken words in server markers using canonical Word
occurrences. Partial #237; no index-offset, scoped-command or live-NVDA claim.

# State

PR #450 from master 4cba779c. Claude reviewed all five files at d037de93 and
reported no correctness defects; implementer accepts the review.

# Decisions and why

Smallest change: project plain wordOccurrences at the Node includeTrack boundary
using frame.segmentId, the actual SylStructure parents and Word membership.
Deduplicate by Word identity, not spelling; retain the first rendered frame time
and existing punctuation filter. Server converts occurrences to its unchanged
external word-marker shape. Approximately 35–55 production and 35–55 fixture
lines; no KlattFrame changes, HRG serialization, guessed IDs or extra cache.
Existing server integration test will exercise repeated words through real TTS.

# Surprises

Raw UTF-16 offsets and parser transformations remain a separate larger task.

# Next step

Review session f6b0f60f-2c7e-499a-ba1d-857d00185cab confirmed the actual GitHub
range. Coverage limits: projection is exercised through the real server; no
claim that the repeated-word integration fixture was run against the old code.
No extra API or speculative machinery added for those nonfinding observations.
Initial quality/native/Node checks passed; final hosted CI remains pending.
Supervisor owns independent verification, gate and merge. Other agents share
the repository; preserve their changes.
