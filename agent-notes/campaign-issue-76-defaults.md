# Goal
Move generic backend defaults to existing manifests for the bounded #76 slice. Full package discovery and explicit supported pairs remain separate.

# State
PR #467 opened at 46781820 from 2df87ed3. Claude full-range review active, session 4cf44832-38e2-4b4e-9495-e0a5453db94d. Hosted quality job119347971292 reported four formatter differences (probe, rule-pack, manifest return type, lifecycle destructuring); applied its exact formatting, with no behavior change. Native/Node passed; runtime shards pending. Approved #248/#76/#74 issue additions read back exactly; #248 closed contract-only. Owned #464 cleanup complete; no local CI.

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
Publish PR for hosted CI and full Claude review, respond, then report final head for supervisor verification and merge. Existing fixtures cover real default metadata, automatic baseline-to-DEC-VTM switching, explicit selection retention, missing default errors and server hello/default routing.
