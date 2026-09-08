---
title: "The Treatment of Vowels Preceding 'r' in a Keyword Lexicon of English"
authors: "Susan Fitt"
year: 1999
venue: "ICPhS 99 (14th International Congress of Phonetic Sciences), San Francisco"
doi_url: null
pages: "4 (pp. 2299-2302 in proceedings, per external citation records)"
---

# The Treatment of Vowels Preceding 'r' in a Keyword Lexicon of English

## One-Sentence Summary
Works out, with an explicit formal lexicon-inclusion-vs-rule-derivation criterion (Principles I and II) and concrete rewrite-style rules, exactly how vowels before orthographic/phonetic 'r' are represented in the Unisyn keyword lexicon: post-vocalic |r| is retained in the base lexicon and deleted or realized by accent-dependent post-lexical rule, while the keyvowel inventory itself must be split, retained, or potentially merged per-keyword (NURSE, NEAR, SQUARE, START, NORTH, FORCE, CURE, LETTER, PRICE, CHOICE, MOUTH) based on which accents distinguish which vowels in this environment. *(p.1)*

## Problem Addressed
Representation of vowels before 'r' is complex in an accent-independent lexicon because loss of |r| in non-rhotic accents is usually accompanied by a change in the quality of the preceding vowel, whereas rhotic accents typically allow the same vowel-set before postvocalic [ɹ] as before other consonants — so a single accent-neutral symbol set must somehow support both behaviors. *(p.1)*

## Key Contributions
- Two explicit, general **encoding criteria** (Principle I, Principle II) governing what belongs in the accent-independent base lexicon versus what is derived by accent-dependent post-lexical rule, with an explicit priority ordering when they conflict. *(p.1)*
- Formal environment notation using slash-context rules (`V r /_ {C, #}` style, following generative-phonology convention) to define "post-vocalic" and "word-internal pre-vocalic" 'r' environments precisely. *(p.1)*
- A full accounting of Wells's rhotic-adjacent keywords (NURSE, NEAR, SQUARE, START, NORTH, FORCE, CURE, LETTER, plus PRICE/CHOICE/MOUTH) with per-keyword discussion of whether/how they must be split, retained, or could be merged to satisfy the two Principles across the focus accents (RP, General American, and various regional accents of Britain/US). *(p.2-3)*
- Quantitative frequency-of-occurrence data (Table 3) for each keyvowel before post-vocalic and intervocalic |r|, from a 110,000-word dictionary. *(p.3)*
- Worked reduction of a naive split-symbol (`|r|` vs `|rr|`) approach down to a single accent-independent |r| symbol plus accent-dependent post-lexical rules, explicitly shifting descriptive burden from the lexicon to the rule layer. *(p.1-2)*

## Methodology
Descriptive/analytical linguistics paper grounded in a large pronunciation dictionary (~110,000 words, with 69,204 instances of |r| total) being developed for the Unisyn keyword lexicon. The author applies two stated encoding principles to a systematic survey of English vowel-before-r phenomena across focus accents (RP, General American, and selected regional British/American accents), citing prior work (Wells 1982; Williams & Isard 1997) and one Edinburgh-accent informant used to check Wells's NORTH/FORCE word-list groupings.

## Key Equations / Statistical Models
No statistical models. The paper's formal apparatus is generative-phonology-style rewrite/context rules, reproduced verbatim below (see Methods & Implementation Details).

## Parameters

| Name | Symbol | Units | Default | Range | Page | Notes |
|------|--------|-------|---------|-------|------|-------|
| Dictionary size | — | words | 110,000 | — | p.3 | Approximate; lexicon "gradually being refined" |
| Total |r| instances in dictionary | — | count | 69,204 | — | p.3 | |
| Word-internal pre-vocalic |r| instances | — | count | 38,560 | — | p.3 | Of which 12,376 are intervocalic |
| Post-vocalic |r| instances | — | count | 30,333 | — | p.3 | Of which 7,482 word-final, 22,851 pre-consonantal |
| Funding grant | — | — | EPSRC GR/L53250 | — | p.4 | UK Engineering and Physical Sciences Research Council, same grant as the two companion papers |

## Effect Sizes / Key Quantitative Results

