# Goal

Use configured channel citations for pitch, rate, and direct voice-quality direction records in #213.

# State

Implemented approved bounded slice from base 23842f68. Only parse.ts, input.test.ts, and this note are owned. Existing pitch/rate/VQ records now carry selected channel citations, channel names/frontend identity in their reason, and explicit host-convention attribution.

# Decisions and why

Smallest change: 25–40 production lines plus 60–90 focused test lines. Select existing vq_channels rows for authored fields, deduplicate their citations, and include frontend identity and exact channel entry names in the existing reason. Explicit host engineering attribution describes semitone conversion, inverse-rate mapping, and override bookkeeping. No new registry or validation: the existing channel parser rejects missing attribution at its resource boundary.

Preserve all numeric behavior, subjects, stages, and parent edges. Existing empty/unknown-only overrides remain accepted and carry host-convention attribution without claiming a configured row matched. Affect/preset ancestry and gesture definitions remain unchanged. Voice identity, emphasis, and break attribution remain separate #213 work.

# Surprises

The fresh worktree has no node_modules. Supervisor verified the main checkout's installed YAML dependencies are stale relative to this candidate and directed publishing to hosted CI instead of using them as parity evidence. Focused regressions are authored but not locally executed; no failing-test run is claimed. Existing input tests retain global/local affect and preset ancestry coverage.

# Next step

Publish for hosted CI and independent Claude review; respond to findings. No local CI run or dependency installation. Supervisor owns merge and #213 partial-scope bookkeeping.
