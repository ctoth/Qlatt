# Grooming #74: what makes up a synthesizer (2026-09-07)

## Findings so far
- No file pairs a frontend with an experiment. Pairing is done by the caller: scripts/render-phrase.ts defaults frontend qlatt-english + experiment klatt80-baseline; node-runtime backend takes request.experimentId.
- Experiment (backend) = public/experiments/<id>/{registry,graph,semantics}.yaml (+ optional tests.yaml, reference/). manifest.json lists id/path/extends. extends merges child-over-parent (semantics params/constants/realize, registry). dectalk-english + stevens91 + test-inherit extend klatt80-baseline.
- Frontend = public/rules/frontends/<id>/ frontend.yaml (+inventory, lts, morphology, normalization, phases/, pipeline, policy/, speakers/). qlatt-beauty extends qlatt-english (rule-pack.ts:163). dectalk-english owns speakers/*.yaml (10 voices) + source-contour.yaml; qlatt-english uses shared /rules/policy/{speaker-profile,source-contour,vq-channels}.yaml; dectalk uses /dectalk-dictionary.json, qlatt-english uses /cmu-dictionary.json.
- Frame contract: frontend.yaml output.lowering.columns names the backend param vocabulary (F1..NFC, ~58 keys) -> KlattFrame.params Record<string,number>. Frontend and experiment couple only via these names + semantics.yaml params.
- Crates: 19 in Cargo.toml workspace; registry bindings per experiment: klatt80 uses 9 wasm + 5 JS-only worklets (chalker-radiation, differentiator, glottal-mod, impulse-train, noise-source); klsyn88 13 wasm; stevens91 adds aerodynamic-model+tilt; dectalk-english adds oversampled-glottal-source+tilt; qlatt-beauty = klatt80 set + tilt-filter. Crates are shared, no crate is experiment-specific by ownership. f0-filters.wasm is loaded by src/f0-filters-loader.ts, not via registry.
- Synth-aware core TS: lowering.ts has dectalk_segmental layer type; track-analysis.ts hardcodes klatt80-baseline paths (3 places); tts-frontend.ts imports dectalk-voice.ts (generic voice selector, YAML-driven); rule-pack.ts hardcoded map (#76); g2p defaults (#77); builtin-functions.ts no longer loads yaml (#75 closed) but inlines klsyn88 table.
- Tests: test/ 149 test files; mentions: dectalk-english 843 hits, qlatt-english 115, klatt80 72, klsyn88 57, stevens91 25, beauty 9. test/golden/*.json fixtures. Experiment-owned tests: klsyn88/tests.yaml.
- Scripts: 74 top-level + oracle/ (dectalk), rendering/, measure/, filter-perf/. Many dt-* scripts are dectalk-specific and untracked.
- Docs: host-contract.md sec1 defines synthesizer = registry+graph+semantics; frontends out of scope for backend host. adding-a-synthesizer.md.
## Open
- UI selection path, voices block, CI, design docs per synth.

## Resolved (2026-09-07)
- Pairing: no file. test/test-harness.js pairExperimentToFrontend() picks the experiment whose id equals the frontend id; otherwise leaves klatt80-baseline. render-phrase.ts defaults qlatt-english/klatt80-baseline. klsyn88 + stevens91 have no frontend (driven by qlatt-english frames). test-inherit is a fixture.
- Vocabulary: frontend output.lowering.columns (qlatt-english 57, dectalk 52, beauty 59). Experiment semantics.params (klatt80 60, klsyn88 62, beauty 80, dectalk +7 over parent, stevens91 12). F1-F6/B1-B6/A1-A10 come from formant banks (src/formant-bank.ts), not params. Interpreter reads frame.params[name] only where a binding requests; unknown columns silently ignored, missing fall to defaults. No validation columns vs params.
- dectalk-only columns: BNP BNZ FNP FNZ GO breathiness; qlatt-english-only: nasal* (11). beauty adds ~20 params (hf air formants, piriform/sinus notches, singerFormant, ringPresence, spectralTilt, brilliance, hfAirMaster).
- Extra core coupling not in #74: src/track-analysis.ts hardcodes klatt80-baseline semantics/graph/table-iii (3 sites); lowering.ts has a dectalk_segmental layer type.
- Lexicons at public/ top level: cmu-dictionary.json 4M (qlatt-english), dectalk-dictionary.json 384K.
- Voices: dectalk frontend owns speakers/ (10) + source-contour.yaml; others use /rules/policy/* + /rules/affect/presets.yaml (shared).
- CI: check, typecheck, build.sh (wasm), npm test, build. No per-synth job.

## Filed (2026-09-07)
- #74 body rewritten: five-component inventory, placement rule (core owns mechanism, packages own data, core imports nothing under public/), placement table, dependency direction, package list, resequenced checklist.
- #140 column-vs-param validation (after #76); #141 relocate data + drop import-time loads incl. track-analysis residue of #40 (after #77, #78).
- #82 acceptance criteria updated to record the decided rule; ordered last after #76-#79, #81, #140-#141.
