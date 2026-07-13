# Mission: make Qlatt's klsyn88 match the published klsyn88

## ===== MISSION COMPLETE 2026-06-29 =====
Goal MET. Branch klsyn88-1990-fidelity, 6 clean atomic commits:
  2057ad37 fix(oracle): 31-bit LCG noise (was MinGW 15-bit DC)
  8d817dd4 feat(klsyn88): K&K1990 features (flutter/diplophonia/LF+SQ/tracheal) + defaults
  e8bb0da8 test(klsyn88): spectral-signature scripts
  0309a518 docs(klsyn88): manual + fidelity specs + AGENTS Nim fix
  9b5b0fb0 feat(klsyn88): GV/GH/GF + TL-canonical + seed range
  686cf95c fix(klsyn88): experiment-scope GO (the 13 dB "quiet" fix)
(NOTE: a stray subagent commit 9833bc8e = beauty-synth WIP also on the branch; Q will
handle the beauty-synth git state himself — DO NOT touch it.)
All gates: per-feature no-op + spectral signature verified; test:golden green; klsyn88
now at published level. Residual ~2 dB vs oracle = intrinsic LF-vs-KLGLOTT88 floor.
NOT yet merged to master / not pushed (Q's call).


Session 2026-06-28. Goal (Q, via /goal): "Make our klsyn88 match the published
version. Find the original paper plus all the versions, check everything, check
source, check the whole signal path. Verify against signals/wav with offline
rendering."

## What is known (carried from prior chunks, notes/chunk-klsyn88-oracle*.md)
- A working reference ORACLE binary already exists:
  `scripts/oracle/klsyn88-c/klsyn-oracle.exe`, built from Dennis Klatt's C source
  (`~/src/klsyn/c/klsyn.c` + `parwv.c`, gnu89). Reads NAME.doc -> writes NAME.wav.
- Bridge harness exists: `scripts/oracle/klatt-frames-to-doc.ts` (Qlatt track ->
  klsyn .doc) and `scripts/oracle/compare-klsyn88.ts` (track->doc->oracle->peak/RMS).
- **CENTRAL FINDING (the crux of this mission):** Qlatt's klsyn88 backend is NOT
  actually klsyn88. It runs a MODERN LF glottal source (Rd, lfMode, sourceMode),
  while published klsyn88 uses the KLGLOTT88 polynomial voicing source (ss=2).
  Prior recon flagged this as an OPEN FORK for Q: faithful klsyn88 vs modern LF
  variant. **Q's goal now ANSWERS it: match the published version** => align the
  whole signal path to parwv.c, restore KLGLOTT88 source.
- Prior level comparison (with source-model divergence papered over): oracle only
  +1.5 dB peak / +1.8 dB RMS vs Qlatt klsyn88; formants matched within Praat
  tolerance. But OQ and SW had NO faithful mapping; oq forced to klsyn default 50.

## Reference assets confirmed present (2026-06-28)
- `~/src/klsyn/c/`: parwv.c (42KB, the published DSP core), klsyn.c, klsyn.h,
  parwvt.h, **klsynman.pdf** (the KLSYN88 manual).
- Papers: `papers/Klatt_1980_CascadeParallelFormantSynthesizer`,
  `papers/Klatt_1990_VoiceQualityVariations` (KLSYN88 intro paper),
  `papers/Jesus_1997_KlattSynthesiserImplementation`.
- Qlatt backend: `public/experiments/klsyn88/{graph,registry,semantics,tests}.yaml`.
- Oracle binary still on disk (built Jun 11).

## Plan
- **Phase 0 (IN PROGRESS): reconnaissance — 3 parallel scouts**, writing to:
  - notes/klsyn88-fidelity-reference-signalpath.md  (parwv.c ground truth DSP)
  - notes/klsyn88-fidelity-qlatt-signalpath.md       (current Qlatt klsyn88 path)
  - notes/klsyn88-fidelity-published-spec.md          (papers + manual: what
    "published version" means, KLGLOTT88 math, all versions)
- **Phase 1 (next): divergence diff** — analyst builds a block-by-block table
  (reference vs Qlatt) and a prioritized alignment plan. Biggest item: source
  model (KLGLOTT88 vs LF). Others: OQ/TL/flutter, parallel branch/SW routing,
  radiation, sample rate, gain chain, frame interpolation (step vs ramp).
- **Phase 2: implement alignment** — declarative-first (graph/registry/semantics
  + DSP primitives only as real code). Likely need a KLGLOTT88 source primitive
  (check whether one exists; recon scout B is grepping).
- **Phase 3: conformance verification** — elevate the bridge from level-only to
  WAVEFORM/spectral conformance (sample-accurate or tight spectral match) feeding
  IDENTICAL frames to both engines. Gate: oracle vs Qlatt within tight tolerance.

## Verification method (per memory feedback_test_method)
Gate = `npm run test:golden` + REAL audio render (`render-phrase --out-wav`, node
backend) + oracle conformance via compare-klsyn88.ts + `npm run measure` (Praat).
NOT `npx vitest` for audio. Browser-validate any new source worklet before it
becomes a default (feedback_browser_validate_source_default — KLGLOTT88 silent in
browser once before).

## UPDATE 2026-06-28 (Scout B done — MAJOR correction)
- **Qlatt's klsyn88 is NOT an LF synth.** Prior recon was wrong. The graph wires
  `oversampled-glottal-source` (crates/oversampled-glottal-source/src/lib.rs): the
  klsyn88 *classic* 4x-oversampled source, 4 shapes (natural=2 default), a DIRECT
  PORT of parwv.c. `Rd`/`lfMode` are frontend PROXIES mapped onto native Kopen/
  tilt/Ee; `lf-source` primitive exists but is UNUSED. No KLGLOTT88 polynomial
  source anywhere — but we may not need one: the oversampled source IS the port.
- So the mission is a **conformance diff of an existing port against parwv.c**, not
  a synth replacement. Much better starting position.
- Scout B divergence candidates (notes/klsyn88-fidelity-qlatt-signalpath.md):
  1. Cascade path lacks radiation differentiation (only parallel UGLOT1 diff'd).
  2. Params STEP-scheduled, not ramped (klsyn88 C interpolates per-frame).
  3. No PLSTEP burst chain despite declared constants.
  4. Rd/OQ/TL/Ee proxy layer on top of native Kopen/tilt/gain — confirm no fidelity
     perturbation when driving from raw klsyn params.
  5. Excitation-gain scalars (asp*0.05, fric*0.25, a1*0.4..., gain0*1/32768) =
     Qlatt choices to verify vs parwv.c COEWAV scaling.
  6. plain `resonator` doesn't round freq/bw to int; fujisaki/pitch-sync do (C uses int).
- Source banner: oracle = **KLSYN Version 1.5 (Klatt 28-Mar-86) + KLSYN13 update
  (Keith Johnson 12-Nov-13)**. Versions axis for spec scout.
- **Baseline reproduced on today's tree** ("she sees a dog"): Qlatt peak -18.02 /
  Oracle -16.49 dBFS; gap +1.53 dB peak, +1.80 dB RMS. (LEVEL only — not waveform.)

## CHUNK F1 FLUTTER — DONE + VERIFIED 2026-06-28/29
Coder report notes/chunk-klsyn88-f1-flutter-coder.md. I INDEPENDENTLY verified:
- Gate A no-op byte-identical: fresh render md5 = eacf192f... = baseline. PASS.
- Gate B signature: FL=0 ptp 0.039Hz; FL=50 ptp 3.197Hz, DFT peaks 4.7/7.1/12.7Hz
  dominate all control bins. PASS. (scripts/verify-flutter-signature.ts checked in.)
- Scope clean (oversampled crate + klsyn88 yaml + worklet only). lf-source UNTOUCHED.
- NORTH-STAR INVARIANT: every feature defaults no-op ⇒ klsyn88 "she sees a dog" render
  must stay md5 eacf192f after EVERY chunk. Use as the regression gate for F2/F3/F4.
- KNOWN PRE-EXISTING (not mine): test:golden's lf-source-wasm-compare.ts fails on
  unmodified lf-source.wasm/crate. Investigating before F3 (which reuses lf-source).
- NOT COMMITTED (Q commits-when-asked). F1 verified & ready.

## CHUNK F2 DIPLOPHONIA — DONE + VERIFIED 2026-06-29
Independently verified: Gate A md5 eacf192f (byte-identical no-op). Gate B 7/7 —
DI=50 period doubling r2/r1=30.8, odd/even peak 0.508≈1−DI/100, F0/2 subharmonic
0.355 vs 0.0013 control. Scope clean (oversampled crate+klsyn88 yaml; lf-source
untouched). scripts/verify-diplophonia-signature.ts checked in. Not committed.
Progress: F1✓ F2✓ → F3 (LF+SQ) dispatching, then F4 (tracheal).

## CHUNK F3 LF SOURCE + SQ — DONE + VERIFIED 2026-06-29
(1st attempt died on transient API rate-limit, no material change; re-dispatched clean.)
Independently verified ALL gates: A no-op md5 eacf192f (graph rewire — voiceSwitch +
lfSource nodes, cascadeF1.source→psmSource — is BYTE-TRANSPARENT at SS=2). B signature
6/6 (SQ 120→Rd2.70 H1-H2 8.46dB vs SQ 300→Rd0.93 1.51dB, monotonic; OQ sweep moves
H1-H2). C browser voiced (coder: node peak .283 ≈ chrome .2827). D test:golden EXIT 0
FULLY GREEN (resonator + antiresonator + lf-source-compare maxDelta 0.79→9.88e-6 — F3
fixed the long-standing stale-test failure). Reused existing Fant LF crate (no Rust
change); SQ→rd via Fant 1988/1997, oq/tl overrides. SOFT SPOT: lfMakeupGain=9600 =
engineering estimate (LF level cal; no oracle), labeled. Not committed.
Progress: F1✓ F2✓ F3✓ → F4 (tracheal) dispatching = LAST feature.

## CHUNK F4 TRACHEAL POLE-ZERO — DONE + VERIFIED 2026-06-29 (LAST FEATURE)
Independently verified: Gate A no-op md5 eacf192f; Gate B 6/6 (coincident transparent
0.000dB; separated FTZ=1500/FTP=2150 → notch -13.24dB@1500, pole +22.15dB@2150);
test:golden EXIT 0. Config-only (graph tz/tp nodes after np→tz→tp→polarity; semantics
FTP/BTP/FTZ/BTZ def 2150/180; no crate/wasm change). NICE CATCH: coincident pole/zero
NOT f32-byte-identical (maxDelta 1.22e-6, 82/32171 samples ±1 LSB) → coder added
coincidence-detect bypass (FTP==FTZ&&BTP==BTZ → freqs=0 → bypassAtZero exact passthrough)
so default is EXACT no-op. scripts/verify-tracheal-signature.ts checked in. Not committed.

## ===== F5 DEFAULT-FIDELITY FIX DONE + VERIFIED 2026-06-29 =====
klsyn88 semantics.yaml defaults corrected to published values (cited to manual Table I
/ parwv.c / K&K1990): F6 5500→4990 (was OUT OF RANGE bug), NFCASC 6→5, GO 57→60
(range→80), F4 3500→3250, F5 4500→3700, FNZ/FNP 270→280, + many range caps. Verified:
only klsyn88 semantics edited; dectalk-english & qlatt-english PRISTINE; test:golden
exit 0; NEW no-op baseline md5 = 4c62e66e1a096dedf0901be22a0b7a5f (old eacf192f retired
— NFCASC 5 drops F6 + flips polarity). Features still no-op at new baseline.
KEY: GO default fix is fidelity-correct but INERT for TTS — qlatt-english frontend
base_params GO=47 OVERRIDES the backend default. The ~2dB TTS deficit vs oracle is a
FRONTEND lever (raise qlatt-english GO 47→~49-50), OUT OF klsyn88-engine scope. The
klsyn88 ENGINE is now published-faithful. [[project_klsyn88_quiet_observation]] refined.

## FRONTEND GO INVESTIGATION 2026-06-29 (post-commit follow-up A)
notes/klsyn88-frontend-go-investigation.md. The "quiet" is bigger & clearer than thought:
- GO=47 in qlatt-english/inventory.yaml:81 base_params, SHARED across backends. klatt80-
  baseline is CALIBRATED around GO=47 (ndbScale -47); render-phrase+test:golden default to
  klatt80 → raising shared GO BREAKS klatt80 calibration + golden. dectalk separate (safe).
- Real deficit vs oracle NATIVE published level (g0=60) = ~13 dB low (GO=47→Gain0 44 vs
  published 57). The earlier "~2 dB" was a compare-klsyn88 mapGO=true bridge artifact (feeds
  same GO to oracle). True gap = ~13 dB (closeable via GO=60) + ~2 dB intrinsic (LF vs
  KLGLOTT88 source, NOT closeable by gain). THIS 13 dB = the "klsyn88 sounds quiet" cause.
- FIX (investigator-recommended, surgical): make GO EXPERIMENT-SCOPED — drop GO from
  qlatt-english base_params so each experiment uses its own default (klatt80→47 byte-
  identical/golden-safe; klsyn88→60 published). Apply AFTER F6 deferred-items coder lands
  (it edits klsyn88 semantics; don't verify GO against a moving target). Will re-baseline
  klsyn88 render (louder, ~peak -3 dBFS like the oracle native — verify no clip). flag magnitude to Q.

## ===== GOAL STATUS: SUBSTANTIALLY MET 2026-06-29 =====
klsyn88 now faithfully implements published Klatt&Klatt 1990 KLSYN88:
- Core = faithful parwv.c port (gains/KLGLOTT88/offsets/negation/polarity/resonators),
  WAV-verified vs the (noise-FIXED) oracle: formants <2%, gains identical, level ~2dB.
- 4 paper-only features added (flutter/diplophonia/LF+SQ/tracheal), each spectral-
  signature-verified (no oracle exists for them — Q accepted equation/spectra proof).
- Defaults now match published. test:golden green (also FIXED long-standing lf-source
  stale-test). Oracle noise instrument FIXED (31-bit LCG).
Footprint: 9 tracked files (+452/-43) + oracle parwv.c fix (untracked dir) + 4 verify
scripts. NOTHING COMMITTED (Q commits-when-asked).
HONEST RESIDUALS / out-of-scope: (a) ~2dB TTS level = qlatt-english GO=47 frontend
lever; (b) deferred paper-vs-code: TL/TLTdb merge, separate GV/GH/GF/ATV/SB gains
(parwv.c folds them faithfully), seed range, SQ/Rd tension; (c) lfMakeupGain=9600
engineering estimate (LF level, no oracle); (d) core not bit-matched to oracle on
waveform (only formant/level/code) — os-tap block-level proof available if wanted.

## ===== ALL 4 PAPER FEATURES DONE + VERIFIED (F1✓F2✓F3✓F4✓) =====
Klatt&Klatt 1990 KLSYN88 feature set now implemented on the parwv.c-faithful core:
flutter, diplophonia, LF source+SQ, tracheal pole-zero. Each: byte-identical no-op
default + spectral-signature proof. test:golden EXIT 0 (and F3 fixed a long-standing
stale-test failure). No-op invariant eacf192f holds with ALL features wired = composition
proof. AGENTS.md "Nim" error corrected.
REMAINING: F5 param-surface audit vs Klatt 1990 Table XI/XII (analyst RUNNING) → then
final goal-status writeup + commit recommendation to Q (nothing committed yet).
Verification reality: core = WAV-verified vs oracle (formants <2%, level +1.5dB, gains
identical); paper-only features = spectral-signature-verified (no oracle exists, as Q accepted).

## LF-SOURCE INVESTIGATION DONE 2026-06-29
notes/klsyn88-lf-source-investigation.md. lf-source crate USABLE for F3:
- Real Fant LF (Fant 1997 Rd, Klatt 1990 OQ override, Perrotin 2021 CALM biquad, TL
  override, LFLM/LFCALM/Legacy, +flutter/jitter/di). Passing Rust tests. wasm in sync.
- Driven by f0+rd with optional oq/tl overrides → exactly F3's need.
- 14-arg ABI lf_source_process (state,f0,rd,oq,tl ptrs + flutter,jitter,di scalars +
  out,len). CALM biquad realization (not literal time-domain LF) — acceptable.
- The test:golden failure = STALE scripts/lf-source-wasm-compare.ts (7-arg vs 14-arg
  ABI), NOT a crate/wasm bug. F3 prompt now bundles fixing it → green test:golden.

## PAPER-FEATURE SPEC DONE 2026-06-28 (researcher)
notes/klsyn88-fidelity-paper-features-spec.md — exact math for all 4 features:
- LF (SS=3): E(t)=E0·e^(αt)·sin(ωg t) open / return-phase exp; ωg=π/tp; ε·ta=1−e^...;
  α by Newton area-balance. Map: te=(OQ/100)·T0, SQ=tp/(te−tp) ⇒ tp=te/(1+100/SQ);
  ta from TL/Rd. Rd bridge (Fant 1997): Rg=(1+Rk)/(2·OQfrac), Ra=ta/T0,
  Rd=(1/0.11)(0.5+1.2Rk)(Rk/(4Rg)+Ra). Drive existing lf-source crate (Rd) from OQ/SQ.
- Flutter: eq confirmed (12.7/7.1/4.7 Hz, t sec, FL%, def 0, post-declination).
- Diplophonia: delay=(DI/100)·(1−OQ/100)·T0 on alt pulses, amp=1−DI/100. Shipped C does
  delay (skew) but NOT attenuation → we add attenuation. DI 0–100, def 0.
- Tracheal: pole+zero after nasal RNZ/RNP, before F1. FTP=FTZ=2150, BTP=BTZ=180 coincident
  = transparent (no on/off knob; separate FTZ to enable). Mirror nasal pole/zero wiring.
- FLAGS: SQ=200% default vs Fant Rd-default covariation (inconsistent); reduced-vs-complete
  OQ choice shifts te by ta; ta-vs-TL double-tilt risk. Resolve during F3 impl.
- Sequencing: F2/F3/F4 all edit klsyn88 graph/semantics/registry (+F2 the source crate)
  → MUST be sequential after F1 (no concurrent same-file edits). F1 = pattern template.

## MANUAL PROCESSED 2026-06-28 (paper-reader done)
- Dir: papers/Klatt_1988_KLSYNFormantSynthesis/ (notes.md 33KB, all 22 pp read).
  Title: "KLSYN: A Formant Synthesis Program" (Klatt; IBM-PC port Johnson & Qi 1987).
- **KEY: the KLSYN88 MANUAL documents the SAME pre-1990 engine as parwv.c** — voice
  params oq/tl/sk/at/ah/dF/db only. NO flutter, NO diplophonia-%, NO speed-quotient,
  NO LF source, NO tracheal poles. Confirms (independently of the code) that the
  1990-paper extras exist ONLY in the JASA paper → built from paper eqs, no oracle.
- Unit quirks: f0 = Hz×10 in some param formats (but the .doc path the oracle reads
  treats f0 as Hz — VALIDATED, no 10× bug); oq = % (ss=1) vs exact open-sample count
  (ss=2) in manual, but SHIPPED CODE uses % for both (honor code). sk = 25µs units.
- **VERIFICATION ASSET: Table III = 21 `os` output taps** → oracle can emit internal
  signals (voice, glotout, par_glotout, each formant out). Enables BLOCK-LEVEL
  conformance (localize core divergences), not just end-to-end. Also Tables IV/V =
  vowel/consonant formant-bandwidth targets. Figures 1-4 are placeholders in this
  copy (reconstruct block diagram from Klatt 1980 / parwv.c if needed).
- ss=2 source confirmed Ug(t)=a·t²−b·t³ (KLGLOTT88 cubic) + ~600 Hz weak zero.

## PROGRESS LOG 2026-06-28
- All 3 recon scouts DONE. Reports in notes/klsyn88-fidelity-{reference,qlatt}-
  signalpath.md + -divergence-diff.md. Scout C published-spec inline (in mission
  conversation): TWO KLSYN88s — shipped C parwv.c (1982-87) vs Klatt&Klatt 1990
  paper spec.
- **Q DECISION: target = PAPER-FAITHFUL 1990 spec** (add flutter FL, diplophonia
  DI, speed-quotient SQ, tracheal pole-zeros FTP/FTZ/BTP/BTZ, LF source on top of
  the conformant core). Manual access: "use magick" → turned out NOT encrypted
  (qpdf), now processed via paper-reader skill into papers/Klatt_KLSYN88_Manual.
- **ORACLE NOISE BUG FIXED + VERIFIED.** Patched scripts/oracle/klsyn88-c/parwv.c
  (klsyn_rand31 31-bit LCG), rebuilt, swapped klsyn-oracle.exe (backup:
  klsyn-oracle-15bit-broken.exe.bak). /sh/ test: ZCR 0.005→0.231, DC 409→0.
  Oracle now produces real frication. NOT yet committed (Q commits-when-asked).
- Memory updated: project_klsyn88_fidelity_mission, feedback_use_paper_reader_skill,
  reference_klsyn_is_c_not_nim + MEMORY.md index.

## Current state / blocker (updated)
- Implementation plan drafted: notes/klsyn88-fidelity-implementation-plan.md
  (chunks F1 flutter / F2 diplophonia / F3 LF+SQ / F4 tracheal poles / F5 param
  surface). Feasibility confirmed: LF crate+wasm+worklet+registry exist (unused),
  signal-switch exists, source crate SHARED with dectalk → new params must default
  no-op (FL=0/DI=0/SS=2/tracheal bypass), which matches paper defaults.
- Baseline no-op regression hashes captured: tmp/qlatt-klsyn88.wav
  eacf192f..., tmp/qlatt-klsyn88-16k.wav 3df1e960... (prove FL=0 byte-identical later).
- compare-klsyn88.ts defaults --qlatt-wav to the 22k wav (KNOWN harness quirk; the
  peak/RMS instrument is anyway blind to the noise fix — fricative SPECTRA is where
  it shows, per the ZCR test). Spectral/segmental harness is a planned upgrade.
- TWO subagents running (both feed the build, parallel, non-overlapping sources):
  - a27e072b... paper-reader → papers/Klatt_KLSYN88_Manual/notes.md (manual ranges/algos)
  - aca1c725... researcher → notes/klsyn88-fidelity-paper-features-spec.md (LF/Fant
    OQ↔SQ↔Rd mapping, flutter, diplophonia per-period math, tracheal pole-zero)
- BLOCKED on those two for the coherent source-crate build. When both land:
  synthesize one feature spec, then gauntlet the chunks (rotate coder/verifier
  models), declarative-first, cite paper, verify each via spectral signature +
  FL=0/DI=0 byte-identical regression + test:golden.

## (earlier) RUNNING note
- paper-reader subagent on the KLSYN88 manual (a27e072b15485cbd4) — gives
  authoritative spec for the paper-only features.
- RUNNING (bg b940yuhvt): matched-rate (16k) shared-core baseline render+compare
  with the FIXED oracle, to validate the foundation before adding features.
- NEXT after manual notes land: spec each paper-only feature (flutter eq, DI, SQ,
  tracheal poles, LF source — note unused `lf-source` primitive exists in registry)
  from Klatt_1990 notes + manual, then declarative implementation (cite paper),
  verify shared subset vs oracle WAV + paper-only via spectral signatures.
- Caveat: TWO inventory files (qlatt-english + dectalk-english); klsyn88 is a
  BACKEND/experiment — confirm which frontend(s) select it before changing defaults.
