# Direction Track policy audit (#212)

This audit records executable behavior at commit `7fe84a77`.
Line references below refer to that revision, before this documentation change.
It adopts the current distinct rate scopes as the compatibility baseline for
future ownership migrations. It introduces no new input or acoustic semantics.
Existing citation strings are reported as authored attribution, not independently
verified claims about the cited papers. Residual implementation remains #46.

## Rate contract and execution order

1. The frontend selects its cited `policy.rate.default` when the API rate is
   omitted. A requested rate must be finite and positive. A supplied
   `duration.rate_reference` must be finite, positive, and cited; absence means
   identity normalization. The initial relative rate is request/reference
   (`src/tts-frontend.ts:800–859`).
2. That normalized value seeds the text parser's rate where a words-per-minute
   unit exists. A leading parser rate command can replace it; scoped commands
   have their own routing. Reference normalization is not applied a second time
   to an already selected command rate (`tts-frontend.ts:872,1214–1236,1283–1289`).
3. With no words-per-minute mapping, the relative rate becomes the generic
   `rate`. It is supplied to duration rules as `policy.duration.rate_scale`.
   Qlatt's `speech_rate_scaling` rule scales each category by `rate^-elasticity`, where
   elasticity is a ratio of logarithms of the declared fast/slow means. Vowels
   have elasticity one. Punctuation pauses use inverse rate
   (`public/rules/frontends/qlatt-english/phases/duration.yaml:443–485`).
4. Generic rate also drives formant undershoot, continuation-rise amplitude,
   and requested transition duration. Those are separate operations, not
   consequences inferred from the resulting segment durations
   (`tts-frontend.ts:1430–1498,1685`).
5. A Direction Track span's positive `rate` becomes `durationScale=1/rate`.
   A nonpositive finite local rate currently produces the neutral scale one;
   this differs from API-rate rejection and must not be silently tightened
   during ownership work (`src/input/parse.ts:677–699`; parsing requires a finite
   number in `src/input/direction-track.ts:459–460`).
6. The parser attaches that delta to an Affect Item. Lowering first composes
   global Affect channels, then selects one local winner per explicitly authored
   field by highest precedence and later declaration order. It composes that
   winner over the global value (`src/declarative-frontend/hrg/lowering.ts:1915–1959`).
7. Final output timing multiplies the already-computed segment duration by the
   resolved `durationScale`, with `pauseScale` additionally applied to the
   selected inventory's silence symbol. It also applies the declared output
   clock ratio (`lowering.ts:1985–2019`). Local rate does not rerun the global
   duration-class, undershoot, or continuation-amplitude policies.

Global and local rates therefore act at distinct scopes. Supplying both can
multiply their duration effects; that alone is not evidence of an accidental
duplicate application. A migration must preserve both, not remove one because
the two input fields share the name `rate`.

## Conditional numeric examples and limits

For Qlatt, assume a vowel has 100 ms immediately before the speech-rate rule,
request=2, reference=1, local span rate=2, neutral global Affect, clock ratio=1,
and no intervening floor/cap changes. The generic rate is 2, vowel elasticity
is 1, and local durationScale is 0.5: `100 * 2^-1 * 0.5 = 25 ms`.
Without that local span, the same conditional calculation gives 50 ms.
With reference=2 instead, generic rate is 1 and the local span alone gives 50 ms.
These are arithmetic examples of the code, not measured phrase predictions.

Other segment categories use their own declared elasticity; pauses take a
separate inverse-rate rule and then applicable Affect pause scaling. Existing
duration floors/caps and initial/final silence policy remain authoritative.
Local timing projection occurs after duration rules, so this example does not
promise that a pre-projection duration floor remains a final-output floor.
Leading/trailing silence uses the global Affect scale, not a word-local winner
(`lowering.ts:1965–1999,2022`).

Qlatt declares undershoot coefficient 0.3, continuation exponent 0.5, and
transition exponent 1 (`qlatt-english/frontend.yaml:209–222`). At generic rate 2,
the raw undershoot product is 0.3, continuation values that actually exist are
multiplied by `2^-0.5`, and a requested 30 ms transition becomes 15 ms before
window limits. The formant rule owns its interpolation cap; the host records
the nonnegative raw factor. Local rate adds timing projection, not another
continuation-amplitude exponent or formant-undershoot evaluation.

DECtalk is a different path: `tts-frontend.ts:1214–1227` maps relative rate to
words per minute and sets generic `rate=1`. Its cited neutral reference is 1
(`dectalk-english/frontend.yaml:1283–1286`). Its duration controller consumes
the mapped rate, so the Qlatt power-law example must not be transplanted into
DECtalk. The declared controller/output frame-period ratio can also alter the
final clock (`lowering.ts:1986–1994`). Existing parser command behavior remains
part of compatibility; the audit does not propose new bounds or conversions.

## Vocabulary and owner map

