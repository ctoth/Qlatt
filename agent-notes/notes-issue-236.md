2026-09-08 issue 236 checkpoint
Isolated worktree C:/Users/Q/code/Qlatt-issue-236 on issue-236-warm-render-assets; primary dirty files preserved.
Added server-owned config/loader cache, WASM byte cache, measurement script; red/green cache regressions and unchanged protocol tests pass; typecheck and WASM build pass.
Before warm means 770/868/1800 ms; initial cached means 735/791/1722 ms. Temporary profiling: asset/config 0.02 ms, graph 381 ms, render 218 ms for OK. Instrumentation removed.
User scope question pending: authorize scoped caching PR with unmet 150/400 ms targets, or expand to runtime reuse. Next: full gate, final measurements, diff review; no publication until answer resolves scope.
2026-09-08 issue 236 checkpoint 2
User said proceed after scope question; proceeding with scoped caching PR, explicit unmet latency targets, and Closes #236. No merge authority.
Final focused suite: 4 files, 7 tests passed; typecheck passes; lint passes (existing warning); original speak-server.test.ts unchanged. Full npm test session 86993 still running (dictionary audit worker PID 16428).
Final measurement under concurrent full-suite load: 828/928/2081 ms; initial cached run was 735/791/1722 ms. Record load conditions; repeat after suite completes to avoid misleading comparison.
Next: finish full gate, idle final measurements, commit only eight scoped source/test files, publish PR with full before/after data and target limitation; preserve primary checkout and uncommitted notes.
2026-09-08 issue 236 delivered
PR https://github.com/ctoth/Qlatt/pull/255 published at 7aedd4e8e0bc2ab920e457b025058dc1945dfd0b; remote body verified with literal Closes #236 and explicit unmet latency targets.
Full npm test passed 223 files / 1883 tests; final focused 7 tests, typecheck, lint (one existing warning), diff checks passed. CI native/quality started on published head; no merge requested.
Paired baseline/candidate means: OK 811/811 ms, Hello world 911/895 ms, 44-character sentence 1947/2003 ms; fitted fixed 425/392 ms. No meaningful end-to-end speedup claimed.
Worktree clean; measurement and gate artifacts preserved under primary notes/issue-236-evidence. Primary unrelated changes preserved; PR body notes-issue-236-pr-body.md uncommitted.
