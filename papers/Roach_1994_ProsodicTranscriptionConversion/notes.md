---
title: "Conversion between Prosodic Transcription Systems: \"Standard British\" and ToBI"
authors: "Peter Roach"
year: 1994
venue: "Speech Communication 15 (1994) 91-99"
doi_url: "0167-6393(94)00022-0"
---

# Conversion between Prosodic Transcription Systems: "Standard British" and ToBI

## One-Sentence Summary
Provides explicit mapping tables for converting between British tonetic stress marks (SEC system) and ToBI pitch accents/boundary tones, with discussion of where the two systems are incommensurable.

## Problem Addressed
The Spoken English Corpus (SEC) uses a British intonation transcription system that is incompatible with ToBI, the emerging standard for machine-readable prosodic annotation; automatic conversion between the two would make the SEC accessible to ToBI-based research and tools.

## Key Contributions
- Complete mapping tables (Tables 2 and 3) converting SEC tonetic stress marks to ToBI pitch accents, phrase accents, and boundary tones for both final and non-final positions
- Identification of the non-final fall-rise as a fundamental gap: the SEC allows fall-rise on non-accented syllables mid-phrase, but ToBI has no combination of pitch accent + boundary tone that can represent this without inserting a phrase boundary
- Perceptual experiment showing final fall-rises have significantly higher perceived boundary strength (mean 2.72) than non-final fall-rises (mean 1.94), p < 0.001
- Working program that performs SEC-to-ToBI conversion (output shown in Fig. 1)

## Methodology
1. Developed rule-based mappings from SEC tonetic stress marks to ToBI labels
2. Implemented conversion as a simple program
3. Ran perceptual experiment: 30 native speakers rated boundary strength (1-5 scale) for 15 final and 15 non-final fall-rise examples from the SEC

## Key Equations
None (this is a transcription-system comparison paper, not a quantitative modeling paper).

## Parameters

### SEC Tonetic Stress Marks (Table 1)

| Code | ASCII | Name |
|------|-------|------|
| -- | -- | Low level |
| #163 | ~ | High level |
| #166 | < | Step-down |
| #165 | > | Step-up |
| #162 | /' | (High) rise-fall |
| #161 | '/ | High fall-rise |
| #172 | / | High rise |
| #174 | \ | High fall |
| #171 | , | Low rise |
| #173 | ' | Low fall |
| #246 | ,\ | Low rise-fall (not used) |
| #247 | \, | Low fall-rise |
| #248/9 | o | Stressed but unaccented |

### Final TSM to ToBI Mapping (Table 2)

| Tone name | Pitch accent | Phrase accent | Boundary tone |
|-----------|-------------|---------------|---------------|
| Low level | L* | L- | L% |
| High level | H* | H- | L% |
| (High) rise-fall | L* + H | L- | L% |
| High fall-rise | H* | !H- | H% |
| High fall | H* | L- | L% |
| Low fall | !H* | L- | L% |
| High rise | H* | H- | H% |
| Low rise | L* | L- | H% |
| Low fall-rise | !H* | L- | H% |

### Non-Final Kinetic TSM to ToBI Mapping (Table 3)

| Tone description | Pitch accent | Phrase accent |
|-----------------|-------------|---------------|
| (High) rise-fall | L* + H | L- |
| High fall-rise | (?) | (?) |
| High fall | H* | L- |
| Low fall | !H* | L- |
| High rise | !H* | H- |
| Low rise | L* | H- |
| Low fall-rise | (?) | (?) |

## Implementation Details

### SEC Transcription System
- No explicit division into pre-head/head/nucleus/tail
- Every accented syllable gets a tonetic stress mark (TSM) indicating pitch movement
- All tonal choices available at any accented syllable (no syntax restricting sequences)
- Boundaries: single bar | (minor) or double bar || (major, implies noticeable pause)
- Step-up (>) and step-down (<) mark pitch changes on unstressed syllables
- Circle (o) marks stressed-but-unaccented syllables

### ToBI System Key Features
- Multi-tiered: tones tier + break indices tier + orthographic tier
- Pitch accents: H*, L*, L*+H, L+H*, H+!H* (asterisk links to orthographic tier)
- Boundary tones: H% or L% (full phrase boundary); H- or L- (intermediate phrase)
- Full boundary combinations: L-L% (low ending), L-H% (continuation rise), H-H% (high-rising), H-L% (falling)
- Break indices: 0 (no separation) through 4 (full intonation phrase boundary); level 5 proposed but not standard

