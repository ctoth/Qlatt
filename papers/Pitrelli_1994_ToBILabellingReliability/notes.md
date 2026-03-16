---
title: "Pitrelli, Beckman & Hirschberg 1994 -- Implementation Notes"
year: 1994
---

# Pitrelli, Beckman & Hirschberg 1994 -- Implementation Notes

## Paper Overview

Evaluates inter-transcriber reliability for the ToBI (TOnes and Break Indices) prosodic labeling system. 26 transcribers at 14 sites independently labeled 34 utterances from 4 databases. This is the definitive reliability study for ToBI as a prosodic annotation standard.

## ToBI System Structure

ToBI consists of parallel tiers:

1. **Tone tier** -- intonational analysis (most important)
2. **Break index tier** -- strength of coherence/disjuncture between adjacent words
3. **Orthographic tier** -- word labels
4. **Miscellaneous tier** -- spontaneous-speech effects (laughter, hesitations)
5. Additional site-/user-/task-specific tiers can be added freely

### Tone Tier Elements

Three types of tonal events marked on the tone tier:

**H% or L% boundary tones** -- must mark the end of each well-formed intonational phrase. Optional %H can mark the beginning.

**H- or L- phrase accents** -- must go after the last pitch accent in the intermediate phrase, filling the space until the end of the phrase or the boundary tone.

**Pitch accents** -- associated with stressed syllables of prominent words. At least one per intermediate phrase. Five types:

| Label | Contour | Typical Function |
|-------|---------|-----------------|
| H* | simple high | canonical declarative |
| L* | simple low | yes-no question |
| L+H* | rising to high from low | contrastive focus |
| L*+H | "scooped" late rise | pragmatic uncertainty |
| H+!H* | fall onto stress | pragmatic inference |

Additional variants: !H* and !H- (downstepped counterparts with "!" diacritic indicating pitch range compression).

### Break Index Tier

Hierarchy of perceived disjuncture between words:

| Index | Meaning |
|-------|---------|
| 0 | closely grouped phonetically (e.g., flapping of /t/) |
| 1 | between two different prosodic words |
| 2 | strong disjuncture with pause/virtual pause BUT no tonal marks; OR weaker-than-expected disjuncture at what is tonally a clear phrase boundary |
| 3 | intermediate phrase boundary |
| 4 | full intonational phrase boundary |

Diacritics: **p** on indices 1, 2, 3 for disfluency (1p = abrupt cutoff, 3p = hesitation pause). **?** for transcriber uncertainty. **-** (minus) on tonal labels for uncertainty.

## Methodology

### Subjects
- 26 transcribers from 14 sites
- Mix of experienced ToBI users (9), experienced with prosodic transcription but new to ToBI (11), and new to prosodic transcription (6)
- Trained with self-paced training materials (document + recorded examples)

### Database
- 34 utterances, 489 words, 148 seconds total
- **WSJ**: 8 utterances, 119 words, 40s, 4 speakers (read general-text)
- **ATIS**: 9 utterances, 85 words, 36s, 7 speakers (simulated human-machine)
- **TRAINS**: 7 utterances, 81 words, 25s, 7 speakers (spontaneous human-human dialog)
- **SAILOR**: 10 utterances, 204 words, 47s, 1 speaker (spontaneous monologue, Ohio dialects)

### Materials Provided Per Utterance
- Waveform sampled at 8000 Hz
- F0 contour with analysis rate of 100 Hz
- Time-aligned orthographic transcription
- Dummy break-index file with placeholder Xs at each word boundary (except final obligatory 4)

### Agreement Metric
Unit of measurement: **transcriber-pair-word** -- comparison of labels from two particular transcribers on one particular word boundary. Stringent metric: when 3 of 4 transcribers agree, score is 3/6 pairs agreeing (50%), not 75%.

### Data Scale
- 117,035 transcriber-pair-words for tonal elements
- 110,584 for break indices
- 10,754 observations per tonal element type (after excluding obligatory 4s for breaks: 10,220)

## Key Results

### Tonal Elements (Pitch Accents, Phrase Accents, Boundary Tones)

**Presence/absence agreement:**
- 80.6% agreement on whether a pitch accent is present on a word
- Of agreements that an accent IS present: 64.1% exact category agreement
- When relaxing downstep distinction: 76.1% agreement that accent present, 72.4% overall

**Pitch accent exact label agreement:**
- 68.3% overall agreement on pitch-accent labeling (both mark same accent or both mark none)
- Largest source of disagreement: downstep diacritic (33.5% of disagreements)
- Relaxing downstep: agreement rises to ~76%

