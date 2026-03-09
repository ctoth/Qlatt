# The Trouble with ToBI

**Authors:** D. Robert Ladd
**Year:** 2021 (preprint circulated ~2018)
**Venue:** Chapter in J. Barnes and S. Shattuck-Hufnagel (eds.), *Prosodic Theory and Practice*, MIT Press, pp. 247-257.
**DOI/URL:** N/A (preprint)

## One-Sentence Summary

A critical examination of ToBI's theoretical foundations arguing that its commitment to discrete phonological categories prematurely forecloses investigation of gradient phonetic variation in intonation, particularly in pitch accent distinctions and boundary tone behavior.

## Problem Addressed

ToBI (Tones and Break Indices) became the de facto standard for prosodic annotation in English, but Ladd argues it conflates phonetic observation with phonological analysis, making categorical distinctions (e.g., L+H\* vs. H\*) where gradient phonetic variation may be a more accurate description.

## Key Contributions

- Identifies a fundamental tension between "phonological" and "phonetic" levels of transcription in ToBI that mirrors the broad/narrow distinction in segmental IPA transcription
- Argues that MAE-ToBI's narrowing to "Mainstream American English" is both practically harmful (sacrificing cross-dialect utility) and theoretically premature (assuming phonological contrasts are well-established when they are not)
- Demonstrates that the L+H\* vs. H\* distinction in ToBI is likely a gradient phonetic difference (Bolingerian "gradience") rather than a categorical phonological one, citing poor inter-transcriber reliability (Pitrelli et al. 1994)
- Critiques the treatment of phrase-final level pitch (H- L%), arguing the "upstepped L%" analysis is theoretically problematic and that alternatives (absence of boundary tone, per Gussenhoven 1984) were dropped from ToBI without adequate theoretical justification
- Shows how the "uptalk" phenomenon reveals contradictions: L\* H- H% and H\* H- H% are treated as categorically distinct despite being gradient variants of a single rising pattern

## Methodology

Theoretical critique drawing on:
- Inter-transcriber reliability data from Pitrelli et al. (1994)
- Cross-linguistic evidence (Dutch ToDI, German GToBI, Greek, Japanese)
- The British school tradition of intonation analysis (Palmer 1922, Halliday 1967)
- Bolinger's (1961) concept of "gradience" — meaningful gradient phonetic variation within a single phonological category

## Key Equations

None — this is a theoretical/critical paper, not a quantitative one.

## Parameters

No quantitative parameters are presented.

## Implementation Details

### Critical ToBI labels discussed:

| Label | Description | Ladd's Critique |
|-------|-------------|-----------------|
| H\* | High pitch accent | Likely a gradient variant of L+H\* |
| L+H\* | Rising pitch accent | Poor inter-rater reliability vs H\* |
| H- L% | Phrase-final: high phrase accent, low boundary | "Upstepped L%" analysis is theoretically contested |
| H- H% | High phrase accent, high boundary (uptalk) | Not clearly distinct from L\* H- H% |
| L\* H- H% | Rising contour (uptalk variant) | Gradient variation with H\* H- H% |
| !H\* | Downstepped high accent | One of the clearer categorical distinctions |

### Key theoretical concepts:

1. **Gradience (Bolinger 1961):** Intonational categories are subject to meaningful gradient variation, unlike segmental phonemes. A high accent peak can be made progressively higher to increase emphasis — this continuous variation carries meaning but is not captured by categorical ToBI labels.

2. **Upstepped L%:** In Pierrehumbert (1980), phrase-final level pitch after H- was analyzed as L% "upstepped" to the level of the phrase accent. Ladd (1983) and others argued this should instead be analyzed as *absence* of a boundary tone. This debate was never resolved but ToBI adopted the upstepped L% analysis.

3. **Phonetic vs. phonological transcription:** The parallel to segmental transcription is instructive. Even IPA has no clear line between "broad" and "narrow" — ToBI faces the same problem but with the additional complication that intonational phonology is much less well understood than segmental phonology.

## Figures of Interest

- **Page 5:** Schematic of phrase-final level pitch contour ("Ma— ry—") showing the calling contour with stressed syllable on high level pitch and remaining syllables ~3 semitones lower.

