# ci-audit-job-and-cache

## Goal
Worktree `C:\Users\Q\code\Qlatt-ci-audit-job-and-cache` (branch `ci-audit-job-and-cache`, base master 3b30b80c).
1. Move `test/audit-dictionary.test.ts` out of the default `npm test` run; add `npm run test:audit` and a nightly workflow.
2. Cache the node-web-audio-api native build in `.github/workflows/ci.yml`.
Open a PR against master, do not merge; show a cache-miss run and a cache-hit rerun.

## State
- PR 315 open, head dd005760 (commits 6d3760b9 audit, dd005760 cache). Not merged, not to be merged by me.
- Local: `npm run check` exit 0 (1 warning in untouched scripts/frication-spectrum.ts), `npm run typecheck` clean, `npm run test:audit` 11 passed in 344.67 s with no `target/` dir, yaml-loader by path 15 passed.
- Miss run 38112901082 attempt 1: green. Build node-web-audio-api 112 s (includes apt), npm test 594 s (592.12 s vitest, 321 files passed, 2 skipped; audit absent from log), cache saved with key `node-web-audio-api-Linux-X64-rust-1.99.0-ce3ed1d487a9c2ad4d3090119c208f386a3123f0`.
- Baseline for comparison is master 652f4330 run 38110036684 (frame gate already split): npm test 651 s, audit file 270 s of worker time, build 94 s, apt 8 s.
- Rerun (attempt 2) started for the cache hit.

## Decisions and why
- Exclude via `vitest.config.ts` `exclude` plus a second config: an env switch needs cross-env on Windows; config exclude also covers bare `npx vitest run`.
- Cache only `node_modules/node-web-audio-api/node-web-audio-api.build-release.node`.
- Key on OS, arch, rustc version, package commit sha from the lockfile; not the whole lockfile.
- apt `libasound2-dev` inside the miss-only build step.
- No Cargo cache: `bash build.sh` 5 s, `cargo test --workspace` 9-17 s.
- Nightly workflow has no WASM or native build: the local audit passed without either.

## Surprises
- My `git stash`/`pop` mistake applied the shared issue-47 stash; Q approved cleanup, team-lead ran it. Stash list intact (3 entries).
- The first commit printed "Recorded resolution for 'src/builtin-functions.ts'" and the same for cel-expressions.ts: rerere stored HEAD's content as the resolution of that stash conflict in the shared rr-cache. Must be reported; not cleaned up.
- lint-staged's pre-commit hook does its own stash backup internally.
- The fork tarball ships a Windows PE `build-release.node`; no Cargo.lock in the package.

## Next step
Read attempt 2 durations (`gh run view 38112901082 --json jobs`), confirm "Cache restored" and that tests importing node-web-audio-api pass without the apt step, then send the final report to team-lead.
