# Opt-in source recognition

Issue #142 adds `text_recognition` to the existing rulepack include loader and
validator. Production frontends continue to normalize once before transcription.
The opt-in fixture is `test/fixtures/source-recognition/frontend.yaml`; pass its
path as `frontendPath` to `textToKlattTrackDetailed`. `frontendId` and
`frontendPath` are mutually exclusive selectors.

The selected frontend must explicitly supply `normalization.tables_path`,
`normalization.pipeline_path`, and `transcription.punctuation_tokens` (including
through inheritance). Recognition introduces no resource fallback. The fixture
inherits qlatt-english and adds an included recognition component; it is not a
production normalization cutover.

## Declaration and execution

`text_recognition.rules` is an ordered array. Each entry requires `id`, `pattern`,
`flags`, `class`, `captures`, `when`, `speak`, `vocabulary_keys`, and `citations`.
`captures` maps feature names to named regular-expression groups. Patterns use
JavaScript RegExp syntax; explicit flags may contain `i`, `m`, `s`, `u`. The host
owns sticky matching and capture indices. CEL `matches()` is not a capture API.

`when`, `speak`, and `vocabulary_keys` are CEL expressions; existing rulepack
macros expand on those surfaces only. Their context contains `current.text`,
`current.sourceStart`, `current.sourceEnd`, `current.features`, `captures`,
`source.text`, `maps`, and `sets`. Optional unmatched captures are null. `when`
must return a boolean; `speak` a string; `vocabulary_keys` an array of exact
vocabulary keys used by that speaking decision. For example, the time fixture
records `maps.clock_words.12`, `maps.clock_words.30`, and `maps.period_words.pm`.
`text_recognition.unmatched` requires its own `speak`, `vocabulary_keys`, and
`citations`. No case or punctuation cleanup precedes these expressions.

Rules run in declaration order. Each scans left to right against the original
input; accepted spans cannot overlap previously accepted spans. There is no
longest-match selection. Rejection leaves input available to later recognizers
and overlapping candidates of the same recognizer. A greedy match crossing an
accepted span is rejected as a whole, not truncated. Matching preserves original
lookaround and anchor context. Detectable empty matches are load errors;
context-dependent empty matches throw `E_RECOGNITION_EMPTY_MATCH` with the rule
and offset before graph mutation. Runtime result types are checked too.

## Graph and handoff

One `SourceText` Item stores the exact original string, even for empty input.
The ordered `Normalization` relation partitions every nonempty input into
accepted spans and maximal unmatched gaps, including whitespace. Items retain
their original text, source owner, half-open UTF-16 offsets, class, bound
features, rule ID, spoken text, and vocabulary keys. Astral characters occupy
two UTF-16 units. These indices are neither phone/syllable intervals nor time
anchors.

The interim handoff applies the selected existing normalization readers to each
Item's spoken text and records `normalizedText`. It passes words with their
owning Items to `transcribeText` in the same Utterance. Token Items carry
`sourceNormalizationId` and a `source_normalization` association; pronunciation
decisions descend from those tokens. Multiple words from one recognized span
share its owner; repeated recognized spans retain distinct identities.

Typed `text_recognition` decisions record accepted, ineligible, overlapping and
unmatched outcomes, capture text/offsets, rule IDs and vocabulary keys. Existing
feature explanations and journal replay retain the ancestor chain. Opt-in
tokens and word/syllable structure use separate transactions to preserve source
ownership. Segment source-token identity remains unchanged.

The #150 metrical-stress handoff, when present, remains downstream of the same
pronunciation decision. No metrical rules, morphology intervals, secondary-stress
targets or phoneme assignments are changed here. The integration regression
compares opt-in and existing pronunciation output, and checks metrical ancestry
and secondary stress when the selected frontend declares that policy.

Reader vocabulary migration and graph expansion actions belong to later #38
slices. The fixture's small clock vocabulary demonstrates CEL ownership without
claiming a general replacement for existing normalization readers.
