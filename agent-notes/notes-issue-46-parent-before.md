## Problem
A sweep of `src/` found a long tail of small hardcoded speech policy that does not justify one issue each. Each item is a literal or a closed vocabulary that belongs in YAML with a citation or an explicit engineering-estimate label. Check items off as they land; split any that grow.

## Checklist
- [ ] `src/formant-bank.ts:407-412`: generated `A{N}` params get a hardcoded `[0, 80]` dB range and `0` default while `F{N}`/`B{N}` read `freqRange`/`bwRange` from the bank. Add `ampRange`/`ampDefault` to `formantSchema` (`:53`), required whenever `parallelSource` is set.
- [ ] `src/formant-bank.ts:145-155`: "exactly one formant bank" enforced in TS. `src/semantics/pfe-codegen.ts:48-49`: silent `ndbScale ?? 0` and `sign ?? 1` fallbacks.
- [ ] `src/tts-frontend.ts:594` rate clamp `[0.5, 2.0]` uncited; `:681,683` fallback continuation rises of 8 Hz and 5 Hz; `:791,800` `transitionMs = 30`; `:213` skipped param names `dur`, `SW`, `type`; `:589` `rate ?? 1`.
- [ ] `src/tts-frontend.ts:384-407`: fallback nucleus-counting syllabifier that always reports role `onset` and position `only`/`medial`; only `dectalk-english/pipeline.yaml:26` declares `syllabification:` tables. Every frontend should declare tables or fail at load.
- [ ] `src/declarative-frontend/hrg/rule-engine.ts:878` rounding triggered by the literal field name `duration`; `:898` incompressibility ratio key chosen by a TS test on the type string.
- [ ] `src/declarative-frontend/hrg/lowering.ts:32` `MIN_TRANSITION_EDGE_MS = 20` (estimate, documented `:24-31`); `:714-716` `profilePoints` must be exactly three with hardcoded roles; `:1533` `typeKey === "silence"` pause-scale gate.
- [ ] `src/input/inline.ts:21-22`: inline markup grammar is two regexes; preset names with digits or hyphens are impossible; `*word*` can only mean `strong` (`:55`); "first global affect wins" at `:30-37`. Declare an `inline_markers:` table.
- [ ] `src/g2p/lts-engine.ts:117` alphabet `A-Z` and category names in TS so accented letters become punctuation; `:214` `PROSODIC_MARKERS` rebuilt per call; `:179` space boundary and upper-casing; `:188-191,205-208` unmatched characters silently skipped with no diagnostic.
- [ ] `src/analysis/track-metrics.ts:31-35` and `src/track-analysis.ts:293-298,378` disagree on what counts as voiced; `track-metrics.ts:74` hardcodes `phoneme === "SIL"`; `track-analysis.ts:220,324,540-577` (`sw === 1`, `lfMode` universe, warning thresholds). Declare a `metrics:` block naming `voicing_params` and `silence_phoneme`.
- [ ] `src/transcribe-text.ts:366` `maxCompoundSpan = 4` with a hand-wave "citation anchor" at `:364-365`; `:382` compound joiners; `:485` bare 50 ms duration for a word with no phonemes; `:95-116` CMUdict-specific variant search order in a function documented as frontend-neutral; `:219` `/` as phonemic delimiter; `:31-39` layer citation strings.
- [ ] `src/input/parse.ts:211` `PHRASE_BOUNDARY = /[.,;:!?]/` while `TranscriptionConfig.punctuation_tokens` exists; `:527` `durationScale = 1/rate` vs `src/tts-frontend.ts:767` exponent-based rate law (two rate models); `:408,499,572` and `direction-track.ts:151` `?? 1` intensity defaults; `direction-track.ts:131,180,186` frozen vocab unions (`SpeakerSex`, emphasis levels, ToBI strength) that `policy/break-policy.yaml` and `policy/accent-policy.yaml` already cover; `direction-track.ts:313-324,346-357` uncited composition algebra.
- [ ] `src/input/parse.ts:268-269,294,510,535,553` hardcoded citation attribution strings.
- [ ] `src/g2p/index.ts:31-38` G2P layer order as control flow.

Effort: S each.

## Normalization ownership (#38)
#38 has been split into a CEL/HRG normalization epic with eight child issues. Abbreviations, initialisms and table-matching conventions are included in #149; this issue retains its existing LTS, compound-recovery, inline-input and other residual-policy checklist. No checklist item here is completed by issue filing.
