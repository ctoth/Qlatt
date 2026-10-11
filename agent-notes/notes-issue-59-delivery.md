2026-09-08 checkpoint: isolated worktree Qlatt-issue-59, branch issue-59-area-formants at origin/master add90010.
Issue #59 open; no existing PR. User authorizes implementation/TDD/clean worktree/PR with Closes #59, plus correcting Story notes.
Verified original Table III: UW/L need sections 45/46; UH section 28 is 1.79. Corrected notes and imported YAML data.
Analytic tube/scaling and runtime provenance regressions now green. Reduced frequency-domain wave-reflection model implemented with Fant attenuation and lip end correction.
CLI currently fails on Node yaml-loader BASE_URL initialization; next fix CLI loading, add CLI/data regression and docs, run full gates, review, commit and publish PR.
2026-09-08 checkpoint: generator and baseline YAML/comparison report now work; 70 focused tests pass across 8 files.
Independent two-tube equation exposed and fixed junction sign; solver now extracts complex poles with Fant B=2*Im(f), avoiding overlapping half-power failures.
Plain Node CLI regression exposed path-utils import.meta.env absence; optional env access fixes it. Metadata validated, carried into typed provenance and deep-cloned.
Corrected Story notes additionally restore missing UH Table IV header, ng sections35-40 and rhotic/front-cavity descriptions; docs state reduced-model losses/limits and offline speaker controls.
WASM build passed; incidental public/worklets changes restored. Next: final static/full gates, scoped cleanup/review/commit, publish PR with Closes #59; no merge authority.
2026-09-08 completion: PR https://github.com/ctoth/Qlatt/pull/217 published with literal Closes #59; head 7746b1f48e00e4b52df5f5695293bdef6ec369e3.
WASM build, npm check (one pre-existing warning), typecheck, production build passed; full npm test passed 213 files / 1816 tests in 306.49 seconds.
All 17 committed files belong to issue59, generated geometry/report/provenance/scaling and requested Story note corrections. Isolated worktree is clean; primary unrelated work preserved.
Remote PR CI is newly queued; no merge performed or authorized. Full local validation completed on published commit.
2026-09-08 merge follow-up: user explicitly authorizes monitoring PR217 CI and merging when green; use normal two-parent merge.
PR217 still open/mergeable at 7746b1f48e00e4b52df5f5695293bdef6ec369e3. Worktree clean, Closes #59 confirmed.
CI run34290098322: native succeeded; quality audit/lint/typecheck/audio dependency/WASM steps passed and npm test is running.
Active gh pr checks watch session70078 polls every30 seconds. No failures or changes needed so far.
Next: await quality pass, verify exact head and mergeable state, merge with --merge --match-head-commit, verify two parents and issue59 closure.
2026-09-08 merged: CI run34290098322 passed native and quality on exact head7746b1f48e00e4b52df5f5695293bdef6ec369e3.
PR217 merged with --merge --match-head-commit; merge867552c5c66decafe53c4c786337c3dd479c2b25 at23:27:32Z. Issue59 closed at23:27:33Z.
Verified two merge parents via GitHub git-commit API; isolated worktree remains clean. Authorized delivery complete.
