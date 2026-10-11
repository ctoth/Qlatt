# npm update repair checkpoint
- npm 10.9.3 crashes in Arborist `#loadPeerSet` while resolving Vitest optional browser peers.
- Root manifest and lock declare Vitest 4.1.x; installed tree contains Vitest 4.1.0 and no browser-playwright package.
- npm 11.19.1 supports Node 22.18.0 but its dry run looped with sustained CPU and was stopped cleanly.
- Next: isolate the invalid optional-peer resolution, then perform and verify the smallest update path without touching the existing test edit.

## Verification checkpoint
- Global npm upgraded to 11.19.1; `npm update --no-audit` completes and the ordinary dry run reports up to date.
- The lock now resolves current in-range packages; `npm ls --depth=0` is clean.
- Full and focused tests reproducibly fail only the fricative-heavy runtime peak check at 1.9502713680267334 versus 1.05.
- Next: isolate which updated runtime dependency changes rendering, restore compatibility, and rerun the focused test.
