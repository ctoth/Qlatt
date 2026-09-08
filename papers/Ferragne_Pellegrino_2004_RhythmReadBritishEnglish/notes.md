---
title: "Rhythm in Read British English: Interdialect Variability"
authors: "Emmanuel Ferragne, François Pellegrino"
year: 2004
venue: "Interspeech 2004 / ICSLP (8th International Conference on Spoken Language Processing), Jeju Island, Korea, October 4-8 2004"
doi_url: "https://doi.org/10.21437/Interspeech.2004-39"
---

# Rhythm in Read British English: Interdialect Variability

## One-Sentence Summary
A preliminary, fully-automatic (no hand segmentation) acoustic study measuring rhythm metrics (PVI family, raw vowel/consonant durations) across 14 British English dialects plus French, to test whether duration-derived variables can serve as automatic dialect-identification predictors - finding vowel-duration-based measures (Dv, nPVIv') discriminate between dialects while consonant-duration measures (Dc, rPVIc') discriminate reliably only between English and French, not among English dialects. *(p.1)*

## Problem Addressed
Traditional English dialectology says little about quantitative rhythmic differences among British dialects, even though it is widely believed such differences exist (e.g., Northern British accents anecdotally retain full vowels where other varieties would reduce them; Scottish and Ulster English lack contrastive vowel length). This paper asks: (a) do rhythm-metric methods developed to discriminate world languages (stress-timed vs syllable-timed) transfer to discriminating dialects of a single language, and (b) can automatically (non-hand-labeled) extracted duration measurements supply reliable predictors for automatic dialect identification? *(p.1)*

## Key Contributions
- Applies the PVI approach of Grabe & Low (2002) to a 14-dialect subset of the Accents of the British Isles (ABI) corpus, fully automatically segmented (no manual labeling), which is itself a methodological contribution (testing whether automatic segmentation is adequate for rhythm metrics). *(p.1, p.2)*
- Distinguishes two working hypotheses: (i) vowel-duration variability more adequately captures rhythmic differences between the dialects; (ii) consonant-duration variability has poor discriminatory power between dialects because it is more a between-*language* feature. *(p.1)*
- Reports that consonant-based measures (Dc, rPVIc') robustly separate French from all English dialects but do NOT reliably separate English dialects from each other; vowel-based measures (Dv, nPVIv') do show statistically significant differences among English dialects. *(p.2-3)*
- Notes that no clean Northern/Southern (or historical Middle-English dialect area) clustering emerged from the duration metrics - dialects form a continuum rather than crisp categories. *(p.3)*
- Explicitly argues duration alone is insufficient for automatic dialect ID; other cues (intensity, pitch) are needed. *(p.3)*

## Study Design (empirical study characteristics)
- **Type:** Descriptive/comparative acoustic-phonetic study (fully automatic corpus-based measurement + non-parametric statistical testing), not a controlled experiment or clinical trial.
- **Corpus:** Subset of the Accents of the British Isles (ABI) corpus (20/20 Speech, "Accents of the British Isles," www.aurix.com) - 14 dialectal areas across the British Isles, ~20 speakers per dialect on average (10 male, 10 female). *(p.2)*
- **Materials:** 3 short read passages (~40 s each) per speaker, all speakers × all dialects = 852 passages total. *(p.2)*
- **Comparator:** A sample of French from the Eurom database (read speech, 10 speakers) used as a contrastive stress-timed-vs-non-reduction-language baseline. *(p.2)*
- **Note on corpus quality:** ABI passages sometimes contain spurious/non-linguistic noise (laughs, coughs) and some parts are repeated twice for some speakers - the corpus is "less constrained" than others used for similar purposes, increasing phonetico-phonological content variability across speakers. *(p.2)*

