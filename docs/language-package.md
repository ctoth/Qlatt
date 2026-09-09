# The language package

Status: proposal, 2026-09-08, for Q's decision. Expands decision 6 of
`docs/frontend-document-model.md`. Companion to `docs/attribute-model.md`.

## The one-sentence version

A language package is the bottom overlay of a frontend: everything that is
true of a language and false of a voice, declared as a fixed set of roles
whose presence selects a cited kernel, so that English, Mandarin, and
Klingon are three instances of one contract and a voice binds to any of
them.

## Why three languages

The contract is designed against the languages that break English
assumptions, then checked against English. Each breaks a different one.

| assumption English lets you keep | broken by | how |
|---|---|---|
| words are whitespace-delimited | Mandarin | no spaces; segmentation is a lexicon problem (Sproat & Shih 1990) |
| lexical prosody is stress | Mandarin | lexical tone on every syllable; tone sandhi is a postlexical rule; intonation is a modulation over tone (Chao 1968, Xu 1999) |
| a lexicon exists | Klingon | no corpus lexicon; pronunciation is fully regular from orthography (Okrand 1985) |
| morphology is affix stripping | Klingon | agglutinative, ordered suffix classes; nine noun suffix types, nine verb suffix types, one verb prefix slot (Okrand 1985 §3, §4) |
| letters are single case-insensitive characters | Klingon | `q` and `Q` are different phonemes; `tlh`, `ng`, `ch`, `gh` are single letters |
| stress needs a metrical grammar | Esperanto | stress is fixed on the penultimate syllable, as it is in most of the world's stress languages; a `fixed` policy, not a metrical one |
| part of speech needs a tagger | Esperanto | the final vowel is the part of speech (`-o` noun, `-a` adjective, `-e` adverb, `-as` present); POS is a morphology output |
| there is one spelling of the script | Esperanto, Vietnamese | Esperanto's x-system and h-system transliterations, Vietnamese VIQR, VNI, and Telex; an orthographic variant is a regular transducer to the canonical script |
| whitespace delimits words | Vietnamese | whitespace delimits syllables; words are multi-syllable and found by lexicon match over syllables. Segmentation has two levels |
| tone is an F0 shape | Vietnamese | the ngã and nặng tones carry glottalization; a tone is an F0 shape plus a phonation type (Pham 2003, Brunelle 2009). Mandarin tone 3 has the same property in a weaker form |
| a variety overlays vowel tables | Vietnamese | northern and southern varieties differ in tone count (six against five) and in initial and final inventories; a variety overlays the phonology role itself |
| a rule in the language is worth having | all five | every kernel must be selectable by declaration, and absent by declaration |

What does not vary: the HRG, the relations, tone association (Goldsmith 1976
was written for tone languages), the fold and scan primitives, lowering,
and the voice and body layers above.

**The rule the five languages share: a language package writes symbols; a
voice writes numbers.** A language declares that a syllable carries tone
`nặng` with phonation `glottalized`, that a word is a noun, that a segment
is a nucleus. A voice declares what `glottalized` does to `Rd` and `DI`,
what a noun's accent is worth in semitones, what a nucleus's F1 is. This is
the same line that splits the inventory into phonological and acoustic
columns, and it is what keeps a Vietnamese tone from reaching into the
glottal source directly: the language writes the phonation symbol, and a
cited voice-level fold rule realizes it.

## The contract

A language package declares these roles. Required means the compiler fails
without it; every other role is present or declared absent, never
defaulted. A role's `kernel:` names a registered, cited algorithm; its
tables are the package's data.

| role | required | declares | kernels |
|---|---|---|---|
| `orthography` | yes | script, case policy, multigraph letters, orthographic variants, two-level segmentation, punctuation classes with break strength, letter names, number and date components | `variants: transducer`; `units: whitespace \| codepoint`; `words: identity \| lexicon_longest_match` |
| `phonology` | yes | phoneme class table (symbols, `type`, binary features), symbol grammar, suffix markers and the feature they write, nucleus types, syllabification tables, phonotactics | `syllabify: maximal_onset \| initial_final` |
| `lexicon` | no | columns (word, pronunciation, and any of POS, tone, frequency), lookup order as `first_defined` | `lookup: exact \| longest_prefix` |
| `morphology` | no | slot grammar: ordered affix classes, stem finding, morpheme segmentation, what each affix contributes to pronunciation, prosody, and part of speech | `slots`; morpheme segmentation reuses `lexicon_longest_match` |
| `lts` | no | Elovitz rule table | `elovitz` |
| `lexical_prosody` | yes | `stress: metrical(policy) \| fixed(position) \| none`; `tone: lexical(inventory, sandhi) \| none`, where a tone entry is an F0 shape plus a phonation symbol | `metrical` (Hayes 1995 parametric), `fixed`, tone via Goldsmith association plus postlexical rules |
| `phrasing` | yes | boundary predicates, function words or particles, punctuation to break index; may read POS from morphology or from #65 | none; predicates and string sets |
| `intonation` | yes | intonational tone inventory and association rules; how intonation composes with lexical tone | tone association; composition is a declared fold in log-F0 |
| `predicates`, `string_sets`, `maps`, `functions` | no | language-level CEL declarations | none |
| `phases` | yes | the language-level rule phases: normalize, postlexical, structural, annotation, duration structure | the rule engine |

