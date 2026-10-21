# Issue 81: audio typecheck coverage

## Goal
Cover every shipped worklet processor with the dedicated audio typecheck.

## State
Started from origin/master 5e3f34b6ad4af5b7a1beaf6340869052a28b92db in isolated worktree Qlatt-campaign-81. Replaced the processor allowlist in tsconfig.audio.json with the same include entries as tsconfig.worklets.json. Local CI checks were not run, per project instruction.

PR #322 is open. Supervisor reports all seven CI jobs passed on implementation head 2a0dec4d41dae175ccbd68d78d0e39996620db87. Claude reviewed the full PR range and found no configuration defect; the review gate completed. The dedicated typecheck:audio command has not been run. CI's root typecheck covers the worklet sources but does not invoke that dedicated command.

## Decisions and why
Smallest change: replace the eighteen processor entries with the existing emitting project's processor glob and wasm-utils.ts helper entry (18 lines removed, 2 added). Retain audio-worklet-globals.d.ts. This also includes sample-processor.ts. No additional test or guard is needed for this configuration alignment. Use existing PR CI without duplicating its checks locally; its success does not establish a dedicated audio-project invocation.

## Surprises
None in implementation. Earlier grooming used a nonexistent registry.ts path; resumed with supervisor authorization and verified source paths.

## Next step
Implementer response: accepted Claude's note-only finding. Corrected the stale open-PR instruction and narrowed the validation claim above; no configuration change or new CI guard is warranted. Push this note update for supervisor review followup and current-head CI verification. Supervisor owns merge and cleanup.
