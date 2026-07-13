# chunk-tilt-a — Wire tilt-filter into dectalk audio path (CODER)

Datestamp: 2026-05-29
Branch: dectalk-parity
Mission: add tilt-filter primitive to the registry dectalk loads; insert
`tiltFilter` node on source path `impulseGain -> tiltFilter -> sourceSum`;
bind TL. Paul (TL=0) MUST stay byte-identical. Gate = AUDIO render + golden + explain.

## Verified facts

- dectalk-english `extends: klatt80-baseline` (`public/experiments/manifest.json:27-32`).
  dectalk has only graph.yaml + semantics.yaml; NO own registry.yaml. So it
  inherits klatt80-baseline/registry.yaml, which has NO tilt-filter (grep confirms
  only klsyn88, stevens91 declare it).
- tilt-filter primitive copy-source: `stevens91/registry.yaml:9-20` (worklet
  `tilt-filter-processor.js`, wasm `tilt-filter.wasm`, param `tilt` default 0).
  Compiled assets ship at `public/worklets/tilt-filter-processor.js` + `tilt-filter.wasm`.
- Crate `crates/tilt-filter/src/lib.rs`: at tilt=0, TILT_TABLE[0]=0.0 →
  decay=0.0, one_minus_decay=1.0 → process(x)=1.0*x+0.0*y1 = x EXACTLY
  (IEEE: 1.0*x==x, 0.0*finite==0.0). So tilt=0 is bit-exact passthrough. GOOD.
- Worklet `src/worklets/tilt-filter-processor.ts`: param `tilt` k-rate default 0
  min 0 max 34; rounds value; passthrough until ready (fills 0 if not ready).
- dectalk graph source path: `impulseSource -> impulseGain -> sourceSum`
  (graph.yaml:461-462). Splice tiltFilter between impulseGain and sourceSum.
- TL semantics param exists (klatt80-baseline 0..41), inherited, currently binds
  ONLY lfSource.tl (graph.yaml:112) which is gated off at sourceMode=0. So TL inert today.
- config loader: src/experiments/load-experiment-config.ts

## Plan (all DATA)
1. Create dectalk-english/registry.yaml with just tilt-filter primitive (smaller
   blast than editing klatt80-baseline). Merge keeps base + adds it.
   BUT: dectalk graph.yaml meta.primitives = ./registry.yaml — need to confirm
   how registry resolves for an extends experiment with own registry. CHECK loader.
2. graph.yaml: add tiltFilter node {tilt: {bind: TL}}; change `[impulseGain, sourceSum]`
   to `[impulseGain, tiltFilter]` + add `[tiltFilter, sourceSum]`.
3. Render Paul before/after, compare samples (byte-identity).
4. Render with TL>0 (temp inventory bump), show HF energy drops; revert.

## DONE so far
- Loader (load-experiment-config.ts:94-118): extends experiment loads child
  registry.yaml if present, mergeRegistry(parent, child) merges child primitives
  over base. So creating dectalk-english/registry.yaml with ONLY tilt-filter is
  cleanest, smallest blast. DONE.
- EDITS MADE:
  - NEW public/experiments/dectalk-english/registry.yaml: tilt-filter primitive (cited).
  - graph.yaml: added `tiltFilter` node {type: tilt-filter, tilt:{bind:TL}};
    rewired `[impulseGain, sourceSum]` -> `[impulseGain, tiltFilter]` + `[tiltFilter, sourceSum]`.
- RENDER CMD (note: needs ts-node loader, NOT bare node):
  `node --loader ts-node/esm/transpile-only --experimental-specifier-resolution=node scripts/render-phrase.ts --phrase "hello world" --frontend-id dectalk-english --experiment-id dectalk-english --host node --out-wav X.wav --out-json X.json --compare-golden 0`
- BYTE-IDENTITY PROVEN: Paul before/after both sha256
  525096eb1544fe34a0b2ac8141bf43496c51ae6a09c0b794ea19f8694c9576a7;
  sample-wise maxAbsDelta=0 over 30848 samples, 0 NaN, peak 1.044. PASS.

## Status: proving tilt audibly works via temp inventory TL bump (revert after).
inventory.yaml:32 base_params TL: 0.

## 2026-05-29 re-verification (this coder)
- On arrival inventory had TL:34 (leftover test bump). REVERTED to TL:0 (Paul state). DONE.
- Current tree (tiltFilter node present, TL=0) renders headlessly: EXIT=0 -> /tmp/tilt-after.json/.wav. Primitive resolves.
- For byte-identity reference: created git worktree at HEAD (096ccf87, committed = NO tiltFilter node) at
  C:\Users\Q\AppData\Local\Temp\qlatt-head ; symlinked main node_modules in.
  Rendered committed-tree Paul -> /tmp/tilt-before.json/.wav EXIT=0.
