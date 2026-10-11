Checkpoint 2026-09-03: issue #43 is open and has no existing PR.
Current state: isolated worktree C:\Users\Q\code\Qlatt-issue-43 tracks refreshed origin/master.
Key finding: possessive handling appends literal Z instead of sharing the plural allomorph.
Blocker: Rule 0 repair is active after a broad test search produced truncated output.
Next: strengthen the global search-bound guard, rerun bounded discovery, then write the red regression.

Checkpoint 2026-09-04: the global search-bound guard and bounded replacement discovery are verified.
Current state: the focused `fox's` regression is red in the isolated worktree.
Key evidence: current output is `F AA1 K S Z`; expected output includes `IH0` before `Z`.
Blocker: none; dependency installation completed from the worktree lockfile.
Next: implement declarative affix outputs and shared plural/possessive allomorph resolution.

Checkpoint 2026-09-04: Qlatt now has a generic YAML-driven condition-class resolver.
Current state: possessive clitics reference the plural `s` allomorph; TypeScript arrays were removed.
Key finding: affix outputs, per-entry citations, and morphology heuristic values now live in YAML.
Blocker: none; focused tests and type checking have not yet run on the implementation.
Next: run the focused regression, repair any failures, then verify the complete candidate.

Checkpoint 2026-09-04: focused morphology and pipeline suites pass after implementation.
Current state: five issue files are staged; cached `git diff --check` is clean.
Key evidence: 67 focused tests pass and `typecheck:core` passes on unchanged production code.
Blocker: none; the full repository gate remains for the committed candidate.
Next: commit the issue files, run the full gate once, then publish the PR.

Checkpoint 2026-09-04: prerequisite-correct full tests ran at candidate commit `c3c64fc0`.
Current state: 1,074 tests pass; only `runtime-output-level.test.ts` fails at peak 1.95027.
Key finding: the exact base commit has deploy CI only, so it has no reusable test result.
Blocker: the remaining full-suite failure must be classified against the base commit.
Next: run only the failing test on an isolated base worktree, then continue or repair accordingly.

Checkpoint 2026-09-04: PR #110 is published at candidate commit `c3c64fc0`.
Current state: the base worktree reproduced the same output-level failure and was removed.
Key finding: the PR watcher exits because GitHub reports no checks on the branch.
Blocker: no CI run is currently attached, so a green-CI merge gate is not yet observable.
Next: inspect required checks, workflow triggers, reviews, and mergeability for PR #110.

Checkpoint 2026-09-04: `master` advanced with CI, lint, type hardening, and js-yaml 5.4.1.
Current state: merge conflicts are resolved; staged diff versus current master is six intended paths.
Key finding: master already contains a stronger WASM prerequisite guard; the citation guard remains unique.
Blocker: none; the merge resolution needs focused checks before its merge commit and push.
Next: run scoped format/lint/type/tests, commit the master merge, push, and monitor PR #110 CI.

Checkpoint 2026-09-04: Q authorized executing the separate base repair and finishing #110.
Current state: `C:\Users\Q\code\Qlatt-js-yaml-fix` is based on broken master `d419a24d`.
Key finding: js-yaml 5 leaves the loader's default import undefined under Vitest.
Blocker: none; the base repair requires a focused regression and import-boundary fix.
Next: add the loader regression, prove red/green, publish and merge the repair PR.

Checkpoint 2026-09-04: the focused YAML loader regression is red then green with named `load`.
Current state: full typecheck finds four removed `quotingType` options in two migration scripts.
Key finding: five remaining default imports also conflict with js-yaml 5 named exports.
Blocker: none; v5 declares named `load`/`dump` and `quoteStyle: "double"`.
Next: migrate the bounded import/option surface, then rerun focused tests and typecheck.

Checkpoint 2026-09-04: base repair commit `c8a26a18` covers seven exact paths.
Current state: 70 focused tests pass and the complete TypeScript typecheck passes.
Key finding: all default imports and removed `quotingType` uses are gone from the bounded surface.
Blocker: none; full CI-equivalent validation remains at the committed candidate.
Next: build WASM fixtures, run full tests/check/build, publish the repair PR, and watch CI.

Checkpoint 2026-09-04: prerequisite repair is now at commit `7aaec098`.
Key finding: the two remaining CI errors were formatter-only defects already present on `origin/master`.
Current state: the js-yaml 5 repair and base formatting cleanup are committed separately.
Blocker: none; exact-candidate typecheck, full tests, check, and build remain.
Next: complete those gates, publish the prerequisite PR, and merge it after green CI.

