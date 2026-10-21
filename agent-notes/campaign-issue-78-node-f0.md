# Issue 78: Node render F0 acquisition

## Goal
Use the Node renderer's acquired asset loader for F0 WASM before synchronous TTS.

## State
Implemented from 447d28f5 in an isolated worktree: two production lines and existing fixture coverage for the actual Node adapter plus render caller. Parent approved this bounded slice and owns merge. Other agents' work is preserved.

## Decisions and why
Smallest change is two production lines: import the existing preload function and await it inside the existing render try before TTS. The asset loader already uses request.repoRoot/public/worklets; retain its lifetime and existing finally disposal. Add roughly 35–50 lines to existing fixtures for explicit-root acquisition with a changed CWD probe and actual backend ordering/shared-loader evidence. No new loader, root option, cache or protocol. Direct synchronous fallback remains. This does not establish full rendering from a different CWD: experiment/frontend document roots still need separate work under #78.

## Surprises
None.

## Next step
PR447 published; initial quality/native/audio checks pass, test shards pending. Await final hosted CI and parent gate/merge. No local CI. The focused fixture mocks the CWD probe; it does not claim a complete relocated frontend render.

## Review response
Accepted Claude's two full passes over all four initial files in 447d28f5...efb80a5e. No actionable defects. Execution18831, transcript611b79b7-965a-4c88-9268-2700602d65d0 under the campaign78-node-f0 Claude project; no reviewer writes or program execution. Corrected the optional stale F0 loader comments to distinguish Node renderer preload from other Node callers' retained lazy fallback. Existing singleton concurrency/source-root limitations are unchanged; no new cache or lock. Parent owns ledger, final delta verification and merge.
