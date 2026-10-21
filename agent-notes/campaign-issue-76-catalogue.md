# Issue 76: existing frontend catalogue discovery

## Goal
Replace the three-entry TypeScript map with the existing bundled frontend manifest's IDs and entryPoint values.

## State
Implemented bounded slice after PR458 merged c7aed264. Fresh isolated branch; no local CI. Publication/hosted validation next.

## Decisions and why
- Smallest scope: 70–100 production/caller lines, 60–90 existing fixture lines and one recorded manifest resource in each of three resource lists. Read/validate the existing catalogue through the shared source loader, reuse its primed-source owner, and retain DEFAULT_FRONTEND_ID as one explicit default.
- Keep synchronous list/resolve APIs for existing TTS/CLI consumers. Add asynchronous path resolution at existing warmup, async extends and bundled preload callers; prime the existing shared source before later synchronous resolution. No new cache or registry.
- Resolve entryPoint under the existing frontend-ID directory convention. Runtime fixture adds an entry with a non-default entry filename, without modifying production TypeScript.
- Package manifest schemas, compatible pairings, stable identity, dependency selection and backend defaults remain under issue248/remaining76; no inference from catalogue membership.
- Source: rule-pack.ts list/resolve/extends/preload callers; test/harness/runtime.js warmFrontend; sync-resource-cache.ts keepSyncResource; public/rules/frontends/manifest.json; existing resource-manifest and single-parse fixtures.

## Surprises
The asynchronous YAML source loader does not automatically keep fetched text. Async catalogue discovery must explicitly prime the existing owner to avoid a later synchronous manifest request.

The old map's only external consumer was the existing single-parse fixture; it now enumerates through the catalogue API. The recorded resource lists each gain the same catalogue path; no regeneration or local test was run. Existing fixtures add a runtime catalogue entry using selected.yaml, validate malformed/duplicate entries, and check async discovery followed by synchronous resolution without another manifest request. These remain authored assertions until hosted CI executes them.

## Next step
Publish, read hosted CI and obtain private full-PR Claude review/response. Root owns review ledger and merge.
