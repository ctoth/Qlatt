# Goal
Move generic backend defaults to existing manifests for the bounded #76 slice. Full package discovery and explicit supported pairs remain separate.

# State
Implementation ready in isolated branch from 2df87ed3: shared catalogue/experiment readers, explicit declared defaults and all actual generic callers migrated, with existing fixture coverage. Approved #248/#76/#74 issue additions published and read back exactly; #248 closed for its contract delivery, encoding implementation remains #227/#241. Owned #464 tree/local/remote branch cleaned. No local CI; preparing PR for hosted validation.

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
