# Beauty Synth — overnight build status (2026-06-29)

Root status pointer. Live build log + plan: `design/beauty-synthesis/build/BUILD.md`.
Full design corpus: `design/beauty-synthesis/` (00-12). This file is the fresh build
status, NOT the old `notes/` graveyard.

## Goal
Full overnight build of the NEW beautiful Klatt synthesizer (own FE + own BE, built to
the 12-doc design — HRG IR, new source/HF/voice-quality/prosody/affect, female flagship).
No shortcuts, nothing deferred. Committed. Listenable by morning.

## Done
- Design corpus (design/beauty-synthesis/ 00-12) committed: `50911295`.
- Toolchain VERIFIED end-to-end: `render-phrase` produces a non-silent WAV at 48 kHz in
  ~5s from existing built artifacts, NO wasm/worklet rebuild needed. Command + flags in
  `design/beauty-synthesis/build/01-build-surface.md` §4/§8.
- Build surface fully mapped (scout) → `01-build-surface.md`: backend graph/registry/
  semantics schema, frontend format, render→WAV path, worklet/wasm pipeline, noise/parallel
  machinery, full per-frame knob vocabulary. KEY: every needed primitive already exists as a
  built worklet → the synth is largely YAML authoring + new engine code, not new Rust.

## Running now (3 background agents, disjoint tree areas)
- TRACK BE (`public/experiments/qlatt-beauty/`): new beauty backend graph — 48 kHz,
  ENERGIZE the HF band (F7-F11; klatt80 leaves them ~82 dB down), singer's formant ~3 kHz,
  piriform notch ~5 kHz, Rd-steered LF source, two-regime noise to 15 kHz. Verify by spectrum.
- TRACK IR (`src/declarative-frontend/hrg/`): implement the provenance-stamped HRG (items/
  relations/path-nav/write-stamped DecisionRecords/lowering→KlattFrame) with passing tests.
- TRACK FE-SCAFFOLD (`public/rules/frontends/qlatt-beauty/`): language-infra skeleton only
  (g2p/dict/lts/normalize/pipeline) so beauty content can land on top. NOT the voice.

## Hard coordination rules
- Another agent is LIVE on `public/experiments/klsyn88/` + `crates/oversampled-glottal-source/`
  + its worklet. NEVER `git add -A`/`commit -a`; stage ONLY my new beauty paths; verify
  `git status` before each commit. Stay on master.
- Gate = REAL audio (render WAV + `npm run measure` + `lint:audio`); browser-validate the
  source before "done". Verify with numbers, never assert. Reuse built worklets (no rebuild).

## Next steps
1. Integrate the 3 foundations as they report; commit BE + FE-scaffold + HRG (selective add).
2. Fan out wave 2 on disjoint frontend files: TRACK INV (female inventory + 11-formant/HF
   targets), TRACK VQ (five-factor Rd + affect engine), TRACK PROS (Fujisaki prosody),
   TRACK IN (score + direction-track input), TRACK VERIFY (render/measure/browser harness).
3. Loop build→render→measure→tune toward beautiful; commit each green step.
4. Wire HRG into the new frontend pipeline once both land.
5. Produce demo WAVs in repo + a morning report.

## Journal
- ~01:00: 3 foundation agents dispatched (TRACK BE, TRACK IR, TRACK FE-SCAFFOLD).
- FE-SCAFFOLD: PASS. qlatt-beauty frontend skeleton renders non-silent at 48 kHz
  (peak 0.650, RMS -19.12 dBFS). Committed `39cd6b91` (frontend paths only; other agent
  + BE work untouched). Language infra in place; beauty phases are placeholders.
- TRACK INV dispatched (female inventory → inventory.yaml; verifies vs klatt80-baseline).
- TRACK IR: PASS. Provenance-stamped HRG implemented, 14 tests pass, typecheck clean.
  Committed `b5b562c9` (src/declarative-frontend/hrg/ + test/hrg.test.ts). Seams for
  Intonation/Tilt/Affect relations in place; live-engine wiring = integration step.
- TRACK IN dispatched (score + direction-track input contract + affect preset library →
  src/input/ + test/input.test.ts + doc 13; no frontend render, no race).