### Table 3 — Frequency of vowels before |r| (p.3, reproduced verbatim)

| Wells's Keyword | My keyvowel | Examples before post-vocalic \|r\| | Frequency before post-vocalic \|r\| | Frequency before intervocalic \|r\|, with example |
|---|---|---|---|---|
| NURSE | @@r | fir, nurse | 2482 | (furry 40) |
| NURSE (cont.) | er | deter, heard | 2353 | (deterring 41) |
| NEAR | ir | near, weird | 538 | (era 570) |
| SQUARE | eir | square, cairn | 761 | (area 666) |
| START | ar | car, start | 3420 | (atari 86) |
| NORTH | or | war, north | 1139 | (warring 1) |
| FORCE | our | wore, force | 1022 | (glory 584) |
| NORTH/FORCE | — | Timor, abort | 1744 | (abhorring 83) |
| CURE | ur | cure, insured | 196 | (curio 568) |
| LETTER | @r | letter, — | 15159 | (gorilla 5454) |
| LETTER (sequence) | @r | skier, linearly | 987 | (priory 124) |
| PRICE | ai | N/A | N/A | N/A |
| PRICE (cont.) | ae | fire, tired | 326 | (viral 308) |
| CHOICE | oi | coir | 1 | (moira 6) |
| MOUTH | ow | hour, sour | 99 | (maori 20) |
| other | — | (carry, Cyril) | 0 | 2985 |
| **total** | — | — | **30227** | **11536** |

*(p.3)* Notes accompanying the table: figures are approximate since the lexicon is being gradually refined; some keyvowels (e.g. `@r`) have inflated frequency due to use in common derivational morphemes like '-or' and '-er'; occurrences before intervocalic |r| are included for interest, since many of these are morpheme-final.

## Methods & Implementation Details

### Terminology and environment notation (Section 2.1, p.1, reproduced verbatim)
'Rhotic' and 'non-rhotic' refer to accent types. 'Post-vocalic' (traditional term, somewhat unsatisfactory per the author) describes /r/ in both pre-consonantal and word-final environments:
```
V r /_  { C
          # }
```
(Vowel-r sequence, in the environment before either a Consonant or a word boundary `#`.) In these environments /r/ is consistently pronounced in rhotic accents; in non-rhotic accents /r/ does not exist in pre-consonantal position and is variable word-finally depending on the following word and the regional accent.

'Word-internal pre-vocalic' describes the environment:
```
r /_ V
```
/r/ is pronounced in this context regardless of accent type.

### Principles I and II — the core encoding criteria (Section 2.2, p.1, reproduced verbatim)
> Principle I. For segments, *all phonemes in each accent*, and *only units which have phonemic status in at least one accent*, should be encoded differently in the base lexicon.
>
> Principle II. *If the phonetic realisation of a unit is predictable from the environment* (which includes keysymbols, syllable and morpheme boundaries) then this will be derived by accent-dependent post-lexical processing.

Stated priority: "In the case of a conflict, Principle II overrides Principle I as it reduces redundancy in the transcriptions." Example application: the Scottish 'horse'/'hoarse' vowel distinction must be encoded in the base lexica (satisfies Principle I — phonemic in at least one accent, i.e. Scottish), whereas dark and light /l/, which are never contrastive in any accent, are generated entirely post-lexically (Principle II — always predictable from environment, never phonemic). *(p.1)*

