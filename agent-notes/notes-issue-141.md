# notes-issue-141 — grooming "Move synthesizer-owned data out of core paths"

Session 2026-09-08. Branch issue-218-effect-resolution (unrelated; grooming only, no code).

## Verified: every evidence line in #141 still holds on master
- src/cmu-dictionary-loader.ts:13  DEFAULT_CMU_DICTIONARY_PATH = "/cmu-dictionary.json"
- src/input/rd-policy.ts:28        RD_POLICY = readRdPolicy(loadYamlDocumentSync("/rules/policy/vq-channels.yaml"))  (import-time)
- src/input/vq-channels.ts:78-79   VQ_CHANNELS = parse(loadYamlDocumentSync("/rules/policy/vq-channels.yaml"))  (import-time)
- src/input/affect-presets.ts:131-132 AFFECT_LIBRARY = parse(loadYamlDocumentSync("/rules/affect/presets.yaml")) (import-time)
- src/speaker-profile.ts:3         DEFAULT_SPEAKER_PROFILE_PATH = "/rules/policy/speaker-profile.yaml"
- src/source-contour.ts:5          DEFAULT_SOURCE_CONTOUR_PATH = "/rules/policy/source-contour.yaml"  (issue says :4)
- src/track-analysis.ts:131-132 (reference table-iii.yaml), :499-502 (semantics + graph) import-time

