---
title: "Synthesis of Regional English Using a Keyword Lexicon"
authors: "Susan Fitt, Stephen Isard"
year: 1999
venue: "EUROSPEECH'99 (6th European Conference on Speech Communication and Technology), Budapest, Hungary"
doi_url: "https://doi.org/10.21437/Eurospeech.1999-213"
---

# Synthesis of Regional English Using a Keyword Lexicon

## One-Sentence Summary
Describes the Unisyn system architecture: a single **accent-independent keyword lexicon** (transcriptions built from Wells-style lexical-set "keysymbols" rather than phonemes), combined with per-accent **post-lexical rules** that convert keysymbols into a target accent's actual diphone/phone realizations, plus a method for deriving diphone recording word-lists from that lexicon for concatenative synthesis of any accent (illustrated with Scottish and Irish English). *(p.1)*

## Problem Addressed
Different English accents have different phoneme inventories and phoneme-to-word mappings for the same words (e.g. 'bother' /ɒ/ RP vs /ɑ/ GenAm) *(p.1)*. Traditional synthesizers need a separate phonetically-transcribed lexicon per accent, which is laborious to build and does not scale to new accents. The paper's goal is to support many accents from **one** lexicon plus a small per-accent rule set. *(p.1)*

## Key Contributions
- An accent-independent transcription scheme using "keysymbols" based on Wells's (1982) lexical-set keywords (KIT, DRESS, TRAP, BATH, LOT, STRUT, CLOTH, FLEECE, FACE, PALM, THOUGHT, GOAT, GOOSE, PRICE, CHOICE, MOUTH, NEAR, NURSE, SQUARE, NORTH, FORCE, CURE, letter/happy/comma, etc.) *(p.1-2)*
- A worked description of the system architecture: keyword lexicon → post-lexical (accent-dependent) rules → final keysymbol representation → diphones for concatenative synthesis *(p.1, Fig.1)*
- A method for deriving diphone word-lists for real-word (not nonsense-word) recordings directly from the keyword lexicon, per accent, after running post-lexical rules *(p.2-3)*
- Illustration of how the same lexicon, with different post-lexical rule sets, captures the phonology of Scottish and Irish English *(p.4)*

## Methodology
Architecture (Fig. 1, p.1): Input text → **Lexical component** (Morphological component ↔ Base keyword lexica ↔ Exceptions lists; also draws on Stored word-level information e.g. frequency) → **Complete keyword lexicon** → **Post-lexical processes** (containing Accent-dependent rules) → **Final keysymbol representation**. The keyword lexicon is produced off-line and is accent-independent except for isolated true lexical exceptions (e.g. 'important', pronounced with |our| in Scotland and some US accents but not derivable by general post-lexical rule) *(p.2)*. At synthesis time, keysymbol output goes through post-lexical processes analogous to traditional allophonic rules (e.g. English t/d flapping in US English, r-linking in RP) which are accent-dependent *(p.2)*.

For diphone-based concatenative synthesis: a speaker of a given accent records a word set covering the diphones corresponding to the keysymbol set; at synthesis time the system retrieves the diphones that speaker produced for those keysymbols *(p.1)*.

## Key Equations / Statistical Models
None (this is a descriptive/systems paper; no formal equations).

## Parameters

| Name | Symbol | Units | Default | Range | Page | Notes |
|------|--------|-------|---------|-------|------|-------|
| Vowel keysymbol inventory | — | count | 27 (Table 1) | — | p.2 | i, e, a, ao, ah, o, u, uh, au, ii, ei, aa, oo, ou, uu, iu, ai, ae, oi, ow, i@, @@r, er, ir, ar, eir, or, our, oour, ur, @r, iy, @ (Table 1 lists ~29 rows incl. two schwa-type) |
| Consonant keysymbol inventory | — | count | 24 (Table 1) | — | p.2 | p,t,k,b,d,g,m,n,ng,f,th,s,sh,x,v,dh,z,zh,ch,jh,r,y,w,hw,l,ll,h |
| Funding grant | — | — | EPSRC GR/L53250 | — | p.4 | UK Engineering and Physical Sciences Research Council |

