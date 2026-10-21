# Goal
Move generic backend defaults to existing manifests for the bounded #76 slice. Full package discovery and explicit supported pairs remain separate.

# State
PR #467 reviewed across all 17 initial files by Claude Opus 5.5, session 4cf44832-38e2-4b4e-9495-e0a5453db94d. Implementer and supervisor verified the two actionable findings and applied the bounded response below. Hosted quality/native/Node and three runtime shards passed on formatter response a567fb07; final response CI pending. Approved #248/#76/#74 additions read back exactly; #248 closed contract-only. Owned #464 cleanup complete; no local CI.

# Decisions and why
- Smallest approved change: 140–210 production lines plus 60–100 existing fixture lines. Reuse existing frontend catalogue parser/source readers and experiment manifest reader; no second parser/cache/package registry or artifact changes.
- Declare defaults for all three frontends; DECtalk defaults to VTM. Explicit backend requests remain explicit and existing vocabulary validation remains authoritative in this partial migration.
- Harness distinguishes actual dropdown choices from automatically applied defaults with one module-local state value. Automatic defaults follow frontend changes; explicit selections remain selected. Existing bootstrap value alone is not evidence of user choice.
- Generic CLI/server/oracle/probe callers use declared defaults, with no same-id/first-entry/baseline fallback. Model-specific selection remains explicit.
- No klsyn88/Stevens compatibility admission or validation relaxation. #76 remains open for per-package discovery and supported-pair enforcement.

# Surprises
The oracle render adapter copies frontendId into experimentId; it is generic selection, so omit that backend argument and let render-phrase resolve the declared default.
The oracle browser-sweep also calls experimentFor; its actual async render call now awaits the shared-reader result. No new cache was added.

# Next step
Await final-head hosted CI and supervisor delta verification/gate/merge. Existing fixtures cover real default metadata, automatic baseline-to-DEC-VTM switching, explicit selection retention, missing default errors and server hello/default routing.

# Review response
- Accepted the actual loading-placeholder race: index.html still supplied a nonempty baseline value before manifests completed, allowing the probe's readiness check to pass before defaults/listeners existed. Empty the existing placeholder and register the existing frontend-change listener inside manifest completion. No new readiness flag or framework; no live reproduction claimed.
- Accepted inaccurate missing-default/unknown-frontend diagnostics: preserve E_FRONTEND_DEFAULT_EXPERIMENT but name the actual failure, with existing assertions updated.
- The catalogue extra-field typing observation was explicitly non-actionable; existing default checks and hosted typecheck passed. No additional schema machinery.
- Reviewer read all initial files and actual async/browser/oracle producers. Existing verify-frontend-browser's older DEC expectation and historical generated artifact arguments were outside this bounded change; no broad compatibility claim.
- Hosted initial quality found four formatting-only differences; exact emitted corrections were pushed at a567fb07. Claude's complete substantive report precedes its read-only Stop-hook loop; no reviewer file writes or public review were authorized.