## Methodology
1. Sound files amplitude-normalized and automatically segmented (no hand labeling/segmentation at any stage). *(p.2)*
2. A speech-activity detector and a vowel-detection algorithm are applied (algorithms detailed in Pellegrino & André-Obrecht, 2000, *Signal Processing* - cited as ref [14]); these are based on detecting abrupt breaks in the waveform. *(p.2)*
3. Consequence of the algorithm: vowel segments tend to be reduced to their steady-state part; transitions tend to get mis-classified as consonants. This means vowel duration is systematically *underestimated*, and long vowels may be more affected by this bias than short/reduced vowels (short transitions). The vowel-detection algorithm also fails to detect unvoiced and very short vowels. *(p.2)*
4. Resulting consonant/vowel segmentation exported to Praat format; all further computation done via Praat scripts. *(p.2)*
5. Raw duration measurements: vowel duration (Dv) and duration of intervocalic (consonantal) intervals (Dc) computed - motivated by their prior demonstrated usefulness for automatic language identification (ref [15]). *(p.2)*
6. Pairwise Variability Indices (PVI): following Grabe & Low's (2002) method, adjacent segments of the same type (all vowels, or all consonants) are merged into one interval before PVI computation. Two PVIs computed: raw consonant-duration PVI (rPVIc) and normalized vowel-duration PVI (nPVIv). Whenever two adjacent same-type intervals (ci,ci+1 or vi,vi+1) were separated by a pause, that pair was *discarded*, specifically to exclude extreme values from phrase-final lengthening. *(p.2-3)*
7. Because averaging over whole passages was judged uninformative (PVI distributions per dimension are non-normal, with varying shapes), the authors instead computed a per-adjacent-pair (non-averaged) version of each index and ran Kruskal-Wallis tests (nonparametric one-way ANOVA) per dimension, including *all* individual pairwise values for each dialect (rather than per-speaker means). *(p.3)*

## Key Equations / Statistical Models

$$
rPVIc = \left[\sum_{i=1}^{n-1} |Dc_i - Dc_{i+1}| \right] / (n-1)
$$
Where: $n$ = number of consonantal intervals in a passage; $Dc_i$ = duration of the $i$-th consonantal interval. This is the *raw* consonant-interval PVI (not normalized), following [3] (Grabe & Low 2002). *(p.2)*

$$
nPVIv = 100 \times \left[\sum_{i=1}^{n-1} \left| \frac{Dv_i - Dv_{i+1}}{(Dv_i + Dv_{i+1})/2} \right| \right] / (n-1)
$$
Where: $n$ = number of vocalic intervals in a passage; $Dv_i$ = duration of the $i$-th vocalic interval. This is the *normalized* vowel-interval PVI, following [3]. Scaled by 100. *(p.2)*

$$
rPVIc' = \left| Dc_i - Dc_{i+1} \right|
$$
Where: this is the per-pair (unaveraged) raw consonantal-difference measure - the summand inside rPVIc's brackets, computed and tested pairwise (not averaged per passage/speaker) because the underlying PVI distributions are non-normal. Used as the dependent variable for a Kruskal-Wallis test across dialects (incl. French). *(p.3)*

$$
nPVIv' = 100 \times \left| \frac{Dv_i - Dv_{i+1}}{(Dv_i + Dv_{i+1})/2} \right|
$$
Where: the per-pair (unaveraged) normalized vowel-difference measure, analogous to rPVIc' but for vocalic intervals; also fed directly into Kruskal-Wallis testing per dialect pair. *(p.3)*

## Parameters

| Name | Symbol | Units | Default | Range | Page | Notes |
|------|--------|-------|---------|-------|------|-------|
| Number of dialectal areas sampled | - | count | 14 | - | p.2 | ABI corpus subset, British Isles |
| Speakers per dialect | - | count | ~20 (avg) | 10 male / 10 female | p.2 | ABI corpus |
| Passages per speaker | - | count | 3 | - | p.2 | ~40 s each, read speech |
| Total passages (all speakers × dialects) | - | count | 852 | - | p.2 | |
| French comparator speakers | - | count | 10 | - | p.2 | Eurom database, read speech |
| Approx. passage duration | - | seconds | 40 | - | p.2 | per passage |
| Significance threshold used | p | - | 0.001 | - | p.3 | Kruskal-Wallis tests on Dc, rPVIc', Dv, nPVIv' all reach p<0.001 across dialects+French |