### The `|r|`/`|rr|` split-symbol approach, tried and abandoned (Section 2.2, p.1-2)
Initial plan (following Williams & Isard [3], their notation `|rr|` vs `|r|`): use a special symbol for post-vocalic 'r' distinct from word-internal pre-vocalic 'r'. Rejected in favor of a single accent-independent `|r|` symbol, because: (a) treating all regional /r/-realisation differences as separate keysymbols leads to numerous keysymbols encoding differences that are in many cases predictable; (b) post-lexical rules are needed anyway for cross-word environmental conditioning (see below) and for other allophones (e.g. glottal stops) whose scope of application already varies by accent; so the balance of description shifts from the lexicon to accent-dependent rules. *(p.1-2)*
Worked comparison, reproduced verbatim:
```
Word     Keysymbol transcription
farm     f * ar r m
safari   s @ . f * ar . r iy
```
The `|r|` symbol in 'farm' is realised as `[r]` (or `[ɹ]`, `[ʀ]`, etc.) in rhotic accents and as null in non-rhotic accents; the `|r|` in 'safari' is realised as `[r]` in *all* accents (word-internal pre-vocalic /r/ is always pronounced). Note this is a strictly simpler mapping than the old split-symbol scheme, where `|r|` was realised as `[r]` in all accents and word-internal `|rr|` was realised as `[r]` in rhotic accents and null in non-rhotic accents — the paper notes that even under the *old* split-symbol scheme, post-lexical rules were still necessary to predict the realisation of word-final 'r' in non-rhotic accents that use linking `[r]`. *(p.1-2)*

### Phonemic/phonetic transcription comparison tables (Table 1, Table 2, p.2, reproduced verbatim)

**Table 1: Phonemic and phonetic transcriptions of RP (isolated words)**

| | RP, phonemic transcription | RP, phonetic transcription |
|---|---|---|
| far | /fɑːr/ | [fɑː] |
| farm | /fɑːm/ | [fɑː] |
| safari | /səˈfɑːri/ | [səˈfɑː.ɹi] |

**Table 2: Keysymbol transcriptions (isolated words)**

| | Keysymbol transcription | RP, after post-lexical rules |
|---|---|---|
| far | \|f * ar r\| | \|f * ar\| |
| farm | \|f * ar r m\| | \|f * ar m\| |
| safari | \|s @ . f * ar . r iy\| | \|s @ . f * ar . r iy\| |

Key observation: in the phonemic/phonetic transcriptions (Table 1), only 'far' shows loss of /r/ converting from phoneme to allophone, whereas in the keysymbol transcriptions (Table 2), *both* 'far' and 'farm' retain |r| in the lexicon and lose it only during application of post-lexical rules (i.e. the keysymbol lexicon systematically over-represents /r/ relative to a phonemic transcription, deferring deletion to accent-dependent rule). Footnote iv on this table notes this is "only one possible analysis" — some linguists propose an underlying /r/ in 'farm' too, on phonological/historical/psychological grounds, but pronunciation lexica generally use a more surface-level phonemic approach as described in the text.

### Linking and intrusive 'r' scope (Section 2.2, p.2)
Linking [r] prediction for a word like 'far' requires knowing what follows (a following vowel triggers linking [r] in non-rhotic accents such as RP); note some accents (e.g. South African English) do not pronounce linking 'r' at all, so this rule does not apply universally. Intrusive 'r' (inserted where no historical/orthographic 'r' exists, e.g. "law-r-and-order"), while used to varying degrees by many speakers, is treated as erroneous by the lexicon and is not included in the keyword transcriptions or post-lexical rules by default — though it could be introduced by rule if desired (citing reference [5], Brown 1988).

### Post-vocalic vowel-set inventory (Section 3, p.2)
The paper's scope is vowels that are post-vocalic in the technical sense above (precede |r| + consonant, or word-final |r|). Keyword sets that may occur in non-rhotic accents before a *lost* |r|: NURSE, NEAR, SQUARE, START, NORTH, FORCE, CURE, LETTER — used only before either post-vocalic or intervocalic |r| (e.g. 'mar' = `|m * ar r|`, 'marring' = `|m * ar r . i ng|`, but 'ma' belongs with the PALM keyword = `|m * aa|`). A further set may occur either before |r| or elsewhere: PRICE, CHOICE, MOUTH — in non-rhotic accents these are generally followed by a glide when preceding |r| (e.g. 'out' `|* ow t|` → RP [aʊt], but 'hour' `|* ow r|` → RP [aʊə]); sometimes realised as monophthongs in both environments. Vowels that do *not* occur before a lost |r|: short vowels like [ɪ] (cannot occur in open syllables), and the long close monophthongs [iː]/[uː] — the FACE and GOAT keyvowels (monophthongal in some accents, diphthongal in others) also do not occur in this position. *(p.2)*

### Per-keyword findings (Section 3.2, p.2-3)

