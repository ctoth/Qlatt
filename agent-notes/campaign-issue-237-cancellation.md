# Goal

Suppress stale NVDA playback and notifications after cancellation/replacement.
Partial #237 delivery; no protocol, chunking, spelling or live-NVDA claims.

# State

PR #448, isolated from master 447d28f5. Claude reviewed the complete four-file
447d28f5..2e06d2a1 range with no correctness findings; implementer accepts review.
Claude could not run its GitHub commands; implementer separately confirmed the
PR head and four changed files with gh pr view/diff. Supervisor owns final gate.

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

Review session c7c360c1-94ef-4efe-a5aa-b79fb305874b. No speculative locking change:
the reviewer noted a pre-existing check/action window but could not establish
NVDA audio behavior without its implementation. This slice does not claim full
cancellation atomicity. Fixtures establish the named blocking-call cases only.
Await final hosted CI and supervisor independent gate/merge. Keep #237 open for
broader acceptance, including live NVDA behavior.
