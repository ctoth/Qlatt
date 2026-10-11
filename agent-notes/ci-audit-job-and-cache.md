# ci-audit-job-and-cache

## Goal
Worktree `C:\Users\Q\code\Qlatt-ci-audit-job-and-cache` (branch `ci-audit-job-and-cache`, base master 3b30b80c).
1. Move `test/audit-dictionary.test.ts` out of the default `npm test` run; add `npm run test:audit` and a nightly workflow.
2. Cache the node-web-audio-api native build in `.github/workflows/ci.yml`.
Open a PR against master, do not merge; show a cache-miss run and a cache-hit rerun.

## State
- `npm ci` done in the worktree. No edits yet.

## Decisions and why
- Exclude via `vitest.config.ts` `exclude` plus a second config `vitest.audit.config.ts`: an env switch needs cross-env on Windows; config exclude also covers bare `npx vitest run`.
- Cache only `node_modules/node-web-audio-api/node-web-audio-api.build-release.node` (what `build:only` copies out of `target/release`; `load-native.cjs` prefers it).
- Key on OS, arch, the package's lockfile `integrity`, and `rustc --version`; not the whole lockfile, so unrelated dependency bumps keep the hit.
- No Cargo cache: reference run 38103417133 shows `bash build.sh` 5 s and `cargo test --workspace` 17 s.

## Surprises
- The fork tarball ships a Windows PE `node-web-audio-api.build-release.node`; on Linux it must be replaced by the build (or the cache restore).
- node-web-audio-api has no Cargo.lock in the tarball (`.npmignore` drops `Cargo.*`... the Cargo.toml is present though), so each uncached build resolves crates fresh.
- apt `libasound2-dev` step is 14 s; whether the runtime lib is on the runner image without it is only testable in CI.

## Next step
Edit configs, package.json, workflows, docs; run local proof; push; PR; watch CI.
