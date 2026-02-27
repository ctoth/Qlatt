# TOBI: A Standard for Labeling English Prosody

**Authors:** Kim Silverman, Mary Beckman, John Pitrelli, Mari Ostendorf, Colin Wightman, Patti Price, Janet Pierrehumbert, Julia Hirschberg
**Year:** 1992
**Venue:** 2nd International Conference on Spoken Language Processing (ICSLP 92), Banff, Alberta, Canada, October 12-16, 1992
**DOI:** 10.21437/ICSLP.1992-260
**Pages:** 867-870

## One-Sentence Summary
Defines the ToBI (Tones and Break Indices) prosodic transcription standard -- a multi-tier annotation system for English prosody with demonstrated high inter-transcriber reliability, providing the canonical framework for labeling pitch accents, phrase boundaries, and break indices in speech.

## Problem Addressed
No standard existed for prosodic transcription analogous to IPA for phonetic segments. This prevented large-scale prosodically annotated corpora, comparative evaluation across sites, and computational modeling of prosody. Different research groups used incompatible notations.

## Key Contributions
- Defined a multi-tier prosodic transcription system (ToBI) with three core tiers: tonal, break index, and miscellaneous
- Demonstrated high inter-transcriber reliability (80%+ agreement) across 20 transcribers with varied experience
- Established ASCII file formats for machine-readable prosodic annotations
- Created a framework extensible to other languages and dialects
- Showed that even inexperienced transcribers learn ToBI tonal transcription quickly (less than 1 day training)

## Methodology
Two workshops (MIT August 1991, NYNEX April 1992) brought together researchers from academia and industry. A draft system was created, then 25 test utterances representing diverse speaking styles were distributed to 20 transcribers. Agreement was calculated across all possible transcriber pairs for each word.

## System Description

### Three Tiers

#### 1. Tonal Tier
Based on Pierrehumbert's (1980) intonational phonology [3]. Transcribes the tune as a linear sequence of pitch events sparsely distributed across text.