**Phrase accent agreement:**
- 85.0% overall (85.3% relaxing downstep)
- 89.8% on whether a phrase accent should be placed
- Of agreements that one is present, 74.5% agree on which one (72.9% relaxing downstep -- i.e., most confusion is H- vs !H-)

**Boundary tones:**
- 90.9% overall agreement
- 93.4% on presence/absence
- Of agreements on presence: 78.8% agree on which one

**Pooled tonal elements:**
- **81.4% overall agreement** (82.9% relaxing downstep)
- **88.0% on presence/absence** of an element (relaxing downstep: 76.0% -- note this is the headline number cited in abstract)
- When both agree an element should be placed: **69.1% agree on which type** (76.0% relaxing downstep)

### Break Indices

- 66.6% exact agreement on break index value
- 70.4% relaxing "p" and "-" diacritics
- **Within +/- 1 level: 74.6% agreement** (standard break index consistency criterion)
- **Near-agreement rate: 92.5%** (close mismatches not counted)

### Consistency Across Transcribers (Table 3)

Per-transcriber agreeability (averaged agreement with all other 25):
- Tone tier: 78-86% (mean ~83%)
- Break index: 89-94% (mean ~93%)

Relatively small variation among transcribers, indicating training materials are sufficient for building competence.

## Comparison With Other Systems

- Lancaster/IBM corpus with 2 transcribers for "stress" labels (roughly corresponding to ToBI tone tier): 72% agreement (cited in [8], [9])
- Reyelt [10]: 10 pairs of German transcriptions, 66-79% for presence/absence of "phrase accent" (roughly = ToBI break index 3 or 4), 32-44% for "secondary accent"
- Eisen [11]: 3 transcribers, ~50% complete agreement on narrow phonetic categories of voiced plosives
- ToBI results are comparable to or better than segmental transcription reliability (50% for narrow categories, 85% for broad)

## Relevance to Klatt Synthesizer

**Moderate relevance.** This paper validates ToBI as a reliable prosodic annotation framework, which matters for any TTS system using ToBI-style prosodic markup:

1. **Break indices map to duration/pause rules**: Break index 3 = intermediate phrase boundary, 4 = full intonational phrase boundary. These directly drive pre-boundary lengthening and pause insertion rules in the TTS frontend.

2. **Pitch accent inventory defines F0 target patterns**: The 5 accent types (H*, L*, L+H*, L*+H, H+!H*) each map to different F0 contour shapes that the prosody rules must generate.

3. **Reliability bounds set expectations**: 81% exact agreement on tonal labels means any ToBI-driven prosody system inherently has ~19% ambiguity in its input labels. Rules should be robust to this level of variation.

4. **Downstep is the weakest distinction**: 33.5% of tonal disagreements involve the downstep diacritic (!). This suggests that downstep implementation in F0 rules can be approximate without noticeable quality loss.

5. **Break index 2 is problematic**: The split definition (strong disjuncture without tone marks OR weak disjuncture at a tonal boundary) makes BI=2 the least reliable break index. Duration rules should treat BI=2 conservatively.

## Collection Cross-References

### Already in Collection

- `Silverman_1992_ToBILabelingProsody` — Silverman et al. 1992 is the original ToBI standard definition that this paper evaluates
- `Beckman_2005_ToBISystemEvolution` — Beckman & Hirschberg 1994 ToBI annotation conventions manuscript is cited; Beckman 2005 provides the evolved system

### Cited By (in Collection)

- `Breen_InPress_ToBIRaPReliability` — Cites Pitrelli et al. 1994 as the primary prior reliability study for ToBI
- `Ladd_2021_TroubleWithToBI` — References Pitrelli et al. for inter-transcriber reliability data
- `Jun_2005_ProsodicTypology` — Cites for ToBI reliability validation
- `Beckman_2005_ToBISystemEvolution` — References as key reliability study
- `Ladd_2008_IntonationalPhonology` — Cites for ToBI reliability evidence

### New Leads (Not Yet in Collection)

- Beckman, M. E., & Ayers, G. (1994). Guidelines for ToBI labelling, version 2.0. Manuscript, Ohio State University. — The actual ToBI specification document

### Conceptual Links (not citation-based)

- `Wightman_1992_SegmentalDurationsProsodic` — Both use the break index system; Pitrelli validates its labeling reliability, Wightman demonstrates its acoustic correlates in duration
- `Price_1991_ProsodySyntacticDisambiguation` — Price et al. introduced the 7-level break index precursor that ToBI later adopted; Pitrelli validates the reliability of the resulting system
