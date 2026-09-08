---
title: "Rhythm, Timing and the Timing of Rhythm"
authors: "Amalia Arvaniti"
year: 2009
venue: "Phonetica 66(1-2):46-63"
doi_url: "https://doi.org/10.1159/000208930"
pages: "46-63"
affiliation: "Department of Linguistics, University of California, San Diego, La Jolla, Calif., USA"
---

# Rhythm, Timing and the Timing of Rhythm

## One-Sentence Summary
A critical review arguing that duration-based rhythm metrics (%V, ΔC, ΔV, nPVI, rPVI, VarcoV, VarcoC) are unreliable classifiers of linguistic rhythm because they measure *timing* (a consequence of segmental phonology and speaker/material choice) rather than *rhythm* (a perceptual organization of grouping and prominence), with the alternative proposal that rhythm in all languages arises from the universal principles of **grouping** and **prominence**. *(p.46)*

## Problem Addressed
The stress-timed/syllable-timed dichotomy lost credibility when isochrony was empirically disconfirmed, but was revived by rhythm metrics that quantify consonantal and vocalic durational variability. The paper asks whether those metrics actually deliver rhythmic classification, and concludes they do not: they conflate timing with rhythm, are unstable across metric choice, corpus, elicitation method, speaker, and materials, and rest on a psychologically questionable conception of rhythm. *(p.46-47)*

