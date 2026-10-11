## 2026-09-07 issue 51 checkpoint
Requested: TDD, clean worktree, PR with Closes #51; no merge authority. User requires measured superiority over dB source.
Worktree C:\Users\Q\code\Qlatt-issue-51; branch issue-51-frication; fetched master 5bf5c5440ef68ebf1219d1ddc1ae24cca8166622. No implementation yet.
Issue requires aerodynamic WASM frication source, bindings, semantics/inventory, comparative /s sh f/ spectral moments. Reading paper notes and integration contracts.
Next: derive source laws and measurement protocol, add failing tests, implement and measure, then publish PR. No blocker established.
## Paper verification checkpoint
Q explicitly authorized paper-reader use and updating incomplete notes; loaded its image-reading procedure. Must read every page of each <=300-page paper used for extraction.
Canonical ignored PDFs/page images exist in original Qlatt checkout, not issue worktree. Stevens PDF helper count=13; page-000 inspected successfully. PNG inventory=26 suggests duplicate naming; use canonical page-NNN series.
Stevens notes contain fc=0.2 U/sqrt(A), which requires verifying symbol meanings from original before implementation. No code or notes edits yet.
Next: finish Stevens images, Badin/Shadle and Jongman primary evidence; update notes accurately, then implement TDD and full render comparison.
## Rule 0 execution checkpoint
Q identified repeated non-delivery and acknowledgment-only turns. Global AGENTS now forbids that exact escape, requires durable-first repair plus concrete verified implementation and continued delivery; append verified with prior bytes preserved.
Stevens all 13 pages and Badin all 4 pages read visually. Corrected Stevens notes in issue worktree: fc≈0.2 U/A^(3/2), not exponent 1/2; source pressure and radiated level laws must not be double-counted. Scoped diff --check passed.
Badin p=1.3,q=0.3 for s/sh; p=0.8,q=0.2 for f. Shadle count=200, not read. Paper-reader invoked for verifying notes; avoid expanding optional research beyond implementation needs.
Next concrete action: focused frication-source regression and Rust implementation, then worklet/registry/semantics/inventory integration, comparative full-render measurement, PR. No product code yet.
## First red/green checkpoint
Added crates/frication-source/src/lib.rs in issue worktree with centre_frequency and regressions for Stevens volume-flow exponent and Strouhal scaling.
Red: rustc --test compiled stub; executable exit101, centre_hz=0, both tests FAILED. Green: implemented 0.2*flow/(area*sqrt(area)), invalid input returns zero; same native test executable now exits0 with test result ok.
No Cargo registration, worklet, semantics, inventory, or spectral measurement yet. Continue whole issue; this focused green is not completion.
Global non-delivery guard installed and verified prior bytes preserved; immediate acknowledgment-only failure repaired by concrete red/green work. Do not end at another progress promise.
## Integration checkpoint
Registered new frication-source workspace member and created Cargo manifest with klatt-wasm-common dependency. Only centre_frequency implemented/tested so far.
Existing graph has dedicated fricationSource noise-source (gain1, cutoff binding); fricDbAdjusted currently AF and downstream fricGain=dbToLinear(GO+fricDbAdjusted+ndbScale.AF). New drive must avoid double gain accounting.
Worklet pattern uses initWasmModule(url,{},wasmBytes), new WasmBuffer(exports), ready/ping/dispose messages; WasmBuffer exposes ptr/view/ensure/refresh. Build-wasm discovers workspace cdylibs automatically.
Semantics supports pow and log. Next implement tested normalized aerodynamic level and shaped source, preserving legacy branch, then bindings/targets and render comparison. No PR yet.
## DSP red/green checkpoint
Implemented native pressure_drop_kpa (Stevens Eq5), drive_gain (Badin relative exponents), FricationSource seeded LCG and broad three-octave pressure-source shape, exact stationary-variance normalization.
Red cargo test -p frication-source --lib: new pressure/energy/seed tests failed (exit101, reference_rms0). Green same crate gate exit0, test result ok; Cargo.lock diff only new crate dependency.
Graph integration design pending: preserve existing fricationSource as legacy gain-gated path, add aerodynamic source with glottal modulation into parallelFricGain; trace derived AF without double-applying source gain. Need integrate source location and derived parallel amplitudes.
node_modules absent, package-lock exists. Created empty C:\Users\Q\AppData\Local\Temp\qlatt-51-npm-ci.log; NEXT ACTION inspect that exact new file, then npm.cmd ci redirected there. ABI/worklet and measurements still pending.
## Worklet checkpoint
Added native frication_source_new/free/set_params/process exports and alloc macro; cargo fmt done. Added src/worklets/frication-source-processor.ts with ready/ping/dispose lifecycle, WASM buffers, glottal modulation and Ac/U/p/q AudioParams.
npm.cmd ci completed exit0 in worktree; git diff --quiet package.json package-lock.json exit0. Log: C:\Users\Q\AppData\Local\Temp\qlatt-51-npm-ci.log.
The original checkout scripts/measure/measure.ts exists but is untracked; it is an independent Praat-sidecar WAV instrument, not synthesizer code. Can measure candidate WAVs with it; clean-worktree npm measure currently points to absent script.
Next: integration regression using createConfiguredEvaluator as test/aspiration-frication-routing.test.ts does; add graph/registry/semantics/inventory targets, then full candidate render measurement. Still no PR. Continue execution.
## Integration TDD checkpoint
Added test/frication-source.test.ts: physical source selection, derived AF/pressure, no doubled source gain, dB fallback, zero-flow silence, cavity-derived amplitudes, and PFE amplitude binding.
Red focused Vitest exit1: six failures on missing realization values and old AF unchanged. No fixture/evaluator errors. Test log currently overwrites qlatt-51-npm-ci.log.
Implemented optional amplitudeParam in PfeFormantSpec, generatePfeRules expressions/deps, and formantSchema. This lets authored physical fricA2..10 realizations drive existing parallel bank without hardcoding frication into generic PFE.
Next immediate changes: baseline semantics params/laws/fricA2..10, graph amplitudeParam and source gate/bindings, registry; inventory targets and HRG parameter propagation; then run focused/static and render comparison. No completion claim or PR yet.
## Graph/semantics checkpoint
Added Ac/Ug/mode/exponents/cavity/reference params; Stevens pressure, Badin gain and AF records, normalized cavity fricA2..10, non-sibilant bypass. fricGainScaled uses calibrated fricGain so source gain is not doubled.
Focused integration Vitest now exit0. Graph main formants2..10 use amplitudeParam=fricA2..10; legacy source gain is fricLegacyMix; new aerodynamicFricationSource connects glottalMod -> source -> parallelFricGain. Registry entry added.
Inventory fricative owner lines discovered S486,Z518,SH550,ZH584,F618,V650,TH682,DH715 (before edits). Need current exact params ownership before adding physical targets.
Next: inventory/HRG propagation tests and targets; compile WASM/worklets and static checks; actual spectral A/B render and tuning, broad gate once, commit/PR Closes #51. No improvement measured yet.
## Inventory propagation checkpoint
Added full speech regression using textToKlattTrack('Sue saw fish.',110): red on missing Ac at test line38; prior six integration tests still pass.
Inventory now has Ac/Ug/exponents/cavity/ref calibration on S,Z,SH,ZH,F,V,TH,DH with global paper citations and engineering target labels. S=.08/280,L1.5; SH=.15/400,L2.7; F=.1/250,L0; voiced flow lower.
Lowering columns are explicitly listed at frontend.yaml output.lowering.columns; pipeline.yaml Segment.features explicitly enumerates allowed fields. Need add physical fields to both.
NEXT: apply pipeline Segment/type/features header patch (full preimage count1, LF557), then output columns patch with complete inspected owner. Finish HRG green, build/static/render measurements, then PR. No measured superiority yet.
## Worklet compile repair checkpoint
Added inventory base defaults and HRG columns/features; all seven integration tests now pass (Vitest exit0), including real speech target propagation and vowel reset.
Worklet build caught TS2417: unannotated parameterDescriptors widened automationRate to string. Rule0 durable-first guard added to worktree AGENTS.md and immediately committed alone: d8fd67a905d8d65e63c174376cfd90d3743c41f4, raw numstat2/0 AGENTS only.
NEXT: fix getter to explicit AudioParamDescriptor[] after fresh one-line preimage count, rerun npm build:worklets and verify guard/fix. Do not resume other work until this repair is verified.
Then compile WASM, run relevant tests/static checks and candidate full audio A/B measure; implementation/inventory changes still uncommitted. No PR/no spectral improvement claim.
## Render preparation checkpoint
Worklet getter fixed with explicit AudioParamDescriptor[]; npm build:worklets exit0 and generated public/worklets/frication-source-processor.js inspected. WASM platform build completed exit0 (session68629 finished), public/worklets/frication-source.wasm exists.
Renderer scripts/rendering/backends/node-runtime.ts currently seeds only nodeDef.type=noise-source. Need include frication-source for reproducibility. Helper complete lines21-36 read; derives SHA256 seed from baseSeed:nodeId.
RenderRequest in src/rendering/types.ts currently has no parameter overrides. Plan optional parameterOverrides for node measurement, clone frontend.track params in node backend; measure A/B with fricationMode0/1 using same candidate graph.
Next: renderer seed/override changes and measurement harness using existing node backend, primary Jongman moment targets and independent original npm measure sidecar. Still need static/relevant/full gates and PR. No measured improvement yet.

