# DECtalk 4.63 → Qlatt Parity Backlog

2026-05-28. Synthesis of 5 subsystem gap reports (notes/dectalk-gap-A..E). Goal (Q):
eliminate every gap, iterate to 100% DECtalk parity. HARD CONSTRAINT: everything
stays declarative — no imperative TS for linguistic behavior. Engine may be made
*more powerful* (new rule kinds / primitives), but DECtalk behavior lives in YAML.

Reference: `C:\Users\Q\src\dectalk\463\dapi\src` (DECtalk 4.63 C source).
Port: `public/rules/frontends/dectalk-english/` + declarative engine in `src/declarative-frontend/`.

## Current declarativity status of the port
- Synth DSP: ~done (cascade/parallel Klatt, impulse source). Real code = DSP primitives (allowed).
- Frontend: LTS rules (YAML), duration.yaml, structural.yaml, formant.yaml, prosody.yaml — all declarative.
- F0: layered renderer in track-assembler.ts (TS) reads declarative prosody.yaml + speaker policy.
- Engine extension already in flight (uncommitted): per-point `when:` CEL guard (engine.ts:2171, validation.ts:1900) — a ToBI workstream added it. Generically reusable for us.

## Gap inventory (consolidated, dependency-ordered)

### Tier 0 — cheap, data already converted, fully declarative
- **E-G1 Voices (8 of 9 missing).** Only Paul exists (`frontend.yaml:283-319`). Converted
  YAMLs for harry/frank/dennis/betty/ursula/wendy/rita/kit/chris already sit in
  `~/src/dectalk/463/output/qlatt/speakers/*.yaml` — never imported. → copy in + loader.
- **E-G2 Voice-selection mechanism.** No speaker-id plumbing. → declarative frontend param + policy switch.

### Tier 1 — text→phoneme (foundational: fixes WHICH phonemes emit)
- **A-G5 Main dictionary unused.** `skip_dictionary:true` (`frontend.yaml:4`); DECtalk `Dic_us.txt` (~13.5k entries) not imported. Every word hits LTS. → import dict as data, wire lookup.
- **A-G1 Number reading algorithm.** DECtalk reads years/oh-insertion/fractions (`l_us_pr1.c`); port uses generic cardinal. → declarative number-reading rules / normalize phase.
- **A-G2 fractions, A-G3 Roman numerals, A-G6 abbreviation coverage+context.**
- **A-G4 Homographs / POS disambiguation** (`ls_homo.c`) — none in port.
- **A-G7 grapheme_rewrites (311 dropped), A-G8 phoneme collapse (AX→AH etc.), A-G9 TWOPH frozen (192 pairs).**
- **A-G10 structured text preprocessor** (phone/email/URL/emoticon/compound, `CMD/par_*.par`).
- **A-G11 dectalk-specific normalize phase** (port reuses qlatt-english normalizeText).

### Tier 2 — symbolic phonology (two whole DECtalk stages absent)
- **B-G12 Syllabification** (`ph_syl.c`, `p_us_sy1.c`) — absent. Foundational for stress/duration.
- **B-G13 onset-cluster legality, B-G14 consonant stress assignment** (`p_us_sr1.c`).
- **B-G1..G11 Allophone rewrite engine** (`ph_aloph.c`, 1837 L) — entirely absent:
  flapping (t→DF, d→DX), postvocalic R/LL allophones, palatalization, glottalization,
  function-word reductions, geminate deletion, syllabic nasals.
- **B-G15..G24 Duration rules 10–24** (`p_us_tim.c`) — only 13 of ~24 rules ported;
  syllable-type keying, Rule 9 nphon+2 lookahead absent. Rule 23 keys on flap (dead until B-G2 lands).

### Tier 3 — F0 / intonation (renderer needs new layer primitive)
- **C-G3 GLIDE/ramp layer primitive** — renderer has profile/persistent/impulse only; DECtalk hat is GLIDE. (blocks C-G11 generic glides)
- **C-G4 segmental F0 micro-contour** (separate filter path) — absent.
- **C-G1 clause types (5), C-G2 question/comma boundary gestures** (declared but dead).
- **C-G5 glottalization dip, C-G6 impulse decay shape, C-G7 phrase-position decay, C-G8 2-pole control filter, C-G10 jitter/flutter.**
- **C-G9** extra +12 Hz baseF0 bias term DECtalk lacks — verify intentional.

