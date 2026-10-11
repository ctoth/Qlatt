# Roadmap Issue Sweep — Progress Notes

**Date:** 2026-09-04
**Goal:** Survey Qlatt for (a) speech policy still hardcoded in TS that should be declarative YAML, (b) DSP primitives and frontend algorithms described in papers/ but not implemented, (c) explainability / rule-hygiene gaps, (d) the owner's longer-term goals of splitting each synthesizer into its own package and compiling native (non-browser) versions. Then open GitHub issues for each concrete item.

## Observed so far
- Open issues: #15 (normalization builtin pattern preconditions), #17 (SPEAKER_FORMANT_KEYS F1-F10), #19 (track-assembler fallback policy). Issue style = Problem / Evidence / Acceptance criteria. Labels available: bug, enhancement, documentation, etc. only.
- Memory dir `C:\Users\Q\.claude\projects\C--Users-Q-code-Qlatt\memory\` is empty.
- `notes-paper-to-code-roadmap.md` (4 waves done, 2026-03-01) lists deferred work: progressive lengthening (Campbell & Isard), phrase-initial strengthening (White 2014), true creaky via DI, POS tagger, Wightman 1992 not in library, symmetric-sag approximation, B1/B2 40 Hz floor collapse at Rd<1.0.
- `notes-proposed-frontend-rules.md` lists 13 rules not yet done: t_flapping, td_cluster_deletion, progressive_phrase_final_lengthening, polysyllabic_shortening, stable_transition_duration, accent_priority_by_pos, f0_downstep, f0_emphasis_boost, word_initial_unstressed_polysyllabic, phrasal_accent_lengthening, dac_coarticulation_scaling, t_glottalization, tr_dr_affrication.
- `notes-tier4-dsp.md`: DI, pulsatile aspiration, per-class transitions, Chalker radiation, PFE formant bank evaluator all landed.
- Packaging survey (partial, truncated): `docs/host-contract.md` already defines the frames boundary (frontend = text→track, backend = track→audio) and names "native host (Rust + miniaudio)" as the intended third host; open risk = CEL dialect parity cel-js vs cel-rust. `plans/node-offline-runtime-render-plan.md` is done (Node host via node-web-audio-api). NO notes exist anywhere about splitting synthesizers into packages; package.json is single private package with no exports/bin/files.

## In flight
Four Explore subagents (imperative-survey, paper-gap-survey, packaging-survey, rules-explain-survey) asked to write full reports to scratchpad:
`C:\Users\Q\AppData\Local\Temp\claude\C--Users-Q-code-Qlatt\dba6f15a-dd5b-4808-a312-7aeebaac348f\scratchpad\{imperative,paper-gap,packaging,rules-explain}-survey.md`

## What didn't work
- Agent replies over ~4 KB get truncated in the teammate-message channel; fixed by having agents write to files.

## Next step
1. Read the four reports.
2. Consolidate into a ranked issue list (dedupe against #15/#17/#19 and the deferred items above).
3. Draft issues in scratchpad, then `gh issue create` for each (label: enhancement), plus two umbrella issues for "split synthesizers into packages" and "native synthesizer build".
4. Summarize to user with issue numbers.

## Packaging survey — DONE (scratchpad/packaging-survey.md, 44 KB)
Key facts: docs/host-contract.md already defines native host (Rust+miniaudio) and the track→audio conformance boundary; Node offline render works via node-web-audio-api running real worklets+WASM (localhost server hack in src/runtime-assets/node-loader.ts). No packaging notes exist anywhere.
Blockers to splitting: builtin-functions.ts loads klatt80-baseline at import (:15); rule-pack.ts:53-57 hardcoded 3-frontend map ignores manifest.json; src/g2p/* default to qlatt-english paths (8 sites); path-utils probes process.cwd()/public; f0-filters-loader.ts:85 bypasses RuntimeAssetLoader; render backends live in scripts/ importing ../../../src/*.ts; build.ps1/sh hand-list crates; tsconfig.audio.json misses 3 processors; no exports/workspaces; undeclared ../cel2js and ../bacon deps.
Blockers to native: no Rust graph executor, no Rust scheduler, no Rust CEL, crates are cdylib-only, 5 JS-only primitives (impulse-train, noise-source, differentiator, chalker-radiation, glottal-mod) with no crate.
Proposed issues P1-P8 (packaging) and N1-N6 (native) with acceptance criteria are in the report. Flags: node-web-audio-api pinned to a fork tarball; klatt-synth.ts 1302-line parallel implementation.

## Paper-gap survey — partial (2026-09-04 00:27)
Reply truncated in transit after LIST 1 item 1; re-requested as file scratchpad/paper-gap-survey.md.
Facts captured from the preview: 19 crates (18 DSP + common). fujisaki-resonator is klsyn88 F2/F3 history compensation, NOT the Fujisaki command-response intonation model. Registry: klatt80/qlatt-beauty 16-17 node types; klsyn88 adds 4. semantics.yaml klatt80: 60 params, 74 realize rules. Rules: qlatt-english ~85, dectalk-english ~90, qlatt-beauty 17. Of 362 papers with notes.md, only 107 referenced in code; 255 unreferenced.
LIST 1 #1 = frication source with aerodynamic drive + source location (Stevens 1971, Badin 1989, Shadle 1985, Heinz 1961, Hughes 1956) — today AF is just a dB level into flat noise.

## State
Waiting for scratchpad files: paper-gap-survey.md, imperative-survey.md, rules-explain-survey.md. packaging-survey.md is done and read.
Next: read all three, consolidate, draft issues, `gh issue create`.

## Imperative survey — partial (00:27), re-requested as file
Rule kinds today: scalar 113, postlexical 25, point 24, structural 20, f0_layer 19. Missing kinds implied by TS: stress-assignment (src/g2p/stress.ts:34 if/else on syllable count, no secondary stress), syllabification (only dectalk declares tables; others fall to inline nucleus counter tts-frontend.ts:384-407), lexicon/allomorph (morphology.ts:77-91,124 outputs in TS, conditions in YAML), locale normalization tables (currency text-normalize.ts:543, time :572), affect/voice-quality layer (~400 literals in src/input/affect.ts), native-primitive dispatch (klatt-runtime.ts:833-847 switch ignores registry constructor read at :75). POS/phrase-break are already declarative via annotation phase.
CEL limits forcing TS: no string ops beyond lower(), no floor/ceil/round/mod, no list construction, absent-field access throws.

## Imperative survey — DONE (scratchpad/imperative-survey.md). 30 ranked candidates.
Tier 1 (YAML and TS disagree): affect presets ~400 literals in src/input/affect.ts (L); VQ channel table spelled 4x (direction-track.ts, parse.ts, lowering.ts, apply-affect.ts) — do first (M); Rd clamp 3x (qlatt-beauty semantics.yaml:625 vs apply-affect.ts:52-57 vs lowering.ts:2102); proximity() domain constants in TS while table in YAML (builtin-functions.ts:124); modal VQ preset YAML values dead due to `!== "modal"` (source-contour.ts:169); PLSTEP burst formula duplicated (klatt-interpreter.ts:374 vs semantics plstepAmplitude).
Tier 2 (no declarative surface): stress.ts:34-87; currency/time normalizers; SPEAKER_PROJECTION_TABLE (speaker-projection.ts:67); KLATT80_EXPECTED Table III in track-analysis.ts:39-106 + reimplemented parallel gain math :451-537; number/ordinal/year/fraction/date readers; build-dectalk-dict.ts FIXUP merges + tables.
Tier 3 (engine vocabulary frozen): "SIL"/"vowel" ~20 sites in rule-engine/lowering; phoneme symbol grammar 3x (transcribe-text.ts:458 silently drops); inventory.ts SILENCE_PARAMS/30ms; formant-bank.ts:407 A{N} [0,80]; dbToLinear -72/+96/6dB; tts-frontend rate clamp/8Hz/5Hz/30ms; rule-engine :878/:898; lowering MIN_TRANSITION_EDGE_MS=20; inline markup regex; lts-engine A-Z + silent skip; voicing defs disagree (track-metrics vs track-analysis); speaker profile 4-field lists 3x; transcribe-text maxCompoundSpan=4 etc; g2p/index.ts:52-63 possessive 's bug ("fox's" -> S Z); morphology voiceless_finals never read; syllabify.ts join("") ambiguity; klatt-runtime createNativeNode switch :833-847.
Bugs: (A) pauseScale dropped on render-beauty path (apply-affect.ts:158) kills anxious/sad/fatigued primary cue; (B) pitch.semitones never realized and rangeScale routed to f0Scale instead of f0VarianceScale (parse.ts:497-522); (C) f0VarianceScale realized in lowering but not apply-affect.
Dead weight: src/klatt-synth.ts 1302 lines unimported except test/render-offline.html — delete.

## Paper-gap survey — DONE (scratchpad/paper-gap-survey.md). 12 DSP gaps + 15 frontend gaps.
DSP ranked: 1 frication aerodynamic source (Stevens71/Badin89/Shadle85/Heinz61) M-L; 2 nasal side-branch (Maeda93/Recasens83/Feng96) M, graph-only; 3 Schoentgen AR(2) jitter + shimmer S; 4 vocal-effort covariation (Lienard99 dF0=5.1*dAX, A1/A2/A3 scaling; Titze92; Sundberg05) S semantics-only, already diagnosed in notes-sound-quality.md; 5 Laine88 higher-pole correction replacing F7-F10 hack S-M; 6 port tracheal FTP/FTZ + pitch-sync F1/B1 + tilt from klsyn88 into klatt80/qlatt-beauty S; 7 Rosenberg C / R++ (Veldhuis98) / Doval06 unified 5-param S each; 8 two/three-mass self-oscillating source (Story95, Steinecke-Herzel95) L, ishizaka1972.pdf has no notes; 9 area-function->formant generator (Story96, Stevens55, Lindblom71) L, offline; 10 quantal/perceptual validation diagnostics (Chistovich 3.5 Bark, Iseli Bi=80+120*Fi/5000) S; 11 residual spectral envelope M; 12 directivity low.
Frontend ranked: 1 Klatt76 per-phone incompressibility floor D_min≈0.42-0.45*D_inh missing (duration.yaml:394 flat engineering estimate) S; 2 van Santen sums-of-products L; 3 Campbell-Isard progressive + Byrd03 pi-gesture + Beckman90 M; 4 uncited intrinsic duration tables (Umeda75/77, Peterson60, Chen70, Port79, Oller73, Crystal82, Klatt75 VOT, Cho99) S-M; 5 POS tagging + homograph disambiguation M-L; 6 Tilt (Taylor00) and Fujisaki command-response contour generators M; 7 Goldsmith autosegmental tone association S; 8 Price91 syntax-driven phrasing (needs 5); 9 rate-dependent reduction (Gay78, vanSon97) M; 10 Dalston75 sonorant + Delattre55 loci targets S; 11 Holmes64 target-transition + Hertz92 nucleus timing M; 12 Black98 CART LTS L; 13 emotion mapping (Scherer86, Banse96) M after effort; 14 amplitude contouring + Fry58 stress cue weighting S; 15 coarticulation minor.
Housekeeping: ishizaka1972.pdf & rosenberg_JASA_1971.pdf loose with no notes; Hawks&Miller not in library; fujisaki-resonator misnamed; 9 crates lack //! doc citation; Richards68 miscollected; Bjorklund16 unverified.
Stale in notes-proposed-frontend-rules.md: t_flapping, t_glottalization, polysyllabic_shortening, f0_downstep are now implemented.

## Plan for issue creation
Write each issue as scratchpad/issues/NN-slug.md (line 1 = title, rest = body), then a small script runs `gh issue create` for each and records numbers. Umbrella issues for packaging and native tracks.

## Issue drafts written (scratchpad/issues/)
declarative.md d01-d20 (20), papers.md p01-p10 + f01-f12 + h01 (23), packaging.md k00-k08 + n00-n06 (16). create-issues.mjs parses `===== key` sections, ensures labels (declarative, dsp-primitive, frontend-rules, papers, packaging, native, explainability), creates issues, records created.json. Umbrellas k00/n00 need child links appended after creation.
Pending: rules-explain-survey.md -> explain.md drafts.

## Rules/explain survey — DONE (scratchpad/rules-explain-survey.md)
Rules: 201/201 cited. Below rules: 191 realize + 240 params/constants + 309 registry nodes = 740 uncited (no citations: key in schema). 188 DECtalk-source citations undistinguished from papers. 5 citations to papers not in library. Tags: free-form, 105 distinct, dectalk_trace_exact most used; only first tag per rule recorded (rule-engine.ts:959/1163). Provenance: only rules/transcribe/frontend stages emit; prosody unreachable (utterance.ts:158 hardcodes "rules"); semantics/interpreter/runtime dark; 4/5 COMPACT_PRIORITY_TYPES dead. Diagnostics: 46 calls, 39 in lowering.ts, 31 fatal; 25 silent clamps ranked (rate clamp tts-frontend.ts:592, SIL fallback inventory.ts:229, WAV hard clip write-wav.ts:7). Validation gaps: unknown rule fields, missing citations (runtime-only), tags, field names, phoneme symbols, CEL vars all silently accepted; warnings discarded (W_POLICY_PARAM_UNCITED/UNUSED). No rule linter, no coverage report; citation gate = 3 phrases in CI. Docs stale: AGENTS.md references nonexistent src/tts-frontend-provenance.ts; docs/README.md advertises tts-dsl run/validate/diff that don't exist.
VERIFIED FALSE: claim that `npm run explain -- ... --flag` strips flags. From Git Bash flags pass through (`scripts/explain-phrase.ts hi --format json`). It's a PowerShell `--` artifact. Filed as a docs footgun, not an npm bug.
Drafts: explain.md e01-e10.

## Next
Run create-issues.mjs (real) for declarative.md papers.md packaging.md explain.md from repo cwd; then append child-issue links to umbrellas k00/n00; then report.

## RESULT (2026-09-04): 69 issues created, #31-#99
- Declarative track: #31-#50 (incl. bugs #35, #43, #49, #50; tracker #46; CEL enabler #47; delete klatt-synth #48)
- DSP primitives from papers: #51-#60
- Frontend rules from papers: #61-#72; hygiene #73
- Packaging: umbrella #74, children #75-#82
- Native: umbrella #83, children #84-#89
- Explainability: #90-#99 (incl. engine bug #98, docs #99)
Labels created: declarative, dsp-primitive, frontend-rules, papers, packaging, native, explainability.
Umbrellas edited to link children; dependency comments added on #32 #33 #71 #95 #90 #65 #66 #42 #89.
Memory written: long-term-goals-packaging-native, roadmap-issue-sweep-2026-09, pwsh-double-dash-footgun.
Suggested first moves: #31, #54, #61, #91, #93, plus bugs #49/#50.