| Surface | Current owner/behavior | Migration boundary |
|---|---|---|
| Phrase punctuation | `input/parse.ts:231–250` splits whitespace tokens and ends a phrase when a token contains `[.,;:!?]` | Selected transcription declares `punctuation_tokens`; break policy declares terminal/clause symbols. Reuse these owners, preserving token-anchor behavior explicitly. |
| Transcription punctuation | `transcribe-text.ts:346` materializes the selected token set; `inventory.ts:937–946` requires it | A token set is not by itself an equivalent implementation of the Direction Track's substring regex. |
| Emphasis | `direction-track.ts:160–163` declares reduced/none/moderate/strong; `parse.ts:590–609` records an Intonation label | These are authored vocabulary labels, not a proven mapping to accent strength. Accent policy/rules own acoustic selection. |
| Break strength | `direction-track.ts:166–170` declares 0–4 and optional time; `parse.ts:612–632` records a Break request | Existing `policy/break-policy.yaml` owns punctuation break indices. Do not imply that recording a request implements its pause/accent effects. |
| Speaker sex | `direction-track.ts:105,402–406` accepts male/female; affect preset validation checks those variant keys (`affect-presets.ts:91–95`) | Current keys select configured preset variants. They are not a universal voice taxonomy; widening them requires the preset owner and consumers together. |
| ToBI | No full ToBI tone union is declared by these two input files; the break interface calls its index ToBI-style | Actual accent/phrase/boundary tone rules belong to selected frontend annotation/prosody policy. Do not invent an input tone protocol to remove a nonexistent union. |
| Presets and VQ channels | Selected `affect_presets` and `vq_channels`, passed by `tts-frontend.ts:1409–1413` | Preserve required owner citations and existing schema validation rather than add another registry. |
| Version/anchor/relation keys | Version `"1"`, word/phrase/syllable anchor variants, Affect/Intonation/Break routing | These select program operations and data shapes. They are protocol discriminants, unlike configurable preset/channel names. |

Both bundled transcription resources list the familiar punctuation tokens, but
that agreement does not settle substring matching, attached punctuation, or
phrase anchors for a custom frontend. A later migration must state and test
its compatibility behavior; this audit does not change it.

## Intensity, neutral values, and composition

`qlatt-english/policy/vq-channels.yaml:10–25` owns channel algebra, units,
neutral values, backend targets, and existing citations. In particular,
`intensityBoost` is additive dB, neutral zero, projected to `GO`; duration and
pause scales are multiplicative ratios, neutral one. These are not absolute
loudness targets or guarantees about rendered SPL.

`input/vq-channels.ts:39–42` requires finite neutrals equal to the algebra's
identity. `direction-track.ts:295–301` interpolates multiplicative values from
one and additive values from zero for degree; `:325–338` composes by multiplication
or addition. Lowering uses the same selected algebra (`lowering.ts:428–437`).
These operations are engineering composition conventions; the audit does not
attribute the exact software formulas to a paper beyond their authored metadata.

Affect and gesture degree omission currently means one (`parse.ts:501,737`).
The selected affect library owns its degree curve (`affect.ts:145–152`), while
gesture scaling uses the existing unit clamp (`direction-track.ts:297`).
An absent global affect emits no affect directive. The bundled linear curve
maps degree zero to zero and therefore the neutral vector; a custom curve owns
its endpoint outputs (`affect-presets.ts:143–151`). The bundled curve is labeled
an engineering estimate and intentionally has empty citations, unlike the
required channel citations. Explicit zero, omission, and configured defaults
must remain distinguishable at the authored-input boundary.

## Provenance contract

The local affect decision lists the global affect decision as a direct parent
when present, alongside the configured preset application (`parse.ts:525–528`).
Do not replace the direct edge with only a preset ancestor. The preset compiler
receives that global parent as well (`parse.ts:508–512`). HRG attachment depends
on the direction decision before creating/writing the shared Item (`:396–455`).
Rate/pitch/VQ records identify selected channel entries and their citations;
host conversion conventions are separate from configured scientific attribution.
Emphasis, break and voice identity records describe authored requests, not
unverified acoustic effects. Later output timing has its own lowering evidence.

## Bounded implementation follow-ups under #46

1. Preserve the distinct rate contract above. Any future unification is a new
   behavior decision, not a prerequisite for moving ownership into data.
2. Thread selected punctuation policy to convenience tokenization using the
   existing parser options/loader. Before replacing the regex, retain bundled
   phrase anchors and specify custom-symbol behavior; do not add a parser service.
3. Keep algebra/neutral validation with `vq_channels`; keep intensity projection
   in existing lowering/track adapters. Do not duplicate channel tables in core.
4. Migrate vocabulary only with its actual consumer: emphasis/break acoustic
   realization and expanded preset variant keys need explicit semantics, not
   merely wider TypeScript unions. Existing authored-label behavior stays intact.

Focused acceptance fixtures for those later changes should extend `test/input.test.ts`:
the syllable-local rate case (314), overlap precedence (481), configured-channel
attribution (546), and local/global affect ancestry cases (after 692).
Add conditional numeric rate/reference controls alongside existing frontend
rate tests, including DECtalk mapping, pause/floor effects, and explicit zero.
Exercise renamed/custom punctuation with unchanged bundled anchors; distinguish
recording an emphasis/break from actually realizing it. These are requested
future behavior proofs, not a new local CI gate or tests added by this audit.

Closing #212 records this audit and compatibility baseline only. It does not
close #46, implement residual vocabulary migration, or certify paper fidelity.
