---
title: "Robust LTS rules with the Combilex speech technology lexicon"
authors: "Korin Richmond, Robert A. J. Clark, Sue Fitt"
year: 2009
venue: "Interspeech 2009, Brighton, UK"
doi_url: "https://doi.org/10.21437/Interspeech.2009-405"
pages: "1295-1298"
---

# Robust LTS rules with the Combilex speech technology lexicon

## One-Sentence Summary
Introduces Combilex, an accent-independent pronunciation lexicon built on a superset "metaphone" symbol set with explicit expert-authored phone-to-grapheme alignment, and shows empirically that using that expert alignment (rather than automatic alignment) to train letter-to-sound (LTS) rules significantly improves LTS accuracy (86.50% vs 84.49% words correct) while also removing the need to hand-specify allowed alignments, and that Combilex out-performs OALD as a training source. *(p.1)*

## Problem Addressed
Speech synthesizers need a pronunciation lexicon plus letter-to-sound (LTS) rules for out-of-lexicon words, because no finite lexicon can cover a fluid, growing language and no LTS method has approached 100% accuracy for English. *(p.1)* Existing lexica (CMU: large/free but variable quality, GAM-only, no rich extra info; OALD: consistent but small ~63,399 entries, British-only; Unisyn: rich, multi-accent, but academic-only license) each have limitations. *(p.1)* Data-driven LTS methods (decision trees, pronunciation-by-analogy) typically need an initial letter-phone alignment in training data, which is usually obtained automatically and can be a source of downstream error. *(p.1)*