## Effect Sizes / Key Quantitative Results

| Outcome | Measure | Value | CI | p | Population/Context | Page |
|---------|---------|-------|----|---|--------------------|------|
| Dc across dialects+French | Kruskal-Wallis | highly significant | - | <0.001 | 14 English dialects + French | p.3 |
| rPVIc' across dialects+French | Kruskal-Wallis | highly significant | - | <0.001 | 14 English dialects + French | p.3 |
| Dv across dialects+French | Kruskal-Wallis | significant, but Dv fails as reliable between-*language* (Eng vs Fr) discriminator | - | <0.001 | 14 English dialects + French | p.3 |
| nPVIv' across dialects+French | Kruskal-Wallis | significant | - | <0.001 | 14 English dialects + French | p.3 |
| French vs English separation on rPVIc/Dc/rPVIc' | post-hoc multiple comparison | French clearly and robustly separated from all English dialects | - | (post-hoc, fig. 2,3) | English dialects vs French | p.3, Fig.2, Fig.3 |
| English-dialect-internal separation on rPVIc'/Dc | post-hoc | poor - consonant measures not well suited to discriminating *among* English dialects | - | - | 14 English dialects | p.3, §5 |
| English-dialect-internal separation on Dv/nPVIv' | post-hoc | some dialects distinct from others (greater between-dialect variability than for consonant measures) | - | - | 14 English dialects | p.3, §5 |
| Total dialect discrimination achieved | - | NOT achieved - dialects form a continuum, no clean clustering (e.g., no Northern-vs-Southern split as hypothesized) | - | - | 14 English dialects | p.3, §4.3 |

