# DECtalk phrase profile (investigation only)

## Goal
Why one DECtalk frame-gate phrase costs ~0.28 s in CI, and the 2-3 changes that would cut it most.
Worktree: `C:\Users\Q\code\Qlatt-dectalk-phrase-profile` (master 3b30b80c). No edits under src/public/test/scripts
except `scripts/tmp-*`. No commits, no PR.

## State
Done; report sent to team-lead.
- Throwaway files in the worktree: `scripts/tmp-phrase-probe.ts`, `tmp-phrase-counters.ts`, `tmp-ab-run.ts`,
  `tmp-ab-loader.mjs`, `tmp-profile-summary.mjs`, `tmp-profile-callers.mjs`, `tmp-vitest.config.ts`,
  `tmp-fixed-cost-{empty,english,dectalk}.test.ts`, `tmp-import-cost.test.ts`. CPU profile in session scratchpad `prof1/`.
- Measured locally (node 22.18, ts-node transpile-only, shared machine, wall noise about +-10%):
  - All 919 phrases once: 279.2 s, mean 303.8 ms, median 261.6 ms, max 3572 ms (CI: 298 s for the file).
  - decode+compare 1.4% of a phrase. Linear in segments: 32.7 ms + 8.41 ms/segment, R^2 0.994.
  - 64,360 CEL evals/phrase (2,233/segment), 80% of them in the two frame phases; 0 cache misses in 2.5M evals.
  - qlatt-english on the same texts: 92 ms mean vs 384 ms, 122-143 evals/segment, intercept 3.5 ms.
  - Profile self time: cel-js 35.6%, rule-engine.ts 21.3%, HRG graph 14.7%, cel-expressions.ts 8.8%, GC 7.2%,
    lowering 5.5%, provenance.ts 1.8%, text stage 1.0%, comparison 0.8%. No single dominant function (top 8.3%).
  - Inclusive: runFrameRules 36.2% (frame machine 16.6%, per-unit feature expressions 15.3%), executeMatch 28.8%
    (eager define blocks 13.9%, constraint trial 7.1%), selectMatches 7.9%, commit 10%, projectPolicyValues 5.4%,
    validateFeatureValue 5.0%, regexReplace 2.3%.
  - A/B by in-memory loader patches, tracks byte-identical: memoized policy projection + cached RegExp +
    non-throwing union validation: about -8% wall; lazy rule definitions: about -8%; all four: -16% to -18%.
  - vitest per file: importing src/tts-frontend 2.75-2.8 s, first dectalk call 1.29 s (english 0.15 s); empty file 0.9 s run.

## Decisions and why
- Use the repo's `--loader ts-node/esm/transpile-only` (measure-frontend-time.ts warns tsx distorts profiles).
- Profile set uses --count 39 (no 448-segment phrase) so one long text does not weigh 25%.
- A/B without touching src: a second ESM loader patches ts-node's output in memory.
- A/B runs side by side in parallel processes, because sequential runs swung more than the effect.

## Surprises
- No single dominant cost. Per-phrase cost is the volume of interpreted CEL, not re-parsing or reloading.
- Profile line numbers are of ts-node's transpiled JS, not the .ts source; map by function name.
- Lazy definitions change a firing rule's recorded parents (provenance), so that one is a design decision.

## Next step
None owed. Not measured: CI-side import cost, where the 2.8 s import goes inside rule-engine/transcribe-text,
compiling frame-program expressions, the other dectalk-*.test.ts files.