## Key Contributions
- A systematic demonstration that different metric families give *contradictory* classifications for the same language (Thai, Luxembourgish, Japanese, Polish). *(p.47-48)*
- New data (author's study with Tristie Ross and Naja Ferjan; 6 languages x 5 speakers x 3 elicitation methods) showing metric scores are dominated by speaker variability and material design, not language. *(p.49-53)*
- The demonstration that *materials* alone can move a language across the notional continuum: "stress-timed"-designed Spanish sentences score like uncontrolled English. *(p.52)*
- A critique of Dauer's [1983, 1987] parametric criteria as the theoretical foundation of metrics. *(p.54)*
- A positive proposal: rhythm = **grouping + prominence**, applied by the same principles in every language, with supporting evidence from Greek and English. *(p.47, later sections)*

## Study Design (author's study in progress)
- **Type:** Cross-linguistic production study (in progress at time of writing), with corpus manipulation. *(p.49)*
- **Languages (6):** English, German (traditionally stress-timed); Italian, Spanish (traditionally syllable-timed); Greek, Korean (classification unclear/disputed). *(p.49)*
- **Speakers:** n = 5 per language. *(p.51, fig. 3 caption)*
- **Metric families tested (3):** %V - ΔC [Ramus et al. 1999]; PVIs (nPVI, rPVI) [Grabe & Low 2002]; Varcos (VarcoV, VarcoC) [Dellwo 2006; White & Mattys 2007]. *(p.49)*
- **Elicitation methods (3):** read sentences (as in Ramus et al. 1999); read running text — "The North Wind and the Sun" (as in Grabe & Low 2002); spontaneous speech. *(p.49)*
- **Sentence corpus subsets (3 x 5 sentences):** (a) designed to be as "syllable-timed" as possible (simple CV alternations); (b) designed to be as "stress-timed" as possible (maximum feasible segmental variability); (c) uncontrolled sentences taken from well-known authors of each language (F. Scott Fitzgerald for English, Gabriel García Márquez for Spanish). *(p.49)*
- **Statistics:** Tukey HSD post-hoc tests, p < 0.05 for all reported pairwise differences. *(p.50)*

### Predictions set up before the results *(p.49-50)*
1. If running speech shows similar reduction across rhythmic types [Barry & Andreeva 2001], cross-language score differences should be *minimized* in running/spontaneous speech.
2. If rhythmic classes are real, differences should be *maximized* in spontaneous speech, which best reflects native rhythm.
3. If materials drive scores, "stress-timed" materials give stress-timed scores, "syllable-timed" materials give syllable-timed scores, and uncontrolled materials fall in between.
4. If classification is real, uncontrolled materials should pattern with the subset representative of each language's own class (uncontrolled English ~ "stress-timed" English corpus; uncontrolled Italian ~ "syllable-timed" Italian corpus).

## Methodology (metric definitions as used in the paper)
- **%V** — percentage of the utterance duration occupied by vocalic intervals. *(p.47)*
- **ΔC** — standard deviation of consonantal (intervocalic) interval durations. *(p.47)*
- **ΔV** — standard deviation of vocalic interval durations. *(p.47, fig. 1b)*
- **nPVI / rPVI** — normalized / raw pairwise variability indices: pairwise comparisons of *successive* vocalic (nPVI) and intervocalic (rPVI) intervals. nPVI normalizes for speaking rate. [Grabe & Low 2002, following Low et al. 2000] *(p.47)*
- **VarcoV / VarcoC** — variation coefficients (measures of relative variation), i.e. standard deviation normalized by mean, for vocalic and consonantal intervals. [Dellwo 2006; White & Mattys 2007] *(p.49)*
- Expected pattern under the classical hypothesis: stress-timed languages have high PVIs and high ΔC and low %V; syllable-timed languages the reverse. *(p.48)*

## Key Equations / Statistical Models

The paper cites the metrics by name rather than restating their formulas. The two formulas below are the standard definitions the paper presupposes (Grabe & Low 2002; Low et al. 2000), reconstructed for implementation; the paper itself gives only the verbal definitions on p.47.

$$
\mathrm{rPVI} = \frac{1}{m-1}\sum_{k=1}^{m-1} \left| d_k - d_{k+1} \right|
$$
Where: $d_k$ = duration (ms) of the $k$-th interval in the sequence (vocalic or intervocalic), $m$ = number of intervals. Raw, not rate-normalized. *(p.47, verbal definition)*

$$
\mathrm{nPVI} = 100 \times \frac{1}{m-1}\sum_{k=1}^{m-1} \left| \frac{d_k - d_{k+1}}{(d_k + d_{k+1})/2} \right|
$$
Where: as above; division by the local mean of the interval pair normalizes for speaking rate. *(p.47, verbal definition; rate normalization noted p.48)*

$$
\%V = 100 \times \frac{\sum_{i} v_i}{\sum_i v_i + \sum_j c_j}
$$
Where: $v_i$ = duration of the $i$-th vocalic interval, $c_j$ = duration of the $j$-th intervocalic (consonantal) interval. *(p.47, verbal definition)*

$$
\Delta C = \operatorname{sd}(c_j), \qquad \Delta V = \operatorname{sd}(v_i)
$$
Where: sd = standard deviation over the utterance, in ms (or in s as plotted in fig. 1b, range 0.03-0.06). *(p.47)*

$$
\mathrm{VarcoC} = 100 \times \frac{\operatorname{sd}(c_j)}{\operatorname{mean}(c_j)}, \qquad \mathrm{VarcoV} = 100 \times \frac{\operatorname{sd}(v_i)}{\operatorname{mean}(v_i)}
$$
Where: coefficient of variation of intervocalic / vocalic interval durations. *(p.49, verbal definition)*

$$
D_{\text{English},L} = \sqrt{\sum_{m \in M} \left( s_m^{\text{English}} - s_m^{L} \right)^2}
$$
Where: $M$ = the pair of metrics in a family (e.g. {%V, ΔC}), $s_m^L$ = mean score of language $L$ on metric $m$; the Euclidean distance reported in table 2 with English as reference. Larger = rhythmically less similar to English. *(p.52, table 2)*

## Parameters

### Metric-score axis ranges observed in the paper's figures

| Name | Symbol | Units | Default | Range | Page | Notes |
|------|--------|-------|---------|-------|------|-------|
| Normalized pairwise variability index | nPVI | - (index x100) | - | 20-75 across figures | 48, 49, 51, 52, 53 | Vocalic intervals; rate-normalized |
| Raw pairwise variability index | rPVI | ms | - | 3.5-80 across figures | 48, 49, 51, 52, 53 | Intervocalic intervals; fig. 1a plots rPVI 3.5-7 in different scaling |
| Percentage vocalic | %V | % | - | 35-70 | 48, 49, 51, 52, 53 | Ramus et al. metric |
| SD of consonantal intervals | ΔC | s (fig.1) / ms-scaled (figs 3-6) | - | 0.03-0.06 s (fig.1b/c); 25-70 (figs 3-6) | 48, 51, 52, 53, 54 | Unit scaling differs between reproduced Ramus figures and author's figures |
| SD of vocalic intervals | ΔV | s | - | 0.02-0.05 | 48 | Fig. 1b only |
| Vocalic variation coefficient | VarcoV | - | - | 40-75 | 51, 52, 53 | sd/mean x100 |
| Consonantal variation coefficient | VarcoC | - | - | 35-75 | 51, 52, 53 | sd/mean x100 |
| Speakers per language | n | speakers | 5 | - | 51 | Author's study |
| Languages in Grabe & Low corpus | - | languages | 18 | - | 47 | |
| Languages in Ramus et al. corpus | - | languages | 8 | - | 48 | CA, DU, EN, FR, IT, JA, PO, SP |
| Significance threshold | p | - | 0.05 | - | 50 | Tukey HSD post-hoc |

### Correlations reported (Grabe & Low 2002 data, recomputed by the author)

| Name | Symbol | Units | Default | Range | Page | Notes |
|------|--------|-------|---------|-------|------|-------|
| nPVI-rPVI correlation | r | - | 0.019 | - | 48 | Essentially zero; kills the "continuum" reading |
| %V-ΔC correlation | r | - | -0.26 | - | 48 | Weak; wrong sign for a coherent continuum |

### Classification success rates

| Name | Symbol | Units | Default | Range | Page | Notes |
|------|--------|-------|---------|-------|------|-------|
| Classification success, nonprototypical languages | - | % | 33 | - | 47 | 4 of 13 nonprototypical languages of Grabe & Low 2002 |
| Prototypical languages correctly classified | - | languages | 5 | - | 47 | British English, Dutch, German (stress); Spanish, French (syllable) |
| Unclassifiable languages | - | languages | 9 | - | 47 | Greek, Malay, Romanian, Singapore English, Tamil, Welsh + mixed: Catalan, Estonian, Polish |
| Unambiguously classified nonprototypical | - | languages | 4 | - | 47 | Thai (stress); Japanese, Luxembourgish, Mandarin (syllable) |
| Dauer criteria count | - | criteria | 8 | - | 54 | English scores + on 6 of 8; French scores - on 5 of 8 |

### Table 2 — Euclidean distances from English, pooled over all materials *(p.52)*

| Metric family | German | Italian | Korean | Spanish | Greek |
|---------------|--------|---------|--------|---------|-------|
| %V - ΔC | 3.8 | 15.4 | 12.6 | 11.2 | 13.1 |
| Varcos | 0.9 | 3.4 | 5.0 | 5.7 | 5.0 |
| PVIs | 1.5 | 20.2 | 14.8 | 14.6 | 16.6 |

Larger = rhythmically less similar to English. Note the families disagree on the *ordering* of the non-Germanic languages (e.g. Varcos rank Spanish farthest, PVIs rank Italian farthest). *(p.52)*

### Table 1 — Example English materials *(p.50)*

| Type | Example sentence |
|------|------------------|
| 'Stress-timed' | *The production increased by three fifths in the last quarter of 2007* |
| 'Syllable-timed' | *Lara saw Bobby when she was on the way to the photocopy room* |
| Uncontrolled | *I called Gatsby's house a few minutes later, but the line was busy* |

## Results Summary (metric critique, sections 2-3)

**Metric families contradict each other on the same language.** PVIs classify Thai as stress-timed but %V-ΔC classify it as syllable-timed; the reverse holds for Luxembourgish. %V-ΔC sets Japanese apart (supporting mora-timing as a third category) while PVI scores group Japanese with syllable-timed languages. *(p.47)*

**Grabe & Low [2002], 18 languages.** 5 prototypical languages classified as expected; 9 unclassifiable or mixed; 4 nonprototypical classified with some success. Success rate among nonprototypical languages: at best 33%. *(p.47)*

**Ramus's [2002] defense fails on inspection.** Ramus argued Grabe & Low lacked a controlled corpus and speech-rate control (despite nPVI being rate-normalizing) and computed PVIs on the Ramus et al. [1999] controlled corpus, finding "striking" similitude. Arvaniti notes that the similarity holds only if PVIs are compared to ΔV-ΔC, **not** to %V-ΔC — and %V-ΔC is precisely the pair Ramus et al. claim best classifies languages. Under %V-ΔC, Polish groups with stress-timed English and Dutch (fig. 1c), while under PVIs Polish sits near the syllable-timed languages (fig. 1a). *(p.47-48)*

**The continuum claim is unsupported.** If a stress/syllable continuum existed (whether as a true continuum or two clusters), vocalic and consonantal scores should correlate. They do not: r = 0.019 for nPVI-rPVI and r = -0.26 for %V-ΔC on the Grabe & Low data. This makes the ordering-of-languages dispute moot. *(p.48)*

**Speaker variability swamps language.** In the author's data, individual speakers of each language do not form distinct groups on any metric pair (fig. 3). VarcoV scores pooled over elicitation methods show **no significant effect of language** at all. *(p.50-51)*

**Differences, where present, run in unexpected and inconsistent directions.** *(p.50)*
- %V: German < Italian, Korean, Spanish, Greek; English < Italian, Korean, Greek; English %V not distinct from Spanish.
- nPVI: English > all other five languages; German not distinct from Korean or Greek.
- ΔC, VarcoC, rPVI: generally higher for German and English, but English VarcoC not different from Italian, and German rPVI not different from Korean or Greek.
- Net: %V-ΔC and PVIs both separate English/German from the rest, but %V-ΔC says German is *more* stress-timed than English while PVIs say the opposite (fig. 4). Varcos show no clear two-group separation at all, and Greek and Korean Varco scores are practically identical.

**Spontaneous speech degrades, rather than sharpens, the distinctions.** *(p.51)* In spontaneous data (fig. 5) English and German separate more visibly for PVIs and Varcos, but statistically: **none** of the cross-language vocalic comparisons reached significance; VarcoC showed no significant differences at all; for ΔC only Italian < English and Italian < German; for rPVI only English > Italian, Spanish, Greek and German > Italian. All other pairwise comparisons failed. This falsifies prediction 2 above.

**Materials can relocate a language on the "continuum."** *(p.52-53, fig. 6)* Scores for uncontrolled English materials and "stress-timed" Spanish materials are virtually identical. "Stress-timed" Greek and uncontrolled Spanish are very similar to each other and close to "syllable-timed" English. The within-language spread produced purely by choice of sentence subset is comparable to the *between-language* spread of the eight languages in Ramus et al. [1999] (fig. 1c). Ordering by subset:
- English ΔC: stress-timed > syllable-timed, uncontrolled.
- Spanish ΔC: stress-timed > syllable-timed, uncontrolled; and uncontrolled > syllable-timed.
- Greek ΔC: stress-timed > syllable-timed, uncontrolled.
- English %V: stress-timed < syllable-timed, and syllable-timed < uncontrolled.
- Spanish %V: stress-timed < syllable-timed.
- Greek %V: stress-timed < syllable-timed.

**Overall verdict on metrics.** Prototypical languages can be separated along *some* dimension with varying success [Ramus et al. 1999; Grabe & Low 2002; Lee & McAngus Todd 2004; Rouas et al. 2005; White & Mattys 2007]. But nonprototypical languages — Latvian [Stockmal et al. 2005], Tamil [Keane 2006], Greek [Baltazani 2007], Korean [Lee et al. 1994], Bulgarian [Barry et al. 2003] — seriously question the ability of metrics to classify all languages. Elicitation and corpus manipulation cast doubt on robustness: differences vanish in spontaneous speech and read-material design significantly shifts scores and hence classification. *(p.53)*

## Section 3: Reasons for the Lack of Metric Success (begins p.53)

**Dauer's criteria are the theoretical foundation, and they are not about duration.** Ramus et al. [1999] and Grabe & Low [2002] ground metrics in the rhythmic classification parameters of Dauer [1983, 1987]. Dauer [1987] gave **eight parametric criteria** for placing languages on a rhythmic continuum. Crucially, these criteria were **not meant to reflect durational variation per se**, but the extent to which a language has **easily defined prominences** (*stresses* in Dauer 1983; *accents* in Dauer 1987). Dauer's list is not purely phonetic: some criteria are directly reflected in phonetic timing (e.g. presence/absence of duration differences between stressed and unstressed syllables), while others relate to timing only indirectly if at all (e.g. the function of pitch in the language; the relationship between tone and stress in tone and pitch-accent languages). *(p.54)*

**Dauer's criteria are themselves untested and falter on nonprototypical languages.** They are generally accepted but have not been rigorously tested. English scores plus on six of eight criteria; French scores minus on five, placing them at opposite ends — but there is no compelling reason the criteria should work synergistically in all languages [see Barry et al. 2003 on Bulgarian and German]. Studies show languages of supposedly different rhythmic types do **not** show different reduction patterns in running speech, contrary to Dauer's expectation [Roach 1982; Barry & Andreeva 2001]. *(p.54)*

## Figures of Interest
- **Fig. 1 (p.48):** PVI scores (a), ΔV-ΔC (b), and %V-ΔC (c) for the Ramus et al. [1999] corpus, as presented in Ramus [2002] and Ramus et al. [1999]. Languages: CA Catalan, DU Dutch, EN English, FR French, IT Italian, JA Japanese, PO Polish, SP Spanish. Shows Polish flipping sides between panels (a) and (c).
- **Fig. 2 (p.49):** Scatterplots + regression lines for (a) rPVI vs nPVI and (b) ΔC vs %V over the 18 Grabe & Low [2002] languages. Visual demonstration of the near-zero correlations.
- **Fig. 3 (p.51):** Per-speaker scatterplots (n = 5 per language) for (a) %V-ΔC, (b) Varcos, (c) PVIs in the author's study. Speakers of one language do not cluster.
- **Fig. 4 (p.52):** Language means pooled over the entire corpus, (a) %V-ΔC, (b) VarcoV-VarcoC, (c) nPVI-rPVI, with error bars. English/German separation, direction disagreement between families.
- **Fig. 5 (p.53):** Same three panels computed over the **spontaneous speech** subset only. Larger apparent separation, but no statistical support.
- **Fig. 6 (p.54):** %V-ΔC for English, Spanish and Greek broken down by sentence subset (stress-timed / syllable-timed / uncontrolled). The material effect is as large as the classic between-language effect.

## Section 3 continued: Why timing is not rhythm (p.55-57)

**Dauer's own continuum contradicts the evidence on stress strength.** Dauer [1983] places Greek and Spanish toward the middle of her continuum, implying weak stress. Yet Dauer [1983, p.58] herself noted that Greek, Spanish and Italian have a "clearly discernible 'beat'" — the main feature of stress-timed languages in her view — even though they were never labeled stress-timed. Stress has robust acoustic correlates in all three: Greek [Botinis 1989; Arvaniti 1994, 2000], Italian [Farnetani & Kori 1990; D'Imperio & Rosenthall 1999], Spanish [Ortega-Llebaria & Prieto 2007]. So the rhythmic classification of Italian, Spanish and Greek is at odds with the strength of stress in them, and those features are in turn at odds with Dauer's own conception of rhythmic types as resting on the strength of local prominences. *(p.55)*

