# Beckman & Edwards 1990 — Implementation Notes

## Reference
Beckman, M. E. & Edwards, J. (1990). Lengthenings and shortenings and the nature of prosodic constituency. In J. Kingston & M. E. Beckman (Eds.), *Papers in Laboratory Phonology I: Between the Grammar and Physics of Speech* (pp. 152–178). Cambridge University Press. DOI: 10.1017/CBO9780511627736.009

## Core Contribution
Experimental separation of two durational effects often confounded in the literature:
1. **Phrase-final lengthening** (pre-boundary lengthening): lengthening near prosodic constituent edges
2. **Stress-timed shortening** (polysyllabic shortening / compression): shortening of syllables in polysyllabic words to maintain isochronous inter-stress intervals

The paper argues these two effects imply fundamentally different prosodic constituency models and presents three experiments to differentiate them.

## Prosodic Hierarchy Model
The authors adopt a four-level metrical grid representation (not a tree) of prosodic structure:

| Grid Level | Label | Property |
|---|---|---|
| 4 (top) | Nuclear accent / boundary tone | Intonational phrase edge, marked by boundary tone (L%) |
| 3 | Accent | Pitch accent association (H*) |
| 2 | Stress | Stressed syllable (longer, louder, unreduced vowel) |
| 1 (bottom) | Syllable | Local sonority peak |

Key insight: Final lengthening implies a constituent with well-defined edges (bracketing in the grid). Stress-timed shortening implies a timing unit defined by intervals between beats, not necessarily with clear edges.

## Experiment 1: Intonational Phrasing and Final Lengthening

### Design
- Target words: *pop* vs. *poppa* (monosyllable vs. bisyllable with identical initial [pa])
- Sentence frames created obligatory vs. optional intonational phrase breaks after target word
- 5 speakers, 3 self-selected speaking rates, 5 tokens each
- Measured: segment durations in first 3 syllables of target sequences

### Key Findings
- **Large, consistent phrase-final lengthening** at intonational phrase boundaries (all 5 subjects, all rates)
- Phrase-final [a] in *pop* ~50-100 ms longer than non-phrase-final [a]
- Phrase-final schwa in *poppa* similarly lengthened
- **Smaller word-final lengthening** also present even without intonational phrase boundary
- The word-final effect is much smaller and less consistent across speakers/rates than phrase-final

### Duration Data (from figures, approximate means at normal rate)
- Phrase-final [a] in *poppa posing*: ~200-250 ms
- Non-phrase-final [a] in *pop opposing*: ~150-175 ms
- Phrase-final lengthening ratio: roughly 1.3-1.5x

## Experiment 2: Word-Final Lengthening and Accentual Phrase

### Design
- Same *pop opposed* / *poppa posed* contrast
- Three accent placements: postnuclear, prenuclear unaccented, nuclear
- 6 subjects, 3 rates, 10 tokens each

### Key Findings
- **Word-final lengthening occurs in ALL accent positions** (postnuclear, prenuclear, nuclear)
- This rules out the accentual phrase as the domain of word-final lengthening
- The word-final effect is not limited to boundary marking of any accent-delimited constituent
- Word-final lengthening appears to mark the edge of a phonological constituent independent of accents

## Experiment 3: Stress Foot vs. Phonological Word

### Design
- Target phrases: *superstition* vs. *super station* vs. *Sioux perspective*
- Same stress foot structure (x x / x x) but different word boundaries
- Three accent placements with different intonation contours
- 6 subjects, 3 rates

### Key Findings
- **Two subject groups emerged:**
  - 2 subjects (JSC, KDG): Word-final lengthening at edges of actual lexical items, independent of accent (supports "phonological word" interpretation)
  - 4 subjects (JRE, LAW, BDM, EXE): Lengthening dependent on accent placement, similar between *superstition* and *super station* (supports "accentual phrase" interpretation)
- Results suggest **individual variation** in the domain of word-final lengthening

## Key Conclusions for Implementation

### Prosodic Boundary Hierarchy for Duration
Two distinct final-lengthening effects must be modeled separately:

1. **Intonational phrase-final lengthening**
   - Domain: syllables immediately preceding intonational phrase boundary (L%, H%)
   - Magnitude: large (30-50% increase, rate-independent presence)
   - Consistency: highly consistent across speakers and rates
   - Implementation: multiply duration of pre-boundary segments

2. **Word-final lengthening**
   - Domain: edges of phonological words (lexical items)
   - Magnitude: smaller (~10-20% increase)
   - Consistency: less consistent, speaker-dependent
   - Implementation: optional or smaller multiplier at word boundaries

### What This Paper Does NOT Provide
- No specific multiplicative factors or equations for lengthening
- No formant or spectral data
- No F0 measurements (purely durational study)
- No model of how lengthening distributes across segments within the final syllable

### Relationship to Stress-Timed Shortening
The paper carefully argues that polysyllabic shortening (stressed syllable in *poppa* shorter than in *pop*) is a separate effect from final lengthening. For synthesis:
- Polysyllabic shortening should be modeled as compression within the stress foot
- Final lengthening should be modeled as boundary-adjacent expansion
- The two effects are additive/independent

## Relevance to Qlatt
- Directly relevant to duration rules in the prosody and duration phases
- Supports the current Qlatt approach of having separate boundary-lengthening rules at different prosodic levels
- Confirms that intonational phrase boundaries produce the largest lengthening effect
- Suggests word-boundary lengthening should be a separate, smaller rule
- Related to Wightman et al. (1992) which provides quantitative boundary-lengthening data across the full ToBI break index hierarchy
- Related to Edwards et al. (1988) on articulatory timing at prosodic boundaries
