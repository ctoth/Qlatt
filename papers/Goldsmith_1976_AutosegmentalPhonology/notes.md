---
title: "Autosegmental Phonology"
authors: "John A. Goldsmith"
year: 1976
venue: "PhD Dissertation, Massachusetts Institute of Technology, Department of Foreign Literatures and Linguistics"
doi_url: "http://www.ai.mit.edu/projects/dm/theses/goldsmith76.pdf"
thesis_supervisor: "Morris Halle"
---

# Autosegmental Phonology

## One-Sentence Summary
This dissertation introduces the autosegmental framework where phonological representations consist of multiple parallel tiers of segments connected by association lines, with a Well-formedness Condition governing how tones (or other features) map onto tone-bearing units -- providing the theoretical foundation for all modern tone association systems.

## Problem Addressed
Standard generative phonology (as in Chomsky & Halle 1968, *The Sound Pattern of English*) assumes phonological representations are linear sequences of segments, each a bundle of features. This creates five fundamental problems:

1. **Contour tones on short vowels**: A single segment cannot be both +High and -High pitch, yet short vowels bear rising/falling tones
2. **Tonal stability**: When a tone-bearing vowel is deleted, its tone persists on neighboring segments -- impossible if tone is a feature of the deleted segment
3. **Melody levels**: Certain feature subsequences (e.g., pitch patterns) form linguistically significant "melodies" that operate independently of the segmental string
4. **Floating tones**: Some tones exist without being associated with any segment, attaching later in the derivation
5. **Automatic spreading**: Features spread bidirectionally over unspecified segments in ways that standard rules cannot capture without ad hoc global conditions

## Key Contributions

### 1. Multi-tiered Phonological Representation
Phonological representations are not single strings of segments but rather consist of **multiple parallel tiers** (levels), each containing a linearly ordered sequence of segments. The key tiers are:
- **Segmental/syllabic tier**: The familiar consonant and vowel segments
- **Tonal tier**: Sequences of tonal specifications (H, L, M, etc.)
- **Nasality tier**: Oral/Nasal specifications (demonstrated for Guarani)

### 2. Association Lines
Tiers are connected by **association lines** -- formal links between elements on different tiers. These are not features of segments but rather represent the temporal alignment between tiers.

### 3. The Well-formedness Condition (WFC)
The central formal constraint of the theory (p.51):

**(WFC)** The projection functions pi_i and their inverses pi_i^{-1} **preserve connectedness**.

In practical terms, this means:
- Association lines **must not cross** (the "no-crossing constraint")
- Every tone-bearing unit must be associated with at least one tone
- Every tone must be associated with at least one tone-bearing unit
- If a set of consecutive elements on one tier maps to elements on another tier, those mapped-to elements must also be consecutive

The WFC is illustrated by the contrast between:
- Well-formed: a b (c d e) f -- where c,d,e are circled as a connected subset mapping to a connected subset on the other tier
- Ill-formed: a (b) c (d e) f -- where b and d,e are circled but not connected on the source tier

### 4. The "Orchestral Score" Metaphor
Goldsmith compares the phonological representation to a musical score where different instruments (articulators: lips, tongue, velum, larynx) have their own lines of notation that are coordinated but operate semi-independently. The "Absolute Slicing Hypothesis" -- that the score can be perfectly sliced into vertical columns (segments) -- fails for pitch in English and tone in tone languages.

### 5. Melodic Association Rules
Chapter Three (the most directly relevant for implementation) establishes two types of melodic association procedures:

**Accentual systems** (e.g., English, Japanese):
- Tonal melody associates via an abstract marker ("star") on the syllabic tier
- The starred tone on the tonal tier aligns with the starred syllable
- Remaining tones spread via the WFC
- Provides a natural account of English intonation contours

**Non-accentual systems** (e.g., Igbo, Mende, Tiv, Etung, Ganda):
- Tone melody is mapped left-to-right, one-to-one, onto syllables
- Excess tones associate to the last syllable (many-to-one)
- Excess syllables receive the last tone via spreading (one-to-many)
- No star/accent mechanism needed

### 6. Downstep
The tonal phenomenon of "downstep" (lowered pitch after a floating Low tone) is analyzed as a consequence of having a Low tone on the tonal tier that has been dissociated from its original vowel (which was deleted) but still affects the pitch of subsequent syllables. In Igbo: H !H (downstepped High) arises from underlying H L H where the L's vowel is deleted but the L tone remains as a "floating tone."

## Formal Notation