## Results Summary

Ladd's core argument has three prongs:

1. **Cross-dialect problem:** ToBI was designed for "Mainstream American English" but this abstraction (a) sacrifices cross-dialect utility that a more phonetic system would preserve, and (b) claims phonological analysis authority it doesn't warrant given our primitive understanding of intonational phonology.

2. **Gradience problem:** The L+H\* vs. H\* distinction is the central example. The difference in rise preceding the accent peak is gradient (like the difference between ankle/uncle vowels across dialects), not categorical. ToBI treats it as categorical, and the runaway success of ToBI-style annotation has caused this assumption to be taken for granted by the research community.

3. **Uptalk problem:** Rising phrase-final contours ("uptalk") involve gradient variation in where the rise starts, how steep it is, and where it ends. The ToBI notation forces a categorical L\* H- H% vs. H\* H- H% distinction that obscures the underlying phonetic continuum.

## Limitations

- Primarily a critique of ToBI rather than a constructive alternative — Ladd acknowledges the general AM (autosegmental-metrical) approach is sound, but does not propose a replacement notation
- Focused on English (with some cross-linguistic references) — many arguments may not generalize
- Does not provide quantitative evidence for gradience claims beyond citing Pitrelli et al. (1994) reliability data
- The year of the edited volume publication creates uncertainty about how current the arguments are relative to recent ToBI revisions

## Testable Properties

- **Inter-transcriber agreement for L+H\* vs. H\* should be low:** Pitrelli et al. (1994) collapsed these categories due to poor agreement. Any new evaluation should find similar difficulty.
- **Pitch accent peak height should correlate with emphasis on a continuous scale:** If gradience is real, perceived emphasis should correlate continuously with F0 peak height, not show a step function at a categorical boundary.
- **L\* H- H% and H\* H- H% should be perceptually confusable:** If these are gradient variants of "uptalk," listeners should struggle to consistently categorize intermediate tokens.
- **Cross-dialect ToBI annotations should show systematic disagreements:** Labelers from different English dialects should disagree on specific accent types where their dialects differ phonetically.

## Relevance to Project

For Qlatt's prosody system, this paper is a **caution against over-committing to discrete ToBI labels as the internal prosodic representation**. Key implications:

1. **F0 generation should support gradient accent strength.** Rather than mapping H\* to one F0 target and L+H\* to another discrete target, the system should allow continuous variation in accent peak height and the extent of the preceding rise.

2. **Boundary tone implementation should be flexible.** The distinction between "upstepped L%" (sustained level pitch) and "no boundary tone" is theoretically contested — the synthesis system should be able to produce phrase-final level pitch without requiring a committed phonological analysis.