### Conversion Algorithm Decisions
- Both SEC boundaries (| and ||) mapped to break index >= 4 (not 3)
- Intermediate phrase boundaries placed after each completed kinetic (non-level) tone
- Level tones provisionally excluded from pitch-accent + phrase-accent analysis
- Up-arrow and down-arrow treated as diacritics (no direct ToBI equivalent for up-step)
- High level ends with L% because ToBI H* H- H% would imply final rising

### Non-Final Fall-Rise Problem
- SEC allows fall-rise mid-phrase without boundary; ToBI cannot represent this
- H*+L (Pierrehumbert's downstep-signaling tone) was removed from ToBI but could solve this
- 120+ examples found in SEC corpus
- Perceptual experiment: listeners do perceive weaker boundary at non-final fall-rises (1.94 vs 2.72, p < 0.001)

## Figures of Interest
- **Fig. 1 (page 7):** Full output of SEC-to-ToBI conversion program on a passage ("your Royal Highness and Chancellor...")
- **Fig. 2 (page 7):** F0 track of sentence with non-final fall-rise on "German" ("Many German families continued to live in Huttenheim"), showing no obvious pause between "families" and "continued"

## Results Summary
- Automatic conversion is feasible for most SEC tone marks
- Main remaining problem: break index assignment and non-final fall-rises
- Perceptual boundary strength experiment confirms non-final fall-rises produce weaker but real boundary percepts (mean 1.94 vs 2.72, p < 0.001, repeated-measures ANOVA)
- 25 ToBI workshop transcribers placed full boundary (level 4) after "Many German families" — suggesting ToBI users insert a boundary where SEC transcribers did not

## Limitations
- Conversion is "rough equivalence" — the two systems do not encode the same information
- SEC has ~10 nuclear tones vs ~5 ToBI pitch accents; many-to-few mapping loses distinctions
- Break index assignment is the weakest part of automatic conversion
- Perceptual experiment is small and uncontrolled (diverse natural speech material)
- Non-native speaker data (20 subjects) not yet analyzed
- No systematic validation comparing machine-converted ToBI with expert human ToBI transcription

## Testable Properties
- Every SEC tonetic stress mark in Tables 2/3 must map to exactly one ToBI pitch accent + boundary tone combination (deterministic mapping)
- Non-final fall-rises should produce lower perceptual boundary strength ratings than final fall-rises
- A converted ToBI transcription should have break index >= 4 at every SEC | and || boundary
- Intermediate phrase boundaries should appear after every kinetic (non-level) tone

## Relevance to Project
This paper provides the concrete mapping tables needed if Qlatt's prosody system needs to interoperate between British-style tone marks and ToBI labels. The SEC tonetic stress mark inventory and its ToBI equivalents could inform rule-based prosodic annotation, particularly for handling British English intonation patterns. The discussion of intermediate phrase boundary placement (after kinetic tones) is directly relevant to break-index assignment in the prosodic annotator.

## Open Questions
- [ ] Would H*+L pitch accent (Pierrehumbert's original, removed from ToBI) solve the non-final fall-rise mapping cleanly?
- [ ] How should break index 3 vs 4 vs 5 be assigned from SEC | vs || boundaries?
- [ ] Are the SEC "high" vs "low" tone distinctions recoverable from F0 data, or are they transcriber artifacts?

## Related Work Worth Reading
- Pierrehumbert (1980) — foundational ToBI theory, already in collection
- Silverman et al. (1992) — ToBI standard definition
- De Pijper and Sanderman (1993) — perceptual boundary strength methodology
- 't Hart, Collier and Cohen (1990) — IPO intonation system, alternative to both British and ToBI
- Crystal (1969) — foundational British intonation transcription

## Collection Cross-References

### Already in Collection
- [[Pierrehumbert_1980_EnglishIntonation]] — cited as the foundational phonological model underlying ToBI; the H*+L tone removed from ToBI is discussed as a potential solution for non-final fall-rises
- [[Silverman_1992_ToBILabelingProsody]] — cited as the ToBI standard definition paper; Roach's mapping tables convert SEC tones into the pitch accent and boundary tone inventory defined here
- [[Ladd_2008_IntonationalPhonology]] — not directly cited (published after this paper), but provides the definitive AM theory exposition that contextualizes both the British and ToBI traditions discussed here

### New Leads (Not Yet in Collection)
- De Pijper and Sanderman (1993) — "Prosodic cues to the perception of constituent boundaries" — perceptual boundary strength methodology that Roach's experiment follows; relevant for validating break-index assignment
- 't Hart, Collier and Cohen (1990) — *A Perceptual Study of Intonation* — IPO intonation system; an alternative perceptual approach that might inform F0 contour generation differently from both British and ToBI traditions
- Crystal (1969) — *Prosodic Systems and Intonation in English* — foundational British intonation transcription system; source of up-arrow/down-arrow conventions

### Cited By (in Collection)
- (none found)
