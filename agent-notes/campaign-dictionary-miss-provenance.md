# Goal

Make the dictionary-miss scanner count the pipeline's existing configured-G2P
fallback decisions instead of matching a console warning no longer produced.

# State

Fresh isolated branch from origin/master 3523fed1. Implemented and inspected the
approved script-only correction; preparing publication for CI and Claude review.
No pipeline changes or new tests/guards.

# Decisions and why

- Smallest change: about 15–25 added / 6 removed script lines plus this note.
- The scanner's console regex has no producer in src. transcribe-text.ts emits
  fallback_pronunciation_selected provenance with a word: subject (955–970),
  and optional G2P_DICTIONARY_FALLBACK diagnostics (1198–1203).
- Use the existing typed collector through the existing TTS options. Count its
  fallback decisions in finally so a later rendering error does not discard
  already-recorded pronunciation choices.
- Preserve warning forwarding, summary format, and error handling. The counter
  means configured G2P fallback, not every non-dictionary pronunciation source.
- Existing frontend-substitutions fixture covers the producer's count and
  provenance. No new test or local CI; hosted PR CI owns validation.

# Surprises

None.

# Next step

Commit/push and publish for hosted CI and Claude review. Respond to review;
supervisor owns merge and cleanup.
