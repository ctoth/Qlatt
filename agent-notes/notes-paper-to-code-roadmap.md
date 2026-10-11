# Paper-to-Code Roadmap — Progress Notes

## Current Status
- **Wave:** ALL 4 WAVES COMPLETE. Gate 4 PASS. Roadmap done.
- **Last Updated:** 2026-03-01

## Baseline Results
- Golden tests: 2/3 PASS, 1/3 FAIL (render-phrase golden stale: maxDelta=0.908, rmsError=0.178, thresholds are 1e-6/1e-7)
- WASM build: SUCCESS (all 16 crates, no warnings)
- Branch: feature/paper-to-code-roadmap

## Gate Results

| Gate | Status | Date |
|------|--------|------|
| Gate 0 | PASS (baseline) | 2026-02-28 |
| Gate 1 | PASS (Wave 1 → Wave 2) | 2026-02-28 |
| Gate 2 | PASS (Wave 2 → Wave 3) | 2026-02-28 |
| Gate 3 | PASS (Wave 3 → Wave 4) | 2026-02-28 |
| Gate 4 | PASS (Wave 4 complete) | 2026-03-01 |

## Completed Steps

| Step | Commit | Key Finding | Date |
|------|--------|-------------|------|
| Gate 0 | e861b1b | Baseline established; render-phrase golden stale | 2026-02-28 |
| 1.1 CEL builtins | faec070 | sqrt/exp/abs/log registered in both CEL contexts. MERGE. | 2026-02-28 |
| 1.2 Speaker profiles | e26a567 | params.policy.speaker added with 4 paper-backed defaults. MERGE. | 2026-02-28 |
| 1.4 Fricative inventory | 08468f3 | AF gaps corrected: S-F=18dB, S-TH=20dB. TH<F ordering fixed. MERGE. | 2026-02-28 |
| 1.5 DAC property | a6f9404, 1ce90cc | dac on 64 entries (incl GS) + materializePhonemeTarget fix. MERGE. | 2026-02-28 |
| 1.3 Postlexical rules | 02967f5 | 6 rules + GS entry. t_deletion uses zeroing. Palatalization uses match+patterns. MERGE. | 2026-02-28 |
| 2.1 LF crate extension | 4eae6af, a5fa1c2 | OQ/TL/flutter/jitter AudioParams + jitter fix + f32→u64. MERGE. | 2026-02-28 |
| 2.2 Semantics/graph binding | d717746 | 4 params + 4 graph bindings + registry. Passthrough design. MERGE. | 2026-02-28 |
| 2.3 Bandwidth formulas | 8a804e4 | Ra + B1/B2 realize rules. Additive delta relative to Rd=1.0. MERGE. | 2026-02-28 |
| 2.4 Voice quality presets | 6ff21a6 | 6 presets (modal/breathy/pressed/creaky/whispery/falsetto). Frame injection. MERGE. | 2026-02-28 |
| 3.1+3.2 DAC F2 coarticulation | fdc4536, 559cf6d | DAC-weighted vcv_coarticulation: w=rate*(1-dac/3). 5 tests. Golden regen. MERGE. | 2026-02-28 |
| 3.3 F1/F3 coarticulation | 4c3f625 | Same dac_weight for F1/F2/F3. No per-formant scaling. 9 tests. MERGE. | 2026-02-28 |
| 3.4 Integration | — | No coder work needed. Rule ordering correct, blend factor appropriate. Gate 3 PASS. | 2026-02-28 |
| 4.1 Prosodic structure | cdd94b7, 5b73aa1 | annotateProsody(): 170 function words, 8-step pipeline, 23 tests. MERGE + cleanup. | 2026-02-28 |
| 4.2 ToBI intonation | 785d499 | 7 new ToBI rules, 6 old removed, pow CEL builtin, accentIndexInPhrase, downstep k=0.6. MERGE. | 2026-02-28 |
| 4.3 Sagging transitions | 3717fb8 | F0Point tag/accentType, applySaggingTransitions() pure function, 3 sag points, 16 tests. MERGE. | 2026-03-01 |
| 4.4 Duration model | fb7b741 | Pipeline reorder, break-index pre-boundary, accent lengthening, duration cap, cursor view fix. MERGE. | 2026-03-01 |

## Wave 3 Plan
- 3.1+3.2 DAC-weighted F2 coarticulation — **MERGE** (fdc4536, 559cf6d)
- 3.3 F1/F3 coarticulation extension — **MERGE** (4c3f625)
- 3.4 Integration verification — Scout DONE (no coder work needed), **Gate 3 PASS**

## Wave 4 Plan — ALL MERGE
- 4.1 Prosodic structure annotation — **MERGE** (cdd94b7). 170 function words, 19 tests, 8-step pipeline. Verifier 11/11 PASS.
- 4.2 ToBI intonation model — **MERGE** (785d499). 7 new ToBI rules, 6 old removed, pow added, accentIndexInPhrase added. 12 tests. Verifier 12/12 PASS.
- 4.3 Sagging transitions — **MERGE** (3717fb8). 16 tests. Verifier 10/10 PASS.
- 4.4 Duration model integration — **MERGE** (fb7b741). Pipeline reorder + 3 new rules + cursor view staleness fix. 9 tests. Verifier 8/8 PASS.

