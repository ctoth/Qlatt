# Goal

Suppress stale NVDA playback and notifications after cancellation/replacement.
Partial #237 delivery; no protocol, chunking, spelling or live-NVDA claims.

# State

Isolated from master 447d28f5; implementing the supervisor-approved slice.

# Decisions and why

Smallest change: capture a distinct existing threading.Event per utterance and
pass it to the worker, never clearing a canceled run. Recheck cancellation after
blocking playback sync/idle calls before notifying NVDA. About 15–25 production
lines plus 80–120 Python fixture lines and a small existing-Vitest adapter.
Tests use controlled events and mocked NVDA modules, not timing-only assertions.
No new cache, protocol, workflow or CI job. Other agents share this repository;
only the driver, focused fixtures and this note are owned here.

# Surprises

The previous worker could observe a shared cancellation event cleared by a new
utterance after its blocking server call returned. Its post-sync notification
also had no cancellation recheck.

# Next step

Commit and publish; use hosted CI, full Claude review, implementer response and
supervisor independent gate/merge. Keep #237 open for its broader acceptance.
