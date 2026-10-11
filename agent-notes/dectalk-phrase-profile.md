# DECtalk phrase profile (investigation only)

## Goal
Why one DECtalk frame-gate phrase costs ~0.28 s in CI, and the 2-3 changes that would cut it most.
Worktree: `C:\Users\Q\code\Qlatt-dectalk-phrase-profile` (master 3b30b80c). No edits under src/public/test/scripts
except `scripts/tmp-*`. No commits, no PR.

## State
- Probes (all throwaway, in the worktree): `scripts/tmp-phrase-probe.ts`, `scripts/tmp-profile-summary.mjs`,
  `scripts/tmp-profile-callers.mjs`. CPU profile in session scratchpad `prof1/`.
- Measured locally (node 22.18, ts-node transpile-only):
  - All 919 phrases once: 279.2 s, mean 303.8 ms, median 261.6 ms, max 3572 ms (CI: 298 s for the file).
  - 40-phrase set: first call 1.75 s, later calls median ~270-290 ms; decode+compare 5.3 ms mean (1.4%).
  - linear in segments: 32.7 ms + 8.41 ms/segment, R^2 0.994. ~2,400 CEL evals per segment.
  - stages: formant_drawing 21.8%, articulation 17.7%, duration 14.6%, annotation 8.8%, lowering 7.2%,
    postlexical 6.5%, prosody 6.4%, structural 4.6%; text stages together < 10%.
  - CEL expression cache: 4,091,829 hits, 0 misses over 40 phrases; 1,700 distinct expressions.
- Profile (39 phrases, steady, 76.6 s non-idle), self time: cel-js 35.6%, rule-engine.ts 21.3%, HRG graph 14.7%,
  cel-expressions.ts 8.8%, GC 7.2%, lowering 5.5%, provenance.ts 1.8%, text stage 1.0%, comparison 0.8%.
  Inclusive: runGraphRuleEngine 80%, evaluateExpression 55%, runFrameRules 36%, executeMatch 28.8%,
  evaluateCondition 17.9%, transaction commit 10%, constraintFailsOnTrial 7.1%.
  Specific wasteful spots: projectPolicyValues 5.4% (whole policy tree re-projected in each of 5
  runGraphRuleEngine calls per phrase); validateFeatureValue 5.0% (union variants tried by throw/catch,
  featureValueError 2.2% self); regexReplace 2.3% (new RegExp per call, no cache); voice + source-contour YAML
  re-read and re-parsed per call 0.8%; buildUtteranceSchema per call 0.8%; getDecisions copy in lowering 0.55%.
- Profile line numbers are of ts-node's transpiled JS, not the .ts source; map by function name.

## Decisions and why
- Use the repo's `--loader ts-node/esm/transpile-only` (measure-frontend-time.ts warns tsx distorts profiles).
- Profile set uses --count 39 (no 448-segment phrase) so one long text does not weigh 25%.

## Surprises
- No single dominant cost. Per-phrase cost is the volume of interpreted CEL (tens of thousands of evals), not
  re-parsing or reloading.
- constraintFailsOnTrial already exists as an earlier optimization of the duration phase.

## Next step
qlatt-english comparison; per-phase CEL eval counts and union-throw count; vitest per-file fixed cost;
then (if time) A/B the cheap fixes on a copy outside src to back the saving estimates.