Checkpoint 2026-09-04: prerequisite PR #111 is open at exact head `7aaec098`.
Key finding: CI's quality job failed immediately; bounded log diagnosis is required.
Current state: local typecheck, check, and build pass; full tests retain one base-only output failure.
Blocker: the first log download rejected terminal escape sequences without writing useful output.
Next: safely redownload the job log to the verified temp path and classify the failure.

Checkpoint 2026-09-04: PR #111 advanced to exact head `149f5216` after merging current master.
Key finding: the first CI failure was a new-base formatting defect in `src/input/apply-affect.ts`.
Current state: that file is formatted in `149f5216`; the second CI run has also failed.
Blocker: the second job log is downloaded but its terminal failure has not yet been extracted.
Next: inspect bounded error lines, repair only a branch-related failure, and resume watching.

Checkpoint 2026-09-04: PR #111 is now at exact head `2938a826`.
Key finding: TypeScript 7 broke ts-node; pinning 5.9 restored all six DECtalk trace tests.
Current state: CI also installs the WASM target and runs `build.sh` before full tests.
Blocker: the new CI job failed quickly before its terminal diagnostic was inspected.
Next: download the third job log, classify the exact failure, and repair only if branch-related.

Checkpoint 2026-09-04: CI failed because tracked `build.sh` is mode `100644`.
Key finding: the workflow must invoke it as `bash build.sh`; a global execute-bit guard is installed.
Current state: CI is corrected locally, while Git Bash cannot see Cargo through the inherited Windows PATH.
Blocker: no product blocker; local proof is limited to Bash syntax and CI owns target execution.
Next: syntax-check the script, commit the workflow correction, push, and resume PR #111 monitoring.

Checkpoint 2026-09-04: PR #111 CI now builds WASM and runs all 1,080 tests.
Key finding: the sole failed suite cannot load the pinned Windows native audio addon on Linux.
Current state: all test bodies pass; `node-web-audio-api` documents local Rust builds for unsupported binaries.
Blocker: CI must rebuild that native dependency for the runner platform before tests.
Next: add the package's shipped `build:only` preparation, push, and watch the exact head.

Checkpoint 2026-09-04: PR #111 exact head `18c59d04` failed during native-addon preparation.
Key finding: nested Cargo packages require workspace isolation; the local isolated build passes.
Current state: CI appends an ephemeral `[workspace]` marker before the package's `build:only` hook.
Blocker: the latest job's compiler diagnostic still needs bounded extraction.
Next: diagnose that job, add only required Linux prerequisites, and resume monitoring.

Checkpoint 2026-09-04: CI installed ALSA and completed native plus WASM builds.
Key finding: 1,081 of 1,082 tests pass; fricative output peaks at 1.950271 versus 1.05.
Current state: the failure reproduces identically on Windows and Linux at the base behavior.
Blocker: the output-level production cause must be diagnosed without weakening the stable test.
Next: trace the rendered peak through runtime gain semantics and add a focused regression-first fix.

Checkpoint 2026-09-04: CI reaches the stable output-level regression after all prerequisites.
Key finding: the final output chain binds `outputGain` after compression and currently defaults to 0.5.
Current state: the failing peak is deterministic at 1.950271 on Windows and Linux.
Blocker: both phrase metrics must be measured before selecting a smaller cited engineering trim.
Next: instrument the existing test temporarily, capture both metrics, restore it, then patch semantics.

Checkpoint 2026-09-04: output diagnosis isolated a transient rather than overall loudness.
Key finding: hello peaks at 0.438968, while the failing phrase peaks at 1.950271 with similar RMS.
Current state: zero compressor attack makes the existing two-case regression pass unchanged.
Blocker: none; exact commit `630835c4` passes all 1,082 tests and the Vite 8 build.
Next: push the candidate, watch PR #111 to green, verify scope, and merge normally.

Checkpoint 2026-09-04: prerequisite PR #111 merged normally as `6f77ac04` after green CI.
Key finding: issue #43's branch conflicts with repaired master in AGENTS plus three G2P files and one test.
Current state: the first merge attempt was cleanly aborted to preserve standalone AGENTS history.
Blocker: none; the feature AGENTS file needs the stronger base WASM guard before remerging.
Next: commit that instruction sync alone, merge master, resolve remaining code conflicts, and test.

Checkpoint 2026-09-04: AGENTS sync commit `31d7d730` contains only `AGENTS.md`.
Key finding: the second master merge leaves only three G2P/test conflicts; AGENTS merges cleanly.
Current state: issue semantics remain on the feature side and base differences are formatter/type hardening.
Blocker: none; conflict markers must be resolved with feature behavior and current formatting.
Next: resolve all three files, run Biome, verify zero markers, install the repaired lock, and test.