## Wave 2 Plan
- 2.1 LF crate extension — **MERGE**
- 2.2 Semantics/graph binding — **MERGE**
- 2.3 Bandwidth formulas — **MERGE**
- 2.4 Voice quality presets — **MERGE**

## Decisions Log

| Decision | Rationale | Papers | Date |
|----------|-----------|--------|------|
| t_deletion uses scalar zeroing (not splice) | Engine replace_range with empty insert breaks sync contiguity | — | 2026-02-28 |
| materializePhonemeTarget fixed for non-BASE_PARAMS numerics | Bug: only booleans were copied; dac (numeric) was silently dropped | — | 2026-02-28 |
| Jitter: per-period F0 perturbation (not per-sample phase) | Current LF crate uses integer period counter, not phase accumulator. Per-period approach compatible. | Fraj 2011 | 2026-02-28 |
| OQ in percentage (0-99), TL in dB (0-41) | Match Klatt 1990 conventions. Convert to ratio/cutoff internally. | Klatt 1990 | 2026-02-28 |
| Ra in percent for DeltaB formula | DeltaB1 = 250*(F1/500)^2*Ra/12 expects Ra in % (0.44-12), not fraction | Fant 1997 | 2026-02-28 |
| B1/B2 additive delta relative to Rd=1.0 | Per-phoneme B values = modal baseline. Delta=0 at modal. Floor 40 Hz. | Fant 1997 | 2026-02-28 |
| Skip B3-B6 realize rules | Glottal contribution negligible at higher formants | Fant 1997 | 2026-02-28 |
| Jitter formula: b*xi*f0*sqrt(f0/Fs) | Fix for BLOCKER-1: original was 3000x too small. Per-period random walk accumulation. | Fraj 2011 | 2026-02-28 |
| f32 time → u64 sample_count | Fix for MAJOR-1: f32 drifted >1% at 50s, stalled at ~500s. u64 with f64 intermediate is indefinitely precise. | — | 2026-02-28 |
| OQ/alpha_m decoupling is intentional | When OQ overridden, alpha_m stays Rd-derived. Matches Klatt 1990 independent OQ control. | Klatt 1990 | 2026-02-28 |
| Voice quality presets use frame injection (not scalar rule) | VQ is global speaker characteristic, not per-token. Direct frame injection simpler than CEL rule phase. | — | 2026-02-28 |
| AH offset is additive to per-phoneme AH | Preserves phoneme-specific aspiration distinctions. Breathy HH gets AH=60 (40+20), not AH=20. | Klatt 1990 | 2026-02-28 |
| Creaky preset uses jitter approximation | True creaky needs DI (diplophonia), not implemented. Jitter=20 gives rough voice, not period doubling. | Gobl 2003 | 2026-02-28 |

## Decisions Log (Wave 3)

| Decision | Rationale | Papers | Date |
|----------|-----------|--------|------|
| No new engine.ts rule kind needed | Scout found `kind` is metadata only; existing select/apply handles coarticulation | Recasens 1997 | 2026-02-28 |
| Steps 3.1+3.2 collapsed into one | No engine code change needed, so rule kind + YAML rule done together | — | 2026-02-28 |
| Missing DAC defaults to 1 | Conservative: maximum coarticulation for unclassified tokens | Recasens 1997 | 2026-02-28 |
| No per-formant scaling for F1/F3 | Same dac_weight for all formants; intrinsic vowel ranges produce correct F2>F3>F1 hierarchy | Ohman 1966 | 2026-02-28 |

## Decisions Log (Wave 4)

