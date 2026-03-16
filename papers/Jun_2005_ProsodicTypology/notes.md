---
title: "Prosodic Typology: The Phonology of Intonation and Phrasing"
authors: "Sun-Ah Jun (Editor); contributors: Beckman, Hirschberg, Shattuck-Hufnagel, Grice, Baumann, Benzmuller, Arvaniti, Baltazani, Gussenhoven, Godjevac, Venditti, Jun, Peng, Chan, Tseng, Huang, Lee, Beckman, Wong, Gordon, Bishop, Fletcher, D'Imperio, Savino, Avesani, Grabe, Warren, Bruce"
year: 2005
venue: "Oxford University Press (Oxford Linguistics)"
doi_url: "ISBN 0-19-924963-6"
---

# Prosodic Typology: The Phonology of Intonation and Phrasing

## One-Sentence Summary
This edited volume establishes a cross-linguistic framework for prosodic typology by describing the intonation and phrasing systems of thirteen typologically diverse languages within the Autosegmental-Metrical (AM) model, providing the complete ToBI annotation inventories for each language.

## Problem Addressed
Before this volume, no single reference described the complete ToBI transcription systems for multiple typologically different languages in one place, making cross-linguistic comparison of prosodic structure difficult. The book fills this gap by presenting all systems in the same theoretical framework.

## Key Contributions
- Comprehensive specification of eleven ToBI systems (MAE_ToBI, GToBI, GRToBI, IToBI, SCToBI, J_ToBI, K-ToBI, M_ToBI, CToBI, Ch-ToBI, BGW ToBI) with complete tone inventories and break index scales
- The MAE_ToBI system specification (Ch. 2): pitch accents (H\*, L\*, L+H\*, L\*+H, H+!H\*), phrase accents (H-, L-), boundary tones (H%, L%), break indices (0, 1, 3, 4), and alignment conventions
- A cross-linguistic prosodic typology model (Ch. 16) categorizing 21 languages along two dimensions: Prominence (lexical and postlexical) and Rhythmic/Prosodic Unit (lexical and postlexical)
- Eight generalizations about prosodic universals and language-specific patterns

## Methodology
Each chapter describes the intonation system of one language (or dialect group) using the AM framework, presenting: (1) the phonological model of intonation, (2) the ToBI transcription system including tone inventory and break indices, and (3) example transcriptions with F0 contours. The final chapter synthesizes these into a typological model comparing prosodic features across all languages.

## Key Data Structures

### MAE_ToBI Record (Table 2.1)
A MAE_ToBI record has six obligatory parts:
1. **Audio** - recording of the utterance
2. **Fo** - fundamental frequency contour record
3. **Tones** - autosegmental transcription of intonation contour
4. **Words** - orthographic transcription with word-end time stamps
5. **Break-Indices** - numeric juncture strength after each word
6. **Misc** - disfluencies, comments, other events

### MAE_ToBI Tones Inventory (Table 2.2)

| Category | Labels | Notes |
|----------|--------|-------|
| Pitch accents | L\*, H\* (!H\*), L-H\* (L+!H\*), L\*-H (L\*-!H), H-!H\* | Aligned with stressed syllable |
| Phrase accents | H- (!H-), L- | Obligatory at every BI >= 3 |
| Boundary tones | H%, L% | Obligatory at every BI = 4 |
| Initial boundary | %H | Marginal, at beginnings after pause |
| Downstep | ! diacritic | Marks beginning of compressed pitch range |
| Uncertainty | \*?, -?, %? | Uncertainty about tone type |
| Phonetic events | < (delayed peak), HiFo | For careful labelling |

### MAE_ToBI Break Index Inventory (Table 2.3)

| BI Value | Meaning |
|----------|---------|
| 0 | Very close inter-word juncture (clitic) |
| 1 | Ordinary phrase-internal word end |
| 3 | Intermediate phrase end, with phrase accent |
| 4 | Intonational phrase end, with boundary tone |
| 2 | Tones-breaks mismatch: perceived 1 with unexpected tonal marker, or lengthening suitable for BI 3/4 without phrase accent/boundary tone |

Diacritics: `-` (uncertainty between adjacent values), `p` (perceived hesitation: 1p=cut-off, 2p/3p=prolongation)

### Five Consensus Claims Underlying MAE_ToBI
1. Prosodic pattern projected onto separate tiers (tonal vs metrical)
2. Intonation contour decomposed into H and L tone levels (static targets, not dynamic)
3. Local pitch range determined by downstep, upstep, and phrasal prominence
4. Tones are either pitch accents (aligned with stressed syllable) or edge tones (aligned with phrase boundary)
5. Two levels of intonational phrasing: intermediate phrase (ip) and intonational phrase (IP)

