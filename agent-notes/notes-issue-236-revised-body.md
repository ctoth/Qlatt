## Problem

The speech server reloads experiment configuration and worklet assets for every request. These inputs can be retained, but the running audio state must remain isolated between requests.

The original investigation aimed for warm "OK." below 150 ms and a 44-character sentence below 400 ms. PR #255's measurements show that asset caching alone does not achieve those goals or establish a meaningful end-to-end speedup. The unresolved responsiveness targets and persistent-backend prototype are now tracked in #260. Closing this issue means the bounded asset-reuse and measurement work is complete.

## Decision

- Keep one server-owned configuration template and asset loader per `(experimentId, frontendId, sampleRate)` within the repository.
- Retain transformed worklet sources and WASM bytes. Cached configuration is immutable; runtime macro expansion receives a private graph/semantics copy for each request.
- Context, runtime graph, interpreter, diagnostics, parameter inputs, and seed state remain per request. OfflineAudioContext is rendered once.
- Failed initialization is retryable. Dispose loaders after queued requests complete. Cache snapshots are invalidated by replacing the owner/restarting the server; live configuration watching is outside this scope.
- Keep existing per-render lifetime behavior for other node backend callers.

## Acceptance

- Deterministic tests for cache hits, concurrent initialization sharing, key separation, failed-load recovery, immutable nested configuration, owner-replacement invalidation, and disposal.
- Real concurrent A/B rendering and A replay match fresh-render audio hashes and tracks with different phrases, seeds and parameters. Runtime graph/semantics/context/diagnostics remain isolated.
- `test/speak-server.test.ts` passes with deterministic replay across changed request options and a failed request. Do not assert second-request elapsed time is less than first-request time in CI.
- `scripts/measure-speak-latency.ts` reports repeated process-start, first-request and warm-request distributions, raw observations, and optional runtime stage timings. Distinguish measured stages from descriptive fitted fixed/per-audio-second estimates.
- Include same-machine before/after measurements for "OK.", "Hello world.", and "The quick brown fox jumps over the lazy dog." (44 characters) in PR #255, with commands and commit identities.
- Focused tests, static checks, and full CI pass on the final PR head.

## Ownership and follow-up

Implement and verify the existing PR #255 rather than duplicate caching. #79 owns backend relocation; #251 owns configuration resolution and immutable prepared parents; #252 owns macro preparation. This change isolates today's mutating runtime expansion without taking over those projects. #260 owns the persistent offline lifecycle prototype and the unmet latency targets. Streaming remains separate. Related: #234.