Checkpoint 2026-09-04: `src/g2p/index.ts` conflicts are resolved with declarative clitic behavior.
Key finding: morphology conflicts are feature logic versus base quote/format normalization.
Current state: the first morphology type block is resolved into current double-quote style.
Blocker: seven morphology regions and the morphology test import remain conflicted.
Next: resolve each bounded region, format the three files, and verify no conflict markers remain.

Checkpoint 2026-09-04: index conflicts and four morphology regions are resolved.
Key finding: generic `resolveAffixPhonemes` replaces the base's hard-coded suffix helpers.
Current state: three morphology conflict regions plus the test import remain.
Blocker: none; the remaining regions are bounded near decomposition and cache loading.
Next: finish those resolutions, format each file separately, and run fixed-point marker scans.

Checkpoint 2026-09-04: all three feature/base conflict files are resolved and formatted.
Key finding: declarative affix fields and clitic routing survive with current Biome style.
Current state: per-file format/check passes; `npm ci` restored the repaired lock with zero churn.
Blocker: none; merge resolution still needs staging, focused tests, typecheck, and full gates.
Next: verify inventories and markers, stage resolutions, run focused checks, then commit the merge.

Checkpoint 2026-09-04: issue branch exact head is merge commit `dd87adfc`.
Key finding: 67 focused tests, typecheck, check, all 1,085 tests, and production build pass.
Current state: PR #110 has 2/2 green checks, six scoped files, five commits, and `Closes #43`.
Blocker: none; final check output and merge command remain.
Next: verify exact-head checks once, merge PR #110 normally, then verify two parents and issue closure.

Checkpoint 2026-09-04: open-PR campaign scope is PRs #104, #105, and #109.
Key finding: #104 closes #99, #105 closes #93, and #109 is a cel-js 8 dependency update.
Current state: live PR inventory is captured; detailed reconciliation has not started.
Blocker: Rule 0 repair is active for an oversized Dependabot body query.
Next: strengthen the global API projection guard, rerun bounded #109 inventory, then resume #104.

Checkpoint 2026-09-04: PR #104 worktree exists at the fork head plus current `origin/master`.
Key finding: issue #99 still requires a PowerShell warning/wrapper and `--phrase` documentation.
Current state: the base merge succeeded, but its 358-file stat output was truncated.
Blocker: Rule 0 repair is active for unbounded divergent-merge output.
Next: require `git merge --no-stat`, verify the merge commit and clean tree, then write the red test.

Checkpoint 2026-09-04: both Rule 0 guards are installed and verified globally.
Key finding: #104 needs a warning when positional tokens reveal swallowed PowerShell options.
Current state: the focused regression is written in `test/explain-phrase-cli.test.ts`.
Blocker: none; the isolated worktree has no `node_modules` yet.
Next: install the exact lockfile, prove the regression red, then implement the warning and docs.

Checkpoint 2026-09-04: #104 regression failed because stderr lacked the PowerShell warning.
Key finding: argv `hello json` is the issue's documented swallowed-option signature.
Current state: warning code and docs are edited; the AGENTS.md part is standalone commit `a526f853`.
Blocker: none; green focused verification and the code/test/docs commit remain.
Next: rerun the focused test, run scoped checks, commit, then push and watch exact-head CI.

Checkpoint 2026-09-04: #104 final candidate is commits `a526f853` and `3fc10c4b` after base merge.
Key finding: initial full test failure was missing local WASM, not product behavior.
Current state: after `build.ps1`, all 127 files and 1,086 tests pass; tracked tree is clean.
Blocker: none; publication and exact-head CI remain.
Next: audit #104 files/commits and closing phrase, push to the fork head, then watch CI.

Checkpoint 2026-09-04: #104 head `3fc10c4b` is published to the existing fork branch.
Key finding: GitHub reports no checks yet, including after one 30-second registration wait.
Current state: local focused, typecheck, and full-suite gates are green; exact-head CI is pending registration.
Blocker: none yet; this is initial pending state, not a terminal CI failure.
Next: continue bounded 30-second preflight polling, then start the watcher once a check appears.

Checkpoint 2026-09-04: fork-run security audit is active; all PR delivery remains frozen.
Key finding: run `33932305200` used a GitHub-hosted Ubuntu runner and was cancelled in step 10.
Current state: npm install, audit, check, and typecheck ran; build, tests, and artifact upload were skipped.
Blocker: trust assessment still needs workflow permissions, exact diff, logs, and side-effect inventories.
Next: inspect the trusted workflow versus run head, download bounded job logs, and query artifacts/deployments.

Checkpoint 2026-09-04: fork-run audit has workflow, permission, log, artifact, and deployment evidence.
Key finding: workflow matched trusted master, token was contents-read, and secret source was none.
Current state: artifact and deployment counts are zero; no push, publish, SSH, curl, or wget log matches.
Blocker: final audit still needs proof that executed package/tool configuration was unchanged.
Next: compare package, lock, formatter, and TypeScript config against base, then assess and resume owned PRs.