Checkpoint: Jongman source verification and measurement preparation.
Read original Jongman pages 4-11 individually; Table I pools all four windows, speakers, voicing, and vowels.
Repaired truncated image batch with global single-image guidance and successful individual recovery.
Implementation remains in Qlatt-issue-51; measured superiority and PR still outstanding.
Next: execute paired deterministic rendering and spectral measurement, then required gates and PR with Closes #51.

Checkpoint: paired rendering probe established in implementation worktree.
Added scripts/frication-probe.ts and focused Vitest wrapper to render identical text/seed with modes 0 and 1.
Plain ts-node failed before synthesis because import.meta.env.BASE_URL was absent; recorded resource-environment prerequisite.
Focused Vitest render command also exited 1; diagnostic inspection is next, no acoustic result claimed.
Continue by repairing the measured render boundary, then spectral comparison and delivery.

Checkpoint: runtime initialization failure isolated to new worklet.
Vitest paired render reaches graph but aerodynamicFricationSource times out waiting for ready.
Compiled WASM exports correct ABI; direct WebAssembly instantiation/new/alloc/free succeed.
Added test/frication-worklet.test.ts to capture the initialization message directly; inspect new file next.
Next: run focused worklet test, repair demonstrated cause, rerun paired render and measurements.

Checkpoint: paired audio rendering now works.
Cause: Node loader replaces module-level wasmUrl declarations; new processor had inline constructor resolveWasmUrl.
Instruction-only commit d6f39f88 records contract; processor changed to established declaration and worklets rebuilt.
Focused render and direct-worklet tests exited 0; frication-probe-0.json and -1.json exist in implementation worktree.
Next: measure pooled 40ms spectra across S/SH/F windows, tune physical source if needed, then final gates and PR.