## Evidence #141 is MISSING
- src/transcribe-text.ts:83  top-level `await preloadCmuDictionaryFromPath(DEFAULT_CMU_DICTIONARY_PATH)` — the 4 MB dictionary is loaded at *import* of a core module. Biggest import-time load in the repo; not in the issue.
- src/dectalk-voice.ts:104   resolveVoice(registry, name, profileSpec = loadSpeakerProfileSync()) — DECtalk voice resolution defaults to qlatt-english's speaker-profile.yaml. Cross-mission pollution goal.md forbids.
- src/experiments/frontend-vocabulary.ts:45  loadSourceContour(spec.source_contour_path ?? undefined) → falls to default path
- src/tts-frontend.ts:530,558  `spec.x_path ?? DEFAULT_X_PATH` fallbacks
- scripts: evaluate-lexical-stress.ts:59 "/cmu-dictionary.json"; verify-dectalk-dict.ts:35 "/dectalk-dictionary.json"; profile-tts.ts:34, scan-dictionary-misses.ts:115 use DEFAULT_CMU_DICTIONARY_PATH
- tests pinning defaults: test/policy-paths.test.ts, source-contour.test.ts, speaker-profile-schema.test.ts, speaker-projection.test.ts:19 (module-level loadSourceContourSync())
- public/rules/frontends/dectalk-english/frontend.yaml:7 stress_policy_path → /rules/frontends/qlatt-english/stress-policy.yaml (cross-package data ref, "shared English lexical policy")
- public/rules/normalization/*.yaml — shared by all three frontends via include; owner undecided under #74 rule
- experiments laine88, steinecke95 exist; not in #74's package list

## Dependency state
- #77 CLOSED (issue + #74 checklist say open) ; #140 CLOSED (#74 checklist stale) ; #78 OPEN — only real blocker
- public/rules/frontends/qlatt-english/policy/ already exists (accent-policy, break-policy, tune-grammar) — destination is real

## Not #141's scope (other children)
- rule-pack.ts:87-89 hardcoded frontend map → #76
- load-experiment-config.ts:100 manifest path, f0-filters-loader.ts:85 /public/ literal → #78

## Where-what-belongs observations
- src/input/ = Direction Track mechanism (affect, vq-channels, rd-policy, direction-track, inline, parse). Its DATA (presets.yaml, vq-channels.yaml) is per 12-fe-architecture §4 "write fresh" beauty content, yet lives at public/rules/affect + policy and is loaded by core at import.
- vq-channels.yaml names backend_param (RdPhraseOffset, GO, AH, TL, F1, B1...) — it is a frontend→frame-vocabulary contract like output.lowering.columns; #140's checkVocabulary does not cover it.

## Checkpoint 2 (after Q: "every load yaml call is a smell; what is this inventory and why does it know about nuclei")
- Additional import-time load: src/declarative-frontend/rule-pack.ts:696 `QLATT_ENGLISH_RULEPACK = await preloadBundledRulepackSpec(DEFAULT_FRONTEND_ID)` — whole qlatt-english rulepack compiled at import; used by transcribe-text.ts and 10 tests.
- Load call sites in src (non-worklet): rule-pack.ts 12 (the resolver), inventory.ts 3, yaml-loader/path-utils/node-loader 14 (mechanism), source-contour 2, speaker-profile 1, tts-frontend 1, transcribe-text 1, rd-policy/vq-channels/affect-presets 3, track-analysis 3 (generic `<T>` call, missed by first grep), f0-filters-loader 1, frontend-vocabulary 1, harness-diagnostics/schema 1 (string parse only).
- Sharper decision for #141: loadYaml* appears in exactly two places — yaml-loader.ts (mechanism) and the frontend resolver (rule-pack.ts + inventory.ts merged into one resource resolver). frontend.yaml declares a `resources:` map; resolver loads + validates; everything else receives typed docs.
- Inventory answer: inventory.yaml = phoneme_targets (acoustic table, cited) + base_params + duration_models + a symbol-convention block (silence_symbol, symbol_grammar, stress_markers, nucleus_types, normalization_aliases, secondary_stress_fallback). nucleus_types exists because TS built-ins compute syllable role by scanning siblings: rule-engine.ts:159 isNucleus, :722 syllable_role, :603 count_word_vowels, :609 cluster_position_in_word; inventory.ts:457 stress suffix applies to nucleus targets only. #42 (d81d4542) moved these conventions from TS literals into the inventory. The real fix: syllabify.ts already yields onset/nucleus/coda roles; write them as Segment features in createStructure, delete the engine built-ins. #205 is adjacent (nucleus-counting fallback).
- Cross-package data refs (for #74, not #141): dectalk-english/frontend.yaml:7 stress_policy_path → qlatt-english; public/rules/normalization/ shared by all three; laine88 + steinecke95 experiments (added 2026-09-08, extend klatt80-baseline, no frontend) missing from #74 package list; #74 checklist stale (#77, #140 closed).

## Checkpoint 3
- docs/attribute-model.md (added by #218 today) already defines the engine-side target. My three primitives were re-derivations of its decisions 1 and 4 plus the existing scan. Do not re-derive.
- Wrote docs/frontend-document-model.md (proposal, uncommitted): schema as data, function features for the 13 built-ins, resources plus one resolver, refs as declared FKs, one overlay operator, english language package, closed compiler vocabulary, core partition with residue table. #141 becomes decision 3 only.
- Issue edits to #141 and #74 were drafted and rejected by Q; drafts in scratchpad. Holding.

## Checkpoint 4 (spans)
- Four coordinate systems shared the word span: document span (YAML position; did not exist), source span (#142, UTF-16 offsets), anchor (Direction Track), interval (temporal axis, #164). Added decision 9 to docs/frontend-document-model.md with the naming table.
- Renamed in docs/attribute-model.md decision 8 and sequencing: span -> document span.
- Issue edits posted: #164 (span -> interval, naming note), #156 (stage direction = Direction Track span, an anchored overlay).
- Filed #224: document spans via the yaml package parseDocument + LineCounter, side index keyed by role and key path, survives extends/include/macro expansion, validator errors and explain print path:line:col, digests unchanged, js-yaml removed after golden parity.
- Still holding: #141 regroom (now decision 3 of the document model only) and #74 checklist fix; both drafts in scratchpad are superseded by the document model.

## Checkpoint 5 (parser)
- parser.ts 507 lines: helpers ~50, for_each_field ~70 (3 rulepack files), foreach ~90 (1 file; superset of for_each_field), DSL_ROOT_KEYS 28 keys with silent pass-through of unknown keys, normalizeX ~200 (lenient coercion to ""/[]/null/false), parseDslSpec ~100.
- normalizeCitationEntry flattens objects/arrays/numbers; 1,244 citation entries in rulepacks, zero non-string: dead leniency. `citation:` singular alias used by 1 file. skip_dictionary/input_contract: zero rulepack uses. streams: legacy error only.
- Engine reads neither rule.kind nor rule.op; 224 rules declare kind (scalar 120, structural 36, postlexical 25, point 24, f0_layer 19); dispatch is duck-typed on effect keys (plan 4.6).
- CompiledRulepack = Readonly<NormalizedDslSpec>: no checked form exists; attribute-model decision 9 compile step not started.
- validation.ts 3,936 lines, 50 functions, 308 diagnostic sites; validateRules 2013-2991 (~980 lines), validateLoweringSpec 3224-3637; imports struct-schema combinators (165 lines) already.
- No open issues cover: parser/validator shrink, schema-as-data, function features for built-ins, foreach unification, kind dispatch, overlay operator, core vocabulary check, english package. #224 filed. #167 adjacent (variety bundle layout).

## Checkpoint 6 (language package)
- Wrote docs/language-package.md: roles (orthography, phonology, lexicon, morphology, lts, lexical_prosody, phrasing, intonation, CEL declarations, phases), each present-or-declared-absent with a cited kernel choice; designed against en/cmn/tlh; BCP 47 ids; varieties as subtag overlays.
- Silently-English core found: transcribe-text.ts:341 split(" "); parse.ts:228 second tokenizer split(/\s+/) + PHRASE_BOUNDARY regex; direction-track.ts AnchorRange indexes whitespace words; metrical-stress.ts operations english_stress_rule, strong_retraction, arab_destressing; lts-engine A-Z uppercase (#209); morphology strip-and-retry; inventory stress-suffix-only.
- Language-neutral already: tone-association.ts (Goldsmith), syllabify.ts (table-driven), lts-engine rule format, fold/scan.
- Decision 6 in frontend-document-model.md now points at the language doc. Still uncommitted: three docs, notes, scripts/compare-language-layers.mjs.

## Checkpoint 7 (rate clamp removed)
- Q: "why do we ever clamp it, ever? don't do that." Removed Math.max(0.5, Math.min(2, ...)) at tts-frontend.ts:695; requested rate must be finite > 0 else E_RATE_INVALID; reference normalization kept.
- formant.yaml vowel_rate_undershoot: interpolation weight bounded at 1 via define weight: min([factor, 1.0]), cited Moon & Lindblom 1994 (asymptotic approach); at rate 1 the rule does not fire, so goldens unaffected.
- New test/rate-unclamped.test.ts (5 tests pass): monotone durations 0.25..8, 4x < 2x, dectalk 4x < 2x, formants stay inside base/schwa hull at 8x, invalid rates throw, default untouched.
- Targeted suites pass (199 tests). test:golden ran (maxDelta 9.9e-6 vs reference; verdict/exit pending). Full npm test running in background (task bbxl9slfu).
- Uncommitted on master: src/tts-frontend.ts, formant.yaml, new test, three docs, notes, scripts/compare-language-layers.mjs. Not committing unless asked.

## Checkpoint 8 (committed)
- Main checkout was switched to nvda-speak-server by another session (b48d2ce7, d153d2e4). Moved my seven files to a new worktree C:/Users/Q/code/Qlatt-master on master (node_modules and target junctioned to the main tree).
- Committed on master, not pushed: 21eb3a31 (rate clamp removed, undershoot bound, test) and 69b8c0c6 (document model, language package, attribute-model rename, compare script). Main tree restored; only this notes file remains untracked there.
