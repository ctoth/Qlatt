## Problem and ownership
Today src/tts-frontend.ts calls normalizeText before transcribeText creates Token Items. Recognition therefore cannot participate in the graph or preserve ancestry through normalization. Own raw-text ingestion/recognition, normalization item schemas, and the handoff seam in src/tts-frontend.ts and src/transcribe-text.ts; use existing parser/validation infrastructure.

## Scope and acceptance
- Introduce source-backed normalization items into the same Utterance used by transcription. Preserve original text and half-open UTF-16 source offsets, including whitespace and unmatched spans; offsets never stand in for temporal anchors.
- Declare recognition patterns and capture-to-feature bindings in rulepack data. A generic recognizer supplies captures and offsets; CEL owns class eligibility and speaking decisions.
- Define deterministic precedence: declared recognition order, left-to-right non-overlapping accepted spans, no implicit longest-match policy. Rejected candidates leave input available to later recognizers. Empty matches are load errors or rejected with a bounded runtime error when static detection is insufficient.
- Preserve punctuation and case until the declared rules consume or normalize them. Demonstrate a multi-token match such as 12:30 pm and overlap between dates, fractions, decimals, currency and bare numbers.
- Resolve required resources from the selected frontend. An opt-in fixture uses this path before production cutover; existing frontends retain one authoritative path each.
- Trace recognized items to source spans with typed recognition decisions. Test unmatched input, Unicode offsets, punctuation, overlap and an invalid declaration.

## Boundaries
No reader vocabulary migration, graph expansion action, phoneme changes, or global tokenizer rewrite. #16 is the completed punctuation-policy baseline. #77 owns repository-wide default removal; this new path introduces none. Recognition is a host operation, not a claim that CEL matches() exposes capture groups.

## Lexical-stress handoff (#37 / #150)
Integrate with the lexical-stress handoff in #150 when that change is present. The expected overlap is localized to `src/tts-frontend.ts`, `src/transcribe-text.ts`, and integration tests; retain the metrical engine, morphology cycles, frontend-resolved CEL stress policy, and secondary-stress realization contract.

- Reuse `transcribeText`'s existing caller-supplied Utterance. Connect recognized/source-backed items to the Token and pronunciation handoff in that same graph.
- Preserve the ancestry chain from source span and recognition decision through normalized Token, pronunciation decision, lexical-stress decisions, and Segment/Syllable construction. Stress decisions already descend from pronunciation decisions; attach the recognition ancestry at that existing boundary. Repeated spellings must retain distinct source-item identities.
- Keep coordinate systems explicit: normalization spans use half-open UTF-16 offsets; morphology uses phone intervals and metrical domains use syllable intervals. Preserve their owners and mappings rather than substituting source offsets for phonological boundaries or temporal anchors.
- Add an opt-in end-to-end fixture covering a multi-token recognized span and Unicode source offsets, and verify source ancestry reaches pronunciation/stress and the resulting segments. Include repeated-word identity and secondary-stress preservation where applicable. Existing dictionary, explicit-pronunciation and clitic precedence remain controls.
- Keep this first slice opt-in. Recognition/handoff work does not require a production stress-policy cutover or changes to stress assignment, phoneme output, or inventory target selection. Any later change to normalized word segmentation or pronunciation behavior must be identified separately and justified under the owning migration issue.

## Ordering and estimate
Depends on: None; first foundation slice.
Effort: M

## Shared contract
Parent: #38. Use the existing rulepack include loader, CEL evaluator/macros, HRG transactions and tooling; no second plugin registry or rule interpreter. Speech vocabulary and decisions belong in included YAML/CEL components. Generic TypeScript may recognize spans, manipulate ordered items, and perform language-independent operations.

Every migrated component must retain source ancestry, emit rule and exact vocabulary-key evidence, validate declarations before execution, and have focused red/green tests plus existing affected frontend regressions. Preserve current qlatt-english and dectalk-english behavior (including DECtalk hundredand); test inherited qlatt-beauty behavior where affected. A behavior correction must be identified explicitly, not hidden in the migration. Component selection must not depend on frontend-name branches.

