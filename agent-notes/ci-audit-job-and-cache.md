# ci-audit-job-and-cache

## Goal
Worktree `C:\Users\Q\code\Qlatt-ci-audit-job-and-cache` (branch `ci-audit-job-and-cache`, base master 3b30b80c).
1. Move `test/audit-dictionary.test.ts` out of the default `npm test` run; add `npm run test:audit` and a nightly workflow.
2. Cache the node-web-audio-api native build in `.github/workflows/ci.yml`.
Open a PR against master, do not merge; show a cache-miss run and a cache-hit rerun.

## State
- BLOCKED on approval. I ran `git stash -q; ...; git stash pop -q` with nothing of mine to stash; the pop applied the shared `stash@{0}` (issue-47-cel-builtins), conflicted, and left `UU src/builtin-functions.ts` and `UU src/declarative-frontend/cel-expressions.ts`. Stash entry is intact. The cleanup (`git rerere forget <both>` then `git checkout HEAD -- <both>`) was denied by the permission classifier; reported to team-lead, waiting.
- Edited, uncommitted: `vitest.config.ts` (exclude + exported `dictionaryAuditTest`), new `vitest.audit.config.ts`, `package.json` (`test:audit`), `biome.json` (includes the new config), `AGENTS.md`, `README.md`, `.github/workflows/ci.yml` (cache), new `.github/workflows/dictionary-audit.yml`.
- Verified by listing: default config selects 315 files, none of them the audit (316 before); audit config selects only `test/audit-dictionary.test.ts`; `npx vitest list test/yaml-loader.test.ts` still selects that file; the audit by path under the default config selects nothing (needs `--config vitest.audit.config.ts`).
- Not yet run: `npm run check`, `npm run typecheck`, `npm run test:audit`, any CI.

## Decisions and why
- Exclude via `vitest.config.ts` `exclude` plus a second config: an env switch needs cross-env on Windows; config exclude also covers bare `npx vitest run`.
- Cache only `node_modules/node-web-audio-api/node-web-audio-api.build-release.node` (what `build:only` copies out of `target/release`; `load-native.cjs` prefers it).
- Key `node-web-audio-api-<os>-<arch>-rust-<rustc version>-<commit sha from the lockfile resolved URL>`; not the whole lockfile, so unrelated dependency bumps keep the hit. actions/cache@v6 (latest release v6.1.0).
- apt `libasound2-dev` moved inside the miss-only build step; the hit run will show whether the runtime library is on the runner image.
- No Cargo cache: reference run 38103417133 shows `bash build.sh` 5 s and `cargo test --workspace` 17 s.
- Nightly workflow currently has no WASM build: the only WASM the frontend reads is `public/worklets/f0-filters.wasm`, which is tracked. Confirm with a local `npm run test:audit` (this worktree has no `target/`).

## Surprises
- The fork tarball ships a Windows PE `node-web-audio-api.build-release.node`; on Linux the build or the cache restore replaces it.
- node-web-audio-api ships no Cargo.lock, so each uncached build resolves crates fresh; the cache freezes that resolution until the key changes.
- The stash stack is shared across worktrees (memory `git-state-changes-run-alone` updated).

## Next step
After the two files are back at HEAD: `npm run check`, `npm run typecheck`, `npx vitest run test/yaml-loader.test.ts`, `npm run test:audit` (foreground, long timeout); commit; push; `gh pr create`; watch; `gh run rerun`; report durations.