## Key Contributions
- Introduction of **Combilex**, a new, large, accent-independent pronunciation lexicon built from scratch at CSTR, released under wide-ranging licenses, supervised by a single lexicographer with automatic phonotactic/consistency-checking applied at data-entry time. *(p.1)*
- A "metaphone" transcription scheme: base-form transcriptions using a superset-of-accents symbol set (SAMPA-based, extended), from which accent-specific "surface-form" lexica (e.g. RP, GAM, or a specific speaker) are automatically derived. *(p.1-2)*
- **Explicit, expert-authored phone-to-grapheme alignment** encoded directly in each Combilex base-form entry, maintained (and sometimes modified) through the automatic base→surface transformation, so alignments are available "for free" on any derived surface-form lexicon. *(p.2)*
- Empirical evaluation (using Festival's LTS/CART module) showing Combilex's manual alignment beats standard automatic (epsilon-scattering) alignment for LTS rule accuracy, and that Combilex-trained models beat OALD-trained models. *(p.2-3)*

## Methodology
LTS models are Classification and Regression Trees (CART) built with Festival's standard tools (including `wagon`), trained on a Combilex-derived RP surface-form lexicon. Two evaluation studies (I and II) compare models trained with **automatic alignment** (baseline, "B" models, using the "cumulate pairs" epsilon-scattering method from the Festvox build tools) against models trained with **Combilex's manual/expert alignment** ("M" models), holding all other training procedure constant. A further comparison is made against a previously published lexicon, OALD. Statistical significance of pairwise model differences is assessed via Welch's t-test after modeling proportion-correct as binomial/normal. *(p.2-3)*

## Key Equations / Statistical Models
None presented in closed form; the paper states the proportion of words correct was "estimated by normal distribution parameters" (i.e. treated as approximately normal via the binomial→normal approximation) and compared pairwise between models using **Welch's t-test**, with each successive improvement in Table 3's model ordering found significant at the 1% level. *(p.3)* No formula is given explicitly in the text.

## Parameters

| Name | Symbol | Units | Default | Range | Page | Notes |
|------|--------|-------|---------|-------|------|-------|
| Combilex standard-format RP surface lexicon size | — | entries | 143,641 | — | p.2 | Before Festival-format expansion (multiple POS tags per entry) |
| Expanded Festival-format lexicon size | — | entries | 212,465 | — | p.2 | After expanding multi-POS entries |
| Filtered/cleaned lexicon size (Evaluation I) | — | words | 155,340 | — | p.2 | After removing non-ASCII/apostrophe/space entries, non-English-tagged words, and keeping only most-frequent pronunciation variant per word |
| Test-set fraction | — | % | 10 | — | p.2 | Every 10th remaining entry held out as test data; rest used for training |
| Test-set size (approx.) | — | words / phones | ~15,000 words / ~130,000 phones | — | p.3 | Used across Evaluation I model comparisons (Table 3) |
| B1 misaligned/unusable words | — | words (%) | 99 (0.06%) | — | p.2 | Words that failed to align under epsilon-scattering `allowables`, in the baseline full-lexicon training set |
| OALD comparison lexicon size | — | words | 70,646 | — | p.3 | From prior study [6], vs Combilex's 155,340 |
| Significance threshold | — | — | 1% level | — | p.3 | Welch's t-test on each successive model-pair improvement in Table 3's ordering |
| Combilex funding | — | — | Scottish Enterprise Proof-of-Concept grant | — | p.4 | Development funding |
| Richmond's funding | — | — | EPSRC grant EP/E027741/1 | — | p.4 | |

## Effect Sizes / Key Quantitative Results

### Table 3 — Evaluation I: Initial models (full/pruned lexicon, ~15,000-word / ~130,000-phone test set)

| Outcome | Measure | Value | CI | p | Population/Context | Page |
|---------|---------|-------|----|---|--------------------|------|
| Words correct, model B1 | % words correct | 85.30 | — | — | Baseline, automatic alignment, full lexicon | p.3 |
| Phones correct, model B1 | % phones correct | 97.72 | — | — | Baseline, automatic alignment, full lexicon | p.3 |
| Words correct, model B2 | % words correct | 84.49 | — | — | Baseline, automatic alignment, words <4 letters removed | p.3 |
| Phones correct, model B2 | % phones correct | 97.44 | — | — | Baseline, automatic alignment, words <4 letters removed | p.3 |
| Words correct, model M1 | % words correct | 86.30 | — | — | Combilex manual alignment, full lexicon (incl. the 99 B1-unalignable words) | p.3 |
| Phones correct, model M1 | % phones correct | 97.90 | — | — | Combilex manual alignment, full lexicon | p.3 |
| Words correct, model M2 | % words correct | 86.50 | — | — | Combilex manual alignment, words <4 letters removed | p.3 |
| Phones correct, model M2 | % phones correct | 97.99 | — | — | Combilex manual alignment, words <4 letters removed | p.3 |
| Words correct, OALD baseline | % words correct | 78.13 | — | — | OALD-trained model, from prior study [6] | p.3 |
| Phones correct, OALD baseline | % phones correct | 93.97 | — | — | OALD-trained model, from prior study [6] | p.3 |
| Headline comparison | % words correct | 86.50 vs 84.49 | — | <0.01 (each stepwise improvement significant at 1% level, Welch's t-test) | Combilex manual alignment (M2, most general lexicon form) vs baseline automatic alignment (B2) | p.1, p.3 |

### Table 4 — Evaluation II: restricted/de-duplicated lexicon (one entry per orthographic form, no POS-tag duplicates)

| Outcome | Measure | Value | CI | p | Population/Context | Page |
|---------|---------|-------|----|---|--------------------|------|
| Words correct, model B3 | % words correct | 77.56 | — | — | Baseline, automatic alignment, restricted lexicon w/ short words | p.4 |
| Phones correct, model B3 | % phones correct | 85.65 | — | — | Baseline, automatic alignment, restricted lexicon w/ short words | p.4 |
| Words correct, model B4 | % words correct | 79.61 | — | — | Baseline, automatic alignment, restricted lexicon, short words removed | p.4 |
| Phones correct, model B4 | % phones correct | 96.69 | — | — | Baseline, automatic alignment, restricted lexicon, short words removed | p.4 |
| Words correct, model M3 | % words correct | 80.26 | — | — | Combilex manual alignment, restricted lexicon w/ short words | p.4 |
| Phones correct, model M3 | % phones correct | 97.02 | — | — | Combilex manual alignment, restricted lexicon w/ short words | p.4 |
| Words correct, model M4 | % words correct | 80.83 | — | — | Combilex manual alignment, restricted lexicon, short words removed | p.4 |
| Phones correct, model M4 | % phones correct | 97.15 | — | — | Combilex manual alignment, restricted lexicon, short words removed | p.4 |
| Words correct, OALD (repeated for comparison) | % words correct | 78.13 | — | — | Same OALD figure as Table 3, shown for comparison | p.4 |

## Methods & Implementation Details

### Combilex transcription scheme (Section 2, p.1-2)
- **Metaphones**: a symbol set that is a superset of the phones found across different English accents, based on SAMPA but modified/extended. Used to write **base-form** transcriptions, a generalization of how a word is pronounced across all accents of English. *(p.2)*
- Base-form transcriptions are automatically processed to generate accent-specific **surface-form** lexica: generic RP, generic GAM, or transcriptions tailored to a specific individual speaker. *(p.2)*
- Combilex is described as "accent-independent" in the same sense as UniSyn (Fitt & Isard's keyword lexicon), enabling automatic generation of surface lexica for any accent group or individual speaker. *(p.2)*
- Combilex is built and maintained by a **single lexicographer**, with a system of phonotactic constraints and automatic consistency-checking rules applied before any pronunciation is added, including live suggestions to the lexicographer during data entry. *(p.2, incl. footnote 2)*
- Morphological interdependency: only the minimal core set of basic words/morphemes have explicitly-coded pronunciations; all other predictable derived words/terms (the large majority) are generated automatically, keeping morphologically related pronunciations consistent under edits. *(p.2)*

### Phone-grapheme linking (Section 2.2, p.2)
- Every Combilex base-form transcription carries an alignment of its constituent metaphones to the corresponding graphemes in the word's orthography.
- This alignment is **maintained** (and in certain instances modified) automatically during base-form → surface-form conversion, so phone-grapheme alignments are available "for free" on any derived surface-form lexicon.

### Example transcription notation (Section 2.3, p.2, worked example: "newborn", Table 1)
```
base   { n " ju_ew }.{ b % O'_o r n }
RP     { n j,",u_ew }.{ b % O_o O_r n }
GAM 1  { n " u_ew }.{ b % O'_o r n }
GAM 2  { n j,",u_ew }.{ b % O'_o r n }
```
- Curly braces `{...}` mark free root morpheme boundaries — "newborn" is encoded as the compound of free root morphemes "new" and "born".
- `"` and `%` denote primary and secondary stress respectively; `.` marks a syllable boundary.
- Backtick `` ` `` indicates rhoticity, dropped in the RP surface form but retained in both GAM surface forms.
- Orthographic alignment: pairs of metaphone and grapheme tied together with underscore `_` (metaphone string left of underscore, grapheme right). E.g. `O_o` = the open-mid back rounded vowel (IPA /ɔ/) aligned to grapheme "o". Where metaphone and grapheme symbols are identical, the underscore+grapheme may be omitted as notational economy (e.g. plain `n` = alveolar nasal aligned to grapheme "n"). Where more than one metaphone symbol is associated with one grapheme, they are linked with `,`. The zero symbol `0` in the RP surface form represents a null metaphone (no acoustic realization) — e.g. Combilex could instead tie the `O` vowel to grapheme "or" but chooses to retain the correspondence to the "r" phone that occurs in other accents. *(p.2)*
- Worked example, "idealist" (Table 2, p.2):
```
Base  { ae_i . d " i@_ea l }. I_i s t >
RP    { aI_i . d " I@_ea l }. I_i s t >
GAM   { aI_i . d " i_e . @_a l }. I_i s t >
```
Shows that generating the RP surface form from base only requires changing two vowel metaphone symbols to their surface realization, while a particular GAM surface form could add an extra syllable to the "idea" root morpheme, in the process changing the phone-to-grapheme alignment (the "idea" root splits differently in the GAM example, `i_e . @_a` vs base's `i@_ea`). The paper notes explicitly they make no claim about correctness of this GAM syllabification, using it only to illustrate the automated manipulation capability. *(p.2, footnote 3)*

### Baseline (automatic-alignment) model construction (Section 3.1.1, p.3)
- Baseline LTS models B1/B2 use the same hand-seeded **epsilon-scattering** alignment technique from prior work [11] (Black, Lenzo, Pagel 1998), via the "cumulate pairs" grapheme/phoneme alignment method from the Festvox build tools — NOT using Combilex's included phone-grapheme alignments.
- B1: trained on the full 155,340-word surface-form lexicon. The `allowables` set specified for these baseline models meant all but 99 words (0.06%) in the training set aligned successfully and could be used in training.
- B2: trained on the same lexicon pruned to remove words shorter than 4 letters.

### Manually-aligned model construction (Section 3.1.2, p.3)
- M1: uses Combilex's phone-grapheme alignments; same training set as B1 plus the 99 words that failed automatic epsilon-scattering alignment.
- M2: trained using the same pruned (short-words-removed) training data as B2, but with Combilex's manual alignment.

### Lexicon preparation for Evaluation I (Section 3.1, p.2-3)
1. Generate a Combilex RP surface-form lexicon: 143,641 entries (standard Combilex format, multiple POS tags per entry possible).
2. Expand to Festival-compatible format (one entry per POS tag): 212,465 entries.
3. Filter: remove all entries with non-ASCII characters (mostly foreign names), entries with an apostrophe (mostly possessives/contractions) or a space (collocations); remove words explicitly tagged non-English (closely-assimilated loanwords like "baguette" were retained, only clearly foreign words like "anglaise" removed); keep only the most frequent pronunciation variant for words with multiple pronunciations (e.g. "either" — kept /i/-initial variant over /aɪ/-initial). Multiple entries per word retained only where associated with differing POS tags.
4. Result: 155,340-word lexicon. 10% of remaining entries (every 10th) set aside as test data; remainder used as training data.

### Lexicon preparation for Evaluation II (Section 3.2, p.3)
A more restricted/conservative lexicon: further filtered so each orthographic entity appears only once (rather than permitting multiple entries differing only by POS tag). This removed potential duplications (e.g. "hog" as noun and verb) and homographs such as "row". New models B3, B4, M3, M4 trained using the same procedures as B1, B2, M1, M2 respectively but on this restricted set.

### Statistical testing (Section 3.1.3, p.3)
Proportion of words correct treated as a binomial distribution, estimated via normal distribution parameters; pairwise model differences tested with Welch's t-test. Each subsequent improvement in the ordering presented in Table 3 (B1→B2→M1→M2, implicitly compared appropriately) found significant at the 1% level.

## Figures of Interest
- **Table 1 (p.2), "Combilex pronunciations for the word 'newborn'":** base, RP, GAM1, GAM2 transcriptions showing morpheme-boundary, stress, syllable, rhoticity, and phone-grapheme alignment notation (reproduced above under Methods).
- **Table 2 (p.2), "Combilex pronunciations for the word 'idealist'":** Base/RP/GAM transcriptions illustrating alignment change during base→surface derivation (reproduced above under Methods).
- **Table 3 (p.3), "Initial models: percentage of words and phones correct":** B1/B2/M1/M2/OALD comparison (reproduced above under Effect Sizes).
- **Table 4 (p.4), "Percentage words and phones correct, for restricted data set":** B3/B4/M3/M4/OALD comparison (reproduced above under Effect Sizes).

## Results Summary
Combilex's expert manual phone-grapheme alignment produces consistently better LTS models than automatic (epsilon-scattering) alignment across every matched pair in both evaluations (B1<M1, B2<M2, B3<M3, B4<M4 in words-correct and phones-correct), with each successive improvement in Table 3's model ordering significant at the 1% level. *(p.1, p.3)* All Combilex-trained models (including baselines) outperform the previously-published OALD-trained model (78.13% words correct), though the authors caution this OALD comparison is confounded by the two lexica's very different size and content (155,340 vs 70,646 words) so "difficult to draw further conclusions." *(p.3)* Removing short words (<4 letters) consistently improved results for automatically-aligned and manually-aligned models alike in Evaluation II, but *decreased* performance for the automatically-aligned baseline B2 in Evaluation I — an inconsistency the authors flag as unexplained and warranting further investigation. *(p.3)* Using the manual alignment also removes the need to hand-specify an `allowables` set of permitted letter-phone alignments, "greatly accelerat[ing]" LTS model building. *(p.1)* The authors conclude Combilex is a highly consistent lexicon, evidenced by the improved and more robust LTS rules it supports. *(p.4)*

## Limitations
- Interpreting LTS test results is inherently problematic: many words with easily-specifiable unique pronunciations are already in the lexicon and thus don't need LTS prediction in practice, so any lexicon-derived test set is "at best a poor approximation" of real LTS demand; words absent from pronunciation lexica (e.g. many foreign names) are often not pronounced consistently by humans anyway. *(p.4)*
- Multiple POS-tagged forms of the same word (e.g. "lock" appears 4× with different POS tags) inflate apparent train/test dependence, but removing all but one variant per word would also remove genuine homograph pronunciation differences (non-homophonous homographs). *(p.4)*
- Morphologically related word families (e.g. "locked"/"locker"/"locking") appearing across train/test splits may inflate LTS test performance, but removing them would prevent the model from being evaluated on generalizing morphological derivations (plurals, adjectival forms, etc.), which is argued to be unjustifiable to discard. *(p.4)*
- Authors state that, ultimately, if the test data is a subset of the lexicon, "all we can really test is the consistency of a lexicon" rather than true generalization to unseen words — though they argue this is itself a meaningful and important exercise. *(p.4)*
- OALD comparison is only "loose" — the two lexica differ substantially in size and content, limiting the strength of conclusions drawn from that comparison. *(p.3)*

## Arguments Against Prior Work
- CMU lexicon: relatively widely used, free, liberally licensed, but "commonly regarded as having variable quality," compiled from multiple sources including (reportedly) LTS rules themselves; lacks rich supplementary word-level information; specific to GAM accent only. *(p.1)*
- OALD: more consistent and has some supplementary word info, but smaller (~63,399 entries) and restricted to British English. *(p.1)*
- UniSyn: good entry count, richer information, multi-accent capable — but its license restricts use to purely academic research. *(p.1)*
- All pre-existing lexica share the problem of being finite and slow to update against a fluid, ever-growing language, necessitating LTS rules for coverage. *(p.1)*
- Standard data-driven LTS-building methods (decision trees [6]; Pronunciation by Analogy [7,8,9]) require a training set of letter-phone aligned words, typically obtained via automatic alignment, which the paper argues is a source of avoidable error; the HMM-based method of Taylor [10] is noted as a rare exception that doesn't strictly require pre-aligned training data (though it could still benefit from it if available). *(p.1-2)*

## Design Rationale
- Combilex is built with a **single lexicographer** plus automated phonotactic/consistency checking specifically to maximize internal consistency, on the theory that a more consistent source lexicon should yield more accurate and robust LTS rules — the paper's central hypothesis, which the results (Section 3) are designed to test directly. *(p.1-2)*
- The base-form/metaphone + automatic surface-form derivation architecture is explicitly chosen (like UniSyn) so **one lexicon serves many accents/speakers** without needing separately-authored per-accent lexica. *(p.1-2)*
- The explicit phone-grapheme alignment is authored once at the expert/base-form level and deliberately preserved (with only occasional necessary modification) through the automatic base→surface transformation specifically so that **every derived surface-form lexicon inherits a usable alignment for free**, without needing per-surface-lexicon re-alignment. *(p.2)*
- Choosing to retain the "r" phone correspondence for the `O` vowel in "newborn" rather than tying it to grapheme "or" is a deliberate design choice preserving cross-accent phone correspondence (since /r/ surfaces in other accents), even though an alternative alignment was possible. *(p.2)*
- The Evaluation II restricted lexicon (removing all POS-tag duplicate entries, not just multiple-pronunciation duplicates) was constructed specifically to reduce train/test overlap/duplication concerns raised about Evaluation I. *(p.3)*

## Testable Properties
- Explicit expert phone-grapheme alignment, when used to train Festival CART-based LTS models, yields higher words-correct and phones-correct accuracy than automatic (epsilon-scattering) alignment, holding lexicon and training procedure otherwise constant: **86.50% vs 84.49%** words correct on the full/pruned RP surface lexicon (Evaluation I, most general form). *(p.1, p.3)*
- This manual-alignment advantage held across all four matched B/M model pairs (B1/M1, B2/M2 in Evaluation I; B3/M3, B4/M4 in Evaluation II), for both words-correct and phones-correct metrics. *(p.3-4)*
- Each successive stepwise improvement in the Table 3 model ordering is statistically significant at the 1% level under Welch's t-test on the binomial/normal-approximated words-correct proportion. *(p.3)*
- Removing words <4 letters improves LTS accuracy under manual alignment and under most automatic-alignment settings, but *decreased* accuracy for automatic-alignment model B2 in Evaluation I specifically — flagged as an unexplained inconsistency, not a stable property. *(p.3)*
- Manual alignment eliminates the 0.06% (99/155,340-ish training words) "unalignable" gap that automatic epsilon-scattering alignment left in the B1 baseline. *(p.2-3)*

## Relevance to Project
Highly relevant complement to the founding Unisyn paper for a declarative TTS frontend treating **accent as a policy layer over one lexicon**: Combilex generalizes the same base-form/accent-neutral-symbol + automatic-surface-derivation architecture (explicitly compared to UniSyn, p.1-2) but replaces UniSyn's hand-transcribed keyword-lexical-set symbols with a superset "metaphone" (SAMPA-derived) symbol inventory, and adds a formally encoded, machine-usable **phone-to-grapheme alignment** carried through the base→surface transformation. This alignment is directly useful for building or improving letter-to-sound (grapheme-to-phoneme) rules for any derived accent lexicon "for free," which matters for handling out-of-lexicon words per accent in a declarative frontend. The paper's empirical result — that better source-lexicon consistency and explicit alignment meaningfully improve downstream LTS accuracy — supports investing in a clean, consistent, well-aligned base lexicon before layering accent-specific derivation and LTS rules on top. The explicit null-metaphone (`0`) and multi-metaphone-to-one-grapheme (`,`) notations are a useful precedent for representing non-1:1 phoneme/grapheme correspondences in a rule-based frontend's own alignment representation.

## Open Questions
- [ ] Future work (Section 6, p.4) proposes training a grapheme-to-phoneme model directly on Combilex **base-form** transcriptions and then converting the predicted pronunciation to a desired surface form via Combilex's standard automatic processing — but notes this would additionally require predicting stress and syllabification in many cases, which is left as future work and not solved in this paper.
- [ ] The unexplained inconsistency where removing short words (<4 letters) *decreased* performance for automatic-alignment baseline B2 (but improved performance elsewhere) is explicitly flagged as needing further investigation, not resolved here. *(p.3)*
- [ ] The paper does not specify exact stress/syllabification prediction rules or algorithms — only notes they'd be needed for the future base-form LTS approach.
- [ ] The full metaphone symbol inventory (the complete SAMPA-based superset) is not tabulated in this paper — only illustrated via the two worked examples (Tables 1-2).

## Related Work Worth Reading
- [1] "The Carnegie Mellon University pronouncing dictionary." http://www.speech.cs.cmu.edu/cgi-bin/cmudict. — Comparison lexicon (CMU/CMUdict), GAM-specific, discussed as a baseline alternative.
- [2] Mitten, R. "Computer-usable version of Oxford Advanced Learner's Dictionary of current english." Oxford Text Archive, 1992. — Source of the OALD comparison lexicon used in Evaluation.
- [3] Fitt, S. "Unisyn multi-accent lexicon." http://www.cstr.ed.ac.uk/projects/unisyn. — The companion/precursor multi-accent lexicon project (see [[Fitt_Isard_1999_SynthesisRegionalEnglishKeywordLexicon]]), explicitly compared to Combilex's accent-independence approach.
- [4] Fitt, S. and Richmond, K. "Redundancy and productivity in the speech technology lexicon - can we do better?" Proc. Interspeech, Sept. 2006, pp. 165-168. — Discusses design choices underlying Combilex's advanced features in more depth; directly referenced (p.1) as further reading on Combilex's design.
- [5] Fitt, S., Richmond, K., and Clark, R. "Combilex," http://www.cstr.ed.ac.uk/research/projects/combilex. — Project web page for obtaining/using Combilex.
- [6] Pagel, V., Lenzo, K., and Black, A. "Letter-to-sound rules for accented lexicon compression." Proc. ICSLP, Sydney, Australia, 1998. — Source of the OALD comparison results (78.13%/93.97%) used in Tables 3-4.
- [11] Black, A., Lenzo, K., and Pagel, V. "Issues in building general letter to sound rules." 3rd ESCA Workshop on Speech Synthesis, Jenolan Caves, Australia, 1998, pp. 77-80. — Source of the epsilon-scattering/cumulate-pairs automatic alignment technique used for baseline models B1-B4.
- [12] Bisani, M. and Ney, H. "Joint-sequence models for grapheme-to-phoneme conversion." Speech Communication, vol. 50, pp. 434-451, 2008. — Named as a potentially superior LTS method for future exploration with expert alignment.

## Collection Cross-References

### Already in Collection
- [Synthesis of Regional English Using a Keyword Lexicon](../Fitt_Isard_1999_SynthesisRegionalEnglishKeywordLexicon/notes.md) - reference [3]; this paper explicitly frames Combilex as accent-independent "similar to UniSyn," contrasting UniSyn's academic-only license with Combilex's wide-ranging license options, and both use the same base-lexicon-plus-accent-derivation architecture.
- [Issues in Building General Letter to Sound Rules](../Black_1998_LTS_Rules/notes.md) - references [11] and [6] (the same Black/Lenzo/Pagel author group's two 1998 papers are cited separately: "Issues in building general letter to sound rules" is the source of the epsilon-scattering automatic alignment baseline this paper compares against; "Letter-to-sound rules for accented lexicon compression" is the source of the OALD comparison figures)

### New Leads (Not Yet in Collection)
- Fitt, S. and Richmond, K. (2006) - "Redundancy and productivity in the speech technology lexicon - can we do better?" (Interspeech 2006) - reference [4]; discusses the design rationale behind Combilex's advanced features in more depth than this paper covers.

### Now in Collection (previously listed as leads)
- [Joint-Sequence Models for Grapheme-to-Phoneme Conversion](../Bisani_2008_Joint-sequenceModelsGrapheme-to-phonemeConversion/notes.md) - reference [12], named here as a stronger candidate LTS method for future work with expert alignment. Bisani & Ney's statistical joint-sequence M-gram model (trained by discounted EM over graphone units) is a fully data-driven alternative to this paper's CART/epsilon-scattering approach to letter-to-sound rules; both address the same lexicon-compression/generalization tradeoff for unknown-word pronunciation.

### Cited By (in Collection)
- (none found)

### Conceptual Links (not citation-based)
- [Pronunciation Modeling in Speech Synthesis](../Miller_1998_PronunciationModelingSpeechSynthesis/notes.md) - Miller's dissertation and this paper both sit at the lexicon/rule boundary of TTS pronunciation: Miller trains a neural network to predict postlexical (surface) realization from lexical (dictionary) form for one speaker, while Richmond, Clark & Fitt evaluate how lexicon quality and alignment improve letter-to-sound prediction for out-of-lexicon words feeding into that same lexical layer. Together they cover both halves of the TTS pronunciation pipeline (LTS for unknown words; lexical-to-surface postlexical rules for known words) that a declarative frontend needs to integrate.
- [Representing the Environments for Phonological Processes in an Accent-Independent Lexicon for Synthesis of English](../Fitt_Isard_1998_RepresentingEnvironmentsPhonologicalProcesses/notes.md) - this earlier paper (co-authored by Sue Fitt) poses the general lexicon-vs-rule-derivation design question that Combilex's metaphone-plus-explicit-alignment architecture later answers at full lexicon-construction scale: Combilex's base-form metaphone superset with automatically-preserved phone-grapheme alignment sits between that paper's candidate options ii (phoneme lexicon, synthesizer-side rules) and iii (meta-lexicon plus compiled sub-lexica), adding a formally encoded alignment layer neither option specifies.
