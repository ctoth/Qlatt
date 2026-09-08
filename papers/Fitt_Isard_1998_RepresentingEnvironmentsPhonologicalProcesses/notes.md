---
title: "Representing the Environments for Phonological Processes in an Accent-Independent Lexicon for Synthesis of English"
authors: "Susan Fitt, Steve Isard"
year: 1998
venue: "ICSLP 98 (5th International Conference on Spoken Language Processing), Sydney, Australia"
doi_url: "https://doi.org/10.21437/ICSLP.1998-8"
pages: "4 (unpaginated in source)"
---

# Representing the Environments for Phonological Processes in an Accent-Independent Lexicon for Synthesis of English

## One-Sentence Summary
A theoretical/methodological discussion paper (not a rule-formalism specification) that works through where to draw the line between what an accent-independent keyword lexicon should encode lexically (as keysymbols) versus what should be derived by accent-dependent post-lexical rule, covering vowel reduction, accent-specific allophones (flapping, glottalization), style/speaking-rate variation, cross-word phenomena, stress, and syllabification, and proposing three candidate architectures for representing the derivation step without settling on one formal rule syntax. *(p.1)*

## Problem Addressed
Even once a keyword system is adopted for lexical transcription (per the companion Eurospeech 1999 paper / Wells 1982), there remain unresolved theoretical and methodological problems in deciding what to encode in the lexicon versus what to derive by accent-dependent rule, if the goal is high-accuracy synthesis and recognition of many accents. *(p.1)*

## Key Contributions
- Explicit statement of the central design question: "At some point we need to draw the line between what we include in the lexicon and what we derive by rule, and to decide what, if anything, should be handled by exception lists." *(p.1)*
- A worked catalogue of phenomena that stress this line: phonemic-vs-allophonic borderline cases (Scottish long vowels, "leak"/"leek"), full-vs-reduced vowel alternants (Leeds/Cardiff full vowels), accent-specific allophonic processes (US flapping, British t-glottaling with accent-varying scope), style/speaking-rate variation, cross-word phenomena (word-final /r/ realization depending on following segment), and stress/syllabification variation across accents (American vs British 'secondary', Canadian vs Southern American 'bicycle' syllabification). *(p.1-4)*
- Three named architectural options for representing phonological-process derivation, compared but not adjudicated. *(p.3, Section 3.1 list)*
- A worked example of numeric keysymbol subdivision for full/reduced vowel alternation (the `E0`/`E1`/`E2` scheme). *(p.2)*

## Methodology
This is a discursive/argumentative paper, not an empirical study: it works through a series of concrete English pronunciation examples (mostly cross-accent minimal or near-minimal pairs) to motivate and stress-test the lexicon-vs-rule division question, referencing the authors' own prior keyword-lexicon work [2] (the companion architecture paper — later published as Fitt & Isard 1999, Eurospeech, "Synthesis of Regional English Using a Keyword Lexicon") and related literature on regional English variation.

