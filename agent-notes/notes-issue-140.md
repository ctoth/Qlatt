
Checkpoint: issue 140, isolated worktree C:\Users\Q\code\Qlatt-issue-140, branch fix/issue-140-frontend-vocabulary.
Red confirmed missing load rejection and cached harness frontend mismatch; focused 9 tests now green.
Pure checker expands cloned formant banks; render loaders and harness validate pairing.
Removed unused NFC from shipped columns and A9/A10 from DECtalk columns; no blocker.
Next: static checks, build WASM, full tests, inspect and publish PR with Closes #140; no merge requested.

Checkpoint 2026-09-08: user rejected deleting output columns; restored all three frontend YAML files and verified exact HEAD equality.
User authorized DECtalk A9/A10 parallel-only wiring while retaining eight-stage cascade. No commits/PR yet.
Added guards retaining NFC/A9/A10 outputs, cascade count wiring through bank countParam, and parallel-only DECtalk nodes/semantics.
NFC now wired: Qlatt default5; DECtalk inventory explicitly8. 27/28 focused tests pass; gain evaluator fixture needs real constants.
Next: complete focused/audio proof, static checks, full gate, inspect scoped diff and publish PR with Closes #140.

Checkpoint: 878c53d3 committed and pushed to fix/issue-140-frontend-vocabulary; worktree clean.
All output column lists restored/preserved; NFC and DECtalk parallel-only A9/A10 now wired, with regression guards.
33 focused tests, real waveform changes, npm run typecheck, npm run check passed. WASM built and 19 artifacts verified.
Full npm test running as exec session 80595, log Qlatt-issue-140/test-140.log; no failure reported yet.
Next: finish full suite/build, create PR with Closes #140, monitor exact-head CI. Merge not authorized.

Checkpoint: PR151 CI failed on 878c53d3, run34193492941. User authorized diagnosis/fix and continued CI handling.
CI: 1283 passed, three 30s render timeouts (both new vocabulary waveform tests and existing long-phrase output-level test). No failed audio assertions.
Windows full local suite had1286 passes; CI hello-world render took22.64s, indicating significant runner/host difference.
Worktree remains clean; raw failure log ci-151-failed.log. Investigating constrained CPU / Node24 versus local Node22 and native rendering setup.
Next: reproduce timings, make narrow evidenced correction without weakening audio assertions, push and wait for exact-head green CI.

Checkpoint: user rejected timeout increase and requested profiling; reverted both timeout edits, stopped extended-budget probe, no repair pushed.
Base detached worktree Qlatt-issue-140-base at8ed5627b created; identical node_modules junction and WASM for controlled comparison.
Node24.20 two-CPU head profile: imports23.66s (20.78s FSWatcher); actual cold render ~1.55s, warm ~0.63s, native render0.39/0.27s.
CPU profiles/phases in TEMP/qlatt-140-profiles/head; base run session53654. Temporary profiling scripts and investigation markdown untracked in head.
Next: compare base, then profile actual contended Vitest workload to isolate slowdown; preserve original30s tests and fix cause.

Checkpoint: 18.73s was 11 renders; serial scheduling change reverted after user challenged root cause.
Two-CPU base also times out; contended native phase ~59s versus subsecond isolated, worklet DSP ~81ms.
Priority normalization did not fix contention. Testing bounded channel wait instead of native worker busy polling.
Original installed addon/source/manifest backed up in TEMP/qlatt-140-native-original; original binary SHA256 76F230D7C825D6871A2DF41098EE70064CE3E4EE903B6ABBBE17B788631866BC.
Native experimental build session17006 uses external repo target cache only; no source changes there. No timeout or scheduling fix committed.

Checkpoint: bounded native receive experiment passed all7 concurrent render tests in16.16s on2CPUs versus~70s/4timeouts.
Created isolated dependency worktree C:/Users/Q/code/node-web-audio-api-issue-140 at4d1fa9f, branch fix/offline-worklet-polling.
Focused idle regression RED:1015ms CPU during1005ms idle; also verifies port echo and exact constant audio.
Offline-only candidate propagates context flag to worker and bounded1ms receive; realtime remains polling. Native candidate build completed1m34s.
Next: GREEN regression, constrained Qlatt validation, inspect dependency delivery and update PR151 without changing timeouts.

Checkpoint: offline-only native fix ce3ed1d published as ctoth/node-web-audio-api PR1; idle regression GREEN and7 constrained render tests pass16.57s.
Qlatt PR151 updated at f78218d6 with exact dependency pin and investigation report; closing phrase intact; no timeout/concurrency changes.
Fresh npm ci, Biome, typecheck, registry pass. Full Node24 two-CPU Vitest running session43312, logs native-fix-full.log/.err.log.
CI run34196307679 currently rebuilding native addon; source build must pass Linux and all tests before completion.
Temporary profiler scripts moved to TEMP/qlatt-140-profiles/scripts; both worktrees clean. Next: finish full gate, CI, update PR validation and report.

Checkpoint: PR151 f78218d6032346ff06aced27f8e1c41f5fd25be2 CI34196307679 SUCCESS, source-built Linux addon and production build pass.
Full local Node24 two-CPU suite1286/158 passed264.85s. CI native suites6.371s/6.081s/15.217s, originaltime budgets/concurrency retained.
Final fee profile: warm0.511s total/0.208s native; first render1.133s after5.447s harnessimports; unchanged RMS/peak/samplecount.
Dependency PR1 ce3ed1d remains open; Qlatt pin exactcommit, PR151 Closes140 verified, bothworktreesclean.
Completed authorized PR/CI repair; no merge authorized or performed.