### Autosegmental Representation
Two tiers connected by vertical association lines:
```
Syllabic tier:  V  V  V  V
                |  |  / \
Tonal tier:     H  L  H  L
```

Conventions:
- **Vertical lines** (|): one-to-one association
- **Branching lines** (/ \): one-to-many (spreading) or many-to-one (contour)
- **Star (*)**: marks the "designated terminal element" in accentual systems
- **Floating tone**: a tone on the tonal tier with no association line to any syllable

### Left-to-Right Association Algorithm (Non-accentual)
Given a syllable string S1 S2 ... Sn and a tone melody T1 T2 ... Tm:

1. Associate T1 with S1, T2 with S2, ..., one-to-one, left-to-right
2. If m < n (more syllables than tones): the last tone Tm spreads rightward to cover Sm+1 ... Sn
3. If m > n (more tones than syllables): the last syllable Sn receives all remaining tones Tn ... Tm (creating a contour tone)
4. The WFC ensures no crossing of association lines

### Accentual Association (Star Convention)
1. Match starred tone T* with starred syllable S*
2. Associate remaining tones left-to-right from that anchor point
3. Apply WFC to spread unassociated tones

## Languages Analyzed

### Igbo (Chapter 2, detailed)
- Two level tones: H and L
- Downstep mechanism via floating tones
- Tonal assimilation rules
- Verb conjugation paradigms showing tone melody independence from segmental string

### Mende (Chapter 1)
- Tonal melodies: H, L, HL, LH, LHL
- Left-to-right mapping: melody spreads across 1, 2, or 3 syllables
- Demonstrates that tone patterns are independent of syllable count

### Tiv (Chapter 1)
- Two-tone system with downstep
- Verb paradigms showing tone melody applied across variable syllable counts

### English (Chapter 3)
- Accentual system: H*L melody for falling intonation
- Star aligns with primary stress syllable
- Pre-stress syllables receive L, post-stress syllables receive spreading L
- Disjunctive questions show H L H*L melody

### Ganda/Luganda (Chapter 3)
- Non-accentual Bantu tone system
- Complex morphological tone patterns
- Demonstrates melody association across multi-morpheme words

### Etung (Chapter 3)
- System analyzed by Edmundson and Bendor-Samuel
- Contour tones on final syllables of short words
- Decomposed into sequences of level tones via autosegmental analysis

## Implementation Notes

### For TTS Tone Association
The left-to-right association algorithm is directly implementable:

```
function associateTones(syllables[], tones[]):
    // Step 1: One-to-one left-to-right
    for i = 0 to min(len(syllables), len(tones)) - 1:
        associate(syllables[i], tones[i])

    // Step 2: Handle mismatch
    if len(tones) < len(syllables):
        // Spread last tone rightward
        for i = len(tones) to len(syllables) - 1:
            associate(syllables[i], tones[len(tones) - 1])

    elif len(tones) > len(syllables):
        // Stack remaining tones on last syllable (contour)
        for i = len(syllables) to len(tones) - 1:
            associate(syllables[len(syllables) - 1], tones[i])
```

### For English Intonation (Accentual)
1. Identify the starred syllable (primary stress)
2. Assign the starred tone to that syllable
3. Map pre-accent tones leftward from the star
4. Map post-accent tones rightward from the star
5. Apply the WFC for spreading

### Key Implementation Constraint: No-Crossing
The no-crossing constraint means that association must preserve linear order. If tone T_i is associated with syllable S_j, and tone T_k (where k > i) is associated with syllable S_l, then l must be >= j.

### Floating Tones and Downstep
Floating tones (tones with no associated syllable) affect pitch computation:
- A floating L between two H tones produces downstep: H !H
- The implementation must track unassociated tones and apply their effects to the F0 contour

## Figures of Interest
- **p.6, diagram (i)**: First illustration of multi-tiered syllable structure with C V segments associated to syllable nodes
- **p.7, diagram (iii)**: Three-tier representation (segments, syllables, tones) with association lines
- **p.29, (2)**: "Orchestral Score" for 'pin' showing lips, tongue, velum as separate tracks
- **p.33, (5)**: Full autosegmental representation of 'pin' with feature bundles and tone tier
- **p.51, (26-27)**: Connectedness examples for the WFC
- **p.91, (85)**: Guarani nasalization spreading diagram
- **p.195, (1-2)**: Star convention for accentual association
- **p.197, (3-4)**: English 'archipelago' and 'magazine' intonation contours with F0 sketches

