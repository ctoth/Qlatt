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
Publish, read hosted CI and obtain private full-PR Claude review; respond before root merge. Existing fixture uses the actual browser loader with HTTP failure then real WASM bytes, checking its subpath/cachebuster URL, loaded state, working exports and no repeated request after loading. No local CI.