### Prosodic Hierarchy (from Break Indices)
```
Utterance
  └── Intonational Phrase (IP, BI=4) — bounded by boundary tone (H%, L%)
        └── Intermediate Phrase (ip, BI=3) — bounded by phrase accent (H-, L-)
              └── Prosodic Word (BI=1)
                    └── Clitic group (BI=0)
```

### Cross-linguistic ToBI Summary (Table 16.1)
Key comparisons for English-focused implementation:

| Language | Break Indices | Pitch Accents | Phrase Accents | Boundary Tones | Prosodic Units |
|----------|--------------|---------------|----------------|----------------|----------------|
| English | 0,1,2,3,4 | L\*, H\*, L-H\*, L\*-H, H+!H\* | L-, H- (ip) | L%, H% (IP) | ip, IP |
| German | 3,4 | L\*, H\*, L-H\*, L\*-H, H+!H\*, H-L\* | L-, H-, !H- (ip) | L%, H%, ^H% (IP) | ip, IP |
| Japanese | 0,1,2(AP),3(IP) | H'-L | H-, L.%, %L (AP) | H%, LH%, HL% (IP) | AP, IP |
| Korean | 0,1,2(AP),3(IP) | L, H, +H, L-, Ha, LHa (AP) | L.%, H%, LH%, etc. (IP) | | AP, IP |

### Prosodic Typology Model (Table 16.2)

Two dimensions classify language prosody:

**Dimension 1: Prominence**
- Lexical: tone, stress, lexical pitch-accent (LPA)
- Postlexical: head-marking (culminative pitch accent) vs edge-marking (demarcative boundary tones)

**Dimension 2: Rhythmic/Prosodic Unit**
- Lexical timing: mora, syllable, foot (stress-timed)
- Postlexical units: Accentual Phrase (AP), intermediate phrase (ip), Intonational Phrase (IP)

English: stress + head-marking + foot-timed + ip + IP

### Eight Generalizations on Prosodic Typology (Section 16.3)
(a) All languages have at least one prosodic unit above the word.
(b) In stress languages, word prominence is always marked by postlexical pitch accent (head), but not often by edge marking.
(c) Most lexical pitch-accent languages mark prominence both culminatively (head) and demarcatively (edge) at the postlexical level.
(d) Languages without any lexical prosody feature mark word prominence demarcatively at the postlexical level.
(e) Non-stress languages can have postlexical pitch accent.
(f) Number and type of rhythmic/prosodic units at the postlexical level are not predictable from the lexical rhythmic unit or lexical prominence type.
(g) No direct relationship between type of lexical prominence and type of lexical rhythmic unit; also no relationship between postlexical prominence type and postlexical rhythmic/prosodic unit type. But edge marking of postlexical prominence is predictable from the AP category.
(h) Type of postlexical prominence is partially predictable from type of lexical prominence.

## Parameters

| Name | Values | Description |
|------|--------|-------------|
| Break Index | 0, 1, 2, 3, 4 | Perceived degree of juncture between words |
| Pitch Accent | L\*, H\*, L+H\*, L\*+H, H+!H\* | Tone targets aligned to stressed syllables |
| Phrase Accent | H-, L- | Edge tone at intermediate phrase boundary |
| Boundary Tone | H%, L% | Edge tone at intonational phrase boundary |
| Downstep | ! diacritic | Compressed pitch range following H L H sequence |

## Implementation Details

### Tone-to-F0 Mapping (from Ch. 2, Section 2.3)
- H and L are relative to local phrasal pitch range, not absolute Hz values
- Downstep (!) compresses all subsequent H tones within the IP
- L\* accent: F0 stays low on accented syllable
- H\* accent: F0 rises to peak on accented syllable
- L+H\* accent: F0 valley before stressed syllable, peak on or near stressed syllable
- L\*+H accent: F0 minimum within accented syllable, followed by rise
- H+!H\* accent: Step down to accented syllable from preceding H

### Alignment Conventions
- Pitch accent label placed within the accented syllable
- L\* and H+!H\*: at F0 minimum/step within syllable
- H\* and L+H\*: at F0 maximum within or near syllable
- L\*+H: at F0 minimum within syllable (with '<' at actual peak if peak is late)
- Phrase accent and boundary tone inherit time from break index label
- %H initial boundary tone aligned to phrase-initial word beginning

### Prosodic Phrasing Rules for English
- Every intermediate phrase ends with a phrase accent (H- or L-)
- Every intonational phrase ends with phrase accent + boundary tone sequence
- Nuclear pitch accent is the last accent in the intermediate phrase
- Post-nuclear tail: stretch from nuclear accent to phrase end
- Pre-nuclear head: all accents before the nuclear accent
- Boundary tone can be at same time stamp as break index

