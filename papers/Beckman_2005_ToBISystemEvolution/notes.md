---
title: "The Original ToBI System and the Evolution of the ToBI Framework"
authors: "Mary E. Beckman, Julia Hirschberg, and Stefanie Shattuck-Hufnagel"
year: 2005
venue: "Chapter 2 in Sun-Ah Jun (ed.), *Prosodic Models and Transcription: Towards Prosodic Typology*, Oxford University Press"
doi_url: "Preprint draft"
---

# The Original ToBI System and the Evolution of the ToBI Framework

## One-Sentence Summary
This chapter provides the definitive account of how the MAE_ToBI prosodic annotation system was designed, specifying the complete inventory of tonal labels, break indices, and inter-tier constraints that form the standard for annotating American English intonation and phrasing.

## Problem Addressed
Before ToBI, there was no community-wide standard for transcribing intonation and prosody in spoken English, making it impossible to share prosodically annotated speech databases across research sites or to train consistent automatic prosody models for TTS.

## Key Contributions
- Complete specification of the MAE_ToBI annotation system: six obligatory parts (audio, F0, Tones, Words, Break-Indices, Misc tiers)
- Full inventory of Tones-tier labels (Table 2.2) and Break-Indices-tier labels (Table 2.3)
- Articulation of the five consensus claims about MAE intonation underlying the system
- Distinction between "ToBI" (the general framework for developing prosodic annotation systems) and "MAE_ToBI" (the specific system for Mainstream American English)
- Design principles for building ToBI-framework systems for new languages
- Discussion of the phonological vs phonetic status of symbolic tags

## Methodology
Historical chronicle of four Prosodic Transcription Workshops (1991-1994) that produced the ToBI conventions, followed by systematic description of the annotation system and its theoretical foundations in autosegmental-metrical phonology.

## Key Inventories and Tables

### Table 2.1: Six Obligatory Parts of a MAE_ToBI Record

| Component | Description |
|-----------|-------------|
| audio | Audio recording of the utterance |
| F0 | Electronic/paper record of fundamental frequency contour |
| Tones | Autosegmental transcription of the intonation contour |
| Words | Orthographic transcription with time-indexed word ends |
| Break-Indices | Numeric index of perceived juncture degree after each word |
| Misc | Markers for disfluencies, comments, miscellaneous events |

### Table 2.2: MAE_ToBI Tones-Tier Labels

**Basic tones:**
- Phrase accents: H- (!H-), L- (obligatorily placed at every BI >= 3)
- Boundary tones: H%, L% (obligatory at every BI = 4); %H (marginal, at beginnings of some intonational phrases after pause)
- Pitch accents: L\*, H\* (!H\*), L+H\* (L+!H\*), L\*+H (L\*+!H), H+!H\*

**Other labels:**
- Downstep: e.g., !H\*, L+!H\*, !H- (the ! diacritic marks beginning of compressed pitch range)
- Uncertainty: \*?, -?, %? (about occurrence); X\*?, X-?, X%? (about tone type)
- Phonetic events in careful labelling:
  - `<` (delayed peak)
  - `HiF0` (maximum F0 associated with H of an accent within an intermediate phrase)
- Restart: `%r` (see the Misc tier)

### Table 2.3: MAE_ToBI Break-Indices Tier Labels

| Value | Meaning |
|-------|---------|
| 0 | Very close inter-word juncture (e.g., *gimme*, *doncha*) |
| 1 | Ordinary phrase-internal word end |
| 2 | Perceived 1 with unexpected tonal marker, or lengthening appropriate for 3/4 without phrase accent/boundary tone |
| 3 | Intermediate phrase end, with phrase accent |
| 4 | Intonational phrase end, with boundary tone |

**Diacritics:**
- `-` (uncertainty): e.g., 4- means intermediate between 3 and 4
- `p` (perceived hesitation): 1p for "cutoff", 2p and 3p for "prolongation"

## Five Consensus Claims About MAE Intonation

1. **Separate tiers**: Prosodic pattern projects onto separate tiers for tones (linear autosegmental string) and break indices (hierarchical metrical structure)
2. **Two tone levels**: Intonation contour decomposes into H vs L tones as static targets in paradigmatic contrast, relative to local phrasal pitch range
3. **Pitch range effects**: Local pitch range is determined by phrasal prominence, **downstep** (compression beginning at a downstepped H target) and **upstep** (raising beginning at a H- phrase accent); these are specified independently of tone level
4. **Edge tones vs pitch accents**: Tones are functionally either edge tones or affiliated with pitch accents; a tone's absolute pitch depends on both function and position
5. **Two levels of phrasing**: Contrastively H vs L edge tones at two levels — **intermediate phrase** (phrase accent) vs **intonational phrase** (boundary tone); the phrase accent defines the beginning of the post-nuclear **tail**

## Tone Alignment Rules