**Metrics implement only the timing-related subset of already-mediocre criteria.** In doing so they are "not much different from classic measures of isochrony," because they assume a simple, straightforward relationship between duration and abstract phonological categories such as syllable structure, vowel weight, and vowel reduction patterns. *(p.55)*

**Problem 1: segment duration has many confounding determinants.** *(p.55)*
- Geminate consonants and/or contrastive vocalic length distinctions.
- Even in languages without contrastive duration: language-specific inherent segment durations; contextual effects of voicing and syllabic position; stress-, accent- and focus-related lengthening; contextually and prosodically determined vowel reduction; phrase-final lengthening; allophonic changes of consonants and vowels in stressed vs unstressed syllables. Reviews: Klatt [1976] for English, Arvaniti [2007] for Greek, Turk & Shattuck-Hufnagel [2000] cross-linguistically.
- **Worked example — Greek unstressed high-vowel reduction.** Since Dauer [1980] reduction was assumed to be governed by local context (abutting voiceless consonants). Tserdanelis [2005] showed reduction is strongly governed by **prosodic position** instead: phrase-*initial* high vowels are elided, but phrase-*final* ones in the same local segmental context do **not** elide if they must carry the intonational tune. *(p.55)*
- Conclusion: metrics "can at best provide crude measures of speech timing and variability; but they cannot reflect the origins of the variation they measure and thus they cannot convey an overall rhythmic impression." *(p.55)*

