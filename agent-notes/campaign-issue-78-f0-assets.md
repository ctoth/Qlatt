# Issue 78: browser F0 asset acquisition

## Goal
Use the existing RuntimeAssetLoader for browser F0 kernel acquisition instead of duplicating fetch handling.

## State
Implemented on isolated branch from d00520e7. Parent owns merge and review gate. Other agents' work remains separate; no local CI. All three tracked preload callers now supply the existing browser loader.

## Decisions and why
Smallest slice: roughly 8–15 production lines, 6–9 caller lines, and 25–40 existing fixture lines. Change preloadF0Filters to accept the existing loader, request f0-filters.wasm, and preserve the current loaded-state check and byte injection. The three real callers select their existing worklet base using createBrowserRuntimeAssetLoader. Its rejection text and cachebuster become authoritative; do not claim old fetch error text is preserved. Node synchronous loading, CWD roots, full URL placement and the rest of issue78 remain open. No additional cache, loader or protocol.

## Surprises
None.

## Next step
PR445 published. Initial quality/native/audio prerequisites pass; hosted test shards pending. Existing fixture uses the actual browser loader with HTTP failure then real WASM bytes, checking its subpath/cachebuster URL, loaded state, working exports and no repeated request after loading. Await final hosted CI and parent verification/merge. No local CI.

## Review response
Accepted Claude's two full passes over all six files in d00520e7...43672fbe; no actionable defects reported. Execution37807 completed; transcript c4232e2d-8b84-474f-a205-d35909c7a3d1 in the campaign78-f0-assets Claude project. Reviewer checked all three real callers, loader interface/base/cachebuster/error behavior, unchanged singleton injection and actual fixture. No reviewer writes or program execution. Parent owns ledger and gate; browser rendering was not separately exercised locally. No changes for explicitly rejected pre-existing concurrency concerns or cosmetic observations.