- **L\*, H+!H\*, L\*+H**: Time stamp placed at F0 minimum within accented syllable
- **H\*, L+H\***: Time stamp placed at F0 maximum within accented syllable (if max is within the syllable)
- If maximum is later than syllable end: accent label at amplitude peak, `<` label at actual F0 peak
- **Edge tones** (L-, H-, L%, H%): Inherit time stamp from the break index at phrase boundary
- **%H** (initial boundary tone): Aligned with beginning of phrase-initial word

## Implementation Details

### Prosodic Hierarchy (Non-Recursive)
- Prosodic word < Intermediate phrase < Intonational phrase
- Break indices map directly to this hierarchy: BI=3 marks intermediate phrase, BI=4 marks intonational phrase
- No break indices 5 or 6 (unlike Price et al. 1991) — units above intonational phrase are not categorically marked

### Downstep Mechanism
- Marked by `!` diacritic on the first affected tone
- Signals beginning of compressed pitch range
- Not only the marked tone but all subsequent H tones are lower relative to their "expected" value
- In English, triggered by alternation of tone levels specific to a rising or falling pitch accent
- Theory-neutral approach following Ladd (1983)

### Break Index 2 — Mismatch Marker
- NOT a level of the metrical hierarchy
- Marks two types of mismatch between perceived disjuncture and tonal marking:
  1. Perceived BI=3/4 (lengthening, pausing) but no phrase accent in tone pattern
  2. Perceived BI=1 (ordinary juncture) despite clear phrase accent or boundary tone
- Common source of confusion for new transcribers

### Uncertainty Conventions
- `*?` — uncertainty about whether a syllable has a pitch accent
- `-?` — uncertainty about whether a phrase accent has occurred
- `%?` — uncertainty about whether a boundary tone has occurred
- `X*?`, `X-?`, `X%?` — uncertainty about tone type (accent is present but type unclear)
- `3-`, `4-` on Break-Indices tier — uncertainty about boundary strength

### Extensions Common Across Sites
- **Phones tier**: Segmental transcription (often auto-aligned via HMM tools like Aligner)
- **Syllable tier**: Derived from Phones tier
- **Stress tier**: Numerical index of syllable prominence (distinct from break indices)
- **Comments tier**: Alternate analyses, inter-transcriber disagreements
- **Code tier**: Dialect or register marking
- **Phonetic tier**: Non-canonical tone targets for under-studied varieties

## Figures of Interest
- **Fig 2.1 (page 33):** Waveform, F0 contour, and MAE_ToBI xlabel windows for "Okay... They have a couple flights" — shows *?, L*, H-H%, H*, L+H*, !H*, L-L% labelling with BI values 4,4,4,1,1,1,1,4
- **Fig 2.2 (page 34):** "The Pentagon reports fighting in six southern Iraqi cities" — shows HiF0, L-H%, L+H*, !H*, !H*, X*?, L-L% with downstepped accents and BI=2 mismatch markers
- **Fig 2.3 (page 35):** "Uhh... Quincy. Could I have the number to uh Shore Cab?" — shows HiF0, L-, H*, !H*, L-L%, *?, H*, H-L% with BI=2 after "Quincy"

## Results Summary
- High inter-transcriber reliability demonstrated across multiple studies (Silverman et al. 1992; Pitrelli, Beckman and Hirschberg 1994)
- Successfully extended to German, Japanese, Korean, Greek, Cantonese, Mandarin, and other languages
- Large labelled corpora now exist (BU FM Radionews, Australian ANDOSL Map Task dialogs, Columbia MAGIC corpus)

## Limitations
- Break index 2 is acknowledged as confusing and awkward
- The H* vs L+H* distinction causes the most inter-transcriber disagreement — may be gradient rather than categorical
- System is vague about segmental effects relevant to break indices (e.g., flapping, glottalization)
- No Stress tier is obligatory in MAE_ToBI (unlike M_ToBI for Mandarin)
- Phonetic representations of voice quality, timing, and rhythm are acknowledged as crude compared to F0 tracking
- The system is explicitly language-specific; cannot be applied directly to new varieties without establishing an intonation inventory first

## Testable Properties
- Every intermediate phrase (BI=3) must have exactly one phrase accent (H- or L-)
- Every intonational phrase (BI=4) must have a phrase accent followed by a boundary tone
- Pitch accents must be aligned to stressed syllables of content words
- The `!` diacritic implies all subsequent H tones in the phrase are produced in a compressed pitch range
- Break index values must be in {0, 1, 2, 3, 4} (no 5 or 6)
- Every word on the Words tier must have a corresponding Break-Indices tier label at the same time stamp
- If BI >= 3, there must be a phrase accent on the Tones tier
- If BI = 4, there must be a boundary tone on the Tones tier