**3.2.1 NURSE.** RP [ɜː] occurs in some non-post-vocalic-r environments too (small, borrowed word-set: 'Goethe', 'chartreuse'), with variable American correspondence ([o] in 'Goethe', [u] in 'chartreuse') — treated as lexical exceptions. General American [ɜː] doesn't always correspond to RP [ɜː]: the 'hurry' set ([ʌ] in RP, e.g. 'hurry', 'squirrel' with [ɪ]) can be handled by rule since |@@r r| (as in 'nurse', 'fur', 'furry') is realised as [ɜː(ɹ)] in both GenAm and RP, while |uh r| is realised as [ɜːɹ] in GenAm and [ʌɹ] in RP ('hurry'). Formal rule, reproduced verbatim:
```
Gen. Am.   |@@r r|, |uh r| → [ɜːɹ]
RP         |@@r r| → [ɜːɹ]
RP         |uh r| → [ʌɹ]
```
Alternative single-symbol solution (using only |uh r| for both 'hurry'/'furry', recognizing pre-consonantal/morpheme-final conditioning in RP), reproduced verbatim:
```
RP         |uh r| → [ɜːɹ] /_  { C
                                + }
                    → [ʌɹ] /_  elsewhere

Gen. Am.   |uh r| → [ɜːɹ]
```
Principle II favours this second (rule-derived) solution since RP's |uh r| realisations are predictable from phonetic/morphological environment; the tradeoff is a lexical transcription with a short vowel before postvocalic |r|, complicating phonotactic specification of the lexicon — the paper states the first (two-symbol, `@@r`/`uh`-keeps-lexical-distinction) solution is currently followed in practice. *(p.2-3)* 'Squirrel'/'stirrup'-type [ɜː]/[ɪ] alternation cannot be handled by rule (cf. 'Cyril', which has [ɪ] in both accents) — only 'squirrel', 'stirrup' and derivatives currently show this and are listed as lexical exceptions. *(p.3)* More substantial Scottish-accent NURSE splits exist beyond RP/GenAm: most common is 'word' [ʌ] vs 'heard' [ɛ]; some Scottish accents further split off [ɪ] (e.g. 'bird'); the lexicon currently records only the word/heard split, with the bird split noted as future work. *(p.3)*

**3.2.2 NEAR.** Distinction between 'cereal', 'Cyril', and 'Leroy' motivates keeping NEAR distinct. NEAR vowel quality varies by accent (Scottish [i], American [ɪ]) but this is pure phonetic realisation, not affecting transcription. Environmental variation exists in some accents (e.g. Leeds: 'beer' diphthong vs 'beery' monophthong before a following vowel) but is predictable by environment so uses the same keyvowel; this environmental conditioning is by a non-adjacent segment, so for diphone synthesis it must be specified in post-lexical rules (though not needed if longer speech stretches are sampled). The lexicon distinguishes diphthong sequences like 'near' `|n * ir r|` from true vowel-schwa sequences like 'skier' `|s k * ii @r r|` — such sequences are listed in Table 3 as combinations of `|@r|` and `|r|` rather than `|ir|` and `|r|`, though not all speakers make this distinction. *(p.3)*

**3.2.3 SQUARE.** Not all accents distinguish SQUARE: Liverpool merges SQUARE with NURSE; many New Zealand speakers merge SQUARE with NEAR [6]. In General American there is a possible 'Mary'/'marry'/'merry' merger. Mergers are described as "no problem" in a keyword lexicon since they are many-to-one correspondences, need not even be specified by rule — automatic phone-extraction from recordings using these keysymbols will naturally produce the merged result. *(p.3)*

