# Master baseline investigation — 2026-05-24

## What I know
- Worktree created at `C:/Users/Q/code/Qlatt-master` checking out `master` (HEAD `15a7501e`).
- Junction `node_modules` -> main checkout's `node_modules` (package.json + lock identical).
- Ran `npx vitest run` at master.

## Vitest summary at master
```
Snapshots  6 failed
Test Files  4 failed | 117 passed (121)
Tests       9 failed | 1054 passed | 18 skipped (1081)
Duration    61.85s
```

## Observed failure
- `tts-frontend-snapshot.test.ts` snapshot diff shows extra trailing SIL frames vs locked snapshot — same shape as observed at c219a8f8.

## TODO
- Extract full list of failing test names from log
- Build diff table vs c219a8f8 baseline (9 known failures from chunk-2 report)
- Write report to `reports/master-baseline-investigator.md`
- Remove junction then worktree

## Constraint reminder
- Main checkout untouched (junction only created in worktree).
- Must remove junction before `git worktree remove` to avoid traversing into shared node_modules.