**The L2 counterexample: identical scores from opposite mechanisms.** Korean and Spanish L2 speakers of English achieve similarly high consonantal-variability scores, not statistically different from L1 English speakers. But the mechanisms differ completely: **Korean L2 speakers show extreme phrase-final lengthening; Spanish L2 speakers show extreme lenition of intervocalic consonants.** Both raise consonantal variability and hence the score, but the auditory effects are entirely different and neither yields an English-like rhythm. This is the paper's cleanest demonstration that a metric score is many-to-one over mechanisms. *(p.55)*

**Problem 2: duration does not vary uniformly across languages or within a rhythmic type.** Polysyllabic shortening applies in both English [Turk & Shattuck-Hufnagel 2000] and Greek [Baltazani 2007], but word-final and accentual lengthening apply only in English, not in Greek [Botinis 1989 chap. 2, on accentual lengthening; Arvaniti 2000, on word-final lengthening]. *(p.56)*

**Problem 3: circularity.** Metrics equate rhythm with timing, so the relation between the metrics and the definition of rhythm they rest on is circular [see also Bertinetto & Bertini 2008]. Devising more sophisticated metrics that normalize speech rate or model more duration factors [Frota & Vigário 2001; Wagner & Dellwo 2004; Dellwo 2006] cannot fix this — the problem is not the absence of the right mathematical manipulation of duration. *(p.56)*

**Consequence of circularity: no independent measure of metric success.** Scores are judged similar or different according to whether that judgment supports the preexisting classification. Within-category differences can exceed between-category differences, and some differences run the wrong way (table 3). *(p.56)*

### Table 3 — Score differences within vs across rhythmic types [after Grabe & Low 2002] *(p.56)*

| Grouping | nPVI score differences | rPVI score differences |
|----------|------------------------|------------------------|
| Stress-timed languages | nPVI(Th) - nPVI(BE) = 8.6 | rPVI(BE) - rPVI(Gm) = 8.8 |
| Syllable-timed languages | nPVI(Fr) - nPVI(Mn) = 16.5 | rPVI(Jp) - rPVI(Fr) = 12.1 |
| Languages of different types | nPVI(BE) - nPVI(Fr) = 13.7 | rPVI(Sp) - rPVI(Gm) = 2.4 |
| Languages of different types | nPVI(Gm) - nPVI(Fr) = 16.2 | rPVI(Sp) - rPVI(Th) = 1.2 |

Key: BE = British English, D = Dutch, Fr = French, Gm = German, Jp = Japanese, Mn = Mandarin, Sp = Spanish, Th = Thai. The within-syllable-timed French-Mandarin gap (16.5) exceeds the prototypical cross-type British English-French gap (13.7); the cross-type Spanish-Thai rPVI gap is only 1.2. *(p.56)*

**Euclidean-distance inconsistencies with English as reference [Grabe & Low 2002 data].** *(p.56-57)*

| Comparison | Distance from English | Page |
|------------|----------------------|------|
| Greek (unclassified) via PVIs | 9.6 | 57 |
| Dutch (stress-timed) via PVIs | 10.7 | 57 |
| Thai (stress-timed) via PVIs | 11.5 | 57 |
| Japanese via %V-ΔC (closest language to English!) | 4.5 | 57 |

**Grabe & Low's own interpretation is driven by preexisting classification, not by scores.** They conclude Singapore English "is not at all close to the traditional syllable-timed languages, French or Spanish" even though: the nPVI difference between French and Spanish (13.8) is *larger* than that between French and Singapore English (8.8); and the rPVI difference between Spanish and Singapore English (10.5) is only three points larger than that between French and Spanish themselves (7.3). *(p.57)*

## Section 4: Towards a New Conception of Rhythm (p.57-)

**Requirement stated.** Without independent criteria for language rhythm, no *independent* and *meaningful* measure of score similarity is possible for any rhythm quantification: independence avoids circularity, meaningfulness avoids tautology so the measure reflects rhythmic rather than purely statistical/geometric differences between scores. *(p.57)*

**Psychological definition of rhythm adopted.** In psychological research, rhythm is the *perception of series of stimuli as series of groups of similar and repetitive pattern* [Woodrow 1951; Fraisse 1963, 1982]. Grouping relies not just on duration but on relative intensity, relative and absolute duration, and the temporal spacing of elements. *(p.57)*

**Meter vs grouping.** The definition implies **meter**, distinguished from **grouping**: grouping deals with phenomena extending over time; meter is an abstract representation resting on the alternation of strong and weak elements, *not* on absolute or relative durations [Lerdahl & Jackendoff 1983]. *(p.57)*

