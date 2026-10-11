2026-09-08 checkpoint: issue #53 open; isolated worktree Qlatt-issue-53 at origin/master 32c63af5. User authorizes PR, CI monitoring, normal merge.
Red regression: jitter=.3 produced 0% emitted F0 CV; shimmer worklet regression also red (no effect).
Implemented LF-local fixed-100Hz normalized AR(2), independent amplitude stream; native tests green. Worklet/YAML routing edits underway.
Found old jitter is Fraj 0-100 control, not percent; creaky/whispery presets need explicit migration. Oversampled source has no jitter input.
Next: finish presets/docs/routing, build WASM, run focused/full checks, publish Closes #53 PR, monitor and merge. Main checkout unrelated untracked files preserved.
2026-09-08 checkpoint: candidate 2ed0e769 committed, clean worktree; native CV and WASM shimmer regressions green, typecheck/check/build pass.
Added percent declarations/routing for LF, migrated creaky/whispery presets, documented engineering shimmer range; neutral standalone LF golden passes.
Full npm test session 59741 still running; qlatt-beauty voice-quality-port default render hash failed and focused repro confirms ba317188 instead of eb1487b1.
Need reproduce this on exact base 32c63af5 before attributing failure; no PR published yet. User authorizes monitor and normal merge when green.
Next: base control for render hash, resolve appropriately, then publish and monitor exact-head CI.
2026-09-08 checkpoint: PR #185 published, Closes #53 verified; exact head dcc7611fe0b21b08a5b8fc998aaa8ea30160d92c.
Full local suite: only beauty default hash differed. Exact base passed; beauty inventory jitter=.25 is nonzero. Updated expected nonzero render, added base-captured zero-jitter hash control (both pass).
All focused/native tests, check/typecheck/build, standalone LF golden pass. Migrated DECtalk and canonical presets. Candidate clean; CI full-suite authoritative at final head.
Base control worktree restored test after capture; it can be removed after clean-path verification. No unrelated files touched.
Next: monitor PR #185 exact-head quality job, resolve failures if any, normal merge and verify two parents/issue closure; clean temporary worktrees.
2026-09-08 checkpoint: PR #185 CI run 34248326259 targets dcc7611f; setup, audit, check, and typecheck passed.
Quality job currently builds node-web-audio-api; WASM/native/full tests remain pending.
Exact-base control worktree was clean after restoring our temporary test edit and has been removed.
Candidate worktree remains clean. No implementation changes since publication.
Next: continue CI monitoring, then authorized normal merge and clean candidate worktree after verification.
2026-09-08 completed: PR #185 normal-merged as 6e349a9730ee5cac00525f8fe9cebb8806a316d1; issue #53 CLOSED.
CI run 34248326259 SUCCESS on exact head dcc7611fe0b21b08a5b8fc998aaa8ea30160d92c, including native tests/full Vitest/production build.
Verified merge parents a962b0158ecb3fdedf508380a06d42ed63faa94e and dcc7611fe0b21b08a5b8fc998aaa8ea30160d92c.
Candidate and base worktrees removed after clean status and absolute path verification; issue branch cleanup completed.
Main checkout unrelated changes preserved. Delivery complete.
