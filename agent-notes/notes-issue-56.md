2026-09-08 checkpoint: issue #56 authorized isolated TDD, PR with Closes #56, CI monitoring and normal merge.
Worktree C:\Users\Q\code\Qlatt-issue-56, branch issue-56-voice-quality, base 66b4c375. Dependencies and WASM built.
Read Klatt 1990 notes and existing klsyn88 primitives; preserve default F1 via gated alternative, retain LF tilt ownership.
Regression added: baseline renders ignore FTP/DF1/DB1 as expected; preset lacks cues. Beauty test must use beauty frontend.
Next: correct test frontend, capture default PCM hashes, implement YAML port and minimal macro output attachment plus preset projection.
2026-09-08 checkpoint: port implemented; 71 focused tests passed, including both pre-port PCM hashes and enabled-control renders.
Optional macro cascadeOutput keeps original F1 at zero deltas; tracheal pair bypasses exactly when coincident. LF retains TL ownership.
Preset projection/lowering now carries six controls, breathy TL=24 and female Table VII frequencies; estimates and legacy DSP limits documented.
Typecheck found a regression-test heterogeneous-array inference issue; annotate test cases before full gate. No PR yet.
Next: finish tests/static checks, inspect diff, commit scoped files, publish with Closes #56, monitor exact-head CI and merge.
2026-09-08 checkpoint: PR https://github.com/ctoth/Qlatt/pull/181 published with Closes #56; clean worktree, head ea7ded8843feddb567d1d7787e5f41b721190054.
Local full gate passed 174 files / 1415 tests; final test/citation additions passed 38 focused tests and typecheck. No generated artifacts staged.
CI run 34203238126 on exact head passed audit/lint/typecheck, currently building native audio backend.
Default PCM hashes matched base for both experiments; branch contains 18 scoped files and docs describing legacy DSP limits.
Next: continue CI monitoring, fix any evidenced failure, then normal two-parent merge and verify issue closure.
2026-09-08 checkpoint: CI 34203238126 failed eight tone-association track hash snapshots; 1483 tests passed, including PCM regressions.
CI has 179 files versus local 174; failing tone-association-compatibility.test.ts is absent locally, indicating newly merged base tests in synthetic merge.
No merge performed. PR head remains ea7ded88; local checkout clean.
Next: fetch current master, inspect CI merge/base and new snapshot contract, integrate latest base, prove neutral new columns are sole hash change.
Then repair compatibility fixture narrowly, rerun affected checks, push and monitor new exact head.
2026-09-08 completed: PR #181 normal-merged as 5d30839be1169694fe918a610fb9f4b730860220; issue #56 verified CLOSED.
Exact-head CI 34203951114 on f986737674702451e0ef2959c152db56ec08e50a passed all 1491 tests in 179 files and production build.
Integrated latest master; legacy snapshots retained, with explicit assertions for six neutral added columns before hashing original fields.
PR body retains Closes #56 and final CI evidence. Worktree clean; original main-checkout changes preserved.
No remaining authorized work.