Checkpoint: first four-moment measurement rejects current configuration.
Baseline distances S=7.540 SH=42.861 F=2.321; physical S=4.634 SH=68.031 F=2.324 for See she fee, seed51.
Temporary refDb60/Q3 trial gives S=5.915 SH=15.409 F=2.423; not acceptable and not applied to inventory.
Current diagnosis under investigation: physical magnitude weights enter legacy PFE cascade correction, shifting output away from intended front-cavity spectrum.
Next: inspect and correct amplitude contract, then rerender; no superiority or completion claimed.

Checkpoint: physical amplitude contract repair in progress.
Restored pfe-codegen.ts to HEAD; legacy PFE generation remains the dB control.
New real-graph regression failed as intended: expected fricA2Linear binding, actual a2Linear.
Added formant-bank linearGainParam support; created scripts/update-frication-bindings.ps1, inspect it next before running.
Next: migrate graph bindings, add physical normalized gain realizations, rerun focused regression and spectral comparison.

Checkpoint: physical parallel gain separation implemented.
Graph now binds fricA2Linear..fricA10Linear; semantics normalizes each resonator at its peak and retains legacy aNLinear fallback.
Corrected loop receiver to f; global receiver-binding guard installed. Updated new test fixtures for expanded semantics and strict types.
Repository npm run typecheck exited 0; focused source plus paired render tests exited 0.
Next: compare new render moments, calibrate against paper with held-out probes, then clean artifacts, gates, commit, and PR.

