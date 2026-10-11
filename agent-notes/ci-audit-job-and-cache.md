# ci-audit-job-and-cache

## Goal
Worktree `C:\Users\Q\code\Qlatt-ci-audit-job-and-cache`.
- Task 1 (done): PR 315 merged as master e2176d22.
- Task 2 (current): branch `ci-test-shards` from master ed1953c3, commit 5b467a47, PR 318 against master (do not merge). Vitest suite as 4 shards on separate runners.

## State
- PR 318 run 38114390709: attempt 1 (cache miss) green, wall 05:19:02 -> 05:23:44 = 4 m 42 s; attempt 2 (hit) green, wall 05:26:51 -> 05:30:21 = 3 m 30 s.
- Attempt 1 jobs (s): native 25, node-web-audio-api 108 (build 90), quality 41, test 1..4 = 168/169/153/157; vitest step 142/139/121/131.
- Attempt 2 jobs (s): native 17, node-web-audio-api 14, quality 37, test 1..4 = 190/127/93/154; vitest step 161/102/70/131.
- Counts, identical in both attempts: files 81+81+81+80 = 323; tests 1260+1376+1161+1115 = 4912 (2 skipped files, 2 skipped tests). Union of file names over the 4 shard logs is identical to `npx vitest list --filesOnly` (323, no duplicates).
- Per-shard setup: checkout 3-7, setup-node 2-5, npm ci 1-4, restore 0-2, rustup 2-3, build.sh 5-17.
- Still needed: unsharded test count on ed1953c3 from master run 38114255482 (in progress at 05:31 UTC) to compare with 4912, and that run's wall time as the baseline.

## Decisions and why
- Key passed to shards as a job output.
- `quality` keeps the wasm build because `npm run build` ships `public/worklets/*.wasm`.
- Shards build wasm themselves; artifact passing not implemented or measured.
- deploy.yml unchanged.
- No branch protection, no rulesets; no docs describe CI jobs.

## Surprises
- `vitest list --shard` ignores the shard.
- Local `npx vitest list --json` fails in this worktree ("No test suite found" in dectalk-sweep-gate-1..4 and yaml-graph; no wasm build here), so the unsharded test count must come from CI.
- The first PR run missed the cache because master's runs for e2176d22/ed1953c3 had not finished (cache saves in the post step), so no master-scoped cache existed yet.
- Runner variance: the same shard 3 took 121 s then 70 s.
- From task 1, still open with Q: rerere "keep HEAD" resolutions for the issue-47 stash conflict in the shared rr-cache. Never `git stash` in a worktree.

## Next step
Read master run 38114255482 when complete (Test Files / Tests totals, job durations, wall), then send the report to team-lead.
