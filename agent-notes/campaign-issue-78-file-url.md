# Issue 78: native file URL acquisition

## Goal
Route explicit Node file URLs through native filesystem conversion and preserve absence versus failure, while keeping HTTP URLs out of filesystem probes.

## State
Implemented from e8c76ab0 after PR452 merged. Isolated branch; parent owns final verification/merge. Other agents' work is preserved. Existing fixtures cover encoded filenames, binary reads, ENOENT/ENOTDIR absence without fetch, HTTP without filesystem probes, conversion/permission errors and both dictionary acquisition paths.

## Decisions and why
Smallest approved slice: roughly 15–25 production lines and 60–85 existing-fixture lines, allowing modest error-contract coverage. Preserve file URL spelling at normalization. Use existing fileURLToPath and stat/read facilities: only ENOENT/ENOTDIR mean absent; malformed URLs and permissions remain errors. Explicit file URLs never fall through to package probing or Node fetch. HTTP URLs return null before filesystem probes. Reuse YAML/CMU owners and errors; no new resolver, cache, scheme or identity contract. Document-relative URLs and arbitrary resource-root threading remain separate. Platform conversion is exercised on the hosted platform; no unsupported cross-platform execution claim.

## Surprises
None.

## Next step
Publish, private full-PR Claude review/response and hosted CI. No local CI. Parent owns canonical ledger/gate.