### Tier 4 — formant transitions / coarticulation (largest; needs declarative transition engine)
- **D-G1 Locus tables** (`us_maleloc[]`/`us_femloc[]`, `setloc()`).
- **D-G2 forward smoothing, D-G3 backward smoothing** (`p_us_st1.c:413/810`).
- **D-G4 general coarticulation, D-G5 special coarticulation, D-G6 V-V coarticulation.**
- **D-G7 per-phoneme TILT targets** (inventory only has TL=0).
- **D-G13 us_gettar context target tweaks.**
- Present already: formant.yaml (SW + obstruent parallel amps), diphthong trajectories, burst profiles, VOT.

### Tier 5 — synth/voice DSP finish
- **E-G3 spectral TILT wiring** — tilt-filter crate/worklet exist but unwired in dectalk graph; impulse source has no tilt param.
- **E-G4 AP (aspiration) distinct from AV** — port uses only AH.
- **E-G5 per-voice formants/gains/glottal/headsize** — Paul carries scale only.

## Declarativity strategy (engine extensions likely needed)
- Tier 3 C-G3: add a `glide`/`ramp` F0 layer kind (declarative layer spec consumed by renderer).
- Tier 4: add a declarative "transition/smoothing" rule kind (locus + forward/backward smoothing
  expressed as data tables + CEL), so coarticulation is rules+tables, not TS branches.
- Tier 1 dict: import as a data asset + declarative lookup config (not hardcoded).
- Reuse the new per-point `when:` guard for variant self-selection where possible.

## Ordering rationale
0 → 1 → 2 → 4 then 3/5 interleaved. Phonemes must be right (1) before phonology (2);
phonology before transitions (4) since allophones change targets; F0 (3) and synth-finish (5)
are largely independent and can land alongside.
BASELINE 2026-05-29 branch dectalk-parity: vitest 1105/1105 pass (125 files); golden exit 0

## Execution log
- dt-1 (Tier0 voices): coder dispatched, running. Declarative speaker store + selection; F4-F8/gains/glottal graph-wiring deferred to dt-1b.
- dt-2 (Tier1 dict): recon DONE (notes/chunk-dt2-dict-recon.md). Smallest path = convert Dic_us.txt(13682)->JSON + generic per-frontend dictionary_path. POS/homograph = v2. Coder queued behind dt-1 (shared tts-frontend.ts/loader edits).

## Execution log (cont.)
- dt-1 COMMITTED 5505ce1e: declarative 10-voice support. Adversary=ALIGNED (zero per-voice TS). vitest 1105/1105; golden red ONLY on pre-existing lf-source-wasm-compare (maxDelta 0.79, orthogonal to dectalk/impulse source). Gate going forward = vitest 1105/1105 + no NEW golden failure beyond lf-source.
- FACT: KlattFrame F0 is at frame.params.F0 (NOT top-level). frame[20] default "hello world." F0=93.17Hz.
- dt-1b (default voice = Paul) under empirical check: first probe was buggy (read frame.F0=undefined->0, false "identical"). Re-measuring via frame.params.F0.
- lf-source golden red: PRE-EXISTING, gross mismatch -> likely wasm rebuilt w/o regenerating golden (or vice versa). Flagged to Q; fix deferred (orthogonal to parity).

- dt-1b FINDING (probe scripts/dt1b-default-vs-paul.ts): default vs explicit paul = constant +12Hz offset (default 84-102Hz, paul 96-114Hz) = the 110-vs-122 base_f0 gap. Everything else (f0_minimum etc) already matches via inline policy.speaker. dt-1b = make default genuinely Paul. DEFERRED: small offset + API-contract wrinkle (does selected voice override positional baseF0?) — FLAG to Q. Lower priority than dict/phonology.
- dt-2 (dictionary) = highest parity lever (fixes phonemes for ~all words). STAGED: dt-2a build+validate converter (no wiring), Q-review conversion correctness, then dt-2b wire + regenerate dectalk baselines. Recon: notes/chunk-dt2-dict-recon.md.

## Execution log (cont. 2)
- dt-2a COMMITTED 6d4014fb: dict data (13,272 entries, zero unknown symbols).
- dt-2b COMMITTED 82f2f1e4: generic dictionary_path wiring, dict-first+LTS fallback. Analyst SAFE-TO-COMMIT, declarativity-clean. +load diagnostic +2 regression tests. vitest 1107.
- dt-3 (flapping) READY-to-commit: postlexical.yaml flap_t/flap_d (T->DF,D->DX), gated word_count()>=3, intervocalic+unstressed. Added GENERIC engine primitive word_count() (fixed Set->positional run-count). DF target from us_maltar[] (cited). Adversary ALIGNED. Probe: city/butter-knife/ladder flap; tea/attack/butter-alone don't.
- dt-3 recon corrections: NO postlexical engine kind needed (it exists); phase order is hardcoded in tts-frontend.ts runPhases (postlexical slot), NOT pipeline.yaml; duration Rule 23 does NOT key on DF in this port.
- NEXT: dt-4 batch remaining allophone rewrites (glottalization T->TX, palatalization T->CH/D->JH, dh->DZ, postvocalic R/L) — all structural from ph_aloph.c. Then dt-5 function-word reductions (word table=data). Then dt-6 syllabification (needs generic annotation pass).