### Key Cross-linguistic Insight for Synthesis
- Average Intonation Phrase duration: ~1.5 seconds across languages
- Accentual Phrase size: 3-5 syllables (Japanese 4-5, Korean 3-4, French ~1.2 content words)
- IP size: 7-10 syllables (English), 12-15 syllables (Korean)
- Focus realization differs: English uses L+H\* pitch accent followed by deaccenting; Japanese/Korean use prosodic boundary insertion and dephrasing

## Figures of Interest
- **Fig 2.1 (p.20):** MAE_ToBI xlabel windows showing waveform, F0, Tones, Words, Break-Indices for "Okay... They have a couple flights"
- **Fig 2.2 (p.21):** MAE_ToBI for "The Pentagon reports fighting in six southern Iraqi cities" showing downstep sequence
- **Fig 2.3 (p.22):** MAE_ToBI for "Uhh... Quincy. Could I have the number to uh... Shore Cab?" showing hesitation handling
- **Table 16.1 (pp.434-435):** Summary of eleven ToBI systems across all languages
- **Table 16.2 (p.444):** Prosodic typology of 21 languages by Prominence and Rhythmic/Prosodic Unit

## Results Summary
The volume demonstrates that the AM framework and ToBI annotation system can be successfully extended to typologically diverse languages, from stress-accent (English, German) to pitch-accent (Japanese, Swedish) to tone (Mandarin, Cantonese) to languages with no lexical specification of prosody (Korean). All languages show at least two levels of postlexical prosodic grouping above the word, and intonational pitch range effects (downstep, upstep) appear universally.

## Limitations
- The AM model does not directly specify lexical prosody or timing units; these must be added separately
- Tone languages (Mandarin, Cantonese) do not fit neatly into the pitch accent inventory; their ToBI systems use boundary tones and pitch range labels rather than pitch accents
- The typology model in Ch. 16 is based on only 21 languages and the classifications are debatable for some (e.g., Italian timing, French ip status)
- Break index values 0 and 2 are the least well-defined and least consistently applied across transcribers
- Tone-meaning mapping is language- and dialect-specific; cannot be generalized

## Testable Properties
- Break index 4 boundaries must always have both a phrase accent and a boundary tone
- Break index 3 boundaries must always have a phrase accent but no boundary tone
- Every intermediate phrase must contain at least one pitch accent
- Downstep (!) can only appear on H tones, never on L tones
- The nuclear accent is always the last pitch accent in the intermediate phrase
- In English, pitch accent alignment: L\* at F0 minimum within syllable, H\* at F0 maximum
- Accentual Phrase size should average 3-5 syllables cross-linguistically
- IP duration should average approximately 1.5 seconds in read speech

## Relevance to Project
This volume provides the theoretical and notational foundation for Qlatt's prosody rules. The MAE_ToBI system (Ch. 2) defines the complete inventory of tonal events and break indices that the synthesizer's prosody phase must generate and realize as F0 targets. The typology framework (Ch. 16) informs how the system could be extended to other languages. Specific practical relevance includes: the pitch accent inventory constraining which F0 patterns to synthesize, the break index scale mapping to duration lengthening and pause insertion rules, the phrase accent + boundary tone system determining post-nuclear F0 contours, and the alignment conventions specifying where F0 targets attach relative to segmental timing.

## Open Questions
- [ ] How exactly should downstep be realized in Hz? The book describes it phonologically but provides no quantitative mapping.
- [ ] What is the optimal way to handle BI=2 (tones-breaks mismatch) in synthesis? The description suggests it is a catch-all for ambiguous cases.
- [ ] The ip (intermediate phrase) in English lacks clear acoustic definition beyond phrase accent presence. What duration/F0 cues distinguish ip from IP for synthesis?

## Related Work Worth Reading
- Pierrehumbert, J. (1980). *The Phonology and Phonetics of English Intonation*. Ph.D. dissertation, MIT. — The foundational AM analysis underlying all ToBI systems.
- Beckman, M. and Hirschberg, J. (1994). *The ToB! Annotation Conventions*. — The original ToBI guidelines document.
- Ladd, D. R. (1996). *Intonational Phonology*. Cambridge University Press. — Comprehensive theoretical treatment of AM intonation.
- Pierrehumbert, J. and Beckman, M. (1988). *Japanese Tone Structure*. — Extension of AM model to pitch-accent language.
- Silverman, K. et al. (1992). ToB!: A Standard for Labeling English Prosody. — The original ToBI proposal.
- Hirst, D. and Di Cristo, A. (1998). *Intonation Systems: Survey of Twenty Languages*. — Complementary cross-linguistic survey using different framework (INTSINT).
- Nespor, M. and Vogel, I. (1986). *Prosodic Phonology*. — Theoretical prosodic hierarchy.
- Wightman, C. et al. (1992). Segmental Durations in the Vicinity of Prosodic Phrase Boundaries. *JASA*, 91/3: 1707-17. — Duration effects at boundaries.