## Effect Sizes / Key Quantitative Results
Not applicable — descriptive systems/architecture paper, no quantitative evaluation reported.

## Methods & Implementation Details

### Keysymbol transcription notation (Table 1, p.2)
Each keysymbol is illustrated with an example word, a sample transcription (using `*` for primary stress marking and `.` for syllable boundary), and where applicable the corresponding Wells (1982) lexical-set keyword name. Examples:
- `i` → tin → `t * i n` → keyword **kit**
- `e` → ten → `t * e n` → keyword **dress**
- `a` → tan → `t * a n` → keyword **trap**
- `ah` → task → `t * ah s k` → keyword **bath**
- `o` → top → `t * o p` → keyword **lot**
- `uh` → touch → `t * uh ch` → keyword **strut**
- `au` → toss → `t * au s` → keyword **cloth**
- `ii` → tea → `t * ii` → keyword **fleece**
- `ei` → tape → `t * ei p` → keyword **face**
- `aa` → ta → `t * aa` → keyword **palm**
- `oo` → tall → `t * oo l` → keyword **thought**
- `ou` → toe → `t * ou` → keyword **goat**
- `uu` → two → `t * uu` → keyword **goose**
- `ai` → tight → `t * ai t` → keyword **price**
- `oi` → toy → `t * oi` → keyword **choice**
- `ow` → town → `t * ow n` → keyword **mouth**
- `i@` → idea → `ae . d * i@` → (near)
- `@@r` → turn → `t * @@r r n` → keyword **nurse** (split from `er`, see below)
- `er` → term → `t * er r m` → (no keyword listed; part of nurse split)
- `ir` → dear → `d * ir r` → keyword **near**
- `ar` → tar → `t * ar r` → keyword **start**
- `eir` → dare → `d * eir r` → keyword **square**
- `or` → torch → `t * or r ch` → keyword **north**
- `our` → torn → `t * our r n` → keyword **force**
- `oour` → historic → `h i . s t * oour . r i k` → (no keyword)
- `ur` → tour → `t * ur r` → keyword **cure**
- `oou` → yogurt → `y * oou . g @r r t` → (no keyword)
- `@r` → rotor → `r * ou . t @r r` → keyword **letter**
- `iy` → pity → `p * i . t iy` → keyword **happy**
- `@` → rota → `r * ou . t @` → keyword **comma**

Consonants: p (pea), t (tea), k (key), b (bee), d (Dee), g (geese), m (me), n (knee), ng (sing), f (fee), th (thief), s (sea), sh (she), x (loch), v (veal), dh (thee), z (zeal), zh (gite), ch (cheese), jh (gee), r (reed), y (yeast), w (we), hw (wheel), l (lea), ll (Llewelyn — geminate/dark-l-marked lateral), h (he). *(p.2)* Each consonant transcription also carries a `*` stress marker on the following vowel nucleus as shown (e.g. `p * ii` for "pea").

### Suprasegmental / diacritic notation (p.2)
- Square brackets `[...]`: mark a segment **deletable in certain accents**, e.g. 'sentence' `s * e n . t [@] n s` (schwa deletable). `[@]` = schwa usually omitted in US Englishes; `[@1]` = schwa usually omitted in British Englishes.
- Numbers (subscript-style, e.g. `iu3`): sub-division of a primary keysymbol group, e.g. 'blue' `b l * iu3`.
- Capitals (e.g. `AI`): mark a segment **reducible in certain accents**, e.g. 'fragile' `f r * a . jh AI l`.
- Bracketed/capitalized symbols are mostly rewritten by post-lexical rules (e.g. `OU1` → either `ou` or `@` depending on accent, as in 'obey' `OU1 . b * ei`) so words containing them are best avoided in diphone recording word-lists, since some vary by *style* as well as accent. *(p.3)*
- `*` = primary stress, `.` = syllable boundary (used throughout examples).
- These notations combine freely with basic keysymbols and with each other. *(p.2)*