Checkpoint: calibrated physical gains now improve the initial per-phone comparison.
At default configuration after gain repair: S distance3.046 vs7.540; SH2.663 vs42.861. F area changed from .1 to .15 cm2 within cited range; F2.147 vs2.321.
Temporary global Ac/Ug override was unsuitable because it also activates vowels; no result from that trial was used. Removing arbitrary overrides now.
Probe now accepts phrase/seed environment controls; next patch restores modes0/1 and restricts overrides to fricationMode only.
Next: held-out vowel contexts/seeds, reusable report/measurement checks, cleanup and PR.

Checkpoint: held-out acoustic comparison improved all requested phones.
Text Sue shoe foo / Sack shack fact / Saw shawl fall / So show foe / Say shade fade, seed20260214: baseline distances5.886/31.393/2.101; physical3.395/2.994/1.714 for S/SH/F.
Baseline rms.033240 peak.135795; physical rms.033085 peak.128042. Global calibration overrides removed from probe.
Added analytic spectral-moment tests; red uniform-spectrum and silence assertions observed, then implemented scripts/frication-spectrum.ts using existing fft.js for CI-native comparison.
Next: run spectrum tests, integrate comparison assertion into rendering test, generate report and independent measurement evidence, clean and publish PR.

Checkpoint: comparison is now an automated acoustic regression.
Renamed probe to scripts/render-frication-comparison.ts and test/frication-render.test.ts; two held-out seeds require per-phone improvement and finite unclipped audio.
Artifacts are optional via FRICATION_OUTPUT_DIR; helper writes paired WAV/JSON and compact comparison report, no default repository output.
Spectrum analytic tests passed. Typecheck currently reports one fft.js toComplexArray call requiring a second argument; inspect installed declaration next.
Next: fix verified FFT call signature, run comparison, crosscheck independent measurements, clean temporary files and publish.

Checkpoint: final focused comparison and strict types are green.
Typecheck exited0 after using fft.realTransform's declared two-argument API; four focused files passed.
CI-native distances: seed20260214 S5.885929->3.395342 SH31.393143->2.994064 F2.100925->1.713711; seed9173 S4.933295->3.653074 SH29.017753->3.233820 F2.064980->1.740428.
Reports/WAV/JSON exist under C:/Users/Q/AppData/Local/Temp/qlatt-51-frication-comparison/{seed}. CI requires check/typecheck/build.sh/npm test/vite build on Node24.
Added package script measure:frication via npm pkg set; inspect complete package diff next, then notes/docs, cleanup, final gates, PR.

Checkpoint: measurement documentation and independent sidecar evidence added.
Existing npm run measure succeeded on both seed20260214 WAVs: same6.904s duration and159Hz medianF0; voiced-formant medians nearunchanged.
Appended Jongman primary-source protocol/pooling correction; scoped whitespace gate passed. Added docs/frication-source.md with equations, reproducible commands, six paired distances, and interpretation limits.
New doc inspection completed through first32 lines; inspect remainder next. Package diff is only measure:frication script and comma.
Next: cleanup owned temporary scripts/JSON, complete candidate checks including full WASM-dependent suite/build, commit and PR Closes #51.

Checkpoint: current master integrated before final candidate gate.
Fetched master e3e8b4cfd6874f87b4685489fd4be4c3bd8ddee6; 36 base paths changed, zero overlap with uncommitted implementation.
Normal merge f1b0e66857a042cc1977d25f350cc38f02590fe8 has parents d6f39f88/e3e8b4cf; conflicts0.
Removed own temporary Python/migration scripts and root render JSON after scoped ownership checks. Biome fixed8 files; corrected its one callback-return error.
Next: final formatting/type/native/build/full-suite gates, exact-path staging/commit, PR with Closes #51; no PR exists yet.