- dt-3 COMMITTED 73a46712: flapping (postlexical), generic word_count() primitive. Adversary ALIGNED. vitest 1107.
- dt-4 READY: palatalization(T->CH/D->JH), glottalization(T->TX), dentalization(dh->DZ). PURE YAML (zero TS) -> declarativity structural. TX/DZ inventory targets cited (us_maltar US_TX 52/US_DZ 35). Precedence in pipeline.yaml: palatalize>glottalize>flap>dental (source goto endrul3). Probe 13/13. Coder corrected "button" example (labial guard blocks glottalization -> flaps to DF instead; real cases certain/curtain->TX).
- NEXT after dt-4: dt-5 function-word reductions (ph_aloph.c L737-814, word table=data). Then postvocalic R/L fusion (L821-872). Then dt-6 syllabification (needs generic annotation pass - will touch engine, adversary required).

- dt-4 COMMITTED b6aa3038: palatalize/glottalize/dental allophones (pure YAML). vitest 1107.
- dt-5 FINDING (probe scripts/dt5-rhotic-probe.ts): pipeline emits UNFUSED vowel+R (car->K AA R, start->S T AA R T, cure->K Y UW R, here->HH IY ER). DECtalk dict stores unfused too (card=k'ard=AA+consonant-R; only syllabic-r capital-R like bird/for pre-fused->ER). So vowel+R fusion is a RUNTIME rule (A13 ph_aloph.c L835-872), correctly NOT a converter fix. Fusion vowels AR/IR/ER/OR/UR exist; only RR missing. dt-5 = A13 fusion + A12 R->RX + A5 R->RR + (A11 LL->LX likely N/A, port emits L/EL not LL).

- dt-6 (clause intonation) READY: questions RISE (are you home? -> terminal rise 92->98; you are home. falls). Pure YAML (frontend.yaml constants + prosody.yaml rules + pipeline.yaml), zero TS. Reuses dead boundary impulse layer + punctuationSymbol. Gestures from ph_inton1.c: ?=-151/+451 + fall80; ,=+171/+250 + fall120; clause-varying fall (180/150/120/80). wh==yes/no (faithful, no split in 4.63).
- dt-6 LATENT-BUG FIX (VERIFIED via before/after contour dump scripts/dt6-contour-compare.ts): resolve_points was [f0], excluding f0_layer -> ALL stress+boundary impulses collapsed to t=0 (every phrase had one opening spike then flat decline: "the quick brown fox" started 151 then flat). Fix resolve_points=[f0,f0_layer] -> impulses distribute to anchored syllables (one-two-three-four-five now peaks 119/116/113/113 on each number). Statement tails dropped 85->67 (correct post-decay baseline, was artificially-high residue). MORE DECtalk-accurate. No test regressed; loose F0-range e2e assertions still pass.

- dt-6 COMMITTED db5413b4: clause intonation (question rise + comma + clause-fall depth) + latent F0 t=0-collapse fix. Pure YAML/config. vitest 1107.
- dt-7a READY: per-voice F4/B4 via generic data-declared speaker_frame_params:[F4,B4] in frontend.yaml + generic stamp loop in applySpeakerProfileToParams. Betty F4=4550/B4=400; Paul=inventory default=byte-identical. No voice names in TS.
- PARITY-ACCURACY DEBT (byte-identical-Paul constraint hides these; FIX in a dedicated chunk later, accept baseline shift, verify vs ph_vset.c):
  * dt-1b: dectalk default base_f0 = 110 (generic profile) but DECtalk Paul = 122. Explicit speaker:paul gives 122.
  * F5/B5: every voice YAML (incl Paul) stores F5=B5=6000 (from ph_vset.c) but dectalk inventory base_params F5=4500/B5=600. Inventory likely wrong for DECtalk; F5/B5 not stamped (would break Paul no-op + don't differ between voices).
  * Candidate chunk dt-Z: "correct dectalk inventory+default to true DECtalk Paul values" (base_f0 122, F5/B5 6000, audit other base_params vs ph_vset.c), regenerate baselines.
- NEXT: dt-7b per-voice gains (G1-G4/LO/GV/GH/GF/GN -> new additive dB terms in semantics/pfe-codegen; dt-7 recon Option b; the real timbre payoff; keep Paul byte-identical). Then number/year reading (Tier1 A-G1). Then Tier4 formant transitions (largest).

- dt-7a COMMITTED 2b0da449: per-voice F4/B4 (generic speaker_frame_params data + stamp loop). Betty F4=4550; Paul byte-identical.
- dt-8 COMMITTED 801d76d6: year reading ("1984"->"nineteen eighty four", "1905"->"nineteen zero five", 2000/2005 cardinal) via generic per-frontend normalization policy (year_policy DATA + generic readYear handler). numberToWords untouched; qlatt-english byte-identical. vitest 1107.
- dt-9 IN FLIGHT: minor allophones (A1 geminate delete, A4 s/z->sh/zh, A19 syllabic-n after TX). Pure YAML, no new symbols.
- TIER-4 DESIGN BANKED (notes/chunk-dt-tier4-transition-design.md): DECtalk transition = boundary value + LINEAR ramp to steady target over durtran frames (fwd=start, bwd=end). Locus: bouval=locus+prcnt*(curval-locus)/100. Table {locus_hz,prcnt,durtran_ms} per obstruent+formant+vowel-cat, male+female. Qlatt current blend EXCLUDES obstruents (the big gap); symmetric 50% = DECtalk no-locus default -> migration ADDITIVE. V-V coartic DISABLED in 4.63 (skip). Design = generic per-edge boundary-value linear-ramp primitive in track-assembler + locus/durtran/coartic as YAML data. Chunks t4a(prim+locus+fwd) t4b(bwd) t4c(coartic) t4d(TILT). Plan: split t4a into prim-refactor (byte-identical) then locus-data (behavior shift, big baseline regen).
- DISPATCH NOTE: `claude` subagents restate-loop even with structured framing; recovery = SendMessage "GO. You are a subagent...". Prepend stronger execute-immediately line to future coder prompts.
- REMAINING toward 100%: Tier4 transitions (biggest), syllabification+duration 10-24, per-voice gains, true-Paul calibration (base_f0 122/F5 6000), fractions/ordinals/Roman, homographs/POS, function-word reductions, F0 fidelity (GLIDE/segmental/jitter), AP vs AV.

## STATUS @ 2026-05-29 (12 chunks committed on branch dectalk-parity, base e1c0e684)
COMMITTED (all vitest 1107/1107, declarative, adversary/analyst-cleared where TS touched):
  5505ce1e dt-1 voices(10) | 6d4014fb dt-2a dict-data | 82f2f1e4 dt-2b dict-wiring
  73a46712 dt-3 flapping | b6aa3038 dt-4 palat/glottal/dental | 4e7331d5 dt-5 rhotic-fusion
  db5413b4 dt-6 question-rise+F0-bugfix | 2b0da449 dt-7a per-voice F4/B4 | 801d76d6 dt-8 year-reading
  05d741dd dt-9 geminate/sibilant/syllabic-n | d916bfa5 dt-t4a-prim transition-primitive
  9b44cb50 dt-t4a-data locus obstruent transitions
GATE: vitest 1107/1107 throughout. golden red ONLY on pre-existing lf-source-wasm-compare (orthogonal). qlatt-english byte-identical throughout.

REMAINING toward 100% parity (designs banked in notes/chunk-dt*-recon + chunk-dt-tier4-transition-design):
  - Transition refine: t4b general+special coartic (setloc prcnt place-bit adj, us_special_coartic p_us_st1.c:301); t4e per-phoneme TILT; female us_femloc locus table.
  - per-voice GAINS (G1-G4/LO/GV/GH/GF/GN) -> additive dB terms in semantics/pfe-codegen (dt-7 recon Option b; Paul-relative reference to keep byte-identical). Completes voice timbre.
  - syllabification pass (dt-3 recon §2.4: generic syllabify built-in writing syllable_index/role from onset-cluster+affix tables as DATA) + duration rules 10-24.
  - true-Paul CALIBRATION (parity-accuracy debt): default base_f0 110->122; inventory F5/B5 4500->6000 (ph_vset.c); audit base_params vs DECtalk; default-Paul contract (does voice override positional baseF0?). Baseline-shifting -> do as one deliberate chunk, verify vs ph_vset.c.
  - Tier1: fractions/ordinals/Roman (dt-8c+); homographs/POS (needs POS tagging — big); function-word reductions (ph_aloph.c L737-814).
  - F0 fidelity: GLIDE/ramp layer primitive (C-G3); segmental F0 micro-contour; jitter/flutter; glottalization dip.
  - AP (aspiration) distinct from AV.

## STATUS @ 2026-05-29 (cont.) — 14-15 chunks, baseline now vitest 1119
  fe379bc2 dt-7b per-voice gains | 3c5e5e7a dt-10 syllabification(+12 tests) | dt-11 duration-rules-10-24 (pending commit)
TIER COMPLETION:
  Tier0 voices+F4+gains DONE (deferred: F5/B5/F7/F8/aerodynamic/GN nasal gain).
  Tier1 dict DONE, year-reading DONE (deferred: fractions/ordinals/Roman, homographs/POS, function-word reductions, text-preprocessor phone/email/url).
  Tier2 allophone-engine DONE, syllabification DONE, duration rules MOSTLY (deferred: Rule12 needs LX, 14/16/17/21 need accumulated-state/total-phone-count builtin, durmin floors).
  Tier3 question+comma intonation DONE (deferred: GLIDE/ramp primitive C-G3, segmental F0 micro-contour, jitter/flutter, glottalization dip).
  Tier4 locus obstruent transitions DONE (deferred: t4b setloc place-bit prcnt adj + special coartic, t4e per-phoneme TILT [needs synth tilt-filter wiring E-G3 first], female us_femloc).
  Tier5 synth: spectral tilt UNWIRED (E-G3, tilt-filter crate exists), AP-vs-AV not distinct.
  CALIBRATION DEBT: true-Paul (default base_f0 110->122, inventory F5/B5 4500->6000) + default-Paul contract (positional baseF0 vs voice) — baseline-shifting, values-laden, FLAG to Q.
NEW ENGINE PRIMITIVES added this workstream (all generic, adversary-cleared): word_count(), resolveBoundaryParams (per-edge boundary ramp), resolveLocusBoundary, syllabify pass + syllable_index/role/position builtins, per-frontend dictionary_path, per-frontend normalization policy, speaker_frame_params + speaker_gain_offsets generic stamps, point `when:` guard (pre-existing).

## STATUS @ 2026-05-29 14:26 — 16 committed + dt-13 pending; ENV INCIDENT
  c3c0e02e dt-12 fractions/ordinals (Roman skipped: not in 4.63 source). vitest 1119.
  dt-13 female locus table DONE by coder (1119 + Paul sha256 byte-identical) but UNCOMMITTED — working-tree changes: frontend.yaml, src/track-assembler.ts, dectalk-voice.ts, tts-frontend.ts, validation.ts + scripts/dt13-female-locus-probe.ts. Generic sex-branch (voiceSex==='female'?loci_female:loci), loci=data. Adversary not yet run (env blocked).
  INCIDENT: ~14:24 node_modules gutted by EXTERNAL process (vitest/vite/typescript/js-yaml all missing, no .package-lock.json) — NOT my commands. Blocked all test-gating. Q confirmed safe to npm install -> running (bnwrm8d4u). After restore: re-gate dt-13, adversary, commit, continue.
  REMAINING after dt-13: t4b coartic polish; spectral tilt wiring E-G3 + per-phoneme TILT; AP-vs-AV; F0 fidelity (GLIDE/segmental/jitter); function-word reductions (may be mostly dict-handled); homographs/POS (big); text-preprocessor (phone/email/url); true-Paul CALIBRATION (values-laden, FLAG to Q).

## 2026-05-29 ~14:40 — TESTING METHOD CORRECTION (Q)
- Q: full `npx vitest run` is NOT how we test; I leaned on it as the gate (wrong — gives false confidence for an AUDIO synth; loose dectalk-e2e asserts only F0>5Hz ranges). Real gates per AGENTS.md: `npm run test:golden` + `npm run explain`. node_modules was gutted externally ~14:24; Q OK'd npm install -> restored.
- KEY FINDING: explain/golden-render-phrase/vitest all default to or test QLATT-english, NOT dectalk audio I changed. explain "hello world" (qlatt default) = 225 decisions, 0 uncited, exit 0, NO hang. So qlatt pipeline fine; dectalk audio through real synth = UNVERIFIED by me (the gap Q flagged: "never ran the synth the way it's used").
- ACTION (Q approved): added `--frontend` + `--speaker` flags to scripts/explain-phrase.ts so explain can target dectalk-english. NEXT: run `npm run explain -- "..." --frontend dectalk-english` (with hang-timeout) to verify MY rules end-to-end; check for errors/hangs/garbage. If hang -> suspect dt-10 syllabify maximal-onset loop or dt-t4a-data locus/dt-11 duration on some phrase.
- "running for hours" still unexplained (no stuck vitest/esbuild proc visible). Possibly dev server, or a hung dectalk render. Verify dectalk pipeline doesn't hang.

## 2026-05-29 ~15:00 — AUDIO RENDER FINDING (the right test = render actual audio)
- explain now targets dectalk (--frontend/--speaker, COMMITTED 727b2f04). dectalk explain clean (178 dec, 0 uncited). Frame-track sweep (18 cases) healthy: no hang/NaN/silence, voices distinct.
- BUT render-phrase.ts --host node --frontend-id dectalk-english => **0 SAMPLES (silence)**. CRUCIAL: --host node --frontend-id qlatt-english ALSO = 0 samples. So 0-samples is NOT dectalk-specific and NOT my chunks — it's the `--host node` path (or unbuilt WASM).
- Golden render-phrase (run-golden runs it with NO args => host "auto") PASSES with samples all session. So host=auto produces audio; --host node does not.
- HYPOTHESIS: `--host node` audio render needs BUILT WASM; WASM may be stale/unbuilt (same root cause as the persistent lf-source golden maxDelta 0.79 failure all session). OR "auto" resolves to a JS path / browser. NEXT: read scripts/rendering/select-backend.ts (auto vs node vs browser; does node backend produce samples or stub?); render dectalk with host=auto (the project's actual way); consider build.ps1 (WASM build) — Q's "something broken / that's not how we test / running for hours" may = WASM not built / wrong render host.
- dt-13 (female loci) still uncommitted, verified healthy via frame sweep.

## 2026-05-29 ~15:40 — DEV SERVER UNBLOCKED (the real "broken")
- ROOT CAUSE of "can't test / something broken": `npm run dev` predev -> build:worklets (tsc -p tsconfig.worklets.json) FAILED on src/worklets/wasm-utils.ts:113 — a no-op ternary `bytes instanceof ArrayBuffer ? bytes : bytes` not assignable to BufferSource under TS 5.9 (ArrayBufferView generic over ArrayBufferLike incl SharedArrayBuffer). PRE-EXISTING: committed in 555f4b80 (f0-filters extraction, at branch point e1c0e684, before my work); file unmodified in my tree; TS pinned 5.9.3 + lockfile so my reinstall didn't cause it. build:worklets/dev has been broken since 555f4b80.
- FIX: replaced no-op ternary with `const source = bytes as BufferSource;` + comment (DOM lib false-positive; WebAssembly.Module accepts it at runtime; F0 bytes always ArrayBuffer-backed). build:worklets now exits 0. NOT YET COMMITTED.
- Q can now `npm run dev` and listen (frontend=dectalk-english auto-pairs experiment; voice dropdown live).
- t4b coarticulation coder hit API rate-limit (incomplete, agentId a33e0f3aa2f78f993) — left unfinished; revisit. Its extract_place_coartic.py in dectalk repo (harmless pyright).
- 21 commits since base. Holding for Q's listen feedback to steer remaining (true-Paul calibration [values-laden], GLIDE, AP-vs-AV, t4b coartic, clipping).

## 2026-05-29 ~16:30 — Q listened (Betty): "muffled" + spy state_leak FAIL
- state_leak FAIL (cv=0.248): ROOT CAUSE = noise-source-processor.ts:78 Math.random() when unseeded; browser doesn't seed (node does via noiseSeed -> 2 node renders byte-identical = core deterministic). Comment says random is intentional "live variation" but DECtalk is deterministic -> for parity, seed browser noise. FIX PENDING.
- "MUFFLED": tilt-b is NOT the cause (A/B: per-phoneme TL on/off -> highFreqFraction 0.11 vs 0.109, ~identical in node render). I was wrong; verified before reverting.
- STRONG LEAD: render shows sourceMode=1 (LF source, Rd=0.9) NOT impulse. dectalk semantics.yaml:7 INTENDS sourceMode=0 (impulse, DECtalk's bright/buzzy source) but shared public/rules/policy/source-contour.yaml:16 baseline.source_mode:1 (written for qlatt-english) overrides via applySpeakerProfileToParams. So dectalk runs LF (smooth=muffled) instead of impulse. A/B IN PROGRESS: temp-set source-contour source_mode 0, rendering to compare high-freq (MUST RESTORE source-contour.yaml to 1 after — it's SHARED, affects qlatt-english).
- CAVEAT: muffling is browser-perceived; node renders may differ from browser. node-vs-browser gap persists.
- FIX (if confirmed): dectalk needs its OWN source-contour with source_mode=0 (declarative per-frontend), NOT changing the shared policy (qlatt-english wants LF/1).
- tilt-a/b NOT reverted (not the cause). 23 commits. f2_ceiling (F2 max 2238) + SW/AV ramp-frame warnings still to examine.

## 2026-05-29 ~17:00 — MUFFLING FIXED + state_leak fix in progress
- MUFFLING FIXED & COMMITTED 5bfed8e5: dectalk now uses its OWN source-contour (source_mode:0 impulse) instead of inheriting shared policy's source_mode:1 (LF). A/B confirmed 2.9x more >3kHz energy (highFreqFraction 0.110->0.171). qlatt-english unchanged. Declarative (source_contour_path, pre-existing frontend field). Q to re-listen.
- tilt-a/b NOT the muffle (A/B disproved); NOT reverted.
- state_leak fix (in progress): noise-source-processor uses Math.random() when processorOptions.seed unset. klatt-runtime:748 nodeOptions=nodeDef.options flows to processorOptions (842/876). node-runtime seeds via per-node overrides (deterministic); browser/live runtime does NOT -> Math.random -> state_leak. FIX = add `options: {seed: N}` (distinct per node) to the dectalk graph's TWO noise nodes (graph.yaml:123 noiseSource[aspiration], :129 fricationSource). Declarative graph data; dectalk-only (qlatt baseline graph untouched). Browser then seeds via nodeOptions; node still uses its derived-seed override. Verify: Q re-runs spy -> state_leak should pass (can't verify browser determinism headlessly; node already deterministic).
- 24 commits. Remaining: state_leak (now), f2_ceiling (F2 max 2238 - check inventory front-vowel F2), SW/AV ramp-frame warnings (likely benign transition frames).

## 2026-05-29 ~18:00 — GLIDE committed (128cbfe3) + voice-formant data finding
- GLIDE F0 layer COMMITTED 128cbfe3: generic glide layer (Rust LAYER_GLIDE=3 + TS, WASM rebuilt) + hat-rise/question-rise as ramps. CAVEAT: US DECtalk hat=STEP, question=IMPULSE; GLIDE is German/alt form — smoothness upgrade, Q to judge by ear (keep vs revert to strict step/impulse). qlatt byte-identical.
- FINDING (voice formant data): ph_vdefi.c:262-265 shows a voice F5=2500/B5=100, NOT the 6000/6000 in the converted voice YAMLs (speakers/*.yaml). So voice F5/B5=6000 is a likely CONVERSION ARTIFACT (dormant — dt-7a skipped stamping F5/B5, so not affecting audio). Inventory active F5=4500 may also mismatch DECtalk ~2500. => voice F4-F8/B4-B5 conversion needs an AUDIT vs ph_vdefi.c (convert_speakers.py may have a column/field offset bug). Dispatching audit recon.
- AP-vs-AV: appears ALREADY-CLOSED — frames show distinct AV/AH (vowel AV=53/AH=-4; HH AV=-8/AH=36). Not a gap.

## 2026-05-30 — SYNTH-PATH RECON + dt-vtm1 (glottal source = the big gap)
- Q asked "what else for 100% on synthesis path". 4 scouts (notes/synth-path-gap-1..4): early
  "synth ~95% done, only tilt" claim is FALSE/inverted. Frontend matched; ACOUSTIC ENGINE is the
  biggest gap. #1 lever = glottal source: DECtalk = KLGLOTT88 (vtm3.c); port fired impulse-train.
  Also: frame-smoothing only covers some boundaries (rgz/phdraw gaps); F0 GLIDE deviates from US
  STEP/IMPULSE; F5/B5 live voice gap (5 voices). See synth-path-gap-recon.md synthesis.
- dt-vtm1 COMMITTED ffecd4eb: wired existing oversampled-glottal-source crate (KLGLOTT88, already
  built, only in klsyn88) into dectalk graph as selectable sourceMode 3. Pure YAML (registry+graph+
  semantics), NO engine TS. Default stays 0 -> Paul byte-identical; test:golden exit 0. A/B (hello
  world): KLGLOTT88 +42% brighter, level-matched. WAVs: test/tmp/dt-vtm1-source-{0-impulse,
  3-klglott88}.wav. Probe: scripts/dt-vtm1-source-ab.ts.
- dt-vtm1b COMMITTED 70b32e97 (Q: "do it properly/fully" — no listen gate): KLGLOTT88 is now the
  DEFAULT dectalk source. Routing cleaned to match klsyn88 (klglott voice → voiceGain+avsGain
  DIRECTLY, bypass rgp/rgz/radiationDiff; sourceDiffSwitch gated off at mode3 → sourceSum empty →
  rgz explosion GONE, verified count 0). Default flipped: source-contour baseline.source_mode 0→3,
  semantics default 0→3, inventory sourceMode 0→3. All 168 frames render KLGLOTT88. Output
  byte-identical to prior diff-route (diff chain was acoustically transparent, just unstable) =
  same +42% brightness. golden exit 0 (qlatt byte-identical); explain dectalk 343 dec 0 uncited.
  modes 0/1 still selectable. New-default WAV = test/tmp/dt-vtm1-source-3-klglott88.wav.
- SYNTH-PATH GLOTTAL SOURCE = DONE (the #1 lever).

## 2026-05-30 SYNTH-PATH PARITY BURST — 5 commits ("keep going / finish it")
  ffecd4eb dt-vtm1    KLGLOTT88 wired (selectable source_mode 3)
  70b32e97 dt-vtm1b   KLGLOTT88 = default + clean klsyn88-style routing (rgz explosion gone)
  dd002645 dt-voice-f5 per-voice F5/B5 (real 5th formant; ZAPF disable; Paul de-spurious'd)
  ac6dffe3 dt-voice-br per-voice breathiness BR -> KLGLOTT88 aturb (ph_vset.c:786)
  e38643c5 dt-voice-hs head-size F4/F5 scaling baked per voice (ph_vset.c:712)
GATE all clean: qlatt-english golden BYTE-IDENTICAL (render-phrase exit 0) throughout; explain
  dectalk 0 uncited every voice; renders bounded/no-NaN/no-explosion. (golden npm exit 1 = ONLY the
  pre-existing lf-source-wasm-compare 0.79, proven independent via standalone run.)
RESULT: voices now genuinely differ (per-voice F4/B4/F5/B5/HS/gains/breathiness). WAVs for Q ear:
  test/tmp/dt-voice-{paul,betty,harry,kit,wendy}.wav; source A/B test/tmp/dt-vtm1-source-{0,3}-*.wav.
DECLARATIVITY: all 5 = YAML data + the pre-existing crate. Zero engine TS touched. No adversary needed.

## 2026-05-31 (cont.) dt-smooth COMMITTED 7706a45e
- Universal midpoint smoothing fallback (gap-2 #1): data-gated flag smooth_all_boundaries (dectalk
  true, qlatt omits -> byte-identical). Generic fallback in track-assembler (reuses resolveBoundaryParams;
  only F1-F3/B1-B3 move, bursts untouched). Adversary ALIGNED. Peak-neutral-to-helpful (she sells
  1.20->0.91). A/B WAVs: test/tmp/dt-smooth-{ON,OFF}.wav. Faithful per-param durtran = future refinement.

## CLIPPING FINDING (likely NODE-RENDER ARTIFACT, not a browser defect)
- Sonorant-heavy phrases peak >1.0 in NODE renders on BOTH sources (impulse 1.38-1.69, KLGLOTT88
  2.0-2.25). Output chain = outputSum -> masterGain(228x) -> outputCompressor(thr -24/ratio 12) ->
  outputGain. Deliberate compressor-LIMITER design: a faithful (browser) compressor pulls the hot
  masterGain signal back; node-web-audio-api's compressor is weak -> peaks leak. Impulse clipped in
  node too & never flagged in 27 commits -> long-standing node artifact, browser likely clean.
  ACTION: NOT fixing blind (master cut would make browser too quiet). FLAG Q: confirm by ear whether
  browser distorts; if yes -> dedicated level chunk (loudness = perceptual, needs Q target).

## REMAINING (quality-tuning phase — needs Q ear, NOT pure correctness):
- gap-2 #1 smoothing coverage: midpoint blend fires only sonorant<->sonorant + ~25 obstruent loci;
  obstruent-adjacent/no-locus boundaries + B1-B3 get NO transition. Fix = universal midpoint
  fallback, but SHARED track-assembler.ts -> must be per-frontend DATA-GATED (qlatt byte-identical).
  RISK: crude uniform 30ms over-smooths stop bursts; DECtalk-faithful needs per-param durtran
  (us_forw/back_smooth_rules, big). DECISION: implement behind a flag for Q A/B before default-on.
- gap-2 #2 per-frame phdraw: F0-dep TILT, tspesh/pspesh held-step VOT/voicebar (needs per-frame primitive).
- gap-3 F0 fidelity: GLIDE deviation (port ramps hat/question; US=STEP/IMPULSE — values-laden revert,
  Q pref); segmental micro-contour; deterministic jitter; 5 clause profiles vs 1.
- gap-4 leftovers: F7/F8 parallel formant freq separation (graph surgery); B1-widening BR^2/2 (unit-verify);
  GN nasal gain (no AN destination).
- dt-vtm2 crate fidelity: diplophonia alternating-cycle + in-source aspiration mixing vs vtm3.c (Rust).

- STATUS: 26 commits. High-value parity done + both spy FAILs fixed. Remaining: voice-formant-data audit (now, no-Q), true-Paul default-pitch calibration (low audible impact since UI defaults to Paul; baseline-shifting), GLIDE keep/revert (Q's ear), deep edge cases. Foundational source(impulse)+glide changes await Q re-listen.