**3.2.4 START.** Could be treated as an instance of PALM (unlike 'hurry'/'furry' this wouldn't violate phonotactic structure, since PALM is a long vowel). Unlike `|@@r|`, START occurs before non-morpheme-final intervocalic |r| (e.g. 'safari'), so the distinction could not be derived by rule; but since there is no pronunciation difference between START and PALM in the focus accents, separate keysymbols aren't currently deemed necessary — the two keysymbols are retained for now but may be merged if no future-work distinction is found. *(p.3)*

**3.2.5 NORTH, FORCE.** Many accents have merged or are merging NORTH and FORCE; where accents distinguish them, the distinction cannot be produced by rule and must be recorded in the lexicon. Wells [2] lists words falling into the two groups; these were checked against an Edinburgh-accent speaker informant, who was in broad agreement. Some words present in the lexicon are missing from Wells [2] (e.g. 'abort', 'California', 'corset') and are still being verified, tracked separately as a "NORTH/FORCE" (unresolved) group in Table 3. *(p.3)*

**3.2.6 CURE.** Realisation varies by phonetic environment in some accents, similar to NEAR: a distinction is made between diphthong sequences (e.g. 'cure' `|k y * ur r|`) and vowel-schwa sequences (e.g. 'queuer' `|k y * uu @r r|`, someone who queues). Some CURE words are shifting toward the FORCE vowel in non-rhotic British accents (e.g. 'poor' often [pɔː] rather than [pʊə]) but the change is not systematic — e.g. 'sure' may have [ɔː] while 'tour' retains [ʊə]; environments following [j] (e.g. 'pure') are more likely to retain [ʊə]. No hard-and-fast rule is given; because post-vocalic CURE words are not numerous (per Table 3, only 196), the paper suggests noting CURE words likely to be pronounced [ɔː] in exception lists, while acknowledging the list "cannot be definitive." *(p.3)*

**3.2.7 LETTER.** Describes schwa preceding |r|; like START, may prove redundant. Words with a simple schwa (e.g. 'letter') and sequences like 'skier' `|s k * ii @r r|` are listed separately in Table 3; the latter set includes words like 'familiar', where the LETTER vowel may follow [ɪ] or [j] depending on accent and speaking style. *(p.3)*

**3.2.8 PRICE.** Split into `|ai|` and `|ae|` (noted earlier, motivated by the Scottish 'tied'/'tide' distinction — see the companion 1999 Eurospeech and 1998 ICSLP papers). Before post-vocalic |r| and in open syllables, only the `|ae|` variant occurs. Non-rhotic accents tend to have an offglide between `|ae|` and post-vocalic |r|, e.g. 'fire' `|f * ae r|` becomes [faɪə] in RP, though (as noted elsewhere) this may also be pronounced as a monophthong. As with NEAR and CURE, the lexicon distinguishes simple PRICE diphthongs (e.g. 'ire') from PRICE+schwa sequences (e.g. 'priory'). *(p.3-4)*

**3.2.9 CHOICE.** Rare before post-vocalic |r|; in this dictionary it occurs only in 'coir'. Words like 'employer' are instead treated as sequences of `|oi|` + schwa. *(p.4)*

**3.2.10 MOUTH.** Also relatively uncommon before post-vocalic |r|; the sequence mostly occurs morpheme-finally, in words such as 'sour'. *(p.4)*

### Exceptions noted in Section 4 (Frequency of Occurrence), p.3-4
Some vowels preceding post-vocalic/intervocalic |r| are excluded from the general system: some are handled as exceptions, e.g. 'clerk', which has a different vowel in British and American English; another class is *reducible* in some accents, e.g. 'record' (noun): [ˈɹɛ.kɔ(ɹ)d] in most British accents, but [ˈɹɛ.kɔɹd] in some others including Scottish and General American.

### Notes appendix (p.4, reproduced verbatim, footnotes to main text)
> i. The use of single keysymbols to encode phoneme sequences, or multiple keysymbols to represent a single phoneme, is currently under investigation; this is necessary for some units which consist of a single phoneme in one accent and multiple phonemes in another, such as the /ɪʊ/ diphthong (Welsh) vs. /ju/ (most other accents).
> ii. Some accents distinguish between pairs such as 'holy' and 'wholly'/'holey' on the basis of light/dark /l/, with associated allophonic variation of the /oʊ/ vowel (['həʊ.li] vs. ['hoʊɫ.i]). However, the phones should be derivable from the syllable structure and/or the morpheme boundary.
> iii. Rules need not be stated separately for each accent; for many features, we can use accent-groups, such as 'rhotic', 'non-rhotic linking' and 'non-rhotic non-linking'.
> iv. This is only one possible analysis; some would propose an underlying /r/ in 'farm'. This has some justification phonologically, historically and psychologically. However, pronunciation lexica generally use a more surface-level phonemic approach such as that described in the text.

## Figures of Interest
- **Table 1 (p.2), "Phonemic and phonetic transcriptions of RP (isolated words)":** far/farm/safari comparison (reproduced verbatim above).
- **Table 2 (p.2), "Keysymbol transcriptions (isolated words)":** far/farm/safari keysymbol-vs-post-lexical-rule-output comparison (reproduced verbatim above).
- **Table 3 (p.3), "Frequency of vowels before |r|":** Full per-keyword frequency table across post-vocalic and intervocalic environments (reproduced verbatim above under Effect Sizes).

## Results Summary
Consistently applying Principles I and II produces multiple cases where rule-based derivation replaces lexical encoding of a distinction; the paper's primary worked case is post-vocalic |r| itself, whose realisation is shown to be predictable by accent-dependent rule rather than needing per-accent lexical encoding. *(p.4)* Some predictability (e.g. NEAR allophony conditioned by a following vowel across a non-adjacent segment) depends on non-local phonetic/morphological environment information, requiring care when synthesizing transcriptions. *(p.4)* Some original keyword-set divisions may be redundant (e.g. START may merge with PALM if no accent is found to distinguish them), while others required splitting to accommodate various accents (e.g. NURSE into `@@r`/`er`, PRICE into `ai`/`ae`). *(p.4)*

## Limitations
- The NORTH/FORCE word-group verification against Wells's lists is incomplete — several words present in the lexicon (e.g. 'abort', 'California', 'corset') are missing from Wells and still being checked; tracked as an unresolved "NORTH/FORCE" bucket in Table 3. *(p.3)*
- CURE-vowel-to-FORCE-vowel shift in non-rhotic British accents is acknowledged as real but unsystematic — no hard rule is given, only an exception-list heuristic explicitly described as non-definitive. *(p.3)*
- Table 3's frequency figures are approximate, since the underlying lexicon is still being refined at time of writing. *(p.3)*
- Single-keysymbol-to-multi-phoneme (and vice versa) mapping for units like Welsh /ɪʊ/ vs. general /ju/ is noted as "currently under investigation," not resolved in this paper. *(footnote i, p.4)*
- The Scottish NURSE three-way split (adding [ɪ] as in 'bird') is known but not yet implemented, matching the same limitation flagged in the companion 1999 Eurospeech paper. *(p.3)*

## Arguments Against Prior Work
- The original planned split-symbol approach (`|rr|` vs `|r|`, following Williams & Isard [3]) is argued against on the grounds that it still requires post-lexical rules for non-rhotic word-final linking-[r] prediction anyway, so the split symbol doesn't actually avoid the need for rules — it only adds lexical complexity without eliminating rule complexity. *(p.1-2)*
- Encoding every regional /r/-realisation difference as a separate keysymbol is rejected because most such differences are predictable and better handled by Principle II. *(p.1)*

## Design Rationale
- Principles I and II are explicitly prioritized (II overrides I on conflict) specifically to minimize transcription redundancy — this is the paper's central architectural commitment, stated once and then applied systematically across every keyword discussed. *(p.1)*
- The move from split-symbol (`|r|`/`|rr|`) to single-symbol-plus-rule (`|r|` everywhere, resolved by post-lexical rule) is a deliberate simplification that shifts descriptive burden from lexicon to rule layer, justified because post-lexical rules were unavoidable anyway (needed for cross-word phenomena and other allophony) — so the added lexical distinction bought nothing. *(p.1-2)*
- For NURSE's 'hurry' set, the paper explicitly weighs a rule-heavier single-symbol solution (favoured by Principle II, since it's more predictable) against a lexicon-heavier two-symbol solution (currently used in practice, since it avoids complicating phonotactic constraints with short-vowel-before-|r| sequences) — an explicit case of practical/phonotactic considerations tempering the general II-over-I priority rule. *(p.2-3)*
- Mergers (e.g. SQUARE-NURSE in Liverpool, SQUARE-NEAR in New Zealand) are treated as lexicon-cost-free precisely because they are many-to-one: the keyword system's design means mergers require no explicit rule or lexical action at all, only the general fact that automatic phone-extraction from recorded speaker data will realize both keysymbols identically. *(p.3)*
- Rules are deliberately written over accent-*groups* ('rhotic', 'non-rhotic linking', 'non-rhotic non-linking') rather than being duplicated per individual accent, to reduce rule-authoring burden for shared behaviors. *(footnote iii, p.4)*

