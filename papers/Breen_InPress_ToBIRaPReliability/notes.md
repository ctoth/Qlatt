# Inter-transcriber reliability for two systems of prosodic annotation: ToBI (Tones and Break Indices) and RaP (Rhythm and Pitch)

**Authors:** Mara Breen, Laura C. Dilley, John Kraemer, Edward Gibson
**Year:** In Press
**Venue:** Corpus Linguistics and Linguistic Theory (CLLT)
**DOI/URL:** N/A

## One-Sentence Summary

This paper provides the first large-scale inter-transcriber reliability comparison of the ToBI and RaP prosodic annotation systems, demonstrating that both achieve substantial agreement and that RaP matches or exceeds ToBI reliability, particularly for phrasal boundaries.

## Problem Addressed

ToBI is the dominant prosodic annotation standard but has known limitations: (1) lack of consistent phonetic-to-label mapping, (2) inability to capture rhythmic (metrical) prominence distinct from pitch accent, and (3) prior reliability studies used small corpora or few labelers. RaP (Rhythm and Pitch) was designed to address these limitations, but had no published reliability data. This paper fills that gap with two large-scale studies.

## Key Contributions

- First large-scale inter-transcriber reliability study for both ToBI and RaP using the same labelers, corpora, and statistical methods
- Demonstrates RaP achieves comparable or higher agreement than ToBI across most prosodic categories
- Provides detailed confusion matrices for all label types in both systems
- Uses syllable-aligned (rather than word-aligned) transcriber-agreement-pair (TAP) metrics, enabling finer-grained comparison
- Establishes that RaP's higher phrasal boundary agreement is not solely attributable to practice/order effects

## Methodology

Two studies conducted:

**Study One (Naive labelers):** Four MIT undergraduates with no prosody experience trained on ToBI then RaP, then annotated a third ToBI corpus. 55.2 minutes of speech (15,146 syllables) from Boston Radio News (read) and CallHome (spontaneous) corpora. Order: ToBI -> RaP -> ToBI.

**Study Two (Expert labelers):** Four expert labelers (including two authors) annotated 6 minutes of new speech (1,533 syllables, 1,072 words) from 7 talkers. Order counterbalanced across labelers. All annotated the entire corpus in both systems.

Agreement measured using:
1. Raw percent agreement via TAP (transcriber-agreement-pair) metric
2. Chance-corrected kappa (Cohen's kappa)

## Key Equations

$$\kappa = \frac{A_O - A_E}{1 - A_E}$$

Where:
- $A_O$ = observed (actual) agreement
- $A_E$ = expected agreement based on chance
- Values: 0-0.40 = unreliable, 0.40-0.60 = questionable, 0.60-0.80 = substantial, 0.80-1.0 = highly reliable

## Parameters

### ToBI Label Inventory

| Label Type | Category | Labels | Notes |
|------------|----------|--------|-------|
| Pitch accent (single-toned) | High/Low | H*, L* | Starred = pitch-accented syllable |
| Pitch accent (bitonal) | Rising/Falling | L+H*, L*+H, H+!H* | Downstepped variants: !H*, L+!H*, L*+!H |
| Phrase accent | Intermediate phrase edge | H-, !H-, L- | Obligatory at ip boundary |
| Boundary tone | Intonational phrase edge | H%, L% | Six possible phrase accent + boundary tone combinations |
| Break index | Disjuncture | 0, 1, 2, 3, 4 | 0=clitic, 1=normal word, 2=lengthening/tone mismatch, 3=ip, 4=IP |

### RaP Label Inventory

| Label Type | Category | Labels | Notes |
|------------|----------|--------|-------|
| Rhythm (metrical prominence) | Beat strength | X (strong), x (weak), no label (none) | ? suffix indicates uncertainty |
| Rhythm (phrasal boundary) | Boundary | ) (minor, ~break 3), )) (major, ~break 4) | ? suffix for uncertainty |
| Pitch (tonal primitives) | Relative pitch | H (higher), L (lower), E (equal) | Relative to preceding labeled tone |
| Pitch (starred tones) | Pitch accent | H*, L*, E* | Starred = associated with metrically prominent syllable |
| Pitch (modifiers) | Small change | !H, !L | Pitch change < 3 semitones |
| Pitch (range) | Extreme | >>, << | Phrase-final syllables at pitch range extremes |

### Key Agreement Results (Study One)

| Agreement Category | ToBI TAP% | RaP TAP% | ToBI kappa | RaP kappa |
|-------------------|-----------|----------|------------|-----------|
| Prominence vs. non-prominence | 87 | 89 | 0.71 | 0.77 |
| Level of metrical prominence | N/A | 77 | N/A | 0.61 |
| Pitch accent status | N/A | 85 | N/A | 0.68 |
| Type of pitch accent: H vs L | 86 | N/A | 0.69 | N/A |
| Type of pitch accent: All distinct | 77 | 72 | 0.54 | 0.54 |
| Phrasal boundary present | 84 | 92 | 0.52 | 0.78 |
| Size of phrasal boundary | 81 | 86 | 0.47 | 0.68 |

