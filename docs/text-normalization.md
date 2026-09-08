# Graph text normalization

The frontend recognizes original source spans, executes included CEL rules on
normalization Items, and hands terminal words to transcription in the same
Utterance. `normalizeGraphText(text, compiledSpec)` projects this path to a string;
`normalizeText(text, frontendId)` remains the bundled-frontend entry point.
The old G2P number-reader helpers and imperative dispatcher have been removed.

`public/rules/normalization/components.yaml` composes the shared components.
Each frontend selects its recognition conventions in `normalization-policy.yaml`.
An alternative frontend can include or replace individual components, vocabulary
maps and recognition declarations. No frontend-name branches select speech rules
in the host.

| Original #38 category | Component and behavior |
|---|---|
| Cardinals / ordinals | `numbers.yaml`: requests carry value, hundred convention and suffix; bounded million/thousand/unit groups cover 0..999999999, then group and terminal phases complete the reading. |
| Currency | `currency.yaml`: unit words, precision, padding and joiner compose cardinal requests. |
| Time | `time.yaml`: 12/24-hour choice, padding, round minutes and period forms compose cardinal requests. |
| Year / date | `date.yaml`: bare-year recognition is distinct from requested year reading; date order and cardinal/ordinal day and year kinds are declared. |
| Decimal / fraction | `decimal-fraction.yaml`: digits retain fractional zeros; numerator and denominator compose cardinal/ordinal requests with irregular forms and plural suffixes. |
| Abbreviations / initialisms | `lexical.yaml` and `recognition.yaml`: literal-key matching, explicit boundary/case rules and declared splitting. |
| Quotes / punctuation / whitespace | `lexical.yaml`: CEL transformations use the selected transcription punctuation inventory. |

Vocabulary lookups use `vocabulary(table, key)`, which records actual accesses
with loader-derived resource identity. Rule writes and source associations link
that evidence to terminal Tokens, pronunciation and lexical stress. Table-free
operations cite their rule rather than fabricating a table entry. Existing
journal replay and explanation tools operate on the same graph.

## Compatibility evidence

`test/fixtures/normalization-baseline.json` was captured from the legacy dispatcher
at base commit `2ec12406`, before cutover, for all three bundled frontends.
The corpus includes punctuation, mixed case, dotted initialisms, nested readers,
invalid dates/times, leading zeros, fractions and unsupported cardinals. The
capture script must be run on that base when reproducing the legacy evidence.

Preserved behavior includes DECtalk `hundredand` for bare non-round hundreds,
ordinary `hundred` in composed money/date/decimal/fraction readings, cardinal date
years, DECtalk half/halves and fourths, and its bare-year eligibility exclusions
for 2000/2005. Historical ordinal suffix behavior is retained: `1001st` reads
`one thousand oneth`, and inline `0th` reads `zeroth`.

The legacy currency regex chooses a short leading alternative for ungrouped long
amounts. Its suffix is retained explicitly: `$1234` reads
`one hundred twenty three dollars4`. Dotted meridiem can be consumed by the earlier
initialism rule; that ordering is also retained. Correcting these behaviors is a
separate semantic change, not an undocumented consequence of this migration.

Synthetic tests select pound/euro units, three-digit minor precision, 24-hour
time, alternate date order and vocabulary using data. This demonstrates component
composition, not universal locale or calendar support. Recognition patterns and
eligibility must be changed along with a newly selected input convention.

Legacy dispatcher-shape tests from #14/#15 are superseded by
`normalization-validation.test.ts`, source-recognition validation and expansion
atomicity tests. The #16 single-punctuation-inventory and apostrophe regressions
remain. Shared G2P resource-selection coverage now selects a compiled rulepack
instead of normalization table/pipeline paths. No umbrella issue other than #38
is closed by this work.