Checkpoint 2026-09-04: fork-run executed tooling config is unchanged from trusted master.
Key finding: no compromise evidence; PR #104 remains excluded and restored to its original fork head.
Current state: owned PR #105 is merged locally with master; two of five conflicts are resolved.
Blocker: `rule-pack.ts`, `validation.ts`, and `dectalk-e2e.test.ts` conflicts remain.
Next: finish scoped conflict resolution, run issue #93 tests and full gates, then publish #105.

Checkpoint 2026-09-04: four of five #105 conflicted files are now resolved.
Key finding: the first six validation conflicts are new issue #93 semantics versus base formatting.
Current state: only 13 conflict blocks in `src/declarative-frontend/validation.ts` remain.
Blocker: seven later validation blocks still need semantic inspection before mechanical resolution.
Next: inspect those blocks, keep both issue semantics and current formatting, then verify zero markers.

Checkpoint 2026-09-04: all 13 validation conflicts have been semantically classified.
Key finding: two blocks combine issue checks with master's safer select/match refactor; others keep issue semantics.
Current state: the first resolver failed closed because its callback scalar counter stayed zero.
Blocker: none; global callback guidance and the corrected reference counter are now installed.
Next: rerun the resolver once, verify 13 callbacks and zero markers, then format and typecheck.

Checkpoint 2026-09-04: resolver completed 13 blocks and repository conflict-marker scan is clean.
Key finding: bounded Biome check reports eight errors across rule-pack imports and validation code.
Current state: five conflict files are formatted; no merge resolution is staged yet.
Blocker: callback returns, explicit-any casts, and one duplicate declaration must be repaired.
Next: patch those eight diagnostics, rerun bounded Biome and typecheck, then execute focused tests.

Checkpoint 2026-09-04: #105's five resolved files now pass bounded Biome checking.
Key finding: `typecheck:core` reports five merge-integration typing errors in validation.ts.
Current state: errors are one stale select access, one relation narrowing, and three raw spec accesses.
Blocker: focused tests must wait until these deterministic compile errors are fixed.
Next: patch the five type errors against master's normalized locals, rerun core typecheck, then tests.

Checkpoint 2026-09-04: owned PR #105 merge commit is `abe2fa1d` with zero conflicts.
Key finding: core/scripts typechecks and six focused files with 147 tests pass.
Current state: required WASM build completed; final full candidate gates remain.
Blocker: none; generated worklet churn must be checked and excluded before testing.
Next: restore only build-produced binary changes, run full tests/build, then push and watch CI.

Checkpoint 2026-09-04: #105 head `abe2fa1d` is pushed with clean local full tests and build.
Key finding: exact-head CI job `101219816623` failed while PR remains mergeable.
Current state: watcher stopped; bounded job log is downloaded but not yet inspected.
Blocker: failure classification is pending log evidence.
Next: inspect log signature and bounded error lines, fix branch cause or retry only if unrelated.

Checkpoint 2026-09-04: #105 CI failure was six PR files in pre-base formatting.
Key finding: exact six-file repair commit is `a2c563aa`; repository check and 147 focused tests pass.
Current state: replacement head is pushed and tracked worktree is clean.
Blocker: none; new SHA checks must register and reach terminal green.
Next: preflight exact-head checks, restart watcher, diagnose any new failure, then merge normally.

Checkpoint 2026-09-04: owned PR #105 merged normally as `28b21837` after green retry.
Key finding: merge commit has parents master `1fa880a2` and PR head `a2c563aa`; issue #93 closed.
Current state: #109 is the only remaining same-repository open PR numbered at least 100.
Blocker: none; #109 has not yet been checked out or reconciled with the new master.
Next: create #109 worktree, merge current master, diagnose cel-js 8 compatibility, test, and deliver.

Checkpoint 2026-09-04: #109 is merged locally with post-#105 master and remains a two-file diff.
Key finding: cel-js 8 passes repository check, full typecheck, and five focused files with 29 tests.
Current state: dependencies and WASM prerequisites are built; generated binary churn is removed.
Blocker: none; full exact-candidate tests/build and CI remain.
Next: run full suite and production build, audit dependency diff, push, watch, and merge normally.

Checkpoint 2026-09-04: #109 passed the full 128-file/1092-test suite and production build.
Key finding: the final candidate changes only package.json and package-lock.json for cel-js 8.
Current state: exact head bb19206d is pushed to the same-repository Dependabot branch; CI is pending.
Blocker: none; the watcher was safely restarted with bounded redirected output after a poll overflow.
Next: monitor exact-head CI, audit the live PR, merge normally, and verify the two-parent merge.