- NEXT: compare /tmp/tilt-before vs /tmp/tilt-after (sha256 WAV + inspect-audio.ts). Must be identical.
- THEN: temp inventory TL bump (e.g. 28), render, show highFreqFraction3k DROPS vs TL=0; revert.
- THEN gates: test:golden, explain dectalk-english.
- Other agents' worktrees present (qlatt-om, agent-*). Do NOT touch. Will `git worktree remove` only my qlatt-head.

## BYTE-IDENTITY PROVEN (2026-05-29)
TL=0: before(committed, no tiltFilter) vs after(tiltFilter present) WAV sha256 IDENTICAL
(525096eb1544fe34a0b2ac8141bf43496c51ae6a09c0b794ea19f8694c9576a7), 30848 samples,
rms 0.11349, peak 1.0447, 0 NaN, maxAbsDelta=0. CLIP flag is pre-existing (in committed tree too). PASS.

## PROBLEM: tilt does NOT reduce HF energy at output (DIAGNOSING)
Added FFT spectral measure to inspect-audio.ts (specHighFraction3k, specHighEnergyAbs3k).
- TL=0:  specHighFraction3k 0.0008, absHF 766.8, rms 0.11349
- TL=28: specHighFraction3k 0.00101, absHF 770.1, rms 0.10372
HF fraction went UP, abs HF flat. Both FFT and one-pole proxy agree: tilt is NOT low-passing output.
Routing verified (klatt80-baseline/semantics.yaml:771-793): at sourceMode=0 (DECtalk default)
impulseSourceSwitch=1 (impulse ON), sourceDiffSwitch=1 -> voice path = sourceSum->rgp->rgz->radiationDiff->sourceDiffGain->voiceGain.
tiltFilter IS upstream of sourceSum so SHOULD affect it. radiationDiff differentiates (HF boost) — counteracts but shouldn't fully cancel.
NEXT: render TL=34 (decay .995, near-integrator, strongest lowpass). If HF still unchanged -> tilt not in active path (param not reaching worklet, or k-rate param default issue). If HF drops at 34 -> effect is just small at 28.
inventory currently TL=34 (TEMP — must revert to 0).

## TILT WORKS — RESOLVED (2026-05-29)
The "hello world" HF metric was confounded: its >3kHz energy is dominated by unvoiced /h/ + boundary
noise that flows through noiseSource/fricationSource paths, which BYPASS the source-side tiltFilter.
Tested on all-voiced sustained vowel "aaaa" (everything flows through tiltFilter). Absolute >3kHz energy:
  TL=0 -> 4.4535,  TL=14 -> 3.8613,  TL=34 -> 0.3801  (monotone, ~11.7x / ~10.7 dB drop 0->34).
Clean low-pass. DECtalk-correct: TILT is a SOURCE tilt, rolls off voiced source, not frication. CONFIRMED.

## Gates
- inventory reverted to TL=0; git diff inventory = EMPTY. GOOD.
- explain "hello world" --frontend dectalk-english --strict-citations: decisions=178 uncited=0, EXIT 0. CLEAN.
- test:golden: EXIT=1. Failing block rmsError=0.325 maxDelta=0.79. NEED to identify which test —
  is it the pre-existing lf-source failure (allowed) or my change? run-golden.ts output is JSON-per-test
  without obvious name on the failing block. INVESTIGATING which test fails + baseline on committed tree.

## GATES FINAL (2026-05-29) — ALL PASS
test:golden runs 3 scripts (run-golden.ts:8-12):
  1. klatt-tract-wasm-compare (resonator/antiresonator) — PASS.
  2. lf-source-wasm-compare — EXIT 1, rmsError=0.325 maxDelta=0.79. This is the
     PRE-EXISTING lf-source failure (allowed by mission). Standalone WASM compare,
     does NOT load the dectalk experiment -> my change cannot affect it. Not new.
  3. render-phrase (qlatt-english golden) — EXIT 0, PASS. qlatt-english byte-matches golden.
explain "hello world" --frontend dectalk-english --strict-citations: uncited=0/178, EXIT 0.

## Final deliverable state
- M public/experiments/dectalk-english/graph.yaml (tiltFilter node + impulseGain->tiltFilter->sourceSum)
- ?? public/experiments/dectalk-english/registry.yaml (tilt-filter primitive, cited)
- ?? scripts/inspect-audio.ts (reusable; I added FFT spectralHighFraction/spectralHighEnergyAbs)
- inventory.yaml: NO diff (TL=0). qlatt-english/klatt80-baseline/crate/worklet untouched.
- Cleaned up my git worktree (qlatt-head) + node_modules symlink. Other agents' worktrees untouched. No git add/commit.

## Deferred (NOT in this chunk — per recon tilt-b/c/d)
- Per-phoneme TILT inventory targets (tilt-b, D-G7): vowels~3, nasal~6, obstruent 7, voiced-stop/jh 40, /hx/ 20.
- Per-voice tilt audibility (tilt-c): spectral_tilt_offset_db already adds to TL (tts-frontend.ts:181-183), now audible.
- F0-dependent tilt + AV loudness comp (tilt-d, calibration, values-laden — flag to Q).