**Argument A against syllable-timing: temporal spacing / fusion.** Syllable-timing is usually described as a *cadence*, the simplest rhythm, "produced by the simple repetition of the same stimulus at a constant frequency" [Fraisse 1982, p.151]. For rhythm to be perceived, events must be separated enough not to **fuse**, yet close enough that several fall within the **psychological present** — "the temporal extent of stimulations that can be perceived at a given time, without the intervention of rehearsal during or after the stimulation" [Fraisse 1987, p.205, cited in Clarke 1999, p.474], estimated to span **3-8 s** [Clarke 1999]. For sounds, spacing must be at least **200 ms** for fusion to be avoided [Fraisse 1982]. But so-called syllable-timed languages speak far faster: Dauer [1983] gives a pooled average of **7.3 syllables/s** for Spanish, Greek and Italian, i.e. a syllable every **136 ms** — below the fusion threshold. And that rate is likely low, being lab speech: Baltazani [2007] reports **9.9-10.3 syllables/s** for Greek. Creating a syllable cadence would therefore be difficult at best. *(p.58)*

**Argument B against syllable-timing: subjective rhythmization.** Subjects presented with series of *identical* stimuli impose rhythmic structure by hearing some as more prominent — typically grouping into trochees or iambs (with a slight preference for trochees) and building larger constituents on those units [Woodrow 1951; Fraisse 1963, 1982]. A clock's beating is heard as a series of trochees. This is irreconcilable with the equal prominence of all syllables that syllable-timing requires; the idea that all syllables are *perceived* as the same is psychologically improbable by definition. *(p.58)*

**Argument C: syllable-timing forces a two-principle theory of rhythm.** If syllable-timing rests on isochronous *production* of syllables, speakers strive for an acoustic effect listeners discard. Even if defensible, syllable-timing implies that speakers of some languages construe linguistic rhythm along different principles from the rest of their timing experience, and different from stress-timed speakers, since stress-timing relies on grouping and alternation of more/less prominent syllables (feet contain both) while syllable-timing does not. *(p.58)*

**The positive proposal.** Models of rhythm will be more successful if they rely on the same psychologically plausible notions of **grouping** and **relative prominence** in **all** languages. Dauer [1983] was partly doing this: she proposed that stress is the basis of rhythm in all languages and that the continuum runs not from syllable-timing to stress-timing [as claimed e.g. in Ramus et al. 1999, p.269] but **from least to most stress-based**. *(p.58)*

**Dauer's interstress-interval data support the universal-grouping view.** *(p.58)* Stresses appear neither more regularly nor more frequently in stress-timed English than in Spanish, Greek or Italian. Cross-linguistic comparisons of interstress interval duration showed **no statistical differences**; means:

| Language | Mean interstress interval | Page |
|----------|--------------------------|------|
| Thai | 380 ms | 58 |
| Italian | 468 ms | 58 |
| Spanish | 477 ms | 58 |
| Greek | 483 ms | 58 |
| English | 493 ms | 58 |

So stressed syllables appear roughly every half second, allowing **6-10 beats within the psychological present**. That rate is not merely sufficient for rhythm perception; it is very close to the **preferred tempo** — events spaced every **0.5-0.6 s**, judged neither slow nor fast, the pace most likely to induce good synchronization between external aural stimuli and human tapping (**natural tempo**) [Fraisse 1982; Dowling & Harwood 1986; Clarke 1999]. *(p.58)*

**Regularity need not be in the signal: anticipation.** Interstress intervals in Dauer [1983] ranged **300-700 ms**, so acoustic regularity is intermittent. Rhythmic patterning survives via **anticipation** [Fraisse 1982] — the tendency to keep hearing an established rhythmic pattern in the absence of regularity. Dilley & McAuley [2008] tested this with linguistic material: listeners were more likely to hear the last two words of *long hand shake* as the compound *handshake* if the rhythm and/or intonation of a preceding list (*worthy vinyl life*) predisposed them to trochees, linking *life* with *long* (giving *worthy vinyl lifelong handshake*); a pattern predisposing a break after *life* yielded the grouping *longhand shake* instead. *(p.59)*

**The timing/rhythm distinction, imported from music psychology.** *Timing* concerns the durational characteristics of events; *rhythm* is the pattern of periodicities extracted from those durations. The pattern survives durational variation because listeners **assign durations to categories** while remaining sensitive to the nuances the variation conveys [Clarke 1999]. Applied to speech: listeners extract an utterance's rhythmic pattern by classifying prosodic entities (syllables, feet, phrases) as more or less prominent on durational and other cues, while simultaneously noting that the speaker draws out stressed vowels or swallows unstressed ones. *(p.59)*

**Implication: durational variability plays only a small role in creating rhythm**, and its importance in phonetic studies of rhythm is likely overestimated. Note that metrics lump together perceptible durational differences and those below the just-noticeable difference of about **10%** [Lehiste 1970]. Listener sensitivity to durational variation may nonetheless explain the discrimination results for prototypical languages in Nazzi et al. [1998, 2000] and Nazzi & Ramus [2003]. *(p.59)*

**Language-specific means to a common end: prominence spacing in syllables, not seconds.** Relatively regular prominence spacing is achieved language-specifically through speaking rate and reduction patterns [Barry & Andreeva 2001; Barry et al. 2003]. Dauer [1983] speaking rates, with the author's own t-tests showing English significantly slower than the other three (p < 0.05 in all cases): *(p.59)*

| Language | Speaking rate (syllables/s) | Page |
|----------|------------------------------|------|
| English | 5.0 | 59 |
| Spanish | 7.1 | 59 |
| Italian | 7.3 | 59 |
| Greek | 7.5 | 59 |

Combined with relatively stable interstress intervals, the higher rates mean Greek, Spanish and Italian pack **more syllables into each interstress interval** (an observation Dauer confirmed). So the difference between "stress-timed" and "syllable-timed" languages may lie in the spacing of prominences measured **in number of syllables, not in duration**; prominences are **sparser** in syllable-timed languages. That could produce different rhythmic hierarchies and different degrees of flexibility in keeping prominences regular [Arvaniti 1994, 2007]. *(p.59)*

**Dauer's residual weakness: still anchored on timing, and on a priori prominence correlates.** Dauer states Spanish stresses are less prominent than English ones because the **durational ratio between stressed and unstressed syllables is 1.3 in Spanish vs 1.5 in English**. This assumes prominence correlates can be fixed a priori and used to rank languages' prominence strength. But stress "does not have its own phonetic content" [Beckman & Edwards 1994, p.14]: languages use different parameters to make syllables prominent, and weight the same parameter differently. Spectral tilt is the primary acoustic parameter of stress in Dutch [Sluijter & van Heuven 1996], whereas in English spectral tilt differentiates only accented from unaccented (but stressed) syllables [Campbell & Beckman 1997]. *(p.60)*