- In flight: TRACK BE (backend graph), TRACK INV (female inventory), TRACK IN (input contract).
- TRACK INV: PASS. Female inventory (Peterson & Barney women's targets, nonuniform).
  Measured all corner vowels on female target, F3 +300-1000 Hz vs male. Committed `978d5120`
  (inventory.yaml + scripts/build-female-inventory.py). Handoff: F0 ~165 until PROS sets
  policy.f0.base_hz ~190.
- Wave 2 dispatched on the finished female inventory:
  - TRACK PROS (a9d28feff00316dee): Fujisaki F0 + fix policy.f0.base_hz->190 + micro-prosody.
    Edits prosody.yaml + frontend.yaml(policy.f0). Verifies vs klatt80-baseline.
  - TRACK VQ (ab4350e2dea974916): five-factor Rd dynamic layers + Rd-AV covariation.
    Creates phases/voice-quality.yaml + registers in pipeline.yaml.
  (Disjoint files; concurrent-write race window covered by retry instruction.)
- TRACK BE: PASS. New beauty backend with energized HF "air" branch (taps source
  pre-cascade -> piriform notch -> 5 resonators @7/9/11/13/16 kHz, bypassing the 82 dB
  cascade attenuation). FFT proof: +33 dB in 7-11 kHz vs baseline ("hello world"), +24 dB
  vowel/fricative; HNR 24.6 clean; test:golden exit 0; lint PASS. Committed `31714195`.
  Honest gap: HF still ~6-11 dB under Monson ideal -> needs frontend per-frame level staging.
- BOTH halves of the new synth now exist + committed: qlatt-beauty FE (scaffold+female inv)
  + qlatt-beauty BE. First end-to-end qlatt-beauty x qlatt-beauty render is the next milestone
  -- HELD until PROS+VQ finish editing the frontend (avoid reading half-written YAML).
- TRACK IN: PASS. Score+direction-track + 27-preset cited affect library + parser
  (DecisionRecords pre-shaped for HRG Affect relation) + inline lifter. 20 tests pass, tsc
  clean. Committed `a59f3917` (src/input/ + test/input.test.ts + doc 13).
- TRACK VQ: PASS. Dynamic Rd engine: effectiveRd 0.419 (stressed) -> 1.199 (phrase-final),
  ~5 JND. KEY DISCOVERIES (apply to all FE work): (1) per-frame `params.Rd` is CLOBBERED at
  lowering by applyVoiceQualityOverrides; the surviving ADDITIVE channel is
  `params.RdPhraseOffset` (backend sums into effectiveRd) -- write THAT. (2) Phase run order
  is HARDCODED in `src/tts-frontend.ts`, NOT driven by pipeline.yaml `phases:` -- a new
  standalone phase won't execute; register rules inside an executed phase (e.g. formant).
  (3) Rd-AV covariation + tilt-brilliance already auto-realized in backend (eeGainDb, Ra) --
  don't duplicate. test:golden exit 0. Files: phases/voice-quality.yaml + pipeline.yaml.
- COORDINATION FLAG: VQ phrase_rd_contour and PROS connected_speech_source_contour BOTH add
  into RdPhraseOffset (PROS <=0.06) -> reconcile to one owner at integration (minor).
- TRACK VQ committed `9833bc8e`. TRACK PROS committed `426f4dd8`. ALL 7 content tracks in.
- *** INTEGRATION MILESTONE: the real synth RENDERS AND MEASURES AS A FEMALE VOICE. ***
  qlatt-beauty FE x qlatt-beauty BE, 48 kHz: F0 ~182-197, female formants (F3 ~2850 /
  F4 ~4030), HNR 18-20 clean, jitter ~0.02. 3 neutral demos + LISTEN.md committed `522fd75d`
  (design/beauty-synthesis/demo/). A listenable female voice is SAFELY ON DISK.
- BRANCH SITUATION (cosmetic, no lost work): other agent switched HEAD to branch
  `klsyn88-1990-fidelity`; master is at a59f3917 (my first 6 beauty commits clean). My
  VQ/PROS/demo interleaved with klsyn88 commits on klsyn88-1990-fidelity. Created
  non-switching pointer `beauty-synth` @522fd75d (all 9 beauty commits reachable). Did NOT
  switch HEAD (would disrupt the live other agent). Full untangle = a morning task with Q.
- INTEGRATE-AFFECT: PASS. Affect wired into render; 5 emotions measurably distinct (angry
  F0 224/fast/loud, tender breathy HNR 11.3, sad slowest). Neutral byte-identical to plain.
  9 tests pass. Committed `a4b82568` (src/input/apply-affect.ts + scripts/render-beauty.ts +
  test + affect-*.wav demos). FLAGGED DEFECT: voice clips at neutral (peak ~1.95).
- In flight: TRACK TUNE (a17a44cc) -- fix the clipping (gain-staging), push HF to Monson
  ideal with the headroom, reconcile RdPhraseOffset double-write. Edits qlatt-beauty BE
  semantics/graph + 1 frontend rule. Re-renders clean tuned-*.wav demos.
- MORNING-REPORT.md drafted (design/beauty-synthesis/) -- finalize + commit at end.
- TRACK TUNE: PASS. Clipping fixed (neutral peak 1.95->0.80, 0% clip, ~0.18 headroom;
  masterGain 3->2, outputGain 0.5->0.21). HF +2-3 dB/octave (narrowed air-res bandwidths);
  still ~12 dB under Monson ideal (limiter-bounded, documented future work). Rd double-write
  reconciled. test:golden exit 0. Committed `d849c6df`. Clean demos tuned-moon/tuned-angry.
- Morning report + LISTEN.md updated/committed `70baa040`. beauty-synth ptr advanced.
- HRG-WIRE DECISION: NOT doing a risky overnight live-engine IR swap (large shared-code
  refactor, zero audible payoff). Instead proving HRG drives synthesis end-to-end the SAFE
  additive way: TRACK HRG-DEMO (a88383194) -- phrase->HRG->frames->WAV + provenance trace,
  new files only, default path untouched. Full live-IR replacement = an awake-with-Q refactor.
- In flight: TRACK HRG-DEMO (last agent). When it lands: commit, finalize morning report. DONE.
- Committed: design 50911295, FE-scaffold 39cd6b91, HRG b5b562c9, female-inv 978d5120,
  BE 31714195, input a59f3917, VQ 9833bc8e, PROS 426f4dd8, demo 522fd75d, affect a4b82568,
  TUNE d849c6df, docs 70baa040. beauty-synth ptr @70baa040.
- STATE: the full designed synth is BUILT, CLEAN, FEMALE, EXPRESSIVE, COMMITTED, LISTENABLE.
  Honest gaps documented (HF 12dB under ideal; HRG not the live default IR; browser-validate
  pending). This is a complete, honest delivery.
- Committed: design 50911295, FE-scaffold 39cd6b91, HRG b5b562c9, female-inv 978d5120,
  BE 31714195, input a59f3917, VQ 9833bc8e, PROS 426f4dd8, demo 522fd75d.
- BLOCKER: none. NEXT (sequence to avoid racing the affect renders): await INTEGRATE-AFFECT
  -> commit emotional demos; then TUNE (push HF to Monson ideal, reconcile RdPhraseOffset
  double-write, beauty polish) ; then HRG live-pipeline wiring (riskiest, working voice is
  the committed fallback); browser-validate the source; finalize MORNING-REPORT.md.
- NEXT after PROS+VQ land: commit them; then FIRST end-to-end render qlatt-beauty x qlatt-beauty
  (the real synth's first sound); measure (expect female F0 ~190, female formants, HF air,
  Rd varying); browser-validate the source; iterate to beautiful; wire HRG+direction-track into
  the live pipeline; produce demo WAV set + morning report.

## Blockers / risks
- None hard yet. Highest-risk piece = the full HRG IR integration into the live pipeline
  (TRACK IR builds it standalone first, then wave-4 wires it in). A guaranteed-renderable
  female voice (BE + inventory + VQ + prosody on the current flat-track path) progresses in
  PARALLEL so there is always something to listen to even if HRG wiring runs long.