### Key Agreement Results (Study Two - Experts)

| Agreement Category | ToBI TAP% | RaP TAP% | ToBI kappa | RaP kappa |
|-------------------|-----------|----------|------------|-----------|
| Prominence vs. non-prominence | 88 | 89 | 0.74 | 0.78 |
| Degree of prominence | N/A | 79 | N/A | 0.63 |
| Starred tone vs. no starred tone | N/A | 86 | N/A | 0.67 |
| Type of pitch accent: H vs L | 88 | N/A | 0.73 | N/A |
| Type of pitch accent: All distinct | 80 | 75 | 0.60 | 0.51 |
| Phrasal boundary present | 91 | 90 | 0.77 | 0.75 |
| Size of phrasal boundary | 87 | 85 | 0.68 | 0.67 |

## Implementation Details

### ToBI Four-Tier Structure
1. **Orthographic tier** - text labels
2. **Tonal tier** - pitch accents and edge tones, time-aligned
3. **Break index tier** - disjuncture (0-4), word-aligned
4. **Miscellaneous tier** - additional notes
5. (Optional) **Alternatives tier** - alternative label choices

### RaP Four-Tier Structure
1. **Words tier** - syllable labels
2. **Rhythm tier** - beat (X, x) and boundary (), )) labels
3. **Pitch tier** - tonal labels (H, L, E and variants)
4. **Miscellaneous tier** - additional notes

### Key Differences Between Systems
- **Prominence**: ToBI binary (accented vs unaccented); RaP three-level (strong beat X, weak beat x, no beat)
- **Pitch-prominence separation**: RaP separates rhythmic prominence from pitch accenting; ToBI conflates them
- **Tonal reference**: RaP pitch labels are relative to preceding tone (H/L/E); ToBI labels based on F0 contour shape and position
- **Boundary labeling**: RaP labels boundaries only when perceived; ToBI requires boundary labels wherever edge tones appear
- **Boundary types**: ToBI uses break indices 0-4; RaP uses ) for minor, )) for major boundaries

### Label Equivalence Relations for Comparisons (Table 3)
Detailed mapping between ToBI and RaP categories used for cross-system comparison.

## Figures of Interest

- **Fig 1 (page 2):** Side-by-side ToBI and RaP annotations of "Legumes are a good source of vitamins" showing critical labeling differences
- **Fig 2 (page 8):** Comparison table of select tone label sequences showing ToBI-to-RaP correspondences for 12 F0 contour patterns
- **Tables 6-7 (page 14-15):** ToBI confusion matrices for pitch accent and break index (Study One)
- **Tables 8-10 (page 15):** RaP confusion matrices for prominence, starred tone, and boundary (Study One)
- **Tables 14-15 (page 20):** ToBI confusion matrices (Study Two)
- **Tables 16-18 (page 21):** RaP confusion matrices (Study Two)

## Results Summary

Both annotation systems achieve substantial inter-transcriber reliability:

- **Prominence**: Comparable across systems (kappa 0.71-0.78). RaP shows slight numerical advantage.
- **Pitch accent type**: When all categories kept distinct, both systems show moderate agreement (kappa ~0.54). When collapsed to H vs L, ToBI achieves kappa 0.69-0.73.
- **Phrasal boundaries**: RaP significantly outperforms ToBI in Study One (kappa 0.78 vs 0.52, p < .0001). This advantage disappears with expert labelers in Study Two (kappa 0.75 vs 0.77).
- **Read vs spontaneous**: Agreement higher for read speech across nearly all categories in both systems.
- **Practice effects**: Agreement does not consistently improve over time, ruling out practice as sole explanation for RaP's boundary advantage.

Statistical comparison via Monte Carlo simulation (50 random samples, t-tests on simulated kappa):
- Prominence: RaP significantly higher (p < .001 in Study Two)
- Phrasal boundary presence: Not significant in Study Two (p > .05)
- Phrasal boundary size: Not significant in Study Two (p > .05)

## Limitations

- Study One used sequential order (ToBI first, then RaP) which could introduce practice effects
- Study Two had small corpus (6 minutes, ~1500 syllables)
- Only American English examined
- RaP's relative tonal labeling (H/L/E relative to preceding tone) makes type-of-pitch-accent comparisons across systems non-trivial
- The "all accents distinct" category shows only moderate agreement in both systems, suggesting fine-grained tonal distinctions remain challenging

## Testable Properties

