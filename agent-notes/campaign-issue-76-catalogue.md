# Issue 76: existing frontend catalogue discovery

## Goal
Replace the three-entry TypeScript map with the existing bundled frontend manifest's IDs and entryPoint values.

## State
PR461 published at b2d53c80 after PR458 merged c7aed264. Private full-PR Claude review complete; no local CI. Initial hosted quality job119321038969 found one formatter error in the new fixture's ternary layout; applied its exact one-line reflow in8ce5478c. Final hosted checks pending.

## Decisions and why
- Smallest scope: 70–100 production/caller lines, 60–90 existing fixture lines and one recorded manifest resource in each of three resource lists. Read/validate the existing catalogue through the shared source loader, reuse its primed-source owner, and retain DEFAULT_FRONTEND_ID as one explicit default.
- Keep synchronous list/resolve APIs for existing TTS/CLI consumers. Add asynchronous path resolution at existing warmup, async extends and bundled preload callers; prime the existing shared source before later synchronous resolution. No new cache or registry.
- Resolve entryPoint under the existing frontend-ID directory convention. Runtime fixture adds an entry with a non-default entry filename, without modifying production TypeScript.
- Package manifest schemas, compatible pairings, stable identity, dependency selection and backend defaults remain under issue248/remaining76; no inference from catalogue membership.
- Source: rule-pack.ts list/resolve/extends/preload callers; test/harness/runtime.js warmFrontend; sync-resource-cache.ts keepSyncResource; public/rules/frontends/manifest.json; existing resource-manifest and single-parse fixtures.

## Surprises
The asynchronous YAML source loader does not automatically keep fetched text. Async catalogue discovery must explicitly prime the existing owner to avoid a later synchronous manifest request.

The old map's only external consumer was the existing single-parse fixture; it now enumerates through the catalogue API. The recorded resource lists each gain the same catalogue path; no regeneration or local test was run. Existing fixtures add a runtime catalogue entry using selected.yaml, validate malformed/duplicate entries, and check async discovery followed by synchronous resolution without another manifest request. These remain authored assertions until hosted CI executes them.

## Review response
Accepted Claude Code Opus5.5 two-pass review of the full initial eight-file PR range c7aed264..b2d53c80, transcript13121fc6-6201-4901-aa13-2091e037e9aa under campaign-76-catalogue. No source-backed findings; reviewer read actual async/sync/cache callers and recorder. It verified gh view/local range and file list, not gh diff; implementer confirmed the formatter-only delta and final remote file list. No writes, fetch, tests or public reviews.

Root verified the review's recorder observation against registeredVoices and record(): resource-list generation still hardcoded frontend.yaml. Root approved the bounded caller response: reuse the script's existing direct-filesystem catalogue read for entryPoint, preserving its exclusion from frontend resource recording. No new registry, tests or regeneration. This completes the non-default entry filename contract in the existing generator, without claiming package compatibility support. Root independently checks this response delta; no second review round requested.

## Next step
Push the review response and inspect final hosted CI. Root owns review ledger and merge. Issue76 remains open for package discovery and pairing decisions under248.
