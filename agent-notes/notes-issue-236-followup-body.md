## Problem

Asset caching in #236 / PR #255 does not solve speech-server responsiveness. Earlier paired measurements were approximately 811 ms for warm "OK." and 2 seconds for "The quick brown fox jumps over the lazy dog." (44 characters). The desired warm full-response targets remain below 150 ms and 400 ms respectively on the same Windows machine.

The initial diagnostic breakdown for "OK." was approximately 381 ms runtime construction, 74 ms frontend/context, 73 ms scheduling, and 218 ms rendering. Runtime construction includes worklet worker startup, registration, semantics setup, processor creation/readiness, and connections. Eliminating all construction time alone would still miss the short-phrase target.

## Decision and scope

Prototype a persistent offline backend session using the existing Bacon graph and semantics. Retain workers, processors, and connections across sequential utterances, with an explicit per-utterance reset and deterministic seed contract. Preserve complete-PCM stdio responses and sample-accurate word markers. Keep the existing fresh-render path as the comparison baseline during the prototype.

The current node-web-audio-api OfflineAudioContext has a fixed render length and releases its worklets after startRendering. Merely keeping that JavaScript object cannot implement reuse. Identify and implement the smallest host lifecycle extension needed for repeatable offline renders; do not work around this with an indefinitely large OfflineAudioContext. Any dependency patch must be maintained and reviewed in its owning repository before production adoption.

## Acceptance

- Start from the reproducible benchmark in PR #255. Separate worker startup/registration from other runtime setup costs sufficiently to establish where persistence helps.
- Write failing fresh-versus-reused A/B/A regressions before implementation, covering filter history, envelopes, noise seeds, parameter automation, speaker/parameter changes, diagnostics and markers.
- Test cancellation, failed requests followed by successful requests, session shutdown, configuration/sample-rate separation and memory growth over repeated utterances.
- Compare audio hashes with the fresh-render baseline for deterministic inputs. Investigate any difference explicitly; do not bless new output as the oracle.
- Report repeated cold/warm latency distributions and stage costs on the same machine. Retain the 150/400 ms targets and document the remaining frontend/scheduling/DSP costs if the prototype misses them.
- Produce a bounded prototype and a measured production-adoption recommendation. A successful prototype is not evidence that the responsiveness targets were achieved; keep outstanding latency work tracked explicitly.

Streaming and real-time playback changes are excluded. Backend relocation belongs to #79; prepared-data immutability and macro preparation remain owned by #251/#252. Related: #234, #236, #255.

## Measured stage update from PR #255 revision

Candidate 44b0ff2e, three server processes and five warm trials per phrase per process (15 warm observations per phrase): warm "OK." p50 736.6 ms, p95 775.4 ms. The sentence p50 is 1763.7 ms, p95 2027.5 ms. Baseline p50 values were 742.8 ms and 1776.7 ms respectively; this does not establish a substantial end-to-end speedup.

For "OK.", stage p50 values are: worklet registration including worker startup 323.7 ms; node creation 12.1 ms; processor readiness 34.3 ms; initial semantics evaluation 4.8 ms; runtime total 384.7 ms. Frontend/context costs 51.1 ms, scheduling 70.6 ms, and rendering 222.7 ms. Stage quantiles do not sum exactly. The measured dominant construction cost is registration/worker startup, not creating Bacon-described audio nodes. Split that registration interval first, including checking inherited TypeScript loader startup, before attributing the cost to Bacon graph interpretation.
