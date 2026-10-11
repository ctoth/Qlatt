# DECtalk phrase profile (investigation only)

## Goal
Why one DECtalk frame-gate phrase costs ~0.28 s in CI, and the 2-3 changes that would cut it most.
Worktree: `C:\Users\Q\code\Qlatt-dectalk-phrase-profile` (master 3b30b80c). No edits under src/public/test/scripts
except `scripts/tmp-*`. No commits, no PR.

## State
- Probe: `scripts/tmp-phrase-probe.ts` (40 phrases by even stride over 919 phrases / 51 corpora).
- Measured locally (node 22.18, ts-node transpile-only):
  - import 5.1 s (ts-node), fixtures load 0.9 s, first call 1.75 s, later calls median ~270-290 ms.
  - frontend 384 ms mean / phrase (one 448-segment phrase is 3.8 s of 15.4 s); decode+compare 5.3 ms mean (1.4%).
  - linear in segments: 32.7 ms + 8.41 ms/segment, R^2 0.994. ~2,400 CEL evals per segment, 102k per phrase mean.
  - stages: formant_drawing 21.8%, articulation 17.7%, duration 14.6%, annotation 8.8%, lowering 7.2%,
    postlexical 6.5%, prosody 6.4%, structural 4.6%; text stages together < 10%.
  - CEL expression cache: 4,091,829 hits, 0 misses over 40 phrases; 1,700 distinct expressions.

## Decisions and why
- Use the repo's `--loader ts-node/esm/transpile-only` (measure-frontend-time.ts warns tsx distorts profiles).

## Surprises
- Per-phrase cost is CEL evaluation count (thousands per segment), not re-parsing or reloading.

## Next step
CPU profile of steady state; summarize by function and subsystem; count rulepack compiles; qlatt-english
comparison; vitest per-file fixed cost.