## Key Equations / Statistical Models
None — no formal rule language, equations, or statistical models are presented. The paper is explicit that it discusses the *problems* to be solved by such a formalism, not the formalism itself, and repeatedly defers the actual encoding mechanics to companion/earlier work (its own reference [2], and Williams & Isard 1997 [2 in the *other* Fitt 1999 ICPhS paper's numbering] "A keyvowel approach to the synthesis of regional accents of English," Eurospeech 97).

## Parameters

| Name | Symbol | Units | Default | Range | Page | Notes |
|------|--------|-------|---------|-------|------|-------|
| Funding grant | — | — | EPSRC GR/L53250 | — | p.4 | UK Engineering and Physical Sciences Research Council, same grant as the companion 1999 Eurospeech paper |

## Effect Sizes / Key Quantitative Results
None — no empirical evaluation in this paper.

## Methods & Implementation Details

### Reproduced worked examples verbatim

**Key-vowel/key-consonant basic idea (Section 1.1, p.1):** Rather than saying 'pool' contains phoneme /uː/ in RP and /ʉː/ in Scottish accents, the keyword system says the word contains the GOOSE vowel; the symbol `uu` describes the GOOSE vowel and is realised differently per accent.

**Additional non-Wells consonants (p.1):** `/ɬ/` (Welsh, e.g. 'Llewelyn') and `/x/` (Scotland/Ireland, e.g. 'loch') are only used in limited geographical areas, mainly for local words/names; their pronunciation is to some extent predictable from spelling and other-accent pronunciation, but in a keyword system it is simpler to encode them as key-consonants directly rather than derive by rule.

**Inclusion-in-lexicon vs. derivation heuristic (Section 1.2, p.1):** proposed starting heuristic — all *phonological* variation (e.g. /ɬ/ vs /l/ in Welsh) should be included in the lexicon, while all *phonetic/allophonic* variation (e.g. dark vs light /l/ in different accents) should be handled by accent-specific rules; alternations occurring in only one or two words could be treated as exceptions.

**Morphological environment needed for allophony (Section 2.1, p.2):** 'mood' `m * uu d` (monomorphemic) vs 'mooed' `m * uu + d` (bimorphemic, `+` = morpheme boundary) — the long/short Scottish vowel realization is conditioned by this morpheme boundary even though both words are monosyllabic and phonetically near-minimal-pairs.

**Full/reduced vowel numeric keysymbol scheme (Section 2.2, p.2):**
```
Word       Keyword symbols
entreat    E1 n . t r * ii t
endless    * E0 n d . l E2 s
```
Numbers combined with basic key-vowels encode full-vs-reduced variation while keeping the lexicon readable; the scheme aims for equivalent numbers to indicate equivalent processes across words — proposed convention: `0` = always an unreduced vowel; `1`/`2`/`3` = reduced vowels in different accents; `4` = a vowel deleted/deletable in certain accents (e.g. in 'secretary'). Motivating cross-accent data: Leeds English has full vowels in certain prefixes (e.g. 'entreat', 'envisage' with /ɛn/ not /in/); Cardiff English has full vowels in final closed syllables (e.g. 'endless' as /ɛnd.lɛs/ rather than /ɛnd.ləs/ or /ɛnd.lɪs/); in RP the pronunciation with the fully reduced vowel does not occur.

**Glottal-stop scope varies by accent (Section 3.1, p.2):** 'hot' → [hɒʔ] (many British accents, word-final post-vocalic); Cockney also glottalizes word-medially before an unstressed vowel (e.g. 'hotter'); Edinburgh may additionally glottalize before a *stressed* vowel.

**Three candidate architectures for deriving phonological output (Section 3.1, p.2-3), verbatim as listed:**
> i. Use of keyword symbols in the base lexicon to represent the different realisations of /t/. However, use of keyword symbols to represent allophones is inefficient, and this option is unrealistic for processes such as glottalisation of /t/, since different accents do this in different environments. Recording all the potential outcomes with different symbols in the lexicon unnecessarily increases its complexity, and includes information which is easily stated by rule, given appropriate keyword symbols, stress and syllabification.
> ii. Use of keyword symbols for representation of the basic phonemes in the lexicon, with output phones chosen by the synthesiser. This alternative increases complexity in the synthesiser itself, since the synthesiser must now contain phonological rules for the different accents.
> iii. Use of a meta-lexicon representing the phonemes, and compiled sub-lexica containing the output phones to be used. This option uses the same phonological rules as the second, but introduces an intermediate level of description; this may be advantageous for some applications.

No option is selected as final; the paper notes that regardless of which option is used, concatenative-synthesis word-set design for recording new accents must account for allophonic variation — recording only Wells's basic keyword+key-consonant set is insufficient; the full set of accent allophones must be included, and where these are morphologically conditioned (as in Scottish long vowels), the allophones do not automatically fall out from simply producing all possible segment combinations. *(p.3)*

**Optional (non-phonemic) vowel reduction examples, RP (Section 3.2, p.3):**
```
Word       Phone string
autocrat   ['ɔ.tə.kɹat] or ['ɔ.toʊ.kɹat]
ovation    [əʊ'veɪ.ʃn] or [ə'veɪ.ʃn]
```
Distinguished conceptually from the reduced-vowel-as-phoneme case in Section 2.2; writing rules for especially careful (unreduced) pronunciation from a reduced base form is judged harder than the reverse, and the authors would not want a naturalistic lexicon to record only full forms.

**Cross-word /r/-realization rule sketch (Section 3.3, p.3):** Following Williams & Isard [2, i.e. the 1997 Eurospeech companion], a specific symbol `rr` denotes rhotic /r/ in words like 'card' or 'car'. For non-rhotic accents like RP, `rr` converts automatically to a null phone when followed by a consonant (as in 'card'), but for a word ending 'car', the correct realization (null phone or [ɹ]) depends on whether the *following word* begins with a vowel, a consonant, or a pause — information that cannot be contained in accent-specific single-word sub-lexica, so some phonological rules must live in the synthesizer or recognizer itself, not purely in per-accent lexicon derivation. This is presented as evidence that the sub-lexica architecture (option iii above) cannot be fully self-contained.

**Stress-pattern accent divergence examples (Section 5.1, p.4):**
- 'ballet': British /ˈbæ.leɪ/ vs American /bæˈleɪ/ — treated as essentially random/word-specific.
- 'mutate', 'frustrate' and similar: systematic pattern, primary stress on first syllable in American English, second syllable in British English.
- 'secondary' — four syllables in American English, three in British English:
```
Accent              Phoneme string
American English:   /ˈsɛ.kən‚dɛ.ɹi/
British English:    /ˈsɛ.kən.dɹi/
```
A simple four-syllable British transcription /ˈsɛ.kən.də.ɹi/ is noted as producible but judged "rather stilted" and not ideal for naturalistic synthesis, illustrating that a naive shared-syllable-count encoding is unsatisfactory.

**Syllabification variation example, 'bicycle' (Section 5.2, p.4):** Following Wells [3, Vol. 3 p. 537]: Canadian English requires the /s/ to belong with the first syllable (closed syllable needed for raising to occur); Southern American English requires it with the second syllable (a diphthong occurs in a closed syllable, a monophthong in an open syllable) — inferred from allophonic behavior, not given directly.
```
Accent                      Phone string
Canadian English:           ['bəɪs.ɪ.kl]
Southern American English:  ['ba.sɪ.kl]
```
The paper leaves open how widespread such syllabification splits are; if rare, treat as accent-specific exceptions and treat as a per-accent lexicon setting only if more prevalent cases turn up.

**'Tomato' as an irreducible lexical exception (Section 4, p.3):** RP /təˈmɑ.təʊ/ vs General American /təˈmeɪ.toʊ/ — the /ɑ/-/eɪ/ pairing is claimed to occur *only* in this one word, so it is not judged profitable to set up a dedicated keyword vowel for it; it is handled instead as a lexical exception in either British or American form. The paper notes that if every such exception were given its own key-vowel, lexicon complexity (and per-accent-synthesis recording burden, since new key-vowels mean more words to record) would increase substantially.

## Figures of Interest
No numbered figures; two small inline worked-example tables (the `E0`/`E1`/`E2` reduction table and the `secondary`/`bicycle` accent-comparison phone-string tables, reproduced verbatim above) function as the paper's only tabular content.

## Results Summary
No empirical results — this is a conceptual/methodological paper. Its "conclusions" (Section 6, p.4) are: (1) phonemic variation within accents should be encoded in the lexicon via keyword symbols, while allophonic differences should be derived by rule; (2) morphological information needs to be included in the lexicon because it forms the environment for some allophonic processes; (3) phonemic-vs-allophonic status is sometimes genuinely ambiguous and must occasionally be resolved on practical rather than theoretical grounds; (4) including style/speaking-rate variation increases lexicon complexity and current linguistic knowledge of these processes across accents is limited; (5) even with keyword synthesis, exception lists cannot be entirely avoided; (6) despite these reservations, the authors remain hopeful much regional variation can be captured by keyword lexica.

## Limitations
- No comprehensive study exists of pronunciation variants across styles/speaking-rates for even one accent, let alone the many accents a keyword dictionary aims to cover — practical difficulty that pushes the authors toward including only "well-attested phenomena" (e.g. glottalization, flapping) in an initial rule set. *(p.3)*
- Determining phonemic vs. allophonic status is not always theoretically clean (e.g. Scottish long vowels, 'leak'/'leek' minimal pairs for some speakers, disagreement among speakers about which words show the length distinction). *(p.2)*
- If accent-specific rules are to include full detail of speaking-style/rate variation, lexicon and rule-set complexity grows substantially, and current linguistic understanding of these phenomena per-accent is described as "somewhat limited." *(p.4)*
- Even in a well-designed keyword system, exception lists (e.g. 'tomato') remain unavoidable. *(p.3-4)*

## Arguments Against Prior Work
- Conversion-rule approaches to semi-automatic generation of regional lexica from a standard accent [1] still require hand-checking, and the conversion rules must be rewritten for every new accent — motivating the keyword approach instead. *(p.1)*
- Recording every possible allophonic outcome as a separate keysymbol in the lexicon (candidate option i) is criticized as inefficient, unrealistic for accent-varying processes like glottalization, and needlessly increases lexicon complexity by including information that is "easily stated by rule" given appropriate keysymbols, stress, and syllabification. *(p.2-3)*
- Choosing to represent basic phonemes with output phones entirely chosen by the synthesizer (candidate option ii) is criticized for pushing phonological-rule complexity into the synthesizer itself, which must then contain per-accent rule sets. *(p.3)*

## Design Rationale
- The paper's central design rationale is the phonemic/lexical vs. allophonic/rule-derived split, motivated by the traditional phonological distinction between the two, applied pragmatically rather than dogmatically (practical grounds override theory when the two are in tension). *(p.1, p.4)*
- Numeric subdivision of key-vowels (the `E0`/`E1`/`E2` scheme) is deliberately designed so that the *same* number consistently marks the *same kind* of process across different key-vowel families (e.g. `0` always unreduced, `4` always deletable-in-certain-accents) — a systematic rather than ad hoc numbering convention, intended to keep the lexicon "fairly readable" despite the added complexity. *(p.2)*
- The authors explicitly favor starting a rule set with only "well-attested" phenomena (glottalization, flapping) rather than attempting comprehensive coverage of speaking-style variation, given the current gaps in descriptive linguistic knowledge. *(p.3)*
- Morphological (and other) information is deliberately included in the dictionary beyond what's strictly needed for the base pronunciation, specifically to "facilitate rule-development at a later stage" — i.e., the lexicon is designed to be forward-compatible with richer future rule sets. *(p.3)*

## Testable Properties
- Post-lexical rules must have access to word-boundary/following-word information (not just single-word sub-lexica) to correctly resolve word-final non-rhotic /r/ realization (RE: 'car' vs 'card') — this property rules out a purely per-word sub-lexicon architecture as fully sufficient. *(p.3)*
- Concatenative-synthesis diphone/word-list recording for a new accent must include the accent's full allophone inventory (not just Wells's base keyword+key-consonant symbols), because morphologically-conditioned allophones (e.g. Scottish long vowels) do not automatically emerge from exhaustively combining base segments. *(p.3)*
- A systematic numeric-subdivision convention for key-vowels should preserve semantic consistency of each digit across different vowel families (0 = unreduced, etc.) if the lexicon is to remain readable at scale. *(p.2)*

## Relevance to Project
This paper is the theoretical bridge between the Unisyn architecture paper (Fitt & Isard 1999, Eurospeech) and its concrete rule engineering: it is explicitly the paper that motivates *why* certain information goes in the lexicon (as keysymbols) and other information is deferred to accent-dependent post-lexical rules, working through the actual hard cases (allophony that's morphologically conditioned, cross-word phenomena that can't live in a per-word sub-lexicon, style/rate variation, stress and syllabification divergence). For a declarative TTS frontend, its main value is not a ready-made rule syntax (it doesn't define one) but a worked decision procedure and vocabulary for the lexicon/rule boundary: use phonemic-vs-allophonic status as the primary heuristic, but be ready to override it on practical grounds; treat cross-word-dependent phenomena as requiring engine-level (not per-accent-lexicon-level) rules; and expect an irreducible residue of true lexical exceptions. The actual rule *notation* (context conditions, ordering, etc.) is developed concretely in the companion paper [[Fitt_1999_TreatmentVowelsPrecedingR]] (ICPhS 99), which should be read as this paper's worked case study.

## Open Questions
- [ ] The paper does not select among its own three candidate architectures (keysymbol-in-lexicon-for-allophones / phoneme-lexicon-with-synthesizer-rules / meta-lexicon-plus-sub-lexica) — which one Unisyn ultimately adopted is not stated here; likely resolved in the companion ICPhS 99 paper or later Unisyn documentation.
- [ ] No concrete rule syntax (context-condition notation, rule ordering, rewrite-rule format) is given in this paper at all — it is deferred entirely to other work.
- [ ] How widespread syllabification splits like Canadian/Southern-American 'bicycle' are across the wider accent set is explicitly left open by the authors. *(p.4)*

## Related Work Worth Reading
- [1] (Unnumbered/implicit reference to "conversion rules to generate lexica of regional pronunciations from standard accents") — cited generically for the semi-automatic-conversion alternative approach the keyword method is contrasted against; full citation not resolved on the pages read (references section was not captured with full numbering for this specific citation — cross-check against the paper's own bibliography if exact citation needed).
- [2] Williams & Isard, "A keyvowel approach to the synthesis of regional accents of English," Eurospeech 97 (implicitly referenced per Section 3.3's use of the `rr` symbol) — likely source of concrete rule mechanics for post-vocalic /r/ handling.
- [3] Wells, John C. (1982). *Accents of English*. Cambridge University Press — source of the base keyword system this paper's discussion presupposes throughout.
- Fitt, Susan. "The generation of regional pronunciations of English for speech synthesis." Proceedings: Eurospeech 97, Vol. 5, pp. 2447-50, Patras, 1997. — cited in the companion 1999 Eurospeech paper's bibliography as reference [1]/[2]-adjacent prior work by the same author; likely relevant precursor.
- [[Fitt_1999_TreatmentVowelsPrecedingR]] — this paper's own companion/successor, ICPhS 99, which works out the concrete keysymbol/rule mechanics (Principles I and II, explicit environment notation) for the specific post-vocalic-/r/ case only sketched here in Section 3.3.
- [[Fitt_Isard_1999_SynthesisRegionalEnglishKeywordLexicon]] — the architecture overview paper this discussion piece supports; cites this paper as its own reference [2].

## Collection Cross-References

### Already in Collection
- [Synthesis of Regional English Using a Keyword Lexicon](../Fitt_Isard_1999_SynthesisRegionalEnglishKeywordLexicon/notes.md) - this 1998 paper is that paper's reference [2], "Fitt, Susan, and Isard, Stephen (1998). Representing the environments for phonological processes in an accent-independent lexicon for synthesis of English." The 1999 paper's Fig. 1 architecture (Lexical component / Post-lexical processes / Accent-dependent rules) is the concrete instantiation this 1998 paper's theoretical lexicon-vs-rule discussion argues for.
- [The Treatment of Vowels Preceding 'r' in a Keyword Lexicon of English](../Fitt_1999_TreatmentVowelsPrecedingR/notes.md) - this 1998 paper is cited as reference [1] in the ICPhS 99 paper, which explicitly builds on and applies this paper's Principles I and II to the concrete case of post-vocalic /r/; that paper supplies the formal environment notation (e.g. `V r /_ {C, #}`) only informally gestured at here.

### New Leads (Not Yet in Collection)
- Williams, Briony J., and Isard, Stephen (1997). "A keyvowel approach to the synthesis of regional accents of English." Proceedings: Eurospeech 97, Vol. 5, pp. 2435-8, Patras. - source of the `rr` post-vocalic-/r/ symbol referenced in Section 3.3; likely the earliest concrete rule mechanics paper in this line of work.
- Fitt, Susan (1997). "The generation of regional pronunciations of English for speech synthesis." Proceedings: Eurospeech 97, Vol. 5, pp. 2447-50, Patras. - earlier work by the same author on regional pronunciation generation, cited in the companion 1999 paper's bibliography.

### Cited By (in Collection)
- [The Treatment of Vowels Preceding 'r' in a Keyword Lexicon of English](../Fitt_1999_TreatmentVowelsPrecedingR/notes.md) - cites this paper as reference [1]; its Principles I and II formalize and directly build on this paper's general lexicon-vs-rule-derivation discussion, applying it concretely to the post-vocalic-/r/ case.

### Conceptual Links (not citation-based)
- [Robust LTS rules with the Combilex speech technology lexicon](../Richmond_Clark_Fitt_2009_RobustLTSCombilex/notes.md) - Combilex's later "metaphone" superset symbol scheme with explicit phone-grapheme alignment is a direct architectural descendant of the lexicon-vs-rule-derivation question this 1998 paper raises: Combilex resolves it by keeping a rich base-form symbol inventory (metaphones) plus automatic, alignment-preserving derivation to surface forms, effectively choosing something between this paper's candidate options ii and iii (phoneme-lexicon-plus-rules, with an explicit intermediate alignment layer).
- [Pronunciation Modeling in Speech Synthesis](../Miller_1998_PronunciationModelingSpeechSynthesis/notes.md) - Miller's dissertation (same year, 1998) independently arrives at the same lexical-vs-postlexical division this paper argues for, but resolves the "what to encode vs. derive by rule" question empirically via a trained neural network rather than by linguistic argument; Miller's entropy-based finding that /t/ and schwa have the highest prediction difficulty (hardest to derive by rule) is an empirical echo of this paper's observation that vowel reduction and /t/-allophony (flapping, glottalization) are exactly the hard boundary cases requiring careful rule/lexicon allocation decisions.
