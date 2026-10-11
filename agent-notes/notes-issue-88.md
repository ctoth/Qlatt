Checkpoint: issue 88, branch issue-88-rust-primitives in C:/Users/Q/code/Qlatt-issue-88, base 2ec12406.
Five cited Rust crates and shared sample ABI now replace JS DSP; baseline registry has bindings.
TDD: registry regression failed for missing binding; 15 frozen pre-port waveform cases now pass after WASM build.
Remaining: other standalone registries, Node loader handling shared adapter imports, seed/lifecycle/native tests, full gates and golden rendering.
Publish clean scoped PR with Closes #88; no merge authorization. Primary checkout preserved.
Checkpoint: all 3 standalone registries now bound; Node loader inlines new sample adapter (Node schedule regression red then green).
Native cargo test -p noise-source links all five crates with distinct exported symbols and verifies filters/source/seed independence.
Golden CLI fails before rendering at path-utils import.meta.env.BASE_URL identically on unchanged base 2ec12406 and candidate.
Added seed/reset, stereo isolation, early disposal tests; WASM rebuild and typecheck underway, one Biome assignment-expression fix needed.
Next: full-graph base/candidate render comparison via Vitest, final gates, scoped commit and PR Closes #88.
Checkpoint: full npm test passed (201 files/1695 tests); typecheck, build, native-host tests pass; Biome only existing frication numeric warning.
Node full-graph base-vs-candidate renders sample-identical for klatt80-baseline and qlatt-beauty using comparison script and existing tolerances.
Golden CLI existing import.meta.env failure confirmed exact base; browser speech harness YAML fails before DSP, so direct browser primitive probe added.
Direct probe needs wasmBytes (Chrome worklets cannot fetch), matching real runtime loader; fix probe and rerun next.
Then final scoped diff, commit, push and PR with Closes #88; keep worktree clean and primary untracked files intact.
Delivery: commit d76646ab9cb7a63dc07492e75ed7fb5340ae9308 pushed; PR https://github.com/ctoth/Qlatt/pull/198 opened with Closes #88.
Final npm test passed (201 files/1696 tests), typecheck/check/build and native tests pass; Chrome direct renders match WASM for all five.
Standalone synth now preloads and supplies all five WASM byte buffers, covered by a red/green regression.
Worktree C:/Users/Q/code/Qlatt-issue-88 clean; primary files preserved. No merge requested/performed.
Golden CLI baseline failure documented in PR; dedicated Node pre-port render comparisons are exact for baseline and beauty.
Merge checkpoint: user authorized babysitting and merge when green.
CI quality succeeded on exact head d76646ab; no review items or retries; PR was CLEAN/MERGEABLE.
PR #198 merged normally as 47628abbab3e9512ed1e15c29a8bf8801f60bc20; issue #88 confirmed CLOSED.
Worktree remains clean; primary checkout preserved.