3. **The prosody rules should not assume ToBI-style categorical distinctions are phonologically real.** Using ToBI as an *input notation* is fine (it's the standard), but the internal F0 generation should parametrize the gradient dimensions (peak height, rise extent, alignment) that ToBI categories conflate.

## Open Questions

- [ ] How should Qlatt handle the L+H\* vs. H\* distinction — as a gradient parameter or two discrete targets?
- [ ] Should the prosody rule system expose "emphasis strength" as a continuous parameter that modulates accent realization?
- [ ] Does the current break-index system (0-4) adequately capture phrasing, or does it need gradient boundary strength?
- [ ] How to handle "uptalk" contours — single parameterized rise, or two distinct ToBI-derived patterns?

## Related Work Worth Reading

- Pierrehumbert, Janet B. (1980). *The phonology and phonetics of English intonation.* PhD thesis, MIT. — The foundational AM analysis that ToBI is based on.
- Beckman, Hirschberg, and Shattuck-Hufnagel (2005). The original ToBI system and its evolution. — The official ToBI specification Ladd is critiquing.
- Ladd, D. Robert (2008). *Intonational Phonology* (2nd ed.). Cambridge University Press. — Ladd's own comprehensive treatment of AM theory.
- Bolinger, Dwight (1961). *Generality, gradience, and the all-or-none.* — The theoretical basis for Ladd's gradience argument.
- Gussenhoven, Carlos (1984). *On the grammar and semantics of sentence accents.* — Alternative analysis of boundary tones that was dropped from ToBI.
- Silverman et al. (1992). ToBI: A standard for labeling English prosody. — The original published ToBI standard.
- Warren, Paul (2016). *Uptalk: The phenomenon of rising intonation.* — Comprehensive treatment of uptalk, relevant to Ladd's critique of ToBI's handling of it.

## Collection Cross-References

### Already in Collection
- [[Pierrehumbert_1980_EnglishIntonation]] — the foundational AM analysis of English intonation whose phonological categories (H\*, L+H\*, etc.) ToBI adopted; Ladd's critique is directed at the institutionalization of these categories, not the theory itself
- [[Beckman_2005_ToBISystemEvolution]] — the official ToBI specification and theoretical justification that Ladd directly critiques throughout this chapter
- [[Silverman_1992_ToBILabelingProsody]] — the original published ToBI standard; Ladd cites this as the point where the consultation process produced a published system
- [[Ladd_2008_IntonationalPhonology]] — Ladd's own comprehensive AM theory textbook, from which this chapter borrows material (acknowledged in the Acknowledgement section)
- [[Ladd_2014_AmericanFourLevelIntonation]] — Ladd's earlier work on pitch level systems, part of the broader theoretical context for the gradience argument
- [[Beckman_2022_ToBISystem]] — later ToBI documentation; Ladd's critique applies to this system as well

### Cited By (in Collection)
- (none found)

### New Leads (Not Yet in Collection)
- Bolinger, Dwight L. (1961). *Generality, gradience, and the all-or-none.* — central to Ladd's argument that intonational categories exhibit meaningful gradient variation, not discrete contrasts
- Pitrelli, Beckman, and Hirschberg (1994). Evaluation of prosodic transcription labeling reliability in the ToBI framework. — key empirical evidence that L+H\* vs H\* is poorly distinguished by human annotators
- Gussenhoven, Carlos (1984). *On the grammar and semantics of sentence accents.* — proposed absence-of-boundary-tone analysis that was dropped from ToBI without resolution
- Warren, Paul (2016). *Uptalk: The phenomenon of rising intonation.* — comprehensive treatment of the uptalk phenomenon that exposes ToBI's categorical limitations

### Conceptual Links (not citation-based)
- [[Taylor_2000_TiltModelIntonation]] — **Strong.** Taylor's Tilt model is a direct constructive answer to the problem Ladd diagnoses: it replaces ToBI's discrete accent categories with continuous parameters (amplitude, duration, tilt). Taylor even maps ToBI accent types to continuous Tilt/Position space (Fig 5) and notes that ~79% of accents are H\* with ~15% L+H\*, making the categorical distinction less useful than continuous parameters. Where Ladd critiques, Taylor builds an alternative.
- [[Breen_InPress_ToBIRaPReliability]] — **Strong.** Provides large-scale empirical inter-transcriber reliability data for ToBI, directly relevant to Ladd's argument about poor agreement on accent types. The RaP system's three-level prominence (vs ToBI's binary) and separation of rhythmic prominence from pitch accenting address some of Ladd's concerns about conflating phonetic dimensions.
- [[Roach_1994_ProsodicTranscriptionConversion]] — **Moderate.** Demonstrates the practical difficulty of mapping between British and ToBI prosodic systems, illustrating Ladd's point about cross-dialect incommensurability. The non-final fall-rise gap (SEC allows it, ToBI cannot represent it without inserting a phrase boundary) is a concrete example of ToBI's categorical limitations.
- [[DeTournemire_1998_ProsodicAlphabetTranscription]] — **Moderate.** Takes a different approach to the same problem: instead of debating categorical labels, identifies a prosodic alphabet acoustically from distributions and trains neural networks on the result. Bypasses the phonological-vs-phonetic debate Ladd describes by working entirely at the acoustic level.
- [[Strom_2002_TextToProsodyWithoutToBI]] — **Moderate.** Explicitly eliminates manual ToBI labeling via unsupervised learning, representing one practical response to Ladd's concerns about ToBI's theoretical commitments biasing prosody modeling.
