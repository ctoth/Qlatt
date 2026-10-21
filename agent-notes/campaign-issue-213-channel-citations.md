# Goal

Use configured channel citations for pitch, rate, and direct voice-quality direction records in #213.

# State

Implemented approved bounded slice from base 23842f68. Owned paths are parse.ts, input.test.ts, this note, and the supervisor-authorized one-line TTS caller correction. Existing pitch/rate/VQ records now carry selected channel citations, channel names/frontend identity in their reason, and explicit host-convention attribution.

# Decisions and why

Smallest change: 25–40 production lines plus 60–90 focused test lines. Select existing vq_channels rows for authored fields, deduplicate their citations, and include frontend identity and exact channel entry names in the existing reason. Explicit host engineering attribution describes semitone conversion, inverse-rate mapping, and override bookkeeping. No new registry or validation: the existing channel parser rejects missing attribution at its resource boundary.

Preserve all numeric behavior, subjects, stages, and parent edges. Existing empty/unknown-only overrides remain accepted and carry host-convention attribution without claiming a configured row matched. Affect/preset ancestry and gesture definitions remain unchanged. Voice identity, emphasis, and break attribution remain separate #213 work.

# Surprises

The fresh worktree has no node_modules. Supervisor verified the main checkout's installed YAML dependencies are stale relative to this candidate and directed publishing to hosted CI instead of using them as parity evidence. Focused regressions are authored but not locally executed; no failing-test run is claimed. Existing input tests retain global/local affect and preset ancestry coverage.

# Next step

PR #380 hosted quality job 119095298802 reported `test/input.test.ts format` and exited 1: the configured-channel fixture's map object required multiline formatting. Applied the exact reflow; no behavior change or local CI rerun.

Accepted both Claude findings. The real TTS custom-frontend path loaded the selected spec but passed the default frontend ID to direction parsing; corrected it to `options.frontendPath ?? frontendId`, matching transcription and final lowering. Extended the existing custom accent-policy fixture with pitch and asserted the actual path in its provenance. Replaced weak per-key reason substring checks with an exact channel-entry suffix assertion, so `durationScale` in the preexisting numeric reason cannot satisfy the evidence check. No numeric/algebra or ancestry changes. Push the response and await replacement CI and supervisor review verification. Supervisor owns merge and #213 partial-scope bookkeeping.