**Prominence percepts are listener-native-language-dependent.** *(p.60)*
- Beckman [1986]: English and Japanese listeners rely on their native parameter set whether processing English or Japanese.
- de Jong [1994]: asked English, Japanese and Korean speakers to assign prominence to one syllable in Korean accentual phrases. Korean listeners preferred the second syllable but with significant uncertainty; Japanese listeners strongly preferred the second syllable (which in Korean usually co-occurs with the F0 peak of the accentual phrase); English listeners paid equal attention to durational and F0 differences. Syllables prominent to one group were not prominent to another.

**Therefore rhythmic classification, whether impressionistic or along an acoustic dimension, is bound to fail.** Even trained phoneticians cannot transcend how duration, F0, amplitude and vowel quality function prosodically in their native language. Roach [1982] first suggested English speakers hear French as syllable-timed because they are unaccustomed to full vowels in nonprominent syllables. Miller [1984] asked English and French phoneticians and naive speakers to rhythmically classify Arabic, Yoruba, Polish, Spanish, Finnish and Indonesian: few results reached significance (most suggested guessing); of those that did, only Arabic was unanimous (all four groups: stress-timed); Yoruba and Japanese were classified syllable-timed by English phoneticians and nonphoneticians respectively; both French groups classified Indonesian as syllable-timed and **Spanish as stress-timed**. This explains why many native phoneticians of supposedly syllable-timed languages reject their language's classification [see Dauer 1983]. *(p.60)*

## Implications for Future Research (p.61)
- Reconsider speech rhythm so it is **less focused on timing**; timing should in principle be examined as a distinct phenomenon. Adopt a conception of rhythm resting on grouping and patterns of prominence, and connect phonetic research to phonological models of rhythm widely accepted in phonology [e.g. Hayes 1995] and closer to the psychological understanding. *(p.61)*
- Focusing exclusively on durational measurements — particularly relative or absolute durational variability, as metrics do — is **misguided**. Local durational contrasts may matter less for rhythm than the induction of **meter**, the abstract periodicity pattern that may be the only mental representation of rhythm [Lerdahl & Jackendoff 1983; Clarke 1999]. *(p.61)*
- Examine the contribution of **parameters other than duration**; their role could be substantial [for pitch and intonation, see Dilley & McAuley 2008; Kohler 2008]. But the role of parameters is **language-specific**: some contribute to rhythm in some languages and not others. *(p.61)*
- Place greater focus on **nonprototypical languages**, especially ones that challenge the ideas advanced here, such as Korean, whose native speakers do not have strong intuitions about prominence. *(p.61)*
- More studies are needed on the **perception** of rhythm rather than only its acoustic manifestation. Few have acknowledged this need [but see Beckman 1992; Warner & Arai 2001]; those tapping perception, e.g. Scott et al. [1985], support the ideas advanced here. *(p.61)*
- **Native speakers should not be ignored**; how they experience rhythm in their language should be seriously investigated, since percepts of rhythm are language-dependent, not objective. *(p.61)*

## Conclusion (p.61)
To understand rhythm it is necessary to **decouple the quantification of timing from the study of rhythmic structure**. Timing reflects segment durations and their interactions with a host of factors. Timing is part of the study of rhythm but should not be the only part, and in any case is not adequately quantified by any metric proposed so far. Decoupling means **abandoning the notion of rhythmic categories in all its guises**, since it rests squarely on timing and is psychologically questionable. Dauer's idea that rhythm is stress-based in all languages is worth revisiting, provided a more liberal view of stress **as prominence** is adopted and the role of prominence in rhythm creation is investigated across a wide range of languages. Rhythm as the product of **prominence and patterning** is psychologically plausible and does not rely on a dubious language division or on measuring timing. To succeed, this conception also requires that acoustic measurements be **adapted to the prosody of each language** and that the rhythm perception of native speakers finally be taken into account. *(p.61)*

## Limitations
- The author's supporting study was **in progress** at the time of writing; results are from 5 speakers per language and are described as preliminary. *(p.50)*
- The lack of statistically significant cross-linguistic differences may itself be due to high **inter-speaker variability** rather than to the absence of a real effect; the author acknowledges this reading. *(p.50)*
- Spontaneous-speech nonsignificance is attributed possibly to greater **intraspeaker variability** than in read speech. *(p.51)*
- The formulas for the metrics are not restated in the paper; only verbal definitions are given. Implementers must go to Ramus et al. [1999], Low et al. [2000], Grabe & Low [2002], Dellwo [2006].
- The positive proposal (grouping + prominence) is a research program, not an operationalized model: no metric, algorithm, or quantitative criterion for grouping/prominence-based rhythm is supplied.
- Unit scaling of ΔC differs between the reproduced Ramus figures (seconds, 0.03-0.06) and the author's own figures (25-70), which must be reconciled before combining numbers across figures.

## Arguments Against Prior Work
- **Against Ramus et al. [1999] and %V-ΔC:** the two metrics they endorse do not correlate (r = -0.26 on Grabe & Low data), so no coherent continuum; and %V-ΔC gives classifications contradicting PVIs for Thai, Luxembourgish, Japanese and Polish. *(p.47-48)*
- **Against Ramus [2002]'s rebuttal:** the claimed "striking similitude" between metric families holds only when PVIs are compared to ΔV-ΔC, not to the %V-ΔC pair Ramus et al. themselves endorse as the best classifier. *(p.47-48)*
- **Against Grabe & Low [2002]:** their own results classify only 4 of 13 nonprototypical languages (33%); and their prose interpretation of Singapore English relies on preexisting classification rather than on the scores, which point the other way. *(p.47, 57)*
- **Against metrics generally:** they are equivalent in spirit to classic isochrony measures, assuming a simple mapping from duration to phonological categories such as syllable structure, vowel weight and reduction. *(p.55)*
- **Against normalization-based fixes** [Frota & Vigário 2001; Wagner & Dellwo 2004; Dellwo 2006]: the problem is circularity, not the absence of the right durational normalization. *(p.56)*
- **Against Dauer [1983, 1987] (partial):** her criteria are untested, do not work synergistically across languages, and her own placement of Greek/Spanish mid-continuum conflicts with her own note that they have a "clearly discernible beat" and with the robust acoustic correlates of stress in those languages. Her prominence-strength claim rests on a priori durational ratios (1.3 Spanish vs 1.5 English), but stress has no universal phonetic content. *(p.54-55, 60)*
- **Against impressionistic classification** [Miller 1984; Roach 1982]: even trained phoneticians classify along their own native prosody; most of Miller's results look like guessing, and French listeners called Spanish stress-timed. *(p.60)*
- **Against syllable-timing as a concept:** violates the 200 ms fusion floor at real speaking rates (136 ms per syllable at 7.3 syll/s), and contradicts subjective rhythmization, in which identical stimuli are heard as trochees/iambs. *(p.57-58)*

