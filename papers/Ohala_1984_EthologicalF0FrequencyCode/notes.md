# Implementation Notes: Ohala 1984 — Frequency Code

## Core Concept: The Frequency Code

The "frequency code" is a biologically grounded association:
- **High acoustic frequency** (high F0, high formants) -> primary meaning: "small vocalizer" -> secondary meanings: subordinate, submissive, non-threatening, desirous of goodwill, questioning, uncertain
- **Low acoustic frequency** (low F0, low formants) -> primary meaning: "large vocalizer" -> secondary meanings: dominant, aggressive, threatening, assertive, confident, declarative

This is not a learned convention but an innate biological principle: larger bodies produce lower-frequency sounds due to longer vocal folds and longer vocal tracts.

## Thread 1: F0 and Sentence Type (Questions vs. Statements)

Cross-language tendency: questions use high and/or rising F0; statements use low and/or falling F0 (Bolinger 1964; Cruttenden 1981).

### Experimental Evidence (Ohala's own experiment)
- 4 samples of spontaneous speech (2 male, 3 female speakers of American English)
- Digitally processed to retain original amplitude and F0 contour but remove segmental detail
- Each sample either upshifted or downshifted in F0 by a factor of 1.25
- Listeners judged which voice in each pair sounded "more dominant, more self-confident"
- **Result**: Lower F0 sample judged "more dominant" in 92% of judgments (Fig. 1)
- Higher F0 sample (even with steep terminal fall) judged as sounding more dominant only 7% of time
- **Key finding**: The sharp terminal fall in F0 is less important than overall F0 level in conveying dominance

### Implementation Relevance
- For question intonation: raise overall F0 level, not just terminal rise
- For assertive/declarative speech: use lower F0 range
- The frequency code operates on *average F0 level* across the utterance, not just contour shape

## Thread 2: Affective Use of F0

General agreement that F0 signals affect, intention, attitude, emotion cross-culturally.

Nonlinguistic messages conveyed by F0:
- **High F0 and/or rising F0**: deference, politeness, submission, lack of confidence
- **Low F0 and/or falling F0**: assertiveness, authority, aggression, confidence, threat

These are signals under voluntary control. Morton (1977) documented a frequency code across species.

## Thread 3: Sound Symbolism

Cross-language tendency in "sound symbolic" vocabulary:
- Words denoting SMALL use high-frequency segments (front vowels, voiceless consonants)
- Words denoting LARGE use low-frequency segments (back vowels, voiced consonants)

### Table I: Sound Symbolic Examples (from paper)
| Concept | 'Small' / high F | 'Large' / low F |
|---------|------------------|-----------------|
| English | small, wee, teeny | big, large |
| Bislama/Tok Pisin | liklik ('small') | bikpela ('big') |
| Yoruba | kere ('be small') | tobi ('be big') |
| Japanese | ko 'ni, 'chi | oo, 'dai' |

### Table II: Sound Symbolic Vowel Patterns
Words denoting SMALL/high frequency tend to use front vowels with higher F2.
Words denoting LARGE tend to use back vowels with lower formants.

The frequency code applies to both F0 and formant frequencies -- the principle is about *overall acoustic frequency*, not just pitch.

## Thread 4: F0 in Nonhuman Vocalizations

Morton (1977) documented a "motivation-structural" correlation across species:
- Close-range aggressive signals: low-frequency, harsh
- Appeasement/friendly signals: high-frequency, tonal

## Thread 5: Facial Expressions and the Frequency Code

**Critical acoustic insight** (Fig. 4 in paper):
- Mouth corner retraction (as in a smile) effectively shortens the vocal tract
- This raises resonance (formant) frequencies toward those of a shorter resonator
- A 14 cm tract retracted to simulate smile -> resonances shift upward toward 10 cm tract pattern

### Vocal Tract Length and Formant Relationships
- Uniform tube 14 cm: resonances at lower frequencies
- Same tube with mouth corner retraction (4 cm constriction at lips): resonances shift upward
- Uniform tube 10 cm: resonances at higher frequencies (similar to retracted 14 cm)

**Implication**: The smile's acoustic effect is to raise formant frequencies, conveying "smallness" in the frequency code. The visual smile may have evolved from this acoustic gesture.

Mouth corner retraction can reduce effective vocal tract length and raise formants by ~40% or more (demonstrated with Plexiglas model).

## Thread 6: Consonants and Vowels

Sound-meaning correlations in consonant/vowel choice for size-related vocabulary:
- SMALL words: high-frequency segments (front vowels /i/, voiceless fricatives, palatals)
- LARGE words: low-frequency segments (back vowels /a, o, u/, voiced stops, velars)

The pattern extends beyond F0 to the full spectral envelope.

## Thread 7: Sexual Dimorphism of the Vocal Anatomy