## Methods & Implementation Details
- No prior hand-segmentation or hand-labeling anywhere in the pipeline - fully automatic vowel/consonant boundary detection from the raw waveform, based on detecting abrupt spectral/energy breaks (algorithm from Pellegrino & André-Obrecht 2000). *(p.2)*
- Segmentation artifact / systematic bias: the automatic algorithm tends to reduce detected vowel segments to their "steady part," classifying transitions as consonantal; this underestimates vowel duration, disproportionately for long vowels (whose transitions are relatively longer) versus short/reduced vowels. Unvoiced and very short vowels are missed entirely by the vowel detector. *(p.2)* - **This is a key caveat for any duration model built from automatically-segmented data: raw vowel-duration values from such pipelines are systematically compressed relative to hand-segmented "true" vowel duration, especially for long/tense vowels.**
- Segmentation exported to Praat format; PVI and duration computations implemented as Praat scripts. *(p.2)*
- Pause-adjacent pairs excluded from PVI computation specifically to avoid contaminating results with phrase-final lengthening effects. *(p.2)* - relevant caveat for any duration-model design: phrase-final lengthening is a distinct phenomenon from steady-state segmental duration variability and should be modeled/excluded separately.
- Non-parametric statistics (Kruskal-Wallis) chosen because PVI value distributions are non-normal and their shape varies across dimensions; per-pair (not per-speaker-averaged) values used as the test's data points to retain distributional information that averaging would destroy. *(p.3)*
- Absolute PVI/duration values obtained from automatic segmentation are explicitly flagged by the authors as *not directly comparable* to those from studies using manual segmentation (e.g., Grabe & Low's own hand-segmented cross-language PVI values) - only relative/comparative patterns within this automatically-segmented dataset are trustworthy. *(p.3)*

## Figures of Interest
- **Fig 1 (p.3):** rPVIc/nPVIv scatterplot (mean values per speaker) for 3 randomly chosen dialects (East Yorkshire, Inner London, Ulster) plus French - shows speakers of the same dialect do NOT cluster together on this 2D plane; rPVIc appears more useful than nPVIv for separating French from English generally.
- **Fig 2 (p.4):** "Dc – Multiple Comparison" - post-hoc multiple-comparison plot of mean duration of consonantal intervals, ranked, French clearly separated at low end from all English dialects, which cluster together at higher rank scores (roi lowest among English, nwa highest).
- **Fig 3 (p.4):** "rPVIc – Multiple Comparison" - same style plot for raw consonantal PVI; again French isolated at low end, English dialects overlapping in a tight cluster (ean...nwa).
- **Fig 4 (p.4):** "Dv – Multiple Comparison" - vowel duration multiple comparison; French (sse-adjacent) does NOT cleanly separate from English dialects here (overlapping intervals), consistent with the text's statement that Dv fails as a reliable English/French discriminator despite reaching significance.
- **Fig 5 (p.4):** "nPVIv – Multiple Comparison" - normalized vocalic PVI multiple comparison; shows more spread among English dialects than the consonant-based figures (gla lowest, ean highest among English), i.e., greater between-dialect variability on this dimension.
- **Table 1 (p.4):** Dialects of the ABI database with abbreviations: Birmingham (brm), Cornwall (crn), East Anglia (ean), East Yorkshire (eyk), Glasgow (gla), Inner London (ilo), Lancaster (lan), Liverpool (lvp), Newcastle (ncl), North Wales (nwa), Republic of Ireland (roi), Scottish Highlands (shl), Standard Southern English (sse), Ulster (uls).

## Results Summary
- rPVIc, rPVIc', and Dc (all consonant-duration-based measures) all robustly and reliably discriminate French from every English dialect (p<0.001, clean post-hoc separation), confirming consonant duration/PVI is essentially a between-*language* (stress-timed vs syllable-timed) feature - but these same measures do NOT reliably discriminate among the 14 English dialects from each other; hypothesis (ii) (consonant-duration variability is poor for dialect-level discrimination) is confirmed. *(p.3, §5)*
- Dv (raw vowel duration) reaches statistical significance across dialects+French but is NOT a reliable English/French discriminator by itself (overlapping post-hoc intervals in Fig. 4). *(p.3)*
- nPVIv' (normalized vocalic PVI, per-pair) DOES show significant, and comparatively larger, between-dialect variability among the English dialects - supporting hypothesis (i), that vowel-duration variability better captures dialect-internal rhythmic differences than consonant duration does. *(p.3, §5)*
- No clean partition of dialects emerged along the hypothesized Northern/Southern lines, nor along historical Middle-English dialect-area boundaries; instead results show a continuum of overlapping dialectal categories rather than crisp classes. *(p.3, §4.3)*
- Overall conclusion: duration-derived variables alone (even via PVI, which the authors consider intuitively a good indicator of rhythm) cannot be expected to "tell more than half the story" for automatic dialect identification; other acoustic cues such as intensity and pitch are needed in addition. *(p.4, §5)*

## Limitations
- Fully automatic segmentation introduces systematic vowel-duration underestimation and bias against long vowels (transitions misclassified as consonantal), and misses unvoiced/very short vowels - the paper explicitly notes this "bias" and how it likely differentially affects long vs. reduced vowels. *(p.2)*
- Absolute PVI/duration values from this automatically-segmented data are not directly comparable to manually-segmented studies' absolute values (e.g. Grabe & Low 2002); only relative comparisons within-study are safe to draw. *(p.3)*
- Corpus (ABI subset) is described by the authors as "less constrained" than other corpora used for similar rhythm studies: passages sometimes include spurious noises (laughs, coughs) and repeated content for some speakers, increasing cross-speaker phonetico-phonological content variability - a confound not fully controlled for. *(p.2)*
- Explicitly framed as a "preliminary report" - the authors state total (crisp) discrimination among dialects was not achieved, and the question needs further examination; they do not go into detail on the specific dialect-pair differences found. *(p.3, Introduction & §4.3)*
- Duration alone (their conclusion) is insufficient; the paper does not itself incorporate intensity or pitch, leaving that as future work rather than a result of this paper. *(p.4)*

## Arguments Against Prior Work
- Against Ramus, Nespor & Mehler (1999) [ref 6] and similar %V/ΔC-style measures: the paper argues (citing Wagner & Dellwo 2004 [10]) that these measures - especially the standard deviation of consonantal intervals - actually reflect the overall phonic impression produced by varying *syllabic complexity and diversity* across languages, and it is "highly questionable" whether syllabic complexity varies greatly across the dialects of British English (unlike across unrelated world languages). The paper instead wants a rhythm index that captures the *sequential* nature of speech rhythm - motivating their choice of the PVI approach (Grabe & Low 2002 [3]) over the Ramus et al. delta-C/%V approach for a within-language (dialectal) comparison. *(p.1-2, §2.2)*
- Notes (citing their own related study, Hamdi, Barkat-Defradas, Ferragne & Pellegrino, submitted Interspeech 2004 [11]) that the standard deviation of consonantal intervals is highly correlated with raw consonantal PVI, and the standard deviation of vocalic intervals is highly correlated with raw vocalic PVI - i.e., the two families of measures (Ramus-style ΔC/ΔV and Grabe/Low-style PVI) are largely redundant, "different ways of looking at the same thing," which justifies picking just one family (PVI) rather than computing both. *(p.2, §2.2)*
- Notes the traditional crisp "rhythm class" dichotomy (stress-timed vs syllable-timed vs mora-timed, per Pike 1945 [1] and Abercrombie 1967 [2]) has been "seriously questioned" in the literature, citing Grabe & Low [3] and Dauer [5], setting up their own finding of a continuum rather than crisp dialectal categories as consistent with that broader critique. *(p.1, p.3 §4.3)*

## Design Rationale
- Chose the PVI approach over the Ramus et al. %V/ΔC family specifically because PVI is described as "a more local index" - better suited to detecting the presumably-smaller rhythmic differences expected *within* one language's dialects (where mutual intelligibility is preserved) rather than the larger differences typically found *across* unrelated world languages. *(p.2, §2.2)*
- Deliberately tested vowel-duration and consonant-duration variability *separately as two competing hypotheses* rather than assuming a priori that both would behave alike, reasoning from independent linguistic evidence (Northern dialects reportedly retaining full unstressed vowels; Scottish/Ulster lacking contrastive vowel length) that vowel-duration variability specifically, not consonant variability, should carry the dialect-level rhythmic signal. *(p.1, §2.1)*
- Switched from averaging PVI per speaker/passage to using *all individual pairwise interval-difference values* per dialect in Kruskal-Wallis tests, specifically because visual inspection showed the underlying PVI distributions were non-normal and had shape that varied by dimension - averaging was judged to discard genuinely informative distributional shape. *(p.3, §4 opening)*
- Excluded consonant/vowel-interval pairs straddling a pause specifically to prevent phrase-final lengthening (a distinct, non-rhythmic-class-related durational phenomenon) from contaminating the PVI computation. *(p.2, §3.2.3)*

## Testable Properties
- Consonant-interval duration (Dc) and its PVI (rPVIc, rPVIc') should differ significantly (p<0.001) between French and any English dialect, but should NOT reliably differ pairwise among English dialects themselves. *(p.3)*
- Vowel-interval-duration variability (nPVIv') should show greater between-*dialect* (English-internal) variability than consonant-based measures do - i.e., a duration model per-accent should expect the vowel-duration/PVI channel, not the consonant-duration/PVI channel, to carry most of the accent-distinguishing rhythmic signal. *(p.3, §5)*
- Raw vowel duration alone (Dv), despite reaching significance in an omnibus test, should NOT be expected to cleanly separate English from French (or, by extension, one English dialect from another) in pairwise post-hoc comparison - significance in an omnibus non-parametric test does not imply usable pairwise discriminability. *(p.3, Fig. 4)*
- Any duration measurement pipeline using automatic (break-detection-based) segmentation should be expected to systematically underestimate vowel duration, with the underestimation bias larger for long/tense vowels than for short/reduced vowels (because vowel transitions get folded into the adjacent consonant interval). *(p.2)*
- Pause-adjacent consonant/vowel interval pairs should be excluded from any pairwise-difference/PVI-style computation, or phrase-final lengthening will inflate the measured variability independent of genuine rhythmic-class differences. *(p.2)*

## Relevance to Project
Directly relevant to any per-accent duration policy for synthetic speech: this paper's central empirical finding - that vowel-duration variability (not consonant-duration variability) is what actually differs measurably between English varieties/dialects - supports building an accent's rhythmic "signature" primarily through vowel-duration modulation (vowel-length contrasts, degree/rate of unstressed-vowel reduction) rather than through consonant-duration changes, which the paper shows track the English-vs-other-language boundary rather than within-English accent identity. It also supplies: (a) the exact rPVIc/nPVIv formulas (shared with Low, Grabe & Nolan 2000/Grabe & Low 2002) that a duration model could use as an internal metric/regression target to verify an accent's generated rhythm profile against corpus-observed PVI ranges; (b) an explicit caution that automatically-derived duration data compresses/biases long-vowel durations, relevant if any accent corpus statistics feeding the model were derived via automatic forced alignment rather than hand segmentation; (c) an explicit warning that duration alone is "less than half the story" for rhythm identity - a full accent model should also vary pitch/intensity patterns, not rely on duration/timing alone; (d) empirical grounding that British dialects do NOT fall into crisp Northern/Southern (or PVI-based) categories but form a continuum - a per-accent duration policy should therefore be parameterized continuously (e.g., along a vowel-duration-variability axis) rather than assigning each accent to one of a small number of discrete rhythm classes.

## Open Questions
- [ ] The paper explicitly leaves "no such rhythmic isogloss" (no clean Northern/Southern British clustering) as an open question needing further examination - does not identify which specific dialect *pairs* differ. *(p.3, §4.3)*
- [ ] Whether adding intensity and pitch as additional cues (as the authors recommend) would yield crisper (rather than continuum) dialectal categories is left unaddressed within this paper. *(p.4, §5)*
- [ ] Whether the systematic vowel-duration-underestimation bias of the automatic segmentation differentially affected results *across* dialects (e.g., dialects with more long vowels being more affected) is not analyzed.

## Collection Cross-References

### Already in Collection
- [Durational Variability in Speech and the Rhythm Class Hypothesis](../Grabe_Low_2002_DurationalVariabilityRhythmClass/notes.md) - source of the exact rPVIc/nPVIv formulas this paper applies (equations 1-2, cited as [3]); introduces the raw/normalized PVI distinction and the argument that vowel reduction (not overall vowel-time proportion) drives foot-level near-isochrony and the stress-timed rhythmic impression. This paper's central finding (vowel-duration variability, not consonant-duration variability, distinguishes English dialects) parallels Grabe & Low's finding that vocalic nPVI, not intervocalic rPVI, separates languages into rhythm classes.

### Now in Collection (previously listed as leads)
- [Durational Variability in Speech and the Rhythm Class Hypothesis](../Grabe_Low_2002_DurationalVariabilityRhythmClass/notes.md) - moved here from "New Leads" below (also duplicated in "Already in Collection" above per the forward-citation convention, since this paper explicitly cites it as reference [3]).

### New Leads (Not Yet in Collection)
- D. Deterding (2001) - "The measurement of rhythm: a comparison of Singapore and British English," Journal of Phonetics 29 - closest precedent for measuring rhythm differences between varieties of English.

### Now in Collection (previously listed as leads)
- [Correlates of linguistic rhythm in the speech signal](../Ramus_1999_CorrelatesLinguisticRhythmSpeech/notes.md) - the competing %V/ΔC rhythm-metric family this paper argues against for within-language dialect comparison (syllabic-complexity confound).

### Cited By (in Collection)
- (none found)

### Conceptual Links (not citation-based)
- [Formant frequencies of vowels in 13 accents of the British Isles](../Ferragne_2010_FormantFrequenciesVowels13/notes.md) - same first author (Ferragne) and same underlying corpus (Accents of the British Isles, ABI): that paper supplies per-accent spectral (F1/F2) vowel targets for the same 13-14 British dialects this paper measures rhythmically, and both note that duration (not just spectral quality) is sometimes the primary phonemic cue in a given accent - the two together give a duration+spectrum per-accent vowel profile from the same speaker population.
- [Hertz & Huffman 1992 - A Nucleus-Based Timing Model Applied to Multi-Dialect Speech Synthesis by Rule](../Hertz_1992_NucleusBasedTiming/notes.md) - both papers address multi-dialect duration modeling, but from opposite directions: Hertz & Huffman build a rule-based synthesis timing model that explicitly separates language-universal, dialect-universal, and dialect-specific duration components; Ferragne & Pellegrino instead show empirically (via automatically-extracted PVI/duration measures on real recordings) that within one language it is specifically vowel-duration variability, not consonant-duration variability, that carries dialect-distinguishing rhythmic signal - this is exactly the kind of empirical finding a "dialect-specific" duration component in Hertz & Huffman's architecture should be built from.
- [Rhythm, Timing and the Timing of Rhythm](../Arvaniti_2009_RhythmTimingTimingRhythm/notes.md) - Arvaniti argues that %V/ΔC and PVI rhythm-class metrics are description, not explanation, and that the field needs a positive account of what actually varies across languages; Ferragne & Pellegrino's within-language dialect finding (vocalic, not intervocalic, duration variability carries the rhythmic signal) is exactly the kind of fine-grained empirical result Arvaniti's critique calls for, and independently supports her skepticism that a single discrete rhythm-class label can capture the phenomenon. (Strong)

## Related Work Worth Reading
- [3] E. Grabe and E. L. Low, "Durational variability in speech and the rhythm class hypothesis," in *Papers in Laboratory Phonology 7*, Gussenhoven & Warner (eds.), CUP, 2002 - the source of the PVI formulas and method this paper directly applies; likely the fullest methodological description of nPVIv/rPVIc computation, worth reading alongside Low, Grabe & Nolan (2000) for the PVI derivation and original cross-language values. -> NOW IN COLLECTION: [Durational Variability in Speech and the Rhythm Class Hypothesis](../Grabe_Low_2002_DurationalVariabilityRhythmClass/notes.md)
- [6] F. Ramus, M. Nespor, J. Mehler, "Correlates of linguistic rhythm in the speech signal," *Cognition* 73, 1999 - the competing %V/ΔC family of rhythm metrics that this paper explicitly argues against using for within-language dialect comparison (syllabic-complexity confound).
- [8] D. Deterding, "The measurement of rhythm: a comparison of Singapore and British English," *Journal of Phonetics* 29, 2001 - directly relevant precedent for measuring rhythm differences between *varieties* of the same language (ties to Low, Grabe & Nolan 2000's Singapore English target).
- [10] P. S. Wagner and V. Dellwo, "Introducing YARD (Yet Another Rhythm Determination) and re-introducing isochrony to rhythm research," Speech Prosody, Nara, Japan, 2004 - source of this paper's critique of the Ramus et al. ΔC-standard-deviation measure as a syllabic-complexity proxy.
- [11] R. Hamdi, M. Barkat-Defradas, E. Ferragne, F. Pellegrino, "Speech Timing and Rhythmic Structure in Arabic Dialects: a comparison of two approaches," Interspeech 2004 (companion paper by overlapping authors) - reports the correlation between Ramus-style SD measures and PVI measures that justifies this paper's choice of PVI alone.
