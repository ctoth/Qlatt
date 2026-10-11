Issue 17: derive speaker formant overrides from declarative capabilities; require F11 regression and core typecheck.
Authorized: TDD, clean worktree, commit and PR with Closes #17; no merge requested.
Worktree C:\Users\Q\code\Qlatt-issue-17; branch issue-17-speaker-formants; base e4e6e1fc9de6ac10944905f8b7e869922df0a00a.
Dependencies installed via npm ci; fixed list now lives in src/speaker-projection.ts.
Next: inspect projection and capability flow, write failing regression. No blocker.

Frontend loads declarative inventory.base_params before speaker projection; this is the existing frontend capability surface.
SPEAKER_FORMANT_KEYS is fixed in speaker-projection.ts; projectSpeakerFields has one production caller in frontend.
Added test/speaker-formant-capabilities.test.ts in issue worktree; next action must directly inspect new file.
Test clones resources, declares F11=11000 and expects active Segment targets to scale to 13200.
Next: run red test, derive keys from active inventory and pass to projection, then focused/core/full gates and PR.

Red regression confirmed F11 remained 11000 instead of expected 13200 before production edits.
Implemented active inventory base_params formant-key selection and required key-list argument to projectSpeakerFields; removed fixed exported list.
Focused tests: 3 files, 16 tests passed; typecheck:core exited 0. Biome changed-file check --write exited 0.
Candidate paths: src/speaker-projection.ts, src/tts-frontend.ts, test/speaker-projection.test.ts, test/speaker-formant-capabilities.test.ts.
Next: inspect formatter summary/diff, build WASM prerequisites, commit and final full gate, refresh base and publish PR with Closes #17.

Committed and pushed ff56742567a1953a09727cedefa8910aa5929b86 on issue-17-speaker-formants.
Worktree status changed_paths=0; commit contains exactly the four candidate source/test paths.
Origin/master refreshed and unchanged at e4e6e1fc9de6ac10944905f8b7e869922df0a00a.
PR body written and inspected at C:\Users\Q\code\Qlatt-issue-17-pr.md; includes Closes #17.
Next: gh pr create on ctoth/Qlatt master, verify body equality and same-repo ownership, report CI status. Full gate owned by existing PR CI; no merge authority.
