# Goal
Deliver #237 index requests through the existing server and NVDA playback path without splitting speech at each index.

# State
PR #460 open from merged master2448a9f4 after #456. Owned origins worktree and branches removed cleanly. Existing fixtures cover UTF-16/whitespace, repeated-source server mapping, same-sample ordering, PCM slicing, rate/pitch padding boundaries, index-only input and canceled callbacks. Hosted quality119319999502 requested one assertion wrap; applied its exact formatting. All seven hosted checks pass on4932fe37; no local CI. Claude completed its full six-file review in session3ac4d4d6-fdde-4fcf-af16-3c6c0d6bd02e with no source-backed defects. Supervisor independently verifies the review and final delta.

# Decisions and why
- Smallest approved change: about110–160 production lines in speak-server.ts and qlatt.py, plus100–160 lines in existing TS/Python fixtures. Existing raw sourceSpans select the first frame starting at or after each requested UTF-16 offset; no eligible frame means PCM end.
- Preserve exact concatenated text and collect index offsets instead of flushing at IndexCommand. Rate/pitch changes still delimit renders until separate scoped-control work. Existing exterior padding and index-only no-render behavior stay.
- Use existing WavePlayer.feed(onDone) at PCM boundaries. Equal-sample indexes retain input order; callbacks capture the existing per-run cancellation event. No new worker, lock, queue or source resolver.
- Full scoped controls, timed breaks, spelling, tuning and live NVDA acceptance remain open. This does not close #237.

# Surprises
None yet. Source-backed review confirmed native feed accepts an empty boundary callback after previously queued audio, and queues callbacks after firing existing callbacks (nvwave.py313–361; wasapi.cpp468–493).

Accepted Claude's completed review. Its rate/pitch callback-delay and whitespace-only observations had no identified real NVDA producer and were explicitly nonfindings; adjacent-string joining matches the existing caller contract. The Python fixture includes manually deferred cancellation callbacks, but does not establish live playback timing or leading-silence behavior. Live acceptance remains open. No new machinery or extra review round added in response.

# Next step
Await final response-head hosted checks and supervisor verification/merge. Full scoped controls and live acceptance remain open.