- Kappa for binary prominence (prominent vs non-prominent) should be >= 0.60 for both ToBI and RaP systems when applied by trained labelers
- RaP phrasal boundary agreement (kappa) should be >= 0.60 for naive labelers
- Agreement should be higher for read speech than spontaneous speech in both systems
- The three-way RaP prominence distinction (strong, weak, none) should yield lower kappa than the binary (prominent vs non-prominent) collapsed version
- Pairwise labeler agreement for kappa should range 0.51-0.70 for ToBI and 0.57-0.69 for RaP

## Relevance to Project

This paper is relevant to Qlatt's prosody rule system in two ways: (1) it provides the complete label inventories for both ToBI and RaP, which informs the set of prosodic categories the synthesizer's rule engine should be able to target, and (2) the inter-transcriber reliability data indicates which prosodic distinctions are robustly perceived (prominence, phrasal boundaries) vs which are unreliable (fine-grained pitch accent type), informing priorities for prosody rule precision. The RaP system's separation of rhythmic prominence from pitch accent is particularly relevant to Qlatt's rule architecture, which already distinguishes stress-related rules from F0-contour rules.

## Open Questions

- [ ] Would RaP's three-level prominence distinction improve Qlatt's duration/amplitude modeling over ToBI's binary accent distinction?
- [ ] How should RaP's relative tonal labeling (H/L/E) map to absolute F0 targets in synthesis?
- [ ] Does the moderate agreement on fine-grained pitch accent types (~0.54 kappa) suggest that synthesizers need not distinguish all accent subtypes?

## Related Work Worth Reading

- Dilley & Brown 2005 - RaP labeling system specification (Version 1.0)
- Beckman & Ayers Elam 1997 - ToBI labeling guidelines (Version 3)
- Pierrehumbert 1980 - Autosegmental-metrical theory underlying both systems
- Carletta 1996 - Kappa statistic for annotation agreement tasks
- Pitrelli et al. 1994 - First ToBI reliability study
- Syrdal & McGory 2000 - ToBI reliability with kappa correction

## Collection Cross-References

### Already in Collection
- [[Pierrehumbert_1980_EnglishIntonation]] — cited as the foundational autosegmental-metrical theory underlying both ToBI and RaP annotation systems
- [[Beckman_2005_ToBISystemEvolution]] — cited for the development and evolution of the ToBI framework
- [[Beckman_2005_OriginalToBIEvolution]] — cited for ToBI labeling conventions and design principles
- [[Beckman_2022_ToBISystem]] — Dilley & Breen contribute the AM+ commentary section proposing five pitch levels; directly extends this reliability work
- [[Ladd_2008_IntonationalPhonology]] — cited for evidence on pitch accent categories and tonal contrasts (2nd ed., 2009)
- [[Ladd_2014_AmericanFourLevelIntonation]] — Ladd's historical analysis of pitch level distinctions relates to the tonal inventory questions this paper raises
- [[Silverman_1992_ToBILabelingProsody]] — cited as the original ToBI standard that both studies evaluate

### New Leads (Not Yet in Collection)
- Dilley & Brown (2005) — "The RaP (Rhythm and Pitch) Labeling System, Version 1.0" — the complete specification of RaP, essential for understanding the annotation system validated here
- Carletta (1996) — "Assessing agreement on classification tasks: the Kappa statistic" — methodological foundation for chance-corrected agreement metrics
- Pitrelli, Beckman, & Hirschberg (1994) — "Evaluation of prosodic transcription labeling reliability in the ToBI framework" — first ToBI reliability study, key comparison point

### Cited By (in Collection)
- [[Ladd_2021_TroubleWithToBI]] — cites this (via Pitrelli et al. 1994 reliability data) as empirical evidence for poor agreement on pitch accent type distinctions; the conceptual link already present references this paper's findings directly
- [[Beckman_2022_ToBISystem]] — Breen & Dilley are commentary authors; their AM+ framework in that chapter builds on the empirical reliability findings from this study

### Conceptual Links (not citation-based)
- [[Ladd_2021_TroubleWithToBI]] — **Strong.** Ladd argues that ToBI's categorical pitch accent distinctions (especially L+H\* vs H\*) are unreliable because the underlying phonetic variation is gradient, not categorical. This paper's finding of moderate agreement (~0.54 kappa) on fine-grained pitch accent types provides direct empirical support for Ladd's theoretical argument.
- [[Jun_2005_ProsodicTypology]] — **Moderate.** Jun's cross-linguistic prosodic typology framework contextualizes both ToBI and RaP as language-specific annotation systems within a broader typological perspective. The reliability results here help establish which prosodic categories are robust enough for cross-linguistic comparison.
- [[Hellbernd_2016_ProsodySpeechActIntention]] — **Moderate.** Hellbernd's work on prosodic correlates of speech act intentions relies on consistent prosodic annotation; this paper's reliability data validates the annotation framework underlying such perceptual studies.