**Five pitch accents** (modified from Pierrehumbert's original six):
- H*, L*, L+H*, L*+H, H+!H*
- Note: the downstep-inducing H* has been deleted; downstepped high tones explicitly marked (e.g., `!H*`)
- Downstep being implicitly triggered by left-hand context characteristics

**Boundary tones:**
- One initial boundary tone (transcribed as %H)
- Two levels of phrasing, each with its own boundary tone:
  - **Intermediate phrase**: phrase accent at right edge
  - **Intonational phrase**: boundary tone at right edge
  - Highest pitch accent within each intermediate phrase marked at time point of highest F0

#### 2. Break Index Tier
Based on Price et al.'s "break indices" [5]: a seven-point scale from 0 to 6. ToBI merges the three highest break indices (representing intonational phrases and groupings) into a single category.

**Break index levels:**
- **0**: Cliticization (reduced boundary)
- **1**: Normal inter-word boundary
- **2**: Intermediate (stronger than 1, weaker than phrase)
- **3-4** (merged from original 4-6): Intermediate and full intonational phrase boundaries

Additionally, diacritics mark pauses and a mechanism resolves conflicts between break indices and tonally-defined phrasing.

#### 3. Miscellaneous Tier
Marks hesitations, disfluencies, breaths, laughs, false starts, restarts, and other spontaneous speech effects. Onset and offset of these effects are marked. A small set of items is defined, with a format for users to define their own.

## Parameters

| Name | Symbol | Values | Notes |
|------|--------|--------|-------|
| Pitch accent | H*, L*, L+H*, L*+H, H+!H* | 5 types | Marks prominence on associated word |
| Phrase accent | H-, L- | 2 types | Right edge of intermediate phrase |
| Boundary tone | H%, L% | 2 types | Right edge of intonational phrase |
| Initial boundary | %H | 1 type | Left edge marking |
| Break index | 0-4 | Integer scale | Strength of juncture between words |

## Implementation Details

### File Format
- Each tier stored as a separate ASCII file
- File formats defined for Entropic WAVES signal editing package
- Additional formats independent of any particular software system
- Scripts for conversion between file formats
- Standard UNIX tools for checking transcription files for grammaticality and flagging errors

### Software Support
- Entropic WAVES-based scripts for transcription facilitation
- Display shows speech waveform with time-aligned F0 and energy plots
- Mouse-driven menus for inventory items in each tier
- UNIX tools for checking grammaticality of transcription files

### Transcription Procedure
1. Listen to utterance
2. Mark tonal events (pitch accents, phrase accents, boundary tones) at associated time points
3. Mark break indices between each pair of adjacent words
4. Mark miscellaneous events (disfluencies, etc.)

## Evaluation Results

### Pitch Accent Agreement (Table 1)

| Transcribers | N pairs | Word accented? | Pitch type | +/- downstep |
|---|---|---|---|---|
| 4 (experienced) | 973 | 86% | 64% | 79% |
| 6 | 2250 | 88% | 67% | 78% |
| 20 (all) | 37908 | 83% | 61% | 73% |

### Phrase Accent Agreement (Table 2)

| Transcribers | N pairs | Phrase accent present? | Type agreement |
|---|---|---|---|
| 4 | 968 | 91% | 87% |
| 6 | 2243 | 91% | 89% |
| 20 | 37840 | 91% | 81% |

### Boundary Tone Agreement (Table 3)

| Transcribers | N pairs | Boundary tone present? | Type agreement |
|---|---|---|---|
| 4 | 968 | 94% | 90% |
| 6 | 2243 | 95% | 91% |
| 20 | 37840 | 95% | 89% |

### Break Index Agreement (Table 4)

| Transcribers | N pairs | Exact match | Within +/- 1 |
|---|---|---|---|
| 4 | 1452 | 69% | 94% |
| 20 | 33636 | 67% | 93% |

### Other Evaluations
- Wightman study: 8 subjects marked prominences in 6 minutes of spontaneous speech with no training, achieved 84% agreement (83-88% range), comparable to Table 1
- Merging 8 label sets with 3-of-8 criterion produced labels with 90% agreement with expert labeler
- Ostendorf et al. [6]: two untrained transcribers achieved 81% tonal structure and 68% break index agreement after one day training; relaxed to 92% and 94% respectively

## Figures of Interest
- No figures in paper; results presented entirely in tables

## Results Summary
ToBI achieves 80%+ reliability across most categories even with 20 transcribers of varied experience. Break index transcription is learned faster than tonal transcription. The system captures major prosodic phenomena while allowing uncertainty representation and subset transcription.

## Limitations
- Authors acknowledge disagreement sources: distinguishing L+H* from H*, detecting downstepped accents, H*+H from L*, boundary tone categories
- Second workshop addressed these by refining definitions (adding diacritics for cliticization, mechanism for resolving break index/tone conflicts)
- Evaluation was for the draft version; current version evaluation underway at time of publication
- System designed primarily for American English; other languages require adaptation

## Testable Properties
- Break index values must be integers in [0, 4]
- Every word boundary must have exactly one break index label
- Pitch accents must be one of exactly 5 types: H*, L*, L+H*, L*+H, H+!H*
- Phrase accents must be one of: H-, L-
- Boundary tones must be one of: H%, L%
- Every intermediate phrase must have exactly one phrase accent at its right edge
- Every intonational phrase must have exactly one boundary tone at its right edge
- Higher break indices correlate with stronger perceived boundaries (monotonic)
- Inter-transcriber agreement on accent presence should exceed 80% for trained transcribers
- Agreement on break indices within +/- 1 should exceed 90%

## Relevance to Project
ToBI is the standard prosodic annotation framework. For the Qlatt TTS frontend, ToBI provides:
1. The canonical inventory of pitch accent types that map to F0 contour patterns
2. Break index levels that determine phrase boundary behavior (preboundary lengthening, pause insertion, boundary tone realization)
3. The conceptual framework for any prosody model -- pitch accents associate with stressed syllables, phrase tones mark edges
4. A basis for converting text-derived prosodic structure into concrete F0 and timing targets for the Klatt synthesizer

## Open Questions
- [ ] How exactly do ToBI labels map to F0 contour shapes in synthesis? (Need Pierrehumbert 1980 for the phonological model)
- [ ] What are the acoustic correlates of each break index level in terms of duration, pause, and F0 reset?
- [ ] How does the ToBI model interact with the Fujisaki model or other quantitative F0 generation approaches?

## Related Work Worth Reading
- Pierrehumbert (1980) - PhD thesis on English intonational phonology (the theoretical foundation for ToBI tonal tier)
- Price et al. (1991) - "The Use of Prosody in Syntactic Disambiguation" (J. Acoust. Soc. Am.) -- break indices origin
- Beckman & Ayers (1997) - "Guidelines for ToBI Labelling" (the actual annotation manual, more detailed than this overview paper)
- Pierrehumbert & Hirschberg (1990) - "The Meaning of Intonation Contours in the Interpretation of Discourse" (semantics/pragmatics of pitch accents)
- Wightman et al. (1992) - Segmental durations in the vicinity of prosodic phrase boundaries (acoustic correlates)

## Collection Cross-References

### Already in Collection
- **Pierrehumbert_1980_EnglishIntonation** -- the foundational phonological model for the ToBI tonal tier; defines H/L tones, pitch accents, phrase accents, boundary tones, downstep rules
- **Beckman_2022_ToBISystem** -- later comprehensive description of the MAE_ToBI system with AM+ theoretical extension (5 pitch levels)
- **Ladd_2008_IntonationalPhonology** -- the definitive AM theory textbook that builds on Pierrehumbert and uses ToBI as annotation framework
- **OShaughnessy_1976_F0_Prosody** -- F0 generation rules for TTS that implement prosodic structure similar to what ToBI annotates

### New Leads (Not Yet in Collection)
- Price, Ostendorf, Shattuck-Hufnagel & Fong (1991) - "The Use of Prosody in Syntactic Disambiguation" (J. Acoust. Soc. Am.) -- origin of break indices concept
- Price, Wightman, Ostendorf & Bear (1990) - "The Use of Relative Duration in Syntactic Disambiguation" (ICSLP 1990) -- durational cues for prosodic boundaries
- Pierrehumbert & Hirschberg (1990) - "The Meaning of Intonation Contours" (in Plans and Intentions in Communication) -- pragmatic interpretation of ToBI labels
- Hirschman et al. (1992) - MADCOW multi-site data collection for spoken language corpus

### Supersedes or Recontextualizes
- None identified; this is a foundational standard definition paper
