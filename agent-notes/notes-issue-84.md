## Checkpoint 2026-09-08
Issue 84 worktree: C:/Users/Q/code/Qlatt-issue-84, branch issue-84-native-dsp.
Added 16 native link tests; red unresolved imports, green after rlib manifest additions.
Existing pitch-sync test fails on original manifest; corrected test to inspect history before processing input. Workspace tests pass.
WASM builds with both crate types change bytes; investigate cdylib-only build invocation before publication. Full JS/static gates running.
## Checkpoint: PR published
PR https://github.com/ctoth/Qlatt/pull/201 includes Closes #84; HEAD f9619e95; worktree clean.
Native CI passes with WASM target absent after conditional-removal fix. Local cargo workspace tests, build, check, typecheck pass.
Restored generated public WASM files; PR bytes unchanged; PR explicitly notes dual crate-type rebuilds differ.
Full npm test still running in session 98470 (full-test.log); quality CI pending. Finish verification and report PR unmerged.
Final: npm test exited 0; native CI passes at f9619e95, quality pending. PR body updated with validation; worktree clean and no committed WASM diff.
