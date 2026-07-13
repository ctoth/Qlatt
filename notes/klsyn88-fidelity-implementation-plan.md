# klsyn88 → Klatt&Klatt 1990 KLSYN88: Implementation Plan (target A)

Session 2026-06-28. Target (Q): paper-faithful Klatt & Klatt 1990 KLSYN88. Build the
1990 paper-only features ON TOP OF the already-conformant parwv.c core. Declarative-
first; every rule/DSP cites the paper/manual; new params default to NO-OP so the
shared `oversampled-glottal-source` crate (also used by dectalk-english frontend)
and dectalk are unaffected unless they opt in.

Spec sources: papers/Klatt_1990_VoiceQualityVariations/notes.md (eqs),
papers/Klatt_KLSYN88_Manual/notes.md (ranges/algorithm — paper-reader IN PROGRESS),
notes/klsyn88-fidelity-reference-signalpath.md (shared-core C truth).

## Foundation status (done)
- Core is a faithful parwv.c port (verified at code level: gains/KLGLOTT88/offsets
  /negation/polarity all match). 
- Oracle noise bug FIXED (31-bit LCG) — fricative/aspiration verification now valid.

## Feasibility inventory (verified 2026-06-28)
- LF source: crates/lf-source (Fant LF, Rd param), lf-source.wasm, worklet, registry
  entry ALL exist but UNUSED by klsyn88 graph. signal-switch primitive exists for SS.
- Shared crate: crates/oversampled-glottal-source — used by BOTH klsyn88 experiment
  AND dectalk-english. Source-level changes MUST default no-op.
- klsyn88 is an experiment backend (test/klsyn88.test.ts, render-phrase
  --experiment-id klsyn88), NOT a live frontend. Low blast radius for graph changes.

## Feature chunks (each: spec → declarative impl → verify; gauntlet w/ rotated agents)

### CHUNK F1 — FLUTTER (FL)  [no oracle; spectral signature]
- Spec: Δf0 = (FL/50)·(F0/100)·[sin(2π·12.7t)+sin(2π·7.1t)+sin(2π·4.7t)] Hz
  (Klatt&Klatt 1990 eq.1, notes:81-87). FL 0–100%, def 0.
- Surface: F0 perturbation. PREFER declarative — a point/scalar rule modulating the
  F0 contour over absolute time at frame granularity (5ms grid resolves ≤12.7 Hz).
  If frame granularity proves too coarse, compute in the source worklet from a
  phase accumulator. New frame param FL.
- Default: FL=0 → Δf0=0 (no-op). dectalk unaffected.
- Verify: render sustained vowel FL=50 → measure F0 track; assert wander at
  12.7/7.1/4.7 Hz (FFT of F0 contour) and Δf0 amplitude ≈ formula. npm run measure.

### CHUNK F2 — DIPLOPHONIA (DI)  [no oracle; period signature]
- Spec: alternate pulses delayed (up to closure-meets-next-opening) + linearly
  attenuated 1→0 as DI 0→100% (notes:89-95). DI 0–100%, def 0.
- Surface: source worklet (extend the existing alternate-period skew mechanism in
  oversampled-glottal-source — it already does Kskew alternation). New param DI.
- Default: DI=0 → no delay/attenuation (no-op).
- Verify: render vowel DI=50 → alternate-period amplitude/timing modulation visible
  in waveform period analysis; subharmonic at F0/2 in spectrum.

### CHUNK F3 — LF SOURCE OPTION (SS=3) + SPEED QUOTIENT (SQ)  [no oracle for LF]
- Spec: SS selects source 1=impulse / 2=KLGLOTT88(default) / 3=LF (Fant). SQ
  100–500% def 200 = LF pulse skew (open/closed slope ratio), LF-only. Reconcile
  Klatt LF (OQ/SQ) ↔ crate Rd parameterization (manual/Fant notes).
- Surface: wire crates/lf-source via signal-switch on SS in graph.yaml; semantics
  maps OQ/SQ→LF params. New frame params SS(extend), SQ.
- Default: SS=2 (KLGLOTT88) unchanged → LF path inert. dectalk unaffected.
- Verify: SS=3 produces voiced output; spectral slope vs SQ matches LF theory;
  KLGLOTT88 path (SS=2) byte-identical to pre-change (regression guard).

### CHUNK F4 — TRACHEAL POLE-ZERO (FTP/FTZ/BTP/BTZ)  [no oracle; spectral zero]
- Spec: subglottal coupling pole+zero pair for breathy voice (notes:119,183-189).
  Added in cascade (like nasal pole/zero). Params FTP/FTZ + BTP/BTZ.
- Surface: graph.yaml — add resonator (tracheal pole) + antiresonator (tracheal
  zero) into the cascade chain (mirror nz/np). New frame params.
- Default: amplitude/bypass off (freq=0 → bypassAtZero) → no-op.
- Verify: enable → spectral zero+pole at FTZ/FTP visible in render spectrum.

### CHUNK F5 — PARAM SURFACE + DEFAULTS RECONCILE  [cross-cutting]
- Add FL/DI/SQ/SS/FTP/FTZ/BTP/BTZ to klsyn88 semantics params with paper
  defaults/ranges/units; cite Table XI/XII + manual. Resolve the unit/range
  conflicts Scout C flagged (TL max 34 vs 41; OQ %; F0 Hz; F2 default).
- Decide: keep code-truth (34/Hz/%) for the conformant core, expose paper ranges
  where they extend it. Document each choice with citation.

## Verification harness upgrades (needed regardless)
- compare-klsyn88.ts: add `--qlatt-wav` correctly + matched sample rate; add
  SEGMENTAL spectral comparison (not just peak/RMS) for the shared core vs oracle.
- New: paper-feature signature tests (F0-wander FFT, subharmonic, spectral-zero)
  since the oracle can't render FL/DI/SQ/tracheal/LF.
- Gate per feature: test:golden + render + the feature's spectral signature.

## Open items pending manual notes
- Exact LF parameterization Klatt used (OQ/SQ → LF a/epsilon, or via Rd).
- Tracheal pole/zero default freqs + bandwidths + amplitude control.
- Exact diplophonia delay/attenuation algorithm (manual may give the per-period math).
- Confirm flutter is applied to F0 BEFORE or AFTER declination/contour.