## Testable Properties
- Post-vocalic |r| realisation (present vs. null/glide) is predictable by accent type and following-environment; a single accent-neutral `|r|` keysymbol plus post-lexical rule suffices, and no dedicated split symbol is needed. *(p.1-2)*
- NURSE requires (at minimum) a two-way `@@r`/`er` split to capture the Scottish 'Hurd'/'heard' distinction (echoing the 1999 Eurospeech paper), and General American's `|@@r r|`/`|uh r|` both surface as [ɜːɹ] while RP splits them into [ɜːɹ]/[ʌɹ] respectively — a testable per-accent rewrite-rule pair, given verbatim above. *(p.2-3)*
- NORTH and FORCE must remain lexically distinct wherever an accent phonemically contrasts them (cannot be derived by rule), even though many accents have merged them. *(p.3)*
- START and PALM currently have identical phonetic realisation across the paper's focus accents (RP, General American, and surveyed regional accents) and are therefore candidates for future merger into a single keysymbol, pending confirmation no accent needs the distinction. *(p.3)*
- The dictionary's |r| distribution is heavily skewed toward the LETTER environment (15,159 of 30,227 post-vocalic instances, ~50%) due to common '-or'/'-er' derivational morphemes — any per-accent LETTER-vowel rule will have outsized impact on overall transcription accuracy relative to rarer keywords like CHOICE (1 instance) or MOUTH (99 instances). *(p.3, Table 3)*

