# Goal

Preserve repeated identical spoken words in server markers using canonical Word
occurrences. Partial #237; no index-offset, scoped-command or live-NVDA claim.

# State

Implementing in an isolated worktree from current master after #448.

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

Publish for hosted CI and full Claude review, respond, then supervisor gate/merge.
Other agents share the repository; preserve their changes.