How the five instances fill the roles:

| role | English `en` | Mandarin `cmn` | Klingon `tlh` | Esperanto `eo` | Vietnamese `vi` |
|---|---|---|---|---|---|
| orthography | whitespace units, identity words, case-insensitive | codepoint units, lexicon words, Han punctuation | whitespace, identity, case-sensitive, four multigraphs | whitespace, identity; x-system and h-system variants | whitespace units are syllables, lexicon words; VIQR, VNI, Telex variants; diacritic stacking |
| phonology | ARPABET, digit suffix writes `stress` | initial and final, digit suffix writes `tone` | CVC, restricted clusters, no suffix | five vowels, regular, no suffix | (C)(w)V(C) plus tone, unreleased final stops |
| lexicon | CMU, exact | words with tone; drives segmentation | absent | absent; compounds by morpheme segmentation | words over syllables; drives segmentation |
| morphology | one class each side | reduplication, a few suffixes | one prefix slot, nine suffix types per POS | productive affixes, compounding, POS from final vowel | none |
| lts | 329 rules | absent; polyphones by CEL over POS | a few dozen rules | a few dozen rules | rules over diacritics; regional variants overlay |
| lexical prosody | metrical, Hayes 1982 | tone, four plus neutral, third-tone sandhi | metrical, stem-anchored | `fixed(penultimate)` | tone, six, each with phonation; no stress |
| phrasing | 170 function words | particles | conjunctions | `la`, `kaj`, `de`, correlatives; POS from morphology | particles, classifiers |
| intonation | ToBI-style | phrase curve over tone, Xu 1999 | borrowed | borrowed | phrase curve over tone |