## Relevance to Project
This is the paper the team specifically wanted for the actual rule formalism, and it delivers: **Principles I and II** are a directly reusable, general-purpose criterion for a declarative TTS frontend's own lexicon-vs-rule boundary ("encode a phonemic distinction if any target accent needs it; derive by rule whenever realisation is predictable from environment; prefer the rule when both are possible"). The environment notation (`V r /_ {C, #}`, `r /_ V`) is a minimal, directly portable slash-context format for accent rules. The worked NURSE rewrite rules (`|@@r r|, |uh r| → [ɜːɹ]` for GenAm; split into two RP-specific rules) are a concrete template for how a rule engine should express "one keysymbol pair maps differently per accent, and within an accent may further depend on local phonetic/morphological environment." The frequency table (Table 3) is directly useful for prioritizing which per-accent rhotic-vowel rules matter most by corpus impact. The paper is also candid about where the clean Principle-I/II framework breaks down in practice (the NURSE 'hurry' phonotactic tradeoff, unsystematic CURE-to-FORCE drift handled by exception list only) — useful precedent for when a declarative frontend should fall back to exception lists rather than force a rule.

## Open Questions
- [ ] Whether the Scottish three-way NURSE split (adding [ɪ], e.g. 'bird') will be implemented is left as future work, matching the same open item in the 1999 Eurospeech paper. *(p.3)*
- [ ] Whether START and PALM will ultimately be merged is explicitly left pending future work turning up (or not) a distinguishing accent. *(p.3)*
- [ ] The single-keysymbol-vs-multi-phoneme mapping question (footnote i, e.g. Welsh /ɪʊ/ vs. general /ju/) is stated as "currently under investigation," unresolved here.
- [ ] No systematic rule for CURE's drift toward the FORCE vowel is given; the paper explicitly states "there are no hard and fast rules" and falls back to a non-definitive exception list. *(p.3)*
- [ ] The remaining unverified NORTH/FORCE word list (words missing from Wells, e.g. 'abort', 'California', 'corset') is explicitly still "in the process of verifying." *(p.3)*