## Testable Properties
- Association lines must never cross (the no-crossing constraint)
- Every tone-bearing unit in a well-formed representation must be associated with at least one tone
- Every tone must be associated with at least one tone-bearing unit (unless it is a floating tone at a specific derivational stage)
- Left-to-right mapping must be monotonic: if tone_i maps to syllable_j, then tone_{i+1} maps to syllable >= j
- Spreading produces level tone: if one tone spreads over N syllables, all N syllables have identical pitch
- Contour tones only appear when multiple tones associate with one syllable: the number of pitch changes within a syllable equals (number of associated tones - 1)

## Limitations
- The theory as presented is primarily concerned with tone; extension to other features (nasality, ATR harmony) is sketched but not fully developed
- The interaction between tonal rules and segmental rules is not fully formalized
- The "autosegmental index" (Chapter 4) -- the question of what determines which features get their own tier -- is acknowledged as speculative
- No computational implementation or algorithm complexity analysis is provided
- The English intonation analysis is preliminary compared to the detailed Igbo and Mende analyses

## Relevance to Project
This dissertation provides the **theoretical foundation** for implementing tone association in the Qlatt TTS system. Specifically:

1. **The association algorithm** (left-to-right, one-to-one, with spreading) is directly implementable for mapping tonal melodies onto syllable sequences
2. **The Well-formedness Condition** provides the constraint that the implementation must enforce (no crossing, full association)
3. **The accentual vs. non-accentual distinction** maps directly to the difference between English (stress-accent based intonation with ToBI pitch accents) and tone languages
4. **The floating tone / downstep mechanism** informs how to handle F0 lowering effects in the prosodic pipeline
5. **The multi-tier architecture** validates our approach of keeping tonal information on a separate tier from segmental information

## Open Questions
- [ ] How does the WFC interact with prosodic phrase boundaries?
- [ ] What is the precise relationship between Goldsmith's star convention and the later ToBI pitch accent system (Pierrehumbert 1980)?
- [ ] How should floating tones be represented in the data structures of a TTS system?
- [ ] Does the left-to-right association algorithm need modification for English intonation, or is it only relevant for tone languages?

## Related Work Worth Reading
- Leben, William. 1973. *Suprasegmental Phonology*. MIT PhD dissertation. (The precursor that Goldsmith builds upon)
- Haraguchi, Shosuke. 1975. *The Tone Pattern of Japanese: An Autosegmental Theory of Tonology*. MIT PhD dissertation.
- Liberman, Mark. 1975. *The Intonational System of English*. MIT PhD dissertation. (Parallel work on English intonation)
- Clements, G.N. 1976. "Vowel Harmony in Non-linear Generative Phonology (I)". Harvard University. (Extension to vowel harmony)
- Chomsky, Noam and Morris Halle. 1968. *The Sound Pattern of English*. (The standard theory that autosegmental phonology revises)

## Collection Cross-References

### Already in Collection
- [[Pierrehumbert_1980_EnglishIntonation]] -- builds on Goldsmith's accentual analysis; the ToBI system is the modern descendant of Goldsmith's star convention
- [[Ladd_2008_IntonationalPhonology]] -- comprehensive modern treatment of the AM (Autosegmental-Metrical) framework that Goldsmith initiated
- [[Beckman_2022_ToBISystem]] -- the ToBI annotation system directly derives from autosegmental theory
- [[Hombert_1979_PhoneticToneDevelopment]] -- discusses tonal phenomena that autosegmental theory addresses

### New Leads (Not Yet in Collection)
- Leben, William. 1973. *Suprasegmental Phonology* -- the direct precursor to autosegmental phonology
- Haraguchi, Shosuke. 1975. *The Tone Pattern of Japanese* -- Japanese autosegmental tonology
- Liberman, Mark. 1975. *The Intonational System of English* -- parallel work on English prosody
- Clements, G.N. 1976. "Vowel Harmony in Non-linear Generative Phonology" -- extending autosegmental theory to vowel harmony

### Cited By (in Collection)
- [[Beckman_2005_ToBISystemEvolution]] — ToBI's Tones tier is a direct implementation of Goldsmith's autosegmental representation; multi-tier architecture is the practical realization of autosegmental phonology for prosody annotation
- [[Hertz_1991_StreamsPhonesTransitions]] — cites this as inspiration for the multi-tiered parallel stream structure of the Delta framework; Hertz's synchronized streams are a practical implementation of autosegmental multi-tier representation

### Supersedes or Recontextualizes
- This is the **foundational text** of autosegmental phonology; Pierrehumbert (1980) and Ladd (2008) build directly on it
- The AM (Autosegmental-Metrical) framework in our ToBI and intonation papers is a direct descendant of this work
