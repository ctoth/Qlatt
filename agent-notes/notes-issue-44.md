Checkpoint: issue 44, 2026-09-08. Native factories now use registry native binding; unsupported bindings fail before graph allocation; report interval centralized.
Worktree C:/Users/Q/code/Qlatt-issue-44, branch fix/issue-44-native-binding, clean; commit 8235d16685469779fc1170b141e36e003014e41b.
TDD: 8 regression cases red then green; 22 focused tests, typecheck, lint pass. PR https://github.com/ctoth/Qlatt/pull/176 includes verified Closes #44.
User explicitly authorized CI monitoring and merge on green. CI run 34200924505 passed audit, lint, typecheck, native backend and WASM builds; npm test running.
No blocker. Next: monitor exact-head CI, review final merge conditions, normal two-parent merge and verify issue closure. Preserve primary checkout changes.
