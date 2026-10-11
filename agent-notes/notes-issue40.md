Issue 40: move Table III and tolerances to YAML; evaluate experiment realize rules for gain audit.
Worktree: C:\Users\Q\code\Qlatt-issue40; branch issue-40-track-conformance; base d6432b67cd512c68b3f99d47a93046d0d5cf320a.
Authorized: TDD, clean worktree, commit and PR with Closes #40; no merge requested.
Discovery paused for Rule 0: global directory-existence guard appended and verified; repeat directory probes and discovery next.
No implementation edits or tests yet. User confirmed proceed after design explanation.

Rule 0 repair complete: global directory-probe guard installed; four directories verified and discovery repeated successfully.
Read track-analysis Table III, stop tolerances, gain implementation and gain tests. No product edits yet.
Shared evaluator factory createConfiguredEvaluator exists; topo evaluator seeds semantics.params defaults.
Harness display formatter calls analyzeTrackGains(track, sliderParams, sampleRate); selected semantics must be threaded from harness runtime.
Next: inspect diagnostic initialization and experiment loading, add focused regressions, implement YAML and evaluator reuse.

Added and directly inspected test/analysis/track-conformance.test.ts; red run is next. npm ci completed; manifest/lock diff empty.
Tests cover YAML authority, AF/AH separation, and selected expanded realize overrides with cumulative frames.
Gain API plan: optional fourth SemanticsDocument, lazy default baseline expanded via expandFormantBanks; selected harness semantics passed through ExternalState and DisplayState.
Current semantics uses PFE generated aNLinear, fricGainScaled, avsGain, abGainScaled, anGainScaled; old audit demonstrably divergent.
CI runs npm run check, npm run typecheck (includes tests), WASM build, npm test, npm run build. No commits or PR yet.

Red run completed: three intended failures (missing YAML, AH promoted to AF, ignored selected semantics). Added reference/table-iii.yaml and inspected it.
User rejected custom JS migration. Global issue-delivery skill now requires apply_patch for ordinary edits and prohibits scripts used to bypass safeguards.
Removed unused C:\Users\Q\code\issue40-migrate.mjs; it never executed. No tracked product edits yet.
User explicitly requested continuing implementation and PR. Current functions store tablePatch holds inspected/preflighted Table III replacement; preimage_count=1.
Next apply tablePatch, patch imports/tolerances/gain function, thread selected semantics through harness, green tests and PR.

Implementation applied using inspected apply_patch hunks: Table III/tolerances YAML, expanded semantics evaluator, selected semantics threaded runtime -> ExternalState -> DisplayState.
Focused command npm test -- test/analysis/track-conformance.test.ts test/analysis/track-gains.test.ts test/harness-diagnostics exited 0; summary 9 files and 150 tests passed.
Changed-file Biome check --write exited 0; log C:\Users\Q\code\Qlatt-issue40-biome.log not yet read. tsc.cmd existence verified.
Pending: typecheck, final diff review, WASM prerequisites and full suite at candidate commit, fetch base, push and PR with Closes #40.
No commit or PR yet; original checkout preserved except append-only notes.

Committed candidate abe0c36da9020539478d93c1f51ec8dc1db5b574 and merged latest origin/master 51d572eaf34ef1401c26dc679877686f3ad710a0 without conflicts.
Typecheck completed exit 0; build.ps1 completed exit 0. Dependency/build diff from pre-merge commit is quiet (exit 0).
A poll wrapper incorrectly used exec_command; global skill guard added and verified, then existing tsc session polled with write_stdin exit 0.
WASM output directory existence verified; next inventory required wasm files and run full npm test at merged candidate.
Then final scoped review/status, push, PR body Closes #40, verify ownership/body/head. No merge authorized.

PR opened: https://github.com/ctoth/Qlatt/pull/126; head 35edd2549f8fb55b85aebd7e7d7a6250d07f1854; base master; isCrossRepository false.
Full suite exit 0 (138 files, 1151 tests); final typecheck exit 0; repository Biome check exit 0.
Verified remote body canonical equality and Closes #40 phrase; clean implementation worktree (worktree_changes=0).
Latest base fetch remains 51d572eaf34ef1401c26dc679877686f3ad710a0. PR published, not merged; no merge authority.
Requested implementation/TDD/clean-worktree/PR milestones complete. Final response next.
