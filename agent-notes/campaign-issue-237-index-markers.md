# Goal
Deliver #237 index requests through the existing server and NVDA playback path without splitting speech at each index.

# State
Implemented from merged master2448a9f4 after #456; preparing publication. Owned origins worktree and branches removed cleanly. Existing fixtures cover UTF-16/whitespace, repeated-source server mapping, same-sample ordering, PCM slicing, rate/pitch padding boundaries, index-only input and canceled callbacks. No local CI; hosted validation and Claude review pending.

# Decisions and why
- Smallest approved change: about110–160 production lines in speak-server.ts and qlatt.py, plus100–160 lines in existing TS/Python fixtures. Existing raw sourceSpans select the first frame starting at or after each requested UTF-16 offset; no eligible frame means PCM end.
- Preserve exact concatenated text and collect index offsets instead of flushing at IndexCommand. Rate/pitch changes still delimit renders until separate scoped-control work. Existing exterior padding and index-only no-render behavior stay.
- Use existing WavePlayer.feed(onDone) at PCM boundaries. Equal-sample indexes retain input order; callbacks capture the existing per-run cancellation event. No new worker, lock, queue or source resolver.
- Full scoped controls, timed breaks, spelling, tuning and live NVDA acceptance remain open. This does not close #237.

# Surprises
None yet. Source-backed review confirmed native feed accepts an empty boundary callback after previously queued audio, and queues callbacks after firing existing callbacks (nvwave.py313–361; wasapi.cpp468–493).

# Next step
Implement the approved server/driver path and existing fixtures, publish for hosted CI and full Claude review. Supervisor independently verifies and merges.
