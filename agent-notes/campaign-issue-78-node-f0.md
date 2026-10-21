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
Publish, inspect hosted CI and request private full-PR Claude review. No local CI. The focused fixture mocks the CWD probe; it does not claim a complete relocated frontend render.