The package id is a BCP 47 tag: `en`, `cmn`, `tlh`, `eo`, `vi`. A variety
(#172) is a subtag overlay on its language: `en-US`, `en-GB-scotland`,
`vi-VN-north`. A voice declares `language: en-US` and binds to the resolved
stack. This makes #172's "regional accent as a policy layer" the general
case rather than a special mechanism, and Vietnamese shows a variety may
overlay the phonology role, not only vowel tables.

## What is silently English in core today

Each of these is a place where a Mandarin or Klingon package would fail
without a code change. They are the language-role equivalents of the
residue table in the document model.

| assumption | file | fix |
|---|---|---|
| words split on a space | `src/transcribe-text.ts:341` `text.split(" ")`; `src/input/parse.ts:228` a second tokenizer, `split(/\s+/)`, for the score | two-level segmentation from `orthography`; Direction Track anchors index Token items from recognition (#142), not a whitespace word list |
| a language cannot write voice quality | `src/input/vq-channels.ts` is the only writer path to `Rd`, `DI`, `AH` | a language writes a `phonation` symbol on the syllable; a cited voice-level fold rule realizes it |
| stress is a number written by a metrical engine or a lexicon | `src/g2p/stress.ts`, `metrical-stress.ts` | `lexical_prosody.stress: fixed(position)` is a third path and the most common one |
| Direction Track anchor units are whitespace words | `src/input/direction-track.ts:139-160` `AnchorRange` | anchor by Token, Word, Syllable item index |
| LTS input alphabet is `A-Z`, uppercased | `src/g2p/lts-engine.ts` (#209) | letter alphabet and case policy from `orthography` |
| metrical operations are named after English rules | `src/g2p/metrical-stress.ts` implements `english_stress_rule`, `strong_retraction` as operations | the kernel exposes Hayes 1995 parameters (quantity sensitivity, foot type, direction, extrametricality, end rule); the English policy composes them; a Klingon policy anchors the foot to the stem |
| morphology is strip and retry | `src/g2p/morphology.ts` | slot grammar kernel; the English table is the one-slot case |
| CMU-specific candidate ordering and compound span | `src/transcribe-text.ts` (#211) | lexicon `lookup` and `first_defined` declarations |
| stress suffix digits are the only suffix convention | `src/declarative-frontend/inventory.ts:427-500` | `phonology.suffix_markers` names the feature it writes; `tone` is the second instance |
| syllabification is one algorithm | `src/declarative-frontend/syllabify.ts` | kernel choice; `initial_final` for Mandarin is a table lookup |

Tone association needs no change: `hrg/tone-association.ts` is Goldsmith
association with no language policy, and lexical tone is the case it was
invented for.

## The voice seam, restated for three languages

A voice declares, over its language: acoustic columns per phoneme class
entry, speaker profile, source contour, VQ channels, affect presets, F0
register, and every `params.policy` value its language's rules read. For a
Mandarin voice the acoustic columns are keyed by the same initial and final
symbols the language declares; tone shapes are language, tone register and
range are voice. For a Klingon voice there is no lexicon to bind, so the
voice is almost entirely acoustic. English is the case where the voice
carries the most policy values, because its rules read the most.

## Not being built, and why

- **Statistical segmentation, POS tagging, or polyphone models in core.**
  Segmentation is longest-match over the declared lexicon (Sproat & Shih
  1990 describe the statistical refinement; the deterministic base is what
  a cited rule can explain). Polyphones resolve by CEL rules over POS and
  context (the TTBL paper in `papers/` is the template-shaped version). #65
  owns POS tagging for English and its output is a Word feature any
  language's rules can read.
- **A universal phoneme alphabet.** Each language declares its own symbol
  grammar. Cross-language phoneme identity is a voice-level mapping problem
  and is not on any roadmap.
- **Unicode normalization policy beyond NFC.** `orthography` declares the
  script; the loader normalizes to NFC and stops.
- **A Klingon voice.** The Klingon package exists to prove the contract has
  no lexicon dependency and no single-case single-character letter
  assumption. Whether anyone records or tunes a voice for it is a separate
  decision. It is small: Okrand 1985 fits the whole phonology and stress
  policy in six pages.

## Sequencing

The test languages form a ladder. Each adds one kernel the previous did not
need, and each has an eSpeak NG language file to check tables against.

1. `orthography` units and words kernels with `whitespace` and `identity`
   as the only choices; delete the second tokenizer; anchors index Token
   items. Byte-identical goldens. (removes the deepest English assumption
   first)
2. `phonology.suffix_markers` names its feature; `stress` is the English
   instance.
3. `lexical_prosody.stress: fixed(position)`; metrical kernel exposes
   Hayes 1995 parameters; English policy re-declared over them; goldens
   byte-identical.
4. Morphology as a slot grammar with POS output; English table migrated.
5. `en` package extracted from `qlatt-english` per document model decision
   6, with `scripts/compare-language-layers.mjs` sizing the split.
6. `eo` as the first contract test: regular LTS, fixed stress, POS from
   morphology, morpheme segmentation, no lexicon, orthographic variants.
   Nothing case-sensitive, nothing tonal. Renders through an English
   voice's acoustics as a smoke test only.
7. `tlh`: adds case-sensitive multigraph letters, slot morphology with
   nine suffix types, stem-anchored stress.
8. `vi`: adds two-level segmentation, tone with phonation, diacritic
   variants, a variety that overlays phonology. Needs a Vietnamese
   inventory and the phonation fold in a voice.
9. `cmn`: adds codepoint segmentation, tone sandhi as postlexical rules,
   polyphones by CEL over POS.

## Citations

| topic | source | in `papers/` |
|---|---|---|
| language-independent engine, language-specific data | Sproat 1998, Multilingual Text-to-Speech Synthesis: The Bell Labs Approach | retrieve |
| segmentation | Sproat & Shih 1990, A statistical method for finding word boundaries in Chinese text | retrieve |
| tone letters, tone and intonation | Chao 1930 (tone letters); Chao 1968, A Grammar of Spoken Chinese | retrieve |
| tone and intonation composition | Xu 1999, Effects of tone and focus on the formation and alignment of F0 contours | retrieve |
| tone sandhi | Chen 2000, Tone Sandhi: Patterns across Chinese Dialects | retrieve |
| polyphones | TTBL Mandarin polyphone paper | yes |
| tonogenesis, consonant F0 perturbation across tone and non-tone languages | Hombert, Ohala & Ewan 1979 | yes |
| autosegmental association | Goldsmith 1976 | yes |
| parametric metrical theory | Hayes 1995, Metrical Stress Theory: Principles and Case Studies | retrieve |
| English stress | Hayes 1982 | yes |
| Klingon phonology, stress, morphology | Okrand 1985, The Klingon Dictionary, §1 and §3–4 | retrieve |
| Esperanto phonology, fixed stress, word-class morphology | Kalocsay & Waringhien 1985, Plena Analiza Gramatiko; Wennergren 2005, Plena Manlibro de Esperanta Gramatiko | retrieve |
| Vietnamese phonology and syllable structure | Kirby 2011, Vietnamese (Hanoi Vietnamese), JIPA illustration | retrieve |
| Vietnamese tone as F0 plus phonation | Pham 2003, Vietnamese Tone: A New Analysis; Brunelle 2009, Tone perception in Northern and Southern Vietnamese | retrieve |
| Vietnamese final consonants and glottalization | Michaud 2004, Final consonants and glottalization: new perspectives from Hanoi Vietnamese | retrieve |
| fixed stress typology | Hyman 1977, On the nature of linguistic stress; Goedemans & van der Hulst 2013, WALS fixed stress locations | retrieve |
| language files as data | eSpeak NG `dictsource` and `phsource` layout; Black & Lenzo 2003, Building Synthetic Voices | retrieve |
