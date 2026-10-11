## Problem
A sweep of `src/` found a long tail of small hardcoded speech policy that does not justify one issue each. Each item is a literal or a closed vocabulary that belongs in YAML with a citation or an explicit engineering-estimate label. Check items off as they land; split any that grow.

## Checklist
- [ ] `src/formant-bank.ts:407-412`: generated `A{N}` params get a hardcoded `[0, 80]` dB range and `0` default while `F{N}`/`B{N}` read `freqRange`/`bwRange` from the bank. Add `ampRange`/`ampDefault` to `formantSchema` (`:53`), required whenever `parallelSource` is set. Delivery: #202.
- [ ] `src/formant-bank.ts`: "exactly one formant bank" compiler constraint. Audit: #203; implementation disposition remains outstanding.
- [ ] `src/semantics/pfe-codegen.ts`: silent `ndbScale ?? 0` and `sign ?? 1` fallbacks. Delivery: #202.
- [ ] `src/tts-frontend.ts:594` rate clamp `[0.5, 2.0]` uncited; `:681,683` fallback continuation rises of 8 Hz and 5 Hz; `:791,800` `transitionMs = 30`; `:213` skipped param names `dur`, `SW`, `type`; `:589` `rate ?? 1`. Delivery: #204 and existing #160.
- [ ] `src/tts-frontend.ts:384-407`: fallback nucleus-counting syllabifier that always reports role `onset` and position `only`/`medial`; only `dectalk-english/pipeline.yaml:26` declares `syllabification:` tables. Every frontend should declare tables or fail at load. Delivery: #205.
- [ ] `src/declarative-frontend/hrg/rule-engine.ts:878` rounding triggered by the literal field name `duration`; `:898` incompressibility ratio key chosen by a TS test on the type string. Delivery: #206.
- [ ] `src/declarative-frontend/hrg/lowering.ts:32` `MIN_TRANSITION_EDGE_MS = 20` (estimate, documented `:24-31`); `:714-716` `profilePoints` must be exactly three with hardcoded roles; `:1533` `typeKey === "silence"` pause-scale gate. Delivery: #207.
- [ ] `src/input/inline.ts:21-22`: inline markup grammar is two regexes; preset names with digits or hyphens are impossible; `*word*` can only mean `strong` (`:55`); "first global affect wins" at `:30-37`. Declare an `inline_markers:` table. Delivery: #208.
- [ ] `src/g2p/lts-engine.ts:117` alphabet `A-Z` and category names in TS so accented letters become punctuation; `:214` `PROSODIC_MARKERS` rebuilt per call; `:179` space boundary and upper-casing; `:188-191,205-208` unmatched characters silently skipped with no diagnostic. Delivery: #209.
- [ ] `src/analysis/track-metrics.ts:31-35` and `src/track-analysis.ts:293-298,378` disagree on what counts as voiced; `track-metrics.ts:74` hardcodes `phoneme === "SIL"`; `track-analysis.ts:220,324,540-577` (`sw === 1`, `lfMode` universe, warning thresholds). Declare a `metrics:` block naming `voicing_params` and `silence_phoneme`. Delivery: #210.
- [ ] `src/transcribe-text.ts:366` `maxCompoundSpan = 4` with a hand-wave "citation anchor" at `:364-365`; `:382` compound joiners; `:485` bare 50 ms duration for a word with no phonemes; `:95-116` CMUdict-specific variant search order in a function documented as frontend-neutral; `:219` `/` as phonemic delimiter; `:31-39` layer citation strings. Delivery: #211.
- [ ] `src/input/parse.ts:211` `PHRASE_BOUNDARY = /[.,;:!?]/` while `TranscriptionConfig.punctuation_tokens` exists; `:527` `durationScale = 1/rate` vs `src/tts-frontend.ts:767` exponent-based rate law (two rate models); `:408,499,572` and `direction-track.ts:151` `?? 1` intensity defaults; `direction-track.ts:131,180,186` frozen vocab unions (`SpeakerSex`, emphasis levels, ToBI strength) that `policy/break-policy.yaml` and `policy/accent-policy.yaml` already cover; `direction-track.ts:313-324,346-357` uncited composition algebra. Delivery: #212 (design audit; implementation remains outstanding).
- [ ] `src/input/parse.ts:268-269,294,510,535,553` hardcoded citation attribution strings. Delivery: #213.
- [ ] `src/g2p/index.ts:31-38` G2P layer order as control flow. Delivery: #214.

Effort: S each.

## Normalization ownership (#38)
#38 has been split into a CEL/HRG normalization epic with eight child issues. Abbreviations, initialisms and table-matching conventions are included in #149; this issue retains its existing LTS, compound-recovery, inline-input and other residual-policy checklist. No checklist item here is completed by issue filing.

## Split delivery map

Split authorized on 2026-09-08. #202 is the first implementation delivery. This tracker stays open until every residual item is delivered or explicitly resolved with evidence. Issue filing alone completes no checklist item.

#203 and #212 are bounded design audits, not authorization to implement an unresolved bank namespace or rate/input contract. Their closure alone does not complete the corresponding parent item; record adopted decisions and implementation follow-ups here.

| Child | Scope |
| --- | --- |
| #202 | Formant banks: declare amplitude ranges/defaults and reject missing PFE coefficients |
| #203 | Design audit: classify the single-formant-bank compiler constraint |
| #204 | Frontend: declare residual rate defaults, transition overrides and parameter exclusions |
| #205 | Frontend: require syllabification tables and remove the nucleus-counting fallback |
| #206 | HRG scalars: declare rounding and incompressibility fallback policy |
| #207 | HRG lowering: declare profile roles and pause eligibility |
| #208 | Inline input: declare marker syntax, emphasis mapping and affect precedence |
| #209 | LTS: declare input categories, case, boundaries and prosodic markers |
| #210 | Track analysis: share declared voicing, silence and warning policy |
| #211 | Transcription: declare compound recovery and dictionary adapter conventions |
| #212 | Design audit: reconcile Direction Track rate, vocabulary and composition policy |
| #213 | Input provenance: source attribution from owning policy resources |
| #214 | G2P: declare pronunciation layer priority |
| #160 (existing) | Rate/reference diagnostics and required continuation-rise policy |

Current-source audit: the old MIN_TRANSITION_EDGE_MS literal is already represented by lowering.transitions.min_transition_edge_ms; #207 verifies that existing migration and owns the remaining profile/pause policy. #149 is closed; normalization ownership stays with the #38 delivery rather than being duplicated here.
