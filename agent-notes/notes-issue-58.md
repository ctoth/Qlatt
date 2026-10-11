
Checkpoint 2026-09-08: Worktree Qlatt-issue-58, branch issue-58-two-mass-source, base 1ac9c8b8.
Ishizaka notes already tracked. Original Steinecke pp1875-1880 verified: squared area pressure, collision /2l, l=1.4 from Ishizaka p1250.
Native TDD red then green: onset bracket .002/.003 and Q=.6/.57 at Ps=.0145 (fold maxima).
Integration test added; fixture needs formant expansion before evaluating. No PR yet.
Next: WASM ABI/worklet, aerodynamic pressure port and stevens91 mode3, integration tests and full gates.

Checkpoint 2026-09-08: Native solver + WASM/worklet compiled; onset, period doubling, pressure silence/restart, bounds pass.
Compiled worklet test validates aero port8, disconnected-input silence, invalid pressure diagnostics, block invariance and disposal.
Stevens91 had pre-existing A7-A10 vocabulary failure; reverted only own edits there. Dedicated steinecke95 inherits baseline semantics/registry, owns graph.
Mode3 full phrase render now passes pressure-on vs zero comparison; typecheck passed before last additions.
Next: correct source extraction errata, finish host docs/registry metadata, full checks, inspect diff, commit and publish Closes #58.

Checkpoint 2026-09-08: Full npm test passed (log TEMP/qlatt-issue-58-tests.log); focused final graph tests pass.
Static checks, typecheck, production build, native tests and clippy passed. Bacon graph validation passed after putting generated-node edge under formantBanks.connections.
Reviewed/staged 20 scoped files, including new tracked WASM and explicit steinecke95 graph; existing dirty root preserved.
Docs explain frontend sourceMode override and lack of acoustic tract feedback; corrected two conflicting Steinecke extractions.
Next: commit, push, publish PR with literal Closes #58; verify remote body/head and clean worktree.
