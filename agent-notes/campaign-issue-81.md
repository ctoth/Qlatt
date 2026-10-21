# Issue 81: audio typecheck coverage

## Goal
Cover every shipped worklet processor with the dedicated audio typecheck.

## State
Started from origin/master 5e3f34b6ad4af5b7a1beaf6340869052a28b92db in isolated worktree Qlatt-campaign-81. Replaced the processor allowlist in tsconfig.audio.json with the same include entries as tsconfig.worklets.json. Local CI checks were not run, per project instruction.

## Decisions and why
Smallest change: replace the eighteen processor entries with the existing emitting project's processor glob and wasm-utils.ts helper entry (18 lines removed, 2 added). Retain audio-worklet-globals.d.ts. This also includes sample-processor.ts. No additional test or guard is needed for this configuration alignment. PR CI will run validation; do not rerun CI locally.

## Surprises
None in implementation. Earlier grooming used a nonexistent registry.ts path; resumed with supervisor authorization and verified source paths.

## Next step
Commit and push, open a PR closing #81, then await supervisor-arranged Claude review and respond to findings. Supervisor owns merge.