- Male larynx is approximately 50% larger than adult female's in anterior-posterior dimension
- Male vocal tract (sella-nasion to hyoid) ~15% longer than female's (Fig. 6, from Goldstein 1980)
- Palatal width shows sexual dimorphism beginning at puberty (Fig. 6a)
- Sella-nasion to hyoid distance diverges around age 10-12 (Fig. 6b)
- Male F0 drops at puberty; males have lower formant frequencies

**Frequency code interpretation**: Males evolved larger vocal apparatus to convey dominance/threat through lower acoustic frequencies, paralleling cross-species patterns (lion's mane, bison's hump, etc.).

## Table III: Summary of Frequency Code (from paper)

| Meaning | Signal Shape |
|---------|-------------|
| **To appear large** (threat, dominance, self-sufficiency) | |
| - Acoustic, nonplastic: low F0, low resonances (long vocal tract) |
| - Acoustic, plastic (linguistic): intonation low/falling F0 for statements; sound symbolism LARGE conveyed by low F1, low vowels with low F0 |
| - Visual, nonplastic: bison's hump, lion's mane, facial hair |
| - Visual, plastic: piloerection, extension of ears/tail, arching back, top hats, epaulets |
| **To appear small** (nonthreat, submission, appeasement, goodwill) | |
| - Acoustic, nonplastic: high F0, high resonances (short vocal tract) |
| - Acoustic, plastic (linguistic): intonation high/rising F0 for questions; sound symbolism SMALL conveyed by high F1, high vowels |
| - Visual, nonplastic: infant mimicry |
| - Visual, plastic: cowering, retraction of ears/tail |

## Key Implementation Parameters for Klatt Synthesizer

### F0 Range for Speaker Types / Attitudes
The frequency code predicts these F0 relationships:
- **Dominant/authoritative**: lower base F0, narrower F0 range, lower F0 peaks
- **Submissive/polite/friendly**: higher base F0, wider F0 range, higher F0 peaks
- **Questions**: raise overall F0 level (not just terminal contour), increase F0 range
- **Statements**: lower F0, use falling terminal contour

### Formant Implications
- Smile voice: raise F1-F3 slightly (simulate shortened vocal tract from mouth corner retraction)
- Threatening voice: lower formants if possible (simulate elongated vocal tract)
- The ~40% formant shift from full mouth corner retraction is the extreme; typical speech gestures would be much smaller

### Cross-Modal Consistency
When synthesizing affect, F0 and formant changes should be *consistent* with the frequency code:
- Friendly/polite: raise both F0 and formants
- Aggressive/dominant: lower both F0 and formants
- Inconsistent cues (high F0 with low formants) would sound unnatural

## Limitations for Synthesis
- Paper is primarily theoretical/ethological, not a synthesis parameter study
- No specific Hz values or percentage changes for F0 manipulation are prescribed
- The vocal tract length manipulation for smile is demonstrated acoustically but not parameterized for a formant synthesizer
- The experiment used natural speech manipulation, not synthesis

## Collection Cross-References

### Already in Collection

(No papers directly cited by Ohala 1984 are in the collection.)

### Cited By (in Collection)

- `Belyk_2014_AcousticValenceEmotion` — Cites Ohala 1984 for the frequency code framework
- `Liu_2011_FemaleVoiceAttractiveness` — References Ohala for F0 and body size perception
- `Xu_2013_VocalAttractivenessBodySizeProjection` — Cites for frequency code and body size projection
- `Fitch_1999_VocalTractMorphology` — References for size-frequency relationship
- `Winter_2012_KoreanSpeechRegisters` — Cites for frequency code in politeness registers
- `Babel_2014_VocalAttractiveness` — References for frequency code theory
- `Caballero_2018_SoundOfImpoliteness` — Cites for F0 and politeness/dominance mapping
- `XuLee_VocalAttractivenessMandarinListeners` — References for frequency code
- `Trott_2022_ProsodyIndirectRequests` — Cites for frequency code in indirect speech

### New Leads (Not Yet in Collection)

- Morton, E. W. (1977). "On the occurrence and significance of motivation-structural rules in some bird and mammal sounds." Am. Nat. 111, 855-869. — Foundational cross-species frequency code
- Bolinger, D. (1964). "Intonation as a universal." — Intonation universals across languages

### Conceptual Links (not citation-based)

- `Ladd_1985_IndependentFunctionIntonation` — Both address how F0 range signals affect/attitude; Ohala provides the biological explanation (frequency code), Ladd et al. show the independence and continuous nature of the F0 range effect
- `Belin_2017_SoundOfTrustworthiness` — Both relate F0 contours to social perception; Ohala's frequency code predicts that high F0 signals submission/friendliness, Belin's trustworthiness contour data provides specific F0 shapes