Checkpoint: candidate staged with scoped whitespace gates passing.
Updated existing aspiration/frication fixture to expand the real graph's formant banks; its original routing assertions now pass. Other focused PFE/formant-bank compatibility files passed.
Rebuilt worklets after formatting. Biome processed12 candidate files successfully; tracked and staged git diff --check exited0.
Exact-path staging includes implementation, four new tests, two measurement scripts, docs/paper corrections, and generated frication JS/WASM; no temporary calibration files.
Next: final native/type/check gates, candidate commit, WASM inventory/full suite/build, then PR Closes #51.

Checkpoint: implementation committed; full-suite fixture gaps remain.
Candidate commit085bbc6ef239931f42582baf85eac139515e95c9 was clean; check/type/native/fmt gates passed, seven required klsyn88 WASM files present.
Full npm test exited1: 4files/7tests fail,149files/1243tests pass. Glottal open-quotient semantics has same missing-A2 unexpanded fixture; three HRG lowering suites report baseline Ac missing.
No live test process remains. Original assertions will be preserved while real graph expansion/captured aerodynamic columns are added to fixtures.
Next: inspect HRG fixture owner and glottal loader, focused repair, final full gate/build and PR Closes #51.

Checkpoint: historical fixture contract identified; do not regenerate its captured data.
qlatt-english-fricatives.json is historicalOnly=true with capturedCommit and reconstructedLowering.paramKeys (57 strings). New aerodynamic columns were not captured.
Plan for fixture repair: load its declared historical column set, validate those keys against current policy, and preserve all original captured assertions; live physical columns remain covered by new frontend/render regressions.
Glottal semantics fixture now expands formant banks; not rerun yet. Three HRG loaders derive policy from current spec and then demand missing historical Ac.
Next: shared validated historical-column helper, narrow loader edits, focused tests, commit and final full suite/build/PR.

Checkpoint: fixture repair committed successfully.
Shared historicalLoweringColumns validates historicalOnly, recorded paramKeys, and continued support for every captured key; all three HRG loaders use it without changing archived data.
Five affected/new test files passed; candidate typecheck and scoped/staged whitespace checks passed. Historical capture git diff exit0.
Commit command succeeded for test: preserve historical lowering scope with aerodynamic columns; query new HEAD next.
Next: final full suite with fresh prerequisite inventory, production build, clean status, same-repo PR with Closes #51 and CI.

Checkpoint: PR published; verification/CI follow-through remains.
PR https://github.com/ctoth/Qlatt/pull/138 is OPEN, isCrossRepository=false, base master, head e41c8a9d74c93178ce80b28e187d3b041743aaa2.
Full npm test passed154 files/1253 tests; npm run build exited0 and dist/index.html exists. Worktree status0; prepublication fetch confirmed masterstill e3e8b4cf.
Pushed issue-51-frication and created PR with body file C:/Users/Q/AppData/Local/Temp/qlatt-issue-51-e41c8a9-pr.md containing Closes #51.
Next: canonical remote-body/closing-phrase verification and exact-head CI monitoring; no merge authorized.

Checkpoint 744: PR #138 published with Closes #51; exact head e41c8a9 CI failed only frication worklet initialization.
Shared initWasmModule discards ArrayBufferView byteOffset and byteLength by passing wasmBytes.buffer.
Regression now uses a deliberately prefixed/suffixed Uint8Array subview; focused run exited 1 before production change.
Worktree C:\Users\Q\code\Qlatt-issue-51; source loader fix not yet applied; no live process.
Next inspect bounded red diagnostic, preserve view bounds, rebuild relevant worklets, verify and push repair then monitor CI.

Checkpoint 768: Offset-view worklet regression red with ff ff ff ff; loader now copies exactly byteOffset/byteLength via ArrayBuffer.isView.
Focused worklet/render gate passed (2 files, 3 tests), typecheck exit0, changed-file Biome clean; generated helper rebuilt.
Staged only src/worklets/wasm-utils.ts, public/worklets/wasm-utils.js, test/frication-worklet.test.ts; scoped whitespace exit0.
Fetched origin/master unchanged e3e8b4cfd6874f87b4685489fd4be4c3bd8ddee6; PR138 existing head still e41c8a9.
Next cached whitespace, scoped commit and push, exact-head CI monitoring; no merge authorized.
