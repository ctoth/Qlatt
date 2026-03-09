# The Original ToBI System and the Evolution of the ToBI Framework

**Authors:** Mary E. Beckman, Julia Hirschberg, and Stefanie Shattuck-Hufnagel
**Year:** 2005
**Venue:** Chapter 2 in Sun-Ah Jun (ed.), *Prosodic Typology: The Phonology of Intonation and Phrasing*, Oxford University Press
**DOI/URL:** Preprint draft; published volume ISBN 978-0-19-924963-7

## One-Sentence Summary

Comprehensive specification of the original MAE_ToBI (Mainstream American English Tones and Break Indices) system by its creators, documenting the design rationale, the complete tone and break-index inventories, the distinction between phonological tags and phonetic representations, and the evolution of the ToBI framework for cross-linguistic application.

## Problem Addressed

Providing a principled, community-developed standard for annotating English intonation and prosodic phrasing that separates tonal events from metrical grouping, while establishing a general framework that can be adapted to other languages. The paper chronicles how the original design decisions were made and defends them against subsequent criticism.

## Key Contributions

1. Complete documentation of the MAE_ToBI design by its original creators, including the four Prosodic Transcription Workshops (1991-1994) that produced the conventions
2. Full inventory of MAE_ToBI Tones-tier labels (Table 2.2): pitch accents (H\*, L\*, !H\*, L+H\*, L+!H\*, L\*+H, H+!H\*), phrase accents (H-, L-, !H-), boundary tones (H%, L%, %H), and phonetic/uncertainty labels
3. Full inventory of Break-Indices tier labels (Table 2.3): 0 (clitic), 1 (word boundary), 2 (tones-breaks mismatch), 3 (intermediate phrase), 4 (intonational phrase), plus diacritics (-, p)
4. Six obligatory parts of a MAE_ToBI record (Table 2.1): audio, F0, Tones, Words, Break-Indices, Misc
5. Clarification that ToBI tone labels are phonological tags (pointers to the signal), not narrow phonetic transcriptions — contrasted explicitly with INTSINT and IViE approaches
6. Design principles for the ToBI framework: language-specificity of inventories, efficiency (don't hand-label what can be derived automatically), modularity of tiers, iterative community development

## Methodology

Historical review and theoretical exposition. The authors trace the development of MAE_ToBI through four workshops (1991-1994), document the consensus model of MAE intonation that underpins the system, catalog all labeling conventions with worked examples, discuss extensions to other languages and tiers, compare with competing transcription approaches (INTSINT, IViE), and identify open research questions.

## Key Equations

None — this is a labeling convention paper, not a modeling paper. However, the following formal structures are defined:

### Tone Inventory (Table 2.2)

Pitch accents: $\text{L*}$, $\text{H*}$, $\text{!H*}$, $\text{L+H*}$, $\text{L+!H*}$, $\text{L*+H}$ ($= \text{L*+!H}$), $\text{H+!H*}$

Phrase accents: $\text{H-}$, $\text{L-}$, $\text{!H-}$ (obligatory at every BI $\geq$ 3)

Boundary tones: $\text{H\%}$, $\text{L\%}$ (obligatory at every BI = 4), $\text{\%H}$ (marginal, phrase-initial after pause)

### Prosodic Hierarchy (from Break Indices)

$$\text{BI}=0 \subset \text{BI}=1 \subset \text{BI}=3 \text{ (intermediate phrase)} \subset \text{BI}=4 \text{ (intonational phrase)}$$

BI=2 is not a level in the hierarchy but a mismatch marker.

## Parameters

| Name | Symbol | Units | Default | Range | Notes |
|------|--------|-------|---------|-------|-------|
| Break Index | BI | integer | 1 | 0-4 | 0=clitic, 1=word, 3=ip, 4=IP; 2=mismatch |
| Pitch accent types | — | category | — | 7 types | H\*, L\*, !H\*, L+H\*, L+!H\*, L\*+H, H+!H\* |
| Phrase accent types | — | category | — | 3 types | H-, L-, !H- |
| Boundary tone types | — | category | — | 3 types | H%, L%, %H |
| Downstep diacritic | ! | modifier | — | — | Marks beginning of compressed pitch range |
| Uncertainty markers | \*?, -?, %? | modifier | — | — | Uncertainty about occurrence |
| Type uncertainty | X\*?, X-?, X%? | modifier | — | — | Uncertainty about tone type |
| Delayed peak | < | marker | — | — | Peak not aligned with accented syllable |
| HiF0 | HiF0 | marker | — | — | Maximum F0 of H accent in intermediate phrase |
| Hesitation | p | diacritic | — | — | Perceived hesitation (1p=cutoff, 2p/3p=prolongation) |

## Implementation Details

### Alignment Rules for Pitch Accent Labels
- **L\*, H+!H\*, L\*+H**: Time stamp placed at F0 minimum within accented syllable
- **H\*, L+H\***: Time stamp placed at F0 maximum within accented syllable (if max is within syllable)
- If F0 maximum is later than end of accented syllable: accent label at amplitude peak, '<' label at actual F0 peak

### Edge Tone Placement
- **Phrase accents (H-, L-)**: Inherit time stamp from Break-Indices tier at BI=3 or BI=4
- **Boundary tones (H%, L%)**: Inherit time stamp from Break-Indices tier at BI=4
- **%H (initial boundary tone)**: Aligned with beginning of phrase-initial word; requires explicit time stamp

### Break Index Semantics
- **BI=0**: Very close inter-word juncture (clitic-like: *gimme*, *doncha*); associated with segmental sandhi (flapping, palatalization)
- **BI=1**: Ordinary phrase-internal word end
- **BI=2**: Mismatch — either BI=1 perceived with unexpected tonal marker/lengthening, or BI=3/4 perceived without expected phrase accent/boundary tone
- **BI=3**: Intermediate phrase end, obligatorily marked with phrase accent
- **BI=4**: Intonational phrase end, obligatorily marked with phrase accent + boundary tone

### Disfluency Marking (Misc tier)
- `disfl<` and `disfl>`: Beginning and end of disfluent stretch
- `disfl`: Extremely localized disfluency
- `%r`: Contour restart (new intonational contour after disruption)

### The Five Consensus Claims of the MAE_ToBI Model
1. Prosodic patterns can be projected onto separate tiers (tones vs. metrical grouping)
2. Intonation contour decomposes into H and L tones (two-level model)
3. Pitch range determined by downstep, upstep, and phrasal prominence (not additional tone levels)
4. Tones are either edge tones or pitch accents, with function determining alignment
5. Two levels of intonational phrasing: intermediate phrase (BI=3) and intonational phrase (BI=4)

## Figures of Interest

- **Fig 2.1 (page 33):** Waveform, F0, and MAE_ToBI xlabel windows for "Okay, they have a couple flights" — shows complete four-tier labeling with \*?, L\*, H-H%, H\*, L+H\*, !H\*, L-L%
- **Fig 2.2 (page 34):** "The Pentagon reports fighting in six southern Iraqi cities" — demonstrates downstepped accents (!H\*), L+H\* with HiF0, break index 2 (mismatch), and X\*? uncertainty
- **Fig 2.3 (page 35):** "Uhh... Quincy. Could I have the number to uh Shore Cab?" — shows BI=2 after "Quincy", hesitation, L-L% and \*? uncertainty about accent on "Shore"

## Results Summary

No quantitative results per se. The paper documents:
- High inter-transcriber agreement overall for MAE_ToBI (citing Silverman et al. 1992, Pitrelli, Beckman & Hirschberg 1994)
- The H\* vs. L+H\* distinction causes the most inter-transcriber disagreement
- Break indices 0 vs. 1 are less consistent due to poor understanding of phonetic bases for clitic grouping
- The system has been successfully extended to German (GToBI), Japanese (J_ToBI), Korean (K_ToBI), Greek, Cantonese (C_ToBI), and Mandarin (M_ToBI)

## Limitations

- The H\* vs. L+H\* contrast may be gradient (prominence-based) rather than categorical, per Ladd and colleagues
- BI=0 vs. BI=1 distinction lacks clear phonetic correlates in many cases
- The dual meaning of BI=2 (tones-breaks mismatch in either direction) is confusing for new transcribers
- No Stress tier is obligatory, though one may be needed for some research questions
- The system is deliberately underspecified for discourse-level prosodic structure above the intonational phrase
- Voice quality variation (glottalization, breathiness) is not systematically captured — the authors call for better phonetic measures of these phenomena
- Timing and rhythmicity are crudely captured compared to articulatory dynamics understanding

## Testable Properties

- Every intermediate phrase (BI=3) must have exactly one phrase accent (H- or L- or !H-)
- Every intonational phrase (BI=4) must have a phrase accent followed by a boundary tone
- Break indices form a non-recursive hierarchy: BI=0 < BI=1 < BI=3 < BI=4 (BI=2 is outside the hierarchy)
- Downstep (!) can only apply to H tones; it marks the beginning of compressed pitch range for all subsequent H targets
- Pitch accent labels must be time-aligned within or near the accented syllable
- Every word on the Words tier must have a corresponding BI label at the same time stamp

## Relevance to Project

This paper is the definitive specification of the MAE_ToBI system by its creators, directly relevant to Qlatt's prosody rule system. The pitch accent inventory (H\*, L\*, L+H\*, etc.), phrase accent and boundary tone categories, and break index scale define the phonological prosodic labels that drive F0 target generation in the TTS frontend. Understanding the alignment rules (where in the syllable each tone target is placed) is essential for correct F0 contour generation. The distinction between intermediate phrases (BI=3, phrase accent) and intonational phrases (BI=4, boundary tone) maps directly to the prosodic phrasing hierarchy used in duration and F0 rules.

## Open Questions

- [ ] How should the H\* vs. L+H\* distinction be handled in synthesis if the contrast is gradient rather than categorical?
- [ ] What are the acoustic correlates of BI=0 (clitic boundary) that could be implemented as duration/coarticulation rules?
- [ ] How should BI=2 (mismatch) be generated in synthesis — is it ever a target, or only an analysis-side phenomenon?
- [ ] Should voice quality parameters (creaky voice at BI=4 boundaries, breathy voice for emphasis) be linked to ToBI labels?

## Related Work Worth Reading

- Pierrehumbert, J. B. (1980), 'The Phonology and Phonetics of English Intonation', Ph.D. dissertation, MIT — the foundational AM model for MAE_ToBI
- Beckman, M. E. and Hirschberg, J. (1994), *The ToBI Annotation Conventions* — the actual labeling guide
- Silverman, K. et al. (1992), 'TOBI: a Standard for Labeling English Prosody' — the original ICSLP paper describing the system
- Pitrelli, J. F., Beckman, M. E. and Hirschberg, J. (1994), 'Evaluation of Prosodic Transcription Labelling Reliability in the ToBI Framework' — inter-transcriber reliability results
- Ladd, D. R. (1996), *Intonational Phonology* — comprehensive treatment of the AM theory
- Beckman, M. E. and Pierrehumbert, J. B. (1986), 'Intonational Structure in Japanese and English' — the intermediate phrase / intonational phrase distinction
- Price, P. et al. (1991), 'The Use of Prosody in Syntactic Disambiguation' — origin of the Break Indices scale
- Wightman, C. et al. (1992), 'Segmental Durations in the Vicinity of Prosodic Phrase Boundaries' — durational correlates of break indices

## Collection Cross-References

### Already in Collection
- [[Pierrehumbert_1980_EnglishIntonation]] — the foundational AM model that MAE_ToBI encodes; Beckman et al. describe how Pierrehumbert's two-tone grammar and decomposition into pitch accents, phrase accents, and boundary tones became the basis for the Tones tier
- [[Silverman_1992_ToBILabelingProsody]] — the original ICSLP paper introducing the ToBI system; this chapter provides the full backstory and design rationale that the conference paper could only summarize
- [[Ladd_2008_IntonationalPhonology]] — comprehensive AM theory treatment; Beckman et al. cite Ladd (1983, 1996) extensively for the theory-neutral downstep treatment and the two-level prosodic hierarchy
- [[Beckman_2022_ToBISystem]] — Jun's later (2022) handbook chapter on ToBI conventions, strengths, and challenges; the present chapter is the earlier (2005) account by the original creators, with more focus on design rationale and workshop history

### Cited By (in Collection)
- [[Beckman_2022_ToBISystem]] — cites this as a comprehensive overview of ToBI's development and cross-linguistic extension

### New Leads (Not Yet in Collection)
- Beckman, M. E. and Hirschberg, J. (1994), *The ToBI Annotation Conventions* — the operational labeling guide, essential companion to this design-rationale chapter
- Price, P. et al. (1991), 'The Use of Prosody in Syntactic Disambiguation' — origin of the Break Indices scale; provides the empirical basis for the juncture hierarchy
- Pitrelli, J. F., Beckman, M. E. and Hirschberg, J. (1994), 'Evaluation of Prosodic Transcription Labelling Reliability in the ToBI Framework' — inter-transcriber reliability data for the system
- Wightman, C. et al. (1992), 'Segmental Durations in the Vicinity of Prosodic Phrase Boundaries' — durational correlates of break indices 3 and 4, directly relevant for duration rules

### Supersedes or Recontextualizes
- [[Silverman_1992_ToBILabelingProsody]] — this chapter supersedes the brief 1992 ICSLP paper with a full-length account of the same system, including historical context, design principles, and worked examples not available in the conference paper

### Conceptual Links (not citation-based)
**Prosodic annotation and transcription:**
- [[Beckman_2022_ToBISystem]] — Jun's 2022 chapter covers the same MAE_ToBI system but from a different angle (conventions + AM+ extension with 5 pitch levels); this 2005 chapter emphasizes the original design rationale and workshop history
- [[Strom_2002_TextToProsodyWithoutToBI]] — proposes an alternative to ToBI-based prosodic annotation for TTS, arguing against discrete tonal labels in favor of continuous parametric representations; directly challenges the design philosophy defended in this chapter
- [[DeTournemire_1998_ProsodicAlphabetTranscription]] — another alternative prosodic transcription system; the comparison illuminates what ToBI's tier-based approach gains and loses
- [[Roach_1994_ProsodicTranscriptionConversion]] — addresses conversion between British and ToBI transcription systems, directly relevant to the cross-system comparison in Section 2.6

**F0 modeling that implements ToBI targets:**
- [[Pierrehumbert_1980_EnglishIntonation]] — provides the phonetic implementation rules (downstep, upstep, interpolation) that map ToBI labels to actual F0 values
- [[OShaughnessy_1976_F0_Prosody]] — F0 modeling for synthesis using rules that operate on the same prosodic categories (accent, phrase boundary) that ToBI annotates
- [[Taylor_2000_TiltModelIntonation]] — the Tilt model parameterizes intonational events as continuous amplitude/duration/tilt values rather than discrete ToBI categories; offers a complementary phonetic-level representation

**Prosodic meaning and pragmatics:**
- [[Trott_2022_ProsodyIndirectRequests]] — investigates how prosodic patterns (which ToBI annotates) signal pragmatic meaning; the break index and pitch accent categories defined here are the annotation tools used in that research
- [[Hellbernd_2016_ProsodySpeechActIntention]] — studies prosodic cues to speech act type, using the same intonational categories (pitch accent type, boundary tone) that this chapter specifies
- [[Mozziconacci_2002_ProsodyEmotions]] — emotion-related prosody variation operates on the same F0, duration, and phrasing dimensions that ToBI annotates

**Autosegmental-Metrical theory:**
- [[Goldsmith_1976_AutosegmentalPhonology]] — the theoretical foundation for the autosegmental representation of tones on separate tiers, which is the core architectural principle of ToBI