## Relevance to Project
This is the foundational reference for the prosodic annotation system that Qlatt's prosody rules are designed to generate. The pitch accent inventory (H\*, L\*, L+H\*, L\*+H, H+!H\*), phrase accent types (H-, L-), boundary tone types (H%, L%), and break index hierarchy (0-4) directly map to the F0 target generation system in the declarative rule engine. The alignment rules for tone labels specify where in the syllable/segment sequence F0 targets should be placed. The downstep mechanism informs how pitch range compression should be modeled across successive accents. The break index hierarchy maps to the phrase boundary effects (final lengthening, pause insertion) already implemented in the duration and prosody rule phases.

## Open Questions
- [ ] How should the H* vs L+H* distinction be handled in synthesis when it may be gradient rather than categorical?
- [ ] Should Qlatt implement break index 2 (mismatch) or treat it as equivalent to 1?
- [ ] How to map the phonetic alignment conventions (< for delayed peak, HiF0) into F0 contour generation?

## Related Work Worth Reading
- Pierrehumbert (1980) — The original AM phonology of English intonation (foundational for all ToBI labels)
- Beckman and Pierrehumbert (1986) — Intonational structure in Japanese and English
- Price, Ostendorf, Shattuck-Hufnagel and Fong (1991) — Break indices for prosodic disambiguation
- Silverman et al. (1992) — ToBI standard definition paper
- Pitrelli, Beckman and Hirschberg (1994) — Inter-transcriber reliability evaluation
- Ladd (1996) — *Intonational Phonology* (textbook treatment of the AM theory)
- Wightman et al. (1992) — Durational correlates of prosodic boundaries (directly relevant to duration rules)

## Collection Cross-References

### Already in Collection
- [[Pierrehumbert_1980_EnglishIntonation]] — Cited as the foundational AM model of English intonation from which all ToBI pitch accent and boundary tone labels derive
- [[Silverman_1992_ToBILabelingProsody]] — The original ToBI standard definition paper (Silverman et al. 1992)
- [[Beckman_2022_ToBISystem]] — Later overview of the same system with AM+ theoretical extension proposing five pitch levels
- [[Ladd_2008_IntonationalPhonology]] — Cited extensively for the treatment of downstep (Ladd 1983), pitch range (Ladd 1993), and intonational phonology (Ladd 1996/2008)
- [[OShaughnessy_1976_F0_Prosody]] — Cited indirectly through the prosody modeling tradition; O'Shaughnessy's F0 rules are an implementation of the kind of contour generation this annotation system describes
- [[Campbell_Isard_1991_SegmentDurationsSyllable]] — Cited for segment duration modeling (Campbell and Isard 1991)
- [[Roach_1994_ProsodicTranscriptionConversion]] — Cited for conversion between prosodic transcription systems including ToBI (Roach 1994)

### New Leads (Not Yet in Collection)
- Wightman, Shattuck-Hufnagel, Ostendorf and Price (1992) — "Segmental Durations in the Vicinity of Prosodic Phrase Boundaries" (JASA 91:1707-1717) — Quantitative duration measurements at prosodic boundaries, directly relevant to duration rules
- Pitrelli, Beckman and Hirschberg (1994) — "Evaluation of Prosodic Transcription Labelling Reliability in the ToBI Framework" — Inter-transcriber reliability data showing which distinctions are robust
- Beckman and Ayers (1994) — *Guidelines for ToBI Labelling* — The official practical labeling guide
- Price, Ostendorf, Shattuck-Hufnagel and Fong (1991) — "The Use of Prosody in Syntactic Disambiguation" (JASA 90:2956-2970) — The break index system that ToBI adopted

### Supersedes or Recontextualizes
- [[Beckman_2022_ToBISystem]] — The 2022 overview extends this chapter with the AM+ five-pitch-level framework (EH, H, M, L, EL) and feature specifications not present in this 2005 version

### Cited By (in Collection)
- [[Beckman_2022_ToBISystem]] — Cites this as the comprehensive overview of ToBI's development and cross-linguistic extension
- [[Trott_2022_ProsodyIndirectRequests]] — Cites this (as Beckman et al. 2004) for the ToBI framework used in prosody analysis

### Conceptual Links (not citation-based)
- [[Goldsmith_1976_AutosegmentalPhonology]] — ToBI's Tones tier is a direct implementation of Goldsmith's autosegmental representation; the paper's multi-tier architecture (tones projected independently from metrical structure) is the practical realization of autosegmental phonology for prosody annotation
- [[Strom_2002_TextToProsodyWithoutToBI]] — Strom proposes bypassing ToBI entirely for TTS prosody generation, arguing that direct acoustic prediction can outperform the symbolic ToBI intermediate representation that this chapter defines; the two papers represent opposing architectural philosophies for prosody in synthesis
- [[DeTournemire_1998_ProsodicAlphabetTranscription]] — Alternative prosodic transcription approach; the relationship between symbolic prosodic annotation systems and their phonetic interpretation is a central concern of both works
