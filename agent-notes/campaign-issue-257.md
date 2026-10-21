# Issue 257: forward frontend performance options

## Goal
Forward the existing speaker override union, voiceQuality, and directionTrack through Node, browser, and track-only text rendering, with reproducible requested options and resolved speaker metadata.

## State
Implemented forwarding and requested/resolved metadata in six files at base bbe108a7; expanded existing speaker tests. After Q authorized correcting the two fixture failures, the active test file passed all 12 tests, including actual Chrome offline rendering with direction/profile serialization and A/B/A requests. Command: npx vitest run test/render-request-speaker.test.ts. No other local CI steps run.

## Decisions and why
Smallest change: reuse frontend option field types on requests and browser options; forward fields directly without a second options bag; return those requested fields plus the actual resolvedSpeaker. About 90-130 production lines and 150-250 focused test lines. Keep positional phrase/baseF0/transitionMs and existing frontendId/rate authoritative. Reuse existing frontend validation and preserve pitchScale and named voices. Explicitly reject new unsupported options on the legacy browser path. No engine, loader, speech policy, CLI syntax, or transport changes. Extend existing speaker tests with direct API parity, alternating requests, inherited frontend, invalid input, and a real browser-session serialization exercise.

## Surprises
Named speaker forwarding already exists, but its truthiness filter drops an empty supplied name. Browser offline driver discarded the detailed result except track; it now retains resolvedSpeaker. Dependency install succeeded and Chrome launched the actual offline page. I wrote an incorrect expected pitch: policy speaker-profile.yaml lists request.base_f0_hz before baseF0, so the fixture resolves to 198, not 154. I also paired qlatt-beauty with klatt80-baseline without checking vocabulary compatibility: browser rejected undeclared nasalPoleBaseHz. These are fixture failures; no loader or policy change is proposed.

## Next step
PR #331 is open and Claude review is running. Initial quality CI reported two formatter errors (types.ts and the focused test); applied its exact wrapping corrections without local CI rerun. The corrected fixture uses the declared qlatt-beauty experiment (public/experiments/manifest.json), now exercised through Node and browser; its profile expectation follows the existing 198 Hz policy result. No policy or validation changes. Browser test explicitly skips if no Chrome/Chromium executable is available; it ran locally. Await replacement exact-head CI/review and implementer response before supervisor merge.