## Related Work Worth Reading
- [1] Fitt, Susan, and Isard, Stephen (1998). "Representing the environments for phonological processes in an accent-independent lexicon for synthesis of English." Proceedings: ICSLP 98. — This paper's own reference [1]; already in the collection as [[Fitt_Isard_1998_RepresentingEnvironmentsPhonologicalProcesses]]; source of the general lexicon-vs-rule discussion this paper's Principles I/II formalize and apply.
- [2] Wells, John C. (1982). *Accents of English*. Cambridge: Cambridge University Press. — Source of the base keyword system and the NORTH/FORCE word-group lists checked against an Edinburgh informant in Section 3.2.5.
- [3] Williams, Briony J., and Isard, Stephen (1997). "A keyvowel approach to the synthesis of regional accents of English." Proceedings: Eurospeech 97, Vol. 5, pp. 2435-8, Patras. — Source of the original `|rr|`/`|r|` split-symbol approach this paper explicitly reconsiders and simplifies away from.
- [4] Fox, Anthony (1978). "To 'r' is human? Intrusive remarks on a recent controversy." Journal of the International Phonetic Association, Vol. 8, pp. 72-4. — Cited re: intrusive 'r', not included in the lexicon by default.
- [5] Brown, Adam (1988). "Linking, intrusive and rhotic /r/ in pronunciation models." Journal of the International Phonetic Association, Vol. 18, pp. 144-51. — Cited as a source for how intrusive 'r' could be introduced by rule if desired.
- [6] Maclagan, Margaret A., and Gordon, Elizabeth (1996). "Out of the AIR and into the EAR: Another view of the New Zealand diphthong merger." Language Variation and Change, Vol. 8, No. 1, pp. 125-47. — Source for the New Zealand SQUARE-NEAR merger mentioned in Section 3.2.3.

## Collection Cross-References

### Already in Collection
- [Representing the Environments for Phonological Processes in an Accent-Independent Lexicon for Synthesis of English](../Fitt_Isard_1998_RepresentingEnvironmentsPhonologicalProcesses/notes.md) - this paper's own reference [1]; that 1998 paper poses the general theoretical lexicon-vs-rule question this paper's Principles I and II formalize and apply concretely to the post-vocalic-/r/ case.
- [Synthesis of Regional English Using a Keyword Lexicon](../Fitt_Isard_1999_SynthesisRegionalEnglishKeywordLexicon/notes.md) - shares the same core keysymbol notation (`*` stress, `.` syllable boundary, NURSE split into `@@r`/`er`, PRICE split into `ai`/`ae`) and the same Table 1 vowel keysymbol inventory; this paper works out the detailed per-keyword rhotic-environment mechanics that the 1999 Eurospeech paper only summarizes at a high level (e.g. it cites this very paper as its own reference [3] for the NEAR/SQUARE/NORTH/FORCE/CURE/NURSE-split design).

### New Leads (Not Yet in Collection)
- Williams, Briony J., and Isard, Stephen (1997). "A keyvowel approach to the synthesis of regional accents of English." Proceedings: Eurospeech 97, Vol. 5, pp. 2435-8. - source of the original split-symbol (`|rr|`/`|r|`) approach this paper simplifies away from; likely the earliest concrete rule-mechanics paper in the Unisyn lineage.
- Brown, Adam (1988). "Linking, intrusive and rhotic /r/ in pronunciation models." Journal of the International Phonetic Association, Vol. 18, pp. 144-51. - cited re: how intrusive /r/ could be added by rule if desired.
- Maclagan, Margaret A., and Gordon, Elizabeth (1996). "Out of the AIR and into the EAR: Another view of the New Zealand diphthong merger." Language Variation and Change, Vol. 8, No. 1, pp. 125-47. - source for the New Zealand SQUARE-NEAR merger example.

### Cited By (in Collection)
- (none found)

### Conceptual Links (not citation-based)
- [Robust LTS rules with the Combilex speech technology lexicon](../Richmond_Clark_Fitt_2009_RobustLTSCombilex/notes.md) - Combilex's later metaphone scheme (co-authored by the same Sue Fitt) generalizes this paper's specific rhotic-vowel keysymbol engineering into a systematic, alignment-carrying superset symbol inventory with automatic base-to-surface derivation; the underlying design question - which symbol distinctions are genuinely needed across the target accent set versus derivable by rule - is the same question Combilex answers at lexicon-construction scale that this paper answers case-by-case for vowels before /r/.
