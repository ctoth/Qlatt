# Price et al. 1991 — The Use of Prosody in Syntactic Disambiguation

## Reference
Price, P. J., Ostendorf, M., Shattuck-Hufnagel, S., & Fong, C. (1991). The use of prosody in syntactic disambiguation. *Journal of the Acoustical Society of America*, 90(6), 2956-2970.

## Key Findings for Implementation

### Seven Types of Structural Ambiguity Tested
35 pairs of phonetically similar sentences representing seven categories:
1. **Parenthetical main-main vs nonparenthetical main-subordinate** — e.g., "Mary leaves on Tuesday. She will have no problem in Europe" vs embedded sentence
2. **Apposition vs attached NP (or PP)** — NP apposition vs NP/PP attachment
3. **Main-main vs main-subordinate clauses** — coordinating conjunction vs subordinate
4. **Tags vs attached phrase** — tag questions at end vs attached noun phrases
5. **Far vs near attachment of final phrase** — final adverbial/PP attached high vs low
6. **Left vs right attachment of middle phrase** — prepositional phrase ambiguity
7. **Particles vs prepositions** — particle reading vs prepositional reading

### Prosodic Break Index System (Precursor to ToBI)
Seven levels of prosodic break between words (0-6):
- **0** — boundary within a clitic group
- **1** — normal word boundary
- **2** — boundary marking a minor grouping of words
- **3** — intermediate phrase boundary
- **4** — intonational phrase boundary (major prosodic boundary)
- **5** — boundary marking a grouping of intonational phrases (with breath intake or long pause)
- **6** — sentence boundary

Break indices of 4, 5, and 6 are "major" prosodic boundaries. Constituents defined by these boundaries are "intonation phrases."

### Boundary Tone Labels
Adapted from Pierrehumbert (1980):
- **LL%** — final fall
- **HL%** — continuation fall (nonfinal fall)
- **LH%** — continuation rise
- **HH%** — question rise

### Prominence Labels
- **P1** — major phrasal prominence
- **P0** — minor (P0) prominence
- **C** — contrastive stress (rare, ~1% of total words)
- **s** — syllables with no prominence
- Unmarked — no prominence label

### Key Disambiguation Results (Table I)

| Type of ambiguity | Overall % correct | Overall % confident |
|---|---|---|
| (1) Parenthetical | 86 | 63 |
| (2) Apposition | 92 | 70 |
| (3) Main-main vs Main-subordinate | 71 | 37 |
| (4) Tags | 88 | 57 |
| (5) Far/near attachment | 71 | 23 |
| (6) Left/right attachment | 95 | 68 |
| (7) Particle/preposition | 82 | 45 |
| **Average** | **84** | **52** |

### Prosodic Cues That Distinguish Syntactic Structures

#### Duration (Normalized)
- Normalized duration formula: **d_hat = (d - mu_alpha) / sigma_alpha**
  - d = actual segment duration
  - mu_alpha = mean duration for that phone label
  - sigma_alpha = standard deviation for that phone label
  - Lexically stressed and unstressed vowels modeled as separate phones
- Longer normalized durations observed for phones:
  - Preceding major phrase boundaries
  - Bearing major prominences (P1, C)
- Duration lengthening at phrase-final position is the primary boundary cue
- Statistically significant lengthening at 4 break index levels (Wightman et al., 1992)

#### Pause
- Pauses associated with major prosodic boundaries (break index 4+)
- 48/212 (23%) of boundaries marked with 4 had pauses
- 17/25 (67%) of boundaries marked with 5 had pauses
- Pause duration: 19.2 +/- 10.4 ms for break index 4; 24.6 +/- 15.6 ms for break index 5
- Sentence-final pauses always present (end of paragraph)

#### Intonation
- Boundary tones at break indices 4, 5, and 6
- Sentence-final tones are typically final falls (LL%) or question rises (HH%)
- Level 5 boundary tones are usually perceived as incomplete falls
- Intonational phrase (4) boundary tones are most often continuation rises, occasionally partial falls
- Tags sometimes associated with sentence-final question rise

#### Prominence
- Not consistently associated with specific syntactic structures
- Differs from boundary phenomena — prominence associated more with semantics/focus than syntax
- Exception: presence on particles vs absence on prepositions observed in some cases

### Automatic Detection Results
- HMM-based speech recognition system (SRI Decipher) using phonological rules
- Prosodic break detection: 2/3 of segment boundaries coincided or were off by less than 10 ms
- Compared to hand labels: 95% were less than 50 ms off
- Phone duration was normalized according to speaker- and phone-dependent means (mu_a) and variances (sigma_a^2)

### Relationship Between Syntax and Prosody
Key hypotheses supported:
1. **(a)** Different types of word strings with two competing syntactic structures differ in the degree to which they *can* be disambiguated by prosodic cues
2. **(b)** Clause boundaries (boundaries of phrases containing both subject and predicate) very often coincide with major prosodic constituent boundaries (marked by syllable-final lengthening, pause, and boundary tone)
3. **(c)** Other syntactic constituents may be associated with any of several different levels of prosodic boundaries — speakers have more choice in phrasing, and prosodic boundaries need not correlate perfectly with syntactic ones

### Disambiguation by Structural Type
- **Clause boundaries** (types 1, 2, 4): Most reliably disambiguated. Location and relative size of prosodic break is the primary cue.
- **Main-subordinate** (type 3): Less reliably disambiguated. Conjunction constructions preferred over deleted subordinate conjunction.
- **Attachment ambiguities** (types 5, 6, 7): Mixed results. Far attachment somewhat better than near attachment. Left/right attachment very well disambiguated.
- **"Neutral" prosody**: Some utterances had prosodic patterns appropriate for either interpretation — prosodic breaks at equal-size syntactic boundaries.

## Relevance to Klatt Synthesizer
- The break index system directly informs how to map syntactic structure to prosodic phrasing in TTS
- Duration normalization formula is useful for comparing durations across different phonetic contexts
- Clause boundaries should produce large prosodic breaks (lengthening + pause + boundary tone)
- Within-clause syntactic boundaries should produce smaller but still measurable prosodic breaks
- Prominence placement is more semantic than syntactic — focus-driven rather than structure-driven
- The finding that some structures cannot be reliably disambiguated by prosody alone suggests a "neutral prosody" mode may be appropriate for ambiguous structures