### Worked accent-conversion example (p.3)
Post-lexical rules must run **before** diphone extraction, producing different word-lists per accent:
```
greed   g r * ii d       → (RP, unchanged) g r * ii d
agreed  @ . g r ii $ d   → (Scottish, post-lexical morpheme-boundary rule triggers vowel lengthening) @ . g r * ii: d
```
Scottish post-lexical rules lengthen vowels at morpheme boundaries (`$` marks a boundary point subject to this rule). *(p.3)*

Non-rhotic pre-consonantal /r/ deletion example: 'card' `k * ar r d` → `k * ar d` (post-lexical rule deletes symbol, producing the combination `ar d` not present in the base lexicon transcriptions). *(p.3)*

### Word-list / diphone extraction procedure (Section 3, p.2-3)
1. Prepare lexicon: run all entries through the target accent's post-lexical rules first, so all keysymbol pairs that will actually occur in that accent are extracted (different word-lists result per accent). *(p.2)*
2. Word selection: exclude homographs and lexical exceptions (e.g. 'important'). Order candidate words by corpus word-frequency (extracted from several on-line texts) rather than optimizing syllable-pattern coverage or diphones-per-word; a script selects, for each diphone, the first example found in the frequency-ordered lexicon. *(p.3)*
3. Diphone extraction: initially extract all symbol-pairs including boundary positions; discard diphone pairs representable by other already-listed diphone pairs (syllable boundary matters for some pairs but not others — e.g. matters for 'hatrack' vs 'Patrick', not for 'fanzine' vs 'fans'); when duplicate options exist prefer the more frequent word (e.g. `v z` from 'gives' preferred over `v . z` from 'evzone'). *(p.3)*
4. Missing diphone pairs (not found in the dictionary) are compiled into a list, split into cross-syllable vs within-syllable pairs. Cross-syllable pairs not representable by within-syllable pairs are checked against symbol combinations occurring at word boundaries (e.g. vowel-vowel pairs like `oi`-`e` as in 'toy elephant', not found word-internally). Some keysymbols never occur at certain boundary positions (e.g. `e` never occurs word-finally, so `e`-`oi` should never be needed). *(p.3)*
5. Because keysymbols (not phonemes) are used, speakers may record pairs that are not phonetically distinct for them (e.g. Scottish speaker realizing both `u` and `uu` as the same [u] phoneme for 'pull'/'pool'), leaving some acoustic redundancy in the word-list; the authors judge de-duplicating this not worth the added rule-writing effort since such reduction rules would not otherwise be needed. *(p.4)*

### Rationale for real-word (not nonsense-word) diphone lists (p.2)
Unlike CSTR's usual nonsense-word diphone lists, Unisyn lists use real dictionary words so naive/non-expert speakers don't need to learn the transcription system — especially important because keysymbol transcriptions draw distinctions the speaker may not consciously make, which would otherwise be confusing to read aloud from nonsense forms.

## Figures of Interest
- **Fig. 1 (p.1), "System Architecture":** Full pipeline diagram — Input text → Complete keyword lexicon (produced by Lexical component: Morphological component ↔ Base keyword lexica ↔ Exceptions lists, informed by Stored word-level information e.g. frequency) → Post-lexical processes (containing Accent-dependent rules) → Final keysymbol representation. Legend distinguishes Input/output, Rules, and Database node shapes.
- **Table 1 (p.2), "Basic keysymbols used in transcriptions":** Full vowel and consonant keysymbol inventory with example word, sample transcription, and Wells lexical-set keyword name where applicable (reproduced in full above under Methods).

## Results Summary
The paper reports no quantitative evaluation. Its "results" (Section 4, p.4) are a **qualitative accent-feature walkthrough** showing how the keysymbol scheme + post-lexical rules capture Scottish and Irish English phonology:

**Scottish English** *(p.4)*:
- `ae`-`ai` distinction ('tied' vs 'tide') — well-known Scottish feature, motivated part of the transcription system's original design.
- `or`-`our` distinction ('horse' vs 'hoarse') — notable Scottish phonemic distinction; recessive in some other accents (e.g. certain US dialects) but not dying out in Scottish English.
- NURSE keyword split into `@@r` and `er` — motivated by Scottish English needing to distinguish 'Hurd'/'heard' or 'cur'/'Kerr' (all /ɜː/ in RP, but /ʌ/ and /ɛ/ respectively in Scottish English). A third Scottish division /ɪ/ (e.g. 'bird') exists but is not currently captured in the transcriptions. Note: middle-class Edinburgh speakers may use /ɜː/ for many of these words instead.
- Mergers: Scottish English does not distinguish 'pull'/'pool' or 'cot'/'caught' — if 'pull' is transcribed `p * u l` and 'pool' `p * uu l`, a Scottish speaker recording both will realize the same phoneme (generally [u]) for both keysymbols.
- Post-lexical rules for Scottish English include vowel-lengthening (at morpheme boundaries, shown above) and t-glottaling (extent varies by accent/social class). No dark/light `l` contrast (all `l`'s generally dark), and unlike many British accents, no h-dropping ('hat' does NOT become `* a t`).

**Irish English** *(p.4)*:
- Rhotic, like Scottish; retains vowel distinctions often lost before orthographic 'r' elsewhere (e.g. 'horse'/'hoarse', 'Hurd'/'heard'). The paper's (Southern) Irish speaker — not a particularly broad accent — distinguishes `or`-`our` but NOT `@@r`-`er`.
- Lacks /θ/: distinction between `th` words and `t` words is typically present but so small as to be virtually inaudible for their speaker; nonetheless `th`-`t` keysymbols are retained so separate diphones are recorded and any difference is preserved.
- Several keysymbols have different phonetic realization in Irish English vs RP: `a`-`aa` ('Pam'/'palm') contrasted by quality+length in RP (/æ/-/ɑː/) but mainly by length in Irish (/a/-/aː/). `ei` and `ou` are generally monophthongs rather than RP diphthongs.
- No dark/light `l` contrast (light `l` throughout, like Scottish).
- Irish English uses tapped /t/-/d/ in certain phonetic environments (as in US English); their speaker only taps at word-ends preceding a vowel (e.g. "What a waste of time"), requiring word-boundary diphone pairs. The need for such diphones per accent is signalled by cross-word environment specifications in the post-lexical rules, and by introducing keysymbols not used word-internally.
- The speaker generally uses [t] word-finally before a consonant, rather than the glottal stop common in other accents (e.g. "But what do they know?"), included in within-word diphone pairs.

**Conclusion (p.4):** The keyword lexicon + diphone word-list method is being used to synthesize and test Scottish and Irish speech (same lexicon for both). The lexicon design is claimed to generalize to many other accents of English.

## Limitations
- Scope explicitly limited to **segmental** differences between accents; intonation and segment-duration differences across accents are acknowledged as real but out of scope. *(p.4)*
- A third Scottish NURSE-related vowel division (/ɪ/, e.g. 'bird') is known but not yet included in the transcription system. *(p.4)*
- Reduced acoustic diphone redundancy (from keysymbol mergers like `u`/`uu` in Scottish) is left unaddressed by design choice, not fixed. *(p.4)*
- No comprehensive/modern dictionaries of regional pronunciation exist, so validity checking must be done first-hand by synthesizing real speakers rather than checked against literature. *(p.4)*

## Arguments Against Prior Work
- Traditional synthesizers storing accent-specific **phonetic** transcriptions require a wholly separate lexicon per accent — laborious to build. *(p.1)*
- CSTR's usual diphone word-lists use nonsense words, which force speakers to learn an unfamiliar transcription system; this is worse for keysymbol-based transcriptions specifically because they encode distinctions the speaker may not natively make, making nonsense-word reading more error-prone/confusing. *(p.2)*
- Attempting to instead include **all** morpheme-boundary keysymbol permutations directly (skipping post-lexical rule application before diphone extraction) would be highly redundant since most accents don't use morpheme boundaries distinctively, producing needlessly long recording lists. *(p.3)*

## Design Rationale
- Chose an **accent-independent abstraction layer** (keysymbols/lexical sets à la Wells 1982) over the lexicon rather than phonemes, so one lexicon serves many accents; accent-specific detail is pushed entirely into a comparatively small post-lexical rule set, which is "far less laborious to compile than a new phonetically transcribed lexicon," and many rules are shared across accents. *(p.1)*
- Chose to prioritize **word-frequency** over syllable-pattern coverage or diphones-per-word when selecting which word instantiates each diphone, for practicality of using real, easily-read words. *(p.3)*
- Chose **not** to write extra rules to strip acoustic redundancy from diphone recordings introduced by keysymbol mergers (e.g. Scottish `u`/`uu`), judging the added complexity not worthwhile since such rules serve no other purpose in the system. *(p.4)*
- Notation innovations (`[...]` deletable-segment brackets, capital reducible-segment marking, numbered subdivisions) exist specifically so that **one symbol string** can still resolve — via post-lexical rule — into different final realizations per accent without needing separate base entries. *(p.2-3)*

## Testable Properties
- The `or`/`our` (NORTH/FORCE) distinction must be preserved as two distinct keysymbols to support Scottish and Irish English, even though RP merges them ('horse'='hoarse' in RP). *(p.4)*
- NURSE must be split into (at least) `@@r` and `er` keysymbols to support the Scottish 'Hurd'≠'heard' / 'cur'≠'Kerr' distinction, collapsible in RP-targeting accent rules. *(p.4)*
- Post-lexical rules must run before diphone-list extraction, since running them can both merge and (via boundary deletion) produce new adjacent-symbol combinations not present in the base lexicon (e.g. `ar d` from 'card' after r-deletion). *(p.3)*
- Bracketed/capitalized/numbered symbols must be resolvable to a single concrete keysymbol by each accent's post-lexical rules before diphone extraction (e.g. `OU1` → `ou` or `@`). *(p.3)*
- Some keysymbols are constrained to never occur at certain word-boundary positions (e.g. `e` never word-finally), which can be used to prune the search space when hunting for missing diphone pairs at boundaries. *(p.3)*

## Relevance to Project
Directly on-point for a declarative TTS frontend that wants **accent as a policy layer over one lexicon**: this is the founding Unisyn paper describing exactly that architecture — one accent-independent keysymbol lexicon (built on Wells 1982 lexical sets) plus a swappable, per-accent post-lexical rule set that resolves keysymbols to phonetic output. Directly informs: (1) the shape of a lexical-set-based abstract phoneme/keysymbol inventory (Table 1) to adopt or adapt; (2) the pattern of encoding accent-variable segments with special notation (deletable-in-some-accents brackets, reducible-in-some-accents capitals, sub-group numbering) resolved by per-accent rules rather than by lexicon duplication; (3) the general principle that post-lexical/accent rules should run before any per-accent derived artifact (here, diphone lists; in a frontend, likely phoneme sequences) is generated. Companion papers [2] Fitt & Isard 1998 (ICSLP) on representing post-lexical rule environments, and [3] Fitt 1999 (ICPhS) on vowels before /r/, are the natural next reads for the rule-representation formalism itself, which this paper only illustrates by example, not by defining a rule language.

## Open Questions
- [ ] The actual formalism/language used to write "post-lexical rules" is not specified here beyond prose examples (`$` boundary markers, bracket/capital resolution) — likely detailed in Fitt & Isard 1998 [2].
- [ ] How stress and syllabification are assigned/represented beyond the `*`/`.` markers shown in examples is not elaborated in this paper.
- [ ] Full per-accent phoneme inventories (e.g. complete Scottish or Irish phoneme sets, not just contrastive examples) are not tabulated here.

## Related Work Worth Reading
- [1] Wells, John C. (1982). *Accents of English*. Cambridge University Press. — Source of the lexical-set keyword framework (KIT, DRESS, TRAP, etc.) this paper's "Well's Keyword" column is based on.
- [2] Fitt, Susan, and Isard, Stephen (1998). "Representing the environments for phonological processes in an accent-independent lexicon for synthesis of English." *Proceedings: ICSLP 98.* — Likely defines the post-lexical rule/environment formalism referenced but not detailed here.
- [3] Fitt, Susan (1999). "The treatment of vowels preceding 'r' in a keyword lexicon of English." *Proceedings: ICPhS 99.* — Directly relevant to the NEAR/SQUARE/NORTH/FORCE/CURE/NURSE-split keysymbol design discussed on p.4.

## Collection Cross-References

### Already in Collection
- (none — Fitt's 1995/1997 Eurospeech papers and Wells 1982 are cited in [Pronunciation Modeling in Speech Synthesis](../Miller_1998_PronunciationModelingSpeechSynthesis/notes.md)'s bibliography but predate this 1999 paper, so this exact paper is a new lead there rather than already-cited)

### New Leads (Not Yet in Collection)
- (none remaining from this paper's own reference list — both [2] and [3] are now in the collection, see "Now in Collection" below)

### Now in Collection (previously listed as leads)
- [Representing the Environments for Phonological Processes in an Accent-Independent Lexicon for Synthesis of English](../Fitt_Isard_1998_RepresentingEnvironmentsPhonologicalProcesses/notes.md) - this paper's own reference [2]. Turns out to be a theoretical/methodological discussion, not a formal rule-syntax specification: it poses and works through the lexicon-vs-rule-derivation question (what should be a keysymbol vs. what should be derived by accent-dependent post-lexical rule) across cases like accent-specific allophony, full/reduced vowel alternation, cross-word phenomena, and stress/syllabification divergence, proposing three unranked candidate architectures. The actual rule notation is deferred to the companion ICPhS 99 paper below.
- [The Treatment of Vowels Preceding 'r' in a Keyword Lexicon of English](../Fitt_1999_TreatmentVowelsPrecedingR/notes.md) - this paper's own reference [3]. This IS the paper with the concrete rule formalism: two explicit encoding criteria (Principle I: encode a distinction lexically if phonemic in at least one target accent; Principle II: derive by accent-dependent post-lexical rule if predictable from environment, with Principle II overriding Principle I on conflict), generative-phonology-style slash-context environment notation (`V r /_ {C, #}`), and concrete worked rewrite rules (e.g. the NURSE `|@@r r|, |uh r| → [ɜːɹ]` GenAm rule vs. RP's split rule). Also gives the detailed per-keyword rhotic-vowel treatment (NEAR/SQUARE/NORTH/FORCE/CURE/NURSE splits) this paper's Section 4 only summarizes.

### Cited By (in Collection)
- [Robust LTS rules with the Combilex speech technology lexicon](../Richmond_Clark_Fitt_2009_RobustLTSCombilex/notes.md) - cites this paper's Unisyn project (reference [3]) as the comparison point for Combilex's own accent-independent, one-lexicon-plus-derivation architecture, noting Unisyn's academic-only license versus Combilex's wider licensing.

### Conceptual Links (not citation-based)
- [Pronunciation Modeling in Speech Synthesis](../Miller_1998_PronunciationModelingSpeechSynthesis/notes.md) - Miller's dissertation frames the same lexical-vs-postlexical architecture this paper uses (dictionary/lexical form → postlexical rules → surface realization) but from the opposite direction: Miller trains neural networks to learn a single speaker's postlexical variation (flapping, deletion, glottalization) empirically from data, while Fitt & Isard hand-author postlexical rules per accent to convert one accent-neutral keyword lexicon into many accents' surface forms. Both treat "postlexical rules applied after lexical lookup" as the natural locus of accent/speaker-specific realization - directly useful precedent for scoping what belongs in the lexicon layer versus the rule layer in a declarative frontend. Miller's dissertation bibliography also cites two earlier Fitt papers (1995, 1997) on regional/unfamiliar pronunciation, confirming this is a continuous research thread.
- [Formant frequencies of vowels in 13 accents of the British Isles](../Ferragne_2010_FormantFrequenciesVowels13/notes.md) - Ferragne & Pellegrino report acoustic (median F1/F2 Hz, diphthong trajectory) targets for the same Wells-style lexical sets (FLEECE, KIT, TRAP, GOAT, PRICE, etc.) across 13 real British Isles accents, including explicit per-accent lexical-set merger/split patterns (FOOT-STRUT, NURSE-SQUARE, FOOT-GOOSE) that would parameterize the post-lexical resolution rules this paper's Unisyn architecture applies per accent to keysymbols - the missing acoustic-target layer beneath Unisyn's phonological keysymbol scheme.
