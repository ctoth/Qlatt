2026-09-08 checkpoint: Issue #54 implementation in C:\Users\Q\code\Qlatt-issue-54 on issue-54-vocal-effort, based on add90010.
Added red-first vocal effort tests, cited semantics covariation, frontend accent/phrase effort, feature declarations and lowering column. Focused/schema checks: 30 passed.
WASM build finished; full npm test running (session 85484); typecheck/format running (34985). No PR yet.
Report script runs via node scripts/run-frontend-script.mjs scripts/report-vocal-effort.ts; AV now varies with effort, GO stays 47. Direct ts-node cannot load Vite env.
Next: inspect full gate, add before/after notes and scheduling/provenance coverage, review diff, scoped commit and PR with Closes #54. Primary checkout untracked files preserved.
2026-09-08 checkpoint: PR https://github.com/ctoth/Qlatt/pull/216 published, literal Closes #54 verified. Head d0e910fb080129dc735210a5986e9270f0bdee7b; worktree clean.
Full local run: 209 files passed, six legacy assertions failed in voice-quality-port and tone-association-compatibility. Repaired both, 38 tests now pass; zero effort retains old audio hash exactly.
Final new effort suite: 6 tests pass, including real graph scheduling, range diagnostic and cited provenance; schema/single-parse pass. Typecheck, check and production build pass (one existing lint warning).
Generated worklet churn restored; only 12 scoped files committed. AV report and representative values included in notes-sound-quality.md.
CI run 34289555109 native/quality running on exact PR head; gh watch session 15212. No merge authority requested or inferred.
2026-09-08 checkpoint: PR #216 remains at d0e910fb; all requested implementation/publication work complete and worktree clean.
Exact-head CI native job passed in 21 seconds; quality lint/typecheck passed and node-web-audio-api build is running.
No product failures or design blockers currently outstanding. No merge authorized.
Local full-suite failures were limited to six compatibility assertions already repaired and verified in a 38-test run.
Next: await quality job via existing watch session 15212, then update PR validation text and report final status.
2026-09-08 final: CI run 34289555109 passed both jobs on d0e910fb; 211 Vitest files passed. PR #216 validation body updated, Closes #54 retained. Worktree clean; PR remains unmerged as requested.