| Decision | Rationale | Papers | Date |
|----------|-----------|--------|------|
| No POS tagger — function word list only | List approach gives 90%+ accuracy for TTS input. POS tagging is future work. | O'Shaughnessy 1976, Allen 1987 | 2026-02-28 |
| Long phrase breaking at >6 content words | Insert breakIndex=2 at midpoint. Simple O'Shaughnessy heuristic. | O'Shaughnessy 1976 | 2026-02-28 |
| H* default accent type; L* for questions | Prenuclear and declarative nuclear: H*. Question nuclear: L*. | Pierrehumbert 1980 | 2026-02-28 |
| Annotations on ALL phones of word | isFunctionWord/isContentWord/isAccented on all phones. isNuclearAccent on stressed vowel only. breakIndex on last phone. | Silverman 1992 | 2026-02-28 |
| Downstep deferred to Step 4.2 | annotateProsody() only sets annotations. Downstep is acoustic. | — | 2026-02-28 |
| 145-word function word set with contractions | Articles, conjunctions, prepositions, auxiliaries, modals, pronouns, determiners, 46 contractions. | O'Shaughnessy 1976, Allen 1987 | 2026-02-28 |
| accentIndexInPhrase pre-computed in annotator | Option A from scout 4.2: counter in annotateProsody(). CEL uses exp(n*log(k)). Reset per phrase (breakIndex=4 only). | Pierrehumbert 1980 | 2026-02-28 |
| Move annotateProsody() before duration phase | Scout 4.4 found prosodic annotations run AFTER duration rules. Must reorder to make breakIndex available. | — | 2026-02-28 |
| Pipeline reorder is safe | Annotator reads phoneme/word/stress/punctuation only — all exist before duration. Only ADDS properties. | — | 2026-02-28 |
| Replace old pre_boundary_lengthening | New break-index-based rule replaces punctuation proxy. Remove old parameters. | Klatt 1976, Crystal & House 1988 | 2026-02-28 |
| Wightman 1992 factors from task prompt | Paper not in collection. Using plan-specified factors as engineering estimates. | — | 2026-02-28 |
| Uniform (not progressive) pre-boundary lengthening | Applies uniform factor to all tokens in final word. Progressive (Campbell & Isard 1991) is future work. | — | 2026-02-28 |
| Duration cap at 2.0x inherent | Prevents runaway stacking. Klatt 1976 phrase-final up to 2x. | Klatt 1976 | 2026-02-28 |
| Defer phrase-initial strengthening | 10% effect near JND threshold. Low perceptual benefit. Can add later. | White 2014 | 2026-02-28 |
| Sagging transitions: symmetric parabolic model | Ladd describes asymmetric (gradual fall, abrupt rise). Symmetric is engineering approximation. Liberman & Pierrehumbert 1984 NOT in collection. | Pierrehumbert 1980, Ladd 2008 | 2026-02-28 |
| Sag applies H*-H* only | Not L*, not across phrase boundaries. Minimum span 150ms. | Pierrehumbert 1980 | 2026-02-28 |
| sag_depth_hz: 12 Hz (engineering estimate) | Neither paper provides explicit value. 12 Hz ~ 11% of 110 Hz base. | Pierrehumbert 1980, Ladd 2008 | 2026-02-28 |

## Interaction Status Tracker
- CEL builtins (1.1): **MERGE** (faec070)
- Speaker profiles (1.2): **MERGE** (e26a567)
- Postlexical rules (1.3): **MERGE** (02967f5)
- Fricative inventory (1.4): **MERGE** (08468f3)
- DAC property (1.5): **MERGE** (a6f9404, 1ce90cc)
- LF crate extension (2.1): **MERGE** (4eae6af, a5fa1c2)
- Semantics/graph binding (2.2): **MERGE** (d717746)
- Bandwidth formulas (2.3): **MERGE** (8a804e4)
- Voice quality presets (2.4): **MERGE** (6ff21a6)
- DAC F2 coarticulation (3.1+3.2): **MERGE** (fdc4536, 559cf6d)
- F1/F3 coarticulation (3.3): **MERGE** (4c3f625)
- Prosodic structure (4.1): **MERGE** (cdd94b7). Verifier 11/11 PASS. Analyst: 3 MINOR (dead code, uninitialized null, edge case tests).
- ToBI intonation (4.2): **MERGE** (785d499). Verifier 12/12 PASS. Analyst: 3 MINOR (dual F0 on comma SIL, phraseAccent unused, edge case tests).
- Duration model (4.4): **MERGE** (fb7b741). Verifier 8/8 PASS. Analyst: 0 BLOCKER, 0 MAJOR, MINORs: Wightman 1992 not in library, missing edge case tests.
- Sagging transitions (4.3): **MERGE** (3717fb8). Verifier 10/10 PASS. Analyst: 2 MINOR (no F0 floor, weak integration test).
- Batch fix (all): commit 5260203. 6 MINORs fixed across 4.2/4.3/4.4. 672 tests passing. Gate 4 dispatching.

## Measurements

| Metric | Baseline | Current | Step |
|--------|----------|---------|------|
| resonator maxRelError | 0.0000143 | — | Gate 0 |
| antiresonator maxRelError | 0.00000684 | — | Gate 0 |
| lf-source maxDelta | 0.00000988 | — | Gate 0 |
| render-phrase maxDelta | 0.908 (FAIL) | — | Gate 0 |
| render-phrase rmsError | 0.178 (FAIL) | — | Gate 0 |
| WASM build | 16/16 crates OK | — | Gate 0 |

## Known Issues (from Wave 1/2 analysts)
- 5 of 6 postlexical rules lack sentence-level tests (Analyst 1.3 MAJOR-1)
- glottal_stop_insertion over-generates in hiatus contexts (Analyst 1.3 MAJOR-2)
- Commits a6f9404/1ce90cc have misleading messages (bundled unrelated refactoring, no DAC mention)
- B1/B2 floor 40 Hz will cause bandwidth collapse at Rd<1.0 (Analyst 2.3 MAJOR, latent)
- Rd-derived OQ cross-validation uses 1e-4 tolerance (f32 rounding through 5 intermediate steps)
- Creaky preset is jitter approximation; true creaky needs DI parameter (future work)
- YAML preset citations are inline comments, not structured arrays (Analyst 2.4 MINOR-1)