## Design Rationale (as an argument the paper makes)
- **Rhythm should be modeled with one set of principles for all languages** (grouping + prominence), rejecting a design in which some languages use foot-based alternation and others use flat syllable cadence. Rationale: a two-principle design implies speakers of some languages construe linguistic rhythm differently from the rest of their timing experience. *(p.58)*
- **Meter, not local duration contrast, is the representation to build.** Meter is an abstract strong/weak alternation independent of absolute or relative duration; grouping handles the over-time phenomena. Rationale: listeners categorize durations, so rhythmic pattern survives large durational variation. *(p.57, 59, 61)*
- **Prominence spacing should be counted in syllables, not seconds.** Interstress intervals are roughly constant across languages (380-493 ms) while syllable rates differ (5.0-7.5 syll/s), so the real cross-linguistic difference is how many syllables sit inside a prominence interval. *(p.58-59)*
- **Prominence cues must be language-specific, chosen per language, not fixed a priori.** Spectral tilt is primary for Dutch stress but only marks accent in English; F0 dominates Korean accentual-phrase prominence. *(p.60)*
- **Anticipation permits imperfect regularity.** Because listeners continue an established pattern, a generator need not produce metronomic prominence spacing to yield a perceived rhythm. *(p.59)*

## Testable Properties
- Interstress interval means across English, Thai, Italian, Spanish, Greek fall in **380-493 ms** with no statistically significant cross-language difference, and individual intervals span **300-700 ms**. *(p.58-59)*
- Preferred/natural tempo for event spacing is **0.5-0.6 s**; interstress intervals near 0.5 s therefore fall in the optimal band for entrainment. *(p.58)*
- The psychological present spans **3-8 s**, which at ~0.5 s spacing admits **6-10 prominences**. *(p.58)*
- Auditory **fusion is avoided only above ~200 ms** spacing; a syllable rate above ~5 syll/s therefore cannot support a syllable-level cadence. *(p.58)*
- Speaking rates: English 5.0 syll/s, Spanish 7.1, Italian 7.3, Greek 7.5; English significantly lower than each of the other three (p < 0.05). Pooled Spanish/Greek/Italian = 7.3 syll/s = one syllable per 136 ms. Greek in less formal speech: 9.9-10.3 syll/s. *(p.58-59)*
- Stressed/unstressed **duration ratio**: Spanish ≈ 1.3, English ≈ 1.5 (Dauer's figures, used by her to rank prominence strength). *(p.60)*
- Just-noticeable difference for duration is about **10%**; metric scores conflate differences above and below it. *(p.59)*
- nPVI and rPVI scores over the 18 Grabe & Low languages are **uncorrelated (r = 0.019)**; %V and ΔC correlate weakly and negatively (**r = -0.26**). *(p.48)*
- Within-class score gaps can exceed between-class gaps: nPVI French-Mandarin = 16.5 > nPVI British English-French = 13.7; rPVI Japanese-French = 12.1 > rPVI Spanish-Thai = 1.2. *(p.56)*
- Under %V-ΔC and Grabe & Low data, the language closest to English is **Japanese** (Euclidean distance 4.5). Under PVIs, Greek (9.6) is closer to English than Dutch (10.7) or Thai (11.5). *(p.56-57)*
- Corpus design alone shifts within-language scores by an amount comparable to the between-language spread of the eight Ramus et al. languages, with consistent orderings: ΔC(stress-timed materials) > ΔC(syllable-timed, uncontrolled) in English, Spanish and Greek; %V(stress-timed) < %V(syllable-timed) in all three. *(p.52-53)*
- Equal consonantal-variability scores can arise from opposite mechanisms: Korean L2 English via extreme phrase-final lengthening, Spanish L2 English via extreme intervocalic lenition. A rhythm measure that cannot distinguish these is inadequate. *(p.55)*
- Greek unstressed high vowels elide phrase-initially but not phrase-finally in the same segmental context when they carry the intonational tune. *(p.55)*
- Polysyllabic shortening exists in both English and Greek; word-final and accentual lengthening exist in English but not Greek. *(p.56)*

## Relevance to Project (formant / source-filter speech synthesizer)
- **Do not use rhythm metrics as a synthesis target or evaluation criterion.** %V, ΔC, nPVI, rPVI, VarcoV and VarcoC are many-to-one over generation mechanisms: the L2 example shows two entirely different duration rules producing statistically indistinguishable scores with grossly different percepts. Matching a target nPVI proves nothing about perceived rhythm. *(p.55)*
- **Duration rules must be modeled as an explicit inventory of interacting effects, not as one global variability knob.** The paper's list is essentially a duration-rule specification for a synthesizer: language-specific inherent segment durations, voicing and syllable-position context effects, stress/accent/focus lengthening, prosodically conditioned vowel reduction, phrase-final lengthening, allophonic variation between stressed and unstressed syllables, polysyllabic shortening, word-final lengthening. This maps directly onto a Klatt-style duration model (Klatt 1976 is cited as the English review). *(p.55-56)*
- **Reduction must be conditioned on prosodic position, not just local segmental context.** The Tserdanelis [2005] Greek result (phrase-initial elision vs phrase-final protection when the vowel bears the tune) is a concrete rule shape: reduction should be gated by whether the vowel carries a pitch accent or boundary tone. *(p.55)*
- **Target prominence spacing rather than isochrony.** Aim for stressed-syllable spacing near 0.5 s (380-500 ms), with permitted jitter over 300-700 ms; this sits in the natural-tempo band and is what listeners entrain to. Do not enforce foot or syllable isochrony. *(p.58-59)*
- **Vary rate by syllables per prominence interval, not by uniform time-scaling.** A "faster, more syllable-timed" voice should pack more syllables into a roughly constant interstress interval (5 syll/s English-like vs 7-7.5 syll/s Greek/Spanish/Italian-like, up to 10 syll/s for casual Greek). *(p.58-59)*
- **Prominence must be a multi-parameter, language- or voice-specific bundle.** Duration, F0, amplitude and spectral tilt each carry different weight per language; spectral tilt is primary for Dutch stress, only accent-marking in English. For a formant synthesizer this means stress should modulate open quotient / source spectral tilt as well as duration and F0, with weights configurable per voice. *(p.60)*
- **Perceived rhythm tolerates imperfect regularity because of anticipation.** A synthesizer need not enforce metronomic timing; establishing a pattern early buys tolerance later. Conversely, an early wrong grouping propagates: Dilley & McAuley [2008] show preceding rhythm/intonation flips word segmentation (*lifelong handshake* vs *longhand shake*). Phrase-initial prosody is disproportionately consequential. *(p.59)*
- **Durational differences below ~10% are below JND** and are not worth chasing in a duration model; conversely, effects at or below that threshold cannot be validated by listening tests. *(p.59)*
- **Evaluation should be perceptual and native-listener-based**, since prominence percepts are language-dependent. A synthesizer's rhythm cannot be validated by a metric score computed by its developers. *(p.60-61)*

## Open Questions
- [ ] The paper gives no operational definition of "grouping" or "prominence" strength suitable for a generator. What quantitative form would a prominence-and-grouping model take?
- [ ] What is the correct per-language weighting of duration, F0, amplitude and spectral tilt for prominence in a synthesis voice, and how is it estimated?
- [ ] How should a duration model represent Greek-style prosodically gated reduction alongside English-style accentual and word-final lengthening in one framework?
- [ ] How far can anticipation carry a synthesized rhythm? What is the tolerance for interval jitter before the percept breaks?
- [ ] Are the Dauer [1983] speaking rate and interstress numbers stable in spontaneous speech, or lab-speech artifacts (the author flags 7.3 syll/s as likely low)?
- [ ] Do the author's in-progress study results hold with more than 5 speakers per language?

## Related Work Worth Reading
- **Klatt, D.H. (1976)**, "Linguistic uses of segmental duration in English", JASA 59:1208-1221 — cited as the review of the English duration factors; the canonical duration-rule source for a formant synthesizer.
- **Ramus, F.; Nespor, M.; Mehler, J. (1999)**, Cognition 73:265-292 — origin of %V and ΔC and of the controlled corpus this paper re-analyzes.
- **Grabe, E.; Low, E.L. (2002)**, Laboratory Phonology 7:515-546 — origin of nPVI/rPVI and the 18-language dataset behind tables 2-3 and figure 2.
- **Dauer, R.M. (1983)**, J. Phonet. 11:51-62, and **Dauer (1987)**, Proc. 11th ICPhS:447-449 — the eight criteria and the interstress/rate data reused throughout.
- **Dilley, L.C.; McAuley, J.D. (2008)**, J. Mem. Lang. 59:294-311 — distal prosodic context changes word segmentation; the strongest evidence that generated prosody upstream alters downstream parsing.
- **Lerdahl, F.; Jackendoff, R. (1983)**, A Generative Theory of Tonal Music — the grouping/meter distinction the proposal rests on.
- **Fraisse, P. (1982)**, "Rhythm and tempo", in The Psychology of Music:149-180 — fusion threshold, preferred tempo, subjective rhythmization.
- **Tserdanelis, G. (2005)**, doctoral diss., Ohio State — prosodic conditioning of Greek vowel reduction.
- **Turk, A.E.; Shattuck-Hufnagel, S. (2000)**, J. Phonet. 28:397-440 — word-boundary-related duration patterns, cross-linguistic duration data.
- **Sluijter, A.M.C.; van Heuven, V.J. (1996)**, JASA 100:2471-2485 — spectral balance as acoustic correlate of stress; directly actionable for source modeling.

## Provenance
Read from `pngs/page-000.png` through `pngs/page-017.png` (18 rendered pages covering journal pages 46-63) via the paper-reader page-image lane. Steps 7 (reconcile), 8 (index.md) and 8.5 (ledger) intentionally deferred to the coordinating agent; `build_keymap.py` not run.


## Collection Cross-References

### Already in Collection
- [Stress, Prominence, and Spectral Tilt](../Campbell_1997_StressProminenceSpectralTilt/notes.md) - cited directly.
- [Linguistic Uses of Segmental Duration in English: Acoustic and Perceptual Evidence](../Klatt_1976_SegmentalDuration/notes.md) - cited as the review of the factors determining English segment duration; the canonical duration-rule source implying duration must be modeled as an explicit inventory rather than a single variability parameter.
- [Correlates of linguistic rhythm in the speech signal](../Ramus_1999_CorrelatesLinguisticRhythmSpeech/notes.md) - cited as the origin of %V and deltaC and of the controlled corpus reproduced in figure 1.
- [Sluijter, van Heuven & Pacilly (1997) - Implementation Notes](../Sluijter_1996_SpectralBalanceStressCue/notes.md) - cited for spectral tilt as the primary stress cue in Dutch, actionable for driving glottal source parameters from stress.
- [Durational Variability in Speech and the Rhythm Class Hypothesis](../Grabe_Low_2002_DurationalVariabilityRhythmClass/notes.md) - cited as the origin of nPVI/rPVI and the 18-language dataset behind figure 2 and the recomputed rhythm-class correlations.

### New Leads (Not Yet in Collection)
- Dauer, R.M. (1983) - "Stress-timing and syllable-timing reanalyzed," J. Phonet. 11 - source of the interstress-interval means, speaking rates, and stressed/unstressed duration ratios this paper's positive proposal rests on.
- Dilley, L.C. & McAuley, J.D. (2008) - "Distal prosodic context affects word segmentation and lexical processing," J. Mem. Lang. 59 - relevant to how a synthesizer's phrase-initial rhythm propagates into downstream parsing.

### Cited By (in Collection)
- (bibliography-only mention in [Communicative Function and Prosodic Form in Speech Timing](../White_2014_ProsodicTimingFunction/notes.md) - see Conceptual Links for the substantive relationship)

### Conceptual Links (not citation-based)
- [Rhythm in Read British English: Interdialect Variability](../Ferragne_Pellegrino_2004_RhythmReadBritishEnglish/notes.md) - Ferragne & Pellegrino's within-language finding (vocalic, not intervocalic, duration variability carries dialect-distinguishing rhythmic signal) is exactly the kind of fine-grained empirical result Arvaniti's critique of discrete rhythm-class metrics calls for. (Strong)
- [Communicative Function and Prosodic Form in Speech Timing](../White_2014_ProsodicTimingFunction/notes.md) - White reinterprets segmental timing phenomena (including polysyllabic shortening) as serving communicative/prosodic function rather than following from a rhythm class; this is a segment-level instance of the functional, non-isochrony account of rhythm Arvaniti argues the field needs. (Strong)
